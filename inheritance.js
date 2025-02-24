// a simple adaptation of http://bl.ocks.org/d3noob/8375092 for displaying
// inherited DOM interfaces
var width = 960;
var height = 1200;
var margin = {
	top: 20,
	right: 120,
	bottom: 20,
	left: 120
};
var svg = d3.select("body").append("svg")
	.attr("width", width + margin.right + margin.left)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tree = d3.layout.tree()
	.size([width, height]);

var diagonal = d3.svg.diagonal()
	.projection((d) => { return [d.y, d.x]; });

function listChildren(parentName, interfaces) {
	
	return Object.keys(interfaces)
		.filter(n => (interfaces[n].inheritance === parentName))
		.map(n => {
			return {
				name: n,
				parent,
				parentName,
				children: listChildren(n, interfaces)
			};
		}
	);
	
}

d3.json("results.json", (json) => {
	
	var rootName = "EventTarget";
	var links = [];
	var nodes = [];
	var interfaces = json.results.filter(s=> s.idl && s.idl.idlNames)
		.map(s => s.idl.idlNames)
		.reduce((a,b) => { Object.keys(b).forEach(k => { if (b[k].type === "interface") { a[k] = b[k];} }); return a;},{});
	
	var domInheritance = [{
		name: rootName,
		parent: null,
		children: listChildren(rootName, interfaces)
	}];
	var root = domInheritance[0];
	root.x0 = height / 2;
	root.y0 = 0;
	var i = 0;
	var duration = 750;
	
	update(root);

	function update(source) {

		// Compute the new tree layout.
		var nodes = tree.nodes(root).reverse();
		var links = tree.links(nodes);
		
		// Normalize for fixed-depth.
		nodes.forEach((d) => { d.y = d.depth * 180; });
		
		// Update the nodes…
		var node = svg.selectAll("g.node")
			.data(nodes, (d) => { return d.id || (d.id = ++i); });
		
		// Enter any new nodes at the parent's previous position.
		var nodeEnter = node.enter().append("g")
			.attr("class", "node")
			.attr("transform", (d) => { return "translate(" + source.y0 + "," + source.x0 + ")"; })
			.on("click", click);

		nodeEnter.append("circle")
			.attr("r", 1e-6)
			.style("fill", (d) => { return d._children ? "lightsteelblue" : "#fff"; });

		nodeEnter.append("a")
			.attr("xlink:href", (d) => ("./?idlname=" + d.name))
			.append("text")
			.attr("x", (d) => { return d.children || d._children ? -13 : 13; })
			.attr("dy", ".35em")
			.attr("text-anchor", (d) => { return d.children || d._children ? "end" : "start"; })
			.text((d) => d.name)
			.style("fill-opacity", 1e-6);

		// Transition nodes to their new position.
		var nodeUpdate = node.transition()
			.duration(duration)
			.attr("transform", (d) => { return "translate(" + d.y + "," + d.x + ")"; });
		
		nodeUpdate.select("circle")
			.attr("r", 10)
			.style("fill", (d) => { return d._children ? "lightsteelblue" : "#fff"; });
		
		nodeUpdate.select("text")
			.style("fill-opacity", 1);
		
		// Transition exiting nodes to the parent's new position.
		var nodeExit = node.exit().transition()
			.duration(duration)
			.attr("transform", () => ("translate(" + source.y + "," + source.x + ")"))
			.remove();
		
		nodeExit.select("circle")
			.attr("r", 1e-6);
		
		nodeExit.select("text")
			.style("fill-opacity", 1e-6);
		
		// Update the links…
		var link = svg.selectAll("path.link")
			.data(links, (d) => d.target.id);
		
		// Enter any new links at the parent's previous position.
		link.enter().insert("path", "g")
			.attr("class", "link")
			.attr("d", () => {
				
				var o = { x: source.x0, y: source.y0 };
				return diagonal({source: o, target: o});
				
			});
		
		// Transition links to their new position.
		link.transition()
			.duration(duration)
			.attr("d", diagonal);
		
		// Transition exiting nodes to the parent's new position.
		link.exit()
			.transition()
			.duration(duration)
			.attr("d", (d) => {
				
				var o = {x: source.x, y: source.y};
				return diagonal({source: o, target: o});
				
			})
			.remove();
		
		// Stash the old positions for transition.
		nodes.forEach((d) => {
			
			d.x0 = d.x;
			d.y0 = d.y;
			
		})

		// Toggle children on click.
		function click(d) {
			
			if (d.children) {
				
				d._children = d.children;
				d.children = null;
				
			} else {
				
				d.children = d._children;
				d._children = null;
				
			}
			
			update(d);
		}
	}
	
});
