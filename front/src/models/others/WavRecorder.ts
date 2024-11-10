/* Thanks to Thibault Imbert article https://typedarray.org/from-microphone-to-wav-with-getusermedia-and-web-audio/
and the Wave File Format specification http://tiny.systems/software/soundProgrammer/WavFormatDocs.pdf */

class WavRecorder {
    available: boolean;
    sampleRate: number | null;
    volume: number;
    leftchannel: Float32Array[];
    rightchannel: Float32Array[];
    recordingLength: number;
    recording: boolean;
    audioCtx: AudioContext | null;
    workletNode: AudioWorkletNode | null;

    constructor() {
        this.available = false;
        this.sampleRate = null;
        this.volume = 1;
        this.leftchannel = [];
        this.rightchannel = [];
        this.recordingLength = 0;
        this.recording = false;
        this.audioCtx = null;
        this.workletNode = null;
    }

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            await this.success(stream);
        } catch {
            alert('Audio capture not supported in this browser.');
        }
    }

    async success(stream: MediaStream) {
        this.available = true;
        this.audioCtx = new AudioContext();
        await this.audioCtx.audioWorklet.addModule('WavProcessor.js'); // Add worklet

        this.sampleRate = this.audioCtx.sampleRate;
        this.workletNode = new AudioWorkletNode(this.audioCtx, 'wav-processor');
        this.workletNode.port.onmessage = (event) => {
            if (!this.recording) return;
            const { leftChannel, rightChannel } = event.data;
            this.leftchannel.push(new Float32Array(leftChannel));
            this.rightchannel.push(new Float32Array(rightChannel));
            this.recordingLength += leftChannel.length;
        };

        const audioInput = this.audioCtx.createMediaStreamSource(stream);
        audioInput.connect(this.workletNode);
        this.workletNode.connect(this.audioCtx.destination);
    }

    start() {
        this.recording = true;
        this.leftchannel = [];
        this.rightchannel = [];
        this.recordingLength = 0;
        this.workletNode?.port.postMessage('start');
    }

    cancel() {
        this.recording = false;
        this.workletNode?.port.postMessage('stop');
    }

    stop() {
        this.recording = false;
        this.workletNode?.port.postMessage('stop');

        const leftChannel = this.mergeBuffers(this.leftchannel, this.recordingLength);
        const rightChannel = this.mergeBuffers(this.rightchannel, this.recordingLength);
        const interleaved = this.interleave(leftChannel, rightChannel);

        let buffer = new ArrayBuffer(44 + interleaved.length * 2);
        let view = new DataView(buffer);

        // RIFF, FMT, and data chunk descriptors
        this.writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        this.writeUTFBytes(view, 8, 'WAVE');
        this.writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 2, true);
        view.setUint32(24, this.sampleRate!, true);
        view.setUint32(28, this.sampleRate! * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        this.writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        let index = 44;
        let volume = this.volume;
        for (let i = 0; i < interleaved.length; ++i) {
            view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
            index += 2;
        }

        return new Blob([view], { type: 'audio/wav' });
    }

    mergeBuffers(channelBuffer: Float32Array[], recordingLength: number) {
        const result = new Float32Array(recordingLength);
        let offset = 0;
        for (const buffer of channelBuffer) {
            result.set(buffer, offset);
            offset += buffer.length;
        }
        return result;
    }

    interleave(leftChannel: Float32Array, rightChannel: Float32Array) {
        const length = leftChannel.length + rightChannel.length;
        const result = new Float32Array(length);
        let index = 0;
        for (let i = 0; i < leftChannel.length; i++) {
            result[index++] = leftChannel[i];
            result[index++] = rightChannel[i];
        }
        return result;
    }

    writeUTFBytes(view: DataView, offset: number, text: string) {
        for (let i = 0; i < text.length; i++) {
            view.setUint8(offset + i, text.charCodeAt(i));
        }
    }
}

export const wavRecorder = new WavRecorder();