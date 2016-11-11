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

require("../style/filter.scss");
var BoilerPlate = require("./Boilerplate");
var Data = require("./Data");

var Filter = module.exports = function(x) {
	var scope = this;
	BoilerPlate.call(this);

	this.name = "Filter";

	var filter;
	var filterInput;
	var filterInputWrapper;
	var tags;
	var isTyping = false;
	var clearIcon;
	var clearButton;

	this.isVisible = false;

	this.init = function() {
		filter = document.getElementById("filter");
		filterInputWrapper = filter.getElementsByClassName('input-wrapper')[0];

		// input field added though Filter.js to prevent visual bugs
		var input = document.createElement("input");
		input.className = "input";
		input.type = "text";
		input.placeholder = "ALL TAGS";
		filterInputWrapper.appendChild(input);

		filterInput = filter.getElementsByTagName('input')[0];
		tags = filter.getElementsByClassName('tags')[0];

		clearIcon = filter.getElementsByClassName("clearIcon")[0];
		clearButton = filter.getElementsByClassName("clearButton")[0];
		clearButton.classList.add("show");

		var typeCheckTimer = null;

		filter.addEventListener('input', function(event) {
			if(isTyping===false) {
				clearTimeout(typeCheckTimer);
				typeCheckTimer = setTimeout(function(){
					if(filterInput.value === "") {
						this.dispatchEvent("ON_CLEAR",null);

					} else {
						filterInput.value = filterInput.value.replace(/\s/g, "");
						this.dispatchEvent("ON_UPDATE",[filterInput.value]);
						clearButton.classList.add("show");

					}
					isTyping = false;
				}.bind(scope), 500);
			}
			isTyping = true;
		}.bind(scope));

		var onClearUp = function(event) {
			if(filterInput.value === "") {
				this.dispatchEvent("ON_UPDATE",[filterInput.value]);
				this.dispatchEvent("ON_FOCUS_OUT",null);
				event.stopPropagation();
				return;
			}
			if(this.isVisible) {
				filterInput.value = "";
				this.dispatchEvent("ON_CLEAR",null);
			}
			
			event.stopPropagation();
			event.preventDefault();
			
		}.bind(scope);
		clearButton.addEventListener('click', onClearUp, false);

		filter.addEventListener('keypress', function(event) {
			// SPACE
			if (event.keyCode === 32) {
				return false;
			}

			// RETURN
			if (event.keyCode == 13) {
				clearTimeout(typeCheckTimer);
				this.dispatchEvent("ON_UPDATE",[filterInput.value]);
				this.dispatchEvent("ON_FOCUS_OUT",null);
				event.stopPropagation();				
			}
		}.bind(this));
	};

	this.setField = function(tag) {
		filterInput.value = tag;
		if(tag.toUpperCase()==="" || tag.toUpperCase()==="ALL"){
			filterInputWrapper.setAttribute( "style", "border: 2px solid #666; border-image: none; border-image-slice: none");

		} else {
			var colorOne = "hsl("+Data.getColorValue(tag.charAt(0))+", 100%, 50%)";
			var colorTwo = "hsl("+Data.getColorValue(tag.charAt(tag.length-1))+", 100%, 50%)";
			filterInputWrapper.setAttribute( "style", "border: 2px solid transparent; border-image: linear-gradient(to bottom right, " + colorOne + " 0%, " + colorTwo + " 100%); border-image-slice: 1;");
		}
		filterInput.focus();
	};

	this.hide = function() {
		filter.classList.remove("show");
		this.isVisible = false;
		filterInput.blur();
	};

	this.show = function() {
		filter.classList.add("show");
		this.isVisible = true;
		filterInput.focus();
	};

	this.focus = function() {
		var onBGUp = function(event) {
			if(Data.totalResults===0 && Data.suggestionList.length===0){
				filterInput.value = "";
				this.dispatchEvent("ON_CLEAR",null);
				event.stopPropagation();
				return;
			}
			if ( 
				event.target.className != "input" &&
				event.target.className != "input-wrapper" ) { // Element that you don't want to be prevented default event.
				this.dispatchEvent("ON_FOCUS_OUT",null);
				event.stopPropagation();
			}

		}.bind(scope);

		filter.addEventListener("click", onBGUp, false);
		this.dispatchEvent("ON_FOCUS",[filterInput.value]);

	};

	this.clearAutoSuggest = function() {
		while (tags.firstChild) {
			tags.removeChild(tags.firstChild);
		}
	};
	this.updateAutoSuggest = function() {
		this.clearAutoSuggest();

		var createButton = function(text) {
			var btn = document.createElement("BUTTON");
			btn.className = "tagButton";
			var t = document.createTextNode(text);

			var colorOne = "hsl("+Data.getColorValue(text.charAt(0))+", 100%, 50%)";
			var colorTwo = "hsl("+Data.getColorValue(text.charAt(text.length-1))+", 100%, 50%)";

			var params1 = "";
			params1 += "border-image: linear-gradient(to bottom right, " + colorOne + " 0%, " + colorTwo + " 100%); ";
			params1 += "border-image-slice: 1; ";
			btn.setAttribute("style", params1);

			var onTagClicked = function(event){
				this.dispatchEvent("ON_TAG_CLICKED",[text]);
				event.stopPropagation();
			}.bind(scope);

			btn.addEventListener('click', onTagClicked, false);

			btn.appendChild(t);
			tags.appendChild(btn);

		};

		var total = Data.suggestionList.length;

		if(total===0 && Data.totalResults===0) {
			var container = document.createElement("div");
			container.className = "tagText";
			var t = document.createTextNode("NO RESULTS");

			container.appendChild(t);
			tags.appendChild(container);

			// tags.appendChild(t);
		}

		for(var i=0; i<total; i++){
			createButton(Data.suggestionList[i].value.toUpperCase());
		}
	};
};

Filter.prototype = new BoilerPlate();
Filter.prototype.constructor = Filter;