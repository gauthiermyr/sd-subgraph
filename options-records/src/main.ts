import { Address } from "@graphprotocol/graph-ts";
import { CreateOtokenCall } from "../generated/OpynOtokens/Factory";
import { MintAndSellOTokenCall, CommitOTokenCall, ClosePositionCall, RolloverPositionCall } from "../generated/AirSwapEthCall/Action"
import { Event } from "../generated/schema"

const wallets = [
	'0xb36a0671b3d49587236d7833b01e79798175875f',
	'0xbd2471b4150619a42093ffba3a7af35335cec5b6',
	'0x510c0fcbd5fe56af9f5b23f7b7c4ad0bff2b5b00',
	'0x2949c8b8522b3e096deeb8865fccc17c64f20cc0',
	'0x6987a6d7efede903dfbe36337551b31b0f292a6e',
	'0x0f5caab620ac65cfa85d453786678ef685c52df4',
	'0x7f977c4cff92c055173b865bcbd8158161ab95a9',
	'0x02e4de712d99f4b1b1e12aa3675d8b0a582caa5d'
];

export function handleMintAndSellOTokenCall(call: MintAndSellOTokenCall): void {
	const event = new Event(call.transaction.hash.toHexString());
	event.from = call.transaction.from;
	if(call.transaction.to) event.to = call.transaction.to;
	else event.to = Address.empty();
	event.ts = call.block.timestamp;

	event.vault = ''
	event.type = 'Sale';
	event.save();
}


export function handleClosePositionCall(call: ClosePositionCall): void {
	const event = new Event(call.transaction.hash.toHexString());
	event.from = call.transaction.from;
	if(call.transaction.to) event.to = call.transaction.to;
	else event.to = Address.empty();
	event.ts = call.block.timestamp;

	event.vault = ''
	event.type = 'Close Position';
	event.save();
}

export function handleCommit(call: CommitOTokenCall): void {
	const event = new Event(call.transaction.hash.toHexString());
	event.from = call.transaction.from;
	if(call.transaction.to) event.to = call.transaction.to;
	else event.to = Address.empty();
	event.ts = call.block.timestamp;

	event.vault = ''
	event.type = 'Commit oToken';
	event.save();
}

export function handleRollOver(call: RolloverPositionCall): void {
	const event = new Event(call.transaction.hash.toHexString());
	event.from = call.transaction.from;
	if(call.transaction.to) event.to = call.transaction.to;
	else event.to = Address.empty();
	event.ts = call.block.timestamp;

	event.vault = ''
	event.type = 'Roll Over';
	event.save();
}

export function handleGenerateOtoken(call: CreateOtokenCall): void {
	if (wallets.includes(call.transaction.from.toHexString().toLowerCase())) {
		const event = new Event(call.transaction.hash.toHexString());
		event.from = call.transaction.from;
		if(call.transaction.to) event.to = call.transaction.to;
		else event.to = Address.empty();
		event.ts = call.block.timestamp;

		event.vault = ''
		event.type = 'Generate oToken';
		event.save();
	}
}