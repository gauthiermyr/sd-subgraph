import { RewardAdded as RewardAddedEvent } from "../generated/DarkParadise/DarkParadise"
import { RewardAdded as RewardAddedEventV2 } from "../generated/DarkParadiseV2/DarkParadiseV2"
import { StartedUsingNFT, StartedUsingNFT as StartedUsingNFTEvent } from "../generated/StakeDaoNFT_V2/StakeDaoNFT_V2"
import { EndedUsingNFT as EndedUsingNFTEvent } from "../generated/StakeDaoNFT_V2/StakeDaoNFT_V2"
import { RewardAdded, NFT } from "../generated/schema"
import { Address, store } from '@graphprotocol/graph-ts'


export function handleRewardAdded(event: RewardAddedEvent): void {
  let entity = new RewardAdded(event.transaction.hash.toHex());
  entity.amount = event.params.rewardTransferAmount;
  entity.timestamp = event.block.timestamp;
  entity.save();
}

export function handleRewardAddedV2(event: RewardAddedEventV2): void {
  let entity = new RewardAdded(event.transaction.hash.toHex());
  entity.amount = event.params.rewardTransferAmount;
  entity.timestamp = event.block.timestamp;
  entity.save();
}

const DarkParadiseV2Address = '0x20d1b558ef44a6e23d9bf4bf8db1653626e642c3';

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