# Node.js Pink Trombone Synthesizer Server

## Introduction

This project includes a Node.js server that generates Pink Trombone audio waveforms based on user-defined parameters.
It's complemented by a Python test client to interact with the server.
The server's functionality includes an interpolation algorithm that allows for smooth transitions between different parameters.

The server is based on the [Pink Trombone](https://dood.al/pinktrombone/) synthesizer by Neil Thapen.

## Installation

### Prerequisites

- Node.js (latest stable version recommended)
- Python 3.x (in case you want to try out the test client)

### Setting Up the Node.js Server

1. **Clone the Repository (Optional):**
```bash
    git clone <repository-url>
    cd <repository-name>
    npm install
```

### Setting Up the Python Test Client

1. **Install Dependencies:**
```bash
    pip install numpy requests sounddevice
```

## Usage

### Starting the Node.js Server

1. **Start the Server:**
```bash
    node src/app.js
```

you can also specify a port to listen on:
```bash
    node src/app.js --port <port>
```

By default, the server listens on port 3000.

### Using the Python Test Client

1. **Start the Client:**
```bash
    python src/test/python/try_server.py
```
2. **Interact with the Server:**
The script sends requests to the server and plays the generated waveform using sound device.

## Acknowledgements

If you use this code in your project (star pls!), please include a reference to the following paper:

@article{camara2023optimization,
  title={Optimization Techniques for a Physical Model of Human Vocalisation},
  author={C{\'a}mara, Mateo and Xu, Zhiyuan and Zong, Yisu and Blanco, Jos{\'e} Luis and Reiss, Joshua D},
  journal={arXiv preprint arXiv:2309.14761},
  year={2023}
}

Feel free to reach me!




