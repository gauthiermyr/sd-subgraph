import { MintAndSellOTokenCall, Action, ClosePositionCall } from "../generated/AirSwapbtc/Action"
import { OToken } from "../generated/AirSwapbtc/OToken"
import { MarginCalculator } from "../generated/AirSwapbtc/MarginCalculator"
import { ChainLink as Oracle } from "../generated/AirSwapbtc/ChainLink"
import { APY, Option } from "../generated/schema"
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Vault } from '../generated/AirSwapbtc/Vault'
import { CurvePool } from '../generated/AirSwapbtc/CurvePool'

const ChainLinkAddress = '0xf4030086522a5beea4988f8ca5b36dbc97bee88c';
const VaultAddress = '0x24129b935aff071c4f0554882c0d9573f4975fed';
const PoolAddress = '0x93054188d876f558f4a66b2ef1d97d16edf0895b';
const ActionAdress = '0x81e1c690b39053a96ee6f85f638ddf56effc2b62';
const CalculatorAddress = '0xfaa67e3736572645b38af7410b3e1006708e13f4';


export function handleMintAndSellOTokenCall(call: MintAndSellOTokenCall): void {
	// const oracle = Oracle.bind(Address.fromString(ChainLinkAddress));
	// const underlyingPrice = oracle.latestAnswer().times(BigInt.fromString('10').pow(10));

	const vault = Vault.bind(Address.fromString(VaultAddress));
	const pool = CurvePool.bind(Address.fromString(PoolAddress));
	const action = Action.bind(Address.fromString(ActionAdress));
	const oTokenAddress = action.otoken();
	const oToken = OToken.bind(oTokenAddress);

	const strike = oToken.strikePrice();
	const expiry = oToken.expiryTimestamp();

	const pps = vault.getPricePerFullShare();
	const vp = pool.get_virtual_price();

	let entity = Option.load(oTokenAddress.toHexString());

	if(entity) {

		entity.contractAmount = call.inputs._otokenAmount.plus(entity.contractAmount);
		entity.premiumAmount = call.inputs._order.signer.amount.plus(entity.premiumAmount);
		entity.contractEquivalent = entity.contractEquivalent.plus(call.inputs._otokenAmount.times(pps).times(vp).div(BigInt.fromI64(10).pow(36)));

		entity.premium = entity.premiumAmount.toBigDecimal().div(entity.contractEquivalent.toBigDecimal());

		entity.txs = `${entity.txs};${call.transaction.hash.toHexString()}`;
		entity.save();
	}
	else {
		let entity = new Option(oTokenAddress.toHexString());
		entity.isCurrent = true;
		entity.expiry = expiry;
		entity.strike = strike;
		entity.option = 1;
		entity.contractAmount = call.inputs._otokenAmount;
		entity.premiumAmount = call.inputs._order.signer.amount;
		entity.contractEquivalent = call.inputs._otokenAmount.times(pps).times(vp).div(BigInt.fromI64(10).pow(36));
		entity.txs = call.transaction.hash.toHexString();
		entity.premium = entity.premiumAmount.toBigDecimal().div(entity.contractEquivalent.toBigDecimal());
		entity.harvest = BigDecimal.fromString("0");
		entity.settlement = BigDecimal.fromString("0");

		entity.save();
	}

	//create APY object at first mint
	let apy = APY.load("1");
	if(!apy) {
		let apy = new APY("1");
		apy.harvestAPY = BigDecimal.fromString('0');
		apy.perfAPY = BigDecimal.fromString('0');
		apy.perfCumulative = BigDecimal.fromString('0');
		apy.harvestCumulative = BigDecimal.fromString('0');

		apy.startTimestamp = call.block.timestamp;
		apy.lastPricePerShare = pps.toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal());
		apy.save();
	}
}


export function handleClosePositionCall(call: ClosePositionCall): void {
	const action = Action.bind(Address.fromString(ActionAdress));
	const oTokenAddress = action.otoken();
	const calculator = MarginCalculator.bind(Address.fromString(CalculatorAddress));
	const vault = Vault.bind(Address.fromString(VaultAddress));
	const pps = vault.getPricePerFullShare();

	let entity = Option.load(oTokenAddress.toHexString());
	if(entity) {
		entity.isCurrent = false;
		entity.settlement = calculator.getExpiredPayoutRate(oTokenAddress).toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal());


		let apy = APY.load("1");
		if (apy) {
			const newPricePerShare = pps.toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal());
			entity.harvest = (newPricePerShare.minus(apy.lastPricePerShare)).div(apy.lastPricePerShare);

			apy.perfCumulative = apy.perfCumulative.plus(entity.premium).minus(entity.settlement);
			apy.harvestCumulative = apy.harvestCumulative.plus(entity.harvest);

			const pastWeeks = Math.round(Math.abs(parseInt(call.block.timestamp.toString()) - parseInt(apy.startTimestamp.toString())) / (60 * 60 * 24 * 7))
			
			const perfCum = parseFloat(apy.perfCumulative.toString());
			const perfAPY = (1 + perfCum / pastWeeks) ** 52 - 1;
			apy.perfAPY = BigDecimal.fromString(perfAPY.toString());

			const harvestCum = parseFloat(apy.harvestCumulative.toString());
			const harvestAPY = (1 + harvestCum / pastWeeks) ** 52 - 1;
			apy.harvestAPY = BigDecimal.fromString(harvestAPY.toString());

			apy.lastPricePerShare = newPricePerShare;
			apy.save();
		}

		entity.save();
	}
}