import { Y as _, a0 as x, a1 as T, L as p } from "./embed-entry-BKE21f6Q.js";
import { T as d } from "./texture-BWPw_5Qg.js";
_.prototype.createDynamicTexture = function(n, t, e, i) {
  const s = new x(this, T.Dynamic);
  return s.baseWidth = n, s.baseHeight = t, e && (n = this.needPOTTextures ? _.GetExponentOfTwo(n, this._caps.maxTextureSize) : n, t = this.needPOTTextures ? _.GetExponentOfTwo(t, this._caps.maxTextureSize) : t), s.width = n, s.height = t, s.isReady = !1, s.generateMipMaps = e, s.samplingMode = i, this.updateTextureSamplingMode(i, s), this._internalTexturesCache.push(s), s;
};
_.prototype.updateDynamicTexture = function(n, t, e, i = !1, s, c = !1, u = !1) {
  if (!n)
    return;
  const h = this._gl, a = h.TEXTURE_2D, r = this._bindTextureDirectly(a, n, !0, c);
  this._unpackFlipY(e === void 0 ? n.invertY : e), i && h.pixelStorei(h.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
  const l = this._getWebGLTextureType(n.type), o = this._getInternalFormat(s || n.format), g = this._getRGBABufferInternalSizedFormat(n.type, o);
  h.texImage2D(a, 0, g, o, l, t), n.generateMipMaps && h.generateMipmap(a), r || this._bindTextureDirectly(a, null), i && h.pixelStorei(h.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0), s && (n.format = s), n._dynamicTextureSource = t, n._premulAlpha = i, n.invertY = e || !1, n.isReady = !0;
};
class f extends d {
  /**
   * Creates a DynamicTexture
   * @param name defines the name of the texture
   * @param options provides 3 alternatives for width and height of texture, a canvas, object with width and height properties, number for both width and height
   * @param scene defines the scene where you want the texture
   * @param generateMipMaps defines the use of MinMaps or not (default is false)
   * @param samplingMode defines the sampling mode to use (default is Texture.TRILINEAR_SAMPLINGMODE)
   * @param format defines the texture format to use (default is Engine.TEXTUREFORMAT_RGBA)
   * @param invertY defines if the texture needs to be inverted on the y axis during loading
   */
  constructor(t, e, i = null, s = !1, c = 3, u = 5, h) {
    super(null, i, !s, h, c, void 0, void 0, void 0, void 0, u), this.name = t, this.wrapU = d.CLAMP_ADDRESSMODE, this.wrapV = d.CLAMP_ADDRESSMODE, this._generateMipMaps = s;
    const a = this._getEngine();
    if (!a)
      return;
    e.getContext ? (this._canvas = e, this._ownCanvas = !1, this._texture = a.createDynamicTexture(e.width, e.height, s, c)) : (this._canvas = a.createCanvas(1, 1), this._ownCanvas = !0, e.width || e.width === 0 ? this._texture = a.createDynamicTexture(e.width, e.height, s, c) : this._texture = a.createDynamicTexture(e, e, s, c));
    const r = this.getSize();
    this._canvas.width !== r.width && (this._canvas.width = r.width), this._canvas.height !== r.height && (this._canvas.height = r.height), this._context = this._canvas.getContext("2d");
  }
  /**
   * Get the current class name of the texture useful for serialization or dynamic coding.
   * @returns "DynamicTexture"
   */
  getClassName() {
    return "DynamicTexture";
  }
  /**
   * Gets the current state of canRescale
   */
  get canRescale() {
    return !0;
  }
  _recreate(t) {
    this._canvas.width = t.width, this._canvas.height = t.height, this.releaseInternalTexture(), this._texture = this._getEngine().createDynamicTexture(t.width, t.height, this._generateMipMaps, this.samplingMode);
  }
  /**
   * Scales the texture
   * @param ratio the scale factor to apply to both width and height
   */
  scale(t) {
    const e = this.getSize();
    e.width *= t, e.height *= t, this._recreate(e);
  }
  /**
   * Resizes the texture
   * @param width the new width
   * @param height the new height
   */
  scaleTo(t, e) {
    const i = this.getSize();
    i.width = t, i.height = e, this._recreate(i);
  }
  /**
   * Gets the context of the canvas used by the texture
   * @returns the canvas context of the dynamic texture
   */
  getContext() {
    return this._context;
  }
  /**
   * Clears the texture
   * @param clearColor Defines the clear color to use
   */
  clear(t) {
    const e = this.getSize();
    t && (this._context.fillStyle = t), this._context.clearRect(0, 0, e.width, e.height);
  }
  /**
   * Updates the texture
   * @param invertY defines the direction for the Y axis (default is true - y increases downwards)
   * @param premulAlpha defines if alpha is stored as premultiplied (default is false)
   * @param allowGPUOptimization true to allow some specific GPU optimizations (subject to engine feature "allowGPUOptimizationsForGUI" being true)
   */
  update(t, e = !1, i = !1) {
    this._getEngine().updateDynamicTexture(this._texture, this._canvas, t === void 0 ? !0 : t, e, this._format || void 0, void 0, i);
  }
  /**
   * Draws text onto the texture
   * @param text defines the text to be drawn
   * @param x defines the placement of the text from the left
   * @param y defines the placement of the text from the top when invertY is true and from the bottom when false
   * @param font defines the font to be used with font-style, font-size, font-name
   * @param color defines the color used for the text
   * @param fillColor defines the color for the canvas, use null to not overwrite canvas (this bleands with the background to replace, use the clear function)
   * @param invertY defines the direction for the Y axis (default is true - y increases downwards)
   * @param update defines whether texture is immediately update (default is true)
   */
  drawText(t, e, i, s, c, u, h, a = !0) {
    const r = this.getSize();
    if (u && (this._context.fillStyle = u, this._context.fillRect(0, 0, r.width, r.height)), this._context.font = s, e == null) {
      const l = this._context.measureText(t);
      e = (r.width - l.width) / 2;
    }
    if (i == null) {
      const l = parseInt(s.replace(/\D/g, ""));
      i = r.height / 2 + l / 3.65;
    }
    this._context.fillStyle = c || "", this._context.fillText(t, e, i), a && this.update(h);
  }
  /**
   * Disposes the dynamic texture.
   */
  dispose() {
    super.dispose(), this._ownCanvas && this._canvas?.remove?.(), this._canvas = null, this._context = null;
  }
  /**
   * Clones the texture
   * @returns the clone of the texture.
   */
  clone() {
    const t = this.getScene();
    if (!t)
      return this;
    const e = this.getSize(), i = new f(this.name, e, t, this._generateMipMaps);
    return i.hasAlpha = this.hasAlpha, i.level = this.level, i.wrapU = this.wrapU, i.wrapV = this.wrapV, i;
  }
  /**
   * Serializes the dynamic texture.  The scene should be ready before the dynamic texture is serialized
   * @returns a serialized dynamic texture object
   */
  serialize() {
    const t = this.getScene();
    t && !t.isReady() && p.Warn("The scene must be ready before serializing the dynamic texture");
    const e = super.serialize();
    return f._IsCanvasElement(this._canvas) && (e.base64String = this._canvas.toDataURL()), e.invertY = this._invertY, e.samplingMode = this.samplingMode, e;
  }
  static _IsCanvasElement(t) {
    return t.toDataURL !== void 0;
  }
  /** @internal */
  _rebuild() {
    this.update();
  }
}
export {
  f as DynamicTexture
};
//# sourceMappingURL=dynamicTexture-BgA3jj0q.js.map
