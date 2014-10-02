var Graph = (function (undefined) {

	var extractKeys = function (obj) {
		var keys = [], key;
		for (key in obj) {
		    Object.prototype.hasOwnProperty.call(obj,key) && keys.push(key);
		}
		return keys;
	}

	var sorter = function (a, b) {
		return parseFloat (a) - parseFloat (b);
	}

	var findPaths = function (map, start, end, infinity) {
		infinity = infinity || Infinity;

		var costs = {},
		    open = {'0': [start]},
		    predecessors = {},
		    keys;

		var addToOpen = function (cost, vertex) {
			var key = "" + cost;
			if (!open[key]) open[key] = [];
			open[key].push(vertex);
		}

		costs[start] = 0;

		while (open) {
			if(!(keys = extractKeys(open)).length) break;

			keys.sort(sorter);

			var key = keys[0],
			    bucket = open[key],
			    node = bucket.shift(),
			    currentCost = parseFloat(key),
			    adjacentNodes = map[node] || {};

			if (!bucket.length) delete open[key];

			for (var vertex in adjacentNodes) {
			    if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
					var cost = adjacentNodes[vertex],
					    totalCost = cost + currentCost,
					    vertexCost = costs[vertex];

					if ((vertexCost === undefined) || (vertexCost > totalCost)) {
						costs[vertex] = totalCost;
						addToOpen(totalCost, vertex);
						predecessors[vertex] = node;
					}
				}
			}
		}

		if (costs[end] === undefined) {
			return null;
		} else {
			return predecessors;
		}

	}

	var extractShortest = function (predecessors, end) {
		var nodes = [],
		    u = end;

		while (u) {
			nodes.push(u);
			predecessor = predecessors[u];
			u = predecessors[u];
		}

		nodes.reverse();
		return nodes;
	}

	var findShortestPath = function (map, nodes) {
		var start = nodes.shift(),
		    end,
		    predecessors,
		    path = [],
		    shortest;

		while (nodes.length) {
			end = nodes.shift();
			predecessors = findPaths(map, start, end);

			if (predecessors) {
				shortest = extractShortest(predecessors, end);
				if (nodes.length) {
					path.push.apply(path, shortest.slice(0, -1));
				} else {
					return path.concat(shortest);
				}
			} else {
				return null;
			}

			start = end;
		}
	}

	var toArray = function (list, offset) {
		try {
			return Array.prototype.slice.call(list, offset);
		} catch (e) {
			var a = [];
			for (var i = offset || 0, l = list.length; i < l; ++i) {
				a.push(list[i]);
			}
			return a;
		}
	}

	var Graph = function (map) {
		this.map = map;
	}

	Graph.prototype.findShortestPath = function (start, end) {
		if (Object.prototype.toString.call(start) === '[object Array]') {
			return findShortestPath(this.map, start);
		} else if (arguments.length === 2) {
			return findShortestPath(this.map, [start, end]);
		} else {
			return findShortestPath(this.map, toArray(arguments));
		}
	}

	Graph.findShortestPath = function (map, start, end) {
		if (Object.prototype.toString.call(start) === '[object Array]') {
			return findShortestPath(map, start);
		} else if (arguments.length === 3) {
			return findShortestPath(map, [start, end]);
		} else {
			return findShortestPath(map, toArray(arguments, 1));
		}
	}

	return Graph;

})();

var debug = true; 
L.mapbox.accessToken = 'pk.eyJ1IjoiY2phY2tzMDQiLCJhIjoiVFNPTXNrOCJ9.k6TnctaSxIcFQJWZFg0CBA';
var map = L.mapbox.map('map', 'cjacks04.jij42jel')
    .setView([31, 35], 4);

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

L.geoJson(allRoutes).addTo(map); 

createMatrix(); 

// omnivore.csv("data/cornu_all.csv")
// 		.on('ready', function(layer) {
// 			this.eachLayer(function(marker) {
// 				marker.setIcon(L.divIcon ({
// 					className: 'site-icon', 
// 					iconSize: [5, 5]
// 				}));
// 				marker.bindPopup(marker.toGeoJSON().properties.name); 
// 			}); 
// 		})
// 		.addTo(map); 

// NETWORK FLOODING 
pathSource = 0;

var graph; 

