import { x as c, b as S, c as T, af as D, R as O } from "./embed-entry-BgvWRWVI.js";
import { P as v } from "./postProcess-CzjDSNvf.js";
import { T as N } from "./texture-CF8YkJua.js";
import { S as I } from "./decorators.serialization-C2D-FLnh.js";
const W = "kernelBlurVaryingDeclaration", b = "varying vec2 sampleCoord{X};";
c.IncludesShadersStore[W] = b;
const y = "packingFunctions", K = `vec4 pack(float depth)
{const vec4 bit_shift=vec4(255.0*255.0*255.0,255.0*255.0,255.0,1.0);const vec4 bit_mask=vec4(0.0,1.0/255.0,1.0/255.0,1.0/255.0);vec4 res=fract(depth*bit_shift);res-=res.xxyz*bit_mask;return res;}
float unpack(vec4 color)
{const vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);return dot(color,bit_shift);}`;
c.IncludesShadersStore[y] = K;
const L = "kernelBlurFragment", R = `#ifdef DOF
factor=sampleCoC(sampleCoord{X}); 
computedWeight=KERNEL_WEIGHT{X}*factor;sumOfWeights+=computedWeight;
#else
computedWeight=KERNEL_WEIGHT{X};
#endif
#ifdef PACKEDFLOAT
blend+=unpack(texture2D(textureSampler,sampleCoord{X}))*computedWeight;
#else
blend+=texture2D(textureSampler,sampleCoord{X})*computedWeight;
#endif
`;
c.IncludesShadersStore[L] = R;
const M = "kernelBlurFragment2", A = `#ifdef DOF
factor=sampleCoC(sampleCenter+delta*KERNEL_DEP_OFFSET{X});computedWeight=KERNEL_DEP_WEIGHT{X}*factor;sumOfWeights+=computedWeight;
#else
computedWeight=KERNEL_DEP_WEIGHT{X};
#endif
#ifdef PACKEDFLOAT
blend+=unpack(texture2D(textureSampler,sampleCenter+delta*KERNEL_DEP_OFFSET{X}))*computedWeight;
#else
blend+=texture2D(textureSampler,sampleCenter+delta*KERNEL_DEP_OFFSET{X})*computedWeight;
#endif
`;
c.IncludesShadersStore[M] = A;
const B = "kernelBlurPixelShader", $ = `uniform sampler2D textureSampler;uniform vec2 delta;varying vec2 sampleCenter;
#ifdef DOF
uniform sampler2D circleOfConfusionSampler;float sampleCoC(in vec2 offset) {float coc=texture2D(circleOfConfusionSampler,offset).r;return coc; }
#endif
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#ifdef PACKEDFLOAT
#include<packingFunctions>
#endif
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{float computedWeight=0.0;
#ifdef PACKEDFLOAT
float blend=0.;
#else
vec4 blend=vec4(0.);
#endif
#ifdef DOF
float sumOfWeights=CENTER_WEIGHT; 
float factor=0.0;
#ifdef PACKEDFLOAT
blend+=unpack(texture2D(textureSampler,sampleCenter))*CENTER_WEIGHT;
#else
blend+=texture2D(textureSampler,sampleCenter)*CENTER_WEIGHT;
#endif
#endif
#include<kernelBlurFragment>[0..varyingCount]
#include<kernelBlurFragment2>[0..depCount]
#ifdef PACKEDFLOAT
gl_FragColor=pack(blend);
#else
gl_FragColor=blend;
#endif
#ifdef DOF
gl_FragColor/=sumOfWeights;
#endif
}`;
c.ShadersStore[B] = $;
const P = "kernelBlurVertex", X = "sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};";
c.IncludesShadersStore[P] = X;
const w = "kernelBlurVertexShader", V = `attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;
c.ShadersStore[w] = V;
class f extends v {
  /**
   * Sets the length in pixels of the blur sample region
   */
  set kernel(t) {
    this._idealKernel !== t && (t = Math.max(t, 1), this._idealKernel = t, this._kernel = this._nearestBestKernel(t), this._blockCompilation || this._updateParameters());
  }
  /**
   * Gets the length in pixels of the blur sample region
   */
  get kernel() {
    return this._idealKernel;
  }
  /**
   * Sets whether or not the blur needs to unpack/repack floats
   */
  set packedFloat(t) {
    this._packedFloat !== t && (this._packedFloat = t, this._blockCompilation || this._updateParameters());
  }
  /**
   * Gets whether or not the blur is unpacking/repacking floats
   */
  get packedFloat() {
    return this._packedFloat;
  }
  /**
   * Gets a string identifying the name of the class
   * @returns "BlurPostProcess" string
   */
  getClassName() {
    return "BlurPostProcess";
  }
  /**
   * Creates a new instance BlurPostProcess
   * @param name The name of the effect.
   * @param direction The direction in which to blur the image.
   * @param kernel The size of the kernel to be used when computing the blur. eg. Size of 3 will blur the center pixel by 2 pixels surrounding it.
   * @param options The required width/height ratio to downsize to before computing the render pass. (Use 1.0 for full size)
   * @param camera The camera to apply the render pass to.
   * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
   * @param engine The engine which the post process will be applied. (default: current engine)
   * @param reusable If the post process can be reused on the same frame. (default: false)
   * @param textureType Type of textures used when performing the post process. (default: 0)
   * @param defines
   * @param _blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
   * @param textureFormat Format of textures used when performing the post process. (default: TEXTUREFORMAT_RGBA)
   */
  constructor(t, n, r, l, a, i = N.BILINEAR_SAMPLINGMODE, h, p, m = 0, s = "", E = !1, g = 5) {
    super(t, "kernelBlur", ["delta", "direction"], ["circleOfConfusionSampler"], l, a, i, h, p, null, m, "kernelBlur", { varyingCount: 0, depCount: 0 }, !0, g), this._blockCompilation = E, this._packedFloat = !1, this._staticDefines = "", this._staticDefines = s, this.direction = n, this.onApplyObservable.add((d) => {
      this._outputTexture ? d.setFloat2("delta", 1 / this._outputTexture.width * this.direction.x, 1 / this._outputTexture.height * this.direction.y) : d.setFloat2("delta", 1 / this.width * this.direction.x, 1 / this.height * this.direction.y);
    }), this.kernel = r;
  }
  /**
   * Updates the effect with the current post process compile time values and recompiles the shader.
   * @param defines Define statements that should be added at the beginning of the shader. (default: null)
   * @param uniforms Set of uniform variables that will be passed to the shader. (default: null)
   * @param samplers Set of Texture2D variables that will be passed to the shader. (default: null)
   * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
   * @param onCompiled Called when the shader has been compiled.
   * @param onError Called if there is an error when compiling a shader.
   */
  updateEffect(t = null, n = null, r = null, l, a, i) {
    this._updateParameters(a, i);
  }
  _updateParameters(t, n) {
    const r = this._kernel, l = (r - 1) / 2;
    let a = [], i = [], h = 0;
    for (let e = 0; e < r; e++) {
      const u = e / (r - 1), C = this._gaussianWeight(u * 2 - 1);
      a[e] = e - l, i[e] = C, h += C;
    }
    for (let e = 0; e < i.length; e++)
      i[e] /= h;
    const p = [], m = [], s = [];
    for (let e = 0; e <= l; e += 2) {
      const u = Math.min(e + 1, Math.floor(l));
      if (e === u)
        s.push({ o: a[e], w: i[e] });
      else {
        const x = u === l, k = i[e] + i[u] * (x ? 0.5 : 1), F = a[e] + 1 / (1 + i[e] / i[u]);
        F === 0 ? (s.push({ o: a[e], w: i[e] }), s.push({ o: a[e + 1], w: i[e + 1] })) : (s.push({ o: F, w: k }), s.push({ o: -F, w: k }));
      }
    }
    for (let e = 0; e < s.length; e++)
      m[e] = s[e].o, p[e] = s[e].w;
    a = m, i = p;
    const E = this.getEngine().getCaps().maxVaryingVectors, g = Math.max(E, 0) - 1;
    let d = Math.min(a.length, g), o = "";
    o += this._staticDefines, this._staticDefines.indexOf("DOF") != -1 && (o += `#define CENTER_WEIGHT ${this._glslFloat(i[d - 1])}
