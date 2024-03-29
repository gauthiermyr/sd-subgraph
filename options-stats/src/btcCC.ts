import { MintAndSellOTokenCall } from "../generated/AirSwapBtcCC/AirSwap"
import { MintAndSellOToken as MintAndSellOTokenEvent } from "../generated/AirSwapBtcCC/AirSwap"
import { ChainLink as Oracle } from "../generated/AirSwapBtcCC/ChainLink"
import { MintEvent, CloseEvent } from "../generated/schema"
import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts'
import { VaultSettled as VaultSettledEvent } from '../generated/Payout/Payout';
import { Vault } from '../generated/AirSwapBtcCC/Vault'
import { CurvePool } from '../generated/AirSwapBtcCC/CurvePool'

const ChainLinkAddress = '0xf4030086522a5beea4988f8ca5b36dbc97bee88c';
const VaultAddress = '0x24129b935aff071c4f0554882c0d9573f4975fed';
const PoolAddress = '0x93054188d876f558f4a66b2ef1d97d16edf0895b';

enum Options {
	ethCC,
	btcCC,
	fraxRetail,
}

export function handleMintAndSellOTokenCall(call: MintAndSellOTokenCall): void {
	const oracle = Oracle.bind(Address.fromString(ChainLinkAddress));
	const underlyingPrice = oracle.latestAnswer().times(BigInt.fromString('10').pow(10));

	const vault = Vault.bind(Address.fromString(VaultAddress));
	const pool = CurvePool.bind(Address.fromString(PoolAddress));

	let entity = MintEvent.load(call.transaction.hash.toHexString());

	if(entity) {
		const pps = vault.getPricePerFullShare();
		const vp = pool.get_virtual_price();

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
	
	entity.option = Options.btcCC;
	entity.premiumSdToken = event.params.premium;
	entity.timestamp = event.block.timestamp;

	entity.save();
}

export function handleVaultSettled(event: VaultSettledEvent): void {
	if(event.params.to.toHexString().toLowerCase() != '0x81e1c690b39053a96ee6f85f638ddf56effc2b62'.toLowerCase()){
		return;
	}

	// const vault = sdFRAX3CRV_f_Vault.bind(Address.fromString(sdFRAX3CRV_f_VaultAddress));
	let entity = new CloseEvent(event.transaction.hash.toHexString());
	entity.timestamp = event.block.timestamp;
	entity.option = Options.btcCC;
	entity.sdTokenSentAmount = event.params.payout;
	// entity.sdTokenPricePerShare = vault.getPricePerFullShare();
	entity.sdTokenPricePerShare = BigInt.fromI64(1);

	entity.save();
}
