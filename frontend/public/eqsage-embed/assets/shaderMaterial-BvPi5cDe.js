import { S as M } from "./decorators.serialization-Bm9RMCgM.js";
import { a as V } from "./scene-DFGy8rST.js";
import { M as O, V as _, h as b, C as k, g as N, a as R, v as F, Q as I, W as w, d as B, R as q } from "./embed-entry-Dediijbe.js";
import { T as C } from "./texture-BSW_lwWZ.js";
import { E as j } from "./effectFallbacks-B5WqMfcA.js";
import { P as W } from "./vertexColorMixing-Ch47jSQx.js";
import { P as L, a as D, b as z, p as H, B as K, c as G, d as Q, e as X, f as J, g as Y } from "./materialHelper.functions-mmQKTRFK.js";
const S = { effect: null, subMesh: null };
class p extends W {
  /**
   * Instantiate a new shader material.
   * The ShaderMaterial object has the necessary methods to pass data from your scene to the Vertex and Fragment Shaders and returns a material that can be applied to any mesh.
   * This returned material effects how the mesh will look based on the code in the shaders.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/shaders/shaderMaterial
   * @param name Define the name of the material in the scene
   * @param scene Define the scene the material belongs to
   * @param shaderPath Defines  the route to the shader code.
   * @param options Define the options used to create the shader
   * @param storeEffectOnSubMeshes true to store effect on submeshes, false to store the effect directly in the material class.
   */
  constructor(t, s, e, o = {}, i = !0) {
    super(t, s, i), this._textures = {}, this._textureArrays = {}, this._externalTextures = {}, this._floats = {}, this._ints = {}, this._uints = {}, this._floatsArrays = {}, this._colors3 = {}, this._colors3Arrays = {}, this._colors4 = {}, this._colors4Arrays = {}, this._vectors2 = {}, this._vectors3 = {}, this._vectors4 = {}, this._quaternions = {}, this._quaternionsArrays = {}, this._matrices = {}, this._matrixArrays = {}, this._matrices3x3 = {}, this._matrices2x2 = {}, this._vectors2Arrays = {}, this._vectors3Arrays = {}, this._vectors4Arrays = {}, this._uniformBuffers = {}, this._textureSamplers = {}, this._storageBuffers = {}, this._cachedWorldViewMatrix = new O(), this._cachedWorldViewProjectionMatrix = new O(), this._multiview = !1, this._materialHelperNeedsPreviousMatrices = !1, this._shaderPath = e, this._options = {
      needAlphaBlending: !1,
      needAlphaTesting: !1,
      attributes: ["position", "normal", "uv"],
      uniforms: ["worldViewProjection"],
      uniformBuffers: [],
      samplers: [],
      externalTextures: [],
      samplerObjects: [],
      storageBuffers: [],
      defines: [],
      useClipPlane: !1,
      ...o
    };
  }
  /**
   * Gets the shader path used to define the shader code
   * It can be modified to trigger a new compilation
   */
  get shaderPath() {
    return this._shaderPath;
  }
  /**
   * Sets the shader path used to define the shader code
   * It can be modified to trigger a new compilation
   */
  set shaderPath(t) {
    this._shaderPath = t;
  }
  /**
   * Gets the options used to compile the shader.
   * They can be modified to trigger a new compilation
   */
  get options() {
    return this._options;
  }
  /**
   * is multiview set to true?
   */
  get isMultiview() {
    return this._multiview;
  }
  /**
   * Gets the current class name of the material e.g. "ShaderMaterial"
   * Mainly use in serialization.
   * @returns the class name
   */
  getClassName() {
    return "ShaderMaterial";
  }
  /**
   * Specifies if the material will require alpha blending
   * @returns a boolean specifying if alpha blending is needed
   */
  needAlphaBlending() {
    return this.alpha < 1 || this._options.needAlphaBlending;
  }
  /**
   * Specifies if this material should be rendered in alpha test mode
   * @returns a boolean specifying if an alpha test is needed.
   */
  needAlphaTesting() {
    return this._options.needAlphaTesting;
  }
  _checkUniform(t) {
    this._options.uniforms.indexOf(t) === -1 && this._options.uniforms.push(t);
  }
  /**
   * Set a texture in the shader.
   * @param name Define the name of the uniform samplers as defined in the shader
   * @param texture Define the texture to bind to this sampler
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setTexture(t, s) {
    return this._options.samplers.indexOf(t) === -1 && this._options.samplers.push(t), this._textures[t] = s, this;
  }
  /**
   * Set a texture array in the shader.
   * @param name Define the name of the uniform sampler array as defined in the shader
   * @param textures Define the list of textures to bind to this sampler
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setTextureArray(t, s) {
    return this._options.samplers.indexOf(t) === -1 && this._options.samplers.push(t), this._checkUniform(t), this._textureArrays[t] = s, this;
  }
  /**
   * Set an internal texture in the shader.
   * @param name Define the name of the uniform samplers as defined in the shader
   * @param texture Define the texture to bind to this sampler
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setExternalTexture(t, s) {
    return this._options.externalTextures.indexOf(t) === -1 && this._options.externalTextures.push(t), this._externalTextures[t] = s, this;
  }
  /**
   * Set a float in the shader.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setFloat(t, s) {
    return this._checkUniform(t), this._floats[t] = s, this;
  }
  /**
   * Set a int in the shader.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setInt(t, s) {
    return this._checkUniform(t), this._ints[t] = s, this;
  }
  /**
   * Set a unsigned int in the shader.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setUInt(t, s) {
    return this._checkUniform(t), this._uints[t] = s, this;
  }
  /**
   * Set an array of floats in the shader.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setFloats(t, s) {
    return this._checkUniform(t), this._floatsArrays[t] = s, this;
  }
  /**
   * Set a vec3 in the shader from a Color3.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setColor3(t, s) {
    return this._checkUniform(t), this._colors3[t] = s, this;
  }
  /**
   * Set a vec3 array in the shader from a Color3 array.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setColor3Array(t, s) {
    return this._checkUniform(t), this._colors3Arrays[t] = s.reduce((e, o) => (o.toArray(e, e.length), e), []), this;
  }
  /**
   * Set a vec4 in the shader from a Color4.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setColor4(t, s) {
    return this._checkUniform(t), this._colors4[t] = s, this;
  }
  /**
   * Set a vec4 array in the shader from a Color4 array.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setColor4Array(t, s) {
    return this._checkUniform(t), this._colors4Arrays[t] = s.reduce((e, o) => (o.toArray(e, e.length), e), []), this;
  }
  /**
   * Set a vec2 in the shader from a Vector2.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setVector2(t, s) {
    return this._checkUniform(t), this._vectors2[t] = s, this;
  }
  /**
   * Set a vec3 in the shader from a Vector3.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setVector3(t, s) {
    return this._checkUniform(t), this._vectors3[t] = s, this;
  }
  /**
   * Set a vec4 in the shader from a Vector4.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setVector4(t, s) {
    return this._checkUniform(t), this._vectors4[t] = s, this;
  }
  /**
   * Set a vec4 in the shader from a Quaternion.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setQuaternion(t, s) {
    return this._checkUniform(t), this._quaternions[t] = s, this;
  }
  /**
   * Set a vec4 array in the shader from a Quaternion array.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setQuaternionArray(t, s) {
    return this._checkUniform(t), this._quaternionsArrays[t] = s.reduce((e, o) => (o.toArray(e, e.length), e), []), this;
  }
  /**
   * Set a mat4 in the shader from a Matrix.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setMatrix(t, s) {
    return this._checkUniform(t), this._matrices[t] = s, this;
  }
  /**
   * Set a float32Array in the shader from a matrix array.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setMatrices(t, s) {
    this._checkUniform(t);
    const e = new Float32Array(s.length * 16);
    for (let o = 0; o < s.length; o++)
      s[o].copyToArray(e, o * 16);
    return this._matrixArrays[t] = e, this;
  }
  /**
   * Set a mat3 in the shader from a Float32Array.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setMatrix3x3(t, s) {
    return this._checkUniform(t), this._matrices3x3[t] = s, this;
  }
  /**
   * Set a mat2 in the shader from a Float32Array.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setMatrix2x2(t, s) {
    return this._checkUniform(t), this._matrices2x2[t] = s, this;
  }
  /**
   * Set a vec2 array in the shader from a number array.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setArray2(t, s) {
    return this._checkUniform(t), this._vectors2Arrays[t] = s, this;
  }
  /**
   * Set a vec3 array in the shader from a number array.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setArray3(t, s) {
    return this._checkUniform(t), this._vectors3Arrays[t] = s, this;
  }
  /**
   * Set a vec4 array in the shader from a number array.
   * @param name Define the name of the uniform as defined in the shader
   * @param value Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setArray4(t, s) {
    return this._checkUniform(t), this._vectors4Arrays[t] = s, this;
  }
  /**
   * Set a uniform buffer in the shader
   * @param name Define the name of the uniform as defined in the shader
   * @param buffer Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setUniformBuffer(t, s) {
    return this._options.uniformBuffers.indexOf(t) === -1 && this._options.uniformBuffers.push(t), this._uniformBuffers[t] = s, this;
  }
  /**
   * Set a texture sampler in the shader
   * @param name Define the name of the uniform as defined in the shader
   * @param sampler Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setTextureSampler(t, s) {
    return this._options.samplerObjects.indexOf(t) === -1 && this._options.samplerObjects.push(t), this._textureSamplers[t] = s, this;
  }
  /**
   * Set a storage buffer in the shader
   * @param name Define the name of the storage buffer as defined in the shader
   * @param buffer Define the value to give to the uniform
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setStorageBuffer(t, s) {
    return this._options.storageBuffers.indexOf(t) === -1 && this._options.storageBuffers.push(t), this._storageBuffers[t] = s, this;
  }
  /**
   * Adds, removes, or replaces the specified shader define and value.
   * * setDefine("MY_DEFINE", true); // enables a boolean define
   * * setDefine("MY_DEFINE", "0.5"); // adds "#define MY_DEFINE 0.5" to the shader (or sets and replaces the value of any existing define with that name)
   * * setDefine("MY_DEFINE", false); // disables and removes the define
   * Note if the active defines do change, the shader will be recompiled and this can be expensive.
   * @param define the define name e.g., "OUTPUT_TO_SRGB" or "#define OUTPUT_TO_SRGB". If the define was passed into the constructor already, the version used should match that, and in either case, it should not include any appended value.
   * @param value either the value of the define (e.g. a numerical value) or for booleans, true if the define should be enabled or false if it should be disabled
   * @returns the material itself allowing "fluent" like uniform updates
   */
  setDefine(t, s) {
    const e = t.trimEnd() + " ", o = this.options.defines.findIndex((i) => i === t || i.startsWith(e));
    return o >= 0 && this.options.defines.splice(o, 1), (typeof s != "boolean" || s) && this.options.defines.push(e + s), this;
  }
  /**
   * Specifies that the submesh is ready to be used
   * @param mesh defines the mesh to check
   * @param subMesh defines which submesh to check
   * @param useInstances specifies that instances should be used
   * @returns a boolean indicating that the submesh is ready or not
   */
  isReadyForSubMesh(t, s, e) {
    return this.isReady(t, e, s);
  }
  /**
   * Checks if the material is ready to render the requested mesh
   * @param mesh Define the mesh to render
   * @param useInstances Define whether or not the material is used with instances
   * @param subMesh defines which submesh to render
   * @returns true if ready, otherwise false
   */
  isReady(t, s, e) {
    const o = e && this._storeEffectOnSubMeshes;
    if (this.isFrozen) {
      const f = o ? e._drawWrapper : this._drawWrapper;
      if (f.effect && f._wasPreviouslyReady && f._wasPreviouslyUsingInstances === s)
        return !0;
    }
    const i = this.getScene(), n = i.getEngine(), a = [], h = [], c = new j();
    let g = this._shaderPath, r = this._options.uniforms, u = this._options.uniformBuffers, d = this._options.samplers;
    n.getCaps().multiview && i.activeCamera && i.activeCamera.outputRenderTarget && i.activeCamera.outputRenderTarget.getViewCount() > 1 && (this._multiview = !0, a.push("#define MULTIVIEW"), r.indexOf("viewProjection") !== -1 && r.indexOf("viewProjectionR") === -1 && r.push("viewProjectionR"));
    for (let f = 0; f < this._options.defines.length; f++) {
      const T = this._options.defines[f].indexOf("#define") === 0 ? this._options.defines[f] : `#define ${this._options.defines[f]}`;
      a.push(T);
    }
    for (let f = 0; f < this._options.attributes.length; f++)
      h.push(this._options.attributes[f]);
    if (t && t.isVerticesDataPresent(_.ColorKind) && (h.indexOf(_.ColorKind) === -1 && h.push(_.ColorKind), a.push("#define VERTEXCOLOR")), s && (a.push("#define INSTANCES"), L(h, this._materialHelperNeedsPreviousMatrices), t?.hasThinInstances && (a.push("#define THIN_INSTANCES"), t && t.isVerticesDataPresent(_.ColorInstanceKind) && (h.push(_.ColorInstanceKind), a.push("#define INSTANCESCOLOR")))), t && t.useBones && t.computeBonesUsingShaders && t.skeleton) {
      h.push(_.MatricesIndicesKind), h.push(_.MatricesWeightsKind), t.numBoneInfluencers > 4 && (h.push(_.MatricesIndicesExtraKind), h.push(_.MatricesWeightsExtraKind));
      const f = t.skeleton;
      a.push("#define NUM_BONE_INFLUENCERS " + t.numBoneInfluencers), c.addCPUSkinningFallback(0, t), f.isUsingTextureForMatrices ? (a.push("#define BONETEXTURE"), r.indexOf("boneTextureWidth") === -1 && r.push("boneTextureWidth"), this._options.samplers.indexOf("boneSampler") === -1 && this._options.samplers.push("boneSampler")) : (a.push("#define BonesPerMesh " + (f.bones.length + 1)), r.indexOf("mBones") === -1 && r.push("mBones"));
    } else
      a.push("#define NUM_BONE_INFLUENCERS 0");
    let x = 0;
    const l = t ? t.morphTargetManager : null;
    if (l) {
      const f = l.supportsUVs && a.indexOf("#define UV1") !== -1, T = l.supportsTangents && a.indexOf("#define TANGENT") !== -1, P = l.supportsNormals && a.indexOf("#define NORMAL") !== -1;
      x = l.numMaxInfluencers || l.numInfluencers, f && a.push("#define MORPHTARGETS_UV"), T && a.push("#define MORPHTARGETS_TANGENT"), P && a.push("#define MORPHTARGETS_NORMAL"), x > 0 && a.push("#define MORPHTARGETS"), l.isUsingTextureForTargets && (a.push("#define MORPHTARGETS_TEXTURE"), r.indexOf("morphTargetTextureIndices") === -1 && r.push("morphTargetTextureIndices"), this._options.samplers.indexOf("morphTargets") === -1 && this._options.samplers.push("morphTargets")), a.push("#define NUM_MORPH_INFLUENCERS " + x);
      for (let m = 0; m < x; m++)
        h.push(_.PositionKind + m), P && h.push(_.NormalKind + m), T && h.push(_.TangentKind + m), f && h.push(_.UVKind + "_" + m);
      x > 0 && (r = r.slice(), r.push("morphTargetInfluences"), r.push("morphTargetCount"), r.push("morphTargetTextureInfo"), r.push("morphTargetTextureIndices"));
    } else
      a.push("#define NUM_MORPH_INFLUENCERS 0");
    if (t) {
      const f = t.bakedVertexAnimationManager;
      f && f.isEnabled && (a.push("#define BAKED_VERTEX_ANIMATION_TEXTURE"), r.indexOf("bakedVertexAnimationSettings") === -1 && r.push("bakedVertexAnimationSettings"), r.indexOf("bakedVertexAnimationTextureSizeInverted") === -1 && r.push("bakedVertexAnimationTextureSizeInverted"), r.indexOf("bakedVertexAnimationTime") === -1 && r.push("bakedVertexAnimationTime"), this._options.samplers.indexOf("bakedVertexAnimationTexture") === -1 && this._options.samplers.push("bakedVertexAnimationTexture")), D(h, t, a);
    }
    for (const f in this._textures)
      if (!this._textures[f].isReady())
        return !1;
    t && this._shouldTurnAlphaTestOn(t) && a.push("#define ALPHATEST"), this._options.useClipPlane !== !1 && (z(r), H(this, i, a)), i.fogEnabled && t?.applyFog && i.fogMode !== V.FOGMODE_NONE && (a.push("#define FOG"), r.indexOf("view") === -1 && r.push("view"), r.indexOf("vFogInfos") === -1 && r.push("vFogInfos"), r.indexOf("vFogColor") === -1 && r.push("vFogColor")), this._useLogarithmicDepth && (a.push("#define LOGARITHMICDEPTH"), r.indexOf("logarithmicDepthConstant") === -1 && r.push("logarithmicDepthConstant")), this.customShaderNameResolve && (r = r.slice(), u = u.slice(), d = d.slice(), g = this.customShaderNameResolve(this.name, r, u, d, a, h));
    const y = o ? e._getDrawWrapper(void 0, !0) : this._drawWrapper, E = y?.effect ?? null, U = y?.defines ?? null, v = a.join(`
`);
    let A = E;
    return U !== v && (A = n.createEffect(g, {
      attributes: h,
      uniformsNames: r,
      uniformBuffersNames: u,
      samplers: d,
      defines: v,
      fallbacks: c,
      onCompiled: this.onCompiled,
      onError: this.onError,
      indexParameters: { maxSimultaneousMorphTargets: x },
      shaderLanguage: this._options.shaderLanguage
    }, n), o ? e.setEffect(A, v, this._materialContext) : y && y.setEffect(A, v), this._onEffectCreatedObservable && (S.effect = A, S.subMesh = e ?? t?.subMeshes[0] ?? null, this._onEffectCreatedObservable.notifyObservers(S))), y._wasPreviouslyUsingInstances = !!s, A?.isReady() ? (E !== A && i.resetCachedMaterial(), y._wasPreviouslyReady = !0, !0) : !1;
  }
  /**
   * Binds the world matrix to the material
   * @param world defines the world transformation matrix
   * @param effectOverride - If provided, use this effect instead of internal effect
   */
  bindOnlyWorldMatrix(t, s) {
    const e = this.getScene(), o = s ?? this.getEffect();
    o && (this._options.uniforms.indexOf("world") !== -1 && o.setMatrix("world", t), this._options.uniforms.indexOf("worldView") !== -1 && (t.multiplyToRef(e.getViewMatrix(), this._cachedWorldViewMatrix), o.setMatrix("worldView", this._cachedWorldViewMatrix)), this._options.uniforms.indexOf("worldViewProjection") !== -1 && (t.multiplyToRef(e.getTransformMatrix(), this._cachedWorldViewProjectionMatrix), o.setMatrix("worldViewProjection", this._cachedWorldViewProjectionMatrix)), this._options.uniforms.indexOf("view") !== -1 && o.setMatrix("view", e.getViewMatrix()));
  }
  /**
   * Binds the submesh to this material by preparing the effect and shader to draw
   * @param world defines the world transformation matrix
   * @param mesh defines the mesh containing the submesh
   * @param subMesh defines the submesh to bind the material to
   */
  bindForSubMesh(t, s, e) {
    this.bind(t, s, e._drawWrapperOverride?.effect, e);
  }
  /**
   * Binds the material to the mesh
   * @param world defines the world transformation matrix
   * @param mesh defines the mesh to bind the material to
   * @param effectOverride - If provided, use this effect instead of internal effect
   * @param subMesh defines the submesh to bind the material to
   */
  bind(t, s, e, o) {
    const i = o && this._storeEffectOnSubMeshes, n = e ?? (i ? o.effect : this.getEffect());
    if (!n)
      return;
    const a = this.getScene();
    this._activeEffect = n, this.bindOnlyWorldMatrix(t, e);
    const h = this._options.uniformBuffers;
    let c = !1;
    if (n && h && h.length > 0 && a.getEngine().supportsUniformBuffers)
      for (let r = 0; r < h.length; ++r)
        switch (h[r]) {
          case "Mesh":
            s && (s.getMeshUniformBuffer().bindToEffect(n, "Mesh"), s.transferToEffect(t));
            break;
          case "Scene":
            K(n, a.getSceneUniformBuffer()), a.finalizeSceneUbo(), c = !0;
            break;
        }
    const g = s && i ? this._mustRebind(a, n, o, s.visibility) : a.getCachedMaterial() !== this;
    if (n && g) {
      !c && this._options.uniforms.indexOf("view") !== -1 && n.setMatrix("view", a.getViewMatrix()), !c && this._options.uniforms.indexOf("projection") !== -1 && n.setMatrix("projection", a.getProjectionMatrix()), !c && this._options.uniforms.indexOf("viewProjection") !== -1 && (n.setMatrix("viewProjection", a.getTransformMatrix()), this._multiview && n.setMatrix("viewProjectionR", a._transformMatrixR)), a.activeCamera && this._options.uniforms.indexOf("cameraPosition") !== -1 && n.setVector3("cameraPosition", a.activeCamera.globalPosition), G(s, n), Q(n, this, a), this._useLogarithmicDepth && X(i ? o.materialDefines : n.defines, n, a), s && J(a, s, n);
      let r;
      for (r in this._textures)
        n.setTexture(r, this._textures[r]);
      for (r in this._textureArrays)
        n.setTextureArray(r, this._textureArrays[r]);
      for (r in this._externalTextures)
        n.setExternalTexture(r, this._externalTextures[r]);
      for (r in this._ints)
        n.setInt(r, this._ints[r]);
      for (r in this._uints)
        n.setUInt(r, this._uints[r]);
      for (r in this._floats)
        n.setFloat(r, this._floats[r]);
      for (r in this._floatsArrays)
        n.setArray(r, this._floatsArrays[r]);
      for (r in this._colors3)
        n.setColor3(r, this._colors3[r]);
      for (r in this._colors3Arrays)
        n.setArray3(r, this._colors3Arrays[r]);
      for (r in this._colors4) {
        const u = this._colors4[r];
        n.setFloat4(r, u.r, u.g, u.b, u.a);
      }
      for (r in this._colors4Arrays)
        n.setArray4(r, this._colors4Arrays[r]);
      for (r in this._vectors2)
        n.setVector2(r, this._vectors2[r]);
      for (r in this._vectors3)
        n.setVector3(r, this._vectors3[r]);
      for (r in this._vectors4)
        n.setVector4(r, this._vectors4[r]);
      for (r in this._quaternions)
        n.setQuaternion(r, this._quaternions[r]);
      for (r in this._matrices)
        n.setMatrix(r, this._matrices[r]);
      for (r in this._matrixArrays)
        n.setMatrices(r, this._matrixArrays[r]);
      for (r in this._matrices3x3)
        n.setMatrix3x3(r, this._matrices3x3[r]);
      for (r in this._matrices2x2)
        n.setMatrix2x2(r, this._matrices2x2[r]);
      for (r in this._vectors2Arrays)
        n.setArray2(r, this._vectors2Arrays[r]);
      for (r in this._vectors3Arrays)
        n.setArray3(r, this._vectors3Arrays[r]);
      for (r in this._vectors4Arrays)
        n.setArray4(r, this._vectors4Arrays[r]);
      for (r in this._quaternionsArrays)
        n.setArray4(r, this._quaternionsArrays[r]);
      for (r in this._uniformBuffers) {
        const u = this._uniformBuffers[r].getBuffer();
        u && n.bindUniformBuffer(u, r);
      }
      for (r in this._textureSamplers)
        n.setTextureSampler(r, this._textureSamplers[r]);
      for (r in this._storageBuffers)
        n.setStorageBuffer(r, this._storageBuffers[r]);
    }
    if (n && s && (g || !this.isFrozen)) {
      const r = s.morphTargetManager;
      r && r.numInfluencers > 0 && Y(s, n);
      const u = s.bakedVertexAnimationManager;
      if (u && u.isEnabled) {
        const d = i ? o._drawWrapper : this._drawWrapper;
        s.bakedVertexAnimationManager?.bind(n, !!d._wasPreviouslyUsingInstances);
      }
    }
    this._afterBind(s, n, o);
  }
  /**
   * Gets the active textures from the material
   * @returns an array of textures
   */
  getActiveTextures() {
    const t = super.getActiveTextures();
    for (const s in this._textures)
      t.push(this._textures[s]);
    for (const s in this._textureArrays) {
      const e = this._textureArrays[s];
      for (let o = 0; o < e.length; o++)
        t.push(e[o]);
    }
    return t;
  }
  /**
   * Specifies if the material uses a texture
   * @param texture defines the texture to check against the material
   * @returns a boolean specifying if the material uses the texture
   */
  hasTexture(t) {
    if (super.hasTexture(t))
      return !0;
    for (const s in this._textures)
      if (this._textures[s] === t)
        return !0;
    for (const s in this._textureArrays) {
      const e = this._textureArrays[s];
      for (let o = 0; o < e.length; o++)
        if (e[o] === t)
          return !0;
    }
    return !1;
  }
  /**
   * Makes a duplicate of the material, and gives it a new name
   * @param name defines the new name for the duplicated material
   * @returns the cloned material
   */
  clone(t) {
    const s = M.Clone(() => new p(t, this.getScene(), this._shaderPath, this._options, this._storeEffectOnSubMeshes), this);
    s.name = t, s.id = t, typeof s._shaderPath == "object" && (s._shaderPath = { ...s._shaderPath }), this._options = { ...this._options }, Object.keys(this._options).forEach((e) => {
      const o = this._options[e];
      Array.isArray(o) && (this._options[e] = o.slice(0));
    }), this.stencil.copyTo(s.stencil);
    for (const e in this._textures)
      s.setTexture(e, this._textures[e]);
    for (const e in this._textureArrays)
      s.setTextureArray(e, this._textureArrays[e]);
    for (const e in this._externalTextures)
      s.setExternalTexture(e, this._externalTextures[e]);
    for (const e in this._ints)
      s.setInt(e, this._ints[e]);
    for (const e in this._uints)
      s.setUInt(e, this._uints[e]);
    for (const e in this._floats)
      s.setFloat(e, this._floats[e]);
    for (const e in this._floatsArrays)
      s.setFloats(e, this._floatsArrays[e]);
    for (const e in this._colors3)
      s.setColor3(e, this._colors3[e]);
    for (const e in this._colors3Arrays)
      s._colors3Arrays[e] = this._colors3Arrays[e];
    for (const e in this._colors4)
      s.setColor4(e, this._colors4[e]);
    for (const e in this._colors4Arrays)
      s._colors4Arrays[e] = this._colors4Arrays[e];
    for (const e in this._vectors2)
      s.setVector2(e, this._vectors2[e]);
    for (const e in this._vectors3)
      s.setVector3(e, this._vectors3[e]);
    for (const e in this._vectors4)
      s.setVector4(e, this._vectors4[e]);
    for (const e in this._quaternions)
      s.setQuaternion(e, this._quaternions[e]);
    for (const e in this._quaternionsArrays)
      s._quaternionsArrays[e] = this._quaternionsArrays[e];
    for (const e in this._matrices)
      s.setMatrix(e, this._matrices[e]);
    for (const e in this._matrixArrays)
      s._matrixArrays[e] = this._matrixArrays[e].slice();
    for (const e in this._matrices3x3)
      s.setMatrix3x3(e, this._matrices3x3[e]);
    for (const e in this._matrices2x2)
      s.setMatrix2x2(e, this._matrices2x2[e]);
    for (const e in this._vectors2Arrays)
      s.setArray2(e, this._vectors2Arrays[e]);
    for (const e in this._vectors3Arrays)
      s.setArray3(e, this._vectors3Arrays[e]);
    for (const e in this._vectors4Arrays)
      s.setArray4(e, this._vectors4Arrays[e]);
    for (const e in this._uniformBuffers)
      s.setUniformBuffer(e, this._uniformBuffers[e]);
    for (const e in this._textureSamplers)
      s.setTextureSampler(e, this._textureSamplers[e]);
    for (const e in this._storageBuffers)
      s.setStorageBuffer(e, this._storageBuffers[e]);
    return s;
  }
  /**
   * Disposes the material
   * @param forceDisposeEffect specifies if effects should be forcefully disposed
   * @param forceDisposeTextures specifies if textures should be forcefully disposed
   * @param notBoundToMesh specifies if the material that is being disposed is known to be not bound to any mesh
   */
  dispose(t, s, e) {
    if (s) {
      let o;
      for (o in this._textures)
        this._textures[o].dispose();
      for (o in this._textureArrays) {
        const i = this._textureArrays[o];
        for (let n = 0; n < i.length; n++)
          i[n].dispose();
      }
    }
    this._textures = {}, super.dispose(t, s, e);
  }
  /**
   * Serializes this material in a JSON representation
   * @returns the serialized material object
   */
  serialize() {
    const t = M.Serialize(this);
    t.customType = "BABYLON.ShaderMaterial", t.uniqueId = this.uniqueId, t.options = this._options, t.shaderPath = this._shaderPath, t.storeEffectOnSubMeshes = this._storeEffectOnSubMeshes;
    let s;
    t.stencil = this.stencil.serialize(), t.textures = {};
    for (s in this._textures)
      t.textures[s] = this._textures[s].serialize();
    t.textureArrays = {};
    for (s in this._textureArrays) {
      t.textureArrays[s] = [];
      const e = this._textureArrays[s];
      for (let o = 0; o < e.length; o++)
        t.textureArrays[s].push(e[o].serialize());
    }
    t.ints = {};
    for (s in this._ints)
      t.ints[s] = this._ints[s];
    t.uints = {};
    for (s in this._uints)
      t.uints[s] = this._uints[s];
    t.floats = {};
    for (s in this._floats)
      t.floats[s] = this._floats[s];
    t.floatsArrays = {};
    for (s in this._floatsArrays)
      t.floatsArrays[s] = this._floatsArrays[s];
    t.colors3 = {};
    for (s in this._colors3)
      t.colors3[s] = this._colors3[s].asArray();
    t.colors3Arrays = {};
    for (s in this._colors3Arrays)
      t.colors3Arrays[s] = this._colors3Arrays[s];
    t.colors4 = {};
    for (s in this._colors4)
      t.colors4[s] = this._colors4[s].asArray();
    t.colors4Arrays = {};
    for (s in this._colors4Arrays)
      t.colors4Arrays[s] = this._colors4Arrays[s];
    t.vectors2 = {};
    for (s in this._vectors2)
      t.vectors2[s] = this._vectors2[s].asArray();
    t.vectors3 = {};
    for (s in this._vectors3)
      t.vectors3[s] = this._vectors3[s].asArray();
    t.vectors4 = {};
    for (s in this._vectors4)
      t.vectors4[s] = this._vectors4[s].asArray();
    t.quaternions = {};
    for (s in this._quaternions)
      t.quaternions[s] = this._quaternions[s].asArray();
    t.matrices = {};
    for (s in this._matrices)
      t.matrices[s] = this._matrices[s].asArray();
    t.matrixArray = {};
    for (s in this._matrixArrays)
      t.matrixArray[s] = this._matrixArrays[s];
    t.matrices3x3 = {};
    for (s in this._matrices3x3)
      t.matrices3x3[s] = this._matrices3x3[s];
    t.matrices2x2 = {};
    for (s in this._matrices2x2)
      t.matrices2x2[s] = this._matrices2x2[s];
    t.vectors2Arrays = {};
    for (s in this._vectors2Arrays)
      t.vectors2Arrays[s] = this._vectors2Arrays[s];
    t.vectors3Arrays = {};
    for (s in this._vectors3Arrays)
      t.vectors3Arrays[s] = this._vectors3Arrays[s];
    t.vectors4Arrays = {};
    for (s in this._vectors4Arrays)
      t.vectors4Arrays[s] = this._vectors4Arrays[s];
    t.quaternionsArrays = {};
    for (s in this._quaternionsArrays)
      t.quaternionsArrays[s] = this._quaternionsArrays[s];
    return t;
  }
  /**
   * Creates a shader material from parsed shader material data
   * @param source defines the JSON representation of the material
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @returns a new material
   */
  static Parse(t, s, e) {
    const o = M.Parse(() => new p(t.name, s, t.shaderPath, t.options, t.storeEffectOnSubMeshes), t, s, e);
    let i;
    t.stencil && o.stencil.parse(t.stencil, s, e);
    for (i in t.textures)
      o.setTexture(i, C.Parse(t.textures[i], s, e));
    for (i in t.textureArrays) {
      const n = t.textureArrays[i], a = [];
      for (let h = 0; h < n.length; h++)
        a.push(C.Parse(n[h], s, e));
      o.setTextureArray(i, a);
    }
    for (i in t.ints)
      o.setInt(i, t.ints[i]);
    for (i in t.uints)
      o.setUInt(i, t.uints[i]);
    for (i in t.floats)
      o.setFloat(i, t.floats[i]);
    for (i in t.floatsArrays)
      o.setFloats(i, t.floatsArrays[i]);
    for (i in t.colors3)
      o.setColor3(i, b.FromArray(t.colors3[i]));
    for (i in t.colors3Arrays) {
      const n = t.colors3Arrays[i].reduce((a, h, c) => (c % 3 === 0 ? a.push([h]) : a[a.length - 1].push(h), a), []).map((a) => b.FromArray(a));
      o.setColor3Array(i, n);
    }
    for (i in t.colors4)
      o.setColor4(i, k.FromArray(t.colors4[i]));
    for (i in t.colors4Arrays) {
      const n = t.colors4Arrays[i].reduce((a, h, c) => (c % 4 === 0 ? a.push([h]) : a[a.length - 1].push(h), a), []).map((a) => k.FromArray(a));
      o.setColor4Array(i, n);
    }
    for (i in t.vectors2)
      o.setVector2(i, N.FromArray(t.vectors2[i]));
    for (i in t.vectors3)
      o.setVector3(i, R.FromArray(t.vectors3[i]));
    for (i in t.vectors4)
      o.setVector4(i, F.FromArray(t.vectors4[i]));
    for (i in t.quaternions)
      o.setQuaternion(i, I.FromArray(t.quaternions[i]));
    for (i in t.matrices)
      o.setMatrix(i, O.FromArray(t.matrices[i]));
    for (i in t.matrixArray)
      o._matrixArrays[i] = new Float32Array(t.matrixArray[i]);
    for (i in t.matrices3x3)
      o.setMatrix3x3(i, t.matrices3x3[i]);
    for (i in t.matrices2x2)
      o.setMatrix2x2(i, t.matrices2x2[i]);
    for (i in t.vectors2Arrays)
      o.setArray2(i, t.vectors2Arrays[i]);
    for (i in t.vectors3Arrays)
      o.setArray3(i, t.vectors3Arrays[i]);
    for (i in t.vectors4Arrays)
      o.setArray4(i, t.vectors4Arrays[i]);
    for (i in t.quaternionsArrays)
      o.setArray4(i, t.quaternionsArrays[i]);
    return o;
  }
  /**
   * Creates a new ShaderMaterial from a snippet saved in a remote file
   * @param name defines the name of the ShaderMaterial to create (can be null or empty to use the one from the json data)
   * @param url defines the url to load from
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @returns a promise that will resolve to the new ShaderMaterial
   */
  static ParseFromFileAsync(t, s, e, o = "") {
    return new Promise((i, n) => {
      const a = new w();
      a.addEventListener("readystatechange", () => {
        if (a.readyState == 4)
          if (a.status == 200) {
            const h = JSON.parse(a.responseText), c = this.Parse(h, e || B.LastCreatedScene, o);
            t && (c.name = t), i(c);
          } else
            n("Unable to load the ShaderMaterial");
      }), a.open("GET", s), a.send();
    });
  }
  /**
   * Creates a ShaderMaterial from a snippet saved by the Inspector
   * @param snippetId defines the snippet to load
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures and relative dependencies
   * @returns a promise that will resolve to the new ShaderMaterial
   */
  static ParseFromSnippetAsync(t, s, e = "") {
    return new Promise((o, i) => {
      const n = new w();
      n.addEventListener("readystatechange", () => {
        if (n.readyState == 4)
          if (n.status == 200) {
            const a = JSON.parse(JSON.parse(n.responseText).jsonPayload), h = JSON.parse(a.shaderMaterial), c = this.Parse(h, s || B.LastCreatedScene, e);
            c.snippetId = t, o(c);
          } else
            i("Unable to load the snippet " + t);
      }), n.open("GET", this.SnippetUrl + "/" + t.replace(/#/g, "/")), n.send();
    });
  }
}
p.SnippetUrl = "https://snippet.babylonjs.com";
p.CreateFromSnippetAsync = p.ParseFromSnippetAsync;
q("BABYLON.ShaderMaterial", p);
export {
  p as S
};
//# sourceMappingURL=shaderMaterial-BvPi5cDe.js.map
