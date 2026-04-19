import { E as z, a as m, B as C, i as y, M, d as D, u as W } from "./embed-entry-BKE21f6Q.js";
import { a as T, P as _ } from "./scene-BIBh3wH1.js";
import { C as w } from "./camera-DrW_r1mf.js";
class f {
  /**
   * Creates a new ray
   * @param origin origin point
   * @param direction direction
   * @param length length of the ray
   * @param epsilon The epsilon value to use when calculating the ray/triangle intersection (default: 0)
   */
  constructor(e, i, t = Number.MAX_VALUE, n = z) {
    this.origin = e, this.direction = i, this.length = t, this.epsilon = n;
  }
  // Methods
  /**
   * Clone the current ray
   * @returns a new ray
   */
  clone() {
    return new f(this.origin.clone(), this.direction.clone(), this.length);
  }
  /**
   * Checks if the ray intersects a box
   * This does not account for the ray length by design to improve perfs.
   * @param minimum bound of the box
   * @param maximum bound of the box
   * @param intersectionTreshold extra extend to be added to the box in all direction
   * @returns if the box was hit
   */
  intersectsBoxMinMax(e, i, t = 0) {
    const n = f._TmpVector3[0].copyFromFloats(e.x - t, e.y - t, e.z - t), r = f._TmpVector3[1].copyFromFloats(i.x + t, i.y + t, i.z + t);
    let a = 0, o = Number.MAX_VALUE, h, s, c, u;
    if (Math.abs(this.direction.x) < 1e-7) {
      if (this.origin.x < n.x || this.origin.x > r.x)
        return !1;
    } else if (h = 1 / this.direction.x, s = (n.x - this.origin.x) * h, c = (r.x - this.origin.x) * h, c === -1 / 0 && (c = 1 / 0), s > c && (u = s, s = c, c = u), a = Math.max(s, a), o = Math.min(c, o), a > o)
      return !1;
    if (Math.abs(this.direction.y) < 1e-7) {
      if (this.origin.y < n.y || this.origin.y > r.y)
        return !1;
    } else if (h = 1 / this.direction.y, s = (n.y - this.origin.y) * h, c = (r.y - this.origin.y) * h, c === -1 / 0 && (c = 1 / 0), s > c && (u = s, s = c, c = u), a = Math.max(s, a), o = Math.min(c, o), a > o)
      return !1;
    if (Math.abs(this.direction.z) < 1e-7) {
      if (this.origin.z < n.z || this.origin.z > r.z)
        return !1;
    } else if (h = 1 / this.direction.z, s = (n.z - this.origin.z) * h, c = (r.z - this.origin.z) * h, c === -1 / 0 && (c = 1 / 0), s > c && (u = s, s = c, c = u), a = Math.max(s, a), o = Math.min(c, o), a > o)
      return !1;
    return !0;
  }
  /**
   * Checks if the ray intersects a box
   * This does not account for the ray lenght by design to improve perfs.
   * @param box the bounding box to check
   * @param intersectionTreshold extra extend to be added to the BoundingBox in all direction
   * @returns if the box was hit
   */
  intersectsBox(e, i = 0) {
    return this.intersectsBoxMinMax(e.minimum, e.maximum, i);
  }
  /**
   * If the ray hits a sphere
   * @param sphere the bounding sphere to check
   * @param intersectionTreshold extra extend to be added to the BoundingSphere in all direction
   * @returns true if it hits the sphere
   */
  intersectsSphere(e, i = 0) {
    const t = e.center.x - this.origin.x, n = e.center.y - this.origin.y, r = e.center.z - this.origin.z, a = t * t + n * n + r * r, o = e.radius + i, h = o * o;
    if (a <= h)
      return !0;
    const s = t * this.direction.x + n * this.direction.y + r * this.direction.z;
    return s < 0 ? !1 : a - s * s <= h;
  }
  /**
   * If the ray hits a triange
   * @param vertex0 triangle vertex
   * @param vertex1 triangle vertex
   * @param vertex2 triangle vertex
   * @returns intersection information if hit
   */
  intersectsTriangle(e, i, t) {
    const n = f._TmpVector3[0], r = f._TmpVector3[1], a = f._TmpVector3[2], o = f._TmpVector3[3], h = f._TmpVector3[4];
    i.subtractToRef(e, n), t.subtractToRef(e, r), m.CrossToRef(this.direction, r, a);
    const s = m.Dot(n, a);
    if (s === 0)
      return null;
    const c = 1 / s;
    this.origin.subtractToRef(e, o);
    const u = m.Dot(o, a) * c;
    if (u < -this.epsilon || u > 1 + this.epsilon)
      return null;
    m.CrossToRef(o, n, h);
    const d = m.Dot(this.direction, h) * c;
    if (d < -this.epsilon || u + d > 1 + this.epsilon)
      return null;
    const g = m.Dot(r, h) * c;
    return g > this.length ? null : new C(1 - u - d, u, g);
  }
  /**
   * Checks if ray intersects a plane
   * @param plane the plane to check
   * @returns the distance away it was hit
   */
  intersectsPlane(e) {
    let i;
    const t = m.Dot(e.normal, this.direction);
    if (Math.abs(t) < 999999997475243e-21)
      return null;
    {
      const n = m.Dot(e.normal, this.origin);
      return i = (-e.d - n) / t, i < 0 ? i < -999999997475243e-21 ? null : 0 : i;
    }
  }
  /**
   * Calculate the intercept of a ray on a given axis
   * @param axis to check 'x' | 'y' | 'z'
   * @param offset from axis interception (i.e. an offset of 1y is intercepted above ground)
   * @returns a vector containing the coordinates where 'axis' is equal to zero (else offset), or null if there is no intercept.
   */
  intersectsAxis(e, i = 0) {
    switch (e) {
      case "y": {
        const t = (this.origin.y - i) / this.direction.y;
        return t > 0 ? null : new m(this.origin.x + this.direction.x * -t, i, this.origin.z + this.direction.z * -t);
      }
      case "x": {
        const t = (this.origin.x - i) / this.direction.x;
        return t > 0 ? null : new m(i, this.origin.y + this.direction.y * -t, this.origin.z + this.direction.z * -t);
      }
      case "z": {
        const t = (this.origin.z - i) / this.direction.z;
        return t > 0 ? null : new m(this.origin.x + this.direction.x * -t, this.origin.y + this.direction.y * -t, i);
      }
      default:
        return null;
    }
  }
  /**
   * Checks if ray intersects a mesh. The ray is defined in WORLD space. A mesh triangle can be picked both from its front and back sides,
   * irrespective of orientation.
   * @param mesh the mesh to check
   * @param fastCheck defines if the first intersection will be used (and not the closest)
   * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
   * @param onlyBoundingInfo defines a boolean indicating if picking should only happen using bounding info (false by default)
   * @param worldToUse defines the world matrix to use to get the world coordinate of the intersection point
   * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
   * @returns picking info of the intersection
   */
  intersectsMesh(e, i, t, n = !1, r, a = !1) {
    const o = y.Matrix[0];
    return e.getWorldMatrix().invertToRef(o), this._tmpRay ? f.TransformToRef(this, o, this._tmpRay) : this._tmpRay = f.Transform(this, o), e.intersects(this._tmpRay, i, t, n, r, a);
  }
  /**
   * Checks if ray intersects a mesh
   * @param meshes the meshes to check
   * @param fastCheck defines if the first intersection will be used (and not the closest)
   * @param results array to store result in
   * @returns Array of picking infos
   */
  intersectsMeshes(e, i, t) {
    t ? t.length = 0 : t = [];
    for (let n = 0; n < e.length; n++) {
      const r = this.intersectsMesh(e[n], i);
      r.hit && t.push(r);
    }
    return t.sort(this._comparePickingInfo), t;
  }
  _comparePickingInfo(e, i) {
    return e.distance < i.distance ? -1 : e.distance > i.distance ? 1 : 0;
  }
  /**
   * Intersection test between the ray and a given segment within a given tolerance (threshold)
   * @param sega the first point of the segment to test the intersection against
   * @param segb the second point of the segment to test the intersection against
   * @param threshold the tolerance margin, if the ray doesn't intersect the segment but is close to the given threshold, the intersection is successful
   * @returns the distance from the ray origin to the intersection point if there's intersection, or -1 if there's no intersection
   */
  intersectionSegment(e, i, t) {
    const n = this.origin, r = y.Vector3[0], a = y.Vector3[1], o = y.Vector3[2], h = y.Vector3[3];
    i.subtractToRef(e, r), this.direction.scaleToRef(f._Rayl, o), n.addToRef(o, a), e.subtractToRef(n, h);
    const s = m.Dot(r, r), c = m.Dot(r, o), u = m.Dot(o, o), d = m.Dot(r, h), g = m.Dot(o, h), x = s * u - c * c;
    let p, k = x, R, P = x;
    x < f._Smallnum ? (p = 0, k = 1, R = g, P = u) : (p = c * g - u * d, R = s * g - c * d, p < 0 ? (p = 0, R = g, P = u) : p > k && (p = k, R = g + c, P = u)), R < 0 ? (R = 0, -d < 0 ? p = 0 : -d > s ? p = k : (p = -d, k = s)) : R > P && (R = P, -d + c < 0 ? p = 0 : -d + c > s ? p = k : (p = -d + c, k = s));
    const V = Math.abs(p) < f._Smallnum ? 0 : p / k, v = Math.abs(R) < f._Smallnum ? 0 : R / P, F = y.Vector3[4];
    o.scaleToRef(v, F);
    const I = y.Vector3[5];
    r.scaleToRef(V, I), I.addInPlace(h);
    const b = y.Vector3[6];
    return I.subtractToRef(F, b), v > 0 && v <= this.length && b.lengthSquared() < t * t ? I.length() : -1;
  }
  /**
   * Update the ray from viewport position
   * @param x position
   * @param y y position
   * @param viewportWidth viewport width
   * @param viewportHeight viewport height
   * @param world world matrix
   * @param view view matrix
   * @param projection projection matrix
   * @param enableDistantPicking defines if picking should handle large values for mesh position/scaling (false by default)
   * @returns this ray updated
   */
  update(e, i, t, n, r, a, o, h = !1) {
    if (h) {
      f._RayDistant || (f._RayDistant = f.Zero()), f._RayDistant.unprojectRayToRef(e, i, t, n, M.IdentityReadOnly, a, o);
      const s = y.Matrix[0];
      r.invertToRef(s), f.TransformToRef(f._RayDistant, s, this);
    } else
      this.unprojectRayToRef(e, i, t, n, r, a, o);
    return this;
  }
  // Statics
  /**
   * Creates a ray with origin and direction of 0,0,0
   * @returns the new ray
   */
  static Zero() {
    return new f(m.Zero(), m.Zero());
  }
  /**
   * Creates a new ray from screen space and viewport
   * @param x position
   * @param y y position
   * @param viewportWidth viewport width
   * @param viewportHeight viewport height
   * @param world world matrix
   * @param view view matrix
   * @param projection projection matrix
   * @returns new ray
   */
  static CreateNew(e, i, t, n, r, a, o) {
    return f.Zero().update(e, i, t, n, r, a, o);
  }
  /**
   * Function will create a new transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
   * transformed to the given world matrix.
   * @param origin The origin point
   * @param end The end point
   * @param world a matrix to transform the ray to. Default is the identity matrix.
   * @returns the new ray
   */
  static CreateNewFromTo(e, i, t = M.IdentityReadOnly) {
    const n = new f(new m(0, 0, 0), new m(0, 0, 0));
    return f.CreateFromToToRef(e, i, n, t);
  }
  /**
   * Function will update a transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
   * transformed to the given world matrix.
   * @param origin The origin point
   * @param end The end point
   * @param result the object to store the result
   * @param world a matrix to transform the ray to. Default is the identity matrix.
   * @returns the ref ray
   */
  static CreateFromToToRef(e, i, t, n = M.IdentityReadOnly) {
    t.origin.copyFrom(e);
    const r = i.subtractToRef(e, t.direction), a = Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z);
    return t.length = a, t.direction.normalize(), f.TransformToRef(t, n, t);
  }
  /**
   * Transforms a ray by a matrix
   * @param ray ray to transform
   * @param matrix matrix to apply
   * @returns the resulting new ray
   */
  static Transform(e, i) {
    const t = new f(new m(0, 0, 0), new m(0, 0, 0));
    return f.TransformToRef(e, i, t), t;
  }
  /**
   * Transforms a ray by a matrix
   * @param ray ray to transform
   * @param matrix matrix to apply
   * @param result ray to store result in
   * @returns the updated result ray
   */
  static TransformToRef(e, i, t) {
    m.TransformCoordinatesToRef(e.origin, i, t.origin), m.TransformNormalToRef(e.direction, i, t.direction), t.length = e.length, t.epsilon = e.epsilon;
    const n = t.direction, r = n.length();
    if (!(r === 0 || r === 1)) {
      const a = 1 / r;
      n.x *= a, n.y *= a, n.z *= a, t.length *= r;
    }
    return t;
  }
  /**
   * Unproject a ray from screen space to object space
   * @param sourceX defines the screen space x coordinate to use
   * @param sourceY defines the screen space y coordinate to use
   * @param viewportWidth defines the current width of the viewport
   * @param viewportHeight defines the current height of the viewport
   * @param world defines the world matrix to use (can be set to Identity to go to world space)
   * @param view defines the view matrix to use
   * @param projection defines the projection matrix to use
   */
  unprojectRayToRef(e, i, t, n, r, a, o) {
    const h = y.Matrix[0];
    r.multiplyToRef(a, h), h.multiplyToRef(o, h), h.invert();
    const s = D.LastCreatedEngine, c = y.Vector3[0];
    c.x = e / t * 2 - 1, c.y = -(i / n * 2 - 1), c.z = s?.useReverseDepthBuffer ? 1 : s?.isNDCHalfZRange ? 0 : -1;
    const u = y.Vector3[1].copyFromFloats(c.x, c.y, 1 - 1e-8), d = y.Vector3[2], g = y.Vector3[3];
    m._UnprojectFromInvertedMatrixToRef(c, h, d), m._UnprojectFromInvertedMatrixToRef(u, h, g), this.origin.copyFrom(d), g.subtractToRef(d, this.direction), this.direction.normalize();
  }
}
f._TmpVector3 = W.BuildArray(6, m.Zero);
f._RayDistant = f.Zero();
f._Smallnum = 1e-8;
f._Rayl = 1e9;
T.prototype.createPickingRay = function(l, e, i, t, n = !1) {
  const r = f.Zero();
  return this.createPickingRayToRef(l, e, i, r, t, n), r;
};
T.prototype.createPickingRayToRef = function(l, e, i, t, n, r = !1, a = !1) {
  const o = this.getEngine();
  if (!n && !(n = this.activeCamera))
    return this;
  const h = n.viewport, s = o.getRenderHeight(), { x: c, y: u, width: d, height: g } = h.toGlobal(o.getRenderWidth(), s), x = 1 / o.getHardwareScalingLevel();
  return l = l * x - c, e = e * x - (s - u - g), t.update(l, e, d, g, i || M.IdentityReadOnly, r ? M.IdentityReadOnly : n.getViewMatrix(), n.getProjectionMatrix(), a), this;
};
T.prototype.createPickingRayInCameraSpace = function(l, e, i) {
  const t = f.Zero();
  return this.createPickingRayInCameraSpaceToRef(l, e, t, i), t;
};
T.prototype.createPickingRayInCameraSpaceToRef = function(l, e, i, t) {
  if (!_)
    return this;
  const n = this.getEngine();
  if (!t && !(t = this.activeCamera))
    throw new Error("Active camera not set");
  const r = t.viewport, a = n.getRenderHeight(), { x: o, y: h, width: s, height: c } = r.toGlobal(n.getRenderWidth(), a), u = M.Identity(), d = 1 / n.getHardwareScalingLevel();
  return l = l * d - o, e = e * d - (a - h - c), i.update(l, e, s, c, u, u, t.getProjectionMatrix()), this;
};
T.prototype._internalPickForMesh = function(l, e, i, t, n, r, a, o) {
  const h = e(t, i.enableDistantPicking), s = i.intersects(h, n, a, r, t, o);
  return !s || !s.hit || !n && l != null && s.distance >= l.distance ? null : s;
};
T.prototype._internalPick = function(l, e, i, t, n) {
  let r = null;
  const a = !!(this.activeCameras && this.activeCameras.length > 1 && this.cameraToUseForPointers !== this.activeCamera), o = this.cameraToUseForPointers || this.activeCamera;
  for (let h = 0; h < this.meshes.length; h++) {
    const s = this.meshes[h];
    if (e) {
      if (!e(s))
        continue;
    } else if (!s.isEnabled() || !s.isVisible || !s.isPickable)
      continue;
    const c = a && s.isWorldMatrixCameraDependent(), u = s.computeWorldMatrix(c, o);
    if (s.hasThinInstances && s.thinInstanceEnablePicking) {
      const d = this._internalPickForMesh(r, l, s, u, !0, !0, n);
      if (d) {
        if (t)
          return d;
        const g = y.Matrix[1], x = s.thinInstanceGetWorldMatrices();
        for (let p = 0; p < x.length; p++) {
          x[p].multiplyToRef(u, g);
          const R = this._internalPickForMesh(r, l, s, g, i, t, n, !0);
          if (R && (r = R, r.thinInstanceIndex = p, i))
            return r;
        }
      }
    } else {
      const d = this._internalPickForMesh(r, l, s, u, i, t, n);
      if (d && (r = d, i))
        return r;
    }
  }
  return r || new _();
};
T.prototype._internalMultiPick = function(l, e, i) {
  if (!_)
    return null;
  const t = [], n = !!(this.activeCameras && this.activeCameras.length > 1 && this.cameraToUseForPointers !== this.activeCamera), r = this.cameraToUseForPointers || this.activeCamera;
  for (let a = 0; a < this.meshes.length; a++) {
    const o = this.meshes[a];
    if (e) {
      if (!e(o))
        continue;
    } else if (!o.isEnabled() || !o.isVisible || !o.isPickable)
      continue;
    const h = n && o.isWorldMatrixCameraDependent(), s = o.computeWorldMatrix(h, r);
    if (o.hasThinInstances && o.thinInstanceEnablePicking) {
      if (this._internalPickForMesh(null, l, o, s, !0, !0, i)) {
        const u = y.Matrix[1], d = o.thinInstanceGetWorldMatrices();
        for (let g = 0; g < d.length; g++) {
          d[g].multiplyToRef(s, u);
          const p = this._internalPickForMesh(null, l, o, u, !1, !1, i, !0);
          p && (p.thinInstanceIndex = g, t.push(p));
        }
      }
    } else {
      const c = this._internalPickForMesh(null, l, o, s, !1, !1, i);
      c && t.push(c);
    }
  }
  return t;
};
T.prototype.pickWithBoundingInfo = function(l, e, i, t, n) {
  if (!_)
    return null;
  const r = this._internalPick((a) => (this._tempPickingRay || (this._tempPickingRay = f.Zero()), this.createPickingRayToRef(l, e, a, this._tempPickingRay, n || null), this._tempPickingRay), i, t, !0);
  return r && (r.ray = this.createPickingRay(l, e, M.Identity(), n || null)), r;
};
Object.defineProperty(T.prototype, "_pickingAvailable", {
  get: () => !0,
  enumerable: !1,
  configurable: !1
});
T.prototype.pick = function(l, e, i, t, n, r, a = !1) {
  const o = this._internalPick((h, s) => (this._tempPickingRay || (this._tempPickingRay = f.Zero()), this.createPickingRayToRef(l, e, h, this._tempPickingRay, n || null, !1, s), this._tempPickingRay), i, t, !1, r);
  return o && (o.ray = this.createPickingRay(l, e, M.Identity(), n || null)), o;
};
T.prototype.pickWithRay = function(l, e, i, t) {
  const n = this._internalPick((r) => (this._pickWithRayInverseMatrix || (this._pickWithRayInverseMatrix = M.Identity()), r.invertToRef(this._pickWithRayInverseMatrix), this._cachedRayForTransform || (this._cachedRayForTransform = f.Zero()), f.TransformToRef(l, this._pickWithRayInverseMatrix, this._cachedRayForTransform), this._cachedRayForTransform), e, i, !1, t);
  return n && (n.ray = l), n;
};
T.prototype.multiPick = function(l, e, i, t, n) {
  return this._internalMultiPick((r) => this.createPickingRay(l, e, r, t || null), i, n);
};
T.prototype.multiPickWithRay = function(l, e, i) {
  return this._internalMultiPick((t) => (this._pickWithRayInverseMatrix || (this._pickWithRayInverseMatrix = M.Identity()), t.invertToRef(this._pickWithRayInverseMatrix), this._cachedRayForTransform || (this._cachedRayForTransform = f.Zero()), f.TransformToRef(l, this._pickWithRayInverseMatrix, this._cachedRayForTransform), this._cachedRayForTransform), e, i);
};
w.prototype.getForwardRay = function(l = 100, e, i) {
  return this.getForwardRayToRef(new f(m.Zero(), m.Zero(), l), l, e, i);
};
w.prototype.getForwardRayToRef = function(l, e = 100, i, t) {
  i || (i = this.getWorldMatrix()), l.length = e, t ? l.origin.copyFrom(t) : l.origin.copyFrom(this.position);
  const n = y.Vector3[2];
  n.set(0, 0, this._scene.useRightHandedSystem ? -1 : 1);
  const r = y.Vector3[3];
  return m.TransformNormalToRef(n, i, r), m.NormalizeToRef(r, l.direction), l;
};
export {
  f as R
};
//# sourceMappingURL=ray-4GuTw_Cl.js.map
