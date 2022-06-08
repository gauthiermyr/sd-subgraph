import { MintAndSellOTokenCall, Action, ClosePositionCall } from "../generated/AirSwapbtc/Action"
import { OToken } from "../generated/AirSwapbtc/OToken"
import { Controller } from "../generated/AirSwapbtc/Controller"
import { MarginCalculator } from "../generated/AirSwapbtc/MarginCalculator"
import { ChainLink as Oracle } from "../generated/AirSwapbtc/ChainLink"
import { Option } from "../generated/schema"
import { Address, BigDecimal, BigInt, Entity, ethereum, store } from '@graphprotocol/graph-ts'
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
		entity.premium = call.inputs._order.signer.amount.plus(entity.premium);
		entity.contractEquivalent = entity.contractEquivalent.plus(call.inputs._otokenAmount.times(pps).times(vp).div(BigInt.fromI64(10).pow(36)));

		entity.premiumPercent = entity.premium.toBigDecimal().div(entity.contractEquivalent.toBigDecimal());

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
		entity.premium = call.inputs._order.signer.amount;
		entity.contractEquivalent = call.inputs._otokenAmount.times(pps).times(vp).div(BigInt.fromI64(10).pow(36));
		entity.txs = call.transaction.hash.toHexString();
		entity.premiumPercent = entity.premium.toBigDecimal().div(entity.contractEquivalent.toBigDecimal());

		entity.save();
	}
}


export function handleClosePositionCall(call: ClosePositionCall): void {
	const action = Action.bind(Address.fromString(ActionAdress));
	const oTokenAddress = action.otoken();
	const oToken = OToken.bind(oTokenAddress);
	// const controllerAddress = oToken.controller();
	// const controller = Controller.bind(controllerAddress);
	const calculator = MarginCalculator.bind(Address.fromString(CalculatorAddress));

	let entity = Option.load(oTokenAddress.toHexString());
	if(entity) {
		entity.isCurrent = false;
		entity.settlement = calculator.getExpiredPayoutRate(oTokenAddress).toBigDecimal().div(BigInt.fromString('10').pow(18).toBigDecimal());
		entity.save();
	}
}