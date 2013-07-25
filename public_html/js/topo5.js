var camera;
var scene;
var renderer;
var rendererCSS;
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
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 5;
  camera.position.y = 10;
  camera.position.x = 5;

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
  
  var plane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshNormalMaterial());
  scene.add(plane);

  rendererCSS = new THREE.CSS3DRenderer();
  rendererGL = new THREE.WebGLRenderer();

  var element = document.createElement('div');
  element.style.backgroundColor = 'rgba(0,127,127,' + ( Math.random() * 0.5 + 0.25 ) + ')';
  element.textContent = "element1";
  
  var element1 = document.createElement('div');
  element1.style.backgroundColor = 'white';
  element1.textContent = "element2";

  var objectCSS = new THREE.CSS3DObject(element);
  objectCSS.scale.multiplyScalar(1/2);
  //var objectCSS1 = new THREE.CSS3DObject(element1);
  
  //objectCSS.rotation.x = -Math.PI / 2;
  scene.add(objectCSS);


  window.addEventListener('resize', onWindowResize, false);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  rendererGL.setSize(window.innerWidth, window.innerHeight);
  rendererCSS.setSize(window.innerWidth, window.innerHeight);

  controls.handleResize();

  render();

}

function render() {
  //camera.position.x += (mouseX - camera.position.x) * 0.05;
  //camera.position.y += (-mouseY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);
  rendererGL.render(scene, camera);
  //rendererCSS.render(scene, camera);
}



