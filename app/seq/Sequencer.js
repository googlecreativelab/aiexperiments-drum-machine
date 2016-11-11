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

require("../../style/sequencer.scss");
require("../../style/loader.scss");

var BoilerPlate = require("../Boilerplate");
var Data = require("../Data");
var Track = require("./Track");
var Pattern = require("Tone/event/Pattern");
var Transport = require("Tone/core/Transport");
var Beat = require("./Beat");

var Sequencer = module.exports = function(x) {
	var scope = this;
	BoilerPlate.call(this);

	this.timing = null;

	this.hat = null;
	this.tom = null;
	this.snare = null;
	this.kick = null;

	this.name = "Sequencer";
	this.sequencer = null;
	this.line = null;
	this.cycleCount = 4;
	this.tracks = null;
	this._ontriggerCallback = null;

	// ------------------------------------------------------------
	// VARS
	// ------------------------------------------------------------

	// ------------------------------------------------------------
	// METHODS
	// ------------------------------------------------------------
	this.init = function() {

		this.sequencerWrapper = document.getElementById("sequencer");
		this.sequencer = this.sequencerWrapper.getElementsByClassName("container")[0];

		this.tracks = [];
		var i;
		var total = Data.getTotalTracks();
		var track;
		for(i=0; i<total; i++){
			track = new Track(this.sequencer, i);
			this.tracks.push(track);
		}
		for(i=0; i<total; i++){
			this.setTrack(i, Data.getSoundIndex(i));
		}

		this.totalCells = 16;
		this.tickIncrement = 200; // ms
		this.tick = this.totalCells-1;
		this._seq = new Pattern(this._ontrigger.bind(this), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).start(0);
		this._seq.interval = "16n";
		Transport.setLoopPoints("0", "1m");
		Transport.loop = true;
	};

	this.hide = function() {
		this.sequencer.style.visibility = "hidden";

	};
	this.show = function() {
		this.sequencer.style.visibility = "visible";
	};

	this.updateTracks = function() {
		var i;
		var total = Data.getTotalTracks();
		for(i=0; i<total; i++){
			this.setTrack(i, Data.getSoundIndex(i));
		}
		scope.cycleCount=4;
	};

	this.setTrack = function (trackIndex,soundIndex) {
		this.tracks[trackIndex].setColor(soundIndex);
	};

	this.setTempo = function(tempo){
		Transport.bpm.value = tempo;
	};

	this.getProgress = function(){
		return Transport.progress;
	};

	this.start = function(){
		Transport.start();
	};

	this.pause = function(){
		// this._seq.index = 0;
		Transport.pause();
	};

	this.ontrigger = function(callback){
		this._ontriggerCallback = callback;
	};

	this._triggerVisuals = function(track, index){
		this.tracks[track].trigger(index);
		this._ontriggerCallback(track);
	};

	this._triggerVisualsAfterDelay = function(track, index, time){
		//set a timeout to line up the visuals with the audio
		var delay = (time - Transport.now()) * 1000;
		if (delay < 15){
			this._triggerVisuals(track, index);
		} else {
			setTimeout(this._triggerVisuals.bind(this, track, index), delay);
		}
	};

	//internal calback when triggered
	this._ontrigger = function(time, index){
		for (var i = 0; i < this.tracks.length; i++){
			if (Beat.get(i, index)){
				Data.playTrackSound(i, time, Math.random() * 0.5 + 0.5);
				this._triggerVisualsAfterDelay(i, index, time);
			}
		}
	};

	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------

	// ------------------------------------------------------------
	// UTILITY
	// ------------------------------------------------------------
};

Sequencer.prototype = new BoilerPlate();
Sequencer.prototype.constructor = Sequencer;
