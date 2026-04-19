import { a as i, M as u, b as d, c } from "./embed-entry-Bb6cfUYP.js";
import { N as m } from "./node-DDdHG9Gc.js";
import { Light as p } from "./light-DLhl-uii.js";
import { S as g } from "./shadowLight-BgslpLkD.js";
m.AddNodeConstructor("Light_Type_0", (a, e) => () => new f(a, i.Zero(), e));
class f extends g {
  /**
   * Getter: In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
   * This specifies what angle the shadow will use to be created.
   *
   * It default to 90 degrees to work nicely with the cube texture generation for point lights shadow maps.
   */
  get shadowAngle() {
    return this._shadowAngle;
  }
  /**
   * Setter: In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
   * This specifies what angle the shadow will use to be created.
   *
   * It default to 90 degrees to work nicely with the cube texture generation for point lights shadow maps.
   */
  set shadowAngle(e) {
    this._shadowAngle = e, this.forceProjectionMatrixCompute();
  }
  /**
   * Gets the direction if it has been set.
   * In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
   */
  get direction() {
    return this._direction;
  }
  /**
   * In case of direction provided, the shadow will not use a cube texture but simulate a spot shadow as a fallback
   */
  set direction(e) {
    const t = this.needCube();
    if (this._direction = e, this.needCube() !== t && this._shadowGenerators) {
      const o = this._shadowGenerators.values();
      for (let r = o.next(); r.done !== !0; r = o.next())
        r.value.recreateShadowMap();
    }
  }
  /**
   * Creates a PointLight object from the passed name and position (Vector3) and adds it in the scene.
   * A PointLight emits the light in every direction.
   * It can cast shadows.
   * If the scene camera is already defined and you want to set your PointLight at the camera position, just set it :
   * ```javascript
   * var pointLight = new PointLight("pl", camera.position, scene);
   * ```
   * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
   * @param name The light friendly name
   * @param position The position of the point light in the scene
   * @param scene The scene the lights belongs to
   */
  constructor(e, t, o) {
    super(e, o), this._shadowAngle = Math.PI / 2, this.position = t;
  }
  /**
   * Returns the string "PointLight"
   * @returns the class name
   */
  getClassName() {
    return "PointLight";
  }
  /**
   * Returns the integer 0.
   * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
   */
  getTypeID() {
    return p.LIGHTTYPEID_POINTLIGHT;
  }
  /**
   * Specifies whether or not the shadowmap should be a cube texture.
   * @returns true if the shadowmap needs to be a cube texture.
   */
  needCube() {
    return !this.direction;
  }
  /**
   * Returns a new Vector3 aligned with the PointLight cube system according to the passed cube face index (integer).
   * @param faceIndex The index of the face we are computed the direction to generate shadow
   * @returns The set direction in 2d mode otherwise the direction to the cubemap face if needCube() is true
   */
  getShadowDirection(e) {
    if (this.direction)
      return super.getShadowDirection(e);
    switch (e) {
      case 0:
        return new i(1, 0, 0);
      case 1:
        return new i(-1, 0, 0);
      case 2:
        return new i(0, -1, 0);
      case 3:
        return new i(0, 1, 0);
      case 4:
        return new i(0, 0, 1);
      case 5:
        return new i(0, 0, -1);
    }
    return i.Zero();
  }
  /**
   * Sets the passed matrix "matrix" as a left-handed perspective projection matrix with the following settings :
   * - fov = PI / 2
   * - aspect ratio : 1.0
   * - z-near and far equal to the active camera minZ and maxZ.
   * Returns the PointLight.
   * @param matrix
   * @param viewMatrix
   * @param renderList
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _setDefaultShadowProjectionMatrix(e, t, o) {
    const r = this.getScene().activeCamera;
    if (!r)
      return;
    const s = this.shadowMinZ !== void 0 ? this.shadowMinZ : r.minZ, h = this.shadowMaxZ !== void 0 ? this.shadowMaxZ : r.maxZ, n = this.getScene().getEngine().useReverseDepthBuffer;
    u.PerspectiveFovLHToRef(this.shadowAngle, 1, n ? h : s, n ? s : h, e, !0, this._scene.getEngine().isNDCHalfZRange, void 0, n);
  }
  _buildUniformLayout() {
    this._uniformBuffer.addUniform("vLightData", 4), this._uniformBuffer.addUniform("vLightDiffuse", 4), this._uniformBuffer.addUniform("vLightSpecular", 4), this._uniformBuffer.addUniform("vLightFalloff", 4), this._uniformBuffer.addUniform("shadowsInfo", 3), this._uniformBuffer.addUniform("depthValues", 2), this._uniformBuffer.create();
  }
  /**
   * Sets the passed Effect "effect" with the PointLight transformed position (or position, if none) and passed name (string).
   * @param effect The effect to update
   * @param lightIndex The index of the light in the effect to update
   * @returns The point light
   */
  transferToEffect(e, t) {
    return this.computeTransformedInformation() ? this._uniformBuffer.updateFloat4("vLightData", this.transformedPosition.x, this.transformedPosition.y, this.transformedPosition.z, 0, t) : this._uniformBuffer.updateFloat4("vLightData", this.position.x, this.position.y, this.position.z, 0, t), this._uniformBuffer.updateFloat4("vLightFalloff", this.range, this._inverseSquaredRange, 0, 0, t), this;
  }
  transferToNodeMaterialEffect(e, t) {
    return this.computeTransformedInformation() ? e.setFloat3(t, this.transformedPosition.x, this.transformedPosition.y, this.transformedPosition.z) : e.setFloat3(t, this.position.x, this.position.y, this.position.z), this;
  }
  /**
   * Prepares the list of defines specific to the light type.
   * @param defines the list of defines
   * @param lightIndex defines the index of the light for the effect
   */
  prepareLightSpecificDefines(e, t) {
    e["POINTLIGHT" + t] = !0;
  }
}
d([
  c()
], f.prototype, "shadowAngle", null);
export {
  f as PointLight
};
//# sourceMappingURL=pointLight-DXWjuHAQ.js.map
