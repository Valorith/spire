import { StandardMaterial as ht } from "./standardMaterial-DtnAO-Mw.js";
import { P as _t } from "./pbrMaterial-CglnQqaf.js";
import { h as Z, a as E, V as et, i as R, g as Q, R as ct, x as st, D as k, y as J, H as M, Q as X, d as rt } from "./embed-entry-BgvWRWVI.js";
import { M as K } from "./mesh-DLjlGcQU.js";
import { P as ut } from "./scene-BUYFxCaC.js";
import { C as gt } from "./math.path-PzrWHRHK.js";
import { C as ft } from "./textBuilder-Bi6EJ-9M.js";
import { R as Y } from "./rawTexture-D2iZf32-.js";
import { E as tt } from "./engine-BUHA6kNQ.js";
import { a as dt } from "./material.detailMapConfiguration-82jhJlFu.js";
import { M as Tt } from "./imageProcessingFunctions-DgzOkxoC.js";
import { S as Ot } from "./shaderMaterial-CrWHh6_l.js";
import "./effectFallbacks-7xPE23c2.js";
class D {
}
D.DEFAULT_COLOR = Z.White();
D.DEFAULT_WIDTH_ATTENUATED = 1;
D.DEFAULT_WIDTH = 0.1;
class g {
  /**
   * Converts GreasedLinePoints to number[][]
   * @param points GreasedLinePoints
   * @returns number[][] with x, y, z coordinates of the points, like [[x, y, z, x, y, z, ...], [x, y, z, ...]]
   */
  static ConvertPoints(t) {
    if (t.length && Array.isArray(t) && typeof t[0] == "number")
      return [t];
    if (t.length && Array.isArray(t[0]) && typeof t[0][0] == "number")
      return t;
    if (t.length && !Array.isArray(t[0]) && t[0] instanceof E) {
      const e = [];
      for (let s = 0; s < t.length; s++) {
        const r = t[s];
        e.push(r.x, r.y, r.z);
      }
      return [e];
    } else if (t.length > 0 && Array.isArray(t[0]) && t[0].length > 0 && t[0][0] instanceof E) {
      const e = [];
      return t.forEach((r) => {
        e.push(r.flatMap((o) => [o.x, o.y, o.z]));
      }), e;
    } else {
      if (t instanceof Float32Array)
        return [Array.from(t)];
      if (t.length && t[0] instanceof Float32Array) {
        const e = [];
        return t.forEach((s) => {
          e.push(Array.from(s));
        }), e;
      }
    }
    return [];
  }
  /**
   * Omit zero length lines predicate for the MeshesToLines function
   * @param p1 point1 position of the face
   * @param p2 point2 position of the face
   * @param p3 point3 position of the face
   * @returns original points or null if any edge length is zero
   */
  static OmitZeroLengthPredicate(t, e, s) {
    const r = [];
    return e.subtract(t).lengthSquared() > 0 && r.push([t, e]), s.subtract(e).lengthSquared() > 0 && r.push([e, s]), t.subtract(s).lengthSquared() > 0 && r.push([s, t]), r.length === 0 ? null : r;
  }
  /**
   * Omit duplicate lines predicate for the MeshesToLines function
   * @param p1 point1 position of the face
   * @param p2 point2 position of the face
   * @param p3 point3 position of the face
   * @param points array of points to search in
   * @returns original points or null if any edge length is zero
   */
  static OmitDuplicatesPredicate(t, e, s, r) {
    const o = [];
    return g._SearchInPoints(t, e, r) || o.push([t, e]), g._SearchInPoints(e, s, r) || o.push([e, s]), g._SearchInPoints(s, t, r) || o.push([s, t]), o.length === 0 ? null : o;
  }
  static _SearchInPoints(t, e, s) {
    for (const r of s)
      for (let o = 0; o < r.length; o++)
        if (r[o]?.equals(t) && (r[o + 1]?.equals(e) || r[o - 1]?.equals(e)))
          return !0;
    return !1;
  }
  /**
   * Gets mesh triangles as line positions
   * @param meshes array of meshes
   * @param predicate predicate function which decides whether to include the mesh triangle/face in the ouput
   * @returns array of arrays of points
   */
  static MeshesToLines(t, e) {
    const s = [];
    return t.forEach((r, o) => {
      const i = r.getVerticesData(et.PositionKind), n = r.getIndices();
      if (i && n)
        for (let h = 0, _ = 0; h < n.length; h++) {
          const a = n[_++] * 3, c = n[_++] * 3, f = n[_++] * 3, u = new E(i[a], i[a + 1], i[a + 2]), d = new E(i[c], i[c + 1], i[c + 2]), C = new E(i[f], i[f + 1], i[f + 2]);
          if (e) {
            const S = e(u, d, C, s, h, a, r, o, i, n);
            if (S)
              for (const O of S)
                s.push(O);
          } else
            s.push([u, d], [d, C], [C, u]);
        }
    }), s;
  }
  /**
   * Converts number coordinates to Vector3s
   * @param points number array of x, y, z, x, y z, ... coordinates
   * @returns Vector3 array
   */
  static ToVector3Array(t) {
    if (Array.isArray(t[0])) {
      const r = [], o = t;
      for (const i of o) {
        const n = [];
        for (let h = 0; h < i.length; h += 3)
          n.push(new E(i[h], i[h + 1], i[h + 2]));
        r.push(n);
      }
      return r;
    }
    const e = t, s = [];
    for (let r = 0; r < e.length; r += 3)
      s.push(new E(e[r], e[r + 1], e[r + 2]));
    return s;
  }
  /**
   * Gets a number array from a Vector3 array.
   * You can you for example to convert your Vector3[] offsets to the required number[] for the offsets option.
   * @param points Vector3 array
   * @returns an array of x, y, z coordinates as numbers [x, y, z, x, y, z, x, y, z, ....]
   */
  static ToNumberArray(t) {
    return t.flatMap((e) => [e.x, e.y, e.z]);
  }
  /**
   * Calculates the sum of points of every line and the number of points in each line.
   * This function is useful when you are drawing multiple lines in one mesh and you want
   * to know the counts. For example for creating an offsets table.
   * @param points point array
   * @returns points count info
   */
  static GetPointsCountInfo(t) {
    const e = new Array(t.length);
    let s = 0;
    for (let r = t.length; r--; )
      e[r] = t[r].length / 3, s += e[r];
    return { total: s, counts: e };
  }
  /**
   * Gets the length of the line counting all it's segments length
   * @param data array of line points
   * @returns length of the line
   */
  static GetLineLength(t) {
    if (t.length === 0)
      return 0;
    let e;
    typeof t[0] == "number" ? e = g.ToVector3Array(t) : e = t;
    const s = R.Vector3[0];
    let r = 0;
    for (let o = 0; o < e.length - 1; o++) {
      const i = e[o], n = e[o + 1];
      r += n.subtractToRef(i, s).length();
    }
    return r;
  }
  /**
   * Gets the the length from the beginning to each point of the line as array.
   * @param data array of line points
   * @returns length array of the line
   */
  static GetLineLengthArray(t) {
    const e = new Float32Array(t.length / 3);
    let s = 0;
    for (let r = 0, o = t.length / 3 - 1; r < o; r++) {
      let i = t[r * 3 + 0], n = t[r * 3 + 1], h = t[r * 3 + 2];
      i -= t[r * 3 + 3], n -= t[r * 3 + 4], h -= t[r * 3 + 5];
      const _ = Math.sqrt(i * i + n * n + h * h);
      s += _, e[r + 1] = s;
    }
    return e;
  }
  /**
   * Divides a segment into smaller segments.
   * A segment is a part of the line between it's two points.
   * @param point1 first point of the line
   * @param point2 second point of the line
   * @param segmentCount number of segments we want to have in the divided line
   * @returns
   */
  static SegmentizeSegmentByCount(t, e, s) {
    const r = [], o = e.subtract(t), i = R.Vector3[0];
    i.setAll(s);
    const n = R.Vector3[1];
    o.divideToRef(i, n);
    let h = t.clone();
    r.push(h);
    for (let _ = 0; _ < s; _++)
      h = h.clone(), r.push(h.addInPlace(n));
    return r;
  }
  /**
   * Divides a line into segments.
   * A segment is a part of the line between it's two points.
   * @param what line points
   * @param segmentLength length of each segment of the resulting line (distance between two line points)
   * @returns line point
   */
  static SegmentizeLineBySegmentLength(t, e) {
    const s = t[0] instanceof E ? g.GetLineSegments(t) : typeof t[0] == "number" ? g.GetLineSegments(g.ToVector3Array(t)) : t, r = [];
    return s.forEach((o) => {
      o.length > e ? g.SegmentizeSegmentByCount(o.point1, o.point2, Math.ceil(o.length / e)).forEach((n) => {
        r.push(n);
      }) : (r.push(o.point1), r.push(o.point2));
    }), r;
  }
  /**
   * Divides a line into segments.
   * A segment is a part of the line between it's two points.
   * @param what line points
   * @param segmentCount number of segments
   * @returns line point
   */
  static SegmentizeLineBySegmentCount(t, e) {
    const s = typeof t[0] == "number" ? g.ToVector3Array(t) : t, r = g.GetLineLength(s) / e;
    return g.SegmentizeLineBySegmentLength(s, r);
  }
  /**
   * Gets line segments.
   * A segment is a part of the line between it's two points.
   * @param points line points
   * @returns segments information of the line segment including starting point, ending point and the distance between them
   */
  static GetLineSegments(t) {
    const e = [];
    for (let s = 0; s < t.length - 1; s++) {
      const r = t[s], o = t[s + 1], i = o.subtract(r).length();
      e.push({ point1: r, point2: o, length: i });
    }
    return e;
  }
  /**
   * Gets the minimum and the maximum length of a line segment in the line.
   * A segment is a part of the line between it's two points.
   * @param points line points
   * @returns
   */
  static GetMinMaxSegmentLength(t) {
    const s = g.GetLineSegments(t).sort((r) => r.length);
    return {
      min: s[0].length,
      max: s[s.length - 1].length
    };
  }
  /**
   * Finds the last visible position in world space of the line according to the visibility parameter
   * @param lineSegments segments of the line
   * @param lineLength total length of the line
   * @param visbility normalized value of visibility
   * @param localSpace if true the result will be in local space (default is false)
   * @returns world space coordinate of the last visible piece of the line
   */
  static GetPositionOnLineByVisibility(t, e, s, r = !1) {
    const o = e * s;
    let i = 0, n = 0;
    const h = t.length;
    for (let a = 0; a < h; a++) {
      if (o <= i + t[a].length) {
        n = a;
        break;
      }
      i += t[a].length;
    }
    const _ = (o - i) / t[n].length;
    return t[n].point2.subtractToRef(t[n].point1, R.Vector3[0]), R.Vector3[1] = R.Vector3[0].multiplyByFloats(_, _, _), r || R.Vector3[1].addInPlace(t[n].point1), R.Vector3[1].clone();
  }
  /**
   * Creates lines in a shape of circle/arc.
   * A segment is a part of the line between it's two points.
   * @param radiusX radiusX of the circle
   * @param segments number of segments in the circle
   * @param z z coordinate of the points. Defaults to 0.
   * @param radiusY radiusY of the circle - you can draw an oval if using different values
   * @param segmentAngle angle offset of the segments. Defaults to Math.PI * 2 / segments. Change this value to draw a part of the circle.
   * @returns line points
   */
  static GetCircleLinePoints(t, e, s = 0, r = t, o = Math.PI * 2 / e) {
    const i = [];
    for (let n = 0; n <= e; n++)
      i.push(new E(Math.cos(n * o) * t, Math.sin(n * o) * r, s));
    return i;
  }
  /**
   * Gets line points in a shape of a bezier curve
   * @param p0 bezier point0
   * @param p1 bezier point1
   * @param p2 bezier point2
   * @param segments number of segments in the curve
   * @returns
   */
  static GetBezierLinePoints(t, e, s, r) {
    return gt.CreateQuadraticBezier(t, e, s, r).getPoints().flatMap((o) => [o.x, o.y, o.z]);
  }
  /**
   *
   * @param position position of the arrow cap (mainly you want to create a triangle, set widthUp and widthDown to the same value and omit widthStartUp and widthStartDown)
   * @param direction direction which the arrow points to
   * @param length length (size) of the arrow cap itself
   * @param widthUp the arrow width above the line
   * @param widthDown the arrow width belove the line
   * @param widthStartUp the arrow width at the start of the arrow above the line. In most scenarios this is 0.
   * @param widthStartDown the arrow width at the start of the arrow below the line. In most scenarios this is 0.
   * @returns
   */
  static GetArrowCap(t, e, s, r, o, i = 0, n = 0) {
    return {
      points: [t.clone(), t.add(e.multiplyByFloats(s, s, s))],
      widths: [r, o, i, n]
    };
  }
  /**
   * Gets 3D positions of points from a text and font
   * @param text Text
   * @param size Size of the font
   * @param resolution Resolution of the font
   * @param fontData defines the font data (can be generated with http://gero3.github.io/facetype.js/)
   * @param z z coordinate
   * @param includeInner include the inner parts of the font in the result. Default true. If false, only the outlines will be returned.
   * @returns number[][] of 3D positions
   */
  static GetPointsFromText(t, e, s, r, o = 0, i = !0) {
    const n = [], h = ft(t, e, s, r);
    for (const _ of h) {
      for (const a of _.paths) {
        const c = [], f = a.getPoints();
        for (const u of f)
          c.push(u.x, u.y, o);
        n.push(c);
      }
      if (i)
        for (const a of _.holes) {
          const c = [], f = a.getPoints();
          for (const u of f)
            c.push(u.x, u.y, o);
          n.push(c);
        }
    }
    return n;
  }
  /**
   * Converts an array of Color3 to Uint8Array
   * @param colors Arrray of Color3
   * @returns Uin8Array of colors [r, g, b, a, r, g, b, a, ...]
   */
  static Color3toRGBAUint8(t) {
    const e = new Uint8Array(t.length * 4);
    for (let s = 0, r = 0; s < t.length; s++)
      e[r++] = t[s].r * 255, e[r++] = t[s].g * 255, e[r++] = t[s].b * 255, e[r++] = 255;
    return e;
  }
  /**
   * Creates a RawTexture from an RGBA color array and sets it on the plugin material instance.
   * @param name name of the texture
   * @param colors Uint8Array of colors
   * @param colorsSampling sampling mode of the created texture
   * @param scene Scene
   * @returns the colors texture
   */
  static CreateColorsTexture(t, e, s, r) {
    const o = g.Color3toRGBAUint8(e), i = new Y(o, e.length, 1, tt.TEXTUREFORMAT_RGBA, r, !1, !0, s);
    return i.name = t, i;
  }
  /**
   * A minimum size texture for the colors sampler2D when there is no colors texture defined yet.
   * For fast switching using the useColors property without the need to use defines.
   * @param scene Scene
   * @returns empty colors texture
   */
  static PrepareEmptyColorsTexture(t) {
    if (!D.EmptyColorsTexture) {
      const e = new Uint8Array(4);
      D.EmptyColorsTexture = new Y(e, 1, 1, tt.TEXTUREFORMAT_RGBA, t, !1, !1, Y.NEAREST_NEAREST), D.EmptyColorsTexture.name = "grlEmptyColorsTexture";
    }
    return D.EmptyColorsTexture;
  }
  /**
   * Diposes the shared empty colors texture
   */
  static DisposeEmptyColorsTexture() {
    D.EmptyColorsTexture?.dispose(), D.EmptyColorsTexture = null;
  }
  /**
   * Converts boolean to number.
   * @param bool the bool value
   * @returns 1 if true, 0 if false.
   */
  static BooleanToNumber(t) {
    return t ? 1 : 0;
  }
}
var j;
(function(l) {
  l[l.MATERIAL_TYPE_STANDARD = 0] = "MATERIAL_TYPE_STANDARD", l[l.MATERIAL_TYPE_PBR = 1] = "MATERIAL_TYPE_PBR", l[l.MATERIAL_TYPE_SIMPLE = 2] = "MATERIAL_TYPE_SIMPLE";
})(j || (j = {}));
var P;
(function(l) {
  l[l.COLOR_MODE_SET = 0] = "COLOR_MODE_SET", l[l.COLOR_MODE_ADD = 1] = "COLOR_MODE_ADD", l[l.COLOR_MODE_MULTIPLY = 2] = "COLOR_MODE_MULTIPLY";
})(P || (P = {}));
var b;
(function(l) {
  l[l.COLOR_DISTRIBUTION_TYPE_SEGMENT = 0] = "COLOR_DISTRIBUTION_TYPE_SEGMENT", l[l.COLOR_DISTRIBUTION_TYPE_LINE = 1] = "COLOR_DISTRIBUTION_TYPE_LINE";
})(b || (b = {}));
class Et extends Tt {
  constructor() {
    super(...arguments), this.GREASED_LINE_HAS_COLOR = !1, this.GREASED_LINE_SIZE_ATTENUATION = !1, this.GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE = !1, this.GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM = !1, this.GREASED_LINE_CAMERA_FACING = !0;
  }
}
class F extends dt {
  /**
   * Creates a new instance of the GreasedLinePluginMaterial
   * @param material base material for the plugin
   * @param scene the scene
   * @param options plugin options
   */
  constructor(t, e, s) {
    s = s || {
      color: D.DEFAULT_COLOR
    };
    const r = new Et();
    r.GREASED_LINE_HAS_COLOR = !!s.color && !s.useColors, r.GREASED_LINE_SIZE_ATTENUATION = s.sizeAttenuation ?? !1, r.GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE = s.colorDistributionType === b.COLOR_DISTRIBUTION_TYPE_LINE, r.GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM = (e ?? t.getScene()).useRightHandedSystem, r.GREASED_LINE_CAMERA_FACING = s.cameraFacing ?? !0, super(t, F.GREASED_LINE_MATERIAL_NAME, 200, r), this.colorsTexture = null, this._scene = e ?? t.getScene(), this._engine = this._scene.getEngine(), this._cameraFacing = s.cameraFacing ?? !0, this.visibility = s.visibility ?? 1, this.useDash = s.useDash ?? !1, this.dashRatio = s.dashRatio ?? 0.5, this.dashOffset = s.dashOffset ?? 0, this.width = s.width ? s.width : s.sizeAttenuation ? D.DEFAULT_WIDTH_ATTENUATED : D.DEFAULT_WIDTH, this._sizeAttenuation = s.sizeAttenuation ?? !1, this.colorMode = s.colorMode ?? P.COLOR_MODE_SET, this._color = s.color ?? null, this.useColors = s.useColors ?? !1, this._colorsDistributionType = s.colorDistributionType ?? b.COLOR_DISTRIBUTION_TYPE_SEGMENT, this.colorsSampling = s.colorsSampling ?? Y.NEAREST_NEAREST, this._colors = s.colors ?? null, this.dashCount = s.dashCount ?? 1, this.resolution = s.resolution ?? new Q(this._engine.getRenderWidth(), this._engine.getRenderHeight()), s.colorsTexture ? this.colorsTexture = s.colorsTexture : this._colors ? this.colorsTexture = g.CreateColorsTexture(`${t.name}-colors-texture`, this._colors, this.colorsSampling, this._scene) : (this._color = this._color ?? D.DEFAULT_COLOR, g.PrepareEmptyColorsTexture(this._scene)), this._engine.onDisposeObservable.add(() => {
      g.DisposeEmptyColorsTexture();
    }), this._enable(!0);
  }
  /**
   * Get the shader attributes
   * @param attributes array which will be filled with the attributes
   */
  getAttributes(t) {
    t.push("grl_offsets"), t.push("grl_widths"), t.push("grl_colorPointers"), t.push("grl_counters"), this._cameraFacing ? (t.push("grl_previousAndSide"), t.push("grl_nextAndCounters")) : t.push("grl_slopes");
  }
  /**
   * Get the shader samplers
   * @param samplers
   */
  getSamplers(t) {
    t.push("grl_colors");
  }
  /**
   * Get the shader textures
   * @param activeTextures array which will be filled with the textures
   */
  getActiveTextures(t) {
    this.colorsTexture && t.push(this.colorsTexture);
  }
  /**
   * Get the shader uniforms
   * @returns uniforms
   */
  getUniforms() {
    const t = [
      { name: "grl_singleColor", size: 3, type: "vec3" },
      { name: "grl_dashOptions", size: 4, type: "vec4" },
      { name: "grl_colorMode_visibility_colorsWidth_useColors", size: 4, type: "vec4" }
    ];
    return this._cameraFacing && t.push({ name: "grl_projection", size: 16, type: "mat4" }, { name: "grl_aspect_resolution_lineWidth", size: 4, type: "vec4" }), {
      ubo: t,
      vertex: this._cameraFacing ? `
                uniform vec4 grl_aspect_resolution_lineWidth;
                uniform mat4 grl_projection;
                ` : "",
      fragment: `
                uniform vec4 grl_dashOptions;
                uniform vec4 grl_colorMode_visibility_colorsWidth_useColors;
                uniform vec3 grl_singleColor;
                `
    };
  }
  // only getter, it doesn't make sense to use this plugin on a mesh other than GreasedLineMesh
  // and it doesn't make sense to disable it on the mesh
  get isEnabled() {
    return !0;
  }
  /**
   * Bind the uniform buffer
   * @param uniformBuffer
   */
  bindForSubMesh(t) {
    if (this._cameraFacing) {
      const r = this._scene.activeCamera;
      if (r) {
        const i = r.getProjectionMatrix();
        t.updateMatrix("grl_projection", i);
      } else
        throw Error("GreasedLinePluginMaterial requires an active camera.");
      const o = R.Vector4[0];
      o.x = this._aspect, o.y = this._resolution.x, o.z = this._resolution.y, o.w = this.width, t.updateVector4("grl_aspect_resolution_lineWidth", o);
    }
    const e = R.Vector4[0];
    e.x = g.BooleanToNumber(this.useDash), e.y = this._dashArray, e.z = this.dashOffset, e.w = this.dashRatio, t.updateVector4("grl_dashOptions", e);
    const s = R.Vector4[1];
    s.x = this.colorMode, s.y = this.visibility, s.z = this.colorsTexture ? this.colorsTexture.getSize().width : 0, s.w = g.BooleanToNumber(this.useColors), t.updateVector4("grl_colorMode_visibility_colorsWidth_useColors", s), this._color && t.updateColor3("grl_singleColor", this._color), t.setTexture("grl_colors", this.colorsTexture ?? D.EmptyColorsTexture);
  }
  /**
   * Prepare the defines
   * @param defines
   * @param _scene
   * @param _mesh
   */
  prepareDefines(t, e, s) {
    t.GREASED_LINE_HAS_COLOR = !!this.color && !this.useColors, t.GREASED_LINE_SIZE_ATTENUATION = this._sizeAttenuation, t.GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE = this._colorsDistributionType === b.COLOR_DISTRIBUTION_TYPE_LINE, t.GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM = e.useRightHandedSystem, t.GREASED_LINE_CAMERA_FACING = this._cameraFacing;
  }
  /**
   * Get the class name
   * @returns class name
   */
  getClassName() {
    return F.GREASED_LINE_MATERIAL_NAME;
  }
  /**
   * Get shader code
   * @param shaderType vertex/fragment
   * @returns shader code
   */
  getCustomCode(t) {
    if (t === "vertex") {
      const e = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        CUSTOM_VERTEX_DEFINITIONS: `
                attribute float grl_widths;
                attribute vec3 grl_offsets;
                attribute float grl_colorPointers;

                varying float grlCounters;
                varying float grlColorPointer;

                #ifdef GREASED_LINE_CAMERA_FACING
                    attribute vec4 grl_previousAndSide;
                    attribute vec4 grl_nextAndCounters;

                    vec2 grlFix( vec4 i, float aspect ) {
                        vec2 res = i.xy / i.w;
                        res.x *= aspect;
                        return res;
                    }
                #else
                    attribute vec3 grl_slopes;
                    attribute float grl_counters;
                #endif
                `,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        CUSTOM_VERTEX_UPDATE_POSITION: `
                #ifdef GREASED_LINE_CAMERA_FACING
                    vec3 grlPositionOffset = grl_offsets;
                    positionUpdated += grlPositionOffset;
                #else
                    positionUpdated = (positionUpdated + grl_offsets) + (grl_slopes * grl_widths);
                #endif
                `,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        CUSTOM_VERTEX_MAIN_END: `
                grlColorPointer = grl_colorPointers;

                #ifdef GREASED_LINE_CAMERA_FACING

                    float grlAspect = grl_aspect_resolution_lineWidth.x;
                    float grlBaseWidth = grl_aspect_resolution_lineWidth.w;


                    vec3 grlPrevious = grl_previousAndSide.xyz;
                    float grlSide = grl_previousAndSide.w;

                    vec3 grlNext = grl_nextAndCounters.xyz;
                    grlCounters = grl_nextAndCounters.w;

                    mat4 grlMatrix = viewProjection * finalWorld;
                    vec4 grlFinalPosition = grlMatrix * vec4( positionUpdated , 1.0 );
                    vec4 grlPrevPos = grlMatrix * vec4( grlPrevious + grlPositionOffset, 1.0 );
                    vec4 grlNextPos = grlMatrix * vec4( grlNext + grlPositionOffset, 1.0 );

                    vec2 grlCurrentP = grlFix( grlFinalPosition, grlAspect );
                    vec2 grlPrevP = grlFix( grlPrevPos, grlAspect );
                    vec2 grlNextP = grlFix( grlNextPos, grlAspect );

                    float grlWidth = grlBaseWidth * grl_widths;

                    vec2 grlDir;
                    if( grlNextP == grlCurrentP ) grlDir = normalize( grlCurrentP - grlPrevP );
                    else if( grlPrevP == grlCurrentP ) grlDir = normalize( grlNextP - grlCurrentP );
                    else {
                        vec2 grlDir1 = normalize( grlCurrentP - grlPrevP );
                        vec2 grlDir2 = normalize( grlNextP - grlCurrentP );
                        grlDir = normalize( grlDir1 + grlDir2 );
                    }
                    vec4 grlNormal = vec4( -grlDir.y, grlDir.x, 0., 1. );
                    #ifdef GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM
                        grlNormal.xy *= -.5 * grlWidth;
                    #else
                        grlNormal.xy *= .5 * grlWidth;
                    #endif

                    grlNormal *= grl_projection;

                    #ifdef GREASED_LINE_SIZE_ATTENUATION
                        grlNormal.xy *= grlFinalPosition.w;
                        grlNormal.xy /= ( vec4( grl_aspect_resolution_lineWidth.yz, 0., 1. ) * grl_projection ).xy;
                    #endif

                    grlFinalPosition.xy += grlNormal.xy * grlSide;
                    gl_Position = grlFinalPosition;

                    vPositionW = vec3(grlFinalPosition);
                #else
                    grlCounters = grl_counters;
                #endif
                `
      };
      return this._cameraFacing && (e["!gl_Position\\=viewProjection\\*worldPos;"] = "//"), e;
    }
    return t === "fragment" ? {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      CUSTOM_FRAGMENT_DEFINITIONS: `
                    varying float grlCounters;
                    varying float grlColorPointer;
                    uniform sampler2D grl_colors;
                `,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      CUSTOM_FRAGMENT_MAIN_END: `
                    float grlColorMode = grl_colorMode_visibility_colorsWidth_useColors.x;
                    float grlVisibility = grl_colorMode_visibility_colorsWidth_useColors.y;
                    float grlColorsWidth = grl_colorMode_visibility_colorsWidth_useColors.z;
                    float grlUseColors = grl_colorMode_visibility_colorsWidth_useColors.w;

                    float grlUseDash = grl_dashOptions.x;
                    float grlDashArray = grl_dashOptions.y;
                    float grlDashOffset = grl_dashOptions.z;
                    float grlDashRatio = grl_dashOptions.w;

                    gl_FragColor.a *= step(grlCounters, grlVisibility);
                    if( gl_FragColor.a == 0. ) discard;

                    if(grlUseDash == 1.){
                        gl_FragColor.a *= ceil(mod(grlCounters + grlDashOffset, grlDashArray) - (grlDashArray * grlDashRatio));
                        if (gl_FragColor.a == 0.) discard;
                    }

                    #ifdef GREASED_LINE_HAS_COLOR
                        if (grlColorMode == ${P.COLOR_MODE_SET}.) {
                            gl_FragColor.rgb = grl_singleColor;
                        } else if (grlColorMode == ${P.COLOR_MODE_ADD}.) {
                            gl_FragColor.rgb += grl_singleColor;
                        } else if (grlColorMode == ${P.COLOR_MODE_MULTIPLY}.) {
                            gl_FragColor.rgb *= grl_singleColor;
                        }
                    #else
                        if (grlUseColors == 1.) {
                            #ifdef GREASED_LINE_COLOR_DISTRIBUTION_TYPE_LINE
                                vec4 grlColor = texture2D(grl_colors, vec2(grlCounters, 0.), 0.);
                            #else
                                vec4 grlColor = texture2D(grl_colors, vec2(grlColorPointer/grlColorsWidth, 0.), 0.);
                            #endif
                            if (grlColorMode == ${P.COLOR_MODE_SET}.) {
                                gl_FragColor = grlColor;
                            } else if (grlColorMode == ${P.COLOR_MODE_ADD}.) {
                                gl_FragColor += grlColor;
                            } else if (grlColorMode == ${P.COLOR_MODE_MULTIPLY}.) {
                                gl_FragColor *= grlColor;
                            }
                        }
                    #endif

                `
    } : null;
  }
  /**
   * Disposes the plugin material.
   */
  dispose() {
    this.colorsTexture?.dispose(), super.dispose();
  }
  /**
   * Returns the colors used to colorize the line
   */
  get colors() {
    return this._colors;
  }
  /**
   * Sets the colors used to colorize the line
   */
  set colors(t) {
    this.setColors(t);
  }
  /**
   * Creates or updates the colors texture
   * @param colors color table RGBA
   * @param lazy if lazy, the colors are not updated
   * @param forceNewTexture force creation of a new texture
   */
  setColors(t, e = !1, s = !1) {
    const r = this._colors?.length ?? 0;
    if (this._colors = t, t === null || t.length === 0) {
      this.colorsTexture?.dispose();
      return;
    }
    if (!(e && !s))
      if (this.colorsTexture && r === t.length && !s) {
        const o = g.Color3toRGBAUint8(t);
        this.colorsTexture.update(o);
      } else
        this.colorsTexture?.dispose(), this.colorsTexture = g.CreateColorsTexture(`${this._material.name}-colors-texture`, t, this.colorsSampling, this._scene);
  }
  /**
   * Updates the material. Use when material created in lazy mode.
   */
  updateLazy() {
    this._colors && this.setColors(this._colors, !1, !0);
  }
  /**
   * Gets the number of dashes in the line
   */
  get dashCount() {
    return this._dashCount;
  }
  /**
   * Sets the number of dashes in the line
   * @param value dash
   */
  set dashCount(t) {
    this._dashCount = t, this._dashArray = 1 / t;
  }
  /**
   * If set to true the line will be rendered always with the same width regardless how far it is located from the camera.
   * Not supported for non camera facing lines.
   */
  get sizeAttenuation() {
    return this._sizeAttenuation;
  }
  /**
   * Turn on/off size attenuation of the width option and widths array.
   * Not supported for non camera facing lines.
   * @param value If set to true the line will be rendered always with the same width regardless how far it is located from the camera.
   */
  set sizeAttenuation(t) {
    this._sizeAttenuation = t, this.markAllDefinesAsDirty();
  }
  /**
   * Gets the color of the line
   */
  get color() {
    return this._color;
  }
  /**
   * Sets the color of the line
   * @param value Color3 or null to clear the color. You need to clear the color if you use colors and useColors = true
   */
  set color(t) {
    this.setColor(t);
  }
  /**
   * Sets the color of the line. If set the whole line will be mixed with this color according to the colorMode option.
   * @param value color
   * @param doNotMarkDirty if true, the material will not be marked as dirty
   */
  setColor(t, e = !1) {
    this._color === null && t !== null || this._color !== null && t === null ? (this._color = t, !e && this.markAllDefinesAsDirty()) : this._color = t;
  }
  /**
   * Gets the color distributiopn type
   */
  get colorsDistributionType() {
    return this._colorsDistributionType;
  }
  /**
   * Sets the color distribution type
   * @see GreasedLineMeshColorDistributionType
   * @param value color distribution type
   */
  set colorsDistributionType(t) {
    this._colorsDistributionType = t, this.markAllDefinesAsDirty();
  }
  /**
   * Gets the resolution
   */
  get resolution() {
    return this._resolution;
  }
  /**
   * Sets the resolution
   * @param value resolution of the screen for GreasedLine
   */
  set resolution(t) {
    this._aspect = t.x / t.y, this._resolution = t;
  }
  /**
   * Serializes this plugin material
   * @returns serializationObjec
   */
  serialize() {
    const t = super.serialize(), e = {
      colorDistributionType: this._colorsDistributionType,
      colorsSampling: this.colorsSampling,
      colorMode: this.colorMode,
      dashCount: this._dashCount,
      dashOffset: this.dashOffset,
      dashRatio: this.dashRatio,
      resolution: this._resolution,
      sizeAttenuation: this._sizeAttenuation,
      useColors: this.useColors,
      useDash: this.useDash,
      visibility: this.visibility,
      width: this.width
    };
    return this._colors && (e.colors = this._colors), this._color && (e.color = this._color), t.greasedLineMaterialOptions = e, t;
  }
  /**
   * Parses a serialized objects
   * @param source serialized object
   * @param scene scene
   * @param rootUrl root url for textures
   */
  parse(t, e, s) {
    super.parse(t, e, s);
    const r = t.greasedLineMaterialOptions;
    this.colorsTexture?.dispose(), r.color && this.setColor(r.color, !0), r.colorDistributionType && (this.colorsDistributionType = r.colorDistributionType), r.colors && (this.colors = r.colors), r.colorsSampling && (this.colorsSampling = r.colorsSampling), r.colorMode && (this.colorMode = r.colorMode), r.useColors && (this.useColors = r.useColors), r.visibility && (this.visibility = r.visibility), r.useDash && (this.useDash = r.useDash), r.dashCount && (this.dashCount = r.dashCount), r.dashRatio && (this.dashRatio = r.dashRatio), r.dashOffset && (this.dashOffset = r.dashOffset), r.width && (this.width = r.width), r.sizeAttenuation && (this.sizeAttenuation = r.sizeAttenuation), r.resolution && (this.resolution = r.resolution), this.colors ? this.colorsTexture = g.CreateColorsTexture(`${this._material.name}-colors-texture`, this.colors, this.colorsSampling, e) : g.PrepareEmptyColorsTexture(e), this.markAllDefinesAsDirty();
  }
  /**
   * Makes a duplicate of the current configuration into another one.
   * @param plugin define the config where to copy the info
   */
  copyTo(t) {
    const e = t;
    e.colorsTexture?.dispose(), this._colors && (e.colorsTexture = g.CreateColorsTexture(`${e._material.name}-colors-texture`, this._colors, e.colorsSampling, this._scene)), e.setColor(this.color, !0), e.colorsDistributionType = this.colorsDistributionType, e.colorsSampling = this.colorsSampling, e.colorMode = this.colorMode, e.useColors = this.useColors, e.visibility = this.visibility, e.useDash = this.useDash, e.dashCount = this.dashCount, e.dashRatio = this.dashRatio, e.dashOffset = this.dashOffset, e.width = this.width, e.sizeAttenuation = this.sizeAttenuation, e.resolution = this.resolution, e.markAllDefinesAsDirty();
  }
}
F.GREASED_LINE_MATERIAL_NAME = "GreasedLinePluginMaterial";
ct(`BABYLON.${F.GREASED_LINE_MATERIAL_NAME}`, F);
const pt = "greasedLinePixelShader", Ct = `precision highp float;uniform sampler2D grlColors;uniform float grlUseColors;uniform float grlUseDash;uniform float grlDashArray;uniform float grlDashOffset;uniform float grlDashRatio;uniform float grlVisibility;uniform float grlColorsWidth;uniform vec2 grl_colorModeAndColorDistributionType;uniform vec3 grlColor;varying float grlCounters;varying float grlColorPointer;void main() {float grlColorMode=grl_colorModeAndColorDistributionType.x;float grlColorDistributionType=grl_colorModeAndColorDistributionType.y;gl_FragColor=vec4(grlColor,1.);gl_FragColor.a=step(grlCounters,grlVisibility);if (gl_FragColor.a==0.) discard;if( grlUseDash==1. ){gl_FragColor.a=ceil(mod(grlCounters+grlDashOffset,grlDashArray)-(grlDashArray*grlDashRatio));if (gl_FragColor.a==0.) discard;}
if (grlUseColors==1.) {vec4 textureColor;if (grlColorDistributionType==COLOR_DISTRIBUTION_TYPE_LINE) { 
textureColor=texture2D(grlColors,vec2(grlCounters,0.),0.);} else {textureColor=texture2D(grlColors,vec2(grlColorPointer/grlColorsWidth,0.),0.);}
if (grlColorMode==COLOR_MODE_SET) {gl_FragColor=textureColor;} else if (grlColorMode==COLOR_MODE_ADD) {gl_FragColor+=textureColor;} else if (grlColorMode==COLOR_MODE_MULTIPLY) {gl_FragColor*=textureColor;}}}
`;
st.ShadersStore[pt] = Ct;
const At = "greasedLineVertexShader", Dt = `precision highp float;
#include<instancesDeclaration>
attribute float grl_widths;attribute vec3 grl_offsets;attribute float grl_colorPointers;attribute vec3 position;uniform mat4 viewProjection;uniform mat4 projection;varying float grlCounters;varying float grlColorPointer;
#ifdef GREASED_LINE_CAMERA_FACING
attribute vec4 grl_nextAndCounters;attribute vec4 grl_previousAndSide;uniform vec2 grlResolution;uniform float grlAspect;uniform float grlWidth;uniform float grlSizeAttenuation;vec2 grlFix( vec4 i,float aspect ) {vec2 res=i.xy/i.w;res.x*=aspect;return res;}
#else
attribute vec3 grl_slopes;attribute float grl_counters;
#endif
void main() {
#include<instancesVertex>
grlColorPointer=grl_colorPointers;mat4 grlMatrix=viewProjection*finalWorld ;
#ifdef GREASED_LINE_CAMERA_FACING
float grlBaseWidth=grlWidth;vec3 grlPrevious=grl_previousAndSide.xyz;float grlSide=grl_previousAndSide.w;vec3 grlNext=grl_nextAndCounters.xyz;grlCounters=grl_nextAndCounters.w;vec3 grlPositionOffset=grl_offsets;vec4 grlFinalPosition=grlMatrix*vec4( position+grlPositionOffset ,1.0 );vec4 grlPrevPos=grlMatrix*vec4( grlPrevious+grlPositionOffset,1.0 );vec4 grlNextPos=grlMatrix*vec4( grlNext+grlPositionOffset,1.0 );vec2 grlCurrentP=grlFix( grlFinalPosition,grlAspect );vec2 grlPrevP=grlFix( grlPrevPos,grlAspect );vec2 grlNextP=grlFix( grlNextPos,grlAspect );float grlWidth=grlBaseWidth*grl_widths;vec2 grlDir;if( grlNextP==grlCurrentP ) grlDir=normalize( grlCurrentP-grlPrevP );else if( grlPrevP==grlCurrentP ) grlDir=normalize( grlNextP-grlCurrentP );else {vec2 grlDir1=normalize( grlCurrentP-grlPrevP );vec2 grlDir2=normalize( grlNextP-grlCurrentP );grlDir=normalize( grlDir1+grlDir2 );}
vec4 grlNormal=vec4( -grlDir.y,grlDir.x,0.,1. );
#ifdef GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM
grlNormal.xy*=-.5*grlWidth;
#else
grlNormal.xy*=.5*grlWidth;
#endif
grlNormal*=projection;if (grlSizeAttenuation==1.) {grlNormal.xy*=grlFinalPosition.w;grlNormal.xy/=( vec4( grlResolution,0.,1. )*projection ).xy;}
grlFinalPosition.xy+=grlNormal.xy*grlSide;gl_Position=grlFinalPosition;
#else
grlCounters=grl_counters;vec4 grlFinalPosition=grlMatrix*vec4( (position+grl_offsets)+grl_slopes*grl_widths ,1.0 ) ;gl_Position=grlFinalPosition;
#endif
}
`;
st.ShadersStore[At] = Dt;
class it extends Ot {
  /**
   * GreasedLineSimple material constructor
   * @param name material name
   * @param scene the scene
   * @param options material options
   */
  constructor(t, e, s) {
    const r = [
      `COLOR_DISTRIBUTION_TYPE_LINE ${b.COLOR_DISTRIBUTION_TYPE_LINE}.`,
      `COLOR_DISTRIBUTION_TYPE_SEGMENT ${b.COLOR_DISTRIBUTION_TYPE_SEGMENT}.`,
      `COLOR_MODE_SET ${P.COLOR_MODE_SET}.`,
      `COLOR_MODE_ADD ${P.COLOR_MODE_ADD}.`,
      `COLOR_MODE_MULTIPLY ${P.COLOR_MODE_MULTIPLY}.`
    ], o = ["position", "grl_widths", "grl_offsets", "grl_colorPointers"];
    e.useRightHandedSystem && r.push("GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM"), s.cameraFacing ? (r.push("GREASED_LINE_CAMERA_FACING"), o.push("grl_previousAndSide", "grl_nextAndCounters")) : (o.push("grl_slopes"), o.push("grl_counters")), super(t, e, {
      vertex: "greasedLine",
      fragment: "greasedLine"
    }, {
      attributes: o,
      uniforms: [
        "world",
        "viewProjection",
        "view",
        "projection",
        "grlColorsWidth",
        "grlUseColors",
        "grlWidth",
        "grlColor",
        "grl_colorModeAndColorDistributionType",
        "grlResolution",
        "grlAspect",
        "grlAizeAttenuation",
        "grlDashArray",
        "grlDashOffset",
        "grlDashRatio",
        "grlUseDash",
        "grlVisibility"
      ],
      samplers: ["grlColors"],
      defines: r
    }), this._color = Z.White(), this._colorsDistributionType = b.COLOR_DISTRIBUTION_TYPE_SEGMENT, this._colorsTexture = null, s = s || {
      color: D.DEFAULT_COLOR
    };
    const i = e.getEngine();
    this.visibility = s.visibility ?? 1, this.useDash = s.useDash ?? !1, this.dashRatio = s.dashRatio ?? 0.5, this.dashOffset = s.dashOffset ?? 0, this.dashCount = s.dashCount ?? 1, this.width = s.width ? s.width : s.sizeAttenuation && s.cameraFacing ? D.DEFAULT_WIDTH_ATTENUATED : D.DEFAULT_WIDTH, this.sizeAttenuation = s.sizeAttenuation ?? !1, this.color = s.color ?? Z.White(), this.useColors = s.useColors ?? !1, this.colorsDistributionType = s.colorDistributionType ?? b.COLOR_DISTRIBUTION_TYPE_SEGMENT, this.colorsSampling = s.colorsSampling ?? Y.NEAREST_NEAREST, this.colorMode = s.colorMode ?? P.COLOR_MODE_SET, this._colors = s.colors ?? null, this._cameraFacing = s.cameraFacing ?? !0, this.resolution = s.resolution ?? new Q(i.getRenderWidth(), i.getRenderHeight()), s.colorsTexture ? this.colorsTexture = s.colorsTexture : this.colorsTexture = g.PrepareEmptyColorsTexture(e), this._colors && this.setColors(this._colors), i.onDisposeObservable.add(() => {
      g.DisposeEmptyColorsTexture();
    });
  }
  /**
   * Disposes the plugin material.
   */
  dispose() {
    this._colorsTexture?.dispose(), super.dispose();
  }
  _setColorModeAndColorDistributionType() {
    this.setVector2("grl_colorModeAndColorDistributionType", new Q(this._colorMode, this._colorsDistributionType));
  }
  /**
   * Updates the material. Use when material created in lazy mode.
   */
  updateLazy() {
    this._colors && this.setColors(this._colors, !1, !0);
  }
  /**
   * Returns the colors used to colorize the line
   */
  get colors() {
    return this._colors;
  }
  /**
   * Sets the colors used to colorize the line
   */
  set colors(t) {
    this.setColors(t);
  }
  /**
   * Creates or updates the colors texture
   * @param colors color table RGBA
   * @param lazy if lazy, the colors are not updated
   * @param forceNewTexture force creation of a new texture
   */
  setColors(t, e = !1, s = !1) {
    const r = this._colors?.length ?? 0;
    if (this._colors = t, t === null || t.length === 0) {
      this._colorsTexture?.dispose();
      return;
    }
    if (!(e && !s))
      if (this._colorsTexture && r === t.length && !s) {
        const o = g.Color3toRGBAUint8(t);
        this._colorsTexture.update(o);
      } else
        this._colorsTexture?.dispose(), this.colorsTexture = g.CreateColorsTexture(`${this.name}-colors-texture`, t, this.colorsSampling, this.getScene());
  }
  /**
   * Gets the colors texture
   */
  get colorsTexture() {
    return this._colorsTexture ?? null;
  }
  /**
   * Sets the colorsTexture
   */
  set colorsTexture(t) {
    this._colorsTexture = t, this.setFloat("grlColorsWidth", this._colorsTexture.getSize().width), this.setTexture("grlColors", this._colorsTexture);
  }
  /**
   * Line base width. At each point the line width is calculated by widths[pointIndex] * width
   */
  get width() {
    return this._width;
  }
  /**
   * Line base width. At each point the line width is calculated by widths[pointIndex] * width
   */
  set width(t) {
    this._width = t, this.setFloat("grlWidth", t);
  }
  /**
   * Whether to use the colors option to colorize the line
   */
  get useColors() {
    return this._useColors;
  }
  set useColors(t) {
    this._useColors = t, this.setFloat("grlUseColors", g.BooleanToNumber(t));
  }
  /**
   * The type of sampling of the colors texture. The values are the same when using with textures.
   */
  get colorsSampling() {
    return this._colorsSampling;
  }
  /**
   * The type of sampling of the colors texture. The values are the same when using with textures.
   */
  set colorsSampling(t) {
    this._colorsSampling = t;
  }
  /**
   * Normalized value of how much of the line will be visible
   * 0 - 0% of the line will be visible
   * 1 - 100% of the line will be visible
   */
  get visibility() {
    return this._visibility;
  }
  set visibility(t) {
    this._visibility = t, this.setFloat("grlVisibility", t);
  }
  /**
   * Turns on/off dash mode
   */
  get useDash() {
    return this._useDash;
  }
  /**
   * Turns on/off dash mode
   */
  set useDash(t) {
    this._useDash = t, this.setFloat("grlUseDash", g.BooleanToNumber(t));
  }
  /**
   * Gets the dash offset
   */
  get dashOffset() {
    return this._dashOffset;
  }
  /**
   * Sets the dash offset
   */
  set dashOffset(t) {
    this._dashOffset = t, this.setFloat("grlDashOffset", t);
  }
  /**
   * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
   */
  get dashRatio() {
    return this._dashRatio;
  }
  /**
   * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
   */
  set dashRatio(t) {
    this._dashRatio = t, this.setFloat("grlDashRatio", t);
  }
  /**
   * Gets the number of dashes in the line
   */
  get dashCount() {
    return this._dashCount;
  }
  /**
   * Sets the number of dashes in the line
   * @param value dash
   */
  set dashCount(t) {
    this._dashCount = t, this._dashArray = 1 / t, this.setFloat("grlDashArray", this._dashArray);
  }
  /**
   * False means 1 unit in width = 1 unit on scene, true means 1 unit in width is reduced on the screen to make better looking lines
   */
  get sizeAttenuation() {
    return this._sizeAttenuation;
  }
  /**
   * Turn on/off attenuation of the width option and widths array.
   * @param value false means 1 unit in width = 1 unit on scene, true means 1 unit in width is reduced on the screen to make better looking lines
   */
  set sizeAttenuation(t) {
    this._sizeAttenuation = t, this.setFloat("grlSizeAttenuation", g.BooleanToNumber(t));
  }
  /**
   * Gets the color of the line
   */
  get color() {
    return this.color;
  }
  /**
   * Sets the color of the line
   * @param value Color3
   */
  set color(t) {
    this.setColor(t);
  }
  /**
   * Sets the color of the line. If set the whole line will be mixed with this color according to the colorMode option.
   * The simple material always needs a color to be set. If you set it to null it will set the color to the default color (GreasedLineSimpleMaterial.DEFAULT_COLOR).
   * @param value color
   */
  setColor(t) {
    t = t ?? D.DEFAULT_COLOR, this._color = t, this.setColor3("grlColor", t);
  }
  /**
   * Gets the color distributiopn type
   */
  get colorsDistributionType() {
    return this._colorsDistributionType;
  }
  /**
   * Sets the color distribution type
   * @see GreasedLineMeshColorDistributionType
   * @param value color distribution type
   */
  set colorsDistributionType(t) {
    this._colorsDistributionType = t, this._setColorModeAndColorDistributionType();
  }
  /**
   * Gets the mixing mode of the color and colors paramaters. Default value is GreasedLineMeshColorMode.SET.
   * MATERIAL_TYPE_SIMPLE mixes the color and colors of the greased line material.
   * @see GreasedLineMeshColorMode
   */
  get colorMode() {
    return this._colorMode;
  }
  /**
   * Sets the mixing mode of the color and colors paramaters. Default value is GreasedLineMeshColorMode.SET.
   * MATERIAL_TYPE_SIMPLE mixes the color and colors of the greased line material.
   * @see GreasedLineMeshColorMode
   */
  set colorMode(t) {
    this._colorMode = t, this._setColorModeAndColorDistributionType();
  }
  /**
   * Gets the resolution
   */
  get resolution() {
    return this._resolution;
  }
  /**
   * Sets the resolution
   * @param value resolution of the screen for GreasedLine
   */
  set resolution(t) {
    this._resolution = t, this.setVector2("grlResolution", t), this.setFloat("grlAspect", t.x / t.y);
  }
  /**
   * Serializes this plugin material
   * @returns serializationObjec
   */
  serialize() {
    const t = super.serialize(), e = {
      colorDistributionType: this._colorsDistributionType,
      colorsSampling: this._colorsSampling,
      colorMode: this._colorMode,
      color: this._color,
      dashCount: this._dashCount,
      dashOffset: this._dashOffset,
      dashRatio: this._dashRatio,
      resolution: this._resolution,
      sizeAttenuation: this._sizeAttenuation,
      useColors: this._useColors,
      useDash: this._useDash,
      visibility: this._visibility,
      width: this._width,
      cameraFacing: this._cameraFacing
    };
    return this._colors && (e.colors = this._colors), t.greasedLineMaterialOptions = e, t;
  }
  /**
   * Parses a serialized objects
   * @param source serialized object
   * @param scene scene
   * @param _rootUrl root url for textures
   */
  parse(t, e, s) {
    const r = t.greasedLineMaterialOptions;
    this._colorsTexture?.dispose(), r.color && (this.color = r.color), r.colorDistributionType && (this.colorsDistributionType = r.colorDistributionType), r.colorsSampling && (this.colorsSampling = r.colorsSampling), r.colorMode && (this.colorMode = r.colorMode), r.useColors && (this.useColors = r.useColors), r.visibility && (this.visibility = r.visibility), r.useDash && (this.useDash = r.useDash), r.dashCount && (this.dashCount = r.dashCount), r.dashRatio && (this.dashRatio = r.dashRatio), r.dashOffset && (this.dashOffset = r.dashOffset), r.width && (this.width = r.width), r.sizeAttenuation && (this.sizeAttenuation = r.sizeAttenuation), r.resolution && (this.resolution = r.resolution), r.colors ? this.colorsTexture = g.CreateColorsTexture(`${this.name}-colors-texture`, r.colors, this.colorsSampling, this.getScene()) : this.colorsTexture = g.PrepareEmptyColorsTexture(e), this._cameraFacing = r.cameraFacing ?? !0, this.setDefine("GREASED_LINE_CAMERA_FACING", this._cameraFacing);
  }
}
var y;
(function(l) {
  l[l.POINTS_MODE_POINTS = 0] = "POINTS_MODE_POINTS", l[l.POINTS_MODE_PATHS = 1] = "POINTS_MODE_PATHS";
})(y || (y = {}));
var $;
(function(l) {
  l[l.FACES_MODE_SINGLE_SIDED = 0] = "FACES_MODE_SINGLE_SIDED", l[l.FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING = 1] = "FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING", l[l.FACES_MODE_DOUBLE_SIDED = 2] = "FACES_MODE_DOUBLE_SIDED";
})($ || ($ = {}));
var L;
(function(l) {
  l[l.AUTO_DIRECTIONS_FROM_FIRST_SEGMENT = 0] = "AUTO_DIRECTIONS_FROM_FIRST_SEGMENT", l[l.AUTO_DIRECTIONS_FROM_ALL_SEGMENTS = 1] = "AUTO_DIRECTIONS_FROM_ALL_SEGMENTS", l[l.AUTO_DIRECTIONS_ENHANCED = 2] = "AUTO_DIRECTIONS_ENHANCED", l[l.AUTO_DIRECTIONS_FACE_TO = 3] = "AUTO_DIRECTIONS_FACE_TO", l[l.AUTO_DIRECTIONS_NONE = 99] = "AUTO_DIRECTIONS_NONE";
})(L || (L = {}));
class ot extends K {
  constructor(t, e, s) {
    super(t, e, null, null, !1, !1), this.name = t, this._options = s, this._lazy = !1, this._updatable = !1, this._engine = e.getEngine(), this._lazy = s.lazy ?? !1, this._updatable = s.updatable ?? !1, this._vertexPositions = [], this._indices = [], this._uvs = [], this._points = [], this._colorPointers = s.colorPointers ?? [], this._widths = s.widths ?? new Array(s.points.length).fill(1);
  }
  /**
   * "GreasedLineMesh"
   * @returns "GreasedLineMesh"
   */
  getClassName() {
    return "GreasedLineMesh";
  }
  _updateWidthsWithValue(t) {
    let e = 0;
    for (const r of this._points)
      e += r.length;
    const s = e / 3 * 2 - this._widths.length;
    for (let r = 0; r < s; r++)
      this._widths.push(t);
  }
  /**
   * Updated a lazy line. Rerenders the line and updates boundinfo as well.
   */
  updateLazy() {
    this._setPoints(this._points), this._options.colorPointers || this._updateColorPointers(), this._createVertexBuffers(this._options.ribbonOptions?.smoothShading), this.refreshBoundingInfo(), this.greasedLineMaterial?.updateLazy();
  }
  /**
   * Adds new points to the line. It doesn't rerenders the line if in lazy mode.
   * @param points points table
   * @param options optional options
   */
  addPoints(t, e) {
    for (const s of t)
      this._points.push(s);
    this._lazy || this.setPoints(this._points, e);
  }
  /**
   * Dispose the line and it's resources
   * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
   * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
   */
  dispose(t, e = !1) {
    super.dispose(t, e);
  }
  /**
   * @returns true if the mesh was created in lazy mode
   */
  isLazy() {
    return this._lazy;
  }
  /**
   * Returns the UVs
   */
  get uvs() {
    return this._uvs;
  }
  /**
   * Sets the UVs
   * @param uvs the UVs
   */
  set uvs(t) {
    this._uvs = t instanceof Float32Array ? t : new Float32Array(t), this._createVertexBuffers();
  }
  /**
   * Returns the points offsets
   * Return the points offsets
   */
  get offsets() {
    return this._offsets;
  }
  /**
   * Sets point offests
   * @param offsets offset table [x,y,z, x,y,z, ....]
   */
  set offsets(t) {
    this._offsets = t, this._offsetsBuffer ? this._offsetsBuffer.update(t) : this._createOffsetsBuffer(t);
  }
  /**
   * Gets widths at each line point like [widthLower, widthUpper, widthLower, widthUpper, ...]
   */
  get widths() {
    return this._widths;
  }
  /**
   * Sets widths at each line point
   * @param widths width table [widthLower, widthUpper, widthLower, widthUpper ...]
   */
  set widths(t) {
    this._widths = t, this._lazy || this._widthsBuffer && this._widthsBuffer.update(t);
  }
  /**
   * Gets the color pointer. Each vertex need a color pointer. These color pointers points to the colors in the color table @see colors
   */
  get colorPointers() {
    return this._colorPointers;
  }
  /**
   * Sets the color pointer
   * @param colorPointers array of color pointer in the colors array. One pointer for every vertex is needed.
   */
  set colorPointers(t) {
    this._colorPointers = t, this._lazy || this._colorPointersBuffer && this._colorPointersBuffer.update(t);
  }
  /**
   * Gets the pluginMaterial associated with line
   */
  get greasedLineMaterial() {
    if (this.material && this.material instanceof it)
      return this.material;
    const t = this.material?.pluginManager?.getPlugin(F.GREASED_LINE_MATERIAL_NAME);
    if (t)
      return t;
  }
  /**
   * Return copy the points.
   */
  get points() {
    const t = [];
    return k.DeepCopy(this._points, t), t;
  }
  /**
   * Sets line points and rerenders the line.
   * @param points points table
   * @param options optional options
   */
  setPoints(t, e) {
    this._points = t, this._updateWidths(), e?.colorPointers || this._updateColorPointers(), this._setPoints(t, e);
  }
  _initGreasedLine() {
    this._vertexPositions = [], this._indices = [], this._uvs = [];
  }
  _createLineOptions() {
    return {
      points: this._points,
      colorPointers: this._colorPointers,
      lazy: this._lazy,
      updatable: this._updatable,
      uvs: this._uvs,
      widths: this._widths,
      ribbonOptions: this._options.ribbonOptions
    };
  }
  /**
   * Serializes this GreasedLineMesh
   * @param serializationObject object to write serialization to
   */
  serialize(t) {
    super.serialize(t), t.type = this.getClassName(), t.lineOptions = this._createLineOptions();
  }
  _createVertexBuffers(t = !1) {
    const e = new J();
    return e.positions = this._vertexPositions, e.indices = this._indices, e.uvs = this._uvs, t && (e.normals = [], J.ComputeNormals(this._vertexPositions, this._indices, e.normals)), e.applyToMesh(this, this._options.updatable), e;
  }
  _createOffsetsBuffer(t) {
    const e = this._scene.getEngine(), s = new M(e, t, this._updatable, 3);
    this.setVerticesBuffer(s.createVertexBuffer("grl_offsets", 0, 3)), this._offsetsBuffer = s;
  }
}
K._GreasedLineMeshParser = (l, t) => A.Parse(l, t);
class A extends ot {
  /**
   * GreasedLineMesh
   * @param name name of the mesh
   * @param scene the scene
   * @param _options mesh options
   */
  constructor(t, e, s) {
    super(t, e, s), this.name = t, this.intersectionThreshold = 0.1, this._previousAndSide = [], this._nextAndCounters = [], s.points && this.addPoints(g.ConvertPoints(s.points));
  }
  /**
   * "GreasedLineMesh"
   * @returns "GreasedLineMesh"
   */
  getClassName() {
    return "GreasedLineMesh";
  }
  _updateColorPointers() {
    if (this._options.colorPointers)
      return;
    let t = 0;
    this._colorPointers = [], this._points.forEach((e) => {
      for (let s = 0; s < e.length; s += 3)
        this._colorPointers.push(t), this._colorPointers.push(t++);
    });
  }
  _updateWidths() {
    super._updateWidthsWithValue(0);
  }
  _setPoints(t) {
    this._points = t, this._options.points = t, this._initGreasedLine();
    let e = 0, s = 0, r = 0, o = 0, i = 0;
    t.forEach((O) => {
      s += O.length * 2, r += (O.length - 3) * 2, o += O.length * 4 / 3, i += O.length * 8 / 3;
    });
    const n = new Float32Array(s), h = s > 65535 ? new Uint32Array(r) : new Uint16Array(r), _ = new Float32Array(o), a = new Float32Array(i), c = new Float32Array(i);
    let f = 0, u = 0, d = 0, C = 0, S = 0;
    t.forEach((O) => {
      const H = g.GetLineLengthArray(O), q = H[H.length - 1];
      for (let p = 0, I = 0; I < O.length; p++, I += 3) {
        const V = f + I * 2;
        if (n[V + 0] = O[I + 0], n[V + 1] = O[I + 1], n[V + 2] = O[I + 2], n[V + 3] = O[I + 0], n[V + 4] = O[I + 1], n[V + 5] = O[I + 2], I < O.length - 3) {
          const z = p * 2 + e, W = u + I * 2;
          h[W + 0] = z, h[W + 1] = z + 1, h[W + 2] = z + 2, h[W + 3] = z + 2, h[W + 4] = z + 1, h[W + 5] = z + 3;
        }
      }
      e += O.length / 3 * 2;
      const w = O.length * 2, N = n.subarray(f, f + w);
      f += w, u += (O.length - 3) * 2;
      const G = new Float32Array(N.length), B = new Float32Array(N.length), m = N.length / 6;
      let U;
      A._CompareV3(0, m - 1, N) ? U = N.subarray((m - 2) * 6, (m - 1) * 6) : U = N.subarray(0, 6), G.set(U), G.set(N.subarray(0, N.length - 6), 6), B.set(N.subarray(6)), A._CompareV3(m - 1, 0, N) ? U = N.subarray(6, 12) : U = N.subarray((m - 1) * 6, m * 6), B.set(U, B.length - 6);
      for (let p = 0, I = N.length / 3; p < I; p++)
        a[C++] = G[p * 3], a[C++] = G[p * 3 + 1], a[C++] = G[p * 3 + 2], a[C++] = 1 - ((p & 1) << 1), c[S++] = B[p * 3], c[S++] = B[p * 3 + 1], c[S++] = B[p * 3 + 2], c[S++] = H[p >> 1] / q;
      if (this._options.uvs)
        for (let p = 0; p < this._options.uvs.length; p++)
          _[d++] = this._options.uvs[p];
      else {
        for (let p = 0; p < m; p++) {
          const I = d + p * 4;
          _[I + 0] = p / (m - 1), _[I + 1] = 0, _[I + 2] = p / (m - 1), _[I + 3] = 1;
        }
        d += m * 4;
      }
    }), this._vertexPositions = n, this._indices = h, this._uvs = _, this._previousAndSide = a, this._nextAndCounters = c, this._lazy || (this._options.colorPointers || this._updateColorPointers(), this._createVertexBuffers(), this.refreshBoundingInfo());
  }
  /**
   * Clones the GreasedLineMesh.
   * @param name new line name
   * @param newParent new parent node
   * @returns cloned line
   */
  clone(t = `${this.name}-cloned`, e) {
    const s = this._createLineOptions(), r = {};
    k.DeepCopy(s, r, ["instance"], void 0, !0);
    const o = new A(t, this._scene, r);
    return e && (o.parent = e), o.material = this.material, o;
  }
  /**
   * Serializes this GreasedLineMesh
   * @param serializationObject object to write serialization to
   */
  serialize(t) {
    super.serialize(t), t.type = this.getClassName(), t.lineOptions = this._createLineOptions();
  }
  /**
   * Parses a serialized GreasedLineMesh
   * @param parsedMesh the serialized GreasedLineMesh
   * @param scene the scene to create the GreasedLineMesh in
   * @returns the created GreasedLineMesh
   */
  static Parse(t, e) {
    const s = t.lineOptions, r = t.name;
    return new A(r, e, s);
  }
  _initGreasedLine() {
    super._initGreasedLine(), this._previousAndSide = [], this._nextAndCounters = [];
  }
  /**
   * Checks whether a ray is intersecting this GreasedLineMesh
   * @param ray ray to check the intersection of this mesh with
   * @param fastCheck not supported
   * @param trianglePredicate not supported
   * @param onlyBoundingInfo defines a boolean indicating if picking should only happen using bounding info (false by default)
   * @param worldToUse not supported
   * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
   * @returns the picking info
   */
  intersects(t, e, s, r = !1, o, i = !1) {
    const n = new ut(), h = this.findAllIntersections(t, e, s, r, o, i, !0);
    if (h?.length === 1) {
      const _ = h[0];
      n.hit = !0, n.distance = _.distance, n.ray = t, n.pickedMesh = this, n.pickedPoint = _.point;
    }
    return n;
  }
  /**
   * Gets all intersections of a ray and the line
   * @param ray Ray to check the intersection of this mesh with
   * @param _fastCheck not supported
   * @param _trianglePredicate not supported
   * @param onlyBoundingInfo defines a boolean indicating if picking should only happen using bounding info (false by default)
   * @param _worldToUse not supported
   * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
   * @param firstOnly If true, the first and only intersection is immediatelly returned if found
   * @returns intersection(s)
   */
  findAllIntersections(t, e, s, r = !1, o, i = !1, n = !1) {
    if (r && !i && t.intersectsSphere(this._boundingSphere, this.intersectionThreshold) === !1)
      return;
    const h = this.getIndices(), _ = this.getVerticesData(et.PositionKind), a = this._widths, c = this.greasedLineMaterial?.width ?? 1, f = [];
    if (h && _ && a) {
      let u = 0, d = 0;
      for (u = 0, d = h.length - 1; u < d; u += 3) {
        const C = h[u], S = h[u + 1];
        A._V_START.fromArray(_, C * 3), A._V_END.fromArray(_, S * 3), this._offsets && (A._V_OFFSET_START.fromArray(this._offsets, C * 3), A._V_OFFSET_END.fromArray(this._offsets, S * 3), A._V_START.addInPlace(A._V_OFFSET_START), A._V_END.addInPlace(A._V_OFFSET_END));
        const O = Math.floor(u / 3), H = a[O] !== void 0 ? a[O] : 1, q = this.intersectionThreshold * (c * H) / 2, w = t.intersectionSegment(A._V_START, A._V_END, q);
        if (w !== -1 && (f.push({
          distance: w,
          point: t.direction.normalize().multiplyByFloats(w, w, w).add(t.origin)
        }), n))
          return f;
      }
      u = d;
    }
    return f;
  }
  get _boundingSphere() {
    return this.getBoundingInfo().boundingSphere;
  }
  static _CompareV3(t, e, s) {
    const r = t * 6, o = e * 6;
    return s[r] === s[o] && s[r + 1] === s[o + 1] && s[r + 2] === s[o + 2];
  }
  _createVertexBuffers() {
    const t = super._createVertexBuffers(), e = this._scene.getEngine(), s = new M(e, this._previousAndSide, !1, 4);
    this.setVerticesBuffer(s.createVertexBuffer("grl_previousAndSide", 0, 4));
    const r = new M(e, this._nextAndCounters, !1, 4);
    this.setVerticesBuffer(r.createVertexBuffer("grl_nextAndCounters", 0, 4));
    const o = new M(e, this._widths, this._updatable, 1);
    this.setVerticesBuffer(o.createVertexBuffer("grl_widths", 0, 1)), this._widthsBuffer = o;
    const i = new M(e, this._colorPointers, this._updatable, 1);
    return this.setVerticesBuffer(i.createVertexBuffer("grl_colorPointers", 0, 1)), this._colorPointersBuffer = i, t;
  }
}
A._V_START = new E();
A._V_END = new E();
A._V_OFFSET_START = new E();
A._V_OFFSET_END = new E();
K._GreasedLineRibbonMeshParser = (l, t) => T.Parse(l, t);
class T extends ot {
  /**
   * GreasedLineRibbonMesh
   * @param name name of the mesh
   * @param scene the scene
   * @param _options mesh options
   * @param _pathOptions used internaly when parsing a serialized GreasedLineRibbonMesh
   */
  constructor(t, e, s, r) {
    if (super(t, e, s), this.name = t, !s.ribbonOptions)
      throw "'GreasedLineMeshOptions.ribbonOptions' is not set.";
    this._paths = [], this._counters = [], this._slopes = [], this._widths = s.widths ?? [], this._ribbonWidths = [], this._pathsOptions = r ?? [], s.points && this.addPoints(g.ConvertPoints(s.points), s, !!r);
  }
  /**
   * Adds new points to the line. It doesn't rerenders the line if in lazy mode.
   * @param points points table
   * @param options mesh options
   * @param hasPathOptions defaults to false
   */
  addPoints(t, e, s = !1) {
    if (!e.ribbonOptions)
      throw "addPoints() on GreasedLineRibbonMesh instance requires 'GreasedLineMeshOptions.ribbonOptions'.";
    s || this._pathsOptions.push({ options: e, pathCount: t.length }), super.addPoints(t, e);
  }
  /**
   * "GreasedLineRibbonMesh"
   * @returns "GreasedLineRibbonMesh"
   */
  getClassName() {
    return "GreasedLineRibbonMesh";
  }
  /**
   * Return true if the line was created from two edge paths or one points path.
   * In this case the line is always flat.
   */
  get isFlatLine() {
    return this._paths.length < 3;
  }
  /**
   * Returns the slopes of the line at each point relative to the center of the line
   */
  get slopes() {
    return this._slopes;
  }
  /**
   * Set the slopes of the line at each point relative to the center of the line
   */
  set slopes(t) {
    this._slopes = t;
  }
  _updateColorPointers() {
    if (this._options.colorPointers)
      return;
    let t = 0;
    this._colorPointers = [];
    for (let e = 0; e < this._pathsOptions.length; e++) {
      const { options: s, pathCount: r } = this._pathsOptions[e], o = this._points[e];
      if (s.ribbonOptions.pointsMode === y.POINTS_MODE_POINTS)
        for (let i = 0; i < r; i++)
          for (let n = 0; n < o.length; n += 3)
            this._colorPointers.push(t), this._colorPointers.push(t++);
      else
        for (let i = 0; i < o.length; i += 3) {
          for (let n = 0; n < r; n++)
            this._colorPointers.push(t);
          t++;
        }
    }
  }
  _updateWidths() {
    super._updateWidthsWithValue(1);
  }
  _setPoints(t, e) {
    if (!this._options.ribbonOptions)
      throw "No 'GreasedLineMeshOptions.ribbonOptions' provided.";
    this._points = t, this._options.points = t, this._initGreasedLine();
    let s = 0, r;
    for (let o = 0, i = 0; o < this._pathsOptions.length; o++) {
      const { options: n, pathCount: h } = this._pathsOptions[o], _ = t.slice(i, i + h);
      if (i += h, n.ribbonOptions?.pointsMode === y.POINTS_MODE_PATHS)
        s = this._preprocess(g.ToVector3Array(_), s, n);
      else {
        if (n.ribbonOptions?.directionsAutoMode === L.AUTO_DIRECTIONS_NONE) {
          if (!n.ribbonOptions.directions)
            throw "In GreasedLineRibbonAutoDirectionMode.AUTO_DIRECTIONS_NONE 'GreasedLineMeshOptions.ribbonOptions.directions' must be defined.";
          r = T._GetDirectionPlanesFromDirectionsOption(_.length, n.ribbonOptions.directions);
        }
        _.forEach((a, c) => {
          const f = T._ConvertToRibbonPath(a, n.ribbonOptions, this._scene.useRightHandedSystem, r && r[c]);
          s = this._preprocess(f, s, n);
        });
      }
    }
    this._lazy || (this._createVertexBuffers(), this.refreshBoundingInfo());
  }
  static _GetDirectionPlanesFromDirectionsOption(t, e) {
    return Array.isArray(e) ? e : new Array(t).fill(e);
  }
  static _CreateRibbonVertexData(t, e) {
    const s = t.length;
    if (s < 2)
      throw "Minimum of two paths are required to create a GreasedLineRibbonMesh.";
    const r = [], o = [], i = t[0];
    for (let a = 0; a < i.length; a++)
      for (let c = 0; c < t.length; c++) {
        const f = t[c][a];
        r.push(f.x, f.y, f.z);
      }
    const n = [1, 0, s], h = e.ribbonOptions?.facesMode === $.FACES_MODE_DOUBLE_SIDED, _ = e.ribbonOptions?.pointsMode === y.POINTS_MODE_PATHS && e.ribbonOptions.closePath;
    if (s > 2)
      for (let a = 0; a < i.length - 1; a++) {
        n[0] = 1 + s * a, n[1] = s * a, n[2] = (a + 1) * s;
        for (let c = 0; c < (s - 1) * 2; c++)
          c % 2 !== 0 && (n[2] += 1), c % 2 === 0 && c > 0 && (n[0] += 1, n[1] += 1), o.push(n[1] + (c % 2 !== 0 ? s : 0), n[0], n[2]), h && o.push(n[0], n[1] + (c % 2 !== 0 ? s : 0), n[2]);
      }
    else
      for (let a = 0; a < r.length / 3 - 3; a += 2)
        o.push(a, a + 1, a + 2), o.push(a + 2, a + 1, a + 3), h && (o.push(a + 1, a, a + 2), o.push(a + 1, a + 2, a + 3));
    if (_) {
      let a = s * (i.length - 1);
      for (let c = 0; c < s - 1; c++)
        o.push(a, c + 1, c), o.push(a + 1, c + 1, a), h && (o.push(c, c + 1, a), o.push(a, c + 1, a + 1)), a++;
    }
    return {
      positions: r,
      indices: o
    };
  }
  _preprocess(t, e, s) {
    this._paths = t;
    const r = T._CreateRibbonVertexData(t, s), o = r.positions;
    if (!this._options.widths)
      throw "No 'GreasedLineMeshOptions.widths' table is specified.";
    const i = Array.isArray(this._vertexPositions) ? this._vertexPositions : Array.from(this._vertexPositions);
    this._vertexPositions = i;
    const n = Array.isArray(this._uvs) ? this._uvs : Array.from(this._uvs);
    this._uvs = n;
    const h = Array.isArray(this._indices) ? this._indices : Array.from(this._indices);
    this._indices = h;
    for (const u of o)
      i.push(u);
    let _ = t;
    if (s.ribbonOptions?.pointsMode === y.POINTS_MODE_PATHS && s.ribbonOptions.closePath) {
      _ = [];
      for (let u = 0; u < t.length; u++) {
        const d = t[u].slice();
        d.push(t[u][0].clone()), _.push(d);
      }
    }
    this._calculateSegmentLengths(_);
    const a = _.length, c = new Array(a).fill(0);
    for (let u = 0; u < _[0].length; u++) {
      let d = 0;
      for (let C = 0; C < a; C++) {
        const S = c[C] + this._vSegmentLengths[C][u] / this._vTotalLengths[C];
        this._counters.push(S), n.push(S, d), c[C] = S, d += this._uSegmentLengths[u][C] / this._uTotalLengths[u];
      }
    }
    for (let u = 0, d = 0; u < _[0].length; u++) {
      const C = this._uSegmentLengths[u][0] / 2, S = this._uSegmentLengths[u][a - 1] / 2;
      this._ribbonWidths.push(((this._widths[d++] ?? 1) - 1) * C);
      for (let O = 0; O < a - 2; O++)
        this._ribbonWidths.push(0);
      this._ribbonWidths.push(((this._widths[d++] ?? 1) - 1) * S);
    }
    const f = s.ribbonOptions?.pointsMode === y.POINTS_MODE_PATHS ? new Array(_[0].length * _.length * 6).fill(0) : T._CalculateSlopes(_);
    for (const u of f)
      this._slopes.push(u);
    if (r.indices)
      for (let u = 0; u < r.indices.length; u++)
        h.push(r.indices[u] + e);
    return e += o.length / 3, e;
  }
  static _ConvertToRibbonPath(t, e, s, r) {
    if (e.pointsMode === y.POINTS_MODE_POINTS && !e.width)
      throw "'GreasedLineMeshOptions.ribbonOptiosn.width' must be specified in GreasedLineRibbonPointsMode.POINTS_MODE_POINTS.";
    const o = [], i = [];
    if (e.pointsMode === y.POINTS_MODE_POINTS) {
      const n = e.width / 2, h = g.ToVector3Array(t);
      let _ = null, a = null;
      if (e.directionsAutoMode === L.AUTO_DIRECTIONS_FROM_FIRST_SEGMENT && (r = T._GetDirectionFromPoints(h[0], h[1], null)), e.directionsAutoMode === L.AUTO_DIRECTIONS_FACE_TO && !(e.directions instanceof E))
        throw "In GreasedLineRibbonAutoDirectionMode.AUTO_DIRECTIONS_FACE_TO 'GreasedLineMeshOptions.ribbonOptions.directions' must be a Vector3.";
      R.Vector3[1] = e.directions instanceof E ? e.directions : T.DIRECTION_XZ;
      for (let c = 0; c < h.length - (r ? 0 : 1); c++) {
        const f = h[c], u = h[c + 1];
        if (r)
          _ = r;
        else if (e.directionsAutoMode === L.AUTO_DIRECTIONS_FACE_TO)
          u.subtractToRef(f, R.Vector3[0]), _ = E.CrossToRef(R.Vector3[0], R.Vector3[1], R.Vector3[2]).normalize();
        else if (e.directionsAutoMode === L.AUTO_DIRECTIONS_FROM_ALL_SEGMENTS)
          _ = T._GetDirectionFromPoints(f, u, _);
        else {
          const d = u.subtract(f);
          d.applyRotationQuaternionInPlace(d.x > d.y && d.x > d.z ? s ? T._RightHandedForwardReadOnlyQuaternion : T._LeftHandedForwardReadOnlyQuaternion : T._LeftReadOnlyQuaternion), _ = d.normalize();
        }
        a = _.multiplyByFloats(n, n, n), o.push(f.add(a)), i.push(f.subtract(a));
      }
      r || (o.push(h[h.length - 1].add(a)), i.push(h[h.length - 1].subtract(a)));
    }
    return [o, i];
  }
  static _GetDirectionFromPoints(t, e, s) {
    return t.x === e.x && (!s || s?.x === 1) ? T.DIRECTION_YZ : t.y === e.y ? T.DIRECTION_XZ : t.z === e.z ? T.DIRECTION_XY : T.DIRECTION_XZ;
  }
  /**
   * Clones the GreasedLineRibbonMesh.
   * @param name new line name
   * @param newParent new parent node
   * @returns cloned line
   */
  clone(t = `${this.name}-cloned`, e) {
    const s = this._createLineOptions(), r = {}, o = [];
    k.DeepCopy(this._pathsOptions, o, void 0, void 0, !0), k.DeepCopy(s, r, ["instance"], void 0, !0);
    const i = new T(t, this._scene, r, o);
    return e && (i.parent = e), i.material = this.material, i;
  }
  /**
   * Serializes this GreasedLineRibbonMesh
   * @param serializationObject object to write serialization to
   */
  serialize(t) {
    super.serialize(t), t.type = this.getClassName(), t.lineOptions = this._createLineOptions(), t.pathsOptions = this._pathsOptions;
  }
  /**
   * Parses a serialized GreasedLineRibbonMesh
   * @param parsedMesh the serialized GreasedLineRibbonMesh
   * @param scene the scene to create the GreasedLineRibbonMesh in
   * @returns the created GreasedLineRibbonMesh
   */
  static Parse(t, e) {
    const s = t.lineOptions, r = t.name, o = t.pathOptions;
    return new T(r, e, s, o);
  }
  _initGreasedLine() {
    super._initGreasedLine(), this._paths = [], this._counters = [], this._slopes = [], this._ribbonWidths = [];
  }
  _calculateSegmentLengths(t) {
    const e = t.length;
    this._vSegmentLengths = new Array(e), this._vTotalLengths = new Array(e);
    let s = 0;
    for (let i = 0; i < e; i++) {
      const n = t[i];
      this._vSegmentLengths[i] = [0], s = 0;
      for (let h = 0; h < n.length - 1; h++) {
        const _ = Math.abs(n[h].subtract(n[h + 1]).lengthSquared());
        s += _, this._vSegmentLengths[i].push(_);
      }
      this._vTotalLengths[i] = s;
    }
    const r = t[0].length;
    this._uSegmentLengths = new Array(r).fill([]), this._uTotalLengths = new Array(r).fill([]);
    const o = new E();
    for (let i = 0; i < r; i++) {
      s = 0;
      for (let n = 1; n < e; n++) {
        t[n][i].subtractToRef(t[n - 1][i], o);
        const h = o.length();
        s += h, this._uSegmentLengths[i].push(h);
      }
      this._uTotalLengths[i] = s;
    }
  }
  static _CalculateSlopes(t) {
    const e = t[0], s = t.length === 2 ? t[1] : t[t.length - 1], r = [], o = new E();
    for (let i = 0; i < e.length; i++)
      for (let n = 0; n < t.length; n++)
        n === 0 || n === t.length - 1 ? (e[i].subtract(s[i]).normalizeToRef(o), r.push(o.x, o.y, o.z), r.push(-o.x, -o.y, -o.z)) : r.push(0, 0, 0, 0, 0, 0);
    return r;
  }
  _createVertexBuffers() {
    this._uvs = this._options.uvs ?? this._uvs;
    const t = super._createVertexBuffers(this._options.ribbonOptions?.smoothShading), e = new M(this._engine, this._counters, this._updatable, 1);
    this.setVerticesBuffer(e.createVertexBuffer("grl_counters", 0, 1));
    const s = new M(this._engine, this._colorPointers, this._updatable, 1);
    this.setVerticesBuffer(s.createVertexBuffer("grl_colorPointers", 0, 1));
    const r = new M(this._engine, this._slopes, this._updatable, 3);
    this.setVerticesBuffer(r.createVertexBuffer("grl_slopes", 0, 3));
    const o = new M(this._engine, this._ribbonWidths, this._updatable, 1);
    return this.setVerticesBuffer(o.createVertexBuffer("grl_widths", 0, 1)), this._widthsBuffer = o, t;
  }
}
T.DEFAULT_WIDTH = 0.1;
T._RightHandedForwardReadOnlyQuaternion = X.RotationAxis(E.RightHandedForwardReadOnly, Math.PI / 2);
T._LeftHandedForwardReadOnlyQuaternion = X.RotationAxis(E.LeftHandedForwardReadOnly, Math.PI / 2);
T._LeftReadOnlyQuaternion = X.RotationAxis(E.LeftReadOnly, Math.PI / 2);
T.DIRECTION_XY = E.LeftHandedForwardReadOnly;
T.DIRECTION_XZ = E.UpReadOnly;
T.DIRECTION_YZ = E.LeftReadOnly;
var x;
(function(l) {
  l[l.COLOR_DISTRIBUTION_NONE = 0] = "COLOR_DISTRIBUTION_NONE", l[l.COLOR_DISTRIBUTION_REPEAT = 1] = "COLOR_DISTRIBUTION_REPEAT", l[l.COLOR_DISTRIBUTION_EVEN = 2] = "COLOR_DISTRIBUTION_EVEN", l[l.COLOR_DISTRIBUTION_START = 3] = "COLOR_DISTRIBUTION_START", l[l.COLOR_DISTRIBUTION_END = 4] = "COLOR_DISTRIBUTION_END", l[l.COLOR_DISTRIBUTION_START_END = 5] = "COLOR_DISTRIBUTION_START_END";
})(x || (x = {}));
var v;
(function(l) {
  l[l.WIDTH_DISTRIBUTION_NONE = 0] = "WIDTH_DISTRIBUTION_NONE", l[l.WIDTH_DISTRIBUTION_REPEAT = 1] = "WIDTH_DISTRIBUTION_REPEAT", l[l.WIDTH_DISTRIBUTION_EVEN = 2] = "WIDTH_DISTRIBUTION_EVEN", l[l.WIDTH_DISTRIBUTION_START = 3] = "WIDTH_DISTRIBUTION_START", l[l.WIDTH_DISTRIBUTION_END = 4] = "WIDTH_DISTRIBUTION_END", l[l.WIDTH_DISTRIBUTION_START_END = 5] = "WIDTH_DISTRIBUTION_START_END";
})(v || (v = {}));
function nt(l, t, e) {
  e = e ?? rt.LastCreatedScene;
  let s;
  switch (t.materialType) {
    case j.MATERIAL_TYPE_PBR:
      s = new _t(l, e), new F(s, e, t);
      break;
    case j.MATERIAL_TYPE_SIMPLE:
      s = new it(l, e, t);
      break;
    default:
      s = new ht(l, e), new F(s, e, t);
      break;
  }
  return s;
}
function It(l, t, e, s) {
  s = s ?? rt.LastCreatedScene;
  let r;
  const o = g.ConvertPoints(t.points);
  t.widthDistribution = t.widthDistribution ?? v.WIDTH_DISTRIBUTION_START, t.ribbonOptions && (t.ribbonOptions.facesMode = t.ribbonOptions.facesMode ?? $.FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING, t.ribbonOptions.pointsMode = t.ribbonOptions.pointsMode ?? y.POINTS_MODE_POINTS, t.ribbonOptions.directionsAutoMode = t.ribbonOptions.directionsAutoMode ?? (t.ribbonOptions.directions ? L.AUTO_DIRECTIONS_NONE : L.AUTO_DIRECTIONS_FROM_FIRST_SEGMENT)), e = e ?? {
    color: D.DEFAULT_COLOR
  }, e.createAndAssignMaterial = e.createAndAssignMaterial ?? !0, e.colorDistribution = e?.colorDistribution ?? x.COLOR_DISTRIBUTION_START, e.materialType = e.materialType ?? j.MATERIAL_TYPE_STANDARD;
  let i = 0;
  Array.isArray(o[0]) && o.forEach((a) => {
    i += a.length / 3;
  });
  const n = lt(i, t.widths ?? [], t.widthDistribution), h = e?.colors ? at(i, e.colors, e.colorDistribution, e.color ?? D.DEFAULT_COLOR) : void 0, _ = {
    points: o,
    updatable: t.updatable,
    widths: n,
    lazy: t.lazy,
    ribbonOptions: t.ribbonOptions,
    uvs: t.uvs,
    colorPointers: t.colorPointers
  };
  if (_.ribbonOptions && _.ribbonOptions.pointsMode === y.POINTS_MODE_POINTS && (_.ribbonOptions.width = e.width ?? _.ribbonOptions.width ?? D.DEFAULT_WIDTH), t.instance)
    if (r = t.instance, r instanceof T)
      r.addPoints(o, _);
    else {
      const a = r.widths;
      if (a) {
        const c = a.slice();
        for (const f of n)
          c.push(f);
        r.widths = c;
      } else
        r.widths = n;
      if (r.addPoints(o), t.uvs) {
        const c = r.uvs;
        if (c) {
          const f = new Float32Array(c.length + t.uvs.length);
          f.set(c, 0), f.set(t.uvs, c.length), r.uvs = f;
        } else
          r.uvs = t.uvs;
      }
    }
  else if (r = _.ribbonOptions ? new T(l, s, _) : new A(l, s, _), e) {
    const a = {
      materialType: e.materialType,
      dashCount: e.dashCount,
      dashOffset: e.dashOffset,
      dashRatio: e.dashRatio,
      resolution: e.resolution,
      sizeAttenuation: e.sizeAttenuation,
      useColors: e.useColors,
      useDash: e.useDash,
      visibility: e.visibility,
      width: e.width,
      color: e.color,
      colorMode: e.colorMode,
      colorsSampling: e.colorsSampling,
      colorDistributionType: e.colorDistributionType,
      colors: h,
      cameraFacing: !t.ribbonOptions,
      colorsTexture: e.colorsTexture
    };
    if (e.createAndAssignMaterial) {
      const c = nt(l, a, s);
      r.material = c, t.ribbonOptions?.facesMode === $.FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING && (c.backFaceCulling = !1);
    }
  }
  if (h && t.instance && t.instance.greasedLineMaterial) {
    const a = t.instance.greasedLineMaterial.colors;
    if (a) {
      const c = a.concat(h);
      t.instance.greasedLineMaterial.setColors(c, r.isLazy());
    }
  }
  return r;
}
function lt(l, t, e, s = 1, r = 1) {
  const o = l - t.length / 2, i = [];
  if (o < 0)
    return t.slice(0, l * 2);
  if (o > 0) {
    if (t.length % 2 != 0 && t.push(s), e === v.WIDTH_DISTRIBUTION_START_END) {
      const n = Math.floor(t.length / 2);
      for (let a = 0, c = 0; a < n - 1; a++)
        i.push(t[c++]), i.push(t[c++]);
      const h = t[n / 2], _ = t[n / 2 + 1];
      for (let a = 0; a < o; a++)
        i.push(_), i.push(h);
      for (let a = n; a < t.length; a += 2)
        i.push(t[a]), i.push(t[a + 1]);
    } else if (e === v.WIDTH_DISTRIBUTION_START) {
      for (let n = 0; n < t.length; n += 2)
        i.push(t[n]), i.push(t[n + 1]);
      for (let n = 0; n < o; n++)
        i.push(s), i.push(r);
    } else if (e === v.WIDTH_DISTRIBUTION_END) {
      for (let n = 0; n < o; n++)
        i.push(s), i.push(r);
      for (let n = 0; n < t.length; n += 2)
        i.push(t[n]), i.push(t[n + 1]);
    } else if (e === v.WIDTH_DISTRIBUTION_REPEAT) {
      let n = 0;
      for (let h = 0; h < l; h++)
        i.push(t[n++]), i.push(t[n++]), n === t.length && (n = 0);
    } else if (e === v.WIDTH_DISTRIBUTION_EVEN) {
      let n = 0;
      const h = t.length / ((l - 1) * 2);
      for (let _ = 0; _ < l; _++) {
        const a = Math.floor(n);
        i.push(t[a]), i.push(t[a + 1]), n += h;
      }
    }
  } else
    for (let n = 0; n < t.length; n++)
      i.push(t[n]);
  return i;
}
function at(l, t, e, s) {
  l = Math.max(t.length, l);
  const r = l - t.length;
  if (r < 0)
    return t.slice(0, l);
  const o = [];
  if (r > 0) {
    if (e === x.COLOR_DISTRIBUTION_START_END) {
      const i = Math.floor(t.length / 2);
      for (let n = 0; n < i; n++)
        o.push(t[n]);
      for (let n = 0; n < r - 1; n++)
        o.push(s);
      for (let n = i; n < t.length; n++)
        o.push(t[n]);
    } else if (e === x.COLOR_DISTRIBUTION_START) {
      for (let i = 0; i < t.length; i++)
        o.push(t[i]);
      for (let i = 0; i < r; i++)
        o.push(s);
    } else if (e === x.COLOR_DISTRIBUTION_END) {
      for (let i = 0; i < r - 1; i++)
        o.push(s);
      for (let i = 0; i < t.length; i++)
        o.push(t[i]);
    } else if (e === x.COLOR_DISTRIBUTION_REPEAT) {
      let i = 0;
      for (let n = 0; n < l; n++)
        o.push(t[i]), i++, i === t.length && (i = 0);
    } else if (e === x.COLOR_DISTRIBUTION_EVEN) {
      let i = 0;
      const n = t.length / (l - 1);
      for (let h = 0; h < l - 1; h++) {
        const _ = Math.floor(i);
        o.push(t[_]), i += n;
      }
    } else if (e === x.COLOR_DISTRIBUTION_NONE)
      for (let i = 0; i < t.length; i++)
        o.push(t[i]);
  } else
    for (let i = 0; i < l; i++)
      o.push(t[i]);
  return o;
}
const Bt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CompleteGreasedLineColorTable: at,
  CompleteGreasedLineWidthTable: lt,
  CreateGreasedLine: It,
  CreateGreasedLineMaterial: nt,
  get GreasedLineMeshColorDistribution() {
    return x;
  },
  get GreasedLineMeshWidthDistribution() {
    return v;
  }
}, Symbol.toStringTag, { value: "Module" }));
export {
  at as C,
  ot as G,
  Et as M,
  lt as a,
  It as b,
  nt as c,
  D as d,
  A as e,
  x as f,
  b as g,
  P as h,
  j as i,
  v as j,
  F as k,
  L as l,
  $ as m,
  T as n,
  y as o,
  it as p,
  g as q,
  Bt as r
};
//# sourceMappingURL=greasedLineBuilder-BUC7RoOs.js.map
