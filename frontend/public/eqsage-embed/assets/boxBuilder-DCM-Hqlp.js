import { y as v, v as X, C as z, z as M, M as c } from "./embed-entry-BgvWRWVI.js";
import { M as V } from "./mesh-DLjlGcQU.js";
import { C as T } from "./groundBuilder-BrBTF9BC.js";
function P(e) {
  let s = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23];
  const o = [
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0,
    0,
    -1,
    0
  ], i = [];
  let u = [];
  const g = e.width || e.size || 1, h = e.height || e.size || 1, l = e.depth || e.size || 1, a = e.wrap || !1;
  let w = e.topBaseAt === void 0 ? 1 : e.topBaseAt, p = e.bottomBaseAt === void 0 ? 0 : e.bottomBaseAt;
  w = (w + 4) % 4, p = (p + 4) % 4;
  const B = [2, 0, 3, 1], y = [2, 0, 1, 3];
  let O = B[w], R = y[p], C = [
    1,
    -1,
    1,
    -1,
    -1,
    1,
    -1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    -1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    1,
    -1,
    -1,
    1,
    1,
    -1,
    1,
    -1,
    -1,
    1,
    -1,
    1,
    1,
    1,
    1,
    -1,
    1,
    1,
    -1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    1,
    -1,
    -1,
    1,
    1,
    -1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    1,
    1,
    1,
    -1,
    1,
    1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    1
  ];
  if (a) {
    s = [2, 3, 0, 2, 0, 1, 4, 5, 6, 4, 6, 7, 9, 10, 11, 9, 11, 8, 12, 14, 15, 12, 13, 14], C = [
      -1,
      1,
      1,
      1,
      1,
      1,
      1,
      -1,
      1,
      -1,
      -1,
      1,
      1,
      1,
      -1,
      -1,
      1,
      -1,
      -1,
      -1,
      -1,
      1,
      -1,
      -1,
      1,
      1,
      1,
      1,
      1,
      -1,
      1,
      -1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      -1,
      1,
      1,
      -1,
      -1,
      1,
      -1,
      -1,
      -1
    ];
    let t = [
      [1, 1, 1],
      [-1, 1, 1],
      [-1, 1, -1],
      [1, 1, -1]
    ], d = [
      [-1, -1, 1],
      [1, -1, 1],
      [1, -1, -1],
      [-1, -1, -1]
    ];
    const f = [17, 18, 19, 16], b = [22, 23, 20, 21];
    for (; O > 0; )
      t.unshift(t.pop()), f.unshift(f.pop()), O--;
    for (; R > 0; )
      d.unshift(d.pop()), b.unshift(b.pop()), R--;
    t = t.flat(), d = d.flat(), C = C.concat(t).concat(d), s.push(f[0], f[2], f[3], f[0], f[1], f[2]), s.push(b[0], b[2], b[3], b[0], b[1], b[2]);
  }
  const F = [g / 2, h / 2, l / 2];
  u = C.reduce((t, d, f) => t.concat(d * F[f % 3]), []);
  const D = e.sideOrientation === 0 ? 0 : e.sideOrientation || v.DEFAULTSIDE, r = e.faceUV || new Array(6), m = e.faceColors, U = [];
  for (let t = 0; t < 6; t++)
    r[t] === void 0 && (r[t] = new X(0, 0, 1, 1)), m && m[t] === void 0 && (m[t] = new z(1, 1, 1, 1));
  for (let t = 0; t < 6; t++)
    if (i.push(r[t].z, M.UseOpenGLOrientationForUV ? 1 - r[t].w : r[t].w), i.push(r[t].x, M.UseOpenGLOrientationForUV ? 1 - r[t].w : r[t].w), i.push(r[t].x, M.UseOpenGLOrientationForUV ? 1 - r[t].y : r[t].y), i.push(r[t].z, M.UseOpenGLOrientationForUV ? 1 - r[t].y : r[t].y), m)
      for (let d = 0; d < 4; d++)
        U.push(m[t].r, m[t].g, m[t].b, m[t].a);
  v._ComputeSides(D, u, s, o, i, e.frontUVs, e.backUVs);
  const x = new v();
  if (x.indices = s, x.positions = u, x.normals = o, x.uvs = i, m) {
    const t = D === v.DOUBLESIDE ? U.concat(U) : U;
    x.colors = t;
  }
  return x;
}
function L(e) {
  const n = e.width || e.size || 1, s = e.height || e.size || 1, o = e.depth || e.size || 1, i = (e.widthSegments || e.segments || 1) | 0, u = (e.heightSegments || e.segments || 1) | 0, g = (e.depthSegments || e.segments || 1) | 0, h = new c(), l = new c(), a = new c(), w = T({ width: n, height: o, subdivisionsX: i, subdivisionsY: g });
  c.TranslationToRef(0, -s / 2, 0, l), c.RotationZToRef(Math.PI, h), h.multiplyToRef(l, a), w.transform(a);
  const p = T({ width: n, height: o, subdivisionsX: i, subdivisionsY: g });
  c.TranslationToRef(0, s / 2, 0, a), p.transform(a);
  const B = T({ width: s, height: o, subdivisionsX: u, subdivisionsY: g });
  c.TranslationToRef(-n / 2, 0, 0, l), c.RotationZToRef(Math.PI / 2, h), h.multiplyToRef(l, a), B.transform(a);
  const y = T({ width: s, height: o, subdivisionsX: u, subdivisionsY: g });
  c.TranslationToRef(n / 2, 0, 0, l), c.RotationZToRef(-Math.PI / 2, h), h.multiplyToRef(l, a), y.transform(a);
  const O = T({ width: n, height: s, subdivisionsX: i, subdivisionsY: u });
  c.TranslationToRef(0, 0, -o / 2, l), c.RotationXToRef(-Math.PI / 2, h), h.multiplyToRef(l, a), O.transform(a);
  const R = T({ width: n, height: s, subdivisionsX: i, subdivisionsY: u });
  return c.TranslationToRef(0, 0, o / 2, l), c.RotationXToRef(Math.PI / 2, h), h.multiplyToRef(l, a), R.transform(a), w.merge([p, y, B, O, R], !0), w;
}
function S(e, n = {}, s = null) {
  const o = new V(e, s);
  return n.sideOrientation = V._GetDefaultSideOrientation(n.sideOrientation), o._originalBuilderSideOrientation = n.sideOrientation, P(n).applyToMesh(o, n.updatable), o;
}
const Y = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateBox: S
};
v.CreateBox = P;
V.CreateBox = (e, n, s = null, o, i) => S(e, {
  size: n,
  sideOrientation: i,
  updatable: o
}, s);
export {
  Y as BoxBuilder,
  S as CreateBox,
  P as CreateBoxVertexData,
  L as CreateSegmentedBoxVertexData
};
//# sourceMappingURL=boxBuilder-DCM-Hqlp.js.map
