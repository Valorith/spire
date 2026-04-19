import { a as l, O as B, h as N, C as V, U as v, V as d, M as P, Q as L, X as U, i as p, E as x, y as k, _ as w, R as z } from "./embed-entry-BgvWRWVI.js";
import { b as E, P as W } from "./scene-BUYFxCaC.js";
import { E as G } from "./engine-BUHA6kNQ.js";
import { TransformNode as A } from "./transformNode-CxtzTbrg.js";
import { U as Y } from "./uniformBuffer-y9hUmZfi.js";
import { A as K } from "./math.axis-Jb8Sl68r.js";
class Z {
  constructor() {
    this._checkCollisions = !1, this._collisionMask = -1, this._collisionGroup = -1, this._surroundingMeshes = null, this._collider = null, this._oldPositionForCollisions = new l(0, 0, 0), this._diffPositionForCollisions = new l(0, 0, 0), this._collisionResponse = !0;
  }
}
class Q {
  constructor() {
    this.facetNb = 0, this.partitioningSubdivisions = 10, this.partitioningBBoxRatio = 1.01, this.facetDataEnabled = !1, this.facetParameters = {}, this.bbSize = l.Zero(), this.subDiv = {
      // actual number of subdivisions per axis for ComputeNormals()
      max: 1,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      X: 1,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Y: 1,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Z: 1
    }, this.facetDepthSort = !1, this.facetDepthSortEnabled = !1;
  }
}
class X {
  constructor() {
    this._hasVertexAlpha = !1, this._useVertexColors = !0, this._numBoneInfluencers = 4, this._applyFog = !0, this._receiveShadows = !1, this._facetData = new Q(), this._visibility = 1, this._skeleton = null, this._layerMask = 268435455, this._computeBonesUsingShaders = !0, this._isActive = !1, this._onlyForInstances = !1, this._isActiveIntermediate = !1, this._onlyForInstancesIntermediate = !1, this._actAsRegularMesh = !1, this._currentLOD = null, this._currentLODIsUpToDate = !1, this._collisionRetryCount = 3, this._morphTargetManager = null, this._renderingGroupId = 0, this._bakedVertexAnimationManager = null, this._material = null, this._positions = null, this._pointerOverDisableMeshTesting = !1, this._meshCollisionData = new Z(), this._enableDistantPicking = !1, this._rawBoundingInfo = null;
  }
}
class D extends A {
  /**
   * No billboard
   */
  static get BILLBOARDMODE_NONE() {
    return A.BILLBOARDMODE_NONE;
  }
  /** Billboard on X axis */
  static get BILLBOARDMODE_X() {
    return A.BILLBOARDMODE_X;
  }
  /** Billboard on Y axis */
  static get BILLBOARDMODE_Y() {
    return A.BILLBOARDMODE_Y;
  }
  /** Billboard on Z axis */
  static get BILLBOARDMODE_Z() {
    return A.BILLBOARDMODE_Z;
  }
  /** Billboard on all axes */
  static get BILLBOARDMODE_ALL() {
    return A.BILLBOARDMODE_ALL;
  }
  /** Billboard on using position instead of orientation */
  static get BILLBOARDMODE_USE_POSITION() {
    return A.BILLBOARDMODE_USE_POSITION;
  }
  /**
   * Gets the number of facets in the mesh
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#what-is-a-mesh-facet
   */
  get facetNb() {
    return this._internalAbstractMeshDataInfo._facetData.facetNb;
  }
  /**
   * Gets or set the number (integer) of subdivisions per axis in the partitioning space
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#tweaking-the-partitioning
   */
  get partitioningSubdivisions() {
    return this._internalAbstractMeshDataInfo._facetData.partitioningSubdivisions;
  }
  set partitioningSubdivisions(t) {
    this._internalAbstractMeshDataInfo._facetData.partitioningSubdivisions = t;
  }
  /**
   * The ratio (float) to apply to the bounding box size to set to the partitioning space.
   * Ex : 1.01 (default) the partitioning space is 1% bigger than the bounding box
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#tweaking-the-partitioning
   */
  get partitioningBBoxRatio() {
    return this._internalAbstractMeshDataInfo._facetData.partitioningBBoxRatio;
  }
  set partitioningBBoxRatio(t) {
    this._internalAbstractMeshDataInfo._facetData.partitioningBBoxRatio = t;
  }
  /**
   * Gets or sets a boolean indicating that the facets must be depth sorted on next call to `updateFacetData()`.
   * Works only for updatable meshes.
   * Doesn't work with multi-materials
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#facet-depth-sort
   */
  get mustDepthSortFacets() {
    return this._internalAbstractMeshDataInfo._facetData.facetDepthSort;
  }
  set mustDepthSortFacets(t) {
    this._internalAbstractMeshDataInfo._facetData.facetDepthSort = t;
  }
  /**
   * The location (Vector3) where the facet depth sort must be computed from.
   * By default, the active camera position.
   * Used only when facet depth sort is enabled
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#facet-depth-sort
   */
  get facetDepthSortFrom() {
    return this._internalAbstractMeshDataInfo._facetData.facetDepthSortFrom;
  }
  set facetDepthSortFrom(t) {
    this._internalAbstractMeshDataInfo._facetData.facetDepthSortFrom = t;
  }
  /** number of collision detection tries. Change this value if not all collisions are detected and handled properly */
  get collisionRetryCount() {
    return this._internalAbstractMeshDataInfo._collisionRetryCount;
  }
  set collisionRetryCount(t) {
    this._internalAbstractMeshDataInfo._collisionRetryCount = t;
  }
  /**
   * gets a boolean indicating if facetData is enabled
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#what-is-a-mesh-facet
   */
  get isFacetDataEnabled() {
    return this._internalAbstractMeshDataInfo._facetData.facetDataEnabled;
  }
  /**
   * Gets or sets the morph target manager
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/morphTargets
   */
  get morphTargetManager() {
    return this._internalAbstractMeshDataInfo._morphTargetManager;
  }
  set morphTargetManager(t) {
    this._internalAbstractMeshDataInfo._morphTargetManager !== t && (this._internalAbstractMeshDataInfo._morphTargetManager = t, this._syncGeometryWithMorphTargetManager());
  }
  /**
   * Gets or sets the baked vertex animation manager
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/baked_texture_animations
   */
  get bakedVertexAnimationManager() {
    return this._internalAbstractMeshDataInfo._bakedVertexAnimationManager;
  }
  set bakedVertexAnimationManager(t) {
    this._internalAbstractMeshDataInfo._bakedVertexAnimationManager !== t && (this._internalAbstractMeshDataInfo._bakedVertexAnimationManager = t, this._markSubMeshesAsAttributesDirty());
  }
  /** @internal */
  _syncGeometryWithMorphTargetManager() {
  }
  /**
   * @internal
   */
  _updateNonUniformScalingState(t) {
    return super._updateNonUniformScalingState(t) ? (this._markSubMeshesAsMiscDirty(), !0) : !1;
  }
  /** @internal */
  get rawBoundingInfo() {
    return this._internalAbstractMeshDataInfo._rawBoundingInfo;
  }
  set rawBoundingInfo(t) {
    this._internalAbstractMeshDataInfo._rawBoundingInfo = t;
  }
  /** Set a function to call when this mesh collides with another one */
  set onCollide(t) {
    this._internalAbstractMeshDataInfo._meshCollisionData._onCollideObserver && this.onCollideObservable.remove(this._internalAbstractMeshDataInfo._meshCollisionData._onCollideObserver), this._internalAbstractMeshDataInfo._meshCollisionData._onCollideObserver = this.onCollideObservable.add(t);
  }
  /** Set a function to call when the collision's position changes */
  set onCollisionPositionChange(t) {
    this._internalAbstractMeshDataInfo._meshCollisionData._onCollisionPositionChangeObserver && this.onCollisionPositionChangeObservable.remove(this._internalAbstractMeshDataInfo._meshCollisionData._onCollisionPositionChangeObserver), this._internalAbstractMeshDataInfo._meshCollisionData._onCollisionPositionChangeObserver = this.onCollisionPositionChangeObservable.add(t);
  }
  /**
   * Gets or sets mesh visibility between 0 and 1 (default is 1)
   */
  get visibility() {
    return this._internalAbstractMeshDataInfo._visibility;
  }
  /**
   * Gets or sets mesh visibility between 0 and 1 (default is 1)
   */
  set visibility(t) {
    if (this._internalAbstractMeshDataInfo._visibility === t)
      return;
    const s = this._internalAbstractMeshDataInfo._visibility;
    this._internalAbstractMeshDataInfo._visibility = t, (s === 1 && t !== 1 || s !== 1 && t === 1) && this._markSubMeshesAsDirty((e) => {
      e.markAsMiscDirty(), e.markAsPrePassDirty();
    });
  }
  /**
   * Gets or sets the property which disables the test that is checking that the mesh under the pointer is the same than the previous time we tested for it (default: false).
   * Set this property to true if you want thin instances picking to be reported accurately when moving over the mesh.
   * Note that setting this property to true will incur some performance penalties when dealing with pointer events for this mesh so use it sparingly.
   */
  get pointerOverDisableMeshTesting() {
    return this._internalAbstractMeshDataInfo._pointerOverDisableMeshTesting;
  }
  set pointerOverDisableMeshTesting(t) {
    this._internalAbstractMeshDataInfo._pointerOverDisableMeshTesting = t;
  }
  /**
   * Specifies the rendering group id for this mesh (0 by default)
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering#rendering-groups
   */
  get renderingGroupId() {
    return this._internalAbstractMeshDataInfo._renderingGroupId;
  }
  set renderingGroupId(t) {
    this._internalAbstractMeshDataInfo._renderingGroupId = t;
  }
  /** Gets or sets current material */
  get material() {
    return this._internalAbstractMeshDataInfo._material;
  }
  set material(t) {
    this._internalAbstractMeshDataInfo._material !== t && (this._internalAbstractMeshDataInfo._material && this._internalAbstractMeshDataInfo._material.meshMap && (this._internalAbstractMeshDataInfo._material.meshMap[this.uniqueId] = void 0), this._internalAbstractMeshDataInfo._material = t, t && t.meshMap && (t.meshMap[this.uniqueId] = this), this.onMaterialChangedObservable.hasObservers() && this.onMaterialChangedObservable.notifyObservers(this), this.subMeshes && (this.resetDrawCache(), this._unBindEffect()));
  }
  /**
   * Gets the material used to render the mesh in a specific render pass
   * @param renderPassId render pass id
   * @returns material used for the render pass. If no specific material is used for this render pass, undefined is returned (meaning mesh.material is used for this pass)
   */
  getMaterialForRenderPass(t) {
    return this._internalAbstractMeshDataInfo._materialForRenderPass?.[t];
  }
  /**
   * Sets the material to be used to render the mesh in a specific render pass
   * @param renderPassId render pass id
   * @param material material to use for this render pass. If undefined is passed, no specific material will be used for this render pass but the regular material will be used instead (mesh.material)
   */
  setMaterialForRenderPass(t, s) {
    this.resetDrawCache(t), this._internalAbstractMeshDataInfo._materialForRenderPass || (this._internalAbstractMeshDataInfo._materialForRenderPass = []), this._internalAbstractMeshDataInfo._materialForRenderPass[t] = s;
  }
  /**
   * Gets or sets a boolean indicating that this mesh can receive realtime shadows
   * @see https://doc.babylonjs.com/features/featuresDeepDive/lights/shadows
   */
  get receiveShadows() {
    return this._internalAbstractMeshDataInfo._receiveShadows;
  }
  set receiveShadows(t) {
    this._internalAbstractMeshDataInfo._receiveShadows !== t && (this._internalAbstractMeshDataInfo._receiveShadows = t, this._markSubMeshesAsLightDirty());
  }
  /** Gets or sets a boolean indicating that this mesh contains vertex color data with alpha values */
  get hasVertexAlpha() {
    return this._internalAbstractMeshDataInfo._hasVertexAlpha;
  }
  set hasVertexAlpha(t) {
    this._internalAbstractMeshDataInfo._hasVertexAlpha !== t && (this._internalAbstractMeshDataInfo._hasVertexAlpha = t, this._markSubMeshesAsAttributesDirty(), this._markSubMeshesAsMiscDirty());
  }
  /** Gets or sets a boolean indicating that this mesh needs to use vertex color data to render (if this kind of vertex data is available in the geometry) */
  get useVertexColors() {
    return this._internalAbstractMeshDataInfo._useVertexColors;
  }
  set useVertexColors(t) {
    this._internalAbstractMeshDataInfo._useVertexColors !== t && (this._internalAbstractMeshDataInfo._useVertexColors = t, this._markSubMeshesAsAttributesDirty());
  }
  /**
   * Gets or sets a boolean indicating that bone animations must be computed by the GPU (true by default)
   */
  get computeBonesUsingShaders() {
    return this._internalAbstractMeshDataInfo._computeBonesUsingShaders;
  }
  set computeBonesUsingShaders(t) {
    this._internalAbstractMeshDataInfo._computeBonesUsingShaders !== t && (this._internalAbstractMeshDataInfo._computeBonesUsingShaders = t, this._markSubMeshesAsAttributesDirty());
  }
  /** Gets or sets the number of allowed bone influences per vertex (4 by default) */
  get numBoneInfluencers() {
    return this._internalAbstractMeshDataInfo._numBoneInfluencers;
  }
  set numBoneInfluencers(t) {
    this._internalAbstractMeshDataInfo._numBoneInfluencers !== t && (this._internalAbstractMeshDataInfo._numBoneInfluencers = t, this._markSubMeshesAsAttributesDirty());
  }
  /** Gets or sets a boolean indicating that this mesh will allow fog to be rendered on it (true by default) */
  get applyFog() {
    return this._internalAbstractMeshDataInfo._applyFog;
  }
  set applyFog(t) {
    this._internalAbstractMeshDataInfo._applyFog !== t && (this._internalAbstractMeshDataInfo._applyFog = t, this._markSubMeshesAsMiscDirty());
  }
  /** When enabled, decompose picking matrices for better precision with large values for mesh position and scling */
  get enableDistantPicking() {
    return this._internalAbstractMeshDataInfo._enableDistantPicking;
  }
  set enableDistantPicking(t) {
    this._internalAbstractMeshDataInfo._enableDistantPicking = t;
  }
  /**
   * Gets or sets the current layer mask (default is 0x0FFFFFFF)
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/layerMasksAndMultiCam
   */
  get layerMask() {
    return this._internalAbstractMeshDataInfo._layerMask;
  }
  set layerMask(t) {
    t !== this._internalAbstractMeshDataInfo._layerMask && (this._internalAbstractMeshDataInfo._layerMask = t, this._resyncLightSources());
  }
  /**
   * Gets or sets a collision mask used to mask collisions (default is -1).
   * A collision between A and B will happen if A.collisionGroup & b.collisionMask !== 0
   */
  get collisionMask() {
    return this._internalAbstractMeshDataInfo._meshCollisionData._collisionMask;
  }
  set collisionMask(t) {
    this._internalAbstractMeshDataInfo._meshCollisionData._collisionMask = isNaN(t) ? -1 : t;
  }
  /**
   * Gets or sets a collision response flag (default is true).
   * when collisionResponse is false, events are still triggered but colliding entity has no response
   * This helps creating trigger volume when user wants collision feedback events but not position/velocity
   * to respond to the collision.
   */
  get collisionResponse() {
    return this._internalAbstractMeshDataInfo._meshCollisionData._collisionResponse;
  }
  set collisionResponse(t) {
    this._internalAbstractMeshDataInfo._meshCollisionData._collisionResponse = t;
  }
  /**
   * Gets or sets the current collision group mask (-1 by default).
   * A collision between A and B will happen if A.collisionGroup & b.collisionMask !== 0
   */
  get collisionGroup() {
    return this._internalAbstractMeshDataInfo._meshCollisionData._collisionGroup;
  }
  set collisionGroup(t) {
    this._internalAbstractMeshDataInfo._meshCollisionData._collisionGroup = isNaN(t) ? -1 : t;
  }
  /**
   * Gets or sets current surrounding meshes (null by default).
   *
   * By default collision detection is tested against every mesh in the scene.
   * It is possible to set surroundingMeshes to a defined list of meshes and then only these specified
   * meshes will be tested for the collision.
   *
   * Note: if set to an empty array no collision will happen when this mesh is moved.
   */
  get surroundingMeshes() {
    return this._internalAbstractMeshDataInfo._meshCollisionData._surroundingMeshes;
  }
  set surroundingMeshes(t) {
    this._internalAbstractMeshDataInfo._meshCollisionData._surroundingMeshes = t;
  }
  /** Gets the list of lights affecting that mesh */
  get lightSources() {
    return this._lightSources;
  }
  /** @internal */
  get _positions() {
    return null;
  }
  /**
   * Gets or sets a skeleton to apply skinning transformations
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons
   */
  set skeleton(t) {
    const s = this._internalAbstractMeshDataInfo._skeleton;
    s && s.needInitialSkinMatrix && s._unregisterMeshWithPoseMatrix(this), t && t.needInitialSkinMatrix && t._registerMeshWithPoseMatrix(this), this._internalAbstractMeshDataInfo._skeleton = t, this._internalAbstractMeshDataInfo._skeleton || (this._bonesTransformMatrices = null), this._markSubMeshesAsAttributesDirty();
  }
  get skeleton() {
    return this._internalAbstractMeshDataInfo._skeleton;
  }
  // Constructor
  /**
   * Creates a new AbstractMesh
   * @param name defines the name of the mesh
   * @param scene defines the hosting scene
   */
  constructor(t, s = null) {
    switch (super(t, s, !1), this._internalAbstractMeshDataInfo = new X(), this._waitingMaterialId = null, this.cullingStrategy = D.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY, this.onCollideObservable = new B(), this.onCollisionPositionChangeObservable = new B(), this.onMaterialChangedObservable = new B(), this.definedFacingForward = !0, this._occlusionQuery = null, this._renderingGroup = null, this.alphaIndex = Number.MAX_VALUE, this.isVisible = !0, this.isPickable = !0, this.isNearPickable = !1, this.isNearGrabbable = !1, this.showSubMeshesBoundingBox = !1, this.isBlocker = !1, this.enablePointerMoveEvents = !1, this.outlineColor = N.Red(), this.outlineWidth = 0.02, this.overlayColor = N.Red(), this.overlayAlpha = 0.5, this.useOctreeForRenderingSelection = !0, this.useOctreeForPicking = !0, this.useOctreeForCollisions = !0, this.alwaysSelectAsActiveMesh = !1, this.doNotSyncBoundingInfo = !1, this.actionManager = null, this.ellipsoid = new l(0.5, 1, 0.5), this.ellipsoidOffset = new l(0, 0, 0), this.edgesWidth = 1, this.edgesColor = new V(1, 0, 0, 1), this._edgesRenderer = null, this._masterMesh = null, this._boundingInfo = null, this._boundingInfoIsDirty = !0, this._renderId = 0, this._intersectionsInProgress = new Array(), this._unIndexed = !1, this._lightSources = new Array(), this._waitingData = {
      lods: null,
      actions: null,
      freezeWorldMatrix: null
    }, this._bonesTransformMatrices = null, this._transformMatrixTexture = null, this.onRebuildObservable = new B(), this._onCollisionPositionChange = (e, i, a = null) => {
      i.subtractToRef(this._internalAbstractMeshDataInfo._meshCollisionData._oldPositionForCollisions, this._internalAbstractMeshDataInfo._meshCollisionData._diffPositionForCollisions), this._internalAbstractMeshDataInfo._meshCollisionData._diffPositionForCollisions.length() > G.CollisionsEpsilon && this.position.addInPlace(this._internalAbstractMeshDataInfo._meshCollisionData._diffPositionForCollisions), a && this.onCollideObservable.notifyObservers(a), this.onCollisionPositionChangeObservable.notifyObservers(this.position);
    }, s = this.getScene(), s.addMesh(this), this._resyncLightSources(), this._uniformBuffer = new Y(this.getScene().getEngine(), void 0, void 0, t, !this.getScene().getEngine().isWebGPU), this._buildUniformLayout(), s.performancePriority) {
      case E.Aggressive:
        this.doNotSyncBoundingInfo = !0;
      case E.Intermediate:
        this.alwaysSelectAsActiveMesh = !0, this.isPickable = !1;
        break;
    }
  }
  _buildUniformLayout() {
    this._uniformBuffer.addUniform("world", 16), this._uniformBuffer.addUniform("visibility", 1), this._uniformBuffer.create();
  }
  /**
   * Transfer the mesh values to its UBO.
   * @param world The world matrix associated with the mesh
   */
  transferToEffect(t) {
    const s = this._uniformBuffer;
    s.updateMatrix("world", t), s.updateFloat("visibility", this._internalAbstractMeshDataInfo._visibility), s.update();
  }
  /**
   * Gets the mesh uniform buffer.
   * @returns the uniform buffer of the mesh.
   */
  getMeshUniformBuffer() {
    return this._uniformBuffer;
  }
  /**
   * Returns the string "AbstractMesh"
   * @returns "AbstractMesh"
   */
  getClassName() {
    return "AbstractMesh";
  }
  /**
   * Gets a string representation of the current mesh
   * @param fullDetails defines a boolean indicating if full details must be included
   * @returns a string representation of the current mesh
   */
  toString(t) {
    let s = "Name: " + this.name + ", isInstance: " + (this.getClassName() !== "InstancedMesh" ? "YES" : "NO");
    s += ", # of submeshes: " + (this.subMeshes ? this.subMeshes.length : 0);
    const e = this._internalAbstractMeshDataInfo._skeleton;
    return e && (s += ", skeleton: " + e.name), t && (s += ", billboard mode: " + ["NONE", "X", "Y", null, "Z", null, null, "ALL"][this.billboardMode], s += ", freeze wrld mat: " + (this._isWorldMatrixFrozen || this._waitingData.freezeWorldMatrix ? "YES" : "NO")), s;
  }
  /**
   * @internal
   */
  _getEffectiveParent() {
    return this._masterMesh && this.billboardMode !== A.BILLBOARDMODE_NONE ? this._masterMesh : super._getEffectiveParent();
  }
  /**
   * @internal
   */
  _getActionManagerForTrigger(t, s = !0) {
    if (this.actionManager && (s || this.actionManager.isRecursive))
      if (t) {
        if (this.actionManager.hasSpecificTrigger(t))
          return this.actionManager;
      } else
        return this.actionManager;
    return this.parent ? this.parent._getActionManagerForTrigger(t, !1) : null;
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _rebuild(t = !1) {
    if (this.onRebuildObservable.notifyObservers(this), this._occlusionQuery !== null && (this._occlusionQuery = null), !!this.subMeshes) {
      for (const s of this.subMeshes)
        s._rebuild();
      this.resetDrawCache();
    }
  }
  /** @internal */
  _resyncLightSources() {
    this._lightSources.length = 0;
    for (const t of this.getScene().lights)
      t.isEnabled() && t.canAffectMesh(this) && this._lightSources.push(t);
    this._markSubMeshesAsLightDirty();
  }
  /**
   * @internal
   */
  _resyncLightSource(t) {
    const s = t.isEnabled() && t.canAffectMesh(this), e = this._lightSources.indexOf(t);
    let i = !1;
    if (e === -1) {
      if (!s)
        return;
      this._lightSources.push(t);
    } else {
      if (s)
        return;
      i = !0, this._lightSources.splice(e, 1);
    }
    this._markSubMeshesAsLightDirty(i);
  }
  /** @internal */
  _unBindEffect() {
    for (const t of this.subMeshes)
      t.setEffect(null);
  }
  /**
   * @internal
   */
  _removeLightSource(t, s) {
    const e = this._lightSources.indexOf(t);
    e !== -1 && (this._lightSources.splice(e, 1), this._markSubMeshesAsLightDirty(s));
  }
  _markSubMeshesAsDirty(t) {
    if (this.subMeshes)
      for (const s of this.subMeshes)
        for (let e = 0; e < s._drawWrappers.length; ++e) {
          const i = s._drawWrappers[e];
          !i || !i.defines || !i.defines.markAllAsDirty || t(i.defines);
        }
  }
  /**
   * @internal
   */
  _markSubMeshesAsLightDirty(t = !1) {
    this._markSubMeshesAsDirty((s) => s.markAsLightDirty(t));
  }
  /** @internal */
  _markSubMeshesAsAttributesDirty() {
    this._markSubMeshesAsDirty((t) => t.markAsAttributesDirty());
  }
  /** @internal */
  _markSubMeshesAsMiscDirty() {
    this._markSubMeshesAsDirty((t) => t.markAsMiscDirty());
  }
  /**
   * Flag the AbstractMesh as dirty (Forcing it to update everything)
   * @param property if set to "rotation" the objects rotationQuaternion will be set to null
   * @returns this AbstractMesh
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  markAsDirty(t) {
    return this._currentRenderId = Number.MAX_VALUE, this._isDirty = !0, this;
  }
  /**
   * Resets the draw wrappers cache for all submeshes of this abstract mesh
   * @param passId If provided, releases only the draw wrapper corresponding to this render pass id
   */
  resetDrawCache(t) {
    if (this.subMeshes)
      for (const s of this.subMeshes)
        s.resetDrawCache(t);
  }
  // Methods
  /**
   * Returns true if the mesh is blocked. Implemented by child classes
   */
  get isBlocked() {
    return !1;
  }
  /**
   * Returns the mesh itself by default. Implemented by child classes
   * @param camera defines the camera to use to pick the right LOD level
   * @returns the currentAbstractMesh
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLOD(t) {
    return this;
  }
  /**
   * Returns 0 by default. Implemented by child classes
   * @returns an integer
   */
  getTotalVertices() {
    return 0;
  }
  /**
   * Returns a positive integer : the total number of indices in this mesh geometry.
   * @returns the number of indices or zero if the mesh has no geometry.
   */
  getTotalIndices() {
    return 0;
  }
  /**
   * Returns null by default. Implemented by child classes
   * @returns null
   */
  getIndices() {
    return null;
  }
  /**
   * Returns the array of the requested vertex data kind. Implemented by child classes
   * @param kind defines the vertex data kind to use
   * @returns null
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getVerticesData(t) {
    return null;
  }
  /**
   * Sets the vertex data of the mesh geometry for the requested `kind`.
   * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
   * Note that a new underlying VertexBuffer object is created each call.
   * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
   * @param kind defines vertex data kind:
   * * VertexBuffer.PositionKind
   * * VertexBuffer.UVKind
   * * VertexBuffer.UV2Kind
   * * VertexBuffer.UV3Kind
   * * VertexBuffer.UV4Kind
   * * VertexBuffer.UV5Kind
   * * VertexBuffer.UV6Kind
   * * VertexBuffer.ColorKind
   * * VertexBuffer.MatricesIndicesKind
   * * VertexBuffer.MatricesIndicesExtraKind
   * * VertexBuffer.MatricesWeightsKind
   * * VertexBuffer.MatricesWeightsExtraKind
   * @param data defines the data source
   * @param updatable defines if the data must be flagged as updatable (or static)
   * @param stride defines the vertex stride (size of an entire vertex). Can be null and in this case will be deduced from vertex data kind
   * @returns the current mesh
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVerticesData(t, s, e, i) {
    return this;
  }
  /**
   * Updates the existing vertex data of the mesh geometry for the requested `kind`.
   * If the mesh has no geometry, it is simply returned as it is.
   * @param kind defines vertex data kind:
   * * VertexBuffer.PositionKind
   * * VertexBuffer.UVKind
   * * VertexBuffer.UV2Kind
   * * VertexBuffer.UV3Kind
   * * VertexBuffer.UV4Kind
   * * VertexBuffer.UV5Kind
   * * VertexBuffer.UV6Kind
   * * VertexBuffer.ColorKind
   * * VertexBuffer.MatricesIndicesKind
   * * VertexBuffer.MatricesIndicesExtraKind
   * * VertexBuffer.MatricesWeightsKind
   * * VertexBuffer.MatricesWeightsExtraKind
   * @param data defines the data source
   * @param updateExtends If `kind` is `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed
   * @param makeItUnique If true, a new global geometry is created from this data and is set to the mesh
   * @returns the current mesh
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateVerticesData(t, s, e, i) {
    return this;
  }
  /**
   * Sets the mesh indices,
   * If the mesh has no geometry, a new Geometry object is created and set to the mesh.
   * @param indices Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array)
   * @param totalVertices Defines the total number of vertices
   * @returns the current mesh
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setIndices(t, s) {
    return this;
  }
  /**
   * Gets a boolean indicating if specific vertex data is present
   * @param kind defines the vertex data kind to use
   * @returns true is data kind is present
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isVerticesDataPresent(t) {
    return !1;
  }
  /**
   * Returns the mesh BoundingInfo object or creates a new one and returns if it was undefined.
   * Note that it returns a shallow bounding of the mesh (i.e. it does not include children).
   * However, if the mesh contains thin instances, it will be expanded to include them. If you want the "raw" bounding data instead, then use `getRawBoundingInfo()`.
   * To get the full bounding of all children, call `getHierarchyBoundingVectors` instead.
   * @returns a BoundingInfo
   */
  getBoundingInfo() {
    return this._masterMesh ? this._masterMesh.getBoundingInfo() : (this._boundingInfoIsDirty && (this._boundingInfoIsDirty = !1, this._updateBoundingInfo()), this._boundingInfo);
  }
  /**
   * Returns the bounding info unnafected by instance data.
   * @returns the bounding info of the mesh unaffected by instance data.
   */
  getRawBoundingInfo() {
    return this.rawBoundingInfo ?? this.getBoundingInfo();
  }
  /**
   * Overwrite the current bounding info
   * @param boundingInfo defines the new bounding info
   * @returns the current mesh
   */
  setBoundingInfo(t) {
    return this._boundingInfo = t, this;
  }
  /**
   * Returns true if there is already a bounding info
   */
  get hasBoundingInfo() {
    return this._boundingInfo !== null;
  }
  /**
   * Creates a new bounding info for the mesh
   * @param minimum min vector of the bounding box/sphere
   * @param maximum max vector of the bounding box/sphere
   * @param worldMatrix defines the new world matrix
   * @returns the new bounding info
   */
  buildBoundingInfo(t, s, e) {
    return this._boundingInfo = new v(t, s, e), this._boundingInfo;
  }
  /**
   * Uniformly scales the mesh to fit inside of a unit cube (1 X 1 X 1 units)
   * @param includeDescendants Use the hierarchy's bounding box instead of the mesh's bounding box. Default is false
   * @param ignoreRotation ignore rotation when computing the scale (ie. object will be axis aligned). Default is false
   * @param predicate predicate that is passed in to getHierarchyBoundingVectors when selecting which object should be included when scaling
   * @returns the current mesh
   */
  normalizeToUnitCube(t = !0, s = !1, e) {
    return super.normalizeToUnitCube(t, s, e);
  }
  /** Gets a boolean indicating if this mesh has skinning data and an attached skeleton */
  get useBones() {
    return this.skeleton && this.getScene().skeletonsEnabled && this.isVerticesDataPresent(d.MatricesIndicesKind) && this.isVerticesDataPresent(d.MatricesWeightsKind);
  }
  /** @internal */
  _preActivate() {
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _preActivateForIntermediateRendering(t) {
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _activate(t, s) {
    return this._renderId = t, !0;
  }
  /** @internal */
  _postActivate() {
  }
  /** @internal */
  _freeze() {
  }
  /** @internal */
  _unFreeze() {
  }
  /**
   * Gets the current world matrix
   * @returns a Matrix
   */
  getWorldMatrix() {
    return this._masterMesh && this.billboardMode === A.BILLBOARDMODE_NONE ? this._masterMesh.getWorldMatrix() : super.getWorldMatrix();
  }
  /** @internal */
  _getWorldMatrixDeterminant() {
    return this._masterMesh ? this._masterMesh._getWorldMatrixDeterminant() : super._getWorldMatrixDeterminant();
  }
  /**
   * Gets a boolean indicating if this mesh is an instance or a regular mesh
   */
  get isAnInstance() {
    return !1;
  }
  /**
   * Gets a boolean indicating if this mesh has instances
   */
  get hasInstances() {
    return !1;
  }
  /**
   * Gets a boolean indicating if this mesh has thin instances
   */
  get hasThinInstances() {
    return !1;
  }
  // ================================== Point of View Movement =================================
  /**
   * Perform relative position change from the point of view of behind the front of the mesh.
   * This is performed taking into account the meshes current rotation, so you do not have to care.
   * Supports definition of mesh facing forward or backward {@link definedFacingForwardSearch | See definedFacingForwardSearch }.
   * @param amountRight defines the distance on the right axis
   * @param amountUp defines the distance on the up axis
   * @param amountForward defines the distance on the forward axis
   * @returns the current mesh
   */
  movePOV(t, s, e) {
    return this.position.addInPlace(this.calcMovePOV(t, s, e)), this;
  }
  /**
   * Calculate relative position change from the point of view of behind the front of the mesh.
   * This is performed taking into account the meshes current rotation, so you do not have to care.
   * Supports definition of mesh facing forward or backward {@link definedFacingForwardSearch | See definedFacingForwardSearch }.
   * @param amountRight defines the distance on the right axis
   * @param amountUp defines the distance on the up axis
   * @param amountForward defines the distance on the forward axis
   * @returns the new displacement vector
   */
  calcMovePOV(t, s, e) {
    const i = new P();
    (this.rotationQuaternion ? this.rotationQuaternion : L.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z)).toRotationMatrix(i);
    const o = l.Zero(), n = this.definedFacingForward ? -1 : 1;
    return l.TransformCoordinatesFromFloatsToRef(t * n, s, e * n, i, o), o;
  }
  // ================================== Point of View Rotation =================================
  /**
   * Perform relative rotation change from the point of view of behind the front of the mesh.
   * Supports definition of mesh facing forward or backward {@link definedFacingForwardSearch | See definedFacingForwardSearch }.
   * @param flipBack defines the flip
   * @param twirlClockwise defines the twirl
   * @param tiltRight defines the tilt
   * @returns the current mesh
   */
  rotatePOV(t, s, e) {
    return this.rotation.addInPlace(this.calcRotatePOV(t, s, e)), this;
  }
  /**
   * Calculate relative rotation change from the point of view of behind the front of the mesh.
   * Supports definition of mesh facing forward or backward {@link definedFacingForwardSearch | See definedFacingForwardSearch }.
   * @param flipBack defines the flip
   * @param twirlClockwise defines the twirl
   * @param tiltRight defines the tilt
   * @returns the new rotation vector
   */
  calcRotatePOV(t, s, e) {
    const i = this.definedFacingForward ? 1 : -1;
    return new l(t * i, s, e * i);
  }
  /**
   * This method recomputes and sets a new BoundingInfo to the mesh unless it is locked.
   * This means the mesh underlying bounding box and sphere are recomputed.
   * @param applySkeleton defines whether to apply the skeleton before computing the bounding info
   * @param applyMorph  defines whether to apply the morph target before computing the bounding info
   * @returns the current mesh
   */
  refreshBoundingInfo(t = !1, s = !1) {
    return this._boundingInfo && this._boundingInfo.isLocked ? this : (this._refreshBoundingInfo(this._getPositionData(t, s), null), this);
  }
  /**
   * @internal
   */
  _refreshBoundingInfo(t, s) {
    if (t) {
      const e = U(t, 0, this.getTotalVertices(), s);
      this._boundingInfo ? this._boundingInfo.reConstruct(e.minimum, e.maximum) : this._boundingInfo = new v(e.minimum, e.maximum);
    }
    if (this.subMeshes)
      for (let e = 0; e < this.subMeshes.length; e++)
        this.subMeshes[e].refreshBoundingInfo(t);
    this._updateBoundingInfo();
  }
  /**
   * Internal function to get buffer data and possibly apply morphs and normals
   * @param applySkeleton
   * @param applyMorph
   * @param data
   * @param kind the kind of data you want. Can be Normal or Position
   * @returns a FloatArray of the vertex data
   */
  _getData(t = !1, s = !1, e, i = d.PositionKind) {
    if (e = e ?? this.getVerticesData(i).slice(), e && s && this.morphTargetManager) {
      let a = 0, o = 0;
      for (let n = 0; n < e.length; n++) {
        let r = e[n];
        for (let c = 0; c < this.morphTargetManager.numTargets; c++) {
          const _ = this.morphTargetManager.getTarget(c), h = _.influence;
          if (h !== 0) {
            let u = null;
            switch (i) {
              case d.PositionKind:
                u = _.getPositions();
                break;
              case d.NormalKind:
                u = _.getNormals();
                break;
              case d.TangentKind:
                u = _.getTangents();
                break;
              case d.UVKind:
                u = _.getUVs();
                break;
            }
            u && (r += (u[n] - e[n]) * h);
          }
        }
        if (e[n] = r, a++, i === d.PositionKind && this._positions && a === 3) {
          a = 0;
          const c = o * 3;
          this._positions[o++].copyFromFloats(e[c], e[c + 1], e[c + 2]);
        }
      }
    }
    if (e && t && this.skeleton) {
      const a = this.getVerticesData(d.MatricesIndicesKind), o = this.getVerticesData(d.MatricesWeightsKind);
      if (o && a) {
        const n = this.numBoneInfluencers > 4, r = n ? this.getVerticesData(d.MatricesIndicesExtraKind) : null, c = n ? this.getVerticesData(d.MatricesWeightsExtraKind) : null, _ = this.skeleton.getTransformMatrices(this), h = p.Vector3[0], u = p.Matrix[0], m = p.Matrix[1];
        let I = 0;
        for (let f = 0; f < e.length; f += 3, I += 4) {
          u.reset();
          let b, g;
          for (b = 0; b < 4; b++)
            g = o[I + b], g > 0 && (P.FromFloat32ArrayToRefScaled(_, Math.floor(a[I + b] * 16), g, m), u.addToSelf(m));
          if (n)
            for (b = 0; b < 4; b++)
              g = c[I + b], g > 0 && (P.FromFloat32ArrayToRefScaled(_, Math.floor(r[I + b] * 16), g, m), u.addToSelf(m));
          i === d.NormalKind ? l.TransformNormalFromFloatsToRef(e[f], e[f + 1], e[f + 2], u, h) : l.TransformCoordinatesFromFloatsToRef(e[f], e[f + 1], e[f + 2], u, h), h.toArray(e, f), i === d.PositionKind && this._positions && this._positions[f / 3].copyFrom(h);
        }
      }
    }
    return e;
  }
  /**
   * Get the normals vertex data and optionally apply skeleton and morphing.
   * @param applySkeleton defines whether to apply the skeleton
   * @param applyMorph  defines whether to apply the morph target
   * @returns the normals data
   */
  getNormalsData(t = !1, s = !1) {
    return this._getData(t, s, null, d.NormalKind);
  }
  /**
   * Get the position vertex data and optionally apply skeleton and morphing.
   * @param applySkeleton defines whether to apply the skeleton
   * @param applyMorph  defines whether to apply the morph target
   * @param data defines the position data to apply the skeleton and morph to
   * @returns the position data
   */
  getPositionData(t = !1, s = !1, e) {
    return this._getData(t, s, e, d.PositionKind);
  }
  /**
   * @internal
   */
  _getPositionData(t, s) {
    let e = this.getVerticesData(d.PositionKind);
    if (this._internalAbstractMeshDataInfo._positions && (this._internalAbstractMeshDataInfo._positions = null), e && (t && this.skeleton || s && this.morphTargetManager)) {
      if (e = e.slice(), this._generatePointsArray(), this._positions) {
        const i = this._positions;
        this._internalAbstractMeshDataInfo._positions = new Array(i.length);
        for (let a = 0; a < i.length; a++)
          this._internalAbstractMeshDataInfo._positions[a] = i[a]?.clone() || new l();
      }
      return this.getPositionData(t, s, e);
    }
    return e;
  }
  /** @internal */
  _updateBoundingInfo() {
    return this._boundingInfo ? this._boundingInfo.update(this.worldMatrixFromCache) : this._boundingInfo = new v(l.Zero(), l.Zero(), this.worldMatrixFromCache), this._updateSubMeshesBoundingInfo(this.worldMatrixFromCache), this;
  }
  /**
   * @internal
   */
  _updateSubMeshesBoundingInfo(t) {
    if (!this.subMeshes)
      return this;
    const s = this.subMeshes.length;
    for (let e = 0; e < s; e++) {
      const i = this.subMeshes[e];
      (s > 1 || !i.IsGlobal) && i.updateBoundingInfo(t);
    }
    return this;
  }
  /** @internal */
  _afterComputeWorldMatrix() {
    this.doNotSyncBoundingInfo || (this._boundingInfoIsDirty = !0);
  }
  /**
   * Returns `true` if the mesh is within the frustum defined by the passed array of planes.
   * A mesh is in the frustum if its bounding box intersects the frustum
   * @param frustumPlanes defines the frustum to test
   * @returns true if the mesh is in the frustum planes
   */
  isInFrustum(t) {
    return this.getBoundingInfo().isInFrustum(t, this.cullingStrategy);
  }
  /**
   * Returns `true` if the mesh is completely in the frustum defined be the passed array of planes.
   * A mesh is completely in the frustum if its bounding box it completely inside the frustum.
   * @param frustumPlanes defines the frustum to test
   * @returns true if the mesh is completely in the frustum planes
   */
  isCompletelyInFrustum(t) {
    return this.getBoundingInfo().isCompletelyInFrustum(t);
  }
  /**
   * True if the mesh intersects another mesh or a SolidParticle object
   * @param mesh defines a target mesh or SolidParticle to test
   * @param precise Unless the parameter `precise` is set to `true` the intersection is computed according to Axis Aligned Bounding Boxes (AABB), else according to OBB (Oriented BBoxes)
   * @param includeDescendants Can be set to true to test if the mesh defined in parameters intersects with the current mesh or any child meshes
   * @returns true if there is an intersection
   */
  intersectsMesh(t, s = !1, e) {
    const i = this.getBoundingInfo(), a = t.getBoundingInfo();
    if (i.intersects(a, s))
      return !0;
    if (e) {
      for (const o of this.getChildMeshes())
        if (o.intersectsMesh(t, s, !0))
          return !0;
    }
    return !1;
  }
  /**
   * Returns true if the passed point (Vector3) is inside the mesh bounding box
   * @param point defines the point to test
   * @returns true if there is an intersection
   */
  intersectsPoint(t) {
    return this.getBoundingInfo().intersectsPoint(t);
  }
  // Collisions
  /**
   * Gets or sets a boolean indicating that this mesh can be used in the collision engine
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
   */
  get checkCollisions() {
    return this._internalAbstractMeshDataInfo._meshCollisionData._checkCollisions;
  }
  set checkCollisions(t) {
    this._internalAbstractMeshDataInfo._meshCollisionData._checkCollisions = t;
  }
  /**
   * Gets Collider object used to compute collisions (not physics)
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
   */
  get collider() {
    return this._internalAbstractMeshDataInfo._meshCollisionData._collider;
  }
  /**
   * Move the mesh using collision engine
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
   * @param displacement defines the requested displacement vector
   * @returns the current mesh
   */
  moveWithCollisions(t) {
    this.getAbsolutePosition().addToRef(this.ellipsoidOffset, this._internalAbstractMeshDataInfo._meshCollisionData._oldPositionForCollisions);
    const e = this.getScene().collisionCoordinator;
    return this._internalAbstractMeshDataInfo._meshCollisionData._collider || (this._internalAbstractMeshDataInfo._meshCollisionData._collider = e.createCollider()), this._internalAbstractMeshDataInfo._meshCollisionData._collider._radius = this.ellipsoid, e.getNewPosition(this._internalAbstractMeshDataInfo._meshCollisionData._oldPositionForCollisions, t, this._internalAbstractMeshDataInfo._meshCollisionData._collider, this.collisionRetryCount, this, this._onCollisionPositionChange, this.uniqueId), this;
  }
  // Collisions
  /**
   * @internal
   */
  _collideForSubMesh(t, s, e) {
    if (this._generatePointsArray(), !this._positions)
      return this;
    if (!t._lastColliderWorldVertices || !t._lastColliderTransformMatrix.equals(s)) {
      t._lastColliderTransformMatrix = s.clone(), t._lastColliderWorldVertices = [], t._trianglePlanes = [];
      const i = t.verticesStart, a = t.verticesStart + t.verticesCount;
      for (let o = i; o < a; o++)
        t._lastColliderWorldVertices.push(l.TransformCoordinates(this._positions[o], s));
    }
    return e._collide(t._trianglePlanes, t._lastColliderWorldVertices, this.getIndices(), t.indexStart, t.indexStart + t.indexCount, t.verticesStart, !!t.getMaterial(), this, this._shouldConvertRHS(), t.getMaterial()?.fillMode === 7), this;
  }
  /**
   * @internal
   */
  _processCollisionsForSubMeshes(t, s) {
    const e = this._scene.getCollidingSubMeshCandidates(this, t), i = e.length;
    for (let a = 0; a < i; a++) {
      const o = e.data[a];
      i > 1 && !o._checkCollision(t) || this._collideForSubMesh(o, s, t);
    }
    return this;
  }
  /** @internal */
  _shouldConvertRHS() {
    return !1;
  }
  /**
   * @internal
   */
  _checkCollision(t) {
    if (!this.getBoundingInfo()._checkCollision(t))
      return this;
    const s = p.Matrix[0], e = p.Matrix[1];
    return P.ScalingToRef(1 / t._radius.x, 1 / t._radius.y, 1 / t._radius.z, s), this.worldMatrixFromCache.multiplyToRef(s, e), this._processCollisionsForSubMeshes(t, e), this;
  }
  // Picking
  /** @internal */
  _generatePointsArray() {
    return !1;
  }
  /**
   * Checks if the passed Ray intersects with the mesh. A mesh triangle can be picked both from its front and back sides,
   * irrespective of orientation.
   * @param ray defines the ray to use. It should be in the mesh's LOCAL coordinate space.
   * @param fastCheck defines if fast mode (but less precise) must be used (false by default)
   * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
   * @param onlyBoundingInfo defines a boolean indicating if picking should only happen using bounding info (false by default)
   * @param worldToUse defines the world matrix to use to get the world coordinate of the intersection point
   * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
   * @returns the picking info
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/interactions/mesh_intersect
   */
  intersects(t, s, e, i = !1, a, o = !1) {
    const n = new W(), r = this.getClassName(), c = r === "InstancedLinesMesh" || r === "LinesMesh" || r === "GreasedLineMesh" ? this.intersectionThreshold : 0, _ = this.getBoundingInfo();
    if (!this.subMeshes || !o && (!t.intersectsSphere(_.boundingSphere, c) || !t.intersectsBox(_.boundingBox, c)))
      return n;
    if (i)
      return n.hit = !o, n.pickedMesh = o ? null : this, n.distance = o ? 0 : l.Distance(t.origin, _.boundingSphere.center), n.subMeshId = 0, n;
    if (!this._generatePointsArray())
      return n;
    let h = null;
    const u = this._scene.getIntersectingSubMeshCandidates(this, t), m = u.length;
    let I = !1;
    for (let f = 0; f < m; f++) {
      const g = u.data[f].getMaterial();
      if (g && (g.fillMode == 7 || g.fillMode == 0 || g.fillMode == 1 || g.fillMode == 2 || g.fillMode == 4)) {
        I = !0;
        break;
      }
    }
    if (!I)
      return n.hit = !0, n.pickedMesh = this, n.distance = l.Distance(t.origin, _.boundingSphere.center), n.subMeshId = -1, n;
    for (let f = 0; f < m; f++) {
      const b = u.data[f];
      if (m > 1 && !o && !b.canIntersects(t))
        continue;
      const g = b.intersects(t, this._positions, this.getIndices(), s, e);
      if (g && (s || !h || g.distance < h.distance) && (h = g, h.subMeshId = f, s))
        break;
    }
    if (h) {
      const f = a ?? this.getWorldMatrix(), b = p.Vector3[0], g = p.Vector3[1];
      l.TransformCoordinatesToRef(t.origin, f, b), t.direction.scaleToRef(h.distance, g);
      const C = l.TransformNormal(g, f).addInPlace(b);
      return n.hit = !0, n.distance = l.Distance(b, C), n.pickedPoint = C, n.pickedMesh = this, n.bu = h.bu || 0, n.bv = h.bv || 0, n.subMeshFaceId = h.faceId, n.faceId = h.faceId + u.data[h.subMeshId].indexStart / (this.getClassName().indexOf("LinesMesh") !== -1 ? 2 : 3), n.subMeshId = h.subMeshId, n;
    }
    return n;
  }
  /**
   * Clones the current mesh
   * @param name defines the mesh name
   * @param newParent defines the new mesh parent
   * @param doNotCloneChildren defines a boolean indicating that children must not be cloned (false by default)
   * @returns the new mesh
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clone(t, s, e) {
    return null;
  }
  /**
   * Disposes all the submeshes of the current meshnp
   * @returns the current mesh
   */
  releaseSubMeshes() {
    if (this.subMeshes)
      for (; this.subMeshes.length; )
        this.subMeshes[0].dispose();
    else
      this.subMeshes = [];
    return this;
  }
  /**
   * Releases resources associated with this abstract mesh.
   * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
   * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
   */
  dispose(t, s = !1) {
    let e;
    const i = this.getScene();
    for (this._scene.useMaterialMeshMap && this._internalAbstractMeshDataInfo._material && this._internalAbstractMeshDataInfo._material.meshMap && (this._internalAbstractMeshDataInfo._material.meshMap[this.uniqueId] = void 0), i.freeActiveMeshes(), i.freeRenderingGroups(), i.renderingManager.maintainStateBetweenFrames && i.renderingManager.restoreDispachedFlags(), this.actionManager !== void 0 && this.actionManager !== null && (this._scene.meshes.some((n) => n !== this && n.actionManager === this.actionManager) || this.actionManager.dispose(), this.actionManager = null), this._internalAbstractMeshDataInfo._skeleton = null, this._transformMatrixTexture && (this._transformMatrixTexture.dispose(), this._transformMatrixTexture = null), e = 0; e < this._intersectionsInProgress.length; e++) {
      const n = this._intersectionsInProgress[e], r = n._intersectionsInProgress.indexOf(this);
      n._intersectionsInProgress.splice(r, 1);
    }
    this._intersectionsInProgress.length = 0, i.lights.forEach((n) => {
      let r = n.includedOnlyMeshes.indexOf(this);
      r !== -1 && n.includedOnlyMeshes.splice(r, 1), r = n.excludedMeshes.indexOf(this), r !== -1 && n.excludedMeshes.splice(r, 1);
      const c = n.getShadowGenerators();
      if (c) {
        const _ = c.values();
        for (let h = _.next(); h.done !== !0; h = _.next()) {
          const m = h.value.getShadowMap();
          m && m.renderList && (r = m.renderList.indexOf(this), r !== -1 && m.renderList.splice(r, 1));
        }
      }
    }), (this.getClassName() !== "InstancedMesh" || this.getClassName() !== "InstancedLinesMesh") && this.releaseSubMeshes();
    const o = i.getEngine();
    if (this._occlusionQuery !== null && (this.isOcclusionQueryInProgress = !1, o.deleteQuery(this._occlusionQuery), this._occlusionQuery = null), o.wipeCaches(), i.removeMesh(this), this._parentContainer) {
      const n = this._parentContainer.meshes.indexOf(this);
      n > -1 && this._parentContainer.meshes.splice(n, 1), this._parentContainer = null;
    }
    if (s && this.material && (this.material.getClassName() === "MultiMaterial" ? this.material.dispose(!1, !0, !0) : this.material.dispose(!1, !0)), !t)
      for (e = 0; e < i.particleSystems.length; e++)
        i.particleSystems[e].emitter === this && (i.particleSystems[e].dispose(), e--);
    this._internalAbstractMeshDataInfo._facetData.facetDataEnabled && this.disableFacetData(), this._uniformBuffer.dispose(), this.onAfterWorldMatrixUpdateObservable.clear(), this.onCollideObservable.clear(), this.onCollisionPositionChangeObservable.clear(), this.onRebuildObservable.clear(), super.dispose(t, s);
  }
  /**
   * Adds the passed mesh as a child to the current mesh
   * @param mesh defines the child mesh
   * @param preserveScalingSign if true, keep scaling sign of child. Otherwise, scaling sign might change.
   * @returns the current mesh
   */
  addChild(t, s = !1) {
    return t.setParent(this, s), this;
  }
  /**
   * Removes the passed mesh from the current mesh children list
   * @param mesh defines the child mesh
   * @param preserveScalingSign if true, keep scaling sign of child. Otherwise, scaling sign might change.
   * @returns the current mesh
   */
  removeChild(t, s = !1) {
    return t.setParent(null, s), this;
  }
  // Facet data
  /** @internal */
  _initFacetData() {
    const t = this._internalAbstractMeshDataInfo._facetData;
    t.facetNormals || (t.facetNormals = []), t.facetPositions || (t.facetPositions = []), t.facetPartitioning || (t.facetPartitioning = new Array()), t.facetNb = this.getIndices().length / 3 | 0, t.partitioningSubdivisions = t.partitioningSubdivisions ? t.partitioningSubdivisions : 10, t.partitioningBBoxRatio = t.partitioningBBoxRatio ? t.partitioningBBoxRatio : 1.01;
    for (let s = 0; s < t.facetNb; s++)
      t.facetNormals[s] = l.Zero(), t.facetPositions[s] = l.Zero();
    return t.facetDataEnabled = !0, this;
  }
  /**
   * Updates the mesh facetData arrays and the internal partitioning when the mesh is morphed or updated.
   * This method can be called within the render loop.
   * You don't need to call this method by yourself in the render loop when you update/morph a mesh with the methods CreateXXX() as they automatically manage this computation
   * @returns the current mesh
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  updateFacetData() {
    const t = this._internalAbstractMeshDataInfo._facetData;
    t.facetDataEnabled || this._initFacetData();
    const s = this.getVerticesData(d.PositionKind), e = this.getIndices(), i = this.getVerticesData(d.NormalKind), a = this.getBoundingInfo();
    if (t.facetDepthSort && !t.facetDepthSortEnabled) {
      if (t.facetDepthSortEnabled = !0, e instanceof Uint16Array)
        t.depthSortedIndices = new Uint16Array(e);
      else if (e instanceof Uint32Array)
        t.depthSortedIndices = new Uint32Array(e);
      else {
        let n = !1;
        for (let r = 0; r < e.length; r++)
          if (e[r] > 65535) {
            n = !0;
            break;
          }
        n ? t.depthSortedIndices = new Uint32Array(e) : t.depthSortedIndices = new Uint16Array(e);
      }
      if (t.facetDepthSortFunction = function(n, r) {
        return r.sqDistance - n.sqDistance;
      }, !t.facetDepthSortFrom) {
        const n = this.getScene().activeCamera;
        t.facetDepthSortFrom = n ? n.position : l.Zero();
      }
      t.depthSortedFacets = [];
      for (let n = 0; n < t.facetNb; n++) {
        const r = { ind: n * 3, sqDistance: 0 };
        t.depthSortedFacets.push(r);
      }
      t.invertedMatrix = P.Identity(), t.facetDepthSortOrigin = l.Zero();
    }
    t.bbSize.x = a.maximum.x - a.minimum.x > x ? a.maximum.x - a.minimum.x : x, t.bbSize.y = a.maximum.y - a.minimum.y > x ? a.maximum.y - a.minimum.y : x, t.bbSize.z = a.maximum.z - a.minimum.z > x ? a.maximum.z - a.minimum.z : x;
    let o = t.bbSize.x > t.bbSize.y ? t.bbSize.x : t.bbSize.y;
    if (o = o > t.bbSize.z ? o : t.bbSize.z, t.subDiv.max = t.partitioningSubdivisions, t.subDiv.X = Math.floor(t.subDiv.max * t.bbSize.x / o), t.subDiv.Y = Math.floor(t.subDiv.max * t.bbSize.y / o), t.subDiv.Z = Math.floor(t.subDiv.max * t.bbSize.z / o), t.subDiv.X = t.subDiv.X < 1 ? 1 : t.subDiv.X, t.subDiv.Y = t.subDiv.Y < 1 ? 1 : t.subDiv.Y, t.subDiv.Z = t.subDiv.Z < 1 ? 1 : t.subDiv.Z, t.facetParameters.facetNormals = this.getFacetLocalNormals(), t.facetParameters.facetPositions = this.getFacetLocalPositions(), t.facetParameters.facetPartitioning = this.getFacetLocalPartitioning(), t.facetParameters.bInfo = a, t.facetParameters.bbSize = t.bbSize, t.facetParameters.subDiv = t.subDiv, t.facetParameters.ratio = this.partitioningBBoxRatio, t.facetParameters.depthSort = t.facetDepthSort, t.facetDepthSort && t.facetDepthSortEnabled && (this.computeWorldMatrix(!0), this._worldMatrix.invertToRef(t.invertedMatrix), l.TransformCoordinatesToRef(t.facetDepthSortFrom, t.invertedMatrix, t.facetDepthSortOrigin), t.facetParameters.distanceTo = t.facetDepthSortOrigin), t.facetParameters.depthSortedFacets = t.depthSortedFacets, i && k.ComputeNormals(s, e, i, t.facetParameters), t.facetDepthSort && t.facetDepthSortEnabled) {
      t.depthSortedFacets.sort(t.facetDepthSortFunction);
      const n = t.depthSortedIndices.length / 3 | 0;
      for (let r = 0; r < n; r++) {
        const c = t.depthSortedFacets[r].ind;
        t.depthSortedIndices[r * 3] = e[c], t.depthSortedIndices[r * 3 + 1] = e[c + 1], t.depthSortedIndices[r * 3 + 2] = e[c + 2];
      }
      this.updateIndices(t.depthSortedIndices, void 0, !0);
    }
    return this;
  }
  /**
   * Returns the facetLocalNormals array.
   * The normals are expressed in the mesh local spac
   * @returns an array of Vector3
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getFacetLocalNormals() {
    const t = this._internalAbstractMeshDataInfo._facetData;
    return t.facetNormals || this.updateFacetData(), t.facetNormals;
  }
  /**
   * Returns the facetLocalPositions array.
   * The facet positions are expressed in the mesh local space
   * @returns an array of Vector3
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getFacetLocalPositions() {
    const t = this._internalAbstractMeshDataInfo._facetData;
    return t.facetPositions || this.updateFacetData(), t.facetPositions;
  }
  /**
   * Returns the facetLocalPartitioning array
   * @returns an array of array of numbers
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getFacetLocalPartitioning() {
    const t = this._internalAbstractMeshDataInfo._facetData;
    return t.facetPartitioning || this.updateFacetData(), t.facetPartitioning;
  }
  /**
   * Returns the i-th facet position in the world system.
   * This method allocates a new Vector3 per call
   * @param i defines the facet index
   * @returns a new Vector3
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getFacetPosition(t) {
    const s = l.Zero();
    return this.getFacetPositionToRef(t, s), s;
  }
  /**
   * Sets the reference Vector3 with the i-th facet position in the world system
   * @param i defines the facet index
   * @param ref defines the target vector
   * @returns the current mesh
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getFacetPositionToRef(t, s) {
    const e = this.getFacetLocalPositions()[t], i = this.getWorldMatrix();
    return l.TransformCoordinatesToRef(e, i, s), this;
  }
  /**
   * Returns the i-th facet normal in the world system.
   * This method allocates a new Vector3 per call
   * @param i defines the facet index
   * @returns a new Vector3
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getFacetNormal(t) {
    const s = l.Zero();
    return this.getFacetNormalToRef(t, s), s;
  }
  /**
   * Sets the reference Vector3 with the i-th facet normal in the world system
   * @param i defines the facet index
   * @param ref defines the target vector
   * @returns the current mesh
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getFacetNormalToRef(t, s) {
    const e = this.getFacetLocalNormals()[t];
    return l.TransformNormalToRef(e, this.getWorldMatrix(), s), this;
  }
  /**
   * Returns the facets (in an array) in the same partitioning block than the one the passed coordinates are located (expressed in the mesh local system)
   * @param x defines x coordinate
   * @param y defines y coordinate
   * @param z defines z coordinate
   * @returns the array of facet indexes
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getFacetsAtLocalCoordinates(t, s, e) {
    const i = this.getBoundingInfo(), a = this._internalAbstractMeshDataInfo._facetData, o = Math.floor((t - i.minimum.x * a.partitioningBBoxRatio) * a.subDiv.X * a.partitioningBBoxRatio / a.bbSize.x), n = Math.floor((s - i.minimum.y * a.partitioningBBoxRatio) * a.subDiv.Y * a.partitioningBBoxRatio / a.bbSize.y), r = Math.floor((e - i.minimum.z * a.partitioningBBoxRatio) * a.subDiv.Z * a.partitioningBBoxRatio / a.bbSize.z);
    return o < 0 || o > a.subDiv.max || n < 0 || n > a.subDiv.max || r < 0 || r > a.subDiv.max ? null : a.facetPartitioning[o + a.subDiv.max * n + a.subDiv.max * a.subDiv.max * r];
  }
  /**
   * Returns the closest mesh facet index at (x,y,z) World coordinates, null if not found
   * @param x defines x coordinate
   * @param y defines y coordinate
   * @param z defines z coordinate
   * @param projected sets as the (x,y,z) world projection on the facet
   * @param checkFace if true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned
   * @param facing if facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position. If facing si false and checkFace is true, only the facet "turning their backs" to (x, y, z) are returned : negative dot (x, y, z) * facet position
   * @returns the face index if found (or null instead)
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getClosestFacetAtCoordinates(t, s, e, i, a = !1, o = !0) {
    const n = this.getWorldMatrix(), r = p.Matrix[5];
    n.invertToRef(r);
    const c = p.Vector3[8];
    l.TransformCoordinatesFromFloatsToRef(t, s, e, r, c);
    const _ = this.getClosestFacetAtLocalCoordinates(c.x, c.y, c.z, i, a, o);
    return i && l.TransformCoordinatesFromFloatsToRef(i.x, i.y, i.z, n, i), _;
  }
  /**
   * Returns the closest mesh facet index at (x,y,z) local coordinates, null if not found
   * @param x defines x coordinate
   * @param y defines y coordinate
   * @param z defines z coordinate
   * @param projected sets as the (x,y,z) local projection on the facet
   * @param checkFace if true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned
   * @param facing if facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position. If facing si false and checkFace is true, only the facet "turning their backs" to (x, y, z) are returned : negative dot (x, y, z) * facet position
   * @returns the face index if found (or null instead)
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getClosestFacetAtLocalCoordinates(t, s, e, i, a = !1, o = !0) {
    let n = null, r = 0, c = 0, _ = 0, h = 0, u = 0, m = 0, I = 0, f = 0;
    const b = this.getFacetLocalPositions(), g = this.getFacetLocalNormals(), y = this.getFacetsAtLocalCoordinates(t, s, e);
    if (!y)
      return null;
    let C = Number.MAX_VALUE, F = C, O, M, S;
    for (let T = 0; T < y.length; T++)
      O = y[T], M = g[O], S = b[O], h = (t - S.x) * M.x + (s - S.y) * M.y + (e - S.z) * M.z, (!a || a && o && h >= 0 || a && !o && h <= 0) && (h = M.x * S.x + M.y * S.y + M.z * S.z, u = -(M.x * t + M.y * s + M.z * e - h) / (M.x * M.x + M.y * M.y + M.z * M.z), m = t + M.x * u, I = s + M.y * u, f = e + M.z * u, r = m - t, c = I - s, _ = f - e, F = r * r + c * c + _ * _, F < C && (C = F, n = O, i && (i.x = m, i.y = I, i.z = f)));
    return n;
  }
  /**
   * Returns the object "parameter" set with all the expected parameters for facetData computation by ComputeNormals()
   * @returns the parameters
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  getFacetDataParameters() {
    return this._internalAbstractMeshDataInfo._facetData.facetParameters;
  }
  /**
   * Disables the feature FacetData and frees the related memory
   * @returns the current mesh
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
   */
  disableFacetData() {
    const t = this._internalAbstractMeshDataInfo._facetData;
    return t.facetDataEnabled && (t.facetDataEnabled = !1, t.facetPositions = [], t.facetNormals = [], t.facetPartitioning = new Array(), t.facetParameters = null, t.depthSortedIndices = new Uint32Array(0)), this;
  }
  /**
   * Updates the AbstractMesh indices array
   * @param indices defines the data source
   * @param offset defines the offset in the index buffer where to store the new data (can be null)
   * @param gpuMemoryOnly defines a boolean indicating that only the GPU memory must be updated leaving the CPU version of the indices unchanged (false by default)
   * @returns the current mesh
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateIndices(t, s, e = !1) {
    return this;
  }
  /**
   * Creates new normals data for the mesh
   * @param updatable defines if the normal vertex buffer must be flagged as updatable
   * @returns the current mesh
   */
  createNormals(t) {
    const s = this.getVerticesData(d.PositionKind), e = this.getIndices();
    let i;
    return this.isVerticesDataPresent(d.NormalKind) ? i = this.getVerticesData(d.NormalKind) : i = [], k.ComputeNormals(s, e, i, { useRightHandedSystem: this.getScene().useRightHandedSystem }), this.setVerticesData(d.NormalKind, i, t), this;
  }
  /**
   * Align the mesh with a normal
   * @param normal defines the normal to use
   * @param upDirection can be used to redefined the up vector to use (will use the (0, 1, 0) by default)
   * @returns the current mesh
   */
  alignWithNormal(t, s) {
    s || (s = K.Y);
    const e = p.Vector3[0], i = p.Vector3[1];
    return l.CrossToRef(s, t, i), l.CrossToRef(t, i, e), this.rotationQuaternion ? L.RotationQuaternionFromAxisToRef(e, t, i, this.rotationQuaternion) : l.RotationFromAxisToRef(e, t, i, this.rotation), this;
  }
  /** @internal */
  _checkOcclusionQuery() {
    return !1;
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Disables the mesh edge rendering mode
   * @returns the currentAbstractMesh
   */
  disableEdgesRendering() {
    throw w("EdgesRenderer");
  }
  // eslint-disable-next-line jsdoc/require-returns-check
  /**
   * Enables the edge rendering mode on the mesh.
   * This mode makes the mesh edges visible
   * @param epsilon defines the maximal distance between two angles to detect a face
   * @param checkVerticesInsteadOfIndices indicates that we should check vertex list directly instead of faces
   * @param options options to the edge renderer
   * @returns the currentAbstractMesh
   * @see https://www.babylonjs-playground.com/#19O9TU#0
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enableEdgesRendering(t, s, e) {
    throw w("EdgesRenderer");
  }
  /**
   * This function returns all of the particle systems in the scene that use the mesh as an emitter.
   * @returns an array of particle systems in the scene that use the mesh as an emitter
   */
  getConnectedParticleSystems() {
    return this._scene.particleSystems.filter((t) => t.emitter === this);
  }
}
D.OCCLUSION_TYPE_NONE = 0;
D.OCCLUSION_TYPE_OPTIMISTIC = 1;
D.OCCLUSION_TYPE_STRICT = 2;
D.OCCLUSION_ALGORITHM_TYPE_ACCURATE = 0;
D.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE = 1;
D.CULLINGSTRATEGY_STANDARD = 0;
D.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY = 1;
D.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION = 2;
D.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY = 3;
z("BABYLON.AbstractMesh", D);
const et = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AbstractMesh: D
}, Symbol.toStringTag, { value: "Module" }));
export {
  D as A,
  Z as _,
  et as a
};
//# sourceMappingURL=abstractMesh-leBV3i4h.js.map
