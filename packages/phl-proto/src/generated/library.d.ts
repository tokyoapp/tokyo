import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace proto. */
export namespace proto {

    /** Properties of a LibraryMessage. */
    interface ILibraryMessage {

        /** LibraryMessage name */
        name?: (string|null);

        /** LibraryMessage path */
        path?: (string|null);
    }

    /** Represents a LibraryMessage. */
    class LibraryMessage implements ILibraryMessage {

        /**
         * Constructs a new LibraryMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.ILibraryMessage);

        /** LibraryMessage name. */
        public name: string;

        /** LibraryMessage path. */
        public path: string;

        /**
         * Creates a new LibraryMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LibraryMessage instance
         */
        public static create(properties?: proto.ILibraryMessage): proto.LibraryMessage;

        /**
         * Encodes the specified LibraryMessage message. Does not implicitly {@link proto.LibraryMessage.verify|verify} messages.
         * @param message LibraryMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: proto.ILibraryMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LibraryMessage message, length delimited. Does not implicitly {@link proto.LibraryMessage.verify|verify} messages.
         * @param message LibraryMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: proto.ILibraryMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LibraryMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LibraryMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.LibraryMessage;

        /**
         * Decodes a LibraryMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LibraryMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.LibraryMessage;

        /**
         * Verifies a LibraryMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LibraryMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LibraryMessage
         */
        public static fromObject(object: { [k: string]: any }): proto.LibraryMessage;

        /**
         * Creates a plain object from a LibraryMessage message. Also converts values to other types if specified.
         * @param message LibraryMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: proto.LibraryMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LibraryMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for LibraryMessage
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a LibraryListMessage. */
    interface ILibraryListMessage {

        /** LibraryListMessage libraries */
        libraries?: (proto.ILibraryMessage[]|null);
    }

    /** Represents a LibraryListMessage. */
    class LibraryListMessage implements ILibraryListMessage {

        /**
         * Constructs a new LibraryListMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.ILibraryListMessage);

        /** LibraryListMessage libraries. */
        public libraries: proto.ILibraryMessage[];

        /**
         * Creates a new LibraryListMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LibraryListMessage instance
         */
        public static create(properties?: proto.ILibraryListMessage): proto.LibraryListMessage;

        /**
         * Encodes the specified LibraryListMessage message. Does not implicitly {@link proto.LibraryListMessage.verify|verify} messages.
         * @param message LibraryListMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: proto.ILibraryListMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LibraryListMessage message, length delimited. Does not implicitly {@link proto.LibraryListMessage.verify|verify} messages.
         * @param message LibraryListMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: proto.ILibraryListMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LibraryListMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LibraryListMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.LibraryListMessage;

        /**
         * Decodes a LibraryListMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LibraryListMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.LibraryListMessage;

        /**
         * Verifies a LibraryListMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LibraryListMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LibraryListMessage
         */
        public static fromObject(object: { [k: string]: any }): proto.LibraryListMessage;

        /**
         * Creates a plain object from a LibraryListMessage message. Also converts values to other types if specified.
         * @param message LibraryListMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: proto.LibraryListMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LibraryListMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for LibraryListMessage
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a LibraryIndexMessage. */
    interface ILibraryIndexMessage {

        /** LibraryIndexMessage index */
        index?: (string[]|null);
    }

    /** Represents a LibraryIndexMessage. */
    class LibraryIndexMessage implements ILibraryIndexMessage {

        /**
         * Constructs a new LibraryIndexMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.ILibraryIndexMessage);

        /** LibraryIndexMessage index. */
        public index: string[];

        /**
         * Creates a new LibraryIndexMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LibraryIndexMessage instance
         */
        public static create(properties?: proto.ILibraryIndexMessage): proto.LibraryIndexMessage;

        /**
         * Encodes the specified LibraryIndexMessage message. Does not implicitly {@link proto.LibraryIndexMessage.verify|verify} messages.
         * @param message LibraryIndexMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: proto.ILibraryIndexMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LibraryIndexMessage message, length delimited. Does not implicitly {@link proto.LibraryIndexMessage.verify|verify} messages.
         * @param message LibraryIndexMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: proto.ILibraryIndexMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LibraryIndexMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LibraryIndexMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.LibraryIndexMessage;

        /**
         * Decodes a LibraryIndexMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LibraryIndexMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.LibraryIndexMessage;

        /**
         * Verifies a LibraryIndexMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LibraryIndexMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LibraryIndexMessage
         */
        public static fromObject(object: { [k: string]: any }): proto.LibraryIndexMessage;

