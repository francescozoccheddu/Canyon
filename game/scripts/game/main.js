var renderer;
var scene;
var camera;
var clock;

window.onload = function () {
	renderer = new THREE.WebGLRenderer();
	document.body.appendChild(renderer.domElement);
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(45, 16/9, 0.5, 1000);

	camera.position.set(-15, 10, 15);
	camera.lookAt(scene.position);
	controls = new THREE.TrackballControls(camera);
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	var geometry = new THREE.BoxGeometry(5, 5, 5);
	var material = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);
	var light = new THREE.PointLight(0xFFFF00);
	light.position.set(10, 0, 10);
	scene.add(light);

	renderer.setClearColor(0xdddddd, 1);

	clock = new THREE.Clock();

	window.addEventListener("resize", resize);

	resize();
	render();
}

function render() {
	deltaTime = clock.getDelta();
	requestId = requestAnimationFrame(render);
	controls.update();
	renderer.render(scene, camera);
}

function resize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}
