var camera;
var scene;
var renderer;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var mouseX = 0;
var mouseY = 0;
var clock;
var origin = new THREE.Vector3(0, 0, 0);
var controls;

init();
animate();

function init() {
  var container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 5;
  camera.position.y = 25;
  camera.position.x = 0;

  controls = new THREE.TrackballControls(camera);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.keys = [65, 83, 68];
  controls.addEventListener('change', render);

  scene = new THREE.Scene();

  // Make some coordinate axes
  var x1 = new THREE.Vector3(10, 0, 0);
  var y1 = new THREE.Vector3(0, 10, 0);
  var z1 = new THREE.Vector3(0, 0, 10);
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

  // Add some particles
  var partGeo = new THREE.Geometry();

  for (var i = 0; i < 10000; i++) {
    var v = new THREE.Vector3();
    v.x = Math.random() * 100;
    v.y = 0;
    v.z = Math.random() * 100;

    partGeo.vertices.push(v);
  }

  //var sprite = THREE.ImageUtils.loadTexture("images/particle.png");
  material = new THREE.ParticleBasicMaterial({
    color: 0xFF0000,
    size: 2,
    map: THREE.ImageUtils.loadTexture(
      "images/disc.png"
      ),
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 1
  });

  var particles = new THREE.ParticleSystem(partGeo, material);
  particles.sortParticles = true;
  //particles.sortParticles = true;
  scene.add(particles);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  controls.handleResize();

  render();

}

function render() {
  //camera.position.x += (mouseX - camera.position.x) * 0.05;
  //camera.position.y += (-mouseY - camera.position.y) * 0.05;
  //camera.lookAt(scene.position);
  renderer.render(scene, camera);
}


