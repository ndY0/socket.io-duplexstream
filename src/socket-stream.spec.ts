import { Blob as NodeBlob } from "buffer";
import { Manager } from "socket.io-client";
import { Server, Socket } from "socket.io";
import { SocketStream } from "./socket-stream";
import "reflect-metadata";
import { Duplex } from "stream";
import { readFileSync } from "fs";
import { BlobReadStream } from "./blob-read-stream";
import { writableMock } from "../mock/writable.mock";
import { SocketProxyFactory } from "./socket-proxy-factory";

describe("SocketStream", () => {
    let stream: SocketStream;
    afterEach(() => {
        stream = null;
    })
    it(`should initialize as child class of Duplex, create a unique identifier, reference the provided socket,
        and register event on itself and the socket connection for a client socket.
        all socket registration should be deleted upon stream destuction`, (done) => {
            const manager = new Manager("http://localhost:8080", {
                autoConnect: false
            })
            const sio = manager.socket('/test');
            const stream = new SocketStream(sio);
            expect(stream).toBeInstanceOf(Duplex);
            expect(typeof Reflect.get(stream, "uuid")).toEqual("string");
            expect(Reflect.get(stream, "sio")).toEqual(sio);
            expect(Reflect.get(stream, "isDistantWritable")).toBeTruthy();
            expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/error`)).toContain(Reflect.get(stream, 'handleDistantError'));
            expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/end`)).toContain(Reflect.get(stream, 'handleDistantEnd'));
            expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/data`)).toContain(Reflect.get(stream, 'handleDistantData'));
            expect(stream.listeners(`error`)).toContain(Reflect.get(stream, 'handleLocalError'));

            stream.destroy();
            expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/error`).length).toEqual(0);
            expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/end`).length).toEqual(0);
            expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/data`).length).toEqual(0);
            sio.close();
            done()
        })
        it(`should initialize as child class of Duplex, create a unique identifier, reference the provided socket,
        and register event on itself and the socket connection for a server socket.
        all socket registration should be deleted upon stream destuction`, (done) => {
            const server = new Server(3000);
            server.on("connection", (sio: Socket) => {
                
                const stream = new SocketStream(sio);
                expect(stream).toBeInstanceOf(Duplex);
                expect(typeof Reflect.get(stream, "uuid")).toEqual("string");
                expect(Reflect.get(stream, "sio")).toEqual(sio);
                expect(Reflect.get(stream, "isDistantWritable")).toBeTruthy();
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/end`)).toContain(Reflect.get(stream, 'handleDistantEnd'));
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/error`)).toContain(Reflect.get(stream, 'handleDistantError'));
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/data`)).toContain(Reflect.get(stream, 'handleDistantData'));
                expect(stream.listeners(`end`)).toContain(Reflect.get(stream, 'handleLocalEnd'));
                expect(stream.listeners(`error`)).toContain(Reflect.get(stream, 'handleLocalError'));

                stream.destroy();
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/end`).length).toEqual(0);
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/error`).length).toEqual(0);
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/data`).length).toEqual(0);
                server.close();
                clientSio.close();
                done();
            });
            const manager = new Manager("http://localhost:3000")
            const clientSio = manager.socket('/');
        })
        it("should allow to stream data from the client to the server, providing the encoding", (done) => {
            const server = new Server(3000);
            server.on("connection", (sio: Socket) => {
                
                SocketProxyFactory(sio).on("stream", (stream: SocketStream, data: any) => {
                    expect(data).toEqual({filename: "test.png"});
                    const writable = writableMock();
                    writable.on('close', () => {
                        blob.text().then((data: string) => {
                            expect(writable.bufferResult.length).toEqual(data.length);
                        })
                        server.close();
                        clientSio.close();
                        done();
                    })
                    stream.pipe(writable);
                })

                
            });
            const manager = new Manager("http://localhost:3000")
            const clientSio = SocketProxyFactory(manager.socket('/'));
            const stream = new SocketStream(clientSio);
            clientSio.emit("stream", stream, {filename: "test.png"});

            const fileBuffer: Buffer = readFileSync(`${process.cwd()}/mock/datasource/PNG_transparency_demonstration_2.png`);
            const blob = new NodeBlob([fileBuffer.toString()]);
            const blobReadStream = new BlobReadStream(blob as Blob);
            blobReadStream.pipe(stream);
        })
})