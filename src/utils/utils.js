module.exports = {

    samplingRate: 48000,

    sleep: function (ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },

    interpolateParams: function (params, samplingRate, audioLength) {
        let numberOfSamples = Math.floor(samplingRate * audioLength / 512 + 1);
        let paramValues = {}

        function interpolateArray(data, fitCount) {

            const linearInterpolate = function (before, after, atPoint) {
                return before + (after - before) * atPoint;
            };

            const newData = [];
            const springFactor = Number((data.length - 1) / (fitCount - 1));
            newData[0] = data[0]; // for new allocation
            for (let i = 1; i < fitCount - 1; i++) {
                const tmp = i * springFactor;
                const before = Number(Math.floor(tmp)).toFixed();
                const after = Number(Math.ceil(tmp)).toFixed();
                const atPoint = tmp - before;
                newData[i] = linearInterpolate(data[before], data[after], atPoint);
            }
            newData[fitCount - 1] = data[data.length - 1]; // for new allocation
            return newData;
        }

        for (let paramKey of Object.keys(params)) {
            if (params[paramKey].length === 1) {
                paramValues[paramKey] = Array(numberOfSamples).fill(params[paramKey][0]);
            } else {
                paramValues[paramKey] = [];
                paramValues[paramKey] = interpolateArray(params[paramKey], numberOfSamples)
            }
        }

        return paramValues
    },

    sortValues: function (paramsInterpolated) {
        let content = []
        for (let i = 0; i < paramsInterpolated.frequency.length; i++) {
            content.push([[paramsInterpolated["tongue_index"][i], paramsInterpolated["tongue_diam"][i]],
                [paramsInterpolated["constriction_index"][i], paramsInterpolated["constriction_diam"][i]],
                [paramsInterpolated["lip_index"][i], paramsInterpolated["lip_diam"][i]],
                [paramsInterpolated["frequency"][i], paramsInterpolated["voiceness"][i]],
                [12.0, paramsInterpolated['throat_diam'][i]]
            ])
        }
        return content
    }

}