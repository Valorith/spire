import { Y as P, a0 as z, a1 as U, L as N, V as M, O as v, a5 as V, ah as W, x as G, w as X, T as E, ai as H, a as k, M as j } from "./embed-entry-BKE21f6Q.js";
import { T as m } from "./texture-BWPw_5Qg.js";
import { R as Y, P as K } from "./renderingManager-D3DWmt5q.js";
import "./postProcess-CEDAC-hv.js";
import { E as D } from "./engine-CDU55b-Q.js";
import { V as $ } from "./math.viewport-CrgurBQ6.js";
P.prototype.createRenderTargetCubeTexture = function(_, e) {
  const t = this._createHardwareRenderTargetWrapper(!1, !0, _), r = {
    generateMipMaps: !0,
    generateDepthBuffer: !0,
    generateStencilBuffer: !1,
    type: 0,
    samplingMode: 3,
    format: 5,
    ...e
  };
  r.generateStencilBuffer = r.generateDepthBuffer && r.generateStencilBuffer, (r.type === 1 && !this._caps.textureFloatLinearFiltering || r.type === 2 && !this._caps.textureHalfFloatLinearFiltering) && (r.samplingMode = 1);
  const s = this._gl, i = new z(this, U.RenderTarget);
  this._bindTextureDirectly(s.TEXTURE_CUBE_MAP, i, !0);
  const o = this._getSamplingParameters(r.samplingMode, r.generateMipMaps);
  r.type === 1 && !this._caps.textureFloat && (r.type = 0, N.Warn("Float textures are not supported. Cube render target forced to TEXTURETYPE_UNESIGNED_BYTE type")), s.texParameteri(s.TEXTURE_CUBE_MAP, s.TEXTURE_MAG_FILTER, o.mag), s.texParameteri(s.TEXTURE_CUBE_MAP, s.TEXTURE_MIN_FILTER, o.min), s.texParameteri(s.TEXTURE_CUBE_MAP, s.TEXTURE_WRAP_S, s.CLAMP_TO_EDGE), s.texParameteri(s.TEXTURE_CUBE_MAP, s.TEXTURE_WRAP_T, s.CLAMP_TO_EDGE);
  for (let a = 0; a < 6; a++)
    s.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X + a, 0, this._getRGBABufferInternalSizedFormat(r.type, r.format), _, _, 0, this._getInternalFormat(r.format), this._getWebGLTextureType(r.type), null);
  const n = s.createFramebuffer();
  return this._bindUnboundFramebuffer(n), t._depthStencilBuffer = this._setupFramebufferDepthAttachments(r.generateStencilBuffer, r.generateDepthBuffer, _, _), r.generateMipMaps && s.generateMipmap(s.TEXTURE_CUBE_MAP), this._bindTextureDirectly(s.TEXTURE_CUBE_MAP, null), this._bindUnboundFramebuffer(null), t._framebuffer = n, t._generateDepthBuffer = r.generateDepthBuffer, t._generateStencilBuffer = r.generateStencilBuffer, i.width = _, i.height = _, i.isReady = !0, i.isCube = !0, i.samples = 1, i.generateMipMaps = r.generateMipMaps, i.samplingMode = r.samplingMode, i.type = r.type, i.format = r.format, this._internalTexturesCache.push(i), t.setTextures(i), t;
};
const C = {
  positions: [1, 1, -1, 1, -1, -1, 1, -1],
  indices: [0, 1, 2, 0, 2, 3]
};
class J {
  /**
   * Creates an effect renderer
   * @param engine the engine to use for rendering
   * @param options defines the options of the effect renderer
   */
  constructor(e, t = C) {
    this._fullscreenViewport = new $(0, 0, 1, 1);
    const r = t.positions ?? C.positions, s = t.indices ?? C.indices;
    this.engine = e, this._vertexBuffers = {
      [M.PositionKind]: new M(e, r, M.PositionKind, !1, !1, 2)
    }, this._indexBuffer = e.createIndexBuffer(s), this._onContextRestoredObserver = e.onContextRestoredObservable.add(() => {
      this._indexBuffer = e.createIndexBuffer(s);
      for (const i in this._vertexBuffers)
        this._vertexBuffers[i]._rebuild();
    });
  }
  /**
   * Sets the current viewport in normalized coordinates 0-1
   * @param viewport Defines the viewport to set (defaults to 0 0 1 1)
   */
  setViewport(e = this._fullscreenViewport) {
    this.engine.setViewport(e);
  }
  /**
   * Binds the embedded attributes buffer to the effect.
   * @param effect Defines the effect to bind the attributes for
   */
  bindBuffers(e) {
    this.engine.bindBuffers(this._vertexBuffers, this._indexBuffer, e);
  }
  /**
   * Sets the current effect wrapper to use during draw.
   * The effect needs to be ready before calling this api.
   * This also sets the default full screen position attribute.
   * @param effectWrapper Defines the effect to draw with
   */
  applyEffectWrapper(e) {
    this.engine.setState(!0), this.engine.depthCullingState.depthTest = !1, this.engine.stencilState.stencilTest = !1, this.engine.enableEffect(e._drawWrapper), this.bindBuffers(e.effect), e.onApplyObservable.notifyObservers({});
  }
  /**
   * Saves engine states
   */
  saveStates() {
    this._savedStateDepthTest = this.engine.depthCullingState.depthTest, this._savedStateStencilTest = this.engine.stencilState.stencilTest;
  }
  /**
   * Restores engine states
   */
  restoreStates() {
    this.engine.depthCullingState.depthTest = this._savedStateDepthTest, this.engine.stencilState.stencilTest = this._savedStateStencilTest;
  }
  /**
   * Draws a full screen quad.
   */
  draw() {
    this.engine.drawElementsType(0, 0, 6);
  }
  _isRenderTargetTexture(e) {
    return e.renderTarget !== void 0;
  }
  /**
   * renders one or more effects to a specified texture
   * @param effectWrapper the effect to renderer
   * @param outputTexture texture to draw to, if null it will render to the screen.
   */
  render(e, t = null) {
    if (!e.effect.isReady())
      return;
    this.saveStates(), this.setViewport();
    const r = t === null ? null : this._isRenderTargetTexture(t) ? t.renderTarget : t;
    r && this.engine.bindFramebuffer(r), this.applyEffectWrapper(e), this.draw(), r && this.engine.unBindFramebuffer(r), this.restoreStates();
  }
  /**
   * Disposes of the effect renderer
   */
  dispose() {
    const e = this._vertexBuffers[M.PositionKind];
    e && (e.dispose(), delete this._vertexBuffers[M.PositionKind]), this._indexBuffer && this.engine._releaseBuffer(this._indexBuffer), this._onContextRestoredObserver && (this.engine.onContextRestoredObservable.remove(this._onContextRestoredObserver), this._onContextRestoredObserver = null);
  }
}
class Z {
  /**
   * The underlying effect
   */
  get effect() {
    return this._drawWrapper.effect;
  }
  set effect(e) {
    this._drawWrapper.effect = e;
  }
  /**
   * Creates an effect to be renderer
   * @param creationOptions options to create the effect
   */
  constructor(e) {
    this.onApplyObservable = new v();
    let t;
    const r = e.uniformNames || [];
    e.vertexShader ? t = {
      fragmentSource: e.fragmentShader,
      vertexSource: e.vertexShader,
      spectorName: e.name || "effectWrapper"
    } : (r.push("scale"), t = {
      fragmentSource: e.fragmentShader,
      vertex: "postprocess",
      spectorName: e.name || "effectWrapper"
    }, this.onApplyObservable.add(() => {
      this.effect.setFloat2("scale", 1, 1);
    }));
    const s = e.defines ? e.defines.join(`
`) : "";
    this._drawWrapper = new V(e.engine), e.useShaderStore ? (t.fragment = t.fragmentSource, t.vertex || (t.vertex = t.vertexSource), delete t.fragmentSource, delete t.vertexSource, this.effect = e.engine.createEffect(t, e.attributeNames || ["position"], r, e.samplerNames, s, void 0, e.onCompiled, void 0, void 0, e.shaderLanguage)) : (this.effect = new W(t, e.attributeNames || ["position"], r, e.samplerNames, e.engine, s, void 0, e.onCompiled, void 0, void 0, void 0, e.shaderLanguage), this._onContextRestoredObserver = e.engine.onContextRestoredObservable.add(() => {
      this.effect._pipelineContext = null, this.effect._prepareEffect();
    }));
  }
  /**
   * Disposes of the effect wrapper
   */
  dispose() {
    this._onContextRestoredObserver && (this.effect.getEngine().onContextRestoredObservable.remove(this._onContextRestoredObserver), this._onContextRestoredObserver = null), this.effect.dispose();
  }
}
const B = "passPixelShader", I = `varying vec2 vUV;uniform sampler2D textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=texture2D(textureSampler,vUV);}`;
G.ShadersStore[B] = I;
const L = { name: B, shader: I };
class g {
  static _CreateDumpRenderer() {
    if (!g._DumpToolsEngine) {
      let e, t = null;
      const r = {
        preserveDrawingBuffer: !0,
        depth: !1,
        stencil: !1,
        alpha: !0,
        premultipliedAlpha: !1,
        antialias: !1,
        failIfMajorPerformanceCaveat: !1
      };
      try {
        e = new OffscreenCanvas(100, 100), t = new P(e, !1, r);
      } catch {
        e = document.createElement("canvas"), t = new P(e, !1, r);
      }
      t.getCaps().parallelShaderCompile = void 0;
      const s = new J(t), i = new Z({
        engine: t,
        name: L.name,
        fragmentShader: L.shader,
        samplerNames: ["textureSampler"]
      });
      g._DumpToolsEngine = {
        canvas: e,
        engine: t,
        renderer: s,
        wrapper: i
      };
    }
    return g._DumpToolsEngine;
  }
  /**
   * Dumps the current bound framebuffer
   * @param width defines the rendering width
   * @param height defines the rendering height
   * @param engine defines the hosting engine
   * @param successCallback defines the callback triggered once the data are available
   * @param mimeType defines the mime type of the result
   * @param fileName defines the filename to download. If present, the result will automatically be downloaded
   * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
   * @returns a void promise
   */
  static async DumpFramebuffer(e, t, r, s, i = "image/png", o, n) {
    const a = await r.readPixels(0, 0, e, t), d = new Uint8Array(a.buffer);
    g.DumpData(e, t, d, s, i, o, !0, void 0, n);
  }
  /**
   * Dumps an array buffer
   * @param width defines the rendering width
   * @param height defines the rendering height
   * @param data the data array
   * @param mimeType defines the mime type of the result
   * @param fileName defines the filename to download. If present, the result will automatically be downloaded
   * @param invertY true to invert the picture in the Y dimension
   * @param toArrayBuffer true to convert the data to an ArrayBuffer (encoded as `mimeType`) instead of a base64 string
   * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
   * @returns a promise that resolve to the final data
   */
  static DumpDataAsync(e, t, r, s = "image/png", i, o = !1, n = !1, a) {
    return new Promise((d) => {
      g.DumpData(e, t, r, (h) => d(h), s, i, o, n, a);
    });
  }
  /**
   * Dumps an array buffer
   * @param width defines the rendering width
   * @param height defines the rendering height
   * @param data the data array
   * @param successCallback defines the callback triggered once the data are available
   * @param mimeType defines the mime type of the result
   * @param fileName defines the filename to download. If present, the result will automatically be downloaded
   * @param invertY true to invert the picture in the Y dimension
   * @param toArrayBuffer true to convert the data to an ArrayBuffer (encoded as `mimeType`) instead of a base64 string
   * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
   */
  static DumpData(e, t, r, s, i = "image/png", o, n = !1, a = !1, d) {
    const h = g._CreateDumpRenderer();
    if (h.engine.setSize(e, t, !0), r instanceof Float32Array) {
      const l = new Uint8Array(r.length);
      let u = r.length;
      for (; u--; ) {
        const p = r[u];
        l[u] = Math.round(X.Clamp(p) * 255);
      }
      r = l;
    }
    const f = h.engine.createRawTexture(r, e, t, 5, !1, !n, 1);
    h.renderer.setViewport(), h.renderer.applyEffectWrapper(h.wrapper), h.wrapper.effect._bindTexture("textureSampler", f), h.renderer.draw(), a ? E.ToBlob(h.canvas, (l) => {
      const u = new FileReader();
      u.onload = (p) => {
        const b = p.target.result;
        s && s(b);
      }, u.readAsArrayBuffer(l);
    }, i, d) : E.EncodeScreenshotCanvasData(h.canvas, s, i, o, d), f.dispose();
  }
  /**
   * Dispose the dump tools associated resources
   */
  static Dispose() {
    g._DumpToolsEngine && (g._DumpToolsEngine.wrapper.dispose(), g._DumpToolsEngine.renderer.dispose(), g._DumpToolsEngine.engine.dispose()), g._DumpToolsEngine = null;
  }
}
const q = () => {
  E.DumpData = g.DumpData, E.DumpDataAsync = g.DumpDataAsync, E.DumpFramebuffer = g.DumpFramebuffer;
};
q();
class T extends m {
  /**
   * Use this list to define the list of mesh you want to render.
   */
  get renderList() {
    return this._renderList;
  }
  set renderList(e) {
    this._unObserveRenderList && (this._unObserveRenderList(), this._unObserveRenderList = null), e && (this._unObserveRenderList = H(e, this._renderListHasChanged)), this._renderList = e;
  }
  /**
   * Post-processes for this render target
   */
  get postProcesses() {
    return this._postProcesses;
  }
  get _prePassEnabled() {
    return !!this._prePassRenderTarget && this._prePassRenderTarget.enabled;
  }
  /**
   * Set a after unbind callback in the texture.
   * This has been kept for backward compatibility and use of onAfterUnbindObservable is recommended.
   */
  set onAfterUnbind(e) {
    this._onAfterUnbindObserver && this.onAfterUnbindObservable.remove(this._onAfterUnbindObserver), this._onAfterUnbindObserver = this.onAfterUnbindObservable.add(e);
  }
  /**
   * Set a before render callback in the texture.
   * This has been kept for backward compatibility and use of onBeforeRenderObservable is recommended.
   */
  set onBeforeRender(e) {
    this._onBeforeRenderObserver && this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver), this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(e);
  }
  /**
   * Set a after render callback in the texture.
   * This has been kept for backward compatibility and use of onAfterRenderObservable is recommended.
   */
  set onAfterRender(e) {
    this._onAfterRenderObserver && this.onAfterRenderObservable.remove(this._onAfterRenderObserver), this._onAfterRenderObserver = this.onAfterRenderObservable.add(e);
  }
  /**
   * Set a clear callback in the texture.
   * This has been kept for backward compatibility and use of onClearObservable is recommended.
   */
  set onClear(e) {
    this._onClearObserver && this.onClearObservable.remove(this._onClearObserver), this._onClearObserver = this.onClearObservable.add(e);
  }
  /**
   * Gets the render pass ids used by the render target texture. For a single render target the array length will be 1, for a cube texture it will be 6 and for
   * a 2D texture array it will return an array of ids the size of the 2D texture array
   */
  get renderPassIds() {
    return this._renderPassIds;
  }
  /**
   * Gets the current value of the refreshId counter
   */
  get currentRefreshId() {
    return this._currentRefreshId;
  }
  /**
   * Sets a specific material to be used to render a mesh/a list of meshes in this render target texture
   * @param mesh mesh or array of meshes
   * @param material material or array of materials to use for this render pass. If undefined is passed, no specific material will be used but the regular material instead (mesh.material). It's possible to provide an array of materials to use a different material for each rendering in the case of a cube texture (6 rendering) and a 2D texture array (as many rendering as the length of the array)
   */
  setMaterialForRendering(e, t) {
    let r;
    Array.isArray(e) ? r = e : r = [e];
    for (let s = 0; s < r.length; ++s)
      for (let i = 0; i < this._renderPassIds.length; ++i)
        r[s].setMaterialForRenderPass(this._renderPassIds[i], t !== void 0 ? Array.isArray(t) ? t[i] : t : void 0);
  }
  /**
   * Define if the texture has multiple draw buffers or if false a single draw buffer.
   */
  get isMulti() {
    return this._renderTarget?.isMulti ?? !1;
  }
  /**
   * Gets render target creation options that were used.
   */
  get renderTargetOptions() {
    return this._renderTargetOptions;
  }
  /**
   * Gets the render target wrapper associated with this render target
   */
  get renderTarget() {
    return this._renderTarget;
  }
  _onRatioRescale() {
    this._sizeRatio && this.resize(this._initialSizeParameter);
  }
  /**
   * Gets or sets the size of the bounding box associated with the texture (when in cube mode)
   * When defined, the cubemap will switch to local mode
   * @see https://community.arm.com/graphics/b/blog/posts/reflections-based-on-local-cubemaps-in-unity
   * @example https://www.babylonjs-playground.com/#RNASML
   */
  set boundingBoxSize(e) {
    if (this._boundingBoxSize && this._boundingBoxSize.equals(e))
      return;
    this._boundingBoxSize = e;
    const t = this.getScene();
    t && t.markAllMaterialsAsDirty(1);
  }
  get boundingBoxSize() {
    return this._boundingBoxSize;
  }
  /**
   * In case the RTT has been created with a depth texture, get the associated
   * depth texture.
   * Otherwise, return null.
   */
  get depthStencilTexture() {
    return this._renderTarget?._depthStencilTexture ?? null;
  }
  /** @internal */
  constructor(e, t, r, s = !1, i = !0, o = 0, n = !1, a = m.TRILINEAR_SAMPLINGMODE, d = !0, h = !1, f = !1, l = 5, u = !1, p, b, R = !1, x = !1) {
    let O, S = !0;
    if (typeof s == "object") {
      const c = s;
      s = !!c.generateMipMaps, i = c.doNotChangeAspectRatio ?? !0, o = c.type ?? 0, n = !!c.isCube, a = c.samplingMode ?? m.TRILINEAR_SAMPLINGMODE, d = c.generateDepthBuffer ?? !0, h = !!c.generateStencilBuffer, f = !!c.isMulti, l = c.format ?? 5, u = !!c.delayAllocation, p = c.samples, b = c.creationFlags, R = !!c.noColorAttachment, x = !!c.useSRGBBuffer, O = c.colorAttachment, S = c.gammaSpace ?? S;
    }
    if (super(null, r, !s, void 0, a, void 0, void 0, void 0, void 0, l), this._unObserveRenderList = null, this._renderListHasChanged = (c, y) => {
      const A = this._renderList ? this._renderList.length : 0;
      (y === 0 && A > 0 || A === 0) && this.getScene()?.meshes.forEach((F) => {
        F._markSubMeshesAsLightDirty();
      });
    }, this.renderParticles = !0, this.renderSprites = !1, this.forceLayerMaskCheck = !1, this.ignoreCameraViewport = !1, this.onBeforeBindObservable = new v(), this.onAfterUnbindObservable = new v(), this.onBeforeRenderObservable = new v(), this.onAfterRenderObservable = new v(), this.onClearObservable = new v(), this.onResizeObservable = new v(), this._cleared = !1, this.skipInitialClear = !1, this._currentRefreshId = -1, this._refreshRate = 1, this._samples = 1, this._canRescale = !0, this._renderTarget = null, this.boundingBoxPosition = k.Zero(), r = this.getScene(), !r)
      return;
    const w = this.getScene().getEngine();
    this._gammaSpace = S, this._coordinatesMode = m.PROJECTION_MODE, this.renderList = [], this.name = e, this.isRenderTarget = !0, this._initialSizeParameter = t, this._renderPassIds = [], this._isCubeData = n, this._processSizeParameter(t), this.renderPassId = this._renderPassIds[0], this._resizeObserver = w.onResizeObservable.add(() => {
    }), this._generateMipMaps = !!s, this._doNotChangeAspectRatio = i, this._renderingManager = new Y(r), this._renderingManager._useSceneAutoClearSetup = !0, !f && (this._renderTargetOptions = {
      generateMipMaps: s,
      type: o,
      format: this._format ?? void 0,
      samplingMode: this.samplingMode,
      generateDepthBuffer: d,
      generateStencilBuffer: h,
      samples: p,
      creationFlags: b,
      noColorAttachment: R,
      useSRGBBuffer: x,
      colorAttachment: O,
      label: this.name
    }, this.samplingMode === m.NEAREST_SAMPLINGMODE && (this.wrapU = m.CLAMP_ADDRESSMODE, this.wrapV = m.CLAMP_ADDRESSMODE), u || (n ? (this._renderTarget = r.getEngine().createRenderTargetCubeTexture(this.getRenderSize(), this._renderTargetOptions), this.coordinatesMode = m.INVCUBIC_MODE, this._textureMatrix = j.Identity()) : this._renderTarget = r.getEngine().createRenderTargetTexture(this._size, this._renderTargetOptions), this._texture = this._renderTarget.texture, p !== void 0 && (this.samples = p)));
  }
  /**
   * Creates a depth stencil texture.
   * This is only available in WebGL 2 or with the depth texture extension available.
   * @param comparisonFunction Specifies the comparison function to set on the texture. If 0 or undefined, the texture is not in comparison mode (default: 0)
   * @param bilinearFiltering Specifies whether or not bilinear filtering is enable on the texture (default: true)
   * @param generateStencil Specifies whether or not a stencil should be allocated in the texture (default: false)
   * @param samples sample count of the depth/stencil texture (default: 1)
   * @param format format of the depth texture (default: 14)
   * @param label defines the label of the texture (for debugging purpose)
   */
  createDepthStencilTexture(e = 0, t = !0, r = !1, s = 1, i = 14, o) {
    this._renderTarget?.createDepthStencilTexture(e, t, r, s, i, o);
  }
  _releaseRenderPassId() {
    if (this._scene) {
      const e = this._scene.getEngine();
      for (let t = 0; t < this._renderPassIds.length; ++t)
        e.releaseRenderPassId(this._renderPassIds[t]);
    }
    this._renderPassIds = [];
  }
  _createRenderPassId() {
    this._releaseRenderPassId();
    const e = this._scene.getEngine(), t = this._isCubeData ? 6 : this.getRenderLayers() || 1;
    for (let r = 0; r < t; ++r)
      this._renderPassIds[r] = e.createRenderPassId(`RenderTargetTexture - ${this.name}#${r}`);
  }
  _processSizeParameter(e, t = !0) {
    if (e.ratio) {
      this._sizeRatio = e.ratio;
      const r = this._getEngine();
      this._size = {
        width: this._bestReflectionRenderTargetDimension(r.getRenderWidth(), this._sizeRatio),
        height: this._bestReflectionRenderTargetDimension(r.getRenderHeight(), this._sizeRatio)
      };
    } else
      this._size = e;
    t && this._createRenderPassId();
  }
  /**
   * Define the number of samples to use in case of MSAA.
   * It defaults to one meaning no MSAA has been enabled.
   */
  get samples() {
    return this._renderTarget?.samples ?? this._samples;
  }
  set samples(e) {
    this._renderTarget && (this._samples = this._renderTarget.setSamples(e));
  }
  /**
   * Resets the refresh counter of the texture and start bak from scratch.
   * Could be useful to regenerate the texture if it is setup to render only once.
   */
  resetRefreshCounter() {
    this._currentRefreshId = -1;
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
  /**
   * Adds a post process to the render target rendering passes.
   * @param postProcess define the post process to add
   */
  addPostProcess(e) {
    if (!this._postProcessManager) {
      const t = this.getScene();
      if (!t)
        return;
      this._postProcessManager = new K(t), this._postProcesses = new Array();
    }
    this._postProcesses.push(e), this._postProcesses[0].autoClear = !1;
  }
  /**
   * Clear all the post processes attached to the render target
   * @param dispose define if the cleared post processes should also be disposed (false by default)
   */
  clearPostProcesses(e = !1) {
    if (this._postProcesses) {
      if (e)
        for (const t of this._postProcesses)
          t.dispose();
      this._postProcesses = [];
    }
  }
  /**
   * Remove one of the post process from the list of attached post processes to the texture
   * @param postProcess define the post process to remove from the list
   */
  removePostProcess(e) {
    if (!this._postProcesses)
      return;
    const t = this._postProcesses.indexOf(e);
    t !== -1 && (this._postProcesses.splice(t, 1), this._postProcesses.length > 0 && (this._postProcesses[0].autoClear = !1));
  }
  /** @internal */
  _shouldRender() {
    return this._currentRefreshId === -1 ? (this._currentRefreshId = 1, !0) : this.refreshRate === this._currentRefreshId ? (this._currentRefreshId = 1, !0) : (this._currentRefreshId++, !1);
  }
  /**
   * Gets the actual render size of the texture.
   * @returns the width of the render size
   */
  getRenderSize() {
    return this.getRenderWidth();
  }
  /**
   * Gets the actual render width of the texture.
   * @returns the width of the render size
   */
  getRenderWidth() {
    return this._size.width ? this._size.width : this._size;
  }
  /**
   * Gets the actual render height of the texture.
   * @returns the height of the render size
   */
  getRenderHeight() {
    return this._size.width ? this._size.height : this._size;
  }
  /**
   * Gets the actual number of layers of the texture or, in the case of a 3D texture, return the depth.
   * @returns the number of layers
   */
  getRenderLayers() {
    const e = this._size.layers;
    if (e)
      return e;
    const t = this._size.depth;
    return t || 0;
  }
  /**
   * Don't allow this render target texture to rescale. Mainly used to prevent rescaling by the scene optimizer.
   */
  disableRescaling() {
    this._canRescale = !1;
  }
  /**
   * Get if the texture can be rescaled or not.
   */
  get canRescale() {
    return this._canRescale;
  }
  /**
   * Resize the texture using a ratio.
   * @param ratio the ratio to apply to the texture size in order to compute the new target size
   */
  scale(e) {
    const t = Math.max(1, this.getRenderSize() * e);
    this.resize(t);
  }
  /**
   * Get the texture reflection matrix used to rotate/transform the reflection.
   * @returns the reflection matrix
   */
  getReflectionTextureMatrix() {
    return this.isCube ? this._textureMatrix : super.getReflectionTextureMatrix();
  }
  /**
   * Resize the texture to a new desired size.
   * Be careful as it will recreate all the data in the new texture.
   * @param size Define the new size. It can be:
   *   - a number for squared texture,
   *   - an object containing { width: number, height: number }
   *   - or an object containing a ratio { ratio: number }
   */
  resize(e) {
    const t = this.isCube;
    this._renderTarget?.dispose(), this._renderTarget = null;
    const r = this.getScene();
    r && (this._processSizeParameter(e, !1), t ? this._renderTarget = r.getEngine().createRenderTargetCubeTexture(this.getRenderSize(), this._renderTargetOptions) : this._renderTarget = r.getEngine().createRenderTargetTexture(this._size, this._renderTargetOptions), this._texture = this._renderTarget.texture, this._renderTargetOptions.samples !== void 0 && (this.samples = this._renderTargetOptions.samples), this.onResizeObservable.hasObservers() && this.onResizeObservable.notifyObservers(this));
  }
  /**
   * Renders all the objects from the render list into the texture.
   * @param useCameraPostProcess Define if camera post processes should be used during the rendering
   * @param dumpForDebug Define if the rendering result should be dumped (copied) for debugging purpose
   */
  render(e = !1, t = !1) {
    this._render(e, t);
  }
  /**
   * This function will check if the render target texture can be rendered (textures are loaded, shaders are compiled)
   * @returns true if all required resources are ready
   */
  isReadyForRendering() {
    return this._render(!1, !1, !0);
  }
  _render(e = !1, t = !1, r = !1) {
    const s = this.getScene();
    if (!s)
      return r;
    const i = s.getEngine();
    if (this.useCameraPostProcesses !== void 0 && (e = this.useCameraPostProcesses), this._waitingRenderList) {
      if (!this.renderListPredicate) {
        this.renderList = [];
        for (let h = 0; h < this._waitingRenderList.length; h++) {
          const f = this._waitingRenderList[h], l = s.getMeshById(f);
          l && this.renderList.push(l);
        }
      }
      this._waitingRenderList = void 0;
    }
    if (this.renderListPredicate) {
      this.renderList ? this.renderList.length = 0 : this.renderList = [];
      const h = this.getScene();
      if (!h)
        return r;
      const f = h.meshes;
      for (let l = 0; l < f.length; l++) {
        const u = f[l];
        this.renderListPredicate(u) && this.renderList.push(u);
      }
    }
    const o = i.currentRenderPassId;
    this.onBeforeBindObservable.notifyObservers(this);
    const n = this.activeCamera ?? s.activeCamera, a = s.activeCamera;
    n && (n !== s.activeCamera && (s.setTransformMatrix(n.getViewMatrix(), n.getProjectionMatrix(!0)), s.activeCamera = n), i.setViewport(n.rigParent ? n.rigParent.viewport : n.viewport, this.getRenderWidth(), this.getRenderHeight())), this._defaultRenderListPrepared = !1;
    let d = r;
    if (r) {
      s.getViewMatrix() || s.updateTransformMatrix();
      const h = this.is2DArray || this.is3D ? this.getRenderLayers() : this.isCube ? 6 : 1;
      for (let f = 0; f < h && d; f++) {
        let l = null;
        const u = this.renderList ? this.renderList : s.getActiveMeshes().data, p = this.renderList ? this.renderList.length : s.getActiveMeshes().length;
        i.currentRenderPassId = this._renderPassIds[f], this.onBeforeRenderObservable.notifyObservers(f), this.getCustomRenderList && (l = this.getCustomRenderList(f, u, p)), l || (l = u), this._doNotChangeAspectRatio || s.updateTransformMatrix(!0);
        for (let b = 0; b < l.length && d; ++b) {
          const R = l[b];
          if (!(!R.isEnabled() || R.isBlocked || !R.isVisible || !R.subMeshes)) {
            if (this.customIsReadyFunction) {
              if (!this.customIsReadyFunction(R, this.refreshRate, r)) {
                d = !1;
                continue;
              }
            } else if (!R.isReady(!0)) {
              d = !1;
              continue;
            }
          }
        }
        this.onAfterRenderObservable.notifyObservers(f), (this.is2DArray || this.is3D || this.isCube) && (s.incrementRenderId(), s.resetCachedMaterial());
      }
    } else if ((this.is2DArray || this.is3D) && !this.isMulti)
      for (let h = 0; h < this.getRenderLayers(); h++)
        this._renderToTarget(0, e, t, h, n), s.incrementRenderId(), s.resetCachedMaterial();
    else if (this.isCube && !this.isMulti)
      for (let h = 0; h < 6; h++)
        this._renderToTarget(h, e, t, void 0, n), s.incrementRenderId(), s.resetCachedMaterial();
    else
      this._renderToTarget(0, e, t, void 0, n);
    return this.onAfterUnbindObservable.notifyObservers(this), i.currentRenderPassId = o, a && (s.activeCamera = a, this.activeCamera && this.activeCamera !== s.activeCamera && s.setTransformMatrix(s.activeCamera.getViewMatrix(), s.activeCamera.getProjectionMatrix(!0)), i.setViewport(s.activeCamera.viewport)), s.resetCachedMaterial(), d;
  }
  _bestReflectionRenderTargetDimension(e, t) {
    const s = e * t, i = D.NearestPOT(s + 128 * 128 / (128 + s));
    return Math.min(D.FloorPOT(e), i);
  }
  _prepareRenderingManager(e, t, r, s) {
    const i = this.getScene();
    if (!i)
      return;
    this._renderingManager.reset();
    const o = i.getRenderId();
    for (let n = 0; n < t; n++) {
      const a = e[n];
      if (a && !a.isBlocked) {
        if (this.customIsReadyFunction) {
          if (!this.customIsReadyFunction(a, this.refreshRate, !1)) {
            this.resetRefreshCounter();
            continue;
          }
        } else if (!a.isReady(this.refreshRate === 0)) {
          this.resetRefreshCounter();
          continue;
        }
        if (!a._internalAbstractMeshDataInfo._currentLODIsUpToDate && i.activeCamera && (a._internalAbstractMeshDataInfo._currentLOD = i.customLODSelector ? i.customLODSelector(a, this.activeCamera || i.activeCamera) : a.getLOD(this.activeCamera || i.activeCamera), a._internalAbstractMeshDataInfo._currentLODIsUpToDate = !0), !a._internalAbstractMeshDataInfo._currentLOD)
          continue;
        let d = a._internalAbstractMeshDataInfo._currentLOD;
        d._preActivateForIntermediateRendering(o);
        let h;
        if (s && r ? h = (a.layerMask & r.layerMask) === 0 : h = !1, a.isEnabled() && a.isVisible && a.subMeshes && !h && (d !== a && d._activate(o, !0), a._activate(o, !0) && a.subMeshes.length)) {
          a.isAnInstance ? a._internalAbstractMeshDataInfo._actAsRegularMesh && (d = a) : d._internalAbstractMeshDataInfo._onlyForInstancesIntermediate = !1, d._internalAbstractMeshDataInfo._isActiveIntermediate = !0;
          for (let f = 0; f < d.subMeshes.length; f++) {
            const l = d.subMeshes[f];
            this._renderingManager.dispatch(l, d);
          }
        }
      }
    }
    for (let n = 0; n < i.particleSystems.length; n++) {
      const a = i.particleSystems[n], d = a.emitter;
      !a.isStarted() || !d || d.position && !d.isEnabled() || this._renderingManager.dispatchParticles(a);
    }
  }
  /**
   * @internal
   * @param faceIndex face index to bind to if this is a cubetexture
   * @param layer defines the index of the texture to bind in the array
   */
  _bindFrameBuffer(e = 0, t = 0) {
    const r = this.getScene();
    if (!r)
      return;
    const s = r.getEngine();
    this._renderTarget && s.bindFramebuffer(this._renderTarget, this.isCube ? e : void 0, void 0, void 0, this.ignoreCameraViewport, 0, t);
  }
  _unbindFrameBuffer(e, t) {
    this._renderTarget && e.unBindFramebuffer(this._renderTarget, this.isCube, () => {
      this.onAfterRenderObservable.notifyObservers(t);
    });
  }
  /**
   * @internal
   */
  _prepareFrame(e, t, r, s) {
    this._postProcessManager ? this._prePassEnabled || this._postProcessManager._prepareFrame(this._texture, this._postProcesses) : (!s || !e.postProcessManager._prepareFrame(this._texture)) && this._bindFrameBuffer(t, r);
  }
  _renderToTarget(e, t, r, s = 0, i = null) {
    const o = this.getScene();
    if (!o)
      return;
    const n = o.getEngine();
    if (n._debugPushGroup?.(`render to face #${e} layer #${s}`, 1), this._prepareFrame(o, e, s, t), this.is2DArray || this.is3D ? (n.currentRenderPassId = this._renderPassIds[s], this.onBeforeRenderObservable.notifyObservers(s)) : (n.currentRenderPassId = this._renderPassIds[e], this.onBeforeRenderObservable.notifyObservers(e)), n.snapshotRendering && n.snapshotRenderingMode === 1)
      this.onClearObservable.hasObservers() ? this.onClearObservable.notifyObservers(n) : this.skipInitialClear || n.clear(this.clearColor || o.clearColor, !0, !0, !0);
    else {
      let d = null;
      const h = this.renderList ? this.renderList : o.getActiveMeshes().data, f = this.renderList ? this.renderList.length : o.getActiveMeshes().length;
      this.getCustomRenderList && (d = this.getCustomRenderList(this.is2DArray || this.is3D ? s : e, h, f)), d ? this._prepareRenderingManager(d, d.length, i, this.forceLayerMaskCheck) : (this._defaultRenderListPrepared || (this._prepareRenderingManager(h, f, i, !this.renderList || this.forceLayerMaskCheck), this._defaultRenderListPrepared = !0), d = h);
      for (const u of o._beforeRenderTargetClearStage)
        u.action(this, e, s);
      this.onClearObservable.hasObservers() ? this.onClearObservable.notifyObservers(n) : this.skipInitialClear || n.clear(this.clearColor || o.clearColor, !0, !0, !0), this._doNotChangeAspectRatio || o.updateTransformMatrix(!0);
      for (const u of o._beforeRenderTargetDrawStage)
        u.action(this, e, s);
      this._renderingManager.render(this.customRenderFunction, d, this.renderParticles, this.renderSprites);
      for (const u of o._afterRenderTargetDrawStage)
        u.action(this, e, s);
      const l = this._texture?.generateMipMaps ?? !1;
      this._texture && (this._texture.generateMipMaps = !1), this._postProcessManager ? this._postProcessManager._finalizeFrame(!1, this._renderTarget ?? void 0, e, this._postProcesses, this.ignoreCameraViewport) : t && o.postProcessManager._finalizeFrame(!1, this._renderTarget ?? void 0, e);
      for (const u of o._afterRenderTargetPostProcessStage)
        u.action(this, e, s);
      this._texture && (this._texture.generateMipMaps = l), this._doNotChangeAspectRatio || o.updateTransformMatrix(!0), r && g.DumpFramebuffer(this.getRenderWidth(), this.getRenderHeight(), n);
    }
    this._unbindFrameBuffer(n, e), this._texture && this.isCube && e === 5 && n.generateMipMapsForCubemap(this._texture), n._debugPopGroup?.(1);
  }
  /**
   * Overrides the default sort function applied in the rendering group to prepare the meshes.
   * This allowed control for front to back rendering or reversely depending of the special needs.
   *
   * @param renderingGroupId The rendering group id corresponding to its index
   * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
   * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
   * @param transparentSortCompareFn The transparent queue comparison function use to sort.
   */
  setRenderingOrder(e, t = null, r = null, s = null) {
    this._renderingManager.setRenderingOrder(e, t, r, s);
  }
  /**
   * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
   *
   * @param renderingGroupId The rendering group id corresponding to its index
   * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
   */
  setRenderingAutoClearDepthStencil(e, t) {
    this._renderingManager.setRenderingAutoClearDepthStencil(e, t), this._renderingManager._useSceneAutoClearSetup = !1;
  }
  /**
   * Clones the texture.
   * @returns the cloned texture
   */
  clone() {
    const e = this.getSize(), t = new T(this.name, e, this.getScene(), this._renderTargetOptions.generateMipMaps, this._doNotChangeAspectRatio, this._renderTargetOptions.type, this.isCube, this._renderTargetOptions.samplingMode, this._renderTargetOptions.generateDepthBuffer, this._renderTargetOptions.generateStencilBuffer, void 0, this._renderTargetOptions.format, void 0, this._renderTargetOptions.samples);
    return t.hasAlpha = this.hasAlpha, t.level = this.level, t.coordinatesMode = this.coordinatesMode, this.renderList && (t.renderList = this.renderList.slice(0)), t;
  }
  /**
   * Serialize the texture to a JSON representation we can easily use in the respective Parse function.
   * @returns The JSON representation of the texture
   */
  serialize() {
    if (!this.name)
      return null;
    const e = super.serialize();
    if (e.renderTargetSize = this.getRenderSize(), e.renderList = [], this.renderList)
      for (let t = 0; t < this.renderList.length; t++)
        e.renderList.push(this.renderList[t].id);
    return e;
  }
  /**
   *  This will remove the attached framebuffer objects. The texture will not be able to be used as render target anymore
   */
  disposeFramebufferObjects() {
    this._renderTarget?.dispose(!0);
  }
  /**
   * Release and destroy the underlying lower level texture aka internalTexture.
   */
  releaseInternalTexture() {
    this._renderTarget?.releaseTextures(), this._texture = null;
  }
  /**
   * Dispose the texture and release its associated resources.
   */
  dispose() {
    this.onResizeObservable.clear(), this.onClearObservable.clear(), this.onAfterRenderObservable.clear(), this.onAfterUnbindObservable.clear(), this.onBeforeBindObservable.clear(), this.onBeforeRenderObservable.clear(), this._postProcessManager && (this._postProcessManager.dispose(), this._postProcessManager = null), this._prePassRenderTarget && this._prePassRenderTarget.dispose(), this._releaseRenderPassId(), this.clearPostProcesses(!0), this._resizeObserver && (this.getScene().getEngine().onResizeObservable.remove(this._resizeObserver), this._resizeObserver = null), this.renderList = null;
    const e = this.getScene();
    if (!e)
      return;
    let t = e.customRenderTargets.indexOf(this);
    t >= 0 && e.customRenderTargets.splice(t, 1);
    for (const r of e.cameras)
      t = r.customRenderTargets.indexOf(this), t >= 0 && r.customRenderTargets.splice(t, 1);
    this._renderTarget?.dispose(), this._renderTarget = null, this._texture = null, super.dispose();
  }
  /** @internal */
  _rebuild() {
    this.refreshRate === T.REFRESHRATE_RENDER_ONCE && (this.refreshRate = T.REFRESHRATE_RENDER_ONCE), this._postProcessManager && this._postProcessManager._rebuild();
  }
  /**
   * Clear the info related to rendering groups preventing retention point in material dispose.
   */
  freeRenderingGroups() {
    this._renderingManager && this._renderingManager.freeRenderingGroups();
  }
  /**
   * Gets the number of views the corresponding to the texture (eg. a MultiviewRenderTarget will have > 1)
   * @returns the view count
   */
  getViewCount() {
    return 1;
  }
}
T.REFRESHRATE_RENDER_ONCE = 0;
T.REFRESHRATE_RENDER_ONEVERYFRAME = 1;
T.REFRESHRATE_RENDER_ONEVERYTWOFRAMES = 2;
m._CreateRenderTargetTexture = (_, e, t, r, s) => new T(_, e, t, r);
export {
  g as D,
  Z as E,
  T as R,
  J as a
};
//# sourceMappingURL=renderTargetTexture-BMESl03G.js.map
