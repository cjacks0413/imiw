var width = 960,
    height = 500,
    rotate = -40; 
    maxlat = 83; 

var projection = d3.geo.mercator()
    .rotate([rotate, -28])
    .scale(.55)
    .translate([width/2, height/2]);


function mercatorBounds(projection, maxlat) {
	var yaw = projection.rotate()[0],
		xymax = projection([-yaw+180-1e-6,-maxlat]),
		xymin = projection([-yaw-180+1e-6, maxlat]);
	
	return [xymin,xymax];
} 

var b = mercatorBounds(projection, maxlat),
	s = width/(b[1][0]-b[0][0]),
	scaleExtent = [s, 10*s];

projection.scale(scaleExtent[0]); 

var zoom = d3.behavior.zoom()
	.scaleExtent(scaleExtent)
	.scale(projection.scale())
	.translate([0,0]) 
	.on("zoom", redraw);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom); 

var path = d3.geo.path()
    .projection(projection);

var g = svg.append("g");

d3.json("json/world-110m2.json", function(error, topology) {
    svg.selectAll("path")
      .data(topojson.feature(topology, topology.objects.countries)
          .features)
    .enter()
      .append("path")
      .attr("d", path)
});

var tlast = [0,0],
slast = null;
 
function redraw() {
	if (d3.event) {
		var scale = d3.event.scale,
		t = d3.event.translate;

		// if scaling changes, ignore translation (otherwise touch zooms are weird)
		if (scale != slast) {
			projection.scale(scale);
		} else {
			var dx = t[0]-tlast[0],
			dy = t[1]-tlast[1],
			yaw = projection.rotate()[0],
			tp = projection.translate();

			// use x translation to rotate based on current scale
			projection.rotate([yaw+360.*dx/width*scaleExtent[0]/scale, 0, 0]);

			// use y translation to translate projection, clamped by min/max
			var b = mercatorBounds(projection, maxlat);
			if (b[0][1] + dy > 0) dy = -b[0][1];
			else if (b[1][1] + dy < height) dy = height-b[1][1];
			projection.translate([tp[0],tp[1]+dy]);
		}

		// save last values. resetting zoom.translate() and scale() would
		// seem equivalent but doesn't seem to work reliably?
		slast = scale;
		tlast = t;
	}

	svg.selectAll('path') // re-project path data
	.attr('d', path);
}











