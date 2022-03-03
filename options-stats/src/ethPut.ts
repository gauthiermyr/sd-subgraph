import { MintAndSellOTokenCall } from "../generated/AirSwapEthPut/AirSwap"
import { MintAndSellOToken as MintAndSellOTokenEvent } from "../generated/AirSwapEthPut/AirSwap"
import { ChainLink as Oracle } from "../generated/AirSwapEthPut/ChainLink"
import { Vault } from "../generated/AirSwapEthPut/Vault";
import { MintEvent, CloseEvent } from "../generated/schema"
import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts'
import { VaultSettled as VaultSettledEvent } from '../generated/Payout/Payout';
import { Harvested as Harvest} from "../generated/Harvest/Harvest"

const ChainLinkAddress = '0x8fffffd4afb6115b954bd326cbe7b4ba576818f6';
const sdFRAX3CRV_f_VaultAddress= '0x5af15da84a4a6edf2d9fa6720de921e1026e37b7';

enum Options {
	ethCC,
	btcCC,
	fraxRetail,
}

export function handleMintAndSellOTokenCall(call: MintAndSellOTokenCall): void {
	const oracle = Oracle.bind(Address.fromString(ChainLinkAddress));
	const USDCPrice = oracle.latestAnswer().times(BigInt.fromString('10').pow(10));

	const vault = Vault.bind(Address.fromString(sdFRAX3CRV_f_VaultAddress));

	let entity = MintEvent.load(call.transaction.hash.toHexString());

	if(entity) {
		entity.premiumUnderlyingToken = call.inputs._order.signer.amount;
		entity.oTokenAmount = call.inputs._otokenAmount;
		entity.collateralAmount = call.inputs._collateralAmount;
		entity.underlyingAssetPrice = USDCPrice;
		entity.sdTokenPricePerShare = vault.getPricePerFullShare();

		entity.save();
	}
}

export function handleMintAndSellOTokenEvent(event: MintAndSellOTokenEvent): void {
	let entity = new MintEvent(event.transaction.hash.toHexString());
	
	entity.option = Options.fraxRetail;
	entity.premiumSdToken = event.params.premium;
	entity.timestamp = event.block.timestamp;

	entity.save();
}

export function handleVaultSettled(event: VaultSettledEvent): void {
	if(event.params.to.toHexString().toLowerCase() != '0xfb87c273f9ba099a22139e9defe0f3183e9a3c9f'){
		return;
	}

	const vault = Vault.bind(Address.fromString(sdFRAX3CRV_f_VaultAddress));
	let entity = new CloseEvent(event.transaction.hash.toHexString());
	entity.timestamp = event.block.timestamp;
	entity.option = Options.fraxRetail;
	entity.sdTokenSentAmount = event.params.payout;
	entity.sdTokenPricePerShare = vault.getPricePerFullShare();

	entity.save();
}

// export function handleHarvest(event: Harvest): void {
// 	const vault = Vault.bind(Address.fromString(sdFRAX3CRV_f_VaultAddress));
// 	let entity = new HarvestEvent(event.transaction.hash.toHexString());
// 	entity.timestamp = event.block.timestamp;
// 	entity.option = Options.fraxRetail;
// 	entity.sdTokenPricePerShare = vault.getPricePerFullShare();

// 	entity.save();
// }
