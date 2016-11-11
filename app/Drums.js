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

var Data = require("./Data");
var Config = require("./Config");
var BoilerPlate = require("./Boilerplate");
var Visualizer = require("./viz/Visualizer");
var Sequencer = require("./seq/Sequencer");
var Filter = require("./Filter");
var Nav = require("./Nav");

var Drums = module.exports = function(x) {
	var scope = this;
	BoilerPlate.call(this);
	this.name = "Drums";

	// ------------------------------------------------------------
	// VARS
	// ------------------------------------------------------------

	var chunkLoadId = 0;

	var visualizer = null;
	var sequencer = null;
	var filter = null;
	var nav = null;

	// ------------------------------------------------------------
	// METHODS
	// ------------------------------------------------------------
	this.init = function() {

		// check for webGL;
		var canvas = document.createElement("canvas");
		var noGL = document.getElementById("noGL");
		var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		if (gl && gl instanceof WebGLRenderingContext) {
			noGL.classList.remove("show");
		} else {
			noGL.classList.add("show");
		}

		Config.domain 			= (getParameterByName("domain")==="local") ? "./": Config.domain;
		Config.isAudioDisabled 	= (getParameterByName("isAudioDisabled")==="true");
		Config.isStatsEnabled 	= (getParameterByName("isStatsEnabled")==="true");
		Config.isDebugEnabled 	= (getParameterByName("isDebugEnabled")==="true");

		window.addEventListener("resize", function (event) {
			this.resize(event);
		}.bind(scope), false);
		window.addEventListener("orientationchange", function (event) {
			reorient(event);
		}.bind(scope), false);

		var dragExceptions = "tagstagButtonCelltracesliderVerticaldescriptionthumbnailabout";
		document.ontouchmove = function(event){
			if (dragExceptions.indexOf(event.target.className.split(" ")[0]) === -1 ) {
				event.preventDefault();
			}
		};
		document.addEventListener("ontouchmove", function(event){
			event.preventDefault();
		}, false);

		// load chunk
		var totalChunks = parseInt(getParameterByName("totalChunks"));
		if(totalChunks && totalChunks>0 && totalChunks<=Config.maxChunks) {
			Data.totalChunks = totalChunks;
		} else if(isMobile.any()){
			Data.totalChunks = Config.maxChunksMobile;
		} else {
			Data.totalChunks = Config.maxChunks;
		}

		this.loadChunk();
	};

	this.loadChunk = function (){
		if(chunkLoadId===1) {
			this.loadDrums();
		}

		var totalChunks = (Data.totalChunks);

		if(visualizer){
			visualizer.createCloud();
		}

		if(chunkLoadId<totalChunks) {
			Data.importChunk( chunkLoadId++, function() {
				if(Data.filteredWord){
					Data.setFilter(Data.filteredWord);
				}
				this.loadChunk();
			}.bind(scope));
		} else {
			document.getElementById("loader").style.visibility = "hidden";
			visualizer.update();
			Data.areAllChunksLoaded = true;
		}
	};

	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------
	this.loadVideo = function(event) {
		var playerContainer = document.getElementById("drumsVideo");
		var playButton = document.getElementsByClassName("playButton")[0];
		var thumbnail = document.getElementById("thumbnail");
		var ytPlayer = null;

		var onPlayerReady = function(event) {
			playerContainer.style.display = "none";
			playButton.addEventListener("click", function(event) {
				playerContainer.style.display = "block";
				ytPlayer.playVideo();
				playButton.style.display = "none";
				thumbnail.style.display = "none";
			},false);
			var about = document.getElementById("about");
			about.addEventListener("click", function(event) {
				ytPlayer.pauseVideo();
			},false);
		};
		
		ytPlayer = new YT.Player('drumsVideo', {
			width: '100%',
			height: '100%',
			videoId: Data.videoId,  // youtube video id
			playerVars: {
				'autoplay': 0,
				'rel': 0,
				'showinfo': 0
			},
			events: {
				'onReady': onPlayerReady
			}
		});
	};

	this.loadDrums = function(event) {
		var aboutLink = document.getElementById("aboutLink");
		var about = document.getElementById("about");
		var cover = document.getElementById("about");
		var aboutContainer = about.getElementsByClassName("container")[0];
		var intro = document.getElementById("intro");
		var startLink = document.getElementById("startLink");

		startLink.classList.add("show");
		aboutLink.classList.add("show");

		aboutContainer.addEventListener("click", function(event) {
			event.stopPropagation();
		},false);

		aboutLink.addEventListener("click", function(event) {
			nav.hideEverything();
			visualizer.hideLabels();
			visualizer.disableScroll();
			about.classList.add("show");
			intro.classList.add("hide");
		}.bind(scope),false);

		about.addEventListener("click", function(event) {
			nav.showEverything();
			visualizer.enableScroll();
			about.classList.remove("show");
			var introExist = document.getElementById("intro");
			if(introExist) {
				intro.classList.remove("hide");
			}
			if(Data.wasPlaying===true){
				Data.isPlaying = true;
				sequencer.start();
			}
		}.bind(scope),false);

		this.loadVideo();
		Data.randomizeSoundIndexes();

		// ------------------------------------------------------------
		// Sequencer
		// ------------------------------------------------------------
		sequencer = new Sequencer();
		sequencer.ontrigger(triggerVisuals.bind(this));
		sequencer.init();

		// ------------------------------------------------------------
		// Nav
		// ------------------------------------------------------------
		nav = new Nav();
		nav.setSequencer(sequencer);
		nav.addEventListener("ON_PLAYER_CLICKED",function(){
			if(Data.isPlaying === false){
				nav.showPause();
				Data.isPlaying = true;
				sequencer.start();
			} else if(Data.isPlaying === true){
				nav.showPlay();
				Data.isPlaying = false;
				sequencer.pause();
			}
			visualizer.showLabels();
			visualizer.enableScroll();
			visualizer.update(true);
		}.bind(scope),false);

		nav.addEventListener("ON_REFRESH",function(){
			Data.randomizeSoundIndexes();
			sequencer.updateTracks();
			visualizer.animateDraggers();
			visualizer.enableScroll();
			visualizer.update(true);
		}.bind(scope),false);
		nav.addEventListener("ON_ABOUT",function(){
			Data.wasPlaying = Data.isPlaying;
			Data.isPlaying = false;
			sequencer.pause();

			about.classList.add("show");
			visualizer.disableScroll();
			nav.hideEverything();
		}.bind(scope),false);

		nav.addEventListener("ON_TEMPO_UPDATED",function(normal){
			if(sequencer) {
				var increments = (200-60)/20; //get inc
				var steppedNormal = (normal*increments | 0) / increments; // force steps
				var value = (200-60)*steppedNormal + 60;
				sequencer.setTempo(value);
			}
		}.bind(scope),false);

		nav.addEventListener("ON_TAG_CHANGED",function(){
			nav.hideEverything();
			visualizer.update(true);
			filter.focus();
		}.bind(scope),false);

		nav.addEventListener("ON_CLEAR",function(){
			Data.resetFilter();
			filter.clearAutoSuggest();
			Data.generateEmptySuggestions();
			filter.updateAutoSuggest();
			filter.setField("");
			nav.setField("FILTER");
			visualizer.updateDraggers();
			visualizer.animateDraggers();
			visualizer.enableScroll();
			visualizer.update(true);
		}.bind(scope),false);

		nav.init();
		nav.hide();

		// ------------------------------------------------------------
		// Visualizer
		// ------------------------------------------------------------
		visualizer = new Visualizer();
		visualizer.init();
		visualizer.resize();

		visualizer.addEventListener("ON_OVERLAY_OPEN", function(){
			Data.wasPlaying = Data.isPlaying;
			sequencer.pause();
		}.bind(scope),false);

		visualizer.addEventListener("ON_OVERLAY_CLOSED", function(){
			if(Data.wasPlaying===true){
				sequencer.start();
			}
		}.bind(scope),false);

		visualizer.addEventListener("ON_DRAG_START", function(trackIndex){
			Data.wasPlaying = Data.isPlaying;
			visualizer.disableScroll();
			sequencer.pause();
			Data.playTrackSound(trackIndex);
		}.bind(scope),false);

		visualizer.addEventListener("ON_DRAG_STOPPED", function(){
			if(Data.wasPlaying===true){
				sequencer.start();
			}
			visualizer.enableScroll();
		}.bind(scope),false);

		visualizer.addEventListener("ON_TAG_CLICKED",function(tag){
			this.onFilter(tag);
			filter.hide();
			filter.clearAutoSuggest();
			visualizer.hideOverlays();
			visualizer.animateDraggers();
			visualizer.update(true);
		}.bind(scope),false);

		visualizer.addEventListener("ON_DRAG_SELECT", function(trackIndex,soundIndex){
			visualizer.dragSelecting(trackIndex, soundIndex);
			sequencer.setTrack(trackIndex, soundIndex);
			Data.playSound(soundIndex);
		}.bind(scope),false);

		filter = new Filter();
		
		// required for Label.js, may need a refactor
		visualizer.setFilter(filter); 

		filter.addEventListener("ON_UPDATE",function(tag){
			this.onFilter(tag);
			visualizer.update(true);
		}.bind(scope),false);
		
		filter.addEventListener("ON_TAG_CLICKED",function(tag){
			this.onFilter(tag);
			filter.hide();
			filter.clearAutoSuggest();
			visualizer.enableScroll();
			nav.showEverything();
			visualizer.update(true);
		}.bind(scope),false);
		
		filter.addEventListener("ON_CLEAR",function(tag){
			Data.resetFilter();
			filter.setField("");
			Data.generateEmptySuggestions();
			nav.setField("FILTER");
			filter.updateAutoSuggest();
			visualizer.update(true);
		}.bind(scope),false);
		
		filter.addEventListener("ON_RESET",function(tag){
			Data.resetFilter();
			filter.setField("");
			nav.setField("FILTER");
			visualizer.update(true);
		}.bind(scope),false);
		
		filter.addEventListener("ON_FOCUS",function(tag){
			this.onFilter(tag);
			visualizer.hideLabels();
			visualizer.disableScroll();
			visualizer.update(true);
		}.bind(scope),false);
		
		filter.addEventListener("ON_FOCUS_OUT",function(){
			filter.hide();
			filter.clearAutoSuggest();
			visualizer.showLabels();
			visualizer.enableScroll();
			nav.showEverything();
			visualizer.update(true);
		}.bind(scope),false);
		
		filter.init();
		nav.setField("FILTER");
		this.dispatchEvent("DRUMS_LOADED");
	};

	this.onFilter = function(value){
		if(value){

			filter.setField(value);
			Data.setFilter(value);
			Data.suggest(value);
			nav.setField(value);

		} else {

			filter.setField("");
			Data.setFilter("ALL");
			Data.generateEmptySuggestions();
			Data.resetFilter();
		}

		filter.show();
		sequencer.updateTracks();
		filter.updateAutoSuggest();
		visualizer.animateDraggers();
	};

	this.beginExperience = function(){

		document.getElementById("cover").classList.remove("show");
		document.getElementById("intro").remove();

		filter.hide();
		nav.show();
		visualizer.showDraggers();
		visualizer.showLabels();

		Data.randomizeSoundIndexes();
		sequencer.updateTracks();
		visualizer.animateDraggers();
		visualizer.enableScroll();
		visualizer.update(true);
		if(isMobile.any()) {
			Data.muteSound();
			Data.playSound(0);
			Data.unMuteSound();
		}
	};

	var triggerVisuals = function(track, time, velocity){
		visualizer.triggerTrack(track);
	};

	var randomizeTrack = function(trackIndex){
		Data.randomizeSoundIndex(trackIndex);
		visualizer.animateDraggers();
	};

	this.resize = function(event) {

	};

	//a timeout is used get the the true height and width
	var reorientTimer = null;
	var reorient = function(event) {
		clearTimeout(reorientTimer);
		reorientTimer = setTimeout(function() {
			var isLandScape = window.innerHeight < window.innerWidth;
			var isPhone = window.innerHeight < 480 || window.innerWidth < 480; 
			var reorientContainer = document.getElementById("reorient");
			if(isLandScape && isMobile.any() && isPhone) {
				reorientContainer.classList.add("show");
			} else {
				reorientContainer.classList.remove("show");
			}			

		}, 250);
	};

	// ------------------------------------------------------------
	// UTILITY
	// ------------------------------------------------------------
	var getParameterByName = function(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	};

	var isMobile = {
		Android: function() {
			return navigator.userAgent.match(/Android/i);
		},
		BlackBerry: function() {
			return navigator.userAgent.match(/BlackBerry/i);
		},
		iOS: function() {
			return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		},
		Opera: function() {
			return navigator.userAgent.match(/Opera Mini/i);
		},
		Windows: function() {
			return navigator.userAgent.match(/IEMobile/i);
		},
		any: function() {
			return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
		}
	};
};

Drums.prototype = new BoilerPlate();
Drums.prototype.constructor = Drums;