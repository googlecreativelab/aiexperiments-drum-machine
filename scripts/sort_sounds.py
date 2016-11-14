# Copyright 2016 Google Inc.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json

with open("./data/analysis.tsv") as analysis_file:
    analyses = analysis_file.read().split("\n")
    kick_like = []
    snare_like = []
    hh_like = []
    openhh_like = []
    for anl in analyses[:-1]:
        row = anl.split("\t")
        row = list(map(float, row))
        kick_like.append(row[0])
        snare_like.append(row[1])
        hh_like.append(row[2])
        openhh_like.append(row[3])

    most_kick_like = sorted(range(len(kick_like)), key=lambda k: kick_like[k])
    most_snare_like = sorted(range(len(snare_like)), key=lambda k: snare_like[k])
    most_hh_like = sorted(range(len(hh_like)), key=lambda k: hh_like[k])
    most_openhh_like = sorted(range(len(openhh_like)), key=lambda k: openhh_like[k])

    output_dict = dict()
    limit = 200
    output_dict["3"] = sorted(most_kick_like[:limit])
    output_dict["2"] = sorted(most_snare_like[:limit])
    output_dict["1"] = sorted(most_hh_like[:limit])
    output_dict["0"] = sorted(most_openhh_like[:limit])
    with open("./data/drum_like.json", "w") as drum_json:
        json.dump(output_dict, drum_json)
