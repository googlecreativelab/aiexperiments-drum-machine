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

require("../style/nav.scss");

var BoilerPlate = require("./Boilerplate");
var Data = require("./Data");

var Nav = module.exports = function() {
	var scope = this;
	BoilerPlate.call(this);

	this.name = "Nav";
	this.isVisible = true;
	this.isPreviewCollapsed = true;
	this.isTempoCollapsed = true;
	this.isMobile = false;
	this.percentage = 0.0;
	this.count = 0;
	// ------------------------------------------------------------
	// VARS
	// ------------------------------------------------------------

	this.init = function(){
		this.controller = document.getElementById("controller");
		this.nav = document.getElementById("nav");

		this.controller.addEventListener('ontouchstart', function(e) {
			e.stopPropagation();
			e.preventDefault();
		}, false);
		this.controller.addEventListener('ontouchmove', function(e) {
			e.stopPropagation();
			e.preventDefault();
		}, false);

		// player
		this.player = document.getElementById("player");
		this.playerIcon = this.player.getElementsByClassName("icon")[0];
		this.player.addEventListener("click", function () {
			this.dispatchEvent("ON_PLAYER_CLICKED",null);
		}.bind(scope), false);
		window.addEventListener('keydown', function(event) {
			if (event.keyCode === 32 && !this.nav.classList.contains('hide') ) {
				this.dispatchEvent("ON_PLAYER_CLICKED",null);
			}
			event.stopPropagation();
		}.bind(scope), false);

		// sequencer
		this.sequencerWrapper = document.getElementById("sequencer");
		this.sequencer = this.sequencerWrapper.getElementsByClassName("container")[0];
		this.sequencerCloseIcon = document.getElementById("sequencerCloseIcon");
		this.sequencerCloseIcon.style.display = "none";
		this.sequencerPreviewIcon = document.getElementById("sequencerPreviewIcon");

		// filter
		this.filter = document.getElementById("navFilter");
		this.filterStroke = this.filter.getElementsByClassName('stroke')[0];
		this.filterFill = this.filterStroke.getElementsByClassName('fill')[0];
		this.filterClear = this.filterStroke.getElementsByClassName('clearIcon')[0];
		this.filterClear.style.display = "none";
		this.filterFill.addEventListener("click", function() {
			scope.dispatchEvent("ON_TAG_CHANGED",null);
		});
		this.filterClear.addEventListener("click", function(event) {
			event.stopPropagation();
			event.preventDefault();
			scope.dispatchEvent("ON_CLEAR",null);
		});

		// buttons
		this.buttons = document.getElementById("buttonsControls");
		this.previewIcon = document.getElementById("previewIcon");
		this.shuffleIcon = document.getElementById("shuffleIcon");
		this.tempoIcon = document.getElementById("tempoIcon");
		this.infoIcon = document.getElementById("infoIcon");
		this.slider = this.buttons.getElementsByClassName("slider")[0];
		var sliderData = document.getElementById("sliderData");
		this.previewIcon.addEventListener('click', function(){
			if(scope.isPreviewCollapsed) {
				scope.previewIcon.classList.add("expand");
				scope.sequencerWrapper.classList.add("expand");
				scope.nav.classList.add("expand");
				scope.sequencerCloseIcon.style.display = "block";
				scope.sequencerPreviewIcon.style.display = "none";
				scope.isPreviewCollapsed = false;

			} else {
				scope.previewIcon.classList.remove("expand");
				scope.sequencerWrapper.classList.remove("expand");
				scope.nav.classList.remove("expand");
				scope.isPreviewCollapsed = true;
				scope.sequencerCloseIcon.style.display = "none";
				scope.sequencerPreviewIcon.style.display = "block";
			}
		}, false);

		this.shuffleIcon.addEventListener("click", function(){
			scope.dispatchEvent("ON_REFRESH",null);
		}, false);

		this.infoIcon.addEventListener("click", function(){
			scope.dispatchEvent("ON_ABOUT",null);
		}, false);

		var onTempoIconUp = function(event) {
			if(scope.isTempoCollapsed) {
				scope.slider.classList.add("show");

				sliderData.addEventListener("click", onSliderUp,false);
				sliderData.addEventListener("touchend", onSliderUp,false);
				document.body.addEventListener("click", onBGUp,false);
				document.body.addEventListener("touchend", onBGUp,false);
				scope.tempoIcon.removeEventListener("click", onTempoIconUp, false);
				scope.tempoIcon.removeEventListener("touchend", onTempoIconUp, false);

				scope.isTempoCollapsed = false;
			} else {
				scope.slider.classList.remove("show");
				scope.isTempoCollapsed = true;
			}
			event.preventDefault();
			event.stopPropagation();
		};

		var onBGUp = function(event) {
			document.body.removeEventListener("click", onBGUp,false);
			document.body.removeEventListener("touchend", onBGUp,false);
			sliderData.removeEventListener("click", onSliderUp,false);
			sliderData.removeEventListener("touchend", onSliderUp,false);
			scope.slider.classList.remove("show");
			scope.isTempoCollapsed = true;
			scope.tempoIcon.addEventListener("click", onTempoIconUp, false);
			scope.tempoIcon.addEventListener("touchend", onTempoIconUp, false);
			event.preventDefault();
			event.stopPropagation();
		};

		var onSliderUp = function(event) {
			event.preventDefault();
			event.stopPropagation();
		};

		this.tempoIcon.addEventListener("click", onTempoIconUp, false);
		this.tempoIcon.addEventListener("touchend", onTempoIconUp, false);

		var setTempoSlider = function(value) {
			var thumb = document.getElementById("sliderThumb");
			var normal = value / (sliderData.max - sliderData.min); /* the percentage slider value */
			var loc = (1 - normal) * (180 - 20);
			thumb.style.top = (loc+10) + "px";
			scope.dispatchEvent("ON_TEMPO_UPDATED",[normal]);
		};

		var setValue = function (val) {
			sliderData.value = val;
			setTempoSlider(val);
		};

		sliderData.addEventListener("input", function(value) {
			setTempoSlider(sliderData.value);
		});

		setValue(50);

		this.pendulum = document.getElementById("pendulum");
		this.pendulumWrapper = document.getElementById("pendulumWrapper");
		this.pendulumWrapper.setAttribute("transform", "translate( 25, 28)");
		this.animate();
	};

	this.animate = function() {
		var normal = scope.sequencerData.getProgress();
		var degrees = normal*180-45;
		if(normal>0.5) {
			degrees = (1-normal)*180-45;
		}
		this.pendulum.setAttribute("transform", "rotate(" + degrees + ")");
		requestAnimationFrame(function() {
			scope.animate();
		});
	};

	// ------------------------------------------------------------
	// METHODS
	// ------------------------------------------------------------

	this.showPause = function() {
		scope.playerIcon.classList.add("pause");
	};

	this.showPlay = function() {
		scope.playerIcon.classList.remove("pause");
	};

	this.hide = function() {
		this.controller.classList.remove("show");
		scope.isVisible = false;
	};

	this.show = function() {
		this.controller.classList.add("show");
		scope.isVisible = true;
	};

	this.hideEverythingButPlayer = function() {
		this.nav.classList.add("hide");
		this.sequencerWrapper.classList.add("hide");
		this.filter.classList.add("hide");
		this.buttons.classList.add("hide");
	};

	this.hideEverything = function() {
		this.nav.classList.add("hide");
	};

	this.showEverything = function() {
		this.nav.classList.remove("hide");
	};

	this.setField = function(tag) {
		tag = tag.toUpperCase();
		scope.filterFill.innerHTML = tag;

		var hueOne = Data.getColorValue(tag.charAt(0));
		var hueTwo = Data.getColorValue(tag.charAt(tag.length-1));
		var colorOne = "hsl("+hueOne+", 100%, 50%)";
		var colorTwo = "hsl("+hueTwo+", 100%, 50%)";

		var params1 = "";
		var params2 = "";
		var params3 = "";

		if(tag==="FILTER"){
			params1 += "background: url(/img/search.svg) no-repeat scroll 0px 0px; ";
			params1 += "background-position: left center; "; 
			params1 += "background-color: #262536; ";
			scope.filterStroke.setAttribute("style", params1);
			params2 += "width:calc(100% - 50px - 10px - 4px); ";
			params2 += "padding: 0px 10px 0px 50px; ";
			params2 += "background-color: rgba(0, 0, 0, 0.0); ";
			scope.filterFill.setAttribute("style", params2);
			params3 += "display:none; ";
			scope.filterClear.setAttribute("style", params3);
		} else {
			params1 += "background: linear-gradient(to bottom right, "+colorOne+" 0%, "+colorTwo+" 100%); ";
			scope.filterStroke.setAttribute("style", params1);
			params2 += "width:calc(100% - 10px - 10px - 4px); ";
			params2 += "padding: 0px 10px 0px 10px; ";
			params2 += "background-color: #262536; ";
			scope.filterFill.setAttribute("style", params2);
			params3 += "display:block; ";
			scope.filterClear.setAttribute("style", params3);
		}
	};

	this.setSequencer = function (seq) {
		this.sequencerData = seq;
	};
	
	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------
	this.resize = function(event) {

	};

	// ------------------------------------------------------------
	// UTILITY
	// ------------------------------------------------------------
};

Nav.prototype = new BoilerPlate();
Nav.prototype.constructor = Nav;
