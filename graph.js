var Graph = require('data-structures').Graph;
var graph = new Graph(); 
var sites = places.data; 
var routes = allRoutes.features; 

var e, s; 

for (var i = 0; i < routes.length; i++) {
	e = routes[i].properties.eToponym;
	s = routes[i].properties.sToponym;

	graph.addNode(e);
	graph.getNode(e).visited = false;
	graph.getNode(e)._id = e;

	graph.addNode(s)
	graph.getNode(s).visited = false; 
	graph.getNode(s)._id = s; 

	graph.addEdge(e, s); 
	graph.getEdge(e, s)._eid = e;
	graph.getEdge(e, s)._sid = s; 
	graph.getEdge(e, s)._id = routes[i].properties.id; 
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

function bfs(G, s, t) {
	var previous = {};
	var queue = new Queue(); 
	var target, u, v, edges; 
	queue.enqueue(s);
	previous[s._id] = null; 
	s.visited = true; 
	while(!queue.empty()) {
		//console.log(queue);
		target = queue.dequeue();	
		target.visited = true;
		if (target._id === t._id) {
			return extractPathFromPrevious(graph, previous, s, t);
		}
		var edges = G.getAllEdgesOf(target._id);
		for (var i = 0; i < edges.length; i++) {
			enqueueIfNotVisited(G, edges[i], queue, target, previous);
		}
	}
	return false; 
}

/* Given previous array, return the path from s to t by node id*/
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




