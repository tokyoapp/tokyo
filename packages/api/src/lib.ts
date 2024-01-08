import * as library from 'tokyo-proto';
import { MessageType } from './MessageTypes.ts';

export { MessageType } from './MessageTypes.ts';

export type RequestMessage =
	| {
			_type: MessageType.Locations;
			_nonce?: number | string;
	  }
	| {
			_type: MessageType.Index;
			_nonce?: number | string;
			locations: string[];
	  };

export type PickMessage<T> = Extract<RequestMessage, { _type: T }>;

type ResponseMessage =
	| library.LibraryMessage
	| library.LibraryMessage[]
	| library.LibraryIndexMessage
	| library.IndexEntryMessage[]
	| library.MetadataMessage;

export interface ClientAPIMessage<T> {
	type: MessageType;
	data: T;
}

// Interface to a single Libary
export interface LibraryInterface {
	stream(): readonly [ReadableStream<ResponseMessage>, WritableStream<RequestMessage>];
}

export { createIndexAccessor } from '../src/accessors/index.ts';
export { createLocationsAccessor } from '../src/accessors/locations.ts';
export { createMetadataAccessor } from '../src/accessors/metadata.ts';
export { createThumbnailAccessor } from '../src/accessors/thumbnails.ts';
export { createImageAccessor } from '../src/accessors/image.ts';
