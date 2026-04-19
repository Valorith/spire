import { x as _, h, V as u, C as S } from "./embed-entry-Dediijbe.js";
import { M as m } from "./mesh-BuRJrOj4.js";
import { I as p } from "./instancedMesh-Cd1_S2_D.js";
import { M as l } from "./material-Cr06Rh_F.js";
import { S as C } from "./shaderMaterial-BvPi5cDe.js";
import "./clipPlaneVertex-CsONt9tn.js";
import "./fogVertex-BHpwb8mx.js";
import "./effectFallbacks-B5WqMfcA.js";
import "./vertexColorMixing-Ch47jSQx.js";
const I = "colorPixelShader", E = `#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
#define VERTEXCOLOR
varying vec4 vColor;
#else
uniform vec4 color;
#endif
#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
gl_FragColor=vColor;
#else
gl_FragColor=color;
#endif
#include<fogFragment>(color,gl_FragColor)
#define CUSTOM_FRAGMENT_MAIN_END
}`;
_.ShadersStore[I] = E;
const T = "colorVertexShader", M = `attribute vec3 position;
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#ifdef FOG
uniform mat4 view;
#endif
#include<instancesDeclaration>
uniform mat4 viewProjection;
#ifdef MULTIVIEW
uniform mat4 viewProjectionR;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(position,1.0);
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*worldPos;} else {gl_Position=viewProjectionR*worldPos;}
#else
gl_Position=viewProjection*worldPos;
#endif
#include<clipPlaneVertex>
#include<fogVertex>
#include<vertexColorMixing>
#define CUSTOM_VERTEX_MAIN_END
}`;
_.ShadersStore[T] = M;
m._LinesMeshParser = (d, e) => o.Parse(d, e);
class o extends m {
  _isShaderMaterial(e) {
    return e.getClassName() === "ShaderMaterial";
  }
  /**
   * Creates a new LinesMesh
   * @param name defines the name
   * @param scene defines the hosting scene
   * @param parent defines the parent mesh if any
   * @param source defines the optional source LinesMesh used to clone data from
   * @param doNotCloneChildren When cloning, skip cloning child meshes of source, default False.
   * When false, achieved by calling a clone(), also passing False.
   * This will make creation of children, recursive.
   * @param useVertexColor defines if this LinesMesh supports vertex color
   * @param useVertexAlpha defines if this LinesMesh supports vertex alpha
   * @param material material to use to draw the line. If not provided, will create a new one
   */
  constructor(e, t = null, i = null, r = null, a, s, f, c) {
    super(e, t, i, r, a), this.useVertexColor = s, this.useVertexAlpha = f, this.color = new h(1, 1, 1), this.alpha = 1, r && (this.color = r.color.clone(), this.alpha = r.alpha, this.useVertexColor = r.useVertexColor, this.useVertexAlpha = r.useVertexAlpha), this.intersectionThreshold = 0.1;
    const g = [], n = {
      attributes: [u.PositionKind],
      uniforms: ["world", "viewProjection"],
      needAlphaBlending: !0,
      defines: g,
      useClipPlane: null
    };
    f === !1 ? n.needAlphaBlending = !1 : n.defines.push("#define VERTEXALPHA"), s ? (n.defines.push("#define VERTEXCOLOR"), n.attributes.push(u.ColorKind)) : (n.uniforms.push("color"), this._color4 = new S()), c ? this.material = c : (this.material = new C("colorShader", this.getScene(), "color", n, !1), this.material.doNotSerialize = !0);
  }
  isReady() {
    return this._lineMaterial.isReady(this, !!this._userInstancedBuffersStorage || this.hasThinInstances) ? super.isReady() : !1;
  }
  /**
   * @returns the string "LineMesh"
   */
  getClassName() {
    return "LinesMesh";
  }
  /**
   * @internal
   */
  get material() {
    return this._lineMaterial;
  }
  /**
   * @internal
   */
  set material(e) {
    this._lineMaterial = e, this._lineMaterial.fillMode = l.LineListDrawMode;
  }
  /**
   * @internal
   */
  get checkCollisions() {
    return !1;
  }
  set checkCollisions(e) {
  }
  /**
   * @internal
   */
  _bind(e, t) {
    if (!this._geometry)
      return this;
    const i = this.isUnIndexed ? null : this._geometry.getIndexBuffer();
    if (!this._userInstancedBuffersStorage || this.hasThinInstances ? this._geometry._bind(t, i) : this._geometry._bind(t, i, this._userInstancedBuffersStorage.vertexBuffers, this._userInstancedBuffersStorage.vertexArrayObjects), !this.useVertexColor && this._isShaderMaterial(this._lineMaterial)) {
      const { r, g: a, b: s } = this.color;
      this._color4.set(r, a, s, this.alpha), this._lineMaterial.setColor4("color", this._color4);
    }
    return this;
  }
  /**
   * @internal
   */
  _draw(e, t, i) {
    if (!this._geometry || !this._geometry.getVertexBuffers() || !this._unIndexed && !this._geometry.getIndexBuffer())
      return this;
    const r = this.getScene().getEngine();
    return this._unIndexed ? r.drawArraysType(l.LineListDrawMode, e.verticesStart, e.verticesCount, i) : r.drawElementsType(l.LineListDrawMode, e.indexStart, e.indexCount, i), this;
  }
  /**
   * Disposes of the line mesh
   * @param doNotRecurse If children should be disposed
   * @param disposeMaterialAndTextures This parameter is not used by the LineMesh class
   * @param doNotDisposeMaterial If the material should not be disposed (default: false, meaning the material is disposed)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispose(e, t = !1, i) {
    i || this._lineMaterial.dispose(!1, !1, !0), super.dispose(e);
  }
  /**
   * Returns a new LineMesh object cloned from the current one.
   * @param name defines the cloned mesh name
   * @param newParent defines the new mesh parent
   * @param doNotCloneChildren if set to true, none of the mesh children are cloned (false by default)
   * @returns the new mesh
   */
  clone(e, t = null, i) {
    return new o(e, this.getScene(), t, this, i);
  }
  /**
   * Creates a new InstancedLinesMesh object from the mesh model.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances
   * @param name defines the name of the new instance
   * @returns a new InstancedLinesMesh
   */
  createInstance(e) {
    const t = new x(e, this);
    if (this.instancedBuffers) {
      t.instancedBuffers = {};
      for (const i in this.instancedBuffers)
        t.instancedBuffers[i] = this.instancedBuffers[i];
    }
    return t;
  }
  /**
   * Serializes this ground mesh
   * @param serializationObject object to write serialization to
   */
  serialize(e) {
    super.serialize(e), e.color = this.color.asArray(), e.alpha = this.alpha;
  }
  /**
   * Parses a serialized ground mesh
   * @param parsedMesh the serialized mesh
   * @param scene the scene to create the ground mesh in
   * @returns the created ground mesh
   */
  static Parse(e, t) {
    const i = new o(e.name, t);
    return i.color = h.FromArray(e.color), i.alpha = e.alpha, i;
  }
}
class x extends p {
  constructor(e, t) {
    super(e, t), this.intersectionThreshold = t.intersectionThreshold;
  }
  /**
   * @returns the string "InstancedLinesMesh".
   */
  getClassName() {
    return "InstancedLinesMesh";
  }
}
export {
  x as I,
  o as L
};
//# sourceMappingURL=linesMesh-CY8nqbnx.js.map
