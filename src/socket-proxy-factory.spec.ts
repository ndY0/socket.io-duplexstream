import { Socket } from "socket.io";
import { mockSocket } from "../mock/socket";
import { SocketProxyFactory } from "./socket-proxy-factory"
import { SocketStream } from "./socket-stream";
import { encodeStream } from "./stream-encoder";

describe("SocketProxyFactory", () => {
    let socketMock: Socket;
    beforeEach(() => {
        socketMock = mockSocket() as unknown as Socket;
    })
    afterEach(() => {
        jest.resetAllMocks();
    })
    afterAll(() => {
        jest.clearAllMocks();
    })
    it("should wrap emit of socket and encode every instance of stream it finds", () => {
        const wrapped = SocketProxyFactory(socketMock as unknown as Socket);
        const stream1 = new SocketStream(wrapped);
        const stream2 = new SocketStream(wrapped);
        wrapped.emit("test", stream1, stream2, {filename: "test.txt"});
        expect(socketMock.emit).toHaveBeenCalledTimes(1);
        expect(socketMock.emit).toHaveBeenNthCalledWith(1, "test", encodeStream(stream1), encodeStream(stream2), {filename: "test.txt"})
    })
    it("should wrap on of socket and decode every instance of stream it finds", (done) => {
        const wrapped = SocketProxyFactory(socketMock as unknown as Socket);
        const stream1 = new SocketStream(wrapped);
        const stream2 = new SocketStream(wrapped);
        wrapped.on("test", (stream1: SocketStream, stream2: SocketStream, data: any) => {
            expect(stream1).toBeInstanceOf(SocketStream);
            expect(stream2).toBeInstanceOf(SocketStream);
            expect(data).toEqual({filename: "test.txt"});
            done();
        });
        wrapped.emit("test", stream1, stream2, {filename: "test.txt"});
    })
    it("should wrap once of socket and decode every instance of stream it finds", (done) => {
        const wrapped = SocketProxyFactory(socketMock as unknown as Socket);
        const stream1 = new SocketStream(wrapped);
        const stream2 = new SocketStream(wrapped);
        wrapped.once("test", (stream1: SocketStream, stream2: SocketStream, data: any) => {
            expect(stream1).toBeInstanceOf(SocketStream);
            expect(stream2).toBeInstanceOf(SocketStream);
            expect(data).toEqual({filename: "test.txt"});
            done();
        });
        wrapped.emit("test", stream1, stream2, {filename: "test.txt"});
    })
    it("should return the original prop if not emit or on", () => {
        function test() {}
        const mock = {
            emit:() => {},
            on:() => {},
            id: test,
        }
        const wrapped = SocketProxyFactory(mock as unknown as Socket);
        expect(wrapped.id).toEqual(test)
    })
})