import { Blob as NodeBlob } from "buffer";
import { Manager } from "socket.io-client";
import { Server, Socket } from "socket.io";
import { SocketStream } from "./socket-stream";
import "reflect-metadata";
import { Duplex, Readable } from "stream";
import { createReadStream, readFileSync, ReadStream } from "fs";
import { BlobReadStream } from "./blob-read-stream";
import { writableMock } from "../mock/writable.mock";
import { SocketProxyFactory } from "./socket-proxy-factory";
import { slowWritableMock } from "../mock/slow-writable.mock";

jest.setTimeout(100_000);

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
            expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/data`)).toContain(Reflect.get(stream, 'handleDistantData'));
            expect(stream.listeners(`error`)).toContain(Reflect.get(stream, 'handleLocalError'));

            stream.destroy();
            expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/error`).length).toEqual(0);
            expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/data`).length).toEqual(0);
            sio.close();
            done()
        })
        it(`should initialize as child class of Duplex, create a unique identifier, reference the provided socket,
        and register event on itself and the socket connection for a server socket.
        all socket registration should be deleted upon stream destuction`, (done) => {
            const server = new Server(3004);
            server.on("connection", (sio: Socket) => {
                
                const stream = new SocketStream(sio);
                expect(stream).toBeInstanceOf(Duplex);
                expect(typeof Reflect.get(stream, "uuid")).toEqual("string");
                expect(Reflect.get(stream, "sio")).toEqual(sio);
                expect(Reflect.get(stream, "isDistantWritable")).toBeTruthy();
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/error`)).toContain(Reflect.get(stream, 'handleDistantError'));
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/data`)).toContain(Reflect.get(stream, 'handleDistantData'));
                expect(stream.listeners(`error`)).toContain(Reflect.get(stream, 'handleLocalError'));

                stream.destroy();
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/error`).length).toEqual(0);
                expect(sio.listeners(`@stream/${Reflect.get(stream, "uuid")}/data`).length).toEqual(0);
                server.close();
                clientSio.close();
                done();
            });
            const manager = new Manager("http://localhost:3004")
            const clientSio = manager.socket('/');
        })
        it("should allow to stream data from the client to the server, in binary mode", (done) => {
            const server = new Server(3003);
            server.on("connection", (sio: Socket) => {
                
                SocketProxyFactory(sio).on("stream", (stream: SocketStream, data: any) => {
                    expect(data).toEqual({filename: "test.png"});
                    const writable = writableMock();
                    writable.on('close', () => {
                        expect(writable.bufferResult).toEqual(fileBuffer);
                        server.close();
                        clientSio.close();
                        done();
                    })
                    stream.pipe(writable);
                })

                
            });
            const manager = new Manager("http://localhost:3003")
            const clientSio = SocketProxyFactory(manager.socket('/'));
            const stream = new SocketStream(clientSio);
            clientSio.emit("stream", stream, {filename: "test.png"});

            const fileBuffer: Buffer = readFileSync(`${process.cwd()}/mock/datasource/PNG_transparency_demonstration_2.png`);
            const blob = new NodeBlob([fileBuffer]);
            const blobReadStream = new BlobReadStream(blob as Blob);
            blobReadStream.pipe(stream);
        })
        it("should allow to stream data from the server to the client, in binary mode", (done) => {
            const server = new Server(3002);
            server.on("connection", (sio: Socket) => {
                
                const fileStream: ReadStream = createReadStream(`${process.cwd()}/mock/datasource/PNG_transparency_demonstration_2.png`);
                const wrapped = SocketProxyFactory(sio)
                const stream = new SocketStream(wrapped);
                wrapped.emit("stream", stream, {filename: "test.png"});
                fileStream.pipe(stream);
            });
            const manager = new Manager("http://localhost:3002")
            const clientSio = SocketProxyFactory(manager.socket('/'));
            clientSio.on("stream", (stream: SocketStream, data: any) => {
                expect(data).toEqual({filename: "test.png"});
                const writable = writableMock();
                writable.on('close', () => {
                    expect(writable.bufferResult).toEqual(fileBuffer);
                    server.close();
                    clientSio.close();
                    done();
                })
                stream.pipe(writable);
            })
            const fileBuffer: Buffer = readFileSync(`${process.cwd()}/mock/datasource/PNG_transparency_demonstration_2.png`);
        })
        it("should allow to stream data from the client to the server, propagate error if occuring", (done) => {
            const server = new Server(3001);
            server.on("connection", (sio: Socket) => {
                
                SocketProxyFactory(sio).on("stream", (stream: SocketStream, data: any) => {
                    expect(data).toEqual({filename: "test.png"});
                    const writable = writableMock();
                    writable.on('error', (err: Error) => {
                        expect(err).toEqual(new Error("test"))
                        server.close();
                        clientSio.close();
                        done();
                    })
                    stream.pipe(writable);
                })

                
            });
            const manager = new Manager("http://localhost:3001")
            const clientSio = SocketProxyFactory(manager.socket('/'));
            const stream = new SocketStream(clientSio);
            clientSio.emit("stream", stream, {filename: "test.png"});
            const fileBuffer: Buffer = readFileSync(`${process.cwd()}/mock/datasource/PNG_transparency_demonstration_2.png`);
            const blob = new NodeBlob([fileBuffer]);
            const blobReadStream = new BlobReadStream(blob as Blob);
            blobReadStream.pipe(stream);
            blobReadStream.destroy(new Error("test"));
        })
        it("should allow to stream data from the server to the client, propagate error if occuring", (done) => {
            const server = new Server(3000);
            server.on("connection", (sio: Socket) => {
                
                const fileStream: ReadStream = createReadStream(`${process.cwd()}/mock/datasource/PNG_transparency_demonstration_2.png`);
                const wrapped = SocketProxyFactory(sio)
                const stream = new SocketStream(wrapped);
                wrapped.emit("stream", stream, {filename: "test.png"});
                fileStream.pipe(stream);
                fileStream.destroy(new Error("test"))
            });
            const manager = new Manager("http://localhost:3000")
            const clientSio = SocketProxyFactory(manager.socket('/'));
            clientSio.on("stream", (stream: SocketStream, data: any) => {
                expect(data).toEqual({filename: "test.png"});
                const writable = writableMock();
                writable.on('error', (err: Error) => {
                    expect(err).toEqual(new Error("test"))
                    server.close();
                    clientSio.close();
                    done();
                })
                stream.pipe(writable);
            })
            const fileBuffer: Buffer = readFileSync(`${process.cwd()}/mock/datasource/PNG_transparency_demonstration_2.png`);
        })
        it("should allow to stream data from the client to the server, in binary mode, backpressuring if needed", (done) => {
            const server = new Server(2999);
            server.on("connection", (sio: Socket) => {
                
                SocketProxyFactory(sio).on("stream", (stream: SocketStream, data: any) => {
                    expect(data).toEqual({filename: "test.png"});
                    const writable = slowWritableMock();
                    writable.on('close', () => {
                        expect(writable.bufferResult).toEqual(Buffer.concat(Array.from(Array(40).keys()).map(() => fileBuffer)));
                        server.close();
                        clientSio.close();
                        done();
                    })
                    stream.pipe(writable);
                })

                
            });
            const manager = new Manager("http://localhost:2999")
            const clientSio = SocketProxyFactory(manager.socket('/'));
            const stream = new SocketStream(clientSio, {writableHighWaterMark: 200});
            clientSio.emit("stream", stream, {filename: "test.png"});

            const fileBuffer: Buffer = readFileSync(`${process.cwd()}/mock/datasource/PNG_transparency_demonstration_2.png`);
            const blob = new NodeBlob(Array.from(Array(40).keys()).map(() => fileBuffer));
            const blobReadStream = new BlobReadStream(blob as Blob);
            blobReadStream.pipe(stream);
        })
        it("should allow to stream data from the server to the client, in binary mode, backpressuring if needed", (done) => {
            const server = new Server(2998);
            server.on("connection", (sio: Socket) => {
                
                const blob = new NodeBlob(Array.from(Array(40).keys()).map(() => fileBuffer));
                const blobReadStream = new BlobReadStream(blob as Blob);
                const wrapped = SocketProxyFactory(sio)
                const stream = new SocketStream(wrapped, {highWaterMark: 200});
                wrapped.emit("stream", stream, {filename: "test.png"});
                blobReadStream.pipe(stream);
            });
            const manager = new Manager("http://localhost:2998")
            const clientSio = SocketProxyFactory(manager.socket('/'));
            clientSio.on("stream", (stream: SocketStream, data: any) => {
                expect(data).toEqual({filename: "test.png"});
                const writable = slowWritableMock();
                writable.on('close', () => {
                    expect(writable.bufferResult).toEqual(Buffer.concat(Array.from(Array(40).keys()).map(() => fileBuffer)));
                    server.close();
                    clientSio.close();
                    done();
                })
                stream.pipe(writable);
            })
            const fileBuffer: Buffer = readFileSync(`${process.cwd()}/mock/datasource/PNG_transparency_demonstration_2.png`);
        })
})