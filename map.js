$j = jQuery; 

var voronoi = false; 
var MAX_FIELDS = 6; 
var CROSS_OCEAN_URI = "SPAINTOAFRICA";

L.mapbox.accessToken = 'pk.eyJ1IjoiY2phY2tzMDQiLCJhIjoiVFNPTXNrOCJ9.k6TnctaSxIcFQJWZFg0CBA';
var map = L.mapbox.map('map', 'cjacks04.jij42jel', { 
					zoomControl: false, 
					infoControl: false, 
					attributionControl: true}).setView([31, 35], 5);

var attribution = L.control.attribution().addTo(map);
attribution.addAttribution('Tiles and Data &copy; 2013 <a href="http://www.awmc.unc.edu" target="_blank">AWMC</a> ' +
				     '<a href="http://creativecommons.org/licenses/by-nc/3.0/deed.en_US" target="_blank">CC-BY-NC 3.0</a>');
new L.Control.Zoom( { position: 'bottomleft'}).addTo(map);

/*------------------------------------------------------
 * SETUP SITES 
 *------------------------------------------------------*/

/* note to self: 
 * svg: appending svg appends <svg/> to an element so you can draw all the shapes etc. 
 * g : appending g to svg allows you to group multiple svg shapes, so you can transform them all as if 
 *     they were a single shape. 
 */ 

map._initPathRoot()
var svg = d3.select("#map").select("svg");
g = svg.append("g")
/* SITES */
var sitesByTopURI = sortSitesByTopURI(); 


/* INITIALIZE MAP: MAKE THIS A FUNC! */ 
// init map: onLoad, do the following -- 
// set up sites, set up paths 
// initialize all the UTIL arrays


//var sites = places.data.filter(isDefaultTopType);
var sitesWithRoutes = new Array(); 
removeSitesWithoutRoutes();
var sites = sitesWithRoutes; 
sites.concat(places.data.filter(isDefaultTopType));
function isDefaultTopType(element, index, array) {
	return ( element.topType == 'metropoles' || 
		     element.topType == 'capitals'   || 
		     element.topType == 'temp'       || 
		     element.topType == 'towns'      ||
		     element.topType == 'villages'   || 
		     element.topType == 'waystations'||
		     element.topType == 'sites') 
}

/* Add a LatLng object to each item in the dataset */
sites.forEach(function(d) {
	d.LatLng = new L.LatLng(d.lat, d.lon);
})

svgSites = g.selectAll("circle")
		.data(sites) //change back to "sites"
		.enter()
		.append("circle")
		.attr("r", 2)
		.classed('node', true) 
		.call(d3.helper.tooltip(
			function(d, i){
				return createPopup(d);
			})
		);

showAllPaths(); 
function restoreDefaultMap() {
	g.selectAll("circle.node")
 		   .filter(function(d) { return isDefaultTopType(d)})
 		   .classed('node', true) 
 		   .attr("r", 2)
 		   .style("visibility", "visible"); 

 	g.selectAll("path").style("visibility", "visible"); //to restore after search 
 	showAllPaths(); // to restore after voronoi 
} 

/*------------------------------------------------------
 * SETUP ROUTES
 *------------------------------------------------------*/
var routes = allRoutes.features, 
    path = d3.geo.path().projection(project), 
    svgContainer = d3.select(map.getPanes().overlayPane).append("g"),
    group = svgContainer.append("g").attr("class", "leaflet-zoom-hide"),
    bounds = d3.geo.bounds(allRoutes), 
    feature;

function project(point) {
	var latlng = new L.LatLng(point[1], point[0]); 
	var layerPoint = map.latLngToLayerPoint(latlng); 
	return [layerPoint.x, layerPoint.y]; 
}

/* show subset of allRoutes */
var partial_feature; 
function showPath(partial, color) {
	partial.forEach(function(part) {
		partial_feature = g.selectAll("path")
		 .filter(function(d) {
		 	return d.properties.id == part.properties.id; 
		 })
		 .attr("class", "path-shortest")
		 .attr("stroke", color)
		 .attr("visibility", "visible");
	})
	resetMap();
}

/* Show all paths */
function showAllPaths() {
	d3.json("data/all_routes.json", function(routes) {
		feature = g.selectAll("path")
		   .data(routes.features)
		   .enter()
		   .append("path")
		   .attr("class", "path-all");

	 	resetMap(); 
	 	map.on("viewreset", resetMap); 
	})  
}

