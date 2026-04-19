import { S as t, a as o } from "./scene-81J9Z4aI.js";
import { M as a } from "./mesh-BIoKPPmW.js";
import { SimplificationQueue as u, SimplificationType as c } from "./meshSimplification-D2R-m3H1.js";
Object.defineProperty(o.prototype, "simplificationQueue", {
  get: function() {
    if (!this._simplificationQueue) {
      this._simplificationQueue = new u();
      let e = this._getComponent(t.NAME_SIMPLIFICATIONQUEUE);
      e || (e = new p(this), this._addComponent(e));
    }
    return this._simplificationQueue;
  },
  set: function(e) {
    this._simplificationQueue = e;
  },
  enumerable: !0,
  configurable: !0
});
a.prototype.simplify = function(e, i = !0, s = c.QUADRATIC, n) {
  return this.getScene().simplificationQueue.addTask({
    settings: e,
    parallelProcessing: i,
    mesh: this,
    simplificationType: s,
    successCallback: n
  }), this;
};
class p {
  /**
   * Creates a new instance of the component for the given scene
   * @param scene Defines the scene to register the component in
   */
  constructor(i) {
    this.name = t.NAME_SIMPLIFICATIONQUEUE, this.scene = i;
  }
  /**
   * Registers the component in a given scene
   */
  register() {
    this.scene._beforeCameraUpdateStage.registerStep(t.STEP_BEFORECAMERAUPDATE_SIMPLIFICATIONQUEUE, this, this._beforeCameraUpdate);
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
  }
  _beforeCameraUpdate() {
    this.scene._simplificationQueue && !this.scene._simplificationQueue.running && this.scene._simplificationQueue.executeNext();
  }
}
export {
  p as SimplicationQueueSceneComponent
};
//# sourceMappingURL=meshSimplificationSceneComponent-C1A4uWXF.js.map
