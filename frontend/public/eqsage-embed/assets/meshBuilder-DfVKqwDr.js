import { i as de, V as Q, z as se, y as j, v as ke, C as be, a as M, M as ne, g as me, w as pe, L as te, aq as J } from "./embed-entry-Dediijbe.js";
import { M as O, _ as st } from "./mesh-BuRJrOj4.js";
import { CreateBox as at } from "./boxBuilder-CuQlGj_I.js";
import { C as nt } from "./sphereBuilder-DYMTtv3A.js";
import { C as ot, a as rt, b as it, c as ct, d as lt } from "./linesBuilder-Ccln4QSY.js";
import { C as ht } from "./torusBuilder-_45OjALw.js";
import { a as dt, E as ut, b as ft } from "./textBuilder-DSZlaL4_.js";
import { a as Be } from "./math.path-5jYBkhtJ.js";
import { C as xt } from "./planeBuilder-Bdio64Oc.js";
import { a as gt, b as mt, c as Ot } from "./groundBuilder-NPyXa4AQ.js";
function Xe(u) {
  let e = u.pathArray;
  const t = u.closeArray || !1, a = u.closePath || !1, n = u.invertUV || !1, x = Math.floor(e[0].length / 2);
  let c = u.offset || x;
  c = c > x ? x : Math.floor(c);
  const h = u.sideOrientation === 0 ? 0 : u.sideOrientation || j.DEFAULTSIDE, m = u.uvs, A = u.colors, F = [], C = [], f = [], b = [], r = [], v = [], p = [], D = [];
  let L;
  const E = [], I = [];
  let o, g, l;
  if (e.length < 2) {
    const R = [], K = [];
    for (g = 0; g < e[0].length - c; g++)
      R.push(e[0][g]), K.push(e[0][g + c]);
    e = [R, K];
  }
  let B = 0;
  const V = a ? 1 : 0, P = t ? 1 : 0;
  let U, z;
  L = e[0].length;
  let W, k;
  for (o = 0; o < e.length + P; o++) {
    for (p[o] = 0, r[o] = [0], U = o === e.length ? e[0] : e[o], z = U.length, L = L < z ? L : z, l = 0; l < z; )
      F.push(U[l].x, U[l].y, U[l].z), l > 0 && (W = U[l].subtract(U[l - 1]).length(), k = W + p[o], r[o].push(k), p[o] = k), l++;
    a && (l--, F.push(U[0].x, U[0].y, U[0].z), W = U[l].subtract(U[0]).length(), k = W + p[o], r[o].push(k), p[o] = k), E[o] = z + V, I[o] = B, B += z + V;
  }
  let Y, X, N = null, Z = null;
  for (g = 0; g < L + V; g++)
    for (D[g] = 0, v[g] = [0], o = 0; o < e.length - 1 + P; o++)
      Y = e[o], X = o === e.length - 1 ? e[0] : e[o + 1], g === L ? (N = Y[0], Z = X[0]) : (N = Y[g], Z = X[g]), W = Z.subtract(N).length(), k = W + D[g], v[g].push(k), D[g] = k;
  let y, T;
  if (m)
    for (o = 0; o < m.length; o++)
      b.push(m[o].x, se.UseOpenGLOrientationForUV ? 1 - m[o].y : m[o].y);
  else
    for (o = 0; o < e.length + P; o++)
      for (g = 0; g < L + V; g++)
        y = p[o] != 0 ? r[o][g] / p[o] : 0, T = D[g] != 0 ? v[g][o] / D[g] : 0, n ? b.push(T, y) : b.push(y, se.UseOpenGLOrientationForUV ? 1 - T : T);
  o = 0;
  let s = 0, i = E[o] - 1, d = E[o + 1] - 1, _ = i < d ? i : d, S = I[1] - I[0];
  const w = E.length - 1;
  for (; s <= _ && o < w; )
    C.push(s, s + S, s + 1), C.push(s + S + 1, s + 1, s + S), s += 1, s === _ && (o++, S = I[o + 1] - I[o], i = E[o] - 1, d = E[o + 1] - 1, s = I[o], _ = i < d ? i + s : d + s);
  if (j.ComputeNormals(F, C, f), a) {
    let R = 0, K = 0;
    for (o = 0; o < e.length; o++) {
      R = I[o] * 3, o + 1 < e.length ? K = (I[o + 1] - 1) * 3 : K = f.length - 3, f[R] = (f[R] + f[K]) * 0.5, f[R + 1] = (f[R + 1] + f[K + 1]) * 0.5, f[R + 2] = (f[R + 2] + f[K + 2]) * 0.5;
      const $ = Math.sqrt(f[R] * f[R] + f[R + 1] * f[R + 1] + f[R + 2] * f[R + 2]);
      f[R] /= $, f[R + 1] /= $, f[R + 2] /= $, f[K] = f[R], f[K + 1] = f[R + 1], f[K + 2] = f[R + 2];
    }
  }
  if (t) {
    let R = I[0] * 3, K = I[e.length] * 3;
    for (g = 0; g < L + V; g++) {
      f[R] = (f[R] + f[K]) * 0.5, f[R + 1] = (f[R + 1] + f[K + 1]) * 0.5, f[R + 2] = (f[R + 2] + f[K + 2]) * 0.5;
      const $ = Math.sqrt(f[R] * f[R] + f[R + 1] * f[R + 1] + f[R + 2] * f[R + 2]);
      f[R] /= $, f[R + 1] /= $, f[R + 2] /= $, f[K] = f[R], f[K + 1] = f[R + 1], f[K + 2] = f[R + 2], R += 3, K += 3;
    }
  }
  j._ComputeSides(h, F, C, f, b, u.frontUVs, u.backUVs);
  let G = null;
  if (A) {
    G = new Float32Array(A.length * 4);
    for (let R = 0; R < A.length; R++)
      G[R * 4] = A[R].r, G[R * 4 + 1] = A[R].g, G[R * 4 + 2] = A[R].b, G[R * 4 + 3] = A[R].a;
  }
  const q = new j(), ee = new Float32Array(F), ie = new Float32Array(f), re = new Float32Array(b);
  return q.indices = C, q.positions = ee, q.normals = ie, q.uvs = re, G && q.set(G, Q.ColorKind), a && (q._idx = I), q;
}
function le(u, e, t = null) {
  const a = e.pathArray, n = e.closeArray, x = e.closePath, c = O._GetDefaultSideOrientation(e.sideOrientation), h = e.instance, m = e.updatable;
  if (h) {
    const A = de.Vector3[0].setAll(Number.MAX_VALUE), F = de.Vector3[1].setAll(-Number.MAX_VALUE), C = (b) => {
      let r = a[0].length;
      const v = h;
      let p = 0;
      const D = v._originalBuilderSideOrientation === O.DOUBLESIDE ? 2 : 1;
      for (let L = 1; L <= D; ++L)
        for (let E = 0; E < a.length; ++E) {
          const I = a[E], o = I.length;
          r = r < o ? r : o;
          for (let g = 0; g < r; ++g) {
            const l = I[g];
            b[p] = l.x, b[p + 1] = l.y, b[p + 2] = l.z, A.minimizeInPlaceFromFloats(l.x, l.y, l.z), F.maximizeInPlaceFromFloats(l.x, l.y, l.z), p += 3;
          }
          if (v._creationDataStorage && v._creationDataStorage.closePath) {
            const g = I[0];
            b[p] = g.x, b[p + 1] = g.y, b[p + 2] = g.z, p += 3;
          }
        }
    }, f = h.getVerticesData(Q.PositionKind);
    if (C(f), h.hasBoundingInfo ? h.getBoundingInfo().reConstruct(A, F, h._worldMatrix) : h.buildBoundingInfo(A, F, h._worldMatrix), h.updateVerticesData(Q.PositionKind, f, !1, !1), e.colors) {
      const b = h.getVerticesData(Q.ColorKind);
      for (let r = 0, v = 0; r < e.colors.length; r++, v += 4) {
        const p = e.colors[r];
        b[v] = p.r, b[v + 1] = p.g, b[v + 2] = p.b, b[v + 3] = p.a;
      }
      h.updateVerticesData(Q.ColorKind, b, !1, !1);
    }
    if (e.uvs) {
      const b = h.getVerticesData(Q.UVKind);
      for (let r = 0; r < e.uvs.length; r++)
        b[r * 2] = e.uvs[r].x, b[r * 2 + 1] = se.UseOpenGLOrientationForUV ? 1 - e.uvs[r].y : e.uvs[r].y;
      h.updateVerticesData(Q.UVKind, b, !1, !1);
    }
    if (!h.areNormalsFrozen || h.isFacetDataEnabled) {
      const b = h.getIndices(), r = h.getVerticesData(Q.NormalKind), v = h.isFacetDataEnabled ? h.getFacetDataParameters() : null;
      if (j.ComputeNormals(f, b, r, v), h._creationDataStorage && h._creationDataStorage.closePath) {
        let p = 0, D = 0;
        for (let L = 0; L < a.length; L++)
          p = h._creationDataStorage.idx[L] * 3, L + 1 < a.length ? D = (h._creationDataStorage.idx[L + 1] - 1) * 3 : D = r.length - 3, r[p] = (r[p] + r[D]) * 0.5, r[p + 1] = (r[p + 1] + r[D + 1]) * 0.5, r[p + 2] = (r[p + 2] + r[D + 2]) * 0.5, r[D] = r[p], r[D + 1] = r[p + 1], r[D + 2] = r[p + 2];
      }
      h.areNormalsFrozen || h.updateVerticesData(Q.NormalKind, r, !1, !1);
    }
    return h;
  } else {
    const A = new O(u, t);
    A._originalBuilderSideOrientation = c, A._creationDataStorage = new st();
    const F = Xe(e);
    return x && (A._creationDataStorage.idx = F._idx), A._creationDataStorage.closePath = x, A._creationDataStorage.closeArray = n, F.applyToMesh(A, m), A;
  }
}
const zt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateRibbon: le
};
j.CreateRibbon = Xe;
O.CreateRibbon = (u, e, t = !1, a, n, x, c = !1, h, m) => le(u, {
  pathArray: e,
  closeArray: t,
  closePath: a,
  offset: n,
  updatable: c,
  sideOrientation: h,
  instance: m
}, x);
function Ye(u) {
  const e = [], t = [], a = [], n = [], x = u.radius || 0.5, c = u.tessellation || 64, h = u.arc && (u.arc <= 0 || u.arc > 1) ? 1 : u.arc || 1, m = u.sideOrientation === 0 ? 0 : u.sideOrientation || j.DEFAULTSIDE;
  e.push(0, 0, 0), n.push(0.5, 0.5);
  const A = Math.PI * 2 * h, F = h === 1 ? A / c : A / (c - 1);
  let C = 0;
  for (let r = 0; r < c; r++) {
    const v = Math.cos(C), p = Math.sin(C), D = (v + 1) / 2, L = (1 - p) / 2;
    e.push(x * v, x * p, 0), n.push(D, se.UseOpenGLOrientationForUV ? 1 - L : L), C += F;
  }
  h === 1 && (e.push(e[3], e[4], e[5]), n.push(n[2], se.UseOpenGLOrientationForUV ? 1 - n[3] : n[3]));
  const f = e.length / 3;
  for (let r = 1; r < f - 1; r++)
    t.push(r + 1, 0, r);
  j.ComputeNormals(e, t, a), j._ComputeSides(m, e, t, a, n, u.frontUVs, u.backUVs);
  const b = new j();
  return b.indices = t, b.positions = e, b.normals = a, b.uvs = n, b;
}
function Ee(u, e = {}, t = null) {
  const a = new O(u, t);
  return e.sideOrientation = O._GetDefaultSideOrientation(e.sideOrientation), a._originalBuilderSideOrientation = e.sideOrientation, Ye(e).applyToMesh(a, e.updatable), a;
}
const Nt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateDisc: Ee
};
j.CreateDisc = Ye;
O.CreateDisc = (u, e, t, a = null, n, x) => Ee(u, {
  radius: e,
  tessellation: t,
  sideOrientation: x,
  updatable: n
}, a);
function ge(u) {
  const e = u.pattern || O.NO_FLIP, t = u.tileWidth || u.tileSize || 1, a = u.tileHeight || u.tileSize || 1, n = u.alignHorizontal || 0, x = u.alignVertical || 0, c = u.width || u.size || 1, h = Math.floor(c / t);
  let m = c - h * t;
  const A = u.height || u.size || 1, F = Math.floor(A / a);
  let C = A - F * a;
  const f = t * h / 2, b = a * F / 2;
  let r = 0, v = 0, p = 0, D = 0, L = 0, E = 0;
  if (m > 0 || C > 0) {
    switch (p = -f, D = -b, L = f, E = b, n) {
      case O.CENTER:
        m /= 2, p -= m, L += m;
        break;
      case O.LEFT:
        L += m, r = -m / 2;
        break;
      case O.RIGHT:
        p -= m, r = m / 2;
        break;
    }
    switch (x) {
      case O.CENTER:
        C /= 2, D -= C, E += C;
        break;
      case O.BOTTOM:
        E += C, v = -C / 2;
        break;
      case O.TOP:
        D -= C, v = C / 2;
        break;
    }
  }
  const I = [], o = [], g = [];
  g[0] = [0, 0, 1, 0, 1, 1, 0, 1], g[1] = [0, 0, 1, 0, 1, 1, 0, 1], (e === O.ROTATE_TILE || e === O.ROTATE_ROW) && (g[1] = [1, 1, 0, 1, 0, 0, 1, 0]), (e === O.FLIP_TILE || e === O.FLIP_ROW) && (g[1] = [1, 0, 0, 0, 0, 1, 1, 1]), (e === O.FLIP_N_ROTATE_TILE || e === O.FLIP_N_ROTATE_ROW) && (g[1] = [0, 1, 1, 1, 1, 0, 0, 0]);
  let l = [];
  const B = [], V = [];
  let P = 0;
  for (let k = 0; k < F; k++)
    for (let Y = 0; Y < h; Y++)
      I.push(-f + Y * t + r, -b + k * a + v, 0), I.push(-f + (Y + 1) * t + r, -b + k * a + v, 0), I.push(-f + (Y + 1) * t + r, -b + (k + 1) * a + v, 0), I.push(-f + Y * t + r, -b + (k + 1) * a + v, 0), V.push(P, P + 1, P + 3, P + 1, P + 2, P + 3), e === O.FLIP_TILE || e === O.ROTATE_TILE || e === O.FLIP_N_ROTATE_TILE ? l = l.concat(g[(Y % 2 + k % 2) % 2]) : e === O.FLIP_ROW || e === O.ROTATE_ROW || e === O.FLIP_N_ROTATE_ROW ? l = l.concat(g[k % 2]) : l = l.concat(g[0]), B.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), o.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1), P += 4;
  if (m > 0 || C > 0) {
    const k = C > 0 && (x === O.CENTER || x === O.TOP), Y = C > 0 && (x === O.CENTER || x === O.BOTTOM), X = m > 0 && (n === O.CENTER || n === O.RIGHT), N = m > 0 && (n === O.CENTER || n === O.LEFT);
    let Z = [], y, T, s, i;
    if (k && X && (I.push(p + r, D + v, 0), I.push(-f + r, D + v, 0), I.push(-f + r, D + C + v, 0), I.push(p + r, D + C + v, 0), V.push(P, P + 1, P + 3, P + 1, P + 2, P + 3), P += 4, y = 1 - m / t, T = 1 - C / a, s = 1, i = 1, Z = [y, T, s, T, s, i, y, i], e === O.ROTATE_ROW && (Z = [1 - y, 1 - T, 1 - s, 1 - T, 1 - s, 1 - i, 1 - y, 1 - i]), e === O.FLIP_ROW && (Z = [1 - y, T, 1 - s, T, 1 - s, i, 1 - y, i]), e === O.FLIP_N_ROTATE_ROW && (Z = [y, 1 - T, s, 1 - T, s, 1 - i, y, 1 - i]), l = l.concat(Z), B.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), o.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1)), k && N && (I.push(f + r, D + v, 0), I.push(L + r, D + v, 0), I.push(L + r, D + C + v, 0), I.push(f + r, D + C + v, 0), V.push(P, P + 1, P + 3, P + 1, P + 2, P + 3), P += 4, y = 0, T = 1 - C / a, s = m / t, i = 1, Z = [y, T, s, T, s, i, y, i], (e === O.ROTATE_ROW || e === O.ROTATE_TILE && h % 2 === 0) && (Z = [1 - y, 1 - T, 1 - s, 1 - T, 1 - s, 1 - i, 1 - y, 1 - i]), (e === O.FLIP_ROW || e === O.FLIP_TILE && h % 2 === 0) && (Z = [1 - y, T, 1 - s, T, 1 - s, i, 1 - y, i]), (e === O.FLIP_N_ROTATE_ROW || e === O.FLIP_N_ROTATE_TILE && h % 2 === 0) && (Z = [y, 1 - T, s, 1 - T, s, 1 - i, y, 1 - i]), l = l.concat(Z), B.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), o.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1)), Y && X && (I.push(p + r, b + v, 0), I.push(-f + r, b + v, 0), I.push(-f + r, E + v, 0), I.push(p + r, E + v, 0), V.push(P, P + 1, P + 3, P + 1, P + 2, P + 3), P += 4, y = 1 - m / t, T = 0, s = 1, i = C / a, Z = [y, T, s, T, s, i, y, i], (e === O.ROTATE_ROW && F % 2 === 1 || e === O.ROTATE_TILE && F % 1 === 0) && (Z = [1 - y, 1 - T, 1 - s, 1 - T, 1 - s, 1 - i, 1 - y, 1 - i]), (e === O.FLIP_ROW && F % 2 === 1 || e === O.FLIP_TILE && F % 2 === 0) && (Z = [1 - y, T, 1 - s, T, 1 - s, i, 1 - y, i]), (e === O.FLIP_N_ROTATE_ROW && F % 2 === 1 || e === O.FLIP_N_ROTATE_TILE && F % 2 === 0) && (Z = [y, 1 - T, s, 1 - T, s, 1 - i, y, 1 - i]), l = l.concat(Z), B.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), o.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1)), Y && N && (I.push(f + r, b + v, 0), I.push(L + r, b + v, 0), I.push(L + r, E + v, 0), I.push(f + r, E + v, 0), V.push(P, P + 1, P + 3, P + 1, P + 2, P + 3), P += 4, y = 0, T = 0, s = m / t, i = C / a, Z = [y, T, s, T, s, i, y, i], (e === O.ROTATE_ROW && F % 2 === 1 || e === O.ROTATE_TILE && (F + h) % 2 === 1) && (Z = [1 - y, 1 - T, 1 - s, 1 - T, 1 - s, 1 - i, 1 - y, 1 - i]), (e === O.FLIP_ROW && F % 2 === 1 || e === O.FLIP_TILE && (F + h) % 2 === 1) && (Z = [1 - y, T, 1 - s, T, 1 - s, i, 1 - y, i]), (e === O.FLIP_N_ROTATE_ROW && F % 2 === 1 || e === O.FLIP_N_ROTATE_TILE && (F + h) % 2 === 1) && (Z = [y, 1 - T, s, 1 - T, s, 1 - i, y, 1 - i]), l = l.concat(Z), B.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), o.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1)), k) {
      const d = [];
      y = 0, T = 1 - C / a, s = 1, i = 1, d[0] = [y, T, s, T, s, i, y, i], d[1] = [y, T, s, T, s, i, y, i], (e === O.ROTATE_TILE || e === O.ROTATE_ROW) && (d[1] = [1 - y, 1 - T, 1 - s, 1 - T, 1 - s, 1 - i, 1 - y, 1 - i]), (e === O.FLIP_TILE || e === O.FLIP_ROW) && (d[1] = [1 - y, T, 1 - s, T, 1 - s, i, 1 - y, i]), (e === O.FLIP_N_ROTATE_TILE || e === O.FLIP_N_ROTATE_ROW) && (d[1] = [y, 1 - T, s, 1 - T, s, 1 - i, y, 1 - i]);
      for (let _ = 0; _ < h; _++)
        I.push(-f + _ * t + r, D + v, 0), I.push(-f + (_ + 1) * t + r, D + v, 0), I.push(-f + (_ + 1) * t + r, D + C + v, 0), I.push(-f + _ * t + r, D + C + v, 0), V.push(P, P + 1, P + 3, P + 1, P + 2, P + 3), P += 4, e === O.FLIP_TILE || e === O.ROTATE_TILE || e === O.FLIP_N_ROTATE_TILE ? l = l.concat(d[(_ + 1) % 2]) : e === O.FLIP_ROW || e === O.ROTATE_ROW || e === O.FLIP_N_ROTATE_ROW ? l = l.concat(d[1]) : l = l.concat(d[0]), B.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), o.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
    }
    if (Y) {
      const d = [];
      y = 0, T = 0, s = 1, i = C / a, d[0] = [y, T, s, T, s, i, y, i], d[1] = [y, T, s, T, s, i, y, i], (e === O.ROTATE_TILE || e === O.ROTATE_ROW) && (d[1] = [1 - y, 1 - T, 1 - s, 1 - T, 1 - s, 1 - i, 1 - y, 1 - i]), (e === O.FLIP_TILE || e === O.FLIP_ROW) && (d[1] = [1 - y, T, 1 - s, T, 1 - s, i, 1 - y, i]), (e === O.FLIP_N_ROTATE_TILE || e === O.FLIP_N_ROTATE_ROW) && (d[1] = [y, 1 - T, s, 1 - T, s, 1 - i, y, 1 - i]);
      for (let _ = 0; _ < h; _++)
        I.push(-f + _ * t + r, E - C + v, 0), I.push(-f + (_ + 1) * t + r, E - C + v, 0), I.push(-f + (_ + 1) * t + r, E + v, 0), I.push(-f + _ * t + r, E + v, 0), V.push(P, P + 1, P + 3, P + 1, P + 2, P + 3), P += 4, e === O.FLIP_TILE || e === O.ROTATE_TILE || e === O.FLIP_N_ROTATE_TILE ? l = l.concat(d[(_ + F) % 2]) : e === O.FLIP_ROW || e === O.ROTATE_ROW || e === O.FLIP_N_ROTATE_ROW ? l = l.concat(d[F % 2]) : l = l.concat(d[0]), B.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), o.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
    }
    if (X) {
      const d = [];
      y = 1 - m / t, T = 0, s = 1, i = 1, d[0] = [y, T, s, T, s, i, y, i], d[1] = [y, T, s, T, s, i, y, i], (e === O.ROTATE_TILE || e === O.ROTATE_ROW) && (d[1] = [1 - y, 1 - T, 1 - s, 1 - T, 1 - s, 1 - i, 1 - y, 1 - i]), (e === O.FLIP_TILE || e === O.FLIP_ROW) && (d[1] = [1 - y, T, 1 - s, T, 1 - s, i, 1 - y, i]), (e === O.FLIP_N_ROTATE_TILE || e === O.FLIP_N_ROTATE_ROW) && (d[1] = [y, 1 - T, s, 1 - T, s, 1 - i, y, 1 - i]);
      for (let _ = 0; _ < F; _++)
        I.push(p + r, -b + _ * a + v, 0), I.push(p + m + r, -b + _ * a + v, 0), I.push(p + m + r, -b + (_ + 1) * a + v, 0), I.push(p + r, -b + (_ + 1) * a + v, 0), V.push(P, P + 1, P + 3, P + 1, P + 2, P + 3), P += 4, e === O.FLIP_TILE || e === O.ROTATE_TILE || e === O.FLIP_N_ROTATE_TILE ? l = l.concat(d[(_ + 1) % 2]) : e === O.FLIP_ROW || e === O.ROTATE_ROW || e === O.FLIP_N_ROTATE_ROW ? l = l.concat(d[_ % 2]) : l = l.concat(d[0]), B.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), o.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
    }
    if (N) {
      const d = [];
      y = 0, T = 0, s = m / a, i = 1, d[0] = [y, T, s, T, s, i, y, i], d[1] = [y, T, s, T, s, i, y, i], (e === O.ROTATE_TILE || e === O.ROTATE_ROW) && (d[1] = [1 - y, 1 - T, 1 - s, 1 - T, 1 - s, 1 - i, 1 - y, 1 - i]), (e === O.FLIP_TILE || e === O.FLIP_ROW) && (d[1] = [1 - y, T, 1 - s, T, 1 - s, i, 1 - y, i]), (e === O.FLIP_N_ROTATE_TILE || e === O.FLIP_N_ROTATE_ROW) && (d[1] = [y, 1 - T, s, 1 - T, s, 1 - i, y, 1 - i]);
      for (let _ = 0; _ < F; _++)
        I.push(L - m + r, -b + _ * a + v, 0), I.push(L + r, -b + _ * a + v, 0), I.push(L + r, -b + (_ + 1) * a + v, 0), I.push(L - m + r, -b + (_ + 1) * a + v, 0), V.push(P, P + 1, P + 3, P + 1, P + 2, P + 3), P += 4, e === O.FLIP_TILE || e === O.ROTATE_TILE || e === O.FLIP_N_ROTATE_TILE ? l = l.concat(d[(_ + h) % 2]) : e === O.FLIP_ROW || e === O.ROTATE_ROW || e === O.FLIP_N_ROTATE_ROW ? l = l.concat(d[_ % 2]) : l = l.concat(d[0]), B.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1), o.push(0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1);
    }
  }
  const U = u.sideOrientation === 0 ? 0 : u.sideOrientation || j.DEFAULTSIDE;
  j._ComputeSides(U, I, V, o, l, u.frontUVs, u.backUVs);
  const z = new j();
  z.indices = V, z.positions = I, z.normals = o, z.uvs = l;
  const W = U === j.DOUBLESIDE ? B.concat(B) : B;
  return z.colors = W, z;
}
function Ke(u, e, t = null) {
  const a = new O(u, t);
  return e.sideOrientation = O._GetDefaultSideOrientation(e.sideOrientation), a._originalBuilderSideOrientation = e.sideOrientation, ge(e).applyToMesh(a, e.updatable), a;
}
const St = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateTiledPlane: Ke
};
j.CreateTiledPlane = ge;
function je(u) {
  const t = u.faceUV || new Array(6), a = u.faceColors, n = u.pattern || O.NO_FLIP, x = u.width || u.size || 1, c = u.height || u.size || 1, h = u.depth || u.size || 1, m = u.tileWidth || u.tileSize || 1, A = u.tileHeight || u.tileSize || 1, F = u.alignHorizontal || 0, C = u.alignVertical || 0, f = u.sideOrientation === 0 ? 0 : u.sideOrientation || j.DEFAULTSIDE;
  for (let s = 0; s < 6; s++)
    t[s] === void 0 && (t[s] = new ke(0, 0, 1, 1)), a && a[s] === void 0 && (a[s] = new be(1, 1, 1, 1));
  const b = x / 2, r = c / 2, v = h / 2, p = [];
  for (let s = 0; s < 2; s++)
    p[s] = ge({
      pattern: n,
      tileWidth: m,
      tileHeight: A,
      width: x,
      height: c,
      alignVertical: C,
      alignHorizontal: F,
      sideOrientation: f
    });
  for (let s = 2; s < 4; s++)
    p[s] = ge({
      pattern: n,
      tileWidth: m,
      tileHeight: A,
      width: h,
      height: c,
      alignVertical: C,
      alignHorizontal: F,
      sideOrientation: f
    });
  let D = C;
  C === O.BOTTOM ? D = O.TOP : C === O.TOP && (D = O.BOTTOM);
  for (let s = 4; s < 6; s++)
    p[s] = ge({
      pattern: n,
      tileWidth: m,
      tileHeight: A,
      width: x,
      height: h,
      alignVertical: D,
      alignHorizontal: F,
      sideOrientation: f
    });
  let L = [], E = [], I = [], o = [];
  const g = [], l = [], B = [], V = [];
  let P = 0, U = 0;
  for (let s = 0; s < 6; s++) {
    const i = p[s].positions.length;
    l[s] = [], B[s] = [];
    for (let d = 0; d < i / 3; d++)
      l[s].push(new M(p[s].positions[3 * d], p[s].positions[3 * d + 1], p[s].positions[3 * d + 2])), B[s].push(new M(p[s].normals[3 * d], p[s].normals[3 * d + 1], p[s].normals[3 * d + 2]));
    P = p[s].uvs.length, V[s] = [];
    for (let d = 0; d < P; d += 2)
      V[s][d] = t[s].x + (t[s].z - t[s].x) * p[s].uvs[d], V[s][d + 1] = t[s].y + (t[s].w - t[s].y) * p[s].uvs[d + 1], se.UseOpenGLOrientationForUV && (V[s][d + 1] = 1 - V[s][d + 1]);
    if (I = I.concat(V[s]), o = o.concat(p[s].indices.map((d) => d + U)), U += l[s].length, a)
      for (let d = 0; d < 4; d++)
        g.push(a[s].r, a[s].g, a[s].b, a[s].a);
  }
  const z = new M(0, 0, v), W = ne.RotationY(Math.PI);
  L = l[0].map((s) => M.TransformNormal(s, W).add(z)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), []), E = B[0].map((s) => M.TransformNormal(s, W)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), []), L = L.concat(l[1].map((s) => s.subtract(z)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), [])), E = E.concat(B[1].map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), []));
  const k = new M(b, 0, 0), Y = ne.RotationY(-Math.PI / 2);
  L = L.concat(l[2].map((s) => M.TransformNormal(s, Y).add(k)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), [])), E = E.concat(B[2].map((s) => M.TransformNormal(s, Y)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), []));
  const X = ne.RotationY(Math.PI / 2);
  L = L.concat(l[3].map((s) => M.TransformNormal(s, X).subtract(k)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), [])), E = E.concat(B[3].map((s) => M.TransformNormal(s, X)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), []));
  const N = new M(0, r, 0), Z = ne.RotationX(Math.PI / 2);
  L = L.concat(l[4].map((s) => M.TransformNormal(s, Z).add(N)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), [])), E = E.concat(B[4].map((s) => M.TransformNormal(s, Z)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), []));
  const y = ne.RotationX(-Math.PI / 2);
  L = L.concat(l[5].map((s) => M.TransformNormal(s, y).subtract(N)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), [])), E = E.concat(B[5].map((s) => M.TransformNormal(s, y)).map((s) => [s.x, s.y, s.z]).reduce((s, i) => s.concat(i), [])), j._ComputeSides(f, L, o, E, I);
  const T = new j();
  if (T.indices = o, T.positions = L, T.normals = E, T.uvs = I, a) {
    const s = f === j.DOUBLESIDE ? g.concat(g) : g;
    T.colors = s;
  }
  return T;
}
function He(u, e, t = null) {
  const a = new O(u, t);
  return e.sideOrientation = O._GetDefaultSideOrientation(e.sideOrientation), a._originalBuilderSideOrientation = e.sideOrientation, je(e).applyToMesh(a, e.updatable), a;
}
const Wt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateTiledBox: He
};
j.CreateTiledBox = je;
function qe(u) {
  const e = [], t = [], a = [], n = [], x = u.radius || 2, c = u.tube || 0.5, h = u.radialSegments || 32, m = u.tubularSegments || 32, A = u.p || 2, F = u.q || 3, C = u.sideOrientation === 0 ? 0 : u.sideOrientation || j.DEFAULTSIDE, f = (p) => {
    const D = Math.cos(p), L = Math.sin(p), E = F / A * p, I = Math.cos(E), o = x * (2 + I) * 0.5 * D, g = x * (2 + I) * L * 0.5, l = x * Math.sin(E) * 0.5;
    return new M(o, g, l);
  };
  let b, r;
  for (b = 0; b <= h; b++) {
    const D = b % h / h * 2 * A * Math.PI, L = f(D), E = f(D + 0.01), I = E.subtract(L);
    let o = E.add(L);
    const g = M.Cross(I, o);
    for (o = M.Cross(g, I), g.normalize(), o.normalize(), r = 0; r < m; r++) {
      const B = r % m / m * 2 * Math.PI, V = -c * Math.cos(B), P = c * Math.sin(B);
      t.push(L.x + V * o.x + P * g.x), t.push(L.y + V * o.y + P * g.y), t.push(L.z + V * o.z + P * g.z), n.push(b / h), n.push(se.UseOpenGLOrientationForUV ? 1 - r / m : r / m);
    }
  }
  for (b = 0; b < h; b++)
    for (r = 0; r < m; r++) {
      const p = (r + 1) % m, D = b * m + r, L = (b + 1) * m + r, E = (b + 1) * m + p, I = b * m + p;
      e.push(I), e.push(L), e.push(D), e.push(I), e.push(E), e.push(L);
    }
  j.ComputeNormals(t, e, a), j._ComputeSides(C, t, e, a, n, u.frontUVs, u.backUVs);
  const v = new j();
  return v.indices = e, v.positions = t, v.normals = a, v.uvs = n, v;
}
function Re(u, e = {}, t) {
  const a = new O(u, t);
  return e.sideOrientation = O._GetDefaultSideOrientation(e.sideOrientation), a._originalBuilderSideOrientation = e.sideOrientation, qe(e).applyToMesh(a, e.updatable), a;
}
const Gt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateTorusKnot: Re
};
j.CreateTorusKnot = qe;
O.CreateTorusKnot = (u, e, t, a, n, x, c, h, m, A) => Re(u, {
  radius: e,
  tube: t,
  radialSegments: a,
  tubularSegments: n,
  p: x,
  q: c,
  sideOrientation: A,
  updatable: m
}, h);
function we(u, e, t = null) {
  const a = e.path, n = e.shape, x = e.scale || 1, c = e.rotation || 0, h = e.cap === 0 ? 0 : e.cap || O.NO_CAP, m = e.updatable, A = O._GetDefaultSideOrientation(e.sideOrientation), F = e.instance || null, C = e.invertUV || !1, f = e.closeShape || !1, b = e.closePath || !1;
  return Je(u, n, a, x, c, null, null, b, f, h, !1, t, !!m, A, F, C, e.frontUVs || null, e.backUVs || null, e.firstNormal || null, !!e.adjustFrame);
}
function Me(u, e, t = null) {
  const a = e.path, n = e.shape, x = e.scaleFunction || (() => 1), c = e.rotationFunction || (() => 0), h = e.closePath || e.ribbonCloseArray || !1, m = e.closeShape || e.ribbonClosePath || !1, A = e.cap === 0 ? 0 : e.cap || O.NO_CAP, F = e.updatable, C = e.firstNormal || null, f = e.adjustFrame || !1, b = O._GetDefaultSideOrientation(e.sideOrientation), r = e.instance, v = e.invertUV || !1;
  return Je(u, n, a, null, null, x, c, h, m, A, !0, t, !!F, b, r || null, v, e.frontUVs || null, e.backUVs || null, C, f);
}
function Je(u, e, t, a, n, x, c, h, m, A, F, C, f, b, r, v, p, D, L, E) {
  const I = (V, P, U, z, W, k, Y, X, N, Z, y) => {
    const T = U.getTangents(), s = U.getNormals(), i = U.getBinormals(), d = U.getDistances();
    if (y) {
      for (let R = 0; R < T.length; R++)
        if (T[R].x == 0 && T[R].y == 0 && T[R].z == 0 && T[R].copyFrom(T[R - 1]), s[R].x == 0 && s[R].y == 0 && s[R].z == 0 && s[R].copyFrom(s[R - 1]), i[R].x == 0 && i[R].y == 0 && i[R].z == 0 && i[R].copyFrom(i[R - 1]), R > 0) {
          let K = T[R - 1];
          M.Dot(K, T[R]) < 0 && T[R].scaleInPlace(-1), K = s[R - 1], M.Dot(K, s[R]) < 0 && s[R].scaleInPlace(-1), K = i[R - 1], M.Dot(K, i[R]) < 0 && i[R].scaleInPlace(-1);
        }
    }
    let _ = 0;
    const S = () => W !== null ? W : 1, G = Z && X ? X : () => k !== null ? k : 0, q = Z && Y ? Y : S;
    let ee = N === O.NO_CAP || N === O.CAP_END ? 0 : 2;
    const ie = de.Matrix[0];
    for (let R = 0; R < P.length; R++) {
      const K = [], $ = G(R, d[R]), ae = q(R, d[R]);
      ne.RotationAxisToRef(T[R], _, ie);
      for (let ce = 0; ce < V.length; ce++) {
        const ye = T[R].scale(V[ce].z).add(s[R].scale(V[ce].x)).add(i[R].scale(V[ce].y)), ue = M.Zero();
        M.TransformCoordinatesToRef(ye, ie, ue), ue.scaleInPlace(ae).addInPlace(P[R]), K[ce] = ue;
      }
      z[ee] = K, _ += $, ee++;
    }
    const re = (R) => {
      const K = Array(), $ = M.Zero();
      let ae;
      for (ae = 0; ae < R.length; ae++)
        $.addInPlace(R[ae]);
      for ($.scaleInPlace(1 / R.length), ae = 0; ae < R.length; ae++)
        K.push($);
      return K;
    };
    switch (N) {
      case O.NO_CAP:
        break;
      case O.CAP_START:
        z[0] = re(z[2]), z[1] = z[2];
        break;
      case O.CAP_END:
        z[ee] = z[ee - 1], z[ee + 1] = re(z[ee - 1]);
        break;
      case O.CAP_ALL:
        z[0] = re(z[2]), z[1] = z[2], z[ee] = z[ee - 1], z[ee + 1] = re(z[ee - 1]);
        break;
    }
    return z;
  };
  let o, g;
  if (r) {
    const V = r._creationDataStorage;
    return o = L ? V.path3D.update(t, L) : V.path3D.update(t), g = I(e, t, V.path3D, V.pathArray, a, n, x, c, V.cap, F, E), r = le("", { pathArray: g, closeArray: !1, closePath: !1, offset: 0, updatable: !1, sideOrientation: 0, instance: r }, C || void 0), r;
  }
  o = L ? new Be(t, L) : new Be(t);
  const l = new Array();
  A = A < 0 || A > 3 ? 0 : A, g = I(e, t, o, l, a, n, x, c, A, F, E);
  const B = le(u, {
    pathArray: g,
    closeArray: h,
    closePath: m,
    updatable: f,
    sideOrientation: b,
    invertUV: v,
    frontUVs: p || void 0,
    backUVs: D || void 0
  }, C);
  return B._creationDataStorage.pathArray = g, B._creationDataStorage.path3D = o, B._creationDataStorage.cap = A, B;
}
const Zt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ExtrudeShape: we,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ExtrudeShapeCustom: Me
};
O.ExtrudeShape = (u, e, t, a, n, x, c = null, h, m, A) => {
  const F = {
    shape: e,
    path: t,
    scale: a,
    rotation: n,
    cap: x === 0 ? 0 : x || O.NO_CAP,
    sideOrientation: m,
    instance: A,
    updatable: h
  };
  return we(u, F, c);
};
O.ExtrudeShapeCustom = (u, e, t, a, n, x, c, h, m, A, F, C) => {
  const f = {
    shape: e,
    path: t,
    scaleFunction: a,
    rotationFunction: n,
    ribbonCloseArray: x,
    ribbonClosePath: c,
    cap: h === 0 ? 0 : h || O.NO_CAP,
    sideOrientation: F,
    instance: C,
    updatable: A
  };
  return Me(u, f, m);
};
function Ue(u, e, t = null) {
  const a = e.arc ? e.arc <= 0 || e.arc > 1 ? 1 : e.arc : 1, n = e.closed === void 0 ? !0 : e.closed, x = e.shape, c = e.radius || 1, h = e.tessellation || 64, m = e.clip || 0, A = e.updatable, F = O._GetDefaultSideOrientation(e.sideOrientation), C = e.cap || O.NO_CAP, f = Math.PI * 2, b = [], r = e.invertUV || !1;
  let v = 0, p = 0;
  const D = f / h * a;
  let L, E;
  for (v = 0; v <= h - m; v++) {
    for (E = [], (C == O.CAP_START || C == O.CAP_ALL) && (E.push(new M(0, x[0].y, 0)), E.push(new M(Math.cos(v * D) * x[0].x * c, x[0].y, Math.sin(v * D) * x[0].x * c))), p = 0; p < x.length; p++)
      L = new M(Math.cos(v * D) * x[p].x * c, x[p].y, Math.sin(v * D) * x[p].x * c), E.push(L);
    (C == O.CAP_END || C == O.CAP_ALL) && (E.push(new M(Math.cos(v * D) * x[x.length - 1].x * c, x[x.length - 1].y, Math.sin(v * D) * x[x.length - 1].x * c)), E.push(new M(0, x[x.length - 1].y, 0))), b.push(E);
  }
  return le(u, { pathArray: b, closeArray: n, sideOrientation: F, updatable: A, invertUV: r, frontUVs: e.frontUVs, backUVs: e.backUVs }, t);
}
const kt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateLathe: Ue
};
O.CreateLathe = (u, e, t, a, n, x, c) => Ue(u, {
  shape: e,
  radius: t,
  tessellation: a,
  sideOrientation: c,
  updatable: x
}, n);
function ze(u, e, t = null) {
  const a = e.path;
  let n = e.instance, x = 1;
  e.radius !== void 0 ? x = e.radius : n && (x = n._creationDataStorage.radius);
  const c = e.tessellation || 64, h = e.radiusFunction || null;
  let m = e.cap || O.NO_CAP;
  const A = e.invertUV || !1, F = e.updatable, C = O._GetDefaultSideOrientation(e.sideOrientation);
  e.arc = e.arc && (e.arc <= 0 || e.arc > 1) ? 1 : e.arc || 1;
  const f = (D, L, E, I, o, g, l, B) => {
    const V = L.getTangents(), P = L.getNormals(), U = L.getDistances(), W = Math.PI * 2 / o * B, Y = g || (() => I);
    let X, N, Z, y;
    const T = de.Matrix[0];
    let s = l === O.NO_CAP || l === O.CAP_END ? 0 : 2;
    for (let d = 0; d < D.length; d++) {
      N = Y(d, U[d]), X = Array(), Z = P[d];
      for (let _ = 0; _ < o; _++)
        ne.RotationAxisToRef(V[d], W * _, T), y = X[_] ? X[_] : M.Zero(), M.TransformCoordinatesToRef(Z, T, y), y.scaleInPlace(N).addInPlace(D[d]), X[_] = y;
      E[s] = X, s++;
    }
    const i = (d, _) => {
      const S = Array();
      for (let w = 0; w < d; w++)
        S.push(D[_]);
      return S;
    };
    switch (l) {
      case O.NO_CAP:
        break;
      case O.CAP_START:
        E[0] = i(o, 0), E[1] = E[2].slice(0);
        break;
      case O.CAP_END:
        E[s] = E[s - 1].slice(0), E[s + 1] = i(o, D.length - 1);
        break;
      case O.CAP_ALL:
        E[0] = i(o, 0), E[1] = E[2].slice(0), E[s] = E[s - 1].slice(0), E[s + 1] = i(o, D.length - 1);
        break;
    }
    return E;
  };
  let b, r;
  if (n) {
    const D = n._creationDataStorage, L = e.arc || D.arc;
    return b = D.path3D.update(a), r = f(a, b, D.pathArray, x, D.tessellation, h, D.cap, L), n = le("", { pathArray: r, instance: n }), D.path3D = b, D.pathArray = r, D.arc = L, D.radius = x, n;
  }
  b = new Be(a);
  const v = new Array();
  m = m < 0 || m > 3 ? 0 : m, r = f(a, b, v, x, c, h, m, e.arc);
  const p = le(u, {
    pathArray: r,
    closePath: !0,
    closeArray: !1,
    updatable: F,
    sideOrientation: C,
    invertUV: A,
    frontUVs: e.frontUVs,
    backUVs: e.backUVs
  }, t);
  return p._creationDataStorage.pathArray = r, p._creationDataStorage.path3D = b, p._creationDataStorage.tessellation = c, p._creationDataStorage.cap = m, p._creationDataStorage.arc = e.arc, p._creationDataStorage.radius = x, p;
}
const Xt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateTube: ze
};
O.CreateTube = (u, e, t, a, n, x, c, h, m, A) => ze(u, {
  path: e,
  radius: t,
  tessellation: a,
  radiusFunction: n,
  arc: 1,
  cap: x,
  updatable: h,
  sideOrientation: m,
  instance: A
}, c);
function Qe(u) {
  const e = [];
  e[0] = {
    vertex: [
      [0, 0, 1.732051],
      [1.632993, 0, -0.5773503],
      [-0.8164966, 1.414214, -0.5773503],
      [-0.8164966, -1.414214, -0.5773503]
    ],
    face: [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 1],
      [1, 3, 2]
    ]
  }, e[1] = {
    vertex: [
      [0, 0, 1.414214],
      [1.414214, 0, 0],
      [0, 1.414214, 0],
      [-1.414214, 0, 0],
      [0, -1.414214, 0],
      [0, 0, -1.414214]
    ],
    face: [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 4],
      [0, 4, 1],
      [1, 4, 5],
      [1, 5, 2],
      [2, 5, 3],
      [3, 5, 4]
    ]
  }, e[2] = {
    vertex: [
      [0, 0, 1.070466],
      [0.7136442, 0, 0.7978784],
      [-0.3568221, 0.618034, 0.7978784],
      [-0.3568221, -0.618034, 0.7978784],
      [0.7978784, 0.618034, 0.3568221],
      [0.7978784, -0.618034, 0.3568221],
      [-0.9341724, 0.381966, 0.3568221],
      [0.1362939, 1, 0.3568221],
      [0.1362939, -1, 0.3568221],
      [-0.9341724, -0.381966, 0.3568221],
      [0.9341724, 0.381966, -0.3568221],
      [0.9341724, -0.381966, -0.3568221],
      [-0.7978784, 0.618034, -0.3568221],
      [-0.1362939, 1, -0.3568221],
      [-0.1362939, -1, -0.3568221],
      [-0.7978784, -0.618034, -0.3568221],
      [0.3568221, 0.618034, -0.7978784],
      [0.3568221, -0.618034, -0.7978784],
      [-0.7136442, 0, -0.7978784],
      [0, 0, -1.070466]
    ],
    face: [
      [0, 1, 4, 7, 2],
      [0, 2, 6, 9, 3],
      [0, 3, 8, 5, 1],
      [1, 5, 11, 10, 4],
      [2, 7, 13, 12, 6],
      [3, 9, 15, 14, 8],
      [4, 10, 16, 13, 7],
      [5, 8, 14, 17, 11],
      [6, 12, 18, 15, 9],
      [10, 11, 17, 19, 16],
      [12, 13, 16, 19, 18],
      [14, 15, 18, 19, 17]
    ]
  }, e[3] = {
    vertex: [
      [0, 0, 1.175571],
      [1.051462, 0, 0.5257311],
      [0.3249197, 1, 0.5257311],
      [-0.8506508, 0.618034, 0.5257311],
      [-0.8506508, -0.618034, 0.5257311],
      [0.3249197, -1, 0.5257311],
      [0.8506508, 0.618034, -0.5257311],
      [0.8506508, -0.618034, -0.5257311],
      [-0.3249197, 1, -0.5257311],
      [-1.051462, 0, -0.5257311],
      [-0.3249197, -1, -0.5257311],
      [0, 0, -1.175571]
    ],
    face: [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 4],
      [0, 4, 5],
      [0, 5, 1],
      [1, 5, 7],
      [1, 7, 6],
      [1, 6, 2],
      [2, 6, 8],
      [2, 8, 3],
      [3, 8, 9],
      [3, 9, 4],
      [4, 9, 10],
      [4, 10, 5],
      [5, 10, 7],
      [6, 7, 11],
      [6, 11, 8],
      [7, 10, 11],
      [8, 11, 9],
      [9, 11, 10]
    ]
  }, e[4] = {
    vertex: [
      [0, 0, 1.070722],
      [0.7148135, 0, 0.7971752],
      [-0.104682, 0.7071068, 0.7971752],
      [-0.6841528, 0.2071068, 0.7971752],
      [-0.104682, -0.7071068, 0.7971752],
      [0.6101315, 0.7071068, 0.5236279],
      [1.04156, 0.2071068, 0.1367736],
      [0.6101315, -0.7071068, 0.5236279],
      [-0.3574067, 1, 0.1367736],
      [-0.7888348, -0.5, 0.5236279],
      [-0.9368776, 0.5, 0.1367736],
      [-0.3574067, -1, 0.1367736],
      [0.3574067, 1, -0.1367736],
      [0.9368776, -0.5, -0.1367736],
      [0.7888348, 0.5, -0.5236279],
      [0.3574067, -1, -0.1367736],
      [-0.6101315, 0.7071068, -0.5236279],
      [-1.04156, -0.2071068, -0.1367736],
      [-0.6101315, -0.7071068, -0.5236279],
      [0.104682, 0.7071068, -0.7971752],
      [0.6841528, -0.2071068, -0.7971752],
      [0.104682, -0.7071068, -0.7971752],
      [-0.7148135, 0, -0.7971752],
      [0, 0, -1.070722]
    ],
    face: [
      [0, 2, 3],
      [1, 6, 5],
      [4, 9, 11],
      [7, 15, 13],
      [8, 16, 10],
      [12, 14, 19],
      [17, 22, 18],
      [20, 21, 23],
      [0, 1, 5, 2],
      [0, 3, 9, 4],
      [0, 4, 7, 1],
      [1, 7, 13, 6],
      [2, 5, 12, 8],
      [2, 8, 10, 3],
      [3, 10, 17, 9],
      [4, 11, 15, 7],
      [5, 6, 14, 12],
      [6, 13, 20, 14],
      [8, 12, 19, 16],
      [9, 17, 18, 11],
      [10, 16, 22, 17],
      [11, 18, 21, 15],
      [13, 15, 21, 20],
      [14, 20, 23, 19],
      [16, 19, 23, 22],
      [18, 22, 23, 21]
    ]
  }, e[5] = {
    vertex: [
      [0, 0, 1.322876],
      [1.309307, 0, 0.1889822],
      [-0.9819805, 0.8660254, 0.1889822],
      [0.1636634, -1.299038, 0.1889822],
      [0.3273268, 0.8660254, -0.9449112],
      [-0.8183171, -0.4330127, -0.9449112]
    ],
    face: [
      [0, 3, 1],
      [2, 4, 5],
      [0, 1, 4, 2],
      [0, 2, 5, 3],
      [1, 3, 5, 4]
    ]
  }, e[6] = {
    vertex: [
      [0, 0, 1.159953],
      [1.013464, 0, 0.5642542],
      [-0.3501431, 0.9510565, 0.5642542],
      [-0.7715208, -0.6571639, 0.5642542],
      [0.6633206, 0.9510565, -0.03144481],
      [0.8682979, -0.6571639, -0.3996071],
      [-1.121664, 0.2938926, -0.03144481],
      [-0.2348831, -1.063314, -0.3996071],
      [0.5181548, 0.2938926, -0.9953061],
      [-0.5850262, -0.112257, -0.9953061]
    ],
    face: [
      [0, 1, 4, 2],
      [0, 2, 6, 3],
      [1, 5, 8, 4],
      [3, 6, 9, 7],
      [5, 7, 9, 8],
      [0, 3, 7, 5, 1],
      [2, 4, 8, 9, 6]
    ]
  }, e[7] = {
    vertex: [
      [0, 0, 1.118034],
      [0.8944272, 0, 0.6708204],
      [-0.2236068, 0.8660254, 0.6708204],
      [-0.7826238, -0.4330127, 0.6708204],
      [0.6708204, 0.8660254, 0.2236068],
      [1.006231, -0.4330127, -0.2236068],
      [-1.006231, 0.4330127, 0.2236068],
      [-0.6708204, -0.8660254, -0.2236068],
      [0.7826238, 0.4330127, -0.6708204],
      [0.2236068, -0.8660254, -0.6708204],
      [-0.8944272, 0, -0.6708204],
      [0, 0, -1.118034]
    ],
    face: [
      [0, 1, 4, 2],
      [0, 2, 6, 3],
      [1, 5, 8, 4],
      [3, 6, 10, 7],
      [5, 9, 11, 8],
      [7, 10, 11, 9],
      [0, 3, 7, 9, 5, 1],
      [2, 4, 8, 11, 10, 6]
    ]
  }, e[8] = {
    vertex: [
      [-0.729665, 0.670121, 0.319155],
      [-0.655235, -0.29213, -0.754096],
      [-0.093922, -0.607123, 0.537818],
      [0.702196, 0.595691, 0.485187],
      [0.776626, -0.36656, -0.588064]
    ],
    face: [
      [1, 4, 2],
      [0, 1, 2],
      [3, 0, 2],
      [4, 3, 2],
      [4, 1, 0, 3]
    ]
  }, e[9] = {
    vertex: [
      [-0.868849, -0.100041, 0.61257],
      [-0.329458, 0.976099, 0.28078],
      [-0.26629, -0.013796, -0.477654],
      [-0.13392, -1.034115, 0.229829],
      [0.738834, 0.707117, -0.307018],
      [0.859683, -0.535264, -0.338508]
    ],
    face: [
      [3, 0, 2],
      [5, 3, 2],
      [4, 5, 2],
      [1, 4, 2],
      [0, 1, 2],
      [0, 3, 5, 4, 1]
    ]
  }, e[10] = {
    vertex: [
      [-0.610389, 0.243975, 0.531213],
      [-0.187812, -0.48795, -0.664016],
      [-0.187812, 0.9759, -0.664016],
      [0.187812, -0.9759, 0.664016],
      [0.798201, 0.243975, 0.132803]
    ],
    face: [
      [1, 3, 0],
      [3, 4, 0],
      [3, 1, 4],
      [0, 2, 1],
      [0, 4, 2],
      [2, 4, 1]
    ]
  }, e[11] = {
    vertex: [
      [-1.028778, 0.392027, -0.048786],
      [-0.640503, -0.646161, 0.621837],
      [-0.125162, -0.395663, -0.540059],
      [4683e-6, 0.888447, -0.651988],
      [0.125161, 0.395663, 0.540059],
      [0.632925, -0.791376, 0.433102],
      [1.031672, 0.157063, -0.354165]
    ],
    face: [
      [3, 2, 0],
      [2, 1, 0],
      [2, 5, 1],
      [0, 4, 3],
      [0, 1, 4],
      [4, 1, 5],
      [2, 3, 6],
      [3, 4, 6],
      [5, 2, 6],
      [4, 5, 6]
    ]
  }, e[12] = {
    vertex: [
      [-0.669867, 0.334933, -0.529576],
      [-0.669867, 0.334933, 0.529577],
      [-0.4043, 1.212901, 0],
      [-0.334933, -0.669867, -0.529576],
      [-0.334933, -0.669867, 0.529577],
      [0.334933, 0.669867, -0.529576],
      [0.334933, 0.669867, 0.529577],
      [0.4043, -1.212901, 0],
      [0.669867, -0.334933, -0.529576],
      [0.669867, -0.334933, 0.529577]
    ],
    face: [
      [8, 9, 7],
      [6, 5, 2],
      [3, 8, 7],
      [5, 0, 2],
      [4, 3, 7],
      [0, 1, 2],
      [9, 4, 7],
      [1, 6, 2],
      [9, 8, 5, 6],
      [8, 3, 0, 5],
      [3, 4, 1, 0],
      [4, 9, 6, 1]
    ]
  }, e[13] = {
    vertex: [
      [-0.931836, 0.219976, -0.264632],
      [-0.636706, 0.318353, 0.692816],
      [-0.613483, -0.735083, -0.264632],
      [-0.326545, 0.979634, 0],
      [-0.318353, -0.636706, 0.692816],
      [-0.159176, 0.477529, -0.856368],
      [0.159176, -0.477529, -0.856368],
      [0.318353, 0.636706, 0.692816],
      [0.326545, -0.979634, 0],
      [0.613482, 0.735082, -0.264632],
      [0.636706, -0.318353, 0.692816],
      [0.931835, -0.219977, -0.264632]
    ],
    face: [
      [11, 10, 8],
      [7, 9, 3],
      [6, 11, 8],
      [9, 5, 3],
      [2, 6, 8],
      [5, 0, 3],
      [4, 2, 8],
      [0, 1, 3],
      [10, 4, 8],
      [1, 7, 3],
      [10, 11, 9, 7],
      [11, 6, 5, 9],
      [6, 2, 0, 5],
      [2, 4, 1, 0],
      [4, 10, 7, 1]
    ]
  }, e[14] = {
    vertex: [
      [-0.93465, 0.300459, -0.271185],
      [-0.838689, -0.260219, -0.516017],
      [-0.711319, 0.717591, 0.128359],
      [-0.710334, -0.156922, 0.080946],
      [-0.599799, 0.556003, -0.725148],
      [-0.503838, -4675e-6, -0.969981],
      [-0.487004, 0.26021, 0.48049],
      [-0.460089, -0.750282, -0.512622],
      [-0.376468, 0.973135, -0.325605],
      [-0.331735, -0.646985, 0.084342],
      [-0.254001, 0.831847, 0.530001],
      [-0.125239, -0.494738, -0.966586],
      [0.029622, 0.027949, 0.730817],
      [0.056536, -0.982543, -0.262295],
      [0.08085, 1.087391, 0.076037],
      [0.125583, -0.532729, 0.485984],
      [0.262625, 0.599586, 0.780328],
      [0.391387, -0.726999, -0.716259],
      [0.513854, -0.868287, 0.139347],
      [0.597475, 0.85513, 0.326364],
      [0.641224, 0.109523, 0.783723],
      [0.737185, -0.451155, 0.538891],
      [0.848705, -0.612742, -0.314616],
      [0.976075, 0.365067, 0.32976],
      [1.072036, -0.19561, 0.084927]
    ],
    face: [
      [15, 18, 21],
      [12, 20, 16],
      [6, 10, 2],
      [3, 0, 1],
      [9, 7, 13],
      [2, 8, 4, 0],
      [0, 4, 5, 1],
      [1, 5, 11, 7],
      [7, 11, 17, 13],
      [13, 17, 22, 18],
      [18, 22, 24, 21],
      [21, 24, 23, 20],
      [20, 23, 19, 16],
      [16, 19, 14, 10],
      [10, 14, 8, 2],
      [15, 9, 13, 18],
      [12, 15, 21, 20],
      [6, 12, 16, 10],
      [3, 6, 2, 0],
      [9, 3, 1, 7],
      [9, 15, 12, 6, 3],
      [22, 17, 11, 5, 4, 8, 14, 19, 23, 24]
    ]
  };
  const t = u.type && (u.type < 0 || u.type >= e.length) ? 0 : u.type || 0, a = u.size, n = u.sizeX || a || 1, x = u.sizeY || a || 1, c = u.sizeZ || a || 1, h = u.custom || e[t], m = h.face.length, A = u.faceUV || new Array(m), F = u.faceColors, C = u.flat === void 0 ? !0 : u.flat, f = u.sideOrientation === 0 ? 0 : u.sideOrientation || j.DEFAULTSIDE, b = [], r = [], v = [], p = [], D = [];
  let L = 0, E = 0;
  const I = [];
  let o = 0, g = 0, l, B, V, P, U, z;
  if (C)
    for (g = 0; g < m; g++)
      F && F[g] === void 0 && (F[g] = new be(1, 1, 1, 1)), A && A[g] === void 0 && (A[g] = new ke(0, 0, 1, 1));
  if (C)
    for (g = 0; g < m; g++) {
      const k = h.face[g].length;
      for (V = 2 * Math.PI / k, P = 0.5 * Math.tan(V / 2), U = 0.5, o = 0; o < k; o++)
        b.push(h.vertex[h.face[g][o]][0] * n, h.vertex[h.face[g][o]][1] * x, h.vertex[h.face[g][o]][2] * c), I.push(L), L++, l = A[g].x + (A[g].z - A[g].x) * (0.5 + P), B = A[g].y + (A[g].w - A[g].y) * (U - 0.5), p.push(l, se.UseOpenGLOrientationForUV ? 1 - B : B), z = P * Math.cos(V) - U * Math.sin(V), U = P * Math.sin(V) + U * Math.cos(V), P = z, F && D.push(F[g].r, F[g].g, F[g].b, F[g].a);
      for (o = 0; o < k - 2; o++)
        r.push(I[0 + E], I[o + 2 + E], I[o + 1 + E]);
      E += k;
    }
  else {
    for (o = 0; o < h.vertex.length; o++)
      b.push(h.vertex[o][0] * n, h.vertex[o][1] * x, h.vertex[o][2] * c), p.push(0, se.UseOpenGLOrientationForUV ? 1 : 0);
    for (g = 0; g < m; g++)
      for (o = 0; o < h.face[g].length - 2; o++)
        r.push(h.face[g][0], h.face[g][o + 2], h.face[g][o + 1]);
  }
  j.ComputeNormals(b, r, v), j._ComputeSides(f, b, r, v, p, u.frontUVs, u.backUVs);
  const W = new j();
  return W.positions = b, W.indices = r, W.normals = v, W.uvs = p, F && C && (W.colors = D), W;
}
function Te(u, e = {}, t = null) {
  const a = new O(u, t);
  return e.sideOrientation = O._GetDefaultSideOrientation(e.sideOrientation), a._originalBuilderSideOrientation = e.sideOrientation, Qe(e).applyToMesh(a, e.updatable), a;
}
const Yt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreatePolyhedron: Te
};
j.CreatePolyhedron = Qe;
O.CreatePolyhedron = (u, e, t) => Te(u, e, t);
const pt = new M(1, 0, 0), At = new M(-1, 0, 0), bt = new M(0, 1, 0), Tt = new M(0, -1, 0), vt = new M(0, 0, 1), It = new M(0, 0, -1);
class Ae {
  constructor(e = M.Zero(), t = M.Up(), a = me.Zero(), n = 0, x = 0, c = null, h = null, m = null, A = null) {
    this.position = e, this.normal = t, this.uv = a, this.vertexIdx = n, this.vertexIdxForBones = x, this.localPositionOverride = c, this.localNormalOverride = h, this.matrixIndicesOverride = m, this.matrixWeightsOverride = A;
  }
  clone() {
    return new Ae(this.position.clone(), this.normal.clone(), this.uv.clone(), this.vertexIdx, this.vertexIdxForBones, this.localPositionOverride?.slice(), this.localNormalOverride?.slice(), this.matrixIndicesOverride?.slice(), this.matrixWeightsOverride?.slice());
  }
}
function Ne(u, e, t) {
  const a = !!e.skeleton, n = t.localMode || a, x = e.overrideMaterialSideOrientation !== null && e.overrideMaterialSideOrientation !== void 0, c = e.getIndices(), h = a ? e.getPositionData(!0, !0) : e.getVerticesData(Q.PositionKind), m = a ? e.getNormalsData(!0, !0) : e.getVerticesData(Q.NormalKind), A = n ? a ? e.getVerticesData(Q.PositionKind) : h : null, F = n ? a ? e.getVerticesData(Q.NormalKind) : m : null, C = e.getVerticesData(Q.UVKind), f = a ? e.getVerticesData(Q.MatricesIndicesKind) : null, b = a ? e.getVerticesData(Q.MatricesWeightsKind) : null, r = a ? e.getVerticesData(Q.MatricesIndicesExtraKind) : null, v = a ? e.getVerticesData(Q.MatricesWeightsExtraKind) : null, p = t.position || M.Zero();
  let D = t.normal || M.Up();
  const L = t.size || M.One(), E = t.angle || 0;
  if (!D) {
    const N = new M(0, 0, 1), Z = e.getScene().activeCamera, y = M.TransformCoordinates(N, Z.getWorldMatrix());
    D = Z.globalPosition.subtract(y);
  }
  const I = -Math.atan2(D.z, D.x) - Math.PI / 2, o = Math.sqrt(D.x * D.x + D.z * D.z), g = Math.atan2(D.y, o), l = new j();
  l.indices = [], l.positions = [], l.normals = [], l.uvs = [], l.matricesIndices = a ? [] : null, l.matricesWeights = a ? [] : null, l.matricesIndicesExtra = r ? [] : null, l.matricesWeightsExtra = v ? [] : null;
  let B = 0;
  const V = (N, Z) => {
    const y = new Ae();
    if (!c || !h || !m)
      return y;
    const T = c[N];
    if (y.vertexIdx = T * 3, y.vertexIdxForBones = T * 4, y.position = new M(h[T * 3], h[T * 3 + 1], h[T * 3 + 2]), M.TransformCoordinatesToRef(y.position, Z, y.position), y.normal = new M(m[T * 3], m[T * 3 + 1], m[T * 3 + 2]), M.TransformNormalToRef(y.normal, Z, y.normal), t.captureUVS && C) {
      const s = C[T * 2 + 1];
      y.uv = new me(C[T * 2], se.UseOpenGLOrientationForUV ? 1 - s : s);
    }
    return y;
  }, P = [0, 0, 0, 0], U = (N, Z) => {
    if (N.length === 0)
      return N;
    const y = 0.5 * Math.abs(M.Dot(L, Z)), T = (d, _, S, w) => {
      for (let G = 0; G < w; ++G)
        if (d[S + G] === _)
          return S + G;
      return -1;
    }, s = (d, _) => {
      const S = M.GetClipFactor(d.position, _.position, Z, y);
      let w = P, G = P;
      if (f && b) {
        const fe = d.matrixIndicesOverride ? 0 : d.vertexIdxForBones, Ve = d.matrixIndicesOverride ?? f, We = d.matrixWeightsOverride ?? b, Pe = _.matrixIndicesOverride ? 0 : _.vertexIdxForBones, Ge = _.matrixIndicesOverride ?? f, Ze = _.matrixWeightsOverride ?? b;
        w = [0, 0, 0, 0], G = [0, 0, 0, 0];
        let he = 0;
        for (let oe = 0; oe < 4; ++oe)
          if (We[fe + oe] > 0) {
            const xe = T(Ge, Ve[fe + oe], Pe, 4);
            w[he] = Ve[fe + oe], G[he] = pe.Lerp(We[fe + oe], xe >= 0 ? Ze[xe] : 0, S), he++;
          }
        for (let oe = 0; oe < 4 && he < 4; ++oe) {
          const xe = Ge[Pe + oe];
          T(Ve, xe, fe, 4) === -1 && (w[he] = xe, G[he] = pe.Lerp(0, Ze[Pe + oe], S), he++);
        }
        const Oe = G[0] + G[1] + G[2] + G[3];
        G[0] /= Oe, G[1] /= Oe, G[2] /= Oe, G[3] /= Oe;
      }
      const q = d.localPositionOverride ? d.localPositionOverride[0] : A?.[d.vertexIdx] ?? 0, ee = d.localPositionOverride ? d.localPositionOverride[1] : A?.[d.vertexIdx + 1] ?? 0, ie = d.localPositionOverride ? d.localPositionOverride[2] : A?.[d.vertexIdx + 2] ?? 0, re = _.localPositionOverride ? _.localPositionOverride[0] : A?.[_.vertexIdx] ?? 0, R = _.localPositionOverride ? _.localPositionOverride[1] : A?.[_.vertexIdx + 1] ?? 0, K = _.localPositionOverride ? _.localPositionOverride[2] : A?.[_.vertexIdx + 2] ?? 0, $ = d.localNormalOverride ? d.localNormalOverride[0] : F?.[d.vertexIdx] ?? 0, ae = d.localNormalOverride ? d.localNormalOverride[1] : F?.[d.vertexIdx + 1] ?? 0, ce = d.localNormalOverride ? d.localNormalOverride[2] : F?.[d.vertexIdx + 2] ?? 0, ye = _.localNormalOverride ? _.localNormalOverride[0] : F?.[_.vertexIdx] ?? 0, ue = _.localNormalOverride ? _.localNormalOverride[1] : F?.[_.vertexIdx + 1] ?? 0, tt = _.localNormalOverride ? _.localNormalOverride[2] : F?.[_.vertexIdx + 2] ?? 0, De = $ + (ye - $) * S, _e = ae + (ue - ae) * S, Fe = ce + (tt - ce) * S, Ce = Math.sqrt(De * De + _e * _e + Fe * Fe);
      return new Ae(M.Lerp(d.position, _.position, S), M.Lerp(d.normal, _.normal, S).normalize(), me.Lerp(d.uv, _.uv, S), -1, -1, A ? [
        q + (re - q) * S,
        ee + (R - ee) * S,
        ie + (K - ie) * S
      ] : null, F ? [De / Ce, _e / Ce, Fe / Ce] : null, w, G);
    };
    let i = null;
    N.length > 3 && (i = []);
    for (let d = 0; d < N.length; d += 3) {
      let _ = 0, S = null, w = null, G = null, q = null;
      const ee = M.Dot(N[d].position, Z) - y, ie = M.Dot(N[d + 1].position, Z) - y, re = M.Dot(N[d + 2].position, Z) - y, R = ee > 0, K = ie > 0, $ = re > 0;
      switch (_ = (R ? 1 : 0) + (K ? 1 : 0) + ($ ? 1 : 0), _) {
        case 0:
          N.length > 3 ? (i.push(N[d]), i.push(N[d + 1]), i.push(N[d + 2])) : i = N;
          break;
        case 1:
          if (i = i ?? new Array(), R && (S = N[d + 1], w = N[d + 2], G = s(N[d], S), q = s(N[d], w)), K) {
            S = N[d], w = N[d + 2], G = s(N[d + 1], S), q = s(N[d + 1], w), i.push(G), i.push(w.clone()), i.push(S.clone()), i.push(w.clone()), i.push(G.clone()), i.push(q);
            break;
          }
          $ && (S = N[d], w = N[d + 1], G = s(N[d + 2], S), q = s(N[d + 2], w)), S && w && G && q && (i.push(S.clone()), i.push(w.clone()), i.push(G), i.push(q), i.push(G.clone()), i.push(w.clone()));
          break;
        case 2:
          i = i ?? new Array(), R || (S = N[d].clone(), w = s(S, N[d + 1]), G = s(S, N[d + 2]), i.push(S), i.push(w), i.push(G)), K || (S = N[d + 1].clone(), w = s(S, N[d + 2]), G = s(S, N[d]), i.push(S), i.push(w), i.push(G)), $ || (S = N[d + 2].clone(), w = s(S, N[d]), G = s(S, N[d + 1]), i.push(S), i.push(w), i.push(G));
          break;
      }
    }
    return i;
  }, z = e instanceof O ? e : null, W = z?._thinInstanceDataStorage.matrixData, k = z?.thinInstanceCount || 1, Y = de.Matrix[0];
  Y.copyFrom(ne.IdentityReadOnly);
  for (let N = 0; N < k; ++N) {
    if (z?.hasThinInstances && W) {
      const d = N * 16;
      Y.setRowFromFloats(0, W[d + 0], W[d + 1], W[d + 2], W[d + 3]), Y.setRowFromFloats(1, W[d + 4], W[d + 5], W[d + 6], W[d + 7]), Y.setRowFromFloats(2, W[d + 8], W[d + 9], W[d + 10], W[d + 11]), Y.setRowFromFloats(3, W[d + 12], W[d + 13], W[d + 14], W[d + 15]);
    }
    const Z = ne.RotationYawPitchRoll(I, g, E).multiply(ne.Translation(p.x, p.y, p.z)), y = ne.Invert(Z), T = e.getWorldMatrix(), s = Y.multiply(T).multiply(y), i = new Array(3);
    for (let d = 0; d < c.length; d += 3) {
      let _ = i;
      if (_[0] = V(d, s), x && n ? (_[1] = V(d + 2, s), _[2] = V(d + 1, s)) : (_[1] = V(d + 1, s), _[2] = V(d + 2, s)), !(t.cullBackFaces && -_[0].normal.z <= 0 && -_[1].normal.z <= 0 && -_[2].normal.z <= 0) && (_ = U(_, pt), !!_ && (_ = U(_, At), !!_ && (_ = U(_, bt), !!_ && (_ = U(_, Tt), !!_ && (_ = U(_, vt), !!_ && (_ = U(_, It), !!_)))))))
        for (let S = 0; S < _.length; S++) {
          const w = _[S];
          if (l.indices.push(B), n ? (w.localPositionOverride ? (l.positions[B * 3] = w.localPositionOverride[0], l.positions[B * 3 + 1] = w.localPositionOverride[1], l.positions[B * 3 + 2] = w.localPositionOverride[2]) : A && (l.positions[B * 3] = A[w.vertexIdx], l.positions[B * 3 + 1] = A[w.vertexIdx + 1], l.positions[B * 3 + 2] = A[w.vertexIdx + 2]), w.localNormalOverride ? (l.normals[B * 3] = w.localNormalOverride[0], l.normals[B * 3 + 1] = w.localNormalOverride[1], l.normals[B * 3 + 2] = w.localNormalOverride[2]) : F && (l.normals[B * 3] = F[w.vertexIdx], l.normals[B * 3 + 1] = F[w.vertexIdx + 1], l.normals[B * 3 + 2] = F[w.vertexIdx + 2])) : (w.position.toArray(l.positions, B * 3), w.normal.toArray(l.normals, B * 3)), l.matricesIndices && l.matricesWeights && (w.matrixIndicesOverride ? (l.matricesIndices[B * 4] = w.matrixIndicesOverride[0], l.matricesIndices[B * 4 + 1] = w.matrixIndicesOverride[1], l.matricesIndices[B * 4 + 2] = w.matrixIndicesOverride[2], l.matricesIndices[B * 4 + 3] = w.matrixIndicesOverride[3]) : (f && (l.matricesIndices[B * 4] = f[w.vertexIdxForBones], l.matricesIndices[B * 4 + 1] = f[w.vertexIdxForBones + 1], l.matricesIndices[B * 4 + 2] = f[w.vertexIdxForBones + 2], l.matricesIndices[B * 4 + 3] = f[w.vertexIdxForBones + 3]), r && l.matricesIndicesExtra && (l.matricesIndicesExtra[B * 4] = r[w.vertexIdxForBones], l.matricesIndicesExtra[B * 4 + 1] = r[w.vertexIdxForBones + 1], l.matricesIndicesExtra[B * 4 + 2] = r[w.vertexIdxForBones + 2], l.matricesIndicesExtra[B * 4 + 3] = r[w.vertexIdxForBones + 3])), w.matrixWeightsOverride ? (l.matricesWeights[B * 4] = w.matrixWeightsOverride[0], l.matricesWeights[B * 4 + 1] = w.matrixWeightsOverride[1], l.matricesWeights[B * 4 + 2] = w.matrixWeightsOverride[2], l.matricesWeights[B * 4 + 3] = w.matrixWeightsOverride[3]) : (b && (l.matricesWeights[B * 4] = b[w.vertexIdxForBones], l.matricesWeights[B * 4 + 1] = b[w.vertexIdxForBones + 1], l.matricesWeights[B * 4 + 2] = b[w.vertexIdxForBones + 2], l.matricesWeights[B * 4 + 3] = b[w.vertexIdxForBones + 3]), v && l.matricesWeightsExtra && (l.matricesWeightsExtra[B * 4] = v[w.vertexIdxForBones], l.matricesWeightsExtra[B * 4 + 1] = v[w.vertexIdxForBones + 1], l.matricesWeightsExtra[B * 4 + 2] = v[w.vertexIdxForBones + 2], l.matricesWeightsExtra[B * 4 + 3] = v[w.vertexIdxForBones + 3]))), t.captureUVS)
            w.uv.toArray(l.uvs, B * 2);
          else {
            l.uvs.push(0.5 + w.position.x / L.x);
            const G = 0.5 + w.position.y / L.y;
            l.uvs.push(se.UseOpenGLOrientationForUV ? 1 - G : G);
          }
          B++;
        }
    }
  }
  l.indices.length === 0 && (l.indices = null), l.positions.length === 0 && (l.positions = null), l.normals.length === 0 && (l.normals = null), l.uvs.length === 0 && (l.uvs = null), l.matricesIndices?.length === 0 && (l.matricesIndices = null), l.matricesWeights?.length === 0 && (l.matricesWeights = null), l.matricesIndicesExtra?.length === 0 && (l.matricesIndicesExtra = null), l.matricesWeightsExtra?.length === 0 && (l.matricesWeightsExtra = null);
  const X = new O(u, e.getScene());
  return l.applyToMesh(X), n ? (X.skeleton = e.skeleton, X.parent = e) : (X.position = p.clone(), X.rotation = new M(g, I, E)), X.computeWorldMatrix(!0), X.refreshBoundingInfo(!0, !0), X;
}
const Kt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateDecal: Ne
};
O.CreateDecal = (u, e, t, a, n, x) => Ne(u, e, {
  position: t,
  normal: a,
  size: n,
  angle: x
});
function $e(u = {
  subdivisions: 2,
  tessellation: 16,
  height: 1,
  radius: 0.25,
  capSubdivisions: 6
}) {
  const e = Math.max(u.subdivisions ? u.subdivisions : 2, 1) | 0, t = Math.max(u.tessellation ? u.tessellation : 16, 3) | 0, a = Math.max(u.height ? u.height : 1, 0), n = Math.max(u.radius ? u.radius : 0.25, 0), x = Math.max(u.capSubdivisions ? u.capSubdivisions : 6, 1) | 0, c = t, h = e, m = Math.max(u.radiusTop ? u.radiusTop : n, 0), A = Math.max(u.radiusBottom ? u.radiusBottom : n, 0), F = a - (m + A), C = 0, f = 2 * Math.PI, b = Math.max(u.topCapSubdivisions ? u.topCapSubdivisions : x, 1), r = Math.max(u.bottomCapSubdivisions ? u.bottomCapSubdivisions : x, 1), v = Math.acos((A - m) / a);
  let p = [];
  const D = [], L = [], E = [];
  let I = 0;
  const o = [], g = F * 0.5, l = Math.PI * 0.5;
  let B, V;
  const P = M.Zero(), U = M.Zero(), z = Math.cos(v), W = Math.sin(v), k = new me(m * W, g + m * z).subtract(new me(A * W, -g + A * z)).length(), Y = m * v + k + A * (l - v);
  let X = 0;
  for (V = 0; V <= b; V++) {
    const T = [], s = l - v * (V / b);
    X += m * v / b;
    const i = Math.cos(s), d = Math.sin(s), _ = i * m;
    for (B = 0; B <= c; B++) {
      const S = B / c, w = S * f + C, G = Math.sin(w), q = Math.cos(w);
      U.x = _ * G, U.y = g + d * m, U.z = _ * q, D.push(U.x, U.y, U.z), P.set(i * G, d, i * q), L.push(P.x, P.y, P.z), E.push(S, se.UseOpenGLOrientationForUV ? X / Y : 1 - X / Y), T.push(I), I++;
    }
    o.push(T);
  }
  const N = a - m - A + z * m - z * A, Z = W * (A - m) / N;
  for (V = 1; V <= h; V++) {
    const T = [];
    X += k / h;
    const s = W * (V * (A - m) / h + m);
    for (B = 0; B <= c; B++) {
      const i = B / c, d = i * f + C, _ = Math.sin(d), S = Math.cos(d);
      U.x = s * _, U.y = g + z * m - V * N / h, U.z = s * S, D.push(U.x, U.y, U.z), P.set(_, Z, S).normalize(), L.push(P.x, P.y, P.z), E.push(i, se.UseOpenGLOrientationForUV ? X / Y : 1 - X / Y), T.push(I), I++;
    }
    o.push(T);
  }
  for (V = 1; V <= r; V++) {
    const T = [], s = l - v - (Math.PI - v) * (V / r);
    X += A * v / r;
    const i = Math.cos(s), d = Math.sin(s), _ = i * A;
    for (B = 0; B <= c; B++) {
      const S = B / c, w = S * f + C, G = Math.sin(w), q = Math.cos(w);
      U.x = _ * G, U.y = -g + d * A, U.z = _ * q, D.push(U.x, U.y, U.z), P.set(i * G, d, i * q), L.push(P.x, P.y, P.z), E.push(S, se.UseOpenGLOrientationForUV ? X / Y : 1 - X / Y), T.push(I), I++;
    }
    o.push(T);
  }
  for (B = 0; B < c; B++)
    for (V = 0; V < b + h + r; V++) {
      const T = o[V][B], s = o[V + 1][B], i = o[V + 1][B + 1], d = o[V][B + 1];
      p.push(T), p.push(s), p.push(d), p.push(s), p.push(i), p.push(d);
    }
  if (p = p.reverse(), u.orientation && !u.orientation.equals(M.Up())) {
    const T = new ne();
    u.orientation.clone().scale(Math.PI * 0.5).cross(M.Up()).toQuaternion().toRotationMatrix(T);
    const s = M.Zero();
    for (let i = 0; i < D.length; i += 3)
      s.set(D[i], D[i + 1], D[i + 2]), M.TransformCoordinatesToRef(s.clone(), T, s), D[i] = s.x, D[i + 1] = s.y, D[i + 2] = s.z;
  }
  const y = new j();
  return y.positions = D, y.normals = L, y.uvs = E, y.indices = p, y;
}
function Se(u, e = {
  orientation: M.Up(),
  subdivisions: 2,
  tessellation: 16,
  height: 1,
  radius: 0.25,
  capSubdivisions: 6,
  updatable: !1
}, t = null) {
  const a = new O(u, t);
  return $e(e).applyToMesh(a, e.updatable), a;
}
const jt = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateCapsule: Se
};
O.CreateCapsule = (u, e, t) => Se(u, e, t);
j.CreateCapsule = $e;
class H {
  /**
   * Creates a new isovector from the given x and y coordinates
   * @param x defines the first coordinate, must be an integer
   * @param y defines the second coordinate, must be an integer
   */
  constructor(e = 0, t = 0) {
    this.x = e, this.y = t, e !== Math.floor(e) && te.Warn("x is not an integer, floor(x) used"), t !== Math.floor(t) && te.Warn("y is not an integer, floor(y) used");
  }
  // Operators
  /**
   * Gets a new IsoVector copied from the IsoVector
   * @returns a new IsoVector
   */
  clone() {
    return new H(this.x, this.y);
  }
  /**
   * Rotates one IsoVector 60 degrees counter clockwise about another
   * Please note that this is an in place operation
   * @param other an IsoVector a center of rotation
   * @returns the rotated IsoVector
   */
  rotate60About(e) {
    const t = this.x;
    return this.x = e.x + e.y - this.y, this.y = t + this.y - e.x, this;
  }
  /**
   * Rotates one IsoVector 60 degrees clockwise about another
   * Please note that this is an in place operation
   * @param other an IsoVector as center of rotation
   * @returns the rotated IsoVector
   */
  rotateNeg60About(e) {
    const t = this.x;
    return this.x = t + this.y - e.y, this.y = e.x + e.y - t, this;
  }
  /**
   * For an equilateral triangle OAB with O at isovector (0, 0) and A at isovector (m, n)
   * Rotates one IsoVector 120 degrees counter clockwise about the center of the triangle
   * Please note that this is an in place operation
   * @param m integer a measure a Primary triangle of order (m, n) m > n
   * @param n >= 0 integer a measure for a Primary triangle of order (m, n)
   * @returns the rotated IsoVector
   */
  rotate120(e, t) {
    e !== Math.floor(e) && te.Warn("m not an integer only floor(m) used"), t !== Math.floor(t) && te.Warn("n not an integer only floor(n) used");
    const a = this.x;
    return this.x = e - a - this.y, this.y = t + a, this;
  }
  /**
   * For an equilateral triangle OAB with O at isovector (0, 0) and A at isovector (m, n)
   * Rotates one IsoVector 120 degrees clockwise about the center of the triangle
   * Please note that this is an in place operation
   * @param m integer a measure a Primary triangle of order (m, n) m > n
   * @param n >= 0 integer a measure for a Primary triangle of order (m, n)
   * @returns the rotated IsoVector
   */
  rotateNeg120(e, t) {
    e !== Math.floor(e) && te.Warn("m is not an integer, floor(m) used"), t !== Math.floor(t) && te.Warn("n is not an integer,   floor(n) used");
    const a = this.x;
    return this.x = this.y - t, this.y = e + t - a - this.y, this;
  }
  /**
   * Transforms an IsoVector to one in Cartesian 3D space based on an isovector
   * @param origin an IsoVector
   * @param isoGridSize
   * @returns Point as a Vector3
   */
  toCartesianOrigin(e, t) {
    const a = M.Zero();
    return a.x = e.x + 2 * this.x * t + this.y * t, a.y = e.y + Math.sqrt(3) * this.y * t, a;
  }
  // Statics
  /**
   * Gets a new IsoVector(0, 0)
   * @returns a new IsoVector
   */
  static Zero() {
    return new H(0, 0);
  }
}
class et {
  constructor() {
    this.cartesian = [], this.vertices = [], this.max = [], this.min = [], this.closestTo = [], this.innerFacets = [], this.isoVecsABOB = [], this.isoVecsOBOA = [], this.isoVecsBAOA = [], this.vertexTypes = [], this.IDATA = new Le("icosahedron", "Regular", [
      [0, J, -1],
      [-J, 1, 0],
      [-1, 0, -J],
      [1, 0, -J],
      [J, 1, 0],
      [0, J, 1],
      [-1, 0, J],
      [-J, -1, 0],
      [0, -J, -1],
      [J, -1, 0],
      [1, 0, J],
      [0, -J, 1]
    ], [
      [0, 2, 1],
      [0, 3, 2],
      [0, 4, 3],
      [0, 5, 4],
      [0, 1, 5],
      [7, 6, 1],
      [8, 7, 2],
      [9, 8, 3],
      [10, 9, 4],
      [6, 10, 5],
      [2, 7, 1],
      [3, 8, 2],
      [4, 9, 3],
      [5, 10, 4],
      [1, 6, 5],
      [11, 6, 7],
      [11, 7, 8],
      [11, 8, 9],
      [11, 9, 10],
      [11, 10, 6]
    ]);
  }
  /**
   * Creates the PrimaryIsoTriangle Triangle OAB
   * @param m an integer
   * @param n an integer
   */
  //operators
  setIndices() {
    let e = 12;
    const t = {}, a = this.m, n = this.n;
    let x = a, c = 1, h = 0;
    n !== 0 && (x = pe.HCF(a, n)), c = a / x, h = n / x;
    let m, A, F, C, f;
    const b = H.Zero(), r = new H(a, n), v = new H(-n, a + n), p = H.Zero(), D = H.Zero(), L = H.Zero();
    let E = [], I, o, g, l;
    const B = [], V = this.vertByDist, P = (U, z, W, k) => {
      I = U + "|" + W, o = z + "|" + k, I in t || o in t ? I in t && !(o in t) ? t[o] = t[I] : o in t && !(I in t) && (t[I] = t[o]) : (t[I] = e, t[o] = e, e++), V[W][0] > 2 ? B[t[I]] = [-V[W][0], V[W][1], t[I]] : B[t[I]] = [E[V[W][0]], V[W][1], t[I]];
    };
    this.IDATA.edgematch = [
      [1, "B"],
      [2, "B"],
      [3, "B"],
      [4, "B"],
      [0, "B"],
      [10, "O", 14, "A"],
      [11, "O", 10, "A"],
      [12, "O", 11, "A"],
      [13, "O", 12, "A"],
      [14, "O", 13, "A"],
      [0, "O"],
      [1, "O"],
      [2, "O"],
      [3, "O"],
      [4, "O"],
      [19, "B", 5, "A"],
      [15, "B", 6, "A"],
      [16, "B", 7, "A"],
      [17, "B", 8, "A"],
      [18, "B", 9, "A"]
    ];
    for (let U = 0; U < 20; U++) {
      if (E = this.IDATA.face[U], F = E[2], C = E[1], f = E[0], g = b.x + "|" + b.y, I = U + "|" + g, I in t || (t[I] = F, B[F] = [E[V[g][0]], V[g][1]]), g = r.x + "|" + r.y, I = U + "|" + g, I in t || (t[I] = C, B[C] = [E[V[g][0]], V[g][1]]), g = v.x + "|" + v.y, I = U + "|" + g, I in t || (t[I] = f, B[f] = [E[V[g][0]], V[g][1]]), m = this.IDATA.edgematch[U][0], A = this.IDATA.edgematch[U][1], A === "B")
        for (let z = 1; z < x; z++)
          D.x = a - z * (c + h), D.y = n + z * c, L.x = -z * h, L.y = z * (c + h), g = D.x + "|" + D.y, l = L.x + "|" + L.y, P(U, m, g, l);
      if (A === "O")
        for (let z = 1; z < x; z++)
          L.x = -z * h, L.y = z * (c + h), p.x = z * c, p.y = z * h, g = L.x + "|" + L.y, l = p.x + "|" + p.y, P(U, m, g, l);
      if (m = this.IDATA.edgematch[U][2], A = this.IDATA.edgematch[U][3], A && A === "A")
        for (let z = 1; z < x; z++)
          p.x = z * c, p.y = z * h, D.x = a - (x - z) * (c + h), D.y = n + (x - z) * c, g = p.x + "|" + p.y, l = D.x + "|" + D.y, P(U, m, g, l);
      for (let z = 0; z < this.vertices.length; z++)
        g = this.vertices[z].x + "|" + this.vertices[z].y, I = U + "|" + g, I in t || (t[I] = e++, V[g][0] > 2 ? B[t[I]] = [-V[g][0], V[g][1], t[I]] : B[t[I]] = [E[V[g][0]], V[g][1], t[I]]);
    }
    this.closestTo = B, this.vecToidx = t;
  }
  calcCoeffs() {
    const e = this.m, t = this.n, a = Math.sqrt(3) / 3, n = e * e + t * t + e * t;
    this.coau = (e + t) / n, this.cobu = -t / n, this.coav = -a * (e - t) / n, this.cobv = a * (2 * e + t) / n;
  }
  createInnerFacets() {
    const e = this.m, t = this.n;
    for (let a = 0; a < t + e + 1; a++)
      for (let n = this.min[a]; n < this.max[a] + 1; n++)
        n < this.max[a] && n < this.max[a + 1] + 1 && this.innerFacets.push(["|" + n + "|" + a, "|" + n + "|" + (a + 1), "|" + (n + 1) + "|" + a]), a > 0 && n < this.max[a - 1] && n + 1 < this.max[a] + 1 && this.innerFacets.push(["|" + n + "|" + a, "|" + (n + 1) + "|" + a, "|" + (n + 1) + "|" + (a - 1)]);
  }
  edgeVecsABOB() {
    const e = this.m, t = this.n, a = new H(-t, e + t);
    for (let n = 1; n < e + t; n++) {
      const x = new H(this.min[n], n), c = new H(this.min[n - 1], n - 1), h = new H(this.min[n + 1], n + 1), m = x.clone(), A = c.clone(), F = h.clone();
      m.rotate60About(a), A.rotate60About(a), F.rotate60About(a);
      const C = new H(this.max[m.y], m.y), f = new H(this.max[m.y - 1], m.y - 1), b = new H(this.max[m.y - 1] - 1, m.y - 1);
      (m.x !== C.x || m.y !== C.y) && (m.x !== f.x ? (this.vertexTypes.push([1, 0, 0]), this.isoVecsABOB.push([x, f, b]), this.vertexTypes.push([1, 0, 0]), this.isoVecsABOB.push([x, b, C])) : m.y === F.y ? (this.vertexTypes.push([1, 1, 0]), this.isoVecsABOB.push([x, c, f]), this.vertexTypes.push([1, 0, 1]), this.isoVecsABOB.push([x, f, h])) : (this.vertexTypes.push([1, 1, 0]), this.isoVecsABOB.push([x, c, f]), this.vertexTypes.push([1, 0, 0]), this.isoVecsABOB.push([x, f, C])));
    }
  }
  mapABOBtoOBOA() {
    const e = new H(0, 0);
    for (let t = 0; t < this.isoVecsABOB.length; t++) {
      const a = [];
      for (let n = 0; n < 3; n++)
        e.x = this.isoVecsABOB[t][n].x, e.y = this.isoVecsABOB[t][n].y, this.vertexTypes[t][n] === 0 && e.rotateNeg120(this.m, this.n), a.push(e.clone());
      this.isoVecsOBOA.push(a);
    }
  }
  mapABOBtoBAOA() {
    const e = new H(0, 0);
    for (let t = 0; t < this.isoVecsABOB.length; t++) {
      const a = [];
      for (let n = 0; n < 3; n++)
        e.x = this.isoVecsABOB[t][n].x, e.y = this.isoVecsABOB[t][n].y, this.vertexTypes[t][n] === 1 && e.rotate120(this.m, this.n), a.push(e.clone());
      this.isoVecsBAOA.push(a);
    }
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  MapToFace(e, t) {
    const a = this.IDATA.face[e], n = a[2], x = a[1], c = a[0], h = M.FromArray(this.IDATA.vertex[n]), m = M.FromArray(this.IDATA.vertex[x]), A = M.FromArray(this.IDATA.vertex[c]), F = m.subtract(h), C = A.subtract(h), f = F.scale(this.coau).add(C.scale(this.cobu)), b = F.scale(this.coav).add(C.scale(this.cobv));
    let r, v = de.Vector3[0];
    for (let p = 0; p < this.cartesian.length; p++)
      v = f.scale(this.cartesian[p].x).add(b.scale(this.cartesian[p].y)).add(h), v.x, v.y, v.z, r = e + "|" + this.vertices[p].x + "|" + this.vertices[p].y, t.vertex[this.vecToidx[r]] = [v.x, v.y, v.z];
  }
  //statics
  /**Creates a primary triangle
   * @internal
   */
  build(e, t) {
    const a = [], n = H.Zero(), x = new H(e, t), c = new H(-t, e + t);
    a.push(n, x, c);
    for (let o = t; o < e + 1; o++)
      for (let g = 0; g < e + 1 - o; g++)
        a.push(new H(g, o));
    if (t > 0) {
      const o = pe.HCF(e, t), g = e / o, l = t / o;
      for (let V = 1; V < o; V++)
        a.push(new H(V * g, V * l)), a.push(new H(-V * l, V * (g + l))), a.push(new H(e - V * (g + l), t + V * g));
      const B = e / t;
      for (let V = 1; V < t; V++)
        for (let P = 0; P < V * B; P++)
          a.push(new H(P, V)), a.push(new H(P, V).rotate120(e, t)), a.push(new H(P, V).rotateNeg120(e, t));
    }
    a.sort((o, g) => o.x - g.x), a.sort((o, g) => o.y - g.y);
    const h = new Array(e + t + 1), m = new Array(e + t + 1);
    for (let o = 0; o < h.length; o++)
      h[o] = 1 / 0, m[o] = -1 / 0;
    let A = 0, F = 0;
    const C = a.length;
    for (let o = 0; o < C; o++)
      F = a[o].x, A = a[o].y, h[A] = Math.min(F, h[A]), m[A] = Math.max(F, m[A]);
    const f = (o, g) => {
      const l = o.clone();
      return g === "A" && l.rotateNeg120(e, t), g === "B" && l.rotate120(e, t), l.x < 0 ? l.y : l.x + l.y;
    }, b = [], r = [], v = [], p = [], D = {}, L = [];
    let E = -1, I = -1;
    for (let o = 0; o < C; o++)
      b[o] = a[o].toCartesianOrigin(new H(0, 0), 0.5), r[o] = f(a[o], "O"), v[o] = f(a[o], "A"), p[o] = f(a[o], "B"), r[o] === v[o] && v[o] === p[o] ? (E = 3, I = r[o]) : r[o] === v[o] ? (E = 4, I = r[o]) : v[o] === p[o] ? (E = 5, I = v[o]) : p[o] === r[o] && (E = 6, I = r[o]), r[o] < v[o] && r[o] < p[o] && (E = 2, I = r[o]), v[o] < r[o] && v[o] < p[o] && (E = 1, I = v[o]), p[o] < v[o] && p[o] < r[o] && (E = 0, I = p[o]), L.push([E, I, a[o].x, a[o].y]);
    L.sort((o, g) => o[2] - g[2]), L.sort((o, g) => o[3] - g[3]), L.sort((o, g) => o[1] - g[1]), L.sort((o, g) => o[0] - g[0]);
    for (let o = 0; o < L.length; o++)
      D[L[o][2] + "|" + L[o][3]] = [L[o][0], L[o][1], o];
    return this.m = e, this.n = t, this.vertices = a, this.vertByDist = D, this.cartesian = b, this.min = h, this.max = m, this;
  }
}
class Le {
  constructor(e, t, a, n) {
    this.name = e, this.category = t, this.vertex = a, this.face = n;
  }
}
class ve extends Le {
  /**
   * @internal
   */
  innerToData(e, t) {
    for (let a = 0; a < t.innerFacets.length; a++)
      this.face.push(t.innerFacets[a].map((n) => t.vecToidx[e + n]));
  }
  /**
   * @internal
   */
  mapABOBtoDATA(e, t) {
    const a = t.IDATA.edgematch[e][0];
    for (let n = 0; n < t.isoVecsABOB.length; n++) {
      const x = [];
      for (let c = 0; c < 3; c++)
        t.vertexTypes[n][c] === 0 ? x.push(e + "|" + t.isoVecsABOB[n][c].x + "|" + t.isoVecsABOB[n][c].y) : x.push(a + "|" + t.isoVecsABOB[n][c].x + "|" + t.isoVecsABOB[n][c].y);
      this.face.push([t.vecToidx[x[0]], t.vecToidx[x[1]], t.vecToidx[x[2]]]);
    }
  }
  /**
   * @internal
   */
  mapOBOAtoDATA(e, t) {
    const a = t.IDATA.edgematch[e][0];
    for (let n = 0; n < t.isoVecsOBOA.length; n++) {
      const x = [];
      for (let c = 0; c < 3; c++)
        t.vertexTypes[n][c] === 1 ? x.push(e + "|" + t.isoVecsOBOA[n][c].x + "|" + t.isoVecsOBOA[n][c].y) : x.push(a + "|" + t.isoVecsOBOA[n][c].x + "|" + t.isoVecsOBOA[n][c].y);
      this.face.push([t.vecToidx[x[0]], t.vecToidx[x[1]], t.vecToidx[x[2]]]);
    }
  }
  /**
   * @internal
   */
  mapBAOAtoDATA(e, t) {
    const a = t.IDATA.edgematch[e][2];
    for (let n = 0; n < t.isoVecsBAOA.length; n++) {
      const x = [];
      for (let c = 0; c < 3; c++)
        t.vertexTypes[n][c] === 1 ? x.push(e + "|" + t.isoVecsBAOA[n][c].x + "|" + t.isoVecsBAOA[n][c].y) : x.push(a + "|" + t.isoVecsBAOA[n][c].x + "|" + t.isoVecsBAOA[n][c].y);
      this.face.push([t.vecToidx[x[0]], t.vecToidx[x[1]], t.vecToidx[x[2]]]);
    }
  }
  /**
   * @internal
   */
  orderData(e) {
    const t = [];
    for (let c = 0; c < 13; c++)
      t[c] = [];
    const a = e.closestTo;
    for (let c = 0; c < a.length; c++)
      a[c][0] > -1 ? a[c][1] > 0 && t[a[c][0]].push([c, a[c][1]]) : t[12].push([c, a[c][0]]);
    const n = [];
    for (let c = 0; c < 12; c++)
      n[c] = c;
    let x = 12;
    for (let c = 0; c < 12; c++) {
      t[c].sort((h, m) => h[1] - m[1]);
      for (let h = 0; h < t[c].length; h++)
        n[t[c][h][0]] = x++;
    }
    for (let c = 0; c < t[12].length; c++)
      n[t[12][c][0]] = x++;
    for (let c = 0; c < this.vertex.length; c++)
      this.vertex[c].push(n[c]);
    this.vertex.sort((c, h) => c[3] - h[3]);
    for (let c = 0; c < this.vertex.length; c++)
      this.vertex[c].pop();
    for (let c = 0; c < this.face.length; c++)
      for (let h = 0; h < this.face[c].length; h++)
        this.face[c][h] = n[this.face[c][h]];
    this.sharedNodes = t[12].length, this.poleNodes = this.vertex.length - this.sharedNodes;
  }
  /**
   * @internal
   */
  setOrder(e, t) {
    const a = [], n = [];
    let x = t.pop();
    n.push(x);
    let c = this.face[x].indexOf(e);
    c = (c + 2) % 3;
    let h = this.face[x][c];
    a.push(h);
    let m = 0;
    for (; t.length > 0; )
      x = t[m], this.face[x].indexOf(h) > -1 ? (c = (this.face[x].indexOf(h) + 1) % 3, h = this.face[x][c], a.push(h), n.push(x), t.splice(m, 1), m = 0) : m++;
    return this.adjacentFaces.push(a), n;
  }
  /**
   * @internal
   */
  toGoldbergPolyhedronData() {
    const e = new Le("GeoDual", "Goldberg", [], []);
    e.name = "GD dual";
    const t = this.vertex.length, a = new Array(t);
    for (let A = 0; A < t; A++)
      a[A] = [];
    for (let A = 0; A < this.face.length; A++)
      for (let F = 0; F < 3; F++)
        a[this.face[A][F]].push(A);
    let n = 0, x = 0, c = 0, h = [], m = [];
    this.adjacentFaces = [];
    for (let A = 0; A < a.length; A++)
      e.face[A] = this.setOrder(A, a[A].concat([])), a[A].forEach((F) => {
        n = 0, x = 0, c = 0, h = this.face[F];
        for (let C = 0; C < 3; C++)
          m = this.vertex[h[C]], n += m[0], x += m[1], c += m[2];
        e.vertex[F] = [n / 3, x / 3, c / 3];
      });
    return e;
  }
  //statics
  /**Builds the data for a Geodesic Polyhedron from a primary triangle
   * @param primTri the primary triangle
   * @internal
   */
  static BuildGeodesicData(e) {
    const t = new ve("Geodesic-m-n", "Geodesic", [
      [0, J, -1],
      [-J, 1, 0],
      [-1, 0, -J],
      [1, 0, -J],
      [J, 1, 0],
      [0, J, 1],
      [-1, 0, J],
      [-J, -1, 0],
      [0, -J, -1],
      [J, -1, 0],
      [1, 0, J],
      [0, -J, 1]
    ], []);
    e.setIndices(), e.calcCoeffs(), e.createInnerFacets(), e.edgeVecsABOB(), e.mapABOBtoOBOA(), e.mapABOBtoBAOA();
    for (let n = 0; n < e.IDATA.face.length; n++)
      e.MapToFace(n, t), t.innerToData(n, e), e.IDATA.edgematch[n][1] === "B" && t.mapABOBtoDATA(n, e), e.IDATA.edgematch[n][1] === "O" && t.mapOBOAtoDATA(n, e), e.IDATA.edgematch[n][3] === "A" && t.mapBAOAtoDATA(n, e);
    t.orderData(e);
    const a = 1;
    return t.vertex = t.vertex.map(function(n) {
      const x = n[0], c = n[1], h = n[2], m = Math.sqrt(x * x + c * c + h * h);
      return n[0] *= a / m, n[1] *= a / m, n[2] *= a / m, n;
    }), t;
  }
}
function yt(u, e, t = null) {
  let a = e.m || 1;
  a !== Math.floor(a) && te.Warn("m not an integer only floor(m) used");
  let n = e.n || 0;
  if (n !== Math.floor(n) && te.Warn("n not an integer only floor(n) used"), n > a) {
    const A = n;
    n = a, a = A, te.Warn("n > m therefore m and n swapped");
  }
  const x = new et();
  x.build(a, n);
  const h = {
    custom: ve.BuildGeodesicData(x),
    size: e.size,
    sizeX: e.sizeX,
    sizeY: e.sizeY,
    sizeZ: e.sizeZ,
    faceUV: e.faceUV,
    faceColors: e.faceColors,
    flat: e.flat,
    updatable: e.updatable,
    sideOrientation: e.sideOrientation,
    frontUVs: e.frontUVs,
    backUVs: e.backUVs
  };
  return Te(u, h, t);
}
O._GoldbergMeshParser = (u, e) => Ie.Parse(u, e);
class Ie extends O {
  constructor() {
    super(...arguments), this.goldbergData = {
      faceColors: [],
      faceCenters: [],
      faceZaxis: [],
      faceXaxis: [],
      faceYaxis: [],
      nbSharedFaces: 0,
      nbUnsharedFaces: 0,
      nbFaces: 0,
      nbFacesAtPole: 0,
      adjacentFaces: []
    };
  }
  /**
   * Gets the related Goldberg face from pole infos
   * @param poleOrShared Defines the pole index or the shared face index if the fromPole parameter is passed in
   * @param fromPole Defines an optional pole index to find the related info from
   * @returns the goldberg face number
   */
  relatedGoldbergFace(e, t) {
    return t === void 0 ? (e > this.goldbergData.nbUnsharedFaces - 1 && (te.Warn("Maximum number of unshared faces used"), e = this.goldbergData.nbUnsharedFaces - 1), this.goldbergData.nbUnsharedFaces + e) : (e > 11 && (te.Warn("Last pole used"), e = 11), t > this.goldbergData.nbFacesAtPole - 1 && (te.Warn("Maximum number of faces at a pole used"), t = this.goldbergData.nbFacesAtPole - 1), 12 + e * this.goldbergData.nbFacesAtPole + t);
  }
  _changeGoldbergFaceColors(e) {
    for (let a = 0; a < e.length; a++) {
      const n = e[a][0], x = e[a][1], c = e[a][2];
      for (let h = n; h < x + 1; h++)
        this.goldbergData.faceColors[h] = c;
    }
    const t = [];
    for (let a = 0; a < 12; a++)
      for (let n = 0; n < 5; n++)
        t.push(this.goldbergData.faceColors[a].r, this.goldbergData.faceColors[a].g, this.goldbergData.faceColors[a].b, this.goldbergData.faceColors[a].a);
    for (let a = 12; a < this.goldbergData.faceColors.length; a++)
      for (let n = 0; n < 6; n++)
        t.push(this.goldbergData.faceColors[a].r, this.goldbergData.faceColors[a].g, this.goldbergData.faceColors[a].b, this.goldbergData.faceColors[a].a);
    return t;
  }
  /**
   * Set new goldberg face colors
   * @param colorRange the new color to apply to the mesh
   */
  setGoldbergFaceColors(e) {
    const t = this._changeGoldbergFaceColors(e);
    this.setVerticesData(Q.ColorKind, t);
  }
  /**
   * Updates new goldberg face colors
   * @param colorRange the new color to apply to the mesh
   */
  updateGoldbergFaceColors(e) {
    const t = this._changeGoldbergFaceColors(e);
    this.updateVerticesData(Q.ColorKind, t);
  }
  _changeGoldbergFaceUVs(e) {
    const t = this.getVerticesData(Q.UVKind);
    for (let a = 0; a < e.length; a++) {
      const n = e[a][0], x = e[a][1], c = e[a][2], h = e[a][3], m = e[a][4], A = [], F = [];
      let C, f;
      for (let b = 0; b < 5; b++)
        C = c.x + h * Math.cos(m + b * Math.PI / 2.5), f = c.y + h * Math.sin(m + b * Math.PI / 2.5), C < 0 && (C = 0), C > 1 && (C = 1), A.push(C, f);
      for (let b = 0; b < 6; b++)
        C = c.x + h * Math.cos(m + b * Math.PI / 3), f = c.y + h * Math.sin(m + b * Math.PI / 3), C < 0 && (C = 0), C > 1 && (C = 1), F.push(C, f);
      for (let b = n; b < Math.min(12, x + 1); b++)
        for (let r = 0; r < 5; r++)
          t[10 * b + 2 * r] = A[2 * r], t[10 * b + 2 * r + 1] = A[2 * r + 1];
      for (let b = Math.max(12, n); b < x + 1; b++)
        for (let r = 0; r < 6; r++)
          t[12 * b - 24 + 2 * r] = F[2 * r], t[12 * b - 23 + 2 * r] = F[2 * r + 1];
    }
    return t;
  }
  /**
   * set new goldberg face UVs
   * @param uvRange the new UVs to apply to the mesh
   */
  setGoldbergFaceUVs(e) {
    const t = this._changeGoldbergFaceUVs(e);
    this.setVerticesData(Q.UVKind, t);
  }
  /**
   * Updates new goldberg face UVs
   * @param uvRange the new UVs to apply to the mesh
   */
  updateGoldbergFaceUVs(e) {
    const t = this._changeGoldbergFaceUVs(e);
    this.updateVerticesData(Q.UVKind, t);
  }
  /**
   * Places a mesh on a particular face of the goldberg polygon
   * @param mesh Defines the mesh to position
   * @param face Defines the face to position onto
   * @param position Defines the position relative to the face we are positioning the mesh onto
   */
  placeOnGoldbergFaceAt(e, t, a) {
    const n = M.RotationFromAxis(this.goldbergData.faceXaxis[t], this.goldbergData.faceYaxis[t], this.goldbergData.faceZaxis[t]);
    e.rotation = n, e.position = this.goldbergData.faceCenters[t].add(this.goldbergData.faceXaxis[t].scale(a.x)).add(this.goldbergData.faceYaxis[t].scale(a.y)).add(this.goldbergData.faceZaxis[t].scale(a.z));
  }
  /**
   * Serialize current mesh
   * @param serializationObject defines the object which will receive the serialization data
   */
  serialize(e) {
    super.serialize(e), e.type = "GoldbergMesh";
    const t = {};
    if (t.adjacentFaces = this.goldbergData.adjacentFaces, t.nbSharedFaces = this.goldbergData.nbSharedFaces, t.nbUnsharedFaces = this.goldbergData.nbUnsharedFaces, t.nbFaces = this.goldbergData.nbFaces, t.nbFacesAtPole = this.goldbergData.nbFacesAtPole, this.goldbergData.faceColors) {
      t.faceColors = [];
      for (const a of this.goldbergData.faceColors)
        t.faceColors.push(a.asArray());
    }
    if (this.goldbergData.faceCenters) {
      t.faceCenters = [];
      for (const a of this.goldbergData.faceCenters)
        t.faceCenters.push(a.asArray());
    }
    if (this.goldbergData.faceZaxis) {
      t.faceZaxis = [];
      for (const a of this.goldbergData.faceZaxis)
        t.faceZaxis.push(a.asArray());
    }
    if (this.goldbergData.faceYaxis) {
      t.faceYaxis = [];
      for (const a of this.goldbergData.faceYaxis)
        t.faceYaxis.push(a.asArray());
    }
    if (this.goldbergData.faceXaxis) {
      t.faceXaxis = [];
      for (const a of this.goldbergData.faceXaxis)
        t.faceXaxis.push(a.asArray());
    }
    e.goldbergData = t;
  }
  /**
   * Parses a serialized goldberg mesh
   * @param parsedMesh the serialized mesh
   * @param scene the scene to create the goldberg mesh in
   * @returns the created goldberg mesh
   */
  static Parse(e, t) {
    const a = e.goldbergData;
    a.faceColors = a.faceColors.map((x) => be.FromArray(x)), a.faceCenters = a.faceCenters.map((x) => M.FromArray(x)), a.faceZaxis = a.faceZaxis.map((x) => M.FromArray(x)), a.faceXaxis = a.faceXaxis.map((x) => M.FromArray(x)), a.faceYaxis = a.faceYaxis.map((x) => M.FromArray(x));
    const n = new Ie(e.name, t);
    return n.goldbergData = a, n;
  }
}
function Dt(u, e) {
  const t = u.size, a = u.sizeX || t || 1, n = u.sizeY || t || 1, x = u.sizeZ || t || 1, c = u.sideOrientation === 0 ? 0 : u.sideOrientation || j.DEFAULTSIDE, h = [], m = [], A = [], F = [];
  let C = 1 / 0, f = -1 / 0, b = 1 / 0, r = -1 / 0;
  for (let D = 0; D < e.vertex.length; D++)
    C = Math.min(C, e.vertex[D][0] * a), f = Math.max(f, e.vertex[D][0] * a), b = Math.min(b, e.vertex[D][1] * n), r = Math.max(r, e.vertex[D][1] * n);
  let v = 0;
  for (let D = 0; D < e.face.length; D++) {
    const L = e.face[D], E = M.FromArray(e.vertex[L[0]]), I = M.FromArray(e.vertex[L[2]]), o = M.FromArray(e.vertex[L[1]]), g = I.subtract(E), l = o.subtract(E), B = M.Cross(l, g).normalize();
    for (let V = 0; V < L.length; V++) {
      A.push(B.x, B.y, B.z);
      const P = e.vertex[L[V]];
      h.push(P[0] * a, P[1] * n, P[2] * x);
      const U = (P[1] * n - b) / (r - b);
      F.push((P[0] * a - C) / (f - C), se.UseOpenGLOrientationForUV ? 1 - U : U);
    }
    for (let V = 0; V < L.length - 2; V++)
      m.push(v, v + V + 2, v + V + 1);
    v += L.length;
  }
  j._ComputeSides(c, h, m, A, F);
  const p = new j();
  return p.positions = h, p.indices = m, p.normals = A, p.uvs = F, p;
}
function _t(u, e, t = null) {
  const a = e.size, n = e.sizeX || a || 1, x = e.sizeY || a || 1, c = e.sizeZ || a || 1;
  let h = e.m || 1;
  h !== Math.floor(h) && te.Warn("m not an integer only floor(m) used");
  let m = e.n || 0;
  if (m !== Math.floor(m) && te.Warn("n not an integer only floor(n) used"), m > h) {
    const r = m;
    m = h, h = r, te.Warn("n > m therefore m and n swapped");
  }
  const A = new et();
  A.build(h, m);
  const F = ve.BuildGeodesicData(A), C = F.toGoldbergPolyhedronData(), f = new Ie(u, t);
  e.sideOrientation = O._GetDefaultSideOrientation(e.sideOrientation), f._originalBuilderSideOrientation = e.sideOrientation, Dt(e, C).applyToMesh(f, e.updatable), f.goldbergData.nbSharedFaces = F.sharedNodes, f.goldbergData.nbUnsharedFaces = F.poleNodes, f.goldbergData.adjacentFaces = F.adjacentFaces, f.goldbergData.nbFaces = f.goldbergData.nbSharedFaces + f.goldbergData.nbUnsharedFaces, f.goldbergData.nbFacesAtPole = (f.goldbergData.nbUnsharedFaces - 12) / 12;
  for (let r = 0; r < F.vertex.length; r++)
    f.goldbergData.faceCenters.push(M.FromArray(F.vertex[r])), f.goldbergData.faceCenters[r].x *= n, f.goldbergData.faceCenters[r].y *= x, f.goldbergData.faceCenters[r].z *= c, f.goldbergData.faceColors.push(new be(1, 1, 1, 1));
  for (let r = 0; r < C.face.length; r++) {
    const v = C.face[r], p = M.FromArray(C.vertex[v[0]]), D = M.FromArray(C.vertex[v[2]]), L = M.FromArray(C.vertex[v[1]]), E = D.subtract(p), I = L.subtract(p), o = M.Cross(I, E).normalize(), g = M.Cross(I, o).normalize();
    f.goldbergData.faceXaxis.push(I.normalize()), f.goldbergData.faceYaxis.push(o), f.goldbergData.faceZaxis.push(g);
  }
  return f;
}
const Ft = {
  CreateBox: at,
  CreateTiledBox: He,
  CreateSphere: nt,
  CreateDisc: Ee,
  CreateIcoSphere: lt,
  CreateRibbon: le,
  CreateCylinder: ct,
  CreateTorus: ht,
  CreateTorusKnot: Re,
  CreateLineSystem: it,
  CreateLines: rt,
  CreateDashedLines: ot,
  ExtrudeShape: we,
  ExtrudeShapeCustom: Me,
  CreateLathe: Ue,
  CreateTiledPlane: Ke,
  CreatePlane: xt,
  CreateGround: Ot,
  CreateTiledGround: mt,
  CreateGroundFromHeightMap: gt,
  CreatePolygon: ft,
  ExtrudePolygon: ut,
  CreateTube: ze,
  CreatePolyhedron: Te,
  CreateGeodesic: yt,
  CreateGoldberg: _t,
  CreateDecal: Ne,
  CreateCapsule: Se,
  CreateText: dt
}, Ht = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MeshBuilder: Ft
}, Symbol.toStringTag, { value: "Module" }));
export {
  Xt as A,
  Ht as B,
  Se as C,
  Kt as D,
  Me as E,
  ve as G,
  kt as L,
  Ft as M,
  Yt as P,
  zt as R,
  Zt as S,
  Wt as T,
  et as _,
  Te as a,
  Ee as b,
  we as c,
  $e as d,
  Ye as e,
  jt as f,
  Ne as g,
  yt as h,
  _t as i,
  Dt as j,
  Ue as k,
  Qe as l,
  le as m,
  Xe as n,
  He as o,
  je as p,
  Ke as q,
  ge as r,
  Re as s,
  qe as t,
  ze as u,
  Nt as v,
  Ie as w,
  Le as x,
  St as y,
  Gt as z
};
//# sourceMappingURL=meshBuilder-DfVKqwDr.js.map
