import { Blob as NodeBlob } from "buffer";
import { BlobReadStream } from "./blob-read-stream";
import "reflect-metadata";
import { writableMock } from "../mock/writable.mock";
import { longText } from "../mock/long-test";

describe("BlobReadStream", () => {
    let blob: Blob;
    beforeEach(() => {
        const buffer = Buffer.from(longText) as unknown as Blob
        blob = new NodeBlob([buffer]) as Blob;
    })
    it("should extends Readable, and have the blob and it's size as attributes", () => {
        const blobStream = new BlobReadStream(blob);
        expect(Reflect.get(blobStream, 'offset')).toEqual(0);
        expect(Reflect.get(blobStream, 'size')).toEqual(blob.size);
        expect(Reflect.get(blobStream, 'blob')).toEqual(blob);
    })
    it("should be pipeable to a writable stream, and stream the inner blob", (done) => {
        const blobStream = new BlobReadStream(blob);
        const writable = writableMock();
        writable.on("close", () => {
            expect(writable.bufferResult.toString('utf-8')).toEqual(longText)
            done();
        })
        blobStream.pipe(writable);
    })
    it("should be pipeable to a writable stream, and stream the inner blob, propagating errors if existing", (done) => {
        const blobStream = new BlobReadStream(blob);
        const writable = writableMock();
        blobStream.on("error", (err: Error) => {
            expect(err).toEqual(new Error('test'))
            done();
        })
        blobStream.pipe(writable);
        blobStream.destroy(new Error('test'))
    })
})