import { MintAndSellOTokenCall, Action, ClosePositionCall } from "../generated/AirSwapEthCall/Action"
import { OToken } from "../generated/AirSwapEthCall/OToken"
import { MarginCalculator } from "../generated/AirSwapEthCall/MarginCalculator"
import { ChainLink as Oracle } from "../generated/AirSwapEthCall/ChainLink"
import { APY, Event, Option } from "../generated/schema"
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Controller } from "../generated/AirSwapEthCall/Controller"
import { RegisterDepositETHCall, RegisterDepositCall, ClaimSharesCall, OpynPerpVaultEth, Deposit, Withdraw, RegisterWithdrawCall, WithdrawFromQueueCall } from '../generated/OpynPerpVaultEth/OpynPerpVaultEth'
import { Register } from '../generated/schema';

const ChainLinkAddress = '';
const ActionAdress = '0x7946b98660c04A19475148C25c6D3Bb3Bf7417E2';
const CalculatorAddress = '0xfaa67e3736572645b38af7410b3e1006708e13f4';
const ControllerAddress = '0x4ccc2339f87f6c59c6893e1a678c2266ca58dc72';


export function handleMintAndSellOTokenCall(call: MintAndSellOTokenCall): void {
	// const oracle = Oracle.bind(Address.fromString(ChainLinkAddress));
	// const underlyingPrice = oracle.latestAnswer().times(BigInt.fromString('10').pow(10));

	const action = Action.bind(Address.fromString(ActionAdress));
	const oTokenAddress = action.otoken();
	const oToken = OToken.bind(oTokenAddress);

	const strike = oToken.strikePrice();
	const expiry = oToken.expiryTimestamp();

	let entity = Option.load(oTokenAddress.toHexString());

	if(entity) {

		entity.contractAmount = call.inputs._otokenAmount.plus(entity.contractAmount);
		entity.premiumAmount = call.inputs._order.signer.amount.plus(entity.premiumAmount);
		entity.contractEquivalent = entity.contractAmount.times(BigInt.fromI64(10).pow(10));

		entity.premium = entity.premiumAmount.toBigDecimal().div(entity.contractEquivalent.toBigDecimal());

		entity.txs = `${entity.txs};${call.transaction.hash.toHexString()}`;
		entity.save();
	}
	else {
		let entity = new Option(oTokenAddress.toHexString());
		entity.isCurrent = true;
		entity.expiry = expiry;
		entity.strike = strike;
		entity.option = 0;
		entity.contractAmount = call.inputs._otokenAmount;
		entity.premiumAmount = call.inputs._order.signer.amount;
		entity.contractEquivalent = entity.contractAmount.times(BigInt.fromI64(10).pow(10));
		entity.txs = call.transaction.hash.toHexString();
		entity.premium = entity.premiumAmount.toBigDecimal().div(entity.contractEquivalent.toBigDecimal());
		entity.harvest = BigDecimal.fromString("0");
		entity.settlement = BigDecimal.fromString("0");

		entity.save();
	}

	//create APY object at first mint
	let apy = APY.load("0");
	if(!apy) {
		let apy = new APY("0");
		apy.harvestAPY = BigDecimal.fromString('0');
		apy.perfAPY = BigDecimal.fromString('0');
		apy.perfCumulative = BigDecimal.fromString('0');
		apy.harvestCumulative = BigDecimal.fromString('0');

		apy.startTimestamp = call.block.timestamp;
		apy.lastPricePerShare = BigDecimal.fromString('1');
		apy.save();
	}
}


export function handleClosePositionCall(call: ClosePositionCall): void {
	const action = Action.bind(Address.fromString(ActionAdress));
	const oTokenAddress = action.otoken();
	const calculator = MarginCalculator.bind(Address.fromString(CalculatorAddress));
	const controller = Controller.bind(Address.fromString(ControllerAddress));

	let entity = Option.load(oTokenAddress.toHexString());
	if(entity) {
		entity.isCurrent = false;

		entity.settlement = calculator.getExpiredPayoutRate(oTokenAddress).toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal());

		const payout = controller.getPayout(oTokenAddress, entity.contractAmount);
		entity.settlementAmount = payout;

		let apy = APY.load("0");
		if (apy) {
			entity.harvest = BigDecimal.fromString('0');

			apy.perfCumulative = apy.perfCumulative.plus(entity.premium).minus(entity.settlement);

			const pastWeeks = Math.ceil(Math.abs(parseInt(call.block.timestamp.minus(apy.startTimestamp).toString())) / (60 * 60 * 24 * 7))

			const perfCum = parseFloat(apy.perfCumulative.toString());
			const perfAPY = (1 + perfCum / pastWeeks) ** 52 - 1;
			apy.perfAPY = BigDecimal.fromString(perfAPY.toString());

			apy.save();
		}

		entity.save();
	}
}


