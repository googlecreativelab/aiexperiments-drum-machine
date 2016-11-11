## Synopsis

THE INFINITE DRUM MACHINE


## Installation

Original audio and tsne data are not provided. Please visit [AudioNotebooks](https://github.com/kylemcdonald/AudioNotebooks) to generate tsne data.

Data must be formatted to run splitter.py. Data files will be generated in output/meta/ as json. See sample.json for reference. Audio files will be generated in output/audio as concatenated mp3 files. Both mp3 and json files are named according to load, "aka chunk" order.

Install all npm modules required by package.json.
Install webpack and webpack-dev-server.

In terminal, run webpack-dev-server to run on localhost:8080 or webpack -p to build.


## Contributors

Built by [Kyle McDonald](https://github.com/kylemcdonald), [Manny Tan](https://github.com/mannytan), [Yotam Mann](https://github.com/tambien), and friends at [Google Creative Lab](https://github.com/googlecreativelab/). Thanks to [Berklee College of Music](http://wiki.laptop.org/go/Free_sound_samples/) and the [The Philharmonia Orchestra, London](http://www.philharmonia.co.uk/explore/make_music/) for contributing some sounds to this project. The open-source code is available [here](https://github.com/googlecreativelab/).

Check out more at [A.I. Experiments](https://aiexperiments.withgoogle.com/).

## Note
Third party directories may have different (non-Apache 2.0) licenses.


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