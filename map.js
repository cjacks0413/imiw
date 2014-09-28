L.mapbox.accessToken = 'pk.eyJ1IjoiY2phY2tzMDQiLCJhIjoiVFNPTXNrOCJ9.k6TnctaSxIcFQJWZFg0CBA';
var map = L.mapbox.map('map', 'cjacks04.jij42jel')
    .setView([31, 35], 4);

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

var allRoutes = L.geoJson(allRoutes).addTo(map); 

function projectPoint(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		this.stream.point(point.x, point.y);
}

omnivore.csv("data/cornu_all.csv")
		.on('ready', function(layer) {
			this.eachLayer(function(marker) {
				marker.setIcon(L.divIcon ({
					className: 'site-icon', 
					iconSize: [5, 5]
				}));
				marker.bindPopup(marker.toGeoJSON().properties.name); 
			}); 
		})
		.addTo(map); 



