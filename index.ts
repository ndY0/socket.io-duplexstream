import { DuplexOptions, ReadableOptions } from "stream";
import {Socket as ClientSocket} from 'socket.io-client'
import {Socket as ServerSocket} from 'socket.io'
import { BlobReadStream } from "./src/blob-read-stream";
import { SocketProxyFactory } from "./src/socket-proxy-factory";
import { SocketStream } from "./src/socket-stream";

const createBlobReadStream = (blob: Blob, opt?: ReadableOptions) => new BlobReadStream(blob, opt);
const createStream = (sio: ClientSocket | ServerSocket, opt?: DuplexOptions & {id?: string})  => new SocketStream(opt);

export default SocketProxyFactory;
export { createBlobReadStream, createStream };
