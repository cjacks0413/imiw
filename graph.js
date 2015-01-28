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
}

/* TESTING BFS 
var a = graph.getNode("ABARQUH_532N311E_C06");
var b = graph.getNode("QARYABIDH_531N306E_C06");
bfs(graph, a, b);  */ 

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
 */

function bfs(G, s, t) {
	var queue = new Queue(); 
	console.log(queue);
	var target, u, v, edges; 
	queue.enqueue(s);
	s.visited = true; 
	while(!queue.empty()) {
		target = queue.dequeue(); 
		target.visited = true; 
		if (target._id == t._id) {
			return true; //decide what to do here
		}
		var edges = G.getAllEdgesOf(target._id);
		console.log(edges.length);
		for (var i = 0; i < edges.length; i++) {
			enqueueIfNotVisited(G, edges[i], queue);
		}
	}
}

function enqueueIfNotVisited(G, edge, q){
	var u = G.getNode(edge._eid);
	var v = G.getNode(edge._sid); 
	if (u.visited === false) {
		u.visited = true;
		q.enqueue(u);
	} if (v.visited === false) {
		v.visited = true;
		q.enqueue(v);
	}

}