export function handleRegisterETH(call: RegisterDepositETHCall): void {
	const vault = OpynPerpVaultEth.bind(Address.fromString('0xc10b7ca0383f0357edeed233dc806b5229dcf4a5'));

	const round = vault.round();
	const address = call.inputs._shareRecipient;
	const amount = call.transaction.value;

	const id = `D-${address.toHexString()}-${round}`;
	let entity = Register.load(id);

	if(entity) {
		entity.amount = entity.amount.plus(amount);
	}
	else {
		entity = new Register(id);
		entity.type = 'Deposit';
		entity.amount = amount;
		entity.account = address;
		entity.claimed = false;
		entity.round = round;
		entity.option = 0;
		entity.timestamp = call.block.timestamp;
	}

	entity.save();

	const event = new Event(`D-${call.transaction.hash.toHexString()}-${address.toHexString()}`);
	event.type = 'Deposit';
	event.tx = call.transaction.hash;
	event.amount = amount;
	event.account = address;
	event.timestamp = call.block.timestamp;
	event.option = 0;

	event.save();
}

export function handleRegister(call: RegisterDepositCall): void {
	const vault = OpynPerpVaultEth.bind(Address.fromString('0xc10b7ca0383f0357edeed233dc806b5229dcf4a5'));

	const round = vault.round();
	const address = call.inputs._shareRecipient;
	const amount = call.inputs._amount;

	const id = `D-${address.toHexString()}-${round}`;
	let entity = Register.load(id);

	if(entity) {
		entity.amount = entity.amount.plus(amount);
	}
	else {
		entity = new Register(id);
		entity.type = 'Deposit';
		entity.amount = amount;
		entity.account = address;
		entity.claimed = false;
		entity.round = round;
		entity.option = 0;
		entity.timestamp = call.block.timestamp;
	}

	entity.save();

	const event = new Event(`D-${call.transaction.hash.toHexString()}-${address.toHexString()}`);
	event.type = 'Deposit';
	event.tx = call.transaction.hash;
	event.amount = amount;
	event.account = address;
	event.timestamp = call.block.timestamp;
	event.option = 0;

	event.save();
}

export function handleRegisterWithdraw(call: RegisterWithdrawCall): void {
	const vault = OpynPerpVaultEth.bind(Address.fromString('0xc10b7ca0383f0357edeed233dc806b5229dcf4a5'));

	const round = vault.round();
	const address = call.from;
	const amount = call.inputs._shares;

	const id = `W-${address.toHexString()}-${round}`;
	let entity = Register.load(id);

	if(entity) {
		entity.amount = entity.amount.plus(amount);
	}
	else {
		entity = new Register(id);
		entity.type = 'Withdrawal';
		entity.amount = amount;
		entity.account = address;
		entity.claimed = false;
		entity.round = round;
		entity.option = 0;
		entity.timestamp = call.block.timestamp;
	}

	entity.save();

	const event = new Event(`W-${call.transaction.hash.toHexString()}-${address.toHexString()}`);
	event.type = 'Withdrawal';
	event.tx = call.transaction.hash;
	event.amount = amount;
	event.account = address;
	event.timestamp = call.block.timestamp;
	event.option = 0;

	event.save();
}

export function handleClaimShares(call: ClaimSharesCall): void {
	const address = call.transaction.from;
	const round = call.inputs._round;

	const id = `D-${address.toHexString()}-${round}`;

	let entity = Register.load(id);

	if(entity) {
		entity.claimed = true;
		entity.save();
	}
}

export function handleWithdrawFromQueue(call: WithdrawFromQueueCall): void {
	const address = call.transaction.from;
	const round = call.inputs._round;

	const id = `W-${address.toHexString()}-${round}`;

	let entity = Register.load(id);

	if(entity) {
		entity.claimed = true;
		entity.save();
	}
}

export function handleDeposit(call: Deposit): void {
	const event = new Event(`D-${call.transaction.hash.toHexString()}-${call.params.account.toHexString()}`);
	event.type = 'Deposit';
	event.tx = call.transaction.hash;
	event.amount = call.params.amountDeposited;
	event.account = call.params.account;
	event.timestamp = call.block.timestamp;
	event.option = 0;

	event.save();
}

export function handleWithdraw(call: Withdraw): void {
	const event = new Event(`W-${call.transaction.hash.toHexString()}-${call.params.account.toHexString()}`);
	event.type = 'Withdrawal';
	event.tx = call.transaction.hash;
	event.amount = call.params.amountWithdrawn;
	event.account = call.params.account;
	event.timestamp = call.block.timestamp;
	event.option = 0;

	event.save();
}