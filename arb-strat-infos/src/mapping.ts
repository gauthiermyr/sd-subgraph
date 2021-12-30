import {
  RewardAdded as RewardAddedEvent,
} from "../generated/DarkParadise/DarkParadise"
import {
  RewardAdded as RewardAddedEventV2,
} from "../generated/DarkParadiseV2/DarkParadiseV2"
import {
  RewardAdded,
} from "../generated/schema"

// export function handleDurationChange(event: DurationChangeEvent): void {
//   let entity = new DurationChange(
//     event.transaction.hash.toHex() + "-" + event.logIndex.toString()
//   )
//   entity.newDuration = event.params.newDuration
//   entity.oldDuration = event.params.oldDuration
//   entity.save()
// }

// export function handleNFTSet(event: NFTSetEvent): void {
//   let entity = new NFTSet(
//     event.transaction.hash.toHex() + "-" + event.logIndex.toString()
//   )
//   entity.newNFT = event.params.newNFT
//   entity.save()
// }

// export function handleOwnerChanged(event: OwnerChangedEvent): void {
//   let entity = new OwnerChanged(
//     event.transaction.hash.toHex() + "-" + event.logIndex.toString()
//   )
//   entity.oldOwner = event.params.oldOwner
//   entity.newOwner = event.params.newOwner
//   entity.save()
// }

// export function handleOwnerNominated(event: OwnerNominatedEvent): void {
//   let entity = new OwnerNominated(
//     event.transaction.hash.toHex() + "-" + event.logIndex.toString()
//   )
//   entity.newOwner = event.params.newOwner
//   entity.save()
// }

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

// export function handleRewardPaid(event: RewardPaidEvent): void {
//   let entity = new RewardPaid(
//     event.transaction.hash.toHex() + "-" + event.logIndex.toString()
//   )
//   entity.user = event.params.user
//   entity.reward = event.params.reward
//   entity.save()
// }

// export function handleStaked(event: StakedEvent): void {
//   let entity = new Staked(
//     event.transaction.hash.toHex() + "-" + event.logIndex.toString()
//   )
//   entity.user = event.params.user
//   entity.amount = event.params.amount
//   entity.save()
// }

// export function handleWithdrawn(event: WithdrawnEvent): void {
//   let entity = new Withdrawn(
//     event.transaction.hash.toHex() + "-" + event.logIndex.toString()
//   )
//   entity.user = event.params.user
//   entity.amount = event.params.amount
//   entity.save()
// }
