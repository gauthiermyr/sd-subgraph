import { MintAndSellOTokenCall, Action, ClosePositionCall } from "../generated/AirSwapEthPut/Action"
import { OToken } from "../generated/AirSwapEthPut/OToken"
import { Controller } from "../generated/AirSwapEthPut/Controller"
import { ChainLink as Oracle } from "../generated/AirSwapEthPut/ChainLink"
import { APY, Option } from "../generated/schema"
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Vault } from '../generated/AirSwapEthPut/Vault'
import { CurvePool } from '../generated/AirSwapEthPut/CurvePool'

const ChainLinkAddress = '0xf4030086522a5beea4988f8ca5b36dbc97bee88c';
const VaultAddress = '0x5af15da84a4a6edf2d9fa6720de921e1026e37b7';
const PoolAddress = '0xd632f22692fac7611d2aa1c0d552930d43caed3b';
const ActionAdress = '0xFb87C273F9bA099A22139E9deFE0f3183e9a3c9f';
const ControllerAddress = '0x4ccc2339f87f6c59c6893e1a678c2266ca58dc72';


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
		entity.contractEquivalent = entity.contractEquivalent.plus(call.inputs._collateralAmount.times(pps).times(vp).div(BigInt.fromI64(10).pow(36)));

		entity.premium = entity.premiumAmount.toBigDecimal().div(entity.contractEquivalent.toBigDecimal()).times(BigInt.fromI64(10).pow(12).toBigDecimal());

		entity.txs = `${entity.txs};${call.transaction.hash.toHexString()}`;
		entity.save();
	}
	else {
		let entity = new Option(oTokenAddress.toHexString());
		entity.isCurrent = true;
		entity.expiry = expiry;
		entity.strike = strike;
		entity.option = 'fraxRetail';
		entity.contractAmount = call.inputs._otokenAmount;
		entity.premiumAmount = call.inputs._order.signer.amount;
		entity.contractEquivalent = call.inputs._collateralAmount.times(pps).times(vp).div(BigInt.fromI64(10).pow(36));
		entity.txs = call.transaction.hash.toHexString();
		entity.premium = entity.premiumAmount.toBigDecimal().div(entity.contractEquivalent.toBigDecimal()).times(BigInt.fromI64(10).pow(12).toBigDecimal());
		entity.harvest = BigDecimal.fromString("0");
		entity.settlement = BigDecimal.fromString("0");
		entity.settlementAmount = BigInt.fromString("0");

		entity.save();
	}

	//create APY object at first mint
	let apy = APY.load('fraxRetail');
	if(!apy) {
		let apy = new APY('fraxRetail');
		apy.harvestAPY = BigDecimal.fromString('0');
		apy.perfAPY = BigDecimal.fromString('0');
		apy.perfCumulative = BigDecimal.fromString('0');
		apy.harvestCumulative = BigDecimal.fromString('0');

		apy.startTimestamp = call.block.timestamp;
		apy.lastPricePerShare = pps.toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal())
								.times(vp.toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal()));
		apy.save();
	}
}


export function handleClosePositionCall(call: ClosePositionCall): void {
	const action = Action.bind(Address.fromString(ActionAdress));
	const oTokenAddress = action.otoken();
	const controller = Controller.bind(Address.fromString(ControllerAddress));
	const vault = Vault.bind(Address.fromString(VaultAddress));
	const pps = vault.getPricePerFullShare();
	const pool = CurvePool.bind(Address.fromString(PoolAddress));
	const vp = pool.get_virtual_price();

	let entity = Option.load(oTokenAddress.toHexString());
	if(entity) {
		entity.isCurrent = false;
		// entity.settlement = calculator.getExpiredPayoutRate(oTokenAddress).toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal());

		const payout = controller.getPayout(oTokenAddress, entity.contractAmount).times(pps).times(vp).div(BigInt.fromI64(10).pow(36));
		entity.settlement = payout.divDecimal(entity.contractEquivalent.toBigDecimal());
		entity.settlementAmount = payout;

		let apy = APY.load('fraxRetail');
		if (apy) {
			const newPricePerShare = pps.toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal())
									.times(vp.toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal()));
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