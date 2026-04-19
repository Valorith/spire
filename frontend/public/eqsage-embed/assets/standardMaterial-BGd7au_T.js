import { x as A, h as R, M as X, V as L, b as r, ab as h, t as n, q as M, c as u, am as N, R as Y } from "./embed-entry-BKE21f6Q.js";
import { S as z } from "./smartArray-BXymNR-c.js";
import { I as O, a as H } from "./scene-BIBh3wH1.js";
import { D as Q, P as B, M as f } from "./material.detailMapConfiguration-rrMjaWiY.js";
import { M as b, a as W } from "./material-D3PM2aZM.js";
import { M as j } from "./imageProcessingFunctions-DicDoEcN.js";
import { P as K } from "./vertexColorMixing-CFfOxziL.js";
import { T as m } from "./texture-BWPw_5Qg.js";
import "./helperFunctions-D_BKtoXY.js";
import "./clipPlaneVertex-kcGv58C0.js";
import "./logDepthVertex-BrxSpoS8.js";
import "./fogVertex-CURXdlyC.js";
import { E as $ } from "./effectFallbacks-Bjk8RG3S.js";
import "./morphTargetsVertex-BCjQUpIx.js";
import { i as Z, j as J, k as q, l as ee, m as I, n as ie, o as te, q as re, H as se, r as ae, s as oe, t as ne, a as le, u as fe, b as ue, c as ce, v as C, d as de, w as Ee, f as me, g as he, e as pe } from "./materialHelper.functions-H397-pN5.js";
import { S as w } from "./decorators.serialization-DfmppPDN.js";
const Te = "defaultFragmentDeclaration", Ae = `uniform vec4 vEyePosition;uniform vec4 vDiffuseColor;
#ifdef SPECULARTERM
uniform vec4 vSpecularColor;
#endif
uniform vec3 vEmissiveColor;uniform vec3 vAmbientColor;uniform float visibility;
#ifdef DIFFUSE
uniform vec2 vDiffuseInfos;
#endif
#ifdef AMBIENT
uniform vec2 vAmbientInfos;
#endif
#ifdef OPACITY 
uniform vec2 vOpacityInfos;
#endif
#ifdef EMISSIVE
uniform vec2 vEmissiveInfos;
#endif
#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;
#endif
#ifdef BUMP
uniform vec3 vBumpInfos;uniform vec2 vTangentSpaceParams;
#endif
#ifdef ALPHATEST
uniform float alphaCutOff;
#endif
#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION) || defined(PREPASS)
uniform mat4 view;
#endif
#ifdef REFRACTION
uniform vec4 vRefractionInfos;
#ifndef REFRACTIONMAP_3D
uniform mat4 refractionMatrix;
#endif
#ifdef REFRACTIONFRESNEL
uniform vec4 refractionLeftColor;uniform vec4 refractionRightColor;
#endif
#if defined(USE_LOCAL_REFRACTIONMAP_CUBIC) && defined(REFRACTIONMAP_3D)
uniform vec3 vRefractionPosition;uniform vec3 vRefractionSize; 
#endif
#endif
#if defined(SPECULAR) && defined(SPECULARTERM)
uniform vec2 vSpecularInfos;
#endif
#ifdef DIFFUSEFRESNEL
uniform vec4 diffuseLeftColor;uniform vec4 diffuseRightColor;
#endif
#ifdef OPACITYFRESNEL
uniform vec4 opacityParts;
#endif
#ifdef EMISSIVEFRESNEL
uniform vec4 emissiveLeftColor;uniform vec4 emissiveRightColor;
#endif
#ifdef REFLECTION
uniform vec2 vReflectionInfos;
#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION) || defined(REFLECTIONMAP_EQUIRECTANGULAR) || defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_SKYBOX)
uniform mat4 reflectionMatrix;
#endif
#ifndef REFLECTIONMAP_SKYBOX
#if defined(USE_LOCAL_REFLECTIONMAP_CUBIC) && defined(REFLECTIONMAP_CUBIC)
uniform vec3 vReflectionPosition;uniform vec3 vReflectionSize; 
#endif
#endif
#ifdef REFLECTIONFRESNEL
uniform vec4 reflectionLeftColor;uniform vec4 reflectionRightColor;
#endif
#endif
#ifdef DETAIL
uniform vec4 vDetailInfos;
#endif
#include<decalFragmentDeclaration>
#define ADDITIONAL_FRAGMENT_DECLARATION
`;
A.IncludesShadersStore[Te] = Ae;
const _e = "defaultUboDeclaration", Re = `layout(std140,column_major) uniform;uniform Material
{vec4 diffuseLeftColor;vec4 diffuseRightColor;vec4 opacityParts;vec4 reflectionLeftColor;vec4 reflectionRightColor;vec4 refractionLeftColor;vec4 refractionRightColor;vec4 emissiveLeftColor;vec4 emissiveRightColor;vec2 vDiffuseInfos;vec2 vAmbientInfos;vec2 vOpacityInfos;vec2 vReflectionInfos;vec3 vReflectionPosition;vec3 vReflectionSize;vec2 vEmissiveInfos;vec2 vLightmapInfos;vec2 vSpecularInfos;vec3 vBumpInfos;mat4 diffuseMatrix;mat4 ambientMatrix;mat4 opacityMatrix;mat4 reflectionMatrix;mat4 emissiveMatrix;mat4 lightmapMatrix;mat4 specularMatrix;mat4 bumpMatrix;vec2 vTangentSpaceParams;float pointSize;float alphaCutOff;mat4 refractionMatrix;vec4 vRefractionInfos;vec3 vRefractionPosition;vec3 vRefractionSize;vec4 vSpecularColor;vec3 vEmissiveColor;vec4 vDiffuseColor;vec3 vAmbientColor;
#define ADDITIONAL_UBO_DECLARATION
};
#include<sceneUboDeclaration>
#include<meshUboDeclaration>
`;
A.IncludesShadersStore[_e] = Re;
const Ie = "lightsFragmentFunctions", Ce = `struct lightingInfo
{vec3 diffuse;
#ifdef SPECULARTERM
vec3 specular;
#endif
#ifdef NDOTL
float ndl;
#endif
};lightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {lightingInfo result;vec3 lightVectorW;float attenuation=1.0;if (lightData.w==0.)
{vec3 direction=lightData.xyz-vPositionW;attenuation=max(0.,1.0-length(direction)/range);lightVectorW=normalize(direction);}
else
{lightVectorW=normalize(-lightData.xyz);}
float ndl=max(0.,dot(vNormal,lightVectorW));
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=ndl*diffuseColor*attenuation;
#ifdef SPECULARTERM
vec3 angleW=normalize(viewDirectionW+lightVectorW);float specComp=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor*attenuation;
#endif
return result;}
lightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {lightingInfo result;vec3 direction=lightData.xyz-vPositionW;vec3 lightVectorW=normalize(direction);float attenuation=max(0.,1.0-length(direction)/range);float cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));if (cosAngle>=lightDirection.w)
{cosAngle=max(0.,pow(cosAngle,lightData.w));attenuation*=cosAngle;float ndl=max(0.,dot(vNormal,lightVectorW));
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=ndl*diffuseColor*attenuation;
#ifdef SPECULARTERM
vec3 angleW=normalize(viewDirectionW+lightVectorW);float specComp=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor*attenuation;
#endif
return result;}
result.diffuse=vec3(0.);
#ifdef SPECULARTERM
result.specular=vec3(0.);
#endif
#ifdef NDOTL
result.ndl=0.;
#endif
return result;}
lightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {lightingInfo result;float ndl=dot(vNormal,lightData.xyz)*0.5+0.5;
#ifdef NDOTL
result.ndl=ndl;
#endif
result.diffuse=mix(groundColor,diffuseColor,ndl);
#ifdef SPECULARTERM
vec3 angleW=normalize(viewDirectionW+lightData.xyz);float specComp=max(0.,dot(vNormal,angleW));specComp=pow(specComp,max(1.,glossiness));result.specular=specComp*specularColor;
#endif
return result;}
#define inline
vec3 computeProjectionTextureDiffuseLighting(sampler2D projectionLightSampler,mat4 textureProjectionMatrix){vec4 strq=textureProjectionMatrix*vec4(vPositionW,1.0);strq/=strq.w;vec3 textureColor=texture2D(projectionLightSampler,strq.xy).rgb;return textureColor;}`;
A.IncludesShadersStore[Ie] = Ce;
const ve = "fresnelFunction", Pe = `#ifdef FRESNEL
float computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)
{float fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);return clamp(fresnelTerm,0.,1.);}
#endif
`;
A.IncludesShadersStore[ve] = Pe;
const ge = "defaultPixelShader", Se = `#include<__decl__defaultFragment>
#if defined(BUMP) || !defined(NORMAL)
#extension GL_OES_standard_derivatives : enable
#endif
#include<prePassDeclaration>[SCENE_MRT_COUNT]
#include<oitDeclaration>
#define CUSTOM_FRAGMENT_BEGIN
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#include<mainUVVaryingDeclaration>[1..7]
#include<helperFunctions>
#include<__decl__lightFragment>[0..maxSimultaneousLights]
#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>
#include<samplerFragmentDeclaration>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse,_SAMPLERNAME_,diffuse)
#include<samplerFragmentDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_SAMPLERNAME_,ambient)
#include<samplerFragmentDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_SAMPLERNAME_,opacity)
#include<samplerFragmentDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_SAMPLERNAME_,emissive)
#include<samplerFragmentDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_SAMPLERNAME_,lightmap)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_SAMPLERNAME_,decal)
#ifdef REFRACTION
#ifdef REFRACTIONMAP_3D
uniform samplerCube refractionCubeSampler;
#else
uniform sampler2D refraction2DSampler;
#endif
#endif
#if defined(SPECULARTERM)
#include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular,_SAMPLERNAME_,specular)
#endif
#include<fresnelFunction>
#ifdef REFLECTION
#ifdef REFLECTIONMAP_3D
uniform samplerCube reflectionCubeSampler;
#else
uniform sampler2D reflection2DSampler;
#endif
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#else
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#endif
#include<reflectionFunction>
#endif
#include<imageProcessingDeclaration>
#include<imageProcessingFunctions>
#include<bumpFragmentMainFunctions>
#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
#include<clipPlaneFragment>
vec3 viewDirectionW=normalize(vEyePosition.xyz-vPositionW);vec4 baseColor=vec4(1.,1.,1.,1.);vec3 diffuseColor=vDiffuseColor.rgb;float alpha=vDiffuseColor.a;
#ifdef NORMAL
vec3 normalW=normalize(vNormalW);
#else
vec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));
#endif
#include<bumpFragment>
#ifdef TWOSIDEDLIGHTING
normalW=gl_FrontFacing ? normalW : -normalW;
#endif
#ifdef DIFFUSE
baseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);
#if defined(ALPHATEST) && !defined(ALPHATEST_AFTERALLALPHACOMPUTATIONS)
if (baseColor.a<alphaCutOff)
discard;
#endif
#ifdef ALPHAFROMDIFFUSE
alpha*=baseColor.a;
#endif
#define CUSTOM_FRAGMENT_UPDATE_ALPHA
baseColor.rgb*=vDiffuseInfos.y;
#endif
#if defined(DECAL) && !defined(DECAL_AFTER_DETAIL)
vec4 decalColor=texture2D(decalSampler,vDecalUV+uvOffset);
#include<decalFragment>(surfaceAlbedo,baseColor,GAMMADECAL,_GAMMADECAL_NOTUSED_)
#endif
#include<depthPrePass>
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
baseColor.rgb*=vColor.rgb;
#endif
#ifdef DETAIL
baseColor.rgb=baseColor.rgb*2.0*mix(0.5,detailColor.r,vDetailInfos.y);
#endif
#if defined(DECAL) && defined(DECAL_AFTER_DETAIL)
vec4 decalColor=texture2D(decalSampler,vDecalUV+uvOffset);
#include<decalFragment>(surfaceAlbedo,baseColor,GAMMADECAL,_GAMMADECAL_NOTUSED_)
#endif
#define CUSTOM_FRAGMENT_UPDATE_DIFFUSE
vec3 baseAmbientColor=vec3(1.,1.,1.);
#ifdef AMBIENT
baseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;
#endif
#define CUSTOM_FRAGMENT_BEFORE_LIGHTS
#ifdef SPECULARTERM
float glossiness=vSpecularColor.a;vec3 specularColor=vSpecularColor.rgb;
#ifdef SPECULAR
vec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);specularColor=specularMapColor.rgb;
#ifdef GLOSSINESS
glossiness=glossiness*specularMapColor.a;
#endif
#endif
#else
float glossiness=0.;
#endif
vec3 diffuseBase=vec3(0.,0.,0.);lightingInfo info;
#ifdef SPECULARTERM
vec3 specularBase=vec3(0.,0.,0.);
#endif
float shadow=1.;float aggShadow=0.;float numLights=0.;
#ifdef LIGHTMAP
vec4 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset);
#ifdef RGBDLIGHTMAP
lightmapColor.rgb=fromRGBD(lightmapColor);
#endif
lightmapColor.rgb*=vLightmapInfos.y;
#endif
#include<lightFragment>[0..maxSimultaneousLights]
aggShadow=aggShadow/numLights;vec4 refractionColor=vec4(0.,0.,0.,1.);
#ifdef REFRACTION
vec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));
#ifdef REFRACTIONMAP_3D
#ifdef USE_LOCAL_REFRACTIONMAP_CUBIC
refractionVector=parallaxCorrectNormal(vPositionW,refractionVector,vRefractionSize,vRefractionPosition);
#endif
refractionVector.y=refractionVector.y*vRefractionInfos.w;vec4 refractionLookup=textureCube(refractionCubeSampler,refractionVector);if (dot(refractionVector,viewDirectionW)<1.0) {refractionColor=refractionLookup;}
#else
vec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));vec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;refractionCoords.y=1.0-refractionCoords.y;refractionColor=texture2D(refraction2DSampler,refractionCoords);
#endif
#ifdef RGBDREFRACTION
refractionColor.rgb=fromRGBD(refractionColor);
#endif
#ifdef IS_REFRACTION_LINEAR
refractionColor.rgb=toGammaSpace(refractionColor.rgb);
#endif
refractionColor.rgb*=vRefractionInfos.x;
#endif
vec4 reflectionColor=vec4(0.,0.,0.,1.);
#ifdef REFLECTION
vec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);
#ifdef REFLECTIONMAP_OPPOSITEZ
vReflectionUVW.z*=-1.0;
#endif
#ifdef REFLECTIONMAP_3D
#ifdef ROUGHNESS
float bias=vReflectionInfos.y;
#ifdef SPECULARTERM
#ifdef SPECULAR
#ifdef GLOSSINESS
bias*=(1.0-specularMapColor.a);
#endif
#endif
#endif
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias);
#else
reflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW);
#endif
#else
vec2 coords=vReflectionUVW.xy;
#ifdef REFLECTIONMAP_PROJECTION
coords/=vReflectionUVW.z;
#endif
coords.y=1.0-coords.y;reflectionColor=texture2D(reflection2DSampler,coords);
#endif
#ifdef RGBDREFLECTION
reflectionColor.rgb=fromRGBD(reflectionColor);
#endif
#ifdef IS_REFLECTION_LINEAR
reflectionColor.rgb=toGammaSpace(reflectionColor.rgb);
#endif
reflectionColor.rgb*=vReflectionInfos.x;
#ifdef REFLECTIONFRESNEL
float reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);
#ifdef REFLECTIONFRESNELFROMSPECULAR
#ifdef SPECULARTERM
reflectionColor.rgb*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;
#else
reflectionColor.rgb*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;
#endif
#else
reflectionColor.rgb*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;
#endif
#endif
#endif
#ifdef REFRACTIONFRESNEL
float refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);refractionColor.rgb*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;
#endif
#ifdef OPACITY
vec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);
#ifdef OPACITYRGB
opacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);alpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;
#else
alpha*=opacityMap.a*vOpacityInfos.y;
#endif
#endif
#if defined(VERTEXALPHA) || defined(INSTANCESCOLOR) && defined(INSTANCES)
alpha*=vColor.a;
#endif
#ifdef OPACITYFRESNEL
float opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);alpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;
#endif
#ifdef ALPHATEST
#ifdef ALPHATEST_AFTERALLALPHACOMPUTATIONS
if (alpha<alphaCutOff)
discard;
#endif
#ifndef ALPHABLEND
alpha=1.0;
#endif
#endif
vec3 emissiveColor=vEmissiveColor;
#ifdef EMISSIVE
emissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;
#endif
#ifdef EMISSIVEFRESNEL
float emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);emissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;
#endif
#ifdef DIFFUSEFRESNEL
float diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);diffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;
#endif
#ifdef EMISSIVEASILLUMINATION
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;
#else
#ifdef LINKEMISSIVEWITHDIFFUSE
vec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;
#else
vec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;
#endif
#endif
#ifdef SPECULARTERM
vec3 finalSpecular=specularBase*specularColor;
#ifdef SPECULAROVERALPHA
alpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);
#endif
#else
vec3 finalSpecular=vec3(0.0);
#endif
#ifdef REFLECTIONOVERALPHA
alpha=clamp(alpha+dot(reflectionColor.rgb,vec3(0.3,0.59,0.11)),0.,1.);
#endif
#ifdef EMISSIVEASILLUMINATION
vec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor.rgb+emissiveColor+refractionColor.rgb,0.0,1.0),alpha);
#else
vec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor.rgb+refractionColor.rgb,alpha);
#endif
#ifdef LIGHTMAP
#ifndef LIGHTMAPEXCLUDED
#ifdef USELIGHTMAPASSHADOWMAP
color.rgb*=lightmapColor.rgb;
#else
color.rgb+=lightmapColor.rgb;
#endif
#endif
#endif
#define CUSTOM_FRAGMENT_BEFORE_FOG
color.rgb=max(color.rgb,0.);
#include<logDepthFragment>
#include<fogFragment>
#ifdef IMAGEPROCESSINGPOSTPROCESS
color.rgb=toLinearSpace(color.rgb);
#else
#ifdef IMAGEPROCESSING
color.rgb=toLinearSpace(color.rgb);color=applyImageProcessing(color);
#endif
#endif
color.a*=visibility;
#ifdef PREMULTIPLYALPHA
color.rgb*=color.a;
#endif
#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR
#ifdef PREPASS
float writeGeometryInfo=color.a>0.4 ? 1.0 : 0.0;gl_FragData[0]=color; 
#ifdef PREPASS_POSITION
gl_FragData[PREPASS_POSITION_INDEX]=vec4(vPositionW,writeGeometryInfo);
#endif
#ifdef PREPASS_VELOCITY
vec2 a=(vCurrentPosition.xy/vCurrentPosition.w)*0.5+0.5;vec2 b=(vPreviousPosition.xy/vPreviousPosition.w)*0.5+0.5;vec2 velocity=abs(a-b);velocity=vec2(pow(velocity.x,1.0/3.0),pow(velocity.y,1.0/3.0))*sign(a-b)*0.5+0.5;gl_FragData[PREPASS_VELOCITY_INDEX]=vec4(velocity,0.0,writeGeometryInfo);
#endif
#ifdef PREPASS_IRRADIANCE
gl_FragData[PREPASS_IRRADIANCE_INDEX]=vec4(0.0,0.0,0.0,writeGeometryInfo); 
#endif
#ifdef PREPASS_DEPTH
gl_FragData[PREPASS_DEPTH_INDEX]=vec4(vViewPos.z,0.0,0.0,writeGeometryInfo); 
#endif
#ifdef PREPASS_NORMAL
#ifdef PREPASS_NORMAL_WORLDSPACE
gl_FragData[PREPASS_NORMAL_INDEX]=vec4(normalW,writeGeometryInfo); 
#else
gl_FragData[PREPASS_NORMAL_INDEX]=vec4(normalize((view*vec4(normalW,0.0)).rgb),writeGeometryInfo); 
#endif
#endif
#ifdef PREPASS_ALBEDO_SQRT
gl_FragData[PREPASS_ALBEDO_SQRT_INDEX]=vec4(0.0,0.0,0.0,writeGeometryInfo); 
#endif
#ifdef PREPASS_REFLECTIVITY
#if defined(SPECULARTERM)
#if defined(SPECULAR)
gl_FragData[PREPASS_REFLECTIVITY_INDEX]=vec4(toLinearSpace(specularMapColor))*writeGeometryInfo; 
#else
gl_FragData[PREPASS_REFLECTIVITY_INDEX]=vec4(toLinearSpace(specularColor),1.0)*writeGeometryInfo;
#endif
#else
gl_FragData[PREPASS_REFLECTIVITY_INDEX]=vec4(0.0,0.0,0.0,1.0)*writeGeometryInfo;
#endif
#endif
#endif
#if !defined(PREPASS) || defined(WEBGL2)
gl_FragColor=color;
#endif
#include<oitFragment>
#if ORDER_INDEPENDENT_TRANSPARENCY
if (fragDepth==nearestDepth) {frontColor.rgb+=color.rgb*color.a*alphaMultiplier;frontColor.a=1.0-alphaMultiplier*(1.0-color.a);} else {backColor+=color;}
#endif
#define CUSTOM_FRAGMENT_MAIN_END
}
`;
A.ShadersStore[ge] = Se;
const Ne = "defaultVertexDeclaration", xe = `uniform mat4 viewProjection;uniform mat4 view;
#ifdef DIFFUSE
uniform mat4 diffuseMatrix;uniform vec2 vDiffuseInfos;
#endif
#ifdef AMBIENT
uniform mat4 ambientMatrix;uniform vec2 vAmbientInfos;
#endif
#ifdef OPACITY
uniform mat4 opacityMatrix;uniform vec2 vOpacityInfos;
#endif
#ifdef EMISSIVE
uniform vec2 vEmissiveInfos;uniform mat4 emissiveMatrix;
#endif
#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;uniform mat4 lightmapMatrix;
#endif
#if defined(SPECULAR) && defined(SPECULARTERM)
uniform vec2 vSpecularInfos;uniform mat4 specularMatrix;
#endif
#ifdef BUMP
uniform vec3 vBumpInfos;uniform mat4 bumpMatrix;
#endif
#ifdef REFLECTION
uniform mat4 reflectionMatrix;
#endif
#ifdef POINTSIZE
uniform float pointSize;
#endif
#ifdef DETAIL
uniform vec4 vDetailInfos;uniform mat4 detailMatrix;
#endif
#include<decalVertexDeclaration>
#define ADDITIONAL_VERTEX_DECLARATION
`;
A.IncludesShadersStore[Ne] = xe;
const Le = "pointCloudVertex", Me = `#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
`;
A.IncludesShadersStore[Le] = Me;
const Fe = "defaultVertexShader", Oe = `#include<__decl__defaultVertex>
#define CUSTOM_VERTEX_BEGIN
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef TANGENT
attribute vec4 tangent;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#include<uvAttributeDeclaration>[2..7]
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif
#include<helperFunctions>
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>
#include<prePassVertexDeclaration>
#include<mainUVVaryingDeclaration>[1..7]
#include<samplerVertexDeclaration>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse)
#include<samplerVertexDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail)
#include<samplerVertexDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient)
#include<samplerVertexDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity)
#include<samplerVertexDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive)
#include<samplerVertexDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap)
#if defined(SPECULARTERM)
#include<samplerVertexDeclaration>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular)
#endif
#include<samplerVertexDeclaration>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump)
#include<samplerVertexDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal)
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif
#include<bumpVertexDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightVxFragment>[0..maxSimultaneousLights]
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
varying vec3 vPositionUVW;
#endif
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
varying vec3 vDirectionW;
#endif
#include<logDepthDeclaration>
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vec3 positionUpdated=position;
#ifdef NORMAL
vec3 normalUpdated=normal;
#endif
#ifdef TANGENT
vec4 tangentUpdated=tangent;
#endif
#ifdef UV1
vec2 uvUpdated=uv;
#endif
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#ifdef REFLECTIONMAP_SKYBOX
vPositionUVW=positionUpdated;
#endif
#define CUSTOM_VERTEX_UPDATE_POSITION
#define CUSTOM_VERTEX_UPDATE_NORMAL
#include<instancesVertex>
#if defined(PREPASS) && defined(PREPASS_VELOCITY) && !defined(BONES_VELOCITY_ENABLED)
vCurrentPosition=viewProjection*finalWorld*vec4(positionUpdated,1.0);vPreviousPosition=previousViewProjection*finalPreviousWorld*vec4(positionUpdated,1.0);
#endif
#include<bonesVertex>
#include<bakedVertexAnimation>
vec4 worldPos=finalWorld*vec4(positionUpdated,1.0);
#ifdef NORMAL
mat3 normalWorld=mat3(finalWorld);
#if defined(INSTANCES) && defined(THIN_INSTANCES)
vNormalW=normalUpdated/vec3(dot(normalWorld[0],normalWorld[0]),dot(normalWorld[1],normalWorld[1]),dot(normalWorld[2],normalWorld[2]));vNormalW=normalize(normalWorld*vNormalW);
#else
#ifdef NONUNIFORMSCALING
normalWorld=transposeMat3(inverseMat3(normalWorld));
#endif
vNormalW=normalize(normalWorld*normalUpdated);
#endif
#endif
#define CUSTOM_VERTEX_UPDATE_WORLDPOS
#ifdef MULTIVIEW
if (gl_ViewID_OVR==0u) {gl_Position=viewProjection*worldPos;} else {gl_Position=viewProjectionR*worldPos;}
#else
gl_Position=viewProjection*worldPos;
#endif
vPositionW=vec3(worldPos);
#include<prePassVertex>
#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
vDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));
#endif
#ifndef UV1
vec2 uvUpdated=vec2(0.,0.);
#endif
#ifdef MAINUV1
vMainUV1=uvUpdated;
#endif
#include<uvVariableDeclaration>[2..7]
#include<samplerVertexImplementation>(_DEFINENAME_,DIFFUSE,_VARYINGNAME_,Diffuse,_MATRIXNAME_,diffuse,_INFONAME_,DiffuseInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_MATRIXNAME_,detail,_INFONAME_,DetailInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_MATRIXNAME_,ambient,_INFONAME_,AmbientInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_MATRIXNAME_,opacity,_INFONAME_,OpacityInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_MATRIXNAME_,emissive,_INFONAME_,EmissiveInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_MATRIXNAME_,lightmap,_INFONAME_,LightmapInfos.x)
#if defined(SPECULARTERM)
#include<samplerVertexImplementation>(_DEFINENAME_,SPECULAR,_VARYINGNAME_,Specular,_MATRIXNAME_,specular,_INFONAME_,SpecularInfos.x)
#endif
#include<samplerVertexImplementation>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_MATRIXNAME_,bump,_INFONAME_,BumpInfos.x)
#include<samplerVertexImplementation>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_MATRIXNAME_,decal,_INFONAME_,DecalInfos.x)
#include<bumpVertex>
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]
#include<vertexColorMixing>
#include<pointCloudVertex>
#include<logDepthVertex>
#define CUSTOM_VERTEX_MAIN_END
}
`;
A.ShadersStore[Fe] = Oe;
const D = { effect: null, subMesh: null };
class be extends j {
  /**
   * Initializes the Standard Material defines.
   * @param externalProperties The external properties
   */
  constructor(i) {
    super(i), this.MAINUV1 = !1, this.MAINUV2 = !1, this.MAINUV3 = !1, this.MAINUV4 = !1, this.MAINUV5 = !1, this.MAINUV6 = !1, this.DIFFUSE = !1, this.DIFFUSEDIRECTUV = 0, this.BAKED_VERTEX_ANIMATION_TEXTURE = !1, this.AMBIENT = !1, this.AMBIENTDIRECTUV = 0, this.OPACITY = !1, this.OPACITYDIRECTUV = 0, this.OPACITYRGB = !1, this.REFLECTION = !1, this.EMISSIVE = !1, this.EMISSIVEDIRECTUV = 0, this.SPECULAR = !1, this.SPECULARDIRECTUV = 0, this.BUMP = !1, this.BUMPDIRECTUV = 0, this.PARALLAX = !1, this.PARALLAX_RHS = !1, this.PARALLAXOCCLUSION = !1, this.SPECULAROVERALPHA = !1, this.CLIPPLANE = !1, this.CLIPPLANE2 = !1, this.CLIPPLANE3 = !1, this.CLIPPLANE4 = !1, this.CLIPPLANE5 = !1, this.CLIPPLANE6 = !1, this.ALPHATEST = !1, this.DEPTHPREPASS = !1, this.ALPHAFROMDIFFUSE = !1, this.POINTSIZE = !1, this.FOG = !1, this.SPECULARTERM = !1, this.DIFFUSEFRESNEL = !1, this.OPACITYFRESNEL = !1, this.REFLECTIONFRESNEL = !1, this.REFRACTIONFRESNEL = !1, this.EMISSIVEFRESNEL = !1, this.FRESNEL = !1, this.NORMAL = !1, this.TANGENT = !1, this.UV1 = !1, this.UV2 = !1, this.UV3 = !1, this.UV4 = !1, this.UV5 = !1, this.UV6 = !1, this.VERTEXCOLOR = !1, this.VERTEXALPHA = !1, this.NUM_BONE_INFLUENCERS = 0, this.BonesPerMesh = 0, this.BONETEXTURE = !1, this.BONES_VELOCITY_ENABLED = !1, this.INSTANCES = !1, this.THIN_INSTANCES = !1, this.INSTANCESCOLOR = !1, this.GLOSSINESS = !1, this.ROUGHNESS = !1, this.EMISSIVEASILLUMINATION = !1, this.LINKEMISSIVEWITHDIFFUSE = !1, this.REFLECTIONFRESNELFROMSPECULAR = !1, this.LIGHTMAP = !1, this.LIGHTMAPDIRECTUV = 0, this.OBJECTSPACE_NORMALMAP = !1, this.USELIGHTMAPASSHADOWMAP = !1, this.REFLECTIONMAP_3D = !1, this.REFLECTIONMAP_SPHERICAL = !1, this.REFLECTIONMAP_PLANAR = !1, this.REFLECTIONMAP_CUBIC = !1, this.USE_LOCAL_REFLECTIONMAP_CUBIC = !1, this.USE_LOCAL_REFRACTIONMAP_CUBIC = !1, this.REFLECTIONMAP_PROJECTION = !1, this.REFLECTIONMAP_SKYBOX = !1, this.REFLECTIONMAP_EXPLICIT = !1, this.REFLECTIONMAP_EQUIRECTANGULAR = !1, this.REFLECTIONMAP_EQUIRECTANGULAR_FIXED = !1, this.REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = !1, this.REFLECTIONMAP_OPPOSITEZ = !1, this.INVERTCUBICMAP = !1, this.LOGARITHMICDEPTH = !1, this.REFRACTION = !1, this.REFRACTIONMAP_3D = !1, this.REFLECTIONOVERALPHA = !1, this.TWOSIDEDLIGHTING = !1, this.SHADOWFLOAT = !1, this.MORPHTARGETS = !1, this.MORPHTARGETS_NORMAL = !1, this.MORPHTARGETS_TANGENT = !1, this.MORPHTARGETS_UV = !1, this.NUM_MORPH_INFLUENCERS = 0, this.MORPHTARGETS_TEXTURE = !1, this.NONUNIFORMSCALING = !1, this.PREMULTIPLYALPHA = !1, this.ALPHATEST_AFTERALLALPHACOMPUTATIONS = !1, this.ALPHABLEND = !0, this.PREPASS = !1, this.PREPASS_IRRADIANCE = !1, this.PREPASS_IRRADIANCE_INDEX = -1, this.PREPASS_ALBEDO_SQRT = !1, this.PREPASS_ALBEDO_SQRT_INDEX = -1, this.PREPASS_DEPTH = !1, this.PREPASS_DEPTH_INDEX = -1, this.PREPASS_NORMAL = !1, this.PREPASS_NORMAL_INDEX = -1, this.PREPASS_NORMAL_WORLDSPACE = !1, this.PREPASS_POSITION = !1, this.PREPASS_POSITION_INDEX = -1, this.PREPASS_VELOCITY = !1, this.PREPASS_VELOCITY_INDEX = -1, this.PREPASS_REFLECTIVITY = !1, this.PREPASS_REFLECTIVITY_INDEX = -1, this.SCENE_MRT_COUNT = 0, this.RGBDLIGHTMAP = !1, this.RGBDREFLECTION = !1, this.RGBDREFRACTION = !1, this.IMAGEPROCESSING = !1, this.VIGNETTE = !1, this.VIGNETTEBLENDMODEMULTIPLY = !1, this.VIGNETTEBLENDMODEOPAQUE = !1, this.TONEMAPPING = !1, this.TONEMAPPING_ACES = !1, this.CONTRAST = !1, this.COLORCURVES = !1, this.COLORGRADING = !1, this.COLORGRADING3D = !1, this.SAMPLER3DGREENDEPTH = !1, this.SAMPLER3DBGRMAP = !1, this.DITHER = !1, this.IMAGEPROCESSINGPOSTPROCESS = !1, this.SKIPFINALCOLORCLAMP = !1, this.MULTIVIEW = !1, this.ORDER_INDEPENDENT_TRANSPARENCY = !1, this.ORDER_INDEPENDENT_TRANSPARENCY_16BITS = !1, this.CAMERA_ORTHOGRAPHIC = !1, this.CAMERA_PERSPECTIVE = !1, this.IS_REFLECTION_LINEAR = !1, this.IS_REFRACTION_LINEAR = !1, this.EXPOSURE = !1, this.DECAL_AFTER_DETAIL = !1, this.rebuild();
  }
  setReflectionMode(i) {
    const a = [
      "REFLECTIONMAP_CUBIC",
      "REFLECTIONMAP_EXPLICIT",
      "REFLECTIONMAP_PLANAR",
      "REFLECTIONMAP_PROJECTION",
      "REFLECTIONMAP_PROJECTION",
      "REFLECTIONMAP_SKYBOX",
      "REFLECTIONMAP_SPHERICAL",
      "REFLECTIONMAP_EQUIRECTANGULAR",
      "REFLECTIONMAP_EQUIRECTANGULAR_FIXED",
      "REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED"
    ];
    for (const d of a)
      this[d] = d === i;
  }
}
class t extends K {
  /**
   * Gets the image processing configuration used either in this material.
   */
  get imageProcessingConfiguration() {
    return this._imageProcessingConfiguration;
  }
  /**
   * Sets the Default image processing configuration used either in the this material.
   *
   * If sets to null, the scene one is in use.
   */
  set imageProcessingConfiguration(i) {
    this._attachImageProcessingConfiguration(i), this._markAllSubMeshesAsTexturesDirty();
  }
  /**
   * Attaches a new image processing configuration to the Standard Material.
   * @param configuration
   */
  _attachImageProcessingConfiguration(i) {
    i !== this._imageProcessingConfiguration && (this._imageProcessingConfiguration && this._imageProcessingObserver && this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver), i ? this._imageProcessingConfiguration = i : this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration, this._imageProcessingConfiguration && (this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
      this._markAllSubMeshesAsImageProcessingDirty();
    })));
  }
  /**
   * Can this material render to prepass
   */
  get isPrePassCapable() {
    return !this.disableDepthWrite;
  }
  /**
   * Gets whether the color curves effect is enabled.
   */
  get cameraColorCurvesEnabled() {
    return this.imageProcessingConfiguration.colorCurvesEnabled;
  }
  /**
   * Sets whether the color curves effect is enabled.
   */
  set cameraColorCurvesEnabled(i) {
    this.imageProcessingConfiguration.colorCurvesEnabled = i;
  }
  /**
   * Gets whether the color grading effect is enabled.
   */
  get cameraColorGradingEnabled() {
    return this.imageProcessingConfiguration.colorGradingEnabled;
  }
  /**
   * Gets whether the color grading effect is enabled.
   */
  set cameraColorGradingEnabled(i) {
    this.imageProcessingConfiguration.colorGradingEnabled = i;
  }
  /**
   * Gets whether tonemapping is enabled or not.
   */
  get cameraToneMappingEnabled() {
    return this._imageProcessingConfiguration.toneMappingEnabled;
  }
  /**
   * Sets whether tonemapping is enabled or not
   */
  set cameraToneMappingEnabled(i) {
    this._imageProcessingConfiguration.toneMappingEnabled = i;
  }
  /**
   * The camera exposure used on this material.
   * This property is here and not in the camera to allow controlling exposure without full screen post process.
   * This corresponds to a photographic exposure.
   */
  get cameraExposure() {
    return this._imageProcessingConfiguration.exposure;
  }
  /**
   * The camera exposure used on this material.
   * This property is here and not in the camera to allow controlling exposure without full screen post process.
   * This corresponds to a photographic exposure.
   */
  set cameraExposure(i) {
    this._imageProcessingConfiguration.exposure = i;
  }
  /**
   * Gets The camera contrast used on this material.
   */
  get cameraContrast() {
    return this._imageProcessingConfiguration.contrast;
  }
  /**
   * Sets The camera contrast used on this material.
   */
  set cameraContrast(i) {
    this._imageProcessingConfiguration.contrast = i;
  }
  /**
   * Gets the Color Grading 2D Lookup Texture.
   */
  get cameraColorGradingTexture() {
    return this._imageProcessingConfiguration.colorGradingTexture;
  }
  /**
   * Sets the Color Grading 2D Lookup Texture.
   */
  set cameraColorGradingTexture(i) {
    this._imageProcessingConfiguration.colorGradingTexture = i;
  }
  /**
   * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
   * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
   * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
   * corresponding to low luminance, medium luminance, and high luminance areas respectively.
   */
  get cameraColorCurves() {
    return this._imageProcessingConfiguration.colorCurves;
  }
  /**
   * The color grading curves provide additional color adjustment that is applied after any color grading transform (3D LUT).
   * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
   * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
   * corresponding to low luminance, medium luminance, and high luminance areas respectively.
   */
  set cameraColorCurves(i) {
    this._imageProcessingConfiguration.colorCurves = i;
  }
  /**
   * Can this material render to several textures at once
   */
  get canRenderToMRT() {
    return !0;
  }
  /**
   * Instantiates a new standard material.
   * This is the default material used in Babylon. It is the best trade off between quality
   * and performances.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction
   * @param name Define the name of the material in the scene
   * @param scene Define the scene the material belong to
   */
  constructor(i, a) {
    super(i, a), this._diffuseTexture = null, this._ambientTexture = null, this._opacityTexture = null, this._reflectionTexture = null, this._emissiveTexture = null, this._specularTexture = null, this._bumpTexture = null, this._lightmapTexture = null, this._refractionTexture = null, this.ambientColor = new R(0, 0, 0), this.diffuseColor = new R(1, 1, 1), this.specularColor = new R(1, 1, 1), this.emissiveColor = new R(0, 0, 0), this.specularPower = 64, this._useAlphaFromDiffuseTexture = !1, this._useEmissiveAsIllumination = !1, this._linkEmissiveWithDiffuse = !1, this._useSpecularOverAlpha = !1, this._useReflectionOverAlpha = !1, this._disableLighting = !1, this._useObjectSpaceNormalMap = !1, this._useParallax = !1, this._useParallaxOcclusion = !1, this.parallaxScaleBias = 0.05, this._roughness = 0, this.indexOfRefraction = 0.98, this.invertRefractionY = !0, this.alphaCutOff = 0.4, this._useLightmapAsShadowmap = !1, this._useReflectionFresnelFromSpecular = !1, this._useGlossinessFromSpecularMapAlpha = !1, this._maxSimultaneousLights = 4, this._invertNormalMapX = !1, this._invertNormalMapY = !1, this._twoSidedLighting = !1, this._applyDecalMapAfterDetailMap = !1, this._renderTargets = new z(16), this._worldViewProjectionMatrix = X.Zero(), this._globalAmbientColor = new R(0, 0, 0), this._cacheHasRenderTargetTextures = !1, this.detailMap = new Q(this), this._attachImageProcessingConfiguration(null), this.prePassConfiguration = new B(), this.getRenderTargetTextures = () => (this._renderTargets.reset(), t.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget && this._renderTargets.push(this._reflectionTexture), t.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget && this._renderTargets.push(this._refractionTexture), this._eventInfo.renderTargets = this._renderTargets, this._callbackPluginEventFillRenderTargetTextures(this._eventInfo), this._renderTargets);
  }
  /**
   * Gets a boolean indicating that current material needs to register RTT
   */
  get hasRenderTargetTextures() {
    return t.ReflectionTextureEnabled && this._reflectionTexture && this._reflectionTexture.isRenderTarget || t.RefractionTextureEnabled && this._refractionTexture && this._refractionTexture.isRenderTarget ? !0 : this._cacheHasRenderTargetTextures;
  }
  /**
   * Gets the current class name of the material e.g. "StandardMaterial"
   * Mainly use in serialization.
   * @returns the class name
   */
  getClassName() {
    return "StandardMaterial";
  }
  /**
   * Specifies if the material will require alpha blending
   * @returns a boolean specifying if alpha blending is needed
   */
  needAlphaBlending() {
    return this._disableAlphaBlending ? !1 : this.alpha < 1 || this._opacityTexture != null || this._shouldUseAlphaFromDiffuseTexture() || this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled;
  }
  /**
   * Specifies if this material should be rendered in alpha test mode
   * @returns a boolean specifying if an alpha test is needed.
   */
  needAlphaTesting() {
    return this._forceAlphaTest ? !0 : this._hasAlphaChannel() && (this._transparencyMode == null || this._transparencyMode === b.MATERIAL_ALPHATEST);
  }
  /**
   * @returns whether or not the alpha value of the diffuse texture should be used for alpha blending.
   */
  _shouldUseAlphaFromDiffuseTexture() {
    return this._diffuseTexture != null && this._diffuseTexture.hasAlpha && this._useAlphaFromDiffuseTexture && this._transparencyMode !== b.MATERIAL_OPAQUE;
  }
  /**
   * @returns whether or not there is a usable alpha channel for transparency.
   */
  _hasAlphaChannel() {
    return this._diffuseTexture != null && this._diffuseTexture.hasAlpha || this._opacityTexture != null;
  }
  /**
   * Get the texture used for alpha test purpose.
   * @returns the diffuse texture in case of the standard material.
   */
  getAlphaTestTexture() {
    return this._diffuseTexture;
  }
  /**
   * Get if the submesh is ready to be used and all its information available.
   * Child classes can use it to update shaders
   * @param mesh defines the mesh to check
   * @param subMesh defines which submesh to check
   * @param useInstances specifies that instances should be used
   * @returns a boolean indicating that the submesh is ready or not
   */
  isReadyForSubMesh(i, a, d = !1) {
    this._uniformBufferLayoutBuilt || this.buildUniformLayout();
    const o = a._drawWrapper;
    if (o.effect && this.isFrozen && o._wasPreviouslyReady && o._wasPreviouslyUsingInstances === d)
      return !0;
    a.materialDefines || (this._callbackPluginEventGeneric(W.GetDefineNames, this._eventInfo), a.materialDefines = new be(this._eventInfo.defineNames));
    const l = this.getScene(), e = a.materialDefines;
    if (this._isReadyForSubMesh(a))
      return !0;
    const v = l.getEngine();
    e._needNormals = Z(l, i, e, !0, this._maxSimultaneousLights, this._disableLighting), J(l, e);
    const s = this.needAlphaBlendingForMesh(i) && this.getScene().useOrderIndependentTransparency;
    if (q(l, e, this.canRenderToMRT && !s), ee(l, e, s), e._areTexturesDirty) {
      this._eventInfo.hasRenderTargetTextures = !1, this._callbackPluginEventHasRenderTargetTextures(this._eventInfo), this._cacheHasRenderTargetTextures = this._eventInfo.hasRenderTargetTextures, e._needUVs = !1;
      for (let T = 1; T <= 6; ++T)
        e["MAINUV" + T] = !1;
      if (l.texturesEnabled) {
        if (e.DIFFUSEDIRECTUV = 0, e.BUMPDIRECTUV = 0, e.AMBIENTDIRECTUV = 0, e.OPACITYDIRECTUV = 0, e.EMISSIVEDIRECTUV = 0, e.SPECULARDIRECTUV = 0, e.LIGHTMAPDIRECTUV = 0, this._diffuseTexture && t.DiffuseTextureEnabled)
          if (this._diffuseTexture.isReadyOrNotBlocking())
            I(this._diffuseTexture, e, "DIFFUSE");
          else
            return !1;
        else
          e.DIFFUSE = !1;
        if (this._ambientTexture && t.AmbientTextureEnabled)
          if (this._ambientTexture.isReadyOrNotBlocking())
            I(this._ambientTexture, e, "AMBIENT");
          else
            return !1;
        else
          e.AMBIENT = !1;
        if (this._opacityTexture && t.OpacityTextureEnabled)
          if (this._opacityTexture.isReadyOrNotBlocking())
            I(this._opacityTexture, e, "OPACITY"), e.OPACITYRGB = this._opacityTexture.getAlphaFromRGB;
          else
            return !1;
        else
          e.OPACITY = !1;
        if (this._reflectionTexture && t.ReflectionTextureEnabled)
          if (this._reflectionTexture.isReadyOrNotBlocking()) {
            switch (e._needNormals = !0, e.REFLECTION = !0, e.ROUGHNESS = this._roughness > 0, e.REFLECTIONOVERALPHA = this._useReflectionOverAlpha, e.INVERTCUBICMAP = this._reflectionTexture.coordinatesMode === m.INVCUBIC_MODE, e.REFLECTIONMAP_3D = this._reflectionTexture.isCube, e.REFLECTIONMAP_OPPOSITEZ = e.REFLECTIONMAP_3D && this.getScene().useRightHandedSystem ? !this._reflectionTexture.invertZ : this._reflectionTexture.invertZ, e.RGBDREFLECTION = this._reflectionTexture.isRGBD, this._reflectionTexture.coordinatesMode) {
              case m.EXPLICIT_MODE:
                e.setReflectionMode("REFLECTIONMAP_EXPLICIT");
                break;
              case m.PLANAR_MODE:
                e.setReflectionMode("REFLECTIONMAP_PLANAR");
                break;
              case m.PROJECTION_MODE:
                e.setReflectionMode("REFLECTIONMAP_PROJECTION");
                break;
              case m.SKYBOX_MODE:
                e.setReflectionMode("REFLECTIONMAP_SKYBOX");
                break;
              case m.SPHERICAL_MODE:
                e.setReflectionMode("REFLECTIONMAP_SPHERICAL");
                break;
              case m.EQUIRECTANGULAR_MODE:
                e.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR");
                break;
              case m.FIXED_EQUIRECTANGULAR_MODE:
                e.setReflectionMode("REFLECTIONMAP_EQUIRECTANGULAR_FIXED");
                break;
              case m.FIXED_EQUIRECTANGULAR_MIRRORED_MODE:
                e.setReflectionMode("REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED");
                break;
              case m.CUBIC_MODE:
              case m.INVCUBIC_MODE:
              default:
                e.setReflectionMode("REFLECTIONMAP_CUBIC");
                break;
            }
            e.USE_LOCAL_REFLECTIONMAP_CUBIC = !!this._reflectionTexture.boundingBoxSize;
          } else
            return !1;
        else
          e.REFLECTION = !1, e.REFLECTIONMAP_OPPOSITEZ = !1;
        if (this._emissiveTexture && t.EmissiveTextureEnabled)
          if (this._emissiveTexture.isReadyOrNotBlocking())
            I(this._emissiveTexture, e, "EMISSIVE");
          else
            return !1;
        else
          e.EMISSIVE = !1;
        if (this._lightmapTexture && t.LightmapTextureEnabled)
          if (this._lightmapTexture.isReadyOrNotBlocking())
            I(this._lightmapTexture, e, "LIGHTMAP"), e.USELIGHTMAPASSHADOWMAP = this._useLightmapAsShadowmap, e.RGBDLIGHTMAP = this._lightmapTexture.isRGBD;
          else
            return !1;
        else
          e.LIGHTMAP = !1;
        if (this._specularTexture && t.SpecularTextureEnabled)
          if (this._specularTexture.isReadyOrNotBlocking())
            I(this._specularTexture, e, "SPECULAR"), e.GLOSSINESS = this._useGlossinessFromSpecularMapAlpha;
          else
            return !1;
        else
          e.SPECULAR = !1;
        if (l.getEngine().getCaps().standardDerivatives && this._bumpTexture && t.BumpTextureEnabled) {
          if (this._bumpTexture.isReady())
            I(this._bumpTexture, e, "BUMP"), e.PARALLAX = this._useParallax, e.PARALLAX_RHS = l.useRightHandedSystem, e.PARALLAXOCCLUSION = this._useParallaxOcclusion;
          else
            return !1;
          e.OBJECTSPACE_NORMALMAP = this._useObjectSpaceNormalMap;
        } else
          e.BUMP = !1, e.PARALLAX = !1, e.PARALLAX_RHS = !1, e.PARALLAXOCCLUSION = !1;
        if (this._refractionTexture && t.RefractionTextureEnabled)
          if (this._refractionTexture.isReadyOrNotBlocking())
            e._needUVs = !0, e.REFRACTION = !0, e.REFRACTIONMAP_3D = this._refractionTexture.isCube, e.RGBDREFRACTION = this._refractionTexture.isRGBD, e.USE_LOCAL_REFRACTIONMAP_CUBIC = !!this._refractionTexture.boundingBoxSize;
          else
            return !1;
        else
          e.REFRACTION = !1;
        e.TWOSIDEDLIGHTING = !this._backFaceCulling && this._twoSidedLighting;
      } else
        e.DIFFUSE = !1, e.AMBIENT = !1, e.OPACITY = !1, e.REFLECTION = !1, e.EMISSIVE = !1, e.LIGHTMAP = !1, e.BUMP = !1, e.REFRACTION = !1;
      e.ALPHAFROMDIFFUSE = this._shouldUseAlphaFromDiffuseTexture(), e.EMISSIVEASILLUMINATION = this._useEmissiveAsIllumination, e.LINKEMISSIVEWITHDIFFUSE = this._linkEmissiveWithDiffuse, e.SPECULAROVERALPHA = this._useSpecularOverAlpha, e.PREMULTIPLYALPHA = this.alphaMode === 7 || this.alphaMode === 8, e.ALPHATEST_AFTERALLALPHACOMPUTATIONS = this.transparencyMode !== null, e.ALPHABLEND = this.transparencyMode === null || this.needAlphaBlendingForMesh(i);
    }
    if (this._eventInfo.isReadyForSubMesh = !0, this._eventInfo.defines = e, this._eventInfo.subMesh = a, this._callbackPluginEventIsReadyForSubMesh(this._eventInfo), !this._eventInfo.isReadyForSubMesh)
      return !1;
    if (e._areImageProcessingDirty && this._imageProcessingConfiguration) {
      if (!this._imageProcessingConfiguration.isReady())
        return !1;
      this._imageProcessingConfiguration.prepareDefines(e), e.IS_REFLECTION_LINEAR = this.reflectionTexture != null && !this.reflectionTexture.gammaSpace, e.IS_REFRACTION_LINEAR = this.refractionTexture != null && !this.refractionTexture.gammaSpace;
    }
    e._areFresnelDirty && (t.FresnelEnabled ? (this._diffuseFresnelParameters || this._opacityFresnelParameters || this._emissiveFresnelParameters || this._refractionFresnelParameters || this._reflectionFresnelParameters) && (e.DIFFUSEFRESNEL = this._diffuseFresnelParameters && this._diffuseFresnelParameters.isEnabled, e.OPACITYFRESNEL = this._opacityFresnelParameters && this._opacityFresnelParameters.isEnabled, e.REFLECTIONFRESNEL = this._reflectionFresnelParameters && this._reflectionFresnelParameters.isEnabled, e.REFLECTIONFRESNELFROMSPECULAR = this._useReflectionFresnelFromSpecular, e.REFRACTIONFRESNEL = this._refractionFresnelParameters && this._refractionFresnelParameters.isEnabled, e.EMISSIVEFRESNEL = this._emissiveFresnelParameters && this._emissiveFresnelParameters.isEnabled, e._needNormals = !0, e.FRESNEL = !0) : e.FRESNEL = !1), ie(i, l, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(i) || this._forceAlphaTest, e, this._applyDecalMapAfterDetailMap), te(l, v, this, e, d, null, a.getRenderingMesh().hasThinInstances), this._eventInfo.defines = e, this._eventInfo.mesh = i, this._callbackPluginEventPrepareDefinesBeforeAttributes(this._eventInfo), re(i, e, !0, !0, !0), this._callbackPluginEventPrepareDefines(this._eventInfo);
    let p = !1;
    if (e.isDirty) {
      const T = e._areLightsDisposed;
      e.markAsProcessed();
      const c = new $();
      e.REFLECTION && c.addFallback(0, "REFLECTION"), e.SPECULAR && c.addFallback(0, "SPECULAR"), e.BUMP && c.addFallback(0, "BUMP"), e.PARALLAX && c.addFallback(1, "PARALLAX"), e.PARALLAX_RHS && c.addFallback(1, "PARALLAX_RHS"), e.PARALLAXOCCLUSION && c.addFallback(0, "PARALLAXOCCLUSION"), e.SPECULAROVERALPHA && c.addFallback(0, "SPECULAROVERALPHA"), e.FOG && c.addFallback(1, "FOG"), e.POINTSIZE && c.addFallback(0, "POINTSIZE"), e.LOGARITHMICDEPTH && c.addFallback(0, "LOGARITHMICDEPTH"), se(e, c, this._maxSimultaneousLights), e.SPECULARTERM && c.addFallback(0, "SPECULARTERM"), e.DIFFUSEFRESNEL && c.addFallback(1, "DIFFUSEFRESNEL"), e.OPACITYFRESNEL && c.addFallback(2, "OPACITYFRESNEL"), e.REFLECTIONFRESNEL && c.addFallback(3, "REFLECTIONFRESNEL"), e.EMISSIVEFRESNEL && c.addFallback(4, "EMISSIVEFRESNEL"), e.FRESNEL && c.addFallback(4, "FRESNEL"), e.MULTIVIEW && c.addFallback(0, "MULTIVIEW");
      const E = [L.PositionKind];
      e.NORMAL && E.push(L.NormalKind), e.TANGENT && E.push(L.TangentKind);
      for (let S = 1; S <= 6; ++S)
        e["UV" + S] && E.push(`uv${S === 1 ? "" : S}`);
      e.VERTEXCOLOR && E.push(L.ColorKind), ae(E, i, e, c), oe(E, e), ne(E, i, e), le(E, i, e);
      let F = "default";
      const _ = [
        "world",
        "view",
        "viewProjection",
        "vEyePosition",
        "vLightsType",
        "vAmbientColor",
        "vDiffuseColor",
        "vSpecularColor",
        "vEmissiveColor",
        "visibility",
        "vFogInfos",
        "vFogColor",
        "pointSize",
        "vDiffuseInfos",
        "vAmbientInfos",
        "vOpacityInfos",
        "vReflectionInfos",
        "vEmissiveInfos",
        "vSpecularInfos",
        "vBumpInfos",
        "vLightmapInfos",
        "vRefractionInfos",
        "mBones",
        "diffuseMatrix",
        "ambientMatrix",
        "opacityMatrix",
        "reflectionMatrix",
        "emissiveMatrix",
        "specularMatrix",
        "bumpMatrix",
        "normalMatrix",
        "lightmapMatrix",
        "refractionMatrix",
        "diffuseLeftColor",
        "diffuseRightColor",
        "opacityParts",
        "reflectionLeftColor",
        "reflectionRightColor",
        "emissiveLeftColor",
        "emissiveRightColor",
        "refractionLeftColor",
        "refractionRightColor",
        "vReflectionPosition",
        "vReflectionSize",
        "vRefractionPosition",
        "vRefractionSize",
        "logarithmicDepthConstant",
        "vTangentSpaceParams",
        "alphaCutOff",
        "boneTextureWidth",
        "morphTargetTextureInfo",
        "morphTargetTextureIndices"
      ], P = [
        "diffuseSampler",
        "ambientSampler",
        "opacitySampler",
        "reflectionCubeSampler",
        "reflection2DSampler",
        "emissiveSampler",
        "specularSampler",
        "bumpSampler",
        "lightmapSampler",
        "refractionCubeSampler",
        "refraction2DSampler",
        "boneSampler",
        "morphTargets",
        "oitDepthSampler",
        "oitFrontColorSampler"
      ], x = ["Material", "Scene", "Mesh"], y = { maxSimultaneousLights: this._maxSimultaneousLights, maxSimultaneousMorphTargets: e.NUM_MORPH_INFLUENCERS };
      this._eventInfo.fallbacks = c, this._eventInfo.fallbackRank = 0, this._eventInfo.defines = e, this._eventInfo.uniforms = _, this._eventInfo.attributes = E, this._eventInfo.samplers = P, this._eventInfo.uniformBuffersNames = x, this._eventInfo.customCode = void 0, this._eventInfo.mesh = i, this._eventInfo.indexParameters = y, this._callbackPluginEventGeneric(W.PrepareEffect, this._eventInfo), B.AddUniforms(_), O && (O.PrepareUniforms(_, e), O.PrepareSamplers(P, e)), fe({
        uniformsNames: _,
        uniformBuffersNames: x,
        samplers: P,
        defines: e,
        maxSimultaneousLights: this._maxSimultaneousLights
      }), ue(_);
      const V = {};
      this.customShaderNameResolve && (F = this.customShaderNameResolve(F, _, x, P, e, E, V));
      const k = e.toString(), G = a.effect;
      let g = l.getEngine().createEffect(F, {
        attributes: E,
        uniformsNames: _,
        uniformBuffersNames: x,
        samplers: P,
        defines: k,
        fallbacks: c,
        onCompiled: this.onCompiled,
        onError: this.onError,
        indexParameters: y,
        processFinalCode: V.processFinalCode,
        processCodeAfterIncludes: this._eventInfo.customCode,
        multiTarget: e.PREPASS
      }, v);
      if (this._eventInfo.customCode = void 0, g)
        if (this._onEffectCreatedObservable && (D.effect = g, D.subMesh = a, this._onEffectCreatedObservable.notifyObservers(D)), this.allowShaderHotSwapping && G && !g.isReady()) {
          if (g = G, e.markAsUnprocessed(), p = this.isFrozen, T)
            return e._areLightsDisposed = !0, !1;
        } else
          l.resetCachedMaterial(), a.setEffect(g, e, this._materialContext);
    }
    return !a.effect || !a.effect.isReady() ? !1 : (e._renderId = l.getRenderId(), o._wasPreviouslyReady = !p, o._wasPreviouslyUsingInstances = d, this._checkScenePerformancePriority(), !0);
  }
  /**
   * Builds the material UBO layouts.
   * Used internally during the effect preparation.
   */
  buildUniformLayout() {
    const i = this._uniformBuffer;
    i.addUniform("diffuseLeftColor", 4), i.addUniform("diffuseRightColor", 4), i.addUniform("opacityParts", 4), i.addUniform("reflectionLeftColor", 4), i.addUniform("reflectionRightColor", 4), i.addUniform("refractionLeftColor", 4), i.addUniform("refractionRightColor", 4), i.addUniform("emissiveLeftColor", 4), i.addUniform("emissiveRightColor", 4), i.addUniform("vDiffuseInfos", 2), i.addUniform("vAmbientInfos", 2), i.addUniform("vOpacityInfos", 2), i.addUniform("vReflectionInfos", 2), i.addUniform("vReflectionPosition", 3), i.addUniform("vReflectionSize", 3), i.addUniform("vEmissiveInfos", 2), i.addUniform("vLightmapInfos", 2), i.addUniform("vSpecularInfos", 2), i.addUniform("vBumpInfos", 3), i.addUniform("diffuseMatrix", 16), i.addUniform("ambientMatrix", 16), i.addUniform("opacityMatrix", 16), i.addUniform("reflectionMatrix", 16), i.addUniform("emissiveMatrix", 16), i.addUniform("lightmapMatrix", 16), i.addUniform("specularMatrix", 16), i.addUniform("bumpMatrix", 16), i.addUniform("vTangentSpaceParams", 2), i.addUniform("pointSize", 1), i.addUniform("alphaCutOff", 1), i.addUniform("refractionMatrix", 16), i.addUniform("vRefractionInfos", 4), i.addUniform("vRefractionPosition", 3), i.addUniform("vRefractionSize", 3), i.addUniform("vSpecularColor", 4), i.addUniform("vEmissiveColor", 3), i.addUniform("vDiffuseColor", 4), i.addUniform("vAmbientColor", 3), super.buildUniformLayout();
  }
  /**
   * Binds the submesh to this material by preparing the effect and shader to draw
   * @param world defines the world transformation matrix
   * @param mesh defines the mesh containing the submesh
   * @param subMesh defines the submesh to bind the material to
   */
  bindForSubMesh(i, a, d) {
    const o = this.getScene(), l = d.materialDefines;
    if (!l)
      return;
    const e = d.effect;
    if (!e)
      return;
    this._activeEffect = e, a.getMeshUniformBuffer().bindToEffect(e, "Mesh"), a.transferToEffect(i), this._uniformBuffer.bindToEffect(e, "Material"), this.prePassConfiguration.bindForSubMesh(this._activeEffect, o, a, i, this.isFrozen), this._eventInfo.subMesh = d, this._callbackPluginEventHardBindForSubMesh(this._eventInfo), l.OBJECTSPACE_NORMALMAP && (i.toNormalMatrix(this._normalMatrix), this.bindOnlyNormalMatrix(this._normalMatrix));
    const v = this._mustRebind(o, e, d, a.visibility);
    ce(a, e);
    const s = this._uniformBuffer;
    if (v) {
      if (this.bindViewProjection(e), !s.useUbo || !this.isFrozen || !s.isSync || d._drawWrapper._forceRebindOnNextCall) {
        if (t.FresnelEnabled && l.FRESNEL && (this.diffuseFresnelParameters && this.diffuseFresnelParameters.isEnabled && (s.updateColor4("diffuseLeftColor", this.diffuseFresnelParameters.leftColor, this.diffuseFresnelParameters.power), s.updateColor4("diffuseRightColor", this.diffuseFresnelParameters.rightColor, this.diffuseFresnelParameters.bias)), this.opacityFresnelParameters && this.opacityFresnelParameters.isEnabled && s.updateColor4("opacityParts", new R(this.opacityFresnelParameters.leftColor.toLuminance(), this.opacityFresnelParameters.rightColor.toLuminance(), this.opacityFresnelParameters.bias), this.opacityFresnelParameters.power), this.reflectionFresnelParameters && this.reflectionFresnelParameters.isEnabled && (s.updateColor4("reflectionLeftColor", this.reflectionFresnelParameters.leftColor, this.reflectionFresnelParameters.power), s.updateColor4("reflectionRightColor", this.reflectionFresnelParameters.rightColor, this.reflectionFresnelParameters.bias)), this.refractionFresnelParameters && this.refractionFresnelParameters.isEnabled && (s.updateColor4("refractionLeftColor", this.refractionFresnelParameters.leftColor, this.refractionFresnelParameters.power), s.updateColor4("refractionRightColor", this.refractionFresnelParameters.rightColor, this.refractionFresnelParameters.bias)), this.emissiveFresnelParameters && this.emissiveFresnelParameters.isEnabled && (s.updateColor4("emissiveLeftColor", this.emissiveFresnelParameters.leftColor, this.emissiveFresnelParameters.power), s.updateColor4("emissiveRightColor", this.emissiveFresnelParameters.rightColor, this.emissiveFresnelParameters.bias))), o.texturesEnabled) {
          if (this._diffuseTexture && t.DiffuseTextureEnabled && (s.updateFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level), C(this._diffuseTexture, s, "diffuse")), this._ambientTexture && t.AmbientTextureEnabled && (s.updateFloat2("vAmbientInfos", this._ambientTexture.coordinatesIndex, this._ambientTexture.level), C(this._ambientTexture, s, "ambient")), this._opacityTexture && t.OpacityTextureEnabled && (s.updateFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level), C(this._opacityTexture, s, "opacity")), this._hasAlphaChannel() && s.updateFloat("alphaCutOff", this.alphaCutOff), this._reflectionTexture && t.ReflectionTextureEnabled && (s.updateFloat2("vReflectionInfos", this._reflectionTexture.level, this.roughness), s.updateMatrix("reflectionMatrix", this._reflectionTexture.getReflectionTextureMatrix()), this._reflectionTexture.boundingBoxSize)) {
            const p = this._reflectionTexture;
            s.updateVector3("vReflectionPosition", p.boundingBoxPosition), s.updateVector3("vReflectionSize", p.boundingBoxSize);
          }
          if (this._emissiveTexture && t.EmissiveTextureEnabled && (s.updateFloat2("vEmissiveInfos", this._emissiveTexture.coordinatesIndex, this._emissiveTexture.level), C(this._emissiveTexture, s, "emissive")), this._lightmapTexture && t.LightmapTextureEnabled && (s.updateFloat2("vLightmapInfos", this._lightmapTexture.coordinatesIndex, this._lightmapTexture.level), C(this._lightmapTexture, s, "lightmap")), this._specularTexture && t.SpecularTextureEnabled && (s.updateFloat2("vSpecularInfos", this._specularTexture.coordinatesIndex, this._specularTexture.level), C(this._specularTexture, s, "specular")), this._bumpTexture && o.getEngine().getCaps().standardDerivatives && t.BumpTextureEnabled && (s.updateFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, 1 / this._bumpTexture.level, this.parallaxScaleBias), C(this._bumpTexture, s, "bump"), o._mirroredCameraPosition ? s.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? 1 : -1, this._invertNormalMapY ? 1 : -1) : s.updateFloat2("vTangentSpaceParams", this._invertNormalMapX ? -1 : 1, this._invertNormalMapY ? -1 : 1)), this._refractionTexture && t.RefractionTextureEnabled) {
            let p = 1;
            if (this._refractionTexture.isCube || (s.updateMatrix("refractionMatrix", this._refractionTexture.getReflectionTextureMatrix()), this._refractionTexture.depth && (p = this._refractionTexture.depth)), s.updateFloat4("vRefractionInfos", this._refractionTexture.level, this.indexOfRefraction, p, this.invertRefractionY ? -1 : 1), this._refractionTexture.boundingBoxSize) {
              const T = this._refractionTexture;
              s.updateVector3("vRefractionPosition", T.boundingBoxPosition), s.updateVector3("vRefractionSize", T.boundingBoxSize);
            }
          }
        }
        this.pointsCloud && s.updateFloat("pointSize", this.pointSize), l.SPECULARTERM && s.updateColor4("vSpecularColor", this.specularColor, this.specularPower), s.updateColor3("vEmissiveColor", t.EmissiveTextureEnabled ? this.emissiveColor : R.BlackReadOnly), s.updateColor4("vDiffuseColor", this.diffuseColor, this.alpha), o.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor), s.updateColor3("vAmbientColor", this._globalAmbientColor);
      }
      o.texturesEnabled && (this._diffuseTexture && t.DiffuseTextureEnabled && e.setTexture("diffuseSampler", this._diffuseTexture), this._ambientTexture && t.AmbientTextureEnabled && e.setTexture("ambientSampler", this._ambientTexture), this._opacityTexture && t.OpacityTextureEnabled && e.setTexture("opacitySampler", this._opacityTexture), this._reflectionTexture && t.ReflectionTextureEnabled && (this._reflectionTexture.isCube ? e.setTexture("reflectionCubeSampler", this._reflectionTexture) : e.setTexture("reflection2DSampler", this._reflectionTexture)), this._emissiveTexture && t.EmissiveTextureEnabled && e.setTexture("emissiveSampler", this._emissiveTexture), this._lightmapTexture && t.LightmapTextureEnabled && e.setTexture("lightmapSampler", this._lightmapTexture), this._specularTexture && t.SpecularTextureEnabled && e.setTexture("specularSampler", this._specularTexture), this._bumpTexture && o.getEngine().getCaps().standardDerivatives && t.BumpTextureEnabled && e.setTexture("bumpSampler", this._bumpTexture), this._refractionTexture && t.RefractionTextureEnabled && (this._refractionTexture.isCube ? e.setTexture("refractionCubeSampler", this._refractionTexture) : e.setTexture("refraction2DSampler", this._refractionTexture))), this.getScene().useOrderIndependentTransparency && this.needAlphaBlendingForMesh(a) && this.getScene().depthPeelingRenderer.bind(e), this._eventInfo.subMesh = d, this._callbackPluginEventBindForSubMesh(this._eventInfo), de(e, this, o), this.bindEyePosition(e);
    } else o.getEngine()._features.needToAlwaysBindUniformBuffers && (this._needToBindSceneUbo = !0);
    (v || !this.isFrozen) && (o.lightsEnabled && !this._disableLighting && Ee(o, a, e, l, this._maxSimultaneousLights), (o.fogEnabled && a.applyFog && o.fogMode !== H.FOGMODE_NONE || this._reflectionTexture || this._refractionTexture || a.receiveShadows || l.PREPASS) && this.bindView(e), me(o, a, e), l.NUM_MORPH_INFLUENCERS && he(a, e), l.BAKED_VERTEX_ANIMATION_TEXTURE && a.bakedVertexAnimationManager?.bind(e, l.INSTANCES), this.useLogarithmicDepth && pe(l, e, o), this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess && this._imageProcessingConfiguration.bind(this._activeEffect)), this._afterBind(a, this._activeEffect, d), s.update();
  }
  /**
   * Get the list of animatables in the material.
   * @returns the list of animatables object used in the material
   */
  getAnimatables() {
    const i = super.getAnimatables();
    return this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0 && i.push(this._diffuseTexture), this._ambientTexture && this._ambientTexture.animations && this._ambientTexture.animations.length > 0 && i.push(this._ambientTexture), this._opacityTexture && this._opacityTexture.animations && this._opacityTexture.animations.length > 0 && i.push(this._opacityTexture), this._reflectionTexture && this._reflectionTexture.animations && this._reflectionTexture.animations.length > 0 && i.push(this._reflectionTexture), this._emissiveTexture && this._emissiveTexture.animations && this._emissiveTexture.animations.length > 0 && i.push(this._emissiveTexture), this._specularTexture && this._specularTexture.animations && this._specularTexture.animations.length > 0 && i.push(this._specularTexture), this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0 && i.push(this._bumpTexture), this._lightmapTexture && this._lightmapTexture.animations && this._lightmapTexture.animations.length > 0 && i.push(this._lightmapTexture), this._refractionTexture && this._refractionTexture.animations && this._refractionTexture.animations.length > 0 && i.push(this._refractionTexture), i;
  }
  /**
   * Gets the active textures from the material
   * @returns an array of textures
   */
  getActiveTextures() {
    const i = super.getActiveTextures();
    return this._diffuseTexture && i.push(this._diffuseTexture), this._ambientTexture && i.push(this._ambientTexture), this._opacityTexture && i.push(this._opacityTexture), this._reflectionTexture && i.push(this._reflectionTexture), this._emissiveTexture && i.push(this._emissiveTexture), this._specularTexture && i.push(this._specularTexture), this._bumpTexture && i.push(this._bumpTexture), this._lightmapTexture && i.push(this._lightmapTexture), this._refractionTexture && i.push(this._refractionTexture), i;
  }
  /**
   * Specifies if the material uses a texture
   * @param texture defines the texture to check against the material
   * @returns a boolean specifying if the material uses the texture
   */
  hasTexture(i) {
    return !!(super.hasTexture(i) || this._diffuseTexture === i || this._ambientTexture === i || this._opacityTexture === i || this._reflectionTexture === i || this._emissiveTexture === i || this._specularTexture === i || this._bumpTexture === i || this._lightmapTexture === i || this._refractionTexture === i);
  }
  /**
   * Disposes the material
   * @param forceDisposeEffect specifies if effects should be forcefully disposed
   * @param forceDisposeTextures specifies if textures should be forcefully disposed
   */
  dispose(i, a) {
    a && (this._diffuseTexture?.dispose(), this._ambientTexture?.dispose(), this._opacityTexture?.dispose(), this._reflectionTexture?.dispose(), this._emissiveTexture?.dispose(), this._specularTexture?.dispose(), this._bumpTexture?.dispose(), this._lightmapTexture?.dispose(), this._refractionTexture?.dispose()), this._imageProcessingConfiguration && this._imageProcessingObserver && this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver), super.dispose(i, a);
  }
  /**
   * Makes a duplicate of the material, and gives it a new name
   * @param name defines the new name for the duplicated material
   * @param cloneTexturesOnlyOnce - if a texture is used in more than one channel (e.g diffuse and opacity), only clone it once and reuse it on the other channels. Default false.
   * @param rootUrl defines the root URL to use to load textures
   * @returns the cloned material
   */
  clone(i, a = !0, d = "") {
    const o = w.Clone(() => new t(i, this.getScene()), this, { cloneTexturesOnlyOnce: a });
    return o.name = i, o.id = i, this.stencil.copyTo(o.stencil), this._clonePlugins(o, d), o;
  }
  /**
   * Creates a standard material from parsed material data
   * @param source defines the JSON representation of the material
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @returns a new standard material
   */
  static Parse(i, a, d) {
    const o = w.Parse(() => new t(i.name, a), i, a, d);
    return i.stencil && o.stencil.parse(i.stencil, a, d), b._ParsePlugins(i, o, a, d), o;
  }
  // Flags used to enable or disable a type of texture for all Standard Materials
  /**
   * Are diffuse textures enabled in the application.
   */
  static get DiffuseTextureEnabled() {
    return f.DiffuseTextureEnabled;
  }
  static set DiffuseTextureEnabled(i) {
    f.DiffuseTextureEnabled = i;
  }
  /**
   * Are detail textures enabled in the application.
   */
  static get DetailTextureEnabled() {
    return f.DetailTextureEnabled;
  }
  static set DetailTextureEnabled(i) {
    f.DetailTextureEnabled = i;
  }
  /**
   * Are ambient textures enabled in the application.
   */
  static get AmbientTextureEnabled() {
    return f.AmbientTextureEnabled;
  }
  static set AmbientTextureEnabled(i) {
    f.AmbientTextureEnabled = i;
  }
  /**
   * Are opacity textures enabled in the application.
   */
  static get OpacityTextureEnabled() {
    return f.OpacityTextureEnabled;
  }
  static set OpacityTextureEnabled(i) {
    f.OpacityTextureEnabled = i;
  }
  /**
   * Are reflection textures enabled in the application.
   */
  static get ReflectionTextureEnabled() {
    return f.ReflectionTextureEnabled;
  }
  static set ReflectionTextureEnabled(i) {
    f.ReflectionTextureEnabled = i;
  }
  /**
   * Are emissive textures enabled in the application.
   */
  static get EmissiveTextureEnabled() {
    return f.EmissiveTextureEnabled;
  }
  static set EmissiveTextureEnabled(i) {
    f.EmissiveTextureEnabled = i;
  }
  /**
   * Are specular textures enabled in the application.
   */
  static get SpecularTextureEnabled() {
    return f.SpecularTextureEnabled;
  }
  static set SpecularTextureEnabled(i) {
    f.SpecularTextureEnabled = i;
  }
  /**
   * Are bump textures enabled in the application.
   */
  static get BumpTextureEnabled() {
    return f.BumpTextureEnabled;
  }
  static set BumpTextureEnabled(i) {
    f.BumpTextureEnabled = i;
  }
  /**
   * Are lightmap textures enabled in the application.
   */
  static get LightmapTextureEnabled() {
    return f.LightmapTextureEnabled;
  }
  static set LightmapTextureEnabled(i) {
    f.LightmapTextureEnabled = i;
  }
  /**
   * Are refraction textures enabled in the application.
   */
  static get RefractionTextureEnabled() {
    return f.RefractionTextureEnabled;
  }
  static set RefractionTextureEnabled(i) {
    f.RefractionTextureEnabled = i;
  }
  /**
   * Are color grading textures enabled in the application.
   */
  static get ColorGradingTextureEnabled() {
    return f.ColorGradingTextureEnabled;
  }
  static set ColorGradingTextureEnabled(i) {
    f.ColorGradingTextureEnabled = i;
  }
  /**
   * Are fresnels enabled in the application.
   */
  static get FresnelEnabled() {
    return f.FresnelEnabled;
  }
  static set FresnelEnabled(i) {
    f.FresnelEnabled = i;
  }
}
r([
  h("diffuseTexture")
], t.prototype, "_diffuseTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesAndMiscDirty")
], t.prototype, "diffuseTexture", void 0);
r([
  h("ambientTexture")
], t.prototype, "_ambientTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "ambientTexture", void 0);
r([
  h("opacityTexture")
], t.prototype, "_opacityTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesAndMiscDirty")
], t.prototype, "opacityTexture", void 0);
r([
  h("reflectionTexture")
], t.prototype, "_reflectionTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "reflectionTexture", void 0);
r([
  h("emissiveTexture")
], t.prototype, "_emissiveTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "emissiveTexture", void 0);
r([
  h("specularTexture")
], t.prototype, "_specularTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "specularTexture", void 0);
r([
  h("bumpTexture")
], t.prototype, "_bumpTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "bumpTexture", void 0);
r([
  h("lightmapTexture")
], t.prototype, "_lightmapTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "lightmapTexture", void 0);
r([
  h("refractionTexture")
], t.prototype, "_refractionTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "refractionTexture", void 0);
r([
  M("ambient")
], t.prototype, "ambientColor", void 0);
r([
  M("diffuse")
], t.prototype, "diffuseColor", void 0);
r([
  M("specular")
], t.prototype, "specularColor", void 0);
r([
  M("emissive")
], t.prototype, "emissiveColor", void 0);
r([
  u()
], t.prototype, "specularPower", void 0);
r([
  u("useAlphaFromDiffuseTexture")
], t.prototype, "_useAlphaFromDiffuseTexture", void 0);
r([
  n("_markAllSubMeshesAsTexturesAndMiscDirty")
], t.prototype, "useAlphaFromDiffuseTexture", void 0);
r([
  u("useEmissiveAsIllumination")
], t.prototype, "_useEmissiveAsIllumination", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "useEmissiveAsIllumination", void 0);
r([
  u("linkEmissiveWithDiffuse")
], t.prototype, "_linkEmissiveWithDiffuse", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "linkEmissiveWithDiffuse", void 0);
r([
  u("useSpecularOverAlpha")
], t.prototype, "_useSpecularOverAlpha", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "useSpecularOverAlpha", void 0);
r([
  u("useReflectionOverAlpha")
], t.prototype, "_useReflectionOverAlpha", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "useReflectionOverAlpha", void 0);
r([
  u("disableLighting")
], t.prototype, "_disableLighting", void 0);
r([
  n("_markAllSubMeshesAsLightsDirty")
], t.prototype, "disableLighting", void 0);
r([
  u("useObjectSpaceNormalMap")
], t.prototype, "_useObjectSpaceNormalMap", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "useObjectSpaceNormalMap", void 0);
r([
  u("useParallax")
], t.prototype, "_useParallax", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "useParallax", void 0);
r([
  u("useParallaxOcclusion")
], t.prototype, "_useParallaxOcclusion", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "useParallaxOcclusion", void 0);
r([
  u()
], t.prototype, "parallaxScaleBias", void 0);
r([
  u("roughness")
], t.prototype, "_roughness", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "roughness", void 0);
r([
  u()
], t.prototype, "indexOfRefraction", void 0);
r([
  u()
], t.prototype, "invertRefractionY", void 0);
r([
  u()
], t.prototype, "alphaCutOff", void 0);
r([
  u("useLightmapAsShadowmap")
], t.prototype, "_useLightmapAsShadowmap", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "useLightmapAsShadowmap", void 0);
r([
  N("diffuseFresnelParameters")
], t.prototype, "_diffuseFresnelParameters", void 0);
r([
  n("_markAllSubMeshesAsFresnelDirty")
], t.prototype, "diffuseFresnelParameters", void 0);
r([
  N("opacityFresnelParameters")
], t.prototype, "_opacityFresnelParameters", void 0);
r([
  n("_markAllSubMeshesAsFresnelAndMiscDirty")
], t.prototype, "opacityFresnelParameters", void 0);
r([
  N("reflectionFresnelParameters")
], t.prototype, "_reflectionFresnelParameters", void 0);
r([
  n("_markAllSubMeshesAsFresnelDirty")
], t.prototype, "reflectionFresnelParameters", void 0);
r([
  N("refractionFresnelParameters")
], t.prototype, "_refractionFresnelParameters", void 0);
r([
  n("_markAllSubMeshesAsFresnelDirty")
], t.prototype, "refractionFresnelParameters", void 0);
r([
  N("emissiveFresnelParameters")
], t.prototype, "_emissiveFresnelParameters", void 0);
r([
  n("_markAllSubMeshesAsFresnelDirty")
], t.prototype, "emissiveFresnelParameters", void 0);
r([
  u("useReflectionFresnelFromSpecular")
], t.prototype, "_useReflectionFresnelFromSpecular", void 0);
r([
  n("_markAllSubMeshesAsFresnelDirty")
], t.prototype, "useReflectionFresnelFromSpecular", void 0);
r([
  u("useGlossinessFromSpecularMapAlpha")
], t.prototype, "_useGlossinessFromSpecularMapAlpha", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "useGlossinessFromSpecularMapAlpha", void 0);
r([
  u("maxSimultaneousLights")
], t.prototype, "_maxSimultaneousLights", void 0);
r([
  n("_markAllSubMeshesAsLightsDirty")
], t.prototype, "maxSimultaneousLights", void 0);
r([
  u("invertNormalMapX")
], t.prototype, "_invertNormalMapX", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "invertNormalMapX", void 0);
r([
  u("invertNormalMapY")
], t.prototype, "_invertNormalMapY", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "invertNormalMapY", void 0);
r([
  u("twoSidedLighting")
], t.prototype, "_twoSidedLighting", void 0);
r([
  n("_markAllSubMeshesAsTexturesDirty")
], t.prototype, "twoSidedLighting", void 0);
r([
  u("applyDecalMapAfterDetailMap")
], t.prototype, "_applyDecalMapAfterDetailMap", void 0);
r([
  n("_markAllSubMeshesAsMiscDirty")
], t.prototype, "applyDecalMapAfterDetailMap", void 0);
Y("BABYLON.StandardMaterial", t);
H.DefaultMaterialFactory = (U) => new t("default material", U);
export {
  t as StandardMaterial,
  be as StandardMaterialDefines
};
//# sourceMappingURL=standardMaterial-BGd7au_T.js.map
