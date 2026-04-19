import { a as he, bf as Z, D as de, b as Ne } from "./index-C8x7FvV-.js";
import { be as _s, bg as Os, bh as ms, bi as Es, bj as Ss } from "./index-C8x7FvV-.js";
import { M as k, v as pe, a as S, g as Ie, ah as j, C as Te, T as I, h as P, Q as W, y as ye, V as Ce, F as xe, S as we } from "./embed-entry-BKE21f6Q.js";
import { C as Ve } from "./camera-DrW_r1mf.js";
import { a as ie } from "./freeCamera-dtev_UnD.js";
import { A as Y } from "./animation-f15f0TAN.js";
import { B as X } from "./bone-Dvf-sOWU.js";
import { M as q } from "./material-D3PM2aZM.js";
import { MultiMaterial as Be } from "./multiMaterial-CA6dV2ft.js";
import { StandardMaterial as ne } from "./standardMaterial-BGd7au_T.js";
import { S as _e } from "./shaderMaterial-BI0HbQVo.js";
import { T as D } from "./texture-BWPw_5Qg.js";
import { A as Pe } from "./abstractMesh-B1ZrgCPN.js";
import { M as ee } from "./mesh-DeWxVt-I.js";
import { H as Oe } from "./hemisphericLight-CMl-PB-r.js";
import { PointLight as me } from "./pointLight-ClN8P31H.js";
import { C as R } from "./thinInstanceMesh-DXRkqCn6.js";
var G;
(function(s) {
  s[s.BYTE = 5120] = "BYTE", s[s.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", s[s.SHORT = 5122] = "SHORT", s[s.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT", s[s.FLOAT = 5126] = "FLOAT";
})(G || (G = {}));
var Q;
(function(s) {
  s[s.FRAGMENT = 35632] = "FRAGMENT", s[s.VERTEX = 35633] = "VERTEX";
})(Q || (Q = {}));
var w;
(function(s) {
  s[s.BYTE = 5120] = "BYTE", s[s.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", s[s.SHORT = 5122] = "SHORT", s[s.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT", s[s.INT = 5124] = "INT", s[s.UNSIGNED_INT = 5125] = "UNSIGNED_INT", s[s.FLOAT = 5126] = "FLOAT", s[s.FLOAT_VEC2 = 35664] = "FLOAT_VEC2", s[s.FLOAT_VEC3 = 35665] = "FLOAT_VEC3", s[s.FLOAT_VEC4 = 35666] = "FLOAT_VEC4", s[s.INT_VEC2 = 35667] = "INT_VEC2", s[s.INT_VEC3 = 35668] = "INT_VEC3", s[s.INT_VEC4 = 35669] = "INT_VEC4", s[s.BOOL = 35670] = "BOOL", s[s.BOOL_VEC2 = 35671] = "BOOL_VEC2", s[s.BOOL_VEC3 = 35672] = "BOOL_VEC3", s[s.BOOL_VEC4 = 35673] = "BOOL_VEC4", s[s.FLOAT_MAT2 = 35674] = "FLOAT_MAT2", s[s.FLOAT_MAT3 = 35675] = "FLOAT_MAT3", s[s.FLOAT_MAT4 = 35676] = "FLOAT_MAT4", s[s.SAMPLER_2D = 35678] = "SAMPLER_2D";
})(w || (w = {}));
var K;
(function(s) {
  s[s.CLAMP_TO_EDGE = 33071] = "CLAMP_TO_EDGE", s[s.MIRRORED_REPEAT = 33648] = "MIRRORED_REPEAT", s[s.REPEAT = 10497] = "REPEAT";
})(K || (K = {}));
var g;
(function(s) {
  s[s.NEAREST = 9728] = "NEAREST", s[s.LINEAR = 9728] = "LINEAR", s[s.NEAREST_MIPMAP_NEAREST = 9984] = "NEAREST_MIPMAP_NEAREST", s[s.LINEAR_MIPMAP_NEAREST = 9985] = "LINEAR_MIPMAP_NEAREST", s[s.NEAREST_MIPMAP_LINEAR = 9986] = "NEAREST_MIPMAP_LINEAR", s[s.LINEAR_MIPMAP_LINEAR = 9987] = "LINEAR_MIPMAP_LINEAR";
})(g || (g = {}));
var se;
(function(s) {
  s[s.ALPHA = 6406] = "ALPHA", s[s.RGB = 6407] = "RGB", s[s.RGBA = 6408] = "RGBA", s[s.LUMINANCE = 6409] = "LUMINANCE", s[s.LUMINANCE_ALPHA = 6410] = "LUMINANCE_ALPHA";
})(se || (se = {}));
var z;
(function(s) {
  s[s.FRONT = 1028] = "FRONT", s[s.BACK = 1029] = "BACK", s[s.FRONT_AND_BACK = 1032] = "FRONT_AND_BACK";
})(z || (z = {}));
var E;
(function(s) {
  s[s.ZERO = 0] = "ZERO", s[s.ONE = 1] = "ONE", s[s.SRC_COLOR = 768] = "SRC_COLOR", s[s.ONE_MINUS_SRC_COLOR = 769] = "ONE_MINUS_SRC_COLOR", s[s.DST_COLOR = 774] = "DST_COLOR", s[s.ONE_MINUS_DST_COLOR = 775] = "ONE_MINUS_DST_COLOR", s[s.SRC_ALPHA = 770] = "SRC_ALPHA", s[s.ONE_MINUS_SRC_ALPHA = 771] = "ONE_MINUS_SRC_ALPHA", s[s.DST_ALPHA = 772] = "DST_ALPHA", s[s.ONE_MINUS_DST_ALPHA = 773] = "ONE_MINUS_DST_ALPHA", s[s.CONSTANT_COLOR = 32769] = "CONSTANT_COLOR", s[s.ONE_MINUS_CONSTANT_COLOR = 32770] = "ONE_MINUS_CONSTANT_COLOR", s[s.CONSTANT_ALPHA = 32771] = "CONSTANT_ALPHA", s[s.ONE_MINUS_CONSTANT_ALPHA = 32772] = "ONE_MINUS_CONSTANT_ALPHA", s[s.SRC_ALPHA_SATURATE = 776] = "SRC_ALPHA_SATURATE";
})(E || (E = {}));
class M {
  /**
   * Sets the given "parameter" matrix
   * @param scene the Scene object
   * @param source the source node where to pick the matrix
   * @param parameter the GLTF technique parameter
   * @param uniformName the name of the shader's uniform
   * @param shaderMaterial the shader material
   */
  static SetMatrix(e, r, t, n, i) {
    let o = null;
    if (t.semantic === "MODEL" ? o = r.getWorldMatrix() : t.semantic === "PROJECTION" ? o = e.getProjectionMatrix() : t.semantic === "VIEW" ? o = e.getViewMatrix() : t.semantic === "MODELVIEWINVERSETRANSPOSE" ? o = k.Transpose(r.getWorldMatrix().multiply(e.getViewMatrix()).invert()) : t.semantic === "MODELVIEW" ? o = r.getWorldMatrix().multiply(e.getViewMatrix()) : t.semantic === "MODELVIEWPROJECTION" ? o = r.getWorldMatrix().multiply(e.getTransformMatrix()) : t.semantic === "MODELINVERSE" ? o = r.getWorldMatrix().invert() : t.semantic === "VIEWINVERSE" ? o = e.getViewMatrix().invert() : t.semantic === "PROJECTIONINVERSE" ? o = e.getProjectionMatrix().invert() : t.semantic === "MODELVIEWINVERSE" ? o = r.getWorldMatrix().multiply(e.getViewMatrix()).invert() : t.semantic === "MODELVIEWPROJECTIONINVERSE" ? o = r.getWorldMatrix().multiply(e.getTransformMatrix()).invert() : t.semantic === "MODELINVERSETRANSPOSE" && (o = k.Transpose(r.getWorldMatrix().invert())), o)
      switch (t.type) {
        case w.FLOAT_MAT2:
          i.setMatrix2x2(n, k.GetAsMatrix2x2(o));
          break;
        case w.FLOAT_MAT3:
          i.setMatrix3x3(n, k.GetAsMatrix3x3(o));
          break;
        case w.FLOAT_MAT4:
          i.setMatrix(n, o);
          break;
      }
  }
  /**
   * Sets the given "parameter" matrix
   * @param shaderMaterial the shader material
   * @param uniform the name of the shader's uniform
   * @param value the value of the uniform
   * @param type the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
   * @returns true if set, else false
   */
  static SetUniform(e, r, t, n) {
    switch (n) {
      case w.FLOAT:
        return e.setFloat(r, t), !0;
      case w.FLOAT_VEC2:
        return e.setVector2(r, Ie.FromArray(t)), !0;
      case w.FLOAT_VEC3:
        return e.setVector3(r, S.FromArray(t)), !0;
      case w.FLOAT_VEC4:
        return e.setVector4(r, pe.FromArray(t)), !0;
      default:
        return !1;
    }
  }
  /**
   * Returns the wrap mode of the texture
   * @param mode the mode value
   * @returns the wrap mode (TEXTURE_WRAP_ADDRESSMODE, MIRROR_ADDRESSMODE or CLAMP_ADDRESSMODE)
   */
  static GetWrapMode(e) {
    switch (e) {
      case K.CLAMP_TO_EDGE:
        return D.CLAMP_ADDRESSMODE;
      case K.MIRRORED_REPEAT:
        return D.MIRROR_ADDRESSMODE;
      case K.REPEAT:
        return D.WRAP_ADDRESSMODE;
      default:
        return D.WRAP_ADDRESSMODE;
    }
  }
  /**
   * Returns the byte stride giving an accessor
   * @param accessor the GLTF accessor objet
   * @returns the byte stride
   */
  static GetByteStrideFromType(e) {
    switch (e.type) {
      case "VEC2":
        return 2;
      case "VEC3":
        return 3;
      case "VEC4":
        return 4;
      case "MAT2":
        return 4;
      case "MAT3":
        return 9;
      case "MAT4":
        return 16;
      default:
        return 1;
    }
  }
  /**
   * Returns the texture filter mode giving a mode value
   * @param mode the filter mode value
   * @returns the filter mode (TODO - needs to be a type?)
   */
  static GetTextureFilterMode(e) {
    switch (e) {
      case g.LINEAR:
      case g.LINEAR_MIPMAP_NEAREST:
      case g.LINEAR_MIPMAP_LINEAR:
        return D.TRILINEAR_SAMPLINGMODE;
      case g.NEAREST:
      case g.NEAREST_MIPMAP_NEAREST:
        return D.NEAREST_SAMPLINGMODE;
      default:
        return D.BILINEAR_SAMPLINGMODE;
    }
  }
  static GetBufferFromBufferView(e, r, t, n, i) {
    t = r.byteOffset + t;
    const o = e.loadedBufferViews[r.buffer];
    if (t + n > o.byteLength)
      throw new Error("Buffer access is out of range");
    const a = o.buffer;
    switch (t += o.byteOffset, i) {
      case G.BYTE:
        return new Int8Array(a, t, n);
      case G.UNSIGNED_BYTE:
        return new Uint8Array(a, t, n);
      case G.SHORT:
        return new Int16Array(a, t, n);
      case G.UNSIGNED_SHORT:
        return new Uint16Array(a, t, n);
      default:
        return new Float32Array(a, t, n);
    }
  }
  /**
   * Returns a buffer from its accessor
   * @param gltfRuntime the GLTF runtime
   * @param accessor the GLTF accessor
   * @returns an array buffer view
   */
  static GetBufferFromAccessor(e, r) {
    const t = e.bufferViews[r.bufferView], n = r.count * M.GetByteStrideFromType(r);
    return M.GetBufferFromBufferView(e, t, r.byteOffset, n, r.componentType);
  }
  /**
   * Decodes a buffer view into a string
   * @param view the buffer view
   * @returns a string
   */
  static DecodeBufferToText(e) {
    let r = "";
    const t = e.byteLength;
    for (let n = 0; n < t; ++n)
      r += String.fromCharCode(e[n]);
    return r;
  }
  /**
   * Returns the default material of gltf. Related to
   * https://github.com/KhronosGroup/glTF/tree/master/specification/1.0#appendix-a-default-material
   * @param scene the Babylon.js scene
   * @returns the default Babylon material
   */
  static GetDefaultMaterial(e) {
    if (!M._DefaultMaterial) {
      j.ShadersStore.GLTFDefaultMaterialVertexShader = [
        "precision highp float;",
        "",
        "uniform mat4 worldView;",
        "uniform mat4 projection;",
        "",
        "attribute vec3 position;",
        "",
        "void main(void)",
        "{",
        "    gl_Position = projection * worldView * vec4(position, 1.0);",
        "}"
      ].join(`
`), j.ShadersStore.GLTFDefaultMaterialPixelShader = [
        "precision highp float;",
        "",
        "uniform vec4 u_emission;",
        "",
        "void main(void)",
        "{",
        "    gl_FragColor = u_emission;",
        "}"
      ].join(`
`);
      const r = {
        vertex: "GLTFDefaultMaterial",
        fragment: "GLTFDefaultMaterial"
      }, t = {
        attributes: ["position"],
        uniforms: ["worldView", "projection", "u_emission"],
        samplers: new Array(),
        needAlphaBlending: !1
      };
      M._DefaultMaterial = new _e("GLTFDefaultMaterial", e, r, t), M._DefaultMaterial.setColor4("u_emission", new Te(0.5, 0.5, 0.5, 1));
    }
    return M._DefaultMaterial;
  }
}
M._DefaultMaterial = null;
var H;
(function(s) {
  s[s.IDENTIFIER = 1] = "IDENTIFIER", s[s.UNKNOWN = 2] = "UNKNOWN", s[s.END_OF_INPUT = 3] = "END_OF_INPUT";
})(H || (H = {}));
class ae {
  constructor(e) {
    this._pos = 0, this.currentToken = H.UNKNOWN, this.currentIdentifier = "", this.currentString = "", this.isLetterOrDigitPattern = /^[a-zA-Z0-9]+$/, this._toParse = e, this._maxPos = e.length;
  }
  getNextToken() {
    if (this.isEnd())
      return H.END_OF_INPUT;
    if (this.currentString = this.read(), this.currentToken = H.UNKNOWN, this.currentString === "_" || this.isLetterOrDigitPattern.test(this.currentString))
      for (this.currentToken = H.IDENTIFIER, this.currentIdentifier = this.currentString; !this.isEnd() && (this.isLetterOrDigitPattern.test(this.currentString = this.peek()) || this.currentString === "_"); )
        this.currentIdentifier += this.currentString, this.forward();
    return this.currentToken;
  }
  peek() {
    return this._toParse[this._pos];
  }
  read() {
    return this._toParse[this._pos++];
  }
  forward() {
    this._pos++;
  }
  isEnd() {
    return this._pos >= this._maxPos;
  }
}
const Ee = ["MODEL", "VIEW", "PROJECTION", "MODELVIEW", "MODELVIEWPROJECTION", "JOINTMATRIX"], Se = ["world", "view", "projection", "worldView", "worldViewProjection", "mBones"], ge = ["translation", "rotation", "scale"], ve = ["position", "rotationQuaternion", "scaling"], Fe = (s, e) => {
  for (const r in s) {
    const t = s[r];
    e.buffers[r] = t, e.buffersCount++;
  }
}, Ue = (s, e) => {
  for (const r in s) {
    const t = s[r];
    e.shaders[r] = t, e.shaderscount++;
  }
}, x = (s, e, r) => {
  for (const t in s) {
    const n = s[t];
    r[e][t] = n;
  }
}, De = (s) => {
  if (s)
    for (let e = 0; e < s.length / 2; e++)
      s[e * 2 + 1] = 1 - s[e * 2 + 1];
}, ce = (s) => {
  if (s.semantic === "NORMAL")
    return "normal";
  if (s.semantic === "POSITION")
    return "position";
  if (s.semantic === "JOINT")
    return "matricesIndices";
  if (s.semantic === "WEIGHT")
    return "matricesWeights";
  if (s.semantic === "COLOR")
    return "color";
  if (s.semantic && s.semantic.indexOf("TEXCOORD_") !== -1) {
    const e = Number(s.semantic.split("_")[1]);
    return "uv" + (e === 0 ? "" : e + 1);
  }
  return null;
}, Ge = (s) => {
  for (const e in s.animations) {
    const r = s.animations[e];
    if (!r.channels || !r.samplers)
      continue;
    let t = null;
    for (let n = 0; n < r.channels.length; n++) {
      const i = r.channels[n], o = r.samplers[i.sampler];
      if (!o)
        continue;
      let a = null, l = null;
      r.parameters ? (a = r.parameters[o.input], l = r.parameters[o.output]) : (a = o.input, l = o.output);
      const c = M.GetBufferFromAccessor(s, s.accessors[a]), u = M.GetBufferFromAccessor(s, s.accessors[l]), d = i.target.id;
      let A = s.scene.getNodeById(d);
      if (A === null && (A = s.scene.getNodeByName(d)), A === null) {
        I.Warn("Creating animation named " + e + ". But cannot find node named " + d + " to attach to");
        continue;
      }
      const _ = A instanceof X;
      let p = i.target.path;
      const T = ge.indexOf(p);
      T !== -1 && (p = ve[T]);
      let L = Y.ANIMATIONTYPE_MATRIX;
      _ || (p === "rotationQuaternion" ? (L = Y.ANIMATIONTYPE_QUATERNION, A.rotationQuaternion = new W()) : L = Y.ANIMATIONTYPE_VECTOR3);
      let N = null;
      const V = [];
      let y = 0, C = !1;
      _ && t && t.getKeys().length === c.length && (N = t, C = !0), C || (s.scene._blockEntityCollection = !!s.assetContainer, N = new Y(e, _ ? "_matrix" : p, 1, L, Y.ANIMATIONLOOPMODE_CYCLE), s.scene._blockEntityCollection = !1);
      for (let h = 0; h < c.length; h++) {
        let m = null;
        if (p === "rotationQuaternion" ? (m = W.FromArray([u[y], u[y + 1], u[y + 2], u[y + 3]]), y += 4) : (m = S.FromArray([u[y], u[y + 1], u[y + 2]]), y += 3), _) {
          const f = A;
          let O = S.Zero(), B = new W(), v = S.Zero(), oe = f.getBaseMatrix();
          C && t && (oe = t.getKeys()[h].value), oe.decompose(v, B, O), p === "position" ? O = m : p === "rotationQuaternion" ? B = m : v = m, m = k.Compose(v, B, O);
        }
        C ? t && (t.getKeys()[h].value = m) : V.push({
          frame: c[h],
          value: m
        });
      }
      !C && N && (N.setKeys(V), A.animations.push(N)), t = N, s.scene.stopAnimation(A), s.scene.beginAnimation(A, 0, c[c.length - 1], !0, 1);
    }
  }
}, re = (s) => {
  let e = null;
  if (s.translation || s.rotation || s.scale) {
    const r = S.FromArray(s.scale || [1, 1, 1]), t = W.FromArray(s.rotation || [0, 0, 0, 1]), n = S.FromArray(s.translation || [0, 0, 0]);
    e = k.Compose(r, t, n);
  } else
    e = k.FromArray(s.matrix);
  return e;
}, Me = (s, e, r, t) => {
  for (let i = 0; i < t.bones.length; i++)
    if (t.bones[i].name === r)
      return t.bones[i];
  const n = s.nodes;
  for (const i in n) {
    const o = n[i];
    if (!o.jointName)
      continue;
    const a = o.children;
    for (let l = 0; l < a.length; l++) {
      const c = s.nodes[a[l]];
      if (c.jointName && c.jointName === r) {
        const u = re(o), d = new X(o.name || "", t, Me(s, e, o.jointName, t), u);
        return d.id = i, d;
      }
    }
  }
  return null;
}, ke = (s, e) => {
  for (let r = 0; r < s.length; r++) {
    const t = s[r];
    for (let n = 0; n < t.node.children.length; n++)
      if (t.node.children[n] === e)
        return t.bone;
  }
  return null;
}, $ = (s, e) => {
  const r = s.nodes;
  let t = r[e];
  if (t)
    return {
      node: t,
      id: e
    };
  for (const n in r)
    if (t = r[n], t.jointName === e)
      return {
        node: t,
        id: n
      };
  return null;
}, He = (s, e) => {
  for (let r = 0; r < s.jointNames.length; r++)
    if (s.jointNames[r] === e)
      return !0;
  return !1;
}, je = (s, e, r, t) => {
  for (const n in s.nodes) {
    const i = s.nodes[n], o = n;
    if (!i.jointName || He(r, i.jointName))
      continue;
    const a = re(i), l = new X(i.name || "", e, null, a);
    l.id = o, t.push({ bone: l, node: i, id: o });
  }
  for (let n = 0; n < t.length; n++) {
    const i = t[n], o = i.node.children;
    for (let a = 0; a < o.length; a++) {
      let l = null;
      for (let c = 0; c < t.length; c++)
        if (t[c].id === o[a]) {
          l = t[c];
          break;
        }
      l && (l.bone._parent = i.bone, i.bone.children.push(l.bone));
    }
  }
}, We = (s, e, r, t) => {
  if (t || (t = new he(e.name || "", "", s.scene)), !e.babylonSkeleton)
    return t;
  const n = [], i = [];
  je(s, t, e, n), t.bones = [];
  for (let a = 0; a < e.jointNames.length; a++) {
    const l = $(s, e.jointNames[a]);
    if (!l)
      continue;
    const c = l.node;
    if (!c) {
      I.Warn("Joint named " + e.jointNames[a] + " does not exist");
      continue;
    }
    const u = l.id, d = s.scene.getBoneById(u);
    if (d) {
      t.bones.push(d);
      continue;
    }
    let A = !1, _ = null;
    for (let L = 0; L < a; L++) {
      const N = $(s, e.jointNames[L]);
      if (!N)
        continue;
      const V = N.node;
      if (!V) {
        I.Warn("Joint named " + e.jointNames[L] + " does not exist when looking for parent");
        continue;
      }
      const y = V.children;
      if (y) {
        A = !1;
        for (let C = 0; C < y.length; C++)
          if (y[C] === u) {
            _ = Me(s, e, e.jointNames[L], t), A = !0;
            break;
          }
        if (A)
          break;
      }
    }
    const p = re(c);
    !_ && n.length > 0 && (_ = ke(n, u), _ && i.indexOf(_) === -1 && i.push(_));
    const T = new X(c.jointName || "", t, _, p);
    T.id = u;
  }
  const o = t.bones;
  t.bones = [];
  for (let a = 0; a < e.jointNames.length; a++) {
    const l = $(s, e.jointNames[a]);
    if (l) {
      for (let c = 0; c < o.length; c++)
        if (o[c].id === l.id) {
          t.bones.push(o[c]);
          break;
        }
    }
  }
  t.prepare();
  for (let a = 0; a < i.length; a++)
    t.bones.push(i[a]);
  return t;
}, le = (s, e, r, t, n) => {
  if (n || (s.scene._blockEntityCollection = !!s.assetContainer, n = new ee(e.name || "", s.scene), n._parentContainer = s.assetContainer, s.scene._blockEntityCollection = !1, n.id = t), !e.babylonNode)
    return n;
  const i = [];
  let o = null;
  const a = [], l = [], c = [], u = [];
  for (let _ = 0; _ < r.length; _++) {
    const p = r[_], T = s.meshes[p];
    if (T)
      for (let L = 0; L < T.primitives.length; L++) {
        const N = new ye(), V = T.primitives[L];
        V.mode;
        const y = V.attributes;
        let C = null, h = null;
        for (const f in y)
          if (C = s.accessors[y[f]], h = M.GetBufferFromAccessor(s, C), f === "NORMAL")
            N.normals = new Float32Array(h.length), N.normals.set(h);
          else if (f === "POSITION") {
            if (Z.HomogeneousCoordinates) {
              N.positions = new Float32Array(h.length - h.length / 4);
              for (let O = 0; O < h.length; O += 4)
                N.positions[O] = h[O], N.positions[O + 1] = h[O + 1], N.positions[O + 2] = h[O + 2];
            } else
              N.positions = new Float32Array(h.length), N.positions.set(h);
            l.push(N.positions.length);
          } else if (f.indexOf("TEXCOORD_") !== -1) {
            const O = Number(f.split("_")[1]), B = Ce.UVKind + (O === 0 ? "" : O + 1), v = new Float32Array(h.length);
            v.set(h), De(v), N.set(v, B);
          } else f === "JOINT" ? (N.matricesIndices = new Float32Array(h.length), N.matricesIndices.set(h)) : f === "WEIGHT" ? (N.matricesWeights = new Float32Array(h.length), N.matricesWeights.set(h)) : f === "COLOR" && (N.colors = new Float32Array(h.length), N.colors.set(h));
        if (C = s.accessors[V.indices], C)
          h = M.GetBufferFromAccessor(s, C), N.indices = new Int32Array(h.length), N.indices.set(h), u.push(N.indices.length);
        else {
          const f = [];
          for (let O = 0; O < N.positions.length / 3; O++)
            f.push(O);
          N.indices = new Int32Array(f), u.push(N.indices.length);
        }
        o ? o.merge(N) : o = N;
        const m = s.scene.getMaterialById(V.material);
        i.push(m === null ? M.GetDefaultMaterial(s.scene) : m), a.push(a.length === 0 ? 0 : a[a.length - 1] + l[l.length - 2]), c.push(c.length === 0 ? 0 : c[c.length - 1] + u[u.length - 2]);
      }
  }
  let d;
  s.scene._blockEntityCollection = !!s.assetContainer, i.length > 1 ? (d = new Be("multimat" + t, s.scene), d.subMaterials = i) : d = new ne("multimat" + t, s.scene), i.length === 1 && (d = i[0]), d._parentContainer = s.assetContainer, n.material || (n.material = d), new xe(t, s.scene, o, !1, n), n.computeWorldMatrix(!0), s.scene._blockEntityCollection = !1, n.subMeshes = [];
  let A = 0;
  for (let _ = 0; _ < r.length; _++) {
    const p = r[_], T = s.meshes[p];
    if (T)
      for (let L = 0; L < T.primitives.length; L++)
        T.primitives[L].mode, we.AddToMesh(A, a[A], l[A], c[A], u[A], n, n, !0), A++;
  }
  return n;
}, te = (s, e, r, t) => {
  s.position && (s.position = e), (s.rotationQuaternion || s.rotation) && (s.rotationQuaternion = r), s.scaling && (s.scaling = t);
}, Re = (s, e) => {
  if (e.matrix) {
    const r = new S(0, 0, 0), t = new W(), n = new S(0, 0, 0);
    k.FromArray(e.matrix).decompose(n, t, r), te(s, r, t, n);
  } else e.translation && e.rotation && e.scale && te(s, S.FromArray(e.translation), W.FromArray(e.rotation), S.FromArray(e.scale));
  s.computeWorldMatrix(!0);
}, Ze = (s, e, r) => {
  let t = null;
  if (s.importOnlyMeshes && (e.skin || e.meshes) && s.importMeshesNames && s.importMeshesNames.length > 0 && s.importMeshesNames.indexOf(e.name || "") === -1)
    return null;
  if (e.skin) {
    if (e.meshes) {
      const n = s.skins[e.skin], i = le(s, e, e.meshes, r, e.babylonNode);
      i.skeleton = s.scene.getLastSkeletonById(e.skin), i.skeleton === null && (i.skeleton = We(s, n, i, n.babylonSkeleton), n.babylonSkeleton || (n.babylonSkeleton = i.skeleton)), t = i;
    }
  } else if (e.meshes)
    t = le(s, e, e.mesh ? [e.mesh] : e.meshes, r, e.babylonNode);
  else if (e.light && !e.babylonNode && !s.importOnlyMeshes) {
    const n = s.lights[e.light];
    if (n) {
      if (n.type === "ambient") {
        const i = n[n.type], o = new Oe(e.light, S.Zero(), s.scene);
        o.name = e.name || "", i.color && (o.diffuse = P.FromArray(i.color)), t = o;
      } else if (n.type === "directional") {
        const i = n[n.type], o = new de(e.light, S.Zero(), s.scene);
        o.name = e.name || "", i.color && (o.diffuse = P.FromArray(i.color)), t = o;
      } else if (n.type === "point") {
        const i = n[n.type], o = new me(e.light, S.Zero(), s.scene);
        o.name = e.name || "", i.color && (o.diffuse = P.FromArray(i.color)), t = o;
      } else if (n.type === "spot") {
        const i = n[n.type], o = new Ne(e.light, S.Zero(), S.Zero(), 0, 0, s.scene);
        o.name = e.name || "", i.color && (o.diffuse = P.FromArray(i.color)), i.fallOfAngle && (o.angle = i.fallOfAngle), i.fallOffExponent && (o.exponent = i.fallOffExponent), t = o;
      }
    }
  } else if (e.camera && !e.babylonNode && !s.importOnlyMeshes) {
    const n = s.cameras[e.camera];
    if (n) {
      if (s.scene._blockEntityCollection = !!s.assetContainer, n.type === "orthographic") {
        const i = new ie(e.camera, S.Zero(), s.scene, !1);
        i.name = e.name || "", i.mode = Ve.ORTHOGRAPHIC_CAMERA, i.attachControl(), t = i, i._parentContainer = s.assetContainer;
      } else if (n.type === "perspective") {
        const i = n[n.type], o = new ie(e.camera, S.Zero(), s.scene, !1);
        o.name = e.name || "", o.attachControl(), i.aspectRatio || (i.aspectRatio = s.scene.getEngine().getRenderWidth() / s.scene.getEngine().getRenderHeight()), i.znear && i.zfar && (o.maxZ = i.zfar, o.minZ = i.znear), t = o, o._parentContainer = s.assetContainer;
      }
      s.scene._blockEntityCollection = !1;
    }
  }
  if (!e.jointName) {
    if (e.babylonNode)
      return e.babylonNode;
    if (t === null) {
      s.scene._blockEntityCollection = !!s.assetContainer;
      const n = new ee(e.name || "", s.scene);
      n._parentContainer = s.assetContainer, s.scene._blockEntityCollection = !1, e.babylonNode = n, t = n;
    }
  }
  if (t !== null) {
    if (e.matrix && t instanceof ee)
      Re(t, e);
    else {
      const n = e.translation || [0, 0, 0], i = e.rotation || [0, 0, 0, 1], o = e.scale || [1, 1, 1];
      te(t, S.FromArray(n), W.FromArray(i), S.FromArray(o));
    }
    t.updateCache(!0), e.babylonNode = t;
  }
  return t;
}, J = (s, e, r, t = !1) => {
  const n = s.nodes[e];
  let i = null;
  if (s.importOnlyMeshes && !t && s.importMeshesNames ? s.importMeshesNames.indexOf(n.name || "") !== -1 || s.importMeshesNames.length === 0 ? t = !0 : t = !1 : t = !0, !n.jointName && t && (i = Ze(s, n, e), i !== null && (i.id = e, i.parent = r)), n.children)
    for (let o = 0; o < n.children.length; o++)
      J(s, n.children[o], i, t);
}, fe = (s) => {
  let e = s.currentScene;
  if (e)
    for (let r = 0; r < e.nodes.length; r++)
      J(s, e.nodes[r], null);
  else
    for (const r in s.scenes) {
      e = s.scenes[r];
      for (let t = 0; t < e.nodes.length; t++)
        J(s, e.nodes[t], null);
    }
  Ge(s);
  for (let r = 0; r < s.scene.skeletons.length; r++) {
    const t = s.scene.skeletons[r];
    s.scene.beginAnimation(t, 0, Number.MAX_VALUE, !0, 1);
  }
}, Ke = (s, e, r, t, n, i, o) => {
  const a = i.values || n.parameters;
  for (const l in r) {
    const c = r[l], u = c.type;
    if (u === w.FLOAT_MAT2 || u === w.FLOAT_MAT3 || u === w.FLOAT_MAT4) {
      if (c.semantic && !c.source && !c.node)
        M.SetMatrix(e.scene, s, c, l, t.getEffect());
      else if (c.semantic && (c.source || c.node)) {
        let d = e.scene.getNodeByName(c.source || c.node || "");
        if (d === null && (d = e.scene.getNodeById(c.source || c.node || "")), d === null)
          continue;
        M.SetMatrix(e.scene, d, c, l, t.getEffect());
      }
    } else {
      const d = a[n.uniforms[l]];
      if (!d)
        continue;
      if (u === w.SAMPLER_2D) {
        const A = e.textures[i.values ? d : c.value].babylonTexture;
        if (A == null)
          continue;
        t.getEffect().setTexture(l, A);
      } else
        M.SetUniform(t.getEffect(), l, d, u);
    }
  }
  o(t);
}, Ye = (s, e, r, t, n) => {
  const i = t.values || r.parameters, o = r.uniforms;
  for (const a in n) {
    const l = n[a], c = l.type;
    let u = i[o[a]];
    if (u === void 0 && (u = l.value), !u)
      continue;
    const d = (A) => (_) => {
      l.value && A && (e.setTexture(A, _), delete n[A]);
    };
    c === w.SAMPLER_2D ? b.LoadTextureAsync(s, t.values ? u : l.value, d(a), () => d(null)) : l.value && M.SetUniform(e, a, t.values ? u : l.value, c) && delete n[a];
  }
}, Je = (s, e, r) => (t, n) => {
  e.dispose(!0), r("Cannot compile program named " + s.name + ". Error: " + n + ". Default material will be applied");
}, Qe = (s, e, r, t, n, i) => (o) => {
  Ye(s, e, r, t, n), e.onBind = (a) => {
    Ke(a, s, n, e, r, t, i);
  };
}, ue = (s, e, r) => {
  for (const t in e.uniforms) {
    const n = e.uniforms[t], i = e.parameters[n];
    if (s.currentIdentifier === t && i.semantic && !i.source && !i.node) {
      const o = Ee.indexOf(i.semantic);
      if (o !== -1)
        return delete r[t], Se[o];
    }
  }
  return s.currentIdentifier;
}, Ae = (s) => {
  for (const e in s.materials)
    b.LoadMaterialAsync(s, e, () => {
    }, () => {
    });
};
class F {
  static CreateRuntime(e, r, t) {
    const n = {
      extensions: {},
      accessors: {},
      buffers: {},
      bufferViews: {},
      meshes: {},
      lights: {},
      cameras: {},
      nodes: {},
      images: {},
      textures: {},
      shaders: {},
      programs: {},
      samplers: {},
      techniques: {},
      materials: {},
      animations: {},
      skins: {},
      extensionsUsed: [],
      scenes: {},
      buffersCount: 0,
      shaderscount: 0,
      scene: r,
      rootUrl: t,
      loadedBufferCount: 0,
      loadedBufferViews: {},
      loadedShaderCount: 0,
      importOnlyMeshes: !1,
      dummyNodes: [],
      assetContainer: null
    };
    return e.extensions && x(e.extensions, "extensions", n), e.extensionsUsed && x(e.extensionsUsed, "extensionsUsed", n), e.buffers && Fe(e.buffers, n), e.bufferViews && x(e.bufferViews, "bufferViews", n), e.accessors && x(e.accessors, "accessors", n), e.meshes && x(e.meshes, "meshes", n), e.lights && x(e.lights, "lights", n), e.cameras && x(e.cameras, "cameras", n), e.nodes && x(e.nodes, "nodes", n), e.images && x(e.images, "images", n), e.textures && x(e.textures, "textures", n), e.shaders && Ue(e.shaders, n), e.programs && x(e.programs, "programs", n), e.samplers && x(e.samplers, "samplers", n), e.techniques && x(e.techniques, "techniques", n), e.materials && x(e.materials, "materials", n), e.animations && x(e.animations, "animations", n), e.skins && x(e.skins, "skins", n), e.scenes && (n.scenes = e.scenes), e.scene && e.scenes && (n.currentScene = e.scenes[e.scene]), n;
  }
  static LoadBufferAsync(e, r, t, n, i) {
    const o = e.buffers[r];
    I.IsBase64(o.uri) ? setTimeout(() => t(new Uint8Array(I.DecodeBase64(o.uri)))) : I.LoadFile(e.rootUrl + o.uri, (a) => t(new Uint8Array(a)), i, void 0, !0, (a) => {
      a && n(a.status + " " + a.statusText);
    });
  }
  static LoadTextureBufferAsync(e, r, t, n) {
    const i = e.textures[r];
    if (!i || !i.source) {
      n("");
      return;
    }
    if (i.babylonTexture) {
      t(null);
      return;
    }
    const o = e.images[i.source];
    I.IsBase64(o.uri) ? setTimeout(() => t(new Uint8Array(I.DecodeBase64(o.uri)))) : I.LoadFile(e.rootUrl + o.uri, (a) => t(new Uint8Array(a)), void 0, void 0, !0, (a) => {
      a && n(a.status + " " + a.statusText);
    });
  }
  static CreateTextureAsync(e, r, t, n) {
    const i = e.textures[r];
    if (i.babylonTexture) {
      n(i.babylonTexture);
      return;
    }
    const o = e.samplers[i.sampler], a = o.minFilter === g.NEAREST_MIPMAP_NEAREST || o.minFilter === g.NEAREST_MIPMAP_LINEAR || o.minFilter === g.LINEAR_MIPMAP_NEAREST || o.minFilter === g.LINEAR_MIPMAP_LINEAR, l = D.BILINEAR_SAMPLINGMODE, c = t == null ? new Blob() : new Blob([t]), u = URL.createObjectURL(c), d = () => URL.revokeObjectURL(u), A = new D(u, e.scene, !a, !0, l, d, d);
    o.wrapS !== void 0 && (A.wrapU = M.GetWrapMode(o.wrapS)), o.wrapT !== void 0 && (A.wrapV = M.GetWrapMode(o.wrapT)), A.name = r, i.babylonTexture = A, n(A);
  }
  static LoadShaderStringAsync(e, r, t, n) {
    const i = e.shaders[r];
    if (I.IsBase64(i.uri)) {
      const o = atob(i.uri.split(",")[1]);
      t && t(o);
    } else
      I.LoadFile(e.rootUrl + i.uri, t, void 0, void 0, !1, (o) => {
        o && n && n(o.status + " " + o.statusText);
      });
  }
  static LoadMaterialAsync(e, r, t, n) {
    const i = e.materials[r];
    if (!i.technique) {
      n && n("No technique found.");
      return;
    }
    const o = e.techniques[i.technique];
    if (!o) {
      e.scene._blockEntityCollection = !!e.assetContainer;
      const m = new ne(r, e.scene);
      m._parentContainer = e.assetContainer, e.scene._blockEntityCollection = !1, m.diffuseColor = new P(0.5, 0.5, 0.5), m.sideOrientation = q.CounterClockWiseSideOrientation, t(m);
      return;
    }
    const a = e.programs[o.program], l = o.states, c = j.ShadersStore[a.vertexShader + "VertexShader"], u = j.ShadersStore[a.fragmentShader + "PixelShader"];
    let d = "", A = "";
    const _ = new ae(c), p = new ae(u), T = {}, L = [], N = [], V = [];
    for (const m in o.uniforms) {
      const f = o.uniforms[m], O = o.parameters[f];
      if (T[m] = O, O.semantic && !O.node && !O.source) {
        const B = Ee.indexOf(O.semantic);
        B !== -1 ? (L.push(Se[B]), delete T[m]) : L.push(m);
      } else O.type === w.SAMPLER_2D ? V.push(m) : L.push(m);
    }
    for (const m in o.attributes) {
      const f = o.attributes[m], O = o.parameters[f];
      if (O.semantic) {
        const B = ce(O);
        B && N.push(B);
      }
    }
    for (; !_.isEnd() && _.getNextToken(); ) {
      if (_.currentToken !== H.IDENTIFIER) {
        d += _.currentString;
        continue;
      }
      let f = !1;
      for (const O in o.attributes) {
        const B = o.attributes[O], v = o.parameters[B];
        if (_.currentIdentifier === O && v.semantic) {
          d += ce(v), f = !0;
          break;
        }
      }
      f || (d += ue(_, o, T));
    }
    for (; !p.isEnd() && p.getNextToken(); ) {
      if (p.currentToken !== H.IDENTIFIER) {
        A += p.currentString;
        continue;
      }
      A += ue(p, o, T);
    }
    const y = {
      vertex: a.vertexShader + r,
      fragment: a.fragmentShader + r
    }, C = {
      attributes: N,
      uniforms: L,
      samplers: V,
      needAlphaBlending: l && l.enable && l.enable.indexOf(3042) !== -1
    };
    j.ShadersStore[a.vertexShader + r + "VertexShader"] = d, j.ShadersStore[a.fragmentShader + r + "PixelShader"] = A;
    const h = new _e(r, e.scene, y, C);
    if (h.onError = Je(a, h, n), h.onCompiled = Qe(e, h, o, i, T, t), h.sideOrientation = q.CounterClockWiseSideOrientation, l && l.functions) {
      const m = l.functions;
      m.cullFace && m.cullFace[0] !== z.BACK && (h.backFaceCulling = !1);
      const f = m.blendFuncSeparate;
      f && (f[0] === E.SRC_ALPHA && f[1] === E.ONE_MINUS_SRC_ALPHA && f[2] === E.ONE && f[3] === E.ONE ? h.alphaMode = R.ALPHA_COMBINE : f[0] === E.ONE && f[1] === E.ONE && f[2] === E.ZERO && f[3] === E.ONE ? h.alphaMode = R.ALPHA_ONEONE : f[0] === E.SRC_ALPHA && f[1] === E.ONE && f[2] === E.ZERO && f[3] === E.ONE ? h.alphaMode = R.ALPHA_ADD : f[0] === E.ZERO && f[1] === E.ONE_MINUS_SRC_COLOR && f[2] === E.ONE && f[3] === E.ONE ? h.alphaMode = R.ALPHA_SUBTRACT : f[0] === E.DST_COLOR && f[1] === E.ZERO && f[2] === E.ONE && f[3] === E.ONE ? h.alphaMode = R.ALPHA_MULTIPLY : f[0] === E.SRC_ALPHA && f[1] === E.ONE_MINUS_SRC_COLOR && f[2] === E.ONE && f[3] === E.ONE && (h.alphaMode = R.ALPHA_MAXIMIZED));
    }
  }
}
class U {
  static RegisterExtension(e) {
    if (U.Extensions[e.name]) {
      I.Error('Tool with the same name "' + e.name + '" already exists');
      return;
    }
    U.Extensions[e.name] = e;
  }
  dispose() {
  }
  _importMeshAsync(e, r, t, n, i, o, a, l) {
    return r.useRightHandedSystem = !0, b.LoadRuntimeAsync(r, t, n, (c) => {
      c.assetContainer = i, c.importOnlyMeshes = !0, e === "" ? c.importMeshesNames = [] : typeof e == "string" ? c.importMeshesNames = [e] : e && !(e instanceof Array) ? c.importMeshesNames = [e] : (c.importMeshesNames = [], I.Warn("Argument meshesNames must be of type string or string[]")), this._createNodes(c);
      const u = [], d = [];
      for (const A in c.nodes) {
        const _ = c.nodes[A];
        _.babylonNode instanceof Pe && u.push(_.babylonNode);
      }
      for (const A in c.skins) {
        const _ = c.skins[A];
        _.babylonSkeleton instanceof he && d.push(_.babylonSkeleton);
      }
      this._loadBuffersAsync(c, () => {
        this._loadShadersAsync(c, () => {
          Ae(c), fe(c), !Z.IncrementalLoading && o && o(u, d);
        });
      }), Z.IncrementalLoading && o && o(u, d);
    }, l), !0;
  }
  /**
   * Imports one or more meshes from a loaded gltf file and adds them to the scene
   * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
   * @param scene the scene the meshes should be added to
   * @param assetContainer defines the asset container to use (can be null)
   * @param data gltf data containing information of the meshes in a loaded file
   * @param rootUrl root url to load from
   * @param onProgress event that fires when loading progress has occured
   * @returns a promise containg the loaded meshes, particles, skeletons and animations
   */
  importMeshAsync(e, r, t, n, i, o) {
    return new Promise((a, l) => {
      this._importMeshAsync(e, r, n, i, t, (c, u) => {
        a({
          meshes: c,
          particleSystems: [],
          skeletons: u,
          animationGroups: [],
          lights: [],
          transformNodes: [],
          geometries: [],
          spriteManagers: []
        });
      }, o, (c) => {
        l(new Error(c));
      });
    });
  }
  _loadAsync(e, r, t, n, i, o) {
    e.useRightHandedSystem = !0, b.LoadRuntimeAsync(e, r, t, (a) => {
      b.LoadRuntimeExtensionsAsync(a, () => {
        this._createNodes(a), this._loadBuffersAsync(a, () => {
          this._loadShadersAsync(a, () => {
            Ae(a), fe(a), Z.IncrementalLoading || n();
          });
        }), Z.IncrementalLoading && n();
      }, o);
    }, o);
  }
  /**
   * Imports all objects from a loaded gltf file and adds them to the scene
   * @param scene the scene the objects should be added to
   * @param data gltf data containing information of the meshes in a loaded file
   * @param rootUrl root url to load from
   * @param onProgress event that fires when loading progress has occured
   * @returns a promise which completes when objects have been loaded to the scene
   */
  loadAsync(e, r, t, n) {
    return new Promise((i, o) => {
      this._loadAsync(e, r, t, () => {
        i();
      }, n, (a) => {
        o(new Error(a));
      });
    });
  }
  _loadShadersAsync(e, r) {
    let t = !1;
    const n = (i, o) => {
      b.LoadShaderStringAsync(e, i, (a) => {
        a instanceof ArrayBuffer || (e.loadedShaderCount++, a && (j.ShadersStore[i + (o.type === Q.VERTEX ? "VertexShader" : "PixelShader")] = a), e.loadedShaderCount === e.shaderscount && r());
      }, () => {
        I.Error("Error when loading shader program named " + i + " located at " + o.uri);
      });
    };
    for (const i in e.shaders) {
      t = !0;
      const o = e.shaders[i];
      o ? n.bind(this, i, o)() : I.Error("No shader named: " + i);
    }
    t || r();
  }
  _loadBuffersAsync(e, r) {
    let t = !1;
    const n = (i, o) => {
      b.LoadBufferAsync(e, i, (a) => {
        e.loadedBufferCount++, a && (a.byteLength != e.buffers[i].byteLength && I.Error("Buffer named " + i + " is length " + a.byteLength + ". Expected: " + o.byteLength), e.loadedBufferViews[i] = a), e.loadedBufferCount === e.buffersCount && r();
      }, () => {
        I.Error("Error when loading buffer named " + i + " located at " + o.uri);
      });
    };
    for (const i in e.buffers) {
      t = !0;
      const o = e.buffers[i];
      o ? n.bind(this, i, o)() : I.Error("No buffer named: " + i);
    }
    t || r();
  }
  _createNodes(e) {
    let r = e.currentScene;
    if (r)
      for (let t = 0; t < r.nodes.length; t++)
        J(e, r.nodes[t], null);
    else
      for (const t in e.scenes) {
        r = e.scenes[t];
        for (let n = 0; n < r.nodes.length; n++)
          J(e, r.nodes[n], null);
      }
  }
}
U.Extensions = {};
class b {
  constructor(e) {
    this._name = e;
  }
  get name() {
    return this._name;
  }
  /**
   * Defines an override for loading the runtime
   * Return true to stop further extensions from loading the runtime
   * @param scene
   * @param data
   * @param rootUrl
   * @param onSuccess
   * @param onError
   * @returns true to stop further extensions from loading the runtime
   */
  loadRuntimeAsync(e, r, t, n, i) {
    return !1;
  }
  /**
   * Defines an onverride for creating gltf runtime
   * Return true to stop further extensions from creating the runtime
   * @param gltfRuntime
   * @param onSuccess
   * @param onError
   * @returns true to stop further extensions from creating the runtime
   */
  loadRuntimeExtensionsAsync(e, r, t) {
    return !1;
  }
  /**
   * Defines an override for loading buffers
   * Return true to stop further extensions from loading this buffer
   * @param gltfRuntime
   * @param id
   * @param onSuccess
   * @param onError
   * @param onProgress
   * @returns true to stop further extensions from loading this buffer
   */
  loadBufferAsync(e, r, t, n, i) {
    return !1;
  }
  /**
   * Defines an override for loading texture buffers
   * Return true to stop further extensions from loading this texture data
   * @param gltfRuntime
   * @param id
   * @param onSuccess
   * @param onError
   * @returns true to stop further extensions from loading this texture data
   */
  loadTextureBufferAsync(e, r, t, n) {
    return !1;
  }
  /**
   * Defines an override for creating textures
   * Return true to stop further extensions from loading this texture
   * @param gltfRuntime
   * @param id
   * @param buffer
   * @param onSuccess
   * @param onError
   * @returns true to stop further extensions from loading this texture
   */
  createTextureAsync(e, r, t, n, i) {
    return !1;
  }
  /**
   * Defines an override for loading shader strings
   * Return true to stop further extensions from loading this shader data
   * @param gltfRuntime
   * @param id
   * @param onSuccess
   * @param onError
   * @returns true to stop further extensions from loading this shader data
   */
  loadShaderStringAsync(e, r, t, n) {
    return !1;
  }
  /**
   * Defines an override for loading materials
   * Return true to stop further extensions from loading this material
   * @param gltfRuntime
   * @param id
   * @param onSuccess
   * @param onError
   * @returns true to stop further extensions from loading this material
   */
  loadMaterialAsync(e, r, t, n) {
    return !1;
  }
  // ---------
  // Utilities
  // ---------
  static LoadRuntimeAsync(e, r, t, n, i) {
    b._ApplyExtensions((o) => o.loadRuntimeAsync(e, r, t, n, i), () => {
      setTimeout(() => {
        n && n(F.CreateRuntime(r.json, e, t));
      });
    });
  }
  static LoadRuntimeExtensionsAsync(e, r, t) {
    b._ApplyExtensions((n) => n.loadRuntimeExtensionsAsync(e, r, t), () => {
      setTimeout(() => {
        r();
      });
    });
  }
  static LoadBufferAsync(e, r, t, n, i) {
    b._ApplyExtensions((o) => o.loadBufferAsync(e, r, t, n, i), () => {
      F.LoadBufferAsync(e, r, t, n, i);
    });
  }
  static LoadTextureAsync(e, r, t, n) {
    b._LoadTextureBufferAsync(e, r, (i) => {
      i && b._CreateTextureAsync(e, r, i, t, n);
    }, n);
  }
  static LoadShaderStringAsync(e, r, t, n) {
    b._ApplyExtensions((i) => i.loadShaderStringAsync(e, r, t, n), () => {
      F.LoadShaderStringAsync(e, r, t, n);
    });
  }
  static LoadMaterialAsync(e, r, t, n) {
    b._ApplyExtensions((i) => i.loadMaterialAsync(e, r, t, n), () => {
      F.LoadMaterialAsync(e, r, t, n);
    });
  }
  static _LoadTextureBufferAsync(e, r, t, n) {
    b._ApplyExtensions((i) => i.loadTextureBufferAsync(e, r, t, n), () => {
      F.LoadTextureBufferAsync(e, r, t, n);
    });
  }
  static _CreateTextureAsync(e, r, t, n, i) {
    b._ApplyExtensions((o) => o.createTextureAsync(e, r, t, n, i), () => {
      F.CreateTextureAsync(e, r, t, n);
    });
  }
  static _ApplyExtensions(e, r) {
    for (const t in U.Extensions) {
      const n = U.Extensions[t];
      if (e(n))
        return;
    }
    r();
  }
}
Z._CreateGLTF1Loader = () => new U();
const ze = "binary_glTF";
class Le extends b {
  constructor() {
    super("KHR_binary_glTF");
  }
  loadRuntimeAsync(e, r, t, n) {
    const i = r.json.extensionsUsed;
    return !i || i.indexOf(this.name) === -1 || !r.bin ? !1 : (this._bin = r.bin, n(F.CreateRuntime(r.json, e, t)), !0);
  }
  loadBufferAsync(e, r, t, n) {
    return e.extensionsUsed.indexOf(this.name) === -1 || r !== ze ? !1 : (this._bin.readAsync(0, this._bin.byteLength).then(t, (i) => n(i.message)), !0);
  }
  loadTextureBufferAsync(e, r, t) {
    const n = e.textures[r], i = e.images[n.source];
    if (!i.extensions || !(this.name in i.extensions))
      return !1;
    const o = i.extensions[this.name], a = e.bufferViews[o.bufferView], l = M.GetBufferFromBufferView(e, a, 0, a.byteLength, G.UNSIGNED_BYTE);
    return t(l), !0;
  }
  loadShaderStringAsync(e, r, t) {
    const n = e.shaders[r];
    if (!n.extensions || !(this.name in n.extensions))
      return !1;
    const i = n.extensions[this.name], o = e.bufferViews[i.bufferView], a = M.GetBufferFromBufferView(e, o, 0, o.byteLength, G.UNSIGNED_BYTE);
    return setTimeout(() => {
      const l = M.DecodeBufferToText(a);
      t(l);
    }), !0;
  }
}
U.RegisterExtension(new Le());
class be extends b {
  constructor() {
    super("KHR_materials_common");
  }
  loadRuntimeExtensionsAsync(e) {
    if (!e.extensions)
      return !1;
    const r = e.extensions[this.name];
    if (!r)
      return !1;
    const t = r.lights;
    if (t)
      for (const n in t) {
        const i = t[n];
        switch (i.type) {
          case "ambient": {
            const o = new Oe(i.name, new S(0, 1, 0), e.scene), a = i.ambient;
            a && (o.diffuse = P.FromArray(a.color || [1, 1, 1]));
            break;
          }
          case "point": {
            const o = new me(i.name, new S(10, 10, 10), e.scene), a = i.point;
            a && (o.diffuse = P.FromArray(a.color || [1, 1, 1]));
            break;
          }
          case "directional": {
            const o = new de(i.name, new S(0, -1, 0), e.scene), a = i.directional;
            a && (o.diffuse = P.FromArray(a.color || [1, 1, 1]));
            break;
          }
          case "spot": {
            const o = i.spot;
            if (o) {
              const a = new Ne(i.name, new S(0, 10, 0), new S(0, -1, 0), o.fallOffAngle || Math.PI, o.fallOffExponent || 0, e.scene);
              a.diffuse = P.FromArray(o.color || [1, 1, 1]);
            }
            break;
          }
          default:
            I.Warn('GLTF Material Common extension: light type "' + i.type + "” not supported");
            break;
        }
      }
    return !1;
  }
  loadMaterialAsync(e, r, t, n) {
    const i = e.materials[r];
    if (!i || !i.extensions)
      return !1;
    const o = i.extensions[this.name];
    if (!o)
      return !1;
    const a = new ne(r, e.scene);
    return a.sideOrientation = q.CounterClockWiseSideOrientation, o.technique === "CONSTANT" && (a.disableLighting = !0), a.backFaceCulling = o.doubleSided === void 0 ? !1 : !o.doubleSided, a.alpha = o.values.transparency === void 0 ? 1 : o.values.transparency, a.specularPower = o.values.shininess === void 0 ? 0 : o.values.shininess, typeof o.values.ambient == "string" ? this._loadTexture(e, o.values.ambient, a, "ambientTexture", n) : a.ambientColor = P.FromArray(o.values.ambient || [0, 0, 0]), typeof o.values.diffuse == "string" ? this._loadTexture(e, o.values.diffuse, a, "diffuseTexture", n) : a.diffuseColor = P.FromArray(o.values.diffuse || [0, 0, 0]), typeof o.values.emission == "string" ? this._loadTexture(e, o.values.emission, a, "emissiveTexture", n) : a.emissiveColor = P.FromArray(o.values.emission || [0, 0, 0]), typeof o.values.specular == "string" ? this._loadTexture(e, o.values.specular, a, "specularTexture", n) : a.specularColor = P.FromArray(o.values.specular || [0, 0, 0]), !0;
  }
  _loadTexture(e, r, t, n, i) {
    F.LoadTextureBufferAsync(e, r, (o) => {
      F.CreateTextureAsync(e, r, o, (a) => t[n] = a);
    }, i);
  }
}
U.RegisterExtension(new be());
const hs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get EBlendingFunction() {
    return E;
  },
  get EComponentType() {
    return G;
  },
  get ECullingType() {
    return z;
  },
  get EParameterType() {
    return w;
  },
  get EShaderType() {
    return Q;
  },
  get ETextureFilterType() {
    return g;
  },
  get ETextureFormat() {
    return se;
  },
  get ETextureWrapMode() {
    return K;
  },
  GLTFBinaryExtension: Le,
  GLTFLoader: U,
  GLTFLoaderBase: F,
  GLTFLoaderExtension: b,
  GLTFMaterialsCommonExtension: be,
  GLTFUtils: M
}, Symbol.toStringTag, { value: "Module" }));
export {
  hs as GLTF1,
  _s as GLTF2,
  Z as GLTFFileLoader,
  Os as GLTFLoaderAnimationStartMode,
  ms as GLTFLoaderCoordinateSystemMode,
  Es as GLTFLoaderState,
  Ss as GLTFValidation
};
//# sourceMappingURL=index-QRCP5K9J.js.map
