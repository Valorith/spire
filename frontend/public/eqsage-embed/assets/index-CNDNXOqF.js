import { M as ie, T as F, a as R, Q as B, w as b, h as z, g as W, d as $e, V as T, v as D, C as we, i as L, L as Ie } from "./embed-entry-Bb6cfUYP.js";
import { A as Q, f as Ce } from "./animation-sWT0QqkG.js";
import { TransformNode as Ae } from "./transformNode-ChKEoFVr.js";
import { M as oe, C as J } from "./thinInstanceMesh-Dwrw0J_q.js";
import { M as G } from "./mesh-BIoKPPmW.js";
import { C as ee } from "./camera-Bftgmroh.js";
import { Light as te } from "./light-DLhl-uii.js";
import { L as Fe } from "./linesMesh-BZxXVHVG.js";
import { I as se } from "./instancedMesh-DYkSbHSi.js";
import { M as O } from "./material-DFxkKjOT.js";
import { E as He } from "./engine-Br2P72Us.js";
import { T as ae } from "./textureTools-pnZZly8k.js";
import { T as P } from "./texture-CrzlX0Ec.js";
import { R as je } from "./rawTexture-B6u8AroC.js";
import { D as We } from "./renderTargetTexture-BK46q1q4.js";
import { MultiMaterial as Se } from "./multiMaterial-CHgfRfOl.js";
import { S as Ge } from "./shadowLight-BgslpLkD.js";
import { a as Z, P as j } from "./pbrMaterial-CIqbrpsM.js";
import { StandardMaterial as Ye } from "./standardMaterial-CjZ1uqUX.js";
class Qe {
  /**
   * Exports the geometry of a Mesh array in .OBJ file format (text)
   * @param meshes defines the list of meshes to serialize
   * @param materials defines if materials should be exported
   * @param matlibname defines the name of the associated mtl file
   * @param globalposition defines if the exported positions are globals or local to the exported mesh
   * @returns the OBJ content
   */
  static OBJ(e, t, s, n) {
    const i = [];
    let r = 1, o = 1;
    t && (s || (s = "mat"), i.push("mtllib " + s + ".mtl"));
    for (let u = 0; u < e.length; u++) {
      const a = e[u].name || `mesh${u}}`;
      i.push(`o ${a}`);
      let l = null;
      if (n) {
        const I = e[u].computeWorldMatrix(!0);
        l = new ie(), I.invertToRef(l), e[u].bakeTransformIntoVertices(I);
      }
      if (t) {
        const I = e[u].material;
        I && i.push("usemtl " + I.id);
      }
      const h = e[u].geometry;
      if (!h) {
        F.Warn("No geometry is present on the mesh");
        continue;
      }
      const f = h.getVerticesData("position"), p = h.getVerticesData("normal"), g = h.getVerticesData("uv"), x = h.getIndices();
      let d = 0, _ = 0;
      if (!f || !x) {
        F.Warn("There are no position vertices or indices on the mesh!");
        continue;
      }
      const m = e[0].getScene().useRightHandedSystem, A = m ? 1 : -1;
      for (let I = 0; I < f.length; I += 3)
        i.push("v " + f[I] * A + " " + f[I + 1] + " " + f[I + 2]), d++;
      if (p != null)
        for (let I = 0; I < p.length; I += 3)
          i.push("vn " + p[I] * A + " " + p[I + 1] + " " + p[I + 2]);
      if (g != null)
        for (let I = 0; I < g.length; I += 2)
          i.push("vt " + g[I] + " " + g[I + 1]), _++;
      const w = ["", "", ""], [C, y] = m ? [2, 1] : [1, 2];
      for (let I = 0; I < x.length; I += 3) {
        const k = [String(x[I] + r), String(x[I + C] + r), String(x[I + y] + r)], K = [String(x[I] + o), String(x[I + C] + o), String(x[I + y] + o)], S = k, q = g != null ? K : w, $ = p != null ? k : w;
        i.push("f " + S[0] + "/" + q[0] + "/" + $[0] + " " + S[1] + "/" + q[1] + "/" + $[1] + " " + S[2] + "/" + q[2] + "/" + $[2]);
      }
      n && l && e[u].bakeTransformIntoVertices(l), r += d, o += _;
    }
    return i.join(`
`);
  }
  /**
   * Exports the material(s) of a mesh in .MTL file format (text)
   * @param mesh defines the mesh to extract the material from
   * @returns the mtl content
   */
  //TODO: Export the materials of mesh array
  static MTL(e) {
    const t = [], s = e.material;
    t.push("newmtl mat1"), t.push("  Ns " + s.specularPower.toFixed(4)), t.push("  Ni 1.5000"), t.push("  d " + s.alpha.toFixed(4)), t.push("  Tr 0.0000"), t.push("  Tf 1.0000 1.0000 1.0000"), t.push("  illum 2"), t.push("  Ka " + s.ambientColor.r.toFixed(4) + " " + s.ambientColor.g.toFixed(4) + " " + s.ambientColor.b.toFixed(4)), t.push("  Kd " + s.diffuseColor.r.toFixed(4) + " " + s.diffuseColor.g.toFixed(4) + " " + s.diffuseColor.b.toFixed(4)), t.push("  Ks " + s.specularColor.r.toFixed(4) + " " + s.specularColor.g.toFixed(4) + " " + s.specularColor.b.toFixed(4)), t.push("  Ke " + s.emissiveColor.r.toFixed(4) + " " + s.emissiveColor.g.toFixed(4) + " " + s.emissiveColor.b.toFixed(4));
    const n = "";
    return s.ambientTexture && t.push("  map_Ka " + n + s.ambientTexture.name), s.diffuseTexture && t.push("  map_Kd " + n + s.diffuseTexture.name), s.specularTexture && t.push("  map_Ks " + n + s.specularTexture.name), s.bumpTexture && t.push("  map_bump -imfchan z " + n + s.bumpTexture.name), s.opacityTexture && t.push("  map_d " + n + s.opacityTexture.name), t.join(`
`);
  }
}
var Xe = 0;
class U {
  /**
   * Creates a buffer view based on the supplied arguments
   * @param bufferIndex index value of the specified buffer
   * @param byteOffset byte offset value
   * @param byteLength byte length of the bufferView
   * @param byteStride byte distance between conequential elements
   * @param name name of the buffer view
   * @returns bufferView for glTF
   */
  static _CreateBufferView(e, t, s, n, i) {
    const r = { buffer: e, byteLength: s };
    return t && (r.byteOffset = t), i && (r.name = i), n && (r.byteStride = n), r;
  }
  /**
   * Creates an accessor based on the supplied arguments
   * @param bufferviewIndex The index of the bufferview referenced by this accessor
   * @param name The name of the accessor
   * @param type The type of the accessor
   * @param componentType The datatype of components in the attribute
   * @param count The number of attributes referenced by this accessor
   * @param byteOffset The offset relative to the start of the bufferView in bytes
   * @param min Minimum value of each component in this attribute
   * @param max Maximum value of each component in this attribute
   * @returns accessor for glTF
   */
  static _CreateAccessor(e, t, s, n, i, r, o, c) {
    const u = { name: t, bufferView: e, componentType: n, count: i, type: s };
    return o != null && (u.min = o), c != null && (u.max = c), r != null && (u.byteOffset = r), u;
  }
  /**
   * Calculates the minimum and maximum values of an array of position floats
   * @param positions Positions array of a mesh
   * @param vertexStart Starting vertex offset to calculate min and max values
   * @param vertexCount Number of vertices to check for min and max values
   * @returns min number array and max number array
   */
  static _CalculateMinMaxPositions(e, t, s) {
    const n = [1 / 0, 1 / 0, 1 / 0], i = [-1 / 0, -1 / 0, -1 / 0], r = 3;
    let o, c, u;
    if (s)
      for (let a = t, l = t + s; a < l; ++a) {
        o = r * a, c = R.FromArray(e, o), u = c.asArray();
        for (let h = 0; h < r; ++h) {
          const f = u[h];
          f < n[h] && (n[h] = f), f > i[h] && (i[h] = f), ++o;
        }
      }
    return { min: n, max: i };
  }
  static _NormalizeTangentFromRef(e) {
    const t = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);
    t > 0 && (e.x /= t, e.y /= t, e.z /= t);
  }
  static _GetDataAccessorElementCount(e) {
    switch (e) {
      case "MAT2":
        return 4;
      case "MAT3":
        return 9;
      case "MAT4":
        return 16;
      case "SCALAR":
        return 1;
      case "VEC2":
        return 2;
      case "VEC3":
        return 3;
      case "VEC4":
        return 4;
    }
  }
}
var ne;
(function(E) {
  E[E.INTANGENT = 0] = "INTANGENT", E[E.OUTTANGENT = 1] = "OUTTANGENT";
})(ne || (ne = {}));
class M {
  /**
   * Determine if a node is transformable - ie has properties it should be part of animation of transformation.
   * @param babylonNode the node to test
   * @returns true if can be animated, false otherwise. False if the parameter is null or undefined.
   */
  static _IsTransformable(e) {
    return e && (e instanceof Ae || e instanceof ee || e instanceof te);
  }
  /**
   * @ignore
   *
   * Creates glTF channel animation from BabylonJS animation.
   * @param babylonTransformNode - BabylonJS mesh.
   * @param animation - animation.
   * @param animationChannelTargetPath - The target animation channel.
   * @param useQuaternion - Specifies if quaternions are used.
   * @returns nullable IAnimationData
   */
  static _CreateNodeAnimation(e, t, s, n, i) {
    if (this._IsTransformable(e)) {
      const r = [], o = [], c = t.getKeys(), u = M._CalculateMinMaxKeyFrames(c), a = M._DeduceInterpolation(c, s, n), l = a.interpolationType, h = a.shouldBakeAnimation;
      if (h ? M._CreateBakedAnimation(e, t, s, u.min, u.max, t.framePerSecond, i, r, o, u, n) : l === "LINEAR" || l === "STEP" ? M._CreateLinearOrStepAnimation(e, t, s, r, o, n) : l === "CUBICSPLINE" ? M._CreateCubicSplineAnimation(e, t, s, r, o, n) : M._CreateBakedAnimation(e, t, s, u.min, u.max, t.framePerSecond, i, r, o, u, n), r.length && o.length)
        return {
          inputs: r,
          outputs: o,
          samplerInterpolation: l,
          inputsMin: h ? u.min : F.FloatRound(u.min / t.framePerSecond),
          inputsMax: h ? u.max : F.FloatRound(u.max / t.framePerSecond)
        };
    }
    return null;
  }
  static _DeduceAnimationInfo(e) {
    let t = null, s = "VEC3", n = !1;
    const i = e.targetProperty.split(".");
    switch (i[0]) {
      case "scaling": {
        t = "scale";
        break;
      }
      case "position": {
        t = "translation";
        break;
      }
      case "rotation": {
        s = "VEC4", t = "rotation";
        break;
      }
      case "rotationQuaternion": {
        s = "VEC4", n = !0, t = "rotation";
        break;
      }
      case "influence": {
        s = "SCALAR", t = "weights";
        break;
      }
      default:
        F.Error(`Unsupported animatable property ${i[0]}`);
    }
    return t ? { animationChannelTargetPath: t, dataAccessorType: s, useQuaternion: n } : (F.Error("animation channel target path and data accessor type could be deduced"), null);
  }
  /**
   * @ignore
   * Create node animations from the transform node animations
   * @param babylonNode
   * @param runtimeGLTFAnimation
   * @param idleGLTFAnimations
   * @param nodeMap
   * @param nodes
   * @param binaryWriter
   * @param bufferViews
   * @param accessors
   * @param animationSampleRate
   */
  static _CreateNodeAnimationFromNodeAnimations(e, t, s, n, i, r, o, c, u, a) {
    let l;
    if (M._IsTransformable(e) && e.animations)
      for (const h of e.animations) {
        if (a && !a(h))
          continue;
        const f = M._DeduceAnimationInfo(h);
        f && (l = {
          name: h.name,
          samplers: [],
          channels: []
        }, M._AddAnimation(`${h.name}`, h.hasRunningRuntimeAnimations ? t : l, e, h, f.dataAccessorType, f.animationChannelTargetPath, n, r, o, c, f.useQuaternion, u), l.samplers.length && l.channels.length && s.push(l));
      }
  }
  /**
   * @ignore
   * Create individual morph animations from the mesh's morph target animation tracks
   * @param babylonNode
   * @param runtimeGLTFAnimation
   * @param idleGLTFAnimations
   * @param nodeMap
   * @param nodes
   * @param binaryWriter
   * @param bufferViews
   * @param accessors
   * @param animationSampleRate
   */
  static _CreateMorphTargetAnimationFromMorphTargetAnimations(e, t, s, n, i, r, o, c, u, a) {
    let l;
    if (e instanceof G) {
      const h = e.morphTargetManager;
      if (h)
        for (let f = 0; f < h.numTargets; ++f) {
          const p = h.getTarget(f);
          for (const g of p.animations) {
            if (a && !a(g))
              continue;
            const x = new Q(`${g.name}`, "influence", g.framePerSecond, g.dataType, g.loopMode, g.enableBlending), d = [], _ = g.getKeys();
            for (let A = 0; A < _.length; ++A) {
              const w = _[A];
              for (let C = 0; C < h.numTargets; ++C)
                C == f ? d.push(w) : d.push({ frame: w.frame, value: 0 });
            }
            x.setKeys(d);
            const m = M._DeduceAnimationInfo(x);
            m && (l = {
              name: x.name,
              samplers: [],
              channels: []
            }, M._AddAnimation(g.name, g.hasRunningRuntimeAnimations ? t : l, e, x, m.dataAccessorType, m.animationChannelTargetPath, n, r, o, c, m.useQuaternion, u, h.numTargets), l.samplers.length && l.channels.length && s.push(l));
          }
        }
    }
  }
  /**
   * @internal
   * Create node and morph animations from the animation groups
   * @param babylonScene
   * @param glTFAnimations
   * @param nodeMap
   * @param nodes
   * @param binaryWriter
   * @param bufferViews
   * @param accessors
   * @param animationSampleRate
   */
  static _CreateNodeAndMorphAnimationFromAnimationGroups(e, t, s, n, i, r, o, c) {
    let u;
    if (e.animationGroups) {
      const a = e.animationGroups;
      for (const l of a) {
        const h = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new Set(), g = l.to - l.from;
        u = {
          name: l.name,
          channels: [],
          samplers: []
        };
        for (let x = 0; x < l.targetedAnimations.length; ++x) {
          const d = l.targetedAnimations[x], _ = d.target, m = d.animation;
          if (!(c && !c(m))) {
            if (this._IsTransformable(_) || _.length === 1 && this._IsTransformable(_[0])) {
              const A = M._DeduceAnimationInfo(d.animation);
              if (A) {
                const w = this._IsTransformable(_) ? _ : this._IsTransformable(_[0]) ? _[0] : null;
                w && M._AddAnimation(`${m.name}`, u, w, m, A.dataAccessorType, A.animationChannelTargetPath, s, n, i, r, A.useQuaternion, o);
              }
            } else if ((_ instanceof oe || _.length === 1 && _[0] instanceof oe) && M._DeduceAnimationInfo(d.animation)) {
              const w = _ instanceof oe ? _ : _[0];
              if (w) {
                const C = e.morphTargetManagers.find((y) => {
                  for (let I = 0; I < y.numTargets; ++I)
                    if (y.getTarget(I) === w)
                      return !0;
                  return !1;
                });
                if (C) {
                  const y = e.meshes.find((I) => I.morphTargetManager === C);
                  y && (h.has(y) || h.set(y, /* @__PURE__ */ new Map()), h.get(y)?.set(w, m), p.add(y), f.set(y, m));
                }
              }
            }
          }
        }
        p.forEach((x) => {
          const d = x.morphTargetManager;
          let _ = null;
          const m = [], w = f.get(x).getKeys(), C = w.length;
          for (let I = 0; I < C; ++I)
            for (let k = 0; k < d.numTargets; ++k) {
              const K = d.getTarget(k), S = h.get(x);
              if (S) {
                const q = S.get(K);
                q ? (_ || (_ = new Q(`${l.name}_${x.name}_MorphWeightAnimation`, "influence", q.framePerSecond, Q.ANIMATIONTYPE_FLOAT, q.loopMode, q.enableBlending)), m.push(q.getKeys()[I])) : m.push({
                  frame: l.from + g / C * I,
                  value: K.influence,
                  inTangent: w[0].inTangent ? 0 : void 0,
                  outTangent: w[0].outTangent ? 0 : void 0
                });
              }
            }
          _.setKeys(m);
          const y = M._DeduceAnimationInfo(_);
          y && M._AddAnimation(`${l.name}_${x.name}_MorphWeightAnimation`, u, x, _, y.dataAccessorType, y.animationChannelTargetPath, s, n, i, r, y.useQuaternion, o, d?.numTargets);
        }), u.channels.length && u.samplers.length && t.push(u);
      }
    }
  }
  static _AddAnimation(e, t, s, n, i, r, o, c, u, a, l, h, f) {
    const p = M._CreateNodeAnimation(s, n, r, l, h);
    let g, x, d, _, m, A, w;
    if (p) {
      if (f) {
        let I = 0, k = 0;
        const K = [];
        for (; p.inputs.length > 0; )
          k = p.inputs.shift(), I % f == 0 && K.push(k), I++;
        p.inputs = K;
      }
      const C = o[s.uniqueId];
      let y = p.inputs.length * 4;
      g = U._CreateBufferView(0, c.getByteOffset(), y, void 0, `${e}  keyframe data view`), u.push(g), p.inputs.forEach(function(I) {
        c.setFloat32(I);
      }), x = U._CreateAccessor(u.length - 1, `${e}  keyframes`, "SCALAR", 5126, p.inputs.length, null, [p.inputsMin], [p.inputsMax]), a.push(x), d = a.length - 1, m = p.outputs.length, y = U._GetDataAccessorElementCount(i) * 4 * p.outputs.length, g = U._CreateBufferView(0, c.getByteOffset(), y, void 0, `${e}  data view`), u.push(g), p.outputs.forEach(function(I) {
        I.forEach(function(k) {
          c.setFloat32(k);
        });
      }), x = U._CreateAccessor(u.length - 1, `${e}  data`, i, 5126, m, null, null, null), a.push(x), _ = a.length - 1, A = {
        interpolation: p.samplerInterpolation,
        input: d,
        output: _
      }, t.samplers.push(A), w = {
        sampler: t.samplers.length - 1,
        target: {
          node: C,
          path: r
        }
      }, t.channels.push(w);
    }
  }
  /**
   * Create a baked animation
   * @param babylonTransformNode BabylonJS mesh
   * @param animation BabylonJS animation corresponding to the BabylonJS mesh
   * @param animationChannelTargetPath animation target channel
   * @param minFrame minimum animation frame
   * @param maxFrame maximum animation frame
   * @param fps frames per second of the animation
   * @param sampleRate
   * @param inputs input key frames of the animation
   * @param outputs output key frame data of the animation
   * @param minMaxFrames
   * @param minMaxFrames.min
   * @param minMaxFrames.max
   * @param useQuaternion specifies if quaternions should be used
   */
  static _CreateBakedAnimation(e, t, s, n, i, r, o, c, u, a, l) {
    let h;
    const f = B.Identity();
    let p = null, g, x = null, d = null, _ = null, m = null, A = null;
    a.min = F.FloatRound(n / r);
    const w = t.getKeys();
    for (let C = 0, y = w.length; C < y; ++C) {
      if (A = null, d = w[C], C + 1 < y)
        if (_ = w[C + 1], d.value.equals && d.value.equals(_.value) || d.value === _.value)
          if (C === 0)
            A = d.frame;
          else
            continue;
        else
          A = _.frame;
      else {
        if (m = w[C - 1], d.value.equals && d.value.equals(m.value) || d.value === m.value)
          continue;
        A = i;
      }
      if (A)
        for (let I = d.frame; I <= A; I += o) {
          if (g = F.FloatRound(I / r), g === p)
            continue;
          p = g, x = g;
          const k = {
            key: 0,
            repeatCount: 0,
            loopMode: t.loopMode
          };
          h = t._interpolate(I, k), M._SetInterpolatedValue(e, h, g, t, s, f, c, u, l);
        }
    }
    x && (a.max = x);
  }
  static _ConvertFactorToVector3OrQuaternion(e, t, s, n, i) {
    const r = M._GetBasePositionRotationOrScale(t, n, i), o = s.targetProperty.split("."), c = o ? o[1] : "", u = i ? B.FromArray(r).normalize() : R.FromArray(r);
    switch (c) {
      case "x":
      case "y":
      case "z": {
        u[c] = e;
        break;
      }
      case "w": {
        u.w = e;
        break;
      }
      default:
        F.Error(`glTFAnimation: Unsupported component name "${c}"!`);
    }
    return u;
  }
  static _SetInterpolatedValue(e, t, s, n, i, r, o, c, u) {
    let a;
    if (o.push(s), i === "weights") {
      c.push([t]);
      return;
    }
    n.dataType === Q.ANIMATIONTYPE_FLOAT && (t = this._ConvertFactorToVector3OrQuaternion(t, e, n, i, u)), i === "rotation" ? (u ? r = t : (a = t, B.RotationYawPitchRollToRef(a.y, a.x, a.z, r)), c.push(r.asArray())) : (a = t, c.push(a.asArray()));
  }
  /**
   * Creates linear animation from the animation key frames
   * @param babylonTransformNode BabylonJS mesh
   * @param animation BabylonJS animation
   * @param animationChannelTargetPath The target animation channel
   * @param inputs Array to store the key frame times
   * @param outputs Array to store the key frame data
   * @param useQuaternion Specifies if quaternions are used in the animation
   */
  static _CreateLinearOrStepAnimation(e, t, s, n, i, r) {
    for (const o of t.getKeys())
      n.push(o.frame / t.framePerSecond), M._AddKeyframeValue(o, t, i, s, e, r);
  }
  /**
   * Creates cubic spline animation from the animation key frames
   * @param babylonTransformNode BabylonJS mesh
   * @param animation BabylonJS animation
   * @param animationChannelTargetPath The target animation channel
   * @param inputs Array to store the key frame times
   * @param outputs Array to store the key frame data
   * @param useQuaternion Specifies if quaternions are used in the animation
   */
  static _CreateCubicSplineAnimation(e, t, s, n, i, r) {
    t.getKeys().forEach(function(o) {
      n.push(o.frame / t.framePerSecond), M._AddSplineTangent(ne.INTANGENT, i, s, "CUBICSPLINE", o, r), M._AddKeyframeValue(o, t, i, s, e, r), M._AddSplineTangent(ne.OUTTANGENT, i, s, "CUBICSPLINE", o, r);
    });
  }
  static _GetBasePositionRotationOrScale(e, t, s) {
    let n;
    return t === "rotation" ? s ? n = (e.rotationQuaternion ?? B.Identity()).asArray() : n = (e.rotation ?? R.Zero()).asArray() : t === "translation" ? n = (e.position ?? R.Zero()).asArray() : n = (e.scaling ?? R.One()).asArray(), n;
  }
  /**
   * Adds a key frame value
   * @param keyFrame
   * @param animation
   * @param outputs
   * @param animationChannelTargetPath
   * @param babylonTransformNode
   * @param useQuaternion
   */
  static _AddKeyframeValue(e, t, s, n, i, r) {
    let o;
    const c = t.dataType;
    if (c === Q.ANIMATIONTYPE_VECTOR3) {
      let u = e.value.asArray();
      if (n === "rotation") {
        const a = R.FromArray(u);
        u = B.RotationYawPitchRoll(a.y, a.x, a.z).asArray();
      }
      s.push(u);
    } else if (c === Q.ANIMATIONTYPE_FLOAT) {
      if (n === "weights")
        s.push([e.value]);
      else if (o = this._ConvertFactorToVector3OrQuaternion(e.value, i, t, n, r), o) {
        if (n === "rotation") {
          const u = r ? o : B.RotationYawPitchRoll(o.y, o.x, o.z).normalize();
          s.push(u.asArray());
        }
        s.push(o.asArray());
      }
    } else c === Q.ANIMATIONTYPE_QUATERNION ? s.push(e.value.normalize().asArray()) : F.Error("glTFAnimation: Unsupported key frame values for animation!");
  }
  /**
   * @internal
   * Determine the interpolation based on the key frames
   * @param keyFrames
   * @param animationChannelTargetPath
   * @param useQuaternion
   */
  static _DeduceInterpolation(e, t, s) {
    let n, i = !1, r;
    if (t === "rotation" && !s)
      return { interpolationType: "LINEAR", shouldBakeAnimation: !0 };
    for (let o = 0, c = e.length; o < c; ++o)
      if (r = e[o], r.inTangent || r.outTangent)
        if (n) {
          if (n !== "CUBICSPLINE") {
            n = "LINEAR", i = !0;
            break;
          }
        } else
          n = "CUBICSPLINE";
      else if (n) {
        if (n === "CUBICSPLINE" || r.interpolation && r.interpolation === Ce.STEP && n !== "STEP") {
          n = "LINEAR", i = !0;
          break;
        }
      } else
        r.interpolation && r.interpolation === Ce.STEP ? n = "STEP" : n = "LINEAR";
    return n || (n = "LINEAR"), { interpolationType: n, shouldBakeAnimation: i };
  }
  /**
   * Adds an input tangent or output tangent to the output data
   * If an input tangent or output tangent is missing, it uses the zero vector or zero quaternion
   * @param tangentType Specifies which type of tangent to handle (inTangent or outTangent)
   * @param outputs The animation data by keyframe
   * @param animationChannelTargetPath The target animation channel
   * @param interpolation The interpolation type
   * @param keyFrame The key frame with the animation data
   * @param useQuaternion Specifies if quaternions are used
   */
  static _AddSplineTangent(e, t, s, n, i, r) {
    let o;
    const c = e === ne.INTANGENT ? i.inTangent : i.outTangent;
    if (n === "CUBICSPLINE") {
      if (s === "rotation")
        if (c)
          if (r)
            o = c.asArray();
          else {
            const u = c;
            o = B.RotationYawPitchRoll(u.y, u.x, u.z).asArray();
          }
        else
          o = [0, 0, 0, 0];
      else s === "weights" ? c ? o = [c] : o = [0] : c ? o = c.asArray() : o = [0, 0, 0];
      t.push(o);
    }
  }
  /**
   * Get the minimum and maximum key frames' frame values
   * @param keyFrames animation key frames
   * @returns the minimum and maximum key frame value
   */
  static _CalculateMinMaxKeyFrames(e) {
    let t = 1 / 0, s = -1 / 0;
    return e.forEach(function(n) {
      t = Math.min(t, n.frame), s = Math.max(s, n.frame);
    }), { min: t, max: s };
  }
}
class ce {
  /**
   * Initializes the glTF file object
   */
  constructor() {
    this.glTFFiles = {};
  }
  /**
   * Downloads the glTF data as files based on their names and data
   */
  downloadFiles() {
    function e(t, s) {
      return t.indexOf(s, t.length - s.length) !== -1;
    }
    for (const t in this.glTFFiles) {
      const s = document.createElement("a");
      document.body.appendChild(s), s.setAttribute("type", "hidden"), s.download = t;
      const n = this.glTFFiles[t];
      let i;
      e(t, ".glb") ? i = { type: "model/gltf-binary" } : e(t, ".bin") ? i = { type: "application/octet-stream" } : e(t, ".gltf") ? i = { type: "model/gltf+json" } : e(t, ".jpeg") || e(t, ".jpg") ? i = {
        type: "image/jpeg"
        /* ImageMimeType.JPEG */
      } : e(t, ".png") && (i = {
        type: "image/png"
        /* ImageMimeType.PNG */
      }), s.href = window.URL.createObjectURL(new Blob([n], i)), s.click();
    }
  }
}
function Je(E) {
  switch (E) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/avif":
      return ".avif";
  }
}
class v {
  constructor(e) {
    this._textureMap = {}, this._internalTextureToImage = {}, this._textureMap = {}, this._exporter = e;
  }
  /**
   * Specifies if two colors are approximately equal in value
   * @param color1 first color to compare to
   * @param color2 second color to compare to
   * @param epsilon threshold value
   * @returns boolean specifying if the colors are approximately equal in value
   */
  static _FuzzyEquals(e, t, s) {
    return b.WithinEpsilon(e.r, t.r, s) && b.WithinEpsilon(e.g, t.g, s) && b.WithinEpsilon(e.b, t.b, s);
  }
  /**
   * Gets the materials from a Babylon scene and converts them to glTF materials
   * @param exportMaterials
   * @param mimeType texture mime type
   * @param hasTextureCoords specifies if texture coordinates are present on the material
   * @returns promise that resolves after all materials have been converted
   */
  _convertMaterialsToGLTFAsync(e, t, s) {
    const n = [];
    return e.forEach((i) => {
      i.getClassName() === "StandardMaterial" ? n.push(this._convertStandardMaterialAsync(i, t, s)) : i.getClassName().indexOf("PBR") !== -1 ? n.push(this._convertPBRMaterialAsync(i, t, s)) : F.Warn(`Unsupported material type: ${i.name}`);
    }), Promise.all(n).then(() => {
    });
  }
  /**
   * Makes a copy of the glTF material without the texture parameters
   * @param originalMaterial original glTF material
   * @returns glTF material without texture parameters
   */
  _stripTexturesFromMaterial(e) {
    const t = {};
    if (e) {
      t.name = e.name, t.doubleSided = e.doubleSided, t.alphaMode = e.alphaMode, t.alphaCutoff = e.alphaCutoff, t.emissiveFactor = e.emissiveFactor;
      const s = e.pbrMetallicRoughness;
      s && (t.pbrMetallicRoughness = {}, t.pbrMetallicRoughness.baseColorFactor = s.baseColorFactor, t.pbrMetallicRoughness.metallicFactor = s.metallicFactor, t.pbrMetallicRoughness.roughnessFactor = s.roughnessFactor);
    }
    return t;
  }
  /**
   * Specifies if the material has any texture parameters present
   * @param material glTF Material
   * @returns boolean specifying if texture parameters are present
   */
  _hasTexturesPresent(e) {
    if (e.emissiveTexture || e.normalTexture || e.occlusionTexture)
      return !0;
    const t = e.pbrMetallicRoughness;
    if (t && (t.baseColorTexture || t.metallicRoughnessTexture))
      return !0;
    if (e.extensions)
      for (const s in e.extensions) {
        const n = e.extensions[s];
        if (n)
          return n.hasTextures?.();
      }
    return !1;
  }
  _getTextureInfo(e) {
    if (e) {
      const t = e.uid;
      if (t in this._textureMap)
        return this._textureMap[t];
    }
    return null;
  }
  /**
   * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material
   * @param babylonStandardMaterial
   * @returns glTF Metallic Roughness Material representation
   */
  _convertToGLTFPBRMetallicRoughness(e) {
    const t = new W(0, 1), s = new W(0, 0.1), n = new W(0, 0.1), i = new W(1300, 0.1);
    function r(f, p, g, x, d) {
      return (1 - f) * (1 - f) * (1 - f) * p + 3 * (1 - f) * (1 - f) * f * g + 3 * (1 - f) * f * f * x + f * f * f * d;
    }
    function o(f) {
      const p = Math.pow(f / i.x, 0.333333);
      return r(p, t.y, s.y, n.y, i.y);
    }
    const c = e.diffuseColor.toLinearSpace(e.getScene().getEngine().useExactSrgbConversions).scale(0.5), u = e.alpha, a = b.Clamp(e.specularPower, 0, v._MaxSpecularPower), l = o(a);
    return {
      baseColorFactor: [c.r, c.g, c.b, u],
      metallicFactor: 0,
      roughnessFactor: l
    };
  }
  /**
   * Computes the metallic factor
   * @param diffuse diffused value
   * @param specular specular value
   * @param oneMinusSpecularStrength one minus the specular strength
   * @returns metallic value
   */
  static _SolveMetallic(e, t, s) {
    if (t < this._DielectricSpecular.r)
      return this._DielectricSpecular, 0;
    const n = this._DielectricSpecular.r, i = e * s / (1 - this._DielectricSpecular.r) + t - 2 * this._DielectricSpecular.r, r = this._DielectricSpecular.r - t, o = i * i - 4 * n * r;
    return b.Clamp((-i + Math.sqrt(o)) / (2 * n), 0, 1);
  }
  /**
   * Sets the glTF alpha mode to a glTF material from the Babylon Material
   * @param glTFMaterial glTF material
   * @param babylonMaterial Babylon material
   */
  static _SetAlphaMode(e, t) {
    t.needAlphaBlending() ? e.alphaMode = "BLEND" : t.needAlphaTesting() && (e.alphaMode = "MASK", e.alphaCutoff = t.alphaCutOff);
  }
  /**
   * Converts a Babylon Standard Material to a glTF Material
   * @param babylonStandardMaterial BJS Standard Material
   * @param mimeType mime type to use for the textures
   * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
   * @returns promise, resolved with the material
   */
  _convertStandardMaterialAsync(e, t, s) {
    const n = this._exporter._materialMap, i = this._exporter._materials, r = [], o = this._convertToGLTFPBRMetallicRoughness(e), c = { name: e.name };
    if (e.backFaceCulling != null && !e.backFaceCulling && (e.twoSidedLighting || F.Warn(e.name + ": Back-face culling disabled and two-sided lighting disabled is not supported in glTF."), c.doubleSided = !0), s) {
      e.diffuseTexture && r.push(this._exportTextureAsync(e.diffuseTexture, t).then((a) => {
        a && (o.baseColorTexture = a);
      }));
      const u = e.bumpTexture;
      u && r.push(this._exportTextureAsync(u, t).then((a) => {
        a && (c.normalTexture = a, u.level !== 1 && (c.normalTexture.scale = u.level));
      })), e.emissiveTexture && (c.emissiveFactor = [1, 1, 1], r.push(this._exportTextureAsync(e.emissiveTexture, t).then((a) => {
        a && (c.emissiveTexture = a);
      }))), e.ambientTexture && r.push(this._exportTextureAsync(e.ambientTexture, t).then((a) => {
        if (a) {
          const l = {
            index: a.index
          };
          c.occlusionTexture = l;
        }
      }));
    }
    return (e.alpha < 1 || e.opacityTexture) && (e.alphaMode === J.ALPHA_COMBINE ? c.alphaMode = "BLEND" : F.Warn(e.name + ": glTF 2.0 does not support alpha mode: " + e.alphaMode.toString())), e.emissiveColor && !v._FuzzyEquals(e.emissiveColor, z.Black(), v._Epsilon) && (c.emissiveFactor = e.emissiveColor.asArray()), c.pbrMetallicRoughness = o, v._SetAlphaMode(c, e), i.push(c), n[e.uniqueId] = i.length - 1, this._finishMaterial(r, c, e, t);
  }
  _finishMaterial(e, t, s, n) {
    return Promise.all(e).then(() => {
      const i = this._exporter._extensionsPostExportMaterialAdditionalTextures("exportMaterial", t, s);
      let r = null;
      for (const o of i)
        r || (r = []), r.push(this._exportTextureAsync(o, n));
      return r || (r = [Promise.resolve(null)]), Promise.all(r).then(() => {
        const o = this._exporter._extensionsPostExportMaterialAsync("exportMaterial", t, s);
        return o ? o.then(() => t) : t;
      });
    });
  }
  /**
   * Converts an image typed array buffer to a base64 image
   * @param buffer typed array buffer
   * @param width width of the image
   * @param height height of the image
   * @param mimeType mimetype of the image
   * @returns base64 image string
   */
  async _getImageDataAsync(e, t, s, n) {
    const i = J.TEXTURETYPE_UNSIGNED_INT, r = this._exporter._babylonScene, o = r.getEngine(), c = o.createRawTexture(e, t, s, J.TEXTUREFORMAT_RGBA, !1, !0, P.NEAREST_SAMPLINGMODE, null, i);
    await ae.ApplyPostProcess("pass", c, r, i, J.TEXTURE_NEAREST_SAMPLINGMODE, J.TEXTUREFORMAT_RGBA);
    const u = await o._readTexturePixels(c, t, s);
    return await We.DumpDataAsync(t, s, u, n, void 0, !0, !0);
  }
  /**
   * Generates a white texture based on the specified width and height
   * @param width width of the texture in pixels
   * @param height height of the texture in pixels
   * @param scene babylonjs scene
   * @returns white texture
   */
  _createWhiteTexture(e, t, s) {
    const n = new Uint8Array(e * t * 4);
    for (let r = 0; r < n.length; r = r + 4)
      n[r] = n[r + 1] = n[r + 2] = n[r + 3] = 255;
    return je.CreateRGBATexture(n, e, t, s);
  }
  /**
   * Resizes the two source textures to the same dimensions.  If a texture is null, a default white texture is generated.  If both textures are null, returns null
   * @param texture1 first texture to resize
   * @param texture2 second texture to resize
   * @param scene babylonjs scene
   * @returns resized textures or null
   */
  _resizeTexturesToSameDimensions(e, t, s) {
    const n = e ? e.getSize() : { width: 0, height: 0 }, i = t ? t.getSize() : { width: 0, height: 0 };
    let r, o;
    return n.width < i.width ? (e && e instanceof P ? r = ae.CreateResizedCopy(e, i.width, i.height, !0) : r = this._createWhiteTexture(i.width, i.height, s), o = t) : n.width > i.width ? (t && t instanceof P ? o = ae.CreateResizedCopy(t, n.width, n.height, !0) : o = this._createWhiteTexture(n.width, n.height, s), r = e) : (r = e, o = t), {
      texture1: r,
      texture2: o
    };
  }
  /**
   * Converts an array of pixels to a Float32Array
   * Throws an error if the pixel format is not supported
   * @param pixels - array buffer containing pixel values
   * @returns Float32 of pixels
   */
  _convertPixelArrayToFloat32(e) {
    if (e instanceof Uint8Array) {
      const t = e.length, s = new Float32Array(e.length);
      for (let n = 0; n < t; ++n)
        s[n] = e[n] / 255;
      return s;
    } else {
      if (e instanceof Float32Array)
        return e;
      throw new Error("Unsupported pixel format!");
    }
  }
  /**
   * Convert Specular Glossiness Textures to Metallic Roughness
   * See link below for info on the material conversions from PBR Metallic/Roughness and Specular/Glossiness
   * @link https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness/examples/convert-between-workflows-.js/babylon.pbrUtilities.js
   * @param diffuseTexture texture used to store diffuse information
   * @param specularGlossinessTexture texture used to store specular and glossiness information
   * @param factors specular glossiness material factors
   * @param mimeType the mime type to use for the texture
   * @returns pbr metallic roughness interface or null
   */
  async _convertSpecularGlossinessTexturesToMetallicRoughnessAsync(e, t, s, n) {
    const i = new Array();
    if (!(e || t))
      return Promise.reject("_ConvertSpecularGlosinessTexturesToMetallicRoughness: diffuse and specular glossiness textures are not defined!");
    const r = e ? e.getScene() : t ? t.getScene() : null;
    if (r) {
      const o = this._resizeTexturesToSameDimensions(e, t, r), c = o.texture1?.getSize();
      let u, a;
      const l = c.width, h = c.height, f = await o.texture1.readPixels(), p = await o.texture2.readPixels();
      if (f)
        u = this._convertPixelArrayToFloat32(f);
      else
        return Promise.reject("Failed to retrieve pixels from diffuse texture!");
      if (p)
        a = this._convertPixelArrayToFloat32(p);
      else
        return Promise.reject("Failed to retrieve pixels from specular glossiness texture!");
      const g = a.byteLength, x = new Uint8Array(g), d = new Uint8Array(g), _ = 4, m = z.Black();
      let A = 0, w = 0;
      for (let k = 0; k < h; ++k)
        for (let K = 0; K < l; ++K) {
          const S = (l * k + K) * _, q = new z(u[S], u[S + 1], u[S + 2]).toLinearSpace(r.getEngine().useExactSrgbConversions).multiply(s.diffuseColor), $ = new z(a[S], a[S + 1], a[S + 2]).toLinearSpace(r.getEngine().useExactSrgbConversions).multiply(s.specularColor), N = a[S + 3] * s.glossiness, Y = {
            diffuseColor: q,
            specularColor: $,
            glossiness: N
          }, H = this._convertSpecularGlossinessToMetallicRoughness(Y);
          m.r = Math.max(m.r, H.baseColor.r), m.g = Math.max(m.g, H.baseColor.g), m.b = Math.max(m.b, H.baseColor.b), A = Math.max(A, H.metallic), w = Math.max(w, H.roughness), d[S] = H.baseColor.r * 255, d[S + 1] = H.baseColor.g * 255, d[S + 2] = H.baseColor.b * 255, d[S + 3] = o.texture1.hasAlpha ? u[S + 3] * 255 : 255, x[S] = 0, x[S + 1] = H.roughness * 255, x[S + 2] = H.metallic * 255, x[S + 3] = 255;
        }
      const C = {
        baseColor: m,
        metallic: A,
        roughness: w
      };
      let y = !1, I = !1;
      for (let k = 0; k < h; ++k)
        for (let K = 0; K < l; ++K) {
          const S = (l * k + K) * _;
          d[S] /= C.baseColor.r > v._Epsilon ? C.baseColor.r : 1, d[S + 1] /= C.baseColor.g > v._Epsilon ? C.baseColor.g : 1, d[S + 2] /= C.baseColor.b > v._Epsilon ? C.baseColor.b : 1;
          const $ = z.FromInts(d[S], d[S + 1], d[S + 2]).toGammaSpace(r.getEngine().useExactSrgbConversions);
          d[S] = $.r * 255, d[S + 1] = $.g * 255, d[S + 2] = $.b * 255, v._FuzzyEquals($, z.White(), v._Epsilon) || (I = !0), x[S + 1] /= C.roughness > v._Epsilon ? C.roughness : 1, x[S + 2] /= C.metallic > v._Epsilon ? C.metallic : 1;
          const N = z.FromInts(255, x[S + 1], x[S + 2]);
          v._FuzzyEquals(N, z.White(), v._Epsilon) || (y = !0);
        }
      return y && i.push(this._getImageDataAsync(x, l, h, n).then((k) => {
        C.metallicRoughnessTextureData = k;
      })), I && i.push(this._getImageDataAsync(d, l, h, n).then((k) => {
        C.baseColorTextureData = k;
      })), Promise.all(i).then(() => C);
    } else
      return Promise.reject("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Scene from textures is missing!");
  }
  /**
   * Converts specular glossiness material properties to metallic roughness
   * @param specularGlossiness interface with specular glossiness material properties
   * @returns interface with metallic roughness material properties
   */
  _convertSpecularGlossinessToMetallicRoughness(e) {
    const t = this._getPerceivedBrightness(e.diffuseColor), s = this._getPerceivedBrightness(e.specularColor), n = 1 - this._getMaxComponent(e.specularColor), i = v._SolveMetallic(t, s, n), r = e.diffuseColor.scale(n / (1 - v._DielectricSpecular.r) / Math.max(1 - i, v._Epsilon)), o = e.specularColor.subtract(v._DielectricSpecular.scale(1 - i)).scale(1 / Math.max(i, v._Epsilon));
    let c = z.Lerp(r, o, i * i);
    return c = c.clampToRef(0, 1, c), {
      baseColor: c,
      metallic: i,
      roughness: 1 - e.glossiness
    };
  }
  /**
   * Calculates the surface reflectance, independent of lighting conditions
   * @param color Color source to calculate brightness from
   * @returns number representing the perceived brightness, or zero if color is undefined
   */
  _getPerceivedBrightness(e) {
    return e ? Math.sqrt(0.299 * e.r * e.r + 0.587 * e.g * e.g + 0.114 * e.b * e.b) : 0;
  }
  /**
   * Returns the maximum color component value
   * @param color
   * @returns maximum color component value, or zero if color is null or undefined
   */
  _getMaxComponent(e) {
    return e ? Math.max(e.r, Math.max(e.g, e.b)) : 0;
  }
  /**
   * Convert a PBRMaterial (Metallic/Roughness) to Metallic Roughness factors
   * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
   * @param mimeType mime type to use for the textures
   * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
   * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
   * @returns glTF PBR Metallic Roughness factors
   */
  _convertMetalRoughFactorsToMetallicRoughnessAsync(e, t, s, n) {
    const i = [], r = e._albedoColor, o = e._metallic, c = e._roughness, u = {
      baseColor: r,
      metallic: o,
      roughness: c
    };
    if (n) {
      e._albedoTexture && i.push(this._exportTextureAsync(e._albedoTexture, t).then((h) => {
        h && (s.baseColorTexture = h);
      }));
      const l = e._metallicTexture;
      l && i.push(this._exportTextureAsync(l, t).then((h) => {
        h && (s.metallicRoughnessTexture = h);
      }));
    }
    return Promise.all(i).then(() => u);
  }
  _getTextureSampler(e) {
    const t = {};
    if (!e || !(e instanceof P))
      return t;
    const s = this._getGLTFTextureWrapMode(e.wrapU);
    s !== 10497 && (t.wrapS = s);
    const n = this._getGLTFTextureWrapMode(e.wrapV);
    switch (n !== 10497 && (t.wrapT = n), e.samplingMode) {
      case P.LINEAR_LINEAR: {
        t.magFilter = 9729, t.minFilter = 9729;
        break;
      }
      case P.LINEAR_NEAREST: {
        t.magFilter = 9729, t.minFilter = 9728;
        break;
      }
      case P.NEAREST_LINEAR: {
        t.magFilter = 9728, t.minFilter = 9729;
        break;
      }
      case P.NEAREST_LINEAR_MIPLINEAR: {
        t.magFilter = 9728, t.minFilter = 9987;
        break;
      }
      case P.NEAREST_NEAREST: {
        t.magFilter = 9728, t.minFilter = 9728;
        break;
      }
      case P.NEAREST_LINEAR_MIPNEAREST: {
        t.magFilter = 9728, t.minFilter = 9985;
        break;
      }
      case P.LINEAR_NEAREST_MIPNEAREST: {
        t.magFilter = 9729, t.minFilter = 9984;
        break;
      }
      case P.LINEAR_NEAREST_MIPLINEAR: {
        t.magFilter = 9729, t.minFilter = 9986;
        break;
      }
      case P.NEAREST_NEAREST_MIPLINEAR: {
        t.magFilter = 9728, t.minFilter = 9986;
        break;
      }
      case P.LINEAR_LINEAR_MIPLINEAR: {
        t.magFilter = 9729, t.minFilter = 9987;
        break;
      }
      case P.LINEAR_LINEAR_MIPNEAREST: {
        t.magFilter = 9729, t.minFilter = 9985;
        break;
      }
      case P.NEAREST_NEAREST_MIPNEAREST: {
        t.magFilter = 9728, t.minFilter = 9984;
        break;
      }
    }
    return t;
  }
  _getGLTFTextureWrapMode(e) {
    switch (e) {
      case P.WRAP_ADDRESSMODE:
        return 10497;
      case P.CLAMP_ADDRESSMODE:
        return 33071;
      case P.MIRROR_ADDRESSMODE:
        return 33648;
      default:
        return F.Error(`Unsupported Texture Wrap Mode ${e}!`), 10497;
    }
  }
  /**
   * Convert a PBRMaterial (Specular/Glossiness) to Metallic Roughness factors
   * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
   * @param mimeType mime type to use for the textures
   * @param pbrMetallicRoughness glTF PBR Metallic Roughness interface
   * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
   * @returns glTF PBR Metallic Roughness factors
   */
  _convertSpecGlossFactorsToMetallicRoughnessAsync(e, t, s, n) {
    return Promise.resolve().then(() => {
      const i = {
        diffuseColor: e._albedoColor,
        specularColor: e._reflectivityColor,
        glossiness: e._microSurface
      }, r = e._albedoTexture, o = e._reflectivityTexture, c = e._useMicroSurfaceFromReflectivityMapAlpha;
      if (o && !c)
        return Promise.reject("_ConvertPBRMaterial: Glossiness values not included in the reflectivity texture are currently not supported");
      if ((r || o) && n) {
        const u = this._exportTextureSampler(r || o);
        return this._convertSpecularGlossinessTexturesToMetallicRoughnessAsync(r, o, i, t).then((a) => {
          const l = this._exporter._textures;
          if (a.baseColorTextureData) {
            const h = this._exportImage(`baseColor${l.length}`, t, a.baseColorTextureData);
            s.baseColorTexture = this._exportTextureInfo(h, u, r?.coordinatesIndex);
          }
          if (a.metallicRoughnessTextureData) {
            const h = this._exportImage(`metallicRoughness${l.length}`, t, a.metallicRoughnessTextureData);
            s.metallicRoughnessTexture = this._exportTextureInfo(h, u, o?.coordinatesIndex);
          }
          return a;
        });
      } else
        return this._convertSpecularGlossinessToMetallicRoughness(i);
    });
  }
  /**
   * Converts a Babylon PBR Base Material to a glTF Material
   * @param babylonPBRMaterial BJS PBR Base Material
   * @param mimeType mime type to use for the textures
   * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
   * @returns async glTF Material representation
   */
  _convertPBRMaterialAsync(e, t, s) {
    const n = {}, i = {
      name: e.name
    };
    if (e.isMetallicWorkflow()) {
      const o = e._albedoColor, c = e.alpha;
      return o && (n.baseColorFactor = [o.r, o.g, o.b, c]), this._convertMetalRoughFactorsToMetallicRoughnessAsync(e, t, n, s).then((u) => this._setMetallicRoughnessPbrMaterial(u, e, i, n, t, s));
    } else
      return this._convertSpecGlossFactorsToMetallicRoughnessAsync(e, t, n, s).then((o) => this._setMetallicRoughnessPbrMaterial(o, e, i, n, t, s));
  }
  _setMetallicRoughnessPbrMaterial(e, t, s, n, i, r) {
    const o = this._exporter._materialMap, c = this._exporter._materials, u = [];
    if (e) {
      if (v._SetAlphaMode(s, t), v._FuzzyEquals(e.baseColor, z.White(), v._Epsilon) && t.alpha >= v._Epsilon || (n.baseColorFactor = [e.baseColor.r, e.baseColor.g, e.baseColor.b, t.alpha]), e.metallic != null && e.metallic !== 1 && (n.metallicFactor = e.metallic), e.roughness != null && e.roughness !== 1 && (n.roughnessFactor = e.roughness), t.backFaceCulling != null && !t.backFaceCulling && (t._twoSidedLighting || F.Warn(t.name + ": Back-face culling disabled and two-sided lighting disabled is not supported in glTF."), s.doubleSided = !0), r) {
        const l = t._bumpTexture;
        if (l) {
          const p = this._exportTextureAsync(l, i).then((g) => {
            g && (s.normalTexture = g, l.level !== 1 && (s.normalTexture.scale = l.level));
          });
          u.push(p);
        }
        const h = t._ambientTexture;
        if (h) {
          const p = this._exportTextureAsync(h, i).then((g) => {
            if (g) {
              const x = {
                index: g.index,
                texCoord: g.texCoord,
                extensions: g.extensions
              };
              s.occlusionTexture = x;
              const d = t._ambientTextureStrength;
              d && (x.strength = d);
            }
          });
          u.push(p);
        }
        const f = t._emissiveTexture;
        if (f) {
          const p = this._exportTextureAsync(f, i).then((g) => {
            g && (s.emissiveTexture = g);
          });
          u.push(p);
        }
      }
      const a = t._emissiveColor;
      v._FuzzyEquals(a, z.Black(), v._Epsilon) || (s.emissiveFactor = a.asArray()), s.pbrMetallicRoughness = n, c.push(s), o[t.uniqueId] = c.length - 1;
    }
    return this._finishMaterial(u, s, t, i);
  }
  _getPixelsFromTexture(e) {
    return e.textureType === J.TEXTURETYPE_UNSIGNED_INT, e.readPixels();
  }
  /**
   * Extracts a texture from a Babylon texture into file data and glTF data
   * @param babylonTexture Babylon texture to extract
   * @param mimeType Mime Type of the babylonTexture
   * @returns glTF texture info, or null if the texture format is not supported
   */
  _exportTextureAsync(e, t) {
    const s = this._exporter._extensionsPreExportTextureAsync("exporter", e, t);
    return s ? s.then((n) => n ? this._exportTextureInfoAsync(n, t) : this._exportTextureInfoAsync(e, t)) : this._exportTextureInfoAsync(e, t);
  }
  async _exportTextureInfoAsync(e, t) {
    const s = e.uid;
    if (!(s in this._textureMap)) {
      const n = await this._getPixelsFromTexture(e);
      if (!n)
        return null;
      const i = this._exportTextureSampler(e), r = e.mimeType;
      if (r)
        switch (r) {
          case "image/jpeg":
          case "image/png":
          case "image/webp":
            t = r;
            break;
          default:
            F.Warn(`Unsupported media type: ${r}`);
            break;
        }
      const o = this._internalTextureToImage, c = e.getInternalTexture().uniqueId;
      o[c] || (o[c] = {});
      let u = o[c][t];
      if (u === void 0) {
        const l = e.getSize();
        u = (async () => {
          const h = await this._getImageDataAsync(n, l.width, l.height, t);
          return this._exportImage(e.name, t, h);
        })(), o[c][t] = u;
      }
      const a = this._exportTextureInfo(await u, i, e.coordinatesIndex);
      this._textureMap[s] = a, this._exporter._extensionsPostExportTextures("exporter", this._textureMap[s], e);
    }
    return this._textureMap[s];
  }
  _exportImage(e, t, s) {
    const n = this._exporter._imageData, i = e.replace(/\.\/|\/|\.\\|\\/g, "_"), r = Je(t);
    let o = i + r;
    o in n && (o = `${i}_${F.RandomId()}${r}`), n[o] = {
      data: s,
      mimeType: t
    };
    const c = this._exporter._images;
    return c.push({
      name: e,
      uri: o
    }), c.length - 1;
  }
  _exportTextureInfo(e, t, s) {
    const n = this._exporter._textures;
    let i = n.findIndex((o) => o.sampler == t && o.source === e);
    i === -1 && (i = n.length, n.push({
      source: e,
      sampler: t
    }));
    const r = { index: i };
    return s && (r.texCoord = s), r;
  }
  _exportTextureSampler(e) {
    const t = this._getTextureSampler(e), s = this._exporter._samplers, n = s.findIndex((i) => i.minFilter === t.minFilter && i.magFilter === t.magFilter && i.wrapS === t.wrapS && i.wrapT === t.wrapT);
    return n !== -1 ? n : (s.push(t), s.length - 1);
  }
}
v._DielectricSpecular = new z(0.04, 0.04, 0.04);
v._MaxSpecularPower = 1024;
v._Epsilon = 1e-6;
const Re = ie.Compose(new R(-1, 1, 1), B.Identity(), R.Zero()), Ze = new B(0, 1, 0, 0);
function be(E, e) {
  if (!(E instanceof Ae))
    return !1;
  if (e) {
    if (!E.getWorldMatrix().isIdentity())
      return !1;
  } else if (!E.getWorldMatrix().multiplyToRef(Re, L.Matrix[0]).isIdentity())
    return !1;
  return !(E instanceof G && E.geometry || E instanceof se && E.sourceMesh.geometry);
}
function et(E) {
  const e = R.FromArrayToRef(E.translation || [0, 0, 0], 0, L.Vector3[0]), t = B.FromArrayToRef(E.rotation || [0, 0, 0, 1], 0, L.Quaternion[0]), s = R.FromArrayToRef(E.scale || [1, 1, 1], 0, L.Vector3[1]);
  ie.ComposeToRef(s, t, e, L.Matrix[0]).multiplyToRef(Re, L.Matrix[0]).decompose(s, t, e), e.equalsToFloats(0, 0, 0) ? delete E.translation : E.translation = e.asArray(), B.IsIdentity(t) ? delete E.rotation : E.rotation = t.asArray(), s.equalsToFloats(1, 1, 1) ? delete E.scale : E.scale = s.asArray();
}
class V {
  _applyExtension(e, t, s, n) {
    if (s >= t.length)
      return Promise.resolve(e);
    const i = n(t[s], e);
    return i ? i.then((r) => this._applyExtension(r, t, s + 1, n)) : this._applyExtension(e, t, s + 1, n);
  }
  _applyExtensions(e, t) {
    const s = [];
    for (const n of V._ExtensionNames)
      s.push(this._extensions[n]);
    return this._applyExtension(e, s, 0, t);
  }
  _extensionsPreExportTextureAsync(e, t, s) {
    return this._applyExtensions(t, (n, i) => n.preExportTextureAsync && n.preExportTextureAsync(e, i, s));
  }
  _extensionsPostExportMeshPrimitiveAsync(e, t, s, n) {
    return this._applyExtensions(t, (i, r) => i.postExportMeshPrimitiveAsync && i.postExportMeshPrimitiveAsync(e, r, s, n));
  }
  _extensionsPostExportNodeAsync(e, t, s, n, i) {
    return this._applyExtensions(t, (r, o) => r.postExportNodeAsync && r.postExportNodeAsync(e, o, s, n, i));
  }
  _extensionsPostExportMaterialAsync(e, t, s) {
    return this._applyExtensions(t, (n, i) => n.postExportMaterialAsync && n.postExportMaterialAsync(e, i, s));
  }
  _extensionsPostExportMaterialAdditionalTextures(e, t, s) {
    const n = [];
    for (const i of V._ExtensionNames) {
      const r = this._extensions[i];
      r.postExportMaterialAdditionalTextures && n.push(...r.postExportMaterialAdditionalTextures(e, t, s));
    }
    return n;
  }
  _extensionsPostExportTextures(e, t, s) {
    for (const n of V._ExtensionNames) {
      const i = this._extensions[n];
      i.postExportTexture && i.postExportTexture(e, t, s);
    }
  }
  _forEachExtensions(e) {
    for (const t of V._ExtensionNames) {
      const s = this._extensions[t];
      s.enabled && e(s);
    }
  }
  _extensionsOnExporting() {
    this._forEachExtensions((e) => {
      e.wasUsed && (this._glTF.extensionsUsed == null && (this._glTF.extensionsUsed = []), this._glTF.extensionsUsed.indexOf(e.name) === -1 && this._glTF.extensionsUsed.push(e.name), e.required && (this._glTF.extensionsRequired == null && (this._glTF.extensionsRequired = []), this._glTF.extensionsRequired.indexOf(e.name) === -1 && this._glTF.extensionsRequired.push(e.name)), this._glTF.extensions == null && (this._glTF.extensions = {}), e.onExporting && e.onExporting());
    });
  }
  /**
   * Load glTF serializer extensions
   */
  _loadExtensions() {
    for (const e of V._ExtensionNames) {
      const t = V._ExtensionFactories[e](this);
      this._extensions[e] = t;
    }
  }
  /**
   * Creates a glTF Exporter instance, which can accept optional exporter options
   * @param babylonScene Babylon scene object
   * @param options Options to modify the behavior of the exporter
   */
  constructor(e, t) {
    this._extensions = {}, this._glTF = {
      asset: { generator: `Babylon.js v${He.Version}`, version: "2.0" }
    }, e = e || $e.LastCreatedScene, e && (this._babylonScene = e, this._bufferViews = [], this._accessors = [], this._meshes = [], this._scenes = [], this._cameras = [], this._nodes = [], this._images = [], this._materials = [], this._materialMap = [], this._textures = [], this._samplers = [], this._skins = [], this._animations = [], this._imageData = {}, this._orderedImageData = [], this._options = t || {}, this._animationSampleRate = this._options.animationSampleRate || 1 / 60, this._glTFMaterialExporter = new v(this), this._loadExtensions());
  }
  dispose() {
    for (const e in this._extensions)
      this._extensions[e].dispose();
  }
  get options() {
    return this._options;
  }
  /**
   * Registers a glTF exporter extension
   * @param name Name of the extension to export
   * @param factory The factory function that creates the exporter extension
   */
  static RegisterExtension(e, t) {
    V.UnregisterExtension(e) && F.Warn(`Extension with the name ${e} already exists`), V._ExtensionFactories[e] = t, V._ExtensionNames.push(e);
  }
  /**
   * Un-registers an exporter extension
   * @param name The name fo the exporter extension
   * @returns A boolean indicating whether the extension has been un-registered
   */
  static UnregisterExtension(e) {
    if (!V._ExtensionFactories[e])
      return !1;
    delete V._ExtensionFactories[e];
    const t = V._ExtensionNames.indexOf(e);
    return t !== -1 && V._ExtensionNames.splice(t, 1), !0;
  }
  _reorderIndicesBasedOnPrimitiveMode(e, t, s, n, i) {
    switch (t) {
      case O.TriangleFillMode: {
        n || (n = 0);
        for (let r = e.indexStart, o = e.indexStart + e.indexCount; r < o; r = r + 3) {
          const c = n + r * 4, u = i.getUInt32(c + 4), a = i.getUInt32(c + 8);
          i.setUInt32(a, c + 4), i.setUInt32(u, c + 8);
        }
        break;
      }
      case O.TriangleFanDrawMode: {
        for (let r = e.indexStart + e.indexCount - 1, o = e.indexStart; r >= o; --r)
          i.setUInt32(s[r], n), n += 4;
        break;
      }
      case O.TriangleStripDrawMode: {
        e.indexCount >= 3 && (i.setUInt32(s[e.indexStart + 2], n + 4), i.setUInt32(s[e.indexStart + 1], n + 8));
        break;
      }
    }
  }
  /**
   * Reorders the vertex attribute data based on the primitive mode.  This is necessary when indices are not available and the winding order is
   * clock-wise during export to glTF
   * @param submesh BabylonJS submesh
   * @param primitiveMode Primitive mode of the mesh
   * @param vertexBufferKind The type of vertex attribute
   * @param meshAttributeArray The vertex attribute data
   * @param byteOffset The offset to the binary data
   * @param binaryWriter The binary data for the glTF file
   */
  _reorderVertexAttributeDataBasedOnPrimitiveMode(e, t, s, n, i, r) {
    switch (t) {
      case O.TriangleFillMode: {
        this._reorderTriangleFillMode(e, s, n, i, r);
        break;
      }
      case O.TriangleStripDrawMode: {
        this._reorderTriangleStripDrawMode(e, s, n, i, r);
        break;
      }
      case O.TriangleFanDrawMode: {
        this._reorderTriangleFanMode(e, s, n, i, r);
        break;
      }
    }
  }
  /**
   * Reorders the vertex attributes in the correct triangle mode order .  This is necessary when indices are not available and the winding order is
   * clock-wise during export to glTF
   * @param submesh BabylonJS submesh
   * @param vertexBufferKind The type of vertex attribute
   * @param meshAttributeArray The vertex attribute data
   * @param byteOffset The offset to the binary data
   * @param binaryWriter The binary data for the glTF file
   */
  _reorderTriangleFillMode(e, t, s, n, i) {
    const r = this._getVertexBufferFromMesh(t, e.getMesh());
    if (r) {
      const o = r.byteStride / T.GetTypeByteLength(r.type);
      if (e.verticesCount % 3 !== 0)
        F.Error("The submesh vertices for the triangle fill mode is not divisible by 3!");
      else {
        const c = [];
        let u = 0;
        switch (t) {
          case T.PositionKind:
          case T.NormalKind: {
            for (let a = e.verticesStart; a < e.verticesStart + e.verticesCount; a = a + 3)
              u = a * o, c.push(R.FromArray(s, u)), c.push(R.FromArray(s, u + 2 * o)), c.push(R.FromArray(s, u + o));
            break;
          }
          case T.TangentKind: {
            for (let a = e.verticesStart; a < e.verticesStart + e.verticesCount; a = a + 3)
              u = a * o, c.push(D.FromArray(s, u)), c.push(D.FromArray(s, u + 2 * o)), c.push(D.FromArray(s, u + o));
            break;
          }
          case T.ColorKind: {
            const a = r.getSize();
            for (let l = e.verticesStart; l < e.verticesStart + e.verticesCount; l = l + a)
              u = l * o, a === 4 ? (c.push(D.FromArray(s, u)), c.push(D.FromArray(s, u + 2 * o)), c.push(D.FromArray(s, u + o))) : (c.push(R.FromArray(s, u)), c.push(R.FromArray(s, u + 2 * o)), c.push(R.FromArray(s, u + o)));
            break;
          }
          case T.UVKind:
          case T.UV2Kind: {
            for (let a = e.verticesStart; a < e.verticesStart + e.verticesCount; a = a + 3)
              u = a * o, c.push(W.FromArray(s, u)), c.push(W.FromArray(s, u + 2 * o)), c.push(W.FromArray(s, u + o));
            break;
          }
          default:
            F.Error(`Unsupported Vertex Buffer type: ${t}`);
        }
        this._writeVertexAttributeData(c, n, t, i);
      }
    } else
      F.Warn(`reorderTriangleFillMode: Vertex Buffer Kind ${t} not present!`);
  }
  /**
   * Reorders the vertex attributes in the correct triangle strip order.  This is necessary when indices are not available and the winding order is
   * clock-wise during export to glTF
   * @param submesh BabylonJS submesh
   * @param vertexBufferKind The type of vertex attribute
   * @param meshAttributeArray The vertex attribute data
   * @param byteOffset The offset to the binary data
   * @param binaryWriter The binary data for the glTF file
   */
  _reorderTriangleStripDrawMode(e, t, s, n, i) {
    const r = this._getVertexBufferFromMesh(t, e.getMesh());
    if (r) {
      const o = r.byteStride / T.GetTypeByteLength(r.type), c = [];
      let u = 0;
      switch (t) {
        case T.PositionKind:
        case T.NormalKind: {
          u = e.verticesStart, c.push(R.FromArray(s, u + 2 * o)), c.push(R.FromArray(s, u + o));
          break;
        }
        case T.TangentKind: {
          for (let a = e.verticesStart + e.verticesCount - 1; a >= e.verticesStart; --a)
            u = a * o, c.push(D.FromArray(s, u));
          break;
        }
        case T.ColorKind: {
          for (let a = e.verticesStart + e.verticesCount - 1; a >= e.verticesStart; --a)
            u = a * o, r.getSize() === 4 ? c.push(D.FromArray(s, u)) : c.push(R.FromArray(s, u));
          break;
        }
        case T.UVKind:
        case T.UV2Kind: {
          for (let a = e.verticesStart + e.verticesCount - 1; a >= e.verticesStart; --a)
            u = a * o, c.push(W.FromArray(s, u));
          break;
        }
        default:
          F.Error(`Unsupported Vertex Buffer type: ${t}`);
      }
      this._writeVertexAttributeData(c, n + 12, t, i);
    } else
      F.Warn(`reorderTriangleStripDrawMode: Vertex buffer kind ${t} not present!`);
  }
  /**
   * Reorders the vertex attributes in the correct triangle fan order.  This is necessary when indices are not available and the winding order is
   * clock-wise during export to glTF
   * @param submesh BabylonJS submesh
   * @param vertexBufferKind The type of vertex attribute
   * @param meshAttributeArray The vertex attribute data
   * @param byteOffset The offset to the binary data
   * @param binaryWriter The binary data for the glTF file
   */
  _reorderTriangleFanMode(e, t, s, n, i) {
    const r = this._getVertexBufferFromMesh(t, e.getMesh());
    if (r) {
      const o = r.byteStride / T.GetTypeByteLength(r.type), c = [];
      let u = 0;
      switch (t) {
        case T.PositionKind:
        case T.NormalKind: {
          for (let a = e.verticesStart + e.verticesCount - 1; a >= e.verticesStart; --a)
            u = a * o, c.push(R.FromArray(s, u));
          break;
        }
        case T.TangentKind: {
          for (let a = e.verticesStart + e.verticesCount - 1; a >= e.verticesStart; --a)
            u = a * o, c.push(D.FromArray(s, u));
          break;
        }
        case T.ColorKind: {
          for (let a = e.verticesStart + e.verticesCount - 1; a >= e.verticesStart; --a)
            u = a * o, c.push(D.FromArray(s, u)), r.getSize() === 4 ? c.push(D.FromArray(s, u)) : c.push(R.FromArray(s, u));
          break;
        }
        case T.UVKind:
        case T.UV2Kind: {
          for (let a = e.verticesStart + e.verticesCount - 1; a >= e.verticesStart; --a)
            u = a * o, c.push(W.FromArray(s, u));
          break;
        }
        default:
          F.Error(`Unsupported Vertex Buffer type: ${t}`);
      }
      this._writeVertexAttributeData(c, n, t, i);
    } else
      F.Warn(`reorderTriangleFanMode: Vertex buffer kind ${t} not present!`);
  }
  /**
   * Writes the vertex attribute data to binary
   * @param vertices The vertices to write to the binary writer
   * @param byteOffset The offset into the binary writer to overwrite binary data
   * @param vertexAttributeKind The vertex attribute type
   * @param binaryWriter The writer containing the binary data
   */
  _writeVertexAttributeData(e, t, s, n) {
    for (const i of e) {
      s === T.NormalKind ? i.normalize() : s === T.TangentKind && i instanceof D && U._NormalizeTangentFromRef(i);
      for (const r of i.asArray())
        n.setFloat32(r, t), t += 4;
    }
  }
  /**
   * Writes mesh attribute data to a data buffer
   * Returns the bytelength of the data
   * @param vertexBufferKind Indicates what kind of vertex data is being passed in
   * @param attributeComponentKind
   * @param meshAttributeArray Array containing the attribute data
   * @param stride Specifies the space between data
   * @param binaryWriter The buffer to write the binary data to
   * @param babylonTransformNode
   */
  _writeAttributeData(e, t, s, n, i, r) {
    let o = [], c;
    switch (e) {
      case T.PositionKind: {
        for (let a = 0, l = s.length / n; a < l; ++a) {
          c = a * n;
          const h = R.FromArray(s, c);
          o.push(h.asArray());
        }
        break;
      }
      case T.NormalKind: {
        for (let a = 0, l = s.length / n; a < l; ++a) {
          c = a * n;
          const h = R.FromArray(s, c);
          o.push(h.normalize().asArray());
        }
        break;
      }
      case T.TangentKind: {
        for (let a = 0, l = s.length / n; a < l; ++a) {
          c = a * n;
          const h = D.FromArray(s, c);
          U._NormalizeTangentFromRef(h), o.push(h.asArray());
        }
        break;
      }
      case T.ColorKind: {
        const a = r.material, l = a ? a.getClassName() === "StandardMaterial" : !0, h = n === 3 ? new z() : new we(), f = this._babylonScene.getEngine().useExactSrgbConversions;
        for (let p = 0, g = s.length / n; p < g; ++p)
          c = p * n, n === 3 ? (z.FromArrayToRef(s, c, h), l && h.toLinearSpaceToRef(h, f)) : (we.FromArrayToRef(s, c, h), l && h.toLinearSpaceToRef(h, f)), o.push(h.asArray());
        break;
      }
      case T.UVKind:
      case T.UV2Kind: {
        for (let a = 0, l = s.length / n; a < l; ++a) {
          c = a * n;
          const h = W.FromArray(s, c);
          o.push(h.asArray());
        }
        break;
      }
      case T.MatricesIndicesKind:
      case T.MatricesIndicesExtraKind: {
        for (let a = 0, l = s.length / n; a < l; ++a) {
          c = a * n;
          const h = D.FromArray(s, c);
          o.push(h.asArray());
        }
        break;
      }
      case T.MatricesWeightsKind:
      case T.MatricesWeightsExtraKind: {
        for (let a = 0, l = s.length / n; a < l; ++a) {
          c = a * n;
          const h = D.FromArray(s, c);
          o.push(h.asArray());
        }
        break;
      }
      default:
        F.Warn("Unsupported Vertex Buffer Type: " + e), o = [];
    }
    let u;
    switch (t) {
      case 5121: {
        u = i.setUInt8.bind(i);
        break;
      }
      case 5123: {
        u = i.setUInt16.bind(i);
        break;
      }
      case 5125: {
        u = i.setUInt32.bind(i);
        break;
      }
      case 5126: {
        u = i.setFloat32.bind(i);
        break;
      }
      default: {
        F.Warn("Unsupported Attribute Component kind: " + t);
        return;
      }
    }
    for (const a of o)
      for (const l of a)
        u(l);
  }
  /**
   * Writes mesh attribute data to a data buffer
   * Returns the bytelength of the data
   * @param vertexBufferKind Indicates what kind of vertex data is being passed in
   * @param attributeComponentKind attribute component type
   * @param meshPrimitive the mesh primitive
   * @param meshAttributeArray Array containing the attribute data
   * @param morphTargetAttributeArray
   * @param stride Specifies the space between data
   * @param binaryWriter The buffer to write the binary data to
   * @param minMax
   */
  writeMorphTargetAttributeData(e, t, s, n, i, r, o, c) {
    let u = [], a, l = new R(), h = new D(0, 0, 0, 0);
    switch (e) {
      case T.PositionKind: {
        for (let p = s.verticesStart; p < s.verticesCount; ++p) {
          a = s.indexStart + p * r;
          const g = R.FromArray(n, a);
          l = R.FromArray(i, a).subtractToRef(g, l), c && (c.min.copyFromFloats(Math.min(l.x, c.min.x), Math.min(l.y, c.min.y), Math.min(l.z, c.min.z)), c.max.copyFromFloats(Math.max(l.x, c.max.x), Math.max(l.y, c.max.y), Math.max(l.z, c.max.z))), u.push(l.asArray());
        }
        break;
      }
      case T.NormalKind: {
        for (let p = s.verticesStart; p < s.verticesCount; ++p) {
          a = s.indexStart + p * r;
          const g = R.FromArray(n, a).normalize();
          l = R.FromArray(i, a).normalize().subtractToRef(g, l), u.push(l.asArray());
        }
        break;
      }
      case T.TangentKind: {
        for (let p = s.verticesStart; p < s.verticesCount; ++p) {
          a = s.indexStart + p * (r + 1);
          const g = D.FromArray(n, a);
          U._NormalizeTangentFromRef(g);
          const x = D.FromArray(i, a);
          U._NormalizeTangentFromRef(x), h = x.subtractToRef(g, h), u.push([h.x, h.y, h.z]);
        }
        break;
      }
      default:
        F.Warn("Unsupported Vertex Buffer Type: " + e), u = [];
    }
    let f;
    switch (t) {
      case 5121: {
        f = o.setUInt8.bind(o);
        break;
      }
      case 5123: {
        f = o.setUInt16.bind(o);
        break;
      }
      case 5125: {
        f = o.setUInt32.bind(o);
        break;
      }
      case 5126: {
        f = o.setFloat32.bind(o);
        break;
      }
      default: {
        F.Warn("Unsupported Attribute Component kind: " + t);
        return;
      }
    }
    for (const p of u)
      for (const g of p)
        f(g);
  }
  /**
   * Generates glTF json data
   * @param shouldUseGlb Indicates whether the json should be written for a glb file
   * @param glTFPrefix Text to use when prefixing a glTF file
   * @param prettyPrint Indicates whether the json file should be pretty printed (true) or not (false)
   * @returns json data as string
   */
  _generateJSON(e, t, s) {
    const n = { byteLength: this._totalByteLength };
    let i, r, o, c = this._totalByteLength;
    return n.byteLength && (this._glTF.buffers = [n]), this._nodes && this._nodes.length && (this._glTF.nodes = this._nodes), this._meshes && this._meshes.length && (this._glTF.meshes = this._meshes), this._scenes && this._scenes.length && (this._glTF.scenes = this._scenes, this._glTF.scene = 0), this._cameras && this._cameras.length && (this._glTF.cameras = this._cameras), this._bufferViews && this._bufferViews.length && (this._glTF.bufferViews = this._bufferViews), this._accessors && this._accessors.length && (this._glTF.accessors = this._accessors), this._animations && this._animations.length && (this._glTF.animations = this._animations), this._materials && this._materials.length && (this._glTF.materials = this._materials), this._textures && this._textures.length && (this._glTF.textures = this._textures), this._samplers && this._samplers.length && (this._glTF.samplers = this._samplers), this._skins && this._skins.length && (this._glTF.skins = this._skins), this._images && this._images.length && (e ? (this._glTF.images = [], this._images.forEach((a) => {
      a.uri && (r = this._imageData[a.uri], this._orderedImageData.push(r), i = a.uri.split(".")[0] + " image", o = U._CreateBufferView(0, c, r.data.byteLength, void 0, i), c += r.data.byteLength, this._bufferViews.push(o), a.bufferView = this._bufferViews.length - 1, a.name = i, a.mimeType = r.mimeType, a.uri = void 0, this._glTF.images || (this._glTF.images = []), this._glTF.images.push(a));
    }), n.byteLength = c) : this._glTF.images = this._images), e || (n.uri = t + ".bin"), s ? JSON.stringify(this._glTF, null, 2) : JSON.stringify(this._glTF);
  }
  /**
   * Generates data for .gltf and .bin files based on the glTF prefix string
   * @param glTFPrefix Text to use when prefixing a glTF file
   * @param dispose Dispose the exporter
   * @returns GLTFData with glTF file data
   */
  _generateGLTFAsync(e, t = !0) {
    return this._generateBinaryAsync().then((s) => {
      this._extensionsOnExporting();
      const n = this._generateJSON(!1, e, !0), i = new Blob([s], { type: "application/octet-stream" }), r = e + ".gltf", o = e + ".bin", c = new ce();
      if (c.glTFFiles[r] = n, c.glTFFiles[o] = i, this._imageData)
        for (const u in this._imageData)
          c.glTFFiles[u] = new Blob([this._imageData[u].data], { type: this._imageData[u].mimeType });
      return t && this.dispose(), c;
    });
  }
  /**
   * Creates a binary buffer for glTF
   * @returns array buffer for binary data
   */
  _generateBinaryAsync() {
    const e = new ye(4);
    return this._createSceneAsync(e).then(() => (this._localEngine && this._localEngine.dispose(), e.getArrayBuffer()));
  }
  /**
   * Pads the number to a multiple of 4
   * @param num number to pad
   * @returns padded number
   */
  _getPadding(e) {
    const t = e % 4;
    return t === 0 ? t : 4 - t;
  }
  /**
   * @internal
   */
  _generateGLBAsync(e, t = !0) {
    return this._generateBinaryAsync().then((s) => {
      this._extensionsOnExporting();
      const n = this._generateJSON(!0), i = e + ".glb", r = 12, o = 8;
      let c = n.length, u, a = 0;
      typeof TextEncoder < "u" && (u = new TextEncoder().encode(n), c = u.length);
      for (let N = 0; N < this._orderedImageData.length; ++N)
        a += this._orderedImageData[N].data.byteLength;
      const l = this._getPadding(c), h = this._getPadding(s.byteLength), f = this._getPadding(a), p = r + 2 * o + c + l + s.byteLength + h + a + f, g = new ArrayBuffer(r), x = new DataView(g);
      x.setUint32(0, 1179937895, !0), x.setUint32(4, 2, !0), x.setUint32(8, p, !0);
      const d = new ArrayBuffer(o + c + l), _ = new DataView(d);
      _.setUint32(0, c + l, !0), _.setUint32(4, 1313821514, !0);
      const m = new Uint8Array(d, o);
      if (u)
        m.set(u);
      else
        for (let Y = 0; Y < c; ++Y) {
          const H = n.charCodeAt(Y);
          H != n.codePointAt(Y) ? m[Y] = 95 : m[Y] = H;
        }
      const A = new Uint8Array(d, o + c);
      for (let N = 0; N < l; ++N)
        A[N] = 32;
      const w = new ArrayBuffer(o), C = new DataView(w);
      C.setUint32(0, s.byteLength + a + f, !0), C.setUint32(4, 5130562, !0);
      const y = new ArrayBuffer(h), I = new Uint8Array(y);
      for (let N = 0; N < h; ++N)
        I[N] = 0;
      const k = new ArrayBuffer(f), K = new Uint8Array(k);
      for (let N = 0; N < f; ++N)
        K[N] = 0;
      const S = [g, d, w, s];
      for (let N = 0; N < this._orderedImageData.length; ++N)
        S.push(this._orderedImageData[N].data);
      S.push(y), S.push(k);
      const q = new Blob(S, { type: "application/octet-stream" }), $ = new ce();
      return $.glTFFiles[i] = q, this._localEngine != null && this._localEngine.dispose(), t && this.dispose(), $;
    });
  }
  /**
   * Sets the TRS for each node
   * @param node glTF Node for storing the transformation data
   * @param babylonTransformNode Babylon mesh used as the source for the transformation data
   */
  _setNodeTransformation(e, t) {
    t.getPivotPoint().equalsToFloats(0, 0, 0) || F.Warn("Pivot points are not supported in the glTF serializer"), t.position.equalsToFloats(0, 0, 0) || (e.translation = t.position.asArray()), t.scaling.equalsToFloats(1, 1, 1) || (e.scale = t.scaling.asArray());
    const s = B.FromEulerAngles(t.rotation.x, t.rotation.y, t.rotation.z);
    t.rotationQuaternion && s.multiplyInPlace(t.rotationQuaternion), B.IsIdentity(s) || (e.rotation = s.normalize().asArray());
  }
  _setCameraTransformation(e, t) {
    const s = L.Vector3[0], n = L.Quaternion[0];
    t.getWorldMatrix().decompose(void 0, n, s), s.equalsToFloats(0, 0, 0) || (e.translation = s.asArray()), n.multiplyInPlace(Ze), B.IsIdentity(n) || (e.rotation = n.asArray());
  }
  _getVertexBufferFromMesh(e, t) {
    if (t.isVerticesDataPresent(e, !0)) {
      const s = t.getVertexBuffer(e, !0);
      if (s)
        return s;
    }
    return null;
  }
  /**
   * Creates a bufferview based on the vertices type for the Babylon mesh
   * @param kind Indicates the type of vertices data
   * @param attributeComponentKind Indicates the numerical type used to store the data
   * @param babylonTransformNode The Babylon mesh to get the vertices data from
   * @param binaryWriter The buffer to write the bufferview data to
   * @param byteStride
   */
  _createBufferViewKind(e, t, s, n, i) {
    const r = s instanceof G ? s : s instanceof se ? s.sourceMesh : null;
    if (r) {
      const o = r.getVertexBuffer(e, !0), c = r.getVerticesData(e, void 0, void 0, !0);
      if (o && c) {
        const u = T.GetTypeByteLength(t), a = c.length * u, l = U._CreateBufferView(0, n.getByteOffset(), a, i, e + " - " + r.name);
        this._bufferViews.push(l), this._writeAttributeData(e, t, c, i / u, n, s);
      }
    }
  }
  /**
   * Creates a bufferview based on the vertices type for the Babylon mesh
   * @param babylonSubMesh The Babylon submesh that the morph target is applied to
   * @param meshPrimitive
   * @param babylonMorphTarget the morph target to be exported
   * @param binaryWriter The buffer to write the bufferview data to
   */
  _setMorphTargetAttributes(e, t, s, n) {
    if (s) {
      t.targets || (t.targets = []);
      const i = {}, r = e.getMesh();
      if (s.hasNormals) {
        const o = r.getVerticesData(T.NormalKind, void 0, void 0, !0), c = s.getNormals(), u = e.verticesCount, a = 12, l = u * a, h = U._CreateBufferView(0, n.getByteOffset(), l, a, s.name + "_NORMAL");
        this._bufferViews.push(h);
        const f = this._bufferViews.length - 1, p = U._CreateAccessor(f, s.name + " - NORMAL", "VEC3", 5126, u, 0, null, null);
        this._accessors.push(p), i.NORMAL = this._accessors.length - 1, this.writeMorphTargetAttributeData(T.NormalKind, 5126, e, o, c, a / 4, n);
      }
      if (s.hasPositions) {
        const o = r.getVerticesData(T.PositionKind, void 0, void 0, !0), c = s.getPositions(), u = e.verticesCount, a = 12, l = u * a, h = U._CreateBufferView(0, n.getByteOffset(), l, a, s.name + "_POSITION");
        this._bufferViews.push(h);
        const f = this._bufferViews.length - 1, p = { min: new R(1 / 0, 1 / 0, 1 / 0), max: new R(-1 / 0, -1 / 0, -1 / 0) }, g = U._CreateAccessor(f, s.name + " - POSITION", "VEC3", 5126, u, 0, null, null);
        this._accessors.push(g), i.POSITION = this._accessors.length - 1, this.writeMorphTargetAttributeData(T.PositionKind, 5126, e, o, c, a / 4, n, p), g.min = p.min.asArray(), g.max = p.max.asArray();
      }
      if (s.hasTangents) {
        const o = r.getVerticesData(T.TangentKind, void 0, void 0, !0), c = s.getTangents(), u = e.verticesCount, a = 12, l = u * a, h = U._CreateBufferView(0, n.getByteOffset(), l, a, s.name + "_NORMAL");
        this._bufferViews.push(h);
        const f = this._bufferViews.length - 1, p = U._CreateAccessor(f, s.name + " - TANGENT", "VEC3", 5126, u, 0, null, null);
        this._accessors.push(p), i.TANGENT = this._accessors.length - 1, this.writeMorphTargetAttributeData(T.TangentKind, 5126, e, o, c, a / 4, n);
      }
      t.targets.push(i);
    }
  }
  /**
   * The primitive mode of the Babylon mesh
   * @param babylonMesh The BabylonJS mesh
   * @returns Unsigned integer of the primitive mode or null
   */
  _getMeshPrimitiveMode(e) {
    if (e instanceof Fe)
      return O.LineListDrawMode;
    if (e instanceof se || e instanceof G) {
      const t = e instanceof G ? e : e.sourceMesh;
      if (typeof t.overrideRenderingFillMode == "number")
        return t.overrideRenderingFillMode;
    }
    return e.material ? e.material.fillMode : O.TriangleFillMode;
  }
  /**
   * Sets the primitive mode of the glTF mesh primitive
   * @param meshPrimitive glTF mesh primitive
   * @param primitiveMode The primitive mode
   */
  _setPrimitiveMode(e, t) {
    switch (t) {
      case O.TriangleFillMode:
        break;
      case O.TriangleStripDrawMode: {
        e.mode = 5;
        break;
      }
      case O.TriangleFanDrawMode: {
        e.mode = 6;
        break;
      }
      case O.PointListDrawMode: {
        e.mode = 0;
        break;
      }
      case O.PointFillMode: {
        e.mode = 0;
        break;
      }
      case O.LineLoopDrawMode: {
        e.mode = 2;
        break;
      }
      case O.LineListDrawMode: {
        e.mode = 1;
        break;
      }
      case O.LineStripDrawMode: {
        e.mode = 3;
        break;
      }
    }
  }
  /**
   * Sets the vertex attribute accessor based of the glTF mesh primitive
   * @param meshPrimitive glTF mesh primitive
   * @param attributeKind vertex attribute
   */
  _setAttributeKind(e, t) {
    switch (t) {
      case T.PositionKind: {
        e.attributes.POSITION = this._accessors.length - 1;
        break;
      }
      case T.NormalKind: {
        e.attributes.NORMAL = this._accessors.length - 1;
        break;
      }
      case T.ColorKind: {
        e.attributes.COLOR_0 = this._accessors.length - 1;
        break;
      }
      case T.TangentKind: {
        e.attributes.TANGENT = this._accessors.length - 1;
        break;
      }
      case T.UVKind: {
        e.attributes.TEXCOORD_0 = this._accessors.length - 1;
        break;
      }
      case T.UV2Kind: {
        e.attributes.TEXCOORD_1 = this._accessors.length - 1;
        break;
      }
      case T.MatricesIndicesKind: {
        e.attributes.JOINTS_0 = this._accessors.length - 1;
        break;
      }
      case T.MatricesIndicesExtraKind: {
        e.attributes.JOINTS_1 = this._accessors.length - 1;
        break;
      }
      case T.MatricesWeightsKind: {
        e.attributes.WEIGHTS_0 = this._accessors.length - 1;
        break;
      }
      case T.MatricesWeightsExtraKind: {
        e.attributes.WEIGHTS_1 = this._accessors.length - 1;
        break;
      }
      default:
        F.Warn("Unsupported Vertex Buffer Type: " + t);
    }
  }
  /**
   * Sets data for the primitive attributes of each submesh
   * @param mesh glTF Mesh object to store the primitive attribute information
   * @param babylonTransformNode Babylon mesh to get the primitive attribute data from
   * @param binaryWriter Buffer to write the attribute data to
   * @returns promise that resolves when done setting the primitive attributes
   */
  _setPrimitiveAttributesAsync(e, t, s) {
    const n = [];
    let i = null, r, o;
    t instanceof G ? i = t : t instanceof se && (i = t.sourceMesh);
    const c = [
      { kind: T.PositionKind, accessorType: "VEC3", accessorComponentType: 5126, byteStride: 12 },
      { kind: T.NormalKind, accessorType: "VEC3", accessorComponentType: 5126, byteStride: 12 },
      { kind: T.ColorKind, accessorType: "VEC4", accessorComponentType: 5126, byteStride: 16 },
      { kind: T.TangentKind, accessorType: "VEC4", accessorComponentType: 5126, byteStride: 16 },
      { kind: T.UVKind, accessorType: "VEC2", accessorComponentType: 5126, byteStride: 8 },
      { kind: T.UV2Kind, accessorType: "VEC2", accessorComponentType: 5126, byteStride: 8 },
      { kind: T.MatricesIndicesKind, accessorType: "VEC4", accessorComponentType: 5123, byteStride: 8 },
      { kind: T.MatricesIndicesExtraKind, accessorType: "VEC4", accessorComponentType: 5123, byteStride: 8 },
      { kind: T.MatricesWeightsKind, accessorType: "VEC4", accessorComponentType: 5126, byteStride: 16 },
      { kind: T.MatricesWeightsExtraKind, accessorType: "VEC4", accessorComponentType: 5126, byteStride: 16 }
    ];
    if (i) {
      let u = null;
      const a = this._getMeshPrimitiveMode(i), l = {}, h = i.morphTargetManager;
      for (const f of c) {
        const p = f.kind, g = f.accessorComponentType;
        if (i.isVerticesDataPresent(p, !0)) {
          const x = this._getVertexBufferFromMesh(p, i);
          f.byteStride = x ? x.getSize() * T.GetTypeByteLength(f.accessorComponentType) : T.DeduceStride(p) * 4, f.byteStride === 12 && (f.accessorType = "VEC3"), this._createBufferViewKind(p, g, t, s, f.byteStride), f.bufferViewIndex = this._bufferViews.length - 1, l[p] = f.bufferViewIndex;
        }
      }
      if (i.getTotalIndices()) {
        const f = i.getIndices();
        if (f) {
          const p = f.length * 4;
          r = U._CreateBufferView(0, s.getByteOffset(), p, void 0, "Indices - " + i.name), this._bufferViews.push(r), u = this._bufferViews.length - 1;
          for (let g = 0, x = f.length; g < x; ++g)
            s.setUInt32(f[g]);
        }
      }
      if (i.subMeshes)
        for (const f of i.subMeshes) {
          let p = f.getMaterial() || i.getScene().defaultMaterial, g = null;
          if (p)
            if (i instanceof Fe) {
              const _ = {
                name: i.name + " material"
              };
              (!i.color.equals(z.White()) || i.alpha < 1) && (_.pbrMetallicRoughness = {
                baseColorFactor: i.color.asArray().concat([i.alpha])
              }), this._materials.push(_), g = this._materials.length - 1;
            } else if (p instanceof Se) {
              const _ = p.subMaterials[f.materialIndex];
              _ && (p = _, g = this._materialMap[p.uniqueId]);
            } else
              g = this._materialMap[p.uniqueId];
          const x = g != null ? this._materials[g] : null, d = { attributes: {} };
          this._setPrimitiveMode(d, a);
          for (const _ of c) {
            const m = _.kind;
            if ((m === T.UVKind || m === T.UV2Kind) && !this._options.exportUnusedUVs && (!x || !this._glTFMaterialExporter._hasTexturesPresent(x)))
              continue;
            const A = i.getVerticesData(m, void 0, void 0, !0);
            if (A) {
              const w = this._getVertexBufferFromMesh(m, i);
              if (w) {
                const C = w.getSize(), y = _.bufferViewIndex;
                if (y != null) {
                  o = { min: null, max: null }, m == T.PositionKind && (o = U._CalculateMinMaxPositions(A, 0, A.length / C));
                  const I = U._CreateAccessor(y, m + " - " + t.name, _.accessorType, _.accessorComponentType, A.length / C, 0, o.min, o.max);
                  this._accessors.push(I), this._setAttributeKind(d, m);
                }
              }
            }
          }
          if (u) {
            const _ = U._CreateAccessor(u, "indices - " + t.name, "SCALAR", 5125, f.indexCount, f.indexStart * 4, null, null);
            this._accessors.push(_), d.indices = this._accessors.length - 1;
          }
          if (Object.keys(d.attributes).length > 0) {
            if ((i.overrideMaterialSideOrientation !== null ? i.overrideMaterialSideOrientation : p.sideOrientation) === (this._babylonScene.useRightHandedSystem ? O.ClockWiseSideOrientation : O.CounterClockWiseSideOrientation)) {
              let m = u != null ? this._bufferViews[u].byteOffset : null;
              m == null && (m = 0);
              let A = null;
              if (u != null && (A = i.getIndices()), A)
                this._reorderIndicesBasedOnPrimitiveMode(f, a, A, m, s);
              else
                for (const w of c) {
                  const C = i.getVerticesData(w.kind, void 0, void 0, !0);
                  if (C) {
                    const y = this._bufferViews[l[w.kind]].byteOffset || 0;
                    this._reorderVertexAttributeDataBasedOnPrimitiveMode(f, a, w.kind, C, y, s);
                  }
                }
            }
            g != null && (d.material = g);
          }
          if (h) {
            e.extras || (e.extras = {}), e.extras.targetNames = [];
            for (let _ = 0; _ < h.numTargets; ++_) {
              const m = h.getTarget(_);
              this._setMorphTargetAttributes(f, d, m, s), e.extras.targetNames.push(m.name);
            }
          }
          e.primitives.push(d), this._extensionsPostExportMeshPrimitiveAsync("postExport", d, f, s), n.push();
        }
    }
    return Promise.all(n).then(() => {
    });
  }
  /**
   * Creates a glTF scene based on the array of meshes
   * Returns the total byte offset
   * @param binaryWriter Buffer to write binary data to
   * @returns a promise that resolves when done
   */
  _createSceneAsync(e) {
    const t = { nodes: [] };
    let s, n, i;
    const r = [...this._babylonScene.transformNodes, ...this._babylonScene.meshes, ...this._babylonScene.lights, ...this._babylonScene.cameras], o = /* @__PURE__ */ new Set();
    if (this._babylonScene.metadata && (this._options.metadataSelector ? t.extras = this._options.metadataSelector(this._babylonScene.metadata) : this._babylonScene.metadata.gltf && (t.extras = this._babylonScene.metadata.gltf.extras)), (this._options.removeNoopRootNodes ?? !0) && !this._options.includeCoordinateSystemConversionNodes)
      for (const l of this._babylonScene.rootNodes)
        be(l, this._babylonScene.useRightHandedSystem) && (o.add(l), r.splice(r.indexOf(l), 1));
    const c = /* @__PURE__ */ new Map();
    this._babylonScene.cameras.forEach((l) => {
      if (this._options.shouldExportNode && !this._options.shouldExportNode(l))
        return;
      const h = {
        type: l.mode === ee.PERSPECTIVE_CAMERA ? "perspective" : "orthographic"
      };
      if (l.name && (h.name = l.name), h.type === "perspective")
        h.perspective = {
          aspectRatio: l.getEngine().getAspectRatio(l),
          yfov: l.fovMode === ee.FOVMODE_VERTICAL_FIXED ? l.fov : l.fov * l.getEngine().getAspectRatio(l),
          znear: l.minZ,
          zfar: l.maxZ
        };
      else if (h.type === "orthographic") {
        const f = l.orthoLeft && l.orthoRight ? 0.5 * (l.orthoRight - l.orthoLeft) : l.getEngine().getRenderWidth() * 0.5, p = l.orthoBottom && l.orthoTop ? 0.5 * (l.orthoTop - l.orthoBottom) : l.getEngine().getRenderHeight() * 0.5;
        h.orthographic = {
          xmag: f,
          ymag: p,
          znear: l.minZ,
          zfar: l.maxZ
        };
      }
      c.set(l, this._cameras.length), this._cameras.push(h);
    });
    const [u, a] = this._getExportNodes(r);
    return this._glTFMaterialExporter._convertMaterialsToGLTFAsync(a, "image/png", !0).then(() => this._createNodeMapAndAnimationsAsync(u, e).then((l) => this._createSkinsAsync(l, e).then((h) => {
      if (this._nodeMap = l, this._totalByteLength = e.getByteOffset(), this._totalByteLength == null)
        throw new Error("undefined byte length!");
      for (const f of r)
        if (s = this._nodeMap[f.uniqueId], s !== void 0 && (n = this._nodes[s], f.metadata && (this._options.metadataSelector ? n.extras = this._options.metadataSelector(f.metadata) : f.metadata.gltf && (n.extras = f.metadata.gltf.extras)), f instanceof ee && (n.camera = c.get(f)), this._options.shouldExportNode && !this._options.shouldExportNode(f) ? F.Log("Omitting " + f.name + " from scene.") : (!f.parent && !this._babylonScene.useRightHandedSystem && et(n), (!f.parent || o.has(f.parent)) && t.nodes.push(s)), f instanceof G && f.skeleton && (n.skin = h[f.skeleton.uniqueId]), i = f.getDescendants(!0), !n.children && i && i.length)) {
          const p = [];
          for (const g of i)
            this._nodeMap[g.uniqueId] != null && p.push(this._nodeMap[g.uniqueId]);
          p.length && (n.children = p);
        }
      t.nodes.length && this._scenes.push(t);
    })));
  }
  /**
   * Getting the nodes and materials that would be exported.
   * @param nodes Babylon transform nodes
   * @returns Set of materials which would be exported.
   */
  _getExportNodes(e) {
    const t = [], s = /* @__PURE__ */ new Set();
    for (const n of e)
      if (!this._options.shouldExportNode || this._options.shouldExportNode(n)) {
        t.push(n);
        const i = n;
        if (i.subMeshes && i.subMeshes.length > 0) {
          const r = i.material || i.getScene().defaultMaterial;
          if (r instanceof Se)
            for (const o of r.subMaterials)
              o && s.add(o);
          else
            s.add(r);
        }
      } else
        `${n.name}`;
    return [t, s];
  }
  /**
   * Creates a mapping of Node unique id to node index and handles animations
   * @param nodes Babylon transform nodes
   * @param binaryWriter Buffer to write binary data to
   * @returns Node mapping of unique id to index
   */
  _createNodeMapAndAnimationsAsync(e, t) {
    let s = Promise.resolve();
    const n = {};
    let i;
    const r = {
      name: "runtime animations",
      channels: [],
      samplers: []
    }, o = [];
    for (const c of e)
      s = s.then(() => this._createNodeAsync(c, t).then((u) => {
        const a = this._extensionsPostExportNodeAsync("createNodeAsync", u, c, n, t);
        return a == null ? (F.Warn(`Not exporting node ${c.name}`), Promise.resolve()) : a.then((l) => {
          l && (this._nodes.push(l), i = this._nodes.length - 1, n[c.uniqueId] = i, this._babylonScene.animationGroups.length || (M._CreateMorphTargetAnimationFromMorphTargetAnimations(c, r, o, n, this._nodes, t, this._bufferViews, this._accessors, this._animationSampleRate, this._options.shouldExportAnimation), c.animations.length && M._CreateNodeAnimationFromNodeAnimations(c, r, o, n, this._nodes, t, this._bufferViews, this._accessors, this._animationSampleRate, this._options.shouldExportAnimation)));
        });
      }));
    return s.then(() => (r.channels.length && r.samplers.length && this._animations.push(r), o.forEach((c) => {
      c.channels.length && c.samplers.length && this._animations.push(c);
    }), this._babylonScene.animationGroups.length && M._CreateNodeAndMorphAnimationFromAnimationGroups(this._babylonScene, this._animations, n, t, this._bufferViews, this._accessors, this._animationSampleRate, this._options.shouldExportAnimation), n));
  }
  /**
   * Creates a glTF node from a Babylon mesh
   * @param babylonNode Source Babylon mesh
   * @param binaryWriter Buffer for storing geometry data
   * @returns glTF node
   */
  _createNodeAsync(e, t) {
    return Promise.resolve().then(() => {
      const s = {}, n = { primitives: [] };
      if (e.name && (s.name = e.name), e instanceof Ae) {
        if (this._setNodeTransformation(s, e), e instanceof G) {
          const i = e.morphTargetManager;
          if (i && i.numTargets > 0) {
            n.weights = [];
            for (let r = 0; r < i.numTargets; ++r)
              n.weights.push(i.getTarget(r).influence);
          }
        }
        return this._setPrimitiveAttributesAsync(n, e, t).then(() => (n.primitives.length && (this._meshes.push(n), s.mesh = this._meshes.length - 1), s));
      } else return e instanceof ee && this._setCameraTransformation(s, e), s;
    });
  }
  /**
   * Creates a glTF skin from a Babylon skeleton
   * @param nodeMap Babylon transform nodes
   * @param binaryWriter Buffer to write binary data to
   * @returns Node mapping of unique id to index
   */
  _createSkinsAsync(e, t) {
    const s = Promise.resolve(), n = {};
    for (const i of this._babylonScene.skeletons) {
      if (i.bones.length <= 0)
        continue;
      const r = { joints: [] }, o = [], c = {};
      let u = -1;
      for (let a = 0; a < i.bones.length; ++a) {
        const l = i.bones[a], h = l.getIndex() ?? a;
        h !== -1 && (c[h] = l, h > u && (u = h));
      }
      for (let a = 0; a <= u; ++a) {
        const l = c[a];
        o.push(l.getInvertedAbsoluteTransform());
        const h = l.getTransformNode();
        h && e[h.uniqueId] !== null && e[h.uniqueId] !== void 0 ? r.joints.push(e[h.uniqueId]) : F.Warn("Exporting a bone without a linked transform node is currently unsupported");
      }
      if (r.joints.length > 0) {
        const l = o.length * 64, h = t.getByteOffset(), f = U._CreateBufferView(0, h, l, void 0, "InverseBindMatrices - " + i.name);
        this._bufferViews.push(f);
        const p = this._bufferViews.length - 1, g = U._CreateAccessor(p, "InverseBindMatrices - " + i.name, "MAT4", 5126, o.length, null, null, null), x = this._accessors.push(g) - 1;
        r.inverseBindMatrices = x, this._skins.push(r), n[i.uniqueId] = this._skins.length - 1, o.forEach((d) => {
          d.m.forEach((_) => {
            t.setFloat32(_);
          });
        });
      }
    }
    return s.then(() => n);
  }
}
V._ExtensionNames = new Array();
V._ExtensionFactories = {};
class ye {
  /**
   * Initialize binary writer with an initial byte length
   * @param byteLength Initial byte length of the array buffer
   */
  constructor(e) {
    this._arrayBuffer = new ArrayBuffer(e), this._dataView = new DataView(this._arrayBuffer), this._byteOffset = 0;
  }
  /**
   * Resize the array buffer to the specified byte length
   * @param byteLength The new byte length
   * @returns The resized array buffer
   */
  _resizeBuffer(e) {
    const t = new ArrayBuffer(e), s = Math.min(this._arrayBuffer.byteLength, e), n = new Uint8Array(this._arrayBuffer, 0, s);
    return new Uint8Array(t).set(n, 0), this._arrayBuffer = t, this._dataView = new DataView(this._arrayBuffer), t;
  }
  /**
   * Get an array buffer with the length of the byte offset
   * @returns ArrayBuffer resized to the byte offset
   */
  getArrayBuffer() {
    return this._resizeBuffer(this.getByteOffset());
  }
  /**
   * Get the byte offset of the array buffer
   * @returns byte offset
   */
  getByteOffset() {
    if (this._byteOffset == null)
      throw new Error("Byte offset is undefined!");
    return this._byteOffset;
  }
  /**
   * Stores an UInt8 in the array buffer
   * @param entry
   * @param byteOffset If defined, specifies where to set the value as an offset.
   */
  setUInt8(e, t) {
    t != null ? t < this._byteOffset ? this._dataView.setUint8(t, e) : F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!") : (this._byteOffset + 1 > this._arrayBuffer.byteLength && this._resizeBuffer(this._arrayBuffer.byteLength * 2), this._dataView.setUint8(this._byteOffset, e), this._byteOffset += 1);
  }
  /**
   * Stores an UInt16 in the array buffer
   * @param entry
   * @param byteOffset If defined, specifies where to set the value as an offset.
   */
  setUInt16(e, t) {
    t != null ? t < this._byteOffset ? this._dataView.setUint16(t, e, !0) : F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!") : (this._byteOffset + 2 > this._arrayBuffer.byteLength && this._resizeBuffer(this._arrayBuffer.byteLength * 2), this._dataView.setUint16(this._byteOffset, e, !0), this._byteOffset += 2);
  }
  /**
   * Gets an UInt32 in the array buffer
   * @param byteOffset If defined, specifies where to set the value as an offset.
   * @returns entry
   */
  getUInt32(e) {
    if (e < this._byteOffset)
      return this._dataView.getUint32(e, !0);
    throw F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!"), new Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
  }
  getVector3Float32FromRef(e, t) {
    t + 8 > this._byteOffset ? F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!") : (e.x = this._dataView.getFloat32(t, !0), e.y = this._dataView.getFloat32(t + 4, !0), e.z = this._dataView.getFloat32(t + 8, !0));
  }
  setVector3Float32FromRef(e, t) {
    t + 8 > this._byteOffset ? F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!") : (this._dataView.setFloat32(t, e.x, !0), this._dataView.setFloat32(t + 4, e.y, !0), this._dataView.setFloat32(t + 8, e.z, !0));
  }
  getVector4Float32FromRef(e, t) {
    t + 12 > this._byteOffset ? F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!") : (e.x = this._dataView.getFloat32(t, !0), e.y = this._dataView.getFloat32(t + 4, !0), e.z = this._dataView.getFloat32(t + 8, !0), e.w = this._dataView.getFloat32(t + 12, !0));
  }
  setVector4Float32FromRef(e, t) {
    t + 12 > this._byteOffset ? F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!") : (this._dataView.setFloat32(t, e.x, !0), this._dataView.setFloat32(t + 4, e.y, !0), this._dataView.setFloat32(t + 8, e.z, !0), this._dataView.setFloat32(t + 12, e.w, !0));
  }
  /**
   * Stores a Float32 in the array buffer
   * @param entry
   * @param byteOffset
   */
  setFloat32(e, t) {
    isNaN(e) && F.Error("Invalid data being written!"), t != null && (t < this._byteOffset ? this._dataView.setFloat32(t, e, !0) : F.Error("BinaryWriter: byteoffset is greater than the current binary length!")), this._byteOffset + 4 > this._arrayBuffer.byteLength && this._resizeBuffer(this._arrayBuffer.byteLength * 2), this._dataView.setFloat32(this._byteOffset, e, !0), this._byteOffset += 4;
  }
  /**
   * Stores an UInt32 in the array buffer
   * @param entry
   * @param byteOffset If defined, specifies where to set the value as an offset.
   */
  setUInt32(e, t) {
    t != null ? t < this._byteOffset ? this._dataView.setUint32(t, e, !0) : F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!") : (this._byteOffset + 4 > this._arrayBuffer.byteLength && this._resizeBuffer(this._arrayBuffer.byteLength * 2), this._dataView.setUint32(this._byteOffset, e, !0), this._byteOffset += 4);
  }
  /**
   * Stores an Int16 in the array buffer
   * @param entry
   * @param byteOffset If defined, specifies where to set the value as an offset.
   */
  setInt16(e, t) {
    t != null ? t < this._byteOffset ? this._dataView.setInt16(t, e, !0) : F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!") : (this._byteOffset + 2 > this._arrayBuffer.byteLength && this._resizeBuffer(this._arrayBuffer.byteLength * 2), this._dataView.setInt16(this._byteOffset, e, !0), this._byteOffset += 2);
  }
  /**
   * Stores a byte in the array buffer
   * @param entry
   * @param byteOffset If defined, specifies where to set the value as an offset.
   */
  setByte(e, t) {
    t != null ? t < this._byteOffset ? this._dataView.setInt8(t, e) : F.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!") : (this._byteOffset + 1 > this._arrayBuffer.byteLength && this._resizeBuffer(this._arrayBuffer.byteLength * 2), this._dataView.setInt8(this._byteOffset, e), this._byteOffset++);
  }
}
var tt = 0;
class st {
  /**
   * Exports the geometry of the scene to .gltf file format asynchronously
   * @param scene Babylon scene with scene hierarchy information
   * @param filePrefix File prefix to use when generating the glTF file
   * @param options Exporter options
   * @returns Returns an object with a .gltf file and associates texture names
   * as keys and their data and paths as values
   */
  static GLTFAsync(e, t, s) {
    return e.whenReadyAsync().then(() => {
      const n = t.replace(/\.[^/.]+$/, "");
      return new V(e, s)._generateGLTFAsync(n);
    });
  }
  static _PreExportAsync(e, t) {
    return Promise.resolve().then(() => t && t.exportWithoutWaitingForScene ? Promise.resolve() : e.whenReadyAsync());
  }
  static _PostExportAsync(e, t, s) {
    return Promise.resolve().then(() => (s && s.exportWithoutWaitingForScene, t));
  }
  /**
   * Exports the geometry of the scene to .glb file format asychronously
   * @param scene Babylon scene with scene hierarchy information
   * @param filePrefix File prefix to use when generating glb file
   * @param options Exporter options
   * @returns Returns an object with a .glb filename as key and data as value
   */
  static GLBAsync(e, t, s) {
    return this._PreExportAsync(e, s).then(() => {
      const n = t.replace(/\.[^/.]+$/, "");
      return new V(e, s)._generateGLBAsync(n).then((r) => this._PostExportAsync(e, r, s));
    });
  }
}
const re = "KHR_texture_transform";
class Ve {
  constructor() {
    this.name = re, this.enabled = !0, this.required = !1, this._wasUsed = !1;
  }
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  postExportTexture(e, t, s) {
    if (s && (s.uAng === 0 && s.wAng === 0 && s.vAng === 0 || s.uRotationCenter === 0 && s.vRotationCenter === 0)) {
      const i = {};
      let r = !1;
      if ((s.uOffset !== 0 || s.vOffset !== 0) && (i.offset = [s.uOffset, s.vOffset], r = !0), (s.uScale !== 1 || s.vScale !== 1) && (i.scale = [s.uScale, s.vScale], r = !0), s.wAng !== 0 && (i.rotation = -s.wAng, r = !0), s.coordinatesIndex !== 0 && (i.texCoord = s.coordinatesIndex, r = !0), !r)
        return;
      this._wasUsed = !0, t.extensions || (t.extensions = {}), t.extensions[re] = i;
    }
  }
  preExportTextureAsync(e, t) {
    return new Promise((s, n) => {
      if (!t.getScene()) {
        n(`${e}: "scene" is not defined for Babylon texture ${t.name}!`);
        return;
      }
      t.uAng !== 0 || t.vAng !== 0 ? (F.Warn(`${e}: Texture ${t.name} with rotation in the u or v axis is not supported in glTF.`), s(null)) : t.wAng !== 0 && (t.uRotationCenter !== 0 || t.vRotationCenter !== 0) ? (F.Warn(`${e}: Texture ${t.name} with rotation not centered at the origin cannot be exported with ${re}`), s(null)) : s(t);
    });
  }
}
V.RegisterExtension(re, () => new Ve());
const X = "KHR_lights_punctual";
class ve {
  /**
   * @internal
   */
  constructor(e) {
    this.name = X, this.enabled = !0, this.required = !1, this._exporter = e;
  }
  /** @internal */
  dispose() {
    this._lights = null;
  }
  /** @internal */
  get wasUsed() {
    return !!this._lights;
  }
  /** @internal */
  onExporting() {
    this._exporter._glTF.extensions[X] = this._lights;
  }
  /**
   * Define this method to modify the default behavior when exporting a node
   * @param context The context when exporting the node
   * @param node glTF node
   * @param babylonNode BabylonJS node
   * @param nodeMap Node mapping of unique id to glTF node index
   * @returns nullable INode promise
   */
  postExportNodeAsync(e, t, s, n) {
    return new Promise((i) => {
      if (t && s instanceof Ge) {
        let r;
        const o = s.getTypeID() == te.LIGHTTYPEID_POINTLIGHT ? "point" : s.getTypeID() == te.LIGHTTYPEID_DIRECTIONALLIGHT ? "directional" : s.getTypeID() == te.LIGHTTYPEID_SPOTLIGHT ? "spot" : null;
        if (o == null)
          Ie.Warn(`${e}: Light ${s.name} is not supported in ${X}`);
        else {
          if (s.position.equalsToFloats(0, 0, 0) || (t.translation = s.position.asArray()), o !== "point") {
            const a = s.direction, l = -Math.atan2(a.z, a.x) + Math.PI / 2, h = Math.sqrt(a.x * a.x + a.z * a.z), f = -Math.atan2(a.y, h), p = B.RotationYawPitchRoll(l + Math.PI, f, 0);
            B.IsIdentity(p) || (t.rotation = p.asArray());
          }
          if (s.falloffType !== te.FALLOFF_GLTF && Ie.Warn(`${e}: Light falloff for ${s.name} does not match the ${X} specification!`), r = {
            type: o
          }, s.diffuse.equals(z.White()) || (r.color = s.diffuse.asArray()), s.intensity !== 1 && (r.intensity = s.intensity), s.range !== Number.MAX_VALUE && (r.range = s.range), o === "spot") {
            const a = s;
            a.angle !== Math.PI / 2 && (r.spot == null && (r.spot = {}), r.spot.outerConeAngle = a.angle / 2), a.innerAngle !== 0 && (r.spot == null && (r.spot = {}), r.spot.innerConeAngle = a.innerAngle / 2);
          }
          this._lights || (this._lights = {
            lights: []
          }), this._lights.lights.push(r);
          const c = {
            light: this._lights.lights.length - 1
          }, u = s.parent;
          if (u && u.getChildren().length == 1) {
            const a = this._exporter._nodes[n[u.uniqueId]];
            if (a) {
              const l = R.FromArrayToRef(a.translation || [0, 0, 0], 0, L.Vector3[0]), h = B.FromArrayToRef(a.rotation || [0, 0, 0, 1], 0, L.Quaternion[0]), f = R.FromArrayToRef(a.scale || [1, 1, 1], 0, L.Vector3[1]), p = ie.ComposeToRef(f, h, l, L.Matrix[0]), g = R.FromArrayToRef(t.translation || [0, 0, 0], 0, L.Vector3[2]), x = B.FromArrayToRef(t.rotation || [0, 0, 0, 1], 0, L.Quaternion[1]), d = ie.ComposeToRef(R.OneReadOnly, x, g, L.Matrix[1]);
              p.multiplyToRef(d, d), d.decompose(f, h, l), l.equalsToFloats(0, 0, 0) ? delete a.translation : a.translation = l.asArray(), B.IsIdentity(h) ? delete a.rotation : a.rotation = h.asArray(), f.equalsToFloats(1, 1, 1) ? delete a.scale : a.scale = f.asArray(), a.extensions || (a.extensions = {}), a.extensions[X] = c, i(null);
              return;
            }
          }
          t.extensions || (t.extensions = {}), t.extensions[X] = c;
        }
      }
      i(t);
    });
  }
}
V.RegisterExtension(X, (E) => new ve(E));
const ue = "KHR_materials_clearcoat";
class ke {
  constructor(e) {
    this.name = ue, this.enabled = !0, this.required = !1, this._wasUsed = !1, this._exporter = e;
  }
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  postExportMaterialAdditionalTextures(e, t, s) {
    const n = [];
    return s instanceof Z && s.clearCoat.isEnabled ? (s.clearCoat.texture && n.push(s.clearCoat.texture), !s.clearCoat.useRoughnessFromMainTexture && s.clearCoat.textureRoughness && n.push(s.clearCoat.textureRoughness), s.clearCoat.bumpTexture && n.push(s.clearCoat.bumpTexture), n) : [];
  }
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (s instanceof Z) {
        if (!s.clearCoat.isEnabled) {
          n(t);
          return;
        }
        this._wasUsed = !0, t.extensions = t.extensions || {};
        const i = this._exporter._glTFMaterialExporter._getTextureInfo(s.clearCoat.texture);
        let r;
        s.clearCoat.useRoughnessFromMainTexture ? r = this._exporter._glTFMaterialExporter._getTextureInfo(s.clearCoat.texture) : r = this._exporter._glTFMaterialExporter._getTextureInfo(s.clearCoat.textureRoughness), s.clearCoat.isTintEnabled && F.Warn(`Clear Color tint is not supported for glTF export. Ignoring for: ${s.name}`), s.clearCoat.remapF0OnInterfaceChange && F.Warn(`Clear Color F0 remapping is not supported for glTF export. Ignoring for: ${s.name}`);
        const o = this._exporter._glTFMaterialExporter._getTextureInfo(s.clearCoat.bumpTexture), c = {
          clearcoatFactor: s.clearCoat.intensity,
          clearcoatTexture: i ?? void 0,
          clearcoatRoughnessFactor: s.clearCoat.roughness,
          clearcoatRoughnessTexture: r ?? void 0,
          clearcoatNormalTexture: o ?? void 0,
          hasTextures: () => c.clearcoatTexture !== null || c.clearcoatRoughnessTexture !== null || c.clearcoatRoughnessTexture !== null
        };
        t.extensions[ue] = c;
      }
      n(t);
    });
  }
}
V.RegisterExtension(ue, (E) => new ke(E));
const le = "KHR_materials_iridescence";
class Me {
  constructor(e) {
    this.name = le, this.enabled = !0, this.required = !1, this._wasUsed = !1, this._exporter = e;
  }
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  postExportMaterialAdditionalTextures(e, t, s) {
    const n = [];
    return s instanceof Z && s.iridescence.isEnabled ? (s.iridescence.texture && n.push(s.iridescence.texture), s.iridescence.thicknessTexture && s.iridescence.thicknessTexture !== s.iridescence.texture && n.push(s.iridescence.thicknessTexture), n) : [];
  }
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (s instanceof Z) {
        if (!s.iridescence.isEnabled) {
          n(t);
          return;
        }
        this._wasUsed = !0, t.extensions = t.extensions || {};
        const i = this._exporter._glTFMaterialExporter._getTextureInfo(s.iridescence.texture), r = this._exporter._glTFMaterialExporter._getTextureInfo(s.iridescence.thicknessTexture), o = {
          iridescenceFactor: s.iridescence.intensity,
          iridescenceIor: s.iridescence.indexOfRefraction,
          iridescenceThicknessMinimum: s.iridescence.minimumThickness,
          iridescenceThicknessMaximum: s.iridescence.maximumThickness,
          iridescenceTexture: i ?? void 0,
          iridescenceThicknessTexture: r ?? void 0,
          hasTextures: () => o.iridescenceTexture !== null || o.iridescenceThicknessTexture !== null
        };
        t.extensions[le] = o;
      }
      n(t);
    });
  }
}
V.RegisterExtension(le, (E) => new Me(E));
const fe = "KHR_materials_anisotropy";
class Ne {
  constructor(e) {
    this.name = fe, this.enabled = !0, this.required = !1, this._wasUsed = !1, this._exporter = e;
  }
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  postExportMaterialAdditionalTextures(e, t, s) {
    const n = [];
    return s instanceof Z && s.anisotropy.isEnabled && !s.anisotropy.legacy ? (s.anisotropy.texture && n.push(s.anisotropy.texture), n) : [];
  }
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (s instanceof Z) {
        if (!s.anisotropy.isEnabled || s.anisotropy.legacy) {
          n(t);
          return;
        }
        this._wasUsed = !0, t.extensions = t.extensions || {};
        const i = this._exporter._glTFMaterialExporter._getTextureInfo(s.anisotropy.texture), r = {
          anisotropyStrength: s.anisotropy.intensity,
          anisotropyRotation: s.anisotropy.angle,
          anisotropyTexture: i ?? void 0,
          hasTextures: () => r.anisotropyTexture !== null
        };
        t.extensions[fe] = r;
      }
      n(t);
    });
  }
}
V.RegisterExtension(fe, (E) => new Ne(E));
const he = "KHR_materials_sheen";
class Ue {
  constructor(e) {
    this.name = he, this.enabled = !0, this.required = !1, this._wasUsed = !1, this._exporter = e;
  }
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  postExportMaterialAdditionalTextures(e, t, s) {
    return s instanceof j && s.sheen.isEnabled && s.sheen.texture ? [s.sheen.texture] : [];
  }
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (s instanceof j) {
        if (!s.sheen.isEnabled) {
          n(t);
          return;
        }
        this._wasUsed = !0, t.extensions == null && (t.extensions = {});
        const i = {
          sheenColorFactor: s.sheen.color.asArray(),
          sheenRoughnessFactor: s.sheen.roughness ?? 0,
          hasTextures: () => i.sheenColorTexture !== null || i.sheenRoughnessTexture !== null
        };
        s.sheen.texture && (i.sheenColorTexture = this._exporter._glTFMaterialExporter._getTextureInfo(s.sheen.texture) ?? void 0), s.sheen.textureRoughness && !s.sheen.useRoughnessFromMainTexture ? i.sheenRoughnessTexture = this._exporter._glTFMaterialExporter._getTextureInfo(s.sheen.textureRoughness) ?? void 0 : s.sheen.texture && s.sheen.useRoughnessFromMainTexture && (i.sheenRoughnessTexture = this._exporter._glTFMaterialExporter._getTextureInfo(s.sheen.texture) ?? void 0), t.extensions[he] = i;
      }
      n(t);
    });
  }
}
V.RegisterExtension(he, (E) => new Ue(E));
const pe = "KHR_materials_unlit";
class Be {
  constructor() {
    this.name = pe, this.enabled = !0, this.required = !1, this._wasUsed = !1;
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  dispose() {
  }
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      let i = !1;
      s instanceof j ? i = s.unlit : s instanceof Ye && (i = s.disableLighting), i && (this._wasUsed = !0, t.extensions == null && (t.extensions = {}), t.extensions[pe] = {}), n(t);
    });
  }
}
V.RegisterExtension(pe, () => new Be());
const de = "KHR_materials_ior";
class Pe {
  constructor() {
    this.name = de, this.enabled = !0, this.required = !1, this._wasUsed = !1;
  }
  /** Dispose */
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  _isExtensionEnabled(e) {
    return e.unlit ? !1 : e.indexOfRefraction != null && e.indexOfRefraction != 1.5;
  }
  /**
   * After exporting a material
   * @param context GLTF context of the material
   * @param node exported GLTF node
   * @param babylonMaterial corresponding babylon material
   * @returns promise, resolves with the material
   */
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (s instanceof j && this._isExtensionEnabled(s)) {
        this._wasUsed = !0;
        const i = {
          ior: s.indexOfRefraction
        };
        t.extensions = t.extensions || {}, t.extensions[de] = i;
      }
      n(t);
    });
  }
}
V.RegisterExtension(de, (E) => new Pe());
const ge = "KHR_materials_specular";
class De {
  constructor(e) {
    this.name = ge, this.enabled = !0, this.required = !1, this._wasUsed = !1, this._exporter = e;
  }
  /** Dispose */
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  /**
   * After exporting a material, deal with the additional textures
   * @param context GLTF context of the material
   * @param node exported GLTF node
   * @param babylonMaterial corresponding babylon material
   * @returns array of additional textures to export
   */
  postExportMaterialAdditionalTextures(e, t, s) {
    const n = [];
    return s instanceof j && this._isExtensionEnabled(s) && (s.metallicReflectanceTexture && n.push(s.metallicReflectanceTexture), s.reflectanceTexture && n.push(s.reflectanceTexture)), n;
  }
  _isExtensionEnabled(e) {
    return e.unlit ? !1 : e.metallicF0Factor != null && e.metallicF0Factor != 1 || e.metallicReflectanceColor != null && !e.metallicReflectanceColor.equalsFloats(1, 1, 1) || this._hasTexturesExtension(e);
  }
  _hasTexturesExtension(e) {
    return e.metallicReflectanceTexture != null || e.reflectanceTexture != null;
  }
  /**
   * After exporting a material
   * @param context GLTF context of the material
   * @param node exported GLTF node
   * @param babylonMaterial corresponding babylon material
   * @returns promise, resolves with the material
   */
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (s instanceof j && this._isExtensionEnabled(s)) {
        this._wasUsed = !0, t.extensions = t.extensions || {};
        const i = this._exporter._glTFMaterialExporter._getTextureInfo(s.metallicReflectanceTexture) ?? void 0, r = this._exporter._glTFMaterialExporter._getTextureInfo(s.reflectanceTexture) ?? void 0, o = s.metallicF0Factor == 1 ? void 0 : s.metallicF0Factor, c = s.metallicReflectanceColor.equalsFloats(1, 1, 1) ? void 0 : s.metallicReflectanceColor.asArray(), u = {
          specularFactor: o,
          specularTexture: i,
          specularColorFactor: c,
          specularColorTexture: r,
          hasTextures: () => this._hasTexturesExtension(s)
        };
        t.extensions[ge] = u;
      }
      n(t);
    });
  }
}
V.RegisterExtension(ge, (E) => new De(E));
const xe = "KHR_materials_volume";
class Oe {
  constructor(e) {
    this.name = xe, this.enabled = !0, this.required = !1, this._wasUsed = !1, this._exporter = e;
  }
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  /**
   * After exporting a material, deal with additional textures
   * @param context GLTF context of the material
   * @param node exported GLTF node
   * @param babylonMaterial corresponding babylon material
   * @returns array of additional textures to export
   */
  postExportMaterialAdditionalTextures(e, t, s) {
    const n = [];
    return s instanceof j && this._isExtensionEnabled(s) && s.subSurface.thicknessTexture && n.push(s.subSurface.thicknessTexture), n;
  }
  _isExtensionEnabled(e) {
    if (e.unlit)
      return !1;
    const t = e.subSurface;
    return !t.isRefractionEnabled && !t.isTranslucencyEnabled ? !1 : t.maximumThickness != null && t.maximumThickness != 0 || t.tintColorAtDistance != null && t.tintColorAtDistance != Number.POSITIVE_INFINITY || t.tintColor != null && t.tintColor != z.White() || this._hasTexturesExtension(e);
  }
  _hasTexturesExtension(e) {
    return e.subSurface.thicknessTexture != null;
  }
  /**
   * After exporting a material
   * @param context GLTF context of the material
   * @param node exported GLTF node
   * @param babylonMaterial corresponding babylon material
   * @returns promise that resolves with the updated node
   */
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (s instanceof j && this._isExtensionEnabled(s)) {
        this._wasUsed = !0;
        const i = s.subSurface, r = i.maximumThickness == 0 ? void 0 : i.maximumThickness, o = this._exporter._glTFMaterialExporter._getTextureInfo(i.thicknessTexture) ?? void 0, c = i.tintColorAtDistance == Number.POSITIVE_INFINITY ? void 0 : i.tintColorAtDistance, u = i.tintColor.equalsFloats(1, 1, 1) ? void 0 : i.tintColor.asArray(), a = {
          thicknessFactor: r,
          thicknessTexture: o,
          attenuationDistance: c,
          attenuationColor: u,
          hasTextures: () => this._hasTexturesExtension(s)
        };
        t.extensions = t.extensions || {}, t.extensions[xe] = a;
      }
      n(t);
    });
  }
}
V.RegisterExtension(xe, (E) => new Oe(E));
const _e = "KHR_materials_dispersion";
class Le {
  /** Constructor */
  constructor() {
    this.name = _e, this.enabled = !0, this.required = !1, this._wasUsed = !1;
  }
  /** Dispose */
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  _isExtensionEnabled(e) {
    if (e.unlit)
      return !1;
    const t = e.subSurface;
    return !(!t.isRefractionEnabled && !t.isDispersionEnabled);
  }
  /**
   * After exporting a material
   * @param context GLTF context of the material
   * @param node exported GLTF node
   * @param babylonMaterial corresponding babylon material
   * @returns promise, resolves with the material
   */
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (s instanceof j && this._isExtensionEnabled(s)) {
        this._wasUsed = !0;
        const o = {
          dispersion: s.subSurface.dispersion
        };
        t.extensions = t.extensions || {}, t.extensions[_e] = o;
      }
      n(t);
    });
  }
}
V.RegisterExtension(_e, () => new Le());
const me = "KHR_materials_transmission";
class Ke {
  constructor(e) {
    this.name = me, this.enabled = !0, this.required = !1, this._wasUsed = !1, this._exporter = e;
  }
  /** Dispose */
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  /**
   * After exporting a material, deal with additional textures
   * @param context GLTF context of the material
   * @param node exported GLTF node
   * @param babylonMaterial corresponding babylon material
   * @returns array of additional textures to export
   */
  postExportMaterialAdditionalTextures(e, t, s) {
    const n = [];
    return s instanceof j && this._isExtensionEnabled(s) && s.subSurface.thicknessTexture && n.push(s.subSurface.thicknessTexture), n;
  }
  _isExtensionEnabled(e) {
    if (e.unlit)
      return !1;
    const t = e.subSurface;
    return t.isRefractionEnabled && t.refractionIntensity != null && t.refractionIntensity != 0 || this._hasTexturesExtension(e);
  }
  _hasTexturesExtension(e) {
    return e.subSurface.refractionIntensityTexture != null;
  }
  /**
   * After exporting a material
   * @param context GLTF context of the material
   * @param node exported GLTF node
   * @param babylonMaterial corresponding babylon material
   * @returns true if successful
   */
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (s instanceof j && this._isExtensionEnabled(s)) {
        this._wasUsed = !0;
        const i = s.subSurface, r = i.refractionIntensity === 0 ? void 0 : i.refractionIntensity, o = this._exporter._glTFMaterialExporter._getTextureInfo(i.refractionIntensityTexture) ?? void 0, c = {
          transmissionFactor: r,
          transmissionTexture: o,
          hasTextures: () => this._hasTexturesExtension(s)
        };
        t.extensions = t.extensions || {}, t.extensions[me] = c;
      }
      n(t);
    });
  }
}
V.RegisterExtension(me, (E) => new Ke(E));
const Te = "EXT_mesh_gpu_instancing";
class ze {
  constructor(e) {
    this.name = Te, this.enabled = !0, this.required = !1, this._wasUsed = !1, this._exporter = e;
  }
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  /**
   * After node is exported
   * @param context the GLTF context when loading the asset
   * @param node the node exported
   * @param babylonNode the corresponding babylon node
   * @param nodeMap map from babylon node id to node index
   * @param binaryWriter binary writer
   * @returns nullable promise, resolves with the node
   */
  postExportNodeAsync(e, t, s, n, i) {
    return new Promise((r) => {
      if (t && s instanceof G && s.hasThinInstances && i) {
        this._wasUsed = !0;
        const o = R.Zero(), c = B.Identity(), u = R.One(), a = s.thinInstanceGetWorldMatrices(), l = L.Vector3[2], h = L.Quaternion[1], f = L.Vector3[3];
        let p = !1, g = !1, x = !1;
        const d = new Float32Array(s.thinInstanceCount * 3), _ = new Float32Array(s.thinInstanceCount * 4), m = new Float32Array(s.thinInstanceCount * 3);
        let A = 0;
        for (const C of a)
          C.decompose(f, h, l), d.set(l.asArray(), A * 3), _.set(h.normalize().asArray(), A * 4), m.set(f.asArray(), A * 3), p = p || !l.equalsWithEpsilon(o), g = g || !h.equalsWithEpsilon(c), x = x || !f.equalsWithEpsilon(u), A++;
        const w = {
          attributes: {}
        };
        p && (w.attributes.TRANSLATION = this._buildAccessor(
          d,
          "VEC3",
          s.thinInstanceCount,
          i,
          5126
          /* AccessorComponentType.FLOAT */
        )), g && (w.attributes.ROTATION = this._buildAccessor(_, "VEC4", s.thinInstanceCount, i, 5126)), x && (w.attributes.SCALE = this._buildAccessor(
          m,
          "VEC3",
          s.thinInstanceCount,
          i,
          5126
          /* AccessorComponentType.FLOAT */
        )), t.extensions = t.extensions || {}, t.extensions[Te] = w;
      }
      r(t);
    });
  }
  _buildAccessor(e, t, s, n, i) {
    const r = n.getByteOffset();
    switch (i) {
      case 5126: {
        for (let l = 0; l != e.length; l++)
          n.setFloat32(e[l]);
        break;
      }
      case 5120: {
        for (let l = 0; l != e.length; l++)
          n.setByte(e[l] * 127);
        break;
      }
      case 5122: {
        for (let l = 0; l != e.length; l++)
          n.setInt16(e[l] * 32767);
        break;
      }
    }
    const o = { buffer: 0, byteOffset: r, byteLength: e.length * T.GetTypeByteLength(i) }, c = this._exporter._bufferViews.length;
    this._exporter._bufferViews.push(o);
    const u = this._exporter._accessors.length, a = {
      bufferView: c,
      componentType: i,
      count: s,
      type: t,
      normalized: i == 5120 || i == 5122
    };
    return this._exporter._accessors.push(a), u;
  }
}
V.RegisterExtension(Te, (E) => new ze(E));
const Ee = "KHR_materials_emissive_strength";
class qe {
  constructor() {
    this.name = Ee, this.enabled = !0, this.required = !1, this._wasUsed = !1;
  }
  /** Dispose */
  dispose() {
  }
  /** @internal */
  get wasUsed() {
    return this._wasUsed;
  }
  /**
   * After exporting a material
   * @param context GLTF context of the material
   * @param node exported GLTF node
   * @param babylonMaterial corresponding babylon material
   * @returns promise, resolves with the material
   */
  postExportMaterialAsync(e, t, s) {
    return new Promise((n) => {
      if (!(s instanceof j))
        return n(t);
      const i = s.emissiveColor.asArray(), r = Math.max(...i);
      if (r > 1) {
        this._wasUsed = !0, t.extensions || (t.extensions = {});
        const o = {
          emissiveStrength: r
        }, c = s.emissiveColor.scale(1 / o.emissiveStrength);
        t.emissiveFactor = c.asArray(), t.extensions[Ee] = o;
      }
      return n(t);
    });
  }
}
V.RegisterExtension(Ee, (E) => new qe());
class nt {
  /**
   * Exports the geometry of a Mesh array in .STL file format (ASCII)
   * @param meshes list defines the mesh to serialize
   * @param download triggers the automatic download of the file.
   * @param fileName changes the downloads fileName.
   * @param binary changes the STL to a binary type.
   * @param isLittleEndian toggle for binary type exporter.
   * @param doNotBakeTransform toggle if meshes transforms should be baked or not.
   * @param supportInstancedMeshes toggle to export instanced Meshes. Enabling support for instanced meshes will override doNoBakeTransform as true
   * @param exportIndividualMeshes toggle to export each mesh as an independent mesh. By default, all the meshes are combined into one mesh. This property has no effect when exporting in binary format
   * @returns the STL as UTF8 string
   */
  static CreateSTL(e, t = !0, s = "stlmesh", n = !1, i = !0, r = !1, o = !1, c = !1) {
    const u = function(x, d, _) {
      const m = [x[_] * 3, x[_ + 1] * 3, x[_ + 2] * 3], A = [
        new R(d[m[0]], d[m[0] + 2], d[m[0] + 1]),
        new R(d[m[1]], d[m[1] + 2], d[m[1] + 1]),
        new R(d[m[2]], d[m[2] + 2], d[m[2] + 1])
      ], w = A[0].subtract(A[1]), C = A[2].subtract(A[1]), y = R.Cross(C, w).normalize();
      return { v: A, n: y };
    }, a = function(x, d, _, m) {
      return d = l(x, d, _.x, m), d = l(x, d, _.y, m), l(x, d, _.z, m);
    }, l = function(x, d, _, m) {
      return x.setFloat32(d, _, m), d + 4;
    }, h = function(x) {
      if (o) {
        let d = x;
        x instanceof se && (d = x.sourceMesh);
        const _ = d.getVerticesData(T.PositionKind, !0, !0);
        if (!_)
          return [];
        const m = R.Zero();
        let A;
        for (A = 0; A < _.length; A += 3)
          R.TransformCoordinatesFromFloatsToRef(_[A], _[A + 1], _[A + 2], x.computeWorldMatrix(!0), m).toArray(_, A);
        return _;
      } else
        return x.getVerticesData(T.PositionKind) || [];
    };
    o && (r = !0);
    let f = "", p = 0, g = 0;
    if (n) {
      for (let _ = 0; _ < e.length; _++) {
        const A = e[_].getIndices();
        p += A ? A.length / 3 : 0;
      }
      const x = 84 + 50 * p, d = new ArrayBuffer(x);
      f = new DataView(d), g += 80, f.setUint32(g, p, i), g += 4;
    } else
      c || (f = `solid stlmesh\r
`);
    for (let x = 0; x < e.length; x++) {
      const d = e[x];
      !n && c && (f += "solid " + d.name + `\r
`), !r && d instanceof G && d.bakeCurrentTransformIntoVertices();
      const _ = h(d), m = d.getIndices() || [];
      for (let A = 0; A < m.length; A += 3) {
        const w = u(m, _, A);
        n ? (g = a(f, g, w.n, i), g = a(f, g, w.v[0], i), g = a(f, g, w.v[1], i), g = a(f, g, w.v[2], i), g += 2) : (f += "	facet normal " + w.n.x + " " + w.n.y + " " + w.n.z + `\r
`, f += `		outer loop\r
`, f += "			vertex " + w.v[0].x + " " + w.v[0].y + " " + w.v[0].z + `\r
`, f += "			vertex " + w.v[1].x + " " + w.v[1].y + " " + w.v[1].z + `\r
`, f += "			vertex " + w.v[2].x + " " + w.v[2].y + " " + w.v[2].z + `\r
`, f += `		endloop\r
`, f += `	endfacet\r
`);
      }
      !n && c && (f += "endsolid " + name + `\r
`);
    }
    if (!n && !c && (f += "endsolid stlmesh"), t) {
      const x = document.createElement("a"), d = new Blob([f], { type: "application/octet-stream" });
      x.href = window.URL.createObjectURL(d), x.download = s + ".stl", x.click();
    }
    return f;
  }
}
const It = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  EXT_mesh_gpu_instancing: ze,
  GLTF2Export: st,
  GLTFData: ce,
  KHR_lights_punctual: ve,
  KHR_materials_anisotropy: Ne,
  KHR_materials_clearcoat: ke,
  KHR_materials_dispersion: Le,
  KHR_materials_emissive_strength: qe,
  KHR_materials_ior: Pe,
  KHR_materials_iridescence: Me,
  KHR_materials_sheen: Ue,
  KHR_materials_specular: De,
  KHR_materials_transmission: Ke,
  KHR_materials_unlit: Be,
  KHR_materials_volume: Oe,
  KHR_texture_transform: Ve,
  OBJExport: Qe,
  STLExport: nt,
  _BinaryWriter: ye,
  _Exporter: V,
  _GLTFAnimation: M,
  _GLTFMaterialExporter: v,
  _GLTFUtilities: U,
  __IGLTFExporterExtension: Xe,
  __IGLTFExporterExtensionV2: tt
}, Symbol.toStringTag, { value: "Module" }));
export {
  It as s
};
//# sourceMappingURL=index-CNDNXOqF.js.map
