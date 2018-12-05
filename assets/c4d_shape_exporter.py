import os
import json
import c4d

# Parameters

scale = 1.0 / 100.0


# Helper classes

class ExportException(Exception):

    def __init__(self, message, cause=None):
        self.message = message
        self.cause = None

    def GetMessage(self):
        return self.message

    def __str__(self):
        txt = "{}:\n{}".format(self.__class__.__name__, self.GetMessage())
        if self.cause is not None:
            txt += "\nCaused by\n{}".format(str(self.cause))
        return txt


class ObjectExportException(ExportException):

    def __init__(self, object, message, cause=None):
        ExportException.__init__(self, message, cause)
        self.object = object

    def GetMessage(self):
        return "{}\nObject '{}'".format(super(ObjectExportException, self).GetMessage(), self.object.GetName())


# Helper functions

def ToList(struct):
    if type(struct) is c4d.Vector:
        return [struct.x, struct.y, struct.z]
    elif type(struct) is c4d.Quaternion:
        return ToList(struct.v) + [struct.w]
    elif type(struct) is c4d.CPolygon:
        if struct.IsTriangle():
            return [struct.a, struct.b, struct.c]
        else:
            return [struct.a, struct.b, struct.c, struct.d]
    else:
        raise ValueError("Unknown struct type")


def WriteFile(filename, content):
    with open(filename, "w") as file:
        file.write(content)


def Log(msg):
    print(msg)


# Functions

def BuildFloor(obj):
    return {
        "type": "floor"
    }


def BuildCube(obj):
    if obj[c4d.PRIM_CUBE_DOFILLET]:
        raise ObjectExportException(obj, "Fillet is not supported")
    return {
        "type": "cube",
        "extents": ToList(obj[c4d.PRIM_CUBE_LEN] * scale)
    }


def BuildPolygon(obj):
    verts = []
    for point in obj.GetAllPoints():
        verts += ToList(point * scale)
    inds = []
    for poly in obj.GetAllPolygons():
        if not poly.IsTriangle():
            raise ObjectExportException(obj, "Untriangulated polygon object")
        inds += ToList(poly)
    return {
        "type": "polygon",
        "vertices": verts,
        "indices": inds
    }


def BuildSphere(obj):
    if obj[c4d.PRIM_SPHERE_TYPE] == c4d.PRIM_SPHERE_TYPE_HEMISPHERE:
        raise ObjectExportException(
            obj, "Hemisphere sphere type is not supported")
    return {
        "type": "sphere",
        "radius": obj[c4d.PRIM_SPHERE_RAD] * scale
    }


def BuildCylinder(obj):
    if obj[c4d.PRIM_CYLINDER_FILLET]:
        raise ObjectExportException(obj, "Fillet is not supported")
    if obj[c4d.PRIM_SLICE]:
        raise ObjectExportException(obj, "Slice is not supported")
    if obj[c4d.PRIM_AXIS] in [c4d.PRIM_AXIS_XP, c4d.PRIM_AXIS_XN]:
        axis = "x"
    elif obj[c4d.PRIM_AXIS] in [c4d.PRIM_AXIS_YP, c4d.PRIM_AXIS_YN]:
        axis = "y"
    elif obj[c4d.PRIM_AXIS] in [c4d.PRIM_AXIS_ZP, c4d.PRIM_AXIS_ZN]:
        axis = "z"
    else:
        raise ValueError("Unknown axis")
    radius = obj[c4d.PRIM_CYLINDER_RADIUS] * scale
    return {
        "type": "cylinder",
        "bottomRadius": radius,
        "topRadius": radius,
        "height": obj[c4d.PRIM_CYLINDER_HEIGHT] * scale,
        "axis": axis,
        "segments": obj[c4d.PRIM_CYLINDER_SEG]
    }


def BuildCone(obj):
    if obj[c4d.PRIM_CONE_TOPFILLET] or obj[c4d.PRIM_CONE_TOPFILLET]:
        raise ObjectExportException(obj, "Fillet is not supported")
    bottom_radius = obj[c4d.PRIM_CONE_BRAD] * scale
    top_radius = obj[c4d.PRIM_CONE_TRAD] * scale
    if obj[c4d.PRIM_SLICE]:
        raise ObjectExportException(obj, "Slice is not supported")
    if obj[c4d.PRIM_AXIS] == c4d.PRIM_AXIS_XP:
        axis = "x"
        inverted = False
    elif obj[c4d.PRIM_AXIS] == c4d.PRIM_AXIS_YP:
        axis = "y"
        inverted = False
    elif obj[c4d.PRIM_AXIS] == c4d.PRIM_AXIS_ZP:
        axis = "z"
        inverted = False
    elif obj[c4d.PRIM_AXIS] == c4d.PRIM_AXIS_XN:
        axis = "x"
        inverted = True
    elif obj[c4d.PRIM_AXIS] == c4d.PRIM_AXIS_YN:
        axis = "y"
        inverted = True
    elif obj[c4d.PRIM_AXIS] == c4d.PRIM_AXIS_ZN:
        axis = "z"
        inverted = True
    else:
        raise ValueError("Unknown axis")
    return {
        "type": "cylinder",
        "bottomRadius": top_radius if inverted else bottom_radius,
        "topRadius": bottom_radius if inverted else top_radius,
        "height": obj[c4d.PRIM_CONE_HEIGHT] * scale,
        "axis": axis,
        "segments": obj[c4d.PRIM_CONE_SEG]
    }


def BuildNullChildren(obj):
    children = []
    for child in obj.GetChildren():
        position = child.GetAbsPos() * scale
        quaternion = c4d.Quaternion()
        quaternion.SetHPB(child.GetAbsRot())
        children += [{
            "shape": BuildObject(child),
            "position": ToList(position),
            "quaternion": ToList(quaternion)
        }]
    return {
        "type": "compound",
        "shapes": children
    }


def BuildObject(obj):
    if obj.GetAbsScale() != c4d.Vector(1, 1, 1):
        raise ObjectExportException(obj, "Object scaling is not supported")
    if obj.GetType() == c4d.Opolygon:
        return BuildPolygon(obj)
    elif obj.GetType() == c4d.Osphere:
        return BuildSphere(obj)
    elif obj.GetType() == c4d.Ofloor:
        return BuildFloor(obj)
    elif obj.GetType() == c4d.Ocylinder:
        return BuildCylinder(obj)
    elif obj.GetType() == c4d.Ocone:
        return BuildCone(obj)
    elif obj.GetType() == c4d.Ocube:
        return BuildCube(obj)
    elif obj.GetType() == c4d.Onull:
        return BuildNullChildren(obj)
    else:
        raise ObjectExportException(obj, "Unsupported type")


def BuildObjects(objs):
    shapes = {}
    for obj in objs:
        if obj.GetName() in shapes:
            raise ObjectExportException(obj, "Duplicated object name")
        shapes[obj.GetName()] = BuildObject(obj)
    return shapes


def Export():
    doc = c4d.documents.GetActiveDocument()
    objs = doc.GetActiveObjects(c4d.GETACTIVEOBJECTFLAGS_0)
    shapes = BuildObjects(objs)
    content = json.dumps(shapes)
    filename = c4d.storage.SaveDialog(
        title="Export shapes", def_path=os.path.dirname(os.path.realpath(__file__)))
    WriteFile(filename, content)


def main():
    print("-- Cinema 4D Shape Exporter for Canyon project --")
    try:
        Export()
    except ExportException as ee:
        print("-- Exception occurred --")
        print(ee)
    print("-- Bye --")


if __name__ == "__main__":
    main()
