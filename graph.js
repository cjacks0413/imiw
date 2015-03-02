var Graph = require('data-structures').Graph;
var graph = new Graph(); 
var sites = places.data; 
var routes = allRoutes.features; 

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

function shortestPath(s, t) {
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
        //console.log(graph.getEdge(previous[smallest], smallest));
        path.push(smallest);
        // edge = graph.getEdge(previous[smallest], smallest); 
        // if (edge) {
        //   path.push(edge._id);
        // }
        
        smallest = previous[smallest];
      }
      break;
    }

    // if(!smallest || distances[smallest] === INFINITY){
    //   continue;
    // }

    var edges = graph.getAllEdgesOf(smallest);
   // console.log(edges);
    
    for(var i = 0; i < edges.length; i++) {
      neighbor = edges[i];

      //console.log("exploring from: ", smallest);
      alt = distances[smallest] + neighbor.weight; 

      if (neighbor._sid == smallest) {
        if (alt < distances[neighbor._eid]) {
          distances[neighbor._eid] = alt;
          previous[neighbor._eid] = smallest;
       //   console.log("enqueueing: ", alt, neighbor._eid);
          nodes.enqueue(alt, neighbor._eid);
        }
      } else {
        if (alt < distances[neighbor._sid]) {
          distances[neighbor._sid] = alt;
          previous[neighbor._sid] = smallest;
       //   console.log("yoyo enqueueing: ", alt, neighbor._sid)
          nodes.enqueue(alt, neighbor._sid)
        }
      }  
    }
  }
  return path.concat(s._id).reverse(); 
  //return path.reverse();
} 





