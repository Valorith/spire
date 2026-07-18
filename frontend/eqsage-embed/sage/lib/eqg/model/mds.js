/* eslint-disable */
import { vec2, vec3 } from 'gl-matrix';
import { TypedArrayReader } from '../../util/typed-array-reader';
import {
  Bone,
  BoneAssignment,
  Geometry,
  Material,
  MaterialProperty,
  Polygon,
  Vertex,
  Weight,
} from './model';

const cloneBones = (bones) =>
  bones.map((source) => {
    const bone = new Bone();
    Object.assign(bone, source);
    bone.children = [];
    return bone;
  });

export class MDS {
  reader = null;
  fileHandle = null;
  name = '';
  version = 0;
  materials = [];
  bones = [];
  models = [];

  constructor(data, fileHandle, name) {
    this.reader = new TypedArrayReader(data.buffer);
    this.fileHandle = fileHandle;
    this.name = name;
    this.init();
  }

  init() {
    const reader = this.reader;
    const magic = reader.readString(4);
    if (magic !== 'EQGS') {
      throw new Error(`MDS ${this.name} does not contain an EQGS header: ${magic}`);
    }

    const [version, listLength, materialCount, boneCount, modelCount] =
      reader.readManyUint32(5);
    this.version = version;
    const listIdx = reader.getCursor();
    reader.addCursor(listLength);

    for (let i = 0; i < materialCount; i++) {
      const material = new Material();
      reader.readInt32();
      material.name = reader.readCStringFromIdx(listIdx + reader.readInt32());
      material.shader = reader.readCStringFromIdx(listIdx + reader.readInt32());
      const propertyCount = reader.readUint32();
      for (let j = 0; j < propertyCount; j++) {
        const property = new MaterialProperty();
        property.name = reader.readCStringFromIdx(listIdx + reader.readInt32());
        property.type = reader.readUint32();
        if (property.type === 0) {
          property.valueF = reader.readFloat32();
        } else {
          const value = reader.readInt32();
          if (property.type === 2) {
            property.valueS = reader.readCStringFromIdx(listIdx + value);
          } else {
            property.valueI = value;
          }
        }
        material.properties.push(property);
      }
      this.materials.push(material);
    }

    for (let i = 0; i < boneCount; i++) {
      const bone = new Bone();
      bone.name = reader.readCStringFromIdx(listIdx + reader.readInt32());
      bone.next = reader.readInt32();
      bone.childrenCount = reader.readUint32();
      bone.childrenIndex = reader.readInt32();
      const [x, y, z, rotX, rotY, rotZ, rotW, scaleX, scaleY, scaleZ] =
        reader.readManyFloat32(10);
      bone.x = -x;
      bone.y = -y;
      bone.z = z;
      bone.rotX = -rotX;
      bone.rotY = -rotY;
      bone.rotZ = rotZ;
      bone.rotW = rotW;
      bone.scaleX = scaleX;
      bone.scaleY = scaleY;
      bone.scaleZ = scaleZ;
      this.bones.push(bone);
    }

    const archiveName = this.name.replace(/\.mds$/i, '').toLowerCase();
    for (let i = 0; i < modelCount; i++) {
      const mainPiece = reader.readUint32();
      const sourceName = reader
        .readCStringFromIdx(listIdx + reader.readInt32())
        .toLowerCase();
      const vertexCount = reader.readUint32();
      const faceCount = reader.readUint32();
      const modelBoneCount = reader.readUint32();
      const geometry = new Geometry();
      geometry.name = sourceName;
      geometry.mats = this.materials;

      for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
        const vertex = new Vertex();
        const [x, y, z, normalX, normalY, normalZ] = reader.readManyFloat32(6);
        vertex.pos = vec3.fromValues(-x, -y, z);
        vertex.nor = vec3.fromValues(-normalX, -normalY, normalZ);
        if (version <= 2) {
          vertex.col = 0xffffffff;
          const [u, v] = reader.readManyFloat32(2);
          vertex.tex = vec2.fromValues(-u, -v);
        } else {
          vertex.col = reader.readUint32();
          const [u, v] = reader.readManyFloat32(2);
          reader.readManyFloat32(2);
          vertex.tex = vec2.fromValues(u, v);
        }
        geometry.verts.push(vertex);
      }

      for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
        const polygon = new Polygon();
        polygon.verts = reader.readManyUint32(3);
        polygon.material = reader.readInt32();
        polygon.flags = reader.readUint32();
        geometry.polys.push(polygon);
      }

      if (this.bones.length > 0) {
        for (const vertex of geometry.verts) {
          const assignment = new BoneAssignment();
          assignment.count = reader.readInt32();
          for (let weightIndex = 0; weightIndex < 4; weightIndex++) {
            const weight = new Weight();
            weight.bone = reader.readInt32();
            weight.weight = reader.readFloat32();
            if (weightIndex >= assignment.count) {
              weight.bone = -1;
              weight.weight = 0;
            }
            assignment.weights.push(weight);
          }
          vertex.boneAssignment = assignment;
        }
      }

      // Standalone character archives are addressed by their archive/race
      // code, but a few production MDS files retain an internal artist name
      // for their only mesh (for example BRX -> MBX), or mark a differently
      // named head-shaped piece as the main model. Publish that sole/main
      // piece under the archive code so the runtime can request the race by
      // its canonical model name. Alternate pieces keep their source names.
      const isCanonicalPiece = sourceName === `${archiveName}00`;
      const isSolePiece = modelCount === 1;
      const isExplicitMainPiece = mainPiece === 1;
      const isFirstDefaultPiece = i === 0 && /00$/i.test(sourceName);
      const modelName =
        isCanonicalPiece || isSolePiece || isExplicitMainPiece || isFirstDefaultPiece
          ? archiveName
          : sourceName;
      this.models.push({
        name: modelName,
        model: {
          name: sourceName,
          header: {
            mainPiece,
            modelBoneCount,
            version,
          },
          geometry,
          bones: cloneBones(this.bones),
        },
      });
    }
  }
}
