var camera;
var scene;
var renderer;
var rendererCSS;
var scale;
var origin = new THREE.Vector3(0, 0, 0);

var sphereRadius = 2;
var p = Math.sqrt(3) / 2;

hexPoints = [];
hexPoints.push(new THREE.Vector2(1, 0));
hexPoints.push(new THREE.Vector2(.5, p));
hexPoints.push(new THREE.Vector2(-.5, p));
hexPoints.push(new THREE.Vector2(-1, 0));
hexPoints.push(new THREE.Vector2(-.5, -p));
hexPoints.push(new THREE.Vector2(.5, -p));
hexPoints.push(new THREE.Vector2(1, 0));

hexOffsets = [];
hexOffsets.push(new THREE.Vector3(1.5, p, 0));
hexOffsets.push(new THREE.Vector3(0, 2 * p, 0));
hexOffsets.push(new THREE.Vector3(-1.5, p, 0));
hexOffsets.push(new THREE.Vector3(-1.5, -p, 0));
hexOffsets.push(new THREE.Vector3(0, -2 * p, 0));
hexOffsets.push(new THREE.Vector3(1.5, -p, 0));

var hexagons = {};

var path = ["n1", "n2", "n3", "n7", "n11"];

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

var adjacentNodes = {
  "n1": ["n2", "n5", "n7"],
  "n2": ["n1", "n3", "n5", "n6"],
  "n3": ["n2", "n4", "n6", "n8"],
  "n4": ["n3", "n7", "n9"],
  "n5": ["n1", "n2", "n6"],
  "n6": ["n2", "n3", "n5"],
  "n7": ["n1", "n4"],
  "n8": ["n3", "n9"],
  "n9": ["n4", "n8"]
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

  // Initialize the scale
  scale = d3.scale.linear()
    .domain([0, path.length - 1])
    .range([-50, 50]);

  // Place the nodes in the path
  for (var i = 0; i < path.length; i++) {
    var sphereGeo = new THREE.SphereGeometry(sphereRadius, 50, 50);
    var sphereMaterial = new THREE.MeshNormalMaterial();
    var sphere = new THREE.Mesh(sphereGeo, sphereMaterial);

    // Get the x position of the sphere
    sphere.position.x = scale(i);
    scene.add(sphere);

    // Add a label for the sphere
    var nodeName = path[i];
    var elt = document.createElement('div');
    elt.className = 'node-label';
    elt.textContent = nodeName;
    var label = new THREE.CSS3DObject(elt);
    label.scale.multiplyScalar(1 / 12);
    label.position.x = sphere.position.x;
    label.position.y = sphere.position.y + 5;

    scene.add(label);
  }

  /*var hexagon = getHexagonMesh();
   hexagon.scale.set(9, 9, 9);
   scene.add(hexagon);
   
   var hexagon1 = getHexagonMesh();
   hexagon1.scale.set(9, 9, 9);
   hexagon1.position = hexOffsets[0].multiplyScalar(10);
   scene.add(hexagon1);
   
   var hexagon2 = getHexagonMesh();
   hexagon2.scale.set(9, 9, 9);
   hexagon2.position = hexOffsets[1].multiplyScalar(10);
   scene.add(hexagon2);
   var r = 10;*/

  generateHexTiling(3, 5, 4, 5);

  // Add a line to connect all the spheres
  var p1 = new THREE.Vector3(-50, 0, 0);
  var p2 = new THREE.Vector3(50, 0, 0);
  var lineGeo = new THREE.Geometry();
  lineGeo.vertices.push(p1);
  lineGeo.vertices.push(p2);
  var lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, opacity: 0.5, linewidth: 2});
  var line = new THREE.Line(lineGeo, lineMaterial);
  scene.add(line);
 

  window.addEventListener('resize', onWindowResize, false);
}

function addNodes(n){
  
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
      console.log("row: " + row + " , col: " + col);
      console.log("x: " + x + " , y: " + y);
      var hexagon = getHexagonMesh();
      hexagon.scale.set(r, r, r);
      hexagon.position.set(x, y, 0);

      scene.add(hexagon);
    }
  }

  //hexagon.rotation.y = Math.PI/6;
  var axis = new THREE.Vector3(1, 0, 0);
  rotateAroundWorldAxis(hexagon, axis, Math.PI / 2);
}

function getHexPosition(row,col,r){
  xOffset = 1.5 * r1;
  yOffset = (Math.sqrt(3) / 2) * r1;
  
  var x = col * xOffset;
  var y = 2 * row * yOffset + (col % 2) * yOffset;
  return new THREE.Vector3(x,y,0);
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

var rotObjectMatrix;
function rotateAroundObjectAxis(object, axis, radians) {
  rotObjectMatrix = new THREE.Matrix4();
  rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
  console.log("OBJECT");
  console.log(object);
  object.matrix.multiply(rotObjectMatrix);      // post-multiply

  // new code for Three.js r50+
  object.rotation.setEulerFromRotationMatrix(object.matrix);

  // old code for Three.js r49 and earlier:
  // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
}

var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);        // pre-multiply
    object.matrix = rotWorldMatrix;

    // new code for Three.js r50+
    object.rotation.setEulerFromRotationMatrix(object.matrix);
}



