// The usual stuff you expect in three js
var camera;
var scene;
// Used for detecting a mouse click on a node
var projector;
// A flat array of nodes used for mouse click detectio
var dNodes = [];
// The scene wil have two renderers
// This is a WebGL renderer
var renderer;
// This is a CSS3d renderer
var rendererCSS;
// Laziness variable, please ignore
var origin = new THREE.Vector3(0, 0, 0);
// Useful constant for calculating points on a hexagon
var p = Math.sqrt(3) / 2;
// The radius to use for the hex grid
var hexRadius = 5;
// Shifts the hex grid by a certain vector 
var hexShift = new THREE.Vector3(0, 0, 0);
// The distance at which secondary nodes orbit around primary nodes
var orbitDist = 3;
// A hexagonal grid for arranging nodes on screen
var hexGrid;

// The radius of primary nodes
var nodeRadius = 1;
// The radius of secondary nodes
var secondaryNodeRadius = .5;
// The geometry for a primary node
var primaryNodeGeo = new THREE.SphereGeometry(nodeRadius, 30, 30);
// Geometry for a secondary node
var secondaryNodeGeo = new THREE.SphereGeometry(secondaryNodeRadius, 20, 20);
// Default node material. This is temporary
var nodeMaterial = new THREE.MeshNormalMaterial();
// Material for lines connecting nodes
var lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, opacity: 0.5, linewidth: 2});

// Points on a hexagon, used to quickly draw a hexagon mesh
hexPoints = [];
hexPoints.push(new THREE.Vector2(1, 0));
hexPoints.push(new THREE.Vector2(.5, p));
hexPoints.push(new THREE.Vector2(-.5, p));
hexPoints.push(new THREE.Vector2(-1, 0));
hexPoints.push(new THREE.Vector2(-.5, -p));
hexPoints.push(new THREE.Vector2(.5, -p));
hexPoints.push(new THREE.Vector2(1, 0));

// Represents a path between nodes n1 and n11, such as we might get from UNIS
var path = ["n1", "n2", "n3", "n7", "n11"];

// A map of node names and indexes on the hexGrid
var nodes = {};

// Nodes that are one hop away from a given node
var adjacentNodes = {
  "n1": ["n2", "n5", "n7"],
  "n2": ["n1", "n3", "n5", "n6"],
  "n3": ["n2", "n4", "n6", "n8", "n9", "n10", "n11", "n12", "n13", "n14", "n15", "n16", "n17", "n18"],
  "n4": ["n3", "n7", "n9"],
  "n5": ["n1", "n2", "n6"],
  "n6": ["n2", "n3", "n5"],
  "n7": ["n1", "n4"],
  "n8": ["n3", "n9"],
  "n9": ["n4", "n8"],
  "n11": ["n24", "n25", "n26", "n27", "n28", "n29", "n30", "n40", "n50"],
  "n24": ["n34", "n35", "n37"]
};

init();
animate();

function init() {
  var container1 = document.getElementById('container1');
  var container2 = document.getElementById('container2');

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(20, 20, 100);
  projector = new THREE.Projector();

  scene = new THREE.Scene();
  camera.lookAt(scene.position);

  rendererCSS = new THREE.CSS3DRenderer();
  rendererCSS.setSize(window.innerWidth, window.innerHeight);
  rendererCSS.domElement.style.position = 'absolute';
  container1.appendChild(rendererCSS.domElement);

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  container2.appendChild(renderer.domElement);

  initAxes();
  //generateHexTiling1(-2, -3, 2, 3, 4, 5);
  addPathNodes();

  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('mousedown', onDocumentMouseDown, false);
  window.addEventListener('keydown', onDocumentKeyDown, false);
}

function getPrimaryNode() {
  return new THREE.Mesh(primaryNodeGeo, nodeMaterial);
}

function getSecondaryNode() {
  return new THREE.Mesh(secondaryNodeGeo, nodeMaterial);
}

function addPathNodes() {
  hexGrid = new HexGrid();
  var startIndex = -2 * Math.floor(path.length / 2);

  // Add all the nodes in the path to the scene as well as secondary nodes around
  // each one
  for (var i = 0; i < path.length; i++) {
    var nodeName = path[i];

    // Position the node according to a hexagonal grid
    // Calculate what column the node should be in
    var c = startIndex + 2 * i;
    var r = 0;

    addNodeCluster(r, c, nodeName);
  }
}

