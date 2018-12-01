let renderer;
let scene;
let camera;
let clock;
let controls;
let physicsWorld;
let sphereBody;
let sphereMesh;

let sphere;

class PhysicsMesh {
	constructor(mesh, body) {
		this.mesh = mesh;
		this.body = body;
	}

	update() {
		this.mesh.position.copy(this.body.position)
		this.mesh.quaternion.copy(this.body.quaternion)
	}
}

window.onload = function() {
	initCannon ();
	initThree ();

	window.addEventListener("resize", resize);

	sphere = new PhysicsMesh(sphereMesh, sphereBody);

	resize();
	render();
}

function initThree() {
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0xdddddd, 1);

	document.body.appendChild(renderer.domElement);

	scene = new THREE.Scene();

	{
		camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.5, 1000);
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
	}

	{
		let geometry = new THREE.SphereGeometry(1);
		let material = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
		material.flatShading = true;
		sphereMesh = new THREE.Mesh(geometry, material);
		scene.add(sphereMesh);
	}

	{
		let light = new THREE.PointLight(0xFFFF00);
		light.position.set(10, 0, 10);
		scene.add(light);
	}

	clock = new THREE.Clock();
}

function initCannon() {
	physicsWorld = new CANNON.World();
	physicsWorld.gravity.set(0, -9.81, 0);
	physicsWorld.broadphase = new CANNON.NaiveBroadphase();

	{
		let mass = 5, radius = 1;
		let sphereShape = new CANNON.Sphere(radius);
		sphereBody = new CANNON.Body({ mass: mass, shape: sphereShape });
		sphereBody.position.set(0, 5, 0);
		physicsWorld.addBody(sphereBody);
	}

	{
		let groundShape = new CANNON.Plane();
		let groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
		groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
		physicsWorld.addBody(groundBody);
	}
}

function render() {
	let deltaTime = clock.getDelta();
	requestAnimationFrame(render);
	controls.update();
	physicsWorld.step(deltaTime);

	sphere.update();

	renderer.render(scene, camera);
}

function resize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}