function resetMap() {
		/* reposition paths*/
	    var bottomLeft = project(bounds[0]),
	    topRight = project(bounds[1]);
	 
	    svgContainer.attr("width", topRight[0] - bottomLeft[0])
	         .attr("height", bottomLeft[1] - topRight[1])
	         .style("margin-left", bottomLeft[0] + "px")
	         .style("margin-top", topRight[1] + "px");
	 
	    group.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

	    feature.attr("d", path);

	    /* reposition sites*/
	    svgSites.attr("transform",
			function(d) {
				return "translate("+
				map.latLngToLayerPoint(d.LatLng).x +","+
				map.latLngToLayerPoint(d.LatLng).y +")";
		});

	    /* reposition voronoi */ 
	    if (voronoi) {
			d3.select("body").selectAll("path").remove();
			drawVoronoiCells(map, mergedPoints);
		}
 	}



/* ----------------------------------------------------
 * PATH FROM A TO B 
 * Given a start and end node ID, shows path on map
 * ----------------------------------------------------*/

var routesByEID = {},
	routesByID = {}, 
    pathFromAToB,
    pathsToShow = new Array(), 
    shortestPath, 
    pathWithinADay,
    pathThroughCenters,
    pathSourceID; 
var howManyTrue = 0; 


/* Tester functions. TODO: add showAllPaths as a layer*/
//drawPathFromSourceToTarget("MADINNAQIRA_415N255E_C07","YATHRIB_396N244E_C07" );
//drawPathFromSourceToTarget("BAGHDAD_443N333E_C03", "MAKKA_398N213E_C07");
//drawPathFromSourceToTarget("BAGHDAD_443N333E_C03", "AMMAN_359N319E_C01");
//showAllPaths();

var pathColors = {}; 
var pathTypes = d3.set(['Shortest', 'Within A Day']); // can add back 'Through Centers' eventually.. 
var pathInitialSelections = d3.set(['Shortest', 'Within A Day']);
pathTypes.forEach(function(t) {
	pathColors[t] = getRandomColor();
})

selectionsUI('#path-options', pathInitialSelections, pathColors); 
selectionsUI('#itinerary-options', pathInitialSelections, pathColors); 

function selectionsUI(identifier, initialSelections, colors) {
	console.log('creating selections for', identifier);
	var space = d3.select(identifier).selectAll('input')
  			.data(pathTypes.values())
  			.enter().append("label");

	space.append("input")
	  .attr('type', 'checkbox')
	  .property('checked', function(d) {
	    return initialSelections === undefined || initialSelections.has(d)
	  })
	  .attr("value", function(d) { return d }); 

	space.append("span")
	  .attr('class', 'key')
	  .style('background-color', function(d) { return colors[d] });

	space.append("span")
	  .text(function(d) { return d })
	  .attr("class", "english"); 

	return space; 
}

function initializePathMap() {
	var path, 
	    pathMap = d3.map(); 
	// TODO: find way to put these into ONE object that I pull out of. 
	pathMap.set("Shortest", function(s, t) {
		return shortestPath(s, t, 's');  // s == shortest path 
	})	
	pathMap.set("Within A Day", function(s, t) {
		return shortestPath(s, t, 'd'); // d == within a day 
	})
	pathMap.set("Through Centers", function(s, t) {
		return shortestPath(s, t, 'c'); // c == through centers. 
	})
	return pathMap;
}

sortRoutesByEID();

function drawPathFromSourceToTarget(sid, tid, pathSelections, isItinerary) {
	var s, t, pathFunction, pathToShow, topoPath, meters = 0; 
	var pathMap = initializePathMap();
	
	s = graph.getNode(sid);
	t = graph.getNode(tid);

	pathSelections.forEach(function(select) {
		pathFunction = pathMap.get(select); 
		pathToShow = pathFunction(s, t); 
		topoPath = createTopoPath(pathToShow);
		meters = lengthInMeters(topoPath);
		if(!isItinerary) {
			var distance = $j('<div />', {  
				class : 'english', // change to format on screen 
				html : " Distance Traveled on " + select + " Path: " + meters + 'm'
			}).appendTo("#distance");  
		}
		showPath(topoPath, pathColors[select]);
	})
	map.on("viewreset", resetMap);
}

function sortRoutesByEID() {
	var r; 
	for (var i = 0; i < routes.length; i++) {
		r = routes[i].properties.eToponym;
		if (routesByEID[r] === undefined) {
			routesByEID[r] = new Array(); 
			routesByEID[r].push(routes[i]);
		} else {
			routesByEID[r].push(routes[i]);
		}
	}
}

