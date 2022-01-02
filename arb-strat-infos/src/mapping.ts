import { RewardAdded as RewardAddedEvent } from "../generated/DarkParadise/DarkParadise"
import { RewardAdded as RewardAddedEventV2 } from "../generated/DarkParadiseV2/DarkParadiseV2"
import { StartedUsingNFT, StartedUsingNFT as StartedUsingNFTEvent } from "../generated/StakeDaoNFT_V2/StakeDaoNFT_V2"
import { EndedUsingNFT as EndedUsingNFTEvent } from "../generated/StakeDaoNFT_V2/StakeDaoNFT_V2"
import { Vault, Transfer as VaultTransferEvent, Transfer } from "../generated/Vault/Vault"
import { RewardAdded, NFT } from "../generated/schema"
import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts'

const sdFRAX3CRV_fAddress = '0x5af15da84a4a6edf2d9fa6720de921e1026e37b7';
const DarkParadiseV2Address = '0x20d1b558ef44a6e23d9bf4bf8db1653626e642c3';

export function handleRewardAdded(event: RewardAddedEvent): void {
	const vault = Vault.bind(Address.fromString(sdFRAX3CRV_fAddress));
	const pricePerShare = vault.getPricePerFullShare();
	const amount = event.params.rewardTransferAmount;
	let entity = new RewardAdded(event.transaction.hash.toHex());
	entity.amount = amount;
	entity.timestamp = event.block.timestamp;
	entity.relatedPricePerShare = pricePerShare;
	entity.amountUSD = amount.times(pricePerShare).div(BigInt.fromString('10').pow(18));
	entity.save();
}

export function handleRewardAddedV2(event: RewardAddedEventV2): void {
	const vault = Vault.bind(Address.fromString(sdFRAX3CRV_fAddress));
	const pricePerShare = vault.getPricePerFullShare();
	let entity = new RewardAdded(event.transaction.hash.toHex());
	entity.amount = event.params.rewardTransferAmount;
	entity.timestamp = event.block.timestamp;
	entity.relatedPricePerShare = pricePerShare;
	entity.save();
}


export function handleStartedUsingNFT(event: StartedUsingNFT): void {
	if(event.params.strategy.toHexString().toLowerCase() != DarkParadiseV2Address){
		return;
	}

	let nft = NFT.load(event.params.id.toString());
	if(!nft){
		let entity = new NFT(event.params.id.toString());
		entity.strategy = event.params.strategy;
		entity.owner = event.params.account;
		entity.save();
	}
}

export function handleEndedUsingNFT(event: EndedUsingNFTEvent): void {
	if(event.params.strategy.toHexString().toLowerCase() != DarkParadiseV2Address){
		return;
	}

	let nft = NFT.load(event.params.id.toString());
	if(!nft){
		return;
	}

	store.remove('NFT', nft.id);
}

export function vaultTransfer(event: VaultTransferEvent): void {
	return;	
}

