import { A as l, C as m, S as h } from "./math.axis-Drk1BmmE.js";
import { a as o, g as i } from "./embed-entry-Dediijbe.js";
import { h as x, C, E as f, M as P, aq as S, Q as V, p as v, i as A, a_ as T, ag as g, v as w } from "./embed-entry-Dediijbe.js";
import { F as z } from "./math.frustum-Cz15BSNS.js";
import { A as E, b as F, B as M, C as O, O as Q, P as U, a as b } from "./math.path-5jYBkhtJ.js";
import { P as q } from "./math.plane-DqQrP67A.js";
import { S as G } from "./math.size-CalSUfXs.js";
import { V as I } from "./math.viewport-CrgurBQ6.js";
class r {
  /**
   * Creates a PositionNormalVertex
   * @param position the position of the vertex (defaut: 0,0,0)
   * @param normal the normal of the vertex (defaut: 0,1,0)
   */
  constructor(s = o.Zero(), a = o.Up()) {
    this.position = s, this.normal = a;
  }
  /**
   * Clones the PositionNormalVertex
   * @returns the cloned PositionNormalVertex
   */
  clone() {
    return new r(this.position.clone(), this.normal.clone());
  }
}
class t {
  /**
   * Creates a PositionNormalTextureVertex
   * @param position the position of the vertex (defaut: 0,0,0)
   * @param normal the normal of the vertex (defaut: 0,1,0)
   * @param uv the uv of the vertex (default: 0,0)
   */
  constructor(s = o.Zero(), a = o.Up(), e = i.Zero()) {
    this.position = s, this.normal = a, this.uv = e;
  }
  /**
   * Clones the PositionNormalTextureVertex
   * @returns the cloned PositionNormalTextureVertex
   */
  clone() {
    return new t(this.position.clone(), this.normal.clone(), this.uv.clone());
  }
}
export {
  E as Angle,
  F as Arc2,
  l as Axis,
  M as BezierCurve,
  x as Color3,
  C as Color4,
  m as Coordinate,
  O as Curve3,
  f as Epsilon,
  z as Frustum,
  P as Matrix,
  Q as Orientation,
  S as PHI,
  U as Path2,
  b as Path3D,
  q as Plane,
  t as PositionNormalTextureVertex,
  r as PositionNormalVertex,
  V as Quaternion,
  G as Size,
  h as Space,
  v as TmpColors,
  A as TmpVectors,
  T as ToGammaSpace,
  g as ToLinearSpace,
  i as Vector2,
  o as Vector3,
  w as Vector4,
  I as Viewport
};
//# sourceMappingURL=math-oJb8rtWN.js.map
