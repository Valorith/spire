import { PointerEventTypes as s } from "./pointerEvents-BZWgZsXK.js";
import { P as i, E as h } from "./embed-entry-BKE21f6Q.js";
class d {
  constructor() {
    this._zoomStopsAnimation = !1, this._idleRotationSpeed = 0.05, this._idleRotationWaitTime = 2e3, this._idleRotationSpinupTime = 2e3, this.targetAlpha = null, this._isPointerDown = !1, this._lastFrameTime = null, this._lastInteractionTime = -1 / 0, this._cameraRotationSpeed = 0, this._lastFrameRadius = 0;
  }
  /**
   * Gets the name of the behavior.
   */
  get name() {
    return "AutoRotation";
  }
  /**
   * Sets the flag that indicates if user zooming should stop animation.
   */
  set zoomStopsAnimation(t) {
    this._zoomStopsAnimation = t;
  }
  /**
   * Gets the flag that indicates if user zooming should stop animation.
   */
  get zoomStopsAnimation() {
    return this._zoomStopsAnimation;
  }
  /**
   * Sets the default speed at which the camera rotates around the model.
   */
  set idleRotationSpeed(t) {
    this._idleRotationSpeed = t;
  }
  /**
   * Gets the default speed at which the camera rotates around the model.
   */
  get idleRotationSpeed() {
    return this._idleRotationSpeed;
  }
  /**
   * Sets the time (in milliseconds) to wait after user interaction before the camera starts rotating.
   */
  set idleRotationWaitTime(t) {
    this._idleRotationWaitTime = t;
  }
  /**
   * Gets the time (milliseconds) to wait after user interaction before the camera starts rotating.
   */
  get idleRotationWaitTime() {
    return this._idleRotationWaitTime;
  }
  /**
   * Sets the time (milliseconds) to take to spin up to the full idle rotation speed.
   */
  set idleRotationSpinupTime(t) {
    this._idleRotationSpinupTime = t;
  }
  /**
   * Gets the time (milliseconds) to take to spin up to the full idle rotation speed.
   */
  get idleRotationSpinupTime() {
    return this._idleRotationSpinupTime;
  }
  /**
   * Gets a value indicating if the camera is currently rotating because of this behavior
   */
  get rotationInProgress() {
    return Math.abs(this._cameraRotationSpeed) > 0;
  }
  /**
   * Initializes the behavior.
   */
  init() {
  }
  /**
   * Attaches the behavior to its arc rotate camera.
   * @param camera Defines the camera to attach the behavior to
   */
  attach(t) {
    this._attachedCamera = t;
    const r = this._attachedCamera.getScene();
    this._onPrePointerObservableObserver = r.onPrePointerObservable.add((e) => {
      if (e.type === s.POINTERDOWN) {
        this._isPointerDown = !0;
        return;
      }
      e.type === s.POINTERUP && (this._isPointerDown = !1);
    }), this._onAfterCheckInputsObserver = t.onAfterCheckInputsObservable.add(() => {
      if (this._reachTargetAlpha())
        return;
      const e = i.Now;
      let a = 0;
      this._lastFrameTime != null && (a = e - this._lastFrameTime), this._lastFrameTime = e, this._applyUserInteraction();
      const n = e - this._lastInteractionTime - this._idleRotationWaitTime, o = Math.max(Math.min(n / this._idleRotationSpinupTime, 1), 0);
      this._cameraRotationSpeed = this._idleRotationSpeed * o, this._attachedCamera && (this._attachedCamera.alpha -= this._cameraRotationSpeed * (a / 1e3));
    });
  }
  /**
   * Detaches the behavior from its current arc rotate camera.
   */
  detach() {
    if (!this._attachedCamera)
      return;
    const t = this._attachedCamera.getScene();
    this._onPrePointerObservableObserver && t.onPrePointerObservable.remove(this._onPrePointerObservableObserver), this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver), this._attachedCamera = null;
  }
  /**
   * Force-reset the last interaction time
   * @param customTime an optional time that will be used instead of the current last interaction time. For example `Date.now()`
   */
  resetLastInteractionTime(t) {
    this._lastInteractionTime = t ?? i.Now;
  }
  /**
   * Returns true if camera alpha reaches the target alpha
   * @returns true if camera alpha reaches the target alpha
   */
  _reachTargetAlpha() {
    return this._attachedCamera && this.targetAlpha ? Math.abs(this._attachedCamera.alpha - this.targetAlpha) < h : !1;
  }
  /**
   * Returns true if user is scrolling.
   * @returns true if user is scrolling.
   */
  _userIsZooming() {
    return this._attachedCamera ? this._attachedCamera.inertialRadiusOffset !== 0 : !1;
  }
  _shouldAnimationStopForInteraction() {
    if (!this._attachedCamera)
      return !1;
    let t = !1;
    return this._lastFrameRadius === this._attachedCamera.radius && this._attachedCamera.inertialRadiusOffset !== 0 && (t = !0), this._lastFrameRadius = this._attachedCamera.radius, this._zoomStopsAnimation ? t : this._userIsZooming();
  }
  /**
   *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
   */
  _applyUserInteraction() {
    this._userIsMoving() && !this._shouldAnimationStopForInteraction() && (this._lastInteractionTime = i.Now);
  }
  // Tools
  _userIsMoving() {
    return this._attachedCamera ? this._attachedCamera.inertialAlphaOffset !== 0 || this._attachedCamera.inertialBetaOffset !== 0 || this._attachedCamera.inertialRadiusOffset !== 0 || this._attachedCamera.inertialPanningX !== 0 || this._attachedCamera.inertialPanningY !== 0 || this._isPointerDown : !1;
  }
}
export {
  d as AutoRotationBehavior
};
//# sourceMappingURL=autoRotationBehavior-BRvBPO22.js.map
