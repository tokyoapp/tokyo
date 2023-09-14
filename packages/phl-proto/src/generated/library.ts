/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const proto = $root.proto = (() => {

    /**
     * Namespace proto.
     * @exports proto
     * @namespace
     */
    const proto = {};

    proto.LibraryMessage = (function() {

        /**
         * Properties of a LibraryMessage.
         * @memberof proto
         * @interface ILibraryMessage
         * @property {string|null} [name] LibraryMessage name
         * @property {string|null} [path] LibraryMessage path
         */

        /**
         * Constructs a new LibraryMessage.
         * @memberof proto
         * @classdesc Represents a LibraryMessage.
         * @implements ILibraryMessage
         * @constructor
         * @param {proto.ILibraryMessage=} [properties] Properties to set
         */
        function LibraryMessage(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LibraryMessage name.
         * @member {string} name
         * @memberof proto.LibraryMessage
         * @instance
         */
        LibraryMessage.prototype.name = "";

        /**
         * LibraryMessage path.
         * @member {string} path
         * @memberof proto.LibraryMessage
         * @instance
         */
        LibraryMessage.prototype.path = "";

        /**
         * Creates a new LibraryMessage instance using the specified properties.
         * @function create
         * @memberof proto.LibraryMessage
         * @static
         * @param {proto.ILibraryMessage=} [properties] Properties to set
         * @returns {proto.LibraryMessage} LibraryMessage instance
         */
        LibraryMessage.create = function create(properties) {
            return new LibraryMessage(properties);
        };

        /**
         * Encodes the specified LibraryMessage message. Does not implicitly {@link proto.LibraryMessage.verify|verify} messages.
         * @function encode
         * @memberof proto.LibraryMessage
         * @static
         * @param {proto.ILibraryMessage} message LibraryMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LibraryMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
            if (message.path != null && Object.hasOwnProperty.call(message, "path"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.path);
            return writer;
        };

        /**
         * Encodes the specified LibraryMessage message, length delimited. Does not implicitly {@link proto.LibraryMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.LibraryMessage
         * @static
         * @param {proto.ILibraryMessage} message LibraryMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LibraryMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LibraryMessage message from the specified reader or buffer.
         * @function decode
         * @memberof proto.LibraryMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.LibraryMessage} LibraryMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LibraryMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.LibraryMessage();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.name = reader.string();
                        break;
                    }
                case 2: {
                        message.path = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LibraryMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.LibraryMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.LibraryMessage} LibraryMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LibraryMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LibraryMessage message.
         * @function verify
         * @memberof proto.LibraryMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LibraryMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.path != null && message.hasOwnProperty("path"))
                if (!$util.isString(message.path))
                    return "path: string expected";
            return null;
        };

        /**
         * Creates a LibraryMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.LibraryMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.LibraryMessage} LibraryMessage
         */
        LibraryMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.proto.LibraryMessage)
                return object;
            let message = new $root.proto.LibraryMessage();
            if (object.name != null)
                message.name = String(object.name);
            if (object.path != null)
                message.path = String(object.path);
            return message;
        };

        /**
         * Creates a plain object from a LibraryMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.LibraryMessage
         * @static
         * @param {proto.LibraryMessage} message LibraryMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LibraryMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.name = "";
                object.path = "";
            }
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.path != null && message.hasOwnProperty("path"))
                object.path = message.path;
            return object;
        };

        /**
         * Converts this LibraryMessage to JSON.
         * @function toJSON
         * @memberof proto.LibraryMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LibraryMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for LibraryMessage
         * @function getTypeUrl
         * @memberof proto.LibraryMessage
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        LibraryMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.LibraryMessage";
        };

        return LibraryMessage;
    })();

    proto.LibraryListMessage = (function() {

        /**
         * Properties of a LibraryListMessage.
         * @memberof proto
         * @interface ILibraryListMessage
         * @property {Array.<proto.ILibraryMessage>|null} [libraries] LibraryListMessage libraries
         */

        /**
         * Constructs a new LibraryListMessage.
         * @memberof proto
         * @classdesc Represents a LibraryListMessage.
         * @implements ILibraryListMessage
         * @constructor
         * @param {proto.ILibraryListMessage=} [properties] Properties to set
         */
        function LibraryListMessage(properties) {
            this.libraries = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LibraryListMessage libraries.
         * @member {Array.<proto.ILibraryMessage>} libraries
         * @memberof proto.LibraryListMessage
         * @instance
         */
        LibraryListMessage.prototype.libraries = $util.emptyArray;

        /**
         * Creates a new LibraryListMessage instance using the specified properties.
         * @function create
         * @memberof proto.LibraryListMessage
         * @static
         * @param {proto.ILibraryListMessage=} [properties] Properties to set
         * @returns {proto.LibraryListMessage} LibraryListMessage instance
         */
        LibraryListMessage.create = function create(properties) {
            return new LibraryListMessage(properties);
        };

        /**
         * Encodes the specified LibraryListMessage message. Does not implicitly {@link proto.LibraryListMessage.verify|verify} messages.
         * @function encode
         * @memberof proto.LibraryListMessage
         * @static
         * @param {proto.ILibraryListMessage} message LibraryListMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LibraryListMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.libraries != null && message.libraries.length)
                for (let i = 0; i < message.libraries.length; ++i)
                    $root.proto.LibraryMessage.encode(message.libraries[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified LibraryListMessage message, length delimited. Does not implicitly {@link proto.LibraryListMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.LibraryListMessage
         * @static
         * @param {proto.ILibraryListMessage} message LibraryListMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LibraryListMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LibraryListMessage message from the specified reader or buffer.
         * @function decode
         * @memberof proto.LibraryListMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.LibraryListMessage} LibraryListMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LibraryListMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.LibraryListMessage();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.libraries && message.libraries.length))
                            message.libraries = [];
                        message.libraries.push($root.proto.LibraryMessage.decode(reader, reader.uint32()));
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LibraryListMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.LibraryListMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.LibraryListMessage} LibraryListMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LibraryListMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LibraryListMessage message.
         * @function verify
         * @memberof proto.LibraryListMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LibraryListMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.libraries != null && message.hasOwnProperty("libraries")) {
                if (!Array.isArray(message.libraries))
                    return "libraries: array expected";
                for (let i = 0; i < message.libraries.length; ++i) {
                    let error = $root.proto.LibraryMessage.verify(message.libraries[i]);
                    if (error)
                        return "libraries." + error;
                }
            }
            return null;
        };

        /**
         * Creates a LibraryListMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.LibraryListMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.LibraryListMessage} LibraryListMessage
         */
        LibraryListMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.proto.LibraryListMessage)
                return object;
            let message = new $root.proto.LibraryListMessage();
            if (object.libraries) {
                if (!Array.isArray(object.libraries))
                    throw TypeError(".proto.LibraryListMessage.libraries: array expected");
                message.libraries = [];
                for (let i = 0; i < object.libraries.length; ++i) {
                    if (typeof object.libraries[i] !== "object")
                        throw TypeError(".proto.LibraryListMessage.libraries: object expected");
                    message.libraries[i] = $root.proto.LibraryMessage.fromObject(object.libraries[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a LibraryListMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.LibraryListMessage
         * @static
         * @param {proto.LibraryListMessage} message LibraryListMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LibraryListMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.libraries = [];
            if (message.libraries && message.libraries.length) {
                object.libraries = [];
                for (let j = 0; j < message.libraries.length; ++j)
                    object.libraries[j] = $root.proto.LibraryMessage.toObject(message.libraries[j], options);
            }
            return object;
        };

        /**
         * Converts this LibraryListMessage to JSON.
         * @function toJSON
         * @memberof proto.LibraryListMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LibraryListMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for LibraryListMessage
         * @function getTypeUrl
         * @memberof proto.LibraryListMessage
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        LibraryListMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.LibraryListMessage";
        };

        return LibraryListMessage;
    })();

    proto.LibraryIndexMessage = (function() {

        /**
         * Properties of a LibraryIndexMessage.
         * @memberof proto
         * @interface ILibraryIndexMessage
         * @property {Array.<string>|null} [index] LibraryIndexMessage index
         */

        /**
         * Constructs a new LibraryIndexMessage.
         * @memberof proto
         * @classdesc Represents a LibraryIndexMessage.
         * @implements ILibraryIndexMessage
         * @constructor
         * @param {proto.ILibraryIndexMessage=} [properties] Properties to set
         */
        function LibraryIndexMessage(properties) {
            this.index = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LibraryIndexMessage index.
         * @member {Array.<string>} index
         * @memberof proto.LibraryIndexMessage
         * @instance
         */
        LibraryIndexMessage.prototype.index = $util.emptyArray;

        /**
         * Creates a new LibraryIndexMessage instance using the specified properties.
         * @function create
         * @memberof proto.LibraryIndexMessage
         * @static
         * @param {proto.ILibraryIndexMessage=} [properties] Properties to set
         * @returns {proto.LibraryIndexMessage} LibraryIndexMessage instance
         */
        LibraryIndexMessage.create = function create(properties) {
            return new LibraryIndexMessage(properties);
        };

        /**
         * Encodes the specified LibraryIndexMessage message. Does not implicitly {@link proto.LibraryIndexMessage.verify|verify} messages.
         * @function encode
         * @memberof proto.LibraryIndexMessage
         * @static
         * @param {proto.ILibraryIndexMessage} message LibraryIndexMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LibraryIndexMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.index != null && message.index.length)
                for (let i = 0; i < message.index.length; ++i)
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.index[i]);
            return writer;
        };

        /**
         * Encodes the specified LibraryIndexMessage message, length delimited. Does not implicitly {@link proto.LibraryIndexMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.LibraryIndexMessage
         * @static
         * @param {proto.ILibraryIndexMessage} message LibraryIndexMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LibraryIndexMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LibraryIndexMessage message from the specified reader or buffer.
         * @function decode
         * @memberof proto.LibraryIndexMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.LibraryIndexMessage} LibraryIndexMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LibraryIndexMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.LibraryIndexMessage();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.index && message.index.length))
                            message.index = [];
                        message.index.push(reader.string());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LibraryIndexMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.LibraryIndexMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.LibraryIndexMessage} LibraryIndexMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LibraryIndexMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LibraryIndexMessage message.
         * @function verify
         * @memberof proto.LibraryIndexMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LibraryIndexMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.index != null && message.hasOwnProperty("index")) {
                if (!Array.isArray(message.index))
                    return "index: array expected";
                for (let i = 0; i < message.index.length; ++i)
                    if (!$util.isString(message.index[i]))
                        return "index: string[] expected";
            }
            return null;
        };

        /**
         * Creates a LibraryIndexMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.LibraryIndexMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.LibraryIndexMessage} LibraryIndexMessage
         */
        LibraryIndexMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.proto.LibraryIndexMessage)
                return object;
            let message = new $root.proto.LibraryIndexMessage();
            if (object.index) {
                if (!Array.isArray(object.index))
                    throw TypeError(".proto.LibraryIndexMessage.index: array expected");
                message.index = [];
                for (let i = 0; i < object.index.length; ++i)
                    message.index[i] = String(object.index[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a LibraryIndexMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.LibraryIndexMessage
         * @static
         * @param {proto.LibraryIndexMessage} message LibraryIndexMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LibraryIndexMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.index = [];
            if (message.index && message.index.length) {
                object.index = [];
                for (let j = 0; j < message.index.length; ++j)
                    object.index[j] = message.index[j];
            }
            return object;
        };

        /**
         * Converts this LibraryIndexMessage to JSON.
         * @function toJSON
         * @memberof proto.LibraryIndexMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LibraryIndexMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for LibraryIndexMessage
         * @function getTypeUrl
         * @memberof proto.LibraryIndexMessage
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        LibraryIndexMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.LibraryIndexMessage";
        };

        return LibraryIndexMessage;
    })();

    proto.MetadataMessage = (function() {

        /**
         * Properties of a MetadataMessage.
         * @memberof proto
         * @interface IMetadataMessage
         * @property {string|null} [hash] MetadataMessage hash
         * @property {string|null} [name] MetadataMessage name
         * @property {string|null} [createDate] MetadataMessage createDate
         * @property {number|null} [rating] MetadataMessage rating
         * @property {number|null} [width] MetadataMessage width
         * @property {number|null} [height] MetadataMessage height
         * @property {string|null} [make] MetadataMessage make
         * @property {string|null} [exif] MetadataMessage exif
         * @property {number|null} [orientation] MetadataMessage orientation
         */

        /**
         * Constructs a new MetadataMessage.
         * @memberof proto
         * @classdesc Represents a MetadataMessage.
         * @implements IMetadataMessage
         * @constructor
         * @param {proto.IMetadataMessage=} [properties] Properties to set
         */
        function MetadataMessage(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * MetadataMessage hash.
         * @member {string} hash
         * @memberof proto.MetadataMessage
         * @instance
         */
        MetadataMessage.prototype.hash = "";

        /**
         * MetadataMessage name.
         * @member {string} name
         * @memberof proto.MetadataMessage
         * @instance
         */
        MetadataMessage.prototype.name = "";

        /**
         * MetadataMessage createDate.
         * @member {string} createDate
         * @memberof proto.MetadataMessage
         * @instance
         */
        MetadataMessage.prototype.createDate = "";

        /**
         * MetadataMessage rating.
         * @member {number} rating
         * @memberof proto.MetadataMessage
         * @instance
         */
        MetadataMessage.prototype.rating = 0;

        /**
         * MetadataMessage width.
         * @member {number} width
         * @memberof proto.MetadataMessage
         * @instance
         */
        MetadataMessage.prototype.width = 0;

        /**
         * MetadataMessage height.
         * @member {number} height
         * @memberof proto.MetadataMessage
         * @instance
         */
        MetadataMessage.prototype.height = 0;

        /**
         * MetadataMessage make.
         * @member {string} make
         * @memberof proto.MetadataMessage
         * @instance
         */
        MetadataMessage.prototype.make = "";

        /**
         * MetadataMessage exif.
         * @member {string} exif
         * @memberof proto.MetadataMessage
         * @instance
         */
        MetadataMessage.prototype.exif = "";

        /**
         * MetadataMessage orientation.
         * @member {number} orientation
         * @memberof proto.MetadataMessage
         * @instance
         */
        MetadataMessage.prototype.orientation = 0;

        /**
         * Creates a new MetadataMessage instance using the specified properties.
         * @function create
         * @memberof proto.MetadataMessage
         * @static
         * @param {proto.IMetadataMessage=} [properties] Properties to set
         * @returns {proto.MetadataMessage} MetadataMessage instance
         */
        MetadataMessage.create = function create(properties) {
            return new MetadataMessage(properties);
        };

        /**
         * Encodes the specified MetadataMessage message. Does not implicitly {@link proto.MetadataMessage.verify|verify} messages.
         * @function encode
         * @memberof proto.MetadataMessage
         * @static
         * @param {proto.IMetadataMessage} message MetadataMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        MetadataMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.hash != null && Object.hasOwnProperty.call(message, "hash"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.hash);
            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.createDate != null && Object.hasOwnProperty.call(message, "createDate"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.createDate);
            if (message.rating != null && Object.hasOwnProperty.call(message, "rating"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.rating);
            if (message.width != null && Object.hasOwnProperty.call(message, "width"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.width);
            if (message.height != null && Object.hasOwnProperty.call(message, "height"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.height);
            if (message.make != null && Object.hasOwnProperty.call(message, "make"))
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.make);
            if (message.exif != null && Object.hasOwnProperty.call(message, "exif"))
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.exif);
            if (message.orientation != null && Object.hasOwnProperty.call(message, "orientation"))
                writer.uint32(/* id 9, wireType 0 =*/72).int32(message.orientation);
            return writer;
        };

        /**
         * Encodes the specified MetadataMessage message, length delimited. Does not implicitly {@link proto.MetadataMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.MetadataMessage
         * @static
         * @param {proto.IMetadataMessage} message MetadataMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        MetadataMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a MetadataMessage message from the specified reader or buffer.
         * @function decode
         * @memberof proto.MetadataMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.MetadataMessage} MetadataMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        MetadataMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.MetadataMessage();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.hash = reader.string();
                        break;
                    }
                case 2: {
                        message.name = reader.string();
                        break;
                    }
                case 3: {
                        message.createDate = reader.string();
                        break;
                    }
                case 4: {
                        message.rating = reader.int32();
                        break;
                    }
                case 5: {
                        message.width = reader.int32();
                        break;
                    }
                case 6: {
                        message.height = reader.int32();
                        break;
                    }
                case 7: {
                        message.make = reader.string();
                        break;
                    }
                case 8: {
                        message.exif = reader.string();
                        break;
                    }
                case 9: {
                        message.orientation = reader.int32();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a MetadataMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.MetadataMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.MetadataMessage} MetadataMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        MetadataMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a MetadataMessage message.
         * @function verify
         * @memberof proto.MetadataMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        MetadataMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.hash != null && message.hasOwnProperty("hash"))
                if (!$util.isString(message.hash))
                    return "hash: string expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.createDate != null && message.hasOwnProperty("createDate"))
                if (!$util.isString(message.createDate))
                    return "createDate: string expected";
            if (message.rating != null && message.hasOwnProperty("rating"))
                if (!$util.isInteger(message.rating))
                    return "rating: integer expected";
            if (message.width != null && message.hasOwnProperty("width"))
                if (!$util.isInteger(message.width))
                    return "width: integer expected";
            if (message.height != null && message.hasOwnProperty("height"))
                if (!$util.isInteger(message.height))
                    return "height: integer expected";
            if (message.make != null && message.hasOwnProperty("make"))
                if (!$util.isString(message.make))
                    return "make: string expected";
            if (message.exif != null && message.hasOwnProperty("exif"))
                if (!$util.isString(message.exif))
                    return "exif: string expected";
            if (message.orientation != null && message.hasOwnProperty("orientation"))
                if (!$util.isInteger(message.orientation))
                    return "orientation: integer expected";
            return null;
        };

        /**
         * Creates a MetadataMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.MetadataMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.MetadataMessage} MetadataMessage
         */
        MetadataMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.proto.MetadataMessage)
                return object;
            let message = new $root.proto.MetadataMessage();
            if (object.hash != null)
                message.hash = String(object.hash);
            if (object.name != null)
                message.name = String(object.name);
            if (object.createDate != null)
                message.createDate = String(object.createDate);
            if (object.rating != null)
                message.rating = object.rating | 0;
            if (object.width != null)
                message.width = object.width | 0;
            if (object.height != null)
                message.height = object.height | 0;
            if (object.make != null)
                message.make = String(object.make);
            if (object.exif != null)
                message.exif = String(object.exif);
            if (object.orientation != null)
                message.orientation = object.orientation | 0;
            return message;
        };

        /**
         * Creates a plain object from a MetadataMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.MetadataMessage
         * @static
         * @param {proto.MetadataMessage} message MetadataMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        MetadataMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.hash = "";
                object.name = "";
                object.createDate = "";
                object.rating = 0;
                object.width = 0;
                object.height = 0;
                object.make = "";
                object.exif = "";
                object.orientation = 0;
            }
            if (message.hash != null && message.hasOwnProperty("hash"))
                object.hash = message.hash;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.createDate != null && message.hasOwnProperty("createDate"))
                object.createDate = message.createDate;
            if (message.rating != null && message.hasOwnProperty("rating"))
                object.rating = message.rating;
            if (message.width != null && message.hasOwnProperty("width"))
                object.width = message.width;
            if (message.height != null && message.hasOwnProperty("height"))
                object.height = message.height;
            if (message.make != null && message.hasOwnProperty("make"))
                object.make = message.make;
            if (message.exif != null && message.hasOwnProperty("exif"))
                object.exif = message.exif;
            if (message.orientation != null && message.hasOwnProperty("orientation"))
                object.orientation = message.orientation;
            return object;
        };

        /**
         * Converts this MetadataMessage to JSON.
         * @function toJSON
         * @memberof proto.MetadataMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        MetadataMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for MetadataMessage
         * @function getTypeUrl
         * @memberof proto.MetadataMessage
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        MetadataMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.MetadataMessage";
        };

        return MetadataMessage;
    })();

    proto.ImageMessage = (function() {

        /**
         * Properties of an ImageMessage.
         * @memberof proto
         * @interface IImageMessage
         * @property {proto.IMetadataMessage|null} [metadata] ImageMessage metadata
         * @property {Uint8Array|null} [image] ImageMessage image
         */

        /**
         * Constructs a new ImageMessage.
         * @memberof proto
         * @classdesc Represents an ImageMessage.
         * @implements IImageMessage
         * @constructor
         * @param {proto.IImageMessage=} [properties] Properties to set
         */
        function ImageMessage(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ImageMessage metadata.
         * @member {proto.IMetadataMessage|null|undefined} metadata
         * @memberof proto.ImageMessage
         * @instance
         */
        ImageMessage.prototype.metadata = null;

        /**
         * ImageMessage image.
         * @member {Uint8Array} image
         * @memberof proto.ImageMessage
         * @instance
         */
        ImageMessage.prototype.image = $util.newBuffer([]);

        /**
         * Creates a new ImageMessage instance using the specified properties.
         * @function create
         * @memberof proto.ImageMessage
         * @static
         * @param {proto.IImageMessage=} [properties] Properties to set
         * @returns {proto.ImageMessage} ImageMessage instance
         */
        ImageMessage.create = function create(properties) {
            return new ImageMessage(properties);
        };

        /**
         * Encodes the specified ImageMessage message. Does not implicitly {@link proto.ImageMessage.verify|verify} messages.
         * @function encode
         * @memberof proto.ImageMessage
         * @static
         * @param {proto.IImageMessage} message ImageMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ImageMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.metadata != null && Object.hasOwnProperty.call(message, "metadata"))
                $root.proto.MetadataMessage.encode(message.metadata, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.image != null && Object.hasOwnProperty.call(message, "image"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.image);
            return writer;
        };

        /**
         * Encodes the specified ImageMessage message, length delimited. Does not implicitly {@link proto.ImageMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.ImageMessage
         * @static
         * @param {proto.IImageMessage} message ImageMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ImageMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an ImageMessage message from the specified reader or buffer.
         * @function decode
         * @memberof proto.ImageMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.ImageMessage} ImageMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ImageMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.ImageMessage();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.metadata = $root.proto.MetadataMessage.decode(reader, reader.uint32());
                        break;
                    }
                case 2: {
                        message.image = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an ImageMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.ImageMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.ImageMessage} ImageMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ImageMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an ImageMessage message.
         * @function verify
         * @memberof proto.ImageMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ImageMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.metadata != null && message.hasOwnProperty("metadata")) {
                let error = $root.proto.MetadataMessage.verify(message.metadata);
                if (error)
                    return "metadata." + error;
            }
            if (message.image != null && message.hasOwnProperty("image"))
                if (!(message.image && typeof message.image.length === "number" || $util.isString(message.image)))
                    return "image: buffer expected";
            return null;
        };

        /**
         * Creates an ImageMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.ImageMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.ImageMessage} ImageMessage
         */
        ImageMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.proto.ImageMessage)
                return object;
            let message = new $root.proto.ImageMessage();
            if (object.metadata != null) {
                if (typeof object.metadata !== "object")
                    throw TypeError(".proto.ImageMessage.metadata: object expected");
                message.metadata = $root.proto.MetadataMessage.fromObject(object.metadata);
            }
            if (object.image != null)
                if (typeof object.image === "string")
                    $util.base64.decode(object.image, message.image = $util.newBuffer($util.base64.length(object.image)), 0);
                else if (object.image.length >= 0)
                    message.image = object.image;
            return message;
        };

        /**
         * Creates a plain object from an ImageMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.ImageMessage
         * @static
         * @param {proto.ImageMessage} message ImageMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ImageMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.metadata = null;
                if (options.bytes === String)
                    object.image = "";
                else {
                    object.image = [];
                    if (options.bytes !== Array)
                        object.image = $util.newBuffer(object.image);
                }
            }
            if (message.metadata != null && message.hasOwnProperty("metadata"))
                object.metadata = $root.proto.MetadataMessage.toObject(message.metadata, options);
            if (message.image != null && message.hasOwnProperty("image"))
                object.image = options.bytes === String ? $util.base64.encode(message.image, 0, message.image.length) : options.bytes === Array ? Array.prototype.slice.call(message.image) : message.image;
            return object;
        };

        /**
         * Converts this ImageMessage to JSON.
         * @function toJSON
         * @memberof proto.ImageMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ImageMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ImageMessage
         * @function getTypeUrl
         * @memberof proto.ImageMessage
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ImageMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ImageMessage";
        };

        return ImageMessage;
    })();

    proto.ThumbnailMessage = (function() {

        /**
         * Properties of a ThumbnailMessage.
         * @memberof proto
         * @interface IThumbnailMessage
         * @property {proto.IMetadataMessage|null} [metadata] ThumbnailMessage metadata
         * @property {Uint8Array|null} [image] ThumbnailMessage image
         */

        /**
         * Constructs a new ThumbnailMessage.
         * @memberof proto
         * @classdesc Represents a ThumbnailMessage.
         * @implements IThumbnailMessage
         * @constructor
         * @param {proto.IThumbnailMessage=} [properties] Properties to set
         */
        function ThumbnailMessage(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ThumbnailMessage metadata.
         * @member {proto.IMetadataMessage|null|undefined} metadata
         * @memberof proto.ThumbnailMessage
         * @instance
         */
        ThumbnailMessage.prototype.metadata = null;

        /**
         * ThumbnailMessage image.
         * @member {Uint8Array} image
         * @memberof proto.ThumbnailMessage
         * @instance
         */
        ThumbnailMessage.prototype.image = $util.newBuffer([]);

        /**
         * Creates a new ThumbnailMessage instance using the specified properties.
         * @function create
         * @memberof proto.ThumbnailMessage
         * @static
         * @param {proto.IThumbnailMessage=} [properties] Properties to set
         * @returns {proto.ThumbnailMessage} ThumbnailMessage instance
         */
        ThumbnailMessage.create = function create(properties) {
            return new ThumbnailMessage(properties);
        };

        /**
         * Encodes the specified ThumbnailMessage message. Does not implicitly {@link proto.ThumbnailMessage.verify|verify} messages.
         * @function encode
         * @memberof proto.ThumbnailMessage
         * @static
         * @param {proto.IThumbnailMessage} message ThumbnailMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ThumbnailMessage.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.metadata != null && Object.hasOwnProperty.call(message, "metadata"))
                $root.proto.MetadataMessage.encode(message.metadata, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.image != null && Object.hasOwnProperty.call(message, "image"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.image);
            return writer;
        };

        /**
         * Encodes the specified ThumbnailMessage message, length delimited. Does not implicitly {@link proto.ThumbnailMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.ThumbnailMessage
         * @static
         * @param {proto.IThumbnailMessage} message ThumbnailMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ThumbnailMessage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ThumbnailMessage message from the specified reader or buffer.
         * @function decode
         * @memberof proto.ThumbnailMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.ThumbnailMessage} ThumbnailMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ThumbnailMessage.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.ThumbnailMessage();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.metadata = $root.proto.MetadataMessage.decode(reader, reader.uint32());
                        break;
                    }
                case 2: {
                        message.image = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ThumbnailMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.ThumbnailMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.ThumbnailMessage} ThumbnailMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ThumbnailMessage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ThumbnailMessage message.
         * @function verify
         * @memberof proto.ThumbnailMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ThumbnailMessage.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.metadata != null && message.hasOwnProperty("metadata")) {
                let error = $root.proto.MetadataMessage.verify(message.metadata);
                if (error)
                    return "metadata." + error;
            }
            if (message.image != null && message.hasOwnProperty("image"))
                if (!(message.image && typeof message.image.length === "number" || $util.isString(message.image)))
                    return "image: buffer expected";
            return null;
        };

        /**
         * Creates a ThumbnailMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.ThumbnailMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.ThumbnailMessage} ThumbnailMessage
         */
        ThumbnailMessage.fromObject = function fromObject(object) {
            if (object instanceof $root.proto.ThumbnailMessage)
                return object;
            let message = new $root.proto.ThumbnailMessage();
            if (object.metadata != null) {
                if (typeof object.metadata !== "object")
                    throw TypeError(".proto.ThumbnailMessage.metadata: object expected");
                message.metadata = $root.proto.MetadataMessage.fromObject(object.metadata);
            }
            if (object.image != null)
                if (typeof object.image === "string")
                    $util.base64.decode(object.image, message.image = $util.newBuffer($util.base64.length(object.image)), 0);
                else if (object.image.length >= 0)
                    message.image = object.image;
            return message;
        };

        /**
         * Creates a plain object from a ThumbnailMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.ThumbnailMessage
         * @static
         * @param {proto.ThumbnailMessage} message ThumbnailMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ThumbnailMessage.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.metadata = null;
                if (options.bytes === String)
                    object.image = "";
                else {
                    object.image = [];
                    if (options.bytes !== Array)
                        object.image = $util.newBuffer(object.image);
                }
            }
            if (message.metadata != null && message.hasOwnProperty("metadata"))
                object.metadata = $root.proto.MetadataMessage.toObject(message.metadata, options);
            if (message.image != null && message.hasOwnProperty("image"))
                object.image = options.bytes === String ? $util.base64.encode(message.image, 0, message.image.length) : options.bytes === Array ? Array.prototype.slice.call(message.image) : message.image;
            return object;
        };

        /**
         * Converts this ThumbnailMessage to JSON.
         * @function toJSON
         * @memberof proto.ThumbnailMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ThumbnailMessage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ThumbnailMessage
         * @function getTypeUrl
         * @memberof proto.ThumbnailMessage
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ThumbnailMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.ThumbnailMessage";
        };

        return ThumbnailMessage;
    })();

    proto.Message = (function() {

        /**
         * Properties of a Message.
         * @memberof proto
         * @interface IMessage
         * @property {number|null} [id] Message id
         * @property {string|null} [message] Message message
         * @property {boolean|null} [error] Message error
         * @property {proto.ILibraryListMessage|null} [list] Message list
         * @property {proto.ILibraryIndexMessage|null} [index] Message index
         * @property {proto.IMetadataMessage|null} [metadata] Message metadata
         * @property {proto.IImageMessage|null} [image] Message image
         * @property {proto.IThumbnailMessage|null} [thumbnail] Message thumbnail
         */

        /**
         * Constructs a new Message.
         * @memberof proto
         * @classdesc Represents a Message.
         * @implements IMessage
         * @constructor
         * @param {proto.IMessage=} [properties] Properties to set
         */
        function Message(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Message id.
         * @member {number|null|undefined} id
         * @memberof proto.Message
         * @instance
         */
        Message.prototype.id = null;

        /**
         * Message message.
         * @member {string|null|undefined} message
         * @memberof proto.Message
         * @instance
         */
        Message.prototype.message = null;

        /**
         * Message error.
         * @member {boolean|null|undefined} error
         * @memberof proto.Message
         * @instance
         */
        Message.prototype.error = null;

        /**
         * Message list.
         * @member {proto.ILibraryListMessage|null|undefined} list
         * @memberof proto.Message
         * @instance
         */
        Message.prototype.list = null;

        /**
         * Message index.
         * @member {proto.ILibraryIndexMessage|null|undefined} index
         * @memberof proto.Message
         * @instance
         */
        Message.prototype.index = null;

        /**
         * Message metadata.
         * @member {proto.IMetadataMessage|null|undefined} metadata
         * @memberof proto.Message
         * @instance
         */
        Message.prototype.metadata = null;

        /**
         * Message image.
         * @member {proto.IImageMessage|null|undefined} image
         * @memberof proto.Message
         * @instance
         */
        Message.prototype.image = null;

        /**
         * Message thumbnail.
         * @member {proto.IThumbnailMessage|null|undefined} thumbnail
         * @memberof proto.Message
         * @instance
         */
        Message.prototype.thumbnail = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * Message _id.
         * @member {"id"|undefined} _id
         * @memberof proto.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "_id", {
            get: $util.oneOfGetter($oneOfFields = ["id"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Message _message.
         * @member {"message"|undefined} _message
         * @memberof proto.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "_message", {
            get: $util.oneOfGetter($oneOfFields = ["message"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Message _error.
         * @member {"error"|undefined} _error
         * @memberof proto.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "_error", {
            get: $util.oneOfGetter($oneOfFields = ["error"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Message msg.
         * @member {"list"|"index"|"metadata"|"image"|"thumbnail"|undefined} msg
         * @memberof proto.Message
         * @instance
         */
        Object.defineProperty(Message.prototype, "msg", {
            get: $util.oneOfGetter($oneOfFields = ["list", "index", "metadata", "image", "thumbnail"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new Message instance using the specified properties.
         * @function create
         * @memberof proto.Message
         * @static
         * @param {proto.IMessage=} [properties] Properties to set
         * @returns {proto.Message} Message instance
         */
        Message.create = function create(properties) {
            return new Message(properties);
        };

        /**
         * Encodes the specified Message message. Does not implicitly {@link proto.Message.verify|verify} messages.
         * @function encode
         * @memberof proto.Message
         * @static
         * @param {proto.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
            if (message.error != null && Object.hasOwnProperty.call(message, "error"))
                writer.uint32(/* id 3, wireType 0 =*/24).bool(message.error);
            if (message.list != null && Object.hasOwnProperty.call(message, "list"))
                $root.proto.LibraryListMessage.encode(message.list, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                $root.proto.LibraryIndexMessage.encode(message.index, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.metadata != null && Object.hasOwnProperty.call(message, "metadata"))
                $root.proto.MetadataMessage.encode(message.metadata, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            if (message.image != null && Object.hasOwnProperty.call(message, "image"))
                $root.proto.ImageMessage.encode(message.image, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
            if (message.thumbnail != null && Object.hasOwnProperty.call(message, "thumbnail"))
                $root.proto.ThumbnailMessage.encode(message.thumbnail, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Message message, length delimited. Does not implicitly {@link proto.Message.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.Message
         * @static
         * @param {proto.IMessage} message Message message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Message.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Message message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.Message();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1: {
                        message.id = reader.int32();
                        break;
                    }
                case 2: {
                        message.message = reader.string();
                        break;
                    }
                case 3: {
                        message.error = reader.bool();
                        break;
                    }
                case 5: {
                        message.list = $root.proto.LibraryListMessage.decode(reader, reader.uint32());
                        break;
                    }
                case 6: {
                        message.index = $root.proto.LibraryIndexMessage.decode(reader, reader.uint32());
                        break;
                    }
                case 7: {
                        message.metadata = $root.proto.MetadataMessage.decode(reader, reader.uint32());
                        break;
                    }
                case 8: {
                        message.image = $root.proto.ImageMessage.decode(reader, reader.uint32());
                        break;
                    }
                case 9: {
                        message.thumbnail = $root.proto.ThumbnailMessage.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Message message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.Message
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.Message} Message
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Message.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Message message.
         * @function verify
         * @memberof proto.Message
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Message.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.id != null && message.hasOwnProperty("id")) {
                properties._id = 1;
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            }
            if (message.message != null && message.hasOwnProperty("message")) {
                properties._message = 1;
                if (!$util.isString(message.message))
                    return "message: string expected";
            }
            if (message.error != null && message.hasOwnProperty("error")) {
                properties._error = 1;
                if (typeof message.error !== "boolean")
                    return "error: boolean expected";
            }
            if (message.list != null && message.hasOwnProperty("list")) {
                properties.msg = 1;
                {
                    let error = $root.proto.LibraryListMessage.verify(message.list);
                    if (error)
                        return "list." + error;
                }
            }
            if (message.index != null && message.hasOwnProperty("index")) {
                if (properties.msg === 1)
                    return "msg: multiple values";
                properties.msg = 1;
                {
                    let error = $root.proto.LibraryIndexMessage.verify(message.index);
                    if (error)
                        return "index." + error;
                }
            }
            if (message.metadata != null && message.hasOwnProperty("metadata")) {
                if (properties.msg === 1)
                    return "msg: multiple values";
                properties.msg = 1;
                {
                    let error = $root.proto.MetadataMessage.verify(message.metadata);
                    if (error)
                        return "metadata." + error;
                }
            }
            if (message.image != null && message.hasOwnProperty("image")) {
                if (properties.msg === 1)
                    return "msg: multiple values";
                properties.msg = 1;
                {
                    let error = $root.proto.ImageMessage.verify(message.image);
                    if (error)
                        return "image." + error;
                }
            }
            if (message.thumbnail != null && message.hasOwnProperty("thumbnail")) {
                if (properties.msg === 1)
                    return "msg: multiple values";
                properties.msg = 1;
                {
                    let error = $root.proto.ThumbnailMessage.verify(message.thumbnail);
                    if (error)
                        return "thumbnail." + error;
                }
            }
            return null;
        };

        /**
         * Creates a Message message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.Message
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.Message} Message
         */
        Message.fromObject = function fromObject(object) {
            if (object instanceof $root.proto.Message)
                return object;
            let message = new $root.proto.Message();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.message != null)
                message.message = String(object.message);
            if (object.error != null)
                message.error = Boolean(object.error);
            if (object.list != null) {
                if (typeof object.list !== "object")
                    throw TypeError(".proto.Message.list: object expected");
                message.list = $root.proto.LibraryListMessage.fromObject(object.list);
            }
            if (object.index != null) {
                if (typeof object.index !== "object")
                    throw TypeError(".proto.Message.index: object expected");
                message.index = $root.proto.LibraryIndexMessage.fromObject(object.index);
            }
            if (object.metadata != null) {
                if (typeof object.metadata !== "object")
                    throw TypeError(".proto.Message.metadata: object expected");
                message.metadata = $root.proto.MetadataMessage.fromObject(object.metadata);
            }
            if (object.image != null) {
                if (typeof object.image !== "object")
                    throw TypeError(".proto.Message.image: object expected");
                message.image = $root.proto.ImageMessage.fromObject(object.image);
            }
            if (object.thumbnail != null) {
                if (typeof object.thumbnail !== "object")
                    throw TypeError(".proto.Message.thumbnail: object expected");
                message.thumbnail = $root.proto.ThumbnailMessage.fromObject(object.thumbnail);
            }
            return message;
        };

        /**
         * Creates a plain object from a Message message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.Message
         * @static
         * @param {proto.Message} message Message
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Message.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.id != null && message.hasOwnProperty("id")) {
                object.id = message.id;
                if (options.oneofs)
                    object._id = "id";
            }
            if (message.message != null && message.hasOwnProperty("message")) {
                object.message = message.message;
                if (options.oneofs)
                    object._message = "message";
            }
            if (message.error != null && message.hasOwnProperty("error")) {
                object.error = message.error;
                if (options.oneofs)
                    object._error = "error";
            }
            if (message.list != null && message.hasOwnProperty("list")) {
                object.list = $root.proto.LibraryListMessage.toObject(message.list, options);
                if (options.oneofs)
                    object.msg = "list";
            }
            if (message.index != null && message.hasOwnProperty("index")) {
                object.index = $root.proto.LibraryIndexMessage.toObject(message.index, options);
                if (options.oneofs)
                    object.msg = "index";
            }
            if (message.metadata != null && message.hasOwnProperty("metadata")) {
                object.metadata = $root.proto.MetadataMessage.toObject(message.metadata, options);
                if (options.oneofs)
                    object.msg = "metadata";
            }
            if (message.image != null && message.hasOwnProperty("image")) {
                object.image = $root.proto.ImageMessage.toObject(message.image, options);
                if (options.oneofs)
                    object.msg = "image";
            }
            if (message.thumbnail != null && message.hasOwnProperty("thumbnail")) {
                object.thumbnail = $root.proto.ThumbnailMessage.toObject(message.thumbnail, options);
                if (options.oneofs)
                    object.msg = "thumbnail";
            }
            return object;
        };

        /**
         * Converts this Message to JSON.
         * @function toJSON
         * @memberof proto.Message
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Message.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for Message
         * @function getTypeUrl
         * @memberof proto.Message
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        Message.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/proto.Message";
        };

        return Message;
    })();

    return proto;
})();

export { $root as default };
