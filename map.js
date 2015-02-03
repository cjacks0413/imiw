var debug = true; 

L.mapbox.accessToken = 'pk.eyJ1IjoiY2phY2tzMDQiLCJhIjoiVFNPTXNrOCJ9.k6TnctaSxIcFQJWZFg0CBA';
var map = L.mapbox.map('map', 'cjacks04.jij42jel')
    .setView([31, 35], 4);


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

var sites = places.data; 
var test = [];
test.push(sites[2250]);
test.push(sites[50]);
/* Add a LatLng object to each item in the dataset */
sites.forEach(function(d) {
	d.LatLng = new L.LatLng(d.lat, d.lon);
})

var svgSites = g.selectAll("circle")
	.data(sites)
	.enter()
	.append("circle")
	.attr("class", "node")
	.attr("r", 5)
	.on("click", popup); 

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

/* TODO: TOOLTIP */

function popup(d) {

}


/*------------------------------------------------------
 * SETUP ROUTES
 *------------------------------------------------------*/
var routes = allRoutes.features, 
    path = d3.geo.path().projection(project), 
    bounds = d3.geo.bounds(allRoutes),
    svgContainer = d3.select(map.getPanes().overlayPane).append("g"),
    group = svgContainer.append("g").attr("class", "leaflet-zoom-hide"),
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
	map.on("viewset", resetMap);
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
    pathFromAToB; 


/* Tester functions. TODO: add showAllPaths as a layer*/
drawPathFromSourceToTarget("BAGHDAD_443N333E_C03","YATHRIB_396N244E_C07" );
showAllPaths();

function drawPathFromSourceToTarget(sid, tid) {
	var s, t, sTot; 
	sortRoutesByEID(); 
	s = graph.getNode(sid);
	t = graph.getNode(tid);
	sTot = bfs(graph, s, t); 
 	pathFromAToB = sTot; 
	topoPath = createTopoPath(sTot); 
	showPath(topoPath);
}


function sortRoutesByEID() {
	var r; 
	for (var i = 0; i < routes.length; i++) {
		r = routes[i].properties.eToponym;
		if (routesByEID[r] === undefined) {
			routesByEID[r] = routes[i];
		}
	}
}

function createTopoPath(path) {
	var topoPath = []; 
	var routeSection; 
	for (var i = 0; i < path.length; i++ ) {
		routeSection = routesByEID[path[i]];
		topoPath.push(routeSection);
	}
	topoPath = topoPath.filter(isPartOfRoute);
	return topoPath; 
}


function isPartOfRoute(element, index, array) {
	return ((pathFromAToB.indexOf(element.properties.eToponym) >= 0 ) && 
		   (pathFromAToB.indexOf(element.properties.sToponym) >= 0))  
}



/*--------------------------------------------------------
 * UTIL 
 *-------------------------------------------------------*/
function sortSitesByTopURI() {
	var sitesToAdd = places.data; 
	var sortedSites = {}; 
	for (var i = 0; i < sitesToAdd.length; i++) {
		if (sites[sitesToAdd[i].topURI] === undefined) {
			sites[sitesToAdd[i].topURI] = sitesToAdd[i]; 
		}
	}
	return sortedSites; 
}
 








