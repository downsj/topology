
var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2,
  windowHalfY = window.innerHeight / 2;

var camera, scene, renderer;

// The radius of primary nodes
var primaryNR = 8;
// The radius of secondary nodes
var secondaryNR = 2;
// The radius of tertiary nodes
var tertiaryNR = 2;
// Distance from center of primary node to center of tertiary node
var secondaryOrbitDist = 13;
// Distance from center of primary node to center of tertiary node
var tertiaryOrbitDist = 18;

var mouse = {x: 0, y: 0};
var intersected;
var projector;
var raycaster;

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

var links = {
  "n1": {"n2": true, "n5": true, "n7": true},
  "n2": {"n1": true, "n3": true, "n5": true, "n6": true},
  "n3": {"n2": true, "n4": true, "n6": true, "n8": true},
  "n4": {"n3": true, "n7": true, "n9": true},
  "n5": {"n1": true, "n2": true, "n6": true},
  "n6": {"n2": true, "n3": true, "n5": true},
  "n7": {"n1": true, "n4": true},
  "n8": {"n3": true, "n9": true},
  "n9": {"n4": true, "n8": true}
};

var secondaryLinks = {};
// compute secondary links
for (primaryNode in nodes) {
  secondaryLinks[primaryNode] = {};
  var primaryLinks = links[primaryNode];
  // Secondary nodes refer to all of the nodes that the primary node is linked to
  for (secondaryNode in primaryLinks) {
    // Now get all the nodes that the secondary node is linked to
    for (n in links[secondaryNode]) {
      // Then update secondaryLinks to include all of these nodes
      // If the primary node is already directly linked to one of these nodes,
      // then we'll just exclude it
      if (!links[primaryNode][n] === true)
        secondaryLinks[primaryNode][n] = links[secondaryNode][n];
    }
  }

  // Finally, get rid of the primary node. It shouldn't be linked to itself
  delete secondaryLinks[primaryNode][primaryNode];
}

console.log(secondaryLinks);


var path = ["n1", "n2", "n3", "n7"];

// Scale used to calculate the position of primary nodes
var xS = d3.scale.linear()
  .domain([0, path.length - 1])
  .range([-100, 100]);

var primaryNodeMaterial;
var primaryNodeMaterial1;

init();
animate();

