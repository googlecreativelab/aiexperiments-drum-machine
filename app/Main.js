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

require("style/main.scss");
var Config = require("Config");

require(["domready"], function(domReady){

	domReady(function(){

		document.onselectstart = function () { return false; };

		require(["Drums"], function(Drums){
			
			var drums = new Drums();

			var aboutButton = document.getElementById("aboutLink");
			var startLink = document.getElementById("startLink");
			var badges = document.getElementById("badges");
			var cover = document.getElementById("cover");

			var onBadges = function (event) {
				event.stopPropagation();
				event.preventDefault();
			};

			var onAbout = function(event){
				event.preventDefault();
				event.stopPropagation();
			};

			var onStart = function(event){
				drums.beginExperience();

				badges.removeEventListener("click", onBadges,false);
				startLink.removeEventListener('click', onStart, false);
				aboutButton.removeEventListener('click', onAbout, false);
				event.preventDefault();
				event.stopPropagation();
			};

			drums.addEventListener("DRUMS_LOADED",function(){
				if(Config.isSplashDisabled){
					drums.beginExperience();
				} else {
					badges.addEventListener("click", onBadges,false);
					startLink.addEventListener('click', onStart, false);
					aboutButton.addEventListener('click', onAbout, false);
				}
			});
			drums.init();

			cover.classList.add("show");

		});

	});

});