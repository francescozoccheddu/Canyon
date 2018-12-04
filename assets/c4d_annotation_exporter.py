import os
import json
import c4d


# Parameters

scale = 1.0 / 100.0
par_name = "$name$"
par_position = "$position$"
par_rotation_quat = "$rot_quat$"
par_rotation_hpb = "$rot_hpb$"
par_scale = "$scale$"


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

def WriteFile(filename, content):
    with open(filename, "w") as file:
        file.write(content)


# Functions

def BuildTag(tag):
    obj = tag.GetObject()
    txt = tag[c4d.ANNOTATIONTAG_TEXT]
    txt = txt.replace(par_name, "\"{}\"".format(obj.GetName()))
    pos = obj.GetAbsPos()
    txt = txt.replace(par_position, "[{},{},{}]".format(pos.x, pos.y, pos.z))
    rot = obj.GetAbsRot()
    txt = txt.replace(par_rotation_hpb, "[{},{},{}]".format(rot.x,rot.y,rot.z))
    quat = c4d.Quaternion()
    quat.SetHPB(rot)
    txt = txt.replace(par_rotation_quat, "[{},{},{},{}]".format(quat.v.x,quat.v.y,quat.v.z,quat.w))
    scale = obj.GetAbsScale()
    txt = txt.replace(par_rotation_hpb, "[{},{},{}]".format(scale.x,scale.y,scale.z))
    try:
        out = json.loads(txt)
    except ValueError as ve:
        raise ObjectExportException(obj, "Invalid JSON", ve)
    return out


def BuildObject(obj):
    return [BuildTag(tag) for tag in obj.GetTags() if tag.GetType() == c4d.Tannotation]


def Export():
    doc = c4d.documents.GetActiveDocument()
    objs = doc.GetActiveObjects(c4d.GETACTIVEOBJECTFLAGS_0)
    tags = []
    for obj in objs:
        tags += BuildObject(obj)
    content = json.dumps(tags)
    filename = c4d.storage.SaveDialog(
        title="Export annotations", def_path=os.path.dirname(os.path.realpath(__file__)))
    WriteFile(filename, content)


def main():
    print("-- Cinema 4D Annotation Exporter for Canyon project --")
    try:
        Export()
    except ExportException as ee:
        print("-- Exception occurred --")
        print(ee)
    print("-- Bye --")


if __name__ == "__main__":
    main()
