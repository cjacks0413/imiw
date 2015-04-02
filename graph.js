var Graph = require('data-structures').Graph;
var graph = new Graph(); 
var sites = places.data; 
var routes = allRoutes.features; 
var DAY = 120000; // will be determined using SCRIPT. 
var MULTIPLIER = .10; 
var e, s, edge;  

for (var i = 0; i < routes.length; i++) {
	e = routes[i].properties.eToponym;
	s = routes[i].properties.sToponym;
	graph.addNode(e);
	graph.getNode(e)._id = e;

	graph.addNode(s)
	graph.getNode(s)._id = s; 

	graph.addEdge(e, s); 
	edge = graph.getEdge(e, s); 
  edge._eid = e;
	edge._sid = s; 

	edge._id = routes[i].properties.id; 
  edge.weight = routes[i].properties.Meter; 
}

/* consider doing the routepoint thing in the definition of the graph. 
 so if you run across a routepoint, all edges connecting to it equal 
 weight of routepoint + current edge. maybe that will work? */ 
resetNodes(graph);

function resetNodes(G) {
  graph.forEachNode( function(node) {
    node.visited = false; 
  })
}

/* DIJSKSTRA IMPLEMENTATION ADAPTED FROM: https://github.com/mburst/dijkstras-algorithm */

function PriorityQueue () {
  this._nodes = [];

  this.enqueue = function (priority, key) {
    this._nodes.push({key: key, priority: priority });
    this.sort();
  }
  this.dequeue = function () {
    return this._nodes.shift().key;
  }
  this.sort = function () {
    this._nodes.sort(function (a, b) {
      return a.priority - b.priority;
    });
  }
  this.isEmpty = function () {
    return !this._nodes.length;
  }
}

function findPaths(s, t, withinADay) {
  var shortest = shortestPath(s, t, withinADay); 
  /* second: get rid of longest edge weight */ 
  var max = longestEdge(shortest); 
  max.weight = INFINITY; 
  //var secondShortest = shortestPath(s, t); 
  console.log(secondShortest);
  /* get rid of all edge weights over x weight*/ 
  return shortest; 
}

function secondShortest(s, t, path) {
  var max = longestEdge(path); 
  max.weight = 1/0; 
  var second = shortestPath(s, t, false); // not within a day.
  return second;
}

function longestEdge(path) {
  var max = 0; 
  var edge; 
  for(var i = 0; i < path.length - 1; i++) {
    edge = graph.getEdge(path[i], path[i+1]); 
    if (edge && edge.weight > max) {
      max = edge; 
    }
  }
  return max; 
}


/* THOUGHT for through center. What if instead of through 'centers' I say through 'X?' 
 * As in, I want to go TO fustat and pass through makka. What's the fastest way to do so? 
 * That's pretty easy to implement. Would it be worthwhile? 
 * And if I want to do "major centers", I could have to have a list of the major centers, 
 * then ask if it's a preference or a guarantee. Find the closest major center to the existing
 * shortest path, then do pass through "X" on that center. 
 */ 

function shortestPath(s, t, searchType) {

  console.log(s); 
  var INFINITY = 1/0;
  var nodes = new PriorityQueue(),
          distances = {},
          previous = {},
          path = [],
          smallest, neighbor, alt;
  // init start to 0, all else to infinity  
  graph.forEachNode( function (node) {
    if (node._id == s._id) {
      distances[node._id] = 0
      nodes.enqueue(0, node._id);
    } else {
      distances[node._id] = INFINITY; 
     // nodes.enqueue(INFINITY, node._id);
    } 
    previous[node._id] = null; 
  })

  while(!nodes.isEmpty()) {
    smallest = nodes.dequeue();
    /* create return path */ 
    if(smallest == t._id) {
      path;
      while(previous[smallest]) {
        path.push(smallest);     
        smallest = previous[smallest];
      }
      break;
    }

    var edges = graph.getAllEdgesOf(smallest);
    
    for(var i = 0; i < edges.length; i++) {
      neighbor = edges[i];
      if (searchType == 'd' && neighbor.weight > DAY) {
        continue;  // within a day is tagged and the neighbor's weight is greater than a Day. 
      } else {

          alt = distances[smallest] + neighbor.weight; 
          if (neighbor._sid == smallest) {
            if (alt < distances[neighbor._eid]) {
              distances[neighbor._eid] = alt;
              previous[neighbor._eid] = smallest;
              nodes.enqueue(alt, neighbor._eid);
            }
          } else {
            if (alt < distances[neighbor._sid]) {
              distances[neighbor._sid] = alt;
              previous[neighbor._sid] = smallest;
              nodes.enqueue(alt, neighbor._sid)
            }
          } 
      }
    }
  }
  return path.concat(s._id).reverse(); 
} 

function isMajorCenter(site) {
  return (site.topType == "metropoles" ||
         site.topType == "capitals"   ||
         site.topType == "towns")
}




