import { d as p, L as T, h as c } from "./embed-entry-BgvWRWVI.js";
import { L as u } from "./lightConstants-BXeaZQS1.js";
function W(a) {
  a.indexOf("vClipPlane") === -1 && a.push("vClipPlane"), a.indexOf("vClipPlane2") === -1 && a.push("vClipPlane2"), a.indexOf("vClipPlane3") === -1 && a.push("vClipPlane3"), a.indexOf("vClipPlane4") === -1 && a.push("vClipPlane4"), a.indexOf("vClipPlane5") === -1 && a.push("vClipPlane5"), a.indexOf("vClipPlane6") === -1 && a.push("vClipPlane6");
}
function B(a, t, r) {
  const e = !!(a.clipPlane ?? t.clipPlane), o = !!(a.clipPlane2 ?? t.clipPlane2), l = !!(a.clipPlane3 ?? t.clipPlane3), n = !!(a.clipPlane4 ?? t.clipPlane4), E = !!(a.clipPlane5 ?? t.clipPlane5), S = !!(a.clipPlane6 ?? t.clipPlane6);
  e && r.push("#define CLIPPLANE"), o && r.push("#define CLIPPLANE2"), l && r.push("#define CLIPPLANE3"), n && r.push("#define CLIPPLANE4"), E && r.push("#define CLIPPLANE5"), S && r.push("#define CLIPPLANE6");
}
function N(a, t, r) {
  let e = !1;
  const o = !!(a.clipPlane ?? t.clipPlane), l = !!(a.clipPlane2 ?? t.clipPlane2), n = !!(a.clipPlane3 ?? t.clipPlane3), E = !!(a.clipPlane4 ?? t.clipPlane4), S = !!(a.clipPlane5 ?? t.clipPlane5), P = !!(a.clipPlane6 ?? t.clipPlane6);
  return r.CLIPPLANE !== o && (r.CLIPPLANE = o, e = !0), r.CLIPPLANE2 !== l && (r.CLIPPLANE2 = l, e = !0), r.CLIPPLANE3 !== n && (r.CLIPPLANE3 = n, e = !0), r.CLIPPLANE4 !== E && (r.CLIPPLANE4 = E, e = !0), r.CLIPPLANE5 !== S && (r.CLIPPLANE5 = S, e = !0), r.CLIPPLANE6 !== P && (r.CLIPPLANE6 = P, e = !0), e;
}
function G(a, t, r) {
  let e = t.clipPlane ?? r.clipPlane;
  A(a, "vClipPlane", e), e = t.clipPlane2 ?? r.clipPlane2, A(a, "vClipPlane2", e), e = t.clipPlane3 ?? r.clipPlane3, A(a, "vClipPlane3", e), e = t.clipPlane4 ?? r.clipPlane4, A(a, "vClipPlane4", e), e = t.clipPlane5 ?? r.clipPlane5, A(a, "vClipPlane5", e), e = t.clipPlane6 ?? r.clipPlane6, A(a, "vClipPlane6", e);
}
function A(a, t, r) {
  r && a.setFloat4(t, r.normal.x, r.normal.y, r.normal.z, r.d);
}
const s = c.Black(), i = { NUM_MORPH_INFLUENCERS: 0 };
function v(a, t, r) {
  if (!a || a.LOGARITHMICDEPTH || a.indexOf && a.indexOf("LOGARITHMICDEPTH") >= 0) {
    const e = r.activeCamera;
    e.mode === 1 && T.Error("Logarithmic depth is not compatible with orthographic cameras!", 20), t.setFloat("logarithmicDepthConstant", 2 / (Math.log(e.maxZ + 1) / Math.LN2));
  }
}
function h(a, t, r, e = !1) {
  r && a.fogEnabled && (!t || t.applyFog) && a.fogMode !== 0 && (r.setFloat4("vFogInfos", a.fogMode, a.fogStart, a.fogEnd, a.fogDensity), e ? (a.fogColor.toLinearSpaceToRef(s, a.getEngine().useExactSrgbConversions), r.setColor3("vFogColor", s)) : r.setColor3("vFogColor", a.fogColor));
}
function m(a, t, r) {
  i.NUM_MORPH_INFLUENCERS = r, L(a, t, i);
}
function L(a, t, r) {
  const e = r.NUM_MORPH_INFLUENCERS;
  if (e > 0 && p.LastCreatedEngine) {
    const o = p.LastCreatedEngine.getCaps().maxVertexAttribs, l = t.morphTargetManager;
    if (l?.isUsingTextureForTargets)
      return;
    const n = l && l.supportsNormals && r.NORMAL, E = l && l.supportsTangents && r.TANGENT, S = l && l.supportsUVs && r.UV1;
    for (let P = 0; P < e; P++)
      a.push("position" + P), n && a.push("normal" + P), E && a.push("tangent" + P), S && a.push("uv_" + P), a.length > o && T.Error("Cannot add more vertex attributes for mesh " + t.name);
  }
}
function C(a, t = !1) {
  a.push("world0"), a.push("world1"), a.push("world2"), a.push("world3"), t && (a.push("previousWorld0"), a.push("previousWorld1"), a.push("previousWorld2"), a.push("previousWorld3"));
}
function V(a, t) {
  const r = a.morphTargetManager;
  !a || !r || t.setFloatArray("morphTargetInfluences", r.influences);
}
function b(a, t) {
  t.bindToEffect(a, "Scene");
}
function x(a, t, r) {
  t._needUVs = !0, t[r] = !0, a.optimizeUVAllocation && a.getTextureMatrix().isIdentityAs3x2() ? (t[r + "DIRECTUV"] = a.coordinatesIndex + 1, t["MAINUV" + (a.coordinatesIndex + 1)] = !0) : t[r + "DIRECTUV"] = 0;
}
function w(a, t, r) {
  const e = a.getTextureMatrix();
  t.updateMatrix(r + "Matrix", e);
}
function k(a, t, r) {
  r.BAKED_VERTEX_ANIMATION_TEXTURE && r.INSTANCES && a.push("bakedVertexAnimationSettingsInstanced");
}
function R(a, t) {
  return t.set(a), t;
}
function X(a, t, r) {
  if (!(!t || !a) && (a.computeBonesUsingShaders && t._bonesComputationForcedToCPU && (a.computeBonesUsingShaders = !1), a.useBones && a.computeBonesUsingShaders && a.skeleton)) {
    const e = a.skeleton;
    if (e.isUsingTextureForMatrices && t.getUniformIndex("boneTextureWidth") > -1) {
      const o = e.getTransformMatrixTexture(a);
      t.setTexture("boneSampler", o), t.setFloat("boneTextureWidth", 4 * (e.bones.length + 1));
    } else {
      const o = e.getTransformMatrices(a);
      o && (t.setMatrices("mBones", o), r && a.getScene().prePassRenderer && a.getScene().prePassRenderer.getIndex(2) && (r.previousBones[a.uniqueId] || (r.previousBones[a.uniqueId] = o.slice()), t.setMatrices("mPreviousBones", r.previousBones[a.uniqueId]), R(o, r.previousBones[a.uniqueId])));
    }
  }
}
function Y(a, t, r) {
  a.transferToEffect(t, r + "");
}
function O(a, t, r, e, o, l = !0) {
  a._bindLight(t, r, e, o, l);
}
function q(a, t, r, e, o = 4) {
  const l = Math.min(t.lightSources.length, o);
  for (let n = 0; n < l; n++) {
    const E = t.lightSources[n];
    O(E, n, a, r, typeof e == "boolean" ? e : e.SPECULARTERM, t.receiveShadows);
  }
}
function Q(a, t, r, e) {
  r.NUM_BONE_INFLUENCERS > 0 && (e.addCPUSkinningFallback(0, t), a.push("matricesIndices"), a.push("matricesWeights"), r.NUM_BONE_INFLUENCERS > 4 && (a.push("matricesIndicesExtra"), a.push("matricesWeightsExtra")));
}
function z(a, t) {
  (t.INSTANCES || t.THIN_INSTANCES) && C(a, !!t.PREPASS_VELOCITY), t.INSTANCESCOLOR && a.push("instanceColor");
}
function Z(a, t, r = 4, e = 0) {
  let o = 0;
  for (let l = 0; l < r && a["LIGHT" + l]; l++)
    l > 0 && (o = e + l, t.addFallback(o, "LIGHT" + l)), a.SHADOWS || (a["SHADOW" + l] && t.addFallback(e, "SHADOW" + l), a["SHADOWPCF" + l] && t.addFallback(e, "SHADOWPCF" + l), a["SHADOWPCSS" + l] && t.addFallback(e, "SHADOWPCSS" + l), a["SHADOWPOISSON" + l] && t.addFallback(e, "SHADOWPOISSON" + l), a["SHADOWESM" + l] && t.addFallback(e, "SHADOWESM" + l), a["SHADOWCLOSEESM" + l] && t.addFallback(e, "SHADOWCLOSEESM" + l));
  return o++;
}
function D(a, t) {
  return t.fogEnabled && a.applyFog && t.fogMode !== 0;
}
function j(a, t, r, e, o, l, n, E = !1) {
  n._areMiscDirty && (n.LOGARITHMICDEPTH = r, n.POINTSIZE = e, n.FOG = o && D(a, t), n.NONUNIFORMSCALING = a.nonUniformScaling, n.ALPHATEST = l, n.DECAL_AFTER_DETAIL = E);
}
function K(a, t, r, e, o = 4, l = !1) {
  if (!r._areLightsDirty)
    return r._needNormals;
  let n = 0;
  const E = {
    needNormals: r._needNormals,
    needRebuild: !1,
    lightmapMode: !1,
    shadowEnabled: !1,
    specularEnabled: !1
  };
  if (a.lightsEnabled && !l) {
    for (const P of t.lightSources)
      if (_(a, t, P, n, r, e, E), n++, n === o)
        break;
  }
  r.SPECULARTERM = E.specularEnabled, r.SHADOWS = E.shadowEnabled;
  for (let P = n; P < o; P++)
    r["LIGHT" + P] !== void 0 && (r["LIGHT" + P] = !1, r["HEMILIGHT" + P] = !1, r["POINTLIGHT" + P] = !1, r["DIRLIGHT" + P] = !1, r["SPOTLIGHT" + P] = !1, r["SHADOW" + P] = !1, r["SHADOWCSM" + P] = !1, r["SHADOWCSMDEBUG" + P] = !1, r["SHADOWCSMNUM_CASCADES" + P] = !1, r["SHADOWCSMUSESHADOWMAXZ" + P] = !1, r["SHADOWCSMNOBLEND" + P] = !1, r["SHADOWCSM_RIGHTHANDED" + P] = !1, r["SHADOWPCF" + P] = !1, r["SHADOWPCSS" + P] = !1, r["SHADOWPOISSON" + P] = !1, r["SHADOWESM" + P] = !1, r["SHADOWCLOSEESM" + P] = !1, r["SHADOWCUBE" + P] = !1, r["SHADOWLOWQUALITY" + P] = !1, r["SHADOWMEDIUMQUALITY" + P] = !1);
  const S = a.getEngine().getCaps();
  return r.SHADOWFLOAT === void 0 && (E.needRebuild = !0), r.SHADOWFLOAT = E.shadowEnabled && (S.textureFloatRender && S.textureFloatLinearFiltering || S.textureHalfFloatRender && S.textureHalfFloatLinearFiltering), r.LIGHTMAPEXCLUDED = E.lightmapMode, E.needRebuild && r.rebuild(), E.needNormals;
}
function _(a, t, r, e, o, l, n) {
  switch (n.needNormals = !0, o["LIGHT" + e] === void 0 && (n.needRebuild = !0), o["LIGHT" + e] = !0, o["SPOTLIGHT" + e] = !1, o["HEMILIGHT" + e] = !1, o["POINTLIGHT" + e] = !1, o["DIRLIGHT" + e] = !1, r.prepareLightSpecificDefines(o, e), o["LIGHT_FALLOFF_PHYSICAL" + e] = !1, o["LIGHT_FALLOFF_GLTF" + e] = !1, o["LIGHT_FALLOFF_STANDARD" + e] = !1, r.falloffType) {
    case u.FALLOFF_GLTF:
      o["LIGHT_FALLOFF_GLTF" + e] = !0;
      break;
    case u.FALLOFF_PHYSICAL:
      o["LIGHT_FALLOFF_PHYSICAL" + e] = !0;
      break;
    case u.FALLOFF_STANDARD:
      o["LIGHT_FALLOFF_STANDARD" + e] = !0;
      break;
  }
  if (l && !r.specular.equalsFloats(0, 0, 0) && (n.specularEnabled = !0), o["SHADOW" + e] = !1, o["SHADOWCSM" + e] = !1, o["SHADOWCSMDEBUG" + e] = !1, o["SHADOWCSMNUM_CASCADES" + e] = !1, o["SHADOWCSMUSESHADOWMAXZ" + e] = !1, o["SHADOWCSMNOBLEND" + e] = !1, o["SHADOWCSM_RIGHTHANDED" + e] = !1, o["SHADOWPCF" + e] = !1, o["SHADOWPCSS" + e] = !1, o["SHADOWPOISSON" + e] = !1, o["SHADOWESM" + e] = !1, o["SHADOWCLOSEESM" + e] = !1, o["SHADOWCUBE" + e] = !1, o["SHADOWLOWQUALITY" + e] = !1, o["SHADOWMEDIUMQUALITY" + e] = !1, t && t.receiveShadows && a.shadowsEnabled && r.shadowEnabled) {
    const E = r.getShadowGenerator(a.activeCamera) ?? r.getShadowGenerator();
    if (E) {
      const S = E.getShadowMap();
      S && S.renderList && S.renderList.length > 0 && (n.shadowEnabled = !0, E.prepareDefines(o, e));
    }
  }
  r.lightmapMode != u.LIGHTMAP_DEFAULT ? (n.lightmapMode = !0, o["LIGHTMAPEXCLUDED" + e] = !0, o["LIGHTMAPNOSPECULAR" + e] = r.lightmapMode == u.LIGHTMAP_SHADOWSONLY) : (o["LIGHTMAPEXCLUDED" + e] = !1, o["LIGHTMAPNOSPECULAR" + e] = !1);
}
function J(a, t, r, e, o, l = null, n = !1) {
  let E = H(a, e);
  l !== !1 && (E = N(r, a, e)), e.DEPTHPREPASS !== !t.getColorWrite() && (e.DEPTHPREPASS = !e.DEPTHPREPASS, E = !0), e.INSTANCES !== o && (e.INSTANCES = o, E = !0), e.THIN_INSTANCES !== n && (e.THIN_INSTANCES = n, E = !0), E && e.markAsUnprocessed();
}
function I(a, t) {
  if (a.useBones && a.computeBonesUsingShaders && a.skeleton) {
    t.NUM_BONE_INFLUENCERS = a.numBoneInfluencers;
    const r = t.BONETEXTURE !== void 0;
    if (a.skeleton.isUsingTextureForMatrices && r)
      t.BONETEXTURE = !0;
    else {
      t.BonesPerMesh = a.skeleton.bones.length + 1, t.BONETEXTURE = r ? !1 : void 0;
      const e = a.getScene().prePassRenderer;
      if (e && e.enabled) {
        const o = e.excludedSkinnedMesh.indexOf(a) === -1;
        t.BONES_VELOCITY_ENABLED = o;
      }
    }
  } else
    t.NUM_BONE_INFLUENCERS = 0, t.BonesPerMesh = 0, t.BONETEXTURE !== void 0 && (t.BONETEXTURE = !1);
}
function M(a, t) {
  const r = a.morphTargetManager;
  r ? (t.MORPHTARGETS_UV = r.supportsUVs && t.UV1, t.MORPHTARGETS_TANGENT = r.supportsTangents && t.TANGENT, t.MORPHTARGETS_NORMAL = r.supportsNormals && t.NORMAL, t.NUM_MORPH_INFLUENCERS = r.numMaxInfluencers || r.numInfluencers, t.MORPHTARGETS = t.NUM_MORPH_INFLUENCERS > 0, t.MORPHTARGETS_TEXTURE = r.isUsingTextureForTargets) : (t.MORPHTARGETS_UV = !1, t.MORPHTARGETS_TANGENT = !1, t.MORPHTARGETS_NORMAL = !1, t.MORPHTARGETS = !1, t.NUM_MORPH_INFLUENCERS = 0);
}
function F(a, t) {
  const r = a.bakedVertexAnimationManager;
  t.BAKED_VERTEX_ANIMATION_TEXTURE = !!(r && r.isEnabled);
}
function $(a, t, r, e, o = !1, l = !0, n = !0) {
  if (!t._areAttributesDirty && t._needNormals === t._normals && t._needUVs === t._uvs)
    return !1;
  t._normals = t._needNormals, t._uvs = t._needUVs, t.NORMAL = t._needNormals && a.isVerticesDataPresent("normal"), t._needNormals && a.isVerticesDataPresent("tangent") && (t.TANGENT = !0);
  for (let E = 1; E <= 6; ++E)
    t["UV" + E] = t._needUVs ? a.isVerticesDataPresent(`uv${E === 1 ? "" : E}`) : !1;
  if (r) {
    const E = a.useVertexColors && a.isVerticesDataPresent("color");
    t.VERTEXCOLOR = E, t.VERTEXALPHA = a.hasVertexAlpha && E && l;
  }
  return a.isVerticesDataPresent("instanceColor") && (a.hasInstances || a.hasThinInstances) && (t.INSTANCESCOLOR = !0), e && I(a, t), o && M(a, t), n && F(a, t), !0;
}
function y(a, t) {
  if (a.activeCamera) {
    const r = t.MULTIVIEW;
    t.MULTIVIEW = a.activeCamera.outputRenderTarget !== null && a.activeCamera.outputRenderTarget.getViewCount() > 1, t.MULTIVIEW != r && t.markAsUnprocessed();
  }
}
function d(a, t, r) {
  const e = t.ORDER_INDEPENDENT_TRANSPARENCY, o = t.ORDER_INDEPENDENT_TRANSPARENCY_16BITS;
  t.ORDER_INDEPENDENT_TRANSPARENCY = a.useOrderIndependentTransparency && r, t.ORDER_INDEPENDENT_TRANSPARENCY_16BITS = !a.getEngine().getCaps().textureFloatLinearFiltering, (e !== t.ORDER_INDEPENDENT_TRANSPARENCY || o !== t.ORDER_INDEPENDENT_TRANSPARENCY_16BITS) && t.markAsUnprocessed();
}
function aa(a, t, r) {
  const e = t.PREPASS;
  if (!t._arePrePassDirty)
    return;
  const o = [
    {
      type: 1,
      define: "PREPASS_POSITION",
      index: "PREPASS_POSITION_INDEX"
    },
    {
      type: 2,
      define: "PREPASS_VELOCITY",
      index: "PREPASS_VELOCITY_INDEX"
    },
    {
      type: 3,
      define: "PREPASS_REFLECTIVITY",
      index: "PREPASS_REFLECTIVITY_INDEX"
    },
    {
      type: 0,
      define: "PREPASS_IRRADIANCE",
      index: "PREPASS_IRRADIANCE_INDEX"
    },
    {
      type: 7,
      define: "PREPASS_ALBEDO_SQRT",
      index: "PREPASS_ALBEDO_SQRT_INDEX"
    },
    {
      type: 5,
      define: "PREPASS_DEPTH",
      index: "PREPASS_DEPTH_INDEX"
    },
    {
      type: 6,
      define: "PREPASS_NORMAL",
      index: "PREPASS_NORMAL_INDEX"
    }
  ];
  if (a.prePassRenderer && a.prePassRenderer.enabled && r) {
    t.PREPASS = !0, t.SCENE_MRT_COUNT = a.prePassRenderer.mrtCount, t.PREPASS_NORMAL_WORLDSPACE = a.prePassRenderer.generateNormalsInWorldSpace;
    for (let l = 0; l < o.length; l++) {
      const n = a.prePassRenderer.getIndex(o[l].type);
      n !== -1 ? (t[o[l].define] = !0, t[o[l].index] = n) : t[o[l].define] = !1;
    }
  } else {
    t.PREPASS = !1;
    for (let l = 0; l < o.length; l++)
      t[o[l].define] = !1;
  }
  t.PREPASS != e && (t.markAsUnprocessed(), t.markAsImageProcessingDirty());
}
function H(a, t) {
  let r = !1;
  if (a.activeCamera) {
    const e = t.CAMERA_ORTHOGRAPHIC ? 1 : 0, o = t.CAMERA_PERSPECTIVE ? 1 : 0, l = a.activeCamera.mode === 1 ? 1 : 0, n = a.activeCamera.mode === 0 ? 1 : 0;
    (e ^ l || o ^ n) && (t.CAMERA_ORTHOGRAPHIC = l === 1, t.CAMERA_PERSPECTIVE = n === 1, r = !0);
  }
  return r;
}
function U(a, t, r, e, o = null, l = !1) {
  o && o.push("Light" + a), !l && (t.push("vLightData" + a, "vLightDiffuse" + a, "vLightSpecular" + a, "vLightDirection" + a, "vLightFalloff" + a, "vLightGround" + a, "lightMatrix" + a, "shadowsInfo" + a, "depthValues" + a), r.push("shadowSampler" + a), r.push("depthSampler" + a), t.push("viewFrustumZ" + a, "cascadeBlendFactor" + a, "lightSizeUVCorrection" + a, "depthCorrection" + a, "penumbraDarkness" + a, "frustumLengths" + a), e && (r.push("projectionLightSampler" + a), t.push("textureProjectionMatrix" + a)));
}
function ta(a, t, r, e = 4) {
  let o, l = null;
  if (a.uniformsNames) {
    const n = a;
    o = n.uniformsNames, l = n.uniformBuffersNames, t = n.samplers, r = n.defines, e = n.maxSimultaneousLights || 0;
  } else
    o = a, t || (t = []);
  for (let n = 0; n < e && r["LIGHT" + n]; n++)
    U(n, o, t, r["PROJECTEDLIGHTTEXTURE" + n], l);
  r.NUM_MORPH_INFLUENCERS && (o.push("morphTargetInfluences"), o.push("morphTargetCount")), r.BAKED_VERTEX_ANIMATION_TEXTURE && (o.push("bakedVertexAnimationSettings"), o.push("bakedVertexAnimationTextureSizeInverted"), o.push("bakedVertexAnimationTime"), t.push("bakedVertexAnimationTexture"));
}
export {
  F as A,
  b as B,
  _ as C,
  U as D,
  Y as E,
  O as F,
  D as G,
  Z as H,
  N as I,
  C as P,
  k as a,
  W as b,
  X as c,
  G as d,
  v as e,
  h as f,
  V as g,
  m as h,
  K as i,
  y as j,
  aa as k,
  d as l,
  x as m,
  j as n,
  J as o,
  B as p,
  $ as q,
  Q as r,
  z as s,
  L as t,
  ta as u,
  w as v,
  q as w,
  H as x,
  I as y,
  M as z
};
//# sourceMappingURL=materialHelper.functions-DIjbprGR.js.map
