var Graph = require('data-structures').Graph;
var graph = new Graph(); 
var sites = places.data; 
var routes = allRoutes.features; 

var e, s; 

for (var i = 0; i < routes.length; i++) {
	e = routes[i].properties.eToponym;
	s = routes[i].properties.sToponym;

	graph.addNode(e);
	//graph.getNode(e).visited = false;
	graph.getNode(e)._id = e;

	graph.addNode(s)
	//graph.getNode(s).visited = false; 
	graph.getNode(s)._id = s; 

	graph.addEdge(e, s); 
	graph.getEdge(e, s)._eid = e;
	graph.getEdge(e, s)._sid = s; 
  /* add this func if decide to use dijkstra 
  / graph.getEdge(e, s).weight = calculateWeight(e, s)*/ 
	graph.getEdge(e, s)._id = routes[i].properties.id; 
}

resetNodes(graph);

function resetNodes(G) {
  graph.forEachNode( function(node) {
    node.visited = false; 
  })
}

/* queue */ 
function Queue() {
	this.q = new Array();

	this.enqueue = function(item) {
		this.q.unshift(item);
	}
	this.dequeue = function() {
		return this.q.pop();
	}

	this.empty = function() {
		return this.q.length === 0; 
	}
}

/* BFS 
 * s = start vertex
 * t = target vertex
 * return path from s to t 
 */

function bfs(s, t) {
  resetNodes(graph);
	var previous = {};
	var queue = new Queue(); 
	var target, u, v, edges; 
	queue.enqueue(s);
	previous[s._id] = null; 
	s.visited = true; 
	while(!queue.empty()) {
		target = queue.dequeue();	
		target.visited = true;
		if (target._id === t._id) {
			return extractPathFromPrevious(graph, previous, s, t);
		}
		var edges = graph.getAllEdgesOf(target._id);
		for (var i = 0; i < edges.length; i++) {
			enqueueIfNotVisited(graph, edges[i], queue, target, previous);
		}
	}
	return false; 
}



/* Given previous array, return the path from s to t by node id*/
/* TODO: Consider returning a list of route_ids */
function extractPathFromPrevious(graph, previous, s, t) {
	var path = new Array();
	/* put target in path */
	path.push(t._id);

	var id = previous[t._id]._id; 
	while(id != s._id) {
		path.push(id);
		id = previous[id]._id; 
	}	
	/* put source in path */
	path.push(id);
	return path; 
}

function enqueueIfNotVisited(G, edge, q, target, previous){
	var u = G.getNode(edge._eid);
	var v = G.getNode(edge._sid); 
	if (u.visited === false) {
		u.visited = true;
		previous[u._id] = target; 
		q.enqueue(u);
	} if (v.visited === false) {
		v.visited = true;
		previous[v._id] = target;
		q.enqueue(v);
	}

}

/* DIJSKSTRA IMPLEMENTATION ADAPTED FROM: https://github.com/mburst/dijkstras-algorithm /

ignoore for now, seems as tho bfs is more accurate r.e. pathfinding. 
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
      nodes.enqueue(INFINITY, node._id);
    } 
    previous[node._id] = null; 
  })

  while(!nodes.isEmpty()) {
    smallest = nodes.dequeue();
    if(smallest == t._id) {
      path;

      while(previous[smallest]) {
        path.push(smallest);
        smallest = previous[smallest];
      }

      break;
    }


    if(!smallest || distances[smallest] === INFINITY){
      continue;
    }

    var edges = graph.getAllEdgesOf(smallest);
    
    for(var i = 0; i < edges.length; i++) {
      neighbor = edges[i];
      console.log(neighbor, "exploring from: ", smallest);
      alt = distances[smallest] + neighbor.weight; 


      if (edges[i]._sid == smallest) {
        if (alt < distances[neighbor._eid]) {
          distances[neighbor._eid] = alt;
          previous[neighbor._eid] = smallest;
          nodes.enqueue(alt, neighbor._eid);
        }
      } else {
        if (alt < distances[neighbor._sid]) {
          distances[neighbor._sid] = alt;
          previous[neighbor._sid] = smallest;
          nodes.enqueue(alt, neighbor.s_id)
        }
      }
    }
  }
  return path.concat(s._id).reverse(); 
} */ 





