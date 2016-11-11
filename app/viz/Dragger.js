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

var THREE = require("three");
var Data = require("../Data");
var TWEEN = require("Tween.js");
var Simplex = require('perlin-simplex');
// require('imports?THREE=three!exports?THREE.MeshLine!third_party/THREE.MeshLine/src/THREE.MeshLine.js');

var Dragger = module.exports = function(obj) {

	var scope = this;
	THREE.Object3D.call(this);

	var simplex = new Simplex();
	this.focus = new THREE.Vector3();

	obj = obj || {};
	obj.draggerIndex = obj.draggerIndex || 0;
	this.context = obj.context;

	// ------------------------------------------------------------
	// VARS AND OBJECTS
	// ------------------------------------------------------------
	this.enabled = false;
	this.tween = null;

	var geometry, material;
	var radius;
	var resolution = 128;
	var SCALE_S = 0.03;
	var SCALE_M = 0.35;
	var SCALE_L = 0.75;

	// dark outer circle
	this.outerCircle = null;
	radius   = 100;
	material = new THREE.MeshBasicMaterial( { color: 0x000000, opacity:0.4,transparent:true } );
	geometry = new THREE.CircleGeometry( radius, resolution );
	this.outerCircle = new THREE.Mesh( geometry, material );
	this.outerCircle.scale.set(SCALE_M,SCALE_M,SCALE_M);
	this.add( this.outerCircle );

	// colored inner circle
	this.innerCircle = null;
	radius   = 100*SCALE_S;
	material = new THREE.MeshBasicMaterial( { color: 0xffffff, opacity:1.0,transparent:true } );
	geometry = new THREE.CircleGeometry( radius, 4 );

	this.innerCircle = new THREE.Mesh( geometry, material );
	this.innerCircle.rotateZ(45 * (Math.PI/180));
	// this.innerCircle.scale.set(SCALE_S,SCALE_S,SCALE_S);
	this.add( this.innerCircle );

	// outline
	this.outline = null;
	material = new THREE.LineBasicMaterial({color: 0xffffff, transparent:true});
	// material = new THREE.MeshLineMaterial({color: 0xffffff, linewidth:2.0, transparent:true});
	geometry = new THREE.Geometry();
	radius   = SCALE_L*100;
	var x, y, z, theta;
	var TWO_PI = Math.PI*2.0;
	for(var j=0; j<resolution; j++ ){
		theta = j/(resolution-1);
		x = Math.cos(theta*TWO_PI)*radius;
		y = Math.sin(theta*TWO_PI)*radius;
		z = 0;
		geometry.vertices.push( new THREE.Vector3( x, y, z ));
	}
	this.outline = new THREE.Line( geometry, material );
	this.add( this.outline );

	this.outline.material.opacity = 1.0;
	this.draggerIndex = obj.draggerIndex; // index and id are reserved?

	this.resetOutlineNoise = function () {
		var colorData = Data.getColorNormals(Data.getSoundIndex(this.draggerIndex));
		this.updateOutlineNoise(SCALE_M, 1, colorData);
	};

	// ------------------------------------------------------------
	// METHODS
	// ------------------------------------------------------------

	this.enableDragging = function (obj) {

		obj = obj || {};

		if(obj.context){
			this.enabled = true;
			this.context = obj.context;

			var camera = obj.camera || null;
			var mouse = new THREE.Vector2(100000,100000);
			var ray = new THREE.Raycaster();
			this.context.addEventListener('mousedown', function(event) {
				mouse.x = ( event.clientX / (window.innerWidth) ) * 2 - 1;
				mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
				ray.setFromCamera( mouse, camera );
				var intersectors = ray.intersectObject( this, true );
				if ( intersectors.length > 0 ) {
					this.onMouseDown(event);
				}
			}.bind(scope), false);
		}
	};

	this.trigger = function() {
		var colorData = Data.getColorNormals(Data.getSoundIndex(this.draggerIndex));
		colorData.r = 1-colorData.r;
		var state = { value: 0 };
		this.tween = new TWEEN.Tween(state)
			.to({ value: [1] }, 250)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onStart(function() {
				this.outline.visible = true;
			}.bind(scope))
			.onUpdate(function() {
				var percentage;
				percentage = SCALE_M;
				this.updateOutlineNoise(percentage, state.value, colorData);

			}.bind(scope))
			.start();
	}.bind(scope);

	this.dragTrigger = function() {
		
		var colorData = Data.getColorNormals(Data.getSoundIndex(this.draggerIndex));
		colorData.r = 1-colorData.r;
		colorData.r*=2;
		colorData.g*=2;
		colorData.b*=2;
		var state = { value: 0.0 };
		if(this.tween) {
			this.tween.stop();
		}
		this.tween = new TWEEN.Tween(state)
			.to({ value: [1] }, 250)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onStart(function() {
				this.outline.visible = true;
			}.bind(scope))
			.onUpdate(function() {
				var percentage;
				percentage = SCALE_L;
				this.updateOutlineNoise(percentage, state.value, colorData);
			}.bind(scope))
			.start();
			
	}.bind(scope);

	this.updateOutlineNoise = function(percentage, stateValue, colorData) {
		var radius;
		var theta;
		var scalar = percentage;

		var randX;
		var randY;
		var randResolution = Data.draggerNoiseResolution*colorData.r*(1-stateValue); //0
		var randMultiplier = Data.draggerNoiseMultiplier*colorData.g*(1-stateValue)*1.0+0.25; //0
		var randSpeed 	   = Data.draggerNoiseMultiplier*colorData.b*(1-stateValue); //0
		randSpeed *= new Date().getTime();
		var addNoise = function(j,theta){
			randX = Math.cos(theta*TWO_PI)*randResolution+randSpeed;
			randY = Math.sin(theta*TWO_PI)*randResolution+randSpeed;
			radius = scalar*100;
			radius += (simplex.noise(randX, randY)*randMultiplier);
			this.outline.geometry.vertices[j].x = Math.cos(theta*TWO_PI)*radius;
			this.outline.geometry.vertices[j].y = Math.sin(theta*TWO_PI)*radius;
			this.outline.geometry.vertices[j].z = 0;
		}.bind(scope);

		for(var j=0; j<(resolution-1); j++ ){
			theta = j/(resolution-1);
			addNoise(j, theta);
		}
		addNoise(resolution-1, 0);
		this.outline.geometry.verticesNeedUpdate = true;
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
		this.position.x = pos2D.x + panner.position.x;
		this.position.y = -pos2D.y + panner.position.y;

		this.position.x*=zoomer.scale.x;
		this.position.y*=zoomer.scale.y;

		var scalar = Data.pointSize+0.125;
		this.innerCircle.scale.set(scalar,scalar,scalar);

	};

	this.getPosition = function(panner, zoomer) {
		var oldPos = new THREE.Vector2(this.position.x,this.position.y);
		oldPos.x/=zoomer.scale.x;
		oldPos.y/=zoomer.scale.y;
		oldPos.x -= panner.position.x;
		oldPos.y -= panner.position.y;
		return oldPos;
	};

	this.animatePosition = function(soundIndex, panner, zoomer) {
		var pos2D = Data.getPosition(soundIndex);
		pos2D.y*=-1;

		if(this.tween) {
			this.tween.stop();
		}

		var oldPos = this.getPosition(panner, zoomer);
		var state = oldPos;
		this.tween = new TWEEN.Tween(state)
			.to(pos2D, 250)
			.delay(this.draggerIndex * 25)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function() {
				this.position.x = state.x + panner.position.x;
				this.position.y = state.y + panner.position.y;
				this.position.x*=zoomer.scale.x;
				this.position.y*=zoomer.scale.y;
			}.bind(scope))
			.onComplete(function(){
				this.dispatchEvent(new CustomEvent('ON_DRAGGER_ANIMATION_COMPLETE', { 'detail': {'draggerIndex':this.draggerIndex} }));
			}.bind(scope))
			.start();
	};

	this.animateDotToCenter = function() {
		var state = this.innerCircle.position;
		this.tween = new TWEEN.Tween(state)
			.to({x:0,y:0}, 250)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function() {
				this.innerCircle.position.x = state.x;
				this.innerCircle.position.y = state.y;
			}.bind(scope))
			.start();
	}.bind(scope);

	this.setColor = function(soundIndex) {
		var color = Data.getColor(soundIndex);
		this.innerCircle.material.color = color;
		this.outline.material.color = color;
		this.outerCircle.material.color = color;

	};

	this.animateColor = function(soundIndex) {
		var oldColor = this.innerCircle.material.color;
		var newColor = Data.getColor(soundIndex);
		var state = oldColor;
		this.tween = new TWEEN.Tween(state)
			.to(newColor, 500)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function() {
				this.innerCircle.material.color = state;
				this.outline.material.color = state;
			}.bind(scope))
			.onComplete(function() {
				this.setColor(soundIndex);
			}.bind(scope))
			.start();
	}.bind(scope);

	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------

	this.onMouseDown = function(event) {

		var onTouchMove = function(event) {
			event.clientX = event.changedTouches[0].clientX;
			event.clientY = event.changedTouches[0].clientY;
			onMove(event);
		}.bind(scope);

		var onMove = function(event) {

			this.position.x = event.clientX-window.innerWidth*0.5  - anchorOffset.x + draggerStart.x;
			this.position.y = -event.clientY+window.innerHeight*0.5 - anchorOffset.y + draggerStart.y;

			this.innerCircle.position.x = this.focus.x-this.position.x;
			this.innerCircle.position.y = this.focus.y-this.position.y;

			this.dispatchEvent(new CustomEvent('ON_MOUSE_DRAGGING', { 'detail': this.position }));
			event.preventDefault();
		}.bind(scope);

		var onTouchUp = function(event) {
			event.clientX = event.changedTouches[0].clientX;
			event.clientY = event.changedTouches[0].clientY;
			onUp(event);

		}.bind(scope);

		var onUp = function(event) {
			if(this.tween) {
				this.tween.stop();
			}
			if(this.innerCircle.material.color === 0xFFFFFF) {
				this.innerCircle.material.color = storeColor;
			}

			this.outerCircle.visible = true;

			this.outerCircle.scale.set(SCALE_M,SCALE_M,SCALE_M);
			this.resetOutlineNoise();

			this.context.removeEventListener('mousemove', onMove, false);
			this.context.removeEventListener('mouseup', onUp, false);
			this.context.removeEventListener('mouseupoutside', onUp, false);

			this.context.removeEventListener('touchmove', onTouchMove, false);
			this.context.removeEventListener('touchend', onTouchUp, false);
			this.context.removeEventListener('touchcancel', onTouchUp, false);

			this.dispatchEvent(new CustomEvent('ON_DRAG_STOPPED'));
			event.preventDefault();
		}.bind(scope);

		var anchorOffset = new THREE.Vector2(event.clientX-(window.innerWidth)*0.5, -event.clientY+(window.innerHeight)*0.5 );
		var draggerStart = new THREE.Vector2(this.position.x,this.position.y);
		var storeColor = this.innerCircle.material.color;

		// color drops to 0
		// better off hidden though
		this.outerCircle.visible = false;

		this.context.addEventListener('mousemove', onMove, false);
		this.context.addEventListener('mouseup', onUp, false);
		this.context.addEventListener('mouseupoutside', onUp, false);

		this.context.addEventListener('touchmove', onTouchMove, false);
		this.context.addEventListener('touchend', onTouchUp, false);
		this.context.addEventListener('touchcancel', onTouchUp, false);

		this.dragTrigger();

	}.bind(scope);

	// ------------------------------------------------------------
	// UTILITY
	// ------------------------------------------------------------
	this.resetOutlineNoise();
};

Dragger.prototype = new THREE.Object3D();
Dragger.prototype.constructor = Dragger;