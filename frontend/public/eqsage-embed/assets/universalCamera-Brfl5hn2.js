import { F as P, a as C } from "./freeCamera-Ck5f6hvq.js";
import { O as h, a8 as k, T as A, M as v, a as p, g as R, b as g, c } from "./embed-entry-Bb6cfUYP.js";
import { N as S } from "./node-DDdHG9Gc.js";
import { C as L } from "./camera-Bftgmroh.js";
import { a as M, S as m } from "./scene-81J9Z4aI.js";
import { E as B } from "./engine-Br2P72Us.js";
import { C as G } from "./cameraInputsManager-BaKFkt7F.js";
import { A as x } from "./arcRotateCameraInputsManager-D9vK1NlN.js";
class Z {
  /**
   * Initializes the gamepad x and y control stick values
   * @param x The x component of the gamepad control stick value
   * @param y The y component of the gamepad control stick value
   */
  constructor(t, e) {
    this.x = t, this.y = e;
  }
}
class n {
  /**
   * Specifies if the gamepad has been connected
   */
  get isConnected() {
    return this._isConnected;
  }
  /**
   * Initializes the gamepad
   * @param id The id of the gamepad
   * @param index The index of the gamepad
   * @param browserGamepad The browser gamepad
   * @param leftStickX The x component of the left joystick
   * @param leftStickY The y component of the left joystick
   * @param rightStickX The x component of the right joystick
   * @param rightStickY The y component of the right joystick
   */
  constructor(t, e, i, a = 0, d = 1, y = 2, O = 3) {
    this.id = t, this.index = e, this.browserGamepad = i, this._leftStick = { x: 0, y: 0 }, this._rightStick = { x: 0, y: 0 }, this._isConnected = !0, this._invertLeftStickY = !1, this.type = n.GAMEPAD, this._leftStickAxisX = a, this._leftStickAxisY = d, this._rightStickAxisX = y, this._rightStickAxisY = O, this.browserGamepad.axes.length >= 2 && (this._leftStick = { x: this.browserGamepad.axes[this._leftStickAxisX], y: this.browserGamepad.axes[this._leftStickAxisY] }), this.browserGamepad.axes.length >= 4 && (this._rightStick = { x: this.browserGamepad.axes[this._rightStickAxisX], y: this.browserGamepad.axes[this._rightStickAxisY] });
  }
  /**
   * Callback triggered when the left joystick has changed
   * @param callback callback to trigger
   */
  onleftstickchanged(t) {
    this._onleftstickchanged = t;
  }
  /**
   * Callback triggered when the right joystick has changed
   * @param callback callback to trigger
   */
  onrightstickchanged(t) {
    this._onrightstickchanged = t;
  }
  /**
   * Gets the left joystick
   */
  get leftStick() {
    return this._leftStick;
  }
  /**
   * Sets the left joystick values
   */
  set leftStick(t) {
    this._onleftstickchanged && (this._leftStick.x !== t.x || this._leftStick.y !== t.y) && this._onleftstickchanged(t), this._leftStick = t;
  }
  /**
   * Gets the right joystick
   */
  get rightStick() {
    return this._rightStick;
  }
  /**
   * Sets the right joystick value
   */
  set rightStick(t) {
    this._onrightstickchanged && (this._rightStick.x !== t.x || this._rightStick.y !== t.y) && this._onrightstickchanged(t), this._rightStick = t;
  }
  /**
   * Updates the gamepad joystick positions
   */
  update() {
    this._leftStick && (this.leftStick = { x: this.browserGamepad.axes[this._leftStickAxisX], y: this.browserGamepad.axes[this._leftStickAxisY] }, this._invertLeftStickY && (this.leftStick.y *= -1)), this._rightStick && (this.rightStick = { x: this.browserGamepad.axes[this._rightStickAxisX], y: this.browserGamepad.axes[this._rightStickAxisY] });
  }
  /**
   * Disposes the gamepad
   */
  dispose() {
  }
}
n.GAMEPAD = 0;
n.GENERIC = 1;
n.XBOX = 2;
n.POSE_ENABLED = 3;
n.DUALSHOCK = 4;
class T extends n {
  /**
   * Callback triggered when a button has been pressed
   * @param callback Called when a button has been pressed
   */
  onbuttondown(t) {
    this._onbuttondown = t;
  }
  /**
   * Callback triggered when a button has been released
   * @param callback Called when a button has been released
   */
  onbuttonup(t) {
    this._onbuttonup = t;
  }
  /**
   * Initializes the generic gamepad
   * @param id The id of the generic gamepad
   * @param index The index of the generic gamepad
   * @param browserGamepad The browser gamepad
   */
  constructor(t, e, i) {
    super(t, e, i), this.onButtonDownObservable = new h(), this.onButtonUpObservable = new h(), this.type = n.GENERIC, this._buttons = new Array(i.buttons.length);
  }
  _setButtonValue(t, e, i) {
    return t !== e && (t === 1 && (this._onbuttondown && this._onbuttondown(i), this.onButtonDownObservable.notifyObservers(i)), t === 0 && (this._onbuttonup && this._onbuttonup(i), this.onButtonUpObservable.notifyObservers(i))), t;
  }
  /**
   * Updates the generic gamepad
   */
  update() {
    super.update();
    for (let t = 0; t < this._buttons.length; t++)
      this._buttons[t] = this._setButtonValue(this.browserGamepad.buttons[t].value, this._buttons[t], t);
  }
  /**
   * Disposes the generic gamepad
   */
  dispose() {
    super.dispose(), this.onButtonDownObservable.clear(), this.onButtonUpObservable.clear();
  }
}
var o;
(function(s) {
  s[s.A = 0] = "A", s[s.B = 1] = "B", s[s.X = 2] = "X", s[s.Y = 3] = "Y", s[s.LB = 4] = "LB", s[s.RB = 5] = "RB", s[s.Back = 8] = "Back", s[s.Start = 9] = "Start", s[s.LeftStick = 10] = "LeftStick", s[s.RightStick = 11] = "RightStick";
})(o || (o = {}));
var u;
(function(s) {
  s[s.Up = 12] = "Up", s[s.Down = 13] = "Down", s[s.Left = 14] = "Left", s[s.Right = 15] = "Right";
})(u || (u = {}));
class E extends n {
  /**
   * Creates a new XBox360 gamepad object
   * @param id defines the id of this gamepad
   * @param index defines its index
   * @param gamepad defines the internal HTML gamepad object
   * @param xboxOne defines if it is a XBox One gamepad
   */
  constructor(t, e, i, a = !1) {
    super(t, e, i, 0, 1, 2, 3), this._leftTrigger = 0, this._rightTrigger = 0, this.onButtonDownObservable = new h(), this.onButtonUpObservable = new h(), this.onPadDownObservable = new h(), this.onPadUpObservable = new h(), this._buttonA = 0, this._buttonB = 0, this._buttonX = 0, this._buttonY = 0, this._buttonBack = 0, this._buttonStart = 0, this._buttonLB = 0, this._buttonRB = 0, this._buttonLeftStick = 0, this._buttonRightStick = 0, this._dPadUp = 0, this._dPadDown = 0, this._dPadLeft = 0, this._dPadRight = 0, this._isXboxOnePad = !1, this.type = n.XBOX, this._isXboxOnePad = a;
  }
  /**
   * Defines the callback to call when left trigger is pressed
   * @param callback defines the callback to use
   */
  onlefttriggerchanged(t) {
    this._onlefttriggerchanged = t;
  }
  /**
   * Defines the callback to call when right trigger is pressed
   * @param callback defines the callback to use
   */
  onrighttriggerchanged(t) {
    this._onrighttriggerchanged = t;
  }
  /**
   * Gets the left trigger value
   */
  get leftTrigger() {
    return this._leftTrigger;
  }
  /**
   * Sets the left trigger value
   */
  set leftTrigger(t) {
    this._onlefttriggerchanged && this._leftTrigger !== t && this._onlefttriggerchanged(t), this._leftTrigger = t;
  }
  /**
   * Gets the right trigger value
   */
  get rightTrigger() {
    return this._rightTrigger;
  }
  /**
   * Sets the right trigger value
   */
  set rightTrigger(t) {
    this._onrighttriggerchanged && this._rightTrigger !== t && this._onrighttriggerchanged(t), this._rightTrigger = t;
  }
  /**
   * Defines the callback to call when a button is pressed
   * @param callback defines the callback to use
   */
  onbuttondown(t) {
    this._onbuttondown = t;
  }
  /**
   * Defines the callback to call when a button is released
   * @param callback defines the callback to use
   */
  onbuttonup(t) {
    this._onbuttonup = t;
  }
  /**
   * Defines the callback to call when a pad is pressed
   * @param callback defines the callback to use
   */
  ondpaddown(t) {
    this._ondpaddown = t;
  }
  /**
   * Defines the callback to call when a pad is released
   * @param callback defines the callback to use
   */
  ondpadup(t) {
    this._ondpadup = t;
  }
  _setButtonValue(t, e, i) {
    return t !== e && (t === 1 && (this._onbuttondown && this._onbuttondown(i), this.onButtonDownObservable.notifyObservers(i)), t === 0 && (this._onbuttonup && this._onbuttonup(i), this.onButtonUpObservable.notifyObservers(i))), t;
  }
  _setDPadValue(t, e, i) {
    return t !== e && (t === 1 && (this._ondpaddown && this._ondpaddown(i), this.onPadDownObservable.notifyObservers(i)), t === 0 && (this._ondpadup && this._ondpadup(i), this.onPadUpObservable.notifyObservers(i))), t;
  }
  /**
   * Gets the value of the `A` button
   */
  get buttonA() {
    return this._buttonA;
  }
  /**
   * Sets the value of the `A` button
   */
  set buttonA(t) {
    this._buttonA = this._setButtonValue(t, this._buttonA, o.A);
  }
  /**
   * Gets the value of the `B` button
   */
  get buttonB() {
    return this._buttonB;
  }
  /**
   * Sets the value of the `B` button
   */
  set buttonB(t) {
    this._buttonB = this._setButtonValue(t, this._buttonB, o.B);
  }
  /**
   * Gets the value of the `X` button
   */
  get buttonX() {
    return this._buttonX;
  }
  /**
   * Sets the value of the `X` button
   */
  set buttonX(t) {
    this._buttonX = this._setButtonValue(t, this._buttonX, o.X);
  }
  /**
   * Gets the value of the `Y` button
   */
  get buttonY() {
    return this._buttonY;
  }
  /**
   * Sets the value of the `Y` button
   */
  set buttonY(t) {
    this._buttonY = this._setButtonValue(t, this._buttonY, o.Y);
  }
  /**
   * Gets the value of the `Start` button
   */
  get buttonStart() {
    return this._buttonStart;
  }
  /**
   * Sets the value of the `Start` button
   */
  set buttonStart(t) {
    this._buttonStart = this._setButtonValue(t, this._buttonStart, o.Start);
  }
  /**
   * Gets the value of the `Back` button
   */
  get buttonBack() {
    return this._buttonBack;
  }
  /**
   * Sets the value of the `Back` button
   */
  set buttonBack(t) {
    this._buttonBack = this._setButtonValue(t, this._buttonBack, o.Back);
  }
  /**
   * Gets the value of the `Left` button
   */
  get buttonLB() {
    return this._buttonLB;
  }
  /**
   * Sets the value of the `Left` button
   */
  set buttonLB(t) {
    this._buttonLB = this._setButtonValue(t, this._buttonLB, o.LB);
  }
  /**
   * Gets the value of the `Right` button
   */
  get buttonRB() {
    return this._buttonRB;
  }
  /**
   * Sets the value of the `Right` button
   */
  set buttonRB(t) {
    this._buttonRB = this._setButtonValue(t, this._buttonRB, o.RB);
  }
  /**
   * Gets the value of the Left joystick
   */
  get buttonLeftStick() {
    return this._buttonLeftStick;
  }
  /**
   * Sets the value of the Left joystick
   */
  set buttonLeftStick(t) {
    this._buttonLeftStick = this._setButtonValue(t, this._buttonLeftStick, o.LeftStick);
  }
  /**
   * Gets the value of the Right joystick
   */
  get buttonRightStick() {
    return this._buttonRightStick;
  }
  /**
   * Sets the value of the Right joystick
   */
  set buttonRightStick(t) {
    this._buttonRightStick = this._setButtonValue(t, this._buttonRightStick, o.RightStick);
  }
  /**
   * Gets the value of D-pad up
   */
  get dPadUp() {
    return this._dPadUp;
  }
  /**
   * Sets the value of D-pad up
   */
  set dPadUp(t) {
    this._dPadUp = this._setDPadValue(t, this._dPadUp, u.Up);
  }
  /**
   * Gets the value of D-pad down
   */
  get dPadDown() {
    return this._dPadDown;
  }
  /**
   * Sets the value of D-pad down
   */
  set dPadDown(t) {
    this._dPadDown = this._setDPadValue(t, this._dPadDown, u.Down);
  }
  /**
   * Gets the value of D-pad left
   */
  get dPadLeft() {
    return this._dPadLeft;
  }
  /**
   * Sets the value of D-pad left
   */
  set dPadLeft(t) {
    this._dPadLeft = this._setDPadValue(t, this._dPadLeft, u.Left);
  }
  /**
   * Gets the value of D-pad right
   */
  get dPadRight() {
    return this._dPadRight;
  }
  /**
   * Sets the value of D-pad right
   */
  set dPadRight(t) {
    this._dPadRight = this._setDPadValue(t, this._dPadRight, u.Right);
  }
  /**
   * Force the gamepad to synchronize with device values
   */
  update() {
    super.update(), this._isXboxOnePad ? (this.buttonA = this.browserGamepad.buttons[0].value, this.buttonB = this.browserGamepad.buttons[1].value, this.buttonX = this.browserGamepad.buttons[2].value, this.buttonY = this.browserGamepad.buttons[3].value, this.buttonLB = this.browserGamepad.buttons[4].value, this.buttonRB = this.browserGamepad.buttons[5].value, this.leftTrigger = this.browserGamepad.buttons[6].value, this.rightTrigger = this.browserGamepad.buttons[7].value, this.buttonBack = this.browserGamepad.buttons[8].value, this.buttonStart = this.browserGamepad.buttons[9].value, this.buttonLeftStick = this.browserGamepad.buttons[10].value, this.buttonRightStick = this.browserGamepad.buttons[11].value, this.dPadUp = this.browserGamepad.buttons[12].value, this.dPadDown = this.browserGamepad.buttons[13].value, this.dPadLeft = this.browserGamepad.buttons[14].value, this.dPadRight = this.browserGamepad.buttons[15].value) : (this.buttonA = this.browserGamepad.buttons[0].value, this.buttonB = this.browserGamepad.buttons[1].value, this.buttonX = this.browserGamepad.buttons[2].value, this.buttonY = this.browserGamepad.buttons[3].value, this.buttonLB = this.browserGamepad.buttons[4].value, this.buttonRB = this.browserGamepad.buttons[5].value, this.leftTrigger = this.browserGamepad.buttons[6].value, this.rightTrigger = this.browserGamepad.buttons[7].value, this.buttonBack = this.browserGamepad.buttons[8].value, this.buttonStart = this.browserGamepad.buttons[9].value, this.buttonLeftStick = this.browserGamepad.buttons[10].value, this.buttonRightStick = this.browserGamepad.buttons[11].value, this.dPadUp = this.browserGamepad.buttons[12].value, this.dPadDown = this.browserGamepad.buttons[13].value, this.dPadLeft = this.browserGamepad.buttons[14].value, this.dPadRight = this.browserGamepad.buttons[15].value);
  }
  /**
   * Disposes the gamepad
   */
  dispose() {
    super.dispose(), this.onButtonDownObservable.clear(), this.onButtonUpObservable.clear(), this.onPadDownObservable.clear(), this.onPadUpObservable.clear();
  }
}
var r;
(function(s) {
  s[s.Cross = 0] = "Cross", s[s.Circle = 1] = "Circle", s[s.Square = 2] = "Square", s[s.Triangle = 3] = "Triangle", s[s.L1 = 4] = "L1", s[s.R1 = 5] = "R1", s[s.Share = 8] = "Share", s[s.Options = 9] = "Options", s[s.LeftStick = 10] = "LeftStick", s[s.RightStick = 11] = "RightStick";
})(r || (r = {}));
var b;
(function(s) {
  s[s.Up = 12] = "Up", s[s.Down = 13] = "Down", s[s.Left = 14] = "Left", s[s.Right = 15] = "Right";
})(b || (b = {}));
class D extends n {
  /**
   * Creates a new DualShock gamepad object
   * @param id defines the id of this gamepad
   * @param index defines its index
   * @param gamepad defines the internal HTML gamepad object
   */
  constructor(t, e, i) {
    super(t.replace("STANDARD GAMEPAD", "SONY PLAYSTATION DUALSHOCK"), e, i, 0, 1, 2, 3), this._leftTrigger = 0, this._rightTrigger = 0, this.onButtonDownObservable = new h(), this.onButtonUpObservable = new h(), this.onPadDownObservable = new h(), this.onPadUpObservable = new h(), this._buttonCross = 0, this._buttonCircle = 0, this._buttonSquare = 0, this._buttonTriangle = 0, this._buttonShare = 0, this._buttonOptions = 0, this._buttonL1 = 0, this._buttonR1 = 0, this._buttonLeftStick = 0, this._buttonRightStick = 0, this._dPadUp = 0, this._dPadDown = 0, this._dPadLeft = 0, this._dPadRight = 0, this.type = n.DUALSHOCK;
  }
  /**
   * Defines the callback to call when left trigger is pressed
   * @param callback defines the callback to use
   */
  onlefttriggerchanged(t) {
    this._onlefttriggerchanged = t;
  }
  /**
   * Defines the callback to call when right trigger is pressed
   * @param callback defines the callback to use
   */
  onrighttriggerchanged(t) {
    this._onrighttriggerchanged = t;
  }
  /**
   * Gets the left trigger value
   */
  get leftTrigger() {
    return this._leftTrigger;
  }
  /**
   * Sets the left trigger value
   */
  set leftTrigger(t) {
    this._onlefttriggerchanged && this._leftTrigger !== t && this._onlefttriggerchanged(t), this._leftTrigger = t;
  }
  /**
   * Gets the right trigger value
   */
  get rightTrigger() {
    return this._rightTrigger;
  }
  /**
   * Sets the right trigger value
   */
  set rightTrigger(t) {
    this._onrighttriggerchanged && this._rightTrigger !== t && this._onrighttriggerchanged(t), this._rightTrigger = t;
  }
  /**
   * Defines the callback to call when a button is pressed
   * @param callback defines the callback to use
   */
  onbuttondown(t) {
    this._onbuttondown = t;
  }
  /**
   * Defines the callback to call when a button is released
   * @param callback defines the callback to use
   */
  onbuttonup(t) {
    this._onbuttonup = t;
  }
  /**
   * Defines the callback to call when a pad is pressed
   * @param callback defines the callback to use
   */
  ondpaddown(t) {
    this._ondpaddown = t;
  }
  /**
   * Defines the callback to call when a pad is released
   * @param callback defines the callback to use
   */
  ondpadup(t) {
    this._ondpadup = t;
  }
  _setButtonValue(t, e, i) {
    return t !== e && (t === 1 && (this._onbuttondown && this._onbuttondown(i), this.onButtonDownObservable.notifyObservers(i)), t === 0 && (this._onbuttonup && this._onbuttonup(i), this.onButtonUpObservable.notifyObservers(i))), t;
  }
  _setDPadValue(t, e, i) {
    return t !== e && (t === 1 && (this._ondpaddown && this._ondpaddown(i), this.onPadDownObservable.notifyObservers(i)), t === 0 && (this._ondpadup && this._ondpadup(i), this.onPadUpObservable.notifyObservers(i))), t;
  }
  /**
   * Gets the value of the `Cross` button
   */
  get buttonCross() {
    return this._buttonCross;
  }
  /**
   * Sets the value of the `Cross` button
   */
  set buttonCross(t) {
    this._buttonCross = this._setButtonValue(t, this._buttonCross, r.Cross);
  }
  /**
   * Gets the value of the `Circle` button
   */
  get buttonCircle() {
    return this._buttonCircle;
  }
  /**
   * Sets the value of the `Circle` button
   */
  set buttonCircle(t) {
    this._buttonCircle = this._setButtonValue(t, this._buttonCircle, r.Circle);
  }
  /**
   * Gets the value of the `Square` button
   */
  get buttonSquare() {
    return this._buttonSquare;
  }
  /**
   * Sets the value of the `Square` button
   */
  set buttonSquare(t) {
    this._buttonSquare = this._setButtonValue(t, this._buttonSquare, r.Square);
  }
  /**
   * Gets the value of the `Triangle` button
   */
  get buttonTriangle() {
    return this._buttonTriangle;
  }
  /**
   * Sets the value of the `Triangle` button
   */
  set buttonTriangle(t) {
    this._buttonTriangle = this._setButtonValue(t, this._buttonTriangle, r.Triangle);
  }
  /**
   * Gets the value of the `Options` button
   */
  get buttonOptions() {
    return this._buttonOptions;
  }
  /**
   * Sets the value of the `Options` button
   */
  set buttonOptions(t) {
    this._buttonOptions = this._setButtonValue(t, this._buttonOptions, r.Options);
  }
  /**
   * Gets the value of the `Share` button
   */
  get buttonShare() {
    return this._buttonShare;
  }
  /**
   * Sets the value of the `Share` button
   */
  set buttonShare(t) {
    this._buttonShare = this._setButtonValue(t, this._buttonShare, r.Share);
  }
  /**
   * Gets the value of the `L1` button
   */
  get buttonL1() {
    return this._buttonL1;
  }
  /**
   * Sets the value of the `L1` button
   */
  set buttonL1(t) {
    this._buttonL1 = this._setButtonValue(t, this._buttonL1, r.L1);
  }
  /**
   * Gets the value of the `R1` button
   */
  get buttonR1() {
    return this._buttonR1;
  }
  /**
   * Sets the value of the `R1` button
   */
  set buttonR1(t) {
    this._buttonR1 = this._setButtonValue(t, this._buttonR1, r.R1);
  }
  /**
   * Gets the value of the Left joystick
   */
  get buttonLeftStick() {
    return this._buttonLeftStick;
  }
  /**
   * Sets the value of the Left joystick
   */
  set buttonLeftStick(t) {
    this._buttonLeftStick = this._setButtonValue(t, this._buttonLeftStick, r.LeftStick);
  }
  /**
   * Gets the value of the Right joystick
   */
  get buttonRightStick() {
    return this._buttonRightStick;
  }
  /**
   * Sets the value of the Right joystick
   */
  set buttonRightStick(t) {
    this._buttonRightStick = this._setButtonValue(t, this._buttonRightStick, r.RightStick);
  }
  /**
   * Gets the value of D-pad up
   */
  get dPadUp() {
    return this._dPadUp;
  }
  /**
   * Sets the value of D-pad up
   */
  set dPadUp(t) {
    this._dPadUp = this._setDPadValue(t, this._dPadUp, b.Up);
  }
  /**
   * Gets the value of D-pad down
   */
  get dPadDown() {
    return this._dPadDown;
  }
  /**
   * Sets the value of D-pad down
   */
  set dPadDown(t) {
    this._dPadDown = this._setDPadValue(t, this._dPadDown, b.Down);
  }
  /**
   * Gets the value of D-pad left
   */
  get dPadLeft() {
    return this._dPadLeft;
  }
  /**
   * Sets the value of D-pad left
   */
  set dPadLeft(t) {
    this._dPadLeft = this._setDPadValue(t, this._dPadLeft, b.Left);
  }
  /**
   * Gets the value of D-pad right
   */
  get dPadRight() {
    return this._dPadRight;
  }
  /**
   * Sets the value of D-pad right
   */
  set dPadRight(t) {
    this._dPadRight = this._setDPadValue(t, this._dPadRight, b.Right);
  }
  /**
   * Force the gamepad to synchronize with device values
   */
  update() {
    super.update(), this.buttonCross = this.browserGamepad.buttons[0].value, this.buttonCircle = this.browserGamepad.buttons[1].value, this.buttonSquare = this.browserGamepad.buttons[2].value, this.buttonTriangle = this.browserGamepad.buttons[3].value, this.buttonL1 = this.browserGamepad.buttons[4].value, this.buttonR1 = this.browserGamepad.buttons[5].value, this.leftTrigger = this.browserGamepad.buttons[6].value, this.rightTrigger = this.browserGamepad.buttons[7].value, this.buttonShare = this.browserGamepad.buttons[8].value, this.buttonOptions = this.browserGamepad.buttons[9].value, this.buttonLeftStick = this.browserGamepad.buttons[10].value, this.buttonRightStick = this.browserGamepad.buttons[11].value, this.dPadUp = this.browserGamepad.buttons[12].value, this.dPadDown = this.browserGamepad.buttons[13].value, this.dPadLeft = this.browserGamepad.buttons[14].value, this.dPadRight = this.browserGamepad.buttons[15].value;
  }
  /**
   * Disposes the gamepad
   */
  dispose() {
    super.dispose(), this.onButtonDownObservable.clear(), this.onButtonUpObservable.clear(), this.onPadDownObservable.clear(), this.onPadUpObservable.clear();
  }
}
class U {
  /**
   * Initializes the gamepad manager
   * @param _scene BabylonJS scene
   */
  constructor(t) {
    if (this._scene = t, this._babylonGamepads = [], this._oneGamepadConnected = !1, this._isMonitoring = !1, this.onGamepadDisconnectedObservable = new h(), k() ? (this._gamepadEventSupported = "GamepadEvent" in window, this._gamepadSupport = navigator && navigator.getGamepads) : this._gamepadEventSupported = !1, this.onGamepadConnectedObservable = new h((e) => {
      for (const i in this._babylonGamepads) {
        const a = this._babylonGamepads[i];
        a && a._isConnected && this.onGamepadConnectedObservable.notifyObserver(e, a);
      }
    }), this._onGamepadConnectedEvent = (e) => {
      const i = e.gamepad;
      if (i.index in this._babylonGamepads && this._babylonGamepads[i.index].isConnected)
        return;
      let a;
      this._babylonGamepads[i.index] ? (a = this._babylonGamepads[i.index], a.browserGamepad = i, a._isConnected = !0) : a = this._addNewGamepad(i), this.onGamepadConnectedObservable.notifyObservers(a), this._startMonitoringGamepads();
    }, this._onGamepadDisconnectedEvent = (e) => {
      const i = e.gamepad;
      for (const a in this._babylonGamepads)
        if (this._babylonGamepads[a].index === i.index) {
          const d = this._babylonGamepads[a];
          d._isConnected = !1, this.onGamepadDisconnectedObservable.notifyObservers(d), d.dispose && d.dispose();
          break;
        }
    }, this._gamepadSupport)
      if (this._updateGamepadObjects(), this._babylonGamepads.length && this._startMonitoringGamepads(), this._gamepadEventSupported) {
        const e = this._scene ? this._scene.getEngine().getHostWindow() : window;
        e && (e.addEventListener("gamepadconnected", this._onGamepadConnectedEvent, !1), e.addEventListener("gamepaddisconnected", this._onGamepadDisconnectedEvent, !1));
      } else
        this._startMonitoringGamepads();
  }
  /**
   * The gamepads in the game pad manager
   */
  get gamepads() {
    return this._babylonGamepads;
  }
  /**
   * Get the gamepad controllers based on type
   * @param type The type of gamepad controller
   * @returns Nullable gamepad
   */
  getGamepadByType(t = n.XBOX) {
    for (const e of this._babylonGamepads)
      if (e && e.type === t)
        return e;
    return null;
  }
  /**
   * Disposes the gamepad manager
   */
  dispose() {
    this._gamepadEventSupported && (this._onGamepadConnectedEvent && window.removeEventListener("gamepadconnected", this._onGamepadConnectedEvent), this._onGamepadDisconnectedEvent && window.removeEventListener("gamepaddisconnected", this._onGamepadDisconnectedEvent), this._onGamepadConnectedEvent = null, this._onGamepadDisconnectedEvent = null), this._babylonGamepads.forEach((t) => {
      t.dispose();
    }), this.onGamepadConnectedObservable.clear(), this.onGamepadDisconnectedObservable.clear(), this._oneGamepadConnected = !1, this._stopMonitoringGamepads(), this._babylonGamepads = [];
  }
  _addNewGamepad(t) {
    this._oneGamepadConnected || (this._oneGamepadConnected = !0);
    let e;
    const i = t.id.search("054c") !== -1 && t.id.search("0ce6") === -1, a = t.id.search("Xbox One") !== -1;
    return a || t.id.search("Xbox 360") !== -1 || t.id.search("xinput") !== -1 || t.id.search("045e") !== -1 && t.id.search("Surface Dock") === -1 ? e = new E(t.id, t.index, t, a) : i ? e = new D(t.id, t.index, t) : e = new T(t.id, t.index, t), this._babylonGamepads[e.index] = e, e;
  }
  _startMonitoringGamepads() {
    this._isMonitoring || (this._isMonitoring = !0, this._checkGamepadsStatus());
  }
  _stopMonitoringGamepads() {
    this._isMonitoring = !1;
  }
  /** @internal */
  _checkGamepadsStatus() {
    this._updateGamepadObjects();
    for (const t in this._babylonGamepads) {
      const e = this._babylonGamepads[t];
      if (!(!e || !e.isConnected))
        try {
          e.update();
        } catch {
          this._loggedErrors.indexOf(e.index) === -1 && (A.Warn(`Error updating gamepad ${e.id}`), this._loggedErrors.push(e.index));
        }
    }
    this._isMonitoring && B.QueueNewFrame(() => {
      this._checkGamepadsStatus();
    });
  }
  // This function is called only on Chrome, which does not properly support
  // connection/disconnection events and forces you to recopy again the gamepad object
  _updateGamepadObjects() {
    const t = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let e = 0; e < t.length; e++) {
      const i = t[e];
      if (i)
        if (this._babylonGamepads[i.index])
          this._babylonGamepads[e].browserGamepad = i, this._babylonGamepads[e].isConnected || (this._babylonGamepads[e]._isConnected = !0, this.onGamepadConnectedObservable.notifyObservers(this._babylonGamepads[e]));
        else {
          const a = this._addNewGamepad(i);
          this.onGamepadConnectedObservable.notifyObservers(a);
        }
    }
  }
}
class _ {
  constructor() {
    this.gamepadAngularSensibility = 200, this.gamepadMoveSensibility = 40, this.deadzoneDelta = 0.1, this._yAxisScale = 1, this._cameraTransform = v.Identity(), this._deltaTransform = p.Zero(), this._vector3 = p.Zero(), this._vector2 = R.Zero();
  }
  /**
   * Gets or sets a boolean indicating that Yaxis (for right stick) should be inverted
   */
  get invertYAxis() {
    return this._yAxisScale !== 1;
  }
  set invertYAxis(t) {
    this._yAxisScale = t ? -1 : 1;
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   */
  attachControl() {
    const t = this.camera.getScene().gamepadManager;
    this._onGamepadConnectedObserver = t.onGamepadConnectedObservable.add((e) => {
      e.type !== n.POSE_ENABLED && (!this.gamepad || e.type === n.XBOX) && (this.gamepad = e);
    }), this._onGamepadDisconnectedObserver = t.onGamepadDisconnectedObservable.add((e) => {
      this.gamepad === e && (this.gamepad = null);
    }), this.gamepad = t.getGamepadByType(n.XBOX), !this.gamepad && t.gamepads.length && (this.gamepad = t.gamepads[0]);
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this.camera.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver), this.camera.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver), this.gamepad = null;
  }
  /**
   * Update the current camera state depending on the inputs that have been used this frame.
   * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
   */
  checkInputs() {
    if (this.gamepad && this.gamepad.leftStick) {
      const t = this.camera, e = this.gamepad.leftStick;
      this.gamepadMoveSensibility !== 0 && (e.x = Math.abs(e.x) > this.deadzoneDelta ? e.x / this.gamepadMoveSensibility : 0, e.y = Math.abs(e.y) > this.deadzoneDelta ? e.y / this.gamepadMoveSensibility : 0);
      let i = this.gamepad.rightStick;
      i && this.gamepadAngularSensibility !== 0 ? (i.x = Math.abs(i.x) > this.deadzoneDelta ? i.x / this.gamepadAngularSensibility : 0, i.y = (Math.abs(i.y) > this.deadzoneDelta ? i.y / this.gamepadAngularSensibility : 0) * this._yAxisScale) : i = { x: 0, y: 0 }, t.rotationQuaternion ? t.rotationQuaternion.toRotationMatrix(this._cameraTransform) : v.RotationYawPitchRollToRef(t.rotation.y, t.rotation.x, 0, this._cameraTransform);
      const a = t._computeLocalCameraSpeed() * 50;
      this._vector3.copyFromFloats(e.x * a, 0, -e.y * a), p.TransformCoordinatesToRef(this._vector3, this._cameraTransform, this._deltaTransform), t.cameraDirection.addInPlace(this._deltaTransform), this._vector2.copyFromFloats(i.y, i.x), t.cameraRotation.addInPlace(this._vector2);
    }
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FreeCameraGamepadInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "gamepad";
  }
}
g([
  c()
], _.prototype, "gamepadAngularSensibility", void 0);
g([
  c()
], _.prototype, "gamepadMoveSensibility", void 0);
G.FreeCameraGamepadInput = _;
class l {
  constructor() {
    this.gamepadRotationSensibility = 80, this.gamepadMoveSensibility = 40, this._yAxisScale = 1;
  }
  /**
   * Gets or sets a boolean indicating that Yaxis (for right stick) should be inverted
   */
  get invertYAxis() {
    return this._yAxisScale !== 1;
  }
  set invertYAxis(t) {
    this._yAxisScale = t ? -1 : 1;
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   */
  attachControl() {
    const t = this.camera.getScene().gamepadManager;
    this._onGamepadConnectedObserver = t.onGamepadConnectedObservable.add((e) => {
      e.type !== n.POSE_ENABLED && (!this.gamepad || e.type === n.XBOX) && (this.gamepad = e);
    }), this._onGamepadDisconnectedObserver = t.onGamepadDisconnectedObservable.add((e) => {
      this.gamepad === e && (this.gamepad = null);
    }), this.gamepad = t.getGamepadByType(n.XBOX), !this.gamepad && t.gamepads.length && (this.gamepad = t.gamepads[0]);
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    this.camera.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver), this.camera.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver), this.gamepad = null;
  }
  /**
   * Update the current camera state depending on the inputs that have been used this frame.
   * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
   */
  checkInputs() {
    if (this.gamepad) {
      const t = this.camera, e = this.gamepad.rightStick;
      if (e) {
        if (e.x != 0) {
          const a = e.x / this.gamepadRotationSensibility;
          a != 0 && Math.abs(a) > 5e-3 && (t.inertialAlphaOffset += a);
        }
        if (e.y != 0) {
          const a = e.y / this.gamepadRotationSensibility * this._yAxisScale;
          a != 0 && Math.abs(a) > 5e-3 && (t.inertialBetaOffset += a);
        }
      }
      const i = this.gamepad.leftStick;
      if (i && i.y != 0) {
        const a = i.y / this.gamepadMoveSensibility;
        a != 0 && Math.abs(a) > 5e-3 && (this.camera.inertialRadiusOffset -= a);
      }
    }
  }
  /**
   * Gets the class name of the current intput.
   * @returns the class name
   */
  getClassName() {
    return "ArcRotateCameraGamepadInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "gamepad";
  }
}
g([
  c()
], l.prototype, "gamepadRotationSensibility", void 0);
g([
  c()
], l.prototype, "gamepadMoveSensibility", void 0);
G.ArcRotateCameraGamepadInput = l;
Object.defineProperty(M.prototype, "gamepadManager", {
  get: function() {
    if (!this._gamepadManager) {
      this._gamepadManager = new U(this);
      let s = this._getComponent(m.NAME_GAMEPAD);
      s || (s = new Y(this), this._addComponent(s));
    }
    return this._gamepadManager;
  },
  enumerable: !0,
  configurable: !0
});
P.prototype.addGamepad = function() {
  return this.add(new _()), this;
};
x.prototype.addGamepad = function() {
  return this.add(new l()), this;
};
class Y {
  /**
   * Creates a new instance of the component for the given scene
   * @param scene Defines the scene to register the component in
   */
  constructor(t) {
    this.name = m.NAME_GAMEPAD, this.scene = t;
  }
  /**
   * Registers the component in a given scene
   */
  register() {
    this.scene._beforeCameraUpdateStage.registerStep(m.STEP_BEFORECAMERAUPDATE_GAMEPAD, this, this._beforeCameraUpdate);
  }
  /**
   * Rebuilds the elements related to this component in case of
   * context lost for instance.
   */
  rebuild() {
  }
  /**
   * Disposes the component and the associated resources
   */
  dispose() {
    const t = this.scene._gamepadManager;
    t && (t.dispose(), this.scene._gamepadManager = null);
  }
  _beforeCameraUpdate() {
    const t = this.scene._gamepadManager;
    t && t._isMonitoring && t._checkGamepadsStatus();
  }
}
S.AddNodeConstructor("TouchCamera", (s, t) => () => new w(s, p.Zero(), t));
class w extends C {
  /**
   * Defines the touch sensibility for rotation.
   * The higher the faster.
   */
  get touchAngularSensibility() {
    const t = this.inputs.attached.touch;
    return t ? t.touchAngularSensibility : 0;
  }
  set touchAngularSensibility(t) {
    const e = this.inputs.attached.touch;
    e && (e.touchAngularSensibility = t);
  }
  /**
   * Defines the touch sensibility for move.
   * The higher the faster.
   */
  get touchMoveSensibility() {
    const t = this.inputs.attached.touch;
    return t ? t.touchMoveSensibility : 0;
  }
  set touchMoveSensibility(t) {
    const e = this.inputs.attached.touch;
    e && (e.touchMoveSensibility = t);
  }
  /**
   * Instantiates a new touch camera.
   * This represents a FPS type of camera controlled by touch.
   * This is like a universal camera minus the Gamepad controls.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#universal-camera
   * @param name Define the name of the camera in the scene
   * @param position Define the start position of the camera in the scene
   * @param scene Define the scene the camera belongs to
   */
  constructor(t, e, i) {
    super(t, e, i), this.inputs.addTouch(), this._setupInputs();
  }
  /**
   * Gets the current object class name.
   * @returns the class name
   */
  getClassName() {
    return "TouchCamera";
  }
  /** @internal */
  _setupInputs() {
    const t = this.inputs.attached.touch, e = this.inputs.attached.mouse;
    e ? e.touchEnabled = !1 : t.allowMouse = !0;
  }
}
S.AddNodeConstructor("FreeCamera", (s, t) => () => new f(s, p.Zero(), t));
class f extends w {
  /**
   * Defines the gamepad rotation sensibility.
   * This is the threshold from when rotation starts to be accounted for to prevent jittering.
   */
  get gamepadAngularSensibility() {
    const t = this.inputs.attached.gamepad;
    return t ? t.gamepadAngularSensibility : 0;
  }
  set gamepadAngularSensibility(t) {
    const e = this.inputs.attached.gamepad;
    e && (e.gamepadAngularSensibility = t);
  }
  /**
   * Defines the gamepad move sensibility.
   * This is the threshold from when moving starts to be accounted for to prevent jittering.
   */
  get gamepadMoveSensibility() {
    const t = this.inputs.attached.gamepad;
    return t ? t.gamepadMoveSensibility : 0;
  }
  set gamepadMoveSensibility(t) {
    const e = this.inputs.attached.gamepad;
    e && (e.gamepadMoveSensibility = t);
  }
  /**
   * The Universal Camera is the one to choose for first person shooter type games, and works with all the keyboard, mouse, touch and gamepads. This replaces the earlier Free Camera,
   * which still works and will still be found in many Playgrounds.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#universal-camera
   * @param name Define the name of the camera in the scene
   * @param position Define the start position of the camera in the scene
   * @param scene Define the scene the camera belongs to
   */
  constructor(t, e, i) {
    super(t, e, i), this.inputs.addGamepad();
  }
  /**
   * Gets the current object class name.
   * @returns the class name
   */
  getClassName() {
    return "UniversalCamera";
  }
}
L._CreateDefaultParsedCamera = (s, t) => new f(s, p.Zero(), t);
const H = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  UniversalCamera: f
}, Symbol.toStringTag, { value: "Module" }));
export {
  l as A,
  r as D,
  _ as F,
  n as G,
  Z as S,
  w as T,
  f as U,
  o as X,
  b as a,
  D as b,
  U as c,
  Y as d,
  T as e,
  u as f,
  E as g,
  H as u
};
//# sourceMappingURL=universalCamera-Brfl5hn2.js.map
