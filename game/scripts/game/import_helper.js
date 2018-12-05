'use strict';

const ImportHelper = {};

ImportHelper.LoadJSON = function (file, callback) {
    const xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == 200) {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

ImportHelper.ImportShapes = function (shapes) {

    class ShapeDefinition {

        constructor(shape, position, quaternion) {
            this.shape = shape;
            this.position = position.clone();
            this.quaternion = quaternion.clone();
        }

        transform(position, quaternion) {
            quaternion.vmult(this.position, this.position)
            position.vadd(this.position, this.position);
            quaternion.mult(this.quaternion, this.quaternion);
        }

        addToBody(body) {
            body.addShape(this.shape, this.position, this.quaternion);
        }

    }

    function CreateShapeDefinitions(node) {

        const noOffset = new CANNON.Vec3(0, 0, 0);
        const noRotation = new CANNON.Quaternion(0, 0, 0, 1);
        const tiltX = noRotation.clone();
        const tiltY = noRotation.clone();
        const tiltZ = noRotation.clone();
        tiltX.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        tiltY.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
        tiltZ.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -Math.PI / 2);
        switch (node.type) {
            case "floor":
                {
                    const shape = new CANNON.Plane();
                    return [new ShapeDefinition(shape, noOffset, tiltX)];
                }
            case "cube":
                {
                    const extents = ImportHelper.ArrayToVec3(node.extents);
                    const shape = new CANNON.Box(extents.scale(1 / 2));
                    return [new ShapeDefinition(shape, noOffset, noRotation)];
                }
            case "polygon":
                {
                    const verts = [];
                    for (let i = 0; i < node.vertices.length; i += 3) {
                        verts.push(ImportHelper.ArrayToVec3(node.vertices.slice(i, i + 3)));
                    }
                    const shape = new CANNON.ConvexPolyhedron(verts, node.indices);
                    return [new ShapeDefinition(shape, noOffset, noRotation)];
                }
            case "sphere":
                {
                    const shape = new CANNON.Sphere(node.radius);
                    return [new ShapeDefinition(shape, noOffset, noRotation)];
                }
            case "cylinder":
                {
                    let rotation;
                    switch (node.axis) {
                        case "x":
                            rotation = tiltZ;
                            break;
                        case "y":
                            rotation = noRotation;
                            break;
                        case "z":
                            rotation = tiltX;
                            break;
                    }
                    const shape = new CANNON.Cylinder(node.topRadius, node.bottomRadius, node.height, node.segments);
                    return [new ShapeDefinition(shape, noRotation, rotation)];
                }
            case "compound":
                {
                    const defs = [];
                    for (const child of node.shapes) {
                        const position = ImportHelper.ArrayToVec3(child.position);
                        const quaternion = ImportHelper.ArrayToQuaternion(child.quaternion);
                        const chdefs = CreateShapeDefinitions(child.shape)
                        for (const chdef of chdefs) {
                            chdef.transform(position, quaternion);
                            defs.push(chdef);
                        }
                    }
                    return defs;
                }
        }
    }

    const defs = {};
    for (const key in shapes) {
        defs[key] = CreateShapeDefinitions(shapes[key]);
    }
    return defs;
}

ImportHelper.ArrayToVec3 = function (array) {
    const [x, y, z] = array;
    return new CANNON.Vec3(x, y, z);
}

ImportHelper.ArrayToQuaternion = function (array) {
    const [x, y, z, w] = array;
    return new CANNON.Quaternion(x, y, z, w);
}