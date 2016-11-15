## The Infinite Drum Machine
Thousands of everyday sounds, organized using machine learning.

## About

Sounds are complex and vary widely. This experiment uses machine learning to organize thousands of everyday sounds. The computer wasn’t given any descriptions or tags – only the audio. Using a technique called t-SNE, the computer placed similar sounds closer together. You can use the map to explore neighborhoods of similar sounds and even make beats using the drum sequencer.

[https://aiexperiments.withgoogle.com/drum-machine](https://aiexperiments.withgoogle.com/drum-machine)

This is not an official Google product.

## Credits

Built by [Kyle McDonald](https://github.com/kylemcdonald), [Manny Tan](https://github.com/mannytan), [Yotam Mann](https://github.com/tambien), and friends at [Google Creative Lab](https://github.com/googlecreativelab/). Thanks to [The Philharmonia Orchestra, London](http://www.philharmonia.co.uk/) for contributing some sounds to this project. Check out more at [A.I. Experiments] (https://aiexperiments.withgoogle.com).

## Overview

This application is the visualizer and drum machine from [this site](https://aiexperiments.withgoogle.com/drum-machine). In this repo you will find all of the front-end code which visualizes, plays back and makes beats with the audio samples, though it does not contain any audio files or the t-SNE generated from those audio files. You can do that with your own samples by following some of the resources below. 

## Installation

To build the client-side javascript, first install [node](https://nodejs.org) and [webpack](https://webpack.github.io/). Then you can install of the dependencies and build the files by typing the following in the terminal: 

```bash
npm install
webpack -p
```

## Creating t-SNE Map

If you have a large audio dataset, you can convert your sounds to t-SNE map using some of the python scripts found in Kyle McDonald's [AudioNotebooks](https://github.com/kylemcdonald/AudioNotebooks) repo. Our t-SNE was made by running the following scripts: 

First we collect all of our audio files into a single numpy array using `Collect Samples.ipynb` and created one large wave file from all of the audio `Samples to Audio Spritesheet.ipynb`. Then we generated audio fingerprints and turn the fingerprints into a t-SNE map by running `Samples to Fingerprints.ipynb` and then `Fingerprint to t-SNE.ipynb`. 

The t-SNE data is put into two TSV files. One has all of the 2D coordinates, and the second has is the t-SNE but projected into 3D space instead of 2D. In our experiment use the 2D coordinates for the position on the map and the 3D coordinates for the color of the data point. 

In the `scripts` folder is some more scripts that we used for processing the audio and t-SNE data for our application. To make these sounds work better as a drum machine, we ran an analysis on all of the sounds comparing them to a traditional kick, snare, open and closed hihat using [librosa](https://github.com/librosa/librosa). You can see this script in `scripts/analysis.py`. This generates a TSV with values for the "distance" of each of our audio samples from these drum reference sounds. Using `scripts/sort_sounds.py`, you can create a JSON structure the most similar sounds to these reference sounds. This array is used for picking some random defaults when users first open the experiment and the `analysis.tsv` is used for sorting the rest of the sounds into the 4 drum parts when a user clicks the "random" button with a filter in the search box. 

To deploy our audio files and data in our experiment, we ran two additional step: first we separated our very large single wave file into many small mp3s to make loading faster and so that it was playable even if all of the sounds weren't loaded yet. And second we created matching JSON meta files for each of the audio chunks which included the position data, color data, analysis data and meta data (this is specific to our audio set which also included a lot of meta data tags). 

## License

Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
