import { T as f, a as h, b as n, c as r, O as M, M as O, g as I, s as D } from "./embed-entry-Dediijbe.js";
import { E as P } from "./engine-DEEy1h7X.js";
import { C as v, a as A, T as S } from "./cameraInputsManager-D2S1-cbQ.js";
import { K as x, E as Y } from "./scene-DFGy8rST.js";
import { PointerEventTypes as c } from "./pointerEvents-5AlA8Qdy.js";
import { C as y } from "./math.axis-Drk1BmmE.js";
class d {
  constructor() {
    this.keysUp = [38], this.keysUpward = [33], this.keysDown = [40], this.keysDownward = [34], this.keysLeft = [37], this.keysRight = [39], this.rotationSpeed = 0.5, this.keysRotateLeft = [], this.keysRotateRight = [], this.keysRotateUp = [], this.keysRotateDown = [], this._keys = new Array();
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e) {
    e = f.BackCompatCameraNoPreventDefault(arguments), !this._onCanvasBlurObserver && (this._scene = this.camera.getScene(), this._engine = this._scene.getEngine(), this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
      this._keys.length = 0;
    }), this._onKeyboardObserver = this._scene.onKeyboardObservable.add((t) => {
      const i = t.event;
      if (!i.metaKey) {
        if (t.type === x.KEYDOWN)
          (this.keysUp.indexOf(i.keyCode) !== -1 || this.keysDown.indexOf(i.keyCode) !== -1 || this.keysLeft.indexOf(i.keyCode) !== -1 || this.keysRight.indexOf(i.keyCode) !== -1 || this.keysUpward.indexOf(i.keyCode) !== -1 || this.keysDownward.indexOf(i.keyCode) !== -1 || this.keysRotateLeft.indexOf(i.keyCode) !== -1 || this.keysRotateRight.indexOf(i.keyCode) !== -1 || this.keysRotateUp.indexOf(i.keyCode) !== -1 || this.keysRotateDown.indexOf(i.keyCode) !== -1) && (this._keys.indexOf(i.keyCode) === -1 && this._keys.push(i.keyCode), e || i.preventDefault());
        else if (this.keysUp.indexOf(i.keyCode) !== -1 || this.keysDown.indexOf(i.keyCode) !== -1 || this.keysLeft.indexOf(i.keyCode) !== -1 || this.keysRight.indexOf(i.keyCode) !== -1 || this.keysUpward.indexOf(i.keyCode) !== -1 || this.keysDownward.indexOf(i.keyCode) !== -1 || this.keysRotateLeft.indexOf(i.keyCode) !== -1 || this.keysRotateRight.indexOf(i.keyCode) !== -1 || this.keysRotateUp.indexOf(i.keyCode) !== -1 || this.keysRotateDown.indexOf(i.keyCode) !== -1) {
          const o = this._keys.indexOf(i.keyCode);
          o >= 0 && this._keys.splice(o, 1), e || i.preventDefault();
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
      const e = this.camera;
      for (let t = 0; t < this._keys.length; t++) {
        const i = this._keys[t], o = e._computeLocalCameraSpeed();
        this.keysLeft.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(-o, 0, 0) : this.keysUp.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(0, 0, o) : this.keysRight.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(o, 0, 0) : this.keysDown.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(0, 0, -o) : this.keysUpward.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(0, o, 0) : this.keysDownward.indexOf(i) !== -1 ? e._localDirection.copyFromFloats(0, -o, 0) : this.keysRotateLeft.indexOf(i) !== -1 ? (e._localDirection.copyFromFloats(0, 0, 0), e.cameraRotation.y -= this._getLocalRotation()) : this.keysRotateRight.indexOf(i) !== -1 ? (e._localDirection.copyFromFloats(0, 0, 0), e.cameraRotation.y += this._getLocalRotation()) : this.keysRotateUp.indexOf(i) !== -1 ? (e._localDirection.copyFromFloats(0, 0, 0), e.cameraRotation.x -= this._getLocalRotation()) : this.keysRotateDown.indexOf(i) !== -1 && (e._localDirection.copyFromFloats(0, 0, 0), e.cameraRotation.x += this._getLocalRotation()), e.getScene().useRightHandedSystem && (e._localDirection.z *= -1), e.getViewMatrix().invertToRef(e._cameraTransformMatrix), h.TransformNormalToRef(e._localDirection, e._cameraTransformMatrix, e._transformedDirection), e.cameraDirection.addInPlace(e._transformedDirection);
      }
    }
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FreeCameraKeyboardMoveInput";
  }
  /** @internal */
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
  _getLocalRotation() {
    const e = this.camera._calculateHandednessMultiplier();
    return this.rotationSpeed * this._engine.getDeltaTime() / 1e3 * e;
  }
}
n([
  r()
], d.prototype, "keysUp", void 0);
n([
  r()
], d.prototype, "keysUpward", void 0);
n([
  r()
], d.prototype, "keysDown", void 0);
n([
  r()
], d.prototype, "keysDownward", void 0);
n([
  r()
], d.prototype, "keysLeft", void 0);
n([
  r()
], d.prototype, "keysRight", void 0);
n([
  r()
], d.prototype, "rotationSpeed", void 0);
n([
  r()
], d.prototype, "keysRotateLeft", void 0);
n([
  r()
], d.prototype, "keysRotateRight", void 0);
n([
  r()
], d.prototype, "keysRotateUp", void 0);
n([
  r()
], d.prototype, "keysRotateDown", void 0);
v.FreeCameraKeyboardMoveInput = d;
class m {
  /**
   * Manage the mouse inputs to control the movement of a free camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
   * @param touchEnabled Defines if touch is enabled or not
   */
  constructor(e = !0) {
    this.touchEnabled = e, this.buttons = [0, 1, 2], this.angularSensibility = 2e3, this._previousPosition = null, this.onPointerMovedObservable = new M(), this._allowCameraRotation = !0, this._currentActiveButton = -1, this._activePointerId = -1;
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e) {
    e = f.BackCompatCameraNoPreventDefault(arguments);
    const t = this.camera.getEngine(), i = t.getInputElement();
    this._pointerInput || (this._pointerInput = (o) => {
      const a = o.event, l = a.pointerType === "touch";
      if (!this.touchEnabled && l || o.type !== c.POINTERMOVE && this.buttons.indexOf(a.button) === -1)
        return;
      const _ = a.target;
      if (o.type === c.POINTERDOWN) {
        if (l && this._activePointerId !== -1 || !l && this._currentActiveButton !== -1)
          return;
        this._activePointerId = a.pointerId;
        try {
          _?.setPointerCapture(a.pointerId);
        } catch {
        }
        this._currentActiveButton === -1 && (this._currentActiveButton = a.button), this._previousPosition = {
          x: a.clientX,
          y: a.clientY
        }, e || (a.preventDefault(), i && i.focus()), t.isPointerLock && this._onMouseMove && this._onMouseMove(o.event);
      } else if (o.type === c.POINTERUP) {
        if (l && this._activePointerId !== a.pointerId || !l && this._currentActiveButton !== a.button)
          return;
        try {
          _?.releasePointerCapture(a.pointerId);
        } catch {
        }
        this._currentActiveButton = -1, this._previousPosition = null, e || a.preventDefault(), this._activePointerId = -1;
      } else if (o.type === c.POINTERMOVE && (this._activePointerId === a.pointerId || !l)) {
        if (t.isPointerLock && this._onMouseMove)
          this._onMouseMove(o.event);
        else if (this._previousPosition) {
          const g = this.camera._calculateHandednessMultiplier(), b = (a.clientX - this._previousPosition.x) * g, C = a.clientY - this._previousPosition.y;
          this._allowCameraRotation && (this.camera.cameraRotation.y += b / this.angularSensibility, this.camera.cameraRotation.x += C / this.angularSensibility), this.onPointerMovedObservable.notifyObservers({ offsetX: b, offsetY: C }), this._previousPosition = {
            x: a.clientX,
            y: a.clientY
          }, e || a.preventDefault();
        }
      }
    }), this._onMouseMove = (o) => {
      if (!t.isPointerLock)
        return;
      const a = this.camera._calculateHandednessMultiplier(), l = o.movementX * a;
      this.camera.cameraRotation.y += l / this.angularSensibility;
      const _ = o.movementY;
      this.camera.cameraRotation.x += _ / this.angularSensibility, this._previousPosition = null, e || o.preventDefault();
    }, this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver(this._pointerInput, c.POINTERDOWN | c.POINTERUP | c.POINTERMOVE), i && (this._contextMenuBind = (o) => this.onContextMenu(o), i.addEventListener("contextmenu", this._contextMenuBind, !1));
  }
  /**
   * Called on JS contextmenu event.
   * Override this method to provide functionality.
   * @param evt the context menu event
   */
  onContextMenu(e) {
    e.preventDefault();
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    if (this._observer) {
      if (this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer), this._contextMenuBind) {
        const t = this.camera.getEngine().getInputElement();
        t && t.removeEventListener("contextmenu", this._contextMenuBind);
      }
      this.onPointerMovedObservable && this.onPointerMovedObservable.clear(), this._observer = null, this._onMouseMove = null, this._previousPosition = null;
    }
    this._activePointerId = -1, this._currentActiveButton = -1;
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FreeCameraMouseInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "mouse";
  }
}
n([
  r()
], m.prototype, "buttons", void 0);
n([
  r()
], m.prototype, "angularSensibility", void 0);
v.FreeCameraMouseInput = m;
class k {
  constructor() {
    this.wheelPrecisionX = 3, this.wheelPrecisionY = 3, this.wheelPrecisionZ = 3, this.onChangedObservable = new M(), this._wheelDeltaX = 0, this._wheelDeltaY = 0, this._wheelDeltaZ = 0, this._ffMultiplier = 12, this._normalize = 120;
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls
   *   should call preventdefault().
   *   (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e) {
    e = f.BackCompatCameraNoPreventDefault(arguments), this._wheel = (t) => {
      if (t.type !== c.POINTERWHEEL)
        return;
      const i = t.event, o = i.deltaMode === Y.DOM_DELTA_LINE ? this._ffMultiplier : 1;
      this._wheelDeltaX += this.wheelPrecisionX * o * i.deltaX / this._normalize, this._wheelDeltaY -= this.wheelPrecisionY * o * i.deltaY / this._normalize, this._wheelDeltaZ += this.wheelPrecisionZ * o * i.deltaZ / this._normalize, i.preventDefault && (e || i.preventDefault());
    }, this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver(this._wheel, c.POINTERWHEEL);
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this._observer && (this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer), this._observer = null, this._wheel = null), this.onChangedObservable && this.onChangedObservable.clear();
  }
  /**
   * Called for each rendered frame.
   */
  checkInputs() {
    this.onChangedObservable.notifyObservers({
      wheelDeltaX: this._wheelDeltaX,
      wheelDeltaY: this._wheelDeltaY,
      wheelDeltaZ: this._wheelDeltaZ
    }), this._wheelDeltaX = 0, this._wheelDeltaY = 0, this._wheelDeltaZ = 0;
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "BaseCameraMouseWheelInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "mousewheel";
  }
}
n([
  r()
], k.prototype, "wheelPrecisionX", void 0);
n([
  r()
], k.prototype, "wheelPrecisionY", void 0);
n([
  r()
], k.prototype, "wheelPrecisionZ", void 0);
var s;
(function(u) {
  u[u.MoveRelative = 0] = "MoveRelative", u[u.RotateRelative = 1] = "RotateRelative", u[u.MoveScene = 2] = "MoveScene";
})(s || (s = {}));
class p extends k {
  constructor() {
    super(...arguments), this._moveRelative = h.Zero(), this._rotateRelative = h.Zero(), this._moveScene = h.Zero(), this._wheelXAction = s.MoveRelative, this._wheelXActionCoordinate = y.X, this._wheelYAction = s.MoveRelative, this._wheelYActionCoordinate = y.Z, this._wheelZAction = null, this._wheelZActionCoordinate = null;
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FreeCameraMouseWheelInput";
  }
  /**
   * Set which movement axis (relative to camera's orientation) the mouse
   * wheel's X axis controls.
   * @param axis The axis to be moved. Set null to clear.
   */
  set wheelXMoveRelative(e) {
    e === null && this._wheelXAction !== s.MoveRelative || (this._wheelXAction = s.MoveRelative, this._wheelXActionCoordinate = e);
  }
  /**
   * Get the configured movement axis (relative to camera's orientation) the
   * mouse wheel's X axis controls.
   * @returns The configured axis or null if none.
   */
  get wheelXMoveRelative() {
    return this._wheelXAction !== s.MoveRelative ? null : this._wheelXActionCoordinate;
  }
  /**
   * Set which movement axis (relative to camera's orientation) the mouse
   * wheel's Y axis controls.
   * @param axis The axis to be moved. Set null to clear.
   */
  set wheelYMoveRelative(e) {
    e === null && this._wheelYAction !== s.MoveRelative || (this._wheelYAction = s.MoveRelative, this._wheelYActionCoordinate = e);
  }
  /**
   * Get the configured movement axis (relative to camera's orientation) the
   * mouse wheel's Y axis controls.
   * @returns The configured axis or null if none.
   */
  get wheelYMoveRelative() {
    return this._wheelYAction !== s.MoveRelative ? null : this._wheelYActionCoordinate;
  }
  /**
   * Set which movement axis (relative to camera's orientation) the mouse
   * wheel's Z axis controls.
   * @param axis The axis to be moved. Set null to clear.
   */
  set wheelZMoveRelative(e) {
    e === null && this._wheelZAction !== s.MoveRelative || (this._wheelZAction = s.MoveRelative, this._wheelZActionCoordinate = e);
  }
  /**
   * Get the configured movement axis (relative to camera's orientation) the
   * mouse wheel's Z axis controls.
   * @returns The configured axis or null if none.
   */
  get wheelZMoveRelative() {
    return this._wheelZAction !== s.MoveRelative ? null : this._wheelZActionCoordinate;
  }
  /**
   * Set which rotation axis (relative to camera's orientation) the mouse
   * wheel's X axis controls.
   * @param axis The axis to be moved. Set null to clear.
   */
  set wheelXRotateRelative(e) {
    e === null && this._wheelXAction !== s.RotateRelative || (this._wheelXAction = s.RotateRelative, this._wheelXActionCoordinate = e);
  }
  /**
   * Get the configured rotation axis (relative to camera's orientation) the
   * mouse wheel's X axis controls.
   * @returns The configured axis or null if none.
   */
  get wheelXRotateRelative() {
    return this._wheelXAction !== s.RotateRelative ? null : this._wheelXActionCoordinate;
  }
  /**
   * Set which rotation axis (relative to camera's orientation) the mouse
   * wheel's Y axis controls.
   * @param axis The axis to be moved. Set null to clear.
   */
  set wheelYRotateRelative(e) {
    e === null && this._wheelYAction !== s.RotateRelative || (this._wheelYAction = s.RotateRelative, this._wheelYActionCoordinate = e);
  }
  /**
   * Get the configured rotation axis (relative to camera's orientation) the
   * mouse wheel's Y axis controls.
   * @returns The configured axis or null if none.
   */
  get wheelYRotateRelative() {
    return this._wheelYAction !== s.RotateRelative ? null : this._wheelYActionCoordinate;
  }
  /**
   * Set which rotation axis (relative to camera's orientation) the mouse
   * wheel's Z axis controls.
   * @param axis The axis to be moved. Set null to clear.
   */
  set wheelZRotateRelative(e) {
    e === null && this._wheelZAction !== s.RotateRelative || (this._wheelZAction = s.RotateRelative, this._wheelZActionCoordinate = e);
  }
  /**
   * Get the configured rotation axis (relative to camera's orientation) the
   * mouse wheel's Z axis controls.
   * @returns The configured axis or null if none.
   */
  get wheelZRotateRelative() {
    return this._wheelZAction !== s.RotateRelative ? null : this._wheelZActionCoordinate;
  }
  /**
   * Set which movement axis (relative to the scene) the mouse wheel's X axis
   * controls.
   * @param axis The axis to be moved. Set null to clear.
   */
  set wheelXMoveScene(e) {
    e === null && this._wheelXAction !== s.MoveScene || (this._wheelXAction = s.MoveScene, this._wheelXActionCoordinate = e);
  }
  /**
   * Get the configured movement axis (relative to the scene) the mouse wheel's
   * X axis controls.
   * @returns The configured axis or null if none.
   */
  get wheelXMoveScene() {
    return this._wheelXAction !== s.MoveScene ? null : this._wheelXActionCoordinate;
  }
  /**
   * Set which movement axis (relative to the scene) the mouse wheel's Y axis
   * controls.
   * @param axis The axis to be moved. Set null to clear.
   */
  set wheelYMoveScene(e) {
    e === null && this._wheelYAction !== s.MoveScene || (this._wheelYAction = s.MoveScene, this._wheelYActionCoordinate = e);
  }
  /**
   * Get the configured movement axis (relative to the scene) the mouse wheel's
   * Y axis controls.
   * @returns The configured axis or null if none.
   */
  get wheelYMoveScene() {
    return this._wheelYAction !== s.MoveScene ? null : this._wheelYActionCoordinate;
  }
  /**
   * Set which movement axis (relative to the scene) the mouse wheel's Z axis
   * controls.
   * @param axis The axis to be moved. Set null to clear.
   */
  set wheelZMoveScene(e) {
    e === null && this._wheelZAction !== s.MoveScene || (this._wheelZAction = s.MoveScene, this._wheelZActionCoordinate = e);
  }
  /**
   * Get the configured movement axis (relative to the scene) the mouse wheel's
   * Z axis controls.
   * @returns The configured axis or null if none.
   */
  get wheelZMoveScene() {
    return this._wheelZAction !== s.MoveScene ? null : this._wheelZActionCoordinate;
  }
  /**
   * Called for each rendered frame.
   */
  checkInputs() {
    if (this._wheelDeltaX === 0 && this._wheelDeltaY === 0 && this._wheelDeltaZ == 0)
      return;
    this._moveRelative.setAll(0), this._rotateRelative.setAll(0), this._moveScene.setAll(0), this._updateCamera(), this.camera.getScene().useRightHandedSystem && (this._moveRelative.z *= -1);
    const e = O.Zero();
    this.camera.getViewMatrix().invertToRef(e);
    const t = h.Zero();
    h.TransformNormalToRef(this._moveRelative, e, t), this.camera.cameraRotation.x += this._rotateRelative.x / 200, this.camera.cameraRotation.y += this._rotateRelative.y / 200, this.camera.cameraDirection.addInPlace(t), this.camera.cameraDirection.addInPlace(this._moveScene), super.checkInputs();
  }
  /**
   * Update the camera according to any configured properties for the 3
   * mouse-wheel axis.
   */
  _updateCamera() {
    this._updateCameraProperty(this._wheelDeltaX, this._wheelXAction, this._wheelXActionCoordinate), this._updateCameraProperty(this._wheelDeltaY, this._wheelYAction, this._wheelYActionCoordinate), this._updateCameraProperty(this._wheelDeltaZ, this._wheelZAction, this._wheelZActionCoordinate);
  }
  /**
   * Update one property of the camera.
   * @param value
   * @param cameraProperty
   * @param coordinate
   */
  _updateCameraProperty(e, t, i) {
    if (e === 0 || t === null || i === null)
      return;
    let o = null;
    switch (t) {
      case s.MoveRelative:
        o = this._moveRelative;
        break;
      case s.RotateRelative:
        o = this._rotateRelative;
        break;
      case s.MoveScene:
        o = this._moveScene;
        break;
    }
    switch (i) {
      case y.X:
        o.set(e, 0, 0);
        break;
      case y.Y:
        o.set(0, e, 0);
        break;
      case y.Z:
        o.set(0, 0, e);
        break;
    }
  }
}
n([
  r()
], p.prototype, "wheelXMoveRelative", null);
n([
  r()
], p.prototype, "wheelYMoveRelative", null);
n([
  r()
], p.prototype, "wheelZMoveRelative", null);
n([
  r()
], p.prototype, "wheelXRotateRelative", null);
n([
  r()
], p.prototype, "wheelYRotateRelative", null);
n([
  r()
], p.prototype, "wheelZRotateRelative", null);
n([
  r()
], p.prototype, "wheelXMoveScene", null);
n([
  r()
], p.prototype, "wheelYMoveScene", null);
n([
  r()
], p.prototype, "wheelZMoveScene", null);
v.FreeCameraMouseWheelInput = p;
class w {
  /**
   * Manage the touch inputs to control the movement of a free camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
   * @param allowMouse Defines if mouse events can be treated as touch events
   */
  constructor(e = !1) {
    this.allowMouse = e, this.touchAngularSensibility = 2e5, this.touchMoveSensibility = 250, this.singleFingerRotate = !1, this._offsetX = null, this._offsetY = null, this._pointerPressed = new Array(), this._isSafari = f.IsSafari();
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e) {
    e = f.BackCompatCameraNoPreventDefault(arguments);
    let t = null;
    if (this._pointerInput === void 0 && (this._onLostFocus = () => {
      this._offsetX = null, this._offsetY = null;
    }, this._pointerInput = (i) => {
      const o = i.event, a = o.pointerType === "mouse" || this._isSafari && typeof o.pointerType > "u";
      if (!(!this.allowMouse && a)) {
        if (i.type === c.POINTERDOWN) {
          if (e || o.preventDefault(), this._pointerPressed.push(o.pointerId), this._pointerPressed.length !== 1)
            return;
          t = {
            x: o.clientX,
            y: o.clientY
          };
        } else if (i.type === c.POINTERUP) {
          e || o.preventDefault();
          const l = this._pointerPressed.indexOf(o.pointerId);
          if (l === -1 || (this._pointerPressed.splice(l, 1), l != 0))
            return;
          t = null, this._offsetX = null, this._offsetY = null;
        } else if (i.type === c.POINTERMOVE) {
          if (e || o.preventDefault(), !t || this._pointerPressed.indexOf(o.pointerId) != 0)
            return;
          this._offsetX = o.clientX - t.x, this._offsetY = -(o.clientY - t.y);
        }
      }
    }), this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver(this._pointerInput, c.POINTERDOWN | c.POINTERUP | c.POINTERMOVE), this._onLostFocus) {
      const o = this.camera.getEngine().getInputElement();
      o && o.addEventListener("blur", this._onLostFocus);
    }
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    if (this._pointerInput) {
      if (this._observer && (this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer), this._observer = null), this._onLostFocus) {
        const t = this.camera.getEngine().getInputElement();
        t && t.removeEventListener("blur", this._onLostFocus), this._onLostFocus = null;
      }
      this._pointerPressed.length = 0, this._offsetX = null, this._offsetY = null;
    }
  }
  /**
   * Update the current camera state depending on the inputs that have been used this frame.
   * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
   */
  checkInputs() {
    if (this._offsetX === null || this._offsetY === null || this._offsetX === 0 && this._offsetY === 0)
      return;
    const e = this.camera, t = e._calculateHandednessMultiplier();
    if (e.cameraRotation.y = t * this._offsetX / this.touchAngularSensibility, this.singleFingerRotate && this._pointerPressed.length === 1 || !this.singleFingerRotate && this._pointerPressed.length > 1)
      e.cameraRotation.x = -this._offsetY / this.touchAngularSensibility;
    else {
      const o = e._computeLocalCameraSpeed(), a = new h(0, 0, this.touchMoveSensibility !== 0 ? o * this._offsetY / this.touchMoveSensibility : 0);
      O.RotationYawPitchRollToRef(e.rotation.y, e.rotation.x, 0, e._cameraRotationMatrix), e.cameraDirection.addInPlace(h.TransformCoordinates(a, e._cameraRotationMatrix));
    }
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FreeCameraTouchInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "touch";
  }
}
n([
  r()
], w.prototype, "touchAngularSensibility", void 0);
n([
  r()
], w.prototype, "touchMoveSensibility", void 0);
v.FreeCameraTouchInput = w;
class X extends A {
  /**
   * Instantiates a new FreeCameraInputsManager.
   * @param camera Defines the camera the inputs belong to
   */
  constructor(e) {
    super(e), this._mouseInput = null, this._mouseWheelInput = null;
  }
  /**
   * Add keyboard input support to the input manager.
   * @returns the current input manager
   */
  addKeyboard() {
    return this.add(new d()), this;
  }
  /**
   * Add mouse input support to the input manager.
   * @param touchEnabled if the FreeCameraMouseInput should support touch (default: true)
   * @returns the current input manager
   */
  addMouse(e = !0) {
    return this._mouseInput || (this._mouseInput = new m(e), this.add(this._mouseInput)), this;
  }
  /**
   * Removes the mouse input support from the manager
   * @returns the current input manager
   */
  removeMouse() {
    return this._mouseInput && this.remove(this._mouseInput), this;
  }
  /**
   * Add mouse wheel input support to the input manager.
   * @returns the current input manager
   */
  addMouseWheel() {
    return this._mouseWheelInput || (this._mouseWheelInput = new p(), this.add(this._mouseWheelInput)), this;
  }
  /**
   * Removes the mouse wheel input support from the manager
   * @returns the current input manager
   */
  removeMouseWheel() {
    return this._mouseWheelInput && this.remove(this._mouseWheelInput), this;
  }
  /**
   * Add touch input support to the input manager.
   * @returns the current input manager
   */
  addTouch() {
    return this.add(new w()), this;
  }
  /**
   * Remove all attached input methods from a camera
   */
  clear() {
    super.clear(), this._mouseInput = null;
  }
}
class R extends S {
  /**
   * Gets the input sensibility for a mouse input. (default is 2000.0)
   * Higher values reduce sensitivity.
   */
  get angularSensibility() {
    const e = this.inputs.attached.mouse;
    return e ? e.angularSensibility : 0;
  }
  /**
   * Sets the input sensibility for a mouse input. (default is 2000.0)
   * Higher values reduce sensitivity.
   */
  set angularSensibility(e) {
    const t = this.inputs.attached.mouse;
    t && (t.angularSensibility = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the forward move of the camera.
   */
  get keysUp() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysUp : [];
  }
  set keysUp(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysUp = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the upward move of the camera.
   */
  get keysUpward() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysUpward : [];
  }
  set keysUpward(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysUpward = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the backward move of the camera.
   */
  get keysDown() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysDown : [];
  }
  set keysDown(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysDown = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the downward move of the camera.
   */
  get keysDownward() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysDownward : [];
  }
  set keysDownward(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysDownward = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the left strafe move of the camera.
   */
  get keysLeft() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysLeft : [];
  }
  set keysLeft(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysLeft = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the right strafe move of the camera.
   */
  get keysRight() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysRight : [];
  }
  set keysRight(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysRight = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the left rotation move of the camera.
   */
  get keysRotateLeft() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysRotateLeft : [];
  }
  set keysRotateLeft(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysRotateLeft = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the right rotation move of the camera.
   */
  get keysRotateRight() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysRotateRight : [];
  }
  set keysRotateRight(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysRotateRight = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the up rotation move of the camera.
   */
  get keysRotateUp() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysRotateUp : [];
  }
  set keysRotateUp(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysRotateUp = e);
  }
  /**
   * Gets or Set the list of keyboard keys used to control the down rotation move of the camera.
   */
  get keysRotateDown() {
    const e = this.inputs.attached.keyboard;
    return e ? e.keysRotateDown : [];
  }
  set keysRotateDown(e) {
    const t = this.inputs.attached.keyboard;
    t && (t.keysRotateDown = e);
  }
  /**
   * Instantiates a Free Camera.
   * This represents a free type of camera. It can be useful in First Person Shooter game for instance.
   * Please consider using the new UniversalCamera instead as it adds more functionality like touch to this camera.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#universal-camera
   * @param name Define the name of the camera in the scene
   * @param position Define the start position of the camera in the scene
   * @param scene Define the scene the camera belongs to
   * @param setActiveOnSceneIfNoneActive Defines whether the camera should be marked as active if not other active cameras have been defined
   */
  constructor(e, t, i, o = !0) {
    super(e, t, i, o), this.ellipsoid = new h(0.5, 1, 0.5), this.ellipsoidOffset = new h(0, 0, 0), this.checkCollisions = !1, this.applyGravity = !1, this._needMoveForGravity = !1, this._oldPosition = h.Zero(), this._diffPosition = h.Zero(), this._newPosition = h.Zero(), this._collisionMask = -1, this._onCollisionPositionChange = (a, l, _ = null) => {
      this._newPosition.copyFrom(l), this._newPosition.subtractToRef(this._oldPosition, this._diffPosition), this._diffPosition.length() > P.CollisionsEpsilon && (this.position.addToRef(this._diffPosition, this._deferredPositionUpdate), this._deferOnly ? this._deferredUpdated = !0 : this.position.copyFrom(this._deferredPositionUpdate), this.onCollide && _ && this.onCollide(_));
    }, this.inputs = new X(this), this.inputs.addKeyboard().addMouse();
  }
  /**
   * Attached controls to the current camera.
   * @param ignored defines an ignored parameter kept for backward compatibility.
   * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   */
  attachControl(e, t) {
    t = f.BackCompatCameraNoPreventDefault(arguments), this.inputs.attachElement(t);
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this.inputs.detachElement(), this.cameraDirection = new h(0, 0, 0), this.cameraRotation = new I(0, 0);
  }
  /**
   * Define a collision mask to limit the list of object the camera can collide with
   */
  get collisionMask() {
    return this._collisionMask;
  }
  set collisionMask(e) {
    this._collisionMask = isNaN(e) ? -1 : e;
  }
  /**
   * @internal
   */
  _collideWithWorld(e) {
    let t;
    this.parent ? t = h.TransformCoordinates(this.position, this.parent.getWorldMatrix()) : t = this.position, t.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition), this._oldPosition.addInPlace(this.ellipsoidOffset);
    const i = this.getScene().collisionCoordinator;
    this._collider || (this._collider = i.createCollider()), this._collider._radius = this.ellipsoid, this._collider.collisionMask = this._collisionMask;
    let o = e;
    this.applyGravity && (o = e.add(this.getScene().gravity)), i.getNewPosition(this._oldPosition, o, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
  }
  /** @internal */
  _checkInputs() {
    this._localDirection || (this._localDirection = h.Zero(), this._transformedDirection = h.Zero()), this.inputs.checkInputs(), super._checkInputs();
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
    return "FreeCamera";
  }
}
n([
  D()
], R.prototype, "ellipsoid", void 0);
n([
  D()
], R.prototype, "ellipsoidOffset", void 0);
n([
  r()
], R.prototype, "checkCollisions", void 0);
n([
  r()
], R.prototype, "applyGravity", void 0);
export {
  k as B,
  X as F,
  R as a,
  d as b,
  m as c,
  p as d,
  w as e
};
//# sourceMappingURL=freeCamera-Cu_299A-.js.map
