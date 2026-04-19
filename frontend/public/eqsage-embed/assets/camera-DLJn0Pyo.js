import { a as c, O as u, M as l, Q as M, L as x, _ as f, T as d, G as C, b as h, s as R, c as n } from "./embed-entry-Dediijbe.js";
import { S as E } from "./smartArray-BXymNR-c.js";
import { N as g } from "./node-iMMtBoVL.js";
import { V as b } from "./math.viewport-CrgurBQ6.js";
import { F as p } from "./math.frustum-Cz15BSNS.js";
import { S as _ } from "./decorators.serialization-Bm9RMCgM.js";
class i extends g {
  /**
   * Define the current local position of the camera in the scene
   */
  get position() {
    return this._position;
  }
  set position(t) {
    this._position = t;
  }
  /**
   * The vector the camera should consider as up.
   * (default is Vector3(0, 1, 0) aka Vector3.Up())
   */
  set upVector(t) {
    this._upVector = t;
  }
  get upVector() {
    return this._upVector;
  }
  /**
   * The screen area in scene units squared
   */
  get screenArea() {
    let t = 0, e = 0;
    if (this.mode === i.PERSPECTIVE_CAMERA)
      this.fovMode === i.FOVMODE_VERTICAL_FIXED ? (e = this.minZ * 2 * Math.tan(this.fov / 2), t = this.getEngine().getAspectRatio(this) * e) : (t = this.minZ * 2 * Math.tan(this.fov / 2), e = t / this.getEngine().getAspectRatio(this));
    else {
      const s = this.getEngine().getRenderWidth() / 2, r = this.getEngine().getRenderHeight() / 2;
      t = (this.orthoRight ?? s) - (this.orthoLeft ?? -s), e = (this.orthoTop ?? r) - (this.orthoBottom ?? -r);
    }
    return t * e;
  }
  /**
   * Define the current limit on the left side for an orthographic camera
   * In scene unit
   */
  set orthoLeft(t) {
    this._orthoLeft = t;
    for (const e of this._rigCameras)
      e.orthoLeft = t;
  }
  get orthoLeft() {
    return this._orthoLeft;
  }
  /**
   * Define the current limit on the right side for an orthographic camera
   * In scene unit
   */
  set orthoRight(t) {
    this._orthoRight = t;
    for (const e of this._rigCameras)
      e.orthoRight = t;
  }
  get orthoRight() {
    return this._orthoRight;
  }
  /**
   * Define the current limit on the bottom side for an orthographic camera
   * In scene unit
   */
  set orthoBottom(t) {
    this._orthoBottom = t;
    for (const e of this._rigCameras)
      e.orthoBottom = t;
  }
  get orthoBottom() {
    return this._orthoBottom;
  }
  /**
   * Define the current limit on the top side for an orthographic camera
   * In scene unit
   */
  set orthoTop(t) {
    this._orthoTop = t;
    for (const e of this._rigCameras)
      e.orthoTop = t;
  }
  get orthoTop() {
    return this._orthoTop;
  }
  /**
   * Define the mode of the camera (Camera.PERSPECTIVE_CAMERA or Camera.ORTHOGRAPHIC_CAMERA)
   */
  set mode(t) {
    this._mode = t;
    for (const e of this._rigCameras)
      e.mode = t;
  }
  get mode() {
    return this._mode;
  }
  /**
   * Gets a flag indicating that the camera has moved in some way since the last call to Camera.update()
   */
  get hasMoved() {
    return this._hasMoved;
  }
  /**
   * Instantiates a new camera object.
   * This should not be used directly but through the inherited cameras: ArcRotate, Free...
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
   * @param name Defines the name of the camera in the scene
   * @param position Defines the position of the camera
   * @param scene Defines the scene the camera belongs too
   * @param setActiveOnSceneIfNoneActive Defines if the camera should be set as active after creation if no other camera have been defined in the scene
   */
  constructor(t, e, s, r = !0) {
    super(t, s), this._position = c.Zero(), this._upVector = c.Up(), this.oblique = null, this._orthoLeft = null, this._orthoRight = null, this._orthoBottom = null, this._orthoTop = null, this.fov = 0.8, this.projectionPlaneTilt = 0, this.minZ = 1, this.maxZ = 1e4, this.inertia = 0.9, this._mode = i.PERSPECTIVE_CAMERA, this.isIntermediate = !1, this.viewport = new b(0, 0, 1, 1), this.layerMask = 268435455, this.fovMode = i.FOVMODE_VERTICAL_FIXED, this.cameraRigMode = i.RIG_MODE_NONE, this.customRenderTargets = [], this.outputRenderTarget = null, this.onViewMatrixChangedObservable = new u(), this.onProjectionMatrixChangedObservable = new u(), this.onAfterCheckInputsObservable = new u(), this.onRestoreStateObservable = new u(), this.isRigCamera = !1, this._hasMoved = !1, this._rigCameras = new Array(), this._skipRendering = !1, this._projectionMatrix = new l(), this._postProcesses = new Array(), this._activeMeshes = new E(256), this._globalPosition = c.Zero(), this._computedViewMatrix = l.Identity(), this._doNotComputeProjectionMatrix = !1, this._transformMatrix = l.Zero(), this._refreshFrustumPlanes = !0, this._absoluteRotation = M.Identity(), this._isCamera = !0, this._isLeftCamera = !1, this._isRightCamera = !1, this.getScene().addCamera(this), r && !this.getScene().activeCamera && (this.getScene().activeCamera = this), this.position = e, this.renderPassId = this.getScene().getEngine().createRenderPassId(`Camera ${t}`);
  }
  /**
   * Store current camera state (fov, position, etc..)
   * @returns the camera
   */
  storeState() {
    return this._stateStored = !0, this._storedFov = this.fov, this;
  }
  /**
   * Restores the camera state values if it has been stored. You must call storeState() first
   * @returns true if restored and false otherwise
   */
  _restoreStateValues() {
    return this._stateStored ? (this.fov = this._storedFov, !0) : !1;
  }
  /**
   * Restored camera state. You must call storeState() first.
   * @returns true if restored and false otherwise
   */
  restoreState() {
    return this._restoreStateValues() ? (this.onRestoreStateObservable.notifyObservers(this), !0) : !1;
  }
  /**
   * Gets the class name of the camera.
   * @returns the class name
   */
  getClassName() {
    return "Camera";
  }
  /**
   * Gets a string representation of the camera useful for debug purpose.
   * @param fullDetails Defines that a more verbose level of logging is required
   * @returns the string representation
   */
  toString(t) {
    let e = "Name: " + this.name;
    if (e += ", type: " + this.getClassName(), this.animations)
      for (let s = 0; s < this.animations.length; s++)
        e += ", animation[0]: " + this.animations[s].toString(t);
    return e;
  }
  /**
   * Automatically tilts the projection plane, using `projectionPlaneTilt`, to correct the perspective effect on vertical lines.
   */
  applyVerticalCorrection() {
    const t = this.absoluteRotation.toEulerAngles();
    this.projectionPlaneTilt = this._scene.useRightHandedSystem ? -t.x : t.x;
  }
  /**
   * Gets the current world space position of the camera.
   */
  get globalPosition() {
    return this._globalPosition;
  }
  /**
   * Gets the list of active meshes this frame (meshes no culled or excluded by lod s in the frame)
   * @returns the active meshe list
   */
  getActiveMeshes() {
    return this._activeMeshes;
  }
  /**
   * Check whether a mesh is part of the current active mesh list of the camera
   * @param mesh Defines the mesh to check
   * @returns true if active, false otherwise
   */
  isActiveMesh(t) {
    return this._activeMeshes.indexOf(t) !== -1;
  }
  /**
   * Is this camera ready to be used/rendered
   * @param completeCheck defines if a complete check (including post processes) has to be done (false by default)
   * @returns true if the camera is ready
   */
  isReady(t = !1) {
    if (t) {
      for (const e of this._postProcesses)
        if (e && !e.isReady())
          return !1;
    }
    return super.isReady(t);
  }
  /** @internal */
  _initCache() {
    super._initCache(), this._cache.position = new c(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), this._cache.upVector = new c(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), this._cache.mode = void 0, this._cache.minZ = void 0, this._cache.maxZ = void 0, this._cache.fov = void 0, this._cache.fovMode = void 0, this._cache.aspectRatio = void 0, this._cache.orthoLeft = void 0, this._cache.orthoRight = void 0, this._cache.orthoBottom = void 0, this._cache.orthoTop = void 0, this._cache.obliqueAngle = void 0, this._cache.obliqueLength = void 0, this._cache.obliqueOffset = void 0, this._cache.renderWidth = void 0, this._cache.renderHeight = void 0;
  }
  /**
   * @internal
   */
  _updateCache(t) {
    t || super._updateCache(), this._cache.position.copyFrom(this.position), this._cache.upVector.copyFrom(this.upVector);
  }
  /** @internal */
  _isSynchronized() {
    return this._isSynchronizedViewMatrix() && this._isSynchronizedProjectionMatrix();
  }
  /** @internal */
  _isSynchronizedViewMatrix() {
    return super._isSynchronized() ? this._cache.position.equals(this.position) && this._cache.upVector.equals(this.upVector) && this.isSynchronizedWithParent() : !1;
  }
  /** @internal */
  _isSynchronizedProjectionMatrix() {
    let t = this._cache.mode === this.mode && this._cache.minZ === this.minZ && this._cache.maxZ === this.maxZ;
    if (!t)
      return !1;
    const e = this.getEngine();
    return this.mode === i.PERSPECTIVE_CAMERA ? t = this._cache.fov === this.fov && this._cache.fovMode === this.fovMode && this._cache.aspectRatio === e.getAspectRatio(this) && this._cache.projectionPlaneTilt === this.projectionPlaneTilt : (t = this._cache.orthoLeft === this.orthoLeft && this._cache.orthoRight === this.orthoRight && this._cache.orthoBottom === this.orthoBottom && this._cache.orthoTop === this.orthoTop && this._cache.renderWidth === e.getRenderWidth() && this._cache.renderHeight === e.getRenderHeight(), this.oblique && (t = t && this._cache.obliqueAngle === this.oblique.angle && this._cache.obliqueLength === this.oblique.length && this._cache.obliqueOffset === this.oblique.offset)), t;
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * This function is here because typescript removes the typing of the last function.
   * @param _ignored defines an ignored parameter kept for backward compatibility.
   * @param _noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(t, e) {
  }
  /**
   * Detach the current controls from the specified dom element.
   * This function is here because typescript removes the typing of the last function.
   * @param _ignored defines an ignored parameter kept for backward compatibility.
   */
  detachControl(t) {
  }
  /**
   * Update the camera state according to the different inputs gathered during the frame.
   */
  update() {
    this._hasMoved = !1, this._checkInputs(), this.cameraRigMode !== i.RIG_MODE_NONE && this._updateRigCameras(), this.getViewMatrix(), this.getProjectionMatrix();
  }
  /** @internal */
  _checkInputs() {
    this.onAfterCheckInputsObservable.notifyObservers(this);
  }
  /** @internal */
  get rigCameras() {
    return this._rigCameras;
  }
  /**
   * Gets the post process used by the rig cameras
   */
  get rigPostProcess() {
    return this._rigPostProcess;
  }
  /**
   * Internal, gets the first post process.
   * @returns the first post process to be run on this camera.
   */
  _getFirstPostProcess() {
    for (let t = 0; t < this._postProcesses.length; t++)
      if (this._postProcesses[t] !== null)
        return this._postProcesses[t];
    return null;
  }
  _cascadePostProcessesToRigCams() {
    const t = this._getFirstPostProcess();
    t && t.markTextureDirty();
    for (let e = 0, s = this._rigCameras.length; e < s; e++) {
      const r = this._rigCameras[e], o = r._rigPostProcess;
      o ? (o.getEffectName() === "pass" && (r.isIntermediate = this._postProcesses.length === 0), r._postProcesses = this._postProcesses.slice(0).concat(o), o.markTextureDirty()) : r._postProcesses = this._postProcesses.slice(0);
    }
  }
  /**
   * Attach a post process to the camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#attach-postprocess
   * @param postProcess The post process to attach to the camera
   * @param insertAt The position of the post process in case several of them are in use in the scene
   * @returns the position the post process has been inserted at
   */
  attachPostProcess(t, e = null) {
    return !t.isReusable() && this._postProcesses.indexOf(t) > -1 ? (x.Error("You're trying to reuse a post process not defined as reusable."), 0) : (e == null || e < 0 ? this._postProcesses.push(t) : this._postProcesses[e] === null ? this._postProcesses[e] = t : this._postProcesses.splice(e, 0, t), this._cascadePostProcessesToRigCams(), this._scene.prePassRenderer && this._scene.prePassRenderer.markAsDirty(), this._postProcesses.indexOf(t));
  }
  /**
   * Detach a post process to the camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#attach-postprocess
   * @param postProcess The post process to detach from the camera
   */
  detachPostProcess(t) {
    const e = this._postProcesses.indexOf(t);
    e !== -1 && (this._postProcesses[e] = null), this._scene.prePassRenderer && this._scene.prePassRenderer.markAsDirty(), this._cascadePostProcessesToRigCams();
  }
  /**
   * Gets the current world matrix of the camera
   * @returns the world matrix
   */
  getWorldMatrix() {
    return this._isSynchronizedViewMatrix() ? this._worldMatrix : (this.getViewMatrix(), this._worldMatrix);
  }
  /** @internal */
  _getViewMatrix() {
    return l.Identity();
  }
  /**
   * Gets the current view matrix of the camera.
   * @param force forces the camera to recompute the matrix without looking at the cached state
   * @returns the view matrix
   */
  getViewMatrix(t) {
    return !t && this._isSynchronizedViewMatrix() ? this._computedViewMatrix : (this._hasMoved = !0, this.updateCache(), this._computedViewMatrix = this._getViewMatrix(), this._currentRenderId = this.getScene().getRenderId(), this._childUpdateId++, this._refreshFrustumPlanes = !0, this._cameraRigParams && this._cameraRigParams.vrPreViewMatrix && this._computedViewMatrix.multiplyToRef(this._cameraRigParams.vrPreViewMatrix, this._computedViewMatrix), this.parent && this.parent.onViewMatrixChangedObservable && this.parent.onViewMatrixChangedObservable.notifyObservers(this.parent), this.onViewMatrixChangedObservable.notifyObservers(this), this._computedViewMatrix.invertToRef(this._worldMatrix), this._computedViewMatrix);
  }
  /**
   * Freeze the projection matrix.
   * It will prevent the cache check of the camera projection compute and can speed up perf
   * if no parameter of the camera are meant to change
   * @param projection Defines manually a projection if necessary
   */
  freezeProjectionMatrix(t) {
    this._doNotComputeProjectionMatrix = !0, t !== void 0 && (this._projectionMatrix = t);
  }
  /**
   * Unfreeze the projection matrix if it has previously been freezed by freezeProjectionMatrix.
   */
  unfreezeProjectionMatrix() {
    this._doNotComputeProjectionMatrix = !1;
  }
  /**
   * Gets the current projection matrix of the camera.
   * @param force forces the camera to recompute the matrix without looking at the cached state
   * @returns the projection matrix
   */
  getProjectionMatrix(t) {
    if (this._doNotComputeProjectionMatrix || !t && this._isSynchronizedProjectionMatrix())
      return this._projectionMatrix;
    this._cache.mode = this.mode, this._cache.minZ = this.minZ, this._cache.maxZ = this.maxZ, this._refreshFrustumPlanes = !0;
    const e = this.getEngine(), s = this.getScene(), r = e.useReverseDepthBuffer;
    if (this.mode === i.PERSPECTIVE_CAMERA) {
      this._cache.fov = this.fov, this._cache.fovMode = this.fovMode, this._cache.aspectRatio = e.getAspectRatio(this), this._cache.projectionPlaneTilt = this.projectionPlaneTilt, this.minZ <= 0 && (this.minZ = 0.1);
      let o;
      s.useRightHandedSystem ? o = l.PerspectiveFovRHToRef : o = l.PerspectiveFovLHToRef, o(this.fov, e.getAspectRatio(this), r ? this.maxZ : this.minZ, r ? this.minZ : this.maxZ, this._projectionMatrix, this.fovMode === i.FOVMODE_VERTICAL_FIXED, e.isNDCHalfZRange, this.projectionPlaneTilt, r);
    } else {
      const o = e.getRenderWidth() / 2, a = e.getRenderHeight() / 2;
      s.useRightHandedSystem ? this.oblique ? l.ObliqueOffCenterRHToRef(this.orthoLeft ?? -o, this.orthoRight ?? o, this.orthoBottom ?? -a, this.orthoTop ?? a, r ? this.maxZ : this.minZ, r ? this.minZ : this.maxZ, this.oblique.length, this.oblique.angle, this._computeObliqueDistance(this.oblique.offset), this._projectionMatrix, e.isNDCHalfZRange) : l.OrthoOffCenterRHToRef(this.orthoLeft ?? -o, this.orthoRight ?? o, this.orthoBottom ?? -a, this.orthoTop ?? a, r ? this.maxZ : this.minZ, r ? this.minZ : this.maxZ, this._projectionMatrix, e.isNDCHalfZRange) : this.oblique ? l.ObliqueOffCenterLHToRef(this.orthoLeft ?? -o, this.orthoRight ?? o, this.orthoBottom ?? -a, this.orthoTop ?? a, r ? this.maxZ : this.minZ, r ? this.minZ : this.maxZ, this.oblique.length, this.oblique.angle, this._computeObliqueDistance(this.oblique.offset), this._projectionMatrix, e.isNDCHalfZRange) : l.OrthoOffCenterLHToRef(this.orthoLeft ?? -o, this.orthoRight ?? o, this.orthoBottom ?? -a, this.orthoTop ?? a, r ? this.maxZ : this.minZ, r ? this.minZ : this.maxZ, this._projectionMatrix, e.isNDCHalfZRange), this._cache.orthoLeft = this.orthoLeft, this._cache.orthoRight = this.orthoRight, this._cache.orthoBottom = this.orthoBottom, this._cache.orthoTop = this.orthoTop, this._cache.obliqueAngle = this.oblique?.angle, this._cache.obliqueLength = this.oblique?.length, this._cache.obliqueOffset = this.oblique?.offset, this._cache.renderWidth = e.getRenderWidth(), this._cache.renderHeight = e.getRenderHeight();
    }
    return this.onProjectionMatrixChangedObservable.notifyObservers(this), this._projectionMatrix;
  }
  /**
   * Gets the transformation matrix (ie. the multiplication of view by projection matrices)
   * @returns a Matrix
   */
  getTransformationMatrix() {
    return this._computedViewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix), this._transformMatrix;
  }
  _computeObliqueDistance(t) {
    const e = this, s = this;
    return (e.radius || (s.target ? c.Distance(this.position, s.target) : this.position.length())) + t;
  }
  _updateFrustumPlanes() {
    this._refreshFrustumPlanes && (this.getTransformationMatrix(), this._frustumPlanes ? p.GetPlanesToRef(this._transformMatrix, this._frustumPlanes) : this._frustumPlanes = p.GetPlanes(this._transformMatrix), this._refreshFrustumPlanes = !1);
  }
  /**
   * Checks if a cullable object (mesh...) is in the camera frustum
   * This checks the bounding box center. See isCompletelyInFrustum for a full bounding check
   * @param target The object to check
   * @param checkRigCameras If the rig cameras should be checked (eg. with VR camera both eyes should be checked) (Default: false)
   * @returns true if the object is in frustum otherwise false
   */
  isInFrustum(t, e = !1) {
    if (this._updateFrustumPlanes(), e && this.rigCameras.length > 0) {
      let s = !1;
      return this.rigCameras.forEach((r) => {
        r._updateFrustumPlanes(), s = s || t.isInFrustum(r._frustumPlanes);
      }), s;
    } else
      return t.isInFrustum(this._frustumPlanes);
  }
  /**
   * Checks if a cullable object (mesh...) is in the camera frustum
   * Unlike isInFrustum this checks the full bounding box
   * @param target The object to check
   * @returns true if the object is in frustum otherwise false
   */
  isCompletelyInFrustum(t) {
    return this._updateFrustumPlanes(), t.isCompletelyInFrustum(this._frustumPlanes);
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Gets a ray in the forward direction from the camera.
   * @param length Defines the length of the ray to create
   * @param transform Defines the transform to apply to the ray, by default the world matrix is used to create a workd space ray
   * @param origin Defines the start point of the ray which defaults to the camera position
   * @returns the forward ray
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getForwardRay(t = 100, e, s) {
    throw f("Ray");
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Gets a ray in the forward direction from the camera.
   * @param refRay the ray to (re)use when setting the values
   * @param length Defines the length of the ray to create
   * @param transform Defines the transform to apply to the ray, by default the world matrx is used to create a workd space ray
   * @param origin Defines the start point of the ray which defaults to the camera position
   * @returns the forward ray
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getForwardRayToRef(t, e = 100, s, r) {
    throw f("Ray");
  }
  /**
   * Releases resources associated with this node.
   * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
   * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
   */
  dispose(t, e = !1) {
    for (this.onViewMatrixChangedObservable.clear(), this.onProjectionMatrixChangedObservable.clear(), this.onAfterCheckInputsObservable.clear(), this.onRestoreStateObservable.clear(), this.inputs && this.inputs.clear(), this.getScene().stopAnimation(this), this.getScene().removeCamera(this); this._rigCameras.length > 0; ) {
      const r = this._rigCameras.pop();
      r && r.dispose();
    }
    if (this._parentContainer) {
      const r = this._parentContainer.cameras.indexOf(this);
      r > -1 && this._parentContainer.cameras.splice(r, 1), this._parentContainer = null;
    }
    if (this._rigPostProcess)
      this._rigPostProcess.dispose(this), this._rigPostProcess = null, this._postProcesses.length = 0;
    else if (this.cameraRigMode !== i.RIG_MODE_NONE)
      this._rigPostProcess = null, this._postProcesses.length = 0;
    else {
      let r = this._postProcesses.length;
      for (; --r >= 0; ) {
        const o = this._postProcesses[r];
        o && o.dispose(this);
      }
    }
    let s = this.customRenderTargets.length;
    for (; --s >= 0; )
      this.customRenderTargets[s].dispose();
    this.customRenderTargets.length = 0, this._activeMeshes.dispose(), this.getScene().getEngine().releaseRenderPassId(this.renderPassId), super.dispose(t, e);
  }
  /**
   * Gets the left camera of a rig setup in case of Rigged Camera
   */
  get isLeftCamera() {
    return this._isLeftCamera;
  }
  /**
   * Gets the right camera of a rig setup in case of Rigged Camera
   */
  get isRightCamera() {
    return this._isRightCamera;
  }
  /**
   * Gets the left camera of a rig setup in case of Rigged Camera
   */
  get leftCamera() {
    return this._rigCameras.length < 1 ? null : this._rigCameras[0];
  }
  /**
   * Gets the right camera of a rig setup in case of Rigged Camera
   */
  get rightCamera() {
    return this._rigCameras.length < 2 ? null : this._rigCameras[1];
  }
  /**
   * Gets the left camera target of a rig setup in case of Rigged Camera
   * @returns the target position
   */
  getLeftTarget() {
    return this._rigCameras.length < 1 ? null : this._rigCameras[0].getTarget();
  }
  /**
   * Gets the right camera target of a rig setup in case of Rigged Camera
   * @returns the target position
   */
  getRightTarget() {
    return this._rigCameras.length < 2 ? null : this._rigCameras[1].getTarget();
  }
  /**
   * @internal
   */
  setCameraRigMode(t, e) {
    if (this.cameraRigMode !== t) {
      for (; this._rigCameras.length > 0; ) {
        const s = this._rigCameras.pop();
        s && s.dispose();
      }
      if (this.cameraRigMode = t, this._cameraRigParams = {}, this._cameraRigParams.interaxialDistance = e.interaxialDistance || 0.0637, this._cameraRigParams.stereoHalfAngle = d.ToRadians(this._cameraRigParams.interaxialDistance / 0.0637), this.cameraRigMode !== i.RIG_MODE_NONE) {
        const s = this.createRigCamera(this.name + "_L", 0);
        s && (s._isLeftCamera = !0);
        const r = this.createRigCamera(this.name + "_R", 1);
        r && (r._isRightCamera = !0), s && r && (this._rigCameras.push(s), this._rigCameras.push(r));
      }
      this._setRigMode(e), this._cascadePostProcessesToRigCams(), this.update();
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _setRigMode(t) {
  }
  /** @internal */
  _getVRProjectionMatrix() {
    return l.PerspectiveFovLHToRef(this._cameraRigParams.vrMetrics.aspectRatioFov, this._cameraRigParams.vrMetrics.aspectRatio, this.minZ, this.maxZ, this._cameraRigParams.vrWorkMatrix, !0, this.getEngine().isNDCHalfZRange), this._cameraRigParams.vrWorkMatrix.multiplyToRef(this._cameraRigParams.vrHMatrix, this._projectionMatrix), this._projectionMatrix;
  }
  /**
   * @internal
   */
  setCameraRigParameter(t, e) {
    this._cameraRigParams || (this._cameraRigParams = {}), this._cameraRigParams[t] = e, t === "interaxialDistance" && (this._cameraRigParams.stereoHalfAngle = d.ToRadians(e / 0.0637));
  }
  /**
   * needs to be overridden by children so sub has required properties to be copied
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createRigCamera(t, e) {
    return null;
  }
  /**
   * May need to be overridden by children
   * @internal
   */
  _updateRigCameras() {
    for (let t = 0; t < this._rigCameras.length; t++)
      this._rigCameras[t].minZ = this.minZ, this._rigCameras[t].maxZ = this.maxZ, this._rigCameras[t].fov = this.fov, this._rigCameras[t].upVector.copyFrom(this.upVector);
    this.cameraRigMode === i.RIG_MODE_STEREOSCOPIC_ANAGLYPH && (this._rigCameras[0].viewport = this._rigCameras[1].viewport = this.viewport);
  }
  /** @internal */
  _setupInputs() {
  }
  /**
   * Serialiaze the camera setup to a json representation
   * @returns the JSON representation
   */
  serialize() {
    const t = _.Serialize(this);
    return t.uniqueId = this.uniqueId, t.type = this.getClassName(), this.parent && this.parent._serializeAsParent(t), this.inputs && this.inputs.serialize(t), _.AppendSerializedAnimations(this, t), t.ranges = this.serializeAnimationRanges(), t.isEnabled = this.isEnabled(), t;
  }
  /**
   * Clones the current camera.
   * @param name The cloned camera name
   * @param newParent The cloned camera's new parent (none by default)
   * @returns the cloned camera
   */
  clone(t, e = null) {
    const s = _.Clone(i.GetConstructorFromName(this.getClassName(), t, this.getScene(), this.interaxialDistance, this.isStereoscopicSideBySide), this);
    return s.name = t, s.parent = e, this.onClonedObservable.notifyObservers(s), s;
  }
  /**
   * Gets the direction of the camera relative to a given local axis.
   * @param localAxis Defines the reference axis to provide a relative direction.
   * @returns the direction
   */
  getDirection(t) {
    const e = c.Zero();
    return this.getDirectionToRef(t, e), e;
  }
  /**
   * Returns the current camera absolute rotation
   */
  get absoluteRotation() {
    return this.getWorldMatrix().decompose(void 0, this._absoluteRotation), this._absoluteRotation;
  }
  /**
   * Gets the direction of the camera relative to a given local axis into a passed vector.
   * @param localAxis Defines the reference axis to provide a relative direction.
   * @param result Defines the vector to store the result in
   */
  getDirectionToRef(t, e) {
    c.TransformNormalToRef(t, this.getWorldMatrix(), e);
  }
  /**
   * Gets a camera constructor for a given camera type
   * @param type The type of the camera to construct (should be equal to one of the camera class name)
   * @param name The name of the camera the result will be able to instantiate
   * @param scene The scene the result will construct the camera in
   * @param interaxial_distance In case of stereoscopic setup, the distance between both eyes
   * @param isStereoscopicSideBySide In case of stereoscopic setup, should the sereo be side b side
   * @returns a factory method to construct the camera
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static GetConstructorFromName(t, e, s, r = 0, o = !0) {
    const a = g.Construct(t, e, s, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      interaxial_distance: r,
      isStereoscopicSideBySide: o
    });
    return a || (() => i._CreateDefaultParsedCamera(e, s));
  }
  /**
   * Compute the world  matrix of the camera.
   * @returns the camera world matrix
   */
  computeWorldMatrix() {
    return this.getWorldMatrix();
  }
  /**
   * Parse a JSON and creates the camera from the parsed information
   * @param parsedCamera The JSON to parse
   * @param scene The scene to instantiate the camera in
   * @returns the newly constructed camera
   */
  static Parse(t, e) {
    const s = t.type, r = i.GetConstructorFromName(s, t.name, e, t.interaxial_distance, t.isStereoscopicSideBySide), o = _.Parse(r, t, e);
    if (t.parentId !== void 0 && (o._waitingParentId = t.parentId), t.parentInstanceIndex !== void 0 && (o._waitingParentInstanceIndex = t.parentInstanceIndex), o.inputs && (o.inputs.parse(t), o._setupInputs()), t.upVector && (o.upVector = c.FromArray(t.upVector)), o.setPosition && (o.position.copyFromFloats(0, 0, 0), o.setPosition(c.FromArray(t.position))), t.target && o.setTarget && o.setTarget(c.FromArray(t.target)), t.cameraRigMode) {
      const a = t.interaxial_distance ? { interaxialDistance: t.interaxial_distance } : {};
      o.setCameraRigMode(t.cameraRigMode, a);
    }
    if (t.animations) {
      for (let a = 0; a < t.animations.length; a++) {
        const P = t.animations[a], m = C("BABYLON.Animation");
        m && o.animations.push(m.Parse(P));
      }
      g.ParseAnimationRanges(o, t, e);
    }
    return t.autoAnimate && e.beginAnimation(o, t.autoAnimateFrom, t.autoAnimateTo, t.autoAnimateLoop, t.autoAnimateSpeed || 1), t.isEnabled !== void 0 && o.setEnabled(t.isEnabled), o;
  }
  /** @internal */
  _calculateHandednessMultiplier() {
    let t = this.getScene().useRightHandedSystem ? -1 : 1;
    return this.parent && this.parent._getWorldMatrixDeterminant() < 0 && (t *= -1), t;
  }
}
i._CreateDefaultParsedCamera = (v, t) => {
  throw f("UniversalCamera");
};
i.PERSPECTIVE_CAMERA = 0;
i.ORTHOGRAPHIC_CAMERA = 1;
i.FOVMODE_VERTICAL_FIXED = 0;
i.FOVMODE_HORIZONTAL_FIXED = 1;
i.RIG_MODE_NONE = 0;
i.RIG_MODE_STEREOSCOPIC_ANAGLYPH = 10;
i.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL = 11;
i.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED = 12;
i.RIG_MODE_STEREOSCOPIC_OVERUNDER = 13;
i.RIG_MODE_STEREOSCOPIC_INTERLACED = 14;
i.RIG_MODE_VR = 20;
i.RIG_MODE_CUSTOM = 22;
i.ForceAttachControlToAlwaysPreventDefault = !1;
h([
  R("position")
], i.prototype, "_position", void 0);
h([
  R("upVector")
], i.prototype, "_upVector", void 0);
h([
  n()
], i.prototype, "orthoLeft", null);
h([
  n()
], i.prototype, "orthoRight", null);
h([
  n()
], i.prototype, "orthoBottom", null);
h([
  n()
], i.prototype, "orthoTop", null);
h([
  n()
], i.prototype, "fov", void 0);
h([
  n()
], i.prototype, "projectionPlaneTilt", void 0);
h([
  n()
], i.prototype, "minZ", void 0);
h([
  n()
], i.prototype, "maxZ", void 0);
h([
  n()
], i.prototype, "inertia", void 0);
h([
  n()
], i.prototype, "mode", null);
h([
  n()
], i.prototype, "layerMask", void 0);
h([
  n()
], i.prototype, "fovMode", void 0);
h([
  n()
], i.prototype, "cameraRigMode", void 0);
h([
  n()
], i.prototype, "interaxialDistance", void 0);
h([
  n()
], i.prototype, "isStereoscopicSideBySide", void 0);
export {
  i as C
};
//# sourceMappingURL=camera-DLJn0Pyo.js.map
