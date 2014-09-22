L.mapbox.accessToken = 'pk.eyJ1IjoiY2phY2tzMDQiLCJhIjoiVFNPTXNrOCJ9.k6TnctaSxIcFQJWZFg0CBA';
var map = L.mapbox.map('map', 'cjacks04.jij42jel')
    .setView([31, 35], 4);

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

d3.json("data/03_Iraq.geojson", function(collection) {
	var transform = d3.geo.transform({point: projectPoint}),
	path = d3.geo.path().projection(transform);
	var feature = g.selectAll("path")
				   .data(collection.features)
				   .enter().append("path");
	
	map.on("viewreset", reset);
	reset();
	
	// Reposition the SVG to cover the features.
	function reset() {
		var bounds = path.bounds(collection),
		topLeft = bounds[0],
		bottomRight = bounds[1];
		svg.attr("width", bottomRight[0] - topLeft[0])
			.attr("height", bottomRight[1] - topLeft[1])
			.style("left", topLeft[0] + "px")
			.style("top", topLeft[1] + "px");
		g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
		feature.attr("d", path);
	}


}); 

function projectPoint(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		this.stream.point(point.x, point.y);
}

omnivore.csv("data/country-capitals.csv")
		.on('ready', function(layer) {
			this.eachLayer(function(marker) {
				marker.setIcon(L.mapbox.marker.icon ({
					'marker-color' : "#ff8888",
					'marker-size': 'medium'
				}));
				marker.bindPopup(marker.toGeoJSON().properties.name); 
			}); 
		})
		.addTo(map); 



