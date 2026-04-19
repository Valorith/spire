import { y as h, M as D, a as O, g as b, z as k } from "./embed-entry-Bb6cfUYP.js";
import { M as T } from "./mesh-BIoKPPmW.js";
function V(e) {
  const t = [], i = [], s = [], c = [], m = e.diameter || 1, p = e.thickness || 0.5, n = (e.tessellation || 16) | 0, I = e.sideOrientation === 0 ? 0 : e.sideOrientation || h.DEFAULTSIDE, a = n + 1;
  for (let o = 0; o <= n; o++) {
    const U = o / n, g = o * Math.PI * 2 / n - Math.PI / 2, y = D.Translation(m / 2, 0, 0).multiply(D.RotationY(g));
    for (let r = 0; r <= n; r++) {
      const w = 1 - r / n, C = r * Math.PI * 2 / n + Math.PI, P = Math.cos(C), S = Math.sin(C);
      let u = new O(P, S, 0), d = u.scale(p / 2);
      const x = new b(U, w);
      d = O.TransformCoordinates(d, y), u = O.TransformNormal(u, y), i.push(d.x, d.y, d.z), s.push(u.x, u.y, u.z), c.push(x.x, k.UseOpenGLOrientationForUV ? 1 - x.y : x.y);
      const f = (o + 1) % a, M = (r + 1) % a;
      t.push(o * a + r), t.push(o * a + M), t.push(f * a + r), t.push(o * a + M), t.push(f * a + M), t.push(f * a + r);
    }
  }
  h._ComputeSides(I, i, t, s, c, e.frontUVs, e.backUVs);
  const l = new h();
  return l.indices = t, l.positions = i, l.normals = s, l.uvs = c, l;
}
function v(e, t = {}, i) {
  const s = new T(e, i);
  return t.sideOrientation = T._GetDefaultSideOrientation(t.sideOrientation), s._originalBuilderSideOrientation = t.sideOrientation, V(t).applyToMesh(s, t.updatable), s;
}
const _ = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreateTorus: v
};
h.CreateTorus = V;
T.CreateTorus = (e, t, i, s, c, m, p) => v(e, {
  diameter: t,
  thickness: i,
  tessellation: s,
  sideOrientation: p,
  updatable: m
}, c);
export {
  v as C,
  _ as T,
  V as a
};
//# sourceMappingURL=torusBuilder-f6gVR70r.js.map
