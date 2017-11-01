/* Thanks to Thibault Imbert article https://typedarray.org/from-microphone-to-wav-with-getusermedia-and-web-audio/
and the Wave File Format specification http://tiny.systems/software/soundProgrammer/WavFormatDocs.pdf
Small changes made to record only one channel(mono) cause I'll be recording mic only.*/

let WavRecorder = {

    available: false,
    sampleRate: null,
    volume: 1,
    channel: [],
    recordingLenght: 0,
    recording: false,

    init() {
        navigator.mediaDevices.getUserMedia({audio: true, video: false})
            .then(WavRecorder.success)
            .catch((e) => {
                alert('Audio capture not supported in this browser.')
            });
    },

    success(stream) {
        // creates the audio context
        window.AudioContext = window.AudioContext || window.webKitAudioContext;
        let wr = WavRecorder;
        wr.available = true;
        let audioCtx = new AudioContext();

        // we query the context sample rate (varies depending on platforms)
        wr.sampleRate = audioCtx.sampleRate;

        /* From the spec: This value controls how frequently the audioprocess event is 
        dispatched and how many sample-frames need to be processed each call. 
        Lower values for buffer size will result in a lower (better) latency. 
        Higher values will be necessary to avoid audio breakup and glitches */
        let bufferSize = 2048;
        let recorder = audioCtx.createScriptProcessor(bufferSize, 2, 2);

        recorder.onaudioprocess = (e) => {
            if (!wr.recording) return;
            let data = e.inputBuffer.getChannelData(0);
            // we clone the samples
            wr.channel.push(new Float32Array(data));
            wr.recordingLength += bufferSize;
        }

        // creates an audio node from the microphone incoming stream
        let audioInput = audioCtx.createMediaStreamSource(stream);
        // we connect the recorder
        audioInput.connect(recorder);
        recorder.connect(audioCtx.destination);
    },

    start() {
        this.recording = true;
        // reset the buffers for the new recording
        this.channel = [];
        this.recordingLength = 0;
    },

    cancel() {
        this.recording = false;
    },

    stop() {
        // we stop recording
        this.recording = false;

        // we flat the channel
        let channel = this.mergeBuffers(this.channel, this.recordingLength);
        
        // we create our wav file
        let buffer = new ArrayBuffer(44 + channel.length * 2);
        let view = new DataView(buffer);
        
        // RIFF chunk descriptor
        this.writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + channel.length * 2, true);
        this.writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        this.writeUTFBytes(view, 12, 'fmt ');
        // Size of the sub-chunk
        view.setUint32(16, 16, true);
        // PCM format (1)
        view.setUint16(20, 1, true);
        // mono (1 channel)
        view.setUint16(22, 1, true);
        // sample rate
        view.setUint32(24, this.sampleRate, true);
        // byte rate = sample rate * num channels(1) * bitsPerSample(16)/8
        view.setUint32(28, this.sampleRate * 2, true);
        // block align = num channels * bitsPerSample/8
        view.setUint16(32, 2, true);
        // bits per sample
        view.setUint16(34, 16, true);
        // data sub-chunk
        this.writeUTFBytes(view, 36, 'data');
        view.setUint32(40, channel.length * 2, true);
        
        // write the PCM samples
        let lng = channel.length;
        let index = 44;
        let volume = this.volume;
        for (let i = 0; i < lng; ++i){
            view.setInt16(index, channel[i] * (0x7FFF * volume), true);
            index += 2;
        }
        
        // our final binary blob
        let blob = new Blob([view], {type: 'audio/wav'});
        return blob;
    },

    mergeBuffers(channelBuffer, recordingLength) {
        let result = new Float32Array(recordingLength);
        let offset = 0;
        let lng = channelBuffer.length;
        for (let i = 0; i < lng; ++i){
            let buffer = channelBuffer[i];
            result.set(buffer, offset);
            offset += buffer.length;
        }
        return result;
    },
      
    writeUTFBytes(view, offset, string) { 
        let lng = string.length;
        for (let i = 0; i < lng; ++i){
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

}