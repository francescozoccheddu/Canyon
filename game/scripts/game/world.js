'use strict';

function GameWorld(children) {

	console.log("new GameWorld");

	const MAX_DELTA_TIME = 1 / 10;
	const FIXED_PHYSICS_TIME_STEP = 1 / 60;
	const GRAVITY = new CANNON.Vec3(0, -9.81, 0);

	class PhysicsMesh {
		constructor(mesh, body) {
			this.mesh = mesh;
			this.body = body;
		}

		updateInverse() {
			this.body.position.copy(this.mesh.position)
			this.body.quaternion.copy(this.mesh.quaternion)
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

		console.log("Shapes imported");

		const shapes = ImportHelper.importShapes(jobj);
		for (const child of children) {
			switch (child.userData.type) {
				case "body":
					{
						const shape = shapes[child.userData.shape];
						const body = new CANNON.Body({ mass: child.userData.mass });
						physicsWorld.addBody(body);
						for (const shapeDef of shape) {
							shapeDef.addToBody(body);
						}
						const object = new PhysicsMesh(child, body);
						object.updateInverse();
						objects.push(object);
						if (typeof(child.userData.name) !== undefined) {
							namedObjects[child.userData.name] = body;
						}
					}
					break;
			}
		}
	});

	this.update = function (deltaTime) {
		const clampedDeltaTime = Math.min(deltaTime, MAX_DELTA_TIME);
		physicsWorld.step(FIXED_PHYSICS_TIME_STEP, clampedDeltaTime, 10);

		for (const object of objects) {
			object.update();
		}
	}

}

