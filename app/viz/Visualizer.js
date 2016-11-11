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
var Config = require("../Config");
var Dragger = require("./Dragger");
var Label = require("./Label");
var Overlay = require("./Overlay");
var PointCloud = require("./PointCloud");

var THREE = require("three");
var ZoomControls = require("./ZoomControls");
var TWEEN = require("Tween.js");
var Stats = require("stats.js");

var Visualizer = module.exports = function(x) {
	var scope = this;
	BoilerPlate.call(this);
	this.name = "Visualizer";

	this.base = null;
	this.renderer = null;
	this.scene = null;
	this.camera = null;
	this.pointCloud = null;
	this.context = null;
	this.stats = null;
	this.storedSoundIndex = -1;
	this.labels = null;
	this.IS_DRAGGING = 1;
	this.IS_ZOOMING = 2;
	this.touchState = this.IS_DRAGGING;
	this.filter = null;
	this.resizeTimer = null;
	this.isScrollDisabled = true;

	this.init = function() {
		this.createEnvironment();
		this.createCloud();
		this.createDraggers();
		this.createListeners();
		this.createZoomElements();
		this.createInfo();
		if(Config.isStatsEnabled) {
			this.stats = new Stats();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.left = "auto";
			this.stats.domElement.style.right = "0px";
			this.stats.domElement.style.top = "0px";
			document.body.appendChild( this.stats.domElement );
		}
		this.animate();
		requestAnimationFrame(tweenAnimate);
	};
	
	this.createEnvironment = function() {
		this.info = document.getElementById('info');
		this.info.classList.add("show");
		this.renderer = new THREE.WebGLRenderer({
			antialias : true
		});
		this.renderer.setClearColor( 0x0F0F0F );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
		this.context = document.getElementById('visualizer');
		this.context.appendChild(this.renderer.domElement);
		this.scene = new THREE.Scene();
		var near = -2000;
		var far = 2000;

		this.camera = new THREE.OrthographicCamera( 
			window.innerWidth / - 2, 
			window.innerWidth / 2, 
			window.innerHeight / 2, 
			window.innerHeight / - 2, 
			near, far );

		this.camera.position.x = 0;
		this.camera.position.y = 0;
		this.camera.position.z = 100;
		this.scene.add(this.camera);

		this.base = new THREE.Object3D();
		this.scene.add(this.base);
	};

	this.createCloud = function() {
		if(!this.zoomer) {
			this.zoomer = new THREE.Object3D();
			this.base.add( this.zoomer );
			this.panner = new THREE.Object3D();
			this.zoomer.add( this.panner );

			var controller = document.getElementById("controller");
			controller.classList.add("show");
			var controllerHeight = controller.clientHeight;
			controller.classList.remove("show");
			var scalarWidth = window.innerWidth/1000;
			var scalarHeight = (window.innerHeight-controllerHeight)/1000;
			var resetScale = (scalarWidth<scalarHeight) ? scalarWidth : scalarHeight;
			resetScale *= 1.65;
			Data.cloudSize2D = resetScale;
			scope.zoomer.scale.set(resetScale,resetScale,resetScale);
			scope.panner.position.y = controllerHeight*0.65;

		}

		if(this.pointCloud) {
			this.pointCloud.removeCloud();
			this.panner.remove(this.pointCloud); 
			this.pointCloud = null;
		}

		this.pointCloud = new PointCloud();
		this.panner.add( this.pointCloud );

		this.update();

	};

	this.createDraggers = function() {
		this.draggers = [];
		var dragger;
		var i;
		var soundIndex;
		var total = Data.totalTracks;
		var ray = new THREE.Raycaster();

		// on dragging across
		// scope of this is dragger!
		var onDragging = function(event){
			var selectedDragger = this;
			var dragging = new THREE.Vector2(100000,100000);
			var label;
			dragging.x = ( (event.detail.x+scope.base.position.x) / (window.innerWidth) ) * 2;
			dragging.y = ( (event.detail.y+scope.base.position.y) / window.innerHeight ) * 2;

			dragging.y *= -1;

			dragging.x /= scope.zoomer.scale.x*600/window.innerWidth;
			dragging.y /= scope.zoomer.scale.y*600/window.innerHeight;

			dragging.x -= scope.panner.position.x/300;
			dragging.y -= scope.panner.position.y/-300;

			var result = Data.searchRTree({
				offset:dragging,
				bounds:0.2/scope.zoomer.scale.x*2
			});

			if(!result || result.length===0) {
				return;
			}

			var diameterSquared = 100000;
			var dx,dy,dsq;
			for(  i=0; i<result.length; i++){
				dx = dragging.x - result[i].x;
				dy = dragging.y - result[i].y;
				dsq = dx*dx + dy*dy;
				if(dsq<diameterSquared){
					diameterSquared = dsq;
					smallestId = i;
				}
			}
			
			if(result[smallestId].index != scope.storedSoundIndex) {

				scope.storedSoundIndex = result[smallestId].index;
				Data.setTrack(selectedDragger.draggerIndex,scope.storedSoundIndex);
				selectedDragger.setFocusPosition(scope.storedSoundIndex, scope.panner,scope.zoomer);
				label = scope.labels[selectedDragger.draggerIndex];
				label.updateData(scope.storedSoundIndex);
				label.updatePosition(scope.storedSoundIndex, scope.panner,scope.zoomer);
				scope.dispatchEvent("ON_DRAG_SELECT",[selectedDragger.draggerIndex,scope.storedSoundIndex]);
			}

		};
		var onDragStopped = function(event) {
			scope.storedSoundIndex = -1;
			scope.dispatchEvent("ON_DRAG_STOPPED",null);
			var soundIndex = Data.getSoundIndex(this.draggerIndex);
			this.animatePosition(soundIndex,scope.panner, scope.zoomer);
			this.animateDotToCenter();

			var i;
			total = Data.totalTracks;
			for( i=0; i<total; i++){
				soundIndex = Data.getSoundIndex(i);
				label = scope.labels[i];
				label.updatePosition(soundIndex,scope.panner, scope.zoomer);
				label.show();
			}

		};
		var onDragStarted = function(event) {
			mouse.x = ( event.clientX / (window.innerWidth) ) * 2 - 1;
			mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
			ray.setFromCamera( mouse, scope.camera );
			var intersectors = ray.intersectObjects( scope.draggers, true );
			var isMouseIntersectingDragger = intersectors.length > 0;
			var label;
			if ( isMouseIntersectingDragger ) {
				var dragger = intersectors[0].object.parent;
				var soundIndex = Data.getSoundIndex(dragger.draggerIndex);
				dragger.onMouseDown(event);
				scope.overlay.setSoundIndex(soundIndex);

				scope.hideLabels();

				label = scope.labels[dragger.draggerIndex];
				label.updateData(soundIndex);
				label.updatePosition(soundIndex, scope.panner,scope.zoomer);
				label.bringToFront();
				label.show();

				scope.dispatchEvent("ON_DRAG_START",[dragger.draggerIndex]);
			} else {
				scope.onBgDown(event);
			}

			scope.pointCloud.update();
			scope.pointCloud.draw();
		};

		var onDragAnimationComplete = function(event){
			var soundIndex = Data.getSoundIndex(event.detail.draggerIndex);

			var label = scope.labels[event.detail.draggerIndex];
			label.updateData(soundIndex);
			label.updatePosition(soundIndex,scope.panner, scope.zoomer);

			label.updatePosition(soundIndex,scope.panner, scope.zoomer);

			if(!scope.filter.isVisible){
				label.show();
			}
		};

		var onPinchStarted = function(event) {
			var startScale = scope.zoomer.scale.x;

			var dx = event.touches[ 0 ].clientX - event.touches[ 1 ].clientX;
			var dy = event.touches[ 0 ].clientY - event.touches[ 1 ].clientY;
			var touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

			var onPinchMoved = function(event) {

				var dx = event.touches[ 0 ].clientX - event.touches[ 1 ].clientX;
				var dy = event.touches[ 0 ].clientY - event.touches[ 1 ].clientY;
				var touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );
				var size = startScale + (touchZoomDistanceEnd - touchZoomDistanceStart)*0.025;

				var scalarWidth = window.innerWidth/1000;
				var scalarHeight = (window.innerHeight-controller.clientHeight)/1000;
				var resetScale = (scalarWidth<scalarHeight) ? scalarWidth : scalarHeight;

				size = (size>6) ? 6 : size;
				size = (size<resetScale) ? resetScale : size;

				scope.zoomer.scale.set(size,size,size);
				scope.updateDraggers();
				event.stopPropagation();
				event.preventDefault();
			};

			var onPinchEnded = function(event) {
				scope.context.removeEventListener('touchmove', onPinchMoved, false);
				scope.context.removeEventListener('touchend', onPinchEnded, false);
				scope.context.addEventListener('touchstart', onTouchStarted, false);
			};

			scope.context.addEventListener('touchmove', onPinchMoved, false);
			scope.context.addEventListener('touchend', onPinchEnded, false);

		};

		// create dragger
		for( i=0; i<total; i++){
			dragger = new Dragger({ 
				draggerIndex:i,
				context:this.context, // used for mouse events
			});
			soundIndex = Data.getPosition(Data.getSoundIndex(i));
			dragger.setPosition(soundIndex,scope.panner, scope.zoomer);
			dragger.setColor(Data.getSoundIndex(i));
			dragger.visible = false;
			dragger.addEventListener('ON_MOUSE_DRAGGING', onDragging, false);
			dragger.addEventListener('ON_DRAG_STOPPED', onDragStopped, false);
			dragger.addEventListener('ON_DRAGGER_ANIMATION_COMPLETE', onDragAnimationComplete, false);
			this.base.add( dragger );
			this.draggers.push(dragger);
		}
		// add dragger interaction using raycast
		var mouse = new THREE.Vector2(100000,100000);
		
		this.context.addEventListener('mousedown', onDragStarted, false);

		var onTouchStarted = function(event) {
			event.clientX = event.changedTouches[0].clientX;
			event.clientY = event.changedTouches[0].clientY;
			// HACK - Need a better solution instead of using state changes;
			// SEE - this.onBgDown() onMove()
			switch ( event.touches.length ) {
				case 1:
					scope.touchState = scope.IS_DRAGGING;
					onDragStarted(event);
					break;
				case 2:
					scope.touchState = scope.IS_ZOOMING;
					scope.context.removeEventListener('mousedown', onDragStarted, false);
					scope.context.removeEventListener('touchstart', onTouchStarted, false);
					onPinchStarted(event);
					break;

				default:
			}
		};

		scope.context.addEventListener('touchstart', onTouchStarted, false);

		var onHover = function(event) {
			mouse.x = ( event.clientX / (window.innerWidth) ) * 2 - 1;
			mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
			ray.setFromCamera( mouse, scope.camera );
			var intersectors = ray.intersectObjects( scope.draggers, true );
			var isMouseIntersectingDragger = intersectors.length > 0;
			if ( isMouseIntersectingDragger ) {
				document.body.style.cursor = 'pointer';
			} else {
				document.body.style.cursor = 'auto';
			}
		};
		this.context.addEventListener('mousemove', onHover, false);

	};

	this.showDraggers = function () {
		var i;
		var total = Data.totalTracks;
		for( i=0; i<total; i++){
			this.draggers[i].visible = true;
		}
	};

	this.hideLabels = function () {
		var i;
		var total = Data.totalTracks;

		for( i=0; i<total; i++){
			this.labels[i].hide();
		}
	};

	this.showLabels = function () {
		var i;
		var label;
		var soundIndex;
		var total = Data.totalTracks;
		for( i=0; i<total; i++){
			soundIndex = Data.getSoundIndex(i);
			label = this.labels[i];
			label.show();
			label.updatePosition(soundIndex,scope.panner, scope.zoomer);
		}
	};

	this.enableScroll = function() {
		scope.isScrollDisabled = false;
	};

	this.disableScroll = function() {
		scope.isScrollDisabled = true;
	};

	this.updateDraggers = function() {
		var dragger, label;
		var i;
		var soundIndex, soundPosition;
		total = Data.totalTracks;
		var scalar = scope.zoomer.scale.x;
		Data.pointSize = Math.log(scalar);
		Data.pointSize = (Data.pointSize<1.0) ? 1.0 : Data.pointSize;

		for( i=0; i<total; i++){
			soundIndex = Data.getSoundIndex(i);
			soundPosition = Data.getPosition(soundIndex);
			dragger = this.draggers[i];
			dragger.setPosition(soundPosition,scope.panner, scope.zoomer);
			dragger.setColor(soundIndex);

			label = this.labels[i];
			label.updateData(soundIndex);
			label.updatePosition(soundIndex,scope.panner, scope.zoomer);
		}
	};

	this.createZoomElements = function() {
		var tween;
		var isComplete = true;
		var scalar;

		var zoomTween = function(size){
			var controller = document.getElementById("controller");
			var scalarWidth = window.innerWidth/1000;
			var scalarHeight = (window.innerHeight-controller.clientHeight)/1000;
			var resetScale = (scalarWidth<scalarHeight) ? scalarWidth : scalarHeight;

			size = (size>6) ? 6 : size;
			size = (size<resetScale) ? resetScale : size;

			if(!isComplete) return;
			
			var state = { value: Data.cloudSize2D };
			tween = new TWEEN.Tween(state)
				.to({ value: size }, 250)
				.easing(TWEEN.Easing.Quadratic.InOut)
				.onStart(function(){
					isComplete = false;
				})
				.onUpdate(function() {
					Data.cloudSize2D = state.value;
					scalar = Data.cloudSize2D;
					scope.zoomer.scale.set(scalar,scalar,scalar);
					scope.updateDraggers();
					scope.update(true);
				})
				.onComplete(function(){
					isComplete = true;
				})
				.start();
		};

		this.zoomControls = new ZoomControls();
		this.zoomControls.addEventListener("ON_ZOOM_IN_CLICKED",function(){
			zoomTween(Data.cloudSize2D*2.0);
		}.bind(scope), false);
		this.zoomControls.addEventListener("ON_ZOOM_OUT_CLICKED",function(){
			zoomTween(Data.cloudSize2D/2.0);
		}.bind(scope), false);

		var onWheel = function (event) {
			var delta = (!event.deltaY) ? event.detail : event.deltaY;
			var controller = document.getElementById("controller");
			var scalarWidth = window.innerWidth/1000;
			var scalarHeight = (window.innerHeight-controller.clientHeight)/1000;
			var resetScale = (scalarWidth<scalarHeight) ? scalarWidth : scalarHeight;

			if(scope.isScrollDisabled) {
				return true;
			}
			
			if(delta>0) {
				Data.cloudSize2D/=1.05;
				Data.cloudSize2D = (Data.cloudSize2D<resetScale) ? resetScale : Data.cloudSize2D;
				scalar = Data.cloudSize2D;
				scope.zoomer.scale.set(scalar,scalar,scalar);
				scope.updateDraggers();
			} else {
				Data.cloudSize2D*=1.05;
				Data.cloudSize2D = (Data.cloudSize2D>20) ? 20 : Data.cloudSize2D;
				scalar = Data.cloudSize2D;
				scope.zoomer.scale.set(scalar,scalar,scalar);
				scope.updateDraggers();
			}

			scope.update(true);
		};
		document.body.addEventListener("mousewheel", onWheel.bind(scope), false);
		document.body.addEventListener("DOMMouseScroll", onWheel.bind(scope), false);
	};

	this.createInfo = function() {
		var i, total;

		// label
		total = Data.totalTracks;
		this.labels = [];

		var onInfo = function(x){
			setTimeout(function(){
				scope.overlay.enableClick();
				var soundIndex = Data.getSoundIndex(x);
				scope.hideLabels();
				scope.disableScroll();
				scope.overlay.setSoundIndex(soundIndex);
				scope.overlay.show();
				scope.dispatchEvent("ON_OVERLAY_OPEN",null);
			}, 1);
		};

		for( i=0; i<total; i++){
			label = new Label(i);
			label.addEventListener("ON_INFO",onInfo, false);
			label.init();
			label.hide();
			this.labels.push(label);
		}

		// overlay
		this.overlay = new Overlay();
		this.overlay.addEventListener("ON_CLOSE",function(){
			scope.showLabels();
			scope.enableScroll();
			scope.overlay.hide();
			scope.dispatchEvent("ON_OVERLAY_CLOSED",null);
		});
		this.overlay.addEventListener("ON_TAG",function(tag){
			scope.dispatchEvent("ON_TAG_CLICKED",[tag]);
		});
		this.overlay.init();
	};

	this.hideOverlays = function() {
		scope.overlay.hide();
	};

	this.animateDraggers = function() {
		var i;
		total = Data.totalTracks;
		for( i=0; i<total; i++){
			this.animateDragger(i);
		}
		scope.hideLabels();
	};

	this.animateDragger = function(i) {
		var dragger;
		dragger = this.draggers[i];
		dragger.animatePosition(Data.getSoundIndex(i),scope.panner, scope.zoomer);
		dragger.animateDotToCenter();
		dragger.animateColor(Data.getSoundIndex(i));
	};

	this.dragSelecting = function (draggerIndex, soundIndex) {
		this.draggers[draggerIndex].setColor(soundIndex);
		this.draggers[draggerIndex].dragTrigger();
	};

	this.trigger = function(index, time){
		var i;
		var total = Data.totalTracks;
		for(i=0; i<total; i++){
			var beat = Data.tracks[i].beats[index];
			if (beat > 0){
				this.draggers[i].trigger();
			}
		}
	};

	this.triggerTrack = function(index, time){
		this.draggers[index].trigger();
	};

	this.createListeners = function() {
		window.addEventListener("resize", function (event) {
			scope.resize(event);
		});
	};

	this.update = function(bypass) {
		if(bypass || !Data.areAllChunksLoaded) {
			this.pointCloud.update();
			this.pointCloud.draw();
		}
	};

	this.draw = function() {
		this.pointCloud.draw();
		this.camera.lookAt( this.scene.position );
		this.renderer.render( this.scene, this.camera );
	};

	this.animate = function() {
		this.update();
		this.draw();

		if(this.stats && Config.isStatsEnabled) {
			this.stats.update();
		}

		requestAnimationFrame(function() {
			scope.animate();
		});
	};

	this.updateCloud = function() {
		var i;
		var pos2D;
		var total = Data.getTotalPoints();
		var currentCloud = this.pointCloud.getCloudData();
		for (i = 0; i < total; i++) {
			pos2D = Data.getPosition(i);
			currentCloud.array[ i*3 + 0 ] = pos2D.x;
			currentCloud.array[ i*3 + 2 ] = pos2D.y;
		}
	};

	this.setFilter = function(obj) {
		scope.filter = obj;
	};
	
	// ------------------------------------------------------------
	// EVENTS
	// ------------------------------------------------------------

	this.onBgDown = function (event) {
		var x = (event.clientX-window.innerWidth*0.5) / scope.zoomer.scale.x;
		var y = (-event.clientY+window.innerHeight*0.5) / scope.zoomer.scale.y;

		var anchorOffset = new THREE.Vector2( x, y );
		var draggerStart = new THREE.Vector2(scope.panner.position.x,scope.panner.position.y);

		var onTouchMove = function(event) {
			event.clientX = event.changedTouches[0].clientX;
			event.clientY = event.changedTouches[0].clientY;
			onMove(event);
		};

		var onMove = function(event) {
			if(	scope.touchState === scope.IS_ZOOMING) {
				return;
			}

			scope.panner.position.x = event.clientX-window.innerWidth*0.5;
			scope.panner.position.y = -event.clientY+window.innerHeight*0.5;
			scope.panner.position.x/=scope.zoomer.scale.x;
			scope.panner.position.y/=scope.zoomer.scale.y;
			scope.panner.position.x -= anchorOffset.x;
			scope.panner.position.y -= anchorOffset.y;
			scope.panner.position.x += draggerStart.x;
			scope.panner.position.y += draggerStart.y;
			scope.updateDraggers();
			event.preventDefault();
		};

		var onTouchUp = function(event) {
			event.clientX = event.changedTouches[0].clientX;
			event.clientY = event.changedTouches[0].clientY;
			onUp(event);
		};

		var onUp = function(event) {

			scope.context.removeEventListener('mousemove', onMove, false);
			scope.context.removeEventListener('mouseup', onUp, false);
			scope.context.removeEventListener('mouseupoutside', onUp, false);

			scope.context.removeEventListener('touchmove', onTouchMove, false);
			scope.context.removeEventListener('touchend', onTouchUp, false);
			scope.context.removeEventListener('touchcancel', onTouchUp, false);
			event.preventDefault();
		};

		this.context.addEventListener('mousemove', onMove, false);
		this.context.addEventListener('mouseup', onUp, false);
		this.context.addEventListener('mouseupoutside', onUp, false);

		scope.context.addEventListener('touchmove', onTouchMove, false);
		scope.context.addEventListener('touchend', onTouchUp, false);
		scope.context.addEventListener('touchcancel', onTouchUp, false);

		scope.updateDraggers();
	};

	this.resize = function(event) {
		if(!Config.isResizeDisabled) {

			clearTimeout(scope.resizeTimer);
			scope.resizeTimer = setTimeout(function() {
				scope.camera.left = window.innerWidth / - 2;
				scope.camera.right = window.innerWidth / 2;
				scope.camera.top = window.innerHeight / 2;
				scope.camera.bottom = window.innerHeight / - 2;
				scope.camera.updateProjectionMatrix();
				scope.renderer.setSize( window.innerWidth, window.innerHeight );
				scope.updateDraggers();
			}, 250);

		}

	};
	
	function tweenAnimate(time) {
		requestAnimationFrame(tweenAnimate);
		TWEEN.update(time);
	}
};

Visualizer.prototype = new BoilerPlate();
Visualizer.prototype.constructor = Visualizer;