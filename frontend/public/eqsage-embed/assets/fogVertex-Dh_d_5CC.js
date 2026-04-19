import { x as o } from "./embed-entry-BgvWRWVI.js";
const e = "fogFragmentDeclaration", f = `#ifdef FOG
#define FOGMODE_NONE 0.
#define FOGMODE_EXP 1.
#define FOGMODE_EXP2 2.
#define FOGMODE_LINEAR 3.
#define E 2.71828
uniform vec4 vFogInfos;uniform vec3 vFogColor;varying vec3 vFogDistance;float CalcFogFactor()
{float fogCoeff=1.0;float fogStart=vFogInfos.y;float fogEnd=vFogInfos.z;float fogDensity=vFogInfos.w;float fogDistance=length(vFogDistance);if (FOGMODE_LINEAR==vFogInfos.x)
{fogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);}
else if (FOGMODE_EXP==vFogInfos.x)
{fogCoeff=1.0/pow(E,fogDistance*fogDensity);}
else if (FOGMODE_EXP2==vFogInfos.x)
{fogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);}
return clamp(fogCoeff,0.0,1.0);}
#endif
`;
o.IncludesShadersStore[e] = f;
const n = "fogFragment", g = `#ifdef FOG
float fog=CalcFogFactor();
#ifdef PBR
fog=toLinearSpace(fog);
#endif
color.rgb=mix(vFogColor,color.rgb,fog);
#endif
`;
o.IncludesShadersStore[n] = g;
const t = "fogVertexDeclaration", a = `#ifdef FOG
varying vec3 vFogDistance;
#endif
`;
o.IncludesShadersStore[t] = a;
const s = "fogVertex", i = `#ifdef FOG
vFogDistance=(view*worldPos).xyz;
#endif
`;
o.IncludesShadersStore[s] = i;
//# sourceMappingURL=fogVertex-Dh_d_5CC.js.map
