import { Readable, ReadableOptions } from "stream";

class BlobReadStream extends Readable {
    private offset: number = 0;
    private size: number;
    constructor(private blob: Blob, opt?: ReadableOptions) {
        super(opt);
        this.size = blob.size;
    }
    _read(size: number): void {
        let isLast = false;
        const newOffset = this.offset + size > this.size ? this.size : this.offset + size;
        const chunk = this.blob.slice(this.offset, newOffset);
        this.offset = newOffset;
        if(this.size === this.offset) {
            isLast = true;
        }
        chunk.arrayBuffer().then((data: ArrayBuffer) => {
            this.push(Buffer.from(data));
            if(isLast) {
                this.push(null);
            }
        })
    }
    _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
        delete this.blob
        error ? callback(error) : callback();
    }
}
export {BlobReadStream}