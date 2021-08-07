import { SocketStream } from "./socket-stream";
import { decodeStream, encodeStream } from "./stream-encoder";
import { Manager } from 'socket.io-client';
import { Server, Socket } from "socket.io";
import "reflect-metadata";

describe("serialization", () => {
    describe("encodeStream", () => {
        it("should transform a socket stream into it a shareable object", () => {
            expect(encodeStream({getUuid: () => '1291090192'} as SocketStream)).toEqual({'@stream/uuid': '1291090192'})
        })
    })
    describe("decodeStream", () => {
        it("should inflate an encoded stream, given it's representation and a client Socket", () => {
            const manager = new Manager("http://localhost:8080", {
                autoConnect: false
            })
            const sio = manager.socket('/test');
            const stream = decodeStream({'@stream/uuid': '1291090192'}, sio);
            expect(Reflect.get(stream, "uuid")).toEqual('1291090192');
            expect(stream).toBeInstanceOf(SocketStream);
        })
        it("should inflate an encoded stream, given it's representation and a server Socket", (done) => {
            const server = new Server(3005);
            server.on("connection", (sio: Socket) => {
                
                const stream = decodeStream({'@stream/uuid': '1291090192'}, sio);
                expect(Reflect.get(stream, "uuid")).toEqual('1291090192');
                expect(stream).toBeInstanceOf(SocketStream);
                server.close();
                clientSio.close();
                done();
            });
            const manager = new Manager("http://localhost:3005")
            const clientSio = manager.socket('/');
        })
    })
})