function createTopoPath(partialPath) {
	var topoPath = new Array(); 
	var routeSections = new Array();
	for (var i = 0; i < partialPath.length - 1; i++) {
			routeSections = routesByEID[partialPath[i]];
			addRoutesToPath(routeSections, topoPath);
	}
	topoPath = topoPath.filter(function(element, index, array) {
		return ((partialPath.indexOf(element.properties.eToponym) >= 0 ) && 
		  (partialPath.indexOf(element.properties.sToponym) >= 0))
	});

	return topoPath; 
}

function addRoutesToPath(routes, path) {
	if (routes) {
		for (var i = 0; i < routes.length; i++) {
			path.push(routes[i]);
		}
	}
}
// test itinerary 
var testPlaces = ["FUSTAT_312N300E_C10" ,"MAKKA_398N213E_C07", "BAGHDAD_443N333E_C03", "AMMAN_359N319E_C01"]; 

function findPaths() {
	var pathSelections = selectedTypes('path-options'); 
	var form = $j("#pathfinding-select");
	var fromSite = form[0][0]; 
	var toSite = form[0][1];
	fromID = fromSite.options[fromSite.selectedIndex].value;
	toID = toSite.options[toSite.selectedIndex].value;
	d3.selectAll('.path-shortest').attr("class", "path-all"); //change back to red 
	$j("#distance").empty(); 
	drawPathFromSourceToTarget(fromID, toID, pathSelections, false);
}

function lengthInMeters(path) {
	var m = 0; 
	path.forEach(function(p) {
		m += p.properties.Meter; 
	})
	return m; 
}
/*--------------------------------------------------------
 * ITINERARY : 
 * given an array of places (topURIs), returns a complete
 * path to display. 
 * TODO: enlarge (or activate popup) for stopover between
 * sites in the itinerary 
 *-------------------------------------------------------*/
ItineraryUI(); 
var numFields = 1;  
function createItinerary() {
	var stops = []; 
	var formAnswers = $j('#itinerary-select')[0]; 
	for (var i = 1; i <= numFields; i++) {
		var s = formAnswers[i]; 
		if (s != undefined) {
			stops.push(s.options[s.selectedIndex].value); 
		}
	}
    d3.selectAll('.path-shortest').attr("class", "path-all"); //change back to red 
    var selections = selectedTypes('itinerary-options');
	drawItinerary(stops, selections);
}

function drawItinerary(places, pathSelections) {
	var s, t; 
	var places = replaceOceanWithPath(places); 
	for (var i = 0; i < places.length - 1; i++) {
		s = places[i]; 
		t = places[i+1]; 
		drawPathFromSourceToTarget(s, t, pathSelections, true); 
	}

}
// to deal with crossing the ocean, add two new sites to the place array: 
// Qadis -> Tangat (according to Orbis)
function replaceOceanWithPath(places) {
	var new_places = []; 
	var length = places.length; 
	for(var i = 0; i < length; i++) {
		new_places.push(places[i]); 
		if (places[i] == CROSS_OCEAN_URI) { 
			new_places[i] = "QADIS_061N365W_C14"; // replace places with qadis -> tangat
			new_places[i+1] = "TANJA_058N357W_C12"; 
			length += 1; //add an extra iteration to get the last place. 
		}
	}
	return new_places; 
}
// for now, just removes the last element. 
function ItineraryUI() {
	var wrapper = $(".input_fields_wrap"); 
	var addFieldButton = $(".add_field_button"); 

	var fieldSet = d3.set(); 

	wrapItineraryField(wrapper, numFields, fieldSet);
	fieldSet.add(1); 
	$(addFieldButton).click(function(e) {
		e.preventDefault();
		if (numFields < MAX_FIELDS) {
			numFields++; 
			wrapItineraryField(wrapper, numFields, fieldSet);
		}
	})

	$('#remove-last-field').click(function(e) {
		// var id = $( this ).attr('href');
		// $j(id).remove(); 
		// fieldSet.remove(numFields); 
		$j('.itinerary-dropdown').last().remove(); 
		numFields--;  
	})

}


function wrapItineraryField(wrapper, numFields, fset) {
	// var idNum; 
	// if (fset.has(numFields)) { // all this to deal with the case where i remove x but still need to 
	// 	var values = fset.values();  // reuse the id#. can't repeat ids. 
	// 	var i = 1; 
	// 	for (var i = 1; i < values.length(); i++) {
	// 		if (values[i].parseInt() != i) {
	// 			idNum = i; 
	// 			break;
	// 		} 
	// 	}
	// } else {
	// 	idNum = numFields; 
	// }

	$(wrapper).append('<div id=' + numFields + ' class="itinerary-dropdown"><select></div>'); //do i need an id? 
	createDropDown($j('.input_fields_wrap > div > select')); 

}