        /**
         * Creates a plain object from a LibraryIndexMessage message. Also converts values to other types if specified.
         * @param message LibraryIndexMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: proto.LibraryIndexMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LibraryIndexMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for LibraryIndexMessage
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MetadataMessage. */
    interface IMetadataMessage {

        /** MetadataMessage hash */
        hash?: (string|null);

        /** MetadataMessage name */
        name?: (string|null);

        /** MetadataMessage createDate */
        createDate?: (string|null);

        /** MetadataMessage rating */
        rating?: (number|null);

        /** MetadataMessage width */
        width?: (number|null);

        /** MetadataMessage height */
        height?: (number|null);

        /** MetadataMessage make */
        make?: (string|null);

        /** MetadataMessage exif */
        exif?: (string|null);

        /** MetadataMessage orientation */
        orientation?: (number|null);
    }

    /** Represents a MetadataMessage. */
    class MetadataMessage implements IMetadataMessage {

        /**
         * Constructs a new MetadataMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.IMetadataMessage);

        /** MetadataMessage hash. */
        public hash: string;

        /** MetadataMessage name. */
        public name: string;

        /** MetadataMessage createDate. */
        public createDate: string;

        /** MetadataMessage rating. */
        public rating: number;

        /** MetadataMessage width. */
        public width: number;

        /** MetadataMessage height. */
        public height: number;

        /** MetadataMessage make. */
        public make: string;

        /** MetadataMessage exif. */
        public exif: string;

        /** MetadataMessage orientation. */
        public orientation: number;

        /**
         * Creates a new MetadataMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MetadataMessage instance
         */
        public static create(properties?: proto.IMetadataMessage): proto.MetadataMessage;

        /**
         * Encodes the specified MetadataMessage message. Does not implicitly {@link proto.MetadataMessage.verify|verify} messages.
         * @param message MetadataMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: proto.IMetadataMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MetadataMessage message, length delimited. Does not implicitly {@link proto.MetadataMessage.verify|verify} messages.
         * @param message MetadataMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: proto.IMetadataMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MetadataMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MetadataMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.MetadataMessage;

        /**
         * Decodes a MetadataMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MetadataMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.MetadataMessage;

        /**
         * Verifies a MetadataMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MetadataMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MetadataMessage
         */
        public static fromObject(object: { [k: string]: any }): proto.MetadataMessage;

        /**
         * Creates a plain object from a MetadataMessage message. Also converts values to other types if specified.
         * @param message MetadataMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: proto.MetadataMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MetadataMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MetadataMessage
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an ImageMessage. */
    interface IImageMessage {

        /** ImageMessage metadata */
        metadata?: (proto.IMetadataMessage|null);

        /** ImageMessage image */
        image?: (Uint8Array|null);
    }

    /** Represents an ImageMessage. */
    class ImageMessage implements IImageMessage {

        /**
         * Constructs a new ImageMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.IImageMessage);

        /** ImageMessage metadata. */
        public metadata?: (proto.IMetadataMessage|null);

        /** ImageMessage image. */
        public image: Uint8Array;

        /**
         * Creates a new ImageMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ImageMessage instance
         */
        public static create(properties?: proto.IImageMessage): proto.ImageMessage;

        /**
         * Encodes the specified ImageMessage message. Does not implicitly {@link proto.ImageMessage.verify|verify} messages.
         * @param message ImageMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: proto.IImageMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ImageMessage message, length delimited. Does not implicitly {@link proto.ImageMessage.verify|verify} messages.
         * @param message ImageMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: proto.IImageMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ImageMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ImageMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.ImageMessage;

        /**
         * Decodes an ImageMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ImageMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.ImageMessage;

        /**
         * Verifies an ImageMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ImageMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ImageMessage
         */
        public static fromObject(object: { [k: string]: any }): proto.ImageMessage;

