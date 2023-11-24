class BiquadFilter {
    constructor(frequency, Q) {
        this.sampleRate = 48000;
        this.frequency = frequency;
        this.Q = Q;
    }

    bandpass(inputs)
    {
        let w0 = 2 * Math.PI * this.frequency / this.sampleRate;
        let alpha = Math.sin(w0) / (2.0 * this.Q);
        let b0 = Math.sin(w0) / 2;
        let b1 = 0;
        let b2 = -Math.sin(w0) / 2;
        let a0 = 1 + alpha;
        let a1 = -2 * Math.cos(w0);
        let a2 = 1 - alpha;

        let y_p1 = 0;
        let y_p2 = 0;
        let x_p1 = 0;
        let x_p2 = 0;

        let outputs = new ArrayBuffer(inputs.byteLength);
        for (let i = 0; i < inputs.byteLength; i++){
            let x = inputs[i];
            let y = ((b0 * x + b1 * x_p1 + b2 * x_p2) - (a1 * y_p1 + a2 * y_p2)) / a0
            outputs[i] = y
            x_p2 = x_p1
            x_p1 = x
            y_p2 = y_p1
            y_p1 = y
        }
        return outputs
    }
}

module.exports = BiquadFilter;