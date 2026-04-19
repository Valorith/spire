import { aj as j, L as y, x as V, w as ht, a1 as ge, aB as St, V as C, aC as yt, aD as Ct, a0 as Fe, T as oe, H as Bt, C as Pe, ah as Rt, a5 as It } from "./embed-entry-Bb6cfUYP.js";
import "./math.axis-CU2IA4no.js";
import "./math.plane--GFy_WPN.js";
import "./math.path-2Lw1sJUP.js";
import { a as Ye, E as Qe } from "./engine-Br2P72Us.js";
import { U as Ce } from "./uniformBuffer-D86J-jiB.js";
import { F as Tt } from "./textureTools-pnZZly8k.js";
import { P as dt } from "./perfCounter-B6haAspn.js";
var Xe;
(function(a) {
  a.LowPower = "low-power", a.HighPerformance = "high-performance";
})(Xe || (Xe = {}));
var ee;
(function(a) {
  a.DepthClipControl = "depth-clip-control", a.Depth32FloatStencil8 = "depth32float-stencil8", a.TextureCompressionBC = "texture-compression-bc", a.TextureCompressionETC2 = "texture-compression-etc2", a.TextureCompressionASTC = "texture-compression-astc", a.TimestampQuery = "timestamp-query", a.IndirectFirstInstance = "indirect-first-instance", a.ShaderF16 = "shader-f16", a.RG11B10UFloatRenderable = "rg11b10ufloat-renderable", a.BGRA8UnormStorage = "bgra8unorm-storage", a.Float32Filterable = "float32-filterable";
})(ee || (ee = {}));
var Ke;
(function(a) {
  a.Unmapped = "unmapped", a.Pending = "pending", a.Mapped = "mapped";
})(Ke || (Ke = {}));
var w;
(function(a) {
  a[a.MapRead = 1] = "MapRead", a[a.MapWrite = 2] = "MapWrite", a[a.CopySrc = 4] = "CopySrc", a[a.CopyDst = 8] = "CopyDst", a[a.Index = 16] = "Index", a[a.Vertex = 32] = "Vertex", a[a.Uniform = 64] = "Uniform", a[a.Storage = 128] = "Storage", a[a.Indirect = 256] = "Indirect", a[a.QueryResolve = 512] = "QueryResolve";
})(w || (w = {}));
var pe;
(function(a) {
  a[a.Read = 1] = "Read", a[a.Write = 2] = "Write";
})(pe || (pe = {}));
var X;
(function(a) {
  a.E1d = "1d", a.E2d = "2d", a.E3d = "3d";
})(X || (X = {}));
var F;
(function(a) {
  a[a.CopySrc = 1] = "CopySrc", a[a.CopyDst = 2] = "CopyDst", a[a.TextureBinding = 4] = "TextureBinding", a[a.StorageBinding = 8] = "StorageBinding", a[a.RenderAttachment = 16] = "RenderAttachment";
})(F || (F = {}));
var I;
(function(a) {
  a.E1d = "1d", a.E2d = "2d", a.E2dArray = "2d-array", a.Cube = "cube", a.CubeArray = "cube-array", a.E3d = "3d";
})(I || (I = {}));
var Z;
(function(a) {
  a.All = "all", a.StencilOnly = "stencil-only", a.DepthOnly = "depth-only";
})(Z || (Z = {}));
var i;
(function(a) {
  a.R8Unorm = "r8unorm", a.R8Snorm = "r8snorm", a.R8Uint = "r8uint", a.R8Sint = "r8sint", a.R16Uint = "r16uint", a.R16Sint = "r16sint", a.R16Float = "r16float", a.RG8Unorm = "rg8unorm", a.RG8Snorm = "rg8snorm", a.RG8Uint = "rg8uint", a.RG8Sint = "rg8sint", a.R32Uint = "r32uint", a.R32Sint = "r32sint", a.R32Float = "r32float", a.RG16Uint = "rg16uint", a.RG16Sint = "rg16sint", a.RG16Float = "rg16float", a.RGBA8Unorm = "rgba8unorm", a.RGBA8UnormSRGB = "rgba8unorm-srgb", a.RGBA8Snorm = "rgba8snorm", a.RGBA8Uint = "rgba8uint", a.RGBA8Sint = "rgba8sint", a.BGRA8Unorm = "bgra8unorm", a.BGRA8UnormSRGB = "bgra8unorm-srgb", a.RGB9E5UFloat = "rgb9e5ufloat", a.RGB10A2UINT = "rgb10a2uint", a.RGB10A2Unorm = "rgb10a2unorm", a.RG11B10UFloat = "rg11b10ufloat", a.RG32Uint = "rg32uint", a.RG32Sint = "rg32sint", a.RG32Float = "rg32float", a.RGBA16Uint = "rgba16uint", a.RGBA16Sint = "rgba16sint", a.RGBA16Float = "rgba16float", a.RGBA32Uint = "rgba32uint", a.RGBA32Sint = "rgba32sint", a.RGBA32Float = "rgba32float", a.Stencil8 = "stencil8", a.Depth16Unorm = "depth16unorm", a.Depth24Plus = "depth24plus", a.Depth24PlusStencil8 = "depth24plus-stencil8", a.Depth32Float = "depth32float", a.BC1RGBAUnorm = "bc1-rgba-unorm", a.BC1RGBAUnormSRGB = "bc1-rgba-unorm-srgb", a.BC2RGBAUnorm = "bc2-rgba-unorm", a.BC2RGBAUnormSRGB = "bc2-rgba-unorm-srgb", a.BC3RGBAUnorm = "bc3-rgba-unorm", a.BC3RGBAUnormSRGB = "bc3-rgba-unorm-srgb", a.BC4RUnorm = "bc4-r-unorm", a.BC4RSnorm = "bc4-r-snorm", a.BC5RGUnorm = "bc5-rg-unorm", a.BC5RGSnorm = "bc5-rg-snorm", a.BC6HRGBUFloat = "bc6h-rgb-ufloat", a.BC6HRGBFloat = "bc6h-rgb-float", a.BC7RGBAUnorm = "bc7-rgba-unorm", a.BC7RGBAUnormSRGB = "bc7-rgba-unorm-srgb", a.ETC2RGB8Unorm = "etc2-rgb8unorm", a.ETC2RGB8UnormSRGB = "etc2-rgb8unorm-srgb", a.ETC2RGB8A1Unorm = "etc2-rgb8a1unorm", a.ETC2RGB8A1UnormSRGB = "etc2-rgb8a1unorm-srgb", a.ETC2RGBA8Unorm = "etc2-rgba8unorm", a.ETC2RGBA8UnormSRGB = "etc2-rgba8unorm-srgb", a.EACR11Unorm = "eac-r11unorm", a.EACR11Snorm = "eac-r11snorm", a.EACRG11Unorm = "eac-rg11unorm", a.EACRG11Snorm = "eac-rg11snorm", a.ASTC4x4Unorm = "astc-4x4-unorm", a.ASTC4x4UnormSRGB = "astc-4x4-unorm-srgb", a.ASTC5x4Unorm = "astc-5x4-unorm", a.ASTC5x4UnormSRGB = "astc-5x4-unorm-srgb", a.ASTC5x5Unorm = "astc-5x5-unorm", a.ASTC5x5UnormSRGB = "astc-5x5-unorm-srgb", a.ASTC6x5Unorm = "astc-6x5-unorm", a.ASTC6x5UnormSRGB = "astc-6x5-unorm-srgb", a.ASTC6x6Unorm = "astc-6x6-unorm", a.ASTC6x6UnormSRGB = "astc-6x6-unorm-srgb", a.ASTC8x5Unorm = "astc-8x5-unorm", a.ASTC8x5UnormSRGB = "astc-8x5-unorm-srgb", a.ASTC8x6Unorm = "astc-8x6-unorm", a.ASTC8x6UnormSRGB = "astc-8x6-unorm-srgb", a.ASTC8x8Unorm = "astc-8x8-unorm", a.ASTC8x8UnormSRGB = "astc-8x8-unorm-srgb", a.ASTC10x5Unorm = "astc-10x5-unorm", a.ASTC10x5UnormSRGB = "astc-10x5-unorm-srgb", a.ASTC10x6Unorm = "astc-10x6-unorm", a.ASTC10x6UnormSRGB = "astc-10x6-unorm-srgb", a.ASTC10x8Unorm = "astc-10x8-unorm", a.ASTC10x8UnormSRGB = "astc-10x8-unorm-srgb", a.ASTC10x10Unorm = "astc-10x10-unorm", a.ASTC10x10UnormSRGB = "astc-10x10-unorm-srgb", a.ASTC12x10Unorm = "astc-12x10-unorm", a.ASTC12x10UnormSRGB = "astc-12x10-unorm-srgb", a.ASTC12x12Unorm = "astc-12x12-unorm", a.ASTC12x12UnormSRGB = "astc-12x12-unorm-srgb", a.Depth32FloatStencil8 = "depth32float-stencil8";
})(i || (i = {}));
var de;
(function(a) {
  a.ClampToEdge = "clamp-to-edge", a.Repeat = "repeat", a.MirrorRepeat = "mirror-repeat";
})(de || (de = {}));
var B;
(function(a) {
  a.Nearest = "nearest", a.Linear = "linear";
})(B || (B = {}));
var je;
(function(a) {
  a.Nearest = "nearest", a.Linear = "linear";
})(je || (je = {}));
var O;
(function(a) {
  a.Never = "never", a.Less = "less", a.Equal = "equal", a.LessEqual = "less-equal", a.Greater = "greater", a.NotEqual = "not-equal", a.GreaterEqual = "greater-equal", a.Always = "always";
})(O || (O = {}));
var se;
(function(a) {
  a[a.Vertex = 1] = "Vertex", a[a.Fragment = 2] = "Fragment", a[a.Compute = 4] = "Compute";
})(se || (se = {}));
var ae;
(function(a) {
  a.Uniform = "uniform", a.Storage = "storage", a.ReadOnlyStorage = "read-only-storage";
})(ae || (ae = {}));
var ue;
(function(a) {
  a.Filtering = "filtering", a.NonFiltering = "non-filtering", a.Comparison = "comparison";
})(ue || (ue = {}));
var H;
(function(a) {
  a.Float = "float", a.UnfilterableFloat = "unfilterable-float", a.Depth = "depth", a.Sint = "sint", a.Uint = "uint";
})(H || (H = {}));
var Me;
(function(a) {
  a.WriteOnly = "write-only", a.ReadOnly = "read-only", a.ReadWrite = "read-write";
})(Me || (Me = {}));
var Je;
(function(a) {
  a.Error = "error", a.Warning = "warning", a.Info = "info";
})(Je || (Je = {}));
var Ze;
(function(a) {
  a.Validation = "validation", a.Internal = "internal";
})(Ze || (Ze = {}));
var Re;
(function(a) {
  a.Auto = "auto";
})(Re || (Re = {}));
var k;
(function(a) {
  a.PointList = "point-list", a.LineList = "line-list", a.LineStrip = "line-strip", a.TriangleList = "triangle-list", a.TriangleStrip = "triangle-strip";
})(k || (k = {}));
var Ie;
(function(a) {
  a.CCW = "ccw", a.CW = "cw";
})(Ie || (Ie = {}));
var xe;
(function(a) {
  a.None = "none", a.Front = "front", a.Back = "back";
})(xe || (xe = {}));
var et;
(function(a) {
  a[a.Red = 1] = "Red", a[a.Green = 2] = "Green", a[a.Blue = 4] = "Blue", a[a.Alpha = 8] = "Alpha", a[a.All = 15] = "All";
})(et || (et = {}));
var $;
(function(a) {
  a.Zero = "zero", a.One = "one", a.Src = "src", a.OneMinusSrc = "one-minus-src", a.SrcAlpha = "src-alpha", a.OneMinusSrcAlpha = "one-minus-src-alpha", a.Dst = "dst", a.OneMinusDst = "one-minus-dst", a.DstAlpha = "dst-alpha", a.OneMinusDstAlpha = "one-minus-dst-alpha", a.SrcAlphaSaturated = "src-alpha-saturated", a.Constant = "constant", a.OneMinusConstant = "one-minus-constant";
})($ || ($ = {}));
var ie;
(function(a) {
  a.Add = "add", a.Subtract = "subtract", a.ReverseSubtract = "reverse-subtract", a.Min = "min", a.Max = "max";
})(ie || (ie = {}));
var K;
(function(a) {
  a.Keep = "keep", a.Zero = "zero", a.Replace = "replace", a.Invert = "invert", a.IncrementClamp = "increment-clamp", a.DecrementClamp = "decrement-clamp", a.IncrementWrap = "increment-wrap", a.DecrementWrap = "decrement-wrap";
})(K || (K = {}));
var le;
(function(a) {
  a.Uint16 = "uint16", a.Uint32 = "uint32";
})(le || (le = {}));
var D;
(function(a) {
  a.Uint8x2 = "uint8x2", a.Uint8x4 = "uint8x4", a.Sint8x2 = "sint8x2", a.Sint8x4 = "sint8x4", a.Unorm8x2 = "unorm8x2", a.Unorm8x4 = "unorm8x4", a.Snorm8x2 = "snorm8x2", a.Snorm8x4 = "snorm8x4", a.Uint16x2 = "uint16x2", a.Uint16x4 = "uint16x4", a.Sint16x2 = "sint16x2", a.Sint16x4 = "sint16x4", a.Unorm16x2 = "unorm16x2", a.Unorm16x4 = "unorm16x4", a.Snorm16x2 = "snorm16x2", a.Snorm16x4 = "snorm16x4", a.Float16x2 = "float16x2", a.Float16x4 = "float16x4", a.Float32 = "float32", a.Float32x2 = "float32x2", a.Float32x3 = "float32x3", a.Float32x4 = "float32x4", a.Uint32 = "uint32", a.Uint32x2 = "uint32x2", a.Uint32x3 = "uint32x3", a.Uint32x4 = "uint32x4", a.Sint32 = "sint32", a.Sint32x2 = "sint32x2", a.Sint32x3 = "sint32x3", a.Sint32x4 = "sint32x4", a.UNORM10x10x10x2 = "unorm10-10-10-2";
})(D || (D = {}));
var Te;
(function(a) {
  a.Vertex = "vertex", a.Instance = "instance";
})(Te || (Te = {}));
var tt;
(function(a) {
  a.Beginning = "beginning", a.End = "end";
})(tt || (tt = {}));
var rt;
(function(a) {
  a.Beginning = "beginning", a.End = "end";
})(rt || (rt = {}));
var N;
(function(a) {
  a.Load = "load", a.Clear = "clear";
})(N || (N = {}));
var Y;
(function(a) {
  a.Store = "store", a.Discard = "discard";
})(Y || (Y = {}));
var Ae;
(function(a) {
  a.Occlusion = "occlusion", a.Timestamp = "timestamp";
})(Ae || (Ae = {}));
var ve;
(function(a) {
  a.Opaque = "opaque", a.Premultiplied = "premultiplied";
})(ve || (ve = {}));
var nt;
(function(a) {
  a.Unknown = "unknown", a.Destroyed = "destroyed";
})(nt || (nt = {}));
var st;
(function(a) {
  a.Validation = "validation", a.OutOfMemory = "out-of-memory", a.Internal = "internal";
})(st || (st = {}));
class L {
  constructor() {
    this.shaderLanguage = j.GLSL, this.vertexBufferKindToNumberOfComponents = {};
  }
  _addUniformToLeftOverUBO(e, t, r) {
    let n = 0;
    [e, t, n] = this._getArraySize(e, t, r);
    for (let s = 0; s < this._webgpuProcessingContext.leftOverUniforms.length; s++)
      if (this._webgpuProcessingContext.leftOverUniforms[s].name === e)
        return;
    this._webgpuProcessingContext.leftOverUniforms.push({
      name: e,
      type: t,
      length: n
    });
  }
  _buildLeftOverUBO() {
    if (!this._webgpuProcessingContext.leftOverUniforms.length)
      return "";
    const e = L.LeftOvertUBOName;
    let t = this._webgpuProcessingContext.availableBuffers[e];
    return t || (t = {
      binding: this._webgpuProcessingContext.getNextFreeUBOBinding()
    }, this._webgpuProcessingContext.availableBuffers[e] = t, this._addBufferBindingDescription(e, t, ae.Uniform, !0), this._addBufferBindingDescription(e, t, ae.Uniform, !1)), this._generateLeftOverUBOCode(e, t);
  }
  _collectBindingNames() {
    for (let e = 0; e < this._webgpuProcessingContext.bindGroupLayoutEntries.length; e++) {
      const t = this._webgpuProcessingContext.bindGroupLayoutEntries[e];
      if (t === void 0) {
        this._webgpuProcessingContext.bindGroupLayoutEntries[e] = [];
        continue;
      }
      for (let r = 0; r < t.length; r++) {
        const n = this._webgpuProcessingContext.bindGroupLayoutEntries[e][r], s = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[e][n.binding].name, o = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[e][n.binding].nameInArrayOfTexture;
        n && (n.texture || n.externalTexture || n.storageTexture ? this._webgpuProcessingContext.textureNames.push(o) : n.sampler ? this._webgpuProcessingContext.samplerNames.push(s) : n.buffer && this._webgpuProcessingContext.bufferNames.push(s));
      }
    }
  }
  _preCreateBindGroupEntries() {
    const e = this._webgpuProcessingContext.bindGroupEntries;
    for (let t = 0; t < this._webgpuProcessingContext.bindGroupLayoutEntries.length; t++) {
      const r = this._webgpuProcessingContext.bindGroupLayoutEntries[t], n = [];
      for (let s = 0; s < r.length; s++) {
        const o = this._webgpuProcessingContext.bindGroupLayoutEntries[t][s];
        o.sampler || o.texture || o.storageTexture || o.externalTexture ? n.push({
          binding: o.binding,
          resource: void 0
        }) : o.buffer && n.push({
          binding: o.binding,
          resource: {
            buffer: void 0,
            offset: 0,
            size: 0
          }
        });
      }
      e[t] = n;
    }
  }
  _addTextureBindingDescription(e, t, r, n, s, o) {
    let { groupIndex: u, bindingIndex: l } = t.textures[r];
    if (this._webgpuProcessingContext.bindGroupLayoutEntries[u] || (this._webgpuProcessingContext.bindGroupLayoutEntries[u] = [], this._webgpuProcessingContext.bindGroupLayoutEntryInfo[u] = []), !this._webgpuProcessingContext.bindGroupLayoutEntryInfo[u][l]) {
      let c;
      n === null ? c = this._webgpuProcessingContext.bindGroupLayoutEntries[u].push({
        binding: l,
        visibility: 0,
        externalTexture: {}
      }) : s ? c = this._webgpuProcessingContext.bindGroupLayoutEntries[u].push({
        binding: l,
        visibility: 0,
        storageTexture: {
          access: Me.WriteOnly,
          format: s,
          viewDimension: n
        }
      }) : c = this._webgpuProcessingContext.bindGroupLayoutEntries[u].push({
        binding: l,
        visibility: 0,
        texture: {
          sampleType: t.sampleType,
          viewDimension: n,
          multisampled: !1
        }
      });
      const h = t.isTextureArray ? e + r : e;
      this._webgpuProcessingContext.bindGroupLayoutEntryInfo[u][l] = { name: e, index: c - 1, nameInArrayOfTexture: h };
    }
    l = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[u][l].index, o ? this._webgpuProcessingContext.bindGroupLayoutEntries[u][l].visibility |= se.Vertex : this._webgpuProcessingContext.bindGroupLayoutEntries[u][l].visibility |= se.Fragment;
  }
  _addSamplerBindingDescription(e, t, r) {
    let { groupIndex: n, bindingIndex: s } = t.binding;
    if (this._webgpuProcessingContext.bindGroupLayoutEntries[n] || (this._webgpuProcessingContext.bindGroupLayoutEntries[n] = [], this._webgpuProcessingContext.bindGroupLayoutEntryInfo[n] = []), !this._webgpuProcessingContext.bindGroupLayoutEntryInfo[n][s]) {
      const o = this._webgpuProcessingContext.bindGroupLayoutEntries[n].push({
        binding: s,
        visibility: 0,
        sampler: {
          type: t.type
        }
      });
      this._webgpuProcessingContext.bindGroupLayoutEntryInfo[n][s] = { name: e, index: o - 1 };
    }
    s = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[n][s].index, r ? this._webgpuProcessingContext.bindGroupLayoutEntries[n][s].visibility |= se.Vertex : this._webgpuProcessingContext.bindGroupLayoutEntries[n][s].visibility |= se.Fragment;
  }
  _addBufferBindingDescription(e, t, r, n) {
    let { groupIndex: s, bindingIndex: o } = t.binding;
    if (this._webgpuProcessingContext.bindGroupLayoutEntries[s] || (this._webgpuProcessingContext.bindGroupLayoutEntries[s] = [], this._webgpuProcessingContext.bindGroupLayoutEntryInfo[s] = []), !this._webgpuProcessingContext.bindGroupLayoutEntryInfo[s][o]) {
      const u = this._webgpuProcessingContext.bindGroupLayoutEntries[s].push({
        binding: o,
        visibility: 0,
        buffer: {
          type: r
        }
      });
      this._webgpuProcessingContext.bindGroupLayoutEntryInfo[s][o] = { name: e, index: u - 1 };
    }
    o = this._webgpuProcessingContext.bindGroupLayoutEntryInfo[s][o].index, n ? this._webgpuProcessingContext.bindGroupLayoutEntries[s][o].visibility |= se.Vertex : this._webgpuProcessingContext.bindGroupLayoutEntries[s][o].visibility |= se.Fragment;
  }
  _injectStartingAndEndingCode(e, t, r, n) {
    let s = e.indexOf(t);
    if (s < 0)
      return y.Error('No "main" function found in shader code! Processing aborted.'), e;
    if (r) {
      for (; s++ < e.length && e.charAt(s) != "{"; )
        ;
      if (s < e.length) {
        const o = e.substring(0, s + 1), u = e.substring(s + 1);
        e = o + r + u;
      }
    }
    if (n) {
      const o = e.lastIndexOf("}");
      e = e.substring(0, o), e += n + `
}`;
    }
    return e;
  }
}
L.AutoSamplerSuffix = "Sampler";
L.LeftOvertUBOName = "LeftOver";
L.InternalsUBOName = "Internals";
L.UniformSizes = {
  // GLSL types
  bool: 1,
  int: 1,
  float: 1,
  vec2: 2,
  ivec2: 2,
  uvec2: 2,
  vec3: 3,
  ivec3: 3,
  uvec3: 3,
  vec4: 4,
  ivec4: 4,
  uvec4: 4,
  mat2: 4,
  mat3: 12,
  mat4: 16,
  // WGSL types
  i32: 1,
  u32: 1,
  f32: 1,
  mat2x2: 4,
  mat3x3: 12,
  mat4x4: 16,
  mat2x2f: 4,
  mat3x3f: 12,
  mat4x4f: 16,
  vec2i: 2,
  vec3i: 3,
  vec4i: 4,
  vec2u: 2,
  vec3u: 3,
  vec4u: 4,
  vec2f: 2,
  vec3f: 3,
  vec4f: 4,
  vec2h: 1,
  vec3h: 2,
  vec4h: 2
};
L._SamplerFunctionByWebGLSamplerType = {
  sampler2D: "sampler2D",
  sampler2DArray: "sampler2DArray",
  sampler2DShadow: "sampler2DShadow",
  sampler2DArrayShadow: "sampler2DArrayShadow",
  samplerCube: "samplerCube",
  sampler3D: "sampler3D"
};
L._TextureTypeByWebGLSamplerType = {
  sampler2D: "texture2D",
  sampler2DArray: "texture2DArray",
  sampler2DShadow: "texture2D",
  sampler2DArrayShadow: "texture2DArray",
  samplerCube: "textureCube",
  samplerCubeArray: "textureCubeArray",
  sampler3D: "texture3D"
};
L._GpuTextureViewDimensionByWebGPUTextureType = {
  textureCube: I.Cube,
  textureCubeArray: I.CubeArray,
  texture2D: I.E2d,
  texture2DArray: I.E2dArray,
  texture3D: I.E3d
};
L._SamplerTypeByWebGLSamplerType = {
  sampler2DShadow: "samplerShadow",
  sampler2DArrayShadow: "samplerShadow"
};
L._IsComparisonSamplerByWebGPUSamplerType = {
  samplerShadow: !0,
  samplerArrayShadow: !0,
  sampler: !1
};
class At {
  get isAsync() {
    return !1;
  }
  get isReady() {
    return !!this.stages;
  }
  constructor(e, t) {
    this.bindGroupLayouts = {}, this._name = "unnamed", this.shaderProcessingContext = e, this._leftOverUniformsByName = {}, this.engine = t, this.vertexBufferKindToType = {};
  }
  _handlesSpectorRebuildCallback() {
  }
  _fillEffectInformation(e, t, r, n, s, o, u, l) {
    const c = this.engine;
    c._doNotHandleContextLost && (e._fragmentSourceCode = "", e._vertexSourceCode = "");
    const h = this.shaderProcessingContext.availableTextures;
    let d;
    for (d = 0; d < s.length; d++) {
      const m = s[d], g = h[s[d]];
      g == null || g == null ? (s.splice(d, 1), d--) : o[m] = d;
    }
    for (const m of c.getAttributes(this, u))
      l.push(m);
    this.buildUniformLayout();
    const f = [], _ = [];
    for (d = 0; d < u.length; d++) {
      const m = l[d];
      m >= 0 && (f.push(u[d]), _.push(m));
    }
    this.shaderProcessingContext.attributeNamesFromEffect = f, this.shaderProcessingContext.attributeLocationsFromEffect = _;
  }
  /** @internal */
  /**
   * Build the uniform buffer used in the material.
   */
  buildUniformLayout() {
    if (this.shaderProcessingContext.leftOverUniforms.length) {
      this.uniformBuffer = new Ce(this.engine, void 0, void 0, "leftOver-" + this._name);
      for (const e of this.shaderProcessingContext.leftOverUniforms) {
        const t = e.type.replace(/^(.*?)(<.*>)?$/, "$1"), r = L.UniformSizes[t];
        this.uniformBuffer.addUniform(e.name, r, e.length), this._leftOverUniformsByName[e.name] = e.type;
      }
      this.uniformBuffer.create();
    }
  }
  /**
   * Release all associated resources.
   **/
  dispose() {
    this.uniformBuffer && this.uniformBuffer.dispose();
  }
  /**
   * Sets an integer value on a uniform variable.
   * @param uniformName Name of the variable.
   * @param value Value to be set.
   */
  setInt(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateInt(e, t);
  }
  /**
   * Sets an int2 value on a uniform variable.
   * @param uniformName Name of the variable.
   * @param x First int in int2.
   * @param y Second int in int2.
   */
  setInt2(e, t, r) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateInt2(e, t, r);
  }
  /**
   * Sets an int3 value on a uniform variable.
   * @param uniformName Name of the variable.
   * @param x First int in int3.
   * @param y Second int in int3.
   * @param z Third int in int3.
   */
  setInt3(e, t, r, n) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateInt3(e, t, r, n);
  }
  /**
   * Sets an int4 value on a uniform variable.
   * @param uniformName Name of the variable.
   * @param x First int in int4.
   * @param y Second int in int4.
   * @param z Third int in int4.
   * @param w Fourth int in int4.
   */
  setInt4(e, t, r, n, s) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateInt4(e, t, r, n, s);
  }
  /**
   * Sets an int array on a uniform variable.
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setIntArray(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateIntArray(e, t);
  }
  /**
   * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setIntArray2(e, t) {
    this.setIntArray(e, t);
  }
  /**
   * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setIntArray3(e, t) {
    this.setIntArray(e, t);
  }
  /**
   * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setIntArray4(e, t) {
    this.setIntArray(e, t);
  }
  /**
   * Sets an unsigned integer value on a uniform variable.
   * @param uniformName Name of the variable.
   * @param value Value to be set.
   */
  setUInt(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateUInt(e, t);
  }
  /**
   * Sets an unsigned int2 value on a uniform variable.
   * @param uniformName Name of the variable.
   * @param x First unsigned int in uint2.
   * @param y Second unsigned int in uint2.
   */
  setUInt2(e, t, r) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateUInt2(e, t, r);
  }
  /**
   * Sets an unsigned int3 value on a uniform variable.
   * @param uniformName Name of the variable.
   * @param x First unsigned int in uint3.
   * @param y Second unsigned int in uint3.
   * @param z Third unsigned int in uint3.
   */
  setUInt3(e, t, r, n) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateUInt3(e, t, r, n);
  }
  /**
   * Sets an unsigned int4 value on a uniform variable.
   * @param uniformName Name of the variable.
   * @param x First unsigned int in uint4.
   * @param y Second unsigned int in uint4.
   * @param z Third unsigned int in uint4.
   * @param w Fourth unsigned int in uint4.
   */
  setUInt4(e, t, r, n, s) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateUInt4(e, t, r, n, s);
  }
  /**
   * Sets an unsigned int array on a uniform variable.
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setUIntArray(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateUIntArray(e, t);
  }
  /**
   * Sets an unsigned int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setUIntArray2(e, t) {
    this.setUIntArray(e, t);
  }
  /**
   * Sets an unsigned int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setUIntArray3(e, t) {
    this.setUIntArray(e, t);
  }
  /**
   * Sets an unsigned int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setUIntArray4(e, t) {
    this.setUIntArray(e, t);
  }
  /**
   * Sets an array on a uniform variable.
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setArray(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateArray(e, t);
  }
  /**
   * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setArray2(e, t) {
    this.setArray(e, t);
  }
  /**
   * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setArray3(e, t) {
    this.setArray(e, t);
  }
  /**
   * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
   * @param uniformName Name of the variable.
   * @param array array to be set.
   */
  setArray4(e, t) {
    this.setArray(e, t);
  }
  /**
   * Sets matrices on a uniform variable.
   * @param uniformName Name of the variable.
   * @param matrices matrices to be set.
   */
  setMatrices(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateMatrices(e, t);
  }
  /**
   * Sets matrix on a uniform variable.
   * @param uniformName Name of the variable.
   * @param matrix matrix to be set.
   */
  setMatrix(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateMatrix(e, t);
  }
  /**
   * Sets a 3x3 matrix on a uniform variable. (Specified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
   * @param uniformName Name of the variable.
   * @param matrix matrix to be set.
   */
  setMatrix3x3(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateMatrix3x3(e, t);
  }
  /**
   * Sets a 2x2 matrix on a uniform variable. (Specified as [1,2,3,4] will result in [1,2][3,4] matrix)
   * @param uniformName Name of the variable.
   * @param matrix matrix to be set.
   */
  setMatrix2x2(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateMatrix2x2(e, t);
  }
  /**
   * Sets a float on a uniform variable.
   * @param uniformName Name of the variable.
   * @param value value to be set.
   */
  setFloat(e, t) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateFloat(e, t);
  }
  /**
   * Sets a Vector2 on a uniform variable.
   * @param uniformName Name of the variable.
   * @param vector2 vector2 to be set.
   */
  setVector2(e, t) {
    this.setFloat2(e, t.x, t.y);
  }
  /**
   * Sets a float2 on a uniform variable.
   * @param uniformName Name of the variable.
   * @param x First float in float2.
   * @param y Second float in float2.
   */
  setFloat2(e, t, r) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateFloat2(e, t, r);
  }
  /**
   * Sets a Vector3 on a uniform variable.
   * @param uniformName Name of the variable.
   * @param vector3 Value to be set.
   */
  setVector3(e, t) {
    this.setFloat3(e, t.x, t.y, t.z);
  }
  /**
   * Sets a float3 on a uniform variable.
   * @param uniformName Name of the variable.
   * @param x First float in float3.
   * @param y Second float in float3.
   * @param z Third float in float3.
   */
  setFloat3(e, t, r, n) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateFloat3(e, t, r, n);
  }
  /**
   * Sets a Vector4 on a uniform variable.
   * @param uniformName Name of the variable.
   * @param vector4 Value to be set.
   */
  setVector4(e, t) {
    this.setFloat4(e, t.x, t.y, t.z, t.w);
  }
  /**
   * Sets a Quaternion on a uniform variable.
   * @param uniformName Name of the variable.
   * @param quaternion Value to be set.
   */
  setQuaternion(e, t) {
    this.setFloat4(e, t.x, t.y, t.z, t.w);
  }
  /**
   * Sets a float4 on a uniform variable.
   * @param uniformName Name of the variable.
   * @param x First float in float4.
   * @param y Second float in float4.
   * @param z Third float in float4.
   * @param w Fourth float in float4.
   */
  setFloat4(e, t, r, n, s) {
    !this.uniformBuffer || !this._leftOverUniformsByName[e] || this.uniformBuffer.updateFloat4(e, t, r, n, s);
  }
  /**
   * Sets a Color3 on a uniform variable.
   * @param uniformName Name of the variable.
   * @param color3 Value to be set.
   */
  setColor3(e, t) {
    this.setFloat3(e, t.r, t.g, t.b);
  }
  /**
   * Sets a Color4 on a uniform variable.
   * @param uniformName Name of the variable.
   * @param color3 Value to be set.
   * @param alpha Alpha value to be set.
   */
  setColor4(e, t, r) {
    this.setFloat4(e, t.r, t.g, t.b, r);
  }
  /**
   * Sets a Color4 on a uniform variable
   * @param uniformName defines the name of the variable
   * @param color4 defines the value to be set
   */
  setDirectColor4(e, t) {
    this.setFloat4(e, t.r, t.g, t.b, t.a);
  }
  _getVertexShaderCode() {
    return this.sources?.vertex;
  }
  _getFragmentShaderCode() {
    return this.sources?.fragment;
  }
}
const vt = 4, wt = 65536, it = {
  // GLSL types
  mat2: 2,
  mat3: 3,
  mat4: 4,
  // WGSL types
  mat2x2: 2,
  mat3x3: 3,
  mat4x4: 4
};
class z {
  static get KnownUBOs() {
    return z._SimplifiedKnownBindings ? z._SimplifiedKnownUBOs : z._KnownUBOs;
  }
  constructor(e) {
    this.shaderLanguage = e, this._attributeNextLocation = 0, this._varyingNextLocation = 0, this.freeGroupIndex = 0, this.freeBindingIndex = 0, this.availableVaryings = {}, this.availableAttributes = {}, this.availableBuffers = {}, this.availableTextures = {}, this.availableSamplers = {}, this.orderedAttributes = [], this.bindGroupLayoutEntries = [], this.bindGroupLayoutEntryInfo = [], this.bindGroupEntries = [], this.bufferNames = [], this.textureNames = [], this.samplerNames = [], this.leftOverUniforms = [], this._findStartingGroupBinding();
  }
  _findStartingGroupBinding() {
    const e = z.KnownUBOs, t = [];
    for (const r in e) {
      const n = e[r].binding;
      n.groupIndex !== -1 && (t[n.groupIndex] === void 0 ? t[n.groupIndex] = n.bindingIndex : t[n.groupIndex] = Math.max(t[n.groupIndex], n.bindingIndex));
    }
    this.freeGroupIndex = t.length - 1, this.freeGroupIndex === 0 ? (this.freeGroupIndex++, this.freeBindingIndex = 0) : this.freeBindingIndex = t[t.length - 1] + 1;
  }
  getAttributeNextLocation(e, t = 0) {
    const r = this._attributeNextLocation;
    return this._attributeNextLocation += (it[e] ?? 1) * (t || 1), r;
  }
  getVaryingNextLocation(e, t = 0) {
    const r = this._varyingNextLocation;
    return this._varyingNextLocation += (it[e] ?? 1) * (t || 1), r;
  }
  getNextFreeUBOBinding() {
    return this._getNextFreeBinding(1);
  }
  _getNextFreeBinding(e) {
    if (this.freeBindingIndex > wt - e && (this.freeGroupIndex++, this.freeBindingIndex = 0), this.freeGroupIndex === vt)
      throw "Too many textures or UBOs have been declared and it is not supported in WebGPU.";
    const t = {
      groupIndex: this.freeGroupIndex,
      bindingIndex: this.freeBindingIndex
    };
    return this.freeBindingIndex += e, t;
  }
}
z._SimplifiedKnownBindings = !0;
z._SimplifiedKnownUBOs = {
  Scene: { binding: { groupIndex: 0, bindingIndex: 0 } },
  Light0: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light1: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light2: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light3: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light4: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light5: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light6: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light7: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light8: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light9: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light10: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light11: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light12: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light13: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light14: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light15: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light16: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light17: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light18: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light19: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light20: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light21: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light22: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light23: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light24: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light25: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light26: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light27: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light28: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light29: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light30: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Light31: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Material: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Mesh: { binding: { groupIndex: -1, bindingIndex: -1 } },
  Internals: { binding: { groupIndex: -1, bindingIndex: -1 } }
};
z._KnownUBOs = {
  Scene: { binding: { groupIndex: 0, bindingIndex: 0 } },
  Light0: { binding: { groupIndex: 1, bindingIndex: 0 } },
  Light1: { binding: { groupIndex: 1, bindingIndex: 1 } },
  Light2: { binding: { groupIndex: 1, bindingIndex: 2 } },
  Light3: { binding: { groupIndex: 1, bindingIndex: 3 } },
  Light4: { binding: { groupIndex: 1, bindingIndex: 4 } },
  Light5: { binding: { groupIndex: 1, bindingIndex: 5 } },
  Light6: { binding: { groupIndex: 1, bindingIndex: 6 } },
  Light7: { binding: { groupIndex: 1, bindingIndex: 7 } },
  Light8: { binding: { groupIndex: 1, bindingIndex: 8 } },
  Light9: { binding: { groupIndex: 1, bindingIndex: 9 } },
  Light10: { binding: { groupIndex: 1, bindingIndex: 10 } },
  Light11: { binding: { groupIndex: 1, bindingIndex: 11 } },
  Light12: { binding: { groupIndex: 1, bindingIndex: 12 } },
  Light13: { binding: { groupIndex: 1, bindingIndex: 13 } },
  Light14: { binding: { groupIndex: 1, bindingIndex: 14 } },
  Light15: { binding: { groupIndex: 1, bindingIndex: 15 } },
  Light16: { binding: { groupIndex: 1, bindingIndex: 16 } },
  Light17: { binding: { groupIndex: 1, bindingIndex: 17 } },
  Light18: { binding: { groupIndex: 1, bindingIndex: 18 } },
  Light19: { binding: { groupIndex: 1, bindingIndex: 19 } },
  Light20: { binding: { groupIndex: 1, bindingIndex: 20 } },
  Light21: { binding: { groupIndex: 1, bindingIndex: 21 } },
  Light22: { binding: { groupIndex: 1, bindingIndex: 22 } },
  Light23: { binding: { groupIndex: 1, bindingIndex: 23 } },
  Light24: { binding: { groupIndex: 1, bindingIndex: 24 } },
  Light25: { binding: { groupIndex: 1, bindingIndex: 25 } },
  Light26: { binding: { groupIndex: 1, bindingIndex: 26 } },
  Light27: { binding: { groupIndex: 1, bindingIndex: 27 } },
  Light28: { binding: { groupIndex: 1, bindingIndex: 28 } },
  Light29: { binding: { groupIndex: 1, bindingIndex: 29 } },
  Light30: { binding: { groupIndex: 1, bindingIndex: 30 } },
  Light31: { binding: { groupIndex: 1, bindingIndex: 31 } },
  Material: { binding: { groupIndex: 2, bindingIndex: 0 } },
  Mesh: { binding: { groupIndex: 2, bindingIndex: 1 } },
  Internals: { binding: { groupIndex: 2, bindingIndex: 2 } }
};
class Gt extends L {
  constructor() {
    super(...arguments), this._missingVaryings = [], this._textureArrayProcessing = [], this._vertexIsGLES3 = !1, this._fragmentIsGLES3 = !1, this.shaderLanguage = j.GLSL, this.parseGLES3 = !0;
  }
  _getArraySize(e, t, r) {
    let n = 0;
    const s = e.indexOf("["), o = e.indexOf("]");
    if (s > 0 && o > 0) {
      const u = e.substring(s + 1, o);
      n = +u, isNaN(n) && (n = +r[u.trim()]), e = e.substr(0, s);
    }
    return [e, t, n];
  }
  initializeShaders(e) {
    this._webgpuProcessingContext = e, this._missingVaryings.length = 0, this._textureArrayProcessing.length = 0, this.attributeKeywordName = void 0, this.varyingVertexKeywordName = void 0, this.varyingFragmentKeywordName = void 0;
  }
  preProcessShaderCode(e, t) {
    const r = `// Internals UBO
uniform ${L.InternalsUBOName} {
float yFactor_;
float textureOutputHeight_;
};
`, n = e.indexOf("// Internals UBO") !== -1;
    return t ? (this._fragmentIsGLES3 = e.indexOf("#version 3") !== -1, this._fragmentIsGLES3 && (this.varyingFragmentKeywordName = "in"), n ? e : r + `##INJECTCODE##
` + e) : (this._vertexIsGLES3 = e.indexOf("#version 3") !== -1, this._vertexIsGLES3 && (this.attributeKeywordName = "in", this.varyingVertexKeywordName = "out"), n ? e : r + e);
  }
  varyingCheck(e, t) {
    const r = /(flat\s)?\s*\bout\b/, n = /(flat\s)?\s*\bin\b/, s = /(flat\s)?\s*\bvarying\b/;
    return (t && this._fragmentIsGLES3 ? n : !t && this._vertexIsGLES3 ? r : s).test(e);
  }
  varyingProcessor(e, t, r) {
    this._preProcessors = r;
    const n = /\s*(flat)?\s*out\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm, s = /\s*(flat)?\s*in\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm, o = /\s*(flat)?\s*varying\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm, l = (t && this._fragmentIsGLES3 ? s : !t && this._vertexIsGLES3 ? n : o).exec(e);
    if (l !== null) {
      const c = l[1] ?? "", h = l[2], d = l[3];
      let f;
      t ? (f = this._webgpuProcessingContext.availableVaryings[d], this._missingVaryings[f] = "", f === void 0 && y.Warn(`Invalid fragment shader: The varying named "${d}" is not declared in the vertex shader! This declaration will be ignored.`)) : (f = this._webgpuProcessingContext.getVaryingNextLocation(h, this._getArraySize(d, h, r)[2]), this._webgpuProcessingContext.availableVaryings[d] = f, this._missingVaryings[f] = `layout(location = ${f}) ${c} in ${h} ${d};`), e = e.replace(l[0], f === void 0 ? "" : `layout(location = ${f}) ${c} ${t ? "in" : "out"} ${h} ${d};`);
    }
    return e;
  }
  attributeProcessor(e, t) {
    this._preProcessors = t;
    const r = /\s*in\s+(\S+)\s+(\S+)\s*;/gm, n = /\s*attribute\s+(\S+)\s+(\S+)\s*;/gm, o = (this._vertexIsGLES3 ? r : n).exec(e);
    if (o !== null) {
      const u = o[1], l = o[2], c = this._webgpuProcessingContext.getAttributeNextLocation(u, this._getArraySize(l, u, t)[2]);
      this._webgpuProcessingContext.availableAttributes[l] = c, this._webgpuProcessingContext.orderedAttributes[c] = l;
      const h = this.vertexBufferKindToNumberOfComponents[l];
      if (h !== void 0) {
        const d = h < 0 ? h === -1 ? "int" : "ivec" + -h : h === 1 ? "uint" : "uvec" + h, f = `_int_${l}_`;
        e = e.replace(o[0], `layout(location = ${c}) in ${d} ${f}; ${u} ${l} = ${u}(${f});`);
      } else
        e = e.replace(o[0], `layout(location = ${c}) in ${u} ${l};`);
    }
    return e;
  }
  uniformProcessor(e, t, r) {
    this._preProcessors = r;
    const s = /\s*uniform\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s+(\S+)\s*;/gm.exec(e);
    if (s !== null) {
      let o = s[1], u = s[2];
      if (o.indexOf("sampler") === 0 || o.indexOf("sampler") === 1) {
        let l = 0;
        [u, o, l] = this._getArraySize(u, o, r);
        let c = this._webgpuProcessingContext.availableTextures[u];
        if (!c) {
          c = {
            autoBindSampler: !0,
            isTextureArray: l > 0,
            isStorageTexture: !1,
            textures: [],
            sampleType: H.Float
          };
          for (let P = 0; P < (l || 1); ++P)
            c.textures.push(this._webgpuProcessingContext.getNextFreeUBOBinding());
        }
        const h = L._SamplerTypeByWebGLSamplerType[o] ?? "sampler", d = !!L._IsComparisonSamplerByWebGPUSamplerType[h], f = d ? ue.Comparison : ue.Filtering, _ = u + L.AutoSamplerSuffix;
        let m = this._webgpuProcessingContext.availableSamplers[_];
        m || (m = {
          binding: this._webgpuProcessingContext.getNextFreeUBOBinding(),
          type: f
        });
        const g = o.charAt(0) === "u" ? "u" : o.charAt(0) === "i" ? "i" : "";
        g && (o = o.substr(1));
        const p = d ? H.Depth : g === "u" ? H.Uint : g === "i" ? H.Sint : H.Float;
        c.sampleType = p;
        const x = l > 0, S = m.binding.groupIndex, b = m.binding.bindingIndex, v = L._SamplerFunctionByWebGLSamplerType[o], R = L._TextureTypeByWebGLSamplerType[o], G = L._GpuTextureViewDimensionByWebGPUTextureType[R];
        if (!x)
          l = 1, e = `layout(set = ${S}, binding = ${b}) uniform ${h} ${_};
                        layout(set = ${c.textures[0].groupIndex}, binding = ${c.textures[0].bindingIndex}) uniform ${g}${R} ${u}Texture;
                        #define ${u} ${g}${v}(${u}Texture, ${_})`;
        else {
          const P = [];
          P.push(`layout(set = ${S}, binding = ${b}) uniform ${g}${h} ${_};`), e = `
`;
          for (let E = 0; E < l; ++E) {
            const W = c.textures[E].groupIndex, ne = c.textures[E].bindingIndex;
            P.push(`layout(set = ${W}, binding = ${ne}) uniform ${R} ${u}Texture${E};`), e += `${E > 0 ? `
` : ""}#define ${u}${E} ${g}${v}(${u}Texture${E}, ${_})`;
          }
          e = P.join(`
`) + e, this._textureArrayProcessing.push(u);
        }
        this._webgpuProcessingContext.availableTextures[u] = c, this._webgpuProcessingContext.availableSamplers[_] = m, this._addSamplerBindingDescription(_, m, !t);
        for (let P = 0; P < l; ++P)
          this._addTextureBindingDescription(u, c, P, G, null, !t);
      } else
        this._addUniformToLeftOverUBO(u, o, r), e = "";
    }
    return e;
  }
  uniformBufferProcessor(e, t) {
    const n = /uniform\s+(\w+)/gm.exec(e);
    if (n !== null) {
      const s = n[1];
      let o = this._webgpuProcessingContext.availableBuffers[s];
      if (!o) {
        const u = z.KnownUBOs[s];
        let l;
        u && u.binding.groupIndex !== -1 ? l = u.binding : l = this._webgpuProcessingContext.getNextFreeUBOBinding(), o = { binding: l }, this._webgpuProcessingContext.availableBuffers[s] = o;
      }
      this._addBufferBindingDescription(s, o, ae.Uniform, !t), e = e.replace("uniform", `layout(set = ${o.binding.groupIndex}, binding = ${o.binding.bindingIndex}) uniform`);
    }
    return e;
  }
  postProcessor(e, t, r, n, s) {
    const o = e.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1, u = /#extension.+(GL_OVR_multiview2|GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
    if (e = e.replace(u, ""), e = e.replace(/texture2D\s*\(/g, "texture("), r) {
      const l = e.indexOf("gl_FragCoord") >= 0, c = `
                glFragCoord_ = gl_FragCoord;
                if (yFactor_ == 1.) {
                    glFragCoord_.y = textureOutputHeight_ - glFragCoord_.y;
                }
            `, h = l ? `vec4 glFragCoord_;
` : "", d = e.search(/layout *\(location *= *0\) *out/g) !== -1;
      if (e = e.replace(/texture2DLodEXT\s*\(/g, "textureLod("), e = e.replace(/textureCubeLodEXT\s*\(/g, "textureLod("), e = e.replace(/textureCube\s*\(/g, "texture("), e = e.replace(/gl_FragDepthEXT/g, "gl_FragDepth"), e = e.replace(/gl_FragColor/g, "glFragColor"), e = e.replace(/gl_FragData/g, "glFragData"), e = e.replace(/gl_FragCoord/g, "glFragCoord_"), !this._fragmentIsGLES3)
        e = e.replace(/void\s+?main\s*\(/g, (o || d ? "" : `layout(location = 0) out vec4 glFragColor;
`) + "void main(");
      else {
        const f = /^\s*out\s+\S+\s+\S+\s*;/gm.exec(e);
        f !== null && (e = e.substring(0, f.index) + "layout(location = 0) " + e.substring(f.index));
      }
      e = e.replace(/dFdy/g, "(-yFactor_)*dFdy"), e = e.replace("##INJECTCODE##", h), l && (e = this._injectStartingAndEndingCode(e, "void main", c));
    } else if (e = e.replace(/gl_InstanceID/g, "gl_InstanceIndex"), e = e.replace(/gl_VertexID/g, "gl_VertexIndex"), t.indexOf("#define MULTIVIEW") !== -1)
      return `#extension GL_OVR_multiview2 : require
layout (num_views = 2) in;
` + e;
    if (!r) {
      const l = e.lastIndexOf("}");
      e = e.substring(0, l), e += `gl_Position.y *= yFactor_;
`, s.isNDCHalfZRange || (e += `gl_Position.z = (gl_Position.z + gl_Position.w) / 2.0;
`), e += "}";
    }
    return e;
  }
  _applyTextureArrayProcessing(e, t) {
    const r = new RegExp(t + "\\s*\\[(.+)?\\]", "gm");
    let n = r.exec(e);
    for (; n !== null; ) {
      const s = n[1];
      let o = +s;
      this._preProcessors && isNaN(o) && (o = +this._preProcessors[s.trim()]), e = e.replace(n[0], t + o), n = r.exec(e);
    }
    return e;
  }
  _generateLeftOverUBOCode(e, t) {
    let r = `layout(set = ${t.binding.groupIndex}, binding = ${t.binding.bindingIndex}) uniform ${e} {
    `;
    for (const n of this._webgpuProcessingContext.leftOverUniforms)
      n.length > 0 ? r += `    ${n.type} ${n.name}[${n.length}];
` : r += `    ${n.type} ${n.name};
`;
    return r += `};

`, r;
  }
  finalizeShaders(e, t) {
    for (let n = 0; n < this._textureArrayProcessing.length; ++n) {
      const s = this._textureArrayProcessing[n];
      e = this._applyTextureArrayProcessing(e, s), t = this._applyTextureArrayProcessing(t, s);
    }
    for (let n = 0; n < this._missingVaryings.length; ++n) {
      const s = this._missingVaryings[n];
      s && s.length > 0 && (t = s + `
` + t);
    }
    const r = this._buildLeftOverUBO();
    return e = r + e, t = r + t, this._collectBindingNames(), this._preCreateBindGroupEntries(), this._preProcessors = null, this.vertexBufferKindToNumberOfComponents = {}, { vertexCode: e, fragmentCode: t };
  }
}
function be(a, e, t, r) {
  let n = r, s = 0, o = "";
  for (; n < t.length; ) {
    const u = t.charAt(n);
    if (o)
      u === o ? o === '"' || o === "'" ? t.charAt(n - 1) !== "\\" && (o = "") : o = "" : o === "*/" && u === "*" && n + 1 < t.length && (t.charAt(n + 1) === "/" && (o = ""), o === "" && n++);
    else
      switch (u) {
        case a:
          s++;
          break;
        case e:
          s--;
          break;
        case '"':
        case "'":
        case "`":
          o = u;
          break;
        case "/":
          if (n + 1 < t.length) {
            const l = t.charAt(n + 1);
            l === "/" ? o = `
` : l === "*" && (o = "*/");
          }
          break;
      }
    if (n++, s === 0)
      break;
  }
  return s === 0 ? n - 1 : -1;
}
function at(a, e) {
  for (; e < a.length; ) {
    const t = a[e];
    if (t !== " " && t !== `
` && t !== "\r" && t !== "	" && t !== `
` && t !== " ")
      break;
    e++;
  }
  return e;
}
function De(a) {
  const e = a.charCodeAt(0);
  return e >= 48 && e <= 57 || // 0-9
  e >= 65 && e <= 90 || // A-Z
  e >= 97 && e <= 122 || // a-z
  e == 95;
}
function Ne(a) {
  let e = 0, t = "", r = !1;
  const n = [];
  for (; e < a.length; ) {
    const s = a.charAt(e);
    if (t)
      s === t ? t === '"' || t === "'" ? (a.charAt(e - 1) !== "\\" && (t = ""), n.push(s)) : (t = "", r = !1) : t === "*/" && s === "*" && e + 1 < a.length ? (a.charAt(e + 1) === "/" && (t = ""), t === "" && (r = !1, e++)) : r || n.push(s);
    else {
      switch (s) {
        case '"':
        case "'":
        case "`":
          t = s;
          break;
        case "/":
          if (e + 1 < a.length) {
            const o = a.charAt(e + 1);
            o === "/" ? (t = `
`, r = !0) : o === "*" && (t = "*/", r = !0);
          }
          break;
      }
      r || n.push(s);
    }
    e++;
  }
  return n.join("");
}
function Et(a, e, t, r) {
  for (; e >= 0 && a.charAt(e) !== t && a.charAt(e) !== r; )
    e--;
  return e;
}
function Ut(a) {
  return a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const Lt = "bonesDeclaration", Dt = `#if NUM_BONE_INFLUENCERS>0
attribute matricesIndices : vec4<f32>;attribute matricesWeights : vec4<f32>;
#if NUM_BONE_INFLUENCERS>4
attribute matricesIndicesExtra : vec4<f32>;attribute matricesWeightsExtra : vec4<f32>;
#endif
#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#ifdef BONETEXTURE
var boneSampler : texture_2d<f32>;uniform boneTextureWidth : f32;
#else
uniform mBones : array<mat4x4,BonesPerMesh>;
#ifdef BONES_VELOCITY_ENABLED
uniform mPreviousBones : array<mat4x4,BonesPerMesh>;
#endif
#endif
#ifdef BONETEXTURE
fn readMatrixFromRawSampler(smp : texture_2d<f32>,index : f32)->mat4x4<f32>
{let offset=i32(index) *4; 
let m0=textureLoad(smp,vec2<i32>(offset+0,0),0);let m1=textureLoad(smp,vec2<i32>(offset+1,0),0);let m2=textureLoad(smp,vec2<i32>(offset+2,0),0);let m3=textureLoad(smp,vec2<i32>(offset+3,0),0);return mat4x4<f32>(m0,m1,m2,m3);}
#endif
#endif
#endif
`;
V.IncludesShadersStoreWGSL[Lt] = Dt;
const Ft = "bonesVertex", Pt = `#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#if NUM_BONE_INFLUENCERS>0
var influence : mat4x4<f32>;
#ifdef BONETEXTURE
influence=readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndices[0])*vertexInputs.matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndices[1])*vertexInputs.matricesWeights[1];
#endif 
#if NUM_BONE_INFLUENCERS>2
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndices[2])*vertexInputs.matricesWeights[2];
#endif 
#if NUM_BONE_INFLUENCERS>3
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndices[3])*vertexInputs.matricesWeights[3];
#endif 
#if NUM_BONE_INFLUENCERS>4
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndicesExtra[0])*vertexInputs.matricesWeightsExtra[0];
#endif 
#if NUM_BONE_INFLUENCERS>5
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndicesExtra[1])*vertexInputs.matricesWeightsExtra[1];
#endif 
#if NUM_BONE_INFLUENCERS>6
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndicesExtra[2])*vertexInputs.matricesWeightsExtra[2];
#endif 
#if NUM_BONE_INFLUENCERS>7
influence=influence+readMatrixFromRawSampler(boneSampler,vertexInputs.matricesIndicesExtra[3])*vertexInputs.matricesWeightsExtra[3];
#endif 
#else 
influence=uniforms.mBones[int(vertexInputs.matricesIndices[0])]*vertexInputs.matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence=influence+uniforms.mBones[int(vertexInputs.matricesIndices[1])]*vertexInputs.matricesWeights[1];
#endif 
#if NUM_BONE_INFLUENCERS>2
influence=influence+uniforms.mBones[int(vertexInputs.matricesIndices[2])]*vertexInputs.matricesWeights[2];
#endif 
#if NUM_BONE_INFLUENCERS>3
influence=influence+uniforms.mBones[int(vertexInputs.matricesIndices[3])]*vertexInputs.matricesWeights[3];
#endif 
#if NUM_BONE_INFLUENCERS>4
influence=influence+uniforms.mBones[int(vertexInputs.matricesIndicesExtra[0])]*vertexInputs.matricesWeightsExtra[0];
#endif 
#if NUM_BONE_INFLUENCERS>5
influence=influence+uniforms.mBones[int(vertexInputs.matricesIndicesExtra[1])]*vertexInputs.matricesWeightsExtra[1];
#endif 
#if NUM_BONE_INFLUENCERS>6
influence=influence+uniforms.mBones[int(vertexInputs.matricesIndicesExtra[2])]*vertexInputs.matricesWeightsExtra[2];
#endif 
#if NUM_BONE_INFLUENCERS>7
influence=influence+uniforms.mBones[int(vertexInputs.matricesIndicesExtra[3])]*vertexInputs.matricesWeightsExtra[3];
#endif 
#endif
finalWorld=finalWorld*influence;
#endif
#endif
`;
V.IncludesShadersStoreWGSL[Ft] = Pt;
const Mt = "bakedVertexAnimationDeclaration", Nt = `#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
uniform bakedVertexAnimationTime: f32;uniform bakedVertexAnimationTextureSizeInverted: vec2<f32>;uniform bakedVertexAnimationSettings: vec4<f32>;var bakedVertexAnimationTexture : texture_2d<f32>;
#ifdef INSTANCES
attribute bakedVertexAnimationSettingsInstanced : vec4<f32>;
#endif
fn readMatrixFromRawSamplerVAT(smp : texture_2d<f32>,index : f32,frame : f32)->mat4x4<f32>
{let offset=i32(index)*4;let frameUV=i32(frame);let m0=textureLoad(smp,vec2<i32>(offset+0,frameUV),0);let m1=textureLoad(smp,vec2<i32>(offset+1,frameUV),0);let m2=textureLoad(smp,vec2<i32>(offset+2,frameUV),0);let m3=textureLoad(smp,vec2<i32>(offset+3,frameUV),0);return mat4x4<f32>(m0,m1,m2,m3);}
#endif
`;
V.IncludesShadersStoreWGSL[Mt] = Nt;
const Ot = "bakedVertexAnimation", Vt = `#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
{
#ifdef INSTANCES
let VATStartFrame: f32=vertexInputs.bakedVertexAnimationSettingsInstanced.x;let VATEndFrame: f32=vertexInputs.bakedVertexAnimationSettingsInstanced.y;let VATOffsetFrame: f32=vertexInputs.bakedVertexAnimationSettingsInstanced.z;let VATSpeed: f32=vertexInputs.bakedVertexAnimationSettingsInstanced.w;
#else
let VATStartFrame: f32=uniforms.bakedVertexAnimationSettings.x;let VATEndFrame: f32=uniforms.bakedVertexAnimationSettings.y;let VATOffsetFrame: f32=uniforms.bakedVertexAnimationSettings.z;let VATSpeed: f32=uniforms.bakedVertexAnimationSettings.w;
#endif
let totalFrames: f32=VATEndFrame-VATStartFrame+1.0;let time: f32=uniforms.bakedVertexAnimationTime*VATSpeed/totalFrames;let frameCorrection: f32=select(1.0,0.0,time<1.0);let numOfFrames: f32=totalFrames-frameCorrection;var VATFrameNum: f32=fract(time)*numOfFrames;VATFrameNum=(VATFrameNum+VATOffsetFrame) % numOfFrames;VATFrameNum=floor(VATFrameNum);VATFrameNum=VATFrameNum+VATStartFrame+frameCorrection;var VATInfluence : mat4x4<f32>;VATInfluence=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndices[0],VATFrameNum)*vertexInputs.matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndices[1],VATFrameNum)*vertexInputs.matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndices[2],VATFrameNum)*vertexInputs.matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndices[3],VATFrameNum)*vertexInputs.matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndicesExtra[0],VATFrameNum)*vertexInputs.matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndicesExtra[1],VATFrameNum)*vertexInputs.matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndicesExtra[2],VATFrameNum)*vertexInputs.matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
VATInfluence=VATInfluence+readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,vertexInputs.matricesIndicesExtra[3],VATFrameNum)*vertexInputs.matricesWeightsExtra[3];
#endif
finalWorld=finalWorld*VATInfluence;}
#endif
`;
V.IncludesShadersStoreWGSL[Ot] = Vt;
const $t = "clipPlaneFragment", Wt = `#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
if (false) {}
#endif
#ifdef CLIPPLANE
else if (fragmentInputs.fClipDistance>0.0)
{discard;}
#endif
#ifdef CLIPPLANE2
else if (fragmentInputs.fClipDistance2>0.0)
{discard;}
#endif
#ifdef CLIPPLANE3
else if (fragmentInputs.fClipDistance3>0.0)
{discard;}
#endif
#ifdef CLIPPLANE4
else if (fragmentInputs.fClipDistance4>0.0)
{discard;}
#endif
#ifdef CLIPPLANE5
else if (fragmentInputs.fClipDistance5>0.0)
{discard;}
#endif
#ifdef CLIPPLANE6
else if (fragmentInputs.fClipDistance6>0.0)
{discard;}
#endif
`;
V.IncludesShadersStoreWGSL[$t] = Wt;
const kt = "clipPlaneFragmentDeclaration", qt = `#ifdef CLIPPLANE
varying fClipDistance: f32;
#endif
#ifdef CLIPPLANE2
varying fClipDistance2: f32;
#endif
#ifdef CLIPPLANE3
varying fClipDistance3: f32;
#endif
#ifdef CLIPPLANE4
varying fClipDistance4: f32;
#endif
#ifdef CLIPPLANE5
varying fClipDistance5: f32;
#endif
#ifdef CLIPPLANE6
varying fClipDistance6: f32;
#endif
`;
V.IncludesShadersStoreWGSL[kt] = qt;
const Ht = "clipPlaneVertex", zt = `#ifdef CLIPPLANE
vertexOutputs.fClipDistance=dot(worldPos,uniforms.vClipPlane);
#endif
#ifdef CLIPPLANE2
vertexOutputs.fClipDistance2=dot(worldPos,uniforms.vClipPlane2);
#endif
#ifdef CLIPPLANE3
vertexOutputs.fClipDistance3=dot(worldPos,uniforms.vClipPlane3);
#endif
#ifdef CLIPPLANE4
vertexOutputs.fClipDistance4=dot(worldPos,uniforms.vClipPlane4);
#endif
#ifdef CLIPPLANE5
vertexOutputs.fClipDistance5=dot(worldPos,uniforms.vClipPlane5);
#endif
#ifdef CLIPPLANE6
vertexOutputs.fClipDistance6=dot(worldPos,uniforms.vClipPlane6);
#endif
`;
V.IncludesShadersStoreWGSL[Ht] = zt;
const Yt = "clipPlaneVertexDeclaration", Qt = `#ifdef CLIPPLANE
uniform vClipPlane: vec4<f32>;varying fClipDistance: f32;
#endif
#ifdef CLIPPLANE2
uniform vClipPlane2: vec4<f32>;varying fClipDistance2: f32;
#endif
#ifdef CLIPPLANE3
uniform vClipPlane3: vec4<f32>;varying fClipDistance3: f32;
#endif
#ifdef CLIPPLANE4
uniform vClipPlane4: vec4<f32>;varying fClipDistance4: f32;
#endif
#ifdef CLIPPLANE5
uniform vClipPlane5: vec4<f32>;varying fClipDistance5: f32;
#endif
#ifdef CLIPPLANE6
uniform vClipPlane6: vec4<f32>;varying fClipDistance6: f32;
#endif
`;
V.IncludesShadersStoreWGSL[Yt] = Qt;
const Xt = "instancesDeclaration", Kt = `#ifdef INSTANCES
attribute world0 : vec4<f32>;attribute world1 : vec4<f32>;attribute world2 : vec4<f32>;attribute world3 : vec4<f32>;
#ifdef INSTANCESCOLOR
attribute instanceColor : vec4<f32>;
#endif
#if defined(THIN_INSTANCES) && !defined(WORLD_UBO)
uniform world : mat4x4<f32>;
#endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY)
attribute previousWorld0 : vec4<f32>;attribute previousWorld1 : vec4<f32>;attribute previousWorld2 : vec4<f32>;attribute previousWorld3 : vec4<f32>;
#ifdef THIN_INSTANCES
uniform previousWorld : mat4x4<f32>;
#endif
#endif
#else
#if !defined(WORLD_UBO)
uniform world : mat4x4<f32>;
#endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY)
uniform previousWorld : mat4x4<f32>;
#endif
#endif
`;
V.IncludesShadersStoreWGSL[Xt] = Kt;
const jt = "instancesVertex", Jt = `#ifdef INSTANCES
var finalWorld=mat4x4<f32>(vertexInputs.world0,vertexInputs.world1,vertexInputs.world2,vertexInputs.world3);
#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
var finalPreviousWorld=mat4x4<f32>(previousWorld0,previousWorld1,previousWorld2,previousWorld3);
#endif
#ifdef THIN_INSTANCES
#if !defined(WORLD_UBO)
finalWorld=uniforms.world*finalWorld;
#else
finalWorld=mesh.world*finalWorld;
#endif
#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
finalPreviousWorld=previousWorld*finalPreviousWorld;
#endif
#endif
#else
#if !defined(WORLD_UBO)
var finalWorld=uniforms.world;
#else
var finalWorld=mesh.world;
#endif
#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
var finalPreviousWorld=previousWorld;
#endif
#endif
`;
V.IncludesShadersStoreWGSL[jt] = Jt;
const Zt = "meshUboDeclaration", er = `struct Mesh {world : mat4x4<f32>,
visibility : f32,};var<uniform> mesh : Mesh;
#define WORLD_UBO
`;
V.IncludesShadersStoreWGSL[Zt] = er;
const tr = "morphTargetsVertex", rr = `#ifdef MORPHTARGETS
#ifdef MORPHTARGETS_TEXTURE
#if {X}==0
for (var i=0; i<$NUM_MORPH_INFLUENCERS$; i=i+1) {if (i>=uniforms.morphTargetCount) {break;}
vertexID=f32(vertexInputs.vertexIndex)*uniforms.morphTargetTextureInfo.x;positionUpdated=positionUpdated+(readVector3FromRawSampler({X},vertexID)-vertexInputs.position)*uniforms.morphTargetInfluences[{X}];vertexID=vertexID+1.0;
#ifdef MORPHTARGETS_NORMAL
normalUpdated=normalUpdated+(readVector3FromRawSampler({X},vertexID) -vertexInputs.normal)*uniforms.morphTargetInfluences[{X}];vertexID=vertexID+1.0;
#endif
#ifdef MORPHTARGETS_UV
uvUpdated=uvUpdated+(readVector3FromRawSampler({X},vertexID).xy-vertexInputs.uv)*uniforms.morphTargetInfluences[{X}];vertexID=vertexID+1.0;
#endif
#ifdef MORPHTARGETS_TANGENT
tangentUpdated.xyz=tangentUpdated.xyz+(readVector3FromRawSampler({X},vertexID) -vertexInputs.tangent.xyz)*uniforms.morphTargetInfluences[{X}];
#endif
}
#endif
#else
positionUpdated=positionUpdated+(position{X}-vertexInputs.position)*uniforms.morphTargetInfluences[{X}];
#ifdef MORPHTARGETS_NORMAL
normalUpdated+=(normal{X}-vertexInputs.normal)*uniforms.morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_TANGENT
tangentUpdated.xyz=tangentUpdated.xyz+(tangent{X}-vertexInputs.tangent.xyz)*uniforms.morphTargetInfluences[{X}];
#endif
#ifdef MORPHTARGETS_UV
uvUpdated=uvUpdated+(uv_{X}-vertexInputs.uv)*uniforms.morphTargetInfluences[{X}];
#endif
#endif
#endif
`;
V.IncludesShadersStoreWGSL[tr] = rr;
const nr = "morphTargetsVertexDeclaration", sr = `#ifdef MORPHTARGETS
#ifndef MORPHTARGETS_TEXTURE
attribute position{X} : vec3<f32>;
#ifdef MORPHTARGETS_NORMAL
attribute normal{X} : vec3<f32>;
#endif
#ifdef MORPHTARGETS_TANGENT
attribute tangent{X} : vec3<f32>;
#endif
#ifdef MORPHTARGETS_UV
attribute uv_{X} : vec2<f32>;
#endif
#elif {X}==0
uniform morphTargetCount: i32;
#endif
#endif
`;
V.IncludesShadersStoreWGSL[nr] = sr;
const ir = "morphTargetsVertexGlobal", ar = `#ifdef MORPHTARGETS
#ifdef MORPHTARGETS_TEXTURE
var vertexID : f32;
#endif
#endif
`;
V.IncludesShadersStoreWGSL[ir] = ar;
const or = "morphTargetsVertexGlobalDeclaration", ur = `#ifdef MORPHTARGETS
uniform morphTargetInfluences : array<f32,NUM_MORPH_INFLUENCERS>;
#ifdef MORPHTARGETS_TEXTURE 
uniform morphTargetTextureIndices : array<f32,NUM_MORPH_INFLUENCERS>;uniform morphTargetTextureInfo : vec3<f32>;var morphTargets : texture_2d_array<f32>;var morphTargetsSampler : sampler;fn readVector3FromRawSampler(targetIndex : i32,vertexIndex : f32)->vec3<f32>
{ 
let y=floor(vertexIndex/uniforms.morphTargetTextureInfo.y);let x=vertexIndex-y*uniforms.morphTargetTextureInfo.y;let textureUV=vec2<f32>((x+0.5)/uniforms.morphTargetTextureInfo.y,(y+0.5)/uniforms.morphTargetTextureInfo.z);return textureSampleLevel(morphTargets,morphTargetsSampler,textureUV,i32(uniforms.morphTargetTextureIndices[targetIndex]),0.0).xyz;}
#endif
#endif
`;
V.IncludesShadersStoreWGSL[or] = ur;
const lr = "sceneUboDeclaration", cr = `struct Scene {viewProjection : mat4x4<f32>,
#ifdef MULTIVIEW
viewProjectionR : mat4x4<f32>,
#endif 
view : mat4x4<f32>,
projection : mat4x4<f32>,
vEyePosition : vec4<f32>,};var<uniform> scene : Scene;
`;
V.IncludesShadersStoreWGSL[lr] = cr;
const ot = "fragmentOutputs.fragDepth", hr = "uniforms", dr = "internals", fr = {
  texture_1d: I.E1d,
  texture_2d: I.E2d,
  texture_2d_array: I.E2dArray,
  texture_3d: I.E3d,
  texture_cube: I.Cube,
  texture_cube_array: I.CubeArray,
  texture_multisampled_2d: I.E2d,
  texture_depth_2d: I.E2d,
  texture_depth_2d_array: I.E2dArray,
  texture_depth_cube: I.Cube,
  texture_depth_cube_array: I.CubeArray,
  texture_depth_multisampled_2d: I.E2d,
  texture_storage_1d: I.E1d,
  texture_storage_2d: I.E2d,
  texture_storage_2d_array: I.E2dArray,
  texture_storage_3d: I.E3d,
  texture_external: null
};
class pr extends L {
  constructor() {
    super(...arguments), this.shaderLanguage = j.WGSL, this.uniformRegexp = /uniform\s+(\w+)\s*:\s*(.+)\s*;/, this.textureRegexp = /var\s+(\w+)\s*:\s*((array<\s*)?(texture_\w+)\s*(<\s*(.+)\s*>)?\s*(,\s*\w+\s*>\s*)?);/, this.noPrecision = !0;
  }
  _getArraySize(e, t, r) {
    let n = 0;
    const s = t.lastIndexOf(">");
    if (t.indexOf("array") >= 0 && s > 0) {
      let o = s;
      for (; o > 0 && t.charAt(o) !== " " && t.charAt(o) !== ","; )
        o--;
      const u = t.substring(o + 1, s);
      for (n = +u, isNaN(n) && (n = +r[u.trim()]); o > 0 && (t.charAt(o) === " " || t.charAt(o) === ","); )
        o--;
      t = t.substring(t.indexOf("<") + 1, o + 1);
    }
    return [e, t, n];
  }
  initializeShaders(e) {
    this._webgpuProcessingContext = e, this._attributesInputWGSL = [], this._attributesWGSL = [], this._attributesConversionCodeWGSL = [], this._hasNonFloatAttribute = !1, this._varyingsWGSL = [], this._varyingNamesWGSL = [], this._stridedUniformArrays = [];
  }
  preProcessShaderCode(e) {
    const t = `struct ${L.InternalsUBOName} {
  yFactor_: f32,
  textureOutputHeight_: f32,
};
var<uniform> ${dr} : ${L.InternalsUBOName};
`;
    return e.indexOf(t) !== -1 ? e : t + Ne(e);
  }
  varyingCheck(e, t) {
    return /(flat|linear|perspective)?\s*(center|centroid|sample)?\s*\bvarying\b/.test(e);
  }
  varyingProcessor(e, t, r) {
    const s = /\s*(flat|linear|perspective)?\s*(center|centroid|sample)?\s*varying\s+(?:(?:highp)?|(?:lowp)?)\s*(\S+)\s*:\s*(.+)\s*;/gm.exec(e);
    if (s !== null) {
      const o = s[1] ?? "perspective", u = s[2] ?? "center", l = s[4], c = s[3], h = o === "flat" ? `@interpolate(${o})` : `@interpolate(${o}, ${u})`;
      let d;
      t ? (d = this._webgpuProcessingContext.availableVaryings[c], d === void 0 && y.Warn(`Invalid fragment shader: The varying named "${c}" is not declared in the vertex shader! This declaration will be ignored.`)) : (d = this._webgpuProcessingContext.getVaryingNextLocation(l, this._getArraySize(c, l, r)[2]), this._webgpuProcessingContext.availableVaryings[c] = d, this._varyingsWGSL.push(`  @location(${d}) ${h} ${c} : ${l},`), this._varyingNamesWGSL.push(c)), e = "";
    }
    return e;
  }
  attributeProcessor(e, t) {
    const n = /\s*attribute\s+(\S+)\s*:\s*(.+)\s*;/gm.exec(e);
    if (n !== null) {
      const s = n[2], o = n[1], u = this._webgpuProcessingContext.getAttributeNextLocation(s, this._getArraySize(o, s, t)[2]);
      this._webgpuProcessingContext.availableAttributes[o] = u, this._webgpuProcessingContext.orderedAttributes[u] = o;
      const l = this.vertexBufferKindToNumberOfComponents[o];
      if (l !== void 0) {
        const c = l < 0 ? l === -1 ? "i32" : "vec" + -l + "<i32>" : l === 1 ? "u32" : "vec" + l + "<u32>", h = `_int_${o}_`;
        this._attributesInputWGSL.push(`@location(${u}) ${h} : ${c},`), this._attributesWGSL.push(`${o} : ${s},`), this._attributesConversionCodeWGSL.push(`vertexInputs.${o} = ${s}(vertexInputs_.${h});`), this._hasNonFloatAttribute = !0;
      } else
        this._attributesInputWGSL.push(`@location(${u}) ${o} : ${s},`), this._attributesWGSL.push(`${o} : ${s},`), this._attributesConversionCodeWGSL.push(`vertexInputs.${o} = vertexInputs_.${o};`);
      e = "";
    }
    return e;
  }
  uniformProcessor(e, t, r) {
    const n = this.uniformRegexp.exec(e);
    if (n !== null) {
      const s = n[2], o = n[1];
      this._addUniformToLeftOverUBO(o, s, r), e = "";
    }
    return e;
  }
  textureProcessor(e, t, r) {
    const n = this.textureRegexp.exec(e);
    if (n !== null) {
      const s = n[1], o = n[2], u = !!n[3], l = n[4], c = l.indexOf("storage") > 0, h = n[6], d = c ? h.substring(0, h.indexOf(",")).trim() : null;
      let f = u ? this._getArraySize(s, o, r)[2] : 0, _ = this._webgpuProcessingContext.availableTextures[s];
      if (_)
        f = _.textures.length;
      else {
        _ = {
          isTextureArray: f > 0,
          isStorageTexture: c,
          textures: [],
          sampleType: H.Float
        }, f = f || 1;
        for (let x = 0; x < f; ++x)
          _.textures.push(this._webgpuProcessingContext.getNextFreeUBOBinding());
      }
      this._webgpuProcessingContext.availableTextures[s] = _;
      const m = l.indexOf("depth") > 0, g = fr[l], p = m ? H.Depth : h === "u32" ? H.Uint : h === "i32" ? H.Sint : H.Float;
      if (_.sampleType = p, g === void 0)
        throw `Can't get the texture dimension corresponding to the texture function "${l}"!`;
      for (let x = 0; x < f; ++x) {
        const { groupIndex: S, bindingIndex: b } = _.textures[x];
        x === 0 && (e = `@group(${S}) @binding(${b}) ${e}`), this._addTextureBindingDescription(s, _, x, g, d, !t);
      }
    }
    return e;
  }
  postProcessor(e, t) {
    const r = {};
    for (const n of t) {
      const s = n.split(/ +/);
      r[s[1]] = s.length > 2 ? s[2] : "";
    }
    return e.replace(/\$(\w+)\$/g, (n, s) => r[s] ?? s);
  }
  finalizeShaders(e, t) {
    const r = t.indexOf("fragmentInputs.position") >= 0 ? `
            if (internals.yFactor_ == 1.) {
                fragmentInputs.position.y = internals.textureOutputHeight_ - fragmentInputs.position.y;
            }
        ` : "";
    e = this._processSamplers(e, !0), t = this._processSamplers(t, !1), e = this._processCustomBuffers(e, !0), t = this._processCustomBuffers(t, !1);
    const n = this._buildLeftOverUBO();
    e = n + e, t = n + t, e = e.replace(/#define /g, "//#define "), e = this._processStridedUniformArrays(e);
    let s = `struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
`;
    this._attributesInputWGSL.length > 0 && (s += this._attributesInputWGSL.join(`
`)), s += `
};
var<private> vertexInputs` + (this._hasNonFloatAttribute ? "_" : "") + ` : VertexInputs;
`, this._hasNonFloatAttribute && (s += `struct VertexInputs_ {
  vertexIndex : u32, instanceIndex : u32,
`, s += this._attributesWGSL.join(`
`), s += `
};
var<private> vertexInputs : VertexInputs_;
`);
    let o = `struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
`;
    this._varyingsWGSL.length > 0 && (o += this._varyingsWGSL.join(`
`)), o += `
};
var<private> vertexOutputs : FragmentInputs;
`, e = s + o + e;
    let u = `
  vertexInputs${this._hasNonFloatAttribute ? "_" : ""} = input;
`;
    this._hasNonFloatAttribute && (u += `vertexInputs.vertexIndex = vertexInputs_.vertexIndex;
vertexInputs.instanceIndex = vertexInputs_.instanceIndex;
`, u += this._attributesConversionCodeWGSL.join(`
`), u += `
`), e = this._injectStartingAndEndingCode(e, "fn main", u, `  vertexOutputs.position.y = vertexOutputs.position.y * internals.yFactor_;
  return vertexOutputs;`), t = t.replace(/#define /g, "//#define "), t = this._processStridedUniformArrays(t), t = t.replace(/dpdy/g, "(-internals.yFactor_)*dpdy");
    let c = `struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @builtin(front_facing) frontFacing : bool,
`;
    this._varyingsWGSL.length > 0 && (c += this._varyingsWGSL.join(`
`)), c += `
};
var<private> fragmentInputs : FragmentInputs;
`;
    let h = `struct FragmentOutputs {
  @location(0) color : vec4<f32>,
`, d = !1, f = 0;
    for (; !d && (f = t.indexOf(ot, f), !(f < 0)); ) {
      const g = f;
      for (d = !0; f > 1 && t.charAt(f) !== `
`; ) {
        if (t.charAt(f) === "/" && t.charAt(f - 1) === "/") {
          d = !1;
          break;
        }
        f--;
      }
      f = g + ot.length;
    }
    d && (h += `  @builtin(frag_depth) fragDepth: f32,
`), h += `};
var<private> fragmentOutputs : FragmentOutputs;
`, t = c + h + t;
    const _ = `  fragmentInputs = input;
  ` + r;
    return t = this._injectStartingAndEndingCode(t, "fn main", _, "  return fragmentOutputs;"), this._collectBindingNames(), this._preCreateBindGroupEntries(), this.vertexBufferKindToNumberOfComponents = {}, { vertexCode: e, fragmentCode: t };
  }
  _generateLeftOverUBOCode(e, t) {
    let r = "", n = `struct ${e} {
`;
    for (const s of this._webgpuProcessingContext.leftOverUniforms) {
      const o = s.type.replace(/^(.*?)(<.*>)?$/, "$1"), u = L.UniformSizes[o];
      if (s.length > 0)
        if (u <= 2) {
          const l = `${e}_${this._stridedUniformArrays.length}_strided_arr`;
          r += `struct ${l} {
                        @size(16)
                        el: ${o},
                    }`, this._stridedUniformArrays.push(s.name), n += ` @align(16) ${s.name} : array<${l}, ${s.length}>,
`;
        } else
          n += ` ${s.name} : array<${s.type}, ${s.length}>,
`;
      else
        n += `  ${s.name} : ${s.type},
`;
    }
    return n += `};
`, n = `${r}
${n}`, n += `@group(${t.binding.groupIndex}) @binding(${t.binding.bindingIndex}) var<uniform> ${hr} : ${e};
`, n;
  }
  _processSamplers(e, t) {
    const r = /var\s+(\w+Sampler)\s*:\s*(sampler|sampler_comparison)\s*;/gm;
    for (; ; ) {
      const n = r.exec(e);
      if (n === null)
        break;
      const s = n[1], o = n[2], u = s.indexOf(L.AutoSamplerSuffix) === s.length - L.AutoSamplerSuffix.length ? s.substring(0, s.indexOf(L.AutoSamplerSuffix)) : null, l = o === "sampler_comparison" ? ue.Comparison : ue.Filtering;
      if (u) {
        const _ = this._webgpuProcessingContext.availableTextures[u];
        _ && (_.autoBindSampler = !0);
      }
      let c = this._webgpuProcessingContext.availableSamplers[s];
      c || (c = {
        binding: this._webgpuProcessingContext.getNextFreeUBOBinding(),
        type: l
      }, this._webgpuProcessingContext.availableSamplers[s] = c), this._addSamplerBindingDescription(s, c, t);
      const h = e.substring(0, n.index), d = `@group(${c.binding.groupIndex}) @binding(${c.binding.bindingIndex}) `, f = e.substring(n.index);
      e = h + d + f, r.lastIndex += d.length;
    }
    return e;
  }
  _processCustomBuffers(e, t) {
    const r = /var<\s*(uniform|storage)\s*(,\s*(read|read_write)\s*)?>\s+(\S+)\s*:\s*(\S+)\s*;/gm;
    for (; ; ) {
      const n = r.exec(e);
      if (n === null)
        break;
      const s = n[1], o = n[3];
      let u = n[4];
      const l = n[5];
      let c = this._webgpuProcessingContext.availableBuffers[u];
      if (!c) {
        const g = s === "uniform" ? z.KnownUBOs[l] : null;
        let p;
        g ? (u = l, p = g.binding, p.groupIndex === -1 && (p = this._webgpuProcessingContext.availableBuffers[u]?.binding, p || (p = this._webgpuProcessingContext.getNextFreeUBOBinding()))) : p = this._webgpuProcessingContext.getNextFreeUBOBinding(), c = { binding: p }, this._webgpuProcessingContext.availableBuffers[u] = c;
      }
      this._addBufferBindingDescription(u, this._webgpuProcessingContext.availableBuffers[u], o === "read_write" ? ae.Storage : s === "storage" ? ae.ReadOnlyStorage : ae.Uniform, t);
      const h = c.binding.groupIndex, d = c.binding.bindingIndex, f = e.substring(0, n.index), _ = `@group(${h}) @binding(${d}) `, m = e.substring(n.index);
      e = f + _ + m, r.lastIndex += _.length;
    }
    return e;
  }
  _processStridedUniformArrays(e) {
    for (const t of this._stridedUniformArrays)
      e = e.replace(new RegExp(`${t}\\s*\\[(.*)\\]`, "g"), `${t}[$1].el`);
    return e;
  }
}
class T {
  static ComputeNumMipmapLevels(e, t) {
    return ht.ILog2(Math.max(e, t)) + 1;
  }
  static GetTextureTypeFromFormat(e) {
    switch (e) {
      case i.R8Unorm:
      case i.R8Snorm:
      case i.R8Uint:
      case i.R8Sint:
      case i.RG8Unorm:
      case i.RG8Snorm:
      case i.RG8Uint:
      case i.RG8Sint:
      case i.RGBA8Unorm:
      case i.RGBA8UnormSRGB:
      case i.RGBA8Snorm:
      case i.RGBA8Uint:
      case i.RGBA8Sint:
      case i.BGRA8Unorm:
      case i.BGRA8UnormSRGB:
      case i.RGB10A2UINT:
      case i.RGB10A2Unorm:
      case i.RGB9E5UFloat:
      case i.RG11B10UFloat:
      case i.BC7RGBAUnorm:
      case i.BC7RGBAUnormSRGB:
      case i.BC6HRGBUFloat:
      case i.BC6HRGBFloat:
      case i.BC5RGUnorm:
      case i.BC5RGSnorm:
      case i.BC3RGBAUnorm:
      case i.BC3RGBAUnormSRGB:
      case i.BC2RGBAUnorm:
      case i.BC2RGBAUnormSRGB:
      case i.BC4RUnorm:
      case i.BC4RSnorm:
      case i.BC1RGBAUnorm:
      case i.BC1RGBAUnormSRGB:
      case i.ETC2RGB8Unorm:
      case i.ETC2RGB8UnormSRGB:
      case i.ETC2RGB8A1Unorm:
      case i.ETC2RGB8A1UnormSRGB:
      case i.ETC2RGBA8Unorm:
      case i.ETC2RGBA8UnormSRGB:
      case i.EACR11Unorm:
      case i.EACR11Snorm:
      case i.EACRG11Unorm:
      case i.EACRG11Snorm:
      case i.ASTC4x4Unorm:
      case i.ASTC4x4UnormSRGB:
      case i.ASTC5x4Unorm:
      case i.ASTC5x4UnormSRGB:
      case i.ASTC5x5Unorm:
      case i.ASTC5x5UnormSRGB:
      case i.ASTC6x5Unorm:
      case i.ASTC6x5UnormSRGB:
      case i.ASTC6x6Unorm:
      case i.ASTC6x6UnormSRGB:
      case i.ASTC8x5Unorm:
      case i.ASTC8x5UnormSRGB:
      case i.ASTC8x6Unorm:
      case i.ASTC8x6UnormSRGB:
      case i.ASTC8x8Unorm:
      case i.ASTC8x8UnormSRGB:
      case i.ASTC10x5Unorm:
      case i.ASTC10x5UnormSRGB:
      case i.ASTC10x6Unorm:
      case i.ASTC10x6UnormSRGB:
      case i.ASTC10x8Unorm:
      case i.ASTC10x8UnormSRGB:
      case i.ASTC10x10Unorm:
      case i.ASTC10x10UnormSRGB:
      case i.ASTC12x10Unorm:
      case i.ASTC12x10UnormSRGB:
      case i.ASTC12x12Unorm:
      case i.ASTC12x12UnormSRGB:
      case i.Stencil8:
        return 0;
      case i.R16Uint:
      case i.R16Sint:
      case i.RG16Uint:
      case i.RG16Sint:
      case i.RGBA16Uint:
      case i.RGBA16Sint:
      case i.Depth16Unorm:
        return 5;
      case i.R16Float:
      case i.RG16Float:
      case i.RGBA16Float:
        return 2;
      case i.R32Uint:
      case i.R32Sint:
      case i.RG32Uint:
      case i.RG32Sint:
      case i.RGBA32Uint:
      case i.RGBA32Sint:
        return 7;
      case i.R32Float:
      case i.RG32Float:
      case i.RGBA32Float:
      case i.Depth32Float:
      case i.Depth32FloatStencil8:
      case i.Depth24Plus:
      case i.Depth24PlusStencil8:
        return 1;
    }
    return 0;
  }
  static GetBlockInformationFromFormat(e) {
    switch (e) {
      case i.R8Unorm:
      case i.R8Snorm:
      case i.R8Uint:
      case i.R8Sint:
        return { width: 1, height: 1, length: 1 };
      case i.R16Uint:
      case i.R16Sint:
      case i.R16Float:
      case i.RG8Unorm:
      case i.RG8Snorm:
      case i.RG8Uint:
      case i.RG8Sint:
        return { width: 1, height: 1, length: 2 };
      case i.R32Uint:
      case i.R32Sint:
      case i.R32Float:
      case i.RG16Uint:
      case i.RG16Sint:
      case i.RG16Float:
      case i.RGBA8Unorm:
      case i.RGBA8UnormSRGB:
      case i.RGBA8Snorm:
      case i.RGBA8Uint:
      case i.RGBA8Sint:
      case i.BGRA8Unorm:
      case i.BGRA8UnormSRGB:
      case i.RGB9E5UFloat:
      case i.RGB10A2UINT:
      case i.RGB10A2Unorm:
      case i.RG11B10UFloat:
        return { width: 1, height: 1, length: 4 };
      case i.RG32Uint:
      case i.RG32Sint:
      case i.RG32Float:
      case i.RGBA16Uint:
      case i.RGBA16Sint:
      case i.RGBA16Float:
        return { width: 1, height: 1, length: 8 };
      case i.RGBA32Uint:
      case i.RGBA32Sint:
      case i.RGBA32Float:
        return { width: 1, height: 1, length: 16 };
      case i.Stencil8:
        throw "No fixed size for Stencil8 format!";
      case i.Depth16Unorm:
        return { width: 1, height: 1, length: 2 };
      case i.Depth24Plus:
        throw "No fixed size for Depth24Plus format!";
      case i.Depth24PlusStencil8:
        throw "No fixed size for Depth24PlusStencil8 format!";
      case i.Depth32Float:
        return { width: 1, height: 1, length: 4 };
      case i.Depth32FloatStencil8:
        return { width: 1, height: 1, length: 5 };
      case i.BC7RGBAUnorm:
      case i.BC7RGBAUnormSRGB:
      case i.BC6HRGBUFloat:
      case i.BC6HRGBFloat:
      case i.BC5RGUnorm:
      case i.BC5RGSnorm:
      case i.BC3RGBAUnorm:
      case i.BC3RGBAUnormSRGB:
      case i.BC2RGBAUnorm:
      case i.BC2RGBAUnormSRGB:
        return { width: 4, height: 4, length: 16 };
      case i.BC4RUnorm:
      case i.BC4RSnorm:
      case i.BC1RGBAUnorm:
      case i.BC1RGBAUnormSRGB:
        return { width: 4, height: 4, length: 8 };
      case i.ETC2RGB8Unorm:
      case i.ETC2RGB8UnormSRGB:
      case i.ETC2RGB8A1Unorm:
      case i.ETC2RGB8A1UnormSRGB:
      case i.EACR11Unorm:
      case i.EACR11Snorm:
        return { width: 4, height: 4, length: 8 };
      case i.ETC2RGBA8Unorm:
      case i.ETC2RGBA8UnormSRGB:
      case i.EACRG11Unorm:
      case i.EACRG11Snorm:
        return { width: 4, height: 4, length: 16 };
      case i.ASTC4x4Unorm:
      case i.ASTC4x4UnormSRGB:
        return { width: 4, height: 4, length: 16 };
      case i.ASTC5x4Unorm:
      case i.ASTC5x4UnormSRGB:
        return { width: 5, height: 4, length: 16 };
      case i.ASTC5x5Unorm:
      case i.ASTC5x5UnormSRGB:
        return { width: 5, height: 5, length: 16 };
      case i.ASTC6x5Unorm:
      case i.ASTC6x5UnormSRGB:
        return { width: 6, height: 5, length: 16 };
      case i.ASTC6x6Unorm:
      case i.ASTC6x6UnormSRGB:
        return { width: 6, height: 6, length: 16 };
      case i.ASTC8x5Unorm:
      case i.ASTC8x5UnormSRGB:
        return { width: 8, height: 5, length: 16 };
      case i.ASTC8x6Unorm:
      case i.ASTC8x6UnormSRGB:
        return { width: 8, height: 6, length: 16 };
      case i.ASTC8x8Unorm:
      case i.ASTC8x8UnormSRGB:
        return { width: 8, height: 8, length: 16 };
      case i.ASTC10x5Unorm:
      case i.ASTC10x5UnormSRGB:
        return { width: 10, height: 5, length: 16 };
      case i.ASTC10x6Unorm:
      case i.ASTC10x6UnormSRGB:
        return { width: 10, height: 6, length: 16 };
      case i.ASTC10x8Unorm:
      case i.ASTC10x8UnormSRGB:
        return { width: 10, height: 8, length: 16 };
      case i.ASTC10x10Unorm:
      case i.ASTC10x10UnormSRGB:
        return { width: 10, height: 10, length: 16 };
      case i.ASTC12x10Unorm:
      case i.ASTC12x10UnormSRGB:
        return { width: 12, height: 10, length: 16 };
      case i.ASTC12x12Unorm:
      case i.ASTC12x12UnormSRGB:
        return { width: 12, height: 12, length: 16 };
    }
    return { width: 1, height: 1, length: 4 };
  }
  static IsHardwareTexture(e) {
    return !!e.release;
  }
  static IsInternalTexture(e) {
    return !!e.dispose;
  }
  static IsImageBitmap(e) {
    return e.close !== void 0;
  }
  static IsImageBitmapArray(e) {
    return Array.isArray(e) && e[0].close !== void 0;
  }
  static IsCompressedFormat(e) {
    switch (e) {
      case i.BC7RGBAUnormSRGB:
      case i.BC7RGBAUnorm:
      case i.BC6HRGBFloat:
      case i.BC6HRGBUFloat:
      case i.BC5RGSnorm:
      case i.BC5RGUnorm:
      case i.BC4RSnorm:
      case i.BC4RUnorm:
      case i.BC3RGBAUnormSRGB:
      case i.BC3RGBAUnorm:
      case i.BC2RGBAUnormSRGB:
      case i.BC2RGBAUnorm:
      case i.BC1RGBAUnormSRGB:
      case i.BC1RGBAUnorm:
      case i.ETC2RGB8Unorm:
      case i.ETC2RGB8UnormSRGB:
      case i.ETC2RGB8A1Unorm:
      case i.ETC2RGB8A1UnormSRGB:
      case i.ETC2RGBA8Unorm:
      case i.ETC2RGBA8UnormSRGB:
      case i.EACR11Unorm:
      case i.EACR11Snorm:
      case i.EACRG11Unorm:
      case i.EACRG11Snorm:
      case i.ASTC4x4Unorm:
      case i.ASTC4x4UnormSRGB:
      case i.ASTC5x4Unorm:
      case i.ASTC5x4UnormSRGB:
      case i.ASTC5x5Unorm:
      case i.ASTC5x5UnormSRGB:
      case i.ASTC6x5Unorm:
      case i.ASTC6x5UnormSRGB:
      case i.ASTC6x6Unorm:
      case i.ASTC6x6UnormSRGB:
      case i.ASTC8x5Unorm:
      case i.ASTC8x5UnormSRGB:
      case i.ASTC8x6Unorm:
      case i.ASTC8x6UnormSRGB:
      case i.ASTC8x8Unorm:
      case i.ASTC8x8UnormSRGB:
      case i.ASTC10x5Unorm:
      case i.ASTC10x5UnormSRGB:
      case i.ASTC10x6Unorm:
      case i.ASTC10x6UnormSRGB:
      case i.ASTC10x8Unorm:
      case i.ASTC10x8UnormSRGB:
      case i.ASTC10x10Unorm:
      case i.ASTC10x10UnormSRGB:
      case i.ASTC12x10Unorm:
      case i.ASTC12x10UnormSRGB:
      case i.ASTC12x12Unorm:
      case i.ASTC12x12UnormSRGB:
        return !0;
    }
    return !1;
  }
  static GetWebGPUTextureFormat(e, t, r = !1) {
    switch (t) {
      case 15:
        return i.Depth16Unorm;
      case 16:
        return i.Depth24Plus;
      case 13:
        return i.Depth24PlusStencil8;
      case 14:
        return i.Depth32Float;
      case 18:
        return i.Depth32FloatStencil8;
      case 19:
        return i.Stencil8;
      case 36492:
        return r ? i.BC7RGBAUnormSRGB : i.BC7RGBAUnorm;
      case 36495:
        return i.BC6HRGBUFloat;
      case 36494:
        return i.BC6HRGBFloat;
      case 33779:
        return r ? i.BC3RGBAUnormSRGB : i.BC3RGBAUnorm;
      case 33778:
        return r ? i.BC2RGBAUnormSRGB : i.BC2RGBAUnorm;
      case 33777:
      case 33776:
        return r ? i.BC1RGBAUnormSRGB : i.BC1RGBAUnorm;
      case 37808:
        return r ? i.ASTC4x4UnormSRGB : i.ASTC4x4Unorm;
      case 36196:
      case 37492:
        return r ? i.ETC2RGB8UnormSRGB : i.ETC2RGB8Unorm;
      case 37496:
        return r ? i.ETC2RGBA8UnormSRGB : i.ETC2RGBA8Unorm;
    }
    switch (e) {
      case 3:
        switch (t) {
          case 6:
            return i.R8Snorm;
          case 7:
            return i.RG8Snorm;
          case 4:
            throw "RGB format not supported in WebGPU";
          case 8:
            return i.R8Sint;
          case 9:
            return i.RG8Sint;
          case 10:
            throw "RGB_INTEGER format not supported in WebGPU";
          case 11:
            return i.RGBA8Sint;
          default:
            return i.RGBA8Snorm;
        }
      case 0:
        switch (t) {
          case 6:
            return i.R8Unorm;
          case 7:
            return i.RG8Unorm;
          case 4:
            throw "TEXTUREFORMAT_RGB format not supported in WebGPU";
          case 5:
            return r ? i.RGBA8UnormSRGB : i.RGBA8Unorm;
          case 12:
            return r ? i.BGRA8UnormSRGB : i.BGRA8Unorm;
          case 8:
            return i.R8Uint;
          case 9:
            return i.RG8Uint;
          case 10:
            throw "RGB_INTEGER format not supported in WebGPU";
          case 11:
            return i.RGBA8Uint;
          case 0:
            throw "TEXTUREFORMAT_ALPHA format not supported in WebGPU";
          case 1:
            throw "TEXTUREFORMAT_LUMINANCE format not supported in WebGPU";
          case 2:
            throw "TEXTUREFORMAT_LUMINANCE_ALPHA format not supported in WebGPU";
          default:
            return i.RGBA8Unorm;
        }
      case 4:
        switch (t) {
          case 8:
            return i.R16Sint;
          case 9:
            return i.RG16Sint;
          case 10:
            throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
          case 11:
            return i.RGBA16Sint;
          default:
            return i.RGBA16Sint;
        }
      case 5:
        switch (t) {
          case 8:
            return i.R16Uint;
          case 9:
            return i.RG16Uint;
          case 10:
            throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
          case 11:
            return i.RGBA16Uint;
          default:
            return i.RGBA16Uint;
        }
      case 6:
        switch (t) {
          case 8:
            return i.R32Sint;
          case 9:
            return i.RG32Sint;
          case 10:
            throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
          case 11:
            return i.RGBA32Sint;
          default:
            return i.RGBA32Sint;
        }
      case 7:
        switch (t) {
          case 8:
            return i.R32Uint;
          case 9:
            return i.RG32Uint;
          case 10:
            throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
          case 11:
            return i.RGBA32Uint;
          default:
            return i.RGBA32Uint;
        }
      case 1:
        switch (t) {
          case 6:
            return i.R32Float;
          case 7:
            return i.RG32Float;
          case 4:
            throw "TEXTUREFORMAT_RGB format not supported in WebGPU";
          case 5:
            return i.RGBA32Float;
          default:
            return i.RGBA32Float;
        }
      case 2:
        switch (t) {
          case 6:
            return i.R16Float;
          case 7:
            return i.RG16Float;
          case 4:
            throw "TEXTUREFORMAT_RGB format not supported in WebGPU";
          case 5:
            return i.RGBA16Float;
          default:
            return i.RGBA16Float;
        }
      case 10:
        throw "TEXTURETYPE_UNSIGNED_SHORT_5_6_5 format not supported in WebGPU";
      case 13:
        switch (t) {
          case 5:
            return i.RG11B10UFloat;
          case 11:
            throw "TEXTUREFORMAT_RGBA_INTEGER format not supported in WebGPU when type is TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV";
          default:
            return i.RG11B10UFloat;
        }
      case 14:
        switch (t) {
          case 5:
            return i.RGB9E5UFloat;
          case 11:
            throw "TEXTUREFORMAT_RGBA_INTEGER format not supported in WebGPU when type is TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV";
          default:
            return i.RGB9E5UFloat;
        }
      case 8:
        throw "TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 format not supported in WebGPU";
      case 9:
        throw "TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 format not supported in WebGPU";
      case 11:
        switch (t) {
          case 5:
            return i.RGB10A2Unorm;
          case 11:
            return i.RGB10A2UINT;
          default:
            return i.RGB10A2Unorm;
        }
    }
    return r ? i.RGBA8UnormSRGB : i.RGBA8Unorm;
  }
  static GetNumChannelsFromWebGPUTextureFormat(e) {
    switch (e) {
      case i.R8Unorm:
      case i.R8Snorm:
      case i.R8Uint:
      case i.R8Sint:
      case i.BC4RUnorm:
      case i.BC4RSnorm:
      case i.R16Uint:
      case i.R16Sint:
      case i.Depth16Unorm:
      case i.R16Float:
      case i.R32Uint:
      case i.R32Sint:
      case i.R32Float:
      case i.Depth32Float:
      case i.Stencil8:
      case i.Depth24Plus:
      case i.EACR11Unorm:
      case i.EACR11Snorm:
        return 1;
      case i.RG8Unorm:
      case i.RG8Snorm:
      case i.RG8Uint:
      case i.RG8Sint:
      case i.Depth32FloatStencil8:
      case i.BC5RGUnorm:
      case i.BC5RGSnorm:
      case i.RG16Uint:
      case i.RG16Sint:
      case i.RG16Float:
      case i.RG32Uint:
      case i.RG32Sint:
      case i.RG32Float:
      case i.Depth24PlusStencil8:
      case i.EACRG11Unorm:
      case i.EACRG11Snorm:
        return 2;
      case i.RGB9E5UFloat:
      case i.RG11B10UFloat:
      case i.BC6HRGBUFloat:
      case i.BC6HRGBFloat:
      case i.ETC2RGB8Unorm:
      case i.ETC2RGB8UnormSRGB:
        return 3;
      case i.RGBA8Unorm:
      case i.RGBA8UnormSRGB:
      case i.RGBA8Snorm:
      case i.RGBA8Uint:
      case i.RGBA8Sint:
      case i.BGRA8Unorm:
      case i.BGRA8UnormSRGB:
      case i.RGB10A2UINT:
      case i.RGB10A2Unorm:
      case i.BC7RGBAUnorm:
      case i.BC7RGBAUnormSRGB:
      case i.BC3RGBAUnorm:
      case i.BC3RGBAUnormSRGB:
      case i.BC2RGBAUnorm:
      case i.BC2RGBAUnormSRGB:
      case i.BC1RGBAUnorm:
      case i.BC1RGBAUnormSRGB:
      case i.RGBA16Uint:
      case i.RGBA16Sint:
      case i.RGBA16Float:
      case i.RGBA32Uint:
      case i.RGBA32Sint:
      case i.RGBA32Float:
      case i.ETC2RGB8A1Unorm:
      case i.ETC2RGB8A1UnormSRGB:
      case i.ETC2RGBA8Unorm:
      case i.ETC2RGBA8UnormSRGB:
      case i.ASTC4x4Unorm:
      case i.ASTC4x4UnormSRGB:
      case i.ASTC5x4Unorm:
      case i.ASTC5x4UnormSRGB:
      case i.ASTC5x5Unorm:
      case i.ASTC5x5UnormSRGB:
      case i.ASTC6x5Unorm:
      case i.ASTC6x5UnormSRGB:
      case i.ASTC6x6Unorm:
      case i.ASTC6x6UnormSRGB:
      case i.ASTC8x5Unorm:
      case i.ASTC8x5UnormSRGB:
      case i.ASTC8x6Unorm:
      case i.ASTC8x6UnormSRGB:
      case i.ASTC8x8Unorm:
      case i.ASTC8x8UnormSRGB:
      case i.ASTC10x5Unorm:
      case i.ASTC10x5UnormSRGB:
      case i.ASTC10x6Unorm:
      case i.ASTC10x6UnormSRGB:
      case i.ASTC10x8Unorm:
      case i.ASTC10x8UnormSRGB:
      case i.ASTC10x10Unorm:
      case i.ASTC10x10UnormSRGB:
      case i.ASTC12x10Unorm:
      case i.ASTC12x10UnormSRGB:
      case i.ASTC12x12Unorm:
      case i.ASTC12x12UnormSRGB:
        return 4;
    }
    throw `Unknown format ${e}!`;
  }
  static HasStencilAspect(e) {
    switch (e) {
      case i.Stencil8:
      case i.Depth32FloatStencil8:
      case i.Depth24PlusStencil8:
        return !0;
    }
    return !1;
  }
  static HasDepthAndStencilAspects(e) {
    switch (e) {
      case i.Depth32FloatStencil8:
      case i.Depth24PlusStencil8:
        return !0;
    }
    return !1;
  }
  static GetDepthFormatOnly(e) {
    switch (e) {
      case i.Depth16Unorm:
        return i.Depth16Unorm;
      case i.Depth24Plus:
        return i.Depth24Plus;
      case i.Depth24PlusStencil8:
        return i.Depth24Plus;
      case i.Depth32Float:
        return i.Depth32Float;
      case i.Depth32FloatStencil8:
        return i.Depth32Float;
    }
    return e;
  }
  static GetSample(e) {
    return e > 1 ? 4 : 1;
  }
}
class Be {
  get underlyingResource() {
    return this._webgpuTexture;
  }
  getMSAATexture(e = 0) {
    return this._webgpuMSAATexture?.[e] ?? null;
  }
  setMSAATexture(e, t = -1) {
    this._webgpuMSAATexture || (this._webgpuMSAATexture = []), t === -1 && (t = this._webgpuMSAATexture.length), this._webgpuMSAATexture[t] = e;
  }
  releaseMSAATexture() {
    if (this._webgpuMSAATexture) {
      for (const e of this._webgpuMSAATexture)
        e?.destroy();
      this._webgpuMSAATexture = null;
    }
  }
  constructor(e = null) {
    this.format = i.RGBA8Unorm, this.textureUsages = 0, this.textureAdditionalUsages = 0, this._webgpuTexture = e, this._webgpuMSAATexture = null, this.view = null, this.viewForWriting = null;
  }
  set(e) {
    this._webgpuTexture = e;
  }
  setUsage(e, t, r, n, s, o, u, l) {
    let c = I.E2d, h = 1;
    n ? (c = r ? I.CubeArray : I.Cube, h = 6 * (l || 1)) : s ? (c = I.E3d, h = 1) : r && (c = I.E2dArray, h = l);
    const d = T.GetDepthFormatOnly(this.format), f = T.HasDepthAndStencilAspects(this.format) ? Z.DepthOnly : Z.All;
    this.createView({
      label: `TextureView${s ? "3D" : n ? "Cube" : "2D"}${r ? "_Array" + h : ""}_${o}x${u}_${t ? "wmips" : "womips"}_${this.format}_${c}`,
      format: d,
      dimension: c,
      mipLevelCount: t ? ht.ILog2(Math.max(o, u)) + 1 : 1,
      baseArrayLayer: 0,
      baseMipLevel: 0,
      arrayLayerCount: h,
      aspect: f
    });
  }
  createView(e, t = !1) {
    if (this.view = this._webgpuTexture.createView(e), t && e) {
      const r = e.mipLevelCount;
      e.mipLevelCount = 1, this.viewForWriting = this._webgpuTexture.createView(e), e.mipLevelCount = r;
    }
  }
  reset() {
    this._webgpuTexture = null, this._webgpuMSAATexture = null, this.view = null, this.viewForWriting = null;
  }
  release() {
    this._webgpuTexture?.destroy(), this.releaseMSAATexture(), this._copyInvertYTempTexture?.destroy(), this.reset();
  }
}
const _r = `
    const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));
    const vec2 tex[4] = vec2[4](vec2(0.0f, 0.0f), vec2(1.0f, 0.0f), vec2(0.0f, 1.0f), vec2(1.0f, 1.0f));

    layout(location = 0) out vec2 vTex;

    void main() {
        vTex = tex[gl_VertexIndex];
        gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
    }
    `, mr = `
    layout(set = 0, binding = 0) uniform sampler imgSampler;
    layout(set = 0, binding = 1) uniform texture2D img;

    layout(location = 0) in vec2 vTex;
    layout(location = 0) out vec4 outColor;

    void main() {
        outColor = texture(sampler2D(img, imgSampler), vTex);
    }
    `, ft = `
    #extension GL_EXT_samplerless_texture_functions : enable

    const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));
    const vec2 tex[4] = vec2[4](vec2(0.0f, 0.0f), vec2(1.0f, 0.0f), vec2(0.0f, 1.0f), vec2(1.0f, 1.0f));

    layout(set = 0, binding = 0) uniform texture2D img;

    #ifdef INVERTY
        layout(location = 0) out flat ivec2 vTextureSize;
    #endif

    void main() {
        #ifdef INVERTY
            vTextureSize = textureSize(img, 0);
        #endif
        gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
    }
    `, gr = `
    #extension GL_EXT_samplerless_texture_functions : enable

    layout(set = 0, binding = 0) uniform texture2D img;

    #ifdef INVERTY
        layout(location = 0) in flat ivec2 vTextureSize;
    #endif
    layout(location = 0) out vec4 outColor;

    void main() {
    #ifdef INVERTY
        vec4 color = texelFetch(img, ivec2(gl_FragCoord.x, vTextureSize.y - gl_FragCoord.y), 0);
    #else
        vec4 color = texelFetch(img, ivec2(gl_FragCoord.xy), 0);
    #endif
    #ifdef PREMULTIPLYALPHA
        color.rgb *= color.a;
    #endif
        outColor = color;
    }
    `, xr = ft, br = `
    #extension GL_EXT_samplerless_texture_functions : enable

    layout(set = 0, binding = 0) uniform texture2D img;
    layout(set = 0, binding = 1) uniform Params {
        float ofstX;
        float ofstY;
        float width;
        float height;
    };

    #ifdef INVERTY
        layout(location = 0) in flat ivec2 vTextureSize;
    #endif
    layout(location = 0) out vec4 outColor;

    void main() {
        if (gl_FragCoord.x < ofstX || gl_FragCoord.x >= ofstX + width) {
            discard;
        }
        if (gl_FragCoord.y < ofstY || gl_FragCoord.y >= ofstY + height) {
            discard;
        }
    #ifdef INVERTY
        vec4 color = texelFetch(img, ivec2(gl_FragCoord.x, ofstY + height - (gl_FragCoord.y - ofstY)), 0);
    #else
        vec4 color = texelFetch(img, ivec2(gl_FragCoord.xy), 0);
    #endif
    #ifdef PREMULTIPLYALPHA
        color.rgb *= color.a;
    #endif
        outColor = color;
    }
    `, Sr = `
    const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));

    void main() {
        gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
    }
    `, yr = `
    layout(set = 0, binding = 0) uniform Uniforms {
        uniform vec4 color;
    };

    layout(location = 0) out vec4 outColor;

    void main() {
        outColor = color;
    }
    `, Cr = `
    struct VertexOutput {
        @builtin(position) Position : vec4<f32>,
        @location(0) fragUV : vec2<f32>
    }

    @vertex
    fn main(
        @builtin(vertex_index) VertexIndex : u32
    ) -> VertexOutput {
        var pos = array<vec2<f32>, 4>(
            vec2(-1.0,  1.0),
            vec2( 1.0,  1.0),
            vec2(-1.0, -1.0),
            vec2( 1.0, -1.0)
        );
        var tex = array<vec2<f32>, 4>(
            vec2(0.0, 0.0),
            vec2(1.0, 0.0),
            vec2(0.0, 1.0),
            vec2(1.0, 1.0)
        );

        var output: VertexOutput;

        output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        output.fragUV = tex[VertexIndex];

        return output;
    }
    `, Br = `
    @group(0) @binding(0) var videoSampler: sampler;
    @group(0) @binding(1) var videoTexture: texture_external;

    @fragment
    fn main(
        @location(0) fragUV: vec2<f32>
    ) -> @location(0) vec4<f32> {
        return textureSampleBaseClampToEdge(videoTexture, videoSampler, fragUV);
    }
    `, Rr = `
    @group(0) @binding(0) var videoSampler: sampler;
    @group(0) @binding(1) var videoTexture: texture_external;

    @fragment
    fn main(
        @location(0) fragUV: vec2<f32>
    ) -> @location(0) vec4<f32> {
        return textureSampleBaseClampToEdge(videoTexture, videoSampler, vec2<f32>(fragUV.x, 1.0 - fragUV.y));
    }
    `;
var Q;
(function(a) {
  a[a.MipMap = 0] = "MipMap", a[a.InvertYPremultiplyAlpha = 1] = "InvertYPremultiplyAlpha", a[a.Clear = 2] = "Clear", a[a.InvertYPremultiplyAlphaWithOfst = 3] = "InvertYPremultiplyAlphaWithOfst";
})(Q || (Q = {}));
var fe;
(function(a) {
  a[a.DontInvertY = 0] = "DontInvertY", a[a.InvertY = 1] = "InvertY";
})(fe || (fe = {}));
const ut = [
  { vertex: _r, fragment: mr },
  { vertex: ft, fragment: gr },
  { vertex: Sr, fragment: yr },
  { vertex: xr, fragment: br }
], te = {
  "": 0,
  r8unorm: 1,
  r8uint: 2,
  r8sint: 3,
  r16uint: 4,
  r16sint: 5,
  r16float: 6,
  rg8unorm: 7,
  rg8uint: 8,
  rg8sint: 9,
  r32uint: 10,
  r32sint: 11,
  r32float: 12,
  rg16uint: 13,
  rg16sint: 14,
  rg16float: 15,
  rgba8unorm: 16,
  "rgba8unorm-srgb": 17,
  rgba8uint: 18,
  rgba8sint: 19,
  bgra8unorm: 20,
  "bgra8unorm-srgb": 21,
  rgb10a2uint: 22,
  rgb10a2unorm: 23,
  /* rg11b10ufloat: this entry is dynamically added if the "RG11B10UFloatRenderable" extension is supported */
  rg32uint: 24,
  rg32sint: 25,
  rg32float: 26,
  rgba16uint: 27,
  rgba16sint: 28,
  rgba16float: 29,
  rgba32uint: 30,
  rgba32sint: 31,
  rgba32float: 32,
  stencil8: 33,
  depth16unorm: 34,
  depth24plus: 35,
  "depth24plus-stencil8": 36,
  depth32float: 37,
  "depth32float-stencil8": 38
};
class Ir {
  //------------------------------------------------------------------------------
  //                         Initialization / Helpers
  //------------------------------------------------------------------------------
  constructor(e, t, r, n, s, o) {
    if (this._pipelines = {}, this._compiledShaders = [], this._videoPipelines = {}, this._videoCompiledShaders = [], this._deferredReleaseTextures = [], this._engine = e, this._device = t, this._glslang = r, this._tintWASM = n, this._bufferManager = s, o.indexOf(ee.RG11B10UFloatRenderable) !== -1) {
      const u = Object.keys(te);
      te[i.RG11B10UFloat] = te[u[u.length - 1]] + 1;
    }
    this._mipmapSampler = t.createSampler({ minFilter: B.Linear }), this._videoSampler = t.createSampler({ minFilter: B.Linear }), this._ubCopyWithOfst = this._bufferManager.createBuffer(4 * 4, w.Uniform | w.CopyDst, "UBCopyWithOffset").underlyingResource, this._getPipeline(i.RGBA8Unorm), this._getVideoPipeline(i.RGBA8Unorm);
  }
  _getPipeline(e, t = Q.MipMap, r) {
    const n = t === Q.MipMap ? 1 : t === Q.InvertYPremultiplyAlpha ? ((r.invertY ? 1 : 0) << 1) + ((r.premultiplyAlpha ? 1 : 0) << 2) : t === Q.Clear ? 8 : t === Q.InvertYPremultiplyAlphaWithOfst ? ((r.invertY ? 1 : 0) << 4) + ((r.premultiplyAlpha ? 1 : 0) << 5) : 0;
    this._pipelines[e] || (this._pipelines[e] = []);
    let s = this._pipelines[e][n];
    if (!s) {
      let o = `#version 450
`;
      (t === Q.InvertYPremultiplyAlpha || t === Q.InvertYPremultiplyAlphaWithOfst) && (r.invertY && (o += `#define INVERTY
`), r.premultiplyAlpha && (o += `#define PREMULTIPLYALPHA
`));
      let u = this._compiledShaders[n];
      if (!u) {
        let c = this._glslang.compileGLSL(o + ut[t].vertex, "vertex"), h = this._glslang.compileGLSL(o + ut[t].fragment, "fragment");
        this._tintWASM && (c = this._tintWASM.convertSpirV2WGSL(c), h = this._tintWASM.convertSpirV2WGSL(h));
        const d = this._device.createShaderModule({
          code: c
        }), f = this._device.createShaderModule({
          code: h
        });
        u = this._compiledShaders[n] = [d, f];
      }
      const l = this._device.createRenderPipeline({
        layout: Re.Auto,
        vertex: {
          module: u[0],
          entryPoint: "main"
        },
        fragment: {
          module: u[1],
          entryPoint: "main",
          targets: [
            {
              format: e
            }
          ]
        },
        primitive: {
          topology: k.TriangleStrip,
          stripIndexFormat: le.Uint16
        }
      });
      s = this._pipelines[e][n] = [l, l.getBindGroupLayout(0)];
    }
    return s;
  }
  _getVideoPipeline(e, t = fe.DontInvertY) {
    const r = t === fe.InvertY ? 1 : 0;
    this._videoPipelines[e] || (this._videoPipelines[e] = []);
    let n = this._videoPipelines[e][r];
    if (!n) {
      let s = this._videoCompiledShaders[r];
      if (!s) {
        const u = this._device.createShaderModule({
          code: Cr
        }), l = this._device.createShaderModule({
          code: r === 0 ? Br : Rr
        });
        s = this._videoCompiledShaders[r] = [u, l];
      }
      const o = this._device.createRenderPipeline({
        label: `BabylonWebGPUDevice${this._engine.uniqueId}_CopyVideoToTexture_${e}_${r === 0 ? "DontInvertY" : "InvertY"}`,
        layout: Re.Auto,
        vertex: {
          module: s[0],
          entryPoint: "main"
        },
        fragment: {
          module: s[1],
          entryPoint: "main",
          targets: [
            {
              format: e
            }
          ]
        },
        primitive: {
          topology: k.TriangleStrip,
          stripIndexFormat: le.Uint16
        }
      });
      n = this._videoPipelines[e][r] = [o, o.getBindGroupLayout(0)];
    }
    return n;
  }
  setCommandEncoder(e) {
    this._commandEncoderForCreation = e;
  }
  copyVideoToTexture(e, t, r, n = !1, s) {
    const o = s === void 0, [u, l] = this._getVideoPipeline(r, n ? fe.InvertY : fe.DontInvertY);
    o && (s = this._device.createCommandEncoder({})), s.pushDebugGroup?.(`copy video to texture - invertY=${n}`);
    const c = t._hardwareTexture, h = {
      label: `BabylonWebGPUDevice${this._engine.uniqueId}_copyVideoToTexture_${r}_${n ? "InvertY" : "DontInvertY"}${t.label ? "_" + t.label : ""}`,
      colorAttachments: [
        {
          view: c.underlyingResource.createView({
            format: r,
            dimension: I.E2d,
            mipLevelCount: 1,
            baseArrayLayer: 0,
            baseMipLevel: 0,
            arrayLayerCount: 1,
            aspect: Z.All
          }),
          loadOp: N.Load,
          storeOp: Y.Store
        }
      ]
    }, d = s.beginRenderPass(h), f = {
      layout: l,
      entries: [
        {
          binding: 0,
          resource: this._videoSampler
        },
        {
          binding: 1,
          resource: this._device.importExternalTexture({
            source: e.underlyingResource
          })
        }
      ]
    }, _ = this._device.createBindGroup(f);
    d.setPipeline(u), d.setBindGroup(0, _), d.draw(4, 1, 0, 0), d.end(), s.popDebugGroup?.(), o && (this._device.queue.submit([s.finish()]), s = null);
  }
  invertYPreMultiplyAlpha(e, t, r, n, s = !1, o = !1, u = 0, l = 0, c = 1, h = 0, d = 0, f = 0, _ = 0, m, g) {
    const p = f !== 0, x = m === void 0, [S, b] = this._getPipeline(n, p ? Q.InvertYPremultiplyAlphaWithOfst : Q.InvertYPremultiplyAlpha, {
      invertY: s,
      premultiplyAlpha: o
    });
    u = Math.max(u, 0), x && (m = this._device.createCommandEncoder({})), m.pushDebugGroup?.(`internal process texture - invertY=${s} premultiplyAlpha=${o}`);
    let v;
    if (T.IsHardwareTexture(e) ? (v = e.underlyingResource, s && !o && c === 1 && u === 0 || (e = void 0)) : (v = e, e = void 0), !v)
      return;
    p && this._bufferManager.setRawData(this._ubCopyWithOfst, 0, new Float32Array([h, d, f, _]), 0, 4 * 4);
    const R = e, G = R?._copyInvertYTempTexture ?? this.createTexture({ width: t, height: r, layers: 1 }, !1, !1, !1, !1, !1, n, 1, m, F.CopySrc | F.RenderAttachment | F.TextureBinding, void 0, "TempTextureForCopyWithInvertY"), P = R?._copyInvertYRenderPassDescr ?? {
      label: `BabylonWebGPUDevice${this._engine.uniqueId}_invertYPreMultiplyAlpha_${n}_${s ? "InvertY" : "DontInvertY"}_${o ? "PremultiplyAlpha" : "DontPremultiplyAlpha"}`,
      colorAttachments: [
        {
          view: G.createView({
            format: n,
            dimension: I.E2d,
            baseMipLevel: 0,
            mipLevelCount: 1,
            arrayLayerCount: 1,
            baseArrayLayer: 0
          }),
          loadOp: N.Load,
          storeOp: Y.Store
        }
      ]
    }, E = m.beginRenderPass(P);
    let W = p ? R?._copyInvertYBindGroupWithOfst : R?._copyInvertYBindGroup;
    if (!W) {
      const ne = {
        layout: b,
        entries: [
          {
            binding: 0,
            resource: v.createView({
              format: n,
              dimension: I.E2d,
              baseMipLevel: l,
              mipLevelCount: 1,
              arrayLayerCount: c,
              baseArrayLayer: u
            })
          }
        ]
      };
      p && ne.entries.push({
        binding: 1,
        resource: {
          buffer: this._ubCopyWithOfst
        }
      }), W = this._device.createBindGroup(ne);
    }
    E.setPipeline(S), E.setBindGroup(0, W), E.draw(4, 1, 0, 0), E.end(), m.copyTextureToTexture({
      texture: G
    }, {
      texture: v,
      mipLevel: l,
      origin: {
        x: 0,
        y: 0,
        z: u
      }
    }, {
      width: t,
      height: r,
      depthOrArrayLayers: 1
    }), R ? (R._copyInvertYTempTexture = G, R._copyInvertYRenderPassDescr = P, p ? R._copyInvertYBindGroupWithOfst = W : R._copyInvertYBindGroup = W) : this._deferredReleaseTextures.push([G, null]), m.popDebugGroup?.(), x && (this._device.queue.submit([m.finish()]), m = null);
  }
  copyWithInvertY(e, t, r, n) {
    const s = n === void 0, [o, u] = this._getPipeline(t, Q.InvertYPremultiplyAlpha, { invertY: !0, premultiplyAlpha: !1 });
    s && (n = this._device.createCommandEncoder({})), n.pushDebugGroup?.("internal copy texture with invertY");
    const l = n.beginRenderPass(r), c = this._device.createBindGroup({
      layout: u,
      entries: [
        {
          binding: 0,
          resource: e
        }
      ]
    });
    l.setPipeline(o), l.setBindGroup(0, c), l.draw(4, 1, 0, 0), l.end(), n.popDebugGroup?.(), s && (this._device.queue.submit([n.finish()]), n = null);
  }
  //------------------------------------------------------------------------------
  //                               Creation
  //------------------------------------------------------------------------------
  createTexture(e, t = !1, r = !1, n = !1, s = !1, o = !1, u = i.RGBA8Unorm, l = 1, c, h = -1, d = 0, f) {
    l = T.GetSample(l);
    const _ = e.layers || 1, m = {
      width: e.width,
      height: e.height,
      depthOrArrayLayers: _
    }, g = te[u] ? F.RenderAttachment : 0, p = T.IsCompressedFormat(u), x = t ? T.ComputeNumMipmapLevels(e.width, e.height) : 1, S = h >= 0 ? h : F.CopySrc | F.CopyDst | F.TextureBinding;
    d |= t && !p ? F.CopySrc | g : 0, !p && !o && (d |= g | F.CopyDst);
    const b = this._device.createTexture({
      label: `BabylonWebGPUDevice${this._engine.uniqueId}_Texture${o ? "3D" : "2D"}_${f ? f + "_" : ""}${m.width}x${m.height}x${m.depthOrArrayLayers}_${t ? "wmips" : "womips"}_${u}_samples${l}`,
      size: m,
      dimension: o ? X.E3d : X.E2d,
      format: u,
      usage: S | d,
      sampleCount: l,
      mipLevelCount: x
    });
    return T.IsImageBitmap(e) && (this.updateTexture(e, b, e.width, e.height, _, u, 0, 0, n, s, 0, 0), t && r && this.generateMipmaps(b, u, x, 0, o, c)), b;
  }
  createCubeTexture(e, t = !1, r = !1, n = !1, s = !1, o = i.RGBA8Unorm, u = 1, l, c = -1, h = 0, d) {
    u = T.GetSample(u);
    const f = T.IsImageBitmapArray(e) ? e[0].width : e.width, _ = T.IsImageBitmapArray(e) ? e[0].height : e.height, m = te[o] ? F.RenderAttachment : 0, g = T.IsCompressedFormat(o), p = t ? T.ComputeNumMipmapLevels(f, _) : 1, x = c >= 0 ? c : F.CopySrc | F.CopyDst | F.TextureBinding;
    h |= t && !g ? F.CopySrc | m : 0, g || (h |= m | F.CopyDst);
    const S = this._device.createTexture({
      label: `BabylonWebGPUDevice${this._engine.uniqueId}_TextureCube_${d ? d + "_" : ""}${f}x${_}x6_${t ? "wmips" : "womips"}_${o}_samples${u}`,
      size: {
        width: f,
        height: _,
        depthOrArrayLayers: 6
      },
      dimension: X.E2d,
      format: o,
      usage: x | h,
      sampleCount: u,
      mipLevelCount: p
    });
    return T.IsImageBitmapArray(e) && (this.updateCubeTextures(e, S, f, _, o, n, s, 0, 0), t && r && this.generateCubeMipmaps(S, o, p, l)), S;
  }
  generateCubeMipmaps(e, t, r, n) {
    const s = n === void 0;
    s && (n = this._device.createCommandEncoder({})), n.pushDebugGroup?.(`create cube mipmaps - ${r} levels`);
    for (let o = 0; o < 6; ++o)
      this.generateMipmaps(e, t, r, o, !1, n);
    n.popDebugGroup?.(), s && (this._device.queue.submit([n.finish()]), n = null);
  }
  generateMipmaps(e, t, r, n = 0, s = !1, o) {
    const u = o === void 0, [l, c] = this._getPipeline(t);
    n = Math.max(n, 0), u && (o = this._device.createCommandEncoder({})), o.pushDebugGroup?.(`create mipmaps for face #${n} - ${r} levels`);
    let h;
    if (T.IsHardwareTexture(e) ? (h = e.underlyingResource, e._mipmapGenRenderPassDescr = e._mipmapGenRenderPassDescr || [], e._mipmapGenBindGroup = e._mipmapGenBindGroup || []) : (h = e, e = void 0), !h)
      return;
    const d = e;
    for (let f = 1; f < r; ++f) {
      const _ = d?._mipmapGenRenderPassDescr[n]?.[f - 1] ?? {
        label: `BabylonWebGPUDevice${this._engine.uniqueId}_generateMipmaps_${t}_faceIndex${n}_level${f}`,
        colorAttachments: [
          {
            view: h.createView({
              format: t,
              dimension: s ? I.E3d : I.E2d,
              baseMipLevel: f,
              mipLevelCount: 1,
              arrayLayerCount: 1,
              baseArrayLayer: n
            }),
            loadOp: N.Load,
            storeOp: Y.Store
          }
        ]
      };
      d && (d._mipmapGenRenderPassDescr[n] = d._mipmapGenRenderPassDescr[n] || [], d._mipmapGenRenderPassDescr[n][f - 1] = _);
      const m = o.beginRenderPass(_), g = d?._mipmapGenBindGroup[n]?.[f - 1] ?? this._device.createBindGroup({
        layout: c,
        entries: [
          {
            binding: 0,
            resource: this._mipmapSampler
          },
          {
            binding: 1,
            resource: h.createView({
              format: t,
              dimension: s ? I.E3d : I.E2d,
              baseMipLevel: f - 1,
              mipLevelCount: 1,
              arrayLayerCount: 1,
              baseArrayLayer: n
            })
          }
        ]
      });
      d && (d._mipmapGenBindGroup[n] = d._mipmapGenBindGroup[n] || [], d._mipmapGenBindGroup[n][f - 1] = g), m.setPipeline(l), m.setBindGroup(0, g), m.draw(4, 1, 0, 0), m.end();
    }
    o.popDebugGroup?.(), u && (this._device.queue.submit([o.finish()]), o = null);
  }
  createGPUTextureForInternalTexture(e, t, r, n, s) {
    e._hardwareTexture || (e._hardwareTexture = new Be()), t === void 0 && (t = e.width), r === void 0 && (r = e.height), n === void 0 && (n = e.depth);
    const o = e._hardwareTexture, u = ((s ?? 0) & 1) !== 0;
    o.format = T.GetWebGPUTextureFormat(e.type, e.format, e._useSRGBBuffer), o.textureUsages = e._source === ge.RenderTarget || e.source === ge.MultiRenderTarget ? F.TextureBinding | F.CopySrc | F.RenderAttachment : e._source === ge.DepthStencil ? F.TextureBinding | F.RenderAttachment : -1, o.textureAdditionalUsages = u ? F.StorageBinding : 0;
    const l = e.generateMipMaps, c = n || 1;
    let h;
    if (e._maxLodLevel !== null ? h = e._maxLodLevel : h = l ? T.ComputeNumMipmapLevels(t, r) : 1, e.isCube) {
      const d = this.createCubeTexture({ width: t, height: r }, e.generateMipMaps, e.generateMipMaps, e.invertY, !1, o.format, 1, this._commandEncoderForCreation, o.textureUsages, o.textureAdditionalUsages, e.label);
      o.set(d);
      const f = e.is3D ? 1 : c, _ = T.GetDepthFormatOnly(o.format), m = T.HasDepthAndStencilAspects(o.format) ? Z.DepthOnly : Z.All, g = e.is2DArray ? I.CubeArray : I.Cube;
      o.createView({
        label: `BabylonWebGPUDevice${this._engine.uniqueId}_TextureViewCube${e.is2DArray ? "_Array" + f : ""}_${t}x${r}_${l ? "wmips" : "womips"}_${_}_${g}_${m}_${e.label ?? "noname"}`,
        format: _,
        dimension: g,
        mipLevelCount: h,
        baseArrayLayer: 0,
        baseMipLevel: 0,
        arrayLayerCount: 6,
        aspect: m
      }, u);
    } else {
      const d = this.createTexture({ width: t, height: r, layers: c }, e.generateMipMaps, e.generateMipMaps, e.invertY, !1, e.is3D, o.format, 1, this._commandEncoderForCreation, o.textureUsages, o.textureAdditionalUsages, e.label);
      o.set(d);
      const f = e.is3D ? 1 : c, _ = T.GetDepthFormatOnly(o.format), m = T.HasDepthAndStencilAspects(o.format) ? Z.DepthOnly : Z.All, g = e.is2DArray ? I.E2dArray : e.is3D ? X.E3d : I.E2d;
      o.createView({
        label: `BabylonWebGPUDevice${this._engine.uniqueId}_TextureView${e.is3D ? "3D" : "2D"}${e.is2DArray ? "_Array" + f : ""}_${t}x${r}${e.is3D ? "x" + c : ""}_${l ? "wmips" : "womips"}_${_}_${g}_${m}_${e.label ?? "noname"}`,
        format: _,
        dimension: g,
        mipLevelCount: h,
        baseArrayLayer: 0,
        baseMipLevel: 0,
        arrayLayerCount: f,
        aspect: m
      }, u);
    }
    return e.width = e.baseWidth = t, e.height = e.baseHeight = r, e.depth = e.baseDepth = n, this.createMSAATexture(e, e.samples), o;
  }
  createMSAATexture(e, t, r = !0, n = -1) {
    const s = e._hardwareTexture;
    if (r && s?.releaseMSAATexture(), !s || (t ?? 1) <= 1)
      return;
    const o = e.width, u = e.height, l = this.createTexture({ width: o, height: u, layers: 1 }, !1, !1, !1, !1, !1, s.format, t, this._commandEncoderForCreation, F.RenderAttachment, 0, e.label ? "MSAA" + e.label : void 0);
    s.setMSAATexture(l, n);
  }
  //------------------------------------------------------------------------------
  //                                  Update
  //------------------------------------------------------------------------------
  updateCubeTextures(e, t, r, n, s, o = !1, u = !1, l = 0, c = 0) {
    const h = [0, 3, 1, 4, 2, 5];
    for (let d = 0; d < h.length; ++d) {
      const f = e[h[d]];
      this.updateTexture(f, t, r, n, 1, s, d, 0, o, u, l, c);
    }
  }
  // TODO WEBGPU handle data source not being in the same format than the destination texture?
  updateTexture(e, t, r, n, s, o, u = 0, l = 0, c = !1, h = !1, d = 0, f = 0, _) {
    const m = T.IsInternalTexture(t) ? t._hardwareTexture.underlyingResource : t, g = T.GetBlockInformationFromFormat(o), p = T.IsInternalTexture(t) ? t._hardwareTexture : t, x = {
      texture: m,
      origin: {
        x: d,
        y: f,
        z: Math.max(u, 0)
      },
      mipLevel: l,
      premultipliedAlpha: h
    }, S = {
      width: Math.ceil(r / g.width) * g.width,
      height: Math.ceil(n / g.height) * g.height,
      depthOrArrayLayers: s || 1
    };
    if (e.byteLength !== void 0) {
      e = e;
      const b = Math.ceil(r / g.width) * g.length;
      if (Math.ceil(b / 256) * 256 === b) {
        const R = this._device.createCommandEncoder({}), G = this._bufferManager.createRawBuffer(e.byteLength, w.MapWrite | w.CopySrc, !0, "TempBufferForUpdateTexture" + (m ? "_" + m.label : "")), P = G.getMappedRange();
        new Uint8Array(P).set(e), G.unmap(), R.copyBufferToTexture({
          buffer: G,
          offset: 0,
          bytesPerRow: b,
          rowsPerImage: n
        }, x, S), this._device.queue.submit([R.finish()]), this._bufferManager.releaseBuffer(G);
      } else
        this._device.queue.writeTexture(x, e, {
          offset: 0,
          bytesPerRow: b,
          rowsPerImage: n
        }, S);
      if (c || h)
        if (T.IsInternalTexture(t)) {
          const R = d === 0 && f === 0 && r === t.width && n === t.height;
          this.invertYPreMultiplyAlpha(p, t.width, t.height, o, c, h, u, l, s || 1, d, f, R ? 0 : r, R ? 0 : n, void 0, _);
        } else
          throw "updateTexture: Can't process the texture data because a GPUTexture was provided instead of an InternalTexture!";
    } else if (e = e, c)
      if (x.premultipliedAlpha = !1, T.IsInternalTexture(t) && d === 0 && f === 0 && r === t.width && n === t.height)
        this._device.queue.copyExternalImageToTexture({ source: e }, x, S), this.invertYPreMultiplyAlpha(p, r, n, o, c, h, u, l, s || 1, 0, 0, 0, 0, void 0, _);
      else {
        const b = this._device.createCommandEncoder({}), v = this.createTexture({ width: r, height: n, layers: 1 }, !1, !1, !1, !1, !1, o, 1, b, F.CopySrc | F.TextureBinding, void 0, "TempTextureForUpdateTexture");
        this._deferredReleaseTextures.push([v, null]), S.depthOrArrayLayers = 1, this._device.queue.copyExternalImageToTexture({ source: e }, { texture: v }, S), S.depthOrArrayLayers = s || 1, this.invertYPreMultiplyAlpha(v, r, n, o, c, h, u, l, s || 1, 0, 0, 0, 0, b, _), b.copyTextureToTexture({ texture: v }, x, S), this._device.queue.submit([b.finish()]);
      }
    else
      this._device.queue.copyExternalImageToTexture({ source: e }, x, S);
  }
  readPixels(e, t, r, n, s, o, u = 0, l = 0, c = null, h = !1) {
    const d = T.GetBlockInformationFromFormat(o), f = Math.ceil(n / d.width) * d.length, _ = Math.ceil(f / 256) * 256, m = _ * s, g = this._bufferManager.createRawBuffer(m, w.MapRead | w.CopyDst, void 0, "TempBufferForReadPixels" + (e.label ? "_" + e.label : "")), p = this._device.createCommandEncoder({});
    return p.copyTextureToBuffer({
      texture: e,
      mipLevel: l,
      origin: {
        x: t,
        y: r,
        z: Math.max(u, 0)
      }
    }, {
      buffer: g,
      offset: 0,
      bytesPerRow: _
    }, {
      width: n,
      height: s,
      depthOrArrayLayers: 1
    }), this._device.queue.submit([p.finish()]), this._bufferManager.readDataFromBuffer(g, m, n, s, f, _, T.GetTextureTypeFromFormat(o), 0, c, !0, h);
  }
  //------------------------------------------------------------------------------
  //                              Dispose
  //------------------------------------------------------------------------------
  releaseTexture(e) {
    if (T.IsInternalTexture(e)) {
      const t = e._hardwareTexture, r = e._irradianceTexture;
      this._deferredReleaseTextures.push([t, r]);
    } else
      this._deferredReleaseTextures.push([e, null]);
  }
  destroyDeferredTextures() {
    for (let e = 0; e < this._deferredReleaseTextures.length; ++e) {
      const [t, r] = this._deferredReleaseTextures[e];
      t && (T.IsHardwareTexture(t) ? t.release() : t.destroy()), r?.dispose();
    }
    this._deferredReleaseTextures.length = 0;
  }
}
class Tr extends St {
  constructor(e, t = 0) {
    super(), this.engineId = -1, this.capacity = t, this._buffer = e;
  }
  get underlyingResource() {
    return this._buffer;
  }
}
class we {
  static _IsGPUBuffer(e) {
    return e.underlyingResource === void 0;
  }
  static _FlagsToString(e, t = "") {
    let r = t;
    for (let n = 0; n <= 9; ++n)
      e & 1 << n && (r && (r += "_"), r += w[1 << n]);
    return r;
  }
  constructor(e, t) {
    this._deferredReleaseBuffers = [], this._engine = e, this._device = t;
  }
  createRawBuffer(e, t, r = !1, n) {
    const s = e.byteLength !== void 0 ? e.byteLength + 3 & -4 : e + 3 & -4, o = {
      label: "BabylonWebGPUDevice" + this._engine.uniqueId + "_" + we._FlagsToString(t, n ?? "Buffer") + "_size" + s,
      mappedAtCreation: r,
      size: s,
      usage: t
    };
    return this._device.createBuffer(o);
  }
  createBuffer(e, t, r) {
    const n = e.byteLength !== void 0, s = this.createRawBuffer(e, t, void 0, r), o = new Tr(s);
    return o.references = 1, o.capacity = n ? e.byteLength : e, o.engineId = this._engine.uniqueId, n && this.setSubData(o, 0, e), o;
  }
  setRawData(e, t, r, n, s) {
    this._device.queue.writeBuffer(e, t, r.buffer, n, s);
  }
  setSubData(e, t, r, n = 0, s = 0) {
    const o = e.underlyingResource;
    s = s || r.byteLength, s = Math.min(s, e.capacity - t);
    let u = r.byteOffset + n, l = u + s;
    const c = s + 3 & -4;
    if (c !== s) {
      const f = new Uint8Array(r.buffer.slice(u, l));
      r = new Uint8Array(c), r.set(f), n = 0, u = 0, l = c, s = c;
    }
    const h = 1024 * 1024 * 15;
    let d = 0;
    for (; l - (u + d) > h; )
      this._device.queue.writeBuffer(o, t + d, r.buffer, u + d, h), d += h;
    this._device.queue.writeBuffer(o, t + d, r.buffer, u + d, s - d);
  }
  _getHalfFloatAsFloatRGBAArrayBuffer(e, t, r) {
    r || (r = new Float32Array(e));
    const n = new Uint16Array(t);
    for (; e--; )
      r[e] = Tt(n[e]);
    return r;
  }
  readDataFromBuffer(e, t, r, n, s, o, u = 0, l = 0, c = null, h = !0, d = !1) {
    const f = u === 1 ? 2 : u === 2 ? 1 : 0, _ = this._engine.uniqueId;
    return new Promise((m, g) => {
      e.mapAsync(pe.Read, l, t).then(() => {
        const p = e.getMappedRange(l, t);
        let x = c;
        if (d)
          x === null ? x = Ye(u, t, !0, p) : x = Ye(u, x.buffer, void 0, p);
        else if (x === null)
          switch (f) {
            case 0:
              x = new Uint8Array(t), x.set(new Uint8Array(p));
              break;
            case 1:
              x = this._getHalfFloatAsFloatRGBAArrayBuffer(t / 2, p);
              break;
            case 2:
              x = new Float32Array(t / 4), x.set(new Float32Array(p));
              break;
          }
        else
          switch (f) {
            case 0:
              x = new Uint8Array(x.buffer), x.set(new Uint8Array(p));
              break;
            case 1:
              x = this._getHalfFloatAsFloatRGBAArrayBuffer(t / 2, p, c);
              break;
            case 2:
              x = new Float32Array(x.buffer), x.set(new Float32Array(p));
              break;
          }
        if (s !== o) {
          f === 1 && !d && (s *= 2, o *= 2);
          const S = new Uint8Array(x.buffer);
          let b = s, v = 0;
          for (let R = 1; R < n; ++R) {
            v = R * o;
            for (let G = 0; G < s; ++G)
              S[b++] = S[v++];
          }
          f !== 0 && !d ? x = new Float32Array(S.buffer, 0, b / 4) : x = new Uint8Array(S.buffer, 0, b);
        }
        e.unmap(), h && this.releaseBuffer(e), m(x);
      }, (p) => {
        this._engine.isDisposed || this._engine.uniqueId !== _ ? m(new Uint8Array()) : g(p);
      });
    });
  }
  releaseBuffer(e) {
    return we._IsGPUBuffer(e) ? (this._deferredReleaseBuffers.push(e), !0) : (e.references--, e.references === 0 ? (this._deferredReleaseBuffers.push(e.underlyingResource), !0) : !1);
  }
  destroyDeferredBuffers() {
    for (let e = 0; e < this._deferredReleaseBuffers.length; ++e)
      this._deferredReleaseBuffers[e].destroy();
    this._deferredReleaseBuffers.length = 0;
  }
}
const Ar = [
  0,
  0,
  3,
  7,
  0,
  2,
  6,
  2,
  4,
  1,
  5,
  3,
  1
  // TEXTURE_LINEAR_NEAREST
], vr = [
  0,
  64,
  32,
  96,
  16,
  80,
  48,
  112,
  8
  // ALWAYS
], wr = [
  0,
  128,
  128,
  0,
  0,
  0,
  0,
  128,
  0,
  0,
  0,
  0,
  128
  // TEXTURE_LINEAR_NEAREST
];
class ce {
  constructor(e) {
    this._samplers = {}, this._device = e, this.disabled = !1;
  }
  static GetSamplerHashCode(e) {
    const t = e._cachedAnisotropicFilteringLevel && e._cachedAnisotropicFilteringLevel > 1 ? 4 : 1;
    return Ar[e.samplingMode] + vr[(e._comparisonFunction || 514) - 512 + 1] + wr[e.samplingMode] + // handle the lodMinClamp = lodMaxClamp = 0 case when no filter used for mip mapping
    ((e._cachedWrapU ?? 1) << 8) + ((e._cachedWrapV ?? 1) << 10) + ((e._cachedWrapR ?? 1) << 12) + ((e.useMipMaps ? 1 : 0) << 14) + // need to factor this in because _getSamplerFilterDescriptor depends on samplingMode AND useMipMaps!
    (t << 15);
  }
  static _GetSamplerFilterDescriptor(e, t) {
    let r, n, s, o, u;
    const l = e.useMipMaps;
    switch (e.samplingMode) {
      case 11:
        r = B.Linear, n = B.Linear, s = B.Nearest, l || (o = u = 0);
        break;
      case 3:
      case 3:
        r = B.Linear, n = B.Linear, l ? s = B.Linear : (s = B.Nearest, o = u = 0);
        break;
      case 8:
        r = B.Nearest, n = B.Nearest, l ? s = B.Linear : (s = B.Nearest, o = u = 0);
        break;
      case 4:
        r = B.Nearest, n = B.Nearest, s = B.Nearest, l || (o = u = 0);
        break;
      case 5:
        r = B.Nearest, n = B.Linear, s = B.Nearest, l || (o = u = 0);
        break;
      case 6:
        r = B.Nearest, n = B.Linear, l ? s = B.Linear : (s = B.Nearest, o = u = 0);
        break;
      case 7:
        r = B.Nearest, n = B.Linear, s = B.Nearest, o = u = 0;
        break;
      case 1:
      case 1:
        r = B.Nearest, n = B.Nearest, s = B.Nearest, o = u = 0;
        break;
      case 9:
        r = B.Linear, n = B.Nearest, s = B.Nearest, l || (o = u = 0);
        break;
      case 10:
        r = B.Linear, n = B.Nearest, l ? s = B.Linear : (s = B.Nearest, o = u = 0);
        break;
      case 2:
      case 2:
        r = B.Linear, n = B.Linear, s = B.Nearest, o = u = 0;
        break;
      case 12:
        r = B.Linear, n = B.Nearest, s = B.Nearest, o = u = 0;
        break;
      default:
        r = B.Nearest, n = B.Nearest, s = B.Nearest, o = u = 0;
        break;
    }
    return t > 1 && (o !== 0 || u !== 0) && s !== B.Nearest ? {
      magFilter: B.Linear,
      minFilter: B.Linear,
      mipmapFilter: B.Linear,
      anisotropyEnabled: !0
    } : {
      magFilter: r,
      minFilter: n,
      mipmapFilter: s,
      lodMinClamp: o,
      lodMaxClamp: u
    };
  }
  static _GetWrappingMode(e) {
    switch (e) {
      case 1:
        return de.Repeat;
      case 0:
        return de.ClampToEdge;
      case 2:
        return de.MirrorRepeat;
    }
    return de.Repeat;
  }
  static _GetSamplerWrappingDescriptor(e) {
    return {
      addressModeU: this._GetWrappingMode(e._cachedWrapU),
      addressModeV: this._GetWrappingMode(e._cachedWrapV),
      addressModeW: this._GetWrappingMode(e._cachedWrapR)
    };
  }
  static _GetSamplerDescriptor(e, t) {
    const r = e.useMipMaps && e._cachedAnisotropicFilteringLevel && e._cachedAnisotropicFilteringLevel > 1 ? 4 : 1, n = this._GetSamplerFilterDescriptor(e, r);
    return {
      label: t,
      ...n,
      ...this._GetSamplerWrappingDescriptor(e),
      compare: e._comparisonFunction ? ce.GetCompareFunction(e._comparisonFunction) : void 0,
      maxAnisotropy: n.anisotropyEnabled ? r : 1
    };
  }
  static GetCompareFunction(e) {
    switch (e) {
      case 519:
        return O.Always;
      case 514:
        return O.Equal;
      case 516:
        return O.Greater;
      case 518:
        return O.GreaterEqual;
      case 513:
        return O.Less;
      case 515:
        return O.LessEqual;
      case 512:
        return O.Never;
      case 517:
        return O.NotEqual;
      default:
        return O.Less;
    }
  }
  getSampler(e, t = !1, r = 0, n) {
    if (this.disabled)
      return this._device.createSampler(ce._GetSamplerDescriptor(e, n));
    t ? r = 0 : r === 0 && (r = ce.GetSamplerHashCode(e));
    let s = t ? void 0 : this._samplers[r];
    return s || (s = this._device.createSampler(ce._GetSamplerDescriptor(e, n)), t || (this._samplers[r] = s)), s;
  }
}
var M;
(function(a) {
  a[a.StencilReadMask = 0] = "StencilReadMask", a[a.StencilWriteMask = 1] = "StencilWriteMask", a[a.DepthBias = 2] = "DepthBias", a[a.DepthBiasSlopeScale = 3] = "DepthBiasSlopeScale", a[a.DepthStencilState = 4] = "DepthStencilState", a[a.MRTAttachments1 = 5] = "MRTAttachments1", a[a.MRTAttachments2 = 6] = "MRTAttachments2", a[a.RasterizationState = 7] = "RasterizationState", a[a.ColorStates = 8] = "ColorStates", a[a.ShaderStage = 9] = "ShaderStage", a[a.TextureStage = 10] = "TextureStage", a[a.VertexState = 11] = "VertexState", a[a.NumStates = 12] = "NumStates";
})(M || (M = {}));
const Se = {
  0: 1,
  1: 2,
  768: 3,
  769: 4,
  770: 5,
  771: 6,
  772: 7,
  773: 8,
  774: 9,
  775: 10,
  776: 11,
  32769: 12,
  32770: 13,
  32771: 12,
  32772: 13
  // OneMinusBlendColor (alpha)
}, he = {
  0: 0,
  7680: 1,
  7681: 2,
  7682: 3,
  7683: 4,
  5386: 5,
  34055: 6,
  34056: 7
  // DECR_WRAP
}, Gr = {
  [C.PositionKind]: !0,
  [C.NormalKind]: !0,
  [C.TangentKind]: !0,
  [C.UVKind]: !0,
  [C.UV2Kind]: !0,
  [C.UV3Kind]: !0,
  [C.UV4Kind]: !0,
  [C.UV5Kind]: !0,
  [C.UV6Kind]: !0,
  [C.ColorKind]: !0,
  [C.ColorInstanceKind]: !0,
  [C.MatricesIndicesKind]: !0,
  [C.MatricesWeightsKind]: !0,
  [C.MatricesIndicesExtraKind]: !0,
  [C.MatricesWeightsExtraKind]: !0
};
class U {
  static _IsSignedType(e) {
    switch (e) {
      case C.BYTE:
      case C.SHORT:
      case C.INT:
      case C.FLOAT:
        return !0;
      case C.UNSIGNED_BYTE:
      case C.UNSIGNED_SHORT:
      case C.UNSIGNED_INT:
        return !1;
      default:
        throw new Error(`Invalid type '${e}'`);
    }
  }
  constructor(e, t) {
    this.mrtTextureCount = 0, this._device = e, this._useTextureStage = !0, this._states = new Array(30), this._statesLength = 0, this._stateDirtyLowestIndex = 0, this._emptyVertexBuffer = t, this._mrtFormats = [], this._parameter = { token: void 0, pipeline: null }, this.disabled = !1, this.vertexBuffers = [], this._kMaxVertexBufferStride = e.limits.maxVertexBufferArrayStride || 2048, this.reset();
  }
  reset() {
    this._isDirty = !0, this.vertexBuffers.length = 0, this.setAlphaToCoverage(!1), this.resetDepthCullingState(), this.setClampDepth(!1), this.setDepthBias(0), this._webgpuColorFormat = [i.BGRA8Unorm], this.setColorFormat(i.BGRA8Unorm), this.setMRT([]), this.setAlphaBlendEnabled(!1), this.setAlphaBlendFactors([null, null, null, null], [null, null]), this.setWriteMask(15), this.setDepthStencilFormat(i.Depth24PlusStencil8), this.setStencilEnabled(!1), this.resetStencilState(), this.setBuffers(null, null, null), this._setTextureState(0);
  }
  get colorFormats() {
    return this._mrtAttachments1 > 0 ? this._mrtFormats : this._webgpuColorFormat;
  }
  getRenderPipeline(e, t, r, n = 0) {
    if (r = T.GetSample(r), this.disabled) {
      const o = U._GetTopology(e);
      return this._setVertexState(t), this._setTextureState(n), this._parameter.pipeline = this._createRenderPipeline(t, o, r), U.NumCacheMiss++, U._NumPipelineCreationCurrentFrame++, this._parameter.pipeline;
    }
    if (this._setShaderStage(t.uniqueId), this._setRasterizationState(e, r), this._setColorStates(), this._setDepthStencilState(), this._setVertexState(t), this._setTextureState(n), this.lastStateDirtyLowestIndex = this._stateDirtyLowestIndex, !this._isDirty && this._parameter.pipeline)
      return this._stateDirtyLowestIndex = this._statesLength, U.NumCacheHitWithoutHash++, this._parameter.pipeline;
    if (this._getRenderPipeline(this._parameter), this._isDirty = !1, this._stateDirtyLowestIndex = this._statesLength, this._parameter.pipeline)
      return U.NumCacheHitWithHash++, this._parameter.pipeline;
    const s = U._GetTopology(e);
    return this._parameter.pipeline = this._createRenderPipeline(t, s, r), this._setRenderPipeline(this._parameter), U.NumCacheMiss++, U._NumPipelineCreationCurrentFrame++, this._parameter.pipeline;
  }
  endFrame() {
    U.NumPipelineCreationLastFrame = U._NumPipelineCreationCurrentFrame, U._NumPipelineCreationCurrentFrame = 0;
  }
  setAlphaToCoverage(e) {
    this._alphaToCoverageEnabled = e;
  }
  setFrontFace(e) {
    this._frontFace = e;
  }
  setCullEnabled(e) {
    this._cullEnabled = e;
  }
  setCullFace(e) {
    this._cullFace = e;
  }
  setClampDepth(e) {
    this._clampDepth = e;
  }
  resetDepthCullingState() {
    this.setDepthCullingState(!1, 2, 1, 0, 0, !0, !0, 519);
  }
  setDepthCullingState(e, t, r, n, s, o, u, l) {
    this._depthWriteEnabled = u, this._depthTestEnabled = o, this._depthCompare = (l ?? 519) - 512, this._cullFace = r, this._cullEnabled = e, this._frontFace = t, this.setDepthBiasSlopeScale(n), this.setDepthBias(s);
  }
  setDepthBias(e) {
    this._depthBias !== e && (this._depthBias = e, this._states[M.DepthBias] = e, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.DepthBias));
  }
  /*public setDepthBiasClamp(depthBiasClamp: number): void {
      if (this._depthBiasClamp !== depthBiasClamp) {
          this._depthBiasClamp = depthBiasClamp;
          this._states[StatePosition.DepthBiasClamp] = depthBiasClamp.toString();
          this._isDirty = true;
      }
  }*/
  setDepthBiasSlopeScale(e) {
    this._depthBiasSlopeScale !== e && (this._depthBiasSlopeScale = e, this._states[M.DepthBiasSlopeScale] = e, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.DepthBiasSlopeScale));
  }
  setColorFormat(e) {
    this._webgpuColorFormat[0] = e, this._colorFormat = te[e ?? ""];
  }
  setMRTAttachments(e) {
    this.mrtAttachments = e;
    let t = 0;
    for (let r = 0; r < e.length; ++r)
      e[r] !== 0 && (t += 1 << r);
    this._mrtEnabledMask !== t && (this._mrtEnabledMask = t, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.MRTAttachments1));
  }
  setMRT(e, t) {
    if (t = t ?? e.length, t > 10)
      throw "Can't handle more than 10 attachments for a MRT in cache render pipeline!";
    this.mrtTextureArray = e, this.mrtTextureCount = t, this._mrtEnabledMask = 65535;
    const r = [0, 0];
    let n = 0, s = 0, o = 0;
    for (let u = 0; u < t; ++u) {
      const c = e[u]?._hardwareTexture;
      this._mrtFormats[o] = c?.format ?? this._webgpuColorFormat[0], r[n] += te[this._mrtFormats[o] ?? ""] << s, s += 6, o++, s >= 32 && (s = 0, n++);
    }
    this._mrtFormats.length = o, (this._mrtAttachments1 !== r[0] || this._mrtAttachments2 !== r[1]) && (this._mrtAttachments1 = r[0], this._mrtAttachments2 = r[1], this._states[M.MRTAttachments1] = r[0], this._states[M.MRTAttachments2] = r[1], this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.MRTAttachments1));
  }
  setAlphaBlendEnabled(e) {
    this._alphaBlendEnabled = e;
  }
  setAlphaBlendFactors(e, t) {
    this._alphaBlendFuncParams = e, this._alphaBlendEqParams = t;
  }
  setWriteMask(e) {
    this._writeMask = e;
  }
  setDepthStencilFormat(e) {
    this._webgpuDepthStencilFormat = e, this._depthStencilFormat = e === void 0 ? 0 : te[e];
  }
  setDepthTestEnabled(e) {
    this._depthTestEnabled = e;
  }
  setDepthWriteEnabled(e) {
    this._depthWriteEnabled = e;
  }
  setDepthCompare(e) {
    this._depthCompare = (e ?? 519) - 512;
  }
  setStencilEnabled(e) {
    this._stencilEnabled = e;
  }
  setStencilCompare(e) {
    this._stencilFrontCompare = (e ?? 519) - 512;
  }
  setStencilDepthFailOp(e) {
    this._stencilFrontDepthFailOp = e === null ? 1 : he[e];
  }
  setStencilPassOp(e) {
    this._stencilFrontPassOp = e === null ? 2 : he[e];
  }
  setStencilFailOp(e) {
    this._stencilFrontFailOp = e === null ? 1 : he[e];
  }
  setStencilReadMask(e) {
    this._stencilReadMask !== e && (this._stencilReadMask = e, this._states[M.StencilReadMask] = e, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.StencilReadMask));
  }
  setStencilWriteMask(e) {
    this._stencilWriteMask !== e && (this._stencilWriteMask = e, this._states[M.StencilWriteMask] = e, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.StencilWriteMask));
  }
  resetStencilState() {
    this.setStencilState(!1, 519, 7680, 7681, 7680, 255, 255);
  }
  setStencilState(e, t, r, n, s, o, u) {
    this._stencilEnabled = e, this._stencilFrontCompare = (t ?? 519) - 512, this._stencilFrontDepthFailOp = r === null ? 1 : he[r], this._stencilFrontPassOp = n === null ? 2 : he[n], this._stencilFrontFailOp = s === null ? 1 : he[s], this.setStencilReadMask(o), this.setStencilWriteMask(u);
  }
  setBuffers(e, t, r) {
    this._vertexBuffers = e, this._overrideVertexBuffers = r, this._indexBuffer = t;
  }
  static _GetTopology(e) {
    switch (e) {
      case 0:
        return k.TriangleList;
      case 2:
        return k.PointList;
      case 1:
        return k.LineList;
      case 3:
        return k.PointList;
      case 4:
        return k.LineList;
      case 5:
        throw "LineLoop is an unsupported fillmode in WebGPU";
      case 6:
        return k.LineStrip;
      case 7:
        return k.TriangleStrip;
      case 8:
        throw "TriangleFan is an unsupported fillmode in WebGPU";
      default:
        return k.TriangleList;
    }
  }
  static _GetAphaBlendOperation(e) {
    switch (e) {
      case 32774:
        return ie.Add;
      case 32778:
        return ie.Subtract;
      case 32779:
        return ie.ReverseSubtract;
      case 32775:
        return ie.Min;
      case 32776:
        return ie.Max;
      default:
        return ie.Add;
    }
  }
  static _GetAphaBlendFactor(e) {
    switch (e) {
      case 0:
        return $.Zero;
      case 1:
        return $.One;
      case 768:
        return $.Src;
      case 769:
        return $.OneMinusSrc;
      case 770:
        return $.SrcAlpha;
      case 771:
        return $.OneMinusSrcAlpha;
      case 772:
        return $.DstAlpha;
      case 773:
        return $.OneMinusDstAlpha;
      case 774:
        return $.Dst;
      case 775:
        return $.OneMinusDst;
      case 776:
        return $.SrcAlphaSaturated;
      case 32769:
        return $.Constant;
      case 32770:
        return $.OneMinusConstant;
      case 32771:
        return $.Constant;
      case 32772:
        return $.OneMinusConstant;
      default:
        return $.One;
    }
  }
  static _GetCompareFunction(e) {
    switch (e) {
      case 0:
        return O.Never;
      case 1:
        return O.Less;
      case 2:
        return O.Equal;
      case 3:
        return O.LessEqual;
      case 4:
        return O.Greater;
      case 5:
        return O.NotEqual;
      case 6:
        return O.GreaterEqual;
      case 7:
        return O.Always;
    }
    return O.Never;
  }
  static _GetStencilOpFunction(e) {
    switch (e) {
      case 0:
        return K.Zero;
      case 1:
        return K.Keep;
      case 2:
        return K.Replace;
      case 3:
        return K.IncrementClamp;
      case 4:
        return K.DecrementClamp;
      case 5:
        return K.Invert;
      case 6:
        return K.IncrementWrap;
      case 7:
        return K.DecrementWrap;
    }
    return K.Keep;
  }
  static _GetVertexInputDescriptorFormat(e) {
    const t = e.type, r = e.normalized, n = e.getSize();
    switch (t) {
      case C.BYTE:
        switch (n) {
          case 1:
          case 2:
            return r ? D.Snorm8x2 : D.Sint8x2;
          case 3:
          case 4:
            return r ? D.Snorm8x4 : D.Sint8x4;
        }
        break;
      case C.UNSIGNED_BYTE:
        switch (n) {
          case 1:
          case 2:
            return r ? D.Unorm8x2 : D.Uint8x2;
          case 3:
          case 4:
            return r ? D.Unorm8x4 : D.Uint8x4;
        }
        break;
      case C.SHORT:
        switch (n) {
          case 1:
          case 2:
            return r ? D.Snorm16x2 : D.Sint16x2;
          case 3:
          case 4:
            return r ? D.Snorm16x4 : D.Sint16x4;
        }
        break;
      case C.UNSIGNED_SHORT:
        switch (n) {
          case 1:
          case 2:
            return r ? D.Unorm16x2 : D.Uint16x2;
          case 3:
          case 4:
            return r ? D.Unorm16x4 : D.Uint16x4;
        }
        break;
      case C.INT:
        switch (n) {
          case 1:
            return D.Sint32;
          case 2:
            return D.Sint32x2;
          case 3:
            return D.Sint32x3;
          case 4:
            return D.Sint32x4;
        }
        break;
      case C.UNSIGNED_INT:
        switch (n) {
          case 1:
            return D.Uint32;
          case 2:
            return D.Uint32x2;
          case 3:
            return D.Uint32x3;
          case 4:
            return D.Uint32x4;
        }
        break;
      case C.FLOAT:
        switch (n) {
          case 1:
            return D.Float32;
          case 2:
            return D.Float32x2;
          case 3:
            return D.Float32x3;
          case 4:
            return D.Float32x4;
        }
        break;
    }
    throw new Error(`Invalid Format '${e.getKind()}' - type=${t}, normalized=${r}, size=${n}`);
  }
  _getAphaBlendState() {
    return this._alphaBlendEnabled ? {
      srcFactor: U._GetAphaBlendFactor(this._alphaBlendFuncParams[2]),
      dstFactor: U._GetAphaBlendFactor(this._alphaBlendFuncParams[3]),
      operation: U._GetAphaBlendOperation(this._alphaBlendEqParams[1])
    } : null;
  }
  _getColorBlendState() {
    return this._alphaBlendEnabled ? {
      srcFactor: U._GetAphaBlendFactor(this._alphaBlendFuncParams[0]),
      dstFactor: U._GetAphaBlendFactor(this._alphaBlendFuncParams[1]),
      operation: U._GetAphaBlendOperation(this._alphaBlendEqParams[0])
    } : null;
  }
  _setShaderStage(e) {
    this._shaderId !== e && (this._shaderId = e, this._states[M.ShaderStage] = e, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.ShaderStage));
  }
  _setRasterizationState(e, t) {
    const r = this._frontFace, n = this._cullEnabled ? this._cullFace : 0, s = this._clampDepth ? 1 : 0, o = this._alphaToCoverageEnabled ? 1 : 0, u = r - 1 + (n << 1) + (s << 3) + (o << 4) + (e << 5) + (t << 8);
    this._rasterizationState !== u && (this._rasterizationState = u, this._states[M.RasterizationState] = this._rasterizationState, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.RasterizationState));
  }
  _setColorStates() {
    let e = ((this._writeMask ? 1 : 0) << 22) + (this._colorFormat << 23) + ((this._depthWriteEnabled ? 1 : 0) << 29);
    this._alphaBlendEnabled && (e += ((this._alphaBlendFuncParams[0] === null ? 2 : Se[this._alphaBlendFuncParams[0]]) << 0) + ((this._alphaBlendFuncParams[1] === null ? 2 : Se[this._alphaBlendFuncParams[1]]) << 4) + ((this._alphaBlendFuncParams[2] === null ? 2 : Se[this._alphaBlendFuncParams[2]]) << 8) + ((this._alphaBlendFuncParams[3] === null ? 2 : Se[this._alphaBlendFuncParams[3]]) << 12) + ((this._alphaBlendEqParams[0] === null ? 1 : this._alphaBlendEqParams[0] - 32773) << 16) + ((this._alphaBlendEqParams[1] === null ? 1 : this._alphaBlendEqParams[1] - 32773) << 19)), e !== this._colorStates && (this._colorStates = e, this._states[M.ColorStates] = this._colorStates, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.ColorStates));
  }
  _setDepthStencilState() {
    const e = this._stencilEnabled ? this._stencilFrontCompare + (this._stencilFrontDepthFailOp << 3) + (this._stencilFrontPassOp << 6) + (this._stencilFrontFailOp << 9) : 591, t = this._depthStencilFormat + ((this._depthTestEnabled ? this._depthCompare : 7) << 6) + (e << 10);
    this._depthStencilState !== t && (this._depthStencilState = t, this._states[M.DepthStencilState] = this._depthStencilState, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.DepthStencilState));
  }
  _setVertexState(e) {
    const t = this._statesLength;
    let r = M.VertexState;
    const n = e._pipelineContext, s = n.shaderProcessingContext.attributeNamesFromEffect, o = n.shaderProcessingContext.attributeLocationsFromEffect;
    let u, l = 0;
    for (let c = 0; c < s.length; c++) {
      const h = o[c];
      let d = (this._overrideVertexBuffers && this._overrideVertexBuffers[s[c]]) ?? this._vertexBuffers[s[c]];
      d || (d = this._emptyVertexBuffer);
      const f = d.effectiveBuffer?.underlyingResource;
      if (d._validOffsetRange === void 0) {
        const m = d.effectiveByteOffset, g = d.getSize(!0), p = d.effectiveByteStride;
        d._validOffsetRange = m + g <= this._kMaxVertexBufferStride && p === 0 || p !== 0 && m + g <= p;
      }
      u && u === f && d._validOffsetRange || (this.vertexBuffers[l++] = d, u = d._validOffsetRange ? f : null);
      const _ = d.hashCode + (h << 7);
      this._isDirty = this._isDirty || this._states[r] !== _, this._states[r++] = _;
    }
    this.vertexBuffers.length = l, this._statesLength = r, this._isDirty = this._isDirty || r !== t, this._isDirty && (this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.VertexState));
  }
  _setTextureState(e) {
    this._textureState !== e && (this._textureState = e, this._states[M.TextureStage] = this._textureState, this._isDirty = !0, this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, M.TextureStage));
  }
  _createPipelineLayout(e) {
    if (this._useTextureStage)
      return this._createPipelineLayoutWithTextureStage(e);
    const t = [], r = e.shaderProcessingContext.bindGroupLayoutEntries;
    for (let n = 0; n < r.length; n++) {
      const s = r[n];
      t[n] = this._device.createBindGroupLayout({
        entries: s
      });
    }
    return e.bindGroupLayouts[0] = t, this._device.createPipelineLayout({ bindGroupLayouts: t });
  }
  _createPipelineLayoutWithTextureStage(e) {
    const t = e.shaderProcessingContext, r = t.bindGroupLayoutEntries;
    let n = 1;
    for (let o = 0; o < r.length; o++) {
      const u = r[o];
      for (let l = 0; l < u.length; l++) {
        const c = r[o][l];
        if (c.texture) {
          const h = t.bindGroupLayoutEntryInfo[o][c.binding].name, d = t.availableTextures[h], f = d.autoBindSampler ? t.availableSamplers[h + L.AutoSamplerSuffix] : null;
          let _ = d.sampleType, m = f?.type ?? ue.Filtering;
          if (this._textureState & n && _ !== H.Depth && (d.autoBindSampler && (m = ue.NonFiltering), _ = H.UnfilterableFloat), c.texture.sampleType = _, f) {
            const g = t.bindGroupLayoutEntryInfo[f.binding.groupIndex][f.binding.bindingIndex].index;
            r[f.binding.groupIndex][g].sampler.type = m;
          }
          n = n << 1;
        }
      }
    }
    const s = [];
    for (let o = 0; o < r.length; ++o)
      s[o] = this._device.createBindGroupLayout({
        entries: r[o]
      });
    return e.bindGroupLayouts[this._textureState] = s, this._device.createPipelineLayout({ bindGroupLayouts: s });
  }
  _getVertexInputDescriptor(e) {
    const t = [], r = e._pipelineContext, n = r.shaderProcessingContext.attributeNamesFromEffect, s = r.shaderProcessingContext.attributeLocationsFromEffect;
    let o, u;
    for (let l = 0; l < n.length; l++) {
      const c = s[l];
      let h = (this._overrideVertexBuffers && this._overrideVertexBuffers[n[l]]) ?? this._vertexBuffers[n[l]];
      h || (h = this._emptyVertexBuffer);
      let d = h.effectiveBuffer?.underlyingResource, f = h.effectiveByteOffset;
      const _ = !h._validOffsetRange;
      if (!(o && u && o === d) || _) {
        const m = {
          arrayStride: h.effectiveByteStride,
          stepMode: h.getIsInstanced() ? Te.Instance : Te.Vertex,
          attributes: []
        };
        t.push(m), u = m.attributes, _ && (f = 0, d = null);
      }
      u.push({
        shaderLocation: c,
        offset: f,
        format: U._GetVertexInputDescriptorFormat(h)
      }), o = d;
    }
    return t;
  }
  _processNonFloatVertexBuffers(e, t) {
    const r = e.engine._getShaderProcessor(e.shaderProcessingContext.shaderLanguage);
    let n = !1;
    for (const s in this._vertexBuffers) {
      const o = this._vertexBuffers[s];
      if (!o || !Gr[s])
        continue;
      const u = o.normalized ? C.FLOAT : o.type, l = e.vertexBufferKindToType[s];
      (u !== C.FLOAT && l === void 0 || l !== void 0 && l !== u) && (n = !0, e.vertexBufferKindToType[s] = u, u !== C.FLOAT && (r.vertexBufferKindToNumberOfComponents[s] = C.DeduceStride(s), U._IsSignedType(u) && (r.vertexBufferKindToNumberOfComponents[s] *= -1)));
    }
    n && t._processShaderCode(r, !0);
  }
  _createRenderPipeline(e, t, r) {
    const n = e._pipelineContext, s = this._getVertexInputDescriptor(e), o = this._createPipelineLayout(n), u = [], l = this._getAphaBlendState(), c = this._getColorBlendState();
    if (this._processNonFloatVertexBuffers(n, e), this._mrtAttachments1 > 0)
      for (let _ = 0; _ < this._mrtFormats.length; ++_) {
        const m = this._mrtFormats[_];
        if (m) {
          const g = {
            format: m,
            writeMask: this._mrtEnabledMask & 1 << _ ? this._writeMask : 0
          };
          l && c && (g.blend = {
            alpha: l,
            color: c
          }), u.push(g);
        } else
          u.push(null);
      }
    else if (this._webgpuColorFormat[0]) {
      const _ = {
        format: this._webgpuColorFormat[0],
        writeMask: this._writeMask
      };
      l && c && (_.blend = {
        alpha: l,
        color: c
      }), u.push(_);
    } else
      u.push(null);
    const h = {
      compare: U._GetCompareFunction(
        this._stencilEnabled ? this._stencilFrontCompare : 7
        /* ALWAYS */
      ),
      depthFailOp: U._GetStencilOpFunction(
        this._stencilEnabled ? this._stencilFrontDepthFailOp : 1
        /* KEEP */
      ),
      failOp: U._GetStencilOpFunction(
        this._stencilEnabled ? this._stencilFrontFailOp : 1
        /* KEEP */
      ),
      passOp: U._GetStencilOpFunction(
        this._stencilEnabled ? this._stencilFrontPassOp : 1
        /* KEEP */
      )
    };
    let d;
    (t === k.LineStrip || t === k.TriangleStrip) && (d = !this._indexBuffer || this._indexBuffer.is32Bits ? le.Uint32 : le.Uint16);
    const f = this._webgpuDepthStencilFormat ? T.HasStencilAspect(this._webgpuDepthStencilFormat) : !1;
    return this._device.createRenderPipeline({
      label: `RenderPipeline_${u[0]?.format ?? "nooutput"}_${this._webgpuDepthStencilFormat ?? "nodepth"}_samples${r}_textureState${this._textureState}`,
      layout: o,
      vertex: {
        module: n.stages.vertexStage.module,
        entryPoint: n.stages.vertexStage.entryPoint,
        buffers: s
      },
      primitive: {
        topology: t,
        stripIndexFormat: d,
        frontFace: this._frontFace === 1 ? Ie.CCW : Ie.CW,
        cullMode: this._cullEnabled ? this._cullFace === 2 ? xe.Front : xe.Back : xe.None
      },
      fragment: n.stages.fragmentStage ? {
        module: n.stages.fragmentStage.module,
        entryPoint: n.stages.fragmentStage.entryPoint,
        targets: u
      } : void 0,
      multisample: {
        count: r
        /*mask,
        alphaToCoverageEnabled,*/
      },
      depthStencil: this._webgpuDepthStencilFormat === void 0 ? void 0 : {
        depthWriteEnabled: this._depthWriteEnabled,
        depthCompare: this._depthTestEnabled ? U._GetCompareFunction(this._depthCompare) : O.Always,
        format: this._webgpuDepthStencilFormat,
        stencilFront: this._stencilEnabled && f ? h : void 0,
        stencilBack: this._stencilEnabled && f ? h : void 0,
        stencilReadMask: this._stencilEnabled && f ? this._stencilReadMask : void 0,
        stencilWriteMask: this._stencilEnabled && f ? this._stencilWriteMask : void 0,
        depthBias: this._depthBias,
        depthBiasClamp: this._depthBiasClamp,
        depthBiasSlopeScale: this._depthBiasSlopeScale
      }
    });
  }
}
U.NumCacheHitWithoutHash = 0;
U.NumCacheHitWithHash = 0;
U.NumCacheMiss = 0;
U.NumPipelineCreationLastFrame = 0;
U._NumPipelineCreationCurrentFrame = 0;
class Oe {
  constructor() {
    this.values = {};
  }
  count() {
    let e = 0, t = this.pipeline ? 1 : 0;
    for (const r in this.values) {
      const n = this.values[r], [s, o] = n.count();
      e += s, t += o, e++;
    }
    return [e, t];
  }
}
class J extends U {
  static GetNodeCounts() {
    const e = J._Cache.count();
    return { nodeCount: e[0], pipelineCount: e[1] };
  }
  static _GetPipelines(e, t, r, n) {
    if (e.pipeline) {
      const s = r.slice();
      s.length = n, t.push(s);
    }
    for (const s in e.values) {
      const o = e.values[s];
      r[n] = parseInt(s), J._GetPipelines(o, t, r, n + 1);
    }
  }
  static GetPipelines() {
    const e = [];
    return J._GetPipelines(J._Cache, e, [], 0), e;
  }
  static ResetCache() {
    J._Cache = new Oe();
  }
  reset() {
    this._nodeStack = [], this._nodeStack[0] = J._Cache, super.reset();
  }
  _getRenderPipeline(e) {
    let t = this._nodeStack[this._stateDirtyLowestIndex];
    for (let r = this._stateDirtyLowestIndex; r < this._statesLength; ++r) {
      let n = t.values[this._states[r]];
      n || (n = new Oe(), t.values[this._states[r]] = n), t = n, this._nodeStack[r + 1] = t;
    }
    e.token = t, e.pipeline = t.pipeline;
  }
  _setRenderPipeline(e) {
    e.token.pipeline = e.pipeline;
  }
}
J._Cache = new Oe();
class Er extends yt {
  constructor(e) {
    super(!1), this._cache = e, this.reset();
  }
  get func() {
    return this._func;
  }
  set func(e) {
    this._func !== e && (this._func = e, this._cache.setStencilCompare(e));
  }
  get funcMask() {
    return this._funcMask;
  }
  set funcMask(e) {
    this._funcMask !== e && (this._funcMask = e, this._cache.setStencilReadMask(e));
  }
  get opStencilFail() {
    return this._opStencilFail;
  }
  set opStencilFail(e) {
    this._opStencilFail !== e && (this._opStencilFail = e, this._cache.setStencilFailOp(e));
  }
  get opDepthFail() {
    return this._opDepthFail;
  }
  set opDepthFail(e) {
    this._opDepthFail !== e && (this._opDepthFail = e, this._cache.setStencilDepthFailOp(e));
  }
  get opStencilDepthPass() {
    return this._opStencilDepthPass;
  }
  set opStencilDepthPass(e) {
    this._opStencilDepthPass !== e && (this._opStencilDepthPass = e, this._cache.setStencilPassOp(e));
  }
  get mask() {
    return this._mask;
  }
  set mask(e) {
    this._mask !== e && (this._mask = e, this._cache.setStencilWriteMask(e));
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(e) {
    this._enabled !== e && (this._enabled = e, this._cache.setStencilEnabled(e));
  }
  reset() {
    super.reset(), this._cache.resetStencilState();
  }
  apply() {
    const e = this.stencilMaterial?.enabled;
    this.enabled = e ? this.stencilMaterial.enabled : this.stencilGlobal.enabled, this.enabled && (this.func = e ? this.stencilMaterial.func : this.stencilGlobal.func, this.funcRef = e ? this.stencilMaterial.funcRef : this.stencilGlobal.funcRef, this.funcMask = e ? this.stencilMaterial.funcMask : this.stencilGlobal.funcMask, this.opStencilFail = e ? this.stencilMaterial.opStencilFail : this.stencilGlobal.opStencilFail, this.opDepthFail = e ? this.stencilMaterial.opDepthFail : this.stencilGlobal.opDepthFail, this.opStencilDepthPass = e ? this.stencilMaterial.opStencilDepthPass : this.stencilGlobal.opStencilDepthPass, this.mask = e ? this.stencilMaterial.mask : this.stencilGlobal.mask);
  }
}
class Ur extends Ct {
  /**
   * Initializes the state.
   * @param cache
   */
  constructor(e) {
    super(!1), this._cache = e, this.reset();
  }
  get zOffset() {
    return this._zOffset;
  }
  set zOffset(e) {
    this._zOffset !== e && (this._zOffset = e, this._isZOffsetDirty = !0, this._cache.setDepthBiasSlopeScale(e));
  }
  get zOffsetUnits() {
    return this._zOffsetUnits;
  }
  set zOffsetUnits(e) {
    this._zOffsetUnits !== e && (this._zOffsetUnits = e, this._isZOffsetDirty = !0, this._cache.setDepthBias(e));
  }
  get cullFace() {
    return this._cullFace;
  }
  set cullFace(e) {
    this._cullFace !== e && (this._cullFace = e, this._isCullFaceDirty = !0, this._cache.setCullFace(e ?? 1));
  }
  get cull() {
    return this._cull;
  }
  set cull(e) {
    this._cull !== e && (this._cull = e, this._isCullDirty = !0, this._cache.setCullEnabled(!!e));
  }
  get depthFunc() {
    return this._depthFunc;
  }
  set depthFunc(e) {
    this._depthFunc !== e && (this._depthFunc = e, this._isDepthFuncDirty = !0, this._cache.setDepthCompare(e));
  }
  get depthMask() {
    return this._depthMask;
  }
  set depthMask(e) {
    this._depthMask !== e && (this._depthMask = e, this._isDepthMaskDirty = !0, this._cache.setDepthWriteEnabled(e));
  }
  get depthTest() {
    return this._depthTest;
  }
  set depthTest(e) {
    this._depthTest !== e && (this._depthTest = e, this._isDepthTestDirty = !0, this._cache.setDepthTestEnabled(e));
  }
  get frontFace() {
    return this._frontFace;
  }
  set frontFace(e) {
    this._frontFace !== e && (this._frontFace = e, this._isFrontFaceDirty = !0, this._cache.setFrontFace(e ?? 2));
  }
  reset() {
    super.reset(), this._cache.resetDepthCullingState();
  }
  apply() {
  }
}
class Lr {
  /**
   * Checks if a texture is an external or internal texture
   * @param texture the external or internal texture
   * @returns true if the texture is an external texture, else false
   */
  static IsExternalTexture(e) {
    return e.underlyingResource !== void 0;
  }
  /**
   * Get the class name of the texture.
   * @returns "ExternalTexture"
   */
  getClassName() {
    return "ExternalTexture";
  }
  /**
   * Gets the underlying texture object
   */
  get underlyingResource() {
    return this._video;
  }
  /**
   * Constructs the texture
   * @param video The video the texture should be wrapped around
   */
  constructor(e) {
    this.useMipMaps = !1, this.type = 16, this.format = 4294967295, this._video = e, this.uniqueId = Fe._Counter++;
  }
  /**
   * Get if the texture is ready to be used (downloaded, converted, mip mapped...).
   * @returns true if fully ready
   */
  isReady() {
    return this._video.readyState >= this._video.HAVE_CURRENT_DATA;
  }
  /**
   * Dispose the texture and release its associated resources.
   */
  dispose() {
  }
}
class Ee {
  get forceBindGroupCreation() {
    return this._numExternalTextures > 0;
  }
  get hasFloatOrDepthTextures() {
    return this._numFloatOrDepthTextures > 0;
  }
  constructor() {
    this.uniqueId = Ee._Counter++, this.updateId = 0, this.textureState = 0, this.reset();
  }
  reset() {
    this.samplers = {}, this.textures = {}, this.isDirty = !0, this._numFloatOrDepthTextures = 0, this._numExternalTextures = 0;
  }
  setSampler(e, t) {
    let r = this.samplers[e], n = -1;
    r ? n = r.hashCode : this.samplers[e] = r = { sampler: t, hashCode: 0 }, r.sampler = t, r.hashCode = t ? ce.GetSamplerHashCode(t) : 0;
    const s = n !== r.hashCode;
    s && this.updateId++, this.isDirty || (this.isDirty = s);
  }
  setTexture(e, t) {
    let r = this.textures[e], n = -1;
    r ? n = r.texture?.uniqueId ?? -1 : this.textures[e] = r = { texture: t, isFloatOrDepthTexture: !1, isExternalTexture: !1 }, r.isExternalTexture && this._numExternalTextures--, r.isFloatOrDepthTexture && this._numFloatOrDepthTextures--, t ? (r.isFloatOrDepthTexture = t.type === 1 || t.format >= 13 && t.format <= 18, r.isExternalTexture = Lr.IsExternalTexture(t), r.isFloatOrDepthTexture && this._numFloatOrDepthTextures++, r.isExternalTexture && this._numExternalTextures++) : (r.isFloatOrDepthTexture = !1, r.isExternalTexture = !1), r.texture = t;
    const s = n !== (t?.uniqueId ?? -1);
    s && this.updateId++, this.isDirty || (this.isDirty = s);
  }
}
Ee._Counter = 0;
class Ue {
  isDirty(e) {
    return this._isDirty || this._materialContextUpdateId !== e;
  }
  resetIsDirty(e) {
    this._isDirty = !1, this._materialContextUpdateId = e;
  }
  get useInstancing() {
    return this._useInstancing;
  }
  set useInstancing(e) {
    this._useInstancing !== e && (e ? (this.indirectDrawBuffer = this._bufferManager.createRawBuffer(20, w.CopyDst | w.Indirect | w.Storage, void 0, "IndirectDrawBuffer"), this._indirectDrawData = new Uint32Array(5), this._indirectDrawData[3] = 0, this._indirectDrawData[4] = 0) : (this.indirectDrawBuffer && this._bufferManager.releaseBuffer(this.indirectDrawBuffer), this.indirectDrawBuffer = void 0, this._indirectDrawData = void 0), this._useInstancing = e, this._currentInstanceCount = -1);
  }
  constructor(e) {
    this._bufferManager = e, this.uniqueId = Ue._Counter++, this._useInstancing = !1, this._currentInstanceCount = 0, this.reset();
  }
  reset() {
    this.buffers = {}, this._isDirty = !0, this._materialContextUpdateId = 0, this.fastBundle = void 0, this.bindGroups = void 0;
  }
  setBuffer(e, t) {
    this._isDirty || (this._isDirty = t?.uniqueId !== this.buffers[e]?.uniqueId), this.buffers[e] = t;
  }
  setIndirectData(e, t, r) {
    t === this._currentInstanceCount || !this.indirectDrawBuffer || !this._indirectDrawData || (this._currentInstanceCount = t, this._indirectDrawData[0] = e, this._indirectDrawData[1] = t, this._indirectDrawData[2] = r, this._bufferManager.setRawData(this.indirectDrawBuffer, 0, this._indirectDrawData, 0, 20));
  }
  dispose() {
    this.indirectDrawBuffer && (this._bufferManager.releaseBuffer(this.indirectDrawBuffer), this.indirectDrawBuffer = void 0, this._indirectDrawData = void 0), this.fastBundle = void 0, this.bindGroups = void 0, this.buffers = void 0;
  }
}
Ue._Counter = 0;
class me {
  constructor() {
    this.values = {};
  }
}
class A {
  static get Statistics() {
    return {
      totalCreated: A.NumBindGroupsCreatedTotal,
      lastFrameCreated: A.NumBindGroupsCreatedLastFrame,
      lookupLastFrame: A.NumBindGroupsLookupLastFrame,
      noLookupLastFrame: A.NumBindGroupsNoLookupLastFrame
    };
  }
  static ResetCache() {
    A._Cache = new me(), A.NumBindGroupsCreatedTotal = 0, A.NumBindGroupsCreatedLastFrame = 0, A.NumBindGroupsLookupLastFrame = 0, A.NumBindGroupsNoLookupLastFrame = 0, A._NumBindGroupsCreatedCurrentFrame = 0, A._NumBindGroupsLookupCurrentFrame = 0, A._NumBindGroupsNoLookupCurrentFrame = 0;
  }
  constructor(e, t, r) {
    this.disabled = !1, this._device = e, this._cacheSampler = t, this._engine = r;
  }
  endFrame() {
    A.NumBindGroupsCreatedLastFrame = A._NumBindGroupsCreatedCurrentFrame, A.NumBindGroupsLookupLastFrame = A._NumBindGroupsLookupCurrentFrame, A.NumBindGroupsNoLookupLastFrame = A._NumBindGroupsNoLookupCurrentFrame, A._NumBindGroupsCreatedCurrentFrame = 0, A._NumBindGroupsLookupCurrentFrame = 0, A._NumBindGroupsNoLookupCurrentFrame = 0;
  }
  /**
   * Cache is currently based on the uniform/storage buffers, samplers and textures used by the binding groups.
   * Note that all uniform buffers have an offset of 0 in Babylon and we don't have a use case where we would have the same buffer used with different capacity values:
   * that means we don't need to factor in the offset/size of the buffer in the cache, only the id
   * @param webgpuPipelineContext
   * @param drawContext
   * @param materialContext
   * @returns a bind group array
   */
  getBindGroups(e, t, r) {
    let n, s = A._Cache;
    const o = this.disabled || r.forceBindGroupCreation;
    if (!o) {
      if (!t.isDirty(r.updateId) && !r.isDirty)
        return A._NumBindGroupsNoLookupCurrentFrame++, t.bindGroups;
      for (const l of e.shaderProcessingContext.bufferNames) {
        const c = t.buffers[l]?.uniqueId ?? 0;
        let h = s.values[c];
        h || (h = new me(), s.values[c] = h), s = h;
      }
      for (const l of e.shaderProcessingContext.samplerNames) {
        const c = r.samplers[l]?.hashCode ?? 0;
        let h = s.values[c];
        h || (h = new me(), s.values[c] = h), s = h;
      }
      for (const l of e.shaderProcessingContext.textureNames) {
        const c = r.textures[l]?.texture?.uniqueId ?? 0;
        let h = s.values[c];
        h || (h = new me(), s.values[c] = h), s = h;
      }
      n = s.bindGroups;
    }
    if (t.resetIsDirty(r.updateId), r.isDirty = !1, n)
      return t.bindGroups = n, A._NumBindGroupsLookupCurrentFrame++, n;
    n = [], t.bindGroups = n, o || (s.bindGroups = n), A.NumBindGroupsCreatedTotal++, A._NumBindGroupsCreatedCurrentFrame++;
    const u = e.bindGroupLayouts[r.textureState];
    for (let l = 0; l < e.shaderProcessingContext.bindGroupLayoutEntries.length; l++) {
      const c = e.shaderProcessingContext.bindGroupLayoutEntries[l], h = e.shaderProcessingContext.bindGroupEntries[l];
      for (let f = 0; f < c.length; f++) {
        const _ = e.shaderProcessingContext.bindGroupLayoutEntries[l][f], m = e.shaderProcessingContext.bindGroupLayoutEntryInfo[l][_.binding], g = m.nameInArrayOfTexture ?? m.name;
        if (_.sampler) {
          const p = r.samplers[g];
          if (p) {
            const x = p.sampler;
            if (!x) {
              this._engine.dbgSanityChecks && y.Error(`Trying to bind a null sampler! entry=${JSON.stringify(_)}, name=${g}, bindingInfo=${JSON.stringify(p, (S, b) => S === "texture" ? "<no dump>" : b)}, materialContext.uniqueId=${r.uniqueId}`, 50);
              continue;
            }
            h[f].resource = this._cacheSampler.getSampler(x, !1, p.hashCode, x.label);
          } else
            y.Error(`Sampler "${g}" could not be bound. entry=${JSON.stringify(_)}, materialContext=${JSON.stringify(r, (x, S) => x === "texture" || x === "sampler" ? "<no dump>" : S)}`, 50);
        } else if (_.texture || _.storageTexture) {
          const p = r.textures[g];
          if (p) {
            if (this._engine.dbgSanityChecks && p.texture === null) {
              y.Error(`Trying to bind a null texture! entry=${JSON.stringify(_)}, bindingInfo=${JSON.stringify(p, (S, b) => S === "texture" ? "<no dump>" : b)}, materialContext.uniqueId=${r.uniqueId}`, 50);
              continue;
            }
            const x = p.texture._hardwareTexture;
            if (this._engine.dbgSanityChecks && (!x || _.texture && !x.view || _.storageTexture && !x.viewForWriting)) {
              y.Error(`Trying to bind a null gpu texture or view! entry=${JSON.stringify(_)}, name=${g}, bindingInfo=${JSON.stringify(p, (S, b) => S === "texture" ? "<no dump>" : b)}, isReady=${p.texture?.isReady}, materialContext.uniqueId=${r.uniqueId}`, 50);
              continue;
            }
            h[f].resource = _.storageTexture ? x.viewForWriting : x.view;
          } else
            y.Error(`Texture "${g}" could not be bound. entry=${JSON.stringify(_)}, materialContext=${JSON.stringify(r, (x, S) => x === "texture" || x === "sampler" ? "<no dump>" : S)}`, 50);
        } else if (_.externalTexture) {
          const p = r.textures[g];
          if (p) {
            if (this._engine.dbgSanityChecks && p.texture === null) {
              y.Error(`Trying to bind a null external texture! entry=${JSON.stringify(_)}, name=${g}, bindingInfo=${JSON.stringify(p, (S, b) => S === "texture" ? "<no dump>" : b)}, materialContext.uniqueId=${r.uniqueId}`, 50);
              continue;
            }
            const x = p.texture.underlyingResource;
            if (this._engine.dbgSanityChecks && !x) {
              y.Error(`Trying to bind a null gpu external texture! entry=${JSON.stringify(_)}, name=${g}, bindingInfo=${JSON.stringify(p, (S, b) => S === "texture" ? "<no dump>" : b)}, isReady=${p.texture?.isReady}, materialContext.uniqueId=${r.uniqueId}`, 50);
              continue;
            }
            h[f].resource = this._device.importExternalTexture({ source: x });
          } else
            y.Error(`Texture "${g}" could not be bound. entry=${JSON.stringify(_)}, materialContext=${JSON.stringify(r, (x, S) => x === "texture" || x === "sampler" ? "<no dump>" : S)}`, 50);
        } else if (_.buffer) {
          const p = t.buffers[g];
          if (p) {
            const x = p.underlyingResource;
            h[f].resource.buffer = x, h[f].resource.size = p.capacity;
          } else
            y.Error(`Can't find buffer "${g}". entry=${JSON.stringify(_)}, buffers=${JSON.stringify(t.buffers)}, drawContext.uniqueId=${t.uniqueId}`, 50);
        }
      }
      const d = u[l];
      n[l] = this._device.createBindGroup({
        layout: d,
        entries: h
      });
    }
    return n;
  }
}
A.NumBindGroupsCreatedTotal = 0;
A.NumBindGroupsCreatedLastFrame = 0;
A.NumBindGroupsLookupLastFrame = 0;
A.NumBindGroupsNoLookupLastFrame = 0;
A._Cache = new me();
A._NumBindGroupsCreatedCurrentFrame = 0;
A._NumBindGroupsLookupCurrentFrame = 0;
A._NumBindGroupsNoLookupCurrentFrame = 0;
const Dr = "clearQuadVertexShader", Fr = `uniform depthValue: f32;const pos=array(
vec2f(-1.0,1.0),
vec2f(1.0,1.0),
vec2f(-1.0,-1.0),
vec2f(1.0,-1.0)
);
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.position=vec4f(pos[input.vertexIndex],uniforms.depthValue,1.0);
#define CUSTOM_VERTEX_MAIN_END
}
`;
V.ShadersStoreWGSL[Dr] = Fr;
const Pr = "clearQuadPixelShader", Mr = `uniform color: vec4f;@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=uniforms.color;}
`;
V.ShadersStoreWGSL[Pr] = Mr;
class Nr {
  setDepthStencilFormat(e) {
    this._depthTextureFormat = e, this._cacheRenderPipeline.setDepthStencilFormat(e);
  }
  setColorFormat(e) {
    this._cacheRenderPipeline.setColorFormat(e);
  }
  setMRTAttachments(e, t, r) {
    this._cacheRenderPipeline.setMRT(t, r), this._cacheRenderPipeline.setMRTAttachments(e);
  }
  constructor(e, t, r) {
    this._bindGroups = {}, this._bundleCache = {}, this._keyTemp = [], this._device = e, this._engine = t, this._cacheRenderPipeline = new J(this._device, r), this._cacheRenderPipeline.setDepthTestEnabled(!1), this._cacheRenderPipeline.setStencilReadMask(255), this._effect = t.createEffect("clearQuad", [], ["color", "depthValue"], void 0, void 0, void 0, void 0, void 0, void 0, j.WGSL);
  }
  clear(e, t, r, n, s = 1) {
    let o, u = null, l;
    const c = !!this._engine._currentRenderTarget;
    if (e)
      o = e;
    else {
      let p = 0;
      this._keyTemp.length = 0;
      for (let S = 0; S < this._cacheRenderPipeline.colorFormats.length; ++S)
        this._keyTemp[p++] = te[this._cacheRenderPipeline.colorFormats[S] ?? ""];
      const x = te[this._depthTextureFormat ?? 0];
      if (this._keyTemp[p] = (t ? t.r + t.g * 256 + t.b * 256 * 256 + t.a * 256 * 256 * 256 : 0) + (r ? 2 ** 32 : 0) + (n ? 2 ** 33 : 0) + (this._engine.useReverseDepthBuffer ? 2 ** 34 : 0) + (c ? 2 ** 35 : 0) + (s > 1 ? 2 ** 36 : 0) + x * 2 ** 37, l = this._keyTemp.join("_"), u = this._bundleCache[l], u)
        return u;
      o = this._device.createRenderBundleEncoder({
        label: "clearQuadRenderBundle",
        colorFormats: this._cacheRenderPipeline.colorFormats,
        depthStencilFormat: this._depthTextureFormat,
        sampleCount: T.GetSample(s)
      });
    }
    this._cacheRenderPipeline.setDepthWriteEnabled(!!r), this._cacheRenderPipeline.setStencilEnabled(!!n && !!this._depthTextureFormat && T.HasStencilAspect(this._depthTextureFormat)), this._cacheRenderPipeline.setStencilWriteMask(n ? 255 : 0), this._cacheRenderPipeline.setStencilCompare(n ? 519 : 512), this._cacheRenderPipeline.setStencilPassOp(n ? 7681 : 7680), this._cacheRenderPipeline.setWriteMask(t ? 15 : 0);
    const h = this._cacheRenderPipeline.getRenderPipeline(7, this._effect, s), d = this._effect._pipelineContext;
    t && this._effect.setDirectColor4("color", t), this._effect.setFloat("depthValue", this._engine.useReverseDepthBuffer ? this._engine._clearReverseDepthValue : this._engine._clearDepthValue), d.uniformBuffer.update();
    const f = c ? this._engine._ubInvertY : this._engine._ubDontInvertY, _ = d.uniformBuffer.getBuffer(), m = _.uniqueId + "-" + f.uniqueId;
    let g = this._bindGroups[m];
    if (!g) {
      const p = d.bindGroupLayouts[0];
      g = this._bindGroups[m] = [], g.push(this._device.createBindGroup({
        label: `clearQuadBindGroup0-${m}`,
        layout: p[0],
        entries: []
      })), z._SimplifiedKnownBindings || g.push(this._device.createBindGroup({
        label: `clearQuadBindGroup1-${m}`,
        layout: p[1],
        entries: []
      })), g.push(this._device.createBindGroup({
        label: `clearQuadBindGroup${z._SimplifiedKnownBindings ? 1 : 2}-${m}`,
        layout: p[z._SimplifiedKnownBindings ? 1 : 2],
        entries: [
          {
            binding: 0,
            resource: {
              buffer: f.underlyingResource,
              size: f.capacity
            }
          },
          {
            binding: 1,
            resource: {
              buffer: _.underlyingResource,
              size: _.capacity
            }
          }
        ]
      }));
    }
    o.setPipeline(h);
    for (let p = 0; p < g.length; ++p)
      o.setBindGroup(p, g[p]);
    return o.draw(4, 1, 0, 0), e || (u = o.finish(), this._bundleCache[l] = u), u;
  }
}
class Ve {
  constructor(e, t, r, n) {
    this.x = Math.floor(e), this.y = Math.floor(t), this.w = Math.floor(r), this.h = Math.floor(n);
  }
  run(e) {
    e.setViewport(this.x, this.y, this.w, this.h, 0, 1);
  }
  clone() {
    return new Ve(this.x, this.y, this.w, this.h);
  }
}
class $e {
  constructor(e, t, r, n) {
    this.x = e, this.y = t, this.w = r, this.h = n;
  }
  run(e) {
    e.setScissorRect(this.x, this.y, this.w, this.h);
  }
  clone() {
    return new $e(this.x, this.y, this.w, this.h);
  }
}
class Ge {
  constructor(e) {
    this.ref = e;
  }
  run(e) {
    e.setStencilReference(this.ref);
  }
  clone() {
    return new Ge(this.ref);
  }
}
class We {
  constructor(e) {
    this.color = e;
  }
  run(e) {
    e.setBlendConstant(this.color);
  }
  clone() {
    return new We(this.color);
  }
}
class pt {
  constructor(e) {
    this.query = e;
  }
  run(e) {
    e.beginOcclusionQuery(this.query);
  }
  clone() {
    return new pt(this.query);
  }
}
class _t {
  constructor() {
  }
  run(e) {
    e.endOcclusionQuery();
  }
  clone() {
    return new _t();
  }
}
class ke {
  constructor() {
    this.bundles = [];
  }
  run(e) {
    e.executeBundles(this.bundles);
  }
  clone() {
    const e = new ke();
    return e.bundles = this.bundles, e;
  }
}
class qe {
  constructor(e) {
    this.numDrawCalls = 0, this._device = e, this._list = new Array(10), this._listLength = 0;
  }
  addBundle(e) {
    if (!this._currentItemIsBundle) {
      const t = new ke();
      this._list[this._listLength++] = t, this._currentBundleList = t.bundles, this._currentItemIsBundle = !0;
    }
    e && this._currentBundleList.push(e);
  }
  _finishBundle() {
    this._currentItemIsBundle && this._bundleEncoder && (this._currentBundleList.push(this._bundleEncoder.finish()), this._bundleEncoder = void 0, this._currentItemIsBundle = !1);
  }
  addItem(e) {
    this._finishBundle(), this._list[this._listLength++] = e, this._currentItemIsBundle = !1;
  }
  getBundleEncoder(e, t, r) {
    return this._currentItemIsBundle || (this.addBundle(), this._bundleEncoder = this._device.createRenderBundleEncoder({
      colorFormats: e,
      depthStencilFormat: t,
      sampleCount: T.GetSample(r)
    })), this._bundleEncoder;
  }
  close() {
    this._finishBundle();
  }
  run(e) {
    this.close();
    for (let t = 0; t < this._listLength; ++t)
      this._list[t].run(e);
  }
  reset() {
    this._listLength = 0, this._currentItemIsBundle = !1, this.numDrawCalls = 0;
  }
  clone() {
    this.close();
    const e = new qe(this._device);
    e._list = new Array(this._listLength), e._listLength = this._listLength, e.numDrawCalls = this.numDrawCalls;
    for (let t = 0; t < this._listLength; ++t)
      e._list[t] = this._list[t].clone();
    return e;
  }
}
class mt {
  get querySet() {
    return this._querySet;
  }
  constructor(e, t, r, n, s, o = !0, u) {
    this._dstBuffers = [], this._engine = e, this._device = n, this._bufferManager = s, this._count = t, this._canUseMultipleBuffers = o, this._querySet = n.createQuerySet({
      label: u ?? "QuerySet",
      type: r,
      count: t
    }), this._queryBuffer = s.createRawBuffer(8 * t, w.QueryResolve | w.CopySrc, void 0, "QueryBuffer"), o || this._dstBuffers.push(this._bufferManager.createRawBuffer(8 * this._count, w.MapRead | w.CopyDst, void 0, "QueryBufferNoMultipleBuffers"));
  }
  _getBuffer(e, t) {
    if (!this._canUseMultipleBuffers && this._dstBuffers.length === 0)
      return null;
    const r = this._device.createCommandEncoder();
    let n;
    return this._dstBuffers.length === 0 ? n = this._bufferManager.createRawBuffer(8 * this._count, w.MapRead | w.CopyDst, void 0, "QueryBufferAdditionalBuffer") : (n = this._dstBuffers[this._dstBuffers.length - 1], this._dstBuffers.length--), r.resolveQuerySet(this._querySet, e, t, this._queryBuffer, 0), r.copyBufferToBuffer(this._queryBuffer, 0, n, 0, 8 * t), this._device.queue.submit([r.finish()]), n;
  }
  async readValues(e = 0, t = 1) {
    const r = this._getBuffer(e, t);
    if (r === null)
      return null;
    const n = this._engine.uniqueId;
    return r.mapAsync(pe.Read).then(() => {
      const s = new BigUint64Array(r.getMappedRange()).slice();
      return r.unmap(), this._dstBuffers[this._dstBuffers.length] = r, s;
    }, (s) => {
      if (this._engine.isDisposed || this._engine.uniqueId !== n)
        return null;
      throw s;
    });
  }
  async readValue(e = 0) {
    const t = this._getBuffer(e, 1);
    if (t === null)
      return null;
    const r = this._engine.uniqueId;
    return t.mapAsync(pe.Read).then(() => {
      const n = new BigUint64Array(t.getMappedRange()), s = Number(n[0]);
      return t.unmap(), this._dstBuffers[this._dstBuffers.length] = t, s;
    }, (n) => {
      if (this._engine.isDisposed || this._engine.uniqueId !== r)
        return 0;
      throw n;
    });
  }
  async readTwoValuesAndSubtract(e = 0) {
    const t = this._getBuffer(e, 2);
    if (t === null)
      return null;
    const r = this._engine.uniqueId;
    return t.mapAsync(pe.Read).then(() => {
      const n = new BigUint64Array(t.getMappedRange()), s = Number(n[1] - n[0]);
      return t.unmap(), this._dstBuffers[this._dstBuffers.length] = t, s;
    }, (n) => {
      if (this._engine.isDisposed || this._engine.uniqueId !== r)
        return 0;
      throw n;
    });
  }
  dispose() {
    this._querySet.destroy(), this._bufferManager.releaseBuffer(this._queryBuffer);
    for (let e = 0; e < this._dstBuffers.length; ++e)
      this._bufferManager.releaseBuffer(this._dstBuffers[e]);
  }
}
class Or {
  get gpuFrameTimeCounter() {
    return this._gpuFrameTimeCounter;
  }
  constructor(e, t, r) {
    this._enabled = !1, this._gpuFrameTimeCounter = new dt(), this._measureDurationState = 0, this._engine = e, this._device = t, this._bufferManager = r;
  }
  get enable() {
    return this._enabled;
  }
  set enable(e) {
    if (this._enabled !== e)
      if (this._enabled = e, this._measureDurationState = 0, e)
        try {
          this._measureDuration = new Vr(this._engine, this._device, this._bufferManager, 2e3, "QuerySet_TimestampQuery");
        } catch (t) {
          this._enabled = !1, y.Error(`Could not create a WebGPUDurationMeasure!
Error: ` + t.message + `
Make sure timestamp query is supported and enabled in your browser.`);
          return;
        }
      else
        this._measureDuration.dispose();
  }
  startFrame(e) {
    this._enabled && this._measureDurationState === 0 && (this._measureDuration.start(e), this._measureDurationState = 1);
  }
  endFrame(e) {
    this._measureDurationState === 1 && (this._measureDurationState = 2, this._measureDuration.stop(e).then((t) => {
      t !== null && t >= 0 && (this._gpuFrameTimeCounter.fetchNewFrame(), this._gpuFrameTimeCounter.addCount(t, !0)), this._measureDurationState = 0;
    }));
  }
  startPass(e, t) {
    this._enabled ? this._measureDuration.startPass(e, t) : e.timestampWrites = void 0;
  }
  endPass(e, t) {
    if (!this._enabled || !t)
      return;
    const r = this._engine.frameId;
    this._measureDuration.stopPass(e).then((n) => {
      t._addDuration(r, n !== null && n > 0 ? n : 0);
    });
  }
  dispose() {
    this._measureDuration?.dispose();
  }
}
class Vr {
  constructor(e, t, r, n = 2, s) {
    this._count = n, this._querySet = new mt(e, n, Ae.Timestamp, t, r, !0, s);
  }
  start(e) {
    e.writeTimestamp?.(this._querySet.querySet, 0);
  }
  async stop(e) {
    return e.writeTimestamp?.(this._querySet.querySet, 1), e.writeTimestamp ? this._querySet.readTwoValuesAndSubtract(0) : 0;
  }
  startPass(e, t) {
    if (t + 3 > this._count)
      throw new Error("WebGPUDurationMeasure: index out of range (" + t + ")");
    e.timestampWrites = {
      querySet: this._querySet.querySet,
      beginningOfPassWriteIndex: t + 2,
      endOfPassWriteIndex: t + 3
    };
  }
  async stopPass(e) {
    return this._querySet.readTwoValuesAndSubtract(e + 2);
  }
  dispose() {
    this._querySet.dispose();
  }
}
class $r {
  get querySet() {
    return this._querySet.querySet;
  }
  get hasQueries() {
    return this._currentTotalIndices !== this._availableIndices.length;
  }
  canBeginQuery(e) {
    if (this._frameQuerySetIsDirty === this._engine.frameId || this._queryFrameId[e] === this._engine.frameId)
      return !1;
    const t = this._engine._getCurrentRenderPassWrapper().renderPassDescriptor.occlusionQuerySet !== void 0;
    return t && (this._queryFrameId[e] = this._engine.frameId), t;
  }
  constructor(e, t, r, n = 50, s = 100) {
    this._availableIndices = [], this._frameQuerySetIsDirty = -1, this._queryFrameId = [], this._engine = e, this._device = t, this._bufferManager = r, this._frameLastBuffer = -1, this._currentTotalIndices = 0, this._countIncrement = s, this._allocateNewIndices(n);
  }
  createQuery() {
    this._availableIndices.length === 0 && this._allocateNewIndices();
    const e = this._availableIndices[this._availableIndices.length - 1];
    return this._availableIndices.length--, e;
  }
  deleteQuery(e) {
    this._availableIndices[this._availableIndices.length] = e;
  }
  isQueryResultAvailable(e) {
    return this._retrieveQueryBuffer(), !!this._lastBuffer && e < this._lastBuffer.length;
  }
  getQueryResult(e) {
    return Number(this._lastBuffer?.[e] ?? -1);
  }
  _retrieveQueryBuffer() {
    this._lastBuffer && this._frameLastBuffer === this._engine.frameId || this._frameLastBuffer !== this._engine.frameId && (this._frameLastBuffer = this._engine.frameId, this._querySet.readValues(0, this._currentTotalIndices).then((e) => {
      this._lastBuffer = e;
    }));
  }
  _allocateNewIndices(e) {
    e = e ?? this._countIncrement, this._delayQuerySetDispose();
    for (let t = 0; t < e; ++t)
      this._availableIndices.push(this._currentTotalIndices + t);
    this._currentTotalIndices += e, this._querySet = new mt(this._engine, this._currentTotalIndices, Ae.Occlusion, this._device, this._bufferManager, !1, "QuerySet_OcclusionQuery_count_" + this._currentTotalIndices), this._frameQuerySetIsDirty = this._engine.frameId;
  }
  _delayQuerySetDispose() {
    const e = this._querySet;
    e && setTimeout(() => e.dispose, 1e3);
  }
  dispose() {
    this._querySet?.dispose(), this._availableIndices.length = 0;
  }
}
class Le {
  /** Gets the code after the inlining process */
  get code() {
    return this._sourceCode;
  }
  /**
   * Initializes the inliner
   * @param sourceCode shader code source to inline
   * @param numMaxIterations maximum number of iterations (used to detect recursive calls)
   */
  constructor(e, t = 20) {
    this.debug = !1, this._sourceCode = e, this._numMaxIterations = t, this._functionDescr = [], this.inlineToken = "#define inline";
  }
  /**
   * Start the processing of the shader code
   */
  processCode() {
    this.debug && y.Log(`Start inlining process (code size=${this._sourceCode.length})...`), this._collectFunctions(), this._processInlining(this._numMaxIterations), this.debug && y.Log("End of inlining process.");
  }
  _collectFunctions() {
    let e = 0;
    for (; e < this._sourceCode.length; ) {
      const t = this._sourceCode.indexOf(this.inlineToken, e);
      if (t < 0)
        break;
      const r = this._sourceCode.indexOf("(", t + this.inlineToken.length);
      if (r < 0) {
        this.debug && y.Warn(`Could not find the opening parenthesis after the token. startIndex=${e}`), e = t + this.inlineToken.length;
        continue;
      }
      const n = Le._RegexpFindFunctionNameAndType.exec(this._sourceCode.substring(t + this.inlineToken.length, r));
      if (!n) {
        this.debug && y.Warn(`Could not extract the name/type of the function from: ${this._sourceCode.substring(t + this.inlineToken.length, r)}`), e = t + this.inlineToken.length;
        continue;
      }
      const [s, o] = [n[3], n[4]], u = be("(", ")", this._sourceCode, r);
      if (u < 0) {
        this.debug && y.Warn(`Could not extract the parameters the function '${o}' (type=${s}). funcParamsStartIndex=${r}`), e = t + this.inlineToken.length;
        continue;
      }
      const l = this._sourceCode.substring(r + 1, u), c = at(this._sourceCode, u + 1);
      if (c === this._sourceCode.length) {
        this.debug && y.Warn(`Could not extract the body of the function '${o}' (type=${s}). funcParamsEndIndex=${u}`), e = t + this.inlineToken.length;
        continue;
      }
      const h = be("{", "}", this._sourceCode, c);
      if (h < 0) {
        this.debug && y.Warn(`Could not extract the body of the function '${o}' (type=${s}). funcBodyStartIndex=${c}`), e = t + this.inlineToken.length;
        continue;
      }
      const d = this._sourceCode.substring(c, h + 1), f = Ne(l).split(","), _ = [];
      for (let p = 0; p < f.length; ++p) {
        const x = f[p].trim(), S = x.lastIndexOf(" ");
        S >= 0 && _.push(x.substring(S + 1));
      }
      s !== "void" && _.push("return"), this._functionDescr.push({
        name: o,
        type: s,
        parameters: _,
        body: d,
        callIndex: 0
      }), e = h + 1;
      const m = t > 0 ? this._sourceCode.substring(0, t) : "", g = h + 1 < this._sourceCode.length - 1 ? this._sourceCode.substring(h + 1) : "";
      this._sourceCode = m + g, e -= h + 1 - t;
    }
    this.debug && y.Log(`Collect functions: ${this._functionDescr.length} functions found. functionDescr=${this._functionDescr}`);
  }
  _processInlining(e = 20) {
    for (; e-- >= 0 && this._replaceFunctionCallsByCode(); )
      ;
    return this.debug && y.Log(`numMaxIterations is ${e} after inlining process`), e >= 0;
  }
  _replaceFunctionCallsByCode() {
    let e = !1;
    for (const t of this._functionDescr) {
      const { name: r, type: n, parameters: s, body: o } = t;
      let u = 0;
      for (; u < this._sourceCode.length; ) {
        const l = this._sourceCode.indexOf(r, u);
        if (l < 0)
          break;
        if (l === 0 || De(this._sourceCode.charAt(l - 1))) {
          u = l + r.length;
          continue;
        }
        const c = at(this._sourceCode, l + r.length);
        if (c === this._sourceCode.length || this._sourceCode.charAt(c) !== "(") {
          u = l + r.length;
          continue;
        }
        const h = be("(", ")", this._sourceCode, c);
        if (h < 0) {
          this.debug && y.Warn(`Could not extract the parameters of the function call. Function '${r}' (type=${n}). callParamsStartIndex=${c}`), u = l + r.length;
          continue;
        }
        const d = this._sourceCode.substring(c + 1, h), _ = ((b) => {
          const v = [];
          let R = 0, G = 0;
          for (; R < b.length; ) {
            if (b.charAt(R) === "(") {
              const P = be("(", ")", b, R);
              if (P < 0)
                return null;
              R = P;
            } else b.charAt(R) === "," && (v.push(b.substring(G, R)), G = R + 1);
            R++;
          }
          return G < R && v.push(b.substring(G, R)), v;
        })(Ne(d));
        if (_ === null) {
          this.debug && y.Warn(`Invalid function call: can't extract the parameters of the function call. Function '${r}' (type=${n}). callParamsStartIndex=${c}, callParams=` + d), u = l + r.length;
          continue;
        }
        const m = [];
        for (let b = 0; b < _.length; ++b) {
          const v = _[b].trim();
          m.push(v);
        }
        const g = n !== "void" ? r + "_" + t.callIndex++ : null;
        if (g && m.push(g + " ="), m.length !== s.length) {
          this.debug && y.Warn(`Invalid function call: not the same number of parameters for the call than the number expected by the function. Function '${r}' (type=${n}). function parameters=${s}, call parameters=${m}`), u = l + r.length;
          continue;
        }
        u = h + 1;
        const p = this._replaceNames(o, s, m);
        let x = l > 0 ? this._sourceCode.substring(0, l) : "";
        const S = h + 1 < this._sourceCode.length - 1 ? this._sourceCode.substring(h + 1) : "";
        if (g) {
          const b = Et(this._sourceCode, l - 1, `
`, "{");
          x = this._sourceCode.substring(0, b + 1);
          const v = this._sourceCode.substring(b + 1, l);
          this._sourceCode = x + n + " " + g + `;
` + p + `
` + v + g + S, this.debug && y.Log(`Replace function call by code. Function '${r}' (type=${n}). injectDeclarationIndex=${b}, call parameters=${m}`);
        } else
          this._sourceCode = x + p + S, u += p.length - (h + 1 - l), this.debug && y.Log(`Replace function call by code. Function '${r}' (type=${n}). functionCallIndex=${l}, call parameters=${m}`);
        e = !0;
      }
    }
    return e;
  }
  _replaceNames(e, t, r) {
    for (let n = 0; n < t.length; ++n) {
      const s = new RegExp(Ut(t[n]), "g"), o = t[n].length, u = r[n];
      e = e.replace(s, (l, ...c) => {
        const h = c[0];
        return De(e.charAt(h - 1)) || De(e.charAt(h + o)) ? t[n] : u;
      });
    }
    return e;
  }
}
Le._RegexpFindFunctionNameAndType = /((\s+?)(\w+)\s+(\w+)\s*?)$/;
class q {
  async initTwgsl(e) {
    if (!q._Twgsl)
      return e = e || {}, e = {
        ...q._TWgslDefaultOptions,
        ...e
      }, e.twgsl ? (q._Twgsl = e.twgsl, Promise.resolve()) : (e.jsPath && e.wasmPath && await oe.LoadBabylonScriptAsync(e.jsPath), self.twgsl ? (q._Twgsl = await self.twgsl(oe.GetBabylonScriptURL(e.wasmPath)), Promise.resolve()) : Promise.reject("twgsl is not available."));
  }
  convertSpirV2WGSL(e, t = !1) {
    const r = q._Twgsl.convertSpirV2WGSL(e, q.DisableUniformityAnalysis || t);
    return q.ShowWGSLShaderCode && (y.Log(r), y.Log("***********************************************")), q.DisableUniformityAnalysis || t ? `diagnostic(off, derivative_uniformity);
` + r : r;
  }
}
q._TWgslDefaultOptions = {
  jsPath: `${oe._DefaultCdnUrl}/twgsl/twgsl.js`,
  wasmPath: `${oe._DefaultCdnUrl}/twgsl/twgsl.wasm`
};
q.ShowWGSLShaderCode = !1;
q.DisableUniformityAnalysis = !1;
q._Twgsl = null;
class Wr {
  constructor(e, t, r) {
    this._record = !1, this._play = !1, this._playBundleListIndex = 0, this._allBundleLists = [], this._enabled = !1, this._engine = e, this._mode = t, this._bundleList = r;
  }
  get enabled() {
    return this._enabled;
  }
  get play() {
    return this._play;
  }
  get record() {
    return this._record;
  }
  set enabled(e) {
    this._allBundleLists.length = 0, this._record = this._enabled = e, this._play = !1, e && (this._modeSaved = this._mode, this._mode = 0);
  }
  get mode() {
    return this._mode;
  }
  set mode(e) {
    this._record ? this._modeSaved = e : this._mode = e;
  }
  endRenderPass(e) {
    if (!this._record && !this._play)
      return !1;
    let t;
    if (this._record)
      t = this._bundleList.clone(), this._allBundleLists.push(t), this._bundleList.reset();
    else {
      if (this._playBundleListIndex >= this._allBundleLists.length)
        throw new Error(`Invalid playBundleListIndex! Your snapshot is no longer valid for the current frame, you should recreate a new one. playBundleListIndex=${this._playBundleListIndex}, allBundleLists.length=${this._allBundleLists.length}}`);
      t = this._allBundleLists[this._playBundleListIndex++];
    }
    return t.run(e), this._mode === 1 && this._engine._reportDrawCall(t.numDrawCalls), !0;
  }
  endFrame() {
    this._record && (this._record = !1, this._play = !0, this._mode = this._modeSaved), this._playBundleListIndex = 0;
  }
  reset() {
    this.enabled = !1, this.enabled = !0;
  }
}
const _e = (() => {
  const a = new Uint8Array(4), e = new Uint32Array(a.buffer);
  return !!((e[0] = 1) & a[0]);
})();
Object.defineProperty(C.prototype, "effectiveByteStride", {
  get: function() {
    return this._alignedBuffer && this._alignedBuffer.byteStride || this.byteStride;
  },
  enumerable: !0,
  configurable: !0
});
Object.defineProperty(C.prototype, "effectiveByteOffset", {
  get: function() {
    return this._alignedBuffer ? 0 : this.byteOffset;
  },
  enumerable: !0,
  configurable: !0
});
Object.defineProperty(C.prototype, "effectiveBuffer", {
  get: function() {
    return this._alignedBuffer && this._alignedBuffer.getBuffer() || this._buffer.getBuffer();
  },
  enumerable: !0,
  configurable: !0
});
C.prototype._rebuild = function() {
  this._buffer?._rebuild(), this._alignedBuffer?._rebuild();
};
C.prototype.dispose = function() {
  this._ownsBuffer && this._buffer.dispose(), this._alignedBuffer?.dispose(), this._alignedBuffer = void 0, this._isDisposed = !0;
};
C.prototype.getWrapperBuffer = function() {
  return this._alignedBuffer || this._buffer;
};
C.prototype._alignBuffer = function() {
  const a = this._buffer.getData();
  if (!this.engine._features.forceVertexBufferStrideAndOffsetMultiple4Bytes || this.byteStride % 4 === 0 && this.byteOffset % 4 === 0 || !a)
    return;
  const e = C.GetTypeByteLength(this.type), t = this.byteStride + 3 & -4, r = t / e, n = this._maxVerticesCount, o = n * t / e;
  let u;
  if (Array.isArray(a)) {
    const d = new Float32Array(a);
    u = new DataView(d.buffer, d.byteOffset, d.byteLength);
  } else a instanceof ArrayBuffer ? u = new DataView(a, 0, a.byteLength) : u = new DataView(a.buffer, a.byteOffset, a.byteLength);
  let l;
  this.type === C.BYTE ? l = new Int8Array(o) : this.type === C.UNSIGNED_BYTE ? l = new Uint8Array(o) : this.type === C.SHORT ? l = new Int16Array(o) : this.type === C.UNSIGNED_SHORT ? l = new Uint16Array(o) : this.type === C.INT ? l = new Int32Array(o) : this.type === C.UNSIGNED_INT ? l = new Uint32Array(o) : l = new Float32Array(o);
  const c = this.getSize();
  let h = this.byteOffset;
  for (let d = 0; d < n; ++d) {
    for (let f = 0; f < c; ++f)
      switch (this.type) {
        case C.BYTE:
          l[d * r + f] = u.getInt8(h + f);
          break;
        case C.UNSIGNED_BYTE:
          l[d * r + f] = u.getUint8(h + f);
          break;
        case C.SHORT:
          l[d * r + f] = u.getInt16(h + f * 2, _e);
          break;
        case C.UNSIGNED_SHORT:
          l[d * r + f] = u.getUint16(h + f * 2, _e);
          break;
        case C.INT:
          l[d * r + f] = u.getInt32(h + f * 4, _e);
          break;
        case C.UNSIGNED_INT:
          l[d * r + f] = u.getUint32(h + f * 4, _e);
          break;
        case C.FLOAT:
          l[d * r + f] = u.getFloat32(h + f * 4, _e);
          break;
      }
    h += this.byteStride;
  }
  this._alignedBuffer?.dispose(), this._alignedBuffer = new Bt(this.engine, l, !1, t, !1, this.getIsInstanced(), !0, this.instanceDivisor, (this._label ?? "VertexBuffer") + "_aligned");
};
const kr = "postprocessVertexShader", qr = `attribute position: vec2<f32>;uniform scale: vec2<f32>;varying vUV: vec2<f32>;const madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.vUV=(vertexInputs.position*madd+madd)*uniforms.scale;vertexOutputs.position=vec4(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}
`;
V.ShadersStoreWGSL[kr] = qr;
class Hr {
  constructor() {
    this._gpuTimeInFrameId = -1, this.counter = new dt();
  }
  /**
   * @internal
   */
  _addDuration(e, t) {
    e < this._gpuTimeInFrameId || (this._gpuTimeInFrameId !== e ? (this.counter._fetchResult(), this.counter.fetchNewFrame(), this.counter.addCount(t, !1), this._gpuTimeInFrameId = e) : this.counter.addCount(t, !1));
  }
}
const lt = {
  label: "TextureView_SwapChain_ResolveTarget",
  dimension: X.E2d,
  format: void 0,
  mipLevelCount: 1,
  arrayLayerCount: 1
}, ct = {
  label: "TextureView_SwapChain",
  dimension: X.E2d,
  format: void 0,
  mipLevelCount: 1,
  arrayLayerCount: 1
}, ye = "/* disable_uniformity_analysis */", zr = new Pe();
class re extends Qe {
  /**
   * Gets or sets the snapshot rendering mode
   */
  get snapshotRenderingMode() {
    return this._snapshotRendering.mode;
  }
  set snapshotRenderingMode(e) {
    this._snapshotRendering.mode = e;
  }
  /**
   * Creates a new snapshot at the next frame using the current snapshotRenderingMode
   */
  snapshotRenderingReset() {
    this._snapshotRendering.reset();
  }
  /**
   * Enables or disables the snapshot rendering mode
   * Note that the WebGL engine does not support snapshot rendering so setting the value won't have any effect for this engine
   */
  get snapshotRendering() {
    return this._snapshotRendering.enabled;
  }
  set snapshotRendering(e) {
    this._snapshotRendering.enabled = e;
  }
  /**
   * Sets this to true to disable the cache for the samplers. You should do it only for testing purpose!
   */
  get disableCacheSamplers() {
    return this._cacheSampler ? this._cacheSampler.disabled : !1;
  }
  set disableCacheSamplers(e) {
    this._cacheSampler && (this._cacheSampler.disabled = e);
  }
  /**
   * Sets this to true to disable the cache for the render pipelines. You should do it only for testing purpose!
   */
  get disableCacheRenderPipelines() {
    return this._cacheRenderPipeline ? this._cacheRenderPipeline.disabled : !1;
  }
  set disableCacheRenderPipelines(e) {
    this._cacheRenderPipeline && (this._cacheRenderPipeline.disabled = e);
  }
  /**
   * Sets this to true to disable the cache for the bind groups. You should do it only for testing purpose!
   */
  get disableCacheBindGroups() {
    return this._cacheBindGroups ? this._cacheBindGroups.disabled : !1;
  }
  set disableCacheBindGroups(e) {
    this._cacheBindGroups && (this._cacheBindGroups.disabled = e);
  }
  /**
   * Gets a Promise<boolean> indicating if the engine can be instantiated (ie. if a WebGPU context can be found)
   */
  static get IsSupportedAsync() {
    return navigator.gpu ? navigator.gpu.requestAdapter().then((e) => !!e, () => !1).catch(() => !1) : Promise.resolve(!1);
  }
  /**
   * Not supported by WebGPU, you should call IsSupportedAsync instead!
   */
  static get IsSupported() {
    return y.Warn("You must call IsSupportedAsync for WebGPU!"), !1;
  }
  /**
   * Gets a boolean indicating that the engine supports uniform buffers
   */
  get supportsUniformBuffers() {
    return !0;
  }
  /** Gets the supported extensions by the WebGPU adapter */
  get supportedExtensions() {
    return this._adapterSupportedExtensions;
  }
  /** Gets the currently enabled extensions on the WebGPU device */
  get enabledExtensions() {
    return this._deviceEnabledExtensions;
  }
  /** Gets the supported limits by the WebGPU adapter */
  get supportedLimits() {
    return this._adapterSupportedLimits;
  }
  /** Gets the current limits of the WebGPU device */
  get currentLimits() {
    return this._deviceLimits;
  }
  /**
   * Returns a string describing the current engine
   */
  get description() {
    return this.name + this.version;
  }
  /**
   * Returns the version of the engine
   */
  get version() {
    return 1;
  }
  /**
   * Gets an object containing information about the current engine context
   * @returns an object containing the vendor, the renderer and the version of the current engine context
   */
  getInfo() {
    return {
      vendor: this._adapterInfo.vendor || "unknown vendor",
      renderer: this._adapterInfo.architecture || "unknown renderer",
      version: this._adapterInfo.description || "unknown version"
    };
  }
  /**
   * (WebGPU only) True (default) to be in compatibility mode, meaning rendering all existing scenes without artifacts (same rendering than WebGL).
   * Setting the property to false will improve performances but may not work in some scenes if some precautions are not taken.
   * See https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode for more details
   */
  get compatibilityMode() {
    return this._compatibilityMode;
  }
  set compatibilityMode(e) {
    this._compatibilityMode = e;
  }
  /**
   * Enables or disables GPU timing measurements.
   * Note that this is only supported if the "timestamp-query" extension is enabled in the options.
   */
  get enableGPUTimingMeasurements() {
    return this._timestampQuery.enable;
  }
  set enableGPUTimingMeasurements(e) {
    this._timestampQuery.enable !== e && (this.gpuTimeInFrameForMainPass = e ? new Hr() : void 0, this._timestampQuery.enable = e);
  }
  /** @internal */
  get currentSampleCount() {
    return this._currentRenderTarget ? this._currentRenderTarget.samples : this._mainPassSampleCount;
  }
  /**
   * Create a new instance of the gpu engine asynchronously
   * @param canvas Defines the canvas to use to display the result
   * @param options Defines the options passed to the engine to create the GPU context dependencies
   * @returns a promise that resolves with the created engine
   */
  static CreateAsync(e, t = {}) {
    const r = new re(e, t);
    return new Promise((n) => {
      r.initAsync(t.glslangOptions, t.twgslOptions).then(() => n(r));
    });
  }
  /**
   * Create a new instance of the gpu engine.
   * @param canvas Defines the canvas to use to display the result
   * @param options Defines the options passed to the engine to create the GPU context dependencies
   */
  constructor(e, t = {}) {
    if (super(null, t.antialias ?? !0, t), this.uniqueId = -1, this._uploadEncoderDescriptor = { label: "upload" }, this._renderEncoderDescriptor = { label: "render" }, this._clearDepthValue = 1, this._clearReverseDepthValue = 0, this._clearStencilValue = 0, this._defaultSampleCount = 4, this._glslang = null, this._tintWASM = null, this._adapterInfo = {
      vendor: "",
      architecture: "",
      device: "",
      description: ""
    }, this._timestampIndex = 0, this._compiledComputeEffects = {}, this._counters = {
      numEnableEffects: 0,
      numEnableDrawWrapper: 0,
      numBundleCreationNonCompatMode: 0,
      numBundleReuseNonCompatMode: 0
    }, this.countersLastFrame = {
      numEnableEffects: 0,
      numEnableDrawWrapper: 0,
      numBundleCreationNonCompatMode: 0,
      numBundleReuseNonCompatMode: 0
    }, this.numMaxUncapturedErrors = 20, this._commandBuffers = [null, null], this._currentRenderPass = null, this._mainRenderPassWrapper = {
      renderPassDescriptor: null,
      colorAttachmentViewDescriptor: null,
      depthAttachmentViewDescriptor: null,
      colorAttachmentGPUTextures: [],
      depthTextureFormat: void 0
    }, this._rttRenderPassWrapper = {
      renderPassDescriptor: null,
      colorAttachmentViewDescriptor: null,
      depthAttachmentViewDescriptor: null,
      colorAttachmentGPUTextures: [],
      depthTextureFormat: void 0
    }, this._pendingDebugCommands = [], this._currentOverrideVertexBuffers = null, this._currentIndexBuffer = null, this._colorWriteLocal = !0, this._forceEnableEffect = !1, this.dbgShowShaderCode = !1, this.dbgSanityChecks = !0, this.dbgVerboseLogsForFirstFrames = !1, this.dbgVerboseLogsNumFrames = 10, this.dbgLogIfNotDrawWrapper = !0, this.dbgShowEmptyEnableEffectCalls = !0, this.isNDCHalfZRange = !0, this.hasOriginBottomLeft = !1, this._viewportsCurrent = { x: 0, y: 0, w: 0, h: 0 }, this._scissorsCurrent = { x: 0, y: 0, w: 0, h: 0 }, this._scissorCached = { x: 0, y: 0, z: 0, w: 0 }, this._stencilRefsCurrent = -1, this._blendColorsCurrent = [null, null, null, null], this._name = "WebGPU", t.deviceDescriptor = t.deviceDescriptor || {}, t.enableGPUDebugMarkers = t.enableGPUDebugMarkers ?? !1, y.Log(`Babylon.js v${Qe.Version} - ${this.description} engine`), !navigator.gpu) {
      y.Error("WebGPU is not supported by your browser.");
      return;
    }
    t.swapChainFormat = t.swapChainFormat || navigator.gpu.getPreferredCanvasFormat(), this._isWebGPU = !0, this._shaderPlatformName = "WEBGPU", this._renderingCanvas = e, this._options = t, this._mainPassSampleCount = t.antialias ? this._defaultSampleCount : 1, this._setupMobileChecks(), this._sharedInit(this._renderingCanvas), this._shaderProcessor = new Gt(), this._shaderProcessorWGSL = new pr();
  }
  //------------------------------------------------------------------------------
  //                              Initialization
  //------------------------------------------------------------------------------
  /**
   * Initializes the WebGPU context and dependencies.
   * @param glslangOptions Defines the GLSLang compiler options if necessary
   * @param twgslOptions Defines the Twgsl compiler options if necessary
   * @returns a promise notifying the readiness of the engine.
   */
  initAsync(e, t) {
    return this.uniqueId = re._InstanceId++, this._glslangOptions = e, this._twgslOptions = t, this._initGlslang(e ?? this._options?.glslangOptions).then((r) => (this._glslang = r, this._tintWASM = re.UseTWGSL ? new q() : null, this._tintWASM ? this._tintWASM.initTwgsl(t ?? this._options?.twgslOptions).then(() => navigator.gpu.requestAdapter(this._options)) : navigator.gpu.requestAdapter(this._options))).then((r) => {
      if (r) {
        this._adapter = r, this._adapterSupportedExtensions = [], this._adapter.features?.forEach((o) => this._adapterSupportedExtensions.push(o)), this._adapterSupportedLimits = this._adapter.limits, this._adapter.requestAdapterInfo().then((o) => {
          this._adapterInfo = o;
        });
        const n = this._options.deviceDescriptor ?? {}, s = n?.requiredFeatures ?? (this._options.enableAllFeatures ? this._adapterSupportedExtensions : void 0);
        if (s) {
          const o = s, u = [];
          for (const l of o)
            this._adapterSupportedExtensions.indexOf(l) !== -1 && u.push(l);
          n.requiredFeatures = u;
        }
        if (this._options.setMaximumLimits && !n.requiredLimits) {
          n.requiredLimits = {};
          for (const o in this._adapterSupportedLimits)
            o === "minSubgroupSize" || o === "maxSubgroupSize" || (n.requiredLimits[o] = this._adapterSupportedLimits[o]);
        }
        return n.label = `BabylonWebGPUDevice${this.uniqueId}`, this._adapter.requestDevice(n);
      } else
        throw "Could not retrieve a WebGPU adapter (adapter is null).";
    }).then((r) => {
      this._device = r, this._deviceEnabledExtensions = [], this._device.features?.forEach((s) => this._deviceEnabledExtensions.push(s)), this._deviceLimits = r.limits;
      let n = -1;
      this._device.addEventListener("uncapturederror", (s) => {
        ++n < this.numMaxUncapturedErrors ? y.Warn(`WebGPU uncaptured error (${n + 1}): ${s.error} - ${s.error.message}`) : n++ === this.numMaxUncapturedErrors && y.Warn(`WebGPU uncaptured error: too many warnings (${this.numMaxUncapturedErrors}), no more warnings will be reported to the console for this engine.`);
      }), this._doNotHandleContextLost || this._device.lost?.then((s) => {
        this._isDisposed || (this._contextWasLost = !0, y.Warn("WebGPU context lost. " + s), this.onContextLostObservable.notifyObservers(this), this._restoreEngineAfterContextLost(async () => {
          const o = this.snapshotRenderingMode, u = this.snapshotRendering, l = this.disableCacheSamplers, c = this.disableCacheRenderPipelines, h = this.disableCacheBindGroups, d = this.enableGPUTimingMeasurements;
          await this.initAsync(this._glslangOptions ?? this._options?.glslangOptions, this._twgslOptions ?? this._options?.twgslOptions), this.snapshotRenderingMode = o, this.snapshotRendering = u, this.disableCacheSamplers = l, this.disableCacheRenderPipelines = c, this.disableCacheBindGroups = h, this.enableGPUTimingMeasurements = d, this._currentRenderPass = null;
        }));
      });
    }).then(() => {
      this._bufferManager = new we(this, this._device), this._textureHelper = new Ir(this, this._device, this._glslang, this._tintWASM, this._bufferManager, this._deviceEnabledExtensions), this._cacheSampler = new ce(this._device), this._cacheBindGroups = new A(this._device, this._cacheSampler, this), this._timestampQuery = new Or(this, this._device, this._bufferManager), this._occlusionQuery = this._device.createQuerySet ? new $r(this, this._device, this._bufferManager) : void 0, this._bundleList = new qe(this._device), this._snapshotRendering = new Wr(this, this._snapshotRenderingMode, this._bundleList), this._ubInvertY = this._bufferManager.createBuffer(new Float32Array([-1, 0]), w.Uniform | w.CopyDst, "UBInvertY"), this._ubDontInvertY = this._bufferManager.createBuffer(new Float32Array([1, 0]), w.Uniform | w.CopyDst, "UBDontInvertY"), this.dbgVerboseLogsForFirstFrames && this._count === void 0 && (this._count = 0, y.Log(["%c frame #" + this._count + " - begin", "background: #ffff00"])), this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor), this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor), this._initializeLimits(), this._emptyVertexBuffer = new C(this, [0], "", {
        stride: 1,
        offset: 0,
        size: 1,
        label: "EmptyVertexBuffer"
      }), this._cacheRenderPipeline = new J(this._device, this._emptyVertexBuffer), this._depthCullingState = new Ur(this._cacheRenderPipeline), this._stencilStateComposer = new Er(this._cacheRenderPipeline), this._stencilStateComposer.stencilGlobal = this._stencilState, this._depthCullingState.depthTest = !0, this._depthCullingState.depthFunc = 515, this._depthCullingState.depthMask = !0, this._textureHelper.setCommandEncoder(this._uploadEncoder), this._clearQuad = new Nr(this._device, this, this._emptyVertexBuffer), this._defaultDrawContext = this.createDrawContext(), this._currentDrawContext = this._defaultDrawContext, this._defaultMaterialContext = this.createMaterialContext(), this._currentMaterialContext = this._defaultMaterialContext, this._initializeContextAndSwapChain(), this._initializeMainAttachments(), this.resize();
    }).catch((r) => {
      throw y.Error("A fatal error occurred during WebGPU creation/initialization."), r;
    });
  }
  _initGlslang(e) {
    return e = e || {}, e = {
      ...re._GLSLslangDefaultOptions,
      ...e
    }, e.glslang ? Promise.resolve(e.glslang) : self.glslang ? self.glslang(e.wasmPath) : e.jsPath && e.wasmPath ? oe.LoadBabylonScriptAsync(e.jsPath).then(() => self.glslang(oe.GetBabylonScriptURL(e.wasmPath))) : Promise.reject("gslang is not available.");
  }
  _initializeLimits() {
    this._caps = {
      maxTexturesImageUnits: this._deviceLimits.maxSampledTexturesPerShaderStage,
      maxVertexTextureImageUnits: this._deviceLimits.maxSampledTexturesPerShaderStage,
      maxCombinedTexturesImageUnits: this._deviceLimits.maxSampledTexturesPerShaderStage * 2,
      maxTextureSize: this._deviceLimits.maxTextureDimension2D,
      maxCubemapTextureSize: this._deviceLimits.maxTextureDimension2D,
      maxRenderTextureSize: this._deviceLimits.maxTextureDimension2D,
      maxVertexAttribs: this._deviceLimits.maxVertexAttributes,
      maxVaryingVectors: this._deviceLimits.maxInterStageShaderVariables,
      maxFragmentUniformVectors: Math.floor(this._deviceLimits.maxUniformBufferBindingSize / 4),
      maxVertexUniformVectors: Math.floor(this._deviceLimits.maxUniformBufferBindingSize / 4),
      standardDerivatives: !0,
      astc: this._deviceEnabledExtensions.indexOf(ee.TextureCompressionASTC) >= 0 ? !0 : void 0,
      s3tc: this._deviceEnabledExtensions.indexOf(ee.TextureCompressionBC) >= 0 ? !0 : void 0,
      pvrtc: null,
      etc1: null,
      etc2: this._deviceEnabledExtensions.indexOf(ee.TextureCompressionETC2) >= 0 ? !0 : void 0,
      bptc: this._deviceEnabledExtensions.indexOf(ee.TextureCompressionBC) >= 0 ? !0 : void 0,
      maxAnisotropy: 16,
      uintIndices: !0,
      fragmentDepthSupported: !0,
      highPrecisionShaderSupported: !0,
      colorBufferFloat: !0,
      supportFloatTexturesResolve: !1,
      rg11b10ufColorRenderable: this._deviceEnabledExtensions.indexOf(ee.RG11B10UFloatRenderable) >= 0,
      textureFloat: !0,
      textureFloatLinearFiltering: this._deviceEnabledExtensions.indexOf(ee.Float32Filterable) >= 0,
      textureFloatRender: !0,
      textureHalfFloat: !0,
      textureHalfFloatLinearFiltering: !0,
      textureHalfFloatRender: !0,
      textureLOD: !0,
      texelFetch: !0,
      drawBuffersExtension: !0,
      depthTextureExtension: !0,
      vertexArrayObject: !1,
      instancedArrays: !0,
      timerQuery: typeof BigUint64Array < "u" && this._deviceEnabledExtensions.indexOf(ee.TimestampQuery) !== -1 ? !0 : void 0,
      supportOcclusionQuery: typeof BigUint64Array < "u",
      canUseTimestampForTimerQuery: !0,
      multiview: !1,
      oculusMultiview: !1,
      parallelShaderCompile: void 0,
      blendMinMax: !0,
      maxMSAASamples: 4,
      canUseGLInstanceID: !0,
      canUseGLVertexID: !0,
      supportComputeShaders: !0,
      supportSRGBBuffers: !0,
      supportTransformFeedbacks: !1,
      textureMaxLevel: !0,
      texture2DArrayMaxLayerCount: this._deviceLimits.maxTextureArrayLayers,
      disableMorphTargetTexture: !1
    }, this._features = {
      forceBitmapOverHTMLImageElement: !0,
      supportRenderAndCopyToLodForFloatTextures: !0,
      supportDepthStencilTexture: !0,
      supportShadowSamplers: !0,
      uniformBufferHardCheckMatrix: !1,
      allowTexturePrefiltering: !0,
      trackUbosInFrame: !0,
      checkUbosContentBeforeUpload: !0,
      supportCSM: !0,
      basisNeedsPOT: !1,
      support3DTextures: !0,
      needTypeSuffixInShaderConstants: !0,
      supportMSAA: !0,
      supportSSAO2: !0,
      supportExtendedTextureFormats: !0,
      supportSwitchCaseInShader: !0,
      supportSyncTextureRead: !1,
      needsInvertingBitmap: !1,
      useUBOBindingCache: !1,
      needShaderCodeInlining: !0,
      needToAlwaysBindUniformBuffers: !0,
      supportRenderPasses: !0,
      supportSpriteInstancing: !0,
      forceVertexBufferStrideAndOffsetMultiple4Bytes: !0,
      _collectUbosUpdatedInFrame: !1
    };
  }
  _initializeContextAndSwapChain() {
    if (!this._renderingCanvas)
      throw "The rendering canvas has not been set!";
    this._context = this._renderingCanvas.getContext("webgpu"), this._configureContext(), this._colorFormat = this._options.swapChainFormat, this._mainRenderPassWrapper.colorAttachmentGPUTextures = [new Be()], this._mainRenderPassWrapper.colorAttachmentGPUTextures[0].format = this._colorFormat, this._setColorFormat(this._mainRenderPassWrapper);
  }
  // Set default values as WebGL with depth and stencil attachment for the broadest Compat.
  _initializeMainAttachments() {
    if (!this._bufferManager)
      return;
    this.flushFramebuffer(), this._mainTextureExtends = {
      width: this.getRenderWidth(!0),
      height: this.getRenderHeight(!0),
      depthOrArrayLayers: 1
    };
    const e = new Float32Array([this.getRenderHeight(!0)]);
    this._bufferManager.setSubData(this._ubInvertY, 4, e), this._bufferManager.setSubData(this._ubDontInvertY, 4, e);
    let t;
    if (this._options.antialias) {
      const s = {
        label: `Texture_MainColor_${this._mainTextureExtends.width}x${this._mainTextureExtends.height}_antialiasing`,
        size: this._mainTextureExtends,
        mipLevelCount: 1,
        sampleCount: this._mainPassSampleCount,
        dimension: X.E2d,
        format: this._options.swapChainFormat,
        usage: F.RenderAttachment
      };
      this._mainTexture && this._textureHelper.releaseTexture(this._mainTexture), this._mainTexture = this._device.createTexture(s), t = [
        {
          view: this._mainTexture.createView({
            label: "TextureView_MainColor_antialiasing",
            dimension: X.E2d,
            format: this._options.swapChainFormat,
            mipLevelCount: 1,
            arrayLayerCount: 1
          }),
          clearValue: new Pe(0, 0, 0, 1),
          loadOp: N.Clear,
          storeOp: Y.Store
          // don't use StoreOp.Discard, else using several cameras with different viewports or using scissors will fail because we call beginRenderPass / endPass several times for the same color attachment!
        }
      ];
    } else
      t = [
        {
          view: void 0,
          clearValue: new Pe(0, 0, 0, 1),
          loadOp: N.Clear,
          storeOp: Y.Store
        }
      ];
    this._mainRenderPassWrapper.depthTextureFormat = this.isStencilEnable ? i.Depth24PlusStencil8 : i.Depth32Float, this._setDepthTextureFormat(this._mainRenderPassWrapper), this._setColorFormat(this._mainRenderPassWrapper);
    const r = {
      label: `Texture_MainDepthStencil_${this._mainTextureExtends.width}x${this._mainTextureExtends.height}`,
      size: this._mainTextureExtends,
      mipLevelCount: 1,
      sampleCount: this._mainPassSampleCount,
      dimension: X.E2d,
      format: this._mainRenderPassWrapper.depthTextureFormat,
      usage: F.RenderAttachment
    };
    this._depthTexture && this._textureHelper.releaseTexture(this._depthTexture), this._depthTexture = this._device.createTexture(r);
    const n = {
      view: this._depthTexture.createView({
        label: `TextureView_MainDepthStencil_${this._mainTextureExtends.width}x${this._mainTextureExtends.height}`,
        dimension: X.E2d,
        format: this._depthTexture.format,
        mipLevelCount: 1,
        arrayLayerCount: 1
      }),
      depthClearValue: this._clearDepthValue,
      depthLoadOp: N.Clear,
      depthStoreOp: Y.Store,
      stencilClearValue: this._clearStencilValue,
      stencilLoadOp: this.isStencilEnable ? N.Clear : void 0,
      stencilStoreOp: this.isStencilEnable ? Y.Store : void 0
    };
    this._mainRenderPassWrapper.renderPassDescriptor = {
      label: "MainRenderPass",
      colorAttachments: t,
      depthStencilAttachment: n
    };
  }
  _configureContext() {
    this._context.configure({
      device: this._device,
      format: this._options.swapChainFormat,
      usage: F.RenderAttachment | F.CopySrc,
      alphaMode: this.premultipliedAlpha ? ve.Premultiplied : ve.Opaque
    });
  }
  _rebuildBuffers() {
    super._rebuildBuffers();
    for (const e of this._storageBuffers)
      e.getBuffer().engineId !== this.uniqueId && e._rebuild();
  }
  _restoreEngineAfterContextLost(e) {
    J.ResetCache(), A.ResetCache();
    const t = (n) => {
      for (const s of n) {
        for (const o of s.meshes) {
          const u = o.subMeshes;
          if (u)
            for (const l of u)
              l._drawWrappers = [];
        }
        for (const o of s.materials)
          o._materialContext?.reset();
      }
    };
    t(this.scenes), t(this._virtualScenes);
    const r = [];
    for (const n of this._uniformBuffers)
      n.name.indexOf("leftOver") < 0 && r.push(n);
    this._uniformBuffers = r, super._restoreEngineAfterContextLost(e);
  }
  /**
   * Force a specific size of the canvas
   * @param width defines the new canvas' width
   * @param height defines the new canvas' height
   * @param forceSetSize true to force setting the sizes of the underlying canvas
   * @returns true if the size was changed
   */
  setSize(e, t, r = !1) {
    return super.setSize(e, t, r) ? (this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log(["frame #" + this._count + " - setSize -", e, t])), this._initializeMainAttachments(), this.snapshotRendering && this.snapshotRenderingReset(), !0) : !1;
  }
  /**
   * @internal
   */
  _getShaderProcessor(e) {
    return e === j.WGSL ? this._shaderProcessorWGSL : this._shaderProcessor;
  }
  /**
   * @internal
   */
  _getShaderProcessingContext(e) {
    return new z(e);
  }
  _currentPassIsMainPass() {
    return this._currentRenderTarget === null;
  }
  _getCurrentRenderPass() {
    return this._currentRenderTarget && !this._currentRenderPass ? this._startRenderTargetRenderPass(this._currentRenderTarget, !1, null, !1, !1) : this._currentRenderPass || this._startMainRenderPass(!1), this._currentRenderPass;
  }
  /** @internal */
  _getCurrentRenderPassWrapper() {
    return this._currentRenderTarget ? this._rttRenderPassWrapper : this._mainRenderPassWrapper;
  }
  //------------------------------------------------------------------------------
  //                          Static Pipeline WebGPU States
  //------------------------------------------------------------------------------
  /** @internal */
  applyStates() {
    this._stencilStateComposer.apply(), this._cacheRenderPipeline.setAlphaBlendEnabled(this._alphaState.alphaBlend);
  }
  /**
   * Force the entire cache to be cleared
   * You should not have to use this function unless your engine needs to share the WebGPU context with another engine
   * @param bruteForce defines a boolean to force clearing ALL caches (including stencil, detoh and alpha states)
   */
  wipeCaches(e) {
    this.preventCacheWipeBetweenFrames && !e || (this._forceEnableEffect = !0, this._currentIndexBuffer = null, this._currentOverrideVertexBuffers = null, this._cacheRenderPipeline.setBuffers(null, null, null), e && (this._stencilStateComposer.reset(), this._depthCullingState.reset(), this._depthCullingState.depthFunc = 515, this._alphaState.reset(), this._alphaMode = 1, this._alphaEquation = 0, this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters), this._cacheRenderPipeline.setAlphaBlendEnabled(!1), this.setColorWrite(!0)), this._cachedVertexBuffers = null, this._cachedIndexBuffer = null, this._cachedEffectForVertexBuffers = null);
  }
  /**
   * Enable or disable color writing
   * @param enable defines the state to set
   */
  setColorWrite(e) {
    this._colorWriteLocal = e, this._cacheRenderPipeline.setWriteMask(e ? 15 : 0);
  }
  /**
   * Gets a boolean indicating if color writing is enabled
   * @returns the current color writing state
   */
  getColorWrite() {
    return this._colorWriteLocal;
  }
  _mustUpdateViewport() {
    const e = this._viewportCached.x, t = this._viewportCached.y, r = this._viewportCached.z, n = this._viewportCached.w, s = this._viewportsCurrent.x !== e || this._viewportsCurrent.y !== t || this._viewportsCurrent.w !== r || this._viewportsCurrent.h !== n;
    return s && (this._viewportsCurrent.x = this._viewportCached.x, this._viewportsCurrent.y = this._viewportCached.y, this._viewportsCurrent.w = this._viewportCached.z, this._viewportsCurrent.h = this._viewportCached.w), s;
  }
  _applyViewport(e) {
    const t = Math.floor(this._viewportCached.x), r = Math.floor(this._viewportCached.z), n = Math.floor(this._viewportCached.w);
    let s = Math.floor(this._viewportCached.y);
    this._currentRenderTarget || (s = this.getRenderHeight(!0) - s - n), e ? e.addItem(new Ve(t, s, r, n)) : this._getCurrentRenderPass().setViewport(t, s, r, n, 0, 1), this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log([
      "frame #" + this._count + " - viewport applied - (",
      this._viewportCached.x,
      this._viewportCached.y,
      this._viewportCached.z,
      this._viewportCached.w,
      ") current pass is main pass=" + this._currentPassIsMainPass()
    ]));
  }
  /**
   * @internal
   */
  _viewport(e, t, r, n) {
    this._viewportCached.x = e, this._viewportCached.y = t, this._viewportCached.z = r, this._viewportCached.w = n;
  }
  _mustUpdateScissor() {
    const e = this._scissorCached.x, t = this._scissorCached.y, r = this._scissorCached.z, n = this._scissorCached.w, s = this._scissorsCurrent.x !== e || this._scissorsCurrent.y !== t || this._scissorsCurrent.w !== r || this._scissorsCurrent.h !== n;
    return s && (this._scissorsCurrent.x = this._scissorCached.x, this._scissorsCurrent.y = this._scissorCached.y, this._scissorsCurrent.w = this._scissorCached.z, this._scissorsCurrent.h = this._scissorCached.w), s;
  }
  _applyScissor(e) {
    const t = this._currentRenderTarget ? this._scissorCached.y : this.getRenderHeight() - this._scissorCached.w - this._scissorCached.y;
    e ? e.addItem(new $e(this._scissorCached.x, t, this._scissorCached.z, this._scissorCached.w)) : this._getCurrentRenderPass().setScissorRect(this._scissorCached.x, t, this._scissorCached.z, this._scissorCached.w), this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log([
      "frame #" + this._count + " - scissor applied - (",
      this._scissorCached.x,
      this._scissorCached.y,
      this._scissorCached.z,
      this._scissorCached.w,
      ") current pass is main pass=" + this._currentPassIsMainPass()
    ]));
  }
  _scissorIsActive() {
    return this._scissorCached.x !== 0 || this._scissorCached.y !== 0 || this._scissorCached.z !== 0 || this._scissorCached.w !== 0;
  }
  enableScissor(e, t, r, n) {
    this._scissorCached.x = e, this._scissorCached.y = t, this._scissorCached.z = r, this._scissorCached.w = n;
  }
  disableScissor() {
    this._scissorCached.x = this._scissorCached.y = this._scissorCached.z = this._scissorCached.w = 0, this._scissorsCurrent.x = this._scissorsCurrent.y = this._scissorsCurrent.w = this._scissorsCurrent.h = 0;
  }
  _mustUpdateStencilRef() {
    const e = this._stencilStateComposer.funcRef !== this._stencilRefsCurrent;
    return e && (this._stencilRefsCurrent = this._stencilStateComposer.funcRef), e;
  }
  _applyStencilRef(e) {
    e ? e.addItem(new Ge(this._stencilStateComposer.funcRef ?? 0)) : this._getCurrentRenderPass().setStencilReference(this._stencilStateComposer.funcRef ?? 0);
  }
  _mustUpdateBlendColor() {
    const e = this._alphaState._blendConstants, t = e[0] !== this._blendColorsCurrent[0] || e[1] !== this._blendColorsCurrent[1] || e[2] !== this._blendColorsCurrent[2] || e[3] !== this._blendColorsCurrent[3];
    return t && (this._blendColorsCurrent[0] = e[0], this._blendColorsCurrent[1] = e[1], this._blendColorsCurrent[2] = e[2], this._blendColorsCurrent[3] = e[3]), t;
  }
  _applyBlendColor(e) {
    e ? e.addItem(new We(this._alphaState._blendConstants.slice())) : this._getCurrentRenderPass().setBlendConstant(this._alphaState._blendConstants);
  }
  _resetRenderPassStates() {
    this._viewportsCurrent.x = this._viewportsCurrent.y = this._viewportsCurrent.w = this._viewportsCurrent.h = 0, this._scissorsCurrent.x = this._scissorsCurrent.y = this._scissorsCurrent.w = this._scissorsCurrent.h = 0, this._stencilRefsCurrent = -1, this._blendColorsCurrent[0] = this._blendColorsCurrent[1] = this._blendColorsCurrent[2] = this._blendColorsCurrent[3] = null;
  }
  /**
   * Clear the current render buffer or the current render target (if any is set up)
   * @param color defines the color to use
   * @param backBuffer defines if the back buffer must be cleared
   * @param depth defines if the depth buffer must be cleared
   * @param stencil defines if the stencil buffer must be cleared
   */
  clear(e, t, r, n = !1) {
    e && e.a === void 0 && (e.a = 1);
    const s = this._scissorIsActive();
    this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log(["frame #" + this._count + " - clear - backBuffer=", t, " depth=", r, " stencil=", n, " scissor is active=", s])), this._currentRenderTarget ? s ? (this._currentRenderPass || this._startRenderTargetRenderPass(this._currentRenderTarget, !1, t ? e : null, r, n), this._applyScissor(this.compatibilityMode ? null : this._bundleList), this._clearFullQuad(t ? e : null, r, n)) : (this._currentRenderPass && this._endCurrentRenderPass(), this._startRenderTargetRenderPass(this._currentRenderTarget, !0, t ? e : null, r, n)) : ((!this._currentRenderPass || !s) && this._startMainRenderPass(!s, t ? e : null, r, n), s && (this._applyScissor(this.compatibilityMode ? null : this._bundleList), this._clearFullQuad(t ? e : null, r, n)));
  }
  _clearFullQuad(e, t, r) {
    const n = this.compatibilityMode ? this._getCurrentRenderPass() : null;
    this._clearQuad.setColorFormat(this._colorFormat), this._clearQuad.setDepthStencilFormat(this._depthTextureFormat), this._clearQuad.setMRTAttachments(this._cacheRenderPipeline.mrtAttachments ?? [], this._cacheRenderPipeline.mrtTextureArray ?? [], this._cacheRenderPipeline.mrtTextureCount), this.compatibilityMode ? n.setStencilReference(this._clearStencilValue) : this._bundleList.addItem(new Ge(this._clearStencilValue));
    const s = this._clearQuad.clear(n, e, t, r, this.currentSampleCount);
    this.compatibilityMode ? this._applyStencilRef(null) : (this._bundleList.addBundle(s), this._applyStencilRef(this._bundleList), this._reportDrawCall());
  }
  //------------------------------------------------------------------------------
  //                              Vertex/Index/Storage Buffers
  //------------------------------------------------------------------------------
  /**
   * Creates a vertex buffer
   * @param data the data or the size for the vertex buffer
   * @param _updatable whether the buffer should be created as updatable
   * @param label defines the label of the buffer (for debug purpose)
   * @returns the new buffer
   */
  createVertexBuffer(e, t, r) {
    let n;
    return e instanceof Array ? n = new Float32Array(e) : e instanceof ArrayBuffer ? n = new Uint8Array(e) : n = e, this._bufferManager.createBuffer(n, w.Vertex | w.CopyDst, r);
  }
  /**
   * Creates a vertex buffer
   * @param data the data for the dynamic vertex buffer
   * @param label defines the label of the buffer (for debug purpose)
   * @returns the new buffer
   */
  createDynamicVertexBuffer(e, t) {
    return this.createVertexBuffer(e, void 0, t);
  }
  /**
   * Creates a new index buffer
   * @param indices defines the content of the index buffer
   * @param _updatable defines if the index buffer must be updatable
   * @param label defines the label of the buffer (for debug purpose)
   * @returns a new buffer
   */
  createIndexBuffer(e, t, r) {
    let n = !0, s;
    e instanceof Uint32Array || e instanceof Int32Array ? s = e : e instanceof Uint16Array ? (s = e, n = !1) : e.length > 65535 ? s = new Uint32Array(e) : (s = new Uint16Array(e), n = !1);
    const o = this._bufferManager.createBuffer(s, w.Index | w.CopyDst, r);
    return o.is32Bits = n, o;
  }
  /**
   * Update a dynamic index buffer
   * @param indexBuffer defines the target index buffer
   * @param indices defines the data to update
   * @param offset defines the offset in the target index buffer where update should start
   */
  updateDynamicIndexBuffer(e, t, r = 0) {
    const n = e;
    let s;
    e.is32Bits ? s = t instanceof Uint32Array ? t : new Uint32Array(t) : s = t instanceof Uint16Array ? t : new Uint16Array(t), this._bufferManager.setSubData(n, r, s);
  }
  /**
   * Updates a dynamic vertex buffer.
   * @param vertexBuffer the vertex buffer to update
   * @param data the data used to update the vertex buffer
   * @param byteOffset the byte offset of the data
   * @param byteLength the byte length of the data
   */
  updateDynamicVertexBuffer(e, t, r, n) {
    const s = e;
    r === void 0 && (r = 0);
    let o;
    n === void 0 ? (t instanceof Array ? o = new Float32Array(t) : t instanceof ArrayBuffer ? o = new Uint8Array(t) : o = t, n = o.byteLength) : t instanceof Array ? o = new Float32Array(t) : t instanceof ArrayBuffer ? o = new Uint8Array(t) : o = t, this._bufferManager.setSubData(s, r, o, 0, n);
  }
  /**
   * @internal
   */
  _createBuffer(e, t, r) {
    let n;
    e instanceof Array ? n = new Float32Array(e) : e instanceof ArrayBuffer ? n = new Uint8Array(e) : n = e;
    let s = 0;
    return t & 1 && (s |= w.CopySrc), t & 2 && (s |= w.CopyDst), t & 4 && (s |= w.Uniform), t & 8 && (s |= w.Vertex), t & 16 && (s |= w.Index), t & 32 && (s |= w.Storage), this._bufferManager.createBuffer(n, s, r);
  }
  /**
   * @internal
   */
  bindBuffersDirectly() {
    throw "Not implemented on WebGPU";
  }
  /**
   * @internal
   */
  updateAndBindInstancesBuffer() {
    throw "Not implemented on WebGPU";
  }
  /**
   * Bind a list of vertex buffers with the engine
   * @param vertexBuffers defines the list of vertex buffers to bind
   * @param indexBuffer defines the index buffer to bind
   * @param effect defines the effect associated with the vertex buffers
   * @param overrideVertexBuffers defines optional list of avertex buffers that overrides the entries in vertexBuffers
   */
  bindBuffers(e, t, r, n) {
    this._currentIndexBuffer = t, this._currentOverrideVertexBuffers = n ?? null, this._cacheRenderPipeline.setBuffers(e, t, this._currentOverrideVertexBuffers);
  }
  /**
   * @internal
   */
  _releaseBuffer(e) {
    return this._bufferManager.releaseBuffer(e);
  }
  //------------------------------------------------------------------------------
  //                              Uniform Buffers
  //------------------------------------------------------------------------------
  /**
   * Create an uniform buffer
   * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
   * @param elements defines the content of the uniform buffer
   * @param label defines a name for the buffer (for debugging purpose)
   * @returns the webGL uniform buffer
   */
  createUniformBuffer(e, t) {
    let r;
    return e instanceof Array ? r = new Float32Array(e) : r = e, this._bufferManager.createBuffer(r, w.Uniform | w.CopyDst, t);
  }
  /**
   * Create a dynamic uniform buffer (no different from a non dynamic uniform buffer in WebGPU)
   * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
   * @param elements defines the content of the uniform buffer
   * @param label defines a name for the buffer (for debugging purpose)
   * @returns the webGL uniform buffer
   */
  createDynamicUniformBuffer(e, t) {
    return this.createUniformBuffer(e, t);
  }
  /**
   * Update an existing uniform buffer
   * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
   * @param uniformBuffer defines the target uniform buffer
   * @param elements defines the content to update
   * @param offset defines the offset in the uniform buffer where update should start
   * @param count defines the size of the data to update
   */
  updateUniformBuffer(e, t, r, n) {
    r === void 0 && (r = 0);
    const s = e;
    let o;
    n === void 0 ? (t instanceof Float32Array ? o = t : o = new Float32Array(t), n = o.byteLength) : t instanceof Float32Array ? o = t : o = new Float32Array(t), this._bufferManager.setSubData(s, r, o, 0, n);
  }
  /**
   * Bind a buffer to the current draw context
   * @param buffer defines the buffer to bind
   * @param _location not used in WebGPU
   * @param name Name of the uniform variable to bind
   */
  bindUniformBufferBase(e, t, r) {
    this._currentDrawContext.setBuffer(r, e);
  }
  /**
   * Unused in WebGPU
   */
  bindUniformBlock() {
  }
  //------------------------------------------------------------------------------
  //                              Effects
  //------------------------------------------------------------------------------
  /**
   * Create a new effect (used to store vertex/fragment shaders)
   * @param baseName defines the base name of the effect (The name of file without .fragment.fx or .vertex.fx)
   * @param attributesNamesOrOptions defines either a list of attribute names or an IEffectCreationOptions object
   * @param uniformsNamesOrEngine defines either a list of uniform names or the engine to use
   * @param samplers defines an array of string used to represent textures
   * @param defines defines the string containing the defines to use to compile the shaders
   * @param fallbacks defines the list of potential fallbacks to use if shader compilation fails
   * @param onCompiled defines a function to call when the effect creation is successful
   * @param onError defines a function to call when the effect creation has failed
   * @param indexParameters defines an object containing the index values to use to compile shaders (like the maximum number of simultaneous lights)
   * @param shaderLanguage the language the shader is written in (default: GLSL)
   * @returns the new Effect
   */
  createEffect(e, t, r, n, s, o, u, l, c, h = j.GLSL) {
    const d = typeof e == "string" ? e : e.vertexToken || e.vertexSource || e.vertexElement || e.vertex, f = typeof e == "string" ? e : e.fragmentToken || e.fragmentSource || e.fragmentElement || e.fragment, _ = this._getGlobalDefines();
    let m = s ?? t.defines ?? "";
    _ && (m += `
` + _);
    const g = d + "+" + f + "@" + m;
    if (this._compiledEffects[g]) {
      const x = this._compiledEffects[g];
      return u && x.isReady() && u(x), x;
    }
    const p = new Rt(e, t, r, n, this, s, o, u, l, c, g, h);
    return this._compiledEffects[g] = p, p;
  }
  _compileRawShaderToSpirV(e, t) {
    return this._glslang.compileGLSL(e, t);
  }
  _compileShaderToSpirV(e, t, r, n) {
    return this._compileRawShaderToSpirV(n + (r ? r + `
` : "") + e, t);
  }
  _getWGSLShader(e, t, r) {
    return r ? r = "//" + r.split(`
`).join(`
//`) + `
` : r = "", r + e;
  }
  _createPipelineStageDescriptor(e, t, r, n, s) {
    return this._tintWASM && r === j.GLSL && (e = this._tintWASM.convertSpirV2WGSL(e, n), t = this._tintWASM.convertSpirV2WGSL(t, s)), {
      vertexStage: {
        module: this._device.createShaderModule({
          code: e
        }),
        entryPoint: "main"
      },
      fragmentStage: {
        module: this._device.createShaderModule({
          code: t
        }),
        entryPoint: "main"
      }
    };
  }
  _compileRawPipelineStageDescriptor(e, t, r) {
    const n = e.indexOf(ye) >= 0, s = t.indexOf(ye) >= 0, o = r === j.GLSL ? this._compileRawShaderToSpirV(e, "vertex") : e, u = r === j.GLSL ? this._compileRawShaderToSpirV(t, "fragment") : t;
    return this._createPipelineStageDescriptor(o, u, r, n, s);
  }
  _compilePipelineStageDescriptor(e, t, r, n) {
    this.onBeforeShaderCompilationObservable.notifyObservers(this);
    const s = e.indexOf(ye) >= 0, o = t.indexOf(ye) >= 0, u = `#version 450
`, l = n === j.GLSL ? this._compileShaderToSpirV(e, "vertex", r, u) : this._getWGSLShader(e, "vertex", r), c = n === j.GLSL ? this._compileShaderToSpirV(t, "fragment", r, u) : this._getWGSLShader(t, "fragment", r), h = this._createPipelineStageDescriptor(l, c, n, s, o);
    return this.onAfterShaderCompilationObservable.notifyObservers(this), h;
  }
  /**
   * @internal
   */
  createRawShaderProgram() {
    throw "Not available on WebGPU";
  }
  /**
   * @internal
   */
  createShaderProgram() {
    throw "Not available on WebGPU";
  }
  /**
   * Inline functions in shader code that are marked to be inlined
   * @param code code to inline
   * @returns inlined code
   */
  inlineShaderCode(e) {
    const t = new Le(e);
    return t.debug = !1, t.processCode(), t.code;
  }
  /**
   * Creates a new pipeline context
   * @param shaderProcessingContext defines the shader processing context used during the processing if available
   * @returns the new pipeline
   */
  createPipelineContext(e) {
    return new At(e, this);
  }
  /**
   * Creates a new material context
   * @returns the new context
   */
  createMaterialContext() {
    return new Ee();
  }
  /**
   * Creates a new draw context
   * @returns the new context
   */
  createDrawContext() {
    return new Ue(this._bufferManager);
  }
  /**
   * @internal
   */
  _preparePipelineContext(e, t, r, n, s, o, u, l) {
    const c = e, h = c.shaderProcessingContext.shaderLanguage;
    this.dbgShowShaderCode && (y.Log(["defines", l]), y.Log(t), y.Log(r), y.Log("***********************************************")), c.sources = {
      fragment: r,
      vertex: t,
      rawVertex: s,
      rawFragment: o
    }, n ? c.stages = this._compileRawPipelineStageDescriptor(t, r, h) : c.stages = this._compilePipelineStageDescriptor(t, r, l, h);
  }
  /**
   * Gets the list of active attributes for a given WebGPU program
   * @param pipelineContext defines the pipeline context to use
   * @param attributesNames defines the list of attribute names to get
   * @returns an array of indices indicating the offset of each attribute
   */
  getAttributes(e, t) {
    const r = new Array(t.length), n = e;
    for (let s = 0; s < t.length; s++) {
      const o = t[s], u = n.shaderProcessingContext.availableAttributes[o];
      u !== void 0 && (r[s] = u);
    }
    return r;
  }
  /**
   * Activates an effect, making it the current one (ie. the one used for rendering)
   * @param effect defines the effect to activate
   */
  enableEffect(e) {
    if (e) {
      if (!It.IsWrapper(e))
        this._currentEffect = e, this._currentMaterialContext = this._defaultMaterialContext, this._currentDrawContext = this._defaultDrawContext, this._counters.numEnableEffects++, this.dbgLogIfNotDrawWrapper && y.Warn(`enableEffect has been called with an Effect and not a Wrapper! effect.uniqueId=${e.uniqueId}, effect.name=${e.name}, effect.name.vertex=${typeof e.name == "string" ? "" : e.name.vertex}, effect.name.fragment=${typeof e.name == "string" ? "" : e.name.fragment}`, 10);
      else if (!e.effect || e.effect === this._currentEffect && e.materialContext === this._currentMaterialContext && e.drawContext === this._currentDrawContext && !this._forceEnableEffect) {
        if (!e.effect && this.dbgShowEmptyEnableEffectCalls)
          throw y.Log(["drawWrapper=", e]), "Invalid call to enableEffect: the effect property is empty!";
        return;
      } else if (this._currentEffect = e.effect, this._currentMaterialContext = e.materialContext, this._currentDrawContext = e.drawContext, this._counters.numEnableDrawWrapper++, !this._currentMaterialContext)
        throw y.Log(["drawWrapper=", e]), "Invalid call to enableEffect: the materialContext property is empty!";
      this._stencilStateComposer.stencilMaterial = void 0, this._forceEnableEffect = !1, this._currentEffect.onBind && this._currentEffect.onBind(this._currentEffect), this._currentEffect._onBindObservable && this._currentEffect._onBindObservable.notifyObservers(this._currentEffect);
    }
  }
  /**
   * @internal
   */
  _releaseEffect(e) {
    this._compiledEffects[e._key] && (delete this._compiledEffects[e._key], this._deletePipelineContext(e.getPipelineContext()));
  }
  /**
   * Force the engine to release all cached effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
   */
  releaseEffects() {
    for (const e in this._compiledEffects) {
      const t = this._compiledEffects[e].getPipelineContext();
      this._deletePipelineContext(t);
    }
    this._compiledEffects = {};
  }
  _deletePipelineContext(e) {
    e && e.dispose();
  }
  //------------------------------------------------------------------------------
  //                              Textures
  //------------------------------------------------------------------------------
  /**
   * Gets a boolean indicating that only power of 2 textures are supported
   * Please note that you can still use non power of 2 textures but in this case the engine will forcefully convert them
   */
  get needPOTTextures() {
    return !1;
  }
  /** @internal */
  _createHardwareTexture() {
    return new Be();
  }
  /**
   * @internal
   */
  _releaseTexture(e) {
    const t = this._internalTexturesCache.indexOf(e);
    t !== -1 && this._internalTexturesCache.splice(t, 1), this._textureHelper.releaseTexture(e);
  }
  /**
   * @internal
   */
  _getRGBABufferInternalSizedFormat() {
    return 5;
  }
  updateTextureComparisonFunction(e, t) {
    e._comparisonFunction = t;
  }
  /**
   * Creates an internal texture without binding it to a framebuffer
   * @internal
   * @param size defines the size of the texture
   * @param options defines the options used to create the texture
   * @param delayGPUTextureCreation true to delay the texture creation the first time it is really needed. false to create it right away
   * @param source source type of the texture
   * @returns a new internal texture
   */
  _createInternalTexture(e, t, r = !0, n = ge.Unknown) {
    const s = {};
    t !== void 0 && typeof t == "object" ? (s.generateMipMaps = t.generateMipMaps, s.type = t.type === void 0 ? 0 : t.type, s.samplingMode = t.samplingMode === void 0 ? 3 : t.samplingMode, s.format = t.format === void 0 ? 5 : t.format, s.samples = t.samples ?? 1, s.creationFlags = t.creationFlags ?? 0, s.useSRGBBuffer = t.useSRGBBuffer ?? !1, s.label = t.label) : (s.generateMipMaps = t, s.type = 0, s.samplingMode = 3, s.format = 5, s.samples = 1, s.creationFlags = 0, s.useSRGBBuffer = !1), (s.type === 1 && !this._caps.textureFloatLinearFiltering || s.type === 2 && !this._caps.textureHalfFloatLinearFiltering) && (s.samplingMode = 1), s.type === 1 && !this._caps.textureFloat && (s.type = 0, y.Warn("Float textures are not supported. Type forced to TEXTURETYPE_UNSIGNED_BYTE"));
    const o = new Fe(this, n), u = e.width || e, l = e.height || e, c = e.depth || 0, h = e.layers || 0;
    return o.baseWidth = u, o.baseHeight = l, o.width = u, o.height = l, o.depth = c || h, o.isReady = !0, o.samples = s.samples, o.generateMipMaps = !!s.generateMipMaps, o.samplingMode = s.samplingMode, o.type = s.type, o.format = s.format, o.is2DArray = h > 0, o.is3D = c > 0, o._cachedWrapU = 0, o._cachedWrapV = 0, o._useSRGBBuffer = s.useSRGBBuffer, o.label = s.label, this._internalTexturesCache.push(o), r || this._textureHelper.createGPUTextureForInternalTexture(o, u, l, h || 1, s.creationFlags), o;
  }
  /**
   * Usually called from Texture.ts.
   * Passed information to create a hardware texture
   * @param url defines a value which contains one of the following:
   * * A conventional http URL, e.g. 'http://...' or 'file://...'
   * * A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
   * * An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
   * @param noMipmap defines a boolean indicating that no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file
   * @param invertY when true, image is flipped when loaded.  You probably want true. Certain compressed textures may invert this if their default is inverted (eg. ktx)
   * @param scene needed for loading to the correct scene
   * @param samplingMode mode with should be used sample / access the texture (Default: Texture.TRILINEAR_SAMPLINGMODE)
   * @param onLoad optional callback to be called upon successful completion
   * @param onError optional callback to be called upon failure
   * @param buffer a source of a file previously fetched as either a base64 string, an ArrayBuffer (compressed or image format), HTMLImageElement (image format), or a Blob
   * @param fallback an internal argument in case the function must be called again, due to etc1 not having alpha capabilities
   * @param format internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures
   * @param forcedExtension defines the extension to use to pick the right loader
   * @param mimeType defines an optional mime type
   * @param loaderOptions options to be passed to the loader
   * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
   * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
   * @returns a InternalTexture for assignment back into BABYLON.Texture
   */
  createTexture(e, t, r, n, s = 3, o = null, u = null, l = null, c = null, h = null, d = null, f, _, m, g) {
    return this._createTextureBase(e, t, r, n, s, o, u, (p, x, S, b, v, R, G, P) => {
      const E = b;
      if (p.baseWidth = E.width, p.baseHeight = E.height, p.width = E.width, p.height = E.height, p.format = p.format !== -1 ? p.format : h ?? 5, p.type = p.type !== -1 ? p.type : 0, p._creationFlags = m ?? 0, P(p.width, p.height, E, x, p, () => {
      }), p._hardwareTexture?.underlyingResource)
        !R && !G && this._generateMipmaps(p, this._uploadEncoder);
      else {
        const W = this._textureHelper.createGPUTextureForInternalTexture(p, E.width, E.height, void 0, m);
        T.IsImageBitmap(E) && (this._textureHelper.updateTexture(E, p, E.width, E.height, p.depth, W.format, 0, 0, v, !1, 0, 0), !R && !G && this._generateMipmaps(p, this._uploadEncoder));
      }
      S && S.removePendingData(p), p.isReady = !0, p.onLoadedObservable.notifyObservers(p), p.onLoadedObservable.clear();
    }, () => !1, l, c, h, d, f, _, g);
  }
  /**
   * Wraps an external web gpu texture in a Babylon texture.
   * @param texture defines the external texture
   * @returns the babylon internal texture
   */
  wrapWebGPUTexture(e) {
    const t = new Be(e), r = new Fe(this, ge.Unknown, !0);
    return r._hardwareTexture = t, r.isReady = !0, r;
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Wraps an external web gl texture in a Babylon texture.
   * @returns the babylon internal texture
   */
  wrapWebGLTexture() {
    throw new Error("wrapWebGLTexture is not supported, use wrapWebGPUTexture instead.");
  }
  generateMipMapsForCubemap(e) {
    e.generateMipMaps && (e._hardwareTexture?.underlyingResource || this._textureHelper.createGPUTextureForInternalTexture(e), this._generateMipmaps(e));
  }
  /**
   * Update the sampling mode of a given texture
   * @param samplingMode defines the required sampling mode
   * @param texture defines the texture to update
   * @param generateMipMaps defines whether to generate mipmaps for the texture
   */
  updateTextureSamplingMode(e, t, r = !1) {
    r && (t.generateMipMaps = !0, this._generateMipmaps(t)), t.samplingMode = e;
  }
  /**
   * Update the sampling mode of a given texture
   * @param texture defines the texture to update
   * @param wrapU defines the texture wrap mode of the u coordinates
   * @param wrapV defines the texture wrap mode of the v coordinates
   * @param wrapR defines the texture wrap mode of the r coordinates
   */
  updateTextureWrappingMode(e, t, r = null, n = null) {
    t !== null && (e._cachedWrapU = t), r !== null && (e._cachedWrapV = r), (e.is2DArray || e.is3D) && n !== null && (e._cachedWrapR = n);
  }
  /**
   * Update the dimensions of a texture
   * @param texture texture to update
   * @param width new width of the texture
   * @param height new height of the texture
   * @param depth new depth of the texture
   */
  updateTextureDimensions(e, t, r, n = 1) {
    if (!e._hardwareTexture || e.width === t && e.height === r && e.depth === n)
      return;
    const s = e._hardwareTexture.textureAdditionalUsages;
    e._hardwareTexture.release(), this._textureHelper.createGPUTextureForInternalTexture(e, t, r, n, s);
  }
  /**
   * @internal
   */
  _setInternalTexture(e, t, r) {
    if (r = r ?? e, this._currentEffect) {
      const s = this._currentEffect._pipelineContext.shaderProcessingContext.availableTextures[r];
      if (this._currentMaterialContext.setTexture(e, t), s && s.autoBindSampler) {
        const o = r + L.AutoSamplerSuffix;
        this._currentMaterialContext.setSampler(o, t);
      }
    }
  }
  /**
   * Sets a texture to the according uniform.
   * @param channel The texture channel
   * @param unused unused parameter
   * @param texture The texture to apply
   * @param name The name of the uniform in the effect
   */
  setTexture(e, t, r, n) {
    this._setTexture(e, r, !1, !1, n, n);
  }
  /**
   * Sets an array of texture to the WebGPU context
   * @param channel defines the channel where the texture array must be set
   * @param unused unused parameter
   * @param textures defines the array of textures to bind
   * @param name name of the channel
   */
  setTextureArray(e, t, r, n) {
    for (let s = 0; s < r.length; s++)
      this._setTexture(-1, r[s], !0, !1, n + s.toString(), n);
  }
  _setTexture(e, t, r = !1, n = !1, s = "", o) {
    if (o = o ?? s, this._currentEffect) {
      if (!t)
        return this._currentMaterialContext.setTexture(s, null), !1;
      if (t.video)
        t.update();
      else if (t.delayLoadState === 4)
        return t.delayLoad(), !1;
      let u = null;
      if (n ? u = t.depthStencilTexture : t.isReady() ? u = t.getInternalTexture() : t.isCube ? u = this.emptyCubeTexture : t.is3D ? u = this.emptyTexture3D : t.is2DArray ? u = this.emptyTexture2DArray : u = this.emptyTexture, u && !u.isMultiview) {
        if (u.isCube && u._cachedCoordinatesMode !== t.coordinatesMode) {
          u._cachedCoordinatesMode = t.coordinatesMode;
          const l = t.coordinatesMode !== 3 && t.coordinatesMode !== 5 ? 1 : 0;
          t.wrapU = l, t.wrapV = l;
        }
        u._cachedWrapU = t.wrapU, u._cachedWrapV = t.wrapV, u.is3D && (u._cachedWrapR = t.wrapR), this._setAnisotropicLevel(0, u, t.anisotropicFilteringLevel);
      }
      this._setInternalTexture(s, u, o);
    } else
      this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log(["frame #" + this._count + " - _setTexture called with a null _currentEffect! texture=", t]));
    return !0;
  }
  /**
   * @internal
   */
  _setAnisotropicLevel(e, t, r) {
    t._cachedAnisotropicFilteringLevel !== r && (t._cachedAnisotropicFilteringLevel = Math.min(r, this._caps.maxAnisotropy));
  }
  /**
   * @internal
   */
  _bindTexture(e, t, r) {
    e !== void 0 && this._setInternalTexture(r, t);
  }
  /**
   * Generates the mipmaps for a texture
   * @param texture texture to generate the mipmaps for
   */
  generateMipmaps(e) {
    this._generateMipmaps(e);
  }
  /**
   * @internal
   */
  _generateMipmaps(e, t) {
    t = t ?? this._renderEncoder;
    const r = e._hardwareTexture;
    if (!r)
      return;
    t === this._renderEncoder && this._endCurrentRenderPass();
    const n = e._hardwareTexture.format, s = T.ComputeNumMipmapLevels(e.width, e.height);
    this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log("frame #" + this._count + " - generate mipmaps - width=" + e.width + ", height=" + e.height + ", isCube=" + e.isCube + ", command encoder=" + (t === this._renderEncoder ? "render" : "copy"))), e.isCube ? this._textureHelper.generateCubeMipmaps(r, n, s, t) : this._textureHelper.generateMipmaps(r, n, s, 0, e.is3D, t);
  }
  /**
   * Update a portion of an internal texture
   * @param texture defines the texture to update
   * @param imageData defines the data to store into the texture
   * @param xOffset defines the x coordinates of the update rectangle
   * @param yOffset defines the y coordinates of the update rectangle
   * @param width defines the width of the update rectangle
   * @param height defines the height of the update rectangle
   * @param faceIndex defines the face index if texture is a cube (0 by default)
   * @param lod defines the lod level to update (0 by default)
   * @param generateMipMaps defines whether to generate mipmaps or not
   */
  updateTextureData(e, t, r, n, s, o, u = 0, l = 0, c = !1) {
    let h = e._hardwareTexture;
    e._hardwareTexture?.underlyingResource || (h = this._textureHelper.createGPUTextureForInternalTexture(e));
    const d = new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
    this._textureHelper.updateTexture(d, e, s, o, e.depth, h.format, u, l, e.invertY, !1, r, n), c && this._generateMipmaps(e);
  }
  /**
   * @internal
   */
  _uploadCompressedDataToTextureDirectly(e, t, r, n, s, o = 0, u = 0) {
    let l = e._hardwareTexture;
    e._hardwareTexture?.underlyingResource || (e.format = t, l = this._textureHelper.createGPUTextureForInternalTexture(e, r, n));
    const c = new Uint8Array(s.buffer, s.byteOffset, s.byteLength);
    this._textureHelper.updateTexture(c, e, r, n, e.depth, l.format, o, u, !1, !1, 0, 0);
  }
  /**
   * @internal
   */
  _uploadDataToTextureDirectly(e, t, r = 0, n = 0, s, o = !1) {
    const u = Math.round(Math.log(e.width) * Math.LOG2E), l = Math.round(Math.log(e.height) * Math.LOG2E), c = o ? e.width : Math.pow(2, Math.max(u - n, 0)), h = o ? e.height : Math.pow(2, Math.max(l - n, 0));
    let d = e._hardwareTexture;
    e._hardwareTexture?.underlyingResource || (d = this._textureHelper.createGPUTextureForInternalTexture(e, c, h));
    const f = new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
    this._textureHelper.updateTexture(f, e, c, h, e.depth, d.format, r, n, e.invertY, !1, 0, 0);
  }
  /**
   * @internal
   */
  _uploadArrayBufferViewToTexture(e, t, r = 0, n = 0) {
    this._uploadDataToTextureDirectly(e, t, r, n);
  }
  /**
   * @internal
   */
  _uploadImageToTexture(e, t, r = 0, n = 0) {
    let s = e._hardwareTexture;
    if (e._hardwareTexture?.underlyingResource || (s = this._textureHelper.createGPUTextureForInternalTexture(e)), t instanceof HTMLImageElement)
      throw "WebGPU engine: HTMLImageElement not supported in _uploadImageToTexture!";
    const o = t, u = Math.ceil(e.width / (1 << n)), l = Math.ceil(e.height / (1 << n));
    this._textureHelper.updateTexture(o, e, u, l, e.depth, s.format, r, n, e.invertY, !1, 0, 0);
  }
  /**
   * Reads pixels from the current frame buffer. Please note that this function can be slow
   * @param x defines the x coordinate of the rectangle where pixels must be read
   * @param y defines the y coordinate of the rectangle where pixels must be read
   * @param width defines the width of the rectangle where pixels must be read
   * @param height defines the height of the rectangle where pixels must be read
   * @param hasAlpha defines whether the output should have alpha or not (defaults to true)
   * @param flushRenderer true to flush the renderer from the pending commands before reading the pixels
   * @returns a ArrayBufferView promise (Uint8Array) containing RGBA colors
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readPixels(e, t, r, n, s = !0, o = !0) {
    const l = this._getCurrentRenderPassWrapper().colorAttachmentGPUTextures[0];
    if (!l)
      return Promise.resolve(new Uint8Array(0));
    const c = l.underlyingResource, h = l.format;
    return c ? (o && this.flushFramebuffer(), this._textureHelper.readPixels(c, e, t, r, n, h)) : Promise.resolve(new Uint8Array(0));
  }
  //------------------------------------------------------------------------------
  //                              Frame management
  //------------------------------------------------------------------------------
  /**
   * Begin a new frame
   */
  beginFrame() {
    super.beginFrame();
  }
  /**
   * End the current frame
   */
  endFrame() {
    if (this._endCurrentRenderPass(), this._snapshotRendering.endFrame(), this._timestampQuery.endFrame(this._renderEncoder), this._timestampIndex = 0, this.flushFramebuffer(), this._textureHelper.destroyDeferredTextures(), this._bufferManager.destroyDeferredBuffers(), this._features._collectUbosUpdatedInFrame) {
      if (this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), !this._count || this._count < this.dbgVerboseLogsNumFrames)) {
        const e = [];
        for (const t in Ce._UpdatedUbosInFrame)
          e.push(t + ":" + Ce._UpdatedUbosInFrame[t]);
        y.Log(["frame #" + this._count + " - updated ubos -", e.join(", ")]);
      }
      Ce._UpdatedUbosInFrame = {};
    }
    this.countersLastFrame.numEnableEffects = this._counters.numEnableEffects, this.countersLastFrame.numEnableDrawWrapper = this._counters.numEnableDrawWrapper, this.countersLastFrame.numBundleCreationNonCompatMode = this._counters.numBundleCreationNonCompatMode, this.countersLastFrame.numBundleReuseNonCompatMode = this._counters.numBundleReuseNonCompatMode, this._counters.numEnableEffects = 0, this._counters.numEnableDrawWrapper = 0, this._counters.numBundleCreationNonCompatMode = 0, this._counters.numBundleReuseNonCompatMode = 0, this._cacheRenderPipeline.endFrame(), this._cacheBindGroups.endFrame(), this._pendingDebugCommands.length = 0, super.endFrame(), this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), this._count < this.dbgVerboseLogsNumFrames && y.Log(["%c frame #" + this._count + " - end", "background: #ffff00"]), this._count < this.dbgVerboseLogsNumFrames && (this._count++, this._count !== this.dbgVerboseLogsNumFrames && y.Log(["%c frame #" + this._count + " - begin", "background: #ffff00"])));
  }
  /**
   * Force a WebGPU flush (ie. a flush of all waiting commands)
   */
  flushFramebuffer() {
    this._endCurrentRenderPass(), this._commandBuffers[0] = this._uploadEncoder.finish(), this._commandBuffers[1] = this._renderEncoder.finish(), this._device.queue.submit(this._commandBuffers), this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor), this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor), this._timestampQuery.startFrame(this._uploadEncoder), this._textureHelper.setCommandEncoder(this._uploadEncoder), this._bundleList.reset();
  }
  /** @internal */
  _currentFrameBufferIsDefaultFrameBuffer() {
    return this._currentPassIsMainPass();
  }
  //------------------------------------------------------------------------------
  //                              Render Pass
  //------------------------------------------------------------------------------
  _startRenderTargetRenderPass(e, t, r, n, s) {
    this._endCurrentRenderPass();
    const o = e, u = o._depthStencilTexture, l = u?._hardwareTexture, c = l?.underlyingResource, h = l?.getMSAATexture(), d = c?.createView(this._rttRenderPassWrapper.depthAttachmentViewDescriptor), f = h?.createView(this._rttRenderPassWrapper.depthAttachmentViewDescriptor), _ = l ? T.HasStencilAspect(l.format) : !1, m = [];
    this.useReverseDepthBuffer && this.setDepthFunctionToGreaterOrEqual();
    const g = zr;
    r && (g.r = r.r * 255, g.g = r.g * 255, g.b = r.b * 255, g.a = r.a * 255);
    const p = t && r, x = t && n, S = t && s;
    if (o._attachments && o.isMulti) {
      (!this._mrtAttachments || this._mrtAttachments.length === 0) && (this._mrtAttachments = o._defaultAttachments);
      for (let b = 0; b < this._mrtAttachments.length; ++b) {
        const v = this._mrtAttachments[b], R = o.textures[b], G = R?._hardwareTexture, P = G?.underlyingResource;
        if (G && P) {
          const E = G.getMSAATexture(b), W = o.layerIndices?.[b] ?? 0, ne = o.faceIndices?.[b] ?? 0, gt = {
            ...this._rttRenderPassWrapper.colorAttachmentViewDescriptor,
            dimension: R.is3D ? I.E3d : I.E2d,
            format: G.format,
            baseArrayLayer: R.isCube ? W * 6 + ne : R.is3D ? 0 : W
          }, xt = {
            ...this._rttRenderPassWrapper.colorAttachmentViewDescriptor,
            dimension: R.is3D ? I.E3d : I.E2d,
            format: G.format,
            baseArrayLayer: 0
          }, bt = R.type === 7 || R.type === 5, He = P.createView(gt), ze = E?.createView(xt);
          m.push({
            view: ze || He,
            resolveTarget: E ? He : void 0,
            depthSlice: R.is3D ? W : void 0,
            clearValue: v !== 0 && p ? bt ? g : r : void 0,
            loadOp: v !== 0 && p ? N.Clear : N.Load,
            storeOp: Y.Store
          });
        }
      }
      this._cacheRenderPipeline.setMRT(o.textures, this._mrtAttachments.length), this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments);
    } else {
      const b = o.texture;
      if (b) {
        const v = b._hardwareTexture, R = v.underlyingResource;
        let G;
        o.is3D && (G = this._rttRenderPassWrapper.colorAttachmentViewDescriptor.baseArrayLayer, this._rttRenderPassWrapper.colorAttachmentViewDescriptor.baseArrayLayer = 0);
        const P = v.getMSAATexture(), E = R.createView(this._rttRenderPassWrapper.colorAttachmentViewDescriptor), W = P?.createView(this._rttRenderPassWrapper.colorAttachmentViewDescriptor), ne = b.type === 7 || b.type === 5;
        m.push({
          view: W || E,
          resolveTarget: P ? E : void 0,
          depthSlice: G,
          clearValue: p ? ne ? g : r : void 0,
          loadOp: p ? N.Clear : N.Load,
          storeOp: Y.Store
        });
      } else
        m.push(null);
    }
    if (this._debugPushGroup?.("render target pass" + (e.label ? " (" + e.label + ")" : ""), 1), this._rttRenderPassWrapper.renderPassDescriptor = {
      label: (e.label ?? "RTT") + "RenderPass",
      colorAttachments: m,
      depthStencilAttachment: u && c ? {
        view: f || d,
        depthClearValue: x ? this.useReverseDepthBuffer ? this._clearReverseDepthValue : this._clearDepthValue : void 0,
        depthLoadOp: x ? N.Clear : N.Load,
        depthStoreOp: Y.Store,
        stencilClearValue: o._depthStencilTextureWithStencil && S ? this._clearStencilValue : void 0,
        stencilLoadOp: _ ? o._depthStencilTextureWithStencil && S ? N.Clear : N.Load : void 0,
        stencilStoreOp: _ ? Y.Store : void 0
      } : void 0,
      occlusionQuerySet: this._occlusionQuery?.hasQueries ? this._occlusionQuery.querySet : void 0
    }, this._timestampQuery.startPass(this._rttRenderPassWrapper.renderPassDescriptor, this._timestampIndex), this._currentRenderPass = this._renderEncoder.beginRenderPass(this._rttRenderPassWrapper.renderPassDescriptor), this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), !this._count || this._count < this.dbgVerboseLogsNumFrames)) {
      const b = o.texture;
      y.Log([
        "frame #" + this._count + " - render target begin pass - rtt name=" + e.label + ", internalTexture.uniqueId=" + b.uniqueId + ", width=" + b.width + ", height=" + b.height + ", setClearStates=" + t,
        "renderPassDescriptor=",
        this._rttRenderPassWrapper.renderPassDescriptor
      ]);
    }
    this._debugFlushPendingCommands?.(), this._resetRenderPassStates(), (!l || !T.HasStencilAspect(l.format)) && (this._stencilStateComposer.enabled = !1);
  }
  _startMainRenderPass(e, t, r, n) {
    this._endCurrentRenderPass(), this.useReverseDepthBuffer && this.setDepthFunctionToGreaterOrEqual();
    const s = e && t, o = e && r, u = e && n;
    this._mainRenderPassWrapper.renderPassDescriptor.colorAttachments[0].clearValue = s ? t : void 0, this._mainRenderPassWrapper.renderPassDescriptor.colorAttachments[0].loadOp = s ? N.Clear : N.Load, this._mainRenderPassWrapper.renderPassDescriptor.depthStencilAttachment.depthClearValue = o ? this.useReverseDepthBuffer ? this._clearReverseDepthValue : this._clearDepthValue : void 0, this._mainRenderPassWrapper.renderPassDescriptor.depthStencilAttachment.depthLoadOp = o ? N.Clear : N.Load, this._mainRenderPassWrapper.renderPassDescriptor.depthStencilAttachment.stencilClearValue = u ? this._clearStencilValue : void 0, this._mainRenderPassWrapper.renderPassDescriptor.depthStencilAttachment.stencilLoadOp = this.isStencilEnable ? u ? N.Clear : N.Load : void 0, this._mainRenderPassWrapper.renderPassDescriptor.occlusionQuerySet = this._occlusionQuery?.hasQueries ? this._occlusionQuery.querySet : void 0;
    const l = this._context.getCurrentTexture();
    this._mainRenderPassWrapper.colorAttachmentGPUTextures[0].set(l), this._options.antialias ? (lt.format = l.format, this._mainRenderPassWrapper.renderPassDescriptor.colorAttachments[0].resolveTarget = l.createView(lt)) : (ct.format = l.format, this._mainRenderPassWrapper.renderPassDescriptor.colorAttachments[0].view = l.createView(ct)), this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log([
      "frame #" + this._count + " - main begin pass - texture width=" + this._mainTextureExtends.width,
      " height=" + this._mainTextureExtends.height + ", setClearStates=" + e,
      "renderPassDescriptor=",
      this._mainRenderPassWrapper.renderPassDescriptor
    ])), this._debugPushGroup?.("main pass", 0), this._timestampQuery.startPass(this._mainRenderPassWrapper.renderPassDescriptor, this._timestampIndex), this._currentRenderPass = this._renderEncoder.beginRenderPass(this._mainRenderPassWrapper.renderPassDescriptor), this._setDepthTextureFormat(this._mainRenderPassWrapper), this._setColorFormat(this._mainRenderPassWrapper), this._debugFlushPendingCommands?.(), this._resetRenderPassStates(), this._isStencilEnable || (this._stencilStateComposer.enabled = !1);
  }
  /** @internal */
  _endCurrentRenderPass() {
    if (!this._currentRenderPass)
      return 0;
    const e = this._currentPassIsMainPass() ? 2 : 1;
    return !this._snapshotRendering.endRenderPass(this._currentRenderPass) && !this.compatibilityMode && (this._bundleList.run(this._currentRenderPass), this._bundleList.reset()), this._currentRenderPass.end(), this._timestampQuery.endPass(this._timestampIndex, this._currentRenderTarget && this._currentRenderTarget.gpuTimeInFrame ? this._currentRenderTarget.gpuTimeInFrame : this.gpuTimeInFrameForMainPass), this._timestampIndex += 2, this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log("frame #" + this._count + " - " + (e === 2 ? "main" : "render target") + " end pass" + (e === 1 ? " - internalTexture.uniqueId=" + this._currentRenderTarget?.texture?.uniqueId : ""))), this._debugPopGroup?.(0), this._currentRenderPass = null, e;
  }
  /**
   * Binds the frame buffer to the specified texture.
   * @param texture The render target wrapper to render to
   * @param faceIndex The face of the texture to render to in case of cube texture
   * @param requiredWidth The width of the target to render to
   * @param requiredHeight The height of the target to render to
   * @param forceFullscreenViewport Forces the viewport to be the entire texture/screen if true
   * @param lodLevel defines the lod level to bind to the frame buffer
   * @param layer defines the 2d array index to bind to frame buffer to
   */
  bindFramebuffer(e, t = 0, r, n, s, o = 0, u = 0) {
    const l = e.texture?._hardwareTexture;
    this._currentRenderTarget ? this.unBindFramebuffer(this._currentRenderTarget) : this._endCurrentRenderPass(), this._currentRenderTarget = e;
    const c = this._currentRenderTarget._depthStencilTexture;
    this._rttRenderPassWrapper.colorAttachmentGPUTextures[0] = l, this._rttRenderPassWrapper.depthTextureFormat = c ? T.GetWebGPUTextureFormat(-1, c.format) : void 0, this._setDepthTextureFormat(this._rttRenderPassWrapper), this._setColorFormat(this._rttRenderPassWrapper), this._rttRenderPassWrapper.colorAttachmentViewDescriptor = {
      format: this._colorFormat,
      dimension: e.is3D ? I.E3d : I.E2d,
      mipLevelCount: 1,
      baseArrayLayer: e.isCube ? u * 6 + t : u,
      baseMipLevel: o,
      arrayLayerCount: 1,
      aspect: Z.All
    }, this._rttRenderPassWrapper.depthAttachmentViewDescriptor = {
      format: this._depthTextureFormat,
      dimension: c && c.is3D ? I.E3d : I.E2d,
      mipLevelCount: 1,
      baseArrayLayer: c ? c.isCube ? u * 6 + t : u : 0,
      baseMipLevel: 0,
      arrayLayerCount: 1,
      aspect: Z.All
    }, this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log([
      "frame #" + this._count + " - bindFramebuffer - rtt name=" + e.label + ", internalTexture.uniqueId=" + e.texture?.uniqueId + ", face=" + t + ", lodLevel=" + o + ", layer=" + u,
      "colorAttachmentViewDescriptor=",
      this._rttRenderPassWrapper.colorAttachmentViewDescriptor,
      "depthAttachmentViewDescriptor=",
      this._rttRenderPassWrapper.depthAttachmentViewDescriptor
    ])), this._cachedViewport && !s ? this.setViewport(this._cachedViewport, r, n) : (r || (r = e.width, o && (r = r / Math.pow(2, o))), n || (n = e.height, o && (n = n / Math.pow(2, o))), this._viewport(0, 0, r, n)), this.wipeCaches();
  }
  /**
   * Unbind the current render target texture from the WebGPU context
   * @param texture defines the render target wrapper to unbind
   * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
   * @param onBeforeUnbind defines a function which will be called before the effective unbind
   */
  unBindFramebuffer(e, t = !1, r) {
    const n = this._currentRenderTarget;
    this._currentRenderTarget = null, r && r(), this._currentRenderTarget = n, this._endCurrentRenderPass(), e.texture?.generateMipMaps && !t && !e.isCube && this._generateMipmaps(e.texture), this._currentRenderTarget = null, this.dbgVerboseLogsForFirstFrames && (this._count === void 0 && (this._count = 0), (!this._count || this._count < this.dbgVerboseLogsNumFrames) && y.Log("frame #" + this._count + " - unBindFramebuffer - rtt name=" + e.label + ", internalTexture.uniqueId=", e.texture?.uniqueId)), this._mrtAttachments = [], this._cacheRenderPipeline.setMRT([]), this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments);
  }
  /**
   * Unbind the current render target and bind the default framebuffer
   */
  restoreDefaultFramebuffer() {
    this._currentRenderTarget ? this.unBindFramebuffer(this._currentRenderTarget) : this._currentRenderPass || this._startMainRenderPass(!1), this._cachedViewport && this.setViewport(this._cachedViewport), this.wipeCaches();
  }
  //------------------------------------------------------------------------------
  //                              Render
  //------------------------------------------------------------------------------
  /**
   * @internal
   */
  _setColorFormat(e) {
    const t = e.colorAttachmentGPUTextures[0]?.format ?? null;
    this._cacheRenderPipeline.setColorFormat(t), this._colorFormat !== t && (this._colorFormat = t);
  }
  /**
   * @internal
   */
  _setDepthTextureFormat(e) {
    this._cacheRenderPipeline.setDepthStencilFormat(e.depthTextureFormat), this._depthTextureFormat !== e.depthTextureFormat && (this._depthTextureFormat = e.depthTextureFormat);
  }
  setDitheringState() {
  }
  setRasterizerState() {
  }
  /**
   * Set various states to the webGL context
   * @param culling defines culling state: true to enable culling, false to disable it
   * @param zOffset defines the value to apply to zOffset (0 by default)
   * @param force defines if states must be applied even if cache is up to date
   * @param reverseSide defines if culling must be reversed (CCW if false, CW if true)
   * @param cullBackFaces true to cull back faces, false to cull front faces (if culling is enabled)
   * @param stencil stencil states to set
   * @param zOffsetUnits defines the value to apply to zOffsetUnits (0 by default)
   */
  setState(e, t = 0, r, n = !1, s, o, u = 0) {
    (this._depthCullingState.cull !== e || r) && (this._depthCullingState.cull = e);
    const l = this.cullBackFaces ?? s ?? !0 ? 1 : 2;
    (this._depthCullingState.cullFace !== l || r) && (this._depthCullingState.cullFace = l), this.setZOffset(t), this.setZOffsetUnits(u);
    const c = n ? this._currentRenderTarget ? 1 : 2 : this._currentRenderTarget ? 2 : 1;
    (this._depthCullingState.frontFace !== c || r) && (this._depthCullingState.frontFace = c), this._stencilStateComposer.stencilMaterial = o;
  }
  _applyRenderPassChanges(e) {
    const t = this._stencilStateComposer.enabled ? this._mustUpdateStencilRef() : !1, r = this._alphaState.alphaBlend ? this._mustUpdateBlendColor() : !1;
    this._mustUpdateViewport() && this._applyViewport(e), this._mustUpdateScissor() && this._applyScissor(e), t && this._applyStencilRef(e), r && this._applyBlendColor(e);
  }
  _draw(e, t, r, n, s) {
    const o = this._getCurrentRenderPass(), u = this._bundleList;
    this.applyStates();
    const l = this._currentEffect._pipelineContext;
    if (this.bindUniformBufferBase(this._currentRenderTarget ? this._ubInvertY : this._ubDontInvertY, 0, L.InternalsUBOName), l.uniformBuffer && (l.uniformBuffer.update(), this.bindUniformBufferBase(l.uniformBuffer.getBuffer(), 0, L.LeftOvertUBOName)), this._snapshotRendering.play) {
      this._reportDrawCall();
      return;
    }
    !this.compatibilityMode && (this._currentDrawContext.isDirty(this._currentMaterialContext.updateId) || this._currentMaterialContext.isDirty || this._currentMaterialContext.forceBindGroupCreation) && (this._currentDrawContext.fastBundle = void 0);
    const c = !this.compatibilityMode && this._currentDrawContext.fastBundle;
    let h = o;
    if (c || this._snapshotRendering.record) {
      if (this._applyRenderPassChanges(u), !this._snapshotRendering.record) {
        this._counters.numBundleReuseNonCompatMode++, this._currentDrawContext.indirectDrawBuffer && this._currentDrawContext.setIndirectData(n, s || 1, r), u.addBundle(this._currentDrawContext.fastBundle), this._reportDrawCall();
        return;
      }
      h = u.getBundleEncoder(this._cacheRenderPipeline.colorFormats, this._depthTextureFormat, this.currentSampleCount), u.numDrawCalls++;
    }
    let d = 0;
    if (this._currentMaterialContext.hasFloatOrDepthTextures) {
      let p = 1;
      for (let x = 0; x < l.shaderProcessingContext.textureNames.length; ++x) {
        const S = l.shaderProcessingContext.textureNames[x], b = this._currentMaterialContext.textures[S]?.texture, v = b && b.format >= 13 && b.format <= 18;
        (b?.type === 1 && !this._caps.textureFloatLinearFiltering || v) && (d |= p), p = p << 1;
      }
    }
    this._currentMaterialContext.textureState = d;
    const f = this._cacheRenderPipeline.getRenderPipeline(t, this._currentEffect, this.currentSampleCount, d), _ = this._cacheBindGroups.getBindGroups(l, this._currentDrawContext, this._currentMaterialContext);
    this._snapshotRendering.record || (this._applyRenderPassChanges(this.compatibilityMode ? null : u), this.compatibilityMode || (this._counters.numBundleCreationNonCompatMode++, h = this._device.createRenderBundleEncoder({
      colorFormats: this._cacheRenderPipeline.colorFormats,
      depthStencilFormat: this._depthTextureFormat,
      sampleCount: T.GetSample(this.currentSampleCount)
    }))), h.setPipeline(f), this._currentIndexBuffer && h.setIndexBuffer(this._currentIndexBuffer.underlyingResource, this._currentIndexBuffer.is32Bits ? le.Uint32 : le.Uint16, 0);
    const m = this._cacheRenderPipeline.vertexBuffers;
    for (let p = 0; p < m.length; p++) {
      const x = m[p], S = x.effectiveBuffer;
      S && h.setVertexBuffer(p, S.underlyingResource, x._validOffsetRange ? 0 : x.byteOffset);
    }
    for (let p = 0; p < _.length; p++)
      h.setBindGroup(p, _[p]);
    const g = !this.compatibilityMode && !this._snapshotRendering.record;
    g && this._currentDrawContext.indirectDrawBuffer ? (this._currentDrawContext.setIndirectData(n, s || 1, r), e === 0 ? h.drawIndexedIndirect(this._currentDrawContext.indirectDrawBuffer, 0) : h.drawIndirect(this._currentDrawContext.indirectDrawBuffer, 0)) : e === 0 ? h.drawIndexed(n, s || 1, r, 0, 0) : h.draw(n, s || 1, r, 0), g && (this._currentDrawContext.fastBundle = h.finish(), u.addBundle(this._currentDrawContext.fastBundle)), this._reportDrawCall();
  }
  /**
   * Draw a list of indexed primitives
   * @param fillMode defines the primitive to use
   * @param indexStart defines the starting index
   * @param indexCount defines the number of index to draw
   * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
   */
  drawElementsType(e, t, r, n = 1) {
    this._draw(0, e, t, r, n);
  }
  /**
   * Draw a list of unindexed primitives
   * @param fillMode defines the primitive to use
   * @param verticesStart defines the index of first vertex to draw
   * @param verticesCount defines the count of vertices to draw
   * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
   */
  drawArraysType(e, t, r, n = 1) {
    this._currentIndexBuffer = null, this._draw(1, e, t, r, n);
  }
  //------------------------------------------------------------------------------
  //                              Dispose
  //------------------------------------------------------------------------------
  /**
   * Dispose and release all associated resources
   */
  dispose() {
    this._isDisposed = !0, this._timestampQuery.dispose(), this._mainTexture?.destroy(), this._depthTexture?.destroy(), this._textureHelper.destroyDeferredTextures(), this._bufferManager.destroyDeferredBuffers(), this._device.destroy(), super.dispose();
  }
  //------------------------------------------------------------------------------
  //                              Misc
  //------------------------------------------------------------------------------
  /**
   * Gets the current render width
   * @param useScreen defines if screen size must be used (or the current render target if any)
   * @returns a number defining the current render width
   */
  getRenderWidth(e = !1) {
    return !e && this._currentRenderTarget ? this._currentRenderTarget.width : this._renderingCanvas?.width ?? 0;
  }
  /**
   * Gets the current render height
   * @param useScreen defines if screen size must be used (or the current render target if any)
   * @returns a number defining the current render height
   */
  getRenderHeight(e = !1) {
    return !e && this._currentRenderTarget ? this._currentRenderTarget.height : this._renderingCanvas?.height ?? 0;
  }
  //------------------------------------------------------------------------------
  //                              Errors
  //------------------------------------------------------------------------------
  /**
   * Get the current error code of the WebGPU context
   * @returns the error code
   */
  getError() {
    return 0;
  }
  //------------------------------------------------------------------------------
  //                              Unused WebGPU
  //------------------------------------------------------------------------------
  /**
   * @internal
   */
  bindSamplers() {
  }
  /**
   * @internal
   */
  _bindTextureDirectly() {
    return !1;
  }
  /**
   * Gets a boolean indicating if all created effects are ready
   * @returns always true - No parallel shader compilation
   */
  areAllEffectsReady() {
    return !0;
  }
  /**
   * @internal
   */
  _executeWhenRenderingStateIsCompiled(e, t) {
    t();
  }
  /**
   * @internal
   */
  _isRenderingStateCompiled() {
    return !0;
  }
  /** @internal */
  _getUnpackAlignement() {
    return 1;
  }
  /**
   * @internal
   */
  _unpackFlipY() {
  }
  /**
   * @internal
   */
  _bindUnboundFramebuffer() {
    throw "_bindUnboundFramebuffer is not implementedin WebGPU! You probably want to use restoreDefaultFramebuffer or unBindFramebuffer instead";
  }
  // TODO WEBGPU. All of the below should go once engine split with baseEngine.
  /**
   * @internal
   */
  _getSamplingParameters() {
    throw "_getSamplingParameters is not available in WebGPU";
  }
  /**
   * @internal
   */
  getUniforms() {
    return [];
  }
  /**
   * @internal
   */
  setIntArray() {
    return !1;
  }
  /**
   * @internal
   */
  setIntArray2() {
    return !1;
  }
  /**
   * @internal
   */
  setIntArray3() {
    return !1;
  }
  /**
   * @internal
   */
  setIntArray4() {
    return !1;
  }
  /**
   * @internal
   */
  setArray() {
    return !1;
  }
  /**
   * @internal
   */
  setArray2() {
    return !1;
  }
  /**
   * @internal
   */
  setArray3() {
    return !1;
  }
  /**
   * @internal
   */
  setArray4() {
    return !1;
  }
  /**
   * @internal
   */
  setMatrices() {
    return !1;
  }
  /**
   * @internal
   */
  setMatrix3x3() {
    return !1;
  }
  /**
   * @internal
   */
  setMatrix2x2() {
    return !1;
  }
  /**
   * @internal
   */
  setFloat() {
    return !1;
  }
  /**
   * @internal
   */
  setFloat2() {
    return !1;
  }
  /**
   * @internal
   */
  setFloat3() {
    return !1;
  }
  /**
   * @internal
   */
  setFloat4() {
    return !1;
  }
}
re._GLSLslangDefaultOptions = {
  jsPath: `${oe._DefaultCdnUrl}/glslang/glslang.js`,
  wasmPath: `${oe._DefaultCdnUrl}/glslang/glslang.wasm`
};
re._InstanceId = 0;
re.UseTWGSL = !0;
const tn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  WebGPUEngine: re
}, Symbol.toStringTag, { value: "Module" }));
export {
  q as $,
  Re as A,
  w as B,
  ve as C,
  nt as D,
  Lr as E,
  ee as F,
  X as G,
  i as H,
  le as I,
  H as J,
  I as K,
  N as L,
  pe as M,
  Te as N,
  A as O,
  Ze as P,
  Ae as Q,
  rt as R,
  Le as S,
  F as T,
  U,
  D as V,
  Hr as W,
  J as X,
  ce as Y,
  Tr as Z,
  Ue as _,
  re as a,
  tn as a0,
  T as b,
  pt as c,
  _t as d,
  de as e,
  $ as f,
  ie as g,
  ae as h,
  Ke as i,
  et as j,
  O as k,
  Je as l,
  tt as m,
  xe as n,
  st as o,
  B as p,
  Ie as q,
  je as r,
  Xe as s,
  k as t,
  ue as u,
  se as v,
  K as w,
  Me as x,
  Y as y,
  Z as z
};
//# sourceMappingURL=webgpuEngine-B4qlMipo.js.map
