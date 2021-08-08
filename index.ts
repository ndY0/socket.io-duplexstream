import { DuplexOptions, ReadableOptions } from "stream";
import { BlobReadStream } from "./src/blob-read-stream";
import { SocketProxyFactory } from "./src/socket-proxy-factory";
import { SocketStream } from "./src/socket-stream";

const createBlobReadStream = (blob: Blob, opt?: ReadableOptions) => new BlobReadStream(blob, opt);
const createStream = (opt?: DuplexOptions & {id?: string})  => new SocketStream(opt);

export default SocketProxyFactory;
export { createBlobReadStream, createStream };
