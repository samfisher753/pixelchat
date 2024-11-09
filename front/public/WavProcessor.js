class WavProcessor extends AudioWorkletProcessor {

    constructor() {
        super();
        this.recording = false;
        this.port.onmessage = (event) => {
            if (event.data === 'start') this.recording = true;
            else if (event.data === 'stop') this.recording = false;
        };
    }

    process(inputs) {
        if (!this.recording) return true;

        const input = inputs[0];
        if (input.length > 0) {
            const leftChannel = input[0];
            const rightChannel = input[1] || leftChannel;

            this.port.postMessage({ leftChannel, rightChannel });
        }

        return true;
    }
}

registerProcessor('wav-processor', WavProcessor);