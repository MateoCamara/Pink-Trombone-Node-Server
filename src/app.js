const express = require('express');
const bodyParser = require('body-parser');
const audioController = require('./controllers/audioController');
const argv = require('yargs').argv;

// Express server setup
const app = express();
const PORT = argv.port || 3000; // Server port
const DEFAULT_SEGMENTS = 44; // Default number of segments (male voice)
const DEFAULT_LENGTH = 1; // Default length of the audio file in seconds

// BodyParser configuration for parsing POST request bodies
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// POST route for processing audio data
app.post("/pink-trombone", (req, res) => {
    const startTime = Date.now();
    const params = req.body;
    const lengthAudio = params['length'] || DEFAULT_LENGTH;
    const segments = params['n_segments'] || DEFAULT_SEGMENTS;
    delete params['length'];
    delete params['n_segments'];

    const controller = new audioController(segments);
    const output = controller.generateAudioFile(params, lengthAudio);
    res.json({output: output});

    const endTime = Date.now();
    console.log(`Processed audio in: ${endTime - startTime} ms`);
});

// Server initialization
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

module.exports = app; // For testing
