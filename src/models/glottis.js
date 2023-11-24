let SimplexNoise = require("../utils/SimplexNoiseNode.js");

class Glottis {
    constructor() {
        this.sampleRate = 48000;
        this.timeInWaveform = 0;
        this.oldFrequency = 140;
        this.newFrequency = 140;
        this.UIFrequency = 140;
        this.smoothFrequency = 140;
        this.oldTenseness = 0.6;
        this.newTenseness = 0.6;
        this.UITenseness = 0.6;
        this.voiceness = 0;
        this.totalTime = 0;
        this.vibratoAmount = 0.005;
        this.vibratoFrequency = 6;
        this.intensity = 0;
        this.loudness = 1;

        this.isTouched = false;
        this.touch = 0;
        this.x = 240;
        this.y = 530;
        this.semitones = 20;
        this.baseNote = 87.3071;//F

        this.keyboardTop = 500;
        this.keyboardLeft = 0;
        this.keyboardWidth = 600;
        this.keyboardHeight = 100;

        this.noise = new SimplexNoise();

        this.setup_waveform(0);
    }

    handleTouches(touches) {

        this.UIFrequency = touches[0][0];
        this.voiceness = touches[0][1];
        this.UITenseness = 1 - Math.cos(this.voiceness * Math.PI * 0.5);
        this.loudness = Math.pow(this.UITenseness, 0.25);
    }

    setup_waveform(lambda) {
        this.frequency = this.oldFrequency * (1 - lambda) + this.newFrequency * lambda;
        let tenseness = this.oldTenseness * (1 - lambda) + this.newTenseness * lambda;
        this.Rd = 3 * (1 - tenseness);
        this.waveformLength = 1.0 / this.frequency;

        let Rd = this.Rd;
        if (Rd < 0.5) Rd = 0.5;
        if (Rd > 2.7) Rd = 2.7;
        // normalized to time = 1, Ee = 1
        let Ra = -0.01 + 0.048 * Rd;
        let Rk = 0.224 + 0.118 * Rd;
        let Rg = (Rk / 4) * (0.5 + 1.2 * Rk) / (0.11 * Rd - Ra * (0.5 + 1.2 * Rk));

        let Ta = Ra;
        let Tp = 1 / (2 * Rg);
        let Te = Tp + Tp * Rk; //

        let epsilon = 1 / Ta;
        let shift = Math.exp(-epsilon * (1 - Te));
        let Delta = 1 - shift; //divide by this to scale RHS

        let RHSIntegral = (1 / epsilon) * (shift - 1) + (1 - Te) * shift;
        RHSIntegral = RHSIntegral / Delta;

        let totalLowerIntegral = -(Te - Tp) / 2 + RHSIntegral;
        let totalUpperIntegral = -totalLowerIntegral;

        let omega = Math.PI / Tp;
        let s = Math.sin(omega * Te);
        let y = -Math.PI * s * totalUpperIntegral / (Tp * 2);
        let z = Math.log(y);
        let alpha = z / (Tp / 2 - Te);
        let E0 = -1 / (s * Math.exp(alpha * Te));
        this.alpha = alpha;
        this.E0 = E0;
        this.epsilon = epsilon;
        this.shift = shift;
        this.Delta = Delta;
        this.Te = Te;
        this.omega = omega;
    }

    runStep(lambda) {
        let timeStep = 1.0 / this.sampleRate;
        this.timeInWaveform += timeStep;
        this.totalTime += timeStep;
        if (this.timeInWaveform > this.waveformLength) {
            this.timeInWaveform -= this.waveformLength;
            this.setup_waveform(lambda);
        }
        let out = this.normalizedLFWaveform(this.timeInWaveform / this.waveformLength);

        var tenseness = this.UITenseness;
        tenseness += 0.10 * this.noise.simplex1(this.totalTime * 0.46);
        tenseness += 0.05 * this.noise.simplex1(this.totalTime * 0.36);
        tenseness += (3 - tenseness) * (1 - this.intensity);

        let noise = (Math.random() * 2) - 1
        let aspiration = this.intensity * (1 - Math.sqrt(Math.max(tenseness, 0))) * this.getNoiseModulator() * noise;
        aspiration *= 0.02 * this.noise.simplex1(this.totalTime * 1.99) + 0.2;

        out += aspiration;
        return out;
    }

    getNoiseModulator() {
        let voiced = 0.1 + 0.2 * Math.max(0, Math.sin(Math.PI * 2 * this.timeInWaveform / this.waveformLength));
        return voiced + (1 - this.UITenseness * this.intensity) * 3;
    }

    normalizedLFWaveform(t) {
        let output;
        if (t > this.Te) {
            output = (-Math.exp(-this.epsilon * (t - this.Te)) + this.shift) / this.Delta;
        } else {
            output = this.E0 * Math.exp(this.alpha * t) * Math.sin(this.omega * t);
        }
        return output * this.intensity * this.loudness;
    }

    finishBlock() {
        let vibrato = 0;

        // vibrato += this.vibratoAmount * Math.sin(2*Math.PI * this.totalTime *this.vibratouency);
        // vibrato += 0.02 * this.noise2D(this.totalTime * 4.07 * 1.2, -this.totalTime * 4.07 * 0.7);
        // vibrato += 0.04 * this.noise2D(this.totalTime * 2.15 * 1.2, -this.totalTime * 2.15 * 0.7);

        if (this.UIFrequency > this.smoothFrequency)
            this.smoothFrequency = Math.min(this.smoothFrequency * 1.1, this.UIFrequency);
        if (this.UIFrequency < this.smoothFrequency)
            this.smoothFrequency = Math.max(this.smoothFrequency / 1.1, this.UIFrequency);
        this.oldFrequency = this.newFrequency;
        this.newFrequency = this.smoothFrequency * (1 + vibrato);
        this.oldTenseness = this.newTenseness;
        this.newTenseness = this.UITenseness + 0.1 * this.noise.simplex1(this.totalTime * 0.46) + 0.05 * this.noise.simplex1(this.totalTime * 0.36);
        if (!this.isTouched) {
            this.newTenseness += (3 - this.UITenseness) * (1 - this.intensity);
        }
        this.intensity += 0.13;
        let my_math = require('../utils/math')
        this.intensity = my_math.clamp(this.intensity, 0, 1);
    }
}

module.exports = Glottis