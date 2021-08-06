import {Socket as ClientSocket} from 'socket.io-client'
import {Socket as ServerSocket} from 'socket.io'
import { decodeStream, encodeStream } from './stream-encoder';
import { SocketStream } from './socket-stream';

/**
 * 
 * @param sio todo
 */

const SocketProxyFactory = (sio: ServerSocket | ClientSocket) => {
    const wrappedSocket = new Proxy(sio, {
        get: (target: ServerSocket | ClientSocket, prop: string, receiver: any) => {
            if(prop === 'emit') {
                return (event: string, ...argz: any[]) => {
                    
                    return target.emit(event, ...argz.map((arg: any) => arg instanceof SocketStream ? encodeStream(arg) : arg));
                }
            } else if (prop === 'on') {
                return (event: string, listener: (...argz: any[]) => void) => {
                    const wrappedListener = (...argzz: any[]) => {
                        listener(...argzz.map((arg: any) => Object.keys(arg).every((key: string) => key === '@stream/uuid') ? decodeStream(arg, target) : arg))
                    }
                    return target.on(event, wrappedListener);
                }
            } else{
                return target[prop as keyof typeof target]
            }
        }
    })
}

export {SocketProxyFactory}