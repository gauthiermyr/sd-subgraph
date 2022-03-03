import { MintAndSellOTokenCall } from "../generated/AirSwapUniCC/AirSwap"
import { MintAndSellOToken as MintAndSellOTokenEvent } from "../generated/AirSwapUniCC/AirSwap"
import { ChainLink as Oracle } from "../generated/AirSwapUniCC/ChainLink"
import { MintEvent, CloseEvent } from "../generated/schema"
import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts'
import { VaultSettled as VaultSettledEvent } from '../generated/Payout/Payout';

const ChainLinkAddress = '0x553303d460ee0afb37edff9be42922d8ff63220e';

enum Options {
	ethCC,
	btcCC,
	fraxRetail,
	aave,
	uni,
	link,
}

export function handleMintAndSellOTokenCall(call: MintAndSellOTokenCall): void {
	const oracle = Oracle.bind(Address.fromString(ChainLinkAddress));
	const underlyingPrice = oracle.latestAnswer().times(BigInt.fromString('10').pow(10));

	let entity = MintEvent.load(call.transaction.hash.toHexString());

	if(entity) {

		entity.premiumUnderlyingToken = call.inputs._order.signer.amount;
		entity.oTokenAmount = call.inputs._otokenAmount;
		entity.collateralAmount = call.inputs._collateralAmount;
		entity.underlyingAssetPrice = underlyingPrice;
		entity.sdTokenPricePerShare = BigInt.fromI64(1);

		entity.save();
	}
}

export function handleMintAndSellOTokenEvent(event: MintAndSellOTokenEvent): void {
	let entity = new MintEvent(event.transaction.hash.toHexString());
	
	entity.option = Options.uni;
	entity.premiumSdToken = event.params.premium;
	entity.timestamp = event.block.timestamp;

	entity.save();
}

export function handleVaultSettled(event: VaultSettledEvent): void {
	if(event.params.to.toHexString().toLowerCase() != '0xE2aA6276FABB74A70d6859117039C317eeaC85Fa'.toLowerCase()){
		return;
	}

	let entity = new CloseEvent(event.transaction.hash.toHexString());
	entity.timestamp = event.block.timestamp;
	entity.option = Options.uni;
	entity.sdTokenSentAmount = event.params.payout;
	entity.sdTokenPricePerShare = BigInt.fromI64(1);

	entity.save();
}
