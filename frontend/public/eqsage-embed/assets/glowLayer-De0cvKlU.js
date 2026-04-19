import { x as w, C as U, O as R, d as W, V as f, a5 as K, T as H, _ as k, b as S, c as A, ak as Y, al as q, g as O, R as X } from "./embed-entry-BgvWRWVI.js";
import { T as u } from "./texture-CF8YkJua.js";
import { R as V } from "./renderTargetTexture-BcDR5pJ7.js";
import { M as C } from "./material-DxrSWpK2.js";
import { B as D } from "./blurPostProcess-Do1mtOl3.js";
import { E as B } from "./engine-BUHA6kNQ.js";
import "./helperFunctions-BwncCMId.js";
import "./clipPlaneVertex-BwY_llb3.js";
import { E as j } from "./effectFallbacks-7xPE23c2.js";
import "./morphTargetsVertex-D13nULcR.js";
import { h as $, P as Q, p as J, b as Z, g as ee, d as te } from "./materialHelper.functions-DIjbprGR.js";
import { A as L, S as M } from "./scene-BUYFxCaC.js";
import { C as N } from "./camera-Dl5MzTd7.js";
import { S as G } from "./decorators.serialization-C2D-FLnh.js";
const ie = "glowMapGenerationPixelShader", se = `#if defined(DIFFUSE_ISLINEAR) || defined(EMISSIVE_ISLINEAR)
#include<helperFunctions>
#endif
#ifdef DIFFUSE
varying vec2 vUVDiffuse;uniform sampler2D diffuseSampler;
#endif
#ifdef OPACITY
varying vec2 vUVOpacity;uniform sampler2D opacitySampler;uniform float opacityIntensity;
#endif
#ifdef EMISSIVE
varying vec2 vUVEmissive;uniform sampler2D emissiveSampler;
#endif
#ifdef VERTEXALPHA
varying vec4 vColor;
#endif
uniform vec4 glowColor;uniform float glowIntensity;
#include<clipPlaneFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{
#include<clipPlaneFragment>
vec4 finalColor=glowColor;
#ifdef DIFFUSE
vec4 albedoTexture=texture2D(diffuseSampler,vUVDiffuse);
#ifdef DIFFUSE_ISLINEAR
albedoTexture=toGammaSpace(albedoTexture);
#endif
#ifdef GLOW
finalColor.a*=albedoTexture.a;
#endif
#ifdef HIGHLIGHT
finalColor.a=albedoTexture.a;
#endif
#endif
#ifdef OPACITY
vec4 opacityMap=texture2D(opacitySampler,vUVOpacity);
#ifdef OPACITYRGB
finalColor.a*=getLuminance(opacityMap.rgb);
#else
finalColor.a*=opacityMap.a;
#endif
finalColor.a*=opacityIntensity;
#endif
#ifdef VERTEXALPHA
finalColor.a*=vColor.a;
#endif
#ifdef ALPHATEST
if (finalColor.a<ALPHATESTVALUE)
discard;
#endif
#ifdef EMISSIVE
vec4 emissive=texture2D(emissiveSampler,vUVEmissive);
#ifdef EMISSIVE_ISLINEAR
emissive=toGammaSpace(emissive);
#endif
gl_FragColor=emissive*finalColor*glowIntensity;
#else
gl_FragColor=finalColor*glowIntensity;
#endif
#ifdef HIGHLIGHT
gl_FragColor.a=glowColor.a;
#endif
}`;
w.ShadersStore[ie] = se;
const re = "glowMapGenerationVertexShader", ne = `attribute vec3 position;
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#include<clipPlaneVertexDeclaration>
#include<instancesDeclaration>
uniform mat4 viewProjection;varying vec4 vPosition;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef DIFFUSE
varying vec2 vUVDiffuse;uniform mat4 diffuseMatrix;
#endif
#ifdef OPACITY
varying vec2 vUVOpacity;uniform mat4 opacityMatrix;
#endif
#ifdef EMISSIVE
varying vec2 vUVEmissive;uniform mat4 emissiveMatrix;
#endif
#ifdef VERTEXALPHA
attribute vec4 color;varying vec4 vColor;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void)
{vec3 positionUpdated=position;
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#ifdef CUBEMAP
vPosition=worldPos;gl_Position=viewProjection*finalWorld*vec4(position,1.0);
#else
vPosition=viewProjection*worldPos;gl_Position=vPosition;
#endif
#ifdef DIFFUSE
#ifdef DIFFUSEUV1
vUVDiffuse=vec2(diffuseMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef DIFFUSEUV2
vUVDiffuse=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));
#endif
#endif
#ifdef OPACITY
#ifdef OPACITYUV1
vUVOpacity=vec2(opacityMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef OPACITYUV2
vUVOpacity=vec2(opacityMatrix*vec4(uv2,1.0,0.0));
#endif
#endif
#ifdef EMISSIVE
#ifdef EMISSIVEUV1
vUVEmissive=vec2(emissiveMatrix*vec4(uvUpdated,1.0,0.0));
#endif
#ifdef EMISSIVEUV2
vUVEmissive=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));
#endif
#endif
#ifdef VERTEXALPHA
vColor=color;
#endif
#include<clipPlaneVertex>
}`;
w.ShadersStore[re] = ne;
class g {
  /**
   * Gets the camera attached to the layer.
   */
  get camera() {
    return this._effectLayerOptions.camera;
  }
  /**
   * Gets the rendering group id the layer should render in.
   */
  get renderingGroupId() {
    return this._effectLayerOptions.renderingGroupId;
  }
  set renderingGroupId(e) {
    this._effectLayerOptions.renderingGroupId = e;
  }
  /**
   * Gets the main texture where the effect is rendered
   */
  get mainTexture() {
    return this._mainTexture;
  }
  /**
   * Sets a specific material to be used to render a mesh/a list of meshes in the layer
   * @param mesh mesh or array of meshes
   * @param material material to use by the layer when rendering the mesh(es). If undefined is passed, the specific material created by the layer will be used.
   */
  setMaterialForRendering(e, t) {
    if (this._mainTexture.setMaterialForRendering(e, t), Array.isArray(e))
      for (let i = 0; i < e.length; ++i) {
        const n = e[i];
        t ? this._materialForRendering[n.uniqueId] = [n, t] : delete this._materialForRendering[n.uniqueId];
      }
    else
      t ? this._materialForRendering[e.uniqueId] = [e, t] : delete this._materialForRendering[e.uniqueId];
  }
  /**
   * Gets the intensity of the effect for a specific mesh.
   * @param mesh The mesh to get the effect intensity for
   * @returns The intensity of the effect for the mesh
   */
  getEffectIntensity(e) {
    return this._effectIntensity[e.uniqueId] ?? 1;
  }
  /**
   * Sets the intensity of the effect for a specific mesh.
   * @param mesh The mesh to set the effect intensity for
   * @param intensity The intensity of the effect for the mesh
   */
  setEffectIntensity(e, t) {
    this._effectIntensity[e.uniqueId] = t;
  }
  /**
   * Instantiates a new effect Layer and references it in the scene.
   * @param name The name of the layer
   * @param scene The scene to use the layer in
   */
  constructor(e, t) {
    this._vertexBuffers = {}, this._maxSize = 0, this._mainTextureDesiredSize = { width: 0, height: 0 }, this._shouldRender = !0, this._postProcesses = [], this._textures = [], this._emissiveTextureAndColor = { texture: null, color: new U() }, this._effectIntensity = {}, this.neutralColor = new U(), this.isEnabled = !0, this.disableBoundingBoxesFromEffectLayer = !1, this.onDisposeObservable = new R(), this.onBeforeRenderMainTextureObservable = new R(), this.onBeforeComposeObservable = new R(), this.onBeforeRenderMeshToEffect = new R(), this.onAfterRenderMeshToEffect = new R(), this.onAfterComposeObservable = new R(), this.onSizeChangedObservable = new R(), this._materialForRendering = {}, this.name = e, this._scene = t || W.LastCreatedScene, g._SceneComponentInitialization(this._scene), this._engine = this._scene.getEngine(), this._maxSize = this._engine.getCaps().maxTextureSize, this._scene.effectLayers.push(this), this._mergeDrawWrapper = [], this._generateIndexBuffer(), this._generateVertexBuffer();
  }
  /**
   * Number of times _internalRender will be called. Some effect layers need to render the mesh several times, so they should override this method with the number of times the mesh should be rendered
   * @returns Number of times a mesh must be rendered in the layer
   */
  _numInternalDraws() {
    return 1;
  }
  /**
   * Initializes the effect layer with the required options.
   * @param options Sets of none mandatory options to use with the layer (see IEffectLayerOptions for more information)
   */
  _init(e) {
    this._effectLayerOptions = {
      mainTextureRatio: 0.5,
      alphaBlendingMode: 2,
      camera: null,
      renderingGroupId: -1,
      mainTextureType: 0,
      generateStencilBuffer: !1,
      ...e
    }, this._setMainTextureSize(), this._createMainTexture(), this._createTextureAndPostProcesses();
  }
  /**
   * Generates the index buffer of the full screen quad blending to the main canvas.
   */
  _generateIndexBuffer() {
    const e = [];
    e.push(0), e.push(1), e.push(2), e.push(0), e.push(2), e.push(3), this._indexBuffer = this._engine.createIndexBuffer(e);
  }
  /**
   * Generates the vertex buffer of the full screen quad blending to the main canvas.
   */
  _generateVertexBuffer() {
    const e = [];
    e.push(1, 1), e.push(-1, 1), e.push(-1, -1), e.push(1, -1);
    const t = new f(this._engine, e, f.PositionKind, !1, !1, 2);
    this._vertexBuffers[f.PositionKind] = t;
  }
  /**
   * Sets the main texture desired size which is the closest power of two
   * of the engine canvas size.
   */
  _setMainTextureSize() {
    this._effectLayerOptions.mainTextureFixedSize ? (this._mainTextureDesiredSize.width = this._effectLayerOptions.mainTextureFixedSize, this._mainTextureDesiredSize.height = this._effectLayerOptions.mainTextureFixedSize) : (this._mainTextureDesiredSize.width = this._engine.getRenderWidth() * this._effectLayerOptions.mainTextureRatio, this._mainTextureDesiredSize.height = this._engine.getRenderHeight() * this._effectLayerOptions.mainTextureRatio, this._mainTextureDesiredSize.width = this._engine.needPOTTextures ? B.GetExponentOfTwo(this._mainTextureDesiredSize.width, this._maxSize) : this._mainTextureDesiredSize.width, this._mainTextureDesiredSize.height = this._engine.needPOTTextures ? B.GetExponentOfTwo(this._mainTextureDesiredSize.height, this._maxSize) : this._mainTextureDesiredSize.height), this._mainTextureDesiredSize.width = Math.floor(this._mainTextureDesiredSize.width), this._mainTextureDesiredSize.height = Math.floor(this._mainTextureDesiredSize.height);
  }
  /**
   * Creates the main texture for the effect layer.
   */
  _createMainTexture() {
    this._mainTexture = new V("EffectLayerMainRTT", {
      width: this._mainTextureDesiredSize.width,
      height: this._mainTextureDesiredSize.height
    }, this._scene, !1, !0, this._effectLayerOptions.mainTextureType, !1, u.TRILINEAR_SAMPLINGMODE, !0, this._effectLayerOptions.generateStencilBuffer), this._mainTexture.activeCamera = this._effectLayerOptions.camera, this._mainTexture.wrapU = u.CLAMP_ADDRESSMODE, this._mainTexture.wrapV = u.CLAMP_ADDRESSMODE, this._mainTexture.anisotropicFilteringLevel = 1, this._mainTexture.updateSamplingMode(u.BILINEAR_SAMPLINGMODE), this._mainTexture.renderParticles = !1, this._mainTexture.renderList = null, this._mainTexture.ignoreCameraViewport = !0;
    for (const e in this._materialForRendering) {
      const [t, i] = this._materialForRendering[e];
      this._mainTexture.setMaterialForRendering(t, i);
    }
    if (this._mainTexture.customIsReadyFunction = (e, t, i) => {
      if ((i || t === 0) && e.subMeshes)
        for (let n = 0; n < e.subMeshes.length; ++n) {
          const s = e.subMeshes[n], r = s.getMaterial(), a = s.getRenderingMesh();
          if (!r)
            continue;
          const l = a._getInstancesRenderList(s._id, !!s.getReplacementMesh()).hardwareInstancedRendering[s._id] || a.hasThinInstances;
          if (this._setEmissiveTextureAndColor(a, s, r), !this._isReady(s, l, this._emissiveTextureAndColor.texture))
            return !1;
        }
      return !0;
    }, this._mainTexture.customRenderFunction = (e, t, i, n) => {
      this.onBeforeRenderMainTextureObservable.notifyObservers(this);
      let s;
      const r = this._scene.getEngine();
      if (n.length) {
        for (r.setColorWrite(!1), s = 0; s < n.length; s++)
          this._renderSubMesh(n.data[s]);
        r.setColorWrite(!0);
      }
      for (s = 0; s < e.length; s++)
        this._renderSubMesh(e.data[s]);
      for (s = 0; s < t.length; s++)
        this._renderSubMesh(t.data[s]);
      const a = r.getAlphaMode();
      for (s = 0; s < i.length; s++)
        this._renderSubMesh(i.data[s], !0);
      r.setAlphaMode(a);
    }, this._mainTexture.onClearObservable.add((e) => {
      e.clear(this.neutralColor, !0, !0, !0);
    }), this._scene.getBoundingBoxRenderer) {
      const e = this._scene.getBoundingBoxRenderer().enabled;
      this._mainTexture.onBeforeBindObservable.add(() => {
        this._scene.getBoundingBoxRenderer().enabled = !this.disableBoundingBoxesFromEffectLayer && e;
      }), this._mainTexture.onAfterUnbindObservable.add(() => {
        this._scene.getBoundingBoxRenderer().enabled = e;
      });
    }
  }
  /**
   * Adds specific effects defines.
   * @param defines The defines to add specifics to.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _addCustomEffectDefines(e) {
  }
  /**
   * Checks for the readiness of the element composing the layer.
   * @param subMesh the mesh to check for
   * @param useInstances specify whether or not to use instances to render the mesh
   * @param emissiveTexture the associated emissive texture used to generate the glow
   * @returns true if ready otherwise, false
   */
  _isReady(e, t, i) {
    const n = this._scene.getEngine(), s = e.getMesh(), r = s._internalAbstractMeshDataInfo._materialForRenderPass?.[n.currentRenderPassId];
    if (r)
      return r.isReadyForSubMesh(s, e, t);
    const a = e.getMaterial();
    if (!a)
      return !1;
    if (this._useMeshMaterial(e.getRenderingMesh()))
      return a.isReadyForSubMesh(e.getMesh(), e, t);
    const o = [], l = [f.PositionKind];
    let E = !1, P = !1;
    if (a) {
      const c = a.needAlphaTesting(), _ = a.getAlphaTestTexture(), F = _ && _.hasAlpha && (a.useAlphaFromDiffuseTexture || a._useAlphaFromAlbedoTexture);
      _ && (c || F) && (o.push("#define DIFFUSE"), s.isVerticesDataPresent(f.UV2Kind) && _.coordinatesIndex === 1 ? (o.push("#define DIFFUSEUV2"), P = !0) : s.isVerticesDataPresent(f.UVKind) && (o.push("#define DIFFUSEUV1"), E = !0), c && (o.push("#define ALPHATEST"), o.push("#define ALPHATESTVALUE 0.4")), _.gammaSpace || o.push("#define DIFFUSE_ISLINEAR"));
      const y = a.opacityTexture;
      y && (o.push("#define OPACITY"), s.isVerticesDataPresent(f.UV2Kind) && y.coordinatesIndex === 1 ? (o.push("#define OPACITYUV2"), P = !0) : s.isVerticesDataPresent(f.UVKind) && (o.push("#define OPACITYUV1"), E = !0));
    }
    i && (o.push("#define EMISSIVE"), s.isVerticesDataPresent(f.UV2Kind) && i.coordinatesIndex === 1 ? (o.push("#define EMISSIVEUV2"), P = !0) : s.isVerticesDataPresent(f.UVKind) && (o.push("#define EMISSIVEUV1"), E = !0), i.gammaSpace || o.push("#define EMISSIVE_ISLINEAR")), s.useVertexColors && s.isVerticesDataPresent(f.ColorKind) && s.hasVertexAlpha && a.transparencyMode !== C.MATERIAL_OPAQUE && (l.push(f.ColorKind), o.push("#define VERTEXALPHA")), E && (l.push(f.UVKind), o.push("#define UV1")), P && (l.push(f.UV2Kind), o.push("#define UV2"));
    const b = new j();
    if (s.useBones && s.computeBonesUsingShaders) {
      l.push(f.MatricesIndicesKind), l.push(f.MatricesWeightsKind), s.numBoneInfluencers > 4 && (l.push(f.MatricesIndicesExtraKind), l.push(f.MatricesWeightsExtraKind)), o.push("#define NUM_BONE_INFLUENCERS " + s.numBoneInfluencers);
      const c = s.skeleton;
      c && c.isUsingTextureForMatrices ? o.push("#define BONETEXTURE") : o.push("#define BonesPerMesh " + (c ? c.bones.length + 1 : 0)), s.numBoneInfluencers > 0 && b.addCPUSkinningFallback(0, s);
    } else
      o.push("#define NUM_BONE_INFLUENCERS 0");
    const v = s.morphTargetManager;
    let x = 0;
    v && (x = v.numMaxInfluencers || v.numInfluencers, x > 0 && (o.push("#define MORPHTARGETS"), o.push("#define NUM_MORPH_INFLUENCERS " + x), v.isUsingTextureForTargets && o.push("#define MORPHTARGETS_TEXTURE"), $(l, s, x))), t && (o.push("#define INSTANCES"), Q(l), e.getRenderingMesh().hasThinInstances && o.push("#define THIN_INSTANCES")), J(a, this._scene, o), this._addCustomEffectDefines(o);
    const T = e._getDrawWrapper(void 0, !0), I = T.defines, d = o.join(`
`);
    if (I !== d) {
      const c = [
        "world",
        "mBones",
        "viewProjection",
        "glowColor",
        "morphTargetInfluences",
        "morphTargetCount",
        "boneTextureWidth",
        "diffuseMatrix",
        "emissiveMatrix",
        "opacityMatrix",
        "opacityIntensity",
        "morphTargetTextureInfo",
        "morphTargetTextureIndices",
        "glowIntensity"
      ];
      Z(c), T.setEffect(this._engine.createEffect("glowMapGeneration", l, c, ["diffuseSampler", "emissiveSampler", "opacitySampler", "boneSampler", "morphTargets"], d, b, void 0, void 0, { maxSimultaneousMorphTargets: x }), d);
    }
    return T.effect.isReady();
  }
  /**
   * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
   */
  render() {
    for (let r = 0; r < this._postProcesses.length; r++)
      if (!this._postProcesses[r].isReady())
        return;
    const e = this._scene.getEngine(), t = this._numInternalDraws();
    let i = !0;
    for (let r = 0; r < t; ++r) {
      let a = this._mergeDrawWrapper[r];
      a || (a = this._mergeDrawWrapper[r] = new K(this._engine), a.setEffect(this._createMergeEffect())), i = i && a.effect.isReady();
    }
    if (!i)
      return;
    this.onBeforeComposeObservable.notifyObservers(this);
    const n = e.getAlphaMode();
    for (let r = 0; r < t; ++r) {
      const a = this._mergeDrawWrapper[r];
      e.enableEffect(a), e.setState(!1), e.bindBuffers(this._vertexBuffers, this._indexBuffer, a.effect), e.setAlphaMode(this._effectLayerOptions.alphaBlendingMode), this._internalRender(a.effect, r);
    }
    e.setAlphaMode(n), this.onAfterComposeObservable.notifyObservers(this);
    const s = this._mainTexture.getSize();
    this._setMainTextureSize(), (s.width !== this._mainTextureDesiredSize.width || s.height !== this._mainTextureDesiredSize.height) && this._mainTextureDesiredSize.width !== 0 && this._mainTextureDesiredSize.height !== 0 && (this.onSizeChangedObservable.notifyObservers(this), this._disposeTextureAndPostProcesses(), this._createMainTexture(), this._createTextureAndPostProcesses());
  }
  /**
   * Determine if a given mesh will be used in the current effect.
   * @param mesh mesh to test
   * @returns true if the mesh will be used
   */
  hasMesh(e) {
    return this.renderingGroupId === -1 || e.renderingGroupId === this.renderingGroupId;
  }
  /**
   * Returns true if the layer contains information to display, otherwise false.
   * @returns true if the glow layer should be rendered
   */
  shouldRender() {
    return this.isEnabled && this._shouldRender;
  }
  /**
   * Returns true if the mesh should render, otherwise false.
   * @param mesh The mesh to render
   * @returns true if it should render otherwise false
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _shouldRenderMesh(e) {
    return !0;
  }
  /**
   * Returns true if the mesh can be rendered, otherwise false.
   * @param mesh The mesh to render
   * @param material The material used on the mesh
   * @returns true if it can be rendered otherwise false
   */
  _canRenderMesh(e, t) {
    return !t.needAlphaBlendingForMesh(e);
  }
  /**
   * Returns true if the mesh should render, otherwise false.
   * @returns true if it should render otherwise false
   */
  _shouldRenderEmissiveTextureForMesh() {
    return !0;
  }
  /**
   * Renders the submesh passed in parameter to the generation map.
   * @param subMesh
   * @param enableAlphaMode
   */
  _renderSubMesh(e, t = !1) {
    if (!this.shouldRender())
      return;
    const i = e.getMaterial(), n = e.getMesh(), s = e.getReplacementMesh(), r = e.getRenderingMesh(), a = e.getEffectiveMesh(), o = this._scene, l = o.getEngine();
    if (a._internalAbstractMeshDataInfo._isActiveIntermediate = !1, !i || !this._canRenderMesh(r, i))
      return;
    let E = r.overrideMaterialSideOrientation ?? i.sideOrientation;
    a._getWorldMatrixDeterminant() < 0 && (E = E === C.ClockWiseSideOrientation ? C.CounterClockWiseSideOrientation : C.ClockWiseSideOrientation);
    const b = E === C.ClockWiseSideOrientation;
    l.setState(i.backFaceCulling, i.zOffset, void 0, b, i.cullBackFaces, void 0, i.zOffsetUnits);
    const v = r._getInstancesRenderList(e._id, !!s);
    if (v.mustReturn || !this._shouldRenderMesh(r))
      return;
    const x = v.hardwareInstancedRendering[e._id] || r.hasThinInstances;
    if (this._setEmissiveTextureAndColor(r, e, i), this.onBeforeRenderMeshToEffect.notifyObservers(n), this._useMeshMaterial(r))
      r.render(e, t, s || void 0);
    else if (this._isReady(e, x, this._emissiveTextureAndColor.texture)) {
      const T = a._internalAbstractMeshDataInfo._materialForRenderPass?.[l.currentRenderPassId];
      let I = e._getDrawWrapper();
      if (!I && T && (I = T._getDrawWrapper()), !I)
        return;
      const d = I.effect;
      if (l.enableEffect(I), x || r._bind(e, d, i.fillMode), T ? T.bindForSubMesh(a.getWorldMatrix(), a, e) : (d.setMatrix("viewProjection", o.getTransformMatrix()), d.setMatrix("world", a.getWorldMatrix()), d.setFloat4("glowColor", this._emissiveTextureAndColor.color.r, this._emissiveTextureAndColor.color.g, this._emissiveTextureAndColor.color.b, this._emissiveTextureAndColor.color.a)), !T) {
        const c = i.needAlphaTesting(), _ = i.getAlphaTestTexture(), F = _ && _.hasAlpha && (i.useAlphaFromDiffuseTexture || i._useAlphaFromAlbedoTexture);
        if (_ && (c || F)) {
          d.setTexture("diffuseSampler", _);
          const m = _.getTextureMatrix();
          m && d.setMatrix("diffuseMatrix", m);
        }
        const y = i.opacityTexture;
        if (y) {
          d.setTexture("opacitySampler", y), d.setFloat("opacityIntensity", y.level);
          const m = y.getTextureMatrix();
          m && d.setMatrix("opacityMatrix", m);
        }
        if (this._emissiveTextureAndColor.texture && (d.setTexture("emissiveSampler", this._emissiveTextureAndColor.texture), d.setMatrix("emissiveMatrix", this._emissiveTextureAndColor.texture.getTextureMatrix())), r.useBones && r.computeBonesUsingShaders && r.skeleton) {
          const m = r.skeleton;
          if (m.isUsingTextureForMatrices) {
            const z = m.getTransformMatrixTexture(r);
            if (!z)
              return;
            d.setTexture("boneSampler", z), d.setFloat("boneTextureWidth", 4 * (m.bones.length + 1));
          } else
            d.setMatrices("mBones", m.getTransformMatrices(r));
        }
        ee(r, d), r.morphTargetManager && r.morphTargetManager.isUsingTextureForTargets && r.morphTargetManager._bind(d), t && l.setAlphaMode(i.alphaMode), d.setFloat("glowIntensity", this.getEffectIntensity(r)), te(d, i, o);
      }
      r._processRendering(a, e, d, i.fillMode, v, x, (c, _) => d.setMatrix("world", _));
    } else
      this._mainTexture.resetRefreshCounter();
    this.onAfterRenderMeshToEffect.notifyObservers(n);
  }
  /**
   * Defines whether the current material of the mesh should be use to render the effect.
   * @param mesh defines the current mesh to render
   * @returns true if the mesh material should be use
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _useMeshMaterial(e) {
    return !1;
  }
  /**
   * Rebuild the required buffers.
   * @internal Internal use only.
   */
  _rebuild() {
    const e = this._vertexBuffers[f.PositionKind];
    e && e._rebuild(), this._generateIndexBuffer();
  }
  /**
   * Dispose only the render target textures and post process.
   */
  _disposeTextureAndPostProcesses() {
    this._mainTexture.dispose();
    for (let e = 0; e < this._postProcesses.length; e++)
      this._postProcesses[e] && this._postProcesses[e].dispose();
    this._postProcesses = [];
    for (let e = 0; e < this._textures.length; e++)
      this._textures[e] && this._textures[e].dispose();
    this._textures = [];
  }
  /**
   * Dispose the highlight layer and free resources.
   */
  dispose() {
    const e = this._vertexBuffers[f.PositionKind];
    e && (e.dispose(), this._vertexBuffers[f.PositionKind] = null), this._indexBuffer && (this._scene.getEngine()._releaseBuffer(this._indexBuffer), this._indexBuffer = null);
    for (const i of this._mergeDrawWrapper)
      i.dispose();
    this._mergeDrawWrapper = [], this._disposeTextureAndPostProcesses();
    const t = this._scene.effectLayers.indexOf(this, 0);
    t > -1 && this._scene.effectLayers.splice(t, 1), this.onDisposeObservable.notifyObservers(this), this.onDisposeObservable.clear(), this.onBeforeRenderMainTextureObservable.clear(), this.onBeforeComposeObservable.clear(), this.onBeforeRenderMeshToEffect.clear(), this.onAfterRenderMeshToEffect.clear(), this.onAfterComposeObservable.clear(), this.onSizeChangedObservable.clear();
  }
  /**
   * Gets the class name of the effect layer
   * @returns the string with the class name of the effect layer
   */
  getClassName() {
    return "EffectLayer";
  }
  /**
   * Creates an effect layer from parsed effect layer data
   * @param parsedEffectLayer defines effect layer data
   * @param scene defines the current scene
   * @param rootUrl defines the root URL containing the effect layer information
   * @returns a parsed effect Layer
   */
  static Parse(e, t, i) {
    return H.Instantiate(e.customType).Parse(e, t, i);
  }
}
g._SceneComponentInitialization = (h) => {
  throw k("EffectLayerSceneComponent");
};
S([
  A()
], g.prototype, "name", void 0);
S([
  Y()
], g.prototype, "neutralColor", void 0);
S([
  A()
], g.prototype, "isEnabled", void 0);
S([
  q()
], g.prototype, "camera", null);
S([
  A()
], g.prototype, "renderingGroupId", null);
S([
  A()
], g.prototype, "disableBoundingBoxesFromEffectLayer", void 0);
const ae = "glowMapMergePixelShader", oe = `varying vec2 vUV;uniform sampler2D textureSampler;
#ifdef EMISSIVE
uniform sampler2D textureSampler2;
#endif
uniform float offset;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
vec4 baseColor=texture2D(textureSampler,vUV);
#ifdef EMISSIVE
baseColor+=texture2D(textureSampler2,vUV);baseColor*=offset;
#else
baseColor.a=abs(offset-baseColor.a);
#ifdef STROKE
float alpha=smoothstep(.0,.1,baseColor.a);baseColor.a=alpha;baseColor.rgb=baseColor.rgb*alpha;
#endif
#endif
#if LDR
baseColor=clamp(baseColor,0.,1.0);
#endif
gl_FragColor=baseColor;
#define CUSTOM_FRAGMENT_MAIN_END
}`;
w.ShadersStore[ae] = oe;
const de = "glowMapMergeVertexShader", fe = `attribute vec2 position;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;
w.ShadersStore[de] = fe;
L.AddParser(M.NAME_EFFECTLAYER, (h, e, t, i) => {
  if (h.effectLayers) {
    t.effectLayers || (t.effectLayers = []);
    for (let n = 0; n < h.effectLayers.length; n++) {
      const s = g.Parse(h.effectLayers[n], e, i);
      t.effectLayers.push(s);
    }
  }
});
L.prototype.removeEffectLayer = function(h) {
  const e = this.effectLayers.indexOf(h);
  return e !== -1 && this.effectLayers.splice(e, 1), e;
};
L.prototype.addEffectLayer = function(h) {
  this.effectLayers.push(h);
};
class le {
  /**
   * Creates a new instance of the component for the given scene
   * @param scene Defines the scene to register the component in
   */
  constructor(e) {
    this.name = M.NAME_EFFECTLAYER, this._renderEffects = !1, this._needStencil = !1, this._previousStencilState = !1, this.scene = e || W.LastCreatedScene, this.scene && (this._engine = this.scene.getEngine(), this.scene.effectLayers = []);
  }
  /**
   * Registers the component in a given scene
   */
  register() {
    this.scene._isReadyForMeshStage.registerStep(M.STEP_ISREADYFORMESH_EFFECTLAYER, this, this._isReadyForMesh), this.scene._cameraDrawRenderTargetStage.registerStep(M.STEP_CAMERADRAWRENDERTARGET_EFFECTLAYER, this, this._renderMainTexture), this.scene._beforeCameraDrawStage.registerStep(M.STEP_BEFORECAMERADRAW_EFFECTLAYER, this, this._setStencil), this.scene._afterRenderingGroupDrawStage.registerStep(M.STEP_AFTERRENDERINGGROUPDRAW_EFFECTLAYER_DRAW, this, this._drawRenderingGroup), this.scene._afterCameraDrawStage.registerStep(M.STEP_AFTERCAMERADRAW_EFFECTLAYER, this, this._setStencilBack), this.scene._afterCameraDrawStage.registerStep(M.STEP_AFTERCAMERADRAW_EFFECTLAYER_DRAW, this, this._drawCamera);
  }
  /**
   * Rebuilds the elements related to this component in case of
   * context lost for instance.
   */
  rebuild() {
    const e = this.scene.effectLayers;
    for (const t of e)
      t._rebuild();
  }
  /**
   * Serializes the component data to the specified json object
   * @param serializationObject The object to serialize to
   */
  serialize(e) {
    e.effectLayers = [];
    const t = this.scene.effectLayers;
    for (const i of t)
      i.serialize && e.effectLayers.push(i.serialize());
  }
  /**
   * Adds all the elements from the container to the scene
   * @param container the container holding the elements
   */
  addFromContainer(e) {
    e.effectLayers && e.effectLayers.forEach((t) => {
      this.scene.addEffectLayer(t);
    });
  }
  /**
   * Removes all the elements in the container from the scene
   * @param container contains the elements to remove
   * @param dispose if the removed element should be disposed (default: false)
   */
  removeFromContainer(e, t) {
    e.effectLayers && e.effectLayers.forEach((i) => {
      this.scene.removeEffectLayer(i), t && i.dispose();
    });
  }
  /**
   * Disposes the component and the associated resources.
   */
  dispose() {
    const e = this.scene.effectLayers;
    for (; e.length; )
      e[0].dispose();
  }
  _isReadyForMesh(e, t) {
    const i = this._engine.currentRenderPassId, n = this.scene.effectLayers;
    for (const s of n) {
      if (!s.hasMesh(e))
        continue;
      const r = s._mainTexture;
      this._engine.currentRenderPassId = r.renderPassId;
      for (const a of e.subMeshes)
        if (!s.isReady(a, t))
          return this._engine.currentRenderPassId = i, !1;
    }
    return this._engine.currentRenderPassId = i, !0;
  }
  _renderMainTexture(e) {
    this._renderEffects = !1, this._needStencil = !1;
    let t = !1;
    const i = this.scene.effectLayers;
    if (i && i.length > 0) {
      this._previousStencilState = this._engine.getStencilBuffer();
      for (const n of i)
        if (n.shouldRender() && (!n.camera || n.camera.cameraRigMode === N.RIG_MODE_NONE && e === n.camera || n.camera.cameraRigMode !== N.RIG_MODE_NONE && n.camera._rigCameras.indexOf(e) > -1)) {
          this._renderEffects = !0, this._needStencil = this._needStencil || n.needStencil();
          const s = n._mainTexture;
          s._shouldRender() && (this.scene.incrementRenderId(), s.render(!1, !1), t = !0);
        }
      this.scene.incrementRenderId();
    }
    return t;
  }
  _setStencil() {
    this._needStencil && this._engine.setStencilBuffer(!0);
  }
  _setStencilBack() {
    this._needStencil && this._engine.setStencilBuffer(this._previousStencilState);
  }
  _draw(e) {
    if (this._renderEffects) {
      this._engine.setDepthBuffer(!1);
      const t = this.scene.effectLayers;
      for (let i = 0; i < t.length; i++) {
        const n = t[i];
        n.renderingGroupId === e && n.shouldRender() && n.render();
      }
      this._engine.setDepthBuffer(!0);
    }
  }
  _drawCamera() {
    this._renderEffects && this._draw(-1);
  }
  _drawRenderingGroup(e) {
    !this.scene._isInIntermediateRendering() && this._renderEffects && this._draw(e);
  }
}
g._SceneComponentInitialization = (h) => {
  let e = h._getComponent(M.NAME_EFFECTLAYER);
  e || (e = new le(h), h._addComponent(e));
};
L.prototype.getGlowLayerByName = function(h) {
  for (let e = 0; e < this.effectLayers?.length; e++)
    if (this.effectLayers[e].name === h && this.effectLayers[e].getEffectName() === p.EffectName)
      return this.effectLayers[e];
  return null;
};
class p extends g {
  /**
   * Sets the kernel size of the blur.
   */
  set blurKernelSize(e) {
    if (e === this._options.blurKernelSize)
      return;
    this._options.blurKernelSize = e;
    const t = this._getEffectiveBlurKernelSize();
    this._horizontalBlurPostprocess1.kernel = t, this._verticalBlurPostprocess1.kernel = t, this._horizontalBlurPostprocess2.kernel = t, this._verticalBlurPostprocess2.kernel = t;
  }
  /**
   * Gets the kernel size of the blur.
   */
  get blurKernelSize() {
    return this._options.blurKernelSize;
  }
  /**
   * Sets the glow intensity.
   */
  set intensity(e) {
    this._intensity = e;
  }
  /**
   * Gets the glow intensity.
   */
  get intensity() {
    return this._intensity;
  }
  /**
   * Instantiates a new glow Layer and references it to the scene.
   * @param name The name of the layer
   * @param scene The scene to use the layer in
   * @param options Sets of none mandatory options to use with the layer (see IGlowLayerOptions for more information)
   */
  constructor(e, t, i) {
    super(e, t), this._intensity = 1, this._includedOnlyMeshes = [], this._excludedMeshes = [], this._meshesUsingTheirOwnMaterials = [], this.neutralColor = new U(0, 0, 0, 1), this._options = {
      mainTextureRatio: p.DefaultTextureRatio,
      blurKernelSize: 32,
      mainTextureFixedSize: void 0,
      camera: null,
      mainTextureSamples: 1,
      renderingGroupId: -1,
      ldrMerge: !1,
      alphaBlendingMode: 1,
      mainTextureType: 0,
      generateStencilBuffer: !1,
      ...i
    }, this._init({
      alphaBlendingMode: this._options.alphaBlendingMode,
      camera: this._options.camera,
      mainTextureFixedSize: this._options.mainTextureFixedSize,
      mainTextureRatio: this._options.mainTextureRatio,
      renderingGroupId: this._options.renderingGroupId,
      mainTextureType: this._options.mainTextureType,
      generateStencilBuffer: this._options.generateStencilBuffer
    });
  }
  /**
   * Get the effect name of the layer.
   * @returns The effect name
   */
  getEffectName() {
    return p.EffectName;
  }
  /**
   * @internal
   * Create the merge effect. This is the shader use to blit the information back
   * to the main canvas at the end of the scene rendering.
   */
  _createMergeEffect() {
    let e = `#define EMISSIVE 
