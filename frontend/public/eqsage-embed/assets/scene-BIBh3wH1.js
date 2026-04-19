import { C as x, b as m, c as b, O as _, ar as te, as as Pe, ab as Me, ak as Ce, V, i as O, a as y, g as F, T as S, at as H, d as G, M as me, _ as k, ai as Ee, h as ie, a8 as Te, P as ye, L as $, e as se, au as Re, av as Oe, aw as Ae } from "./embed-entry-BKE21f6Q.js";
import { a as L, S as Q } from "./smartArray-BXymNR-c.js";
import { S as I } from "./decorators.serialization-DfmppPDN.js";
import { b as De, P as ke, a as Se } from "./imageProcessingConfiguration.functions-BktKXnya.js";
import { U as we } from "./uniformBuffer-LDIehZve.js";
import { R as xe, P as re } from "./renderingManager-D3DWmt5q.js";
import { PointerEventTypes as v, PointerInfo as w, PointerInfoPre as Ie } from "./pointerEvents-BZWgZsXK.js";
import { P as K } from "./perfCounter-BsJBc9Ap.js";
import { F as ne } from "./math.frustum-CpyfUSru.js";
import { L as Be } from "./lightConstants-BXeaZQS1.js";
class ae {
  constructor() {
    this._count = 0, this._data = {};
  }
  /**
   * This will clear this dictionary and copy the content from the 'source' one.
   * If the T value is a custom object, it won't be copied/cloned, the same object will be used
   * @param source the dictionary to take the content from and copy to this dictionary
   */
  copyFrom(e) {
    this.clear(), e.forEach((t, i) => this.add(t, i));
  }
  /**
   * Get a value based from its key
   * @param key the given key to get the matching value from
   * @returns the value if found, otherwise undefined is returned
   */
  get(e) {
    const t = this._data[e];
    if (t !== void 0)
      return t;
  }
  /**
   * Get a value from its key or add it if it doesn't exist.
   * This method will ensure you that a given key/data will be present in the dictionary.
   * @param key the given key to get the matching value from
   * @param factory the factory that will create the value if the key is not present in the dictionary.
   * The factory will only be invoked if there's no data for the given key.
   * @returns the value corresponding to the key.
   */
  getOrAddWithFactory(e, t) {
    let i = this.get(e);
    return i !== void 0 || (i = t(e), i && this.add(e, i)), i;
  }
  /**
   * Get a value from its key if present in the dictionary otherwise add it
   * @param key the key to get the value from
   * @param val if there's no such key/value pair in the dictionary add it with this value
   * @returns the value corresponding to the key
   */
  getOrAdd(e, t) {
    const i = this.get(e);
    return i !== void 0 ? i : (this.add(e, t), t);
  }
  /**
   * Check if there's a given key in the dictionary
   * @param key the key to check for
   * @returns true if the key is present, false otherwise
   */
  contains(e) {
    return this._data[e] !== void 0;
  }
  /**
   * Add a new key and its corresponding value
   * @param key the key to add
   * @param value the value corresponding to the key
   * @returns true if the operation completed successfully, false if we couldn't insert the key/value because there was already this key in the dictionary
   */
  add(e, t) {
    return this._data[e] !== void 0 ? !1 : (this._data[e] = t, ++this._count, !0);
  }
  /**
   * Update a specific value associated to a key
   * @param key defines the key to use
   * @param value defines the value to store
   * @returns true if the value was updated (or false if the key was not found)
   */
  set(e, t) {
    return this._data[e] === void 0 ? !1 : (this._data[e] = t, !0);
  }
  /**
   * Get the element of the given key and remove it from the dictionary
   * @param key defines the key to search
   * @returns the value associated with the key or null if not found
   */
  getAndRemove(e) {
    const t = this.get(e);
    return t !== void 0 ? (delete this._data[e], --this._count, t) : null;
  }
  /**
   * Remove a key/value from the dictionary.
   * @param key the key to remove
   * @returns true if the item was successfully deleted, false if no item with such key exist in the dictionary
   */
  remove(e) {
    return this.contains(e) ? (delete this._data[e], --this._count, !0) : !1;
  }
  /**
   * Clear the whole content of the dictionary
   */
  clear() {
    this._data = {}, this._count = 0;
  }
  /**
   * Gets the current count
   */
  get count() {
    return this._count;
  }
  /**
   * Execute a callback on each key/val of the dictionary.
   * Note that you can remove any element in this dictionary in the callback implementation
   * @param callback the callback to execute on a given key/value pair
   */
  forEach(e) {
    for (const t in this._data) {
      const i = this._data[t];
      e(t, i);
    }
  }
  /**
   * Execute a callback on every occurrence of the dictionary until it returns a valid TRes object.
   * If the callback returns null or undefined the method will iterate to the next key/value pair
   * Note that you can remove any element in this dictionary in the callback implementation
   * @param callback the callback to execute, if it return a valid T instanced object the enumeration will stop and the object will be returned
   * @returns the first item
   */
  first(e) {
    for (const t in this._data) {
      const i = this._data[t], r = e(t, i);
      if (r)
        return r;
    }
    return null;
  }
}
class ee {
  constructor() {
    this.rootNodes = [], this.cameras = [], this.lights = [], this.meshes = [], this.skeletons = [], this.particleSystems = [], this.animations = [], this.animationGroups = [], this.multiMaterials = [], this.materials = [], this.morphTargetManagers = [], this.geometries = [], this.transformNodes = [], this.actionManagers = [], this.textures = [], this._environmentTexture = null, this.postProcesses = [];
  }
  /**
   * Adds a parser in the list of available ones
   * @param name Defines the name of the parser
   * @param parser Defines the parser to add
   */
  static AddParser(e, t) {
    this._BabylonFileParsers[e] = t;
  }
  /**
   * Gets a general parser from the list of available ones
   * @param name Defines the name of the parser
   * @returns the requested parser or null
   */
  static GetParser(e) {
    return this._BabylonFileParsers[e] ? this._BabylonFileParsers[e] : null;
  }
  /**
   * Adds n individual parser in the list of available ones
   * @param name Defines the name of the parser
   * @param parser Defines the parser to add
   */
  static AddIndividualParser(e, t) {
    this._IndividualBabylonFileParsers[e] = t;
  }
  /**
   * Gets an individual parser from the list of available ones
   * @param name Defines the name of the parser
   * @returns the requested parser or null
   */
  static GetIndividualParser(e) {
    return this._IndividualBabylonFileParsers[e] ? this._IndividualBabylonFileParsers[e] : null;
  }
  /**
   * Parser json data and populate both a scene and its associated container object
   * @param jsonData Defines the data to parse
   * @param scene Defines the scene to parse the data for
   * @param container Defines the container attached to the parsing sequence
   * @param rootUrl Defines the root url of the data
   */
  static Parse(e, t, i, r) {
    for (const s in this._BabylonFileParsers)
      Object.prototype.hasOwnProperty.call(this._BabylonFileParsers, s) && this._BabylonFileParsers[s](e, t, i, r);
  }
  /**
   * Texture used in all pbr material as the reflection texture.
   * As in the majority of the scene they are the same (exception for multi room and so on),
   * this is easier to reference from here than from all the materials.
   */
  get environmentTexture() {
    return this._environmentTexture;
  }
  set environmentTexture(e) {
    this._environmentTexture = e;
  }
  /**
   * @returns all meshes, lights, cameras, transformNodes and bones
   */
  getNodes() {
    let e = [];
    return e = e.concat(this.meshes), e = e.concat(this.lights), e = e.concat(this.cameras), e = e.concat(this.transformNodes), this.skeletons.forEach((t) => e = e.concat(t.bones)), e;
  }
}
ee._BabylonFileParsers = {};
ee._IndividualBabylonFileParsers = {};
class M {
  constructor() {
    this._dirty = !0, this._tempColor = new x(0, 0, 0, 0), this._globalCurve = new x(0, 0, 0, 0), this._highlightsCurve = new x(0, 0, 0, 0), this._midtonesCurve = new x(0, 0, 0, 0), this._shadowsCurve = new x(0, 0, 0, 0), this._positiveCurve = new x(0, 0, 0, 0), this._negativeCurve = new x(0, 0, 0, 0), this._globalHue = 30, this._globalDensity = 0, this._globalSaturation = 0, this._globalExposure = 0, this._highlightsHue = 30, this._highlightsDensity = 0, this._highlightsSaturation = 0, this._highlightsExposure = 0, this._midtonesHue = 30, this._midtonesDensity = 0, this._midtonesSaturation = 0, this._midtonesExposure = 0, this._shadowsHue = 30, this._shadowsDensity = 0, this._shadowsSaturation = 0, this._shadowsExposure = 0;
  }
  /**
   * Gets the global Hue value.
   * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
   */
  get globalHue() {
    return this._globalHue;
  }
  /**
   * Sets the global Hue value.
   * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
   */
  set globalHue(e) {
    this._globalHue = e, this._dirty = !0;
  }
  /**
   * Gets the global Density value.
   * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
   * Values less than zero provide a filter of opposite hue.
   */
  get globalDensity() {
    return this._globalDensity;
  }
  /**
   * Sets the global Density value.
   * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
   * Values less than zero provide a filter of opposite hue.
   */
  set globalDensity(e) {
    this._globalDensity = e, this._dirty = !0;
  }
  /**
   * Gets the global Saturation value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
   */
  get globalSaturation() {
    return this._globalSaturation;
  }
  /**
   * Sets the global Saturation value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
   */
  set globalSaturation(e) {
    this._globalSaturation = e, this._dirty = !0;
  }
  /**
   * Gets the global Exposure value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
   */
  get globalExposure() {
    return this._globalExposure;
  }
  /**
   * Sets the global Exposure value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
   */
  set globalExposure(e) {
    this._globalExposure = e, this._dirty = !0;
  }
  /**
   * Gets the highlights Hue value.
   * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
   */
  get highlightsHue() {
    return this._highlightsHue;
  }
  /**
   * Sets the highlights Hue value.
   * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
   */
  set highlightsHue(e) {
    this._highlightsHue = e, this._dirty = !0;
  }
  /**
   * Gets the highlights Density value.
   * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
   * Values less than zero provide a filter of opposite hue.
   */
  get highlightsDensity() {
    return this._highlightsDensity;
  }
  /**
   * Sets the highlights Density value.
   * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
   * Values less than zero provide a filter of opposite hue.
   */
  set highlightsDensity(e) {
    this._highlightsDensity = e, this._dirty = !0;
  }
  /**
   * Gets the highlights Saturation value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
   */
  get highlightsSaturation() {
    return this._highlightsSaturation;
  }
  /**
   * Sets the highlights Saturation value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
   */
  set highlightsSaturation(e) {
    this._highlightsSaturation = e, this._dirty = !0;
  }
  /**
   * Gets the highlights Exposure value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
   */
  get highlightsExposure() {
    return this._highlightsExposure;
  }
  /**
   * Sets the highlights Exposure value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
   */
  set highlightsExposure(e) {
    this._highlightsExposure = e, this._dirty = !0;
  }
  /**
   * Gets the midtones Hue value.
   * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
   */
  get midtonesHue() {
    return this._midtonesHue;
  }
  /**
   * Sets the midtones Hue value.
   * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
   */
  set midtonesHue(e) {
    this._midtonesHue = e, this._dirty = !0;
  }
  /**
   * Gets the midtones Density value.
   * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
   * Values less than zero provide a filter of opposite hue.
   */
  get midtonesDensity() {
    return this._midtonesDensity;
  }
  /**
   * Sets the midtones Density value.
   * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
   * Values less than zero provide a filter of opposite hue.
   */
  set midtonesDensity(e) {
    this._midtonesDensity = e, this._dirty = !0;
  }
  /**
   * Gets the midtones Saturation value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
   */
  get midtonesSaturation() {
    return this._midtonesSaturation;
  }
  /**
   * Sets the midtones Saturation value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
   */
  set midtonesSaturation(e) {
    this._midtonesSaturation = e, this._dirty = !0;
  }
  /**
   * Gets the midtones Exposure value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
   */
  get midtonesExposure() {
    return this._midtonesExposure;
  }
  /**
   * Sets the midtones Exposure value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
   */
  set midtonesExposure(e) {
    this._midtonesExposure = e, this._dirty = !0;
  }
  /**
   * Gets the shadows Hue value.
   * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
   */
  get shadowsHue() {
    return this._shadowsHue;
  }
  /**
   * Sets the shadows Hue value.
   * The hue value is a standard HSB hue in the range [0,360] where 0=red, 120=green and 240=blue. The default value is 30 degrees (orange).
   */
  set shadowsHue(e) {
    this._shadowsHue = e, this._dirty = !0;
  }
  /**
   * Gets the shadows Density value.
   * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
   * Values less than zero provide a filter of opposite hue.
   */
  get shadowsDensity() {
    return this._shadowsDensity;
  }
  /**
   * Sets the shadows Density value.
   * The density value is in range [-100,+100] where 0 means the color filter has no effect and +100 means the color filter has maximum effect.
   * Values less than zero provide a filter of opposite hue.
   */
  set shadowsDensity(e) {
    this._shadowsDensity = e, this._dirty = !0;
  }
  /**
   * Gets the shadows Saturation value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
   */
  get shadowsSaturation() {
    return this._shadowsSaturation;
  }
  /**
   * Sets the shadows Saturation value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase saturation and negative values decrease saturation.
   */
  set shadowsSaturation(e) {
    this._shadowsSaturation = e, this._dirty = !0;
  }
  /**
   * Gets the shadows Exposure value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
   */
  get shadowsExposure() {
    return this._shadowsExposure;
  }
  /**
   * Sets the shadows Exposure value.
   * This is an adjustment value in the range [-100,+100], where the default value of 0.0 makes no adjustment, positive values increase exposure and negative values decrease exposure.
   */
  set shadowsExposure(e) {
    this._shadowsExposure = e, this._dirty = !0;
  }
  /**
   * Returns the class name
   * @returns The class name
   */
  getClassName() {
    return "ColorCurves";
  }
  /**
   * Binds the color curves to the shader.
   * @param colorCurves The color curve to bind
   * @param effect The effect to bind to
   * @param positiveUniform The positive uniform shader parameter
   * @param neutralUniform The neutral uniform shader parameter
   * @param negativeUniform The negative uniform shader parameter
   */
  static Bind(e, t, i = "vCameraColorCurvePositive", r = "vCameraColorCurveNeutral", s = "vCameraColorCurveNegative") {
    e._dirty && (e._dirty = !1, e._getColorGradingDataToRef(e._globalHue, e._globalDensity, e._globalSaturation, e._globalExposure, e._globalCurve), e._getColorGradingDataToRef(e._highlightsHue, e._highlightsDensity, e._highlightsSaturation, e._highlightsExposure, e._tempColor), e._tempColor.multiplyToRef(e._globalCurve, e._highlightsCurve), e._getColorGradingDataToRef(e._midtonesHue, e._midtonesDensity, e._midtonesSaturation, e._midtonesExposure, e._tempColor), e._tempColor.multiplyToRef(e._globalCurve, e._midtonesCurve), e._getColorGradingDataToRef(e._shadowsHue, e._shadowsDensity, e._shadowsSaturation, e._shadowsExposure, e._tempColor), e._tempColor.multiplyToRef(e._globalCurve, e._shadowsCurve), e._highlightsCurve.subtractToRef(e._midtonesCurve, e._positiveCurve), e._midtonesCurve.subtractToRef(e._shadowsCurve, e._negativeCurve)), t && (t.setFloat4(i, e._positiveCurve.r, e._positiveCurve.g, e._positiveCurve.b, e._positiveCurve.a), t.setFloat4(r, e._midtonesCurve.r, e._midtonesCurve.g, e._midtonesCurve.b, e._midtonesCurve.a), t.setFloat4(s, e._negativeCurve.r, e._negativeCurve.g, e._negativeCurve.b, e._negativeCurve.a));
  }
  /**
   * Returns color grading data based on a hue, density, saturation and exposure value.
   * @param hue
   * @param density
   * @param saturation The saturation.
   * @param exposure The exposure.
   * @param result The result data container.
   */
  _getColorGradingDataToRef(e, t, i, r, s) {
    e != null && (e = M._Clamp(e, 0, 360), t = M._Clamp(t, -100, 100), i = M._Clamp(i, -100, 100), r = M._Clamp(r, -100, 100), t = M._ApplyColorGradingSliderNonlinear(t), t *= 0.5, r = M._ApplyColorGradingSliderNonlinear(r), t < 0 && (t *= -1, e = (e + 180) % 360), M._FromHSBToRef(e, t, 50 + 0.25 * r, s), s.scaleToRef(2, s), s.a = 1 + 0.01 * i);
  }
  /**
   * Takes an input slider value and returns an adjusted value that provides extra control near the centre.
   * @param value The input slider value in range [-100,100].
   * @returns Adjusted value.
   */
  static _ApplyColorGradingSliderNonlinear(e) {
    e /= 100;
    let t = Math.abs(e);
    return t = Math.pow(t, 2), e < 0 && (t *= -1), t *= 100, t;
  }
  /**
   * Returns an RGBA Color4 based on Hue, Saturation and Brightness (also referred to as value, HSV).
   * @param hue The hue (H) input.
   * @param saturation The saturation (S) input.
   * @param brightness The brightness (B) input.
   * @param result
   * @result An RGBA color represented as Vector4.
   */
  static _FromHSBToRef(e, t, i, r) {
    let s = M._Clamp(e, 0, 360);
    const a = M._Clamp(t / 100, 0, 1), o = M._Clamp(i / 100, 0, 1);
    if (a === 0)
      r.r = o, r.g = o, r.b = o;
    else {
      s /= 60;
      const h = Math.floor(s), l = s - h, g = o * (1 - a), f = o * (1 - a * l), P = o * (1 - a * (1 - l));
      switch (h) {
        case 0:
          r.r = o, r.g = P, r.b = g;
          break;
        case 1:
          r.r = f, r.g = o, r.b = g;
          break;
        case 2:
          r.r = g, r.g = o, r.b = P;
          break;
        case 3:
          r.r = g, r.g = f, r.b = o;
          break;
        case 4:
          r.r = P, r.g = g, r.b = o;
          break;
        default:
          r.r = o, r.g = g, r.b = f;
          break;
      }
    }
    r.a = 1;
  }
  /**
   * Returns a value clamped between min and max
   * @param value The value to clamp
   * @param min The minimum of value
   * @param max The maximum of value
   * @returns The clamped value.
   */
  static _Clamp(e, t, i) {
    return Math.min(Math.max(e, t), i);
  }
  /**
   * Clones the current color curve instance.
   * @returns The cloned curves
   */
  clone() {
    return I.Clone(() => new M(), this);
  }
  /**
   * Serializes the current color curve instance to a json representation.
   * @returns a JSON representation
   */
  serialize() {
    return I.Serialize(this);
  }
  /**
   * Parses the color curve from a json representation.
   * @param source the JSON source to parse
   * @returns The parsed curves
   */
  static Parse(e) {
    return I.Parse(() => new M(), e, null, null);
  }
}
M.PrepareUniforms = De;
m([
  b()
], M.prototype, "_globalHue", void 0);
m([
  b()
], M.prototype, "_globalDensity", void 0);
m([
  b()
], M.prototype, "_globalSaturation", void 0);
m([
  b()
], M.prototype, "_globalExposure", void 0);
m([
  b()
], M.prototype, "_highlightsHue", void 0);
m([
  b()
], M.prototype, "_highlightsDensity", void 0);
m([
  b()
], M.prototype, "_highlightsSaturation", void 0);
m([
  b()
], M.prototype, "_highlightsExposure", void 0);
m([
  b()
], M.prototype, "_midtonesHue", void 0);
m([
  b()
], M.prototype, "_midtonesDensity", void 0);
m([
  b()
], M.prototype, "_midtonesSaturation", void 0);
m([
  b()
], M.prototype, "_midtonesExposure", void 0);
I._ColorCurvesParser = M.Parse;
class p {
  constructor() {
    this.colorCurves = new M(), this._colorCurvesEnabled = !1, this._colorGradingEnabled = !1, this._colorGradingWithGreenDepth = !0, this._colorGradingBGR = !0, this._exposure = 1, this._toneMappingEnabled = !1, this._toneMappingType = p.TONEMAPPING_STANDARD, this._contrast = 1, this.vignetteStretch = 0, this.vignetteCenterX = 0, this.vignetteCenterY = 0, this.vignetteWeight = 1.5, this.vignetteColor = new x(0, 0, 0, 0), this.vignetteCameraFov = 0.5, this._vignetteBlendMode = p.VIGNETTEMODE_MULTIPLY, this._vignetteEnabled = !1, this._ditheringEnabled = !1, this._ditheringIntensity = 1 / 255, this._skipFinalColorClamp = !1, this._applyByPostProcess = !1, this._isEnabled = !0, this.onUpdateParameters = new _();
  }
  /**
   * Gets whether the color curves effect is enabled.
   */
  get colorCurvesEnabled() {
    return this._colorCurvesEnabled;
  }
  /**
   * Sets whether the color curves effect is enabled.
   */
  set colorCurvesEnabled(e) {
    this._colorCurvesEnabled !== e && (this._colorCurvesEnabled = e, this._updateParameters());
  }
  /**
   * Color grading LUT texture used in the effect if colorGradingEnabled is set to true
   */
  get colorGradingTexture() {
    return this._colorGradingTexture;
  }
  /**
   * Color grading LUT texture used in the effect if colorGradingEnabled is set to true
   */
  set colorGradingTexture(e) {
    this._colorGradingTexture !== e && (this._colorGradingTexture = e, this._updateParameters());
  }
  /**
   * Gets whether the color grading effect is enabled.
   */
  get colorGradingEnabled() {
    return this._colorGradingEnabled;
  }
  /**
   * Sets whether the color grading effect is enabled.
   */
  set colorGradingEnabled(e) {
    this._colorGradingEnabled !== e && (this._colorGradingEnabled = e, this._updateParameters());
  }
  /**
   * Gets whether the color grading effect is using a green depth for the 3d Texture.
   */
  get colorGradingWithGreenDepth() {
    return this._colorGradingWithGreenDepth;
  }
  /**
   * Sets whether the color grading effect is using a green depth for the 3d Texture.
   */
  set colorGradingWithGreenDepth(e) {
    this._colorGradingWithGreenDepth !== e && (this._colorGradingWithGreenDepth = e, this._updateParameters());
  }
  /**
   * Gets whether the color grading texture contains BGR values.
   */
  get colorGradingBGR() {
    return this._colorGradingBGR;
  }
  /**
   * Sets whether the color grading texture contains BGR values.
   */
  set colorGradingBGR(e) {
    this._colorGradingBGR !== e && (this._colorGradingBGR = e, this._updateParameters());
  }
  /**
   * Gets the Exposure used in the effect.
   */
  get exposure() {
    return this._exposure;
  }
  /**
   * Sets the Exposure used in the effect.
   */
  set exposure(e) {
    this._exposure !== e && (this._exposure = e, this._updateParameters());
  }
  /**
   * Gets whether the tone mapping effect is enabled.
   */
  get toneMappingEnabled() {
    return this._toneMappingEnabled;
  }
  /**
   * Sets whether the tone mapping effect is enabled.
   */
  set toneMappingEnabled(e) {
    this._toneMappingEnabled !== e && (this._toneMappingEnabled = e, this._updateParameters());
  }
  /**
   * Gets the type of tone mapping effect.
   */
  get toneMappingType() {
    return this._toneMappingType;
  }
  /**
   * Sets the type of tone mapping effect used in BabylonJS.
   */
  set toneMappingType(e) {
    this._toneMappingType !== e && (this._toneMappingType = e, this._updateParameters());
  }
  /**
   * Gets the contrast used in the effect.
   */
  get contrast() {
    return this._contrast;
  }
  /**
   * Sets the contrast used in the effect.
   */
  set contrast(e) {
    this._contrast !== e && (this._contrast = e, this._updateParameters());
  }
  /**
   * Back Compat: Vignette center Y Offset.
   * @deprecated use vignetteCenterY instead
   */
  get vignetteCentreY() {
    return this.vignetteCenterY;
  }
  set vignetteCentreY(e) {
    this.vignetteCenterY = e;
  }
  /**
   * Back Compat: Vignette center X Offset.
   * @deprecated use vignetteCenterX instead
   */
  get vignetteCentreX() {
    return this.vignetteCenterX;
  }
  set vignetteCentreX(e) {
    this.vignetteCenterX = e;
  }
  /**
   * Gets the vignette blend mode allowing different kind of effect.
   */
  get vignetteBlendMode() {
    return this._vignetteBlendMode;
  }
  /**
   * Sets the vignette blend mode allowing different kind of effect.
   */
  set vignetteBlendMode(e) {
    this._vignetteBlendMode !== e && (this._vignetteBlendMode = e, this._updateParameters());
  }
  /**
   * Gets whether the vignette effect is enabled.
   */
  get vignetteEnabled() {
    return this._vignetteEnabled;
  }
  /**
   * Sets whether the vignette effect is enabled.
   */
  set vignetteEnabled(e) {
    this._vignetteEnabled !== e && (this._vignetteEnabled = e, this._updateParameters());
  }
  /**
   * Gets whether the dithering effect is enabled.
   * The dithering effect can be used to reduce banding.
   */
  get ditheringEnabled() {
    return this._ditheringEnabled;
  }
  /**
   * Sets whether the dithering effect is enabled.
   * The dithering effect can be used to reduce banding.
   */
  set ditheringEnabled(e) {
    this._ditheringEnabled !== e && (this._ditheringEnabled = e, this._updateParameters());
  }
  /**
   * Gets the dithering intensity. 0 is no dithering. Default is 1.0 / 255.0.
   */
  get ditheringIntensity() {
    return this._ditheringIntensity;
  }
  /**
   * Sets the dithering intensity. 0 is no dithering. Default is 1.0 / 255.0.
   */
  set ditheringIntensity(e) {
    this._ditheringIntensity !== e && (this._ditheringIntensity = e, this._updateParameters());
  }
  /**
   * If apply by post process is set to true, setting this to true will skip the final color clamp step in the fragment shader
   * Applies to PBR materials.
   */
  get skipFinalColorClamp() {
    return this._skipFinalColorClamp;
  }
  /**
   * If apply by post process is set to true, setting this to true will skip the final color clamp step in the fragment shader
   * Applies to PBR materials.
   */
  set skipFinalColorClamp(e) {
    this._skipFinalColorClamp !== e && (this._skipFinalColorClamp = e, this._updateParameters());
  }
  /**
   * Gets whether the image processing is applied through a post process or not.
   */
  get applyByPostProcess() {
    return this._applyByPostProcess;
  }
  /**
   * Sets whether the image processing is applied through a post process or not.
   */
  set applyByPostProcess(e) {
    this._applyByPostProcess !== e && (this._applyByPostProcess = e, this._updateParameters());
  }
  /**
   * Gets whether the image processing is enabled or not.
   */
  get isEnabled() {
    return this._isEnabled;
  }
  /**
   * Sets whether the image processing is enabled or not.
   */
  set isEnabled(e) {
    this._isEnabled !== e && (this._isEnabled = e, this._updateParameters());
  }
  /**
   * Method called each time the image processing information changes requires to recompile the effect.
   */
  _updateParameters() {
    this.onUpdateParameters.notifyObservers(this);
  }
  /**
   * Gets the current class name.
   * @returns "ImageProcessingConfiguration"
   */
  getClassName() {
    return "ImageProcessingConfiguration";
  }
  /**
   * Prepare the list of defines associated to the shader.
   * @param defines the list of defines to complete
   * @param forPostProcess Define if we are currently in post process mode or not
   */
  prepareDefines(e, t = !1) {
    if (t !== this.applyByPostProcess || !this._isEnabled) {
      e.VIGNETTE = !1, e.TONEMAPPING = !1, e.TONEMAPPING_ACES = !1, e.CONTRAST = !1, e.EXPOSURE = !1, e.COLORCURVES = !1, e.COLORGRADING = !1, e.COLORGRADING3D = !1, e.DITHER = !1, e.IMAGEPROCESSING = !1, e.SKIPFINALCOLORCLAMP = this.skipFinalColorClamp, e.IMAGEPROCESSINGPOSTPROCESS = this.applyByPostProcess && this._isEnabled;
      return;
    }
    switch (e.VIGNETTE = this.vignetteEnabled, e.VIGNETTEBLENDMODEMULTIPLY = this.vignetteBlendMode === p._VIGNETTEMODE_MULTIPLY, e.VIGNETTEBLENDMODEOPAQUE = !e.VIGNETTEBLENDMODEMULTIPLY, e.TONEMAPPING = this.toneMappingEnabled, this._toneMappingType) {
      case p.TONEMAPPING_ACES:
        e.TONEMAPPING_ACES = !0;
        break;
      default:
        e.TONEMAPPING_ACES = !1;
        break;
    }
    e.CONTRAST = this.contrast !== 1, e.EXPOSURE = this.exposure !== 1, e.COLORCURVES = this.colorCurvesEnabled && !!this.colorCurves, e.COLORGRADING = this.colorGradingEnabled && !!this.colorGradingTexture, e.COLORGRADING ? e.COLORGRADING3D = this.colorGradingTexture.is3D : e.COLORGRADING3D = !1, e.SAMPLER3DGREENDEPTH = this.colorGradingWithGreenDepth, e.SAMPLER3DBGRMAP = this.colorGradingBGR, e.DITHER = this._ditheringEnabled, e.IMAGEPROCESSINGPOSTPROCESS = this.applyByPostProcess, e.SKIPFINALCOLORCLAMP = this.skipFinalColorClamp, e.IMAGEPROCESSING = e.VIGNETTE || e.TONEMAPPING || e.CONTRAST || e.EXPOSURE || e.COLORCURVES || e.COLORGRADING || e.DITHER;
  }
  /**
   * Returns true if all the image processing information are ready.
   * @returns True if ready, otherwise, false
   */
  isReady() {
    return !this.colorGradingEnabled || !this.colorGradingTexture || this.colorGradingTexture.isReady();
  }
  /**
   * Binds the image processing to the shader.
   * @param effect The effect to bind to
   * @param overrideAspectRatio Override the aspect ratio of the effect
   */
  bind(e, t) {
    if (this._colorCurvesEnabled && this.colorCurves && M.Bind(this.colorCurves, e), this._vignetteEnabled || this._ditheringEnabled) {
      const i = 1 / e.getEngine().getRenderWidth(), r = 1 / e.getEngine().getRenderHeight();
      if (e.setFloat2("vInverseScreenSize", i, r), this._ditheringEnabled && e.setFloat("ditherIntensity", 0.5 * this._ditheringIntensity), this._vignetteEnabled) {
        const s = t ?? r / i;
        let a = Math.tan(this.vignetteCameraFov * 0.5), o = a * s;
        const h = Math.sqrt(o * a);
        o = te(o, h, this.vignetteStretch), a = te(a, h, this.vignetteStretch), e.setFloat4("vignetteSettings1", o, a, -o * this.vignetteCenterX, -a * this.vignetteCenterY);
        const l = -2 * this.vignetteWeight;
        e.setFloat4("vignetteSettings2", this.vignetteColor.r, this.vignetteColor.g, this.vignetteColor.b, l);
      }
    }
    if (e.setFloat("exposureLinear", this.exposure), e.setFloat("contrast", this.contrast), this.colorGradingTexture) {
      e.setTexture("txColorTransform", this.colorGradingTexture);
      const i = this.colorGradingTexture.getSize().height;
      e.setFloat4(
        "colorTransformSettings",
        (i - 1) / i,
        // textureScale
        0.5 / i,
        // textureOffset
        i,
        // textureSize
        this.colorGradingTexture.level
        // weight
      );
    }
  }
  /**
   * Clones the current image processing instance.
   * @returns The cloned image processing
   */
  clone() {
    return I.Clone(() => new p(), this);
  }
  /**
   * Serializes the current image processing instance to a json representation.
   * @returns a JSON representation
   */
  serialize() {
    return I.Serialize(this);
  }
  /**
   * Parses the image processing from a json representation.
   * @param source the JSON source to parse
   * @returns The parsed image processing
   */
  static Parse(e) {
    const t = I.Parse(() => new p(), e, null, null);
    return e.vignetteCentreX !== void 0 && (t.vignetteCenterX = e.vignetteCentreX), e.vignetteCentreY !== void 0 && (t.vignetteCenterY = e.vignetteCentreY), t;
  }
  /**
   * Used to apply the vignette as a mix with the pixel color.
   */
  static get VIGNETTEMODE_MULTIPLY() {
    return this._VIGNETTEMODE_MULTIPLY;
  }
  /**
   * Used to apply the vignette as a replacement of the pixel color.
   */
  static get VIGNETTEMODE_OPAQUE() {
    return this._VIGNETTEMODE_OPAQUE;
  }
}
p.TONEMAPPING_STANDARD = 0;
p.TONEMAPPING_ACES = 1;
p.PrepareUniforms = ke;
p.PrepareSamplers = Se;
p._VIGNETTEMODE_MULTIPLY = 0;
p._VIGNETTEMODE_OPAQUE = 1;
m([
  Pe()
], p.prototype, "colorCurves", void 0);
m([
  b()
], p.prototype, "_colorCurvesEnabled", void 0);
m([
  Me("colorGradingTexture")
], p.prototype, "_colorGradingTexture", void 0);
m([
  b()
], p.prototype, "_colorGradingEnabled", void 0);
m([
  b()
], p.prototype, "_colorGradingWithGreenDepth", void 0);
m([
  b()
], p.prototype, "_colorGradingBGR", void 0);
m([
  b()
], p.prototype, "_exposure", void 0);
m([
  b()
], p.prototype, "_toneMappingEnabled", void 0);
m([
  b()
], p.prototype, "_toneMappingType", void 0);
m([
  b()
], p.prototype, "_contrast", void 0);
m([
  b()
], p.prototype, "vignetteStretch", void 0);
m([
  b()
], p.prototype, "vignetteCenterX", void 0);
m([
  b()
], p.prototype, "vignetteCenterY", void 0);
m([
  b()
], p.prototype, "vignetteWeight", void 0);
m([
  Ce()
], p.prototype, "vignetteColor", void 0);
m([
  b()
], p.prototype, "vignetteCameraFov", void 0);
m([
  b()
], p.prototype, "_vignetteBlendMode", void 0);
m([
  b()
], p.prototype, "_vignetteEnabled", void 0);
m([
  b()
], p.prototype, "_ditheringEnabled", void 0);
m([
  b()
], p.prototype, "_ditheringIntensity", void 0);
m([
  b()
], p.prototype, "_skipFinalColorClamp", void 0);
m([
  b()
], p.prototype, "_applyByPostProcess", void 0);
m([
  b()
], p.prototype, "_isEnabled", void 0);
I._ImageProcessingConfigurationParser = p.Parse;
class q {
  constructor() {
    this.hit = !1, this.distance = 0, this.pickedPoint = null, this.pickedMesh = null, this.bu = 0, this.bv = 0, this.faceId = -1, this.subMeshFaceId = -1, this.subMeshId = 0, this.pickedSprite = null, this.thinInstanceIndex = -1, this.ray = null, this.originMesh = null, this.aimTransform = null, this.gripTransform = null;
  }
  /**
   * Gets the normal corresponding to the face the pick collided with
   * @param useWorldCoordinates If the resulting normal should be relative to the world (default: false)
   * @param useVerticesNormals If the vertices normals should be used to calculate the normal instead of the normal map (default: true)
   * @returns The normal corresponding to the face the pick collided with
   * @remarks Note that the returned normal will always point towards the picking ray.
   */
  getNormal(e = !1, t = !0) {
    if (!this.pickedMesh || t && !this.pickedMesh.isVerticesDataPresent(V.NormalKind))
      return null;
    let i = this.pickedMesh.getIndices();
    i?.length === 0 && (i = null);
    let r;
    const s = O.Vector3[0], a = O.Vector3[1], o = O.Vector3[2];
    if (t) {
      const l = this.pickedMesh.getVerticesData(V.NormalKind);
      let g = i ? y.FromArrayToRef(l, i[this.faceId * 3] * 3, s) : s.copyFromFloats(l[this.faceId * 3 * 3], l[this.faceId * 3 * 3 + 1], l[this.faceId * 3 * 3 + 2]), f = i ? y.FromArrayToRef(l, i[this.faceId * 3 + 1] * 3, a) : a.copyFromFloats(l[(this.faceId * 3 + 1) * 3], l[(this.faceId * 3 + 1) * 3 + 1], l[(this.faceId * 3 + 1) * 3 + 2]), P = i ? y.FromArrayToRef(l, i[this.faceId * 3 + 2] * 3, o) : o.copyFromFloats(l[(this.faceId * 3 + 2) * 3], l[(this.faceId * 3 + 2) * 3 + 1], l[(this.faceId * 3 + 2) * 3 + 2]);
      g = g.scale(this.bu), f = f.scale(this.bv), P = P.scale(1 - this.bu - this.bv), r = new y(g.x + f.x + P.x, g.y + f.y + P.y, g.z + f.z + P.z);
    } else {
      const l = this.pickedMesh.getVerticesData(V.PositionKind), g = i ? y.FromArrayToRef(l, i[this.faceId * 3] * 3, s) : s.copyFromFloats(l[this.faceId * 3 * 3], l[this.faceId * 3 * 3 + 1], l[this.faceId * 3 * 3 + 2]), f = i ? y.FromArrayToRef(l, i[this.faceId * 3 + 1] * 3, a) : a.copyFromFloats(l[(this.faceId * 3 + 1) * 3], l[(this.faceId * 3 + 1) * 3 + 1], l[(this.faceId * 3 + 1) * 3 + 2]), P = i ? y.FromArrayToRef(l, i[this.faceId * 3 + 2] * 3, o) : o.copyFromFloats(l[(this.faceId * 3 + 2) * 3], l[(this.faceId * 3 + 2) * 3 + 1], l[(this.faceId * 3 + 2) * 3 + 2]), B = g.subtract(f), W = P.subtract(f);
      r = y.Cross(B, W);
    }
    const h = (l, g) => {
      let f = l.getWorldMatrix();
      l.nonUniformScaling && (O.Matrix[0].copyFrom(f), f = O.Matrix[0], f.setTranslationFromFloats(0, 0, 0), f.invert(), f.transposeToRef(O.Matrix[1]), f = O.Matrix[1]), y.TransformNormalToRef(g, f, g);
    };
    if (e && h(this.pickedMesh, r), this.ray) {
      const l = O.Vector3[0].copyFrom(r);
      e || h(this.pickedMesh, l), y.Dot(l, this.ray.direction) > 0 && r.negateInPlace();
    }
    return r.normalize(), r;
  }
  /**
   * Gets the texture coordinates of where the pick occurred
   * @param uvSet The UV set to use to calculate the texture coordinates (default: VertexBuffer.UVKind)
   * @returns The vector containing the coordinates of the texture
   */
  getTextureCoordinates(e = V.UVKind) {
    if (!this.pickedMesh || !this.pickedMesh.isVerticesDataPresent(e))
      return null;
    const t = this.pickedMesh.getIndices();
    if (!t)
      return null;
    const i = this.pickedMesh.getVerticesData(e);
    if (!i)
      return null;
    let r = F.FromArray(i, t[this.faceId * 3] * 2), s = F.FromArray(i, t[this.faceId * 3 + 1] * 2), a = F.FromArray(i, t[this.faceId * 3 + 2] * 2);
    return r = r.scale(this.bu), s = s.scale(this.bv), a = a.scale(1 - this.bu - this.bv), new F(r.x + s.x + a.x, r.y + s.y + a.y);
  }
}
class T {
  /**
   * Creates a new ActionEvent
   * @param source The mesh or sprite that triggered the action
   * @param pointerX The X mouse cursor position at the time of the event
   * @param pointerY The Y mouse cursor position at the time of the event
   * @param meshUnderPointer The mesh that is currently pointed at (can be null)
   * @param sourceEvent the original (browser) event that triggered the ActionEvent
   * @param additionalData additional data for the event
   */
  constructor(e, t, i, r, s, a) {
    this.source = e, this.pointerX = t, this.pointerY = i, this.meshUnderPointer = r, this.sourceEvent = s, this.additionalData = a;
  }
  /**
   * Helper function to auto-create an ActionEvent from a source mesh.
   * @param source The source mesh that triggered the event
   * @param evt The original (browser) event
   * @param additionalData additional data for the event
   * @returns the new ActionEvent
   */
  static CreateNew(e, t, i) {
    const r = e.getScene();
    return new T(e, r.pointerX, r.pointerY, r.meshUnderPointer || e, t, i);
  }
  /**
   * Helper function to auto-create an ActionEvent from a source sprite
   * @param source The source sprite that triggered the event
   * @param scene Scene associated with the sprite
   * @param evt The original (browser) event
   * @param additionalData additional data for the event
   * @returns the new ActionEvent
   */
  static CreateNewFromSprite(e, t, i, r) {
    return new T(e, t.pointerX, t.pointerY, t.meshUnderPointer, i, r);
  }
  /**
   * Helper function to auto-create an ActionEvent from a scene. If triggered by a mesh use ActionEvent.CreateNew
   * @param scene the scene where the event occurred
   * @param evt The original (browser) event
   * @returns the new ActionEvent
   */
  static CreateNewFromScene(e, t) {
    return new T(null, e.pointerX, e.pointerY, e.meshUnderPointer, t);
  }
  /**
   * Helper function to auto-create an ActionEvent from a primitive
   * @param prim defines the target primitive
   * @param pointerPos defines the pointer position
   * @param evt The original (browser) event
   * @param additionalData additional data for the event
   * @returns the new ActionEvent
   */
  static CreateNewFromPrimitive(e, t, i, r) {
    return new T(e, t.x, t.y, null, i, r);
  }
}
class u {
}
u.NAME_EFFECTLAYER = "EffectLayer";
u.NAME_LAYER = "Layer";
u.NAME_LENSFLARESYSTEM = "LensFlareSystem";
u.NAME_BOUNDINGBOXRENDERER = "BoundingBoxRenderer";
u.NAME_PARTICLESYSTEM = "ParticleSystem";
u.NAME_GAMEPAD = "Gamepad";
u.NAME_SIMPLIFICATIONQUEUE = "SimplificationQueue";
u.NAME_GEOMETRYBUFFERRENDERER = "GeometryBufferRenderer";
u.NAME_PREPASSRENDERER = "PrePassRenderer";
u.NAME_DEPTHRENDERER = "DepthRenderer";
u.NAME_DEPTHPEELINGRENDERER = "DepthPeelingRenderer";
u.NAME_POSTPROCESSRENDERPIPELINEMANAGER = "PostProcessRenderPipelineManager";
u.NAME_SPRITE = "Sprite";
u.NAME_SUBSURFACE = "SubSurface";
u.NAME_OUTLINERENDERER = "Outline";
u.NAME_PROCEDURALTEXTURE = "ProceduralTexture";
u.NAME_SHADOWGENERATOR = "ShadowGenerator";
u.NAME_OCTREE = "Octree";
u.NAME_PHYSICSENGINE = "PhysicsEngine";
u.NAME_AUDIO = "Audio";
u.NAME_FLUIDRENDERER = "FluidRenderer";
u.STEP_ISREADYFORMESH_EFFECTLAYER = 0;
u.STEP_BEFOREEVALUATEACTIVEMESH_BOUNDINGBOXRENDERER = 0;
u.STEP_EVALUATESUBMESH_BOUNDINGBOXRENDERER = 0;
u.STEP_PREACTIVEMESH_BOUNDINGBOXRENDERER = 0;
u.STEP_CAMERADRAWRENDERTARGET_EFFECTLAYER = 1;
u.STEP_BEFORECAMERADRAW_PREPASS = 0;
u.STEP_BEFORECAMERADRAW_EFFECTLAYER = 1;
u.STEP_BEFORECAMERADRAW_LAYER = 2;
u.STEP_BEFORERENDERTARGETDRAW_PREPASS = 0;
u.STEP_BEFORERENDERTARGETDRAW_LAYER = 1;
u.STEP_BEFORERENDERINGMESH_PREPASS = 0;
u.STEP_BEFORERENDERINGMESH_OUTLINE = 1;
u.STEP_AFTERRENDERINGMESH_PREPASS = 0;
u.STEP_AFTERRENDERINGMESH_OUTLINE = 1;
u.STEP_AFTERRENDERINGGROUPDRAW_EFFECTLAYER_DRAW = 0;
u.STEP_AFTERRENDERINGGROUPDRAW_BOUNDINGBOXRENDERER = 1;
u.STEP_BEFORECAMERAUPDATE_SIMPLIFICATIONQUEUE = 0;
u.STEP_BEFORECAMERAUPDATE_GAMEPAD = 1;
u.STEP_BEFORECLEAR_PROCEDURALTEXTURE = 0;
u.STEP_BEFORECLEAR_PREPASS = 1;
u.STEP_BEFORERENDERTARGETCLEAR_PREPASS = 0;
u.STEP_AFTERRENDERTARGETDRAW_PREPASS = 0;
u.STEP_AFTERRENDERTARGETDRAW_LAYER = 1;
u.STEP_AFTERCAMERADRAW_PREPASS = 0;
u.STEP_AFTERCAMERADRAW_EFFECTLAYER = 1;
u.STEP_AFTERCAMERADRAW_LENSFLARESYSTEM = 2;
u.STEP_AFTERCAMERADRAW_EFFECTLAYER_DRAW = 3;
u.STEP_AFTERCAMERADRAW_LAYER = 4;
u.STEP_AFTERCAMERADRAW_FLUIDRENDERER = 5;
u.STEP_AFTERCAMERAPOSTPROCESS_LAYER = 0;
u.STEP_AFTERRENDERTARGETPOSTPROCESS_LAYER = 0;
u.STEP_AFTERRENDER_AUDIO = 0;
u.STEP_GATHERRENDERTARGETS_DEPTHRENDERER = 0;
u.STEP_GATHERRENDERTARGETS_GEOMETRYBUFFERRENDERER = 1;
u.STEP_GATHERRENDERTARGETS_SHADOWGENERATOR = 2;
u.STEP_GATHERRENDERTARGETS_POSTPROCESSRENDERPIPELINEMANAGER = 3;
u.STEP_GATHERACTIVECAMERARENDERTARGETS_DEPTHRENDERER = 0;
u.STEP_GATHERACTIVECAMERARENDERTARGETS_FLUIDRENDERER = 1;
u.STEP_POINTERMOVE_SPRITE = 0;
u.STEP_POINTERDOWN_SPRITE = 0;
u.STEP_POINTERUP_SPRITE = 0;
class C extends Array {
  /**
   * Hide ctor from the rest of the world.
   * @param items The items to add.
   */
  constructor(e) {
    super(...e);
  }
  /**
   * Creates a new Stage.
   * @returns A new instance of a Stage
   */
  static Create() {
    return Object.create(C.prototype);
  }
  /**
   * Registers a step in an ordered way in the targeted stage.
   * @param index Defines the position to register the step in
   * @param component Defines the component attached to the step
   * @param action Defines the action to launch during the step
   */
  registerStep(e, t, i) {
    let r = 0, s = Number.MAX_VALUE;
    for (; r < this.length && (s = this[r].index, !(e < s)); r++)
      ;
    this.splice(r, 0, { index: e, component: t, action: i.bind(t) });
  }
  /**
   * Clears all the steps from the stage.
   */
  clear() {
    this.length = 0;
  }
}
class A {
  constructor() {
    this.hoverCursor = "", this.actions = [], this.isRecursive = !1;
  }
  /**
   * Does exist one action manager with at least one trigger
   **/
  static get HasTriggers() {
    for (const e in A.Triggers)
      if (Object.prototype.hasOwnProperty.call(A.Triggers, e))
        return !0;
    return !1;
  }
  /**
   * Does exist one action manager with at least one pick trigger
   **/
  static get HasPickTriggers() {
    for (const e in A.Triggers)
      if (Object.prototype.hasOwnProperty.call(A.Triggers, e)) {
        const t = parseInt(e);
        if (t >= 1 && t <= 7)
          return !0;
      }
    return !1;
  }
  /**
   * Does exist one action manager that handles actions of a given trigger
   * @param trigger defines the trigger to be tested
   * @returns a boolean indicating whether the trigger is handled by at least one action manager
   **/
  static HasSpecificTrigger(e) {
    for (const t in A.Triggers)
      if (Object.prototype.hasOwnProperty.call(A.Triggers, t) && parseInt(t) === e)
        return !0;
    return !1;
  }
}
A.Triggers = {};
class X {
}
X.KEYDOWN = 1;
X.KEYUP = 2;
class J {
  /**
   * Instantiates a new keyboard info.
   * This class is used to store keyboard related info for the onKeyboardObservable event.
   * @param type Defines the type of event (KeyboardEventTypes)
   * @param event Defines the related dom event
   */
  constructor(e, t) {
    this.type = e, this.event = t;
  }
}
class oe extends J {
  /**
   * Defines whether the engine should skip the next onKeyboardObservable associated to this pre.
   * @deprecated use skipOnKeyboardObservable property instead
   */
  get skipOnPointerObservable() {
    return this.skipOnKeyboardObservable;
  }
  set skipOnPointerObservable(e) {
    this.skipOnKeyboardObservable = e;
  }
  /**
   * Instantiates a new keyboard pre info.
   * This class is used to store keyboard related info for the onPreKeyboardObservable event.
   * @param type Defines the type of event (KeyboardEventTypes)
   * @param event Defines the related dom event
   */
  constructor(e, t) {
    super(e, t), this.type = e, this.event = t, this.skipOnKeyboardObservable = !1;
  }
}
var d;
(function(n) {
  n[n.Generic = 0] = "Generic", n[n.Keyboard = 1] = "Keyboard", n[n.Mouse = 2] = "Mouse", n[n.Touch = 3] = "Touch", n[n.DualShock = 4] = "DualShock", n[n.Xbox = 5] = "Xbox", n[n.Switch = 6] = "Switch", n[n.DualSense = 7] = "DualSense";
})(d || (d = {}));
var c;
(function(n) {
  n[n.Horizontal = 0] = "Horizontal", n[n.Vertical = 1] = "Vertical", n[n.LeftClick = 2] = "LeftClick", n[n.MiddleClick = 3] = "MiddleClick", n[n.RightClick = 4] = "RightClick", n[n.BrowserBack = 5] = "BrowserBack", n[n.BrowserForward = 6] = "BrowserForward", n[n.MouseWheelX = 7] = "MouseWheelX", n[n.MouseWheelY = 8] = "MouseWheelY", n[n.MouseWheelZ = 9] = "MouseWheelZ", n[n.Move = 12] = "Move";
})(c || (c = {}));
var z;
(function(n) {
  n[n.Horizontal = 0] = "Horizontal", n[n.Vertical = 1] = "Vertical", n[n.LeftClick = 2] = "LeftClick", n[n.MiddleClick = 3] = "MiddleClick", n[n.RightClick = 4] = "RightClick", n[n.BrowserBack = 5] = "BrowserBack", n[n.BrowserForward = 6] = "BrowserForward", n[n.MouseWheelX = 7] = "MouseWheelX", n[n.MouseWheelY = 8] = "MouseWheelY", n[n.MouseWheelZ = 9] = "MouseWheelZ", n[n.DeltaHorizontal = 10] = "DeltaHorizontal", n[n.DeltaVertical = 11] = "DeltaVertical";
})(z || (z = {}));
var he;
(function(n) {
  n[n.Cross = 0] = "Cross", n[n.Circle = 1] = "Circle", n[n.Square = 2] = "Square", n[n.Triangle = 3] = "Triangle", n[n.L1 = 4] = "L1", n[n.R1 = 5] = "R1", n[n.L2 = 6] = "L2", n[n.R2 = 7] = "R2", n[n.Share = 8] = "Share", n[n.Options = 9] = "Options", n[n.L3 = 10] = "L3", n[n.R3 = 11] = "R3", n[n.DPadUp = 12] = "DPadUp", n[n.DPadDown = 13] = "DPadDown", n[n.DPadLeft = 14] = "DPadLeft", n[n.DPadRight = 15] = "DPadRight", n[n.Home = 16] = "Home", n[n.TouchPad = 17] = "TouchPad", n[n.LStickXAxis = 18] = "LStickXAxis", n[n.LStickYAxis = 19] = "LStickYAxis", n[n.RStickXAxis = 20] = "RStickXAxis", n[n.RStickYAxis = 21] = "RStickYAxis";
})(he || (he = {}));
var le;
(function(n) {
  n[n.Cross = 0] = "Cross", n[n.Circle = 1] = "Circle", n[n.Square = 2] = "Square", n[n.Triangle = 3] = "Triangle", n[n.L1 = 4] = "L1", n[n.R1 = 5] = "R1", n[n.L2 = 6] = "L2", n[n.R2 = 7] = "R2", n[n.Create = 8] = "Create", n[n.Options = 9] = "Options", n[n.L3 = 10] = "L3", n[n.R3 = 11] = "R3", n[n.DPadUp = 12] = "DPadUp", n[n.DPadDown = 13] = "DPadDown", n[n.DPadLeft = 14] = "DPadLeft", n[n.DPadRight = 15] = "DPadRight", n[n.Home = 16] = "Home", n[n.TouchPad = 17] = "TouchPad", n[n.LStickXAxis = 18] = "LStickXAxis", n[n.LStickYAxis = 19] = "LStickYAxis", n[n.RStickXAxis = 20] = "RStickXAxis", n[n.RStickYAxis = 21] = "RStickYAxis";
})(le || (le = {}));
var de;
(function(n) {
  n[n.A = 0] = "A", n[n.B = 1] = "B", n[n.X = 2] = "X", n[n.Y = 3] = "Y", n[n.LB = 4] = "LB", n[n.RB = 5] = "RB", n[n.LT = 6] = "LT", n[n.RT = 7] = "RT", n[n.Back = 8] = "Back", n[n.Start = 9] = "Start", n[n.LS = 10] = "LS", n[n.RS = 11] = "RS", n[n.DPadUp = 12] = "DPadUp", n[n.DPadDown = 13] = "DPadDown", n[n.DPadLeft = 14] = "DPadLeft", n[n.DPadRight = 15] = "DPadRight", n[n.Home = 16] = "Home", n[n.LStickXAxis = 17] = "LStickXAxis", n[n.LStickYAxis = 18] = "LStickYAxis", n[n.RStickXAxis = 19] = "RStickXAxis", n[n.RStickYAxis = 20] = "RStickYAxis";
})(de || (de = {}));
var ce;
(function(n) {
  n[n.B = 0] = "B", n[n.A = 1] = "A", n[n.Y = 2] = "Y", n[n.X = 3] = "X", n[n.L = 4] = "L", n[n.R = 5] = "R", n[n.ZL = 6] = "ZL", n[n.ZR = 7] = "ZR", n[n.Minus = 8] = "Minus", n[n.Plus = 9] = "Plus", n[n.LS = 10] = "LS", n[n.RS = 11] = "RS", n[n.DPadUp = 12] = "DPadUp", n[n.DPadDown = 13] = "DPadDown", n[n.DPadLeft = 14] = "DPadLeft", n[n.DPadRight = 15] = "DPadRight", n[n.Home = 16] = "Home", n[n.Capture = 17] = "Capture", n[n.LStickXAxis = 18] = "LStickXAxis", n[n.LStickYAxis = 19] = "LStickYAxis", n[n.RStickXAxis = 20] = "RStickXAxis", n[n.RStickYAxis = 21] = "RStickYAxis";
})(ce || (ce = {}));
var ue;
(function(n) {
  n[n.PointerMove = 0] = "PointerMove", n[n.PointerDown = 1] = "PointerDown", n[n.PointerUp = 2] = "PointerUp";
})(ue || (ue = {}));
class j {
}
j.DOM_DELTA_PIXEL = 0;
j.DOM_DELTA_LINE = 1;
j.DOM_DELTA_PAGE = 2;
class N {
  /**
   * Create device input events based on provided type and slot
   *
   * @param deviceType Type of device
   * @param deviceSlot "Slot" or index that device is referenced in
   * @param inputIndex Id of input to be checked
   * @param currentState Current value for given input
   * @param deviceInputSystem Reference to DeviceInputSystem
   * @param elementToAttachTo HTMLElement to reference as target for inputs
   * @param pointerId PointerId to use for pointer events
   * @returns IUIEvent object
   */
  static CreateDeviceEvent(e, t, i, r, s, a, o) {
    switch (e) {
      case d.Keyboard:
        return this._CreateKeyboardEvent(i, r, s, a);
      case d.Mouse:
        if (i === c.MouseWheelX || i === c.MouseWheelY || i === c.MouseWheelZ)
          return this._CreateWheelEvent(e, t, i, r, s, a);
      case d.Touch:
        return this._CreatePointerEvent(e, t, i, r, s, a, o);
      default:
        throw `Unable to generate event for device ${d[e]}`;
    }
  }
  /**
   * Creates pointer event
   *
   * @param deviceType Type of device
   * @param deviceSlot "Slot" or index that device is referenced in
   * @param inputIndex Id of input to be checked
   * @param currentState Current value for given input
   * @param deviceInputSystem Reference to DeviceInputSystem
   * @param elementToAttachTo HTMLElement to reference as target for inputs
   * @param pointerId PointerId to use for pointer events
   * @returns IUIEvent object (Pointer)
   */
  static _CreatePointerEvent(e, t, i, r, s, a, o) {
    const h = this._CreateMouseEvent(e, t, i, r, s, a);
    e === d.Mouse ? (h.deviceType = d.Mouse, h.pointerId = 1, h.pointerType = "mouse") : (h.deviceType = d.Touch, h.pointerId = o ?? t, h.pointerType = "touch");
    let l = 0;
    return l += s.pollInput(e, t, c.LeftClick), l += s.pollInput(e, t, c.RightClick) * 2, l += s.pollInput(e, t, c.MiddleClick) * 4, h.buttons = l, i === c.Move ? h.type = "pointermove" : i >= c.LeftClick && i <= c.RightClick && (h.type = r === 1 ? "pointerdown" : "pointerup", h.button = i - 2), h;
  }
  /**
   * Create Mouse Wheel Event
   * @param deviceType Type of device
   * @param deviceSlot "Slot" or index that device is referenced in
   * @param inputIndex Id of input to be checked
   * @param currentState Current value for given input
   * @param deviceInputSystem Reference to DeviceInputSystem
   * @param elementToAttachTo HTMLElement to reference as target for inputs
   * @returns IUIEvent object (Wheel)
   */
  static _CreateWheelEvent(e, t, i, r, s, a) {
    const o = this._CreateMouseEvent(e, t, i, r, s, a);
    switch (o.pointerId = 1, o.type = "wheel", o.deltaMode = j.DOM_DELTA_PIXEL, o.deltaX = 0, o.deltaY = 0, o.deltaZ = 0, i) {
      case c.MouseWheelX:
        o.deltaX = r;
        break;
      case c.MouseWheelY:
        o.deltaY = r;
        break;
      case c.MouseWheelZ:
        o.deltaZ = r;
        break;
    }
    return o;
  }
  /**
   * Create Mouse Event
   * @param deviceType Type of device
   * @param deviceSlot "Slot" or index that device is referenced in
   * @param inputIndex Id of input to be checked
   * @param currentState Current value for given input
   * @param deviceInputSystem Reference to DeviceInputSystem
   * @param elementToAttachTo HTMLElement to reference as target for inputs
   * @returns IUIEvent object (Mouse)
   */
  static _CreateMouseEvent(e, t, i, r, s, a) {
    const o = this._CreateEvent(a), h = s.pollInput(e, t, c.Horizontal), l = s.pollInput(e, t, c.Vertical);
    return a ? (o.movementX = 0, o.movementY = 0, o.offsetX = o.movementX - a.getBoundingClientRect().x, o.offsetY = o.movementY - a.getBoundingClientRect().y) : (o.movementX = s.pollInput(e, t, z.DeltaHorizontal), o.movementY = s.pollInput(e, t, z.DeltaVertical), o.offsetX = 0, o.offsetY = 0), this._CheckNonCharacterKeys(o, s), o.clientX = h, o.clientY = l, o.x = h, o.y = l, o.deviceType = e, o.deviceSlot = t, o.inputIndex = i, o;
  }
  /**
   * Create Keyboard Event
   * @param inputIndex Id of input to be checked
   * @param currentState Current value for given input
   * @param deviceInputSystem Reference to DeviceInputSystem
   * @param elementToAttachTo HTMLElement to reference as target for inputs
   * @returns IEvent object (Keyboard)
   */
  static _CreateKeyboardEvent(e, t, i, r) {
    const s = this._CreateEvent(r);
    return this._CheckNonCharacterKeys(s, i), s.deviceType = d.Keyboard, s.deviceSlot = 0, s.inputIndex = e, s.type = t === 1 ? "keydown" : "keyup", s.key = String.fromCharCode(e), s.keyCode = e, s;
  }
  /**
   * Add parameters for non-character keys (Ctrl, Alt, Meta, Shift)
   * @param evt Event object to add parameters to
   * @param deviceInputSystem DeviceInputSystem to pull values from
   */
  static _CheckNonCharacterKeys(e, t) {
    const i = t.isDeviceAvailable(d.Keyboard), r = i && t.pollInput(d.Keyboard, 0, 18) === 1, s = i && t.pollInput(d.Keyboard, 0, 17) === 1, a = i && (t.pollInput(d.Keyboard, 0, 91) === 1 || t.pollInput(d.Keyboard, 0, 92) === 1 || t.pollInput(d.Keyboard, 0, 93) === 1), o = i && t.pollInput(d.Keyboard, 0, 16) === 1;
    e.altKey = r, e.ctrlKey = s, e.metaKey = a, e.shiftKey = o;
  }
  /**
   * Create base event object
   * @param elementToAttachTo Value to use as event target
   * @returns
   */
  static _CreateEvent(e) {
    const t = {};
    return t.preventDefault = () => {
    }, t.target = e, t;
  }
}
class Ne {
  constructor(e, t, i) {
    this._nativeInput = _native.DeviceInputSystem ? new _native.DeviceInputSystem(e, t, (r, s, a, o) => {
      const h = N.CreateDeviceEvent(r, s, a, o, this);
      i(r, s, h);
    }) : this._createDummyNativeInput();
  }
  // Public functions
  /**
   * Checks for current device input value, given an id and input index. Throws exception if requested device not initialized.
   * @param deviceType Enum specifying device type
   * @param deviceSlot "Slot" or index that device is referenced in
   * @param inputIndex Id of input to be checked
   * @returns Current value of input
   */
  pollInput(e, t, i) {
    return this._nativeInput.pollInput(e, t, i);
  }
  /**
   * Check for a specific device in the DeviceInputSystem
   * @param deviceType Type of device to check for
   * @returns bool with status of device's existence
   */
  isDeviceAvailable(e) {
    return e === d.Mouse || e === d.Touch;
  }
  /**
   * Dispose of all the observables
   */
  dispose() {
    this._nativeInput.dispose();
  }
  /**
   * For versions of BabylonNative that don't have the NativeInput plugin initialized, create a dummy version
   * @returns Object with dummy functions
   */
  _createDummyNativeInput() {
    return {
      pollInput: () => 0,
      isDeviceAvailable: () => !1,
      dispose: () => {
      }
    };
  }
}
const _e = 255, ge = Object.keys(c).length / 2;
class Fe {
  /**
   * Constructor for the WebDeviceInputSystem
   * @param engine Engine to reference
   * @param onDeviceConnected Callback to execute when device is connected
   * @param onDeviceDisconnected Callback to execute when device is disconnected
   * @param onInputChanged Callback to execute when input changes on device
   */
  constructor(e, t, i, r) {
    this._inputs = [], this._keyboardActive = !1, this._pointerActive = !1, this._usingSafari = S.IsSafari(), this._usingMacOS = H() && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform), this._keyboardDownEvent = (s) => {
    }, this._keyboardUpEvent = (s) => {
    }, this._keyboardBlurEvent = (s) => {
    }, this._pointerMoveEvent = (s) => {
    }, this._pointerDownEvent = (s) => {
    }, this._pointerUpEvent = (s) => {
    }, this._pointerCancelEvent = (s) => {
    }, this._pointerWheelEvent = (s) => {
    }, this._pointerBlurEvent = (s) => {
    }, this._pointerMacOSChromeOutEvent = (s) => {
    }, this._eventsAttached = !1, this._mouseId = -1, this._isUsingFirefox = H() && navigator.userAgent && navigator.userAgent.indexOf("Firefox") !== -1, this._isUsingChromium = H() && navigator.userAgent && navigator.userAgent.indexOf("Chrome") !== -1, this._maxTouchPoints = 0, this._pointerInputClearObserver = null, this._gamepadConnectedEvent = (s) => {
    }, this._gamepadDisconnectedEvent = (s) => {
    }, this._eventPrefix = S.GetPointerPrefix(e), this._engine = e, this._onDeviceConnected = t, this._onDeviceDisconnected = i, this._onInputChanged = r, this._mouseId = this._isUsingFirefox ? 0 : 1, this._enableEvents(), this._usingMacOS && (this._metaKeys = []), this._engine._onEngineViewChanged || (this._engine._onEngineViewChanged = () => {
      this._enableEvents();
    });
  }
  // Public functions
  /**
   * Checks for current device input value, given an id and input index. Throws exception if requested device not initialized.
   * @param deviceType Enum specifying device type
   * @param deviceSlot "Slot" or index that device is referenced in
   * @param inputIndex Id of input to be checked
   * @returns Current value of input
   */
  pollInput(e, t, i) {
    const r = this._inputs[e][t];
    if (!r)
      throw `Unable to find device ${d[e]}`;
    e >= d.DualShock && e <= d.DualSense && this._updateDevice(e, t, i);
    const s = r[i];
    if (s === void 0)
      throw `Unable to find input ${i} for device ${d[e]} in slot ${t}`;
    return i === c.Move && S.Warn("Unable to provide information for PointerInput.Move.  Try using PointerInput.Horizontal or PointerInput.Vertical for move data."), s;
  }
  /**
   * Check for a specific device in the DeviceInputSystem
   * @param deviceType Type of device to check for
   * @returns bool with status of device's existence
   */
  isDeviceAvailable(e) {
    return this._inputs[e] !== void 0;
  }
  /**
   * Dispose of all the eventlisteners
   */
  dispose() {
    this._onDeviceConnected = () => {
    }, this._onDeviceDisconnected = () => {
    }, this._onInputChanged = () => {
    }, delete this._engine._onEngineViewChanged, this._elementToAttachTo && this._disableEvents();
  }
  /**
   * Enable listening for user input events
   */
  _enableEvents() {
    const e = this?._engine.getInputElement();
    if (e && (!this._eventsAttached || this._elementToAttachTo !== e)) {
      if (this._disableEvents(), this._inputs) {
        for (const t of this._inputs)
          if (t)
            for (const i in t) {
              const r = +i, s = t[r];
              if (s)
                for (let a = 0; a < s.length; a++)
                  s[a] = 0;
            }
      }
      this._elementToAttachTo = e, this._elementToAttachTo.tabIndex = this._elementToAttachTo.tabIndex !== -1 ? this._elementToAttachTo.tabIndex : this._engine.canvasTabIndex, this._handleKeyActions(), this._handlePointerActions(), this._handleGamepadActions(), this._eventsAttached = !0, this._checkForConnectedDevices();
    }
  }
  /**
   * Disable listening for user input events
   */
  _disableEvents() {
    this._elementToAttachTo && (this._elementToAttachTo.removeEventListener("blur", this._keyboardBlurEvent), this._elementToAttachTo.removeEventListener("blur", this._pointerBlurEvent), this._elementToAttachTo.removeEventListener("keydown", this._keyboardDownEvent), this._elementToAttachTo.removeEventListener("keyup", this._keyboardUpEvent), this._elementToAttachTo.removeEventListener(this._eventPrefix + "move", this._pointerMoveEvent), this._elementToAttachTo.removeEventListener(this._eventPrefix + "down", this._pointerDownEvent), this._elementToAttachTo.removeEventListener(this._eventPrefix + "up", this._pointerUpEvent), this._elementToAttachTo.removeEventListener(this._eventPrefix + "cancel", this._pointerCancelEvent), this._elementToAttachTo.removeEventListener(this._wheelEventName, this._pointerWheelEvent), this._usingMacOS && this._isUsingChromium && this._elementToAttachTo.removeEventListener("lostpointercapture", this._pointerMacOSChromeOutEvent), window.removeEventListener("gamepadconnected", this._gamepadConnectedEvent), window.removeEventListener("gamepaddisconnected", this._gamepadDisconnectedEvent)), this._pointerInputClearObserver && this._engine.onEndFrameObservable.remove(this._pointerInputClearObserver), this._eventsAttached = !1;
  }
  /**
   * Checks for existing connections to devices and register them, if necessary
   * Currently handles gamepads and mouse
   */
  _checkForConnectedDevices() {
    if (navigator.getGamepads) {
      const e = navigator.getGamepads();
      for (const t of e)
        t && this._addGamePad(t);
    }
    typeof matchMedia == "function" && matchMedia("(pointer:fine)").matches && this._addPointerDevice(d.Mouse, 0, 0, 0);
  }
  // Private functions
  /**
   * Add a gamepad to the DeviceInputSystem
   * @param gamepad A single DOM Gamepad object
   */
  _addGamePad(e) {
    const t = this._getGamepadDeviceType(e.id), i = e.index;
    this._gamepads = this._gamepads || new Array(e.index + 1), this._registerDevice(t, i, e.buttons.length + e.axes.length), this._gamepads[i] = t;
  }
  /**
   * Add pointer device to DeviceInputSystem
   * @param deviceType Type of Pointer to add
   * @param deviceSlot Pointer ID (0 for mouse, pointerId for Touch)
   * @param currentX Current X at point of adding
   * @param currentY Current Y at point of adding
   */
  _addPointerDevice(e, t, i, r) {
    this._pointerActive || (this._pointerActive = !0), this._registerDevice(e, t, ge);
    const s = this._inputs[e][t];
    s[0] = i, s[1] = r;
  }
  /**
   * Add device and inputs to device array
   * @param deviceType Enum specifying device type
   * @param deviceSlot "Slot" or index that device is referenced in
   * @param numberOfInputs Number of input entries to create for given device
   */
  _registerDevice(e, t, i) {
    if (t === void 0)
      throw `Unable to register device ${d[e]} to undefined slot.`;
    if (this._inputs[e] || (this._inputs[e] = {}), !this._inputs[e][t]) {
      const r = new Array(i);
      r.fill(0), this._inputs[e][t] = r, this._onDeviceConnected(e, t);
    }
  }
  /**
   * Given a specific device name, remove that device from the device map
   * @param deviceType Enum specifying device type
   * @param deviceSlot "Slot" or index that device is referenced in
   */
  _unregisterDevice(e, t) {
    this._inputs[e][t] && (delete this._inputs[e][t], this._onDeviceDisconnected(e, t));
  }
  /**
   * Handle all actions that come from keyboard interaction
   */
  _handleKeyActions() {
    this._keyboardDownEvent = (e) => {
      this._keyboardActive || (this._keyboardActive = !0, this._registerDevice(d.Keyboard, 0, _e));
      const t = this._inputs[d.Keyboard][0];
      if (t) {
        t[e.keyCode] = 1;
        const i = e;
        i.inputIndex = e.keyCode, this._usingMacOS && e.metaKey && e.key !== "Meta" && (this._metaKeys.includes(e.keyCode) || this._metaKeys.push(e.keyCode)), this._onInputChanged(d.Keyboard, 0, i);
      }
    }, this._keyboardUpEvent = (e) => {
      this._keyboardActive || (this._keyboardActive = !0, this._registerDevice(d.Keyboard, 0, _e));
      const t = this._inputs[d.Keyboard][0];
      if (t) {
        t[e.keyCode] = 0;
        const i = e;
        if (i.inputIndex = e.keyCode, this._usingMacOS && e.key === "Meta" && this._metaKeys.length > 0) {
          for (const r of this._metaKeys) {
            const s = N.CreateDeviceEvent(d.Keyboard, 0, r, 0, this, this._elementToAttachTo);
            t[r] = 0, this._onInputChanged(d.Keyboard, 0, s);
          }
          this._metaKeys.splice(0, this._metaKeys.length);
        }
        this._onInputChanged(d.Keyboard, 0, i);
      }
    }, this._keyboardBlurEvent = () => {
      if (this._keyboardActive) {
        const e = this._inputs[d.Keyboard][0];
        for (let t = 0; t < e.length; t++)
          if (e[t] !== 0) {
            e[t] = 0;
            const i = N.CreateDeviceEvent(d.Keyboard, 0, t, 0, this, this._elementToAttachTo);
            this._onInputChanged(d.Keyboard, 0, i);
          }
        this._usingMacOS && this._metaKeys.splice(0, this._metaKeys.length);
      }
    }, this._elementToAttachTo.addEventListener("keydown", this._keyboardDownEvent), this._elementToAttachTo.addEventListener("keyup", this._keyboardUpEvent), this._elementToAttachTo.addEventListener("blur", this._keyboardBlurEvent);
  }
  /**
   * Handle all actions that come from pointer interaction
   */
  _handlePointerActions() {
    this._maxTouchPoints = H() && navigator.maxTouchPoints || 2, this._activeTouchIds || (this._activeTouchIds = new Array(this._maxTouchPoints));
    for (let i = 0; i < this._maxTouchPoints; i++)
      this._activeTouchIds[i] = -1;
    this._pointerMoveEvent = (i) => {
      const r = this._getPointerType(i);
      let s = r === d.Mouse ? 0 : this._activeTouchIds.indexOf(i.pointerId);
      if (r === d.Touch && s === -1) {
        const o = this._activeTouchIds.indexOf(-1);
        if (o >= 0)
          s = o, this._activeTouchIds[o] = i.pointerId, this._onDeviceConnected(r, s);
        else {
          S.Warn(`Max number of touches exceeded.  Ignoring touches in excess of ${this._maxTouchPoints}`);
          return;
        }
      }
      this._inputs[r] || (this._inputs[r] = {}), this._inputs[r][s] || this._addPointerDevice(r, s, i.clientX, i.clientY);
      const a = this._inputs[r][s];
      if (a) {
        const o = i;
        o.inputIndex = c.Move, a[c.Horizontal] = i.clientX, a[c.Vertical] = i.clientY, r === d.Touch && a[c.LeftClick] === 0 && (a[c.LeftClick] = 1), i.pointerId === void 0 && (i.pointerId = this._mouseId), this._onInputChanged(r, s, o), !this._usingSafari && i.button !== -1 && (o.inputIndex = i.button + 2, a[i.button + 2] = a[i.button + 2] ? 0 : 1, this._onInputChanged(r, s, o));
      }
    }, this._pointerDownEvent = (i) => {
      const r = this._getPointerType(i);
      let s = r === d.Mouse ? 0 : i.pointerId;
      if (r === d.Touch) {
        const o = this._activeTouchIds.indexOf(-1);
        if (o >= 0)
          s = o, this._activeTouchIds[o] = i.pointerId;
        else {
          S.Warn(`Max number of touches exceeded.  Ignoring touches in excess of ${this._maxTouchPoints}`);
          return;
        }
      }
      this._inputs[r] || (this._inputs[r] = {}), this._inputs[r][s] ? r === d.Touch && this._onDeviceConnected(r, s) : this._addPointerDevice(r, s, i.clientX, i.clientY);
      const a = this._inputs[r][s];
      if (a) {
        const o = a[c.Horizontal], h = a[c.Vertical];
        if (r === d.Mouse) {
          if (i.pointerId === void 0 && (i.pointerId = this._mouseId), !document.pointerLockElement)
            try {
              this._elementToAttachTo.setPointerCapture(this._mouseId);
            } catch {
            }
        } else if (i.pointerId && !document.pointerLockElement)
          try {
            this._elementToAttachTo.setPointerCapture(i.pointerId);
          } catch {
          }
        a[c.Horizontal] = i.clientX, a[c.Vertical] = i.clientY, a[i.button + 2] = 1;
        const l = i;
        l.inputIndex = i.button + 2, this._onInputChanged(r, s, l), (o !== i.clientX || h !== i.clientY) && (l.inputIndex = c.Move, this._onInputChanged(r, s, l));
      }
    }, this._pointerUpEvent = (i) => {
      const r = this._getPointerType(i), s = r === d.Mouse ? 0 : this._activeTouchIds.indexOf(i.pointerId);
      if (r === d.Touch) {
        if (s === -1)
          return;
        this._activeTouchIds[s] = -1;
      }
      const a = this._inputs[r]?.[s];
      if (a && a[i.button + 2] !== 0) {
        const o = a[c.Horizontal], h = a[c.Vertical];
        a[c.Horizontal] = i.clientX, a[c.Vertical] = i.clientY, a[i.button + 2] = 0;
        const l = i;
        i.pointerId === void 0 && (i.pointerId = this._mouseId), (o !== i.clientX || h !== i.clientY) && (l.inputIndex = c.Move, this._onInputChanged(r, s, l)), l.inputIndex = i.button + 2, r === d.Mouse && this._mouseId >= 0 && this._elementToAttachTo.hasPointerCapture?.(this._mouseId) ? this._elementToAttachTo.releasePointerCapture(this._mouseId) : i.pointerId && this._elementToAttachTo.hasPointerCapture?.(i.pointerId) && this._elementToAttachTo.releasePointerCapture(i.pointerId), this._onInputChanged(r, s, l), r === d.Touch && this._onDeviceDisconnected(r, s);
      }
    }, this._pointerCancelEvent = (i) => {
      if (i.pointerType === "mouse") {
        const r = this._inputs[d.Mouse][0];
        this._mouseId >= 0 && this._elementToAttachTo.hasPointerCapture?.(this._mouseId) && this._elementToAttachTo.releasePointerCapture(this._mouseId);
        for (let s = c.LeftClick; s <= c.BrowserForward; s++)
          if (r[s] === 1) {
            r[s] = 0;
            const a = N.CreateDeviceEvent(d.Mouse, 0, s, 0, this, this._elementToAttachTo);
            this._onInputChanged(d.Mouse, 0, a);
          }
      } else {
        const r = this._activeTouchIds.indexOf(i.pointerId);
        if (r === -1)
          return;
        this._elementToAttachTo.hasPointerCapture?.(i.pointerId) && this._elementToAttachTo.releasePointerCapture(i.pointerId), this._inputs[d.Touch][r][c.LeftClick] = 0;
        const s = N.CreateDeviceEvent(d.Touch, r, c.LeftClick, 0, this, this._elementToAttachTo, i.pointerId);
        this._onInputChanged(d.Touch, r, s), this._activeTouchIds[r] = -1, this._onDeviceDisconnected(d.Touch, r);
      }
    }, this._wheelEventName = "onwheel" in document.createElement("div") ? "wheel" : document.onmousewheel !== void 0 ? "mousewheel" : "DOMMouseScroll";
    let e = !1;
    const t = function() {
    };
    try {
      const i = Object.defineProperty({}, "passive", {
        get: function() {
          e = !0;
        }
      });
      this._elementToAttachTo.addEventListener("test", t, i), this._elementToAttachTo.removeEventListener("test", t, i);
    } catch {
    }
    this._pointerBlurEvent = () => {
      if (this.isDeviceAvailable(d.Mouse)) {
        const i = this._inputs[d.Mouse][0];
        this._mouseId >= 0 && this._elementToAttachTo.hasPointerCapture?.(this._mouseId) && this._elementToAttachTo.releasePointerCapture(this._mouseId);
        for (let r = c.LeftClick; r <= c.BrowserForward; r++)
          if (i[r] === 1) {
            i[r] = 0;
            const s = N.CreateDeviceEvent(d.Mouse, 0, r, 0, this, this._elementToAttachTo);
            this._onInputChanged(d.Mouse, 0, s);
          }
      }
      if (this.isDeviceAvailable(d.Touch)) {
        const i = this._inputs[d.Touch];
        for (let r = 0; r < this._activeTouchIds.length; r++) {
          const s = this._activeTouchIds[r];
          if (this._elementToAttachTo.hasPointerCapture?.(s) && this._elementToAttachTo.releasePointerCapture(s), s !== -1 && i[r]?.[c.LeftClick] === 1) {
            i[r][c.LeftClick] = 0;
            const a = N.CreateDeviceEvent(d.Touch, r, c.LeftClick, 0, this, this._elementToAttachTo, s);
            this._onInputChanged(d.Touch, r, a), this._activeTouchIds[r] = -1, this._onDeviceDisconnected(d.Touch, r);
          }
        }
      }
    }, this._pointerWheelEvent = (i) => {
      const r = d.Mouse, s = 0;
      this._inputs[r] || (this._inputs[r] = []), this._inputs[r][s] || (this._pointerActive = !0, this._registerDevice(r, s, ge));
      const a = this._inputs[r][s];
      if (a) {
        a[c.MouseWheelX] = i.deltaX || 0, a[c.MouseWheelY] = i.deltaY || i.wheelDelta || 0, a[c.MouseWheelZ] = i.deltaZ || 0;
        const o = i;
        i.pointerId === void 0 && (i.pointerId = this._mouseId), a[c.MouseWheelX] !== 0 && (o.inputIndex = c.MouseWheelX, this._onInputChanged(r, s, o)), a[c.MouseWheelY] !== 0 && (o.inputIndex = c.MouseWheelY, this._onInputChanged(r, s, o)), a[c.MouseWheelZ] !== 0 && (o.inputIndex = c.MouseWheelZ, this._onInputChanged(r, s, o));
      }
    }, this._usingMacOS && this._isUsingChromium && (this._pointerMacOSChromeOutEvent = (i) => {
      i.buttons > 1 && this._pointerCancelEvent(i);
    }, this._elementToAttachTo.addEventListener("lostpointercapture", this._pointerMacOSChromeOutEvent)), this._elementToAttachTo.addEventListener(this._eventPrefix + "move", this._pointerMoveEvent), this._elementToAttachTo.addEventListener(this._eventPrefix + "down", this._pointerDownEvent), this._elementToAttachTo.addEventListener(this._eventPrefix + "up", this._pointerUpEvent), this._elementToAttachTo.addEventListener(this._eventPrefix + "cancel", this._pointerCancelEvent), this._elementToAttachTo.addEventListener("blur", this._pointerBlurEvent), this._elementToAttachTo.addEventListener(this._wheelEventName, this._pointerWheelEvent, e ? { passive: !1 } : !1), this._pointerInputClearObserver = this._engine.onEndFrameObservable.add(() => {
      if (this.isDeviceAvailable(d.Mouse)) {
        const i = this._inputs[d.Mouse][0];
        i[c.MouseWheelX] = 0, i[c.MouseWheelY] = 0, i[c.MouseWheelZ] = 0;
      }
    });
  }
  /**
   * Handle all actions that come from gamepad interaction
   */
  _handleGamepadActions() {
    this._gamepadConnectedEvent = (e) => {
      this._addGamePad(e.gamepad);
    }, this._gamepadDisconnectedEvent = (e) => {
      if (this._gamepads) {
        const t = this._getGamepadDeviceType(e.gamepad.id), i = e.gamepad.index;
        this._unregisterDevice(t, i), delete this._gamepads[i];
      }
    }, window.addEventListener("gamepadconnected", this._gamepadConnectedEvent), window.addEventListener("gamepaddisconnected", this._gamepadDisconnectedEvent);
  }
  /**
   * Update all non-event based devices with each frame
   * @param deviceType Enum specifying device type
   * @param deviceSlot "Slot" or index that device is referenced in
   * @param inputIndex Id of input to be checked
   */
  _updateDevice(e, t, i) {
    const r = navigator.getGamepads()[t];
    if (r && e === this._gamepads[t]) {
      const s = this._inputs[e][t];
      i >= r.buttons.length ? s[i] = r.axes[i - r.buttons.length].valueOf() : s[i] = r.buttons[i].value;
    }
  }
  /**
   * Gets DeviceType from the device name
   * @param deviceName Name of Device from DeviceInputSystem
   * @returns DeviceType enum value
   */
  _getGamepadDeviceType(e) {
    return e.indexOf("054c") !== -1 ? e.indexOf("0ce6") !== -1 ? d.DualSense : d.DualShock : e.indexOf("Xbox One") !== -1 || e.search("Xbox 360") !== -1 || e.search("xinput") !== -1 ? d.Xbox : e.indexOf("057e") !== -1 ? d.Switch : d.Generic;
  }
  /**
   * Get DeviceType from a given pointer/mouse/touch event.
   * @param evt PointerEvent to evaluate
   * @returns DeviceType interpreted from event
   */
  _getPointerType(e) {
    let t = d.Mouse;
    return (e.pointerType === "touch" || e.pointerType === "pen" || e.touches) && (t = d.Touch), t;
  }
}
class fe {
  /**
   * Default Constructor
   * @param deviceInputSystem - Reference to DeviceInputSystem
   * @param deviceType - Type of device
   * @param deviceSlot - "Slot" or index that device is referenced in
   */
  constructor(e, t, i = 0) {
    this.deviceType = t, this.deviceSlot = i, this.onInputChangedObservable = new _(), this._deviceInputSystem = e;
  }
  /**
   * Get input for specific input
   * @param inputIndex - index of specific input on device
   * @returns Input value from DeviceInputSystem
   */
  getInput(e) {
    return this._deviceInputSystem.pollInput(this.deviceType, this.deviceSlot, e);
  }
}
class Ue {
  constructor(e) {
    this._registeredManagers = new Array(), this._refCount = 0, this.registerManager = (a) => {
      for (let o = 0; o < this._devices.length; o++) {
        const h = this._devices[o];
        for (const l in h) {
          const g = +l;
          a._addDevice(new fe(this._deviceInputSystem, o, g));
        }
      }
      this._registeredManagers.push(a);
    }, this.unregisterManager = (a) => {
      const o = this._registeredManagers.indexOf(a);
      o > -1 && this._registeredManagers.splice(o, 1);
    };
    const t = Object.keys(d).length / 2;
    this._devices = new Array(t);
    const i = (a, o) => {
      this._devices[a] || (this._devices[a] = new Array()), this._devices[a][o] || (this._devices[a][o] = o);
      for (const h of this._registeredManagers) {
        const l = new fe(this._deviceInputSystem, a, o);
        h._addDevice(l);
      }
    }, r = (a, o) => {
      this._devices[a]?.[o] && delete this._devices[a][o];
      for (const h of this._registeredManagers)
        h._removeDevice(a, o);
    }, s = (a, o, h) => {
      if (h)
        for (const l of this._registeredManagers)
          l._onInputChanged(a, o, h);
    };
    typeof _native < "u" ? this._deviceInputSystem = new Ne(i, r, s) : this._deviceInputSystem = new Fe(e, i, r, s);
  }
  dispose() {
    this._deviceInputSystem.dispose();
  }
}
class Le {
  // Public Functions
  /**
   * Gets a DeviceSource, given a type and slot
   * @param deviceType - Type of Device
   * @param deviceSlot - Slot or ID of device
   * @returns DeviceSource
   */
  getDeviceSource(e, t) {
    if (t === void 0) {
      if (this._firstDevice[e] === void 0)
        return null;
      t = this._firstDevice[e];
    }
    return !this._devices[e] || this._devices[e][t] === void 0 ? null : this._devices[e][t];
  }
  /**
   * Gets an array of DeviceSource objects for a given device type
   * @param deviceType - Type of Device
   * @returns All available DeviceSources of a given type
   */
  getDeviceSources(e) {
    return this._devices[e] ? this._devices[e].filter((t) => !!t) : [];
  }
  /**
   * Default constructor
   * @param engine - Used to get canvas (if applicable)
   */
  constructor(e) {
    const t = Object.keys(d).length / 2;
    this._devices = new Array(t), this._firstDevice = new Array(t), this._engine = e, this._engine._deviceSourceManager || (this._engine._deviceSourceManager = new Ue(e)), this._engine._deviceSourceManager._refCount++, this.onDeviceConnectedObservable = new _((i) => {
      for (const r of this._devices)
        if (r)
          for (const s of r)
            s && this.onDeviceConnectedObservable.notifyObserver(i, s);
    }), this.onDeviceDisconnectedObservable = new _(), this._engine._deviceSourceManager.registerManager(this), this._onDisposeObserver = e.onDisposeObservable.add(() => {
      this.dispose();
    });
  }
  /**
   * Dispose of DeviceSourceManager
   */
  dispose() {
    this.onDeviceConnectedObservable.clear(), this.onDeviceDisconnectedObservable.clear(), this._engine._deviceSourceManager && (this._engine._deviceSourceManager.unregisterManager(this), --this._engine._deviceSourceManager._refCount < 1 && (this._engine._deviceSourceManager.dispose(), delete this._engine._deviceSourceManager)), this._engine.onDisposeObservable.remove(this._onDisposeObserver);
  }
  // Hidden Functions
  /**
   * @param deviceSource - Source to add
   * @internal
   */
  _addDevice(e) {
    this._devices[e.deviceType] || (this._devices[e.deviceType] = new Array()), this._devices[e.deviceType][e.deviceSlot] || (this._devices[e.deviceType][e.deviceSlot] = e, this._updateFirstDevices(e.deviceType)), this.onDeviceConnectedObservable.notifyObservers(e);
  }
  /**
   * @param deviceType - DeviceType
   * @param deviceSlot - DeviceSlot
   * @internal
   */
  _removeDevice(e, t) {
    const i = this._devices[e]?.[t];
    this.onDeviceDisconnectedObservable.notifyObservers(i), this._devices[e]?.[t] && delete this._devices[e][t], this._updateFirstDevices(e);
  }
  /**
   * @param deviceType - DeviceType
   * @param deviceSlot - DeviceSlot
   * @param eventData - Event
   * @internal
   */
  _onInputChanged(e, t, i) {
    this._devices[e]?.[t]?.onInputChangedObservable.notifyObservers(i);
  }
  // Private Functions
  _updateFirstDevices(e) {
    switch (e) {
      case d.Keyboard:
      case d.Mouse:
        this._firstDevice[e] = 0;
        break;
      case d.Touch:
      case d.DualSense:
      case d.DualShock:
      case d.Xbox:
      case d.Switch:
      case d.Generic: {
        delete this._firstDevice[e];
        const t = this._devices[e];
        if (t) {
          for (let i = 0; i < t.length; i++)
            if (t[i]) {
              this._firstDevice[e] = i;
              break;
            }
        }
        break;
      }
    }
  }
}
class pe {
  constructor() {
    this._singleClick = !1, this._doubleClick = !1, this._hasSwiped = !1, this._ignore = !1;
  }
  get singleClick() {
    return this._singleClick;
  }
  get doubleClick() {
    return this._doubleClick;
  }
  get hasSwiped() {
    return this._hasSwiped;
  }
  get ignore() {
    return this._ignore;
  }
  set singleClick(e) {
    this._singleClick = e;
  }
  set doubleClick(e) {
    this._doubleClick = e;
  }
  set hasSwiped(e) {
    this._hasSwiped = e;
  }
  set ignore(e) {
    this._ignore = e;
  }
}
class E {
  /**
   * Creates a new InputManager
   * @param scene - defines the hosting scene
   */
  constructor(e) {
    this._alreadyAttached = !1, this._meshPickProceed = !1, this._currentPickResult = null, this._previousPickResult = null, this._totalPointersPressed = 0, this._doubleClickOccured = !1, this._isSwiping = !1, this._swipeButtonPressed = -1, this._skipPointerTap = !1, this._isMultiTouchGesture = !1, this._pointerX = 0, this._pointerY = 0, this._startingPointerPosition = new F(0, 0), this._previousStartingPointerPosition = new F(0, 0), this._startingPointerTime = 0, this._previousStartingPointerTime = 0, this._pointerCaptures = {}, this._meshUnderPointerId = {}, this._movePointerInfo = null, this._cameraObserverCount = 0, this._delayedClicks = [null, null, null, null, null], this._deviceSourceManager = null, this._scene = e || G.LastCreatedScene, this._scene;
  }
  /**
   * Gets the mesh that is currently under the pointer
   * @returns Mesh that the pointer is pointer is hovering over
   */
  get meshUnderPointer() {
    return this._movePointerInfo && (this._movePointerInfo._generatePickInfo(), this._movePointerInfo = null), this._pointerOverMesh;
  }
  /**
   * When using more than one pointer (for example in XR) you can get the mesh under the specific pointer
   * @param pointerId - the pointer id to use
   * @returns The mesh under this pointer id or null if not found
   */
  getMeshUnderPointerByPointerId(e) {
    return this._meshUnderPointerId[e] || null;
  }
  /**
   * Gets the pointer coordinates in 2D without any translation (ie. straight out of the pointer event)
   * @returns Vector with X/Y values directly from pointer event
   */
  get unTranslatedPointer() {
    return new F(this._unTranslatedPointerX, this._unTranslatedPointerY);
  }
  /**
   * Gets or sets the current on-screen X position of the pointer
   * @returns Translated X with respect to screen
   */
  get pointerX() {
    return this._pointerX;
  }
  set pointerX(e) {
    this._pointerX = e;
  }
  /**
   * Gets or sets the current on-screen Y position of the pointer
   * @returns Translated Y with respect to screen
   */
  get pointerY() {
    return this._pointerY;
  }
  set pointerY(e) {
    this._pointerY = e;
  }
  _updatePointerPosition(e) {
    const t = this._scene.getEngine().getInputElementClientRect();
    t && (this._pointerX = e.clientX - t.left, this._pointerY = e.clientY - t.top, this._unTranslatedPointerX = this._pointerX, this._unTranslatedPointerY = this._pointerY);
  }
  _processPointerMove(e, t) {
    const i = this._scene, r = i.getEngine(), s = r.getInputElement();
    s && (s.tabIndex = r.canvasTabIndex, i.doNotHandleCursors || (s.style.cursor = i.defaultCursor)), this._setCursorAndPointerOverMesh(e, t, i);
    for (const h of i._pointerMoveStage) {
      e = e || this._pickMove(t);
      const l = !!e?.pickedMesh;
      e = h.action(this._unTranslatedPointerX, this._unTranslatedPointerY, e, l, s);
    }
    const a = t.inputIndex >= c.MouseWheelX && t.inputIndex <= c.MouseWheelZ ? v.POINTERWHEEL : v.POINTERMOVE;
    i.onPointerMove && (e = e || this._pickMove(t), i.onPointerMove(t, e, a));
    let o;
    e ? (o = new w(a, t, e), this._setRayOnPointerInfo(e, t)) : (o = new w(a, t, null, this), this._movePointerInfo = o), i.onPointerObservable.hasObservers() && i.onPointerObservable.notifyObservers(o, a);
  }
  // Pointers handling
  /** @internal */
  _setRayOnPointerInfo(e, t) {
    const i = this._scene;
    e && i._pickingAvailable && (e.ray || (e.ray = i.createPickingRay(t.offsetX, t.offsetY, me.Identity(), i.activeCamera)));
  }
  /** @internal */
  _addCameraPointerObserver(e, t) {
    return this._cameraObserverCount++, this._scene.onPointerObservable.add(e, t);
  }
  /** @internal */
  _removeCameraPointerObserver(e) {
    return this._cameraObserverCount--, this._scene.onPointerObservable.remove(e);
  }
  _checkForPicking() {
    return !!(this._scene.onPointerObservable.observers.length > this._cameraObserverCount || this._scene.onPointerPick);
  }
  _checkPrePointerObservable(e, t, i) {
    const r = this._scene, s = new Ie(i, t, this._unTranslatedPointerX, this._unTranslatedPointerY);
    return e && (s.originalPickingInfo = e, s.ray = e.ray, t.pointerType === "xr-near" && e.originMesh && (s.nearInteractionPickingInfo = e)), r.onPrePointerObservable.notifyObservers(s, i), !!s.skipOnPointerObservable;
  }
  /** @internal */
  _pickMove(e) {
    const t = this._scene, i = t.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, t.pointerMovePredicate, t.pointerMoveFastCheck, t.cameraToUseForPointers, t.pointerMoveTrianglePredicate);
    return this._setCursorAndPointerOverMesh(i, e, t), i;
  }
  _setCursorAndPointerOverMesh(e, t, i) {
    const s = i.getEngine().getInputElement();
    if (e?.pickedMesh) {
      if (this.setPointerOverMesh(e.pickedMesh, t.pointerId, e, t), !i.doNotHandleCursors && s && this._pointerOverMesh) {
        const a = this._pointerOverMesh._getActionManagerForTrigger();
        a && a.hasPointerTriggers && (s.style.cursor = a.hoverCursor || i.hoverCursor);
      }
    } else
      this.setPointerOverMesh(null, t.pointerId, e, t);
  }
  /**
   * Use this method to simulate a pointer move on a mesh
   * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
   * @param pickResult - pickingInfo of the object wished to simulate pointer event on
   * @param pointerEventInit - pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
   */
  simulatePointerMove(e, t) {
    const i = new PointerEvent("pointermove", t);
    i.inputIndex = c.Move, !this._checkPrePointerObservable(e, i, v.POINTERMOVE) && this._processPointerMove(e, i);
  }
  /**
   * Use this method to simulate a pointer down on a mesh
   * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
   * @param pickResult - pickingInfo of the object wished to simulate pointer event on
   * @param pointerEventInit - pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
   */
  simulatePointerDown(e, t) {
    const i = new PointerEvent("pointerdown", t);
    i.inputIndex = i.button + 2, !this._checkPrePointerObservable(e, i, v.POINTERDOWN) && this._processPointerDown(e, i);
  }
  _processPointerDown(e, t) {
    const i = this._scene;
    if (e?.pickedMesh) {
      this._pickedDownMesh = e.pickedMesh;
      const a = e.pickedMesh._getActionManagerForTrigger();
      if (a) {
        if (a.hasPickTriggers)
          switch (a.processTrigger(5, T.CreateNew(e.pickedMesh, t, e)), t.button) {
            case 0:
              a.processTrigger(2, T.CreateNew(e.pickedMesh, t, e));
              break;
            case 1:
              a.processTrigger(4, T.CreateNew(e.pickedMesh, t, e));
              break;
            case 2:
              a.processTrigger(3, T.CreateNew(e.pickedMesh, t, e));
              break;
          }
        a.hasSpecificTrigger(8) && window.setTimeout(() => {
          const o = i.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, (h) => h.isPickable && h.isVisible && h.isReady() && h.actionManager && h.actionManager.hasSpecificTrigger(8) && h === this._pickedDownMesh, !1, i.cameraToUseForPointers);
          o?.pickedMesh && a && this._totalPointersPressed !== 0 && Date.now() - this._startingPointerTime > E.LongPressDelay && !this._isPointerSwiping() && (this._startingPointerTime = 0, a.processTrigger(8, T.CreateNew(o.pickedMesh, t)));
        }, E.LongPressDelay);
      }
    } else
      for (const a of i._pointerDownStage)
        e = a.action(this._unTranslatedPointerX, this._unTranslatedPointerY, e, t, !1);
    let r;
    const s = v.POINTERDOWN;
    e ? (i.onPointerDown && i.onPointerDown(t, e, s), r = new w(s, t, e), this._setRayOnPointerInfo(e, t)) : r = new w(s, t, null, this), i.onPointerObservable.hasObservers() && i.onPointerObservable.notifyObservers(r, s);
  }
  /**
   * @internal
   * @internals Boolean if delta for pointer exceeds drag movement threshold
   */
  _isPointerSwiping() {
    return this._isSwiping;
  }
  /**
   * Use this method to simulate a pointer up on a mesh
   * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
   * @param pickResult - pickingInfo of the object wished to simulate pointer event on
   * @param pointerEventInit - pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
   * @param doubleTap - indicates that the pointer up event should be considered as part of a double click (false by default)
   */
  simulatePointerUp(e, t, i) {
    const r = new PointerEvent("pointerup", t);
    r.inputIndex = c.Move;
    const s = new pe();
    i ? s.doubleClick = !0 : s.singleClick = !0, !this._checkPrePointerObservable(e, r, v.POINTERUP) && this._processPointerUp(e, r, s);
  }
  _processPointerUp(e, t, i) {
    const r = this._scene;
    if (e?.pickedMesh) {
      if (this._pickedUpMesh = e.pickedMesh, this._pickedDownMesh === this._pickedUpMesh && (r.onPointerPick && r.onPointerPick(t, e), i.singleClick && !i.ignore && r.onPointerObservable.observers.length > this._cameraObserverCount)) {
        const a = v.POINTERPICK, o = new w(a, t, e);
        this._setRayOnPointerInfo(e, t), r.onPointerObservable.notifyObservers(o, a);
      }
      const s = e.pickedMesh._getActionManagerForTrigger();
      if (s && !i.ignore) {
        s.processTrigger(7, T.CreateNew(e.pickedMesh, t, e)), !i.hasSwiped && i.singleClick && s.processTrigger(1, T.CreateNew(e.pickedMesh, t, e));
        const a = e.pickedMesh._getActionManagerForTrigger(6);
        i.doubleClick && a && a.processTrigger(6, T.CreateNew(e.pickedMesh, t, e));
      }
    } else if (!i.ignore)
      for (const s of r._pointerUpStage)
        e = s.action(this._unTranslatedPointerX, this._unTranslatedPointerY, e, t, i.doubleClick);
    if (this._pickedDownMesh && this._pickedDownMesh !== this._pickedUpMesh) {
      const s = this._pickedDownMesh._getActionManagerForTrigger(16);
      s && s.processTrigger(16, T.CreateNew(this._pickedDownMesh, t));
    }
    if (!i.ignore) {
      const s = new w(v.POINTERUP, t, e);
      if (this._setRayOnPointerInfo(e, t), r.onPointerObservable.notifyObservers(s, v.POINTERUP), r.onPointerUp && r.onPointerUp(t, e, v.POINTERUP), !i.hasSwiped && !this._skipPointerTap && !this._isMultiTouchGesture) {
        let a = 0;
        if (i.singleClick ? a = v.POINTERTAP : i.doubleClick && (a = v.POINTERDOUBLETAP), a) {
          const o = new w(a, t, e);
          r.onPointerObservable.hasObservers() && r.onPointerObservable.hasSpecificMask(a) && r.onPointerObservable.notifyObservers(o, a);
        }
      }
    }
  }
  /**
   * Gets a boolean indicating if the current pointer event is captured (meaning that the scene has already handled the pointer down)
   * @param pointerId - defines the pointer id to use in a multi-touch scenario (0 by default)
   * @returns true if the pointer was captured
   */
  isPointerCaptured(e = 0) {
    return this._pointerCaptures[e];
  }
  /**
   * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
   * @param attachUp - defines if you want to attach events to pointerup
   * @param attachDown - defines if you want to attach events to pointerdown
   * @param attachMove - defines if you want to attach events to pointermove
   * @param elementToAttachTo - defines the target DOM element to attach to (will use the canvas by default)
   */
  attachControl(e = !0, t = !0, i = !0, r = null) {
    const s = this._scene, a = s.getEngine();
    r || (r = a.getInputElement()), this._alreadyAttached && this.detachControl(), r && (this._alreadyAttachedTo = r), this._deviceSourceManager = new Le(a), this._initActionManager = (o) => {
      if (!this._meshPickProceed) {
        const h = s.skipPointerUpPicking || s._registeredActions === 0 && !this._checkForPicking() && !s.onPointerUp ? null : s.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, s.pointerUpPredicate, s.pointerUpFastCheck, s.cameraToUseForPointers, s.pointerUpTrianglePredicate);
        this._currentPickResult = h, h && (o = h.hit && h.pickedMesh ? h.pickedMesh._getActionManagerForTrigger() : null), this._meshPickProceed = !0;
      }
      return o;
    }, this._delayedSimpleClick = (o, h, l) => {
      if ((Date.now() - this._previousStartingPointerTime > E.DoubleClickDelay && !this._doubleClickOccured || o !== this._previousButtonPressed) && (this._doubleClickOccured = !1, h.singleClick = !0, h.ignore = !1, this._delayedClicks[o])) {
        const g = this._delayedClicks[o].evt, f = v.POINTERTAP, P = new w(f, g, this._currentPickResult);
        s.onPointerObservable.hasObservers() && s.onPointerObservable.hasSpecificMask(f) && s.onPointerObservable.notifyObservers(P, f), this._delayedClicks[o] = null;
      }
    }, this._initClickEvent = (o, h, l, g) => {
      const f = new pe();
      this._currentPickResult = null;
      let P = null, B = o.hasSpecificMask(v.POINTERPICK) || h.hasSpecificMask(v.POINTERPICK) || o.hasSpecificMask(v.POINTERTAP) || h.hasSpecificMask(v.POINTERTAP) || o.hasSpecificMask(v.POINTERDOUBLETAP) || h.hasSpecificMask(v.POINTERDOUBLETAP);
      !B && A && (P = this._initActionManager(P, f), P && (B = P.hasPickTriggers));
      let W = !1;
      if (B) {
        const D = l.button;
        if (f.hasSwiped = this._isPointerSwiping(), !f.hasSwiped) {
          let Y = !E.ExclusiveDoubleClickMode;
          if (Y || (Y = !o.hasSpecificMask(v.POINTERDOUBLETAP) && !h.hasSpecificMask(v.POINTERDOUBLETAP), Y && !A.HasSpecificTrigger(6) && (P = this._initActionManager(P, f), P && (Y = !P.hasSpecificTrigger(6)))), Y)
            (Date.now() - this._previousStartingPointerTime > E.DoubleClickDelay || D !== this._previousButtonPressed) && (f.singleClick = !0, g(f, this._currentPickResult), W = !0);
          else {
            const be = {
              evt: l,
              clickInfo: f,
              timeoutId: window.setTimeout(this._delayedSimpleClick.bind(this, D, f, g), E.DoubleClickDelay)
            };
            this._delayedClicks[D] = be;
          }
          let Z = o.hasSpecificMask(v.POINTERDOUBLETAP) || h.hasSpecificMask(v.POINTERDOUBLETAP);
          !Z && A.HasSpecificTrigger(6) && (P = this._initActionManager(P, f), P && (Z = P.hasSpecificTrigger(6))), Z && (D === this._previousButtonPressed && Date.now() - this._previousStartingPointerTime < E.DoubleClickDelay && !this._doubleClickOccured ? (!f.hasSwiped && !this._isPointerSwiping() ? (this._previousStartingPointerTime = 0, this._doubleClickOccured = !0, f.doubleClick = !0, f.ignore = !1, E.ExclusiveDoubleClickMode && this._delayedClicks[D] && (clearTimeout(this._delayedClicks[D]?.timeoutId), this._delayedClicks[D] = null), g(f, this._currentPickResult)) : (this._doubleClickOccured = !1, this._previousStartingPointerTime = this._startingPointerTime, this._previousStartingPointerPosition.x = this._startingPointerPosition.x, this._previousStartingPointerPosition.y = this._startingPointerPosition.y, this._previousButtonPressed = D, E.ExclusiveDoubleClickMode ? (this._delayedClicks[D] && (clearTimeout(this._delayedClicks[D]?.timeoutId), this._delayedClicks[D] = null), g(f, this._previousPickResult)) : g(f, this._currentPickResult)), W = !0) : (this._doubleClickOccured = !1, this._previousStartingPointerTime = this._startingPointerTime, this._previousStartingPointerPosition.x = this._startingPointerPosition.x, this._previousStartingPointerPosition.y = this._startingPointerPosition.y, this._previousButtonPressed = D));
        }
      }
      W || g(f, this._currentPickResult);
    }, this._onPointerMove = (o) => {
      if (this._updatePointerPosition(o), !this._isSwiping && this._swipeButtonPressed !== -1 && (this._isSwiping = Math.abs(this._startingPointerPosition.x - this._pointerX) > E.DragMovementThreshold || Math.abs(this._startingPointerPosition.y - this._pointerY) > E.DragMovementThreshold), a.isPointerLock && a._verifyPointerLock(), this._checkPrePointerObservable(null, o, o.inputIndex >= c.MouseWheelX && o.inputIndex <= c.MouseWheelZ ? v.POINTERWHEEL : v.POINTERMOVE) || !s.cameraToUseForPointers && !s.activeCamera)
        return;
      if (s.skipPointerMovePicking) {
        this._processPointerMove(new q(), o);
        return;
      }
      s.pointerMovePredicate || (s.pointerMovePredicate = (l) => l.isPickable && l.isVisible && l.isReady() && l.isEnabled() && (l.enablePointerMoveEvents || s.constantlyUpdateMeshUnderPointer || l._getActionManagerForTrigger() !== null) && (!s.cameraToUseForPointers || (s.cameraToUseForPointers.layerMask & l.layerMask) !== 0));
      const h = s._registeredActions > 0 || s.constantlyUpdateMeshUnderPointer ? this._pickMove(o) : null;
      this._processPointerMove(h, o);
    }, this._onPointerDown = (o) => {
      if (this._totalPointersPressed++, this._pickedDownMesh = null, this._meshPickProceed = !1, E.ExclusiveDoubleClickMode) {
        for (let l = 0; l < this._delayedClicks.length; l++)
          if (this._delayedClicks[l])
            if (o.button === l)
              clearTimeout(this._delayedClicks[l]?.timeoutId);
            else {
              const g = this._delayedClicks[l].clickInfo;
              this._doubleClickOccured = !1, g.singleClick = !0, g.ignore = !1;
              const f = this._delayedClicks[l].evt, P = v.POINTERTAP, B = new w(P, f, this._currentPickResult);
              s.onPointerObservable.hasObservers() && s.onPointerObservable.hasSpecificMask(P) && s.onPointerObservable.notifyObservers(B, P), this._delayedClicks[l] = null;
            }
      }
      if (this._updatePointerPosition(o), this._swipeButtonPressed === -1 && (this._swipeButtonPressed = o.button), s.preventDefaultOnPointerDown && r && (o.preventDefault(), r.focus()), this._startingPointerPosition.x = this._pointerX, this._startingPointerPosition.y = this._pointerY, this._startingPointerTime = Date.now(), this._checkPrePointerObservable(null, o, v.POINTERDOWN) || !s.cameraToUseForPointers && !s.activeCamera)
        return;
      this._pointerCaptures[o.pointerId] = !0, s.pointerDownPredicate || (s.pointerDownPredicate = (l) => l.isPickable && l.isVisible && l.isReady() && l.isEnabled() && (!s.cameraToUseForPointers || (s.cameraToUseForPointers.layerMask & l.layerMask) !== 0)), this._pickedDownMesh = null;
      let h;
      s.skipPointerDownPicking || s._registeredActions === 0 && !this._checkForPicking() && !s.onPointerDown ? h = new q() : h = s.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, s.pointerDownPredicate, s.pointerDownFastCheck, s.cameraToUseForPointers, s.pointerDownTrianglePredicate), this._processPointerDown(h, o);
    }, this._onPointerUp = (o) => {
      this._totalPointersPressed !== 0 && (this._totalPointersPressed--, this._pickedUpMesh = null, this._meshPickProceed = !1, this._updatePointerPosition(o), s.preventDefaultOnPointerUp && r && (o.preventDefault(), r.focus()), this._initClickEvent(s.onPrePointerObservable, s.onPointerObservable, o, (h, l) => {
        if (s.onPrePointerObservable.hasObservers() && (this._skipPointerTap = !1, !h.ignore)) {
          if (this._checkPrePointerObservable(null, o, v.POINTERUP)) {
            this._swipeButtonPressed === o.button && (this._isSwiping = !1, this._swipeButtonPressed = -1), o.buttons === 0 && (this._pointerCaptures[o.pointerId] = !1);
            return;
          }
          h.hasSwiped || (h.singleClick && s.onPrePointerObservable.hasSpecificMask(v.POINTERTAP) && this._checkPrePointerObservable(null, o, v.POINTERTAP) && (this._skipPointerTap = !0), h.doubleClick && s.onPrePointerObservable.hasSpecificMask(v.POINTERDOUBLETAP) && this._checkPrePointerObservable(null, o, v.POINTERDOUBLETAP) && (this._skipPointerTap = !0));
        }
        if (!this._pointerCaptures[o.pointerId]) {
          this._swipeButtonPressed === o.button && (this._isSwiping = !1, this._swipeButtonPressed = -1);
          return;
        }
        o.buttons === 0 && (this._pointerCaptures[o.pointerId] = !1), !(!s.cameraToUseForPointers && !s.activeCamera) && (s.pointerUpPredicate || (s.pointerUpPredicate = (g) => g.isPickable && g.isVisible && g.isReady() && g.isEnabled() && (!s.cameraToUseForPointers || (s.cameraToUseForPointers.layerMask & g.layerMask) !== 0)), !this._meshPickProceed && (A && A.HasTriggers || this._checkForPicking() || s.onPointerUp) && this._initActionManager(null, h), l || (l = this._currentPickResult), this._processPointerUp(l, o, h), this._previousPickResult = this._currentPickResult, this._swipeButtonPressed === o.button && (this._isSwiping = !1, this._swipeButtonPressed = -1));
      }));
    }, this._onKeyDown = (o) => {
      const h = X.KEYDOWN;
      if (s.onPreKeyboardObservable.hasObservers()) {
        const l = new oe(h, o);
        if (s.onPreKeyboardObservable.notifyObservers(l, h), l.skipOnKeyboardObservable)
          return;
      }
      if (s.onKeyboardObservable.hasObservers()) {
        const l = new J(h, o);
        s.onKeyboardObservable.notifyObservers(l, h);
      }
      s.actionManager && s.actionManager.processTrigger(14, T.CreateNewFromScene(s, o));
    }, this._onKeyUp = (o) => {
      const h = X.KEYUP;
      if (s.onPreKeyboardObservable.hasObservers()) {
        const l = new oe(h, o);
        if (s.onPreKeyboardObservable.notifyObservers(l, h), l.skipOnKeyboardObservable)
          return;
      }
      if (s.onKeyboardObservable.hasObservers()) {
        const l = new J(h, o);
        s.onKeyboardObservable.notifyObservers(l, h);
      }
      s.actionManager && s.actionManager.processTrigger(15, T.CreateNewFromScene(s, o));
    }, this._deviceSourceManager.onDeviceConnectedObservable.add((o) => {
      o.deviceType === d.Mouse ? o.onInputChangedObservable.add((h) => {
        h.inputIndex === c.LeftClick || h.inputIndex === c.MiddleClick || h.inputIndex === c.RightClick || h.inputIndex === c.BrowserBack || h.inputIndex === c.BrowserForward ? t && o.getInput(h.inputIndex) === 1 ? this._onPointerDown(h) : e && o.getInput(h.inputIndex) === 0 && this._onPointerUp(h) : i && (h.inputIndex === c.Move ? this._onPointerMove(h) : (h.inputIndex === c.MouseWheelX || h.inputIndex === c.MouseWheelY || h.inputIndex === c.MouseWheelZ) && this._onPointerMove(h));
      }) : o.deviceType === d.Touch ? o.onInputChangedObservable.add((h) => {
        h.inputIndex === c.LeftClick && (t && o.getInput(h.inputIndex) === 1 ? (this._onPointerDown(h), this._totalPointersPressed > 1 && (this._isMultiTouchGesture = !0)) : e && o.getInput(h.inputIndex) === 0 && (this._onPointerUp(h), this._totalPointersPressed === 0 && (this._isMultiTouchGesture = !1))), i && h.inputIndex === c.Move && this._onPointerMove(h);
      }) : o.deviceType === d.Keyboard && o.onInputChangedObservable.add((h) => {
        h.type === "keydown" ? this._onKeyDown(h) : h.type === "keyup" && this._onKeyUp(h);
      });
    }), this._alreadyAttached = !0;
  }
  /**
   * Detaches all event handlers
   */
  detachControl() {
    this._alreadyAttached && (this._deviceSourceManager.dispose(), this._deviceSourceManager = null, this._alreadyAttachedTo && !this._scene.doNotHandleCursors && (this._alreadyAttachedTo.style.cursor = this._scene.defaultCursor), this._alreadyAttached = !1, this._alreadyAttachedTo = null);
  }
  /**
   * Force the value of meshUnderPointer
   * @param mesh - defines the mesh to use
   * @param pointerId - optional pointer id when using more than one pointer. Defaults to 0
   * @param pickResult - optional pickingInfo data used to find mesh
   * @param evt - optional pointer event
   */
  setPointerOverMesh(e, t = 0, i, r) {
    if (this._meshUnderPointerId[t] === e && (!e || !e._internalAbstractMeshDataInfo._pointerOverDisableMeshTesting))
      return;
    const s = this._meshUnderPointerId[t];
    let a;
    s && (a = s._getActionManagerForTrigger(10), a && a.processTrigger(10, T.CreateNew(s, r, { pointerId: t }))), e ? (this._meshUnderPointerId[t] = e, this._pointerOverMesh = e, a = e._getActionManagerForTrigger(9), a && a.processTrigger(9, T.CreateNew(e, r, { pointerId: t, pickResult: i }))) : (delete this._meshUnderPointerId[t], this._pointerOverMesh = null);
  }
  /**
   * Gets the mesh under the pointer
   * @returns a Mesh or null if no mesh is under the pointer
   */
  getPointerOverMesh() {
    return this.meshUnderPointer;
  }
  /**
   * @param mesh - Mesh to invalidate
   * @internal
   */
  _invalidateMesh(e) {
    this._pointerOverMesh === e && (this._pointerOverMesh = null), this._pickedDownMesh === e && (this._pickedDownMesh = null), this._pickedUpMesh === e && (this._pickedUpMesh = null);
    for (const t in this._meshUnderPointerId)
      this._meshUnderPointerId[t] === e && delete this._meshUnderPointerId[t];
  }
}
E.DragMovementThreshold = 10;
E.LongPressDelay = 500;
E.DoubleClickDelay = 300;
E.ExclusiveDoubleClickMode = !1;
class ve {
  /**
   * Gets an unique (relatively to the current scene) Id
   */
  static get UniqueId() {
    const e = this._UniqueIdCounter;
    return this._UniqueIdCounter++, e;
  }
}
ve._UniqueIdCounter = 1;
class Ge {
  constructor() {
    this.pointerDownFastCheck = !1, this.pointerUpFastCheck = !1, this.pointerMoveFastCheck = !1, this.skipPointerMovePicking = !1, this.skipPointerDownPicking = !1, this.skipPointerUpPicking = !1;
  }
}
var U;
(function(n) {
  n[n.BackwardCompatible = 0] = "BackwardCompatible", n[n.Intermediate = 1] = "Intermediate", n[n.Aggressive = 2] = "Aggressive";
})(U || (U = {}));
class R extends ee {
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Factory used to create the default material.
   * @param scene The scene to create the material for
   * @returns The default material
   */
  static DefaultMaterialFactory(e) {
    throw k("StandardMaterial");
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Factory used to create the a collision coordinator.
   * @returns The collision coordinator
   */
  static CollisionCoordinatorFactory() {
    throw k("DefaultCollisionCoordinator");
  }
  /**
   * Texture used in all pbr material as the reflection texture.
   * As in the majority of the scene they are the same (exception for multi room and so on),
   * this is easier to reference from here than from all the materials.
   */
  get environmentTexture() {
    return this._environmentTexture;
  }
  /**
   * Texture used in all pbr material as the reflection texture.
   * As in the majority of the scene they are the same (exception for multi room and so on),
   * this is easier to set here than in all the materials.
   */
  set environmentTexture(e) {
    this._environmentTexture !== e && (this._environmentTexture = e, this.markAllMaterialsAsDirty(1));
  }
  /**
   * Default image processing configuration used either in the rendering
   * Forward main pass or through the imageProcessingPostProcess if present.
   * As in the majority of the scene they are the same (exception for multi camera),
   * this is easier to reference from here than from all the materials and post process.
   *
   * No setter as we it is a shared configuration, you can set the values instead.
   */
  get imageProcessingConfiguration() {
    return this._imageProcessingConfiguration;
  }
  /**
   * Gets or sets a value indicating how to treat performance relatively to ease of use and backward compatibility
   */
  get performancePriority() {
    return this._performancePriority;
  }
  set performancePriority(e) {
    if (e !== this._performancePriority) {
      switch (this._performancePriority = e, e) {
        case U.BackwardCompatible:
          this.skipFrustumClipping = !1, this._renderingManager.maintainStateBetweenFrames = !1, this.skipPointerMovePicking = !1, this.autoClear = !0;
          break;
        case U.Intermediate:
          this.skipFrustumClipping = !1, this._renderingManager.maintainStateBetweenFrames = !1, this.skipPointerMovePicking = !0, this.autoClear = !1;
          break;
        case U.Aggressive:
          this.skipFrustumClipping = !0, this._renderingManager.maintainStateBetweenFrames = !0, this.skipPointerMovePicking = !0, this.autoClear = !1;
          break;
      }
      this.onScenePerformancePriorityChangedObservable.notifyObservers(e);
    }
  }
  /**
   * Gets or sets a boolean indicating if all rendering must be done in wireframe
   */
  set forceWireframe(e) {
    this._forceWireframe !== e && (this._forceWireframe = e, this.markAllMaterialsAsDirty(16));
  }
  get forceWireframe() {
    return this._forceWireframe;
  }
  /**
   * Gets or sets a boolean indicating if we should skip the frustum clipping part of the active meshes selection
   */
  set skipFrustumClipping(e) {
    this._skipFrustumClipping !== e && (this._skipFrustumClipping = e);
  }
  get skipFrustumClipping() {
    return this._skipFrustumClipping;
  }
  /**
   * Gets or sets a boolean indicating if all rendering must be done in point cloud
   */
  set forcePointsCloud(e) {
    this._forcePointsCloud !== e && (this._forcePointsCloud = e, this.markAllMaterialsAsDirty(16));
  }
  get forcePointsCloud() {
    return this._forcePointsCloud;
  }
  /**
   * Gets or sets the animation properties override
   */
  get animationPropertiesOverride() {
    return this._animationPropertiesOverride;
  }
  set animationPropertiesOverride(e) {
    this._animationPropertiesOverride = e;
  }
  /** Sets a function to be executed when this scene is disposed. */
  set onDispose(e) {
    this._onDisposeObserver && this.onDisposeObservable.remove(this._onDisposeObserver), this._onDisposeObserver = this.onDisposeObservable.add(e);
  }
  /** Sets a function to be executed before rendering this scene */
  set beforeRender(e) {
    this._onBeforeRenderObserver && this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver), e && (this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(e));
  }
  /** Sets a function to be executed after rendering this scene */
  set afterRender(e) {
    this._onAfterRenderObserver && this.onAfterRenderObservable.remove(this._onAfterRenderObserver), e && (this._onAfterRenderObserver = this.onAfterRenderObservable.add(e));
  }
  /** Sets a function to be executed before rendering a camera*/
  set beforeCameraRender(e) {
    this._onBeforeCameraRenderObserver && this.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver), this._onBeforeCameraRenderObserver = this.onBeforeCameraRenderObservable.add(e);
  }
  /** Sets a function to be executed after rendering a camera*/
  set afterCameraRender(e) {
    this._onAfterCameraRenderObserver && this.onAfterCameraRenderObservable.remove(this._onAfterCameraRenderObserver), this._onAfterCameraRenderObserver = this.onAfterCameraRenderObservable.add(e);
  }
  /**
   * Gets or sets a predicate used to select candidate meshes for a pointer down event
   */
  get pointerDownPredicate() {
    return this._pointerPickingConfiguration.pointerDownPredicate;
  }
  set pointerDownPredicate(e) {
    this._pointerPickingConfiguration.pointerDownPredicate = e;
  }
  /**
   * Gets or sets a predicate used to select candidate meshes for a pointer up event
   */
  get pointerUpPredicate() {
    return this._pointerPickingConfiguration.pointerUpPredicate;
  }
  set pointerUpPredicate(e) {
    this._pointerPickingConfiguration.pointerUpPredicate = e;
  }
  /**
   * Gets or sets a predicate used to select candidate meshes for a pointer move event
   */
  get pointerMovePredicate() {
    return this._pointerPickingConfiguration.pointerMovePredicate;
  }
  set pointerMovePredicate(e) {
    this._pointerPickingConfiguration.pointerMovePredicate = e;
  }
  /**
   * Gets or sets a predicate used to select candidate meshes for a pointer down event
   */
  get pointerDownFastCheck() {
    return this._pointerPickingConfiguration.pointerDownFastCheck;
  }
  set pointerDownFastCheck(e) {
    this._pointerPickingConfiguration.pointerDownFastCheck = e;
  }
  /**
   * Gets or sets a predicate used to select candidate meshes for a pointer up event
   */
  get pointerUpFastCheck() {
    return this._pointerPickingConfiguration.pointerUpFastCheck;
  }
  set pointerUpFastCheck(e) {
    this._pointerPickingConfiguration.pointerUpFastCheck = e;
  }
  /**
   * Gets or sets a predicate used to select candidate meshes for a pointer move event
   */
  get pointerMoveFastCheck() {
    return this._pointerPickingConfiguration.pointerMoveFastCheck;
  }
  set pointerMoveFastCheck(e) {
    this._pointerPickingConfiguration.pointerMoveFastCheck = e;
  }
  /**
   * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer move event occurs.
   */
  get skipPointerMovePicking() {
    return this._pointerPickingConfiguration.skipPointerMovePicking;
  }
  set skipPointerMovePicking(e) {
    this._pointerPickingConfiguration.skipPointerMovePicking = e;
  }
  /**
   * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer down event occurs.
   */
  get skipPointerDownPicking() {
    return this._pointerPickingConfiguration.skipPointerDownPicking;
  }
  set skipPointerDownPicking(e) {
    this._pointerPickingConfiguration.skipPointerDownPicking = e;
  }
  /**
   * Gets or sets a boolean indicating if the user want to entirely skip the picking phase when a pointer up event occurs.  Off by default.
   */
  get skipPointerUpPicking() {
    return this._pointerPickingConfiguration.skipPointerUpPicking;
  }
  set skipPointerUpPicking(e) {
    this._pointerPickingConfiguration.skipPointerUpPicking = e;
  }
  /**
   * Gets the pointer coordinates without any translation (ie. straight out of the pointer event)
   */
  get unTranslatedPointer() {
    return this._inputManager.unTranslatedPointer;
  }
  /**
   * Gets or sets the distance in pixel that you have to move to prevent some events. Default is 10 pixels
   */
  static get DragMovementThreshold() {
    return E.DragMovementThreshold;
  }
  static set DragMovementThreshold(e) {
    E.DragMovementThreshold = e;
  }
  /**
   * Time in milliseconds to wait to raise long press events if button is still pressed. Default is 500 ms
   */
  static get LongPressDelay() {
    return E.LongPressDelay;
  }
  static set LongPressDelay(e) {
    E.LongPressDelay = e;
  }
  /**
   * Time in milliseconds to wait to raise long press events if button is still pressed. Default is 300 ms
   */
  static get DoubleClickDelay() {
    return E.DoubleClickDelay;
  }
  static set DoubleClickDelay(e) {
    E.DoubleClickDelay = e;
  }
  /** If you need to check double click without raising a single click at first click, enable this flag */
  static get ExclusiveDoubleClickMode() {
    return E.ExclusiveDoubleClickMode;
  }
  static set ExclusiveDoubleClickMode(e) {
    E.ExclusiveDoubleClickMode = e;
  }
  /**
   * Bind the current view position to an effect.
   * @param effect The effect to be bound
   * @param variableName name of the shader variable that will hold the eye position
   * @param isVector3 true to indicates that variableName is a Vector3 and not a Vector4
   * @returns the computed eye position
   */
  bindEyePosition(e, t = "vEyePosition", i = !1) {
    const r = this._forcedViewPosition ? this._forcedViewPosition : this._mirroredCameraPosition ? this._mirroredCameraPosition : this.activeCamera.globalPosition, s = this.useRightHandedSystem === (this._mirroredCameraPosition != null);
    return O.Vector4[0].set(r.x, r.y, r.z, s ? -1 : 1), e && (i ? e.setFloat3(t, O.Vector4[0].x, O.Vector4[0].y, O.Vector4[0].z) : e.setVector4(t, O.Vector4[0])), O.Vector4[0];
  }
  /**
   * Update the scene ubo before it can be used in rendering processing
   * @returns the scene UniformBuffer
   */
  finalizeSceneUbo() {
    const e = this.getSceneUniformBuffer(), t = this.bindEyePosition(null);
    return e.updateFloat4("vEyePosition", t.x, t.y, t.z, t.w), e.update(), e;
  }
  /**
   * Gets or sets a boolean indicating if the scene must use right-handed coordinates system
   */
  set useRightHandedSystem(e) {
    this._useRightHandedSystem !== e && (this._useRightHandedSystem = e, this.markAllMaterialsAsDirty(16));
  }
  get useRightHandedSystem() {
    return this._useRightHandedSystem;
  }
  /**
   * Sets the step Id used by deterministic lock step
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
   * @param newStepId defines the step Id
   */
  setStepId(e) {
    this._currentStepId = e;
  }
  /**
   * Gets the step Id used by deterministic lock step
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
   * @returns the step Id
   */
  getStepId() {
    return this._currentStepId;
  }
  /**
   * Gets the internal step used by deterministic lock step
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
   * @returns the internal step
   */
  getInternalStep() {
    return this._currentInternalStep;
  }
  /**
   * Gets or sets a boolean indicating if fog is enabled on this scene
   * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/environment_introduction#fog
   * (Default is true)
   */
  set fogEnabled(e) {
    this._fogEnabled !== e && (this._fogEnabled = e, this.markAllMaterialsAsDirty(16));
  }
  get fogEnabled() {
    return this._fogEnabled;
  }
  /**
   * Gets or sets the fog mode to use
   * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/environment_introduction#fog
   * | mode | value |
   * | --- | --- |
   * | FOGMODE_NONE | 0 |
   * | FOGMODE_EXP | 1 |
   * | FOGMODE_EXP2 | 2 |
   * | FOGMODE_LINEAR | 3 |
   */
  set fogMode(e) {
    this._fogMode !== e && (this._fogMode = e, this.markAllMaterialsAsDirty(16));
  }
  get fogMode() {
    return this._fogMode;
  }
  /**
   * Flag indicating that the frame buffer binding is handled by another component
   */
  get prePass() {
    return !!this.prePassRenderer && this.prePassRenderer.defaultRT.enabled;
  }
  /**
   * Gets or sets a boolean indicating if shadows are enabled on this scene
   */
  set shadowsEnabled(e) {
    this._shadowsEnabled !== e && (this._shadowsEnabled = e, this.markAllMaterialsAsDirty(2));
  }
  get shadowsEnabled() {
    return this._shadowsEnabled;
  }
  /**
   * Gets or sets a boolean indicating if lights are enabled on this scene
   */
  set lightsEnabled(e) {
    this._lightsEnabled !== e && (this._lightsEnabled = e, this.markAllMaterialsAsDirty(2));
  }
  get lightsEnabled() {
    return this._lightsEnabled;
  }
  /** All of the active cameras added to this scene. */
  get activeCameras() {
    return this._activeCameras;
  }
  set activeCameras(e) {
    this._unObserveActiveCameras && (this._unObserveActiveCameras(), this._unObserveActiveCameras = null), e && (this._unObserveActiveCameras = Ee(e, () => {
      this.onActiveCamerasChanged.notifyObservers(this);
    })), this._activeCameras = e;
  }
  /** Gets or sets the current active camera */
  get activeCamera() {
    return this._activeCamera;
  }
  set activeCamera(e) {
    e !== this._activeCamera && (this._activeCamera = e, this.onActiveCameraChanged.notifyObservers(this));
  }
  /** The default material used on meshes when no material is affected */
  get defaultMaterial() {
    return this._defaultMaterial || (this._defaultMaterial = R.DefaultMaterialFactory(this)), this._defaultMaterial;
  }
  /** The default material used on meshes when no material is affected */
  set defaultMaterial(e) {
    this._defaultMaterial = e;
  }
  /**
   * Gets or sets a boolean indicating if textures are enabled on this scene
   */
  set texturesEnabled(e) {
    this._texturesEnabled !== e && (this._texturesEnabled = e, this.markAllMaterialsAsDirty(1));
  }
  get texturesEnabled() {
    return this._texturesEnabled;
  }
  /**
   * Gets or sets a boolean indicating if skeletons are enabled on this scene
   */
  set skeletonsEnabled(e) {
    this._skeletonsEnabled !== e && (this._skeletonsEnabled = e, this.markAllMaterialsAsDirty(8));
  }
  get skeletonsEnabled() {
    return this._skeletonsEnabled;
  }
  /** @internal */
  get collisionCoordinator() {
    return this._collisionCoordinator || (this._collisionCoordinator = R.CollisionCoordinatorFactory(), this._collisionCoordinator.init(this)), this._collisionCoordinator;
  }
  /**
   * Gets the scene's rendering manager
   */
  get renderingManager() {
    return this._renderingManager;
  }
  /**
   * Gets the list of frustum planes (built from the active camera)
   */
  get frustumPlanes() {
    return this._frustumPlanes;
  }
  /**
   * Registers the transient components if needed.
   */
  _registerTransientComponents() {
    if (this._transientComponents.length > 0) {
      for (const e of this._transientComponents)
        e.register();
      this._transientComponents.length = 0;
    }
  }
  /**
   * @internal
   * Add a component to the scene.
   * Note that the ccomponent could be registered on th next frame if this is called after
   * the register component stage.
   * @param component Defines the component to add to the scene
   */
  _addComponent(e) {
    this._components.push(e), this._transientComponents.push(e);
    const t = e;
    t.addFromContainer && t.serialize && this._serializableComponents.push(t);
  }
  /**
   * @internal
   * Gets a component from the scene.
   * @param name defines the name of the component to retrieve
   * @returns the component or null if not present
   */
  _getComponent(e) {
    for (const t of this._components)
      if (t.name === e)
        return t;
    return null;
  }
  /**
   * Creates a new Scene
   * @param engine defines the engine to use to render this scene
   * @param options defines the scene options
   */
  constructor(e, t) {
    super(), this._inputManager = new E(this), this.cameraToUseForPointers = null, this._isScene = !0, this._blockEntityCollection = !1, this.autoClear = !0, this.autoClearDepthAndStencil = !0, this.clearColor = new x(0.2, 0.2, 0.3, 1), this.ambientColor = new ie(0, 0, 0), this.environmentIntensity = 1, this._performancePriority = U.BackwardCompatible, this.onScenePerformancePriorityChangedObservable = new _(), this._forceWireframe = !1, this._skipFrustumClipping = !1, this._forcePointsCloud = !1, this.animationsEnabled = !0, this._animationPropertiesOverride = null, this.useConstantAnimationDeltaTime = !1, this.constantlyUpdateMeshUnderPointer = !1, this.hoverCursor = "pointer", this.defaultCursor = "", this.doNotHandleCursors = !1, this.preventDefaultOnPointerDown = !0, this.preventDefaultOnPointerUp = !0, this.metadata = null, this.reservedDataStore = null, this.disableOfflineSupportExceptionRules = [], this.onDisposeObservable = new _(), this._onDisposeObserver = null, this.onBeforeRenderObservable = new _(), this._onBeforeRenderObserver = null, this.onAfterRenderObservable = new _(), this.onAfterRenderCameraObservable = new _(), this._onAfterRenderObserver = null, this.onBeforeAnimationsObservable = new _(), this.onAfterAnimationsObservable = new _(), this.onBeforeDrawPhaseObservable = new _(), this.onAfterDrawPhaseObservable = new _(), this.onReadyObservable = new _(), this.onBeforeCameraRenderObservable = new _(), this._onBeforeCameraRenderObserver = null, this.onAfterCameraRenderObservable = new _(), this._onAfterCameraRenderObserver = null, this.onBeforeActiveMeshesEvaluationObservable = new _(), this.onAfterActiveMeshesEvaluationObservable = new _(), this.onBeforeParticlesRenderingObservable = new _(), this.onAfterParticlesRenderingObservable = new _(), this.onDataLoadedObservable = new _(), this.onNewCameraAddedObservable = new _(), this.onCameraRemovedObservable = new _(), this.onNewLightAddedObservable = new _(), this.onLightRemovedObservable = new _(), this.onNewGeometryAddedObservable = new _(), this.onGeometryRemovedObservable = new _(), this.onNewTransformNodeAddedObservable = new _(), this.onTransformNodeRemovedObservable = new _(), this.onNewMeshAddedObservable = new _(), this.onMeshRemovedObservable = new _(), this.onNewSkeletonAddedObservable = new _(), this.onSkeletonRemovedObservable = new _(), this.onNewMaterialAddedObservable = new _(), this.onNewMultiMaterialAddedObservable = new _(), this.onMaterialRemovedObservable = new _(), this.onMultiMaterialRemovedObservable = new _(), this.onNewTextureAddedObservable = new _(), this.onTextureRemovedObservable = new _(), this.onBeforeRenderTargetsRenderObservable = new _(), this.onAfterRenderTargetsRenderObservable = new _(), this.onBeforeStepObservable = new _(), this.onAfterStepObservable = new _(), this.onActiveCameraChanged = new _(), this.onActiveCamerasChanged = new _(), this.onBeforeRenderingGroupObservable = new _(), this.onAfterRenderingGroupObservable = new _(), this.onMeshImportedObservable = new _(), this.onAnimationFileImportedObservable = new _(), this._registeredForLateAnimationBindings = new L(256), this._pointerPickingConfiguration = new Ge(), this.onPrePointerObservable = new _(), this.onPointerObservable = new _(), this.onPreKeyboardObservable = new _(), this.onKeyboardObservable = new _(), this._useRightHandedSystem = !1, this._timeAccumulator = 0, this._currentStepId = 0, this._currentInternalStep = 0, this._fogEnabled = !0, this._fogMode = R.FOGMODE_NONE, this.fogColor = new ie(0.2, 0.2, 0.3), this.fogDensity = 0.1, this.fogStart = 0, this.fogEnd = 1e3, this.needsPreviousWorldMatrices = !1, this._shadowsEnabled = !0, this._lightsEnabled = !0, this._unObserveActiveCameras = null, this._texturesEnabled = !0, this.physicsEnabled = !0, this.particlesEnabled = !0, this.spritesEnabled = !0, this._skeletonsEnabled = !0, this.lensFlaresEnabled = !0, this.collisionsEnabled = !0, this.gravity = new y(0, -9.807, 0), this.postProcessesEnabled = !0, this.renderTargetsEnabled = !0, this.dumpNextRenderTargets = !1, this.customRenderTargets = [], this.importedMeshesFiles = [], this.probesEnabled = !0, this._meshesForIntersections = new L(256), this.proceduralTexturesEnabled = !0, this._totalVertices = new K(), this._activeIndices = new K(), this._activeParticles = new K(), this._activeBones = new K(), this._animationTime = 0, this.animationTimeScale = 1, this._renderId = 0, this._frameId = 0, this._executeWhenReadyTimeoutId = null, this._intermediateRendering = !1, this._defaultFrameBufferCleared = !1, this._viewUpdateFlag = -1, this._projectionUpdateFlag = -1, this._toBeDisposed = new Array(256), this._activeRequests = new Array(), this._pendingData = new Array(), this._isDisposed = !1, this.dispatchAllSubMeshesOfActiveMeshes = !1, this._activeMeshes = new Q(256), this._processedMaterials = new Q(256), this._renderTargets = new L(256), this._materialsRenderTargets = new L(256), this._activeParticleSystems = new Q(256), this._activeSkeletons = new L(32), this._softwareSkinnedMeshes = new L(32), this._activeAnimatables = new Array(), this._transformMatrix = me.Zero(), this.requireLightSorting = !1, this._components = [], this._serializableComponents = [], this._transientComponents = [], this._beforeCameraUpdateStage = C.Create(), this._beforeClearStage = C.Create(), this._beforeRenderTargetClearStage = C.Create(), this._gatherRenderTargetsStage = C.Create(), this._gatherActiveCameraRenderTargetsStage = C.Create(), this._isReadyForMeshStage = C.Create(), this._beforeEvaluateActiveMeshStage = C.Create(), this._evaluateSubMeshStage = C.Create(), this._preActiveMeshStage = C.Create(), this._cameraDrawRenderTargetStage = C.Create(), this._beforeCameraDrawStage = C.Create(), this._beforeRenderTargetDrawStage = C.Create(), this._beforeRenderingGroupDrawStage = C.Create(), this._beforeRenderingMeshStage = C.Create(), this._afterRenderingMeshStage = C.Create(), this._afterRenderingGroupDrawStage = C.Create(), this._afterCameraDrawStage = C.Create(), this._afterCameraPostProcessStage = C.Create(), this._afterRenderTargetDrawStage = C.Create(), this._afterRenderTargetPostProcessStage = C.Create(), this._afterRenderStage = C.Create(), this._pointerMoveStage = C.Create(), this._pointerDownStage = C.Create(), this._pointerUpStage = C.Create(), this._geometriesByUniqueId = null, this._defaultMeshCandidates = {
      data: [],
      length: 0
    }, this._defaultSubMeshCandidates = {
      data: [],
      length: 0
    }, this._preventFreeActiveMeshesAndRenderingGroups = !1, this._activeMeshesFrozen = !1, this._activeMeshesFrozenButKeepClipping = !1, this._skipEvaluateActiveMeshesCompletely = !1, this._allowPostProcessClearColor = !0, this.getDeterministicFrameTime = () => this._engine.getTimeStep(), this._registeredActions = 0, this._blockMaterialDirtyMechanism = !1, this._perfCollector = null, this.activeCameras = [];
    const i = {
      useGeometryUniqueIdsMap: !0,
      useMaterialMeshMap: !0,
      useClonedMeshMap: !0,
      virtual: !1,
      ...t
    };
    e = this._engine = e || G.LastCreatedEngine, i.virtual ? e._virtualScenes.push(this) : (G._LastCreatedScene = this, e.scenes.push(this)), this._uid = null, this._renderingManager = new xe(this), re && (this.postProcessManager = new re(this)), Te() && this.attachControl(), this._createUbo(), p && (this._imageProcessingConfiguration = new p()), this.setDefaultCandidateProviders(), i.useGeometryUniqueIdsMap && (this._geometriesByUniqueId = {}), this.useMaterialMeshMap = i.useMaterialMeshMap, this.useClonedMeshMap = i.useClonedMeshMap, (!t || !t.virtual) && e.onNewSceneAddedObservable.notifyObservers(this);
  }
  /**
   * Gets a string identifying the name of the class
   * @returns "Scene" string
   */
  getClassName() {
    return "Scene";
  }
  /**
   * @internal
   */
  _getDefaultMeshCandidates() {
    return this._defaultMeshCandidates.data = this.meshes, this._defaultMeshCandidates.length = this.meshes.length, this._defaultMeshCandidates;
  }
  /**
   * @internal
   */
  _getDefaultSubMeshCandidates(e) {
    return this._defaultSubMeshCandidates.data = e.subMeshes, this._defaultSubMeshCandidates.length = e.subMeshes.length, this._defaultSubMeshCandidates;
  }
  /**
   * Sets the default candidate providers for the scene.
   * This sets the getActiveMeshCandidates, getActiveSubMeshCandidates, getIntersectingSubMeshCandidates
   * and getCollidingSubMeshCandidates to their default function
   */
  setDefaultCandidateProviders() {
    this.getActiveMeshCandidates = () => this._getDefaultMeshCandidates(), this.getActiveSubMeshCandidates = (e) => this._getDefaultSubMeshCandidates(e), this.getIntersectingSubMeshCandidates = (e, t) => this._getDefaultSubMeshCandidates(e), this.getCollidingSubMeshCandidates = (e, t) => this._getDefaultSubMeshCandidates(e);
  }
  /**
   * Gets the mesh that is currently under the pointer
   */
  get meshUnderPointer() {
    return this._inputManager.meshUnderPointer;
  }
  /**
   * Gets or sets the current on-screen X position of the pointer
   */
  get pointerX() {
    return this._inputManager.pointerX;
  }
  set pointerX(e) {
    this._inputManager.pointerX = e;
  }
  /**
   * Gets or sets the current on-screen Y position of the pointer
   */
  get pointerY() {
    return this._inputManager.pointerY;
  }
  set pointerY(e) {
    this._inputManager.pointerY = e;
  }
  /**
   * Gets the cached material (ie. the latest rendered one)
   * @returns the cached material
   */
  getCachedMaterial() {
    return this._cachedMaterial;
  }
  /**
   * Gets the cached effect (ie. the latest rendered one)
   * @returns the cached effect
   */
  getCachedEffect() {
    return this._cachedEffect;
  }
  /**
   * Gets the cached visibility state (ie. the latest rendered one)
   * @returns the cached visibility state
   */
  getCachedVisibility() {
    return this._cachedVisibility;
  }
  /**
   * Gets a boolean indicating if the current material / effect / visibility must be bind again
   * @param material defines the current material
   * @param effect defines the current effect
   * @param visibility defines the current visibility state
   * @returns true if one parameter is not cached
   */
  isCachedMaterialInvalid(e, t, i = 1) {
    return this._cachedEffect !== t || this._cachedMaterial !== e || this._cachedVisibility !== i;
  }
  /**
   * Gets the engine associated with the scene
   * @returns an Engine
   */
  getEngine() {
    return this._engine;
  }
  /**
   * Gets the total number of vertices rendered per frame
   * @returns the total number of vertices rendered per frame
   */
  getTotalVertices() {
    return this._totalVertices.current;
  }
  /**
   * Gets the performance counter for total vertices
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#instrumentation
   */
  get totalVerticesPerfCounter() {
    return this._totalVertices;
  }
  /**
   * Gets the total number of active indices rendered per frame (You can deduce the number of rendered triangles by dividing this number by 3)
   * @returns the total number of active indices rendered per frame
   */
  getActiveIndices() {
    return this._activeIndices.current;
  }
  /**
   * Gets the performance counter for active indices
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#instrumentation
   */
  get totalActiveIndicesPerfCounter() {
    return this._activeIndices;
  }
  /**
   * Gets the total number of active particles rendered per frame
   * @returns the total number of active particles rendered per frame
   */
  getActiveParticles() {
    return this._activeParticles.current;
  }
  /**
   * Gets the performance counter for active particles
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#instrumentation
   */
  get activeParticlesPerfCounter() {
    return this._activeParticles;
  }
  /**
   * Gets the total number of active bones rendered per frame
   * @returns the total number of active bones rendered per frame
   */
  getActiveBones() {
    return this._activeBones.current;
  }
  /**
   * Gets the performance counter for active bones
   * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#instrumentation
   */
  get activeBonesPerfCounter() {
    return this._activeBones;
  }
  /**
   * Gets the array of active meshes
   * @returns an array of AbstractMesh
   */
  getActiveMeshes() {
    return this._activeMeshes;
  }
  /**
   * Gets the animation ratio (which is 1.0 is the scene renders at 60fps and 2 if the scene renders at 30fps, etc.)
   * @returns a number
   */
  getAnimationRatio() {
    return this._animationRatio !== void 0 ? this._animationRatio : 1;
  }
  /**
   * Gets an unique Id for the current render phase
   * @returns a number
   */
  getRenderId() {
    return this._renderId;
  }
  /**
   * Gets an unique Id for the current frame
   * @returns a number
   */
  getFrameId() {
    return this._frameId;
  }
  /** Call this function if you want to manually increment the render Id*/
  incrementRenderId() {
    this._renderId++;
  }
  _createUbo() {
    this.setSceneUniformBuffer(this.createSceneUniformBuffer());
  }
  /**
   * Use this method to simulate a pointer move on a mesh
   * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
   * @param pickResult pickingInfo of the object wished to simulate pointer event on
   * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
   * @returns the current scene
   */
  simulatePointerMove(e, t) {
    return this._inputManager.simulatePointerMove(e, t), this;
  }
  /**
   * Use this method to simulate a pointer down on a mesh
   * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
   * @param pickResult pickingInfo of the object wished to simulate pointer event on
   * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
   * @returns the current scene
   */
  simulatePointerDown(e, t) {
    return this._inputManager.simulatePointerDown(e, t), this;
  }
  /**
   * Use this method to simulate a pointer up on a mesh
   * The pickResult parameter can be obtained from a scene.pick or scene.pickWithRay
   * @param pickResult pickingInfo of the object wished to simulate pointer event on
   * @param pointerEventInit pointer event state to be used when simulating the pointer event (eg. pointer id for multitouch)
   * @param doubleTap indicates that the pointer up event should be considered as part of a double click (false by default)
   * @returns the current scene
   */
  simulatePointerUp(e, t, i) {
    return this._inputManager.simulatePointerUp(e, t, i), this;
  }
  /**
   * Gets a boolean indicating if the current pointer event is captured (meaning that the scene has already handled the pointer down)
   * @param pointerId defines the pointer id to use in a multi-touch scenario (0 by default)
   * @returns true if the pointer was captured
   */
  isPointerCaptured(e = 0) {
    return this._inputManager.isPointerCaptured(e);
  }
  /**
   * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
   * @param attachUp defines if you want to attach events to pointerup
   * @param attachDown defines if you want to attach events to pointerdown
   * @param attachMove defines if you want to attach events to pointermove
   */
  attachControl(e = !0, t = !0, i = !0) {
    this._inputManager.attachControl(e, t, i);
  }
  /** Detaches all event handlers*/
  detachControl() {
    this._inputManager.detachControl();
  }
  /**
   * This function will check if the scene can be rendered (textures are loaded, shaders are compiled)
   * Delay loaded resources are not taking in account
   * @param checkRenderTargets true to also check that the meshes rendered as part of a render target are ready (default: true)
   * @returns true if all required resources are ready
   */
  isReady(e = !0) {
    if (this._isDisposed)
      return !1;
    let t;
    const i = this.getEngine(), r = i.currentRenderPassId;
    i.currentRenderPassId = this.activeCamera?.renderPassId ?? r;
    let s = !0;
    for (this._pendingData.length > 0 && (s = !1), this.prePassRenderer?.update(), this.useOrderIndependentTransparency && this.depthPeelingRenderer && s && (s = this.depthPeelingRenderer.isReady()), e && (this._processedMaterials.reset(), this._materialsRenderTargets.reset()), t = 0; t < this.meshes.length; t++) {
      const a = this.meshes[t];
      if (!a.subMeshes || a.subMeshes.length === 0)
        continue;
      if (!a.isReady(!0)) {
        s = !1;
        continue;
      }
      const o = a.hasThinInstances || a.getClassName() === "InstancedMesh" || a.getClassName() === "InstancedLinesMesh" || i.getCaps().instancedArrays && a.instances.length > 0;
      for (const l of this._isReadyForMeshStage)
        l.action(a, o) || (s = !1);
      if (!e)
        continue;
      const h = a.material || this.defaultMaterial;
      if (h)
        if (h._storeEffectOnSubMeshes)
          for (const l of a.subMeshes) {
            const g = l.getMaterial();
            g && g.hasRenderTargetTextures && g.getRenderTargetTextures != null && this._processedMaterials.indexOf(g) === -1 && (this._processedMaterials.push(g), this._materialsRenderTargets.concatWithNoDuplicate(g.getRenderTargetTextures()));
          }
        else
          h.hasRenderTargetTextures && h.getRenderTargetTextures != null && this._processedMaterials.indexOf(h) === -1 && (this._processedMaterials.push(h), this._materialsRenderTargets.concatWithNoDuplicate(h.getRenderTargetTextures()));
    }
    if (e)
      for (t = 0; t < this._materialsRenderTargets.length; ++t)
        this._materialsRenderTargets.data[t].isReadyForRendering() || (s = !1);
    for (t = 0; t < this.geometries.length; t++)
      this.geometries[t].delayLoadState === 2 && (s = !1);
    if (this.activeCameras && this.activeCameras.length > 0)
      for (const a of this.activeCameras)
        a.isReady(!0) || (s = !1);
    else this.activeCamera && (this.activeCamera.isReady(!0) || (s = !1));
    for (const a of this.particleSystems)
      a.isReady() || (s = !1);
    if (this.layers)
      for (const a of this.layers)
        a.isReady() || (s = !1);
    return i.areAllEffectsReady() || (s = !1), i.currentRenderPassId = r, s;
  }
  /** Resets all cached information relative to material (including effect and visibility) */
  resetCachedMaterial() {
    this._cachedMaterial = null, this._cachedEffect = null, this._cachedVisibility = null;
  }
  /**
   * Registers a function to be called before every frame render
   * @param func defines the function to register
   */
  registerBeforeRender(e) {
    this.onBeforeRenderObservable.add(e);
  }
  /**
   * Unregisters a function called before every frame render
   * @param func defines the function to unregister
   */
  unregisterBeforeRender(e) {
    this.onBeforeRenderObservable.removeCallback(e);
  }
  /**
   * Registers a function to be called after every frame render
   * @param func defines the function to register
   */
  registerAfterRender(e) {
    this.onAfterRenderObservable.add(e);
  }
  /**
   * Unregisters a function called after every frame render
   * @param func defines the function to unregister
   */
  unregisterAfterRender(e) {
    this.onAfterRenderObservable.removeCallback(e);
  }
  _executeOnceBeforeRender(e) {
    const t = () => {
      e(), setTimeout(() => {
        this.unregisterBeforeRender(t);
      });
    };
    this.registerBeforeRender(t);
  }
  /**
   * The provided function will run before render once and will be disposed afterwards.
   * A timeout delay can be provided so that the function will be executed in N ms.
   * The timeout is using the browser's native setTimeout so time percision cannot be guaranteed.
   * @param func The function to be executed.
   * @param timeout optional delay in ms
   */
  executeOnceBeforeRender(e, t) {
    t !== void 0 ? setTimeout(() => {
      this._executeOnceBeforeRender(e);
    }, t) : this._executeOnceBeforeRender(e);
  }
  /**
   * This function can help adding any object to the list of data awaited to be ready in order to check for a complete scene loading.
   * @param data defines the object to wait for
   */
  addPendingData(e) {
    this._pendingData.push(e);
  }
  /**
   * Remove a pending data from the loading list which has previously been added with addPendingData.
   * @param data defines the object to remove from the pending list
   */
  removePendingData(e) {
    const t = this.isLoading, i = this._pendingData.indexOf(e);
    i !== -1 && this._pendingData.splice(i, 1), t && !this.isLoading && this.onDataLoadedObservable.notifyObservers(this);
  }
  /**
   * Returns the number of items waiting to be loaded
   * @returns the number of items waiting to be loaded
   */
  getWaitingItemsCount() {
    return this._pendingData.length;
  }
  /**
   * Returns a boolean indicating if the scene is still loading data
   */
  get isLoading() {
    return this._pendingData.length > 0;
  }
  /**
   * Registers a function to be executed when the scene is ready
   * @param func - the function to be executed
   * @param checkRenderTargets true to also check that the meshes rendered as part of a render target are ready (default: false)
   */
  executeWhenReady(e, t = !1) {
    this.onReadyObservable.addOnce(e), this._executeWhenReadyTimeoutId === null && this._checkIsReady(t);
  }
  /**
   * Returns a promise that resolves when the scene is ready
   * @param checkRenderTargets true to also check that the meshes rendered as part of a render target are ready (default: false)
   * @returns A promise that resolves when the scene is ready
   */
  whenReadyAsync(e = !1) {
    return new Promise((t) => {
      this.executeWhenReady(() => {
        t();
      }, e);
    });
  }
  /**
   * @internal
   */
  _checkIsReady(e = !1) {
    if (this._registerTransientComponents(), this.isReady(e)) {
      this.onReadyObservable.notifyObservers(this), this.onReadyObservable.clear(), this._executeWhenReadyTimeoutId = null;
      return;
    }
    if (this._isDisposed) {
      this.onReadyObservable.clear(), this._executeWhenReadyTimeoutId = null;
      return;
    }
    this._executeWhenReadyTimeoutId = setTimeout(() => {
      this.incrementRenderId(), this._checkIsReady(e);
    }, 100);
  }
  /**
   * Gets all animatable attached to the scene
   */
  get animatables() {
    return this._activeAnimatables;
  }
  /**
   * Resets the last animation time frame.
   * Useful to override when animations start running when loading a scene for the first time.
   */
  resetLastAnimationTimeFrame() {
    this._animationTimeLast = ye.Now;
  }
  // Matrix
  /**
   * Gets the current view matrix
   * @returns a Matrix
   */
  getViewMatrix() {
    return this._viewMatrix;
  }
  /**
   * Gets the current projection matrix
   * @returns a Matrix
   */
  getProjectionMatrix() {
    return this._projectionMatrix;
  }
  /**
   * Gets the current transform matrix
   * @returns a Matrix made of View * Projection
   */
  getTransformMatrix() {
    return this._transformMatrix;
  }
  /**
   * Sets the current transform matrix
   * @param viewL defines the View matrix to use
   * @param projectionL defines the Projection matrix to use
   * @param viewR defines the right View matrix to use (if provided)
   * @param projectionR defines the right Projection matrix to use (if provided)
   */
  setTransformMatrix(e, t, i, r) {
    !i && !r && this._multiviewSceneUbo && (this._multiviewSceneUbo.dispose(), this._multiviewSceneUbo = null), !(this._viewUpdateFlag === e.updateFlag && this._projectionUpdateFlag === t.updateFlag) && (this._viewUpdateFlag = e.updateFlag, this._projectionUpdateFlag = t.updateFlag, this._viewMatrix = e, this._projectionMatrix = t, this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix), this._frustumPlanes ? ne.GetPlanesToRef(this._transformMatrix, this._frustumPlanes) : this._frustumPlanes = ne.GetPlanes(this._transformMatrix), this._multiviewSceneUbo && this._multiviewSceneUbo.useUbo ? this._updateMultiviewUbo(i, r) : this._sceneUbo.useUbo && (this._sceneUbo.updateMatrix("viewProjection", this._transformMatrix), this._sceneUbo.updateMatrix("view", this._viewMatrix), this._sceneUbo.updateMatrix("projection", this._projectionMatrix)));
  }
  /**
   * Gets the uniform buffer used to store scene data
   * @returns a UniformBuffer
   */
  getSceneUniformBuffer() {
    return this._multiviewSceneUbo ? this._multiviewSceneUbo : this._sceneUbo;
  }
  /**
   * Creates a scene UBO
   * @param name name of the uniform buffer (optional, for debugging purpose only)
   * @returns a new ubo
   */
  createSceneUniformBuffer(e) {
    const t = new we(this._engine, void 0, !1, e ?? "scene");
    return t.addUniform("viewProjection", 16), t.addUniform("view", 16), t.addUniform("projection", 16), t.addUniform("vEyePosition", 4), t;
  }
  /**
   * Sets the scene ubo
   * @param ubo the ubo to set for the scene
   */
  setSceneUniformBuffer(e) {
    this._sceneUbo = e, this._viewUpdateFlag = -1, this._projectionUpdateFlag = -1;
  }
  /**
   * Gets an unique (relatively to the current scene) Id
   * @returns an unique number for the scene
   */
  getUniqueId() {
    return ve.UniqueId;
  }
  /**
   * Add a mesh to the list of scene's meshes
   * @param newMesh defines the mesh to add
   * @param recursive if all child meshes should also be added to the scene
   */
  addMesh(e, t = !1) {
    this._blockEntityCollection || (this.meshes.push(e), e._resyncLightSources(), e.parent || e._addToSceneRootNodes(), this.onNewMeshAddedObservable.notifyObservers(e), t && e.getChildMeshes().forEach((i) => {
      this.addMesh(i);
    }));
  }
  /**
   * Remove a mesh for the list of scene's meshes
   * @param toRemove defines the mesh to remove
   * @param recursive if all child meshes should also be removed from the scene
   * @returns the index where the mesh was in the mesh list
   */
  removeMesh(e, t = !1) {
    const i = this.meshes.indexOf(e);
    return i !== -1 && (this.meshes[i] = this.meshes[this.meshes.length - 1], this.meshes.pop(), e.parent || e._removeFromSceneRootNodes()), this._inputManager._invalidateMesh(e), this.onMeshRemovedObservable.notifyObservers(e), t && e.getChildMeshes().forEach((r) => {
      this.removeMesh(r);
    }), i;
  }
  /**
   * Add a transform node to the list of scene's transform nodes
   * @param newTransformNode defines the transform node to add
   */
  addTransformNode(e) {
    this._blockEntityCollection || e.getScene() === this && e._indexInSceneTransformNodesArray !== -1 || (e._indexInSceneTransformNodesArray = this.transformNodes.length, this.transformNodes.push(e), e.parent || e._addToSceneRootNodes(), this.onNewTransformNodeAddedObservable.notifyObservers(e));
  }
  /**
   * Remove a transform node for the list of scene's transform nodes
   * @param toRemove defines the transform node to remove
   * @returns the index where the transform node was in the transform node list
   */
  removeTransformNode(e) {
    const t = e._indexInSceneTransformNodesArray;
    if (t !== -1) {
      if (t !== this.transformNodes.length - 1) {
        const i = this.transformNodes[this.transformNodes.length - 1];
        this.transformNodes[t] = i, i._indexInSceneTransformNodesArray = t;
      }
      e._indexInSceneTransformNodesArray = -1, this.transformNodes.pop(), e.parent || e._removeFromSceneRootNodes();
    }
    return this.onTransformNodeRemovedObservable.notifyObservers(e), t;
  }
  /**
   * Remove a skeleton for the list of scene's skeletons
   * @param toRemove defines the skeleton to remove
   * @returns the index where the skeleton was in the skeleton list
   */
  removeSkeleton(e) {
    const t = this.skeletons.indexOf(e);
    return t !== -1 && (this.skeletons.splice(t, 1), this.onSkeletonRemovedObservable.notifyObservers(e), this._executeActiveContainerCleanup(this._activeSkeletons)), t;
  }
  /**
   * Remove a morph target for the list of scene's morph targets
   * @param toRemove defines the morph target to remove
   * @returns the index where the morph target was in the morph target list
   */
  removeMorphTargetManager(e) {
    const t = this.morphTargetManagers.indexOf(e);
    return t !== -1 && this.morphTargetManagers.splice(t, 1), t;
  }
  /**
   * Remove a light for the list of scene's lights
   * @param toRemove defines the light to remove
   * @returns the index where the light was in the light list
   */
  removeLight(e) {
    const t = this.lights.indexOf(e);
    if (t !== -1) {
      for (const i of this.meshes)
        i._removeLightSource(e, !1);
      this.lights.splice(t, 1), this.sortLightsByPriority(), e.parent || e._removeFromSceneRootNodes();
    }
    return this.onLightRemovedObservable.notifyObservers(e), t;
  }
  /**
   * Remove a camera for the list of scene's cameras
   * @param toRemove defines the camera to remove
   * @returns the index where the camera was in the camera list
   */
  removeCamera(e) {
    const t = this.cameras.indexOf(e);
    if (t !== -1 && (this.cameras.splice(t, 1), e.parent || e._removeFromSceneRootNodes()), this.activeCameras) {
      const i = this.activeCameras.indexOf(e);
      i !== -1 && this.activeCameras.splice(i, 1);
    }
    return this.activeCamera === e && (this.cameras.length > 0 ? this.activeCamera = this.cameras[0] : this.activeCamera = null), this.onCameraRemovedObservable.notifyObservers(e), t;
  }
  /**
   * Remove a particle system for the list of scene's particle systems
   * @param toRemove defines the particle system to remove
   * @returns the index where the particle system was in the particle system list
   */
  removeParticleSystem(e) {
    const t = this.particleSystems.indexOf(e);
    return t !== -1 && (this.particleSystems.splice(t, 1), this._executeActiveContainerCleanup(this._activeParticleSystems)), t;
  }
  /**
   * Remove a animation for the list of scene's animations
   * @param toRemove defines the animation to remove
   * @returns the index where the animation was in the animation list
   */
  removeAnimation(e) {
    const t = this.animations.indexOf(e);
    return t !== -1 && this.animations.splice(t, 1), t;
  }
  /**
   * Will stop the animation of the given target
   * @param target - the target
   * @param animationName - the name of the animation to stop (all animations will be stopped if both this and targetMask are empty)
   * @param targetMask - a function that determines if the animation should be stopped based on its target (all animations will be stopped if both this and animationName are empty)
   */
  stopAnimation(e, t, i) {
  }
  /**
   * Removes the given animation group from this scene.
   * @param toRemove The animation group to remove
   * @returns The index of the removed animation group
   */
  removeAnimationGroup(e) {
    const t = this.animationGroups.indexOf(e);
    return t !== -1 && this.animationGroups.splice(t, 1), t;
  }
  /**
   * Removes the given multi-material from this scene.
   * @param toRemove The multi-material to remove
   * @returns The index of the removed multi-material
   */
  removeMultiMaterial(e) {
    const t = this.multiMaterials.indexOf(e);
    return t !== -1 && this.multiMaterials.splice(t, 1), this.onMultiMaterialRemovedObservable.notifyObservers(e), t;
  }
  /**
   * Removes the given material from this scene.
   * @param toRemove The material to remove
   * @returns The index of the removed material
   */
  removeMaterial(e) {
    const t = e._indexInSceneMaterialArray;
    if (t !== -1 && t < this.materials.length) {
      if (t !== this.materials.length - 1) {
        const i = this.materials[this.materials.length - 1];
        this.materials[t] = i, i._indexInSceneMaterialArray = t;
      }
      e._indexInSceneMaterialArray = -1, this.materials.pop();
    }
    return this.onMaterialRemovedObservable.notifyObservers(e), t;
  }
  /**
   * Removes the given action manager from this scene.
   * @deprecated
   * @param toRemove The action manager to remove
   * @returns The index of the removed action manager
   */
  removeActionManager(e) {
    const t = this.actionManagers.indexOf(e);
    return t !== -1 && this.actionManagers.splice(t, 1), t;
  }
  /**
   * Removes the given texture from this scene.
   * @param toRemove The texture to remove
   * @returns The index of the removed texture
   */
  removeTexture(e) {
    const t = this.textures.indexOf(e);
    return t !== -1 && this.textures.splice(t, 1), this.onTextureRemovedObservable.notifyObservers(e), t;
  }
  /**
   * Adds the given light to this scene
   * @param newLight The light to add
   */
  addLight(e) {
    if (!this._blockEntityCollection) {
      this.lights.push(e), this.sortLightsByPriority(), e.parent || e._addToSceneRootNodes();
      for (const t of this.meshes)
        t.lightSources.indexOf(e) === -1 && (t.lightSources.push(e), t._resyncLightSources());
      this.onNewLightAddedObservable.notifyObservers(e);
    }
  }
  /**
   * Sorts the list list based on light priorities
   */
  sortLightsByPriority() {
    this.requireLightSorting && this.lights.sort(Be.CompareLightsPriority);
  }
  /**
   * Adds the given camera to this scene
   * @param newCamera The camera to add
   */
  addCamera(e) {
    this._blockEntityCollection || (this.cameras.push(e), this.onNewCameraAddedObservable.notifyObservers(e), e.parent || e._addToSceneRootNodes());
  }
  /**
   * Adds the given skeleton to this scene
   * @param newSkeleton The skeleton to add
   */
  addSkeleton(e) {
    this._blockEntityCollection || (this.skeletons.push(e), this.onNewSkeletonAddedObservable.notifyObservers(e));
  }
  /**
   * Adds the given particle system to this scene
   * @param newParticleSystem The particle system to add
   */
  addParticleSystem(e) {
    this._blockEntityCollection || this.particleSystems.push(e);
  }
  /**
   * Adds the given animation to this scene
   * @param newAnimation The animation to add
   */
  addAnimation(e) {
    this._blockEntityCollection || this.animations.push(e);
  }
  /**
   * Adds the given animation group to this scene.
   * @param newAnimationGroup The animation group to add
   */
  addAnimationGroup(e) {
    this._blockEntityCollection || this.animationGroups.push(e);
  }
  /**
   * Adds the given multi-material to this scene
   * @param newMultiMaterial The multi-material to add
   */
  addMultiMaterial(e) {
    this._blockEntityCollection || (this.multiMaterials.push(e), this.onNewMultiMaterialAddedObservable.notifyObservers(e));
  }
  /**
   * Adds the given material to this scene
   * @param newMaterial The material to add
   */
  addMaterial(e) {
    this._blockEntityCollection || e.getScene() === this && e._indexInSceneMaterialArray !== -1 || (e._indexInSceneMaterialArray = this.materials.length, this.materials.push(e), this.onNewMaterialAddedObservable.notifyObservers(e));
  }
  /**
   * Adds the given morph target to this scene
   * @param newMorphTargetManager The morph target to add
   */
  addMorphTargetManager(e) {
    this._blockEntityCollection || this.morphTargetManagers.push(e);
  }
  /**
   * Adds the given geometry to this scene
   * @param newGeometry The geometry to add
   */
  addGeometry(e) {
    this._blockEntityCollection || (this._geometriesByUniqueId && (this._geometriesByUniqueId[e.uniqueId] = this.geometries.length), this.geometries.push(e));
  }
  /**
   * Adds the given action manager to this scene
   * @deprecated
   * @param newActionManager The action manager to add
   */
  addActionManager(e) {
    this.actionManagers.push(e);
  }
  /**
   * Adds the given texture to this scene.
   * @param newTexture The texture to add
   */
  addTexture(e) {
    this._blockEntityCollection || (this.textures.push(e), this.onNewTextureAddedObservable.notifyObservers(e));
  }
  /**
   * Switch active camera
   * @param newCamera defines the new active camera
   * @param attachControl defines if attachControl must be called for the new active camera (default: true)
   */
  switchActiveCamera(e, t = !0) {
    this._engine.getInputElement() && (this.activeCamera && this.activeCamera.detachControl(), this.activeCamera = e, t && e.attachControl());
  }
  /**
   * sets the active camera of the scene using its Id
   * @param id defines the camera's Id
   * @returns the new active camera or null if none found.
   */
  setActiveCameraById(e) {
    const t = this.getCameraById(e);
    return t ? (this.activeCamera = t, t) : null;
  }
  /**
   * sets the active camera of the scene using its name
   * @param name defines the camera's name
   * @returns the new active camera or null if none found.
   */
  setActiveCameraByName(e) {
    const t = this.getCameraByName(e);
    return t ? (this.activeCamera = t, t) : null;
  }
  /**
   * get an animation group using its name
   * @param name defines the material's name
   * @returns the animation group or null if none found.
   */
  getAnimationGroupByName(e) {
    for (let t = 0; t < this.animationGroups.length; t++)
      if (this.animationGroups[t].name === e)
        return this.animationGroups[t];
    return null;
  }
  _getMaterial(e, t) {
    for (let i = 0; i < this.materials.length; i++) {
      const r = this.materials[i];
      if (t(r))
        return r;
    }
    if (e)
      for (let i = 0; i < this.multiMaterials.length; i++) {
        const r = this.multiMaterials[i];
        if (t(r))
          return r;
      }
    return null;
  }
  /**
   * Get a material using its unique id
   * @param uniqueId defines the material's unique id
   * @param allowMultiMaterials determines whether multimaterials should be considered
   * @returns the material or null if none found.
   */
  getMaterialByUniqueID(e, t = !1) {
    return this._getMaterial(t, (i) => i.uniqueId === e);
  }
  /**
   * get a material using its id
   * @param id defines the material's Id
   * @param allowMultiMaterials determines whether multimaterials should be considered
   * @returns the material or null if none found.
   */
  getMaterialById(e, t = !1) {
    return this._getMaterial(t, (i) => i.id === e);
  }
  /**
   * Gets a material using its name
   * @param name defines the material's name
   * @param allowMultiMaterials determines whether multimaterials should be considered
   * @returns the material or null if none found.
   */
  getMaterialByName(e, t = !1) {
    return this._getMaterial(t, (i) => i.name === e);
  }
  /**
   * Gets a last added material using a given id
   * @param id defines the material's id
   * @param allowMultiMaterials determines whether multimaterials should be considered
   * @returns the last material with the given id or null if none found.
   */
  getLastMaterialById(e, t = !1) {
    for (let i = this.materials.length - 1; i >= 0; i--)
      if (this.materials[i].id === e)
        return this.materials[i];
    if (t) {
      for (let i = this.multiMaterials.length - 1; i >= 0; i--)
        if (this.multiMaterials[i].id === e)
          return this.multiMaterials[i];
    }
    return null;
  }
  /**
   * Get a texture using its unique id
   * @param uniqueId defines the texture's unique id
   * @returns the texture or null if none found.
   */
  getTextureByUniqueId(e) {
    for (let t = 0; t < this.textures.length; t++)
      if (this.textures[t].uniqueId === e)
        return this.textures[t];
    return null;
  }
  /**
   * Gets a texture using its name
   * @param name defines the texture's name
   * @returns the texture or null if none found.
   */
  getTextureByName(e) {
    for (let t = 0; t < this.textures.length; t++)
      if (this.textures[t].name === e)
        return this.textures[t];
    return null;
  }
  /**
   * Gets a camera using its Id
   * @param id defines the Id to look for
   * @returns the camera or null if not found
   */
  getCameraById(e) {
    for (let t = 0; t < this.cameras.length; t++)
      if (this.cameras[t].id === e)
        return this.cameras[t];
    return null;
  }
  /**
   * Gets a camera using its unique Id
   * @param uniqueId defines the unique Id to look for
   * @returns the camera or null if not found
   */
  getCameraByUniqueId(e) {
    for (let t = 0; t < this.cameras.length; t++)
      if (this.cameras[t].uniqueId === e)
        return this.cameras[t];
    return null;
  }
  /**
   * Gets a camera using its name
   * @param name defines the camera's name
   * @returns the camera or null if none found.
   */
  getCameraByName(e) {
    for (let t = 0; t < this.cameras.length; t++)
      if (this.cameras[t].name === e)
        return this.cameras[t];
    return null;
  }
  /**
   * Gets a bone using its Id
   * @param id defines the bone's Id
   * @returns the bone or null if not found
   */
  getBoneById(e) {
    for (let t = 0; t < this.skeletons.length; t++) {
      const i = this.skeletons[t];
      for (let r = 0; r < i.bones.length; r++)
        if (i.bones[r].id === e)
          return i.bones[r];
    }
    return null;
  }
  /**
   * Gets a bone using its id
   * @param name defines the bone's name
   * @returns the bone or null if not found
   */
  getBoneByName(e) {
    for (let t = 0; t < this.skeletons.length; t++) {
      const i = this.skeletons[t];
      for (let r = 0; r < i.bones.length; r++)
        if (i.bones[r].name === e)
          return i.bones[r];
    }
    return null;
  }
  /**
   * Gets a light node using its name
   * @param name defines the light's name
   * @returns the light or null if none found.
   */
  getLightByName(e) {
    for (let t = 0; t < this.lights.length; t++)
      if (this.lights[t].name === e)
        return this.lights[t];
    return null;
  }
  /**
   * Gets a light node using its Id
   * @param id defines the light's Id
   * @returns the light or null if none found.
   */
  getLightById(e) {
    for (let t = 0; t < this.lights.length; t++)
      if (this.lights[t].id === e)
        return this.lights[t];
    return null;
  }
  /**
   * Gets a light node using its scene-generated unique Id
   * @param uniqueId defines the light's unique Id
   * @returns the light or null if none found.
   */
  getLightByUniqueId(e) {
    for (let t = 0; t < this.lights.length; t++)
      if (this.lights[t].uniqueId === e)
        return this.lights[t];
    return null;
  }
  /**
   * Gets a particle system by Id
   * @param id defines the particle system Id
   * @returns the corresponding system or null if none found
   */
  getParticleSystemById(e) {
    for (let t = 0; t < this.particleSystems.length; t++)
      if (this.particleSystems[t].id === e)
        return this.particleSystems[t];
    return null;
  }
  /**
   * Gets a geometry using its Id
   * @param id defines the geometry's Id
   * @returns the geometry or null if none found.
   */
  getGeometryById(e) {
    for (let t = 0; t < this.geometries.length; t++)
      if (this.geometries[t].id === e)
        return this.geometries[t];
    return null;
  }
  _getGeometryByUniqueId(e) {
    if (this._geometriesByUniqueId) {
      const t = this._geometriesByUniqueId[e];
      if (t !== void 0)
        return this.geometries[t];
    } else
      for (let t = 0; t < this.geometries.length; t++)
        if (this.geometries[t].uniqueId === e)
          return this.geometries[t];
    return null;
  }
  /**
   * Add a new geometry to this scene
   * @param geometry defines the geometry to be added to the scene.
   * @param force defines if the geometry must be pushed even if a geometry with this id already exists
   * @returns a boolean defining if the geometry was added or not
   */
  pushGeometry(e, t) {
    return !t && this._getGeometryByUniqueId(e.uniqueId) ? !1 : (this.addGeometry(e), this.onNewGeometryAddedObservable.notifyObservers(e), !0);
  }
  /**
   * Removes an existing geometry
   * @param geometry defines the geometry to be removed from the scene
   * @returns a boolean defining if the geometry was removed or not
   */
  removeGeometry(e) {
    let t;
    if (this._geometriesByUniqueId) {
      if (t = this._geometriesByUniqueId[e.uniqueId], t === void 0)
        return !1;
    } else if (t = this.geometries.indexOf(e), t < 0)
      return !1;
    if (t !== this.geometries.length - 1) {
      const i = this.geometries[this.geometries.length - 1];
      i && (this.geometries[t] = i, this._geometriesByUniqueId && (this._geometriesByUniqueId[i.uniqueId] = t));
    }
    return this._geometriesByUniqueId && (this._geometriesByUniqueId[e.uniqueId] = void 0), this.geometries.pop(), this.onGeometryRemovedObservable.notifyObservers(e), !0;
  }
  /**
   * Gets the list of geometries attached to the scene
   * @returns an array of Geometry
   */
  getGeometries() {
    return this.geometries;
  }
  /**
   * Gets the first added mesh found of a given Id
   * @param id defines the Id to search for
   * @returns the mesh found or null if not found at all
   */
  getMeshById(e) {
    for (let t = 0; t < this.meshes.length; t++)
      if (this.meshes[t].id === e)
        return this.meshes[t];
    return null;
  }
  /**
   * Gets a list of meshes using their Id
   * @param id defines the Id to search for
   * @returns a list of meshes
   */
  getMeshesById(e) {
    return this.meshes.filter(function(t) {
      return t.id === e;
    });
  }
  /**
   * Gets the first added transform node found of a given Id
   * @param id defines the Id to search for
   * @returns the found transform node or null if not found at all.
   */
  getTransformNodeById(e) {
    for (let t = 0; t < this.transformNodes.length; t++)
      if (this.transformNodes[t].id === e)
        return this.transformNodes[t];
    return null;
  }
  /**
   * Gets a transform node with its auto-generated unique Id
   * @param uniqueId defines the unique Id to search for
   * @returns the found transform node or null if not found at all.
   */
  getTransformNodeByUniqueId(e) {
    for (let t = 0; t < this.transformNodes.length; t++)
      if (this.transformNodes[t].uniqueId === e)
        return this.transformNodes[t];
    return null;
  }
  /**
   * Gets a list of transform nodes using their Id
   * @param id defines the Id to search for
   * @returns a list of transform nodes
   */
  getTransformNodesById(e) {
    return this.transformNodes.filter(function(t) {
      return t.id === e;
    });
  }
  /**
   * Gets a mesh with its auto-generated unique Id
   * @param uniqueId defines the unique Id to search for
   * @returns the found mesh or null if not found at all.
   */
  getMeshByUniqueId(e) {
    for (let t = 0; t < this.meshes.length; t++)
      if (this.meshes[t].uniqueId === e)
        return this.meshes[t];
    return null;
  }
  /**
   * Gets a the last added mesh using a given Id
   * @param id defines the Id to search for
   * @returns the found mesh or null if not found at all.
   */
  getLastMeshById(e) {
    for (let t = this.meshes.length - 1; t >= 0; t--)
      if (this.meshes[t].id === e)
        return this.meshes[t];
    return null;
  }
  /**
   * Gets a the last transform node using a given Id
   * @param id defines the Id to search for
   * @returns the found mesh or null if not found at all.
   */
  getLastTransformNodeById(e) {
    for (let t = this.transformNodes.length - 1; t >= 0; t--)
      if (this.transformNodes[t].id === e)
        return this.transformNodes[t];
    return null;
  }
  /**
   * Gets a the last added node (Mesh, Camera, Light) using a given Id
   * @param id defines the Id to search for
   * @returns the found node or null if not found at all
   */
  getLastEntryById(e) {
    let t;
    for (t = this.meshes.length - 1; t >= 0; t--)
      if (this.meshes[t].id === e)
        return this.meshes[t];
    for (t = this.transformNodes.length - 1; t >= 0; t--)
      if (this.transformNodes[t].id === e)
        return this.transformNodes[t];
    for (t = this.cameras.length - 1; t >= 0; t--)
      if (this.cameras[t].id === e)
        return this.cameras[t];
    for (t = this.lights.length - 1; t >= 0; t--)
      if (this.lights[t].id === e)
        return this.lights[t];
    return null;
  }
  /**
   * Gets a node (Mesh, Camera, Light) using a given Id
   * @param id defines the Id to search for
   * @returns the found node or null if not found at all
   */
  getNodeById(e) {
    const t = this.getMeshById(e);
    if (t)
      return t;
    const i = this.getTransformNodeById(e);
    if (i)
      return i;
    const r = this.getLightById(e);
    if (r)
      return r;
    const s = this.getCameraById(e);
    if (s)
      return s;
    const a = this.getBoneById(e);
    return a || null;
  }
  /**
   * Gets a node (Mesh, Camera, Light) using a given name
   * @param name defines the name to search for
   * @returns the found node or null if not found at all.
   */
  getNodeByName(e) {
    const t = this.getMeshByName(e);
    if (t)
      return t;
    const i = this.getTransformNodeByName(e);
    if (i)
      return i;
    const r = this.getLightByName(e);
    if (r)
      return r;
    const s = this.getCameraByName(e);
    if (s)
      return s;
    const a = this.getBoneByName(e);
    return a || null;
  }
  /**
   * Gets a mesh using a given name
   * @param name defines the name to search for
   * @returns the found mesh or null if not found at all.
   */
  getMeshByName(e) {
    for (let t = 0; t < this.meshes.length; t++)
      if (this.meshes[t].name === e)
        return this.meshes[t];
    return null;
  }
  /**
   * Gets a transform node using a given name
   * @param name defines the name to search for
   * @returns the found transform node or null if not found at all.
   */
  getTransformNodeByName(e) {
    for (let t = 0; t < this.transformNodes.length; t++)
      if (this.transformNodes[t].name === e)
        return this.transformNodes[t];
    return null;
  }
  /**
   * Gets a skeleton using a given Id (if many are found, this function will pick the last one)
   * @param id defines the Id to search for
   * @returns the found skeleton or null if not found at all.
   */
  getLastSkeletonById(e) {
    for (let t = this.skeletons.length - 1; t >= 0; t--)
      if (this.skeletons[t].id === e)
        return this.skeletons[t];
    return null;
  }
  /**
   * Gets a skeleton using a given auto generated unique id
   * @param  uniqueId defines the unique id to search for
   * @returns the found skeleton or null if not found at all.
   */
  getSkeletonByUniqueId(e) {
    for (let t = 0; t < this.skeletons.length; t++)
      if (this.skeletons[t].uniqueId === e)
        return this.skeletons[t];
    return null;
  }
  /**
   * Gets a skeleton using a given id (if many are found, this function will pick the first one)
   * @param id defines the id to search for
   * @returns the found skeleton or null if not found at all.
   */
  getSkeletonById(e) {
    for (let t = 0; t < this.skeletons.length; t++)
      if (this.skeletons[t].id === e)
        return this.skeletons[t];
    return null;
  }
  /**
   * Gets a skeleton using a given name
   * @param name defines the name to search for
   * @returns the found skeleton or null if not found at all.
   */
  getSkeletonByName(e) {
    for (let t = 0; t < this.skeletons.length; t++)
      if (this.skeletons[t].name === e)
        return this.skeletons[t];
    return null;
  }
  /**
   * Gets a morph target manager  using a given id (if many are found, this function will pick the last one)
   * @param id defines the id to search for
   * @returns the found morph target manager or null if not found at all.
   */
  getMorphTargetManagerById(e) {
    for (let t = 0; t < this.morphTargetManagers.length; t++)
      if (this.morphTargetManagers[t].uniqueId === e)
        return this.morphTargetManagers[t];
    return null;
  }
  /**
   * Gets a morph target using a given id (if many are found, this function will pick the first one)
   * @param id defines the id to search for
   * @returns the found morph target or null if not found at all.
   */
  getMorphTargetById(e) {
    for (let t = 0; t < this.morphTargetManagers.length; ++t) {
      const i = this.morphTargetManagers[t];
      for (let r = 0; r < i.numTargets; ++r) {
        const s = i.getTarget(r);
        if (s.id === e)
          return s;
      }
    }
    return null;
  }
  /**
   * Gets a morph target using a given name (if many are found, this function will pick the first one)
   * @param name defines the name to search for
   * @returns the found morph target or null if not found at all.
   */
  getMorphTargetByName(e) {
    for (let t = 0; t < this.morphTargetManagers.length; ++t) {
      const i = this.morphTargetManagers[t];
      for (let r = 0; r < i.numTargets; ++r) {
        const s = i.getTarget(r);
        if (s.name === e)
          return s;
      }
    }
    return null;
  }
  /**
   * Gets a post process using a given name (if many are found, this function will pick the first one)
   * @param name defines the name to search for
   * @returns the found post process or null if not found at all.
   */
  getPostProcessByName(e) {
    for (let t = 0; t < this.postProcesses.length; ++t) {
      const i = this.postProcesses[t];
      if (i.name === e)
        return i;
    }
    return null;
  }
  /**
   * Gets a boolean indicating if the given mesh is active
   * @param mesh defines the mesh to look for
   * @returns true if the mesh is in the active list
   */
  isActiveMesh(e) {
    return this._activeMeshes.indexOf(e) !== -1;
  }
  /**
   * Return a unique id as a string which can serve as an identifier for the scene
   */
  get uid() {
    return this._uid || (this._uid = S.RandomId()), this._uid;
  }
  /**
   * Add an externally attached data from its key.
   * This method call will fail and return false, if such key already exists.
   * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
   * @param key the unique key that identifies the data
   * @param data the data object to associate to the key for this Engine instance
   * @returns true if no such key were already present and the data was added successfully, false otherwise
   */
  addExternalData(e, t) {
    return this._externalData || (this._externalData = new ae()), this._externalData.add(e, t);
  }
  /**
   * Get an externally attached data from its key
   * @param key the unique key that identifies the data
   * @returns the associated data, if present (can be null), or undefined if not present
   */
  getExternalData(e) {
    return this._externalData ? this._externalData.get(e) : null;
  }
  /**
   * Get an externally attached data from its key, create it using a factory if it's not already present
   * @param key the unique key that identifies the data
   * @param factory the factory that will be called to create the instance if and only if it doesn't exists
   * @returns the associated data, can be null if the factory returned null.
   */
  getOrAddExternalDataWithFactory(e, t) {
    return this._externalData || (this._externalData = new ae()), this._externalData.getOrAddWithFactory(e, t);
  }
  /**
   * Remove an externally attached data from the Engine instance
   * @param key the unique key that identifies the data
   * @returns true if the data was successfully removed, false if it doesn't exist
   */
  removeExternalData(e) {
    return this._externalData.remove(e);
  }
  _evaluateSubMesh(e, t, i, r) {
    if (r || e.isInFrustum(this._frustumPlanes)) {
      for (const a of this._evaluateSubMeshStage)
        a.action(t, e);
      const s = e.getMaterial();
      s != null && (s.hasRenderTargetTextures && s.getRenderTargetTextures != null && this._processedMaterials.indexOf(s) === -1 && (this._processedMaterials.push(s), this._materialsRenderTargets.concatWithNoDuplicate(s.getRenderTargetTextures())), this._renderingManager.dispatch(e, t, s));
    }
  }
  /**
   * Clear the processed materials smart array preventing retention point in material dispose.
   */
  freeProcessedMaterials() {
    this._processedMaterials.dispose();
  }
  /** Gets or sets a boolean blocking all the calls to freeActiveMeshes and freeRenderingGroups
   * It can be used in order to prevent going through methods freeRenderingGroups and freeActiveMeshes several times to improve performance
   * when disposing several meshes in a row or a hierarchy of meshes.
   * When used, it is the responsibility of the user to blockfreeActiveMeshesAndRenderingGroups back to false.
   */
  get blockfreeActiveMeshesAndRenderingGroups() {
    return this._preventFreeActiveMeshesAndRenderingGroups;
  }
  set blockfreeActiveMeshesAndRenderingGroups(e) {
    this._preventFreeActiveMeshesAndRenderingGroups !== e && (e && (this.freeActiveMeshes(), this.freeRenderingGroups()), this._preventFreeActiveMeshesAndRenderingGroups = e);
  }
  /**
   * Clear the active meshes smart array preventing retention point in mesh dispose.
   */
  freeActiveMeshes() {
    if (!this.blockfreeActiveMeshesAndRenderingGroups && (this._activeMeshes.dispose(), this.activeCamera && this.activeCamera._activeMeshes && this.activeCamera._activeMeshes.dispose(), this.activeCameras))
      for (let e = 0; e < this.activeCameras.length; e++) {
        const t = this.activeCameras[e];
        t && t._activeMeshes && t._activeMeshes.dispose();
      }
  }
  /**
   * Clear the info related to rendering groups preventing retention points during dispose.
   */
  freeRenderingGroups() {
    if (!this.blockfreeActiveMeshesAndRenderingGroups && (this._renderingManager && this._renderingManager.freeRenderingGroups(), this.textures))
      for (let e = 0; e < this.textures.length; e++) {
        const t = this.textures[e];
        t && t.renderList && t.freeRenderingGroups();
      }
  }
  /** @internal */
  _isInIntermediateRendering() {
    return this._intermediateRendering;
  }
  /**
   * Use this function to stop evaluating active meshes. The current list will be keep alive between frames
   * @param skipEvaluateActiveMeshes defines an optional boolean indicating that the evaluate active meshes step must be completely skipped
   * @param onSuccess optional success callback
   * @param onError optional error callback
   * @param freezeMeshes defines if meshes should be frozen (true by default)
   * @param keepFrustumCulling defines if you want to keep running the frustum clipping (false by default)
   * @returns the current scene
   */
  freezeActiveMeshes(e = !1, t, i, r = !0, s = !1) {
    return this.executeWhenReady(() => {
      if (!this.activeCamera) {
        i && i("No active camera found");
        return;
      }
      if (this._frustumPlanes || this.updateTransformMatrix(), this._evaluateActiveMeshes(), this._activeMeshesFrozen = !0, this._activeMeshesFrozenButKeepClipping = s, this._skipEvaluateActiveMeshesCompletely = e, r)
        for (let a = 0; a < this._activeMeshes.length; a++)
          this._activeMeshes.data[a]._freeze();
      t && t();
    }), this;
  }
  /**
   * Use this function to restart evaluating active meshes on every frame
   * @returns the current scene
   */
  unfreezeActiveMeshes() {
    for (let e = 0; e < this.meshes.length; e++) {
      const t = this.meshes[e];
      t._internalAbstractMeshDataInfo && (t._internalAbstractMeshDataInfo._isActive = !1);
    }
    for (let e = 0; e < this._activeMeshes.length; e++)
      this._activeMeshes.data[e]._unFreeze();
    return this._activeMeshesFrozen = !1, this;
  }
  _executeActiveContainerCleanup(e) {
    !(this._engine.snapshotRendering && this._engine.snapshotRenderingMode === 1) && this._activeMeshesFrozen && this._activeMeshes.length || this.onBeforeRenderObservable.addOnce(() => e.dispose());
  }
  _evaluateActiveMeshes() {
    if (this._engine.snapshotRendering && this._engine.snapshotRenderingMode === 1) {
      this._activeMeshes.length > 0 && (this.activeCamera?._activeMeshes.reset(), this._activeMeshes.reset(), this._renderingManager.reset(), this._processedMaterials.reset(), this._activeParticleSystems.reset(), this._activeSkeletons.reset(), this._softwareSkinnedMeshes.reset());
      return;
    }
    if (this._activeMeshesFrozen && this._activeMeshes.length) {
      if (!this._skipEvaluateActiveMeshesCompletely) {
        const i = this._activeMeshes.length;
        for (let r = 0; r < i; r++)
          this._activeMeshes.data[r].computeWorldMatrix();
      }
      if (this._activeParticleSystems) {
        const i = this._activeParticleSystems.length;
        for (let r = 0; r < i; r++)
          this._activeParticleSystems.data[r].animate();
      }
      this._renderingManager.resetSprites();
      return;
    }
    if (!this.activeCamera)
      return;
    this.onBeforeActiveMeshesEvaluationObservable.notifyObservers(this), this.activeCamera._activeMeshes.reset(), this._activeMeshes.reset(), this._renderingManager.reset(), this._processedMaterials.reset(), this._activeParticleSystems.reset(), this._activeSkeletons.reset(), this._softwareSkinnedMeshes.reset(), this._materialsRenderTargets.reset();
    for (const i of this._beforeEvaluateActiveMeshStage)
      i.action();
    const e = this.getActiveMeshCandidates(), t = e.length;
    for (let i = 0; i < t; i++) {
      const r = e.data[i];
      if (r._internalAbstractMeshDataInfo._currentLODIsUpToDate = !1, r.isBlocked || (this._totalVertices.addCount(r.getTotalVertices(), !1), !r.isReady() || !r.isEnabled() || r.scaling.hasAZeroComponent))
        continue;
      r.computeWorldMatrix(), r.actionManager && r.actionManager.hasSpecificTriggers2(12, 13) && this._meshesForIntersections.pushNoDuplicate(r);
      let s = this.customLODSelector ? this.customLODSelector(r, this.activeCamera) : r.getLOD(this.activeCamera);
      if (r._internalAbstractMeshDataInfo._currentLOD = s, r._internalAbstractMeshDataInfo._currentLODIsUpToDate = !0, s != null && (s !== r && s.billboardMode !== 0 && s.computeWorldMatrix(), r._preActivate(), r.isVisible && r.visibility > 0 && r.layerMask & this.activeCamera.layerMask && (this._skipFrustumClipping || r.alwaysSelectAsActiveMesh || r.isInFrustum(this._frustumPlanes)))) {
        this._activeMeshes.push(r), this.activeCamera._activeMeshes.push(r), s !== r && s._activate(this._renderId, !1);
        for (const a of this._preActiveMeshStage)
          a.action(r);
        r._activate(this._renderId, !1) && (r.isAnInstance ? r._internalAbstractMeshDataInfo._actAsRegularMesh && (s = r) : s._internalAbstractMeshDataInfo._onlyForInstances = !1, s._internalAbstractMeshDataInfo._isActive = !0, this._activeMesh(r, s)), r._postActivate();
      }
    }
    if (this.onAfterActiveMeshesEvaluationObservable.notifyObservers(this), this.particlesEnabled) {
      this.onBeforeParticlesRenderingObservable.notifyObservers(this);
      for (let i = 0; i < this.particleSystems.length; i++) {
        const r = this.particleSystems[i];
        if (!r.isStarted() || !r.emitter)
          continue;
        const s = r.emitter;
        (!s.position || s.isEnabled()) && (this._activeParticleSystems.push(r), r.animate(), this._renderingManager.dispatchParticles(r));
      }
      this.onAfterParticlesRenderingObservable.notifyObservers(this);
    }
  }
  _activeMesh(e, t) {
    this._skeletonsEnabled && t.skeleton !== null && t.skeleton !== void 0 && (this._activeSkeletons.pushNoDuplicate(t.skeleton) && (t.skeleton.prepare(), this._activeBones.addCount(t.skeleton.bones.length, !1)), t.computeBonesUsingShaders || this._softwareSkinnedMeshes.pushNoDuplicate(t));
    let i = e.hasInstances || e.isAnInstance || this.dispatchAllSubMeshesOfActiveMeshes || this._skipFrustumClipping || t.alwaysSelectAsActiveMesh;
    if (t && t.subMeshes && t.subMeshes.length > 0) {
      const r = this.getActiveSubMeshCandidates(t), s = r.length;
      i = i || s === 1;
      for (let a = 0; a < s; a++) {
        const o = r.data[a];
        this._evaluateSubMesh(o, t, e, i);
      }
    }
  }
  /**
   * Update the transform matrix to update from the current active camera
   * @param force defines a boolean used to force the update even if cache is up to date
   */
  updateTransformMatrix(e) {
    const t = this.activeCamera;
    if (t)
      if (t._renderingMultiview) {
        const i = t._rigCameras[0], r = t._rigCameras[1];
        this.setTransformMatrix(i.getViewMatrix(), i.getProjectionMatrix(e), r.getViewMatrix(), r.getProjectionMatrix(e));
      } else
        this.setTransformMatrix(t.getViewMatrix(), t.getProjectionMatrix(e));
  }
  _bindFrameBuffer(e, t = !0) {
    e && e._multiviewTexture ? e._multiviewTexture._bindFrameBuffer() : e && e.outputRenderTarget ? e.outputRenderTarget._bindFrameBuffer() : this._engine._currentFrameBufferIsDefaultFrameBuffer() || this._engine.restoreDefaultFramebuffer(), t && this._clearFrameBuffer(e);
  }
  _clearFrameBuffer(e) {
    if (!(e && e._multiviewTexture)) if (e && e.outputRenderTarget && !e._renderingMultiview) {
      const t = e.outputRenderTarget;
      t.onClearObservable.hasObservers() ? t.onClearObservable.notifyObservers(this._engine) : !t.skipInitialClear && !e.isRightCamera && (this.autoClear && this._engine.clear(t.clearColor || this.clearColor, !t._cleared, !0, !0), t._cleared = !0);
    } else
      this._defaultFrameBufferCleared ? this._engine.clear(null, !1, !0, !0) : (this._defaultFrameBufferCleared = !0, this._clear());
  }
  /**
   * @internal
   */
  _renderForCamera(e, t, i = !0) {
    if (e && e._skipRendering)
      return;
    const r = this._engine;
    if (this._activeCamera = e, !this.activeCamera)
      throw new Error("Active camera not set");
    if (r.setViewport(this.activeCamera.viewport), this.resetCachedMaterial(), this._renderId++, !this.prePass && i) {
      let a = !0;
      e._renderingMultiview && e.outputRenderTarget && (a = e.outputRenderTarget.skipInitialClear, this.autoClear && (this._defaultFrameBufferCleared = !1, e.outputRenderTarget.skipInitialClear = !1)), this._bindFrameBuffer(this._activeCamera), e._renderingMultiview && e.outputRenderTarget && (e.outputRenderTarget.skipInitialClear = a);
    }
    this.updateTransformMatrix(), this.onBeforeCameraRenderObservable.notifyObservers(this.activeCamera), this._evaluateActiveMeshes();
    for (let a = 0; a < this._softwareSkinnedMeshes.length; a++) {
      const o = this._softwareSkinnedMeshes.data[a];
      o.applySkeleton(o.skeleton);
    }
    this.onBeforeRenderTargetsRenderObservable.notifyObservers(this), this._renderTargets.concatWithNoDuplicate(this._materialsRenderTargets), e.customRenderTargets && e.customRenderTargets.length > 0 && this._renderTargets.concatWithNoDuplicate(e.customRenderTargets), t && t.customRenderTargets && t.customRenderTargets.length > 0 && this._renderTargets.concatWithNoDuplicate(t.customRenderTargets), this.environmentTexture && this.environmentTexture.isRenderTarget && this._renderTargets.pushNoDuplicate(this.environmentTexture);
    for (const a of this._gatherActiveCameraRenderTargetsStage)
      a.action(this._renderTargets);
    let s = !1;
    if (this.renderTargetsEnabled) {
      if (this._intermediateRendering = !0, this._renderTargets.length > 0) {
        S.StartPerformanceCounter("Render targets", this._renderTargets.length > 0);
        for (let a = 0; a < this._renderTargets.length; a++) {
          const o = this._renderTargets.data[a];
          if (o._shouldRender()) {
            this._renderId++;
            const h = o.activeCamera && o.activeCamera !== this.activeCamera;
            o.render(h, this.dumpNextRenderTargets), s = !0;
          }
        }
        S.EndPerformanceCounter("Render targets", this._renderTargets.length > 0), this._renderId++;
      }
      for (const a of this._cameraDrawRenderTargetStage)
        s = a.action(this.activeCamera) || s;
      this._intermediateRendering = !1;
    }
    this._engine.currentRenderPassId = e.outputRenderTarget?.renderPassId ?? e.renderPassId ?? 0, s && !this.prePass && (this._bindFrameBuffer(this._activeCamera, !1), this.updateTransformMatrix()), this.onAfterRenderTargetsRenderObservable.notifyObservers(this), this.postProcessManager && !e._multiviewTexture && !this.prePass && this.postProcessManager._prepareFrame();
    for (const a of this._beforeCameraDrawStage)
      a.action(this.activeCamera);
    this.onBeforeDrawPhaseObservable.notifyObservers(this), r.snapshotRendering && r.snapshotRenderingMode === 1 && this.finalizeSceneUbo(), this._renderingManager.render(null, null, !0, !0), this.onAfterDrawPhaseObservable.notifyObservers(this);
    for (const a of this._afterCameraDrawStage)
      a.action(this.activeCamera);
    if (this.postProcessManager && !e._multiviewTexture) {
      const a = e.outputRenderTarget ? e.outputRenderTarget.renderTarget : void 0;
      this.postProcessManager._finalizeFrame(e.isIntermediate, a);
    }
    for (const a of this._afterCameraPostProcessStage)
      a.action(this.activeCamera);
    this._renderTargets.reset(), this.onAfterCameraRenderObservable.notifyObservers(this.activeCamera);
  }
  _processSubCameras(e, t = !0) {
    if (e.cameraRigMode === 0 || e._renderingMultiview) {
      e._renderingMultiview && !this._multiviewSceneUbo && this._createMultiviewUbo(), this._renderForCamera(e, void 0, t), this.onAfterRenderCameraObservable.notifyObservers(e);
      return;
    }
    if (e._useMultiviewToSingleView)
      this._renderMultiviewToSingleView(e);
    else {
      this.onBeforeCameraRenderObservable.notifyObservers(e);
      for (let i = 0; i < e._rigCameras.length; i++)
        this._renderForCamera(e._rigCameras[i], e);
    }
    this._activeCamera = e, this.updateTransformMatrix(), this.onAfterRenderCameraObservable.notifyObservers(e);
  }
  _checkIntersections() {
    for (let e = 0; e < this._meshesForIntersections.length; e++) {
      const t = this._meshesForIntersections.data[e];
      if (t.actionManager)
        for (let i = 0; t.actionManager && i < t.actionManager.actions.length; i++) {
          const r = t.actionManager.actions[i];
          if (r.trigger === 12 || r.trigger === 13) {
            const s = r.getTriggerParameter(), a = s.mesh ? s.mesh : s, o = a.intersectsMesh(t, s.usePreciseIntersection), h = t._intersectionsInProgress.indexOf(a);
            o && h === -1 ? r.trigger === 12 ? (r._executeCurrent(T.CreateNew(t, void 0, a)), t._intersectionsInProgress.push(a)) : r.trigger === 13 && t._intersectionsInProgress.push(a) : !o && h > -1 && (r.trigger === 13 && r._executeCurrent(T.CreateNew(t, void 0, a)), (!t.actionManager.hasSpecificTrigger(13, (l) => {
              const g = l.mesh ? l.mesh : l;
              return a === g;
            }) || r.trigger === 13) && t._intersectionsInProgress.splice(h, 1));
          }
        }
    }
  }
  /**
   * @internal
   */
  _advancePhysicsEngineStep(e) {
  }
  /** @internal */
  _animate(e) {
  }
  /** Execute all animations (for a frame) */
  animate() {
    if (this._engine.isDeterministicLockStep()) {
      let e = Math.max(R.MinDeltaTime, Math.min(this._engine.getDeltaTime(), R.MaxDeltaTime)) + this._timeAccumulator;
      const t = this._engine.getTimeStep(), i = 1e3 / t / 1e3;
      let r = 0;
      const s = this._engine.getLockstepMaxSteps();
      let a = Math.floor(e / t);
      for (a = Math.min(a, s); e > 0 && r < a; )
        this.onBeforeStepObservable.notifyObservers(this), this._animationRatio = t * i, this._animate(t), this.onAfterAnimationsObservable.notifyObservers(this), this.physicsEnabled && this._advancePhysicsEngineStep(t), this.onAfterStepObservable.notifyObservers(this), this._currentStepId++, r++, e -= t;
      this._timeAccumulator = e < 0 ? 0 : e;
    } else {
      const e = this.useConstantAnimationDeltaTime ? 16 : Math.max(R.MinDeltaTime, Math.min(this._engine.getDeltaTime(), R.MaxDeltaTime));
      this._animationRatio = e * (60 / 1e3), this._animate(), this.onAfterAnimationsObservable.notifyObservers(this), this.physicsEnabled && this._advancePhysicsEngineStep(e);
    }
  }
  _clear() {
    (this.autoClearDepthAndStencil || this.autoClear) && this._engine.clear(this.clearColor, this.autoClear || this.forceWireframe || this.forcePointsCloud, this.autoClearDepthAndStencil, this.autoClearDepthAndStencil);
  }
  _checkCameraRenderTarget(e) {
    if (e?.outputRenderTarget && !e?.isRigCamera && (e.outputRenderTarget._cleared = !1), e?.rigCameras?.length)
      for (let t = 0; t < e.rigCameras.length; ++t) {
        const i = e.rigCameras[t].outputRenderTarget;
        i && (i._cleared = !1);
      }
  }
  /**
   * Resets the draw wrappers cache of all meshes
   * @param passId If provided, releases only the draw wrapper corresponding to this render pass id
   */
  resetDrawCache(e) {
    if (this.meshes)
      for (const t of this.meshes)
        t.resetDrawCache(e);
  }
  /**
   * Render the scene
   * @param updateCameras defines a boolean indicating if cameras must update according to their inputs (true by default)
   * @param ignoreAnimations defines a boolean indicating if animations should not be executed (false by default)
   */
  render(e = !0, t = !1) {
    if (this.isDisposed)
      return;
    this.onReadyObservable.hasObservers() && this._executeWhenReadyTimeoutId === null && this._checkIsReady(), this._frameId++, this._defaultFrameBufferCleared = !1, this._checkCameraRenderTarget(this.activeCamera), this.activeCameras?.length && this.activeCameras.forEach(this._checkCameraRenderTarget), this._registerTransientComponents(), this._activeParticles.fetchNewFrame(), this._totalVertices.fetchNewFrame(), this._activeIndices.fetchNewFrame(), this._activeBones.fetchNewFrame(), this._meshesForIntersections.reset(), this.resetCachedMaterial(), this.onBeforeAnimationsObservable.notifyObservers(this), this.actionManager && this.actionManager.processTrigger(11), t || this.animate();
    for (const s of this._beforeCameraUpdateStage)
      s.action();
    if (e) {
      if (this.activeCameras && this.activeCameras.length > 0)
        for (let s = 0; s < this.activeCameras.length; s++) {
          const a = this.activeCameras[s];
          if (a.update(), a.cameraRigMode !== 0)
            for (let o = 0; o < a._rigCameras.length; o++)
              a._rigCameras[o].update();
        }
      else if (this.activeCamera && (this.activeCamera.update(), this.activeCamera.cameraRigMode !== 0))
        for (let s = 0; s < this.activeCamera._rigCameras.length; s++)
          this.activeCamera._rigCameras[s].update();
    }
    this.onBeforeRenderObservable.notifyObservers(this);
    const i = this.getEngine();
    this.onBeforeRenderTargetsRenderObservable.notifyObservers(this);
    const r = this.activeCameras?.length ? this.activeCameras[0] : this.activeCamera;
    if (this.renderTargetsEnabled) {
      S.StartPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0), this._intermediateRendering = !0;
      for (let s = 0; s < this.customRenderTargets.length; s++) {
        const a = this.customRenderTargets[s];
        if (a._shouldRender()) {
          if (this._renderId++, this.activeCamera = a.activeCamera || this.activeCamera, !this.activeCamera)
            throw new Error("Active camera not set");
          i.setViewport(this.activeCamera.viewport), this.updateTransformMatrix(), a.render(r !== this.activeCamera, this.dumpNextRenderTargets);
        }
      }
      S.EndPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0), this._intermediateRendering = !1, this._renderId++;
    }
    this._engine.currentRenderPassId = r?.renderPassId ?? 0, this.activeCamera = r, this._activeCamera && this._activeCamera.cameraRigMode !== 22 && !this.prePass && this._bindFrameBuffer(this._activeCamera, !1), this.onAfterRenderTargetsRenderObservable.notifyObservers(this);
    for (const s of this._beforeClearStage)
      s.action();
    this._clearFrameBuffer(this.activeCamera);
    for (const s of this._gatherRenderTargetsStage)
      s.action(this._renderTargets);
    if (this.activeCameras && this.activeCameras.length > 0)
      for (let s = 0; s < this.activeCameras.length; s++)
        this._processSubCameras(this.activeCameras[s], s > 0);
    else {
      if (!this.activeCamera)
        throw new Error("No camera defined");
      this._processSubCameras(this.activeCamera, !!this.activeCamera.outputRenderTarget);
    }
    this._checkIntersections();
    for (const s of this._afterRenderStage)
      s.action();
    if (this.afterRender && this.afterRender(), this.onAfterRenderObservable.notifyObservers(this), this._toBeDisposed.length) {
      for (let s = 0; s < this._toBeDisposed.length; s++) {
        const a = this._toBeDisposed[s];
        a && a.dispose();
      }
      this._toBeDisposed.length = 0;
    }
    this.dumpNextRenderTargets && (this.dumpNextRenderTargets = !1), this._activeBones.addCount(0, !0), this._activeIndices.addCount(0, !0), this._activeParticles.addCount(0, !0), this._engine.restoreDefaultFramebuffer();
  }
  /**
   * Freeze all materials
   * A frozen material will not be updatable but should be faster to render
   * Note: multimaterials will not be frozen, but their submaterials will
   */
  freezeMaterials() {
    for (let e = 0; e < this.materials.length; e++)
      this.materials[e].freeze();
  }
  /**
   * Unfreeze all materials
   * A frozen material will not be updatable but should be faster to render
   */
  unfreezeMaterials() {
    for (let e = 0; e < this.materials.length; e++)
      this.materials[e].unfreeze();
  }
  /**
   * Releases all held resources
   */
  dispose() {
    if (this.isDisposed)
      return;
    this.beforeRender = null, this.afterRender = null, this.metadata = null, this.skeletons.length = 0, this.morphTargetManagers.length = 0, this._transientComponents.length = 0, this._isReadyForMeshStage.clear(), this._beforeEvaluateActiveMeshStage.clear(), this._evaluateSubMeshStage.clear(), this._preActiveMeshStage.clear(), this._cameraDrawRenderTargetStage.clear(), this._beforeCameraDrawStage.clear(), this._beforeRenderTargetDrawStage.clear(), this._beforeRenderingGroupDrawStage.clear(), this._beforeRenderingMeshStage.clear(), this._afterRenderingMeshStage.clear(), this._afterRenderingGroupDrawStage.clear(), this._afterCameraDrawStage.clear(), this._afterRenderTargetDrawStage.clear(), this._afterRenderStage.clear(), this._beforeCameraUpdateStage.clear(), this._beforeClearStage.clear(), this._gatherRenderTargetsStage.clear(), this._gatherActiveCameraRenderTargetsStage.clear(), this._pointerMoveStage.clear(), this._pointerDownStage.clear(), this._pointerUpStage.clear(), this.importedMeshesFiles = [], this.stopAllAnimations && (this._activeAnimatables.forEach((s) => {
      s.onAnimationEndObservable.clear(), s.onAnimationEnd = null;
    }), this.stopAllAnimations()), this.resetCachedMaterial(), this.activeCamera && (this.activeCamera._activeMeshes.dispose(), this.activeCamera = null), this.activeCameras = null, this._activeMeshes.dispose(), this._renderingManager.dispose(), this._processedMaterials.dispose(), this._activeParticleSystems.dispose(), this._activeSkeletons.dispose(), this._softwareSkinnedMeshes.dispose(), this._renderTargets.dispose(), this._materialsRenderTargets.dispose(), this._registeredForLateAnimationBindings.dispose(), this._meshesForIntersections.dispose(), this._toBeDisposed.length = 0;
    const e = this._activeRequests.slice();
    for (const s of e)
      s.abort();
    this._activeRequests.length = 0;
    try {
      this.onDisposeObservable.notifyObservers(this);
    } catch (s) {
      $.Error("An error occurred while calling onDisposeObservable!", s);
    }
    if (this.detachControl(), this._engine.getInputElement())
      for (let s = 0; s < this.cameras.length; s++)
        this.cameras[s].detachControl();
    this._disposeList(this.animationGroups), this._disposeList(this.lights), this._disposeList(this.meshes, (s) => s.dispose(!0)), this._disposeList(this.transformNodes, (s) => s.dispose(!0));
    const i = this.cameras;
    this._disposeList(i), this._defaultMaterial && this._defaultMaterial.dispose(), this._disposeList(this.multiMaterials), this._disposeList(this.materials), this._disposeList(this.particleSystems), this._disposeList(this.postProcesses), this._disposeList(this.textures), this._disposeList(this.morphTargetManagers), this._sceneUbo.dispose(), this._multiviewSceneUbo && this._multiviewSceneUbo.dispose(), this.postProcessManager.dispose(), this._disposeList(this._components);
    let r = this._engine.scenes.indexOf(this);
    r > -1 && this._engine.scenes.splice(r, 1), G._LastCreatedScene === this && (this._engine.scenes.length > 0 ? G._LastCreatedScene = this._engine.scenes[this._engine.scenes.length - 1] : G._LastCreatedScene = null), r = this._engine._virtualScenes.indexOf(this), r > -1 && this._engine._virtualScenes.splice(r, 1), this._engine.wipeCaches(!0), this.onDisposeObservable.clear(), this.onBeforeRenderObservable.clear(), this.onAfterRenderObservable.clear(), this.onBeforeRenderTargetsRenderObservable.clear(), this.onAfterRenderTargetsRenderObservable.clear(), this.onAfterStepObservable.clear(), this.onBeforeStepObservable.clear(), this.onBeforeActiveMeshesEvaluationObservable.clear(), this.onAfterActiveMeshesEvaluationObservable.clear(), this.onBeforeParticlesRenderingObservable.clear(), this.onAfterParticlesRenderingObservable.clear(), this.onBeforeDrawPhaseObservable.clear(), this.onAfterDrawPhaseObservable.clear(), this.onBeforeAnimationsObservable.clear(), this.onAfterAnimationsObservable.clear(), this.onDataLoadedObservable.clear(), this.onBeforeRenderingGroupObservable.clear(), this.onAfterRenderingGroupObservable.clear(), this.onMeshImportedObservable.clear(), this.onBeforeCameraRenderObservable.clear(), this.onAfterCameraRenderObservable.clear(), this.onAfterRenderCameraObservable.clear(), this.onReadyObservable.clear(), this.onNewCameraAddedObservable.clear(), this.onCameraRemovedObservable.clear(), this.onNewLightAddedObservable.clear(), this.onLightRemovedObservable.clear(), this.onNewGeometryAddedObservable.clear(), this.onGeometryRemovedObservable.clear(), this.onNewTransformNodeAddedObservable.clear(), this.onTransformNodeRemovedObservable.clear(), this.onNewMeshAddedObservable.clear(), this.onMeshRemovedObservable.clear(), this.onNewSkeletonAddedObservable.clear(), this.onSkeletonRemovedObservable.clear(), this.onNewMaterialAddedObservable.clear(), this.onNewMultiMaterialAddedObservable.clear(), this.onMaterialRemovedObservable.clear(), this.onMultiMaterialRemovedObservable.clear(), this.onNewTextureAddedObservable.clear(), this.onTextureRemovedObservable.clear(), this.onPrePointerObservable.clear(), this.onPointerObservable.clear(), this.onPreKeyboardObservable.clear(), this.onKeyboardObservable.clear(), this.onActiveCameraChanged.clear(), this.onScenePerformancePriorityChangedObservable.clear(), this._isDisposed = !0;
  }
  _disposeList(e, t) {
    const i = e.slice(0);
    t = t ?? ((r) => r.dispose());
    for (const r of i)
      t(r);
    e.length = 0;
  }
  /**
   * Gets if the scene is already disposed
   */
  get isDisposed() {
    return this._isDisposed;
  }
  /**
   * Call this function to reduce memory footprint of the scene.
   * Vertex buffers will not store CPU data anymore (this will prevent picking, collisions or physics to work correctly)
   */
  clearCachedVertexData() {
    for (let e = 0; e < this.meshes.length; e++) {
      const i = this.meshes[e].geometry;
      i && i.clearCachedData();
    }
  }
  /**
   * This function will remove the local cached buffer data from texture.
   * It will save memory but will prevent the texture from being rebuilt
   */
  cleanCachedTextureBuffer() {
    for (const e of this.textures)
      e._buffer && (e._buffer = null);
  }
  /**
   * Get the world extend vectors with an optional filter
   *
   * @param filterPredicate the predicate - which meshes should be included when calculating the world size
   * @returns {{ min: Vector3; max: Vector3 }} min and max vectors
   */
  getWorldExtends(e) {
    const t = new y(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), i = new y(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    return e = e || (() => !0), this.meshes.filter(e).forEach((r) => {
      if (r.computeWorldMatrix(!0), !r.subMeshes || r.subMeshes.length === 0 || r.infiniteDistance)
        return;
      const s = r.getBoundingInfo(), a = s.boundingBox.minimumWorld, o = s.boundingBox.maximumWorld;
      y.CheckExtends(a, t, i), y.CheckExtends(o, t, i);
    }), {
      min: t,
      max: i
    };
  }
  // Picking
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Creates a ray that can be used to pick in the scene
   * @param x defines the x coordinate of the origin (on-screen)
   * @param y defines the y coordinate of the origin (on-screen)
   * @param world defines the world matrix to use if you want to pick in object space (instead of world space)
   * @param camera defines the camera to use for the picking
   * @param cameraViewSpace defines if picking will be done in view space (false by default)
   * @returns a Ray
   */
  createPickingRay(e, t, i, r, s = !1) {
    throw k("Ray");
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Creates a ray that can be used to pick in the scene
   * @param x defines the x coordinate of the origin (on-screen)
   * @param y defines the y coordinate of the origin (on-screen)
   * @param world defines the world matrix to use if you want to pick in object space (instead of world space)
   * @param result defines the ray where to store the picking ray
   * @param camera defines the camera to use for the picking
   * @param cameraViewSpace defines if picking will be done in view space (false by default)
   * @param enableDistantPicking defines if picking should handle large values for mesh position/scaling (false by default)
   * @returns the current scene
   */
  createPickingRayToRef(e, t, i, r, s, a = !1, o = !1) {
    throw k("Ray");
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Creates a ray that can be used to pick in the scene
   * @param x defines the x coordinate of the origin (on-screen)
   * @param y defines the y coordinate of the origin (on-screen)
   * @param camera defines the camera to use for the picking
   * @returns a Ray
   */
  createPickingRayInCameraSpace(e, t, i) {
    throw k("Ray");
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Creates a ray that can be used to pick in the scene
   * @param x defines the x coordinate of the origin (on-screen)
   * @param y defines the y coordinate of the origin (on-screen)
   * @param result defines the ray where to store the picking ray
   * @param camera defines the camera to use for the picking
   * @returns the current scene
   */
  createPickingRayInCameraSpaceToRef(e, t, i, r) {
    throw k("Ray");
  }
  /** @internal */
  get _pickingAvailable() {
    return !1;
  }
  /** Launch a ray to try to pick a mesh in the scene
   * @param x position on screen
   * @param y position on screen
   * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
   * @param fastCheck defines if the first intersection will be used (and not the closest)
   * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
   * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
   * @returns a PickingInfo
   */
  pick(e, t, i, r, s, a) {
    const o = k("Ray", !0);
    return o && $.Warn(o), new q();
  }
  /** Launch a ray to try to pick a mesh in the scene using only bounding information of the main mesh (not using submeshes)
   * @param x position on screen
   * @param y position on screen
   * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
   * @param fastCheck defines if the first intersection will be used (and not the closest)
   * @param camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
   * @returns a PickingInfo (Please note that some info will not be set like distance, bv, bu and everything that cannot be capture by only using bounding infos)
   */
  pickWithBoundingInfo(e, t, i, r, s) {
    const a = k("Ray", !0);
    return a && $.Warn(a), new q();
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Use the given ray to pick a mesh in the scene. A mesh triangle can be picked both from its front and back sides,
   * irrespective of orientation.
   * @param ray The ray to use to pick meshes
   * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must have isPickable set to true
   * @param fastCheck defines if the first intersection will be used (and not the closest)
   * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
   * @returns a PickingInfo
   */
  pickWithRay(e, t, i, r) {
    throw k("Ray");
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Launch a ray to try to pick a mesh in the scene. A mesh triangle can be picked both from its front and back sides,
   * irrespective of orientation.
   * @param x X position on screen
   * @param y Y position on screen
   * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
   * @param camera camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used
   * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
   * @returns an array of PickingInfo
   */
  multiPick(e, t, i, r, s) {
    throw k("Ray");
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Launch a ray to try to pick a mesh in the scene
   * @param ray Ray to use
   * @param predicate Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true
   * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
   * @returns an array of PickingInfo
   */
  multiPickWithRay(e, t, i) {
    throw k("Ray");
  }
  /**
   * Force the value of meshUnderPointer
   * @param mesh defines the mesh to use
   * @param pointerId optional pointer id when using more than one pointer
   * @param pickResult optional pickingInfo data used to find mesh
   */
  setPointerOverMesh(e, t, i) {
    this._inputManager.setPointerOverMesh(e, t, i);
  }
  /**
   * Gets the mesh under the pointer
   * @returns a Mesh or null if no mesh is under the pointer
   */
  getPointerOverMesh() {
    return this._inputManager.getPointerOverMesh();
  }
  // Misc.
  /** @internal */
  _rebuildGeometries() {
    for (const e of this.geometries)
      e._rebuild();
    for (const e of this.meshes)
      e._rebuild();
    this.postProcessManager && this.postProcessManager._rebuild();
    for (const e of this._components)
      e.rebuild();
    for (const e of this.particleSystems)
      e.rebuild();
    if (this.spriteManagers)
      for (const e of this.spriteManagers)
        e.rebuild();
  }
  /** @internal */
  _rebuildTextures() {
    for (const e of this.textures)
      e._rebuild(!0);
    this.markAllMaterialsAsDirty(1);
  }
  /**
   * Get from a list of objects by tags
   * @param list the list of objects to use
   * @param tagsQuery the query to use
   * @param filter a predicate to filter for tags
   * @returns
   */
  _getByTags(e, t, i) {
    if (t === void 0)
      return e;
    const r = [];
    for (const s in e) {
      const a = e[s];
      se && se.MatchesQuery(a, t) && (!i || i(a)) && r.push(a);
    }
    return r;
  }
  /**
   * Get a list of meshes by tags
   * @param tagsQuery defines the tags query to use
   * @param filter defines a predicate used to filter results
   * @returns an array of Mesh
   */
  getMeshesByTags(e, t) {
    return this._getByTags(this.meshes, e, t);
  }
  /**
   * Get a list of cameras by tags
   * @param tagsQuery defines the tags query to use
   * @param filter defines a predicate used to filter results
   * @returns an array of Camera
   */
  getCamerasByTags(e, t) {
    return this._getByTags(this.cameras, e, t);
  }
  /**
   * Get a list of lights by tags
   * @param tagsQuery defines the tags query to use
   * @param filter defines a predicate used to filter results
   * @returns an array of Light
   */
  getLightsByTags(e, t) {
    return this._getByTags(this.lights, e, t);
  }
  /**
   * Get a list of materials by tags
   * @param tagsQuery defines the tags query to use
   * @param filter defines a predicate used to filter results
   * @returns an array of Material
   */
  getMaterialByTags(e, t) {
    return this._getByTags(this.materials, e, t).concat(this._getByTags(this.multiMaterials, e, t));
  }
  /**
   * Get a list of transform nodes by tags
   * @param tagsQuery defines the tags query to use
   * @param filter defines a predicate used to filter results
   * @returns an array of TransformNode
   */
  getTransformNodesByTags(e, t) {
    return this._getByTags(this.transformNodes, e, t);
  }
  /**
   * Overrides the default sort function applied in the rendering group to prepare the meshes.
   * This allowed control for front to back rendering or reversly depending of the special needs.
   *
   * @param renderingGroupId The rendering group id corresponding to its index
   * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
   * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
   * @param transparentSortCompareFn The transparent queue comparison function use to sort.
   */
  setRenderingOrder(e, t = null, i = null, r = null) {
    this._renderingManager.setRenderingOrder(e, t, i, r);
  }
  /**
   * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
   *
   * @param renderingGroupId The rendering group id corresponding to its index
   * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
   * @param depth Automatically clears depth between groups if true and autoClear is true.
   * @param stencil Automatically clears stencil between groups if true and autoClear is true.
   */
  setRenderingAutoClearDepthStencil(e, t, i = !0, r = !0) {
    this._renderingManager.setRenderingAutoClearDepthStencil(e, t, i, r);
  }
  /**
   * Gets the current auto clear configuration for one rendering group of the rendering
   * manager.
   * @param index the rendering group index to get the information for
   * @returns The auto clear setup for the requested rendering group
   */
  getAutoClearDepthStencilSetup(e) {
    return this._renderingManager.getAutoClearDepthStencilSetup(e);
  }
  /** @internal */
  _forceBlockMaterialDirtyMechanism(e) {
    this._blockMaterialDirtyMechanism = e;
  }
  /** Gets or sets a boolean blocking all the calls to markAllMaterialsAsDirty (ie. the materials won't be updated if they are out of sync) */
  get blockMaterialDirtyMechanism() {
    return this._blockMaterialDirtyMechanism;
  }
  set blockMaterialDirtyMechanism(e) {
    this._blockMaterialDirtyMechanism !== e && (this._blockMaterialDirtyMechanism = e, e || this.markAllMaterialsAsDirty(63));
  }
  /**
   * Will flag all materials as dirty to trigger new shader compilation
   * @param flag defines the flag used to specify which material part must be marked as dirty
   * @param predicate If not null, it will be used to specify if a material has to be marked as dirty
   */
  markAllMaterialsAsDirty(e, t) {
    if (!this._blockMaterialDirtyMechanism)
      for (const i of this.materials)
        t && !t(i) || i.markAsDirty(e);
  }
  /**
   * @internal
   */
  _loadFile(e, t, i, r, s, a, o) {
    const h = Re(e, t, i, r ? this.offlineProvider : void 0, s, a, o);
    return this._activeRequests.push(h), h.onCompleteObservable.add((l) => {
      this._activeRequests.splice(this._activeRequests.indexOf(l), 1);
    }), h;
  }
  /**
   * @internal
   */
  _loadFileAsync(e, t, i, r, s) {
    return new Promise((a, o) => {
      this._loadFile(e, (h) => {
        a(h);
      }, t, i, r, (h, l) => {
        o(l);
      }, s);
    });
  }
  /**
   * @internal
   */
  _requestFile(e, t, i, r, s, a, o) {
    const h = Oe(e, t, i, r ? this.offlineProvider : void 0, s, a, o);
    return this._activeRequests.push(h), h.onCompleteObservable.add((l) => {
      this._activeRequests.splice(this._activeRequests.indexOf(l), 1);
    }), h;
  }
  /**
   * @internal
   */
  _requestFileAsync(e, t, i, r, s) {
    return new Promise((a, o) => {
      this._requestFile(e, (h) => {
        a(h);
      }, t, i, r, (h) => {
        o(h);
      }, s);
    });
  }
  /**
   * @internal
   */
  _readFile(e, t, i, r, s) {
    const a = Ae(e, t, i, r, s);
    return this._activeRequests.push(a), a.onCompleteObservable.add((o) => {
      this._activeRequests.splice(this._activeRequests.indexOf(o), 1);
    }), a;
  }
  /**
   * @internal
   */
  _readFileAsync(e, t, i) {
    return new Promise((r, s) => {
      this._readFile(e, (a) => {
        r(a);
      }, t, i, (a) => {
        s(a);
      });
    });
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * This method gets the performance collector belonging to the scene, which is generally shared with the inspector.
   * @returns the perf collector belonging to the scene.
   */
  getPerfCollector() {
    throw k("performanceViewerSceneExtension");
  }
  // deprecated
  /**
   * Sets the active camera of the scene using its Id
   * @param id defines the camera's Id
   * @returns the new active camera or null if none found.
   * @deprecated Please use setActiveCameraById instead
   */
  setActiveCameraByID(e) {
    return this.setActiveCameraById(e);
  }
  /**
   * Get a material using its id
   * @param id defines the material's Id
   * @returns the material or null if none found.
   * @deprecated Please use getMaterialById instead
   */
  getMaterialByID(e) {
    return this.getMaterialById(e);
  }
  /**
   * Gets a the last added material using a given id
   * @param id defines the material's Id
   * @returns the last material with the given id or null if none found.
   * @deprecated Please use getLastMaterialById instead
   */
  getLastMaterialByID(e) {
    return this.getLastMaterialById(e);
  }
  /**
   * Get a texture using its unique id
   * @param uniqueId defines the texture's unique id
   * @returns the texture or null if none found.
   * @deprecated Please use getTextureByUniqueId instead
   */
  getTextureByUniqueID(e) {
    return this.getTextureByUniqueId(e);
  }
  /**
   * Gets a camera using its Id
   * @param id defines the Id to look for
   * @returns the camera or null if not found
   * @deprecated Please use getCameraById instead
   */
  getCameraByID(e) {
    return this.getCameraById(e);
  }
  /**
   * Gets a camera using its unique Id
   * @param uniqueId defines the unique Id to look for
   * @returns the camera or null if not found
   * @deprecated Please use getCameraByUniqueId instead
   */
  getCameraByUniqueID(e) {
    return this.getCameraByUniqueId(e);
  }
  /**
   * Gets a bone using its Id
   * @param id defines the bone's Id
   * @returns the bone or null if not found
   * @deprecated Please use getBoneById instead
   */
  getBoneByID(e) {
    return this.getBoneById(e);
  }
  /**
   * Gets a light node using its Id
   * @param id defines the light's Id
   * @returns the light or null if none found.
   * @deprecated Please use getLightById instead
   */
  getLightByID(e) {
    return this.getLightById(e);
  }
  /**
   * Gets a light node using its scene-generated unique Id
   * @param uniqueId defines the light's unique Id
   * @returns the light or null if none found.
   * @deprecated Please use getLightByUniqueId instead
   */
  getLightByUniqueID(e) {
    return this.getLightByUniqueId(e);
  }
  /**
   * Gets a particle system by Id
   * @param id defines the particle system Id
   * @returns the corresponding system or null if none found
   * @deprecated Please use getParticleSystemById instead
   */
  getParticleSystemByID(e) {
    return this.getParticleSystemById(e);
  }
  /**
   * Gets a geometry using its Id
   * @param id defines the geometry's Id
   * @returns the geometry or null if none found.
   * @deprecated Please use getGeometryById instead
   */
  getGeometryByID(e) {
    return this.getGeometryById(e);
  }
  /**
   * Gets the first added mesh found of a given Id
   * @param id defines the Id to search for
   * @returns the mesh found or null if not found at all
   * @deprecated Please use getMeshById instead
   */
  getMeshByID(e) {
    return this.getMeshById(e);
  }
  /**
   * Gets a mesh with its auto-generated unique Id
   * @param uniqueId defines the unique Id to search for
   * @returns the found mesh or null if not found at all.
   * @deprecated Please use getMeshByUniqueId instead
   */
  getMeshByUniqueID(e) {
    return this.getMeshByUniqueId(e);
  }
  /**
   * Gets a the last added mesh using a given Id
   * @param id defines the Id to search for
   * @returns the found mesh or null if not found at all.
   * @deprecated Please use getLastMeshById instead
   */
  getLastMeshByID(e) {
    return this.getLastMeshById(e);
  }
  /**
   * Gets a list of meshes using their Id
   * @param id defines the Id to search for
   * @returns a list of meshes
   * @deprecated Please use getMeshesById instead
   */
  getMeshesByID(e) {
    return this.getMeshesById(e);
  }
  /**
   * Gets the first added transform node found of a given Id
   * @param id defines the Id to search for
   * @returns the found transform node or null if not found at all.
   * @deprecated Please use getTransformNodeById instead
   */
  getTransformNodeByID(e) {
    return this.getTransformNodeById(e);
  }
  /**
   * Gets a transform node with its auto-generated unique Id
   * @param uniqueId defines the unique Id to search for
   * @returns the found transform node or null if not found at all.
   * @deprecated Please use getTransformNodeByUniqueId instead
   */
  getTransformNodeByUniqueID(e) {
    return this.getTransformNodeByUniqueId(e);
  }
  /**
   * Gets a list of transform nodes using their Id
   * @param id defines the Id to search for
   * @returns a list of transform nodes
   * @deprecated Please use getTransformNodesById instead
   */
  getTransformNodesByID(e) {
    return this.getTransformNodesById(e);
  }
  /**
   * Gets a node (Mesh, Camera, Light) using a given Id
   * @param id defines the Id to search for
   * @returns the found node or null if not found at all
   * @deprecated Please use getNodeById instead
   */
  getNodeByID(e) {
    return this.getNodeById(e);
  }
  /**
   * Gets a the last added node (Mesh, Camera, Light) using a given Id
   * @param id defines the Id to search for
   * @returns the found node or null if not found at all
   * @deprecated Please use getLastEntryById instead
   */
  getLastEntryByID(e) {
    return this.getLastEntryById(e);
  }
  /**
   * Gets a skeleton using a given Id (if many are found, this function will pick the last one)
   * @param id defines the Id to search for
   * @returns the found skeleton or null if not found at all.
   * @deprecated Please use getLastSkeletonById instead
   */
  getLastSkeletonByID(e) {
    return this.getLastSkeletonById(e);
  }
}
R.FOGMODE_NONE = 0;
R.FOGMODE_EXP = 1;
R.FOGMODE_EXP2 = 2;
R.FOGMODE_LINEAR = 3;
R.MinDeltaTime = 1;
R.MaxDeltaTime = 1e3;
const $e = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Scene: R,
  get ScenePerformancePriority() {
    return U;
  }
}, Symbol.toStringTag, { value: "Module" }));
export {
  ee as A,
  M as C,
  ue as D,
  j as E,
  p as I,
  X as K,
  z as N,
  q as P,
  u as S,
  ve as U,
  de as X,
  R as a,
  U as b,
  A as c,
  T as d,
  fe as e,
  Le as f,
  d as g,
  le as h,
  he as i,
  J as j,
  oe as k,
  c as l,
  C as m,
  ae as n,
  ce as o,
  $e as s
};
//# sourceMappingURL=scene-BIBh3wH1.js.map
