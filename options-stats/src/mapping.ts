import { MintAndSellOTokenCall } from "../generated/EthPutAirSwap/EthPutAirSwap"
import { ChainLink_USDC as Oracle } from "../generated/EthPutAirSwap/ChainLink_USDC"
import { Event } from "../generated/schema"
import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts'

const ChainLinkAddress = '0x8fffffd4afb6115b954bd326cbe7b4ba576818f6';

export function handleMintAndSellOTokenCall(call: MintAndSellOTokenCall): void {
	const oracle = Oracle.bind(Address.fromString(ChainLinkAddress));
	const USDCPrice = oracle.latestAnswer().times(BigInt.fromString('10').pow(10));

	let entity = new Event(call.transaction.hash.toHexString());
	entity.type = "Sold";
	entity.option = 3;

	entity.premiumUnderlyingToken = call.inputs._order.signer.amount;
	entity.timestamp = call.block.timestamp;
	entity.oTokenAmount = call.inputs._order.sender.amount;
	entity.collateralAmount = call.inputs._collateralAmount;
	// entity.settlement = call.inputs._otokenAmount;
	entity.underlyingAssetPrice = USDCPrice;

	entity.save();
}