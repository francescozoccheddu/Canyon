'use strict';

const MAX_DELTA_TIME = 1 / 10;
const FIXED_PHYSICS_TIME_STEP = 1 / 60;

let renderer;
let scene;
let camera;
let clock;
let controls;
let physicsWorld;

const WIDTH = 3;
const HEIGHT = 4;
const Y = 8;
const positions = [new CANNON.Vec3(-WIDTH, Y, -HEIGHT), new CANNON.Vec3(WIDTH, Y, -HEIGHT), new CANNON.Vec3(-WIDTH, Y, HEIGHT), new CANNON.Vec3(WIDTH, Y, HEIGHT)];

const meshes = [];

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

window.onload = function () {

	initCannon();
	initThree();
	initCar();


	window.addEventListener("resize", resize);

	resize();
	render();
}

function loadScene(dict, shapes, meshes) {
	const physicsMeshes = [];
	const objects = [];

	for (const key in dict) {
		const node = dict[key];
		switch (node.type) {
			case "model":
				{

				}
				break;
			case "spring":
				{

				}
				break;
		}
	}

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
		const light = new THREE.PointLight(0xFFFF00);
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
		const groundShape = new CANNON.Plane();
		const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
		groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
		physicsWorld.addBody(groundBody);
	}
}

function initCar() {
	{
		const geometry = new THREE.SphereGeometry(1);
		const mass = 1, radius = 1;
		const sphereShape = new CANNON.Sphere(radius);
		const material = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
		material.flatShading = true;

		for (let position of positions) {
			const body = new CANNON.Body({ mass: mass, shape: sphereShape });
			body.position.copy(position);
			physicsWorld.addBody(body);
			const mesh = new THREE.Mesh(geometry, material);
			scene.add(mesh);
			const physicsMesh = new PhysicsMesh(mesh, body);
			meshes.push(physicsMesh);
		}
	}
	{
		const geometry = new THREE.BoxGeometry(WIDTH, 2, HEIGHT);
		const mass = 1;
		const boxShape = new CANNON.Box(new CANNON.Vec3(WIDTH / 2, 2 / 2, HEIGHT / 2));
		const material = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
		material.flatShading = true;
		const body = new CANNON.Body({ mass: mass, shape: boxShape });
		body.position.copy(new CANNON.Vec3(0, Y + 1, 0));
		physicsWorld.addBody(body);
		const mesh = new THREE.Mesh(geometry, material);
		scene.add(mesh);
		const physicsMesh = new PhysicsMesh(mesh, body);

		for (const bmesh of meshes) {
			const spring = new CANNON.Spring({
				restLength: 0,
				stiffness: 50,
				damping: 0.1,
			});
			spring.bodyA = body;
			spring.bodyB = bmesh.body;

			const posb = bmesh.body.position.clone();
			const posa = new CANNON.Vec3(posb.x, posb.y - 2, posb.z);

			spring.setWorldAnchorA(posa);
			spring.setWorldAnchorB(posb);

			physicsWorld.addEventListener("postStep", function (event) {
				spring.applyForce();
			});
		}

		meshes.push(physicsMesh);
	}
}

function render() {
	const deltaTime = Math.min(clock.getDelta(), MAX_DELTA_TIME);
	requestAnimationFrame(render);
	controls.update();
	physicsWorld.step(FIXED_PHYSICS_TIME_STEP, deltaTime, 10);

	for (const mesh of meshes) {
		mesh.update();
	}

	renderer.render(scene, camera);
}

function resize() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}