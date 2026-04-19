import { h as f, a as e, M as u, b as a, q as d, s as h } from "./embed-entry-BKE21f6Q.js";
import { N as m } from "./node-Cogu8C4Q.js";
import { Light as n } from "./light-BhQ2uI3v.js";
m.AddNodeConstructor("Light_Type_3", (s, r) => () => new o(s, e.Zero(), r));
class o extends n {
  /**
   * Creates a HemisphericLight object in the scene according to the passed direction (Vector3).
   * The HemisphericLight simulates the ambient environment light, so the passed direction is the light reflection direction, not the incoming direction.
   * The HemisphericLight can't cast shadows.
   * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
   * @param name The friendly name of the light
   * @param direction The direction of the light reflection
   * @param scene The scene the light belongs to
   */
  constructor(r, i, t) {
    super(r, t), this.groundColor = new f(0, 0, 0), this.direction = i || e.Up();
  }
  _buildUniformLayout() {
    this._uniformBuffer.addUniform("vLightData", 4), this._uniformBuffer.addUniform("vLightDiffuse", 4), this._uniformBuffer.addUniform("vLightSpecular", 4), this._uniformBuffer.addUniform("vLightGround", 3), this._uniformBuffer.addUniform("shadowsInfo", 3), this._uniformBuffer.addUniform("depthValues", 2), this._uniformBuffer.create();
  }
  /**
   * Returns the string "HemisphericLight".
   * @returns The class name
   */
  getClassName() {
    return "HemisphericLight";
  }
  /**
   * Sets the HemisphericLight direction towards the passed target (Vector3).
   * Returns the updated direction.
   * @param target The target the direction should point to
   * @returns The computed direction
   */
  setDirectionToTarget(r) {
    return this.direction = e.Normalize(r.subtract(e.Zero())), this.direction;
  }
  /**
   * Returns the shadow generator associated to the light.
   * @returns Always null for hemispheric lights because it does not support shadows.
   */
  getShadowGenerator() {
    return null;
  }
  /**
   * Sets the passed Effect object with the HemisphericLight normalized direction and color and the passed name (string).
   * @param _effect The effect to update
   * @param lightIndex The index of the light in the effect to update
   * @returns The hemispheric light
   */
  transferToEffect(r, i) {
    const t = e.Normalize(this.direction);
    return this._uniformBuffer.updateFloat4("vLightData", t.x, t.y, t.z, 0, i), this._uniformBuffer.updateColor3("vLightGround", this.groundColor.scale(this.intensity), i), this;
  }
  transferToNodeMaterialEffect(r, i) {
    const t = e.Normalize(this.direction);
    return r.setFloat3(i, t.x, t.y, t.z), this;
  }
  /**
   * Computes the world matrix of the node
   * @returns the world matrix
   */
  computeWorldMatrix() {
    return this._worldMatrix || (this._worldMatrix = u.Identity()), this._worldMatrix;
  }
  /**
   * Returns the integer 3.
   * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
   */
  getTypeID() {
    return n.LIGHTTYPEID_HEMISPHERICLIGHT;
  }
  /**
   * Prepares the list of defines specific to the light type.
   * @param defines the list of defines
   * @param lightIndex defines the index of the light for the effect
   */
  prepareLightSpecificDefines(r, i) {
    r["HEMILIGHT" + i] = !0;
  }
}
a([
  d()
], o.prototype, "groundColor", void 0);
a([
  h()
], o.prototype, "direction", void 0);
export {
  o as H
};
//# sourceMappingURL=hemisphericLight-CMl-PB-r.js.map
