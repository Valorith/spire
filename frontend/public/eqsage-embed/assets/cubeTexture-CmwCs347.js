import { Y as p, a0 as D, a1 as w, L as A, m as N, a3 as F, M as y, O as V, a as I, i as L, T as Y, G as z, b as C, c as m, s as G, a4 as v, R as W } from "./embed-entry-BKE21f6Q.js";
import { B as H, T as O } from "./texture-BWPw_5Qg.js";
import { S as U } from "./decorators.serialization-DfmppPDN.js";
p.prototype._createDepthStencilCubeTexture = function(l, e) {
  const i = new D(this, w.DepthStencil);
  if (i.isCube = !0, this.webGLVersion === 1)
    return A.Error("Depth cube texture is not supported by WebGL 1."), i;
  const t = {
    bilinearFiltering: !1,
    comparisonFunction: 0,
    generateStencil: !1,
    ...e
  }, s = this._gl;
  this._bindTextureDirectly(s.TEXTURE_CUBE_MAP, i, !0), this._setupDepthStencilTexture(i, l, t.generateStencil, t.bilinearFiltering, t.comparisonFunction);
  for (let n = 0; n < 6; n++)
    t.generateStencil ? s.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X + n, 0, s.DEPTH24_STENCIL8, l, l, 0, s.DEPTH_STENCIL, s.UNSIGNED_INT_24_8, null) : s.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X + n, 0, s.DEPTH_COMPONENT24, l, l, 0, s.DEPTH_COMPONENT, s.UNSIGNED_INT, null);
  return this._bindTextureDirectly(s.TEXTURE_CUBE_MAP, null), this._internalTexturesCache.push(i), i;
};
p.prototype._partialLoadFile = function(l, e, i, t, s = null) {
  const n = (o) => {
    i[e] = o, i._internalCount++, i._internalCount === 6 && t(i);
  }, a = (o, h) => {
    s && o && s(o.status + " " + o.statusText, h);
  };
  this._loadFile(l, n, void 0, void 0, !0, a);
};
p.prototype._cascadeLoadFiles = function(l, e, i, t = null) {
  const s = [];
  s._internalCount = 0;
  for (let n = 0; n < 6; n++)
    this._partialLoadFile(i[n], n, s, e, t);
};
p.prototype._cascadeLoadImgs = function(l, e, i, t, s = null, n) {
  const a = [];
  a._internalCount = 0;
  for (let o = 0; o < 6; o++)
    this._partialLoadImg(t[o], o, a, l, e, i, s, n);
};
p.prototype._partialLoadImg = function(l, e, i, t, s, n, a = null, o) {
  const h = N();
  F(l, (f) => {
    i[e] = f, i._internalCount++, t && t.removePendingData(h), i._internalCount === 6 && n && n(s, i);
  }, (f, T) => {
    t && t.removePendingData(h), a && a(f, T);
  }, t ? t.offlineProvider : null, o), t && t.addPendingData(h);
};
p.prototype._setCubeMapTextureParams = function(l, e, i) {
  const t = this._gl;
  t.texParameteri(t.TEXTURE_CUBE_MAP, t.TEXTURE_MAG_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_CUBE_MAP, t.TEXTURE_MIN_FILTER, e ? t.LINEAR_MIPMAP_LINEAR : t.LINEAR), t.texParameteri(t.TEXTURE_CUBE_MAP, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_CUBE_MAP, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE), l.samplingMode = e ? 3 : 2, e && this.getCaps().textureMaxLevel && i !== void 0 && i > 0 && (t.texParameteri(t.TEXTURE_CUBE_MAP, t.TEXTURE_MAX_LEVEL, i), l._maxLodLevel = i), this._bindTextureDirectly(t.TEXTURE_CUBE_MAP, null);
};
p.prototype.createCubeTextureBase = function(l, e, i, t, s = null, n = null, a, o = null, h = !1, E = 0, c = 0, f = null, T = null, b = null, u = !1) {
  const r = f || new D(this, w.Cube);
  r.isCube = !0, r.url = l, r.generateMipMaps = !t, r._lodGenerationScale = E, r._lodGenerationOffset = c, r._useSRGBBuffer = !!u && this._caps.supportSRGBBuffers && (this.webGLVersion > 1 || this.isWebGPU || !!t), r !== f && (r.label = l.substring(0, 60)), this._doNotHandleContextLost || (r._extension = o, r._files = i);
  const x = l;
  this._transformTextureUrl && !f && (l = this._transformTextureUrl(l));
  const P = l.split("?")[0], B = P.lastIndexOf("."), S = o || (B > -1 ? P.substring(B).toLowerCase() : "");
  let R = null;
  for (const _ of p._TextureLoaders)
    if (_.canLoad(S)) {
      R = _;
      break;
    }
  const M = (_, g) => {
    l === x ? n && _ && n(_.status + " " + _.statusText, g) : (A.Warn(`Failed to load ${l}, falling back to the ${x}`), this.createCubeTextureBase(x, e, i, !!t, s, n, a, o, h, E, c, r, T, b, u));
  };
  if (R) {
    const _ = (g) => {
      T && T(r, g), R.loadCubeData(g, r, h, s, n);
    };
    i && i.length === 6 ? R.supportCascades ? this._cascadeLoadFiles(e, (g) => _(g.map((X) => new Uint8Array(X))), i, n) : n ? n("Textures type does not support cascades.") : A.Warn("Texture loader does not support cascades.") : this._loadFile(l, (g) => _(new Uint8Array(g)), void 0, void 0, !0, M);
  } else {
    if (!i || i.length === 0)
      throw new Error("Cannot load cubemap because files were not defined, or the correct loader was not found.");
    this._cascadeLoadImgs(e, r, (_, g) => {
      b && b(_, g);
    }, i, n);
  }
  return this._internalTexturesCache.push(r), r;
};
p.prototype.createCubeTexture = function(l, e, i, t, s = null, n = null, a, o = null, h = !1, E = 0, c = 0, f = null, T, b = !1) {
  const u = this._gl;
  return this.createCubeTextureBase(l, e, i, !!t, s, n, a, o, h, E, c, f, (r) => this._bindTextureDirectly(u.TEXTURE_CUBE_MAP, r, !0), (r, x) => {
    const P = this.needPOTTextures ? p.GetExponentOfTwo(x[0].width, this._caps.maxCubemapTextureSize) : x[0].width, B = P, S = [
      u.TEXTURE_CUBE_MAP_POSITIVE_X,
      u.TEXTURE_CUBE_MAP_POSITIVE_Y,
      u.TEXTURE_CUBE_MAP_POSITIVE_Z,
      u.TEXTURE_CUBE_MAP_NEGATIVE_X,
      u.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      u.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];
    this._bindTextureDirectly(u.TEXTURE_CUBE_MAP, r, !0), this._unpackFlipY(!1);
    const R = a ? this._getInternalFormat(a, r._useSRGBBuffer) : r._useSRGBBuffer ? this._glSRGBExtensionValues.SRGB8_ALPHA8 : u.RGBA;
    let M = a ? this._getInternalFormat(a) : u.RGBA;
    r._useSRGBBuffer && this.webGLVersion === 1 && (M = R);
    for (let _ = 0; _ < S.length; _++)
      if (x[_].width !== P || x[_].height !== B) {
        if (this._prepareWorkingCanvas(), !this._workingCanvas || !this._workingContext) {
          A.Warn("Cannot create canvas to resize texture.");
          return;
        }
        this._workingCanvas.width = P, this._workingCanvas.height = B, this._workingContext.drawImage(x[_], 0, 0, x[_].width, x[_].height, 0, 0, P, B), u.texImage2D(S[_], 0, R, M, u.UNSIGNED_BYTE, this._workingCanvas);
      } else
        u.texImage2D(S[_], 0, R, M, u.UNSIGNED_BYTE, x[_]);
    t || u.generateMipmap(u.TEXTURE_CUBE_MAP), this._setCubeMapTextureParams(r, !t), r.width = P, r.height = B, r.isReady = !0, a && (r.format = a), r.onLoadedObservable.notifyObservers(r), r.onLoadedObservable.clear(), s && s();
  }, !!b);
};
class d extends H {
  /**
   * Gets or sets the size of the bounding box associated with the cube texture
   * When defined, the cubemap will switch to local mode
   * @see https://community.arm.com/graphics/b/blog/posts/reflections-based-on-local-cubemaps-in-unity
   * @example https://www.babylonjs-playground.com/#RNASML
   */
  set boundingBoxSize(e) {
    if (this._boundingBoxSize && this._boundingBoxSize.equals(e))
      return;
    this._boundingBoxSize = e;
    const i = this.getScene();
    i && i.markAllMaterialsAsDirty(1);
  }
  /**
   * Returns the bounding box size
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#using-local-cubemap-mode
   */
  get boundingBoxSize() {
    return this._boundingBoxSize;
  }
  /**
   * Sets texture matrix rotation angle around Y axis in radians.
   */
  set rotationY(e) {
    this._rotationY = e, this.setReflectionTextureMatrix(y.RotationY(this._rotationY));
  }
  /**
   * Gets texture matrix rotation angle around Y axis radians.
   */
  get rotationY() {
    return this._rotationY;
  }
  /**
   * Are mip maps generated for this texture or not.
   */
  get noMipmap() {
    return this._noMipmap;
  }
  /**
   * Gets the forced extension (if any)
   */
  get forcedExtension() {
    return this._forcedExtension;
  }
  /**
   * Creates a cube texture from an array of image urls
   * @param files defines an array of image urls
   * @param scene defines the hosting scene
   * @param noMipmap specifies if mip maps are not used
   * @returns a cube texture
   */
  static CreateFromImages(e, i, t) {
    let s = "";
    return e.forEach((n) => s += n), new d(s, i, null, t, e);
  }
  /**
   * Creates and return a texture created from prefilterd data by tools like IBL Baker or Lys.
   * @param url defines the url of the prefiltered texture
   * @param scene defines the scene the texture is attached to
   * @param forcedExtension defines the extension of the file if different from the url
   * @param createPolynomials defines whether or not to create polynomial harmonics from the texture data if necessary
   * @returns the prefiltered texture
   */
  static CreateFromPrefilteredData(e, i, t = null, s = !0) {
    const n = i.useDelayedTextureLoading;
    i.useDelayedTextureLoading = !1;
    const a = new d(e, i, null, !1, null, null, null, void 0, !0, t, s);
    return i.useDelayedTextureLoading = n, a;
  }
  /**
   * Creates a cube texture to use with reflection for instance. It can be based upon dds or six images as well
   * as prefiltered data.
   * @param rootUrl defines the url of the texture or the root name of the six images
   * @param sceneOrEngine defines the scene or engine the texture is attached to
   * @param extensions defines the suffixes add to the picture name in case six images are in use like _px.jpg...
   * @param noMipmap defines if mipmaps should be created or not
   * @param files defines the six files to load for the different faces in that order: px, py, pz, nx, ny, nz
   * @param onLoad defines a callback triggered at the end of the file load if no errors occurred
   * @param onError defines a callback triggered in case of error during load
   * @param format defines the internal format to use for the texture once loaded
   * @param prefiltered defines whether or not the texture is created from prefiltered data
   * @param forcedExtension defines the extensions to use (force a special type of file to load) in case it is different from the file name
   * @param createPolynomials defines whether or not to create polynomial harmonics from the texture data if necessary
   * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
   * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
   * @param loaderOptions options to be passed to the loader
   * @param useSRGBBuffer Defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU) (default: false)
   * @returns the cube texture
   */
  constructor(e, i, t = null, s = !1, n = null, a = null, o = null, h = 5, E = !1, c = null, f = !1, T = 0.8, b = 0, u, r) {
    super(i), this._lodScale = 0.8, this._lodOffset = 0, this.onLoadObservable = new V(), this.boundingBoxPosition = I.Zero(), this._rotationY = 0, this._files = null, this._forcedExtension = null, this._extensions = null, this._textureMatrixRefraction = new y(), this.name = e, this.url = e, this._noMipmap = s, this.hasAlpha = !1, this._format = h, this.isCube = !0, this._textureMatrix = y.Identity(), this._createPolynomials = f, this.coordinatesMode = O.CUBIC_MODE, this._extensions = t, this._files = n, this._forcedExtension = c, this._loaderOptions = u, this._useSRGBBuffer = r, this._lodScale = T, this._lodOffset = b, !(!e && !n) && this.updateURL(e, c, a, E, o, t, this.getScene()?.useDelayedTextureLoading, n);
  }
  /**
   * Get the current class name of the texture useful for serialization or dynamic coding.
   * @returns "CubeTexture"
   */
  getClassName() {
    return "CubeTexture";
  }
  /**
   * Update the url (and optional buffer) of this texture if url was null during construction.
   * @param url the url of the texture
   * @param forcedExtension defines the extension to use
   * @param onLoad callback called when the texture is loaded  (defaults to null)
   * @param prefiltered Defines whether the updated texture is prefiltered or not
   * @param onError callback called if there was an error during the loading process (defaults to null)
   * @param extensions defines the suffixes add to the picture name in case six images are in use like _px.jpg...
   * @param delayLoad defines if the texture should be loaded now (false by default)
   * @param files defines the six files to load for the different faces in that order: px, py, pz, nx, ny, nz
   */
  updateURL(e, i, t = null, s = !1, n = null, a = null, o = !1, h = null) {
    (!this.name || this.name.startsWith("data:")) && (this.name = e), this.url = e, i && (this._forcedExtension = i);
    const E = e.lastIndexOf("."), c = i || (E > -1 ? e.substring(E).toLowerCase() : ""), f = c.indexOf(".dds") === 0, T = c.indexOf(".env") === 0, b = c.indexOf(".basis") === 0;
    if (T ? (this.gammaSpace = !1, this._prefiltered = !1, this.anisotropicFilteringLevel = 1) : (this._prefiltered = s, s && (this.gammaSpace = !1, this.anisotropicFilteringLevel = 1)), h)
      this._files = h;
    else if (!b && !T && !f && !a && (a = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"]), this._files = this._files || [], this._files.length = 0, a) {
      for (let u = 0; u < a.length; u++)
        this._files.push(e + a[u]);
      this._extensions = a;
    }
    o ? (this.delayLoadState = 4, this._delayedOnLoad = t, this._delayedOnError = n) : this._loadTexture(t, n);
  }
  /**
   * Delays loading of the cube texture
   * @param forcedExtension defines the extension to use
   */
  delayLoad(e) {
    this.delayLoadState === 4 && (e && (this._forcedExtension = e), this.delayLoadState = 1, this._loadTexture(this._delayedOnLoad, this._delayedOnError));
  }
  /**
   * Returns the reflection texture matrix
   * @returns the reflection texture matrix
   */
  getReflectionTextureMatrix() {
    return this._textureMatrix;
  }
  /**
   * Sets the reflection texture matrix
   * @param value Reflection texture matrix
   */
  setReflectionTextureMatrix(e) {
    if (e.updateFlag === this._textureMatrix.updateFlag || (e.isIdentity() !== this._textureMatrix.isIdentity() && this.getScene()?.markAllMaterialsAsDirty(1, (n) => n.getActiveTextures().indexOf(this) !== -1), this._textureMatrix = e, !this.getScene()?.useRightHandedSystem))
      return;
    const i = L.Vector3[0], t = L.Quaternion[0], s = L.Vector3[1];
    this._textureMatrix.decompose(i, t, s), t.z *= -1, t.w *= -1, y.ComposeToRef(i, t, s, this._textureMatrixRefraction);
  }
  /**
   * Gets a suitable rotate/transform matrix when the texture is used for refraction.
   * There's a separate function from getReflectionTextureMatrix because refraction requires a special configuration of the matrix in right-handed mode.
   * @returns The refraction matrix
   */
  getRefractionTextureMatrix() {
    return this.getScene()?.useRightHandedSystem ? this._textureMatrixRefraction : this._textureMatrix;
  }
  _loadTexture(e = null, i = null) {
    const t = this.getScene(), s = this._texture;
    this._texture = this._getFromCache(this.url, this._noMipmap, void 0, void 0, this._useSRGBBuffer, this.isCube);
    const n = () => {
      this.onLoadObservable.notifyObservers(this), s && (s.dispose(), this.getScene()?.markAllMaterialsAsDirty(1)), e && e();
    }, a = (o, h) => {
      this._loadingError = !0, this._errorObject = { message: o, exception: h }, i && i(o, h), O.OnTextureLoadErrorObservable.notifyObservers(this);
    };
    this._texture ? this._texture.isReady ? Y.SetImmediate(() => n()) : this._texture.onLoadedObservable.add(() => n()) : (this._prefiltered ? this._texture = this._getEngine().createPrefilteredCubeTexture(this.url, t, this._lodScale, this._lodOffset, e, a, this._format, this._forcedExtension, this._createPolynomials) : this._texture = this._getEngine().createCubeTexture(this.url, t, this._files, this._noMipmap, e, a, this._format, this._forcedExtension, !1, this._lodScale, this._lodOffset, null, this._loaderOptions, !!this._useSRGBBuffer), this._texture?.onLoadedObservable.add(() => this.onLoadObservable.notifyObservers(this)));
  }
  /**
   * Parses text to create a cube texture
   * @param parsedTexture define the serialized text to read from
   * @param scene defines the hosting scene
   * @param rootUrl defines the root url of the cube texture
   * @returns a cube texture
   */
  static Parse(e, i, t) {
    const s = U.Parse(() => {
      let n = !1;
      return e.prefiltered && (n = e.prefiltered), new d(t + (e.url ?? e.name), i, e.extensions, !1, e.files || null, null, null, void 0, n, e.forcedExtension);
    }, e, i);
    if (e.boundingBoxPosition && (s.boundingBoxPosition = I.FromArray(e.boundingBoxPosition)), e.boundingBoxSize && (s.boundingBoxSize = I.FromArray(e.boundingBoxSize)), e.animations)
      for (let n = 0; n < e.animations.length; n++) {
        const a = e.animations[n], o = z("BABYLON.Animation");
        o && s.animations.push(o.Parse(a));
      }
    return s;
  }
  /**
   * Makes a clone, or deep copy, of the cube texture
   * @returns a new cube texture
   */
  clone() {
    let e = 0;
    const i = U.Clone(() => {
      const t = new d(this.url, this.getScene() || this._getEngine(), this._extensions, this._noMipmap, this._files);
      return e = t.uniqueId, t;
    }, this);
    return i.uniqueId = e, i;
  }
}
C([
  m()
], d.prototype, "url", void 0);
C([
  G()
], d.prototype, "boundingBoxPosition", void 0);
C([
  G()
], d.prototype, "boundingBoxSize", null);
C([
  m("rotationY")
], d.prototype, "rotationY", null);
C([
  m("files")
], d.prototype, "_files", void 0);
C([
  m("forcedExtension")
], d.prototype, "_forcedExtension", void 0);
C([
  m("extensions")
], d.prototype, "_extensions", void 0);
C([
  v("textureMatrix")
], d.prototype, "_textureMatrix", void 0);
C([
  v("textureMatrixRefraction")
], d.prototype, "_textureMatrixRefraction", void 0);
O._CubeTextureParser = d.Parse;
W("BABYLON.CubeTexture", d);
export {
  d as CubeTexture
};
//# sourceMappingURL=cubeTexture-CmwCs347.js.map
