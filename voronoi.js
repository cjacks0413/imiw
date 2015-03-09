function drawVoronoiCells(map, points) {
	var filteredPoints;

	var voronoi = d3.geom.voronoi()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; });

	var draw = function() {
		var bounds = map.getBounds(),
			existing = d3.set(),
			drawLimit = bounds.pad(0.4);

		filteredPoints = points.filter(function(d) {
			var latlng = new L.LatLng(d.lat, d.lon);
			if (!drawLimit.contains(latlng)) { return false };

			var point = map.latLngToLayerPoint(latlng);

			key = point.toString();
			if (existing.has(key)) { return false };
			existing.add(key);

			d.x = point.x;
			d.y = point.y;
			return true;
		});

		var buildPathFromPoint = function(point) {
			return "M" + point.join("L") + "Z";
		}

		var cells = voronoi(filteredPoints); 
		var path = svg.append("g").selectAll("path"); 

		path.data(cells, buildPathFromPoint)
			.enter()
			.append("path")
			.attr("class", "point-cell")
			.attr("d", buildPathFromPoint);
	}

	map.on('viewreset moveend', redraw);
	redraw(); 
	function redraw() {
			d3.select("body").selectAll("path").remove();
			draw();
	 	}
}
