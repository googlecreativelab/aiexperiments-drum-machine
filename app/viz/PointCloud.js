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

var PointCloud = module.exports = function(obj) {
	var scope = this;
	THREE.Object3D.call(this);

	obj = obj || {};

	this.cloud = null;

	var total = Data.getTotalPoints();
	var positions2D = new Float32Array( total * 3 );
	var positions = new Float32Array( total * 3 );
	var colors = new Float32Array( total * 3 );
	var sizes = new Float32Array( total ); // default

	var i;
	var normal;
	var vertexA, vertexB;
	var color = new THREE.Color();
	var pos2D;

	for (i = 0; i < total; i++) {
		normal = i/total;

		// default
		vertexA = new THREE.Vector3( 0, 0, 0 );
		vertexA.toArray( positions, i * 3 );

		pos2D = Data.getPosition(i);
		vertexB = new THREE.Vector3( pos2D.x, 0, pos2D.y );
		vertexB.toArray( positions2D, i * 3 );

		color = Data.getColor(i);
		color.toArray( colors, i * 3 );

		sizes[i] = Data.pointSize;

	}

	var vs = 	"attribute float size;\n" +
				"attribute vec3 customColor;\n" +
				"varying vec3 vColor;\n" +
				"void main() {\n" +
				"	vColor = customColor;\n" +
				"	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n" +
				"	gl_PointSize = size ;//* ( 300.0 / length( mvPosition.xyz ) );\n" +
				"	gl_Position = projectionMatrix * mvPosition;\n" +
				"}\n";

	var fs = 	"uniform vec3 color;\n" +
				"varying vec3 vColor;\n" +
				"void main() {\n" +
				"	gl_FragColor = vec4( color * vColor, 1.0 );\n" +
				"	if ( gl_FragColor.a < ALPHATEST ) discard;\n" +
				"}\n";

	var geometry, material;
	geometry = new THREE.BufferGeometry();
	geometry.addAttribute( 'position2D', new THREE.BufferAttribute( positions2D, 3 ) );
	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	geometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
	geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
	material = new THREE.ShaderMaterial( {
		uniforms: {
			color:   { type: "c", value: new THREE.Color( 0xffffff ) }
		},
		vertexShader: vs,
		fragmentShader: fs,
		alphaTest: 0.1,
	} );

	this.cloud = new THREE.Points( geometry, material );
	this.add( this.cloud );

	// ------------------------------------------------------------
	// VARS AND OBJECTS
	// ------------------------------------------------------------

	this.update = function(){
		var i;
		var attributes = this.getAttributes();
		var currentCloud = this.getCloudData();
		var total = Data.getTotalPoints();
		var state;
		
		var size = Data.pointSize;
		for (i = 0; i < total; i++) {
			attributes.position.array[i*3 + 0] = currentCloud.array[ i*3 + 0 ];
			attributes.position.array[i*3 + 1] = -currentCloud.array[ i*3 + 2 ];
			attributes.position.array[i*3 + 2] = currentCloud.array[ i*3 + 1 ];
			state = Data.getFilterState(i);
			attributes.size.array[i] = size * state;
		}
	};

	this.draw = function(){
		this.cloud.geometry.attributes.position.needsUpdate = true;
		this.cloud.geometry.attributes.size.needsUpdate = true;
	};

	this.removeCloud = function(){
		if(this.cloud) {
			this.remove(this.cloud); 
			this.cloud = null;
		}
	};
	
	this.getCloudData = function(){
		return this.getAttributes().position2D;
	};

	this.getAttributes = function(){
		return this.cloud.geometry.attributes;
	};

};

PointCloud.prototype = new THREE.Object3D();
PointCloud.prototype.constructor = PointCloud;