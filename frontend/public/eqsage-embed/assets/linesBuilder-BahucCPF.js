import { y as P, C as Se, v as ve, a as _, z as k, g as ee, L as Le, V as ne } from "./embed-entry-BgvWRWVI.js";
import { M as I, _ as _e } from "./mesh-DLjlGcQU.js";
import { a as De } from "./scene-BUYFxCaC.js";
import { A as Ve } from "./math.axis-Jb8Sl68r.js";
import { L as he } from "./linesMesh-BTT16qa-.js";
function fe(n) {
  const e = n.height || 2;
  let h = n.diameterTop === 0 ? 0 : n.diameterTop || n.diameter || 1, a = n.diameterBottom === 0 ? 0 : n.diameterBottom || n.diameter || 1;
  h = h || 1e-5, a = a || 1e-5;
  const t = (n.tessellation || 24) | 0, d = (n.subdivisions || 1) | 0, p = !!n.hasRings, c = !!n.enclose, x = n.cap === 0 ? 0 : n.cap || I.CAP_ALL, S = n.arc && (n.arc <= 0 || n.arc > 1) ? 1 : n.arc || 1, l = n.sideOrientation === 0 ? 0 : n.sideOrientation || P.DEFAULTSIDE, r = n.faceUV || new Array(3), i = n.faceColors, D = S !== 1 && c ? 2 : 0, y = p ? d : 1, v = 2 + (1 + D) * y;
  let f;
  for (f = 0; f < v; f++)
    i && i[f] === void 0 && (i[f] = new Se(1, 1, 1, 1));
  for (f = 0; f < v; f++)
    r && r[f] === void 0 && (r[f] = new ve(0, 0, 1, 1));
  const C = [], g = [], u = [], V = [], A = [], X = Math.PI * 2 * S / t;
  let W, E, U;
  const Y = (a - h) / 2 / e, z = _.Zero(), L = _.Zero(), R = _.Zero(), q = _.Zero(), o = _.Zero(), m = Ve.Y;
  let w, O, H, te = 1, s = 1, F = 0, b = 0;
  for (w = 0; w <= d; w++)
    for (E = w / d, U = (E * (h - a) + a) / 2, te = p && w !== 0 && w !== d ? 2 : 1, H = 0; H < te; H++) {
      for (p && (s += H), c && (s += 2 * H), O = 0; O <= t; O++)
        W = O * X, z.x = Math.cos(-W) * U, z.y = -e / 2 + E * e, z.z = Math.sin(-W) * U, h === 0 && w === d ? (L.x = u[u.length - (t + 1) * 3], L.y = u[u.length - (t + 1) * 3 + 1], L.z = u[u.length - (t + 1) * 3 + 2]) : (L.x = z.x, L.z = z.z, L.y = Math.sqrt(L.x * L.x + L.z * L.z) * Y, L.normalize()), O === 0 && (R.copyFrom(z), q.copyFrom(L)), g.push(z.x, z.y, z.z), u.push(L.x, L.y, L.z), p ? b = F !== s ? r[s].y : r[s].w : b = r[s].y + (r[s].w - r[s].y) * E, V.push(r[s].x + (r[s].z - r[s].x) * O / t, k.UseOpenGLOrientationForUV ? 1 - b : b), i && A.push(i[s].r, i[s].g, i[s].b, i[s].a);
      S !== 1 && c && (g.push(z.x, z.y, z.z), g.push(0, z.y, 0), g.push(0, z.y, 0), g.push(R.x, R.y, R.z), _.CrossToRef(m, L, o), o.normalize(), u.push(o.x, o.y, o.z, o.x, o.y, o.z), _.CrossToRef(q, m, o), o.normalize(), u.push(o.x, o.y, o.z, o.x, o.y, o.z), p ? b = F !== s ? r[s + 1].y : r[s + 1].w : b = r[s + 1].y + (r[s + 1].w - r[s + 1].y) * E, V.push(r[s + 1].x, k.UseOpenGLOrientationForUV ? 1 - b : b), V.push(r[s + 1].z, k.UseOpenGLOrientationForUV ? 1 - b : b), p ? b = F !== s ? r[s + 2].y : r[s + 2].w : b = r[s + 2].y + (r[s + 2].w - r[s + 2].y) * E, V.push(r[s + 2].x, k.UseOpenGLOrientationForUV ? 1 - b : b), V.push(r[s + 2].z, k.UseOpenGLOrientationForUV ? 1 - b : b), i && (A.push(i[s + 1].r, i[s + 1].g, i[s + 1].b, i[s + 1].a), A.push(i[s + 1].r, i[s + 1].g, i[s + 1].b, i[s + 1].a), A.push(i[s + 2].r, i[s + 2].g, i[s + 2].b, i[s + 2].a), A.push(i[s + 2].r, i[s + 2].g, i[s + 2].b, i[s + 2].a))), F !== s && (F = s);
    }
  const J = S !== 1 && c ? t + 4 : t;
  for (w = 0, s = 0; s < d; s++) {
    let M = 0, Z = 0, G = 0, K = 0;
    for (O = 0; O < t; O++)
      M = w * (J + 1) + O, Z = (w + 1) * (J + 1) + O, G = w * (J + 1) + (O + 1), K = (w + 1) * (J + 1) + (O + 1), C.push(M, Z, G), C.push(K, G, Z);
    S !== 1 && c && (C.push(M + 2, Z + 2, G + 2), C.push(K + 2, G + 2, Z + 2), C.push(M + 4, Z + 4, G + 4), C.push(K + 4, G + 4, Z + 4)), w = p ? w + 2 : w + 1;
  }
  const Q = (M) => {
    const Z = M ? h / 2 : a / 2;
    if (Z === 0)
      return;
    let G, K, N;
    const T = M ? r[v - 1] : r[0];
    let B = null;
    i && (B = M ? i[v - 1] : i[0]);
    const $ = g.length / 3, re = M ? e / 2 : -e / 2, se = new _(0, re, 0);
    g.push(se.x, se.y, se.z), u.push(0, M ? 1 : -1, 0);
    const ae = T.y + (T.w - T.y) * 0.5;
    V.push(T.x + (T.z - T.x) * 0.5, k.UseOpenGLOrientationForUV ? 1 - ae : ae), B && A.push(B.r, B.g, B.b, B.a);
    const ie = new ee(0.5, 0.5);
    for (N = 0; N <= t; N++) {
      G = Math.PI * 2 * N * S / t;
      const oe = Math.cos(-G), ce = Math.sin(-G);
      K = new _(oe * Z, re, ce * Z);
      const le = new ee(oe * ie.x + 0.5, ce * ie.y + 0.5);
      g.push(K.x, K.y, K.z), u.push(0, M ? 1 : -1, 0);
      const ue = T.y + (T.w - T.y) * le.y;
      V.push(T.x + (T.z - T.x) * le.x, k.UseOpenGLOrientationForUV ? 1 - ue : ue), B && A.push(B.r, B.g, B.b, B.a);
    }
    for (N = 0; N < t; N++)
      M ? (C.push($), C.push($ + (N + 2)), C.push($ + (N + 1))) : (C.push($), C.push($ + (N + 1)), C.push($ + (N + 2)));
  };
  (x === I.CAP_START || x === I.CAP_ALL) && Q(!1), (x === I.CAP_END || x === I.CAP_ALL) && Q(!0), P._ComputeSides(l, g, C, u, V, n.frontUVs, n.backUVs);
  const j = new P();
  return j.indices = C, j.positions = g, j.normals = u, j.uvs = V, i && (j.colors = A), j;
}
function de(n, e = {}, h) {
  const a = new I(n, h);
  return e.sideOrientation = I._GetDefaultSideOrientation(e.sideOrientation), a._originalBuilderSideOrientation = e.sideOrientation, fe(e).applyToMesh(a, e.updatable), a;
}
const Fe = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateCylinder: de
};
P.CreateCylinder = fe;
I.CreateCylinder = (n, e, h, a, t, d, p, c, x) => ((p === void 0 || !(p instanceof De)) && (p !== void 0 && (x = c || I.DEFAULTSIDE, c = p), p = d, d = 1), de(n, {
  height: e,
  diameterTop: h,
  diameterBottom: a,
  tessellation: t,
  subdivisions: d,
  sideOrientation: x,
  updatable: c
}, p));
function xe(n) {
  const e = n.sideOrientation || P.DEFAULTSIDE, h = n.radius || 1, a = n.flat === void 0 ? !0 : n.flat, t = (n.subdivisions || 4) | 0, d = n.radiusX || h, p = n.radiusY || h, c = n.radiusZ || h, x = (1 + Math.sqrt(5)) / 2, S = [
    -1,
    x,
    -0,
    1,
    x,
    0,
    -1,
    -x,
    0,
    1,
    -x,
    0,
    0,
    -1,
    -x,
    0,
    1,
    -x,
    0,
    -1,
    x,
    0,
    1,
    x,
    x,
    0,
    1,
    x,
    0,
    -1,
    -x,
    0,
    1,
    -x,
    0,
    -1
    // v8-11
  ], l = [
    0,
    11,
    5,
    0,
    5,
    1,
    0,
    1,
    7,
    0,
    7,
    10,
    12,
    22,
    23,
    1,
    5,
    20,
    5,
    11,
    4,
    23,
    22,
    13,
    22,
    18,
    6,
    7,
    1,
    8,
    14,
    21,
    4,
    14,
    4,
    2,
    16,
    13,
    6,
    15,
    6,
    19,
    3,
    8,
    9,
    4,
    21,
    5,
    13,
    17,
    23,
    6,
    13,
    22,
    19,
    6,
    18,
    9,
    8,
    1
  ], r = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    // vertex alias
    0,
    2,
    3,
    3,
    3,
    4,
    7,
    8,
    9,
    9,
    10,
    11
    // 23: B + 12
  ], i = [
    5,
    1,
    3,
    1,
    6,
    4,
    0,
    0,
    5,
    3,
    4,
    2,
    2,
    2,
    4,
    0,
    2,
    0,
    1,
    1,
    6,
    0,
    6,
    2,
    // vertex alias (for same vertex on different faces)
    0,
    4,
    3,
    3,
    4,
    4,
    3,
    1,
    4,
    2,
    4,
    4,
    0,
    2,
    1,
    1,
    2,
    2,
    3,
    3,
    1,
    3,
    2,
    4
    // 23: B + 12
  ], D = 138 / 1024, y = 239 / 1024, v = 60 / 1024, f = 26 / 1024, C = -40 / 1024, g = 20 / 1024, u = [
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    1,
    0
    //  15 - 19
  ], V = [], A = [], X = [], W = [];
  let E = 0;
  const U = new Array(3), Y = new Array(3);
  let z;
  for (z = 0; z < 3; z++)
    U[z] = _.Zero(), Y[z] = ee.Zero();
  for (let R = 0; R < 20; R++) {
    for (z = 0; z < 3; z++) {
      const o = l[3 * R + z];
      U[z].copyFromFloats(S[3 * r[o]], S[3 * r[o] + 1], S[3 * r[o] + 2]), U[z].normalize(), Y[z].copyFromFloats(i[2 * o] * D + v + u[R] * C, i[2 * o + 1] * y + f + u[R] * g);
    }
    const q = (o, m, w, O) => {
      const H = _.Lerp(U[0], U[2], m / t), te = _.Lerp(U[1], U[2], m / t), s = t === m ? U[2] : _.Lerp(H, te, o / (t - m));
      s.normalize();
      let F;
      if (a) {
        const j = _.Lerp(U[0], U[2], O / t), M = _.Lerp(U[1], U[2], O / t);
        F = _.Lerp(j, M, w / (t - O));
      } else
        F = new _(s.x, s.y, s.z);
      F.x /= d, F.y /= p, F.z /= c, F.normalize();
      const b = ee.Lerp(Y[0], Y[2], m / t), J = ee.Lerp(Y[1], Y[2], m / t), Q = t === m ? Y[2] : ee.Lerp(b, J, o / (t - m));
      A.push(s.x * d, s.y * p, s.z * c), X.push(F.x, F.y, F.z), W.push(Q.x, k.UseOpenGLOrientationForUV ? 1 - Q.y : Q.y), V.push(E), E++;
    };
    for (let o = 0; o < t; o++)
      for (let m = 0; m + o < t; m++)
        q(m, o, m + 1 / 3, o + 1 / 3), q(m + 1, o, m + 1 / 3, o + 1 / 3), q(m, o + 1, m + 1 / 3, o + 1 / 3), m + o + 1 < t && (q(m + 1, o, m + 2 / 3, o + 2 / 3), q(m + 1, o + 1, m + 2 / 3, o + 2 / 3), q(m, o + 1, m + 2 / 3, o + 2 / 3));
  }
  P._ComputeSides(e, A, V, X, W, n.frontUVs, n.backUVs);
  const L = new P();
  return L.indices = V, L.positions = A, L.normals = X, L.uvs = W, L;
}
function pe(n, e = {}, h = null) {
  const a = new I(n, h);
  return e.sideOrientation = I._GetDefaultSideOrientation(e.sideOrientation), a._originalBuilderSideOrientation = e.sideOrientation, xe(e).applyToMesh(a, e.updatable), a;
}
const Me = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateIcoSphere: pe
};
P.CreateIcoSphere = xe;
I.CreateIcoSphere = (n, e, h) => pe(n, e, h);
function ye(n) {
  const e = [], h = [], a = n.lines, t = n.colors, d = [];
  let p = 0;
  for (let x = 0; x < a.length; x++) {
    const S = a[x];
    for (let l = 0; l < S.length; l++) {
      const { x: r, y: i, z: D } = S[l];
      if (h.push(r, i, D), t) {
        const y = t[x], { r: v, g: f, b: C, a: g } = y[l];
        d.push(v, f, C, g);
      }
      l > 0 && (e.push(p - 1), e.push(p)), p++;
    }
  }
  const c = new P();
  return c.indices = e, c.positions = h, t && (c.colors = d), c;
}
function ge(n) {
  const e = n.dashSize || 3, h = n.gapSize || 1, a = n.dashNb || 200, t = n.points, d = [], p = [], c = _.Zero();
  let x = 0, S = 0, l = 0, r = 0, i = 0, D = 0, y = 0;
  for (y = 0; y < t.length - 1; y++)
    t[y + 1].subtractToRef(t[y], c), x += c.length();
  for (l = x / a, r = e * l / (e + h), y = 0; y < t.length - 1; y++) {
    t[y + 1].subtractToRef(t[y], c), S = Math.floor(c.length() / l), c.normalize();
    for (let f = 0; f < S; f++)
      i = l * f, d.push(t[y].x + i * c.x, t[y].y + i * c.y, t[y].z + i * c.z), d.push(t[y].x + (i + r) * c.x, t[y].y + (i + r) * c.y, t[y].z + (i + r) * c.z), p.push(D, D + 1), D += 2;
  }
  const v = new P();
  return v.positions = d, v.indices = p, v;
}
function ze(n, e, h = null) {
  const a = e.instance, t = e.lines, d = e.colors;
  if (a) {
    const S = a.getVerticesData(ne.PositionKind);
    let l, r;
    d && (l = a.getVerticesData(ne.ColorKind));
    let i = 0, D = 0;
    for (let y = 0; y < t.length; y++) {
      const v = t[y];
      for (let f = 0; f < v.length; f++)
        S[i] = v[f].x, S[i + 1] = v[f].y, S[i + 2] = v[f].z, d && l && (r = d[y], l[D] = r[f].r, l[D + 1] = r[f].g, l[D + 2] = r[f].b, l[D + 3] = r[f].a, D += 4), i += 3;
    }
    return a.updateVerticesData(ne.PositionKind, S, !1, !1), d && l && a.updateVerticesData(ne.ColorKind, l, !1, !1), a;
  }
  const p = !!d, c = new he(n, h, null, void 0, void 0, p, e.useVertexAlpha, e.material);
  return ye(e).applyToMesh(c, e.updatable), c;
}
function me(n, e, h = null) {
  const a = e.colors ? [e.colors] : null;
  return ze(n, { lines: [e.points], updatable: e.updatable, instance: e.instance, colors: a, useVertexAlpha: e.useVertexAlpha, material: e.material }, h);
}
function Ce(n, e, h = null) {
  const a = e.points, t = e.instance, d = e.gapSize || 1, p = e.dashSize || 3;
  if (t) {
    const S = (l) => {
      const r = _.Zero(), i = l.length / 6;
      let D = 0, y = 0, v = 0, f = 0, C = 0, g = 0, u = 0, V = 0;
      for (u = 0; u < a.length - 1; u++)
        a[u + 1].subtractToRef(a[u], r), D += r.length();
      v = D / i;
      const A = t._creationDataStorage.dashSize, X = t._creationDataStorage.gapSize;
      for (f = A * v / (A + X), u = 0; u < a.length - 1; u++)
        for (a[u + 1].subtractToRef(a[u], r), y = Math.floor(r.length() / v), r.normalize(), V = 0; V < y && g < l.length; )
          C = v * V, l[g] = a[u].x + C * r.x, l[g + 1] = a[u].y + C * r.y, l[g + 2] = a[u].z + C * r.z, l[g + 3] = a[u].x + (C + f) * r.x, l[g + 4] = a[u].y + (C + f) * r.y, l[g + 5] = a[u].z + (C + f) * r.z, g += 6, V++;
      for (; g < l.length; )
        l[g] = a[u].x, l[g + 1] = a[u].y, l[g + 2] = a[u].z, g += 3;
    };
    return (e.dashNb || e.dashSize || e.gapSize || e.useVertexAlpha || e.material) && Le.Warn("You have used an option other than points with the instance option. Please be aware that these other options will be ignored."), t.updateMeshPositions(S, !1), t;
  }
  const c = new he(n, h, null, void 0, void 0, void 0, e.useVertexAlpha, e.material);
  return ge(e).applyToMesh(c, e.updatable), c._creationDataStorage = new _e(), c._creationDataStorage.dashSize = p, c._creationDataStorage.gapSize = d, c;
}
const Ie = {
  CreateDashedLines: Ce,
  CreateLineSystem: ze,
  CreateLines: me
};
P.CreateLineSystem = ye;
P.CreateDashedLines = ge;
I.CreateLines = (n, e, h = null, a = !1, t = null) => me(n, {
  points: e,
  updatable: a,
  instance: t
}, h);
I.CreateDashedLines = (n, e, h, a, t, d = null, p, c) => Ce(n, {
  points: e,
  dashSize: h,
  gapSize: a,
  dashNb: t,
  updatable: p,
  instance: c
}, d);
export {
  Ce as C,
  Me as I,
  Ie as L,
  me as a,
  ze as b,
  de as c,
  pe as d,
  xe as e,
  fe as f,
  ge as g,
  ye as h,
  Fe as i
};
//# sourceMappingURL=linesBuilder-BahucCPF.js.map
