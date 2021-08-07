import { Writable } from "stream";

class MockWritable extends Writable {
    public result: string = '';
    public bufferResult: Buffer = Buffer.from('');
    _write(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
        if((encoding as any) === 'buffer') {
            
            this.bufferResult = Buffer.concat([this.bufferResult, chunk])
        } else {
            this.result += chunk.toString();
        }
        callback()
    }

}

const writableMock = () => new MockWritable();


export { writableMock }