`, d--);
    for (let e = 0; e < d; e++)
      o += `#define KERNEL_OFFSET${e} ${this._glslFloat(a[e])}
`, o += `#define KERNEL_WEIGHT${e} ${this._glslFloat(i[e])}
`;
    let _ = 0;
    for (let e = g; e < a.length; e++)
      o += `#define KERNEL_DEP_OFFSET${_} ${this._glslFloat(a[e])}
`, o += `#define KERNEL_DEP_WEIGHT${_} ${this._glslFloat(i[e])}
`, _++;
    this.packedFloat && (o += "#define PACKEDFLOAT 1"), this._blockCompilation = !1, super.updateEffect(o, null, null, {
      varyingCount: d,
      depCount: _
    }, t, n);
  }
  /**
   * Best kernels are odd numbers that when divided by 2, their integer part is even, so 5, 9 or 13.
   * Other odd kernels optimize correctly but require proportionally more samples, even kernels are
   * possible but will produce minor visual artifacts. Since each new kernel requires a new shader we
   * want to minimize kernel changes, having gaps between physical kernels is helpful in that regard.
   * The gaps between physical kernels are compensated for in the weighting of the samples
   * @param idealKernel Ideal blur kernel.
   * @returns Nearest best kernel.
   */
  _nearestBestKernel(t) {
    const n = Math.round(t);
    for (const r of [n, n - 1, n + 1, n - 2, n + 2])
      if (r % 2 !== 0 && Math.floor(r / 2) % 2 === 0 && r > 0)
        return Math.max(r, 3);
    return Math.max(n, 3);
  }
  /**
   * Calculates the value of a Gaussian distribution with sigma 3 at a given point.
   * @param x The point on the Gaussian distribution to sample.
   * @returns the value of the Gaussian function at x.
   */
  _gaussianWeight(t) {
    const n = 0.3333333333333333, r = Math.sqrt(2 * Math.PI) * n, l = -(t * t / (2 * n * n));
    return 1 / r * Math.exp(l);
  }
  /**
   * Generates a string that can be used as a floating point number in GLSL.
   * @param x Value to print.
   * @param decimalFigures Number of decimal places to print the number to (excluding trailing 0s).
   * @returns GLSL float string.
   */
  _glslFloat(t, n = 8) {
    return t.toFixed(n).replace(/0+$/, "");
  }
  /**
   * @internal
   */
  static _Parse(t, n, r, l) {
    return I.Parse(() => new f(t.name, t.direction, t.kernel, t.options, n, t.renderTargetSamplingMode, r.getEngine(), t.reusable, t.textureType, void 0, !1), t, r, l);
  }
}
S([
  T("kernel")
], f.prototype, "_kernel", void 0);
S([
  T("packedFloat")
], f.prototype, "_packedFloat", void 0);
S([
  D()
], f.prototype, "direction", void 0);
O("BABYLON.BlurPostProcess", f);
export {
  f as B
};
//# sourceMappingURL=blurPostProcess-Do1mtOl3.js.map
