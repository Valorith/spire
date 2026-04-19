import { m as W, O as B, d as Y, M as x, b as h, c as o, ab as k, _ as L, z as G, ac as V, a as O, i as p, ad as j, ae as q, G as H, R as Z } from "./embed-entry-Bb6cfUYP.js";
import { S as z } from "./math.size-CalSUfXs.js";
import { S as T } from "./decorators.serialization-D-l6hUAn.js";
import { P as X } from "./math.plane--GFy_WPN.js";
class U {
  /**
   * | Value | Type               | Description |
   * | ----- | ------------------ | ----------- |
   * | 0     | CLAMP_ADDRESSMODE  |             |
   * | 1     | WRAP_ADDRESSMODE   |             |
   * | 2     | MIRROR_ADDRESSMODE |             |
   */
  get wrapU() {
    return this._wrapU;
  }
  set wrapU(e) {
    this._wrapU = e;
  }
  /**
   * | Value | Type               | Description |
   * | ----- | ------------------ | ----------- |
   * | 0     | CLAMP_ADDRESSMODE  |             |
   * | 1     | WRAP_ADDRESSMODE   |             |
   * | 2     | MIRROR_ADDRESSMODE |             |
   */
  get wrapV() {
    return this._wrapV;
  }
  set wrapV(e) {
    this._wrapV = e;
  }
  /**
   * How a texture is mapped.
   * Unused in thin texture mode.
   */
  get coordinatesMode() {
    return 0;
  }
  /**
   * Define if the texture is a cube texture or if false a 2d texture.
   */
  get isCube() {
    return this._texture ? this._texture.isCube : !1;
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set isCube(e) {
    this._texture && (this._texture.isCube = e);
  }
  /**
   * Define if the texture is a 3d texture (webgl 2) or if false a 2d texture.
   */
  get is3D() {
    return this._texture ? this._texture.is3D : !1;
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set is3D(e) {
    this._texture && (this._texture.is3D = e);
  }
  /**
   * Define if the texture is a 2d array texture (webgl 2) or if false a 2d texture.
   */
  get is2DArray() {
    return this._texture ? this._texture.is2DArray : !1;
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set is2DArray(e) {
    this._texture && (this._texture.is2DArray = e);
  }
  /**
   * Get the class name of the texture.
   * @returns "ThinTexture"
   */
  getClassName() {
    return "ThinTexture";
  }
  static _IsRenderTargetWrapper(e) {
    return e?.shareDepth !== void 0;
  }
  /**
   * Instantiates a new ThinTexture.
   * Base class of all the textures in babylon.
   * This can be used as an internal texture wrapper in ThinEngine to benefit from the cache
   * @param internalTexture Define the internalTexture to wrap. You can also pass a RenderTargetWrapper, in which case the texture will be the render target's texture
   */
  constructor(e) {
    this._wrapU = 1, this._wrapV = 1, this.wrapR = 1, this.anisotropicFilteringLevel = 4, this.delayLoadState = 0, this._texture = null, this._engine = null, this._cachedSize = z.Zero(), this._cachedBaseSize = z.Zero(), this._initialSamplingMode = 2, this._texture = U._IsRenderTargetWrapper(e) ? e.texture : e, this._texture && (this._engine = this._texture.getEngine());
  }
  /**
   * Get if the texture is ready to be used (downloaded, converted, mip mapped...).
   * @returns true if fully ready
   */
  isReady() {
    return this.delayLoadState === 4 ? (this.delayLoad(), !1) : this._texture ? this._texture.isReady : !1;
  }
  /**
   * Triggers the load sequence in delayed load mode.
   */
  delayLoad() {
  }
  /**
   * Get the underlying lower level texture from Babylon.
   * @returns the internal texture
   */
  getInternalTexture() {
    return this._texture;
  }
  /**
   * Get the size of the texture.
   * @returns the texture size.
   */
  getSize() {
    if (this._texture) {
      if (this._texture.width)
        return this._cachedSize.width = this._texture.width, this._cachedSize.height = this._texture.height, this._cachedSize;
      if (this._texture._size)
        return this._cachedSize.width = this._texture._size, this._cachedSize.height = this._texture._size, this._cachedSize;
    }
    return this._cachedSize;
  }
  /**
   * Get the base size of the texture.
   * It can be different from the size if the texture has been resized for POT for instance
   * @returns the base size
   */
  getBaseSize() {
    return !this.isReady() || !this._texture ? (this._cachedBaseSize.width = 0, this._cachedBaseSize.height = 0, this._cachedBaseSize) : this._texture._size ? (this._cachedBaseSize.width = this._texture._size, this._cachedBaseSize.height = this._texture._size, this._cachedBaseSize) : (this._cachedBaseSize.width = this._texture.baseWidth, this._cachedBaseSize.height = this._texture.baseHeight, this._cachedBaseSize);
  }
  /**
   * Get the current sampling mode associated with the texture.
   */
  get samplingMode() {
    return this._texture ? this._texture.samplingMode : this._initialSamplingMode;
  }
  /**
   * Update the sampling mode of the texture.
   * Default is Trilinear mode.
   *
   * | Value | Type               | Description |
   * | ----- | ------------------ | ----------- |
   * | 1     | NEAREST_SAMPLINGMODE or NEAREST_NEAREST_MIPLINEAR  | Nearest is: mag = nearest, min = nearest, mip = linear |
   * | 2     | BILINEAR_SAMPLINGMODE or LINEAR_LINEAR_MIPNEAREST | Bilinear is: mag = linear, min = linear, mip = nearest |
   * | 3     | TRILINEAR_SAMPLINGMODE or LINEAR_LINEAR_MIPLINEAR | Trilinear is: mag = linear, min = linear, mip = linear |
   * | 4     | NEAREST_NEAREST_MIPNEAREST |             |
   * | 5    | NEAREST_LINEAR_MIPNEAREST |             |
   * | 6    | NEAREST_LINEAR_MIPLINEAR |             |
   * | 7    | NEAREST_LINEAR |             |
   * | 8    | NEAREST_NEAREST |             |
   * | 9   | LINEAR_NEAREST_MIPNEAREST |             |
   * | 10   | LINEAR_NEAREST_MIPLINEAR |             |
   * | 11   | LINEAR_LINEAR |             |
   * | 12   | LINEAR_NEAREST |             |
   *
   *    > _mag_: magnification filter (close to the viewer)
   *    > _min_: minification filter (far from the viewer)
   *    > _mip_: filter used between mip map levels
   *@param samplingMode Define the new sampling mode of the texture
   */
  updateSamplingMode(e) {
    this._texture && this._engine && this._engine.updateTextureSamplingMode(e, this._texture);
  }
  /**
   * Release and destroy the underlying lower level texture aka internalTexture.
   */
  releaseInternalTexture() {
    this._texture && (this._texture.dispose(), this._texture = null);
  }
  /**
   * Dispose the texture and release its associated resources.
   */
  dispose() {
    this._texture && (this.releaseInternalTexture(), this._engine = null);
  }
}
class d extends U {
  /**
   * Define if the texture is having a usable alpha value (can be use for transparency or glossiness for instance).
   */
  set hasAlpha(e) {
    this._hasAlpha !== e && (this._hasAlpha = e, this._scene && this._scene.markAllMaterialsAsDirty(1, (t) => t.hasTexture(this)));
  }
  get hasAlpha() {
    return this._hasAlpha;
  }
  /**
   * Defines if the alpha value should be determined via the rgb values.
   * If true the luminance of the pixel might be used to find the corresponding alpha value.
   */
  set getAlphaFromRGB(e) {
    this._getAlphaFromRGB !== e && (this._getAlphaFromRGB = e, this._scene && this._scene.markAllMaterialsAsDirty(1, (t) => t.hasTexture(this)));
  }
  get getAlphaFromRGB() {
    return this._getAlphaFromRGB;
  }
  /**
   * Define the UV channel to use starting from 0 and defaulting to 0.
   * This is part of the texture as textures usually maps to one uv set.
   */
  set coordinatesIndex(e) {
    this._coordinatesIndex !== e && (this._coordinatesIndex = e, this._scene && this._scene.markAllMaterialsAsDirty(1, (t) => t.hasTexture(this)));
  }
  get coordinatesIndex() {
    return this._coordinatesIndex;
  }
  /**
   * How a texture is mapped.
   *
   * | Value | Type                                | Description |
   * | ----- | ----------------------------------- | ----------- |
   * | 0     | EXPLICIT_MODE                       |             |
   * | 1     | SPHERICAL_MODE                      |             |
   * | 2     | PLANAR_MODE                         |             |
   * | 3     | CUBIC_MODE                          |             |
   * | 4     | PROJECTION_MODE                     |             |
   * | 5     | SKYBOX_MODE                         |             |
   * | 6     | INVCUBIC_MODE                       |             |
   * | 7     | EQUIRECTANGULAR_MODE                |             |
   * | 8     | FIXED_EQUIRECTANGULAR_MODE          |             |
   * | 9     | FIXED_EQUIRECTANGULAR_MIRRORED_MODE |             |
   */
  set coordinatesMode(e) {
    this._coordinatesMode !== e && (this._coordinatesMode = e, this._scene && this._scene.markAllMaterialsAsDirty(1, (t) => t.hasTexture(this)));
  }
  get coordinatesMode() {
    return this._coordinatesMode;
  }
  /**
   * | Value | Type               | Description |
   * | ----- | ------------------ | ----------- |
   * | 0     | CLAMP_ADDRESSMODE  |             |
   * | 1     | WRAP_ADDRESSMODE   |             |
   * | 2     | MIRROR_ADDRESSMODE |             |
   */
  get wrapU() {
    return this._wrapU;
  }
  set wrapU(e) {
    this._wrapU = e;
  }
  /**
   * | Value | Type               | Description |
   * | ----- | ------------------ | ----------- |
   * | 0     | CLAMP_ADDRESSMODE  |             |
   * | 1     | WRAP_ADDRESSMODE   |             |
   * | 2     | MIRROR_ADDRESSMODE |             |
   */
  get wrapV() {
    return this._wrapV;
  }
  set wrapV(e) {
    this._wrapV = e;
  }
  /**
   * Define if the texture is a cube texture or if false a 2d texture.
   */
  get isCube() {
    return this._texture ? this._texture.isCube : this._isCube;
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set isCube(e) {
    this._texture ? this._texture.isCube = e : this._isCube = e;
  }
  /**
   * Define if the texture is a 3d texture (webgl 2) or if false a 2d texture.
   */
  get is3D() {
    return this._texture ? this._texture.is3D : !1;
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set is3D(e) {
    this._texture && (this._texture.is3D = e);
  }
  /**
   * Define if the texture is a 2d array texture (webgl 2) or if false a 2d texture.
   */
  get is2DArray() {
    return this._texture ? this._texture.is2DArray : !1;
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  set is2DArray(e) {
    this._texture && (this._texture.is2DArray = e);
  }
  /**
   * Define if the texture contains data in gamma space (most of the png/jpg aside bump).
   * HDR texture are usually stored in linear space.
   * This only impacts the PBR and Background materials
   */
  get gammaSpace() {
    if (this._texture)
      this._texture._gammaSpace === null && (this._texture._gammaSpace = this._gammaSpace);
    else
      return this._gammaSpace;
    return this._texture._gammaSpace && !this._texture._useSRGBBuffer;
  }
  set gammaSpace(e) {
    if (this._texture) {
      if (this._texture._gammaSpace === e)
        return;
      this._texture._gammaSpace = e;
    } else {
      if (this._gammaSpace === e)
        return;
      this._gammaSpace = e;
    }
    this.getScene()?.markAllMaterialsAsDirty(1, (t) => t.hasTexture(this));
  }
  /**
   * Gets or sets whether or not the texture contains RGBD data.
   */
  get isRGBD() {
    return this._texture != null && this._texture._isRGBD;
  }
  set isRGBD(e) {
    e !== this.isRGBD && (this._texture && (this._texture._isRGBD = e), this.getScene()?.markAllMaterialsAsDirty(1, (t) => t.hasTexture(this)));
  }
  /**
   * Are mip maps generated for this texture or not.
   */
  get noMipmap() {
    return !1;
  }
  /**
   * With prefiltered texture, defined the offset used during the prefiltering steps.
   */
  get lodGenerationOffset() {
    return this._texture ? this._texture._lodGenerationOffset : 0;
  }
  set lodGenerationOffset(e) {
    this._texture && (this._texture._lodGenerationOffset = e);
  }
  /**
   * With prefiltered texture, defined the scale used during the prefiltering steps.
   */
  get lodGenerationScale() {
    return this._texture ? this._texture._lodGenerationScale : 0;
  }
  set lodGenerationScale(e) {
    this._texture && (this._texture._lodGenerationScale = e);
  }
  /**
   * With prefiltered texture, defined if the specular generation is based on a linear ramp.
   * By default we are using a log2 of the linear roughness helping to keep a better resolution for
   * average roughness values.
   */
  get linearSpecularLOD() {
    return this._texture ? this._texture._linearSpecularLOD : !1;
  }
  set linearSpecularLOD(e) {
    this._texture && (this._texture._linearSpecularLOD = e);
  }
  /**
   * In case a better definition than spherical harmonics is required for the diffuse part of the environment.
   * You can set the irradiance texture to rely on a texture instead of the spherical approach.
   * This texture need to have the same characteristics than its parent (Cube vs 2d, coordinates mode, Gamma/Linear, RGBD).
   */
  get irradianceTexture() {
    return this._texture ? this._texture._irradianceTexture : null;
  }
  set irradianceTexture(e) {
    this._texture && (this._texture._irradianceTexture = e);
  }
  /**
   * Define the unique id of the texture in the scene.
   */
  get uid() {
    return this._uid || (this._uid = W()), this._uid;
  }
  /**
   * Return a string representation of the texture.
   * @returns the texture as a string
   */
  toString() {
    return this.name;
  }
  /**
   * Get the class name of the texture.
   * @returns "BaseTexture"
   */
  getClassName() {
    return "BaseTexture";
  }
  /**
   * Callback triggered when the texture has been disposed.
   * Kept for back compatibility, you can use the onDisposeObservable instead.
   */
  set onDispose(e) {
    this._onDisposeObserver && this.onDisposeObservable.remove(this._onDisposeObserver), this._onDisposeObserver = this.onDisposeObservable.add(e);
  }
  /**
   * Define if the texture is preventing a material to render or not.
   * If not and the texture is not ready, the engine will use a default black texture instead.
   */
  get isBlocking() {
    return !0;
  }
  /**
   * Was there any loading error?
   */
  get loadingError() {
    return this._loadingError;
  }
  /**
   * If a loading error occurred this object will be populated with information about the error.
   */
  get errorObject() {
    return this._errorObject;
  }
  /**
   * Instantiates a new BaseTexture.
   * Base class of all the textures in babylon.
   * It groups all the common properties the materials, post process, lights... might need
   * in order to make a correct use of the texture.
   * @param sceneOrEngine Define the scene or engine the texture belongs to
   * @param internalTexture Define the internal texture associated with the texture
   */
  constructor(e, t = null) {
    super(null), this.metadata = null, this.reservedDataStore = null, this._hasAlpha = !1, this._getAlphaFromRGB = !1, this.level = 1, this._coordinatesIndex = 0, this.optimizeUVAllocation = !0, this._coordinatesMode = 0, this.wrapR = 1, this.anisotropicFilteringLevel = d.DEFAULT_ANISOTROPIC_FILTERING_LEVEL, this._isCube = !1, this._gammaSpace = !0, this.invertZ = !1, this.lodLevelInAlpha = !1, this.isRenderTarget = !1, this._prefiltered = !1, this._forceSerialize = !1, this.animations = [], this.onDisposeObservable = new B(), this._onDisposeObserver = null, this._scene = null, this._uid = null, this._parentContainer = null, this._loadingError = !1, e ? d._IsScene(e) ? this._scene = e : this._engine = e : this._scene = Y.LastCreatedScene, this._scene && (this.uniqueId = this._scene.getUniqueId(), this._scene.addTexture(this), this._engine = this._scene.getEngine()), this._texture = t, this._uid = null;
  }
  /**
   * Get the scene the texture belongs to.
   * @returns the scene or null if undefined
   */
  getScene() {
    return this._scene;
  }
  /** @internal */
  _getEngine() {
    return this._engine;
  }
  /**
   * Get the texture transform matrix used to offset tile the texture for instance.
   * @returns the transformation matrix
   */
  getTextureMatrix() {
    return x.IdentityReadOnly;
  }
  /**
   * Get the texture reflection matrix used to rotate/transform the reflection.
   * @returns the reflection matrix
   */
  getReflectionTextureMatrix() {
    return x.IdentityReadOnly;
  }
  /**
   * Gets a suitable rotate/transform matrix when the texture is used for refraction.
   * There's a separate function from getReflectionTextureMatrix because refraction requires a special configuration of the matrix in right-handed mode.
   * @returns The refraction matrix
   */
  getRefractionTextureMatrix() {
    return this.getReflectionTextureMatrix();
  }
  /**
   * Get if the texture is ready to be consumed (either it is ready or it is not blocking)
   * @returns true if ready, not blocking or if there was an error loading the texture
   */
  isReadyOrNotBlocking() {
    return !this.isBlocking || this.isReady() || this.loadingError;
  }
  /**
   * Scales the texture if is `canRescale()`
   * @param ratio the resize factor we want to use to rescale
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scale(e) {
  }
  /**
   * Get if the texture can rescale.
   */
  get canRescale() {
    return !1;
  }
  /**
   * @internal
   */
  _getFromCache(e, t, r, a, u, _) {
    const f = this._getEngine();
    if (!f)
      return null;
    const n = f._getUseSRGBBuffer(!!u, t), s = f.getLoadedTexturesCache();
    for (let l = 0; l < s.length; l++) {
      const c = s[l];
      if ((u === void 0 || n === c._useSRGBBuffer) && (a === void 0 || a === c.invertY) && c.url === e && c.generateMipMaps === !t && (!r || r === c.samplingMode) && (_ === void 0 || _ === c.isCube))
        return c.incrementReferences(), c;
    }
    return null;
  }
  /** @internal */
  _rebuild(e = !1) {
  }
  /**
   * Clones the texture.
   * @returns the cloned texture
   */
  clone() {
    return null;
  }
  /**
   * Get the texture underlying type (INT, FLOAT...)
   */
  get textureType() {
    return this._texture && this._texture.type !== void 0 ? this._texture.type : 0;
  }
  /**
   * Get the texture underlying format (RGB, RGBA...)
   */
  get textureFormat() {
    return this._texture && this._texture.format !== void 0 ? this._texture.format : 5;
  }
  /**
   * Indicates that textures need to be re-calculated for all materials
   */
  _markAllSubMeshesAsTexturesDirty() {
    const e = this.getScene();
    e && e.markAllMaterialsAsDirty(1);
  }
  /**
   * Reads the pixels stored in the webgl texture and returns them as an ArrayBuffer.
   * This will returns an RGBA array buffer containing either in values (0-255) or
   * float values (0-1) depending of the underlying buffer type.
   * @param faceIndex defines the face of the texture to read (in case of cube texture)
   * @param level defines the LOD level of the texture to read (in case of Mip Maps)
   * @param buffer defines a user defined buffer to fill with data (can be null)
   * @param flushRenderer true to flush the renderer from the pending commands before reading the pixels
   * @param noDataConversion false to convert the data to Uint8Array (if texture type is UNSIGNED_BYTE) or to Float32Array (if texture type is anything but UNSIGNED_BYTE). If true, the type of the generated buffer (if buffer==null) will depend on the type of the texture
   * @param x defines the region x coordinates to start reading from (default to 0)
   * @param y defines the region y coordinates to start reading from (default to 0)
   * @param width defines the region width to read from (default to the texture size at level)
   * @param height defines the region width to read from (default to the texture size at level)
   * @returns The Array buffer promise containing the pixels data.
   */
  readPixels(e = 0, t = 0, r = null, a = !0, u = !1, _ = 0, f = 0, n = Number.MAX_VALUE, s = Number.MAX_VALUE) {
    if (!this._texture)
      return null;
    const l = this._getEngine();
    if (!l)
      return null;
    const c = this.getSize();
    let R = c.width, m = c.height;
    t !== 0 && (R = R / Math.pow(2, t), m = m / Math.pow(2, t), R = Math.round(R), m = Math.round(m)), n = Math.min(R, n), s = Math.min(m, s);
    try {
      return this._texture.isCube ? l._readTexturePixels(this._texture, n, s, e, t, r, a, u, _, f) : l._readTexturePixels(this._texture, n, s, -1, t, r, a, u, _, f);
    } catch {
      return null;
    }
  }
  /**
   * @internal
   */
  _readPixelsSync(e = 0, t = 0, r = null, a = !0, u = !1) {
    if (!this._texture)
      return null;
    const _ = this.getSize();
    let f = _.width, n = _.height;
    const s = this._getEngine();
    if (!s)
      return null;
    t != 0 && (f = f / Math.pow(2, t), n = n / Math.pow(2, t), f = Math.round(f), n = Math.round(n));
    try {
      return this._texture.isCube ? s._readTexturePixelsSync(this._texture, f, n, e, t, r, a, u) : s._readTexturePixelsSync(this._texture, f, n, -1, t, r, a, u);
    } catch {
      return null;
    }
  }
  /** @internal */
  get _lodTextureHigh() {
    return this._texture ? this._texture._lodTextureHigh : null;
  }
  /** @internal */
  get _lodTextureMid() {
    return this._texture ? this._texture._lodTextureMid : null;
  }
  /** @internal */
  get _lodTextureLow() {
    return this._texture ? this._texture._lodTextureLow : null;
  }
  /**
   * Dispose the texture and release its associated resources.
   */
  dispose() {
    if (this._scene) {
      this._scene.stopAnimation && this._scene.stopAnimation(this), this._scene.removePendingData(this);
      const e = this._scene.textures.indexOf(this);
      if (e >= 0 && this._scene.textures.splice(e, 1), this._scene.onTextureRemovedObservable.notifyObservers(this), this._scene = null, this._parentContainer) {
        const t = this._parentContainer.textures.indexOf(this);
        t > -1 && this._parentContainer.textures.splice(t, 1), this._parentContainer = null;
      }
    }
    this.onDisposeObservable.notifyObservers(this), this.onDisposeObservable.clear(), this.metadata = null, super.dispose();
  }
  /**
   * Serialize the texture into a JSON representation that can be parsed later on.
   * @param allowEmptyName True to force serialization even if name is empty. Default: false
   * @returns the JSON representation of the texture
   */
  serialize(e = !1) {
    if (!this.name && !e)
      return null;
    const t = T.Serialize(this);
    return T.AppendSerializedAnimations(this, t), t;
  }
  /**
   * Helper function to be called back once a list of texture contains only ready textures.
   * @param textures Define the list of textures to wait for
   * @param callback Define the callback triggered once the entire list will be ready
   */
  static WhenAllReady(e, t) {
    let r = e.length;
    if (r === 0) {
      t();
      return;
    }
    for (let a = 0; a < e.length; a++) {
      const u = e[a];
      if (u.isReady())
        --r === 0 && t();
      else {
        const _ = u.onLoadObservable;
        _ ? _.addOnce(() => {
          --r === 0 && t();
        }) : --r === 0 && t();
      }
    }
  }
  static _IsScene(e) {
    return e.getClassName() === "Scene";
  }
}
d.DEFAULT_ANISOTROPIC_FILTERING_LEVEL = 4;
h([
  o()
], d.prototype, "uniqueId", void 0);
h([
  o()
], d.prototype, "name", void 0);
h([
  o()
], d.prototype, "metadata", void 0);
h([
  o("hasAlpha")
], d.prototype, "_hasAlpha", void 0);
h([
  o("getAlphaFromRGB")
], d.prototype, "_getAlphaFromRGB", void 0);
h([
  o()
], d.prototype, "level", void 0);
h([
  o("coordinatesIndex")
], d.prototype, "_coordinatesIndex", void 0);
h([
  o()
], d.prototype, "optimizeUVAllocation", void 0);
h([
  o("coordinatesMode")
], d.prototype, "_coordinatesMode", void 0);
h([
  o()
], d.prototype, "wrapU", null);
h([
  o()
], d.prototype, "wrapV", null);
h([
  o()
], d.prototype, "wrapR", void 0);
h([
  o()
], d.prototype, "anisotropicFilteringLevel", void 0);
h([
  o()
], d.prototype, "isCube", null);
h([
  o()
], d.prototype, "is3D", null);
h([
  o()
], d.prototype, "is2DArray", null);
h([
  o()
], d.prototype, "gammaSpace", null);
h([
  o()
], d.prototype, "invertZ", void 0);
h([
  o()
], d.prototype, "lodLevelInAlpha", void 0);
h([
  o()
], d.prototype, "lodGenerationOffset", null);
h([
  o()
], d.prototype, "lodGenerationScale", null);
h([
  o()
], d.prototype, "linearSpecularLOD", null);
h([
  k()
], d.prototype, "irradianceTexture", null);
h([
  o()
], d.prototype, "isRenderTarget", void 0);
function w(g, e, t = !1) {
  const r = e.width, a = e.height;
  if (g instanceof Float32Array) {
    let s = g.byteLength / g.BYTES_PER_ELEMENT;
    const l = new Uint8Array(s);
    for (; --s >= 0; ) {
      let c = g[s];
      c < 0 ? c = 0 : c > 1 && (c = 1), l[s] = c * 255;
    }
    g = l;
  }
  const u = document.createElement("canvas");
  u.width = r, u.height = a;
  const _ = u.getContext("2d");
  if (!_)
    return null;
  const f = _.createImageData(r, a);
  if (f.data.set(g), _.putImageData(f, 0, 0), t) {
    const s = document.createElement("canvas");
    s.width = r, s.height = a;
    const l = s.getContext("2d");
    return l ? (l.translate(0, a), l.scale(1, -1), l.drawImage(u, 0, 0), s.toDataURL("image/png")) : null;
  }
  return u.toDataURL("image/png");
}
function P(g, e = 0, t = 0) {
  const r = g.getInternalTexture();
  if (!r)
    return null;
  const a = g._readPixelsSync(e, t);
  return a ? w(a, g.getSize(), r.invertY) : null;
}
async function F(g, e = 0, t = 0) {
  const r = g.getInternalTexture();
  if (!r)
    return null;
  const a = await g.readPixels(e, t);
  return a ? w(a, g.getSize(), r.invertY) : null;
}
const ee = {
  /**
   * Transform some pixel data to a base64 string
   * @param pixels defines the pixel data to transform to base64
   * @param size defines the width and height of the (texture) data
   * @param invertY true if the data must be inverted for the Y coordinate during the conversion
   * @returns The base64 encoded string or null
   */
  GenerateBase64StringFromPixelData: w,
  /**
   * Reads the pixels stored in the webgl texture and returns them as a base64 string
   * @param texture defines the texture to read pixels from
   * @param faceIndex defines the face of the texture to read (in case of cube texture)
   * @param level defines the LOD level of the texture to read (in case of Mip Maps)
   * @returns The base64 encoded string or null
   */
  GenerateBase64StringFromTexture: P,
  /**
   * Reads the pixels stored in the webgl texture and returns them as a base64 string
   * @param texture defines the texture to read pixels from
   * @param faceIndex defines the face of the texture to read (in case of cube texture)
   * @param level defines the LOD level of the texture to read (in case of Mip Maps)
   * @returns The base64 encoded string or null wrapped in a promise
   */
  GenerateBase64StringFromTextureAsync: F
};
class i extends d {
  /**
   * @internal
   */
  static _CreateVideoTexture(e, t, r, a = !1, u = !1, _ = i.TRILINEAR_SAMPLINGMODE, f = {}, n, s = 5) {
    throw L("VideoTexture");
  }
  /**
   * Are mip maps generated for this texture or not.
   */
  get noMipmap() {
    return this._noMipmap;
  }
  /** Returns the texture mime type if it was defined by a loader (undefined else) */
  get mimeType() {
    return this._mimeType;
  }
  /**
   * Is the texture preventing material to render while loading.
   * If false, a default texture will be used instead of the loading one during the preparation step.
   */
  set isBlocking(e) {
    this._isBlocking = e;
  }
  get isBlocking() {
    return this._isBlocking;
  }
  /**
   * Gets a boolean indicating if the texture needs to be inverted on the y axis during loading
   */
  get invertY() {
    return this._invertY;
  }
  /**
   * Instantiates a new texture.
   * This represents a texture in babylon. It can be easily loaded from a network, base64 or html input.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction#texture
   * @param url defines the url of the picture to load as a texture
   * @param sceneOrEngine defines the scene or engine the texture will belong to
   * @param noMipmapOrOptions defines if the texture will require mip maps or not or set of all options to create the texture
   * @param invertY defines if the texture needs to be inverted on the y axis during loading
   * @param samplingMode defines the sampling mode we want for the texture while fetching from it (Texture.NEAREST_SAMPLINGMODE...)
   * @param onLoad defines a callback triggered when the texture has been loaded
   * @param onError defines a callback triggered when an error occurred during the loading session
   * @param buffer defines the buffer to load the texture from in case the texture is loaded from a buffer representation
   * @param deleteBuffer defines if the buffer we are loading the texture from should be deleted after load
   * @param format defines the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
   * @param mimeType defines an optional mime type information
   * @param loaderOptions options to be passed to the loader
   * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
   * @param forcedExtension defines the extension to use to pick the right loader
   */
  constructor(e, t, r, a, u = i.TRILINEAR_SAMPLINGMODE, _ = null, f = null, n = null, s = !1, l, c, R, m, N) {
    super(t), this.url = null, this.uOffset = 0, this.vOffset = 0, this.uScale = 1, this.vScale = 1, this.uAng = 0, this.vAng = 0, this.wAng = 0, this.uRotationCenter = 0.5, this.vRotationCenter = 0.5, this.wRotationCenter = 0.5, this.homogeneousRotationInUVTransform = !1, this.inspectableCustomProperties = null, this._noMipmap = !1, this._invertY = !1, this._rowGenerationMatrix = null, this._cachedTextureMatrix = null, this._projectionModeMatrix = null, this._t0 = null, this._t1 = null, this._t2 = null, this._cachedUOffset = -1, this._cachedVOffset = -1, this._cachedUScale = 0, this._cachedVScale = 0, this._cachedUAng = -1, this._cachedVAng = -1, this._cachedWAng = -1, this._cachedReflectionProjectionMatrixId = -1, this._cachedURotationCenter = -1, this._cachedVRotationCenter = -1, this._cachedWRotationCenter = -1, this._cachedHomogeneousRotationInUVTransform = !1, this._cachedIdentity3x2 = !0, this._cachedReflectionTextureMatrix = null, this._cachedReflectionUOffset = -1, this._cachedReflectionVOffset = -1, this._cachedReflectionUScale = 0, this._cachedReflectionVScale = 0, this._cachedReflectionCoordinatesMode = -1, this._buffer = null, this._deleteBuffer = !1, this._format = null, this._delayedOnLoad = null, this._delayedOnError = null, this.onLoadObservable = new B(), this._isBlocking = !0, this.name = e || "", this.url = e;
    let M, b = !1, C = null, v = !0;
    typeof r == "object" && r !== null ? (M = r.noMipmap ?? !1, a = r.invertY ?? !G.UseOpenGLOrientationForUV, u = r.samplingMode ?? i.TRILINEAR_SAMPLINGMODE, _ = r.onLoad ?? null, f = r.onError ?? null, n = r.buffer ?? null, s = r.deleteBuffer ?? !1, l = r.format, c = r.mimeType, R = r.loaderOptions, m = r.creationFlags, b = r.useSRGBBuffer ?? !1, C = r.internalTexture ?? null, v = r.gammaSpace ?? v) : M = !!r, this._gammaSpace = v, this._noMipmap = M, this._invertY = a === void 0 ? !G.UseOpenGLOrientationForUV : a, this._initialSamplingMode = u, this._buffer = n, this._deleteBuffer = s, this._mimeType = c, this._loaderOptions = R, this._creationFlags = m, this._useSRGBBuffer = b, this._forcedExtension = N, l && (this._format = l);
    const A = this.getScene(), D = this._getEngine();
    if (!D)
      return;
    D.onBeforeTextureInitObservable.notifyObservers(this);
    const y = () => {
      this._texture && (this._texture._invertVScale && (this.vScale *= -1, this.vOffset += 1), this._texture._cachedWrapU !== null && (this.wrapU = this._texture._cachedWrapU, this._texture._cachedWrapU = null), this._texture._cachedWrapV !== null && (this.wrapV = this._texture._cachedWrapV, this._texture._cachedWrapV = null), this._texture._cachedWrapR !== null && (this.wrapR = this._texture._cachedWrapR, this._texture._cachedWrapR = null)), this.onLoadObservable.hasObservers() && this.onLoadObservable.notifyObservers(this), _ && _(), !this.isBlocking && A && A.resetCachedMaterial();
    }, I = (S, E) => {
      this._loadingError = !0, this._errorObject = { message: S, exception: E }, f && f(S, E), i.OnTextureLoadErrorObservable.notifyObservers(this);
    };
    if (!this.url && !C) {
      this._delayedOnLoad = y, this._delayedOnError = I;
      return;
    }
    if (this._texture = C ?? this._getFromCache(this.url, M, u, this._invertY, b, this.isCube), this._texture)
      if (this._texture.isReady)
        V.SetImmediate(() => y());
      else {
        const S = this._texture.onLoadedObservable.add(y);
        this._texture.onErrorObservable.add((E) => {
          I(E.message, E.exception), this._texture?.onLoadedObservable.remove(S);
        });
      }
    else if (!A || !A.useDelayedTextureLoading) {
      try {
        this._texture = D.createTexture(this.url, M, this._invertY, A, u, y, I, this._buffer, void 0, this._format, this._forcedExtension, c, R, m, b);
      } catch (S) {
        throw I("error loading", S), S;
      }
      s && (this._buffer = null);
    } else
      this.delayLoadState = 4, this._delayedOnLoad = y, this._delayedOnError = I;
  }
  /**
   * Update the url (and optional buffer) of this texture if url was null during construction.
   * @param url the url of the texture
   * @param buffer the buffer of the texture (defaults to null)
   * @param onLoad callback called when the texture is loaded  (defaults to null)
   * @param forcedExtension defines the extension to use to pick the right loader
   */
  updateURL(e, t = null, r, a) {
    this.url && (this.releaseInternalTexture(), this.getScene().markAllMaterialsAsDirty(1, (u) => u.hasTexture(this))), (!this.name || this.name.startsWith("data:")) && (this.name = e), this.url = e, this._buffer = t, this._forcedExtension = a, this.delayLoadState = 4, r && (this._delayedOnLoad = r), this.delayLoad();
  }
  /**
   * Finish the loading sequence of a texture flagged as delayed load.
   * @internal
   */
  delayLoad() {
    if (this.delayLoadState !== 4)
      return;
    const e = this.getScene();
    e && (this.delayLoadState = 1, this._texture = this._getFromCache(this.url, this._noMipmap, this.samplingMode, this._invertY, this._useSRGBBuffer, this.isCube), this._texture ? this._delayedOnLoad && (this._texture.isReady ? V.SetImmediate(this._delayedOnLoad) : this._texture.onLoadedObservable.add(this._delayedOnLoad)) : (this._texture = e.getEngine().createTexture(this.url, this._noMipmap, this._invertY, e, this.samplingMode, this._delayedOnLoad, this._delayedOnError, this._buffer, null, this._format, this._forcedExtension, this._mimeType, this._loaderOptions, this._creationFlags, this._useSRGBBuffer), this._deleteBuffer && (this._buffer = null)), this._delayedOnLoad = null, this._delayedOnError = null);
  }
  _prepareRowForTextureGeneration(e, t, r, a) {
    e *= this._cachedUScale, t *= this._cachedVScale, e -= this.uRotationCenter * this._cachedUScale, t -= this.vRotationCenter * this._cachedVScale, r -= this.wRotationCenter, O.TransformCoordinatesFromFloatsToRef(e, t, r, this._rowGenerationMatrix, a), a.x += this.uRotationCenter * this._cachedUScale + this._cachedUOffset, a.y += this.vRotationCenter * this._cachedVScale + this._cachedVOffset, a.z += this.wRotationCenter;
  }
  /**
   * Get the current texture matrix which includes the requested offsetting, tiling and rotation components.
   * @param uBase The horizontal base offset multiplier (1 by default)
   * @returns the transform matrix of the texture.
   */
  getTextureMatrix(e = 1) {
    if (this.uOffset === this._cachedUOffset && this.vOffset === this._cachedVOffset && this.uScale * e === this._cachedUScale && this.vScale === this._cachedVScale && this.uAng === this._cachedUAng && this.vAng === this._cachedVAng && this.wAng === this._cachedWAng && this.uRotationCenter === this._cachedURotationCenter && this.vRotationCenter === this._cachedVRotationCenter && this.wRotationCenter === this._cachedWRotationCenter && this.homogeneousRotationInUVTransform === this._cachedHomogeneousRotationInUVTransform)
      return this._cachedTextureMatrix;
    this._cachedUOffset = this.uOffset, this._cachedVOffset = this.vOffset, this._cachedUScale = this.uScale * e, this._cachedVScale = this.vScale, this._cachedUAng = this.uAng, this._cachedVAng = this.vAng, this._cachedWAng = this.wAng, this._cachedURotationCenter = this.uRotationCenter, this._cachedVRotationCenter = this.vRotationCenter, this._cachedWRotationCenter = this.wRotationCenter, this._cachedHomogeneousRotationInUVTransform = this.homogeneousRotationInUVTransform, (!this._cachedTextureMatrix || !this._rowGenerationMatrix) && (this._cachedTextureMatrix = x.Zero(), this._rowGenerationMatrix = new x(), this._t0 = O.Zero(), this._t1 = O.Zero(), this._t2 = O.Zero()), x.RotationYawPitchRollToRef(this.vAng, this.uAng, this.wAng, this._rowGenerationMatrix), this.homogeneousRotationInUVTransform ? (x.TranslationToRef(-this._cachedURotationCenter, -this._cachedVRotationCenter, -this._cachedWRotationCenter, p.Matrix[0]), x.TranslationToRef(this._cachedURotationCenter, this._cachedVRotationCenter, this._cachedWRotationCenter, p.Matrix[1]), x.ScalingToRef(this._cachedUScale, this._cachedVScale, 0, p.Matrix[2]), x.TranslationToRef(this._cachedUOffset, this._cachedVOffset, 0, p.Matrix[3]), p.Matrix[0].multiplyToRef(this._rowGenerationMatrix, this._cachedTextureMatrix), this._cachedTextureMatrix.multiplyToRef(p.Matrix[1], this._cachedTextureMatrix), this._cachedTextureMatrix.multiplyToRef(p.Matrix[2], this._cachedTextureMatrix), this._cachedTextureMatrix.multiplyToRef(p.Matrix[3], this._cachedTextureMatrix), this._cachedTextureMatrix.setRowFromFloats(2, this._cachedTextureMatrix.m[12], this._cachedTextureMatrix.m[13], this._cachedTextureMatrix.m[14], 1)) : (this._prepareRowForTextureGeneration(0, 0, 0, this._t0), this._prepareRowForTextureGeneration(1, 0, 0, this._t1), this._prepareRowForTextureGeneration(0, 1, 0, this._t2), this._t1.subtractInPlace(this._t0), this._t2.subtractInPlace(this._t0), x.FromValuesToRef(this._t1.x, this._t1.y, this._t1.z, 0, this._t2.x, this._t2.y, this._t2.z, 0, this._t0.x, this._t0.y, this._t0.z, 0, 0, 0, 0, 1, this._cachedTextureMatrix));
    const t = this.getScene();
    if (!t)
      return this._cachedTextureMatrix;
    const r = this._cachedIdentity3x2;
    return this._cachedIdentity3x2 = this._cachedTextureMatrix.isIdentityAs3x2(), this.optimizeUVAllocation && r !== this._cachedIdentity3x2 && t.markAllMaterialsAsDirty(1, (a) => a.hasTexture(this)), this._cachedTextureMatrix;
  }
  /**
   * Get the current matrix used to apply reflection. This is useful to rotate an environment texture for instance.
   * @returns The reflection texture transform
   */
  getReflectionTextureMatrix() {
    const e = this.getScene();
    if (!e)
      return this._cachedReflectionTextureMatrix;
    if (this.uOffset === this._cachedReflectionUOffset && this.vOffset === this._cachedReflectionVOffset && this.uScale === this._cachedReflectionUScale && this.vScale === this._cachedReflectionVScale && this.coordinatesMode === this._cachedReflectionCoordinatesMode)
      if (this.coordinatesMode === i.PROJECTION_MODE) {
        if (this._cachedReflectionProjectionMatrixId === e.getProjectionMatrix().updateFlag)
          return this._cachedReflectionTextureMatrix;
      } else
        return this._cachedReflectionTextureMatrix;
    this._cachedReflectionTextureMatrix || (this._cachedReflectionTextureMatrix = x.Zero()), this._projectionModeMatrix || (this._projectionModeMatrix = x.Zero());
    const t = this._cachedReflectionCoordinatesMode !== this.coordinatesMode;
    switch (this._cachedReflectionUOffset = this.uOffset, this._cachedReflectionVOffset = this.vOffset, this._cachedReflectionUScale = this.uScale, this._cachedReflectionVScale = this.vScale, this._cachedReflectionCoordinatesMode = this.coordinatesMode, this.coordinatesMode) {
      case i.PLANAR_MODE: {
        x.IdentityToRef(this._cachedReflectionTextureMatrix), this._cachedReflectionTextureMatrix[0] = this.uScale, this._cachedReflectionTextureMatrix[5] = this.vScale, this._cachedReflectionTextureMatrix[12] = this.uOffset, this._cachedReflectionTextureMatrix[13] = this.vOffset;
        break;
      }
      case i.PROJECTION_MODE: {
        x.FromValuesToRef(0.5, 0, 0, 0, 0, -0.5, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 1, 1, this._projectionModeMatrix);
        const r = e.getProjectionMatrix();
        this._cachedReflectionProjectionMatrixId = r.updateFlag, r.multiplyToRef(this._projectionModeMatrix, this._cachedReflectionTextureMatrix);
        break;
      }
      default:
        x.IdentityToRef(this._cachedReflectionTextureMatrix);
        break;
    }
    return t && e.markAllMaterialsAsDirty(1, (r) => r.hasTexture(this)), this._cachedReflectionTextureMatrix;
  }
  /**
   * Clones the texture.
   * @returns the cloned texture
   */
  clone() {
    const e = {
      noMipmap: this._noMipmap,
      invertY: this._invertY,
      samplingMode: this.samplingMode,
      onLoad: void 0,
      onError: void 0,
      buffer: this._texture ? this._texture._buffer : void 0,
      deleteBuffer: this._deleteBuffer,
      format: this.textureFormat,
      mimeType: this.mimeType,
      loaderOptions: this._loaderOptions,
      creationFlags: this._creationFlags,
      useSRGBBuffer: this._useSRGBBuffer
    };
    return T.Clone(() => new i(this._texture ? this._texture.url : null, this.getScene(), e), this);
  }
  /**
   * Serialize the texture to a JSON representation we can easily use in the respective Parse function.
   * @returns The JSON representation of the texture
   */
  serialize() {
    const e = this.name;
    i.SerializeBuffers || this.name.startsWith("data:") && (this.name = ""), this.name.startsWith("data:") && this.url === this.name && (this.url = "");
    const t = super.serialize(i._SerializeInternalTextureUniqueId);
    return t ? ((i.SerializeBuffers || i.ForceSerializeBuffers) && (typeof this._buffer == "string" && this._buffer.substr(0, 5) === "data:" ? (t.base64String = this._buffer, t.name = t.name.replace("data:", "")) : this.url && this.url.startsWith("data:") && this._buffer instanceof Uint8Array ? t.base64String = "data:image/png;base64," + j(this._buffer) : (i.ForceSerializeBuffers || this.url && this.url.startsWith("blob:") || this._forceSerialize) && (t.base64String = !this._engine || this._engine._features.supportSyncTextureRead ? P(this) : F(this))), t.invertY = this._invertY, t.samplingMode = this.samplingMode, t._creationFlags = this._creationFlags, t._useSRGBBuffer = this._useSRGBBuffer, i._SerializeInternalTextureUniqueId && (t.internalTextureUniqueId = this._texture?.uniqueId ?? void 0), t.noMipmap = this._noMipmap, this.name = e, t) : null;
  }
  /**
   * Get the current class name of the texture useful for serialization or dynamic coding.
   * @returns "Texture"
   */
  getClassName() {
    return "Texture";
  }
  /**
   * Dispose the texture and release its associated resources.
   */
  dispose() {
    super.dispose(), this.onLoadObservable.clear(), this._delayedOnLoad = null, this._delayedOnError = null, this._buffer = null;
  }
  /**
   * Parse the JSON representation of a texture in order to recreate the texture in the given scene.
   * @param parsedTexture Define the JSON representation of the texture
   * @param scene Define the scene the parsed texture should be instantiated in
   * @param rootUrl Define the root url of the parsing sequence in the case of relative dependencies
   * @returns The parsed texture if successful
   */
  static Parse(e, t, r) {
    if (e.customType) {
      const s = q.Instantiate(e.customType).Parse(e, t, r);
      return e.samplingMode && s.updateSamplingMode && s._samplingMode && s._samplingMode !== e.samplingMode && s.updateSamplingMode(e.samplingMode), s;
    }
    if (e.isCube && !e.isRenderTarget)
      return i._CubeTextureParser(e, t, r);
    const a = e.internalTextureUniqueId !== void 0;
    if (!e.name && !e.isRenderTarget && !a)
      return null;
    let u;
    if (a) {
      const n = t.getEngine().getLoadedTexturesCache();
      for (const s of n)
        if (s.uniqueId === e.internalTextureUniqueId) {
          u = s;
          break;
        }
    }
    const _ = (n) => {
      if (n && n._texture && (n._texture._cachedWrapU = null, n._texture._cachedWrapV = null, n._texture._cachedWrapR = null), e.samplingMode) {
        const s = e.samplingMode;
        n && n.samplingMode !== s && n.updateSamplingMode(s);
      }
      if (n && e.animations)
        for (let s = 0; s < e.animations.length; s++) {
          const l = e.animations[s], c = H("BABYLON.Animation");
          c && n.animations.push(c.Parse(l));
        }
      a && !u && n?._texture?._setUniqueId(e.internalTextureUniqueId);
    };
    return T.Parse(() => {
      let n = !0;
      if (e.noMipmap && (n = !1), e.mirrorPlane) {
        const s = i._CreateMirror(e.name, e.renderTargetSize, t, n);
        return s._waitingRenderList = e.renderList, s.mirrorPlane = X.FromArray(e.mirrorPlane), _(s), s;
      } else if (e.isRenderTarget) {
        let s = null;
        if (e.isCube) {
          if (t.reflectionProbes)
            for (let l = 0; l < t.reflectionProbes.length; l++) {
              const c = t.reflectionProbes[l];
              if (c.name === e.name)
                return c.cubeTexture;
            }
        } else
          s = i._CreateRenderTargetTexture(e.name, e.renderTargetSize, t, n, e._creationFlags ?? 0), s._waitingRenderList = e.renderList;
        return _(s), s;
      } else if (e.isVideo) {
        const s = i._CreateVideoTexture(r + (e.url || e.name), r + (e.src || e.url), t, n, e.invertY, e.samplingMode, e.settings || {});
        return _(s), s;
      } else {
        let s;
        if (e.base64String && !u)
          s = i.CreateFromBase64String(e.base64String, e.base64String, t, !n, e.invertY, e.samplingMode, () => {
            _(s);
          }, e._creationFlags ?? 0, e._useSRGBBuffer ?? !1), s.name = e.name;
        else {
          let l;
          e.name && (e.name.indexOf("://") > 0 || e.name.startsWith("data:")) ? l = e.name : l = r + e.name, e.url && (e.url.startsWith("data:") || i.UseSerializedUrlIfAny) && (l = e.url);
          const c = {
            noMipmap: !n,
            invertY: e.invertY,
            samplingMode: e.samplingMode,
            onLoad: () => {
              _(s);
            },
            internalTexture: u
          };
          s = new i(l, t, c);
        }
        return s;
      }
    }, e, t);
  }
  /**
   * Creates a texture from its base 64 representation.
   * @param data Define the base64 payload without the data: prefix
   * @param name Define the name of the texture in the scene useful fo caching purpose for instance
   * @param scene Define the scene the texture should belong to
   * @param noMipmapOrOptions defines if the texture will require mip maps or not or set of all options to create the texture
   * @param invertY define if the texture needs to be inverted on the y axis during loading
   * @param samplingMode define the sampling mode we want for the texture while fetching from it (Texture.NEAREST_SAMPLINGMODE...)
   * @param onLoad define a callback triggered when the texture has been loaded
   * @param onError define a callback triggered when an error occurred during the loading session
   * @param format define the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
   * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
   * @param forcedExtension defines the extension to use to pick the right loader
   * @returns the created texture
   */
  static CreateFromBase64String(e, t, r, a, u, _ = i.TRILINEAR_SAMPLINGMODE, f = null, n = null, s = 5, l, c) {
    return new i("data:" + t, r, a, u, _, f, n, e, !1, s, void 0, void 0, l, c);
  }
  /**
   * Creates a texture from its data: representation. (data: will be added in case only the payload has been passed in)
   * @param name Define the name of the texture in the scene useful fo caching purpose for instance
   * @param buffer define the buffer to load the texture from in case the texture is loaded from a buffer representation
   * @param scene Define the scene the texture should belong to
   * @param deleteBuffer define if the buffer we are loading the texture from should be deleted after load
   * @param noMipmapOrOptions defines if the texture will require mip maps or not or set of all options to create the texture
   * @param invertY define if the texture needs to be inverted on the y axis during loading
   * @param samplingMode define the sampling mode we want for the texture while fetching from it (Texture.NEAREST_SAMPLINGMODE...)
   * @param onLoad define a callback triggered when the texture has been loaded
   * @param onError define a callback triggered when an error occurred during the loading session
   * @param format define the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
   * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
   * @param forcedExtension defines the extension to use to pick the right loader
   * @returns the created texture
   */
  static LoadFromDataString(e, t, r, a = !1, u, _ = !0, f = i.TRILINEAR_SAMPLINGMODE, n = null, s = null, l = 5, c, R) {
    return e.substr(0, 5) !== "data:" && (e = "data:" + e), new i(e, r, u, _, f, n, s, t, a, l, void 0, void 0, c, R);
  }
}
i.SerializeBuffers = !0;
i.ForceSerializeBuffers = !1;
i.OnTextureLoadErrorObservable = new B();
i._SerializeInternalTextureUniqueId = !1;
i._CubeTextureParser = (g, e, t) => {
  throw L("CubeTexture");
};
i._CreateMirror = (g, e, t, r) => {
  throw L("MirrorTexture");
};
i._CreateRenderTargetTexture = (g, e, t, r, a) => {
  throw L("RenderTargetTexture");
};
i.NEAREST_SAMPLINGMODE = 1;
i.NEAREST_NEAREST_MIPLINEAR = 8;
i.BILINEAR_SAMPLINGMODE = 2;
i.LINEAR_LINEAR_MIPNEAREST = 11;
i.TRILINEAR_SAMPLINGMODE = 3;
i.LINEAR_LINEAR_MIPLINEAR = 3;
i.NEAREST_NEAREST_MIPNEAREST = 4;
i.NEAREST_LINEAR_MIPNEAREST = 5;
i.NEAREST_LINEAR_MIPLINEAR = 6;
i.NEAREST_LINEAR = 7;
i.NEAREST_NEAREST = 1;
i.LINEAR_NEAREST_MIPNEAREST = 9;
i.LINEAR_NEAREST_MIPLINEAR = 10;
i.LINEAR_LINEAR = 2;
i.LINEAR_NEAREST = 12;
i.EXPLICIT_MODE = 0;
i.SPHERICAL_MODE = 1;
i.PLANAR_MODE = 2;
i.CUBIC_MODE = 3;
i.PROJECTION_MODE = 4;
i.SKYBOX_MODE = 5;
i.INVCUBIC_MODE = 6;
i.EQUIRECTANGULAR_MODE = 7;
i.FIXED_EQUIRECTANGULAR_MODE = 8;
i.FIXED_EQUIRECTANGULAR_MIRRORED_MODE = 9;
i.CLAMP_ADDRESSMODE = 0;
i.WRAP_ADDRESSMODE = 1;
i.MIRROR_ADDRESSMODE = 2;
i.UseSerializedUrlIfAny = !1;
h([
  o()
], i.prototype, "url", void 0);
h([
  o()
], i.prototype, "uOffset", void 0);
h([
  o()
], i.prototype, "vOffset", void 0);
h([
  o()
], i.prototype, "uScale", void 0);
h([
  o()
], i.prototype, "vScale", void 0);
h([
  o()
], i.prototype, "uAng", void 0);
h([
  o()
], i.prototype, "vAng", void 0);
h([
  o()
], i.prototype, "wAng", void 0);
h([
  o()
], i.prototype, "uRotationCenter", void 0);
h([
  o()
], i.prototype, "vRotationCenter", void 0);
h([
  o()
], i.prototype, "wRotationCenter", void 0);
h([
  o()
], i.prototype, "homogeneousRotationInUVTransform", void 0);
h([
  o()
], i.prototype, "isBlocking", null);
Z("BABYLON.Texture", i);
T._TextureParser = i.Parse;
const te = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Texture: i
}, Symbol.toStringTag, { value: "Module" }));
export {
  d as B,
  ee as C,
  w as G,
  i as T,
  U as a,
  P as b,
  F as c,
  te as t
};
//# sourceMappingURL=texture-CrzlX0Ec.js.map
