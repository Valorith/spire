import { a as x, M as u } from "./embed-entry-BgvWRWVI.js";
class r {
  /**
   * Creates a Plane object according to the given floats a, b, c, d and the plane equation : ax + by + cz + d = 0
   * @param a a component of the plane
   * @param b b component of the plane
   * @param c c component of the plane
   * @param d d component of the plane
   */
  constructor(t, s, o, n) {
    this.normal = new x(t, s, o), this.d = n;
  }
  /**
   * @returns the plane coordinates as a new array of 4 elements [a, b, c, d].
   */
  asArray() {
    return [this.normal.x, this.normal.y, this.normal.z, this.d];
  }
  // Methods
  /**
   * @returns a new plane copied from the current Plane.
   */
  clone() {
    return new r(this.normal.x, this.normal.y, this.normal.z, this.d);
  }
  /**
   * @returns the string "Plane".
   */
  getClassName() {
    return "Plane";
  }
  /**
   * @returns the Plane hash code.
   */
  getHashCode() {
    let t = this.normal.getHashCode();
    return t = t * 397 ^ (this.d | 0), t;
  }
  /**
   * Normalize the current Plane in place.
   * @returns the updated Plane.
   */
  normalize() {
    const t = Math.sqrt(this.normal.x * this.normal.x + this.normal.y * this.normal.y + this.normal.z * this.normal.z);
    let s = 0;
    return t !== 0 && (s = 1 / t), this.normal.x *= s, this.normal.y *= s, this.normal.z *= s, this.d *= s, this;
  }
  /**
   * Applies a transformation the plane and returns the result
   * @param transformation the transformation matrix to be applied to the plane
   * @returns a new Plane as the result of the transformation of the current Plane by the given matrix.
   */
  transform(t) {
    const s = r._TmpMatrix;
    t.invertToRef(s);
    const o = s.m, n = this.normal.x, a = this.normal.y, i = this.normal.z, m = this.d, c = n * o[0] + a * o[1] + i * o[2] + m * o[3], d = n * o[4] + a * o[5] + i * o[6] + m * o[7], h = n * o[8] + a * o[9] + i * o[10] + m * o[11], e = n * o[12] + a * o[13] + i * o[14] + m * o[15];
    return new r(c, d, h, e);
  }
  /**
   * Compute the dot product between the point and the plane normal
   * @param point point to calculate the dot product with
   * @returns the dot product (float) of the point coordinates and the plane normal.
   */
  dotCoordinate(t) {
    return this.normal.x * t.x + this.normal.y * t.y + this.normal.z * t.z + this.d;
  }
  /**
   * Updates the current Plane from the plane defined by the three given points.
   * @param point1 one of the points used to construct the plane
   * @param point2 one of the points used to construct the plane
   * @param point3 one of the points used to construct the plane
   * @returns the updated Plane.
   */
  copyFromPoints(t, s, o) {
    const n = s.x - t.x, a = s.y - t.y, i = s.z - t.z, m = o.x - t.x, c = o.y - t.y, d = o.z - t.z, h = a * d - i * c, e = i * m - n * d, y = n * c - a * m, z = Math.sqrt(h * h + e * e + y * y);
    let l;
    return z !== 0 ? l = 1 / z : l = 0, this.normal.x = h * l, this.normal.y = e * l, this.normal.z = y * l, this.d = -(this.normal.x * t.x + this.normal.y * t.y + this.normal.z * t.z), this;
  }
  /**
   * Checks if the plane is facing a given direction (meaning if the plane's normal is pointing in the opposite direction of the given vector).
   * Note that for this function to work as expected you should make sure that:
   *   - direction and the plane normal are normalized
   *   - epsilon is a number just bigger than -1, something like -0.99 for eg
   * @param direction the direction to check if the plane is facing
   * @param epsilon value the dot product is compared against (returns true if dot <= epsilon)
   * @returns True if the plane is facing the given direction
   */
  isFrontFacingTo(t, s) {
    return x.Dot(this.normal, t) <= s;
  }
  /**
   * Calculates the distance to a point
   * @param point point to calculate distance to
   * @returns the signed distance (float) from the given point to the Plane.
   */
  signedDistanceTo(t) {
    return x.Dot(t, this.normal) + this.d;
  }
  // Statics
  /**
   * Creates a plane from an  array
   * @param array the array to create a plane from
   * @returns a new Plane from the given array.
   */
  static FromArray(t) {
    return new r(t[0], t[1], t[2], t[3]);
  }
  /**
   * Creates a plane from three points
   * @param point1 point used to create the plane
   * @param point2 point used to create the plane
   * @param point3 point used to create the plane
   * @returns a new Plane defined by the three given points.
   */
  static FromPoints(t, s, o) {
    const n = new r(0, 0, 0, 0);
    return n.copyFromPoints(t, s, o), n;
  }
  /**
   * Creates a plane from an origin point and a normal
   * @param origin origin of the plane to be constructed
   * @param normal normal of the plane to be constructed
   * @returns a new Plane the normal vector to this plane at the given origin point.
   */
  static FromPositionAndNormal(t, s) {
    const o = new r(0, 0, 0, 0);
    return this.FromPositionAndNormalToRef(t, s, o);
  }
  /**
   * Updates the given Plane "result" from an origin point and a normal.
   * @param origin origin of the plane to be constructed
   * @param normal the normalized normals of the plane to be constructed
   * @param result defines the Plane where to store the result
   * @returns result input
   */
  static FromPositionAndNormalToRef(t, s, o) {
    return o.normal.copyFrom(s), o.normal.normalize(), o.d = -t.dot(o.normal), o;
  }
  /**
   * Calculates the distance from a plane and a point
   * @param origin origin of the plane to be constructed
   * @param normal normal of the plane to be constructed
   * @param point point to calculate distance to
   * @returns the signed distance between the plane defined by the normal vector at the "origin"" point and the given other point.
   */
  static SignedDistanceToPlaneFromPositionAndNormal(t, s, o) {
    const n = -(s.x * t.x + s.y * t.y + s.z * t.z);
    return x.Dot(o, s) + n;
  }
}
r._TmpMatrix = u.Identity();
export {
  r as P
};
//# sourceMappingURL=math.plane-DBvbMJ5W.js.map