function createDropDown(element) {
	for (var i = 0; i < sitesWithRoutes.length; i++) {
		var option =  $j("<option>", { value: sitesWithRoutes[i].topURI, 
									  text: sitesWithRoutes[i].eiSearch});
		element.append(option.clone());
	} 
	// cross ocean 
	element.append(
		$j("<option>", {
			value: CROSS_OCEAN_URI,
			text: 'Travel between Spain and North Africa'
		}) 
	)
}

/*--------------------------------------------------------
 * UTIL 
 * TODO make this modular! 
 *-------------------------------------------------------*/

function sortSitesByTopURI() {
	var sitesToAdd = places.data; 
	var sortedSites = {}; 
	for (var i = 0; i < sitesToAdd.length; i++) {
		if (sortedSites[sitesToAdd[i].topURI] === undefined) {
			sortedSites[sitesToAdd[i].topURI] = sitesToAdd[i]; 
		}
	}
	return sortedSites; 
}

function sortRoutesByRouteID() {
	var r; 
	for (var i = 0; i < routes.length; i++) {
		r = routes[i].properties.id;
		if (routesByID[r] === undefined) {
			routesByID[r] = routes[i];
		}
	}
}

function sortSitesBySource() {
	var data = places.data; 
	var sortedSites = {}; 
	for (var i = 0; i < data.length; i++) {
		if (sortedSites[data[i].source] == undefined) {
			sortedSites[data[i].source] = new Array(); 
			sortedSites[data[i].source].push(data[i]);
		} else { 
			sortedSites[data[i].source].push(data[i]); 
		}
	}
	return sortedSites;
}

function sortSitesByTopType() {
	var data = places.data; 
	var sortedSites = {}; 
	for (var i = 0; i < data.length; i++) {
		if (sortedSites[data[i].topType] == undefined) {
			sortedSites[data[i].topType] = new Array(); 
			sortedSites[data[i].topType].push(data[i]);
		} else { 
			sortedSites[data[i].topType].push(data[i]); 
		}
	}
	return sortedSites;	
}

function removeSitesWithoutRoutes() {
	var currentRoute; 
	$j.each(allRoutes.features,function (id, route) {
		r = route.properties;
		if ((sitesByTopURI[r.eToponym]) && !(exists(sitesWithRoutes, r.eToponym))) {
			sitesWithRoutes.push(sitesByTopURI[r.eToponym]);
		} if ((sitesByTopURI[r.sToponym]) && !(exists(sitesWithRoutes, r.sToponym))) {
			sitesWithRoutes.push(sitesByTopURI[r.sToponym]); 
		} 
	})
	sitesWithRoutes = places.data; 
	sitesWithRoutes.sort( function(a, b) {
		var element1 = a.eiSearch.toLowerCase(); 
		var element2 = b.eiSearch.toLowerCase(); 
		if (element1 < element2) {
			return -1 
		} if (element1 > element2 ) {
			return 1 
		} 
		return 0; 
	})
}

function exists(array, el) {
	var elementsFound = array.filter(function(element, index, array) {
		return element.topURI == el; 
	})	
	return elementsFound.length > 0; 
}



/*-----------------------------------------------------
 * VORONOI 
 *----------------------------------------------------*/ 
/* from https://github.com/zetter/voronoi-maps 
 */

$j('#toggle-voronoi').on("click", function() {
	if (voronoi) {
		$j("#options").hide();
		d3.select("body").selectAll(".point-cell").remove();
		g.selectAll("circle.node").style("fill", null).style("visibility", "hidden");
		slideRight('#path-form-right');
		restoreDefaultMap();
		voronoi = false;
	} else if (!voronoi) {
		$j("#options").show(); 
		slideLeft('#path-form-left'); 
		renderVoronoi();
		voronoi = true; 
	}
})

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var topTypeColors = {}; 
var sitesByTopType = sortSitesByTopType();
var topTypes = d3.set(Object.keys(sitesByTopType));
var voronoiInitialSelections = d3.set(['metropoles', 'capitals', 'villages']);

topTypes.forEach(function(t) {
	topTypeColors[t] = getRandomColor();
})

/* call selectionUI func here, then set d3.*/ 
labels = d3.select('#voronoi-select').selectAll('input')
  .data(topTypes.values())
  .enter().append("label");

labels.append("input")
  .attr('type', 'checkbox')
  .property('checked', function(d) {
    return voronoiInitialSelections === undefined || voronoiInitialSelections.has(d)
  })
  .attr("value", function(d) { return d })
  .on("change", renderVoronoi);

