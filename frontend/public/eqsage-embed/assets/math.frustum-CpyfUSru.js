import { P as n } from "./math.plane-CuDptDjB.js";
class i {
  /**
   * Gets the planes representing the frustum
   * @param transform matrix to be applied to the returned planes
   * @returns a new array of 6 Frustum planes computed by the given transformation matrix.
   */
  static GetPlanes(a) {
    const e = [];
    for (let o = 0; o < 6; o++)
      e.push(new n(0, 0, 0, 0));
    return i.GetPlanesToRef(a, e), e;
  }
  /**
   * Gets the near frustum plane transformed by the transform matrix
   * @param transform transformation matrix to be applied to the resulting frustum plane
   * @param frustumPlane the resulting frustum plane
   */
  static GetNearPlaneToRef(a, e) {
    const o = a.m;
    e.normal.x = o[3] + o[2], e.normal.y = o[7] + o[6], e.normal.z = o[11] + o[10], e.d = o[15] + o[14], e.normalize();
  }
  /**
   * Gets the far frustum plane transformed by the transform matrix
   * @param transform transformation matrix to be applied to the resulting frustum plane
   * @param frustumPlane the resulting frustum plane
   */
  static GetFarPlaneToRef(a, e) {
    const o = a.m;
    e.normal.x = o[3] - o[2], e.normal.y = o[7] - o[6], e.normal.z = o[11] - o[10], e.d = o[15] - o[14], e.normalize();
  }
  /**
   * Gets the left frustum plane transformed by the transform matrix
   * @param transform transformation matrix to be applied to the resulting frustum plane
   * @param frustumPlane the resulting frustum plane
   */
  static GetLeftPlaneToRef(a, e) {
    const o = a.m;
    e.normal.x = o[3] + o[0], e.normal.y = o[7] + o[4], e.normal.z = o[11] + o[8], e.d = o[15] + o[12], e.normalize();
  }
  /**
   * Gets the right frustum plane transformed by the transform matrix
   * @param transform transformation matrix to be applied to the resulting frustum plane
   * @param frustumPlane the resulting frustum plane
   */
  static GetRightPlaneToRef(a, e) {
    const o = a.m;
    e.normal.x = o[3] - o[0], e.normal.y = o[7] - o[4], e.normal.z = o[11] - o[8], e.d = o[15] - o[12], e.normalize();
  }
  /**
   * Gets the top frustum plane transformed by the transform matrix
   * @param transform transformation matrix to be applied to the resulting frustum plane
   * @param frustumPlane the resulting frustum plane
   */
  static GetTopPlaneToRef(a, e) {
    const o = a.m;
    e.normal.x = o[3] - o[1], e.normal.y = o[7] - o[5], e.normal.z = o[11] - o[9], e.d = o[15] - o[13], e.normalize();
  }
  /**
   * Gets the bottom frustum plane transformed by the transform matrix
   * @param transform transformation matrix to be applied to the resulting frustum plane
   * @param frustumPlane the resulting frustum plane
   */
  static GetBottomPlaneToRef(a, e) {
    const o = a.m;
    e.normal.x = o[3] + o[1], e.normal.y = o[7] + o[5], e.normal.z = o[11] + o[9], e.d = o[15] + o[13], e.normalize();
  }
  /**
   * Sets the given array "frustumPlanes" with the 6 Frustum planes computed by the given transformation matrix.
   * @param transform transformation matrix to be applied to the resulting frustum planes
   * @param frustumPlanes the resulting frustum planes
   */
  static GetPlanesToRef(a, e) {
    i.GetNearPlaneToRef(a, e[0]), i.GetFarPlaneToRef(a, e[1]), i.GetLeftPlaneToRef(a, e[2]), i.GetRightPlaneToRef(a, e[3]), i.GetTopPlaneToRef(a, e[4]), i.GetBottomPlaneToRef(a, e[5]);
  }
  /**
   * Tests if a point is located between the frustum planes.
   * @param point defines the point to test
   * @param frustumPlanes defines the frustum planes to test
   * @returns true if the point is located between the frustum planes
   */
  static IsPointInFrustum(a, e) {
    for (let o = 0; o < 6; o++)
      if (e[o].dotCoordinate(a) < 0)
        return !1;
    return !0;
  }
}
export {
  i as F
};
//# sourceMappingURL=math.frustum-CpyfUSru.js.map
