import { P as f, Y as d, d as E, _ as A, O as u, a6 as m, a7 as p, a0 as S, a1 as F, L as P, Z as b, a8 as g } from "./embed-entry-Bb6cfUYP.js";
import { P as I } from "./perfCounter-B6haAspn.js";
import "./engine.dynamicBuffer-C4rqCo4b.js";
class C {
  /**
   * constructor
   * @param frameSampleSize The number of samples required to saturate the sliding window
   */
  constructor(e = 30) {
    this._enabled = !0, this._rollingFrameTime = new U(e);
  }
  /**
   * Samples current frame
   * @param timeMs A timestamp in milliseconds of the current frame to compare with other frames
   */
  sampleFrame(e = f.Now) {
    if (this._enabled) {
      if (this._lastFrameTimeMs != null) {
        const t = e - this._lastFrameTimeMs;
        this._rollingFrameTime.add(t);
      }
      this._lastFrameTimeMs = e;
    }
  }
  /**
   * Returns the average frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
   */
  get averageFrameTime() {
    return this._rollingFrameTime.average;
  }
  /**
   * Returns the variance frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
   */
  get averageFrameTimeVariance() {
    return this._rollingFrameTime.variance;
  }
  /**
   * Returns the frame time of the most recent frame
   */
  get instantaneousFrameTime() {
    return this._rollingFrameTime.history(0);
  }
  /**
   * Returns the average framerate in frames per second over the sliding window (or the subset of frames sampled so far)
   */
  get averageFPS() {
    return 1e3 / this._rollingFrameTime.average;
  }
  /**
   * Returns the average framerate in frames per second using the most recent frame time
   */
  get instantaneousFPS() {
    const e = this._rollingFrameTime.history(0);
    return e === 0 ? 0 : 1e3 / e;
  }
  /**
   * Returns true if enough samples have been taken to completely fill the sliding window
   */
  get isSaturated() {
    return this._rollingFrameTime.isSaturated();
  }
  /**
   * Enables contributions to the sliding window sample set
   */
  enable() {
    this._enabled = !0;
  }
  /**
   * Disables contributions to the sliding window sample set
   * Samples will not be interpolated over the disabled period
   */
  disable() {
    this._enabled = !1, this._lastFrameTimeMs = null;
  }
  /**
   * Returns true if sampling is enabled
   */
  get isEnabled() {
    return this._enabled;
  }
  /**
   * Resets performance monitor
   */
  reset() {
    this._lastFrameTimeMs = null, this._rollingFrameTime.reset();
  }
}
class U {
  /**
   * constructor
   * @param length The number of samples required to saturate the sliding window
   */
  constructor(e) {
    this._samples = new Array(e), this.reset();
  }
  /**
   * Adds a sample to the sample set
   * @param v The sample value
   */
  add(e) {
    let t;
    if (this.isSaturated()) {
      const s = this._samples[this._pos];
      t = s - this.average, this.average -= t / (this._sampleCount - 1), this._m2 -= t * (s - this.average);
    } else
      this._sampleCount++;
    t = e - this.average, this.average += t / this._sampleCount, this._m2 += t * (e - this.average), this.variance = this._m2 / (this._sampleCount - 1), this._samples[this._pos] = e, this._pos++, this._pos %= this._samples.length;
  }
  /**
   * Returns previously added values or null if outside of history or outside the sliding window domain
   * @param i Index in history. For example, pass 0 for the most recent value and 1 for the value before that
   * @returns Value previously recorded with add() or null if outside of range
   */
  history(e) {
    if (e >= this._sampleCount || e >= this._samples.length)
      return 0;
    const t = this._wrapPosition(this._pos - 1);
    return this._samples[this._wrapPosition(t - e)];
  }
  /**
   * Returns true if enough samples have been taken to completely fill the sliding window
   * @returns true if sample-set saturated
   */
  isSaturated() {
    return this._sampleCount >= this._samples.length;
  }
  /**
   * Resets the rolling average (equivalent to 0 samples taken so far)
   */
  reset() {
    this.average = 0, this.variance = 0, this._sampleCount = 0, this._pos = 0, this._m2 = 0;
  }
  /**
   * Wraps a value around the sample range boundaries
   * @param i Position in sample range, for example if the sample length is 5, and i is -3, then 2 will be returned.
   * @returns Wrapped position in sample range
   */
  _wrapPosition(e) {
    const t = this._samples.length;
    return (e % t + t) % t;
  }
}
function L(h, e, t = !1, s) {
  switch (h) {
    case 3: {
      const i = e instanceof ArrayBuffer ? new Int8Array(e) : new Int8Array(e);
      return s && i.set(new Int8Array(s)), i;
    }
    case 0: {
      const i = e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e);
      return s && i.set(new Uint8Array(s)), i;
    }
    case 4: {
      const i = e instanceof ArrayBuffer ? new Int16Array(e) : new Int16Array(t ? e / 2 : e);
      return s && i.set(new Int16Array(s)), i;
    }
    case 5:
    case 8:
    case 9:
    case 10:
    case 2: {
      const i = e instanceof ArrayBuffer ? new Uint16Array(e) : new Uint16Array(t ? e / 2 : e);
      return s && i.set(new Uint16Array(s)), i;
    }
    case 6: {
      const i = e instanceof ArrayBuffer ? new Int32Array(e) : new Int32Array(t ? e / 4 : e);
      return s && i.set(new Int32Array(s)), i;
    }
    case 7:
    case 11:
    case 12:
    case 13:
    case 14:
    case 15: {
      const i = e instanceof ArrayBuffer ? new Uint32Array(e) : new Uint32Array(t ? e / 4 : e);
      return s && i.set(new Uint32Array(s)), i;
    }
    case 1: {
      const i = e instanceof ArrayBuffer ? new Float32Array(e) : new Float32Array(t ? e / 4 : e);
      return s && i.set(new Float32Array(s)), i;
    }
  }
  const r = e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e);
  return s && r.set(new Uint8Array(s)), r;
}
d.prototype._readTexturePixelsSync = function(h, e, t, s = -1, r = 0, i = null, a = !0, o = !1, l = 0, _ = 0) {
  const c = this._gl;
  if (!c)
    throw new Error("Engine does not have gl rendering context.");
  if (!this._dummyFramebuffer) {
    const R = c.createFramebuffer();
    if (!R)
      throw new Error("Unable to create dummy framebuffer");
    this._dummyFramebuffer = R;
  }
  c.bindFramebuffer(c.FRAMEBUFFER, this._dummyFramebuffer), s > -1 ? c.framebufferTexture2D(c.FRAMEBUFFER, c.COLOR_ATTACHMENT0, c.TEXTURE_CUBE_MAP_POSITIVE_X + s, h._hardwareTexture?.underlyingResource, r) : c.framebufferTexture2D(c.FRAMEBUFFER, c.COLOR_ATTACHMENT0, c.TEXTURE_2D, h._hardwareTexture?.underlyingResource, r);
  let T = h.type !== void 0 ? this._getWebGLTextureType(h.type) : c.UNSIGNED_BYTE;
  if (o)
    i || (i = L(h.type, 4 * e * t));
  else switch (T) {
    case c.UNSIGNED_BYTE:
      i || (i = new Uint8Array(4 * e * t)), T = c.UNSIGNED_BYTE;
      break;
    default:
      i || (i = new Float32Array(4 * e * t)), T = c.FLOAT;
      break;
  }
  return a && this.flushFramebuffer(), c.readPixels(l, _, e, t, c.RGBA, T, i), c.bindFramebuffer(c.FRAMEBUFFER, this._currentFramebuffer), i;
};
d.prototype._readTexturePixels = function(h, e, t, s = -1, r = 0, i = null, a = !0, o = !1, l = 0, _ = 0) {
  return Promise.resolve(this._readTexturePixelsSync(h, e, t, s, r, i, a, o, l, _));
};
class n extends d {
  /**
   * Returns the current npm package of the sdk
   */
  // Not mixed with Version for tooling purpose.
  static get NpmPackage() {
    return d.NpmPackage;
  }
  /**
   * Returns the current version of the framework
   */
  static get Version() {
    return d.Version;
  }
  /** Gets the list of created engines */
  static get Instances() {
    return E.Instances;
  }
  /**
   * Gets the latest created engine
   */
  static get LastCreatedEngine() {
    return E.LastCreatedEngine;
  }
  /**
   * Gets the latest created scene
   */
  static get LastCreatedScene() {
    return E.LastCreatedScene;
  }
  /** @internal */
  /**
   * Engine abstraction for loading and creating an image bitmap from a given source string.
   * @param imageSource source to load the image from.
   * @param options An object that sets options for the image's extraction.
   * @returns ImageBitmap.
   */
  _createImageBitmapFromSource(e, t) {
    return new Promise((r, i) => {
      const a = new Image();
      a.onload = () => {
        a.decode().then(() => {
          this.createImageBitmap(a, t).then((o) => {
            r(o);
          });
        });
      }, a.onerror = () => {
        i(`Error loading image ${a.src}`);
      }, a.src = e;
    });
  }
  /**
   * Engine abstraction for createImageBitmap
   * @param image source for image
   * @param options An object that sets options for the image's extraction.
   * @returns ImageBitmap
   */
  createImageBitmap(e, t) {
    return createImageBitmap(e, t);
  }
  /**
   * Resize an image and returns the image data as an uint8array
   * @param image image to resize
   * @param bufferWidth destination buffer width
   * @param bufferHeight destination buffer height
   * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
   */
  resizeImageBitmap(e, t, s) {
    const i = this.createCanvas(t, s).getContext("2d");
    if (!i)
      throw new Error("Unable to get 2d context for resizeImageBitmap");
    return i.drawImage(e, 0, 0), i.getImageData(0, 0, t, s).data;
  }
  /**
   * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
   * @param flag defines which part of the materials must be marked as dirty
   * @param predicate defines a predicate used to filter which materials should be affected
   */
  static MarkAllMaterialsAsDirty(e, t) {
    for (let s = 0; s < n.Instances.length; s++) {
      const r = n.Instances[s];
      for (let i = 0; i < r.scenes.length; i++)
        r.scenes[i].markAllMaterialsAsDirty(e, t);
    }
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Method called to create the default loading screen.
   * This can be overridden in your own app.
   * @param canvas The rendering canvas element
   * @returns The loading screen
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static DefaultLoadingScreenFactory(e) {
    throw A("LoadingScreen");
  }
  get _supportsHardwareTextureRescaling() {
    return !!n._RescalePostProcessFactory;
  }
  /**
   * Gets the performance monitor attached to this engine
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#engineinstrumentation
   */
  get performanceMonitor() {
    return this._performanceMonitor;
  }
  /**
   * (WebGPU only) True (default) to be in compatibility mode, meaning rendering all existing scenes without artifacts (same rendering than WebGL).
   * Setting the property to false will improve performances but may not work in some scenes if some precautions are not taken.
   * See https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode for more details
   */
  get compatibilityMode() {
    return this._compatibilityMode;
  }
  set compatibilityMode(e) {
    this._compatibilityMode = !0;
  }
  // Events
  /**
   * Gets the HTML element used to attach event listeners
   * @returns a HTML element
   */
  getInputElement() {
    return this._renderingCanvas;
  }
  /**
   * Creates a new engine
   * @param canvasOrContext defines the canvas or WebGL context to use for rendering. If you provide a WebGL context, Babylon.js will not hook events on the canvas (like pointers, keyboards, etc...) so no event observables will be available. This is mostly used when Babylon.js is used as a plugin on a system which already used the WebGL context
   * @param antialias defines enable antialiasing (default: false)
   * @param options defines further options to be sent to the getContext() function
   * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
   */
  constructor(e, t, s, r = !1) {
    if (super(e, t, s, r), this.enableOfflineSupport = !1, this.disableManifestCheck = !1, this.disableContextMenu = !0, this.scenes = [], this._virtualScenes = new Array(), this.onNewSceneAddedObservable = new u(), this.postProcesses = [], this.isPointerLock = !1, this.onResizeObservable = new u(), this.onCanvasBlurObservable = new u(), this.onCanvasFocusObservable = new u(), this.onCanvasPointerOutObservable = new u(), this.onBeginFrameObservable = new u(), this.customAnimationFrameRequester = null, this.onEndFrameObservable = new u(), this.onBeforeShaderCompilationObservable = new u(), this.onAfterShaderCompilationObservable = new u(), this._deterministicLockstep = !1, this._lockstepMaxSteps = 4, this._timeStep = 1 / 60, this._fps = 60, this._deltaTime = 0, this._drawCalls = new I(), this.canvasTabIndex = 1, this.disablePerformanceMonitorInBackground = !1, this._performanceMonitor = new C(), this._compatibilityMode = !0, this.currentRenderPassId = 0, this._renderPassNames = ["main"], n.Instances.push(this), !!e && (this._features.supportRenderPasses = !0, s = this._creationOptions, e.getContext)) {
      const i = e;
      this._sharedInit(i);
    }
  }
  _initGLContext() {
    super._initGLContext(), this._rescalePostProcess = null;
  }
  /**
   * Shared initialization across engines types.
   * @param canvas The canvas associated with this instance of the engine.
   */
  _sharedInit(e) {
    super._sharedInit(e), this._onCanvasFocus = () => {
      this.onCanvasFocusObservable.notifyObservers(this);
    }, this._onCanvasBlur = () => {
      this.onCanvasBlurObservable.notifyObservers(this);
    }, this._onCanvasContextMenu = (s) => {
      this.disableContextMenu && s.preventDefault();
    }, e.addEventListener("focus", this._onCanvasFocus), e.addEventListener("blur", this._onCanvasBlur), e.addEventListener("contextmenu", this._onCanvasContextMenu), this._onBlur = () => {
      this.disablePerformanceMonitorInBackground && this._performanceMonitor.disable(), this._windowIsBackground = !0;
    }, this._onFocus = () => {
      this.disablePerformanceMonitorInBackground && this._performanceMonitor.enable(), this._windowIsBackground = !1;
    }, this._onCanvasPointerOut = (s) => {
      document.elementFromPoint(s.clientX, s.clientY) !== e && this.onCanvasPointerOutObservable.notifyObservers(s);
    };
    const t = this.getHostWindow();
    t && typeof t.addEventListener == "function" && (t.addEventListener("blur", this._onBlur), t.addEventListener("focus", this._onFocus)), e.addEventListener("pointerout", this._onCanvasPointerOut), this._creationOptions.doNotHandleTouchAction || this._disableTouchAction(), !n.audioEngine && this._creationOptions.audioEngine && n.AudioEngineFactory && (n.audioEngine = n.AudioEngineFactory(this.getRenderingCanvas(), this.getAudioContext(), this.getAudioDestination())), m() && (this._onFullscreenChange = () => {
      this.isFullscreen = !!document.fullscreenElement, this.isFullscreen && this._pointerLockRequested && e && n._RequestPointerlock(e);
    }, document.addEventListener("fullscreenchange", this._onFullscreenChange, !1), document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, !1), this._onPointerLockChange = () => {
      this.isPointerLock = document.pointerLockElement === e;
    }, document.addEventListener("pointerlockchange", this._onPointerLockChange, !1), document.addEventListener("webkitpointerlockchange", this._onPointerLockChange, !1)), this.enableOfflineSupport = n.OfflineProviderFactory !== void 0, this._deterministicLockstep = !!this._creationOptions.deterministicLockstep, this._lockstepMaxSteps = this._creationOptions.lockstepMaxSteps || 0, this._timeStep = this._creationOptions.timeStep || 1 / 60;
  }
  /** @internal */
  _verifyPointerLock() {
    this._onPointerLockChange?.();
  }
  /**
   * Gets current aspect ratio
   * @param viewportOwner defines the camera to use to get the aspect ratio
   * @param useScreen defines if screen size must be used (or the current render target if any)
   * @returns a number defining the aspect ratio
   */
  getAspectRatio(e, t = !1) {
    const s = e.viewport;
    return this.getRenderWidth(t) * s.width / (this.getRenderHeight(t) * s.height);
  }
  /**
   * Gets current screen aspect ratio
   * @returns a number defining the aspect ratio
   */
  getScreenAspectRatio() {
    return this.getRenderWidth(!0) / this.getRenderHeight(!0);
  }
  /**
   * Gets the client rect of the HTML canvas attached with the current webGL context
   * @returns a client rectangle
   */
  getRenderingCanvasClientRect() {
    return this._renderingCanvas ? this._renderingCanvas.getBoundingClientRect() : null;
  }
  /**
   * Gets the client rect of the HTML element used for events
   * @returns a client rectangle
   */
  getInputElementClientRect() {
    return this._renderingCanvas ? this.getInputElement().getBoundingClientRect() : null;
  }
  /**
   * Gets a boolean indicating that the engine is running in deterministic lock step mode
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
   * @returns true if engine is in deterministic lock step mode
   */
  isDeterministicLockStep() {
    return this._deterministicLockstep;
  }
  /**
   * Gets the max steps when engine is running in deterministic lock step
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
   * @returns the max steps
   */
  getLockstepMaxSteps() {
    return this._lockstepMaxSteps;
  }
  /**
   * Returns the time in ms between steps when using deterministic lock step.
   * @returns time step in (ms)
   */
  getTimeStep() {
    return this._timeStep * 1e3;
  }
  /**
   * Force the mipmap generation for the given render target texture
   * @param texture defines the render target texture to use
   * @param unbind defines whether or not to unbind the texture after generation. Defaults to true.
   */
  generateMipMapsForCubemap(e, t = !0) {
    if (e.generateMipMaps) {
      const s = this._gl;
      this._bindTextureDirectly(s.TEXTURE_CUBE_MAP, e, !0), s.generateMipmap(s.TEXTURE_CUBE_MAP), t && this._bindTextureDirectly(s.TEXTURE_CUBE_MAP, null);
    }
  }
  /** States */
  /**
   * Gets a boolean indicating if depth writing is enabled
   * @returns the current depth writing state
   */
  getDepthWrite() {
    return this._depthCullingState.depthMask;
  }
  /**
   * Enable or disable depth writing
   * @param enable defines the state to set
   */
  setDepthWrite(e) {
    this._depthCullingState.depthMask = e;
  }
  /**
   * Gets a boolean indicating if stencil buffer is enabled
   * @returns the current stencil buffer state
   */
  getStencilBuffer() {
    return this._stencilState.stencilTest;
  }
  /**
   * Enable or disable the stencil buffer
   * @param enable defines if the stencil buffer must be enabled or disabled
   */
  setStencilBuffer(e) {
    this._stencilState.stencilTest = e;
  }
  /**
   * Gets the current stencil mask
   * @returns a number defining the new stencil mask to use
   */
  getStencilMask() {
    return this._stencilState.stencilMask;
  }
  /**
   * Sets the current stencil mask
   * @param mask defines the new stencil mask to use
   */
  setStencilMask(e) {
    this._stencilState.stencilMask = e;
  }
  /**
   * Gets the current stencil function
   * @returns a number defining the stencil function to use
   */
  getStencilFunction() {
    return this._stencilState.stencilFunc;
  }
  /**
   * Gets the current stencil reference value
   * @returns a number defining the stencil reference value to use
   */
  getStencilFunctionReference() {
    return this._stencilState.stencilFuncRef;
  }
  /**
   * Gets the current stencil mask
   * @returns a number defining the stencil mask to use
   */
  getStencilFunctionMask() {
    return this._stencilState.stencilFuncMask;
  }
  /**
   * Sets the current stencil function
   * @param stencilFunc defines the new stencil function to use
   */
  setStencilFunction(e) {
    this._stencilState.stencilFunc = e;
  }
  /**
   * Sets the current stencil reference
   * @param reference defines the new stencil reference to use
   */
  setStencilFunctionReference(e) {
    this._stencilState.stencilFuncRef = e;
  }
  /**
   * Sets the current stencil mask
   * @param mask defines the new stencil mask to use
   */
  setStencilFunctionMask(e) {
    this._stencilState.stencilFuncMask = e;
  }
  /**
   * Gets the current stencil operation when stencil fails
   * @returns a number defining stencil operation to use when stencil fails
   */
  getStencilOperationFail() {
    return this._stencilState.stencilOpStencilFail;
  }
  /**
   * Gets the current stencil operation when depth fails
   * @returns a number defining stencil operation to use when depth fails
   */
  getStencilOperationDepthFail() {
    return this._stencilState.stencilOpDepthFail;
  }
  /**
   * Gets the current stencil operation when stencil passes
   * @returns a number defining stencil operation to use when stencil passes
   */
  getStencilOperationPass() {
    return this._stencilState.stencilOpStencilDepthPass;
  }
  /**
   * Sets the stencil operation to use when stencil fails
   * @param operation defines the stencil operation to use when stencil fails
   */
  setStencilOperationFail(e) {
    this._stencilState.stencilOpStencilFail = e;
  }
  /**
   * Sets the stencil operation to use when depth fails
   * @param operation defines the stencil operation to use when depth fails
   */
  setStencilOperationDepthFail(e) {
    this._stencilState.stencilOpDepthFail = e;
  }
  /**
   * Sets the stencil operation to use when stencil passes
   * @param operation defines the stencil operation to use when stencil passes
   */
  setStencilOperationPass(e) {
    this._stencilState.stencilOpStencilDepthPass = e;
  }
  /**
   * Sets a boolean indicating if the dithering state is enabled or disabled
   * @param value defines the dithering state
   */
  setDitheringState(e) {
    e ? this._gl.enable(this._gl.DITHER) : this._gl.disable(this._gl.DITHER);
  }
  /**
   * Sets a boolean indicating if the rasterizer state is enabled or disabled
   * @param value defines the rasterizer state
   */
  setRasterizerState(e) {
    e ? this._gl.disable(this._gl.RASTERIZER_DISCARD) : this._gl.enable(this._gl.RASTERIZER_DISCARD);
  }
  /**
   * Gets the current depth function
   * @returns a number defining the depth function
   */
  getDepthFunction() {
    return this._depthCullingState.depthFunc;
  }
  /**
   * Sets the current depth function
   * @param depthFunc defines the function to use
   */
  setDepthFunction(e) {
    this._depthCullingState.depthFunc = e;
  }
  /**
   * Sets the current depth function to GREATER
   */
  setDepthFunctionToGreater() {
    this.setDepthFunction(516);
  }
  /**
   * Sets the current depth function to GEQUAL
   */
  setDepthFunctionToGreaterOrEqual() {
    this.setDepthFunction(518);
  }
  /**
   * Sets the current depth function to LESS
   */
  setDepthFunctionToLess() {
    this.setDepthFunction(513);
  }
  /**
   * Sets the current depth function to LEQUAL
   */
  setDepthFunctionToLessOrEqual() {
    this.setDepthFunction(515);
  }
  /**
   * Caches the state of the stencil buffer
   */
  cacheStencilState() {
    this._cachedStencilBuffer = this.getStencilBuffer(), this._cachedStencilFunction = this.getStencilFunction(), this._cachedStencilMask = this.getStencilMask(), this._cachedStencilOperationPass = this.getStencilOperationPass(), this._cachedStencilOperationFail = this.getStencilOperationFail(), this._cachedStencilOperationDepthFail = this.getStencilOperationDepthFail(), this._cachedStencilReference = this.getStencilFunctionReference();
  }
  /**
   * Restores the state of the stencil buffer
   */
  restoreStencilState() {
    this.setStencilFunction(this._cachedStencilFunction), this.setStencilMask(this._cachedStencilMask), this.setStencilBuffer(this._cachedStencilBuffer), this.setStencilOperationPass(this._cachedStencilOperationPass), this.setStencilOperationFail(this._cachedStencilOperationFail), this.setStencilOperationDepthFail(this._cachedStencilOperationDepthFail), this.setStencilFunctionReference(this._cachedStencilReference);
  }
  /**
   * Directly set the WebGL Viewport
   * @param x defines the x coordinate of the viewport (in screen space)
   * @param y defines the y coordinate of the viewport (in screen space)
   * @param width defines the width of the viewport (in screen space)
   * @param height defines the height of the viewport (in screen space)
   * @returns the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state
   */
  setDirectViewport(e, t, s, r) {
    const i = this._cachedViewport;
    return this._cachedViewport = null, this._viewport(e, t, s, r), i;
  }
  /**
   * Executes a scissor clear (ie. a clear on a specific portion of the screen)
   * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
   * @param y defines the y-coordinate of the corner of the clear rectangle
   * @param width defines the width of the clear rectangle
   * @param height defines the height of the clear rectangle
   * @param clearColor defines the clear color
   */
  scissorClear(e, t, s, r, i) {
    this.enableScissor(e, t, s, r), this.clear(i, !0, !0, !0), this.disableScissor();
  }
  /**
   * Enable scissor test on a specific rectangle (ie. render will only be executed on a specific portion of the screen)
   * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
   * @param y defines the y-coordinate of the corner of the clear rectangle
   * @param width defines the width of the clear rectangle
   * @param height defines the height of the clear rectangle
   */
  enableScissor(e, t, s, r) {
    const i = this._gl;
    i.enable(i.SCISSOR_TEST), i.scissor(e, t, s, r);
  }
  /**
   * Disable previously set scissor test rectangle
   */
  disableScissor() {
    const e = this._gl;
    e.disable(e.SCISSOR_TEST);
  }
  /**
   * @internal
   */
  _reportDrawCall(e = 1) {
    this._drawCalls.addCount(e, !1);
  }
  /**
   * @internal
   */
  _loadFileAsync(e, t, s) {
    return new Promise((r, i) => {
      this._loadFile(e, (a) => {
        r(a);
      }, void 0, t, s, (a, o) => {
        i(o);
      });
    });
  }
  /**
   * Gets the source code of the vertex shader associated with a specific webGL program
   * @param program defines the program to use
   * @returns a string containing the source code of the vertex shader associated with the program
   */
  getVertexShaderSource(e) {
    const t = this._gl.getAttachedShaders(e);
    return t ? this._gl.getShaderSource(t[0]) : null;
  }
  /**
   * Gets the source code of the fragment shader associated with a specific webGL program
   * @param program defines the program to use
   * @returns a string containing the source code of the fragment shader associated with the program
   */
  getFragmentShaderSource(e) {
    const t = this._gl.getAttachedShaders(e);
    return t ? this._gl.getShaderSource(t[1]) : null;
  }
  /**
   * Sets a depth stencil texture from a render target to the according uniform.
   * @param channel The texture channel
   * @param uniform The uniform to set
   * @param texture The render target texture containing the depth stencil texture to apply
   * @param name The texture name
   */
  setDepthStencilTexture(e, t, s, r) {
    e !== void 0 && (t && (this._boundUniforms[e] = t), !s || !s.depthStencilTexture ? this._setTexture(e, null, void 0, void 0, r) : this._setTexture(e, s, !1, !0, r));
  }
  /**
   * Sets a texture to the webGL context from a postprocess
   * @param channel defines the channel to use
   * @param postProcess defines the source postprocess
   * @param name name of the channel
   */
  setTextureFromPostProcess(e, t, s) {
    let r = null;
    t && (t._forcedOutputTexture ? r = t._forcedOutputTexture : t._textures.data[t._currentRenderTextureInd] && (r = t._textures.data[t._currentRenderTextureInd])), this._bindTexture(e, r?.texture ?? null, s);
  }
  /**
   * Binds the output of the passed in post process to the texture channel specified
   * @param channel The channel the texture should be bound to
   * @param postProcess The post process which's output should be bound
   * @param name name of the channel
   */
  setTextureFromPostProcessOutput(e, t, s) {
    this._bindTexture(e, t?._outputTexture?.texture ?? null, s);
  }
  /**
   * sets the object from which width and height will be taken from when getting render width and height
   * Will fallback to the gl object
   * @param dimensions the framebuffer width and height that will be used.
   */
  set framebufferDimensionsObject(e) {
    this._framebufferDimensionsObject = e, this._framebufferDimensionsObject && this.onResizeObservable.notifyObservers(this);
  }
  _rebuildBuffers() {
    for (const e of this.scenes)
      e.resetCachedMaterial(), e._rebuildGeometries();
    for (const e of this._virtualScenes)
      e.resetCachedMaterial(), e._rebuildGeometries();
    super._rebuildBuffers();
  }
  _rebuildTextures() {
    for (const e of this.scenes)
      e._rebuildTextures();
    for (const e of this._virtualScenes)
      e._rebuildTextures();
    super._rebuildTextures();
  }
  /** @internal */
  _renderFrame() {
    for (let e = 0; e < this._activeRenderLoops.length; e++) {
      const t = this._activeRenderLoops[e];
      t();
    }
  }
  _cancelFrame() {
    if (this.customAnimationFrameRequester) {
      if (this._frameHandler !== 0) {
        this._frameHandler = 0;
        const { cancelAnimationFrame: e } = this.customAnimationFrameRequester;
        e && e(this.customAnimationFrameRequester.requestID);
      }
    } else
      super._cancelFrame();
  }
  _renderLoop() {
    if (this._frameHandler = 0, !this._contextWasLost) {
      let e = !0;
      (this.isDisposed || !this.renderEvenInBackground && this._windowIsBackground) && (e = !1), e && (this.beginFrame(), this._renderViews() || this._renderFrame(), this.endFrame());
    }
    this._frameHandler === 0 && (this.customAnimationFrameRequester ? (this.customAnimationFrameRequester.requestID = this._queueNewFrame(this.customAnimationFrameRequester.renderFunction || this._boundRenderFunction, this.customAnimationFrameRequester), this._frameHandler = this.customAnimationFrameRequester.requestID) : this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow()));
  }
  /** @internal */
  _renderViews() {
    return !1;
  }
  /**
   * Toggle full screen mode
   * @param requestPointerLock defines if a pointer lock should be requested from the user
   */
  switchFullscreen(e) {
    this.isFullscreen ? this.exitFullscreen() : this.enterFullscreen(e);
  }
  /**
   * Enters full screen mode
   * @param requestPointerLock defines if a pointer lock should be requested from the user
   */
  enterFullscreen(e) {
    this.isFullscreen || (this._pointerLockRequested = e, this._renderingCanvas && n._RequestFullscreen(this._renderingCanvas));
  }
  /**
   * Exits full screen mode
   */
  exitFullscreen() {
    this.isFullscreen && n._ExitFullscreen();
  }
  /**
   * Enters Pointerlock mode
   */
  enterPointerlock() {
    this._renderingCanvas && n._RequestPointerlock(this._renderingCanvas);
  }
  /**
   * Exits Pointerlock mode
   */
  exitPointerlock() {
    n._ExitPointerlock();
  }
  /**
   * Begin a new frame
   */
  beginFrame() {
    this._measureFps(), this.onBeginFrameObservable.notifyObservers(this), super.beginFrame();
  }
  /**
   * End the current frame
   */
  endFrame() {
    super.endFrame(), this.onEndFrameObservable.notifyObservers(this);
  }
  /**
   * Force a specific size of the canvas
   * @param width defines the new canvas' width
   * @param height defines the new canvas' height
   * @param forceSetSize true to force setting the sizes of the underlying canvas
   * @returns true if the size was changed
   */
  setSize(e, t, s = !1) {
    if (!this._renderingCanvas || !super.setSize(e, t, s))
      return !1;
    if (this.scenes) {
      for (let r = 0; r < this.scenes.length; r++) {
        const i = this.scenes[r];
        for (let a = 0; a < i.cameras.length; a++) {
          const o = i.cameras[a];
          o._currentRenderId = 0;
        }
      }
      this.onResizeObservable.hasObservers() && this.onResizeObservable.notifyObservers(this);
    }
    return !0;
  }
  _deletePipelineContext(e) {
    const t = e;
    t && t.program && t.transformFeedback && (this.deleteTransformFeedback(t.transformFeedback), t.transformFeedback = null), super._deletePipelineContext(e);
  }
  createShaderProgram(e, t, s, r, i, a = null) {
    i = i || this._gl, this.onBeforeShaderCompilationObservable.notifyObservers(this);
    const o = super.createShaderProgram(e, t, s, r, i, a);
    return this.onAfterShaderCompilationObservable.notifyObservers(this), o;
  }
  _createShaderProgram(e, t, s, r, i = null) {
    const a = r.createProgram();
    if (e.program = a, !a)
      throw new Error("Unable to create program");
    if (r.attachShader(a, t), r.attachShader(a, s), this.webGLVersion > 1 && i) {
      const o = this.createTransformFeedback();
      this.bindTransformFeedback(o), this.setTranformFeedbackVaryings(a, i), e.transformFeedback = o;
    }
    return r.linkProgram(a), this.webGLVersion > 1 && i && this.bindTransformFeedback(null), e.context = r, e.vertexShader = t, e.fragmentShader = s, e.isParallelCompiled || this._finalizePipelineContext(e), a;
  }
  /**
   * @internal
   */
  _releaseTexture(e) {
    super._releaseTexture(e);
  }
  /**
   * @internal
   */
  _releaseRenderTargetWrapper(e) {
    super._releaseRenderTargetWrapper(e), this.scenes.forEach((t) => {
      t.postProcesses.forEach((s) => {
        s._outputTexture === e && (s._outputTexture = null);
      }), t.cameras.forEach((s) => {
        s._postProcesses.forEach((r) => {
          r && r._outputTexture === e && (r._outputTexture = null);
        });
      });
    });
  }
  /**
   * Gets the names of the render passes that are currently created
   * @returns list of the render pass names
   */
  getRenderPassNames() {
    return this._renderPassNames;
  }
  /**
   * Gets the name of the current render pass
   * @returns name of the current render pass
   */
  getCurrentRenderPassName() {
    return this._renderPassNames[this.currentRenderPassId];
  }
  /**
   * Creates a render pass id
   * @param name Name of the render pass (for debug purpose only)
   * @returns the id of the new render pass
   */
  createRenderPassId(e) {
    const t = ++n._RenderPassIdCounter;
    return this._renderPassNames[t] = e ?? "NONAME", t;
  }
  /**
   * Releases a render pass id
   * @param id id of the render pass to release
   */
  releaseRenderPassId(e) {
    this._renderPassNames[e] = void 0;
    for (let t = 0; t < this.scenes.length; ++t) {
      const s = this.scenes[t];
      for (let r = 0; r < s.meshes.length; ++r) {
        const i = s.meshes[r];
        if (i.subMeshes)
          for (let a = 0; a < i.subMeshes.length; ++a)
            i.subMeshes[a]._removeDrawWrapper(e);
      }
    }
  }
  /**
   * @internal
   * Rescales a texture
   * @param source input texture
   * @param destination destination texture
   * @param scene scene to use to render the resize
   * @param internalFormat format to use when resizing
   * @param onComplete callback to be called when resize has completed
   */
  _rescaleTexture(e, t, s, r, i) {
    this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR), this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR), this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE), this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
    const a = this.createRenderTargetTexture({
      width: t.width,
      height: t.height
    }, {
      generateMipMaps: !1,
      type: 0,
      samplingMode: 2,
      generateDepthBuffer: !1,
      generateStencilBuffer: !1
    });
    !this._rescalePostProcess && n._RescalePostProcessFactory && (this._rescalePostProcess = n._RescalePostProcessFactory(this)), this._rescalePostProcess && (this._rescalePostProcess.externalTextureSamplerBinding = !0, this._rescalePostProcess.getEffect().executeWhenCompiled(() => {
      this._rescalePostProcess.onApply = function(l) {
        l._bindTexture("textureSampler", e);
      };
      let o = s;
      o || (o = this.scenes[this.scenes.length - 1]), o.postProcessManager.directRender([this._rescalePostProcess], a, !0), this._bindTextureDirectly(this._gl.TEXTURE_2D, t, !0), this._gl.copyTexImage2D(this._gl.TEXTURE_2D, 0, r, 0, 0, t.width, t.height, 0), this.unBindFramebuffer(a), a.dispose(), i && i();
    }));
  }
  // FPS
  /**
   * Gets the current framerate
   * @returns a number representing the framerate
   */
  getFps() {
    return this._fps;
  }
  /**
   * Gets the time spent between current and previous frame
   * @returns a number representing the delta time in ms
   */
  getDeltaTime() {
    return this._deltaTime;
  }
  _measureFps() {
    this._performanceMonitor.sampleFrame(), this._fps = this._performanceMonitor.averageFPS, this._deltaTime = this._performanceMonitor.instantaneousFrameTime || 0;
  }
  /**
   * Wraps an external web gl texture in a Babylon texture.
   * @param texture defines the external texture
   * @param hasMipMaps defines whether the external texture has mip maps (default: false)
   * @param samplingMode defines the sampling mode for the external texture (default: 3)
   * @param width defines the width for the external texture (default: 0)
   * @param height defines the height for the external texture (default: 0)
   * @returns the babylon internal texture
   */
  wrapWebGLTexture(e, t = !1, s = 3, r = 0, i = 0) {
    const a = new p(e, this._gl), o = new S(this, F.Unknown, !0);
    return o._hardwareTexture = a, o.baseWidth = r, o.baseHeight = i, o.width = r, o.height = i, o.isReady = !0, o.useMipMaps = t, this.updateTextureSamplingMode(s, o), o;
  }
  /**
   * @internal
   */
  _uploadImageToTexture(e, t, s = 0, r = 0) {
    const i = this._gl, a = this._getWebGLTextureType(e.type), o = this._getInternalFormat(e.format), l = this._getRGBABufferInternalSizedFormat(e.type, o), _ = e.isCube ? i.TEXTURE_CUBE_MAP : i.TEXTURE_2D;
    this._bindTextureDirectly(_, e, !0), this._unpackFlipY(e.invertY);
    let c = i.TEXTURE_2D;
    e.isCube && (c = i.TEXTURE_CUBE_MAP_POSITIVE_X + s), i.texImage2D(c, r, l, o, a, t), this._bindTextureDirectly(_, null, !0);
  }
  /**
   * Updates a depth texture Comparison Mode and Function.
   * If the comparison Function is equal to 0, the mode will be set to none.
   * Otherwise, this only works in webgl 2 and requires a shadow sampler in the shader.
   * @param texture The texture to set the comparison function for
   * @param comparisonFunction The comparison function to set, 0 if no comparison required
   */
  updateTextureComparisonFunction(e, t) {
    if (this.webGLVersion === 1) {
      P.Error("WebGL 1 does not support texture comparison.");
      return;
    }
    const s = this._gl;
    e.isCube ? (this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, e, !0), t === 0 ? (s.texParameteri(s.TEXTURE_CUBE_MAP, s.TEXTURE_COMPARE_FUNC, 515), s.texParameteri(s.TEXTURE_CUBE_MAP, s.TEXTURE_COMPARE_MODE, s.NONE)) : (s.texParameteri(s.TEXTURE_CUBE_MAP, s.TEXTURE_COMPARE_FUNC, t), s.texParameteri(s.TEXTURE_CUBE_MAP, s.TEXTURE_COMPARE_MODE, s.COMPARE_REF_TO_TEXTURE)), this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null)) : (this._bindTextureDirectly(this._gl.TEXTURE_2D, e, !0), t === 0 ? (s.texParameteri(s.TEXTURE_2D, s.TEXTURE_COMPARE_FUNC, 515), s.texParameteri(s.TEXTURE_2D, s.TEXTURE_COMPARE_MODE, s.NONE)) : (s.texParameteri(s.TEXTURE_2D, s.TEXTURE_COMPARE_FUNC, t), s.texParameteri(s.TEXTURE_2D, s.TEXTURE_COMPARE_MODE, s.COMPARE_REF_TO_TEXTURE)), this._bindTextureDirectly(this._gl.TEXTURE_2D, null)), e._comparisonFunction = t;
  }
  /**
   * Creates a webGL buffer to use with instantiation
   * @param capacity defines the size of the buffer
   * @returns the webGL buffer
   */
  createInstancesBuffer(e) {
    const t = this._gl.createBuffer();
    if (!t)
      throw new Error("Unable to create instance buffer");
    const s = new b(t);
    return s.capacity = e, this.bindArrayBuffer(s), this._gl.bufferData(this._gl.ARRAY_BUFFER, e, this._gl.DYNAMIC_DRAW), s.references = 1, s;
  }
  /**
   * Delete a webGL buffer used with instantiation
   * @param buffer defines the webGL buffer to delete
   */
  deleteInstancesBuffer(e) {
    this._gl.deleteBuffer(e);
  }
  _clientWaitAsync(e, t = 0, s = 10) {
    const r = this._gl;
    return new Promise((i, a) => {
      const o = () => {
        const l = r.clientWaitSync(e, t, 0);
        if (l == r.WAIT_FAILED) {
          a();
          return;
        }
        if (l == r.TIMEOUT_EXPIRED) {
          setTimeout(o, s);
          return;
        }
        i();
      };
      o();
    });
  }
  /**
   * @internal
   */
  _readPixelsAsync(e, t, s, r, i, a, o) {
    if (this._webGLVersion < 2)
      throw new Error("_readPixelsAsync only work on WebGL2+");
    const l = this._gl, _ = l.createBuffer();
    l.bindBuffer(l.PIXEL_PACK_BUFFER, _), l.bufferData(l.PIXEL_PACK_BUFFER, o.byteLength, l.STREAM_READ), l.readPixels(e, t, s, r, i, a, 0), l.bindBuffer(l.PIXEL_PACK_BUFFER, null);
    const c = l.fenceSync(l.SYNC_GPU_COMMANDS_COMPLETE, 0);
    return c ? (l.flush(), this._clientWaitAsync(c, 0, 10).then(() => (l.deleteSync(c), l.bindBuffer(l.PIXEL_PACK_BUFFER, _), l.getBufferSubData(l.PIXEL_PACK_BUFFER, 0, o), l.bindBuffer(l.PIXEL_PACK_BUFFER, null), l.deleteBuffer(_), o))) : null;
  }
  dispose() {
    for (this.hideLoadingUI(), this.onNewSceneAddedObservable.clear(); this.postProcesses.length; )
      this.postProcesses[0].dispose();
    for (this._rescalePostProcess && this._rescalePostProcess.dispose(); this.scenes.length; )
      this.scenes[0].dispose();
    for (; this._virtualScenes.length; )
      this._virtualScenes[0].dispose();
    E.Instances.length === 1 && n.audioEngine && (n.audioEngine.dispose(), n.audioEngine = null);
    const e = this.getHostWindow();
    e && typeof e.removeEventListener == "function" && (e.removeEventListener("blur", this._onBlur), e.removeEventListener("focus", this._onFocus)), this._renderingCanvas && (this._renderingCanvas.removeEventListener("focus", this._onCanvasFocus), this._renderingCanvas.removeEventListener("blur", this._onCanvasBlur), this._renderingCanvas.removeEventListener("pointerout", this._onCanvasPointerOut), this._renderingCanvas.removeEventListener("contextmenu", this._onCanvasContextMenu)), m() && (document.removeEventListener("fullscreenchange", this._onFullscreenChange), document.removeEventListener("mozfullscreenchange", this._onFullscreenChange), document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange), document.removeEventListener("msfullscreenchange", this._onFullscreenChange), document.removeEventListener("pointerlockchange", this._onPointerLockChange), document.removeEventListener("mspointerlockchange", this._onPointerLockChange), document.removeEventListener("mozpointerlockchange", this._onPointerLockChange), document.removeEventListener("webkitpointerlockchange", this._onPointerLockChange)), super.dispose();
    const t = E.Instances.indexOf(this);
    t >= 0 && E.Instances.splice(t, 1), n.Instances.length || E.OnEnginesDisposedObservable.notifyObservers(this), this.onResizeObservable.clear(), this.onCanvasBlurObservable.clear(), this.onCanvasFocusObservable.clear(), this.onCanvasPointerOutObservable.clear(), this.onBeginFrameObservable.clear(), this.onEndFrameObservable.clear();
  }
  _disableTouchAction() {
    !this._renderingCanvas || !this._renderingCanvas.setAttribute || (this._renderingCanvas.setAttribute("touch-action", "none"), this._renderingCanvas.style.touchAction = "none", this._renderingCanvas.style.webkitTapHighlightColor = "transparent");
  }
  // Loading screen
  /**
   * Display the loading screen
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
   */
  displayLoadingUI() {
    if (!g())
      return;
    const e = this.loadingScreen;
    e && e.displayLoadingUI();
  }
  /**
   * Hide the loading screen
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
   */
  hideLoadingUI() {
    if (!g())
      return;
    const e = this._loadingScreen;
    e && e.hideLoadingUI();
  }
  /**
   * Gets the current loading screen object
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
   */
  get loadingScreen() {
    return !this._loadingScreen && this._renderingCanvas && (this._loadingScreen = n.DefaultLoadingScreenFactory(this._renderingCanvas)), this._loadingScreen;
  }
  /**
   * Sets the current loading screen object
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
   */
  set loadingScreen(e) {
    this._loadingScreen = e;
  }
  /**
   * Sets the current loading screen text
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
   */
  set loadingUIText(e) {
    this.loadingScreen.loadingUIText = e;
  }
  /**
   * Sets the current loading screen background color
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
   */
  set loadingUIBackgroundColor(e) {
    this.loadingScreen.loadingUIBackgroundColor = e;
  }
  /**
   * creates and returns a new video element
   * @param constraints video constraints
   * @returns video element
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createVideoElement(e) {
    return document.createElement("video");
  }
  /** Pointerlock and fullscreen */
  /**
   * Ask the browser to promote the current element to pointerlock mode
   * @param element defines the DOM element to promote
   */
  static _RequestPointerlock(e) {
    if (e.requestPointerLock) {
      const t = e.requestPointerLock();
      t instanceof Promise ? t.then(() => {
        e.focus();
      }).catch(() => {
      }) : e.focus();
    }
  }
  /**
   * Asks the browser to exit pointerlock mode
   */
  static _ExitPointerlock() {
    document.exitPointerLock && document.exitPointerLock();
  }
  /**
   * Ask the browser to promote the current element to fullscreen rendering mode
   * @param element defines the DOM element to promote
   */
  static _RequestFullscreen(e) {
    const t = e.requestFullscreen || e.webkitRequestFullscreen;
    t && t.call(e);
  }
  /**
   * Asks the browser to exit fullscreen mode
   */
  static _ExitFullscreen() {
    const e = document;
    document.exitFullscreen ? document.exitFullscreen() : e.webkitCancelFullScreen && e.webkitCancelFullScreen();
  }
  /**
   * Get Font size information
   * @param font font name
   * @returns an object containing ascent, height and descent
   */
  getFontOffset(e) {
    const t = document.createElement("span");
    t.innerHTML = "Hg", t.setAttribute("style", `font: ${e} !important`);
    const s = document.createElement("div");
    s.style.display = "inline-block", s.style.width = "1px", s.style.height = "0px", s.style.verticalAlign = "bottom";
    const r = document.createElement("div");
    r.style.whiteSpace = "nowrap", r.appendChild(t), r.appendChild(s), document.body.appendChild(r);
    let i = 0, a = 0;
    try {
      a = s.getBoundingClientRect().top - t.getBoundingClientRect().top, s.style.verticalAlign = "baseline", i = s.getBoundingClientRect().top - t.getBoundingClientRect().top;
    } finally {
      document.body.removeChild(r);
    }
    return { ascent: i, height: a, descent: a - i };
  }
}
n.ALPHA_DISABLE = 0;
n.ALPHA_ADD = 1;
n.ALPHA_COMBINE = 2;
n.ALPHA_SUBTRACT = 3;
n.ALPHA_MULTIPLY = 4;
n.ALPHA_MAXIMIZED = 5;
n.ALPHA_ONEONE = 6;
n.ALPHA_PREMULTIPLIED = 7;
n.ALPHA_PREMULTIPLIED_PORTERDUFF = 8;
n.ALPHA_INTERPOLATE = 9;
n.ALPHA_SCREENMODE = 10;
n.DELAYLOADSTATE_NONE = 0;
n.DELAYLOADSTATE_LOADED = 1;
n.DELAYLOADSTATE_LOADING = 2;
n.DELAYLOADSTATE_NOTLOADED = 4;
n.NEVER = 512;
n.ALWAYS = 519;
n.LESS = 513;
n.EQUAL = 514;
n.LEQUAL = 515;
n.GREATER = 516;
n.GEQUAL = 518;
n.NOTEQUAL = 517;
n.KEEP = 7680;
n.REPLACE = 7681;
n.INCR = 7682;
n.DECR = 7683;
n.INVERT = 5386;
n.INCR_WRAP = 34055;
n.DECR_WRAP = 34056;
n.TEXTURE_CLAMP_ADDRESSMODE = 0;
n.TEXTURE_WRAP_ADDRESSMODE = 1;
n.TEXTURE_MIRROR_ADDRESSMODE = 2;
n.TEXTUREFORMAT_ALPHA = 0;
n.TEXTUREFORMAT_LUMINANCE = 1;
n.TEXTUREFORMAT_LUMINANCE_ALPHA = 2;
n.TEXTUREFORMAT_RGB = 4;
n.TEXTUREFORMAT_RGBA = 5;
n.TEXTUREFORMAT_RED = 6;
n.TEXTUREFORMAT_R = 6;
n.TEXTUREFORMAT_RG = 7;
n.TEXTUREFORMAT_RED_INTEGER = 8;
n.TEXTUREFORMAT_R_INTEGER = 8;
n.TEXTUREFORMAT_RG_INTEGER = 9;
n.TEXTUREFORMAT_RGB_INTEGER = 10;
n.TEXTUREFORMAT_RGBA_INTEGER = 11;
n.TEXTURETYPE_UNSIGNED_BYTE = 0;
n.TEXTURETYPE_UNSIGNED_INT = 0;
n.TEXTURETYPE_FLOAT = 1;
n.TEXTURETYPE_HALF_FLOAT = 2;
n.TEXTURETYPE_BYTE = 3;
n.TEXTURETYPE_SHORT = 4;
n.TEXTURETYPE_UNSIGNED_SHORT = 5;
n.TEXTURETYPE_INT = 6;
n.TEXTURETYPE_UNSIGNED_INTEGER = 7;
n.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = 8;
n.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = 9;
n.TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = 10;
n.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = 11;
n.TEXTURETYPE_UNSIGNED_INT_24_8 = 12;
n.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = 13;
n.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = 14;
n.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = 15;
n.TEXTURE_NEAREST_SAMPLINGMODE = 1;
n.TEXTURE_BILINEAR_SAMPLINGMODE = 2;
n.TEXTURE_TRILINEAR_SAMPLINGMODE = 3;
n.TEXTURE_NEAREST_NEAREST_MIPLINEAR = 8;
n.TEXTURE_LINEAR_LINEAR_MIPNEAREST = 11;
n.TEXTURE_LINEAR_LINEAR_MIPLINEAR = 3;
n.TEXTURE_NEAREST_NEAREST_MIPNEAREST = 4;
n.TEXTURE_NEAREST_LINEAR_MIPNEAREST = 5;
n.TEXTURE_NEAREST_LINEAR_MIPLINEAR = 6;
n.TEXTURE_NEAREST_LINEAR = 7;
n.TEXTURE_NEAREST_NEAREST = 1;
n.TEXTURE_LINEAR_NEAREST_MIPNEAREST = 9;
n.TEXTURE_LINEAR_NEAREST_MIPLINEAR = 10;
n.TEXTURE_LINEAR_LINEAR = 2;
n.TEXTURE_LINEAR_NEAREST = 12;
n.TEXTURE_EXPLICIT_MODE = 0;
n.TEXTURE_SPHERICAL_MODE = 1;
n.TEXTURE_PLANAR_MODE = 2;
n.TEXTURE_CUBIC_MODE = 3;
n.TEXTURE_PROJECTION_MODE = 4;
n.TEXTURE_SKYBOX_MODE = 5;
n.TEXTURE_INVCUBIC_MODE = 6;
n.TEXTURE_EQUIRECTANGULAR_MODE = 7;
n.TEXTURE_FIXED_EQUIRECTANGULAR_MODE = 8;
n.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = 9;
n.SCALEMODE_FLOOR = 1;
n.SCALEMODE_NEAREST = 2;
n.SCALEMODE_CEILING = 3;
n._RescalePostProcessFactory = null;
n._RenderPassIdCounter = 0;
const N = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Engine: n
}, Symbol.toStringTag, { value: "Module" }));
export {
  n as E,
  C as P,
  U as R,
  L as a,
  N as e
};
//# sourceMappingURL=engine-Br2P72Us.js.map
