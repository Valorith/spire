import { a, g, Q as h, M as s, E as c, i as l, b as _, s as T, c as M, $ as x, L as P } from "./embed-entry-BKE21f6Q.js";
import { C as n } from "./camera-DrW_r1mf.js";
import { A as p } from "./math.axis-DyelT9ZM.js";
import { N as E } from "./node-Cogu8C4Q.js";
import { S as m } from "./decorators.serialization-DfmppPDN.js";
E.AddNodeConstructor("TargetCamera", (f, t) => () => new r(f, a.Zero(), t));
class r extends n {
  /**
   * Instantiates a target camera that takes a mesh or position as a target and continues to look at it while it moves.
   * This is the base of the follow, arc rotate cameras and Free camera
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
   * @param name Defines the name of the camera in the scene
   * @param position Defines the start position of the camera in the scene
   * @param scene Defines the scene the camera belongs to
   * @param setActiveOnSceneIfNoneActive Defines whether the camera should be marked as active if not other active cameras have been defined
   */
  constructor(t, i, e, o = !0) {
    super(t, i, e, o), this._tmpUpVector = a.Zero(), this._tmpTargetVector = a.Zero(), this.cameraDirection = new a(0, 0, 0), this.cameraRotation = new g(0, 0), this.ignoreParentScaling = !1, this.updateUpVectorFromRotation = !1, this._tmpQuaternion = new h(), this.rotation = new a(0, 0, 0), this.speed = 2, this.noRotationConstraint = !1, this.invertRotation = !1, this.inverseRotationSpeed = 0.2, this.lockedTarget = null, this._currentTarget = a.Zero(), this._initialFocalDistance = 1, this._viewMatrix = s.Zero(), this._camMatrix = s.Zero(), this._cameraTransformMatrix = s.Zero(), this._cameraRotationMatrix = s.Zero(), this._referencePoint = new a(0, 0, 1), this._transformedReferencePoint = a.Zero(), this._deferredPositionUpdate = new a(), this._deferredRotationQuaternionUpdate = new h(), this._deferredRotationUpdate = new a(), this._deferredUpdated = !1, this._deferOnly = !1, this._defaultUp = a.Up(), this._cachedRotationZ = 0, this._cachedQuaternionRotationZ = 0;
  }
  /**
   * Gets the position in front of the camera at a given distance.
   * @param distance The distance from the camera we want the position to be
   * @returns the position
   */
  getFrontPosition(t) {
    this.getWorldMatrix();
    const i = this.getTarget().subtract(this.position);
    return i.normalize(), i.scaleInPlace(t), this.globalPosition.add(i);
  }
  /** @internal */
  _getLockedTargetPosition() {
    if (!this.lockedTarget)
      return null;
    if (this.lockedTarget.absolutePosition) {
      const t = this.lockedTarget;
      t.computeWorldMatrix().getTranslationToRef(t.absolutePosition);
    }
    return this.lockedTarget.absolutePosition || this.lockedTarget;
  }
  /**
   * Store current camera state of the camera (fov, position, rotation, etc..)
   * @returns the camera
   */
  storeState() {
    return this._storedPosition = this.position.clone(), this._storedRotation = this.rotation.clone(), this.rotationQuaternion && (this._storedRotationQuaternion = this.rotationQuaternion.clone()), super.storeState();
  }
  /**
   * Restored camera state. You must call storeState() first
   * @returns whether it was successful or not
   * @internal
   */
  _restoreStateValues() {
    return super._restoreStateValues() ? (this.position = this._storedPosition.clone(), this.rotation = this._storedRotation.clone(), this.rotationQuaternion && (this.rotationQuaternion = this._storedRotationQuaternion.clone()), this.cameraDirection.copyFromFloats(0, 0, 0), this.cameraRotation.copyFromFloats(0, 0), !0) : !1;
  }
  /** @internal */
  _initCache() {
    super._initCache(), this._cache.lockedTarget = new a(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), this._cache.rotation = new a(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), this._cache.rotationQuaternion = new h(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
  }
  /**
   * @internal
   */
  _updateCache(t) {
    t || super._updateCache();
    const i = this._getLockedTargetPosition();
    i ? this._cache.lockedTarget ? this._cache.lockedTarget.copyFrom(i) : this._cache.lockedTarget = i.clone() : this._cache.lockedTarget = null, this._cache.rotation.copyFrom(this.rotation), this.rotationQuaternion && this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
  }
  // Synchronized
  /** @internal */
  _isSynchronizedViewMatrix() {
    if (!super._isSynchronizedViewMatrix())
      return !1;
    const t = this._getLockedTargetPosition();
    return (this._cache.lockedTarget ? this._cache.lockedTarget.equals(t) : !t) && (this.rotationQuaternion ? this.rotationQuaternion.equals(this._cache.rotationQuaternion) : this._cache.rotation.equals(this.rotation));
  }
  // Methods
  /** @internal */
  _computeLocalCameraSpeed() {
    const t = this.getEngine();
    return this.speed * Math.sqrt(t.getDeltaTime() / (t.getFps() * 100));
  }
  // Target
  /**
   * Defines the target the camera should look at.
   * @param target Defines the new target as a Vector
   */
  setTarget(t) {
    this.upVector.normalize(), this._initialFocalDistance = t.subtract(this.position).length(), this.position.z === t.z && (this.position.z += c), this._referencePoint.normalize().scaleInPlace(this._initialFocalDistance), s.LookAtLHToRef(this.position, t, this._defaultUp, this._camMatrix), this._camMatrix.invert(), this.rotation.x = Math.atan(this._camMatrix.m[6] / this._camMatrix.m[10]);
    const i = t.subtract(this.position);
    i.x >= 0 ? this.rotation.y = -Math.atan(i.z / i.x) + Math.PI / 2 : this.rotation.y = -Math.atan(i.z / i.x) - Math.PI / 2, this.rotation.z = 0, isNaN(this.rotation.x) && (this.rotation.x = 0), isNaN(this.rotation.y) && (this.rotation.y = 0), isNaN(this.rotation.z) && (this.rotation.z = 0), this.rotationQuaternion && h.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this.rotationQuaternion);
  }
  /**
   * Defines the target point of the camera.
   * The camera looks towards it form the radius distance.
   */
  get target() {
    return this.getTarget();
  }
  set target(t) {
    this.setTarget(t);
  }
  /**
   * Return the current target position of the camera. This value is expressed in local space.
   * @returns the target position
   */
  getTarget() {
    return this._currentTarget;
  }
  /** @internal */
  _decideIfNeedsToMove() {
    return Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
  }
  /** @internal */
  _updatePosition() {
    if (this.parent) {
      this.parent.getWorldMatrix().invertToRef(l.Matrix[0]), a.TransformNormalToRef(this.cameraDirection, l.Matrix[0], l.Vector3[0]), this._deferredPositionUpdate.addInPlace(l.Vector3[0]), this._deferOnly ? this._deferredUpdated = !0 : this.position.copyFrom(this._deferredPositionUpdate);
      return;
    }
    this._deferredPositionUpdate.addInPlace(this.cameraDirection), this._deferOnly ? this._deferredUpdated = !0 : this.position.copyFrom(this._deferredPositionUpdate);
  }
  /** @internal */
  _checkInputs() {
    const t = this.invertRotation ? -this.inverseRotationSpeed : 1, i = this._decideIfNeedsToMove(), e = this.cameraRotation.x || this.cameraRotation.y;
    this._deferredUpdated = !1, this._deferredRotationUpdate.copyFrom(this.rotation), this._deferredPositionUpdate.copyFrom(this.position), this.rotationQuaternion && this._deferredRotationQuaternionUpdate.copyFrom(this.rotationQuaternion), i && this._updatePosition(), e && (this.rotationQuaternion && this.rotationQuaternion.toEulerAnglesToRef(this._deferredRotationUpdate), this._deferredRotationUpdate.x += this.cameraRotation.x * t, this._deferredRotationUpdate.y += this.cameraRotation.y * t, this.noRotationConstraint || (this._deferredRotationUpdate.x > 1.570796 && (this._deferredRotationUpdate.x = 1.570796), this._deferredRotationUpdate.x < -1.570796 && (this._deferredRotationUpdate.x = -1.570796)), this._deferOnly ? this._deferredUpdated = !0 : this.rotation.copyFrom(this._deferredRotationUpdate), this.rotationQuaternion && this._deferredRotationUpdate.lengthSquared() && (h.RotationYawPitchRollToRef(this._deferredRotationUpdate.y, this._deferredRotationUpdate.x, this._deferredRotationUpdate.z, this._deferredRotationQuaternionUpdate), this._deferOnly ? this._deferredUpdated = !0 : this.rotationQuaternion.copyFrom(this._deferredRotationQuaternionUpdate))), i && (Math.abs(this.cameraDirection.x) < this.speed * c && (this.cameraDirection.x = 0), Math.abs(this.cameraDirection.y) < this.speed * c && (this.cameraDirection.y = 0), Math.abs(this.cameraDirection.z) < this.speed * c && (this.cameraDirection.z = 0), this.cameraDirection.scaleInPlace(this.inertia)), e && (Math.abs(this.cameraRotation.x) < this.speed * c && (this.cameraRotation.x = 0), Math.abs(this.cameraRotation.y) < this.speed * c && (this.cameraRotation.y = 0), this.cameraRotation.scaleInPlace(this.inertia)), super._checkInputs();
  }
  _updateCameraRotationMatrix() {
    this.rotationQuaternion ? this.rotationQuaternion.toRotationMatrix(this._cameraRotationMatrix) : s.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);
  }
  /**
   * Update the up vector to apply the rotation of the camera (So if you changed the camera rotation.z this will let you update the up vector as well)
   * @returns the current camera
   */
  _rotateUpVectorWithCameraRotationMatrix() {
    return a.TransformNormalToRef(this._defaultUp, this._cameraRotationMatrix, this.upVector), this;
  }
  /** @internal */
  _getViewMatrix() {
    return this.lockedTarget && this.setTarget(this._getLockedTargetPosition()), this._updateCameraRotationMatrix(), this.rotationQuaternion && this._cachedQuaternionRotationZ != this.rotationQuaternion.z ? (this._rotateUpVectorWithCameraRotationMatrix(), this._cachedQuaternionRotationZ = this.rotationQuaternion.z) : this._cachedRotationZ !== this.rotation.z && (this._rotateUpVectorWithCameraRotationMatrix(), this._cachedRotationZ = this.rotation.z), a.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint), this.position.addToRef(this._transformedReferencePoint, this._currentTarget), this.updateUpVectorFromRotation && (this.rotationQuaternion ? p.Y.rotateByQuaternionToRef(this.rotationQuaternion, this.upVector) : (h.FromEulerVectorToRef(this.rotation, this._tmpQuaternion), p.Y.rotateByQuaternionToRef(this._tmpQuaternion, this.upVector))), this._computeViewMatrix(this.position, this._currentTarget, this.upVector), this._viewMatrix;
  }
  _computeViewMatrix(t, i, e) {
    if (this.ignoreParentScaling) {
      if (this.parent) {
        const o = this.parent.getWorldMatrix();
        a.TransformCoordinatesToRef(t, o, this._globalPosition), a.TransformCoordinatesToRef(i, o, this._tmpTargetVector), a.TransformNormalToRef(e, o, this._tmpUpVector), this._markSyncedWithParent();
      } else
        this._globalPosition.copyFrom(t), this._tmpTargetVector.copyFrom(i), this._tmpUpVector.copyFrom(e);
      this.getScene().useRightHandedSystem ? s.LookAtRHToRef(this._globalPosition, this._tmpTargetVector, this._tmpUpVector, this._viewMatrix) : s.LookAtLHToRef(this._globalPosition, this._tmpTargetVector, this._tmpUpVector, this._viewMatrix);
      return;
    }
    if (this.getScene().useRightHandedSystem ? s.LookAtRHToRef(t, i, e, this._viewMatrix) : s.LookAtLHToRef(t, i, e, this._viewMatrix), this.parent) {
      const o = this.parent.getWorldMatrix();
      this._viewMatrix.invert(), this._viewMatrix.multiplyToRef(o, this._viewMatrix), this._viewMatrix.getTranslationToRef(this._globalPosition), this._viewMatrix.invert(), this._markSyncedWithParent();
    } else
      this._globalPosition.copyFrom(t);
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createRigCamera(t, i) {
    if (this.cameraRigMode !== n.RIG_MODE_NONE) {
      const e = new r(t, this.position.clone(), this.getScene());
      return e.isRigCamera = !0, e.rigParent = this, this.cameraRigMode === n.RIG_MODE_VR && (this.rotationQuaternion || (this.rotationQuaternion = new h()), e._cameraRigParams = {}, e.rotationQuaternion = new h()), e.mode = this.mode, e.orthoLeft = this.orthoLeft, e.orthoRight = this.orthoRight, e.orthoTop = this.orthoTop, e.orthoBottom = this.orthoBottom, e;
    }
    return null;
  }
  /**
   * @internal
   */
  _updateRigCameras() {
    const t = this._rigCameras[0], i = this._rigCameras[1];
    switch (this.computeWorldMatrix(), this.cameraRigMode) {
      case n.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
      case n.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
      case n.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
      case n.RIG_MODE_STEREOSCOPIC_OVERUNDER:
      case n.RIG_MODE_STEREOSCOPIC_INTERLACED: {
        const e = this.cameraRigMode === n.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED ? 1 : -1, o = this.cameraRigMode === n.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED ? -1 : 1;
        this._getRigCamPositionAndTarget(this._cameraRigParams.stereoHalfAngle * e, t), this._getRigCamPositionAndTarget(this._cameraRigParams.stereoHalfAngle * o, i);
        break;
      }
      case n.RIG_MODE_VR:
        t.rotationQuaternion ? (t.rotationQuaternion.copyFrom(this.rotationQuaternion), i.rotationQuaternion.copyFrom(this.rotationQuaternion)) : (t.rotation.copyFrom(this.rotation), i.rotation.copyFrom(this.rotation)), t.position.copyFrom(this.position), i.position.copyFrom(this.position);
        break;
    }
    super._updateRigCameras();
  }
  _getRigCamPositionAndTarget(t, i) {
    this.getTarget().subtractToRef(this.position, r._TargetFocalPoint), r._TargetFocalPoint.normalize().scaleInPlace(this._initialFocalDistance);
    const o = r._TargetFocalPoint.addInPlace(this.position);
    s.TranslationToRef(-o.x, -o.y, -o.z, r._TargetTransformMatrix), r._TargetTransformMatrix.multiplyToRef(s.RotationAxis(i.upVector, t), r._RigCamTransformMatrix), s.TranslationToRef(o.x, o.y, o.z, r._TargetTransformMatrix), r._RigCamTransformMatrix.multiplyToRef(r._TargetTransformMatrix, r._RigCamTransformMatrix), a.TransformCoordinatesToRef(this.position, r._RigCamTransformMatrix, i.position), i.setTarget(o);
  }
  /**
   * Gets the current object class name.
   * @returns the class name
   */
  getClassName() {
    return "TargetCamera";
  }
}
r._RigCamTransformMatrix = new s();
r._TargetTransformMatrix = new s();
r._TargetFocalPoint = new a();
_([
  T()
], r.prototype, "rotation", void 0);
_([
  M()
], r.prototype, "speed", void 0);
_([
  x("lockedTargetId")
], r.prototype, "lockedTarget", void 0);
var u = {};
class k {
  /**
   * Instantiate a new Camera Input Manager.
   * @param camera Defines the camera the input manager belongs to
   */
  constructor(t) {
    this.attachedToElement = !1, this.attached = {}, this.camera = t, this.checkInputs = () => {
    };
  }
  /**
   * Add an input method to a camera
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
   * @param input Camera input method
   */
  add(t) {
    const i = t.getSimpleName();
    if (this.attached[i]) {
      P.Warn("camera input of type " + i + " already exists on camera");
      return;
    }
    this.attached[i] = t, t.camera = this.camera, t.checkInputs && (this.checkInputs = this._addCheckInputs(t.checkInputs.bind(t))), this.attachedToElement && t.attachControl(this.noPreventDefault);
  }
  /**
   * Remove a specific input method from a camera
   * example: camera.inputs.remove(camera.inputs.attached.mouse);
   * @param inputToRemove camera input method
   */
  remove(t) {
    for (const i in this.attached) {
      const e = this.attached[i];
      if (e === t) {
        e.detachControl(), e.camera = null, delete this.attached[i], this.rebuildInputCheck();
        return;
      }
    }
  }
  /**
   * Remove a specific input type from a camera
   * example: camera.inputs.remove("ArcRotateCameraGamepadInput");
   * @param inputType the type of the input to remove
   */
  removeByType(t) {
    for (const i in this.attached) {
      const e = this.attached[i];
      e.getClassName() === t && (e.detachControl(), e.camera = null, delete this.attached[i], this.rebuildInputCheck());
    }
  }
  _addCheckInputs(t) {
    const i = this.checkInputs;
    return () => {
      i(), t();
    };
  }
  /**
   * Attach the input controls to the currently attached dom element to listen the events from.
   * @param input Defines the input to attach
   */
  attachInput(t) {
    this.attachedToElement && t.attachControl(this.noPreventDefault);
  }
  /**
   * Attach the current manager inputs controls to a specific dom element to listen the events from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachElement(t = !1) {
    if (!this.attachedToElement) {
      t = n.ForceAttachControlToAlwaysPreventDefault ? !1 : t, this.attachedToElement = !0, this.noPreventDefault = t;
      for (const i in this.attached)
        this.attached[i].attachControl(t);
    }
  }
  /**
   * Detach the current manager inputs controls from a specific dom element.
   * @param disconnect Defines whether the input should be removed from the current list of attached inputs
   */
  detachElement(t = !1) {
    for (const i in this.attached)
      this.attached[i].detachControl(), t && (this.attached[i].camera = null);
    this.attachedToElement = !1;
  }
  /**
   * Rebuild the dynamic inputCheck function from the current list of
   * defined inputs in the manager.
   */
  rebuildInputCheck() {
    this.checkInputs = () => {
    };
    for (const t in this.attached) {
      const i = this.attached[t];
      i.checkInputs && (this.checkInputs = this._addCheckInputs(i.checkInputs.bind(i)));
    }
  }
  /**
   * Remove all attached input methods from a camera
   */
  clear() {
    this.attachedToElement && this.detachElement(!0), this.attached = {}, this.attachedToElement = !1, this.checkInputs = () => {
    };
  }
  /**
   * Serialize the current input manager attached to a camera.
   * This ensures than once parsed,
   * the input associated to the camera will be identical to the current ones
   * @param serializedCamera Defines the camera serialization JSON the input serialization should write to
   */
  serialize(t) {
    const i = {};
    for (const e in this.attached) {
      const o = this.attached[e], d = m.Serialize(o);
      i[o.getClassName()] = d;
    }
    t.inputsmgr = i;
  }
  /**
   * Parses an input manager serialized JSON to restore the previous list of inputs
   * and states associated to a camera.
   * @param parsedCamera Defines the JSON to parse
   */
  parse(t) {
    const i = t.inputsmgr;
    if (i) {
      this.clear();
      for (const e in i) {
        const o = u[e];
        if (o) {
          const d = i[e], R = m.Parse(() => new o(), d, null);
          this.add(R);
        }
      }
    } else
      for (const e in this.attached) {
        const o = u[this.attached[e].getClassName()];
        if (o) {
          const d = m.Parse(() => new o(), t, null);
          this.remove(this.attached[e]), this.add(d);
        }
      }
  }
}
export {
  u as C,
  r as T,
  k as a
};
//# sourceMappingURL=cameraInputsManager-D8ba6ClW.js.map