function createMatrix() {
	var postdata = allRoutes.features; 
	var edgeList = [];
	var edgeMap = {};
	var nodes = [];
	var nodeHash = {};
	for (x in postdata) {
		var line = postdata[x].geometry.coordinates;
		var lS = line[0];
		var lE = line[line.length - 1];
		var nA = [lS,lE];
		for (y in nA) {
			if (!nodeHash["node" + Math.ceil(nA[y][0] * 1000) + (nA[y][1] * 1000)]) {
			  var newNode = {label: "Node " + nodes.length, id: nodes.length.toString(), coordinates: [nA[y]], x: nA[y][0], y: nA[y][1]}
			  nodeHash["node" + Math.ceil(nA[y][0] * 1000) + (nA[y][1] * 1000)] = newNode;
			  nodes.push(newNode)
			}
		}
		postdata[x].properties.source = nodeHash["node" + Math.ceil(lS[0] * 1000) + (lS[1] * 1000)];
		postdata[x].properties.target = nodeHash["node" + Math.ceil(lE[0] * 1000) + (lE[1] * 1000)];
		postdata[x].properties.cost = d3.geo.length(postdata[x]) * 6371;
  	}

// nodeLayer = d3.carto.layer.xyArray();
// nodeLayer
// 	.features(nodes)
// 	.label("Vertices")
// 	.cssClass("node")
// 	.renderMode("svg")
// 	.x("x")
// 	.y("y")
// 	.markerSize(5)
// 	.clickableFeatures(true)
// 	.on("load", function() {d3.selectAll("circle.node").on("click", function(d) {flood(d.id)})});

//map.addCartoLayer(nodeLayer);

	for (x in postdata) {
		if (edgeMap[postdata[x].properties.source.id]) {
			edgeMap[postdata[x].properties.source.id][postdata[x].properties.target.id] = postdata[x].properties.cost;
		}
		else {
			edgeMap[postdata[x].properties.source.id] = {};
			edgeMap[postdata[x].properties.source.id][postdata[x].properties.target.id] = postdata[x].properties.cost;
		}
		if (edgeMap[postdata[x].properties.target.id]) {
			edgeMap[postdata[x].properties.target.id][postdata[x].properties.source.id] = postdata[x].properties.cost;
		}
		else {
			edgeMap[postdata[x].properties.target.id] = {};
			edgeMap[postdata[x].properties.target.id][postdata[x].properties.source.id] = postdata[x].properties.cost;
		}
	}
	console.log("EDGEMAP!!"); 
	graph = new Graph(edgeMap);
	console.log(graph.map[0]); 
	var myIcon = L.divIcon({className: 'site-icon'});
	
	for (var i = 0; i < nodes.length; i++) {
		marker = new L.marker([nodes[i].y, nodes[i].x], {icon: myIcon})
				  .on('click', function(d) {
				  	var n = nodes.filter(function(n) {
				  		return n.x == d.latlng.lng && n.y == d.latlng.lat;
				  	}); 
				  	flood(n[0].id); 
				  	if (!debug) {
					  	console.log(n); 
					  	console.log(nodes[nodes.length -1]);
					  	console.log(d.latlng);
				  	}
				  }) 
				  .addTo(map);  
	}

}

function flood(siteID) {
	siteDistance = d3.keys(graph.map).map(function(d) {return Infinity});
	siteDistance[siteID] = 0;
	console.log(siteID); 
	var map = graph.map;
	console.log(map); 
	var calculatedSites = [siteID];
	var connectedSites = d3.keys(graph.map[siteID]);
	var visitedSites = [siteID];
	var sitesToVisit = [siteID];
	var currentNode = siteID;
	var currentCost = 0;


	while (sitesToVisit.length > 0) {
		sitesToVisit.splice(0,1);
		for (x in connectedSites) {
			if (calculatedSites.indexOf(connectedSites[x]) == -1) {
				console.log("index is -1"); 
				calculatedSites.push(connectedSites[x]);
				siteDistance[connectedSites[x]] = currentCost + map[currentNode][connectedSites[x]];
				console.log(siteDistance[connectedSites[x]]); 
			}
			else {
				console.log("connectedSites[x] is ");
				console.log(connectedSites[x]); 
				siteDistance[connectedSites[x]] = Math.min(currentCost + map[currentNode][connectedSites[x]], siteDistance[connectedSites[x]]);
				console.log(siteDistance); 
			}
		    if (visitedSites.indexOf(connectedSites[x]) == -1 && sitesToVisit.indexOf(connectedSites[x]) == -1) {
		        sitesToVisit.push(connectedSites[x]);
		        console.log("push")
		        console.log(sitesToVisit); 
		    }
		  }
		visitedSites.push(currentNode)
		console.log("sites to Visit: "); 
		console.log(sitesToVisit); 
		//sort sitesToVisit
		sitesToVisit = sitesToVisit.sort(function(a,b) {
			if (siteDistance[a] < siteDistance[b])
				return -1;
			if (siteDistance[a] > siteDistance[b])
				return 1;
			return 0;
		})
		currentNode = sitesToVisit[0];
		currentCost = siteDistance[currentNode];
		connectedSites = d3.keys(graph.map[currentNode]);
	}

	console.log("site Distance: "); 
	console.log(siteDistance[0]); 
	color = d3.scale.linear().domain([0,500,3500]).range(["green","yellow","red"])
	d3.selectAll("node").style("fill", "lightgray")
	.transition()
	.delay(function(d) {return siteDistance[d.id] == Infinity ? 5000 : siteDistance[d.id] * 2})
	.duration(1000)
	.style("fill", function(d) {return siteDistance[d.id] == Infinity ? "gray" : color(siteDistance[d.id])})




}


