import { Readable, ReadableOptions } from "stream";

class BlobReadStream extends Readable {
    private offset: number = 0;
    private size: number;
    constructor(private blob: Blob, opt?: ReadableOptions) {
        super(opt);
        this.size = blob.size;
    }
    _read(size: number): void {
        const newOffset = this.offset + size > this.size ? this.size : this.offset + size;
        const chunk = this.blob.slice(this.offset, newOffset);
            this.push(chunk, 'utf-8')
        this.offset = newOffset;
        if(this.offset === this.size) {
            this.push(null)
        }
    }
    _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
        delete this.blob
        error ? callback(error) : callback();
    }
}
export {BlobReadStream}