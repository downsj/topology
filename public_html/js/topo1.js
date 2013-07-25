
var mouseX = 0, mouseY = 0,
  windowHalfX = window.innerWidth / 2,
  windowHalfY = window.innerHeight / 2,
  SEPARATION = 200,
  AMOUNTX = 10,
  AMOUNTY = 10,
  camera, scene, renderer;

var nodes = {
  "n1": {position: null},
  "n2": {positon: null},
  "n3": {position: null},
  "n4": {position: null},
  "n5": {position: null}
};

var links = [
  ["n1", "n2"],
  ["n1", "n3"],
  ["n2", "n4"],
  ["n4", "n5"],
  ["n2", "n5"],
  ["n3", "n5"],
  ["n1", "n5"],
  ["n2", "n3"]
];

/*function buildNodes(n){
  for(var i = 0;i < n;i++){
    var name = "n" + i;
    nodes.name = {position:null};
  }
}

function buildLinks(n){
  for(var i=0;i<n;i++){
    // Select two random nodes to connect
    var n1 = Math.random() * nodes.length;
    var n2 = Math.random() * nodes.length;
    
  }
}*/

init();
animate();

function init() {

  var container, separation = 100, amountX = 50, amountY = 50,
    particles, particle;

  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 200;
  console.log("camera");
  console.log(camera);

  scene = new THREE.Scene();

  renderer = new THREE.CanvasRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // particles

  var PI2 = Math.PI * 2;
  var material = new THREE.ParticleCanvasMaterial({
    color: 0x297ACC,
    opacity: 1,
    // Draws circles
    program: function(context) {
      context.beginPath();
      context.arc(0, 0, 1, 0, PI2, true);
      context.closePath();
      context.fill();
    }

  });

  for (var node in nodes) {
    //console.log(nodes[node]);
    particle = new THREE.Particle(material);
    particle.position.x = Math.random() - .5;
    particle.position.y = Math.random() - .5;
    particle.position.z = Math.random() - .5;
    particle.position.z = 0;
    particle.position.multiplyScalar(200);

    particle.scale.x = particle.scale.y = 1;
    scene.add(particle);
    nodes[node].position = particle.position;
  }

  links.forEach(function(link){
    var pos1 = nodes[link[0]].position;
    var pos2 = nodes[link[1]].position;
    console.log(pos1);
    console.log(pos2);
    
    var geometry = new THREE.Geometry();
    geometry.vertices.push(pos1);
    geometry.vertices.push(pos2);
    var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0xffffff, opacity: 0.5, linewidth: 1}));
    scene.add(line);
  });

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
  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

function onDocumentKeyDown(event) {
  console.log(event.keyCode);
  console.log(camera.rotation);
  if (event.keyCode == '38') {
    console.log("up arrow");
    camera.rotation.x += .05;
  }
  else if (event.keyCode == '40') {
    console.log("down arrow");
    camera.rotation.x -= .05;
  } else if (event.keyCode == '37') {
    console.log("left arrow");
    camera.rotation.y += .05;
  } else if (event.keyCode == '39') {
    console.log("right arrow");
    camera.rotation.y -= .05;
  } else if (event.keyCode == '87') {
    console.log("w");
    camera.translateZ(-2);
  } else if (event.keyCode == '83') {
    console.log("s");
    camera.translateZ(2);
  }
  else if (event.keyCode == '65') {
    console.log("a");
    camera.translateX(-1);
  } else if (event.keyCode == '68') {
    console.log("d");
    camera.translateX(1);
  }

}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  camera.position.x += (mouseX - camera.position.x) * .05;
  camera.position.y += (-mouseY + 200 - camera.position.y) * .05;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}


