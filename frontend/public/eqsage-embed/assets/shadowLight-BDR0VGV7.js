import { M as e, a as i, i as h, b as s, s as d, c } from "./embed-entry-Dediijbe.js";
import { Light as p } from "./light-BGVkPQ2X.js";
import { A as u } from "./math.axis-Drk1BmmE.js";
class n extends p {
  constructor() {
    super(...arguments), this._needProjectionMatrixCompute = !0, this._viewMatrix = e.Identity(), this._projectionMatrix = e.Identity();
  }
  _setPosition(t) {
    this._position = t;
  }
  /**
   * Sets the position the shadow will be casted from. Also use as the light position for both
   * point and spot lights.
   */
  get position() {
    return this._position;
  }
  /**
   * Sets the position the shadow will be casted from. Also use as the light position for both
   * point and spot lights.
   */
  set position(t) {
    this._setPosition(t);
  }
  _setDirection(t) {
    this._direction = t;
  }
  /**
   * In 2d mode (needCube being false), gets the direction used to cast the shadow.
   * Also use as the light direction on spot and directional lights.
   */
  get direction() {
    return this._direction;
  }
  /**
   * In 2d mode (needCube being false), sets the direction used to cast the shadow.
   * Also use as the light direction on spot and directional lights.
   */
  set direction(t) {
    this._setDirection(t);
  }
  /**
   * Gets the shadow projection clipping minimum z value.
   */
  get shadowMinZ() {
    return this._shadowMinZ;
  }
  /**
   * Sets the shadow projection clipping minimum z value.
   */
  set shadowMinZ(t) {
    this._shadowMinZ = t, this.forceProjectionMatrixCompute();
  }
  /**
   * Sets the shadow projection clipping maximum z value.
   */
  get shadowMaxZ() {
    return this._shadowMaxZ;
  }
  /**
   * Gets the shadow projection clipping maximum z value.
   */
  set shadowMaxZ(t) {
    this._shadowMaxZ = t, this.forceProjectionMatrixCompute();
  }
  /**
   * Computes the transformed information (transformedPosition and transformedDirection in World space) of the current light
   * @returns true if the information has been computed, false if it does not need to (no parenting)
   */
  computeTransformedInformation() {
    return this.parent && this.parent.getWorldMatrix ? (this.transformedPosition || (this.transformedPosition = i.Zero()), i.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this.transformedPosition), this.direction && (this.transformedDirection || (this.transformedDirection = i.Zero()), i.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this.transformedDirection)), !0) : !1;
  }
  /**
   * Return the depth scale used for the shadow map.
   * @returns the depth scale.
   */
  getDepthScale() {
    return 50;
  }
  /**
   * Get the direction to use to render the shadow map. In case of cube texture, the face index can be passed.
   * @param faceIndex The index of the face we are computed the direction to generate shadow
   * @returns The set direction in 2d mode otherwise the direction to the cubemap face if needCube() is true
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getShadowDirection(t) {
    return this.transformedDirection ? this.transformedDirection : this.direction;
  }
  /**
   * If computeTransformedInformation has been called, returns the ShadowLight absolute position in the world. Otherwise, returns the local position.
   * @returns the position vector in world space
   */
  getAbsolutePosition() {
    return this.transformedPosition ? this.transformedPosition : this.position;
  }
  /**
   * Sets the ShadowLight direction toward the passed target.
   * @param target The point to target in local space
   * @returns the updated ShadowLight direction
   */
  setDirectionToTarget(t) {
    return this.direction = i.Normalize(t.subtract(this.position)), this.direction;
  }
  /**
   * Returns the light rotation in euler definition.
   * @returns the x y z rotation in local space.
   */
  getRotation() {
    this.direction.normalize();
    const t = i.Cross(this.direction, u.Y), o = i.Cross(t, this.direction);
    return i.RotationFromAxis(t, o, this.direction);
  }
  /**
   * Returns whether or not the shadow generation require a cube texture or a 2d texture.
   * @returns true if a cube texture needs to be use
   */
  needCube() {
    return !1;
  }
  /**
   * Detects if the projection matrix requires to be recomputed this frame.
   * @returns true if it requires to be recomputed otherwise, false.
   */
  needProjectionMatrixCompute() {
    return this._needProjectionMatrixCompute;
  }
  /**
   * Forces the shadow generator to recompute the projection matrix even if position and direction did not changed.
   */
  forceProjectionMatrixCompute() {
    this._needProjectionMatrixCompute = !0;
  }
  /** @internal */
  _initCache() {
    super._initCache(), this._cache.position = i.Zero();
  }
  /** @internal */
  _isSynchronized() {
    return !!this._cache.position.equals(this.position);
  }
  /**
   * Computes the world matrix of the node
   * @param force defines if the cache version should be invalidated forcing the world matrix to be created from scratch
   * @returns the world matrix
   */
  computeWorldMatrix(t) {
    return !t && this.isSynchronized() ? (this._currentRenderId = this.getScene().getRenderId(), this._worldMatrix) : (this._updateCache(), this._cache.position.copyFrom(this.position), this._worldMatrix || (this._worldMatrix = e.Identity()), e.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix), this.parent && this.parent.getWorldMatrix && (this._worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix), this._markSyncedWithParent()), this._worldMatrixDeterminantIsDirty = !0, this._worldMatrix);
  }
  /**
   * Gets the minZ used for shadow according to both the scene and the light.
   * @param activeCamera The camera we are returning the min for
   * @returns the depth min z
   */
  getDepthMinZ(t) {
    return this.shadowMinZ !== void 0 ? this.shadowMinZ : t.minZ;
  }
  /**
   * Gets the maxZ used for shadow according to both the scene and the light.
   * @param activeCamera The camera we are returning the max for
   * @returns the depth max z
   */
  getDepthMaxZ(t) {
    return this.shadowMaxZ !== void 0 ? this.shadowMaxZ : t.maxZ;
  }
  /**
   * Sets the shadow projection matrix in parameter to the generated projection matrix.
   * @param matrix The matrix to updated with the projection information
   * @param viewMatrix The transform matrix of the light
   * @param renderList The list of mesh to render in the map
   * @returns The current light
   */
  setShadowProjectionMatrix(t, o, r) {
    return this.customProjectionMatrixBuilder ? this.customProjectionMatrixBuilder(o, r, t) : this._setDefaultShadowProjectionMatrix(t, o, r), this;
  }
  /** @internal */
  _syncParentEnabledState() {
    super._syncParentEnabledState(), (!this.parent || !this.parent.getWorldMatrix) && (this.transformedPosition = null, this.transformedDirection = null);
  }
  /**
   * Returns the view matrix.
   * @param faceIndex The index of the face for which we want to extract the view matrix. Only used for point light types.
   * @returns The view matrix. Can be null, if a view matrix cannot be defined for the type of light considered (as for a hemispherical light, for example).
   */
  getViewMatrix(t) {
    const o = h.Vector3[0];
    let r = this.position;
    this.computeTransformedInformation() && (r = this.transformedPosition), i.NormalizeToRef(this.getShadowDirection(t), o), Math.abs(i.Dot(o, i.Up())) === 1 && (o.z = 1e-13);
    const a = h.Vector3[1];
    return r.addToRef(o, a), e.LookAtLHToRef(r, a, i.Up(), this._viewMatrix), this._viewMatrix;
  }
  /**
   * Returns the projection matrix.
   * Note that viewMatrix and renderList are optional and are only used by lights that calculate the projection matrix from a list of meshes (e.g. directional lights with automatic extents calculation).
   * @param viewMatrix The view transform matrix of the light (optional).
   * @param renderList The list of meshes to take into account when calculating the projection matrix (optional).
   * @returns The projection matrix. Can be null, if a projection matrix cannot be defined for the type of light considered (as for a hemispherical light, for example).
   */
  getProjectionMatrix(t, o) {
    return this.setShadowProjectionMatrix(this._projectionMatrix, t ?? this._viewMatrix, o ?? []), this._projectionMatrix;
  }
}
s([
  d()
], n.prototype, "position", null);
s([
  d()
], n.prototype, "direction", null);
s([
  c()
], n.prototype, "shadowMinZ", null);
s([
  c()
], n.prototype, "shadowMaxZ", null);
export {
  n as S
};
//# sourceMappingURL=shadowLight-BDR0VGV7.js.map
