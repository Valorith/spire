import { h as M, p as c, a as _, G as y, b as h, q as T, c as l, t as E } from "./embed-entry-BKE21f6Q.js";
import { N as f } from "./node-Cogu8C4Q.js";
import { U as p } from "./uniformBuffer-LDIehZve.js";
import { L as r } from "./lightConstants-BXeaZQS1.js";
import { S as I } from "./decorators.serialization-DfmppPDN.js";
class t extends f {
  /**
   * Defines how far from the source the light is impacting in scene units.
   * Note: Unused in PBR material as the distance light falloff is defined following the inverse squared falloff.
   */
  get range() {
    return this._range;
  }
  /**
   * Defines how far from the source the light is impacting in scene units.
   * Note: Unused in PBR material as the distance light falloff is defined following the inverse squared falloff.
   */
  set range(e) {
    this._range = e, this._inverseSquaredRange = 1 / (this.range * this.range);
  }
  /**
   * Gets the photometric scale used to interpret the intensity.
   * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
   */
  get intensityMode() {
    return this._intensityMode;
  }
  /**
   * Sets the photometric scale used to interpret the intensity.
   * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
   */
  set intensityMode(e) {
    this._intensityMode = e, this._computePhotometricScale();
  }
  /**
   * Gets the light radius used by PBR Materials to simulate soft area lights.
   */
  get radius() {
    return this._radius;
  }
  /**
   * sets the light radius used by PBR Materials to simulate soft area lights.
   */
  set radius(e) {
    this._radius = e, this._computePhotometricScale();
  }
  /**
   * Gets whether or not the shadows are enabled for this light. This can help turning off/on shadow without detaching
   * the current shadow generator.
   */
  get shadowEnabled() {
    return this._shadowEnabled;
  }
  /**
   * Sets whether or not the shadows are enabled for this light. This can help turning off/on shadow without detaching
   * the current shadow generator.
   */
  set shadowEnabled(e) {
    this._shadowEnabled !== e && (this._shadowEnabled = e, this._markMeshesAsLightDirty());
  }
  /**
   * Gets the only meshes impacted by this light.
   */
  get includedOnlyMeshes() {
    return this._includedOnlyMeshes;
  }
  /**
   * Sets the only meshes impacted by this light.
   */
  set includedOnlyMeshes(e) {
    this._includedOnlyMeshes = e, this._hookArrayForIncludedOnly(e);
  }
  /**
   * Gets the meshes not impacted by this light.
   */
  get excludedMeshes() {
    return this._excludedMeshes;
  }
  /**
   * Sets the meshes not impacted by this light.
   */
  set excludedMeshes(e) {
    this._excludedMeshes = e, this._hookArrayForExcluded(e);
  }
  /**
   * Gets the layer id use to find what meshes are not impacted by the light.
   * Inactive if 0
   */
  get excludeWithLayerMask() {
    return this._excludeWithLayerMask;
  }
  /**
   * Sets the layer id use to find what meshes are not impacted by the light.
   * Inactive if 0
   */
  set excludeWithLayerMask(e) {
    this._excludeWithLayerMask = e, this._resyncMeshes();
  }
  /**
   * Gets the layer id use to find what meshes are impacted by the light.
   * Inactive if 0
   */
  get includeOnlyWithLayerMask() {
    return this._includeOnlyWithLayerMask;
  }
  /**
   * Sets the layer id use to find what meshes are impacted by the light.
   * Inactive if 0
   */
  set includeOnlyWithLayerMask(e) {
    this._includeOnlyWithLayerMask = e, this._resyncMeshes();
  }
  /**
   * Gets the lightmap mode of this light (should be one of the constants defined by Light.LIGHTMAP_x)
   */
  get lightmapMode() {
    return this._lightmapMode;
  }
  /**
   * Sets the lightmap mode of this light (should be one of the constants defined by Light.LIGHTMAP_x)
   */
  set lightmapMode(e) {
    this._lightmapMode !== e && (this._lightmapMode = e, this._markMeshesAsLightDirty());
  }
  /**
   * Returns the view matrix.
   * @param _faceIndex The index of the face for which we want to extract the view matrix. Only used for point light types.
   * @returns The view matrix. Can be null, if a view matrix cannot be defined for the type of light considered (as for a hemispherical light, for example).
   */
  getViewMatrix(e) {
    return null;
  }
  /**
   * Returns the projection matrix.
   * Note that viewMatrix and renderList are optional and are only used by lights that calculate the projection matrix from a list of meshes (e.g. directional lights with automatic extents calculation).
   * @param _viewMatrix The view transform matrix of the light (optional).
   * @param _renderList The list of meshes to take into account when calculating the projection matrix (optional).
   * @returns The projection matrix. Can be null, if a projection matrix cannot be defined for the type of light considered (as for a hemispherical light, for example).
   */
  getProjectionMatrix(e, i) {
    return null;
  }
  /**
   * Creates a Light object in the scene.
   * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
   * @param name The friendly name of the light
   * @param scene The scene the light belongs too
   */
  constructor(e, i) {
    super(e, i), this.diffuse = new M(1, 1, 1), this.specular = new M(1, 1, 1), this.falloffType = t.FALLOFF_DEFAULT, this.intensity = 1, this._range = Number.MAX_VALUE, this._inverseSquaredRange = 0, this._photometricScale = 1, this._intensityMode = t.INTENSITYMODE_AUTOMATIC, this._radius = 1e-5, this.renderPriority = 0, this._shadowEnabled = !0, this._excludeWithLayerMask = 0, this._includeOnlyWithLayerMask = 0, this._lightmapMode = 0, this._shadowGenerators = null, this._excludedMeshesIds = new Array(), this._includedOnlyMeshesIds = new Array(), this._isLight = !0, this.getScene().addLight(this), this._uniformBuffer = new p(this.getScene().getEngine(), void 0, void 0, e), this._buildUniformLayout(), this.includedOnlyMeshes = [], this.excludedMeshes = [], this._resyncMeshes();
  }
  /**
   * Sets the passed Effect "effect" with the Light textures.
   * @param effect The effect to update
   * @param lightIndex The index of the light in the effect to update
   * @returns The light
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transferTexturesToEffect(e, i) {
    return this;
  }
  /**
   * Binds the lights information from the scene to the effect for the given mesh.
   * @param lightIndex Light index
   * @param scene The scene where the light belongs to
   * @param effect The effect we are binding the data to
   * @param useSpecular Defines if specular is supported
   * @param receiveShadows Defines if the effect (mesh) we bind the light for receives shadows
   */
  _bindLight(e, i, n, s, o = !0) {
    const a = e.toString();
    let d = !1;
    if (this._uniformBuffer.bindToEffect(n, "Light" + a), this._renderId !== i.getRenderId() || this._lastUseSpecular !== s || !this._uniformBuffer.useUbo) {
      this._renderId = i.getRenderId(), this._lastUseSpecular = s;
      const u = this.getScaledIntensity();
      this.transferToEffect(n, a), this.diffuse.scaleToRef(u, c.Color3[0]), this._uniformBuffer.updateColor4("vLightDiffuse", c.Color3[0], this.range, a), s && (this.specular.scaleToRef(u, c.Color3[1]), this._uniformBuffer.updateColor4("vLightSpecular", c.Color3[1], this.radius, a)), d = !0;
    }
    if (this.transferTexturesToEffect(n, a), i.shadowsEnabled && this.shadowEnabled && o) {
      const u = this.getShadowGenerator(i.activeCamera) ?? this.getShadowGenerator();
      u && (u.bindShadowLight(a, n), d = !0);
    }
    d ? this._uniformBuffer.update() : this._uniformBuffer.bindUniformBuffer();
  }
  /**
   * Returns the string "Light".
   * @returns the class name
   */
  getClassName() {
    return "Light";
  }
  /**
   * Converts the light information to a readable string for debug purpose.
   * @param fullDetails Supports for multiple levels of logging within scene loading
   * @returns the human readable light info
   */
  toString(e) {
    let i = "Name: " + this.name;
    if (i += ", type: " + ["Point", "Directional", "Spot", "Hemispheric"][this.getTypeID()], this.animations)
      for (let n = 0; n < this.animations.length; n++)
        i += ", animation[0]: " + this.animations[n].toString(e);
    return i;
  }
  /** @internal */
  _syncParentEnabledState() {
    super._syncParentEnabledState(), this.isDisposed() || this._resyncMeshes();
  }
  /**
   * Set the enabled state of this node.
   * @param value - the new enabled state
   */
  setEnabled(e) {
    super.setEnabled(e), this._resyncMeshes();
  }
  /**
   * Returns the Light associated shadow generator if any.
   * @param camera Camera for which the shadow generator should be retrieved (default: null). If null, retrieves the default shadow generator
   * @returns the associated shadow generator.
   */
  getShadowGenerator(e = null) {
    return this._shadowGenerators === null ? null : this._shadowGenerators.get(e) ?? null;
  }
  /**
   * Returns all the shadow generators associated to this light
   * @returns
   */
  getShadowGenerators() {
    return this._shadowGenerators;
  }
  /**
   * Returns a Vector3, the absolute light position in the World.
   * @returns the world space position of the light
   */
  getAbsolutePosition() {
    return _.Zero();
  }
  /**
   * Specifies if the light will affect the passed mesh.
   * @param mesh The mesh to test against the light
   * @returns true the mesh is affected otherwise, false.
   */
  canAffectMesh(e) {
    return e ? !(this.includedOnlyMeshes && this.includedOnlyMeshes.length > 0 && this.includedOnlyMeshes.indexOf(e) === -1 || this.excludedMeshes && this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(e) !== -1 || this.includeOnlyWithLayerMask !== 0 && !(this.includeOnlyWithLayerMask & e.layerMask) || this.excludeWithLayerMask !== 0 && this.excludeWithLayerMask & e.layerMask) : !0;
  }
  /**
   * Releases resources associated with this node.
   * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
   * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
   */
  dispose(e, i = !1) {
    if (this._shadowGenerators) {
      const n = this._shadowGenerators.values();
      for (let s = n.next(); s.done !== !0; s = n.next())
        s.value.dispose();
      this._shadowGenerators = null;
    }
    if (this.getScene().stopAnimation(this), this._parentContainer) {
      const n = this._parentContainer.lights.indexOf(this);
      n > -1 && this._parentContainer.lights.splice(n, 1), this._parentContainer = null;
    }
    for (const n of this.getScene().meshes)
      n._removeLightSource(this, !0);
    this._uniformBuffer.dispose(), this.getScene().removeLight(this), super.dispose(e, i);
  }
  /**
   * Returns the light type ID (integer).
   * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
   */
  getTypeID() {
    return 0;
  }
  /**
   * Returns the intensity scaled by the Photometric Scale according to the light type and intensity mode.
   * @returns the scaled intensity in intensity mode unit
   */
  getScaledIntensity() {
    return this._photometricScale * this.intensity;
  }
  /**
   * Returns a new Light object, named "name", from the current one.
   * @param name The name of the cloned light
   * @param newParent The parent of this light, if it has one
   * @returns the new created light
   */
  clone(e, i = null) {
    const n = t.GetConstructorFromName(this.getTypeID(), e, this.getScene());
    if (!n)
      return null;
    const s = I.Clone(n, this);
    return e && (s.name = e), i && (s.parent = i), s.setEnabled(this.isEnabled()), this.onClonedObservable.notifyObservers(s), s;
  }
  /**
   * Serializes the current light into a Serialization object.
   * @returns the serialized object.
   */
  serialize() {
    const e = I.Serialize(this);
    return e.uniqueId = this.uniqueId, e.type = this.getTypeID(), this.parent && this.parent._serializeAsParent(e), this.excludedMeshes.length > 0 && (e.excludedMeshesIds = [], this.excludedMeshes.forEach((i) => {
      e.excludedMeshesIds.push(i.id);
    })), this.includedOnlyMeshes.length > 0 && (e.includedOnlyMeshesIds = [], this.includedOnlyMeshes.forEach((i) => {
      e.includedOnlyMeshesIds.push(i.id);
    })), I.AppendSerializedAnimations(this, e), e.ranges = this.serializeAnimationRanges(), e.isEnabled = this.isEnabled(), e;
  }
  /**
   * Creates a new typed light from the passed type (integer) : point light = 0, directional light = 1, spot light = 2, hemispheric light = 3.
   * This new light is named "name" and added to the passed scene.
   * @param type Type according to the types available in Light.LIGHTTYPEID_x
   * @param name The friendly name of the light
   * @param scene The scene the new light will belong to
   * @returns the constructor function
   */
  static GetConstructorFromName(e, i, n) {
    const s = f.Construct("Light_Type_" + e, i, n);
    return s || null;
  }
  /**
   * Parses the passed "parsedLight" and returns a new instanced Light from this parsing.
   * @param parsedLight The JSON representation of the light
   * @param scene The scene to create the parsed light in
   * @returns the created light after parsing
   */
  static Parse(e, i) {
    const n = t.GetConstructorFromName(e.type, e.name, i);
    if (!n)
      return null;
    const s = I.Parse(n, e, i);
    if (e.excludedMeshesIds && (s._excludedMeshesIds = e.excludedMeshesIds), e.includedOnlyMeshesIds && (s._includedOnlyMeshesIds = e.includedOnlyMeshesIds), e.parentId !== void 0 && (s._waitingParentId = e.parentId), e.parentInstanceIndex !== void 0 && (s._waitingParentInstanceIndex = e.parentInstanceIndex), e.falloffType !== void 0 && (s.falloffType = e.falloffType), e.lightmapMode !== void 0 && (s.lightmapMode = e.lightmapMode), e.animations) {
      for (let o = 0; o < e.animations.length; o++) {
        const a = e.animations[o], d = y("BABYLON.Animation");
        d && s.animations.push(d.Parse(a));
      }
      f.ParseAnimationRanges(s, e, i);
    }
    return e.autoAnimate && i.beginAnimation(s, e.autoAnimateFrom, e.autoAnimateTo, e.autoAnimateLoop, e.autoAnimateSpeed || 1), e.isEnabled !== void 0 && s.setEnabled(e.isEnabled), s;
  }
  _hookArrayForExcluded(e) {
    const i = e.push;
    e.push = (...s) => {
      const o = i.apply(e, s);
      for (const a of s)
        a._resyncLightSource(this);
      return o;
    };
    const n = e.splice;
    e.splice = (s, o) => {
      const a = n.apply(e, [s, o]);
      for (const d of a)
        d._resyncLightSource(this);
      return a;
    };
    for (const s of e)
      s._resyncLightSource(this);
  }
  _hookArrayForIncludedOnly(e) {
    const i = e.push;
    e.push = (...s) => {
      const o = i.apply(e, s);
      return this._resyncMeshes(), o;
    };
    const n = e.splice;
    e.splice = (s, o) => {
      const a = n.apply(e, [s, o]);
      return this._resyncMeshes(), a;
    }, this._resyncMeshes();
  }
  _resyncMeshes() {
    for (const e of this.getScene().meshes)
      e._resyncLightSource(this);
  }
  /**
   * Forces the meshes to update their light related information in their rendering used effects
   * @internal Internal Use Only
   */
  _markMeshesAsLightDirty() {
    for (const e of this.getScene().meshes)
      e.lightSources.indexOf(this) !== -1 && e._markSubMeshesAsLightDirty();
  }
  /**
   * Recomputes the cached photometric scale if needed.
   */
  _computePhotometricScale() {
    this._photometricScale = this._getPhotometricScale(), this.getScene().resetCachedMaterial();
  }
  /**
   * @returns the Photometric Scale according to the light type and intensity mode.
   */
  _getPhotometricScale() {
    let e = 0;
    const i = this.getTypeID();
    let n = this.intensityMode;
    switch (n === t.INTENSITYMODE_AUTOMATIC && (i === t.LIGHTTYPEID_DIRECTIONALLIGHT ? n = t.INTENSITYMODE_ILLUMINANCE : n = t.INTENSITYMODE_LUMINOUSINTENSITY), i) {
      case t.LIGHTTYPEID_POINTLIGHT:
      case t.LIGHTTYPEID_SPOTLIGHT:
        switch (n) {
          case t.INTENSITYMODE_LUMINOUSPOWER:
            e = 1 / (4 * Math.PI);
            break;
          case t.INTENSITYMODE_LUMINOUSINTENSITY:
            e = 1;
            break;
          case t.INTENSITYMODE_LUMINANCE:
            e = this.radius * this.radius;
            break;
        }
        break;
      case t.LIGHTTYPEID_DIRECTIONALLIGHT:
        switch (n) {
          case t.INTENSITYMODE_ILLUMINANCE:
            e = 1;
            break;
          case t.INTENSITYMODE_LUMINANCE: {
            let s = this.radius;
            s = Math.max(s, 1e-3), e = 2 * Math.PI * (1 - Math.cos(s));
            break;
          }
        }
        break;
      case t.LIGHTTYPEID_HEMISPHERICLIGHT:
        e = 1;
        break;
    }
    return e;
  }
  /**
   * Reorder the light in the scene according to their defined priority.
   * @internal Internal Use Only
   */
  _reorderLightsInScene() {
    const e = this.getScene();
    this._renderPriority != 0 && (e.requireLightSorting = !0), this.getScene().sortLightsByPriority();
  }
}
t.FALLOFF_DEFAULT = r.FALLOFF_DEFAULT;
t.FALLOFF_PHYSICAL = r.FALLOFF_PHYSICAL;
t.FALLOFF_GLTF = r.FALLOFF_GLTF;
t.FALLOFF_STANDARD = r.FALLOFF_STANDARD;
t.LIGHTMAP_DEFAULT = r.LIGHTMAP_DEFAULT;
t.LIGHTMAP_SPECULAR = r.LIGHTMAP_SPECULAR;
t.LIGHTMAP_SHADOWSONLY = r.LIGHTMAP_SHADOWSONLY;
t.INTENSITYMODE_AUTOMATIC = r.INTENSITYMODE_AUTOMATIC;
t.INTENSITYMODE_LUMINOUSPOWER = r.INTENSITYMODE_LUMINOUSPOWER;
t.INTENSITYMODE_LUMINOUSINTENSITY = r.INTENSITYMODE_LUMINOUSINTENSITY;
t.INTENSITYMODE_ILLUMINANCE = r.INTENSITYMODE_ILLUMINANCE;
t.INTENSITYMODE_LUMINANCE = r.INTENSITYMODE_LUMINANCE;
t.LIGHTTYPEID_POINTLIGHT = r.LIGHTTYPEID_POINTLIGHT;
t.LIGHTTYPEID_DIRECTIONALLIGHT = r.LIGHTTYPEID_DIRECTIONALLIGHT;
t.LIGHTTYPEID_SPOTLIGHT = r.LIGHTTYPEID_SPOTLIGHT;
t.LIGHTTYPEID_HEMISPHERICLIGHT = r.LIGHTTYPEID_HEMISPHERICLIGHT;
h([
  T()
], t.prototype, "diffuse", void 0);
h([
  T()
], t.prototype, "specular", void 0);
h([
  l()
], t.prototype, "falloffType", void 0);
h([
  l()
], t.prototype, "intensity", void 0);
h([
  l()
], t.prototype, "range", null);
h([
  l()
], t.prototype, "intensityMode", null);
h([
  l()
], t.prototype, "radius", null);
h([
  l()
], t.prototype, "_renderPriority", void 0);
h([
  E("_reorderLightsInScene")
], t.prototype, "renderPriority", void 0);
h([
  l("shadowEnabled")
], t.prototype, "_shadowEnabled", void 0);
h([
  l("excludeWithLayerMask")
], t.prototype, "_excludeWithLayerMask", void 0);
h([
  l("includeOnlyWithLayerMask")
], t.prototype, "_includeOnlyWithLayerMask", void 0);
h([
  l("lightmapMode")
], t.prototype, "_lightmapMode", void 0);
export {
  t as Light
};
//# sourceMappingURL=light-BhQ2uI3v.js.map
