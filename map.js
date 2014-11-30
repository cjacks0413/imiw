var debug = true; 
L.mapbox.accessToken = 'pk.eyJ1IjoiY2phY2tzMDQiLCJhIjoiVFNPTXNrOCJ9.k6TnctaSxIcFQJWZFg0CBA';
var map = L.mapbox.map('map', 'cjacks04.jij42jel')
    .setView([31, 35], 4);

/*------------------------------------------------------
 * SETUP SITES AND ROUTES
 *------------------------------------------------------*/
map._initPathRoot()
var svg = d3.select("#map").select("svg"),
g = svg.append("g"); 


var svgContainer = d3.select(map.getPanes().overlayPane).append("svg"); 
//g maybe? 
var group = svgContainer.append("g").attr("class", "leaflet-zoom-hide")
var width = document.getElementById('container').offsetWidth;
var height = width / 2;

var sites = places.data; 
/* Add a LatLng object to each item in the dataset */

sites.forEach(function(d) {
	d.LatLng = new L.LatLng(d.lat, d.lon);
})

var svgSites = g.selectAll("circle")
	.data(sites)
	.enter().append("circle")
	.attr("class", "node")
	.attr("r", 5);

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

/* TODO: MAKE PATH INTERACTIVE..? */
var group = svgContainer.append("g").attr("class", "leaflet-zoom-hide")
var path = d3.geo.path().projection(project); 

// var projection = d3.geo.mercator()
// 				 .scale(1000)
// 				 .translate(width/2, height/2); 

function project(point) {
	var latlng = new L.LatLng(point[1], point[0]); 
	var layerPoint = map.latLngToLayerPoint(latlng); 
	return [layerPoint.x, layerPoint.y]; 
}

d3.json("data/all_routes.json", function(routes) {
	var feature = group.selectAll("path")
	   .data(routes.features)
	   .enter()
	   .append("path");

	var bounds = d3.geo.bounds(routes); 

	function reset() {
	    var bottomLeft = project(bounds[0]),
	    topRight = project(bounds[1]);
	 
	    svgContainer.attr("width", topRight[0] - bottomLeft[0])
	         .attr("height", bottomLeft[1] - topRight[1])
	         .style("margin-left", bottomLeft[0] + "px")
	         .style("margin-top", topRight[1] + "px");
	 
	    group.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
	 
	    feature.attr("d", path);
 	}

 	reset(); 
 	map.on("viewreset", reset); 

})





