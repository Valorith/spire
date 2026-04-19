import { M as ce, a as C, g as ve, x as We, b, q as fi, t as $, c as D, ab as pi, s as ki, aA as Vi, R as q, h as U, v as _i, V as j, L as R, O as x, C as $e, Y as Ui, a1 as zt, w as me, a0 as Gi, T as B, aH as zi, Q as A, i as H, d as He, ah as ne, G as Lt, P as $i, p as F, a5 as Hi, ac as $t, W as Xi, S as wt, aI as Ht, u as Wi } from "./embed-entry-BgvWRWVI.js";
import { I as gt, a as Oe, P as Me, U as ji, S as It } from "./scene-BUYFxCaC.js";
import { T as L, B as nt } from "./texture-CF8YkJua.js";
import { StandardMaterial as Le } from "./standardMaterial-DtnAO-Mw.js";
import { P as Qi } from "./pbrMaterial-CglnQqaf.js";
import { H as mi } from "./hemisphericLight-BM-1srhm.js";
import { A as gi, Q as Yi, E as Ci, S as qi } from "./arcRotateCamera-DAFc5JFt.js";
import { M as Xe } from "./mesh-DLjlGcQU.js";
import { R as vt } from "./renderTargetTexture-BcDR5pJ7.js";
import { B as Xt } from "./blurPostProcess-Do1mtOl3.js";
import { P as bi } from "./math.plane-DBvbMJ5W.js";
import { CubeTexture as Wt } from "./cubeTexture-B8fRJY_1.js";
import { S as Ki } from "./smartArray-BXymNR-c.js";
import { M as yi } from "./imageProcessingFunctions-DgzOkxoC.js";
import { P as Si } from "./vertexColorMixing-CIolw5w_.js";
import { M as ke } from "./material.detailMapConfiguration-82jhJlFu.js";
import "./helperFunctions-BwncCMId.js";
import "./logDepthVertex-nJ52659Z.js";
import "./clipPlaneVertex-BwY_llb3.js";
import "./fogVertex-Dh_d_5CC.js";
import { E as Ri } from "./effectFallbacks-7xPE23c2.js";
import { i as Zi, j as Ji, m as es, n as ts, o as is, q as ss, H as rs, r as ns, s as os, b as as, u as ls, c as hs, v as cs, d as us, w as ds, f as fs, e as Ei, k as ps, x as _s } from "./materialHelper.functions-DIjbprGR.js";
import { S as Ue } from "./decorators.serialization-C2D-FLnh.js";
import { C as ms } from "./planeBuilder-VegzUWlT.js";
import { CreateBox as Ti } from "./boxBuilder-DCM-Hqlp.js";
import { a as Pi } from "./freeCamera-BbW2WQtJ.js";
import { W as it, a as J, b as gs, V as Cs } from "./vrExperienceHelper-bUq9XdUR.js";
import { S as Ii, C as bs } from "./baseTexture.polynomial-BuwMZjCa.js";
import { E as Bt } from "./engine-BUHA6kNQ.js";
import { F as Te, a as Ve } from "./textureTools-DHI8onuq.js";
import "./envTextureLoader-BC6Uo2KB.js";
import { C as ys } from "./camera-Dl5MzTd7.js";
import { T as Ss } from "./cameraInputsManager-DFS6Uyrg.js";
import { V as Mt } from "./math.viewport-CrgurBQ6.js";
import { U as Rs } from "./universalCamera-DSXSUV6W.js";
import { A as Ge } from "./abstractMesh-leBV3i4h.js";
import { SceneLoader as lt } from "./sceneLoader-BnW1sH6R.js";
import { A as ct, S as je } from "./math.axis-Jb8Sl68r.js";
import { C as At } from "./sphereBuilder-CnJ478gV.js";
import { c as vi, d as Es, a as Ts } from "./linesBuilder-BahucCPF.js";
import { C as xt } from "./torusBuilder-Ds2GzH3M.js";
import { R as De } from "./ray-oakCIP-z.js";
import { PointerEventTypes as ie, PointerInfo as Ct } from "./pointerEvents-BbNEJSOj.js";
import { C as Ps } from "./math.path-PzrWHRHK.js";
import { P as Is } from "./postProcess-CzjDSNvf.js";
import { B as jt } from "./baseParticleSystem-R_VNqNj9.js";
import { M as Ot } from "./material-DxrSWpK2.js";
import { A as ee } from "./animation-BgJaKPHn.js";
import { TransformNode as vs } from "./transformNode-CxtzTbrg.js";
import { DynamicTexture as Ms } from "./dynamicTexture-Bqall2pe.js";
import { c as As } from "./groundBuilder-BrBTF9BC.js";
import { s as st } from "./timer-Bos76nou.js";
class ut extends vt {
  /**
   * Define the blur ratio used to blur the reflection if needed.
   */
  set blurRatio(e) {
    this._blurRatio !== e && (this._blurRatio = e, this._preparePostProcesses());
  }
  get blurRatio() {
    return this._blurRatio;
  }
  /**
   * Define the adaptive blur kernel used to blur the reflection if needed.
   * This will autocompute the closest best match for the `blurKernel`
   */
  set adaptiveBlurKernel(e) {
    this._adaptiveBlurKernel = e, this._autoComputeBlurKernel();
  }
  /**
   * Define the blur kernel used to blur the reflection if needed.
   * Please consider using `adaptiveBlurKernel` as it could find the closest best value for you.
   */
  set blurKernel(e) {
    this.blurKernelX = e, this.blurKernelY = e;
  }
  /**
   * Define the blur kernel on the X Axis used to blur the reflection if needed.
   * Please consider using `adaptiveBlurKernel` as it could find the closest best value for you.
   */
  set blurKernelX(e) {
    this._blurKernelX !== e && (this._blurKernelX = e, this._preparePostProcesses());
  }
  get blurKernelX() {
    return this._blurKernelX;
  }
  /**
   * Define the blur kernel on the Y Axis used to blur the reflection if needed.
   * Please consider using `adaptiveBlurKernel` as it could find the closest best value for you.
   */
  set blurKernelY(e) {
    this._blurKernelY !== e && (this._blurKernelY = e, this._preparePostProcesses());
  }
  get blurKernelY() {
    return this._blurKernelY;
  }
  _autoComputeBlurKernel() {
    const e = this.getScene().getEngine(), t = this.getRenderWidth() / e.getRenderWidth(), i = this.getRenderHeight() / e.getRenderHeight();
    this.blurKernelX = this._adaptiveBlurKernel * t, this.blurKernelY = this._adaptiveBlurKernel * i;
  }
  _onRatioRescale() {
    this._sizeRatio && (this.resize(this._initialSizeParameter), this._adaptiveBlurKernel || this._preparePostProcesses()), this._adaptiveBlurKernel && this._autoComputeBlurKernel();
  }
  _updateGammaSpace() {
    const e = this.getScene();
    e && (this.gammaSpace = !e.imageProcessingConfiguration.isEnabled || !e.imageProcessingConfiguration.applyByPostProcess);
  }
  /**
   * Instantiates a Mirror Texture.
   * Mirror texture can be used to simulate the view from a mirror in a scene.
   * It will dynamically be rendered every frame to adapt to the camera point of view.
   * You can then easily use it as a reflectionTexture on a flat surface.
   * In case the surface is not a plane, please consider relying on reflection probes.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#mirrors
   * @param name
   * @param size
   * @param scene
   * @param generateMipMaps
   * @param type
   * @param samplingMode
   * @param generateDepthBuffer
   */
  constructor(e, t, i, s, r = 0, n = L.BILINEAR_SAMPLINGMODE, o = !0) {
    if (super(e, t, i, s, !0, r, !1, n, o), this.mirrorPlane = new bi(0, 1, 0, 1), this._transformMatrix = ce.Zero(), this._mirrorMatrix = ce.Zero(), this._adaptiveBlurKernel = 0, this._blurKernelX = 0, this._blurKernelY = 0, this._blurRatio = 1, i = this.getScene(), !i)
      return this;
    this.ignoreCameraViewport = !0, this._updateGammaSpace(), this._imageProcessingConfigChangeObserver = i.imageProcessingConfiguration.onUpdateParameters.add(() => {
      this._updateGammaSpace();
    });
    const l = i.getEngine();
    l.supportsUniformBuffers && (this._sceneUBO = i.createSceneUniformBuffer(`Scene for Mirror Texture (name "${e}")`)), this.onBeforeBindObservable.add(() => {
      l._debugPushGroup?.(`mirror generation for ${e}`, 1);
    }), this.onAfterUnbindObservable.add(() => {
      l._debugPopGroup?.(1);
    });
    let h;
    this.onBeforeRenderObservable.add(() => {
      this._sceneUBO && (this._currentSceneUBO = i.getSceneUniformBuffer(), i.setSceneUniformBuffer(this._sceneUBO), i.getSceneUniformBuffer().unbindEffect()), ce.ReflectionToRef(this.mirrorPlane, this._mirrorMatrix), this._mirrorMatrix.multiplyToRef(i.getViewMatrix(), this._transformMatrix), i.setTransformMatrix(this._transformMatrix, i.getProjectionMatrix()), h = i.clipPlane, i.clipPlane = this.mirrorPlane, i._mirroredCameraPosition = C.TransformCoordinates(i.activeCamera.globalPosition, this._mirrorMatrix);
    }), this.onAfterRenderObservable.add(() => {
      this._sceneUBO && i.setSceneUniformBuffer(this._currentSceneUBO), i.updateTransformMatrix(), i._mirroredCameraPosition = null, i.clipPlane = h;
    });
  }
  _preparePostProcesses() {
    if (this.clearPostProcesses(!0), this._blurKernelX && this._blurKernelY) {
      const e = this.getScene().getEngine(), t = e.getCaps().textureFloatRender && e.getCaps().textureFloatLinearFiltering ? 1 : 2;
      this._blurX = new Xt("horizontal blur", new ve(1, 0), this._blurKernelX, this._blurRatio, null, L.BILINEAR_SAMPLINGMODE, e, !1, t), this._blurX.autoClear = !1, this._blurRatio === 1 && this.samples < 2 && this._texture ? this._blurX.inputTexture = this._renderTarget : this._blurX.alwaysForcePOT = !0, this._blurY = new Xt("vertical blur", new ve(0, 1), this._blurKernelY, this._blurRatio, null, L.BILINEAR_SAMPLINGMODE, e, !1, t), this._blurY.autoClear = !1, this._blurY.alwaysForcePOT = this._blurRatio !== 1, this.addPostProcess(this._blurX), this.addPostProcess(this._blurY);
    } else
      this._blurY && (this.removePostProcess(this._blurY), this._blurY.dispose(), this._blurY = null), this._blurX && (this.removePostProcess(this._blurX), this._blurX.dispose(), this._blurX = null);
  }
  /**
   * Clone the mirror texture.
   * @returns the cloned texture
   */
  clone() {
    const e = this.getScene();
    if (!e)
      return this;
    const t = this.getSize(), i = new ut(this.name, t.width, e, this._renderTargetOptions.generateMipMaps, this._renderTargetOptions.type, this._renderTargetOptions.samplingMode, this._renderTargetOptions.generateDepthBuffer);
    return i.hasAlpha = this.hasAlpha, i.level = this.level, i.mirrorPlane = this.mirrorPlane.clone(), this.renderList && (i.renderList = this.renderList.slice(0)), i;
  }
  /**
   * Serialize the texture to a JSON representation you could use in Parse later on
   * @returns the serialized JSON representation
   */
  serialize() {
    if (!this.name)
      return null;
    const e = super.serialize();
    return e.mirrorPlane = this.mirrorPlane.asArray(), e;
  }
  /**
   * Dispose the texture and release its associated resources.
   */
  dispose() {
    super.dispose();
    const e = this.getScene();
    e && e.imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingConfigChangeObserver), this._sceneUBO?.dispose();
  }
}
L._CreateMirror = (a, e, t, i) => new ut(a, e, t, i);
const xs = "backgroundFragmentDeclaration", Os = `uniform vec4 vEyePosition;uniform vec4 vPrimaryColor;
#ifdef USEHIGHLIGHTANDSHADOWCOLORS
uniform vec4 vPrimaryColorShadow;
#endif
uniform float shadowLevel;uniform float alpha;
#ifdef DIFFUSE
uniform vec2 vDiffuseInfos;
#endif
#ifdef REFLECTION
uniform vec2 vReflectionInfos;uniform mat4 reflectionMatrix;uniform vec3 vReflectionMicrosurfaceInfos;
#endif
#if defined(REFLECTIONFRESNEL) || defined(OPACITYFRESNEL)
uniform vec3 vBackgroundCenter;
#endif
#ifdef REFLECTIONFRESNEL
uniform vec4 vReflectionControl;
#endif
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)
uniform mat4 view;
#endif
#ifdef PROJECTED_GROUND
uniform vec2 projectedGroundInfos;
#endif
`;
We.IncludesShadersStore[xs] = Os;
const Ns = "backgroundUboDeclaration", Fs = `layout(std140,column_major) uniform;uniform Material
{uniform vec4 vPrimaryColor;uniform vec4 vPrimaryColorShadow;uniform vec2 vDiffuseInfos;uniform vec2 vReflectionInfos;uniform mat4 diffuseMatrix;uniform mat4 reflectionMatrix;uniform vec3 vReflectionMicrosurfaceInfos;uniform float fFovMultiplier;uniform float pointSize;uniform float shadowLevel;uniform float alpha;uniform vec3 vBackgroundCenter;uniform vec4 vReflectionControl;uniform vec2 projectedGroundInfos;};
#include<sceneUboDeclaration>
`;
We.IncludesShadersStore[Ns] = Fs;
const Ds = "backgroundPixelShader", Ls = `#ifdef TEXTURELODSUPPORT
#extension GL_EXT_shader_texture_lod : enable
#endif
precision highp float;
#include<__decl__backgroundFragment>
#include<helperFunctions>
varying vec3 vPositionW;
#ifdef MAINUV1
varying vec2 vMainUV1;
#endif 
#ifdef MAINUV2 
varying vec2 vMainUV2; 
#endif 
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef DIFFUSE
#if DIFFUSEDIRECTUV==1
#define vDiffuseUV vMainUV1
#elif DIFFUSEDIRECTUV==2
#define vDiffuseUV vMainUV2
#else
varying vec2 vDiffuseUV;
#endif
uniform sampler2D diffuseSampler;
#endif
#ifdef REFLECTION
#ifdef REFLECTIONMAP_3D
#define sampleReflection(s,c) textureCube(s,c)
uniform samplerCube reflectionSampler;
#ifdef TEXTURELODSUPPORT
#define sampleReflectionLod(s,c,l) textureCubeLodEXT(s,c,l)
#else
uniform samplerCube reflectionSamplerLow;uniform samplerCube reflectionSamplerHigh;
#endif
#else
#define sampleReflection(s,c) texture2D(s,c)
uniform sampler2D reflectionSampler;
#ifdef TEXTURELODSUPPORT
#define sampleReflectionLod(s,c,l) texture2DLodEXT(s,c,l)
#else
uniform samplerCube reflectionSamplerLow;uniform samplerCube reflectionSamplerHigh;
#endif
#endif
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#endif
#include<reflectionFunction>
#endif
#ifndef FROMLINEARSPACE
#define FROMLINEARSPACE;
#endif
#ifndef SHADOWONLY
#define SHADOWONLY;
#endif
#include<imageProcessingDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<imageProcessingFunctions>
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
#include<logDepthDeclaration>
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#ifdef REFLECTIONFRESNEL
#define FRESNEL_MAXIMUM_ON_ROUGH 0.25
vec3 fresnelSchlickEnvironmentGGX(float VdotN,vec3 reflectance0,vec3 reflectance90,float smoothness)
{float weight=mix(FRESNEL_MAXIMUM_ON_ROUGH,1.0,smoothness);return reflectance0+weight*(reflectance90-reflectance0)*pow5(saturate(1.0-VdotN));}
#endif
#ifdef PROJECTED_GROUND
float diskIntersectWithBackFaceCulling(vec3 ro,vec3 rd,vec3 c,float r) {float d=rd.y;if(d>0.0) { return 1e6; }
vec3 o=ro-c;float t=-o.y/d;vec3 q=o+rd*t;return (dot(q,q)<r*r) ? t : 1e6;}
float sphereIntersect(vec3 ro,vec3 rd,float ra) {float b=dot(ro,rd);float c=dot(ro,ro)-ra*ra;float h=b*b-c;if(h<0.0) { return -1.0; }
h=sqrt(h);return-b+h;}
vec3 project(vec3 viewDirectionW,vec3 eyePosition) {float radius=projectedGroundInfos.x;float height=projectedGroundInfos.y;vec3 camDir=-viewDirectionW;float skySphereDistance=sphereIntersect(eyePosition,camDir,radius);vec3 skySpherePositionW=eyePosition+camDir*skySphereDistance;vec3 p=normalize(skySpherePositionW);eyePosition.y-=height;float sIntersection=sphereIntersect(eyePosition,p,radius);vec3 h=vec3(0.0,-height,0.0);float dIntersection=diskIntersectWithBackFaceCulling(eyePosition,p,h,radius);p=(eyePosition+min(sIntersection,dIntersection)*p);return p;}
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);
#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=vec3(0.0,1.0,0.0);
#endif
float shadow=1.;float globalShadow=0.;float shadowLightCount=0.;float aggShadow=0.;float numLights=0.;
#include<lightFragment>[0..maxSimultaneousLights]
#ifdef SHADOWINUSE
globalShadow/=shadowLightCount;
#else
globalShadow=1.0;
#endif
#ifndef BACKMAT_SHADOWONLY
vec4 reflectionColor=vec4(1.,1.,1.,1.);
#ifdef REFLECTION
#ifdef PROJECTED_GROUND
vec3 reflectionVector=project(viewDirectionW,vEyePosition.xyz);reflectionVector=vec3(reflectionMatrix*vec4(reflectionVector,1.));
#else
vec3 reflectionVector=computeReflectionCoords(vec4(vPositionW,1.0),normalW);
#endif
#ifdef REFLECTIONMAP_OPPOSITEZ
reflectionVector.z*=-1.0;
#endif
#ifdef REFLECTIONMAP_3D
vec3 reflectionCoords=reflectionVector;
#else
vec2 reflectionCoords=reflectionVector.xy;
#ifdef REFLECTIONMAP_PROJECTION
reflectionCoords/=reflectionVector.z;
#endif
reflectionCoords.y=1.0-reflectionCoords.y;
#endif
#ifdef REFLECTIONBLUR
float reflectionLOD=vReflectionInfos.y;
#ifdef TEXTURELODSUPPORT
reflectionLOD=reflectionLOD*log2(vReflectionMicrosurfaceInfos.x)*vReflectionMicrosurfaceInfos.y+vReflectionMicrosurfaceInfos.z;reflectionColor=sampleReflectionLod(reflectionSampler,reflectionCoords,reflectionLOD);
#else
float lodReflectionNormalized=saturate(reflectionLOD);float lodReflectionNormalizedDoubled=lodReflectionNormalized*2.0;vec4 reflectionSpecularMid=sampleReflection(reflectionSampler,reflectionCoords);if(lodReflectionNormalizedDoubled<1.0){reflectionColor=mix(
sampleReflection(reflectionSamplerHigh,reflectionCoords),
reflectionSpecularMid,
lodReflectionNormalizedDoubled
);} else {reflectionColor=mix(
reflectionSpecularMid,
sampleReflection(reflectionSamplerLow,reflectionCoords),
lodReflectionNormalizedDoubled-1.0
);}
#endif
#else
vec4 reflectionSample=sampleReflection(reflectionSampler,reflectionCoords);reflectionColor=reflectionSample;
#endif
#ifdef RGBDREFLECTION
reflectionColor.rgb=fromRGBD(reflectionColor);
#endif
#ifdef GAMMAREFLECTION
reflectionColor.rgb=toLinearSpace(reflectionColor.rgb);
#endif
#ifdef REFLECTIONBGR
reflectionColor.rgb=reflectionColor.bgr;
#endif
reflectionColor.rgb*=vReflectionInfos.x;
#endif
vec3 diffuseColor=vec3(1.,1.,1.);float finalAlpha=alpha;
#ifdef DIFFUSE
vec4 diffuseMap=texture2D(diffuseSampler,vDiffuseUV);
#ifdef GAMMADIFFUSE
diffuseMap.rgb=toLinearSpace(diffuseMap.rgb);
#endif
diffuseMap.rgb*=vDiffuseInfos.y;
#ifdef DIFFUSEHASALPHA
finalAlpha*=diffuseMap.a;
#endif
diffuseColor=diffuseMap.rgb;
#endif
#ifdef REFLECTIONFRESNEL
vec3 colorBase=diffuseColor;
#else
vec3 colorBase=reflectionColor.rgb*diffuseColor;
#endif
colorBase=max(colorBase,0.0);
#ifdef USERGBCOLOR
vec3 finalColor=colorBase;
#else
#ifdef USEHIGHLIGHTANDSHADOWCOLORS
vec3 mainColor=mix(vPrimaryColorShadow.rgb,vPrimaryColor.rgb,colorBase);
#else
vec3 mainColor=vPrimaryColor.rgb;
#endif
vec3 finalColor=colorBase*mainColor;
#endif
#ifdef REFLECTIONFRESNEL
vec3 reflectionAmount=vReflectionControl.xxx;vec3 reflectionReflectance0=vReflectionControl.yyy;vec3 reflectionReflectance90=vReflectionControl.zzz;float VdotN=dot(normalize(vEyePosition.xyz),normalW);vec3 planarReflectionFresnel=fresnelSchlickEnvironmentGGX(saturate(VdotN),reflectionReflectance0,reflectionReflectance90,1.0);reflectionAmount*=planarReflectionFresnel;
#ifdef REFLECTIONFALLOFF
float reflectionDistanceFalloff=1.0-saturate(length(vPositionW.xyz-vBackgroundCenter)*vReflectionControl.w);reflectionDistanceFalloff*=reflectionDistanceFalloff;reflectionAmount*=reflectionDistanceFalloff;
#endif
finalColor=mix(finalColor,reflectionColor.rgb,saturate(reflectionAmount));
#endif
#ifdef OPACITYFRESNEL
float viewAngleToFloor=dot(normalW,normalize(vEyePosition.xyz-vBackgroundCenter));const float startAngle=0.1;float fadeFactor=saturate(viewAngleToFloor/startAngle);finalAlpha*=fadeFactor*fadeFactor;
#endif
#ifdef SHADOWINUSE
finalColor=mix(finalColor*shadowLevel,finalColor,globalShadow);
#endif
vec4 color=vec4(finalColor,finalAlpha);
#else
vec4 color=vec4(vPrimaryColor.rgb,(1.0-clamp(globalShadow,0.,1.))*alpha);
#endif
#include<logDepthFragment>
#include<fogFragment>
#ifdef IMAGEPROCESSINGPOSTPROCESS
#if !defined(SKIPFINALCOLORCLAMP)
color.rgb=clamp(color.rgb,0.,30.0);
#endif
#else
color=applyImageProcessing(color);
#endif
#ifdef PREMULTIPLYALPHA
color.rgb*=color.a;
#endif
#ifdef NOISE
color.rgb+=dither(vPositionW.xy,0.5);color=max(color,0.0);
#endif
gl_FragColor=color;
#define CUSTOM_FRAGMENT_MAIN_END
}
`;
We.ShadersStore[Ds] = Ls;
const ws = "backgroundVertexDeclaration", Bs = `uniform mat4 view;uniform mat4 viewProjection;uniform float shadowLevel;
#ifdef DIFFUSE
uniform mat4 diffuseMatrix;uniform vec2 vDiffuseInfos;
#endif
#ifdef REFLECTION
uniform vec2 vReflectionInfos;uniform mat4 reflectionMatrix;uniform vec3 vReflectionMicrosurfaceInfos;uniform float fFovMultiplier;
#endif
#ifdef POINTSIZE
uniform float pointSize;
#endif
`;
We.IncludesShadersStore[ws] = Bs;
const ks = "backgroundVertexShader", Vs = `precision highp float;
#include<__decl__backgroundVertex>
#include<helperFunctions>
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef MAINUV1
varying vec2 vMainUV1;
#endif
#ifdef MAINUV2
varying vec2 vMainUV2;
#endif
#if defined(DIFFUSE) && DIFFUSEDIRECTUV==0
varying vec2 vDiffuseUV;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef REFLECTIONMAP_SKYBOX
vPositionUVW=position;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*finalWorld*vec4(position,1.0);} else {gl_Position=viewProjectionR*finalWorld*vec4(position,1.0);}
#else
gl_Position=viewProjection*finalWorld*vec4(position,1.0);
#endif
vec4 worldPos=finalWorld*vec4(position,1.0);vPositionW=vec3(worldPos);
#ifdef NORMAL
mat3 normalWorld=mat3(finalWorld);
#ifdef NONUNIFORMSCALING
normalWorld=transposeMat3(inverseMat3(normalWorld));
#endif
vNormalW=normalize(normalWorld*normal);
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
vDirectionW=normalize(vec3(finalWorld*vec4(position,0.0)));
#ifdef EQUIRECTANGULAR_RELFECTION_FOV
mat3 screenToWorld=inverseMat3(mat3(finalWorld*viewProjection));vec3 segment=mix(vDirectionW,screenToWorld*vec3(0.0,0.0,1.0),abs(fFovMultiplier-1.0));if (fFovMultiplier<=1.0) {vDirectionW=normalize(segment);} else {vDirectionW=normalize(vDirectionW+(vDirectionW-segment));}
#endif
#endif
#ifndef UV1
vec2 uv=vec2(0.,0.);
#endif
#ifndef UV2
vec2 uv2=vec2(0.,0.);
#endif
#ifdef MAINUV1
vMainUV1=uv;
#endif
#ifdef MAINUV2
vMainUV2=uv2;
#endif
#if defined(DIFFUSE) && DIFFUSEDIRECTUV==0
if (vDiffuseInfos.x==0.)
{vDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));}
else
{vDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));}
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#ifdef VERTEXCOLOR
vColor=color;
#endif
#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;
We.ShadersStore[ks] = Vs;
class Us extends yi {
  /**
   * Constructor of the defines.
   */
  constructor() {
    super(), this.DIFFUSE = !1, this.DIFFUSEDIRECTUV = 0, this.GAMMADIFFUSE = !1, this.DIFFUSEHASALPHA = !1, this.OPACITYFRESNEL = !1, this.REFLECTIONBLUR = !1, this.REFLECTIONFRESNEL = !1, this.REFLECTIONFALLOFF = !1, this.TEXTURELODSUPPORT = !1, this.PREMULTIPLYALPHA = !1, this.USERGBCOLOR = !1, this.USEHIGHLIGHTANDSHADOWCOLORS = !1, this.BACKMAT_SHADOWONLY = !1, this.NOISE = !1, this.REFLECTIONBGR = !1, this.PROJECTED_GROUND = !1, this.IMAGEPROCESSING = !1, this.VIGNETTE = !1, this.VIGNETTEBLENDMODEMULTIPLY = !1, this.VIGNETTEBLENDMODEOPAQUE = !1, this.TONEMAPPING = !1, this.TONEMAPPING_ACES = !1, this.CONTRAST = !1, this.COLORCURVES = !1, this.COLORGRADING = !1, this.COLORGRADING3D = !1, this.SAMPLER3DGREENDEPTH = !1, this.SAMPLER3DBGRMAP = !1, this.DITHER = !1, this.IMAGEPROCESSINGPOSTPROCESS = !1, this.SKIPFINALCOLORCLAMP = !1, this.EXPOSURE = !1, this.MULTIVIEW = !1, this.REFLECTION = !1, this.REFLECTIONMAP_3D = !1, this.REFLECTIONMAP_SPHERICAL = !1, this.REFLECTIONMAP_PLANAR = !1, this.REFLECTIONMAP_CUBIC = !1, this.REFLECTIONMAP_PROJECTION = !1, this.REFLECTIONMAP_SKYBOX = !1, this.REFLECTIONMAP_EXPLICIT = !1, this.REFLECTIONMAP_EQUIRECTANGULAR = !1, this.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = !1, this.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = !1, this.INVERTCUBICMAP = !1, this.REFLECTIONMAP_OPPOSITEZ = !1, this.LODINREFLECTIONALPHA = !1, this.GAMMAREFLECTION = !1, this.RGBDREFLECTION = !1, this.EQUIRECTANGULAR_RELFECTION_FOV = !1, this.MAINUV1 = !1, this.MAINUV2 = !1, this.UV1 = !1, this.UV2 = !1, this.CLIPPLANE = !1, this.CLIPPLANE2 = !1, this.CLIPPLANE3 = !1, this.CLIPPLANE4 = !1, this.CLIPPLANE5 = !1, this.CLIPPLANE6 = !1, this.POINTSIZE = !1, this.FOG = !1, this.NORMAL = !1, this.NUM_BONE_INFLUENCERS = 0, this.BonesPerMesh = 0, this.INSTANCES = !1, this.SHADOWFLOAT = !1, this.LOGARITHMICDEPTH = !1, this.NONUNIFORMSCALING = !1, this.ALPHATEST = !1, this.rebuild();
  }
}
class y extends Si {
  /**
   * Experimental Internal Use Only.
   *
   * Key light Color in "perceptual value" meaning the color you would like to see on screen.
   * This acts as a helper to set the primary color to a more "human friendly" value.
   * Conversion to linear space as well as exposure and tone mapping correction will be applied to keep the
   * output color as close as possible from the chosen value.
   * (This does not account for contrast color grading and color curves as they are considered post effect and not directly
   * part of lighting setup.)
   */
  get _perceptualColor() {
    return this.__perceptualColor;
  }
  set _perceptualColor(e) {
    this.__perceptualColor = e, this._computePrimaryColorFromPerceptualColor(), this._markAllSubMeshesAsLightsDirty();
  }
  /**
   * Defines the level of the shadows (dark area of the reflection map) in order to help scaling the colors.
   * The color opposite to the primary color is used at the level chosen to define what the black area would look.
   */
  get primaryColorShadowLevel() {
    return this._primaryColorShadowLevel;
  }
  set primaryColorShadowLevel(e) {
    this._primaryColorShadowLevel = e, this._computePrimaryColors(), this._markAllSubMeshesAsLightsDirty();
  }
  /**
   * Defines the level of the highlights (highlight area of the reflection map) in order to help scaling the colors.
   * The primary color is used at the level chosen to define what the white area would look.
   */
  get primaryColorHighlightLevel() {
    return this._primaryColorHighlightLevel;
  }
  set primaryColorHighlightLevel(e) {
    this._primaryColorHighlightLevel = e, this._computePrimaryColors(), this._markAllSubMeshesAsLightsDirty();
  }
  /**
   * Sets the reflection reflectance fresnel values according to the default standard
   * empirically know to work well :-)
   */
  set reflectionStandardFresnelWeight(e) {
    let t = e;
    t < 0.5 ? (t = t * 2, this.reflectionReflectance0 = y.StandardReflectance0 * t, this.reflectionReflectance90 = y.StandardReflectance90 * t) : (t = t * 2 - 1, this.reflectionReflectance0 = y.StandardReflectance0 + (1 - y.StandardReflectance0) * t, this.reflectionReflectance90 = y.StandardReflectance90 + (1 - y.StandardReflectance90) * t);
  }
  /**
   * The current fov(field of view) multiplier, 0.0 - 2.0. Defaults to 1.0. Lower values "zoom in" and higher values "zoom out".
   * Best used when trying to implement visual zoom effects like fish-eye or binoculars while not adjusting camera fov.
   * Recommended to be keep at 1.0 except for special cases.
   */
  get fovMultiplier() {
    return this._fovMultiplier;
  }
  set fovMultiplier(e) {
    isNaN(e) && (e = 1), this._fovMultiplier = Math.max(0, Math.min(2, e));
  }
  /**
   * Attaches a new image processing configuration to the PBR Material.
   * @param configuration (if null the scene configuration will be use)
   */
  _attachImageProcessingConfiguration(e) {
    e !== this._imageProcessingConfiguration && (this._imageProcessingConfiguration && this._imageProcessingObserver && this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver), e ? this._imageProcessingConfiguration = e : this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration, this._imageProcessingConfiguration && (this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
      this._computePrimaryColorFromPerceptualColor(), this._markAllSubMeshesAsImageProcessingDirty();
    })));
  }
  /**
   * Gets the image processing configuration used either in this material.
   */
  get imageProcessingConfiguration() {
    return this._imageProcessingConfiguration;
  }
  /**
   * Sets the Default image processing configuration used either in the this material.
   *
   * If sets to null, the scene one is in use.
   */
  set imageProcessingConfiguration(e) {
    this._attachImageProcessingConfiguration(e), this._markAllSubMeshesAsTexturesDirty();
  }
  /**
   * Gets whether the color curves effect is enabled.
   */
  get cameraColorCurvesEnabled() {
    return this.imageProcessingConfiguration.colorCurvesEnabled;
  }
  /**
   * Sets whether the color curves effect is enabled.
   */
  set cameraColorCurvesEnabled(e) {
    this.imageProcessingConfiguration.colorCurvesEnabled = e;
  }
  /**
   * Gets whether the color grading effect is enabled.
   */
  get cameraColorGradingEnabled() {
    return this.imageProcessingConfiguration.colorGradingEnabled;
  }
  /**
   * Gets whether the color grading effect is enabled.
   */
  set cameraColorGradingEnabled(e) {
    this.imageProcessingConfiguration.colorGradingEnabled = e;
  }
  /**
   * Gets whether tonemapping is enabled or not.
   */
  get cameraToneMappingEnabled() {
    return this._imageProcessingConfiguration.toneMappingEnabled;
  }
  /**
   * Sets whether tonemapping is enabled or not
   */
  set cameraToneMappingEnabled(e) {
    this._imageProcessingConfiguration.toneMappingEnabled = e;
  }
  /**
   * The camera exposure used on this material.
   * This property is here and not in the camera to allow controlling exposure without full screen post process.
   * This corresponds to a photographic exposure.
   */
  get cameraExposure() {
    return this._imageProcessingConfiguration.exposure;
  }
  /**
   * The camera exposure used on this material.
   * This property is here and not in the camera to allow controlling exposure without full screen post process.
   * This corresponds to a photographic exposure.
   */
  set cameraExposure(e) {
    this._imageProcessingConfiguration.exposure = e;
  }
  /**
   * Gets The camera contrast used on this material.
   */
  get cameraContrast() {
    return this._imageProcessingConfiguration.contrast;
  }
  /**
   * Sets The camera contrast used on this material.
   */
  set cameraContrast(e) {
    this._imageProcessingConfiguration.contrast = e;
  }
  /**
   * Gets the Color Grading 2D Lookup Texture.
   */
  get cameraColorGradingTexture() {
    return this._imageProcessingConfiguration.colorGradingTexture;
  }
  /**
   * Sets the Color Grading 2D Lookup Texture.
   */
  set cameraColorGradingTexture(e) {
    this.imageProcessingConfiguration.colorGradingTexture = e;
  }
  /**
   * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
   * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
   * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
   * corresponding to low luminance, medium luminance, and high luminance areas respectively.
   */
  get cameraColorCurves() {
    return this.imageProcessingConfiguration.colorCurves;
  }
  /**
   * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
   * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
   * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
   * corresponding to low luminance, medium luminance, and high luminance areas respectively.
   */
  set cameraColorCurves(e) {
    this.imageProcessingConfiguration.colorCurves = e;
  }
  /**
   * Instantiates a Background Material in the given scene
   * @param name The friendly name of the material
   * @param scene The scene to add the material to
   */
  constructor(e, t) {
    super(e, t), this.primaryColor = U.White(), this._primaryColorShadowLevel = 0, this._primaryColorHighlightLevel = 0, this.reflectionTexture = null, this.reflectionBlur = 0, this.diffuseTexture = null, this._shadowLights = null, this.shadowLights = null, this.shadowLevel = 0, this.sceneCenter = C.Zero(), this.opacityFresnel = !0, this.reflectionFresnel = !1, this.reflectionFalloffDistance = 0, this.reflectionAmount = 1, this.reflectionReflectance0 = 0.05, this.reflectionReflectance90 = 0.5, this.useRGBColor = !0, this.enableNoise = !1, this._fovMultiplier = 1, this.useEquirectangularFOV = !1, this._maxSimultaneousLights = 4, this.maxSimultaneousLights = 4, this._shadowOnly = !1, this.shadowOnly = !1, this._imageProcessingObserver = null, this.switchToBGR = !1, this._enableGroundProjection = !1, this.enableGroundProjection = !1, this.projectedGroundRadius = 1e3, this.projectedGroundHeight = 10, this._renderTargets = new Ki(16), this._reflectionControls = _i.Zero(), this._white = U.White(), this._primaryShadowColor = U.Black(), this._primaryHighlightColor = U.Black(), this._attachImageProcessingConfiguration(null), this.getRenderTargetTextures = () => (this._renderTargets.reset(), this._diffuseTexture && this._diffuseTexture.isRenderTarget && this._renderTargets.push(this._diffuseTexture), this._reflectionTexture && this._reflectionTexture.isRenderTarget && this._renderTargets.push(this._reflectionTexture), this._renderTargets);
  }
  /**
   * Gets a boolean indicating that current material needs to register RTT
   */
  get hasRenderTargetTextures() {
    return !!(this._diffuseTexture && this._diffuseTexture.isRenderTarget || this._reflectionTexture && this._reflectionTexture.isRenderTarget);
  }
  /**
   * The entire material has been created in order to prevent overdraw.
   * @returns false
   */
  needAlphaTesting() {
    return !0;
  }
  /**
   * The entire material has been created in order to prevent overdraw.
   * @returns true if blending is enable
   */
  needAlphaBlending() {
    return this.alpha < 1 || this._diffuseTexture != null && this._diffuseTexture.hasAlpha || this._shadowOnly;
  }
  /**
   * Checks whether the material is ready to be rendered for a given mesh.
   * @param mesh The mesh to render
   * @param subMesh The submesh to check against
   * @param useInstances Specify wether or not the material is used with instances
   * @returns true if all the dependencies are ready (Textures, Effects...)
   */
  isReadyForSubMesh(e, t, i = !1) {
    const s = t._drawWrapper;
    if (s.effect && this.isFrozen && s._wasPreviouslyReady && s._wasPreviouslyUsingInstances === i)
      return !0;
    t.materialDefines || (t.materialDefines = new Us());
    const r = this.getScene(), n = t.materialDefines;
    if (this._isReadyForSubMesh(t))
      return !0;
    const o = r.getEngine();
    if (Zi(r, e, n, !1, this._maxSimultaneousLights), n._needNormals = !0, Ji(r, n), n._areTexturesDirty) {
      if (n._needUVs = !1, r.texturesEnabled) {
        if (r.getEngine().getCaps().textureLOD && (n.TEXTURELODSUPPORT = !0), this._diffuseTexture && ke.DiffuseTextureEnabled) {
          if (!this._diffuseTexture.isReadyOrNotBlocking())
            return !1;
          es(this._diffuseTexture, n, "DIFFUSE"), n.DIFFUSEHASALPHA = this._diffuseTexture.hasAlpha, n.GAMMADIFFUSE = this._diffuseTexture.gammaSpace, n.OPACITYFRESNEL = this._opacityFresnel;
        } else
          n.DIFFUSE = !1, n.DIFFUSEDIRECTUV = 0, n.DIFFUSEHASALPHA = !1, n.GAMMADIFFUSE = !1, n.OPACITYFRESNEL = !1;
        const l = this._reflectionTexture;
        if (l && ke.ReflectionTextureEnabled) {
          if (!l.isReadyOrNotBlocking())
            return !1;
          switch (n.REFLECTION = !0, n.GAMMAREFLECTION = l.gammaSpace, n.RGBDREFLECTION = l.isRGBD, n.REFLECTIONBLUR = this._reflectionBlur > 0, n.LODINREFLECTIONALPHA = l.lodLevelInAlpha, n.EQUIRECTANGULAR_RELFECTION_FOV = this.useEquirectangularFOV, n.REFLECTIONBGR = this.switchToBGR, l.coordinatesMode === L.INVCUBIC_MODE && (n.INVERTCUBICMAP = !0), n.REFLECTIONMAP_3D = l.isCube, n.REFLECTIONMAP_OPPOSITEZ = n.REFLECTIONMAP_3D && this.getScene().useRightHandedSystem ? !l.invertZ : l.invertZ, l.coordinatesMode) {
            case L.EXPLICIT_MODE:
              n.REFLECTIONMAP_EXPLICIT = !0;
              break;
            case L.PLANAR_MODE:
              n.REFLECTIONMAP_PLANAR = !0;
              break;
            case L.PROJECTION_MODE:
              n.REFLECTIONMAP_PROJECTION = !0;
              break;
            case L.SKYBOX_MODE:
              n.REFLECTIONMAP_SKYBOX = !0;
              break;
            case L.SPHERICAL_MODE:
              n.REFLECTIONMAP_SPHERICAL = !0;
              break;
            case L.EQUIRECTANGULAR_MODE:
              n.REFLECTIONMAP_EQUIRECTANGULAR = !0;
              break;
            case L.FIXED_EQUIRECTANGULAR_MODE:
              n.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = !0;
              break;
            case L.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
              n.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = !0;
              break;
            case L.CUBIC_MODE:
            case L.INVCUBIC_MODE:
            default:
              n.REFLECTIONMAP_CUBIC = !0;
              break;
          }
          this.reflectionFresnel ? (n.REFLECTIONFRESNEL = !0, n.REFLECTIONFALLOFF = this.reflectionFalloffDistance > 0, this._reflectionControls.x = this.reflectionAmount, this._reflectionControls.y = this.reflectionReflectance0, this._reflectionControls.z = this.reflectionReflectance90, this._reflectionControls.w = 1 / this.reflectionFalloffDistance) : (n.REFLECTIONFRESNEL = !1, n.REFLECTIONFALLOFF = !1);
        } else
          n.REFLECTION = !1, n.REFLECTIONFRESNEL = !1, n.REFLECTIONFALLOFF = !1, n.REFLECTIONBLUR = !1, n.REFLECTIONMAP_3D = !1, n.REFLECTIONMAP_SPHERICAL = !1, n.REFLECTIONMAP_PLANAR = !1, n.REFLECTIONMAP_CUBIC = !1, n.REFLECTIONMAP_PROJECTION = !1, n.REFLECTIONMAP_SKYBOX = !1, n.REFLECTIONMAP_EXPLICIT = !1, n.REFLECTIONMAP_EQUIRECTANGULAR = !1, n.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = !1, n.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = !1, n.INVERTCUBICMAP = !1, n.REFLECTIONMAP_OPPOSITEZ = !1, n.LODINREFLECTIONALPHA = !1, n.GAMMAREFLECTION = !1, n.RGBDREFLECTION = !1;
      }
      n.PREMULTIPLYALPHA = this.alphaMode === 7 || this.alphaMode === 8, n.USERGBCOLOR = this._useRGBColor, n.NOISE = this._enableNoise;
    }
    if (n._areLightsDirty && (n.USEHIGHLIGHTANDSHADOWCOLORS = !this._useRGBColor && (this._primaryColorShadowLevel !== 0 || this._primaryColorHighlightLevel !== 0), n.BACKMAT_SHADOWONLY = this._shadowOnly), n._areImageProcessingDirty && this._imageProcessingConfiguration) {
      if (!this._imageProcessingConfiguration.isReady())
        return !1;
      this._imageProcessingConfiguration.prepareDefines(n);
    }
    if (n._areMiscDirty && (n.REFLECTIONMAP_3D && this._enableGroundProjection ? (n.PROJECTED_GROUND = !0, n.REFLECTIONMAP_SKYBOX = !0) : n.PROJECTED_GROUND = !1), ts(e, r, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(e), n), is(r, o, this, n, i, null, t.getRenderingMesh().hasThinInstances), ss(e, n, !1, !0, !1) && e && !r.getEngine().getCaps().standardDerivatives && !e.isVerticesDataPresent(j.NormalKind) && (e.createNormals(!0), R.Warn("BackgroundMaterial: Normals have been created for the mesh: " + e.name)), n.isDirty) {
      n.markAsProcessed(), r.resetCachedMaterial();
      const l = new Ri();
      n.FOG && l.addFallback(0, "FOG"), n.POINTSIZE && l.addFallback(1, "POINTSIZE"), n.MULTIVIEW && l.addFallback(0, "MULTIVIEW"), rs(n, l, this._maxSimultaneousLights);
      const h = [j.PositionKind];
      n.NORMAL && h.push(j.NormalKind), n.UV1 && h.push(j.UVKind), n.UV2 && h.push(j.UV2Kind), ns(h, e, n, l), os(h, n);
      const c = [
        "world",
        "view",
        "viewProjection",
        "vEyePosition",
        "vLightsType",
        "vFogInfos",
        "vFogColor",
        "pointSize",
        "mBones",
        "vPrimaryColor",
        "vPrimaryColorShadow",
        "vReflectionInfos",
        "reflectionMatrix",
        "vReflectionMicrosurfaceInfos",
        "fFovMultiplier",
        "shadowLevel",
        "alpha",
        "vBackgroundCenter",
        "vReflectionControl",
        "vDiffuseInfos",
        "diffuseMatrix",
        "projectedGroundInfos",
        "logarithmicDepthConstant"
      ];
      as(c);
      const d = ["diffuseSampler", "reflectionSampler", "reflectionSamplerLow", "reflectionSamplerHigh"], f = ["Material", "Scene"];
      gt && (gt.PrepareUniforms(c, n), gt.PrepareSamplers(d, n)), ls({
        uniformsNames: c,
        uniformBuffersNames: f,
        samplers: d,
        defines: n,
        maxSimultaneousLights: this._maxSimultaneousLights
      });
      const _ = n.toString(), g = r.getEngine().createEffect("background", {
        attributes: h,
        uniformsNames: c,
        uniformBuffersNames: f,
        samplers: d,
        defines: _,
        fallbacks: l,
        onCompiled: this.onCompiled,
        onError: this.onError,
        indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights }
      }, o);
      t.setEffect(g, n, this._materialContext), this.buildUniformLayout();
    }
    return !t.effect || !t.effect.isReady() ? !1 : (n._renderId = r.getRenderId(), s._wasPreviouslyReady = !0, s._wasPreviouslyUsingInstances = i, this._checkScenePerformancePriority(), !0);
  }
  /**
   * Compute the primary color according to the chosen perceptual color.
   */
  _computePrimaryColorFromPerceptualColor() {
    this.__perceptualColor && (this._primaryColor.copyFrom(this.__perceptualColor), this._primaryColor.toLinearSpaceToRef(this._primaryColor, this.getScene().getEngine().useExactSrgbConversions), this._imageProcessingConfiguration && this._primaryColor.scaleToRef(1 / this._imageProcessingConfiguration.exposure, this._primaryColor), this._computePrimaryColors());
  }
  /**
   * Compute the highlights and shadow colors according to their chosen levels.
   */
  _computePrimaryColors() {
    this._primaryColorShadowLevel === 0 && this._primaryColorHighlightLevel === 0 || (this._primaryColor.scaleToRef(this._primaryColorShadowLevel, this._primaryShadowColor), this._primaryColor.subtractToRef(this._primaryShadowColor, this._primaryShadowColor), this._white.subtractToRef(this._primaryColor, this._primaryHighlightColor), this._primaryHighlightColor.scaleToRef(this._primaryColorHighlightLevel, this._primaryHighlightColor), this._primaryColor.addToRef(this._primaryHighlightColor, this._primaryHighlightColor));
  }
  /**
   * Build the uniform buffer used in the material.
   */
  buildUniformLayout() {
    this._uniformBuffer.addUniform("vPrimaryColor", 4), this._uniformBuffer.addUniform("vPrimaryColorShadow", 4), this._uniformBuffer.addUniform("vDiffuseInfos", 2), this._uniformBuffer.addUniform("vReflectionInfos", 2), this._uniformBuffer.addUniform("diffuseMatrix", 16), this._uniformBuffer.addUniform("reflectionMatrix", 16), this._uniformBuffer.addUniform("vReflectionMicrosurfaceInfos", 3), this._uniformBuffer.addUniform("fFovMultiplier", 1), this._uniformBuffer.addUniform("pointSize", 1), this._uniformBuffer.addUniform("shadowLevel", 1), this._uniformBuffer.addUniform("alpha", 1), this._uniformBuffer.addUniform("vBackgroundCenter", 3), this._uniformBuffer.addUniform("vReflectionControl", 4), this._uniformBuffer.addUniform("projectedGroundInfos", 2), this._uniformBuffer.create();
  }
  /**
   * Unbind the material.
   */
  unbind() {
    this._diffuseTexture && this._diffuseTexture.isRenderTarget && this._uniformBuffer.setTexture("diffuseSampler", null), this._reflectionTexture && this._reflectionTexture.isRenderTarget && this._uniformBuffer.setTexture("reflectionSampler", null), super.unbind();
  }
  /**
   * Bind only the world matrix to the material.
   * @param world The world matrix to bind.
   */
  bindOnlyWorldMatrix(e) {
    this._activeEffect.setMatrix("world", e);
  }
  /**
   * Bind the material for a dedicated submesh (every used meshes will be considered opaque).
   * @param world The world matrix to bind.
   * @param mesh the mesh to bind for.
   * @param subMesh The submesh to bind for.
   */
  bindForSubMesh(e, t, i) {
    const s = this.getScene(), r = i.materialDefines;
    if (!r)
      return;
    const n = i.effect;
    if (!n)
      return;
    this._activeEffect = n, this.bindOnlyWorldMatrix(e), hs(t, this._activeEffect);
    const o = this._mustRebind(s, n, i, t.visibility);
    if (o) {
      this._uniformBuffer.bindToEffect(n, "Material"), this.bindViewProjection(n);
      const l = this._reflectionTexture;
      (!this._uniformBuffer.useUbo || !this.isFrozen || !this._uniformBuffer.isSync || i._drawWrapper._forceRebindOnNextCall) && (s.texturesEnabled && (this._diffuseTexture && ke.DiffuseTextureEnabled && (this._uniformBuffer.updateFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level), cs(this._diffuseTexture, this._uniformBuffer, "diffuse")), l && ke.ReflectionTextureEnabled && (this._uniformBuffer.updateMatrix("reflectionMatrix", l.getReflectionTextureMatrix()), this._uniformBuffer.updateFloat2("vReflectionInfos", l.level, this._reflectionBlur), this._uniformBuffer.updateFloat3("vReflectionMicrosurfaceInfos", l.getSize().width, l.lodGenerationScale, l.lodGenerationOffset))), this.shadowLevel > 0 && this._uniformBuffer.updateFloat("shadowLevel", this.shadowLevel), this._uniformBuffer.updateFloat("alpha", this.alpha), this.pointsCloud && this._uniformBuffer.updateFloat("pointSize", this.pointSize), r.USEHIGHLIGHTANDSHADOWCOLORS ? (this._uniformBuffer.updateColor4("vPrimaryColor", this._primaryHighlightColor, 1), this._uniformBuffer.updateColor4("vPrimaryColorShadow", this._primaryShadowColor, 1)) : this._uniformBuffer.updateColor4("vPrimaryColor", this._primaryColor, 1)), this._uniformBuffer.updateFloat("fFovMultiplier", this._fovMultiplier), s.texturesEnabled && (this._diffuseTexture && ke.DiffuseTextureEnabled && this._uniformBuffer.setTexture("diffuseSampler", this._diffuseTexture), l && ke.ReflectionTextureEnabled && (r.REFLECTIONBLUR && r.TEXTURELODSUPPORT ? this._uniformBuffer.setTexture("reflectionSampler", l) : r.REFLECTIONBLUR ? (this._uniformBuffer.setTexture("reflectionSampler", l._lodTextureMid || l), this._uniformBuffer.setTexture("reflectionSamplerLow", l._lodTextureLow || l), this._uniformBuffer.setTexture("reflectionSamplerHigh", l._lodTextureHigh || l)) : this._uniformBuffer.setTexture("reflectionSampler", l), r.REFLECTIONFRESNEL && (this._uniformBuffer.updateFloat3("vBackgroundCenter", this.sceneCenter.x, this.sceneCenter.y, this.sceneCenter.z), this._uniformBuffer.updateFloat4("vReflectionControl", this._reflectionControls.x, this._reflectionControls.y, this._reflectionControls.z, this._reflectionControls.w))), r.PROJECTED_GROUND && this._uniformBuffer.updateFloat2("projectedGroundInfos", this.projectedGroundRadius, this.projectedGroundHeight)), us(this._activeEffect, this, s), s.bindEyePosition(n);
    } else s.getEngine()._features.needToAlwaysBindUniformBuffers && (this._uniformBuffer.bindToEffect(n, "Material"), this._needToBindSceneUbo = !0);
    (o || !this.isFrozen) && (s.lightsEnabled && ds(s, t, this._activeEffect, r, this._maxSimultaneousLights), this.bindView(n), fs(s, t, this._activeEffect, !0), this._useLogarithmicDepth && Ei(r, n, s), this._imageProcessingConfiguration && this._imageProcessingConfiguration.bind(this._activeEffect)), this._afterBind(t, this._activeEffect, i), this._uniformBuffer.update();
  }
  /**
   * Checks to see if a texture is used in the material.
   * @param texture - Base texture to use.
   * @returns - Boolean specifying if a texture is used in the material.
   */
  hasTexture(e) {
    return !!(super.hasTexture(e) || this._reflectionTexture === e || this._diffuseTexture === e);
  }
  /**
   * Dispose the material.
   * @param forceDisposeEffect Force disposal of the associated effect.
   * @param forceDisposeTextures Force disposal of the associated textures.
   */
  dispose(e = !1, t = !1) {
    t && (this.diffuseTexture && this.diffuseTexture.dispose(), this.reflectionTexture && this.reflectionTexture.dispose()), this._renderTargets.dispose(), this._imageProcessingConfiguration && this._imageProcessingObserver && this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver), super.dispose(e);
  }
  /**
   * Clones the material.
   * @param name The cloned name.
   * @returns The cloned material.
   */
  clone(e) {
    return Ue.Clone(() => new y(e, this.getScene()), this);
  }
  /**
   * Serializes the current material to its JSON representation.
   * @returns The JSON representation.
   */
  serialize() {
    const e = super.serialize();
    return e.customType = "BABYLON.BackgroundMaterial", e;
  }
  /**
   * Gets the class name of the material
   * @returns "BackgroundMaterial"
   */
  getClassName() {
    return "BackgroundMaterial";
  }
  /**
   * Parse a JSON input to create back a background material.
   * @param source The JSON data to parse
   * @param scene The scene to create the parsed material in
   * @param rootUrl The root url of the assets the material depends upon
   * @returns the instantiated BackgroundMaterial.
   */
  static Parse(e, t, i) {
    return Ue.Parse(() => new y(e.name, t), e, t, i);
  }
}
y.StandardReflectance0 = 0.05;
y.StandardReflectance90 = 0.5;
b([
  fi()
], y.prototype, "_primaryColor", void 0);
b([
  $("_markAllSubMeshesAsLightsDirty")
], y.prototype, "primaryColor", void 0);
b([
  fi()
], y.prototype, "__perceptualColor", void 0);
b([
  D()
], y.prototype, "_primaryColorShadowLevel", void 0);
b([
  D()
], y.prototype, "_primaryColorHighlightLevel", void 0);
b([
  $("_markAllSubMeshesAsLightsDirty")
], y.prototype, "primaryColorHighlightLevel", null);
b([
  pi()
], y.prototype, "_reflectionTexture", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "reflectionTexture", void 0);
b([
  D()
], y.prototype, "_reflectionBlur", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "reflectionBlur", void 0);
b([
  pi()
], y.prototype, "_diffuseTexture", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "diffuseTexture", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "shadowLights", void 0);
b([
  D()
], y.prototype, "_shadowLevel", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "shadowLevel", void 0);
b([
  ki()
], y.prototype, "_sceneCenter", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "sceneCenter", void 0);
b([
  D()
], y.prototype, "_opacityFresnel", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "opacityFresnel", void 0);
b([
  D()
], y.prototype, "_reflectionFresnel", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "reflectionFresnel", void 0);
b([
  D()
], y.prototype, "_reflectionFalloffDistance", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "reflectionFalloffDistance", void 0);
b([
  D()
], y.prototype, "_reflectionAmount", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "reflectionAmount", void 0);
b([
  D()
], y.prototype, "_reflectionReflectance0", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "reflectionReflectance0", void 0);
b([
  D()
], y.prototype, "_reflectionReflectance90", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "reflectionReflectance90", void 0);
b([
  D()
], y.prototype, "_useRGBColor", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "useRGBColor", void 0);
b([
  D()
], y.prototype, "_enableNoise", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "enableNoise", void 0);
b([
  D()
], y.prototype, "_maxSimultaneousLights", void 0);
b([
  $("_markAllSubMeshesAsTexturesDirty")
], y.prototype, "maxSimultaneousLights", void 0);
b([
  D()
], y.prototype, "_shadowOnly", void 0);
b([
  $("_markAllSubMeshesAsLightsDirty")
], y.prototype, "shadowOnly", void 0);
b([
  Vi()
], y.prototype, "_imageProcessingConfiguration", void 0);
b([
  D(),
  $("_markAllSubMeshesAsMiscDirty")
], y.prototype, "enableGroundProjection", void 0);
b([
  D()
], y.prototype, "projectedGroundRadius", void 0);
b([
  D()
], y.prototype, "projectedGroundHeight", void 0);
q("BABYLON.BackgroundMaterial", y);
class we {
  /**
   * Creates the default options for the helper.
   * @param scene The scene the environment helper belongs to.
   * @returns default options for the helper.
   */
  static _GetDefaultOptions(e) {
    return {
      createGround: !0,
      groundSize: 15,
      groundTexture: this._GroundTextureCDNUrl,
      groundColor: new U(0.2, 0.2, 0.3).toLinearSpace(e.getEngine().useExactSrgbConversions).scale(3),
      groundOpacity: 0.9,
      enableGroundShadow: !0,
      groundShadowLevel: 0.5,
      enableGroundMirror: !1,
      groundMirrorSizeRatio: 0.3,
      groundMirrorBlurKernel: 64,
      groundMirrorAmount: 1,
      groundMirrorFresnelWeight: 1,
      groundMirrorFallOffDistance: 0,
      groundMirrorTextureType: 0,
      groundYBias: 1e-5,
      createSkybox: !0,
      skyboxSize: 20,
      skyboxTexture: this._SkyboxTextureCDNUrl,
      skyboxColor: new U(0.2, 0.2, 0.3).toLinearSpace(e.getEngine().useExactSrgbConversions).scale(3),
      backgroundYRotation: 0,
      sizeAuto: !0,
      rootPosition: C.Zero(),
      setupImageProcessing: !0,
      environmentTexture: this._EnvironmentTextureCDNUrl,
      cameraExposure: 0.8,
      cameraContrast: 1.2,
      toneMappingEnabled: !0
    };
  }
  /**
   * Gets the root mesh created by the helper.
   */
  get rootMesh() {
    return this._rootMesh;
  }
  /**
   * Gets the skybox created by the helper.
   */
  get skybox() {
    return this._skybox;
  }
  /**
   * Gets the skybox texture created by the helper.
   */
  get skyboxTexture() {
    return this._skyboxTexture;
  }
  /**
   * Gets the skybox material created by the helper.
   */
  get skyboxMaterial() {
    return this._skyboxMaterial;
  }
  /**
   * Gets the ground mesh created by the helper.
   */
  get ground() {
    return this._ground;
  }
  /**
   * Gets the ground texture created by the helper.
   */
  get groundTexture() {
    return this._groundTexture;
  }
  /**
   * Gets the ground mirror created by the helper.
   */
  get groundMirror() {
    return this._groundMirror;
  }
  /**
   * Gets the ground mirror render list to helps pushing the meshes
   * you wish in the ground reflection.
   */
  get groundMirrorRenderList() {
    return this._groundMirror ? this._groundMirror.renderList : null;
  }
  /**
   * Gets the ground material created by the helper.
   */
  get groundMaterial() {
    return this._groundMaterial;
  }
  /**
   * constructor
   * @param options Defines the options we want to customize the helper
   * @param scene The scene to add the material to
   */
  constructor(e, t) {
    this._errorHandler = (i, s) => {
      this.onErrorObservable.notifyObservers({ message: i, exception: s });
    }, this._options = {
      ...we._GetDefaultOptions(t),
      ...e
    }, this._scene = t, this.onErrorObservable = new x(), this._setupBackground(), this._setupImageProcessing();
  }
  /**
   * Updates the environment according to the new options
   * @param options options to configure the helper (IEnvironmentHelperOptions)
   */
  updateOptions(e) {
    const t = {
      ...this._options,
      ...e
    };
    this._ground && !t.createGround && (this._ground.dispose(), this._ground = null), this._groundMaterial && !t.createGround && (this._groundMaterial.dispose(), this._groundMaterial = null), this._groundTexture && this._options.groundTexture != t.groundTexture && (this._groundTexture.dispose(), this._groundTexture = null), this._skybox && !t.createSkybox && (this._skybox.dispose(), this._skybox = null), this._skyboxMaterial && !t.createSkybox && (this._skyboxMaterial.dispose(), this._skyboxMaterial = null), this._skyboxTexture && this._options.skyboxTexture != t.skyboxTexture && (this._skyboxTexture.dispose(), this._skyboxTexture = null), this._groundMirror && !t.enableGroundMirror && (this._groundMirror.dispose(), this._groundMirror = null), this._scene.environmentTexture && this._options.environmentTexture != t.environmentTexture && this._scene.environmentTexture.dispose(), this._options = t, this._setupBackground(), this._setupImageProcessing();
  }
  /**
   * Sets the primary color of all the available elements.
   * @param color the main color to affect to the ground and the background
   */
  setMainColor(e) {
    this.groundMaterial && (this.groundMaterial.primaryColor = e), this.skyboxMaterial && (this.skyboxMaterial.primaryColor = e), this.groundMirror && (this.groundMirror.clearColor = new $e(e.r, e.g, e.b, 1));
  }
  /**
   * Setup the image processing according to the specified options.
   */
  _setupImageProcessing() {
    this._options.setupImageProcessing && (this._scene.imageProcessingConfiguration.contrast = this._options.cameraContrast, this._scene.imageProcessingConfiguration.exposure = this._options.cameraExposure, this._scene.imageProcessingConfiguration.toneMappingEnabled = this._options.toneMappingEnabled, this._setupEnvironmentTexture());
  }
  /**
   * Setup the environment texture according to the specified options.
   */
  _setupEnvironmentTexture() {
    if (this._scene.environmentTexture)
      return;
    if (this._options.environmentTexture instanceof nt) {
      this._scene.environmentTexture = this._options.environmentTexture;
      return;
    }
    const e = Wt.CreateFromPrefilteredData(this._options.environmentTexture, this._scene);
    this._scene.environmentTexture = e;
  }
  /**
   * Setup the background according to the specified options.
   */
  _setupBackground() {
    this._rootMesh || (this._rootMesh = new Xe("BackgroundHelper", this._scene)), this._rootMesh.rotation.y = this._options.backgroundYRotation;
    const e = this._getSceneSize();
    this._options.createGround && (this._setupGround(e), this._setupGroundMaterial(), this._setupGroundDiffuseTexture(), this._options.enableGroundMirror && this._setupGroundMirrorTexture(e), this._setupMirrorInGroundMaterial()), this._options.createSkybox && (this._setupSkybox(e), this._setupSkyboxMaterial(), this._setupSkyboxReflectionTexture()), this._rootMesh.position.x = e.rootPosition.x, this._rootMesh.position.z = e.rootPosition.z, this._rootMesh.position.y = e.rootPosition.y;
  }
  /**
   * Get the scene sizes according to the setup.
   * @returns the different ground and skybox sizes.
   */
  _getSceneSize() {
    let e = this._options.groundSize, t = this._options.skyboxSize, i = this._options.rootPosition;
    if (!this._scene.meshes || this._scene.meshes.length === 1)
      return { groundSize: e, skyboxSize: t, rootPosition: i };
    const s = this._scene.getWorldExtends((n) => n !== this._ground && n !== this._rootMesh && n !== this._skybox), r = s.max.subtract(s.min);
    if (this._options.sizeAuto) {
      this._scene.activeCamera instanceof gi && this._scene.activeCamera.upperRadiusLimit && (e = this._scene.activeCamera.upperRadiusLimit * 2, t = e);
      const n = r.length();
      n > e && (e = n * 2, t = e), e *= 1.1, t *= 1.5, i = s.min.add(r.scale(0.5)), i.y = s.min.y - this._options.groundYBias;
    }
    return { groundSize: e, skyboxSize: t, rootPosition: i };
  }
  /**
   * Setup the ground according to the specified options.
   * @param sceneSize
   */
  _setupGround(e) {
    (!this._ground || this._ground.isDisposed()) && (this._ground = ms("BackgroundPlane", { size: e.groundSize }, this._scene), this._ground.rotation.x = Math.PI / 2, this._ground.parent = this._rootMesh, this._ground.onDisposeObservable.add(() => {
      this._ground = null;
    })), this._ground.receiveShadows = this._options.enableGroundShadow;
  }
  /**
   * Setup the ground material according to the specified options.
   */
  _setupGroundMaterial() {
    this._groundMaterial || (this._groundMaterial = new y("BackgroundPlaneMaterial", this._scene)), this._groundMaterial.alpha = this._options.groundOpacity, this._groundMaterial.alphaMode = 8, this._groundMaterial.shadowLevel = this._options.groundShadowLevel, this._groundMaterial.primaryColor = this._options.groundColor, this._groundMaterial.useRGBColor = !1, this._groundMaterial.enableNoise = !0, this._ground && (this._ground.material = this._groundMaterial);
  }
  /**
   * Setup the ground diffuse texture according to the specified options.
   */
  _setupGroundDiffuseTexture() {
    if (this._groundMaterial && !this._groundTexture) {
      if (this._options.groundTexture instanceof nt) {
        this._groundMaterial.diffuseTexture = this._options.groundTexture;
        return;
      }
      this._groundTexture = new L(this._options.groundTexture, this._scene, void 0, void 0, void 0, void 0, this._errorHandler), this._groundTexture.gammaSpace = !1, this._groundTexture.hasAlpha = !0, this._groundMaterial.diffuseTexture = this._groundTexture;
    }
  }
  /**
   * Setup the ground mirror texture according to the specified options.
   * @param sceneSize
   */
  _setupGroundMirrorTexture(e) {
    const t = L.CLAMP_ADDRESSMODE;
    if (!this._groundMirror && (this._groundMirror = new ut("BackgroundPlaneMirrorTexture", { ratio: this._options.groundMirrorSizeRatio }, this._scene, !1, this._options.groundMirrorTextureType, L.BILINEAR_SAMPLINGMODE, !0), this._groundMirror.mirrorPlane = new bi(0, -1, 0, e.rootPosition.y), this._groundMirror.anisotropicFilteringLevel = 1, this._groundMirror.wrapU = t, this._groundMirror.wrapV = t, this._groundMirror.renderList))
      for (let s = 0; s < this._scene.meshes.length; s++) {
        const r = this._scene.meshes[s];
        r !== this._ground && r !== this._skybox && r !== this._rootMesh && this._groundMirror.renderList.push(r);
      }
    const i = this._options.groundColor.toGammaSpace(this._scene.getEngine().useExactSrgbConversions);
    this._groundMirror.clearColor = new $e(i.r, i.g, i.b, 1), this._groundMirror.adaptiveBlurKernel = this._options.groundMirrorBlurKernel;
  }
  /**
   * Setup the ground to receive the mirror texture.
   */
  _setupMirrorInGroundMaterial() {
    this._groundMaterial && (this._groundMaterial.reflectionTexture = this._groundMirror, this._groundMaterial.reflectionFresnel = !0, this._groundMaterial.reflectionAmount = this._options.groundMirrorAmount, this._groundMaterial.reflectionStandardFresnelWeight = this._options.groundMirrorFresnelWeight, this._groundMaterial.reflectionFalloffDistance = this._options.groundMirrorFallOffDistance);
  }
  /**
   * Setup the skybox according to the specified options.
   * @param sceneSize
   */
  _setupSkybox(e) {
    (!this._skybox || this._skybox.isDisposed()) && (this._skybox = Ti("BackgroundSkybox", { size: e.skyboxSize, sideOrientation: Xe.BACKSIDE }, this._scene), this._skybox.onDisposeObservable.add(() => {
      this._skybox = null;
    })), this._skybox.parent = this._rootMesh;
  }
  /**
   * Setup the skybox material according to the specified options.
   */
  _setupSkyboxMaterial() {
    this._skybox && (this._skyboxMaterial || (this._skyboxMaterial = new y("BackgroundSkyboxMaterial", this._scene)), this._skyboxMaterial.useRGBColor = !1, this._skyboxMaterial.primaryColor = this._options.skyboxColor, this._skyboxMaterial.enableNoise = !0, this._skybox.material = this._skyboxMaterial);
  }
  /**
   * Setup the skybox reflection texture according to the specified options.
   */
  _setupSkyboxReflectionTexture() {
    if (this._skyboxMaterial && !this._skyboxTexture) {
      if (this._options.skyboxTexture instanceof nt) {
        this._skyboxMaterial.reflectionTexture = this._options.skyboxTexture;
        return;
      }
      this._skyboxTexture = new Wt(this._options.skyboxTexture, this._scene, void 0, void 0, void 0, void 0, this._errorHandler), this._skyboxTexture.coordinatesMode = L.SKYBOX_MODE, this._skyboxTexture.gammaSpace = !1, this._skyboxMaterial.reflectionTexture = this._skyboxTexture;
    }
  }
  /**
   * Dispose all the elements created by the Helper.
   */
  dispose() {
    this._groundMaterial && this._groundMaterial.dispose(!0, !0), this._skyboxMaterial && this._skyboxMaterial.dispose(!0, !0), this._rootMesh.dispose(!1);
  }
}
we._GroundTextureCDNUrl = "https://assets.babylonjs.com/environments/backgroundGround.png";
we._SkyboxTextureCDNUrl = "https://assets.babylonjs.com/environments/backgroundSkybox.dds";
we._EnvironmentTextureCDNUrl = "https://assets.babylonjs.com/environments/environmentSpecular.env";
const Gs = 542327876, Qt = 131072, Yt = 512, qt = 4, Kt = 64, Zt = 131072;
function dt(a) {
  return a.charCodeAt(0) + (a.charCodeAt(1) << 8) + (a.charCodeAt(2) << 16) + (a.charCodeAt(3) << 24);
}
function zs(a) {
  return String.fromCharCode(a & 255, a >> 8 & 255, a >> 16 & 255, a >> 24 & 255);
}
const Jt = dt("DXT1"), ei = dt("DXT3"), ti = dt("DXT5"), bt = dt("DX10"), ii = 113, si = 116, ri = 2, ni = 10, $s = 88, yt = 31, Hs = 0, Xs = 1, oi = 2, ai = 3, St = 4, li = 7, Rt = 20, hi = 21, Ws = 22, js = 23, Qs = 24, Ys = 25, qs = 26, Ks = 28, Zs = 32;
class T {
  /**
   * Gets DDS information from an array buffer
   * @param data defines the array buffer view to read data from
   * @returns the DDS information
   */
  static GetDDSInfo(e) {
    const t = new Int32Array(e.buffer, e.byteOffset, yt), i = new Int32Array(e.buffer, e.byteOffset, yt + 4);
    let s = 1;
    t[oi] & Qt && (s = Math.max(1, t[li]));
    const r = t[hi], n = r === bt ? i[Zs] : 0;
    let o = 0;
    switch (r) {
      case ii:
        o = 2;
        break;
      case si:
        o = 1;
        break;
      case bt:
        if (n === ni) {
          o = 2;
          break;
        }
        if (n === ri) {
          o = 1;
          break;
        }
    }
    return {
      width: t[St],
      height: t[ai],
      mipmapCount: s,
      isFourCC: (t[Rt] & qt) === qt,
      isRGB: (t[Rt] & Kt) === Kt,
      isLuminance: (t[Rt] & Zt) === Zt,
      isCube: (t[Ks] & Yt) === Yt,
      isCompressed: r === Jt || r === ei || r === ti,
      dxgiFormat: n,
      textureType: o
    };
  }
  static _GetHalfFloatAsFloatRGBAArrayBuffer(e, t, i, s, r, n) {
    const o = new Float32Array(s), l = new Uint16Array(r, i);
    let h = 0;
    for (let c = 0; c < t; c++)
      for (let d = 0; d < e; d++) {
        const f = (d + c * e) * 4;
        o[h] = Te(l[f]), o[h + 1] = Te(l[f + 1]), o[h + 2] = Te(l[f + 2]), T.StoreLODInAlphaChannel ? o[h + 3] = n : o[h + 3] = Te(l[f + 3]), h += 4;
      }
    return o;
  }
  static _GetHalfFloatRGBAArrayBuffer(e, t, i, s, r, n) {
    if (T.StoreLODInAlphaChannel) {
      const o = new Uint16Array(s), l = new Uint16Array(r, i);
      let h = 0;
      for (let c = 0; c < t; c++)
        for (let d = 0; d < e; d++) {
          const f = (d + c * e) * 4;
          o[h] = l[f], o[h + 1] = l[f + 1], o[h + 2] = l[f + 2], o[h + 3] = Ve(n), h += 4;
        }
      return o;
    }
    return new Uint16Array(r, i, s);
  }
  static _GetFloatRGBAArrayBuffer(e, t, i, s, r, n) {
    if (T.StoreLODInAlphaChannel) {
      const o = new Float32Array(s), l = new Float32Array(r, i);
      let h = 0;
      for (let c = 0; c < t; c++)
        for (let d = 0; d < e; d++) {
          const f = (d + c * e) * 4;
          o[h] = l[f], o[h + 1] = l[f + 1], o[h + 2] = l[f + 2], o[h + 3] = n, h += 4;
        }
      return o;
    }
    return new Float32Array(r, i, s);
  }
  static _GetFloatAsHalfFloatRGBAArrayBuffer(e, t, i, s, r, n) {
    const o = new Uint16Array(s), l = new Float32Array(r, i);
    let h = 0;
    for (let c = 0; c < t; c++)
      for (let d = 0; d < e; d++)
        o[h] = Ve(l[h]), o[h + 1] = Ve(l[h + 1]), o[h + 2] = Ve(l[h + 2]), T.StoreLODInAlphaChannel ? o[h + 3] = Ve(n) : o[h + 3] = Ve(l[h + 3]), h += 4;
    return o;
  }
  static _GetFloatAsUIntRGBAArrayBuffer(e, t, i, s, r, n) {
    const o = new Uint8Array(s), l = new Float32Array(r, i);
    let h = 0;
    for (let c = 0; c < t; c++)
      for (let d = 0; d < e; d++) {
        const f = (d + c * e) * 4;
        o[h] = me.Clamp(l[f]) * 255, o[h + 1] = me.Clamp(l[f + 1]) * 255, o[h + 2] = me.Clamp(l[f + 2]) * 255, T.StoreLODInAlphaChannel ? o[h + 3] = n : o[h + 3] = me.Clamp(l[f + 3]) * 255, h += 4;
      }
    return o;
  }
  static _GetHalfFloatAsUIntRGBAArrayBuffer(e, t, i, s, r, n) {
    const o = new Uint8Array(s), l = new Uint16Array(r, i);
    let h = 0;
    for (let c = 0; c < t; c++)
      for (let d = 0; d < e; d++) {
        const f = (d + c * e) * 4;
        o[h] = me.Clamp(Te(l[f])) * 255, o[h + 1] = me.Clamp(Te(l[f + 1])) * 255, o[h + 2] = me.Clamp(Te(l[f + 2])) * 255, T.StoreLODInAlphaChannel ? o[h + 3] = n : o[h + 3] = me.Clamp(Te(l[f + 3])) * 255, h += 4;
      }
    return o;
  }
  static _GetRGBAArrayBuffer(e, t, i, s, r, n, o, l, h) {
    const c = new Uint8Array(s), d = new Uint8Array(r, i);
    let f = 0;
    for (let _ = 0; _ < t; _++)
      for (let g = 0; g < e; g++) {
        const S = (g + _ * e) * 4;
        c[f] = d[S + n], c[f + 1] = d[S + o], c[f + 2] = d[S + l], c[f + 3] = d[S + h], f += 4;
      }
    return c;
  }
  static _ExtractLongWordOrder(e) {
    return e === 0 || e === 255 || e === -16777216 ? 0 : 1 + T._ExtractLongWordOrder(e >> 8);
  }
  static _GetRGBArrayBuffer(e, t, i, s, r, n, o, l) {
    const h = new Uint8Array(s), c = new Uint8Array(r, i);
    let d = 0;
    for (let f = 0; f < t; f++)
      for (let _ = 0; _ < e; _++) {
        const g = (_ + f * e) * 3;
        h[d] = c[g + n], h[d + 1] = c[g + o], h[d + 2] = c[g + l], d += 3;
      }
    return h;
  }
  static _GetLuminanceArrayBuffer(e, t, i, s, r) {
    const n = new Uint8Array(s), o = new Uint8Array(r, i);
    let l = 0;
    for (let h = 0; h < t; h++)
      for (let c = 0; c < e; c++) {
        const d = c + h * e;
        n[l] = o[d], l++;
      }
    return n;
  }
  /**
   * Uploads DDS Levels to a Babylon Texture
   * @internal
   */
  static UploadDDSLevels(e, t, i, s, r, n, o = -1, l, h = !0) {
    let c = null;
    s.sphericalPolynomial && (c = []);
    const d = !!e.getCaps().s3tc;
    t.generateMipMaps = r;
    const f = new Int32Array(i.buffer, i.byteOffset, yt);
    let _, g, S, v = 0, k, K, pe, ae, ue = 0, Re = 1;
    if (f[Hs] !== Gs) {
      R.Error("Invalid magic number in DDS header");
      return;
    }
    if (!s.isFourCC && !s.isRGB && !s.isLuminance) {
      R.Error("Unsupported format, must contain a FourCC, RGB or LUMINANCE code");
      return;
    }
    if (s.isCompressed && !d) {
      R.Error("Compressed textures are not supported on this platform.");
      return;
    }
    let O = f[Ws];
    k = f[Xs] + 4;
    let W = !1;
    if (s.isFourCC)
      switch (_ = f[hi], _) {
        case Jt:
          Re = 8, ue = 33777;
          break;
        case ei:
          Re = 16, ue = 33778;
          break;
        case ti:
          Re = 16, ue = 33779;
          break;
        case ii:
          W = !0, O = 64;
          break;
        case si:
          W = !0, O = 128;
          break;
        case bt: {
          k += 5 * 4;
          let le = !1;
          switch (s.dxgiFormat) {
            case ni:
              W = !0, O = 64, le = !0;
              break;
            case ri:
              W = !0, O = 128, le = !0;
              break;
            case $s:
              s.isRGB = !0, s.isFourCC = !1, O = 32, le = !0;
              break;
          }
          if (le)
            break;
        }
        default:
          R.Error(["Unsupported FourCC code:", zs(_)]);
          return;
      }
    const ye = T._ExtractLongWordOrder(f[js]), et = T._ExtractLongWordOrder(f[Qs]), Gt = T._ExtractLongWordOrder(f[Ys]), wi = T._ExtractLongWordOrder(f[qs]);
    W && (ue = e._getRGBABufferInternalSizedFormat(s.textureType)), pe = 1, f[oi] & Qt && r !== !1 && (pe = Math.max(1, f[li]));
    const Bi = l || 0, Be = e.getCaps();
    for (let le = Bi; le < n; le++) {
      for (g = f[St], S = f[ai], ae = 0; ae < pe; ++ae) {
        if (o === -1 || o === ae) {
          const te = o === -1 ? ae : 0;
          if (!s.isCompressed && s.isFourCC) {
            t.format = 5, v = g * S * 4;
            let _e = null;
            if (e._badOS || e._badDesktopOS || !Be.textureHalfFloat && !Be.textureFloat)
              O === 128 ? (_e = T._GetFloatAsUIntRGBAArrayBuffer(g, S, i.byteOffset + k, v, i.buffer, te), c && te == 0 && c.push(T._GetFloatRGBAArrayBuffer(g, S, i.byteOffset + k, v, i.buffer, te))) : O === 64 && (_e = T._GetHalfFloatAsUIntRGBAArrayBuffer(g, S, i.byteOffset + k, v, i.buffer, te), c && te == 0 && c.push(T._GetHalfFloatAsFloatRGBAArrayBuffer(g, S, i.byteOffset + k, v, i.buffer, te))), t.type = 0;
            else {
              const tt = Be.textureFloat && (h && Be.textureFloatLinearFiltering || !h), _t = Be.textureHalfFloat && (h && Be.textureHalfFloatLinearFiltering || !h), mt = (O === 128 || O === 64 && !_t) && tt ? 1 : (O === 64 || O === 128 && !tt) && _t ? 2 : 0;
              let Ne, Ee = null;
              switch (O) {
                case 128: {
                  switch (mt) {
                    case 1:
                      Ne = T._GetFloatRGBAArrayBuffer, Ee = null;
                      break;
                    case 2:
                      Ne = T._GetFloatAsHalfFloatRGBAArrayBuffer, Ee = T._GetFloatRGBAArrayBuffer;
                      break;
                    case 0:
                      Ne = T._GetFloatAsUIntRGBAArrayBuffer, Ee = T._GetFloatRGBAArrayBuffer;
                      break;
                  }
                  break;
                }
                default: {
                  switch (mt) {
                    case 1:
                      Ne = T._GetHalfFloatAsFloatRGBAArrayBuffer, Ee = null;
                      break;
                    case 2:
                      Ne = T._GetHalfFloatRGBAArrayBuffer, Ee = T._GetHalfFloatAsFloatRGBAArrayBuffer;
                      break;
                    case 0:
                      Ne = T._GetHalfFloatAsUIntRGBAArrayBuffer, Ee = T._GetHalfFloatAsFloatRGBAArrayBuffer;
                      break;
                  }
                  break;
                }
              }
              t.type = mt, _e = Ne(g, S, i.byteOffset + k, v, i.buffer, te), c && te == 0 && c.push(Ee ? Ee(g, S, i.byteOffset + k, v, i.buffer, te) : _e);
            }
            _e && e._uploadDataToTextureDirectly(t, _e, le, te);
          } else if (s.isRGB)
            t.type = 0, O === 24 ? (t.format = 4, v = g * S * 3, K = T._GetRGBArrayBuffer(g, S, i.byteOffset + k, v, i.buffer, ye, et, Gt), e._uploadDataToTextureDirectly(t, K, le, te)) : (t.format = 5, v = g * S * 4, K = T._GetRGBAArrayBuffer(g, S, i.byteOffset + k, v, i.buffer, ye, et, Gt, wi), e._uploadDataToTextureDirectly(t, K, le, te));
          else if (s.isLuminance) {
            const _e = e._getUnpackAlignement(), tt = g;
            v = Math.floor((g + _e - 1) / _e) * _e * (S - 1) + tt, K = T._GetLuminanceArrayBuffer(g, S, i.byteOffset + k, v, i.buffer), t.format = 1, t.type = 0, e._uploadDataToTextureDirectly(t, K, le, te);
          } else
            v = Math.max(4, g) / 4 * Math.max(4, S) / 4 * Re, K = new Uint8Array(i.buffer, i.byteOffset + k, v), t.type = 0, e._uploadCompressedDataToTextureDirectly(t, ue, g, S, K, le, te);
        }
        k += O ? g * S * (O / 8) : v, g *= 0.5, S *= 0.5, g = Math.max(1, g), S = Math.max(1, S);
      }
      if (l !== void 0)
        break;
    }
    c && c.length > 0 ? s.sphericalPolynomial = bs.ConvertCubeMapToSphericalPolynomial({
      size: f[St],
      right: c[0],
      left: c[1],
      up: c[2],
      down: c[3],
      front: c[4],
      back: c[5],
      format: 5,
      type: 1,
      gammaSpace: !1
    }) : s.sphericalPolynomial = void 0;
  }
}
T.StoreLODInAlphaChannel = !1;
Ui.prototype.createPrefilteredCubeTexture = function(a, e, t, i, s = null, r = null, n, o = null, l = !0) {
  const h = (c) => {
    if (!c) {
      s && s(null);
      return;
    }
    const d = c.texture;
    if (l ? c.info.sphericalPolynomial && (d._sphericalPolynomial = c.info.sphericalPolynomial) : d._sphericalPolynomial = new Ii(), d._source = zt.CubePrefiltered, this.getCaps().textureLOD) {
      s && s(d);
      return;
    }
    const f = 3, _ = this._gl, g = c.width;
    if (!g)
      return;
    const S = [];
    for (let v = 0; v < f; v++) {
      const K = 1 - v / (f - 1), pe = i, ae = me.Log2(g) * t + i, ue = pe + (ae - pe) * K, Re = Math.round(Math.min(Math.max(ue, 0), ae)), O = new Gi(this, zt.Temp);
      if (O.type = d.type, O.format = d.format, O.width = Math.pow(2, Math.max(me.Log2(g) - Re, 0)), O.height = O.width, O.isCube = !0, O._cachedWrapU = 0, O._cachedWrapV = 0, this._bindTextureDirectly(_.TEXTURE_CUBE_MAP, O, !0), O.samplingMode = 2, _.texParameteri(_.TEXTURE_CUBE_MAP, _.TEXTURE_MAG_FILTER, _.LINEAR), _.texParameteri(_.TEXTURE_CUBE_MAP, _.TEXTURE_MIN_FILTER, _.LINEAR), _.texParameteri(_.TEXTURE_CUBE_MAP, _.TEXTURE_WRAP_S, _.CLAMP_TO_EDGE), _.texParameteri(_.TEXTURE_CUBE_MAP, _.TEXTURE_WRAP_T, _.CLAMP_TO_EDGE), c.isDDS) {
        const ye = c.info, et = c.data;
        this._unpackFlipY(ye.isCompressed), T.UploadDDSLevels(this, O, et, ye, !0, 6, Re);
      } else
        R.Warn("DDS is the only prefiltered cube map supported so far.");
      this._bindTextureDirectly(_.TEXTURE_CUBE_MAP, null);
      const W = new nt(e);
      W._isCube = !0, W._texture = O, O.isReady = !0, S.push(W);
    }
    d._lodTextureHigh = S[2], d._lodTextureMid = S[1], d._lodTextureLow = S[0], s && s(d);
  };
  return this.createCubeTexture(a, e, null, !1, h, r, n, o, l, t, i);
};
class Js {
  constructor() {
    this.supportCascades = !0;
  }
  /**
   * This returns if the loader support the current file information.
   * @param extension defines the file extension of the file being loaded
   * @returns true if the loader can load the specified file
   */
  canLoad(e) {
    return e.endsWith(".dds");
  }
  /**
   * Uploads the cube texture data to the WebGL texture. It has already been bound.
   * @param imgs contains the cube maps
   * @param texture defines the BabylonJS internal texture
   * @param createPolynomials will be true if polynomials have been requested
   * @param onLoad defines the callback to trigger once the texture is ready
   */
  loadCubeData(e, t, i, s) {
    const r = t.getEngine();
    let n, o = !1, l = 1e3;
    if (Array.isArray(e))
      for (let h = 0; h < e.length; h++) {
        const c = e[h];
        n = T.GetDDSInfo(c), t.width = n.width, t.height = n.height, o = (n.isRGB || n.isLuminance || n.mipmapCount > 1) && t.generateMipMaps, r._unpackFlipY(n.isCompressed), T.UploadDDSLevels(r, t, c, n, o, 6, -1, h), !n.isFourCC && n.mipmapCount === 1 ? r.generateMipMapsForCubemap(t) : l = n.mipmapCount - 1;
      }
    else {
      const h = e;
      n = T.GetDDSInfo(h), t.width = n.width, t.height = n.height, i && (n.sphericalPolynomial = new Ii()), o = (n.isRGB || n.isLuminance || n.mipmapCount > 1) && t.generateMipMaps, r._unpackFlipY(n.isCompressed), T.UploadDDSLevels(r, t, h, n, o, 6), !n.isFourCC && n.mipmapCount === 1 ? r.generateMipMapsForCubemap(t, !1) : l = n.mipmapCount - 1;
    }
    r._setCubeMapTextureParams(t, o, l), t.isReady = !0, t.onLoadedObservable.notifyObservers(t), t.onLoadedObservable.clear(), s && s({ isDDS: !0, width: t.width, info: n, data: e, texture: t });
  }
  /**
   * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param callback defines the method to call once ready to upload
   */
  loadData(e, t, i) {
    const s = T.GetDDSInfo(e), r = (s.isRGB || s.isLuminance || s.mipmapCount > 1) && t.generateMipMaps && s.width >> s.mipmapCount - 1 === 1;
    i(s.width, s.height, r, s.isFourCC, () => {
      T.UploadDDSLevels(t.getEngine(), t, e, s, r, 1);
    });
  }
}
Bt._TextureLoaders.push(new Js());
class Y {
  /**
   * Creates a new KhronosTextureContainer
   * @param data contents of the KTX container file
   * @param facesExpected should be either 1 or 6, based whether a cube texture or or
   */
  constructor(e, t) {
    if (this.data = e, this.isInvalid = !1, !Y.IsValid(e)) {
      this.isInvalid = !0, R.Error("texture missing KTX identifier");
      return;
    }
    const i = Uint32Array.BYTES_PER_ELEMENT, s = new DataView(this.data.buffer, this.data.byteOffset + 12, 13 * i), n = s.getUint32(0, !0) === 67305985;
    if (this.glType = s.getUint32(1 * i, n), this.glTypeSize = s.getUint32(2 * i, n), this.glFormat = s.getUint32(3 * i, n), this.glInternalFormat = s.getUint32(4 * i, n), this.glBaseInternalFormat = s.getUint32(5 * i, n), this.pixelWidth = s.getUint32(6 * i, n), this.pixelHeight = s.getUint32(7 * i, n), this.pixelDepth = s.getUint32(8 * i, n), this.numberOfArrayElements = s.getUint32(9 * i, n), this.numberOfFaces = s.getUint32(10 * i, n), this.numberOfMipmapLevels = s.getUint32(11 * i, n), this.bytesOfKeyValueData = s.getUint32(12 * i, n), this.glType !== 0) {
      R.Error("only compressed formats currently supported"), this.isInvalid = !0;
      return;
    } else
      this.numberOfMipmapLevels = Math.max(1, this.numberOfMipmapLevels);
    if (this.pixelHeight === 0 || this.pixelDepth !== 0) {
      R.Error("only 2D textures currently supported"), this.isInvalid = !0;
      return;
    }
    if (this.numberOfArrayElements !== 0) {
      R.Error("texture arrays not currently supported"), this.isInvalid = !0;
      return;
    }
    if (this.numberOfFaces !== t) {
      R.Error("number of faces expected" + t + ", but found " + this.numberOfFaces), this.isInvalid = !0;
      return;
    }
    this.loadType = Y.COMPRESSED_2D;
  }
  /**
   * Uploads KTX content to a Babylon Texture.
   * It is assumed that the texture has already been created & is currently bound
   * @internal
   */
  uploadLevels(e, t) {
    switch (this.loadType) {
      case Y.COMPRESSED_2D:
        this._upload2DCompressedLevels(e, t);
        break;
      case Y.TEX_2D:
      case Y.COMPRESSED_3D:
      case Y.TEX_3D:
    }
  }
  _upload2DCompressedLevels(e, t) {
    let i = Y.HEADER_LEN + this.bytesOfKeyValueData, s = this.pixelWidth, r = this.pixelHeight;
    const n = t ? this.numberOfMipmapLevels : 1;
    for (let o = 0; o < n; o++) {
      const l = new Int32Array(this.data.buffer, this.data.byteOffset + i, 1)[0];
      i += 4;
      for (let h = 0; h < this.numberOfFaces; h++) {
        const c = new Uint8Array(this.data.buffer, this.data.byteOffset + i, l);
        e.getEngine()._uploadCompressedDataToTextureDirectly(e, e.format, s, r, c, h, o), i += l, i += 3 - (l + 3) % 4;
      }
      s = Math.max(1, s * 0.5), r = Math.max(1, r * 0.5);
    }
  }
  /**
   * Checks if the given data starts with a KTX file identifier.
   * @param data the data to check
   * @returns true if the data is a KTX file or false otherwise
   */
  static IsValid(e) {
    if (e.byteLength >= 12) {
      const t = new Uint8Array(e.buffer, e.byteOffset, 12);
      if (t[0] === 171 && t[1] === 75 && t[2] === 84 && t[3] === 88 && t[4] === 32 && t[5] === 49 && t[6] === 49 && t[7] === 187 && t[8] === 13 && t[9] === 10 && t[10] === 26 && t[11] === 10)
        return !0;
    }
    return !1;
  }
}
Y.HEADER_LEN = 12 + 13 * 4;
Y.COMPRESSED_2D = 0;
Y.COMPRESSED_3D = 1;
Y.TEX_2D = 2;
Y.TEX_3D = 3;
var ci;
(function(a) {
  a[a.ETC1S = 0] = "ETC1S", a[a.UASTC4x4 = 1] = "UASTC4x4";
})(ci || (ci = {}));
var Qe;
(function(a) {
  a[a.ASTC_4X4_RGBA = 0] = "ASTC_4X4_RGBA", a[a.BC7_RGBA = 1] = "BC7_RGBA", a[a.BC3_RGBA = 2] = "BC3_RGBA", a[a.BC1_RGB = 3] = "BC1_RGB", a[a.PVRTC1_4_RGBA = 4] = "PVRTC1_4_RGBA", a[a.PVRTC1_4_RGB = 5] = "PVRTC1_4_RGB", a[a.ETC2_RGBA = 6] = "ETC2_RGBA", a[a.ETC1_RGB = 7] = "ETC1_RGB", a[a.RGBA32 = 8] = "RGBA32", a[a.R8 = 9] = "R8", a[a.RG8 = 10] = "RG8";
})(Qe || (Qe = {}));
var Nt;
(function(a) {
  a[a.COMPRESSED_RGBA_BPTC_UNORM_EXT = 36492] = "COMPRESSED_RGBA_BPTC_UNORM_EXT", a[a.COMPRESSED_RGBA_ASTC_4X4_KHR = 37808] = "COMPRESSED_RGBA_ASTC_4X4_KHR", a[a.COMPRESSED_RGB_S3TC_DXT1_EXT = 33776] = "COMPRESSED_RGB_S3TC_DXT1_EXT", a[a.COMPRESSED_RGBA_S3TC_DXT5_EXT = 33779] = "COMPRESSED_RGBA_S3TC_DXT5_EXT", a[a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 35842] = "COMPRESSED_RGBA_PVRTC_4BPPV1_IMG", a[a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 35840] = "COMPRESSED_RGB_PVRTC_4BPPV1_IMG", a[a.COMPRESSED_RGBA8_ETC2_EAC = 37496] = "COMPRESSED_RGBA8_ETC2_EAC", a[a.COMPRESSED_RGB8_ETC2 = 37492] = "COMPRESSED_RGB8_ETC2", a[a.COMPRESSED_RGB_ETC1_WEBGL = 36196] = "COMPRESSED_RGB_ETC1_WEBGL", a[a.RGBA8Format = 32856] = "RGBA8Format", a[a.R8Format = 33321] = "R8Format", a[a.RG8Format = 33323] = "RG8Format";
})(Nt || (Nt = {}));
function ht(a, e) {
  const t = e?.jsDecoderModule || KTX2DECODER;
  a && (a.wasmUASTCToASTC && (t.LiteTranscoder_UASTC_ASTC.WasmModuleURL = a.wasmUASTCToASTC), a.wasmUASTCToBC7 && (t.LiteTranscoder_UASTC_BC7.WasmModuleURL = a.wasmUASTCToBC7), a.wasmUASTCToRGBA_UNORM && (t.LiteTranscoder_UASTC_RGBA_UNORM.WasmModuleURL = a.wasmUASTCToRGBA_UNORM), a.wasmUASTCToRGBA_SRGB && (t.LiteTranscoder_UASTC_RGBA_SRGB.WasmModuleURL = a.wasmUASTCToRGBA_SRGB), a.wasmUASTCToR8_UNORM && (t.LiteTranscoder_UASTC_R8_UNORM.WasmModuleURL = a.wasmUASTCToR8_UNORM), a.wasmUASTCToRG8_UNORM && (t.LiteTranscoder_UASTC_RG8_UNORM.WasmModuleURL = a.wasmUASTCToRG8_UNORM), a.jsMSCTranscoder && (t.MSCTranscoder.JSModuleURL = a.jsMSCTranscoder), a.wasmMSCTranscoder && (t.MSCTranscoder.WasmModuleURL = a.wasmMSCTranscoder), a.wasmZSTDDecoder && (t.ZSTDDecoder.WasmModuleURL = a.wasmZSTDDecoder)), e && (e.wasmUASTCToASTC && (t.LiteTranscoder_UASTC_ASTC.WasmBinary = e.wasmUASTCToASTC), e.wasmUASTCToBC7 && (t.LiteTranscoder_UASTC_BC7.WasmBinary = e.wasmUASTCToBC7), e.wasmUASTCToRGBA_UNORM && (t.LiteTranscoder_UASTC_RGBA_UNORM.WasmBinary = e.wasmUASTCToRGBA_UNORM), e.wasmUASTCToRGBA_SRGB && (t.LiteTranscoder_UASTC_RGBA_SRGB.WasmBinary = e.wasmUASTCToRGBA_SRGB), e.wasmUASTCToR8_UNORM && (t.LiteTranscoder_UASTC_R8_UNORM.WasmBinary = e.wasmUASTCToR8_UNORM), e.wasmUASTCToRG8_UNORM && (t.LiteTranscoder_UASTC_RG8_UNORM.WasmBinary = e.wasmUASTCToRG8_UNORM), e.jsMSCTranscoder && (t.MSCTranscoder.JSModule = e.jsMSCTranscoder), e.wasmMSCTranscoder && (t.MSCTranscoder.WasmBinary = e.wasmMSCTranscoder), e.wasmZSTDDecoder && (t.ZSTDDecoder.WasmBinary = e.wasmZSTDDecoder));
}
function er(a) {
  typeof a > "u" && typeof KTX2DECODER < "u" && (a = KTX2DECODER);
  let e;
  onmessage = (t) => {
    if (t.data)
      switch (t.data.action) {
        case "init": {
          const i = t.data.urls;
          i && (i.jsDecoderModule && typeof a > "u" && (importScripts(i.jsDecoderModule), a = KTX2DECODER), ht(i)), t.data.wasmBinaries && ht(void 0, { ...t.data.wasmBinaries, jsDecoderModule: a }), e = new a.KTX2Decoder(), postMessage({ action: "init" });
          break;
        }
        case "setDefaultDecoderOptions": {
          a.KTX2Decoder.DefaultDecoderOptions = t.data.options;
          break;
        }
        case "decode":
          e.decode(t.data.data, t.data.caps, t.data.options).then((i) => {
            const s = [];
            for (let r = 0; r < i.mipmaps.length; ++r) {
              const n = i.mipmaps[r];
              n && n.data && s.push(n.data.buffer);
            }
            postMessage({ action: "decoded", success: !0, decodedData: i }, s);
          }).catch((i) => {
            postMessage({ action: "decoded", success: !1, msg: i });
          });
          break;
      }
  };
}
function tr(a, e, t) {
  return new Promise((i, s) => {
    const r = (o) => {
      a.removeEventListener("error", r), a.removeEventListener("message", n), s(o);
    }, n = (o) => {
      o.data.action === "init" && (a.removeEventListener("error", r), a.removeEventListener("message", n), i(a));
    };
    a.addEventListener("error", r), a.addEventListener("message", n), a.postMessage({
      action: "init",
      urls: t,
      wasmBinaries: e
    });
  });
}
class ir {
  constructor() {
    this._isDirty = !0, this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC = !0, this._ktx2DecoderOptions = {};
  }
  /**
   * Gets the dirty flag
   */
  get isDirty() {
    return this._isDirty;
  }
  /**
   * force a (uncompressed) RGBA transcoded format if transcoding a UASTC source format and ASTC + BC7 are not available as a compressed transcoded format
   */
  get useRGBAIfASTCBC7NotAvailableWhenUASTC() {
    return this._useRGBAIfASTCBC7NotAvailableWhenUASTC;
  }
  set useRGBAIfASTCBC7NotAvailableWhenUASTC(e) {
    this._useRGBAIfASTCBC7NotAvailableWhenUASTC !== e && (this._useRGBAIfASTCBC7NotAvailableWhenUASTC = e, this._isDirty = !0);
  }
  /**
   * force a (uncompressed) RGBA transcoded format if transcoding a UASTC source format and only BC1 or BC3 are available as a compressed transcoded format.
   * This property is true by default to favor speed over memory, because currently transcoding from UASTC to BC1/3 is slow because the transcoder transcodes
   * to uncompressed and then recompresses the texture
   */
  get useRGBAIfOnlyBC1BC3AvailableWhenUASTC() {
    return this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC;
  }
  set useRGBAIfOnlyBC1BC3AvailableWhenUASTC(e) {
    this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC !== e && (this._useRGBAIfOnlyBC1BC3AvailableWhenUASTC = e, this._isDirty = !0);
  }
  /**
   * force to always use (uncompressed) RGBA for transcoded format
   */
  get forceRGBA() {
    return this._forceRGBA;
  }
  set forceRGBA(e) {
    this._forceRGBA !== e && (this._forceRGBA = e, this._isDirty = !0);
  }
  /**
   * force to always use (uncompressed) R8 for transcoded format
   */
  get forceR8() {
    return this._forceR8;
  }
  set forceR8(e) {
    this._forceR8 !== e && (this._forceR8 = e, this._isDirty = !0);
  }
  /**
   * force to always use (uncompressed) RG8 for transcoded format
   */
  get forceRG8() {
    return this._forceRG8;
  }
  set forceRG8(e) {
    this._forceRG8 !== e && (this._forceRG8 = e, this._isDirty = !0);
  }
  /**
   * list of transcoders to bypass when looking for a suitable transcoder. The available transcoders are:
   *      UniversalTranscoder_UASTC_ASTC
   *      UniversalTranscoder_UASTC_BC7
   *      UniversalTranscoder_UASTC_RGBA_UNORM
   *      UniversalTranscoder_UASTC_RGBA_SRGB
   *      UniversalTranscoder_UASTC_R8_UNORM
   *      UniversalTranscoder_UASTC_RG8_UNORM
   *      MSCTranscoder
   */
  get bypassTranscoders() {
    return this._bypassTranscoders;
  }
  set bypassTranscoders(e) {
    this._bypassTranscoders !== e && (this._bypassTranscoders = e, this._isDirty = !0);
  }
  /** @internal */
  _getKTX2DecoderOptions() {
    if (!this._isDirty)
      return this._ktx2DecoderOptions;
    this._isDirty = !1;
    const e = {
      useRGBAIfASTCBC7NotAvailableWhenUASTC: this._useRGBAIfASTCBC7NotAvailableWhenUASTC,
      forceRGBA: this._forceRGBA,
      forceR8: this._forceR8,
      forceRG8: this._forceRG8,
      bypassTranscoders: this._bypassTranscoders
    };
    return this.useRGBAIfOnlyBC1BC3AvailableWhenUASTC && (e.transcodeFormatDecisionTree = {
      UASTC: {
        transcodeFormat: [Qe.BC1_RGB, Qe.BC3_RGBA],
        yes: {
          transcodeFormat: Qe.RGBA32,
          engineFormat: Nt.RGBA8Format,
          roundToMultiple4: !1
        }
      }
    }), this._ktx2DecoderOptions = e, e;
  }
}
class P {
  static GetDefaultNumWorkers() {
    return typeof navigator != "object" || !navigator.hardwareConcurrency ? 1 : Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
  }
  static _Initialize(e) {
    if (P._WorkerPoolPromise || P._DecoderModulePromise)
      return;
    const t = {
      jsDecoderModule: B.GetBabylonScriptURL(this.URLConfig.jsDecoderModule, !0),
      wasmUASTCToASTC: B.GetBabylonScriptURL(this.URLConfig.wasmUASTCToASTC, !0),
      wasmUASTCToBC7: B.GetBabylonScriptURL(this.URLConfig.wasmUASTCToBC7, !0),
      wasmUASTCToRGBA_UNORM: B.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRGBA_UNORM, !0),
      wasmUASTCToRGBA_SRGB: B.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRGBA_SRGB, !0),
      wasmUASTCToR8_UNORM: B.GetBabylonScriptURL(this.URLConfig.wasmUASTCToR8_UNORM, !0),
      wasmUASTCToRG8_UNORM: B.GetBabylonScriptURL(this.URLConfig.wasmUASTCToRG8_UNORM, !0),
      jsMSCTranscoder: B.GetBabylonScriptURL(this.URLConfig.jsMSCTranscoder, !0),
      wasmMSCTranscoder: B.GetBabylonScriptURL(this.URLConfig.wasmMSCTranscoder, !0),
      wasmZSTDDecoder: B.GetBabylonScriptURL(this.URLConfig.wasmZSTDDecoder, !0)
    };
    e && typeof Worker == "function" && typeof URL < "u" ? P._WorkerPoolPromise = new Promise((i) => {
      const s = `${ht}(${er})()`, r = URL.createObjectURL(new Blob([s], { type: "application/javascript" }));
      i(new zi(e, () => tr(new Worker(r), void 0, t)));
    }) : typeof P._KTX2DecoderModule > "u" ? P._DecoderModulePromise = B.LoadBabylonScriptAsync(t.jsDecoderModule).then(() => (P._KTX2DecoderModule = KTX2DECODER, P._KTX2DecoderModule.MSCTranscoder.UseFromWorkerThread = !1, P._KTX2DecoderModule.WASMMemoryManager.LoadBinariesFromCurrentThread = !0, ht(t, P._KTX2DecoderModule), new P._KTX2DecoderModule.KTX2Decoder())) : (P._KTX2DecoderModule.MSCTranscoder.UseFromWorkerThread = !1, P._KTX2DecoderModule.WASMMemoryManager.LoadBinariesFromCurrentThread = !0, P._DecoderModulePromise = Promise.resolve(new P._KTX2DecoderModule.KTX2Decoder()));
  }
  /**
   * Constructor
   * @param engine The engine to use
   * @param numWorkersOrOptions The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
   */
  constructor(e, t = P.DefaultNumWorkers) {
    if (this._engine = e, typeof t == "object" && t.workerPool)
      P._WorkerPoolPromise = Promise.resolve(t.workerPool);
    else {
      typeof t == "object" ? P._KTX2DecoderModule = t?.binariesAndModulesContainer?.jsDecoderModule : typeof KTX2DECODER < "u" && (P._KTX2DecoderModule = KTX2DECODER);
      const i = typeof t == "number" ? t : t.numWorkers ?? P.DefaultNumWorkers;
      P._Initialize(i);
    }
  }
  /**
   * @internal
   */
  _uploadAsync(e, t, i) {
    const s = this._engine.getCaps(), r = {
      astc: !!s.astc,
      bptc: !!s.bptc,
      s3tc: !!s.s3tc,
      pvrtc: !!s.pvrtc,
      etc2: !!s.etc2,
      etc1: !!s.etc1
    };
    if (P._WorkerPoolPromise)
      return P._WorkerPoolPromise.then((n) => new Promise((o, l) => {
        n.push((h, c) => {
          const d = (g) => {
            h.removeEventListener("error", d), h.removeEventListener("message", f), l(g), c();
          }, f = (g) => {
            if (g.data.action === "decoded") {
              if (h.removeEventListener("error", d), h.removeEventListener("message", f), !g.data.success)
                l({ message: g.data.msg });
              else
                try {
                  this._createTexture(g.data.decodedData, t, i), o();
                } catch (S) {
                  l({ message: S });
                }
              c();
            }
          };
          h.addEventListener("error", d), h.addEventListener("message", f), h.postMessage({ action: "setDefaultDecoderOptions", options: P.DefaultDecoderOptions._getKTX2DecoderOptions() });
          const _ = new Uint8Array(e.byteLength);
          _.set(new Uint8Array(e.buffer, e.byteOffset, e.byteLength)), h.postMessage({ action: "decode", data: _, caps: r, options: i }, [_.buffer]);
        });
      }));
    if (P._DecoderModulePromise)
      return P._DecoderModulePromise.then((n) => (P.DefaultDecoderOptions.isDirty && (P._KTX2DecoderModule.KTX2Decoder.DefaultDecoderOptions = P.DefaultDecoderOptions._getKTX2DecoderOptions()), new Promise((o, l) => {
        n.decode(e, s).then((h) => {
          this._createTexture(h, t), o();
        }).catch((h) => {
          l({ message: h });
        });
      })));
    throw new Error("KTX2 decoder module is not available");
  }
  _createTexture(e, t, i) {
    this._engine._bindTextureDirectly(3553, t), i && (i.transcodedFormat = e.transcodedFormat, i.isInGammaSpace = e.isInGammaSpace, i.hasAlpha = e.hasAlpha, i.transcoderName = e.transcoderName);
    let r = !0;
    switch (e.transcodedFormat) {
      case 32856:
        t.type = 0, t.format = 5;
        break;
      case 33321:
        t.type = 0, t.format = 6;
        break;
      case 33323:
        t.type = 0, t.format = 7;
        break;
      default:
        t.format = e.transcodedFormat, r = !1;
        break;
    }
    if (t._gammaSpace = e.isInGammaSpace, t.generateMipMaps = e.mipmaps.length > 1, e.errors)
      throw new Error("KTX2 container - could not transcode the data. " + e.errors);
    for (let n = 0; n < e.mipmaps.length; ++n) {
      const o = e.mipmaps[n];
      if (!o || !o.data)
        throw new Error("KTX2 container - could not transcode one of the image");
      r ? (t.width = o.width, t.height = o.height, this._engine._uploadDataToTextureDirectly(t, o.data, 0, n, void 0, !0)) : this._engine._uploadCompressedDataToTextureDirectly(t, e.transcodedFormat, o.width, o.height, o.data, 0, n);
    }
    t._extension = ".ktx2", t.width = e.mipmaps[0].width, t.height = e.mipmaps[0].height, t.isReady = !0, this._engine._bindTextureDirectly(3553, null);
  }
  /**
   * Checks if the given data starts with a KTX2 file identifier.
   * @param data the data to check
   * @returns true if the data is a KTX2 file or false otherwise
   */
  static IsValid(e) {
    if (e.byteLength >= 12) {
      const t = new Uint8Array(e.buffer, e.byteOffset, 12);
      if (t[0] === 171 && t[1] === 75 && t[2] === 84 && t[3] === 88 && t[4] === 32 && t[5] === 50 && t[6] === 48 && t[7] === 187 && t[8] === 13 && t[9] === 10 && t[10] === 26 && t[11] === 10)
        return !0;
    }
    return !1;
  }
}
P.URLConfig = {
  jsDecoderModule: "https://cdn.babylonjs.com/babylon.ktx2Decoder.js",
  wasmUASTCToASTC: null,
  wasmUASTCToBC7: null,
  wasmUASTCToRGBA_UNORM: null,
  wasmUASTCToRGBA_SRGB: null,
  wasmUASTCToR8_UNORM: null,
  wasmUASTCToRG8_UNORM: null,
  jsMSCTranscoder: null,
  wasmMSCTranscoder: null,
  wasmZSTDDecoder: null
};
P.DefaultNumWorkers = P.GetDefaultNumWorkers();
P.DefaultDecoderOptions = new ir();
function sr(a) {
  switch (a) {
    case 35916:
      return 33776;
    case 35918:
      return 33778;
    case 35919:
      return 33779;
    case 37493:
      return 37492;
    case 37497:
      return 37496;
    case 37495:
      return 37494;
    case 37840:
      return 37808;
    case 36493:
      return 36492;
  }
  return null;
}
class rr {
  constructor() {
    this.supportCascades = !1;
  }
  /**
   * This returns if the loader support the current file information.
   * @param extension defines the file extension of the file being loaded
   * @param mimeType defines the optional mime type of the file being loaded
   * @returns true if the loader can load the specified file
   */
  canLoad(e, t) {
    return e.endsWith(".ktx") || e.endsWith(".ktx2") || t === "image/ktx" || t === "image/ktx2";
  }
  /**
   * Uploads the cube texture data to the WebGL texture. It has already been bound.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param createPolynomials will be true if polynomials have been requested
   * @param onLoad defines the callback to trigger once the texture is ready
   */
  loadCubeData(e, t, i, s) {
    if (Array.isArray(e))
      return;
    t._invertVScale = !t.invertY;
    const r = t.getEngine(), n = new Y(e, 6), o = n.numberOfMipmapLevels > 1 && t.generateMipMaps;
    r._unpackFlipY(!0), n.uploadLevels(t, t.generateMipMaps), t.width = n.pixelWidth, t.height = n.pixelHeight, r._setCubeMapTextureParams(t, o, n.numberOfMipmapLevels - 1), t.isReady = !0, t.onLoadedObservable.notifyObservers(t), t.onLoadedObservable.clear(), s && s();
  }
  /**
   * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param callback defines the method to call once ready to upload
   * @param options
   */
  loadData(e, t, i, s) {
    if (Y.IsValid(e)) {
      t._invertVScale = !t.invertY;
      const r = new Y(e, 1), n = sr(r.glInternalFormat);
      n ? (t.format = n, t._useSRGBBuffer = t.getEngine()._getUseSRGBBuffer(!0, t.generateMipMaps), t._gammaSpace = !0) : t.format = r.glInternalFormat, i(r.pixelWidth, r.pixelHeight, t.generateMipMaps, !0, () => {
        r.uploadLevels(t, t.generateMipMaps);
      }, r.isInvalid);
    } else P.IsValid(e) ? new P(t.getEngine())._uploadAsync(e, t, s).then(() => {
      i(t.width, t.height, t.generateMipMaps, !0, () => {
      }, !1);
    }, (n) => {
      R.Warn(`Failed to load KTX2 texture data: ${n.message}`), i(0, 0, !1, !1, () => {
      }, !0);
    }) : (R.Error("texture missing KTX identifier"), i(0, 0, !1, !1, () => {
    }, !0));
  }
}
Bt._TextureLoaders.unshift(new rr());
class Ye extends Pi {
  /**
   * Creates a new webXRCamera, this should only be set at the camera after it has been updated by the xrSessionManager
   * @param name the name of the camera
   * @param scene the scene to add the camera to
   * @param _xrSessionManager a constructed xr session manager
   */
  constructor(e, t, i) {
    super(e, C.Zero(), t), this._xrSessionManager = i, this._firstFrame = !1, this._referenceQuaternion = A.Identity(), this._referencedPosition = new C(), this._trackingState = it.NOT_TRACKING, this.onXRCameraInitializedObservable = new x(), this.onBeforeCameraTeleport = new x(), this.onAfterCameraTeleport = new x(), this.onTrackingStateChanged = new x(), this.compensateOnFirstFrame = !0, this._rotate180 = new A(0, 1, 0, 0), this.minZ = 0.1, this.rotationQuaternion = new A(), this.cameraRigMode = ys.RIG_MODE_CUSTOM, this.updateUpVectorFromRotation = !0, this._updateNumberOfRigCameras(1), this.freezeProjectionMatrix(), this._deferOnly = !0, this._xrSessionManager.onXRSessionInit.add(() => {
      this._referencedPosition.copyFromFloats(0, 0, 0), this._referenceQuaternion.copyFromFloats(0, 0, 0, 1), this._firstFrame = this.compensateOnFirstFrame, this._xrSessionManager.onWorldScaleFactorChangedObservable.add(() => {
        this._xrSessionManager.currentFrame && this._updateDepthNearFar();
      });
    }), this._xrSessionManager.onXRFrameObservable.add(() => {
      this._firstFrame && this._updateFromXRSession(), this.onXRCameraInitializedObservable.hasObservers() && (this.onXRCameraInitializedObservable.notifyObservers(this), this.onXRCameraInitializedObservable.clear()), this._deferredUpdated && (this.position.copyFrom(this._deferredPositionUpdate), this.rotationQuaternion.copyFrom(this._deferredRotationQuaternionUpdate)), this._updateReferenceSpace(), this._updateFromXRSession();
    }, void 0, !0);
  }
  /**
   * Get the current XR tracking state of the camera
   */
  get trackingState() {
    return this._trackingState;
  }
  _setTrackingState(e) {
    this._trackingState !== e && (this._trackingState = e, this.onTrackingStateChanged.notifyObservers(e));
  }
  /**
   * Return the user's height, unrelated to the current ground.
   * This will be the y position of this camera, when ground level is 0.
   *
   * Note - this value is multiplied by the worldScalingFactor (if set), so it will be in the same units as the scene.
   */
  get realWorldHeight() {
    const e = this._xrSessionManager.currentFrame && this._xrSessionManager.currentFrame.getViewerPose(this._xrSessionManager.baseReferenceSpace);
    return e && e.transform ? e.transform.position.y * this._xrSessionManager.worldScalingFactor : 0;
  }
  /** @internal */
  _updateForDualEyeDebugging() {
    this._updateNumberOfRigCameras(2), this.rigCameras[0].viewport = new Mt(0, 0, 0.5, 1), this.rigCameras[0].outputRenderTarget = null, this.rigCameras[1].viewport = new Mt(0.5, 0, 0.5, 1), this.rigCameras[1].outputRenderTarget = null;
  }
  /**
   * Sets this camera's transformation based on a non-vr camera
   * @param otherCamera the non-vr camera to copy the transformation from
   * @param resetToBaseReferenceSpace should XR reset to the base reference space
   */
  setTransformationFromNonVRCamera(e = this.getScene().activeCamera, t = !0) {
    if (!e || e === this)
      return;
    e.computeWorldMatrix().decompose(void 0, this.rotationQuaternion, this.position), this.position.y = 0, A.FromEulerAnglesToRef(0, this.rotationQuaternion.toEulerAngles().y, 0, this.rotationQuaternion), this._firstFrame = !0, t && this._xrSessionManager.resetReferenceSpace();
  }
  /**
   * Gets the current instance class name ("WebXRCamera").
   * @returns the class name
   */
  getClassName() {
    return "WebXRCamera";
  }
  /**
   * Set the target for the camera to look at.
   * Note that this only rotates around the Y axis, as opposed to the default behavior of other cameras
   * @param target the target to set the camera to look at
   */
  setTarget(e) {
    const t = H.Vector3[1];
    e.subtractToRef(this.position, t), t.y = 0, t.normalize();
    const i = Math.atan2(t.x, t.z);
    this.rotationQuaternion.toEulerAnglesToRef(t), A.FromEulerAnglesToRef(t.x, i, t.z, this.rotationQuaternion);
  }
  dispose() {
    super.dispose(), this._lastXRViewerPose = void 0;
  }
  _updateDepthNearFar() {
    const e = (this.maxZ || 1e4) * this._xrSessionManager.worldScalingFactor, t = {
      // if maxZ is 0 it should be "Infinity", but it doesn't work with the WebXR API. Setting to a large number.
      depthFar: e,
      depthNear: this.minZ
    };
    this._xrSessionManager.updateRenderState(t), this._cache.minZ = this.minZ, this._cache.maxZ = e;
  }
  _updateFromXRSession() {
    const e = this._xrSessionManager.currentFrame && this._xrSessionManager.currentFrame.getViewerPose(this._xrSessionManager.referenceSpace);
    if (this._lastXRViewerPose = e || void 0, !e) {
      this._setTrackingState(it.NOT_TRACKING);
      return;
    }
    const t = e.emulatedPosition ? it.TRACKING_LOST : it.TRACKING;
    if (this._setTrackingState(t), (this.minZ !== this._cache.minZ || this.maxZ !== this._cache.maxZ) && this._updateDepthNearFar(), e.transform) {
      const i = e.transform.orientation;
      if (e.transform.orientation.x === void 0)
        return;
      const s = e.transform.position;
      this._referencedPosition.set(s.x, s.y, s.z).scaleInPlace(this._xrSessionManager.worldScalingFactor), this._referenceQuaternion.set(i.x, i.y, i.z, i.w), this._scene.useRightHandedSystem || (this._referencedPosition.z *= -1, this._referenceQuaternion.z *= -1, this._referenceQuaternion.w *= -1), this._firstFrame ? (this._firstFrame = !1, this.position.y += this._referencedPosition.y, this._referenceQuaternion.copyFromFloats(0, 0, 0, 1)) : (this.rotationQuaternion.copyFrom(this._referenceQuaternion), this.position.copyFrom(this._referencedPosition));
    }
    this.rigCameras.length !== e.views.length && this._updateNumberOfRigCameras(e.views.length), e.views.forEach((i, s) => {
      const r = this.rigCameras[s];
      !r.isLeftCamera && !r.isRightCamera && (i.eye === "right" ? r._isRightCamera = !0 : i.eye === "left" && (r._isLeftCamera = !0));
      const n = this.getScene().customRenderTargets;
      for (let d = 0; d < n.length; d++) {
        const f = n[d];
        r.customRenderTargets.indexOf(f) === -1 && r.customRenderTargets.push(f);
      }
      const o = i.transform.position, l = i.transform.orientation;
      r.parent = this.parent, r.position.set(o.x, o.y, o.z).scaleInPlace(this._xrSessionManager.worldScalingFactor), r.rotationQuaternion.set(l.x, l.y, l.z, l.w), this._scene.useRightHandedSystem ? r.rotationQuaternion.multiplyInPlace(this._rotate180) : (r.position.z *= -1, r.rotationQuaternion.z *= -1, r.rotationQuaternion.w *= -1), ce.FromFloat32ArrayToRefScaled(i.projectionMatrix, 0, 1, r._projectionMatrix), this._scene.useRightHandedSystem || r._projectionMatrix.toggleProjectionMatrixHandInPlace();
      const h = Math.atan2(1, i.projectionMatrix[5]) * 2;
      r.fov = h, s === 0 && (this.fov = h, this._projectionMatrix.copyFrom(r._projectionMatrix));
      const c = this._xrSessionManager.getRenderTargetTextureForView(i);
      this._renderingMultiview = c?._texture?.isMultiview || !1, this._renderingMultiview ? s == 0 && (this._xrSessionManager.trySetViewportForView(this.viewport, i), this.outputRenderTarget = c) : (this._xrSessionManager.trySetViewportForView(r.viewport, i), r.outputRenderTarget = c || this._xrSessionManager.getRenderTargetTextureForView(i)), r.layerMask = this.layerMask;
    });
  }
  _updateNumberOfRigCameras(e = 1) {
    for (; this.rigCameras.length < e; ) {
      const t = new Ss("XR-RigCamera: " + this.rigCameras.length, C.Zero(), this.getScene());
      t.minZ = 0.1, t.rotationQuaternion = new A(), t.updateUpVectorFromRotation = !0, t.isRigCamera = !0, t.rigParent = this, t.freezeProjectionMatrix(), this.rigCameras.push(t);
    }
    for (; this.rigCameras.length > e; ) {
      const t = this.rigCameras.pop();
      t && t.dispose();
    }
  }
  _updateReferenceSpace() {
    if (!this.position.equals(this._referencedPosition) || !this.rotationQuaternion.equals(this._referenceQuaternion)) {
      const e = H.Matrix[0], t = H.Matrix[1], i = H.Matrix[2];
      ce.ComposeToRef(Ye._ScaleReadOnly, this._referenceQuaternion, this._referencedPosition, e), ce.ComposeToRef(Ye._ScaleReadOnly, this.rotationQuaternion, this.position, t), e.invert().multiplyToRef(t, i), i.invert(), this._scene.useRightHandedSystem || i.toggleModelMatrixHandInPlace(), i.decompose(void 0, this._referenceQuaternion, this._referencedPosition);
      const s = new XRRigidTransform({
        x: this._referencedPosition.x / this._xrSessionManager.worldScalingFactor,
        y: this._referencedPosition.y / this._xrSessionManager.worldScalingFactor,
        z: this._referencedPosition.z / this._xrSessionManager.worldScalingFactor
      }, {
        x: this._referenceQuaternion.x,
        y: this._referenceQuaternion.y,
        z: this._referenceQuaternion.z,
        w: this._referenceQuaternion.w
      });
      this._xrSessionManager.referenceSpace = this._xrSessionManager.referenceSpace.getOffsetReferenceSpace(s);
    }
  }
}
Ye._ScaleReadOnly = C.One();
class N {
}
N.ANCHOR_SYSTEM = "xr-anchor-system";
N.BACKGROUND_REMOVER = "xr-background-remover";
N.HIT_TEST = "xr-hit-test";
N.MESH_DETECTION = "xr-mesh-detection";
N.PHYSICS_CONTROLLERS = "xr-physics-controller";
N.PLANE_DETECTION = "xr-plane-detection";
N.POINTER_SELECTION = "xr-controller-pointer-selection";
N.TELEPORTATION = "xr-controller-teleportation";
N.FEATURE_POINTS = "xr-feature-points";
N.HAND_TRACKING = "xr-hand-tracking";
N.IMAGE_TRACKING = "xr-image-tracking";
N.NEAR_INTERACTION = "xr-near-interaction";
N.DOM_OVERLAY = "xr-dom-overlay";
N.MOVEMENT = "xr-controller-movement";
N.LIGHT_ESTIMATION = "xr-light-estimation";
N.EYE_TRACKING = "xr-eye-tracking";
N.WALKING_LOCOMOTION = "xr-walking-locomotion";
N.LAYERS = "xr-layers";
N.DEPTH_SENSING = "xr-depth-sensing";
N.SPACE_WARP = "xr-space-warp";
N.RAW_CAMERA_ACCESS = "xr-raw-camera-access";
class he {
  /**
   * constructs a new features manages.
   *
   * @param _xrSessionManager an instance of WebXRSessionManager
   */
  constructor(e) {
    this._xrSessionManager = e, this._features = {}, this._xrSessionManager.onXRSessionInit.add(() => {
      this.getEnabledFeatures().forEach((t) => {
        const i = this._features[t];
        i.enabled && !i.featureImplementation.attached && !i.featureImplementation.disableAutoAttach && this.attachFeature(t);
      });
    }), this._xrSessionManager.onXRSessionEnded.add(() => {
      this.getEnabledFeatures().forEach((t) => {
        const i = this._features[t];
        i.enabled && i.featureImplementation.attached && this.detachFeature(t);
      });
    });
  }
  /**
   * Used to register a module. After calling this function a developer can use this feature in the scene.
   * Mainly used internally.
   *
   * @param featureName the name of the feature to register
   * @param constructorFunction the function used to construct the module
   * @param version the (babylon) version of the module
   * @param stable is that a stable version of this module
   */
  static AddWebXRFeature(e, t, i = 1, s = !1) {
    this._AvailableFeatures[e] = this._AvailableFeatures[e] || { latest: i }, i > this._AvailableFeatures[e].latest && (this._AvailableFeatures[e].latest = i), s && (this._AvailableFeatures[e].stable = i), this._AvailableFeatures[e][i] = t;
  }
  /**
   * Returns a constructor of a specific feature.
   *
   * @param featureName the name of the feature to construct
   * @param version the version of the feature to load
   * @param xrSessionManager the xrSessionManager. Used to construct the module
   * @param options optional options provided to the module.
   * @returns a function that, when called, will return a new instance of this feature
   */
  static ConstructFeature(e, t = 1, i, s) {
    const r = this._AvailableFeatures[e][t];
    if (!r)
      throw new Error("feature not found");
    return r(i, s);
  }
  /**
   * Can be used to return the list of features currently registered
   *
   * @returns an Array of available features
   */
  static GetAvailableFeatures() {
    return Object.keys(this._AvailableFeatures);
  }
  /**
   * Gets the versions available for a specific feature
   * @param featureName the name of the feature
   * @returns an array with the available versions
   */
  static GetAvailableVersions(e) {
    return Object.keys(this._AvailableFeatures[e]);
  }
  /**
   * Return the latest unstable version of this feature
   * @param featureName the name of the feature to search
   * @returns the version number. if not found will return -1
   */
  static GetLatestVersionOfFeature(e) {
    return this._AvailableFeatures[e] && this._AvailableFeatures[e].latest || -1;
  }
  /**
   * Return the latest stable version of this feature
   * @param featureName the name of the feature to search
   * @returns the version number. if not found will return -1
   */
  static GetStableVersionOfFeature(e) {
    return this._AvailableFeatures[e] && this._AvailableFeatures[e].stable || -1;
  }
  /**
   * Attach a feature to the current session. Mainly used when session started to start the feature effect.
   * Can be used during a session to start a feature
   * @param featureName the name of feature to attach
   */
  attachFeature(e) {
    const t = this._features[e];
    t && t.enabled && !t.featureImplementation.attached && (t.featureImplementation.attach() || B.Warn(`Feature ${e} failed to attach`));
  }
  /**
   * Can be used inside a session or when the session ends to detach a specific feature
   * @param featureName the name of the feature to detach
   */
  detachFeature(e) {
    const t = this._features[e];
    t && t.featureImplementation.attached && (t.featureImplementation.detach() || B.Warn(`Feature ${e} failed to detach`));
  }
  /**
   * Used to disable an already-enabled feature
   * The feature will be disposed and will be recreated once enabled.
   * @param featureName the feature to disable
   * @returns true if disable was successful
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  disableFeature(e) {
    const t = typeof e == "string" ? e : e.Name, i = this._features[t];
    return i && i.enabled ? (i.enabled = !1, this.detachFeature(t), i.featureImplementation.dispose(), delete this._features[t], !0) : !1;
  }
  /**
   * dispose this features manager
   */
  dispose() {
    this.getEnabledFeatures().forEach((e) => {
      this.disableFeature(e);
    });
  }
  /**
   * Enable a feature using its name and a version. This will enable it in the scene, and will be responsible to attach it when the session starts.
   * If used twice, the old version will be disposed and a new one will be constructed. This way you can re-enable with different configuration.
   *
   * @param featureName the name of the feature to load or the class of the feature
   * @param version optional version to load. if not provided the latest version will be enabled
   * @param moduleOptions options provided to the module. Ses the module documentation / constructor
   * @param attachIfPossible if set to true (default) the feature will be automatically attached, if it is currently possible
   * @param required is this feature required to the app. If set to true the session init will fail if the feature is not available.
   * @returns a new constructed feature or throws an error if feature not found or conflicts with another enabled feature.
   */
  enableFeature(e, t = "latest", i = {}, s = !0, r = !0) {
    const n = typeof e == "string" ? e : e.Name;
    let o = 0;
    if (typeof t == "string") {
      if (!t)
        throw new Error(`Error in provided version - ${n} (${t})`);
      if (t === "stable" ? o = he.GetStableVersionOfFeature(n) : t === "latest" ? o = he.GetLatestVersionOfFeature(n) : o = +t, o === -1 || isNaN(o))
        throw new Error(`feature not found - ${n} (${t})`);
    } else
      o = t;
    const l = he._ConflictingFeatures[n];
    if (l !== void 0 && this.getEnabledFeatures().indexOf(l) !== -1)
      throw new Error(`Feature ${n} cannot be enabled while ${l} is enabled.`);
    const h = this._features[n], c = he.ConstructFeature(n, o, this._xrSessionManager, i);
    if (!c)
      throw new Error(`feature not found - ${n}`);
    h && this.disableFeature(n);
    const d = c();
    if (d.dependsOn && !d.dependsOn.every((_) => !!this._features[_]))
      throw new Error(`Dependant features missing. Make sure the following features are enabled - ${d.dependsOn.join(", ")}`);
    if (d.isCompatible())
      return this._features[n] = {
        featureImplementation: d,
        enabled: !0,
        version: o,
        required: r
      }, s ? this._xrSessionManager.session && !this._features[n].featureImplementation.attached && this.attachFeature(n) : this._features[n].featureImplementation.disableAutoAttach = !0, this._features[n].featureImplementation;
    if (r)
      throw new Error("required feature not compatible");
    return B.Warn(`Feature ${n} not compatible with the current environment/browser and was not enabled.`), d;
  }
  /**
   * get the implementation of an enabled feature.
   * @param featureName the name of the feature to load
   * @returns the feature class, if found
   */
  getEnabledFeature(e) {
    return this._features[e] && this._features[e].featureImplementation;
  }
  /**
   * Get the list of enabled features
   * @returns an array of enabled features
   */
  getEnabledFeatures() {
    return Object.keys(this._features);
  }
  /**
   * This function will extend the session creation configuration object with enabled features.
   * If, for example, the anchors feature is enabled, it will be automatically added to the optional or required features list,
   * according to the defined "required" variable, provided during enableFeature call
   * @param xrSessionInit the xr Session init object to extend
   *
   * @returns an extended XRSessionInit object
   */
  async _extendXRSessionInitObject(e) {
    const t = this.getEnabledFeatures();
    for (const i of t) {
      const s = this._features[i], r = s.featureImplementation.xrNativeFeatureName;
      if (r && (s.required ? (e.requiredFeatures = e.requiredFeatures || [], e.requiredFeatures.indexOf(r) === -1 && e.requiredFeatures.push(r)) : (e.optionalFeatures = e.optionalFeatures || [], e.optionalFeatures.indexOf(r) === -1 && e.optionalFeatures.push(r))), s.featureImplementation.getXRSessionInitExtension) {
        const n = await s.featureImplementation.getXRSessionInitExtension();
        e = {
          ...e,
          ...n
        };
      }
    }
    return e;
  }
}
he._AvailableFeatures = {};
he._ConflictingFeatures = {
  [N.TELEPORTATION]: N.MOVEMENT,
  [N.MOVEMENT]: N.TELEPORTATION
};
class kt {
  /**
   * Creates a WebXRExperienceHelper
   * @param _scene The scene the helper should be created in
   */
  constructor(e) {
    this._scene = e, this._nonVRCamera = null, this._attachedToElement = !1, this._spectatorCamera = null, this._originalSceneAutoClear = !0, this._supported = !1, this._spectatorMode = !1, this._lastTimestamp = 0, this.onInitialXRPoseSetObservable = new x(), this.onStateChangedObservable = new x(), this.state = J.NOT_IN_XR, this.sessionManager = new gs(e), this.camera = new Ye("webxr", e, this.sessionManager), this.featuresManager = new he(this.sessionManager), e.onDisposeObservable.addOnce(() => {
      this.dispose();
    });
  }
  /**
   * Creates the experience helper
   * @param scene the scene to attach the experience helper to
   * @returns a promise for the experience helper
   */
  static CreateAsync(e) {
    const t = new kt(e);
    return t.sessionManager.initializeAsync().then(() => (t._supported = !0, t)).catch((i) => {
      throw t._setState(J.NOT_IN_XR), t.dispose(), i;
    });
  }
  /**
   * Disposes of the experience helper
   */
  dispose() {
    this.exitXRAsync(), this.camera.dispose(), this.onStateChangedObservable.clear(), this.onInitialXRPoseSetObservable.clear(), this.sessionManager.dispose(), this._spectatorCamera?.dispose(), this._nonVRCamera && (this._scene.activeCamera = this._nonVRCamera);
  }
  /**
   * Enters XR mode (This must be done within a user interaction in most browsers eg. button click)
   * @param sessionMode options for the XR session
   * @param referenceSpaceType frame of reference of the XR session
   * @param renderTarget the output canvas that will be used to enter XR mode
   * @param sessionCreationOptions optional XRSessionInit object to init the session with
   * @returns promise that resolves after xr mode has entered
   */
  async enterXRAsync(e, t, i = this.sessionManager.getWebXRRenderTarget(), s = {}) {
    if (!this._supported)
      throw "WebXR not supported in this browser or environment";
    this._setState(J.ENTERING_XR), t !== "viewer" && t !== "local" && (s.optionalFeatures = s.optionalFeatures || [], s.optionalFeatures.push(t)), s = await this.featuresManager._extendXRSessionInitObject(s), e === "immersive-ar" && t !== "unbounded" && R.Warn("We recommend using 'unbounded' reference space type when using 'immersive-ar' session mode");
    try {
      await this.sessionManager.initializeSessionAsync(e, s), await this.sessionManager.setReferenceSpaceTypeAsync(t);
      const r = {
        // if maxZ is 0 it should be "Infinity", but it doesn't work with the WebXR API. Setting to a large number.
        depthFar: this.camera.maxZ || 1e4,
        depthNear: this.camera.minZ
      };
      if (!this.featuresManager.getEnabledFeature(N.LAYERS)) {
        const n = await i.initializeXRLayerAsync(this.sessionManager.session);
        r.baseLayer = n;
      }
      return this.sessionManager.updateRenderState(r), this.sessionManager.runXRRenderLoop(), this._originalSceneAutoClear = this._scene.autoClear, this._nonVRCamera = this._scene.activeCamera, this._attachedToElement = !!this._nonVRCamera?.inputs?.attachedToElement, this._nonVRCamera?.detachControl(), this._scene.activeCamera = this.camera, e !== "immersive-ar" ? this._nonXRToXRCamera() : (this._scene.autoClear = !1, this.camera.compensateOnFirstFrame = !1, this.camera.position.set(0, 0, 0), this.camera.rotationQuaternion.set(0, 0, 0, 1), this.onInitialXRPoseSetObservable.notifyObservers(this.camera)), this.sessionManager.onXRSessionEnded.addOnce(() => {
        this.state !== J.EXITING_XR && this._setState(J.EXITING_XR), this.camera.rigCameras.forEach((n) => {
          n.outputRenderTarget = null;
        }), this._scene.autoClear = this._originalSceneAutoClear, this._scene.activeCamera = this._nonVRCamera, this._attachedToElement && this._nonVRCamera && this._nonVRCamera.attachControl(!!this._nonVRCamera.inputs.noPreventDefault), e !== "immersive-ar" && this.camera.compensateOnFirstFrame && (this._nonVRCamera.setPosition ? this._nonVRCamera.setPosition(this.camera.position) : this._nonVRCamera.position.copyFrom(this.camera.position)), this._setState(J.NOT_IN_XR);
      }), this.sessionManager.onXRFrameObservable.addOnce(() => {
        this._setState(J.IN_XR);
      }), this.sessionManager;
    } catch (r) {
      throw R.Log(r), R.Log(r.message), this._setState(J.NOT_IN_XR), r;
    }
  }
  /**
   * Exits XR mode and returns the scene to its original state
   * @returns promise that resolves after xr mode has exited
   */
  exitXRAsync() {
    return this.state !== J.IN_XR ? Promise.resolve() : (this._setState(J.EXITING_XR), this.sessionManager.exitXRAsync());
  }
  /**
   * Enable spectator mode for desktop VR experiences.
   * When spectator mode is enabled a camera will be attached to the desktop canvas and will
   * display the first rig camera's view on the desktop canvas.
   * Please note that this will degrade performance, as it requires another camera render.
   * It is also not recommended to enable this in devices like the quest, as it brings no benefit there.
   * @param options giving WebXRSpectatorModeOption for specutator camera to setup when the spectator mode is enabled.
   */
  enableSpectatorMode(e) {
    this._spectatorMode || (this._spectatorMode = !0, this._switchSpectatorMode(e));
  }
  /**
   * Disable spectator mode for desktop VR experiences.
   */
  disableSpecatatorMode() {
    this._spectatorMode && (this._spectatorMode = !1, this._switchSpectatorMode());
  }
  _switchSpectatorMode(e) {
    const i = 1 / (e?.fps ? e.fps : 1e3) * 1e3, s = e?.preferredCameraIndex ? e?.preferredCameraIndex : 0, r = () => {
      this._spectatorCamera && this.sessionManager.currentTimestamp - this._lastTimestamp >= i && (this._lastTimestamp = this.sessionManager.currentTimestamp, this._spectatorCamera.position.copyFrom(this.camera.rigCameras[s].globalPosition), this._spectatorCamera.rotationQuaternion.copyFrom(this.camera.rigCameras[s].absoluteRotation));
    };
    if (this._spectatorMode) {
      if (s >= this.camera.rigCameras.length)
        throw new Error("the preferred camera index is beyond the length of rig camera array.");
      const n = () => {
        this.state === J.IN_XR ? (this._spectatorCamera = new Rs("webxr-spectator", C.Zero(), this._scene), this._spectatorCamera.rotationQuaternion = new A(), this._scene.activeCameras = [this.camera, this._spectatorCamera], this.sessionManager.onXRFrameObservable.add(r), this._scene.onAfterRenderCameraObservable.add((o) => {
          o === this.camera && (this._scene.getEngine().framebufferDimensionsObject = null);
        })) : this.state === J.EXITING_XR && (this.sessionManager.onXRFrameObservable.removeCallback(r), this._scene.activeCameras = null);
      };
      this.onStateChangedObservable.add(n), n();
    } else
      this.sessionManager.onXRFrameObservable.removeCallback(r), this._scene.activeCameras = [this.camera];
  }
  _nonXRToXRCamera() {
    this.camera.setTransformationFromNonVRCamera(this._nonVRCamera), this.onInitialXRPoseSetObservable.notifyObservers(this.camera);
  }
  _setState(e) {
    this.state !== e && (this.state = e, this.onStateChangedObservable.notifyObservers(this.state));
  }
}
class be {
  /**
   * Creates a new component for a motion controller.
   * It is created by the motion controller itself
   *
   * @param id the id of this component
   * @param type the type of the component
   * @param _buttonIndex index in the buttons array of the gamepad
   * @param _axesIndices indices of the values in the axes array of the gamepad
   */
  constructor(e, t, i = -1, s = []) {
    this.id = e, this.type = t, this._buttonIndex = i, this._axesIndices = s, this._axes = {
      x: 0,
      y: 0
    }, this._changes = {}, this._currentValue = 0, this._hasChanges = !1, this._pressed = !1, this._touched = !1, this.onAxisValueChangedObservable = new x(), this.onButtonStateChangedObservable = new x();
  }
  /**
   * The current axes data. If this component has no axes it will still return an object { x: 0, y: 0 }
   */
  get axes() {
    return this._axes;
  }
  /**
   * Get the changes. Elements will be populated only if they changed with their previous and current value
   */
  get changes() {
    return this._changes;
  }
  /**
   * Return whether or not the component changed the last frame
   */
  get hasChanges() {
    return this._hasChanges;
  }
  /**
   * is the button currently pressed
   */
  get pressed() {
    return this._pressed;
  }
  /**
   * is the button currently touched
   */
  get touched() {
    return this._touched;
  }
  /**
   * Get the current value of this component
   */
  get value() {
    return this._currentValue;
  }
  /**
   * Dispose this component
   */
  dispose() {
    this.onAxisValueChangedObservable.clear(), this.onButtonStateChangedObservable.clear();
  }
  /**
   * Are there axes correlating to this component
   * @returns true is axes data is available
   */
  isAxes() {
    return this._axesIndices.length !== 0;
  }
  /**
   * Is this component a button (hence - pressable)
   * @returns true if can be pressed
   */
  isButton() {
    return this._buttonIndex !== -1;
  }
  /**
   * update this component using the gamepad object it is in. Called on every frame
   * @param nativeController the native gamepad controller object
   */
  update(e) {
    let t = !1, i = !1;
    if (this._hasChanges = !1, this._changes = {}, this.isButton()) {
      const s = e.buttons[this._buttonIndex];
      if (!s)
        return;
      this._currentValue !== s.value && (this.changes.value = {
        current: s.value,
        previous: this._currentValue
      }, t = !0, this._currentValue = s.value), this._touched !== s.touched && (this.changes.touched = {
        current: s.touched,
        previous: this._touched
      }, t = !0, this._touched = s.touched), this._pressed !== s.pressed && (this.changes.pressed = {
        current: s.pressed,
        previous: this._pressed
      }, t = !0, this._pressed = s.pressed);
    }
    this.isAxes() && (this._axes.x !== e.axes[this._axesIndices[0]] && (this.changes.axes = {
      current: {
        x: e.axes[this._axesIndices[0]],
        y: this._axes.y
      },
      previous: {
        x: this._axes.x,
        y: this._axes.y
      }
    }, this._axes.x = e.axes[this._axesIndices[0]], i = !0), this._axes.y !== e.axes[this._axesIndices[1]] && (this.changes.axes ? this.changes.axes.current.y = e.axes[this._axesIndices[1]] : this.changes.axes = {
      current: {
        x: this._axes.x,
        y: e.axes[this._axesIndices[1]]
      },
      previous: {
        x: this._axes.x,
        y: this._axes.y
      }
    }, this._axes.y = e.axes[this._axesIndices[1]], i = !0)), t && (this._hasChanges = !0, this.onButtonStateChangedObservable.notifyObservers(this)), i && (this._hasChanges = !0, this.onAxisValueChangedObservable.notifyObservers(this._axes));
  }
}
be.BUTTON_TYPE = "button";
be.SQUEEZE_TYPE = "squeeze";
be.THUMBSTICK_TYPE = "thumbstick";
be.TOUCHPAD_TYPE = "touchpad";
be.TRIGGER_TYPE = "trigger";
class Mi {
  /**
   * constructs a new abstract motion controller
   * @param scene the scene to which the model of the controller will be added
   * @param layout The profile layout to load
   * @param gamepadObject The gamepad object correlating to this controller
   * @param handedness handedness (left/right/none) of this controller
   * @param _doNotLoadControllerMesh set this flag to ignore the mesh loading
   * @param _controllerCache a cache holding controller models already loaded in this session
   */
  constructor(e, t, i, s, r = !1, n) {
    this.scene = e, this.layout = t, this.gamepadObject = i, this.handedness = s, this._doNotLoadControllerMesh = r, this._controllerCache = n, this._initComponent = (o) => {
      if (!o)
        return;
      const l = this.layout.components[o], h = l.type, c = l.gamepadIndices.button, d = [];
      l.gamepadIndices.xAxis !== void 0 && l.gamepadIndices.yAxis !== void 0 && d.push(l.gamepadIndices.xAxis, l.gamepadIndices.yAxis), this.components[o] = new be(o, h, c, d);
    }, this._modelReady = !1, this.components = {}, this.disableAnimation = !1, this.onModelLoadedObservable = new x(), t.components && Object.keys(t.components).forEach(this._initComponent);
  }
  /**
   * Dispose this controller, the model mesh and all its components
   */
  dispose() {
    this.getComponentIds().forEach((e) => this.getComponent(e).dispose()), this.rootMesh && (this.rootMesh.getChildren(void 0, !0).forEach((e) => {
      e.setEnabled(!1);
    }), this.rootMesh.dispose(!!this._controllerCache, !this._controllerCache));
  }
  /**
   * Returns all components of specific type
   * @param type the type to search for
   * @returns an array of components with this type
   */
  getAllComponentsOfType(e) {
    return this.getComponentIds().map((t) => this.components[t]).filter((t) => t.type === e);
  }
  /**
   * get a component based an its component id as defined in layout.components
   * @param id the id of the component
   * @returns the component correlates to the id or undefined if not found
   */
  getComponent(e) {
    return this.components[e];
  }
  /**
   * Get the list of components available in this motion controller
   * @returns an array of strings correlating to available components
   */
  getComponentIds() {
    return Object.keys(this.components);
  }
  /**
   * Get the first component of specific type
   * @param type type of component to find
   * @returns a controller component or null if not found
   */
  getComponentOfType(e) {
    return this.getAllComponentsOfType(e)[0] || null;
  }
  /**
   * Get the main (Select) component of this controller as defined in the layout
   * @returns the main component of this controller
   */
  getMainComponent() {
    return this.getComponent(this.layout.selectComponentId);
  }
  /**
   * Loads the model correlating to this controller
   * When the mesh is loaded, the onModelLoadedObservable will be triggered
   * @returns A promise fulfilled with the result of the model loading
   */
  async loadModel() {
    const e = !this._getModelLoadingConstraints();
    let t = this._getGenericFilenameAndPath();
    return e ? R.Warn("Falling back to generic models") : t = this._getFilenameAndPath(), new Promise((i, s) => {
      const r = (n) => {
        e ? this._getGenericParentMesh(n) : this._setRootMesh(n), this._processLoadedModel(n), this._modelReady = !0, this.onModelLoadedObservable.notifyObservers(this), i(!0);
      };
      if (this._controllerCache) {
        const n = this._controllerCache.filter((o) => o.filename === t.filename && o.path === t.path);
        if (n[0]) {
          n[0].meshes.forEach((o) => o.setEnabled(!0)), r(n[0].meshes);
          return;
        }
      }
      lt.ImportMesh("", t.path, t.filename, this.scene, (n) => {
        this._controllerCache && this._controllerCache.push({
          ...t,
          meshes: n
        }), r(n);
      }, null, (n, o) => {
        R.Log(o), R.Warn(`Failed to retrieve controller model of type ${this.profileId} from the remote server: ${t.path}${t.filename}`), s(o);
      });
    });
  }
  /**
   * Update this model using the current XRFrame
   * @param xrFrame the current xr frame to use and update the model
   */
  updateFromXRFrame(e) {
    this.getComponentIds().forEach((t) => this.getComponent(t).update(this.gamepadObject)), this.updateModel(e);
  }
  /**
   * Backwards compatibility due to a deeply-integrated typo
   */
  get handness() {
    return this.handedness;
  }
  /**
   * Pulse (vibrate) this controller
   * If the controller does not support pulses, this function will fail silently and return Promise<false> directly after called
   * Consecutive calls to this function will cancel the last pulse call
   *
   * @param value the strength of the pulse in 0.0...1.0 range
   * @param duration Duration of the pulse in milliseconds
   * @param hapticActuatorIndex optional index of actuator (will usually be 0)
   * @returns a promise that will send true when the pulse has ended and false if the device doesn't support pulse or an error accrued
   */
  pulse(e, t, i = 0) {
    return this.gamepadObject.hapticActuators && this.gamepadObject.hapticActuators[i] ? this.gamepadObject.hapticActuators[i].pulse(e, t) : Promise.resolve(!1);
  }
  // Look through all children recursively. This will return null if no mesh exists with the given name.
  _getChildByName(e, t) {
    return e.getChildren((i) => i.name === t, !1)[0];
  }
  // Look through only immediate children. This will return null if no mesh exists with the given name.
  _getImmediateChildByName(e, t) {
    return e.getChildren((i) => i.name == t, !0)[0];
  }
  /**
   * Moves the axis on the controller mesh based on its current state
   * @param axisMap
   * @param axisValue the value of the axis which determines the meshes new position
   * @internal
   */
  _lerpTransform(e, t, i) {
    if (!e.minMesh || !e.maxMesh || !e.valueMesh || !e.minMesh.rotationQuaternion || !e.maxMesh.rotationQuaternion || !e.valueMesh.rotationQuaternion)
      return;
    const s = i ? t * 0.5 + 0.5 : t;
    A.SlerpToRef(e.minMesh.rotationQuaternion, e.maxMesh.rotationQuaternion, s, e.valueMesh.rotationQuaternion), C.LerpToRef(e.minMesh.position, e.maxMesh.position, s, e.valueMesh.position);
  }
  /**
   * Update the model itself with the current frame data
   * @param xrFrame the frame to use for updating the model mesh
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  updateModel(e) {
    this._modelReady && this._updateModel(e);
  }
  _getGenericFilenameAndPath() {
    return {
      filename: "generic.babylon",
      path: "https://controllers.babylonjs.com/generic/"
    };
  }
  _getGenericParentMesh(e) {
    this.rootMesh = new Xe(this.profileId + " " + this.handedness, this.scene), e.forEach((t) => {
      t.parent || (t.isPickable = !1, t.setParent(this.rootMesh));
    }), this.rootMesh.rotationQuaternion = A.FromEulerAngles(0, Math.PI, 0);
  }
}
class qe extends Mi {
  constructor(e, t, i) {
    super(e, nr[i], t, i), this.profileId = qe.ProfileId;
  }
  _getFilenameAndPath() {
    return {
      filename: "generic.babylon",
      path: "https://controllers.babylonjs.com/generic/"
    };
  }
  _getModelLoadingConstraints() {
    return !0;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _processLoadedModel(e) {
  }
  _setRootMesh(e) {
    this.rootMesh = new Xe(this.profileId + " " + this.handedness, this.scene), e.forEach((t) => {
      t.isPickable = !1, t.parent || t.setParent(this.rootMesh);
    }), this.rootMesh.rotationQuaternion = A.FromEulerAngles(0, Math.PI, 0);
  }
  _updateModel() {
  }
}
qe.ProfileId = "generic-trigger";
const nr = {
  left: {
    selectComponentId: "xr-standard-trigger",
    components: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "xr-standard-trigger": {
        type: "trigger",
        gamepadIndices: {
          button: 0
        },
        rootNodeName: "xr_standard_trigger",
        visualResponses: {}
      }
    },
    gamepadMapping: "xr-standard",
    rootNodeName: "generic-trigger-left",
    assetPath: "left.glb"
  },
  right: {
    selectComponentId: "xr-standard-trigger",
    components: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "xr-standard-trigger": {
        type: "trigger",
        gamepadIndices: {
          button: 0
        },
        rootNodeName: "xr_standard_trigger",
        visualResponses: {}
      }
    },
    gamepadMapping: "xr-standard",
    rootNodeName: "generic-trigger-right",
    assetPath: "right.glb"
  },
  none: {
    selectComponentId: "xr-standard-trigger",
    components: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "xr-standard-trigger": {
        type: "trigger",
        gamepadIndices: {
          button: 0
        },
        rootNodeName: "xr_standard_trigger",
        visualResponses: {}
      }
    },
    gamepadMapping: "xr-standard",
    rootNodeName: "generic-trigger-none",
    assetPath: "none.glb"
  }
};
class or extends Mi {
  constructor(e, t, i, s, r) {
    super(e, i.layouts[t.handedness || "none"], t.gamepad, t.handedness, void 0, r), this._repositoryUrl = s, this.controllerCache = r, this._buttonMeshMapping = {}, this._touchDots = {}, this.profileId = i.profileId;
  }
  dispose() {
    super.dispose(), this.controllerCache || Object.keys(this._touchDots).forEach((e) => {
      this._touchDots[e].dispose();
    });
  }
  _getFilenameAndPath() {
    return {
      filename: this.layout.assetPath,
      path: `${this._repositoryUrl}/profiles/${this.profileId}/`
    };
  }
  _getModelLoadingConstraints() {
    const e = lt.IsPluginForExtensionAvailable(".glb");
    return e || R.Warn("glTF / glb loader was not registered, using generic controller instead"), e;
  }
  _processLoadedModel(e) {
    this.getComponentIds().forEach((t) => {
      const i = this.layout.components[t];
      this._buttonMeshMapping[t] = {
        mainMesh: this._getChildByName(this.rootMesh, i.rootNodeName),
        states: {}
      }, Object.keys(i.visualResponses).forEach((s) => {
        const r = i.visualResponses[s];
        if (r.valueNodeProperty === "transform")
          this._buttonMeshMapping[t].states[s] = {
            valueMesh: this._getChildByName(this.rootMesh, r.valueNodeName),
            minMesh: this._getChildByName(this.rootMesh, r.minNodeName),
            maxMesh: this._getChildByName(this.rootMesh, r.maxNodeName)
          };
        else {
          const n = i.type === be.TOUCHPAD_TYPE && i.touchPointNodeName ? i.touchPointNodeName : r.valueNodeName;
          if (this._buttonMeshMapping[t].states[s] = {
            valueMesh: this._getChildByName(this.rootMesh, n)
          }, i.type === be.TOUCHPAD_TYPE && !this._touchDots[s]) {
            const o = At(s + "dot", {
              diameter: 15e-4,
              segments: 8
            }, this.scene);
            o.material = new Le(s + "mat", this.scene), o.material.diffuseColor = U.Red(), o.parent = this._buttonMeshMapping[t].states[s].valueMesh || null, o.isVisible = !1, this._touchDots[s] = o;
          }
        }
      });
    });
  }
  _setRootMesh(e) {
    this.rootMesh = new Xe(this.profileId + "-" + this.handedness, this.scene), this.rootMesh.isPickable = !1;
    let t;
    for (let i = 0; i < e.length; i++) {
      const s = e[i];
      s.isPickable = !1, s.parent || (t = s);
    }
    t && t.setParent(this.rootMesh), this.scene.useRightHandedSystem || this.rootMesh.rotate(ct.Y, Math.PI, je.WORLD);
  }
  _updateModel(e) {
    this.disableAnimation || this.getComponentIds().forEach((t) => {
      const i = this.getComponent(t);
      if (!i.hasChanges)
        return;
      const s = this._buttonMeshMapping[t], r = this.layout.components[t];
      Object.keys(r.visualResponses).forEach((n) => {
        const o = r.visualResponses[n];
        let l = i.value;
        if (o.componentProperty === "xAxis" ? l = i.axes.x : o.componentProperty === "yAxis" && (l = i.axes.y), o.valueNodeProperty === "transform")
          this._lerpTransform(s.states[n], l, o.componentProperty !== "button");
        else {
          const h = s.states[n].valueMesh;
          h && (h.isVisible = i.touched || i.pressed), this._touchDots[n] && (this._touchDots[n].isVisible = i.touched || i.pressed);
        }
      });
    });
  }
}
const Et = [];
class Q {
  /**
   * Clear the cache used for profile loading and reload when requested again
   */
  static ClearProfilesCache() {
    this._ProfilesList = null, this._ProfileLoadingPromises = {};
  }
  /**
   * Register the default fallbacks.
   * This function is called automatically when this file is imported.
   */
  static DefaultFallbacks() {
    this.RegisterFallbacksForProfileId("google-daydream", ["generic-touchpad"]), this.RegisterFallbacksForProfileId("htc-vive-focus", ["generic-trigger-touchpad"]), this.RegisterFallbacksForProfileId("htc-vive", ["generic-trigger-squeeze-touchpad"]), this.RegisterFallbacksForProfileId("magicleap-one", ["generic-trigger-squeeze-touchpad"]), this.RegisterFallbacksForProfileId("windows-mixed-reality", ["generic-trigger-squeeze-touchpad-thumbstick"]), this.RegisterFallbacksForProfileId("microsoft-mixed-reality", ["windows-mixed-reality", "generic-trigger-squeeze-touchpad-thumbstick"]), this.RegisterFallbacksForProfileId("oculus-go", ["generic-trigger-touchpad"]), this.RegisterFallbacksForProfileId("oculus-touch-v2", ["oculus-touch", "generic-trigger-squeeze-thumbstick"]), this.RegisterFallbacksForProfileId("oculus-touch", ["generic-trigger-squeeze-thumbstick"]), this.RegisterFallbacksForProfileId("samsung-gearvr", ["windows-mixed-reality", "generic-trigger-squeeze-touchpad-thumbstick"]), this.RegisterFallbacksForProfileId("samsung-odyssey", ["generic-touchpad"]), this.RegisterFallbacksForProfileId("valve-index", ["generic-trigger-squeeze-touchpad-thumbstick"]), this.RegisterFallbacksForProfileId("generic-hand-select", ["generic-trigger"]);
  }
  /**
   * Find a fallback profile if the profile was not found. There are a few predefined generic profiles.
   * @param profileId the profile to which a fallback needs to be found
   * @returns an array with corresponding fallback profiles
   */
  static FindFallbackWithProfileId(e) {
    const t = this._Fallbacks[e] || [];
    return t.unshift(e), t;
  }
  /**
   * When acquiring a new xrInput object (usually by the WebXRInput class), match it with the correct profile.
   * The order of search:
   *
   * 1) Iterate the profiles array of the xr input and try finding a corresponding motion controller
   * 2) (If not found) search in the gamepad id and try using it (legacy versions only)
   * 3) search for registered fallbacks (should be redundant, nonetheless it makes sense to check)
   * 4) return the generic trigger controller if none were found
   *
   * @param xrInput the xrInput to which a new controller is initialized
   * @param scene the scene to which the model will be added
   * @param forceProfile force a certain profile for this controller
   * @returns A promise that fulfils with the motion controller class for this profile id or the generic standard class if none was found
   */
  static GetMotionControllerWithXRInput(e, t, i) {
    const s = [];
    if (i && s.push(i), s.push(...e.profiles || []), s.length && !s[0] && s.pop(), e.gamepad && e.gamepad.id)
      switch (e.gamepad.id) {
        case (e.gamepad.id.match(/oculus touch/gi) ? e.gamepad.id : void 0):
          s.push("oculus-touch-v2");
          break;
      }
    const r = s.indexOf("windows-mixed-reality");
    if (r !== -1 && s.splice(r, 0, "microsoft-mixed-reality"), s.length || s.push("generic-trigger"), this.UseOnlineRepository) {
      const n = this.PrioritizeOnlineRepository ? this._LoadProfileFromRepository : this._LoadProfilesFromAvailableControllers, o = this.PrioritizeOnlineRepository ? this._LoadProfilesFromAvailableControllers : this._LoadProfileFromRepository;
      return n.call(this, s, e, t).catch(() => o.call(this, s, e, t));
    } else
      return this._LoadProfilesFromAvailableControllers(s, e, t);
  }
  /**
   * Register a new controller based on its profile. This function will be called by the controller classes themselves.
   *
   * If you are missing a profile, make sure it is imported in your source, otherwise it will not register.
   *
   * @param type the profile type to register
   * @param constructFunction the function to be called when loading this profile
   */
  static RegisterController(e, t) {
    this._AvailableControllers[e] = t;
  }
  /**
   * Register a fallback to a specific profile.
   * @param profileId the profileId that will receive the fallbacks
   * @param fallbacks A list of fallback profiles
   */
  static RegisterFallbacksForProfileId(e, t) {
    this._Fallbacks[e] ? this._Fallbacks[e].push(...t) : this._Fallbacks[e] = t;
  }
  /**
   * Will update the list of profiles available in the repository
   * @returns a promise that resolves to a map of profiles available online
   */
  static UpdateProfilesList() {
    return this._ProfilesList = B.LoadFileAsync(this.BaseRepositoryUrl + "/profiles/profilesList.json", !1).then((e) => JSON.parse(e)), this._ProfilesList;
  }
  /**
   * Clear the controller's cache (usually happens at the end of a session)
   */
  static ClearControllerCache() {
    Et.forEach((e) => {
      e.meshes.forEach((t) => {
        t.dispose(!1, !0);
      });
    }), Et.length = 0;
  }
  static _LoadProfileFromRepository(e, t, i) {
    return Promise.resolve().then(() => this._ProfilesList ? this._ProfilesList : this.UpdateProfilesList()).then((s) => {
      for (let r = 0; r < e.length; ++r)
        if (e[r] && s[e[r]])
          return e[r];
      throw new Error(`neither controller ${e[0]} nor all fallbacks were found in the repository,`);
    }).then((s) => (this._ProfileLoadingPromises[s] || (this._ProfileLoadingPromises[s] = B.LoadFileAsync(`${this.BaseRepositoryUrl}/profiles/${s}/profile.json`, !1).then((r) => JSON.parse(r))), this._ProfileLoadingPromises[s])).then((s) => new or(i, t, s, this.BaseRepositoryUrl, this.DisableControllerCache ? void 0 : Et));
  }
  static _LoadProfilesFromAvailableControllers(e, t, i) {
    for (let s = 0; s < e.length; ++s) {
      if (!e[s])
        continue;
      const r = this.FindFallbackWithProfileId(e[s]);
      for (let n = 0; n < r.length; ++n) {
        const o = this._AvailableControllers[r[n]];
        if (o)
          return Promise.resolve(o(t, i));
      }
    }
    throw new Error("no controller requested was found in the available controllers list");
  }
}
Q._AvailableControllers = {};
Q._Fallbacks = {};
Q._ProfileLoadingPromises = {};
Q.BaseRepositoryUrl = "https://immersive-web.github.io/webxr-input-profiles/packages/viewer/dist";
Q.PrioritizeOnlineRepository = !0;
Q.UseOnlineRepository = !0;
Q.DisableControllerCache = !0;
Q.RegisterController(qe.ProfileId, (a, e) => new qe(e, a.gamepad, a.handedness));
Q.DefaultFallbacks();
let ar = 0;
class lr {
  /**
   * Creates the input source object
   * @see https://doc.babylonjs.com/features/featuresDeepDive/webXR/webXRInputControllerSupport
   * @param _scene the scene which the controller should be associated to
   * @param inputSource the underlying input source for the controller
   * @param _options options for this controller creation
   */
  constructor(e, t, i = {}) {
    this._scene = e, this.inputSource = t, this._options = i, this._tmpVector = new C(), this._disposed = !1, this.onDisposeObservable = new x(), this.onMeshLoadedObservable = new x(), this.onMotionControllerInitObservable = new x(), this._uniqueId = `controller-${ar++}-${t.targetRayMode}-${t.handedness}`, this.pointer = new Ge(`${this._uniqueId}-pointer`, e), this.pointer.rotationQuaternion = new A(), this.inputSource.gripSpace && (this.grip = new Ge(`${this._uniqueId}-grip`, this._scene), this.grip.rotationQuaternion = new A()), this._tmpVector.set(0, 0, this._scene.useRightHandedSystem ? -1 : 1), this.inputSource.gamepad && this.inputSource.targetRayMode === "tracked-pointer" && Q.GetMotionControllerWithXRInput(t, e, this._options.forceControllerProfile).then((s) => {
      this.motionController = s, this.onMotionControllerInitObservable.notifyObservers(s), !this._options.doNotLoadControllerMesh && !this.motionController._doNotLoadControllerMesh && this.motionController.loadModel().then((r) => {
        r && this.motionController && this.motionController.rootMesh && (this._options.renderingGroupId && (this.motionController.rootMesh.renderingGroupId = this._options.renderingGroupId, this.motionController.rootMesh.getChildMeshes(!1).forEach((n) => n.renderingGroupId = this._options.renderingGroupId)), this.onMeshLoadedObservable.notifyObservers(this.motionController.rootMesh), this.motionController.rootMesh.parent = this.grip || this.pointer, this.motionController.disableAnimation = !!this._options.disableMotionControllerAnimation), this._disposed && this.motionController?.dispose();
      });
    }, () => {
      B.Warn("Could not find a matching motion controller for the registered input source");
    });
  }
  /**
   * Get this controllers unique id
   */
  get uniqueId() {
    return this._uniqueId;
  }
  /**
   * Disposes of the object
   */
  dispose() {
    this.grip && this.grip.dispose(!0), this.motionController && this.motionController.dispose(), this.pointer.dispose(!0), this.onMotionControllerInitObservable.clear(), this.onMeshLoadedObservable.clear(), this.onDisposeObservable.notifyObservers(this), this.onDisposeObservable.clear(), this._disposed = !0;
  }
  /**
   * Gets a world space ray coming from the pointer or grip
   * @param result the resulting ray
   * @param gripIfAvailable use the grip mesh instead of the pointer, if available
   */
  getWorldPointerRayToRef(e, t = !1) {
    const i = t && this.grip ? this.grip : this.pointer;
    C.TransformNormalToRef(this._tmpVector, i.getWorldMatrix(), e.direction), e.direction.normalize(), e.origin.copyFrom(i.absolutePosition), e.length = 1e3;
  }
  /**
   * Updates the controller pose based on the given XRFrame
   * @param xrFrame xr frame to update the pose with
   * @param referenceSpace reference space to use
   * @param xrCamera the xr camera, used for parenting
   * @param xrSessionManager the session manager used to get the world reference system
   */
  updateFromXRFrame(e, t, i, s) {
    const r = e.getPose(this.inputSource.targetRaySpace, t);
    if (this._lastXRPose = r, r) {
      const n = r.transform.position;
      this.pointer.position.set(n.x, n.y, n.z).scaleInPlace(s.worldScalingFactor);
      const o = r.transform.orientation;
      this.pointer.rotationQuaternion.set(o.x, o.y, o.z, o.w), this._scene.useRightHandedSystem || (this.pointer.position.z *= -1, this.pointer.rotationQuaternion.z *= -1, this.pointer.rotationQuaternion.w *= -1), this.pointer.parent = i.parent, this.pointer.scaling.setAll(s.worldScalingFactor);
    }
    if (this.inputSource.gripSpace && this.grip) {
      const n = e.getPose(this.inputSource.gripSpace, t);
      if (n) {
        const o = n.transform.position, l = n.transform.orientation;
        this.grip.position.set(o.x, o.y, o.z).scaleInPlace(s.worldScalingFactor), this.grip.rotationQuaternion.set(l.x, l.y, l.z, l.w), this._scene.useRightHandedSystem || (this.grip.position.z *= -1, this.grip.rotationQuaternion.z *= -1, this.grip.rotationQuaternion.w *= -1);
      }
      this.grip.parent = i.parent, this.grip.scaling.setAll(s.worldScalingFactor);
    }
    this.motionController && this.motionController.updateFromXRFrame(e);
  }
}
class hr {
  /**
   * Initializes the WebXRInput
   * @param xrSessionManager the xr session manager for this session
   * @param xrCamera the WebXR camera for this session. Mainly used for teleportation
   * @param _options = initialization options for this xr input
   */
  constructor(e, t, i = {}) {
    if (this.xrSessionManager = e, this.xrCamera = t, this._options = i, this.controllers = [], this.onControllerAddedObservable = new x(), this.onControllerRemovedObservable = new x(), this._onInputSourcesChange = (s) => {
      this._addAndRemoveControllers(s.added, s.removed);
    }, this._sessionEndedObserver = this.xrSessionManager.onXRSessionEnded.add(() => {
      this._addAndRemoveControllers([], this.controllers.map((s) => s.inputSource));
    }), this._sessionInitObserver = this.xrSessionManager.onXRSessionInit.add((s) => {
      s.addEventListener("inputsourceschange", this._onInputSourcesChange);
    }), this._frameObserver = this.xrSessionManager.onXRFrameObservable.add((s) => {
      this.controllers.forEach((r) => {
        r.updateFromXRFrame(s, this.xrSessionManager.referenceSpace, this.xrCamera, this.xrSessionManager);
      });
    }), this._options.customControllersRepositoryURL && (Q.BaseRepositoryUrl = this._options.customControllersRepositoryURL), Q.UseOnlineRepository = !this._options.disableOnlineControllerRepository, Q.UseOnlineRepository)
      try {
        Q.UpdateProfilesList().catch(() => {
          Q.UseOnlineRepository = !1;
        });
      } catch {
        Q.UseOnlineRepository = !1;
      }
  }
  _addAndRemoveControllers(e, t) {
    const i = this.controllers.map((n) => n.inputSource);
    for (const n of e)
      if (i.indexOf(n) === -1) {
        const o = new lr(this.xrSessionManager.scene, n, {
          ...this._options.controllerOptions || {},
          forceControllerProfile: this._options.forceInputProfile,
          doNotLoadControllerMesh: this._options.doNotLoadControllerMeshes,
          disableMotionControllerAnimation: this._options.disableControllerAnimation
        });
        this.controllers.push(o), this.onControllerAddedObservable.notifyObservers(o);
      }
    const s = [], r = [];
    this.controllers.forEach((n) => {
      t.indexOf(n.inputSource) === -1 ? s.push(n) : r.push(n);
    }), this.controllers = s, r.forEach((n) => {
      this.onControllerRemovedObservable.notifyObservers(n), n.dispose();
    });
  }
  /**
   * Disposes of the object
   */
  dispose() {
    this.controllers.forEach((e) => {
      e.dispose();
    }), this.xrSessionManager.onXRFrameObservable.remove(this._frameObserver), this.xrSessionManager.onXRSessionInit.remove(this._sessionInitObserver), this.xrSessionManager.onXRSessionEnded.remove(this._sessionEndedObserver), this.onControllerAddedObservable.clear(), this.onControllerRemovedObservable.clear(), Q.ClearControllerCache();
  }
}
class ft {
  /**
   * The name of the native xr feature name (like anchor, hit-test, or hand-tracking)
   */
  get xrNativeFeatureName() {
    return this._xrNativeFeatureName;
  }
  set xrNativeFeatureName(e) {
    !this._xrSessionManager.isNative && e && this._xrSessionManager.inXRSession && this._xrSessionManager.enabledFeatures?.indexOf(e) === -1 && R.Warn(`The feature ${e} needs to be enabled before starting the XR session. Note - It is still possible it is not supported.`), this._xrNativeFeatureName = e;
  }
  /**
   * Construct a new (abstract) WebXR feature
   * @param _xrSessionManager the xr session manager for this feature
   */
  constructor(e) {
    this._xrSessionManager = e, this._attached = !1, this._removeOnDetach = [], this.isDisposed = !1, this.disableAutoAttach = !1, this._xrNativeFeatureName = "", this.onFeatureAttachObservable = new x(), this.onFeatureDetachObservable = new x();
  }
  /**
   * Is this feature attached
   */
  get attached() {
    return this._attached;
  }
  /**
   * attach this feature
   *
   * @param force should attachment be forced (even when already attached)
   * @returns true if successful, false is failed or already attached
   */
  attach(e) {
    if (this.isDisposed)
      return !1;
    if (e)
      this.attached && this.detach();
    else if (this.attached)
      return !1;
    if (!this._xrSessionManager.enabledFeatures)
      R.Warn("session.enabledFeatures is not available on this device. It is possible that this feature is not supported.");
    else if (!this._xrSessionManager.isNative && this.xrNativeFeatureName && this._xrSessionManager.enabledFeatures.indexOf(this.xrNativeFeatureName) === -1)
      return !1;
    return this._attached = !0, this._addNewAttachObserver(this._xrSessionManager.onXRFrameObservable, (t) => this._onXRFrame(t)), this.onFeatureAttachObservable.notifyObservers(this), !0;
  }
  /**
   * detach this feature.
   *
   * @returns true if successful, false if failed or already detached
   */
  detach() {
    return this._attached ? (this._attached = !1, this._removeOnDetach.forEach((e) => {
      e.observable.remove(e.observer);
    }), this.onFeatureDetachObservable.notifyObservers(this), !0) : (this.disableAutoAttach = !0, !1);
  }
  /**
   * Dispose this feature and all of the resources attached
   */
  dispose() {
    this.detach(), this.isDisposed = !0, this.onFeatureAttachObservable.clear(), this.onFeatureDetachObservable.clear();
  }
  /**
   * This function will be executed during before enabling the feature and can be used to not-allow enabling it.
   * Note that at this point the session has NOT started, so this is purely checking if the browser supports it
   *
   * @returns whether or not the feature is compatible in this environment
   */
  isCompatible() {
    return !0;
  }
  /**
   * This is used to register callbacks that will automatically be removed when detach is called.
   * @param observable the observable to which the observer will be attached
   * @param callback the callback to register
   * @param insertFirst should the callback be executed as soon as it is registered
   */
  _addNewAttachObserver(e, t, i) {
    this._removeOnDetach.push({
      observable: e,
      observer: e.add(t, void 0, i)
    });
  }
}
class w {
  /**
   * Gets the camera that is used to render the utility layer (when not set, this will be the last active camera)
   * @param getRigParentIfPossible if the current active camera is a rig camera, should its parent camera be returned
   * @returns the camera that is used when rendering the utility layer
   */
  getRenderCamera(e) {
    if (this._renderCamera)
      return this._renderCamera;
    {
      let t;
      return this.originalScene.activeCameras && this.originalScene.activeCameras.length > 1 ? t = this.originalScene.activeCameras[this.originalScene.activeCameras.length - 1] : t = this.originalScene.activeCamera, e && t && t.isRigCamera ? t.rigParent : t;
    }
  }
  /**
   * Sets the camera that should be used when rendering the utility layer (If set to null the last active camera will be used)
   * @param cam the camera that should be used when rendering the utility layer
   */
  setRenderCamera(e) {
    this._renderCamera = e;
  }
  /**
   * @internal
   * Light which used by gizmos to get light shading
   */
  _getSharedGizmoLight() {
    return this._sharedGizmoLight || (this._sharedGizmoLight = new mi("shared gizmo light", new C(0, 1, 0), this.utilityLayerScene), this._sharedGizmoLight.intensity = 2, this._sharedGizmoLight.groundColor = U.Gray()), this._sharedGizmoLight;
  }
  /**
   * A shared utility layer that can be used to overlay objects into a scene (Depth map of the previous scene is cleared before drawing on top of it)
   */
  static get DefaultUtilityLayer() {
    return w._DefaultUtilityLayer == null ? w._CreateDefaultUtilityLayerFromScene(He.LastCreatedScene) : w._DefaultUtilityLayer;
  }
  /**
   * Creates an utility layer, and set it as a default utility layer
   * @param scene associated scene
   * @internal
   */
  static _CreateDefaultUtilityLayerFromScene(e) {
    return w._DefaultUtilityLayer = new w(e), w._DefaultUtilityLayer.originalScene.onDisposeObservable.addOnce(() => {
      w._DefaultUtilityLayer = null;
    }), w._DefaultUtilityLayer;
  }
  /**
   * A shared utility layer that can be used to embed objects into a scene (Depth map of the previous scene is not cleared before drawing on top of it)
   */
  static get DefaultKeepDepthUtilityLayer() {
    return w._DefaultKeepDepthUtilityLayer == null && (w._DefaultKeepDepthUtilityLayer = new w(He.LastCreatedScene), w._DefaultKeepDepthUtilityLayer.utilityLayerScene.autoClearDepthAndStencil = !1, w._DefaultKeepDepthUtilityLayer.originalScene.onDisposeObservable.addOnce(() => {
      w._DefaultKeepDepthUtilityLayer = null;
    })), w._DefaultKeepDepthUtilityLayer;
  }
  /**
   * Instantiates a UtilityLayerRenderer
   * @param originalScene the original scene that will be rendered on top of
   * @param handleEvents boolean indicating if the utility layer should handle events
   */
  constructor(e, t = !0) {
    this.originalScene = e, this._pointerCaptures = {}, this._lastPointerEvents = {}, this._sharedGizmoLight = null, this._renderCamera = null, this.pickUtilitySceneFirst = !0, this.shouldRender = !0, this.onlyCheckPointerDownEvents = !0, this.processAllEvents = !1, this.pickingEnabled = !0, this.onPointerOutObservable = new x(), this.utilityLayerScene = new Oe(e.getEngine(), { virtual: !0 }), this.utilityLayerScene.useRightHandedSystem = e.useRightHandedSystem, this.utilityLayerScene._allowPostProcessClearColor = !1, this.utilityLayerScene.postProcessesEnabled = !1, this.utilityLayerScene.detachControl(), t && (this._originalPointerObserver = e.onPrePointerObservable.add((i) => {
      if (!this.utilityLayerScene.activeCamera || !this.pickingEnabled || !this.processAllEvents && i.type !== ie.POINTERMOVE && i.type !== ie.POINTERUP && i.type !== ie.POINTERDOWN && i.type !== ie.POINTERDOUBLETAP)
        return;
      this.utilityLayerScene.pointerX = e.pointerX, this.utilityLayerScene.pointerY = e.pointerY;
      const s = i.event;
      if (e.isPointerCaptured(s.pointerId)) {
        this._pointerCaptures[s.pointerId] = !1;
        return;
      }
      const r = (o) => {
        let l = null;
        if (i.nearInteractionPickingInfo)
          i.nearInteractionPickingInfo.pickedMesh.getScene() == o ? l = i.nearInteractionPickingInfo : l = new Me();
        else if (o !== this.utilityLayerScene && i.originalPickingInfo)
          l = i.originalPickingInfo;
        else {
          let h = null;
          this._renderCamera && (h = o._activeCamera, o._activeCamera = this._renderCamera, i.ray = null), l = i.ray ? o.pickWithRay(i.ray) : o.pick(e.pointerX, e.pointerY), h && (o._activeCamera = h);
        }
        return l;
      }, n = r(this.utilityLayerScene);
      if (!i.ray && n && (i.ray = n.ray), this.utilityLayerScene.onPrePointerObservable.notifyObservers(i), this.onlyCheckPointerDownEvents && i.type != ie.POINTERDOWN) {
        i.skipOnPointerObservable || this.utilityLayerScene.onPointerObservable.notifyObservers(new Ct(i.type, i.event, n), i.type), i.type === ie.POINTERUP && this._pointerCaptures[s.pointerId] && (this._pointerCaptures[s.pointerId] = !1);
        return;
      }
      if (this.utilityLayerScene.autoClearDepthAndStencil || this.pickUtilitySceneFirst)
        n && n.hit && (i.skipOnPointerObservable || this.utilityLayerScene.onPointerObservable.notifyObservers(new Ct(i.type, i.event, n), i.type), i.skipOnPointerObservable = !0);
      else {
        const o = r(e), l = i.event;
        o && n && (n.distance === 0 && o.pickedMesh ? this.mainSceneTrackerPredicate && this.mainSceneTrackerPredicate(o.pickedMesh) ? (this._notifyObservers(i, o, l), i.skipOnPointerObservable = !0) : i.type === ie.POINTERDOWN ? this._pointerCaptures[l.pointerId] = !0 : (i.type === ie.POINTERMOVE || i.type === ie.POINTERUP) && (this._lastPointerEvents[l.pointerId] && (this.onPointerOutObservable.notifyObservers(l.pointerId), delete this._lastPointerEvents[l.pointerId]), this._notifyObservers(i, o, l)) : !this._pointerCaptures[l.pointerId] && (n.distance < o.distance || o.distance === 0) ? (this._notifyObservers(i, n, l), i.skipOnPointerObservable || (i.skipOnPointerObservable = n.distance > 0)) : !this._pointerCaptures[l.pointerId] && n.distance >= o.distance && (this.mainSceneTrackerPredicate && this.mainSceneTrackerPredicate(o.pickedMesh) ? (this._notifyObservers(i, o, l), i.skipOnPointerObservable = !0) : ((i.type === ie.POINTERMOVE || i.type === ie.POINTERUP) && this._lastPointerEvents[l.pointerId] && (this.onPointerOutObservable.notifyObservers(l.pointerId), delete this._lastPointerEvents[l.pointerId]), this._notifyObservers(i, n, l))), i.type === ie.POINTERUP && this._pointerCaptures[l.pointerId] && (this._pointerCaptures[l.pointerId] = !1));
      }
    }), this._originalPointerObserver && e.onPrePointerObservable.makeObserverTopPriority(this._originalPointerObserver)), this.utilityLayerScene.autoClear = !1, this._afterRenderObserver = this.originalScene.onAfterRenderCameraObservable.add((i) => {
      this.shouldRender && i == this.getRenderCamera() && this.render();
    }), this._sceneDisposeObserver = this.originalScene.onDisposeObservable.add(() => {
      this.dispose();
    }), this._updateCamera();
  }
  _notifyObservers(e, t, i) {
    e.skipOnPointerObservable || (this.utilityLayerScene.onPointerObservable.notifyObservers(new Ct(e.type, e.event, t), e.type), this._lastPointerEvents[i.pointerId] = !0);
  }
  /**
   * Renders the utility layers scene on top of the original scene
   */
  render() {
    if (this._updateCamera(), this.utilityLayerScene.activeCamera) {
      const e = this.utilityLayerScene.activeCamera.getScene(), t = this.utilityLayerScene.activeCamera;
      t._scene = this.utilityLayerScene, t.leftCamera && (t.leftCamera._scene = this.utilityLayerScene), t.rightCamera && (t.rightCamera._scene = this.utilityLayerScene), this.utilityLayerScene.render(!1), t._scene = e, t.leftCamera && (t.leftCamera._scene = e), t.rightCamera && (t.rightCamera._scene = e);
    }
  }
  /**
   * Disposes of the renderer
   */
  dispose() {
    this.onPointerOutObservable.clear(), this._afterRenderObserver && this.originalScene.onAfterCameraRenderObservable.remove(this._afterRenderObserver), this._sceneDisposeObserver && this.originalScene.onDisposeObservable.remove(this._sceneDisposeObserver), this._originalPointerObserver && this.originalScene.onPrePointerObservable.remove(this._originalPointerObserver), this.utilityLayerScene.dispose();
  }
  _updateCamera() {
    this.utilityLayerScene.cameraToUseForPointers = this.getRenderCamera(), this.utilityLayerScene.activeCamera = this.getRenderCamera();
  }
}
w._DefaultUtilityLayer = null;
w._DefaultKeepDepthUtilityLayer = null;
class ge extends ft {
  /**
   * constructs a new background remover module
   * @param _xrSessionManager the session manager for this module
   * @param _options read-only options to be used in this module
   */
  constructor(e, t) {
    super(e), this._options = t, this._attachController = (i) => {
      if (this._controllers[i.uniqueId])
        return;
      const { laserPointer: s, selectionMesh: r } = this._generateNewMeshPair(this._options.forceGripIfAvailable && i.grip ? i.grip : i.pointer);
      switch (this._controllers[i.uniqueId] = {
        xrController: i,
        laserPointer: s,
        selectionMesh: r,
        meshUnderPointer: null,
        pick: null,
        tmpRay: new De(new C(), new C()),
        disabledByNearInteraction: !1,
        id: ge._IdCounter++
      }, this._attachedController ? !this._options.enablePointerSelectionOnAllControllers && this._options.preferredHandedness && i.inputSource.handedness === this._options.preferredHandedness && (this._attachedController = i.uniqueId) : this._options.enablePointerSelectionOnAllControllers || (this._attachedController = i.uniqueId), i.inputSource.targetRayMode) {
        case "tracked-pointer":
          return this._attachTrackedPointerRayMode(i);
        case "gaze":
          return this._attachGazeMode(i);
        case "screen":
        case "transient-pointer":
          return this._attachScreenRayMode(i);
      }
    }, this._controllers = {}, this._tmpVectorForPickCompare = new C(), this.disablePointerLighting = !0, this.disableSelectionMeshLighting = !0, this.displayLaserPointer = !0, this.displaySelectionMesh = !0, this.laserPointerPickedColor = new U(0.9, 0.9, 0.9), this.laserPointerDefaultColor = new U(0.7, 0.7, 0.7), this.selectionMeshDefaultColor = new U(0.8, 0.8, 0.8), this.selectionMeshPickedColor = new U(0.3, 0.3, 1), this._identityMatrix = ce.Identity(), this._screenCoordinatesRef = C.Zero(), this._viewportRef = new Mt(0, 0, 0, 0), this._scene = this._xrSessionManager.scene, this._options.lookAndPickMode === void 0 && (this._scene.getEngine()._badDesktopOS || this._scene.getEngine()._badOS) && (this._options.lookAndPickMode = !0), this._options.lookAndPickMode && (this._options.enablePointerSelectionOnAllControllers = !0, this.displayLaserPointer = !1);
  }
  /**
   * attach this feature
   * Will usually be called by the features manager
   *
   * @returns true if successful.
   */
  attach() {
    if (!super.attach())
      return !1;
    if (this._options.xrInput.controllers.forEach(this._attachController), this._addNewAttachObserver(this._options.xrInput.onControllerAddedObservable, this._attachController, !0), this._addNewAttachObserver(this._options.xrInput.onControllerRemovedObservable, (e) => {
      this._detachController(e.uniqueId);
    }, !0), this._scene.constantlyUpdateMeshUnderPointer = !0, this._options.gazeCamera) {
      const e = this._options.gazeCamera, { laserPointer: t, selectionMesh: i } = this._generateNewMeshPair(e);
      this._controllers.camera = {
        webXRCamera: e,
        laserPointer: t,
        selectionMesh: i,
        meshUnderPointer: null,
        pick: null,
        tmpRay: new De(new C(), new C()),
        disabledByNearInteraction: !1,
        id: ge._IdCounter++
      }, this._attachGazeMode();
    }
    return !0;
  }
  /**
   * detach this feature.
   * Will usually be called by the features manager
   *
   * @returns true if successful.
   */
  detach() {
    return super.detach() ? (Object.keys(this._controllers).forEach((e) => {
      this._detachController(e);
    }), !0) : !1;
  }
  /**
   * Will get the mesh under a specific pointer.
   * `scene.meshUnderPointer` will only return one mesh - either left or right.
   * @param controllerId the controllerId to check
   * @returns The mesh under pointer or null if no mesh is under the pointer
   */
  getMeshUnderPointer(e) {
    return this._controllers[e] ? this._controllers[e].meshUnderPointer : null;
  }
  /**
   * Get the xr controller that correlates to the pointer id in the pointer event
   *
   * @param id the pointer id to search for
   * @returns the controller that correlates to this id or null if not found
   */
  getXRControllerByPointerId(e) {
    const t = Object.keys(this._controllers);
    for (let i = 0; i < t.length; ++i)
      if (this._controllers[t[i]].id === e)
        return this._controllers[t[i]].xrController || null;
    return null;
  }
  /**
   * @internal
   */
  _getPointerSelectionDisabledByPointerId(e) {
    const t = Object.keys(this._controllers);
    for (let i = 0; i < t.length; ++i)
      if (this._controllers[t[i]].id === e)
        return this._controllers[t[i]].disabledByNearInteraction;
    return !0;
  }
  /**
   * @internal
   */
  _setPointerSelectionDisabledByPointerId(e, t) {
    const i = Object.keys(this._controllers);
    for (let s = 0; s < i.length; ++s)
      if (this._controllers[i[s]].id === e) {
        this._controllers[i[s]].disabledByNearInteraction = t;
        return;
      }
  }
  _onXRFrame(e) {
    Object.keys(this._controllers).forEach((t) => {
      const i = this._controllers[t];
      if (this._options.lookAndPickMode && i.xrController?.inputSource.targetRayMode !== "transient-pointer")
        return;
      if (!this._options.enablePointerSelectionOnAllControllers && t !== this._attachedController || i.disabledByNearInteraction) {
        i.selectionMesh.isVisible = !1, i.laserPointer.isVisible = !1, i.pick = null;
        return;
      }
      i.laserPointer.isVisible = this.displayLaserPointer;
      let s;
      if (i.xrController)
        s = this._options.forceGripIfAvailable && i.xrController.grip ? i.xrController.grip.position : i.xrController.pointer.position, i.xrController.getWorldPointerRayToRef(i.tmpRay, this._options.forceGripIfAvailable);
      else if (i.webXRCamera)
        s = i.webXRCamera.position, i.webXRCamera.getForwardRayToRef(i.tmpRay);
      else
        return;
      if (this._options.maxPointerDistance && (i.tmpRay.length = this._options.maxPointerDistance), !this._options.disableScenePointerVectorUpdate && s) {
        const l = this._xrSessionManager.scene, h = this._options.xrInput.xrCamera;
        h && (h.viewport.toGlobalToRef(l.getEngine().getRenderWidth() / h.rigCameras.length, l.getEngine().getRenderHeight(), this._viewportRef), C.ProjectToRef(s, this._identityMatrix, h.getTransformationMatrix(), this._viewportRef, this._screenCoordinatesRef), typeof this._screenCoordinatesRef.x == "number" && typeof this._screenCoordinatesRef.y == "number" && !isNaN(this._screenCoordinatesRef.x) && !isNaN(this._screenCoordinatesRef.y) && this._screenCoordinatesRef.x !== 1 / 0 && this._screenCoordinatesRef.y !== 1 / 0 && (l.pointerX = this._screenCoordinatesRef.x, l.pointerY = this._screenCoordinatesRef.y, i.screenCoordinates = {
          x: this._screenCoordinatesRef.x,
          y: this._screenCoordinatesRef.y
        }));
      }
      let r = null;
      this._utilityLayerScene && (r = this._utilityLayerScene.pickWithRay(i.tmpRay, this._utilityLayerScene.pointerMovePredicate || this.raySelectionPredicate));
      const n = this._scene.pickWithRay(i.tmpRay, this._scene.pointerMovePredicate || this.raySelectionPredicate);
      !r || !r.hit ? i.pick = n : !n || !n.hit || r.distance < n.distance ? i.pick = r : i.pick = n, i.pick && i.xrController && (i.pick.aimTransform = i.xrController.pointer, i.pick.gripTransform = i.xrController.grip || null, i.pick.originMesh = i.xrController.pointer);
      const o = i.pick;
      if (o && o.pickedPoint && o.hit) {
        this._updatePointerDistance(i.laserPointer, o.distance), i.selectionMesh.position.copyFrom(o.pickedPoint), i.selectionMesh.scaling.x = Math.sqrt(o.distance), i.selectionMesh.scaling.y = Math.sqrt(o.distance), i.selectionMesh.scaling.z = Math.sqrt(o.distance);
        const l = this._convertNormalToDirectionOfRay(o.getNormal(!0), i.tmpRay), h = 1e-3;
        if (i.selectionMesh.position.copyFrom(o.pickedPoint), l) {
          const c = C.Cross(ct.Y, l), d = C.Cross(l, c);
          C.RotationFromAxisToRef(d, l, c, i.selectionMesh.rotation), i.selectionMesh.position.addInPlace(l.scale(h));
        }
        i.selectionMesh.isVisible = this.displaySelectionMesh, i.meshUnderPointer = o.pickedMesh;
      } else
        i.selectionMesh.isVisible = !1, this._updatePointerDistance(i.laserPointer, 1), i.meshUnderPointer = null;
    });
  }
  get _utilityLayerScene() {
    return this._options.customUtilityLayerScene || w.DefaultUtilityLayer.utilityLayerScene;
  }
  _attachGazeMode(e) {
    const t = this._controllers[e && e.uniqueId || "camera"], i = this._options.timeToSelect || 3e3, s = this._options.useUtilityLayer ? this._utilityLayerScene : this._scene;
    let r = new Me();
    const n = xt("selection", {
      diameter: 35e-4 * 15,
      thickness: 25e-4 * 6,
      tessellation: 20
    }, s);
    n.isVisible = !1, n.isPickable = !1, n.parent = t.selectionMesh;
    let o = 0, l = !1;
    const h = {
      pointerId: t.id,
      pointerType: "xr"
    };
    t.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
      if (t.pick) {
        if (this._augmentPointerInit(h, t.id, t.screenCoordinates), t.laserPointer.material.alpha = 0, n.isVisible = !1, t.pick.hit)
          if (this._pickingMoved(r, t.pick))
            l && (this._options.disablePointerUpOnTouchOut || this._scene.simulatePointerUp(t.pick, h)), l = !1, o = 0;
          else if (o > i / 10 && (n.isVisible = !0), o += this._scene.getEngine().getDeltaTime(), o >= i)
            this._scene.simulatePointerDown(t.pick, h), l = !0, this._options.disablePointerUpOnTouchOut && this._scene.simulatePointerUp(t.pick, h), n.isVisible = !1;
          else {
            const c = 1 - o / i;
            n.scaling.set(c, c, c);
          }
        else
          l = !1, o = 0;
        this._scene.simulatePointerMove(t.pick, h), r = t.pick;
      }
    }), this._options.renderingGroupId !== void 0 && (n.renderingGroupId = this._options.renderingGroupId), e && e.onDisposeObservable.addOnce(() => {
      t.pick && !this._options.disablePointerUpOnTouchOut && l && (this._scene.simulatePointerUp(t.pick, h), t.finalPointerUpTriggered = !0), n.dispose();
    });
  }
  _attachScreenRayMode(e) {
    const t = this._controllers[e.uniqueId];
    let i = !1;
    const s = {
      pointerId: t.id,
      pointerType: "xr"
    };
    t.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
      this._augmentPointerInit(s, t.id, t.screenCoordinates), !(!t.pick || this._options.disablePointerUpOnTouchOut && i) && (i ? this._scene.simulatePointerMove(t.pick, s) : (this._scene.simulatePointerDown(t.pick, s), t.pointerDownTriggered = !0, i = !0, this._options.disablePointerUpOnTouchOut && this._scene.simulatePointerUp(t.pick, s)));
    }), e.onDisposeObservable.addOnce(() => {
      this._augmentPointerInit(s, t.id, t.screenCoordinates), this._xrSessionManager.runInXRFrame(() => {
        t.pick && !t.finalPointerUpTriggered && i && !this._options.disablePointerUpOnTouchOut && (this._scene.simulatePointerUp(t.pick, s), t.finalPointerUpTriggered = !0);
      });
    });
  }
  _attachTrackedPointerRayMode(e) {
    const t = this._controllers[e.uniqueId];
    if (this._options.forceGazeMode)
      return this._attachGazeMode(e);
    const i = {
      pointerId: t.id,
      pointerType: "xr"
    };
    if (t.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
      t.laserPointer.material.disableLighting = this.disablePointerLighting, t.selectionMesh.material.disableLighting = this.disableSelectionMeshLighting, t.pick && (this._augmentPointerInit(i, t.id, t.screenCoordinates), this._scene.simulatePointerMove(t.pick, i));
    }), e.inputSource.gamepad) {
      const s = (r) => {
        this._options.overrideButtonId && (t.selectionComponent = r.getComponent(this._options.overrideButtonId)), t.selectionComponent || (t.selectionComponent = r.getMainComponent()), t.onButtonChangedObserver = t.selectionComponent.onButtonStateChangedObservable.add((n) => {
          if (n.changes.pressed) {
            const o = n.changes.pressed.current;
            if (t.pick)
              (this._options.enablePointerSelectionOnAllControllers || e.uniqueId === this._attachedController) && (this._augmentPointerInit(i, t.id, t.screenCoordinates), o ? (this._scene.simulatePointerDown(t.pick, i), t.pointerDownTriggered = !0, t.selectionMesh.material.emissiveColor = this.selectionMeshPickedColor, t.laserPointer.material.emissiveColor = this.laserPointerPickedColor) : (this._scene.simulatePointerUp(t.pick, i), t.selectionMesh.material.emissiveColor = this.selectionMeshDefaultColor, t.laserPointer.material.emissiveColor = this.laserPointerDefaultColor));
            else if (o && !this._options.enablePointerSelectionOnAllControllers && !this._options.disableSwitchOnClick) {
              const l = this._controllers[this._attachedController];
              l && l.pointerDownTriggered && !l.finalPointerUpTriggered && (this._augmentPointerInit(i, l.id, l.screenCoordinates), this._scene.simulatePointerUp(new Me(), {
                pointerId: l.id,
                pointerType: "xr"
              }), l.finalPointerUpTriggered = !0), this._attachedController = e.uniqueId;
            }
          }
        });
      };
      e.motionController ? s(e.motionController) : e.onMotionControllerInitObservable.add(s);
    } else {
      const s = (n) => {
        this._xrSessionManager.onXRFrameObservable.addOnce(() => {
          this._augmentPointerInit(i, t.id, t.screenCoordinates), t.xrController && n.inputSource === t.xrController.inputSource && t.pick && (this._scene.simulatePointerDown(t.pick, i), t.pointerDownTriggered = !0, t.selectionMesh.material.emissiveColor = this.selectionMeshPickedColor, t.laserPointer.material.emissiveColor = this.laserPointerPickedColor);
        });
      }, r = (n) => {
        this._xrSessionManager.onXRFrameObservable.addOnce(() => {
          this._augmentPointerInit(i, t.id, t.screenCoordinates), t.xrController && n.inputSource === t.xrController.inputSource && t.pick && (this._scene.simulatePointerUp(t.pick, i), t.selectionMesh.material.emissiveColor = this.selectionMeshDefaultColor, t.laserPointer.material.emissiveColor = this.laserPointerDefaultColor);
        });
      };
      t.eventListeners = {
        selectend: r,
        selectstart: s
      }, this._xrSessionManager.session.addEventListener("selectstart", s), this._xrSessionManager.session.addEventListener("selectend", r);
    }
  }
  _convertNormalToDirectionOfRay(e, t) {
    return e && Math.acos(C.Dot(e, t.direction)) < Math.PI / 2 && e.scaleInPlace(-1), e;
  }
  _detachController(e) {
    const t = this._controllers[e];
    if (t) {
      if (t.selectionComponent && t.onButtonChangedObserver && t.selectionComponent.onButtonStateChangedObservable.remove(t.onButtonChangedObserver), t.onFrameObserver && this._xrSessionManager.onXRFrameObservable.remove(t.onFrameObserver), t.eventListeners && Object.keys(t.eventListeners).forEach((i) => {
        const s = t.eventListeners && t.eventListeners[i];
        s && this._xrSessionManager.session.removeEventListener(i, s);
      }), !t.finalPointerUpTriggered && t.pointerDownTriggered) {
        const i = {
          pointerId: t.id,
          pointerType: "xr"
        };
        this._xrSessionManager.runInXRFrame(() => {
          this._augmentPointerInit(i, t.id, t.screenCoordinates), this._scene.simulatePointerUp(t.pick || new Me(), i), t.finalPointerUpTriggered = !0;
        });
      }
      this._xrSessionManager.scene.onBeforeRenderObservable.addOnce(() => {
        try {
          if (t.selectionMesh.dispose(), t.laserPointer.dispose(), delete this._controllers[e], this._attachedController === e) {
            const i = Object.keys(this._controllers);
            i.length ? this._attachedController = i[0] : this._attachedController = "";
          }
        } catch {
          B.Warn("controller already detached.");
        }
      });
    }
  }
  _generateNewMeshPair(e) {
    const t = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || w.DefaultUtilityLayer.utilityLayerScene : this._scene, i = this._options.customLasterPointerMeshGenerator ? this._options.customLasterPointerMeshGenerator() : vi("laserPointer", {
      height: 1,
      diameterTop: 2e-4,
      diameterBottom: 4e-3,
      tessellation: 20,
      subdivisions: 1
    }, t);
    i.parent = e;
    const s = new Le("laserPointerMat", t);
    s.emissiveColor = this.laserPointerDefaultColor, s.alpha = 0.7, i.material = s, i.rotation.x = Math.PI / 2, this._updatePointerDistance(i, 1), i.isPickable = !1, i.isVisible = !1;
    const r = this._options.customSelectionMeshGenerator ? this._options.customSelectionMeshGenerator() : xt("gazeTracker", {
      diameter: 35e-4 * 3,
      thickness: 25e-4 * 3,
      tessellation: 20
    }, t);
    r.bakeCurrentTransformIntoVertices(), r.isPickable = !1, r.isVisible = !1;
    const n = new Le("targetMat", t);
    return n.specularColor = U.Black(), n.emissiveColor = this.selectionMeshDefaultColor, n.backFaceCulling = !1, r.material = n, this._options.renderingGroupId !== void 0 && (i.renderingGroupId = this._options.renderingGroupId, r.renderingGroupId = this._options.renderingGroupId), {
      laserPointer: i,
      selectionMesh: r
    };
  }
  _pickingMoved(e, t) {
    if (!e.hit || !t.hit || !e.pickedMesh || !e.pickedPoint || !t.pickedMesh || !t.pickedPoint || e.pickedMesh !== t.pickedMesh)
      return !0;
    e.pickedPoint?.subtractToRef(t.pickedPoint, this._tmpVectorForPickCompare), this._tmpVectorForPickCompare.set(Math.abs(this._tmpVectorForPickCompare.x), Math.abs(this._tmpVectorForPickCompare.y), Math.abs(this._tmpVectorForPickCompare.z));
    const i = (this._options.gazeModePointerMovedFactor || 1) * 0.01 * t.distance;
    return this._tmpVectorForPickCompare.length() > i;
  }
  _updatePointerDistance(e, t = 100) {
    e.scaling.y = t, this._scene.useRightHandedSystem && (t *= -1), e.position.z = t / 2 + 0.05;
  }
  _augmentPointerInit(e, t, i) {
    e.pointerId = t, e.pointerType = "xr", i && (e.screenX = i.x, e.screenY = i.y);
  }
  /** @internal */
  get lasterPointerDefaultColor() {
    return this.laserPointerDefaultColor;
  }
}
ge._IdCounter = 200;
ge.Name = N.POINTER_SELECTION;
ge.Version = 1;
he.AddWebXRFeature(ge.Name, (a, e) => () => new ge(a, e), ge.Version, !0);
var u;
(function(a) {
  a[a.Float = 1] = "Float", a[a.Int = 2] = "Int", a[a.Vector2 = 4] = "Vector2", a[a.Vector3 = 8] = "Vector3", a[a.Vector4 = 16] = "Vector4", a[a.Color3 = 32] = "Color3", a[a.Color4 = 64] = "Color4", a[a.Matrix = 128] = "Matrix", a[a.Object = 256] = "Object", a[a.AutoDetect = 1024] = "AutoDetect", a[a.BasedOnInput = 2048] = "BasedOnInput", a[a.All = 4095] = "All";
})(u || (u = {}));
var p;
(function(a) {
  a[a.Vertex = 1] = "Vertex", a[a.Fragment = 2] = "Fragment", a[a.Neutral = 4] = "Neutral", a[a.VertexAndFragment = 3] = "VertexAndFragment";
})(p || (p = {}));
class ui {
  constructor() {
    this.supportUniformBuffers = !1, this.attributes = [], this.uniforms = [], this.constants = [], this.samplers = [], this.functions = {}, this.extensions = {}, this.prePassOutput = {}, this.counters = {}, this._attributeDeclaration = "", this._uniformDeclaration = "", this._constantDeclaration = "", this._samplerDeclaration = "", this._varyingTransfer = "", this._injectAtEnd = "", this._repeatableContentAnchorIndex = 0, this._builtCompilationString = "", this.compilationString = "";
  }
  /**
   * Finalize the compilation strings
   * @param state defines the current compilation state
   */
  finalize(e) {
    const t = e.sharedData.emitComments, i = this.target === p.Fragment;
    this.compilationString = `
${t ? `//Entry point
` : ""}void main(void) {
${this.compilationString}`, this._constantDeclaration && (this.compilationString = `
${t ? `//Constants
` : ""}${this._constantDeclaration}
${this.compilationString}`);
    let s = "";
    for (const r in this.functions)
      s += this.functions[r] + `
`;
    this.compilationString = `
${s}
${this.compilationString}`, !i && this._varyingTransfer && (this.compilationString = `${this.compilationString}
${this._varyingTransfer}`), this._injectAtEnd && (this.compilationString = `${this.compilationString}
${this._injectAtEnd}`), this.compilationString = `${this.compilationString}
}`, this.sharedData.varyingDeclaration && (this.compilationString = `
${t ? `//Varyings
` : ""}${this.sharedData.varyingDeclaration}
${this.compilationString}`), this._samplerDeclaration && (this.compilationString = `
${t ? `//Samplers
` : ""}${this._samplerDeclaration}
${this.compilationString}`), this._uniformDeclaration && (this.compilationString = `
${t ? `//Uniforms
` : ""}${this._uniformDeclaration}
${this.compilationString}`), this._attributeDeclaration && !i && (this.compilationString = `
${t ? `//Attributes
` : ""}${this._attributeDeclaration}
${this.compilationString}`), this.compilationString = `precision highp float;
` + this.compilationString, this.compilationString = `#if defined(WEBGL2) || defined(WEBGPU)
precision highp sampler2DArray;
#endif
` + this.compilationString, i && (this.compilationString = `#if defined(PREPASS)\r
#extension GL_EXT_draw_buffers : require\r
layout(location = 0) out highp vec4 glFragData[SCENE_MRT_COUNT];\r
highp vec4 gl_FragColor;\r
#endif\r
` + this.compilationString);
    for (const r in this.extensions) {
      const n = this.extensions[r];
      this.compilationString = `
${n}
${this.compilationString}`;
    }
    this._builtCompilationString = this.compilationString;
  }
  /** @internal */
  get _repeatableContentAnchor() {
    return `###___ANCHOR${this._repeatableContentAnchorIndex++}___###`;
  }
  /**
   * @internal
   */
  _getFreeVariableName(e) {
    return e = e.replace(/[^a-zA-Z_]+/g, ""), this.sharedData.variableNames[e] === void 0 ? (this.sharedData.variableNames[e] = 0, e === "output" || e === "texture" ? e + this.sharedData.variableNames[e] : e) : (this.sharedData.variableNames[e]++, e + this.sharedData.variableNames[e]);
  }
  /**
   * @internal
   */
  _getFreeDefineName(e) {
    return this.sharedData.defineNames[e] === void 0 ? this.sharedData.defineNames[e] = 0 : this.sharedData.defineNames[e]++, e + this.sharedData.defineNames[e];
  }
  /**
   * @internal
   */
  _excludeVariableName(e) {
    this.sharedData.variableNames[e] = 0;
  }
  /**
   * @internal
   */
  _emit2DSampler(e) {
    this.samplers.indexOf(e) < 0 && (this._samplerDeclaration += `uniform sampler2D ${e};
`, this.samplers.push(e));
  }
  /**
   * @internal
   */
  _emit2DArraySampler(e) {
    this.samplers.indexOf(e) < 0 && (this._samplerDeclaration += `uniform sampler2DArray ${e};
`, this.samplers.push(e));
  }
  /**
   * @internal
   */
  _getGLType(e) {
    switch (e) {
      case u.Float:
        return "float";
      case u.Int:
        return "int";
      case u.Vector2:
        return "vec2";
      case u.Color3:
      case u.Vector3:
        return "vec3";
      case u.Color4:
      case u.Vector4:
        return "vec4";
      case u.Matrix:
        return "mat4";
    }
    return "";
  }
  /**
   * @internal
   */
  _emitExtension(e, t, i = "") {
    this.extensions[e] || (i && (t = `#if ${i}
${t}
#endif`), this.extensions[e] = t);
  }
  /**
   * @internal
   */
  _emitFunction(e, t, i) {
    this.functions[e] || (this.sharedData.emitComments && (t = i + `
` + t), this.functions[e] = t);
  }
  /**
   * @internal
   */
  _emitCodeFromInclude(e, t, i) {
    if (i && i.repeatKey)
      return `#include<${e}>${i.substitutionVars ? "(" + i.substitutionVars + ")" : ""}[0..${i.repeatKey}]
`;
    let s = ne.IncludesShadersStore[e] + `
`;
    if (this.sharedData.emitComments && (s = t + `
` + s), !i)
      return s;
    if (i.replaceStrings)
      for (let r = 0; r < i.replaceStrings.length; r++) {
        const n = i.replaceStrings[r];
        s = s.replace(n.search, n.replace);
      }
    return s;
  }
  /**
   * @internal
   */
  _emitFunctionFromInclude(e, t, i, s = "") {
    const r = e + s;
    if (!this.functions[r]) {
      if (!i || !i.removeAttributes && !i.removeUniforms && !i.removeVaryings && !i.removeIfDef && !i.replaceStrings) {
        i && i.repeatKey ? this.functions[r] = `#include<${e}>${i.substitutionVars ? "(" + i.substitutionVars + ")" : ""}[0..${i.repeatKey}]
` : this.functions[r] = `#include<${e}>${i?.substitutionVars ? "(" + i?.substitutionVars + ")" : ""}
`, this.sharedData.emitComments && (this.functions[r] = t + `
` + this.functions[r]);
        return;
      }
      if (this.functions[r] = ne.IncludesShadersStore[e], this.sharedData.emitComments && (this.functions[r] = t + `
` + this.functions[r]), i.removeIfDef && (this.functions[r] = this.functions[r].replace(/^\s*?#ifdef.+$/gm, ""), this.functions[r] = this.functions[r].replace(/^\s*?#endif.*$/gm, ""), this.functions[r] = this.functions[r].replace(/^\s*?#else.*$/gm, ""), this.functions[r] = this.functions[r].replace(/^\s*?#elif.*$/gm, "")), i.removeAttributes && (this.functions[r] = this.functions[r].replace(/\s*?attribute .+?;/g, `
`)), i.removeUniforms && (this.functions[r] = this.functions[r].replace(/\s*?uniform .*?;/g, `
`)), i.removeVaryings && (this.functions[r] = this.functions[r].replace(/\s*?(varying|in) .+?;/g, `
`)), i.replaceStrings)
        for (let n = 0; n < i.replaceStrings.length; n++) {
          const o = i.replaceStrings[n];
          this.functions[r] = this.functions[r].replace(o.search, o.replace);
        }
    }
  }
  /**
   * @internal
   */
  _registerTempVariable(e) {
    return this.sharedData.temps.indexOf(e) !== -1 ? !1 : (this.sharedData.temps.push(e), !0);
  }
  /**
   * @internal
   */
  _emitVaryingFromString(e, t, i = "", s = !1) {
    return this.sharedData.varyings.indexOf(e) !== -1 ? !1 : (this.sharedData.varyings.push(e), i && (i.startsWith("defined(") ? this.sharedData.varyingDeclaration += `#if ${i}
` : this.sharedData.varyingDeclaration += `${s ? "#ifndef" : "#ifdef"} ${i}
`), this.sharedData.varyingDeclaration += `varying ${t} ${e};
`, i && (this.sharedData.varyingDeclaration += `#endif
`), !0);
  }
  /**
   * @internal
   */
  _emitUniformFromString(e, t, i = "", s = !1) {
    this.uniforms.indexOf(e) === -1 && (this.uniforms.push(e), i && (i.startsWith("defined(") ? this._uniformDeclaration += `#if ${i}
` : this._uniformDeclaration += `${s ? "#ifndef" : "#ifdef"} ${i}
`), this._uniformDeclaration += `uniform ${t} ${e};
`, i && (this._uniformDeclaration += `#endif
`));
  }
  /**
   * @internal
   */
  _emitFloat(e) {
    return e.toString() === e.toFixed(0) ? `${e}.0` : e.toString();
  }
}
class cr {
  /** Creates a new shared data */
  constructor() {
    this.temps = [], this.varyings = [], this.varyingDeclaration = "", this.inputBlocks = [], this.textureBlocks = [], this.bindableBlocks = [], this.forcedBindableBlocks = [], this.blocksWithFallbacks = [], this.blocksWithDefines = [], this.repeatableContentBlocks = [], this.dynamicUniformBlocks = [], this.blockingBlocks = [], this.animatedInputs = [], this.variableNames = {}, this.defineNames = {}, this.hints = {
      needWorldViewMatrix: !1,
      needWorldViewProjectionMatrix: !1,
      needAlphaBlending: !1,
      needAlphaTesting: !1
    }, this.checks = {
      emitVertex: !1,
      emitFragment: !1,
      notConnectedNonOptionalInputs: new Array()
    }, this.allowEmptyVertexProgram = !1, this.variableNames.position = 0, this.variableNames.normal = 0, this.variableNames.tangent = 0, this.variableNames.uv = 0, this.variableNames.uv2 = 0, this.variableNames.uv3 = 0, this.variableNames.uv4 = 0, this.variableNames.uv5 = 0, this.variableNames.uv6 = 0, this.variableNames.color = 0, this.variableNames.matricesIndices = 0, this.variableNames.matricesWeights = 0, this.variableNames.matricesIndicesExtra = 0, this.variableNames.matricesWeightsExtra = 0, this.variableNames.diffuseBase = 0, this.variableNames.specularBase = 0, this.variableNames.worldPos = 0, this.variableNames.shadow = 0, this.variableNames.view = 0, this.variableNames.vTBN = 0, this.defineNames.MAINUV0 = 0, this.defineNames.MAINUV1 = 0, this.defineNames.MAINUV2 = 0, this.defineNames.MAINUV3 = 0, this.defineNames.MAINUV4 = 0, this.defineNames.MAINUV5 = 0, this.defineNames.MAINUV6 = 0, this.defineNames.MAINUV7 = 0;
  }
  /**
   * Emits console errors and exceptions if there is a failing check
   */
  emitErrors() {
    let e = "";
    !this.checks.emitVertex && !this.allowEmptyVertexProgram && (e += `NodeMaterial does not have a vertex output. You need to at least add a block that generates a glPosition value.
`), this.checks.emitFragment || (e += `NodeMaterial does not have a fragment output. You need to at least add a block that generates a glFragColor value.
`);
    for (const t of this.checks.notConnectedNonOptionalInputs)
      e += `input ${t.name} from block ${t.ownerBlock.name}[${t.ownerBlock.getClassName()}] is not connected and is not optional.
`;
    if (e)
      throw `Build of NodeMaterial failed:
` + e;
  }
}
var de;
(function(a) {
  a[a.Compatible = 0] = "Compatible", a[a.TypeIncompatible = 1] = "TypeIncompatible", a[a.TargetIncompatible = 2] = "TargetIncompatible", a[a.HierarchyIssue = 3] = "HierarchyIssue";
})(de || (de = {}));
var Ke;
(function(a) {
  a[a.Input = 0] = "Input", a[a.Output = 1] = "Output";
})(Ke || (Ke = {}));
class Ze {
  /**
   * Checks if two types are equivalent
   * @param type1 type 1 to check
   * @param type2 type 2 to check
   * @returns true if both types are equivalent, else false
   */
  static AreEquivalentTypes(e, t) {
    switch (e) {
      case u.Vector3: {
        if (t === u.Color3)
          return !0;
        break;
      }
      case u.Vector4: {
        if (t === u.Color4)
          return !0;
        break;
      }
      case u.Color3: {
        if (t === u.Vector3)
          return !0;
        break;
      }
      case u.Color4: {
        if (t === u.Vector4)
          return !0;
        break;
      }
    }
    return !1;
  }
  /** Gets the direction of the point */
  get direction() {
    return this._direction;
  }
  /**
   * Gets or sets the associated variable name in the shader
   */
  get associatedVariableName() {
    return this._ownerBlock.isInput ? this._ownerBlock.associatedVariableName : (!this._enforceAssociatedVariableName || !this._associatedVariableName) && this._connectedPoint ? this._connectedPoint.associatedVariableName : this._associatedVariableName;
  }
  set associatedVariableName(e) {
    this._associatedVariableName = e;
  }
  /** Get the inner type (ie AutoDetect for instance instead of the inferred one) */
  get innerType() {
    return this._linkedConnectionSource && this._linkedConnectionSource.isConnected ? this.type : this._type;
  }
  /**
   * Gets or sets the connection point type (default is float)
   */
  get type() {
    if (this._type === u.AutoDetect) {
      if (this._ownerBlock.isInput)
        return this._ownerBlock.type;
      if (this._connectedPoint)
        return this._connectedPoint.type;
      if (this._linkedConnectionSource && this._linkedConnectionSource.isConnected)
        return this._linkedConnectionSource.type;
    }
    if (this._type === u.BasedOnInput) {
      if (this._typeConnectionSource)
        return !this._typeConnectionSource.isConnected && this._defaultConnectionPointType ? this._defaultConnectionPointType : this._typeConnectionSource.type;
      if (this._defaultConnectionPointType)
        return this._defaultConnectionPointType;
    }
    return this._type;
  }
  set type(e) {
    this._type = e;
  }
  /** Gets or sets the target of that connection point */
  get target() {
    return !this._prioritizeVertex || !this._ownerBlock ? this._target : this._target !== p.VertexAndFragment ? this._target : this._ownerBlock.target === p.Fragment ? p.Fragment : p.Vertex;
  }
  set target(e) {
    this._target = e;
  }
  /**
   * Gets a boolean indicating that the current point is connected to another NodeMaterialBlock
   */
  get isConnected() {
    return this.connectedPoint !== null || this.hasEndpoints;
  }
  /**
   * Gets a boolean indicating that the current point is connected to an input block
   */
  get isConnectedToInputBlock() {
    return this.connectedPoint !== null && this.connectedPoint.ownerBlock.isInput;
  }
  /**
   * Gets a the connected input block (if any)
   */
  get connectInputBlock() {
    return this.isConnectedToInputBlock ? this.connectedPoint.ownerBlock : null;
  }
  /** Get the other side of the connection (if any) */
  get connectedPoint() {
    return this._connectedPoint;
  }
  /** Get the block that owns this connection point */
  get ownerBlock() {
    return this._ownerBlock;
  }
  /** Get the block connected on the other side of this connection (if any) */
  get sourceBlock() {
    return this._connectedPoint ? this._connectedPoint.ownerBlock : null;
  }
  /** Get the block connected on the endpoints of this connection (if any) */
  get connectedBlocks() {
    return this._endpoints.length === 0 ? [] : this._endpoints.map((e) => e.ownerBlock);
  }
  /** Gets the list of connected endpoints */
  get endpoints() {
    return this._endpoints;
  }
  /** Gets a boolean indicating if that output point is connected to at least one input */
  get hasEndpoints() {
    return this._endpoints && this._endpoints.length > 0;
  }
  /** Gets a boolean indicating that this connection has a path to the vertex output*/
  get isDirectlyConnectedToVertexOutput() {
    if (!this.hasEndpoints)
      return !1;
    for (const e of this._endpoints)
      if (e.ownerBlock.target === p.Vertex || (e.ownerBlock.target === p.Neutral || e.ownerBlock.target === p.VertexAndFragment) && e.ownerBlock.outputs.some((t) => t.isDirectlyConnectedToVertexOutput))
        return !0;
    return !1;
  }
  /** Gets a boolean indicating that this connection will be used in the vertex shader */
  get isConnectedInVertexShader() {
    if (this.target === p.Vertex)
      return !0;
    if (!this.hasEndpoints)
      return !1;
    for (const e of this._endpoints)
      if (e.ownerBlock.target === p.Vertex || e.target === p.Vertex || (e.ownerBlock.target === p.Neutral || e.ownerBlock.target === p.VertexAndFragment) && e.ownerBlock.outputs.some((t) => t.isConnectedInVertexShader))
        return !0;
    return !1;
  }
  /** Gets a boolean indicating that this connection will be used in the fragment shader */
  get isConnectedInFragmentShader() {
    if (this.target === p.Fragment)
      return !0;
    if (!this.hasEndpoints)
      return !1;
    for (const e of this._endpoints)
      if (e.ownerBlock.target === p.Fragment || (e.ownerBlock.target === p.Neutral || e.ownerBlock.target === p.VertexAndFragment) && e.ownerBlock.isConnectedInFragmentShader())
        return !0;
    return !1;
  }
  /**
   * Creates a block suitable to be used as an input for this input point.
   * If null is returned, a block based on the point type will be created.
   * @returns The returned string parameter is the name of the output point of NodeMaterialBlock (first parameter of the returned array) that can be connected to the input
   */
  createCustomInputBlock() {
    return null;
  }
  /**
   * Creates a new connection point
   * @param name defines the connection point name
   * @param ownerBlock defines the block hosting this connection point
   * @param direction defines the direction of the connection point
   */
  constructor(e, t, i) {
    this._connectedPoint = null, this._endpoints = new Array(), this._typeConnectionSource = null, this._defaultConnectionPointType = null, this._linkedConnectionSource = null, this._acceptedConnectionPointType = null, this._type = u.Float, this._enforceAssociatedVariableName = !1, this.needDualDirectionValidation = !1, this.acceptedConnectionPointTypes = [], this.excludedConnectionPointTypes = [], this.onConnectionObservable = new x(), this.onDisconnectionObservable = new x(), this.isExposedOnFrame = !1, this.exposedPortPosition = -1, this._prioritizeVertex = !1, this._target = p.VertexAndFragment, this._ownerBlock = t, this.name = e, this._direction = i;
  }
  /**
   * Gets the current class name e.g. "NodeMaterialConnectionPoint"
   * @returns the class name
   */
  getClassName() {
    return "NodeMaterialConnectionPoint";
  }
  /**
   * Gets a boolean indicating if the current point can be connected to another point
   * @param connectionPoint defines the other connection point
   * @returns a boolean
   */
  canConnectTo(e) {
    return this.checkCompatibilityState(e) === de.Compatible;
  }
  /**
   * Gets a number indicating if the current point can be connected to another point
   * @param connectionPoint defines the other connection point
   * @returns a number defining the compatibility state
   */
  checkCompatibilityState(e) {
    const t = this._ownerBlock, i = e.ownerBlock;
    if (t.target === p.Fragment) {
      if (i.target === p.Vertex)
        return de.TargetIncompatible;
      for (const n of i.outputs)
        if (n.ownerBlock.target != p.Neutral && n.isConnectedInVertexShader)
          return de.TargetIncompatible;
    }
    if (this.type !== e.type && e.innerType !== u.AutoDetect)
      return Ze.AreEquivalentTypes(this.type, e.type) || e.acceptedConnectionPointTypes && e.acceptedConnectionPointTypes.indexOf(this.type) !== -1 || e._acceptedConnectionPointType && Ze.AreEquivalentTypes(e._acceptedConnectionPointType.type, this.type) ? de.Compatible : de.TypeIncompatible;
    if (e.excludedConnectionPointTypes && e.excludedConnectionPointTypes.indexOf(this.type) !== -1)
      return de.TypeIncompatible;
    let s = i, r = t;
    return this.direction === Ke.Input && (s = t, r = i), s.isAnAncestorOf(r) ? de.HierarchyIssue : de.Compatible;
  }
  /**
   * Connect this point to another connection point
   * @param connectionPoint defines the other connection point
   * @param ignoreConstraints defines if the system will ignore connection type constraints (default is false)
   * @returns the current connection point
   */
  connectTo(e, t = !1) {
    if (!t && !this.canConnectTo(e))
      throw "Cannot connect these two connectors.";
    return this._endpoints.push(e), e._connectedPoint = this, this._enforceAssociatedVariableName = !1, this.onConnectionObservable.notifyObservers(e), e.onConnectionObservable.notifyObservers(this), this;
  }
  /**
   * Disconnect this point from one of his endpoint
   * @param endpoint defines the other connection point
   * @returns the current connection point
   */
  disconnectFrom(e) {
    const t = this._endpoints.indexOf(e);
    return t === -1 ? this : (this._endpoints.splice(t, 1), e._connectedPoint = null, this._enforceAssociatedVariableName = !1, e._enforceAssociatedVariableName = !1, this.onDisconnectionObservable.notifyObservers(e), e.onDisconnectionObservable.notifyObservers(this), this);
  }
  /**
   * Fill the list of excluded connection point types with all types other than those passed in the parameter
   * @param mask Types (ORed values of NodeMaterialBlockConnectionPointTypes) that are allowed, and thus will not be pushed to the excluded list
   */
  addExcludedConnectionPointFromAllowedTypes(e) {
    let t = 1;
    for (; t < u.All; )
      e & t || this.excludedConnectionPointTypes.push(t), t = t << 1;
  }
  /**
   * Serializes this point in a JSON representation
   * @param isInput defines if the connection point is an input (default is true)
   * @returns the serialized point object
   */
  serialize(e = !0) {
    const t = {};
    return t.name = this.name, t.displayName = this.displayName, e && this.connectedPoint && (t.inputName = this.name, t.targetBlockId = this.connectedPoint.ownerBlock.uniqueId, t.targetConnectionName = this.connectedPoint.name, t.isExposedOnFrame = !0, t.exposedPortPosition = this.exposedPortPosition), (this.isExposedOnFrame || this.exposedPortPosition >= 0) && (t.isExposedOnFrame = !0, t.exposedPortPosition = this.exposedPortPosition), t;
  }
  /**
   * Release resources
   */
  dispose() {
    this.onConnectionObservable.clear(), this.onDisconnectionObservable.clear();
  }
}
class oe {
  /**
   * Gets the name of the block
   */
  get name() {
    return this._name;
  }
  /**
   * Sets the name of the block. Will check if the name is valid.
   */
  set name(e) {
    this.validateBlockName(e) && (this._name = e);
  }
  /**
   * Gets a boolean indicating that this block can only be used once per NodeMaterial
   */
  get isUnique() {
    return this._isUnique;
  }
  /**
   * Gets a boolean indicating that this block is an end block (e.g. it is generating a system value)
   */
  get isFinalMerger() {
    return this._isFinalMerger;
  }
  /**
   * Gets a boolean indicating that this block is an input (e.g. it sends data to the shader)
   */
  get isInput() {
    return this._isInput;
  }
  /**
   * Gets a boolean indicating if this block is a teleport out
   */
  get isTeleportOut() {
    return this._isTeleportOut;
  }
  /**
   * Gets a boolean indicating if this block is a teleport in
   */
  get isTeleportIn() {
    return this._isTeleportIn;
  }
  /**
   * Gets or sets the build Id
   */
  get buildId() {
    return this._buildId;
  }
  set buildId(e) {
    this._buildId = e;
  }
  /**
   * Gets or sets the target of the block
   */
  get target() {
    return this._target;
  }
  set target(e) {
    this._target & e || (this._target = e);
  }
  /**
   * Gets the list of input points
   */
  get inputs() {
    return this._inputs;
  }
  /** Gets the list of output points */
  get outputs() {
    return this._outputs;
  }
  /**
   * Find an input by its name
   * @param name defines the name of the input to look for
   * @returns the input or null if not found
   */
  getInputByName(e) {
    const t = this._inputs.filter((i) => i.name === e);
    return t.length ? t[0] : null;
  }
  /**
   * Find an output by its name
   * @param name defines the name of the output to look for
   * @returns the output or null if not found
   */
  getOutputByName(e) {
    const t = this._outputs.filter((i) => i.name === e);
    return t.length ? t[0] : null;
  }
  /**
   * Creates a new NodeMaterialBlock
   * @param name defines the block name
   * @param target defines the target of that block (Vertex by default)
   * @param isFinalMerger defines a boolean indicating that this block is an end block (e.g. it is generating a system value). Default is false
   */
  constructor(e, t = p.Vertex, i = !1) {
    this._isFinalMerger = !1, this._isInput = !1, this._isTeleportOut = !1, this._isTeleportIn = !1, this._name = "", this._isUnique = !1, this.inputsAreExclusive = !1, this._codeVariableName = "", this._inputs = new Array(), this._outputs = new Array(), this.comments = "", this.visibleInInspector = !1, this.visibleOnFrame = !1, this._target = t, this._originalTargetIsNeutral = t === p.Neutral, this._isFinalMerger = i, this._isInput = this.getClassName() === "InputBlock", this._isTeleportOut = this.getClassName() === "NodeMaterialTeleportOutBlock", this._isTeleportIn = this.getClassName() === "NodeMaterialTeleportInBlock", this._name = e, this.uniqueId = ji.UniqueId;
  }
  /** @internal */
  _setInitialTarget(e) {
    this._target = e, this._originalTargetIsNeutral = e === p.Neutral;
  }
  /**
   * Initialize the block and prepare the context for build
   * @param state defines the state that will be used for the build
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialize(e) {
  }
  /**
   * Bind data to effect. Will only be called for blocks with isBindable === true
   * @param effect defines the effect to bind data to
   * @param nodeMaterial defines the hosting NodeMaterial
   * @param mesh defines the mesh that will be rendered
   * @param subMesh defines the submesh that will be rendered
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bind(e, t, i, s) {
  }
  _declareOutput(e, t) {
    return `${t._getGLType(e.type)} ${e.associatedVariableName}`;
  }
  _writeVariable(e) {
    return e.connectedPoint ? `${e.associatedVariableName}` : "0.";
  }
  _writeFloat(e) {
    let t = e.toString();
    return t.indexOf(".") === -1 && (t += ".0"), `${t}`;
  }
  /**
   * Gets the current class name e.g. "NodeMaterialBlock"
   * @returns the class name
   */
  getClassName() {
    return "NodeMaterialBlock";
  }
  /** Gets a boolean indicating that this connection will be used in the fragment shader
   * @returns true if connected in fragment shader
   */
  isConnectedInFragmentShader() {
    return this.outputs.some((e) => e.isConnectedInFragmentShader);
  }
  /**
   * Register a new input. Must be called inside a block constructor
   * @param name defines the connection point name
   * @param type defines the connection point type
   * @param isOptional defines a boolean indicating that this input can be omitted
   * @param target defines the target to use to limit the connection point (will be VertexAndFragment by default)
   * @param point an already created connection point. If not provided, create a new one
   * @returns the current block
   */
  registerInput(e, t, i = !1, s, r) {
    return r = r ?? new Ze(e, this, Ke.Input), r.type = t, r.isOptional = i, s && (r.target = s), this._inputs.push(r), this;
  }
  /**
   * Register a new output. Must be called inside a block constructor
   * @param name defines the connection point name
   * @param type defines the connection point type
   * @param target defines the target to use to limit the connection point (will be VertexAndFragment by default)
   * @param point an already created connection point. If not provided, create a new one
   * @returns the current block
   */
  registerOutput(e, t, i, s) {
    return s = s ?? new Ze(e, this, Ke.Output), s.type = t, i && (s.target = i), this._outputs.push(s), this;
  }
  /**
   * Will return the first available input e.g. the first one which is not an uniform or an attribute
   * @param forOutput defines an optional connection point to check compatibility with
   * @returns the first available input or null
   */
  getFirstAvailableInput(e = null) {
    for (const t of this._inputs)
      if (!t.connectedPoint && (!e || e.type === t.type || t.type === u.AutoDetect))
        return t;
    return null;
  }
  /**
   * Will return the first available output e.g. the first one which is not yet connected and not a varying
   * @param forBlock defines an optional block to check compatibility with
   * @returns the first available input or null
   */
  getFirstAvailableOutput(e = null) {
    for (const t of this._outputs)
      if (!e || !e.target || e.target === p.Neutral || e.target & t.target)
        return t;
    return null;
  }
  /**
   * Gets the sibling of the given output
   * @param current defines the current output
   * @returns the next output in the list or null
   */
  getSiblingOutput(e) {
    const t = this._outputs.indexOf(e);
    return t === -1 || t >= this._outputs.length ? null : this._outputs[t + 1];
  }
  /**
   * Checks if the current block is an ancestor of a given block
   * @param block defines the potential descendant block to check
   * @returns true if block is a descendant
   */
  isAnAncestorOf(e) {
    for (const t of this._outputs)
      if (t.hasEndpoints) {
        for (const i of t.endpoints)
          if (i.ownerBlock === e || i.ownerBlock.isAnAncestorOf(e))
            return !0;
      }
    return !1;
  }
  /**
   * Connect current block with another block
   * @param other defines the block to connect with
   * @param options define the various options to help pick the right connections
   * @param options.input
   * @param options.output
   * @param options.outputSwizzle
   * @returns the current block
   */
  connectTo(e, t) {
    if (this._outputs.length === 0)
      return;
    let i = t && t.output ? this.getOutputByName(t.output) : this.getFirstAvailableOutput(e), s = !0;
    for (; s; ) {
      const r = t && t.input ? e.getInputByName(t.input) : e.getFirstAvailableInput(i);
      if (i && r && i.canConnectTo(r))
        i.connectTo(r), s = !1;
      else if (i)
        i = this.getSiblingOutput(i);
      else
        throw "Unable to find a compatible match";
    }
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _buildBlock(e) {
  }
  /**
   * Add uniforms, samplers and uniform buffers at compilation time
   * @param state defines the state to update
   * @param nodeMaterial defines the node material requesting the update
   * @param defines defines the material defines to update
   * @param uniformBuffers defines the list of uniform buffer names
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateUniformsAndSamples(e, t, i, s) {
  }
  /**
   * Add potential fallbacks if shader compilation fails
   * @param mesh defines the mesh to be rendered
   * @param fallbacks defines the current prioritized list of fallbacks
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  provideFallbacks(e, t) {
  }
  /**
   * Initialize defines for shader compilation
   * @param mesh defines the mesh to be rendered
   * @param nodeMaterial defines the node material requesting the update
   * @param defines defines the material defines to update
   * @param useInstances specifies that instances should be used
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initializeDefines(e, t, i, s = !1) {
  }
  /**
   * Update defines for shader compilation
   * @param mesh defines the mesh to be rendered
   * @param nodeMaterial defines the node material requesting the update
   * @param defines defines the material defines to update
   * @param useInstances specifies that instances should be used
   * @param subMesh defines which submesh to render
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prepareDefines(e, t, i, s = !1, r) {
  }
  /**
   * Lets the block try to connect some inputs automatically
   * @param material defines the hosting NodeMaterial
   * @param additionalFilteringInfo optional additional filtering condition when looking for compatible blocks
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  autoConfigure(e, t = () => !0) {
  }
  /**
   * Function called when a block is declared as repeatable content generator
   * @param vertexShaderState defines the current compilation state for the vertex shader
   * @param fragmentShaderState defines the current compilation state for the fragment shader
   * @param mesh defines the mesh to be rendered
   * @param defines defines the material defines to update
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  replaceRepeatableContent(e, t, i, s) {
  }
  /** Gets a boolean indicating that the code of this block will be promoted to vertex shader even if connected to fragment output */
  get willBeGeneratedIntoVertexShaderFromFragmentShader() {
    return this.isInput || this.isFinalMerger || this._outputs.some((e) => e.isDirectlyConnectedToVertexOutput) || this.target === p.Vertex ? !1 : !!((this.target === p.VertexAndFragment || this.target === p.Neutral) && this._outputs.some((e) => e.isConnectedInVertexShader));
  }
  /**
   * Checks if the block is ready
   * @param mesh defines the mesh to be rendered
   * @param nodeMaterial defines the node material requesting the update
   * @param defines defines the material defines to update
   * @param useInstances specifies that instances should be used
   * @returns true if the block is ready
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isReady(e, t, i, s = !1) {
    return !0;
  }
  _linkConnectionTypes(e, t, i = !1) {
    i ? this._inputs[t]._acceptedConnectionPointType = this._inputs[e] : this._inputs[e]._linkedConnectionSource = this._inputs[t], this._inputs[t]._linkedConnectionSource = this._inputs[e];
  }
  _processBuild(e, t, i, s) {
    e.build(t, s);
    const r = t._vertexState != null, n = e._buildTarget === p.Vertex && e.target !== p.VertexAndFragment;
    if (r && (!(e.target & e._buildTarget) || !(e.target & i.target) || this.target !== p.VertexAndFragment && n) && (!e.isInput && t.target !== e._buildTarget || // block was already emitted by vertex shader
    e.isInput && e.isAttribute && !e._noContextSwitch)) {
      const o = i.connectedPoint;
      t._vertexState._emitVaryingFromString("v_" + o.associatedVariableName, t._getGLType(o.type)) && (t._vertexState.compilationString += `${"v_" + o.associatedVariableName} = ${o.associatedVariableName};
`), i.associatedVariableName = "v_" + o.associatedVariableName, i._enforceAssociatedVariableName = !0;
    }
  }
  /**
   * Validates the new name for the block node.
   * @param newName the new name to be given to the node.
   * @returns false if the name is a reserve word, else true.
   */
  validateBlockName(e) {
    const t = [
      "position",
      "normal",
      "tangent",
      "particle_positionw",
      "uv",
      "uv2",
      "uv3",
      "uv4",
      "uv5",
      "uv6",
      "position2d",
      "particle_uv",
      "matricesIndices",
      "matricesWeights",
      "world0",
      "world1",
      "world2",
      "world3",
      "particle_color",
      "particle_texturemask"
    ];
    for (const i of t)
      if (e === i)
        return !1;
    return !0;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _customBuildStep(e, t) {
  }
  /**
   * Compile the current node and generate the shader code
   * @param state defines the current compilation state (uniforms, samplers, current string)
   * @param activeBlocks defines the list of active blocks (i.e. blocks to compile)
   * @returns true if already built
   */
  build(e, t) {
    if (this._buildId === e.sharedData.buildId)
      return !0;
    if (!this.isInput)
      for (const i of this._outputs)
        i.associatedVariableName || (i.associatedVariableName = e._getFreeVariableName(i.name));
    for (const i of this._inputs) {
      if (!i.connectedPoint) {
        i.isOptional || e.sharedData.checks.notConnectedNonOptionalInputs.push(i);
        continue;
      }
      if (this.target !== p.Neutral && (!(i.target & this.target) || !(i.target & e.target)))
        continue;
      const s = i.connectedPoint.ownerBlock;
      s && s !== this && this._processBuild(s, e, i, t);
    }
    if (this._customBuildStep(e, t), this._buildId === e.sharedData.buildId)
      return !0;
    if (e.sharedData.verbose && R.Log(`${e.target === p.Vertex ? "Vertex shader" : "Fragment shader"}: Building ${this.name} [${this.getClassName()}]`), this.isFinalMerger)
      switch (e.target) {
        case p.Vertex:
          e.sharedData.checks.emitVertex = !0;
          break;
        case p.Fragment:
          e.sharedData.checks.emitFragment = !0;
          break;
      }
    !this.isInput && e.sharedData.emitComments && (e.compilationString += `
//${this.name}
`), this._buildBlock(e), this._buildId = e.sharedData.buildId, this._buildTarget = e.target;
    for (const i of this._outputs)
      if (i.target & e.target)
        for (const s of i.endpoints) {
          const r = s.ownerBlock;
          r && r.target & e.target && t.indexOf(r) !== -1 && this._processBuild(r, e, s, t);
        }
    return !1;
  }
  _inputRename(e) {
    return e;
  }
  _outputRename(e) {
    return e;
  }
  _dumpPropertiesCode() {
    const e = this._codeVariableName;
    return `${e}.visibleInInspector = ${this.visibleInInspector};
${e}.visibleOnFrame = ${this.visibleOnFrame};
${e}.target = ${this.target};
`;
  }
  /**
   * @internal
   */
  _dumpCode(e, t) {
    t.push(this);
    const i = this.name.replace(/[^A-Za-z_]+/g, "");
    if (this._codeVariableName = i || `${this.getClassName()}_${this.uniqueId}`, e.indexOf(this._codeVariableName) !== -1) {
      let r = 0;
      do
        r++, this._codeVariableName = i + r;
      while (e.indexOf(this._codeVariableName) !== -1);
    }
    e.push(this._codeVariableName);
    let s = `
// ${this.getClassName()}
`;
    this.comments && (s += `// ${this.comments}
`), s += `var ${this._codeVariableName} = new BABYLON.${this.getClassName()}("${this.name}");
`, s += this._dumpPropertiesCode();
    for (const r of this.inputs) {
      if (!r.isConnected)
        continue;
      const o = r.connectedPoint.ownerBlock;
      t.indexOf(o) === -1 && (s += o._dumpCode(e, t));
    }
    for (const r of this.outputs)
      if (r.hasEndpoints)
        for (const n of r.endpoints) {
          const o = n.ownerBlock;
          o && t.indexOf(o) === -1 && (s += o._dumpCode(e, t));
        }
    return s;
  }
  /**
   * @internal
   */
  _dumpCodeForOutputConnections(e) {
    let t = "";
    if (e.indexOf(this) !== -1)
      return t;
    e.push(this);
    for (const i of this.inputs) {
      if (!i.isConnected)
        continue;
      const s = i.connectedPoint, r = s.ownerBlock;
      t += r._dumpCodeForOutputConnections(e), t += `${r._codeVariableName}.${r._outputRename(s.name)}.connectTo(${this._codeVariableName}.${this._inputRename(i.name)});
`;
    }
    return t;
  }
  /**
   * Clone the current block to a new identical block
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @returns a copy of the current block
   */
  clone(e, t = "") {
    const i = this.serialize(), s = Lt(i.customType);
    if (s) {
      const r = new s();
      return r._deserialize(i, e, t), r;
    }
    return null;
  }
  /**
   * Serializes this block in a JSON representation
   * @returns the serialized block object
   */
  serialize() {
    const e = {};
    e.customType = "BABYLON." + this.getClassName(), e.id = this.uniqueId, e.name = this.name, e.comments = this.comments, e.visibleInInspector = this.visibleInInspector, e.visibleOnFrame = this.visibleOnFrame, e.target = this.target, e.inputs = [], e.outputs = [];
    for (const t of this.inputs)
      e.inputs.push(t.serialize());
    for (const t of this.outputs)
      e.outputs.push(t.serialize(!1));
    return e;
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _deserialize(e, t, i) {
    this.name = e.name, this.comments = e.comments, this.visibleInInspector = !!e.visibleInInspector, this.visibleOnFrame = !!e.visibleOnFrame, this._target = e.target ?? this.target, this._deserializePortDisplayNamesAndExposedOnFrame(e);
  }
  _deserializePortDisplayNamesAndExposedOnFrame(e) {
    const t = e.inputs, i = e.outputs;
    t && t.forEach((s, r) => {
      s.displayName && (this.inputs[r].displayName = s.displayName), s.isExposedOnFrame && (this.inputs[r].isExposedOnFrame = s.isExposedOnFrame, this.inputs[r].exposedPortPosition = s.exposedPortPosition);
    }), i && i.forEach((s, r) => {
      s.displayName && (this.outputs[r].displayName = s.displayName), s.isExposedOnFrame && (this.outputs[r].isExposedOnFrame = s.isExposedOnFrame, this.outputs[r].exposedPortPosition = s.exposedPortPosition);
    });
  }
  /**
   * Release resources
   */
  dispose() {
    for (const e of this.inputs)
      e.dispose();
    for (const e of this.outputs)
      e.dispose();
  }
}
class Ft extends oe {
  /**
   * Creates a new TransformBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Neutral), this.complementW = 1, this.complementZ = 0, this.target = p.Vertex, this.registerInput("vector", u.AutoDetect), this.registerInput("transform", u.Matrix), this.registerOutput("output", u.Vector4), this.registerOutput("xyz", u.Vector3), this._inputs[0].onConnectionObservable.add((t) => {
      if (t.ownerBlock.isInput) {
        const i = t.ownerBlock;
        (i.name === "normal" || i.name === "tangent") && (this.complementW = 0);
      }
    });
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "TransformBlock";
  }
  /**
   * Gets the vector input
   */
  get vector() {
    return this._inputs[0];
  }
  /**
   * Gets the output component
   */
  get output() {
    return this._outputs[0];
  }
  /**
   * Gets the xyz output component
   */
  get xyz() {
    return this._outputs[1];
  }
  /**
   * Gets the matrix transform input
   */
  get transform() {
    return this._inputs[1];
  }
  _buildBlock(e) {
    super._buildBlock(e);
    const t = this.vector, i = this.transform;
    if (t.connectedPoint) {
      if (this.complementW === 0) {
        const s = `//${this.name}`;
        e._emitFunctionFromInclude("helperFunctions", s), e.sharedData.blocksWithDefines.push(this);
        const r = e._getFreeVariableName(`${i.associatedVariableName}_NUS`);
        switch (e.compilationString += `mat3 ${r} = mat3(${i.associatedVariableName});
`, e.compilationString += `#ifdef NONUNIFORMSCALING
`, e.compilationString += `${r} = transposeMat3(inverseMat3(${r}));
`, e.compilationString += `#endif
`, t.connectedPoint.type) {
          case u.Vector2:
            e.compilationString += this._declareOutput(this.output, e) + ` = vec4(${r} * vec3(${t.associatedVariableName}, ${this._writeFloat(this.complementZ)}), ${this._writeFloat(this.complementW)});
`;
            break;
          case u.Vector3:
          case u.Color3:
            e.compilationString += this._declareOutput(this.output, e) + ` = vec4(${r} * ${t.associatedVariableName}, ${this._writeFloat(this.complementW)});
`;
            break;
          default:
            e.compilationString += this._declareOutput(this.output, e) + ` = vec4(${r} * ${t.associatedVariableName}.xyz, ${this._writeFloat(this.complementW)});
`;
            break;
        }
      } else {
        const s = i.associatedVariableName;
        switch (t.connectedPoint.type) {
          case u.Vector2:
            e.compilationString += this._declareOutput(this.output, e) + ` = ${s} * vec4(${t.associatedVariableName}, ${this._writeFloat(this.complementZ)}, ${this._writeFloat(this.complementW)});
`;
            break;
          case u.Vector3:
          case u.Color3:
            e.compilationString += this._declareOutput(this.output, e) + ` = ${s} * vec4(${t.associatedVariableName}, ${this._writeFloat(this.complementW)});
`;
            break;
          default:
            e.compilationString += this._declareOutput(this.output, e) + ` = ${s} * ${t.associatedVariableName};
`;
            break;
        }
      }
      this.xyz.hasEndpoints && (e.compilationString += this._declareOutput(this.xyz, e) + ` = ${this.output.associatedVariableName}.xyz;
`);
    }
    return this;
  }
  /**
   * Update defines for shader compilation
   * @param mesh defines the mesh to be rendered
   * @param nodeMaterial defines the node material requesting the update
   * @param defines defines the material defines to update
   */
  prepareDefines(e, t, i) {
    e.nonUniformScaling && i.setValue("NONUNIFORMSCALING", !0);
  }
  serialize() {
    const e = super.serialize();
    return e.complementZ = this.complementZ, e.complementW = this.complementW, e;
  }
  _deserialize(e, t, i) {
    super._deserialize(e, t, i), this.complementZ = e.complementZ !== void 0 ? e.complementZ : 0, this.complementW = e.complementW !== void 0 ? e.complementW : 1;
  }
  _dumpPropertiesCode() {
    let e = super._dumpPropertiesCode() + `${this._codeVariableName}.complementZ = ${this.complementZ};
`;
    return e += `${this._codeVariableName}.complementW = ${this.complementW};
`, e;
  }
}
q("BABYLON.TransformBlock", Ft);
class ot extends oe {
  /**
   * Creates a new VertexOutputBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Vertex, !0), this.registerInput("vector", u.Vector4);
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "VertexOutputBlock";
  }
  /**
   * Gets the vector input component
   */
  get vector() {
    return this._inputs[0];
  }
  _isLogarithmicDepthEnabled(e, t) {
    if (t)
      return !0;
    for (const i of e)
      if (i.useLogarithmicDepth)
        return !0;
    return !1;
  }
  _buildBlock(e) {
    super._buildBlock(e);
    const t = this.vector;
    return e.compilationString += `gl_Position = ${t.associatedVariableName};
`, this._isLogarithmicDepthEnabled(e.sharedData.fragmentOutputNodes, e.sharedData.nodeMaterial.useLogarithmicDepth) && (e._emitUniformFromString("logarithmicDepthConstant", "float"), e._emitVaryingFromString("vFragmentDepth", "float"), e.compilationString += `vFragmentDepth = 1.0 + gl_Position.w;
`, e.compilationString += `gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;
`), this;
  }
}
q("BABYLON.VertexOutputBlock", ot);
var xe;
(function(a) {
  a[a.Boolean = 0] = "Boolean", a[a.Float = 1] = "Float", a[a.Int = 2] = "Int", a[a.Vector2 = 3] = "Vector2", a[a.List = 4] = "List";
})(xe || (xe = {}));
function Je(a, e = xe.Boolean, t = "PROPERTIES", i) {
  return (s, r) => {
    let n = s._propStore;
    n || (n = [], s._propStore = n), n.push({
      propertyName: r,
      displayName: a,
      type: e,
      groupName: t,
      options: i ?? {}
    });
  };
}
class Ae extends oe {
  /**
   * Create a new FragmentOutputBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Fragment, !0), this.convertToGammaSpace = !1, this.convertToLinearSpace = !1, this.useLogarithmicDepth = !1, this.registerInput("rgba", u.Color4, !0), this.registerInput("rgb", u.AutoDetect, !0), this.registerInput("a", u.Float, !0), this.rgb.addExcludedConnectionPointFromAllowedTypes(u.Color3 | u.Vector3 | u.Float);
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "FragmentOutputBlock";
  }
  /**
   * Initialize the block and prepare the context for build
   * @param state defines the state that will be used for the build
   */
  initialize(e) {
    e._excludeVariableName("logarithmicDepthConstant"), e._excludeVariableName("vFragmentDepth");
  }
  /**
   * Gets the rgba input component
   */
  get rgba() {
    return this._inputs[0];
  }
  /**
   * Gets the rgb input component
   */
  get rgb() {
    return this._inputs[1];
  }
  /**
   * Gets the a input component
   */
  get a() {
    return this._inputs[2];
  }
  prepareDefines(e, t, i) {
    i.setValue(this._linearDefineName, this.convertToLinearSpace, !0), i.setValue(this._gammaDefineName, this.convertToGammaSpace, !0);
  }
  bind(e, t, i) {
    (this.useLogarithmicDepth || t.useLogarithmicDepth) && i && Ei(void 0, e, i.getScene());
  }
  _buildBlock(e) {
    super._buildBlock(e);
    const t = this.rgba, i = this.rgb, s = this.a;
    e.sharedData.hints.needAlphaBlending = t.isConnected || s.isConnected, e.sharedData.blocksWithDefines.push(this), (this.useLogarithmicDepth || e.sharedData.nodeMaterial.useLogarithmicDepth) && (e._emitUniformFromString("logarithmicDepthConstant", "float"), e._emitVaryingFromString("vFragmentDepth", "float"), e.sharedData.bindableBlocks.push(this)), this._linearDefineName = e._getFreeDefineName("CONVERTTOLINEAR"), this._gammaDefineName = e._getFreeDefineName("CONVERTTOGAMMA");
    const r = `//${this.name}`;
    if (e._emitFunctionFromInclude("helperFunctions", r), t.connectedPoint)
      s.isConnected ? e.compilationString += `gl_FragColor = vec4(${t.associatedVariableName}.rgb, ${s.associatedVariableName});
` : e.compilationString += `gl_FragColor = ${t.associatedVariableName};
`;
    else if (i.connectedPoint) {
      let n = "1.0";
      s.connectedPoint && (n = s.associatedVariableName), i.connectedPoint.type === u.Float ? e.compilationString += `gl_FragColor = vec4(${i.associatedVariableName}, ${i.associatedVariableName}, ${i.associatedVariableName}, ${n});
` : e.compilationString += `gl_FragColor = vec4(${i.associatedVariableName}, ${n});
`;
    } else
      e.sharedData.checks.notConnectedNonOptionalInputs.push(t);
    return e.compilationString += `#ifdef ${this._linearDefineName}
`, e.compilationString += `gl_FragColor = toLinearSpace(gl_FragColor);
`, e.compilationString += `#endif
`, e.compilationString += `#ifdef ${this._gammaDefineName}
`, e.compilationString += `gl_FragColor = toGammaSpace(gl_FragColor);
`, e.compilationString += `#endif
`, (this.useLogarithmicDepth || e.sharedData.nodeMaterial.useLogarithmicDepth) && (e.compilationString += `gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
`), e.compilationString += `#if defined(PREPASS)\r
`, e.compilationString += `gl_FragData[0] = gl_FragColor;\r
`, e.compilationString += `#endif\r
`, this;
  }
  _dumpPropertiesCode() {
    let e = super._dumpPropertiesCode();
    return e += `${this._codeVariableName}.convertToGammaSpace = ${this.convertToGammaSpace};
`, e += `${this._codeVariableName}.convertToLinearSpace = ${this.convertToLinearSpace};
`, e += `${this._codeVariableName}.useLogarithmicDepth = ${this.useLogarithmicDepth};
`, e;
  }
  serialize() {
    const e = super.serialize();
    return e.convertToGammaSpace = this.convertToGammaSpace, e.convertToLinearSpace = this.convertToLinearSpace, e.useLogarithmicDepth = this.useLogarithmicDepth, e;
  }
  _deserialize(e, t, i) {
    super._deserialize(e, t, i), this.convertToGammaSpace = e.convertToGammaSpace, this.convertToLinearSpace = e.convertToLinearSpace, this.useLogarithmicDepth = e.useLogarithmicDepth ?? !1;
  }
}
b([
  Je("Convert to gamma space", xe.Boolean, "PROPERTIES", { notifiers: { update: !0 } })
], Ae.prototype, "convertToGammaSpace", void 0);
b([
  Je("Convert to linear space", xe.Boolean, "PROPERTIES", { notifiers: { update: !0 } })
], Ae.prototype, "convertToLinearSpace", void 0);
b([
  Je("Use logarithmic depth", xe.Boolean, "PROPERTIES")
], Ae.prototype, "useLogarithmicDepth", void 0);
q("BABYLON.FragmentOutputBlock", Ae);
var z;
(function(a) {
  a[a.Uniform = 0] = "Uniform", a[a.Attribute = 1] = "Attribute", a[a.Varying = 2] = "Varying", a[a.Undefined = 3] = "Undefined";
})(z || (z = {}));
var M;
(function(a) {
  a[a.World = 1] = "World", a[a.View = 2] = "View", a[a.Projection = 3] = "Projection", a[a.ViewProjection = 4] = "ViewProjection", a[a.WorldView = 5] = "WorldView", a[a.WorldViewProjection = 6] = "WorldViewProjection", a[a.CameraPosition = 7] = "CameraPosition", a[a.FogColor = 8] = "FogColor", a[a.DeltaTime = 9] = "DeltaTime", a[a.CameraParameters = 10] = "CameraParameters", a[a.MaterialAlpha = 11] = "MaterialAlpha";
})(M || (M = {}));
var Ie;
(function(a) {
  a[a.None = 0] = "None", a[a.Time = 1] = "Time", a[a.RealTime = 2] = "RealTime";
})(Ie || (Ie = {}));
const ur = {
  position2d: "position",
  particle_uv: "vUV",
  particle_color: "vColor",
  particle_texturemask: "textureMask",
  particle_positionw: "vPositionW"
}, Tt = {
  particle_uv: !0,
  particle_color: !0,
  particle_texturemask: !0,
  particle_positionw: !0
}, di = {
  particle_texturemask: !0
};
class Z extends oe {
  /**
   * Gets or sets the connection point type (default is float)
   */
  get type() {
    if (this._type === u.AutoDetect) {
      if (this.isUniform && this.value != null) {
        if (!isNaN(this.value))
          return this._type = u.Float, this._type;
        switch (this.value.getClassName()) {
          case "Vector2":
            return this._type = u.Vector2, this._type;
          case "Vector3":
            return this._type = u.Vector3, this._type;
          case "Vector4":
            return this._type = u.Vector4, this._type;
          case "Color3":
            return this._type = u.Color3, this._type;
          case "Color4":
            return this._type = u.Color4, this._type;
          case "Matrix":
            return this._type = u.Matrix, this._type;
        }
      }
      if (this.isAttribute)
        switch (this.name) {
          case "position":
          case "normal":
          case "particle_positionw":
            return this._type = u.Vector3, this._type;
          case "uv":
          case "uv2":
          case "uv3":
          case "uv4":
          case "uv5":
          case "uv6":
          case "position2d":
          case "particle_uv":
            return this._type = u.Vector2, this._type;
          case "matricesIndices":
          case "matricesWeights":
          case "matricesIndicesExtra":
          case "matricesWeightsExtra":
          case "world0":
          case "world1":
          case "world2":
          case "world3":
          case "tangent":
            return this._type = u.Vector4, this._type;
          case "color":
          case "instanceColor":
          case "particle_color":
          case "particle_texturemask":
            return this._type = u.Color4, this._type;
        }
      if (this.isSystemValue)
        switch (this._systemValue) {
          case M.World:
          case M.WorldView:
          case M.WorldViewProjection:
          case M.View:
          case M.ViewProjection:
          case M.Projection:
            return this._type = u.Matrix, this._type;
          case M.CameraPosition:
            return this._type = u.Vector3, this._type;
          case M.FogColor:
            return this._type = u.Color3, this._type;
          case M.DeltaTime:
          case M.MaterialAlpha:
            return this._type = u.Float, this._type;
          case M.CameraParameters:
            return this._type = u.Vector4, this._type;
        }
    }
    return this._type;
  }
  /**
   * Creates a new InputBlock
   * @param name defines the block name
   * @param target defines the target of that block (Vertex by default)
   * @param type defines the type of the input (can be set to NodeMaterialBlockConnectionPointTypes.AutoDetect)
   */
  constructor(e, t = p.Vertex, i = u.AutoDetect) {
    super(e, t, !1), this._mode = z.Undefined, this._animationType = Ie.None, this.min = 0, this.max = 0, this.isBoolean = !1, this.matrixMode = 0, this._systemValue = null, this.isConstant = !1, this.groupInInspector = "", this.onValueChangedObservable = new x(), this.convertToGammaSpace = !1, this.convertToLinearSpace = !1, this._type = i, this.setDefaultValue(), this.registerOutput("output", i);
  }
  /**
   * Validates if a name is a reserve word.
   * @param newName the new name to be given to the node.
   * @returns false if the name is a reserve word, else true.
   */
  validateBlockName(e) {
    return this.isAttribute ? !0 : super.validateBlockName(e);
  }
  /**
   * Gets the output component
   */
  get output() {
    return this._outputs[0];
  }
  /**
   * Set the source of this connection point to a vertex attribute
   * @param attributeName defines the attribute name (position, uv, normal, etc...). If not specified it will take the connection point name
   * @returns the current connection point
   */
  setAsAttribute(e) {
    return this._mode = z.Attribute, e && (this.name = e), this;
  }
  /**
   * Set the source of this connection point to a system value
   * @param value define the system value to use (world, view, etc...) or null to switch to manual value
   * @returns the current connection point
   */
  setAsSystemValue(e) {
    return this.systemValue = e, this;
  }
  /**
   * Gets or sets the value of that point.
   * Please note that this value will be ignored if valueCallback is defined
   */
  get value() {
    return this._storedValue;
  }
  set value(e) {
    this.type === u.Float && (this.isBoolean ? e = e ? 1 : 0 : this.min !== this.max && (e = Math.max(this.min, e), e = Math.min(this.max, e))), this._storedValue = e, this._mode = z.Uniform, this.onValueChangedObservable.notifyObservers(this);
  }
  /**
   * Gets or sets a callback used to get the value of that point.
   * Please note that setting this value will force the connection point to ignore the value property
   */
  get valueCallback() {
    return this._valueCallback;
  }
  set valueCallback(e) {
    this._valueCallback = e, this._mode = z.Uniform;
  }
  /**
   * Gets or sets the associated variable name in the shader
   */
  get associatedVariableName() {
    return this._associatedVariableName;
  }
  set associatedVariableName(e) {
    this._associatedVariableName = e;
  }
  /** Gets or sets the type of animation applied to the input */
  get animationType() {
    return this._animationType;
  }
  set animationType(e) {
    this._animationType = e;
  }
  /**
   * Gets a boolean indicating that this connection point not defined yet
   */
  get isUndefined() {
    return this._mode === z.Undefined;
  }
  /**
   * Gets or sets a boolean indicating that this connection point is coming from an uniform.
   * In this case the connection point name must be the name of the uniform to use.
   * Can only be set on inputs
   */
  get isUniform() {
    return this._mode === z.Uniform;
  }
  set isUniform(e) {
    this._mode = e ? z.Uniform : z.Undefined, this.associatedVariableName = "";
  }
  /**
   * Gets or sets a boolean indicating that this connection point is coming from an attribute.
   * In this case the connection point name must be the name of the attribute to use
   * Can only be set on inputs
   */
  get isAttribute() {
    return this._mode === z.Attribute;
  }
  set isAttribute(e) {
    this._mode = e ? z.Attribute : z.Undefined, this.associatedVariableName = "";
  }
  /**
   * Gets or sets a boolean indicating that this connection point is generating a varying variable.
   * Can only be set on exit points
   */
  get isVarying() {
    return this._mode === z.Varying;
  }
  set isVarying(e) {
    this._mode = e ? z.Varying : z.Undefined, this.associatedVariableName = "";
  }
  /**
   * Gets a boolean indicating that the current connection point is a system value
   */
  get isSystemValue() {
    return this._systemValue != null;
  }
  /**
   * Gets or sets the current well known value or null if not defined as a system value
   */
  get systemValue() {
    return this._systemValue;
  }
  set systemValue(e) {
    this._mode = z.Uniform, this.associatedVariableName = "", this._systemValue = e;
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "InputBlock";
  }
  /**
   * Animate the input if animationType !== None
   * @param scene defines the rendering scene
   */
  animate(e) {
    switch (this._animationType) {
      case Ie.Time: {
        this.type === u.Float && (this.value += e.getAnimationRatio() * 0.01);
        break;
      }
      case Ie.RealTime: {
        this.type === u.Float && (this.value = ($i.Now - e.getEngine().startTime) / 1e3);
        break;
      }
    }
  }
  _emitDefine(e) {
    return e[0] === "!" ? `#ifndef ${e.substring(1)}
` : `#ifdef ${e}
`;
  }
  initialize() {
    this.associatedVariableName = "";
  }
  /**
   * Set the input block to its default value (based on its type)
   */
  setDefaultValue() {
    switch (this.type) {
      case u.Float:
        this.value = 0;
        break;
      case u.Vector2:
        this.value = ve.Zero();
        break;
      case u.Vector3:
        this.value = C.Zero();
        break;
      case u.Vector4:
        this.value = _i.Zero();
        break;
      case u.Color3:
        this.value = U.White();
        break;
      case u.Color4:
        this.value = new $e(1, 1, 1, 1);
        break;
      case u.Matrix:
        this.value = ce.Identity();
        break;
    }
  }
  _emitConstant(e) {
    switch (this.type) {
      case u.Float:
        return `${e._emitFloat(this.value)}`;
      case u.Vector2:
        return `vec2(${this.value.x}, ${this.value.y})`;
      case u.Vector3:
        return `vec3(${this.value.x}, ${this.value.y}, ${this.value.z})`;
      case u.Vector4:
        return `vec4(${this.value.x}, ${this.value.y}, ${this.value.z}, ${this.value.w})`;
      case u.Color3:
        return F.Color3[0].set(this.value.r, this.value.g, this.value.b), this.convertToGammaSpace && F.Color3[0].toGammaSpaceToRef(F.Color3[0], e.sharedData.scene.getEngine().useExactSrgbConversions), this.convertToLinearSpace && F.Color3[0].toLinearSpaceToRef(F.Color3[0], e.sharedData.scene.getEngine().useExactSrgbConversions), `vec3(${F.Color3[0].r}, ${F.Color3[0].g}, ${F.Color3[0].b})`;
      case u.Color4:
        return F.Color4[0].set(this.value.r, this.value.g, this.value.b, this.value.a), this.convertToGammaSpace && F.Color4[0].toGammaSpaceToRef(F.Color4[0], e.sharedData.scene.getEngine().useExactSrgbConversions), this.convertToLinearSpace && F.Color4[0].toLinearSpaceToRef(F.Color4[0], e.sharedData.scene.getEngine().useExactSrgbConversions), `vec4(${F.Color4[0].r}, ${F.Color4[0].g}, ${F.Color4[0].b}, ${F.Color4[0].a})`;
    }
    return "";
  }
  /** @internal */
  get _noContextSwitch() {
    return Tt[this.name];
  }
  _emit(e, t) {
    if (this.isUniform) {
      if (this.associatedVariableName || (this.associatedVariableName = e._getFreeVariableName("u_" + this.name)), this.isConstant) {
        if (e.constants.indexOf(this.associatedVariableName) !== -1)
          return;
        e.constants.push(this.associatedVariableName), e._constantDeclaration += this._declareOutput(this.output, e) + ` = ${this._emitConstant(e)};
`;
        return;
      }
      if (e.uniforms.indexOf(this.associatedVariableName) !== -1)
        return;
      e.uniforms.push(this.associatedVariableName), t && (e._uniformDeclaration += this._emitDefine(t)), e._uniformDeclaration += `uniform ${e._getGLType(this.type)} ${this.associatedVariableName};
`, t && (e._uniformDeclaration += `#endif
`);
      const i = e.sharedData.hints;
      if (this._systemValue !== null && this._systemValue !== void 0)
        switch (this._systemValue) {
          case M.WorldView:
            i.needWorldViewMatrix = !0;
            break;
          case M.WorldViewProjection:
            i.needWorldViewProjectionMatrix = !0;
            break;
        }
      else
        this._animationType !== Ie.None && e.sharedData.animatedInputs.push(this);
      return;
    }
    if (this.isAttribute) {
      if (this.associatedVariableName = ur[this.name] ?? this.name, this.target === p.Vertex && e._vertexState) {
        Tt[this.name] ? di[this.name] ? e._emitUniformFromString(this.associatedVariableName, e._getGLType(this.type), t) : e._emitVaryingFromString(this.associatedVariableName, e._getGLType(this.type), t) : this._emit(e._vertexState, t);
        return;
      }
      if (e.attributes.indexOf(this.associatedVariableName) !== -1)
        return;
      e.attributes.push(this.associatedVariableName), Tt[this.name] ? di[this.name] ? e._emitUniformFromString(this.associatedVariableName, e._getGLType(this.type), t) : e._emitVaryingFromString(this.associatedVariableName, e._getGLType(this.type), t) : (t && (e._attributeDeclaration += this._emitDefine(t)), e._attributeDeclaration += `attribute ${e._getGLType(this.type)} ${this.associatedVariableName};
`, t && (e._attributeDeclaration += `#endif
`));
    }
  }
  /**
   * @internal
   */
  _transmitWorld(e, t, i, s) {
    if (!this._systemValue)
      return;
    const r = this.associatedVariableName;
    switch (this._systemValue) {
      case M.World:
        e.setMatrix(r, t);
        break;
      case M.WorldView:
        e.setMatrix(r, i);
        break;
      case M.WorldViewProjection:
        e.setMatrix(r, s);
        break;
    }
  }
  /**
   * @internal
   */
  _transmit(e, t, i) {
    if (this.isAttribute)
      return;
    const s = this.associatedVariableName;
    if (this._systemValue) {
      switch (this._systemValue) {
        case M.World:
        case M.WorldView:
        case M.WorldViewProjection:
          return;
        case M.View:
          e.setMatrix(s, t.getViewMatrix());
          break;
        case M.Projection:
          e.setMatrix(s, t.getProjectionMatrix());
          break;
        case M.ViewProjection:
          e.setMatrix(s, t.getTransformMatrix());
          break;
        case M.CameraPosition:
          t.bindEyePosition(e, s, !0);
          break;
        case M.FogColor:
          e.setColor3(s, t.fogColor);
          break;
        case M.DeltaTime:
          e.setFloat(s, t.deltaTime / 1e3);
          break;
        case M.CameraParameters:
          t.activeCamera && e.setFloat4(s, t.getEngine().hasOriginBottomLeft ? -1 : 1, t.activeCamera.minZ, t.activeCamera.maxZ, 1 / t.activeCamera.maxZ);
          break;
        case M.MaterialAlpha:
          e.setFloat(s, i.alpha);
          break;
      }
      return;
    }
    const r = this._valueCallback ? this._valueCallback() : this._storedValue;
    if (r !== null)
      switch (this.type) {
        case u.Float:
          e.setFloat(s, r);
          break;
        case u.Int:
          e.setInt(s, r);
          break;
        case u.Color3:
          F.Color3[0].set(this.value.r, this.value.g, this.value.b), this.convertToGammaSpace && F.Color3[0].toGammaSpaceToRef(F.Color3[0], t.getEngine().useExactSrgbConversions), this.convertToLinearSpace && F.Color3[0].toLinearSpaceToRef(F.Color3[0], t.getEngine().useExactSrgbConversions), e.setColor3(s, F.Color3[0]);
          break;
        case u.Color4:
          F.Color4[0].set(this.value.r, this.value.g, this.value.b, this.value.a), this.convertToGammaSpace && F.Color4[0].toGammaSpaceToRef(F.Color4[0], t.getEngine().useExactSrgbConversions), this.convertToLinearSpace && F.Color4[0].toLinearSpaceToRef(F.Color4[0], t.getEngine().useExactSrgbConversions), e.setDirectColor4(s, F.Color4[0]);
          break;
        case u.Vector2:
          e.setVector2(s, r);
          break;
        case u.Vector3:
          e.setVector3(s, r);
          break;
        case u.Vector4:
          e.setVector4(s, r);
          break;
        case u.Matrix:
          e.setMatrix(s, r);
          break;
      }
  }
  _buildBlock(e) {
    super._buildBlock(e), (this.isUniform || this.isSystemValue) && e.sharedData.inputBlocks.push(this), this._emit(e);
  }
  _dumpPropertiesCode() {
    const e = this._codeVariableName;
    if (this.isAttribute)
      return super._dumpPropertiesCode() + `${e}.setAsAttribute("${this.name}");
`;
    if (this.isSystemValue)
      return super._dumpPropertiesCode() + `${e}.setAsSystemValue(BABYLON.NodeMaterialSystemValues.${M[this._systemValue]});
`;
    if (this.isUniform) {
      const t = [];
      let i = "";
      switch (this.type) {
        case u.Float:
          i = `${this.value}`;
          break;
        case u.Vector2:
          i = `new BABYLON.Vector2(${this.value.x}, ${this.value.y})`;
          break;
        case u.Vector3:
          i = `new BABYLON.Vector3(${this.value.x}, ${this.value.y}, ${this.value.z})`;
          break;
        case u.Vector4:
          i = `new BABYLON.Vector4(${this.value.x}, ${this.value.y}, ${this.value.z}, ${this.value.w})`;
          break;
        case u.Color3:
          i = `new BABYLON.Color3(${this.value.r}, ${this.value.g}, ${this.value.b})`, this.convertToGammaSpace && (i += ".toGammaSpace()"), this.convertToLinearSpace && (i += ".toLinearSpace()");
          break;
        case u.Color4:
          i = `new BABYLON.Color4(${this.value.r}, ${this.value.g}, ${this.value.b}, ${this.value.a})`, this.convertToGammaSpace && (i += ".toGammaSpace()"), this.convertToLinearSpace && (i += ".toLinearSpace()");
          break;
        case u.Matrix:
          i = `BABYLON.Matrix.FromArray([${this.value.m}])`;
          break;
      }
      return t.push(`${e}.value = ${i}`), this.type === u.Float && t.push(`${e}.min = ${this.min}`, `${e}.max = ${this.max}`, `${e}.isBoolean = ${this.isBoolean}`, `${e}.matrixMode = ${this.matrixMode}`, `${e}.animationType = BABYLON.AnimatedInputBlockTypes.${Ie[this.animationType]}`), t.push(`${e}.isConstant = ${this.isConstant}`), t.push(""), super._dumpPropertiesCode() + t.join(`;
`);
    }
    return super._dumpPropertiesCode();
  }
  dispose() {
    this.onValueChangedObservable.clear(), super.dispose();
  }
  serialize() {
    const e = super.serialize();
    return e.type = this.type, e.mode = this._mode, e.systemValue = this._systemValue, e.animationType = this._animationType, e.min = this.min, e.max = this.max, e.isBoolean = this.isBoolean, e.matrixMode = this.matrixMode, e.isConstant = this.isConstant, e.groupInInspector = this.groupInInspector, e.convertToGammaSpace = this.convertToGammaSpace, e.convertToLinearSpace = this.convertToLinearSpace, this._storedValue != null && this._mode === z.Uniform && (this._storedValue.asArray ? (e.valueType = "BABYLON." + this._storedValue.getClassName(), e.value = this._storedValue.asArray()) : (e.valueType = "number", e.value = this._storedValue)), e;
  }
  _deserialize(e, t, i) {
    if (this._mode = e.mode, super._deserialize(e, t, i), this._type = e.type, this._systemValue = e.systemValue || e.wellKnownValue, this._animationType = e.animationType, this.min = e.min || 0, this.max = e.max || 0, this.isBoolean = !!e.isBoolean, this.matrixMode = e.matrixMode || 0, this.isConstant = !!e.isConstant, this.groupInInspector = e.groupInInspector || "", this.convertToGammaSpace = !!e.convertToGammaSpace, this.convertToLinearSpace = !!e.convertToLinearSpace, e.name === "tangent" && e.mode === z.Attribute && e.type === u.Vector3 && (this._type = u.Vector4), !!e.valueType)
      if (e.valueType === "number")
        this._storedValue = e.value;
      else {
        const s = Lt(e.valueType);
        s && (this._storedValue = s.FromArray(e.value));
      }
  }
}
q("BABYLON.InputBlock", Z);
class Ai extends oe {
  /**
   * Create a new CurrentScreenBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.VertexAndFragment), this._samplerName = "textureSampler", this.convertToGammaSpace = !1, this.convertToLinearSpace = !1, this._isUnique = !1, this.registerInput("uv", u.AutoDetect, !1, p.VertexAndFragment), this.registerOutput("rgba", u.Color4, p.Neutral), this.registerOutput("rgb", u.Color3, p.Neutral), this.registerOutput("r", u.Float, p.Neutral), this.registerOutput("g", u.Float, p.Neutral), this.registerOutput("b", u.Float, p.Neutral), this.registerOutput("a", u.Float, p.Neutral), this._inputs[0].addExcludedConnectionPointFromAllowedTypes(u.Vector2 | u.Vector3 | u.Vector4), this._inputs[0]._prioritizeVertex = !1;
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "CurrentScreenBlock";
  }
  /**
   * Gets the uv input component
   */
  get uv() {
    return this._inputs[0];
  }
  /**
   * Gets the rgba output component
   */
  get rgba() {
    return this._outputs[0];
  }
  /**
   * Gets the rgb output component
   */
  get rgb() {
    return this._outputs[1];
  }
  /**
   * Gets the r output component
   */
  get r() {
    return this._outputs[2];
  }
  /**
   * Gets the g output component
   */
  get g() {
    return this._outputs[3];
  }
  /**
   * Gets the b output component
   */
  get b() {
    return this._outputs[4];
  }
  /**
   * Gets the a output component
   */
  get a() {
    return this._outputs[5];
  }
  /**
   * Initialize the block and prepare the context for build
   * @param state defines the state that will be used for the build
   */
  initialize(e) {
    e._excludeVariableName("textureSampler");
  }
  get target() {
    return !this.uv.isConnected || this.uv.sourceBlock.isInput ? p.VertexAndFragment : p.Fragment;
  }
  prepareDefines(e, t, i) {
    i.setValue(this._linearDefineName, this.convertToGammaSpace, !0), i.setValue(this._gammaDefineName, this.convertToLinearSpace, !0);
  }
  isReady() {
    return !(this.texture && !this.texture.isReadyOrNotBlocking());
  }
  _injectVertexCode(e) {
    const t = this.uv;
    if (t.connectedPoint.ownerBlock.isInput && (t.connectedPoint.ownerBlock.isAttribute || e._emitUniformFromString(t.associatedVariableName, "vec2")), this._mainUVName = "vMain" + t.associatedVariableName, e._emitVaryingFromString(this._mainUVName, "vec2"), e.compilationString += `${this._mainUVName} = ${t.associatedVariableName}.xy;
`, !!this._outputs.some((i) => i.isConnectedInVertexShader)) {
      this._writeTextureRead(e, !0);
      for (const i of this._outputs)
        i.hasEndpoints && this._writeOutput(e, i, i.name, !0);
    }
  }
  _writeTextureRead(e, t = !1) {
    const i = this.uv;
    if (t) {
      if (e.target === p.Fragment)
        return;
      e.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${i.associatedVariableName});
`;
      return;
    }
    if (this.uv.ownerBlock.target === p.Fragment) {
      e.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${i.associatedVariableName});
`;
      return;
    }
    e.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${this._mainUVName});
`;
  }
  _writeOutput(e, t, i, s = !1) {
    if (s) {
      if (e.target === p.Fragment)
        return;
      e.compilationString += `${this._declareOutput(t, e)} = ${this._tempTextureRead}.${i};
`;
      return;
    }
    if (this.uv.ownerBlock.target === p.Fragment) {
      e.compilationString += `${this._declareOutput(t, e)} = ${this._tempTextureRead}.${i};
`;
      return;
    }
    e.compilationString += `${this._declareOutput(t, e)} = ${this._tempTextureRead}.${i};
`, e.compilationString += `#ifdef ${this._linearDefineName}
`, e.compilationString += `${t.associatedVariableName} = toGammaSpace(${t.associatedVariableName});
`, e.compilationString += `#endif
`, e.compilationString += `#ifdef ${this._gammaDefineName}
`, e.compilationString += `${t.associatedVariableName} = toLinearSpace(${t.associatedVariableName});
`, e.compilationString += `#endif
`;
  }
  _buildBlock(e) {
    if (super._buildBlock(e), this._tempTextureRead = e._getFreeVariableName("tempTextureRead"), e.sharedData.blockingBlocks.indexOf(this) < 0 && e.sharedData.blockingBlocks.push(this), e.sharedData.textureBlocks.indexOf(this) < 0 && e.sharedData.textureBlocks.push(this), e.sharedData.blocksWithDefines.indexOf(this) < 0 && e.sharedData.blocksWithDefines.push(this), e.target !== p.Fragment) {
      e._emit2DSampler(this._samplerName), this._injectVertexCode(e);
      return;
    }
    if (!this._outputs.some((i) => i.isConnectedInFragmentShader))
      return;
    e._emit2DSampler(this._samplerName), this._linearDefineName = e._getFreeDefineName("ISLINEAR"), this._gammaDefineName = e._getFreeDefineName("ISGAMMA");
    const t = `//${this.name}`;
    e._emitFunctionFromInclude("helperFunctions", t), this._writeTextureRead(e);
    for (const i of this._outputs)
      i.hasEndpoints && this._writeOutput(e, i, i.name);
    return this;
  }
  serialize() {
    const e = super.serialize();
    return e.convertToGammaSpace = this.convertToGammaSpace, e.convertToLinearSpace = this.convertToLinearSpace, this.texture && !this.texture.isRenderTarget && (e.texture = this.texture.serialize()), e;
  }
  _deserialize(e, t, i) {
    super._deserialize(e, t, i), this.convertToGammaSpace = e.convertToGammaSpace, this.convertToLinearSpace = !!e.convertToLinearSpace, e.texture && (i = e.texture.url.indexOf("data:") === 0 ? "" : i, this.texture = L.Parse(e.texture, t, i));
  }
}
q("BABYLON.CurrentScreenBlock", Ai);
class xi extends oe {
  /**
   * Create a new ParticleTextureBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Fragment), this._samplerName = "diffuseSampler", this.convertToGammaSpace = !1, this.convertToLinearSpace = !1, this._isUnique = !1, this.registerInput("uv", u.AutoDetect, !1, p.VertexAndFragment), this.registerOutput("rgba", u.Color4, p.Neutral), this.registerOutput("rgb", u.Color3, p.Neutral), this.registerOutput("r", u.Float, p.Neutral), this.registerOutput("g", u.Float, p.Neutral), this.registerOutput("b", u.Float, p.Neutral), this.registerOutput("a", u.Float, p.Neutral), this._inputs[0].addExcludedConnectionPointFromAllowedTypes(u.Vector2 | u.Vector3 | u.Vector4);
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "ParticleTextureBlock";
  }
  /**
   * Gets the uv input component
   */
  get uv() {
    return this._inputs[0];
  }
  /**
   * Gets the rgba output component
   */
  get rgba() {
    return this._outputs[0];
  }
  /**
   * Gets the rgb output component
   */
  get rgb() {
    return this._outputs[1];
  }
  /**
   * Gets the r output component
   */
  get r() {
    return this._outputs[2];
  }
  /**
   * Gets the g output component
   */
  get g() {
    return this._outputs[3];
  }
  /**
   * Gets the b output component
   */
  get b() {
    return this._outputs[4];
  }
  /**
   * Gets the a output component
   */
  get a() {
    return this._outputs[5];
  }
  /**
   * Initialize the block and prepare the context for build
   * @param state defines the state that will be used for the build
   */
  initialize(e) {
    e._excludeVariableName("diffuseSampler");
  }
  autoConfigure(e, t = () => !0) {
    if (!this.uv.isConnected) {
      let i = e.getInputBlockByPredicate((s) => s.isAttribute && s.name === "particle_uv" && t(s));
      i || (i = new Z("uv"), i.setAsAttribute("particle_uv")), i.output.connectTo(this.uv);
    }
  }
  prepareDefines(e, t, i) {
    i.setValue(this._linearDefineName, this.convertToGammaSpace, !0), i.setValue(this._gammaDefineName, this.convertToLinearSpace, !0);
  }
  isReady() {
    return !(this.texture && !this.texture.isReadyOrNotBlocking());
  }
  _writeOutput(e, t, i) {
    e.compilationString += `${this._declareOutput(t, e)} = ${this._tempTextureRead}.${i};
`, e.compilationString += `#ifdef ${this._linearDefineName}
`, e.compilationString += `${t.associatedVariableName} = toGammaSpace(${t.associatedVariableName});
`, e.compilationString += `#endif
`, e.compilationString += `#ifdef ${this._gammaDefineName}
`, e.compilationString += `${t.associatedVariableName} = toLinearSpace(${t.associatedVariableName});
`, e.compilationString += `#endif
`;
  }
  _buildBlock(e) {
    if (super._buildBlock(e), e.target === p.Vertex)
      return;
    this._tempTextureRead = e._getFreeVariableName("tempTextureRead"), e._emit2DSampler(this._samplerName), e.sharedData.blockingBlocks.push(this), e.sharedData.textureBlocks.push(this), e.sharedData.blocksWithDefines.push(this), this._linearDefineName = e._getFreeDefineName("ISLINEAR"), this._gammaDefineName = e._getFreeDefineName("ISGAMMA");
    const t = `//${this.name}`;
    e._emitFunctionFromInclude("helperFunctions", t), e.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${this.uv.associatedVariableName});
`;
    for (const i of this._outputs)
      i.hasEndpoints && this._writeOutput(e, i, i.name);
    return this;
  }
  serialize() {
    const e = super.serialize();
    return e.convertToGammaSpace = this.convertToGammaSpace, e.convertToLinearSpace = this.convertToLinearSpace, this.texture && !this.texture.isRenderTarget && (e.texture = this.texture.serialize()), e;
  }
  _deserialize(e, t, i) {
    super._deserialize(e, t, i), this.convertToGammaSpace = e.convertToGammaSpace, this.convertToLinearSpace = !!e.convertToLinearSpace, e.texture && (i = e.texture.url.indexOf("data:") === 0 ? "" : i, this.texture = L.Parse(e.texture, t, i));
  }
}
q("BABYLON.ParticleTextureBlock", xi);
class Oi extends oe {
  /**
   * Create a new ParticleRampGradientBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Fragment), this._isUnique = !0, this.registerInput("color", u.Color4, !1, p.Fragment), this.registerOutput("rampColor", u.Color4, p.Fragment);
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "ParticleRampGradientBlock";
  }
  /**
   * Gets the color input component
   */
  get color() {
    return this._inputs[0];
  }
  /**
   * Gets the rampColor output component
   */
  get rampColor() {
    return this._outputs[0];
  }
  /**
   * Initialize the block and prepare the context for build
   * @param state defines the state that will be used for the build
   */
  initialize(e) {
    e._excludeVariableName("remapRanges"), e._excludeVariableName("rampSampler"), e._excludeVariableName("baseColor"), e._excludeVariableName("alpha"), e._excludeVariableName("remappedColorIndex"), e._excludeVariableName("rampColor"), e._excludeVariableName("finalAlpha");
  }
  _buildBlock(e) {
    if (super._buildBlock(e), e.target !== p.Vertex)
      return e._emit2DSampler("rampSampler"), e._emitVaryingFromString("remapRanges", "vec4", "RAMPGRADIENT"), e.compilationString += `
            #ifdef RAMPGRADIENT
                vec4 baseColor = ${this.color.associatedVariableName};
                float alpha = ${this.color.associatedVariableName}.a;

                float remappedColorIndex = clamp((alpha - remapRanges.x) / remapRanges.y, 0.0, 1.0);

                vec4 rampColor = texture2D(rampSampler, vec2(1.0 - remappedColorIndex, 0.));
                baseColor.rgb *= rampColor.rgb;

                // Remapped alpha
                float finalAlpha = baseColor.a;
                baseColor.a = clamp((alpha * rampColor.a - remapRanges.z) / remapRanges.w, 0.0, 1.0);

                ${this._declareOutput(this.rampColor, e)} = baseColor;
            #else
                ${this._declareOutput(this.rampColor, e)} = ${this.color.associatedVariableName};
            #endif
        `, this;
  }
}
q("BABYLON.ParticleRampGradientBlock", Oi);
class Ni extends oe {
  /**
   * Create a new ParticleBlendMultiplyBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Fragment), this._isUnique = !0, this.registerInput("color", u.Color4, !1, p.Fragment), this.registerInput("alphaTexture", u.Float, !1, p.Fragment), this.registerInput("alphaColor", u.Float, !1, p.Fragment), this.registerOutput("blendColor", u.Color4, p.Fragment);
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "ParticleBlendMultiplyBlock";
  }
  /**
   * Gets the color input component
   */
  get color() {
    return this._inputs[0];
  }
  /**
   * Gets the alphaTexture input component
   */
  get alphaTexture() {
    return this._inputs[1];
  }
  /**
   * Gets the alphaColor input component
   */
  get alphaColor() {
    return this._inputs[2];
  }
  /**
   * Gets the blendColor output component
   */
  get blendColor() {
    return this._outputs[0];
  }
  /**
   * Initialize the block and prepare the context for build
   * @param state defines the state that will be used for the build
   */
  initialize(e) {
    e._excludeVariableName("sourceAlpha");
  }
  _buildBlock(e) {
    if (super._buildBlock(e), e.target !== p.Vertex)
      return e.compilationString += `
            #ifdef BLENDMULTIPLYMODE
                ${this._declareOutput(this.blendColor, e)};
                float sourceAlpha = ${this.alphaColor.associatedVariableName} * ${this.alphaTexture.associatedVariableName};
                ${this.blendColor.associatedVariableName}.rgb = ${this.color.associatedVariableName}.rgb * sourceAlpha + vec3(1.0) * (1.0 - sourceAlpha);
                ${this.blendColor.associatedVariableName}.a = ${this.color.associatedVariableName}.a;
            #else
                ${this._declareOutput(this.blendColor, e)} = ${this.color.associatedVariableName};
            #endif
        `, this;
  }
}
q("BABYLON.ParticleBlendMultiplyBlock", Ni);
class at extends oe {
  /**
   * Create a new VectorMergerBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Neutral), this.xSwizzle = "x", this.ySwizzle = "y", this.zSwizzle = "z", this.wSwizzle = "w", this.registerInput("xyzw ", u.Vector4, !0), this.registerInput("xyz ", u.Vector3, !0), this.registerInput("xy ", u.Vector2, !0), this.registerInput("zw ", u.Vector2, !0), this.registerInput("x", u.Float, !0), this.registerInput("y", u.Float, !0), this.registerInput("z", u.Float, !0), this.registerInput("w", u.Float, !0), this.registerOutput("xyzw", u.Vector4), this.registerOutput("xyz", u.Vector3), this.registerOutput("xy", u.Vector2), this.registerOutput("zw", u.Vector2);
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "VectorMergerBlock";
  }
  /**
   * Gets the xyzw component (input)
   */
  get xyzwIn() {
    return this._inputs[0];
  }
  /**
   * Gets the xyz component (input)
   */
  get xyzIn() {
    return this._inputs[1];
  }
  /**
   * Gets the xy component (input)
   */
  get xyIn() {
    return this._inputs[2];
  }
  /**
   * Gets the zw component (input)
   */
  get zwIn() {
    return this._inputs[3];
  }
  /**
   * Gets the x component (input)
   */
  get x() {
    return this._inputs[4];
  }
  /**
   * Gets the y component (input)
   */
  get y() {
    return this._inputs[5];
  }
  /**
   * Gets the z component (input)
   */
  get z() {
    return this._inputs[6];
  }
  /**
   * Gets the w component (input)
   */
  get w() {
    return this._inputs[7];
  }
  /**
   * Gets the xyzw component (output)
   */
  get xyzw() {
    return this._outputs[0];
  }
  /**
   * Gets the xyz component (output)
   */
  get xyzOut() {
    return this._outputs[1];
  }
  /**
   * Gets the xy component (output)
   */
  get xyOut() {
    return this._outputs[2];
  }
  /**
   * Gets the zw component (output)
   */
  get zwOut() {
    return this._outputs[3];
  }
  /**
   * Gets the xy component (output)
   * @deprecated Please use xyOut instead.
   */
  get xy() {
    return this.xyOut;
  }
  /**
   * Gets the xyz component (output)
   * @deprecated Please use xyzOut instead.
   */
  get xyz() {
    return this.xyzOut;
  }
  _inputRename(e) {
    return e === "xyzw " ? "xyzwIn" : e === "xyz " ? "xyzIn" : e === "xy " ? "xyIn" : e === "zw " ? "zwIn" : e;
  }
  _buildSwizzle(e) {
    return "." + (this.xSwizzle + this.ySwizzle + this.zSwizzle + this.wSwizzle).substr(0, e);
  }
  _buildBlock(e) {
    super._buildBlock(e);
    const t = this.x, i = this.y, s = this.z, r = this.w, n = this.xyIn, o = this.zwIn, l = this.xyzIn, h = this.xyzwIn, c = this._outputs[0], d = this._outputs[1], f = this._outputs[2], _ = this._outputs[3];
    return h.isConnected ? (c.hasEndpoints && (e.compilationString += this._declareOutput(c, e) + ` = ${h.associatedVariableName}${this._buildSwizzle(4)};
`), d.hasEndpoints && (e.compilationString += this._declareOutput(d, e) + ` = ${h.associatedVariableName}${this._buildSwizzle(3)};
`), f.hasEndpoints && (e.compilationString += this._declareOutput(f, e) + ` = ${h.associatedVariableName}${this._buildSwizzle(2)};
`)) : l.isConnected ? (c.hasEndpoints && (e.compilationString += this._declareOutput(c, e) + ` = vec4(${l.associatedVariableName}, ${r.isConnected ? this._writeVariable(r) : "0.0"})${this._buildSwizzle(4)};
`), d.hasEndpoints && (e.compilationString += this._declareOutput(d, e) + ` = ${l.associatedVariableName}${this._buildSwizzle(3)};
`), f.hasEndpoints && (e.compilationString += this._declareOutput(f, e) + ` = ${l.associatedVariableName}${this._buildSwizzle(2)};
`)) : n.isConnected ? (c.hasEndpoints && (o.isConnected ? e.compilationString += this._declareOutput(c, e) + ` = vec4(${n.associatedVariableName}, ${o.associatedVariableName})${this._buildSwizzle(4)};
` : e.compilationString += this._declareOutput(c, e) + ` = vec4(${n.associatedVariableName}, ${s.isConnected ? this._writeVariable(s) : "0.0"}, ${r.isConnected ? this._writeVariable(r) : "0.0"})${this._buildSwizzle(4)};
`), d.hasEndpoints && (e.compilationString += this._declareOutput(d, e) + ` = vec3(${n.associatedVariableName}, ${s.isConnected ? this._writeVariable(s) : "0.0"})${this._buildSwizzle(3)};
`), f.hasEndpoints && (e.compilationString += this._declareOutput(f, e) + ` = ${n.associatedVariableName}${this._buildSwizzle(2)};
`), _.hasEndpoints && (o.isConnected ? e.compilationString += this._declareOutput(_, e) + ` = ${o.associatedVariableName}${this._buildSwizzle(2)};
` : e.compilationString += this._declareOutput(_, e) + ` = vec2(${s.isConnected ? this._writeVariable(s) : "0.0"}, ${r.isConnected ? this._writeVariable(r) : "0.0"})${this._buildSwizzle(2)};
`)) : (c.hasEndpoints && (o.isConnected ? e.compilationString += this._declareOutput(c, e) + ` = vec4(${t.isConnected ? this._writeVariable(t) : "0.0"}, ${i.isConnected ? this._writeVariable(i) : "0.0"}, ${o.associatedVariableName})${this._buildSwizzle(4)};
` : e.compilationString += this._declareOutput(c, e) + ` = vec4(${t.isConnected ? this._writeVariable(t) : "0.0"}, ${i.isConnected ? this._writeVariable(i) : "0.0"}, ${s.isConnected ? this._writeVariable(s) : "0.0"}, ${r.isConnected ? this._writeVariable(r) : "0.0"})${this._buildSwizzle(4)};
`), d.hasEndpoints && (e.compilationString += this._declareOutput(d, e) + ` = vec3(${t.isConnected ? this._writeVariable(t) : "0.0"}, ${i.isConnected ? this._writeVariable(i) : "0.0"}, ${s.isConnected ? this._writeVariable(s) : "0.0"})${this._buildSwizzle(3)};
`), f.hasEndpoints && (e.compilationString += this._declareOutput(f, e) + ` = vec2(${t.isConnected ? this._writeVariable(t) : "0.0"}, ${i.isConnected ? this._writeVariable(i) : "0.0"})${this._buildSwizzle(2)};
`), _.hasEndpoints && (o.isConnected ? e.compilationString += this._declareOutput(_, e) + ` = ${o.associatedVariableName}${this._buildSwizzle(2)};
` : e.compilationString += this._declareOutput(_, e) + ` = vec2(${s.isConnected ? this._writeVariable(s) : "0.0"}, ${r.isConnected ? this._writeVariable(r) : "0.0"})${this._buildSwizzle(2)};
`)), this;
  }
  serialize() {
    const e = super.serialize();
    return e.xSwizzle = this.xSwizzle, e.ySwizzle = this.ySwizzle, e.zSwizzle = this.zSwizzle, e.wSwizzle = this.wSwizzle, e;
  }
  _deserialize(e, t, i) {
    super._deserialize(e, t, i), this.xSwizzle = e.xSwizzle ?? "x", this.ySwizzle = e.ySwizzle ?? "y", this.zSwizzle = e.zSwizzle ?? "z", this.wSwizzle = e.wSwizzle ?? "w";
  }
  _dumpPropertiesCode() {
    let e = super._dumpPropertiesCode();
    return e += `${this._codeVariableName}.xSwizzle = "${this.xSwizzle}";
`, e += `${this._codeVariableName}.ySwizzle = "${this.ySwizzle}";
`, e += `${this._codeVariableName}.zSwizzle = "${this.zSwizzle}";
`, e += `${this._codeVariableName}.wSwizzle = "${this.wSwizzle}";
`, e;
  }
}
q("BABYLON.VectorMergerBlock", at);
class pt extends oe {
  /**
   * Creates a new RemapBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Neutral), this.sourceRange = new ve(-1, 1), this.targetRange = new ve(0, 1), this.registerInput("input", u.AutoDetect), this.registerInput("sourceMin", u.Float, !0), this.registerInput("sourceMax", u.Float, !0), this.registerInput("targetMin", u.Float, !0), this.registerInput("targetMax", u.Float, !0), this.registerOutput("output", u.BasedOnInput), this._outputs[0]._typeConnectionSource = this._inputs[0];
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "RemapBlock";
  }
  /**
   * Gets the input component
   */
  get input() {
    return this._inputs[0];
  }
  /**
   * Gets the source min input component
   */
  get sourceMin() {
    return this._inputs[1];
  }
  /**
   * Gets the source max input component
   */
  get sourceMax() {
    return this._inputs[2];
  }
  /**
   * Gets the target min input component
   */
  get targetMin() {
    return this._inputs[3];
  }
  /**
   * Gets the target max input component
   */
  get targetMax() {
    return this._inputs[4];
  }
  /**
   * Gets the output component
   */
  get output() {
    return this._outputs[0];
  }
  _buildBlock(e) {
    super._buildBlock(e);
    const t = this._outputs[0], i = this.sourceMin.isConnected ? this.sourceMin.associatedVariableName : this._writeFloat(this.sourceRange.x), s = this.sourceMax.isConnected ? this.sourceMax.associatedVariableName : this._writeFloat(this.sourceRange.y), r = this.targetMin.isConnected ? this.targetMin.associatedVariableName : this._writeFloat(this.targetRange.x), n = this.targetMax.isConnected ? this.targetMax.associatedVariableName : this._writeFloat(this.targetRange.y);
    return e.compilationString += this._declareOutput(t, e) + ` = ${r} + (${this._inputs[0].associatedVariableName} - ${i}) * (${n} - ${r}) / (${s} - ${i});
`, this;
  }
  _dumpPropertiesCode() {
    let e = super._dumpPropertiesCode() + `${this._codeVariableName}.sourceRange = new BABYLON.Vector2(${this.sourceRange.x}, ${this.sourceRange.y});
`;
    return e += `${this._codeVariableName}.targetRange = new BABYLON.Vector2(${this.targetRange.x}, ${this.targetRange.y});
`, e;
  }
  serialize() {
    const e = super.serialize();
    return e.sourceRange = this.sourceRange.asArray(), e.targetRange = this.targetRange.asArray(), e;
  }
  _deserialize(e, t, i) {
    super._deserialize(e, t, i), this.sourceRange = ve.FromArray(e.sourceRange), this.targetRange = ve.FromArray(e.targetRange);
  }
}
b([
  Je("From", xe.Vector2)
], pt.prototype, "sourceRange", void 0);
b([
  Je("To", xe.Vector2)
], pt.prototype, "targetRange", void 0);
q("BABYLON.RemapBlock", pt);
class dr extends oe {
  constructor(e) {
    super(e, p.Neutral), this.registerInput("left", u.AutoDetect), this.registerInput("right", u.AutoDetect), this.registerOutput("output", u.BasedOnInput), this.output._typeConnectionSource = this.left, this._linkConnectionTypes(0, 1, !0), this.left.acceptedConnectionPointTypes.push(u.Float), this.right.acceptedConnectionPointTypes.push(u.Float), this._connectionObservers = [
      this.left.onConnectionObservable.add(() => this._updateInputOutputTypes()),
      this.left.onDisconnectionObservable.add(() => this._updateInputOutputTypes()),
      this.right.onConnectionObservable.add(() => this._updateInputOutputTypes()),
      this.right.onDisconnectionObservable.add(() => this._updateInputOutputTypes())
    ];
  }
  /**
   * Gets the left operand input component
   */
  get left() {
    return this._inputs[0];
  }
  /**
   * Gets the right operand input component
   */
  get right() {
    return this._inputs[1];
  }
  /**
   * Gets the output component
   */
  get output() {
    return this._outputs[0];
  }
  _updateInputOutputTypes() {
    if (this.output._typeConnectionSource = this.left, this.left.isConnected && this.right.isConnected ? (this.left.type === u.Int || this.left.type === u.Float && this.right.type !== u.Int) && (this.output._typeConnectionSource = this.right) : this.left.isConnected !== this.right.isConnected && (this.output._typeConnectionSource = this.left.isConnected ? this.left : this.right), this.left.isConnected || this.right.isConnected)
      for (const [e, t] of [
        [this.left, this.right],
        [this.right, this.left]
      ])
        e.acceptedConnectionPointTypes = [u.Int, u.Float], t.isConnected && (e.acceptedConnectionPointTypes.push(t.type), (t.type === u.Int || t.type === u.Float) && e.acceptedConnectionPointTypes.push(u.Vector2, u.Vector3, u.Vector4, u.Color3, u.Color4, u.Matrix));
  }
  /**
   * Release resources
   */
  dispose() {
    super.dispose(), this._connectionObservers.forEach((e) => e.remove()), this._connectionObservers.length = 0;
  }
}
class Dt extends dr {
  /**
   * Creates a new MultiplyBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e);
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "MultiplyBlock";
  }
  _buildBlock(e) {
    return super._buildBlock(e), e.compilationString += this._declareOutput(this.output, e) + ` = ${this.left.associatedVariableName} * ${this.right.associatedVariableName};
`, this;
  }
}
q("BABYLON.MultiplyBlock", Dt);
var se;
(function(a) {
  a[a.Material = 0] = "Material", a[a.PostProcess = 1] = "PostProcess", a[a.Particle = 2] = "Particle", a[a.ProceduralTexture = 3] = "ProceduralTexture";
})(se || (se = {}));
class Fi extends oe {
  /**
   * Create a new ColorSplitterBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Neutral), this.registerInput("rgba", u.Color4, !0), this.registerInput("rgb ", u.Color3, !0), this.registerOutput("rgb", u.Color3), this.registerOutput("r", u.Float), this.registerOutput("g", u.Float), this.registerOutput("b", u.Float), this.registerOutput("a", u.Float), this.inputsAreExclusive = !0;
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "ColorSplitterBlock";
  }
  /**
   * Gets the rgba component (input)
   */
  get rgba() {
    return this._inputs[0];
  }
  /**
   * Gets the rgb component (input)
   */
  get rgbIn() {
    return this._inputs[1];
  }
  /**
   * Gets the rgb component (output)
   */
  get rgbOut() {
    return this._outputs[0];
  }
  /**
   * Gets the r component (output)
   */
  get r() {
    return this._outputs[1];
  }
  /**
   * Gets the g component (output)
   */
  get g() {
    return this._outputs[2];
  }
  /**
   * Gets the b component (output)
   */
  get b() {
    return this._outputs[3];
  }
  /**
   * Gets the a component (output)
   */
  get a() {
    return this._outputs[4];
  }
  _inputRename(e) {
    return e === "rgb " ? "rgbIn" : e;
  }
  _outputRename(e) {
    return e === "rgb" ? "rgbOut" : e;
  }
  _buildBlock(e) {
    super._buildBlock(e);
    const t = this.rgba.isConnected ? this.rgba : this.rgbIn;
    if (!t.isConnected)
      return;
    const i = this._outputs[0], s = this._outputs[1], r = this._outputs[2], n = this._outputs[3], o = this._outputs[4];
    return i.hasEndpoints && (e.compilationString += this._declareOutput(i, e) + ` = ${t.associatedVariableName}.rgb;
`), s.hasEndpoints && (e.compilationString += this._declareOutput(s, e) + ` = ${t.associatedVariableName}.r;
`), r.hasEndpoints && (e.compilationString += this._declareOutput(r, e) + ` = ${t.associatedVariableName}.g;
`), n.hasEndpoints && (e.compilationString += this._declareOutput(n, e) + ` = ${t.associatedVariableName}.b;
`), o.hasEndpoints && (e.compilationString += this._declareOutput(o, e) + ` = ${t.associatedVariableName}.a;
`), this;
  }
}
q("BABYLON.ColorSplitterBlock", Fi);
class fr {
  /**
   * Creates a new instance of the component for the given scene
   * @param scene Defines the scene to register the component in
   */
  constructor(e) {
    this.name = It.NAME_PROCEDURALTEXTURE, this.scene = e, this.scene.proceduralTextures = [];
  }
  /**
   * Registers the component in a given scene
   */
  register() {
    this.scene._beforeClearStage.registerStep(It.STEP_BEFORECLEAR_PROCEDURALTEXTURE, this, this._beforeClear);
  }
  /**
   * Rebuilds the elements related to this component in case of
   * context lost for instance.
   */
  rebuild() {
  }
  /**
   * Disposes the component and the associated resources.
   */
  dispose() {
  }
  _beforeClear() {
    if (this.scene.proceduralTexturesEnabled) {
      B.StartPerformanceCounter("Procedural textures", this.scene.proceduralTextures.length > 0);
      for (let e = 0; e < this.scene.proceduralTextures.length; e++) {
        const t = this.scene.proceduralTextures[e];
        t._shouldRender() && t.render();
      }
      B.EndPerformanceCounter("Procedural textures", this.scene.proceduralTextures.length > 0);
    }
  }
}
const pr = "proceduralVertexShader", _r = `attribute vec2 position;varying vec2 vPosition;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vPosition=position;vUV=position*madd+madd;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;
We.ShadersStore[pr] = _r;
class Se extends L {
  /**
   * Instantiates a new procedural texture.
   * Procedural texturing is a way to programmatically create a texture. There are 2 types of procedural textures: code-only, and code that references some classic 2D images, sometimes called 'refMaps' or 'sampler' images.
   * This is the base class of any Procedural texture and contains most of the shareable code.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/proceduralTextures
   * @param name  Define the name of the texture
   * @param size Define the size of the texture to create
   * @param fragment Define the fragment shader to use to generate the texture or null if it is defined later:
   *  * object: \{ fragmentElement: "fragmentShaderCode" \}, used with shader code in script tags
   *  * object: \{ fragmentSource: "fragment shader code string" \}, the string contains the shader code
   *  * string: the string contains a name "XXX" to lookup in Effect.ShadersStore["XXXFragmentShader"]
   * @param scene Define the scene the texture belongs to
   * @param fallbackTexture Define a fallback texture in case there were issues to create the custom texture
   * @param generateMipMaps Define if the texture should creates mip maps or not
   * @param isCube Define if the texture is a cube texture or not (this will render each faces of the cube)
   * @param textureType The FBO internal texture type
   */
  constructor(e, t, i, s, r = null, n = !0, o = !1, l = 0) {
    super(null, s, !n), this.isEnabled = !0, this.autoClear = !0, this.onGeneratedObservable = new x(), this.onBeforeGenerationObservable = new x(), this.nodeMaterialSource = null, this._textures = {}, this._currentRefreshId = -1, this._frameId = -1, this._refreshRate = 1, this._vertexBuffers = {}, this._uniforms = new Array(), this._samplers = new Array(), this._floats = {}, this._ints = {}, this._floatsArrays = {}, this._colors3 = {}, this._colors4 = {}, this._vectors2 = {}, this._vectors3 = {}, this._matrices = {}, this._fallbackTextureUsed = !1, this._cachedDefines = null, this._contentUpdateId = -1, this._rtWrapper = null, r !== null && !(r instanceof L) ? (this._options = r, this._fallbackTexture = r.fallbackTexture ?? null) : (this._options = {}, this._fallbackTexture = r), s = this.getScene() || He.LastCreatedScene;
    let h = s._getComponent(It.NAME_PROCEDURALTEXTURE);
    h || (h = new fr(s), s._addComponent(h)), s.proceduralTextures.push(this), this._fullEngine = s.getEngine(), this.name = e, this.isRenderTarget = !0, this._size = t, this._textureType = l, this._generateMipMaps = n, this._drawWrapper = new Hi(this._fullEngine), this.setFragment(i);
    const c = this._createRtWrapper(o, t, n, l);
    this._texture = c.texture;
    const d = [];
    d.push(1, 1), d.push(-1, 1), d.push(-1, -1), d.push(1, -1), this._vertexBuffers[j.PositionKind] = new j(this._fullEngine, d, j.PositionKind, !1, !1, 2), this._createIndexBuffer();
  }
  _createRtWrapper(e, t, i, s) {
    return e ? (this._rtWrapper = this._fullEngine.createRenderTargetCubeTexture(t, {
      generateMipMaps: i,
      generateDepthBuffer: !1,
      generateStencilBuffer: !1,
      type: s,
      ...this._options
    }), this.setFloat("face", 0)) : this._rtWrapper = this._fullEngine.createRenderTargetTexture(t, {
      generateMipMaps: i,
      generateDepthBuffer: !1,
      generateStencilBuffer: !1,
      type: s,
      ...this._options
    }), this._rtWrapper;
  }
  /**
   * The effect that is created when initializing the post process.
   * @returns The created effect corresponding the postprocess.
   */
  getEffect() {
    return this._drawWrapper.effect;
  }
  /**
   * @internal
   */
  _setEffect(e) {
    this._drawWrapper.effect = e;
  }
  /**
   * Gets texture content (Use this function wisely as reading from a texture can be slow)
   * @returns an ArrayBufferView promise (Uint8Array or Float32Array)
   */
  getContent() {
    return this._contentData && this._frameId === this._contentUpdateId ? this._contentData : (this._contentData ? this._contentData.then((e) => {
      this._contentData = this.readPixels(0, 0, e), this._contentUpdateId = this._frameId;
    }) : (this._contentData = this.readPixels(0, 0), this._contentUpdateId = this._frameId), this._contentData);
  }
  _createIndexBuffer() {
    const e = this._fullEngine, t = [];
    t.push(0), t.push(1), t.push(2), t.push(0), t.push(2), t.push(3), this._indexBuffer = e.createIndexBuffer(t);
  }
  /** @internal */
  _rebuild() {
    const e = this._vertexBuffers[j.PositionKind];
    e && e._rebuild(), this._createIndexBuffer(), this.refreshRate === vt.REFRESHRATE_RENDER_ONCE && (this.refreshRate = vt.REFRESHRATE_RENDER_ONCE);
  }
  /**
   * Resets the texture in order to recreate its associated resources.
   * This can be called in case of context loss or if you change the shader code and need to regenerate the texture with the new code
   */
  reset() {
    this._drawWrapper.effect?.dispose(), this._drawWrapper.effect = null, this._cachedDefines = null;
  }
  _getDefines() {
    return "";
  }
  /**
   * Executes a function when the texture will be ready to be drawn.
   * @param func The callback to be used.
   */
  executeWhenReady(e) {
    if (this.isReady()) {
      e(this);
      return;
    }
    const t = this.getEffect();
    t && t.executeWhenCompiled(() => {
      e(this);
    });
  }
  /**
   * Is the texture ready to be used ? (rendered at least once)
   * @returns true if ready, otherwise, false.
   */
  isReady() {
    const e = this._fullEngine;
    if (this.nodeMaterialSource)
      return this._drawWrapper.effect.isReady();
    if (!this._fragment)
      return !1;
    if (this._fallbackTextureUsed)
      return !0;
    if (!this._texture)
      return !1;
    const t = this._getDefines();
    if (this._drawWrapper.effect && t === this._cachedDefines && this._drawWrapper.effect.isReady())
      return !0;
    const i = {
      vertex: "procedural",
      fragmentElement: this._fragment.fragmentElement,
      fragmentSource: this._fragment.fragmentSource,
      fragment: typeof this._fragment == "string" ? this._fragment : void 0
    };
    return this._cachedDefines !== t && (this._cachedDefines = t, this._drawWrapper.effect = e.createEffect(i, [j.PositionKind], this._uniforms, this._samplers, t, void 0, void 0, () => {
      this._rtWrapper?.dispose(), this._rtWrapper = this._texture = null, this._fallbackTexture && (this._texture = this._fallbackTexture._texture, this._texture && this._texture.incrementReferences()), this._fallbackTextureUsed = !0;
    })), this._drawWrapper.effect.isReady();
  }
  /**
   * Resets the refresh counter of the texture and start bak from scratch.
   * Could be useful to regenerate the texture if it is setup to render only once.
   */
  resetRefreshCounter() {
    this._currentRefreshId = -1;
  }
  /**
   * Set the fragment shader to use in order to render the texture.
   * @param fragment This can be set to a path (into the shader store) or to a json object containing a fragmentElement property.
   */
  setFragment(e) {
    this._fragment = e;
  }
  /**
   * Define the refresh rate of the texture or the rendering frequency.
   * Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
   */
  get refreshRate() {
    return this._refreshRate;
  }
  set refreshRate(e) {
    this._refreshRate = e, this.resetRefreshCounter();
  }
  /** @internal */
  _shouldRender() {
    return !this.isEnabled || !this.isReady() || !this._texture ? (this._texture && (this._texture.isReady = !1), !1) : this._fallbackTextureUsed ? !1 : this._currentRefreshId === -1 ? (this._currentRefreshId = 1, this._frameId++, !0) : this.refreshRate === this._currentRefreshId ? (this._currentRefreshId = 1, this._frameId++, !0) : (this._currentRefreshId++, !1);
  }
  /**
   * Get the size the texture is rendering at.
   * @returns the size (on cube texture it is always squared)
   */
  getRenderSize() {
    return this._size;
  }
  /**
   * Resize the texture to new value.
   * @param size Define the new size the texture should have
   * @param generateMipMaps Define whether the new texture should create mip maps
   */
  resize(e, t) {
    if (this._fallbackTextureUsed || !this._rtWrapper || !this._texture)
      return;
    const i = this._texture.isCube;
    this._rtWrapper.dispose();
    const s = this._createRtWrapper(i, e, t, this._textureType);
    this._texture = s.texture, this._size = e, this._generateMipMaps = t;
  }
  _checkUniform(e) {
    this._uniforms.indexOf(e) === -1 && this._uniforms.push(e);
  }
  /**
   * Set a texture in the shader program used to render.
   * @param name Define the name of the uniform samplers as defined in the shader
   * @param texture Define the texture to bind to this sampler
   * @returns the texture itself allowing "fluent" like uniform updates
   */
  setTexture(e, t) {
    return this._samplers.indexOf(e) === -1 && this._samplers.push(e), this._textures[e] = t, this;
  }
  /**
   * Set a float in the shader.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the texture itself allowing "fluent" like uniform updates
   */
  setFloat(e, t) {
    return this._checkUniform(e), this._floats[e] = t, this;
  }
  /**
   * Set a int in the shader.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the texture itself allowing "fluent" like uniform updates
   */
  setInt(e, t) {
    return this._checkUniform(e), this._ints[e] = t, this;
  }
  /**
   * Set an array of floats in the shader.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the texture itself allowing "fluent" like uniform updates
   */
  setFloats(e, t) {
    return this._checkUniform(e), this._floatsArrays[e] = t, this;
  }
  /**
   * Set a vec3 in the shader from a Color3.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the texture itself allowing "fluent" like uniform updates
   */
  setColor3(e, t) {
    return this._checkUniform(e), this._colors3[e] = t, this;
  }
  /**
   * Set a vec4 in the shader from a Color4.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the texture itself allowing "fluent" like uniform updates
   */
  setColor4(e, t) {
    return this._checkUniform(e), this._colors4[e] = t, this;
  }
  /**
   * Set a vec2 in the shader from a Vector2.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the texture itself allowing "fluent" like uniform updates
   */
  setVector2(e, t) {
    return this._checkUniform(e), this._vectors2[e] = t, this;
  }
  /**
   * Set a vec3 in the shader from a Vector3.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the texture itself allowing "fluent" like uniform updates
   */
  setVector3(e, t) {
    return this._checkUniform(e), this._vectors3[e] = t, this;
  }
  /**
   * Set a mat4 in the shader from a MAtrix.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the texture itself allowing "fluent" like uniform updates
   */
  setMatrix(e, t) {
    return this._checkUniform(e), this._matrices[e] = t, this;
  }
  /**
   * Render the texture to its associated render target.
   * @param useCameraPostProcess Define if camera post process should be applied to the texture
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(e) {
    const t = this.getScene();
    if (!t)
      return;
    const i = this._fullEngine;
    if (i.enableEffect(this._drawWrapper), this.onBeforeGenerationObservable.notifyObservers(this), i.setState(!1), !this.nodeMaterialSource) {
      for (const r in this._textures)
        this._drawWrapper.effect.setTexture(r, this._textures[r]);
      for (const r in this._ints)
        this._drawWrapper.effect.setInt(r, this._ints[r]);
      for (const r in this._floats)
        this._drawWrapper.effect.setFloat(r, this._floats[r]);
      for (const r in this._floatsArrays)
        this._drawWrapper.effect.setArray(r, this._floatsArrays[r]);
      for (const r in this._colors3)
        this._drawWrapper.effect.setColor3(r, this._colors3[r]);
      for (const r in this._colors4) {
        const n = this._colors4[r];
        this._drawWrapper.effect.setFloat4(r, n.r, n.g, n.b, n.a);
      }
      for (const r in this._vectors2)
        this._drawWrapper.effect.setVector2(r, this._vectors2[r]);
      for (const r in this._vectors3)
        this._drawWrapper.effect.setVector3(r, this._vectors3[r]);
      for (const r in this._matrices)
        this._drawWrapper.effect.setMatrix(r, this._matrices[r]);
    }
    if (!this._texture || !this._rtWrapper)
      return;
    i._debugPushGroup?.(`procedural texture generation for ${this.name}`, 1);
    const s = i.currentViewport;
    if (this.isCube)
      for (let r = 0; r < 6; r++)
        i.bindFramebuffer(this._rtWrapper, r, void 0, void 0, !0), i.bindBuffers(this._vertexBuffers, this._indexBuffer, this._drawWrapper.effect), this._drawWrapper.effect.setFloat("face", r), this.autoClear && i.clear(t.clearColor, !0, !1, !1), i.drawElementsType(Ot.TriangleFillMode, 0, 6);
    else
      i.bindFramebuffer(this._rtWrapper, 0, void 0, void 0, !0), i.bindBuffers(this._vertexBuffers, this._indexBuffer, this._drawWrapper.effect), this.autoClear && i.clear(t.clearColor, !0, !1, !1), i.drawElementsType(Ot.TriangleFillMode, 0, 6);
    i.unBindFramebuffer(this._rtWrapper, this.isCube), s && i.setViewport(s), this.isCube && i.generateMipMapsForCubemap(this._texture), i._debugPopGroup?.(1), this.onGenerated && this.onGenerated(), this.onGeneratedObservable.notifyObservers(this);
  }
  /**
   * Clone the texture.
   * @returns the cloned texture
   */
  clone() {
    const e = this.getSize(), t = new Se(this.name, e.width, this._fragment, this.getScene(), this._fallbackTexture, this._generateMipMaps);
    return t.hasAlpha = this.hasAlpha, t.level = this.level, t.coordinatesMode = this.coordinatesMode, t;
  }
  /**
   * Dispose the texture and release its associated resources.
   */
  dispose() {
    const e = this.getScene();
    if (!e)
      return;
    const t = e.proceduralTextures.indexOf(this);
    t >= 0 && e.proceduralTextures.splice(t, 1);
    const i = this._vertexBuffers[j.PositionKind];
    i && (i.dispose(), this._vertexBuffers[j.PositionKind] = null), this._indexBuffer && this._fullEngine._releaseBuffer(this._indexBuffer) && (this._indexBuffer = null), this.onGeneratedObservable.clear(), this.onBeforeGenerationObservable.clear(), super.dispose();
  }
}
b([
  D()
], Se.prototype, "isEnabled", void 0);
b([
  D()
], Se.prototype, "autoClear", void 0);
b([
  D()
], Se.prototype, "_generateMipMaps", void 0);
b([
  D()
], Se.prototype, "_size", void 0);
b([
  D()
], Se.prototype, "refreshRate", null);
q("BABYLON.ProceduralTexture", Se);
var G;
(function(a) {
  a[a.Cos = 0] = "Cos", a[a.Sin = 1] = "Sin", a[a.Abs = 2] = "Abs", a[a.Exp = 3] = "Exp", a[a.Exp2 = 4] = "Exp2", a[a.Round = 5] = "Round", a[a.Floor = 6] = "Floor", a[a.Ceiling = 7] = "Ceiling", a[a.Sqrt = 8] = "Sqrt", a[a.Log = 9] = "Log", a[a.Tan = 10] = "Tan", a[a.ArcTan = 11] = "ArcTan", a[a.ArcCos = 12] = "ArcCos", a[a.ArcSin = 13] = "ArcSin", a[a.Fract = 14] = "Fract", a[a.Sign = 15] = "Sign", a[a.Radians = 16] = "Radians", a[a.Degrees = 17] = "Degrees";
})(G || (G = {}));
class Di extends oe {
  /**
   * Creates a new TrigonometryBlock
   * @param name defines the block name
   */
  constructor(e) {
    super(e, p.Neutral), this.operation = G.Cos, this.registerInput("input", u.AutoDetect), this.registerOutput("output", u.BasedOnInput), this._outputs[0]._typeConnectionSource = this._inputs[0];
  }
  /**
   * Gets the current class name
   * @returns the class name
   */
  getClassName() {
    return "TrigonometryBlock";
  }
  /**
   * Gets the input component
   */
  get input() {
    return this._inputs[0];
  }
  /**
   * Gets the output component
   */
  get output() {
    return this._outputs[0];
  }
  _buildBlock(e) {
    super._buildBlock(e);
    const t = this._outputs[0];
    let i = "";
    switch (this.operation) {
      case G.Cos: {
        i = "cos";
        break;
      }
      case G.Sin: {
        i = "sin";
        break;
      }
      case G.Abs: {
        i = "abs";
        break;
      }
      case G.Exp: {
        i = "exp";
        break;
      }
      case G.Exp2: {
        i = "exp2";
        break;
      }
      case G.Round: {
        i = "round";
        break;
      }
      case G.Floor: {
        i = "floor";
        break;
      }
      case G.Ceiling: {
        i = "ceil";
        break;
      }
      case G.Sqrt: {
        i = "sqrt";
        break;
      }
      case G.Log: {
        i = "log";
        break;
      }
      case G.Tan: {
        i = "tan";
        break;
      }
      case G.ArcTan: {
        i = "atan";
        break;
      }
      case G.ArcCos: {
        i = "acos";
        break;
      }
      case G.ArcSin: {
        i = "asin";
        break;
      }
      case G.Fract: {
        i = "fract";
        break;
      }
      case G.Sign: {
        i = "sign";
        break;
      }
      case G.Radians: {
        i = "radians";
        break;
      }
      case G.Degrees: {
        i = "degrees";
        break;
      }
    }
    return e.compilationString += this._declareOutput(t, e) + ` = ${i}(${this.input.associatedVariableName});
`, this;
  }
  serialize() {
    const e = super.serialize();
    return e.operation = this.operation, e;
  }
  _deserialize(e, t, i) {
    super._deserialize(e, t, i), this.operation = e.operation;
  }
  _dumpPropertiesCode() {
    return super._dumpPropertiesCode() + `${this._codeVariableName}.operation = BABYLON.TrigonometryBlockOperations.${G[this.operation]};
`;
  }
}
q("BABYLON.TrigonometryBlock", Di);
const Pt = { effect: null, subMesh: null };
class rt extends yi {
  /**
   * Creates a new NodeMaterialDefines
   */
  constructor() {
    super(), this.NORMAL = !1, this.TANGENT = !1, this.VERTEXCOLOR_NME = !1, this.UV1 = !1, this.UV2 = !1, this.UV3 = !1, this.UV4 = !1, this.UV5 = !1, this.UV6 = !1, this.PREPASS = !1, this.PREPASS_NORMAL = !1, this.PREPASS_NORMAL_INDEX = -1, this.PREPASS_POSITION = !1, this.PREPASS_POSITION_INDEX = -1, this.PREPASS_DEPTH = !1, this.PREPASS_DEPTH_INDEX = -1, this.SCENE_MRT_COUNT = 0, this.NUM_BONE_INFLUENCERS = 0, this.BonesPerMesh = 0, this.BONETEXTURE = !1, this.MORPHTARGETS = !1, this.MORPHTARGETS_NORMAL = !1, this.MORPHTARGETS_TANGENT = !1, this.MORPHTARGETS_UV = !1, this.NUM_MORPH_INFLUENCERS = 0, this.MORPHTARGETS_TEXTURE = !1, this.IMAGEPROCESSING = !1, this.VIGNETTE = !1, this.VIGNETTEBLENDMODEMULTIPLY = !1, this.VIGNETTEBLENDMODEOPAQUE = !1, this.TONEMAPPING = !1, this.TONEMAPPING_ACES = !1, this.CONTRAST = !1, this.EXPOSURE = !1, this.COLORCURVES = !1, this.COLORGRADING = !1, this.COLORGRADING3D = !1, this.SAMPLER3DGREENDEPTH = !1, this.SAMPLER3DBGRMAP = !1, this.DITHER = !1, this.IMAGEPROCESSINGPOSTPROCESS = !1, this.SKIPFINALCOLORCLAMP = !1, this.BUMPDIRECTUV = 0, this.CAMERA_ORTHOGRAPHIC = !1, this.CAMERA_PERSPECTIVE = !1, this.rebuild();
  }
  /**
   * Set the value of a specific key
   * @param name defines the name of the key to set
   * @param value defines the value to set
   * @param markAsUnprocessedIfDirty Flag to indicate to the cache that this value needs processing
   */
  setValue(e, t, i = !1) {
    this[e] === void 0 && this._keys.push(e), i && this[e] !== t && this.markAsUnprocessed(), this[e] = t;
  }
}
class V extends Si {
  /**
   * Checks if a block is a texture block
   * @param block The block to check
   * @returns True if the block is a texture block
   */
  static _BlockIsTextureBlock(e) {
    return e.getClassName() === "TextureBlock" || e.getClassName() === "ReflectionTextureBaseBlock" || e.getClassName() === "ReflectionTextureBlock" || e.getClassName() === "ReflectionBlock" || e.getClassName() === "RefractionBlock" || e.getClassName() === "CurrentScreenBlock" || e.getClassName() === "ParticleTextureBlock" || e.getClassName() === "ImageSourceBlock" || e.getClassName() === "TriPlanarBlock" || e.getClassName() === "BiPlanarBlock" || e.getClassName() === "PrePassTextureBlock";
  }
  /** Get the inspector from bundle or global
   * @returns the global NME
   */
  _getGlobalNodeMaterialEditor() {
    if (typeof NODEEDITOR < "u")
      return NODEEDITOR;
    if (typeof BABYLON < "u" && typeof BABYLON.NodeEditor < "u")
      return BABYLON;
  }
  /** Gets or sets options to control the node material overall behavior */
  get options() {
    return this._options;
  }
  set options(e) {
    this._options = e;
  }
  /**
   * Gets the image processing configuration used either in this material.
   */
  get imageProcessingConfiguration() {
    return this._imageProcessingConfiguration;
  }
  /**
   * Sets the Default image processing configuration used either in the this material.
   *
   * If sets to null, the scene one is in use.
   */
  set imageProcessingConfiguration(e) {
    this._attachImageProcessingConfiguration(e), this._markAllSubMeshesAsTexturesDirty();
  }
  /**
   * Gets or sets the mode property
   */
  get mode() {
    return this._mode;
  }
  set mode(e) {
    this._mode = e;
  }
  /** Gets or sets the unique identifier used to identified the effect associated with the material */
  get buildId() {
    return this._buildId;
  }
  set buildId(e) {
    this._buildId = e;
  }
  /**
   * Create a new node based material
   * @param name defines the material name
   * @param scene defines the hosting scene
   * @param options defines creation option
   */
  constructor(e, t, i = {}) {
    super(e, t || He.LastCreatedScene), this._buildId = V._BuildIdGenerator++, this._buildWasSuccessful = !1, this._cachedWorldViewMatrix = new ce(), this._cachedWorldViewProjectionMatrix = new ce(), this._optimizers = new Array(), this._animationFrame = -1, this.BJSNODEMATERIALEDITOR = this._getGlobalNodeMaterialEditor(), this.editorData = null, this.ignoreAlpha = !1, this.maxSimultaneousLights = 4, this.onBuildObservable = new x(), this._vertexOutputNodes = new Array(), this._fragmentOutputNodes = new Array(), this.attachedBlocks = [], this._mode = se.Material, this.forceAlphaBlending = !1, this._options = {
      emitComments: !1,
      ...i
    }, this._attachImageProcessingConfiguration(null);
  }
  /**
   * Gets the current class name of the material e.g. "NodeMaterial"
   * @returns the class name
   */
  getClassName() {
    return "NodeMaterial";
  }
  /**
   * Attaches a new image processing configuration to the Standard Material.
   * @param configuration
   */
  _attachImageProcessingConfiguration(e) {
    e !== this._imageProcessingConfiguration && (this._imageProcessingConfiguration && this._imageProcessingObserver && this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver), e ? this._imageProcessingConfiguration = e : this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration, this._imageProcessingConfiguration && (this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
      this._markAllSubMeshesAsImageProcessingDirty();
    })));
  }
  /**
   * Get a block by its name
   * @param name defines the name of the block to retrieve
   * @returns the required block or null if not found
   */
  getBlockByName(e) {
    let t = null;
    for (const i of this.attachedBlocks)
      if (i.name === e)
        if (!t)
          t = i;
        else
          return B.Warn("More than one block was found with the name `" + e + "`"), t;
    return t;
  }
  /**
   * Get a block using a predicate
   * @param predicate defines the predicate used to find the good candidate
   * @returns the required block or null if not found
   */
  getBlockByPredicate(e) {
    for (const t of this.attachedBlocks)
      if (e(t))
        return t;
    return null;
  }
  /**
   * Get an input block using a predicate
   * @param predicate defines the predicate used to find the good candidate
   * @returns the required input block or null if not found
   */
  getInputBlockByPredicate(e) {
    for (const t of this.attachedBlocks)
      if (t.isInput && e(t))
        return t;
    return null;
  }
  /**
   * Gets the list of input blocks attached to this material
   * @returns an array of InputBlocks
   */
  getInputBlocks() {
    const e = [];
    for (const t of this.attachedBlocks)
      t.isInput && e.push(t);
    return e;
  }
  /**
   * Adds a new optimizer to the list of optimizers
   * @param optimizer defines the optimizers to add
   * @returns the current material
   */
  registerOptimizer(e) {
    if (!(this._optimizers.indexOf(e) > -1))
      return this._optimizers.push(e), this;
  }
  /**
   * Remove an optimizer from the list of optimizers
   * @param optimizer defines the optimizers to remove
   * @returns the current material
   */
  unregisterOptimizer(e) {
    const t = this._optimizers.indexOf(e);
    if (t !== -1)
      return this._optimizers.splice(t, 1), this;
  }
  /**
   * Add a new block to the list of output nodes
   * @param node defines the node to add
   * @returns the current material
   */
  addOutputNode(e) {
    if (e.target === null)
      throw "This node is not meant to be an output node. You may want to explicitly set its target value.";
    return e.target & p.Vertex && this._addVertexOutputNode(e), e.target & p.Fragment && this._addFragmentOutputNode(e), this;
  }
  /**
   * Remove a block from the list of root nodes
   * @param node defines the node to remove
   * @returns the current material
   */
  removeOutputNode(e) {
    return e.target === null ? this : (e.target & p.Vertex && this._removeVertexOutputNode(e), e.target & p.Fragment && this._removeFragmentOutputNode(e), this);
  }
  _addVertexOutputNode(e) {
    if (this._vertexOutputNodes.indexOf(e) === -1)
      return e.target = p.Vertex, this._vertexOutputNodes.push(e), this;
  }
  _removeVertexOutputNode(e) {
    const t = this._vertexOutputNodes.indexOf(e);
    if (t !== -1)
      return this._vertexOutputNodes.splice(t, 1), this;
  }
  _addFragmentOutputNode(e) {
    if (this._fragmentOutputNodes.indexOf(e) === -1)
      return e.target = p.Fragment, this._fragmentOutputNodes.push(e), this;
  }
  _removeFragmentOutputNode(e) {
    const t = this._fragmentOutputNodes.indexOf(e);
    if (t !== -1)
      return this._fragmentOutputNodes.splice(t, 1), this;
  }
  /**
   * Specifies if the material will require alpha blending
   * @returns a boolean specifying if alpha blending is needed
   */
  needAlphaBlending() {
    return this.ignoreAlpha ? !1 : this.forceAlphaBlending || this.alpha < 1 || this._sharedData && this._sharedData.hints.needAlphaBlending;
  }
  /**
   * Specifies if this material should be rendered in alpha test mode
   * @returns a boolean specifying if an alpha test is needed.
   */
  needAlphaTesting() {
    return this._sharedData && this._sharedData.hints.needAlphaTesting;
  }
  _processInitializeOnLink(e, t, i, s = !0) {
    (e.target === p.VertexAndFragment || t.target === p.Fragment && e.target === p.Vertex && e._preparationId !== this._buildId) && i.push(e), this._initializeBlock(e, t, i, s);
  }
  _initializeBlock(e, t, i, s = !0) {
    if (e.initialize(t), s && e.autoConfigure(this), e._preparationId = this._buildId, this.attachedBlocks.indexOf(e) === -1) {
      if (e.isUnique) {
        const r = e.getClassName();
        for (const n of this.attachedBlocks)
          if (n.getClassName() === r)
            throw `Cannot have multiple blocks of type ${r} in the same NodeMaterial`;
      }
      this.attachedBlocks.push(e);
    }
    for (const r of e.inputs) {
      r.associatedVariableName = "";
      const n = r.connectedPoint;
      if (n) {
        const o = n.ownerBlock;
        o !== e && this._processInitializeOnLink(o, t, i, s);
      }
    }
    if (e.isTeleportOut) {
      const r = e;
      r.entryPoint && this._processInitializeOnLink(r.entryPoint, t, i, s);
    }
    for (const r of e.outputs)
      r.associatedVariableName = "";
  }
  _resetDualBlocks(e, t) {
    e.target === p.VertexAndFragment && (e.buildId = t);
    for (const i of e.inputs) {
      const s = i.connectedPoint;
      if (s) {
        const r = s.ownerBlock;
        r !== e && this._resetDualBlocks(r, t);
      }
    }
    if (e.isTeleportOut) {
      const i = e;
      i.entryPoint && this._resetDualBlocks(i.entryPoint, t);
    }
  }
  /**
   * Remove a block from the current node material
   * @param block defines the block to remove
   */
  removeBlock(e) {
    const t = this.attachedBlocks.indexOf(e);
    t > -1 && this.attachedBlocks.splice(t, 1), e.isFinalMerger && this.removeOutputNode(e);
  }
  /**
   * Build the material and generates the inner effect
   * @param verbose defines if the build should log activity
   * @param updateBuildId defines if the internal build Id should be updated (default is true)
   * @param autoConfigure defines if the autoConfigure method should be called when initializing blocks (default is false)
   */
  build(e = !1, t = !0, i = !1) {
    !this._vertexCompilationState && !i && (i = !0), this._buildWasSuccessful = !1;
    const s = this.getScene().getEngine(), r = this._mode === se.Particle;
    if (this._vertexOutputNodes.length === 0 && !r)
      throw "You must define at least one vertexOutputNode";
    if (this._fragmentOutputNodes.length === 0)
      throw "You must define at least one fragmentOutputNode";
    this._vertexCompilationState = new ui(), this._vertexCompilationState.supportUniformBuffers = s.supportsUniformBuffers, this._vertexCompilationState.target = p.Vertex, this._fragmentCompilationState = new ui(), this._fragmentCompilationState.supportUniformBuffers = s.supportsUniformBuffers, this._fragmentCompilationState.target = p.Fragment, this._sharedData = new cr(), this._sharedData.nodeMaterial = this, this._sharedData.fragmentOutputNodes = this._fragmentOutputNodes, this._vertexCompilationState.sharedData = this._sharedData, this._fragmentCompilationState.sharedData = this._sharedData, this._sharedData.buildId = this._buildId, this._sharedData.emitComments = this._options.emitComments, this._sharedData.verbose = e, this._sharedData.scene = this.getScene(), this._sharedData.allowEmptyVertexProgram = r;
    const n = [], o = [];
    for (const c of this._vertexOutputNodes)
      n.push(c), this._initializeBlock(c, this._vertexCompilationState, o, i);
    for (const c of this._fragmentOutputNodes)
      o.push(c), this._initializeBlock(c, this._fragmentCompilationState, n, i);
    this.optimize();
    for (const c of n)
      c.build(this._vertexCompilationState, n);
    this._fragmentCompilationState.uniforms = this._vertexCompilationState.uniforms.slice(0), this._fragmentCompilationState._uniformDeclaration = this._vertexCompilationState._uniformDeclaration, this._fragmentCompilationState._constantDeclaration = this._vertexCompilationState._constantDeclaration, this._fragmentCompilationState._vertexState = this._vertexCompilationState;
    for (const c of o)
      this._resetDualBlocks(c, this._buildId - 1);
    for (const c of o)
      c.build(this._fragmentCompilationState, o);
    this._vertexCompilationState.finalize(this._vertexCompilationState), this._fragmentCompilationState.finalize(this._fragmentCompilationState), t && (this._buildId = V._BuildIdGenerator++), this._sharedData.emitErrors(), e && (R.Log("Vertex shader:"), R.Log(this._vertexCompilationState.compilationString), R.Log("Fragment shader:"), R.Log(this._fragmentCompilationState.compilationString)), this._buildWasSuccessful = !0, this.onBuildObservable.notifyObservers(this);
    const l = this.getScene().meshes;
    for (const c of l)
      if (c.subMeshes)
        for (const d of c.subMeshes) {
          if (d.getMaterial() !== this || !d.materialDefines)
            continue;
          const f = d.materialDefines;
          f.markAllAsDirty(), f.reset();
        }
    this.prePassTextureInputs.length && this.getScene().enablePrePassRenderer();
    const h = this.getScene().prePassRenderer;
    h && h.markAsDirty();
  }
  /**
   * Runs an otpimization phase to try to improve the shader code
   */
  optimize() {
    for (const e of this._optimizers)
      e.optimize(this._vertexOutputNodes, this._fragmentOutputNodes);
  }
  _prepareDefinesForAttributes(e, t) {
    const i = t.NORMAL, s = t.TANGENT, r = t.VERTEXCOLOR_NME;
    t.NORMAL = e.isVerticesDataPresent(j.NormalKind), t.TANGENT = e.isVerticesDataPresent(j.TangentKind);
    const n = e.useVertexColors && e.isVerticesDataPresent(j.ColorKind);
    t.VERTEXCOLOR_NME = n;
    let o = !1;
    for (let h = 1; h <= 6; ++h) {
      const c = t["UV" + h];
      t["UV" + h] = e.isVerticesDataPresent(`uv${h === 1 ? "" : h}`), o = o || t["UV" + h] !== c;
    }
    const l = this.needAlphaBlendingForMesh(e) && this.getScene().useOrderIndependentTransparency;
    ps(this.getScene(), t, !l), (i !== t.NORMAL || s !== t.TANGENT || r !== t.VERTEXCOLOR_NME || o) && t.markAsAttributesDirty();
  }
  /**
   * Can this material render to prepass
   */
  get isPrePassCapable() {
    return !0;
  }
  /**
   * Outputs written to the prepass
   */
  get prePassTextureOutputs() {
    const e = this.getBlockByPredicate((i) => i.getClassName() === "PrePassOutputBlock"), t = [4];
    return !e || this.prePassTextureInputs.length || (e.viewDepth.isConnected && t.push(5), e.viewNormal.isConnected && t.push(6), e.worldPosition.isConnected && t.push(1)), t;
  }
  /**
   * Gets the list of prepass texture required
   */
  get prePassTextureInputs() {
    const e = this.getAllTextureBlocks().filter((i) => i.getClassName() === "PrePassTextureBlock"), t = [];
    for (const i of e)
      i.position.isConnected && !t.includes(1) && t.push(1), i.depth.isConnected && !t.includes(5) && t.push(5), i.normal.isConnected && !t.includes(6) && t.push(6);
    return t;
  }
  /**
   * Sets the required values to the prepass renderer.
   * @param prePassRenderer defines the prepass renderer to set
   * @returns true if the pre pass is needed
   */
  setPrePassRenderer(e) {
    const t = this.prePassTextureInputs.concat(this.prePassTextureOutputs);
    if (e && t.length > 1) {
      let i = e.getEffectConfiguration("nodeMaterial");
      i || (i = e.addEffectConfiguration({
        enabled: !0,
        needsImageProcessing: !1,
        name: "nodeMaterial",
        texturesRequired: []
      }));
      for (const s of t)
        i.texturesRequired.includes(s) || i.texturesRequired.push(s);
      i.enabled = !0;
    }
    return t.length > 1;
  }
  /**
   * Create a post process from the material
   * @param camera The camera to apply the render pass to.
   * @param options The required width/height ratio to downsize to before computing the render pass. (Use 1.0 for full size)
   * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
   * @param engine The engine which the post process will be applied. (default: current engine)
   * @param reusable If the post process can be reused on the same frame. (default: false)
   * @param textureType Type of textures used when performing the post process. (default: 0)
   * @param textureFormat Format of textures used when performing the post process. (default: TEXTUREFORMAT_RGBA)
   * @returns the post process created
   */
  createPostProcess(e, t = 1, i = 1, s, r, n = 0, o = 5) {
    return this.mode !== se.PostProcess ? (R.Log("Incompatible material mode"), null) : this._createEffectForPostProcess(null, e, t, i, s, r, n, o);
  }
  /**
   * Create the post process effect from the material
   * @param postProcess The post process to create the effect for
   */
  createEffectForPostProcess(e) {
    this._createEffectForPostProcess(e);
  }
  _createEffectForPostProcess(e, t, i = 1, s = 1, r, n, o = 0, l = 5) {
    let h = this.name + this._buildId;
    const c = new rt(), d = new Ge(h + "PostProcess", this.getScene());
    let f = this._buildId;
    return this._processDefines(d, c), ne.RegisterShader(h, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString), e ? e.updateEffect(c.toString(), this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, { maxSimultaneousLights: this.maxSimultaneousLights }, void 0, void 0, h, h) : e = new Is(this.name + "PostProcess", h, this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, i, t, s, r, n, c.toString(), o, h, { maxSimultaneousLights: this.maxSimultaneousLights }, !1, l), e.nodeMaterialSource = this, e.onApplyObservable.add((_) => {
      f !== this._buildId && (delete ne.ShadersStore[h + "VertexShader"], delete ne.ShadersStore[h + "PixelShader"], h = this.name + this._buildId, c.markAllAsDirty(), f = this._buildId), this._processDefines(d, c) && (ne.RegisterShader(h, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString), $t.SetImmediate(() => e.updateEffect(c.toString(), this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, { maxSimultaneousLights: this.maxSimultaneousLights }, void 0, void 0, h, h))), this._checkInternals(_);
    }), e;
  }
  /**
   * Create a new procedural texture based on this node material
   * @param size defines the size of the texture
   * @param scene defines the hosting scene
   * @returns the new procedural texture attached to this node material
   */
  createProceduralTexture(e, t) {
    if (this.mode !== se.ProceduralTexture)
      return R.Log("Incompatible material mode"), null;
    let i = this.name + this._buildId;
    const s = new Se(i, e, null, t), r = new Ge(i + "Procedural", this.getScene());
    r.reservedDataStore = {
      hidden: !0
    };
    const n = new rt(), o = this._processDefines(r, n);
    ne.RegisterShader(i, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString);
    let l = this.getScene().getEngine().createEffect({
      vertexElement: i,
      fragmentElement: i
    }, [j.PositionKind], this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, n.toString(), o?.fallbacks, void 0);
    s.nodeMaterialSource = this, s._setEffect(l);
    let h = this._buildId;
    return s.onBeforeGenerationObservable.add(() => {
      h !== this._buildId && (delete ne.ShadersStore[i + "VertexShader"], delete ne.ShadersStore[i + "PixelShader"], i = this.name + this._buildId, n.markAllAsDirty(), h = this._buildId);
      const c = this._processDefines(r, n);
      c && (ne.RegisterShader(i, this._fragmentCompilationState._builtCompilationString, this._vertexCompilationState._builtCompilationString), $t.SetImmediate(() => {
        l = this.getScene().getEngine().createEffect({
          vertexElement: i,
          fragmentElement: i
        }, [j.PositionKind], this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, n.toString(), c?.fallbacks, void 0), s._setEffect(l);
      })), this._checkInternals(l);
    }), s;
  }
  _createEffectForParticles(e, t, i, s, r, n, o, l = "") {
    let h = this.name + this._buildId + "_" + t;
    n || (n = new rt()), o || (o = this.getScene().getMeshByName(this.name + "Particle"), o || (o = new Ge(this.name + "Particle", this.getScene()), o.reservedDataStore = {
      hidden: !0
    }));
    let c = this._buildId;
    const d = [];
    let f = l;
    if (!r) {
      const _ = this._processDefines(o, n);
      ne.RegisterShader(h, this._fragmentCompilationState._builtCompilationString), e.fillDefines(d, t), f = d.join(`
`), r = this.getScene().getEngine().createEffectForParticles(h, this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, n.toString() + `
` + f, _?.fallbacks, i, s, e), e.setCustomEffect(r, t);
    }
    r.onBindObservable.add((_) => {
      c !== this._buildId && (delete ne.ShadersStore[h + "PixelShader"], h = this.name + this._buildId + "_" + t, n.markAllAsDirty(), c = this._buildId), d.length = 0, e.fillDefines(d, t);
      const g = d.join(`
`);
      g !== f && (n.markAllAsDirty(), f = g);
      const S = this._processDefines(o, n);
      if (S) {
        ne.RegisterShader(h, this._fragmentCompilationState._builtCompilationString), _ = this.getScene().getEngine().createEffectForParticles(h, this._fragmentCompilationState.uniforms, this._fragmentCompilationState.samplers, n.toString() + `
` + f, S?.fallbacks, i, s, e), e.setCustomEffect(_, t), this._createEffectForParticles(e, t, i, s, _, n, o, l);
        return;
      }
      this._checkInternals(_);
    });
  }
  _checkInternals(e) {
    if (this._sharedData.animatedInputs) {
      const t = this.getScene(), i = t.getFrameId();
      if (this._animationFrame !== i) {
        for (const s of this._sharedData.animatedInputs)
          s.animate(t);
        this._animationFrame = i;
      }
    }
    for (const t of this._sharedData.bindableBlocks)
      t.bind(e, this);
    for (const t of this._sharedData.inputBlocks)
      t._transmit(e, this.getScene(), this);
  }
  /**
   * Create the effect to be used as the custom effect for a particle system
   * @param particleSystem Particle system to create the effect for
   * @param onCompiled defines a function to call when the effect creation is successful
   * @param onError defines a function to call when the effect creation has failed
   */
  createEffectForParticles(e, t, i) {
    if (this.mode !== se.Particle) {
      R.Log("Incompatible material mode");
      return;
    }
    this._createEffectForParticles(e, jt.BLENDMODE_ONEONE, t, i), this._createEffectForParticles(e, jt.BLENDMODE_MULTIPLY, t, i);
  }
  /**
   * Use this material as the shadow depth wrapper of a target material
   * @param targetMaterial defines the target material
   */
  createAsShadowDepthWrapper(e) {
    if (this.mode !== se.Material) {
      R.Log("Incompatible material mode");
      return;
    }
    e.shadowDepthWrapper = new BABYLON.ShadowDepthWrapper(this, this.getScene());
  }
  _processDefines(e, t, i = !1, s) {
    let r = null;
    const n = this.getScene();
    if (_s(n, t) && t.markAsMiscDirty(), this._sharedData.blocksWithDefines.forEach((o) => {
      o.initializeDefines(e, this, t, i);
    }), this._sharedData.blocksWithDefines.forEach((o) => {
      o.prepareDefines(e, this, t, i, s);
    }), t.isDirty) {
      const o = t._areLightsDisposed;
      t.markAsProcessed(), this._vertexCompilationState.compilationString = this._vertexCompilationState._builtCompilationString, this._fragmentCompilationState.compilationString = this._fragmentCompilationState._builtCompilationString, this._sharedData.repeatableContentBlocks.forEach((f) => {
        f.replaceRepeatableContent(this._vertexCompilationState, this._fragmentCompilationState, e, t);
      });
      const l = [];
      this._sharedData.dynamicUniformBlocks.forEach((f) => {
        f.updateUniformsAndSamples(this._vertexCompilationState, this, t, l);
      });
      const h = this._vertexCompilationState.uniforms;
      this._fragmentCompilationState.uniforms.forEach((f) => {
        h.indexOf(f) === -1 && h.push(f);
      });
      const c = this._vertexCompilationState.samplers;
      this._fragmentCompilationState.samplers.forEach((f) => {
        c.indexOf(f) === -1 && c.push(f);
      });
      const d = new Ri();
      this._sharedData.blocksWithFallbacks.forEach((f) => {
        f.provideFallbacks(e, d);
      }), r = {
        lightDisposed: o,
        uniformBuffers: l,
        mergedUniforms: h,
        mergedSamplers: c,
        fallbacks: d
      };
    }
    return r;
  }
  /**
   * Get if the submesh is ready to be used and all its information available.
   * Child classes can use it to update shaders
   * @param mesh defines the mesh to check
   * @param subMesh defines which submesh to check
   * @param useInstances specifies that instances should be used
   * @returns a boolean indicating that the submesh is ready or not
   */
  isReadyForSubMesh(e, t, i = !1) {
    if (!this._buildWasSuccessful)
      return !1;
    const s = this.getScene();
    if (this._sharedData.animatedInputs) {
      const h = s.getFrameId();
      if (this._animationFrame !== h) {
        for (const c of this._sharedData.animatedInputs)
          c.animate(s);
        this._animationFrame = h;
      }
    }
    const r = t._drawWrapper;
    if (r.effect && this.isFrozen && r._wasPreviouslyReady && r._wasPreviouslyUsingInstances === i)
      return !0;
    t.materialDefines || (t.materialDefines = new rt());
    const n = t.materialDefines;
    if (this._isReadyForSubMesh(t))
      return !0;
    const o = s.getEngine();
    if (this._prepareDefinesForAttributes(e, n), this._sharedData.blockingBlocks.some((h) => !h.isReady(e, this, n, i)))
      return !1;
    const l = this._processDefines(e, n, i, t);
    if (l) {
      const h = t.effect, c = n.toString();
      let d = o.createEffect({
        vertex: "nodeMaterial" + this._buildId,
        fragment: "nodeMaterial" + this._buildId,
        vertexSource: this._vertexCompilationState.compilationString,
        fragmentSource: this._fragmentCompilationState.compilationString
      }, {
        attributes: this._vertexCompilationState.attributes,
        uniformsNames: l.mergedUniforms,
        uniformBuffersNames: l.uniformBuffers,
        samplers: l.mergedSamplers,
        defines: c,
        fallbacks: l.fallbacks,
        onCompiled: this.onCompiled,
        onError: this.onError,
        multiTarget: n.PREPASS,
        indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights, maxSimultaneousMorphTargets: n.NUM_MORPH_INFLUENCERS }
      }, o);
      if (d)
        if (this._onEffectCreatedObservable && (Pt.effect = d, Pt.subMesh = t, this._onEffectCreatedObservable.notifyObservers(Pt)), this.allowShaderHotSwapping && h && !d.isReady()) {
          if (d = h, n.markAsUnprocessed(), l.lightDisposed)
            return n._areLightsDisposed = !0, !1;
        } else
          s.resetCachedMaterial(), t.setEffect(d, n, this._materialContext);
    }
    return !t.effect || !t.effect.isReady() ? !1 : (n._renderId = s.getRenderId(), r._wasPreviouslyReady = !0, r._wasPreviouslyUsingInstances = i, this._checkScenePerformancePriority(), !0);
  }
  /**
   * Get a string representing the shaders built by the current node graph
   */
  get compiledShaders() {
    return `// Vertex shader
${this._vertexCompilationState.compilationString}

// Fragment shader
${this._fragmentCompilationState.compilationString}`;
  }
  /**
   * Binds the world matrix to the material
   * @param world defines the world transformation matrix
   */
  bindOnlyWorldMatrix(e) {
    const t = this.getScene();
    if (!this._activeEffect)
      return;
    const i = this._sharedData.hints;
    i.needWorldViewMatrix && e.multiplyToRef(t.getViewMatrix(), this._cachedWorldViewMatrix), i.needWorldViewProjectionMatrix && e.multiplyToRef(t.getTransformMatrix(), this._cachedWorldViewProjectionMatrix);
    for (const s of this._sharedData.inputBlocks)
      s._transmitWorld(this._activeEffect, e, this._cachedWorldViewMatrix, this._cachedWorldViewProjectionMatrix);
  }
  /**
   * Binds the submesh to this material by preparing the effect and shader to draw
   * @param world defines the world transformation matrix
   * @param mesh defines the mesh containing the submesh
   * @param subMesh defines the submesh to bind the material to
   */
  bindForSubMesh(e, t, i) {
    const s = this.getScene(), r = i.effect;
    if (!r)
      return;
    this._activeEffect = r, this.bindOnlyWorldMatrix(e);
    const n = this._mustRebind(s, r, i, t.visibility), o = this._sharedData;
    if (n) {
      for (const l of o.bindableBlocks)
        l.bind(r, this, t, i);
      for (const l of o.forcedBindableBlocks)
        l.bind(r, this, t, i);
      for (const l of o.inputBlocks)
        l._transmit(r, s, this);
    } else if (!this.isFrozen)
      for (const l of o.forcedBindableBlocks)
        l.bind(r, this, t, i);
    this._afterBind(t, this._activeEffect, i);
  }
  /**
   * Gets the active textures from the material
   * @returns an array of textures
   */
  getActiveTextures() {
    const e = super.getActiveTextures();
    return this._sharedData && e.push(...this._sharedData.textureBlocks.filter((t) => t.texture).map((t) => t.texture)), e;
  }
  /**
   * Gets the list of texture blocks
   * Note that this method will only return blocks that are reachable from the final block(s) and only after the material has been built!
   * @returns an array of texture blocks
   */
  getTextureBlocks() {
    return this._sharedData ? this._sharedData.textureBlocks : [];
  }
  /**
   * Gets the list of all texture blocks
   * Note that this method will scan all attachedBlocks and return blocks that are texture blocks
   * @returns
   */
  getAllTextureBlocks() {
    const e = [];
    for (const t of this.attachedBlocks)
      V._BlockIsTextureBlock(t) && e.push(t);
    return e;
  }
  /**
   * Specifies if the material uses a texture
   * @param texture defines the texture to check against the material
   * @returns a boolean specifying if the material uses the texture
   */
  hasTexture(e) {
    if (super.hasTexture(e))
      return !0;
    if (!this._sharedData)
      return !1;
    for (const t of this._sharedData.textureBlocks)
      if (t.texture === e)
        return !0;
    return !1;
  }
  /**
   * Disposes the material
   * @param forceDisposeEffect specifies if effects should be forcefully disposed
   * @param forceDisposeTextures specifies if textures should be forcefully disposed
   * @param notBoundToMesh specifies if the material that is being disposed is known to be not bound to any mesh
   */
  dispose(e, t, i) {
    if (t)
      for (const s of this.getTextureBlocks().filter((r) => r.texture).map((r) => r.texture))
        s.dispose();
    for (const s of this.attachedBlocks)
      s.dispose();
    this.attachedBlocks.length = 0, this._sharedData = null, this._vertexCompilationState = null, this._fragmentCompilationState = null, this.onBuildObservable.clear(), this._imageProcessingObserver && (this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver), this._imageProcessingObserver = null), super.dispose(e, t, i);
  }
  /** Creates the node editor window.
   * @param additionalConfig Define the configuration of the editor
   */
  _createNodeEditor(e) {
    const t = {
      nodeMaterial: this,
      ...e
    };
    this.BJSNODEMATERIALEDITOR.NodeEditor.Show(t);
  }
  /**
   * Launch the node material editor
   * @param config Define the configuration of the editor
   * @returns a promise fulfilled when the node editor is visible
   */
  edit(e) {
    return new Promise((t) => {
      if (this.BJSNODEMATERIALEDITOR = this.BJSNODEMATERIALEDITOR || this._getGlobalNodeMaterialEditor(), typeof this.BJSNODEMATERIALEDITOR > "u") {
        const i = e && e.editorURL ? e.editorURL : V.EditorURL;
        B.LoadBabylonScript(i, () => {
          this.BJSNODEMATERIALEDITOR = this.BJSNODEMATERIALEDITOR || this._getGlobalNodeMaterialEditor(), this._createNodeEditor(e?.nodeEditorConfig), t();
        });
      } else
        this._createNodeEditor(e?.nodeEditorConfig), t();
    });
  }
  /**
   * Clear the current material
   */
  clear() {
    this._vertexOutputNodes.length = 0, this._fragmentOutputNodes.length = 0, this.attachedBlocks.length = 0;
  }
  /**
   * Clear the current material and set it to a default state
   */
  setToDefault() {
    this.clear(), this.editorData = null;
    const e = new Z("Position");
    e.setAsAttribute("position");
    const t = new Z("World");
    t.setAsSystemValue(M.World);
    const i = new Ft("WorldPos");
    e.connectTo(i), t.connectTo(i);
    const s = new Z("ViewProjection");
    s.setAsSystemValue(M.ViewProjection);
    const r = new Ft("WorldPos * ViewProjectionTransform");
    i.connectTo(r), s.connectTo(r);
    const n = new ot("VertexOutput");
    r.connectTo(n);
    const o = new Z("color");
    o.value = new $e(0.8, 0.8, 0.8, 1);
    const l = new Ae("FragmentOutput");
    o.connectTo(l), this.addOutputNode(n), this.addOutputNode(l), this._mode = se.Material;
  }
  /**
   * Clear the current material and set it to a default state for post process
   */
  setToDefaultPostProcess() {
    this.clear(), this.editorData = null;
    const e = new Z("Position");
    e.setAsAttribute("position2d");
    const t = new Z("Constant1");
    t.isConstant = !0, t.value = 1;
    const i = new at("Position3D");
    e.connectTo(i), t.connectTo(i, { input: "w" });
    const s = new ot("VertexOutput");
    i.connectTo(s);
    const r = new Z("Scale");
    r.visibleInInspector = !0, r.value = new ve(1, 1);
    const n = new pt("uv0");
    e.connectTo(n);
    const o = new Dt("UV scale");
    n.connectTo(o), r.connectTo(o);
    const l = new Ai("CurrentScreen");
    o.connectTo(l), l.texture = new L("https://assets.babylonjs.com/nme/currentScreenPostProcess.png", this.getScene());
    const h = new Ae("FragmentOutput");
    l.connectTo(h, { output: "rgba" }), this.addOutputNode(s), this.addOutputNode(h), this._mode = se.PostProcess;
  }
  /**
   * Clear the current material and set it to a default state for procedural texture
   */
  setToDefaultProceduralTexture() {
    this.clear(), this.editorData = null;
    const e = new Z("Position");
    e.setAsAttribute("position2d");
    const t = new Z("Constant1");
    t.isConstant = !0, t.value = 1;
    const i = new at("Position3D");
    e.connectTo(i), t.connectTo(i, { input: "w" });
    const s = new ot("VertexOutput");
    i.connectTo(s);
    const r = new Z("Time");
    r.value = 0, r.min = 0, r.max = 0, r.isBoolean = !1, r.matrixMode = 0, r.animationType = Ie.Time, r.isConstant = !1;
    const n = new Z("Color3");
    n.value = new U(1, 1, 1), n.isConstant = !1;
    const o = new Ae("FragmentOutput"), l = new at("VectorMerger");
    l.visibleInInspector = !1;
    const h = new Di("Cos");
    h.operation = G.Cos, e.connectTo(l), r.output.connectTo(h.input), h.output.connectTo(l.z), l.xyzOut.connectTo(o.rgb), this.addOutputNode(s), this.addOutputNode(o), this._mode = se.ProceduralTexture;
  }
  /**
   * Clear the current material and set it to a default state for particle
   */
  setToDefaultParticle() {
    this.clear(), this.editorData = null;
    const e = new Z("uv");
    e.setAsAttribute("particle_uv");
    const t = new xi("ParticleTexture");
    e.connectTo(t);
    const i = new Z("Color");
    i.setAsAttribute("particle_color");
    const s = new Dt("Texture * Color");
    t.connectTo(s), i.connectTo(s);
    const r = new Oi("ParticleRampGradient");
    s.connectTo(r);
    const n = new Fi("ColorSplitter");
    i.connectTo(n);
    const o = new Ni("ParticleBlendMultiply");
    r.connectTo(o), t.connectTo(o, { output: "a" }), n.connectTo(o, { output: "a" });
    const l = new Ae("FragmentOutput");
    o.connectTo(l), this.addOutputNode(l), this._mode = se.Particle;
  }
  /**
   * Loads the current Node Material from a url pointing to a file save by the Node Material Editor
   * @deprecated Please use NodeMaterial.ParseFromFileAsync instead
   * @param url defines the url to load from
   * @param rootUrl defines the root URL for nested url in the node material
   * @returns a promise that will fulfil when the material is fully loaded
   */
  async loadAsync(e, t = "") {
    return V.ParseFromFileAsync("", e, this.getScene(), t, !0, this);
  }
  _gatherBlocks(e, t) {
    if (t.indexOf(e) === -1) {
      t.push(e);
      for (const i of e.inputs) {
        const s = i.connectedPoint;
        if (s) {
          const r = s.ownerBlock;
          r !== e && this._gatherBlocks(r, t);
        }
      }
      if (e.isTeleportOut) {
        const i = e;
        i.entryPoint && this._gatherBlocks(i.entryPoint, t);
      }
    }
  }
  /**
   * Generate a string containing the code declaration required to create an equivalent of this material
   * @returns a string
   */
  generateCode() {
    let e = [];
    const t = [], i = ["const", "var", "let"];
    for (const n of this._vertexOutputNodes)
      this._gatherBlocks(n, t);
    const s = [];
    for (const n of this._fragmentOutputNodes)
      this._gatherBlocks(n, s);
    let r = `var nodeMaterial = new BABYLON.NodeMaterial("${this.name || "node material"}");
`;
    r += `nodeMaterial.mode = BABYLON.NodeMaterialModes.${se[this.mode]};
`;
    for (const n of t)
      n.isInput && e.indexOf(n) === -1 && (r += n._dumpCode(i, e));
    for (const n of s)
      n.isInput && e.indexOf(n) === -1 && (r += n._dumpCode(i, e));
    e = [], r += `
// Connections
`;
    for (const n of this._vertexOutputNodes)
      r += n._dumpCodeForOutputConnections(e);
    for (const n of this._fragmentOutputNodes)
      r += n._dumpCodeForOutputConnections(e);
    r += `
// Output nodes
`;
    for (const n of this._vertexOutputNodes)
      r += `nodeMaterial.addOutputNode(${n._codeVariableName});
`;
    for (const n of this._fragmentOutputNodes)
      r += `nodeMaterial.addOutputNode(${n._codeVariableName});
`;
    return r += `nodeMaterial.build();
`, r;
  }
  /**
   * Serializes this material in a JSON representation
   * @param selectedBlocks defines an optional list of blocks to serialize
   * @returns the serialized material object
   */
  serialize(e) {
    const t = e ? {} : Ue.Serialize(this);
    t.editorData = JSON.parse(JSON.stringify(this.editorData));
    let i = [];
    if (e)
      i = e;
    else {
      t.customType = "BABYLON.NodeMaterial", t.outputNodes = [];
      for (const s of this._vertexOutputNodes)
        this._gatherBlocks(s, i), t.outputNodes.push(s.uniqueId);
      for (const s of this._fragmentOutputNodes)
        this._gatherBlocks(s, i), t.outputNodes.indexOf(s.uniqueId) === -1 && t.outputNodes.push(s.uniqueId);
    }
    t.blocks = [];
    for (const s of i)
      t.blocks.push(s.serialize());
    if (!e)
      for (const s of this.attachedBlocks)
        i.indexOf(s) === -1 && t.blocks.push(s.serialize());
    return t;
  }
  _restoreConnections(e, t, i) {
    for (const s of e.outputs)
      for (const r of t.blocks) {
        const n = i[r.id];
        if (n) {
          for (const o of r.inputs)
            if (i[o.targetBlockId] === e && o.targetConnectionName === s.name) {
              const l = n.getInputByName(o.inputName);
              if (!l || l.isConnected)
                continue;
              s.connectTo(l, !0), this._restoreConnections(n, t, i);
              continue;
            }
        }
      }
  }
  /**
   * Clear the current graph and load a new one from a serialization object
   * @param source defines the JSON representation of the material
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @param merge defines whether or not the source must be merged or replace the current content
   */
  parseSerializedObject(e, t = "", i = !1) {
    i || this.clear();
    const s = {};
    for (const r of e.blocks) {
      const n = Lt(r.customType);
      if (n) {
        const o = new n();
        o._deserialize(r, this.getScene(), t), s[r.id] = o, this.attachedBlocks.push(o);
      }
    }
    for (const r of this.attachedBlocks)
      if (r.isTeleportOut) {
        const n = r, o = n._tempEntryPointUniqueId;
        o && s[o].attachToEndpoint(n);
      }
    for (let r = 0; r < e.blocks.length; r++) {
      const n = e.blocks[r], o = s[n.id];
      o && (o.inputs.length && !i || this._restoreConnections(o, e, s));
    }
    if (e.outputNodes)
      for (const r of e.outputNodes)
        this.addOutputNode(s[r]);
    if (e.locations || e.editorData && e.editorData.locations) {
      const r = e.locations || e.editorData.locations;
      for (const o of r)
        s[o.blockId] && (o.blockId = s[o.blockId].uniqueId);
      i && this.editorData && this.editorData.locations && r.concat(this.editorData.locations), e.locations ? this.editorData = {
        locations: r
      } : (this.editorData = e.editorData, this.editorData.locations = r);
      const n = [];
      for (const o in s)
        n[o] = s[o].uniqueId;
      this.editorData.map = n;
    }
    this.comment = e.comment, e.forceAlphaBlending !== void 0 && (this.forceAlphaBlending = e.forceAlphaBlending), e.alphaMode !== void 0 && (this.alphaMode = e.alphaMode), i || (this._mode = e.mode ?? se.Material);
  }
  /**
   * Clear the current graph and load a new one from a serialization object
   * @param source defines the JSON representation of the material
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @param merge defines whether or not the source must be merged or replace the current content
   * @deprecated Please use the parseSerializedObject method instead
   */
  loadFromSerialization(e, t = "", i = !1) {
    this.parseSerializedObject(e, t, i);
  }
  /**
   * Makes a duplicate of the current material.
   * @param name defines the name to use for the new material
   * @param shareEffect defines if the clone material should share the same effect (default is false)
   * @returns the cloned material
   */
  clone(e, t = !1) {
    const i = this.serialize(), s = Ue.Clone(() => new V(e, this.getScene(), this.options), this);
    return s.id = e, s.name = e, s.parseSerializedObject(i), s._buildId = this._buildId, s.build(!1, !t), s;
  }
  /**
   * Awaits for all the material textures to be ready before resolving the returned promise.
   * @returns A promise that resolves when the textures are ready.
   */
  whenTexturesReadyAsync() {
    const e = [];
    return this.getActiveTextures().forEach((t) => {
      const i = t.getInternalTexture();
      i && !i.isReady && e.push(new Promise((s, r) => {
        i.onLoadedObservable.addOnce(() => {
          s();
        }), i.onErrorObservable.addOnce((n) => {
          r(n);
        });
      }));
    }), Promise.all(e);
  }
  /**
   * Creates a node material from parsed material data
   * @param source defines the JSON representation of the material
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @returns a new node material
   */
  static Parse(e, t, i = "") {
    const s = Ue.Parse(() => new V(e.name, t), e, t, i);
    return s.parseSerializedObject(e, i), s.build(), s;
  }
  /**
   * Creates a node material from a snippet saved in a remote file
   * @param name defines the name of the material to create
   * @param url defines the url to load from
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL for nested url in the node material
   * @param skipBuild defines whether to build the node material
   * @param targetMaterial defines a material to use instead of creating a new one
   * @returns a promise that will resolve to the new node material
   */
  static async ParseFromFileAsync(e, t, i, s = "", r = !1, n) {
    const o = n ?? new V(e, i), l = await i._loadFileAsync(t), h = JSON.parse(l);
    return o.parseSerializedObject(h, s), r || o.build(), o;
  }
  /**
   * Creates a node material from a snippet saved by the node material editor
   * @param snippetId defines the snippet to load
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @param nodeMaterial defines a node material to update (instead of creating a new one)
   * @param skipBuild defines whether to build the node material
   * @param waitForTextureReadyness defines whether to wait for texture readiness resolving the promise (default: false)
   * @returns a promise that will resolve to the new node material
   */
  static ParseFromSnippetAsync(e, t = He.LastCreatedScene, i = "", s, r = !1, n = !1) {
    return e === "_BLANK" ? Promise.resolve(V.CreateDefault("blank", t)) : new Promise((o, l) => {
      const h = new Xi();
      h.addEventListener("readystatechange", () => {
        if (h.readyState == 4)
          if (h.status == 200) {
            const c = JSON.parse(JSON.parse(h.responseText).jsonPayload), d = JSON.parse(c.nodeMaterial);
            s || (s = Ue.Parse(() => new V(e, t), d, t, i), s.uniqueId = t.getUniqueId()), s.parseSerializedObject(d), s.snippetId = e;
            try {
              r || s.build();
            } catch (f) {
              l(f);
            }
            n ? s.whenTexturesReadyAsync().then(() => {
              o(s);
            }).catch((f) => {
              l(f);
            }) : o(s);
          } else
            l("Unable to load the snippet " + e);
      }), h.open("GET", this.SnippetUrl + "/" + e.replace(/#/g, "/")), h.send();
    });
  }
  /**
   * Creates a new node material set to default basic configuration
   * @param name defines the name of the material
   * @param scene defines the hosting scene
   * @returns a new NodeMaterial
   */
  static CreateDefault(e, t) {
    const i = new V(e, t);
    return i.setToDefault(), i.build(), i;
  }
}
V._BuildIdGenerator = 0;
V.EditorURL = `${B._DefaultCdnUrl}/v${Bt.Version}/nodeEditor/babylon.nodeEditor.js`;
V.SnippetUrl = "https://snippet.babylonjs.com";
V.IgnoreTexturesAtLoadTime = !1;
b([
  D()
], V.prototype, "ignoreAlpha", void 0);
b([
  D()
], V.prototype, "maxSimultaneousLights", void 0);
b([
  D("mode")
], V.prototype, "_mode", void 0);
b([
  D("comment")
], V.prototype, "comment", void 0);
b([
  D()
], V.prototype, "forceAlphaBlending", void 0);
q("BABYLON.NodeMaterial", V);
wt.prototype._projectOnTrianglesToRef = function(a, e, t, i, s, r) {
  const n = H.Vector3[0], o = H.Vector3[1];
  let l = 1 / 0;
  for (let h = this.indexStart; h < this.indexStart + this.indexCount - (3 - i); h += i) {
    const c = t[h], d = t[h + 1], f = t[h + 2];
    if (s && f === 4294967295) {
      h += 2;
      continue;
    }
    const _ = e[c], g = e[d], S = e[f];
    if (!_ || !g || !S)
      continue;
    const v = C.ProjectOnTriangleToRef(a, _, g, S, o);
    v < l && (n.copyFrom(o), l = v);
  }
  return r.copyFrom(n), l;
};
wt.prototype._projectOnUnIndexedTrianglesToRef = function(a, e, t, i) {
  const s = H.Vector3[0], r = H.Vector3[1];
  let n = 1 / 0;
  for (let o = this.verticesStart; o < this.verticesStart + this.verticesCount; o += 3) {
    const l = e[o], h = e[o + 1], c = e[o + 2], d = C.ProjectOnTriangleToRef(a, l, h, c, r);
    d < n && (s.copyFrom(r), n = d);
  }
  return i.copyFrom(s), n;
};
wt.prototype.projectToRef = function(a, e, t, i) {
  const s = this.getMaterial();
  if (!s)
    return -1;
  let r = 3, n = !1;
  switch (s.fillMode) {
    case 3:
    case 5:
    case 6:
    case 8:
      return -1;
    case 7:
      r = 1, n = !0;
      break;
  }
  return s.fillMode === 4 ? -1 : !t.length && this._mesh._unIndexed ? this._projectOnUnIndexedTrianglesToRef(a, e, t, i) : this._projectOnTrianglesToRef(a, e, t, r, n, i);
};
var re;
(function(a) {
  a[a.DEHYDRATED = 0] = "DEHYDRATED", a[a.HOVER = 1] = "HOVER", a[a.TOUCH = 2] = "TOUCH";
})(re || (re = {}));
var Fe;
(function(a) {
  a[a.DISABLED = 0] = "DISABLED", a[a.CENTERED_ON_CONTROLLER = 1] = "CENTERED_ON_CONTROLLER", a[a.CENTERED_IN_FRONT = 2] = "CENTERED_IN_FRONT";
})(Fe || (Fe = {}));
class Ce extends ft {
  /**
   * constructs a new background remover module
   * @param _xrSessionManager the session manager for this module
   * @param _options read-only options to be used in this module
   */
  constructor(e, t) {
    super(e), this._options = t, this._tmpRay = new De(new C(), new C()), this._attachController = (i) => {
      if (this._controllers[i.uniqueId])
        return;
      const { touchCollisionMesh: s, touchCollisionMeshFunction: r, hydrateCollisionMeshFunction: n } = this._generateNewTouchPointMesh(), o = this._generateVisualCue();
      switch (this._controllers[i.uniqueId] = {
        xrController: i,
        meshUnderPointer: null,
        nearInteractionTargetMesh: null,
        pick: null,
        stalePick: null,
        touchCollisionMesh: s,
        touchCollisionMeshFunction: r,
        hydrateCollisionMeshFunction: n,
        currentAnimationState: re.DEHYDRATED,
        grabRay: new De(new C(), new C()),
        hoverInteraction: !1,
        nearInteraction: !1,
        grabInteraction: !1,
        downTriggered: !1,
        id: Ce._IdCounter++,
        pickedPointVisualCue: o
      }, this._controllers[i.uniqueId]._worldScaleObserver = this._controllers[i.uniqueId]._worldScaleObserver || this._xrSessionManager.onWorldScaleFactorChangedObservable.add((l) => {
        if (l.newScaleFactor !== l.previousScaleFactor) {
          this._controllers[i.uniqueId].touchCollisionMesh.dispose(), this._controllers[i.uniqueId].pickedPointVisualCue.dispose();
          const { touchCollisionMesh: h, touchCollisionMeshFunction: c, hydrateCollisionMeshFunction: d } = this._generateNewTouchPointMesh();
          this._controllers[i.uniqueId].touchCollisionMesh = h, this._controllers[i.uniqueId].touchCollisionMeshFunction = c, this._controllers[i.uniqueId].hydrateCollisionMeshFunction = d, this._controllers[i.uniqueId].pickedPointVisualCue = this._generateVisualCue();
        }
      }), this._attachedController ? !this._options.enableNearInteractionOnAllControllers && this._options.preferredHandedness && i.inputSource.handedness === this._options.preferredHandedness && (this._attachedController = i.uniqueId) : this._options.enableNearInteractionOnAllControllers || (this._attachedController = i.uniqueId), i.inputSource.targetRayMode) {
        case "tracked-pointer":
          return this._attachNearInteractionMode(i);
        case "gaze":
          return null;
        case "screen":
          return null;
      }
    }, this._controllers = {}, this._farInteractionFeature = null, this.selectionMeshDefaultColor = new U(0.8, 0.8, 0.8), this.selectionMeshPickedColor = new U(0.3, 0.3, 1), this._hoverRadius = 0.1, this._pickRadius = 0.02, this._controllerPickRadius = 0.03, this._nearGrabLengthScale = 5, this._scene = this._xrSessionManager.scene, this._options.nearInteractionControllerMode === void 0 && (this._options.nearInteractionControllerMode = Fe.CENTERED_IN_FRONT), this._options.farInteractionFeature && (this._farInteractionFeature = this._options.farInteractionFeature);
  }
  /**
   * Attach this feature
   * Will usually be called by the features manager
   *
   * @returns true if successful.
   */
  attach() {
    return super.attach() ? (this._options.xrInput.controllers.forEach(this._attachController), this._addNewAttachObserver(this._options.xrInput.onControllerAddedObservable, this._attachController), this._addNewAttachObserver(this._options.xrInput.onControllerRemovedObservable, (e) => {
      this._detachController(e.uniqueId);
    }), this._scene.constantlyUpdateMeshUnderPointer = !0, !0) : !1;
  }
  /**
   * Detach this feature.
   * Will usually be called by the features manager
   *
   * @returns true if successful.
   */
  detach() {
    return super.detach() ? (Object.keys(this._controllers).forEach((e) => {
      this._detachController(e);
    }), !0) : !1;
  }
  /**
   * Will get the mesh under a specific pointer.
   * `scene.meshUnderPointer` will only return one mesh - either left or right.
   * @param controllerId the controllerId to check
   * @returns The mesh under pointer or null if no mesh is under the pointer
   */
  getMeshUnderPointer(e) {
    return this._controllers[e] ? this._controllers[e].meshUnderPointer : null;
  }
  /**
   * Get the xr controller that correlates to the pointer id in the pointer event
   *
   * @param id the pointer id to search for
   * @returns the controller that correlates to this id or null if not found
   */
  getXRControllerByPointerId(e) {
    const t = Object.keys(this._controllers);
    for (let i = 0; i < t.length; ++i)
      if (this._controllers[t[i]].id === e)
        return this._controllers[t[i]].xrController || null;
    return null;
  }
  /**
   * This function sets webXRControllerPointerSelection feature that will be disabled when
   * the hover range is reached for a mesh and will be reattached when not in hover range.
   * This is used to remove the selection rays when moving.
   * @param farInteractionFeature the feature to disable when finger is in hover range for a mesh
   */
  setFarInteractionFeature(e) {
    this._farInteractionFeature = e;
  }
  /**
   * Filter used for near interaction pick and hover
   * @param mesh the mesh candidate to be pick-filtered
   * @returns if the mesh should be included in the list of candidate meshes for near interaction
   */
  _nearPickPredicate(e) {
    return e.isEnabled() && e.isVisible && e.isPickable && e.isNearPickable;
  }
  /**
   * Filter used for near interaction grab
   * @param mesh the mesh candidate to be pick-filtered
   * @returns if the mesh should be included in the list of candidate meshes for near interaction
   */
  _nearGrabPredicate(e) {
    return e.isEnabled() && e.isVisible && e.isPickable && e.isNearGrabbable;
  }
  /**
   * Filter used for any near interaction
   * @param mesh the mesh candidate to be pick-filtered
   * @returns if the mesh should be included in the list of candidate meshes for near interaction
   */
  _nearInteractionPredicate(e) {
    return e.isEnabled() && e.isVisible && e.isPickable && (e.isNearPickable || e.isNearGrabbable);
  }
  _controllerAvailablePredicate(e, t) {
    let i = e;
    for (; i; ) {
      if (i.reservedDataStore && i.reservedDataStore.nearInteraction && i.reservedDataStore.nearInteraction.excludedControllerId === t)
        return !1;
      i = i.parent;
    }
    return !0;
  }
  _handleTransitionAnimation(e, t) {
    if (!(e.currentAnimationState === t || this._options.nearInteractionControllerMode !== Fe.CENTERED_IN_FRONT || e.xrController?.inputSource.hand)) {
      if (t > e.currentAnimationState)
        switch (e.currentAnimationState) {
          case re.DEHYDRATED:
            if (e.hydrateCollisionMeshFunction(!0), t === re.HOVER)
              break;
          case re.HOVER:
            if (e.touchCollisionMeshFunction(!0), t === re.TOUCH)
              break;
        }
      else
        switch (e.currentAnimationState) {
          case re.TOUCH:
            if (e.touchCollisionMeshFunction(!1), t === re.HOVER)
              break;
          case re.HOVER:
            if (e.hydrateCollisionMeshFunction(!1), t === re.DEHYDRATED)
              break;
        }
      e.currentAnimationState = t;
    }
  }
  _processTouchPoint(e, t, i) {
    const s = this._controllers[e];
    s.grabRay.origin.copyFrom(t), i.toEulerAnglesToRef(H.Vector3[0]), s.grabRay.direction.copyFrom(H.Vector3[0]), this._options.nearInteractionControllerMode === Fe.CENTERED_IN_FRONT && !s.xrController?.inputSource.hand && (s.xrController.getWorldPointerRayToRef(this._tmpRay), s.grabRay.origin.addInPlace(this._tmpRay.direction.scale(0.05))), s.grabRay.length = this._nearGrabLengthScale * this._hoverRadius * this._xrSessionManager.worldScalingFactor, s.touchCollisionMesh.position.copyFrom(s.grabRay.origin).scaleInPlace(this._xrSessionManager.worldScalingFactor);
  }
  _onXRFrame(e) {
    Object.keys(this._controllers).forEach((t) => {
      const i = this._controllers[t], s = i.xrController?.inputSource.hand;
      if (!this._options.enableNearInteractionOnAllControllers && t !== this._attachedController || !i.xrController || !s && (!this._options.nearInteractionControllerMode || !i.xrController.inputSource.gamepad)) {
        i.pick = null;
        return;
      }
      if (i.hoverInteraction = !1, i.nearInteraction = !1, i.xrController) {
        if (s) {
          const l = s.get("index-finger-tip");
          if (l) {
            const h = e.getJointPose(l, this._xrSessionManager.referenceSpace);
            if (h && h.transform) {
              const c = this._scene.useRightHandedSystem ? 1 : -1;
              H.Vector3[0].set(h.transform.position.x, h.transform.position.y, h.transform.position.z * c), H.Quaternion[0].set(h.transform.orientation.x, h.transform.orientation.y, h.transform.orientation.z * c, h.transform.orientation.w * c), this._processTouchPoint(t, H.Vector3[0], H.Quaternion[0]);
            }
          }
        } else if (i.xrController.inputSource.gamepad && this._options.nearInteractionControllerMode !== Fe.DISABLED) {
          let l = i.xrController.pointer;
          i.xrController.grip && this._options.nearInteractionControllerMode === Fe.CENTERED_ON_CONTROLLER && (l = i.xrController.grip), this._processTouchPoint(t, l.position, l.rotationQuaternion);
        }
      } else
        return;
      const r = (l, h) => {
        let c = null;
        return !h || !h.hit ? c = l : !l || !l.hit || h.distance < l.distance ? c = h : c = l, c;
      }, n = (l) => {
        let h = new Me(), c = !1;
        const d = l && l.pickedPoint && l.hit;
        return l?.pickedPoint && (c = l.pickedPoint.x === 0 && l.pickedPoint.y === 0 && l.pickedPoint.z === 0), d && !c && (h = l), h;
      };
      if (!i.grabInteraction) {
        let l = null, h = null;
        this._options.useUtilityLayer && this._utilityLayerScene && (h = this._pickWithSphere(i, this._hoverRadius * this._xrSessionManager.worldScalingFactor, this._utilityLayerScene, (f) => this._nearInteractionPredicate(f)));
        const c = this._pickWithSphere(i, this._hoverRadius * this._xrSessionManager.worldScalingFactor, this._scene, (f) => this._nearInteractionPredicate(f)), d = r(c, h);
        if (d && d.hit && (l = n(d), l.hit && (i.hoverInteraction = !0)), i.hoverInteraction) {
          let f = null;
          const _ = (s ? this._pickRadius : this._controllerPickRadius) * this._xrSessionManager.worldScalingFactor;
          this._options.useUtilityLayer && this._utilityLayerScene && (f = this._pickWithSphere(i, _, this._utilityLayerScene, (k) => this._nearPickPredicate(k)));
          const g = this._pickWithSphere(i, _, this._scene, (k) => this._nearPickPredicate(k)), S = r(g, f), v = n(S);
          v.hit && (l = v, i.nearInteraction = !0);
        }
        i.stalePick = i.pick, i.pick = l, i.pick && i.pick.pickedPoint && i.pick.hit ? (i.meshUnderPointer = i.pick.pickedMesh, i.pickedPointVisualCue.position.copyFrom(i.pick.pickedPoint), i.pickedPointVisualCue.isVisible = !0, this._farInteractionFeature && this._farInteractionFeature.attached && this._farInteractionFeature._setPointerSelectionDisabledByPointerId(i.id, !0)) : (i.meshUnderPointer = null, i.pickedPointVisualCue.isVisible = !1, this._farInteractionFeature && this._farInteractionFeature.attached && this._farInteractionFeature._setPointerSelectionDisabledByPointerId(i.id, !1));
      }
      let o = re.DEHYDRATED;
      i.grabInteraction || i.nearInteraction ? o = re.TOUCH : i.hoverInteraction && (o = re.HOVER), this._handleTransitionAnimation(i, o);
    });
  }
  get _utilityLayerScene() {
    return this._options.customUtilityLayerScene || w.DefaultUtilityLayer.utilityLayerScene;
  }
  _generateVisualCue() {
    const e = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || w.DefaultUtilityLayer.utilityLayerScene : this._scene, t = At("nearInteraction", {
      diameter: 35e-4 * 3 * this._xrSessionManager.worldScalingFactor
    }, e);
    t.bakeCurrentTransformIntoVertices(), t.isPickable = !1, t.isVisible = !1, t.rotationQuaternion = A.Identity();
    const i = new Le("targetMat", e);
    return i.specularColor = U.Black(), i.emissiveColor = this.selectionMeshDefaultColor, i.backFaceCulling = !1, t.material = i, t;
  }
  _isControllerReadyForNearInteraction(e) {
    return this._farInteractionFeature ? this._farInteractionFeature._getPointerSelectionDisabledByPointerId(e) : !0;
  }
  _attachNearInteractionMode(e) {
    const t = this._controllers[e.uniqueId], i = {
      pointerId: t.id,
      pointerType: "xr-near"
    };
    t.onFrameObserver = this._xrSessionManager.onXRFrameObservable.add(() => {
      !this._options.enableNearInteractionOnAllControllers && e.uniqueId !== this._attachedController || !t.xrController || !t.xrController.inputSource.hand && (!this._options.nearInteractionControllerMode || !t.xrController.inputSource.gamepad) || (t.pick && (t.pick.ray = t.grabRay), t.pick && this._isControllerReadyForNearInteraction(t.id) && this._scene.simulatePointerMove(t.pick, i), t.nearInteraction && t.pick && t.pick.hit ? t.nearInteractionTargetMesh || (this._scene.simulatePointerDown(t.pick, i), t.nearInteractionTargetMesh = t.meshUnderPointer, t.downTriggered = !0) : t.nearInteractionTargetMesh && t.stalePick && (this._scene.simulatePointerUp(t.stalePick, i), t.downTriggered = !1, t.nearInteractionTargetMesh = null));
    });
    const s = (r) => {
      this._options.enableNearInteractionOnAllControllers || e.uniqueId === this._attachedController && this._isControllerReadyForNearInteraction(t.id) ? (t.pick && (t.pick.ray = t.grabRay), r && t.pick && t.meshUnderPointer && this._nearGrabPredicate(t.meshUnderPointer) ? (t.grabInteraction = !0, t.pickedPointVisualCue.isVisible = !1, this._scene.simulatePointerDown(t.pick, i), t.downTriggered = !0) : !r && t.pick && t.grabInteraction && (this._scene.simulatePointerUp(t.pick, i), t.downTriggered = !1, t.grabInteraction = !1, t.pickedPointVisualCue.isVisible = !0)) : r && !this._options.enableNearInteractionOnAllControllers && !this._options.disableSwitchOnClick && (this._attachedController = e.uniqueId);
    };
    if (e.inputSource.gamepad) {
      const r = (n) => {
        t.squeezeComponent = n.getComponent("grasp"), t.squeezeComponent ? t.onSqueezeButtonChangedObserver = t.squeezeComponent.onButtonStateChangedObservable.add((o) => {
          if (o.changes.pressed) {
            const l = o.changes.pressed.current;
            s(l);
          }
        }) : (t.selectionComponent = n.getMainComponent(), t.onButtonChangedObserver = t.selectionComponent.onButtonStateChangedObservable.add((o) => {
          if (o.changes.pressed) {
            const l = o.changes.pressed.current;
            s(l);
          }
        }));
      };
      e.motionController ? r(e.motionController) : e.onMotionControllerInitObservable.add(r);
    } else {
      const r = (o) => {
        t.xrController && o.inputSource === t.xrController.inputSource && t.pick && this._isControllerReadyForNearInteraction(t.id) && t.meshUnderPointer && this._nearGrabPredicate(t.meshUnderPointer) && (t.grabInteraction = !0, t.pickedPointVisualCue.isVisible = !1, this._scene.simulatePointerDown(t.pick, i), t.downTriggered = !0);
      }, n = (o) => {
        t.xrController && o.inputSource === t.xrController.inputSource && t.pick && this._isControllerReadyForNearInteraction(t.id) && (this._scene.simulatePointerUp(t.pick, i), t.grabInteraction = !1, t.pickedPointVisualCue.isVisible = !0, t.downTriggered = !1);
      };
      t.eventListeners = {
        selectend: n,
        selectstart: r
      }, this._xrSessionManager.session.addEventListener("selectstart", r), this._xrSessionManager.session.addEventListener("selectend", n);
    }
  }
  _detachController(e) {
    const t = this._controllers[e];
    if (t && (t.squeezeComponent && t.onSqueezeButtonChangedObserver && t.squeezeComponent.onButtonStateChangedObservable.remove(t.onSqueezeButtonChangedObserver), t.selectionComponent && t.onButtonChangedObserver && t.selectionComponent.onButtonStateChangedObservable.remove(t.onButtonChangedObserver), t.onFrameObserver && this._xrSessionManager.onXRFrameObservable.remove(t.onFrameObserver), t.eventListeners && Object.keys(t.eventListeners).forEach((i) => {
      const s = t.eventListeners && t.eventListeners[i];
      s && this._xrSessionManager.session.removeEventListener(i, s);
    }), t.touchCollisionMesh.dispose(), t.pickedPointVisualCue.dispose(), this._xrSessionManager.runInXRFrame(() => {
      if (!t.downTriggered)
        return;
      const i = {
        pointerId: t.id,
        pointerType: "xr-near"
      };
      this._scene.simulatePointerUp(new Me(), i);
    }), t._worldScaleObserver && this._xrSessionManager.onWorldScaleFactorChangedObservable.remove(t._worldScaleObserver), delete this._controllers[e], this._attachedController === e)) {
      const i = Object.keys(this._controllers);
      i.length ? this._attachedController = i[0] : this._attachedController = "";
    }
  }
  _generateNewTouchPointMesh() {
    const e = this._xrSessionManager.worldScalingFactor, t = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || w.DefaultUtilityLayer.utilityLayerScene : this._scene, i = At("PickSphere", { diameter: 1 * e }, t);
    i.isVisible = !1, this._options.motionControllerOrbMaterial ? i.material = this._options.motionControllerOrbMaterial : V.ParseFromSnippetAsync("8RUNKL#3", t).then((W) => {
      i.material = W;
    });
    const s = new Yi();
    s.setEasingMode(Ci.EASINGMODE_EASEINOUT);
    const r = new C(this._controllerPickRadius, this._controllerPickRadius, this._controllerPickRadius).scaleInPlace(e), n = this._controllerPickRadius * (4 / 3), o = new C(n, n, n).scaleInPlace(e), l = this._controllerPickRadius * (7 / 6), h = new C(l, l, l).scaleInPlace(e), c = this._controllerPickRadius * (4 / 5), d = new C(c, c, c).scaleInPlace(e), f = this._controllerPickRadius * (3 / 2), _ = new C(f, f, f).scaleInPlace(e), g = [
      { frame: 0, value: r },
      { frame: 10, value: _ },
      { frame: 18, value: o }
    ], S = [
      { frame: 0, value: o },
      { frame: 10, value: d },
      { frame: 18, value: r }
    ], v = [
      { frame: 0, value: C.ZeroReadOnly },
      { frame: 12, value: h },
      { frame: 15, value: r }
    ], k = [
      { frame: 0, value: r },
      { frame: 10, value: C.ZeroReadOnly },
      { frame: 15, value: C.ZeroReadOnly }
    ], K = new ee("touch", "scaling", 60, ee.ANIMATIONTYPE_VECTOR3, ee.ANIMATIONLOOPMODE_CONSTANT), pe = new ee("release", "scaling", 60, ee.ANIMATIONTYPE_VECTOR3, ee.ANIMATIONLOOPMODE_CONSTANT), ae = new ee("hydrate", "scaling", 60, ee.ANIMATIONTYPE_VECTOR3, ee.ANIMATIONLOOPMODE_CONSTANT), ue = new ee("dehydrate", "scaling", 60, ee.ANIMATIONTYPE_VECTOR3, ee.ANIMATIONLOOPMODE_CONSTANT);
    return K.setEasingFunction(s), pe.setEasingFunction(s), ae.setEasingFunction(s), ue.setEasingFunction(s), K.setKeys(g), pe.setKeys(S), ae.setKeys(v), ue.setKeys(k), { touchCollisionMesh: i, touchCollisionMeshFunction: (W) => {
      const ye = W ? K : pe;
      t.beginDirectAnimation(i, [ye], 0, 18, !1, 1);
    }, hydrateCollisionMeshFunction: (W) => {
      const ye = W ? ae : ue;
      W && (i.isVisible = !0), t.beginDirectAnimation(i, [ye], 0, 15, !1, 1, () => {
        W || (i.isVisible = !1);
      });
    } };
  }
  _pickWithSphere(e, t, i, s) {
    const r = new Me();
    if (r.distance = 1 / 0, e.touchCollisionMesh && e.xrController) {
      const n = e.touchCollisionMesh.position, o = Ht.CreateFromCenterAndRadius(n, t);
      for (let l = 0; l < i.meshes.length; l++) {
        const h = i.meshes[l];
        if (!s(h) || !this._controllerAvailablePredicate(h, e.xrController.uniqueId))
          continue;
        const c = Ce.PickMeshWithSphere(h, o);
        c && c.hit && c.distance < r.distance && (r.hit = c.hit, r.pickedMesh = h, r.pickedPoint = c.pickedPoint, r.aimTransform = e.xrController.pointer, r.gripTransform = e.xrController.grip || null, r.originMesh = e.touchCollisionMesh, r.distance = c.distance, r.bu = c.bu, r.bv = c.bv, r.faceId = c.faceId, r.subMeshId = c.subMeshId);
      }
    }
    return r;
  }
  /**
   * Picks a mesh with a sphere
   * @param mesh the mesh to pick
   * @param sphere picking sphere in world coordinates
   * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
   * @returns the picking info
   */
  static PickMeshWithSphere(e, t, i = !1) {
    const s = e.subMeshes, r = new Me(), n = e.getBoundingInfo();
    if (!e._generatePointsArray() || !e.subMeshes || !n || !i && !Ht.Intersects(n.boundingSphere, t))
      return r;
    const o = H.Vector3[0], l = H.Vector3[1], h = new De(C.Zero(), C.Zero(), 1);
    let c = 1 / 0, d, f, _, g;
    const S = H.Vector3[2], v = H.Matrix[0];
    v.copyFrom(e.getWorldMatrix()), v.invert(), C.TransformCoordinatesToRef(t.center, v, S);
    for (let k = 0; k < s.length; k++)
      s[k].projectToRef(S, e._positions, e.getIndices(), l), C.TransformCoordinatesToRef(l, e.getWorldMatrix(), l), d = C.Distance(l, t.center), _ = C.Distance(l, e.getAbsolutePosition()), f = C.Distance(t.center, e.getAbsolutePosition()), f !== -1 && _ !== -1 && _ > f && (d = 0, l.copyFrom(t.center)), d !== -1 && d < c && (c = d, De.CreateFromToToRef(t.center, l, h), h.length = c * 2, g = h.intersectsMesh(e), o.copyFrom(l));
    return c < t.radius && (r.hit = !0, r.distance = c, r.pickedMesh = e, r.pickedPoint = o.clone(), g && g.bu !== null && g.bv !== null && (r.faceId = g.faceId, r.subMeshId = g.subMeshId, r.bu = g.bu, r.bv = g.bv)), r;
  }
}
Ce._IdCounter = 200;
Ce.Name = N.NEAR_INTERACTION;
Ce.Version = 1;
he.AddWebXRFeature(Ce.Name, (a, e) => () => new Ce(a, e), Ce.Version, !0);
class mr {
  /**
   * Creates a WebXREnterExitUIButton
   * @param element button element
   * @param sessionMode XR initialization session mode
   * @param referenceSpaceType the type of reference space to be used
   */
  constructor(e, t, i) {
    this.element = e, this.sessionMode = t, this.referenceSpaceType = i;
  }
  /**
   * Extendable function which can be used to update the button's visuals when the state changes
   * @param activeButton the current active button in the UI
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(e) {
  }
}
class bn {
}
class Vt {
  /**
   * Construct a new EnterExit UI class
   *
   * @param _scene babylon scene object to use
   * @param options (read-only) version of the options passed to this UI
   */
  constructor(e, t) {
    if (this._scene = e, this.options = t, this._activeButton = null, this._buttons = [], this.activeButtonChangedObservable = new x(), this._onSessionGranted = (s) => {
      this._helper && this._enterXRWithButtonIndex(0);
    }, this.overlay = document.createElement("div"), this.overlay.classList.add("xr-button-overlay"), !t.ignoreSessionGrantedEvent && navigator.xr && navigator.xr.addEventListener("sessiongranted", this._onSessionGranted), typeof window < "u" && window.location && window.location.protocol === "http:" && window.location.hostname !== "localhost")
      throw B.Warn("WebXR can only be served over HTTPS"), new Error("WebXR can only be served over HTTPS");
    if (t.customButtons)
      this._buttons = t.customButtons;
    else {
      this.overlay.style.cssText = "z-index:11;position: absolute; right: 20px;bottom: 50px;";
      const s = t.sessionMode || "immersive-vr", r = t.referenceSpaceType || "local-floor";
      let o = ".babylonVRicon { color: #868686; border-color: #868686; border-style: solid; margin-left: 10px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-image: url(" + (typeof SVGSVGElement > "u" ? "https://cdn.babylonjs.com/Assets/vrButton.png" : "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%222048%22%20height%3D%221152%22%20viewBox%3D%220%200%202048%201152%22%20version%3D%221.1%22%3E%3Cpath%20transform%3D%22rotate%28180%201024%2C576.0000000000001%29%22%20d%3D%22m1109%2C896q17%2C0%2030%2C-12t13%2C-30t-12.5%2C-30.5t-30.5%2C-12.5l-170%2C0q-18%2C0%20-30.5%2C12.5t-12.5%2C30.5t13%2C30t30%2C12l170%2C0zm-85%2C256q59%2C0%20132.5%2C-1.5t154.5%2C-5.5t164.5%2C-11.5t163%2C-20t150%2C-30t124.5%2C-41.5q23%2C-11%2042%2C-24t38%2C-30q27%2C-25%2041%2C-61.5t14%2C-72.5l0%2C-257q0%2C-123%20-47%2C-232t-128%2C-190t-190%2C-128t-232%2C-47l-81%2C0q-37%2C0%20-68.5%2C14t-60.5%2C34.5t-55.5%2C45t-53%2C45t-53%2C34.5t-55.5%2C14t-55.5%2C-14t-53%2C-34.5t-53%2C-45t-55.5%2C-45t-60.5%2C-34.5t-68.5%2C-14l-81%2C0q-123%2C0%20-232%2C47t-190%2C128t-128%2C190t-47%2C232l0%2C257q0%2C68%2038%2C115t97%2C73q54%2C24%20124.5%2C41.5t150%2C30t163%2C20t164.5%2C11.5t154.5%2C5.5t132.5%2C1.5zm939%2C-298q0%2C39%20-24.5%2C67t-58.5%2C42q-54%2C23%20-122%2C39.5t-143.5%2C28t-155.5%2C19t-157%2C11t-148.5%2C5t-129.5%2C1.5q-59%2C0%20-130%2C-1.5t-148%2C-5t-157%2C-11t-155.5%2C-19t-143.5%2C-28t-122%2C-39.5q-34%2C-14%20-58.5%2C-42t-24.5%2C-67l0%2C-257q0%2C-106%2040.5%2C-199t110%2C-162.5t162.5%2C-109.5t199%2C-40l81%2C0q27%2C0%2052%2C14t50%2C34.5t51%2C44.5t55.5%2C44.5t63.5%2C34.5t74%2C14t74%2C-14t63.5%2C-34.5t55.5%2C-44.5t51%2C-44.5t50%2C-34.5t52%2C-14l14%2C0q37%2C0%2070%2C0.5t64.5%2C4.5t63.5%2C12t68%2C23q71%2C30%20128.5%2C78.5t98.5%2C110t63.5%2C133.5t22.5%2C149l0%2C257z%22%20fill%3D%22white%22%20/%3E%3C/svg%3E%0A") + "); background-size: 80%; background-repeat:no-repeat; background-position: center; border: none; outline: none; transition: transform 0.125s ease-out } .babylonVRicon:hover { transform: scale(1.05) } .babylonVRicon:active {background-color: rgba(51,51,51,1) } .babylonVRicon:focus {background-color: rgba(51,51,51,1) }";
      o += '.babylonVRicon.vrdisplaypresenting { background-image: none;} .vrdisplaypresenting::after { content: "EXIT"} .xr-error::after { content: "ERROR"}';
      const l = document.createElement("style");
      l.appendChild(document.createTextNode(o)), document.getElementsByTagName("head")[0].appendChild(l);
      const h = document.createElement("button");
      h.className = "babylonVRicon", h.title = `${s} - ${r}`, this._buttons.push(new mr(h, s, r)), this._buttons[this._buttons.length - 1].update = function(c) {
        this.element.style.display = c === null || c === this ? "" : "none", h.className = "babylonVRicon" + (c === this ? " vrdisplaypresenting" : "");
      }, this._updateButtons(null);
    }
    const i = e.getEngine().getInputElement();
    i && i.parentNode && (i.parentNode.appendChild(this.overlay), e.onDisposeObservable.addOnce(() => {
      this.dispose();
    }));
  }
  /**
   * Set the helper to be used with this UI component.
   * The UI is bound to an experience helper. If not provided the UI can still be used but the events should be registered by the developer.
   *
   * @param helper the experience helper to attach
   * @param renderTarget an optional render target (in case it is created outside of the helper scope)
   * @returns a promise that resolves when the ui is ready
   */
  async setHelperAsync(e, t) {
    this._helper = e, this._renderTarget = t;
    const i = this._buttons.map((r) => e.sessionManager.isSessionSupportedAsync(r.sessionMode));
    e.onStateChangedObservable.add((r) => {
      r == J.NOT_IN_XR && this._updateButtons(null);
    }), (await Promise.all(i)).forEach((r, n) => {
      r ? (this.overlay.appendChild(this._buttons[n].element), this._buttons[n].element.onclick = this._enterXRWithButtonIndex.bind(this, n)) : B.Warn(`Session mode "${this._buttons[n].sessionMode}" not supported in browser`);
    });
  }
  /**
   * Creates UI to allow the user to enter/exit XR mode
   * @param scene the scene to add the ui to
   * @param helper the xr experience helper to enter/exit xr with
   * @param options options to configure the UI
   * @returns the created ui
   */
  static async CreateAsync(e, t, i) {
    const s = new Vt(e, i);
    return await s.setHelperAsync(t, i.renderTarget || void 0), s;
  }
  async _enterXRWithButtonIndex(e = 0) {
    if (this._helper.state == J.IN_XR)
      await this._helper.exitXRAsync(), this._updateButtons(null);
    else if (this._helper.state == J.NOT_IN_XR)
      try {
        await this._helper.enterXRAsync(this._buttons[e].sessionMode, this._buttons[e].referenceSpaceType, this._renderTarget, {
          optionalFeatures: this.options.optionalFeatures,
          requiredFeatures: this.options.requiredFeatures
        }), this._updateButtons(this._buttons[e]);
      } catch (t) {
        this._updateButtons(null);
        const i = this._buttons[e].element, s = i.title;
        i.title = "Error entering XR session : " + s, i.classList.add("xr-error"), this.options.onError && this.options.onError(t);
      }
  }
  /**
   * Disposes of the XR UI component
   */
  dispose() {
    const e = this._scene.getEngine().getInputElement();
    e && e.parentNode && e.parentNode.contains(this.overlay) && e.parentNode.removeChild(this.overlay), this.activeButtonChangedObservable.clear(), navigator.xr.removeEventListener("sessiongranted", this._onSessionGranted);
  }
  _updateButtons(e) {
    this._activeButton = e, this._buttons.forEach((t) => {
      t.update(this._activeButton);
    }), this.activeButtonChangedObservable.notifyObservers(this._activeButton);
  }
}
class X {
  /**
   * Initializes the physics joint
   * @param type The type of the physics joint
   * @param jointData The data for the physics joint
   */
  constructor(e, t) {
    this.type = e, this.jointData = t, t.nativeParams = t.nativeParams || {};
  }
  /**
   * Gets the physics joint
   */
  get physicsJoint() {
    return this._physicsJoint;
  }
  /**
   * Sets the physics joint
   */
  set physicsJoint(e) {
    this._physicsJoint, this._physicsJoint = e;
  }
  /**
   * Sets the physics plugin
   */
  set physicsPlugin(e) {
    this._physicsPlugin = e;
  }
  /**
   * Execute a function that is physics-plugin specific.
   * @param {Function} func the function that will be executed.
   *                        It accepts two parameters: the physics world and the physics joint
   */
  executeNativeFunction(e) {
    e(this._physicsPlugin.world, this._physicsJoint);
  }
}
X.DistanceJoint = 0;
X.HingeJoint = 1;
X.BallAndSocketJoint = 2;
X.WheelJoint = 3;
X.SliderJoint = 4;
X.PrismaticJoint = 5;
X.UniversalJoint = 6;
X.Hinge2Joint = X.WheelJoint;
X.PointToPointJoint = 8;
X.SpringJoint = 9;
X.LockJoint = 10;
class yn extends X {
  /**
   *
   * @param jointData The data for the Distance-Joint
   */
  constructor(e) {
    super(X.DistanceJoint, e);
  }
  /**
   * Update the predefined distance.
   * @param maxDistance The maximum preferred distance
   * @param minDistance The minimum preferred distance
   */
  updateDistance(e, t) {
    this._physicsPlugin.updateDistanceJoint(this, e, t);
  }
}
class Li extends X {
  /**
   * Initializes the Motor-Enabled Joint
   * @param type The type of the joint
   * @param jointData The physical joint data for the joint
   */
  constructor(e, t) {
    super(e, t);
  }
  /**
   * Set the motor values.
   * Attention, this function is plugin specific. Engines won't react 100% the same.
   * @param force the force to apply
   * @param maxForce max force for this motor.
   */
  setMotor(e, t) {
    this._physicsPlugin.setMotor(this, e || 0, t);
  }
  /**
   * Set the motor's limits.
   * Attention, this function is plugin specific. Engines won't react 100% the same.
   * @param upperLimit The upper limit of the motor
   * @param lowerLimit The lower limit of the motor
   */
  setLimit(e, t) {
    this._physicsPlugin.setLimit(this, e, t);
  }
}
class Sn extends Li {
  /**
   * Initializes the Hinge-Joint
   * @param jointData The joint data for the Hinge-Joint
   */
  constructor(e) {
    super(X.HingeJoint, e);
  }
  /**
   * Set the motor values.
   * Attention, this function is plugin specific. Engines won't react 100% the same.
   * @param {number} force the force to apply
   * @param {number} maxForce max force for this motor.
   */
  setMotor(e, t) {
    this._physicsPlugin.setMotor(this, e || 0, t);
  }
  /**
   * Set the motor's limits.
   * Attention, this function is plugin specific. Engines won't react 100% the same.
   * @param upperLimit The upper limit of the motor
   * @param lowerLimit The lower limit of the motor
   */
  setLimit(e, t) {
    this._physicsPlugin.setLimit(this, e, t);
  }
}
class Rn extends Li {
  /**
   * Initializes the Hinge2-Joint
   * @param jointData The joint data for the Hinge2-Joint
   */
  constructor(e) {
    super(X.Hinge2Joint, e);
  }
  /**
   * Set the motor values.
   * Attention, this function is plugin specific. Engines won't react 100% the same.
   * @param targetSpeed the speed the motor is to reach
   * @param maxForce max force for this motor.
   * @param motorIndex motor's index, 0 or 1.
   */
  setMotor(e, t, i = 0) {
    this._physicsPlugin.setMotor(this, e || 0, t, i);
  }
  /**
   * Set the motor limits.
   * Attention, this function is plugin specific. Engines won't react 100% the same.
   * @param upperLimit the upper limit
   * @param lowerLimit lower limit
   * @param motorIndex the motor's index, 0 or 1.
   */
  setLimit(e, t, i = 0) {
    this._physicsPlugin.setLimit(this, e, t, i);
  }
}
Xe._PhysicsImpostorParser = function(a, e, t) {
  return new I(e, t.physicsImpostor, {
    mass: t.physicsMass,
    friction: t.physicsFriction,
    restitution: t.physicsRestitution
  }, a);
};
class I {
  /**
   * Specifies if the physics imposter is disposed
   */
  get isDisposed() {
    return this._isDisposed;
  }
  /**
   * Gets the mass of the physics imposter
   */
  get mass() {
    return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyMass(this) : 0;
  }
  set mass(e) {
    this.setMass(e);
  }
  /**
   * Gets the coefficient of friction
   */
  get friction() {
    return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyFriction(this) : 0;
  }
  /**
   * Sets the coefficient of friction
   */
  set friction(e) {
    this._physicsEngine && this._physicsEngine.getPhysicsPlugin().setBodyFriction(this, e);
  }
  /**
   * Gets the coefficient of restitution
   */
  get restitution() {
    return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyRestitution(this) : 0;
  }
  /**
   * Sets the coefficient of restitution
   */
  set restitution(e) {
    this._physicsEngine && this._physicsEngine.getPhysicsPlugin().setBodyRestitution(this, e);
  }
  /**
   * Gets the pressure of a soft body; only supported by the AmmoJSPlugin
   */
  get pressure() {
    if (!this._physicsEngine)
      return 0;
    const e = this._physicsEngine.getPhysicsPlugin();
    return e.setBodyPressure ? e.getBodyPressure(this) : 0;
  }
  /**
   * Sets the pressure of a soft body; only supported by the AmmoJSPlugin
   */
  set pressure(e) {
    if (!this._physicsEngine)
      return;
    const t = this._physicsEngine.getPhysicsPlugin();
    t.setBodyPressure && t.setBodyPressure(this, e);
  }
  /**
   * Gets the stiffness of a soft body; only supported by the AmmoJSPlugin
   */
  get stiffness() {
    if (!this._physicsEngine)
      return 0;
    const e = this._physicsEngine.getPhysicsPlugin();
    return e.getBodyStiffness ? e.getBodyStiffness(this) : 0;
  }
  /**
   * Sets the stiffness of a soft body; only supported by the AmmoJSPlugin
   */
  set stiffness(e) {
    if (!this._physicsEngine)
      return;
    const t = this._physicsEngine.getPhysicsPlugin();
    t.setBodyStiffness && t.setBodyStiffness(this, e);
  }
  /**
   * Gets the velocityIterations of a soft body; only supported by the AmmoJSPlugin
   */
  get velocityIterations() {
    if (!this._physicsEngine)
      return 0;
    const e = this._physicsEngine.getPhysicsPlugin();
    return e.getBodyVelocityIterations ? e.getBodyVelocityIterations(this) : 0;
  }
  /**
   * Sets the velocityIterations of a soft body; only supported by the AmmoJSPlugin
   */
  set velocityIterations(e) {
    if (!this._physicsEngine)
      return;
    const t = this._physicsEngine.getPhysicsPlugin();
    t.setBodyVelocityIterations && t.setBodyVelocityIterations(this, e);
  }
  /**
   * Gets the positionIterations of a soft body; only supported by the AmmoJSPlugin
   */
  get positionIterations() {
    if (!this._physicsEngine)
      return 0;
    const e = this._physicsEngine.getPhysicsPlugin();
    return e.getBodyPositionIterations ? e.getBodyPositionIterations(this) : 0;
  }
  /**
   * Sets the positionIterations of a soft body; only supported by the AmmoJSPlugin
   */
  set positionIterations(e) {
    if (!this._physicsEngine)
      return;
    const t = this._physicsEngine.getPhysicsPlugin();
    t.setBodyPositionIterations && t.setBodyPositionIterations(this, e);
  }
  /**
   * Initializes the physics imposter
   * @param object The physics-enabled object used as the physics imposter
   * @param type The type of the physics imposter. Types are available as static members of this class.
   * @param _options The options for the physics imposter
   * @param _scene The Babylon scene
   */
  constructor(e, t, i = { mass: 0 }, s) {
    if (this.object = e, this.type = t, this._options = i, this._scene = s, this._pluginData = {}, this._bodyUpdateRequired = !1, this._onBeforePhysicsStepCallbacks = new Array(), this._onAfterPhysicsStepCallbacks = new Array(), this._onPhysicsCollideCallbacks = [], this._deltaPosition = C.Zero(), this._isDisposed = !1, this.soft = !1, this.segments = 0, this._tmpQuat = new A(), this._tmpQuat2 = new A(), this.beforeStep = () => {
      this._physicsEngine && (this.object.translate(this._deltaPosition, -1), this._deltaRotationConjugated && this.object.rotationQuaternion && this.object.rotationQuaternion.multiplyToRef(this._deltaRotationConjugated, this.object.rotationQuaternion), this.object.computeWorldMatrix(!1), this.object.parent && this.object.rotationQuaternion ? (this.getParentsRotation(), this._tmpQuat.multiplyToRef(this.object.rotationQuaternion, this._tmpQuat)) : this._tmpQuat.copyFrom(this.object.rotationQuaternion || new A()), this._options.disableBidirectionalTransformation || this.object.rotationQuaternion && this._physicsEngine.getPhysicsPlugin().setPhysicsBodyTransformation(
        this,
        /*bInfo.boundingBox.centerWorld*/
        this.object.getAbsolutePosition(),
        this._tmpQuat
      ), this._onBeforePhysicsStepCallbacks.forEach((r) => {
        r(this);
      }));
    }, this.afterStep = () => {
      this._physicsEngine && (this._onAfterPhysicsStepCallbacks.forEach((r) => {
        r(this);
      }), this._physicsEngine.getPhysicsPlugin().setTransformationFromPhysicsBody(this), this.object.parent && this.object.rotationQuaternion && (this.getParentsRotation(), this._tmpQuat.conjugateInPlace(), this._tmpQuat.multiplyToRef(this.object.rotationQuaternion, this.object.rotationQuaternion)), this.object.setAbsolutePosition(this.object.position), this._deltaRotation ? (this.object.rotationQuaternion && this.object.rotationQuaternion.multiplyToRef(this._deltaRotation, this.object.rotationQuaternion), this._deltaPosition.applyRotationQuaternionToRef(this._deltaRotation, I._TmpVecs[0]), this.object.translate(I._TmpVecs[0], 1)) : this.object.translate(this._deltaPosition, 1), this.object.computeWorldMatrix(!0));
    }, this.onCollideEvent = null, this.onCollide = (r) => {
      if (!this._onPhysicsCollideCallbacks.length && !this.onCollideEvent || !this._physicsEngine)
        return;
      const n = this._physicsEngine.getImpostorWithPhysicsBody(r.body);
      n && (this.onCollideEvent && this.onCollideEvent(this, n), this._onPhysicsCollideCallbacks.filter((o) => o.otherImpostors.indexOf(n) !== -1).forEach((o) => {
        o.callback(this, n, r.point, r.distance, r.impulse, r.normal);
      }));
    }, !this.object) {
      R.Error("No object was provided. A physics object is obligatory");
      return;
    }
    this.object.parent && i.mass !== 0 && R.Warn("A physics impostor has been created for an object which has a parent. Babylon physics currently works in local space so unexpected issues may occur."), !this._scene && e.getScene && (this._scene = e.getScene()), this._scene && (this.type > 100 && (this.soft = !0), this._physicsEngine = this._scene.getPhysicsEngine(), this._physicsEngine ? (this.object.rotationQuaternion || (this.object.rotation ? this.object.rotationQuaternion = A.RotationYawPitchRoll(this.object.rotation.y, this.object.rotation.x, this.object.rotation.z) : this.object.rotationQuaternion = new A()), this._options.mass = i.mass === void 0 ? 0 : i.mass, this._options.friction = i.friction === void 0 ? 0.2 : i.friction, this._options.restitution = i.restitution === void 0 ? 0.2 : i.restitution, this.soft && (this._options.mass = this._options.mass > 0 ? this._options.mass : 1, this._options.pressure = i.pressure === void 0 ? 200 : i.pressure, this._options.stiffness = i.stiffness === void 0 ? 1 : i.stiffness, this._options.velocityIterations = i.velocityIterations === void 0 ? 20 : i.velocityIterations, this._options.positionIterations = i.positionIterations === void 0 ? 20 : i.positionIterations, this._options.fixedPoints = i.fixedPoints === void 0 ? 0 : i.fixedPoints, this._options.margin = i.margin === void 0 ? 0 : i.margin, this._options.damping = i.damping === void 0 ? 0 : i.damping, this._options.path = i.path === void 0 ? null : i.path, this._options.shape = i.shape === void 0 ? null : i.shape), this._joints = [], !this.object.parent || this._options.ignoreParent ? this._init() : this.object.parent.physicsImpostor && R.Warn("You must affect impostors to children before affecting impostor to parent.")) : R.Error("Physics not enabled. Please use scene.enablePhysics(...) before creating impostors."));
  }
  /**
   * This function will completely initialize this impostor.
   * It will create a new body - but only if this mesh has no parent.
   * If it has, this impostor will not be used other than to define the impostor
   * of the child mesh.
   * @internal
   */
  _init() {
    this._physicsEngine && (this._physicsEngine.removeImpostor(this), this.physicsBody = null, this._parent = this._parent || this._getPhysicsParent(), !this._isDisposed && (!this.parent || this._options.ignoreParent) && this._physicsEngine.addImpostor(this));
  }
  _getPhysicsParent() {
    return this.object.parent instanceof Ge ? this.object.parent.physicsImpostor : null;
  }
  /**
   * Should a new body be generated.
   * @returns boolean specifying if body initialization is required
   */
  isBodyInitRequired() {
    return this._bodyUpdateRequired || !this._physicsBody && (!this._parent || !!this._options.ignoreParent);
  }
  /**
   * Sets the updated scaling
   */
  setScalingUpdated() {
    this.forceUpdate();
  }
  /**
   * Force a regeneration of this or the parent's impostor's body.
   * Use with caution - This will remove all previously-instantiated joints.
   */
  forceUpdate() {
    this._init(), this.parent && !this._options.ignoreParent && this.parent.forceUpdate();
  }
  /*public get mesh(): AbstractMesh {
      return this._mesh;
  }*/
  /**
   * Gets the body that holds this impostor. Either its own, or its parent.
   */
  get physicsBody() {
    return this._parent && !this._options.ignoreParent ? this._parent.physicsBody : this._physicsBody;
  }
  /**
   * Get the parent of the physics imposter
   * @returns Physics imposter or null
   */
  get parent() {
    return !this._options.ignoreParent && this._parent ? this._parent : null;
  }
  /**
   * Sets the parent of the physics imposter
   */
  set parent(e) {
    this._parent = e;
  }
  /**
   * Set the physics body. Used mainly by the physics engine/plugin
   */
  set physicsBody(e) {
    this._physicsBody && this._physicsEngine && this._physicsEngine.getPhysicsPlugin().removePhysicsBody(this), this._physicsBody = e, this.resetUpdateFlags();
  }
  /**
   * Resets the update flags
   */
  resetUpdateFlags() {
    this._bodyUpdateRequired = !1;
  }
  /**
   * Gets the object extents
   * @returns the object extents
   */
  getObjectExtents() {
    if (this.object.getBoundingInfo) {
      const e = this.object.rotationQuaternion, t = this.object.scaling.clone();
      this.object.rotationQuaternion = I.IDENTITY_QUATERNION;
      const i = this.object.computeWorldMatrix && this.object.computeWorldMatrix(!0);
      i && i.decompose(t, void 0, void 0);
      const r = this.object.getBoundingInfo().boundingBox.extendSize.scale(2).multiplyInPlace(t);
      return r.x = Math.abs(r.x), r.y = Math.abs(r.y), r.z = Math.abs(r.z), this.object.rotationQuaternion = e, this.object.computeWorldMatrix && this.object.computeWorldMatrix(!0), r;
    } else
      return I.DEFAULT_OBJECT_SIZE;
  }
  /**
   * Gets the object center
   * @returns The object center
   */
  getObjectCenter() {
    return this.object.getBoundingInfo ? this.object.getBoundingInfo().boundingBox.centerWorld : this.object.position;
  }
  /**
   * Get a specific parameter from the options parameters
   * @param paramName The object parameter name
   * @returns The object parameter
   */
  getParam(e) {
    return this._options[e];
  }
  /**
   * Sets a specific parameter in the options given to the physics plugin
   * @param paramName The parameter name
   * @param value The value of the parameter
   */
  setParam(e, t) {
    this._options[e] = t, this._bodyUpdateRequired = !0;
  }
  /**
   * Specifically change the body's mass. Won't recreate the physics body object
   * @param mass The mass of the physics imposter
   */
  setMass(e) {
    this.getParam("mass") !== e && this.setParam("mass", e), this._physicsEngine && this._physicsEngine.getPhysicsPlugin().setBodyMass(this, e);
  }
  /**
   * Gets the linear velocity
   * @returns  linear velocity or null
   */
  getLinearVelocity() {
    return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getLinearVelocity(this) : C.Zero();
  }
  /**
   * Sets the linear velocity
   * @param velocity  linear velocity or null
   */
  setLinearVelocity(e) {
    this._physicsEngine && this._physicsEngine.getPhysicsPlugin().setLinearVelocity(this, e);
  }
  /**
   * Gets the angular velocity
   * @returns angular velocity or null
   */
  getAngularVelocity() {
    return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getAngularVelocity(this) : C.Zero();
  }
  /**
   * Sets the angular velocity
   * @param velocity The velocity or null
   */
  setAngularVelocity(e) {
    this._physicsEngine && this._physicsEngine.getPhysicsPlugin().setAngularVelocity(this, e);
  }
  /**
   * Execute a function with the physics plugin native code
   * Provide a function the will have two variables - the world object and the physics body object
   * @param func The function to execute with the physics plugin native code
   */
  executeNativeFunction(e) {
    this._physicsEngine && e(this._physicsEngine.getPhysicsPlugin().world, this.physicsBody);
  }
  /**
   * Register a function that will be executed before the physics world is stepping forward
   * @param func The function to execute before the physics world is stepped forward
   */
  registerBeforePhysicsStep(e) {
    this._onBeforePhysicsStepCallbacks.push(e);
  }
  /**
   * Unregister a function that will be executed before the physics world is stepping forward
   * @param func The function to execute before the physics world is stepped forward
   */
  unregisterBeforePhysicsStep(e) {
    const t = this._onBeforePhysicsStepCallbacks.indexOf(e);
    t > -1 ? this._onBeforePhysicsStepCallbacks.splice(t, 1) : R.Warn("Function to remove was not found");
  }
  /**
   * Register a function that will be executed after the physics step
   * @param func The function to execute after physics step
   */
  registerAfterPhysicsStep(e) {
    this._onAfterPhysicsStepCallbacks.push(e);
  }
  /**
   * Unregisters a function that will be executed after the physics step
   * @param func The function to execute after physics step
   */
  unregisterAfterPhysicsStep(e) {
    const t = this._onAfterPhysicsStepCallbacks.indexOf(e);
    t > -1 ? this._onAfterPhysicsStepCallbacks.splice(t, 1) : R.Warn("Function to remove was not found");
  }
  /**
   * register a function that will be executed when this impostor collides against a different body
   * @param collideAgainst Physics imposter, or array of physics imposters to collide against
   * @param func Callback that is executed on collision
   */
  registerOnPhysicsCollide(e, t) {
    const i = e instanceof Array ? e : [e];
    this._onPhysicsCollideCallbacks.push({ callback: t, otherImpostors: i });
  }
  /**
   * Unregisters the physics imposter's collision callback
   * @param collideAgainst The physics object to collide against
   * @param func Callback to execute on collision
   */
  unregisterOnPhysicsCollide(e, t) {
    const i = e instanceof Array ? e : [e];
    let s = -1;
    this._onPhysicsCollideCallbacks.some((n, o) => {
      if (n.callback === t && n.otherImpostors.length === i.length) {
        const l = n.otherImpostors.every((h) => i.indexOf(h) > -1);
        return l && (s = o), l;
      }
      return !1;
    }) ? this._onPhysicsCollideCallbacks.splice(s, 1) : R.Warn("Function to remove was not found");
  }
  /**
   * Get the parent rotation
   * @returns The parent rotation
   */
  getParentsRotation() {
    let e = this.object.parent;
    for (this._tmpQuat.copyFromFloats(0, 0, 0, 1); e; )
      e.rotationQuaternion ? this._tmpQuat2.copyFrom(e.rotationQuaternion) : A.RotationYawPitchRollToRef(e.rotation.y, e.rotation.x, e.rotation.z, this._tmpQuat2), this._tmpQuat.multiplyToRef(this._tmpQuat2, this._tmpQuat), e = e.parent;
    return this._tmpQuat;
  }
  /**
   * Apply a force
   * @param force The force to apply
   * @param contactPoint The contact point for the force
   * @returns The physics imposter
   */
  applyForce(e, t) {
    return this._physicsEngine && this._physicsEngine.getPhysicsPlugin().applyForce(this, e, t), this;
  }
  /**
   * Apply an impulse
   * @param force The impulse force
   * @param contactPoint The contact point for the impulse force
   * @returns The physics imposter
   */
  applyImpulse(e, t) {
    return this._physicsEngine && this._physicsEngine.getPhysicsPlugin().applyImpulse(this, e, t), this;
  }
  /**
   * A help function to create a joint
   * @param otherImpostor A physics imposter used to create a joint
   * @param jointType The type of joint
   * @param jointData The data for the joint
   * @returns The physics imposter
   */
  createJoint(e, t, i) {
    const s = new X(t, i);
    return this.addJoint(e, s), this;
  }
  /**
   * Add a joint to this impostor with a different impostor
   * @param otherImpostor A physics imposter used to add a joint
   * @param joint The joint to add
   * @returns The physics imposter
   */
  addJoint(e, t) {
    return this._joints.push({
      otherImpostor: e,
      joint: t
    }), this._physicsEngine && this._physicsEngine.addJoint(this, e, t), this;
  }
  /**
   * Add an anchor to a cloth impostor
   * @param otherImpostor rigid impostor to anchor to
   * @param width ratio across width from 0 to 1
   * @param height ratio up height from 0 to 1
   * @param influence the elasticity between cloth impostor and anchor from 0, very stretchy to 1, little stretch
   * @param noCollisionBetweenLinkedBodies when true collisions between cloth impostor and anchor are ignored; default false
   * @returns impostor the soft imposter
   */
  addAnchor(e, t, i, s, r) {
    if (!this._physicsEngine)
      return this;
    const n = this._physicsEngine.getPhysicsPlugin();
    return n.appendAnchor ? (this._physicsEngine && n.appendAnchor(this, e, t, i, s, r), this) : this;
  }
  /**
   * Add a hook to a rope impostor
   * @param otherImpostor rigid impostor to anchor to
   * @param length ratio across rope from 0 to 1
   * @param influence the elasticity between rope impostor and anchor from 0, very stretchy to 1, little stretch
   * @param noCollisionBetweenLinkedBodies when true collisions between soft impostor and anchor are ignored; default false
   * @returns impostor the rope imposter
   */
  addHook(e, t, i, s) {
    if (!this._physicsEngine)
      return this;
    const r = this._physicsEngine.getPhysicsPlugin();
    return r.appendAnchor ? (this._physicsEngine && r.appendHook(this, e, t, i, s), this) : this;
  }
  /**
   * Will keep this body still, in a sleep mode.
   * @returns the physics imposter
   */
  sleep() {
    return this._physicsEngine && this._physicsEngine.getPhysicsPlugin().sleepBody(this), this;
  }
  /**
   * Wake the body up.
   * @returns The physics imposter
   */
  wakeUp() {
    return this._physicsEngine && this._physicsEngine.getPhysicsPlugin().wakeUpBody(this), this;
  }
  /**
   * Clones the physics imposter
   * @param newObject The physics imposter clones to this physics-enabled object
   * @returns A nullable physics imposter
   */
  clone(e) {
    return e ? new I(e, this.type, this._options, this._scene) : null;
  }
  /**
   * Disposes the physics imposter
   */
  dispose() {
    this._physicsEngine && (this._joints.forEach((e) => {
      this._physicsEngine && this._physicsEngine.removeJoint(this, e.otherImpostor, e.joint);
    }), this._physicsEngine.removeImpostor(this), this.parent && this.parent.forceUpdate(), this._isDisposed = !0);
  }
  /**
   * Sets the delta position
   * @param position The delta position amount
   */
  setDeltaPosition(e) {
    this._deltaPosition.copyFrom(e);
  }
  /**
   * Sets the delta rotation
   * @param rotation The delta rotation amount
   */
  setDeltaRotation(e) {
    this._deltaRotation || (this._deltaRotation = new A()), this._deltaRotation.copyFrom(e), this._deltaRotationConjugated = this._deltaRotation.conjugate();
  }
  /**
   * Gets the box size of the physics imposter and stores the result in the input parameter
   * @param result Stores the box size
   * @returns The physics imposter
   */
  getBoxSizeToRef(e) {
    return this._physicsEngine && this._physicsEngine.getPhysicsPlugin().getBoxSizeToRef(this, e), this;
  }
  /**
   * Gets the radius of the physics imposter
   * @returns Radius of the physics imposter
   */
  getRadius() {
    return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getRadius(this) : 0;
  }
  /**
   * Sync a bone with this impostor
   * @param bone The bone to sync to the impostor.
   * @param boneMesh The mesh that the bone is influencing.
   * @param jointPivot The pivot of the joint / bone in local space.
   * @param distToJoint Optional distance from the impostor to the joint.
   * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
   */
  syncBoneWithImpostor(e, t, i, s, r) {
    const n = I._TmpVecs[0], o = this.object;
    if (o.rotationQuaternion)
      if (r) {
        const l = I._TmpQuat;
        o.rotationQuaternion.multiplyToRef(r, l), e.setRotationQuaternion(l, je.WORLD, t);
      } else
        e.setRotationQuaternion(o.rotationQuaternion, je.WORLD, t);
    n.x = 0, n.y = 0, n.z = 0, i && (n.x = i.x, n.y = i.y, n.z = i.z, e.getDirectionToRef(n, t, n), s == null && (s = i.length()), n.x *= s, n.y *= s, n.z *= s), e.getParent() ? (n.addInPlace(o.getAbsolutePosition()), e.setAbsolutePosition(n, t)) : (t.setAbsolutePosition(o.getAbsolutePosition()), t.position.x -= n.x, t.position.y -= n.y, t.position.z -= n.z);
  }
  /**
   * Sync impostor to a bone
   * @param bone The bone that the impostor will be synced to.
   * @param boneMesh The mesh that the bone is influencing.
   * @param jointPivot The pivot of the joint / bone in local space.
   * @param distToJoint Optional distance from the impostor to the joint.
   * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
   * @param boneAxis Optional vector3 axis the bone is aligned with
   */
  syncImpostorWithBone(e, t, i, s, r, n) {
    const o = this.object;
    if (o.rotationQuaternion)
      if (r) {
        const c = I._TmpQuat;
        e.getRotationQuaternionToRef(je.WORLD, t, c), c.multiplyToRef(r, o.rotationQuaternion);
      } else
        e.getRotationQuaternionToRef(je.WORLD, t, o.rotationQuaternion);
    const l = I._TmpVecs[0], h = I._TmpVecs[1];
    n || (n = I._TmpVecs[2], n.x = 0, n.y = 1, n.z = 0), e.getDirectionToRef(n, t, h), e.getAbsolutePositionToRef(t, l), s == null && i && (s = i.length()), s != null && (l.x += h.x * s, l.y += h.y * s, l.z += h.z * s), o.setAbsolutePosition(l);
  }
}
I.DEFAULT_OBJECT_SIZE = new C(1, 1, 1);
I.IDENTITY_QUATERNION = A.Identity();
I._TmpVecs = Wi.BuildArray(3, C.Zero);
I._TmpQuat = A.Identity();
I.NoImpostor = 0;
I.SphereImpostor = 1;
I.BoxImpostor = 2;
I.PlaneImpostor = 3;
I.MeshImpostor = 4;
I.CapsuleImpostor = 6;
I.CylinderImpostor = 7;
I.ParticleImpostor = 8;
I.HeightmapImpostor = 9;
I.ConvexHullImpostor = 10;
I.CustomImpostor = 100;
I.RopeImpostor = 101;
I.ClothImpostor = 102;
I.SoftbodyImpostor = 103;
var Pe;
(function(a) {
  a.WRIST = "wrist", a.THUMB = "thumb", a.INDEX = "index", a.MIDDLE = "middle", a.RING = "ring", a.LITTLE = "little";
})(Pe || (Pe = {}));
var m;
(function(a) {
  a.WRIST = "wrist", a.THUMB_METACARPAL = "thumb-metacarpal", a.THUMB_PHALANX_PROXIMAL = "thumb-phalanx-proximal", a.THUMB_PHALANX_DISTAL = "thumb-phalanx-distal", a.THUMB_TIP = "thumb-tip", a.INDEX_FINGER_METACARPAL = "index-finger-metacarpal", a.INDEX_FINGER_PHALANX_PROXIMAL = "index-finger-phalanx-proximal", a.INDEX_FINGER_PHALANX_INTERMEDIATE = "index-finger-phalanx-intermediate", a.INDEX_FINGER_PHALANX_DISTAL = "index-finger-phalanx-distal", a.INDEX_FINGER_TIP = "index-finger-tip", a.MIDDLE_FINGER_METACARPAL = "middle-finger-metacarpal", a.MIDDLE_FINGER_PHALANX_PROXIMAL = "middle-finger-phalanx-proximal", a.MIDDLE_FINGER_PHALANX_INTERMEDIATE = "middle-finger-phalanx-intermediate", a.MIDDLE_FINGER_PHALANX_DISTAL = "middle-finger-phalanx-distal", a.MIDDLE_FINGER_TIP = "middle-finger-tip", a.RING_FINGER_METACARPAL = "ring-finger-metacarpal", a.RING_FINGER_PHALANX_PROXIMAL = "ring-finger-phalanx-proximal", a.RING_FINGER_PHALANX_INTERMEDIATE = "ring-finger-phalanx-intermediate", a.RING_FINGER_PHALANX_DISTAL = "ring-finger-phalanx-distal", a.RING_FINGER_TIP = "ring-finger-tip", a.PINKY_FINGER_METACARPAL = "pinky-finger-metacarpal", a.PINKY_FINGER_PHALANX_PROXIMAL = "pinky-finger-phalanx-proximal", a.PINKY_FINGER_PHALANX_INTERMEDIATE = "pinky-finger-phalanx-intermediate", a.PINKY_FINGER_PHALANX_DISTAL = "pinky-finger-phalanx-distal", a.PINKY_FINGER_TIP = "pinky-finger-tip";
})(m || (m = {}));
const fe = [
  m.WRIST,
  m.THUMB_METACARPAL,
  m.THUMB_PHALANX_PROXIMAL,
  m.THUMB_PHALANX_DISTAL,
  m.THUMB_TIP,
  m.INDEX_FINGER_METACARPAL,
  m.INDEX_FINGER_PHALANX_PROXIMAL,
  m.INDEX_FINGER_PHALANX_INTERMEDIATE,
  m.INDEX_FINGER_PHALANX_DISTAL,
  m.INDEX_FINGER_TIP,
  m.MIDDLE_FINGER_METACARPAL,
  m.MIDDLE_FINGER_PHALANX_PROXIMAL,
  m.MIDDLE_FINGER_PHALANX_INTERMEDIATE,
  m.MIDDLE_FINGER_PHALANX_DISTAL,
  m.MIDDLE_FINGER_TIP,
  m.RING_FINGER_METACARPAL,
  m.RING_FINGER_PHALANX_PROXIMAL,
  m.RING_FINGER_PHALANX_INTERMEDIATE,
  m.RING_FINGER_PHALANX_DISTAL,
  m.RING_FINGER_TIP,
  m.PINKY_FINGER_METACARPAL,
  m.PINKY_FINGER_PHALANX_PROXIMAL,
  m.PINKY_FINGER_PHALANX_INTERMEDIATE,
  m.PINKY_FINGER_PHALANX_DISTAL,
  m.PINKY_FINGER_TIP
], gr = {
  [Pe.WRIST]: [m.WRIST],
  [Pe.THUMB]: [m.THUMB_METACARPAL, m.THUMB_PHALANX_PROXIMAL, m.THUMB_PHALANX_DISTAL, m.THUMB_TIP],
  [Pe.INDEX]: [
    m.INDEX_FINGER_METACARPAL,
    m.INDEX_FINGER_PHALANX_PROXIMAL,
    m.INDEX_FINGER_PHALANX_INTERMEDIATE,
    m.INDEX_FINGER_PHALANX_DISTAL,
    m.INDEX_FINGER_TIP
  ],
  [Pe.MIDDLE]: [
    m.MIDDLE_FINGER_METACARPAL,
    m.MIDDLE_FINGER_PHALANX_PROXIMAL,
    m.MIDDLE_FINGER_PHALANX_INTERMEDIATE,
    m.MIDDLE_FINGER_PHALANX_DISTAL,
    m.MIDDLE_FINGER_TIP
  ],
  [Pe.RING]: [
    m.RING_FINGER_METACARPAL,
    m.RING_FINGER_PHALANX_PROXIMAL,
    m.RING_FINGER_PHALANX_INTERMEDIATE,
    m.RING_FINGER_PHALANX_DISTAL,
    m.RING_FINGER_TIP
  ],
  [Pe.LITTLE]: [
    m.PINKY_FINGER_METACARPAL,
    m.PINKY_FINGER_PHALANX_PROXIMAL,
    m.PINKY_FINGER_PHALANX_INTERMEDIATE,
    m.PINKY_FINGER_PHALANX_DISTAL,
    m.PINKY_FINGER_TIP
  ]
};
class Cr {
  /**
   * Get the hand mesh.
   */
  get handMesh() {
    return this._handMesh;
  }
  /**
   * Get meshes of part of the hand.
   * @param part The part of hand to get.
   * @returns An array of meshes that correlate to the hand part requested.
   */
  getHandPartMeshes(e) {
    return gr[e].map((t) => this._jointMeshes[fe.indexOf(t)]);
  }
  /**
   * Retrieves a mesh linked to a named joint in the hand.
   * @param jointName The name of the joint.
   * @returns An AbstractMesh whose position corresponds with the joint position.
   */
  getJointMesh(e) {
    return this._jointMeshes[fe.indexOf(e)];
  }
  /**
   * Construct a new hand object
   * @param xrController The controller to which the hand correlates.
   * @param _jointMeshes The meshes to be used to track the hand joints.
   * @param _handMesh An optional hand mesh.
   * @param rigMapping An optional rig mapping for the hand mesh.
   *                   If not provided (but a hand mesh is provided),
   *                   it will be assumed that the hand mesh's bones are named
   *                   directly after the WebXR bone names.
   * @param _leftHandedMeshes Are the hand meshes left-handed-system meshes
   * @param _jointsInvisible Are the tracked joint meshes visible
   * @param _jointScaleFactor Scale factor for all joint meshes
   */
  constructor(e, t, i, s, r = !1, n = !1, o = 1) {
    this.xrController = e, this._jointMeshes = t, this._handMesh = i, this.rigMapping = s, this._leftHandedMeshes = r, this._jointsInvisible = n, this._jointScaleFactor = o, this.onHandMeshSetObservable = new x(), this._jointTransforms = new Array(fe.length), this._jointTransformMatrices = new Float32Array(fe.length * 16), this._tempJointMatrix = new ce(), this._jointRadii = new Float32Array(fe.length), this._scene = t[0].getScene();
    for (let l = 0; l < this._jointTransforms.length; l++) {
      const h = this._jointTransforms[l] = new vs(fe[l], this._scene);
      h.rotationQuaternion = new A(), t[l].rotationQuaternion = new A();
    }
    i && this.setHandMesh(i, s), this.xrController.motionController && this.xrController.motionController.rootMesh && this.xrController.motionController.rootMesh.dispose(!1, !0), this.xrController.onMotionControllerInitObservable.add((l) => {
      l._doNotLoadControllerMesh = !0;
    });
  }
  /**
   * Sets the current hand mesh to render for the WebXRHand.
   * @param handMesh The rigged hand mesh that will be tracked to the user's hand.
   * @param rigMapping The mapping from XRHandJoint to bone names to use with the mesh.
   * @param _xrSessionManager The XRSessionManager used to initialize the hand mesh.
   */
  setHandMesh(e, t, i) {
    if (this._handMesh = e, e.alwaysSelectAsActiveMesh = !0, e.getChildMeshes().forEach((s) => {
      s.alwaysSelectAsActiveMesh = !0;
    }), this._handMesh.skeleton) {
      const s = this._handMesh.skeleton;
      fe.forEach((r, n) => {
        const o = s.getBoneIndexByName(t ? t[r] : r);
        o !== -1 && s.bones[o].linkTransformNode(this._jointTransforms[n]);
      });
    }
    this.onHandMeshSetObservable.notifyObservers(this);
  }
  /**
   * Update this hand from the latest xr frame.
   * @param xrFrame The latest frame received from WebXR.
   * @param referenceSpace The current viewer reference space.
   */
  updateFromXRFrame(e, t) {
    const i = this.xrController.inputSource.hand;
    if (!i)
      return;
    const s = i, r = fe.map((o) => s[o] || i.get(o));
    let n = !1;
    if (e.fillPoses && e.fillJointRadii)
      n = e.fillPoses(r, t, this._jointTransformMatrices) && e.fillJointRadii(r, this._jointRadii);
    else if (e.getJointPose) {
      n = !0;
      for (let o = 0; o < r.length; o++) {
        const l = e.getJointPose(r[o], t);
        if (l)
          this._jointTransformMatrices.set(l.transform.matrix, o * 16), this._jointRadii[o] = l.radius || 8e-3;
        else {
          n = !1;
          break;
        }
      }
    }
    n && (fe.forEach((o, l) => {
      const h = this._jointTransforms[l];
      ce.FromArrayToRef(this._jointTransformMatrices, l * 16, this._tempJointMatrix), this._tempJointMatrix.decompose(void 0, h.rotationQuaternion, h.position);
      const c = this._jointRadii[l] * this._jointScaleFactor, d = this._jointMeshes[l];
      d.isVisible = !this._handMesh && !this._jointsInvisible, d.position.copyFrom(h.position), d.rotationQuaternion.copyFrom(h.rotationQuaternion), d.scaling.setAll(c), this._scene.useRightHandedSystem || (d.position.z *= -1, d.rotationQuaternion.z *= -1, d.rotationQuaternion.w *= -1, this._leftHandedMeshes && this._handMesh && (h.position.z *= -1, h.rotationQuaternion.z *= -1, h.rotationQuaternion.w *= -1));
    }), this._handMesh && (this._handMesh.isVisible = !0));
  }
  /**
   * Dispose this Hand object
   * @param disposeMeshes Should the meshes be disposed as well
   */
  dispose(e = !1) {
    this._handMesh && (e ? (this._handMesh.skeleton?.dispose(), this._handMesh.dispose(!1, !0)) : this._handMesh.isVisible = !1);
  }
}
class E extends ft {
  static _GenerateTrackedJointMeshes(e) {
    const t = {};
    return ["left", "right"].map((i) => {
      const s = [], r = e.jointMeshes?.sourceMesh || Es("jointParent", E._ICOSPHERE_PARAMS);
      r.isVisible = !!e.jointMeshes?.keepOriginalVisible;
      for (let n = 0; n < fe.length; ++n) {
        let o = r.createInstance(`${i}-handJoint-${n}`);
        if (e.jointMeshes?.onHandJointMeshGenerated) {
          const l = e.jointMeshes.onHandJointMeshGenerated(o, n, i);
          l && l !== o && (o.dispose(), o = l);
        }
        if (o.isPickable = !1, e.jointMeshes?.enablePhysics) {
          const l = e.jointMeshes?.physicsProps || {};
          o.scaling.setAll(0.02);
          const h = l.impostorType !== void 0 ? l.impostorType : I.SphereImpostor;
          o.physicsImpostor = new I(o, h, { mass: 0, ...l });
        }
        o.rotationQuaternion = new A(), o.isVisible = !1, s.push(o);
      }
      t[i] = s;
    }), { left: t.left, right: t.right };
  }
  static _GenerateDefaultHandMeshesAsync(e, t, i) {
    return new Promise(async (s) => {
      const r = {};
      E._RightHandGLB?.meshes[1]?.isDisposed() && (E._RightHandGLB = null), E._LeftHandGLB?.meshes[1]?.isDisposed() && (E._LeftHandGLB = null);
      const n = !!(E._RightHandGLB && E._LeftHandGLB), o = await Promise.all([
        E._RightHandGLB || lt.ImportMeshAsync("", E.DEFAULT_HAND_MODEL_BASE_URL, E.DEFAULT_HAND_MODEL_RIGHT_FILENAME, e),
        E._LeftHandGLB || lt.ImportMeshAsync("", E.DEFAULT_HAND_MODEL_BASE_URL, E.DEFAULT_HAND_MODEL_LEFT_FILENAME, e)
      ]);
      E._RightHandGLB = o[0], E._LeftHandGLB = o[1];
      const l = await V.ParseFromFileAsync("handShader", E.DEFAULT_HAND_MODEL_SHADER_URL, e);
      l.needDepthPrePass = !0, l.transparencyMode = Ot.MATERIAL_ALPHABLEND, l.alphaMode = 2, l.build(!1);
      const h = {
        base: U.FromInts(116, 63, 203),
        fresnel: U.FromInts(149, 102, 229),
        fingerColor: U.FromInts(177, 130, 255),
        tipFresnel: U.FromInts(220, 200, 255),
        ...i?.handMeshes?.customColors
      }, c = {
        base: l.getBlockByName("baseColor"),
        fresnel: l.getBlockByName("fresnelColor"),
        fingerColor: l.getBlockByName("fingerColor"),
        tipFresnel: l.getBlockByName("tipFresnelColor")
      };
      c.base.value = h.base, c.fresnel.value = h.fresnel, c.fingerColor.value = h.fingerColor, c.tipFresnel.value = h.tipFresnel;
      const d = t._getBaseLayerWrapper()?.isMultiview;
      ["left", "right"].forEach((f) => {
        const _ = f == "left" ? E._LeftHandGLB : E._RightHandGLB;
        if (!_)
          throw new Error("Could not load hand model");
        const g = _.meshes[1];
        g._internalAbstractMeshDataInfo._computeBonesUsingShaders = !0, d || (g.material = l.clone(`${f}HandShaderClone`, !0)), g.isVisible = !1, r[f] = g, !n && !e.useRightHandedSystem && _.meshes[1].rotate(ct.Y, Math.PI);
      }), l.dispose(), s({ left: r.left, right: r.right });
    });
  }
  /**
   * Generates a mapping from XRHandJoint to bone name for the default hand mesh.
   * @param handedness The handedness being mapped for.
   * @returns A mapping from XRHandJoint to bone name.
   */
  static _GenerateDefaultHandMeshRigMapping(e) {
    const t = e == "right" ? "R" : "L";
    return {
      [m.WRIST]: `wrist_${t}`,
      [m.THUMB_METACARPAL]: `thumb_metacarpal_${t}`,
      [m.THUMB_PHALANX_PROXIMAL]: `thumb_proxPhalanx_${t}`,
      [m.THUMB_PHALANX_DISTAL]: `thumb_distPhalanx_${t}`,
      [m.THUMB_TIP]: `thumb_tip_${t}`,
      [m.INDEX_FINGER_METACARPAL]: `index_metacarpal_${t}`,
      [m.INDEX_FINGER_PHALANX_PROXIMAL]: `index_proxPhalanx_${t}`,
      [m.INDEX_FINGER_PHALANX_INTERMEDIATE]: `index_intPhalanx_${t}`,
      [m.INDEX_FINGER_PHALANX_DISTAL]: `index_distPhalanx_${t}`,
      [m.INDEX_FINGER_TIP]: `index_tip_${t}`,
      [m.MIDDLE_FINGER_METACARPAL]: `middle_metacarpal_${t}`,
      [m.MIDDLE_FINGER_PHALANX_PROXIMAL]: `middle_proxPhalanx_${t}`,
      [m.MIDDLE_FINGER_PHALANX_INTERMEDIATE]: `middle_intPhalanx_${t}`,
      [m.MIDDLE_FINGER_PHALANX_DISTAL]: `middle_distPhalanx_${t}`,
      [m.MIDDLE_FINGER_TIP]: `middle_tip_${t}`,
      [m.RING_FINGER_METACARPAL]: `ring_metacarpal_${t}`,
      [m.RING_FINGER_PHALANX_PROXIMAL]: `ring_proxPhalanx_${t}`,
      [m.RING_FINGER_PHALANX_INTERMEDIATE]: `ring_intPhalanx_${t}`,
      [m.RING_FINGER_PHALANX_DISTAL]: `ring_distPhalanx_${t}`,
      [m.RING_FINGER_TIP]: `ring_tip_${t}`,
      [m.PINKY_FINGER_METACARPAL]: `little_metacarpal_${t}`,
      [m.PINKY_FINGER_PHALANX_PROXIMAL]: `little_proxPhalanx_${t}`,
      [m.PINKY_FINGER_PHALANX_INTERMEDIATE]: `little_intPhalanx_${t}`,
      [m.PINKY_FINGER_PHALANX_DISTAL]: `little_distPhalanx_${t}`,
      [m.PINKY_FINGER_TIP]: `little_tip_${t}`
    };
  }
  /**
   * Check if the needed objects are defined.
   * This does not mean that the feature is enabled, but that the objects needed are well defined.
   * @returns true if the needed objects for this feature are defined
   */
  isCompatible() {
    return typeof XRHand < "u";
  }
  /**
   * Get the hand object according to the controller id
   * @param controllerId the controller id to which we want to get the hand
   * @returns null if not found or the WebXRHand object if found
   */
  getHandByControllerId(e) {
    return this._attachedHands[e];
  }
  /**
   * Get a hand object according to the requested handedness
   * @param handedness the handedness to request
   * @returns null if not found or the WebXRHand object if found
   */
  getHandByHandedness(e) {
    return e == "none" ? null : this._trackingHands[e];
  }
  /**
   * Creates a new instance of the XR hand tracking feature.
   * @param _xrSessionManager An instance of WebXRSessionManager.
   * @param options Options to use when constructing this feature.
   */
  constructor(e, t) {
    super(e), this.options = t, this._attachedHands = {}, this._trackingHands = { left: null, right: null }, this._handResources = { jointMeshes: null, handMeshes: null, rigMappings: null }, this._worldScaleObserver = null, this.onHandAddedObservable = new x(), this.onHandRemovedObservable = new x(), this._attachHand = (r) => {
      if (!r.inputSource.hand || r.inputSource.handedness == "none" || !this._handResources.jointMeshes)
        return;
      const n = r.inputSource.handedness, o = new Cr(r, this._handResources.jointMeshes[n], this._handResources.handMeshes && this._handResources.handMeshes[n], this._handResources.rigMappings && this._handResources.rigMappings[n], this.options.handMeshes?.meshesUseLeftHandedCoordinates, this.options.jointMeshes?.invisible, this.options.jointMeshes?.scaleFactor);
      this._attachedHands[r.uniqueId] = o, this._trackingHands[n] = o, this.onHandAddedObservable.notifyObservers(o);
    }, this._detachHand = (r) => {
      this._detachHandById(r.uniqueId);
    }, this.xrNativeFeatureName = "hand-tracking";
    const s = t.jointMeshes;
    if (s && (typeof s.disableDefaultHandMesh < "u" && (t.handMeshes = t.handMeshes || {}, t.handMeshes.disableDefaultMeshes = s.disableDefaultHandMesh), typeof s.handMeshes < "u" && (t.handMeshes = t.handMeshes || {}, t.handMeshes.customMeshes = s.handMeshes), typeof s.leftHandedSystemMeshes < "u" && (t.handMeshes = t.handMeshes || {}, t.handMeshes.meshesUseLeftHandedCoordinates = s.leftHandedSystemMeshes), typeof s.rigMapping < "u")) {
      t.handMeshes = t.handMeshes || {};
      const r = {}, n = {};
      [
        [s.rigMapping.left, r],
        [s.rigMapping.right, n]
      ].forEach((o) => {
        const l = o[0], h = o[1];
        l.forEach((c, d) => {
          h[fe[d]] = c;
        });
      }), t.handMeshes.customRigMappings = {
        left: r,
        right: n
      };
    }
  }
  /**
   * Attach this feature.
   * Will usually be called by the features manager.
   *
   * @returns true if successful.
   */
  attach() {
    return super.attach() ? (this._handResources = {
      jointMeshes: E._GenerateTrackedJointMeshes(this.options),
      handMeshes: this.options.handMeshes?.customMeshes || null,
      rigMappings: this.options.handMeshes?.customRigMappings || null
    }, !this.options.handMeshes?.customMeshes && !this.options.handMeshes?.disableDefaultMeshes && (E._GenerateDefaultHandMeshesAsync(He.LastCreatedScene, this._xrSessionManager, this.options).then((e) => {
      this._handResources.handMeshes = e, this._handResources.rigMappings = {
        left: E._GenerateDefaultHandMeshRigMapping("left"),
        right: E._GenerateDefaultHandMeshRigMapping("right")
      }, this._trackingHands.left?.setHandMesh(this._handResources.handMeshes.left, this._handResources.rigMappings.left, this._xrSessionManager), this._trackingHands.right?.setHandMesh(this._handResources.handMeshes.right, this._handResources.rigMappings.right, this._xrSessionManager), this._handResources.handMeshes.left.scaling.setAll(this._xrSessionManager.worldScalingFactor), this._handResources.handMeshes.right.scaling.setAll(this._xrSessionManager.worldScalingFactor);
    }), this._worldScaleObserver = this._xrSessionManager.onWorldScaleFactorChangedObservable.add((e) => {
      this._handResources.handMeshes && (this._handResources.handMeshes.left.scaling.scaleInPlace(e.newScaleFactor / e.previousScaleFactor), this._handResources.handMeshes.right.scaling.scaleInPlace(e.newScaleFactor / e.previousScaleFactor));
    })), this.options.xrInput.controllers.forEach(this._attachHand), this._addNewAttachObserver(this.options.xrInput.onControllerAddedObservable, this._attachHand), this._addNewAttachObserver(this.options.xrInput.onControllerRemovedObservable, this._detachHand), !0) : !1;
  }
  _onXRFrame(e) {
    this._trackingHands.left?.updateFromXRFrame(e, this._xrSessionManager.referenceSpace), this._trackingHands.right?.updateFromXRFrame(e, this._xrSessionManager.referenceSpace);
  }
  _detachHandById(e, t) {
    const i = this.getHandByControllerId(e);
    if (i) {
      const s = i.xrController.inputSource.handedness == "left" ? "left" : "right";
      this._trackingHands[s]?.xrController.uniqueId === e && (this._trackingHands[s] = null), this.onHandRemovedObservable.notifyObservers(i), i.dispose(t), delete this._attachedHands[e];
    }
  }
  /**
   * Detach this feature.
   * Will usually be called by the features manager.
   *
   * @returns true if successful.
   */
  detach() {
    return super.detach() ? (Object.keys(this._attachedHands).forEach((e) => this._detachHandById(e, this.options.handMeshes?.disposeOnSessionEnd)), this.options.handMeshes?.disposeOnSessionEnd && this._handResources.jointMeshes && (this._handResources.jointMeshes.left.forEach((e) => e.dispose()), this._handResources.jointMeshes.right.forEach((e) => e.dispose())), this._worldScaleObserver && this._xrSessionManager.onWorldScaleFactorChangedObservable.remove(this._worldScaleObserver), !0) : !1;
  }
  /**
   * Dispose this feature and all of the resources attached.
   */
  dispose() {
    super.dispose(), this.onHandAddedObservable.clear(), this.onHandRemovedObservable.clear(), this._handResources.handMeshes && !this.options.handMeshes?.customMeshes && (this._handResources.handMeshes.left.dispose(), this._handResources.handMeshes.right.dispose(), E._RightHandGLB = null, E._LeftHandGLB = null), this._handResources.jointMeshes && (this._handResources.jointMeshes.left.forEach((e) => e.dispose()), this._handResources.jointMeshes.right.forEach((e) => e.dispose()));
  }
}
E.Name = N.HAND_TRACKING;
E.Version = 1;
E.DEFAULT_HAND_MODEL_BASE_URL = "https://assets.babylonjs.com/meshes/HandMeshes/";
E.DEFAULT_HAND_MODEL_RIGHT_FILENAME = "r_hand_rhs.glb";
E.DEFAULT_HAND_MODEL_LEFT_FILENAME = "l_hand_rhs.glb";
E.DEFAULT_HAND_MODEL_SHADER_URL = "https://assets.babylonjs.com/meshes/HandMeshes/handsShader.json";
E._ICOSPHERE_PARAMS = { radius: 0.5, flat: !1, subdivisions: 2 };
E._RightHandGLB = null;
E._LeftHandGLB = null;
he.AddWebXRFeature(E.Name, (a, e) => () => new E(a, e), E.Version, !1);
class ze extends ft {
  /**
   * Is rotation enabled when moving forward?
   * Disabling this feature will prevent the user from deciding the direction when teleporting
   */
  get rotationEnabled() {
    return this._rotationEnabled;
  }
  /**
   * Sets whether rotation is enabled or not
   * @param enabled is rotation enabled when teleportation is shown
   */
  set rotationEnabled(e) {
    if (this._rotationEnabled = e, this._options.teleportationTargetMesh) {
      const t = this._options.teleportationTargetMesh.getChildMeshes(!1, (i) => i.name === "rotationCone");
      t[0] && t[0].setEnabled(e);
    }
  }
  /**
   * Exposes the currently set teleportation target mesh.
   */
  get teleportationTargetMesh() {
    return this._options.teleportationTargetMesh || null;
  }
  /**
   * constructs a new teleportation system
   * @param _xrSessionManager an instance of WebXRSessionManager
   * @param _options configuration object for this feature
   */
  constructor(e, t) {
    super(e), this._options = t, this._controllers = {}, this._snappedToPoint = !1, this._cachedColor4White = new $e(1, 1, 1, 1), this._tmpRay = new De(new C(), new C()), this._tmpVector = new C(), this._tmpQuaternion = new A(), this._worldScaleObserver = null, this.skipNextTeleportation = !1, this.backwardsMovementEnabled = !0, this.backwardsTeleportationDistance = 0.7, this.parabolicCheckRadius = 5, this.parabolicRayEnabled = !0, this.straightRayEnabled = !0, this.rotationAngle = Math.PI / 8, this.onTargetMeshPositionUpdatedObservable = new x(), this.teleportationEnabled = !0, this._rotationEnabled = !0, this.onBeforeCameraTeleportRotation = new x(), this.onAfterCameraTeleportRotation = new x(), this._attachController = (i) => {
      if (this._controllers[i.uniqueId] || this._options.forceHandedness && i.inputSource.handedness !== this._options.forceHandedness)
        return;
      this._controllers[i.uniqueId] = {
        xrController: i,
        teleportationState: {
          forward: !1,
          backwards: !1,
          rotating: !1,
          currentRotation: 0,
          baseRotation: 0,
          blocked: !1,
          initialHit: !1,
          mainComponentUsed: !1
        }
      };
      const s = this._controllers[i.uniqueId];
      if (s.xrController.inputSource.targetRayMode === "tracked-pointer" && s.xrController.inputSource.gamepad) {
        const r = () => {
          if (i.motionController) {
            const n = i.motionController.getComponentOfType(be.THUMBSTICK_TYPE) || i.motionController.getComponentOfType(be.TOUCHPAD_TYPE);
            if (!n || this._options.useMainComponentOnly) {
              const o = i.motionController.getMainComponent();
              if (!o)
                return;
              s.teleportationState.mainComponentUsed = !0, s.teleportationComponent = o, s.onButtonChangedObserver = o.onButtonStateChangedObservable.add(() => {
                if (!this.teleportationEnabled)
                  return;
                const l = () => {
                  s.teleportationState.forward = !0, s.teleportationState.initialHit = !1, this._currentTeleportationControllerId = s.xrController.uniqueId, s.teleportationState.baseRotation = this._options.xrInput.xrCamera.rotationQuaternion.toEulerAngles().y, s.teleportationState.currentRotation = 0;
                  const h = this._options.timeToTeleport || 3e3;
                  st({
                    timeout: h,
                    contextObservable: this._xrSessionManager.onXRFrameObservable,
                    breakCondition: () => !o.pressed,
                    onEnded: () => {
                      this._currentTeleportationControllerId === s.xrController.uniqueId && s.teleportationState.forward && this._teleportForward(i.uniqueId);
                    }
                  });
                };
                o.changes.pressed && (o.changes.pressed.current ? this._options.timeToTeleportStart ? st({
                  timeout: this._options.timeToTeleportStart,
                  contextObservable: this._xrSessionManager.onXRFrameObservable,
                  onEnded: () => {
                    o.pressed && l();
                  }
                }) : l() : (s.teleportationState.forward = !1, this._currentTeleportationControllerId = ""));
              });
            } else
              s.teleportationComponent = n, s.onAxisChangedObserver = n.onAxisValueChangedObservable.add((o) => {
                if (o.y <= 0.7 && s.teleportationState.backwards && (s.teleportationState.backwards = !1), o.y > 0.7 && !s.teleportationState.forward && this.backwardsMovementEnabled && !this.snapPointsOnly && !s.teleportationState.backwards) {
                  s.teleportationState.backwards = !0, this._tmpQuaternion.copyFrom(this._options.xrInput.xrCamera.rotationQuaternion), this._tmpQuaternion.toEulerAnglesToRef(this._tmpVector), this._tmpVector.x = 0, this._tmpVector.z = 0, A.FromEulerVectorToRef(this._tmpVector, this._tmpQuaternion), this._tmpVector.set(0, 0, this.backwardsTeleportationDistance * (this._xrSessionManager.scene.useRightHandedSystem ? 1 : -1)), this._tmpVector.rotateByQuaternionToRef(this._tmpQuaternion, this._tmpVector), this._tmpVector.addInPlace(this._options.xrInput.xrCamera.position), this._tmpRay.origin.copyFrom(this._tmpVector), this._tmpRay.length = this._options.xrInput.xrCamera.realWorldHeight + 0.1, this._tmpRay.direction.set(0, -1, 0);
                  const l = this._xrSessionManager.scene.pickWithRay(this._tmpRay, (h) => this._floorMeshes.indexOf(h) !== -1);
                  l && l.pickedPoint && (this._options.xrInput.xrCamera.position.x = l.pickedPoint.x, this._options.xrInput.xrCamera.position.z = l.pickedPoint.z);
                }
                if (o.y < -0.7 && !this._currentTeleportationControllerId && !s.teleportationState.rotating && this.teleportationEnabled && (s.teleportationState.forward = !0, this._currentTeleportationControllerId = s.xrController.uniqueId, s.teleportationState.baseRotation = this._options.xrInput.xrCamera.rotationQuaternion.toEulerAngles().y), o.x) {
                  if (s.teleportationState.forward)
                    this._currentTeleportationControllerId === s.xrController.uniqueId && (this.rotationEnabled ? setTimeout(() => {
                      s.teleportationState.currentRotation = Math.atan2(o.x, o.y * (this._xrSessionManager.scene.useRightHandedSystem ? 1 : -1));
                    }) : s.teleportationState.currentRotation = 0);
                  else if (!s.teleportationState.rotating && Math.abs(o.x) > 0.7) {
                    s.teleportationState.rotating = !0;
                    const l = this.rotationAngle * (o.x > 0 ? 1 : -1) * (this._xrSessionManager.scene.useRightHandedSystem ? -1 : 1);
                    this.onBeforeCameraTeleportRotation.notifyObservers(l), A.FromEulerAngles(0, l, 0).multiplyToRef(this._options.xrInput.xrCamera.rotationQuaternion, this._options.xrInput.xrCamera.rotationQuaternion), this.onAfterCameraTeleportRotation.notifyObservers(this._options.xrInput.xrCamera.rotationQuaternion);
                  }
                } else
                  s.teleportationState.rotating = !1;
                o.x === 0 && o.y === 0 && (s.teleportationState.blocked && (s.teleportationState.blocked = !1, this._setTargetMeshVisibility(!1)), s.teleportationState.forward && this._teleportForward(i.uniqueId));
              });
          }
        };
        i.motionController ? r() : i.onMotionControllerInitObservable.addOnce(() => {
          r();
        });
      } else {
        s.teleportationState.mainComponentUsed = !0;
        let r = !1;
        const n = () => {
          this._currentTeleportationControllerId = s.xrController.uniqueId, s.teleportationState.forward = !0, s.teleportationState.initialHit = !1, s.teleportationState.baseRotation = this._options.xrInput.xrCamera.rotationQuaternion.toEulerAngles().y, s.teleportationState.currentRotation = 0;
          const o = this._options.timeToTeleport || 3e3;
          st({
            timeout: o,
            contextObservable: this._xrSessionManager.onXRFrameObservable,
            onEnded: () => {
              this._currentTeleportationControllerId === s.xrController.uniqueId && s.teleportationState.forward && this._teleportForward(i.uniqueId);
            }
          });
        };
        this._xrSessionManager.scene.onPointerObservable.add((o) => {
          o.type === ie.POINTERDOWN ? (r = !1, this._options.timeToTeleportStart ? st({
            timeout: this._options.timeToTeleportStart,
            contextObservable: this._xrSessionManager.onXRFrameObservable,
            onEnded: () => {
              this._currentTeleportationControllerId === s.xrController.uniqueId && n();
            },
            breakCondition: () => r ? (r = !1, !0) : !1
          }) : n()) : o.type === ie.POINTERUP && (r = !0, s.teleportationState.forward = !1, this._currentTeleportationControllerId = "");
        });
      }
    }, this._colorArray = Array(24).fill(this._cachedColor4White), this._options.teleportationTargetMesh || this._createDefaultTargetMesh(), this._floorMeshes = this._options.floorMeshes || [], this._snapToPositions = this._options.snapPositions || [], this._blockedRayColor = this._options.blockedRayColor || new $e(1, 0, 0, 0.75), this._setTargetMeshVisibility(!1), this.onBeforeCameraTeleport = t.xrInput.xrCamera.onBeforeCameraTeleport, this.onAfterCameraTeleport = t.xrInput.xrCamera.onAfterCameraTeleport, this.parabolicCheckRadius *= this._xrSessionManager.worldScalingFactor, this._worldScaleObserver = e.onWorldScaleFactorChangedObservable.add((i) => {
      this.parabolicCheckRadius = this.parabolicCheckRadius / i.previousScaleFactor * i.newScaleFactor, this._options.teleportationTargetMesh?.scaling.scaleInPlace(i.newScaleFactor / i.previousScaleFactor);
    });
  }
  /**
   * Get the snapPointsOnly flag
   */
  get snapPointsOnly() {
    return !!this._options.snapPointsOnly;
  }
  /**
   * Sets the snapPointsOnly flag
   * @param snapToPoints should teleportation be exclusively to snap points
   */
  set snapPointsOnly(e) {
    this._options.snapPointsOnly = e;
  }
  /**
   * Add a new mesh to the floor meshes array
   * @param mesh the mesh to use as floor mesh
   */
  addFloorMesh(e) {
    this._floorMeshes.push(e);
  }
  /**
   * Add a mesh to the list of meshes blocking the teleportation ray
   * @param mesh The mesh to add to the teleportation-blocking meshes
   */
  addBlockerMesh(e) {
    this._options.pickBlockerMeshes = this._options.pickBlockerMeshes || [], this._options.pickBlockerMeshes.push(e);
  }
  /**
   * Add a new snap-to point to fix teleportation to this position
   * @param newSnapPoint The new Snap-To point
   */
  addSnapPoint(e) {
    this._snapToPositions.push(e);
  }
  attach() {
    return super.attach() ? (this._currentTeleportationControllerId = "", this._options.xrInput.controllers.forEach(this._attachController), this._addNewAttachObserver(this._options.xrInput.onControllerAddedObservable, this._attachController), this._addNewAttachObserver(this._options.xrInput.onControllerRemovedObservable, (e) => {
      this._detachController(e.uniqueId);
    }), !0) : !1;
  }
  detach() {
    return super.detach() ? (Object.keys(this._controllers).forEach((e) => {
      this._detachController(e);
    }), this._setTargetMeshVisibility(!1), this._currentTeleportationControllerId = "", this._controllers = {}, !0) : !1;
  }
  dispose() {
    super.dispose(), this._options.teleportationTargetMesh && this._options.teleportationTargetMesh.dispose(!1, !0), this._worldScaleObserver && this._xrSessionManager.onWorldScaleFactorChangedObservable.remove(this._worldScaleObserver);
  }
  /**
   * Remove a mesh from the floor meshes array
   * @param mesh the mesh to remove
   */
  removeFloorMesh(e) {
    const t = this._floorMeshes.indexOf(e);
    t !== -1 && this._floorMeshes.splice(t, 1);
  }
  /**
   * Remove a mesh from the blocker meshes array
   * @param mesh the mesh to remove
   */
  removeBlockerMesh(e) {
    this._options.pickBlockerMeshes = this._options.pickBlockerMeshes || [];
    const t = this._options.pickBlockerMeshes.indexOf(e);
    t !== -1 && this._options.pickBlockerMeshes.splice(t, 1);
  }
  /**
   * Remove a mesh from the floor meshes array using its name
   * @param name the mesh name to remove
   */
  removeFloorMeshByName(e) {
    const t = this._xrSessionManager.scene.getMeshByName(e);
    t && this.removeFloorMesh(t);
  }
  /**
   * This function will iterate through the array, searching for this point or equal to it. It will then remove it from the snap-to array
   * @param snapPointToRemove the point (or a clone of it) to be removed from the array
   * @returns was the point found and removed or not
   */
  removeSnapPoint(e) {
    let t = this._snapToPositions.indexOf(e);
    if (t === -1) {
      for (let i = 0; i < this._snapToPositions.length; ++i)
        if (this._snapToPositions[i].equals(e)) {
          t = i;
          break;
        }
    }
    return t !== -1 ? (this._snapToPositions.splice(t, 1), !0) : !1;
  }
  /**
   * This function sets a selection feature that will be disabled when
   * the forward ray is shown and will be reattached when hidden.
   * This is used to remove the selection rays when moving.
   * @param selectionFeature the feature to disable when forward movement is enabled
   */
  setSelectionFeature(e) {
    this._selectionFeature = e;
  }
  _onXRFrame(e) {
    const t = this._xrSessionManager.currentFrame, i = this._xrSessionManager.scene;
    if (!this.attach || !t)
      return;
    const s = this._options.teleportationTargetMesh;
    if (this._currentTeleportationControllerId) {
      if (!s)
        return;
      s.rotationQuaternion = s.rotationQuaternion || new A();
      const r = this._controllers[this._currentTeleportationControllerId];
      if (r && r.teleportationState.forward) {
        A.RotationYawPitchRollToRef(r.teleportationState.currentRotation + r.teleportationState.baseRotation, 0, 0, s.rotationQuaternion);
        let n = !1;
        const o = r.xrController.inputSource.targetRayMode !== "transient-pointer";
        if (r.xrController.getWorldPointerRayToRef(this._tmpRay), this.straightRayEnabled) {
          const l = i.pickWithRay(this._tmpRay, (c) => {
            if (this._options.blockerMeshesPredicate && this._options.blockerMeshesPredicate(c) || this._options.blockAllPickableMeshes && c.isPickable || this._options.pickBlockerMeshes && this._options.pickBlockerMeshes.indexOf(c) !== -1)
              return !0;
            const d = this._floorMeshes.indexOf(c);
            return d === -1 ? !1 : this._floorMeshes[d].absolutePosition.y < this._options.xrInput.xrCamera.globalPosition.y;
          }), h = l && l.pickedMesh && this._floorMeshes.indexOf(l.pickedMesh) !== -1;
          if (l && l.pickedMesh && !h) {
            if (r.teleportationState.mainComponentUsed && !r.teleportationState.initialHit) {
              r.teleportationState.forward = !1;
              return;
            }
            r.teleportationState.blocked = !0, this._setTargetMeshVisibility(!1, !1, o), this._showParabolicPath(l);
            return;
          } else l && l.pickedPoint && (r.teleportationState.initialHit = !0, r.teleportationState.blocked = !1, n = !0, this._setTargetMeshPosition(l), this._setTargetMeshVisibility(!0, !1, o), this._showParabolicPath(l));
        }
        if (this.parabolicRayEnabled && !n) {
          const l = r.xrController.pointer.rotationQuaternion.toEulerAngles().x, h = 1 + (Math.PI / 2 - Math.abs(l)), c = this.parabolicCheckRadius * h;
          this._tmpRay.origin.addToRef(this._tmpRay.direction.scale(c * 2), this._tmpVector), this._tmpVector.y = this._tmpRay.origin.y, this._tmpRay.origin.addInPlace(this._tmpRay.direction.scale(c)), this._tmpVector.subtractToRef(this._tmpRay.origin, this._tmpRay.direction), this._tmpRay.direction.normalize();
          const d = i.pickWithRay(this._tmpRay, (_) => this._options.blockerMeshesPredicate && this._options.blockerMeshesPredicate(_) || this._options.blockAllPickableMeshes && _.isPickable || this._options.pickBlockerMeshes && this._options.pickBlockerMeshes.indexOf(_) !== -1 ? !0 : this._floorMeshes.indexOf(_) !== -1), f = d && d.pickedMesh && this._floorMeshes.indexOf(d.pickedMesh) !== -1;
          if (d && d.pickedMesh && !f) {
            if (r.teleportationState.mainComponentUsed && !r.teleportationState.initialHit) {
              r.teleportationState.forward = !1;
              return;
            }
            r.teleportationState.blocked = !0, this._setTargetMeshVisibility(!1, !1, o), this._showParabolicPath(d);
            return;
          } else d && d.pickedPoint && (r.teleportationState.initialHit = !0, r.teleportationState.blocked = !1, n = !0, this._setTargetMeshPosition(d), this._setTargetMeshVisibility(!0, !1, o), this._showParabolicPath(d));
        }
        this._setTargetMeshVisibility(n, !1, o);
      } else
        this._setTargetMeshVisibility(!1, !1, !0);
    } else
      this._disposeBezierCurve(), this._setTargetMeshVisibility(!1, !1, !0);
  }
  _createDefaultTargetMesh() {
    this._options.defaultTargetMeshOptions = this._options.defaultTargetMeshOptions || {};
    const e = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || w.DefaultUtilityLayer.utilityLayerScene : this._xrSessionManager.scene, t = As("teleportationTarget", { width: 2, height: 2, subdivisions: 2 }, e);
    if (t.isPickable = !1, this._options.defaultTargetMeshOptions.teleportationCircleMaterial)
      t.material = this._options.defaultTargetMeshOptions.teleportationCircleMaterial;
    else {
      const n = new Ms("teleportationPlaneDynamicTexture", 512, e, !0);
      n.hasAlpha = !0;
      const o = n.getContext(), l = 512 / 2, h = 512 / 2, c = 200;
      o.beginPath(), o.arc(l, h, c, 0, 2 * Math.PI, !1), o.fillStyle = this._options.defaultTargetMeshOptions.teleportationFillColor || "#444444", o.fill(), o.lineWidth = 10, o.strokeStyle = this._options.defaultTargetMeshOptions.teleportationBorderColor || "#FFFFFF", o.stroke(), o.closePath(), n.update();
      const d = new Le("teleportationPlaneMaterial", e);
      d.diffuseTexture = n, t.material = d;
    }
    const i = xt("torusTeleportation", {
      diameter: 0.75,
      thickness: 0.1,
      tessellation: 20
    }, e);
    if (i.isPickable = !1, i.parent = t, !this._options.defaultTargetMeshOptions.disableAnimation) {
      const r = new ee("animationInnerCircle", "position.y", 30, ee.ANIMATIONTYPE_FLOAT, ee.ANIMATIONLOOPMODE_CYCLE), n = [];
      n.push({
        frame: 0,
        value: 0
      }), n.push({
        frame: 30,
        value: 0.4
      }), n.push({
        frame: 60,
        value: 0
      }), r.setKeys(n);
      const o = new qi();
      o.setEasingMode(Ci.EASINGMODE_EASEINOUT), r.setEasingFunction(o), i.animations = [], i.animations.push(r), e.beginAnimation(i, 0, 60, !0);
    }
    const s = vi("rotationCone", { diameterTop: 0, tessellation: 4 }, e);
    if (s.isPickable = !1, s.scaling.set(0.5, 0.12, 0.2), s.rotate(ct.X, Math.PI / 2), s.position.z = 0.6, s.parent = i, this._options.defaultTargetMeshOptions.torusArrowMaterial)
      i.material = this._options.defaultTargetMeshOptions.torusArrowMaterial, s.material = this._options.defaultTargetMeshOptions.torusArrowMaterial;
    else {
      const r = new Le("torusConsMat", e);
      r.disableLighting = !!this._options.defaultTargetMeshOptions.disableLighting, r.disableLighting ? r.emissiveColor = new U(0.3, 0.3, 1) : r.diffuseColor = new U(0.3, 0.3, 1), r.alpha = 0.9, i.material = r, s.material = r, this._teleportationRingMaterial = r;
    }
    this._options.renderingGroupId !== void 0 && (t.renderingGroupId = this._options.renderingGroupId, i.renderingGroupId = this._options.renderingGroupId, s.renderingGroupId = this._options.renderingGroupId), this._options.teleportationTargetMesh = t, this._options.teleportationTargetMesh.scaling.setAll(this._xrSessionManager.worldScalingFactor), this._setTargetMeshVisibility(!1);
  }
  _detachController(e) {
    const t = this._controllers[e];
    t && (t.teleportationComponent && (t.onAxisChangedObserver && t.teleportationComponent.onAxisValueChangedObservable.remove(t.onAxisChangedObserver), t.onButtonChangedObserver && t.teleportationComponent.onButtonStateChangedObservable.remove(t.onButtonChangedObserver)), delete this._controllers[e]);
  }
  _findClosestSnapPointWithRadius(e, t = this._options.snapToPositionRadius || 0.8) {
    let i = null, s = Number.MAX_VALUE;
    if (this._snapToPositions.length) {
      const r = t * t;
      this._snapToPositions.forEach((n) => {
        const o = C.DistanceSquared(n, e);
        o <= r && o < s && (s = o, i = n);
      });
    }
    return i;
  }
  _setTargetMeshPosition(e) {
    const t = e.pickedPoint;
    if (!this._options.teleportationTargetMesh || !t)
      return;
    const i = this._findClosestSnapPointWithRadius(t);
    this._snappedToPoint = !!i, this.snapPointsOnly && !this._snappedToPoint && this._teleportationRingMaterial ? this._teleportationRingMaterial.diffuseColor.set(1, 0.3, 0.3) : this.snapPointsOnly && this._snappedToPoint && this._teleportationRingMaterial && this._teleportationRingMaterial.diffuseColor.set(0.3, 0.3, 1), this._options.teleportationTargetMesh.position.copyFrom(i || t), this._options.teleportationTargetMesh.position.y += 0.01, this.onTargetMeshPositionUpdatedObservable.notifyObservers(e);
  }
  _setTargetMeshVisibility(e, t, i) {
    this._options.teleportationTargetMesh && (this._options.teleportationTargetMesh.isVisible === e && !t || (this._options.teleportationTargetMesh.isVisible = e, this._options.teleportationTargetMesh.getChildren(void 0, !1).forEach((s) => {
      s.isVisible = e;
    }), e ? this._selectionFeature && i && this._selectionFeature.detach() : (this._quadraticBezierCurve && (this._quadraticBezierCurve.dispose(), this._quadraticBezierCurve = null), this._selectionFeature && i && this._selectionFeature.attach())));
  }
  _disposeBezierCurve() {
    this._quadraticBezierCurve && (this._quadraticBezierCurve.dispose(), this._quadraticBezierCurve = null);
  }
  _showParabolicPath(e) {
    if (!e.pickedPoint || !this._currentTeleportationControllerId)
      return;
    const t = this._options.useUtilityLayer ? this._options.customUtilityLayerScene || w.DefaultUtilityLayer.utilityLayerScene : this._xrSessionManager.scene, i = this._controllers[this._currentTeleportationControllerId], s = Ps.CreateQuadraticBezier(i.xrController.pointer.absolutePosition, e.ray.origin, e.pickedPoint, 25), r = i.teleportationState.blocked ? this._blockedRayColor : void 0, n = this._colorArray.fill(r || this._cachedColor4White), o = s.getPoints();
    o.shift(), o.shift(), this._options.generateRayPathMesh ? this._quadraticBezierCurve = this._options.generateRayPathMesh(s.getPoints(), e) : this._quadraticBezierCurve = Ts("teleportation path line", { points: o, instance: this._quadraticBezierCurve, updatable: !0, colors: n }, t), this._quadraticBezierCurve.isPickable = !1, this._options.renderingGroupId !== void 0 && (this._quadraticBezierCurve.renderingGroupId = this._options.renderingGroupId);
  }
  _teleportForward(e) {
    const t = this._controllers[e];
    if (!(!t || !t.teleportationState.forward || !this.teleportationEnabled) && (t.teleportationState.forward = !1, this._currentTeleportationControllerId = "", !(this.snapPointsOnly && !this._snappedToPoint))) {
      if (this.skipNextTeleportation) {
        this.skipNextTeleportation = !1;
        return;
      }
      if (this._options.teleportationTargetMesh && this._options.teleportationTargetMesh.isVisible) {
        const i = this._options.xrInput.xrCamera.realWorldHeight;
        this.onBeforeCameraTeleport.notifyObservers(this._options.xrInput.xrCamera.position), this._options.xrInput.xrCamera.position.copyFrom(this._options.teleportationTargetMesh.position), this._options.xrInput.xrCamera.position.y += i, A.FromEulerAngles(0, t.teleportationState.currentRotation - (this._xrSessionManager.scene.useRightHandedSystem ? Math.PI : 0), 0).multiplyToRef(this._options.xrInput.xrCamera.rotationQuaternion, this._options.xrInput.xrCamera.rotationQuaternion), this.onAfterCameraTeleport.notifyObservers(this._options.xrInput.xrCamera.position);
      }
    }
  }
}
ze.Name = N.TELEPORTATION;
ze.Version = 1;
he.AddWebXRFeature(ze.Name, (a, e) => () => new ze(a, e), ze.Version, !0);
class En {
}
class Ut {
  constructor() {
  }
  /**
   * Creates the default xr experience
   * @param scene scene
   * @param options options for basic configuration
   * @returns resulting WebXRDefaultExperience
   */
  static CreateAsync(e, t = {}) {
    const i = new Ut();
    if (e.onDisposeObservable.addOnce(() => {
      i.dispose();
    }), !t.disableDefaultUI) {
      const s = {
        renderTarget: i.renderTarget,
        ...t.uiOptions || {}
      };
      t.optionalFeatures && (typeof t.optionalFeatures == "boolean" ? s.optionalFeatures = ["hit-test", "anchors", "plane-detection", "hand-tracking"] : s.optionalFeatures = t.optionalFeatures), i.enterExitUI = new Vt(e, s);
    }
    return kt.CreateAsync(e).then((s) => {
      if (i.baseExperience = s, t.ignoreNativeCameraTransformation && (i.baseExperience.camera.compensateOnFirstFrame = !1), i.input = new hr(s.sessionManager, s.camera, {
        controllerOptions: {
          renderingGroupId: t.renderingGroupId
        },
        ...t.inputOptions || {}
      }), !t.disablePointerSelection) {
        const r = {
          ...t.pointerSelectionOptions,
          xrInput: i.input,
          renderingGroupId: t.renderingGroupId
        };
        i.pointerSelection = i.baseExperience.featuresManager.enableFeature(ge.Name, t.useStablePlugins ? "stable" : "latest", r), t.disableTeleportation || (i.teleportation = i.baseExperience.featuresManager.enableFeature(ze.Name, t.useStablePlugins ? "stable" : "latest", {
          floorMeshes: t.floorMeshes,
          xrInput: i.input,
          renderingGroupId: t.renderingGroupId,
          ...t.teleportationOptions
        }), i.teleportation.setSelectionFeature(i.pointerSelection));
      }
      if (t.disableNearInteraction || (i.nearInteraction = i.baseExperience.featuresManager.enableFeature(Ce.Name, t.useStablePlugins ? "stable" : "latest", {
        xrInput: i.input,
        farInteractionFeature: i.pointerSelection,
        renderingGroupId: t.renderingGroupId,
        useUtilityLayer: !0,
        enableNearInteractionOnAllControllers: !0,
        ...t.nearInteractionOptions
      })), t.disableHandTracking || i.baseExperience.featuresManager.enableFeature(E.Name, t.useStablePlugins ? "stable" : "latest", {
        xrInput: i.input,
        ...t.handSupportOptions
      }, void 0, !1), i.renderTarget = i.baseExperience.sessionManager.getWebXRRenderTarget(t.outputCanvasOptions), !t.disableDefaultUI)
        return i.enterExitUI.setHelperAsync(i.baseExperience, i.renderTarget);
    }).then(() => i).catch((s) => (R.Error("Error initializing XR"), R.Error(s), i));
  }
  /**
   * Disposes of the experience helper
   */
  dispose() {
    this.baseExperience && this.baseExperience.dispose(), this.input && this.input.dispose(), this.enterExitUI && this.enterExitUI.dispose(), this.renderTarget && this.renderTarget.dispose();
  }
}
var br = !0;
Oe.prototype.createDefaultLight = function(a = !1) {
  if (a && this.lights)
    for (let e = 0; e < this.lights.length; e++)
      this.lights[e].dispose();
  this.lights.length === 0 && new mi("default light", C.Up(), this);
};
Oe.prototype.createDefaultCamera = function(a = !1, e = !1, t = !1) {
  if (e && this.activeCamera && (this.activeCamera.dispose(), this.activeCamera = null), !this.activeCamera) {
    const i = this.getWorldExtends((l) => l.isVisible && l.isEnabled()), s = i.max.subtract(i.min), r = i.min.add(s.scale(0.5));
    let n, o = s.length() * 1.5;
    if (isFinite(o) || (o = 1, r.copyFromFloats(0, 0, 0)), a) {
      const l = new gi("default camera", -(Math.PI / 2), Math.PI / 2, o, r, this);
      l.lowerRadiusLimit = o * 0.01, l.wheelPrecision = 100 / o, n = l;
    } else {
      const l = new Pi("default camera", new C(r.x, r.y, -o), this);
      l.setTarget(r), n = l;
    }
    n.minZ = o * 0.01, n.maxZ = o * 1e3, n.speed = o * 0.2, this.activeCamera = n, t && n.attachControl();
  }
};
Oe.prototype.createDefaultCameraOrLight = function(a = !1, e = !1, t = !1) {
  this.createDefaultLight(e), this.createDefaultCamera(a, e, t);
};
Oe.prototype.createDefaultSkybox = function(a, e = !1, t = 1e3, i = 0, s = !0) {
  if (!a)
    return R.Warn("Can not create default skybox without environment texture."), null;
  s && a && (this.environmentTexture = a);
  const r = Ti("hdrSkyBox", { size: t }, this);
  if (e) {
    const n = new Qi("skyBox", this);
    n.backFaceCulling = !1, n.reflectionTexture = a.clone(), n.reflectionTexture && (n.reflectionTexture.coordinatesMode = L.SKYBOX_MODE), n.microSurface = 1 - i, n.disableLighting = !0, n.twoSidedLighting = !0, r.material = n;
  } else {
    const n = new Le("skyBox", this);
    n.backFaceCulling = !1, n.reflectionTexture = a.clone(), n.reflectionTexture && (n.reflectionTexture.coordinatesMode = L.SKYBOX_MODE), n.disableLighting = !0, r.material = n;
  }
  return r.isPickable = !1, r.infiniteDistance = !0, r.ignoreCameraMaxZ = !0, r;
};
Oe.prototype.createDefaultEnvironment = function(a) {
  return we ? new we(a, this) : null;
};
Oe.prototype.createDefaultVRExperience = function(a = {}) {
  return new Cs(this, a);
};
Oe.prototype.createDefaultXRExperienceAsync = function(a = {}) {
  return Ut.CreateAsync(this, a).then((e) => e);
};
const Tn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  _forceSceneHelpersToBundle: br
}, Symbol.toStringTag, { value: "Module" }));
export {
  G as $,
  Ie as A,
  y as B,
  Fi as C,
  T as D,
  Nt as E,
  Ae as F,
  Li as G,
  Pe as H,
  Z as I,
  Dt as J,
  Y as K,
  z as L,
  ut as M,
  Ze as N,
  rt as O,
  I as P,
  Ni as Q,
  Oi as R,
  xi as S,
  fr as T,
  w as U,
  pt as V,
  m as W,
  ci as X,
  Qe as Y,
  Ft as Z,
  Di as _,
  N as a,
  at as a0,
  ot as a1,
  Ye as a2,
  ge as a3,
  Ut as a4,
  En as a5,
  Vt as a6,
  mr as a7,
  bn as a8,
  kt as a9,
  qe as aa,
  Cr as ab,
  E as ac,
  hr as ad,
  lr as ae,
  ze as af,
  Fe as ag,
  Ce as ah,
  or as ai,
  Js as aj,
  rr as ak,
  br as al,
  Tn as am,
  X as b,
  Se as c,
  de as d,
  oe as e,
  p as f,
  u as g,
  M as h,
  Je as i,
  xe as j,
  Ke as k,
  V as l,
  se as m,
  dr as n,
  he as o,
  ft as p,
  be as q,
  Q as r,
  Mi as s,
  Ai as t,
  ir as u,
  yn as v,
  we as w,
  Rn as x,
  Sn as y,
  P as z
};
//# sourceMappingURL=sceneHelpers-CqkHG3td.js.map
