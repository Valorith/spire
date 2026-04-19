import { g as a } from "./embed-entry-Bb6cfUYP.js";
class t {
}
t.POINTERDOWN = 1;
t.POINTERUP = 2;
t.POINTERMOVE = 4;
t.POINTERWHEEL = 8;
t.POINTERPICK = 16;
t.POINTERTAP = 32;
t.POINTERDOUBLETAP = 64;
class r {
  /**
   * Instantiates the base class of pointers info.
   * @param type Defines the type of event (PointerEventTypes)
   * @param event Defines the related dom event
   */
  constructor(n, i) {
    this.type = n, this.event = i;
  }
}
class P extends r {
  /**
   * Instantiates a PointerInfoPre to store pointer related info to the onPrePointerObservable event.
   * @param type Defines the type of event (PointerEventTypes)
   * @param event Defines the related dom event
   * @param localX Defines the local x coordinates of the pointer when the event occured
   * @param localY Defines the local y coordinates of the pointer when the event occured
   */
  constructor(n, i, s, o) {
    super(n, i), this.ray = null, this.originalPickingInfo = null, this.skipOnPointerObservable = !1, this.localPosition = new a(s, o);
  }
}
class I extends r {
  /**
   * Defines the picking info associated with this PointerInfo object (if applicable)
   */
  get pickInfo() {
    return this._pickInfo || this._generatePickInfo(), this._pickInfo;
  }
  /**
   * Instantiates a PointerInfo to store pointer related info to the onPointerObservable event.
   * @param type Defines the type of event (PointerEventTypes)
   * @param event Defines the related dom event
   * @param pickInfo Defines the picking info associated to the info (if any)
   * @param inputManager Defines the InputManager to use if there is no pickInfo
   */
  constructor(n, i, s, o = null) {
    super(n, i), this._pickInfo = s, this._inputManager = o;
  }
  /**
   * Generates the picking info if needed
   */
  /** @internal */
  _generatePickInfo() {
    this._inputManager && (this._pickInfo = this._inputManager._pickMove(this.event), this._inputManager._setRayOnPointerInfo(this._pickInfo, this.event), this._inputManager = null);
  }
}
export {
  t as PointerEventTypes,
  I as PointerInfo,
  r as PointerInfoBase,
  P as PointerInfoPre
};
//# sourceMappingURL=pointerEvents-Cd27wOCS.js.map
