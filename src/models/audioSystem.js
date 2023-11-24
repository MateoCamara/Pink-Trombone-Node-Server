let fs = require('fs');

class AudioSystem {
    constructor(glottis, tract, touches) {
        this.glottis = glottis;
        this.tract = tract;
        this.touches = touches;
    }

    createWhiteNoise(length) {
        let whiteNoise = new ArrayBuffer(length);
        for (let i = 0; i < length; i++) {
            whiteNoise[i] = Math.random();
        }
        return whiteNoise;
    }

    startSound(length) {
        let BiquadFilter = require('../controllers/biquadFilter');
        let whiteNoise = this.createWhiteNoise(length);
        let aspireFilter = new BiquadFilter(500, 0.5);
        let fricativeFilter = new BiquadFilter(1000, 0.5);
        let aspireOutput = aspireFilter.bandpass(whiteNoise);
        let fricativeOutput = fricativeFilter.bandpass(whiteNoise);

        return this.pt_processor(aspireOutput, fricativeOutput, length)
    }

    pt_processor(aspireOutput, fricativeOutput, length) {
        let output = new ArrayBuffer(length);

        this.tract.touches = [this.touches[0][0], this.touches[0][1], this.touches[0][2], this.touches[0][4]]
        this.tract.handleTouches();
        this.glottis.handleTouches([this.touches[0][3]]);

        for (let i = 0; i < length; i++) {
            let lambda1 = (i % 512) / 512
            let lambda2 = (i % 512 + 0.5) / 512

            let glottalOutput = this.glottis.runStep(lambda1, aspireOutput[i]);
            let vocalOutput = 0;
            this.tract.runStep(glottalOutput, fricativeOutput[i], lambda1);
            vocalOutput += this.tract.lipOutput + this.tract.noseOutput;
            this.tract.runStep(glottalOutput, fricativeOutput[i], lambda2);
            vocalOutput += this.tract.lipOutput + this.tract.noseOutput;

            output[i] = vocalOutput * 0.125;

            if (i % 512 === 511) {
                let index = Math.ceil(i / 512)
                if (index < this.touches.length) {
                    this.tract.touches = [this.touches[index][0], this.touches[index][1], this.touches[index][2], this.touches[index][4]]
                    this.tract.handleTouches();
                    this.glottis.handleTouches([this.touches[index][3]]);
                    this.glottis.finishBlock();
                    this.tract.finishBlock();
                }
            }
        }
        return output;
    }
}

module.exports = AudioSystem;