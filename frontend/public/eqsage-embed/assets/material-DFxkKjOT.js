import { b as l, c as o, O as b, L as m, d as k, T as g, a5 as S, S as M } from "./embed-entry-Bb6cfUYP.js";
import { U as B } from "./uniformBuffer-D86J-jiB.js";
import { P as C } from "./math.plane--GFy_WPN.js";
import { S as _ } from "./decorators.serialization-D-l6hUAn.js";
import { b as O } from "./scene-81J9Z4aI.js";
import { B as P } from "./materialHelper.functions-HqNmxRIS.js";
class c {
  /**
   * Creates a material stencil state instance
   */
  constructor() {
    this.reset();
  }
  /**
   * Resets all the stencil states to default values
   */
  reset() {
    this.enabled = !1, this.mask = 255, this.func = 519, this.funcRef = 1, this.funcMask = 255, this.opStencilFail = 7680, this.opDepthFail = 7680, this.opStencilDepthPass = 7681;
  }
  /**
   * Gets or sets the stencil function
   */
  get func() {
    return this._func;
  }
  set func(e) {
    this._func = e;
  }
  /**
   * Gets or sets the stencil function reference
   */
  get funcRef() {
    return this._funcRef;
  }
  set funcRef(e) {
    this._funcRef = e;
  }
  /**
   * Gets or sets the stencil function mask
   */
  get funcMask() {
    return this._funcMask;
  }
  set funcMask(e) {
    this._funcMask = e;
  }
  /**
   * Gets or sets the operation when the stencil test fails
   */
  get opStencilFail() {
    return this._opStencilFail;
  }
  set opStencilFail(e) {
    this._opStencilFail = e;
  }
  /**
   * Gets or sets the operation when the depth test fails
   */
  get opDepthFail() {
    return this._opDepthFail;
  }
  set opDepthFail(e) {
    this._opDepthFail = e;
  }
  /**
   * Gets or sets the operation when the stencil+depth test succeeds
   */
  get opStencilDepthPass() {
    return this._opStencilDepthPass;
  }
  set opStencilDepthPass(e) {
    this._opStencilDepthPass = e;
  }
  /**
   * Gets or sets the stencil mask
   */
  get mask() {
    return this._mask;
  }
  set mask(e) {
    this._mask = e;
  }
  /**
   * Enables or disables the stencil test
   */
  get enabled() {
    return this._enabled;
  }
  set enabled(e) {
    this._enabled = e;
  }
  /**
   * Get the current class name, useful for serialization or dynamic coding.
   * @returns "MaterialStencilState"
   */
  getClassName() {
    return "MaterialStencilState";
  }
  /**
   * Makes a duplicate of the current configuration into another one.
   * @param stencilState defines stencil state where to copy the info
   */
  copyTo(e) {
    _.Clone(() => e, this);
  }
  /**
   * Serializes this stencil configuration.
   * @returns - An object with the serialized config.
   */
  serialize() {
    return _.Serialize(this);
  }
  /**
   * Parses a stencil state configuration from a serialized object.
   * @param source - Serialized object.
   * @param scene Defines the scene we are parsing for
   * @param rootUrl Defines the rootUrl to load from
   */
  parse(e, s, n) {
    _.Parse(() => this, e, s, n);
  }
}
l([
  o()
], c.prototype, "func", null);
l([
  o()
], c.prototype, "funcRef", null);
l([
  o()
], c.prototype, "funcMask", null);
l([
  o()
], c.prototype, "opStencilFail", null);
l([
  o()
], c.prototype, "opDepthFail", null);
l([
  o()
], c.prototype, "opStencilDepthPass", null);
l([
  o()
], c.prototype, "mask", null);
l([
  o()
], c.prototype, "enabled", null);
var u;
(function(i) {
  i[i.Created = 1] = "Created", i[i.Disposed = 2] = "Disposed", i[i.GetDefineNames = 4] = "GetDefineNames", i[i.PrepareUniformBuffer = 8] = "PrepareUniformBuffer", i[i.IsReadyForSubMesh = 16] = "IsReadyForSubMesh", i[i.PrepareDefines = 32] = "PrepareDefines", i[i.BindForSubMesh = 64] = "BindForSubMesh", i[i.PrepareEffect = 128] = "PrepareEffect", i[i.GetAnimatables = 256] = "GetAnimatables", i[i.GetActiveTextures = 512] = "GetActiveTextures", i[i.HasTexture = 1024] = "HasTexture", i[i.FillRenderTargetTextures = 2048] = "FillRenderTargetTextures", i[i.HasRenderTargetTextures = 4096] = "HasRenderTargetTextures", i[i.HardBindForSubMesh = 8192] = "HardBindForSubMesh";
})(u || (u = {}));
class t {
  /**
   * If the material can be rendered to several textures with MRT extension
   */
  get canRenderToMRT() {
    return !1;
  }
  /**
   * Sets the alpha value of the material
   */
  set alpha(e) {
    if (this._alpha === e)
      return;
    const s = this._alpha;
    this._alpha = e, (s === 1 || e === 1) && this.markAsDirty(t.MiscDirtyFlag + t.PrePassDirtyFlag);
  }
  /**
   * Gets the alpha value of the material
   */
  get alpha() {
    return this._alpha;
  }
  /**
   * Sets the culling state (true to enable culling, false to disable)
   */
  set backFaceCulling(e) {
    this._backFaceCulling !== e && (this._backFaceCulling = e, this.markAsDirty(t.TextureDirtyFlag));
  }
  /**
   * Gets the culling state
   */
  get backFaceCulling() {
    return this._backFaceCulling;
  }
  /**
   * Sets the type of faces that should be culled (true for back faces, false for front faces)
   */
  set cullBackFaces(e) {
    this._cullBackFaces !== e && (this._cullBackFaces = e, this.markAsDirty(t.TextureDirtyFlag));
  }
  /**
   * Gets the type of faces that should be culled
   */
  get cullBackFaces() {
    return this._cullBackFaces;
  }
  /**
   * Block the dirty-mechanism for this specific material
   * When set to false after being true the material will be marked as dirty.
   */
  get blockDirtyMechanism() {
    return this._blockDirtyMechanism;
  }
  set blockDirtyMechanism(e) {
    this._blockDirtyMechanism !== e && (this._blockDirtyMechanism = e, e || this.markDirty());
  }
  /**
   * This allows you to modify the material without marking it as dirty after every change.
   * This function should be used if you need to make more than one dirty-enabling change to the material - adding a texture, setting a new fill mode and so on.
   * The callback will pass the material as an argument, so you can make your changes to it.
   * @param callback the callback to be executed that will update the material
   */
  atomicMaterialsUpdate(e) {
    this.blockDirtyMechanism = !0;
    try {
      e(this);
    } finally {
      this.blockDirtyMechanism = !1;
    }
  }
  /**
   * Gets a boolean indicating that current material needs to register RTT
   */
  get hasRenderTargetTextures() {
    return this._eventInfo.hasRenderTargetTextures = !1, this._callbackPluginEventHasRenderTargetTextures(this._eventInfo), this._eventInfo.hasRenderTargetTextures;
  }
  /**
   * Called during a dispose event
   */
  set onDispose(e) {
    this._onDisposeObserver && this.onDisposeObservable.remove(this._onDisposeObserver), this._onDisposeObserver = this.onDisposeObservable.add(e);
  }
  /**
   * An event triggered when the material is bound
   */
  get onBindObservable() {
    return this._onBindObservable || (this._onBindObservable = new b()), this._onBindObservable;
  }
  /**
   * Called during a bind event
   */
  set onBind(e) {
    this._onBindObserver && this.onBindObservable.remove(this._onBindObserver), this._onBindObserver = this.onBindObservable.add(e);
  }
  /**
   * An event triggered when the material is unbound
   */
  get onUnBindObservable() {
    return this._onUnBindObservable || (this._onUnBindObservable = new b()), this._onUnBindObservable;
  }
  /**
   * An event triggered when the effect is (re)created
   */
  get onEffectCreatedObservable() {
    return this._onEffectCreatedObservable || (this._onEffectCreatedObservable = new b()), this._onEffectCreatedObservable;
  }
  /**
   * Sets the value of the alpha mode.
   *
   * | Value | Type | Description |
   * | --- | --- | --- |
   * | 0 | ALPHA_DISABLE |   |
   * | 1 | ALPHA_ADD |   |
   * | 2 | ALPHA_COMBINE |   |
   * | 3 | ALPHA_SUBTRACT |   |
   * | 4 | ALPHA_MULTIPLY |   |
   * | 5 | ALPHA_MAXIMIZED |   |
   * | 6 | ALPHA_ONEONE |   |
   * | 7 | ALPHA_PREMULTIPLIED |   |
   * | 8 | ALPHA_PREMULTIPLIED_PORTERDUFF |   |
   * | 9 | ALPHA_INTERPOLATE |   |
   * | 10 | ALPHA_SCREENMODE |   |
   *
   */
  set alphaMode(e) {
    this._alphaMode !== e && (this._alphaMode = e, this.markAsDirty(t.TextureDirtyFlag));
  }
  /**
   * Gets the value of the alpha mode
   */
  get alphaMode() {
    return this._alphaMode;
  }
  /**
   * Sets the need depth pre-pass value
   */
  set needDepthPrePass(e) {
    this._needDepthPrePass !== e && (this._needDepthPrePass = e, this._needDepthPrePass && (this.checkReadyOnEveryCall = !0));
  }
  /**
   * Gets the depth pre-pass value
   */
  get needDepthPrePass() {
    return this._needDepthPrePass;
  }
  /**
   * Can this material render to prepass
   */
  get isPrePassCapable() {
    return !1;
  }
  /**
   * Sets the state for enabling fog
   */
  set fogEnabled(e) {
    this._fogEnabled !== e && (this._fogEnabled = e, this.markAsDirty(t.MiscDirtyFlag));
  }
  /**
   * Gets the value of the fog enabled state
   */
  get fogEnabled() {
    return this._fogEnabled;
  }
  get wireframe() {
    switch (this._fillMode) {
      case t.WireFrameFillMode:
      case t.LineListDrawMode:
      case t.LineLoopDrawMode:
      case t.LineStripDrawMode:
        return !0;
    }
    return this._scene.forceWireframe;
  }
  /**
   * Sets the state of wireframe mode
   */
  set wireframe(e) {
    this.fillMode = e ? t.WireFrameFillMode : t.TriangleFillMode;
  }
  /**
   * Gets the value specifying if point clouds are enabled
   */
  get pointsCloud() {
    switch (this._fillMode) {
      case t.PointFillMode:
      case t.PointListDrawMode:
        return !0;
    }
    return this._scene.forcePointsCloud;
  }
  /**
   * Sets the state of point cloud mode
   */
  set pointsCloud(e) {
    this.fillMode = e ? t.PointFillMode : t.TriangleFillMode;
  }
  /**
   * Gets the material fill mode
   */
  get fillMode() {
    return this._fillMode;
  }
  /**
   * Sets the material fill mode
   */
  set fillMode(e) {
    this._fillMode !== e && (this._fillMode = e, this.markAsDirty(t.MiscDirtyFlag));
  }
  /**
   * In case the depth buffer does not allow enough depth precision for your scene (might be the case in large scenes)
   * You can try switching to logarithmic depth.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/logarithmicDepthBuffer
   */
  get useLogarithmicDepth() {
    return this._useLogarithmicDepth;
  }
  set useLogarithmicDepth(e) {
    const s = this.getScene().getEngine().getCaps().fragmentDepthSupported;
    e && !s && m.Warn("Logarithmic depth has been requested for a material on a device that doesn't support it."), this._useLogarithmicDepth = e && s, this._markAllSubMeshesAsMiscDirty();
  }
  /** @internal */
  _getDrawWrapper() {
    return this._drawWrapper;
  }
  /**
   * @internal
   */
  _setDrawWrapper(e) {
    this._drawWrapper = e;
  }
  /**
   * Creates a material instance
   * @param name defines the name of the material
   * @param scene defines the scene to reference
   * @param doNotAdd specifies if the material should be added to the scene
   */
  constructor(e, s, n) {
    this.shadowDepthWrapper = null, this.allowShaderHotSwapping = !0, this.metadata = null, this.reservedDataStore = null, this.checkReadyOnEveryCall = !1, this.checkReadyOnlyOnce = !1, this.state = "", this._alpha = 1, this._backFaceCulling = !0, this._cullBackFaces = !0, this._blockDirtyMechanism = !1, this.onCompiled = null, this.onError = null, this.getRenderTargetTextures = null, this.doNotSerialize = !1, this._storeEffectOnSubMeshes = !1, this.animations = null, this.onDisposeObservable = new b(), this._onDisposeObserver = null, this._onUnBindObservable = null, this._onBindObserver = null, this._alphaMode = 2, this._needDepthPrePass = !1, this.disableDepthWrite = !1, this.disableColorWrite = !1, this.forceDepthWrite = !1, this.depthFunction = 0, this.separateCullingPass = !1, this._fogEnabled = !0, this.pointSize = 1, this.zOffset = 0, this.zOffsetUnits = 0, this.stencil = new c(), this._useUBO = !1, this._fillMode = t.TriangleFillMode, this._cachedDepthWriteState = !1, this._cachedColorWriteState = !1, this._cachedDepthFunctionState = 0, this._indexInSceneMaterialArray = -1, this.meshMap = null, this._parentContainer = null, this._uniformBufferLayoutBuilt = !1, this._eventInfo = {}, this._callbackPluginEventGeneric = () => {
    }, this._callbackPluginEventIsReadyForSubMesh = () => {
    }, this._callbackPluginEventPrepareDefines = () => {
    }, this._callbackPluginEventPrepareDefinesBeforeAttributes = () => {
    }, this._callbackPluginEventHardBindForSubMesh = () => {
    }, this._callbackPluginEventBindForSubMesh = () => {
    }, this._callbackPluginEventHasRenderTargetTextures = () => {
    }, this._callbackPluginEventFillRenderTargetTextures = () => {
    }, this._forceAlphaTest = !1, this._transparencyMode = null, this.name = e;
    const r = s || k.LastCreatedScene;
    r && (this._scene = r, this._dirtyCallbacks = {}, this._dirtyCallbacks[1] = this._markAllSubMeshesAsTexturesDirty.bind(this), this._dirtyCallbacks[2] = this._markAllSubMeshesAsLightsDirty.bind(this), this._dirtyCallbacks[4] = this._markAllSubMeshesAsFresnelDirty.bind(this), this._dirtyCallbacks[8] = this._markAllSubMeshesAsAttributesDirty.bind(this), this._dirtyCallbacks[16] = this._markAllSubMeshesAsMiscDirty.bind(this), this._dirtyCallbacks[32] = this._markAllSubMeshesAsPrePassDirty.bind(this), this._dirtyCallbacks[63] = this._markAllSubMeshesAsAllDirty.bind(this), this.id = e || g.RandomId(), this.uniqueId = this._scene.getUniqueId(), this._materialContext = this._scene.getEngine().createMaterialContext(), this._drawWrapper = new S(this._scene.getEngine(), !1), this._drawWrapper.materialContext = this._materialContext, this._scene.useRightHandedSystem ? this.sideOrientation = t.ClockWiseSideOrientation : this.sideOrientation = t.CounterClockWiseSideOrientation, this._uniformBuffer = new B(this._scene.getEngine(), void 0, void 0, e), this._useUBO = this.getScene().getEngine().supportsUniformBuffers, n || this._scene.addMaterial(this), this._scene.useMaterialMeshMap && (this.meshMap = {}), t.OnEventObservable.notifyObservers(this, u.Created));
  }
  /**
   * Returns a string representation of the current material
   * @param fullDetails defines a boolean indicating which levels of logging is desired
   * @returns a string with material information
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toString(e) {
    return "Name: " + this.name;
  }
  /**
   * Gets the class name of the material
   * @returns a string with the class name of the material
   */
  getClassName() {
    return "Material";
  }
  /** @internal */
  get _isMaterial() {
    return !0;
  }
  /**
   * Specifies if updates for the material been locked
   */
  get isFrozen() {
    return this.checkReadyOnlyOnce;
  }
  /**
   * Locks updates for the material
   */
  freeze() {
    this.markDirty(), this.checkReadyOnlyOnce = !0;
  }
  /**
   * Unlocks updates for the material
   */
  unfreeze() {
    this.markDirty(), this.checkReadyOnlyOnce = !1;
  }
  /**
   * Specifies if the material is ready to be used
   * @param mesh defines the mesh to check
   * @param useInstances specifies if instances should be used
   * @returns a boolean indicating if the material is ready to be used
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isReady(e, s) {
    return !0;
  }
  /**
   * Specifies that the submesh is ready to be used
   * @param mesh defines the mesh to check
   * @param subMesh defines which submesh to check
   * @param useInstances specifies that instances should be used
   * @returns a boolean indicating that the submesh is ready or not
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isReadyForSubMesh(e, s, n) {
    const r = s.materialDefines;
    return r ? (this._eventInfo.isReadyForSubMesh = !0, this._eventInfo.defines = r, this._callbackPluginEventIsReadyForSubMesh(this._eventInfo), this._eventInfo.isReadyForSubMesh) : !1;
  }
  /**
   * Returns the material effect
   * @returns the effect associated with the material
   */
  getEffect() {
    return this._drawWrapper.effect;
  }
  /**
   * Returns the current scene
   * @returns a Scene
   */
  getScene() {
    return this._scene;
  }
  /**
   * Gets the current transparency mode.
   */
  get transparencyMode() {
    return this._transparencyMode;
  }
  /**
   * Sets the transparency mode of the material.
   *
   * | Value | Type                                | Description |
   * | ----- | ----------------------------------- | ----------- |
   * | 0     | OPAQUE                              |             |
   * | 1     | ALPHATEST                           |             |
   * | 2     | ALPHABLEND                          |             |
   * | 3     | ALPHATESTANDBLEND                   |             |
   *
   */
  set transparencyMode(e) {
    this._transparencyMode !== e && (this._transparencyMode = e, this._forceAlphaTest = e === t.MATERIAL_ALPHATESTANDBLEND, this._markAllSubMeshesAsTexturesAndMiscDirty());
  }
  /**
   * Returns true if alpha blending should be disabled.
   */
  get _disableAlphaBlending() {
    return this._transparencyMode === t.MATERIAL_OPAQUE || this._transparencyMode === t.MATERIAL_ALPHATEST;
  }
  /**
   * Specifies whether or not this material should be rendered in alpha blend mode.
   * @returns a boolean specifying if alpha blending is needed
   */
  needAlphaBlending() {
    return this._disableAlphaBlending ? !1 : this.alpha < 1;
  }
  /**
   * Specifies if the mesh will require alpha blending
   * @param mesh defines the mesh to check
   * @returns a boolean specifying if alpha blending is needed for the mesh
   */
  needAlphaBlendingForMesh(e) {
    return e.visibility < 1 ? !0 : this._disableAlphaBlending ? !1 : e.hasVertexAlpha || this.needAlphaBlending();
  }
  /**
   * Specifies whether or not this material should be rendered in alpha test mode.
   * @returns a boolean specifying if an alpha test is needed.
   */
  needAlphaTesting() {
    return !!this._forceAlphaTest;
  }
  /**
   * Specifies if material alpha testing should be turned on for the mesh
   * @param mesh defines the mesh to check
   * @returns a boolean specifying if alpha testing should be turned on for the mesh
   */
  _shouldTurnAlphaTestOn(e) {
    return !this.needAlphaBlendingForMesh(e) && this.needAlphaTesting();
  }
  /**
   * Gets the texture used for the alpha test
   * @returns the texture to use for alpha testing
   */
  getAlphaTestTexture() {
    return null;
  }
  /**
   * Marks the material to indicate that it needs to be re-calculated
   * @param forceMaterialDirty - Forces the material to be marked as dirty for all components (same as this.markAsDirty(Material.AllDirtyFlag)). You should use this flag if the material is frozen and you want to force a recompilation.
   */
  markDirty(e = !1) {
    const s = this.getScene().meshes;
    for (const n of s)
      if (n.subMeshes) {
        for (const r of n.subMeshes)
          if (r.getMaterial() === this)
            for (const a of r._drawWrappers)
              a && this._materialContext === a.materialContext && (a._wasPreviouslyReady = !1, a._wasPreviouslyUsingInstances = null, a._forceRebindOnNextCall = e);
      }
    e && this.markAsDirty(t.AllDirtyFlag);
  }
  /**
   * @internal
   */
  _preBind(e, s = null) {
    const n = this._scene.getEngine(), a = (s ?? this.sideOrientation) === t.ClockWiseSideOrientation;
    return n.enableEffect(e || this._getDrawWrapper()), n.setState(this.backFaceCulling, this.zOffset, !1, a, this._scene._mirroredCameraPosition ? !this.cullBackFaces : this.cullBackFaces, this.stencil, this.zOffsetUnits), a;
  }
  /**
   * Binds the material to the mesh
   * @param world defines the world transformation matrix
   * @param mesh defines the mesh to bind the material to
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bind(e, s) {
  }
  /**
   * Initializes the uniform buffer layout for the shader.
   */
  buildUniformLayout() {
    const e = this._uniformBuffer;
    this._eventInfo.ubo = e, this._callbackPluginEventGeneric(u.PrepareUniformBuffer, this._eventInfo), e.create(), this._uniformBufferLayoutBuilt = !0;
  }
  /**
   * Binds the submesh to the material
   * @param world defines the world transformation matrix
   * @param mesh defines the mesh containing the submesh
   * @param subMesh defines the submesh to bind the material to
   */
  bindForSubMesh(e, s, n) {
    const r = n._drawWrapper;
    this._eventInfo.subMesh = n, this._callbackPluginEventBindForSubMesh(this._eventInfo), r._forceRebindOnNextCall = !1;
  }
  /**
   * Binds the world matrix to the material
   * @param world defines the world transformation matrix
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bindOnlyWorldMatrix(e) {
  }
  /**
   * Binds the view matrix to the effect
   * @param effect defines the effect to bind the view matrix to
   */
  bindView(e) {
    this._useUBO ? this._needToBindSceneUbo = !0 : e.setMatrix("view", this.getScene().getViewMatrix());
  }
  /**
   * Binds the view projection and projection matrices to the effect
   * @param effect defines the effect to bind the view projection and projection matrices to
   */
  bindViewProjection(e) {
    this._useUBO ? this._needToBindSceneUbo = !0 : (e.setMatrix("viewProjection", this.getScene().getTransformMatrix()), e.setMatrix("projection", this.getScene().getProjectionMatrix()));
  }
  /**
   * Binds the view matrix to the effect
   * @param effect defines the effect to bind the view matrix to
   * @param variableName name of the shader variable that will hold the eye position
   */
  bindEyePosition(e, s) {
    this._useUBO ? this._needToBindSceneUbo = !0 : this._scene.bindEyePosition(e, s);
  }
  /**
   * Processes to execute after binding the material to a mesh
   * @param mesh defines the rendered mesh
   * @param effect defines the effect used to bind the material
   * @param _subMesh defines the subMesh that the material has been bound for
   */
  _afterBind(e, s = null, n) {
    if (this._scene._cachedMaterial = this, this._needToBindSceneUbo && s && (this._needToBindSceneUbo = !1, P(s, this.getScene().getSceneUniformBuffer()), this._scene.finalizeSceneUbo()), e ? this._scene._cachedVisibility = e.visibility : this._scene._cachedVisibility = 1, this._onBindObservable && e && this._onBindObservable.notifyObservers(e), this.disableDepthWrite) {
      const r = this._scene.getEngine();
      this._cachedDepthWriteState = r.getDepthWrite(), r.setDepthWrite(!1);
    }
    if (this.disableColorWrite) {
      const r = this._scene.getEngine();
      this._cachedColorWriteState = r.getColorWrite(), r.setColorWrite(!1);
    }
    if (this.depthFunction !== 0) {
      const r = this._scene.getEngine();
      this._cachedDepthFunctionState = r.getDepthFunction() || 0, r.setDepthFunction(this.depthFunction);
    }
  }
  /**
   * Unbinds the material from the mesh
   */
  unbind() {
    this._onUnBindObservable && this._onUnBindObservable.notifyObservers(this), this.depthFunction !== 0 && this._scene.getEngine().setDepthFunction(this._cachedDepthFunctionState), this.disableDepthWrite && this._scene.getEngine().setDepthWrite(this._cachedDepthWriteState), this.disableColorWrite && this._scene.getEngine().setColorWrite(this._cachedColorWriteState);
  }
  /**
   * Returns the animatable textures.
   * @returns - Array of animatable textures.
   */
  getAnimatables() {
    return this._eventInfo.animatables = [], this._callbackPluginEventGeneric(u.GetAnimatables, this._eventInfo), this._eventInfo.animatables;
  }
  /**
   * Gets the active textures from the material
   * @returns an array of textures
   */
  getActiveTextures() {
    return this._eventInfo.activeTextures = [], this._callbackPluginEventGeneric(u.GetActiveTextures, this._eventInfo), this._eventInfo.activeTextures;
  }
  /**
   * Specifies if the material uses a texture
   * @param texture defines the texture to check against the material
   * @returns a boolean specifying if the material uses the texture
   */
  hasTexture(e) {
    return this._eventInfo.hasTexture = !1, this._eventInfo.texture = e, this._callbackPluginEventGeneric(u.HasTexture, this._eventInfo), this._eventInfo.hasTexture;
  }
  /**
   * Makes a duplicate of the material, and gives it a new name
   * @param name defines the new name for the duplicated material
   * @returns the cloned material
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clone(e) {
    return null;
  }
  _clonePlugins(e, s) {
    const n = {};
    if (this._serializePlugins(n), t._ParsePlugins(n, e, this._scene, s), this.pluginManager)
      for (const r of this.pluginManager._plugins) {
        const a = e.pluginManager.getPlugin(r.name);
        a && r.copyTo(a);
      }
  }
  /**
   * Gets the meshes bound to the material
   * @returns an array of meshes bound to the material
   */
  getBindedMeshes() {
    if (this.meshMap) {
      const e = [];
      for (const s in this.meshMap) {
        const n = this.meshMap[s];
        n && e.push(n);
      }
      return e;
    } else
      return this._scene.meshes.filter((s) => s.material === this);
  }
  /**
   * Force shader compilation
   * @param mesh defines the mesh associated with this material
   * @param onCompiled defines a function to execute once the material is compiled
   * @param options defines the options to configure the compilation
   * @param onError defines a function to execute if the material fails compiling
   */
  forceCompilation(e, s, n, r) {
    const a = {
      clipPlane: !1,
      useInstances: !1,
      ...n
    }, h = this.getScene(), d = this.allowShaderHotSwapping;
    this.allowShaderHotSwapping = !1;
    const p = () => {
      if (!this._scene || !this._scene.getEngine())
        return;
      const A = h.clipPlane;
      if (a.clipPlane && (h.clipPlane = new C(0, 0, 0, 1)), this._storeEffectOnSubMeshes) {
        let D = !0, y = null;
        if (e.subMeshes) {
          const f = new M(0, 0, 0, 0, 0, e, void 0, !1, !1);
          f.materialDefines && (f.materialDefines._renderId = -1), this.isReadyForSubMesh(e, f, a.useInstances) || (f.effect && f.effect.getCompilationError() && f.effect.allFallbacksProcessed() ? y = f.effect.getCompilationError() : (D = !1, setTimeout(p, 16)));
        }
        D && (this.allowShaderHotSwapping = d, y && r && r(y), s && s(this));
      } else
        this.isReady() ? (this.allowShaderHotSwapping = d, s && s(this)) : setTimeout(p, 16);
      a.clipPlane && (h.clipPlane = A);
    };
    p();
  }
  /**
   * Force shader compilation
   * @param mesh defines the mesh that will use this material
   * @param options defines additional options for compiling the shaders
   * @returns a promise that resolves when the compilation completes
   */
  forceCompilationAsync(e, s) {
    return new Promise((n, r) => {
      this.forceCompilation(e, () => {
        n();
      }, s, (a) => {
        r(a);
      });
    });
  }
  /**
   * Marks a define in the material to indicate that it needs to be re-computed
   * @param flag defines a flag used to determine which parts of the material have to be marked as dirty
   */
  markAsDirty(e) {
    this.getScene().blockMaterialDirtyMechanism || this._blockDirtyMechanism || (t._DirtyCallbackArray.length = 0, e & t.TextureDirtyFlag && t._DirtyCallbackArray.push(t._TextureDirtyCallBack), e & t.LightDirtyFlag && t._DirtyCallbackArray.push(t._LightsDirtyCallBack), e & t.FresnelDirtyFlag && t._DirtyCallbackArray.push(t._FresnelDirtyCallBack), e & t.AttributesDirtyFlag && t._DirtyCallbackArray.push(t._AttributeDirtyCallBack), e & t.MiscDirtyFlag && t._DirtyCallbackArray.push(t._MiscDirtyCallBack), e & t.PrePassDirtyFlag && t._DirtyCallbackArray.push(t._PrePassDirtyCallBack), t._DirtyCallbackArray.length && this._markAllSubMeshesAsDirty(t._RunDirtyCallBacks), this.getScene().resetCachedMaterial());
  }
  /**
   * Resets the draw wrappers cache for all submeshes that are using this material
   */
  resetDrawCache() {
    const e = this.getScene().meshes;
    for (const s of e)
      if (s.subMeshes)
        for (const n of s.subMeshes)
          n.getMaterial() === this && n.resetDrawCache();
  }
  /**
   * Marks all submeshes of a material to indicate that their material defines need to be re-calculated
   * @param func defines a function which checks material defines against the submeshes
   */
  _markAllSubMeshesAsDirty(e) {
    if (this.getScene().blockMaterialDirtyMechanism || this._blockDirtyMechanism)
      return;
    const s = this.getScene().meshes;
    for (const n of s)
      if (n.subMeshes) {
        for (const r of n.subMeshes)
          if (r.getMaterial(!1) === this)
            for (const a of r._drawWrappers)
              !a || !a.defines || !a.defines.markAllAsDirty || this._materialContext === a.materialContext && e(a.defines);
      }
  }
  /**
   * Indicates that the scene should check if the rendering now needs a prepass
   */
  _markScenePrePassDirty() {
    if (this.getScene().blockMaterialDirtyMechanism || this._blockDirtyMechanism)
      return;
    const e = this.getScene().enablePrePassRenderer();
    e && e.markAsDirty();
  }
  /**
   * Indicates that we need to re-calculated for all submeshes
   */
  _markAllSubMeshesAsAllDirty() {
    this._markAllSubMeshesAsDirty(t._AllDirtyCallBack);
  }
  /**
   * Indicates that image processing needs to be re-calculated for all submeshes
   */
  _markAllSubMeshesAsImageProcessingDirty() {
    this._markAllSubMeshesAsDirty(t._ImageProcessingDirtyCallBack);
  }
  /**
   * Indicates that textures need to be re-calculated for all submeshes
   */
  _markAllSubMeshesAsTexturesDirty() {
    this._markAllSubMeshesAsDirty(t._TextureDirtyCallBack);
  }
  /**
   * Indicates that fresnel needs to be re-calculated for all submeshes
   */
  _markAllSubMeshesAsFresnelDirty() {
    this._markAllSubMeshesAsDirty(t._FresnelDirtyCallBack);
  }
  /**
   * Indicates that fresnel and misc need to be re-calculated for all submeshes
   */
  _markAllSubMeshesAsFresnelAndMiscDirty() {
    this._markAllSubMeshesAsDirty(t._FresnelAndMiscDirtyCallBack);
  }
  /**
   * Indicates that lights need to be re-calculated for all submeshes
   */
  _markAllSubMeshesAsLightsDirty() {
    this._markAllSubMeshesAsDirty(t._LightsDirtyCallBack);
  }
  /**
   * Indicates that attributes need to be re-calculated for all submeshes
   */
  _markAllSubMeshesAsAttributesDirty() {
    this._markAllSubMeshesAsDirty(t._AttributeDirtyCallBack);
  }
  /**
   * Indicates that misc needs to be re-calculated for all submeshes
   */
  _markAllSubMeshesAsMiscDirty() {
    this._markAllSubMeshesAsDirty(t._MiscDirtyCallBack);
  }
  /**
   * Indicates that prepass needs to be re-calculated for all submeshes
   */
  _markAllSubMeshesAsPrePassDirty() {
    this._markAllSubMeshesAsDirty(t._MiscDirtyCallBack);
  }
  /**
   * Indicates that textures and misc need to be re-calculated for all submeshes
   */
  _markAllSubMeshesAsTexturesAndMiscDirty() {
    this._markAllSubMeshesAsDirty(t._TextureAndMiscDirtyCallBack);
  }
  _checkScenePerformancePriority() {
    if (this._scene.performancePriority !== O.BackwardCompatible) {
      this.checkReadyOnlyOnce = !0;
      const e = this._scene.onScenePerformancePriorityChangedObservable.addOnce(() => {
        this.checkReadyOnlyOnce = !1;
      });
      this.onDisposeObservable.add(() => {
        this._scene.onScenePerformancePriorityChangedObservable.remove(e);
      });
    }
  }
  /**
   * Sets the required values to the prepass renderer.
   * @param prePassRenderer defines the prepass renderer to setup.
   * @returns true if the pre pass is needed.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPrePassRenderer(e) {
    return !1;
  }
  /**
   * Disposes the material
   * @param forceDisposeEffect specifies if effects should be forcefully disposed
   * @param forceDisposeTextures specifies if textures should be forcefully disposed
   * @param notBoundToMesh specifies if the material that is being disposed is known to be not bound to any mesh
   */
  dispose(e, s, n) {
    const r = this.getScene();
    if (r.stopAnimation(this), r.freeProcessedMaterials(), r.removeMaterial(this), this._eventInfo.forceDisposeTextures = s, this._callbackPluginEventGeneric(u.Disposed, this._eventInfo), this._parentContainer) {
      const a = this._parentContainer.materials.indexOf(this);
      a > -1 && this._parentContainer.materials.splice(a, 1), this._parentContainer = null;
    }
    if (n !== !0)
      if (this.meshMap)
        for (const a in this.meshMap) {
          const h = this.meshMap[a];
          h && (h.material = null, this.releaseVertexArrayObject(h, e));
        }
      else {
        const a = r.meshes;
        for (const h of a)
          h.material === this && !h.sourceMesh && (h.material = null, this.releaseVertexArrayObject(h, e));
      }
    this._uniformBuffer.dispose(), e && this._drawWrapper.effect && (this._storeEffectOnSubMeshes || this._drawWrapper.effect.dispose(), this._drawWrapper.effect = null), this.metadata = null, this.onDisposeObservable.notifyObservers(this), this.onDisposeObservable.clear(), this._onBindObservable && this._onBindObservable.clear(), this._onUnBindObservable && this._onUnBindObservable.clear(), this._onEffectCreatedObservable && this._onEffectCreatedObservable.clear(), this._eventInfo && (this._eventInfo = {});
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  releaseVertexArrayObject(e, s) {
    const n = e.geometry;
    if (n)
      if (this._storeEffectOnSubMeshes) {
        if (e.subMeshes)
          for (const r of e.subMeshes)
            n._releaseVertexArrayObject(r.effect), s && r.effect && r.effect.dispose();
      } else
        n._releaseVertexArrayObject(this._drawWrapper.effect);
  }
  /**
   * Serializes this material
   * @returns the serialized material object
   */
  serialize() {
    const e = _.Serialize(this);
    return e.stencil = this.stencil.serialize(), e.uniqueId = this.uniqueId, this._serializePlugins(e), e;
  }
  _serializePlugins(e) {
    if (e.plugins = {}, this.pluginManager)
      for (const s of this.pluginManager._plugins)
        e.plugins[s.getClassName()] = s.serialize();
  }
  /**
   * Creates a material from parsed material data
   * @param parsedMaterial defines parsed material data
   * @param scene defines the hosting scene
   * @param rootUrl defines the root URL to use to load textures
   * @returns a new material
   */
  static Parse(e, s, n) {
    if (!e.customType)
      e.customType = "BABYLON.StandardMaterial";
    else if (e.customType === "BABYLON.PBRMaterial" && e.overloadedAlbedo && (e.customType = "BABYLON.LegacyPBRMaterial", !BABYLON.LegacyPBRMaterial))
      return m.Error("Your scene is trying to load a legacy version of the PBRMaterial, please, include it from the materials library."), null;
    const a = g.Instantiate(e.customType).Parse(e, s, n);
    return a._loadedUniqueId = e.uniqueId, a;
  }
  static _ParsePlugins(e, s, n, r) {
    if (e.plugins)
      for (const a in e.plugins) {
        const h = e.plugins[a];
        let d = s.pluginManager?.getPlugin(h.name);
        if (!d) {
          const p = g.Instantiate("BABYLON." + a);
          p && (d = new p(s));
        }
        d?.parse(h, n, r);
      }
  }
}
t.TriangleFillMode = 0;
t.WireFrameFillMode = 1;
t.PointFillMode = 2;
t.PointListDrawMode = 3;
t.LineListDrawMode = 4;
t.LineLoopDrawMode = 5;
t.LineStripDrawMode = 6;
t.TriangleStripDrawMode = 7;
t.TriangleFanDrawMode = 8;
t.ClockWiseSideOrientation = 0;
t.CounterClockWiseSideOrientation = 1;
t.TextureDirtyFlag = 1;
t.LightDirtyFlag = 2;
t.FresnelDirtyFlag = 4;
t.AttributesDirtyFlag = 8;
t.MiscDirtyFlag = 16;
t.PrePassDirtyFlag = 32;
t.AllDirtyFlag = 63;
t.MATERIAL_OPAQUE = 0;
t.MATERIAL_ALPHATEST = 1;
t.MATERIAL_ALPHABLEND = 2;
t.MATERIAL_ALPHATESTANDBLEND = 3;
t.MATERIAL_NORMALBLENDMETHOD_WHITEOUT = 0;
t.MATERIAL_NORMALBLENDMETHOD_RNM = 1;
t.OnEventObservable = new b();
t._AllDirtyCallBack = (i) => i.markAllAsDirty();
t._ImageProcessingDirtyCallBack = (i) => i.markAsImageProcessingDirty();
t._TextureDirtyCallBack = (i) => i.markAsTexturesDirty();
t._FresnelDirtyCallBack = (i) => i.markAsFresnelDirty();
t._MiscDirtyCallBack = (i) => i.markAsMiscDirty();
t._PrePassDirtyCallBack = (i) => i.markAsPrePassDirty();
t._LightsDirtyCallBack = (i) => i.markAsLightDirty();
t._AttributeDirtyCallBack = (i) => i.markAsAttributesDirty();
t._FresnelAndMiscDirtyCallBack = (i) => {
  t._FresnelDirtyCallBack(i), t._MiscDirtyCallBack(i);
};
t._TextureAndMiscDirtyCallBack = (i) => {
  t._TextureDirtyCallBack(i), t._MiscDirtyCallBack(i);
};
t._DirtyCallbackArray = [];
t._RunDirtyCallBacks = (i) => {
  for (const e of t._DirtyCallbackArray)
    e(i);
};
l([
  o()
], t.prototype, "id", void 0);
l([
  o()
], t.prototype, "uniqueId", void 0);
l([
  o()
], t.prototype, "name", void 0);
l([
  o()
], t.prototype, "metadata", void 0);
l([
  o()
], t.prototype, "checkReadyOnEveryCall", void 0);
l([
  o()
], t.prototype, "checkReadyOnlyOnce", void 0);
l([
  o()
], t.prototype, "state", void 0);
l([
  o("alpha")
], t.prototype, "_alpha", void 0);
l([
  o("backFaceCulling")
], t.prototype, "_backFaceCulling", void 0);
l([
  o("cullBackFaces")
], t.prototype, "_cullBackFaces", void 0);
l([
  o()
], t.prototype, "sideOrientation", void 0);
l([
  o("alphaMode")
], t.prototype, "_alphaMode", void 0);
l([
  o()
], t.prototype, "_needDepthPrePass", void 0);
l([
  o()
], t.prototype, "disableDepthWrite", void 0);
l([
  o()
], t.prototype, "disableColorWrite", void 0);
l([
  o()
], t.prototype, "forceDepthWrite", void 0);
l([
  o()
], t.prototype, "depthFunction", void 0);
l([
  o()
], t.prototype, "separateCullingPass", void 0);
l([
  o("fogEnabled")
], t.prototype, "_fogEnabled", void 0);
l([
  o()
], t.prototype, "pointSize", void 0);
l([
  o()
], t.prototype, "zOffset", void 0);
l([
  o()
], t.prototype, "zOffsetUnits", void 0);
l([
  o()
], t.prototype, "pointsCloud", null);
l([
  o()
], t.prototype, "fillMode", null);
l([
  o()
], t.prototype, "useLogarithmicDepth", null);
l([
  o()
], t.prototype, "transparencyMode", null);
const I = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Material: t
}, Symbol.toStringTag, { value: "Module" }));
export {
  t as M,
  u as a,
  I as m
};
//# sourceMappingURL=material-DFxkKjOT.js.map
