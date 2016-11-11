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
var Beat = require("./Beat");
var Tone = require("Tone/core/Tone");
var Data = require("Data");
var Transport = require("Tone/core/Transport");
// var cssSample = require("../../style/sequencer.scss");

var Cell = module.exports = function(name, container, trackIndex, beatIndex) {
	var scope = this;
	BoilerPlate.call(this);

	this.name = name;
	this.container = container;

	// ------------------------------------------------------------
	// VARS
	// ------------------------------------------------------------
	// this.beat = 0;

	this.trackIndex = trackIndex;
	this.beatIndex = beatIndex;
	this.cell = document.createElement("div");
	this.cell.className = "Cell";
	this.container.appendChild(this.cell);

	this.fill = document.createElement("div");
	this.fill.id = "Fill";
	this.cell.appendChild(this.fill);

	this.cell.addEventListener("click", function(event) {
		scope.onClick(event);
	});

	// ------------------------------------------------------------
	// METHODS
	// ------------------------------------------------------------
	this.set = function (active) {
		if (active){
			this.cell.classList.add("Active");
		} else {
			this.cell.classList.remove("Active");
		}
	};

	this.trigger = function(){
		this.cell.classList.add("Trigger");
		setTimeout(function(){
			scope.cell.classList.remove("Trigger");
		}, 100);
	};

	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------
	this.onClick = function(event) {
		var value = !Beat.get(this.trackIndex, this.beatIndex);
		Beat.set(this.trackIndex, this.beatIndex, value);
		this.set(value);
		//play the sound
		if (value && Transport.state === "stopped"){
			var time = Tone.now();
			Data.playTrackSound(this.trackIndex, time, 1);
		}
	};

	this.updateColor = function(color) {
		this.fill.style.background = color;
	};
	// ------------------------------------------------------------
	// UTILITY
	// ------------------------------------------------------------
};

Cell.prototype = new BoilerPlate();
Cell.prototype.constructor = Cell;
