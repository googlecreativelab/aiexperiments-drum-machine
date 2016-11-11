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

var BoilerPlate = require("../Boilerplate");
var Data = require("../Data");
var Cell = require("./Cell");
var Beat = require("./Beat");

var Track = module.exports = function(container, id) {
	var scope = this;
	BoilerPlate.call(this);

	this.name = "Track";
	this.container = container;

	this.cells = [];
	this.trackIndex = id;
	this.previewTrack = null;
	this.sampleSoundIndex = Math.random()*Data.getTotalPoints() | 0;
	
	// ------------------------------------------------------------
	// VARS
	// ------------------------------------------------------------

	var track;
	track = document.createElement("div");
	track.className = "Track";
	this.container.appendChild(track);

	var cell;
	for (var i = 0; i < 16; i++){
		cell = new Cell(this.name, track, this.trackIndex, i);
		this.cells.push(cell);
		//get the initial state
		cell.set(Beat.get(this.trackIndex, i));
	}

	// ------------------------------------------------------------
	// METHODS
	// ------------------------------------------------------------

	this.setBeat = function(pattern){		
		var i;
		var total = this.cells.length;
		for ( i=0; i<total; i++){
			this.cells[i].set(pattern[i]);
		}
		
	};

	this.trigger = function(index){
		var cell = this.cells[index];
		cell.trigger();
	};

	this.setColor = function(soundIndex){
		var color = Data.getColor(soundIndex);
		var colorString = Data.getLightColorString(color, 1);
		for (var i = 0; i < 16; i++){
			cell = this.cells[i];
			cell.updateColor(colorString);
		}

		this.icons = document.getElementsByClassName("previewTracks");
		if(this.icons){
			this.icons[id].style.fill = colorString;
		}
	};

	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------

	// ------------------------------------------------------------
	// UTILITY
	// ------------------------------------------------------------
};

Track.prototype = new BoilerPlate();
Track.prototype.constructor = Track;
