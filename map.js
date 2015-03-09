$j = jQuery; 
var debug = true; 

/* TODO: make this more efficient */ 

var pathFind = false;
var shortestPathCornu = true;
var shortestPathMuqaddasi = false;
var networkFlooding = false; 
var hierarchy = false; 
var voronoi = false; 


L.mapbox.accessToken = 'pk.eyJ1IjoiY2phY2tzMDQiLCJhIjoiVFNPTXNrOCJ9.k6TnctaSxIcFQJWZFg0CBA';
var map = L.mapbox.map('map', 'cjacks04.jij42jel', {zoomControl: false}).setView([31, 35], 5);
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

//var sites = places.data.filter(isRelevantTopType);
var sitesWithRoutes = new Array(); 
removeSitesWithoutRoutes();
var sites = sitesWithRoutes; 
function isRelevantTopType(element, index, array) {
	return ( element.topType == 'metropoles' || 
		     element.topType == 'capitals'   || 
		     element.topType == 'temp'       || 
		     element.topType == 'towns'      ||
		     element.topType == 'villages'   ) 
	// could add sites or waystations
}

/* Add a LatLng object to each item in the dataset */
sites.forEach(function(d) {
	d.LatLng = new L.LatLng(d.lat, d.lon);
})
/*NOTE: make this function to later reset the map */ 
var svgSites = g.selectAll("circle")
	.data(sites)
	.enter()
	.append("circle")
	.attr("class", "node")
	.style("stroke", "black")
	.style("stroke-width", 2)
	.attr("r", 2)
	.call(d3.helper.tooltip(
		function(d, i){
			generateContent(d);
			return createPopup(d);
		})
	);


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
function showPath(partial) {		
	feature = g.selectAll("path")
		.data(partial)
		.enter()
		.append("path");
	
	resetMap();
}

/* Show all paths */
function showAllPaths() {
	d3.json("data/all_routes.json", function(routes) {
		feature = g.selectAll("path")
		   .data(routes.features)
		   .enter()
		   .append("path");

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

 	}



/* ----------------------------------------------------
 * PATH FROM A TO B 
 * Given a start and end node ID, shows path on path
 * TODO: deal with the missing pieces ...
 * TODO: animate the path  
 * ----------------------------------------------------*/
var routesByEID = {},
	routesByID = {}, 
    pathFromAToB, 
    pathSourceID; 
var howManyTrue = 0; 

function identifySourceClick(d) {
	svgSites.selectAll("circle.node").style("stroke-width", "1px").style("stroke", "black");
	pathSourceID = d.topURI; 
	d3.selectAll("circle.node").on("click", identifyTargetClick); 
}

function identifyTargetClick(d) {
	drawPathFromSourceToTarget(pathSourceID, d.topURI);
	pathFind = false; 
	d3.selectAll("circle.node").on("click", assign);
}

/* Tester functions. TODO: add showAllPaths as a layer*/
//drawPathFromSourceToTarget("MADINNAQIRA_415N255E_C07","YATHRIB_396N244E_C07" );
//drawPathFromSourceToTarget("BAGHDAD_443N333E_C03", "MAKKA_398N213E_C07");
//drawPathFromSourceToTarget("BAGHDAD_443N333E_C03", "AMMAN_359N319E_C01");
//showAllPaths();

function drawPathFromSourceToTarget(sid, tid) {
	var s, t; 
	sortRoutesByEID(); 
	sortRoutesByRouteID();
	s = graph.getNode(sid);
	t = graph.getNode(tid);
	//var test = shortestPath(s, t);
	pathFromAToB = shortestPath(s, t, true);
	topoPath = createTopoPath(); 
	showPath(topoPath);
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

function createTopoPath() {
	var topoPath = []; 
	var routeSection; 
	for (var i = 0; i < pathFromAToB.length - 1; i++) {
		routeSections = routesByEID[pathFromAToB[i]];
		addRoutesToPath(routeSections, topoPath);
	}
	topoPath = topoPath.filter(isPartOfRoute);
	return topoPath; 
}

function addRoutesToPath(routes, path) {
	if (routes) {
		for (var i = 0; i < routes.length; i++) {
			path.push(routes[i]);
		}
	}
}

function isPartOfRoute(element, index, array) {
	return ((pathFromAToB.indexOf(element.properties.eToponym) >= 0 ) && 
		   (pathFromAToB.indexOf(element.properties.sToponym) >= 0))
}


/*--------------------------------------------------------
 * HIERARCHY
 *-------------------------------------------------------*/
var sitesBySource = sortSitesBySource(); 
var metropoles = new Array();  
$j.each(sitesBySource, function(id, source) {
	metropoles.push(source.filter(isMetropole)); 
})

console.log("metropoles:" , metropoles);
function isMetropole(element, index, array) {
	return element.topType == "metropoles";
}
/*--------------------------------------------------------
 * UTIL 
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


showHide = function(selector) {
  d3.select(selector).select('.hide').on('click', function(){
    d3.select(selector)
      .classed('visible', false)
      .classed('hidden', true);
  });

  d3.select(selector).select('.show').on('click', function(){
    d3.select(selector)
      .classed('visible', true)
      .classed('hidden', false);
  });
}

showTest = function(selector) {
	$j(selector).on('click', function() {
		resetOptions();
		$j(selector).shortestPath; 
	})
}

/*-----------------------------------------------------
 * VORONOI 
 *----------------------------------------------------*/ 
/* UI. is a check list. so "sites" needs to change
 * based on what is checked
 * THEN i need to update svgSites to indicate the 
 * changes, potentially adding different colors
 * for each topType.
 */
if (voronoi) {
	drawVoronoiCells(map, sites);
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

function findPaths() {
	if (shortestPathCornu) {
		var form = $j("#pathfinding-select");
		var fromSite = form[0][0]; 
		var toSite = form[0][1];
		fromID = fromSite.options[fromSite.selectedIndex].value;
		toID = toSite.options[toSite.selectedIndex].value;
		//g.selectAll("path").style("visibility", "hidden");
		drawPathFromSourceToTarget(fromID, toID);
	} else if (networkFlooding) {
		console.log("sorry, this functionality has not yet been implemented"); 
	} else if (shortestPathMuqaddasi) {
		console.log("sorry, this functionality has not yet been implemented");
	}
}

/* checkboxes 
*  TODO; MAKE THIS MODULAR */
$j('#shortest-path-wrapper').on("click", function() {
	resetOptions()
	$j('#shortest-path').show(); 
	shortestPathCornu = true;
})
$j('#muqaddasi-path-wrapper').on("click", function() {
	resetOptions();
	$j('#muqaddasi-path').show();
	shortestPathMuqaddasi = true;
}) 

$j('#voronoi-wrapper').on("click", function() {
	resetOptions();
	$j('#voronoi').show();
	voronoi = true;
})


function resetOptions() {
	$j('#shortest-path').hide();
	$j('#network-flooding').hide();
	$j('#muqaddasi-path').hide();
	$j('#voronoi').hide();
	$j('#hierarchy').hide()
	shortestPathCornu = false;
	shortestPathMuqaddasi = false;
	voronoi = false;
}

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

/*-----------------------------------------------------
 * LAYER GROUPS 
 *----------------------------------------------------*/ 

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
			 		   .on("click", assign)
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









