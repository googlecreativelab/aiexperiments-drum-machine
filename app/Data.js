/*
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
*/

require("../style/loader.scss");

var Player = require('Tone/source/MultiPlayer');
var Config = require("./Config");
var THREE = require("three");
var RTree = require("rtree");
var drumLike = require("../meta/drum_like.json");

var Data = module.exports = {
	videoId: '9x-_My5yjQY',
	totalChunks: Config.maxChunks,
	player: new Player().toMaster(),
	chunkIndexes: [],
	localSoundIndexes: [],
	areAllChunksLoaded: false,
	filterStates: [],
	FILTER_HIDDEN: 0.075,
	FILTER_VISIBLE: 2,
	FILTER_VISIBLE_LARGE: 4,
	filteredWord: null,
	filteredList: [],
	autoSuggest: {},
	suggestionList: [],
	suggestionEmptyList: [],
	tsne: null,
	rTree: null,
	tempo: 120,
	cloudData: [],
	soundOffset: 0*0.001,
	soundLength: 0.25,
	soundReleaseTime: 0.1,
	cloudSize2D: 1.5,
	totalTracks: 4,
	totalPoints: 0,
	isPlaying: false,
	wasPlaying: false,
	loadPercentage: 0,
	draggerNoiseResolution: 2.5, // 0 - 20
	draggerNoiseMultiplier: 10,
	indexCounter: 0,
	pointSize: 1,
	totalResults:0,
	tracks: [
		{
			soundIndex: -1,
		},{
			soundIndex: -1,
		},{
			soundIndex: -1,
		},{
			soundIndex: -1,
		},
	],
	getTotalTracks: function(){
		return this.tracks.length;
	},
	getTrack: function(trackIndex){
		return this.tracks[trackIndex];
	},
	getTotalPoints: function(){
		return this.totalPoints;
	},
	importChunk: function(chunkId, callback){
		var scope = this;
		var audioURL = Config.domain + Config.paths.audio+chunkId+".mp3";
		var tsneURL = Config.domain + Config.paths.tsne+chunkId+".json";

		var onTSNELoaded = function (response) {
			Data.loadPercentage = ((chunkId+1) / (Data.totalChunks-1) *100 | 0);
			// var displayString = (" LOADING " + Data.loadPercentage + "% ["+(chunkId+2)+"/"+(Data.totalChunks)+"]... ");
			var displayString = (" LOADING " + Data.loadPercentage + "%<br>"+Data.getTotalPoints()+" SOUNDS LOADED");
			var loader = document.getElementById("loader");
			var percentage = loader.getElementsByClassName('percentage')[0];
			percentage.innerHTML = displayString;

			var jsonData = JSON.parse(response);

			if(!Data.myRTree) {
				Data.myRTree = RTree();
			}

			// metaData
			var chunkData = jsonData.metaData;
			scope.cloudData.push(chunkData);
			var total = chunkData.length;
			var i;
			var pos2D;
			var bounds = 0.001;
			for(i = 0; i<total; i++){
				scope.chunkIndexes.push(chunkId);
				scope.localSoundIndexes.push(i);
				scope.filterStates.push(Data.FILTER_VISIBLE);

				pos2D = Data.getNormalPosition(Data.indexCounter);
				pos2D.index = Data.indexCounter;
				Data.myRTree.insert({x: pos2D.x, y: pos2D.y, w: bounds, h: bounds},pos2D);
				Data.indexCounter++;
			}
			scope.totalPoints += total;

			// autoSuggest
			var asData = jsonData.autoSuggest;
			total = asData.length;

			// loop to go through object key value pair
			// if it doesn't xist, create it, else add value to existing
			for (var key in asData) {
				if (asData.hasOwnProperty(key)) {
					var obj = asData[key];
					for (var prop in obj) {
						if (obj.hasOwnProperty(prop)) {
							if (Data.autoSuggest.hasOwnProperty(prop)) {
								Data.autoSuggest[prop] += obj[prop];
							} else {
								Data.autoSuggest[prop] = obj[prop];
							}

						}
					}
				}
			}
		};

		if(!Config.isAudioDisabled) {
			scope.loadAudioData( chunkId, audioURL, function(response){
				scope.loadTSNEData( tsneURL, function(response){
					onTSNELoaded(response);
					callback(response);
				});
			});
		} else {
			scope.loadTSNEData( tsneURL, function(response){
				scope.playSound = function(soundIndex) { };
				onTSNELoaded(response);
				callback(response);
			});
		}
		
	},
	loadTSNEData: function (path, callback){
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', path, true);
		xobj.onreadystatechange = function () {
			if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);  
	},
	
	loadAudioData: function (id, path, callback){
		this.player.fadeIn = 0.001;
		this.player.fadeOut = this.soundReleaseTime;		
		this.player.add(id, path, callback);
	},

	generateEmptySuggestions: function () {
		var hasProp;

		var allSuggestionsList = [];
		var curatedSuggestionsList = [];
		Data.suggestionEmptyList = [];


		for (var tag in Data.autoSuggest) {
			hasProp = Data.autoSuggest.hasOwnProperty(tag);
			if (hasProp) {
				allSuggestionsList.push({ value: tag, tally: Data.autoSuggest[tag] });
			}
		}
		var sortByNumber = function(a,b) {
			if (a.tally < b.tally)
				return 1;
			else if (a.tally > b.tally)
				return -1;
			else 
				return 0;
		};
		var sortByAlphabetical = function(a,b) {
			if (a.value > b.value)
				return 1;
			else if (a.value < b.value)
				return -1;
			else 
				return 0;
		};
		
		allSuggestionsList.sort(sortByNumber);
		curatedSuggestionsList = allSuggestionsList.slice(0,100);
		curatedSuggestionsList.sort(sortByAlphabetical);

		for(var i=0; i<(curatedSuggestionsList.length-1); i++){
			if(!~curatedSuggestionsList[i+1].value.indexOf(curatedSuggestionsList[i].value)) {
				Data.suggestionEmptyList.push(curatedSuggestionsList[i+1]);
			}
		}
	},

	searchRTree: function (obj) {
		if(!Data.myRTree) {
			return -1;
		}

		obj = obj || {};
		obj.bounds = obj.bounds || 0.03;
		obj.offset = obj.offset || {x: 0, y: 0};

		var tree = Data.myRTree.search({
			x: obj.offset.x-obj.bounds*0.5, 
			y: obj.offset.y-obj.bounds*0.5, 
			w: obj.bounds, 
			h: obj.bounds });

		var list = [];
		var total = tree.length;
		for(  i=0; i<total; i++){
			if(	this.filterStates[tree[i].index] != Data.FILTER_HIDDEN) {
				list.push(tree[i]);

			}
		}

		return list;
	},

	playSound: function (soundIndex, time, velocity) {
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];
		this.player.start(chunkIndex, time, soundIndex*this.soundLength+this.soundOffset, this.soundLength - this.soundReleaseTime, 0, velocity);
	},

	muteSound: function () {
		this.player.volume.input.value = 0.01;
	},
	unMuteSound: function () {
		this.player.volume.input.value = 1;
	},


	playTrackSound: function (trackIndex, time, velocity) {
		this.playSound(this.tracks[trackIndex].soundIndex, time, velocity);
	},
	
	setTrack: function (trackIndex, soundIndex) {
		this.tracks[trackIndex].soundIndex = soundIndex;
	},
	
	getSoundIndex: function (trackIndex) {
		return this.tracks[trackIndex].soundIndex;
	},

	getFilterState: function (soundIndex) {
		return this.filterStates[soundIndex];
	},

	resetFilterStates: function () {
		var i;
		var total = Data.getTotalPoints();
		Data.totalResults = 0;

		for(i=0;i<total; i++){
			this.filterStates[i] = Data.FILTER_VISIBLE;
		}
	},

	setFilterState: function (soundIndex, state) {
		this.filterStates[soundIndex] = state;
	},

	setFilter: function(value){
		var i,j;
		var tags;
		var total = Data.getTotalPoints();
		var totalTags;
		Data.totalResults = 0;
		if(	value.toLowerCase().localeCompare("all") === 0){
			size = Data.FILTER_VISIBLE;
		}

		// resets all filters back to invisible
		for(i=0;i<total; i++){
			tags = Data.getTags(i);
			totalTags = tags.length;
			this.filterStates[i] = Data.FILTER_HIDDEN;

			// if a tag matches, change it's state to selected
			for(j=0;j<totalTags; j++){
				if(	value.toLowerCase().localeCompare(tags[j].toLowerCase()) === 0){
					this.filterStates[i] = Data.FILTER_VISIBLE_LARGE;
					Data.totalResults++;
					break;
				}
			}
		}
		this.filteredWord = value;
	},

	getFilter: function(){
		return this.filteredWord;
	},

	suggest: function(value){
		var letters = value.split("");
		var totalLetters = letters.length;
		Data.suggestionList = [];

		var testString;
	
		for (var key in Data.autoSuggest) {
			if (Data.autoSuggest.hasOwnProperty(key)) {
				testString = key.substring(0,totalLetters);
				if(value.toUpperCase() === key.substring(0,totalLetters).toUpperCase()){
					Data.suggestionList.push({ value: key, tally: Data.autoSuggest[key] });
				}
			}
		}

		var sortByNumber = function(a,b) {
			if (a.tally < b.tally)
				return 1;
			else if (a.tally > b.tally)
				return -1;
			else 
				return 0;
		};

		Data.suggestionList.sort(sortByNumber);
	},

	resetFilter: function(value){
		var i;
		var total = Data.getTotalPoints();
		for(i=0;i<total; i++){
			this.filterStates[i] = Data.FILTER_VISIBLE;
		}
		Data.suggestionList = [];
		Data.suggestionList = Data.suggestionList.concat(Data.suggestionEmptyList);

		this.filteredWord = null;
	},

	getFilteredList: function () {
		var list = [];
		var total = Data.getTotalPoints();
		for(  i=0; i<total; i++){
			if(	this.filterStates[i] == Data.FILTER_VISIBLE_LARGE) {
				list.push(i);
			}
		}
		return list;
	},

	randomizeSoundIndexes: function () {
		var total = Data.totalTracks;
		var i;
		if(this.filteredWord) {
			this.filteredList = this.getFilteredList();
			if (this.filteredList.length > 0){

				// sort the array by each index
				var filteredListWithMeta = this.filteredList.map(function(item, index){
					var ret = this.getMetaData(item);
					ret.index = index;
					return ret;
				}.bind(this));
				for(i=0; i<total; i++){
					this.chooseFromFilteredList(filteredListWithMeta, i);
				}
			}
		} else {

			// go through the similar drum sounds array and pick one at random that's available
			for(i=0; i<total; i++){
				this.chooseFromDrumLike(i);
			}
		}
	},

	chooseFromDrumLike: function(index){
		var available = this.getTotalPoints();
		var soundLike = drumLike[index];
		var i = 0;
		for (i = 0; i < soundLike.length; i++){
			if (soundLike[i] >= available){
				break;
			}
		}
		soundLike = soundLike.slice(0, i);
		//choose randomly from that list
		var randIndex = Math.floor(Math.random() * i);
		this.tracks[index].soundIndex = soundLike[randIndex];
	},
	chooseFromFilteredList: function(filteredList, index){

		// sort the array by each index
		filteredList.sort(function(a, b){
			return a.analysis[index] - b.analysis[index];
		}.bind(this));

		//choose from the first 20 randomly
		var chooseSize = Math.min(filteredList.length, 20);
		var newIndex = filteredList[Math.floor(Math.random() * chooseSize)].index;
		this.tracks[index].soundIndex = Data.filteredList[newIndex];//filteredList[newIndex].index;
	},
	
	getColorValue: function (char) {
		var num = char.toUpperCase().charCodeAt(0);
		num = (num -65)/26; 	// converts to normal
		num = (num+0.5+10)%1;	// removes negative values
		num *= 255;				// converts to color
		num |= 0;				// rounds to nearest integer
		return num;
	},

	getLightColorString: function (color, brightness) {
		brightness = brightness || 77;
		var r = (color.r * 256)|0;
		var g = (color.g * 256)|0;
		var b = (color.b * 256)|0;

		return ("rgb(" + (r+brightness) + "," + (g+brightness) + "," + (b+brightness) + ")"); 
	},

	getPosition: function (soundIndex) {
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];
		var pos = new THREE.Vector2(
			this.cloudData[chunkIndex][soundIndex].coords[0],
			this.cloudData[chunkIndex][soundIndex].coords[1]);

		pos.x = (pos.x*600 - 300 );
		pos.y = (pos.y*600 - 300 );

		return pos;
	},

	getNormalPosition: function (soundIndex) {
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];
		var pos = new THREE.Vector2(
			this.cloudData[chunkIndex][soundIndex].coords[0],
			this.cloudData[chunkIndex][soundIndex].coords[1]);

		pos.x = pos.x*2.0-1.0;
		pos.y = pos.y*2.0-1.0;

		return pos;
	},

	getTags: function (soundIndex) {
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];
		var tags = this.cloudData[chunkIndex][soundIndex].tags.sort();
		return tags;
	},

	getColor: function (soundIndex) {
		var color = new THREE.Color();
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];
		var x3d = this.cloudData[chunkIndex][soundIndex].color[0];
		var y3d = this.cloudData[chunkIndex][soundIndex].color[1];
		var z3d = this.cloudData[chunkIndex][soundIndex].color[2];

		color.setRGB( x3d*x3d*x3d+0.3, y3d*y3d*y3d+0.3, z3d*z3d*z3d+0.3);
		color.offsetHSL(0,1.0, 0.0 );
		return color;
	},

	getColors: function () {
		var colors = [];
		var i, total = this.getTotalTracks();
		for(i=0; i<total; i++) {
			colors.push(this.getColor(this.getSoundIndex(i%total)));
		}
		return colors;
	},

	getTitle: function (soundIndex) {
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];
		var name = this.cloudData[chunkIndex][soundIndex].name;
		return name;
	},

	getDescription: function (soundIndex) {
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];
		var name = this.cloudData[chunkIndex][soundIndex].description;
		return name;
	},

	getUsername: function (soundIndex) {
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];
		var name = this.cloudData[chunkIndex][soundIndex].username;
		return name;
	},

	getMetaData: function (soundIndex) {
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];
		var metaData = this.cloudData[chunkIndex][soundIndex];
		metaData.tags.sort();
		return metaData;
	},

	getTrackMetaData: function(trackIndex){
		return this.getMetaData(this.tracks[trackIndex].soundIndex);
	},
	
	getColorNormals: function (soundIndex) {
		var chunkIndex = this.chunkIndexes[soundIndex];
		soundIndex = this.localSoundIndexes[soundIndex];

		var pos = {
			r: this.cloudData[chunkIndex][soundIndex].color[0],
			g: this.cloudData[chunkIndex][soundIndex].color[1],
			b: this.cloudData[chunkIndex][soundIndex].color[2]
		};
		
		return pos;
	}
};

window.randomize = Data.randomizeSoundIndexes.bind(Data);