function init() {
  projector = new THREE.Projector();
  raycaster = new THREE.Raycaster();

  var container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 15;

  scene = new THREE.Scene();

  renderer = new THREE.CanvasRenderer();
  //renderer = new THREE.CSS3DRenderer();

  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Draw a particle for each node
  var PI2 = Math.PI * 2;
  primaryNodeMaterial = new THREE.ParticleCanvasMaterial({
    color: 0x297ACC,
    opacity: 1,
    // Draws circles
    program: function(context) {
       context.beginPath();
       context.arc(0, 0, 1, 0, PI2, true);
       context.closePath();
       context.fill();
       context.font = "1px Arial";
       context.fillStyle = 'white';
       context.fillText("A", -.25, 0);
    }
  });

  primaryNodeMaterial1 = new THREE.ParticleCanvasMaterial({
    color: 0x93B7DB,
    opacity: 1,
    // Draws circles
    program: function(context) {
      context.beginPath();
      context.arc(0, 0, 1, 0, PI2, true);
      context.closePath();
      context.fill();
    }
  });

  // Draw a line representing the path between primary nodes
  var pos1 = new THREE.Vector3(xS.range()[0], 0, 0);
  var pos2 = new THREE.Vector3(xS.range()[1], 0, 0);

  var geometry = new THREE.Geometry();
  geometry.vertices.push(pos1);
  geometry.vertices.push(pos2);
  var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0xffffff, opacity: 0.5, linewidth: 2}));
  scene.add(line);

  // Draw the nodes in the path
  for (var i = 0; i < path.length; i++) {
    // Get the node
    var node = path[i];
    console.log("NODE: " + node);
    var x = xS(i);

    particle = new THREE.Particle(primaryNodeMaterial);
    particle.position.x = x;
    particle.position.y = 0;
    particle.position.z = 0;

    particle.scale.x = particle.scale.y = primaryNR;
    particle.name = "main-node-" + i;
    scene.add(particle);

    nodes[node].position = particle.position;

    // Draw the adjacent nodes in orbit around the head node
    var adjacentNodes = links[node];

    var material1 = new THREE.ParticleCanvasMaterial({
      color: 0xFF0000,
      opacity: 1,
      // Draws circles
      program: function(context) {
        context.beginPath();
        context.arc(0, 0, 1, 0, PI2, true);
        context.closePath();
        context.fill();
      }

    });

    // Get the number of adjacent nodes
    var adjacentNodeCount = Object.keys(adjacentNodes).length;
    console.log("adj node count: " + adjacentNodeCount);

    var angle = 0;
    if (adjacentNodeCount > 1)
      angle = (2 * Math.PI) / (adjacentNodeCount - 1);

    console.log("Angle: " + angle);

    for (j = 0; j < adjacentNodeCount - 1; j++) {
      var subPart = new THREE.Particle(material1);
      subPart.position.x = particle.position.x + secondaryOrbitDist * Math.cos(j * angle);
      subPart.position.z = particle.position.y + secondaryOrbitDist * Math.sin(j * angle);
      console.log("theta: " + j * angle);
      console.log("x: " + subPart.position.x);
      console.log("z: " + subPart.position.y);

      subPart.name = "secondary-node-" + j;
      subPart.scale.x = subPart.scale.y = secondaryNR;
      scene.add(subPart);
    }

    // Draw the tertiary nodes
    var tertiaryNodes = secondaryLinks[node];

    var material2 = new THREE.ParticleCanvasMaterial({
      color: 0xFF5500,
      opacity: 1,
      // Draws circles
      program: function(context) {
        context.beginPath();
        context.arc(0, 0, 1, 0, PI2, true);
        context.closePath();
        context.fill();
      }

    });

    var tertiaryNodeCount = Object.keys(tertiaryNodes).length;

    angle = 0;
    if (adjacentNodeCount > 1)
      angle = (2 * Math.PI) / (tertiaryNodeCount - 1);

    console.log("Angle: " + angle);

    for (j = 0; j < adjacentNodeCount - 1; j++) {
      var subPart = new THREE.Particle(material2);
      subPart.position.x = particle.position.x + tertiaryOrbitDist * Math.cos(j * angle);
      subPart.position.z = particle.position.y + tertiaryOrbitDist * Math.sin(j * angle);
      console.log("theta: " + j * angle);
      console.log("x: " + subPart.position.x);
      console.log("z: " + subPart.position.y);
      particle.position.z = 0;
      subPart.name = "tertiary-node-" + j;
      subPart.scale.x = subPart.scale.y = tertiaryNR;
      scene.add(subPart);
    }
  }

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  window.addEventListener('resize', onWindowResize, false);
  //window.addEventListener('keydown', onDocumentKeyDown, false);
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}
var thing = true;
function render() {
  camera.position.x += (mouseX - camera.position.x) * .05;
  camera.position.y += (-mouseY + 200 - camera.position.y) * .05;
  camera.lookAt(scene.position);
  camera.updateMatrixWorld();

  var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  projector.unprojectVector(vector, camera);

  var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

  var intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    // Check if the currently intersected object is the same as the previously intersected object
    if (intersected != intersects[ 0 ].object) {

      if (intersected)
        intersected.material = primaryNodeMaterial;

      intersected = intersects[ 0 ].object;
      intersected.material = primaryNodeMaterial1;
    }
  } else {
    if (intersected)
      intersected.material = primaryNodeMaterial;

    intersected = null;
  }

  renderer.render(scene, camera);
}





