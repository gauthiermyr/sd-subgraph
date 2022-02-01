import { MintAndSellOTokenCall } from "../generated/AirSwapEthCC/AirSwap"
import { MintAndSellOToken as MintAndSellOTokenEvent } from "../generated/AirSwapEthCC/AirSwap"
import { ChainLink as Oracle } from "../generated/AirSwapEthCC/ChainLink"
import { MintEvent, CloseEvent } from "../generated/schema"
import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts'
import { VaultSettled as VaultSettledEvent } from '../generated/Payout/Payout';

const ChainLinkAddress = '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419';
// const sdFRAX3CRV_f_VaultAddress= '0xa2761B0539374EB7AF2155f76eb09864af075250';

enum Options {
	ethCC,
	btcCC,
	fraxRetail,
}

export function handleMintAndSellOTokenCall(call: MintAndSellOTokenCall): void {
	const oracle = Oracle.bind(Address.fromString(ChainLinkAddress));
	const underlyingPrice = oracle.latestAnswer().times(BigInt.fromString('10').pow(10));

	// const vault = sdFRAX3CRV_f_Vault.bind(Address.fromString(sdFRAX3CRV_f_VaultAddress));

	let entity = MintEvent.load(call.transaction.hash.toHexString());

	if(entity) {
		entity.premiumUnderlyingToken = call.inputs._order.signer.amount;
		entity.oTokenAmount = call.inputs._otokenAmount;
		entity.collateralAmount = call.inputs._collateralAmount;
		entity.underlyingAssetPrice = underlyingPrice;
		// entity.sdTokenPricePerShare = vault.getPricePerFullShare();

		entity.save();
	}
}

export function handleMintAndSellOTokenEvent(event: MintAndSellOTokenEvent): void {
	let entity = new MintEvent(event.transaction.hash.toHexString());
	
	entity.option = Options.ethCC;
	entity.premiumSdToken = event.params.premium;
	entity.timestamp = event.block.timestamp;

	entity.save();
}

export function handleVaultSettled(event: VaultSettledEvent): void {
	if(event.params.to.toHexString().toLowerCase() != '0xd41509B051200222DF4713DfeF3Cbe53d0105BC4'.toLowerCase()){
		return;
	}

	// const vault = sdFRAX3CRV_f_Vault.bind(Address.fromString(sdFRAX3CRV_f_VaultAddress));
	let entity = new CloseEvent(event.transaction.hash.toHexString());
	entity.timestamp = event.block.timestamp;
	entity.option = Options.ethCC;
	entity.sdTokenSentAmount = event.params.payout;
	// entity.sdTokenPricePerShare = vault.getPricePerFullShare();

	entity.save();
}
