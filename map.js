$j = jQuery; 
var debug = true; 

/* TODO: make this more efficient */ 

var hierarchy = false; 
var voronoi = false; 


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
		.attr("class", "node")
		.style("stroke", "black")
		.style("stroke-width", 2)
		.attr("r", 2)
		.call(d3.helper.tooltip(
			function(d, i){
				return createPopup(d);
			})
		);

showAllPaths(); 
function restoreDefaultMap() {
	g.selectAll("circle.node")
 		   .filter(function(d) { return isDefaultTopType(d)})
 		   .attr("class", "node")
 		   .style("stroke", "black")
		   .style("stroke-width", 2)
 		   .attr("r", 2)
 		   .style("visibility", "visible"); 
 	showAllPaths(); 
} 


map.on("viewreset", update);

update();

function update() {
	svgSites.attr("transform",
		function(d) {
			return "translate("+
			map.latLngToLayerPoint(d.LatLng).x +","+
			map.latLngToLayerPoint(d.LatLng).y +")";
		}
	)

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
	    //partial_feature.attr("d", path);

	    /* reposition sites*/
	    svgSites.attr("transform",
			function(d) {
				return "translate("+
				map.latLngToLayerPoint(d.LatLng).x +","+
				map.latLngToLayerPoint(d.LatLng).y +")";
		});

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

/* TODO: allRoutes + new route overlaid on top of it.  
 * 
*/ 

var pathColors = {}; 
var pathTypes = d3.set(['Shortest', 'Within A Day', 'Through Centers']);
var initialSelections = d3.set(['Shortest', 'Within A Day']);
pathTypes.forEach(function(t) {
	pathColors[t] = getRandomColor();
})

path_labels = d3.select('#path-options').selectAll('input')
  .data(pathTypes.values())
  .enter().append("label");

path_labels.append("input")
  .attr('type', 'checkbox')
  .property('checked', function(d) {
    return initialSelections === undefined || initialSelections.has(d)
  })
  .attr("value", function(d) { return d }); 

path_labels.append("span")
  .attr('class', 'key')
  .style('background-color', function(d) { return pathColors[d] });

path_labels.append("span")
  .text(function(d) { return d })
  .attr("class", "english");


var pathSelectedTypes = function() {
	return d3.selectAll('#path-options input[type=checkbox]')[0].filter(function(elem) {
	  return elem.checked;
	}).map(function(elem) {
	  return elem.value;
	})
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

function drawPathFromSourceToTarget(sid, tid, pathSelections) {
	sortRoutesByEID();
	var s, t, pathFunction, pathToShow; 
	var pathMap = initializePathMap();
	
	s = graph.getNode(sid);
	t = graph.getNode(tid);

	pathSelections.forEach(function(select) {
			pathFunction = pathMap.get(select); 
			pathToShow = pathFunction(s, t); 
			showPath(createTopoPath(pathToShow), pathColors[select]);
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
	var topoPath = []; 
	var routeSection; 
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
var testPathSelections = ["Shortest"]; 

function findPaths() {
	var pathSelections = pathSelectedTypes(); 
	var form = $j("#pathfinding-select");
	var fromSite = form[0][0]; 
	var toSite = form[0][1];
	fromID = fromSite.options[fromSite.selectedIndex].value;
	toID = toSite.options[toSite.selectedIndex].value;
	d3.selectAll('.path-shortest').attr("class", "path-all"); //change back to red 
	drawPathFromSourceToTarget(fromID, toID, pathSelections);
}
/*--------------------------------------------------------
 * ITINERARY : 
 * given an array of places (topURIs), returns a complete
 * path to display. 
 * TODO: enlarge (or activate popup) for stopover between
 * sites in the itinerary 
 *-------------------------------------------------------*/
function createItinerary(places, pathSelections) {
	var s, t; 
	for (var i = 0; i < places.length - 1; i++) {
		s = places[i]; 
		t = places[i+1]; 
		drawPathFromSourceToTarget(s, t, pathSelections); 
	}
}


/*--------------------------------------------------------
 * HIERARCHY
 *-------------------------------------------------------*/
var sitesBySource = sortSitesBySource(); 
var metropoles = new Array();  
$j.each(sitesBySource, function(id, source) {
	metropoles.push(source.filter(isMetropole)); 
})

function isMetropole(element, index, array) {
	return element.topType == "metropoles";
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
/* TODO: get rid of "trash" */ 
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
		restoreDefaultMap();
		voronoi = false;
	} else if (!voronoi) {
		$j("#options").show(); 
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
var initialSelections = d3.set(['metropoles', 'capitals', 'villages']);
topTypes.forEach(function(t) {
	topTypeColors[t] = getRandomColor();
})

labels = d3.select('#voronoi-select').selectAll('input')
  .data(topTypes.values())
  .enter().append("label");

labels.append("input")
  .attr('type', 'checkbox')
  .property('checked', function(d) {
    return initialSelections === undefined || initialSelections.has(d)
  })
  .attr("value", function(d) { return d })
  .on("change", renderVoronoi);

labels.append("span")
  .attr('class', 'key')
  .style('background-color', function(d) { return topTypeColors[d] });

labels.append("span")
  .text(function(d) { return d });


var selectedTypes = function() {
	return d3.selectAll('#voronoi-select input[type=checkbox]')[0].filter(function(elem) {
	  return elem.checked;
	}).map(function(elem) {
	  return elem.value;
	})
}

function renderVoronoi() {
	var selected = selectedTypes(); 
	var pointsToDraw = new Array(); 
	var mergedPoints = [];
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
	$j('#site-form').hide('slide', {direction: 'left'}, 1000);
	$j( this ).hide();
	$j('#path-form-right').show();
})


$j('#path-form-right').on("click", function() {
	$j('#site-form').show('slide', {direction: 'left'}, 1000); 
	$j( this ).hide();
	$j('#path-form-left').show();
})

$j('#options-right').on("click", function() {
	$j('#options').hide('slide', {direction: 'right'}, 1000);
	$j( this ).hide();
	$j('#options-left').show();
}) 

$j('#options-left').on("click", function() {
	$j('#options').show('slide', {direction: 'right'}, 1000);
	$j( this ).hide();
	$j('#options-right').show();
})


/*-----------------------------------------------------
 * POPUP / TOOLTIP 
 * Todo: fix the tooltip "x" 
 *----------------------------------------------------*/
 /*TODO: make this less gross. /
function createPopup(place) {
	return('<center><span class="arabic">' + place.arTitle + 
	'</span><br><br><span class="english">' + place.translitTitle + 
	'<br><i>Check in:</i><br></span><div id="index-lookup" class="basic">' +
	' <a href="#' + place.topURI + '" onclick="openMatch()">Arabic Sources</a>;' + 
	'</div> <a href="http://referenceworks.brillonline.com/search?s.q='+place.eiSearch+'&s.f.s2_parent=s.f.cluster.Encyclopaedia+of+Islam&search-go=Search" target="_blank">' +
	'Encylopaedia of Islam</a>;<br> <a href="http://pleiades.stoa.org/search?SearchableText='+place.translitSimpleTitle+'" target="_blank">' + 
	'Pleiades</a>; <a href="https://en.wikipedia.org/wiki/Special:Search/'+place.translitSimpleTitle+'" target="_blank">Wikipedia</a></center>');
} */ 

function createPopup(place) {
	return('<center><span class="arabic">' + place.arTitle + 
	'</span><br><br><span class="english">' + place.translitTitle); 
} 

function openMatch() {
    d3.select('body').selectAll('div.tooltip').remove();
    /* close left and right side panels */ 
	$j('#site-form').hide();
	$j('#path-form-left').hide();
	$j('#path-form-right').show();

	$j("#index-lookup-content").show();
}


/* ARABIC SOURCES */ 
$j("#close-index").click(function(e){
	$j("#index-lookup-content").hide();
});
$j("#close-match").click(function(e) {
	$j("#index-lookup-match").hide(); 
});

function generateContent(place) {
	/* bind click event*/
	var id = place.arBW;
	var lookup = matchIndex[id];
	/* remove content already in div*/
	$j("#exact").empty(); 
	$j("#fuzzy").empty(); 
	$j("#match").empty();
	/* hack to turn string array into array of strings */ 
	var exact_matches = lookup.exact.join().split(","); 
	var fuzzy_matches = lookup.fuzzy.join().split(","); 
	/* found vs not found */ 
	$j.each(exact_matches, function(_id, exact) {
		var has_exact_matches = gazetteers[exact] != undefined;
		if (has_exact_matches) {
			var link = $j('<a/>', {
				href  : '#' + exact,  
				class : 'arabic-link', 
				html : "<li class=match-list>" + gazetteers[exact].title + " (" + gazetteers[exact].source + ")</li>",
				click : function() { 
					$j("#index-lookup-match").show();  
					var id = $j(this).attr('href'); 
					$j(".match-display-reference").hide(); 
					$j(id).show();
				}
			}).appendTo("#exact"); 
			var content = $j('<div/>', {
				id : exact, 
				/*  CHANGE CLASS FOR REFERENCE HERE! */
				html : "<div class='english'>" + gazetteers[exact].reference + "</div>" + gazetteers[exact].text, 
				class : 'match-display-reference'
			}).appendTo("#match"); 
		} else {
			$j("#exact").append("لم يُعثر على أية نتائج");
		}
	}); 
	$j.each(fuzzy_matches, function(_id, fuzzy) {
		var has_fuzzy_matches = gazetteers[fuzzy] != undefined;  
		if (has_fuzzy_matches) {
			var link = $j('<a/>', {
				href  : '#' + fuzzy,  
				class : 'arabic-link', 
				html : "<li class=match-list>" + gazetteers[fuzzy].title + " (" + gazetteers[fuzzy].source + ")</li>",
				click : function() { 
					displayMatch(); 
					var id = $j(this).attr('href'); 
					$j(".match-display").hide(); 
					$j(id).show();
				}
			}).appendTo("#fuzzy"); 
			var content = $j('<div/>', {
				id : fuzzy, 
				html : gazetteers[fuzzy].reference + gazetteers[fuzzy].text, 
				class : 'match-display-reference'
			}).appendTo("#match"); 
		} else {
			$j("#fuzzy").append("...");
		}

	}); 

} 

/*--------------------------------------------------------
 * SEARCH/FILTER 
 *-------------------------------------------------------*/

$j('#search input').on('keyup', (function (e) {
	if (e.which == 13) {
		g.selectAll("circle.node").style("visibility", "hidden");
		g.selectAll("path").style("visibility", "hidden");
		//changed places.data to sites
		var matchesIndex = filterPlaces( $j ( this ).val(), sites, ['translitTitle','translitSimpleTitle','arTitle','topURI','topType']);
		for ( var i=0; i < matchesIndex.length; i++ ) {
			s_id = sites[matchesIndex[i]].topURI;
			g.selectAll("circle.node")
			 		   .filter(function(d) { return d.topURI === s_id})
			 		   .attr("class", "node")
			 		   .attr("r", 4)
			 		   .style("visibility", "visible")
		}
		update();
	}
	if ( $j (this).val() == "") {
		g.selectAll("circle.node").style("visibility", "visible");
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









