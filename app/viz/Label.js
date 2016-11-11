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

require("../../style/label.scss");

var BoilerPlate = require("../Boilerplate");
var Data = require("../Data");
var THREE = require("three");

var Label = module.exports = function(x) {
	var scope = this;
	BoilerPlate.call(this);
	this.name = "Label";

	// ------------------------------------------------------------
	// VARS
	// ------------------------------------------------------------
	this.isVisible = false;
	this.storedSoundIndex = -1;
	this.trackIndex = x;

	// ------------------------------------------------------------
	// METHODS
	// ------------------------------------------------------------
	this.init = function() {
		this.label = document.getElementsByClassName("label")[this.trackIndex];
		this.offset = new THREE.Vector2(0,0);
		this.position = new THREE.Vector2(0,0);
		this.title = this.label.getElementsByClassName('title')[0];

		this.title.addEventListener('click', function(event) {
			scope.dispatchEvent("ON_INFO",[scope.trackIndex]);
		});

	};

	this.enableClick = function() {
		if(this.isVisible) {
			return;
		}
		
		var onUp = function(event) {
			event.stopPropagation();
		};

		scope.label.addEventListener("click", onUp,false);
	};

	this.updatePosition = function(soundIndex, panner, zoomer) {
		if(!soundIndex){
			soundIndex = this.storedSoundIndex;
		}
		
		var pos2D = Data.getPosition(soundIndex);

		pos2D.x += panner.position.x;
		pos2D.y -= panner.position.y;
		pos2D.x *= zoomer.scale.x;
		pos2D.y *= zoomer.scale.y;
		pos2D.x *= -1;
		pos2D.y *= -1;

		var lineOffset = 40; // 15
		var lineLength = lineOffset * 1.4142;
		var offset = -lineLength*0.5 - lineOffset*0.5;
		var extraOffsetX = 0;
		var extraOffsetY = 0;

		pos2D.x += 0;//lineOffset;
		pos2D.y += lineOffset;
		pos2D.x += window.innerWidth*0.5;
		pos2D.y += window.innerHeight*0.5;

		this.label.style.bottom  = pos2D.y + "px";
		this.label.style.right = pos2D.x + "px";
		this.label.style.left = null;
		this.label.style.top = null;
		this.label.style.webkitTransform = 'translateX(50%)';

		var bounds = this.label.getBoundingClientRect();

		if( bounds.left <= 0 ) {
			extraOffsetX = -bounds.left;
			this.label.style.left = "0px";
			this.label.style.right = null;
			this.label.style.webkitTransform = 'translateX(0%)';
		} else if( bounds.right >= window.innerWidth ) {
			this.label.style.left = null;
			this.label.style.right = "0px";
			this.label.style.webkitTransform = 'translateX(0%)';
		}

		if( bounds.top <= 0 ) {
			extraOffsetY = -bounds.top;
			this.label.style.top = "0px";
			this.label.style.bottom = null;
		} else if( bounds.bottom >= window.innerHeight  ) {
			this.label.style.top = null;
			this.label.style.bottom = "0px";
		}

		var color = Data.getColor(soundIndex);
		var colorString = Data.getLightColorString(color, 77);
		this.title.style.color = colorString;

	};

	this.updateData = function(soundIndex){
		this.storedSoundIndex = soundIndex;
		this.title.innerHTML = Data.getTitle(soundIndex).toUpperCase();
	};

	this.bringToFront = function() {
		this.label.parentNode.appendChild(this.label);

	};

	this.setFocusPosition = function(soundIndex, panner, zoomer) {
		var pos2D = Data.getPosition(soundIndex);
		this.focus.x = pos2D.x + panner.position.x;
		this.focus.y = -pos2D.y + panner.position.y;

		this.focus.x*=zoomer.scale.x;
		this.focus.y*=zoomer.scale.y;
	};

	this.getFocusPosition = function(panner, zoomer) {
		this.focus.x/=zoomer.scale.x;
		this.focus.y/=zoomer.scale.y;
		this.focus.x -= panner.position.x;
		this.focus.y -= panner.position.y;
		
		return this.focus;
	};

	this.setPosition = function(pos2D, panner, zoomer) {
		scope.position.x = pos2D.x + panner.position.x;
		scope.position.y = -pos2D.y + panner.position.y;

		scope.position.x*=zoomer.scale.x;
		scope.position.y*=zoomer.scale.y;
	};

	this.hide = function() {
		this.label.classList.remove("show");
		this.isVisible = false;
	};

	this.show = function() {
		this.label.classList.add("show");
		this.isVisible = true;
	};

	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------

	// ------------------------------------------------------------
	// UTILITY
	// ------------------------------------------------------------
};

Label.prototype = new BoilerPlate();
Label.prototype.constructor = Label;