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

require("../../style/overlay.scss");

var BoilerPlate = require("../Boilerplate");
var Data = require("../Data");

var Overlay = module.exports = function(x) {
	var scope = this;
	BoilerPlate.call(this);

	this.name = "Overlay";

	// ------------------------------------------------------------
	// VARS
	// ------------------------------------------------------------
	this.isVisible = false;
	this.soundIndex = null;

	// ------------------------------------------------------------
	// METHODS
	// ------------------------------------------------------------
	this.init = function() {
		this.overlay = document.getElementById("overlay");

		this.overlayClose = this.overlay.getElementsByClassName('backButton')[0];
		this.title = this.overlay.getElementsByClassName('title')[0];
		this.tags = this.overlay.getElementsByClassName('tags')[0];
		this.overlayClose.addEventListener('click', function(event) {
			scope.dispatchEvent("ON_CLOSE",null);
		});
	};

	this.enableClick = function() {
		var onUp = function(event) {
			scope.dispatchEvent("ON_CLOSE",null);
			scope.overlay.removeEventListener("click", onUp,false);
			scope.overlay.removeEventListener("touchend", onUp,false);
			document.body.removeEventListener("click", onBGUp,false);
			document.body.removeEventListener("touchend", onBGUp,false);
			event.stopPropagation();
		};

		var onBGUp = function(event) {
			scope.dispatchEvent("ON_CLOSE",null);
			scope.overlay.removeEventListener("click", onUp,false);
			scope.overlay.removeEventListener("touchend", onUp,false);
			document.body.removeEventListener("click", onBGUp,false);
			document.body.removeEventListener("touchend", onBGUp,false);
			event.stopPropagation();
		};

		scope.overlay.addEventListener("click", onUp,false);
		scope.overlay.addEventListener('touchend', onUp, false);
		document.body.addEventListener("click", onBGUp,false);
		document.body.addEventListener("touchend", onBGUp,false);
	};

	this.setSoundIndex = function(soundIndex) {
		this.soundIndex = soundIndex;
	};

	this.hide = function() {
		this.overlay.classList.remove("show");
		this.isVisible = false;
	};

	this.show = function() {

		var metaData = Data.getMetaData(this.soundIndex);
		this.title.innerHTML = metaData.name.toUpperCase();

		while (scope.tags.firstChild) {
			scope.tags.removeChild(scope.tags.firstChild);
		}

		var createButton = function(tagIndex) {
			var text = metaData.tags[tagIndex].toUpperCase();
			var btn = document.createElement("BUTTON");
			var t = document.createTextNode(text);
			var colorOne = "hsl("+Data.getColorValue(text.charAt(0))+", 100%, 50%)";
			var colorTwo = "hsl("+Data.getColorValue(text.charAt(text.length-1))+", 100%, 50%)";

			btn.setAttribute( "style", "border: 1px solid transparent; border-image: linear-gradient(to bottom right, " + colorOne + " 0%, " + colorTwo + " 100%); border-image-slice: 1;");
			btn.addEventListener('touchend', function(event) {
				scope.dispatchEvent("ON_TAG",[metaData.tags[tagIndex]]);
			});
			btn.addEventListener('click', function(event) {
				scope.dispatchEvent("ON_TAG",[metaData.tags[tagIndex]]);
			});
			btn.appendChild(t);
			scope.tags.appendChild(btn);
		};

		for(var i=0; i<metaData.tags.length; i++){
			createButton(i);
		}
		
		this.overlay.classList.add("show");
		this.isVisible = true;
	};


	this.bringToFront = function(zIndex) {
		this.overlay.style.zIndex = zIndex;
	};
	
	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------

	// ------------------------------------------------------------
	// UTILITY
	// ------------------------------------------------------------
};

Overlay.prototype = new BoilerPlate();
Overlay.prototype.constructor = Overlay;