labels.append("span")
  .attr('class', 'key')
  .style('background-color', function(d) { return topTypeColors[d] });

labels.append("span")
  .text(function(d) { return d });


var selectedTypes = function(identifier) {
	return d3.selectAll('#' + identifier + ' input[type=checkbox]')[0].filter(function(elem) {
	  return elem.checked;
	}).map(function(elem) {
	  return elem.value;
	})
}

var mergedPoints; 
function renderVoronoi() {
	var selected = selectedTypes('voronoi-select'); 
	var pointsToDraw = new Array(); 
	mergedPoints = [];
	g.selectAll("circle.node").style("visibility", "hidden");
	selected.forEach(function(s) {
		g.selectAll("circle.node")
		 		   .filter(function(d) { return d.topType == s})
		 		   .style("fill", topTypeColors[s])
		 		   .attr("r", 3)
		 		   .style("visibility", "visible")
		pointsToDraw.push(sitesByTopType[s]);
	})

	mergedPoints = pointsToDraw.concat.apply(mergedPoints, pointsToDraw);
	drawVoronoiCells(map, mergedPoints);	
}

 

/*-----------------------------------------------------
 * UI  
 *----------------------------------------------------*/ 

/* Create select (dropdown) for pathfinding */

var from, to, selectFrom, selectTo; 
from = $j("#site-from")
to = $j("#site-to");
selectFrom = $j('<select>', {id: "select-from"}).appendTo(from);
selectTo = $j('<select>', {id: "select-to"}).appendTo(to);

for (var i = 0; i < sitesWithRoutes.length; i++) {
	var option =  $j("<option>", { value: sitesWithRoutes[i].topURI, 
								  text: sitesWithRoutes[i].eiSearch});
	selectFrom.append(option.clone());
	selectTo.append(option.clone())
}

/* TABS 
 * TODO: this is ugly af. 
*/
$j("#pathfinding-title").on("click", function() {
	$j('#itinerary-content').hide();
	$j('#itinerary-title').removeClass("tab-selected"); 
	$j( this ).addClass("tab-selected"); 
	$j('#pathfinding-content').show();
})

$j("#itinerary-title").on("click", function() {
	$j("#pathfinding-title").removeClass("tab-selected"); 
	$j('#pathfinding-content').hide();
	$j( this ).addClass("tab-selected"); 
	$j('#itinerary-content').show(); 
})

/* SLIDE left and right */
$j('#path-form-left').on("click", function() {
	slideLeft(this); 
})

$j('#path-form-right').on("click", function() {
	slideRight(this);
})

function slideLeft(identifier) {
	$j('#site-form').hide('slide', {direction: 'left'}, 1000);
	$j( identifier ).hide();
	$j('#path-form-right').show();
}

function slideRight(identifier) {
	$j('#site-form').show('slide', {direction: 'left'}, 1000); 
	$j( identifier ).hide();
	$j('#path-form-left').show();
}



/*-----------------------------------------------------
 * POPUP / TOOLTIP 
 *----------------------------------------------------*/
function createPopup(place) {
	return('<center><span class="arabic">' + place.arTitle + 
	'</span><br><br><span class="english">' + place.translitTitle); 
} 

/*--------------------------------------------------------
 * SEARCH/FILTER 
 *-------------------------------------------------------*/

$j('#search input').on('keyup', (function (e) {
	if (e.which == 13) {
		g.selectAll("circle.node").style("visibility", "hidden");
		g.selectAll("path").style("visibility", "hidden");
		//changed places.data to sites
		var matchesIndex = filterPlaces( $j ( this ).val(), sites, ['translitTitle','UStranslitTitle','arTitle','topURI','topType']);
		for ( var i=0; i < matchesIndex.length; i++ ) {
			s_id = sites[matchesIndex[i]].topURI;
			g.selectAll("circle.node")
			 		   .filter(function(d) { return d.topURI === s_id})
			 		   .classed('node', true) 
			 		   .attr("r", 4)
			 		   .style("visibility", "visible")
		}
	}
	if ( $j (this).val() == "") {
		restoreDefaultMap(); 
		g.selectAll("path").style("visibility", "visible");
	}
  })
);


function filterPlaces( _needle, _obj, _keys ) {
	var matches = [];
	var needle = _needle.toUpperCase();
	for ( var i=0, ii=_obj.length; i<ii; i++ ) {
		for ( var j=0, jj=_keys.length; j<jj; j++ ) {
			var stack = _obj[i][_keys[j]].toUpperCase();
			if ( stack.indexOf( needle ) != -1 ) {
				matches.push( i );
			}
		}
	}
	return matches;
}









