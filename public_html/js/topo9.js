// The usual stuff you expect in three js
var camera;
var scene;
// Used for detecting a mouse click on a node
var projector;
// A flat array of nodes used for mouse click detection
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
// The distance at which secondary nodes orbit around primary nodes
var orbitDist = 3;
// An array of hexagonal grids for each level
var grids = [];

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
// Material for the lines connecting nodes in the main path
var pathLineMaterial = new THREE.LineBasicMaterial({color: 0xff0000, opacity: 0.5, linewidth: 2});

// Distance on the z axis between different levels
var levelHeight = 15;

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

var plane;
var cube;

function init() {
  var container1 = document.getElementById('container1');
  var container2 = document.getElementById('container2');

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  
  // Test: get the direction of the camera
  camera.position.set(10,10,10);
  projector = new THREE.Projector();
  //console.log("CAM DIR");
  //getCamDir();
  
  //lookAt(new THREE.Vector3(0,0,0));
  

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
  // Add the nodes in the path to the scene, each on its own level
  for (var i = 0; i < path.length; i++) {
    // Create a new hex grid for this level
    grids[i] = new HexGrid();
    var nodeName = path[i];

    addNodeCluster(0, 0, i, nodeName);
  }

  var n1 = grids[0].getHex(0, 0)['pNode'];
  console.log("N1:");
  console.log(n1);
  var p1 = n1.position;

  // Add some lines connecting the nodes in the path
  for (var i = 1; i < path.length; i++) {
    var n2 = grids[i].getHex(0, 0)['pNode'];
    console.log("N2");
    console.log(n2);
    var p2 = n2.position;

    // Create a line between the last two nodes
    var lineGeo = new THREE.Geometry();
    lineGeo.vertices.push(p1);
    lineGeo.vertices.push(p2);

    var line = new THREE.Line(lineGeo, pathLineMaterial);
    //scene.add(line);
    p1 = p2;
  }
}

// Adds a primary node to the scene as well as secondary nodes
function addNodeCluster(rowIndex, colIndex, level, nodeName) {
  // Add a new hexagon to the grid
  var hex = grids[level].addHex(rowIndex, colIndex);

  // Add a primary node
  var node = getPrimaryNode();
  node.nodeName = nodeName;
  node.nodeType = 'primary';
  node.gridLevel = level;
  node.gridIndex = {row: rowIndex, col: colIndex};

  // This will be used to determine what direction to place secondary nodes
  // around the primary node in the hex
  hex['placeDir'] = 0;

  // Array to store the lines connecting this node to other nodes
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
    secondaryNode.gridLevel = level;

    // Add the secondary node to the grid space
    hex['sNodes'].push(secondaryNode);
    // Add the secondary node to the click detection array
    dNodes.push(secondaryNode);
    // Add the secondary node to the scene
    scene.add(secondaryNode);
  }

  // Now that we've added nodes to a position on the grid, set the positions of
  // those nodes
  updatePositions(rowIndex, colIndex, level);
}

// Iterates through the objects in a hex and repositions them
function updatePositions(rowIndex, colIndex, level) {
  var hex = grids[level].getHex(rowIndex, colIndex);
  var coords = getHexPosition(rowIndex, colIndex, level);

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
    secondaryNode.position.z = coords.z;
    secondaryNode.gridIndex = {row: rowIndex, col: colIndex};
  }
}

