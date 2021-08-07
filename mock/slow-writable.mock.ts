import { Writable } from "stream";

class MockSlowWritable extends Writable {
    public result: string = '';
    public bufferResult: Buffer = Buffer.from('');
    constructor() {
        super({
            highWaterMark: 1000
        })
    }
    _write(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
        if((encoding as any) === 'buffer') {
            
            this.bufferResult = Buffer.concat([this.bufferResult, chunk])
        } else {
            this.result += chunk.toString();
        }
        // simulate slow processing
        new Promise((resolve) => setTimeout(resolve, 200)).then(() => {
            callback()
        })
    }

}

const slowWritableMock = () => new MockSlowWritable();


export { slowWritableMock }