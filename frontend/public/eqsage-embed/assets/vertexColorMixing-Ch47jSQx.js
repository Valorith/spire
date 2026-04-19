import { M as s, x as n } from "./embed-entry-Dediijbe.js";
import { M as a } from "./material-Cr06Rh_F.js";
class u extends a {
  constructor(e, r, t = !0) {
    super(e, r), this._normalMatrix = new s(), this._storeEffectOnSubMeshes = t;
  }
  getEffect() {
    return this._storeEffectOnSubMeshes ? this._activeEffect : super.getEffect();
  }
  isReady(e, r) {
    return e ? !this._storeEffectOnSubMeshes || !e.subMeshes || e.subMeshes.length === 0 ? !0 : this.isReadyForSubMesh(e, e.subMeshes[0], r) : !1;
  }
  _isReadyForSubMesh(e) {
    const r = e.materialDefines;
    return !!(!this.checkReadyOnEveryCall && e.effect && r && r._renderId === this.getScene().getRenderId());
  }
  /**
   * Binds the given world matrix to the active effect
   *
   * @param world the matrix to bind
   */
  bindOnlyWorldMatrix(e) {
    this._activeEffect.setMatrix("world", e);
  }
  /**
   * Binds the given normal matrix to the active effect
   *
   * @param normalMatrix the matrix to bind
   */
  bindOnlyNormalMatrix(e) {
    this._activeEffect.setMatrix("normalMatrix", e);
  }
  bind(e, r) {
    r && this.bindForSubMesh(e, r, r.subMeshes[0]);
  }
  _afterBind(e, r = null, t) {
    super._afterBind(e, r, t), this.getScene()._cachedEffect = r, t ? t._drawWrapper._forceRebindOnNextCall = !1 : this._drawWrapper._forceRebindOnNextCall = !1;
  }
  _mustRebind(e, r, t, i = 1) {
    return t._drawWrapper._forceRebindOnNextCall || e.isCachedMaterialInvalid(this, r, i);
  }
  dispose(e, r, t) {
    this._activeEffect = void 0, super.dispose(e, r, t);
  }
}
const f = "vertexColorMixing", d = `#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
vColor=vec4(1.0);
#ifdef VERTEXCOLOR
#ifdef VERTEXALPHA
vColor*=color;
#else
vColor.rgb*=color.rgb;
#endif
#endif
#ifdef INSTANCESCOLOR
vColor*=instanceColor;
#endif
#endif
`;
n.IncludesShadersStore[f] = d;
export {
  u as P
};
//# sourceMappingURL=vertexColorMixing-Ch47jSQx.js.map