`;
    return this._options.ldrMerge && (e += `#define LDR 
`), this._engine.createEffect("glowMapMerge", [f.PositionKind], ["offset"], ["textureSampler", "textureSampler2"], e);
  }
  /**
   * Creates the render target textures and post processes used in the glow layer.
   */
  _createTextureAndPostProcesses() {
    let e = this._mainTextureDesiredSize.width, t = this._mainTextureDesiredSize.height;
    e = this._engine.needPOTTextures ? B.GetExponentOfTwo(e, this._maxSize) : e, t = this._engine.needPOTTextures ? B.GetExponentOfTwo(t, this._maxSize) : t;
    let i = 0;
    this._engine.getCaps().textureHalfFloatRender ? i = 2 : i = 0, this._blurTexture1 = new V("GlowLayerBlurRTT", {
      width: e,
      height: t
    }, this._scene, !1, !0, i), this._blurTexture1.wrapU = u.CLAMP_ADDRESSMODE, this._blurTexture1.wrapV = u.CLAMP_ADDRESSMODE, this._blurTexture1.updateSamplingMode(u.BILINEAR_SAMPLINGMODE), this._blurTexture1.renderParticles = !1, this._blurTexture1.ignoreCameraViewport = !0;
    const n = Math.floor(e / 2), s = Math.floor(t / 2);
    this._blurTexture2 = new V("GlowLayerBlurRTT2", {
      width: n,
      height: s
    }, this._scene, !1, !0, i), this._blurTexture2.wrapU = u.CLAMP_ADDRESSMODE, this._blurTexture2.wrapV = u.CLAMP_ADDRESSMODE, this._blurTexture2.updateSamplingMode(u.BILINEAR_SAMPLINGMODE), this._blurTexture2.renderParticles = !1, this._blurTexture2.ignoreCameraViewport = !0, this._textures = [this._blurTexture1, this._blurTexture2];
    const r = this._getEffectiveBlurKernelSize();
    this._horizontalBlurPostprocess1 = new D("GlowLayerHBP1", new O(1, 0), r, {
      width: e,
      height: t
    }, null, u.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), !1, i), this._horizontalBlurPostprocess1.width = e, this._horizontalBlurPostprocess1.height = t, this._horizontalBlurPostprocess1.externalTextureSamplerBinding = !0, this._horizontalBlurPostprocess1.onApplyObservable.add((a) => {
      a.setTexture("textureSampler", this._mainTexture);
    }), this._verticalBlurPostprocess1 = new D("GlowLayerVBP1", new O(0, 1), r, {
      width: e,
      height: t
    }, null, u.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), !1, i), this._horizontalBlurPostprocess2 = new D("GlowLayerHBP2", new O(1, 0), r, {
      width: n,
      height: s
    }, null, u.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), !1, i), this._horizontalBlurPostprocess2.width = n, this._horizontalBlurPostprocess2.height = s, this._horizontalBlurPostprocess2.externalTextureSamplerBinding = !0, this._horizontalBlurPostprocess2.onApplyObservable.add((a) => {
      a.setTexture("textureSampler", this._blurTexture1);
    }), this._verticalBlurPostprocess2 = new D("GlowLayerVBP2", new O(0, 1), r, {
      width: n,
      height: s
    }, null, u.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), !1, i), this._postProcesses = [this._horizontalBlurPostprocess1, this._verticalBlurPostprocess1, this._horizontalBlurPostprocess2, this._verticalBlurPostprocess2], this._postProcesses1 = [this._horizontalBlurPostprocess1, this._verticalBlurPostprocess1], this._postProcesses2 = [this._horizontalBlurPostprocess2, this._verticalBlurPostprocess2], this._mainTexture.samples = this._options.mainTextureSamples, this._mainTexture.onAfterUnbindObservable.add(() => {
      const a = this._blurTexture1.renderTarget;
      if (a) {
        this._scene.postProcessManager.directRender(this._postProcesses1, a, !0);
        const o = this._blurTexture2.renderTarget;
        o && this._scene.postProcessManager.directRender(this._postProcesses2, o, !0), this._engine.unBindFramebuffer(o ?? a, !0);
      }
    }), this._postProcesses.map((a) => {
      a.autoClear = !1;
    });
  }
  /**
   * @returns The blur kernel size used by the glow.
   * Note: The value passed in the options is divided by 2 for back compatibility.
   */
  _getEffectiveBlurKernelSize() {
    return this._options.blurKernelSize / 2;
  }
  /**
   * Checks for the readiness of the element composing the layer.
   * @param subMesh the mesh to check for
   * @param useInstances specify whether or not to use instances to render the mesh
   * @returns true if ready otherwise, false
   */
  isReady(e, t) {
    const i = e.getMaterial(), n = e.getRenderingMesh();
    if (!i || !n)
      return !1;
    const s = i.emissiveTexture;
    return super._isReady(e, t, s);
  }
  /**
   * @returns whether or not the layer needs stencil enabled during the mesh rendering.
   */
  needStencil() {
    return !1;
  }
  /**
   * Returns true if the mesh can be rendered, otherwise false.
   * @param mesh The mesh to render
   * @param material The material used on the mesh
   * @returns true if it can be rendered otherwise false
   */
  _canRenderMesh(e, t) {
    return !0;
  }
  /**
   * Implementation specific of rendering the generating effect on the main canvas.
   * @param effect The effect used to render through
   */
  _internalRender(e) {
    e.setTexture("textureSampler", this._blurTexture1), e.setTexture("textureSampler2", this._blurTexture2), e.setFloat("offset", this._intensity);
    const t = this._engine, i = t.getStencilBuffer();
    t.setStencilBuffer(!1), t.drawElementsType(C.TriangleFillMode, 0, 6), t.setStencilBuffer(i);
  }
  /**
   * Sets the required values for both the emissive texture and and the main color.
   * @param mesh
   * @param subMesh
   * @param material
   */
  _setEmissiveTextureAndColor(e, t, i) {
    let n = 1;
    if (this.customEmissiveTextureSelector ? this._emissiveTextureAndColor.texture = this.customEmissiveTextureSelector(e, t, i) : i ? (this._emissiveTextureAndColor.texture = i.emissiveTexture, this._emissiveTextureAndColor.texture && (n = this._emissiveTextureAndColor.texture.level)) : this._emissiveTextureAndColor.texture = null, this.customEmissiveColorSelector)
      this.customEmissiveColorSelector(e, t, i, this._emissiveTextureAndColor.color);
    else if (i.emissiveColor) {
      const s = i.emissiveIntensity ?? 1;
      n *= s, this._emissiveTextureAndColor.color.set(i.emissiveColor.r * n, i.emissiveColor.g * n, i.emissiveColor.b * n, i.alpha);
    } else
      this._emissiveTextureAndColor.color.set(this.neutralColor.r, this.neutralColor.g, this.neutralColor.b, this.neutralColor.a);
  }
  /**
   * Returns true if the mesh should render, otherwise false.
   * @param mesh The mesh to render
   * @returns true if it should render otherwise false
   */
  _shouldRenderMesh(e) {
    return this.hasMesh(e);
  }
  /**
   * Adds specific effects defines.
   * @param defines The defines to add specifics to.
   */
  _addCustomEffectDefines(e) {
    e.push("#define GLOW");
  }
  /**
   * Add a mesh in the exclusion list to prevent it to impact or being impacted by the glow layer.
   * @param mesh The mesh to exclude from the glow layer
   */
  addExcludedMesh(e) {
    this._excludedMeshes.indexOf(e.uniqueId) === -1 && this._excludedMeshes.push(e.uniqueId);
  }
  /**
   * Remove a mesh from the exclusion list to let it impact or being impacted by the glow layer.
   * @param mesh The mesh to remove
   */
  removeExcludedMesh(e) {
    const t = this._excludedMeshes.indexOf(e.uniqueId);
    t !== -1 && this._excludedMeshes.splice(t, 1);
  }
  /**
   * Add a mesh in the inclusion list to impact or being impacted by the glow layer.
   * @param mesh The mesh to include in the glow layer
   */
  addIncludedOnlyMesh(e) {
    this._includedOnlyMeshes.indexOf(e.uniqueId) === -1 && this._includedOnlyMeshes.push(e.uniqueId);
  }
  /**
   * Remove a mesh from the Inclusion list to prevent it to impact or being impacted by the glow layer.
   * @param mesh The mesh to remove
   */
  removeIncludedOnlyMesh(e) {
    const t = this._includedOnlyMeshes.indexOf(e.uniqueId);
    t !== -1 && this._includedOnlyMeshes.splice(t, 1);
  }
  /**
   * Determine if a given mesh will be used in the glow layer
   * @param mesh The mesh to test
   * @returns true if the mesh will be highlighted by the current glow layer
   */
  hasMesh(e) {
    return super.hasMesh(e) ? this._includedOnlyMeshes.length ? this._includedOnlyMeshes.indexOf(e.uniqueId) !== -1 : this._excludedMeshes.length ? this._excludedMeshes.indexOf(e.uniqueId) === -1 : !0 : !1;
  }
  /**
   * Defines whether the current material of the mesh should be use to render the effect.
   * @param mesh defines the current mesh to render
   * @returns true if the material of the mesh should be use to render the effect
   */
  _useMeshMaterial(e) {
    return this._meshesUsingTheirOwnMaterials.length == 0 ? !1 : this._meshesUsingTheirOwnMaterials.indexOf(e.uniqueId) > -1;
  }
  /**
   * Add a mesh to be rendered through its own material and not with emissive only.
   * @param mesh The mesh for which we need to use its material
   */
  referenceMeshToUseItsOwnMaterial(e) {
    e.resetDrawCache(this._mainTexture.renderPassId), this._meshesUsingTheirOwnMaterials.push(e.uniqueId), e.onDisposeObservable.add(() => {
      this._disposeMesh(e);
    });
  }
  /**
   * Remove a mesh from being rendered through its own material and not with emissive only.
   * @param mesh The mesh for which we need to not use its material
   */
  unReferenceMeshFromUsingItsOwnMaterial(e) {
    let t = this._meshesUsingTheirOwnMaterials.indexOf(e.uniqueId);
    for (; t >= 0; )
      this._meshesUsingTheirOwnMaterials.splice(t, 1), t = this._meshesUsingTheirOwnMaterials.indexOf(e.uniqueId);
    e.resetDrawCache(this._mainTexture.renderPassId);
  }
  /**
   * Free any resources and references associated to a mesh.
   * Internal use
   * @param mesh The mesh to free.
   * @internal
   */
  _disposeMesh(e) {
    this.removeIncludedOnlyMesh(e), this.removeExcludedMesh(e);
  }
  /**
   * Gets the class name of the effect layer
   * @returns the string with the class name of the effect layer
   */
  getClassName() {
    return "GlowLayer";
  }
  /**
   * Serializes this glow layer
   * @returns a serialized glow layer object
   */
  serialize() {
    const e = G.Serialize(this);
    e.customType = "BABYLON.GlowLayer";
    let t;
    if (e.includedMeshes = [], this._includedOnlyMeshes.length)
      for (t = 0; t < this._includedOnlyMeshes.length; t++) {
        const i = this._scene.getMeshByUniqueId(this._includedOnlyMeshes[t]);
        i && e.includedMeshes.push(i.id);
      }
    if (e.excludedMeshes = [], this._excludedMeshes.length)
      for (t = 0; t < this._excludedMeshes.length; t++) {
        const i = this._scene.getMeshByUniqueId(this._excludedMeshes[t]);
        i && e.excludedMeshes.push(i.id);
      }
    return e;
  }
  /**
   * Creates a Glow Layer from parsed glow layer data
   * @param parsedGlowLayer defines glow layer data
   * @param scene defines the current scene
   * @param rootUrl defines the root URL containing the glow layer information
   * @returns a parsed Glow Layer
   */
  static Parse(e, t, i) {
    const n = G.Parse(() => new p(e.name, t, e.options), e, t, i);
    let s;
    for (s = 0; s < e.excludedMeshes.length; s++) {
      const r = t.getMeshById(e.excludedMeshes[s]);
      r && n.addExcludedMesh(r);
    }
    for (s = 0; s < e.includedMeshes.length; s++) {
      const r = t.getMeshById(e.includedMeshes[s]);
      r && n.addIncludedOnlyMesh(r);
    }
    return n;
  }
}
p.EffectName = "GlowLayer";
p.DefaultBlurKernelSize = 32;
p.DefaultTextureRatio = 0.5;
S([
  A()
], p.prototype, "blurKernelSize", null);
S([
  A()
], p.prototype, "intensity", null);
S([
  A("options")
], p.prototype, "_options", void 0);
X("BABYLON.GlowLayer", p);
const ye = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GlowLayer: p
}, Symbol.toStringTag, { value: "Module" }));
export {
  g as E,
  p as G,
  le as a,
  ye as g
};
//# sourceMappingURL=glowLayer-De0cvKlU.js.map
