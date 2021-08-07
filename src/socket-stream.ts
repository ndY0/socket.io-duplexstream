import { Duplex, DuplexOptions } from "stream";
import {Socket as ClientSocket} from 'socket.io-client'
import {Socket as ServerSocket} from 'socket.io'
import { v1 } from "uuid";

class SocketStream extends Duplex {
    private uuid: string = v1();
    private isDistantWritable: boolean = true;
    constructor(private sio: ClientSocket | ServerSocket, opt?: DuplexOptions & {id?: string}) {
        super(opt);
        // retrieve remote stream id if present
        this.uuid = opt?.id || this.uuid;
        //handle distant stream events
        sio.on(`@stream/${this.uuid}/end`, this.handleDistantEnd);
        sio.on(`@stream/${this.uuid}/error`, this.handleDistantError);

        //send local stream events to distant
        this.on("end", this.handleLocalEnd);
        this.on("error", this.handleLocalError);

        // on writable side, propagate source end event
        this.on('pipe', <T extends NodeJS.ReadableStream>(source: T) => {
            source.on("end", () => {
                this.sio.emit(`@stream/${this.uuid}/data`, {chunk: null, encoding: 'buffer'}, this.handleDistantDataAck);
            })
        })

        // on data from remote, push it to local as readable, use ack to retrieve backpressure
        sio.on(`@stream/${this.uuid}/data`, this.handleDistantData);

    }
    _destroy() {
        // remove every socket subscriptions, avoid memory leak
        this.sio.off(`@stream/${this.uuid}/end`, this.handleDistantEnd);
        this.sio.off(`@stream/${this.uuid}/error`, this.handleDistantError);
        this.sio.off(`@stream/${this.uuid}/data`, this.handleDistantData);
    }
    // write to distant, use acknoledgment to retrieve backpressure
    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        if(! this.isDistantWritable) {
            this.sio.once(`@stream/${this.uuid}/distant_drain`, () => {
                this.sio.emit(`@stream/${this.uuid}/data`, {chunk, encoding}, this.handleDistantDataAck);
                callback(null);    
            })
        } else {
            this.sio.emit(`@stream/${this.uuid}/data`, {chunk, encoding}, this.handleDistantDataAck);
            callback(null);
        }
    }
    _read() {
        return true;
    }
    public pipe<T extends NodeJS.WritableStream>(destination: T, opt?: {end?: boolean}): T {
        // on readable side, propagate drain events, so that streaming can resume
        destination.on('drain', () => {
            this.sio.emit(`@stream/${this.uuid}/distant_drain`);
        })
        return super.pipe(destination, opt);
    }
    // on distant close, end local stream
    private handleDistantEnd = () => {
        this.end();
    };
    private handleDistantError = (err: Error) => {
        this.destroy(err);
    };
    private handleDistantData = ({chunk, encoding}: {chunk: Buffer, encoding: BufferEncoding}, ack: (isWritable: boolean) => void) => {
        ack(this.push(chunk, encoding));
    };

    private handleDistantDataAck = (isWritable: boolean) => {
        this.isDistantWritable = isWritable;
    }

    private handleLocalEnd = () => {
        this.sio.emit(`@stream/${this.uuid}/end`);
        this.destroy();
    }

    private handleLocalError = (err: Error) => {
        this.sio.emit(`@stream/${this.uuid}/error`, err);
    }

    public getUuid() {
        return this.uuid
    }
}
export {SocketStream}