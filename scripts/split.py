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


from pydub import AudioSegment
import json
import os
import numpy
import math
import re
from AudioNotebooks import config

sounds = AudioSegment.from_wav("data/spritesheet.wav")

with open('data/filenames.txt') as file_name_file:    
    file_names = file_name_file.read().split("\n")[:-1]

seg_time = config.chunk_ms

num_samples = len(file_names)
num_of_top_tags = 50


num_chunks = config.chunks
min_split_size = 150

print(num_samples)

# generate a distribution whose sum is the total number of samples
for i in range(1000000):
    distribution = numpy.logspace(math.log(min_split_size, 10.0), math.log(min_split_size + i, 10.0), num=num_chunks, base=10.0, endpoint=True, dtype=int)
    if sum(distribution) >= num_samples:
        diff = sum(distribution) - num_samples
        # subtract the diference from the last one
        distribution[-1] -= diff
        break
print(sum(distribution))


def combine_json(data_file_names, data_tags, data_coords, data_colors, data_analyses):
    meta_data = []
    all_tags =[]
    all_tally =[]
    for index in range(len(data_tags)):
        tag_list = data_tags[index].split()
        tag_list = [i.upper() for i in tag_list]
        coord = data_coords[index].split()
        coord = [float(i) for i in coord]
        color = data_colors[index].split()
        color = [float(i) for i in color]
        analysis = data_analyses[index].split()
        analysis = [float(i) for i in analysis]
        meta_data.append({
            "tags" : tag_list,
            "color" : color,
            "coords" : coord,
            "analysis" : analysis,
            "name" : data_file_names[index],
        })
        # add the tags to the list
        for j in range(0, len(tag_list)):
            tag = tag_list[j].upper()
            if tag not in all_tags:
                all_tags.append(tag)
                all_tally.append(1)
            else:
                index = all_tags.index(tag)
                all_tally[index]+=1
    ordered_index_list = sorted(range(len(all_tally)), key=lambda x: all_tally[x])
    ordered_index_list = ordered_index_list[-num_of_top_tags:]
    ordered_index_list = ordered_index_list[::-1]
    autosuggest_list = []
    for k in range(0, len(ordered_index_list)):
        index = ordered_index_list[k]
        tag_dict = {}
        tag_dict[all_tags[index]] = all_tally[index]
        autosuggest_list.append(tag_dict)

    print("count: ", len(meta_data))
    return {
        "autoSuggest" : autosuggest_list,
        "metaData" : meta_data
    }

# the coordinates
with open('data/tsne/fingerprints.32.64.2d.tsv') as data_file:    
    coords = data_file.read().split("\n")

with open('data/tsne/fingerprints.32.64.3d.tsv') as data_file:    
    colors = data_file.read().split("\n")

with open('data/analysis.tsv') as data_file:    
    analyses = data_file.read().split("\n")

with open('data/tags.tsv') as tag_file:    
    tags = tag_file.read().split("\n")

with open('data/name.tsv') as name_file:    
    names = name_file.read().split("\n")

seg_start = 0

for s in range(0, len(distribution)):
# for s in range(0, 2):
    print('\nchunk : ', s)

    file_name = file_names[seg_start : (seg_start + distribution[s])]
    # the tag data
    tag = tags[seg_start : (seg_start + distribution[s])]
    # the coordinates
    coord = coords[seg_start : (seg_start + distribution[s])]
    color = colors[seg_start : (seg_start + distribution[s])]
    analysis = analyses[seg_start : (seg_start + distribution[s])]
    name = names[seg_start : (seg_start + distribution[s])]

    outString = combine_json(name, tag, coord, color, analysis)

    with open("output/meta/" + str(s) + ".json", 'w+') as outfile:
        json.dump(outString, outfile)

    # the audio file
    seg = sounds[seg_start * seg_time : (seg_start + distribution[s]) * seg_time ]
    seg.export("output/audio/" + str(s) + ".mp3", format="mp3")

    seg_start += distribution[s]

