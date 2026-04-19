import { y as p, M as y, a as h, z as w } from "./embed-entry-Bb6cfUYP.js";
import { M as D } from "./mesh-BIoKPPmW.js";
function z(e) {
  const r = (e.segments || 32) | 0, n = e.diameterX || e.diameter || 1, i = e.diameterY || e.diameter || 1, u = e.diameterZ || e.diameter || 1, f = e.arc && (e.arc <= 0 || e.arc > 1) ? 1 : e.arc || 1, S = e.slice && e.slice <= 0 ? 1 : e.slice || 1, R = e.sideOrientation === 0 ? 0 : e.sideOrientation || p.DEFAULTSIDE, I = !!e.dedupTopBottomIndices, Y = new h(n / 2, i / 2, u / 2), l = 2 + r, s = 2 * l, a = [], m = [], O = [], x = [];
  for (let o = 0; o <= l; o++) {
    const C = o / l, T = C * Math.PI * S;
    for (let c = 0; c <= s; c++) {
      const t = c / s, U = t * Math.PI * 2 * f, V = y.RotationZ(-T), b = y.RotationY(U), B = h.TransformCoordinates(h.Up(), V), g = h.TransformCoordinates(B, b), Z = g.multiply(Y), v = g.divide(Y).normalize();
      m.push(Z.x, Z.y, Z.z), O.push(v.x, v.y, v.z), x.push(t, w.UseOpenGLOrientationForUV ? 1 - C : C);
    }
    if (o > 0) {
      const c = m.length / 3;
      for (let t = c - 2 * (s + 1); t + s + 2 < c; t++)
        I ? (o > 1 && (a.push(t), a.push(t + 1), a.push(t + s + 1)), (o < l || S < 1) && (a.push(t + s + 1), a.push(t + 1), a.push(t + s + 2))) : (a.push(t), a.push(t + 1), a.push(t + s + 1), a.push(t + s + 1), a.push(t + 1), a.push(t + s + 2));
    }
  }
  p._ComputeSides(R, m, a, O, x, e.frontUVs, e.backUVs);
  const d = new p();
  return d.indices = a, d.positions = m, d.normals = O, d.uvs = x, d;
}
function M(e, r = {}, n = null) {
  const i = new D(e, n);
  return r.sideOrientation = D._GetDefaultSideOrientation(r.sideOrientation), i._originalBuilderSideOrientation = r.sideOrientation, z(r).applyToMesh(i, r.updatable), i;
}
const E = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateSphere: M
};
p.CreateSphere = z;
D.CreateSphere = (e, r, n, i, u, f) => M(e, {
  segments: r,
  diameterX: n,
  diameterY: n,
  diameterZ: n,
  sideOrientation: f,
  updatable: u
}, i);
export {
  M as C,
  E as S,
  z as a
};
//# sourceMappingURL=sphereBuilder-mxnogRhh.js.map
