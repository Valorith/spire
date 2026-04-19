import { x as n } from "./embed-entry-BKE21f6Q.js";
const m = "bonesDeclaration", f = `#if NUM_BONE_INFLUENCERS>0
attribute vec4 matricesIndices;attribute vec4 matricesWeights;
#if NUM_BONE_INFLUENCERS>4
attribute vec4 matricesIndicesExtra;attribute vec4 matricesWeightsExtra;
#endif
#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#ifdef BONETEXTURE
uniform highp sampler2D boneSampler;uniform float boneTextureWidth;
#else
uniform mat4 mBones[BonesPerMesh];
#endif
#ifdef BONES_VELOCITY_ENABLED
uniform mat4 mPreviousBones[BonesPerMesh];
#endif
#ifdef BONETEXTURE
#define inline
mat4 readMatrixFromRawSampler(sampler2D smp,float index)
{float offset=index *4.0;float dx=1.0/boneTextureWidth;vec4 m0=texture2D(smp,vec2(dx*(offset+0.5),0.));vec4 m1=texture2D(smp,vec2(dx*(offset+1.5),0.));vec4 m2=texture2D(smp,vec2(dx*(offset+2.5),0.));vec4 m3=texture2D(smp,vec2(dx*(offset+3.5),0.));return mat4(m0,m1,m2,m3);}
#endif
#endif
#endif
`;
n.IncludesShadersStore[m] = f;
const d = "bakedVertexAnimationDeclaration", o = `#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
uniform float bakedVertexAnimationTime;uniform vec2 bakedVertexAnimationTextureSizeInverted;uniform vec4 bakedVertexAnimationSettings;uniform sampler2D bakedVertexAnimationTexture;
#ifdef INSTANCES
attribute vec4 bakedVertexAnimationSettingsInstanced;
#endif
#define inline
mat4 readMatrixFromRawSamplerVAT(sampler2D smp,float index,float frame)
{float offset=index*4.0;float frameUV=(frame+0.5)*bakedVertexAnimationTextureSizeInverted.y;float dx=bakedVertexAnimationTextureSizeInverted.x;vec4 m0=texture2D(smp,vec2(dx*(offset+0.5),frameUV));vec4 m1=texture2D(smp,vec2(dx*(offset+1.5),frameUV));vec4 m2=texture2D(smp,vec2(dx*(offset+2.5),frameUV));vec4 m3=texture2D(smp,vec2(dx*(offset+3.5),frameUV));return mat4(m0,m1,m2,m3);}
#endif
`;
n.IncludesShadersStore[d] = o;
const c = "instancesDeclaration", l = `#ifdef INSTANCES
attribute vec4 world0;attribute vec4 world1;attribute vec4 world2;attribute vec4 world3;
#ifdef INSTANCESCOLOR
attribute vec4 instanceColor;
#endif
#if defined(THIN_INSTANCES) && !defined(WORLD_UBO)
uniform mat4 world;
#endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY)
attribute vec4 previousWorld0;attribute vec4 previousWorld1;attribute vec4 previousWorld2;attribute vec4 previousWorld3;
#ifdef THIN_INSTANCES
uniform mat4 previousWorld;
#endif
#endif
#else
#if !defined(WORLD_UBO)
uniform mat4 world;
#endif
#if defined(VELOCITY) || defined(PREPASS_VELOCITY)
uniform mat4 previousWorld;
#endif
#endif
`;
n.IncludesShadersStore[c] = l;
const E = "instancesVertex", N = `#ifdef INSTANCES
mat4 finalWorld=mat4(world0,world1,world2,world3);
#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
mat4 finalPreviousWorld=mat4(previousWorld0,previousWorld1,previousWorld2,previousWorld3);
#endif
#ifdef THIN_INSTANCES
finalWorld=world*finalWorld;
#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
finalPreviousWorld=previousWorld*finalPreviousWorld;
#endif
#endif
#else
mat4 finalWorld=world;
#if defined(PREPASS_VELOCITY) || defined(VELOCITY)
mat4 finalPreviousWorld=previousWorld;
#endif
#endif
`;
n.IncludesShadersStore[E] = N;
const u = "bonesVertex", S = `#ifndef BAKED_VERTEX_ANIMATION_TEXTURE
#if NUM_BONE_INFLUENCERS>0
mat4 influence;
#ifdef BONETEXTURE
influence=readMatrixFromRawSampler(boneSampler,matricesIndices[0])*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence+=readMatrixFromRawSampler(boneSampler,matricesIndices[1])*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
influence+=readMatrixFromRawSampler(boneSampler,matricesIndices[2])*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
influence+=readMatrixFromRawSampler(boneSampler,matricesIndices[3])*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[0])*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[1])*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[2])*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
influence+=readMatrixFromRawSampler(boneSampler,matricesIndicesExtra[3])*matricesWeightsExtra[3];
#endif
#else
influence=mBones[int(matricesIndices[0])]*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
influence+=mBones[int(matricesIndices[1])]*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
influence+=mBones[int(matricesIndices[2])]*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
influence+=mBones[int(matricesIndices[3])]*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
influence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
influence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
influence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
influence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];
#endif
#endif
finalWorld=finalWorld*influence;
#endif
#endif
`;
n.IncludesShadersStore[u] = S;
const x = "bakedVertexAnimation", I = `#ifdef BAKED_VERTEX_ANIMATION_TEXTURE
{
#ifdef INSTANCES
#define BVASNAME bakedVertexAnimationSettingsInstanced
#else
#define BVASNAME bakedVertexAnimationSettings
#endif
float VATStartFrame=BVASNAME.x;float VATEndFrame=BVASNAME.y;float VATOffsetFrame=BVASNAME.z;float VATSpeed=BVASNAME.w;float totalFrames=VATEndFrame-VATStartFrame+1.0;float time=bakedVertexAnimationTime*VATSpeed/totalFrames;float frameCorrection=time<1.0 ? 0.0 : 1.0;float numOfFrames=totalFrames-frameCorrection;float VATFrameNum=fract(time)*numOfFrames;VATFrameNum=mod(VATFrameNum+VATOffsetFrame,numOfFrames);VATFrameNum=floor(VATFrameNum);VATFrameNum+=VATStartFrame+frameCorrection;mat4 VATInfluence;VATInfluence=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[0],VATFrameNum)*matricesWeights[0];
#if NUM_BONE_INFLUENCERS>1
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[1],VATFrameNum)*matricesWeights[1];
#endif
#if NUM_BONE_INFLUENCERS>2
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[2],VATFrameNum)*matricesWeights[2];
#endif
#if NUM_BONE_INFLUENCERS>3
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndices[3],VATFrameNum)*matricesWeights[3];
#endif
#if NUM_BONE_INFLUENCERS>4
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[0],VATFrameNum)*matricesWeightsExtra[0];
#endif
#if NUM_BONE_INFLUENCERS>5
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[1],VATFrameNum)*matricesWeightsExtra[1];
#endif
#if NUM_BONE_INFLUENCERS>6
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[2],VATFrameNum)*matricesWeightsExtra[2];
#endif
#if NUM_BONE_INFLUENCERS>7
VATInfluence+=readMatrixFromRawSamplerVAT(bakedVertexAnimationTexture,matricesIndicesExtra[3],VATFrameNum)*matricesWeightsExtra[3];
#endif
finalWorld=finalWorld*VATInfluence;}
#endif
`;
n.IncludesShadersStore[x] = I;
class A {
  constructor() {
    this._defines = {}, this._currentRank = 32, this._maxRank = -1, this._mesh = null;
  }
  /**
   * Removes the fallback from the bound mesh.
   */
  unBindMesh() {
    this._mesh = null;
  }
  /**
   * Adds a fallback on the specified property.
   * @param rank The rank of the fallback (Lower ranks will be fallbacked to first)
   * @param define The name of the define in the shader
   */
  addFallback(e, t) {
    this._defines[e] || (e < this._currentRank && (this._currentRank = e), e > this._maxRank && (this._maxRank = e), this._defines[e] = new Array()), this._defines[e].push(t);
  }
  /**
   * Sets the mesh to use CPU skinning when needing to fallback.
   * @param rank The rank of the fallback (Lower ranks will be fallbacked to first)
   * @param mesh The mesh to use the fallbacks.
   */
  addCPUSkinningFallback(e, t) {
    this._mesh = t, e < this._currentRank && (this._currentRank = e), e > this._maxRank && (this._maxRank = e);
  }
  /**
   * Checks to see if more fallbacks are still available.
   */
  get hasMoreFallbacks() {
    return this._currentRank <= this._maxRank;
  }
  /**
   * Removes the defines that should be removed when falling back.
   * @param currentDefines defines the current define statements for the shader.
   * @param effect defines the current effect we try to compile
   * @returns The resulting defines with defines of the current rank removed.
   */
  reduce(e, t) {
    if (this._mesh && this._mesh.computeBonesUsingShaders && this._mesh.numBoneInfluencers > 0) {
      this._mesh.computeBonesUsingShaders = !1, e = e.replace("#define NUM_BONE_INFLUENCERS " + this._mesh.numBoneInfluencers, "#define NUM_BONE_INFLUENCERS 0"), t._bonesComputationForcedToCPU = !0;
      const a = this._mesh.getScene();
      for (let r = 0; r < a.meshes.length; r++) {
        const i = a.meshes[r];
        if (!i.material) {
          !this._mesh.material && i.computeBonesUsingShaders && i.numBoneInfluencers > 0 && (i.computeBonesUsingShaders = !1);
          continue;
        }
        if (!(!i.computeBonesUsingShaders || i.numBoneInfluencers === 0)) {
          if (i.material.getEffect() === t)
            i.computeBonesUsingShaders = !1;
          else if (i.subMeshes) {
            for (const s of i.subMeshes)
              if (s.effect === t) {
                i.computeBonesUsingShaders = !1;
                break;
              }
          }
        }
      }
    } else {
      const a = this._defines[this._currentRank];
      if (a)
        for (let r = 0; r < a.length; r++)
          e = e.replace("#define " + a[r], "");
      this._currentRank++;
    }
    return e;
  }
}
export {
  A as E
};
//# sourceMappingURL=effectFallbacks-Bjk8RG3S.js.map
