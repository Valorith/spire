import { x as s } from "./embed-entry-BKE21f6Q.js";
class g {
  /**
   * Creates a new instance
   * @param externalProperties list of external properties to inject into the object
   */
  constructor(e) {
    if (this._keys = [], this._isDirty = !0, this._areLightsDirty = !0, this._areLightsDisposed = !1, this._areAttributesDirty = !0, this._areTexturesDirty = !0, this._areFresnelDirty = !0, this._areMiscDirty = !0, this._arePrePassDirty = !0, this._areImageProcessingDirty = !0, this._normals = !1, this._uvs = !1, this._needNormals = !1, this._needUVs = !1, this._externalProperties = e, e)
      for (const t in e)
        Object.prototype.hasOwnProperty.call(e, t) && this._setDefaultValue(t);
  }
  /**
   * Specifies if the material needs to be re-calculated
   */
  get isDirty() {
    return this._isDirty;
  }
  /**
   * Marks the material to indicate that it has been re-calculated
   */
  markAsProcessed() {
    this._isDirty = !1, this._areAttributesDirty = !1, this._areTexturesDirty = !1, this._areFresnelDirty = !1, this._areLightsDirty = !1, this._areLightsDisposed = !1, this._areMiscDirty = !1, this._arePrePassDirty = !1, this._areImageProcessingDirty = !1;
  }
  /**
   * Marks the material to indicate that it needs to be re-calculated
   */
  markAsUnprocessed() {
    this._isDirty = !0;
  }
  /**
   * Marks the material to indicate all of its defines need to be re-calculated
   */
  markAllAsDirty() {
    this._areTexturesDirty = !0, this._areAttributesDirty = !0, this._areLightsDirty = !0, this._areFresnelDirty = !0, this._areMiscDirty = !0, this._arePrePassDirty = !1, this._areImageProcessingDirty = !0, this._isDirty = !0;
  }
  /**
   * Marks the material to indicate that image processing needs to be re-calculated
   */
  markAsImageProcessingDirty() {
    this._areImageProcessingDirty = !0, this._isDirty = !0;
  }
  /**
   * Marks the material to indicate the lights need to be re-calculated
   * @param disposed Defines whether the light is dirty due to dispose or not
   */
  markAsLightDirty(e = !1) {
    this._areLightsDirty = !0, this._areLightsDisposed = this._areLightsDisposed || e, this._isDirty = !0;
  }
  /**
   * Marks the attribute state as changed
   */
  markAsAttributesDirty() {
    this._areAttributesDirty = !0, this._isDirty = !0;
  }
  /**
   * Marks the texture state as changed
   */
  markAsTexturesDirty() {
    this._areTexturesDirty = !0, this._isDirty = !0;
  }
  /**
   * Marks the fresnel state as changed
   */
  markAsFresnelDirty() {
    this._areFresnelDirty = !0, this._isDirty = !0;
  }
  /**
   * Marks the misc state as changed
   */
  markAsMiscDirty() {
    this._areMiscDirty = !0, this._isDirty = !0;
  }
  /**
   * Marks the prepass state as changed
   */
  markAsPrePassDirty() {
    this._arePrePassDirty = !0, this._isDirty = !0;
  }
  /**
   * Rebuilds the material defines
   */
  rebuild() {
    this._keys.length = 0;
    for (const e of Object.keys(this))
      e[0] !== "_" && this._keys.push(e);
    if (this._externalProperties)
      for (const e in this._externalProperties)
        this._keys.indexOf(e) === -1 && this._keys.push(e);
  }
  /**
   * Specifies if two material defines are equal
   * @param other - A material define instance to compare to
   * @returns - Boolean indicating if the material defines are equal (true) or not (false)
   */
  isEqual(e) {
    if (this._keys.length !== e._keys.length)
      return !1;
    for (let t = 0; t < this._keys.length; t++) {
      const r = this._keys[t];
      if (this[r] !== e[r])
        return !1;
    }
    return !0;
  }
  /**
   * Clones this instance's defines to another instance
   * @param other - material defines to clone values to
   */
  cloneTo(e) {
    this._keys.length !== e._keys.length && (e._keys = this._keys.slice(0));
    for (let t = 0; t < this._keys.length; t++) {
      const r = this._keys[t];
      e[r] = this[r];
    }
  }
  /**
   * Resets the material define values
   */
  reset() {
    this._keys.forEach((e) => this._setDefaultValue(e));
  }
  _setDefaultValue(e) {
    const t = this._externalProperties?.[e]?.type ?? typeof this[e], r = this._externalProperties?.[e]?.default;
    switch (t) {
      case "number":
        this[e] = r ?? 0;
        break;
      case "string":
        this[e] = r ?? "";
        break;
      default:
        this[e] = r ?? !1;
        break;
    }
  }
  /**
   * Converts the material define values to a string
   * @returns - String of material define information
   */
  toString() {
    let e = "";
    for (let t = 0; t < this._keys.length; t++) {
      const r = this._keys[t], i = this[r];
      switch (typeof i) {
        case "number":
        case "string":
          e += "#define " + r + " " + i + `
`;
          break;
        default:
          i && (e += "#define " + r + `
`);
          break;
      }
    }
    return e;
  }
}
const o = "imageProcessingDeclaration", l = `#ifdef EXPOSURE
uniform float exposureLinear;
#endif
#ifdef CONTRAST
uniform float contrast;
#endif
#if defined(VIGNETTE) || defined(DITHER)
uniform vec2 vInverseScreenSize;
#endif
#ifdef VIGNETTE
uniform vec4 vignetteSettings1;uniform vec4 vignetteSettings2;
#endif
#ifdef COLORCURVES
uniform vec4 vCameraColorCurveNegative;uniform vec4 vCameraColorCurveNeutral;uniform vec4 vCameraColorCurvePositive;
#endif
#ifdef COLORGRADING
#ifdef COLORGRADING3D
uniform highp sampler3D txColorTransform;
#else
uniform sampler2D txColorTransform;
#endif
uniform vec4 colorTransformSettings;
#endif
#ifdef DITHER
uniform float ditherIntensity;
#endif
`;
s.IncludesShadersStore[o] = l;
const n = "imageProcessingFunctions", a = `#if defined(COLORGRADING) && !defined(COLORGRADING3D)
/** 
* Polyfill for SAMPLE_TEXTURE_3D,which is unsupported in WebGL.
* sampler3dSetting.x=textureOffset (0.5/textureSize).
* sampler3dSetting.y=textureSize.
*/
#define inline
vec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)
{float sliceSize=2.0*sampler3dSetting.x; 
#ifdef SAMPLER3DGREENDEPTH
float sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;
#else
float sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;
#endif
float sliceInteger=floor(sliceContinuous);float sliceFraction=sliceContinuous-sliceInteger;
#ifdef SAMPLER3DGREENDEPTH
vec2 sliceUV=color.rb;
#else
vec2 sliceUV=color.rg;
#endif
sliceUV.x*=sliceSize;sliceUV.x+=sliceInteger*sliceSize;sliceUV=saturate(sliceUV);vec4 slice0Color=texture2D(colorTransform,sliceUV);sliceUV.x+=sliceSize;sliceUV=saturate(sliceUV);vec4 slice1Color=texture2D(colorTransform,sliceUV);vec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);
#ifdef SAMPLER3DBGRMAP
color.rgb=result.rgb;
#else
color.rgb=result.bgr;
#endif
return color;}
#endif
#ifdef TONEMAPPING_ACES
const mat3 ACESInputMat=mat3(
vec3(0.59719,0.07600,0.02840),
vec3(0.35458,0.90834,0.13383),
vec3(0.04823,0.01566,0.83777)
);const mat3 ACESOutputMat=mat3(
vec3( 1.60475,-0.10208,-0.00327),
vec3(-0.53108, 1.10813,-0.07276),
vec3(-0.07367,-0.00605, 1.07602)
);vec3 RRTAndODTFit(vec3 v)
{vec3 a=v*(v+0.0245786)-0.000090537;vec3 b=v*(0.983729*v+0.4329510)+0.238081;return a/b;}
vec3 ACESFitted(vec3 color)
{color=ACESInputMat*color;color=RRTAndODTFit(color);color=ACESOutputMat*color;color=saturate(color);return color;}
#endif
#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_DEFINITIONS
vec4 applyImageProcessing(vec4 result) {
#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATSTART
#ifdef EXPOSURE
result.rgb*=exposureLinear;
#endif
#ifdef VIGNETTE
vec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;viewportXY=viewportXY*2.0-1.0;vec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);float vignetteTerm=dot(vignetteXY1,vignetteXY1);float vignette=pow(vignetteTerm,vignetteSettings2.w);vec3 vignetteColor=vignetteSettings2.rgb;
#ifdef VIGNETTEBLENDMODEMULTIPLY
vec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);result.rgb*=vignetteColorMultiplier;
#endif
#ifdef VIGNETTEBLENDMODEOPAQUE
result.rgb=mix(vignetteColor,result.rgb,vignette);
#endif
#endif
#ifdef TONEMAPPING
#ifdef TONEMAPPING_ACES
result.rgb=ACESFitted(result.rgb);
#else
const float tonemappingCalibration=1.590579;result.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);
#endif
#endif
result.rgb=toGammaSpace(result.rgb);result.rgb=saturate(result.rgb);
#ifdef CONTRAST
vec3 resultHighContrast=result.rgb*result.rgb*(3.0-2.0*result.rgb);if (contrast<1.0) {result.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);} else {result.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);}
#endif
#ifdef COLORGRADING
vec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;
#ifdef COLORGRADING3D
vec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;
#else
vec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;
#endif
result.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);
#endif
#ifdef COLORCURVES
float luma=getLuminance(result.rgb);vec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));vec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;result.rgb*=colorCurve.rgb;result.rgb=mix(vec3(luma),result.rgb,colorCurve.a);
#endif
#ifdef DITHER
float rand=getRand(gl_FragCoord.xy*vInverseScreenSize);float dither=mix(-ditherIntensity,ditherIntensity,rand);result.rgb=saturate(result.rgb+vec3(dither));
#endif
#define CUSTOM_IMAGEPROCESSINGFUNCTIONS_UPDATERESULT_ATEND
return result;}`;
s.IncludesShadersStore[n] = a;
export {
  g as M
};
//# sourceMappingURL=imageProcessingFunctions-DicDoEcN.js.map
