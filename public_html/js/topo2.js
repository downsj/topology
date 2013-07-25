
var mouseX = 0, mouseY = 0,
  windowHalfX = window.innerWidth / 2,
  windowHalfY = window.innerHeight / 2,
  camera, scene, renderer;

var nodes = {
  "n1": {position: null},
  "n2": {positon: null},
  "n3": {position: null},
  "n4": {position: null},
  "n5": {position: null}
};

var links = {
  "n1": ["n2", "n3", "n4"],
  "n2": ["n5"],
  "n3": ["n5"],
  "n4": ["n6"],
  "n5": ["n7"],
  "n6": ["n7"]
};

var pathCount = 2;
var paths = {
  "n2" : {"n5" : {"n7" : true}},
  "n3" : {"n5" : {"n7" : true}}
};

init();
animate();

function init() {

  var container, circleGeo;

  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 15;

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  
  
  // Create orbits for each path. Each one will be in the same axis but with a different rotation.
  var resolution = 100;
  var amplitude = 10;
  var size = 360 / resolution;

  var geometry = new THREE.Geometry();
  var material = new THREE.LineBasicMaterial({color: 0xFFFFFF, opacity: 1.0});
  for (var i = 0; i <= resolution; i++) {
    var segment = (i * size) * Math.PI / 180;
    geometry.vertices.push(new THREE.Vector3(Math.cos(segment) * amplitude, 0, Math.sin(segment) * amplitude));
  }
  
  var rotationAmount = Math.PI / (pathCount + 1);
  var i = 1;
  for(path in paths){
    var orbit = new THREE.Line(geometry,material);
    //console.log(i*rotationAmount);
    //console.log(orbit);
    orbit.rotation.x = i*rotationAmount;
    i++;
    scene.add(orbit);
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
  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

function onDocumentKeyDown(event) {
  //console.log(event.keyCode);
  console.log(camera.rotation);
  if (event.keyCode == '38') {
    //console.log("up arrow");
    camera.rotation.x += .05;
  }
  else if (event.keyCode == '40') {
    //console.log("down arrow");
    camera.rotation.x -= .05;
  } else if (event.keyCode == '37') {
    //console.log("left arrow");
    camera.rotation.y += .05;
  } else if (event.keyCode == '39') {
    //console.log("right arrow");
    camera.rotation.y -= .05;
  } else if (event.keyCode == '87') {
    //console.log("w");
    camera.translateZ(-2);
  } else if (event.keyCode == '83') {
    //console.log("s");
    camera.translateZ(2);
  }
  else if (event.keyCode == '65') {
    //console.log("a");
    camera.translateX(-1);
  } else if (event.keyCode == '68') {
    //console.log("d");
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


