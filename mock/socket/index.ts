import EventEmitter = require("events");

class MockSocket extends EventEmitter {
    emit = jest.fn((event: string | symbol, ...data: any[]) => {
        return super.emit(event, ...data)
    })
    on = jest.fn((event: string | symbol, handler: (...args: any[]) => void) => {
        return super.on(event, handler)
    })
}
const mockSocket = () => new MockSocket();

export { mockSocket }