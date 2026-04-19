import { P as S } from "./math.path-2Lw1sJUP.js";
import { d as N, L as W, V as E, y as M, a as z, E as L, g as I, v as A, C as F, z as O } from "./embed-entry-Bb6cfUYP.js";
import { M as v } from "./mesh-BIoKPPmW.js";
import { TransformNode as K } from "./transformNode-ChKEoFVr.js";
class q extends I {
  constructor(t, e) {
    super(t.x, t.y), this.index = e;
  }
}
class D {
  constructor() {
    this.elements = [];
  }
  add(t) {
    const e = [];
    return t.forEach((s) => {
      const n = new q(s, this.elements.length);
      e.push(n), this.elements.push(n);
    }), e;
  }
  computeBounds() {
    const t = new I(this.elements[0].x, this.elements[0].y), e = new I(this.elements[0].x, this.elements[0].y);
    return this.elements.forEach((s) => {
      s.x < t.x ? t.x = s.x : s.x > e.x && (e.x = s.x), s.y < t.y ? t.y = s.y : s.y > e.y && (e.y = s.y);
    }), {
      min: t,
      max: e,
      width: e.x - t.x,
      height: e.y - t.y
    };
  }
}
class X {
  /**
   * Creates a rectangle
   * @param xmin bottom X coord
   * @param ymin bottom Y coord
   * @param xmax top X coord
   * @param ymax top Y coord
   * @returns points that make the resulting rectangle
   */
  static Rectangle(t, e, s, n) {
    return [new I(t, e), new I(s, e), new I(s, n), new I(t, n)];
  }
  /**
   * Creates a circle
   * @param radius radius of circle
   * @param cx scale in x
   * @param cy scale in y
   * @param numberOfSides number of sides that make up the circle
   * @returns points that make the resulting circle
   */
  static Circle(t, e = 0, s = 0, n = 32) {
    const a = [];
    let u = 0;
    const i = Math.PI * 2 / n;
    for (let o = 0; o < n; o++)
      a.push(new I(e + Math.cos(u) * t, s + Math.sin(u) * t)), u -= i;
    return a;
  }
  /**
   * Creates a polygon from input string
   * @param input Input polygon data
   * @returns the parsed points
   */
  static Parse(t) {
    const e = t.split(/[^-+eE.\d]+/).map(parseFloat).filter((a) => !isNaN(a));
    let s;
    const n = [];
    for (s = 0; s < (e.length & 2147483646); s += 2)
      n.push(new I(e[s], e[s + 1]));
    return n;
  }
  /**
   * Starts building a polygon from x and y coordinates
   * @param x x coordinate
   * @param y y coordinate
   * @returns the started path2
   */
  static StartingAt(t, e) {
    return S.StartingAt(t, e);
  }
}
class G {
  _addToepoint(t) {
    for (const e of t)
      this._epoints.push(e.x, e.y);
  }
  /**
   * Creates a PolygonMeshBuilder
   * @param name name of the builder
   * @param contours Path of the polygon
   * @param scene scene to add to when creating the mesh
   * @param earcutInjection can be used to inject your own earcut reference
   */
  constructor(t, e, s, n = earcut) {
    this._points = new D(), this._outlinepoints = new D(), this._holes = new Array(), this._epoints = new Array(), this._eholes = new Array(), this.bjsEarcut = n, this._name = t, this._scene = s || N.LastCreatedScene;
    let a;
    e instanceof S ? a = e.getPoints() : a = e, this._addToepoint(a), this._points.add(a), this._outlinepoints.add(a), typeof this.bjsEarcut > "u" && W.Warn("Earcut was not found, the polygon will not be built.");
  }
  /**
   * Adds a hole within the polygon
   * @param hole Array of points defining the hole
   * @returns this
   */
  addHole(t) {
    this._points.add(t);
    const e = new D();
    return e.add(t), this._holes.push(e), this._eholes.push(this._epoints.length / 2), this._addToepoint(t), this;
  }
  /**
   * Creates the polygon
   * @param updatable If the mesh should be updatable
   * @param depth The depth of the mesh created
   * @param smoothingThreshold Dot product threshold for smoothed normals
   * @returns the created mesh
   */
  build(t = !1, e = 0, s = 2) {
    const n = new v(this._name, this._scene), a = this.buildVertexData(e, s);
    return n.setVerticesData(E.PositionKind, a.positions, t), n.setVerticesData(E.NormalKind, a.normals, t), n.setVerticesData(E.UVKind, a.uvs, t), n.setIndices(a.indices), n;
  }
  /**
   * Creates the polygon
   * @param depth The depth of the mesh created
   * @param smoothingThreshold Dot product threshold for smoothed normals
   * @returns the created VertexData
   */
  buildVertexData(t = 0, e = 2) {
    const s = new M(), n = [], a = [], u = [], i = this._points.computeBounds();
    this._points.elements.forEach((r) => {
      n.push(0, 1, 0), a.push(r.x, 0, r.y), u.push((r.x - i.min.x) / i.width, (r.y - i.min.y) / i.height);
    });
    const o = [], c = this.bjsEarcut(this._epoints, this._eholes, 2);
    for (let r = 0; r < c.length; r++)
      o.push(c[r]);
    if (t > 0) {
      const r = a.length / 3;
      this._points.elements.forEach((h) => {
        n.push(0, -1, 0), a.push(h.x, -t, h.y), u.push(1 - (h.x - i.min.x) / i.width, 1 - (h.y - i.min.y) / i.height);
      });
      const d = o.length;
      for (let h = 0; h < d; h += 3) {
        const l = o[h + 0], p = o[h + 1], _ = o[h + 2];
        o.push(_ + r), o.push(p + r), o.push(l + r);
      }
      this._addSide(a, n, u, o, i, this._outlinepoints, t, !1, e), this._holes.forEach((h) => {
        this._addSide(a, n, u, o, i, h, t, !0, e);
      });
    }
    return s.indices = o, s.positions = a, s.normals = n, s.uvs = u, s;
  }
  /**
   * Adds a side to the polygon
   * @param positions points that make the polygon
   * @param normals normals of the polygon
   * @param uvs uvs of the polygon
   * @param indices indices of the polygon
   * @param bounds bounds of the polygon
   * @param points points of the polygon
   * @param depth depth of the polygon
   * @param flip flip of the polygon
   * @param smoothingThreshold
   */
  _addSide(t, e, s, n, a, u, i, o, c) {
    let r = t.length / 3, d = 0;
    for (let h = 0; h < u.elements.length; h++) {
      const l = u.elements[h], p = u.elements[(h + 1) % u.elements.length];
      t.push(l.x, 0, l.y), t.push(l.x, -i, l.y), t.push(p.x, 0, p.y), t.push(p.x, -i, p.y);
      const _ = u.elements[(h + u.elements.length - 1) % u.elements.length], C = u.elements[(h + 2) % u.elements.length];
      let P = new z(-(p.y - l.y), 0, p.x - l.x), w = new z(-(l.y - _.y), 0, l.x - _.x), V = new z(-(C.y - p.y), 0, C.x - p.x);
      o || (P = P.scale(-1), w = w.scale(-1), V = V.scale(-1));
      const b = P.normalizeToNew();
      let g = w.normalizeToNew(), f = V.normalizeToNew();
      const x = z.Dot(g, b);
      x > c ? x < L - 1 ? g = new z(l.x, 0, l.y).subtract(new z(p.x, 0, p.y)).normalize() : g = w.add(P).normalize() : g = b;
      const T = z.Dot(V, P);
      T > c ? T < L - 1 ? f = new z(p.x, 0, p.y).subtract(new z(l.x, 0, l.y)).normalize() : f = V.add(P).normalize() : f = b, s.push(d / a.width, 0), s.push(d / a.width, 1), d += P.length(), s.push(d / a.width, 0), s.push(d / a.width, 1), e.push(g.x, g.y, g.z), e.push(g.x, g.y, g.z), e.push(f.x, f.y, f.z), e.push(f.x, f.y, f.z), o ? (n.push(r), n.push(r + 2), n.push(r + 1), n.push(r + 1), n.push(r + 2), n.push(r + 3)) : (n.push(r), n.push(r + 1), n.push(r + 2), n.push(r + 1), n.push(r + 3), n.push(r + 2)), r += 4;
    }
  }
}
function k(m, t, e, s, n, a, u) {
  const i = e || new Array(3), o = s, c = [], r = u || !1;
  for (let y = 0; y < 3; y++)
    i[y] === void 0 && (i[y] = new A(0, 0, 1, 1)), o && o[y] === void 0 && (o[y] = new F(1, 1, 1, 1));
  const d = m.getVerticesData(E.PositionKind), h = m.getVerticesData(E.NormalKind), l = m.getVerticesData(E.UVKind), p = m.getIndices(), _ = d.length / 9;
  let C = 0, P = 0, w = 0, V = 0, b = 0;
  const g = [0];
  if (r)
    for (let y = _; y < d.length / 3; y += 4)
      P = d[3 * (y + 2)] - d[3 * y], w = d[3 * (y + 2) + 2] - d[3 * y + 2], V = Math.sqrt(P * P + w * w), b += V, g.push(b);
  let f = 0, x = 0;
  for (let y = 0; y < h.length; y += 3)
    Math.abs(h[y + 1]) < 1e-3 && (x = 1), Math.abs(h[y + 1] - 1) < 1e-3 && (x = 0), Math.abs(h[y + 1] + 1) < 1e-3 && (x = 2), f = y / 3, x === 1 ? (C = f - _, C % 4 < 1.5 ? r ? l[2 * f] = i[x].x + (i[x].z - i[x].x) * g[Math.floor(C / 4)] / b : l[2 * f] = i[x].x : r ? l[2 * f] = i[x].x + (i[x].z - i[x].x) * g[Math.floor(C / 4) + 1] / b : l[2 * f] = i[x].z, C % 2 === 0 ? l[2 * f + 1] = O.UseOpenGLOrientationForUV ? 1 - i[x].w : i[x].w : l[2 * f + 1] = O.UseOpenGLOrientationForUV ? 1 - i[x].y : i[x].y) : (l[2 * f] = (1 - l[2 * f]) * i[x].x + l[2 * f] * i[x].z, l[2 * f + 1] = (1 - l[2 * f + 1]) * i[x].y + l[2 * f + 1] * i[x].w, O.UseOpenGLOrientationForUV && (l[2 * f + 1] = 1 - l[2 * f + 1])), o && c.push(o[x].r, o[x].g, o[x].b, o[x].a);
  M._ComputeSides(t, d, p, h, l, n, a);
  const T = new M();
  if (T.indices = p, T.positions = d, T.normals = h, T.uvs = l, o) {
    const y = t === M.DOUBLESIDE ? c.concat(c) : c;
    T.colors = y;
  }
  return T;
}
function U(m, t, e = null, s = earcut) {
  t.sideOrientation = v._GetDefaultSideOrientation(t.sideOrientation);
  const n = t.shape, a = t.holes || [], u = t.depth || 0, i = t.smoothingThreshold || 2, o = [];
  let c = [];
  for (let p = 0; p < n.length; p++)
    o[p] = new I(n[p].x, n[p].z);
  o[0].equalsWithEpsilon(o[o.length - 1], 1e-8) && o.pop();
  const d = new G(m, o, e || N.LastCreatedScene, s);
  for (let p = 0; p < a.length; p++) {
    c = [];
    for (let _ = 0; _ < a[p].length; _++)
      c.push(new I(a[p][_].x, a[p][_].z));
    d.addHole(c);
  }
  const h = d.build(!1, u, i);
  return h._originalBuilderSideOrientation = t.sideOrientation, k(h, t.sideOrientation, t.faceUV, t.faceColors, t.frontUVs, t.backUVs, t.wrap).applyToMesh(h, t.updatable), h;
}
function B(m, t, e = null, s = earcut) {
  return U(m, t, e, s);
}
const Y = {
  ExtrudePolygon: B,
  CreatePolygon: U
};
M.CreatePolygon = k;
v.CreatePolygon = (m, t, e, s, n, a, u = earcut) => U(m, {
  shape: t,
  holes: s,
  updatable: n,
  sideOrientation: a
}, e, u);
v.ExtrudePolygon = (m, t, e, s, n, a, u, i = earcut) => B(m, {
  shape: t,
  holes: n,
  depth: e,
  updatable: a,
  sideOrientation: u
}, s, i);
class H {
  /** Create the ShapePath used to support glyphs
   * @param resolution defines the resolution used to determine the number of points per curve (default is 4)
   */
  constructor(t) {
    this._paths = [], this._tempPaths = [], this._holes = [], this._resolution = t;
  }
  /** Move the virtual cursor to a coordinate
   * @param x defines the x coordinate
   * @param y defines the y coordinate
   */
  moveTo(t, e) {
    this._currentPath = new S(t, e), this._tempPaths.push(this._currentPath);
  }
  /** Draw a line from the virtual cursor to a given coordinate
   * @param x defines the x coordinate
   * @param y defines the y coordinate
   */
  lineTo(t, e) {
    this._currentPath.addLineTo(t, e);
  }
  /** Create a quadratic curve from the virtual cursor to a given coordinate
   * @param cpx defines the x coordinate of the control point
   * @param cpy defines the y coordinate of the control point
   * @param x defines the x coordinate of the end point
   * @param y defines the y coordinate of the end point
   */
  quadraticCurveTo(t, e, s, n) {
    this._currentPath.addQuadraticCurveTo(t, e, s, n, this._resolution);
  }
  /**
   * Create a bezier curve from the virtual cursor to a given coordinate
   * @param cpx1 defines the x coordinate of the first control point
   * @param cpy1 defines the y coordinate of the first control point
   * @param cpx2 defines the x coordinate of the second control point
   * @param cpy2 defines the y coordinate of the second control point
   * @param x defines the x coordinate of the end point
   * @param y defines the y coordinate of the end point
   */
  bezierCurveTo(t, e, s, n, a, u) {
    this._currentPath.addBezierCurveTo(t, e, s, n, a, u, this._resolution);
  }
  /** Extract holes based on CW / CCW */
  extractHoles() {
    for (const t of this._tempPaths)
      t.area() > 0 ? this._holes.push(t) : this._paths.push(t);
    if (!this._paths.length && this._holes.length) {
      const t = this._holes;
      this._holes = this._paths, this._paths = t;
    }
    this._tempPaths.length = 0;
  }
  /** Gets the list of paths */
  get paths() {
    return this._paths;
  }
  /** Gets the list of holes */
  get holes() {
    return this._holes;
  }
}
function j(m, t, e, s, n, a) {
  const u = a.glyphs[m] || a.glyphs["?"];
  if (!u)
    return null;
  const i = new H(n);
  if (u.o) {
    const o = u.o.split(" ");
    for (let c = 0, r = o.length; c < r; )
      switch (o[c++]) {
        case "m": {
          const h = parseInt(o[c++]) * t + e, l = parseInt(o[c++]) * t + s;
          i.moveTo(h, l);
          break;
        }
        case "l": {
          const h = parseInt(o[c++]) * t + e, l = parseInt(o[c++]) * t + s;
          i.lineTo(h, l);
          break;
        }
        case "q": {
          const h = parseInt(o[c++]) * t + e, l = parseInt(o[c++]) * t + s, p = parseInt(o[c++]) * t + e, _ = parseInt(o[c++]) * t + s;
          i.quadraticCurveTo(p, _, h, l);
          break;
        }
        case "b": {
          const h = parseInt(o[c++]) * t + e, l = parseInt(o[c++]) * t + s, p = parseInt(o[c++]) * t + e, _ = parseInt(o[c++]) * t + s, C = parseInt(o[c++]) * t + e, P = parseInt(o[c++]) * t + s;
          i.bezierCurveTo(p, _, C, P, h, l);
          break;
        }
      }
  }
  return i.extractHoles(), { offsetX: u.ha * t, shapePath: i };
}
function Q(m, t, e, s) {
  const n = Array.from(m), a = t / s.resolution, u = (s.boundingBox.yMax - s.boundingBox.yMin + s.underlineThickness) * a, i = [];
  let o = 0, c = 0;
  for (let r = 0; r < n.length; r++) {
    const d = n[r];
    if (d === `
`)
      o = 0, c -= u;
    else {
      const h = j(d, a, o, c, e, s);
      h && (o += h.offsetX, i.push(h.shapePath));
    }
  }
  return i;
}
function tt(m, t, e, s = {
  size: 50,
  resolution: 8,
  depth: 1
}, n = null, a = earcut) {
  const u = Q(t, s.size || 50, s.resolution || 8, e), i = [];
  let o = 0;
  for (const r of u) {
    if (!r.paths.length)
      continue;
    const d = r.holes.slice();
    for (const h of r.paths) {
      const l = [], p = [], _ = h.getPoints();
      for (const w of _)
        p.push(new z(w.x, 0, w.y));
      const C = d.slice();
      for (const w of C) {
        const V = w.getPoints();
        let b = !1;
        for (const f of V)
          if (h.isPointInside(f)) {
            b = !0;
            break;
          }
        if (!b)
          continue;
        const g = [];
        for (const f of V)
          g.push(new z(f.x, 0, f.y));
        l.push(g), d.splice(d.indexOf(w), 1);
      }
      if (!l.length && d.length)
        for (const w of d) {
          const V = w.getPoints(), b = [];
          for (const g of V)
            b.push(new z(g.x, 0, g.y));
          l.push(b);
        }
      const P = B(m, {
        shape: p,
        holes: l.length ? l : void 0,
        depth: s.depth || 1,
        faceUV: s.faceUV || s.perLetterFaceUV?.(o),
        faceColors: s.faceColors || s.perLetterFaceColors?.(o),
        sideOrientation: v._GetDefaultSideOrientation(s.sideOrientation || v.DOUBLESIDE)
      }, n, a);
      i.push(P), o++;
    }
  }
  const c = v.MergeMeshes(i, !0, !0);
  if (c) {
    const r = c.getBoundingInfo().boundingBox;
    c.position.x += -(r.minimumWorld.x + r.maximumWorld.x) / 2, c.position.y += -(r.minimumWorld.y + r.maximumWorld.y) / 2, c.position.z += -(r.minimumWorld.z + r.maximumWorld.z) / 2 + r.extendSize.z, c.name = m;
    const d = new K("pivot", n);
    d.rotation.x = -Math.PI / 2, c.parent = d, c.bakeCurrentTransformIntoVertices(), c.parent = null, d.dispose();
  }
  return c;
}
export {
  Q as C,
  B as E,
  X as P,
  tt as a,
  U as b,
  k as c,
  Y as d,
  G as e
};
//# sourceMappingURL=textBuilder-G-qzR3k7.js.map
