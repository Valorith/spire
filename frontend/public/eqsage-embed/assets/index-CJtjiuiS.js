import { F as K, a as N, B as ge, b as ve, c as Pe, d as xe, e as ke } from "./freeCamera-Ck5f6hvq.js";
import { A as Q, B as q, a as Re, b as Oe, c as Se } from "./arcRotateCameraInputsManager-D9vK1NlN.js";
import { U as M, A as be, F as we, T as Ie } from "./universalCamera-Brfl5hn2.js";
import { C as R, a as U, T as E } from "./cameraInputsManager-BaKFkt7F.js";
import { T as P, a as d, b as r, c as h, Q as I, L as D, g as v, M as $, s as J, i as De, $ as Me, x as ee, R as Ee } from "./embed-entry-Bb6cfUYP.js";
import { K as te, n as Ae } from "./scene-81J9Z4aI.js";
import { PointerEventTypes as x } from "./pointerEvents-Cd27wOCS.js";
import { A as L } from "./math.axis-CU2IA4no.js";
import { h as G, s as V, i as ie, F as Fe, D as Te, O as je, V as Le } from "./vrExperienceHelper-BQaeqRtE.js";
import { C as m } from "./camera-Bftgmroh.js";
import { A as z } from "./arcRotateCamera-C1AydDZB.js";
import { E as He } from "./engine-Br2P72Us.js";
import { N as _ } from "./node-DDdHG9Gc.js";
import { P as se } from "./passPostProcess-On51YqVS.js";
import { P as X } from "./postProcess-CHPSq8Bh.js";
import { V as H } from "./math.viewport-CrgurBQ6.js";
import { TransformNode as Ne } from "./transformNode-ChKEoFVr.js";
Q.prototype.addVRDeviceOrientation = function() {
  return this.add(new W()), this;
};
class W {
  /**
   * Instantiate a new ArcRotateCameraVRDeviceOrientationInput.
   */
  constructor() {
    this.alphaCorrection = 1, this.gammaCorrection = 1, this._alpha = 0, this._gamma = 0, this._dirty = !1, this._deviceOrientationHandler = (e) => this._onOrientationEvent(e);
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e) {
    e = P.BackCompatCameraNoPreventDefault(arguments), this.camera.attachControl(e);
    const t = this.camera.getScene().getEngine().getHostWindow();
    t && (typeof DeviceOrientationEvent < "u" && typeof DeviceOrientationEvent.requestPermission == "function" ? DeviceOrientationEvent.requestPermission().then((i) => {
      i === "granted" ? t.addEventListener("deviceorientation", this._deviceOrientationHandler) : P.Warn("Permission not granted.");
    }).catch((i) => {
      P.Error(i);
    }) : t.addEventListener("deviceorientation", this._deviceOrientationHandler));
  }
  /**
   * @internal
   */
  _onOrientationEvent(e) {
    e.alpha !== null && (this._alpha = (+e.alpha | 0) * this.alphaCorrection), e.gamma !== null && (this._gamma = (+e.gamma | 0) * this.gammaCorrection), this._dirty = !0;
  }
  /**
   * Update the current camera state depending on the inputs that have been used this frame.
   * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
   */
  checkInputs() {
    this._dirty && (this._dirty = !1, this._gamma < 0 && (this._gamma = 180 + this._gamma), this.camera.alpha = -this._alpha / 180 * Math.PI % Math.PI * 2, this.camera.beta = this._gamma / 180 * Math.PI);
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "ArcRotateCameraVRDeviceOrientationInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "VRDeviceOrientation";
  }
}
R.ArcRotateCameraVRDeviceOrientationInput = W;
class k {
  constructor() {
    this.keysForward = [87], this.keysBackward = [83], this.keysUp = [69], this.keysDown = [81], this.keysRight = [68], this.keysLeft = [65], this._keys = new Array();
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e) {
    e = P.BackCompatCameraNoPreventDefault(arguments), !this._onCanvasBlurObserver && (this._scene = this.camera.getScene(), this._engine = this._scene.getEngine(), this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
      this._keys.length = 0;
    }), this._onKeyboardObserver = this._scene.onKeyboardObservable.add((t) => {
      const i = t.event;
      if (t.type === te.KEYDOWN)
        (this.keysForward.indexOf(i.keyCode) !== -1 || this.keysBackward.indexOf(i.keyCode) !== -1 || this.keysUp.indexOf(i.keyCode) !== -1 || this.keysDown.indexOf(i.keyCode) !== -1 || this.keysLeft.indexOf(i.keyCode) !== -1 || this.keysRight.indexOf(i.keyCode) !== -1) && (this._keys.indexOf(i.keyCode) === -1 && this._keys.push(i.keyCode), e || i.preventDefault());
      else if (this.keysForward.indexOf(i.keyCode) !== -1 || this.keysBackward.indexOf(i.keyCode) !== -1 || this.keysUp.indexOf(i.keyCode) !== -1 || this.keysDown.indexOf(i.keyCode) !== -1 || this.keysLeft.indexOf(i.keyCode) !== -1 || this.keysRight.indexOf(i.keyCode) !== -1) {
        const s = this._keys.indexOf(i.keyCode);
        s >= 0 && this._keys.splice(s, 1), e || i.preventDefault();
      }
    }));
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this._scene && (this._onKeyboardObserver && this._scene.onKeyboardObservable.remove(this._onKeyboardObserver), this._onCanvasBlurObserver && this._engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver), this._onKeyboardObserver = null, this._onCanvasBlurObserver = null), this._keys.length = 0;
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FlyCameraKeyboardInput";
  }
  /**
   * @internal
   */
  _onLostFocus() {
    this._keys.length = 0;
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "keyboard";
  }
  /**
   * Update the current camera state depending on the inputs that have been used this frame.
   * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
   */
  checkInputs() {
    if (this._onKeyboardObserver) {
      const e = this.camera;
      for (let t = 0; t < this._keys.length; t++) {
        const i = this._keys[t], s = e._computeLocalCameraSpeed();
        this.keysForward.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(0, 0, s) : this.keysBackward.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(0, 0, -s) : this.keysUp.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(0, s, 0) : this.keysDown.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(0, -s, 0) : this.keysRight.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(s, 0, 0) : this.keysLeft.indexOf(i) !== -1 && e._localDirection.copyFromFloats(-s, 0, 0), e.getScene().useRightHandedSystem && (e._localDirection.z *= -1), e.getViewMatrix().invertToRef(e._cameraTransformMatrix), d.TransformNormalToRef(e._localDirection, e._cameraTransformMatrix, e._transformedDirection), e.cameraDirection.addInPlace(e._transformedDirection);
      }
    }
  }
}
r([
  h()
], k.prototype, "keysForward", void 0);
r([
  h()
], k.prototype, "keysBackward", void 0);
r([
  h()
], k.prototype, "keysUp", void 0);
r([
  h()
], k.prototype, "keysDown", void 0);
r([
  h()
], k.prototype, "keysRight", void 0);
r([
  h()
], k.prototype, "keysLeft", void 0);
R.FlyCameraKeyboardInput = k;
class A {
  /**
   * Listen to mouse events to control the camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
   */
  constructor() {
    this.buttons = [0, 1, 2], this.buttonsYaw = [-1, 0, 1], this.buttonsPitch = [-1, 0, 1], this.buttonsRoll = [2], this.activeButton = -1, this.angularSensibility = 1e3, this._previousPosition = null;
  }
  /**
   * Attach the mouse control to the HTML DOM element.
   * @param noPreventDefault Defines whether events caught by the controls should call preventdefault().
   */
  attachControl(e) {
    e = P.BackCompatCameraNoPreventDefault(arguments), this._noPreventDefault = e, this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver((t) => {
      this._pointerInput(t);
    }, x.POINTERDOWN | x.POINTERUP | x.POINTERMOVE), this._rollObserver = this.camera.getScene().onBeforeRenderObservable.add(() => {
      this.camera.rollCorrect && this.camera.restoreRoll(this.camera.rollCorrect);
    });
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this._observer && (this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer), this.camera.getScene().onBeforeRenderObservable.remove(this._rollObserver), this._observer = null, this._rollObserver = null, this._previousPosition = null, this._noPreventDefault = void 0);
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name.
   */
  getClassName() {
    return "FlyCameraMouseInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input's friendly name.
   */
  getSimpleName() {
    return "mouse";
  }
  // Track mouse movement, when the pointer is not locked.
  _pointerInput(e) {
    const t = e.event, s = this.camera.getEngine();
    if (!this.touchEnabled && t.pointerType === "touch" || e.type !== x.POINTERMOVE && this.buttons.indexOf(t.button) === -1)
      return;
    const n = t.target;
    if (e.type === x.POINTERDOWN) {
      try {
        n?.setPointerCapture(t.pointerId);
      } catch {
      }
      this._previousPosition = {
        x: t.clientX,
        y: t.clientY
      }, this.activeButton = t.button, this._noPreventDefault || (t.preventDefault(), this._element.focus()), s.isPointerLock && this._onMouseMove(e.event);
    } else if (e.type === x.POINTERUP) {
      try {
        n?.releasePointerCapture(t.pointerId);
      } catch {
      }
      this.activeButton = -1, this._previousPosition = null, this._noPreventDefault || t.preventDefault();
    } else if (e.type === x.POINTERMOVE) {
      if (!this._previousPosition) {
        s.isPointerLock && this._onMouseMove(e.event);
        return;
      }
      const l = t.clientX - this._previousPosition.x, c = t.clientY - this._previousPosition.y;
      this._rotateCamera(l, c), this._previousPosition = {
        x: t.clientX,
        y: t.clientY
      }, this._noPreventDefault || t.preventDefault();
    }
  }
  // Track mouse movement, when pointer is locked.
  _onMouseMove(e) {
    if (!this.camera.getEngine().isPointerLock)
      return;
    const s = e.movementX, n = e.movementY;
    this._rotateCamera(s, n), this._previousPosition = null, this._noPreventDefault || e.preventDefault();
  }
  /**
   * Rotate camera by mouse offset.
   * @param offsetX
   * @param offsetY
   */
  _rotateCamera(e, t) {
    const i = this.camera, s = i._calculateHandednessMultiplier();
    e *= s;
    const n = e / this.angularSensibility, l = t / this.angularSensibility, c = I.RotationYawPitchRoll(i.rotation.y, i.rotation.x, i.rotation.z);
    let u;
    if (this.buttonsPitch.some((y) => y === this.activeButton) && (u = I.RotationAxis(L.X, l), c.multiplyInPlace(u)), this.buttonsYaw.some((y) => y === this.activeButton)) {
      u = I.RotationAxis(L.Y, n), c.multiplyInPlace(u);
      const y = i.bankedTurnLimit + i._trackRoll;
      if (i.bankedTurn && -y < i.rotation.z && i.rotation.z < y) {
        const Y = i.bankedTurnMultiplier * -n;
        u = I.RotationAxis(L.Z, Y), c.multiplyInPlace(u);
      }
    }
    this.buttonsRoll.some((y) => y === this.activeButton) && (u = I.RotationAxis(L.Z, -n), i._trackRoll -= n, c.multiplyInPlace(u)), c.toEulerAnglesToRef(i.rotation);
  }
}
r([
  h()
], A.prototype, "buttons", void 0);
r([
  h()
], A.prototype, "angularSensibility", void 0);
R.FlyCameraMouseInput = A;
class p {
  constructor() {
    this.keysHeightOffsetIncr = [38], this.keysHeightOffsetDecr = [40], this.keysHeightOffsetModifierAlt = !1, this.keysHeightOffsetModifierCtrl = !1, this.keysHeightOffsetModifierShift = !1, this.keysRotationOffsetIncr = [37], this.keysRotationOffsetDecr = [39], this.keysRotationOffsetModifierAlt = !1, this.keysRotationOffsetModifierCtrl = !1, this.keysRotationOffsetModifierShift = !1, this.keysRadiusIncr = [40], this.keysRadiusDecr = [38], this.keysRadiusModifierAlt = !0, this.keysRadiusModifierCtrl = !1, this.keysRadiusModifierShift = !1, this.heightSensibility = 1, this.rotationSensibility = 1, this.radiusSensibility = 1, this._keys = new Array();
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e) {
    e = P.BackCompatCameraNoPreventDefault(arguments), !this._onCanvasBlurObserver && (this._scene = this.camera.getScene(), this._engine = this._scene.getEngine(), this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
      this._keys.length = 0;
    }), this._onKeyboardObserver = this._scene.onKeyboardObservable.add((t) => {
      const i = t.event;
      if (!i.metaKey) {
        if (t.type === te.KEYDOWN)
          this._ctrlPressed = i.ctrlKey, this._altPressed = i.altKey, this._shiftPressed = i.shiftKey, (this.keysHeightOffsetIncr.indexOf(i.keyCode) !== -1 || this.keysHeightOffsetDecr.indexOf(i.keyCode) !== -1 || this.keysRotationOffsetIncr.indexOf(i.keyCode) !== -1 || this.keysRotationOffsetDecr.indexOf(i.keyCode) !== -1 || this.keysRadiusIncr.indexOf(i.keyCode) !== -1 || this.keysRadiusDecr.indexOf(i.keyCode) !== -1) && (this._keys.indexOf(i.keyCode) === -1 && this._keys.push(i.keyCode), i.preventDefault && (e || i.preventDefault()));
        else if (this.keysHeightOffsetIncr.indexOf(i.keyCode) !== -1 || this.keysHeightOffsetDecr.indexOf(i.keyCode) !== -1 || this.keysRotationOffsetIncr.indexOf(i.keyCode) !== -1 || this.keysRotationOffsetDecr.indexOf(i.keyCode) !== -1 || this.keysRadiusIncr.indexOf(i.keyCode) !== -1 || this.keysRadiusDecr.indexOf(i.keyCode) !== -1) {
          const s = this._keys.indexOf(i.keyCode);
          s >= 0 && this._keys.splice(s, 1), i.preventDefault && (e || i.preventDefault());
        }
      }
    }));
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this._scene && (this._onKeyboardObserver && this._scene.onKeyboardObservable.remove(this._onKeyboardObserver), this._onCanvasBlurObserver && this._engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver), this._onKeyboardObserver = null, this._onCanvasBlurObserver = null), this._keys.length = 0;
  }
  /**
   * Update the current camera state depending on the inputs that have been used this frame.
   * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
   */
  checkInputs() {
    this._onKeyboardObserver && this._keys.forEach((e) => {
      this.keysHeightOffsetIncr.indexOf(e) !== -1 && this._modifierHeightOffset() ? this.camera.heightOffset += this.heightSensibility : this.keysHeightOffsetDecr.indexOf(e) !== -1 && this._modifierHeightOffset() ? this.camera.heightOffset -= this.heightSensibility : this.keysRotationOffsetIncr.indexOf(e) !== -1 && this._modifierRotationOffset() ? (this.camera.rotationOffset += this.rotationSensibility, this.camera.rotationOffset %= 360) : this.keysRotationOffsetDecr.indexOf(e) !== -1 && this._modifierRotationOffset() ? (this.camera.rotationOffset -= this.rotationSensibility, this.camera.rotationOffset %= 360) : this.keysRadiusIncr.indexOf(e) !== -1 && this._modifierRadius() ? this.camera.radius += this.radiusSensibility : this.keysRadiusDecr.indexOf(e) !== -1 && this._modifierRadius() && (this.camera.radius -= this.radiusSensibility);
    });
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FollowCameraKeyboardMoveInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "keyboard";
  }
  /**
   * Check if the pressed modifier keys (Alt/Ctrl/Shift) match those configured to
   * allow modification of the heightOffset value.
   * @returns true if modifier keys match
   */
  _modifierHeightOffset() {
    return this.keysHeightOffsetModifierAlt === this._altPressed && this.keysHeightOffsetModifierCtrl === this._ctrlPressed && this.keysHeightOffsetModifierShift === this._shiftPressed;
  }
  /**
   * Check if the pressed modifier keys (Alt/Ctrl/Shift) match those configured to
   * allow modification of the rotationOffset value.
   * @returns true if modifier keys match
   */
  _modifierRotationOffset() {
    return this.keysRotationOffsetModifierAlt === this._altPressed && this.keysRotationOffsetModifierCtrl === this._ctrlPressed && this.keysRotationOffsetModifierShift === this._shiftPressed;
  }
  /**
   * Check if the pressed modifier keys (Alt/Ctrl/Shift) match those configured to
   * allow modification of the radius value.
   * @returns true if modifier keys match
   */
  _modifierRadius() {
    return this.keysRadiusModifierAlt === this._altPressed && this.keysRadiusModifierCtrl === this._ctrlPressed && this.keysRadiusModifierShift === this._shiftPressed;
  }
}
r([
  h()
], p.prototype, "keysHeightOffsetIncr", void 0);
r([
  h()
], p.prototype, "keysHeightOffsetDecr", void 0);
r([
  h()
], p.prototype, "keysHeightOffsetModifierAlt", void 0);
r([
  h()
], p.prototype, "keysHeightOffsetModifierCtrl", void 0);
r([
  h()
], p.prototype, "keysHeightOffsetModifierShift", void 0);
r([
  h()
], p.prototype, "keysRotationOffsetIncr", void 0);
r([
  h()
], p.prototype, "keysRotationOffsetDecr", void 0);
r([
  h()
], p.prototype, "keysRotationOffsetModifierAlt", void 0);
r([
  h()
], p.prototype, "keysRotationOffsetModifierCtrl", void 0);
r([
  h()
], p.prototype, "keysRotationOffsetModifierShift", void 0);
r([
  h()
], p.prototype, "keysRadiusIncr", void 0);
r([
  h()
], p.prototype, "keysRadiusDecr", void 0);
r([
  h()
], p.prototype, "keysRadiusModifierAlt", void 0);
r([
  h()
], p.prototype, "keysRadiusModifierCtrl", void 0);
r([
  h()
], p.prototype, "keysRadiusModifierShift", void 0);
r([
  h()
], p.prototype, "heightSensibility", void 0);
r([
  h()
], p.prototype, "rotationSensibility", void 0);
r([
  h()
], p.prototype, "radiusSensibility", void 0);
R.FollowCameraKeyboardMoveInput = p;
class O {
  constructor() {
    this.axisControlRadius = !0, this.axisControlHeight = !1, this.axisControlRotation = !1, this.wheelPrecision = 3, this.wheelDeltaPercentage = 0;
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e) {
    e = P.BackCompatCameraNoPreventDefault(arguments), this._wheel = (t) => {
      if (t.type !== x.POINTERWHEEL)
        return;
      const i = t.event;
      let s = 0;
      const n = Math.max(-1, Math.min(1, i.deltaY));
      this.wheelDeltaPercentage ? (+this.axisControlRadius + +this.axisControlHeight + +this.axisControlRotation && D.Warn("wheelDeltaPercentage only usable when mouse wheel controls ONE axis. Currently enabled: axisControlRadius: " + this.axisControlRadius + ", axisControlHeightOffset: " + this.axisControlHeight + ", axisControlRotationOffset: " + this.axisControlRotation), this.axisControlRadius ? s = n * 0.01 * this.wheelDeltaPercentage * this.camera.radius : this.axisControlHeight ? s = n * 0.01 * this.wheelDeltaPercentage * this.camera.heightOffset : this.axisControlRotation && (s = n * 0.01 * this.wheelDeltaPercentage * this.camera.rotationOffset)) : s = n * this.wheelPrecision, s && (this.axisControlRadius ? this.camera.radius += s : this.axisControlHeight ? this.camera.heightOffset -= s : this.axisControlRotation && (this.camera.rotationOffset -= s)), i.preventDefault && (e || i.preventDefault());
    }, this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver(this._wheel, x.POINTERWHEEL);
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this._observer && (this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer), this._observer = null, this._wheel = null);
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "ArcRotateCameraMouseWheelInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "mousewheel";
  }
}
r([
  h()
], O.prototype, "axisControlRadius", void 0);
r([
  h()
], O.prototype, "axisControlHeight", void 0);
r([
  h()
], O.prototype, "axisControlRotation", void 0);
r([
  h()
], O.prototype, "wheelPrecision", void 0);
r([
  h()
], O.prototype, "wheelDeltaPercentage", void 0);
R.FollowCameraMouseWheelInput = O;
class C extends q {
  constructor() {
    super(...arguments), this.angularSensibilityX = 1, this.angularSensibilityY = 1, this.pinchPrecision = 1e4, this.pinchDeltaPercentage = 0, this.axisXControlRadius = !1, this.axisXControlHeight = !1, this.axisXControlRotation = !0, this.axisYControlRadius = !1, this.axisYControlHeight = !0, this.axisYControlRotation = !1, this.axisPinchControlRadius = !0, this.axisPinchControlHeight = !1, this.axisPinchControlRotation = !1, this.warningEnable = !0, this._warningCounter = 0;
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FollowCameraPointersInput";
  }
  onTouch(e, t, i) {
    this._warning(), this.axisXControlRotation ? this.camera.rotationOffset += t / this.angularSensibilityX : this.axisYControlRotation && (this.camera.rotationOffset += i / this.angularSensibilityX), this.axisXControlHeight ? this.camera.heightOffset += t / this.angularSensibilityY : this.axisYControlHeight && (this.camera.heightOffset += i / this.angularSensibilityY), this.axisXControlRadius ? this.camera.radius -= t / this.angularSensibilityY : this.axisYControlRadius && (this.camera.radius -= i / this.angularSensibilityY);
  }
  onMultiTouch(e, t, i, s, n, l) {
    if (i === 0 && n === null || s === 0 && l === null)
      return;
    let c = (s - i) / (this.pinchPrecision * (this.angularSensibilityX + this.angularSensibilityY) / 2);
    this.pinchDeltaPercentage ? (c *= 0.01 * this.pinchDeltaPercentage, this.axisPinchControlRotation && (this.camera.rotationOffset += c * this.camera.rotationOffset), this.axisPinchControlHeight && (this.camera.heightOffset += c * this.camera.heightOffset), this.axisPinchControlRadius && (this.camera.radius -= c * this.camera.radius)) : (this.axisPinchControlRotation && (this.camera.rotationOffset += c), this.axisPinchControlHeight && (this.camera.heightOffset += c), this.axisPinchControlRadius && (this.camera.radius -= c));
  }
  _warning() {
    if (!this.warningEnable || this._warningCounter++ % 100 !== 0)
      return;
    const e = "It probably only makes sense to control ONE camera property with each pointer axis. Set 'warningEnable = false' if you are sure. Currently enabled: ";
    +this.axisXControlRotation + +this.axisXControlHeight + +this.axisXControlRadius <= 1 && D.Warn(e + "axisXControlRotation: " + this.axisXControlRotation + ", axisXControlHeight: " + this.axisXControlHeight + ", axisXControlRadius: " + this.axisXControlRadius), +this.axisYControlRotation + +this.axisYControlHeight + +this.axisYControlRadius <= 1 && D.Warn(e + "axisYControlRotation: " + this.axisYControlRotation + ", axisYControlHeight: " + this.axisYControlHeight + ", axisYControlRadius: " + this.axisYControlRadius), +this.axisPinchControlRotation + +this.axisPinchControlHeight + +this.axisPinchControlRadius <= 1 && D.Warn(e + "axisPinchControlRotation: " + this.axisPinchControlRotation + ", axisPinchControlHeight: " + this.axisPinchControlHeight + ", axisPinchControlRadius: " + this.axisPinchControlRadius);
  }
}
r([
  h()
], C.prototype, "angularSensibilityX", void 0);
r([
  h()
], C.prototype, "angularSensibilityY", void 0);
r([
  h()
], C.prototype, "pinchPrecision", void 0);
r([
  h()
], C.prototype, "pinchDeltaPercentage", void 0);
r([
  h()
], C.prototype, "axisXControlRadius", void 0);
r([
  h()
], C.prototype, "axisXControlHeight", void 0);
r([
  h()
], C.prototype, "axisXControlRotation", void 0);
r([
  h()
], C.prototype, "axisYControlRadius", void 0);
r([
  h()
], C.prototype, "axisYControlHeight", void 0);
r([
  h()
], C.prototype, "axisYControlRotation", void 0);
r([
  h()
], C.prototype, "axisPinchControlRadius", void 0);
r([
  h()
], C.prototype, "axisPinchControlHeight", void 0);
r([
  h()
], C.prototype, "axisPinchControlRotation", void 0);
R.FollowCameraPointersInput = C;
var f;
(function(a) {
  a[a.X = 0] = "X", a[a.Y = 1] = "Y", a[a.Z = 2] = "Z";
})(f || (f = {}));
class o {
  static _GetDefaultOptions() {
    return {
      puckSize: 40,
      containerSize: 60,
      color: "cyan",
      puckImage: void 0,
      containerImage: void 0,
      position: void 0,
      alwaysVisible: !1,
      limitToContainer: !1
    };
  }
  /**
   * Creates a new virtual joystick
   * @param leftJoystick defines that the joystick is for left hand (false by default)
   * @param customizations Defines the options we want to customize the VirtualJoystick
   */
  constructor(e, t) {
    this._released = !1;
    const i = {
      ...o._GetDefaultOptions(),
      ...t
    };
    if (e ? this._leftJoystick = !0 : this._leftJoystick = !1, o._GlobalJoystickIndex++, this._axisTargetedByLeftAndRight = f.X, this._axisTargetedByUpAndDown = f.Y, this.reverseLeftRight = !1, this.reverseUpDown = !1, this._touches = new Ae(), this.deltaPosition = d.Zero(), this._joystickSensibility = 25, this._inversedSensibility = 1 / (this._joystickSensibility / 1e3), this._onResize = () => {
      o._VJCanvasWidth = window.innerWidth, o._VJCanvasHeight = window.innerHeight, o.Canvas && (o.Canvas.width = o._VJCanvasWidth, o.Canvas.height = o._VJCanvasHeight), o._HalfWidth = o._VJCanvasWidth / 2;
    }, !o.Canvas) {
      window.addEventListener("resize", this._onResize, !1), o.Canvas = document.createElement("canvas"), o._VJCanvasWidth = window.innerWidth, o._VJCanvasHeight = window.innerHeight, o.Canvas.width = window.innerWidth, o.Canvas.height = window.innerHeight, o.Canvas.style.width = "100%", o.Canvas.style.height = "100%", o.Canvas.style.position = "absolute", o.Canvas.style.backgroundColor = "transparent", o.Canvas.style.top = "0px", o.Canvas.style.left = "0px", o.Canvas.style.zIndex = "5", o.Canvas.style.touchAction = "none", o.Canvas.setAttribute("touch-action", "none");
      const s = o.Canvas.getContext("2d");
      if (!s)
        throw new Error("Unable to create canvas for virtual joystick");
      o._VJCanvasContext = s, o._VJCanvasContext.strokeStyle = "#ffffff", o._VJCanvasContext.lineWidth = 2, document.body.appendChild(o.Canvas);
    }
    o._HalfWidth = o.Canvas.width / 2, this.pressed = !1, this.limitToContainer = i.limitToContainer, this._joystickColor = i.color, this.containerSize = i.containerSize, this.puckSize = i.puckSize, i.position && this.setPosition(i.position.x, i.position.y), i.puckImage && this.setPuckImage(i.puckImage), i.containerImage && this.setContainerImage(i.containerImage), i.alwaysVisible && o._AlwaysVisibleSticks++, this.alwaysVisible = i.alwaysVisible, this._joystickPointerId = -1, this._joystickPointerPos = new v(0, 0), this._joystickPreviousPointerPos = new v(0, 0), this._joystickPointerStartPos = new v(0, 0), this._deltaJoystickVector = new v(0, 0), this._onPointerDownHandlerRef = (s) => {
      this._onPointerDown(s);
    }, this._onPointerMoveHandlerRef = (s) => {
      this._onPointerMove(s);
    }, this._onPointerUpHandlerRef = (s) => {
      this._onPointerUp(s);
    }, o.Canvas.addEventListener("pointerdown", this._onPointerDownHandlerRef, !1), o.Canvas.addEventListener("pointermove", this._onPointerMoveHandlerRef, !1), o.Canvas.addEventListener("pointerup", this._onPointerUpHandlerRef, !1), o.Canvas.addEventListener("pointerout", this._onPointerUpHandlerRef, !1), o.Canvas.addEventListener("contextmenu", (s) => {
      s.preventDefault();
    }, !1), requestAnimationFrame(() => {
      this._drawVirtualJoystick();
    });
  }
  /**
   * Defines joystick sensibility (ie. the ratio between a physical move and virtual joystick position change)
   * @param newJoystickSensibility defines the new sensibility
   */
  setJoystickSensibility(e) {
    this._joystickSensibility = e, this._inversedSensibility = 1 / (this._joystickSensibility / 1e3);
  }
  _onPointerDown(e) {
    let t;
    e.preventDefault(), this._leftJoystick === !0 ? t = e.clientX < o._HalfWidth : t = e.clientX > o._HalfWidth, t && this._joystickPointerId < 0 ? (this._joystickPointerId = e.pointerId, this._joystickPosition ? (this._joystickPointerStartPos = this._joystickPosition.clone(), this._joystickPointerPos = this._joystickPosition.clone(), this._joystickPreviousPointerPos = this._joystickPosition.clone(), this._onPointerMove(e)) : (this._joystickPointerStartPos.x = e.clientX, this._joystickPointerStartPos.y = e.clientY, this._joystickPointerPos = this._joystickPointerStartPos.clone(), this._joystickPreviousPointerPos = this._joystickPointerStartPos.clone()), this._deltaJoystickVector.x = 0, this._deltaJoystickVector.y = 0, this.pressed = !0, this._touches.add(e.pointerId.toString(), e)) : o._GlobalJoystickIndex < 2 && this._action && (this._action(), this._touches.add(e.pointerId.toString(), { x: e.clientX, y: e.clientY, prevX: e.clientX, prevY: e.clientY }));
  }
  _onPointerMove(e) {
    if (this._joystickPointerId == e.pointerId) {
      if (this.limitToContainer) {
        const l = new v(e.clientX - this._joystickPointerStartPos.x, e.clientY - this._joystickPointerStartPos.y), c = l.length();
        c > this.containerSize && l.scaleInPlace(this.containerSize / c), this._joystickPointerPos.x = this._joystickPointerStartPos.x + l.x, this._joystickPointerPos.y = this._joystickPointerStartPos.y + l.y;
      } else
        this._joystickPointerPos.x = e.clientX, this._joystickPointerPos.y = e.clientY;
      this._deltaJoystickVector = this._joystickPointerPos.clone(), this._deltaJoystickVector = this._deltaJoystickVector.subtract(this._joystickPointerStartPos), 0 < o._AlwaysVisibleSticks && (this._leftJoystick ? this._joystickPointerPos.x = Math.min(o._HalfWidth, this._joystickPointerPos.x) : this._joystickPointerPos.x = Math.max(o._HalfWidth, this._joystickPointerPos.x));
      const i = (this.reverseLeftRight ? -1 : 1) * this._deltaJoystickVector.x / this._inversedSensibility;
      switch (this._axisTargetedByLeftAndRight) {
        case f.X:
          this.deltaPosition.x = Math.min(1, Math.max(-1, i));
          break;
        case f.Y:
          this.deltaPosition.y = Math.min(1, Math.max(-1, i));
          break;
        case f.Z:
          this.deltaPosition.z = Math.min(1, Math.max(-1, i));
          break;
      }
      const n = (this.reverseUpDown ? 1 : -1) * this._deltaJoystickVector.y / this._inversedSensibility;
      switch (this._axisTargetedByUpAndDown) {
        case f.X:
          this.deltaPosition.x = Math.min(1, Math.max(-1, n));
          break;
        case f.Y:
          this.deltaPosition.y = Math.min(1, Math.max(-1, n));
          break;
        case f.Z:
          this.deltaPosition.z = Math.min(1, Math.max(-1, n));
          break;
      }
    } else {
      const t = this._touches.get(e.pointerId.toString());
      t && (t.x = e.clientX, t.y = e.clientY);
    }
  }
  _onPointerUp(e) {
    if (this._joystickPointerId == e.pointerId)
      this._clearPreviousDraw(), this._joystickPointerId = -1, this.pressed = !1;
    else {
      const t = this._touches.get(e.pointerId.toString());
      t && o._VJCanvasContext.clearRect(t.prevX - 44, t.prevY - 44, 88, 88);
    }
    this._deltaJoystickVector.x = 0, this._deltaJoystickVector.y = 0, this._touches.remove(e.pointerId.toString());
  }
  /**
   * Change the color of the virtual joystick
   * @param newColor a string that must be a CSS color value (like "red") or the hexa value (like "#FF0000")
   */
  setJoystickColor(e) {
    this._joystickColor = e;
  }
  /**
   * Size of the joystick's container
   */
  set containerSize(e) {
    this._joystickContainerSize = e, this._clearContainerSize = ~~(this._joystickContainerSize * 2.1), this._clearContainerSizeOffset = ~~(this._clearContainerSize / 2);
  }
  get containerSize() {
    return this._joystickContainerSize;
  }
  /**
   * Size of the joystick's puck
   */
  set puckSize(e) {
    this._joystickPuckSize = e, this._clearPuckSize = ~~(this._joystickPuckSize * 2.1), this._clearPuckSizeOffset = ~~(this._clearPuckSize / 2);
  }
  get puckSize() {
    return this._joystickPuckSize;
  }
  /**
   * Clears the set position of the joystick
   */
  clearPosition() {
    this.alwaysVisible = !1, this._joystickPosition = null;
  }
  /**
   * Defines whether or not the joystick container is always visible
   */
  set alwaysVisible(e) {
    this._alwaysVisible !== e && (e && this._joystickPosition ? (o._AlwaysVisibleSticks++, this._alwaysVisible = !0) : (o._AlwaysVisibleSticks--, this._alwaysVisible = !1));
  }
  get alwaysVisible() {
    return this._alwaysVisible;
  }
  /**
   * Sets the constant position of the Joystick container
   * @param x X axis coordinate
   * @param y Y axis coordinate
   */
  setPosition(e, t) {
    this._joystickPointerStartPos && this._clearPreviousDraw(), this._joystickPosition = new v(e, t);
  }
  /**
   * Defines a callback to call when the joystick is touched
   * @param action defines the callback
   */
  setActionOnTouch(e) {
    this._action = e;
  }
  /**
   * Defines which axis you'd like to control for left & right
   * @param axis defines the axis to use
   */
  setAxisForLeftRight(e) {
    switch (e) {
      case f.X:
      case f.Y:
      case f.Z:
        this._axisTargetedByLeftAndRight = e;
        break;
      default:
        this._axisTargetedByLeftAndRight = f.X;
        break;
    }
  }
  /**
   * Defines which axis you'd like to control for up & down
   * @param axis defines the axis to use
   */
  setAxisForUpDown(e) {
    switch (e) {
      case f.X:
      case f.Y:
      case f.Z:
        this._axisTargetedByUpAndDown = e;
        break;
      default:
        this._axisTargetedByUpAndDown = f.Y;
        break;
    }
  }
  /**
   * Clears the canvas from the previous puck / container draw
   */
  _clearPreviousDraw() {
    const e = this._joystickPosition || this._joystickPointerStartPos;
    o._VJCanvasContext.clearRect(e.x - this._clearContainerSizeOffset, e.y - this._clearContainerSizeOffset, this._clearContainerSize, this._clearContainerSize), o._VJCanvasContext.clearRect(this._joystickPreviousPointerPos.x - this._clearPuckSizeOffset - 1, this._joystickPreviousPointerPos.y - this._clearPuckSizeOffset - 1, this._clearPuckSize + 2, this._clearPuckSize + 2);
  }
  /**
   * Loads `urlPath` to be used for the container's image
   * @param urlPath defines the urlPath of an image to use
   */
  setContainerImage(e) {
    const t = new Image();
    t.src = e, t.onload = () => this._containerImage = t;
  }
  /**
   * Loads `urlPath` to be used for the puck's image
   * @param urlPath defines the urlPath of an image to use
   */
  setPuckImage(e) {
    const t = new Image();
    t.src = e, t.onload = () => this._puckImage = t;
  }
  /**
   * Draws the Virtual Joystick's container
   */
  _drawContainer() {
    const e = this._joystickPosition || this._joystickPointerStartPos;
    this._clearPreviousDraw(), this._containerImage ? o._VJCanvasContext.drawImage(this._containerImage, e.x - this.containerSize, e.y - this.containerSize, this.containerSize * 2, this.containerSize * 2) : (o._VJCanvasContext.beginPath(), o._VJCanvasContext.strokeStyle = this._joystickColor, o._VJCanvasContext.lineWidth = 2, o._VJCanvasContext.arc(e.x, e.y, this.containerSize, 0, Math.PI * 2, !0), o._VJCanvasContext.stroke(), o._VJCanvasContext.closePath(), o._VJCanvasContext.beginPath(), o._VJCanvasContext.lineWidth = 6, o._VJCanvasContext.strokeStyle = this._joystickColor, o._VJCanvasContext.arc(e.x, e.y, this.puckSize, 0, Math.PI * 2, !0), o._VJCanvasContext.stroke(), o._VJCanvasContext.closePath());
  }
  /**
   * Draws the Virtual Joystick's puck
   */
  _drawPuck() {
    this._puckImage ? o._VJCanvasContext.drawImage(this._puckImage, this._joystickPointerPos.x - this.puckSize, this._joystickPointerPos.y - this.puckSize, this.puckSize * 2, this.puckSize * 2) : (o._VJCanvasContext.beginPath(), o._VJCanvasContext.strokeStyle = this._joystickColor, o._VJCanvasContext.lineWidth = 2, o._VJCanvasContext.arc(this._joystickPointerPos.x, this._joystickPointerPos.y, this.puckSize, 0, Math.PI * 2, !0), o._VJCanvasContext.stroke(), o._VJCanvasContext.closePath());
  }
  _drawVirtualJoystick() {
    this._released || (this.alwaysVisible && this._drawContainer(), this.pressed && this._touches.forEach((e, t) => {
      t.pointerId === this._joystickPointerId ? (this.alwaysVisible || this._drawContainer(), this._drawPuck(), this._joystickPreviousPointerPos = this._joystickPointerPos.clone()) : (o._VJCanvasContext.clearRect(t.prevX - 44, t.prevY - 44, 88, 88), o._VJCanvasContext.beginPath(), o._VJCanvasContext.fillStyle = "white", o._VJCanvasContext.beginPath(), o._VJCanvasContext.strokeStyle = "red", o._VJCanvasContext.lineWidth = 6, o._VJCanvasContext.arc(t.x, t.y, 40, 0, Math.PI * 2, !0), o._VJCanvasContext.stroke(), o._VJCanvasContext.closePath(), t.prevX = t.x, t.prevY = t.y);
    }), requestAnimationFrame(() => {
      this._drawVirtualJoystick();
    }));
  }
  /**
   * Release internal HTML canvas
   */
  releaseCanvas() {
    o.Canvas && (o.Canvas.removeEventListener("pointerdown", this._onPointerDownHandlerRef), o.Canvas.removeEventListener("pointermove", this._onPointerMoveHandlerRef), o.Canvas.removeEventListener("pointerup", this._onPointerUpHandlerRef), o.Canvas.removeEventListener("pointerout", this._onPointerUpHandlerRef), window.removeEventListener("resize", this._onResize), document.body.removeChild(o.Canvas), o.Canvas = null), this._released = !0;
  }
}
o._GlobalJoystickIndex = 0;
o._AlwaysVisibleSticks = 0;
K.prototype.addVirtualJoystick = function() {
  return this.add(new Z()), this;
};
class Z {
  /**
   * Gets the left stick of the virtual joystick.
   * @returns The virtual Joystick
   */
  getLeftJoystick() {
    return this._leftjoystick;
  }
  /**
   * Gets the right stick of the virtual joystick.
   * @returns The virtual Joystick
   */
  getRightJoystick() {
    return this._rightjoystick;
  }
  /**
   * Update the current camera state depending on the inputs that have been used this frame.
   * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
   */
  checkInputs() {
    if (this._leftjoystick) {
      const e = this.camera, t = e._computeLocalCameraSpeed() * 50, i = $.RotationYawPitchRoll(e.rotation.y, e.rotation.x, 0), s = d.TransformCoordinates(new d(this._leftjoystick.deltaPosition.x * t, this._leftjoystick.deltaPosition.y * t, this._leftjoystick.deltaPosition.z * t), i);
      e.cameraDirection = e.cameraDirection.add(s), e.cameraRotation = e.cameraRotation.addVector3(this._rightjoystick.deltaPosition), this._leftjoystick.pressed || (this._leftjoystick.deltaPosition = this._leftjoystick.deltaPosition.scale(0.9)), this._rightjoystick.pressed || (this._rightjoystick.deltaPosition = this._rightjoystick.deltaPosition.scale(0.9));
    }
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   */
  attachControl() {
    this._leftjoystick = new o(!0), this._leftjoystick.setAxisForUpDown(f.Z), this._leftjoystick.setAxisForLeftRight(f.X), this._leftjoystick.setJoystickSensibility(0.15), this._rightjoystick = new o(!1), this._rightjoystick.setAxisForUpDown(f.X), this._rightjoystick.setAxisForLeftRight(f.Y), this._rightjoystick.reverseUpDown = !0, this._rightjoystick.setJoystickSensibility(0.05), this._rightjoystick.setJoystickColor("yellow");
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this._leftjoystick.releaseCanvas(), this._rightjoystick.releaseCanvas();
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FreeCameraVirtualJoystickInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "virtualJoystick";
  }
}
R.FreeCameraVirtualJoystickInput = Z;
class oe extends U {
  /**
   * Instantiates a new FlyCameraInputsManager.
   * @param camera Defines the camera the inputs belong to.
   */
  constructor(e) {
    super(e);
  }
  /**
   * Add keyboard input support to the input manager.
   * @returns the new FlyCameraKeyboardMoveInput().
   */
  addKeyboard() {
    return this.add(new k()), this;
  }
  /**
   * Add mouse input support to the input manager.
   * @returns the new FlyCameraMouseInput().
   */
  addMouse() {
    return this.add(new A()), this;
  }
}
class F extends E {
  /**
   * Gets the input sensibility for mouse input.
   * Higher values reduce sensitivity.
   */
  get angularSensibility() {
    const e = this.inputs.attached.mouse;
    return e ? e.angularSensibility : 0;
  }
  /**
   * Sets the input sensibility for a mouse input.
   * Higher values reduce sensitivity.
   */
  set angularSensibility(e) {
    const t = this.inputs.attached.mouse;
    t && (t.angularSensibility = e);
  }
  /**
   * Get the keys for camera movement forward.
   */
  get keysForward() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysForward : [];
  }
  /**
   * Set the keys for camera movement forward.
   */
  set keysForward(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysForward = e);
  }
  /**
   * Get the keys for camera movement backward.
   */
  get keysBackward() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysBackward : [];
  }
  set keysBackward(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysBackward = e);
  }
  /**
   * Get the keys for camera movement up.
   */
  get keysUp() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysUp : [];
  }
  /**
   * Set the keys for camera movement up.
   */
  set keysUp(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysUp = e);
  }
  /**
   * Get the keys for camera movement down.
   */
  get keysDown() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysDown : [];
  }
  /**
   * Set the keys for camera movement down.
   */
  set keysDown(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysDown = e);
  }
  /**
   * Get the keys for camera movement left.
   */
  get keysLeft() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysLeft : [];
  }
  /**
   * Set the keys for camera movement left.
   */
  set keysLeft(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysLeft = e);
  }
  /**
   * Set the keys for camera movement right.
   */
  get keysRight() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysRight : [];
  }
  /**
   * Set the keys for camera movement right.
   */
  set keysRight(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysRight = e);
  }
  /**
   * Instantiates a FlyCamera.
   * This is a flying camera, designed for 3D movement and rotation in all directions,
   * such as in a 3D Space Shooter or a Flight Simulator.
   * @param name Define the name of the camera in the scene.
   * @param position Define the starting position of the camera in the scene.
   * @param scene Define the scene the camera belongs to.
   * @param setActiveOnSceneIfNoneActive Defines whether the camera should be marked as active, if no other camera has been defined as active.
   */
  constructor(e, t, i, s = !0) {
    super(e, t, i, s), this.ellipsoid = new d(1, 1, 1), this.ellipsoidOffset = new d(0, 0, 0), this.checkCollisions = !1, this.applyGravity = !1, this.cameraDirection = d.Zero(), this._trackRoll = 0, this.rollCorrect = 100, this.bankedTurn = !1, this.bankedTurnLimit = Math.PI / 2, this.bankedTurnMultiplier = 1, this._needMoveForGravity = !1, this._oldPosition = d.Zero(), this._diffPosition = d.Zero(), this._newPosition = d.Zero(), this._collisionMask = -1, this._onCollisionPositionChange = (n, l, c = null) => {
      ((y) => {
        this._newPosition.copyFrom(y), this._newPosition.subtractToRef(this._oldPosition, this._diffPosition), this._diffPosition.length() > He.CollisionsEpsilon && (this.position.addInPlace(this._diffPosition), this.onCollide && c && this.onCollide(c));
      })(l);
    }, this.inputs = new oe(this), this.inputs.addKeyboard().addMouse();
  }
  /**
   * Attached controls to the current camera.
   * @param ignored defines an ignored parameter kept for backward compatibility.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e, t) {
    t = P.BackCompatCameraNoPreventDefault(arguments), this.inputs.attachElement(t);
  }
  /**
   * Detach a control from the HTML DOM element.
   * The camera will stop reacting to that input.
   */
  detachControl() {
    this.inputs.detachElement(), this.cameraDirection = new d(0, 0, 0);
  }
  /**
   * Get the mask that the camera ignores in collision events.
   */
  get collisionMask() {
    return this._collisionMask;
  }
  /**
   * Set the mask that the camera ignores in collision events.
   */
  set collisionMask(e) {
    this._collisionMask = isNaN(e) ? -1 : e;
  }
  /**
   * @internal
   */
  _collideWithWorld(e) {
    let t;
    this.parent ? t = d.TransformCoordinates(this.position, this.parent.getWorldMatrix()) : t = this.position, t.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition), this._oldPosition.addInPlace(this.ellipsoidOffset);
    const i = this.getScene().collisionCoordinator;
    this._collider || (this._collider = i.createCollider()), this._collider._radius = this.ellipsoid, this._collider.collisionMask = this._collisionMask;
    let s = e;
    this.applyGravity && (s = e.add(this.getScene().gravity)), i.getNewPosition(this._oldPosition, s, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
  }
  /** @internal */
  _checkInputs() {
    this._localDirection || (this._localDirection = d.Zero(), this._transformedDirection = d.Zero()), this.inputs.checkInputs(), super._checkInputs();
  }
  /**
   * Enable movement without a user input. This allows gravity to always be applied.
   */
  set needMoveForGravity(e) {
    this._needMoveForGravity = e;
  }
  /**
   * When true, gravity is applied whether there is user input or not.
   */
  get needMoveForGravity() {
    return this._needMoveForGravity;
  }
  /** @internal */
  _decideIfNeedsToMove() {
    return this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
  }
  /** @internal */
  _updatePosition() {
    this.checkCollisions && this.getScene().collisionsEnabled ? this._collideWithWorld(this.cameraDirection) : super._updatePosition();
  }
  /**
   * Restore the Roll to its target value at the rate specified.
   * @param rate - Higher means slower restoring.
   * @internal
   */
  restoreRoll(e) {
    const t = this._trackRoll, i = this.rotation.z, s = t - i, n = 1e-3;
    Math.abs(s) >= n && (this.rotation.z += s / e, Math.abs(t - this.rotation.z) <= n && (this.rotation.z = t));
  }
  /**
   * Destroy the camera and release the current resources held by it.
   */
  dispose() {
    this.inputs.clear(), super.dispose();
  }
  /**
   * Get the current object class name.
   * @returns the class name.
   */
  getClassName() {
    return "FlyCamera";
  }
}
r([
  J()
], F.prototype, "ellipsoid", void 0);
r([
  J()
], F.prototype, "ellipsoidOffset", void 0);
r([
  h()
], F.prototype, "checkCollisions", void 0);
r([
  h()
], F.prototype, "applyGravity", void 0);
class ae extends U {
  /**
   * Instantiates a new FollowCameraInputsManager.
   * @param camera Defines the camera the inputs belong to
   */
  constructor(e) {
    super(e);
  }
  /**
   * Add keyboard input support to the input manager.
   * @returns the current input manager
   */
  addKeyboard() {
    return this.add(new p()), this;
  }
  /**
   * Add mouse wheel input support to the input manager.
   * @returns the current input manager
   */
  addMouseWheel() {
    return this.add(new O()), this;
  }
  /**
   * Add pointers input support to the input manager.
   * @returns the current input manager
   */
  addPointers() {
    return this.add(new C()), this;
  }
  /**
   * Add orientation input support to the input manager.
   * @returns the current input manager
   */
  addVRDeviceOrientation() {
    return D.Warn("DeviceOrientation support not yet implemented for FollowCamera."), this;
  }
}
_.AddNodeConstructor("FollowCamera", (a, e) => () => new g(a, d.Zero(), e));
_.AddNodeConstructor("ArcFollowCamera", (a, e) => () => new re(a, 0, 0, 1, null, e));
class g extends E {
  /**
   * Instantiates the follow camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
   * @param name Define the name of the camera in the scene
   * @param position Define the position of the camera
   * @param scene Define the scene the camera belong to
   * @param lockedTarget Define the target of the camera
   */
  constructor(e, t, i, s = null) {
    super(e, t, i), this.radius = 12, this.lowerRadiusLimit = null, this.upperRadiusLimit = null, this.rotationOffset = 0, this.lowerRotationOffsetLimit = null, this.upperRotationOffsetLimit = null, this.heightOffset = 4, this.lowerHeightOffsetLimit = null, this.upperHeightOffsetLimit = null, this.cameraAcceleration = 0.05, this.maxCameraSpeed = 20, this.lockedTarget = s, this.inputs = new ae(this), this.inputs.addKeyboard().addMouseWheel().addPointers();
  }
  _follow(e) {
    if (!e)
      return;
    const t = De.Matrix[0];
    e.absoluteRotationQuaternion.toRotationMatrix(t);
    const i = Math.atan2(t.m[8], t.m[10]), s = P.ToRadians(this.rotationOffset) + i, n = e.getAbsolutePosition(), l = n.x + Math.sin(s) * this.radius, c = n.z + Math.cos(s) * this.radius, u = l - this.position.x, y = n.y + this.heightOffset - this.position.y, Y = c - this.position.z;
    let S = u * this.cameraAcceleration * 2, b = y * this.cameraAcceleration, w = Y * this.cameraAcceleration * 2;
    (S > this.maxCameraSpeed || S < -this.maxCameraSpeed) && (S = S < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed), (b > this.maxCameraSpeed || b < -this.maxCameraSpeed) && (b = b < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed), (w > this.maxCameraSpeed || w < -this.maxCameraSpeed) && (w = w < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed), this.position = new d(this.position.x + S, this.position.y + b, this.position.z + w), this.setTarget(n);
  }
  /**
   * Attached controls to the current camera.
   * @param ignored defines an ignored parameter kept for backward compatibility.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e, t) {
    t = P.BackCompatCameraNoPreventDefault(arguments), this.inputs.attachElement(t), this._reset = () => {
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
    this.inputs.checkInputs(), this._checkLimits(), super._checkInputs(), this.lockedTarget && this._follow(this.lockedTarget);
  }
  _checkLimits() {
    this.lowerRadiusLimit !== null && this.radius < this.lowerRadiusLimit && (this.radius = this.lowerRadiusLimit), this.upperRadiusLimit !== null && this.radius > this.upperRadiusLimit && (this.radius = this.upperRadiusLimit), this.lowerHeightOffsetLimit !== null && this.heightOffset < this.lowerHeightOffsetLimit && (this.heightOffset = this.lowerHeightOffsetLimit), this.upperHeightOffsetLimit !== null && this.heightOffset > this.upperHeightOffsetLimit && (this.heightOffset = this.upperHeightOffsetLimit), this.lowerRotationOffsetLimit !== null && this.rotationOffset < this.lowerRotationOffsetLimit && (this.rotationOffset = this.lowerRotationOffsetLimit), this.upperRotationOffsetLimit !== null && this.rotationOffset > this.upperRotationOffsetLimit && (this.rotationOffset = this.upperRotationOffsetLimit);
  }
  /**
   * Gets the camera class name.
   * @returns the class name
   */
  getClassName() {
    return "FollowCamera";
  }
}
r([
  h()
], g.prototype, "radius", void 0);
r([
  h()
], g.prototype, "lowerRadiusLimit", void 0);
r([
  h()
], g.prototype, "upperRadiusLimit", void 0);
r([
  h()
], g.prototype, "rotationOffset", void 0);
r([
  h()
], g.prototype, "lowerRotationOffsetLimit", void 0);
r([
  h()
], g.prototype, "upperRotationOffsetLimit", void 0);
r([
  h()
], g.prototype, "heightOffset", void 0);
r([
  h()
], g.prototype, "lowerHeightOffsetLimit", void 0);
r([
  h()
], g.prototype, "upperHeightOffsetLimit", void 0);
r([
  h()
], g.prototype, "cameraAcceleration", void 0);
r([
  h()
], g.prototype, "maxCameraSpeed", void 0);
r([
  Me("lockedTargetId")
], g.prototype, "lockedTarget", void 0);
class re extends E {
  /**
   * Instantiates a new ArcFollowCamera
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
   * @param name Define the name of the camera
   * @param alpha Define the rotation angle of the camera around the longitudinal axis
   * @param beta Define the rotation angle of the camera around the elevation axis
   * @param radius Define the radius of the camera from its target point
   * @param target Define the target of the camera
   * @param scene Define the scene the camera belongs to
   */
  constructor(e, t, i, s, n, l) {
    super(e, d.Zero(), l), this.alpha = t, this.beta = i, this.radius = s, this._cartesianCoordinates = d.Zero(), this.setMeshTarget(n);
  }
  /**
   * Sets the mesh to follow with this camera.
   * @param target the target to follow
   */
  setMeshTarget(e) {
    this._meshTarget = e, this._follow();
  }
  _follow() {
    if (!this._meshTarget)
      return;
    this._cartesianCoordinates.x = this.radius * Math.cos(this.alpha) * Math.cos(this.beta), this._cartesianCoordinates.y = this.radius * Math.sin(this.beta), this._cartesianCoordinates.z = this.radius * Math.sin(this.alpha) * Math.cos(this.beta);
    const e = this._meshTarget.getAbsolutePosition();
    this.position = e.add(this._cartesianCoordinates), this.setTarget(e);
  }
  /** @internal */
  _checkInputs() {
    super._checkInputs(), this._follow();
  }
  /**
   * Returns the class name of the object.
   * It is mostly used internally for serialization purposes.
   * @returns the class name
   */
  getClassName() {
    return "ArcFollowCamera";
  }
}
_.AddNodeConstructor("GamepadCamera", (a, e) => () => new B(a, d.Zero(), e));
class B extends M {
  /**
   * Instantiates a new Gamepad Camera
   * This represents a FPS type of camera. This is only here for back compat purpose.
   * Please use the UniversalCamera instead as both are identical.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#universal-camera
   * @param name Define the name of the camera in the scene
   * @param position Define the start position of the camera in the scene
   * @param scene Define the scene the camera belongs to
   */
  constructor(e, t, i) {
    super(e, t, i);
  }
  /**
   * Gets the current object class name.
   * @returns the class name
   */
  getClassName() {
    return "GamepadCamera";
  }
}
const ze = "anaglyphPixelShader", Be = `varying vec2 vUV;uniform sampler2D textureSampler;uniform sampler2D leftSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec4 leftFrag=texture2D(leftSampler,vUV);leftFrag=vec4(1.0,leftFrag.g,leftFrag.b,1.0);vec4 rightFrag=texture2D(textureSampler,vUV);rightFrag=vec4(rightFrag.r,1.0,1.0,1.0);gl_FragColor=vec4(rightFrag.rgb*leftFrag.rgb,1.0);}`;
ee.ShadersStore[ze] = Be;
class ne extends X {
  /**
   * Gets a string identifying the name of the class
   * @returns "AnaglyphPostProcess" string
   */
  getClassName() {
    return "AnaglyphPostProcess";
  }
  /**
   * Creates a new AnaglyphPostProcess
   * @param name defines postprocess name
   * @param options defines creation options or target ratio scale
   * @param rigCameras defines cameras using this postprocess
   * @param samplingMode defines required sampling mode (BABYLON.Texture.NEAREST_SAMPLINGMODE by default)
   * @param engine defines hosting engine
   * @param reusable defines if the postprocess will be reused multiple times per frame
   */
  constructor(e, t, i, s, n, l) {
    super(e, "anaglyph", null, ["leftSampler"], t, i[1], s, n, l), this._passedProcess = i[0]._rigPostProcess, this.onApplyObservable.add((c) => {
      c.setTextureFromPostProcess("leftSampler", this._passedProcess);
    });
  }
}
Ee("BABYLON.AnaglyphPostProcess", ne);
function T(a) {
  a._rigCameras[0]._rigPostProcess = new se(a.name + "_passthru", 1, a._rigCameras[0]), a._rigCameras[1]._rigPostProcess = new ne(a.name + "_anaglyph", 1, a._rigCameras);
}
_.AddNodeConstructor("AnaglyphArcRotateCamera", (a, e, t) => () => new he(a, 0, 0, 1, d.Zero(), t.interaxial_distance, e));
class he extends z {
  /**
   * Creates a new AnaglyphArcRotateCamera
   * @param name defines camera name
   * @param alpha defines alpha angle (in radians)
   * @param beta defines beta angle (in radians)
   * @param radius defines radius
   * @param target defines camera target
   * @param interaxialDistance defines distance between each color axis
   * @param scene defines the hosting scene
   */
  constructor(e, t, i, s, n, l, c) {
    super(e, t, i, s, n, c), this._setRigMode = () => T(this), this.interaxialDistance = l, this.setCameraRigMode(m.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: l });
  }
  /**
   * Gets camera class name
   * @returns AnaglyphArcRotateCamera
   */
  getClassName() {
    return "AnaglyphArcRotateCamera";
  }
}
_.AddNodeConstructor("AnaglyphFreeCamera", (a, e, t) => () => new le(a, d.Zero(), t.interaxial_distance, e));
class le extends N {
  /**
   * Creates a new AnaglyphFreeCamera
   * @param name defines camera name
   * @param position defines initial position
   * @param interaxialDistance defines distance between each color axis
   * @param scene defines the hosting scene
   */
  constructor(e, t, i, s) {
    super(e, t, s), this._setRigMode = () => T(this), this.interaxialDistance = i, this.setCameraRigMode(m.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: i });
  }
  /**
   * Gets camera class name
   * @returns AnaglyphFreeCamera
   */
  getClassName() {
    return "AnaglyphFreeCamera";
  }
}
_.AddNodeConstructor("AnaglyphGamepadCamera", (a, e, t) => () => new ce(a, d.Zero(), t.interaxial_distance, e));
class ce extends B {
  /**
   * Creates a new AnaglyphGamepadCamera
   * @param name defines camera name
   * @param position defines initial position
   * @param interaxialDistance defines distance between each color axis
   * @param scene defines the hosting scene
   */
  constructor(e, t, i, s) {
    super(e, t, s), this._setRigMode = () => T(this), this.interaxialDistance = i, this.setCameraRigMode(m.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: i });
  }
  /**
   * Gets camera class name
   * @returns AnaglyphGamepadCamera
   */
  getClassName() {
    return "AnaglyphGamepadCamera";
  }
}
_.AddNodeConstructor("AnaglyphUniversalCamera", (a, e, t) => () => new de(a, d.Zero(), t.interaxial_distance, e));
class de extends M {
  /**
   * Creates a new AnaglyphUniversalCamera
   * @param name defines camera name
   * @param position defines initial position
   * @param interaxialDistance defines distance between each color axis
   * @param scene defines the hosting scene
   */
  constructor(e, t, i, s) {
    super(e, t, s), this._setRigMode = () => T(this), this.interaxialDistance = i, this.setCameraRigMode(m.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: i });
  }
  /**
   * Gets camera class name
   * @returns AnaglyphUniversalCamera
   */
  getClassName() {
    return "AnaglyphUniversalCamera";
  }
}
const Ye = "stereoscopicInterlacePixelShader", Ue = `const vec3 TWO=vec3(2.0,2.0,2.0);varying vec2 vUV;uniform sampler2D camASampler;uniform sampler2D textureSampler;uniform vec2 stepSize;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{bool useCamA;bool useCamB;vec2 texCoord1;vec2 texCoord2;vec3 frag1;vec3 frag2;
#ifdef IS_STEREOSCOPIC_HORIZ
useCamB=vUV.x>0.5;useCamA=!useCamB;texCoord1=vec2(useCamB ? (vUV.x-0.5)*2.0 : vUV.x*2.0,vUV.y);texCoord2=vec2(texCoord1.x+stepSize.x,vUV.y);
#else
#ifdef IS_STEREOSCOPIC_INTERLACED
float rowNum=floor(vUV.y/stepSize.y);useCamA=mod(rowNum,2.0)==1.0;useCamB=mod(rowNum,2.0)==0.0;texCoord1=vec2(vUV.x,vUV.y);texCoord2=vec2(vUV.x,vUV.y);
#else
useCamB=vUV.y>0.5;useCamA=!useCamB;texCoord1=vec2(vUV.x,useCamB ? (vUV.y-0.5)*2.0 : vUV.y*2.0);texCoord2=vec2(vUV.x,texCoord1.y+stepSize.y);
#endif
#endif
if (useCamB){frag1=texture2D(textureSampler,texCoord1).rgb;frag2=texture2D(textureSampler,texCoord2).rgb;}else if (useCamA){frag1=texture2D(camASampler ,texCoord1).rgb;frag2=texture2D(camASampler ,texCoord2).rgb;}else {discard;}
gl_FragColor=vec4((frag1+frag2)/TWO,1.0);}
`;
ee.ShadersStore[Ye] = Ue;
class Ge extends X {
  /**
   * Gets a string identifying the name of the class
   * @returns "StereoscopicInterlacePostProcessI" string
   */
  getClassName() {
    return "StereoscopicInterlacePostProcessI";
  }
  /**
   * Initializes a StereoscopicInterlacePostProcessI
   * @param name The name of the effect.
   * @param rigCameras The rig cameras to be applied to the post process
   * @param isStereoscopicHoriz If the rendered results are horizontal or vertical
   * @param isStereoscopicInterlaced If the rendered results are alternate line interlaced
   * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
   * @param engine The engine which the post process will be applied. (default: current engine)
   * @param reusable If the post process can be reused on the same frame. (default: false)
   */
  constructor(e, t, i, s, n, l, c) {
    super(e, "stereoscopicInterlace", ["stepSize"], ["camASampler"], 1, t[1], n, l, c, s ? "#define IS_STEREOSCOPIC_INTERLACED 1" : i ? "#define IS_STEREOSCOPIC_HORIZ 1" : void 0), this._passedProcess = t[0]._rigPostProcess, this._stepSize = new v(1 / this.width, 1 / this.height), this.onSizeChangedObservable.add(() => {
      this._stepSize = new v(1 / this.width, 1 / this.height);
    }), this.onApplyObservable.add((u) => {
      u.setTextureFromPostProcess("camASampler", this._passedProcess), u.setFloat2("stepSize", this._stepSize.x, this._stepSize.y);
    });
  }
}
class lt extends X {
  /**
   * Gets a string identifying the name of the class
   * @returns "StereoscopicInterlacePostProcess" string
   */
  getClassName() {
    return "StereoscopicInterlacePostProcess";
  }
  /**
   * Initializes a StereoscopicInterlacePostProcess
   * @param name The name of the effect.
   * @param rigCameras The rig cameras to be applied to the post process
   * @param isStereoscopicHoriz If the rendered results are horizontal or vertical
   * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
   * @param engine The engine which the post process will be applied. (default: current engine)
   * @param reusable If the post process can be reused on the same frame. (default: false)
   */
  constructor(e, t, i, s, n, l) {
    super(e, "stereoscopicInterlace", ["stepSize"], ["camASampler"], 1, t[1], s, n, l, i ? "#define IS_STEREOSCOPIC_HORIZ 1" : void 0), this._passedProcess = t[0]._rigPostProcess, this._stepSize = new v(1 / this.width, 1 / this.height), this.onSizeChangedObservable.add(() => {
      this._stepSize = new v(1 / this.width, 1 / this.height);
    }), this.onApplyObservable.add((c) => {
      c.setTextureFromPostProcess("camASampler", this._passedProcess), c.setFloat2("stepSize", this._stepSize.x, this._stepSize.y);
    });
  }
}
function j(a) {
  const e = a.cameraRigMode === m.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL || a.cameraRigMode === m.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED, t = a.cameraRigMode === m.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
  a.cameraRigMode === m.RIG_MODE_STEREOSCOPIC_INTERLACED ? (a._rigCameras[0]._rigPostProcess = new se(a.name + "_passthru", 1, a._rigCameras[0]), a._rigCameras[1]._rigPostProcess = new Ge(a.name + "_stereoInterlace", a._rigCameras, !1, !0)) : (a._rigCameras[t ? 1 : 0].viewport = new H(0, 0, e ? 0.5 : 1, e ? 1 : 0.5), a._rigCameras[t ? 0 : 1].viewport = new H(e ? 0.5 : 0, e ? 0 : 0.5, e ? 0.5 : 1, e ? 1 : 0.5));
}
_.AddNodeConstructor("StereoscopicArcRotateCamera", (a, e, t) => () => new fe(a, 0, 0, 1, d.Zero(), t.interaxial_distance, t.isStereoscopicSideBySide, e));
class fe extends z {
  /**
   * Creates a new StereoscopicArcRotateCamera
   * @param name defines camera name
   * @param alpha defines alpha angle (in radians)
   * @param beta defines beta angle (in radians)
   * @param radius defines radius
   * @param target defines camera target
   * @param interaxialDistance defines distance between each color axis
   * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
   * @param scene defines the hosting scene
   */
  constructor(e, t, i, s, n, l, c, u) {
    super(e, t, i, s, n, u), this._setRigMode = () => j(this), this.interaxialDistance = l, this.isStereoscopicSideBySide = c, this.setCameraRigMode(c ? m.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : m.RIG_MODE_STEREOSCOPIC_OVERUNDER, {
      interaxialDistance: l
    });
  }
  /**
   * Gets camera class name
   * @returns StereoscopicArcRotateCamera
   */
  getClassName() {
    return "StereoscopicArcRotateCamera";
  }
}
_.AddNodeConstructor("StereoscopicFreeCamera", (a, e, t) => () => new pe(a, d.Zero(), t.interaxial_distance, t.isStereoscopicSideBySide, e));
class pe extends N {
  /**
   * Creates a new StereoscopicFreeCamera
   * @param name defines camera name
   * @param position defines initial position
   * @param interaxialDistance defines distance between each color axis
   * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
   * @param scene defines the hosting scene
   */
  constructor(e, t, i, s, n) {
    super(e, t, n), this._setRigMode = () => j(this), this.interaxialDistance = i, this.isStereoscopicSideBySide = s, this.setCameraRigMode(s ? m.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : m.RIG_MODE_STEREOSCOPIC_OVERUNDER, {
      interaxialDistance: i
    });
  }
  /**
   * Gets camera class name
   * @returns StereoscopicFreeCamera
   */
  getClassName() {
    return "StereoscopicFreeCamera";
  }
}
_.AddNodeConstructor("StereoscopicGamepadCamera", (a, e, t) => () => new ue(a, d.Zero(), t.interaxial_distance, t.isStereoscopicSideBySide, e));
class ue extends B {
  /**
   * Creates a new StereoscopicGamepadCamera
   * @param name defines camera name
   * @param position defines initial position
   * @param interaxialDistance defines distance between each color axis
   * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
   * @param scene defines the hosting scene
   */
  constructor(e, t, i, s, n) {
    super(e, t, n), this._setRigMode = () => j(this), this.interaxialDistance = i, this.isStereoscopicSideBySide = s, this.setCameraRigMode(s ? m.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : m.RIG_MODE_STEREOSCOPIC_OVERUNDER, {
      interaxialDistance: i
    });
  }
  /**
   * Gets camera class name
   * @returns StereoscopicGamepadCamera
   */
  getClassName() {
    return "StereoscopicGamepadCamera";
  }
}
_.AddNodeConstructor("StereoscopicFreeCamera", (a, e, t) => () => new me(a, d.Zero(), t.interaxial_distance, t.isStereoscopicSideBySide, e));
class me extends M {
  /**
   * Creates a new StereoscopicUniversalCamera
   * @param name defines camera name
   * @param position defines initial position
   * @param interaxialDistance defines distance between each color axis
   * @param isStereoscopicSideBySide defines is stereoscopic is done side by side or over under
   * @param scene defines the hosting scene
   */
  constructor(e, t, i, s, n) {
    super(e, t, n), this._setRigMode = () => j(this), this.interaxialDistance = i, this.isStereoscopicSideBySide = s, this.setCameraRigMode(s ? m.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : m.RIG_MODE_STEREOSCOPIC_OVERUNDER, {
      interaxialDistance: i
    });
  }
  /**
   * Gets camera class name
   * @returns StereoscopicUniversalCamera
   */
  getClassName() {
    return "StereoscopicUniversalCamera";
  }
}
class Ve extends M {
  set distanceBetweenEyes(e) {
    this._distanceBetweenEyes = e;
  }
  /**
   * distance between the eyes
   */
  get distanceBetweenEyes() {
    return this._distanceBetweenEyes;
  }
  set distanceToProjectionPlane(e) {
    this._distanceToProjectionPlane = e;
  }
  /**
   * Distance to projection plane (should be the same units the like distance between the eyes)
   */
  get distanceToProjectionPlane() {
    return this._distanceToProjectionPlane;
  }
  /**
   * Creates a new StereoscopicScreenUniversalCamera
   * @param name defines camera name
   * @param position defines initial position
   * @param scene defines the hosting scene
   * @param distanceToProjectionPlane defines distance between each color axis. The rig cameras will receive this as their negative z position!
   * @param distanceBetweenEyes defines is stereoscopic is done side by side or over under
   */
  constructor(e, t, i, s = 1, n = 0.065) {
    super(e, t, i), this._distanceBetweenEyes = n, this._distanceToProjectionPlane = s, this.setCameraRigMode(m.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL, {
      stereoHalfAngle: 0
    }), this._cameraRigParams.stereoHalfAngle = 0, this._cameraRigParams.interaxialDistance = n;
  }
  /**
   * Gets camera class name
   * @returns StereoscopicScreenUniversalCamera
   */
  getClassName() {
    return "StereoscopicUniversalCamera";
  }
  /**
   * @internal
   */
  createRigCamera(e) {
    const t = new E(e, d.Zero(), this.getScene()), i = new Ne("tm_" + e, this.getScene());
    return t.parent = i, i.setPivotMatrix($.Identity(), !1), t.isRigCamera = !0, t.rigParent = this, t;
  }
  /**
   * @internal
   */
  _updateRigCameras() {
    for (let e = 0; e < this._rigCameras.length; e++) {
      const t = this._rigCameras[e];
      t.minZ = this.minZ, t.maxZ = this.maxZ, t.fov = this.fov, t.upVector.copyFrom(this.upVector), t.rotationQuaternion ? t.rotationQuaternion.copyFrom(this.rotationQuaternion) : t.rotation.copyFrom(this.rotation), this._updateCamera(this._rigCameras[e], e);
    }
  }
  _updateCamera(e, t) {
    const i = this.distanceBetweenEyes / 2, s = i / this.distanceToProjectionPlane;
    e.position.copyFrom(this.position), e.position.addInPlaceFromFloats(t === 0 ? -i : i, 0, -this._distanceToProjectionPlane);
    const n = e.parent, l = n.getPivotMatrix();
    l.setTranslationFromFloats(t === 0 ? i : -i, 0, 0), l.setRowFromFloats(2, t === 0 ? s : -s, 0, 1, 0), n.setPivotMatrix(l, !1);
  }
  _setRigMode() {
    this._rigCameras[0].viewport = new H(0, 0, 0.5, 1), this._rigCameras[1].viewport = new H(0.5, 0, 0.5, 1);
    for (let e = 0; e < this._rigCameras.length; e++)
      this._updateCamera(this._rigCameras[e], e);
  }
}
_.AddNodeConstructor("VirtualJoysticksCamera", (a, e) => () => new Ce(a, d.Zero(), e));
class Ce extends N {
  /**
   * Instantiates a VirtualJoysticksCamera. It can be useful in First Person Shooter game for instance.
   * It is identical to the Free Camera and simply adds by default a virtual joystick.
   * Virtual Joysticks are on-screen 2D graphics that are used to control the camera or other scene items.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#virtual-joysticks-camera
   * @param name Define the name of the camera in the scene
   * @param position Define the start position of the camera in the scene
   * @param scene Define the scene the camera belongs to
   */
  constructor(e, t, i) {
    super(e, t, i), this.inputs.addVirtualJoystick();
  }
  /**
   * Gets the current object class name.
   * @returns the class name
   */
  getClassName() {
    return "VirtualJoysticksCamera";
  }
}
_.AddNodeConstructor("VRDeviceOrientationArcRotateCamera", (a, e) => () => new ye(a, 0, 0, 1, d.Zero(), e));
class ye extends z {
  /**
   * Creates a new VRDeviceOrientationArcRotateCamera
   * @param name defines camera name
   * @param alpha defines the camera rotation along the longitudinal axis
   * @param beta defines the camera rotation along the latitudinal axis
   * @param radius defines the camera distance from its target
   * @param target defines the camera target
   * @param scene defines the scene the camera belongs to
   * @param compensateDistortion defines if the camera needs to compensate the lens distortion
   * @param vrCameraMetrics defines the vr metrics associated to the camera
   */
  constructor(e, t, i, s, n, l, c = !0, u = G.GetDefault()) {
    super(e, t, i, s, n, l), this._setRigMode = (y) => V(this, y), u.compensateDistortion = c, this.setCameraRigMode(m.RIG_MODE_VR, { vrCameraMetrics: u }), this.inputs.addVRDeviceOrientation();
  }
  /**
   * Gets camera class name
   * @returns VRDeviceOrientationArcRotateCamera
   */
  getClassName() {
    return "VRDeviceOrientationArcRotateCamera";
  }
}
_.AddNodeConstructor("VRDeviceOrientationGamepadCamera", (a, e) => () => new _e(a, d.Zero(), e));
class _e extends ie {
  /**
   * Creates a new VRDeviceOrientationGamepadCamera
   * @param name defines camera name
   * @param position defines the start position of the camera
   * @param scene defines the scene the camera belongs to
   * @param compensateDistortion defines if the camera needs to compensate the lens distortion
   * @param vrCameraMetrics defines the vr metrics associated to the camera
   */
  constructor(e, t, i, s = !0, n = G.GetDefault()) {
    super(e, t, i, s, n), this._setRigMode = (l) => V(this, l), this.inputs.addGamepad();
  }
  /**
   * Gets camera class name
   * @returns VRDeviceOrientationGamepadCamera
   */
  getClassName() {
    return "VRDeviceOrientationGamepadCamera";
  }
}
const ct = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AnaglyphArcRotateCamera: he,
  AnaglyphFreeCamera: le,
  AnaglyphGamepadCamera: ce,
  AnaglyphUniversalCamera: de,
  ArcFollowCamera: re,
  ArcRotateCamera: z,
  ArcRotateCameraGamepadInput: be,
  ArcRotateCameraInputsManager: Q,
  ArcRotateCameraKeyboardMoveInput: Re,
  ArcRotateCameraMouseWheelInput: Oe,
  ArcRotateCameraPointersInput: Se,
  ArcRotateCameraVRDeviceOrientationInput: W,
  BaseCameraMouseWheelInput: ge,
  BaseCameraPointersInput: q,
  Camera: m,
  CameraInputTypes: R,
  CameraInputsManager: U,
  DeviceOrientationCamera: Te,
  FlyCamera: F,
  FlyCameraInputsManager: oe,
  FlyCameraKeyboardInput: k,
  FlyCameraMouseInput: A,
  FollowCamera: g,
  FollowCameraInputsManager: ae,
  FollowCameraKeyboardMoveInput: p,
  FollowCameraMouseWheelInput: O,
  FollowCameraPointersInput: C,
  FreeCamera: N,
  FreeCameraDeviceOrientationInput: Fe,
  FreeCameraGamepadInput: we,
  FreeCameraInputsManager: K,
  FreeCameraKeyboardMoveInput: ve,
  FreeCameraMouseInput: Pe,
  FreeCameraMouseWheelInput: xe,
  FreeCameraTouchInput: ke,
  FreeCameraVirtualJoystickInput: Z,
  GamepadCamera: B,
  OnAfterEnteringVRObservableEvent: je,
  StereoscopicArcRotateCamera: fe,
  StereoscopicFreeCamera: pe,
  StereoscopicGamepadCamera: ue,
  StereoscopicScreenUniversalCamera: Ve,
  StereoscopicUniversalCamera: me,
  TargetCamera: E,
  TouchCamera: Ie,
  UniversalCamera: M,
  VRCameraMetrics: G,
  VRDeviceOrientationArcRotateCamera: ye,
  VRDeviceOrientationFreeCamera: ie,
  VRDeviceOrientationGamepadCamera: _e,
  VRExperienceHelper: Le,
  VirtualJoysticksCamera: Ce,
  setStereoscopicAnaglyphRigMode: T,
  setStereoscopicRigMode: j,
  setVRRigMode: V
}, Symbol.toStringTag, { value: "Module" }));
export {
  he as A,
  ct as B,
  F,
  B as G,
  f as J,
  fe as S,
  ye as V,
  le as a,
  ce as b,
  ne as c,
  de as d,
  re as e,
  W as f,
  oe as g,
  k as h,
  A as i,
  g as j,
  ae as k,
  p as l,
  O as m,
  C as n,
  Z as o,
  pe as p,
  ue as q,
  lt as r,
  Ge as s,
  Ve as t,
  me as u,
  _e as v,
  o as w,
  Ce as x,
  T as y,
  j as z
};
//# sourceMappingURL=index-CJtjiuiS.js.map
