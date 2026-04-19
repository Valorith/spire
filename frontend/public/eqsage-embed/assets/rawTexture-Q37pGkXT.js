import { T as U } from "./texture-BSW_lwWZ.js";
import { Y as c, a0 as B, a1 as P, L as C, a2 as I } from "./embed-entry-Dediijbe.js";
c.prototype.updateRawTexture = function(n, e, l, a, t = null, u = 0, _ = !1) {
  if (!n)
    return;
  const r = this._getRGBABufferInternalSizedFormat(u, l, _), i = this._getInternalFormat(l), s = this._getWebGLTextureType(u);
  this._bindTextureDirectly(this._gl.TEXTURE_2D, n, !0), this._unpackFlipY(a === void 0 ? !0 : !!a), this._doNotHandleContextLost || (n._bufferView = e, n.format = l, n.type = u, n.invertY = a, n._compression = t), n.width % 4 !== 0 && this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1), t && e ? this._gl.compressedTexImage2D(this._gl.TEXTURE_2D, 0, this.getCaps().s3tc[t], n.width, n.height, 0, e) : this._gl.texImage2D(this._gl.TEXTURE_2D, 0, r, n.width, n.height, 0, i, s, e), n.generateMipMaps && this._gl.generateMipmap(this._gl.TEXTURE_2D), this._bindTextureDirectly(this._gl.TEXTURE_2D, null), n.isReady = !0;
};
c.prototype.createRawTexture = function(n, e, l, a, t, u, _, r = null, i = 0, s = 0, o = !1) {
  const T = new B(this, P.Raw);
  T.baseWidth = e, T.baseHeight = l, T.width = e, T.height = l, T.format = a, T.generateMipMaps = t, T.samplingMode = _, T.invertY = u, T._compression = r, T.type = i, T._useSRGBBuffer = this._getUseSRGBBuffer(o, !t), this._doNotHandleContextLost || (T._bufferView = n), this.updateRawTexture(T, n, a, u, r, i, T._useSRGBBuffer), this._bindTextureDirectly(this._gl.TEXTURE_2D, T, !0);
  const f = this._getSamplingParameters(_, t);
  return this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, f.mag), this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, f.min), t && this._gl.generateMipmap(this._gl.TEXTURE_2D), this._bindTextureDirectly(this._gl.TEXTURE_2D, null), this._internalTexturesCache.push(T), T;
};
c.prototype.createRawCubeTexture = function(n, e, l, a, t, u, _, r = null) {
  const i = this._gl, s = new B(this, P.CubeRaw);
  s.isCube = !0, s.format = l, s.type = a, this._doNotHandleContextLost || (s._bufferViewArray = n);
  const o = this._getWebGLTextureType(a);
  let T = this._getInternalFormat(l);
  T === i.RGB && (T = i.RGBA), o === i.FLOAT && !this._caps.textureFloatLinearFiltering ? (t = !1, _ = 1, C.Warn("Float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.")) : o === this._gl.HALF_FLOAT_OES && !this._caps.textureHalfFloatLinearFiltering ? (t = !1, _ = 1, C.Warn("Half float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.")) : o === i.FLOAT && !this._caps.textureFloatRender ? (t = !1, C.Warn("Render to float textures is not supported. Mipmap generation forced to false.")) : o === i.HALF_FLOAT && !this._caps.colorBufferFloat && (t = !1, C.Warn("Render to half float textures is not supported. Mipmap generation forced to false."));
  const f = e, h = f;
  if (s.width = f, s.height = h, s.invertY = u, s._compression = r, !this.needPOTTextures || I(s.width) && I(s.height) || (t = !1), n)
    this.updateRawCubeTexture(s, n, l, a, u, r);
  else {
    const d = this._getRGBABufferInternalSizedFormat(a), p = 0;
    this._bindTextureDirectly(i.TEXTURE_CUBE_MAP, s, !0);
    for (let R = 0; R < 6; R++)
      r ? i.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + R, p, this.getCaps().s3tc[r], s.width, s.height, 0, void 0) : i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X + R, p, d, s.width, s.height, 0, T, o, null);
    this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
  }
  this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, s, !0), n && t && this._gl.generateMipmap(this._gl.TEXTURE_CUBE_MAP);
  const D = this._getSamplingParameters(_, t);
  return i.texParameteri(i.TEXTURE_CUBE_MAP, i.TEXTURE_MAG_FILTER, D.mag), i.texParameteri(i.TEXTURE_CUBE_MAP, i.TEXTURE_MIN_FILTER, D.min), i.texParameteri(i.TEXTURE_CUBE_MAP, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_CUBE_MAP, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), this._bindTextureDirectly(i.TEXTURE_CUBE_MAP, null), s.generateMipMaps = t, s.samplingMode = _, s.isReady = !0, s;
};
c.prototype.updateRawCubeTexture = function(n, e, l, a, t, u = null, _ = 0) {
  n._bufferViewArray = e, n.format = l, n.type = a, n.invertY = t, n._compression = u;
  const r = this._gl, i = this._getWebGLTextureType(a);
  let s = this._getInternalFormat(l);
  const o = this._getRGBABufferInternalSizedFormat(a);
  let T = !1;
  s === r.RGB && (s = r.RGBA, T = !0), this._bindTextureDirectly(r.TEXTURE_CUBE_MAP, n, !0), this._unpackFlipY(t === void 0 ? !0 : !!t), n.width % 4 !== 0 && r.pixelStorei(r.UNPACK_ALIGNMENT, 1);
  for (let h = 0; h < 6; h++) {
    let E = e[h];
    u ? r.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X + h, _, this.getCaps().s3tc[u], n.width, n.height, 0, E) : (T && (E = L(E, n.width, n.height, a)), r.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X + h, _, o, n.width, n.height, 0, s, i, E));
  }
  (!this.needPOTTextures || I(n.width) && I(n.height)) && n.generateMipMaps && _ === 0 && this._gl.generateMipmap(this._gl.TEXTURE_CUBE_MAP), this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null), n.isReady = !0;
};
c.prototype.createRawCubeTextureFromUrl = function(n, e, l, a, t, u, _, r, i = null, s = null, o = 3, T = !1) {
  const f = this._gl, h = this.createRawCubeTexture(null, l, a, t, !u, T, o, null);
  e?.addPendingData(h), h.url = n, h.isReady = !1, this._internalTexturesCache.push(h);
  const E = (d, p) => {
    e?.removePendingData(h), s && d && s(d.status + " " + d.statusText, p);
  }, D = (d) => {
    const p = h.width, R = _(d);
    if (R) {
      if (r) {
        const G = this._getWebGLTextureType(t);
        let w = this._getInternalFormat(a);
        const M = this._getRGBABufferInternalSizedFormat(t);
        let X = !1;
        w === f.RGB && (w = f.RGBA, X = !0), this._bindTextureDirectly(f.TEXTURE_CUBE_MAP, h, !0), this._unpackFlipY(!1);
        const b = r(R);
        for (let A = 0; A < b.length; A++) {
          const m = p >> A;
          for (let x = 0; x < 6; x++) {
            let F = b[A][x];
            X && (F = L(F, m, m, t)), f.texImage2D(x, A, M, m, m, 0, w, G, F);
          }
        }
        this._bindTextureDirectly(f.TEXTURE_CUBE_MAP, null);
      } else
        this.updateRawCubeTexture(h, R, a, t, T);
      h.isReady = !0, e?.removePendingData(h), h.onLoadedObservable.notifyObservers(h), h.onLoadedObservable.clear(), i && i();
    }
  };
  return this._loadFile(n, (d) => {
    D(d);
  }, void 0, e?.offlineProvider, !0, E), h;
};
function L(n, e, l, a) {
  let t, u = 1;
  a === 1 ? t = new Float32Array(e * l * 4) : a === 2 ? (t = new Uint16Array(e * l * 4), u = 15360) : a === 7 ? t = new Uint32Array(e * l * 4) : t = new Uint8Array(e * l * 4);
  for (let _ = 0; _ < e; _++)
    for (let r = 0; r < l; r++) {
      const i = (r * e + _) * 3, s = (r * e + _) * 4;
      t[s + 0] = n[i + 0], t[s + 1] = n[i + 1], t[s + 2] = n[i + 2], t[s + 3] = u;
    }
  return t;
}
function y(n) {
  return function(e, l, a, t, u, _, r, i, s = null, o = 0) {
    const T = n ? this._gl.TEXTURE_3D : this._gl.TEXTURE_2D_ARRAY, f = n ? P.Raw3D : P.Raw2DArray, h = new B(this, f);
    h.baseWidth = l, h.baseHeight = a, h.baseDepth = t, h.width = l, h.height = a, h.depth = t, h.format = u, h.type = o, h.generateMipMaps = _, h.samplingMode = i, n ? h.is3D = !0 : h.is2DArray = !0, this._doNotHandleContextLost || (h._bufferView = e), n ? this.updateRawTexture3D(h, e, u, r, s, o) : this.updateRawTexture2DArray(h, e, u, r, s, o), this._bindTextureDirectly(T, h, !0);
    const E = this._getSamplingParameters(i, _);
    return this._gl.texParameteri(T, this._gl.TEXTURE_MAG_FILTER, E.mag), this._gl.texParameteri(T, this._gl.TEXTURE_MIN_FILTER, E.min), _ && this._gl.generateMipmap(T), this._bindTextureDirectly(T, null), this._internalTexturesCache.push(h), h;
  };
}
c.prototype.createRawTexture2DArray = y(!1);
c.prototype.createRawTexture3D = y(!0);
function S(n) {
  return function(e, l, a, t, u = null, _ = 0) {
    const r = n ? this._gl.TEXTURE_3D : this._gl.TEXTURE_2D_ARRAY, i = this._getWebGLTextureType(_), s = this._getInternalFormat(a), o = this._getRGBABufferInternalSizedFormat(_, a);
    this._bindTextureDirectly(r, e, !0), this._unpackFlipY(t === void 0 ? !0 : !!t), this._doNotHandleContextLost || (e._bufferView = l, e.format = a, e.invertY = t, e._compression = u), e.width % 4 !== 0 && this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1), u && l ? this._gl.compressedTexImage3D(r, 0, this.getCaps().s3tc[u], e.width, e.height, e.depth, 0, l) : this._gl.texImage3D(r, 0, o, e.width, e.height, e.depth, 0, s, i, l), e.generateMipMaps && this._gl.generateMipmap(r), this._bindTextureDirectly(r, null), e.isReady = !0;
  };
}
c.prototype.updateRawTexture2DArray = S(!1);
c.prototype.updateRawTexture3D = S(!0);
class g extends U {
  /**
   * Instantiates a new RawTexture.
   * Raw texture can help creating a texture directly from an array of data.
   * This can be super useful if you either get the data from an uncompressed source or
   * if you wish to create your texture pixel by pixel.
   * @param data define the array of data to use to create the texture (null to create an empty texture)
   * @param width define the width of the texture
   * @param height define the height of the texture
   * @param format define the format of the data (RGB, RGBA... Engine.TEXTUREFORMAT_xxx)
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param generateMipMaps define whether mip maps should be generated or not
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
   * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
   * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
   */
  constructor(e, l, a, t, u, _ = !0, r = !1, i = 3, s = 0, o, T) {
    super(null, u, !_, r, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, o), this.format = t, this._engine && (!this._engine._caps.textureFloatLinearFiltering && s === 1 && (i = 1), !this._engine._caps.textureHalfFloatLinearFiltering && s === 2 && (i = 1), this._texture = this._engine.createRawTexture(e, l, a, t, _, r, i, null, s, o ?? 0, T ?? !1), this.wrapU = U.CLAMP_ADDRESSMODE, this.wrapV = U.CLAMP_ADDRESSMODE);
  }
  /**
   * Updates the texture underlying data.
   * @param data Define the new data of the texture
   */
  update(e) {
    this._getEngine().updateRawTexture(this._texture, e, this._texture.format, this._texture.invertY, null, this._texture.type, this._texture._useSRGBBuffer);
  }
  /**
   * Creates a luminance texture from some data.
   * @param data Define the texture data
   * @param width Define the width of the texture
   * @param height Define the height of the texture
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param generateMipMaps Define whether or not to create mip maps for the texture
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @returns the luminance texture
   */
  static CreateLuminanceTexture(e, l, a, t, u = !0, _ = !1, r = 3) {
    return new g(e, l, a, 1, t, u, _, r);
  }
  /**
   * Creates a luminance alpha texture from some data.
   * @param data Define the texture data
   * @param width Define the width of the texture
   * @param height Define the height of the texture
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param generateMipMaps Define whether or not to create mip maps for the texture
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @returns the luminance alpha texture
   */
  static CreateLuminanceAlphaTexture(e, l, a, t, u = !0, _ = !1, r = 3) {
    return new g(e, l, a, 2, t, u, _, r);
  }
  /**
   * Creates an alpha texture from some data.
   * @param data Define the texture data
   * @param width Define the width of the texture
   * @param height Define the height of the texture
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param generateMipMaps Define whether or not to create mip maps for the texture
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @returns the alpha texture
   */
  static CreateAlphaTexture(e, l, a, t, u = !0, _ = !1, r = 3) {
    return new g(e, l, a, 0, t, u, _, r);
  }
  /**
   * Creates a RGB texture from some data.
   * @param data Define the texture data
   * @param width Define the width of the texture
   * @param height Define the height of the texture
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param generateMipMaps Define whether or not to create mip maps for the texture
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
   * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
   * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
   * @returns the RGB alpha texture
   */
  static CreateRGBTexture(e, l, a, t, u = !0, _ = !1, r = 3, i = 0, s = 0, o = !1) {
    return new g(e, l, a, 4, t, u, _, r, i, s, o);
  }
  /**
   * Creates a RGBA texture from some data.
   * @param data Define the texture data
   * @param width Define the width of the texture
   * @param height Define the height of the texture
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param generateMipMaps Define whether or not to create mip maps for the texture
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
   * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
   * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
   * @returns the RGBA texture
   */
  static CreateRGBATexture(e, l, a, t, u = !0, _ = !1, r = 3, i = 0, s = 0, o = !1) {
    return new g(e, l, a, 5, t, u, _, r, i, s, o);
  }
  /**
   * Creates a RGBA storage texture from some data.
   * @param data Define the texture data
   * @param width Define the width of the texture
   * @param height Define the height of the texture
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param generateMipMaps Define whether or not to create mip maps for the texture
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
   * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
   * @returns the RGBA texture
   */
  static CreateRGBAStorageTexture(e, l, a, t, u = !0, _ = !1, r = 3, i = 0, s = !1) {
    return new g(e, l, a, 5, t, u, _, r, i, 1, s);
  }
  /**
   * Creates a R texture from some data.
   * @param data Define the texture data
   * @param width Define the width of the texture
   * @param height Define the height of the texture
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param generateMipMaps Define whether or not to create mip maps for the texture
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
   * @returns the R texture
   */
  static CreateRTexture(e, l, a, t, u = !0, _ = !1, r = U.TRILINEAR_SAMPLINGMODE, i = 1) {
    return new g(e, l, a, 6, t, u, _, r, i);
  }
  /**
   * Creates a R storage texture from some data.
   * @param data Define the texture data
   * @param width Define the width of the texture
   * @param height Define the height of the texture
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param generateMipMaps Define whether or not to create mip maps for the texture
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
   * @returns the R texture
   */
  static CreateRStorageTexture(e, l, a, t, u = !0, _ = !1, r = U.TRILINEAR_SAMPLINGMODE, i = 1) {
    return new g(e, l, a, 6, t, u, _, r, i, 1);
  }
}
export {
  g as R
};
//# sourceMappingURL=rawTexture-Q37pGkXT.js.map
