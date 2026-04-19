import { i as x, a as w, g as E, v as G, V as N, h as Q, d as W, T as L, y as F, E as P, z as S } from "./embed-entry-BgvWRWVI.js";
import { M as z } from "./mesh-DLjlGcQU.js";
z._GroundMeshParser = (s, i) => Z.Parse(s, i);
class Z extends z {
  constructor(i, t) {
    super(i, t), this.generateOctree = !1;
  }
  /**
   * "GroundMesh"
   * @returns "GroundMesh"
   */
  getClassName() {
    return "GroundMesh";
  }
  /**
   * The minimum of x and y subdivisions
   */
  get subdivisions() {
    return Math.min(this._subdivisionsX, this._subdivisionsY);
  }
  /**
   * X subdivisions
   */
  get subdivisionsX() {
    return this._subdivisionsX;
  }
  /**
   * Y subdivisions
   */
  get subdivisionsY() {
    return this._subdivisionsY;
  }
  /**
   * This function will divide the mesh into submeshes and update an octree to help to select the right submeshes
   * for rendering, picking and collision computations. Please note that you must have a decent number of submeshes
   * to get performance improvements when using an octree.
   * @param chunksCount the number of submeshes the mesh will be divided into
   * @param octreeBlocksSize the maximum size of the octree blocks (Default: 32)
   */
  optimize(i, t = 32) {
    this._subdivisionsX = i, this._subdivisionsY = i, this.subdivide(i);
    const e = this;
    e.createOrUpdateSubmeshesOctree && e.createOrUpdateSubmeshesOctree(t);
  }
  /**
   * Returns a height (y) value in the World system :
   * the ground altitude at the coordinates (x, z) expressed in the World system.
   * @param x x coordinate
   * @param z z coordinate
   * @returns the ground y position if (x, z) are outside the ground surface.
   */
  getHeightAtCoordinates(i, t) {
    const e = this.getWorldMatrix(), a = x.Matrix[5];
    e.invertToRef(a);
    const n = x.Vector3[8];
    if (w.TransformCoordinatesFromFloatsToRef(i, 0, t, a, n), i = n.x, t = n.z, i < this._minX || i >= this._maxX || t <= this._minZ || t > this._maxZ)
      return this.position.y;
    (!this._heightQuads || this._heightQuads.length == 0) && (this._initHeightQuads(), this._computeHeightQuads());
    const r = this._getFacetAt(i, t), c = -(r.x * i + r.z * t + r.w) / r.y;
    return w.TransformCoordinatesFromFloatsToRef(0, c, 0, e, n), n.y;
  }
  /**
   * Returns a normalized vector (Vector3) orthogonal to the ground
   * at the ground coordinates (x, z) expressed in the World system.
   * @param x x coordinate
   * @param z z coordinate
   * @returns Vector3(0.0, 1.0, 0.0) if (x, z) are outside the ground surface.
   */
  getNormalAtCoordinates(i, t) {
    const e = new w(0, 1, 0);
    return this.getNormalAtCoordinatesToRef(i, t, e), e;
  }
  /**
   * Updates the Vector3 passed a reference with a normalized vector orthogonal to the ground
   * at the ground coordinates (x, z) expressed in the World system.
   * Doesn't update the reference Vector3 if (x, z) are outside the ground surface.
   * @param x x coordinate
   * @param z z coordinate
   * @param ref vector to store the result
   * @returns the GroundMesh.
   */
  getNormalAtCoordinatesToRef(i, t, e) {
    const a = this.getWorldMatrix(), n = x.Matrix[5];
    a.invertToRef(n);
    const r = x.Vector3[8];
    if (w.TransformCoordinatesFromFloatsToRef(i, 0, t, n, r), i = r.x, t = r.z, i < this._minX || i > this._maxX || t < this._minZ || t > this._maxZ)
      return this;
    (!this._heightQuads || this._heightQuads.length == 0) && (this._initHeightQuads(), this._computeHeightQuads());
    const c = this._getFacetAt(i, t);
    return w.TransformNormalFromFloatsToRef(c.x, c.y, c.z, a, e), this;
  }
  /**
   * Force the heights to be recomputed for getHeightAtCoordinates() or getNormalAtCoordinates()
   * if the ground has been updated.
   * This can be used in the render loop.
   * @returns the GroundMesh.
   */
  updateCoordinateHeights() {
    return (!this._heightQuads || this._heightQuads.length == 0) && this._initHeightQuads(), this._computeHeightQuads(), this;
  }
  // Returns the element "facet" from the heightQuads array relative to (x, z) local coordinates
  _getFacetAt(i, t) {
    const e = Math.floor((i + this._maxX) * this._subdivisionsX / this._width), a = Math.floor(-(t + this._maxZ) * this._subdivisionsY / this._height + this._subdivisionsY), n = this._heightQuads[a * this._subdivisionsX + e];
    let r;
    return t < n.slope.x * i + n.slope.y ? r = n.facet1 : r = n.facet2, r;
  }
  //  Creates and populates the heightMap array with "facet" elements :
  // a quad is two triangular facets separated by a slope, so a "facet" element is 1 slope + 2 facets
  // slope : Vector2(c, h) = 2D diagonal line equation setting apart two triangular facets in a quad : z = cx + h
  // facet1 : Vector4(a, b, c, d) = first facet 3D plane equation : ax + by + cz + d = 0
  // facet2 :  Vector4(a, b, c, d) = second facet 3D plane equation : ax + by + cz + d = 0
  // Returns the GroundMesh.
  _initHeightQuads() {
    const i = this._subdivisionsX, t = this._subdivisionsY;
    this._heightQuads = new Array();
    for (let e = 0; e < t; e++)
      for (let a = 0; a < i; a++) {
        const n = { slope: E.Zero(), facet1: new G(0, 0, 0, 0), facet2: new G(0, 0, 0, 0) };
        this._heightQuads[e * i + a] = n;
      }
    return this;
  }
  // Compute each quad element values and update the heightMap array :
  // slope : Vector2(c, h) = 2D diagonal line equation setting apart two triangular facets in a quad : z = cx + h
  // facet1 : Vector4(a, b, c, d) = first facet 3D plane equation : ax + by + cz + d = 0
  // facet2 :  Vector4(a, b, c, d) = second facet 3D plane equation : ax + by + cz + d = 0
  // Returns the GroundMesh.
  _computeHeightQuads() {
    const i = this.getVerticesData(N.PositionKind);
    if (!i)
      return this;
    const t = x.Vector3[3], e = x.Vector3[2], a = x.Vector3[1], n = x.Vector3[0], r = x.Vector3[4], c = x.Vector3[5], g = x.Vector3[6], d = x.Vector3[7], m = x.Vector3[8];
    let h = 0, u = 0, o = 0, f = 0, v = 0, b = 0, l = 0;
    const _ = this._subdivisionsX, y = this._subdivisionsY;
    for (let X = 0; X < y; X++)
      for (let V = 0; V < _; V++) {
        h = V * 3, u = X * (_ + 1) * 3, o = (X + 1) * (_ + 1) * 3, t.x = i[u + h], t.y = i[u + h + 1], t.z = i[u + h + 2], e.x = i[u + h + 3], e.y = i[u + h + 4], e.z = i[u + h + 5], a.x = i[o + h], a.y = i[o + h + 1], a.z = i[o + h + 2], n.x = i[o + h + 3], n.y = i[o + h + 4], n.z = i[o + h + 5], f = (n.z - t.z) / (n.x - t.x), v = t.z - f * t.x, e.subtractToRef(t, r), a.subtractToRef(t, c), n.subtractToRef(t, g), w.CrossToRef(g, c, d), w.CrossToRef(r, g, m), d.normalize(), m.normalize(), b = -(d.x * t.x + d.y * t.y + d.z * t.z), l = -(m.x * e.x + m.y * e.y + m.z * e.z);
        const H = this._heightQuads[X * _ + V];
        H.slope.copyFromFloats(f, v), H.facet1.copyFromFloats(d.x, d.y, d.z, b), H.facet2.copyFromFloats(m.x, m.y, m.z, l);
      }
    return this;
  }
  /**
   * Serializes this ground mesh
   * @param serializationObject object to write serialization to
   */
  serialize(i) {
    super.serialize(i), i.subdivisionsX = this._subdivisionsX, i.subdivisionsY = this._subdivisionsY, i.minX = this._minX, i.maxX = this._maxX, i.minZ = this._minZ, i.maxZ = this._maxZ, i.width = this._width, i.height = this._height;
  }
  /**
   * Parses a serialized ground mesh
   * @param parsedMesh the serialized mesh
   * @param scene the scene to create the ground mesh in
   * @returns the created ground mesh
   */
  static Parse(i, t) {
    const e = new Z(i.name, t);
    return e._subdivisionsX = i.subdivisionsX || 1, e._subdivisionsY = i.subdivisionsY || 1, e._minX = i.minX, e._maxX = i.maxX, e._minZ = i.minZ, e._maxZ = i.maxZ, e._width = i.width, e._height = i.height, e;
  }
}
function D(s) {
  const i = [], t = [], e = [], a = [];
  let n, r;
  const c = s.width || 1, g = s.height || 1, d = (s.subdivisionsX || s.subdivisions || 1) | 0, m = (s.subdivisionsY || s.subdivisions || 1) | 0;
  for (n = 0; n <= m; n++)
    for (r = 0; r <= d; r++) {
      const u = new w(r * c / d - c / 2, 0, (m - n) * g / m - g / 2), o = new w(0, 1, 0);
      t.push(u.x, u.y, u.z), e.push(o.x, o.y, o.z), a.push(r / d, S.UseOpenGLOrientationForUV ? n / m : 1 - n / m);
    }
  for (n = 0; n < m; n++)
    for (r = 0; r < d; r++)
      i.push(r + 1 + (n + 1) * (d + 1)), i.push(r + 1 + n * (d + 1)), i.push(r + n * (d + 1)), i.push(r + (n + 1) * (d + 1)), i.push(r + 1 + (n + 1) * (d + 1)), i.push(r + n * (d + 1));
  const h = new F();
  return h.indices = i, h.positions = t, h.normals = e, h.uvs = a, h;
}
function p(s) {
  const i = s.xmin !== void 0 && s.xmin !== null ? s.xmin : -1, t = s.zmin !== void 0 && s.zmin !== null ? s.zmin : -1, e = s.xmax !== void 0 && s.xmax !== null ? s.xmax : 1, a = s.zmax !== void 0 && s.zmax !== null ? s.zmax : 1, n = s.subdivisions || { w: 1, h: 1 }, r = s.precision || { w: 1, h: 1 }, c = [], g = [], d = [], m = [];
  let h, u, o, f;
  n.h = n.h < 1 ? 1 : n.h, n.w = n.w < 1 ? 1 : n.w, r.w = r.w < 1 ? 1 : r.w, r.h = r.h < 1 ? 1 : r.h;
  const v = {
    w: (e - i) / n.w,
    h: (a - t) / n.h
  };
  function b(_, y, X, V) {
    const H = g.length / 3, R = r.w + 1;
    for (h = 0; h < r.h; h++)
      for (u = 0; u < r.w; u++) {
        const T = [H + u + h * R, H + (u + 1) + h * R, H + (u + 1) + (h + 1) * R, H + u + (h + 1) * R];
        c.push(T[1]), c.push(T[2]), c.push(T[3]), c.push(T[0]), c.push(T[1]), c.push(T[3]);
      }
    const C = w.Zero(), Y = new w(0, 1, 0);
    for (h = 0; h <= r.h; h++)
      for (C.z = h * (V - y) / r.h + y, u = 0; u <= r.w; u++)
        C.x = u * (X - _) / r.w + _, C.y = 0, g.push(C.x, C.y, C.z), d.push(Y.x, Y.y, Y.z), m.push(u / r.w, h / r.h);
  }
  for (o = 0; o < n.h; o++)
    for (f = 0; f < n.w; f++)
      b(i + f * v.w, t + o * v.h, i + (f + 1) * v.w, t + (o + 1) * v.h);
  const l = new F();
  return l.indices = c, l.positions = g, l.normals = d, l.uvs = m, l;
}
function M(s) {
  const i = [], t = [], e = [], a = [];
  let n, r;
  const c = s.colorFilter || new Q(0.3, 0.59, 0.11), g = s.alphaFilter || 0;
  let d = !1;
  if (s.minHeight > s.maxHeight) {
    d = !0;
    const h = s.maxHeight;
    s.maxHeight = s.minHeight, s.minHeight = h;
  }
  for (n = 0; n <= s.subdivisions; n++)
    for (r = 0; r <= s.subdivisions; r++) {
      const h = new w(r * s.width / s.subdivisions - s.width / 2, 0, (s.subdivisions - n) * s.height / s.subdivisions - s.height / 2), u = (h.x + s.width / 2) / s.width * (s.bufferWidth - 1) | 0, o = (1 - (h.z + s.height / 2) / s.height) * (s.bufferHeight - 1) | 0, f = (u + o * s.bufferWidth) * 4;
      let v = s.buffer[f] / 255, b = s.buffer[f + 1] / 255, l = s.buffer[f + 2] / 255;
      const _ = s.buffer[f + 3] / 255;
      d && (v = 1 - v, b = 1 - b, l = 1 - l);
      const y = v * c.r + b * c.g + l * c.b;
      _ >= g ? h.y = s.minHeight + (s.maxHeight - s.minHeight) * y : h.y = s.minHeight - P, s.heightBuffer && (s.heightBuffer[n * (s.subdivisions + 1) + r] = h.y), t.push(h.x, h.y, h.z), e.push(0, 0, 0), a.push(r / s.subdivisions, 1 - n / s.subdivisions);
    }
  for (n = 0; n < s.subdivisions; n++)
    for (r = 0; r < s.subdivisions; r++) {
      const h = r + 1 + (n + 1) * (s.subdivisions + 1), u = r + 1 + n * (s.subdivisions + 1), o = r + n * (s.subdivisions + 1), f = r + (n + 1) * (s.subdivisions + 1), v = t[h * 3 + 1] >= s.minHeight, b = t[u * 3 + 1] >= s.minHeight, l = t[o * 3 + 1] >= s.minHeight;
      v && b && l && (i.push(h), i.push(u), i.push(o)), t[f * 3 + 1] >= s.minHeight && v && l && (i.push(f), i.push(h), i.push(o));
    }
  F.ComputeNormals(t, i, e);
  const m = new F();
  return m.indices = i, m.positions = t, m.normals = e, m.uvs = a, m;
}
function A(s, i = {}, t) {
  const e = new Z(s, t);
  return e._setReady(!1), e._subdivisionsX = i.subdivisionsX || i.subdivisions || 1, e._subdivisionsY = i.subdivisionsY || i.subdivisions || 1, e._width = i.width || 1, e._height = i.height || 1, e._maxX = e._width / 2, e._maxZ = e._height / 2, e._minX = -e._maxX, e._minZ = -e._maxZ, D(i).applyToMesh(e, i.updatable), e._setReady(!0), e;
}
function B(s, i, t = null) {
  const e = new z(s, t);
  return p(i).applyToMesh(e, i.updatable), e;
}
function I(s, i, t = {}, e = null) {
  const a = t.width || 10, n = t.height || 10, r = t.subdivisions || 1, c = t.minHeight || 0, g = t.maxHeight || 1, d = t.colorFilter || new Q(0.3, 0.59, 0.11), m = t.alphaFilter || 0, h = t.updatable, u = t.onReady;
  e = e || W.LastCreatedScene;
  const o = new Z(s, e);
  o._subdivisionsX = r, o._subdivisionsY = r, o._width = a, o._height = n, o._maxX = o._width / 2, o._maxZ = o._height / 2, o._minX = -o._maxX, o._minZ = -o._maxZ, o._setReady(!1);
  let f;
  t.passHeightBufferInCallback && (f = new Float32Array((r + 1) * (r + 1)));
  const v = (b, l, _) => {
    M({
      width: a,
      height: n,
      subdivisions: r,
      minHeight: c,
      maxHeight: g,
      colorFilter: d,
      buffer: b,
      bufferWidth: l,
      bufferHeight: _,
      alphaFilter: m,
      heightBuffer: f
    }).applyToMesh(o, h), u && u(o, f), o._setReady(!0);
  };
  if (typeof i == "string") {
    const b = (l) => {
      const _ = l.width, y = l.height;
      if (e.isDisposed)
        return;
      const X = e?.getEngine().resizeImageBitmap(l, _, y);
      v(X, _, y);
    };
    L.LoadImage(i, b, t.onError ? t.onError : () => {
    }, e.offlineProvider);
  } else
    v(i.data, i.width, i.height);
  return o;
}
const K = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateGround: A,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateGroundFromHeightMap: I,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateTiledGround: B
};
F.CreateGround = D;
F.CreateTiledGround = p;
F.CreateGroundFromHeightMap = M;
z.CreateGround = (s, i, t, e, a, n) => A(s, {
  width: i,
  height: t,
  subdivisions: e,
  updatable: n
}, a);
z.CreateTiledGround = (s, i, t, e, a, n, r, c, g) => B(s, {
  xmin: i,
  zmin: t,
  xmax: e,
  zmax: a,
  subdivisions: n,
  precision: r,
  updatable: g
}, c);
z.CreateGroundFromHeightMap = (s, i, t, e, a, n, r, c, g, d, m) => I(s, i, {
  width: t,
  height: e,
  subdivisions: a,
  minHeight: n,
  maxHeight: r,
  updatable: g,
  onReady: d,
  alphaFilter: m
}, c);
export {
  D as C,
  K as G,
  I as a,
  B as b,
  A as c,
  M as d,
  p as e,
  Z as f
};
//# sourceMappingURL=groundBuilder-BrBTF9BC.js.map