// Forces a node cluster to update the start and ending positions of its lines
function updateLines(rowIndex, colIndex, level) {
  var hex = grids[level].getHex(rowIndex, colIndex);
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

function addNodeClusterDisplace(secondaryNode, level) {
  // Remove the 
  var coords = secondaryNode.gridIndex;
  scene.remove(secondaryNode);

  // Get the space on the hex where the secondary node resides
  var hex = grids[level].getHex(coords.row, coords.col);
  // Then get the primary node and the placement direction
  var pNode = hex['pNode'];
  var dir = hex['placeDir'];

  var affectedHexs = grids[level].addHexDisplace(coords.row, coords.col, dir);
  hex['placeDir'] = (dir + 1) % 6;

  // Get the coordinates of the first entry in the affected hexs array
  var addCoords = affectedHexs[affectedHexs.length - 1];

  // Update the positions of the nodes of the affected hex spaces
  for (var i = 0; i < affectedHexs.length - 1; i++) {
    var aCoords = affectedHexs[i];

    updatePositions(aCoords.row, aCoords.col, level);
    updateLines(aCoords.row, aCoords.col, level);
  }

  // Add a node cluster at that space on the grid
  addNodeCluster(addCoords.row, addCoords.col, level, secondaryNode.nodeName);
  var newHex = grids[level].getHex(addCoords.row, addCoords.col);
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

function getHexPosition(row, col, level) {
  xOffset = 1.5 * hexRadius;
  yOffset = (Math.sqrt(3) / 2) * hexRadius;

  //(-2,1)
  var x = col * xOffset;
  var y = 2 * row * yOffset + Math.abs((col % 2)) * yOffset;
  return new THREE.Vector3(x, y, level * levelHeight);
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

function initCube(){
  cubeGeo = new THREE.CubeGeometry(2,2,2);
  cube = new THREE.Mesh(cubeGeo,nodeMaterial);
  scene.add(cube);

   // Make some coordinate axes
  var x1 = new THREE.Vector3(5, 0, 0);
  var y1 = new THREE.Vector3(0, 5, 0);
  var z1 = new THREE.Vector3(0, 0, 5);
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

  cube.children.push(xa);
  cube.children.push(ya);
  cube.children.push(za);
  
  scene.push(cube);
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
      var level = node.gridLevel;
      //console.log("Grid index: " + node.gridIndex.row + "," + node.gridIndex.col);
      addNodeClusterDisplace(node, level);
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
  var key = event.keyCode;
  console.log(camera.rotation);
  
  switch (key) {
    case 37:
      /*console.log(camera.position);
      var v = new THREE.Vector2(camera.position.x, camera.position.y);
      // Magnitude of vector
      var m = Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
      var angle = getAngle(v);
      console.log("Magnitude: " + m);
      console.log("Angle: " + getAngle(v));
      angle -= .05;
      camera.position.x = m * Math.cos(angle);
      camera.position.y = m * Math.sin(angle);
      camera.lookAt(scene.position);

      if (camera.position.z < 0) {
        camera.rotation.z = 0;
      }*/
      camera.rotation.y -= .01;
      console.log("dir");
      getCamDir();
      console.log("rot");
      console.log(camera.rotation.y);
      break;
    case 39:
      camera.rotation.y += .01;
      console.log("dir");
      getCamDir();
      console.log("rot");
      console.log(camera.rotation.y);
      break;
    case 38:
      camera.rotation.x -= .01;
      console.log("dir");
      getCamDir();
      console.log("rot");
      console.log(camera.rotation.x);
      break;
    case 40:
      camera.rotation.x += .01;
      console.log("dir");
      getCamDir();
      console.log("rot");
      console.log(camera.rotation.x);
      break;
    
  }
}

// Takes in a THREE.Vector2 and returns the angle of orientation
function getAngle(v) {
  v.normalize();
  var pAngle = Math.asin(v.y);

  if (v.x >= 0)
    return pAngle;
  return 3*Math.PI/2 - pAngle;
}

// An alternative version of the camera lookAt function that only changes the 
// x and y rotation of the camera and leaves tilt alone
function lookAt(v){
  var v2 = new THREE.Vector2();
  var cv = new THREE.Vector2();
  var angle;

  // xz plane
  cv.set(camera.position.x,camera.position.z);
  v2.set(v.x,v.z);

  console.log("cv");
  console.log(cv);
  console.log("v2");
  console.log(v2);

  console.log("DIFF");
  cv.sub(v2);
  console.log(cv);
  console.log("ANGLE");
  angle = getAngle(cv);
  console.log(angle);
  camera.rotation.y = angle;
  
  // yz plane
  /*cv.x = camera.position.y;
  cv.y = camera.position.z;
  console.log("cv");
  console.log(cv);
  v2.set(v.y,v.z);
  console.log("v2");
  console.log(v2);
  v2.sub(cv);
  console.log("DIFF");
  console.log(v2);
  console.log("ANGLE");
  angle = getAngle(v2);
  console.log(angle);
  camera.rotation.x = angle;*/
}

function getCamDir(){
  var v = new THREE.Vector3(0,0,-1);
  v.applyEuler( camera.rotation, camera.eulerOrder );
  console.log(v.normalize());
  
  // what vector, when it undergoes the transformation, ends up being
  // the correct matrix in world space
  
  
  // Get the angle in the xy plane
  //var v1 = new THREE.Vector2(v.x,v.y);
  //console.log("CAM ANGLE");
  //console.log(getAngle(v1));
}


