import { T as d, b as o, c as a, a as g, w as B, M, i as k, E as b } from "./embed-entry-Dediijbe.js";
import { C as v, a as R } from "./cameraInputsManager-D2S1-cbQ.js";
import { PointerEventTypes as u } from "./pointerEvents-5AlA8Qdy.js";
import { K as x, E as w } from "./scene-DFGy8rST.js";
import { P as E } from "./math.plane-DqQrP67A.js";
class T {
  constructor() {
    this._currentActiveButton = -1, this.buttons = [0, 1, 2];
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(t) {
    t = d.BackCompatCameraNoPreventDefault(arguments);
    const i = this.camera.getEngine(), e = i.getInputElement();
    let n = 0, h = null;
    this._pointA = null, this._pointB = null, this._altKey = !1, this._ctrlKey = !1, this._metaKey = !1, this._shiftKey = !1, this._buttonsPressed = 0, this._pointerInput = (r) => {
      const s = r.event, f = s.pointerType === "touch";
      if (r.type !== u.POINTERMOVE && this.buttons.indexOf(s.button) === -1)
        return;
      const O = s.target;
      if (this._altKey = s.altKey, this._ctrlKey = s.ctrlKey, this._metaKey = s.metaKey, this._shiftKey = s.shiftKey, this._buttonsPressed = s.buttons, i.isPointerLock) {
        const _ = s.movementX, m = s.movementY;
        this.onTouch(null, _, m), this._pointA = null, this._pointB = null;
      } else {
        if (r.type !== u.POINTERDOWN && f && this._pointA?.pointerId !== s.pointerId && this._pointB?.pointerId !== s.pointerId)
          return;
        if (r.type === u.POINTERDOWN && (this._currentActiveButton === -1 || f)) {
          try {
            O?.setPointerCapture(s.pointerId);
          } catch {
          }
          if (this._pointA === null)
            this._pointA = {
              x: s.clientX,
              y: s.clientY,
              pointerId: s.pointerId,
              type: s.pointerType
            };
          else if (this._pointB === null)
            this._pointB = {
              x: s.clientX,
              y: s.clientY,
              pointerId: s.pointerId,
              type: s.pointerType
            };
          else
            return;
          this._currentActiveButton === -1 && !f && (this._currentActiveButton = s.button), this.onButtonDown(s), t || (s.preventDefault(), e && e.focus());
        } else if (r.type === u.POINTERDOUBLETAP)
          this.onDoubleTap(s.pointerType);
        else if (r.type === u.POINTERUP && (this._currentActiveButton === s.button || f)) {
          try {
            O?.releasePointerCapture(s.pointerId);
          } catch {
          }
          f || (this._pointB = null), i._badOS ? this._pointA = this._pointB = null : this._pointB && this._pointA && this._pointA.pointerId == s.pointerId ? (this._pointA = this._pointB, this._pointB = null) : this._pointA && this._pointB && this._pointB.pointerId == s.pointerId ? this._pointB = null : this._pointA = this._pointB = null, (n !== 0 || h) && (this.onMultiTouch(
            this._pointA,
            this._pointB,
            n,
            0,
            // pinchSquaredDistance
            h,
            null
            // multiTouchPanPosition
          ), n = 0, h = null), this._currentActiveButton = -1, this.onButtonUp(s), t || s.preventDefault();
        } else if (r.type === u.POINTERMOVE) {
          if (t || s.preventDefault(), this._pointA && this._pointB === null) {
            const _ = s.clientX - this._pointA.x, m = s.clientY - this._pointA.y;
            this.onTouch(this._pointA, _, m), this._pointA.x = s.clientX, this._pointA.y = s.clientY;
          } else if (this._pointA && this._pointB) {
            const _ = this._pointA.pointerId === s.pointerId ? this._pointA : this._pointB;
            _.x = s.clientX, _.y = s.clientY;
            const m = this._pointA.x - this._pointB.x, C = this._pointA.y - this._pointB.y, A = m * m + C * C, I = {
              x: (this._pointA.x + this._pointB.x) / 2,
              y: (this._pointA.y + this._pointB.y) / 2,
              pointerId: s.pointerId,
              type: r.type
            };
            this.onMultiTouch(this._pointA, this._pointB, n, A, h, I), h = I, n = A;
          }
        }
      }
    }, this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver(this._pointerInput, u.POINTERDOWN | u.POINTERUP | u.POINTERMOVE | u.POINTERDOUBLETAP), this._onLostFocus = () => {
      this._pointA = this._pointB = null, n = 0, h = null, this.onLostFocus();
    }, this._contextMenuBind = (r) => this.onContextMenu(r), e && e.addEventListener("contextmenu", this._contextMenuBind, !1);
    const l = this.camera.getScene().getEngine().getHostWindow();
    l && d.RegisterTopRootEvents(l, [{ name: "blur", handler: this._onLostFocus }]);
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    if (this._onLostFocus) {
      const t = this.camera.getScene().getEngine().getHostWindow();
      t && d.UnregisterTopRootEvents(t, [{ name: "blur", handler: this._onLostFocus }]);
    }
    if (this._observer) {
      if (this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer), this._observer = null, this._contextMenuBind) {
        const t = this.camera.getScene().getEngine().getInputElement();
        t && t.removeEventListener("contextmenu", this._contextMenuBind);
      }
      this._onLostFocus = null;
    }
    this._altKey = !1, this._ctrlKey = !1, this._metaKey = !1, this._shiftKey = !1, this._buttonsPressed = 0, this._currentActiveButton = -1;
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "BaseCameraPointersInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "pointers";
  }
  /**
   * Called on pointer POINTERDOUBLETAP event.
   * Override this method to provide functionality on POINTERDOUBLETAP event.
   * @param type type of event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDoubleTap(t) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  /**
   * Called on pointer POINTERMOVE event if only a single touch is active.
   * Override this method to provide functionality.
   * @param point The current position of the pointer
   * @param offsetX The offsetX of the pointer when the event occurred
   * @param offsetY The offsetY of the pointer when the event occurred
   */
  onTouch(t, i, e) {
  }
  /**
   * Called on pointer POINTERMOVE event if multiple touches are active.
   * Override this method to provide functionality.
   * @param _pointA First point in the pair
   * @param _pointB Second point in the pair
   * @param previousPinchSquaredDistance Sqr Distance between the points the last time this event was fired (by this input)
   * @param pinchSquaredDistance Sqr Distance between the points this time
   * @param previousMultiTouchPanPosition Previous center point between the points
   * @param multiTouchPanPosition Current center point between the points
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMultiTouch(t, i, e, n, h, l) {
  }
  /**
   * Called on JS contextmenu event.
   * Override this method to provide functionality.
   * @param evt the event to be handled
   */
  onContextMenu(t) {
    t.preventDefault();
  }
  /**
   * Called each time a new POINTERDOWN event occurs. Ie, for each button
   * press.
   * Override this method to provide functionality.
   * @param _evt Defines the event to track
   */
  onButtonDown(t) {
  }
  /**
   * Called each time a new POINTERUP event occurs. Ie, for each button
   * release.
   * Override this method to provide functionality.
   * @param _evt Defines the event to track
   */
  onButtonUp(t) {
  }
  /**
   * Called when window becomes inactive.
   * Override this method to provide functionality.
   */
  onLostFocus() {
  }
}
o([
  a()
], T.prototype, "buttons", void 0);
class c extends T {
  constructor() {
    super(...arguments), this.buttons = [0, 1, 2], this.angularSensibilityX = 1e3, this.angularSensibilityY = 1e3, this.pinchPrecision = 12, this.pinchDeltaPercentage = 0, this.useNaturalPinchZoom = !1, this.pinchZoom = !0, this.panningSensibility = 1e3, this.multiTouchPanning = !0, this.multiTouchPanAndZoom = !0, this.pinchInwards = !0, this._isPanClick = !1, this._twoFingerActivityCount = 0, this._isPinching = !1;
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "ArcRotateCameraPointersInput";
  }
  /**
   * Move camera from multi touch panning positions.
   * @param previousMultiTouchPanPosition
   * @param multiTouchPanPosition
   */
  _computeMultiTouchPanning(t, i) {
    if (this.panningSensibility !== 0 && t && i) {
      const e = i.x - t.x, n = i.y - t.y;
      this.camera.inertialPanningX += -e / this.panningSensibility, this.camera.inertialPanningY += n / this.panningSensibility;
    }
  }
  /**
   * Move camera from pinch zoom distances.
   * @param previousPinchSquaredDistance
   * @param pinchSquaredDistance
   */
  _computePinchZoom(t, i) {
    const e = this.camera.radius || c.MinimumRadiusForPinch;
    this.useNaturalPinchZoom ? this.camera.radius = e * Math.sqrt(t) / Math.sqrt(i) : this.pinchDeltaPercentage ? this.camera.inertialRadiusOffset += (i - t) * 1e-3 * e * this.pinchDeltaPercentage : this.camera.inertialRadiusOffset += (i - t) / (this.pinchPrecision * (this.pinchInwards ? 1 : -1) * (this.angularSensibilityX + this.angularSensibilityY) / 2);
  }
  /**
   * Called on pointer POINTERMOVE event if only a single touch is active.
   * @param point current touch point
   * @param offsetX offset on X
   * @param offsetY offset on Y
   */
  onTouch(t, i, e) {
    this.panningSensibility !== 0 && (this._ctrlKey && this.camera._useCtrlForPanning || this._isPanClick) ? (this.camera.inertialPanningX += -i / this.panningSensibility, this.camera.inertialPanningY += e / this.panningSensibility) : (this.camera.inertialAlphaOffset -= i / this.angularSensibilityX, this.camera.inertialBetaOffset -= e / this.angularSensibilityY);
  }
  /**
   * Called on pointer POINTERDOUBLETAP event.
   */
  onDoubleTap() {
    this.camera.useInputToRestoreState && this.camera.restoreState();
  }
  /**
   * Called on pointer POINTERMOVE event if multiple touches are active.
   * @param pointA point A
   * @param pointB point B
   * @param previousPinchSquaredDistance distance between points in previous pinch
   * @param pinchSquaredDistance distance between points in current pinch
   * @param previousMultiTouchPanPosition multi-touch position in previous step
   * @param multiTouchPanPosition multi-touch position in current step
   */
  onMultiTouch(t, i, e, n, h, l) {
    e === 0 && h === null || n === 0 && l === null || (this.multiTouchPanAndZoom ? (this._computePinchZoom(e, n), this._computeMultiTouchPanning(h, l)) : this.multiTouchPanning && this.pinchZoom ? (this._twoFingerActivityCount++, this._isPinching || this._twoFingerActivityCount < 20 && Math.abs(Math.sqrt(n) - Math.sqrt(e)) > this.camera.pinchToPanMaxDistance ? (this._computePinchZoom(e, n), this._isPinching = !0) : this._computeMultiTouchPanning(h, l)) : this.multiTouchPanning ? this._computeMultiTouchPanning(h, l) : this.pinchZoom && this._computePinchZoom(e, n));
  }
  /**
   * Called each time a new POINTERDOWN event occurs. Ie, for each button
   * press.
   * @param evt Defines the event to track
   */
  onButtonDown(t) {
    this._isPanClick = t.button === this.camera._panningMouseButton;
  }
  /**
   * Called each time a new POINTERUP event occurs. Ie, for each button
   * release.
   * @param _evt Defines the event to track
   */
  onButtonUp(t) {
    this._twoFingerActivityCount = 0, this._isPinching = !1;
  }
  /**
   * Called when window becomes inactive.
   */
  onLostFocus() {
    this._isPanClick = !1, this._twoFingerActivityCount = 0, this._isPinching = !1;
  }
}
c.MinimumRadiusForPinch = 1e-3;
o([
  a()
], c.prototype, "buttons", void 0);
o([
  a()
], c.prototype, "angularSensibilityX", void 0);
o([
  a()
], c.prototype, "angularSensibilityY", void 0);
o([
  a()
], c.prototype, "pinchPrecision", void 0);
o([
  a()
], c.prototype, "pinchDeltaPercentage", void 0);
o([
  a()
], c.prototype, "useNaturalPinchZoom", void 0);
o([
  a()
], c.prototype, "pinchZoom", void 0);
o([
  a()
], c.prototype, "panningSensibility", void 0);
o([
  a()
], c.prototype, "multiTouchPanning", void 0);
o([
  a()
], c.prototype, "multiTouchPanAndZoom", void 0);
v.ArcRotateCameraPointersInput = c;
class p {
  constructor() {
    this.keysUp = [38], this.keysDown = [40], this.keysLeft = [37], this.keysRight = [39], this.keysReset = [220], this.panningSensibility = 50, this.zoomingSensibility = 25, this.useAltToZoom = !0, this.angularSpeed = 0.01, this._keys = new Array();
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(t) {
    t = d.BackCompatCameraNoPreventDefault(arguments), !this._onCanvasBlurObserver && (this._scene = this.camera.getScene(), this._engine = this._scene.getEngine(), this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
      this._keys.length = 0;
    }), this._onKeyboardObserver = this._scene.onKeyboardObservable.add((i) => {
      const e = i.event;
      if (!e.metaKey) {
        if (i.type === x.KEYDOWN)
          this._ctrlPressed = e.ctrlKey, this._altPressed = e.altKey, (this.keysUp.indexOf(e.keyCode) !== -1 || this.keysDown.indexOf(e.keyCode) !== -1 || this.keysLeft.indexOf(e.keyCode) !== -1 || this.keysRight.indexOf(e.keyCode) !== -1 || this.keysReset.indexOf(e.keyCode) !== -1) && (this._keys.indexOf(e.keyCode) === -1 && this._keys.push(e.keyCode), e.preventDefault && (t || e.preventDefault()));
        else if (this.keysUp.indexOf(e.keyCode) !== -1 || this.keysDown.indexOf(e.keyCode) !== -1 || this.keysLeft.indexOf(e.keyCode) !== -1 || this.keysRight.indexOf(e.keyCode) !== -1 || this.keysReset.indexOf(e.keyCode) !== -1) {
          const n = this._keys.indexOf(e.keyCode);
          n >= 0 && this._keys.splice(n, 1), e.preventDefault && (t || e.preventDefault());
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
    if (this._onKeyboardObserver) {
      const t = this.camera;
      for (let i = 0; i < this._keys.length; i++) {
        const e = this._keys[i];
        this.keysLeft.indexOf(e) !== -1 ? this._ctrlPressed && this.camera._useCtrlForPanning ? t.inertialPanningX -= 1 / this.panningSensibility : t.inertialAlphaOffset -= this.angularSpeed : this.keysUp.indexOf(e) !== -1 ? this._ctrlPressed && this.camera._useCtrlForPanning ? t.inertialPanningY += 1 / this.panningSensibility : this._altPressed && this.useAltToZoom ? t.inertialRadiusOffset += 1 / this.zoomingSensibility : t.inertialBetaOffset -= this.angularSpeed : this.keysRight.indexOf(e) !== -1 ? this._ctrlPressed && this.camera._useCtrlForPanning ? t.inertialPanningX += 1 / this.panningSensibility : t.inertialAlphaOffset += this.angularSpeed : this.keysDown.indexOf(e) !== -1 ? this._ctrlPressed && this.camera._useCtrlForPanning ? t.inertialPanningY -= 1 / this.panningSensibility : this._altPressed && this.useAltToZoom ? t.inertialRadiusOffset -= 1 / this.zoomingSensibility : t.inertialBetaOffset += this.angularSpeed : this.keysReset.indexOf(e) !== -1 && t.useInputToRestoreState && t.restoreState();
      }
    }
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "ArcRotateCameraKeyboardMoveInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "keyboard";
  }
}
o([
  a()
], p.prototype, "keysUp", void 0);
o([
  a()
], p.prototype, "keysDown", void 0);
o([
  a()
], p.prototype, "keysLeft", void 0);
o([
  a()
], p.prototype, "keysRight", void 0);
o([
  a()
], p.prototype, "keysReset", void 0);
o([
  a()
], p.prototype, "panningSensibility", void 0);
o([
  a()
], p.prototype, "zoomingSensibility", void 0);
o([
  a()
], p.prototype, "useAltToZoom", void 0);
o([
  a()
], p.prototype, "angularSpeed", void 0);
v.ArcRotateCameraKeyboardMoveInput = p;
const S = 40;
class y {
  constructor() {
    this.wheelPrecision = 3, this.zoomToMouseLocation = !1, this.wheelDeltaPercentage = 0, this.customComputeDeltaFromMouseWheel = null, this._viewOffset = new g(0, 0, 0), this._globalOffset = new g(0, 0, 0), this._inertialPanning = g.Zero();
  }
  _computeDeltaFromMouseWheelLegacyEvent(t, i) {
    let e = 0;
    const n = t * 0.01 * this.wheelDeltaPercentage * i;
    return t > 0 ? e = n / (1 + this.wheelDeltaPercentage) : e = n * (1 + this.wheelDeltaPercentage), e;
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(t) {
    t = d.BackCompatCameraNoPreventDefault(arguments), this._wheel = (i) => {
      if (i.type !== u.POINTERWHEEL)
        return;
      const e = i.event;
      let n = 0;
      const h = e.deltaMode === w.DOM_DELTA_LINE ? S : 1, l = -(e.deltaY * h);
      if (this.customComputeDeltaFromMouseWheel)
        n = this.customComputeDeltaFromMouseWheel(l, this, e);
      else if (this.wheelDeltaPercentage) {
        if (n = this._computeDeltaFromMouseWheelLegacyEvent(l, this.camera.radius), n > 0) {
          let r = this.camera.radius, s = this.camera.inertialRadiusOffset + n;
          for (let f = 0; f < 20 && Math.abs(s) > 1e-3; f++)
            r -= s, s *= this.camera.inertia;
          r = B.Clamp(r, 0, Number.MAX_VALUE), n = this._computeDeltaFromMouseWheelLegacyEvent(l, r);
        }
      } else
        n = l / (this.wheelPrecision * 40);
      n && (this.zoomToMouseLocation ? (this._hitPlane || this._updateHitPlane(), this._zoomToMouse(n)) : this.camera.inertialRadiusOffset += n), e.preventDefault && (t || e.preventDefault());
    }, this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver(this._wheel, u.POINTERWHEEL), this.zoomToMouseLocation && this._inertialPanning.setAll(0);
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this._observer && (this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer), this._observer = null, this._wheel = null);
  }
  /**
   * Update the current camera state depending on the inputs that have been used this frame.
   * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
   */
  checkInputs() {
    if (!this.zoomToMouseLocation)
      return;
    const t = this.camera;
    0 + t.inertialAlphaOffset + t.inertialBetaOffset + t.inertialRadiusOffset && (this._updateHitPlane(), t.target.addInPlace(this._inertialPanning), this._inertialPanning.scaleInPlace(t.inertia), this._zeroIfClose(this._inertialPanning));
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
  _updateHitPlane() {
    const t = this.camera, i = t.target.subtract(t.position);
    this._hitPlane = E.FromPositionAndNormal(t.target, i);
  }
  // Get position on the hit plane
  _getPosition() {
    const t = this.camera, i = t.getScene(), e = i.createPickingRay(i.pointerX, i.pointerY, M.Identity(), t, !1);
    (t.targetScreenOffset.x !== 0 || t.targetScreenOffset.y !== 0) && (this._viewOffset.set(t.targetScreenOffset.x, t.targetScreenOffset.y, 0), t.getViewMatrix().invertToRef(t._cameraTransformMatrix), this._globalOffset = g.TransformNormal(this._viewOffset, t._cameraTransformMatrix), e.origin.addInPlace(this._globalOffset));
    let n = 0;
    return this._hitPlane && (n = e.intersectsPlane(this._hitPlane) ?? 0), e.origin.addInPlace(e.direction.scaleInPlace(n));
  }
  _zoomToMouse(t) {
    const i = this.camera, e = 1 - i.inertia;
    if (i.lowerRadiusLimit) {
      const s = i.lowerRadiusLimit ?? 0;
      i.radius - (i.inertialRadiusOffset + t) / e < s && (t = (i.radius - s) * e - i.inertialRadiusOffset);
    }
    if (i.upperRadiusLimit) {
      const s = i.upperRadiusLimit ?? 0;
      i.radius - (i.inertialRadiusOffset + t) / e > s && (t = (i.radius - s) * e - i.inertialRadiusOffset);
    }
    const h = t / e / i.radius, l = this._getPosition(), r = k.Vector3[6];
    l.subtractToRef(i.target, r), r.scaleInPlace(h), r.scaleInPlace(e), this._inertialPanning.addInPlace(r), i.inertialRadiusOffset += t;
  }
  // Sets x y or z of passed in vector to zero if less than Epsilon.
  _zeroIfClose(t) {
    Math.abs(t.x) < b && (t.x = 0), Math.abs(t.y) < b && (t.y = 0), Math.abs(t.z) < b && (t.z = 0);
  }
}
o([
  a()
], y.prototype, "wheelPrecision", void 0);
o([
  a()
], y.prototype, "zoomToMouseLocation", void 0);
o([
  a()
], y.prototype, "wheelDeltaPercentage", void 0);
v.ArcRotateCameraMouseWheelInput = y;
class Y extends R {
  /**
   * Instantiates a new ArcRotateCameraInputsManager.
   * @param camera Defines the camera the inputs belong to
   */
  constructor(t) {
    super(t);
  }
  /**
   * Add mouse wheel input support to the input manager.
   * @returns the current input manager
   */
  addMouseWheel() {
    return this.add(new y()), this;
  }
  /**
   * Add pointers input support to the input manager.
   * @returns the current input manager
   */
  addPointers() {
    return this.add(new c()), this;
  }
  /**
   * Add keyboard input support to the input manager.
   * @returns the current input manager
   */
  addKeyboard() {
    return this.add(new p()), this;
  }
}
export {
  Y as A,
  T as B,
  p as a,
  y as b,
  c
};
//# sourceMappingURL=arcRotateCameraInputsManager-D9X6dUSF.js.map