// Adds a primary node to the scene as well as secondary nodes
function addNodeCluster(rowIndex, colIndex, nodeName) {
  // Add a new hexagon to the grid
  var hex = hexGrid.addHex(rowIndex, colIndex);

  // Add a primary node
  var node = getPrimaryNode();
  node.nodeName = nodeName;
  node.nodeType = 'primary';
  node.gridIndex = {row: rowIndex, col: colIndex};

  // This will be used to determine what direction to place secondary nodes
  // around the primary node in the hex
  hex['placeDir'] = 0;

  // This will store the lines connecting this node to other nodes
  hex['lines'] = [];
  // A reference to this nodes parent node
  hex['parentNode'] = null;
  // The line pointing to the parent node
  hex['parentLine'] = null;

  // Add the primary node to the hex 
  hex['pNode'] = node;
  // Then add it to the scene
  scene.add(node);
  // And to the click detection array
  dNodes.push(node);

  // Now add all of the adjacent nodes as well
  // We'll create an array of secondary nodes in the hex
  hex['sNodes'] = [];
  // An array of secondary nodes that have expanded to become primary nodes
  hex['esNodes'] = [];

  var orbitNodes = adjacentNodes[nodeName] || [];

  for (j = 0; j < orbitNodes.length; j++) {
    var secondaryNodeName = orbitNodes[j];
    var secondaryNode = getSecondaryNode();

    // Set the properties of the secondary node so that we can identify it 
    secondaryNode.nodeType = 'secondary';
    secondaryNode.nodeName = secondaryNodeName;
    secondaryNode.parentNode = nodeName;
    secondaryNode.gridIndex = {row: rowIndex, col: colIndex};

    // Add the secondary node to the grid space
    hex['sNodes'].push(secondaryNode);
    // Add the secondary node to the click detection array
    dNodes.push(secondaryNode);
    // Add the secondary node to the scene
    scene.add(secondaryNode);
  }

  // Now that we've added nodes to a position on the grid, set the positions of
  // those nodes
  updatePositions(rowIndex, colIndex);
}

// Iterates through the objects in a hex and repositions them
function updatePositions(rowIndex, colIndex) {
  var hex = hexGrid.getHex(rowIndex, colIndex);
  var coords = getHexPosition(rowIndex, colIndex, hexRadius);

  // Reposition the primary node
  var node = hex.pNode;
  node.position = coords;
  node.gridIndex = {row: rowIndex, col: colIndex};

  // Reposition the secondary nodes
  var secondaryNodes = hex.sNodes;

  // The angle of separation between secondary nodes
  var angle = 0;
  if (secondaryNodes.length > 1)
    angle = (2 * Math.PI) / secondaryNodes.length;

  for (var i = 0; i < secondaryNodes.length; i++) {
    var secondaryNode = secondaryNodes[i];
    // Arrange the secondary nodes in a circle around the primary node
    secondaryNode.position.x = coords.x + orbitDist * Math.cos(i * angle);
    secondaryNode.position.y = coords.y + orbitDist * Math.sin(i * angle);
    secondaryNode.gridIndex = {row: rowIndex, col: colIndex};
  }
}

// Forces a node cluster to update the start and ending positions of its lines
function updateLines(rowIndex, colIndex) {
  var hex = hexGrid.getHex(rowIndex, colIndex);
  var pNode = hex['pNode'];
  var esNodes = hex['esNodes'];
  var lines = hex['lines'];
  var myPos = pNode.position;

  console.log("myPos:");
  console.log(myPos);

  // First update the line connecting this node to its parent node (if it exists)
  if (hex['parentNode']) {
    var parentPos = hex['parentNode'].position;
    console.log("parentPos:");
    console.log(parentPos);
    console.log("parentLine");
    console.log(hex['parentLine'].geometry.vertices[1]);

    hex['parentLine'].geometry.vertices[0] = myPos;
    hex['parentLine'].geometry.vertices[1] = parentPos;
    hex['parentLine'].geometry.verticesNeedUpdate = true;
  }

  // Then update the lines connecting this node to its child nodes
  for (var i = 0; i < esNodes.length; i++) {
    var childPos = esNodes[i].position;

    var line = lines[i];

    line.geometry.vertices[0] = myPos;
    line.geometry.vertices[1] = childPos;
    line.geometry.verticesNeedUpdate = true;
  }
}

function addNodeClusterDisplace(secondaryNode, direction) {
  // Remove the 
  var coords = secondaryNode.gridIndex;
  scene.remove(secondaryNode);

  // Get the space on the hex where the secondary node resides
  var hex = hexGrid.getHex(coords.row, coords.col);
  // Then get the primary node and the placement direction
  var pNode = hex['pNode'];
  var dir = hex['placeDir'];

  var affectedHexs = hexGrid.addHexDisplace(coords.row, coords.col, dir);
  hex['placeDir'] = (dir + 1) % 6;

  // Get the coordinates of the first entry in the affected hexs array
  var addCoords = affectedHexs[affectedHexs.length - 1];

  // Update the positions of the nodes of the affected hex spaces
  for (var i = 0; i < affectedHexs.length - 1; i++) {
    var aCoords = affectedHexs[i];

    updatePositions(aCoords.row, aCoords.col);
    updateLines(aCoords.row, aCoords.col);
  }

  // Add a node cluster at that space on the grid
  addNodeCluster(addCoords.row, addCoords.col, secondaryNode.nodeName);
  var newHex = hexGrid.getHex(addCoords.row, addCoords.col);
  var newPNode = newHex['pNode'];
  // Add the newly added primary node to its parents list of expanded secondary nodes
  hex['esNodes'].push(newPNode);
  newHex['parentNode'] = pNode;

  var lineGeo = new THREE.Geometry();
  lineGeo.vertices.push(pNode.position);
  lineGeo.vertices.push(newPNode.position);

  var line = new THREE.Line(lineGeo, lineMaterial);

  scene.add(line);
  hex['lines'].push(line);
  newHex['parentLine'] = line;
}

