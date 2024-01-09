import * as library from 'tokyo-proto';

export enum MessageType {
	Error = 'error',
	Locations = 'locations',
	MutateLocations = 'locations.mutate',
	Index = 'index',
	Image = 'image',
	Metadata = 'metadata',
	MutateMetadata = 'metadata.mutate',
	Thumbnails = 'thumbnails',
}

export const messageKeyToType = {
	error: MessageType.Error,
	list: MessageType.Locations,
	index: MessageType.Index,
	metadata: MessageType.Metadata,
};

export function parseMessage(msg: library.Message) {
	if (msg.error) {
		return {
			type: 'error',
			nonce: msg.nonce,
			message: msg.message,
		};
	}

	for (const key in msg) {
		if (key !== 'nonce' && msg[key] !== undefined) {
			return {
				type: messageKeyToType[key] || key,
				nonce: msg.nonce,
				data: msg[key],
			};
		}
	}

	return {
		type: MessageType.Error,
		message: 'Message not handled',
	};
}
