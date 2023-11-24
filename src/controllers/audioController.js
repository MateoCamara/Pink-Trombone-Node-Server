const Glottis = require("../models/glottis");
const Tract = require("../models/tract");
const AudioSystem = require("../models/audioSystem");
const {samplingRate, interpolateParams, sortValues} = require("../utils/utils");


class AudioController {
    constructor(nSegments = 44) {
        this.nSegments = nSegments;
    }

    // Function to generate the audio file
    vocalTract(positions, length, nSegments) {
        const myGlottis = new Glottis();
        const myTract = new Tract(myGlottis, nSegments);
        const myAudioSystem = new AudioSystem(myGlottis, myTract, positions);
        return myAudioSystem.startSound(length);
    }

    // Function to filter out the initial sound hit
    filterInitialSoundHit(content, samplingRate, paddingLength = 0.1) {
        if (paddingLength === 0) return content;

        const numberOfSamples = Math.floor(samplingRate * paddingLength / 512 + 1);
        const padding = content[0];
        const output = JSON.parse(JSON.stringify(content));

        for (let i = 0; i < numberOfSamples; i++) {
            output.unshift(padding);
        }
        return output;
    }

    // Function to generate the audio file
    generateAudioFile(params, lengthAudio, paddingLength = 0.2) {
        const paramsInterpolated = interpolateParams(params, samplingRate, lengthAudio);
        const content = sortValues(paramsInterpolated);
        let paddedContent = content;
        if (paddingLength !== 0) {
            paddedContent = this.filterInitialSoundHit(content, samplingRate, paddingLength);
        }
        const myGlottis = new Glottis();
        const myTract = new Tract(myGlottis, this.nSegments);
        const myAudioSystem = new AudioSystem(myGlottis, myTract, paddedContent);
        const audioLength = samplingRate * (lengthAudio + paddingLength)
        return myAudioSystem.startSound(audioLength);
    }
}

module.exports = AudioController;
