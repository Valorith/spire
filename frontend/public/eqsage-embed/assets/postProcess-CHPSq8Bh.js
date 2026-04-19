import { x as v, a1 as y, Y as A, a0 as B, L as F, aj as E, g as O, O as S, a5 as I, G as P, b as x, c as T, ak as U, R as N } from "./embed-entry-Bb6cfUYP.js";
import { S as w } from "./smartArray-BXymNR-c.js";
import { E as M } from "./engine-Br2P72Us.js";
import { S as D } from "./decorators.serialization-D-l6hUAn.js";
const W = "postprocessVertexShader", z = `attribute vec2 position;uniform vec2 scale;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=(position*madd+madd)*scale;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;
v.ShadersStore[W] = z;
class L {
  /**
   * Gets the depth/stencil texture (if created by a createDepthStencilTexture() call)
   */
  get depthStencilTexture() {
    return this._depthStencilTexture;
  }
  /**
   * Indicates if the depth/stencil texture has a stencil aspect
   */
  get depthStencilTextureWithStencil() {
    return this._depthStencilTextureWithStencil;
  }
  /**
   * Defines if the render target wrapper is for a cube texture or if false a 2d texture
   */
  get isCube() {
    return this._isCube;
  }
  /**
   * Defines if the render target wrapper is for a single or multi target render wrapper
   */
  get isMulti() {
    return this._isMulti;
  }
  /**
   * Defines if the render target wrapper is for a single or an array of textures
   */
  get is2DArray() {
    return this.layers > 0;
  }
  /**
   * Defines if the render target wrapper is for a 3D texture
   */
  get is3D() {
    return this.depth > 0;
  }
  /**
   * Gets the size of the render target wrapper (used for cubes, as width=height in this case)
   */
  get size() {
    return this.width;
  }
  /**
   * Gets the width of the render target wrapper
   */
  get width() {
    return this._size.width || this._size;
  }
  /**
   * Gets the height of the render target wrapper
   */
  get height() {
    return this._size.height || this._size;
  }
  /**
   * Gets the number of layers of the render target wrapper (only used if is2DArray is true and wrapper is not a multi render target)
   */
  get layers() {
    return this._size.layers || 0;
  }
  /**
   * Gets the depth of the render target wrapper (only used if is3D is true and wrapper is not a multi render target)
   */
  get depth() {
    return this._size.depth || 0;
  }
  /**
   * Gets the render texture. If this is a multi render target, gets the first texture
   */
  get texture() {
    return this._textures?.[0] ?? null;
  }
  /**
   * Gets the list of render textures. If we are not in a multi render target, the list will be null (use the texture getter instead)
   */
  get textures() {
    return this._textures;
  }
  /**
   * Gets the face indices that correspond to the list of render textures. If we are not in a multi render target, the list will be null
   */
  get faceIndices() {
    return this._faceIndices;
  }
  /**
   * Gets the layer indices that correspond to the list of render textures. If we are not in a multi render target, the list will be null
   */
  get layerIndices() {
    return this._layerIndices;
  }
  /**
   * Gets the sample count of the render target
   */
  get samples() {
    return this._samples;
  }
  /**
   * Sets the sample count of the render target
   * @param value sample count
   * @param initializeBuffers If set to true, the engine will make an initializing call to drawBuffers (only used when isMulti=true).
   * @param force true to force calling the update sample count engine function even if the current sample count is equal to value
   * @returns the sample count that has been set
   */
  setSamples(e, t = !0, r = !1) {
    if (this.samples === e && !r)
      return e;
    const s = this._isMulti ? this._engine.updateMultipleRenderTargetTextureSampleCount(this, e, t) : this._engine.updateRenderTargetTextureSampleCount(this, e);
    return this._samples = e, s;
  }
  /**
   * Initializes the render target wrapper
   * @param isMulti true if the wrapper is a multi render target
   * @param isCube true if the wrapper should render to a cube texture
   * @param size size of the render target (width/height/layers)
   * @param engine engine used to create the render target
   * @param label defines the label to use for the wrapper (for debugging purpose only)
   */
  constructor(e, t, r, s, i) {
    this._textures = null, this._faceIndices = null, this._layerIndices = null, this._samples = 1, this._attachments = null, this._generateStencilBuffer = !1, this._generateDepthBuffer = !1, this._depthStencilTextureWithStencil = !1, this._isMulti = e, this._isCube = t, this._size = r, this._engine = s, this._depthStencilTexture = null, this.label = i;
  }
  /**
   * Sets the render target texture(s)
   * @param textures texture(s) to set
   */
  setTextures(e) {
    Array.isArray(e) ? this._textures = e : e ? this._textures = [e] : this._textures = null;
  }
  /**
   * Set a texture in the textures array
   * @param texture The texture to set
   * @param index The index in the textures array to set
   * @param disposePrevious If this function should dispose the previous texture
   */
  setTexture(e, t = 0, r = !0) {
    this._textures || (this._textures = []), this._textures[t] !== e && (this._textures[t] && r && this._textures[t].dispose(), this._textures[t] = e);
  }
  /**
   * Sets the layer and face indices of every render target texture bound to each color attachment
   * @param layers The layers of each texture to be set
   * @param faces The faces of each texture to be set
   */
  setLayerAndFaceIndices(e, t) {
    this._layerIndices = e, this._faceIndices = t;
  }
  /**
   * Sets the layer and face indices of a texture in the textures array that should be bound to each color attachment
   * @param index The index of the texture in the textures array to modify
   * @param layer The layer of the texture to be set
   * @param face The face of the texture to be set
   */
  setLayerAndFaceIndex(e = 0, t, r) {
    this._layerIndices || (this._layerIndices = []), this._faceIndices || (this._faceIndices = []), t !== void 0 && t >= 0 && (this._layerIndices[e] = t), r !== void 0 && r >= 0 && (this._faceIndices[e] = r);
  }
  /**
   * Creates the depth/stencil texture
   * @param comparisonFunction Comparison function to use for the texture
   * @param bilinearFiltering true if bilinear filtering should be used when sampling the texture
   * @param generateStencil true if the stencil aspect should also be created
   * @param samples sample count to use when creating the texture
   * @param format format of the depth texture
   * @param label defines the label to use for the texture (for debugging purpose only)
   * @returns the depth/stencil created texture
   */
  createDepthStencilTexture(e = 0, t = !0, r = !1, s = 1, i = 14, n) {
    return this._depthStencilTexture?.dispose(), this._depthStencilTextureWithStencil = r, this._depthStencilTextureLabel = n, this._depthStencilTexture = this._engine.createDepthStencilTexture(this._size, {
      bilinearFiltering: t,
      comparisonFunction: e,
      generateStencil: r,
      isCube: this._isCube,
      samples: s,
      depthTextureFormat: i,
      label: n
    }, this), this._depthStencilTexture;
  }
  /**
   * @deprecated Use shareDepth instead
   * @param renderTarget Destination renderTarget
   */
  _shareDepth(e) {
    this.shareDepth(e);
  }
  /**
   * Shares the depth buffer of this render target with another render target.
   * @param renderTarget Destination renderTarget
   */
  shareDepth(e) {
    this._depthStencilTexture && (e._depthStencilTexture && e._depthStencilTexture.dispose(), e._depthStencilTexture = this._depthStencilTexture, e._depthStencilTextureWithStencil = this._depthStencilTextureWithStencil, this._depthStencilTexture.incrementReferences());
  }
  /**
   * @internal
   */
  _swapAndDie(e) {
    this.texture && this.texture._swapAndDie(e), this._textures = null, this.dispose(!0);
  }
  _cloneRenderTargetWrapper() {
    let e = null;
    if (this._isMulti) {
      const t = this.textures;
      if (t && t.length > 0) {
        let r = !1, s = t.length, i = -1;
        const n = t[t.length - 1]._source;
        (n === y.Depth || n === y.DepthStencil) && (r = !0, i = t[t.length - 1].format, s--);
        const h = [], l = [], u = [], o = [], d = [], m = [], _ = [], b = {};
        for (let c = 0; c < s; ++c) {
          const g = t[c];
          h.push(g.samplingMode), l.push(g.type), u.push(g.format), b[g.uniqueId] !== void 0 ? (o.push(-1), _.push(0)) : (b[g.uniqueId] = c, g.is2DArray ? (o.push(35866), _.push(g.depth)) : g.isCube ? (o.push(34067), _.push(0)) : g.is3D ? (o.push(32879), _.push(g.depth)) : (o.push(3553), _.push(0))), this._faceIndices && d.push(this._faceIndices[c] ?? 0), this._layerIndices && m.push(this._layerIndices[c] ?? 0);
        }
        const C = {
          samplingModes: h,
          generateMipMaps: t[0].generateMipMaps,
          generateDepthBuffer: this._generateDepthBuffer,
          generateStencilBuffer: this._generateStencilBuffer,
          generateDepthTexture: r,
          depthTextureFormat: i,
          types: l,
          formats: u,
          textureCount: s,
          targetTypes: o,
          faceIndex: d,
          layerIndex: m,
          layerCounts: _,
          label: this.label
        }, R = {
          width: this.width,
          height: this.height,
          depth: this.depth
        };
        e = this._engine.createMultipleRenderTarget(R, C);
        for (let c = 0; c < s; ++c) {
          if (o[c] !== -1)
            continue;
          const g = b[t[c].uniqueId];
          e.setTexture(e.textures[g], c);
        }
      }
    } else {
      const t = {};
      if (t.generateDepthBuffer = this._generateDepthBuffer, t.generateMipMaps = this.texture?.generateMipMaps ?? !1, t.generateStencilBuffer = this._generateStencilBuffer, t.samplingMode = this.texture?.samplingMode, t.type = this.texture?.type, t.format = this.texture?.format, t.noColorAttachment = !this._textures, t.label = this.label, this.isCube)
        e = this._engine.createRenderTargetCubeTexture(this.width, t);
      else {
        const r = {
          width: this.width,
          height: this.height,
          layers: this.is2DArray || this.is3D ? this.texture?.depth : void 0
        };
        e = this._engine.createRenderTargetTexture(r, t);
      }
      e.texture && (e.texture.isReady = !0);
    }
    return e;
  }
  _swapRenderTargetWrapper(e) {
    if (this._textures && e._textures)
      for (let t = 0; t < this._textures.length; ++t)
        this._textures[t]._swapAndDie(e._textures[t], !1), e._textures[t].isReady = !0;
    this._depthStencilTexture && e._depthStencilTexture && (this._depthStencilTexture._swapAndDie(e._depthStencilTexture), e._depthStencilTexture.isReady = !0), this._textures = null, this._depthStencilTexture = null;
  }
  /** @internal */
  _rebuild() {
    const e = this._cloneRenderTargetWrapper();
    if (e) {
      if (this._depthStencilTexture) {
        const t = this._depthStencilTexture.samplingMode, r = this._depthStencilTexture.format, s = t === 2 || t === 3 || t === 11;
        e.createDepthStencilTexture(this._depthStencilTexture._comparisonFunction, s, this._depthStencilTextureWithStencil, this._depthStencilTexture.samples, r, this._depthStencilTextureLabel);
      }
      this.samples > 1 && e.setSamples(this.samples), e._swapRenderTargetWrapper(this), e.dispose();
    }
  }
  /**
   * Releases the internal render textures
   */
  releaseTextures() {
    if (this._textures)
      for (let e = 0; e < this._textures?.length; ++e)
        this._textures[e].dispose();
    this._textures = null;
  }
  /**
   * Disposes the whole render target wrapper
   * @param disposeOnlyFramebuffers true if only the frame buffers should be released (used for the WebGL engine). If false, all the textures will also be released
   */
  dispose(e = !1) {
    e || (this._depthStencilTexture?.dispose(), this._depthStencilTexture = null, this.releaseTextures()), this._engine._releaseRenderTargetWrapper(this);
  }
}
class H extends L {
  constructor(e, t, r, s, i) {
    super(e, t, r, s), this._framebuffer = null, this._depthStencilBuffer = null, this._MSAAFramebuffer = null, this._colorTextureArray = null, this._depthStencilTextureArray = null, this._disposeOnlyFramebuffers = !1, this._currentLOD = 0, this._context = i;
  }
  _cloneRenderTargetWrapper() {
    let e = null;
    return this._colorTextureArray && this._depthStencilTextureArray ? (e = this._engine.createMultiviewRenderTargetTexture(this.width, this.height), e.texture.isReady = !0) : e = super._cloneRenderTargetWrapper(), e;
  }
  _swapRenderTargetWrapper(e) {
    super._swapRenderTargetWrapper(e), e._framebuffer = this._framebuffer, e._depthStencilBuffer = this._depthStencilBuffer, e._MSAAFramebuffer = this._MSAAFramebuffer, e._colorTextureArray = this._colorTextureArray, e._depthStencilTextureArray = this._depthStencilTextureArray, this._framebuffer = this._depthStencilBuffer = this._MSAAFramebuffer = this._colorTextureArray = this._depthStencilTextureArray = null;
  }
  /**
   * Creates the depth/stencil texture
   * @param comparisonFunction Comparison function to use for the texture
   * @param bilinearFiltering true if bilinear filtering should be used when sampling the texture
   * @param generateStencil true if the stencil aspect should also be created
   * @param samples sample count to use when creating the texture
   * @param format format of the depth texture
   * @param label defines the label to use for the texture (for debugging purpose only)
   * @returns the depth/stencil created texture
   */
  createDepthStencilTexture(e = 0, t = !0, r = !1, s = 1, i = 14, n) {
    if (this._depthStencilBuffer) {
      const h = this._engine._currentFramebuffer, l = this._context;
      this._engine._bindUnboundFramebuffer(this._framebuffer), l.framebufferRenderbuffer(l.FRAMEBUFFER, l.DEPTH_STENCIL_ATTACHMENT, l.RENDERBUFFER, null), l.framebufferRenderbuffer(l.FRAMEBUFFER, l.DEPTH_ATTACHMENT, l.RENDERBUFFER, null), l.framebufferRenderbuffer(l.FRAMEBUFFER, l.STENCIL_ATTACHMENT, l.RENDERBUFFER, null), this._engine._bindUnboundFramebuffer(h), l.deleteRenderbuffer(this._depthStencilBuffer), this._depthStencilBuffer = null;
    }
    return super.createDepthStencilTexture(e, t, r, s, i, n);
  }
  /**
   * Shares the depth buffer of this render target with another render target.
   * @param renderTarget Destination renderTarget
   */
  shareDepth(e) {
    super.shareDepth(e);
    const t = this._context, r = this._depthStencilBuffer, s = e._MSAAFramebuffer || e._framebuffer;
    e._depthStencilBuffer && e._depthStencilBuffer !== r && t.deleteRenderbuffer(e._depthStencilBuffer), e._depthStencilBuffer = r;
    const i = e._generateStencilBuffer ? t.DEPTH_STENCIL_ATTACHMENT : t.DEPTH_ATTACHMENT;
    this._engine._bindUnboundFramebuffer(s), t.framebufferRenderbuffer(t.FRAMEBUFFER, i, t.RENDERBUFFER, r), this._engine._bindUnboundFramebuffer(null);
  }
  /**
   * Binds a texture to this render target on a specific attachment
   * @param texture The texture to bind to the framebuffer
   * @param attachmentIndex Index of the attachment
   * @param faceIndexOrLayer The face or layer of the texture to render to in case of cube texture or array texture
   * @param lodLevel defines the lod level to bind to the frame buffer
   */
  _bindTextureRenderTarget(e, t = 0, r, s = 0) {
    if (!e._hardwareTexture)
      return;
    const i = this._framebuffer, n = this._engine._currentFramebuffer;
    if (this._engine._bindUnboundFramebuffer(i), this._engine.webGLVersion > 1) {
      const h = this._context, l = h["COLOR_ATTACHMENT" + t];
      e.is2DArray || e.is3D ? (r = r ?? this.layerIndices?.[t] ?? 0, h.framebufferTextureLayer(h.FRAMEBUFFER, l, e._hardwareTexture.underlyingResource, s, r)) : e.isCube ? (r = r ?? this.faceIndices?.[t] ?? 0, h.framebufferTexture2D(h.FRAMEBUFFER, l, h.TEXTURE_CUBE_MAP_POSITIVE_X + r, e._hardwareTexture.underlyingResource, s)) : h.framebufferTexture2D(h.FRAMEBUFFER, l, h.TEXTURE_2D, e._hardwareTexture.underlyingResource, s);
    } else {
      const h = this._context, l = h["COLOR_ATTACHMENT" + t + "_WEBGL"], u = r !== void 0 ? h.TEXTURE_CUBE_MAP_POSITIVE_X + r : h.TEXTURE_2D;
      h.framebufferTexture2D(h.FRAMEBUFFER, l, u, e._hardwareTexture.underlyingResource, s);
    }
    this._engine._bindUnboundFramebuffer(n);
  }
  /**
   * Set a texture in the textures array
   * @param texture the texture to set
   * @param index the index in the textures array to set
   * @param disposePrevious If this function should dispose the previous texture
   */
  setTexture(e, t = 0, r = !0) {
    super.setTexture(e, t, r), this._bindTextureRenderTarget(e, t);
  }
  /**
   * Sets the layer and face indices of every render target texture
   * @param layers The layer of the texture to be set (make negative to not modify)
   * @param faces The face of the texture to be set (make negative to not modify)
   */
  setLayerAndFaceIndices(e, t) {
    if (super.setLayerAndFaceIndices(e, t), !this.textures || !this.layerIndices || !this.faceIndices)
      return;
    const r = this._attachments?.length ?? this.textures.length;
    for (let s = 0; s < r; s++) {
      const i = this.textures[s];
      i && (i.is2DArray || i.is3D ? this._bindTextureRenderTarget(i, s, this.layerIndices[s]) : i.isCube ? this._bindTextureRenderTarget(i, s, this.faceIndices[s]) : this._bindTextureRenderTarget(i, s));
    }
  }
  /**
   * Set the face and layer indices of a texture in the textures array
   * @param index The index of the texture in the textures array to modify
   * @param layer The layer of the texture to be set
   * @param face The face of the texture to be set
   */
  setLayerAndFaceIndex(e = 0, t, r) {
    if (super.setLayerAndFaceIndex(e, t, r), !this.textures || !this.layerIndices || !this.faceIndices)
      return;
    const s = this.textures[e];
    s.is2DArray || s.is3D ? this._bindTextureRenderTarget(this.textures[e], e, this.layerIndices[e]) : s.isCube && this._bindTextureRenderTarget(this.textures[e], e, this.faceIndices[e]);
  }
  dispose(e = this._disposeOnlyFramebuffers) {
    const t = this._context;
    e || (this._colorTextureArray && (this._context.deleteTexture(this._colorTextureArray), this._colorTextureArray = null), this._depthStencilTextureArray && (this._context.deleteTexture(this._depthStencilTextureArray), this._depthStencilTextureArray = null)), this._framebuffer && (t.deleteFramebuffer(this._framebuffer), this._framebuffer = null), this._depthStencilBuffer && (t.deleteRenderbuffer(this._depthStencilBuffer), this._depthStencilBuffer = null), this._MSAAFramebuffer && (t.deleteFramebuffer(this._MSAAFramebuffer), this._MSAAFramebuffer = null), super.dispose(e);
  }
}
A.prototype._createHardwareRenderTargetWrapper = function(a, e, t) {
  const r = new H(a, e, t, this, this._gl);
  return this._renderTargetWrapperCache.push(r), r;
};
A.prototype.createRenderTargetTexture = function(a, e) {
  const t = this._createHardwareRenderTargetWrapper(!1, !1, a);
  let r = !0, s = !1, i = !1, n, h = 1, l;
  e !== void 0 && typeof e == "object" && (r = e.generateDepthBuffer ?? !0, s = !!e.generateStencilBuffer, i = !!e.noColorAttachment, n = e.colorAttachment, h = e.samples ?? 1, l = e.label);
  const u = n || (i ? null : this._createInternalTexture(a, e, !0, y.RenderTarget)), o = a.width || a, d = a.height || a, m = this._currentFramebuffer, _ = this._gl, b = _.createFramebuffer();
  return this._bindUnboundFramebuffer(b), t._depthStencilBuffer = this._setupFramebufferDepthAttachments(s, r, o, d), u && !u.is2DArray && !u.is3D && _.framebufferTexture2D(_.FRAMEBUFFER, _.COLOR_ATTACHMENT0, _.TEXTURE_2D, u._hardwareTexture.underlyingResource, 0), this._bindUnboundFramebuffer(m), t.label = l ?? "RenderTargetWrapper", t._framebuffer = b, t._generateDepthBuffer = r, t._generateStencilBuffer = s, t.setTextures(u), this.updateRenderTargetTextureSampleCount(t, h), t;
};
A.prototype.createDepthStencilTexture = function(a, e, t) {
  if (e.isCube) {
    const r = a.width || a;
    return this._createDepthStencilCubeTexture(r, e);
  } else
    return this._createDepthStencilTexture(a, e, t);
};
A.prototype._createDepthStencilTexture = function(a, e) {
  const t = this._gl, r = a.layers || 0, s = a.depth || 0;
  let i = t.TEXTURE_2D;
  r !== 0 ? i = t.TEXTURE_2D_ARRAY : s !== 0 && (i = t.TEXTURE_3D);
  const n = new B(this, y.DepthStencil);
  if (n.label = e.label, !this._caps.depthTextureExtension)
    return F.Error("Depth texture is not supported by your browser or hardware."), n;
  const h = {
    bilinearFiltering: !1,
    comparisonFunction: 0,
    generateStencil: !1,
    ...e
  };
  if (this._bindTextureDirectly(i, n, !0), this._setupDepthStencilTexture(n, a, h.generateStencil, h.comparisonFunction === 0 ? !1 : h.bilinearFiltering, h.comparisonFunction, h.samples), h.depthTextureFormat !== void 0) {
    if (h.depthTextureFormat !== 15 && h.depthTextureFormat !== 16 && h.depthTextureFormat !== 17 && h.depthTextureFormat !== 13 && h.depthTextureFormat !== 14 && h.depthTextureFormat !== 18)
      return F.Error("Depth texture format is not supported."), n;
    n.format = h.depthTextureFormat;
  } else
    n.format = h.generateStencil ? 13 : 16;
  const l = n.format === 17 || n.format === 13 || n.format === 18;
  let u = t.UNSIGNED_INT;
  n.format === 15 ? u = t.UNSIGNED_SHORT : n.format === 17 || n.format === 13 ? u = t.UNSIGNED_INT_24_8 : n.format === 14 ? u = t.FLOAT : n.format === 18 && (u = t.FLOAT_32_UNSIGNED_INT_24_8_REV);
  const o = l ? t.DEPTH_STENCIL : t.DEPTH_COMPONENT;
  let d = o;
  return this.webGLVersion > 1 && (n.format === 15 ? d = t.DEPTH_COMPONENT16 : n.format === 16 ? d = t.DEPTH_COMPONENT24 : n.format === 17 || n.format === 13 ? d = t.DEPTH24_STENCIL8 : n.format === 14 ? d = t.DEPTH_COMPONENT32F : n.format === 18 && (d = t.DEPTH32F_STENCIL8)), n.is2DArray ? t.texImage3D(i, 0, d, n.width, n.height, r, 0, o, u, null) : n.is3D ? t.texImage3D(i, 0, d, n.width, n.height, s, 0, o, u, null) : t.texImage2D(i, 0, d, n.width, n.height, 0, o, u, null), this._bindTextureDirectly(i, null), this._internalTexturesCache.push(n), n;
};
A.prototype.updateRenderTargetTextureSampleCount = function(a, e) {
  if (this.webGLVersion < 2 || !a || !a.texture)
    return 1;
  if (a.samples === e)
    return e;
  const t = this._gl;
  e = Math.min(e, this.getCaps().maxMSAASamples), a._depthStencilBuffer && (t.deleteRenderbuffer(a._depthStencilBuffer), a._depthStencilBuffer = null), a._MSAAFramebuffer && (t.deleteFramebuffer(a._MSAAFramebuffer), a._MSAAFramebuffer = null);
  const r = a.texture._hardwareTexture;
  if (r.releaseMSAARenderBuffers(), e > 1 && typeof t.renderbufferStorageMultisample == "function") {
    const s = t.createFramebuffer();
    if (!s)
      throw new Error("Unable to create multi sampled framebuffer");
    a._MSAAFramebuffer = s, this._bindUnboundFramebuffer(a._MSAAFramebuffer);
    const i = this._createRenderBuffer(a.texture.width, a.texture.height, e, -1, this._getRGBABufferInternalSizedFormat(a.texture.type, a.texture.format, a.texture._useSRGBBuffer), t.COLOR_ATTACHMENT0, !1);
    if (!i)
      throw new Error("Unable to create multi sampled framebuffer");
    r.addMSAARenderBuffer(i);
  } else
    this._bindUnboundFramebuffer(a._framebuffer);
  return a.texture.samples = e, a._samples = e, a._depthStencilBuffer = this._setupFramebufferDepthAttachments(a._generateStencilBuffer, a._generateDepthBuffer, a.texture.width, a.texture.height, e), this._bindUnboundFramebuffer(null), e;
};
class f {
  /**
   * Registers a shader code processing with a post process name.
   * @param postProcessName name of the post process. Use null for the fallback shader code processing. This is the shader code processing that will be used in case no specific shader code processing has been associated to a post process name
   * @param customShaderCodeProcessing shader code processing to associate to the post process name
   */
  static RegisterShaderCodeProcessing(e, t) {
    if (!t) {
      delete f._CustomShaderCodeProcessing[e ?? ""];
      return;
    }
    f._CustomShaderCodeProcessing[e ?? ""] = t;
  }
  static _GetShaderCodeProcessing(e) {
    return f._CustomShaderCodeProcessing[e] ?? f._CustomShaderCodeProcessing[""];
  }
  /**
   * Number of sample textures (default: 1)
   */
  get samples() {
    return this._samples;
  }
  set samples(e) {
    this._samples = Math.min(e, this._engine.getCaps().maxMSAASamples), this._textures.forEach((t) => {
      t.setSamples(this._samples);
    });
  }
  /**
   * Returns the fragment url or shader name used in the post process.
   * @returns the fragment url or name in the shader store.
   */
  getEffectName() {
    return this._fragmentUrl;
  }
  /**
   * A function that is added to the onActivateObservable
   */
  set onActivate(e) {
    this._onActivateObserver && this.onActivateObservable.remove(this._onActivateObserver), e && (this._onActivateObserver = this.onActivateObservable.add(e));
  }
  /**
   * A function that is added to the onSizeChangedObservable
   */
  set onSizeChanged(e) {
    this._onSizeChangedObserver && this.onSizeChangedObservable.remove(this._onSizeChangedObserver), this._onSizeChangedObserver = this.onSizeChangedObservable.add(e);
  }
  /**
   * A function that is added to the onApplyObservable
   */
  set onApply(e) {
    this._onApplyObserver && this.onApplyObservable.remove(this._onApplyObserver), this._onApplyObserver = this.onApplyObservable.add(e);
  }
  /**
   * A function that is added to the onBeforeRenderObservable
   */
  set onBeforeRender(e) {
    this._onBeforeRenderObserver && this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver), this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(e);
  }
  /**
   * A function that is added to the onAfterRenderObservable
   */
  set onAfterRender(e) {
    this._onAfterRenderObserver && this.onAfterRenderObservable.remove(this._onAfterRenderObserver), this._onAfterRenderObserver = this.onAfterRenderObservable.add(e);
  }
  /**
   * The input texture for this post process and the output texture of the previous post process. When added to a pipeline the previous post process will
   * render it's output into this texture and this texture will be used as textureSampler in the fragment shader of this post process.
   */
  get inputTexture() {
    return this._textures.data[this._currentRenderTextureInd];
  }
  set inputTexture(e) {
    this._forcedOutputTexture = e;
  }
  /**
   * Since inputTexture should always be defined, if we previously manually set `inputTexture`,
   * the only way to unset it is to use this function to restore its internal state
   */
  restoreDefaultInputTexture() {
    this._forcedOutputTexture && (this._forcedOutputTexture = null, this.markTextureDirty());
  }
  /**
   * Gets the camera which post process is applied to.
   * @returns The camera the post process is applied to.
   */
  getCamera() {
    return this._camera;
  }
  /**
   * Gets the texel size of the postprocess.
   * See https://en.wikipedia.org/wiki/Texel_(graphics)
   */
  get texelSize() {
    return this._shareOutputWithPostProcess ? this._shareOutputWithPostProcess.texelSize : (this._forcedOutputTexture && this._texelSize.copyFromFloats(1 / this._forcedOutputTexture.width, 1 / this._forcedOutputTexture.height), this._texelSize);
  }
  /** @internal */
  constructor(e, t, r, s, i, n, h = 1, l, u, o = null, d = 0, m = "postprocess", _, b = !1, C = 5, R = E.GLSL) {
    this._parentContainer = null, this.width = -1, this.height = -1, this.nodeMaterialSource = null, this._outputTexture = null, this.autoClear = !0, this.forceAutoClearInAlphaMode = !1, this.alphaMode = 0, this.animations = [], this.enablePixelPerfectMode = !1, this.forceFullscreenViewport = !0, this.scaleMode = 1, this.alwaysForcePOT = !1, this._samples = 1, this.adaptScaleToCurrentViewport = !1, this._reusable = !1, this._renderId = 0, this.externalTextureSamplerBinding = !1, this._textures = new w(2), this._textureCache = [], this._currentRenderTextureInd = 0, this._scaleRatio = new O(1, 1), this._texelSize = O.Zero(), this.onActivateObservable = new S(), this.onSizeChangedObservable = new S(), this.onApplyObservable = new S(), this.onBeforeRenderObservable = new S(), this.onAfterRenderObservable = new S(), this.name = e;
    let c = 1, g = null;
    if (r && !Array.isArray(r)) {
      const p = r;
      r = p.uniforms ?? null, s = p.samplers ?? null, c = p.size ?? 1, n = p.camera ?? null, h = p.samplingMode ?? 1, l = p.engine, u = p.reusable, o = p.defines ?? null, d = p.textureType ?? 0, m = p.vertexUrl ?? "postprocess", _ = p.indexParameters, b = p.blockCompilation ?? !1, C = p.textureFormat ?? 5, R = p.shaderLanguage ?? E.GLSL, g = p.uniformBuffers ?? null;
    } else i && (typeof i == "number" ? c = i : c = { width: i.width, height: i.height });
    n != null ? (this._camera = n, this._scene = n.getScene(), n.attachPostProcess(this), this._engine = this._scene.getEngine(), this._scene.postProcesses.push(this), this.uniqueId = this._scene.getUniqueId()) : l && (this._engine = l, this._engine.postProcesses.push(this)), this._options = c, this.renderTargetSamplingMode = h || 1, this._reusable = u || !1, this._textureType = d, this._textureFormat = C, this._shaderLanguage = R, this._samplers = s || [], this._samplers.push("textureSampler"), this._fragmentUrl = t, this._vertexUrl = m, this._parameters = r || [], this._parameters.push("scale"), this._uniformBuffers = g || [], this._indexParameters = _, this._drawWrapper = new I(this._engine), b || this.updateEffect(o);
  }
  /**
   * Gets a string identifying the name of the class
   * @returns "PostProcess" string
   */
  getClassName() {
    return "PostProcess";
  }
  /**
   * Gets the engine which this post process belongs to.
   * @returns The engine the post process was enabled with.
   */
  getEngine() {
    return this._engine;
  }
  /**
   * The effect that is created when initializing the post process.
   * @returns The created effect corresponding the postprocess.
   */
  getEffect() {
    return this._drawWrapper.effect;
  }
  /**
   * To avoid multiple redundant textures for multiple post process, the output the output texture for this post process can be shared with another.
   * @param postProcess The post process to share the output with.
   * @returns This post process.
   */
  shareOutputWith(e) {
    return this._disposeTextures(), this._shareOutputWithPostProcess = e, this;
  }
  /**
   * Reverses the effect of calling shareOutputWith and returns the post process back to its original state.
   * This should be called if the post process that shares output with this post process is disabled/disposed.
   */
  useOwnOutput() {
    this._textures.length == 0 && (this._textures = new w(2)), this._shareOutputWithPostProcess = null;
  }
  /**
   * Updates the effect with the current post process compile time values and recompiles the shader.
   * @param defines Define statements that should be added at the beginning of the shader. (default: null)
   * @param uniforms Set of uniform variables that will be passed to the shader. (default: null)
   * @param samplers Set of Texture2D variables that will be passed to the shader. (default: null)
   * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
   * @param onCompiled Called when the shader has been compiled.
   * @param onError Called if there is an error when compiling a shader.
   * @param vertexUrl The url of the vertex shader to be used (default: the one given at construction time)
   * @param fragmentUrl The url of the fragment shader to be used (default: the one given at construction time)
   */
  updateEffect(e = null, t = null, r = null, s, i, n, h, l) {
    const u = f._GetShaderCodeProcessing(this.name);
    if (u?.defineCustomBindings) {
      const o = t?.slice() ?? [];
      o.push(...this._parameters);
      const d = r?.slice() ?? [];
      d.push(...this._samplers), e = u.defineCustomBindings(this.name, e, o, d), t = o, r = d;
    }
    this._postProcessDefines = e, this._drawWrapper.effect = this._engine.createEffect({ vertex: h ?? this._vertexUrl, fragment: l ?? this._fragmentUrl }, {
      attributes: ["position"],
      uniformsNames: t || this._parameters,
      uniformBuffersNames: this._uniformBuffers,
      samplers: r || this._samplers,
      defines: e !== null ? e : "",
      fallbacks: null,
      onCompiled: i ?? null,
      onError: n ?? null,
      indexParameters: s || this._indexParameters,
      processCodeAfterIncludes: u?.processCodeAfterIncludes ? (o, d) => u.processCodeAfterIncludes(this.name, o, d) : null,
      processFinalCode: u?.processFinalCode ? (o, d) => u.processFinalCode(this.name, o, d) : null,
      shaderLanguage: this._shaderLanguage
    }, this._engine);
  }
  /**
   * The post process is reusable if it can be used multiple times within one frame.
   * @returns If the post process is reusable
   */
  isReusable() {
    return this._reusable;
  }
  /** invalidate frameBuffer to hint the postprocess to create a depth buffer */
  markTextureDirty() {
    this.width = -1;
  }
  _createRenderTargetTexture(e, t, r = 0) {
    for (let i = 0; i < this._textureCache.length; i++)
      if (this._textureCache[i].texture.width === e.width && this._textureCache[i].texture.height === e.height && this._textureCache[i].postProcessChannel === r && this._textureCache[i].texture._generateDepthBuffer === t.generateDepthBuffer && this._textureCache[i].texture.samples === t.samples)
        return this._textureCache[i].texture;
    const s = this._engine.createRenderTargetTexture(e, t);
    return this._textureCache.push({ texture: s, postProcessChannel: r, lastUsedRenderId: -1 }), s;
  }
  _flushTextureCache() {
    const e = this._renderId;
    for (let t = this._textureCache.length - 1; t >= 0; t--)
      if (e - this._textureCache[t].lastUsedRenderId > 100) {
        let r = !1;
        for (let s = 0; s < this._textures.length; s++)
          if (this._textures.data[s] === this._textureCache[t].texture) {
            r = !0;
            break;
          }
        r || (this._textureCache[t].texture.dispose(), this._textureCache.splice(t, 1));
      }
  }
  /**
   * Resizes the post-process texture
   * @param width Width of the texture
   * @param height Height of the texture
   * @param camera The camera this post-process is applied to. Pass null if the post-process is used outside the context of a camera post-process chain (default: null)
   * @param needMipMaps True if mip maps need to be generated after render (default: false)
   * @param forceDepthStencil True to force post-process texture creation with stencil depth and buffer (default: false)
   */
  resize(e, t, r = null, s = !1, i = !1) {
    this._textures.length > 0 && this._textures.reset(), this.width = e, this.height = t;
    let n = null;
    if (r) {
      for (let u = 0; u < r._postProcesses.length; u++)
        if (r._postProcesses[u] !== null) {
          n = r._postProcesses[u];
          break;
        }
    }
    const h = { width: this.width, height: this.height }, l = {
      generateMipMaps: s,
      generateDepthBuffer: i || n === this,
      generateStencilBuffer: (i || n === this) && this._engine.isStencilEnable,
      samplingMode: this.renderTargetSamplingMode,
      type: this._textureType,
      format: this._textureFormat,
      samples: this._samples,
      label: "PostProcessRTT-" + this.name
    };
    this._textures.push(this._createRenderTargetTexture(h, l, 0)), this._reusable && this._textures.push(this._createRenderTargetTexture(h, l, 1)), this._texelSize.copyFromFloats(1 / this.width, 1 / this.height), this.onSizeChangedObservable.notifyObservers(this);
  }
  _getTarget() {
    let e;
    if (this._shareOutputWithPostProcess)
      e = this._shareOutputWithPostProcess.inputTexture;
    else if (this._forcedOutputTexture)
      e = this._forcedOutputTexture, this.width = this._forcedOutputTexture.width, this.height = this._forcedOutputTexture.height;
    else {
      e = this.inputTexture;
      let t;
      for (let r = 0; r < this._textureCache.length; r++)
        if (this._textureCache[r].texture === e) {
          t = this._textureCache[r];
          break;
        }
      t && (t.lastUsedRenderId = this._renderId);
    }
    return e;
  }
  /**
   * Activates the post process by intializing the textures to be used when executed. Notifies onActivateObservable.
   * When this post process is used in a pipeline, this is call will bind the input texture of this post process to the output of the previous.
   * @param camera The camera that will be used in the post process. This camera will be used when calling onActivateObservable.
   * @param sourceTexture The source texture to be inspected to get the width and height if not specified in the post process constructor. (default: null)
   * @param forceDepthStencil If true, a depth and stencil buffer will be generated. (default: false)
   * @returns The render target wrapper that was bound to be written to.
   */
  activate(e, t = null, r) {
    e = e || this._camera;
    const s = e.getScene(), i = s.getEngine(), n = i.getCaps().maxTextureSize, h = (t ? t.width : this._engine.getRenderWidth(!0)) * this._options | 0, l = (t ? t.height : this._engine.getRenderHeight(!0)) * this._options | 0;
    let u = this._options.width || h, o = this._options.height || l;
    const d = this.renderTargetSamplingMode !== 7 && this.renderTargetSamplingMode !== 1 && this.renderTargetSamplingMode !== 2;
    let m = null;
    if (!this._shareOutputWithPostProcess && !this._forcedOutputTexture) {
      if (this.adaptScaleToCurrentViewport) {
        const _ = i.currentViewport;
        _ && (u *= _.width, o *= _.height);
      }
      (d || this.alwaysForcePOT) && (this._options.width || (u = i.needPOTTextures ? M.GetExponentOfTwo(u, n, this.scaleMode) : u), this._options.height || (o = i.needPOTTextures ? M.GetExponentOfTwo(o, n, this.scaleMode) : o)), (this.width !== u || this.height !== o || !(m = this._getTarget())) && this.resize(u, o, e, d, r), this._textures.forEach((_) => {
        _.samples !== this.samples && this._engine.updateRenderTargetTextureSampleCount(_, this.samples);
      }), this._flushTextureCache(), this._renderId++;
    }
    return m || (m = this._getTarget()), this.enablePixelPerfectMode ? (this._scaleRatio.copyFromFloats(h / u, l / o), this._engine.bindFramebuffer(m, 0, h, l, this.forceFullscreenViewport)) : (this._scaleRatio.copyFromFloats(1, 1), this._engine.bindFramebuffer(m, 0, void 0, void 0, this.forceFullscreenViewport)), this._engine._debugInsertMarker?.(`post process ${this.name} input`), this.onActivateObservable.notifyObservers(e), this.autoClear && (this.alphaMode === 0 || this.forceAutoClearInAlphaMode) && this._engine.clear(this.clearColor ? this.clearColor : s.clearColor, s._allowPostProcessClearColor, !0, !0), this._reusable && (this._currentRenderTextureInd = (this._currentRenderTextureInd + 1) % 2), m;
  }
  /**
   * If the post process is supported.
   */
  get isSupported() {
    return this._drawWrapper.effect.isSupported;
  }
  /**
   * The aspect ratio of the output texture.
   */
  get aspectRatio() {
    return this._shareOutputWithPostProcess ? this._shareOutputWithPostProcess.aspectRatio : this._forcedOutputTexture ? this._forcedOutputTexture.width / this._forcedOutputTexture.height : this.width / this.height;
  }
  /**
   * Get a value indicating if the post-process is ready to be used
   * @returns true if the post-process is ready (shader is compiled)
   */
  isReady() {
    return this._drawWrapper.effect?.isReady() ?? !1;
  }
  /**
   * Binds all textures and uniforms to the shader, this will be run on every pass.
   * @returns the effect corresponding to this post process. Null if not compiled or not ready.
   */
  apply() {
    if (!this._drawWrapper.effect?.isReady())
      return null;
    this._engine.enableEffect(this._drawWrapper), this._engine.setState(!1), this._engine.setDepthBuffer(!1), this._engine.setDepthWrite(!1), this._engine.setAlphaMode(this.alphaMode), this.alphaConstants && this.getEngine().setAlphaConstants(this.alphaConstants.r, this.alphaConstants.g, this.alphaConstants.b, this.alphaConstants.a);
    let e;
    return this._shareOutputWithPostProcess ? e = this._shareOutputWithPostProcess.inputTexture : this._forcedOutputTexture ? e = this._forcedOutputTexture : e = this.inputTexture, this.externalTextureSamplerBinding || this._drawWrapper.effect._bindTexture("textureSampler", e?.texture), this._drawWrapper.effect.setVector2("scale", this._scaleRatio), this.onApplyObservable.notifyObservers(this._drawWrapper.effect), f._GetShaderCodeProcessing(this.name)?.bindCustomBindings?.(this.name, this._drawWrapper.effect), this._drawWrapper.effect;
  }
  _disposeTextures() {
    if (this._shareOutputWithPostProcess || this._forcedOutputTexture) {
      this._disposeTextureCache();
      return;
    }
    this._disposeTextureCache(), this._textures.dispose();
  }
  _disposeTextureCache() {
    for (let e = this._textureCache.length - 1; e >= 0; e--)
      this._textureCache[e].texture.dispose();
    this._textureCache.length = 0;
  }
  /**
   * Sets the required values to the prepass renderer.
   * @param prePassRenderer defines the prepass renderer to setup.
   * @returns true if the pre pass is needed.
   */
  setPrePassRenderer(e) {
    return this._prePassEffectConfiguration ? (this._prePassEffectConfiguration = e.addEffectConfiguration(this._prePassEffectConfiguration), this._prePassEffectConfiguration.enabled = !0, !0) : !1;
  }
  /**
   * Disposes the post process.
   * @param camera The camera to dispose the post process on.
   */
  dispose(e) {
    e = e || this._camera, this._disposeTextures();
    let t;
    if (this._scene && (t = this._scene.postProcesses.indexOf(this), t !== -1 && this._scene.postProcesses.splice(t, 1)), this._parentContainer) {
      const r = this._parentContainer.postProcesses.indexOf(this);
      r > -1 && this._parentContainer.postProcesses.splice(r, 1), this._parentContainer = null;
    }
    if (t = this._engine.postProcesses.indexOf(this), t !== -1 && this._engine.postProcesses.splice(t, 1), !!e) {
      if (e.detachPostProcess(this), t = e._postProcesses.indexOf(this), t === 0 && e._postProcesses.length > 0) {
        const r = this._camera._getFirstPostProcess();
        r && r.markTextureDirty();
      }
      this.onActivateObservable.clear(), this.onAfterRenderObservable.clear(), this.onApplyObservable.clear(), this.onBeforeRenderObservable.clear(), this.onSizeChangedObservable.clear();
    }
  }
  /**
   * Serializes the post process to a JSON object
   * @returns the JSON object
   */
  serialize() {
    const e = D.Serialize(this), t = this.getCamera() || this._scene && this._scene.activeCamera;
    return e.customType = "BABYLON." + this.getClassName(), e.cameraId = t ? t.id : null, e.reusable = this._reusable, e.textureType = this._textureType, e.fragmentUrl = this._fragmentUrl, e.parameters = this._parameters, e.samplers = this._samplers, e.options = this._options, e.defines = this._postProcessDefines, e.textureFormat = this._textureFormat, e.vertexUrl = this._vertexUrl, e.indexParameters = this._indexParameters, e;
  }
  /**
   * Clones this post process
   * @returns a new post process similar to this one
   */
  clone() {
    const e = this.serialize();
    e._engine = this._engine, e.cameraId = null;
    const t = f.Parse(e, this._scene, "");
    return t ? (t.onActivateObservable = this.onActivateObservable.clone(), t.onSizeChangedObservable = this.onSizeChangedObservable.clone(), t.onApplyObservable = this.onApplyObservable.clone(), t.onBeforeRenderObservable = this.onBeforeRenderObservable.clone(), t.onAfterRenderObservable = this.onAfterRenderObservable.clone(), t._prePassEffectConfiguration = this._prePassEffectConfiguration, t) : null;
  }
  /**
   * Creates a material from parsed material data
   * @param parsedPostProcess defines parsed post process data
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures
   * @returns a new post process
   */
  static Parse(e, t, r) {
    const s = P(e.customType);
    if (!s || !s._Parse)
      return null;
    const i = t ? t.getCameraById(e.cameraId) : null;
    return s._Parse(e, i, t, r);
  }
  /**
   * @internal
   */
  static _Parse(e, t, r, s) {
    return D.Parse(() => new f(e.name, e.fragmentUrl, e.parameters, e.samplers, e.options, t, e.renderTargetSamplingMode, e._engine, e.reusable, e.defines, e.textureType, e.vertexUrl, e.indexParameters, !1, e.textureFormat), e, r, s);
  }
}
f._CustomShaderCodeProcessing = {};
x([
  T()
], f.prototype, "uniqueId", void 0);
x([
  T()
], f.prototype, "name", void 0);
x([
  T()
], f.prototype, "width", void 0);
x([
  T()
], f.prototype, "height", void 0);
x([
  T()
], f.prototype, "renderTargetSamplingMode", void 0);
x([
  U()
], f.prototype, "clearColor", void 0);
x([
  T()
], f.prototype, "autoClear", void 0);
x([
  T()
], f.prototype, "forceAutoClearInAlphaMode", void 0);
x([
  T()
], f.prototype, "alphaMode", void 0);
x([
  T()
], f.prototype, "alphaConstants", void 0);
x([
  T()
], f.prototype, "enablePixelPerfectMode", void 0);
x([
  T()
], f.prototype, "forceFullscreenViewport", void 0);
x([
  T()
], f.prototype, "scaleMode", void 0);
x([
  T()
], f.prototype, "alwaysForcePOT", void 0);
x([
  T("samples")
], f.prototype, "_samples", void 0);
x([
  T()
], f.prototype, "adaptScaleToCurrentViewport", void 0);
N("BABYLON.PostProcess", f);
const q = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PostProcess: f
}, Symbol.toStringTag, { value: "Module" }));
export {
  f as P,
  L as R,
  q as p
};
//# sourceMappingURL=postProcess-CHPSq8Bh.js.map
