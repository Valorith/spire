import { P as q } from "./postProcess-CEDAC-hv.js";
import { x as O, a as t, i as r, w as R, ag as v, h as G } from "./embed-entry-BKE21f6Q.js";
import "./helperFunctions-D_BKtoXY.js";
import { A as U } from "./textureTools-BkQxPbFf.js";
import "./math.axis-DyelT9ZM.js";
import "./math.plane-CuDptDjB.js";
import "./math.path-BUTyAVzg.js";
import { B as H } from "./texture-BWPw_5Qg.js";
const X = "rgbdDecodePixelShader", Y = `varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=vec4(fromRGBD(texture2D(textureSampler,vUV)),1.0);}`;
O.ShadersStore[X] = Y;
class te {
  /**
   * Expand the RGBD Texture from RGBD to Half Float if possible.
   * @param texture the texture to expand.
   */
  static ExpandRGBDTexture(e) {
    const s = e._texture;
    if (!s || !e.isRGBD)
      return;
    const c = s.getEngine(), i = c.getCaps(), a = s.isReady;
    let o = !1;
    i.textureHalfFloatRender && i.textureHalfFloatLinearFiltering ? (o = !0, s.type = 2) : i.textureFloatRender && i.textureFloatLinearFiltering && (o = !0, s.type = 1), o && (s.isReady = !1, s._isRGBD = !1, s.invertY = !1);
    const x = () => {
      const f = new q("rgbdDecode", "rgbdDecode", null, null, 1, null, 3, c, !1, void 0, s.type, void 0, null, !1);
      f.externalTextureSamplerBinding = !0;
      const A = c.createRenderTargetTexture(s.width, {
        generateDepthBuffer: !1,
        generateMipMaps: !1,
        generateStencilBuffer: !1,
        samplingMode: s.samplingMode,
        type: s.type,
        format: 5
      });
      f.getEffect().executeWhenCompiled(() => {
        f.onApply = (g) => {
          g._bindTexture("textureSampler", s), g.setFloat2("scale", 1, 1);
        }, e.getScene().postProcessManager.directRender([f], A, !0), c.restoreDefaultFramebuffer(), c._releaseTexture(s), f && f.dispose(), A._swapAndDie(s), s.isReady = !0;
      });
    };
    o && (a ? x() : e.onLoadObservable.addOnce(x));
  }
  /**
   * Encode the texture to RGBD if possible.
   * @param internalTexture the texture to encode
   * @param scene the scene hosting the texture
   * @param outputTextureType type of the texture in which the encoding is performed
   * @returns a promise with the internalTexture having its texture replaced by the result of the processing
   */
  static EncodeTextureToRGBD(e, s, c = 0) {
    return U("rgbdEncode", e, s, c, 1, 5);
  }
}
const m = [
  Math.sqrt(1 / (4 * Math.PI)),
  -Math.sqrt(3 / (4 * Math.PI)),
  Math.sqrt(3 / (4 * Math.PI)),
  -Math.sqrt(3 / (4 * Math.PI)),
  Math.sqrt(15 / (4 * Math.PI)),
  -Math.sqrt(15 / (4 * Math.PI)),
  Math.sqrt(5 / (16 * Math.PI)),
  -Math.sqrt(15 / (4 * Math.PI)),
  Math.sqrt(15 / (16 * Math.PI))
  // l22
], k = [
  () => 1,
  (l) => l.y,
  (l) => l.z,
  (l) => l.x,
  (l) => l.x * l.y,
  (l) => l.y * l.z,
  (l) => 3 * l.z * l.z - 1,
  (l) => l.x * l.z,
  (l) => l.x * l.x - l.y * l.y
  // l22
], d = (l, e) => m[l] * k[l](e), u = [Math.PI, 2 * Math.PI / 3, 2 * Math.PI / 3, 2 * Math.PI / 3, Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4];
class V {
  constructor() {
    this.preScaled = !1, this.l00 = t.Zero(), this.l1_1 = t.Zero(), this.l10 = t.Zero(), this.l11 = t.Zero(), this.l2_2 = t.Zero(), this.l2_1 = t.Zero(), this.l20 = t.Zero(), this.l21 = t.Zero(), this.l22 = t.Zero();
  }
  /**
   * Adds a light to the spherical harmonics
   * @param direction the direction of the light
   * @param color the color of the light
   * @param deltaSolidAngle the delta solid angle of the light
   */
  addLight(e, s, c) {
    r.Vector3[0].set(s.r, s.g, s.b);
    const i = r.Vector3[0], a = r.Vector3[1];
    i.scaleToRef(c, a), a.scaleToRef(d(0, e), r.Vector3[2]), this.l00.addInPlace(r.Vector3[2]), a.scaleToRef(d(1, e), r.Vector3[2]), this.l1_1.addInPlace(r.Vector3[2]), a.scaleToRef(d(2, e), r.Vector3[2]), this.l10.addInPlace(r.Vector3[2]), a.scaleToRef(d(3, e), r.Vector3[2]), this.l11.addInPlace(r.Vector3[2]), a.scaleToRef(d(4, e), r.Vector3[2]), this.l2_2.addInPlace(r.Vector3[2]), a.scaleToRef(d(5, e), r.Vector3[2]), this.l2_1.addInPlace(r.Vector3[2]), a.scaleToRef(d(6, e), r.Vector3[2]), this.l20.addInPlace(r.Vector3[2]), a.scaleToRef(d(7, e), r.Vector3[2]), this.l21.addInPlace(r.Vector3[2]), a.scaleToRef(d(8, e), r.Vector3[2]), this.l22.addInPlace(r.Vector3[2]);
  }
  /**
   * Scales the spherical harmonics by the given amount
   * @param scale the amount to scale
   */
  scaleInPlace(e) {
    this.l00.scaleInPlace(e), this.l1_1.scaleInPlace(e), this.l10.scaleInPlace(e), this.l11.scaleInPlace(e), this.l2_2.scaleInPlace(e), this.l2_1.scaleInPlace(e), this.l20.scaleInPlace(e), this.l21.scaleInPlace(e), this.l22.scaleInPlace(e);
  }
  /**
   * Convert from incident radiance (Li) to irradiance (E) by applying convolution with the cosine-weighted hemisphere.
   *
   * ```
   * E_lm = A_l * L_lm
   * ```
   *
   * In spherical harmonics this convolution amounts to scaling factors for each frequency band.
   * This corresponds to equation 5 in "An Efficient Representation for Irradiance Environment Maps", where
   * the scaling factors are given in equation 9.
   */
  convertIncidentRadianceToIrradiance() {
    this.l00.scaleInPlace(u[0]), this.l1_1.scaleInPlace(u[1]), this.l10.scaleInPlace(u[2]), this.l11.scaleInPlace(u[3]), this.l2_2.scaleInPlace(u[4]), this.l2_1.scaleInPlace(u[5]), this.l20.scaleInPlace(u[6]), this.l21.scaleInPlace(u[7]), this.l22.scaleInPlace(u[8]);
  }
  /**
   * Convert from irradiance to outgoing radiance for Lambertian BDRF, suitable for efficient shader evaluation.
   *
   * ```
   * L = (1/pi) * E * rho
   * ```
   *
   * This is done by an additional scale by 1/pi, so is a fairly trivial operation but important conceptually.
   */
  convertIrradianceToLambertianRadiance() {
    this.scaleInPlace(1 / Math.PI);
  }
  /**
   * Integrates the reconstruction coefficients directly in to the SH preventing further
   * required operations at run time.
   *
   * This is simply done by scaling back the SH with Ylm constants parameter.
   * The trigonometric part being applied by the shader at run time.
   */
  preScaleForRendering() {
    this.preScaled = !0, this.l00.scaleInPlace(m[0]), this.l1_1.scaleInPlace(m[1]), this.l10.scaleInPlace(m[2]), this.l11.scaleInPlace(m[3]), this.l2_2.scaleInPlace(m[4]), this.l2_1.scaleInPlace(m[5]), this.l20.scaleInPlace(m[6]), this.l21.scaleInPlace(m[7]), this.l22.scaleInPlace(m[8]);
  }
  /**
   * update the spherical harmonics coefficients from the given array
   * @param data defines the 9x3 coefficients (l00, l1-1, l10, l11, l2-2, l2-1, l20, l21, l22)
   * @returns the spherical harmonics (this)
   */
  updateFromArray(e) {
    return t.FromArrayToRef(e[0], 0, this.l00), t.FromArrayToRef(e[1], 0, this.l1_1), t.FromArrayToRef(e[2], 0, this.l10), t.FromArrayToRef(e[3], 0, this.l11), t.FromArrayToRef(e[4], 0, this.l2_2), t.FromArrayToRef(e[5], 0, this.l2_1), t.FromArrayToRef(e[6], 0, this.l20), t.FromArrayToRef(e[7], 0, this.l21), t.FromArrayToRef(e[8], 0, this.l22), this;
  }
  /**
   * update the spherical harmonics coefficients from the given floats array
   * @param data defines the 9x3 coefficients (l00, l1-1, l10, l11, l2-2, l2-1, l20, l21, l22)
   * @returns the spherical harmonics (this)
   */
  updateFromFloatsArray(e) {
    return t.FromFloatsToRef(e[0], e[1], e[2], this.l00), t.FromFloatsToRef(e[3], e[4], e[5], this.l1_1), t.FromFloatsToRef(e[6], e[7], e[8], this.l10), t.FromFloatsToRef(e[9], e[10], e[11], this.l11), t.FromFloatsToRef(e[12], e[13], e[14], this.l2_2), t.FromFloatsToRef(e[15], e[16], e[17], this.l2_1), t.FromFloatsToRef(e[18], e[19], e[20], this.l20), t.FromFloatsToRef(e[21], e[22], e[23], this.l21), t.FromFloatsToRef(e[24], e[25], e[26], this.l22), this;
  }
  /**
   * Constructs a spherical harmonics from an array.
   * @param data defines the 9x3 coefficients (l00, l1-1, l10, l11, l2-2, l2-1, l20, l21, l22)
   * @returns the spherical harmonics
   */
  static FromArray(e) {
    return new V().updateFromArray(e);
  }
  // Keep for references.
  /**
   * Gets the spherical harmonics from polynomial
   * @param polynomial the spherical polynomial
   * @returns the spherical harmonics
   */
  static FromPolynomial(e) {
    const s = new V();
    return s.l00 = e.xx.scale(0.376127).add(e.yy.scale(0.376127)).add(e.zz.scale(0.376126)), s.l1_1 = e.y.scale(0.977204), s.l10 = e.z.scale(0.977204), s.l11 = e.x.scale(0.977204), s.l2_2 = e.xy.scale(1.16538), s.l2_1 = e.yz.scale(1.16538), s.l20 = e.zz.scale(1.34567).subtract(e.xx.scale(0.672834)).subtract(e.yy.scale(0.672834)), s.l21 = e.zx.scale(1.16538), s.l22 = e.xx.scale(1.16538).subtract(e.yy.scale(1.16538)), s.l1_1.scaleInPlace(-1), s.l11.scaleInPlace(-1), s.l2_1.scaleInPlace(-1), s.l21.scaleInPlace(-1), s.scaleInPlace(Math.PI), s;
  }
}
class b {
  constructor() {
    this.x = t.Zero(), this.y = t.Zero(), this.z = t.Zero(), this.xx = t.Zero(), this.yy = t.Zero(), this.zz = t.Zero(), this.xy = t.Zero(), this.yz = t.Zero(), this.zx = t.Zero();
  }
  /**
   * The spherical harmonics used to create the polynomials.
   */
  get preScaledHarmonics() {
    return this._harmonics || (this._harmonics = V.FromPolynomial(this)), this._harmonics.preScaled || this._harmonics.preScaleForRendering(), this._harmonics;
  }
  /**
   * Adds an ambient color to the spherical polynomial
   * @param color the color to add
   */
  addAmbient(e) {
    r.Vector3[0].copyFromFloats(e.r, e.g, e.b);
    const s = r.Vector3[0];
    this.xx.addInPlace(s), this.yy.addInPlace(s), this.zz.addInPlace(s);
  }
  /**
   * Scales the spherical polynomial by the given amount
   * @param scale the amount to scale
   */
  scaleInPlace(e) {
    this.x.scaleInPlace(e), this.y.scaleInPlace(e), this.z.scaleInPlace(e), this.xx.scaleInPlace(e), this.yy.scaleInPlace(e), this.zz.scaleInPlace(e), this.yz.scaleInPlace(e), this.zx.scaleInPlace(e), this.xy.scaleInPlace(e);
  }
  /**
   * Updates the spherical polynomial from harmonics
   * @param harmonics the spherical harmonics
   * @returns the spherical polynomial
   */
  updateFromHarmonics(e) {
    return this._harmonics = e, this.x.copyFrom(e.l11), this.x.scaleInPlace(1.02333).scaleInPlace(-1), this.y.copyFrom(e.l1_1), this.y.scaleInPlace(1.02333).scaleInPlace(-1), this.z.copyFrom(e.l10), this.z.scaleInPlace(1.02333), this.xx.copyFrom(e.l00), r.Vector3[0].copyFrom(e.l20).scaleInPlace(0.247708), r.Vector3[1].copyFrom(e.l22).scaleInPlace(0.429043), this.xx.scaleInPlace(0.886277).subtractInPlace(r.Vector3[0]).addInPlace(r.Vector3[1]), this.yy.copyFrom(e.l00), this.yy.scaleInPlace(0.886277).subtractInPlace(r.Vector3[0]).subtractInPlace(r.Vector3[1]), this.zz.copyFrom(e.l00), r.Vector3[0].copyFrom(e.l20).scaleInPlace(0.495417), this.zz.scaleInPlace(0.886277).addInPlace(r.Vector3[0]), this.yz.copyFrom(e.l2_1), this.yz.scaleInPlace(0.858086).scaleInPlace(-1), this.zx.copyFrom(e.l21), this.zx.scaleInPlace(0.858086).scaleInPlace(-1), this.xy.copyFrom(e.l2_2), this.xy.scaleInPlace(0.858086), this.scaleInPlace(1 / Math.PI), this;
  }
  /**
   * Gets the spherical polynomial from harmonics
   * @param harmonics the spherical harmonics
   * @returns the spherical polynomial
   */
  static FromHarmonics(e) {
    return new b().updateFromHarmonics(e);
  }
  /**
   * Constructs a spherical polynomial from an array.
   * @param data defines the 9x3 coefficients (x, y, z, xx, yy, zz, yz, zx, xy)
   * @returns the spherical polynomial
   */
  static FromArray(e) {
    const s = new b();
    return t.FromArrayToRef(e[0], 0, s.x), t.FromArrayToRef(e[1], 0, s.y), t.FromArrayToRef(e[2], 0, s.z), t.FromArrayToRef(e[3], 0, s.xx), t.FromArrayToRef(e[4], 0, s.yy), t.FromArrayToRef(e[5], 0, s.zz), t.FromArrayToRef(e[6], 0, s.yz), t.FromArrayToRef(e[7], 0, s.zx), t.FromArrayToRef(e[8], 0, s.xy), s;
  }
}
class M {
  constructor(e, s, c, i) {
    this.name = e, this.worldAxisForNormal = s, this.worldAxisForFileX = c, this.worldAxisForFileY = i;
  }
}
class E {
  /**
   * Converts a texture to the according Spherical Polynomial data.
   * This extracts the first 3 orders only as they are the only one used in the lighting.
   *
   * @param texture The texture to extract the information from.
   * @returns The Spherical Polynomial data.
   */
  static ConvertCubeMapTextureToSphericalPolynomial(e) {
    if (!e.isCube)
      return null;
    e.getScene()?.getEngine().flushFramebuffer();
    const s = e.getSize().width, c = e.readPixels(0, void 0, void 0, !1), i = e.readPixels(1, void 0, void 0, !1);
    let a, o;
    e.isRenderTarget ? (a = e.readPixels(3, void 0, void 0, !1), o = e.readPixels(2, void 0, void 0, !1)) : (a = e.readPixels(2, void 0, void 0, !1), o = e.readPixels(3, void 0, void 0, !1));
    const x = e.readPixels(4, void 0, void 0, !1), f = e.readPixels(5, void 0, void 0, !1), A = e.gammaSpace, g = 5;
    let C = 0;
    return (e.textureType == 1 || e.textureType == 2) && (C = 1), new Promise((w) => {
      Promise.all([i, c, a, o, x, f]).then(([T, z, p, y, F, I]) => {
        const _ = {
          size: s,
          right: z,
          left: T,
          up: p,
          down: y,
          front: F,
          back: I,
          format: g,
          type: C,
          gammaSpace: A
        };
        w(this.ConvertCubeMapToSphericalPolynomial(_));
      });
    });
  }
  /**
   * Compute the area on the unit sphere of the rectangle defined by (x,y) and the origin
   * See https://www.rorydriscoll.com/2012/01/15/cubemap-texel-solid-angle/
   * @param x
   * @param y
   * @returns the area
   */
  static _AreaElement(e, s) {
    return Math.atan2(e * s, Math.sqrt(e * e + s * s + 1));
  }
  /**
   * Converts a cubemap to the according Spherical Polynomial data.
   * This extracts the first 3 orders only as they are the only one used in the lighting.
   *
   * @param cubeInfo The Cube map to extract the information from.
   * @returns The Spherical Polynomial data.
   */
  static ConvertCubeMapToSphericalPolynomial(e) {
    const s = new V();
    let c = 0;
    const i = 2 / e.size, a = i, o = 0.5 * i, x = o - 1;
    for (let w = 0; w < 6; w++) {
      const T = this._FileFaces[w], z = e[T.name];
      let p = x;
      const y = e.format === 5 ? 4 : 3;
      for (let F = 0; F < e.size; F++) {
        let I = x;
        for (let _ = 0; _ < e.size; _++) {
          const Z = T.worldAxisForFileX.scale(I).add(T.worldAxisForFileY.scale(p)).add(T.worldAxisForNormal);
          Z.normalize();
          const B = this._AreaElement(I - o, p - o) - this._AreaElement(I - o, p + o) - this._AreaElement(I + o, p - o) + this._AreaElement(I + o, p + o);
          let n = z[F * e.size * y + _ * y + 0], h = z[F * e.size * y + _ * y + 1], P = z[F * e.size * y + _ * y + 2];
          isNaN(n) && (n = 0), isNaN(h) && (h = 0), isNaN(P) && (P = 0), e.type === 0 && (n /= 255, h /= 255, P /= 255), e.gammaSpace && (n = Math.pow(R.Clamp(n), v), h = Math.pow(R.Clamp(h), v), P = Math.pow(R.Clamp(P), v));
          const S = this.MAX_HDRI_VALUE;
          if (this.PRESERVE_CLAMPED_COLORS) {
            const L = Math.max(n, h, P);
            if (L > S) {
              const D = S / L;
              n *= D, h *= D, P *= D;
            }
          } else
            n = R.Clamp(n, 0, S), h = R.Clamp(h, 0, S), P = R.Clamp(P, 0, S);
          const N = new G(n, h, P);
          s.addLight(Z, N, B), c += B, I += i;
        }
        p += a;
      }
    }
    const C = 4 * Math.PI * 6 / 6 / c;
    return s.scaleInPlace(C), s.convertIncidentRadianceToIrradiance(), s.convertIrradianceToLambertianRadiance(), b.FromHarmonics(s);
  }
}
E._FileFaces = [
  new M("right", new t(1, 0, 0), new t(0, 0, -1), new t(0, -1, 0)),
  new M("left", new t(-1, 0, 0), new t(0, 0, 1), new t(0, -1, 0)),
  new M("up", new t(0, 1, 0), new t(1, 0, 0), new t(0, 0, 1)),
  new M("down", new t(0, -1, 0), new t(1, 0, 0), new t(0, 0, -1)),
  new M("front", new t(0, 0, 1), new t(1, 0, 0), new t(0, -1, 0)),
  new M("back", new t(0, 0, -1), new t(-1, 0, 0), new t(0, -1, 0))
  // -Z bottom
];
E.MAX_HDRI_VALUE = 4096;
E.PRESERVE_CLAMPED_COLORS = !1;
H.prototype.forceSphericalPolynomialsRecompute = function() {
  this._texture && (this._texture._sphericalPolynomial = null, this._texture._sphericalPolynomialPromise = null, this._texture._sphericalPolynomialComputed = !1);
};
Object.defineProperty(H.prototype, "sphericalPolynomial", {
  get: function() {
    if (this._texture) {
      if (this._texture._sphericalPolynomial || this._texture._sphericalPolynomialComputed)
        return this._texture._sphericalPolynomial;
      if (this._texture.isReady)
        return this._texture._sphericalPolynomialPromise || (this._texture._sphericalPolynomialPromise = E.ConvertCubeMapTextureToSphericalPolynomial(this), this._texture._sphericalPolynomialPromise === null ? this._texture._sphericalPolynomialComputed = !0 : this._texture._sphericalPolynomialPromise.then((l) => {
          this._texture._sphericalPolynomial = l, this._texture._sphericalPolynomialComputed = !0;
        })), null;
    }
    return null;
  },
  set: function(l) {
    this._texture && (this._texture._sphericalPolynomial = l);
  },
  enumerable: !0,
  configurable: !0
});
export {
  E as C,
  te as R,
  b as S,
  V as a
};
//# sourceMappingURL=baseTexture.polynomial-DfC1zw11.js.map
