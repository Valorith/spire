import { a as h, M as f, Q as d, O as v, i as e, G as B, b as p, s as b, k as T, c as R } from "./embed-entry-Dediijbe.js";
import { S as y } from "./decorators.serialization-Bm9RMCgM.js";
import { N as P } from "./node-iMMtBoVL.js";
import { S as g } from "./math.axis-Drk1BmmE.js";
const I = f.Compose(h.One(), d.FromEulerAngles(0, Math.PI, 0), h.Zero());
class r extends P {
  /**
   * Gets or sets the billboard mode. Default is 0.
   *
   * | Value | Type | Description |
   * | --- | --- | --- |
   * | 0 | BILLBOARDMODE_NONE |  |
   * | 1 | BILLBOARDMODE_X |  |
   * | 2 | BILLBOARDMODE_Y |  |
   * | 4 | BILLBOARDMODE_Z |  |
   * | 7 | BILLBOARDMODE_ALL |  |
   *
   */
  get billboardMode() {
    return this._billboardMode;
  }
  set billboardMode(t) {
    this._billboardMode !== t && (this._billboardMode = t, this._cache.useBillboardPosition = (this._billboardMode & r.BILLBOARDMODE_USE_POSITION) !== 0, this._computeUseBillboardPath());
  }
  /**
   * Gets or sets a boolean indicating that parent rotation should be preserved when using billboards.
   * This could be useful for glTF objects where parent rotation helps converting from right handed to left handed
   */
  get preserveParentRotationForBillboard() {
    return this._preserveParentRotationForBillboard;
  }
  set preserveParentRotationForBillboard(t) {
    t !== this._preserveParentRotationForBillboard && (this._preserveParentRotationForBillboard = t, this._computeUseBillboardPath());
  }
  _computeUseBillboardPath() {
    this._cache.useBillboardPath = this._billboardMode !== r.BILLBOARDMODE_NONE && !this.preserveParentRotationForBillboard;
  }
  /**
   * Gets or sets the distance of the object to max, often used by skybox
   */
  get infiniteDistance() {
    return this._infiniteDistance;
  }
  set infiniteDistance(t) {
    this._infiniteDistance !== t && (this._infiniteDistance = t);
  }
  constructor(t, o = null, n = !0) {
    super(t, o), this._forward = new h(0, 0, 1), this._up = new h(0, 1, 0), this._right = new h(1, 0, 0), this._position = h.Zero(), this._rotation = h.Zero(), this._rotationQuaternion = null, this._scaling = h.One(), this._transformToBoneReferal = null, this._isAbsoluteSynced = !1, this._billboardMode = r.BILLBOARDMODE_NONE, this._preserveParentRotationForBillboard = !1, this.scalingDeterminant = 1, this._infiniteDistance = !1, this.ignoreNonUniformScaling = !1, this.reIntegrateRotationIntoRotationQuaternion = !1, this._poseMatrix = null, this._localMatrix = f.Zero(), this._usePivotMatrix = !1, this._absolutePosition = h.Zero(), this._absoluteScaling = h.Zero(), this._absoluteRotationQuaternion = d.Identity(), this._pivotMatrix = f.Identity(), this._postMultiplyPivotMatrix = !1, this._isWorldMatrixFrozen = !1, this._indexInSceneTransformNodesArray = -1, this.onAfterWorldMatrixUpdateObservable = new v(), this._nonUniformScaling = !1, n && this.getScene().addTransformNode(this);
  }
  /**
   * Gets a string identifying the name of the class
   * @returns "TransformNode" string
   */
  getClassName() {
    return "TransformNode";
  }
  /**
   * Gets or set the node position (default is (0.0, 0.0, 0.0))
   */
  get position() {
    return this._position;
  }
  set position(t) {
    this._position = t, this._isDirty = !0;
  }
  /**
   * return true if a pivot has been set
   * @returns true if a pivot matrix is used
   */
  isUsingPivotMatrix() {
    return this._usePivotMatrix;
  }
  /**
   * @returns true if pivot matrix must be cancelled in the world matrix. When this parameter is set to true (default), the inverse of the pivot matrix is also applied at the end to cancel the transformation effect.
   */
  isUsingPostMultiplyPivotMatrix() {
    return this._postMultiplyPivotMatrix;
  }
  /**
   * Gets or sets the rotation property : a Vector3 defining the rotation value in radians around each local axis X, Y, Z  (default is (0.0, 0.0, 0.0)).
   * If rotation quaternion is set, this Vector3 will be ignored and copy from the quaternion
   */
  get rotation() {
    return this._rotation;
  }
  set rotation(t) {
    this._rotation = t, this._rotationQuaternion = null, this._isDirty = !0;
  }
  /**
   * Gets or sets the scaling property : a Vector3 defining the node scaling along each local axis X, Y, Z (default is (1.0, 1.0, 1.0)).
   */
  get scaling() {
    return this._scaling;
  }
  set scaling(t) {
    this._scaling = t, this._isDirty = !0;
  }
  /**
   * Gets or sets the rotation Quaternion property : this a Quaternion object defining the node rotation by using a unit quaternion (undefined by default, but can be null).
   * If set, only the rotationQuaternion is then used to compute the node rotation (ie. node.rotation will be ignored)
   */
  get rotationQuaternion() {
    return this._rotationQuaternion;
  }
  set rotationQuaternion(t) {
    this._rotationQuaternion = t, t && this._rotation.setAll(0), this._isDirty = !0;
  }
  /**
   * The forward direction of that transform in world space.
   */
  get forward() {
    return h.TransformNormalFromFloatsToRef(0, 0, this.getScene().useRightHandedSystem ? -1 : 1, this.getWorldMatrix(), this._forward), this._forward.normalize();
  }
  /**
   * The up direction of that transform in world space.
   */
  get up() {
    return h.TransformNormalFromFloatsToRef(0, 1, 0, this.getWorldMatrix(), this._up), this._up.normalize();
  }
  /**
   * The right direction of that transform in world space.
   */
  get right() {
    return h.TransformNormalFromFloatsToRef(this.getScene().useRightHandedSystem ? -1 : 1, 0, 0, this.getWorldMatrix(), this._right), this._right.normalize();
  }
  /**
   * Copies the parameter passed Matrix into the mesh Pose matrix.
   * @param matrix the matrix to copy the pose from
   * @returns this TransformNode.
   */
  updatePoseMatrix(t) {
    return this._poseMatrix ? (this._poseMatrix.copyFrom(t), this) : (this._poseMatrix = t.clone(), this);
  }
  /**
   * Returns the mesh Pose matrix.
   * @returns the pose matrix
   */
  getPoseMatrix() {
    return this._poseMatrix || (this._poseMatrix = f.Identity()), this._poseMatrix;
  }
  /** @internal */
  _isSynchronized() {
    const t = this._cache;
    return !(this._billboardMode !== t.billboardMode || this._billboardMode !== r.BILLBOARDMODE_NONE || t.pivotMatrixUpdated || this._infiniteDistance || this._position._isDirty || this._scaling._isDirty || this._rotationQuaternion && this._rotationQuaternion._isDirty || this._rotation._isDirty);
  }
  /** @internal */
  _initCache() {
    super._initCache();
    const t = this._cache;
    t.localMatrixUpdated = !1, t.billboardMode = -1, t.infiniteDistance = !1, t.useBillboardPosition = !1, t.useBillboardPath = !1;
  }
  /**
   * Returns the current mesh absolute position.
   * Returns a Vector3.
   */
  get absolutePosition() {
    return this.getAbsolutePosition();
  }
  /**
   * Returns the current mesh absolute scaling.
   * Returns a Vector3.
   */
  get absoluteScaling() {
    return this._syncAbsoluteScalingAndRotation(), this._absoluteScaling;
  }
  /**
   * Returns the current mesh absolute rotation.
   * Returns a Quaternion.
   */
  get absoluteRotationQuaternion() {
    return this._syncAbsoluteScalingAndRotation(), this._absoluteRotationQuaternion;
  }
  /**
   * Sets a new matrix to apply before all other transformation
   * @param matrix defines the transform matrix
   * @returns the current TransformNode
   */
  setPreTransformMatrix(t) {
    return this.setPivotMatrix(t, !1);
  }
  /**
   * Sets a new pivot matrix to the current node
   * @param matrix defines the new pivot matrix to use
   * @param postMultiplyPivotMatrix defines if the pivot matrix must be cancelled in the world matrix. When this parameter is set to true (default), the inverse of the pivot matrix is also applied at the end to cancel the transformation effect
   * @returns the current TransformNode
   */
  setPivotMatrix(t, o = !0) {
    return this._pivotMatrix.copyFrom(t), this._usePivotMatrix = !this._pivotMatrix.isIdentity(), this._cache.pivotMatrixUpdated = !0, this._postMultiplyPivotMatrix = o, this._postMultiplyPivotMatrix && (this._pivotMatrixInverse ? this._pivotMatrix.invertToRef(this._pivotMatrixInverse) : this._pivotMatrixInverse = f.Invert(this._pivotMatrix)), this;
  }
  /**
   * Returns the mesh pivot matrix.
   * Default : Identity.
   * @returns the matrix
   */
  getPivotMatrix() {
    return this._pivotMatrix;
  }
  /**
   * Instantiate (when possible) or clone that node with its hierarchy
   * @param newParent defines the new parent to use for the instance (or clone)
   * @param options defines options to configure how copy is done
   * @param options.doNotInstantiate defines if the model must be instantiated or just cloned
   * @param onNewNodeCreated defines an option callback to call when a clone or an instance is created
   * @returns an instance (or a clone) of the current node with its hierarchy
   */
  instantiateHierarchy(t = null, o, n) {
    const i = this.clone("Clone of " + (this.name || this.id), t || this.parent, !0);
    i && n && n(this, i);
    for (const a of this.getChildTransformNodes(!0))
      a.instantiateHierarchy(i, o, n);
    return i;
  }
  /**
   * Prevents the World matrix to be computed any longer
   * @param newWorldMatrix defines an optional matrix to use as world matrix
   * @param decompose defines whether to decompose the given newWorldMatrix or directly assign
   * @returns the TransformNode.
   */
  freezeWorldMatrix(t = null, o = !1) {
    return t ? o ? (this._rotation.setAll(0), this._rotationQuaternion = this._rotationQuaternion || d.Identity(), t.decompose(this._scaling, this._rotationQuaternion, this._position), this.computeWorldMatrix(!0)) : (this._worldMatrix = t, this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]), this._afterComputeWorldMatrix()) : (this._isWorldMatrixFrozen = !1, this.computeWorldMatrix(!0)), this._isDirty = !1, this._isWorldMatrixFrozen = !0, this;
  }
  /**
   * Allows back the World matrix computation.
   * @returns the TransformNode.
   */
  unfreezeWorldMatrix() {
    return this._isWorldMatrixFrozen = !1, this.computeWorldMatrix(!0), this;
  }
  /**
   * True if the World matrix has been frozen.
   */
  get isWorldMatrixFrozen() {
    return this._isWorldMatrixFrozen;
  }
  /**
   * Returns the mesh absolute position in the World.
   * @returns a Vector3.
   */
  getAbsolutePosition() {
    return this.computeWorldMatrix(), this._absolutePosition;
  }
  /**
   * Sets the mesh absolute position in the World from a Vector3 or an Array(3).
   * @param absolutePosition the absolute position to set
   * @returns the TransformNode.
   */
  setAbsolutePosition(t) {
    if (!t)
      return this;
    let o, n, i;
    if (t.x === void 0) {
      if (arguments.length < 3)
        return this;
      o = arguments[0], n = arguments[1], i = arguments[2];
    } else
      o = t.x, n = t.y, i = t.z;
    if (this.parent) {
      const a = e.Matrix[0];
      this.parent.getWorldMatrix().invertToRef(a), h.TransformCoordinatesFromFloatsToRef(o, n, i, a, this.position);
    } else
      this.position.x = o, this.position.y = n, this.position.z = i;
    return this._absolutePosition.copyFrom(t), this;
  }
  /**
   * Sets the mesh position in its local space.
   * @param vector3 the position to set in localspace
   * @returns the TransformNode.
   */
  setPositionWithLocalVector(t) {
    return this.computeWorldMatrix(), this.position = h.TransformNormal(t, this._localMatrix), this;
  }
  /**
   * Returns the mesh position in the local space from the current World matrix values.
   * @returns a new Vector3.
   */
  getPositionExpressedInLocalSpace() {
    this.computeWorldMatrix();
    const t = e.Matrix[0];
    return this._localMatrix.invertToRef(t), h.TransformNormal(this.position, t);
  }
  /**
   * Translates the mesh along the passed Vector3 in its local space.
   * @param vector3 the distance to translate in localspace
   * @returns the TransformNode.
   */
  locallyTranslate(t) {
    return this.computeWorldMatrix(!0), this.position = h.TransformCoordinates(t, this._localMatrix), this;
  }
  /**
   * Orients a mesh towards a target point. Mesh must be drawn facing user.
   * @param targetPoint the position (must be in same space as current mesh) to look at
   * @param yawCor optional yaw (y-axis) correction in radians
   * @param pitchCor optional pitch (x-axis) correction in radians
   * @param rollCor optional roll (z-axis) correction in radians
   * @param space the chosen space of the target
   * @returns the TransformNode.
   */
  lookAt(t, o = 0, n = 0, i = 0, a = g.LOCAL) {
    const l = r._LookAtVectorCache, c = a === g.LOCAL ? this.position : this.getAbsolutePosition();
    if (t.subtractToRef(c, l), this.setDirection(l, o, n, i), a === g.WORLD && this.parent)
      if (this.rotationQuaternion) {
        const u = e.Matrix[0];
        this.rotationQuaternion.toRotationMatrix(u);
        const s = e.Matrix[1];
        this.parent.getWorldMatrix().getRotationMatrixToRef(s), s.invert(), u.multiplyToRef(s, u), this.rotationQuaternion.fromRotationMatrix(u);
      } else {
        const u = e.Quaternion[0];
        d.FromEulerVectorToRef(this.rotation, u);
        const s = e.Matrix[0];
        u.toRotationMatrix(s);
        const M = e.Matrix[1];
        this.parent.getWorldMatrix().getRotationMatrixToRef(M), M.invert(), s.multiplyToRef(M, s), u.fromRotationMatrix(s), u.toEulerAnglesToRef(this.rotation);
      }
    return this;
  }
  /**
   * Returns a new Vector3 that is the localAxis, expressed in the mesh local space, rotated like the mesh.
   * This Vector3 is expressed in the World space.
   * @param localAxis axis to rotate
   * @returns a new Vector3 that is the localAxis, expressed in the mesh local space, rotated like the mesh.
   */
  getDirection(t) {
    const o = h.Zero();
    return this.getDirectionToRef(t, o), o;
  }
  /**
   * Sets the Vector3 "result" as the rotated Vector3 "localAxis" in the same rotation than the mesh.
   * localAxis is expressed in the mesh local space.
   * result is computed in the World space from the mesh World matrix.
   * @param localAxis axis to rotate
   * @param result the resulting transformnode
   * @returns this TransformNode.
   */
  getDirectionToRef(t, o) {
    return h.TransformNormalToRef(t, this.getWorldMatrix(), o), this;
  }
  /**
   * Sets this transform node rotation to the given local axis.
   * @param localAxis the axis in local space
   * @param yawCor optional yaw (y-axis) correction in radians
   * @param pitchCor optional pitch (x-axis) correction in radians
   * @param rollCor optional roll (z-axis) correction in radians
   * @returns this TransformNode
   */
  setDirection(t, o = 0, n = 0, i = 0) {
    const a = -Math.atan2(t.z, t.x) + Math.PI / 2, l = Math.sqrt(t.x * t.x + t.z * t.z), c = -Math.atan2(t.y, l);
    return this.rotationQuaternion ? d.RotationYawPitchRollToRef(a + o, c + n, i, this.rotationQuaternion) : (this.rotation.x = c + n, this.rotation.y = a + o, this.rotation.z = i), this;
  }
  /**
   * Sets a new pivot point to the current node
   * @param point defines the new pivot point to use
   * @param space defines if the point is in world or local space (local by default)
   * @returns the current TransformNode
   */
  setPivotPoint(t, o = g.LOCAL) {
    this.getScene().getRenderId() == 0 && this.computeWorldMatrix(!0);
    const n = this.getWorldMatrix();
    if (o == g.WORLD) {
      const i = e.Matrix[0];
      n.invertToRef(i), t = h.TransformCoordinates(t, i);
    }
    return this.setPivotMatrix(f.Translation(-t.x, -t.y, -t.z), !0);
  }
  /**
   * Returns a new Vector3 set with the mesh pivot point coordinates in the local space.
   * @returns the pivot point
   */
  getPivotPoint() {
    const t = h.Zero();
    return this.getPivotPointToRef(t), t;
  }
  /**
   * Sets the passed Vector3 "result" with the coordinates of the mesh pivot point in the local space.
   * @param result the vector3 to store the result
   * @returns this TransformNode.
   */
  getPivotPointToRef(t) {
    return t.x = -this._pivotMatrix.m[12], t.y = -this._pivotMatrix.m[13], t.z = -this._pivotMatrix.m[14], this;
  }
  /**
   * Returns a new Vector3 set with the mesh pivot point World coordinates.
   * @returns a new Vector3 set with the mesh pivot point World coordinates.
   */
  getAbsolutePivotPoint() {
    const t = h.Zero();
    return this.getAbsolutePivotPointToRef(t), t;
  }
  /**
   * Sets the Vector3 "result" coordinates with the mesh pivot point World coordinates.
   * @param result vector3 to store the result
   * @returns this TransformNode.
   */
  getAbsolutePivotPointToRef(t) {
    return this.getPivotPointToRef(t), h.TransformCoordinatesToRef(t, this.getWorldMatrix(), t), this;
  }
  /**
   * Flag the transform node as dirty (Forcing it to update everything)
   * @param property if set to "rotation" the objects rotationQuaternion will be set to null
   * @returns this  node
   */
  markAsDirty(t) {
    if (this._isDirty)
      return this;
    if (this._children)
      for (const o of this._children)
        o.markAsDirty(t);
    return super.markAsDirty(t);
  }
  /**
   * Defines the passed node as the parent of the current node.
   * The node will remain exactly where it is and its position / rotation will be updated accordingly.
   * Note that if the mesh has a pivot matrix / point defined it will be applied after the parent was updated.
   * In that case the node will not remain in the same space as it is, as the pivot will be applied.
   * To avoid this, you can set updatePivot to true and the pivot will be updated to identity
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/parent_pivot/parent
   * @param node the node ot set as the parent
   * @param preserveScalingSign if true, keep scaling sign of child. Otherwise, scaling sign might change.
   * @param updatePivot if true, update the pivot matrix to keep the node in the same space as before
   * @returns this TransformNode.
   */
  setParent(t, o = !1, n = !1) {
    if (!t && !this.parent)
      return this;
    const i = e.Quaternion[0], a = e.Vector3[0], l = e.Vector3[1], c = e.Matrix[1];
    f.IdentityToRef(c);
    const u = e.Matrix[0];
    this.computeWorldMatrix(!0);
    let s = this.rotationQuaternion;
    return s || (s = r._TmpRotation, d.RotationYawPitchRollToRef(this._rotation.y, this._rotation.x, this._rotation.z, s)), f.ComposeToRef(this.scaling, s, this.position, u), this.parent && u.multiplyToRef(this.parent.computeWorldMatrix(!0), u), t && (t.computeWorldMatrix(!0).invertToRef(c), u.multiplyToRef(c, u)), u.decompose(l, i, a, o ? this : void 0), this.rotationQuaternion ? this.rotationQuaternion.copyFrom(i) : i.toEulerAnglesToRef(this.rotation), this.scaling.copyFrom(l), this.position.copyFrom(a), this.parent = t, n && this.setPivotMatrix(f.Identity()), this;
  }
  /**
   * True if the scaling property of this object is non uniform eg. (1,2,1)
   */
  get nonUniformScaling() {
    return this._nonUniformScaling;
  }
  /**
   * @internal
   */
  _updateNonUniformScalingState(t) {
    return this._nonUniformScaling === t ? !1 : (this._nonUniformScaling = t, !0);
  }
  /**
   * Attach the current TransformNode to another TransformNode associated with a bone
   * @param bone Bone affecting the TransformNode
   * @param affectedTransformNode TransformNode associated with the bone
   * @returns this object
   */
  attachToBone(t, o) {
    return this._currentParentWhenAttachingToBone = this.parent, this._transformToBoneReferal = o, this.parent = t, t.getSkeleton().prepare(!0), t.getFinalMatrix().determinant() < 0 && (this.scalingDeterminant *= -1), this;
  }
  /**
   * Detach the transform node if its associated with a bone
   * @param resetToPreviousParent Indicates if the parent that was in effect when attachToBone was called should be set back or if we should set parent to null instead (defaults to the latter)
   * @returns this object
   */
  detachFromBone(t = !1) {
    return this.parent ? (this.parent.getWorldMatrix().determinant() < 0 && (this.scalingDeterminant *= -1), this._transformToBoneReferal = null, t ? this.parent = this._currentParentWhenAttachingToBone : this.parent = null, this) : (t && (this.parent = this._currentParentWhenAttachingToBone), this);
  }
  /**
   * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in the given space.
   * space (default LOCAL) can be either Space.LOCAL, either Space.WORLD.
   * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
   * The passed axis is also normalized.
   * @param axis the axis to rotate around
   * @param amount the amount to rotate in radians
   * @param space Space to rotate in (Default: local)
   * @returns the TransformNode.
   */
  rotate(t, o, n) {
    t.normalize(), this.rotationQuaternion || (this.rotationQuaternion = this.rotation.toQuaternion(), this.rotation.setAll(0));
    let i;
    if (!n || n === g.LOCAL)
      i = d.RotationAxisToRef(t, o, r._RotationAxisCache), this.rotationQuaternion.multiplyToRef(i, this.rotationQuaternion);
    else {
      if (this.parent) {
        const a = this.parent.getWorldMatrix(), l = e.Matrix[0];
        a.invertToRef(l), t = h.TransformNormal(t, l), a.determinant() < 0 && (o *= -1);
      }
      i = d.RotationAxisToRef(t, o, r._RotationAxisCache), i.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
    }
    return this;
  }
  /**
   * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in world space.
   * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
   * The passed axis is also normalized. .
   * Method is based on http://www.euclideanspace.com/maths/geometry/affine/aroundPoint/index.htm
   * @param point the point to rotate around
   * @param axis the axis to rotate around
   * @param amount the amount to rotate in radians
   * @returns the TransformNode
   */
  rotateAround(t, o, n) {
    o.normalize(), this.rotationQuaternion || (this.rotationQuaternion = d.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z), this.rotation.setAll(0));
    const i = e.Vector3[0], a = e.Vector3[1], l = e.Vector3[2], c = e.Quaternion[0], u = e.Matrix[0], s = e.Matrix[1], M = e.Matrix[2], _ = e.Matrix[3];
    return t.subtractToRef(this.position, i), f.TranslationToRef(i.x, i.y, i.z, u), f.TranslationToRef(-i.x, -i.y, -i.z, s), f.RotationAxisToRef(o, n, M), s.multiplyToRef(M, _), _.multiplyToRef(u, _), _.decompose(a, c, l), this.position.addInPlace(l), c.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion), this;
  }
  /**
   * Translates the mesh along the axis vector for the passed distance in the given space.
   * space (default LOCAL) can be either Space.LOCAL, either Space.WORLD.
   * @param axis the axis to translate in
   * @param distance the distance to translate
   * @param space Space to rotate in (Default: local)
   * @returns the TransformNode.
   */
  translate(t, o, n) {
    const i = t.scale(o);
    if (!n || n === g.LOCAL) {
      const a = this.getPositionExpressedInLocalSpace().add(i);
      this.setPositionWithLocalVector(a);
    } else
      this.setAbsolutePosition(this.getAbsolutePosition().add(i));
    return this;
  }
  /**
   * Adds a rotation step to the mesh current rotation.
   * x, y, z are Euler angles expressed in radians.
   * This methods updates the current mesh rotation, either mesh.rotation, either mesh.rotationQuaternion if it's set.
   * This means this rotation is made in the mesh local space only.
   * It's useful to set a custom rotation order different from the BJS standard one YXZ.
   * Example : this rotates the mesh first around its local X axis, then around its local Z axis, finally around its local Y axis.
   * ```javascript
   * mesh.addRotation(x1, 0, 0).addRotation(0, 0, z2).addRotation(0, 0, y3);
   * ```
   * Note that `addRotation()` accumulates the passed rotation values to the current ones and computes the .rotation or .rotationQuaternion updated values.
   * Under the hood, only quaternions are used. So it's a little faster is you use .rotationQuaternion because it doesn't need to translate them back to Euler angles.
   * @param x Rotation to add
   * @param y Rotation to add
   * @param z Rotation to add
   * @returns the TransformNode.
   */
  addRotation(t, o, n) {
    let i;
    this.rotationQuaternion ? i = this.rotationQuaternion : (i = e.Quaternion[1], d.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, i));
    const a = e.Quaternion[0];
    return d.RotationYawPitchRollToRef(o, t, n, a), i.multiplyInPlace(a), this.rotationQuaternion || i.toEulerAnglesToRef(this.rotation), this;
  }
  /**
   * @internal
   */
  _getEffectiveParent() {
    return this.parent;
  }
  /**
   * Returns whether the transform node world matrix computation needs the camera information to be computed.
   * This is the case when the node is a billboard or has an infinite distance for instance.
   * @returns true if the world matrix computation needs the camera information to be computed
   */
  isWorldMatrixCameraDependent() {
    return this._infiniteDistance && !this.parent || this._billboardMode !== r.BILLBOARDMODE_NONE && !this.preserveParentRotationForBillboard;
  }
  /**
   * Computes the world matrix of the node
   * @param force defines if the cache version should be invalidated forcing the world matrix to be created from scratch
   * @param camera defines the camera used if different from the scene active camera (This is used with modes like Billboard or infinite distance)
   * @returns the world matrix
   */
  computeWorldMatrix(t = !1, o = null) {
    if (this._isWorldMatrixFrozen && !this._isDirty)
      return this._worldMatrix;
    const n = this.getScene().getRenderId();
    if (!this._isDirty && !t && (this._currentRenderId === n || this.isSynchronized()))
      return this._currentRenderId = n, this._worldMatrix;
    o = o || this.getScene().activeCamera, this._updateCache();
    const i = this._cache;
    i.pivotMatrixUpdated = !1, i.billboardMode = this.billboardMode, i.infiniteDistance = this.infiniteDistance, i.parent = this._parentNode, this._currentRenderId = n, this._childUpdateId += 1, this._isDirty = !1, this._position._isDirty = !1, this._rotation._isDirty = !1, this._scaling._isDirty = !1;
    const a = this._getEffectiveParent(), l = r._TmpScaling;
    let c = this._position;
    if (this._infiniteDistance && !this.parent && o) {
      const s = o.getWorldMatrix(), M = new h(s.m[12], s.m[13], s.m[14]);
      c = r._TmpTranslation, c.copyFromFloats(this._position.x + M.x, this._position.y + M.y, this._position.z + M.z);
    }
    l.copyFromFloats(this._scaling.x * this.scalingDeterminant, this._scaling.y * this.scalingDeterminant, this._scaling.z * this.scalingDeterminant);
    let u;
    if (this._rotationQuaternion ? (this._rotationQuaternion._isDirty = !1, u = this._rotationQuaternion, this.reIntegrateRotationIntoRotationQuaternion && this.rotation.lengthSquared() && (this._rotationQuaternion.multiplyInPlace(d.RotationYawPitchRoll(this._rotation.y, this._rotation.x, this._rotation.z)), this._rotation.copyFromFloats(0, 0, 0))) : (u = r._TmpRotation, d.RotationYawPitchRollToRef(this._rotation.y, this._rotation.x, this._rotation.z, u)), this._usePivotMatrix) {
      const s = e.Matrix[1];
      f.ScalingToRef(l.x, l.y, l.z, s);
      const M = e.Matrix[0];
      u.toRotationMatrix(M), this._pivotMatrix.multiplyToRef(s, e.Matrix[4]), e.Matrix[4].multiplyToRef(M, this._localMatrix), this._postMultiplyPivotMatrix && this._localMatrix.multiplyToRef(this._pivotMatrixInverse, this._localMatrix), this._localMatrix.addTranslationFromFloats(c.x, c.y, c.z);
    } else
      f.ComposeToRef(l, u, c, this._localMatrix);
    if (a && a.getWorldMatrix) {
      if (t && a.computeWorldMatrix(t), i.useBillboardPath) {
        if (this._transformToBoneReferal) {
          const m = this.parent;
          m.getSkeleton().prepare(), m.getFinalMatrix().multiplyToRef(this._transformToBoneReferal.getWorldMatrix(), e.Matrix[7]);
        } else
          e.Matrix[7].copyFrom(a.getWorldMatrix());
        const s = e.Vector3[5], M = e.Vector3[6], _ = e.Quaternion[0];
        e.Matrix[7].decompose(M, _, s), f.ScalingToRef(M.x, M.y, M.z, e.Matrix[7]), e.Matrix[7].setTranslation(s), r.BillboardUseParentOrientation && (this._position.applyRotationQuaternionToRef(_, s), this._localMatrix.setTranslation(s)), this._localMatrix.multiplyToRef(e.Matrix[7], this._worldMatrix);
      } else if (this._transformToBoneReferal) {
        const s = this.parent;
        s.getSkeleton().prepare(), this._localMatrix.multiplyToRef(s.getFinalMatrix(), e.Matrix[6]), e.Matrix[6].multiplyToRef(this._transformToBoneReferal.getWorldMatrix(), this._worldMatrix);
      } else
        this._localMatrix.multiplyToRef(a.getWorldMatrix(), this._worldMatrix);
      this._markSyncedWithParent();
    } else
      this._worldMatrix.copyFrom(this._localMatrix);
    if (i.useBillboardPath && o && this.billboardMode && !i.useBillboardPosition) {
      const s = e.Vector3[0];
      if (this._worldMatrix.getTranslationToRef(s), e.Matrix[1].copyFrom(o.getViewMatrix()), this._scene.useRightHandedSystem && e.Matrix[1].multiplyToRef(I, e.Matrix[1]), e.Matrix[1].setTranslationFromFloats(0, 0, 0), e.Matrix[1].invertToRef(e.Matrix[0]), (this.billboardMode & r.BILLBOARDMODE_ALL) !== r.BILLBOARDMODE_ALL) {
        e.Matrix[0].decompose(void 0, e.Quaternion[0], void 0);
        const M = e.Vector3[1];
        e.Quaternion[0].toEulerAnglesToRef(M), (this.billboardMode & r.BILLBOARDMODE_X) !== r.BILLBOARDMODE_X && (M.x = 0), (this.billboardMode & r.BILLBOARDMODE_Y) !== r.BILLBOARDMODE_Y && (M.y = 0), (this.billboardMode & r.BILLBOARDMODE_Z) !== r.BILLBOARDMODE_Z && (M.z = 0), f.RotationYawPitchRollToRef(M.y, M.x, M.z, e.Matrix[0]);
      }
      this._worldMatrix.setTranslationFromFloats(0, 0, 0), this._worldMatrix.multiplyToRef(e.Matrix[0], this._worldMatrix), this._worldMatrix.setTranslation(e.Vector3[0]);
    } else if (i.useBillboardPath && o && i.useBillboardPosition) {
      const s = e.Vector3[0];
      this._worldMatrix.getTranslationToRef(s);
      const M = o.globalPosition;
      this._worldMatrix.invertToRef(e.Matrix[1]);
      const _ = e.Vector3[1];
      h.TransformCoordinatesToRef(M, e.Matrix[1], _), _.normalize();
      const m = -Math.atan2(_.z, _.x) + Math.PI / 2, D = Math.sqrt(_.x * _.x + _.z * _.z), A = -Math.atan2(_.y, D);
      if (d.RotationYawPitchRollToRef(m, A, 0, e.Quaternion[0]), (this.billboardMode & r.BILLBOARDMODE_ALL) !== r.BILLBOARDMODE_ALL) {
        const x = e.Vector3[1];
        e.Quaternion[0].toEulerAnglesToRef(x), (this.billboardMode & r.BILLBOARDMODE_X) !== r.BILLBOARDMODE_X && (x.x = 0), (this.billboardMode & r.BILLBOARDMODE_Y) !== r.BILLBOARDMODE_Y && (x.y = 0), (this.billboardMode & r.BILLBOARDMODE_Z) !== r.BILLBOARDMODE_Z && (x.z = 0), f.RotationYawPitchRollToRef(x.y, x.x, x.z, e.Matrix[0]);
      } else
        f.FromQuaternionToRef(e.Quaternion[0], e.Matrix[0]);
      this._worldMatrix.setTranslationFromFloats(0, 0, 0), this._worldMatrix.multiplyToRef(e.Matrix[0], this._worldMatrix), this._worldMatrix.setTranslation(e.Vector3[0]);
    }
    return this.ignoreNonUniformScaling ? this._updateNonUniformScalingState(!1) : this._scaling.isNonUniformWithinEpsilon(1e-6) ? this._updateNonUniformScalingState(!0) : a && a._nonUniformScaling ? this._updateNonUniformScalingState(a._nonUniformScaling) : this._updateNonUniformScalingState(!1), this._afterComputeWorldMatrix(), this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]), this._isAbsoluteSynced = !1, this.onAfterWorldMatrixUpdateObservable.notifyObservers(this), this._poseMatrix || (this._poseMatrix = f.Invert(this._worldMatrix)), this._worldMatrixDeterminantIsDirty = !0, this._worldMatrix;
  }
  /**
   * Resets this nodeTransform's local matrix to Matrix.Identity().
   * @param independentOfChildren indicates if all child nodeTransform's world-space transform should be preserved.
   */
  resetLocalMatrix(t = !0) {
    if (this.computeWorldMatrix(), t) {
      const o = this.getChildren();
      for (let n = 0; n < o.length; ++n) {
        const i = o[n];
        if (i) {
          i.computeWorldMatrix();
          const a = e.Matrix[0];
          i._localMatrix.multiplyToRef(this._localMatrix, a);
          const l = e.Quaternion[0];
          a.decompose(i.scaling, l, i.position), i.rotationQuaternion ? i.rotationQuaternion.copyFrom(l) : l.toEulerAnglesToRef(i.rotation);
        }
      }
    }
    this.scaling.copyFromFloats(1, 1, 1), this.position.copyFromFloats(0, 0, 0), this.rotation.copyFromFloats(0, 0, 0), this.rotationQuaternion && (this.rotationQuaternion = d.Identity()), this._worldMatrix = f.Identity();
  }
  _afterComputeWorldMatrix() {
  }
  /**
   * If you'd like to be called back after the mesh position, rotation or scaling has been updated.
   * @param func callback function to add
   *
   * @returns the TransformNode.
   */
  registerAfterWorldMatrixUpdate(t) {
    return this.onAfterWorldMatrixUpdateObservable.add(t), this;
  }
  /**
   * Removes a registered callback function.
   * @param func callback function to remove
   * @returns the TransformNode.
   */
  unregisterAfterWorldMatrixUpdate(t) {
    return this.onAfterWorldMatrixUpdateObservable.removeCallback(t), this;
  }
  /**
   * Gets the position of the current mesh in camera space
   * @param camera defines the camera to use
   * @returns a position
   */
  getPositionInCameraSpace(t = null) {
    return t || (t = this.getScene().activeCamera), h.TransformCoordinates(this.getAbsolutePosition(), t.getViewMatrix());
  }
  /**
   * Returns the distance from the mesh to the active camera
   * @param camera defines the camera to use
   * @returns the distance
   */
  getDistanceToCamera(t = null) {
    return t || (t = this.getScene().activeCamera), this.getAbsolutePosition().subtract(t.globalPosition).length();
  }
  /**
   * Clone the current transform node
   * @param name Name of the new clone
   * @param newParent New parent for the clone
   * @param doNotCloneChildren Do not clone children hierarchy
   * @returns the new transform node
   */
  clone(t, o, n) {
    const i = y.Clone(() => new r(t, this.getScene()), this);
    if (i.name = t, i.id = t, o && (i.parent = o), !n) {
      const a = this.getDescendants(!0);
      for (let l = 0; l < a.length; l++) {
        const c = a[l];
        c.clone && c.clone(t + "." + c.name, i);
      }
    }
    return i;
  }
  /**
   * Serializes the objects information.
   * @param currentSerializationObject defines the object to serialize in
   * @returns the serialized object
   */
  serialize(t) {
    const o = y.Serialize(this, t);
    return o.type = this.getClassName(), o.uniqueId = this.uniqueId, this.parent && this.parent._serializeAsParent(o), o.localMatrix = this.getPivotMatrix().asArray(), o.isEnabled = this.isEnabled(), y.AppendSerializedAnimations(this, o), o.ranges = this.serializeAnimationRanges(), o;
  }
  // Statics
  /**
   * Returns a new TransformNode object parsed from the source provided.
   * @param parsedTransformNode is the source.
   * @param scene the scene the object belongs to
   * @param rootUrl is a string, it's the root URL to prefix the `delayLoadingFile` property with
   * @returns a new TransformNode object parsed from the source provided.
   */
  static Parse(t, o, n) {
    const i = y.Parse(() => new r(t.name, o), t, o, n);
    if (t.localMatrix ? i.setPreTransformMatrix(f.FromArray(t.localMatrix)) : t.pivotMatrix && i.setPivotMatrix(f.FromArray(t.pivotMatrix)), i.setEnabled(t.isEnabled), i._waitingParsedUniqueId = t.uniqueId, t.parentId !== void 0 && (i._waitingParentId = t.parentId), t.parentInstanceIndex !== void 0 && (i._waitingParentInstanceIndex = t.parentInstanceIndex), t.animations) {
      for (let a = 0; a < t.animations.length; a++) {
        const l = t.animations[a], c = B("BABYLON.Animation");
        c && i.animations.push(c.Parse(l));
      }
      P.ParseAnimationRanges(i, t, o);
    }
    return t.autoAnimate && o.beginAnimation(i, t.autoAnimateFrom, t.autoAnimateTo, t.autoAnimateLoop, t.autoAnimateSpeed || 1), i;
  }
  /**
   * Get all child-transformNodes of this node
   * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
   * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
   * @returns an array of TransformNode
   */
  getChildTransformNodes(t, o) {
    const n = [];
    return this._getDescendants(n, t, (i) => (!o || o(i)) && i instanceof r), n;
  }
  /**
   * Releases resources associated with this transform node.
   * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
   * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
   */
  dispose(t, o = !1) {
    if (this.getScene().stopAnimation(this), this.getScene().removeTransformNode(this), this._parentContainer) {
      const n = this._parentContainer.transformNodes.indexOf(this);
      n > -1 && this._parentContainer.transformNodes.splice(n, 1), this._parentContainer = null;
    }
    if (this.onAfterWorldMatrixUpdateObservable.clear(), t) {
      const n = this.getChildTransformNodes(!0);
      for (const i of n)
        i.parent = null, i.computeWorldMatrix(!0);
    }
    super.dispose(t, o);
  }
  /**
   * Uniformly scales the mesh to fit inside of a unit cube (1 X 1 X 1 units)
   * @param includeDescendants Use the hierarchy's bounding box instead of the mesh's bounding box. Default is false
   * @param ignoreRotation ignore rotation when computing the scale (ie. object will be axis aligned). Default is false
   * @param predicate predicate that is passed in to getHierarchyBoundingVectors when selecting which object should be included when scaling
   * @returns the current mesh
   */
  normalizeToUnitCube(t = !0, o = !1, n) {
    let i = null, a = null;
    o && (this.rotationQuaternion ? (a = this.rotationQuaternion.clone(), this.rotationQuaternion.copyFromFloats(0, 0, 0, 1)) : this.rotation && (i = this.rotation.clone(), this.rotation.copyFromFloats(0, 0, 0)));
    const l = this.getHierarchyBoundingVectors(t, n), c = l.max.subtract(l.min), u = Math.max(c.x, c.y, c.z);
    if (u === 0)
      return this;
    const s = 1 / u;
    return this.scaling.scaleInPlace(s), o && (this.rotationQuaternion && a ? this.rotationQuaternion.copyFrom(a) : this.rotation && i && this.rotation.copyFrom(i)), this;
  }
  _syncAbsoluteScalingAndRotation() {
    this._isAbsoluteSynced || (this._worldMatrix.decompose(this._absoluteScaling, this._absoluteRotationQuaternion), this._isAbsoluteSynced = !0);
  }
}
r.BILLBOARDMODE_NONE = 0;
r.BILLBOARDMODE_X = 1;
r.BILLBOARDMODE_Y = 2;
r.BILLBOARDMODE_Z = 4;
r.BILLBOARDMODE_ALL = 7;
r.BILLBOARDMODE_USE_POSITION = 128;
r.BillboardUseParentOrientation = !1;
r._TmpRotation = d.Zero();
r._TmpScaling = h.Zero();
r._TmpTranslation = h.Zero();
r._LookAtVectorCache = new h(0, 0, 0);
r._RotationAxisCache = new d();
p([
  b("position")
], r.prototype, "_position", void 0);
p([
  b("rotation")
], r.prototype, "_rotation", void 0);
p([
  T("rotationQuaternion")
], r.prototype, "_rotationQuaternion", void 0);
p([
  b("scaling")
], r.prototype, "_scaling", void 0);
p([
  R("billboardMode")
], r.prototype, "_billboardMode", void 0);
p([
  R()
], r.prototype, "scalingDeterminant", void 0);
p([
  R("infiniteDistance")
], r.prototype, "_infiniteDistance", void 0);
p([
  R()
], r.prototype, "ignoreNonUniformScaling", void 0);
p([
  R()
], r.prototype, "reIntegrateRotationIntoRotationQuaternion", void 0);
export {
  r as TransformNode
};
//# sourceMappingURL=transformNode-C-tLxtu9.js.map
