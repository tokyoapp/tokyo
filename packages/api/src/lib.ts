import * as library from 'tokyo-proto';

export enum MessageType {
  Error = 'error',
  Locations = 'locations',
  MutateLocations = 'locations.mutate',
  Index = 'index',
  Metadata = 'metadata',
  MutateMetadata = 'metadata.mutate',
  Thumbnails = 'thumbnails',
}

export type RequestMessage =
  | {
      _type: MessageType.Locations;
      _nonce?: number | string;
    }
  | {
      _type: MessageType.Index;
      _nonce?: number | string;
      ids: string[];
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

export { Channel } from './Channel.ts';
