import { O as B, a as n, P as w, M as E, g as S, T as x, E as I, i as D, b as r, c as u, s as L, $ as V, af as k } from "./embed-entry-BKE21f6Q.js";
import { N } from "./node-Cogu8C4Q.js";
import { M as v } from "./mesh-DeWxVt-I.js";
import { AutoRotationBehavior as z } from "./autoRotationBehavior-BRvBPO22.js";
import { B as F } from "./math.path-BUTyAVzg.js";
import { A as f } from "./animation-f15f0TAN.js";
import { PointerEventTypes as y } from "./pointerEvents-BZWgZsXK.js";
import { C as g } from "./camera-DrW_r1mf.js";
import { T as U } from "./cameraInputsManager-D8ba6ClW.js";
import { A as Y } from "./arcRotateCameraInputsManager-C2qy8MCM.js";
class c {
  constructor() {
    this._easingMode = c.EASINGMODE_EASEIN;
  }
  /**
   * Sets the easing mode of the current function.
   * @param easingMode Defines the willing mode (EASINGMODE_EASEIN, EASINGMODE_EASEOUT or EASINGMODE_EASEINOUT)
   */
  setEasingMode(t) {
    const i = Math.min(Math.max(t, 0), 2);
    this._easingMode = i;
  }
  /**
   * Gets the current easing mode.
   * @returns the easing mode
   */
  getEasingMode() {
    return this._easingMode;
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  easeInCore(t) {
    throw new Error("You must implement this method");
  }
  /**
   * Given an input gradient between 0 and 1, this returns the corresponding value
   * of the easing function.
   * @param gradient Defines the value between 0 and 1 we want the easing value for
   * @returns the corresponding value on the curve defined by the easing function
   */
  ease(t) {
    switch (this._easingMode) {
      case c.EASINGMODE_EASEIN:
        return this.easeInCore(t);
      case c.EASINGMODE_EASEOUT:
        return 1 - this.easeInCore(1 - t);
    }
    return t >= 0.5 ? (1 - this.easeInCore((1 - t) * 2)) * 0.5 + 0.5 : this.easeInCore(t * 2) * 0.5;
  }
}
c.EASINGMODE_EASEIN = 0;
c.EASINGMODE_EASEOUT = 1;
c.EASINGMODE_EASEINOUT = 2;
class it extends c {
  /**
   * @internal
   */
  easeInCore(t) {
    return t = Math.max(0, Math.min(1, t)), 1 - Math.sqrt(1 - t * t);
  }
}
class H extends c {
  /**
   * Instantiates a back ease easing
   * @see https://easings.net/#easeInBack
   * @param amplitude Defines the amplitude of the function
   */
  constructor(t = 1) {
    super(), this.amplitude = t;
  }
  /**
   * @internal
   */
  easeInCore(t) {
    const i = Math.max(0, this.amplitude);
    return Math.pow(t, 3) - t * i * Math.sin(3.141592653589793 * t);
  }
}
class et extends c {
  /**
   * Instantiates a bounce easing
   * @see https://easings.net/#easeInBounce
   * @param bounces Defines the number of bounces
   * @param bounciness Defines the amplitude of the bounce
   */
  constructor(t = 3, i = 2) {
    super(), this.bounces = t, this.bounciness = i;
  }
  /**
   * @internal
   */
  easeInCore(t) {
    const i = Math.max(0, this.bounces);
    let e = this.bounciness;
    e <= 1 && (e = 1.001);
    const s = Math.pow(e, i), a = 1 - e, h = (1 - s) / a + s * 0.5, m = t * h, C = Math.log(-m * (1 - e) + 1) / Math.log(e), M = Math.floor(C), p = M + 1, b = (1 - Math.pow(e, M)) / (a * h), _ = (1 - Math.pow(e, p)) / (a * h), P = (b + _) * 0.5, R = t - P, T = P - b;
    return -Math.pow(1 / e, i - M) / (T * T) * (R - T) * (R + T);
  }
}
class st extends c {
  /**
   * @internal
   */
  easeInCore(t) {
    return t * t * t;
  }
}
class at extends c {
  /**
   * Instantiates an elastic easing function
   * @see https://easings.net/#easeInElastic
   * @param oscillations Defines the number of oscillations
   * @param springiness Defines the amplitude of the oscillations
   */
  constructor(t = 3, i = 3) {
    super(), this.oscillations = t, this.springiness = i;
  }
  /**
   * @internal
   */
  easeInCore(t) {
    let i;
    const e = Math.max(0, this.oscillations), s = Math.max(0, this.springiness);
    return s == 0 ? i = t : i = (Math.exp(s * t) - 1) / (Math.exp(s) - 1), i * Math.sin((6.283185307179586 * e + 1.5707963267948966) * t);
  }
}
class G extends c {
  /**
   * Instantiates an exponential easing function
   * @see https://easings.net/#easeInExpo
   * @param exponent Defines the exponent of the function
   */
  constructor(t = 2) {
    super(), this.exponent = t;
  }
  /**
   * @internal
   */
  easeInCore(t) {
    return this.exponent <= 0 ? t : (Math.exp(this.exponent * t) - 1) / (Math.exp(this.exponent) - 1);
  }
}
class nt extends c {
  /**
   * Instantiates an power base easing function
   * @see https://easings.net/#easeInQuad
   * @param power Defines the power of the function
   */
  constructor(t = 2) {
    super(), this.power = t;
  }
  /**
   * @internal
   */
  easeInCore(t) {
    const i = Math.max(0, this.power);
    return Math.pow(t, i);
  }
}
class ot extends c {
  /**
   * @internal
   */
  easeInCore(t) {
    return t * t;
  }
}
class rt extends c {
  /**
   * @internal
   */
  easeInCore(t) {
    return t * t * t * t;
  }
}
class ht extends c {
  /**
   * @internal
   */
  easeInCore(t) {
    return t * t * t * t * t;
  }
}
class ut extends c {
  /**
   * @internal
   */
  easeInCore(t) {
    return 1 - Math.sin(1.5707963267948966 * (1 - t));
  }
}
class ct extends c {
  /**
   * Instantiates a bezier function
   * @see http://cubic-bezier.com/#.17,.67,.83,.67
   * @param x1 Defines the x component of the start tangent in the bezier curve
   * @param y1 Defines the y component of the start tangent in the bezier curve
   * @param x2 Defines the x component of the end tangent in the bezier curve
   * @param y2 Defines the y component of the end tangent in the bezier curve
   */
  constructor(t = 0, i = 0, e = 1, s = 1) {
    super(), this.x1 = t, this.y1 = i, this.x2 = e, this.y2 = s;
  }
  /**
   * @internal
   */
  easeInCore(t) {
    return F.Interpolate(t, this.x1, this.y1, this.x2, this.y2);
  }
}
class A {
  constructor() {
    this.transitionDuration = 450, this.lowerRadiusTransitionRange = 2, this.upperRadiusTransitionRange = -2, this._autoTransitionRange = !1, this._radiusIsAnimating = !1, this._radiusBounceTransition = null, this._animatables = new Array();
  }
  /**
   * Gets the name of the behavior.
   */
  get name() {
    return "Bouncing";
  }
  /**
   * Gets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
   */
  get autoTransitionRange() {
    return this._autoTransitionRange;
  }
  /**
   * Sets a value indicating if the lowerRadiusTransitionRange and upperRadiusTransitionRange are defined automatically
   * Transition ranges will be set to 5% of the bounding box diagonal in world space
   */
  set autoTransitionRange(t) {
    if (this._autoTransitionRange === t)
      return;
    this._autoTransitionRange = t;
    const i = this._attachedCamera;
    i && (t ? this._onMeshTargetChangedObserver = i.onMeshTargetChangedObservable.add((e) => {
      if (e && (e.computeWorldMatrix(!0), e.getBoundingInfo)) {
        const s = e.getBoundingInfo().diagonalLength;
        this.lowerRadiusTransitionRange = s * 0.05, this.upperRadiusTransitionRange = s * 0.05;
      }
    }) : this._onMeshTargetChangedObserver && i.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver));
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
    this._attachedCamera = t, this._onAfterCheckInputsObserver = t.onAfterCheckInputsObservable.add(() => {
      this._attachedCamera && (this._isRadiusAtLimit(this._attachedCamera.lowerRadiusLimit) && this._applyBoundRadiusAnimation(this.lowerRadiusTransitionRange), this._isRadiusAtLimit(this._attachedCamera.upperRadiusLimit) && this._applyBoundRadiusAnimation(this.upperRadiusTransitionRange));
    });
  }
  /**
   * Detaches the behavior from its current arc rotate camera.
   */
  detach() {
    this._attachedCamera && (this._onAfterCheckInputsObserver && this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver), this._onMeshTargetChangedObserver && this._attachedCamera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver), this._attachedCamera = null);
  }
  /**
   * Checks if the camera radius is at the specified limit. Takes into account animation locks.
   * @param radiusLimit The limit to check against.
   * @returns Bool to indicate if at limit.
   */
  _isRadiusAtLimit(t) {
    return this._attachedCamera ? this._attachedCamera.radius === t && !this._radiusIsAnimating : !1;
  }
  /**
   * Applies an animation to the radius of the camera, extending by the radiusDelta.
   * @param radiusDelta The delta by which to animate to. Can be negative.
   */
  _applyBoundRadiusAnimation(t) {
    if (!this._attachedCamera)
      return;
    this._radiusBounceTransition || (A.EasingFunction.setEasingMode(A.EasingMode), this._radiusBounceTransition = f.CreateAnimation("radius", f.ANIMATIONTYPE_FLOAT, 60, A.EasingFunction)), this._cachedWheelPrecision = this._attachedCamera.wheelPrecision, this._attachedCamera.wheelPrecision = 1 / 0, this._attachedCamera.inertialRadiusOffset = 0, this.stopAllAnimations(), this._radiusIsAnimating = !0;
    const i = f.TransitionTo("radius", this._attachedCamera.radius + t, this._attachedCamera, this._attachedCamera.getScene(), 60, this._radiusBounceTransition, this.transitionDuration, () => this._clearAnimationLocks());
    i && this._animatables.push(i);
  }
  /**
   * Removes all animation locks. Allows new animations to be added to any of the camera properties.
   */
  _clearAnimationLocks() {
    this._radiusIsAnimating = !1, this._attachedCamera && (this._attachedCamera.wheelPrecision = this._cachedWheelPrecision);
  }
  /**
   * Stops and removes all animations that have been applied to the camera
   */
  stopAllAnimations() {
    for (this._attachedCamera && (this._attachedCamera.animations = []); this._animatables.length; )
      this._animatables[0].onAnimationEnd = null, this._animatables[0].stop(), this._animatables.shift();
  }
}
A.EasingFunction = new H(0.3);
A.EasingMode = c.EASINGMODE_EASEOUT;
class l {
  constructor() {
    this.onTargetFramingAnimationEndObservable = new B(), this._mode = l.FitFrustumSidesMode, this._radiusScale = 1, this._positionScale = 0.5, this._defaultElevation = 0.3, this._elevationReturnTime = 1500, this._elevationReturnWaitTime = 1e3, this._zoomStopsAnimation = !1, this._framingTime = 1500, this.autoCorrectCameraLimitsAndSensibility = !0, this._isPointerDown = !1, this._lastInteractionTime = -1 / 0, this._animatables = new Array(), this._betaIsAnimating = !1;
  }
  /**
   * Gets the name of the behavior.
   */
  get name() {
    return "Framing";
  }
  /**
   * Sets the current mode used by the behavior
   */
  set mode(t) {
    this._mode = t;
  }
  /**
   * Gets current mode used by the behavior.
   */
  get mode() {
    return this._mode;
  }
  /**
   * Sets the scale applied to the radius (1 by default)
   */
  set radiusScale(t) {
    this._radiusScale = t;
  }
  /**
   * Gets the scale applied to the radius
   */
  get radiusScale() {
    return this._radiusScale;
  }
  /**
   * Sets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
   */
  set positionScale(t) {
    this._positionScale = t;
  }
  /**
   * Gets the scale to apply on Y axis to position camera focus. 0.5 by default which means the center of the bounding box.
   */
  get positionScale() {
    return this._positionScale;
  }
  /**
   * Sets the angle above/below the horizontal plane to return to when the return to default elevation idle
   * behaviour is triggered, in radians.
   */
  set defaultElevation(t) {
    this._defaultElevation = t;
  }
  /**
   * Gets the angle above/below the horizontal plane to return to when the return to default elevation idle
   * behaviour is triggered, in radians.
   */
  get defaultElevation() {
    return this._defaultElevation;
  }
  /**
   * Sets the time (in milliseconds) taken to return to the default beta position.
   * Negative value indicates camera should not return to default.
   */
  set elevationReturnTime(t) {
    this._elevationReturnTime = t;
  }
  /**
   * Gets the time (in milliseconds) taken to return to the default beta position.
   * Negative value indicates camera should not return to default.
   */
  get elevationReturnTime() {
    return this._elevationReturnTime;
  }
  /**
   * Sets the delay (in milliseconds) taken before the camera returns to the default beta position.
   */
  set elevationReturnWaitTime(t) {
    this._elevationReturnWaitTime = t;
  }
  /**
   * Gets the delay (in milliseconds) taken before the camera returns to the default beta position.
   */
  get elevationReturnWaitTime() {
    return this._elevationReturnWaitTime;
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
   * Sets the transition time when framing the mesh, in milliseconds
   */
  set framingTime(t) {
    this._framingTime = t;
  }
  /**
   * Gets the transition time when framing the mesh, in milliseconds
   */
  get framingTime() {
    return this._framingTime;
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
    const i = this._attachedCamera.getScene();
    l.EasingFunction.setEasingMode(l.EasingMode), this._onPrePointerObservableObserver = i.onPrePointerObservable.add((e) => {
      if (e.type === y.POINTERDOWN) {
        this._isPointerDown = !0;
        return;
      }
      e.type === y.POINTERUP && (this._isPointerDown = !1);
    }), this._onMeshTargetChangedObserver = t.onMeshTargetChangedObservable.add((e) => {
      e && e.getBoundingInfo && this.zoomOnMesh(e, void 0, () => {
        this.onTargetFramingAnimationEndObservable.notifyObservers();
      });
    }), this._onAfterCheckInputsObserver = t.onAfterCheckInputsObservable.add(() => {
      this._applyUserInteraction(), this._maintainCameraAboveGround();
    });
  }
  /**
   * Detaches the behavior from its current arc rotate camera.
   */
  detach() {
    if (!this._attachedCamera)
      return;
    const t = this._attachedCamera.getScene();
    this._onPrePointerObservableObserver && t.onPrePointerObservable.remove(this._onPrePointerObservableObserver), this._onAfterCheckInputsObserver && this._attachedCamera.onAfterCheckInputsObservable.remove(this._onAfterCheckInputsObserver), this._onMeshTargetChangedObserver && this._attachedCamera.onMeshTargetChangedObservable.remove(this._onMeshTargetChangedObserver), this._attachedCamera = null;
  }
  /**
   * Targets the given mesh and updates zoom level accordingly.
   * @param mesh  The mesh to target.
   * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
   * @param onAnimationEnd Callback triggered at the end of the framing animation
   */
  zoomOnMesh(t, i = !1, e = null) {
    t.computeWorldMatrix(!0);
    const s = t.getBoundingInfo().boundingBox;
    this.zoomOnBoundingInfo(s.minimumWorld, s.maximumWorld, i, e);
  }
  /**
   * Targets the given mesh with its children and updates zoom level accordingly.
   * @param mesh  The mesh to target.
   * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
   * @param onAnimationEnd Callback triggered at the end of the framing animation
   */
  zoomOnMeshHierarchy(t, i = !1, e = null) {
    t.computeWorldMatrix(!0);
    const s = t.getHierarchyBoundingVectors(!0);
    this.zoomOnBoundingInfo(s.min, s.max, i, e);
  }
  /**
   * Targets the given meshes with their children and updates zoom level accordingly.
   * @param meshes  The mesh to target.
   * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
   * @param onAnimationEnd Callback triggered at the end of the framing animation
   */
  zoomOnMeshesHierarchy(t, i = !1, e = null) {
    const s = new n(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), a = new n(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    for (let h = 0; h < t.length; h++) {
      const m = t[h].getHierarchyBoundingVectors(!0);
      n.CheckExtends(m.min, s, a), n.CheckExtends(m.max, s, a);
    }
    this.zoomOnBoundingInfo(s, a, i, e);
  }
  /**
   * Targets the bounding box info defined by its extends and updates zoom level accordingly.
   * @param minimumWorld Determines the smaller position of the bounding box extend
   * @param maximumWorld Determines the bigger position of the bounding box extend
   * @param focusOnOriginXZ Determines if the camera should focus on 0 in the X and Z axis instead of the mesh
   * @param onAnimationEnd Callback triggered at the end of the framing animation
   * @returns true if the zoom was done
   */
  zoomOnBoundingInfo(t, i, e = !1, s = null) {
    let a;
    if (!this._attachedCamera)
      return !1;
    const h = t.y, m = i.y, C = h + (m - h) * this._positionScale, M = i.subtract(t).scale(0.5);
    if (e)
      a = new n(0, C, 0);
    else {
      const _ = t.add(M);
      a = new n(_.x, C, _.z);
    }
    this._vectorTransition || (this._vectorTransition = f.CreateAnimation("target", f.ANIMATIONTYPE_VECTOR3, 60, l.EasingFunction)), this._betaIsAnimating = !0;
    let p = f.TransitionTo("target", a, this._attachedCamera, this._attachedCamera.getScene(), 60, this._vectorTransition, this._framingTime);
    p && this._animatables.push(p);
    let b = 0;
    if (this._mode === l.FitFrustumSidesMode) {
      const _ = this._calculateLowerRadiusFromModelBoundingSphere(t, i);
      this.autoCorrectCameraLimitsAndSensibility && (this._attachedCamera.lowerRadiusLimit = M.length() + this._attachedCamera.minZ), b = _;
    } else this._mode === l.IgnoreBoundsSizeMode && (b = this._calculateLowerRadiusFromModelBoundingSphere(t, i), this.autoCorrectCameraLimitsAndSensibility && this._attachedCamera.lowerRadiusLimit === null && (this._attachedCamera.lowerRadiusLimit = this._attachedCamera.minZ));
    if (this.autoCorrectCameraLimitsAndSensibility) {
      const _ = i.subtract(t).length();
      this._attachedCamera.panningSensibility = 5e3 / _, this._attachedCamera.wheelPrecision = 100 / b;
    }
    return this._radiusTransition || (this._radiusTransition = f.CreateAnimation("radius", f.ANIMATIONTYPE_FLOAT, 60, l.EasingFunction)), p = f.TransitionTo("radius", b, this._attachedCamera, this._attachedCamera.getScene(), 60, this._radiusTransition, this._framingTime, () => {
      this.stopAllAnimations(), s && s(), this._attachedCamera && this._attachedCamera.useInputToRestoreState && this._attachedCamera.storeState();
    }), p && this._animatables.push(p), !0;
  }
  /**
   * Calculates the lowest radius for the camera based on the bounding box of the mesh.
   * @param minimumWorld
   * @param maximumWorld
   * @returns The minimum distance from the primary mesh's center point at which the camera must be kept in order
   *		 to fully enclose the mesh in the viewing frustum.
   */
  _calculateLowerRadiusFromModelBoundingSphere(t, i) {
    const e = this._attachedCamera;
    if (!e)
      return 0;
    let s = e._calculateLowerRadiusFromModelBoundingSphere(t, i, this._radiusScale);
    return e.lowerRadiusLimit && this._mode === l.IgnoreBoundsSizeMode && (s = s < e.lowerRadiusLimit ? e.lowerRadiusLimit : s), e.upperRadiusLimit && (s = s > e.upperRadiusLimit ? e.upperRadiusLimit : s), s;
  }
  /**
   * Keeps the camera above the ground plane. If the user pulls the camera below the ground plane, the camera
   * is automatically returned to its default position (expected to be above ground plane).
   */
  _maintainCameraAboveGround() {
    if (this._elevationReturnTime < 0)
      return;
    const t = w.Now - this._lastInteractionTime, i = Math.PI * 0.5 - this._defaultElevation, e = Math.PI * 0.5;
    if (this._attachedCamera && !this._betaIsAnimating && this._attachedCamera.beta > e && t >= this._elevationReturnWaitTime) {
      this._betaIsAnimating = !0, this.stopAllAnimations(), this._betaTransition || (this._betaTransition = f.CreateAnimation("beta", f.ANIMATIONTYPE_FLOAT, 60, l.EasingFunction));
      const s = f.TransitionTo("beta", i, this._attachedCamera, this._attachedCamera.getScene(), 60, this._betaTransition, this._elevationReturnTime, () => {
        this._clearAnimationLocks(), this.stopAllAnimations();
      });
      s && this._animatables.push(s);
    }
  }
  /**
   * Removes all animation locks. Allows new animations to be added to any of the arcCamera properties.
   */
  _clearAnimationLocks() {
    this._betaIsAnimating = !1;
  }
  /**
   *  Applies any current user interaction to the camera. Takes into account maximum alpha rotation.
   */
  _applyUserInteraction() {
    this.isUserIsMoving && (this._lastInteractionTime = w.Now, this.stopAllAnimations(), this._clearAnimationLocks());
  }
  /**
   * Stops and removes all animations that have been applied to the camera
   */
  stopAllAnimations() {
    for (this._attachedCamera && (this._attachedCamera.animations = []); this._animatables.length; )
      this._animatables[0] && (this._animatables[0].onAnimationEnd = null, this._animatables[0].stop()), this._animatables.shift();
  }
  /**
   * Gets a value indicating if the user is moving the camera
   */
  get isUserIsMoving() {
    return this._attachedCamera ? this._attachedCamera.inertialAlphaOffset !== 0 || this._attachedCamera.inertialBetaOffset !== 0 || this._attachedCamera.inertialRadiusOffset !== 0 || this._attachedCamera.inertialPanningX !== 0 || this._attachedCamera.inertialPanningY !== 0 || this._isPointerDown : !1;
  }
}
l.EasingFunction = new G();
l.EasingMode = c.EASINGMODE_EASEINOUT;
l.IgnoreBoundsSizeMode = 0;
l.FitFrustumSidesMode = 1;
N.AddNodeConstructor("ArcRotateCamera", (d, t) => () => new o(d, 0, 0, 1, n.Zero(), t));
class o extends U {
  /**
   * Defines the target point of the camera.
   * The camera looks towards it from the radius distance.
   */
  get target() {
    return this._target;
  }
  set target(t) {
    this.setTarget(t);
  }
  /**
   * Defines the target transform node of the camera.
   * The camera looks towards it from the radius distance.
   * Please note that setting a target host will disable panning.
   */
  get targetHost() {
    return this._targetHost;
  }
  set targetHost(t) {
    t && this.setTarget(t);
  }
  /**
   * Return the current target position of the camera. This value is expressed in local space.
   * @returns the target position
   */
  getTarget() {
    return this.target;
  }
  /**
   * Define the current local position of the camera in the scene
   */
  get position() {
    return this._position;
  }
  set position(t) {
    this.setPosition(t);
  }
  /**
   * The vector the camera should consider as up. (default is Vector3(0, 1, 0) as returned by Vector3.Up())
   * Setting this will copy the given vector to the camera's upVector, and set rotation matrices to and from Y up.
   * DO NOT set the up vector using copyFrom or copyFromFloats, as this bypasses setting the above matrices.
   */
  set upVector(t) {
    this._upToYMatrix || (this._yToUpMatrix = new E(), this._upToYMatrix = new E(), this._upVector = n.Zero()), t.normalize(), this._upVector.copyFrom(t), this.setMatUp();
  }
  get upVector() {
    return this._upVector;
  }
  /**
   * Sets the Y-up to camera up-vector rotation matrix, and the up-vector to Y-up rotation matrix.
   */
  setMatUp() {
    E.RotationAlignToRef(n.UpReadOnly, this._upVector, this._yToUpMatrix), E.RotationAlignToRef(this._upVector, n.UpReadOnly, this._upToYMatrix);
  }
  //-- begin properties for backward compatibility for inputs
  /**
   * Gets or Set the pointer angular sensibility  along the X axis or how fast is the camera rotating.
   */
  get angularSensibilityX() {
    const t = this.inputs.attached.pointers;
    return t ? t.angularSensibilityX : 0;
  }
  set angularSensibilityX(t) {
    const i = this.inputs.attached.pointers;
    i && (i.angularSensibilityX = t);
  }
  /**
   * Gets or Set the pointer angular sensibility along the Y axis or how fast is the camera rotating.
   */
  get angularSensibilityY() {
    const t = this.inputs.attached.pointers;
    return t ? t.angularSensibilityY : 0;
  }
  set angularSensibilityY(t) {
    const i = this.inputs.attached.pointers;
    i && (i.angularSensibilityY = t);
  }
  /**
   * Gets or Set the pointer pinch precision or how fast is the camera zooming.
   */
  get pinchPrecision() {
    const t = this.inputs.attached.pointers;
    return t ? t.pinchPrecision : 0;
  }
  set pinchPrecision(t) {
    const i = this.inputs.attached.pointers;
    i && (i.pinchPrecision = t);
  }
  /**
   * Gets or Set the pointer pinch delta percentage or how fast is the camera zooming.
   * It will be used instead of pinchPrecision if different from 0.
   * It defines the percentage of current camera.radius to use as delta when pinch zoom is used.
   */
  get pinchDeltaPercentage() {
    const t = this.inputs.attached.pointers;
    return t ? t.pinchDeltaPercentage : 0;
  }
  set pinchDeltaPercentage(t) {
    const i = this.inputs.attached.pointers;
    i && (i.pinchDeltaPercentage = t);
  }
  /**
   * Gets or Set the pointer use natural pinch zoom to override the pinch precision
   * and pinch delta percentage.
   * When useNaturalPinchZoom is true, multi touch zoom will zoom in such
   * that any object in the plane at the camera's target point will scale
   * perfectly with finger motion.
   */
  get useNaturalPinchZoom() {
    const t = this.inputs.attached.pointers;
    return t ? t.useNaturalPinchZoom : !1;
  }
  set useNaturalPinchZoom(t) {
    const i = this.inputs.attached.pointers;
    i && (i.useNaturalPinchZoom = t);
  }
  /**
   * Gets or Set the pointer panning sensibility or how fast is the camera moving.
   */
  get panningSensibility() {
    const t = this.inputs.attached.pointers;
    return t ? t.panningSensibility : 0;
  }
  set panningSensibility(t) {
    const i = this.inputs.attached.pointers;
    i && (i.panningSensibility = t);
  }
  /**
   * Gets or Set the list of keyboard keys used to control beta angle in a positive direction.
   */
  get keysUp() {
    const t = this.inputs.attached.keyboard;
    return t ? t.keysUp : [];
  }
  set keysUp(t) {
    const i = this.inputs.attached.keyboard;
    i && (i.keysUp = t);
  }
  /**
   * Gets or Set the list of keyboard keys used to control beta angle in a negative direction.
   */
  get keysDown() {
    const t = this.inputs.attached.keyboard;
    return t ? t.keysDown : [];
  }
  set keysDown(t) {
    const i = this.inputs.attached.keyboard;
    i && (i.keysDown = t);
  }
  /**
   * Gets or Set the list of keyboard keys used to control alpha angle in a negative direction.
   */
  get keysLeft() {
    const t = this.inputs.attached.keyboard;
    return t ? t.keysLeft : [];
  }
  set keysLeft(t) {
    const i = this.inputs.attached.keyboard;
    i && (i.keysLeft = t);
  }
  /**
   * Gets or Set the list of keyboard keys used to control alpha angle in a positive direction.
   */
  get keysRight() {
    const t = this.inputs.attached.keyboard;
    return t ? t.keysRight : [];
  }
  set keysRight(t) {
    const i = this.inputs.attached.keyboard;
    i && (i.keysRight = t);
  }
  /**
   * Gets or Set the mouse wheel precision or how fast is the camera zooming.
   */
  get wheelPrecision() {
    const t = this.inputs.attached.mousewheel;
    return t ? t.wheelPrecision : 0;
  }
  set wheelPrecision(t) {
    const i = this.inputs.attached.mousewheel;
    i && (i.wheelPrecision = t);
  }
  /**
   * Gets or Set the boolean value that controls whether or not the mouse wheel
   * zooms to the location of the mouse pointer or not.  The default is false.
   */
  get zoomToMouseLocation() {
    const t = this.inputs.attached.mousewheel;
    return t ? t.zoomToMouseLocation : !1;
  }
  set zoomToMouseLocation(t) {
    const i = this.inputs.attached.mousewheel;
    i && (i.zoomToMouseLocation = t);
  }
  /**
   * Gets or Set the mouse wheel delta percentage or how fast is the camera zooming.
   * It will be used instead of wheelPrecision if different from 0.
   * It defines the percentage of current camera.radius to use as delta when wheel zoom is used.
   */
  get wheelDeltaPercentage() {
    const t = this.inputs.attached.mousewheel;
    return t ? t.wheelDeltaPercentage : 0;
  }
  set wheelDeltaPercentage(t) {
    const i = this.inputs.attached.mousewheel;
    i && (i.wheelDeltaPercentage = t);
  }
  /**
   * Gets the bouncing behavior of the camera if it has been enabled.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#bouncing-behavior
   */
  get bouncingBehavior() {
    return this._bouncingBehavior;
  }
  /**
   * Defines if the bouncing behavior of the camera is enabled on the camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#bouncing-behavior
   */
  get useBouncingBehavior() {
    return this._bouncingBehavior != null;
  }
  set useBouncingBehavior(t) {
    t !== this.useBouncingBehavior && (t ? (this._bouncingBehavior = new A(), this.addBehavior(this._bouncingBehavior)) : this._bouncingBehavior && (this.removeBehavior(this._bouncingBehavior), this._bouncingBehavior = null));
  }
  /**
   * Gets the framing behavior of the camera if it has been enabled.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#framing-behavior
   */
  get framingBehavior() {
    return this._framingBehavior;
  }
  /**
   * Defines if the framing behavior of the camera is enabled on the camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#framing-behavior
   */
  get useFramingBehavior() {
    return this._framingBehavior != null;
  }
  set useFramingBehavior(t) {
    t !== this.useFramingBehavior && (t ? (this._framingBehavior = new l(), this.addBehavior(this._framingBehavior)) : this._framingBehavior && (this.removeBehavior(this._framingBehavior), this._framingBehavior = null));
  }
  /**
   * Gets the auto rotation behavior of the camera if it has been enabled.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#autorotation-behavior
   */
  get autoRotationBehavior() {
    return this._autoRotationBehavior;
  }
  /**
   * Defines if the auto rotation behavior of the camera is enabled on the camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#autorotation-behavior
   */
  get useAutoRotationBehavior() {
    return this._autoRotationBehavior != null;
  }
  set useAutoRotationBehavior(t) {
    t !== this.useAutoRotationBehavior && (t ? (this._autoRotationBehavior = new z(), this.addBehavior(this._autoRotationBehavior)) : this._autoRotationBehavior && (this.removeBehavior(this._autoRotationBehavior), this._autoRotationBehavior = null));
  }
  /**
   * Instantiates a new ArcRotateCamera in a given scene
   * @param name Defines the name of the camera
   * @param alpha Defines the camera rotation along the longitudinal axis
   * @param beta Defines the camera rotation along the latitudinal axis
   * @param radius Defines the camera distance from its target
   * @param target Defines the camera target
   * @param scene Defines the scene the camera belongs to
   * @param setActiveOnSceneIfNoneActive Defines whether the camera should be marked as active if not other active cameras have been defined
   */
  constructor(t, i, e, s, a, h, m = !0) {
    super(t, n.Zero(), h, m), this.inertialAlphaOffset = 0, this.inertialBetaOffset = 0, this.inertialRadiusOffset = 0, this.lowerAlphaLimit = null, this.upperAlphaLimit = null, this.lowerBetaLimit = 0.01, this.upperBetaLimit = Math.PI - 0.01, this.lowerRadiusLimit = null, this.upperRadiusLimit = null, this.inertialPanningX = 0, this.inertialPanningY = 0, this.pinchToPanMaxDistance = 20, this.panningDistanceLimit = null, this.panningOriginTarget = n.Zero(), this.panningInertia = 0.9, this.zoomOnFactor = 1, this.targetScreenOffset = S.Zero(), this.allowUpsideDown = !0, this.useInputToRestoreState = !0, this._viewMatrix = new E(), this.panningAxis = new n(1, 1, 0), this._transformedDirection = new n(), this.mapPanning = !1, this.onMeshTargetChangedObservable = new B(), this.checkCollisions = !1, this.collisionRadius = new n(0.5, 0.5, 0.5), this._previousPosition = n.Zero(), this._collisionVelocity = n.Zero(), this._newPosition = n.Zero(), this._computationVector = n.Zero(), this._onCollisionPositionChange = (C, M, p = null) => {
      p ? (this.setPosition(M), this.onCollide && this.onCollide(p)) : this._previousPosition.copyFrom(this._position);
      const b = Math.cos(this.alpha), _ = Math.sin(this.alpha), P = Math.cos(this.beta);
      let R = Math.sin(this.beta);
      R === 0 && (R = 1e-4);
      const T = this._getTargetPosition();
      this._computationVector.copyFromFloats(this.radius * b * R, this.radius * P, this.radius * _ * R), T.addToRef(this._computationVector, this._newPosition), this._position.copyFrom(this._newPosition);
      let O = this.upVector;
      this.allowUpsideDown && this.beta < 0 && (O = O.clone(), O = O.negate()), this._computeViewMatrix(this._position, T, O), this._viewMatrix.addAtIndex(12, this.targetScreenOffset.x), this._viewMatrix.addAtIndex(13, this.targetScreenOffset.y), this._collisionTriggered = !1;
    }, this._target = n.Zero(), a && this.setTarget(a), this.alpha = i, this.beta = e, this.radius = s, this.getViewMatrix(), this.inputs = new Y(this), this.inputs.addKeyboard().addMouseWheel().addPointers();
  }
  // Cache
  /** @internal */
  _initCache() {
    super._initCache(), this._cache._target = new n(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), this._cache.alpha = void 0, this._cache.beta = void 0, this._cache.radius = void 0, this._cache.targetScreenOffset = S.Zero();
  }
  /**
   * @internal
   */
  _updateCache(t) {
    t || super._updateCache(), this._cache._target.copyFrom(this._getTargetPosition()), this._cache.alpha = this.alpha, this._cache.beta = this.beta, this._cache.radius = this.radius, this._cache.targetScreenOffset.copyFrom(this.targetScreenOffset);
  }
  _getTargetPosition() {
    if (this._targetHost && this._targetHost.getAbsolutePosition) {
      const i = this._targetHost.getAbsolutePosition();
      this._targetBoundingCenter ? i.addToRef(this._targetBoundingCenter, this._target) : this._target.copyFrom(i);
    }
    const t = this._getLockedTargetPosition();
    return t || this._target;
  }
  /**
   * Stores the current state of the camera (alpha, beta, radius and target)
   * @returns the camera itself
   */
  storeState() {
    return this._storedAlpha = this.alpha, this._storedBeta = this.beta, this._storedRadius = this.radius, this._storedTarget = this._getTargetPosition().clone(), this._storedTargetScreenOffset = this.targetScreenOffset.clone(), super.storeState();
  }
  /**
   * @internal
   * Restored camera state. You must call storeState() first
   */
  _restoreStateValues() {
    return super._restoreStateValues() ? (this.setTarget(this._storedTarget.clone()), this.alpha = this._storedAlpha, this.beta = this._storedBeta, this.radius = this._storedRadius, this.targetScreenOffset = this._storedTargetScreenOffset.clone(), this.inertialAlphaOffset = 0, this.inertialBetaOffset = 0, this.inertialRadiusOffset = 0, this.inertialPanningX = 0, this.inertialPanningY = 0, !0) : !1;
  }
  // Synchronized
  /** @internal */
  _isSynchronizedViewMatrix() {
    return super._isSynchronizedViewMatrix() ? this._cache._target.equals(this._getTargetPosition()) && this._cache.alpha === this.alpha && this._cache.beta === this.beta && this._cache.radius === this.radius && this._cache.targetScreenOffset.equals(this.targetScreenOffset) : !1;
  }
  /**
   * Attached controls to the current camera.
   * @param ignored defines an ignored parameter kept for backward compatibility.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   * @param useCtrlForPanning  Defines whether ctrl is used for panning within the controls
   * @param panningMouseButton Defines whether panning is allowed through mouse click button
   */
  attachControl(t, i, e = !0, s = 2) {
    const a = arguments;
    i = x.BackCompatCameraNoPreventDefault(a), this._useCtrlForPanning = e, this._panningMouseButton = s, typeof a[0] == "boolean" && (a.length > 1 && (this._useCtrlForPanning = a[1]), a.length > 2 && (this._panningMouseButton = a[2])), this.inputs.attachElement(i), this._reset = () => {
      this.inertialAlphaOffset = 0, this.inertialBetaOffset = 0, this.inertialRadiusOffset = 0, this.inertialPanningX = 0, this.inertialPanningY = 0;
    };
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this.inputs.detachElement(), this._reset && this._reset();
  }
  /** @internal */
  _checkInputs() {
    if (!this._collisionTriggered) {
      if (this.inputs.checkInputs(), this.inertialAlphaOffset !== 0 || this.inertialBetaOffset !== 0 || this.inertialRadiusOffset !== 0) {
        const t = this.invertRotation ? -1 : 1, i = this._calculateHandednessMultiplier();
        let e = this.inertialAlphaOffset * i;
        this.beta < 0 && (e *= -1), this.alpha += e * t, this.beta += this.inertialBetaOffset * t, this.radius -= this.inertialRadiusOffset, this.inertialAlphaOffset *= this.inertia, this.inertialBetaOffset *= this.inertia, this.inertialRadiusOffset *= this.inertia, Math.abs(this.inertialAlphaOffset) < I && (this.inertialAlphaOffset = 0), Math.abs(this.inertialBetaOffset) < I && (this.inertialBetaOffset = 0), Math.abs(this.inertialRadiusOffset) < this.speed * I && (this.inertialRadiusOffset = 0);
      }
      if (this.inertialPanningX !== 0 || this.inertialPanningY !== 0) {
        const t = new n(this.inertialPanningX, this.inertialPanningY, this.inertialPanningY);
        if (this._viewMatrix.invertToRef(this._cameraTransformMatrix), t.multiplyInPlace(this.panningAxis), n.TransformNormalToRef(t, this._cameraTransformMatrix, this._transformedDirection), this.mapPanning) {
          const i = this.upVector, e = n.CrossToRef(this._transformedDirection, i, this._transformedDirection);
          n.CrossToRef(i, e, this._transformedDirection);
        } else this.panningAxis.y || (this._transformedDirection.y = 0);
        if (!this._targetHost)
          if (this.panningDistanceLimit)
            this._transformedDirection.addInPlace(this._target), n.DistanceSquared(this._transformedDirection, this.panningOriginTarget) <= this.panningDistanceLimit * this.panningDistanceLimit && this._target.copyFrom(this._transformedDirection);
          else {
            if (this.parent) {
              const i = D.Matrix[0];
              this.parent.getWorldMatrix().getRotationMatrixToRef(i), i.transposeToRef(i), n.TransformCoordinatesToRef(this._transformedDirection, i, this._transformedDirection);
            }
            this._target.addInPlace(this._transformedDirection);
          }
        this.inertialPanningX *= this.panningInertia, this.inertialPanningY *= this.panningInertia, Math.abs(this.inertialPanningX) < this.speed * I && (this.inertialPanningX = 0), Math.abs(this.inertialPanningY) < this.speed * I && (this.inertialPanningY = 0);
      }
      this._checkLimits(), super._checkInputs();
    }
  }
  _checkLimits() {
    this.lowerBetaLimit === null || this.lowerBetaLimit === void 0 ? this.allowUpsideDown && this.beta > Math.PI && (this.beta = this.beta - 2 * Math.PI) : this.beta < this.lowerBetaLimit && (this.beta = this.lowerBetaLimit), this.upperBetaLimit === null || this.upperBetaLimit === void 0 ? this.allowUpsideDown && this.beta < -Math.PI && (this.beta = this.beta + 2 * Math.PI) : this.beta > this.upperBetaLimit && (this.beta = this.upperBetaLimit), this.lowerAlphaLimit !== null && this.alpha < this.lowerAlphaLimit && (this.alpha = this.lowerAlphaLimit), this.upperAlphaLimit !== null && this.alpha > this.upperAlphaLimit && (this.alpha = this.upperAlphaLimit), this.lowerRadiusLimit !== null && this.radius < this.lowerRadiusLimit && (this.radius = this.lowerRadiusLimit, this.inertialRadiusOffset = 0), this.upperRadiusLimit !== null && this.radius > this.upperRadiusLimit && (this.radius = this.upperRadiusLimit, this.inertialRadiusOffset = 0);
  }
  /**
   * Rebuilds angles (alpha, beta) and radius from the give position and target
   */
  rebuildAnglesAndRadius() {
    this._position.subtractToRef(this._getTargetPosition(), this._computationVector), (this._upVector.x !== 0 || this._upVector.y !== 1 || this._upVector.z !== 0) && n.TransformCoordinatesToRef(this._computationVector, this._upToYMatrix, this._computationVector), this.radius = this._computationVector.length(), this.radius === 0 && (this.radius = 1e-4);
    const t = this.alpha;
    this._computationVector.x === 0 && this._computationVector.z === 0 ? this.alpha = Math.PI / 2 : this.alpha = Math.acos(this._computationVector.x / Math.sqrt(Math.pow(this._computationVector.x, 2) + Math.pow(this._computationVector.z, 2))), this._computationVector.z < 0 && (this.alpha = 2 * Math.PI - this.alpha);
    const i = Math.round((t - this.alpha) / (2 * Math.PI));
    this.alpha += i * 2 * Math.PI, this.beta = Math.acos(this._computationVector.y / this.radius), this._checkLimits();
  }
  /**
   * Use a position to define the current camera related information like alpha, beta and radius
   * @param position Defines the position to set the camera at
   */
  setPosition(t) {
    this._position.equals(t) || (this._position.copyFrom(t), this.rebuildAnglesAndRadius());
  }
  /**
   * Defines the target the camera should look at.
   * This will automatically adapt alpha beta and radius to fit within the new target.
   * Please note that setting a target as a mesh will disable panning.
   * @param target Defines the new target as a Vector or a transform node
   * @param toBoundingCenter In case of a mesh target, defines whether to target the mesh position or its bounding information center
   * @param allowSamePosition If false, prevents reapplying the new computed position if it is identical to the current one (optim)
   * @param cloneAlphaBetaRadius If true, replicate the current setup (alpha, beta, radius) on the new target
   */
  setTarget(t, i = !1, e = !1, s = !1) {
    if (s = this.overrideCloneAlphaBetaRadius ?? s, t.computeWorldMatrix)
      i && t.getBoundingInfo ? this._targetBoundingCenter = t.getBoundingInfo().boundingBox.centerWorld.clone() : this._targetBoundingCenter = null, t.computeWorldMatrix(), this._targetHost = t, this._target = this._getTargetPosition(), this.onMeshTargetChangedObservable.notifyObservers(this._targetHost);
    else {
      const a = t, h = this._getTargetPosition();
      if (h && !e && h.equals(a))
        return;
      this._targetHost = null, this._target = a, this._targetBoundingCenter = null, this.onMeshTargetChangedObservable.notifyObservers(null);
    }
    s || this.rebuildAnglesAndRadius();
  }
  /** @internal */
  _getViewMatrix() {
    const t = Math.cos(this.alpha), i = Math.sin(this.alpha), e = Math.cos(this.beta);
    let s = Math.sin(this.beta);
    s === 0 && (s = 1e-4), this.radius === 0 && (this.radius = 1e-4);
    const a = this._getTargetPosition();
    if (this._computationVector.copyFromFloats(this.radius * t * s, this.radius * e, this.radius * i * s), (this._upVector.x !== 0 || this._upVector.y !== 1 || this._upVector.z !== 0) && n.TransformCoordinatesToRef(this._computationVector, this._yToUpMatrix, this._computationVector), a.addToRef(this._computationVector, this._newPosition), this.getScene().collisionsEnabled && this.checkCollisions) {
      const h = this.getScene().collisionCoordinator;
      this._collider || (this._collider = h.createCollider()), this._collider._radius = this.collisionRadius, this._newPosition.subtractToRef(this._position, this._collisionVelocity), this._collisionTriggered = !0, h.getNewPosition(this._position, this._collisionVelocity, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
    } else {
      this._position.copyFrom(this._newPosition);
      let h = this.upVector;
      this.allowUpsideDown && s < 0 && (h = h.negate()), this._computeViewMatrix(this._position, a, h), this._viewMatrix.addAtIndex(12, this.targetScreenOffset.x), this._viewMatrix.addAtIndex(13, this.targetScreenOffset.y);
    }
    return this._currentTarget = a, this._viewMatrix;
  }
  /**
   * Zooms on a mesh to be at the min distance where we could see it fully in the current viewport.
   * @param meshes Defines the mesh to zoom on
   * @param doNotUpdateMaxZ Defines whether or not maxZ should be updated whilst zooming on the mesh (this can happen if the mesh is big and the maxradius pretty small for instance)
   */
  zoomOn(t, i = !1) {
    t = t || this.getScene().meshes;
    const e = v.MinMax(t);
    let s = this._calculateLowerRadiusFromModelBoundingSphere(e.min, e.max);
    s = Math.max(Math.min(s, this.upperRadiusLimit || Number.MAX_VALUE), this.lowerRadiusLimit || 0), this.radius = s * this.zoomOnFactor, this.focusOn({ min: e.min, max: e.max, distance: s }, i);
  }
  /**
   * Focus on a mesh or a bounding box. This adapts the target and maxRadius if necessary but does not update the current radius.
   * The target will be changed but the radius
   * @param meshesOrMinMaxVectorAndDistance Defines the mesh or bounding info to focus on
   * @param doNotUpdateMaxZ Defines whether or not maxZ should be updated whilst zooming on the mesh (this can happen if the mesh is big and the maxradius pretty small for instance)
   */
  focusOn(t, i = !1) {
    let e, s;
    if (t.min === void 0) {
      const a = t || this.getScene().meshes;
      e = v.MinMax(a), s = n.Distance(e.min, e.max);
    } else {
      const a = t;
      e = a, s = a.distance;
    }
    this._target = v.Center(e), i || (this.maxZ = s * 2);
  }
  /**
   * @override
   * Override Camera.createRigCamera
   * @param name the name of the camera
   * @param cameraIndex the index of the camera in the rig cameras array
   */
  createRigCamera(t, i) {
    let e = 0;
    switch (this.cameraRigMode) {
      case g.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
      case g.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
      case g.RIG_MODE_STEREOSCOPIC_OVERUNDER:
      case g.RIG_MODE_STEREOSCOPIC_INTERLACED:
      case g.RIG_MODE_VR:
        e = this._cameraRigParams.stereoHalfAngle * (i === 0 ? 1 : -1);
        break;
      case g.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
        e = this._cameraRigParams.stereoHalfAngle * (i === 0 ? -1 : 1);
        break;
    }
    const s = new o(t, this.alpha + e, this.beta, this.radius, this._target, this.getScene());
    return s._cameraRigParams = {}, s.isRigCamera = !0, s.rigParent = this, s.upVector = this.upVector, s.mode = this.mode, s.orthoLeft = this.orthoLeft, s.orthoRight = this.orthoRight, s.orthoBottom = this.orthoBottom, s.orthoTop = this.orthoTop, s;
  }
  /**
   * @internal
   * @override
   * Override Camera._updateRigCameras
   */
  _updateRigCameras() {
    const t = this._rigCameras[0], i = this._rigCameras[1];
    switch (t.beta = i.beta = this.beta, this.cameraRigMode) {
      case g.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
      case g.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
      case g.RIG_MODE_STEREOSCOPIC_OVERUNDER:
      case g.RIG_MODE_STEREOSCOPIC_INTERLACED:
      case g.RIG_MODE_VR:
        t.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle, i.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle;
        break;
      case g.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
        t.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle, i.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle;
        break;
    }
    super._updateRigCameras();
  }
  /**
   * @internal
   */
  _calculateLowerRadiusFromModelBoundingSphere(t, i, e = 1) {
    const s = n.Distance(t, i), h = this.getScene().getEngine().getAspectRatio(this), m = Math.tan(this.fov / 2), C = m * h, p = s * 0.5 * e, b = p * Math.sqrt(1 + 1 / (C * C)), _ = p * Math.sqrt(1 + 1 / (m * m));
    return Math.max(b, _);
  }
  /**
   * Destroy the camera and release the current resources hold by it.
   */
  dispose() {
    this.inputs.clear(), super.dispose();
  }
  /**
   * Gets the current object class name.
   * @returns the class name
   */
  getClassName() {
    return "ArcRotateCamera";
  }
}
r([
  u()
], o.prototype, "alpha", void 0);
r([
  u()
], o.prototype, "beta", void 0);
r([
  u()
], o.prototype, "radius", void 0);
r([
  u()
], o.prototype, "overrideCloneAlphaBetaRadius", void 0);
r([
  L("target")
], o.prototype, "_target", void 0);
r([
  V("targetHost")
], o.prototype, "_targetHost", void 0);
r([
  u()
], o.prototype, "inertialAlphaOffset", void 0);
r([
  u()
], o.prototype, "inertialBetaOffset", void 0);
r([
  u()
], o.prototype, "inertialRadiusOffset", void 0);
r([
  u()
], o.prototype, "lowerAlphaLimit", void 0);
r([
  u()
], o.prototype, "upperAlphaLimit", void 0);
r([
  u()
], o.prototype, "lowerBetaLimit", void 0);
r([
  u()
], o.prototype, "upperBetaLimit", void 0);
r([
  u()
], o.prototype, "lowerRadiusLimit", void 0);
r([
  u()
], o.prototype, "upperRadiusLimit", void 0);
r([
  u()
], o.prototype, "inertialPanningX", void 0);
r([
  u()
], o.prototype, "inertialPanningY", void 0);
r([
  u()
], o.prototype, "pinchToPanMaxDistance", void 0);
r([
  u()
], o.prototype, "panningDistanceLimit", void 0);
r([
  L()
], o.prototype, "panningOriginTarget", void 0);
r([
  u()
], o.prototype, "panningInertia", void 0);
r([
  u()
], o.prototype, "zoomToMouseLocation", null);
r([
  u()
], o.prototype, "zoomOnFactor", void 0);
r([
  k()
], o.prototype, "targetScreenOffset", void 0);
r([
  u()
], o.prototype, "allowUpsideDown", void 0);
r([
  u()
], o.prototype, "useInputToRestoreState", void 0);
const lt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ArcRotateCamera: o
}, Symbol.toStringTag, { value: "Module" }));
export {
  o as A,
  H as B,
  it as C,
  c as E,
  l as F,
  nt as P,
  ot as Q,
  ut as S,
  ct as a,
  et as b,
  A as c,
  st as d,
  at as e,
  G as f,
  rt as g,
  ht as h,
  lt as i
};
//# sourceMappingURL=arcRotateCamera-BlvpucuE.js.map