        /**
         * Creates a plain object from an ImageMessage message. Also converts values to other types if specified.
         * @param message ImageMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: proto.ImageMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ImageMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ImageMessage
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ThumbnailMessage. */
    interface IThumbnailMessage {

        /** ThumbnailMessage metadata */
        metadata?: (proto.IMetadataMessage|null);

        /** ThumbnailMessage image */
        image?: (Uint8Array|null);
    }

    /** Represents a ThumbnailMessage. */
    class ThumbnailMessage implements IThumbnailMessage {

        /**
         * Constructs a new ThumbnailMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.IThumbnailMessage);

        /** ThumbnailMessage metadata. */
        public metadata?: (proto.IMetadataMessage|null);

        /** ThumbnailMessage image. */
        public image: Uint8Array;

        /**
         * Creates a new ThumbnailMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ThumbnailMessage instance
         */
        public static create(properties?: proto.IThumbnailMessage): proto.ThumbnailMessage;

        /**
         * Encodes the specified ThumbnailMessage message. Does not implicitly {@link proto.ThumbnailMessage.verify|verify} messages.
         * @param message ThumbnailMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: proto.IThumbnailMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ThumbnailMessage message, length delimited. Does not implicitly {@link proto.ThumbnailMessage.verify|verify} messages.
         * @param message ThumbnailMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: proto.IThumbnailMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ThumbnailMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ThumbnailMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.ThumbnailMessage;

        /**
         * Decodes a ThumbnailMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ThumbnailMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.ThumbnailMessage;

        /**
         * Verifies a ThumbnailMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ThumbnailMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ThumbnailMessage
         */
        public static fromObject(object: { [k: string]: any }): proto.ThumbnailMessage;

        /**
         * Creates a plain object from a ThumbnailMessage message. Also converts values to other types if specified.
         * @param message ThumbnailMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: proto.ThumbnailMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ThumbnailMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ThumbnailMessage
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Message. */
    interface IMessage {

        /** Message id */
        id?: (number|null);

        /** Message message */
        message?: (string|null);

        /** Message error */
        error?: (boolean|null);

        /** Message list */
        list?: (proto.ILibraryListMessage|null);

        /** Message index */
        index?: (proto.ILibraryIndexMessage|null);

        /** Message metadata */
        metadata?: (proto.IMetadataMessage|null);

        /** Message image */
        image?: (proto.IImageMessage|null);

        /** Message thumbnail */
        thumbnail?: (proto.IThumbnailMessage|null);
    }

    /** Represents a Message. */
    class Message implements IMessage {

        /**
         * Constructs a new Message.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.IMessage);

        /** Message id. */
        public id?: (number|null);

        /** Message message. */
        public message?: (string|null);

        /** Message error. */
        public error?: (boolean|null);

        /** Message list. */
        public list?: (proto.ILibraryListMessage|null);

        /** Message index. */
        public index?: (proto.ILibraryIndexMessage|null);

        /** Message metadata. */
        public metadata?: (proto.IMetadataMessage|null);

        /** Message image. */
        public image?: (proto.IImageMessage|null);

        /** Message thumbnail. */
        public thumbnail?: (proto.IThumbnailMessage|null);

        /** Message _id. */
        public _id?: "id";

        /** Message _message. */
        public _message?: "message";

        /** Message _error. */
        public _error?: "error";

        /** Message msg. */
        public msg?: ("list"|"index"|"metadata"|"image"|"thumbnail");

        /**
         * Creates a new Message instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Message instance
         */
        public static create(properties?: proto.IMessage): proto.Message;

        /**
         * Encodes the specified Message message. Does not implicitly {@link proto.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: proto.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Message message, length delimited. Does not implicitly {@link proto.Message.verify|verify} messages.
         * @param message Message message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: proto.IMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Message;

        /**
         * Decodes a Message message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.Message;

        /**
         * Verifies a Message message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Message message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Message
         */
        public static fromObject(object: { [k: string]: any }): proto.Message;

        /**
         * Creates a plain object from a Message message. Also converts values to other types if specified.
         * @param message Message
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: proto.Message, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Message to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Message
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
