import {Socket as ClientSocket} from 'socket.io-client'
import {Socket as ServerSocket} from 'socket.io'
import { EncodedStream } from "./interfaces/encoded-stream.interface";
import { SocketStream } from "./socket-stream";

const encodeStream = (stream: SocketStream): EncodedStream => {
    return {'@stream/uuid': stream.getUuid()};
}
const decodeStream = (deflated: EncodedStream, sio: ClientSocket | ServerSocket) => {
    return new SocketStream(sio, {id: deflated['@stream/uuid']});
}

export { encodeStream, decodeStream }