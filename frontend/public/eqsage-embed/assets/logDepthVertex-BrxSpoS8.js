import { x as e } from "./embed-entry-BKE21f6Q.js";
const t = "logDepthDeclaration", n = `#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;varying float vFragmentDepth;
#endif
`;
e.IncludesShadersStore[t] = n;
const o = "logDepthFragment", a = `#ifdef LOGARITHMICDEPTH
gl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;
#endif
`;
e.IncludesShadersStore[o] = a;
const r = "logDepthVertex", h = `#ifdef LOGARITHMICDEPTH
vFragmentDepth=1.0+gl_Position.w;gl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;
#endif
`;
e.IncludesShadersStore[r] = h;
//# sourceMappingURL=logDepthVertex-BrxSpoS8.js.map
