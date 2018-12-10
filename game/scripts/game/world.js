'use strict';

function GameWorld(objs) {

	console.log("new GameWorld");
	console.log(objs);

	const MAX_DELTA_TIME = 1 / 10;
	const FIXED_PHYSICS_TIME_STEP = 1 / 60;
	const GRAVITY = new CANNON.Vec3(0, -9.81, 0);

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

	const objects = [];
	const namedObjects = {};

	const physicsWorld = new CANNON.World();
	physicsWorld.gravity.copy(GRAVITY);
	physicsWorld.broadphase = new CANNON.NaiveBroadphase();

	ImportHelper.loadJSON("assets/shapes.json", function (jobj) {
		const shapes = ImportHelper.importShapes(jobj);
	});

	this.update = function (deltaTime) {
		const clampedDeltaTime = Math.min(deltaTime, MAX_DELTA_TIME);
		physicsWorld.step(FIXED_PHYSICS_TIME_STEP, clampedDeltaTime, 10);

		for (const object of objects) {
			object.update();
		}
	}

}

