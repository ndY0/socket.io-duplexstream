import { Writable } from "stream";

class MockWritable extends Writable {
    public result: string = '';
    _write(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
        this.result += chunk.toString();
        callback()
    }

}

const writableMock = () => new MockWritable();


export { writableMock }