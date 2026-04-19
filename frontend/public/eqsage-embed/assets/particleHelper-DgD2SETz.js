import { x as D, d as g, a as x, a5 as C, O as P, M as T, G as S, i as y, H as B, V as E, w as z, p as R, C as G, Y as M, h as F, T as N, W as b } from "./embed-entry-Dediijbe.js";
import { T as V } from "./texture-BSW_lwWZ.js";
import { ColorGradient as W, FactorGradient as U, GradientHelper as L } from "./gradients-D0HA8SqJ.js";
import { B as k } from "./baseParticleSystem-CDLSdWxI.js";
import { C as H, a as Y, b as j, c as q, d as $, e as K, f as J, B as w, P as d, g as A } from "./particleSystem-Bnn7FRy8.js";
import { a as X, I } from "./scene-DFGy8rST.js";
import { R as v } from "./rawTexture-Q37pGkXT.js";
import { b as Z, p as Q, d as ee, f as te, e as ie } from "./materialHelper.functions-mmQKTRFK.js";
import { E as m } from "./engine-DEEy1h7X.js";
import "./imageProcessingFunctions-DWw5RcFu.js";
import "./logDepthVertex-BtaIDRvR.js";
import "./helperFunctions-B0qWTuMZ.js";
import "./fogVertex-BHpwb8mx.js";
import "./clipPlaneVertex-CsONt9tn.js";
import { C as re } from "./sphereBuilder-DYMTtv3A.js";
import { StandardMaterial as se } from "./standardMaterial-Cj9IfPyb.js";
var Ae = !0;
m.prototype.createTransformFeedback = function() {
  const u = this._gl.createTransformFeedback();
  if (!u)
    throw new Error("Unable to create Transform Feedback");
  return u;
};
m.prototype.deleteTransformFeedback = function(u) {
  this._gl.deleteTransformFeedback(u);
};
m.prototype.bindTransformFeedback = function(u) {
  this._gl.bindTransformFeedback(this._gl.TRANSFORM_FEEDBACK, u);
};
m.prototype.beginTransformFeedback = function(u = !0) {
  this._gl.beginTransformFeedback(u ? this._gl.POINTS : this._gl.TRIANGLES);
};
m.prototype.endTransformFeedback = function() {
  this._gl.endTransformFeedback();
};
m.prototype.setTranformFeedbackVaryings = function(u, e) {
  this._gl.transformFeedbackVaryings(u, e, this._gl.INTERLEAVED_ATTRIBS);
};
m.prototype.bindTransformFeedbackBuffer = function(u) {
  this._gl.bindBufferBase(this._gl.TRANSFORM_FEEDBACK_BUFFER, 0, u ? u.underlyingResource : null);
};
const ae = "clipPlaneFragmentDeclaration2", ne = `#ifdef CLIPPLANE
in float fClipDistance;
#endif
#ifdef CLIPPLANE2
in float fClipDistance2;
#endif
#ifdef CLIPPLANE3
in float fClipDistance3;
#endif
#ifdef CLIPPLANE4
in float fClipDistance4;
#endif
#ifdef CLIPPLANE5
in float fClipDistance5;
#endif
#ifdef CLIPPLANE6
in float fClipDistance6;
#endif
`;
D.IncludesShadersStore[ae] = ne;
const oe = "gpuRenderParticlesPixelShader", fe = `precision highp float;
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
uniform sampler2D diffuseSampler;varying vec2 vUV;varying vec4 vColor;
#include<clipPlaneFragmentDeclaration2> 
#include<imageProcessingDeclaration>
#include<logDepthDeclaration>
#include<helperFunctions>
#include<imageProcessingFunctions>
#include<fogFragmentDeclaration>
void main() {
#include<clipPlaneFragment> 
vec4 textureColor=texture2D(diffuseSampler,vUV);gl_FragColor=textureColor*vColor;
#ifdef BLENDMULTIPLYMODE
float alpha=vColor.a*textureColor.a;gl_FragColor.rgb=gl_FragColor.rgb*alpha+vec3(1.0)*(1.0-alpha);
#endif 
#include<logDepthFragment>
#include<fogFragment>(color,gl_FragColor)
#ifdef IMAGEPROCESSINGPOSTPROCESS
gl_FragColor.rgb=toLinearSpace(gl_FragColor.rgb);
#else
#ifdef IMAGEPROCESSING
gl_FragColor.rgb=toLinearSpace(gl_FragColor.rgb);gl_FragColor=applyImageProcessing(gl_FragColor);
#endif
#endif
}
`;
D.ShadersStore[oe] = fe;
const he = "clipPlaneVertexDeclaration2", de = `#ifdef CLIPPLANE
uniform vec4 vClipPlane;out float fClipDistance;
#endif
#ifdef CLIPPLANE2
uniform vec4 vClipPlane2;out float fClipDistance2;
#endif
#ifdef CLIPPLANE3
uniform vec4 vClipPlane3;out float fClipDistance3;
#endif
#ifdef CLIPPLANE4
uniform vec4 vClipPlane4;out float fClipDistance4;
#endif
#ifdef CLIPPLANE5
uniform vec4 vClipPlane5;out float fClipDistance5;
#endif
#ifdef CLIPPLANE6
uniform vec4 vClipPlane6;out float fClipDistance6;
#endif
`;
D.IncludesShadersStore[he] = de;
const le = "gpuRenderParticlesVertexShader", ue = `precision highp float;uniform mat4 view;uniform mat4 projection;uniform vec2 translationPivot;uniform vec3 worldOffset;
#ifdef LOCAL
uniform mat4 emitterWM;
#endif
attribute vec3 position;attribute float age;attribute float life;attribute vec3 size;
#ifndef BILLBOARD
attribute vec3 initialDirection;
#endif
#ifdef BILLBOARDSTRETCHED
attribute vec3 direction;
#endif
attribute float angle;
#ifdef ANIMATESHEET
attribute float cellIndex;
#endif
attribute vec2 offset;attribute vec2 uv;varying vec2 vUV;varying vec4 vColor;varying vec3 vPositionW;
#if defined(BILLBOARD) && !defined(BILLBOARDY) && !defined(BILLBOARDSTRETCHED)
uniform mat4 invView;
#endif
#include<clipPlaneVertexDeclaration2>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>
#ifdef COLORGRADIENTS
uniform sampler2D colorGradientSampler;
#else
uniform vec4 colorDead;attribute vec4 color;
#endif
#ifdef ANIMATESHEET
uniform vec3 sheetInfos;
#endif
#ifdef BILLBOARD
uniform vec3 eyePosition;
#endif
vec3 rotate(vec3 yaxis,vec3 rotatedCorner) {vec3 xaxis=normalize(cross(vec3(0.,1.0,0.),yaxis));vec3 zaxis=normalize(cross(yaxis,xaxis));vec3 row0=vec3(xaxis.x,xaxis.y,xaxis.z);vec3 row1=vec3(yaxis.x,yaxis.y,yaxis.z);vec3 row2=vec3(zaxis.x,zaxis.y,zaxis.z);mat3 rotMatrix= mat3(row0,row1,row2);vec3 alignedCorner=rotMatrix*rotatedCorner;
#ifdef LOCAL
return ((emitterWM*vec4(position,1.0)).xyz+worldOffset)+alignedCorner;
#else
return (position+worldOffset)+alignedCorner;
#endif
}
#ifdef BILLBOARDSTRETCHED
vec3 rotateAlign(vec3 toCamera,vec3 rotatedCorner) {vec3 normalizedToCamera=normalize(toCamera);vec3 normalizedCrossDirToCamera=normalize(cross(normalize(direction),normalizedToCamera));vec3 crossProduct=normalize(cross(normalizedToCamera,normalizedCrossDirToCamera));vec3 row0=vec3(normalizedCrossDirToCamera.x,normalizedCrossDirToCamera.y,normalizedCrossDirToCamera.z);vec3 row1=vec3(crossProduct.x,crossProduct.y,crossProduct.z);vec3 row2=vec3(normalizedToCamera.x,normalizedToCamera.y,normalizedToCamera.z);mat3 rotMatrix= mat3(row0,row1,row2);vec3 alignedCorner=rotMatrix*rotatedCorner;
#ifdef LOCAL
return ((emitterWM*vec4(position,1.0)).xyz+worldOffset)+alignedCorner;
#else
return (position+worldOffset)+alignedCorner;
#endif
}
#endif
void main() {
#ifdef ANIMATESHEET
float rowOffset=floor(cellIndex/sheetInfos.z);float columnOffset=cellIndex-rowOffset*sheetInfos.z;vec2 uvScale=sheetInfos.xy;vec2 uvOffset=vec2(uv.x ,1.0-uv.y);vUV=(uvOffset+vec2(columnOffset,rowOffset))*uvScale;
#else
vUV=uv;
#endif
float ratio=age/life;
#ifdef COLORGRADIENTS
vColor=texture2D(colorGradientSampler,vec2(ratio,0));
#else
vColor=color*vec4(1.0-ratio)+colorDead*vec4(ratio);
#endif
vec2 cornerPos=(offset-translationPivot)*size.yz*size.x;
#ifdef BILLBOARD
vec4 rotatedCorner;rotatedCorner.w=0.;
#ifdef BILLBOARDY
rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.z=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.y=0.;rotatedCorner.xz+=translationPivot;vec3 yaxis=(position+worldOffset)-eyePosition;yaxis.y=0.;vPositionW=rotate(normalize(yaxis),rotatedCorner.xyz);vec4 viewPosition=(view*vec4(vPositionW,1.0));
#elif defined(BILLBOARDSTRETCHED)
rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.y=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.z=0.;rotatedCorner.xy+=translationPivot;vec3 toCamera=(position+worldOffset)-eyePosition;vPositionW=rotateAlign(toCamera,rotatedCorner.xyz);vec4 viewPosition=(view*vec4(vPositionW,1.0));
#else
rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.y=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.z=0.;rotatedCorner.xy+=translationPivot;
#ifdef LOCAL
vec4 viewPosition=view*vec4(((emitterWM*vec4(position,1.0)).xyz+worldOffset),1.0)+rotatedCorner;
#else
vec4 viewPosition=view*vec4((position+worldOffset),1.0)+rotatedCorner;
#endif
vPositionW=(invView*viewPosition).xyz;
#endif
#else
vec3 rotatedCorner;rotatedCorner.x=cornerPos.x*cos(angle)-cornerPos.y*sin(angle);rotatedCorner.y=0.;rotatedCorner.z=cornerPos.x*sin(angle)+cornerPos.y*cos(angle);rotatedCorner.xz+=translationPivot;vec3 yaxis=normalize(initialDirection);vPositionW=rotate(yaxis,rotatedCorner);vec4 viewPosition=view*vec4(vPositionW,1.0);
#endif
gl_Position=projection*viewPosition;
#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6) || defined(FOG)
vec4 worldPos=vec4(vPositionW,1.0);
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}`;
D.ShadersStore[le] = ue;
class c extends k {
  /**
   * Gets a boolean indicating if the GPU particles can be rendered on current browser
   */
  static get IsSupported() {
    if (!g.LastCreatedEngine)
      return !1;
    const e = g.LastCreatedEngine.getCaps();
    return e.supportTransformFeedbacks || e.supportComputeShaders;
  }
  _createIndexBuffer() {
    this._linesIndexBufferUseInstancing = this._engine.createIndexBuffer(new Uint32Array([0, 1, 1, 3, 3, 2, 2, 0, 0, 3]), void 0, "GPUParticleSystemLinesIndexBuffer");
  }
  /**
   * Gets the maximum number of particles active at the same time.
   * @returns The max number of active particles.
   */
  getCapacity() {
    return this._capacity;
  }
  /**
   * Gets or set the number of active particles
   * The value cannot be greater than "capacity" (if it is, it will be limited to "capacity").
   */
  get maxActiveParticleCount() {
    return this._maxActiveParticleCount;
  }
  set maxActiveParticleCount(e) {
    this._maxActiveParticleCount = Math.min(e, this._capacity);
  }
  /**
   * Gets or set the number of active particles
   * @deprecated Please use maxActiveParticleCount instead.
   */
  get activeParticleCount() {
    return this.maxActiveParticleCount;
  }
  set activeParticleCount(e) {
    this.maxActiveParticleCount = e;
  }
  /**
   * Creates a Point Emitter for the particle system (emits directly from the emitter position)
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
   * @returns the emitter
   */
  createPointEmitter(e, t) {
    const i = H(e, t);
    return this.particleEmitterType = i, i;
  }
  /**
   * Creates a Hemisphere Emitter for the particle system (emits along the hemisphere radius)
   * @param radius The radius of the hemisphere to emit from
   * @param radiusRange The range of the hemisphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
   * @returns the emitter
   */
  createHemisphericEmitter(e = 1, t = 1) {
    const i = Y(e, t);
    return this.particleEmitterType = i, i;
  }
  /**
   * Creates a Sphere Emitter for the particle system (emits along the sphere radius)
   * @param radius The radius of the sphere to emit from
   * @param radiusRange The range of the sphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
   * @returns the emitter
   */
  createSphereEmitter(e = 1, t = 1) {
    const i = j(e, t);
    return this.particleEmitterType = i, i;
  }
  /**
   * Creates a Directed Sphere Emitter for the particle system (emits between direction1 and direction2)
   * @param radius The radius of the sphere to emit from
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the sphere
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the sphere
   * @returns the emitter
   */
  createDirectedSphereEmitter(e = 1, t = new x(0, 1, 0), i = new x(0, 1, 0)) {
    const s = q(e, t, i);
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
    const r = $(e, t, i, s);
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
  createDirectedCylinderEmitter(e = 1, t = 1, i = 1, s = new x(0, 1, 0), r = new x(0, 1, 0)) {
    const a = K(e, t, i, s, r);
    return this.particleEmitterType = a, a;
  }
  /**
   * Creates a Cone Emitter for the particle system (emits from the cone to the particle position)
   * @param radius The radius of the cone to emit from
   * @param angle The base angle of the cone
   * @returns the emitter
   */
  createConeEmitter(e = 1, t = Math.PI / 4) {
    const i = J(e, t);
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
    const r = new w();
    return this.particleEmitterType = r, this.direction1 = e, this.direction2 = t, this.minEmitBox = i, this.maxEmitBox = s, r;
  }
  /**
   * Is this system ready to be used/rendered
   * @returns true if the system is ready
   */
  isReady() {
    if (!this.emitter || this._imageProcessingConfiguration && !this._imageProcessingConfiguration.isReady() || !this.particleTexture || !this.particleTexture.isReady() || this._rebuildingAfterContextLost)
      return !1;
    if (this.blendMode !== d.BLENDMODE_MULTIPLYADD) {
      if (!this._getWrapper(this.blendMode).effect.isReady())
        return !1;
    } else if (!this._getWrapper(d.BLENDMODE_MULTIPLY).effect.isReady() || !this._getWrapper(d.BLENDMODE_ADD).effect.isReady())
      return !1;
    return this._platform.isUpdateBufferCreated() ? this._platform.isUpdateBufferReady() : (this._recreateUpdateEffect(), !1);
  }
  /**
   * Gets if the system has been started. (Note: this will still be true after stop is called)
   * @returns True if it has been started, otherwise false.
   */
  isStarted() {
    return this._started;
  }
  /**
   * Gets if the system has been stopped. (Note: rendering is still happening but the system is frozen)
   * @returns True if it has been stopped, otherwise false.
   */
  isStopped() {
    return this._stopped;
  }
  /**
   * Gets a boolean indicating that the system is stopping
   * @returns true if the system is currently stopping
   */
  isStopping() {
    return !1;
  }
  /**
   * Gets the number of particles active at the same time.
   * @returns The number of active particles.
   */
  getActiveCount() {
    return this._currentActiveCount;
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
    this._started = !0, this._stopped = !1, this._preWarmDone = !1, this.beginAnimationOnStart && this.animations && this.animations.length > 0 && this._scene && this._scene.beginAnimation(this, this.beginAnimationFrom, this.beginAnimationTo, this.beginAnimationLoop);
  }
  /**
   * Stops the particle system.
   */
  stop() {
    this._stopped || (this._stopped = !0);
  }
  /**
   * Remove all active particles
   */
  reset() {
    this._releaseBuffers(), this._platform.releaseVertexBuffers(), this._currentActiveCount = 0, this._targetIndex = 0;
  }
  /**
   * Returns the string "GPUParticleSystem"
   * @returns a string containing the class name
   */
  getClassName() {
    return "GPUParticleSystem";
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
    this._customWrappers[t] = new C(this._engine), this._customWrappers[t].effect = e;
  }
  /**
   * Observable that will be called just before the particles are drawn
   */
  get onBeforeDrawParticlesObservable() {
    return this._onBeforeDrawParticlesObservable || (this._onBeforeDrawParticlesObservable = new P()), this._onBeforeDrawParticlesObservable;
  }
  /**
   * Gets the name of the particle vertex shader
   */
  get vertexShaderName() {
    return "gpuRenderParticles";
  }
  /**
   * Gets the vertex buffers used by the particle system
   * Should be called after render() has been called for the current frame so that the buffers returned are the ones that have been updated
   * in the current frame (there's a ping-pong between two sets of buffers - for a given frame, one set is used as the source and the other as the destination)
   */
  get vertexBuffers() {
    return this._renderVertexBuffers[this._targetIndex ^ 1];
  }
  /**
   * Gets the index buffer used by the particle system (null for GPU particle systems)
   */
  get indexBuffer() {
    return null;
  }
  _removeGradientAndTexture(e, t, i) {
    return super._removeGradientAndTexture(e, t, i), this._releaseBuffers(), this;
  }
  /**
   * Adds a new color gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param color1 defines the color to affect to the specified gradient
   * @returns the current particle system
   */
  addColorGradient(e, t) {
    this._colorGradients || (this._colorGradients = []);
    const i = new W(e, t);
    return this._colorGradients.push(i), this._refreshColorGradient(!0), this._releaseBuffers(), this;
  }
  _refreshColorGradient(e = !1) {
    this._colorGradients && (e && this._colorGradients.sort((t, i) => t.gradient < i.gradient ? -1 : t.gradient > i.gradient ? 1 : 0), this._colorGradientsTexture && (this._colorGradientsTexture.dispose(), this._colorGradientsTexture = null));
  }
  /** Force the system to rebuild all gradients that need to be resync */
  forceRefreshGradients() {
    this._refreshColorGradient(), this._refreshFactorGradient(this._sizeGradients, "_sizeGradientsTexture"), this._refreshFactorGradient(this._angularSpeedGradients, "_angularSpeedGradientsTexture"), this._refreshFactorGradient(this._velocityGradients, "_velocityGradientsTexture"), this._refreshFactorGradient(this._limitVelocityGradients, "_limitVelocityGradientsTexture"), this._refreshFactorGradient(this._dragGradients, "_dragGradientsTexture"), this.reset();
  }
  /**
   * Remove a specific color gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeColorGradient(e) {
    return this._removeGradientAndTexture(e, this._colorGradients, this._colorGradientsTexture), this._colorGradientsTexture = null, this;
  }
  /**
   * Resets the draw wrappers cache
   */
  resetDrawCache() {
    for (const e in this._drawWrappers)
      this._drawWrappers[e].drawContext?.reset();
  }
  _addFactorGradient(e, t, i) {
    const s = new U(t, i);
    e.push(s), this._releaseBuffers();
  }
  /**
   * Adds a new size gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the size factor to affect to the specified gradient
   * @returns the current particle system
   */
  addSizeGradient(e, t) {
    return this._sizeGradients || (this._sizeGradients = []), this._addFactorGradient(this._sizeGradients, e, t), this._refreshFactorGradient(this._sizeGradients, "_sizeGradientsTexture", !0), this._releaseBuffers(), this;
  }
  /**
   * Remove a specific size gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeSizeGradient(e) {
    return this._removeGradientAndTexture(e, this._sizeGradients, this._sizeGradientsTexture), this._sizeGradientsTexture = null, this;
  }
  _refreshFactorGradient(e, t, i = !1) {
    if (!e)
      return;
    i && e.sort((r, a) => r.gradient < a.gradient ? -1 : r.gradient > a.gradient ? 1 : 0);
    const s = this;
    s[t] && (s[t].dispose(), s[t] = null);
  }
  /**
   * Adds a new angular speed gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the angular speed to affect to the specified gradient
   * @returns the current particle system
   */
  addAngularSpeedGradient(e, t) {
    return this._angularSpeedGradients || (this._angularSpeedGradients = []), this._addFactorGradient(this._angularSpeedGradients, e, t), this._refreshFactorGradient(this._angularSpeedGradients, "_angularSpeedGradientsTexture", !0), this._releaseBuffers(), this;
  }
  /**
   * Remove a specific angular speed gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeAngularSpeedGradient(e) {
    return this._removeGradientAndTexture(e, this._angularSpeedGradients, this._angularSpeedGradientsTexture), this._angularSpeedGradientsTexture = null, this;
  }
  /**
   * Adds a new velocity gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the velocity to affect to the specified gradient
   * @returns the current particle system
   */
  addVelocityGradient(e, t) {
    return this._velocityGradients || (this._velocityGradients = []), this._addFactorGradient(this._velocityGradients, e, t), this._refreshFactorGradient(this._velocityGradients, "_velocityGradientsTexture", !0), this._releaseBuffers(), this;
  }
  /**
   * Remove a specific velocity gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeVelocityGradient(e) {
    return this._removeGradientAndTexture(e, this._velocityGradients, this._velocityGradientsTexture), this._velocityGradientsTexture = null, this;
  }
  /**
   * Adds a new limit velocity gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the limit velocity value to affect to the specified gradient
   * @returns the current particle system
   */
  addLimitVelocityGradient(e, t) {
    return this._limitVelocityGradients || (this._limitVelocityGradients = []), this._addFactorGradient(this._limitVelocityGradients, e, t), this._refreshFactorGradient(this._limitVelocityGradients, "_limitVelocityGradientsTexture", !0), this._releaseBuffers(), this;
  }
  /**
   * Remove a specific limit velocity gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeLimitVelocityGradient(e) {
    return this._removeGradientAndTexture(e, this._limitVelocityGradients, this._limitVelocityGradientsTexture), this._limitVelocityGradientsTexture = null, this;
  }
  /**
   * Adds a new drag gradient
   * @param gradient defines the gradient to use (between 0 and 1)
   * @param factor defines the drag value to affect to the specified gradient
   * @returns the current particle system
   */
  addDragGradient(e, t) {
    return this._dragGradients || (this._dragGradients = []), this._addFactorGradient(this._dragGradients, e, t), this._refreshFactorGradient(this._dragGradients, "_dragGradientsTexture", !0), this._releaseBuffers(), this;
  }
  /**
   * Remove a specific drag gradient
   * @param gradient defines the gradient to remove
   * @returns the current particle system
   */
  removeDragGradient(e) {
    return this._removeGradientAndTexture(e, this._dragGradients, this._dragGradientsTexture), this._dragGradientsTexture = null, this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  addEmitRateGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  removeEmitRateGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  addStartSizeGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  removeStartSizeGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  addColorRemapGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  removeColorRemapGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  addAlphaRemapGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  removeAlphaRemapGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  addRampGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  removeRampGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the list of ramp gradients
   */
  getRampGradients() {
    return null;
  }
  /**
   * Not supported by GPUParticleSystem
   * Gets or sets a boolean indicating that ramp gradients must be used
   * @see https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro#ramp-gradients
   */
  get useRampGradients() {
    return !1;
  }
  set useRampGradients(e) {
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  addLifeTimeGradient() {
    return this;
  }
  /**
   * Not supported by GPUParticleSystem
   * @returns the current particle system
   */
  removeLifeTimeGradient() {
    return this;
  }
  /**
   * Instantiates a GPU particle system.
   * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
   * @param name The name of the particle system
   * @param options The options used to create the system
   * @param sceneOrEngine The scene the particle system belongs to or the engine to use if no scene
   * @param customEffect a custom effect used to change the way particles are rendered by default
   * @param isAnimationSheetEnabled Must be true if using a spritesheet to animate the particles texture
   */
  constructor(e, t, i, s = null, r = !1) {
    if (super(e), this.layerMask = 268435455, this._accumulatedCount = 0, this._renderVertexBuffers = [], this._targetIndex = 0, this._currentRenderId = -1, this._currentRenderingCameraUniqueId = -1, this._started = !1, this._stopped = !1, this._timeDelta = 0, this.updateInAnimate = !1, this._actualFrame = 0, this._rawTextureWidth = 256, this._rebuildingAfterContextLost = !1, this.onDisposeObservable = new P(), this.onStoppedObservable = new P(), this.forceDepthWrite = !1, this._preWarmDone = !1, this.isLocal = !1, this.isGPU = !0, this._onBeforeDrawParticlesObservable = null, !i || i.getClassName() === "Scene" ? (this._scene = i || g.LastCreatedScene, this._engine = this._scene.getEngine(), this.uniqueId = this._scene.getUniqueId(), this._scene.particleSystems.push(this)) : (this._engine = i, this.defaultProjectionMatrix = T.PerspectiveFovLH(0.8, 1, 0.1, 100, this._engine.isNDCHalfZRange)), this._engine.getCaps().supportComputeShaders) {
      if (!S("BABYLON.ComputeShaderParticleSystem"))
        throw new Error("The ComputeShaderParticleSystem class is not available! Make sure you have imported it.");
      this._platform = new (S("BABYLON.ComputeShaderParticleSystem"))(this, this._engine);
    } else {
      if (!S("BABYLON.WebGL2ParticleSystem"))
        throw new Error("The WebGL2ParticleSystem class is not available! Make sure you have imported it.");
      this._platform = new (S("BABYLON.WebGL2ParticleSystem"))(this, this._engine);
    }
    this._customWrappers = { 0: new C(this._engine) }, this._customWrappers[0].effect = s, this._drawWrappers = { 0: new C(this._engine) }, this._drawWrappers[0].drawContext && (this._drawWrappers[0].drawContext.useInstancing = !0), this._createIndexBuffer(), this._attachImageProcessingConfiguration(null), t = t ?? {}, t.randomTextureSize || delete t.randomTextureSize;
    const a = {
      capacity: 5e4,
      randomTextureSize: this._engine.getCaps().maxTextureSize,
      ...t
    }, n = t;
    isFinite(n) && (a.capacity = n), this._capacity = a.capacity, this._maxActiveParticleCount = a.capacity, this._currentActiveCount = 0, this._isAnimationSheetEnabled = r, this.particleEmitterType = new w();
    const f = Math.min(this._engine.getCaps().maxTextureSize, a.randomTextureSize);
    let o = [];
    for (let h = 0; h < f; ++h)
      o.push(Math.random()), o.push(Math.random()), o.push(Math.random()), o.push(Math.random());
    this._randomTexture = new v(new Float32Array(o), f, 1, 5, i, !1, !1, 1, 1), this._randomTexture.name = "GPUParticleSystem_random1", this._randomTexture.wrapU = 1, this._randomTexture.wrapV = 1, o = [];
    for (let h = 0; h < f; ++h)
      o.push(Math.random()), o.push(Math.random()), o.push(Math.random()), o.push(Math.random());
    this._randomTexture2 = new v(new Float32Array(o), f, 1, 5, i, !1, !1, 1, 1), this._randomTexture2.name = "GPUParticleSystem_random2", this._randomTexture2.wrapU = 1, this._randomTexture2.wrapV = 1, this._randomTextureSize = f;
  }
  _reset() {
    this._releaseBuffers();
  }
  _createVertexBuffers(e, t, i) {
    const s = {};
    s.position = t.createVertexBuffer("position", 0, 3, this._attributesStrideSize, !0);
    let r = 3;
    s.age = t.createVertexBuffer("age", r, 1, this._attributesStrideSize, !0), r += 1, s.size = t.createVertexBuffer("size", r, 3, this._attributesStrideSize, !0), r += 3, s.life = t.createVertexBuffer("life", r, 1, this._attributesStrideSize, !0), r += 1, r += 4, this.billboardMode === d.BILLBOARDMODE_STRETCHED && (s.direction = t.createVertexBuffer("direction", r, 3, this._attributesStrideSize, !0)), r += 3, this._platform.alignDataInBuffer && (r += 1), this.particleEmitterType instanceof A && (r += 3, this._platform.alignDataInBuffer && (r += 1)), this._colorGradientsTexture || (s.color = t.createVertexBuffer("color", r, 4, this._attributesStrideSize, !0), r += 4), this._isBillboardBased || (s.initialDirection = t.createVertexBuffer("initialDirection", r, 3, this._attributesStrideSize, !0), r += 3, this._platform.alignDataInBuffer && (r += 1)), this.noiseTexture && (s.noiseCoordinates1 = t.createVertexBuffer("noiseCoordinates1", r, 3, this._attributesStrideSize, !0), r += 3, this._platform.alignDataInBuffer && (r += 1), s.noiseCoordinates2 = t.createVertexBuffer("noiseCoordinates2", r, 3, this._attributesStrideSize, !0), r += 3, this._platform.alignDataInBuffer && (r += 1)), s.angle = t.createVertexBuffer("angle", r, 1, this._attributesStrideSize, !0), this._angularSpeedGradientsTexture ? r++ : r += 2, this._isAnimationSheetEnabled && (s.cellIndex = t.createVertexBuffer("cellIndex", r, 1, this._attributesStrideSize, !0), r += 1, this.spriteRandomStartCell && (s.cellStartOffset = t.createVertexBuffer("cellStartOffset", r, 1, this._attributesStrideSize, !0), r += 1)), s.offset = i.createVertexBuffer("offset", 0, 2), s.uv = i.createVertexBuffer("uv", 2, 2), this._renderVertexBuffers.push(s), this._platform.createVertexBuffers(e, s), this.resetDrawCache();
  }
  _initialize(e = !1) {
    if (this._buffer0 && !e)
      return;
    const t = this._engine, i = [];
    this._attributesStrideSize = 21, this._targetIndex = 0, this._platform.alignDataInBuffer && (this._attributesStrideSize += 1), this.particleEmitterType instanceof A && (this._attributesStrideSize += 3, this._platform.alignDataInBuffer && (this._attributesStrideSize += 1)), this.isBillboardBased || (this._attributesStrideSize += 3, this._platform.alignDataInBuffer && (this._attributesStrideSize += 1)), this._colorGradientsTexture && (this._attributesStrideSize -= 4), this._angularSpeedGradientsTexture && (this._attributesStrideSize -= 1), this._isAnimationSheetEnabled && (this._attributesStrideSize += 1, this.spriteRandomStartCell && (this._attributesStrideSize += 1)), this.noiseTexture && (this._attributesStrideSize += 6, this._platform.alignDataInBuffer && (this._attributesStrideSize += 2)), this._platform.alignDataInBuffer && (this._attributesStrideSize += 3 - (this._attributesStrideSize + 3 & 3));
    const s = this.particleEmitterType instanceof A, r = y.Vector3[0];
    let a = 0;
    for (let h = 0; h < this._capacity; h++)
      if (i.push(0), i.push(0), i.push(0), i.push(0), i.push(0), i.push(0), i.push(0), i.push(0), i.push(Math.random()), i.push(Math.random()), i.push(Math.random()), i.push(Math.random()), s ? (this.particleEmitterType.particleDestinationGenerator(h, null, r), i.push(r.x), i.push(r.y), i.push(r.z)) : (i.push(0), i.push(0), i.push(0)), this._platform.alignDataInBuffer && i.push(0), a += 16, s && (this.particleEmitterType.particlePositionGenerator(h, null, r), i.push(r.x), i.push(r.y), i.push(r.z), this._platform.alignDataInBuffer && i.push(0), a += 4), this._colorGradientsTexture || (i.push(0), i.push(0), i.push(0), i.push(0), a += 4), this.isBillboardBased || (i.push(0), i.push(0), i.push(0), this._platform.alignDataInBuffer && i.push(0), a += 4), this.noiseTexture && (i.push(Math.random()), i.push(Math.random()), i.push(Math.random()), this._platform.alignDataInBuffer && i.push(0), i.push(Math.random()), i.push(Math.random()), i.push(Math.random()), this._platform.alignDataInBuffer && i.push(0), a += 8), i.push(0), a += 1, this._angularSpeedGradientsTexture || (i.push(0), a += 1), this._isAnimationSheetEnabled && (i.push(0), a += 1, this.spriteRandomStartCell && (i.push(0), a += 1)), this._platform.alignDataInBuffer) {
        let l = 3 - (a + 3 & 3);
        for (a += l; l-- > 0; )
          i.push(0);
      }
    const n = new Float32Array([0.5, 0.5, 1, 1, -0.5, 0.5, 0, 1, 0.5, -0.5, 1, 0, -0.5, -0.5, 0, 0]), f = this._platform.createParticleBuffer(i), o = this._platform.createParticleBuffer(i);
    this._buffer0 = new B(t, f, !1, this._attributesStrideSize), this._buffer1 = new B(t, o, !1, this._attributesStrideSize), this._spriteBuffer = new B(t, n, !1, 4), this._renderVertexBuffers = [], this._createVertexBuffers(this._buffer0, this._buffer1, this._spriteBuffer), this._createVertexBuffers(this._buffer1, this._buffer0, this._spriteBuffer), this._sourceBuffer = this._buffer0, this._targetBuffer = this._buffer1;
  }
  /** @internal */
  _recreateUpdateEffect() {
    this._createColorGradientTexture(), this._createSizeGradientTexture(), this._createAngularSpeedGradientTexture(), this._createVelocityGradientTexture(), this._createLimitVelocityGradientTexture(), this._createDragGradientTexture();
    let e = this.particleEmitterType ? this.particleEmitterType.getEffectDefines() : "";
    return this._isBillboardBased && (e += `
#define BILLBOARD`), this._colorGradientsTexture && (e += `
#define COLORGRADIENTS`), this._sizeGradientsTexture && (e += `
#define SIZEGRADIENTS`), this._angularSpeedGradientsTexture && (e += `
#define ANGULARSPEEDGRADIENTS`), this._velocityGradientsTexture && (e += `
#define VELOCITYGRADIENTS`), this._limitVelocityGradientsTexture && (e += `
#define LIMITVELOCITYGRADIENTS`), this._dragGradientsTexture && (e += `
#define DRAGGRADIENTS`), this.isAnimationSheetEnabled && (e += `
#define ANIMATESHEET`, this.spriteRandomStartCell && (e += `
#define ANIMATESHEETRANDOMSTART`)), this.noiseTexture && (e += `
#define NOISE`), this.isLocal && (e += `
#define LOCAL`), this._platform.isUpdateBufferCreated() && this._cachedUpdateDefines === e ? this._platform.isUpdateBufferReady() : (this._cachedUpdateDefines = e, this._updateBuffer = this._platform.createUpdateBuffer(e), this._platform.isUpdateBufferReady());
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
    let s = this._drawWrappers[e];
    s || (s = new C(this._engine), s.drawContext && (s.drawContext.useInstancing = !0), this._drawWrappers[e] = s);
    const r = i.join(`
`);
    if (s.defines !== r) {
      const a = [], n = [], f = [];
      this.fillUniformsAttributesAndSamplerNames(n, a, f), s.setEffect(this._engine.createEffect("gpuRenderParticles", a, n, f, r), r);
    }
    return s;
  }
  /**
   * @internal
   */
  static _GetAttributeNamesOrOptions(e = !1, t = !1, i = !1, s = !1) {
    const r = [E.PositionKind, "age", "life", "size", "angle"];
    return e || r.push(E.ColorKind), t && r.push("cellIndex"), i || r.push("initialDirection"), s && r.push("direction"), r.push("offset", E.UVKind), r;
  }
  /**
   * @internal
   */
  static _GetEffectCreationOptions(e = !1, t = !1, i = !1) {
    const s = ["emitterWM", "worldOffset", "view", "projection", "colorDead", "invView", "translationPivot", "eyePosition"];
    return Z(s), e && s.push("sheetInfos"), t && s.push("logarithmicDepthConstant"), i && (s.push("vFogInfos"), s.push("vFogColor")), s;
  }
  /**
   * Fill the defines array according to the current settings of the particle system
   * @param defines Array to be updated
   * @param blendMode blend mode to take into account when updating the array
   */
  fillDefines(e, t = 0) {
    if (this._scene && (Q(this, this._scene, e), this.applyFog && this._scene.fogEnabled && this._scene.fogMode !== X.FOGMODE_NONE && e.push("#define FOG")), t === d.BLENDMODE_MULTIPLY && e.push("#define BLENDMULTIPLYMODE"), this.isLocal && e.push("#define LOCAL"), this.useLogarithmicDepth && e.push("#define LOGARITHMICDEPTH"), this._isBillboardBased)
      switch (e.push("#define BILLBOARD"), this.billboardMode) {
        case d.BILLBOARDMODE_Y:
          e.push("#define BILLBOARDY");
          break;
        case d.BILLBOARDMODE_STRETCHED:
          e.push("#define BILLBOARDSTRETCHED");
          break;
        case d.BILLBOARDMODE_ALL:
          e.push("#define BILLBOARDMODE_ALL");
          break;
      }
    this._colorGradientsTexture && e.push("#define COLORGRADIENTS"), this.isAnimationSheetEnabled && e.push("#define ANIMATESHEET"), this._imageProcessingConfiguration && (this._imageProcessingConfiguration.prepareDefines(this._imageProcessingConfigurationDefines), e.push("" + this._imageProcessingConfigurationDefines.toString()));
  }
  /**
   * Fill the uniforms, attributes and samplers arrays according to the current settings of the particle system
   * @param uniforms Uniforms array to fill
   * @param attributes Attributes array to fill
   * @param samplers Samplers array to fill
   */
  fillUniformsAttributesAndSamplerNames(e, t, i) {
    t.push(...c._GetAttributeNamesOrOptions(!!this._colorGradientsTexture, this._isAnimationSheetEnabled, this._isBillboardBased, this._isBillboardBased && this.billboardMode === d.BILLBOARDMODE_STRETCHED)), e.push(...c._GetEffectCreationOptions(this._isAnimationSheetEnabled, this.useLogarithmicDepth, this.applyFog)), i.push("diffuseSampler", "colorGradientSampler"), this._imageProcessingConfiguration && (I.PrepareUniforms(e, this._imageProcessingConfigurationDefines), I.PrepareSamplers(i, this._imageProcessingConfigurationDefines));
  }
  /**
   * Animates the particle system for the current frame by emitting new particles and or animating the living ones.
   * @param preWarm defines if we are in the pre-warmimg phase
   */
  animate(e = !1) {
    this._timeDelta = this.updateSpeed * (e ? this.preWarmStepOffset : this._scene?.getAnimationRatio() || 1), this._actualFrame += this._timeDelta, this._stopped || this.targetStopDuration && this._actualFrame >= this.targetStopDuration && this.stop(), this.updateInAnimate && this._update();
  }
  _createFactorGradientTexture(e, t) {
    const i = this[t];
    if (!e || !e.length || i)
      return;
    const s = new Float32Array(this._rawTextureWidth);
    for (let r = 0; r < this._rawTextureWidth; r++) {
      const a = r / this._rawTextureWidth;
      L.GetCurrentGradient(a, e, (n, f, o) => {
        s[r] = z.Lerp(n.factor1, f.factor1, o);
      });
    }
    this[t] = v.CreateRTexture(s, this._rawTextureWidth, 1, this._scene || this._engine, !1, !1, 1), this[t].name = t.substring(1);
  }
  _createSizeGradientTexture() {
    this._createFactorGradientTexture(this._sizeGradients, "_sizeGradientsTexture");
  }
  _createAngularSpeedGradientTexture() {
    this._createFactorGradientTexture(this._angularSpeedGradients, "_angularSpeedGradientsTexture");
  }
  _createVelocityGradientTexture() {
    this._createFactorGradientTexture(this._velocityGradients, "_velocityGradientsTexture");
  }
  _createLimitVelocityGradientTexture() {
    this._createFactorGradientTexture(this._limitVelocityGradients, "_limitVelocityGradientsTexture");
  }
  _createDragGradientTexture() {
    this._createFactorGradientTexture(this._dragGradients, "_dragGradientsTexture");
  }
  _createColorGradientTexture() {
    if (!this._colorGradients || !this._colorGradients.length || this._colorGradientsTexture)
      return;
    const e = new Uint8Array(this._rawTextureWidth * 4), t = R.Color4[0];
    for (let i = 0; i < this._rawTextureWidth; i++) {
      const s = i / this._rawTextureWidth;
      L.GetCurrentGradient(s, this._colorGradients, (r, a, n) => {
        G.LerpToRef(r.color1, a.color1, n, t), e[i * 4] = t.r * 255, e[i * 4 + 1] = t.g * 255, e[i * 4 + 2] = t.b * 255, e[i * 4 + 3] = t.a * 255;
      });
    }
    this._colorGradientsTexture = v.CreateRGBATexture(e, this._rawTextureWidth, 1, this._scene, !1, !1, 1), this._colorGradientsTexture.name = "colorGradients";
  }
  _render(e, t) {
    const i = this._getWrapper(e), s = i.effect;
    this._engine.enableEffect(i);
    const r = this._scene?.getViewMatrix() || T.IdentityReadOnly;
    if (s.setMatrix("view", r), s.setMatrix("projection", this.defaultProjectionMatrix ?? this._scene.getProjectionMatrix()), s.setTexture("diffuseSampler", this.particleTexture), s.setVector2("translationPivot", this.translationPivot), s.setVector3("worldOffset", this.worldOffset), this.isLocal && s.setMatrix("emitterWM", t), this._colorGradientsTexture ? s.setTexture("colorGradientSampler", this._colorGradientsTexture) : s.setDirectColor4("colorDead", this.colorDead), this._isAnimationSheetEnabled && this.particleTexture) {
      const n = this.particleTexture.getBaseSize();
      s.setFloat3("sheetInfos", this.spriteCellWidth / n.width, this.spriteCellHeight / n.height, n.width / this.spriteCellWidth);
    }
    if (this._isBillboardBased && this._scene) {
      const n = this._scene.activeCamera;
      s.setVector3("eyePosition", n.globalPosition);
    }
    const a = s.defines;
    if (this._scene && (ee(s, this, this._scene), this.applyFog && te(this._scene, void 0, s)), a.indexOf("#define BILLBOARDMODE_ALL") >= 0) {
      const n = r.clone();
      n.invert(), s.setMatrix("invView", n);
    }
    switch (this.useLogarithmicDepth && this._scene && ie(a, s, this._scene), this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess && this._imageProcessingConfiguration.bind(s), e) {
      case d.BLENDMODE_ADD:
        this._engine.setAlphaMode(1);
        break;
      case d.BLENDMODE_ONEONE:
        this._engine.setAlphaMode(6);
        break;
      case d.BLENDMODE_STANDARD:
        this._engine.setAlphaMode(2);
        break;
      case d.BLENDMODE_MULTIPLY:
        this._engine.setAlphaMode(4);
        break;
    }
    return this._platform.bindDrawBuffers(this._targetIndex, s, this._scene?.forceWireframe ? this._linesIndexBufferUseInstancing : null), this._onBeforeDrawParticlesObservable && this._onBeforeDrawParticlesObservable.notifyObservers(s), this._scene?.forceWireframe ? this._engine.drawElementsType(6, 0, 10, this._currentActiveCount) : this._engine.drawArraysType(7, 0, 4, this._currentActiveCount), this._engine.setAlphaMode(0), this._scene?.forceWireframe && this._engine.unbindInstanceAttributes(), this._currentActiveCount;
  }
  /** @internal */
  _update(e) {
    if (!this.emitter || !this._targetBuffer || !this._recreateUpdateEffect() || this._rebuildingAfterContextLost)
      return;
    if (!e)
      if (this.emitter.position)
        e = this.emitter.getWorldMatrix();
      else {
        const i = this.emitter;
        e = y.Matrix[0], T.TranslationToRef(i.x, i.y, i.z, e);
      }
    this._platform.preUpdateParticleBuffer(), this._updateBuffer.setFloat("currentCount", this._currentActiveCount), this._updateBuffer.setFloat("timeDelta", this._timeDelta), this._updateBuffer.setFloat("stopFactor", this._stopped ? 0 : 1), this._updateBuffer.setInt("randomTextureSize", this._randomTextureSize), this._updateBuffer.setFloat2("lifeTime", this.minLifeTime, this.maxLifeTime), this._updateBuffer.setFloat2("emitPower", this.minEmitPower, this.maxEmitPower), this._colorGradientsTexture || (this._updateBuffer.setDirectColor4("color1", this.color1), this._updateBuffer.setDirectColor4("color2", this.color2)), this._updateBuffer.setFloat2("sizeRange", this.minSize, this.maxSize), this._updateBuffer.setFloat4("scaleRange", this.minScaleX, this.maxScaleX, this.minScaleY, this.maxScaleY), this._updateBuffer.setFloat4("angleRange", this.minAngularSpeed, this.maxAngularSpeed, this.minInitialRotation, this.maxInitialRotation), this._updateBuffer.setVector3("gravity", this.gravity), this._limitVelocityGradientsTexture && this._updateBuffer.setFloat("limitVelocityDamping", this.limitVelocityDamping), this.particleEmitterType && this.particleEmitterType.applyToShader(this._updateBuffer), this._isAnimationSheetEnabled && this._updateBuffer.setFloat4("cellInfos", this.startSpriteCellID, this.endSpriteCellID, this.spriteCellChangeSpeed, this.spriteCellLoop ? 1 : 0), this.noiseTexture && this._updateBuffer.setVector3("noiseStrength", this.noiseStrength), this.isLocal || this._updateBuffer.setMatrix("emitterWM", e), this._platform.updateParticleBuffer(this._targetIndex, this._targetBuffer, this._currentActiveCount), this._targetIndex++, this._targetIndex === 2 && (this._targetIndex = 0);
    const t = this._sourceBuffer;
    this._sourceBuffer = this._targetBuffer, this._targetBuffer = t;
  }
  /**
   * Renders the particle system in its current state
   * @param preWarm defines if the system should only update the particles but not render them
   * @param forceUpdateOnly if true, force to only update the particles and never display them (meaning, even if preWarm=false, when forceUpdateOnly=true the particles won't be displayed)
   * @returns the current number of particles
   */
  render(e = !1, t = !1) {
    if (!this._started || !this.isReady())
      return 0;
    if (!e && this._scene) {
      if (!this._preWarmDone && this.preWarmCycles) {
        for (let a = 0; a < this.preWarmCycles; a++)
          this.animate(!0), this.render(!0, !0);
        this._preWarmDone = !0;
      }
      if (this._currentRenderId === this._scene.getRenderId() && (!this._scene.activeCamera || this._scene.activeCamera && this._currentRenderingCameraUniqueId === this._scene.activeCamera.uniqueId))
        return 0;
      this._currentRenderId = this._scene.getRenderId(), this._scene.activeCamera && (this._currentRenderingCameraUniqueId = this._scene.activeCamera.uniqueId);
    }
    if (this._initialize(), this._accumulatedCount += this.emitRate * this._timeDelta, this._accumulatedCount > 1) {
      const a = this._accumulatedCount | 0;
      this._accumulatedCount -= a, this._currentActiveCount += a;
    }
    if (this._currentActiveCount = Math.min(this._maxActiveParticleCount, this._currentActiveCount), !this._currentActiveCount)
      return 0;
    let i;
    if (this.emitter.position)
      i = this.emitter.getWorldMatrix();
    else {
      const a = this.emitter;
      i = y.Matrix[0], T.TranslationToRef(a.x, a.y, a.z, i);
    }
    const s = this._engine;
    this.updateInAnimate || this._update(i);
    let r = 0;
    return !e && !t && (s.setState(!1), this.forceDepthWrite && s.setDepthWrite(!0), this.blendMode === d.BLENDMODE_MULTIPLYADD ? r = this._render(d.BLENDMODE_MULTIPLY, i) + this._render(d.BLENDMODE_ADD, i) : r = this._render(this.blendMode, i), this._engine.setAlphaMode(0)), r;
  }
  /**
   * Rebuilds the particle system
   */
  rebuild() {
    const e = () => {
      !this._recreateUpdateEffect() || !this._platform.isUpdateBufferReady() ? setTimeout(e, 10) : (this._initialize(!0), this._rebuildingAfterContextLost = !1);
    };
    this._createIndexBuffer(), this._cachedUpdateDefines = "", this._platform.contextLost(), this._rebuildingAfterContextLost = !0, e();
  }
  _releaseBuffers() {
    this._buffer0 && (this._buffer0.dispose(), this._buffer0 = null), this._buffer1 && (this._buffer1.dispose(), this._buffer1 = null), this._spriteBuffer && (this._spriteBuffer.dispose(), this._spriteBuffer = null), this._platform.releaseBuffers();
  }
  /**
   * Disposes the particle system and free the associated resources
   * @param disposeTexture defines if the particule texture must be disposed as well (true by default)
   */
  dispose(e = !0) {
    for (const t in this._drawWrappers)
      this._drawWrappers[t].dispose();
    if (this._drawWrappers = {}, this._scene) {
      const t = this._scene.particleSystems.indexOf(this);
      t > -1 && this._scene.particleSystems.splice(t, 1);
    }
    this._releaseBuffers(), this._platform.releaseVertexBuffers();
    for (let t = 0; t < this._renderVertexBuffers.length; ++t) {
      const i = this._renderVertexBuffers[t];
      for (const s in i)
        i[s].dispose();
    }
    this._renderVertexBuffers = [], this._colorGradientsTexture && (this._colorGradientsTexture.dispose(), this._colorGradientsTexture = null), this._sizeGradientsTexture && (this._sizeGradientsTexture.dispose(), this._sizeGradientsTexture = null), this._angularSpeedGradientsTexture && (this._angularSpeedGradientsTexture.dispose(), this._angularSpeedGradientsTexture = null), this._velocityGradientsTexture && (this._velocityGradientsTexture.dispose(), this._velocityGradientsTexture = null), this._limitVelocityGradientsTexture && (this._limitVelocityGradientsTexture.dispose(), this._limitVelocityGradientsTexture = null), this._dragGradientsTexture && (this._dragGradientsTexture.dispose(), this._dragGradientsTexture = null), this._randomTexture && (this._randomTexture.dispose(), this._randomTexture = null), this._randomTexture2 && (this._randomTexture2.dispose(), this._randomTexture2 = null), e && this.particleTexture && (this.particleTexture.dispose(), this.particleTexture = null), e && this.noiseTexture && (this.noiseTexture.dispose(), this.noiseTexture = null), this.onStoppedObservable.clear(), this.onDisposeObservable.notifyObservers(this), this.onDisposeObservable.clear();
  }
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
      const o = r.shaderOptions.defines.length > 0 ? r.shaderOptions.defines.join(`
`) : "";
      s[0] = a.createEffectForParticles(r.shaderPath.fragmentElement, r.shaderOptions.uniforms, r.shaderOptions.samplers, o, void 0, void 0, void 0, this);
    }
    const n = this.serialize(i), f = c.Parse(n, this._scene || this._engine, this._rootUrl);
    return f.name = e, f.customShader = r, f._customWrappers = s, t === void 0 && (t = this.emitter), this.noiseTexture && (f.noiseTexture = this.noiseTexture.clone()), f.emitter = t, f;
  }
  /**
   * Serializes the particle system to a JSON object
   * @param serializeTexture defines if the texture must be serialized as well
   * @returns the JSON object
   */
  serialize(e = !1) {
    const t = {};
    return d._Serialize(t, this, e), t.activeParticleCount = this.activeParticleCount, t.randomTextureSize = this._randomTextureSize, t.customShader = this.customShader, t;
  }
  /**
   * Parses a JSON object to create a GPU particle system.
   * @param parsedParticleSystem The JSON object to parse
   * @param sceneOrEngine The scene or the engine to create the particle system in
   * @param rootUrl The root url to use to load external dependencies like texture
   * @param doNotStart Ignore the preventAutoStart attribute and does not start
   * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
   * @returns the parsed GPU particle system
   */
  static Parse(e, t, i, s = !1, r) {
    const a = e.name;
    let n, f;
    t instanceof M ? n = t : (f = t, n = f.getEngine());
    const o = new c(a, { capacity: r || e.capacity, randomTextureSize: e.randomTextureSize }, t, null, e.isAnimationSheetEnabled);
    if (o._rootUrl = i, e.customShader && n.createEffectForParticles) {
      const h = e.customShader, l = h.shaderOptions.defines.length > 0 ? h.shaderOptions.defines.join(`
`) : "", O = n.createEffectForParticles(h.shaderPath.fragmentElement, h.shaderOptions.uniforms, h.shaderOptions.samplers, l, void 0, void 0, void 0, o);
      o.setCustomEffect(O, 0), o.customShader = h;
    }
    return e.id && (o.id = e.id), e.activeParticleCount && (o.activeParticleCount = e.activeParticleCount), d._Parse(e, o, t, i), e.preventAutoStart && (o.preventAutoStart = e.preventAutoStart), !s && !o.preventAutoStart && o.start(), o;
  }
}
class _ {
  constructor() {
    this._emitterNodeIsOwned = !0, this.systems = [];
  }
  /**
   * Gets or sets the emitter node used with this set
   */
  get emitterNode() {
    return this._emitterNode;
  }
  set emitterNode(e) {
    this._emitterNodeIsOwned && this._emitterNode && (this._emitterNode.dispose && this._emitterNode.dispose(), this._emitterNodeIsOwned = !1);
    for (const t of this.systems)
      t.emitter = e;
    this._emitterNode = e;
  }
  /**
   * Creates a new emitter mesh as a sphere
   * @param options defines the options used to create the sphere
   * @param options.diameter
   * @param options.segments
   * @param options.color
   * @param renderingGroupId defines the renderingGroupId to use for the sphere
   * @param scene defines the hosting scene
   */
  setEmitterAsSphere(e, t, i) {
    this._emitterNodeIsOwned && this._emitterNode && this._emitterNode.dispose && this._emitterNode.dispose(), this._emitterNodeIsOwned = !0, this._emitterCreationOptions = {
      kind: "Sphere",
      options: e,
      renderingGroupId: t
    };
    const s = re("emitterSphere", { diameter: e.diameter, segments: e.segments }, i);
    s.renderingGroupId = t;
    const r = new se("emitterSphereMaterial", i);
    r.emissiveColor = e.color, s.material = r;
    for (const a of this.systems)
      a.emitter = s;
    this._emitterNode = s;
  }
  /**
   * Starts all particle systems of the set
   * @param emitter defines an optional mesh to use as emitter for the particle systems
   */
  start(e) {
    for (const t of this.systems)
      e && (t.emitter = e), t.start();
  }
  /**
   * Release all associated resources
   */
  dispose() {
    for (const e of this.systems)
      e.dispose();
    this.systems.length = 0, this._emitterNode && (this._emitterNode.dispose && this._emitterNode.dispose(), this._emitterNode = null);
  }
  /**
   * Serialize the set into a JSON compatible object
   * @param serializeTexture defines if the texture must be serialized as well
   * @returns a JSON compatible representation of the set
   */
  serialize(e = !1) {
    const t = {};
    t.systems = [];
    for (const i of this.systems)
      t.systems.push(i.serialize(e));
    return this._emitterNode && (t.emitter = this._emitterCreationOptions), t;
  }
  /**
   * Parse a new ParticleSystemSet from a serialized source
   * @param data defines a JSON compatible representation of the set
   * @param scene defines the hosting scene
   * @param gpu defines if we want GPU particles or CPU particles
   * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
   * @returns a new ParticleSystemSet
   */
  static Parse(e, t, i = !1, s) {
    const r = new _(), a = this.BaseAssetsUrl + "/textures/";
    t = t || g.LastCreatedScene;
    for (const n of e.systems)
      r.systems.push(i ? c.Parse(n, t, a, !0, s) : d.Parse(n, t, a, !0, s));
    if (e.emitter) {
      const n = e.emitter.options;
      switch (e.emitter.kind) {
        case "Sphere":
          r.setEmitterAsSphere({
            diameter: n.diameter,
            segments: n.segments,
            color: F.FromArray(n.color)
          }, e.emitter.renderingGroupId, t);
          break;
      }
    }
    return r;
  }
}
_.BaseAssetsUrl = "https://assets.babylonjs.com/particles";
class p {
  /**
   * Create a default particle system that you can tweak
   * @param emitter defines the emitter to use
   * @param capacity defines the system capacity (default is 500 particles)
   * @param scene defines the hosting scene
   * @param useGPU defines if a GPUParticleSystem must be created (default is false)
   * @returns the new Particle system
   */
  static CreateDefault(e, t = 500, i, s = !1) {
    let r;
    return s ? r = new c("default system", { capacity: t }, i) : r = new d("default system", t, i), r.emitter = e, r.particleTexture = new V("https://assets.babylonjs.com/textures/flare.png", r.getScene()), r.createConeEmitter(0.1, Math.PI / 4), r.color1 = new G(1, 1, 1, 1), r.color2 = new G(1, 1, 1, 1), r.colorDead = new G(1, 1, 1, 0), r.minSize = 0.1, r.maxSize = 0.1, r.minEmitPower = 2, r.maxEmitPower = 2, r.updateSpeed = 1 / 60, r.emitRate = 30, r;
  }
  /**
   * This is the main static method (one-liner) of this helper to create different particle systems
   * @param type This string represents the type to the particle system to create
   * @param scene The scene where the particle system should live
   * @param gpu If the system will use gpu
   * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
   * @returns the ParticleSystemSet created
   */
  static CreateAsync(e, t, i = !1, s) {
    t || (t = g.LastCreatedScene);
    const r = {};
    return t.addPendingData(r), new Promise((a, n) => {
      if (i && !c.IsSupported)
        return t.removePendingData(r), n("Particle system with GPU is not supported.");
      N.LoadFile(`${p.BaseAssetsUrl}/systems/${e}.json`, (f) => {
        t.removePendingData(r);
        const o = JSON.parse(f.toString());
        return a(_.Parse(o, t, i, s));
      }, void 0, void 0, void 0, () => (t.removePendingData(r), n(`An error occurred with the creation of your particle system. Check if your type '${e}' exists.`)));
    });
  }
  /**
   * Static function used to export a particle system to a ParticleSystemSet variable.
   * Please note that the emitter shape is not exported
   * @param systems defines the particle systems to export
   * @returns the created particle system set
   */
  static ExportSet(e) {
    const t = new _();
    for (const i of e)
      t.systems.push(i);
    return t;
  }
  /**
   * Creates a particle system from a snippet saved in a remote file
   * @param name defines the name of the particle system to create (can be null or empty to use the one from the json data)
   * @param url defines the url to load from
   * @param scene defines the hosting scene
   * @param gpu If the system will use gpu
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
   * @returns a promise that will resolve to the new particle system
   */
  static ParseFromFileAsync(e, t, i, s = !1, r = "", a) {
    return new Promise((n, f) => {
      const o = new b();
      o.addEventListener("readystatechange", () => {
        if (o.readyState == 4)
          if (o.status == 200) {
            const h = JSON.parse(o.responseText);
            let l;
            s ? l = c.Parse(h, i, r, !1, a) : l = d.Parse(h, i, r, !1, a), e && (l.name = e), n(l);
          } else
            f("Unable to load the particle system");
      }), o.open("GET", t), o.send();
    });
  }
  /**
   * Creates a particle system from a snippet saved by the particle system editor
   * @param snippetId defines the snippet to load (can be set to _BLANK to create a default one)
   * @param scene defines the hosting scene
   * @param gpu If the system will use gpu
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @param capacity defines the system capacity (if null or undefined the sotred capacity will be used)
   * @returns a promise that will resolve to the new particle system
   */
  static ParseFromSnippetAsync(e, t, i = !1, s = "", r) {
    if (e === "_BLANK") {
      const a = this.CreateDefault(null);
      return a.start(), Promise.resolve(a);
    }
    return new Promise((a, n) => {
      const f = new b();
      f.addEventListener("readystatechange", () => {
        if (f.readyState == 4)
          if (f.status == 200) {
            const o = JSON.parse(JSON.parse(f.responseText).jsonPayload), h = JSON.parse(o.particleSystem);
            let l;
            i ? l = c.Parse(h, t, s, !1, r) : l = d.Parse(h, t, s, !1, r), l.snippetId = e, a(l);
          } else
            n("Unable to load the snippet " + e);
      }), f.open("GET", this.SnippetUrl + "/" + e.replace(/#/g, "/")), f.send();
    });
  }
}
p.BaseAssetsUrl = _.BaseAssetsUrl;
p.SnippetUrl = "https://snippet.babylonjs.com";
p.CreateFromSnippetAsync = p.ParseFromSnippetAsync;
const be = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ParticleHelper: p
}, Symbol.toStringTag, { value: "Module" }));
export {
  c as G,
  p as P,
  Ae as _,
  _ as a,
  be as p
};
//# sourceMappingURL=particleHelper-DgD2SETz.js.map
