import { T as c } from "./texture-BSW_lwWZ.js";
import { R as A } from "./renderTargetTexture-BObPPMZL.js";
import { P as S } from "./passPostProcess-D09VUNV0.js";
import { P as u } from "./postProcess-CTHbURnG.js";
function w(e, n, o, a = !0) {
  const r = e.getScene(), f = r.getEngine(), s = new A("resized" + e.name, { width: n, height: o }, r, !e.noMipmap, !0, e._texture.type, !1, e.samplingMode, !1);
  s.wrapU = e.wrapU, s.wrapV = e.wrapV, s.uOffset = e.uOffset, s.vOffset = e.vOffset, s.uScale = e.uScale, s.vScale = e.vScale, s.uAng = e.uAng, s.vAng = e.vAng, s.wAng = e.wAng, s.coordinatesIndex = e.coordinatesIndex, s.level = e.level, s.anisotropicFilteringLevel = e.anisotropicFilteringLevel, s._texture.isReady = !1, e.wrapU = c.CLAMP_ADDRESSMODE, e.wrapV = c.CLAMP_ADDRESSMODE;
  const t = new S("pass", 1, null, a ? c.BILINEAR_SAMPLINGMODE : c.NEAREST_SAMPLINGMODE, f, !1, 0);
  return t.externalTextureSamplerBinding = !0, t.getEffect().executeWhenCompiled(() => {
    t.onApply = function(d) {
      d.setTexture("textureSampler", e);
    };
    const l = s.renderTarget;
    l && (r.postProcessManager.directRender([t], l), f.unBindFramebuffer(l), s.disposeFramebufferObjects(), t.dispose(), s.getInternalTexture().isReady = !0);
  }), s;
}
function P(e, n, o, a, r, f, s, t) {
  const l = n.getEngine();
  return n.isReady = !1, r = r ?? n.samplingMode, a = a ?? n.type, f = f ?? n.format, s = s ?? n.width, t = t ?? n.height, a === -1 && (a = 0), new Promise((d) => {
    const i = new u("postprocess", e, null, null, 1, null, r, l, !1, void 0, a, void 0, null, !1, f);
    i.externalTextureSamplerBinding = !0;
    const p = l.createRenderTargetTexture({ width: s, height: t }, {
      generateDepthBuffer: !1,
      generateMipMaps: !1,
      generateStencilBuffer: !1,
      samplingMode: r,
      type: a,
      format: f
    });
    i.getEffect().executeWhenCompiled(() => {
      i.onApply = (g) => {
        g._bindTexture("textureSampler", n), g.setFloat2("scale", 1, 1);
      }, o.postProcessManager.directRender([i], p, !0), l.restoreDefaultFramebuffer(), l._releaseTexture(n), i && i.dispose(), p._swapAndDie(n), n.type = a, n.format = 5, n.isReady = !0, d(n);
    });
  });
}
let E, m;
function T(e) {
  E || (E = new Float32Array(1), m = new Int32Array(E.buffer)), E[0] = e;
  const n = m[0];
  let o = n >> 16 & 32768, a = n >> 12 & 2047;
  const r = n >> 23 & 255;
  return r < 103 ? o : r > 142 ? (o |= 31744, o |= (r == 255 ? 0 : 1) && n & 8388607, o) : r < 113 ? (a |= 2048, o |= (a >> 114 - r) + (a >> 113 - r & 1), o) : (o |= r - 112 << 10 | a >> 1, o += a & 1, o);
}
function R(e) {
  const n = (e & 32768) >> 15, o = (e & 31744) >> 10, a = e & 1023;
  return o === 0 ? (n ? -1 : 1) * Math.pow(2, -14) * (a / Math.pow(2, 10)) : o == 31 ? a ? NaN : (n ? -1 : 1) * (1 / 0) : (n ? -1 : 1) * Math.pow(2, o - 15) * (1 + a / Math.pow(2, 10));
}
const M = async (e, n, o, a, r) => {
  const f = e.getScene(), s = f.getEngine();
  let t;
  if (!e.isCube)
    t = new u("lod", "lod", ["lod", "gamma"], null, 1, null, c.NEAREST_NEAREST_MIPNEAREST, s);
  else {
    const i = ["#define POSITIVEX", "#define NEGATIVEX", "#define POSITIVEY", "#define NEGATIVEY", "#define POSITIVEZ", "#define NEGATIVEZ"];
    t = new u("lodCube", "lodCube", ["lod", "gamma"], null, 1, null, c.NEAREST_NEAREST_MIPNEAREST, s, !1, i[a]);
  }
  await new Promise((i) => {
    t.getEffect().executeWhenCompiled(() => {
      i(0);
    });
  });
  const l = new A("temp", { width: n, height: o }, f, !1);
  t.onApply = function(i) {
    i.setTexture("textureSampler", e), i.setFloat("lod", r), i.setBool("gamma", e.gammaSpace);
  };
  const d = e.getInternalTexture();
  try {
    if (l.renderTarget && d) {
      const i = d.samplingMode;
      r !== 0 ? e.updateSamplingMode(c.NEAREST_NEAREST_MIPNEAREST) : e.updateSamplingMode(c.NEAREST_NEAREST), f.postProcessManager.directRender([t], l.renderTarget, !0), e.updateSamplingMode(i);
      const p = await s.readPixels(0, 0, n, o), g = new Uint8Array(p.buffer, 0, p.byteLength);
      return s.unBindFramebuffer(l.renderTarget), g;
    } else
      throw Error("Render to texture failed.");
  } finally {
    l.dispose(), t.dispose();
  }
};
async function I(e, n, o, a = 0, r = 0) {
  return !e.isReady() && e._texture && await new Promise((f, s) => {
    if (e._texture === null) {
      s(0);
      return;
    }
    e._texture.onLoadedObservable.addOnce(() => {
      f(0);
    });
  }), await M(e, n, o, a, r);
}
const O = {
  /**
   * Uses the GPU to create a copy texture rescaled at a given size
   * @param texture Texture to copy from
   * @param width defines the desired width
   * @param height defines the desired height
   * @param useBilinearMode defines if bilinear mode has to be used
   * @returns the generated texture
   */
  CreateResizedCopy: w,
  /**
   * Apply a post process to a texture
   * @param postProcessName name of the fragment post process
   * @param internalTexture the texture to encode
   * @param scene the scene hosting the texture
   * @param type type of the output texture. If not provided, use the one from internalTexture
   * @param samplingMode sampling mode to use to sample the source texture. If not provided, use the one from internalTexture
   * @param format format of the output texture. If not provided, use the one from internalTexture
   * @returns a promise with the internalTexture having its texture replaced by the result of the processing
   */
  ApplyPostProcess: P,
  /**
   * Converts a number to half float
   * @param value number to convert
   * @returns converted number
   */
  ToHalfFloat: T,
  /**
   * Converts a half float to a number
   * @param value half float to convert
   * @returns converted half float
   */
  FromHalfFloat: R,
  /**
   * Gets the data of the specified texture by rendering it to an intermediate RGBA texture and retrieving the bytes from it.
   * This is convienent to get 8-bit RGBA values for a texture in a GPU compressed format.
   * @param texture the source texture
   * @param width the width of the result, which does not have to match the source texture width
   * @param height the height of the result, which does not have to match the source texture height
   * @param face if the texture has multiple faces, the face index to use for the source
   * @param channels a filter for which of the RGBA channels to return in the result
   * @param lod if the texture has multiple LODs, the lod index to use for the source
   * @returns the 8-bit texture data
   */
  GetTextureDataAsync: I
};
export {
  P as A,
  w as C,
  R as F,
  I as G,
  O as T,
  T as a
};
//# sourceMappingURL=textureTools-DAXviqxZ.js.map
