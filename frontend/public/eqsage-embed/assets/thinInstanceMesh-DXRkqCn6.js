import { O as S, d as u, G as c, V as i, b as O, c as D, L as N, M as R, H as g, U as L, i as A, a as U } from "./embed-entry-BKE21f6Q.js";
import { S as f } from "./decorators.serialization-DfmppPDN.js";
import { M as _ } from "./mesh-DeWxVt-I.js";
class t {
}
t.ALPHA_DISABLE = 0;
t.ALPHA_ADD = 1;
t.ALPHA_COMBINE = 2;
t.ALPHA_SUBTRACT = 3;
t.ALPHA_MULTIPLY = 4;
t.ALPHA_MAXIMIZED = 5;
t.ALPHA_ONEONE = 6;
t.ALPHA_PREMULTIPLIED = 7;
t.ALPHA_PREMULTIPLIED_PORTERDUFF = 8;
t.ALPHA_INTERPOLATE = 9;
t.ALPHA_SCREENMODE = 10;
t.ALPHA_ONEONE_ONEONE = 11;
t.ALPHA_ALPHATOCOLOR = 12;
t.ALPHA_REVERSEONEMINUS = 13;
t.ALPHA_SRC_DSTONEMINUSSRCALPHA = 14;
t.ALPHA_ONEONE_ONEZERO = 15;
t.ALPHA_EXCLUSION = 16;
t.ALPHA_LAYER_ACCUMULATE = 17;
t.ALPHA_EQUATION_ADD = 0;
t.ALPHA_EQUATION_SUBSTRACT = 1;
t.ALPHA_EQUATION_REVERSE_SUBTRACT = 2;
t.ALPHA_EQUATION_MAX = 3;
t.ALPHA_EQUATION_MIN = 4;
t.ALPHA_EQUATION_DARKEN = 5;
t.DELAYLOADSTATE_NONE = 0;
t.DELAYLOADSTATE_LOADED = 1;
t.DELAYLOADSTATE_LOADING = 2;
t.DELAYLOADSTATE_NOTLOADED = 4;
t.NEVER = 512;
t.ALWAYS = 519;
t.LESS = 513;
t.EQUAL = 514;
t.LEQUAL = 515;
t.GREATER = 516;
t.GEQUAL = 518;
t.NOTEQUAL = 517;
t.KEEP = 7680;
t.ZERO = 0;
t.REPLACE = 7681;
t.INCR = 7682;
t.DECR = 7683;
t.INVERT = 5386;
t.INCR_WRAP = 34055;
t.DECR_WRAP = 34056;
t.TEXTURE_CLAMP_ADDRESSMODE = 0;
t.TEXTURE_WRAP_ADDRESSMODE = 1;
t.TEXTURE_MIRROR_ADDRESSMODE = 2;
t.TEXTURE_CREATIONFLAG_STORAGE = 1;
t.TEXTUREFORMAT_ALPHA = 0;
t.TEXTUREFORMAT_LUMINANCE = 1;
t.TEXTUREFORMAT_LUMINANCE_ALPHA = 2;
t.TEXTUREFORMAT_RGB = 4;
t.TEXTUREFORMAT_RGBA = 5;
t.TEXTUREFORMAT_RED = 6;
t.TEXTUREFORMAT_R = 6;
t.TEXTUREFORMAT_RG = 7;
t.TEXTUREFORMAT_RED_INTEGER = 8;
t.TEXTUREFORMAT_R_INTEGER = 8;
t.TEXTUREFORMAT_RG_INTEGER = 9;
t.TEXTUREFORMAT_RGB_INTEGER = 10;
t.TEXTUREFORMAT_RGBA_INTEGER = 11;
t.TEXTUREFORMAT_BGRA = 12;
t.TEXTUREFORMAT_DEPTH24_STENCIL8 = 13;
t.TEXTUREFORMAT_DEPTH32_FLOAT = 14;
t.TEXTUREFORMAT_DEPTH16 = 15;
t.TEXTUREFORMAT_DEPTH24 = 16;
t.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 = 17;
t.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8 = 18;
t.TEXTUREFORMAT_STENCIL8 = 19;
t.TEXTUREFORMAT_UNDEFINED = 4294967295;
t.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM = 36492;
t.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_BPTC_UNORM = 36493;
t.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT = 36495;
t.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT = 36494;
t.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5 = 33779;
t.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = 35919;
t.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3 = 33778;
t.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT = 35918;
t.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1 = 33777;
t.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1 = 33776;
t.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = 35917;
t.TEXTUREFORMAT_COMPRESSED_SRGB_S3TC_DXT1_EXT = 35916;
t.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4 = 37808;
t.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = 37840;
t.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL = 36196;
t.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2 = 37492;
t.TEXTUREFORMAT_COMPRESSED_SRGB8_ETC2 = 37493;
t.TEXTUREFORMAT_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37494;
t.TEXTUREFORMAT_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37495;
t.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC = 37496;
t.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = 37497;
t.TEXTURETYPE_UNSIGNED_BYTE = 0;
t.TEXTURETYPE_UNSIGNED_INT = 0;
t.TEXTURETYPE_FLOAT = 1;
t.TEXTURETYPE_HALF_FLOAT = 2;
t.TEXTURETYPE_BYTE = 3;
t.TEXTURETYPE_SHORT = 4;
t.TEXTURETYPE_UNSIGNED_SHORT = 5;
t.TEXTURETYPE_INT = 6;
t.TEXTURETYPE_UNSIGNED_INTEGER = 7;
t.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = 8;
t.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = 9;
t.TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = 10;
t.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = 11;
t.TEXTURETYPE_UNSIGNED_INT_24_8 = 12;
t.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = 13;
t.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = 14;
t.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = 15;
t.TEXTURETYPE_UNDEFINED = 16;
t.TEXTURE_2D = 3553;
t.TEXTURE_2D_ARRAY = 35866;
t.TEXTURE_CUBE_MAP = 34067;
t.TEXTURE_CUBE_MAP_ARRAY = 3735928559;
t.TEXTURE_3D = 32879;
t.TEXTURE_NEAREST_SAMPLINGMODE = 1;
t.TEXTURE_NEAREST_NEAREST = 1;
t.TEXTURE_BILINEAR_SAMPLINGMODE = 2;
t.TEXTURE_LINEAR_LINEAR = 2;
t.TEXTURE_TRILINEAR_SAMPLINGMODE = 3;
t.TEXTURE_LINEAR_LINEAR_MIPLINEAR = 3;
t.TEXTURE_NEAREST_NEAREST_MIPNEAREST = 4;
t.TEXTURE_NEAREST_LINEAR_MIPNEAREST = 5;
t.TEXTURE_NEAREST_LINEAR_MIPLINEAR = 6;
t.TEXTURE_NEAREST_LINEAR = 7;
t.TEXTURE_NEAREST_NEAREST_MIPLINEAR = 8;
t.TEXTURE_LINEAR_NEAREST_MIPNEAREST = 9;
t.TEXTURE_LINEAR_NEAREST_MIPLINEAR = 10;
t.TEXTURE_LINEAR_LINEAR_MIPNEAREST = 11;
t.TEXTURE_LINEAR_NEAREST = 12;
t.TEXTURE_EXPLICIT_MODE = 0;
t.TEXTURE_SPHERICAL_MODE = 1;
t.TEXTURE_PLANAR_MODE = 2;
t.TEXTURE_CUBIC_MODE = 3;
t.TEXTURE_PROJECTION_MODE = 4;
t.TEXTURE_SKYBOX_MODE = 5;
t.TEXTURE_INVCUBIC_MODE = 6;
t.TEXTURE_EQUIRECTANGULAR_MODE = 7;
t.TEXTURE_FIXED_EQUIRECTANGULAR_MODE = 8;
t.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = 9;
t.TEXTURE_FILTERING_QUALITY_OFFLINE = 4096;
t.TEXTURE_FILTERING_QUALITY_HIGH = 64;
t.TEXTURE_FILTERING_QUALITY_MEDIUM = 16;
t.TEXTURE_FILTERING_QUALITY_LOW = 8;
t.SCALEMODE_FLOOR = 1;
t.SCALEMODE_NEAREST = 2;
t.SCALEMODE_CEILING = 3;
t.MATERIAL_TextureDirtyFlag = 1;
t.MATERIAL_LightDirtyFlag = 2;
t.MATERIAL_FresnelDirtyFlag = 4;
t.MATERIAL_AttributesDirtyFlag = 8;
t.MATERIAL_MiscDirtyFlag = 16;
t.MATERIAL_PrePassDirtyFlag = 32;
t.MATERIAL_AllDirtyFlag = 63;
t.MATERIAL_TriangleFillMode = 0;
t.MATERIAL_WireFrameFillMode = 1;
t.MATERIAL_PointFillMode = 2;
t.MATERIAL_PointListDrawMode = 3;
t.MATERIAL_LineListDrawMode = 4;
t.MATERIAL_LineLoopDrawMode = 5;
t.MATERIAL_LineStripDrawMode = 6;
t.MATERIAL_TriangleStripDrawMode = 7;
t.MATERIAL_TriangleFanDrawMode = 8;
t.MATERIAL_ClockWiseSideOrientation = 0;
t.MATERIAL_CounterClockWiseSideOrientation = 1;
t.ACTION_NothingTrigger = 0;
t.ACTION_OnPickTrigger = 1;
t.ACTION_OnLeftPickTrigger = 2;
t.ACTION_OnRightPickTrigger = 3;
t.ACTION_OnCenterPickTrigger = 4;
t.ACTION_OnPickDownTrigger = 5;
t.ACTION_OnDoublePickTrigger = 6;
t.ACTION_OnPickUpTrigger = 7;
t.ACTION_OnPickOutTrigger = 16;
t.ACTION_OnLongPressTrigger = 8;
t.ACTION_OnPointerOverTrigger = 9;
t.ACTION_OnPointerOutTrigger = 10;
t.ACTION_OnEveryFrameTrigger = 11;
t.ACTION_OnIntersectionEnterTrigger = 12;
t.ACTION_OnIntersectionExitTrigger = 13;
t.ACTION_OnKeyDownTrigger = 14;
t.ACTION_OnKeyUpTrigger = 15;
t.PARTICLES_BILLBOARDMODE_Y = 2;
t.PARTICLES_BILLBOARDMODE_ALL = 7;
t.PARTICLES_BILLBOARDMODE_STRETCHED = 8;
t.PARTICLES_BILLBOARDMODE_STRETCHED_LOCAL = 9;
t.MESHES_CULLINGSTRATEGY_STANDARD = 0;
t.MESHES_CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY = 1;
t.MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION = 2;
t.MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY = 3;
t.SCENELOADER_NO_LOGGING = 0;
t.SCENELOADER_MINIMAL_LOGGING = 1;
t.SCENELOADER_SUMMARY_LOGGING = 2;
t.SCENELOADER_DETAILED_LOGGING = 3;
t.PREPASS_IRRADIANCE_TEXTURE_TYPE = 0;
t.PREPASS_POSITION_TEXTURE_TYPE = 1;
t.PREPASS_VELOCITY_TEXTURE_TYPE = 2;
t.PREPASS_REFLECTIVITY_TEXTURE_TYPE = 3;
t.PREPASS_COLOR_TEXTURE_TYPE = 4;
t.PREPASS_DEPTH_TEXTURE_TYPE = 5;
t.PREPASS_NORMAL_TEXTURE_TYPE = 6;
t.PREPASS_ALBEDO_SQRT_TEXTURE_TYPE = 7;
t.BUFFER_CREATIONFLAG_READ = 1;
t.BUFFER_CREATIONFLAG_WRITE = 2;
t.BUFFER_CREATIONFLAG_READWRITE = 3;
t.BUFFER_CREATIONFLAG_UNIFORM = 4;
t.BUFFER_CREATIONFLAG_VERTEX = 8;
t.BUFFER_CREATIONFLAG_INDEX = 16;
t.BUFFER_CREATIONFLAG_STORAGE = 32;
t.RENDERPASS_MAIN = 0;
t.INPUT_ALT_KEY = 18;
t.INPUT_CTRL_KEY = 17;
t.INPUT_META_KEY1 = 91;
t.INPUT_META_KEY2 = 92;
t.INPUT_META_KEY3 = 93;
t.INPUT_SHIFT_KEY = 16;
t.SNAPSHOTRENDERING_STANDARD = 0;
t.SNAPSHOTRENDERING_FAST = 1;
t.PERSPECTIVE_CAMERA = 0;
t.ORTHOGRAPHIC_CAMERA = 1;
t.FOVMODE_VERTICAL_FIXED = 0;
t.FOVMODE_HORIZONTAL_FIXED = 1;
t.RIG_MODE_NONE = 0;
t.RIG_MODE_STEREOSCOPIC_ANAGLYPH = 10;
t.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL = 11;
t.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED = 12;
t.RIG_MODE_STEREOSCOPIC_OVERUNDER = 13;
t.RIG_MODE_STEREOSCOPIC_INTERLACED = 14;
t.RIG_MODE_VR = 20;
t.RIG_MODE_CUSTOM = 22;
t.MAX_SUPPORTED_UV_SETS = 6;
t.GL_ALPHA_EQUATION_ADD = 32774;
t.GL_ALPHA_EQUATION_MIN = 32775;
t.GL_ALPHA_EQUATION_MAX = 32776;
t.GL_ALPHA_EQUATION_SUBTRACT = 32778;
t.GL_ALPHA_EQUATION_REVERSE_SUBTRACT = 32779;
t.GL_ALPHA_FUNCTION_SRC = 768;
t.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR = 769;
t.GL_ALPHA_FUNCTION_SRC_ALPHA = 770;
t.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA = 771;
t.GL_ALPHA_FUNCTION_DST_ALPHA = 772;
t.GL_ALPHA_FUNCTION_ONE_MINUS_DST_ALPHA = 773;
t.GL_ALPHA_FUNCTION_DST_COLOR = 774;
t.GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR = 775;
t.GL_ALPHA_FUNCTION_SRC_ALPHA_SATURATED = 776;
t.GL_ALPHA_FUNCTION_CONSTANT_COLOR = 32769;
t.GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_COLOR = 32770;
t.GL_ALPHA_FUNCTION_CONSTANT_ALPHA = 32771;
t.GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_ALPHA = 32772;
t.SnippetUrl = "https://snippet.babylonjs.com";
t.FOGMODE_NONE = 0;
t.FOGMODE_EXP = 1;
t.FOGMODE_EXP2 = 2;
t.FOGMODE_LINEAR = 3;
t.BYTE = 5120;
t.UNSIGNED_BYTE = 5121;
t.SHORT = 5122;
t.UNSIGNED_SHORT = 5123;
t.INT = 5124;
t.UNSIGNED_INT = 5125;
t.FLOAT = 5126;
t.PositionKind = "position";
t.NormalKind = "normal";
t.TangentKind = "tangent";
t.UVKind = "uv";
t.UV2Kind = "uv2";
t.UV3Kind = "uv3";
t.UV4Kind = "uv4";
t.UV5Kind = "uv5";
t.UV6Kind = "uv6";
t.ColorKind = "color";
t.ColorInstanceKind = "instanceColor";
t.MatricesIndicesKind = "matricesIndices";
t.MatricesWeightsKind = "matricesWeights";
t.MatricesIndicesExtraKind = "matricesIndicesExtra";
t.MatricesWeightsExtraKind = "matricesWeightsExtra";
class I {
  /**
   * Gets or sets the influence of this target (ie. its weight in the overall morphing)
   */
  get influence() {
    return this._influence;
  }
  set influence(e) {
    if (this._influence === e)
      return;
    const s = this._influence;
    this._influence = e, this.onInfluenceChanged.hasObservers() && this.onInfluenceChanged.notifyObservers(s === 0 || e === 0);
  }
  /**
   * Gets or sets the animation properties override
   */
  get animationPropertiesOverride() {
    return !this._animationPropertiesOverride && this._scene ? this._scene.animationPropertiesOverride : this._animationPropertiesOverride;
  }
  set animationPropertiesOverride(e) {
    this._animationPropertiesOverride = e;
  }
  /**
   * Creates a new MorphTarget
   * @param name defines the name of the target
   * @param influence defines the influence to use
   * @param scene defines the scene the morphtarget belongs to
   */
  constructor(e, s = 0, a = null) {
    this.name = e, this.animations = [], this._positions = null, this._normals = null, this._tangents = null, this._uvs = null, this._uniqueId = 0, this.onInfluenceChanged = new S(), this._onDataLayoutChanged = new S(), this._animationPropertiesOverride = null, this._scene = a || u.LastCreatedScene, this.influence = s, this._scene && (this._uniqueId = this._scene.getUniqueId());
  }
  /**
   * Gets the unique ID of this manager
   */
  get uniqueId() {
    return this._uniqueId;
  }
  /**
   * Gets a boolean defining if the target contains position data
   */
  get hasPositions() {
    return !!this._positions;
  }
  /**
   * Gets a boolean defining if the target contains normal data
   */
  get hasNormals() {
    return !!this._normals;
  }
  /**
   * Gets a boolean defining if the target contains tangent data
   */
  get hasTangents() {
    return !!this._tangents;
  }
  /**
   * Gets a boolean defining if the target contains texture coordinates data
   */
  get hasUVs() {
    return !!this._uvs;
  }
  /**
   * Affects position data to this target
   * @param data defines the position data to use
   */
  setPositions(e) {
    const s = this.hasPositions;
    this._positions = e, s !== this.hasPositions && this._onDataLayoutChanged.notifyObservers(void 0);
  }
  /**
   * Gets the position data stored in this target
   * @returns a FloatArray containing the position data (or null if not present)
   */
  getPositions() {
    return this._positions;
  }
  /**
   * Affects normal data to this target
   * @param data defines the normal data to use
   */
  setNormals(e) {
    const s = this.hasNormals;
    this._normals = e, s !== this.hasNormals && this._onDataLayoutChanged.notifyObservers(void 0);
  }
  /**
   * Gets the normal data stored in this target
   * @returns a FloatArray containing the normal data (or null if not present)
   */
  getNormals() {
    return this._normals;
  }
  /**
   * Affects tangent data to this target
   * @param data defines the tangent data to use
   */
  setTangents(e) {
    const s = this.hasTangents;
    this._tangents = e, s !== this.hasTangents && this._onDataLayoutChanged.notifyObservers(void 0);
  }
  /**
   * Gets the tangent data stored in this target
   * @returns a FloatArray containing the tangent data (or null if not present)
   */
  getTangents() {
    return this._tangents;
  }
  /**
   * Affects texture coordinates data to this target
   * @param data defines the texture coordinates data to use
   */
  setUVs(e) {
    const s = this.hasUVs;
    this._uvs = e, s !== this.hasUVs && this._onDataLayoutChanged.notifyObservers(void 0);
  }
  /**
   * Gets the texture coordinates data stored in this target
   * @returns a FloatArray containing the texture coordinates data (or null if not present)
   */
  getUVs() {
    return this._uvs;
  }
  /**
   * Clone the current target
   * @returns a new MorphTarget
   */
  clone() {
    const e = f.Clone(() => new I(this.name, this.influence, this._scene), this);
    return e._positions = this._positions, e._normals = this._normals, e._tangents = this._tangents, e._uvs = this._uvs, e;
  }
  /**
   * Serializes the current target into a Serialization object
   * @returns the serialized object
   */
  serialize() {
    const e = {};
    return e.name = this.name, e.influence = this.influence, e.positions = Array.prototype.slice.call(this.getPositions()), this.id != null && (e.id = this.id), this.hasNormals && (e.normals = Array.prototype.slice.call(this.getNormals())), this.hasTangents && (e.tangents = Array.prototype.slice.call(this.getTangents())), this.hasUVs && (e.uvs = Array.prototype.slice.call(this.getUVs())), f.AppendSerializedAnimations(this, e), e;
  }
  /**
   * Returns the string "MorphTarget"
   * @returns "MorphTarget"
   */
  getClassName() {
    return "MorphTarget";
  }
  // Statics
  /**
   * Creates a new target from serialized data
   * @param serializationObject defines the serialized data to use
   * @param scene defines the hosting scene
   * @returns a new MorphTarget
   */
  static Parse(e, s) {
    const a = new I(e.name, e.influence);
    if (a.setPositions(e.positions), e.id != null && (a.id = e.id), e.normals && a.setNormals(e.normals), e.tangents && a.setTangents(e.tangents), e.uvs && a.setUVs(e.uvs), e.animations) {
      for (let r = 0; r < e.animations.length; r++) {
        const T = e.animations[r], E = c("BABYLON.Animation");
        E && a.animations.push(E.Parse(T));
      }
      e.autoAnimate && s && s.beginAnimation(a, e.autoAnimateFrom, e.autoAnimateTo, e.autoAnimateLoop, e.autoAnimateSpeed || 1);
    }
    return a;
  }
  /**
   * Creates a MorphTarget from mesh data
   * @param mesh defines the source mesh
   * @param name defines the name to use for the new target
   * @param influence defines the influence to attach to the target
   * @returns a new MorphTarget
   */
  static FromMesh(e, s, a) {
    s || (s = e.name);
    const r = new I(s, a, e.getScene());
    return r.setPositions(e.getVerticesData(i.PositionKind)), e.isVerticesDataPresent(i.NormalKind) && r.setNormals(e.getVerticesData(i.NormalKind)), e.isVerticesDataPresent(i.TangentKind) && r.setTangents(e.getVerticesData(i.TangentKind)), e.isVerticesDataPresent(i.UVKind) && r.setUVs(e.getVerticesData(i.UVKind)), r;
  }
}
O([
  D()
], I.prototype, "id", void 0);
_.prototype.thinInstanceAdd = function(n, e = !0) {
  if (!this.getScene().getEngine().getCaps().instancedArrays)
    return N.Error("Thin Instances are not supported on this device as Instanced Array extension not supported"), -1;
  this._thinInstanceUpdateBufferSize("matrix", Array.isArray(n) ? n.length : 1);
  const s = this._thinInstanceDataStorage.instancesCount;
  if (Array.isArray(n))
    for (let a = 0; a < n.length; ++a)
      this.thinInstanceSetMatrixAt(this._thinInstanceDataStorage.instancesCount++, n[a], a === n.length - 1 && e);
  else
    this.thinInstanceSetMatrixAt(this._thinInstanceDataStorage.instancesCount++, n, e);
  return s;
};
_.prototype.thinInstanceAddSelf = function(n = !0) {
  return this.thinInstanceAdd(R.IdentityReadOnly, n);
};
_.prototype.thinInstanceRegisterAttribute = function(n, e) {
  n === i.ColorKind && (n = i.ColorInstanceKind), this.removeVerticesData(n), this._thinInstanceInitializeUserStorage(), this._userThinInstanceBuffersStorage.strides[n] = e, this._userThinInstanceBuffersStorage.sizes[n] = e * Math.max(32, this._thinInstanceDataStorage.instancesCount), this._userThinInstanceBuffersStorage.data[n] = new Float32Array(this._userThinInstanceBuffersStorage.sizes[n]), this._userThinInstanceBuffersStorage.vertexBuffers[n] = new i(this.getEngine(), this._userThinInstanceBuffersStorage.data[n], n, !0, !1, e, !0), this.setVerticesBuffer(this._userThinInstanceBuffersStorage.vertexBuffers[n]);
};
_.prototype.thinInstanceSetMatrixAt = function(n, e, s = !0) {
  if (!this._thinInstanceDataStorage.matrixData || n >= this._thinInstanceDataStorage.instancesCount)
    return !1;
  const a = this._thinInstanceDataStorage.matrixData;
  return e.copyToArray(a, n * 16), this._thinInstanceDataStorage.worldMatrices && (this._thinInstanceDataStorage.worldMatrices[n] = e), s && (this.thinInstanceBufferUpdated("matrix"), this.doNotSyncBoundingInfo || this.thinInstanceRefreshBoundingInfo(!1)), !0;
};
_.prototype.thinInstanceSetAttributeAt = function(n, e, s, a = !0) {
  return n === i.ColorKind && (n = i.ColorInstanceKind), !this._userThinInstanceBuffersStorage || !this._userThinInstanceBuffersStorage.data[n] || e >= this._thinInstanceDataStorage.instancesCount ? !1 : (this._thinInstanceUpdateBufferSize(n, 0), this._userThinInstanceBuffersStorage.data[n].set(s, e * this._userThinInstanceBuffersStorage.strides[n]), a && this.thinInstanceBufferUpdated(n), !0);
};
Object.defineProperty(_.prototype, "thinInstanceCount", {
  get: function() {
    return this._thinInstanceDataStorage.instancesCount;
  },
  set: function(n) {
    const e = this._thinInstanceDataStorage.matrixData ?? this.source?._thinInstanceDataStorage.matrixData, s = e ? e.length / 16 : 0;
    n <= s && (this._thinInstanceDataStorage.instancesCount = n);
  },
  enumerable: !0,
  configurable: !0
});
_.prototype._thinInstanceCreateMatrixBuffer = function(n, e, s = !0) {
  const a = new g(this.getEngine(), e, !s, 16, !1, !0);
  for (let r = 0; r < 4; r++)
    this.setVerticesBuffer(a.createVertexBuffer(n + r, r * 4, 4));
  return a;
};
_.prototype.thinInstanceSetBuffer = function(n, e, s = 0, a = !0) {
  s = s || 16, n === "matrix" ? (this._thinInstanceDataStorage.matrixBuffer?.dispose(), this._thinInstanceDataStorage.matrixBuffer = null, this._thinInstanceDataStorage.matrixBufferSize = e ? e.length : 32 * s, this._thinInstanceDataStorage.matrixData = e, this._thinInstanceDataStorage.worldMatrices = null, e !== null ? (this._thinInstanceDataStorage.instancesCount = e.length / s, this._thinInstanceDataStorage.matrixBuffer = this._thinInstanceCreateMatrixBuffer("world", e, a), this.doNotSyncBoundingInfo || this.thinInstanceRefreshBoundingInfo(!1)) : (this._thinInstanceDataStorage.instancesCount = 0, this.doNotSyncBoundingInfo || this.refreshBoundingInfo())) : n === "previousMatrix" ? (this._thinInstanceDataStorage.previousMatrixBuffer?.dispose(), this._thinInstanceDataStorage.previousMatrixBuffer = null, this._thinInstanceDataStorage.previousMatrixData = e, e !== null && (this._thinInstanceDataStorage.previousMatrixBuffer = this._thinInstanceCreateMatrixBuffer("previousWorld", e, a))) : (n === i.ColorKind && (n = i.ColorInstanceKind), e === null ? this._userThinInstanceBuffersStorage?.data[n] && (this.removeVerticesData(n), delete this._userThinInstanceBuffersStorage.data[n], delete this._userThinInstanceBuffersStorage.strides[n], delete this._userThinInstanceBuffersStorage.sizes[n], delete this._userThinInstanceBuffersStorage.vertexBuffers[n]) : (this._thinInstanceInitializeUserStorage(), this._userThinInstanceBuffersStorage.data[n] = e, this._userThinInstanceBuffersStorage.strides[n] = s, this._userThinInstanceBuffersStorage.sizes[n] = e.length, this._userThinInstanceBuffersStorage.vertexBuffers[n] = new i(this.getEngine(), e, n, !a, !1, s, !0), this.setVerticesBuffer(this._userThinInstanceBuffersStorage.vertexBuffers[n])));
};
_.prototype.thinInstanceBufferUpdated = function(n) {
  n === "matrix" ? (this.thinInstanceAllowAutomaticStaticBufferRecreation && this._thinInstanceDataStorage.matrixBuffer && !this._thinInstanceDataStorage.matrixBuffer.isUpdatable() && this._thinInstanceRecreateBuffer(n), this._thinInstanceDataStorage.matrixBuffer?.updateDirectly(this._thinInstanceDataStorage.matrixData, 0, this._thinInstanceDataStorage.instancesCount)) : n === "previousMatrix" ? (this.thinInstanceAllowAutomaticStaticBufferRecreation && this._thinInstanceDataStorage.previousMatrixBuffer && !this._thinInstanceDataStorage.previousMatrixBuffer.isUpdatable() && this._thinInstanceRecreateBuffer(n), this._thinInstanceDataStorage.previousMatrixBuffer?.updateDirectly(this._thinInstanceDataStorage.previousMatrixData, 0, this._thinInstanceDataStorage.instancesCount)) : (n === i.ColorKind && (n = i.ColorInstanceKind), this._userThinInstanceBuffersStorage?.vertexBuffers[n] && (this.thinInstanceAllowAutomaticStaticBufferRecreation && !this._userThinInstanceBuffersStorage.vertexBuffers[n].isUpdatable() && this._thinInstanceRecreateBuffer(n), this._userThinInstanceBuffersStorage.vertexBuffers[n].updateDirectly(this._userThinInstanceBuffersStorage.data[n], 0)));
};
_.prototype.thinInstancePartialBufferUpdate = function(n, e, s) {
  n === "matrix" ? this._thinInstanceDataStorage.matrixBuffer && this._thinInstanceDataStorage.matrixBuffer.updateDirectly(e, s) : (n === i.ColorKind && (n = i.ColorInstanceKind), this._userThinInstanceBuffersStorage?.vertexBuffers[n] && this._userThinInstanceBuffersStorage.vertexBuffers[n].updateDirectly(e, s));
};
_.prototype.thinInstanceGetWorldMatrices = function() {
  if (!this._thinInstanceDataStorage.matrixData || !this._thinInstanceDataStorage.matrixBuffer)
    return [];
  const n = this._thinInstanceDataStorage.matrixData;
  if (!this._thinInstanceDataStorage.worldMatrices) {
    this._thinInstanceDataStorage.worldMatrices = [];
    for (let e = 0; e < this._thinInstanceDataStorage.instancesCount; ++e)
      this._thinInstanceDataStorage.worldMatrices[e] = R.FromArray(n, e * 16);
  }
  return this._thinInstanceDataStorage.worldMatrices;
};
_.prototype.thinInstanceRefreshBoundingInfo = function(n = !1, e = !1, s = !1) {
  if (!this._thinInstanceDataStorage.matrixData || !this._thinInstanceDataStorage.matrixBuffer)
    return;
  const a = this._thinInstanceDataStorage.boundingVectors;
  if (n || !this.rawBoundingInfo) {
    a.length = 0, this.refreshBoundingInfo(e, s);
    const E = this.getBoundingInfo();
    this.rawBoundingInfo = new L(E.minimum, E.maximum);
  }
  const r = this.getBoundingInfo(), T = this._thinInstanceDataStorage.matrixData;
  if (a.length === 0)
    for (let E = 0; E < r.boundingBox.vectors.length; ++E)
      a.push(r.boundingBox.vectors[E].clone());
  A.Vector3[0].setAll(Number.POSITIVE_INFINITY), A.Vector3[1].setAll(Number.NEGATIVE_INFINITY);
  for (let E = 0; E < this._thinInstanceDataStorage.instancesCount; ++E) {
    R.FromArrayToRef(T, E * 16, A.Matrix[0]);
    for (let o = 0; o < a.length; ++o)
      U.TransformCoordinatesToRef(a[o], A.Matrix[0], A.Vector3[2]), A.Vector3[0].minimizeInPlace(A.Vector3[2]), A.Vector3[1].maximizeInPlace(A.Vector3[2]);
  }
  r.reConstruct(A.Vector3[0], A.Vector3[1]), this._updateBoundingInfo();
};
_.prototype._thinInstanceRecreateBuffer = function(n, e = !0) {
  n === "matrix" ? (this._thinInstanceDataStorage.matrixBuffer?.dispose(), this._thinInstanceDataStorage.matrixBuffer = this._thinInstanceCreateMatrixBuffer("world", this._thinInstanceDataStorage.matrixData, e)) : n === "previousMatrix" ? this._scene.needsPreviousWorldMatrices && (this._thinInstanceDataStorage.previousMatrixBuffer?.dispose(), this._thinInstanceDataStorage.previousMatrixBuffer = this._thinInstanceCreateMatrixBuffer("previousWorld", this._thinInstanceDataStorage.previousMatrixData ?? this._thinInstanceDataStorage.matrixData, e)) : (n === i.ColorKind && (n = i.ColorInstanceKind), this._userThinInstanceBuffersStorage.vertexBuffers[n]?.dispose(), this._userThinInstanceBuffersStorage.vertexBuffers[n] = new i(this.getEngine(), this._userThinInstanceBuffersStorage.data[n], n, !e, !1, this._userThinInstanceBuffersStorage.strides[n], !0), this.setVerticesBuffer(this._userThinInstanceBuffersStorage.vertexBuffers[n]));
};
_.prototype._thinInstanceUpdateBufferSize = function(n, e = 1) {
  n === i.ColorKind && (n = i.ColorInstanceKind);
  const s = n === "matrix";
  if (!s && (!this._userThinInstanceBuffersStorage || !this._userThinInstanceBuffersStorage.strides[n]))
    return;
  const a = s ? 16 : this._userThinInstanceBuffersStorage.strides[n], r = s ? this._thinInstanceDataStorage.matrixBufferSize : this._userThinInstanceBuffersStorage.sizes[n];
  let T = s ? this._thinInstanceDataStorage.matrixData : this._userThinInstanceBuffersStorage.data[n];
  const E = (this._thinInstanceDataStorage.instancesCount + e) * a;
  let o = r;
  for (; o < E; )
    o *= 2;
  if (!T || r != o) {
    if (!T)
      T = new Float32Array(o);
    else {
      const h = new Float32Array(o);
      h.set(T, 0), T = h;
    }
    s ? (this._thinInstanceDataStorage.matrixBuffer?.dispose(), this._thinInstanceDataStorage.matrixBuffer = this._thinInstanceCreateMatrixBuffer("world", T, !1), this._thinInstanceDataStorage.matrixData = T, this._thinInstanceDataStorage.matrixBufferSize = o, this._scene.needsPreviousWorldMatrices && !this._thinInstanceDataStorage.previousMatrixData && (this._thinInstanceDataStorage.previousMatrixBuffer?.dispose(), this._thinInstanceDataStorage.previousMatrixBuffer = this._thinInstanceCreateMatrixBuffer("previousWorld", T, !1))) : (this._userThinInstanceBuffersStorage.vertexBuffers[n]?.dispose(), this._userThinInstanceBuffersStorage.data[n] = T, this._userThinInstanceBuffersStorage.sizes[n] = o, this._userThinInstanceBuffersStorage.vertexBuffers[n] = new i(this.getEngine(), T, n, !0, !1, a, !0), this.setVerticesBuffer(this._userThinInstanceBuffersStorage.vertexBuffers[n]));
  }
};
_.prototype._thinInstanceInitializeUserStorage = function() {
  this._userThinInstanceBuffersStorage || (this._userThinInstanceBuffersStorage = {
    data: {},
    sizes: {},
    vertexBuffers: {},
    strides: {}
  });
};
_.prototype._disposeThinInstanceSpecificData = function() {
  this._thinInstanceDataStorage?.matrixBuffer && (this._thinInstanceDataStorage.matrixBuffer.dispose(), this._thinInstanceDataStorage.matrixBuffer = null);
};
export {
  t as C,
  I as M
};
//# sourceMappingURL=thinInstanceMesh-DXRkqCn6.js.map
