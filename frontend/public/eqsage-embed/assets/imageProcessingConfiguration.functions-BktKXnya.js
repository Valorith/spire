function t(r) {
  r.push("vCameraColorCurveNeutral", "vCameraColorCurvePositive", "vCameraColorCurveNegative");
}
function a(r, e) {
  e.EXPOSURE && r.push("exposureLinear"), e.CONTRAST && r.push("contrast"), e.COLORGRADING && r.push("colorTransformSettings"), (e.VIGNETTE || e.DITHER) && r.push("vInverseScreenSize"), e.VIGNETTE && (r.push("vignetteSettings1"), r.push("vignetteSettings2")), e.COLORCURVES && t(r), e.DITHER && r.push("ditherIntensity");
}
function o(r, e) {
  e.COLORGRADING && r.push("txColorTransform");
}
export {
  a as P,
  o as a,
  t as b
};
//# sourceMappingURL=imageProcessingConfiguration.functions-BktKXnya.js.map
