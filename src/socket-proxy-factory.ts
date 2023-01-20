import {Socket as ClientSocket} from 'socket.io-client'
import {Socket as ServerSocket} from 'socket.io'
import { decodeStream, encodeStream } from './stream-encoder';
import { SocketStream } from './socket-stream';

const SocketProxyFactory = <T extends ServerSocket | ClientSocket>(sio: T): T => {

    return new Proxy(sio, {
        get: (target: ServerSocket | ClientSocket, prop: string) => {
            if(prop === 'emit') {
                return (event: string, ...argz: any[]) => {
                    
                    return target.emit(event, ...argz.map((arg: any) => arg instanceof SocketStream ? encodeStream(arg, target) : arg));
                }
            } else if (prop === 'on') {
                return (event: string, listener: (...argz: any[]) => void) => {
                    const wrappedListener = (...argzz: any[]) => {
                        listener(...argzz.map((arg: any) => arg && Object.keys(arg).every((key: string) => key === '@stream/uuid') ? decodeStream(arg, target) : arg))
                    }
                    return target.on(event, wrappedListener);
                }
            } else if (prop === 'once') {
                return (event: string, listener: (...argz: any[]) => void) => {
                    const wrappedListener = (...argzz: any[]) => {
                        listener(...argzz.map((arg: any) => arg && Object.keys(arg).every((key: string) => key === '@stream/uuid') ? decodeStream(arg, target) : arg))
                    }
                    return target.once(event, wrappedListener);
                }
            } 
            return target[prop as keyof typeof target]
        }
    }) as T
}

export {SocketProxyFactory}