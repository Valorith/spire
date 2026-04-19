import { a as e, g as h, C as a } from "./embed-entry-BKE21f6Q.js";
import { M as l } from "./imageProcessingFunctions-DicDoEcN.js";
import "./engine.dynamicBuffer-CzeutWvF.js";
class d extends l {
  constructor() {
    super(), this.IMAGEPROCESSING = !1, this.VIGNETTE = !1, this.VIGNETTEBLENDMODEMULTIPLY = !1, this.VIGNETTEBLENDMODEOPAQUE = !1, this.TONEMAPPING = !1, this.TONEMAPPING_ACES = !1, this.CONTRAST = !1, this.COLORCURVES = !1, this.COLORGRADING = !1, this.COLORGRADING3D = !1, this.SAMPLER3DGREENDEPTH = !1, this.SAMPLER3DBGRMAP = !1, this.DITHER = !1, this.IMAGEPROCESSINGPOSTPROCESS = !1, this.EXPOSURE = !1, this.SKIPFINALCOLORCLAMP = !1, this.rebuild();
  }
}
class r {
  /**
   * Gets or sets a texture used to add random noise to particle positions
   */
  get noiseTexture() {
    return this._noiseTexture;
  }
  set noiseTexture(t) {
    this._noiseTexture !== t && (this._noiseTexture = t, this._reset());
  }
  /**
   * Gets or sets whether an animation sprite sheet is enabled or not on the particle system
   */
  get isAnimationSheetEnabled() {
    return this._isAnimationSheetEnabled;
  }
  set isAnimationSheetEnabled(t) {
    this._isAnimationSheetEnabled != t && (this._isAnimationSheetEnabled = t, this._reset());
  }
  /**
   * Gets or sets a boolean enabling the use of logarithmic depth buffers, which is good for wide depth buffers.
   */
  get useLogarithmicDepth() {
    return this._useLogarithmicDepth;
  }
  set useLogarithmicDepth(t) {
    this._useLogarithmicDepth = t && this.getScene().getEngine().getCaps().fragmentDepthSupported;
  }
  /**
   * Get hosting scene
   * @returns the scene
   */
  getScene() {
    return this._scene;
  }
  _hasTargetStopDurationDependantGradient() {
    return this._startSizeGradients && this._startSizeGradients.length > 0 || this._emitRateGradients && this._emitRateGradients.length > 0 || this._lifeTimeGradients && this._lifeTimeGradients.length > 0;
  }
  /**
   * Gets the current list of drag gradients.
   * You must use addDragGradient and removeDragGradient to update this list
   * @returns the list of drag gradients
   */
  getDragGradients() {
    return this._dragGradients;
  }
  /**
   * Gets the current list of limit velocity gradients.
   * You must use addLimitVelocityGradient and removeLimitVelocityGradient to update this list
   * @returns the list of limit velocity gradients
   */
  getLimitVelocityGradients() {
    return this._limitVelocityGradients;
  }
  /**
   * Gets the current list of color gradients.
   * You must use addColorGradient and removeColorGradient to update this list
   * @returns the list of color gradients
   */
  getColorGradients() {
    return this._colorGradients;
  }
  /**
   * Gets the current list of size gradients.
   * You must use addSizeGradient and removeSizeGradient to update this list
   * @returns the list of size gradients
   */
  getSizeGradients() {
    return this._sizeGradients;
  }
  /**
   * Gets the current list of color remap gradients.
   * You must use addColorRemapGradient and removeColorRemapGradient to update this list
   * @returns the list of color remap gradients
   */
  getColorRemapGradients() {
    return this._colorRemapGradients;
  }
  /**
   * Gets the current list of alpha remap gradients.
   * You must use addAlphaRemapGradient and removeAlphaRemapGradient to update this list
   * @returns the list of alpha remap gradients
   */
  getAlphaRemapGradients() {
    return this._alphaRemapGradients;
  }
  /**
   * Gets the current list of life time gradients.
   * You must use addLifeTimeGradient and removeLifeTimeGradient to update this list
   * @returns the list of life time gradients
   */
  getLifeTimeGradients() {
    return this._lifeTimeGradients;
  }
  /**
   * Gets the current list of angular speed gradients.
   * You must use addAngularSpeedGradient and removeAngularSpeedGradient to update this list
   * @returns the list of angular speed gradients
   */
  getAngularSpeedGradients() {
    return this._angularSpeedGradients;
  }
  /**
   * Gets the current list of velocity gradients.
   * You must use addVelocityGradient and removeVelocityGradient to update this list
   * @returns the list of velocity gradients
   */
  getVelocityGradients() {
    return this._velocityGradients;
  }
  /**
   * Gets the current list of start size gradients.
   * You must use addStartSizeGradient and removeStartSizeGradient to update this list
   * @returns the list of start size gradients
   */
  getStartSizeGradients() {
    return this._startSizeGradients;
  }
  /**
   * Gets the current list of emit rate gradients.
   * You must use addEmitRateGradient and removeEmitRateGradient to update this list
   * @returns the list of emit rate gradients
   */
  getEmitRateGradients() {
    return this._emitRateGradients;
  }
  /**
   * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
   * This only works when particleEmitterTyps is a BoxParticleEmitter
   */
  get direction1() {
    return this.particleEmitterType.direction1 ? this.particleEmitterType.direction1 : e.Zero();
  }
  set direction1(t) {
    this.particleEmitterType.direction1 && (this.particleEmitterType.direction1 = t);
  }
  /**
   * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
   * This only works when particleEmitterTyps is a BoxParticleEmitter
   */
  get direction2() {
    return this.particleEmitterType.direction2 ? this.particleEmitterType.direction2 : e.Zero();
  }
  set direction2(t) {
    this.particleEmitterType.direction2 && (this.particleEmitterType.direction2 = t);
  }
  /**
   * Minimum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
   * This only works when particleEmitterTyps is a BoxParticleEmitter
   */
  get minEmitBox() {
    return this.particleEmitterType.minEmitBox ? this.particleEmitterType.minEmitBox : e.Zero();
  }
  set minEmitBox(t) {
    this.particleEmitterType.minEmitBox && (this.particleEmitterType.minEmitBox = t);
  }
  /**
   * Maximum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
   * This only works when particleEmitterTyps is a BoxParticleEmitter
   */
  get maxEmitBox() {
    return this.particleEmitterType.maxEmitBox ? this.particleEmitterType.maxEmitBox : e.Zero();
  }
  set maxEmitBox(t) {
    this.particleEmitterType.maxEmitBox && (this.particleEmitterType.maxEmitBox = t);
  }
  /**
   * Gets or sets the billboard mode to use when isBillboardBased = true.
   * Value can be: ParticleSystem.BILLBOARDMODE_ALL, ParticleSystem.BILLBOARDMODE_Y, ParticleSystem.BILLBOARDMODE_STRETCHED
   */
  get billboardMode() {
    return this._billboardMode;
  }
  set billboardMode(t) {
    this._billboardMode !== t && (this._billboardMode = t, this._reset());
  }
  /**
   * Gets or sets a boolean indicating if the particles must be rendered as billboard or aligned with the direction
   */
  get isBillboardBased() {
    return this._isBillboardBased;
  }
  set isBillboardBased(t) {
    this._isBillboardBased !== t && (this._isBillboardBased = t, this._reset());
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
  set imageProcessingConfiguration(t) {
    this._attachImageProcessingConfiguration(t);
  }
  /**
   * Attaches a new image processing configuration to the Standard Material.
   * @param configuration
   */
  _attachImageProcessingConfiguration(t) {
    t !== this._imageProcessingConfiguration && (!t && this._scene ? this._imageProcessingConfiguration = this._scene.imageProcessingConfiguration : this._imageProcessingConfiguration = t);
  }
  /** @internal */
  _reset() {
  }
  /**
   * @internal
   */
  _removeGradientAndTexture(t, i, s) {
    if (!i)
      return this;
    let n = 0;
    for (const o of i) {
      if (o.gradient === t) {
        i.splice(n, 1);
        break;
      }
      n++;
    }
    return s && s.dispose(), this;
  }
  /**
   * Instantiates a particle system.
   * Particles are often small sprites used to simulate hard-to-reproduce phenomena like fire, smoke, water, or abstract visual effects like magic glitter and faery dust.
   * @param name The name of the particle system
   */
  constructor(t) {
    this.animations = [], this.renderingGroupId = 0, this.emitter = e.Zero(), this.emitRate = 10, this.manualEmitCount = -1, this.updateSpeed = 0.01, this.targetStopDuration = 0, this.disposeOnStop = !1, this.minEmitPower = 1, this.maxEmitPower = 1, this.minLifeTime = 1, this.maxLifeTime = 1, this.minSize = 1, this.maxSize = 1, this.minScaleX = 1, this.maxScaleX = 1, this.minScaleY = 1, this.maxScaleY = 1, this.minInitialRotation = 0, this.maxInitialRotation = 0, this.minAngularSpeed = 0, this.maxAngularSpeed = 0, this.layerMask = 268435455, this.customShader = null, this.preventAutoStart = !1, this.applyFog = !1, this._wasDispatched = !1, this._rootUrl = "", this.noiseStrength = new e(10, 10, 10), this.onAnimationEnd = null, this.blendMode = r.BLENDMODE_ONEONE, this.forceDepthWrite = !1, this.preWarmCycles = 0, this.preWarmStepOffset = 1, this.spriteCellChangeSpeed = 1, this.startSpriteCellID = 0, this.endSpriteCellID = 0, this.spriteCellWidth = 0, this.spriteCellHeight = 0, this.spriteCellLoop = !0, this.spriteRandomStartCell = !1, this.translationPivot = new h(0, 0), this.beginAnimationOnStart = !1, this.beginAnimationFrom = 0, this.beginAnimationTo = 60, this.beginAnimationLoop = !1, this.worldOffset = new e(0, 0, 0), this._useLogarithmicDepth = !1, this.gravity = e.Zero(), this._colorGradients = null, this._sizeGradients = null, this._lifeTimeGradients = null, this._angularSpeedGradients = null, this._velocityGradients = null, this._limitVelocityGradients = null, this._dragGradients = null, this._emitRateGradients = null, this._startSizeGradients = null, this._rampGradients = null, this._colorRemapGradients = null, this._alphaRemapGradients = null, this.startDelay = 0, this.limitVelocityDamping = 0.4, this.color1 = new a(1, 1, 1, 1), this.color2 = new a(1, 1, 1, 1), this.colorDead = new a(0, 0, 0, 1), this.textureMask = new a(1, 1, 1, 1), this._isSubEmitter = !1, this._billboardMode = 7, this._isBillboardBased = !0, this._imageProcessingConfigurationDefines = new d(), this.id = t, this.name = t;
  }
  /**
   * Creates a Point Emitter for the particle system (emits directly from the emitter position)
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
   */
  createPointEmitter(t, i) {
    throw new Error("Method not implemented.");
  }
  /**
   * Creates a Hemisphere Emitter for the particle system (emits along the hemisphere radius)
   * @param radius The radius of the hemisphere to emit from
   * @param radiusRange The range of the hemisphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
   */
  createHemisphericEmitter(t = 1, i = 1) {
    throw new Error("Method not implemented.");
  }
  /**
   * Creates a Sphere Emitter for the particle system (emits along the sphere radius)
   * @param radius The radius of the sphere to emit from
   * @param radiusRange The range of the sphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
   */
  createSphereEmitter(t = 1, i = 1) {
    throw new Error("Method not implemented.");
  }
  /**
   * Creates a Directed Sphere Emitter for the particle system (emits between direction1 and direction2)
   * @param radius The radius of the sphere to emit from
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the sphere
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the sphere
   */
  createDirectedSphereEmitter(t = 1, i = new e(0, 1, 0), s = new e(0, 1, 0)) {
    throw new Error("Method not implemented.");
  }
  /**
   * Creates a Cylinder Emitter for the particle system (emits from the cylinder to the particle position)
   * @param radius The radius of the emission cylinder
   * @param height The height of the emission cylinder
   * @param radiusRange The range of emission [0-1] 0 Surface only, 1 Entire Radius
   * @param directionRandomizer How much to randomize the particle direction [0-1]
   */
  createCylinderEmitter(t = 1, i = 1, s = 1, n = 0) {
    throw new Error("Method not implemented.");
  }
  /**
   * Creates a Directed Cylinder Emitter for the particle system (emits between direction1 and direction2)
   * @param radius The radius of the cylinder to emit from
   * @param height The height of the emission cylinder
   * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the cylinder
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the cylinder
   */
  createDirectedCylinderEmitter(t = 1, i = 1, s = 1, n = new e(0, 1, 0), o = new e(0, 1, 0)) {
    throw new Error("Method not implemented.");
  }
  /**
   * Creates a Cone Emitter for the particle system (emits from the cone to the particle position)
   * @param radius The radius of the cone to emit from
   * @param angle The base angle of the cone
   */
  createConeEmitter(t = 1, i = Math.PI / 4) {
    throw new Error("Method not implemented.");
  }
  /**
   * Creates a Box Emitter for the particle system. (emits between direction1 and direction2 from withing the box defined by minEmitBox and maxEmitBox)
   * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
   * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
   * @param minEmitBox Particles are emitted from the box between minEmitBox and maxEmitBox
   * @param maxEmitBox  Particles are emitted from the box between minEmitBox and maxEmitBox
   */
  createBoxEmitter(t, i, s, n) {
    throw new Error("Method not implemented.");
  }
}
r.BLENDMODE_ONEONE = 0;
r.BLENDMODE_STANDARD = 1;
r.BLENDMODE_ADD = 2;
r.BLENDMODE_MULTIPLY = 3;
r.BLENDMODE_MULTIPLYADD = 4;
export {
  r as B
};
//# sourceMappingURL=baseParticleSystem-Bx0fg-75.js.map
