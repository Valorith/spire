import { w as D, g as f, M as L, a as u, E as z, Q as T } from "./embed-entry-Bb6cfUYP.js";
var y;
(function(x) {
  x[x.CW = 0] = "CW", x[x.CCW = 1] = "CCW";
})(y || (y = {}));
class X {
  /**
   * Returns the cubic Bezier interpolated value (float) at "t" (float) from the given x1, y1, x2, y2 floats
   * @param t defines the time
   * @param x1 defines the left coordinate on X axis
   * @param y1 defines the left coordinate on Y axis
   * @param x2 defines the right coordinate on X axis
   * @param y2 defines the right coordinate on Y axis
   * @returns the interpolated value
   */
  static Interpolate(t, s, e, i, a) {
    const h = 1 - 3 * i + 3 * s, o = 3 * i - 6 * s, n = 3 * s;
    let r = t;
    for (let c = 0; c < 5; c++) {
      const l = r * r, _ = l * r, p = h * _ + o * l + n * r, m = 1 / (3 * h * l + 2 * o * r + n);
      r -= (p - t) * m, r = Math.min(1, Math.max(0, r));
    }
    return 3 * Math.pow(1 - r, 2) * r * e + 3 * (1 - r) * Math.pow(r, 2) * a + Math.pow(r, 3);
  }
}
class g {
  /**
   * Creates an Angle object of "radians" radians (float).
   * @param radians the angle in radians
   */
  constructor(t) {
    this._radians = t, this._radians < 0 && (this._radians += 2 * Math.PI);
  }
  /**
   * Get value in degrees
   * @returns the Angle value in degrees (float)
   */
  degrees() {
    return this._radians * 180 / Math.PI;
  }
  /**
   * Get value in radians
   * @returns the Angle value in radians (float)
   */
  radians() {
    return this._radians;
  }
  /**
   * Gets a new Angle object with a value of the angle (in radians) between the line connecting the two points and the x-axis
   * @param a defines first point as the origin
   * @param b defines point
   * @returns a new Angle
   */
  static BetweenTwoPoints(t, s) {
    const e = s.subtract(t), i = Math.atan2(e.y, e.x);
    return new g(i);
  }
  /**
   * Gets the angle between the two vectors
   * @param a defines first vector
   * @param b defines vector
   * @returns Returns an new Angle between 0 and PI
   */
  static BetweenTwoVectors(t, s) {
    let e = t.lengthSquared() * s.lengthSquared();
    if (e === 0)
      return new g(Math.PI / 2);
    e = Math.sqrt(e);
    let i = t.dot(s) / e;
    i = D.Clamp(i, -1, 1);
    const a = Math.acos(i);
    return new g(a);
  }
  /**
   * Gets a new Angle object from the given float in radians
   * @param radians defines the angle value in radians
   * @returns a new Angle
   */
  static FromRadians(t) {
    return new g(t);
  }
  /**
   * Gets a new Angle object from the given float in degrees
   * @param degrees defines the angle value in degrees
   * @returns a new Angle
   */
  static FromDegrees(t) {
    return new g(t * Math.PI / 180);
  }
}
class U {
  /**
   * Creates an Arc object from the three given points : start, middle and end.
   * @param startPoint Defines the start point of the arc
   * @param midPoint Defines the middle point of the arc
   * @param endPoint Defines the end point of the arc
   */
  constructor(t, s, e) {
    this.startPoint = t, this.midPoint = s, this.endPoint = e;
    const i = Math.pow(s.x, 2) + Math.pow(s.y, 2), a = (Math.pow(t.x, 2) + Math.pow(t.y, 2) - i) / 2, h = (i - Math.pow(e.x, 2) - Math.pow(e.y, 2)) / 2, o = (t.x - s.x) * (s.y - e.y) - (s.x - e.x) * (t.y - s.y);
    this.centerPoint = new f((a * (s.y - e.y) - h * (t.y - s.y)) / o, ((t.x - s.x) * h - (s.x - e.x) * a) / o), this.radius = this.centerPoint.subtract(this.startPoint).length(), this.startAngle = g.BetweenTwoPoints(this.centerPoint, this.startPoint);
    const n = this.startAngle.degrees();
    let r = g.BetweenTwoPoints(this.centerPoint, this.midPoint).degrees(), c = g.BetweenTwoPoints(this.centerPoint, this.endPoint).degrees();
    r - n > 180 && (r -= 360), r - n < -180 && (r += 360), c - r > 180 && (c -= 360), c - r < -180 && (c += 360), this.orientation = r - n < 0 ? y.CW : y.CCW, this.angle = g.FromDegrees(this.orientation === y.CW ? n - c : c - n);
  }
}
class N {
  /**
   * Creates a Path2 object from the starting 2D coordinates x and y.
   * @param x the starting points x value
   * @param y the starting points y value
   */
  constructor(t, s) {
    this._points = new Array(), this._length = 0, this.closed = !1, this._points.push(new f(t, s));
  }
  /**
   * Adds a new segment until the given coordinates (x, y) to the current Path2.
   * @param x the added points x value
   * @param y the added points y value
   * @returns the updated Path2.
   */
  addLineTo(t, s) {
    if (this.closed)
      return this;
    const e = new f(t, s), i = this._points[this._points.length - 1];
    return this._points.push(e), this._length += e.subtract(i).length(), this;
  }
  /**
   * Adds _numberOfSegments_ segments according to the arc definition (middle point coordinates, end point coordinates, the arc start point being the current Path2 last point) to the current Path2.
   * @param midX middle point x value
   * @param midY middle point y value
   * @param endX end point x value
   * @param endY end point y value
   * @param numberOfSegments (default: 36)
   * @returns the updated Path2.
   */
  addArcTo(t, s, e, i, a = 36) {
    if (this.closed)
      return this;
    const h = this._points[this._points.length - 1], o = new f(t, s), n = new f(e, i), r = new U(h, o, n);
    let c = r.angle.radians() / a;
    r.orientation === y.CW && (c *= -1);
    let l = r.startAngle.radians() + c;
    for (let _ = 0; _ < a; _++) {
      const p = Math.cos(l) * r.radius + r.centerPoint.x, m = Math.sin(l) * r.radius + r.centerPoint.y;
      this.addLineTo(p, m), l += c;
    }
    return this;
  }
  /**
   * Adds _numberOfSegments_ segments according to the quadratic curve definition to the current Path2.
   * @param controlX control point x value
   * @param controlY control point y value
   * @param endX end point x value
   * @param endY end point y value
   * @param numberOfSegments (default: 36)
   * @returns the updated Path2.
   */
  addQuadraticCurveTo(t, s, e, i, a = 36) {
    if (this.closed)
      return this;
    const h = (n, r, c, l) => (1 - n) * (1 - n) * r + 2 * n * (1 - n) * c + n * n * l, o = this._points[this._points.length - 1];
    for (let n = 0; n <= a; n++) {
      const r = n / a, c = h(r, o.x, t, e), l = h(r, o.y, s, i);
      this.addLineTo(c, l);
    }
    return this;
  }
  /**
   * Adds _numberOfSegments_ segments according to the bezier curve definition to the current Path2.
   * @param originTangentX tangent vector at the origin point x value
   * @param originTangentY tangent vector at the origin point y value
   * @param destinationTangentX tangent vector at the destination point x value
   * @param destinationTangentY tangent vector at the destination point y value
   * @param endX end point x value
   * @param endY end point y value
   * @param numberOfSegments (default: 36)
   * @returns the updated Path2.
   */
  addBezierCurveTo(t, s, e, i, a, h, o = 36) {
    if (this.closed)
      return this;
    const n = (c, l, _, p, m) => (1 - c) * (1 - c) * (1 - c) * l + 3 * c * (1 - c) * (1 - c) * _ + 3 * c * c * (1 - c) * p + c * c * c * m, r = this._points[this._points.length - 1];
    for (let c = 0; c <= o; c++) {
      const l = c / o, _ = n(l, r.x, t, e, a), p = n(l, r.y, s, i, h);
      this.addLineTo(_, p);
    }
    return this;
  }
  /**
   * Defines if a given point is inside the polygon defines by the path
   * @param point defines the point to test
   * @returns true if the point is inside
   */
  isPointInside(t) {
    let s = !1;
    const e = this._points.length;
    for (let i = e - 1, a = 0; a < e; i = a++) {
      let h = this._points[i], o = this._points[a], n = o.x - h.x, r = o.y - h.y;
      if (Math.abs(r) > Number.EPSILON) {
        if (r < 0 && (h = this._points[a], n = -n, o = this._points[i], r = -r), t.y < h.y || t.y > o.y)
          continue;
        if (t.y === h.y && t.x === h.x)
          return !0;
        {
          const c = r * (t.x - h.x) - n * (t.y - h.y);
          if (c === 0)
            return !0;
          if (c < 0)
            continue;
          s = !s;
        }
      } else {
        if (t.y !== h.y)
          continue;
        if (o.x <= t.x && t.x <= h.x || h.x <= t.x && t.x <= o.x)
          return !0;
      }
    }
    return s;
  }
  /**
   * Closes the Path2.
   * @returns the Path2.
   */
  close() {
    return this.closed = !0, this;
  }
  /**
   * Gets the sum of the distance between each sequential point in the path
   * @returns the Path2 total length (float).
   */
  length() {
    let t = this._length;
    if (this.closed) {
      const s = this._points[this._points.length - 1], e = this._points[0];
      t += e.subtract(s).length();
    }
    return t;
  }
  /**
   * Gets the area of the polygon defined by the path
   * @returns area value
   */
  area() {
    const t = this._points.length;
    let s = 0;
    for (let e = t - 1, i = 0; i < t; e = i++)
      s += this._points[e].x * this._points[i].y - this._points[i].x * this._points[e].y;
    return s * 0.5;
  }
  /**
   * Gets the points which construct the path
   * @returns the Path2 internal array of points.
   */
  getPoints() {
    return this._points;
  }
  /**
   * Retrieves the point at the distance aways from the starting point
   * @param normalizedLengthPosition the length along the path to retrieve the point from
   * @returns a new Vector2 located at a percentage of the Path2 total length on this path.
   */
  getPointAtLengthPosition(t) {
    if (t < 0 || t > 1)
      return f.Zero();
    const s = t * this.length();
    let e = 0;
    for (let i = 0; i < this._points.length; i++) {
      const a = (i + 1) % this._points.length, h = this._points[i], n = this._points[a].subtract(h), r = n.length() + e;
      if (s >= e && s <= r) {
        const c = n.normalize(), l = s - e;
        return new f(h.x + c.x * l, h.y + c.y * l);
      }
      e = r;
    }
    return f.Zero();
  }
  /**
   * Creates a new path starting from an x and y position
   * @param x starting x value
   * @param y starting y value
   * @returns a new Path2 starting at the coordinates (x, y).
   */
  static StartingAt(t, s) {
    return new N(t, s);
  }
}
class V {
  /**
   * new Path3D(path, normal, raw)
   * Creates a Path3D. A Path3D is a logical math object, so not a mesh.
   * please read the description in the tutorial : https://doc.babylonjs.com/features/featuresDeepDive/mesh/path3D
   * @param path an array of Vector3, the curve axis of the Path3D
   * @param firstNormal (options) Vector3, the first wanted normal to the curve. Ex (0, 1, 0) for a vertical normal.
   * @param raw (optional, default false) : boolean, if true the returned Path3D isn't normalized. Useful to depict path acceleration or speed.
   * @param alignTangentsWithPath (optional, default false) : boolean, if true the tangents will be aligned with the path.
   */
  constructor(t, s = null, e, i = !1) {
    this.path = t, this._curve = new Array(), this._distances = new Array(), this._tangents = new Array(), this._normals = new Array(), this._binormals = new Array(), this._pointAtData = {
      id: 0,
      point: u.Zero(),
      previousPointArrayIndex: 0,
      position: 0,
      subPosition: 0,
      interpolateReady: !1,
      interpolationMatrix: L.Identity()
    };
    for (let a = 0; a < t.length; a++)
      this._curve[a] = t[a].clone();
    this._raw = e || !1, this._alignTangentsWithPath = i, this._compute(s, i);
  }
  /**
   * Returns the Path3D array of successive Vector3 designing its curve.
   * @returns the Path3D array of successive Vector3 designing its curve.
   */
  getCurve() {
    return this._curve;
  }
  /**
   * Returns the Path3D array of successive Vector3 designing its curve.
   * @returns the Path3D array of successive Vector3 designing its curve.
   */
  getPoints() {
    return this._curve;
  }
  /**
   * @returns the computed length (float) of the path.
   */
  length() {
    return this._distances[this._distances.length - 1];
  }
  /**
   * Returns an array populated with tangent vectors on each Path3D curve point.
   * @returns an array populated with tangent vectors on each Path3D curve point.
   */
  getTangents() {
    return this._tangents;
  }
  /**
   * Returns an array populated with normal vectors on each Path3D curve point.
   * @returns an array populated with normal vectors on each Path3D curve point.
   */
  getNormals() {
    return this._normals;
  }
  /**
   * Returns an array populated with binormal vectors on each Path3D curve point.
   * @returns an array populated with binormal vectors on each Path3D curve point.
   */
  getBinormals() {
    return this._binormals;
  }
  /**
   * Returns an array populated with distances (float) of the i-th point from the first curve point.
   * @returns an array populated with distances (float) of the i-th point from the first curve point.
   */
  getDistances() {
    return this._distances;
  }
  /**
   * Returns an interpolated point along this path
   * @param position the position of the point along this path, from 0.0 to 1.0
   * @returns a new Vector3 as the point
   */
  getPointAt(t) {
    return this._updatePointAtData(t).point;
  }
  /**
   * Returns the tangent vector of an interpolated Path3D curve point at the specified position along this path.
   * @param position the position of the point along this path, from 0.0 to 1.0
   * @param interpolated (optional, default false) : boolean, if true returns an interpolated tangent instead of the tangent of the previous path point.
   * @returns a tangent vector corresponding to the interpolated Path3D curve point, if not interpolated, the tangent is taken from the precomputed tangents array.
   */
  getTangentAt(t, s = !1) {
    return this._updatePointAtData(t, s), s ? u.TransformCoordinates(u.Forward(), this._pointAtData.interpolationMatrix) : this._tangents[this._pointAtData.previousPointArrayIndex];
  }
  /**
   * Returns the tangent vector of an interpolated Path3D curve point at the specified position along this path.
   * @param position the position of the point along this path, from 0.0 to 1.0
   * @param interpolated (optional, default false) : boolean, if true returns an interpolated normal instead of the normal of the previous path point.
   * @returns a normal vector corresponding to the interpolated Path3D curve point, if not interpolated, the normal is taken from the precomputed normals array.
   */
  getNormalAt(t, s = !1) {
    return this._updatePointAtData(t, s), s ? u.TransformCoordinates(u.Right(), this._pointAtData.interpolationMatrix) : this._normals[this._pointAtData.previousPointArrayIndex];
  }
  /**
   * Returns the binormal vector of an interpolated Path3D curve point at the specified position along this path.
   * @param position the position of the point along this path, from 0.0 to 1.0
   * @param interpolated (optional, default false) : boolean, if true returns an interpolated binormal instead of the binormal of the previous path point.
   * @returns a binormal vector corresponding to the interpolated Path3D curve point, if not interpolated, the binormal is taken from the precomputed binormals array.
   */
  getBinormalAt(t, s = !1) {
    return this._updatePointAtData(t, s), s ? u.TransformCoordinates(u.UpReadOnly, this._pointAtData.interpolationMatrix) : this._binormals[this._pointAtData.previousPointArrayIndex];
  }
  /**
   * Returns the distance (float) of an interpolated Path3D curve point at the specified position along this path.
   * @param position the position of the point along this path, from 0.0 to 1.0
   * @returns the distance of the interpolated Path3D curve point at the specified position along this path.
   */
  getDistanceAt(t) {
    return this.length() * t;
  }
  /**
   * Returns the array index of the previous point of an interpolated point along this path
   * @param position the position of the point to interpolate along this path, from 0.0 to 1.0
   * @returns the array index
   */
  getPreviousPointIndexAt(t) {
    return this._updatePointAtData(t), this._pointAtData.previousPointArrayIndex;
  }
  /**
   * Returns the position of an interpolated point relative to the two path points it lies between, from 0.0 (point A) to 1.0 (point B)
   * @param position the position of the point to interpolate along this path, from 0.0 to 1.0
   * @returns the sub position
   */
  getSubPositionAt(t) {
    return this._updatePointAtData(t), this._pointAtData.subPosition;
  }
  /**
   * Returns the position of the closest virtual point on this path to an arbitrary Vector3, from 0.0 to 1.0
   * @param target the vector of which to get the closest position to
   * @returns the position of the closest virtual point on this path to the target vector
   */
  getClosestPositionTo(t) {
    let s = Number.MAX_VALUE, e = 0;
    for (let i = 0; i < this._curve.length - 1; i++) {
      const a = this._curve[i + 0], h = this._curve[i + 1].subtract(a).normalize(), o = this._distances[i + 1] - this._distances[i + 0], n = Math.min(Math.max(u.Dot(h, t.subtract(a).normalize()), 0) * u.Distance(a, t) / o, 1), r = u.Distance(a.add(h.scale(n * o)), t);
      r < s && (s = r, e = (this._distances[i + 0] + o * n) / this.length());
    }
    return e;
  }
  /**
   * Returns a sub path (slice) of this path
   * @param start the position of the fist path point, from 0.0 to 1.0, or a negative value, which will get wrapped around from the end of the path to 0.0 to 1.0 values
   * @param end the position of the last path point, from 0.0 to 1.0, or a negative value, which will get wrapped around from the end of the path to 0.0 to 1.0 values
   * @returns a sub path (slice) of this path
   */
  slice(t = 0, s = 1) {
    if (t < 0 && (t = 1 - t * -1 % 1), s < 0 && (s = 1 - s * -1 % 1), t > s) {
      const r = t;
      t = s, s = r;
    }
    const e = this.getCurve(), i = this.getPointAt(t);
    let a = this.getPreviousPointIndexAt(t);
    const h = this.getPointAt(s), o = this.getPreviousPointIndexAt(s) + 1, n = [];
    return t !== 0 && (a++, n.push(i)), n.push(...e.slice(a, o)), (s !== 1 || t === 1) && n.push(h), new V(n, this.getNormalAt(t), this._raw, this._alignTangentsWithPath);
  }
  /**
   * Forces the Path3D tangent, normal, binormal and distance recomputation.
   * @param path path which all values are copied into the curves points
   * @param firstNormal which should be projected onto the curve
   * @param alignTangentsWithPath (optional, default false) : boolean, if true the tangents will be aligned with the path
   * @returns the same object updated.
   */
  update(t, s = null, e = !1) {
    for (let i = 0; i < t.length; i++)
      this._curve[i].x = t[i].x, this._curve[i].y = t[i].y, this._curve[i].z = t[i].z;
    return this._compute(s, e), this;
  }
  // private function compute() : computes tangents, normals and binormals
  _compute(t, s = !1) {
    const e = this._curve.length;
    if (e < 2)
      return;
    this._tangents[0] = this._getFirstNonNullVector(0), this._raw || this._tangents[0].normalize(), this._tangents[e - 1] = this._curve[e - 1].subtract(this._curve[e - 2]), this._raw || this._tangents[e - 1].normalize();
    const i = this._tangents[0], a = this._normalVector(i, t);
    this._normals[0] = a, this._raw || this._normals[0].normalize(), this._binormals[0] = u.Cross(i, this._normals[0]), this._raw || this._binormals[0].normalize(), this._distances[0] = 0;
    let h, o, n, r, c;
    for (let l = 1; l < e; l++)
      h = this._getLastNonNullVector(l), l < e - 1 && (o = this._getFirstNonNullVector(l), this._tangents[l] = s ? o : h.add(o), this._tangents[l].normalize()), this._distances[l] = this._distances[l - 1] + this._curve[l].subtract(this._curve[l - 1]).length(), n = this._tangents[l], c = this._binormals[l - 1], this._normals[l] = u.Cross(c, n), this._raw || (this._normals[l].length() === 0 ? (r = this._normals[l - 1], this._normals[l] = r.clone()) : this._normals[l].normalize()), this._binormals[l] = u.Cross(n, this._normals[l]), this._raw || this._binormals[l].normalize();
    this._pointAtData.id = NaN;
  }
  // private function getFirstNonNullVector(index)
  // returns the first non null vector from index : curve[index + N].subtract(curve[index])
  _getFirstNonNullVector(t) {
    let s = 1, e = this._curve[t + s].subtract(this._curve[t]);
    for (; e.length() === 0 && t + s + 1 < this._curve.length; )
      s++, e = this._curve[t + s].subtract(this._curve[t]);
    return e;
  }
  // private function getLastNonNullVector(index)
  // returns the last non null vector from index : curve[index].subtract(curve[index - N])
  _getLastNonNullVector(t) {
    let s = 1, e = this._curve[t].subtract(this._curve[t - s]);
    for (; e.length() === 0 && t > s + 1; )
      s++, e = this._curve[t].subtract(this._curve[t - s]);
    return e;
  }
  // private function normalVector(v0, vt, va) :
  // returns an arbitrary point in the plane defined by the point v0 and the vector vt orthogonal to this plane
  // if va is passed, it returns the va projection on the plane orthogonal to vt at the point v0
  _normalVector(t, s) {
    let e, i = t.length();
    if (i === 0 && (i = 1), s == null) {
      let a;
      D.WithinEpsilon(Math.abs(t.y) / i, 1, z) ? D.WithinEpsilon(Math.abs(t.x) / i, 1, z) ? D.WithinEpsilon(Math.abs(t.z) / i, 1, z) ? a = u.Zero() : a = new u(0, 0, 1) : a = new u(1, 0, 0) : a = new u(0, -1, 0), e = u.Cross(t, a);
    } else
      e = u.Cross(t, s), u.CrossToRef(e, t, e);
    return e.normalize(), e;
  }
  /**
   * Updates the point at data for an interpolated point along this curve
   * @param position the position of the point along this curve, from 0.0 to 1.0
   * @param interpolateTNB
   * @interpolateTNB whether to compute the interpolated tangent, normal and binormal
   * @returns the (updated) point at data
   */
  _updatePointAtData(t, s = !1) {
    if (this._pointAtData.id === t)
      return this._pointAtData.interpolateReady || this._updateInterpolationMatrix(), this._pointAtData;
    this._pointAtData.id = t;
    const e = this.getPoints();
    if (t <= 0)
      return this._setPointAtData(0, 0, e[0], 0, s);
    if (t >= 1)
      return this._setPointAtData(1, 1, e[e.length - 1], e.length - 1, s);
    let i = e[0], a, h = 0;
    const o = t * this.length();
    for (let n = 1; n < e.length; n++) {
      a = e[n];
      const r = u.Distance(i, a);
      if (h += r, h === o)
        return this._setPointAtData(t, 1, a, n, s);
      if (h > o) {
        const l = (h - o) / r, _ = i.subtract(a), p = a.add(_.scaleInPlace(l));
        return this._setPointAtData(t, 1 - l, p, n - 1, s);
      }
      i = a;
    }
    return this._pointAtData;
  }
  /**
   * Updates the point at data from the specified parameters
   * @param position where along the path the interpolated point is, from 0.0 to 1.0
   * @param subPosition
   * @param point the interpolated point
   * @param parentIndex the index of an existing curve point that is on, or else positionally the first behind, the interpolated point
   * @param interpolateTNB whether to compute the interpolated tangent, normal and binormal
   * @returns the (updated) point at data
   */
  _setPointAtData(t, s, e, i, a) {
    return this._pointAtData.point = e, this._pointAtData.position = t, this._pointAtData.subPosition = s, this._pointAtData.previousPointArrayIndex = i, this._pointAtData.interpolateReady = a, a && this._updateInterpolationMatrix(), this._pointAtData;
  }
  /**
   * Updates the point at interpolation matrix for the tangents, normals and binormals
   */
  _updateInterpolationMatrix() {
    this._pointAtData.interpolationMatrix = L.Identity();
    const t = this._pointAtData.previousPointArrayIndex;
    if (t !== this._tangents.length - 1) {
      const s = t + 1, e = this._tangents[t].clone(), i = this._normals[t].clone(), a = this._binormals[t].clone(), h = this._tangents[s].clone(), o = this._normals[s].clone(), n = this._binormals[s].clone(), r = T.RotationQuaternionFromAxis(i, a, e), c = T.RotationQuaternionFromAxis(o, n, h);
      T.Slerp(r, c, this._pointAtData.subPosition).toRotationMatrix(this._pointAtData.interpolationMatrix);
    }
  }
}
class A {
  /**
   * Returns a Curve3 object along a Quadratic Bezier curve : https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves#quadratic-bezier-curve
   * @param v0 (Vector3) the origin point of the Quadratic Bezier
   * @param v1 (Vector3) the control point
   * @param v2 (Vector3) the end point of the Quadratic Bezier
   * @param nbPoints (integer) the wanted number of points in the curve
   * @returns the created Curve3
   */
  static CreateQuadraticBezier(t, s, e, i) {
    i = i > 2 ? i : 3;
    const a = [], h = (o, n, r, c) => (1 - o) * (1 - o) * n + 2 * o * (1 - o) * r + o * o * c;
    for (let o = 0; o <= i; o++)
      a.push(new u(h(o / i, t.x, s.x, e.x), h(o / i, t.y, s.y, e.y), h(o / i, t.z, s.z, e.z)));
    return new A(a);
  }
  /**
   * Returns a Curve3 object along a Cubic Bezier curve : https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves#cubic-bezier-curve
   * @param v0 (Vector3) the origin point of the Cubic Bezier
   * @param v1 (Vector3) the first control point
   * @param v2 (Vector3) the second control point
   * @param v3 (Vector3) the end point of the Cubic Bezier
   * @param nbPoints (integer) the wanted number of points in the curve
   * @returns the created Curve3
   */
  static CreateCubicBezier(t, s, e, i, a) {
    a = a > 3 ? a : 4;
    const h = [], o = (n, r, c, l, _) => (1 - n) * (1 - n) * (1 - n) * r + 3 * n * (1 - n) * (1 - n) * c + 3 * n * n * (1 - n) * l + n * n * n * _;
    for (let n = 0; n <= a; n++)
      h.push(new u(o(n / a, t.x, s.x, e.x, i.x), o(n / a, t.y, s.y, e.y, i.y), o(n / a, t.z, s.z, e.z, i.z)));
    return new A(h);
  }
  /**
   * Returns a Curve3 object along a Hermite Spline curve : https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves#hermite-spline
   * @param p1 (Vector3) the origin point of the Hermite Spline
   * @param t1 (Vector3) the tangent vector at the origin point
   * @param p2 (Vector3) the end point of the Hermite Spline
   * @param t2 (Vector3) the tangent vector at the end point
   * @param nSeg (integer) the number of curve segments or nSeg + 1 points in the array
   * @returns the created Curve3
   */
  static CreateHermiteSpline(t, s, e, i, a) {
    const h = [], o = 1 / a;
    for (let n = 0; n <= a; n++)
      h.push(u.Hermite(t, s, e, i, n * o));
    return new A(h);
  }
  /**
   * Returns a Curve3 object along a CatmullRom Spline curve :
   * @param points (array of Vector3) the points the spline must pass through. At least, four points required
   * @param nbPoints (integer) the wanted number of points between each curve control points
   * @param closed (boolean) optional with default false, when true forms a closed loop from the points
   * @returns the created Curve3
   */
  static CreateCatmullRomSpline(t, s, e) {
    const i = [], a = 1 / s;
    let h = 0;
    if (e) {
      const o = t.length;
      for (let n = 0; n < o; n++) {
        h = 0;
        for (let r = 0; r < s; r++)
          i.push(u.CatmullRom(t[n % o], t[(n + 1) % o], t[(n + 2) % o], t[(n + 3) % o], h)), h += a;
      }
      i.push(i[0]);
    } else {
      const o = [];
      o.push(t[0].clone()), Array.prototype.push.apply(o, t), o.push(t[t.length - 1].clone());
      let n = 0;
      for (; n < o.length - 3; n++) {
        h = 0;
        for (let r = 0; r < s; r++)
          i.push(u.CatmullRom(o[n], o[n + 1], o[n + 2], o[n + 3], h)), h += a;
      }
      n--, i.push(u.CatmullRom(o[n], o[n + 1], o[n + 2], o[n + 3], h));
    }
    return new A(i);
  }
  /**
   * Returns a Curve3 object along an arc through three vector3 points:
   * The three points should not be colinear. When they are the Curve3 is empty.
   * @param first (Vector3) the first point the arc must pass through.
   * @param second (Vector3) the second point the arc must pass through.
   * @param third (Vector3) the third point the arc must pass through.
   * @param steps (number) the larger the number of steps the more detailed the arc.
   * @param closed (boolean) optional with default false, when true forms the chord from the first and third point
   * @param fullCircle Circle (boolean) optional with default false, when true forms the complete circle through the three points
   * @returns the created Curve3
   */
  static ArcThru3Points(t, s, e, i = 32, a = !1, h = !1) {
    const o = [], n = s.subtract(t), r = e.subtract(s), c = t.subtract(e), l = u.Cross(n, r), _ = l.length();
    if (_ < Math.pow(10, -8))
      return new A(o);
    const p = n.lengthSquared(), m = r.lengthSquared(), v = c.lengthSquared(), M = l.lengthSquared(), R = n.length(), F = r.length(), W = c.length(), w = 0.5 * R * F * W / _, S = u.Dot(n, c), E = u.Dot(n, r), B = u.Dot(r, c), Q = -0.5 * m * S / M, Z = -0.5 * v * E / M, H = -0.5 * p * B / M, C = t.scale(Q).add(s.scale(Z)).add(e.scale(H)), b = t.subtract(C).normalize(), q = u.Cross(l, b).normalize();
    if (h) {
      const P = 2 * Math.PI / i;
      for (let d = 0; d <= 2 * Math.PI; d += P)
        o.push(C.add(b.scale(w * Math.cos(d)).add(q.scale(w * Math.sin(d)))));
      o.push(t);
    } else {
      const P = 1 / i;
      let d = 0, I = u.Zero();
      do
        I = C.add(b.scale(w * Math.cos(d)).add(q.scale(w * Math.sin(d)))), o.push(I), d += P;
      while (!I.equalsWithEpsilon(e, w * P * 1.1));
      o.push(e), a && o.push(t);
    }
    return new A(o);
  }
  /**
   * A Curve3 object is a logical object, so not a mesh, to handle curves in the 3D geometric space.
   * A Curve3 is designed from a series of successive Vector3.
   * Tuto : https://doc.babylonjs.com/features/featuresDeepDive/mesh/drawCurves#curve3-object
   * @param points points which make up the curve
   */
  constructor(t) {
    this._length = 0, this._points = t, this._length = this._computeLength(t);
  }
  /**
   * @returns the Curve3 stored array of successive Vector3
   */
  getPoints() {
    return this._points;
  }
  /**
   * @returns the computed length (float) of the curve.
   */
  length() {
    return this._length;
  }
  /**
   * Returns a new instance of Curve3 object : var curve = curveA.continue(curveB);
   * This new Curve3 is built by translating and sticking the curveB at the end of the curveA.
   * curveA and curveB keep unchanged.
   * @param curve the curve to continue from this curve
   * @returns the newly constructed curve
   */
  continue(t) {
    const s = this._points[this._points.length - 1], e = this._points.slice(), i = t.getPoints();
    for (let h = 1; h < i.length; h++)
      e.push(i[h].subtract(i[0]).add(s));
    return new A(e);
  }
  _computeLength(t) {
    let s = 0;
    for (let e = 1; e < t.length; e++)
      s += t[e].subtract(t[e - 1]).length();
    return s;
  }
}
export {
  g as A,
  X as B,
  A as C,
  y as O,
  N as P,
  V as a,
  U as b
};
//# sourceMappingURL=math.path-2Lw1sJUP.js.map
