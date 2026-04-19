import { GradientHelper as A, FactorGradient as re, Color3Gradient as se, ColorGradient as ne } from "./gradients-B7WOeKlD.js";
import { a as l, C as v, g as ae, an as q, i as g, v as ee, x as te, ao as E, D as I, a5 as X, O as Z, M as K, d as oe, ap as S, p as de, h as ie, H as Q, V as B, G as L, _ as he, w as u, Y as j } from "./embed-entry-BKE21f6Q.js";
import { R as ce } from "./rawTexture-CLGzAhmW.js";
import { B as y } from "./baseParticleSystem-Bx0fg-75.js";
import "./clipPlaneVertex-kcGv58C0.js";
import "./imageProcessingFunctions-DicDoEcN.js";
import "./logDepthVertex-BrxSpoS8.js";
import "./helperFunctions-D_BKtoXY.js";
import "./fogVertex-CURXdlyC.js";
import "./engine.dynamicBuffer-CzeutWvF.js";
import { b as le, p as fe, d as ue, f as me, e as _e } from "./materialHelper.functions-H397-pN5.js";
import { P as pe, a as ge } from "./imageProcessingConfiguration.functions-BktKXnya.js";
import { S as xe } from "./decorators.serialization-DfmppPDN.js";
class V {
  /**
   * Creates a new instance Particle
   * @param particleSystem the particle system the particle belongs to
   */
  constructor(e) {
    this.particleSystem = e, this.position = l.Zero(), this.direction = l.Zero(), this.color = new v(0, 0, 0, 0), this.colorStep = new v(0, 0, 0, 0), this.lifeTime = 1, this.age = 0, this.size = 0, this.scale = new ae(1, 1), this.angle = 0, this.angularSpeed = 0, this.cellIndex = 0, this._attachedSubEmitters = null, this._currentColor1 = new v(0, 0, 0, 0), this._currentColor2 = new v(0, 0, 0, 0), this._currentSize1 = 0, this._currentSize2 = 0, this._currentAngularSpeed1 = 0, this._currentAngularSpeed2 = 0, this._currentVelocity1 = 0, this._currentVelocity2 = 0, this._currentLimitVelocity1 = 0, this._currentLimitVelocity2 = 0, this._currentDrag1 = 0, this._currentDrag2 = 0, this.id = V._Count++, this.particleSystem.isAnimationSheetEnabled && this._updateCellInfoFromSystem();
  }
  _updateCellInfoFromSystem() {
    this.cellIndex = this.particleSystem.startSpriteCellID;
  }
  /**
   * Defines how the sprite cell index is updated for the particle
   */
  updateCellIndex() {
    let e = this.age, t = this.particleSystem.spriteCellChangeSpeed;
    this.particleSystem.spriteRandomStartCell && (this._randomCellOffset === void 0 && (this._randomCellOffset = Math.random() * this.lifeTime), t === 0 ? (t = 1, e = this._randomCellOffset) : e += this._randomCellOffset);
    const i = this._initialEndSpriteCellID - this._initialStartSpriteCellID;
    let s;
    this._initialSpriteCellLoop ? s = q(e * t % this.lifeTime / this.lifeTime) : s = q(e * t / this.lifeTime), this.cellIndex = this._initialStartSpriteCellID + s * i | 0;
  }
  /**
   * @internal
   */
  _inheritParticleInfoToSubEmitter(e) {
    if (e.particleSystem.emitter.position) {
      const t = e.particleSystem.emitter;
      if (t.position.copyFrom(this.position), e.inheritDirection) {
        const i = g.Vector3[0];
        this.direction.normalizeToRef(i), t.setDirection(i, 0, Math.PI / 2);
      }
    } else
      e.particleSystem.emitter.copyFrom(this.position);
    this.direction.scaleToRef(e.inheritedVelocityAmount / 2, g.Vector3[0]), e.particleSystem._inheritedVelocityOffset.copyFrom(g.Vector3[0]);
  }
  /** @internal */
  _inheritParticleInfoToSubEmitters() {
    this._attachedSubEmitters && this._attachedSubEmitters.length > 0 && this._attachedSubEmitters.forEach((e) => {
      this._inheritParticleInfoToSubEmitter(e);
    });
  }
  /** @internal */
  _reset() {
    this.age = 0, this.id = V._Count++, this._currentColorGradient = null, this._currentSizeGradient = null, this._currentAngularSpeedGradient = null, this._currentVelocityGradient = null, this._currentLimitVelocityGradient = null, this._currentDragGradient = null, this.cellIndex = this.particleSystem.startSpriteCellID, this._randomCellOffset = void 0;
  }
  /**
   * Copy the properties of particle to another one.
   * @param other the particle to copy the information to.
   */
  copyTo(e) {
    e.position.copyFrom(this.position), this._initialDirection ? e._initialDirection ? e._initialDirection.copyFrom(this._initialDirection) : e._initialDirection = this._initialDirection.clone() : e._initialDirection = null, e.direction.copyFrom(this.direction), this._localPosition && (e._localPosition ? e._localPosition.copyFrom(this._localPosition) : e._localPosition = this._localPosition.clone()), e.color.copyFrom(this.color), e.colorStep.copyFrom(this.colorStep), e.lifeTime = this.lifeTime, e.age = this.age, e._randomCellOffset = this._randomCellOffset, e.size = this.size, e.scale.copyFrom(this.scale), e.angle = this.angle, e.angularSpeed = this.angularSpeed, e.particleSystem = this.particleSystem, e.cellIndex = this.cellIndex, e.id = this.id, e._attachedSubEmitters = this._attachedSubEmitters, this._currentColorGradient && (e._currentColorGradient = this._currentColorGradient, e._currentColor1.copyFrom(this._currentColor1), e._currentColor2.copyFrom(this._currentColor2)), this._currentSizeGradient && (e._currentSizeGradient = this._currentSizeGradient, e._currentSize1 = this._currentSize1, e._currentSize2 = this._currentSize2), this._currentAngularSpeedGradient && (e._currentAngularSpeedGradient = this._currentAngularSpeedGradient, e._currentAngularSpeed1 = this._currentAngularSpeed1, e._currentAngularSpeed2 = this._currentAngularSpeed2), this._currentVelocityGradient && (e._currentVelocityGradient = this._currentVelocityGradient, e._currentVelocity1 = this._currentVelocity1, e._currentVelocity2 = this._currentVelocity2), this._currentLimitVelocityGradient && (e._currentLimitVelocityGradient = this._currentLimitVelocityGradient, e._currentLimitVelocity1 = this._currentLimitVelocity1, e._currentLimitVelocity2 = this._currentLimitVelocity2), this._currentDragGradient && (e._currentDragGradient = this._currentDragGradient, e._currentDrag1 = this._currentDrag1, e._currentDrag2 = this._currentDrag2), this.particleSystem.isAnimationSheetEnabled && (e._initialStartSpriteCellID = this._initialStartSpriteCellID, e._initialEndSpriteCellID = this._initialEndSpriteCellID, e._initialSpriteCellLoop = this._initialSpriteCellLoop), this.particleSystem.useRampGradients && (e.remapData && this.remapData ? e.remapData.copyFrom(this.remapData) : e.remapData = new ee(0, 0, 0, 0)), this._randomNoiseCoordinates1 && (e._randomNoiseCoordinates1 ? (e._randomNoiseCoordinates1.copyFrom(this._randomNoiseCoordinates1), e._randomNoiseCoordinates2.copyFrom(this._randomNoiseCoordinates2)) : (e._randomNoiseCoordinates1 = this._randomNoiseCoordinates1.clone(), e._randomNoiseCoordinates2 = this._randomNoiseCoordinates2.clone()));
  }
}
V._Count = 0;
const Ge = "particlesPixelShader", Re = `#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
varying vec2 vUV;varying vec4 vColor;uniform vec4 textureMask;uniform sampler2D diffuseSampler;
#include<clipPlaneFragmentDeclaration>
#include<imageProcessingDeclaration>
#include<logDepthDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#ifdef RAMPGRADIENT
varying vec4 remapRanges;uniform sampler2D rampSampler;
#endif
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec4 textureColor=texture2D(diffuseSampler,vUV);vec4 baseColor=(textureColor*textureMask+(vec4(1.,1.,1.,1.)-textureMask))*vColor;
#ifdef RAMPGRADIENT
float alpha=baseColor.a;float remappedColorIndex=clamp((alpha-remapRanges.x)/remapRanges.y,0.0,1.0);vec4 rampColor=texture2D(rampSampler,vec2(1.0-remappedColorIndex,0.));baseColor.rgb*=rampColor.rgb;float finalAlpha=baseColor.a;baseColor.a=clamp((alpha*rampColor.a-remapRanges.z)/remapRanges.w,0.0,1.0);
#endif
#ifdef BLENDMULTIPLYMODE
float sourceAlpha=vColor.a*textureColor.a;baseColor.rgb=baseColor.rgb*sourceAlpha+vec3(1.0)*(1.0-sourceAlpha);
#endif
#include<logDepthFragment>
#include<fogFragment>(color,baseColor)
#ifdef IMAGEPROCESSINGPOSTPROCESS
baseColor.rgb=toLinearSpace(baseColor.rgb);
#else
#ifdef IMAGEPROCESSING
baseColor.rgb=toLinearSpace(baseColor.rgb);baseColor=applyImageProcessing(baseColor);
#endif
#endif
gl_FragColor=baseColor;
#define CUSTOM_FRAGMENT_MAIN_END
}`;
te.ShadersStore[Ge] = Re;
const Ce = "particlesVertexShader", De = `attribute vec3 position;attribute vec4 color;attribute float angle;attribute vec2 size;
#ifdef ANIMATESHEET
attribute float cellIndex;
#endif
#ifndef BILLBOARD
attribute vec3 direction;
#endif
#ifdef BILLBOARDSTRETCHED
attribute vec3 direction;
#endif
#ifdef RAMPGRADIENT
attribute vec4 remapData;
#endif
attribute vec2 offset;uniform mat4 view;uniform mat4 projection;uniform vec2 translationPivot;
#ifdef ANIMATESHEET
uniform vec3 particlesInfos; 
#endif
varying vec2 vUV;varying vec4 vColor;varying vec3 vPositionW;
#ifdef RAMPGRADIENT
varying vec4 remapRanges;
#endif
#if defined(BILLBOARD) && !defined(BILLBOARDY) && !defined(BILLBOARDSTRETCHED)
uniform mat4 invView;
#endif
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
#ifdef BILLBOARD
uniform vec3 eyePosition;
#endif
vec3 rotate(vec3 yaxis,vec3 rotatedCorner) {vec3 xaxis=normalize(cross(vec3(0.,1.0,0.),yaxis));vec3 zaxis=normalize(cross(yaxis,xaxis));vec3 row0=vec3(xaxis.x,xaxis.y,xaxis.z);vec3 row1=vec3(yaxis.x,yaxis.y,yaxis.z);vec3 row2=vec3(zaxis.x,zaxis.y,zaxis.z);mat3 rotMatrix= mat3(row0,row1,row2);vec3 alignedCorner=rotMatrix*rotatedCorner;return position+alignedCorner;}
#ifdef BILLBOARDSTRETCHED
vec3 rotateAlign(vec3 toCamera,vec3 rotatedCorner) {vec3 normalizedToCamera=normalize(toCamera);vec3 normalizedCrossDirToCamera=normalize(cross(normalize(direction),normalizedToCamera));vec3 row0=vec3(normalizedCrossDirToCamera.x,normalizedCrossDirToCamera.y,normalizedCrossDirToCamera.z);vec3 row2=vec3(normalizedToCamera.x,normalizedToCamera.y,normalizedToCamera.z);
#ifdef BILLBOARDSTRETCHED_LOCAL
vec3 row1=direction;
#else
vec3 crossProduct=normalize(cross(normalizedToCamera,normalizedCrossDirToCamera));vec3 row1=vec3(crossProduct.x,crossProduct.y,crossProduct.z);
#endif
mat3 rotMatrix= mat3(row0,row1,row2);vec3 alignedCorner=rotMatrix*rotatedCorner;return position+alignedCorner;}
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec2 cornerPos;cornerPos=(vec2(offset.x-0.5,offset.y -0.5)-translationPivot)*size;
#ifdef BILLBOARD
vec3 rotatedCorner;
#ifdef BILLBOARDY
rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.z=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.y=0.;rotatedCorner.xz+=translationPivot;vec3 yaxis=position-eyePosition;yaxis.y=0.;vPositionW=rotate(normalize(yaxis),rotatedCorner);vec3 viewPos=(view*vec4(vPositionW,1.0)).xyz;
#elif defined(BILLBOARDSTRETCHED)
rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.y=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.z=0.;rotatedCorner.xy+=translationPivot;vec3 toCamera=position-eyePosition;vPositionW=rotateAlign(toCamera,rotatedCorner);vec3 viewPos=(view*vec4(vPositionW,1.0)).xyz;
#else
rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.y=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.z=0.;rotatedCorner.xy+=translationPivot;vec3 viewPos=(view*vec4(position,1.0)).xyz+rotatedCorner;vPositionW=(invView*vec4(viewPos,1)).xyz;
#endif
#ifdef RAMPGRADIENT
remapRanges=remapData;
#endif
gl_Position=projection*vec4(viewPos,1.0);
#else
vec3 rotatedCorner;rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.z=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.y=0.;rotatedCorner.xz+=translationPivot;vec3 yaxis=normalize(direction);vPositionW=rotate(yaxis,rotatedCorner);gl_Position=projection*view*vec4(vPositionW,1.0);
#endif
vColor=color;
#ifdef ANIMATESHEET
float rowOffset=floor(cellIndex*particlesInfos.z);float columnOffset=cellIndex-rowOffset/particlesInfos.z;vec2 uvScale=particlesInfos.xy;vec2 uvOffset=vec2(offset.x ,1.0-offset.y);vUV=(uvOffset+vec2(columnOffset,rowOffset))*uvScale;
#else
vUV=offset;
#endif
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6) || defined(FOG)
vec4 worldPos=vec4(vPositionW,1.0);
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}`;
te.ShadersStore[Ce] = De;
class M {
  /**
   * Creates a new instance BoxParticleEmitter
   */
  constructor() {
    this.direction1 = new l(0, 1, 0), this.direction2 = new l(0, 1, 0), this.minEmitBox = new l(-0.5, -0.5, -0.5), this.maxEmitBox = new l(0.5, 0.5, 0.5);
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   * @param particle is the particle we are computed the direction for
   * @param isLocal defines if the direction should be set in local space
   */
  startDirectionFunction(e, t, i, s) {
    const r = E(this.direction1.x, this.direction2.x), a = E(this.direction1.y, this.direction2.y), d = E(this.direction1.z, this.direction2.z);
    if (s) {
      t.x = r, t.y = a, t.z = d;
      return;
    }
    l.TransformNormalFromFloatsToRef(r, a, d, e, t);
  }
  /**
   * Called by the particle System when the position is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param positionToUpdate is the position vector to update with the result
   * @param particle is the particle we are computed the position for
   * @param isLocal defines if the position should be set in local space
   */
  startPositionFunction(e, t, i, s) {
    const r = E(this.minEmitBox.x, this.maxEmitBox.x), a = E(this.minEmitBox.y, this.maxEmitBox.y), d = E(this.minEmitBox.z, this.maxEmitBox.z);
    if (s) {
      t.x = r, t.y = a, t.z = d;
      return;
    }
    l.TransformCoordinatesFromFloatsToRef(r, a, d, e, t);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new M();
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  applyToShader(e) {
    e.setVector3("direction1", this.direction1), e.setVector3("direction2", this.direction2), e.setVector3("minEmitBox", this.minEmitBox), e.setVector3("maxEmitBox", this.maxEmitBox);
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  buildUniformLayout(e) {
    e.addUniform("direction1", 3), e.addUniform("direction2", 3), e.addUniform("minEmitBox", 3), e.addUniform("maxEmitBox", 3);
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    return "#define BOXEMITTER";
  }
  /**
   * Returns the string "BoxParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "BoxParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = {};
    return e.type = this.getClassName(), e.direction1 = this.direction1.asArray(), e.direction2 = this.direction2.asArray(), e.minEmitBox = this.minEmitBox.asArray(), e.maxEmitBox = this.maxEmitBox.asArray(), e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   */
  parse(e) {
    l.FromArrayToRef(e.direction1, 0, this.direction1), l.FromArrayToRef(e.direction2, 0, this.direction2), l.FromArrayToRef(e.minEmitBox, 0, this.minEmitBox), l.FromArrayToRef(e.maxEmitBox, 0, this.maxEmitBox);
  }
}
class W extends y {
  /**
   * Sets a callback that will be triggered when the system is disposed
   */
  set onDispose(e) {
    this._onDisposeObserver && this.onDisposeObservable.remove(this._onDisposeObserver), this._onDisposeObserver = this.onDisposeObservable.add(e);
  }
  /** Gets or sets a boolean indicating that ramp gradients must be used
   * @see https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro#ramp-gradients
   */
  get useRampGradients() {
    return this._useRampGradients;
  }
  set useRampGradients(e) {
    this._useRampGradients !== e && (this._useRampGradients = e, this._resetEffect());
  }
  /**
   * Gets the current list of active particles
   */
  get particles() {
    return this._particles;
  }
  /**
   * Gets the number of particles active at the same time.
   * @returns The number of active particles.
   */
  getActiveCount() {
    return this._particles.length;
  }
  /**
   * Returns the string "ParticleSystem"
   * @returns a string containing the class name
   */
  getClassName() {
    return "ParticleSystem";
  }
  /**
   * Gets a boolean indicating that the system is stopping
   * @returns true if the system is currently stopping
   */
  isStopping() {
    return this._stopped && this.isAlive();
  }
  /**
   * Gets the custom effect used to render the particles
   * @param blendMode Blend mode for which the effect should be retrieved
   * @returns The effect
   */
  getCustomEffect(e = 0) {
    return this._customWrappers[e]?.effect ?? this._customWrappers[0].effect;
  }
  _getCustomDrawWrapper(e = 0) {
    return this._customWrappers[e] ?? this._customWrappers[0];
  }
  /**
   * Sets the custom effect used to render the particles
   * @param effect The effect to set
   * @param blendMode Blend mode for which the effect should be set
   */
  setCustomEffect(e, t = 0) {
    this._customWrappers[t] = new X(this._engine), this._customWrappers[t].effect = e, this._customWrappers[t].drawContext && (this._customWrappers[t].drawContext.useInstancing = this._useInstancing);
  }
  /**
   * Observable that will be called just before the particles are drawn
   */
  get onBeforeDrawParticlesObservable() {
    return this._onBeforeDrawParticlesObservable || (this._onBeforeDrawParticlesObservable = new Z()), this._onBeforeDrawParticlesObservable;
  }
  /**
   * Gets the name of the particle vertex shader
   */
  get vertexShaderName() {
    return "particles";
  }
  /**
   * Gets the vertex buffers used by the particle system
   */
  get vertexBuffers() {
    return this._vertexBuffers;
  }
  /**
   * Gets the index buffer used by the particle system (or null if no index buffer is used (if _useInstancing=true))
   */
  get indexBuffer() {
    return this._indexBuffer;
  }
  /**
   * Instantiates a particle system.
   * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
   * @param name The name of the particle system
   * @param capacity The max number of particles alive at the same time
   * @param sceneOrEngine The scene the particle system belongs to or the engine to use if no scene
   * @param customEffect a custom effect used to change the way particles are rendered by default
   * @param isAnimationSheetEnabled Must be true if using a spritesheet to animate the particles texture
   * @param epsilon Offset used to render the particles
   */
  constructor(e, t, i, s = null, r = !1, a = 0.01) {
    super(e), this._emitterInverseWorldMatrix = K.Identity(), this._inheritedVelocityOffset = new l(), this.onDisposeObservable = new Z(), this.onStoppedObservable = new Z(), this._particles = new Array(), this._stockParticles = new Array(), this._newPartsExcess = 0, this._vertexBuffers = {}, this._scaledColorStep = new v(0, 0, 0, 0), this._colorDiff = new v(0, 0, 0, 0), this._scaledDirection = l.Zero(), this._scaledGravity = l.Zero(), this._currentRenderId = -1, this._useInstancing = !1, this._started = !1, this._stopped = !1, this._actualFrame = 0, this._currentEmitRate1 = 0, this._currentEmitRate2 = 0, this._currentStartSize1 = 0, this._currentStartSize2 = 0, this.updateInAnimate = !0, this._rawTextureWidth = 256, this._useRampGradients = !1, this.isLocal = !1, this.isGPU = !1, this._onBeforeDrawParticlesObservable = null, this._emitFromParticle = (n) => {
    }, this.recycleParticle = (n) => {
      const f = this._particles.pop();
      f !== n && f.copyTo(n), this._stockParticles.push(f);
    }, this._createParticle = () => {
      let n;
      return this._stockParticles.length !== 0 ? (n = this._stockParticles.pop(), n._reset()) : n = new V(this), this._prepareParticle(n), n;
    }, this._capacity = t, this._epsilon = a, this._isAnimationSheetEnabled = r, !i || i.getClassName() === "Scene" ? (this._scene = i || oe.LastCreatedScene, this._engine = this._scene.getEngine(), this.uniqueId = this._scene.getUniqueId(), this._scene.particleSystems.push(this)) : (this._engine = i, this.defaultProjectionMatrix = K.PerspectiveFovLH(0.8, 1, 0.1, 100, this._engine.isNDCHalfZRange)), this._engine.getCaps().vertexArrayObject && (this._vertexArrayObject = null), this._attachImageProcessingConfiguration(null), this._customWrappers = { 0: new X(this._engine) }, this._customWrappers[0].effect = s, this._drawWrappers = [], this._useInstancing = this._engine.getCaps().instancedArrays, this._createIndexBuffer(), this._createVertexBuffers(), this.particleEmitterType = new M();
    let d = null;
    this.updateFunction = (n) => {
      let f = null;
      this.noiseTexture && (f = this.noiseTexture.getSize(), this.noiseTexture.getContent()?.then((_) => {
        d = _;
      }));
      const m = n === this._particles;
      for (let _ = 0; _ < n.length; _++) {
        const o = n[_];
        let p = this._scaledUpdateSpeed;
        const D = o.age;
        if (o.age += p, o.age > o.lifeTime) {
          const h = o.age - D;
          p = (o.lifeTime - D) * p / h, o.age = o.lifeTime;
        }
        const x = o.age / o.lifeTime;
        this._colorGradients && this._colorGradients.length > 0 ? A.GetCurrentGradient(x, this._colorGradients, (h, G, R) => {
          h !== o._currentColorGradient && (o._currentColor1.copyFrom(o._currentColor2), G.getColorToRef(o._currentColor2), o._currentColorGradient = h), v.LerpToRef(o._currentColor1, o._currentColor2, R, o.color);
        }) : (o.colorStep.scaleToRef(p, this._scaledColorStep), o.color.addInPlace(this._scaledColorStep), o.color.a < 0 && (o.color.a = 0)), this._angularSpeedGradients && this._angularSpeedGradients.length > 0 && A.GetCurrentGradient(x, this._angularSpeedGradients, (h, G, R) => {
          h !== o._currentAngularSpeedGradient && (o._currentAngularSpeed1 = o._currentAngularSpeed2, o._currentAngularSpeed2 = G.getFactor(), o._currentAngularSpeedGradient = h), o.angularSpeed = S(o._currentAngularSpeed1, o._currentAngularSpeed2, R);
        }), o.angle += o.angularSpeed * p;
        let c = p;
        if (this._velocityGradients && this._velocityGradients.length > 0 && A.GetCurrentGradient(x, this._velocityGradients, (h, G, R) => {
          h !== o._currentVelocityGradient && (o._currentVelocity1 = o._currentVelocity2, o._currentVelocity2 = G.getFactor(), o._currentVelocityGradient = h), c *= S(o._currentVelocity1, o._currentVelocity2, R);
        }), o.direction.scaleToRef(c, this._scaledDirection), this._limitVelocityGradients && this._limitVelocityGradients.length > 0 && A.GetCurrentGradient(x, this._limitVelocityGradients, (h, G, R) => {
          h !== o._currentLimitVelocityGradient && (o._currentLimitVelocity1 = o._currentLimitVelocity2, o._currentLimitVelocity2 = G.getFactor(), o._currentLimitVelocityGradient = h);
          const T = S(o._currentLimitVelocity1, o._currentLimitVelocity2, R);
          o.direction.length() > T && o.direction.scaleInPlace(this.limitVelocityDamping);
        }), this._dragGradients && this._dragGradients.length > 0 && A.GetCurrentGradient(x, this._dragGradients, (h, G, R) => {
          h !== o._currentDragGradient && (o._currentDrag1 = o._currentDrag2, o._currentDrag2 = G.getFactor(), o._currentDragGradient = h);
          const T = S(o._currentDrag1, o._currentDrag2, R);
          this._scaledDirection.scaleInPlace(1 - T);
        }), this.isLocal && o._localPosition ? (o._localPosition.addInPlace(this._scaledDirection), l.TransformCoordinatesToRef(o._localPosition, this._emitterWorldMatrix, o.position)) : o.position.addInPlace(this._scaledDirection), d && f && o._randomNoiseCoordinates1) {
          const h = this._fetchR(o._randomNoiseCoordinates1.x, o._randomNoiseCoordinates1.y, f.width, f.height, d), G = this._fetchR(o._randomNoiseCoordinates1.z, o._randomNoiseCoordinates2.x, f.width, f.height, d), R = this._fetchR(o._randomNoiseCoordinates2.y, o._randomNoiseCoordinates2.z, f.width, f.height, d), T = g.Vector3[0], z = g.Vector3[1];
          T.copyFromFloats((2 * h - 1) * this.noiseStrength.x, (2 * G - 1) * this.noiseStrength.y, (2 * R - 1) * this.noiseStrength.z), T.scaleToRef(p, z), o.direction.addInPlace(z);
        }
        if (this.gravity.scaleToRef(p, this._scaledGravity), o.direction.addInPlace(this._scaledGravity), this._sizeGradients && this._sizeGradients.length > 0 && A.GetCurrentGradient(x, this._sizeGradients, (h, G, R) => {
          h !== o._currentSizeGradient && (o._currentSize1 = o._currentSize2, o._currentSize2 = G.getFactor(), o._currentSizeGradient = h), o.size = S(o._currentSize1, o._currentSize2, R);
        }), this._useRampGradients && (this._colorRemapGradients && this._colorRemapGradients.length > 0 && A.GetCurrentGradient(x, this._colorRemapGradients, (h, G, R) => {
          const T = S(h.factor1, G.factor1, R), z = S(h.factor2, G.factor2, R);
          o.remapData.x = T, o.remapData.y = z - T;
        }), this._alphaRemapGradients && this._alphaRemapGradients.length > 0 && A.GetCurrentGradient(x, this._alphaRemapGradients, (h, G, R) => {
          const T = S(h.factor1, G.factor1, R), z = S(h.factor2, G.factor2, R);
          o.remapData.z = T, o.remapData.w = z - T;
        })), this._isAnimationSheetEnabled && o.updateCellIndex(), o._inheritParticleInfoToSubEmitters(), o.age >= o.lifeTime) {
          this._emitFromParticle(o), o._attachedSubEmitters && (o._attachedSubEmitters.forEach((h) => {
            h.particleSystem.disposeOnStop = !0, h.particleSystem.stop();
          }), o._attachedSubEmitters = null), this.recycleParticle(o), m && _--;
          continue;
        }
      }
    };
  }
  serialize(e) {
    throw new Error("Method not implemented.");
  }
  /**
   * Clones the particle system.
   * @param name The name of the cloned object
   * @param newEmitter The new emitter to use
   * @param cloneTexture Also clone the textures if true
   */
  clone(e, t, i = !1) {
    throw new Error("Method not implemented.");
  }
  _addFactorGradient(e, t, i, s) {
    const r = new re(t, i, s);
    e.push(r), e.sort((a, d) => a.gradient < d.gradient ? -1 : a.gradient > d.gradient ? 1 : 0);
  }
  _removeFactorGradient(e, t) {
    if (!e)
      return;
    let i = 0;
    for (const s of e) {
      if (s.gradient === t) {
        e.splice(i, 1);
        break;
      }
      i++;
    }
  }
  /**
   * Adds a new life time gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the life time factor to affect to the specified gradient
   * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
   * @returns the current particle system
   */
  addLifeTimeGradient(e, t, i) {
    return this._lifeTimeGradients || (this._lifeTimeGradients = []), this._addFactorGradient(this._lifeTimeGradients, e, t, i), this;
  }
  /**
   * Remove a specific life time gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeLifeTimeGradient(e) {
    return this._removeFactorGradient(this._lifeTimeGradients, e), this;
  }
  /**
   * Adds a new size gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the size factor to affect to the specified gradient
   * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
   * @returns the current particle system
   */
  addSizeGradient(e, t, i) {
    return this._sizeGradients || (this._sizeGradients = []), this._addFactorGradient(this._sizeGradients, e, t, i), this;
  }
  /**
   * Remove a specific size gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeSizeGradient(e) {
    return this._removeFactorGradient(this._sizeGradients, e), this;
  }
  /**
   * Adds a new color remap gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param min defines the color remap minimal range
   * @param max defines the color remap maximal range
   * @returns the current particle system
   */
  addColorRemapGradient(e, t, i) {
    return this._colorRemapGradients || (this._colorRemapGradients = []), this._addFactorGradient(this._colorRemapGradients, e, t, i), this;
  }
  /**
   * Remove a specific color remap gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeColorRemapGradient(e) {
    return this._removeFactorGradient(this._colorRemapGradients, e), this;
  }
  /**
   * Adds a new alpha remap gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param min defines the alpha remap minimal range
   * @param max defines the alpha remap maximal range
   * @returns the current particle system
   */
  addAlphaRemapGradient(e, t, i) {
    return this._alphaRemapGradients || (this._alphaRemapGradients = []), this._addFactorGradient(this._alphaRemapGradients, e, t, i), this;
  }
  /**
   * Remove a specific alpha remap gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeAlphaRemapGradient(e) {
    return this._removeFactorGradient(this._alphaRemapGradients, e), this;
  }
  /**
   * Adds a new angular speed gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the angular speed  to affect to the specified gradient
   * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
   * @returns the current particle system
   */
  addAngularSpeedGradient(e, t, i) {
    return this._angularSpeedGradients || (this._angularSpeedGradients = []), this._addFactorGradient(this._angularSpeedGradients, e, t, i), this;
  }
  /**
   * Remove a specific angular speed gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeAngularSpeedGradient(e) {
    return this._removeFactorGradient(this._angularSpeedGradients, e), this;
  }
  /**
   * Adds a new velocity gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the velocity to affect to the specified gradient
   * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
   * @returns the current particle system
   */
  addVelocityGradient(e, t, i) {
    return this._velocityGradients || (this._velocityGradients = []), this._addFactorGradient(this._velocityGradients, e, t, i), this;
  }
  /**
   * Remove a specific velocity gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeVelocityGradient(e) {
    return this._removeFactorGradient(this._velocityGradients, e), this;
  }
  /**
   * Adds a new limit velocity gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the limit velocity value to affect to the specified gradient
   * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
   * @returns the current particle system
   */
  addLimitVelocityGradient(e, t, i) {
    return this._limitVelocityGradients || (this._limitVelocityGradients = []), this._addFactorGradient(this._limitVelocityGradients, e, t, i), this;
  }
  /**
   * Remove a specific limit velocity gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeLimitVelocityGradient(e) {
    return this._removeFactorGradient(this._limitVelocityGradients, e), this;
  }
  /**
   * Adds a new drag gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the drag value to affect to the specified gradient
   * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
   * @returns the current particle system
   */
  addDragGradient(e, t, i) {
    return this._dragGradients || (this._dragGradients = []), this._addFactorGradient(this._dragGradients, e, t, i), this;
  }
  /**
   * Remove a specific drag gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeDragGradient(e) {
    return this._removeFactorGradient(this._dragGradients, e), this;
  }
  /**
   * Adds a new emit rate gradient (please note that this will only work if you set the targetStopDuration property)
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the emit rate value to affect to the specified gradient
   * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
   * @returns the current particle system
   */
  addEmitRateGradient(e, t, i) {
    return this._emitRateGradients || (this._emitRateGradients = []), this._addFactorGradient(this._emitRateGradients, e, t, i), this;
  }
  /**
   * Remove a specific emit rate gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeEmitRateGradient(e) {
    return this._removeFactorGradient(this._emitRateGradients, e), this;
  }
  /**
   * Adds a new start size gradient (please note that this will only work if you set the targetStopDuration property)
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the start size value to affect to the specified gradient
   * @param factor2 defines an additional factor used to define a range ([factor, factor2]) with main value to pick the final value from
   * @returns the current particle system
   */
  addStartSizeGradient(e, t, i) {
    return this._startSizeGradients || (this._startSizeGradients = []), this._addFactorGradient(this._startSizeGradients, e, t, i), this;
  }
  /**
   * Remove a specific start size gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeStartSizeGradient(e) {
    return this._removeFactorGradient(this._startSizeGradients, e), this;
  }
  _createRampGradientTexture() {
    if (!this._rampGradients || !this._rampGradients.length || this._rampGradientsTexture || !this._scene)
      return;
    const e = new Uint8Array(this._rawTextureWidth * 4), t = de.Color3[0];
    for (let i = 0; i < this._rawTextureWidth; i++) {
      const s = i / this._rawTextureWidth;
      A.GetCurrentGradient(s, this._rampGradients, (r, a, d) => {
        ie.LerpToRef(r.color, a.color, d, t), e[i * 4] = t.r * 255, e[i * 4 + 1] = t.g * 255, e[i * 4 + 2] = t.b * 255, e[i * 4 + 3] = 255;
      });
    }
    this._rampGradientsTexture = ce.CreateRGBATexture(e, this._rawTextureWidth, 1, this._scene, !1, !1, 1);
  }
  /**
   * Gets the current list of ramp gradients.
   * You must use addRampGradient and removeRampGradient to update this list
   * @returns the list of ramp gradients
   */
  getRampGradients() {
    return this._rampGradients;
  }
  /** Force the system to rebuild all gradients that need to be resync */
  forceRefreshGradients() {
    this._syncRampGradientTexture();
  }
  _syncRampGradientTexture() {
    this._rampGradients && (this._rampGradients.sort((e, t) => e.gradient < t.gradient ? -1 : e.gradient > t.gradient ? 1 : 0), this._rampGradientsTexture && (this._rampGradientsTexture.dispose(), this._rampGradientsTexture = null), this._createRampGradientTexture());
  }
  /**
   * Adds a new ramp gradient used to remap particle colors
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param color defines the color to affect to the specified gradient
   * @returns the current particle system
   */
  addRampGradient(e, t) {
    this._rampGradients || (this._rampGradients = []);
    const i = new se(e, t);
    return this._rampGradients.push(i), this._syncRampGradientTexture(), this;
  }
  /**
   * Remove a specific ramp gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeRampGradient(e) {
    return this._removeGradientAndTexture(e, this._rampGradients, this._rampGradientsTexture), this._rampGradientsTexture = null, this._rampGradients && this._rampGradients.length > 0 && this._createRampGradientTexture(), this;
  }
  /**
   * Adds a new color gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param color1 defines the color to affect to the specified gradient
   * @param color2 defines an additional color used to define a range ([color, color2]) with main color to pick the final color from
   * @returns this particle system
   */
  addColorGradient(e, t, i) {
    this._colorGradients || (this._colorGradients = []);
    const s = new ne(e, t, i);
    return this._colorGradients.push(s), this._colorGradients.sort((r, a) => r.gradient < a.gradient ? -1 : r.gradient > a.gradient ? 1 : 0), this;
  }
  /**
   * Remove a specific color gradient
   * @param gradient defines the gradient to remove
   * @returns this particle system
   */
  removeColorGradient(e) {
    if (!this._colorGradients)
      return this;
    let t = 0;
    for (const i of this._colorGradients) {
      if (i.gradient === e) {
        this._colorGradients.splice(t, 1);
        break;
      }
      t++;
    }
    return this;
  }
  /**
   * Resets the draw wrappers cache
   */
  resetDrawCache() {
    for (const e of this._drawWrappers)
      if (e)
        for (const t of e)
          t?.dispose();
    this._drawWrappers = [];
  }
  _fetchR(e, t, i, s, r) {
    e = Math.abs(e) * 0.5 + 0.5, t = Math.abs(t) * 0.5 + 0.5;
    const a = e * i % i | 0, d = t * s % s | 0, n = (a + d * i) * 4;
    return r[n] / 255;
  }
  _reset() {
    this._resetEffect();
  }
  _resetEffect() {
    this._vertexBuffer && (this._vertexBuffer.dispose(), this._vertexBuffer = null), this._spriteBuffer && (this._spriteBuffer.dispose(), this._spriteBuffer = null), this._vertexArrayObject && (this._engine.releaseVertexArrayObject(this._vertexArrayObject), this._vertexArrayObject = null), this._createVertexBuffers();
  }
  _createVertexBuffers() {
    this._vertexBufferSize = this._useInstancing ? 10 : 12, this._isAnimationSheetEnabled && (this._vertexBufferSize += 1), (!this._isBillboardBased || this.billboardMode === 8 || this.billboardMode === 9) && (this._vertexBufferSize += 3), this._useRampGradients && (this._vertexBufferSize += 4);
    const e = this._engine, t = this._vertexBufferSize * (this._useInstancing ? 1 : 4);
    this._vertexData = new Float32Array(this._capacity * t), this._vertexBuffer = new Q(e, this._vertexData, !0, t);
    let i = 0;
    const s = this._vertexBuffer.createVertexBuffer(B.PositionKind, i, 3, this._vertexBufferSize, this._useInstancing);
    this._vertexBuffers[B.PositionKind] = s, i += 3;
    const r = this._vertexBuffer.createVertexBuffer(B.ColorKind, i, 4, this._vertexBufferSize, this._useInstancing);
    this._vertexBuffers[B.ColorKind] = r, i += 4;
    const a = this._vertexBuffer.createVertexBuffer("angle", i, 1, this._vertexBufferSize, this._useInstancing);
    this._vertexBuffers.angle = a, i += 1;
    const d = this._vertexBuffer.createVertexBuffer("size", i, 2, this._vertexBufferSize, this._useInstancing);
    if (this._vertexBuffers.size = d, i += 2, this._isAnimationSheetEnabled) {
      const f = this._vertexBuffer.createVertexBuffer("cellIndex", i, 1, this._vertexBufferSize, this._useInstancing);
      this._vertexBuffers.cellIndex = f, i += 1;
    }
    if (!this._isBillboardBased || this.billboardMode === 8 || this.billboardMode === 9) {
      const f = this._vertexBuffer.createVertexBuffer("direction", i, 3, this._vertexBufferSize, this._useInstancing);
      this._vertexBuffers.direction = f, i += 3;
    }
    if (this._useRampGradients) {
      const f = this._vertexBuffer.createVertexBuffer("remapData", i, 4, this._vertexBufferSize, this._useInstancing);
      this._vertexBuffers.remapData = f, i += 4;
    }
    let n;
    if (this._useInstancing) {
      const f = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
      this._spriteBuffer = new Q(e, f, !1, 2), n = this._spriteBuffer.createVertexBuffer("offset", 0, 2);
    } else
      n = this._vertexBuffer.createVertexBuffer("offset", i, 2, this._vertexBufferSize, this._useInstancing), i += 2;
    this._vertexBuffers.offset = n, this.resetDrawCache();
  }
  _createIndexBuffer() {
    if (this._useInstancing) {
      this._linesIndexBufferUseInstancing = this._engine.createIndexBuffer(new Uint32Array([0, 1, 1, 3, 3, 2, 2, 0, 0, 3]));
      return;
    }
    const e = [], t = [];
    let i = 0;
    for (let s = 0; s < this._capacity; s++)
      e.push(i), e.push(i + 1), e.push(i + 2), e.push(i), e.push(i + 2), e.push(i + 3), t.push(i, i + 1, i + 1, i + 2, i + 2, i + 3, i + 3, i, i, i + 3), i += 4;
    this._indexBuffer = this._engine.createIndexBuffer(e), this._linesIndexBuffer = this._engine.createIndexBuffer(t);
  }
  /**
   * Gets the maximum number of particles active at the same time.
   * @returns The max number of active particles.
   */
  getCapacity() {
    return this._capacity;
  }
  /**
   * Gets whether there are still active particles in the system.
   * @returns True if it is alive, otherwise false.
   */
  isAlive() {
    return this._alive;
  }
  /**
   * Gets if the system has been started. (Note: this will still be true after stop is called)
   * @returns True if it has been started, otherwise false.
   */
  isStarted() {
    return this._started;
  }
  /** @internal */
  _preStart() {
  }
  /**
   * Starts the particle system and begins to emit
   * @param delay defines the delay in milliseconds before starting the system (this.startDelay by default)
   */
  start(e = this.startDelay) {
    if (!this.targetStopDuration && this._hasTargetStopDurationDependantGradient())
      throw "Particle system started with a targetStopDuration dependant gradient (eg. startSizeGradients) but no targetStopDuration set";
    if (e) {
      setTimeout(() => {
        this.start(0);
      }, e);
      return;
    }
    if (this._started = !0, this._stopped = !1, this._actualFrame = 0, this._preStart(), this._emitRateGradients && (this._emitRateGradients.length > 0 && (this._currentEmitRateGradient = this._emitRateGradients[0], this._currentEmitRate1 = this._currentEmitRateGradient.getFactor(), this._currentEmitRate2 = this._currentEmitRate1), this._emitRateGradients.length > 1 && (this._currentEmitRate2 = this._emitRateGradients[1].getFactor())), this._startSizeGradients && (this._startSizeGradients.length > 0 && (this._currentStartSizeGradient = this._startSizeGradients[0], this._currentStartSize1 = this._currentStartSizeGradient.getFactor(), this._currentStartSize2 = this._currentStartSize1), this._startSizeGradients.length > 1 && (this._currentStartSize2 = this._startSizeGradients[1].getFactor())), this.preWarmCycles) {
      this.emitter?.getClassName().indexOf("Mesh") !== -1 && this.emitter.computeWorldMatrix(!0);
      const t = this.noiseTexture;
      if (t && t.onGeneratedObservable)
        t.onGeneratedObservable.addOnce(() => {
          setTimeout(() => {
            for (let i = 0; i < this.preWarmCycles; i++)
              this.animate(!0), t.render();
          });
        });
      else
        for (let i = 0; i < this.preWarmCycles; i++)
          this.animate(!0);
    }
    this.beginAnimationOnStart && this.animations && this.animations.length > 0 && this._scene && this._scene.beginAnimation(this, this.beginAnimationFrom, this.beginAnimationTo, this.beginAnimationLoop);
  }
  /**
   * Stops the particle system.
   * @param stopSubEmitters if true it will stop the current system and all created sub-Systems if false it will stop the current root system only, this param is used by the root particle system only. The default value is true.
   */
  stop(e = !0) {
    this._stopped || (this.onStoppedObservable.notifyObservers(this), this._stopped = !0, this._postStop(e));
  }
  /** @internal */
  _postStop(e) {
  }
  // Animation sheet
  /**
   * Remove all active particles
   */
  reset() {
    this._stockParticles.length = 0, this._particles.length = 0;
  }
  /**
   * @internal (for internal use only)
   */
  _appendParticleVertex(e, t, i, s) {
    let r = e * this._vertexBufferSize;
    if (this._vertexData[r++] = t.position.x + this.worldOffset.x, this._vertexData[r++] = t.position.y + this.worldOffset.y, this._vertexData[r++] = t.position.z + this.worldOffset.z, this._vertexData[r++] = t.color.r, this._vertexData[r++] = t.color.g, this._vertexData[r++] = t.color.b, this._vertexData[r++] = t.color.a, this._vertexData[r++] = t.angle, this._vertexData[r++] = t.scale.x * t.size, this._vertexData[r++] = t.scale.y * t.size, this._isAnimationSheetEnabled && (this._vertexData[r++] = t.cellIndex), this._isBillboardBased)
      (this.billboardMode === 8 || this.billboardMode === 9) && (this._vertexData[r++] = t.direction.x, this._vertexData[r++] = t.direction.y, this._vertexData[r++] = t.direction.z);
    else if (t._initialDirection) {
      let a = t._initialDirection;
      this.isLocal && (l.TransformNormalToRef(a, this._emitterWorldMatrix, g.Vector3[0]), a = g.Vector3[0]), a.x === 0 && a.z === 0 && (a.x = 1e-3), this._vertexData[r++] = a.x, this._vertexData[r++] = a.y, this._vertexData[r++] = a.z;
    } else {
      let a = t.direction;
      this.isLocal && (l.TransformNormalToRef(a, this._emitterWorldMatrix, g.Vector3[0]), a = g.Vector3[0]), a.x === 0 && a.z === 0 && (a.x = 1e-3), this._vertexData[r++] = a.x, this._vertexData[r++] = a.y, this._vertexData[r++] = a.z;
    }
    this._useRampGradients && t.remapData && (this._vertexData[r++] = t.remapData.x, this._vertexData[r++] = t.remapData.y, this._vertexData[r++] = t.remapData.z, this._vertexData[r++] = t.remapData.w), this._useInstancing || (this._isAnimationSheetEnabled && (i === 0 ? i = this._epsilon : i === 1 && (i = 1 - this._epsilon), s === 0 ? s = this._epsilon : s === 1 && (s = 1 - this._epsilon)), this._vertexData[r++] = i, this._vertexData[r++] = s);
  }
  /** @internal */
  _prepareParticle(e) {
  }
  _update(e) {
    if (this._alive = this._particles.length > 0, this.emitter.position) {
      const i = this.emitter;
      this._emitterWorldMatrix = i.getWorldMatrix();
    } else {
      const i = this.emitter;
      this._emitterWorldMatrix = K.Translation(i.x, i.y, i.z);
    }
    this._emitterWorldMatrix.invertToRef(this._emitterInverseWorldMatrix), this.updateFunction(this._particles);
    let t;
    for (let i = 0; i < e && this._particles.length !== this._capacity; i++) {
      if (t = this._createParticle(), this._particles.push(t), this.targetStopDuration && this._lifeTimeGradients && this._lifeTimeGradients.length > 0) {
        const r = q(this._actualFrame / this.targetStopDuration);
        A.GetCurrentGradient(r, this._lifeTimeGradients, (a, d) => {
          const n = a, f = d, m = n.getFactor(), _ = f.getFactor(), o = (r - n.gradient) / (f.gradient - n.gradient);
          t.lifeTime = S(m, _, o);
        });
      } else
        t.lifeTime = E(this.minLifeTime, this.maxLifeTime);
      const s = E(this.minEmitPower, this.maxEmitPower);
      if (this.startPositionFunction ? this.startPositionFunction(this._emitterWorldMatrix, t.position, t, this.isLocal) : this.particleEmitterType.startPositionFunction(this._emitterWorldMatrix, t.position, t, this.isLocal), this.isLocal && (t._localPosition ? t._localPosition.copyFrom(t.position) : t._localPosition = t.position.clone(), l.TransformCoordinatesToRef(t._localPosition, this._emitterWorldMatrix, t.position)), this.startDirectionFunction ? this.startDirectionFunction(this._emitterWorldMatrix, t.direction, t, this.isLocal) : this.particleEmitterType.startDirectionFunction(this._emitterWorldMatrix, t.direction, t, this.isLocal, this._emitterInverseWorldMatrix), s === 0 ? t._initialDirection ? t._initialDirection.copyFrom(t.direction) : t._initialDirection = t.direction.clone() : t._initialDirection = null, t.direction.scaleInPlace(s), !this._sizeGradients || this._sizeGradients.length === 0 ? t.size = E(this.minSize, this.maxSize) : (t._currentSizeGradient = this._sizeGradients[0], t._currentSize1 = t._currentSizeGradient.getFactor(), t.size = t._currentSize1, this._sizeGradients.length > 1 ? t._currentSize2 = this._sizeGradients[1].getFactor() : t._currentSize2 = t._currentSize1), t.scale.copyFromFloats(E(this.minScaleX, this.maxScaleX), E(this.minScaleY, this.maxScaleY)), this._startSizeGradients && this._startSizeGradients[0] && this.targetStopDuration) {
        const r = this._actualFrame / this.targetStopDuration;
        A.GetCurrentGradient(r, this._startSizeGradients, (a, d, n) => {
          a !== this._currentStartSizeGradient && (this._currentStartSize1 = this._currentStartSize2, this._currentStartSize2 = d.getFactor(), this._currentStartSizeGradient = a);
          const f = S(this._currentStartSize1, this._currentStartSize2, n);
          t.scale.scaleInPlace(f);
        });
      }
      if (!this._angularSpeedGradients || this._angularSpeedGradients.length === 0 ? t.angularSpeed = E(this.minAngularSpeed, this.maxAngularSpeed) : (t._currentAngularSpeedGradient = this._angularSpeedGradients[0], t.angularSpeed = t._currentAngularSpeedGradient.getFactor(), t._currentAngularSpeed1 = t.angularSpeed, this._angularSpeedGradients.length > 1 ? t._currentAngularSpeed2 = this._angularSpeedGradients[1].getFactor() : t._currentAngularSpeed2 = t._currentAngularSpeed1), t.angle = E(this.minInitialRotation, this.maxInitialRotation), this._velocityGradients && this._velocityGradients.length > 0 && (t._currentVelocityGradient = this._velocityGradients[0], t._currentVelocity1 = t._currentVelocityGradient.getFactor(), this._velocityGradients.length > 1 ? t._currentVelocity2 = this._velocityGradients[1].getFactor() : t._currentVelocity2 = t._currentVelocity1), this._limitVelocityGradients && this._limitVelocityGradients.length > 0 && (t._currentLimitVelocityGradient = this._limitVelocityGradients[0], t._currentLimitVelocity1 = t._currentLimitVelocityGradient.getFactor(), this._limitVelocityGradients.length > 1 ? t._currentLimitVelocity2 = this._limitVelocityGradients[1].getFactor() : t._currentLimitVelocity2 = t._currentLimitVelocity1), this._dragGradients && this._dragGradients.length > 0 && (t._currentDragGradient = this._dragGradients[0], t._currentDrag1 = t._currentDragGradient.getFactor(), this._dragGradients.length > 1 ? t._currentDrag2 = this._dragGradients[1].getFactor() : t._currentDrag2 = t._currentDrag1), !this._colorGradients || this._colorGradients.length === 0) {
        const r = E(0, 1);
        v.LerpToRef(this.color1, this.color2, r, t.color), this.colorDead.subtractToRef(t.color, this._colorDiff), this._colorDiff.scaleToRef(1 / t.lifeTime, t.colorStep);
      } else
        t._currentColorGradient = this._colorGradients[0], t._currentColorGradient.getColorToRef(t.color), t._currentColor1.copyFrom(t.color), this._colorGradients.length > 1 ? this._colorGradients[1].getColorToRef(t._currentColor2) : t._currentColor2.copyFrom(t.color);
      this._isAnimationSheetEnabled && (t._initialStartSpriteCellID = this.startSpriteCellID, t._initialEndSpriteCellID = this.endSpriteCellID, t._initialSpriteCellLoop = this.spriteCellLoop), t.direction.addInPlace(this._inheritedVelocityOffset), this._useRampGradients && (t.remapData = new ee(0, 1, 0, 1)), this.noiseTexture && (t._randomNoiseCoordinates1 ? (t._randomNoiseCoordinates1.copyFromFloats(Math.random(), Math.random(), Math.random()), t._randomNoiseCoordinates2.copyFromFloats(Math.random(), Math.random(), Math.random())) : (t._randomNoiseCoordinates1 = new l(Math.random(), Math.random(), Math.random()), t._randomNoiseCoordinates2 = new l(Math.random(), Math.random(), Math.random()))), t._inheritParticleInfoToSubEmitters();
    }
  }
  /**
   * @internal
   */
  static _GetAttributeNamesOrOptions(e = !1, t = !1, i = !1) {
    const s = [B.PositionKind, B.ColorKind, "angle", "offset", "size"];
    return e && s.push("cellIndex"), t || s.push("direction"), i && s.push("remapData"), s;
  }
  /**
   * @internal
   */
  static _GetEffectCreationOptions(e = !1, t = !1, i = !1) {
    const s = ["invView", "view", "projection", "textureMask", "translationPivot", "eyePosition"];
    return le(s), e && s.push("particlesInfos"), t && s.push("logarithmicDepthConstant"), i && (s.push("vFogInfos"), s.push("vFogColor")), s;
  }
  /**
   * Fill the defines array according to the current settings of the particle system
   * @param defines Array to be updated
   * @param blendMode blend mode to take into account when updating the array
   */
  fillDefines(e, t) {
    if (this._scene && (fe(this, this._scene, e), this.applyFog && this._scene.fogEnabled && this._scene.fogMode !== 0 && e.push("#define FOG")), this._isAnimationSheetEnabled && e.push("#define ANIMATESHEET"), this.useLogarithmicDepth && e.push("#define LOGARITHMICDEPTH"), t === y.BLENDMODE_MULTIPLY && e.push("#define BLENDMULTIPLYMODE"), this._useRampGradients && e.push("#define RAMPGRADIENT"), this._isBillboardBased)
      switch (e.push("#define BILLBOARD"), this.billboardMode) {
        case 2:
          e.push("#define BILLBOARDY");
          break;
        case 8:
        case 9:
          e.push("#define BILLBOARDSTRETCHED"), this.billboardMode === 9 && e.push("#define BILLBOARDSTRETCHED_LOCAL");
          break;
        case 7:
          e.push("#define BILLBOARDMODE_ALL");
          break;
      }
    this._imageProcessingConfiguration && (this._imageProcessingConfiguration.prepareDefines(this._imageProcessingConfigurationDefines), e.push(this._imageProcessingConfigurationDefines.toString()));
  }
  /**
   * Fill the uniforms, attributes and samplers arrays according to the current settings of the particle system
   * @param uniforms Uniforms array to fill
   * @param attributes Attributes array to fill
   * @param samplers Samplers array to fill
   */
  fillUniformsAttributesAndSamplerNames(e, t, i) {
    t.push(...W._GetAttributeNamesOrOptions(this._isAnimationSheetEnabled, this._isBillboardBased && this.billboardMode !== 8 && this.billboardMode !== 9, this._useRampGradients)), e.push(...W._GetEffectCreationOptions(this._isAnimationSheetEnabled, this.useLogarithmicDepth, this.applyFog)), i.push("diffuseSampler", "rampSampler"), this._imageProcessingConfiguration && (pe(e, this._imageProcessingConfigurationDefines), ge(i, this._imageProcessingConfigurationDefines));
  }
  /**
   * @internal
   */
  _getWrapper(e) {
    const t = this._getCustomDrawWrapper(e);
    if (t?.effect)
      return t;
    const i = [];
    this.fillDefines(i, e);
    const s = this._engine._features.supportRenderPasses ? this._engine.currentRenderPassId : 0;
    let r = this._drawWrappers[s];
    r || (r = this._drawWrappers[s] = []);
    let a = r[e];
    a || (a = new X(this._engine), a.drawContext && (a.drawContext.useInstancing = this._useInstancing), r[e] = a);
    const d = i.join(`
`);
    if (a.defines !== d) {
      const n = [], f = [], m = [];
      this.fillUniformsAttributesAndSamplerNames(f, n, m), a.setEffect(this._engine.createEffect("particles", n, f, m, d), d);
    }
    return a;
  }
  /**
   * Animates the particle system for the current frame by emitting new particles and or animating the living ones.
   * @param preWarmOnly will prevent the system from updating the vertex buffer (default is false)
   */
  animate(e = !1) {
    if (!this._started)
      return;
    if (!e && this._scene) {
      if (!this.isReady() || this._currentRenderId === this._scene.getFrameId())
        return;
      this._currentRenderId = this._scene.getFrameId();
    }
    this._scaledUpdateSpeed = this.updateSpeed * (e ? this.preWarmStepOffset : this._scene?.getAnimationRatio() || 1);
    let t;
    if (this.manualEmitCount > -1)
      t = this.manualEmitCount, this._newPartsExcess = 0, this.manualEmitCount = 0;
    else {
      let i = this.emitRate;
      if (this._emitRateGradients && this._emitRateGradients.length > 0 && this.targetStopDuration) {
        const s = this._actualFrame / this.targetStopDuration;
        A.GetCurrentGradient(s, this._emitRateGradients, (r, a, d) => {
          r !== this._currentEmitRateGradient && (this._currentEmitRate1 = this._currentEmitRate2, this._currentEmitRate2 = a.getFactor(), this._currentEmitRateGradient = r), i = S(this._currentEmitRate1, this._currentEmitRate2, d);
        });
      }
      t = i * this._scaledUpdateSpeed >> 0, this._newPartsExcess += i * this._scaledUpdateSpeed - t;
    }
    if (this._newPartsExcess > 1 && (t += this._newPartsExcess >> 0, this._newPartsExcess -= this._newPartsExcess >> 0), this._alive = !1, this._stopped ? t = 0 : (this._actualFrame += this._scaledUpdateSpeed, this.targetStopDuration && this._actualFrame >= this.targetStopDuration && this.stop()), this._update(t), this._stopped && (this._alive || (this._started = !1, this.onAnimationEnd && this.onAnimationEnd(), this.disposeOnStop && this._scene && this._scene._toBeDisposed.push(this))), !e) {
      let i = 0;
      for (let s = 0; s < this._particles.length; s++) {
        const r = this._particles[s];
        this._appendParticleVertices(i, r), i += this._useInstancing ? 1 : 4;
      }
      this._vertexBuffer && this._vertexBuffer.updateDirectly(this._vertexData, 0, this._particles.length);
    }
    this.manualEmitCount === 0 && this.disposeOnStop && this.stop();
  }
  _appendParticleVertices(e, t) {
    this._appendParticleVertex(e++, t, 0, 0), this._useInstancing || (this._appendParticleVertex(e++, t, 1, 0), this._appendParticleVertex(e++, t, 1, 1), this._appendParticleVertex(e++, t, 0, 1));
  }
  /**
   * Rebuilds the particle system.
   */
  rebuild() {
    this._engine.getCaps().vertexArrayObject && (this._vertexArrayObject = null), this._createIndexBuffer(), this._spriteBuffer?._rebuild(), this._createVertexBuffers(), this.resetDrawCache();
  }
  /**
   * Is this system ready to be used/rendered
   * @returns true if the system is ready
   */
  isReady() {
    if (!this.emitter || this._imageProcessingConfiguration && !this._imageProcessingConfiguration.isReady() || !this.particleTexture || !this.particleTexture.isReady())
      return !1;
    if (this.blendMode !== y.BLENDMODE_MULTIPLYADD) {
      if (!this._getWrapper(this.blendMode).effect.isReady())
        return !1;
    } else if (!this._getWrapper(y.BLENDMODE_MULTIPLY).effect.isReady() || !this._getWrapper(y.BLENDMODE_ADD).effect.isReady())
      return !1;
    return !0;
  }
  _render(e) {
    const t = this._getWrapper(e), i = t.effect, s = this._engine;
    s.enableEffect(t);
    const r = this.defaultViewMatrix ?? this._scene.getViewMatrix();
    if (i.setTexture("diffuseSampler", this.particleTexture), i.setMatrix("view", r), i.setMatrix("projection", this.defaultProjectionMatrix ?? this._scene.getProjectionMatrix()), this._isAnimationSheetEnabled && this.particleTexture) {
      const d = this.particleTexture.getBaseSize();
      i.setFloat3("particlesInfos", this.spriteCellWidth / d.width, this.spriteCellHeight / d.height, this.spriteCellWidth / d.width);
    }
    if (i.setVector2("translationPivot", this.translationPivot), i.setFloat4("textureMask", this.textureMask.r, this.textureMask.g, this.textureMask.b, this.textureMask.a), this._isBillboardBased && this._scene) {
      const d = this._scene.activeCamera;
      i.setVector3("eyePosition", d.globalPosition);
    }
    this._rampGradientsTexture && ((!this._rampGradients || !this._rampGradients.length) && (this._rampGradientsTexture.dispose(), this._rampGradientsTexture = null), i.setTexture("rampSampler", this._rampGradientsTexture));
    const a = i.defines;
    switch (this._scene && (ue(i, this, this._scene), this.applyFog && me(this._scene, void 0, i)), a.indexOf("#define BILLBOARDMODE_ALL") >= 0 && (r.invertToRef(g.Matrix[0]), i.setMatrix("invView", g.Matrix[0])), this._vertexArrayObject !== void 0 ? this._scene?.forceWireframe ? s.bindBuffers(this._vertexBuffers, this._linesIndexBufferUseInstancing, i) : (this._vertexArrayObject || (this._vertexArrayObject = this._engine.recordVertexArrayObject(this._vertexBuffers, null, i)), this._engine.bindVertexArrayObject(this._vertexArrayObject, this._scene?.forceWireframe ? this._linesIndexBufferUseInstancing : this._indexBuffer)) : this._indexBuffer ? s.bindBuffers(this._vertexBuffers, this._scene?.forceWireframe ? this._linesIndexBuffer : this._indexBuffer, i) : s.bindBuffers(this._vertexBuffers, this._scene?.forceWireframe ? this._linesIndexBufferUseInstancing : null, i), this.useLogarithmicDepth && this._scene && _e(a, i, this._scene), this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess && this._imageProcessingConfiguration.bind(i), e) {
      case y.BLENDMODE_ADD:
        s.setAlphaMode(1);
        break;
      case y.BLENDMODE_ONEONE:
        s.setAlphaMode(6);
        break;
      case y.BLENDMODE_STANDARD:
        s.setAlphaMode(2);
        break;
      case y.BLENDMODE_MULTIPLY:
        s.setAlphaMode(4);
        break;
    }
    return this._onBeforeDrawParticlesObservable && this._onBeforeDrawParticlesObservable.notifyObservers(i), this._useInstancing ? this._scene?.forceWireframe ? s.drawElementsType(6, 0, 10, this._particles.length) : s.drawArraysType(7, 0, 4, this._particles.length) : this._scene?.forceWireframe ? s.drawElementsType(1, 0, this._particles.length * 10) : s.drawElementsType(0, 0, this._particles.length * 6), this._particles.length;
  }
  /**
   * Renders the particle system in its current state.
   * @returns the current number of particles
   */
  render() {
    if (!this.isReady() || !this._particles.length)
      return 0;
    const e = this._engine;
    e.setState && (e.setState(!1), this.forceDepthWrite && e.setDepthWrite(!0));
    let t = 0;
    return this.blendMode === y.BLENDMODE_MULTIPLYADD ? t = this._render(y.BLENDMODE_MULTIPLY) + this._render(y.BLENDMODE_ADD) : t = this._render(this.blendMode), this._engine.unbindInstanceAttributes(), this._engine.setAlphaMode(0), t;
  }
  /** @internal */
  _onDispose(e = !1, t = !1) {
  }
  /**
   * Disposes the particle system and free the associated resources
   * @param disposeTexture defines if the particle texture must be disposed as well (true by default)
   * @param disposeAttachedSubEmitters defines if the attached sub-emitters must be disposed as well (false by default)
   * @param disposeEndSubEmitters defines if the end type sub-emitters must be disposed as well (false by default)
   */
  dispose(e = !0, t = !1, i = !1) {
    if (this.resetDrawCache(), this._vertexBuffer && (this._vertexBuffer.dispose(), this._vertexBuffer = null), this._spriteBuffer && (this._spriteBuffer.dispose(), this._spriteBuffer = null), this._indexBuffer && (this._engine._releaseBuffer(this._indexBuffer), this._indexBuffer = null), this._linesIndexBuffer && (this._engine._releaseBuffer(this._linesIndexBuffer), this._linesIndexBuffer = null), this._linesIndexBufferUseInstancing && (this._engine._releaseBuffer(this._linesIndexBufferUseInstancing), this._linesIndexBufferUseInstancing = null), this._vertexArrayObject && (this._engine.releaseVertexArrayObject(this._vertexArrayObject), this._vertexArrayObject = null), e && this.particleTexture && (this.particleTexture.dispose(), this.particleTexture = null), e && this.noiseTexture && (this.noiseTexture.dispose(), this.noiseTexture = null), this._rampGradientsTexture && (this._rampGradientsTexture.dispose(), this._rampGradientsTexture = null), this._onDispose(t, i), this._onBeforeDrawParticlesObservable && this._onBeforeDrawParticlesObservable.clear(), this._scene) {
      const s = this._scene.particleSystems.indexOf(this);
      s > -1 && this._scene.particleSystems.splice(s, 1), this._scene._activeParticleSystems.dispose();
    }
    this.onDisposeObservable.notifyObservers(this), this.onDisposeObservable.clear(), this.onStoppedObservable.clear(), this.reset();
  }
}
var P;
(function(C) {
  C[C.ATTACHED = 0] = "ATTACHED", C[C.END = 1] = "END";
})(P || (P = {}));
class w {
  /**
   * Creates a sub emitter
   * @param particleSystem the particle system to be used by the sub emitter
   */
  constructor(e) {
    if (this.particleSystem = e, this.type = P.END, this.inheritDirection = !1, this.inheritedVelocityAmount = 0, !e.emitter || !e.emitter.dispose) {
      const t = L("BABYLON.AbstractMesh");
      e.emitter = new t("SubemitterSystemEmitter", e.getScene()), e._disposeEmitterOnDispose = !0;
    }
  }
  /**
   * Clones the sub emitter
   * @returns the cloned sub emitter
   */
  clone() {
    let e = this.particleSystem.emitter;
    if (!e)
      e = new l();
    else if (e instanceof l)
      e = e.clone();
    else if (e.getClassName().indexOf("Mesh") !== -1) {
      const i = L("BABYLON.Mesh");
      e = new i("", e.getScene()), e.isVisible = !1;
    }
    const t = new w(this.particleSystem.clone(this.particleSystem.name, e));
    return t.particleSystem.name += "Clone", t.type = this.type, t.inheritDirection = this.inheritDirection, t.inheritedVelocityAmount = this.inheritedVelocityAmount, t.particleSystem._disposeEmitterOnDispose = !0, t.particleSystem.disposeOnStop = !0, t;
  }
  /**
   * Serialize current object to a JSON object
   * @param serializeTexture defines if the texture must be serialized as well
   * @returns the serialized object
   */
  serialize(e = !1) {
    const t = {};
    return t.type = this.type, t.inheritDirection = this.inheritDirection, t.inheritedVelocityAmount = this.inheritedVelocityAmount, t.particleSystem = this.particleSystem.serialize(e), t;
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static _ParseParticleSystem(e, t, i, s = !1) {
    throw he("ParseParticle");
  }
  /**
   * Creates a new SubEmitter from a serialized JSON version
   * @param serializationObject defines the JSON object to read from
   * @param sceneOrEngine defines the hosting scene or the hosting engine
   * @param rootUrl defines the rootUrl for data loading
   * @returns a new SubEmitter
   */
  static Parse(e, t, i) {
    const s = e.particleSystem, r = new w(w._ParseParticleSystem(s, t, i, !0));
    return r.type = e.type, r.inheritDirection = e.inheritDirection, r.inheritedVelocityAmount = e.inheritedVelocityAmount, r.particleSystem._isSubEmitter = !0, r;
  }
  /** Release associated resources */
  dispose() {
    this.particleSystem.dispose();
  }
}
class $ {
  /** Defines the mesh to use as source */
  get mesh() {
    return this._mesh;
  }
  set mesh(e) {
    this._mesh !== e && (this._mesh = e, e ? (this._indices = e.getIndices(), this._positions = e.getVerticesData(B.PositionKind), this._normals = e.getVerticesData(B.NormalKind)) : (this._indices = null, this._positions = null, this._normals = null));
  }
  /**
   * Creates a new instance MeshParticleEmitter
   * @param mesh defines the mesh to use as source
   */
  constructor(e = null) {
    this._indices = null, this._positions = null, this._normals = null, this._storedNormal = l.Zero(), this._mesh = null, this.direction1 = new l(0, 1, 0), this.direction2 = new l(0, 1, 0), this.useMeshNormalsForDirection = !0, this.mesh = e;
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   * @param particle is the particle we are computed the direction for
   * @param isLocal defines if the direction should be set in local space
   */
  startDirectionFunction(e, t, i, s) {
    if (this.useMeshNormalsForDirection && this._normals) {
      l.TransformNormalToRef(this._storedNormal, e, t);
      return;
    }
    const r = u.RandomRange(this.direction1.x, this.direction2.x), a = u.RandomRange(this.direction1.y, this.direction2.y), d = u.RandomRange(this.direction1.z, this.direction2.z);
    if (s) {
      t.copyFromFloats(r, a, d);
      return;
    }
    l.TransformNormalFromFloatsToRef(r, a, d, e, t);
  }
  /**
   * Called by the particle System when the position is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param positionToUpdate is the position vector to update with the result
   * @param particle is the particle we are computed the position for
   * @param isLocal defines if the position should be set in local space
   */
  startPositionFunction(e, t, i, s) {
    if (!this._indices || !this._positions)
      return;
    const r = 3 * Math.random() * (this._indices.length / 3) | 0, a = Math.random(), d = Math.random() * (1 - a), n = 1 - a - d, f = this._indices[r], m = this._indices[r + 1], _ = this._indices[r + 2], o = g.Vector3[0], p = g.Vector3[1], D = g.Vector3[2], x = g.Vector3[3];
    l.FromArrayToRef(this._positions, f * 3, o), l.FromArrayToRef(this._positions, m * 3, p), l.FromArrayToRef(this._positions, _ * 3, D), x.x = a * o.x + d * p.x + n * D.x, x.y = a * o.y + d * p.y + n * D.y, x.z = a * o.z + d * p.z + n * D.z, s ? t.copyFromFloats(x.x, x.y, x.z) : l.TransformCoordinatesFromFloatsToRef(x.x, x.y, x.z, e, t), this.useMeshNormalsForDirection && this._normals && (l.FromArrayToRef(this._normals, f * 3, o), l.FromArrayToRef(this._normals, m * 3, p), l.FromArrayToRef(this._normals, _ * 3, D), this._storedNormal.x = a * o.x + d * p.x + n * D.x, this._storedNormal.y = a * o.y + d * p.y + n * D.y, this._storedNormal.z = a * o.z + d * p.z + n * D.z);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new $(this.mesh);
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  applyToShader(e) {
    e.setVector3("direction1", this.direction1), e.setVector3("direction2", this.direction2);
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  buildUniformLayout(e) {
    e.addUniform("direction1", 3), e.addUniform("direction2", 3);
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    return "";
  }
  /**
   * Returns the string "BoxParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "MeshParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = {};
    return e.type = this.getClassName(), e.direction1 = this.direction1.asArray(), e.direction2 = this.direction2.asArray(), e.meshId = this.mesh?.id, e.useMeshNormalsForDirection = this.useMeshNormalsForDirection, e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   * @param scene defines the hosting scene
   */
  parse(e, t) {
    l.FromArrayToRef(e.direction1, 0, this.direction1), l.FromArrayToRef(e.direction2, 0, this.direction2), e.meshId && t && (this.mesh = t.getLastMeshById(e.meshId)), this.useMeshNormalsForDirection = e.useMeshNormalsForDirection;
  }
}
class J {
  /**
   * Creates a new instance CustomParticleEmitter
   */
  constructor() {
    this.particlePositionGenerator = () => {
    }, this.particleDestinationGenerator = () => {
    };
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   * @param particle is the particle we are computed the direction for
   * @param isLocal defines if the direction should be set in local space
   */
  startDirectionFunction(e, t, i, s) {
    const r = g.Vector3[0];
    if (this.particleDestinationGenerator) {
      this.particleDestinationGenerator(-1, i, r);
      const a = g.Vector3[1];
      r.subtractToRef(i.position, a), a.scaleToRef(1 / i.lifeTime, r);
    } else
      r.set(0, 0, 0);
    if (s) {
      t.copyFrom(r);
      return;
    }
    l.TransformNormalToRef(r, e, t);
  }
  /**
   * Called by the particle System when the position is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param positionToUpdate is the position vector to update with the result
   * @param particle is the particle we are computed the position for
   * @param isLocal defines if the position should be set in local space
   */
  startPositionFunction(e, t, i, s) {
    const r = g.Vector3[0];
    if (this.particlePositionGenerator ? this.particlePositionGenerator(-1, i, r) : r.set(0, 0, 0), s) {
      t.copyFrom(r);
      return;
    }
    l.TransformCoordinatesToRef(r, e, t);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new J();
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyToShader(e) {
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  buildUniformLayout(e) {
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    return "#define CUSTOMEMITTER";
  }
  /**
   * Returns the string "PointParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "CustomParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = {};
    return e.type = this.getClassName(), e.particlePositionGenerator = this.particlePositionGenerator, e.particleDestinationGenerator = this.particleDestinationGenerator, e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   */
  parse(e) {
    e.particlePositionGenerator && (this.particlePositionGenerator = e.particlePositionGenerator), e.particleDestinationGenerator && (this.particleDestinationGenerator = e.particleDestinationGenerator);
  }
}
class O {
  /**
   * Creates a new instance PointParticleEmitter
   */
  constructor() {
    this.direction1 = new l(0, 1, 0), this.direction2 = new l(0, 1, 0);
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   * @param particle is the particle we are computed the direction for
   * @param isLocal defines if the direction should be set in local space
   */
  startDirectionFunction(e, t, i, s) {
    const r = u.RandomRange(this.direction1.x, this.direction2.x), a = u.RandomRange(this.direction1.y, this.direction2.y), d = u.RandomRange(this.direction1.z, this.direction2.z);
    if (s) {
      t.copyFromFloats(r, a, d);
      return;
    }
    l.TransformNormalFromFloatsToRef(r, a, d, e, t);
  }
  /**
   * Called by the particle System when the position is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param positionToUpdate is the position vector to update with the result
   * @param particle is the particle we are computed the position for
   * @param isLocal defines if the position should be set in local space
   */
  startPositionFunction(e, t, i, s) {
    if (s) {
      t.copyFromFloats(0, 0, 0);
      return;
    }
    l.TransformCoordinatesFromFloatsToRef(0, 0, 0, e, t);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new O();
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  applyToShader(e) {
    e.setVector3("direction1", this.direction1), e.setVector3("direction2", this.direction2);
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  buildUniformLayout(e) {
    e.addUniform("direction1", 3), e.addUniform("direction2", 3);
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    return "#define POINTEMITTER";
  }
  /**
   * Returns the string "PointParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "PointParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = {};
    return e.type = this.getClassName(), e.direction1 = this.direction1.asArray(), e.direction2 = this.direction2.asArray(), e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   */
  parse(e) {
    l.FromArrayToRef(e.direction1, 0, this.direction1), l.FromArrayToRef(e.direction2, 0, this.direction2);
  }
}
class U {
  /**
   * Creates a new instance HemisphericParticleEmitter
   * @param radius the radius of the emission hemisphere (1 by default)
   * @param radiusRange the range of the emission hemisphere [0-1] 0 Surface only, 1 Entire Radius (1 by default)
   * @param directionRandomizer defines how much to randomize the particle direction [0-1]
   */
  constructor(e = 1, t = 1, i = 0) {
    this.radius = e, this.radiusRange = t, this.directionRandomizer = i;
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   * @param particle is the particle we are computed the direction for
   * @param isLocal defines if the direction should be set in local space
   */
  startDirectionFunction(e, t, i, s) {
    const r = i.position.subtract(e.getTranslation()).normalize(), a = u.RandomRange(0, this.directionRandomizer), d = u.RandomRange(0, this.directionRandomizer), n = u.RandomRange(0, this.directionRandomizer);
    if (r.x += a, r.y += d, r.z += n, r.normalize(), s) {
      t.copyFrom(r);
      return;
    }
    l.TransformNormalFromFloatsToRef(r.x, r.y, r.z, e, t);
  }
  /**
   * Called by the particle System when the position is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param positionToUpdate is the position vector to update with the result
   * @param particle is the particle we are computed the position for
   * @param isLocal defines if the position should be set in local space
   */
  startPositionFunction(e, t, i, s) {
    const r = this.radius - u.RandomRange(0, this.radius * this.radiusRange), a = u.RandomRange(0, 1), d = u.RandomRange(0, 2 * Math.PI), n = Math.acos(2 * a - 1), f = r * Math.cos(d) * Math.sin(n), m = r * Math.cos(n), _ = r * Math.sin(d) * Math.sin(n);
    if (s) {
      t.copyFromFloats(f, Math.abs(m), _);
      return;
    }
    l.TransformCoordinatesFromFloatsToRef(f, Math.abs(m), _, e, t);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new U(this.radius, this.directionRandomizer);
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  applyToShader(e) {
    e.setFloat("radius", this.radius), e.setFloat("radiusRange", this.radiusRange), e.setFloat("directionRandomizer", this.directionRandomizer);
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  buildUniformLayout(e) {
    e.addUniform("radius", 1), e.addUniform("radiusRange", 1), e.addUniform("directionRandomizer", 1);
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    return "#define HEMISPHERICEMITTER";
  }
  /**
   * Returns the string "HemisphericParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "HemisphericParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = {};
    return e.type = this.getClassName(), e.radius = this.radius, e.radiusRange = this.radiusRange, e.directionRandomizer = this.directionRandomizer, e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   */
  parse(e) {
    this.radius = e.radius, this.radiusRange = e.radiusRange, this.directionRandomizer = e.directionRandomizer;
  }
}
class b {
  /**
   * Creates a new instance SphereParticleEmitter
   * @param radius the radius of the emission sphere (1 by default)
   * @param radiusRange the range of the emission sphere [0-1] 0 Surface only, 1 Entire Radius (1 by default)
   * @param directionRandomizer defines how much to randomize the particle direction [0-1]
   */
  constructor(e = 1, t = 1, i = 0) {
    this.radius = e, this.radiusRange = t, this.directionRandomizer = i;
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   * @param particle is the particle we are computed the direction for
   * @param isLocal defines if the direction should be set in local space
   */
  startDirectionFunction(e, t, i, s) {
    const r = i.position.subtract(e.getTranslation()).normalize(), a = u.RandomRange(0, this.directionRandomizer), d = u.RandomRange(0, this.directionRandomizer), n = u.RandomRange(0, this.directionRandomizer);
    if (r.x += a, r.y += d, r.z += n, r.normalize(), s) {
      t.copyFrom(r);
      return;
    }
    l.TransformNormalFromFloatsToRef(r.x, r.y, r.z, e, t);
  }
  /**
   * Called by the particle System when the position is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param positionToUpdate is the position vector to update with the result
   * @param particle is the particle we are computed the position for
   * @param isLocal defines if the position should be set in local space
   */
  startPositionFunction(e, t, i, s) {
    const r = this.radius - u.RandomRange(0, this.radius * this.radiusRange), a = u.RandomRange(0, 1), d = u.RandomRange(0, 2 * Math.PI), n = Math.acos(2 * a - 1), f = r * Math.cos(d) * Math.sin(n), m = r * Math.cos(n), _ = r * Math.sin(d) * Math.sin(n);
    if (s) {
      t.copyFromFloats(f, m, _);
      return;
    }
    l.TransformCoordinatesFromFloatsToRef(f, m, _, e, t);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new b(this.radius, this.directionRandomizer);
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  applyToShader(e) {
    e.setFloat("radius", this.radius), e.setFloat("radiusRange", this.radiusRange), e.setFloat("directionRandomizer", this.directionRandomizer);
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  buildUniformLayout(e) {
    e.addUniform("radius", 1), e.addUniform("radiusRange", 1), e.addUniform("directionRandomizer", 1);
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    return "#define SPHEREEMITTER";
  }
  /**
   * Returns the string "SphereParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "SphereParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = {};
    return e.type = this.getClassName(), e.radius = this.radius, e.radiusRange = this.radiusRange, e.directionRandomizer = this.directionRandomizer, e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   */
  parse(e) {
    this.radius = e.radius, this.radiusRange = e.radiusRange, this.directionRandomizer = e.directionRandomizer;
  }
}
class Y extends b {
  /**
   * Creates a new instance SphereDirectedParticleEmitter
   * @param radius the radius of the emission sphere (1 by default)
   * @param direction1 the min limit of the emission direction (up vector by default)
   * @param direction2 the max limit of the emission direction (up vector by default)
   */
  constructor(e = 1, t = new l(0, 1, 0), i = new l(0, 1, 0)) {
    super(e), this.direction1 = t, this.direction2 = i;
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   */
  startDirectionFunction(e, t) {
    const i = u.RandomRange(this.direction1.x, this.direction2.x), s = u.RandomRange(this.direction1.y, this.direction2.y), r = u.RandomRange(this.direction1.z, this.direction2.z);
    l.TransformNormalFromFloatsToRef(i, s, r, e, t);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new Y(this.radius, this.direction1, this.direction2);
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  applyToShader(e) {
    e.setFloat("radius", this.radius), e.setFloat("radiusRange", this.radiusRange), e.setVector3("direction1", this.direction1), e.setVector3("direction2", this.direction2);
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  buildUniformLayout(e) {
    e.addUniform("radius", 1), e.addUniform("radiusRange", 1), e.addUniform("direction1", 3), e.addUniform("direction2", 3);
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    return `#define SPHEREEMITTER
#define DIRECTEDSPHEREEMITTER`;
  }
  /**
   * Returns the string "SphereDirectedParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "SphereDirectedParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = super.serialize();
    return e.direction1 = this.direction1.asArray(), e.direction2 = this.direction2.asArray(), e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   */
  parse(e) {
    super.parse(e), this.direction1.copyFrom(e.direction1), this.direction2.copyFrom(e.direction2);
  }
}
class N {
  /**
   * Creates a new instance CylinderParticleEmitter
   * @param radius the radius of the emission cylinder (1 by default)
   * @param height the height of the emission cylinder (1 by default)
   * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
   * @param directionRandomizer defines how much to randomize the particle direction [0-1]
   */
  constructor(e = 1, t = 1, i = 1, s = 0) {
    this.radius = e, this.height = t, this.radiusRange = i, this.directionRandomizer = s, this._tempVector = l.Zero();
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   * @param particle is the particle we are computed the direction for
   * @param isLocal defines if the direction should be set in local space
   * @param inverseWorldMatrix defines the inverted world matrix to use if isLocal is false
   */
  startDirectionFunction(e, t, i, s, r) {
    i.position.subtractToRef(e.getTranslation(), this._tempVector), this._tempVector.normalize(), l.TransformNormalToRef(this._tempVector, r, this._tempVector);
    const a = u.RandomRange(-this.directionRandomizer / 2, this.directionRandomizer / 2);
    let d = Math.atan2(this._tempVector.x, this._tempVector.z);
    if (d += u.RandomRange(-Math.PI / 2, Math.PI / 2) * this.directionRandomizer, this._tempVector.y = a, this._tempVector.x = Math.sin(d), this._tempVector.z = Math.cos(d), this._tempVector.normalize(), s) {
      t.copyFrom(this._tempVector);
      return;
    }
    l.TransformNormalFromFloatsToRef(this._tempVector.x, this._tempVector.y, this._tempVector.z, e, t);
  }
  /**
   * Called by the particle System when the position is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param positionToUpdate is the position vector to update with the result
   * @param particle is the particle we are computed the position for
   * @param isLocal defines if the position should be set in local space
   */
  startPositionFunction(e, t, i, s) {
    const r = u.RandomRange(-this.height / 2, this.height / 2), a = u.RandomRange(0, 2 * Math.PI), d = u.RandomRange((1 - this.radiusRange) * (1 - this.radiusRange), 1), n = Math.sqrt(d) * this.radius, f = n * Math.cos(a), m = n * Math.sin(a);
    if (s) {
      t.copyFromFloats(f, r, m);
      return;
    }
    l.TransformCoordinatesFromFloatsToRef(f, r, m, e, t);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new N(this.radius, this.directionRandomizer);
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  applyToShader(e) {
    e.setFloat("radius", this.radius), e.setFloat("height", this.height), e.setFloat("radiusRange", this.radiusRange), e.setFloat("directionRandomizer", this.directionRandomizer);
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  buildUniformLayout(e) {
    e.addUniform("radius", 1), e.addUniform("height", 1), e.addUniform("radiusRange", 1), e.addUniform("directionRandomizer", 1);
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    return "#define CYLINDEREMITTER";
  }
  /**
   * Returns the string "CylinderParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "CylinderParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = {};
    return e.type = this.getClassName(), e.radius = this.radius, e.height = this.height, e.radiusRange = this.radiusRange, e.directionRandomizer = this.directionRandomizer, e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   */
  parse(e) {
    this.radius = e.radius, this.height = e.height, this.radiusRange = e.radiusRange, this.directionRandomizer = e.directionRandomizer;
  }
}
class H extends N {
  /**
   * Creates a new instance CylinderDirectedParticleEmitter
   * @param radius the radius of the emission cylinder (1 by default)
   * @param height the height of the emission cylinder (1 by default)
   * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
   * @param direction1 the min limit of the emission direction (up vector by default)
   * @param direction2 the max limit of the emission direction (up vector by default)
   */
  constructor(e = 1, t = 1, i = 1, s = new l(0, 1, 0), r = new l(0, 1, 0)) {
    super(e, t, i), this.direction1 = s, this.direction2 = r;
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   * @param _particle is the particle we are computed the direction for
   * @param isLocal defines if the direction should be set in local space
   */
  startDirectionFunction(e, t, i, s) {
    const r = u.RandomRange(this.direction1.x, this.direction2.x), a = u.RandomRange(this.direction1.y, this.direction2.y), d = u.RandomRange(this.direction1.z, this.direction2.z);
    if (s) {
      t.copyFromFloats(r, a, d);
      return;
    }
    l.TransformNormalFromFloatsToRef(r, a, d, e, t);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new H(this.radius, this.height, this.radiusRange, this.direction1, this.direction2);
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  applyToShader(e) {
    e.setFloat("radius", this.radius), e.setFloat("height", this.height), e.setFloat("radiusRange", this.radiusRange), e.setVector3("direction1", this.direction1), e.setVector3("direction2", this.direction2);
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  buildUniformLayout(e) {
    e.addUniform("radius", 1), e.addUniform("height", 1), e.addUniform("radiusRange", 1), e.addUniform("direction1", 3), e.addUniform("direction2", 3);
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    return `#define CYLINDEREMITTER
#define DIRECTEDCYLINDEREMITTER`;
  }
  /**
   * Returns the string "CylinderDirectedParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "CylinderDirectedParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = super.serialize();
    return e.direction1 = this.direction1.asArray(), e.direction2 = this.direction2.asArray(), e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   */
  parse(e) {
    super.parse(e), this.direction1.copyFrom(e.direction1), this.direction2.copyFrom(e.direction2);
  }
}
class k {
  /**
   * Gets or sets the radius of the emission cone
   */
  get radius() {
    return this._radius;
  }
  set radius(e) {
    this._radius = e, this._buildHeight();
  }
  /**
   * Gets or sets the angle of the emission cone
   */
  get angle() {
    return this._angle;
  }
  set angle(e) {
    this._angle = e, this._buildHeight();
  }
  _buildHeight() {
    this._angle !== 0 ? this._height = this._radius / Math.tan(this._angle / 2) : this._height = 1;
  }
  /**
   * Creates a new instance ConeParticleEmitter
   * @param radius the radius of the emission cone (1 by default)
   * @param angle the cone base angle (PI by default)
   * @param directionRandomizer defines how much to randomize the particle direction [0-1] (default is 0)
   */
  constructor(e = 1, t = Math.PI, i = 0) {
    this.directionRandomizer = i, this.radiusRange = 1, this.heightRange = 1, this.emitFromSpawnPointOnly = !1, this.angle = t, this.radius = e;
  }
  /**
   * Called by the particle System when the direction is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param directionToUpdate is the direction vector to update with the result
   * @param particle is the particle we are computed the direction for
   * @param isLocal defines if the direction should be set in local space
   */
  startDirectionFunction(e, t, i, s) {
    s ? g.Vector3[0].copyFrom(i._localPosition).normalize() : i.position.subtractToRef(e.getTranslation(), g.Vector3[0]).normalize();
    const r = u.RandomRange(0, this.directionRandomizer), a = u.RandomRange(0, this.directionRandomizer), d = u.RandomRange(0, this.directionRandomizer);
    t.x = g.Vector3[0].x + r, t.y = g.Vector3[0].y + a, t.z = g.Vector3[0].z + d, t.normalize();
  }
  /**
   * Called by the particle System when the position is computed for the created particle.
   * @param worldMatrix is the world matrix of the particle system
   * @param positionToUpdate is the position vector to update with the result
   * @param particle is the particle we are computed the position for
   * @param isLocal defines if the position should be set in local space
   */
  startPositionFunction(e, t, i, s) {
    const r = u.RandomRange(0, Math.PI * 2);
    let a;
    this.emitFromSpawnPointOnly ? a = 1e-4 : (a = u.RandomRange(0, this.heightRange), a = 1 - a * a);
    let d = this._radius - u.RandomRange(0, this._radius * this.radiusRange);
    d = d * a;
    const n = d * Math.sin(r), f = d * Math.cos(r), m = a * this._height;
    if (s) {
      t.x = n, t.y = m, t.z = f;
      return;
    }
    l.TransformCoordinatesFromFloatsToRef(n, m, f, e, t);
  }
  /**
   * Clones the current emitter and returns a copy of it
   * @returns the new emitter
   */
  clone() {
    const e = new k(this._radius, this._angle, this.directionRandomizer);
    return I.DeepCopy(this, e), e;
  }
  /**
   * Called by the GPUParticleSystem to setup the update shader
   * @param uboOrEffect defines the update shader
   */
  applyToShader(e) {
    e.setFloat2("radius", this._radius, this.radiusRange), e.setFloat("coneAngle", this._angle), e.setFloat2("height", this._height, this.heightRange), e.setFloat("directionRandomizer", this.directionRandomizer);
  }
  /**
   * Creates the structure of the ubo for this particle emitter
   * @param ubo ubo to create the structure for
   */
  buildUniformLayout(e) {
    e.addUniform("radius", 2), e.addUniform("coneAngle", 1), e.addUniform("height", 2), e.addUniform("directionRandomizer", 1);
  }
  /**
   * Returns a string to use to update the GPU particles update shader
   * @returns a string containing the defines string
   */
  getEffectDefines() {
    let e = "#define CONEEMITTER";
    return this.emitFromSpawnPointOnly && (e += `
#define CONEEMITTERSPAWNPOINT`), e;
  }
  /**
   * Returns the string "ConeParticleEmitter"
   * @returns a string containing the class name
   */
  getClassName() {
    return "ConeParticleEmitter";
  }
  /**
   * Serializes the particle system to a JSON object.
   * @returns the JSON object
   */
  serialize() {
    const e = {};
    return e.type = this.getClassName(), e.radius = this._radius, e.angle = this._angle, e.directionRandomizer = this.directionRandomizer, e.radiusRange = this.radiusRange, e.heightRange = this.heightRange, e.emitFromSpawnPointOnly = this.emitFromSpawnPointOnly, e;
  }
  /**
   * Parse properties from a JSON object
   * @param serializationObject defines the JSON object
   */
  parse(e) {
    this.radius = e.radius, this.angle = e.angle, this.directionRandomizer = e.directionRandomizer, this.radiusRange = e.radiusRange !== void 0 ? e.radiusRange : 1, this.heightRange = e.radiusRange !== void 0 ? e.heightRange : 1, this.emitFromSpawnPointOnly = e.emitFromSpawnPointOnly !== void 0 ? e.emitFromSpawnPointOnly : !1;
  }
}
function Ee(C, e) {
  const t = new O();
  return t.direction1 = C, t.direction2 = e, t;
}
function ve(C = 1, e = 1) {
  return new U(C, e);
}
function Te(C = 1, e = 1) {
  return new b(C, e);
}
function Ae(C = 1, e = new l(0, 1, 0), t = new l(0, 1, 0)) {
  return new Y(C, e, t);
}
function Se(C = 1, e = 1, t = 1, i = 0) {
  return new N(C, e, t, i);
}
function ye(C = 1, e = 1, t = 1, i = new l(0, 1, 0), s = new l(0, 1, 0)) {
  return new H(C, e, t, i, s);
}
function Fe(C = 1, e = Math.PI / 4) {
  return new k(C, e);
}
class F extends W {
  constructor() {
    super(...arguments), this._disposeEmitterOnDispose = !1, this._emitFromParticle = (e) => {
      if (!this._subEmitters || this._subEmitters.length === 0)
        return;
      const t = Math.floor(Math.random() * this._subEmitters.length);
      this._subEmitters[t].forEach((i) => {
        if (i.type === P.END) {
          const s = i.clone();
          e._inheritParticleInfoToSubEmitter(s), s.particleSystem._rootParticleSystem = this, this.activeSubSystems.push(s.particleSystem), s.particleSystem.start();
        }
      });
    };
  }
  /**
   * Creates a Point Emitter for the particle system (emits directly from the emitter position)
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
   * @returns the emitter
   */
  createPointEmitter(e, t) {
    const i = Ee(e, t);
    return this.particleEmitterType = i, i;
  }
  /**
   * Creates a Hemisphere Emitter for the particle system (emits along the hemisphere radius)
   * @param radius The radius of the hemisphere to emit from
   * @param radiusRange The range of the hemisphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
   * @returns the emitter
   */
  createHemisphericEmitter(e = 1, t = 1) {
    const i = ve(e, t);
    return this.particleEmitterType = i, i;
  }
  /**
   * Creates a Sphere Emitter for the particle system (emits along the sphere radius)
   * @param radius The radius of the sphere to emit from
   * @param radiusRange The range of the sphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
   * @returns the emitter
   */
  createSphereEmitter(e = 1, t = 1) {
    const i = Te(e, t);
    return this.particleEmitterType = i, i;
  }
  /**
   * Creates a Directed Sphere Emitter for the particle system (emits between direction1 and direction2)
   * @param radius The radius of the sphere to emit from
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the sphere
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the sphere
   * @returns the emitter
   */
  createDirectedSphereEmitter(e = 1, t = new l(0, 1, 0), i = new l(0, 1, 0)) {
    const s = Ae(e, t, i);
    return this.particleEmitterType = s, s;
  }
  /**
   * Creates a Cylinder Emitter for the particle system (emits from the cylinder to the particle position)
   * @param radius The radius of the emission cylinder
   * @param height The height of the emission cylinder
   * @param radiusRange The range of emission [0-1] 0 Surface only, 1 Entire Radius
   * @param directionRandomizer How much to randomize the particle direction [0-1]
   * @returns the emitter
   */
  createCylinderEmitter(e = 1, t = 1, i = 1, s = 0) {
    const r = Se(e, t, i, s);
    return this.particleEmitterType = r, r;
  }
  /**
   * Creates a Directed Cylinder Emitter for the particle system (emits between direction1 and direction2)
   * @param radius The radius of the cylinder to emit from
   * @param height The height of the emission cylinder
   * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the cylinder
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the cylinder
   * @returns the emitter
   */
  createDirectedCylinderEmitter(e = 1, t = 1, i = 1, s = new l(0, 1, 0), r = new l(0, 1, 0)) {
    const a = ye(e, t, i, s, r);
    return this.particleEmitterType = a, a;
  }
  /**
   * Creates a Cone Emitter for the particle system (emits from the cone to the particle position)
   * @param radius The radius of the cone to emit from
   * @param angle The base angle of the cone
   * @returns the emitter
   */
  createConeEmitter(e = 1, t = Math.PI / 4) {
    const i = Fe(e, t);
    return this.particleEmitterType = i, i;
  }
  /**
   * Creates a Box Emitter for the particle system. (emits between direction1 and direction2 from withing the box defined by minEmitBox and maxEmitBox)
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
   * @param minEmitBox Particles are emitted from the box between minEmitBox and maxEmitBox
   * @param maxEmitBox  Particles are emitted from the box between minEmitBox and maxEmitBox
   * @returns the emitter
   */
  createBoxEmitter(e, t, i, s) {
    const r = new M();
    return this.particleEmitterType = r, this.direction1 = e, this.direction2 = t, this.minEmitBox = i, this.maxEmitBox = s, r;
  }
  _prepareSubEmitterInternalArray() {
    this._subEmitters = new Array(), this.subEmitters && this.subEmitters.forEach((e) => {
      e instanceof F ? this._subEmitters.push([new w(e)]) : e instanceof w ? this._subEmitters.push([e]) : e instanceof Array && this._subEmitters.push(e);
    });
  }
  _stopSubEmitters() {
    this.activeSubSystems && (this.activeSubSystems.forEach((e) => {
      e.stop(!0);
    }), this.activeSubSystems = []);
  }
  _removeFromRoot() {
    if (!this._rootParticleSystem)
      return;
    const e = this._rootParticleSystem.activeSubSystems.indexOf(this);
    e !== -1 && this._rootParticleSystem.activeSubSystems.splice(e, 1), this._rootParticleSystem = null;
  }
  _preStart() {
    this._prepareSubEmitterInternalArray(), this._subEmitters && this._subEmitters.length != 0 && (this.activeSubSystems = []);
  }
  _postStop(e) {
    e && this._stopSubEmitters();
  }
  _prepareParticle(e) {
    if (this._subEmitters && this._subEmitters.length > 0) {
      const t = this._subEmitters[Math.floor(Math.random() * this._subEmitters.length)];
      e._attachedSubEmitters = [], t.forEach((i) => {
        if (i.type === P.ATTACHED) {
          const s = i.clone();
          e._attachedSubEmitters.push(s), s.particleSystem.start();
        }
      });
    }
  }
  /** @internal */
  _onDispose(e = !1, t = !1) {
    if (this._removeFromRoot(), this.subEmitters && !this._subEmitters && this._prepareSubEmitterInternalArray(), e && this.particles?.forEach((i) => {
      if (i._attachedSubEmitters)
        for (let s = i._attachedSubEmitters.length - 1; s >= 0; s -= 1)
          i._attachedSubEmitters[s].dispose();
    }), t && this.activeSubSystems)
      for (let i = this.activeSubSystems.length - 1; i >= 0; i -= 1)
        this.activeSubSystems[i].dispose();
    if (this._subEmitters && this._subEmitters.length) {
      for (let i = 0; i < this._subEmitters.length; i++)
        for (const s of this._subEmitters[i])
          s.dispose();
      this._subEmitters = [], this.subEmitters = [];
    }
    this._disposeEmitterOnDispose && this.emitter && this.emitter.dispose && this.emitter.dispose(!0);
  }
  /**
   * @internal
   */
  static _Parse(e, t, i, s) {
    let r;
    i instanceof j ? r = null : r = i;
    const a = L("BABYLON.Texture");
    if (a && r && (e.texture ? t.particleTexture = a.Parse(e.texture, r, s) : e.textureName && (t.particleTexture = new a(s + e.textureName, r, !1, e.invertY !== void 0 ? e.invertY : !0), t.particleTexture.name = e.textureName)), !e.emitterId && e.emitterId !== 0 && e.emitter === void 0 ? t.emitter = l.Zero() : e.emitterId && r ? t.emitter = r.getLastMeshById(e.emitterId) : t.emitter = l.FromArray(e.emitter), t.isLocal = !!e.isLocal, e.renderingGroupId !== void 0 && (t.renderingGroupId = e.renderingGroupId), e.isBillboardBased !== void 0 && (t.isBillboardBased = e.isBillboardBased), e.billboardMode !== void 0 && (t.billboardMode = e.billboardMode), e.useLogarithmicDepth !== void 0 && (t.useLogarithmicDepth = e.useLogarithmicDepth), e.animations) {
      for (let n = 0; n < e.animations.length; n++) {
        const f = e.animations[n], m = L("BABYLON.Animation");
        m && t.animations.push(m.Parse(f));
      }
      t.beginAnimationOnStart = e.beginAnimationOnStart, t.beginAnimationFrom = e.beginAnimationFrom, t.beginAnimationTo = e.beginAnimationTo, t.beginAnimationLoop = e.beginAnimationLoop;
    }
    if (e.autoAnimate && r && r.beginAnimation(t, e.autoAnimateFrom, e.autoAnimateTo, e.autoAnimateLoop, e.autoAnimateSpeed || 1), t.startDelay = e.startDelay | 0, t.minAngularSpeed = e.minAngularSpeed, t.maxAngularSpeed = e.maxAngularSpeed, t.minSize = e.minSize, t.maxSize = e.maxSize, e.minScaleX && (t.minScaleX = e.minScaleX, t.maxScaleX = e.maxScaleX, t.minScaleY = e.minScaleY, t.maxScaleY = e.maxScaleY), e.preWarmCycles !== void 0 && (t.preWarmCycles = e.preWarmCycles, t.preWarmStepOffset = e.preWarmStepOffset), e.minInitialRotation !== void 0 && (t.minInitialRotation = e.minInitialRotation, t.maxInitialRotation = e.maxInitialRotation), t.minLifeTime = e.minLifeTime, t.maxLifeTime = e.maxLifeTime, t.minEmitPower = e.minEmitPower, t.maxEmitPower = e.maxEmitPower, t.emitRate = e.emitRate, t.gravity = l.FromArray(e.gravity), e.noiseStrength && (t.noiseStrength = l.FromArray(e.noiseStrength)), t.color1 = v.FromArray(e.color1), t.color2 = v.FromArray(e.color2), t.colorDead = v.FromArray(e.colorDead), t.updateSpeed = e.updateSpeed, t.targetStopDuration = e.targetStopDuration, t.blendMode = e.blendMode, e.colorGradients)
      for (const n of e.colorGradients)
        t.addColorGradient(n.gradient, v.FromArray(n.color1), n.color2 ? v.FromArray(n.color2) : void 0);
    if (e.rampGradients) {
      for (const n of e.rampGradients)
        t.addRampGradient(n.gradient, ie.FromArray(n.color));
      t.useRampGradients = e.useRampGradients;
    }
    if (e.colorRemapGradients)
      for (const n of e.colorRemapGradients)
        t.addColorRemapGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
    if (e.alphaRemapGradients)
      for (const n of e.alphaRemapGradients)
        t.addAlphaRemapGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
    if (e.sizeGradients)
      for (const n of e.sizeGradients)
        t.addSizeGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
    if (e.angularSpeedGradients)
      for (const n of e.angularSpeedGradients)
        t.addAngularSpeedGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
    if (e.velocityGradients)
      for (const n of e.velocityGradients)
        t.addVelocityGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
    if (e.dragGradients)
      for (const n of e.dragGradients)
        t.addDragGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
    if (e.emitRateGradients)
      for (const n of e.emitRateGradients)
        t.addEmitRateGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
    if (e.startSizeGradients)
      for (const n of e.startSizeGradients)
        t.addStartSizeGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
    if (e.lifeTimeGradients)
      for (const n of e.lifeTimeGradients)
        t.addLifeTimeGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
    if (e.limitVelocityGradients) {
      for (const n of e.limitVelocityGradients)
        t.addLimitVelocityGradient(n.gradient, n.factor1 !== void 0 ? n.factor1 : n.factor, n.factor2);
      t.limitVelocityDamping = e.limitVelocityDamping;
    }
    if (e.noiseTexture && r) {
      const n = L("BABYLON.ProceduralTexture");
      t.noiseTexture = n.Parse(e.noiseTexture, r, s);
    }
    let d;
    if (e.particleEmitterType) {
      switch (e.particleEmitterType.type) {
        case "SphereParticleEmitter":
          d = new b();
          break;
        case "SphereDirectedParticleEmitter":
          d = new Y();
          break;
        case "ConeEmitter":
        case "ConeParticleEmitter":
          d = new k();
          break;
        case "CylinderParticleEmitter":
          d = new N();
          break;
        case "CylinderDirectedParticleEmitter":
          d = new H();
          break;
        case "HemisphericParticleEmitter":
          d = new U();
          break;
        case "PointParticleEmitter":
          d = new O();
          break;
        case "MeshParticleEmitter":
          d = new $();
          break;
        case "CustomParticleEmitter":
          d = new J();
          break;
        case "BoxEmitter":
        case "BoxParticleEmitter":
        default:
          d = new M();
          break;
      }
      d.parse(e.particleEmitterType, r);
    } else
      d = new M(), d.parse(e, r);
    t.particleEmitterType = d, t.startSpriteCellID = e.startSpriteCellID, t.endSpriteCellID = e.endSpriteCellID, t.spriteCellLoop = e.spriteCellLoop ?? !0, t.spriteCellWidth = e.spriteCellWidth, t.spriteCellHeight = e.spriteCellHeight, t.spriteCellChangeSpeed = e.spriteCellChangeSpeed, t.spriteRandomStartCell = e.spriteRandomStartCell, t.disposeOnStop = e.disposeOnStop ?? !1, t.manualEmitCount = e.manualEmitCount ?? -1;
  }
  /**
   * Parses a JSON object to create a particle system.
   * @param parsedParticleSystem The JSON object to parse
   * @param sceneOrEngine The scene or the engine to create the particle system in
   * @param rootUrl The root url to use to load external dependencies like texture
   * @param doNotStart Ignore the preventAutoStart attribute and does not start
   * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
   * @returns the Parsed particle system
   */
  static Parse(e, t, i, s = !1, r) {
    const a = e.name;
    let d = null, n = null, f, m;
    if (t instanceof j ? f = t : (m = t, f = m.getEngine()), e.customShader && f.createEffectForParticles) {
      n = e.customShader;
      const o = n.shaderOptions.defines.length > 0 ? n.shaderOptions.defines.join(`
`) : "";
      d = f.createEffectForParticles(n.shaderPath.fragmentElement, n.shaderOptions.uniforms, n.shaderOptions.samplers, o);
    }
    const _ = new F(a, r || e.capacity, t, d, e.isAnimationSheetEnabled);
    if (_.customShader = n, _._rootUrl = i, e.id && (_.id = e.id), e.subEmitters) {
      _.subEmitters = [];
      for (const o of e.subEmitters) {
        const p = [];
        for (const D of o)
          p.push(w.Parse(D, t, i));
        _.subEmitters.push(p);
      }
    }
    return F._Parse(e, _, t, i), e.textureMask && (_.textureMask = v.FromArray(e.textureMask)), e.worldOffset && (_.worldOffset = l.FromArray(e.worldOffset)), e.preventAutoStart && (_.preventAutoStart = e.preventAutoStart), !s && !_.preventAutoStart && _.start(), _;
  }
  /**
   * Serializes the particle system to a JSON object
   * @param serializeTexture defines if the texture must be serialized as well
   * @returns the JSON object
   */
  serialize(e = !1) {
    const t = {};
    if (F._Serialize(t, this, e), t.textureMask = this.textureMask.asArray(), t.customShader = this.customShader, t.preventAutoStart = this.preventAutoStart, t.worldOffset = this.worldOffset.asArray(), this.subEmitters) {
      t.subEmitters = [], this._subEmitters || this._prepareSubEmitterInternalArray();
      for (const i of this._subEmitters) {
        const s = [];
        for (const r of i)
          s.push(r.serialize(e));
        t.subEmitters.push(s);
      }
    }
    return t;
  }
  /**
   * @internal
   */
  static _Serialize(e, t, i) {
    if (e.name = t.name, e.id = t.id, e.capacity = t.getCapacity(), e.disposeOnStop = t.disposeOnStop, e.manualEmitCount = t.manualEmitCount, t.emitter.position) {
      const c = t.emitter;
      e.emitterId = c.id;
    } else {
      const c = t.emitter;
      e.emitter = c.asArray();
    }
    t.particleEmitterType && (e.particleEmitterType = t.particleEmitterType.serialize()), t.particleTexture && (i ? e.texture = t.particleTexture.serialize() : (e.textureName = t.particleTexture.name, e.invertY = !!t.particleTexture._invertY)), e.isLocal = t.isLocal, xe.AppendSerializedAnimations(t, e), e.beginAnimationOnStart = t.beginAnimationOnStart, e.beginAnimationFrom = t.beginAnimationFrom, e.beginAnimationTo = t.beginAnimationTo, e.beginAnimationLoop = t.beginAnimationLoop, e.startDelay = t.startDelay, e.renderingGroupId = t.renderingGroupId, e.isBillboardBased = t.isBillboardBased, e.billboardMode = t.billboardMode, e.minAngularSpeed = t.minAngularSpeed, e.maxAngularSpeed = t.maxAngularSpeed, e.minSize = t.minSize, e.maxSize = t.maxSize, e.minScaleX = t.minScaleX, e.maxScaleX = t.maxScaleX, e.minScaleY = t.minScaleY, e.maxScaleY = t.maxScaleY, e.minEmitPower = t.minEmitPower, e.maxEmitPower = t.maxEmitPower, e.minLifeTime = t.minLifeTime, e.maxLifeTime = t.maxLifeTime, e.emitRate = t.emitRate, e.gravity = t.gravity.asArray(), e.noiseStrength = t.noiseStrength.asArray(), e.color1 = t.color1.asArray(), e.color2 = t.color2.asArray(), e.colorDead = t.colorDead.asArray(), e.updateSpeed = t.updateSpeed, e.targetStopDuration = t.targetStopDuration, e.blendMode = t.blendMode, e.preWarmCycles = t.preWarmCycles, e.preWarmStepOffset = t.preWarmStepOffset, e.minInitialRotation = t.minInitialRotation, e.maxInitialRotation = t.maxInitialRotation, e.startSpriteCellID = t.startSpriteCellID, e.spriteCellLoop = t.spriteCellLoop, e.endSpriteCellID = t.endSpriteCellID, e.spriteCellChangeSpeed = t.spriteCellChangeSpeed, e.spriteCellWidth = t.spriteCellWidth, e.spriteCellHeight = t.spriteCellHeight, e.spriteRandomStartCell = t.spriteRandomStartCell, e.isAnimationSheetEnabled = t.isAnimationSheetEnabled, e.useLogarithmicDepth = t.useLogarithmicDepth;
    const s = t.getColorGradients();
    if (s) {
      e.colorGradients = [];
      for (const c of s) {
        const h = {
          gradient: c.gradient,
          color1: c.color1.asArray()
        };
        c.color2 ? h.color2 = c.color2.asArray() : h.color2 = c.color1.asArray(), e.colorGradients.push(h);
      }
    }
    const r = t.getRampGradients();
    if (r) {
      e.rampGradients = [];
      for (const c of r) {
        const h = {
          gradient: c.gradient,
          color: c.color.asArray()
        };
        e.rampGradients.push(h);
      }
      e.useRampGradients = t.useRampGradients;
    }
    const a = t.getColorRemapGradients();
    if (a) {
      e.colorRemapGradients = [];
      for (const c of a) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.colorRemapGradients.push(h);
      }
    }
    const d = t.getAlphaRemapGradients();
    if (d) {
      e.alphaRemapGradients = [];
      for (const c of d) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.alphaRemapGradients.push(h);
      }
    }
    const n = t.getSizeGradients();
    if (n) {
      e.sizeGradients = [];
      for (const c of n) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.sizeGradients.push(h);
      }
    }
    const f = t.getAngularSpeedGradients();
    if (f) {
      e.angularSpeedGradients = [];
      for (const c of f) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.angularSpeedGradients.push(h);
      }
    }
    const m = t.getVelocityGradients();
    if (m) {
      e.velocityGradients = [];
      for (const c of m) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.velocityGradients.push(h);
      }
    }
    const _ = t.getDragGradients();
    if (_) {
      e.dragGradients = [];
      for (const c of _) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.dragGradients.push(h);
      }
    }
    const o = t.getEmitRateGradients();
    if (o) {
      e.emitRateGradients = [];
      for (const c of o) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.emitRateGradients.push(h);
      }
    }
    const p = t.getStartSizeGradients();
    if (p) {
      e.startSizeGradients = [];
      for (const c of p) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.startSizeGradients.push(h);
      }
    }
    const D = t.getLifeTimeGradients();
    if (D) {
      e.lifeTimeGradients = [];
      for (const c of D) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.lifeTimeGradients.push(h);
      }
    }
    const x = t.getLimitVelocityGradients();
    if (x) {
      e.limitVelocityGradients = [];
      for (const c of x) {
        const h = {
          gradient: c.gradient,
          factor1: c.factor1
        };
        c.factor2 !== void 0 ? h.factor2 = c.factor2 : h.factor2 = c.factor1, e.limitVelocityGradients.push(h);
      }
      e.limitVelocityDamping = t.limitVelocityDamping;
    }
    t.noiseTexture && (e.noiseTexture = t.noiseTexture.serialize());
  }
  // Clone
  /**
   * Clones the particle system.
   * @param name The name of the cloned object
   * @param newEmitter The new emitter to use
   * @param cloneTexture Also clone the textures if true
   * @returns the cloned particle system
   */
  clone(e, t, i = !1) {
    const s = { ...this._customWrappers };
    let r = null;
    const a = this._engine;
    if (a.createEffectForParticles && this.customShader != null) {
      r = this.customShader;
      const f = r.shaderOptions.defines.length > 0 ? r.shaderOptions.defines.join(`
`) : "", m = a.createEffectForParticles(r.shaderPath.fragmentElement, r.shaderOptions.uniforms, r.shaderOptions.samplers, f);
      s[0] ? s[0].effect = m : this.setCustomEffect(m, 0);
    }
    const d = this.serialize(i), n = F.Parse(d, this._scene || this._engine, this._rootUrl);
    return n.name = e, n.customShader = r, n._customWrappers = s, t === void 0 && (t = this.emitter), this.noiseTexture && (n.noiseTexture = this.noiseTexture.clone()), n.emitter = t, this.preventAutoStart || n.start(), n;
  }
}
F.BILLBOARDMODE_Y = 2;
F.BILLBOARDMODE_ALL = 7;
F.BILLBOARDMODE_STRETCHED = 8;
F.BILLBOARDMODE_STRETCHED_LOCAL = 9;
w._ParseParticleSystem = F.Parse;
const Ye = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ParticleSystem: F
}, Symbol.toStringTag, { value: "Module" }));
export {
  M as B,
  Ee as C,
  U as H,
  $ as M,
  F as P,
  Y as S,
  ve as a,
  Te as b,
  Ae as c,
  Se as d,
  ye as e,
  Fe as f,
  J as g,
  k as h,
  H as i,
  N as j,
  V as k,
  O as l,
  b as m,
  w as n,
  P as o,
  Ye as p
};
//# sourceMappingURL=particleSystem-BMgQXCJ4.js.map
