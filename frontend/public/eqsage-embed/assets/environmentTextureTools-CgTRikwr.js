import { x as V, L as H, a as R, a1 as U, w as B, T as k, a0 as N } from "./embed-entry-BKE21f6Q.js";
import { S as j, R as Y } from "./baseTexture.polynomial-DfC1zw11.js";
import { B as W } from "./texture-BWPw_5Qg.js";
import { a as $ } from "./scene-BIBh3wH1.js";
import { P as J } from "./postProcess-CEDAC-hv.js";
import { D as Q } from "./renderTargetTexture-BMESl03G.js";
import "./engine-CDU55b-Q.js";
import "./helperFunctions-D_BKtoXY.js";
const q = "rgbdEncodePixelShader", K = `varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}`;
V.ShadersStore[q] = K;
const E = "image/png", M = 2, v = [134, 22, 135, 150, 246, 214, 150, 54];
function X(e) {
  const t = new DataView(e.buffer, e.byteOffset, e.byteLength);
  let o = 0;
  for (let l = 0; l < v.length; l++)
    if (t.getUint8(o++) !== v[l])
      return H.Error("Not a babylon environment map"), null;
  let r = "", n = 0;
  for (; n = t.getUint8(o++); )
    r += String.fromCharCode(n);
  let a = JSON.parse(r);
  return a = D(a), a.specular && (a.specular.specularDataPosition = o, a.specular.lodGenerationScale = a.specular.lodGenerationScale || 0.8), a;
}
function D(e) {
  if (e.version > M)
    throw new Error(`Unsupported babylon environment map version "${e.version}". Latest supported version is "${M}".`);
  return e.version === 2 || (e = { ...e, version: 2, imageType: E }), e;
}
async function Z(e, t = {}) {
  const o = e.getInternalTexture();
  if (!o)
    return Promise.reject("The cube texture is invalid.");
  const r = t.imageType ?? E, n = o.getEngine();
  if (e.textureType !== 2 && e.textureType !== 1 && e.textureType !== 0 && e.textureType !== 0 && e.textureType !== 7 && e.textureType !== -1)
    return Promise.reject("The cube texture should allow HDR (Full Float or Half Float).");
  let a = 1;
  if (!n.getCaps().textureFloatRender && (a = 2, !n.getCaps().textureHalfFloatRender))
    return Promise.reject("Env texture can only be created when the browser supports half float or full float rendering.");
  e.sphericalPolynomial;
  const l = e.getInternalTexture()?._sphericalPolynomialPromise, d = o.width, x = new $(n), w = {};
  n.flushFramebuffer();
  const m = B.ILog2(o.width);
  for (let s = 0; s <= m; s++) {
    const i = Math.pow(2, m - s);
    for (let u = 0; u < 6; u++) {
      let b = await e.readPixels(u, s, void 0, !1);
      if (b && b.byteLength === b.length) {
        const S = new Float32Array(b.byteLength * 4);
        for (let h = 0; h < b.byteLength; h++)
          S[h] = b[h] / 255, S[h] = Math.pow(S[h], 2.2);
        b = S;
      } else if (b && e.gammaSpace) {
        const S = b;
        for (let h = 0; h < S.length; h++)
          S[h] = Math.pow(S[h], 2.2);
      }
      const I = n.createRawTexture(b, i, i, 5, !1, !0, 1, null, a);
      await Y.EncodeTextureToRGBD(I, x, a);
      const G = await n._readTexturePixels(I, i, i), O = await Q.DumpDataAsync(i, i, G, r, void 0, !1, !0, t.imageQuality);
      w[s * 6 + u] = O, I.dispose();
    }
  }
  x.dispose(), l && await l;
  const A = {
    version: M,
    width: d,
    imageType: r,
    irradiance: ee(e),
    specular: {
      mipmaps: [],
      lodGenerationScale: e.lodGenerationScale
    }
  };
  let p = 0;
  for (let s = 0; s <= m; s++)
    for (let i = 0; i < 6; i++) {
      const u = w[s * 6 + i].byteLength;
      A.specular.mipmaps.push({
        length: u,
        position: p
      }), p += u;
    }
  const c = JSON.stringify(A), f = new ArrayBuffer(c.length + 1), y = new Uint8Array(f);
  for (let s = 0, i = c.length; s < i; s++)
    y[s] = c.charCodeAt(s);
  y[c.length] = 0;
  const T = v.length + p + f.byteLength, z = new ArrayBuffer(T), g = new Uint8Array(z), L = new DataView(z);
  let _ = 0;
  for (let s = 0; s < v.length; s++)
    L.setUint8(_++, v[s]);
  g.set(new Uint8Array(f), _), _ += f.byteLength;
  for (let s = 0; s <= m; s++)
    for (let i = 0; i < 6; i++) {
      const u = w[s * 6 + i];
      g.set(new Uint8Array(u), _), _ += u.byteLength;
    }
  return z;
}
function ee(e) {
  const t = e.sphericalPolynomial;
  return t == null ? null : {
    x: [t.x.x, t.x.y, t.x.z],
    y: [t.y.x, t.y.y, t.y.z],
    z: [t.z.x, t.z.y, t.z.z],
    xx: [t.xx.x, t.xx.y, t.xx.z],
    yy: [t.yy.x, t.yy.y, t.yy.z],
    zz: [t.zz.x, t.zz.y, t.zz.z],
    yz: [t.yz.x, t.yz.y, t.yz.z],
    zx: [t.zx.x, t.zx.y, t.zx.z],
    xy: [t.xy.x, t.xy.y, t.xy.z]
  };
}
function P(e, t) {
  t = D(t);
  const o = t.specular;
  let r = B.Log2(t.width);
  if (r = Math.round(r) + 1, o.mipmaps.length !== 6 * r)
    throw new Error(`Unsupported specular mipmaps number "${o.mipmaps.length}"`);
  const n = new Array(r);
  for (let a = 0; a < r; a++) {
    n[a] = new Array(6);
    for (let l = 0; l < 6; l++) {
      const d = o.mipmaps[a * 6 + l];
      n[a][l] = new Uint8Array(e.buffer, e.byteOffset + o.specularDataPosition + d.position, d.length);
    }
  }
  return n;
}
function te(e, t, o) {
  o = D(o);
  const r = o.specular;
  if (!r)
    return Promise.resolve();
  e._lodGenerationScale = r.lodGenerationScale;
  const n = P(t, o);
  return F(e, n, o.imageType);
}
function C(e, t, o, r, n, a, l, d, x, w, m) {
  return new Promise((A, p) => {
    if (o) {
      const c = t.createTexture(null, !0, !0, null, 1, null, (f) => {
        p(f);
      }, e);
      r.getEffect().executeWhenCompiled(() => {
        r.externalTextureSamplerBinding = !0, r.onApply = (f) => {
          f._bindTexture("textureSampler", c), f.setFloat2("scale", 1, t._features.needsInvertingBitmap && e instanceof ImageBitmap ? -1 : 1);
        }, t.scenes.length && (t.scenes[0].postProcessManager.directRender([r], w, !0, a, l), t.restoreDefaultFramebuffer(), c.dispose(), URL.revokeObjectURL(n), A());
      });
    } else {
      if (t._uploadImageToTexture(m, e, a, l), d) {
        const c = x[l];
        c && t._uploadImageToTexture(c._texture, e, a, 0);
      }
      A();
    }
  });
}
function F(e, t, o = E) {
  if (!k.IsExponentOfTwo(e.width))
    throw new Error("Texture size must be a power of two");
  const r = B.ILog2(e.width) + 1, n = e.getEngine();
  let a = !1, l = !1, d = null, x = null, w = null;
  const m = n.getCaps();
  if (e.format = 5, e.type = 0, e.generateMipMaps = !0, e._cachedAnisotropicFilteringLevel = null, n.updateTextureSamplingMode(3, e), m.textureLOD ? n._features.supportRenderAndCopyToLodForFloatTextures ? m.textureHalfFloatRender && m.textureHalfFloatLinearFiltering ? (a = !0, e.type = 2) : m.textureFloatRender && m.textureFloatLinearFiltering && (a = !0, e.type = 1) : a = !1 : (a = !1, l = !0, w = {}), a)
    d = new J("rgbdDecode", "rgbdDecode", null, null, 1, null, 3, n, !1, void 0, e.type, void 0, null, !1), e._isRGBD = !1, e.invertY = !1, x = n.createRenderTargetCubeTexture(e.width, {
      generateDepthBuffer: !1,
      generateMipMaps: !0,
      generateStencilBuffer: !1,
      samplingMode: 3,
      type: e.type,
      format: 5
    });
  else if (e._isRGBD = !0, e.invertY = !0, l) {
    const c = e._lodGenerationScale, f = e._lodGenerationOffset;
    for (let y = 0; y < 3; y++) {
      const z = 1 - y / 2, g = f, L = (r - 1) * c + f, _ = g + (L - g) * z, s = Math.round(Math.min(Math.max(_, 0), L)), i = new N(n, U.Temp);
      i.isCube = !0, i.invertY = !0, i.generateMipMaps = !1, n.updateTextureSamplingMode(2, i);
      const u = new W(null);
      switch (u._isCube = !0, u._texture = i, w[s] = u, y) {
        case 0:
          e._lodTextureLow = u;
          break;
        case 1:
          e._lodTextureMid = u;
          break;
        case 2:
          e._lodTextureHigh = u;
          break;
      }
    }
  }
  const A = [];
  for (let p = 0; p < t.length; p++)
    for (let c = 0; c < 6; c++) {
      const f = t[p][c], y = new Blob([f], { type: o }), T = URL.createObjectURL(y);
      let z;
      if (n._features.forceBitmapOverHTMLImageElement)
        z = n.createImageBitmap(y, { premultiplyAlpha: "none" }).then((g) => C(g, n, a, d, T, c, p, l, w, x, e));
      else {
        const g = new Image();
        g.src = T, z = new Promise((L, _) => {
          g.onload = () => {
            C(g, n, a, d, T, c, p, l, w, x, e).then(() => L()).catch((s) => {
              _(s);
            });
          }, g.onerror = (s) => {
            _(s);
          };
        });
      }
      A.push(z);
    }
  if (t.length < r) {
    let p;
    const c = Math.pow(2, r - 1 - t.length), f = c * c * 4;
    switch (e.type) {
      case 0: {
        p = new Uint8Array(f);
        break;
      }
      case 2: {
        p = new Uint16Array(f);
        break;
      }
      case 1: {
        p = new Float32Array(f);
        break;
      }
    }
    for (let y = t.length; y < r; y++)
      for (let T = 0; T < 6; T++)
        n._uploadArrayBufferViewToTexture(e, p, T, y);
  }
  return Promise.all(A).then(() => {
    x && (n._releaseTexture(e), x._swapAndDie(e)), d && d.dispose(), l && (e._lodTextureHigh && e._lodTextureHigh._texture && (e._lodTextureHigh._texture.isReady = !0), e._lodTextureMid && e._lodTextureMid._texture && (e._lodTextureMid._texture.isReady = !0), e._lodTextureLow && e._lodTextureLow._texture && (e._lodTextureLow._texture.isReady = !0));
  });
}
function re(e, t) {
  t = D(t);
  const o = t.irradiance;
  if (!o)
    return;
  const r = new j();
  R.FromArrayToRef(o.x, 0, r.x), R.FromArrayToRef(o.y, 0, r.y), R.FromArrayToRef(o.z, 0, r.z), R.FromArrayToRef(o.xx, 0, r.xx), R.FromArrayToRef(o.yy, 0, r.yy), R.FromArrayToRef(o.zz, 0, r.zz), R.FromArrayToRef(o.yz, 0, r.yz), R.FromArrayToRef(o.zx, 0, r.zx), R.FromArrayToRef(o.xy, 0, r.xy), e._sphericalPolynomial = r;
}
function pe(e, t, o, r, n) {
  const a = e.getEngine().createRawCubeTexture(null, e.width, e.format, e.type, e.generateMipMaps, e.invertY, e.samplingMode, e._compression), l = F(a, t).then(() => e);
  return e.onRebuildCallback = (d) => ({
    proxy: l,
    isReady: !0,
    isAsync: !0
  }), e._source = U.CubeRawRGBD, e._bufferViewArrayArray = t, e._lodGenerationScale = r, e._lodGenerationOffset = n, e._sphericalPolynomial = o, F(e, t).then(() => (e.isReady = !0, e));
}
const ue = {
  /**
   * Gets the environment info from an env file.
   * @param data The array buffer containing the .env bytes.
   * @returns the environment file info (the json header) if successfully parsed, normalized to the latest supported version.
   */
  GetEnvInfo: X,
  /**
   * Creates an environment texture from a loaded cube texture.
   * @param texture defines the cube texture to convert in env file
   * @param options options for the conversion process
   * @param options.imageType the mime type for the encoded images, with support for "image/png" (default) and "image/webp"
   * @param options.imageQuality the image quality of encoded WebP images.
   * @returns a promise containing the environment data if successful.
   */
  CreateEnvTextureAsync: Z,
  /**
   * Creates the ArrayBufferViews used for initializing environment texture image data.
   * @param data the image data
   * @param info parameters that determine what views will be created for accessing the underlying buffer
   * @returns the views described by info providing access to the underlying buffer
   */
  CreateImageDataArrayBufferViews: P,
  /**
   * Uploads the texture info contained in the env file to the GPU.
   * @param texture defines the internal texture to upload to
   * @param data defines the data to load
   * @param info defines the texture info retrieved through the GetEnvInfo method
   * @returns a promise
   */
  UploadEnvLevelsAsync: te,
  /**
   * Uploads the levels of image data to the GPU.
   * @param texture defines the internal texture to upload to
   * @param imageData defines the array buffer views of image data [mipmap][face]
   * @param imageType the mime type of the image data
   * @returns a promise
   */
  UploadLevelsAsync: F,
  /**
   * Uploads spherical polynomials information to the texture.
   * @param texture defines the texture we are trying to upload the information to
   * @param info defines the environment texture info retrieved through the GetEnvInfo method
   */
  UploadEnvSpherical: re
};
export {
  P as C,
  ue as E,
  X as G,
  re as U,
  pe as _,
  te as a,
  Z as b,
  F as c,
  D as n
};
//# sourceMappingURL=environmentTextureTools-CgTRikwr.js.map
