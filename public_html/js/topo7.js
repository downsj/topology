// The usual stuff you expect in three js
var camera;
var scene;
// The scene wil have two renderers
// This is a WebGL renderer
var renderer;
// This is a CSS3d renderer
var rendererCSS;
// Laziness variable, please ignore
var origin = new THREE.Vector3(0, 0, 0);
// The radius of primary nodes
var nodeRadius = 2;
// The radius of secondary nodes
var secondaryNodeRadius = .5;
// Useful constant for calculating points on a hexagon
var p = Math.sqrt(3) / 2;
// A data structure that indicates what position are occupied on a hexagonal grid
var hexagons = {};
// The radius to use for the hex grid
var hexRadius = 5;
// Shifts the hex grid by a certain vector 
var hexShift = new THREE.Vector3(0, 0, 0);
// The distance at which secondary nodes orbit around primary nodes
var orbitDist = 4;

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

// Nodes in our topology
var nodes = {
  "n1": {position: null},
  "n2": {positon: null},
  "n3": {position: null},
  "n4": {position: null},
  "n5": {position: null},
  "n6": {position: null},
  "n7": {position: null},
  "n8": {position: null},
  "n9": {position: null}
};

// Nodes that are one hop away from a given node
var adjacentNodes = {
  "n1": ["n2", "n5", "n7"],
  "n2": ["n1", "n3", "n5", "n6"],
  "n3": ["n2", "n4", "n6", "n8","n9","n10","n11","n12","n13","n14","n15","n16","n17","n18"],
  "n4": ["n3", "n7", "n9"],
  "n5": ["n1", "n2", "n6"],
  "n6": ["n2", "n3", "n5"],
  "n7": ["n1", "n4"],
  "n8": ["n3", "n9"],
  "n9": ["n4", "n8"],
  "n11" : ["n24","n25","n26","n27","n28","n29","n30","n40","n50"]
};

init();
animate();

function init() {
  var container1 = document.getElementById('container1');
  var container2 = document.getElementById('container2');

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 0, 65);

  //camera.position.set(2, 0, 65);
  //initControls();

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
  generateHexTiling1(-2, -3, 2, 3, 7, 8);
  addPathNodes();

  window.addEventListener('resize', onWindowResize, false);
}

function addPathNodes() {
  var startIndex = -2 * Math.floor(path.length / 2);
  console.log("START INDEX");
  console.log(startIndex);

  // Place the nodes in the path
  for (var i = 0; i < path.length; i++) {
    var nodeGeo = new THREE.SphereGeometry(nodeRadius, 50, 50);
    var nodeMaterial = new THREE.MeshNormalMaterial();
    var node = new THREE.Mesh(nodeGeo, nodeMaterial);

    // Position the node according to a hexagonal grid
    node.position = getHexPosition(0, startIndex + 2 * i, 8);
    scene.add(node);
    
    // Add subnodes around the sphere
    // Get the secondary nodes
    var nodeName = path[i];
    var orbitNodes = adjacentNodes[nodeName] || [];
    console.log("NODE NAME");
    console.log(nodeName);
    console.log("ORBIT NODES");
    console.log(orbitNodes);
    
    // Compute the angle to offset each orbiting node by
    var angle = 0;
    console.log("LEN");
    console.log(orbitNodes.length)
    if (orbitNodes.length > 1)
      angle = (2 * Math.PI) / orbitNodes.length;

    console.log("Angle: " + angle);

    for (j = 0; j < orbitNodes.length; j++) {
      var secondaryNodeGeo = new THREE.SphereGeometry(secondaryNodeRadius, 50, 50);
      var secondaryNode = new THREE.Mesh(secondaryNodeGeo, nodeMaterial);
      secondaryNode.position.x = node.position.x + orbitDist * Math.cos(j * angle);
      secondaryNode.position.y = node.position.y + orbitDist * Math.sin(j * angle);
      scene.add(secondaryNode);
    }

    // Add a label for the sphere
   
    var elt = document.createElement('div');
    elt.className = 'node-label';
    elt.textContent = nodeName;
    var label = new THREE.CSS3DObject(elt);
    label.scale.multiplyScalar(1 / 12);
    label.position.x = node.position.x;
    label.position.y = node.position.y + 5;

    //scene.add(label);
  }
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
      //console.log("row: " + row + " , col: " + col);
      //console.log("x: " + x + " , y: " + y);
      var hexagon = getHexagonMesh();
      hexagon.scale.set(r, r, r);
      hexagon.position.set(x, y, 0);

      scene.add(hexagon);
    }
  }
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

function animate() {
  requestAnimationFrame(animate);
  render();
  //controls.update();
}

function render() {
  rendererCSS.render(scene, camera);
  renderer.render(scene, camera);
}




