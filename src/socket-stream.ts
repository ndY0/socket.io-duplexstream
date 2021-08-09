import { Duplex, DuplexOptions, Writable } from "stream";
import {Socket as ClientSocket} from 'socket.io-client'
import {Socket as ServerSocket} from 'socket.io'
import { v1 } from "uuid";

class SocketStream extends Duplex {
    private uuid: string = v1();
    private sio: ClientSocket | ServerSocket;
    private isDistantWritable: boolean = true;
    private isLocalWritable: boolean = true;
    private isDistantReady: boolean = false;
    constructor(opt?: DuplexOptions & {id?: string}) {
        super(opt);
        // retrieve remote stream id if present
        this.uuid = opt?.id || this.uuid;
        //handle distant stream events
        // sio.on(`@stream/${this.uuid}/error`, this.handleDistantError);

        //send local stream events to distant
        this.on("error", this.handleLocalError);
        // this.on('pipe', <T extends NodeJS.ReadableStream>(source: T) => {
        //     // on writable side, propagate end source event
        //     source.on("end", () => {
        //         this.sio.emit(`@stream/${this.uuid}/data`, {chunk: null, encoding: 'buffer'}, this.handleDistantDataAck);
        //     })
        //     // on writable side, propagate error source event
        //     source.on('error', this.handleLocalError)
        // })
        // // this.on("drain", this.handleLocalDrain);

        // // on data from remote, push it to local as readable, use ack to retrieve backpressure
        // sio.on(`@stream/${this.uuid}/data`, this.handleDistantData);

    }

    public initialize(sio: ClientSocket | ServerSocket): SocketStream {
        this.sio = sio;

        //handle distant stream events
        sio.on(`@stream/${this.uuid}/error`, this.handleDistantError);

        this.on('pipe', <T extends NodeJS.ReadableStream>(source: T) => {
            // on writable side, propagate end source event
            source.on("end", () => {
                this.sio.emit(`@stream/${this.uuid}/data`, {chunk: null, encoding: 'buffer'}, this.handleDistantDataAck);
            })
            // on writable side, propagate error source event
            source.on('error', this.handleLocalError)
        })
        // this.on("drain", this.handleLocalDrain);

        // on data from remote, push it to local as readable, use ack to retrieve backpressure
        sio.on(`@stream/${this.uuid}/data`, this.handleDistantData);
        return this;
    }

    _destroy() {
        // remove every socket subscriptions, avoid memory leak
        this.sio.off(`@stream/${this.uuid}/error`, this.handleDistantError);
        this.sio.off(`@stream/${this.uuid}/data`, this.handleDistantData);
    }
    // write to distant, use acknoledgment to retrieve backpressure
    _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        // on distant drain, send more
        if(! this.isDistantWritable) {
            this.sio.once(`@stream/${this.uuid}/drain`, this.handleDistantDrain(chunk, encoding, callback))
        // on distant ready signal, start pushing
        } else if (! this.isDistantReady) {
            this.sio.once(`@stream/${this.uuid}/start`, this.handleDistantReady(chunk, encoding, callback))
            // push otherwise
        } else {
            this.sio.emit(`@stream/${this.uuid}/data`, {chunk, encoding}, this.handleDistantDataAck);
            callback(null);
        }
    }
    _read() {
        return true;
    }
    public pipe<T extends NodeJS.WritableStream>(destination: T, opt?: {end?: boolean}): T {

        // upon reading, signal drain to distant. must be done here to be readable side ony
        this.on("data", () => {
            if(!this.isLocalWritable) {
                this.sio.emit(`@stream/${this.uuid}/drain`);
                this.isLocalWritable = true;
            }
        })
        // on readable side local error, propagate to destination
        this.on('error', (err: Error) => (destination as unknown as Writable).destroy(err));
        // send ready to distant
        this.sio.emit(`@stream/${this.uuid}/start`);
        return super.pipe(destination, opt);
    }
    private handleDistantError = (name: string, message: string) => {
        const error = new Error(message)
        error.name = name;
        // must emit local error, then destory the stream
        this.emit('error', error);
        this.destroy(error);
    };
    private handleDistantData = ({chunk, encoding}: {chunk: Buffer, encoding: BufferEncoding}, ack: (isWritable: boolean) => void) => {
        const isLocalWritable = this.push(chunk, encoding)
        if(!isLocalWritable) {
            this.isLocalWritable = false;
            ack(isLocalWritable);
        }
    };
    private handleDistantReady = (chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) => {
        return () => {
            this.isDistantReady = true;
            this.sio.emit(`@stream/${this.uuid}/data`, {chunk, encoding}, this.handleDistantDataAck);
            callback(null);
        }
    }
    private handleDistantDrain = (chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) => {
        return () => {
            this.isDistantWritable = true;
            this.sio.emit(`@stream/${this.uuid}/data`, {chunk, encoding}, this.handleDistantDataAck);
            callback(null);
        }
    }
    private handleDistantDataAck = (isWritable: boolean) => {
        this.isDistantWritable = isWritable;
    }

    private handleLocalError = (err: Error) => {
        this.sio.emit(`@stream/${this.uuid}/error`, err.name, err.message);
    }

    public getUuid() {
        return this.uuid
    }
}
export {SocketStream}