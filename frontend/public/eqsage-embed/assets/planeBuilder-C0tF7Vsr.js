import { M as l } from "./mesh-DeWxVt-I.js";
import { y as o, z as h } from "./embed-entry-BKE21f6Q.js";
function p(n) {
  const e = [], a = [], t = [], s = [], c = n.width || n.size || 1, O = n.height || n.size || 1, U = n.sideOrientation === 0 ? 0 : n.sideOrientation || o.DEFAULTSIDE, r = c / 2, u = O / 2;
  a.push(-r, -u, 0), t.push(0, 0, -1), s.push(0, h.UseOpenGLOrientationForUV ? 1 : 0), a.push(r, -u, 0), t.push(0, 0, -1), s.push(1, h.UseOpenGLOrientationForUV ? 1 : 0), a.push(r, u, 0), t.push(0, 0, -1), s.push(1, h.UseOpenGLOrientationForUV ? 0 : 1), a.push(-r, u, 0), t.push(0, 0, -1), s.push(0, h.UseOpenGLOrientationForUV ? 0 : 1), e.push(0), e.push(1), e.push(2), e.push(0), e.push(2), e.push(3), o._ComputeSides(U, a, e, t, s, n.frontUVs, n.backUVs);
  const i = new o();
  return i.indices = e, i.positions = a, i.normals = t, i.uvs = s, i;
}
function d(n, e = {}, a = null) {
  const t = new l(n, a);
  return e.sideOrientation = l._GetDefaultSideOrientation(e.sideOrientation), t._originalBuilderSideOrientation = e.sideOrientation, p(e).applyToMesh(t, e.updatable), e.sourcePlane && (t.translate(e.sourcePlane.normal, -e.sourcePlane.d), t.setDirection(e.sourcePlane.normal.scale(-1))), t;
}
const f = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CreatePlane: d
};
o.CreatePlane = p;
l.CreatePlane = (n, e, a, t, s) => d(n, {
  size: e,
  width: e,
  height: e,
  sideOrientation: s,
  updatable: t
}, a);
export {
  d as C,
  f as P,
  p as a
};
//# sourceMappingURL=planeBuilder-C0tF7Vsr.js.map
