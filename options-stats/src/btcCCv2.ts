import { MintAndSellOTokenCall } from "../generated/AirSwapBtcCC/AirSwap"
import { MintAndSellOToken as MintAndSellOTokenEvent } from "../generated/AirSwapBtcCC/AirSwap"
import { ChainLink as Oracle } from "../generated/AirSwapBtcCC/ChainLink"
import { MintEvent, CloseEvent } from "../generated/schema"
import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts'
import { VaultSettled as VaultSettledEvent } from '../generated/Payout/Payout';
import { Vault } from '../generated/AirSwapBtcCC/Vault'
import { CurvePool } from '../generated/AirSwapBtcCC/CurvePool'

const ChainLinkAddress = '0xf4030086522a5beea4988f8ca5b36dbc97bee88c';

enum Options {
	ethCC,
	btcCC,
	fraxRetail,
}

export function handleMintAndSellOTokenCallV2(call: MintAndSellOTokenCall): void {
	const oracle = Oracle.bind(Address.fromString(ChainLinkAddress));
	const underlyingPrice = oracle.latestAnswer().times(BigInt.fromString('10').pow(10));

	let entity = MintEvent.load(call.transaction.hash.toHexString());

	if(entity) {

		entity.premiumUnderlyingToken = call.inputs._order.signer.amount;

		entity.oTokenAmount = call.inputs._otokenAmount;
		entity.collateralAmount = call.inputs._collateralAmount;
		entity.underlyingAssetPrice = underlyingPrice;

		entity.save();
	}
}


export function handleMintAndSellOTokenEventV2(event: MintAndSellOTokenEvent): void {
	let entity = new MintEvent(event.transaction.hash.toHexString());
	
	entity.option = Options.btcCC;
	entity.premiumSdToken = event.params.premium;
	entity.timestamp = event.block.timestamp;
	entity.sdTokenPricePerShare = BigInt.fromI64(1);

	entity.save();
}

export function handleVaultSettled(event: VaultSettledEvent): void {
	if(event.params.to.toHexString().toLowerCase() != '0xB5a187cD9140b6b0dB97F014F5c6AF5802A3098D'.toLowerCase()){
		return;
	}

	let entity = new CloseEvent(event.transaction.hash.toHexString());
	entity.timestamp = event.block.timestamp;
	entity.option = Options.btcCC;
	entity.sdTokenSentAmount = event.params.payout;
	entity.sdTokenPricePerShare = BigInt.fromI64(1);

	entity.save();
}
