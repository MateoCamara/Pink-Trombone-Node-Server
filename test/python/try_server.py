import numpy as np
import requests
import sounddevice as sd


def convert_params_to_json(params, length, n_segments):
    param_names = [
        'frequency', 'voiceness', 'tongue_index', 'tongue_diam',
        'lip_diam', 'constriction_index', 'constriction_diam', 'throat_diam', 'lip_index'
    ]
    params_dict = {name: (value if type(value) is list else [value]) for name, value in zip(param_names, params)}
    params_dict['lip_index'] = [n_segments - 1] * len(params[0])
    params_dict['length'] = length
    params_dict['n_segments'] = n_segments
    return params_dict


def get_audio_from_params(params, length, lip_index):
    params_dict = convert_params_to_json(params, length, lip_index)
    return requests.post('http://localhost:3000/pink-trombone', json=params_dict)


if __name__ == '__main__':
    # Run male pink trombone
    params = [100, 1, 24, 3.2, 1.6, 30, 2, 2]
    length = 1.5
    n_segments = 44
    response = get_audio_from_params(params, length, n_segments)
    waveform = np.array(list(response.json()['output'].values()))
    waveform = waveform[int(48_000 * 0.2):]  # Delete the warm up

    sd.play(waveform, samplerate=48000, blocking=True)

    # Run Female Pink Trombone
    params = [130, 1, 24, 3.2, 1.6, 30, 2, 2]
    length = 1.5
    n_segments = 38
    response = get_audio_from_params(params, length, n_segments)
    waveform = np.array(list(response.json()['output'].values()))
    waveform = waveform[int(48_000 * 0.2):]  # Delete the warm up

    sd.play(waveform, samplerate=48000, blocking=True)

    # interpolate params

    params = [[100, 150], [1, 1], [24, 24], [3.2, 3.2], [1.6, 1.6], [30, 30], [2, 2], [2, 2]]

    length = 1.5
    n_segments = 38
    response = get_audio_from_params(params, length, n_segments)
    waveform = np.array(list(response.json()['output'].values()))
    waveform = waveform[int(48_000 * 0.2):]  # Delete the warm up

    sd.play(waveform, samplerate=48000, blocking=True)