// Returns a hexagon mesh
function getHexagonMesh() {
  var hex = new THREE.Shape(hexPoints);
  var hexGeo = hex.makeGeometry();
  var hexMaterial = new THREE.MeshNormalMaterial();
  var hexagon = new THREE.Mesh(hexGeo, hexMaterial);
  //hexagon.scale.set(10,10,10);
  return hexagon;
}

function generateHexTiling(rows, cols, r, r1) {
  xOffset = 1.5 * r1;
  yOffset = (Math.sqrt(3) / 2) * r1;

  for (var row = 0; row < rows; row++) {
    for (var col = 0; col < cols; col++) {
      var x = col * xOffset;
      var y = 2 * row * yOffset + (col % 2) * yOffset;
      var hexagon = getHexagonMesh();
      hexagon.scale.set(r, r, r);
      hexagon.position.set(x, y, 0);

      scene.add(hexagon);
    }
  }
}

function getCircleMesh(r, sub) {
  var points = [];
  var angle = 2 * Math.PI / sub;

  for (var i = 0; i < sub; i++) {
    var x = r * Math.cos(i * angle);
    var y = r * Math.sin(i * angle);
    points.push(new THREE.Vector2(x, y));
  }

  // Push the closing point
  points.push(new THREE.Vector2(r, 0));
  var circleShape = new THREE.Shape(points);
  var circleGeo = circleShape.makeGeometry();
  var circleMaterial = new THREE.MeshNormalMaterial({
    wireframe: true,
    color: 'blue'
  });
  var circle = new THREE.Mesh(circleGeo, circleMaterial);

  return circle;
}

function generateHexTiling1(startRow, startCol, endRow, endCol, r, r1) {
  xOffset = 1.5 * r1;
  yOffset = (Math.sqrt(3) / 2) * r1;

  for (var row = startRow; row < endRow; row++) {
    for (var col = startCol; col < endCol; col++) {
      var hexagon = getHexagonMesh();
      hexagon.scale.set(r, r, r);
      hexagon.position = getHexPosition(row, col, r1);

      scene.add(hexagon);
    }
  }
}

function getHexPosition(row, col, r) {
  xOffset = 1.5 * r;
  yOffset = (Math.sqrt(3) / 2) * r;

  //(-2,1)
  var x = col * xOffset;
  var y = 2 * row * yOffset + Math.abs((col % 2)) * yOffset;
  return new THREE.Vector3(x, y, 0);
}

function initAxes() {
  // Make some coordinate axes
  var x1 = new THREE.Vector3(20, 0, 0);
  var y1 = new THREE.Vector3(0, 20, 0);
  var z1 = new THREE.Vector3(0, 0, 20);
  var xGeo = new THREE.Geometry();
  var yGeo = new THREE.Geometry();
  var zGeo = new THREE.Geometry();
  xGeo.vertices.push(origin);
  xGeo.vertices.push(x1);
  yGeo.vertices.push(origin);
  yGeo.vertices.push(y1);
  zGeo.vertices.push(origin);
  zGeo.vertices.push(z1);
  // Meterial for the axes
  var xMaterial = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 1});
  var yMaterial = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth: 1});
  var zMaterial = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth: 1});
  var xa = new THREE.Line(xGeo, xMaterial);
  var ya = new THREE.Line(yGeo, yMaterial);
  var za = new THREE.Line(zGeo, zMaterial);

  scene.add(xa);
  scene.add(ya);
  scene.add(za);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  rendererCSS.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseDown() {
  event.preventDefault();

  var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
  projector.unprojectVector(vector, camera);

  var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

  var intersects = raycaster.intersectObjects(dNodes);

  if (intersects.length > 0) {
    //intersects[ 0 ].object.material.color.setHex(Math.random() * 0xffffff);
    var node = intersects[0].object;

    //console.log("Node type: " + intersects[0].object.nodeType);
    //console.log("Node name: " + intersects[0].object.nodeName);
    // Check if we have a secondary node
    if (node.nodeType === "secondary") {
      //console.log("Grid index: " + node.gridIndex.row + "," + node.gridIndex.col);
      addNodeClusterDisplace(node, 0);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  rendererCSS.render(scene, camera);
  renderer.render(scene, camera);
}

function onDocumentKeyDown(event) {
  console.log(event.keyCode);
}




