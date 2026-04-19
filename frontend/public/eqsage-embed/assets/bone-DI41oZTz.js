import { M as m, i as d, Q as p, a as u, u as _ } from "./embed-entry-Bb6cfUYP.js";
import { N as x } from "./node-DDdHG9Gc.js";
import { S as r } from "./math.axis-CU2IA4no.js";
class n extends x {
  /** @internal */
  get _matrix() {
    return this._compose(), this._localMatrix;
  }
  /** @internal */
  set _matrix(t) {
    t.updateFlag === this._localMatrix.updateFlag && !this._needToCompose || (this._needToCompose = !1, this._localMatrix.copyFrom(t), this._markAsDirtyAndDecompose());
  }
  /**
   * Create a new bone
   * @param name defines the bone name
   * @param skeleton defines the parent skeleton
   * @param parentBone defines the parent (can be null if the bone is the root)
   * @param localMatrix defines the local matrix (default: identity)
   * @param restMatrix defines the rest matrix (default: localMatrix)
   * @param bindMatrix defines the bind matrix (default: localMatrix)
   * @param index defines index of the bone in the hierarchy (default: null)
   */
  constructor(t, i, e = null, s = null, o = null, l = null, a = null) {
    super(t, i.getScene()), this.name = t, this.children = [], this.animations = [], this._index = null, this._scalingDeterminant = 1, this._needToDecompose = !0, this._needToCompose = !1, this._linkedTransformNode = null, this._waitingTransformNodeId = null, this._skeleton = i, this._localMatrix = s?.clone() ?? m.Identity(), this._restMatrix = o ?? this._localMatrix.clone(), this._bindMatrix = l ?? this._localMatrix.clone(), this._index = a, this._absoluteMatrix = new m(), this._absoluteBindMatrix = new m(), this._absoluteInverseBindMatrix = new m(), this._finalMatrix = new m(), i.bones.push(this), this.setParent(e, !1), this._updateAbsoluteBindMatrices();
  }
  /**
   * Gets the current object class name.
   * @returns the class name
   */
  getClassName() {
    return "Bone";
  }
  // Members
  /**
   * Gets the parent skeleton
   * @returns a skeleton
   */
  getSkeleton() {
    return this._skeleton;
  }
  get parent() {
    return this._parentNode;
  }
  /**
   * Gets parent bone
   * @returns a bone or null if the bone is the root of the bone hierarchy
   */
  getParent() {
    return this.parent;
  }
  /**
   * Returns an array containing the children of the bone
   * @returns an array containing the children of the bone (can be empty if the bone has no children)
   */
  getChildren() {
    return this.children;
  }
  /**
   * Gets the node index in matrix array generated for rendering
   * @returns the node index
   */
  getIndex() {
    return this._index === null ? this.getSkeleton().bones.indexOf(this) : this._index;
  }
  set parent(t) {
    this.setParent(t);
  }
  /**
   * Sets the parent bone
   * @param parent defines the parent (can be null if the bone is the root)
   * @param updateAbsoluteBindMatrices defines if the absolute bind and absolute inverse bind matrices must be updated
   */
  setParent(t, i = !0) {
    if (this.parent !== t) {
      if (this.parent) {
        const e = this.parent.children.indexOf(this);
        e !== -1 && this.parent.children.splice(e, 1);
      }
      this._parentNode = t, this.parent && this.parent.children.push(this), i && this._updateAbsoluteBindMatrices(), this.markAsDirty();
    }
  }
  /**
   * Gets the local matrix
   * @returns the local matrix
   */
  getLocalMatrix() {
    return this._compose(), this._localMatrix;
  }
  /**
   * Gets the bind matrix
   * @returns the bind matrix
   */
  getBindMatrix() {
    return this._bindMatrix;
  }
  /**
   * Gets the bind matrix.
   * @returns the bind matrix
   * @deprecated Please use getBindMatrix instead
   */
  getBaseMatrix() {
    return this.getBindMatrix();
  }
  /**
   * Gets the rest matrix
   * @returns the rest matrix
   */
  getRestMatrix() {
    return this._restMatrix;
  }
  /**
   * Gets the rest matrix
   * @returns the rest matrix
   * @deprecated Please use getRestMatrix instead
   */
  getRestPose() {
    return this.getRestMatrix();
  }
  /**
   * Sets the rest matrix
   * @param matrix the local-space rest matrix to set for this bone
   */
  setRestMatrix(t) {
    this._restMatrix.copyFrom(t);
  }
  /**
   * Sets the rest matrix
   * @param matrix the local-space rest to set for this bone
   * @deprecated Please use setRestMatrix instead
   */
  setRestPose(t) {
    this.setRestMatrix(t);
  }
  /**
   * Gets the bind matrix
   * @returns the bind matrix
   * @deprecated Please use getBindMatrix instead
   */
  getBindPose() {
    return this.getBindMatrix();
  }
  /**
   * Sets the bind matrix
   * This will trigger a recomputation of the absolute bind and absolute inverse bind matrices for this bone and its children
   * Note that the local matrix will also be set with the matrix passed in parameter!
   * @param matrix the local-space bind matrix to set for this bone
   */
  setBindMatrix(t) {
    this.updateMatrix(t);
  }
  /**
   * Sets the bind matrix
   * @param matrix the local-space bind to set for this bone
   * @deprecated Please use setBindMatrix instead
   */
  setBindPose(t) {
    this.setBindMatrix(t);
  }
  /**
   * Gets the matrix used to store the final world transformation of the bone (ie. the matrix sent to shaders)
   * @returns the final world matrix
   */
  getFinalMatrix() {
    return this._finalMatrix;
  }
  /**
   * Gets the matrix used to store the final world transformation of the bone (ie. the matrix sent to shaders)
   * @deprecated Please use getFinalMatrix instead
   * @returns the final world matrix
   */
  getWorldMatrix() {
    return this.getFinalMatrix();
  }
  /**
   * Sets the local matrix to the rest matrix
   */
  returnToRest() {
    if (this._linkedTransformNode) {
      const t = d.Vector3[0], i = d.Quaternion[0], e = d.Vector3[1];
      this.getRestMatrix().decompose(t, i, e), this._linkedTransformNode.position.copyFrom(e), this._linkedTransformNode.rotationQuaternion = this._linkedTransformNode.rotationQuaternion ?? p.Identity(), this._linkedTransformNode.rotationQuaternion.copyFrom(i), this._linkedTransformNode.scaling.copyFrom(t);
    } else
      this._matrix = this._restMatrix;
  }
  /**
   * Gets the inverse of the bind matrix, in world space (relative to the skeleton root)
   * @returns the inverse bind matrix, in world space
   */
  getAbsoluteInverseBindMatrix() {
    return this._absoluteInverseBindMatrix;
  }
  /**
   * Gets the inverse of the bind matrix, in world space (relative to the skeleton root)
   * @returns the inverse bind matrix, in world space
   * @deprecated Please use getAbsoluteInverseBindMatrix instead
   */
  getInvertedAbsoluteTransform() {
    return this.getAbsoluteInverseBindMatrix();
  }
  /**
   * Gets the bone matrix, in world space (relative to the skeleton root)
   * @returns the bone matrix, in world space
   */
  getAbsoluteMatrix() {
    return this._absoluteMatrix;
  }
  /**
   * Gets the bone matrix, in world space (relative to the skeleton root)
   * @returns the bone matrix, in world space
   * @deprecated Please use getAbsoluteMatrix instead
   */
  getAbsoluteTransform() {
    return this._absoluteMatrix;
  }
  /**
   * Links with the given transform node.
   * The local matrix of this bone is overwritten by the transform of the node every frame.
   * @param transformNode defines the transform node to link to
   */
  linkTransformNode(t) {
    this._linkedTransformNode && this._skeleton._numBonesWithLinkedTransformNode--, this._linkedTransformNode = t, this._linkedTransformNode && this._skeleton._numBonesWithLinkedTransformNode++;
  }
  // Properties (matches TransformNode properties)
  /**
   * Gets the node used to drive the bone's transformation
   * @returns a transform node or null
   */
  getTransformNode() {
    return this._linkedTransformNode;
  }
  /** Gets or sets current position (in local space) */
  get position() {
    return this._decompose(), this._localPosition;
  }
  set position(t) {
    this._decompose(), this._localPosition.copyFrom(t), this._markAsDirtyAndCompose();
  }
  /** Gets or sets current rotation (in local space) */
  get rotation() {
    return this.getRotation();
  }
  set rotation(t) {
    this.setRotation(t);
  }
  /** Gets or sets current rotation quaternion (in local space) */
  get rotationQuaternion() {
    return this._decompose(), this._localRotation;
  }
  set rotationQuaternion(t) {
    this.setRotationQuaternion(t);
  }
  /** Gets or sets current scaling (in local space) */
  get scaling() {
    return this.getScale();
  }
  set scaling(t) {
    this.setScale(t);
  }
  /**
   * Gets the animation properties override
   */
  get animationPropertiesOverride() {
    return this._skeleton.animationPropertiesOverride;
  }
  // Methods
  _decompose() {
    this._needToDecompose && (this._needToDecompose = !1, this._localScaling || (this._localScaling = u.Zero(), this._localRotation = p.Zero(), this._localPosition = u.Zero()), this._localMatrix.decompose(this._localScaling, this._localRotation, this._localPosition));
  }
  _compose() {
    if (this._needToCompose) {
      if (!this._localScaling) {
        this._needToCompose = !1;
        return;
      }
      this._needToCompose = !1, m.ComposeToRef(this._localScaling, this._localRotation, this._localPosition, this._localMatrix);
    }
  }
  /**
   * Update the bind (and optionally the local) matrix
   * @param bindMatrix defines the new matrix to set to the bind/local matrix, in local space
   * @param updateAbsoluteBindMatrices defines if the absolute bind and absolute inverse bind matrices must be recomputed (default: true)
   * @param updateLocalMatrix defines if the local matrix should also be updated with the matrix passed in parameter (default: true)
   */
  updateMatrix(t, i = !0, e = !0) {
    this._bindMatrix.copyFrom(t), i && this._updateAbsoluteBindMatrices(), e ? this._matrix = t : this.markAsDirty();
  }
  /**
   * @internal
   */
  _updateAbsoluteBindMatrices(t, i = !0) {
    if (t || (t = this._bindMatrix), this.parent ? t.multiplyToRef(this.parent._absoluteBindMatrix, this._absoluteBindMatrix) : this._absoluteBindMatrix.copyFrom(t), this._absoluteBindMatrix.invertToRef(this._absoluteInverseBindMatrix), i)
      for (let e = 0; e < this.children.length; e++)
        this.children[e]._updateAbsoluteBindMatrices();
    this._scalingDeterminant = this._absoluteBindMatrix.determinant() < 0 ? -1 : 1;
  }
  /**
   * Flag the bone as dirty (Forcing it to update everything)
   * @returns this bone
   */
  markAsDirty() {
    return this._currentRenderId++, this._childUpdateId++, this._skeleton._markAsDirty(), this;
  }
  /** @internal */
  _markAsDirtyAndCompose() {
    this.markAsDirty(), this._needToCompose = !0;
  }
  _markAsDirtyAndDecompose() {
    this.markAsDirty(), this._needToDecompose = !0;
  }
  _updatePosition(t, i = r.LOCAL, e, s = !0) {
    const o = this.getLocalMatrix();
    if (i == r.LOCAL)
      s ? (o.addAtIndex(12, t.x), o.addAtIndex(13, t.y), o.addAtIndex(14, t.z)) : o.setTranslationFromFloats(t.x, t.y, t.z);
    else {
      let l = null;
      e && (l = e.getWorldMatrix()), this._skeleton.computeAbsoluteMatrices();
      const a = n._TmpMats[0], h = n._TmpVecs[0];
      this.parent ? e && l ? (a.copyFrom(this.parent.getAbsoluteMatrix()), a.multiplyToRef(l, a)) : a.copyFrom(this.parent.getAbsoluteMatrix()) : m.IdentityToRef(a), s && a.setTranslationFromFloats(0, 0, 0), a.invert(), u.TransformCoordinatesToRef(t, a, h), s ? (o.addAtIndex(12, h.x), o.addAtIndex(13, h.y), o.addAtIndex(14, h.z)) : o.setTranslationFromFloats(h.x, h.y, h.z);
    }
    this._markAsDirtyAndDecompose();
  }
  /**
   * Translate the bone in local or world space
   * @param vec The amount to translate the bone
   * @param space The space that the translation is in (default: Space.LOCAL)
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   */
  translate(t, i = r.LOCAL, e) {
    this._updatePosition(t, i, e, !0);
  }
  /**
   * Set the position of the bone in local or world space
   * @param position The position to set the bone
   * @param space The space that the position is in (default: Space.LOCAL)
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   */
  setPosition(t, i = r.LOCAL, e) {
    this._updatePosition(t, i, e, !1);
  }
  /**
   * Set the absolute position of the bone (world space)
   * @param position The position to set the bone
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   */
  setAbsolutePosition(t, i) {
    this.setPosition(t, r.WORLD, i);
  }
  /**
   * Scale the bone on the x, y and z axes (in local space)
   * @param x The amount to scale the bone on the x axis
   * @param y The amount to scale the bone on the y axis
   * @param z The amount to scale the bone on the z axis
   * @param scaleChildren sets this to true if children of the bone should be scaled as well (false by default)
   */
  scale(t, i, e, s = !1) {
    const o = this.getLocalMatrix(), l = n._TmpMats[0];
    m.ScalingToRef(t, i, e, l), l.multiplyToRef(o, o), l.invert();
    for (const a of this.children) {
      const h = a.getLocalMatrix();
      h.multiplyToRef(l, h), h.multiplyAtIndex(12, t), h.multiplyAtIndex(13, i), h.multiplyAtIndex(14, e), a._markAsDirtyAndDecompose();
    }
    if (this._markAsDirtyAndDecompose(), s)
      for (const a of this.children)
        a.scale(t, i, e, s);
  }
  /**
   * Set the bone scaling in local space
   * @param scale defines the scaling vector
   */
  setScale(t) {
    this._decompose(), this._localScaling.copyFrom(t), this._markAsDirtyAndCompose();
  }
  /**
   * Gets the current scaling in local space
   * @returns the current scaling vector
   */
  getScale() {
    return this._decompose(), this._localScaling;
  }
  /**
   * Gets the current scaling in local space and stores it in a target vector
   * @param result defines the target vector
   */
  getScaleToRef(t) {
    this._decompose(), t.copyFrom(this._localScaling);
  }
  /**
   * Set the yaw, pitch, and roll of the bone in local or world space
   * @param yaw The rotation of the bone on the y axis
   * @param pitch The rotation of the bone on the x axis
   * @param roll The rotation of the bone on the z axis
   * @param space The space that the axes of rotation are in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   */
  setYawPitchRoll(t, i, e, s = r.LOCAL, o) {
    if (s === r.LOCAL) {
      const h = n._TmpQuat;
      p.RotationYawPitchRollToRef(t, i, e, h), this.setRotationQuaternion(h, s, o);
      return;
    }
    const l = n._TmpMats[0];
    if (!this._getAbsoluteInverseMatrixUnscaledToRef(l, o))
      return;
    const a = n._TmpMats[1];
    m.RotationYawPitchRollToRef(t, i, e, a), l.multiplyToRef(a, a), this._rotateWithMatrix(a, s, o);
  }
  /**
   * Add a rotation to the bone on an axis in local or world space
   * @param axis The axis to rotate the bone on
   * @param amount The amount to rotate the bone
   * @param space The space that the axis is in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   */
  rotate(t, i, e = r.LOCAL, s) {
    const o = n._TmpMats[0];
    o.setTranslationFromFloats(0, 0, 0), m.RotationAxisToRef(t, i, o), this._rotateWithMatrix(o, e, s);
  }
  /**
   * Set the rotation of the bone to a particular axis angle in local or world space
   * @param axis The axis to rotate the bone on
   * @param angle The angle that the bone should be rotated to
   * @param space The space that the axis is in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   */
  setAxisAngle(t, i, e = r.LOCAL, s) {
    if (e === r.LOCAL) {
      const a = n._TmpQuat;
      p.RotationAxisToRef(t, i, a), this.setRotationQuaternion(a, e, s);
      return;
    }
    const o = n._TmpMats[0];
    if (!this._getAbsoluteInverseMatrixUnscaledToRef(o, s))
      return;
    const l = n._TmpMats[1];
    m.RotationAxisToRef(t, i, l), o.multiplyToRef(l, l), this._rotateWithMatrix(l, e, s);
  }
  /**
   * Set the euler rotation of the bone in local or world space
   * @param rotation The euler rotation that the bone should be set to
   * @param space The space that the rotation is in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   */
  setRotation(t, i = r.LOCAL, e) {
    this.setYawPitchRoll(t.y, t.x, t.z, i, e);
  }
  /**
   * Set the quaternion rotation of the bone in local or world space
   * @param quat The quaternion rotation that the bone should be set to
   * @param space The space that the rotation is in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   */
  setRotationQuaternion(t, i = r.LOCAL, e) {
    if (i === r.LOCAL) {
      this._decompose(), this._localRotation.copyFrom(t), this._markAsDirtyAndCompose();
      return;
    }
    const s = n._TmpMats[0];
    if (!this._getAbsoluteInverseMatrixUnscaledToRef(s, e))
      return;
    const o = n._TmpMats[1];
    m.FromQuaternionToRef(t, o), s.multiplyToRef(o, o), this._rotateWithMatrix(o, i, e);
  }
  /**
   * Set the rotation matrix of the bone in local or world space
   * @param rotMat The rotation matrix that the bone should be set to
   * @param space The space that the rotation is in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   */
  setRotationMatrix(t, i = r.LOCAL, e) {
    if (i === r.LOCAL) {
      const l = n._TmpQuat;
      p.FromRotationMatrixToRef(t, l), this.setRotationQuaternion(l, i, e);
      return;
    }
    const s = n._TmpMats[0];
    if (!this._getAbsoluteInverseMatrixUnscaledToRef(s, e))
      return;
    const o = n._TmpMats[1];
    o.copyFrom(t), s.multiplyToRef(t, o), this._rotateWithMatrix(o, i, e);
  }
  _rotateWithMatrix(t, i = r.LOCAL, e) {
    const s = this.getLocalMatrix(), o = s.m[12], l = s.m[13], a = s.m[14], h = this.getParent(), c = n._TmpMats[3], f = n._TmpMats[4];
    h && i == r.WORLD ? (e ? (c.copyFrom(e.getWorldMatrix()), h.getAbsoluteMatrix().multiplyToRef(c, c)) : c.copyFrom(h.getAbsoluteMatrix()), f.copyFrom(c), f.invert(), s.multiplyToRef(c, s), s.multiplyToRef(t, s), s.multiplyToRef(f, s)) : i == r.WORLD && e ? (c.copyFrom(e.getWorldMatrix()), f.copyFrom(c), f.invert(), s.multiplyToRef(c, s), s.multiplyToRef(t, s), s.multiplyToRef(f, s)) : s.multiplyToRef(t, s), s.setTranslationFromFloats(o, l, a), this.computeAbsoluteMatrices(), this._markAsDirtyAndDecompose();
  }
  _getAbsoluteInverseMatrixUnscaledToRef(t, i) {
    const e = n._TmpMats[2];
    return t.copyFrom(this.getAbsoluteMatrix()), i ? (t.multiplyToRef(i.getWorldMatrix(), t), m.ScalingToRef(i.scaling.x, i.scaling.y, i.scaling.z, e)) : m.IdentityToRef(e), t.invert(), isNaN(t.m[0]) ? !1 : (e.multiplyAtIndex(0, this._scalingDeterminant), t.multiplyToRef(e, t), !0);
  }
  /**
   * Get the position of the bone in local or world space
   * @param space The space that the returned position is in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @returns The position of the bone
   */
  getPosition(t = r.LOCAL, i = null) {
    const e = u.Zero();
    return this.getPositionToRef(t, i, e), e;
  }
  /**
   * Copy the position of the bone to a vector3 in local or world space
   * @param space The space that the returned position is in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @param result The vector3 to copy the position to
   */
  getPositionToRef(t = r.LOCAL, i, e) {
    if (t == r.LOCAL) {
      const s = this.getLocalMatrix();
      e.x = s.m[12], e.y = s.m[13], e.z = s.m[14];
    } else {
      let s = null;
      i && (s = i.getWorldMatrix()), this._skeleton.computeAbsoluteMatrices();
      let o = n._TmpMats[0];
      i && s ? (o.copyFrom(this.getAbsoluteMatrix()), o.multiplyToRef(s, o)) : o = this.getAbsoluteMatrix(), e.x = o.m[12], e.y = o.m[13], e.z = o.m[14];
    }
  }
  /**
   * Get the absolute position of the bone (world space)
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @returns The absolute position of the bone
   */
  getAbsolutePosition(t = null) {
    const i = u.Zero();
    return this.getPositionToRef(r.WORLD, t, i), i;
  }
  /**
   * Copy the absolute position of the bone (world space) to the result param
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @param result The vector3 to copy the absolute position to
   */
  getAbsolutePositionToRef(t, i) {
    this.getPositionToRef(r.WORLD, t, i);
  }
  /**
   * Compute the absolute matrices of this bone and its children
   */
  computeAbsoluteMatrices() {
    if (this._compose(), this.parent)
      this._localMatrix.multiplyToRef(this.parent._absoluteMatrix, this._absoluteMatrix);
    else {
      this._absoluteMatrix.copyFrom(this._localMatrix);
      const e = this._skeleton.getPoseMatrix();
      e && this._absoluteMatrix.multiplyToRef(e, this._absoluteMatrix);
    }
    const t = this.children, i = t.length;
    for (let e = 0; e < i; e++)
      t[e].computeAbsoluteMatrices();
  }
  /**
   * Compute the absolute matrices of this bone and its children
   * @deprecated Please use computeAbsoluteMatrices instead
   */
  computeAbsoluteTransforms() {
    this.computeAbsoluteMatrices();
  }
  /**
   * Get the world direction from an axis that is in the local space of the bone
   * @param localAxis The local direction that is used to compute the world direction
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @returns The world direction
   */
  getDirection(t, i = null) {
    const e = u.Zero();
    return this.getDirectionToRef(t, i, e), e;
  }
  /**
   * Copy the world direction to a vector3 from an axis that is in the local space of the bone
   * @param localAxis The local direction that is used to compute the world direction
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @param result The vector3 that the world direction will be copied to
   */
  getDirectionToRef(t, i = null, e) {
    let s = null;
    i && (s = i.getWorldMatrix()), this._skeleton.computeAbsoluteMatrices();
    const o = n._TmpMats[0];
    o.copyFrom(this.getAbsoluteMatrix()), i && s && o.multiplyToRef(s, o), u.TransformNormalToRef(t, o, e), e.normalize();
  }
  /**
   * Get the euler rotation of the bone in local or world space
   * @param space The space that the rotation should be in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @returns The euler rotation
   */
  getRotation(t = r.LOCAL, i = null) {
    const e = u.Zero();
    return this.getRotationToRef(t, i, e), e;
  }
  /**
   * Copy the euler rotation of the bone to a vector3.  The rotation can be in either local or world space
   * @param space The space that the rotation should be in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @param result The vector3 that the rotation should be copied to
   */
  getRotationToRef(t = r.LOCAL, i = null, e) {
    const s = n._TmpQuat;
    this.getRotationQuaternionToRef(t, i, s), s.toEulerAnglesToRef(e);
  }
  /**
   * Get the quaternion rotation of the bone in either local or world space
   * @param space The space that the rotation should be in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @returns The quaternion rotation
   */
  getRotationQuaternion(t = r.LOCAL, i = null) {
    const e = p.Identity();
    return this.getRotationQuaternionToRef(t, i, e), e;
  }
  /**
   * Copy the quaternion rotation of the bone to a quaternion.  The rotation can be in either local or world space
   * @param space The space that the rotation should be in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @param result The quaternion that the rotation should be copied to
   */
  getRotationQuaternionToRef(t = r.LOCAL, i = null, e) {
    if (t == r.LOCAL)
      this._decompose(), e.copyFrom(this._localRotation);
    else {
      const s = n._TmpMats[0], o = this.getAbsoluteMatrix();
      i ? o.multiplyToRef(i.getWorldMatrix(), s) : s.copyFrom(o), s.multiplyAtIndex(0, this._scalingDeterminant), s.multiplyAtIndex(1, this._scalingDeterminant), s.multiplyAtIndex(2, this._scalingDeterminant), s.decompose(void 0, e, void 0);
    }
  }
  /**
   * Get the rotation matrix of the bone in local or world space
   * @param space The space that the rotation should be in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @returns The rotation matrix
   */
  getRotationMatrix(t = r.LOCAL, i) {
    const e = m.Identity();
    return this.getRotationMatrixToRef(t, i, e), e;
  }
  /**
   * Copy the rotation matrix of the bone to a matrix.  The rotation can be in either local or world space
   * @param space The space that the rotation should be in
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @param result The quaternion that the rotation should be copied to
   */
  getRotationMatrixToRef(t = r.LOCAL, i, e) {
    if (t == r.LOCAL)
      this.getLocalMatrix().getRotationMatrixToRef(e);
    else {
      const s = n._TmpMats[0], o = this.getAbsoluteMatrix();
      i ? o.multiplyToRef(i.getWorldMatrix(), s) : s.copyFrom(o), s.multiplyAtIndex(0, this._scalingDeterminant), s.multiplyAtIndex(1, this._scalingDeterminant), s.multiplyAtIndex(2, this._scalingDeterminant), s.getRotationMatrixToRef(e);
    }
  }
  /**
   * Get the world position of a point that is in the local space of the bone
   * @param position The local position
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @returns The world position
   */
  getAbsolutePositionFromLocal(t, i = null) {
    const e = u.Zero();
    return this.getAbsolutePositionFromLocalToRef(t, i, e), e;
  }
  /**
   * Get the world position of a point that is in the local space of the bone and copy it to the result param
   * @param position The local position
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @param result The vector3 that the world position should be copied to
   */
  getAbsolutePositionFromLocalToRef(t, i = null, e) {
    let s = null;
    i && (s = i.getWorldMatrix()), this._skeleton.computeAbsoluteMatrices();
    const o = n._TmpMats[0];
    o.copyFrom(this.getAbsoluteMatrix()), i && s && o.multiplyToRef(s, o), u.TransformCoordinatesToRef(t, o, e);
  }
  /**
   * Get the local position of a point that is in world space
   * @param position The world position
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @returns The local position
   */
  getLocalPositionFromAbsolute(t, i = null) {
    const e = u.Zero();
    return this.getLocalPositionFromAbsoluteToRef(t, i, e), e;
  }
  /**
   * Get the local position of a point that is in world space and copy it to the result param
   * @param position The world position
   * @param tNode A TransformNode whose world matrix is to be applied to the calculated absolute matrix. In most cases, you'll want to pass the mesh associated with the skeleton from which this bone comes. Used only when space=Space.WORLD
   * @param result The vector3 that the local position should be copied to
   */
  getLocalPositionFromAbsoluteToRef(t, i = null, e) {
    let s = null;
    i && (s = i.getWorldMatrix()), this._skeleton.computeAbsoluteMatrices();
    const o = n._TmpMats[0];
    o.copyFrom(this.getAbsoluteMatrix()), i && s && o.multiplyToRef(s, o), o.invert(), u.TransformCoordinatesToRef(t, o, e);
  }
  /**
   * Set the current local matrix as the restMatrix for this bone.
   */
  setCurrentPoseAsRest() {
    this.setRestMatrix(this.getLocalMatrix());
  }
}
n._TmpVecs = _.BuildArray(2, u.Zero);
n._TmpQuat = p.Identity();
n._TmpMats = _.BuildArray(5, m.Identity);
export {
  n as B
};
//# sourceMappingURL=bone-DI41oZTz.js.map
