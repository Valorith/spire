import { V as f, O as L, D as Y, e as C, L as V, S as k, y as P, F, a as B, H as U, T as K, g as W, _ as R, A as J, Q as z, M as E, h as X, l as $, G, J as j, K as ee, N as te, R as ne } from "./embed-entry-BKE21f6Q.js";
import { C as ie } from "./camera-DrW_r1mf.js";
import { b as se, S as q } from "./scene-BIBh3wH1.js";
import { N as H } from "./node-Cogu8C4Q.js";
import { A as re } from "./abstractMesh-B1ZrgCPN.js";
import { M as O } from "./material-D3PM2aZM.js";
import { MultiMaterial as Q } from "./multiMaterial-CA6dV2ft.js";
import { S as Z } from "./decorators.serialization-DfmppPDN.js";
class ae {
  /**
   * Creates a new LOD level
   * @param distanceOrScreenCoverage defines either the distance or the screen coverage where this level should start being displayed
   * @param mesh defines the mesh to use to render this level
   */
  constructor(e, n) {
    this.distanceOrScreenCoverage = e, this.mesh = n;
  }
}
class oe {
}
class le {
  constructor() {
    this.visibleInstances = {}, this.batchCache = new N(), this.batchCacheReplacementModeInFrozenMode = new N(), this.instancesBufferSize = 32 * 16 * 4;
  }
}
class N {
  constructor() {
    this.mustReturn = !1, this.visibleInstances = new Array(), this.renderSelf = [], this.hardwareInstancedRendering = [];
  }
}
class he {
  constructor() {
    this.instancesCount = 0, this.matrixBuffer = null, this.previousMatrixBuffer = null, this.matrixBufferSize = 32 * 16, this.matrixData = null, this.boundingVectors = [], this.worldMatrices = null;
  }
}
class ce {
  constructor() {
    this._areNormalsFrozen = !1, this._source = null, this.meshMap = null, this._preActivateId = -1, this._LODLevels = new Array(), this._useLODScreenCoverage = !1, this._effectiveMaterial = null, this._forcedInstanceCount = 0, this._overrideRenderingFillMode = null;
  }
}
class M extends re {
  /**
   * Gets the default side orientation.
   * @param orientation the orientation to value to attempt to get
   * @returns the default orientation
   * @internal
   */
  static _GetDefaultSideOrientation(e) {
    return e || M.FRONTSIDE;
  }
  /**
   * Determines if the LOD levels are intended to be calculated using screen coverage (surface area ratio) instead of distance.
   */
  get useLODScreenCoverage() {
    return this._internalMeshDataInfo._useLODScreenCoverage;
  }
  set useLODScreenCoverage(e) {
    this._internalMeshDataInfo._useLODScreenCoverage = e, this._sortLODLevels();
  }
  get computeBonesUsingShaders() {
    return this._internalAbstractMeshDataInfo._computeBonesUsingShaders;
  }
  set computeBonesUsingShaders(e) {
    this._internalAbstractMeshDataInfo._computeBonesUsingShaders !== e && (e && this._internalMeshDataInfo._sourcePositions && (this.setVerticesData(f.PositionKind, this._internalMeshDataInfo._sourcePositions, !0), this._internalMeshDataInfo._sourceNormals && this.setVerticesData(f.NormalKind, this._internalMeshDataInfo._sourceNormals, !0), this._internalMeshDataInfo._sourcePositions = null, this._internalMeshDataInfo._sourceNormals = null), this._internalAbstractMeshDataInfo._computeBonesUsingShaders = e, this._markSubMeshesAsAttributesDirty());
  }
  /**
   * An event triggered before rendering the mesh
   */
  get onBeforeRenderObservable() {
    return this._internalMeshDataInfo._onBeforeRenderObservable || (this._internalMeshDataInfo._onBeforeRenderObservable = new L()), this._internalMeshDataInfo._onBeforeRenderObservable;
  }
  /**
   * An event triggered before binding the mesh
   */
  get onBeforeBindObservable() {
    return this._internalMeshDataInfo._onBeforeBindObservable || (this._internalMeshDataInfo._onBeforeBindObservable = new L()), this._internalMeshDataInfo._onBeforeBindObservable;
  }
  /**
   * An event triggered after rendering the mesh
   */
  get onAfterRenderObservable() {
    return this._internalMeshDataInfo._onAfterRenderObservable || (this._internalMeshDataInfo._onAfterRenderObservable = new L()), this._internalMeshDataInfo._onAfterRenderObservable;
  }
  /**
   * An event triggeredbetween rendering pass when using separateCullingPass = true
   */
  get onBetweenPassObservable() {
    return this._internalMeshDataInfo._onBetweenPassObservable || (this._internalMeshDataInfo._onBetweenPassObservable = new L()), this._internalMeshDataInfo._onBetweenPassObservable;
  }
  /**
   * An event triggered before drawing the mesh
   */
  get onBeforeDrawObservable() {
    return this._internalMeshDataInfo._onBeforeDrawObservable || (this._internalMeshDataInfo._onBeforeDrawObservable = new L()), this._internalMeshDataInfo._onBeforeDrawObservable;
  }
  /**
   * Sets a callback to call before drawing the mesh. It is recommended to use onBeforeDrawObservable instead
   */
  set onBeforeDraw(e) {
    this._onBeforeDrawObserver && this.onBeforeDrawObservable.remove(this._onBeforeDrawObserver), this._onBeforeDrawObserver = this.onBeforeDrawObservable.add(e);
  }
  get hasInstances() {
    return this.instances.length > 0;
  }
  get hasThinInstances() {
    return (this.forcedInstanceCount || this._thinInstanceDataStorage.instancesCount || 0) > 0;
  }
  /**
   * Gets or sets the forced number of instances to display.
   * If 0 (default value), the number of instances is not forced and depends on the draw type
   * (regular / instance / thin instances mesh)
   */
  get forcedInstanceCount() {
    return this._internalMeshDataInfo._forcedInstanceCount;
  }
  set forcedInstanceCount(e) {
    this._internalMeshDataInfo._forcedInstanceCount = e;
  }
  /**
   * Use this property to override the Material's fillMode value
   */
  get overrideRenderingFillMode() {
    return this._internalMeshDataInfo._overrideRenderingFillMode;
  }
  set overrideRenderingFillMode(e) {
    this._internalMeshDataInfo._overrideRenderingFillMode = e;
  }
  /**
   * Gets the source mesh (the one used to clone this one from)
   */
  get source() {
    return this._internalMeshDataInfo._source;
  }
  /**
   * Gets the list of clones of this mesh
   * The scene must have been constructed with useClonedMeshMap=true for this to work!
   * Note that useClonedMeshMap=true is the default setting
   */
  get cloneMeshMap() {
    return this._internalMeshDataInfo.meshMap;
  }
  /**
   * Gets or sets a boolean indicating that this mesh does not use index buffer
   */
  get isUnIndexed() {
    return this._unIndexed;
  }
  set isUnIndexed(e) {
    this._unIndexed !== e && (this._unIndexed = e, this._markSubMeshesAsAttributesDirty());
  }
  /** Gets the array buffer used to store the instanced buffer used for instances' world matrices */
  get worldMatrixInstancedBuffer() {
    return this._instanceDataStorage.instancesData;
  }
  /** Gets the array buffer used to store the instanced buffer used for instances' previous world matrices */
  get previousWorldMatrixInstancedBuffer() {
    return this._instanceDataStorage.instancesPreviousData;
  }
  /** Gets or sets a boolean indicating that the update of the instance buffer of the world matrices is manual */
  get manualUpdateOfWorldMatrixInstancedBuffer() {
    return this._instanceDataStorage.manualUpdate;
  }
  set manualUpdateOfWorldMatrixInstancedBuffer(e) {
    this._instanceDataStorage.manualUpdate = e;
  }
  /** Gets or sets a boolean indicating that the update of the instance buffer of the world matrices is manual */
  get manualUpdateOfPreviousWorldMatrixInstancedBuffer() {
    return this._instanceDataStorage.previousManualUpdate;
  }
  set manualUpdateOfPreviousWorldMatrixInstancedBuffer(e) {
    this._instanceDataStorage.previousManualUpdate = e;
  }
  /** Gets or sets a boolean indicating that the update of the instance buffer of the world matrices must be performed in all cases (and notably even in frozen mode) */
  get forceWorldMatrixInstancedBufferUpdate() {
    return this._instanceDataStorage.forceMatrixUpdates;
  }
  set forceWorldMatrixInstancedBufferUpdate(e) {
    this._instanceDataStorage.forceMatrixUpdates = e;
  }
  /**
   * @constructor
   * @param name The value used by scene.getMeshByName() to do a lookup.
   * @param scene The scene to add this mesh to.
   * @param parent The parent of this mesh, if it has one
   * @param source An optional Mesh from which geometry is shared, cloned.
   * @param doNotCloneChildren When cloning, skip cloning child meshes of source, default False.
   *                  When false, achieved by calling a clone(), also passing False.
   *                  This will make creation of children, recursive.
   * @param clonePhysicsImpostor When cloning, include cloning mesh physics impostor, default True.
   */
  constructor(e, n = null, i = null, t = null, r, s = !0) {
    if (super(e, n), this._internalMeshDataInfo = new ce(), this.delayLoadState = 0, this.instances = [], this._creationDataStorage = null, this._geometry = null, this._instanceDataStorage = new le(), this._thinInstanceDataStorage = new he(), this._shouldGenerateFlatShading = !1, this._originalBuilderSideOrientation = M.DEFAULTSIDE, this.overrideMaterialSideOrientation = null, this.ignoreCameraMaxZ = !1, n = this.getScene(), this._onBeforeDraw = (o, a, l) => {
      o && l && (this._uniformBuffer ? this.transferToEffect(a) : l.bindOnlyWorldMatrix(a));
    }, t) {
      if (t._geometry && t._geometry.applyToMesh(this), Y.DeepCopy(t, this, [
        "name",
        "material",
        "skeleton",
        "instances",
        "parent",
        "uniqueId",
        "source",
        "metadata",
        "morphTargetManager",
        "hasInstances",
        "worldMatrixInstancedBuffer",
        "previousWorldMatrixInstancedBuffer",
        "hasLODLevels",
        "geometry",
        "isBlocked",
        "areNormalsFrozen",
        "facetNb",
        "isFacetDataEnabled",
        "lightSources",
        "useBones",
        "isAnInstance",
        "collider",
        "edgesRenderer",
        "forward",
        "up",
        "right",
        "absolutePosition",
        "absoluteScaling",
        "absoluteRotationQuaternion",
        "isWorldMatrixFrozen",
        "nonUniformScaling",
        "behaviors",
        "worldMatrixFromCache",
        "hasThinInstances",
        "cloneMeshMap",
        "hasBoundingInfo",
        "physicsBody",
        "physicsImpostor"
      ], ["_poseMatrix"]), this._internalMeshDataInfo._source = t, n.useClonedMeshMap && (t._internalMeshDataInfo.meshMap || (t._internalMeshDataInfo.meshMap = {}), t._internalMeshDataInfo.meshMap[this.uniqueId] = this), this._originalBuilderSideOrientation = t._originalBuilderSideOrientation, this._creationDataStorage = t._creationDataStorage, t._ranges) {
        const o = t._ranges;
        for (const a in o)
          Object.prototype.hasOwnProperty.call(o, a) && o[a] && this.createAnimationRange(a, o[a].from, o[a].to);
      }
      if (t.metadata && t.metadata.clone ? this.metadata = t.metadata.clone() : this.metadata = t.metadata, this._internalMetadata = t._internalMetadata, C && C.HasTags(t) && C.AddTagsTo(this, C.GetTags(t, !0)), this.setEnabled(t.isEnabled(!1)), this.parent = t.parent, this.setPivotMatrix(t.getPivotMatrix(), this._postMultiplyPivotMatrix), this.id = e + "." + t.id, this.material = t.material, !r) {
        const o = t.getDescendants(!0);
        for (let a = 0; a < o.length; a++) {
          const l = o[a];
          l.clone && l.clone(e + "." + l.name, this);
        }
      }
      if (t.morphTargetManager && (this.morphTargetManager = t.morphTargetManager), n.getPhysicsEngine) {
        const o = n.getPhysicsEngine();
        if (s && o)
          if (o.getPluginVersion() === 1) {
            const a = o.getImpostorForPhysicsObject(t);
            a && (this.physicsImpostor = a.clone(this));
          } else o.getPluginVersion() === 2 && t.physicsBody && t.physicsBody.clone(this);
      }
      for (let o = 0; o < n.particleSystems.length; o++) {
        const a = n.particleSystems[o];
        a.emitter === t && a.clone(a.name, this);
      }
      this.skeleton = t.skeleton, this.refreshBoundingInfo(!0, !0), this.computeWorldMatrix(!0);
    }
    i !== null && (this.parent = i), this._instanceDataStorage.hardwareInstancedRendering = this.getEngine().getCaps().instancedArrays, this._internalMeshDataInfo._onMeshReadyObserverAdded = (o) => {
      o.unregisterOnNextCall = !0, this.isReady(!0) ? this.onMeshReadyObservable.notifyObservers(this) : this._internalMeshDataInfo._checkReadinessObserver || (this._internalMeshDataInfo._checkReadinessObserver = this._scene.onBeforeRenderObservable.add(() => {
        this.isReady(!0) && (this._scene.onBeforeRenderObservable.remove(this._internalMeshDataInfo._checkReadinessObserver), this._internalMeshDataInfo._checkReadinessObserver = null, this.onMeshReadyObservable.notifyObservers(this));
      }));
    }, this.onMeshReadyObservable = new L(this._internalMeshDataInfo._onMeshReadyObserverAdded), t && t.onClonedObservable.notifyObservers(this);
  }
  instantiateHierarchy(e = null, n, i) {
    const t = this.getTotalVertices() === 0 || n && n.doNotInstantiate && (n.doNotInstantiate === !0 || n.doNotInstantiate(this)) ? this.clone("Clone of " + (this.name || this.id), e || this.parent, !0) : this.createInstance("instance of " + (this.name || this.id));
    t.parent = e || this.parent, t.position = this.position.clone(), t.scaling = this.scaling.clone(), this.rotationQuaternion ? t.rotationQuaternion = this.rotationQuaternion.clone() : t.rotation = this.rotation.clone(), i && i(this, t);
    for (const r of this.getChildTransformNodes(!0))
      r.getClassName() === "InstancedMesh" && t.getClassName() === "Mesh" && r.sourceMesh === this ? r.instantiateHierarchy(t, {
        doNotInstantiate: n && n.doNotInstantiate || !1,
        newSourcedMesh: t
      }, i) : r.instantiateHierarchy(t, n, i);
    return t;
  }
  /**
   * Gets the class name
   * @returns the string "Mesh".
   */
  getClassName() {
    return "Mesh";
  }
  /** @internal */
  get _isMesh() {
    return !0;
  }
  /**
   * Returns a description of this mesh
   * @param fullDetails define if full details about this mesh must be used
   * @returns a descriptive string representing this mesh
   */
  toString(e) {
    let n = super.toString(e);
    if (n += ", n vertices: " + this.getTotalVertices(), n += ", parent: " + (this._waitingParentId ? this._waitingParentId : this.parent ? this.parent.name : "NONE"), this.animations)
      for (let i = 0; i < this.animations.length; i++)
        n += ", animation[0]: " + this.animations[i].toString(e);
    if (e)
      if (this._geometry) {
        const i = this.getIndices(), t = this.getVerticesData(f.PositionKind);
        t && i && (n += ", flat shading: " + (t.length / 3 === i.length ? "YES" : "NO"));
      } else
        n += ", flat shading: UNKNOWN";
    return n;
  }
  /** @internal */
  _unBindEffect() {
    super._unBindEffect();
    for (const e of this.instances)
      e._unBindEffect();
  }
  /**
   * Gets a boolean indicating if this mesh has LOD
   */
  get hasLODLevels() {
    return this._internalMeshDataInfo._LODLevels.length > 0;
  }
  /**
   * Gets the list of MeshLODLevel associated with the current mesh
   * @returns an array of MeshLODLevel
   */
  getLODLevels() {
    return this._internalMeshDataInfo._LODLevels;
  }
  _sortLODLevels() {
    const e = this._internalMeshDataInfo._useLODScreenCoverage ? -1 : 1;
    this._internalMeshDataInfo._LODLevels.sort((n, i) => n.distanceOrScreenCoverage < i.distanceOrScreenCoverage ? e : n.distanceOrScreenCoverage > i.distanceOrScreenCoverage ? -e : 0);
  }
  /**
   * Add a mesh as LOD level triggered at the given distance.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/LOD
   * @param distanceOrScreenCoverage Either distance from the center of the object to show this level or the screen coverage if `useScreenCoverage` is set to `true`.
   * If screen coverage, value is a fraction of the screen's total surface, between 0 and 1.
   * Example Playground for distance https://playground.babylonjs.com/#QE7KM#197
   * Example Playground for screen coverage https://playground.babylonjs.com/#QE7KM#196
   * @param mesh The mesh to be added as LOD level (can be null)
   * @returns This mesh (for chaining)
   */
  addLODLevel(e, n) {
    if (n && n._masterMesh)
      return V.Warn("You cannot use a mesh as LOD level twice"), this;
    const i = new ae(e, n);
    return this._internalMeshDataInfo._LODLevels.push(i), n && (n._masterMesh = this), this._sortLODLevels(), this;
  }
  /**
   * Returns the LOD level mesh at the passed distance or null if not found.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/LOD
   * @param distance The distance from the center of the object to show this level
   * @returns a Mesh or `null`
   */
  getLODLevelAtDistance(e) {
    const n = this._internalMeshDataInfo;
    for (let i = 0; i < n._LODLevels.length; i++) {
      const t = n._LODLevels[i];
      if (t.distanceOrScreenCoverage === e)
        return t.mesh;
    }
    return null;
  }
  /**
   * Remove a mesh from the LOD array
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/LOD
   * @param mesh defines the mesh to be removed
   * @returns This mesh (for chaining)
   */
  removeLODLevel(e) {
    const n = this._internalMeshDataInfo;
    for (let i = 0; i < n._LODLevels.length; i++)
      n._LODLevels[i].mesh === e && (n._LODLevels.splice(i, 1), e && (e._masterMesh = null));
    return this._sortLODLevels(), this;
  }
  /**
   * Returns the registered LOD mesh distant from the parameter `camera` position if any, else returns the current mesh.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/LOD
   * @param camera defines the camera to use to compute distance
   * @param boundingSphere defines a custom bounding sphere to use instead of the one from this mesh
   * @returns This mesh (for chaining)
   */
  getLOD(e, n) {
    const i = this._internalMeshDataInfo;
    if (!i._LODLevels || i._LODLevels.length === 0)
      return this;
    const t = n || this.getBoundingInfo().boundingSphere, r = e.mode === ie.ORTHOGRAPHIC_CAMERA ? e.minZ : t.centerWorld.subtract(e.globalPosition).length();
    let s = r, o = 1;
    if (i._useLODScreenCoverage) {
      const a = e.screenArea;
      let l = t.radiusWorld * e.minZ / r;
      l = l * l * Math.PI, s = l / a, o = -1;
    }
    if (o * i._LODLevels[i._LODLevels.length - 1].distanceOrScreenCoverage > o * s)
      return this.onLODLevelSelection && this.onLODLevelSelection(s, this, this), this;
    for (let a = 0; a < i._LODLevels.length; a++) {
      const l = i._LODLevels[a];
      if (o * l.distanceOrScreenCoverage < o * s) {
        if (l.mesh) {
          if (l.mesh.delayLoadState === 4)
            return l.mesh._checkDelayState(), this;
          if (l.mesh.delayLoadState === 2)
            return this;
          l.mesh._preActivate(), l.mesh._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
        }
        return this.onLODLevelSelection && this.onLODLevelSelection(s, this, l.mesh), l.mesh;
      }
    }
    return this.onLODLevelSelection && this.onLODLevelSelection(s, this, this), this;
  }
  /**
   * Gets the mesh internal Geometry object
   */
  get geometry() {
    return this._geometry;
  }
  /**
   * Returns the total number of vertices within the mesh geometry or zero if the mesh has no geometry.
   * @returns the total number of vertices
   */
  getTotalVertices() {
    return this._geometry === null || this._geometry === void 0 ? 0 : this._geometry.getTotalVertices();
  }
  /**
   * Returns the content of an associated vertex buffer
   * @param kind defines which buffer to read from (positions, indices, normals, etc). Possible `kind` values :
   * - VertexBuffer.PositionKind
   * - VertexBuffer.UVKind
   * - VertexBuffer.UV2Kind
   * - VertexBuffer.UV3Kind
   * - VertexBuffer.UV4Kind
   * - VertexBuffer.UV5Kind
   * - VertexBuffer.UV6Kind
   * - VertexBuffer.ColorKind
   * - VertexBuffer.MatricesIndicesKind
   * - VertexBuffer.MatricesIndicesExtraKind
   * - VertexBuffer.MatricesWeightsKind
   * - VertexBuffer.MatricesWeightsExtraKind
   * @param copyWhenShared defines a boolean indicating that if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one
   * @param forceCopy defines a boolean forcing the copy of the buffer no matter what the value of copyWhenShared is
   * @param bypassInstanceData defines a boolean indicating that the function should not take into account the instance data (applies only if the mesh has instances). Default: false
   * @returns a FloatArray or null if the mesh has no geometry or no vertex buffer for this kind.
   */
  getVerticesData(e, n, i, t) {
    if (!this._geometry)
      return null;
    let r = t ? void 0 : this._userInstancedBuffersStorage?.vertexBuffers[e]?.getFloatData(
      this.instances.length + 1,
      // +1 because the master mesh is not included in the instances array
      i || n && this._geometry.meshes.length !== 1
    );
    return r || (r = this._geometry.getVerticesData(e, n, i)), r;
  }
  /**
   * Returns the mesh VertexBuffer object from the requested `kind`
   * @param kind defines which buffer to read from (positions, indices, normals, etc). Possible `kind` values :
   * - VertexBuffer.PositionKind
   * - VertexBuffer.NormalKind
   * - VertexBuffer.UVKind
   * - VertexBuffer.UV2Kind
   * - VertexBuffer.UV3Kind
   * - VertexBuffer.UV4Kind
   * - VertexBuffer.UV5Kind
   * - VertexBuffer.UV6Kind
   * - VertexBuffer.ColorKind
   * - VertexBuffer.MatricesIndicesKind
   * - VertexBuffer.MatricesIndicesExtraKind
   * - VertexBuffer.MatricesWeightsKind
   * - VertexBuffer.MatricesWeightsExtraKind
   * @param bypassInstanceData defines a boolean indicating that the function should not take into account the instance data (applies only if the mesh has instances). Default: false
   * @returns a FloatArray or null if the mesh has no vertex buffer for this kind.
   */
  getVertexBuffer(e, n) {
    return this._geometry ? (n ? void 0 : this._userInstancedBuffersStorage?.vertexBuffers[e]) ?? this._geometry.getVertexBuffer(e) : null;
  }
  /**
   * Tests if a specific vertex buffer is associated with this mesh
   * @param kind defines which buffer to check (positions, indices, normals, etc). Possible `kind` values :
   * - VertexBuffer.PositionKind
   * - VertexBuffer.NormalKind
   * - VertexBuffer.UVKind
   * - VertexBuffer.UV2Kind
   * - VertexBuffer.UV3Kind
   * - VertexBuffer.UV4Kind
   * - VertexBuffer.UV5Kind
   * - VertexBuffer.UV6Kind
   * - VertexBuffer.ColorKind
   * - VertexBuffer.MatricesIndicesKind
   * - VertexBuffer.MatricesIndicesExtraKind
   * - VertexBuffer.MatricesWeightsKind
   * - VertexBuffer.MatricesWeightsExtraKind
   * @param bypassInstanceData defines a boolean indicating that the function should not take into account the instance data (applies only if the mesh has instances). Default: false
   * @returns a boolean
   */
  isVerticesDataPresent(e, n) {
    return this._geometry ? !n && this._userInstancedBuffersStorage?.vertexBuffers[e] !== void 0 || this._geometry.isVerticesDataPresent(e) : this._delayInfo ? this._delayInfo.indexOf(e) !== -1 : !1;
  }
  /**
   * Returns a boolean defining if the vertex data for the requested `kind` is updatable.
   * @param kind defines which buffer to check (positions, indices, normals, etc). Possible `kind` values :
   * - VertexBuffer.PositionKind
   * - VertexBuffer.UVKind
   * - VertexBuffer.UV2Kind
   * - VertexBuffer.UV3Kind
   * - VertexBuffer.UV4Kind
   * - VertexBuffer.UV5Kind
   * - VertexBuffer.UV6Kind
   * - VertexBuffer.ColorKind
   * - VertexBuffer.MatricesIndicesKind
   * - VertexBuffer.MatricesIndicesExtraKind
   * - VertexBuffer.MatricesWeightsKind
   * - VertexBuffer.MatricesWeightsExtraKind
   * @param bypassInstanceData defines a boolean indicating that the function should not take into account the instance data (applies only if the mesh has instances). Default: false
   * @returns a boolean
   */
  isVertexBufferUpdatable(e, n) {
    if (!this._geometry)
      return this._delayInfo ? this._delayInfo.indexOf(e) !== -1 : !1;
    if (!n) {
      const i = this._userInstancedBuffersStorage?.vertexBuffers[e];
      if (i)
        return i.isUpdatable();
    }
    return this._geometry.isVertexBufferUpdatable(e);
  }
  /**
   * Returns a string which contains the list of existing `kinds` of Vertex Data associated with this mesh.
   * @param bypassInstanceData defines a boolean indicating that the function should not take into account the instance data (applies only if the mesh has instances). Default: false
   * @returns an array of strings
   */
  getVerticesDataKinds(e) {
    if (!this._geometry) {
      const i = [];
      return this._delayInfo && this._delayInfo.forEach(function(t) {
        i.push(t);
      }), i;
    }
    const n = this._geometry.getVerticesDataKinds();
    if (!e && this._userInstancedBuffersStorage)
      for (const i in this._userInstancedBuffersStorage.vertexBuffers)
        n.indexOf(i) === -1 && n.push(i);
    return n;
  }
  /**
   * Returns a positive integer : the total number of indices in this mesh geometry.
   * @returns the numner of indices or zero if the mesh has no geometry.
   */
  getTotalIndices() {
    return this._geometry ? this._geometry.getTotalIndices() : 0;
  }
  /**
   * Returns an array of integers or a typed array (Int32Array, Uint32Array, Uint16Array) populated with the mesh indices.
   * @param copyWhenShared If true (default false) and and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
   * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
   * @returns the indices array or an empty array if the mesh has no geometry
   */
  getIndices(e, n) {
    return this._geometry ? this._geometry.getIndices(e, n) : [];
  }
  get isBlocked() {
    return this._masterMesh !== null && this._masterMesh !== void 0;
  }
  /**
   * Determine if the current mesh is ready to be rendered
   * @param completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
   * @param forceInstanceSupport will check if the mesh will be ready when used with instances (false by default)
   * @returns true if all associated assets are ready (material, textures, shaders)
   */
  isReady(e = !1, n = !1) {
    if (this.delayLoadState === 2 || !super.isReady(e))
      return !1;
    if (!this.subMeshes || this.subMeshes.length === 0 || !e)
      return !0;
    const i = this.getEngine(), t = this.getScene(), r = n || i.getCaps().instancedArrays && (this.instances.length > 0 || this.hasThinInstances);
    this.computeWorldMatrix();
    const s = this.material || t.defaultMaterial;
    if (s) {
      if (s._storeEffectOnSubMeshes)
        for (const a of this.subMeshes) {
          const l = a.getMaterial();
          if (l) {
            if (l._storeEffectOnSubMeshes) {
              if (!l.isReadyForSubMesh(this, a, r))
                return !1;
            } else if (!l.isReady(this, r))
              return !1;
          }
        }
      else if (!s.isReady(this, r))
        return !1;
    }
    const o = i.currentRenderPassId;
    for (const a of this.lightSources) {
      const l = a.getShadowGenerators();
      if (!l)
        continue;
      const h = l.values();
      for (let g = h.next(); g.done !== !0; g = h.next()) {
        const m = g.value;
        if (m && (!m.getShadowMap()?.renderList || m.getShadowMap()?.renderList && m.getShadowMap()?.renderList?.indexOf(this) !== -1)) {
          const D = m.getShadowMap().renderPassIds ?? [i.currentRenderPassId];
          for (let v = 0; v < D.length; ++v) {
            i.currentRenderPassId = D[v];
            for (const u of this.subMeshes)
              if (!m.isReady(u, r, u.getMaterial()?.needAlphaBlendingForMesh(this) ?? !1))
                return i.currentRenderPassId = o, !1;
          }
          i.currentRenderPassId = o;
        }
      }
    }
    for (const a of this._internalMeshDataInfo._LODLevels)
      if (a.mesh && !a.mesh.isReady(r))
        return !1;
    return !0;
  }
  /**
   * Gets a boolean indicating if the normals aren't to be recomputed on next mesh `positions` array update. This property is pertinent only for updatable parametric shapes.
   */
  get areNormalsFrozen() {
    return this._internalMeshDataInfo._areNormalsFrozen;
  }
  /**
   * This function affects parametric shapes on vertex position update only : ribbons, tubes, etc. It has no effect at all on other shapes. It prevents the mesh normals from being recomputed on next `positions` array update.
   * @returns the current mesh
   */
  freezeNormals() {
    return this._internalMeshDataInfo._areNormalsFrozen = !0, this;
  }
  /**
   * This function affects parametric shapes on vertex position update only : ribbons, tubes, etc. It has no effect at all on other shapes. It reactivates the mesh normals computation if it was previously frozen
   * @returns the current mesh
   */
  unfreezeNormals() {
    return this._internalMeshDataInfo._areNormalsFrozen = !1, this;
  }
  /**
   * Sets a value overriding the instance count. Only applicable when custom instanced InterleavedVertexBuffer are used rather than InstancedMeshs
   */
  set overridenInstanceCount(e) {
    this._instanceDataStorage.overridenInstanceCount = e;
  }
  // Methods
  /** @internal */
  _preActivate() {
    const e = this._internalMeshDataInfo, n = this.getScene().getRenderId();
    return e._preActivateId === n ? this : (e._preActivateId = n, this._instanceDataStorage.visibleInstances = null, this);
  }
  /**
   * @internal
   */
  _preActivateForIntermediateRendering(e) {
    return this._instanceDataStorage.visibleInstances && (this._instanceDataStorage.visibleInstances.intermediateDefaultRenderId = e), this;
  }
  /**
   * @internal
   */
  _registerInstanceForRenderId(e, n) {
    return this._instanceDataStorage.visibleInstances || (this._instanceDataStorage.visibleInstances = {
      defaultRenderId: n,
      selfDefaultRenderId: this._renderId
    }), this._instanceDataStorage.visibleInstances[n] || (this._instanceDataStorage.previousRenderId !== void 0 && this._instanceDataStorage.isFrozen && (this._instanceDataStorage.visibleInstances[this._instanceDataStorage.previousRenderId] = null), this._instanceDataStorage.previousRenderId = n, this._instanceDataStorage.visibleInstances[n] = new Array()), this._instanceDataStorage.visibleInstances[n].push(e), this;
  }
  _afterComputeWorldMatrix() {
    super._afterComputeWorldMatrix(), this.hasThinInstances && (this.doNotSyncBoundingInfo || this.thinInstanceRefreshBoundingInfo(!1));
  }
  /** @internal */
  _postActivate() {
    this.edgesShareWithInstances && this.edgesRenderer && this.edgesRenderer.isEnabled && this._renderingGroup && (this._renderingGroup._edgesRenderers.pushNoDuplicate(this.edgesRenderer), this.edgesRenderer.customInstances.push(this.getWorldMatrix()));
  }
  /**
   * This method recomputes and sets a new BoundingInfo to the mesh unless it is locked.
   * This means the mesh underlying bounding box and sphere are recomputed.
   * @param applySkeleton defines whether to apply the skeleton before computing the bounding info
   * @param applyMorph  defines whether to apply the morph target before computing the bounding info
   * @returns the current mesh
   */
  refreshBoundingInfo(e = !1, n = !1) {
    if (this.hasBoundingInfo && this.getBoundingInfo().isLocked)
      return this;
    const i = this.geometry ? this.geometry.boundingBias : null;
    return this._refreshBoundingInfo(this._getPositionData(e, n), i), this;
  }
  /**
   * @internal
   */
  _createGlobalSubMesh(e) {
    const n = this.getTotalVertices();
    if (!n || !this.getIndices())
      return null;
    if (this.subMeshes && this.subMeshes.length > 0) {
      const i = this.getIndices();
      if (!i)
        return null;
      const t = i.length;
      let r = !1;
      if (e)
        r = !0;
      else
        for (const s of this.subMeshes) {
          if (s.indexStart + s.indexCount > t) {
            r = !0;
            break;
          }
          if (s.verticesStart + s.verticesCount > n) {
            r = !0;
            break;
          }
        }
      if (!r)
        return this.subMeshes[0];
    }
    return this.releaseSubMeshes(), new k(0, 0, n, 0, this.getTotalIndices(), this);
  }
  /**
   * This function will subdivide the mesh into multiple submeshes
   * @param count defines the expected number of submeshes
   */
  subdivide(e) {
    if (e < 1)
      return;
    const n = this.getTotalIndices();
    let i = n / e | 0, t = 0;
    for (; i % 3 !== 0; )
      i++;
    this.releaseSubMeshes();
    for (let r = 0; r < e && !(t >= n); r++)
      k.CreateFromIndices(0, t, r === e - 1 ? n - t : i, this, void 0, !1), t += i;
    this.refreshBoundingInfo(), this.synchronizeInstances();
  }
  /**
   * Copy a FloatArray into a specific associated vertex buffer
   * @param kind defines which buffer to write to (positions, indices, normals, etc). Possible `kind` values :
   * - VertexBuffer.PositionKind
   * - VertexBuffer.UVKind
   * - VertexBuffer.UV2Kind
   * - VertexBuffer.UV3Kind
   * - VertexBuffer.UV4Kind
   * - VertexBuffer.UV5Kind
   * - VertexBuffer.UV6Kind
   * - VertexBuffer.ColorKind
   * - VertexBuffer.MatricesIndicesKind
   * - VertexBuffer.MatricesIndicesExtraKind
   * - VertexBuffer.MatricesWeightsKind
   * - VertexBuffer.MatricesWeightsExtraKind
   * @param data defines the data source
   * @param updatable defines if the updated vertex buffer must be flagged as updatable
   * @param stride defines the data stride size (can be null)
   * @returns the current mesh
   */
  setVerticesData(e, n, i = !1, t) {
    if (this._geometry)
      this._geometry.setVerticesData(e, n, i, t);
    else {
      const r = new P();
      r.set(n, e);
      const s = this.getScene();
      new F(F.RandomId(), s, r, i, this);
    }
    return this;
  }
  /**
   * Delete a vertex buffer associated with this mesh
   * @param kind defines which buffer to delete (positions, indices, normals, etc). Possible `kind` values :
   * - VertexBuffer.PositionKind
   * - VertexBuffer.UVKind
   * - VertexBuffer.UV2Kind
   * - VertexBuffer.UV3Kind
   * - VertexBuffer.UV4Kind
   * - VertexBuffer.UV5Kind
   * - VertexBuffer.UV6Kind
   * - VertexBuffer.ColorKind
   * - VertexBuffer.MatricesIndicesKind
   * - VertexBuffer.MatricesIndicesExtraKind
   * - VertexBuffer.MatricesWeightsKind
   * - VertexBuffer.MatricesWeightsExtraKind
   */
  removeVerticesData(e) {
    this._geometry && this._geometry.removeVerticesData(e);
  }
  /**
   * Flags an associated vertex buffer as updatable
   * @param kind defines which buffer to use (positions, indices, normals, etc). Possible `kind` values :
   * - VertexBuffer.PositionKind
   * - VertexBuffer.UVKind
   * - VertexBuffer.UV2Kind
   * - VertexBuffer.UV3Kind
   * - VertexBuffer.UV4Kind
   * - VertexBuffer.UV5Kind
   * - VertexBuffer.UV6Kind
   * - VertexBuffer.ColorKind
   * - VertexBuffer.MatricesIndicesKind
   * - VertexBuffer.MatricesIndicesExtraKind
   * - VertexBuffer.MatricesWeightsKind
   * - VertexBuffer.MatricesWeightsExtraKind
   * @param updatable defines if the updated vertex buffer must be flagged as updatable
   */
  markVerticesDataAsUpdatable(e, n = !0) {
    const i = this.getVertexBuffer(e);
    !i || i.isUpdatable() === n || this.setVerticesData(e, this.getVerticesData(e), n);
  }
  /**
   * Sets the mesh global Vertex Buffer
   * @param buffer defines the buffer to use
   * @param disposeExistingBuffer disposes the existing buffer, if any (default: true)
   * @returns the current mesh
   */
  setVerticesBuffer(e, n = !0) {
    return this._geometry || (this._geometry = F.CreateGeometryForMesh(this)), this._geometry.setVerticesBuffer(e, null, n), this;
  }
  /**
   * Update a specific associated vertex buffer
   * @param kind defines which buffer to write to (positions, indices, normals, etc). Possible `kind` values :
   * - VertexBuffer.PositionKind
   * - VertexBuffer.UVKind
   * - VertexBuffer.UV2Kind
   * - VertexBuffer.UV3Kind
   * - VertexBuffer.UV4Kind
   * - VertexBuffer.UV5Kind
   * - VertexBuffer.UV6Kind
   * - VertexBuffer.ColorKind
   * - VertexBuffer.MatricesIndicesKind
   * - VertexBuffer.MatricesIndicesExtraKind
   * - VertexBuffer.MatricesWeightsKind
   * - VertexBuffer.MatricesWeightsExtraKind
   * @param data defines the data source
   * @param updateExtends defines if extends info of the mesh must be updated (can be null). This is mostly useful for "position" kind
   * @param makeItUnique defines if the geometry associated with the mesh must be cloned to make the change only for this mesh (and not all meshes associated with the same geometry)
   * @returns the current mesh
   */
  updateVerticesData(e, n, i, t) {
    return this._geometry ? (t ? (this.makeGeometryUnique(), this.updateVerticesData(e, n, i, !1)) : this._geometry.updateVerticesData(e, n, i), this) : this;
  }
  /**
   * This method updates the vertex positions of an updatable mesh according to the `positionFunction` returned values.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph#other-shapes-updatemeshpositions
   * @param positionFunction is a simple JS function what is passed the mesh `positions` array. It doesn't need to return anything
   * @param computeNormals is a boolean (default true) to enable/disable the mesh normal recomputation after the vertex position update
   * @returns the current mesh
   */
  updateMeshPositions(e, n = !0) {
    const i = this.getVerticesData(f.PositionKind);
    if (!i)
      return this;
    if (e(i), this.updateVerticesData(f.PositionKind, i, !1, !1), n) {
      const t = this.getIndices(), r = this.getVerticesData(f.NormalKind);
      if (!r)
        return this;
      P.ComputeNormals(i, t, r), this.updateVerticesData(f.NormalKind, r, !1, !1);
    }
    return this;
  }
  /**
   * Creates a un-shared specific occurence of the geometry for the mesh.
   * @returns the current mesh
   */
  makeGeometryUnique() {
    if (!this._geometry)
      return this;
    if (this._geometry.meshes.length === 1)
      return this;
    const e = this._geometry, n = this._geometry.copy(F.RandomId());
    return e.releaseForMesh(this, !0), n.applyToMesh(this), this;
  }
  /**
   * Sets the index buffer of this mesh.
   * @param indexBuffer Defines the index buffer to use for this mesh
   * @param totalVertices Defines the total number of vertices used by the buffer
   * @param totalIndices Defines the total number of indices in the index buffer
   */
  setIndexBuffer(e, n, i) {
    let t = this._geometry;
    t || (t = new F(F.RandomId(), this.getScene(), void 0, void 0, this)), t.setIndexBuffer(e, n, i);
  }
  /**
   * Set the index buffer of this mesh
   * @param indices defines the source data
   * @param totalVertices defines the total number of vertices referenced by this index data (can be null)
   * @param updatable defines if the updated index buffer must be flagged as updatable (default is false)
   * @returns the current mesh
   */
  setIndices(e, n = null, i = !1) {
    if (this._geometry)
      this._geometry.setIndices(e, n, i);
    else {
      const t = new P();
      t.indices = e;
      const r = this.getScene();
      new F(F.RandomId(), r, t, i, this);
    }
    return this;
  }
  /**
   * Update the current index buffer
   * @param indices defines the source data
   * @param offset defines the offset in the index buffer where to store the new data (can be null)
   * @param gpuMemoryOnly defines a boolean indicating that only the GPU memory must be updated leaving the CPU version of the indices unchanged (false by default)
   * @returns the current mesh
   */
  updateIndices(e, n, i = !1) {
    return this._geometry ? (this._geometry.updateIndices(e, n, i), this) : this;
  }
  /**
   * Invert the geometry to move from a right handed system to a left handed one.
   * @returns the current mesh
   */
  toLeftHanded() {
    return this._geometry ? (this._geometry.toLeftHanded(), this) : this;
  }
  /**
   * @internal
   */
  _bind(e, n, i, t = !0) {
    if (!this._geometry)
      return this;
    const r = this.getScene().getEngine();
    this.morphTargetManager && this.morphTargetManager.isUsingTextureForTargets && this.morphTargetManager._bind(n);
    let s;
    if (this._unIndexed)
      s = null;
    else
      switch (this._getRenderingFillMode(i)) {
        case O.PointFillMode:
          s = null;
          break;
        case O.WireFrameFillMode:
          s = e._getLinesIndexBuffer(this.getIndices(), r);
          break;
        default:
        case O.TriangleFillMode:
          s = this._geometry.getIndexBuffer();
          break;
      }
    return !t || !this._userInstancedBuffersStorage || this.hasThinInstances ? this._geometry._bind(n, s) : this._geometry._bind(n, s, this._userInstancedBuffersStorage.vertexBuffers, this._userInstancedBuffersStorage.vertexArrayObjects), this;
  }
  /**
   * @internal
   */
  _draw(e, n, i) {
    if (!this._geometry || !this._geometry.getVertexBuffers() || !this._unIndexed && !this._geometry.getIndexBuffer())
      return this;
    this._internalMeshDataInfo._onBeforeDrawObservable && this._internalMeshDataInfo._onBeforeDrawObservable.notifyObservers(this);
    const r = this.getScene().getEngine();
    return this._unIndexed || n == O.PointFillMode ? r.drawArraysType(n, e.verticesStart, e.verticesCount, this.forcedInstanceCount || i) : n == O.WireFrameFillMode ? r.drawElementsType(n, 0, e._linesIndexCount, this.forcedInstanceCount || i) : r.drawElementsType(n, e.indexStart, e.indexCount, this.forcedInstanceCount || i), this;
  }
  /**
   * Registers for this mesh a javascript function called just before the rendering process
   * @param func defines the function to call before rendering this mesh
   * @returns the current mesh
   */
  registerBeforeRender(e) {
    return this.onBeforeRenderObservable.add(e), this;
  }
  /**
   * Disposes a previously registered javascript function called before the rendering
   * @param func defines the function to remove
   * @returns the current mesh
   */
  unregisterBeforeRender(e) {
    return this.onBeforeRenderObservable.removeCallback(e), this;
  }
  /**
   * Registers for this mesh a javascript function called just after the rendering is complete
   * @param func defines the function to call after rendering this mesh
   * @returns the current mesh
   */
  registerAfterRender(e) {
    return this.onAfterRenderObservable.add(e), this;
  }
  /**
   * Disposes a previously registered javascript function called after the rendering.
   * @param func defines the function to remove
   * @returns the current mesh
   */
  unregisterAfterRender(e) {
    return this.onAfterRenderObservable.removeCallback(e), this;
  }
  /**
   * @internal
   */
  _getInstancesRenderList(e, n = !1) {
    if (this._instanceDataStorage.isFrozen) {
      if (n)
        return this._instanceDataStorage.batchCacheReplacementModeInFrozenMode.hardwareInstancedRendering[e] = !1, this._instanceDataStorage.batchCacheReplacementModeInFrozenMode.renderSelf[e] = !0, this._instanceDataStorage.batchCacheReplacementModeInFrozenMode;
      if (this._instanceDataStorage.previousBatch)
        return this._instanceDataStorage.previousBatch;
    }
    const i = this.getScene(), t = i._isInIntermediateRendering(), r = t ? this._internalAbstractMeshDataInfo._onlyForInstancesIntermediate : this._internalAbstractMeshDataInfo._onlyForInstances, s = this._instanceDataStorage.batchCache;
    if (s.mustReturn = !1, s.renderSelf[e] = n || !r && this.isEnabled() && this.isVisible, s.visibleInstances[e] = null, this._instanceDataStorage.visibleInstances && !n) {
      const o = this._instanceDataStorage.visibleInstances, a = i.getRenderId(), l = t ? o.intermediateDefaultRenderId : o.defaultRenderId;
      s.visibleInstances[e] = o[a], !s.visibleInstances[e] && l && (s.visibleInstances[e] = o[l]);
    }
    return s.hardwareInstancedRendering[e] = !n && this._instanceDataStorage.hardwareInstancedRendering && s.visibleInstances[e] !== null && s.visibleInstances[e] !== void 0, this._instanceDataStorage.previousBatch = s, s;
  }
  /**
   * @internal
   */
  _renderWithInstances(e, n, i, t, r) {
    const s = i.visibleInstances[e._id], o = s ? s.length : 0, a = this._instanceDataStorage, l = a.instancesBufferSize;
    let h = a.instancesBuffer, g = a.instancesPreviousBuffer;
    const p = (o + 1) * 16 * 4;
    for (; a.instancesBufferSize < p; )
      a.instancesBufferSize *= 2;
    (!a.instancesData || l != a.instancesBufferSize) && (a.instancesData = new Float32Array(a.instancesBufferSize / 4)), (this._scene.needsPreviousWorldMatrices && !a.instancesPreviousData || l != a.instancesBufferSize) && (a.instancesPreviousData = new Float32Array(a.instancesBufferSize / 4));
    let D = 0, v = 0;
    const u = i.renderSelf[e._id], x = !h || l !== a.instancesBufferSize || this._scene.needsPreviousWorldMatrices && !a.instancesPreviousBuffer;
    if (!this._instanceDataStorage.manualUpdate && (!a.isFrozen || x)) {
      const _ = this.getWorldMatrix();
      if (u && (this._scene.needsPreviousWorldMatrices && (a.masterMeshPreviousWorldMatrix ? (a.masterMeshPreviousWorldMatrix.copyToArray(a.instancesPreviousData, D), a.masterMeshPreviousWorldMatrix.copyFrom(_)) : (a.masterMeshPreviousWorldMatrix = _.clone(), a.masterMeshPreviousWorldMatrix.copyToArray(a.instancesPreviousData, D))), _.copyToArray(a.instancesData, D), D += 16, v++), s) {
        if (M.INSTANCEDMESH_SORT_TRANSPARENT && this._scene.activeCamera && e.getMaterial()?.needAlphaBlendingForMesh(e.getRenderingMesh())) {
          const A = this._scene.activeCamera.globalPosition;
          for (let y = 0; y < s.length; y++) {
            const I = s[y];
            I._distanceToCamera = B.Distance(I.getBoundingInfo().boundingSphere.centerWorld, A);
          }
          s.sort((y, I) => y._distanceToCamera > I._distanceToCamera ? -1 : y._distanceToCamera < I._distanceToCamera ? 1 : 0);
        }
        for (let A = 0; A < s.length; A++) {
          const y = s[A], I = y.getWorldMatrix();
          I.copyToArray(a.instancesData, D), this._scene.needsPreviousWorldMatrices && (y._previousWorldMatrix ? (y._previousWorldMatrix.copyToArray(a.instancesPreviousData, D), y._previousWorldMatrix.copyFrom(I)) : (y._previousWorldMatrix = I.clone(), y._previousWorldMatrix.copyToArray(a.instancesPreviousData, D))), D += 16, v++;
        }
      }
    } else
      v = (u ? 1 : 0) + o;
    return x ? (h && h.dispose(), g && g.dispose(), h = new U(r, a.instancesData, !0, 16, !1, !0), a.instancesBuffer = h, this._userInstancedBuffersStorage || (this._userInstancedBuffersStorage = {
      data: {},
      vertexBuffers: {},
      strides: {},
      sizes: {},
      vertexArrayObjects: this.getEngine().getCaps().vertexArrayObject ? {} : void 0
    }), this._userInstancedBuffersStorage.vertexBuffers.world0 = h.createVertexBuffer("world0", 0, 4), this._userInstancedBuffersStorage.vertexBuffers.world1 = h.createVertexBuffer("world1", 4, 4), this._userInstancedBuffersStorage.vertexBuffers.world2 = h.createVertexBuffer("world2", 8, 4), this._userInstancedBuffersStorage.vertexBuffers.world3 = h.createVertexBuffer("world3", 12, 4), this._scene.needsPreviousWorldMatrices && (g = new U(r, a.instancesPreviousData, !0, 16, !1, !0), a.instancesPreviousBuffer = g, this._userInstancedBuffersStorage.vertexBuffers.previousWorld0 = g.createVertexBuffer("previousWorld0", 0, 4), this._userInstancedBuffersStorage.vertexBuffers.previousWorld1 = g.createVertexBuffer("previousWorld1", 4, 4), this._userInstancedBuffersStorage.vertexBuffers.previousWorld2 = g.createVertexBuffer("previousWorld2", 8, 4), this._userInstancedBuffersStorage.vertexBuffers.previousWorld3 = g.createVertexBuffer("previousWorld3", 12, 4)), this._invalidateInstanceVertexArrayObject()) : (!this._instanceDataStorage.isFrozen || this._instanceDataStorage.forceMatrixUpdates) && (h.updateDirectly(a.instancesData, 0, v), this._scene.needsPreviousWorldMatrices && (!this._instanceDataStorage.manualUpdate || this._instanceDataStorage.previousManualUpdate) && g.updateDirectly(a.instancesPreviousData, 0, v)), this._processInstancedBuffers(s, u), this.getScene()._activeIndices.addCount(e.indexCount * v, !1), r._currentDrawContext && (r._currentDrawContext.useInstancing = !0), this._bind(e, t, n), this._draw(e, n, v), this._scene.needsPreviousWorldMatrices && !x && this._instanceDataStorage.manualUpdate && (!this._instanceDataStorage.isFrozen || this._instanceDataStorage.forceMatrixUpdates) && !this._instanceDataStorage.previousManualUpdate && g.updateDirectly(a.instancesData, 0, v), r.unbindInstanceAttributes(), this;
  }
  /**
   * @internal
   */
  _renderWithThinInstances(e, n, i, t) {
    const r = this._thinInstanceDataStorage?.instancesCount ?? 0;
    this.getScene()._activeIndices.addCount(e.indexCount * r, !1), t._currentDrawContext && (t._currentDrawContext.useInstancing = !0), this._bind(e, i, n), this._draw(e, n, r), this._scene.needsPreviousWorldMatrices && !this._thinInstanceDataStorage.previousMatrixData && this._thinInstanceDataStorage.matrixData && (this._thinInstanceDataStorage.previousMatrixBuffer ? this._thinInstanceDataStorage.previousMatrixBuffer.updateDirectly(this._thinInstanceDataStorage.matrixData, 0, r) : this._thinInstanceDataStorage.previousMatrixBuffer = this._thinInstanceCreateMatrixBuffer("previousWorld", this._thinInstanceDataStorage.matrixData, !1)), t.unbindInstanceAttributes();
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _processInstancedBuffers(e, n) {
  }
  /**
   * @internal
   */
  _processRendering(e, n, i, t, r, s, o, a) {
    const l = this.getScene(), h = l.getEngine();
    if (t = this._getRenderingFillMode(t), s && n.getRenderingMesh().hasThinInstances)
      return this._renderWithThinInstances(n, t, i, h), this;
    if (s)
      this._renderWithInstances(n, t, r, i, h);
    else {
      h._currentDrawContext && (h._currentDrawContext.useInstancing = !1);
      let g = 0;
      r.renderSelf[n._id] && (o && o(!1, e.getWorldMatrix(), a), g++, this._draw(n, t, this._instanceDataStorage.overridenInstanceCount));
      const m = r.visibleInstances[n._id];
      if (m) {
        const p = m.length;
        g += p;
        for (let D = 0; D < p; D++) {
          const u = m[D].getWorldMatrix();
          o && o(!0, u, a), this._draw(n, t);
        }
      }
      l._activeIndices.addCount(n.indexCount * g, !1);
    }
    return this;
  }
  /**
   * @internal
   */
  _rebuild(e = !1) {
    if (this._instanceDataStorage.instancesBuffer && (e && this._instanceDataStorage.instancesBuffer.dispose(), this._instanceDataStorage.instancesBuffer = null), this._userInstancedBuffersStorage) {
      for (const n in this._userInstancedBuffersStorage.vertexBuffers) {
        const i = this._userInstancedBuffersStorage.vertexBuffers[n];
        i && (e && i.dispose(), this._userInstancedBuffersStorage.vertexBuffers[n] = null);
      }
      this._userInstancedBuffersStorage.vertexArrayObjects && (this._userInstancedBuffersStorage.vertexArrayObjects = {});
    }
    this._internalMeshDataInfo._effectiveMaterial = null, super._rebuild(e);
  }
  /** @internal */
  _freeze() {
    if (this.subMeshes) {
      for (let e = 0; e < this.subMeshes.length; e++)
        this._getInstancesRenderList(e);
      this._internalMeshDataInfo._effectiveMaterial = null, this._instanceDataStorage.isFrozen = !0;
    }
  }
  /** @internal */
  _unFreeze() {
    this._instanceDataStorage.isFrozen = !1, this._instanceDataStorage.previousBatch = null;
  }
  /**
   * Triggers the draw call for the mesh (or a submesh), for a specific render pass id
   * @param renderPassId defines the render pass id to use to draw the mesh / submesh. If not provided, use the current renderPassId of the engine.
   * @param enableAlphaMode defines if alpha mode can be changed (default: false)
   * @param effectiveMeshReplacement defines an optional mesh used to provide info for the rendering (default: undefined)
   * @param subMesh defines the subMesh to render. If not provided, draw all mesh submeshes (default: undefined)
   * @param checkFrustumCulling defines if frustum culling must be checked (default: true). If you know the mesh is in the frustum (or if you don't care!), you can pass false to optimize.
   * @returns the current mesh
   */
  renderWithRenderPassId(e, n, i, t, r = !0) {
    const s = this._scene.getEngine(), o = s.currentRenderPassId;
    if (e !== void 0 && (s.currentRenderPassId = e), t)
      (!r || r && t.isInFrustum(this._scene._frustumPlanes)) && this.render(t, !!n, i);
    else
      for (let a = 0; a < this.subMeshes.length; a++) {
        const l = this.subMeshes[a];
        (!r || r && l.isInFrustum(this._scene._frustumPlanes)) && this.render(l, !!n, i);
      }
    return e !== void 0 && (s.currentRenderPassId = o), this;
  }
  /**
   * Triggers the draw call for the mesh. Usually, you don't need to call this method by your own because the mesh rendering is handled by the scene rendering manager
   * @param subMesh defines the subMesh to render
   * @param enableAlphaMode defines if alpha mode can be changed
   * @param effectiveMeshReplacement defines an optional mesh used to provide info for the rendering
   * @returns the current mesh
   */
  render(e, n, i) {
    const t = this.getScene();
    this._internalAbstractMeshDataInfo._isActiveIntermediate ? this._internalAbstractMeshDataInfo._isActiveIntermediate = !1 : this._internalAbstractMeshDataInfo._isActive = !1;
    const r = t.activeCameras?.length ?? 0;
    if ((r > 1 && t.activeCamera === t.activeCameras[0] || r <= 1) && this._checkOcclusionQuery() && !this._occlusionDataStorage.forceRenderingWhenOccluded)
      return this;
    const o = this._getInstancesRenderList(e._id, !!i);
    if (o.mustReturn)
      return this;
    if (!this._geometry || !this._geometry.getVertexBuffers() || !this._unIndexed && !this._geometry.getIndexBuffer())
      return this;
    const a = t.getEngine();
    let l = 0, h = null;
    this.ignoreCameraMaxZ && t.activeCamera && !t._isInIntermediateRendering() && (l = t.activeCamera.maxZ, h = t.activeCamera, t.activeCamera.maxZ = 0, t.updateTransformMatrix(!0)), this._internalMeshDataInfo._onBeforeRenderObservable && this._internalMeshDataInfo._onBeforeRenderObservable.notifyObservers(this);
    const g = e.getRenderingMesh(), m = o.hardwareInstancedRendering[e._id] || g.hasThinInstances || !!this._userInstancedBuffersStorage && !e.getMesh()._internalAbstractMeshDataInfo._actAsRegularMesh, p = this._instanceDataStorage, D = e.getMaterial();
    if (!D)
      return h && (h.maxZ = l, t.updateTransformMatrix(!0)), this;
    if (!p.isFrozen || !this._internalMeshDataInfo._effectiveMaterial || this._internalMeshDataInfo._effectiveMaterial !== D) {
      if (D._storeEffectOnSubMeshes) {
        if (!D.isReadyForSubMesh(this, e, m))
          return h && (h.maxZ = l, t.updateTransformMatrix(!0)), this;
      } else if (!D.isReady(this, m))
        return h && (h.maxZ = l, t.updateTransformMatrix(!0)), this;
      this._internalMeshDataInfo._effectiveMaterial = D;
    } else if (D._storeEffectOnSubMeshes && !e._drawWrapper?._wasPreviouslyReady || !D._storeEffectOnSubMeshes && !D._getDrawWrapper()._wasPreviouslyReady)
      return h && (h.maxZ = l, t.updateTransformMatrix(!0)), this;
    n && a.setAlphaMode(this._internalMeshDataInfo._effectiveMaterial.alphaMode);
    let v;
    this._internalMeshDataInfo._effectiveMaterial._storeEffectOnSubMeshes ? v = e._drawWrapper : v = this._internalMeshDataInfo._effectiveMaterial._getDrawWrapper();
    const u = v?.effect ?? null;
    for (const d of t._beforeRenderingMeshStage)
      d.action(this, e, o, u);
    if (!v || !u)
      return h && (h.maxZ = l, t.updateTransformMatrix(!0)), this;
    const x = i || this;
    let _;
    if (!p.isFrozen && (this._internalMeshDataInfo._effectiveMaterial.backFaceCulling || this.overrideMaterialSideOrientation !== null || this._internalMeshDataInfo._effectiveMaterial.twoSidedLighting)) {
      const d = x._getWorldMatrixDeterminant();
      _ = this.overrideMaterialSideOrientation, _ == null && (_ = this._internalMeshDataInfo._effectiveMaterial.sideOrientation), d < 0 && (_ = _ === O.ClockWiseSideOrientation ? O.CounterClockWiseSideOrientation : O.ClockWiseSideOrientation), p.sideOrientation = _;
    } else
      _ = p.sideOrientation;
    const A = this._internalMeshDataInfo._effectiveMaterial._preBind(v, _);
    this._internalMeshDataInfo._effectiveMaterial.forceDepthWrite && a.setDepthWrite(!0);
    const y = this._internalMeshDataInfo._effectiveMaterial, I = y.fillMode;
    this._internalMeshDataInfo._onBeforeBindObservable && this._internalMeshDataInfo._onBeforeBindObservable.notifyObservers(this), m || this._bind(e, u, I, !1);
    const c = x.getWorldMatrix();
    y._storeEffectOnSubMeshes ? y.bindForSubMesh(c, this, e) : y.bind(c, this), !y.backFaceCulling && y.separateCullingPass && (a.setState(!0, y.zOffset, !1, !A, y.cullBackFaces, y.stencil, y.zOffsetUnits), this._processRendering(this, e, u, I, o, m, this._onBeforeDraw, this._internalMeshDataInfo._effectiveMaterial), a.setState(!0, y.zOffset, !1, A, y.cullBackFaces, y.stencil, y.zOffsetUnits), this._internalMeshDataInfo._onBetweenPassObservable && this._internalMeshDataInfo._onBetweenPassObservable.notifyObservers(e)), this._processRendering(this, e, u, I, o, m, this._onBeforeDraw, this._internalMeshDataInfo._effectiveMaterial), this._internalMeshDataInfo._effectiveMaterial.unbind();
    for (const d of t._afterRenderingMeshStage)
      d.action(this, e, o, u);
    return this._internalMeshDataInfo._onAfterRenderObservable && this._internalMeshDataInfo._onAfterRenderObservable.notifyObservers(this), h && (h.maxZ = l, t.updateTransformMatrix(!0)), t.performancePriority === se.Aggressive && !p.isFrozen && this._freeze(), this;
  }
  /**
   *   Renormalize the mesh and patch it up if there are no weights
   *   Similar to normalization by adding the weights compute the reciprocal and multiply all elements, this wil ensure that everything adds to 1.
   *   However in the case of zero weights then we set just a single influence to 1.
   *   We check in the function for extra's present and if so we use the normalizeSkinWeightsWithExtras rather than the FourWeights version.
   */
  cleanMatrixWeights() {
    this.isVerticesDataPresent(f.MatricesWeightsKind) && (this.isVerticesDataPresent(f.MatricesWeightsExtraKind) ? this._normalizeSkinWeightsAndExtra() : this._normalizeSkinFourWeights());
  }
  // faster 4 weight version.
  _normalizeSkinFourWeights() {
    const e = this.getVerticesData(f.MatricesWeightsKind), n = e.length;
    for (let i = 0; i < n; i += 4) {
      const t = e[i] + e[i + 1] + e[i + 2] + e[i + 3];
      if (t === 0)
        e[i] = 1;
      else {
        const r = 1 / t;
        e[i] *= r, e[i + 1] *= r, e[i + 2] *= r, e[i + 3] *= r;
      }
    }
    this.setVerticesData(f.MatricesWeightsKind, e);
  }
  // handle special case of extra verts.  (in theory gltf can handle 12 influences)
  _normalizeSkinWeightsAndExtra() {
    const e = this.getVerticesData(f.MatricesWeightsExtraKind), n = this.getVerticesData(f.MatricesWeightsKind), i = n.length;
    for (let t = 0; t < i; t += 4) {
      let r = n[t] + n[t + 1] + n[t + 2] + n[t + 3];
      if (r += e[t] + e[t + 1] + e[t + 2] + e[t + 3], r === 0)
        n[t] = 1;
      else {
        const s = 1 / r;
        n[t] *= s, n[t + 1] *= s, n[t + 2] *= s, n[t + 3] *= s, e[t] *= s, e[t + 1] *= s, e[t + 2] *= s, e[t + 3] *= s;
      }
    }
    this.setVerticesData(f.MatricesWeightsKind, n), this.setVerticesData(f.MatricesWeightsKind, e);
  }
  /**
   * ValidateSkinning is used to determine that a mesh has valid skinning data along with skin metrics, if missing weights,
   * or not normalized it is returned as invalid mesh the string can be used for console logs, or on screen messages to let
   * the user know there was an issue with importing the mesh
   * @returns a validation object with skinned, valid and report string
   */
  validateSkinning() {
    const e = this.getVerticesData(f.MatricesWeightsExtraKind), n = this.getVerticesData(f.MatricesWeightsKind);
    if (n === null || this.skeleton == null)
      return { skinned: !1, valid: !0, report: "not skinned" };
    const i = n.length;
    let t = 0, r = 0, s = 0, o = 0;
    const a = e === null ? 4 : 8, l = [];
    for (let u = 0; u <= a; u++)
      l[u] = 0;
    const h = 1e-3;
    for (let u = 0; u < i; u += 4) {
      let x = n[u], _ = x, A = _ === 0 ? 0 : 1;
      for (let y = 1; y < a; y++) {
        const I = y < 4 ? n[u + y] : e[u + y - 4];
        I > x && t++, I !== 0 && A++, _ += I, x = I;
      }
      if (l[A]++, A > s && (s = A), _ === 0)
        r++;
      else {
        const y = 1 / _;
        let I = 0;
        for (let c = 0; c < a; c++)
          c < 4 ? I += Math.abs(n[u + c] - n[u + c] * y) : I += Math.abs(e[u + c - 4] - e[u + c - 4] * y);
        I > h && o++;
      }
    }
    const g = this.skeleton.bones.length, m = this.getVerticesData(f.MatricesIndicesKind), p = this.getVerticesData(f.MatricesIndicesExtraKind);
    let D = 0;
    for (let u = 0; u < i; u += 4)
      for (let x = 0; x < a; x++) {
        const _ = x < 4 ? m[u + x] : p[u + x - 4];
        (_ >= g || _ < 0) && D++;
      }
    const v = "Number of Weights = " + i / 4 + `
Maximum influences = ` + s + `
Missing Weights = ` + r + `
Not Sorted = ` + t + `
Not Normalized = ` + o + `
WeightCounts = [` + l + `]
Number of bones = ` + g + `
Bad Bone Indices = ` + D;
    return { skinned: !0, valid: r === 0 && o === 0 && D === 0, report: v };
  }
  /** @internal */
  _checkDelayState() {
    const e = this.getScene();
    return this._geometry ? this._geometry.load(e) : this.delayLoadState === 4 && (this.delayLoadState = 2, this._queueLoad(e)), this;
  }
  _queueLoad(e) {
    e.addPendingData(this);
    const n = this.delayLoadingFile.indexOf(".babylonbinarymeshdata") !== -1;
    return K.LoadFile(this.delayLoadingFile, (i) => {
      i instanceof ArrayBuffer ? this._delayLoadingFunction(i, this) : this._delayLoadingFunction(JSON.parse(i), this), this.instances.forEach((t) => {
        t.refreshBoundingInfo(), t._syncSubMeshes();
      }), this.delayLoadState = 1, e.removePendingData(this);
    }, () => {
    }, e.offlineProvider, n), this;
  }
  /**
   * Returns `true` if the mesh is within the frustum defined by the passed array of planes.
   * A mesh is in the frustum if its bounding box intersects the frustum
   * @param frustumPlanes defines the frustum to test
   * @returns true if the mesh is in the frustum planes
   */
  isInFrustum(e) {
    return this.delayLoadState === 2 || !super.isInFrustum(e) ? !1 : (this._checkDelayState(), !0);
  }
  /**
   * Sets the mesh material by the material or multiMaterial `id` property
   * @param id is a string identifying the material or the multiMaterial
   * @returns the current mesh
   */
  setMaterialById(e) {
    const n = this.getScene().materials;
    let i;
    for (i = n.length - 1; i > -1; i--)
      if (n[i].id === e)
        return this.material = n[i], this;
    const t = this.getScene().multiMaterials;
    for (i = t.length - 1; i > -1; i--)
      if (t[i].id === e)
        return this.material = t[i], this;
    return this;
  }
  /**
   * Returns as a new array populated with the mesh material and/or skeleton, if any.
   * @returns an array of IAnimatable
   */
  getAnimatables() {
    const e = [];
    return this.material && e.push(this.material), this.skeleton && e.push(this.skeleton), e;
  }
  /**
   * Modifies the mesh geometry according to the passed transformation matrix.
   * This method returns nothing, but it really modifies the mesh even if it's originally not set as updatable.
   * The mesh normals are modified using the same transformation.
   * Note that, under the hood, this method sets a new VertexBuffer each call.
   * @param transform defines the transform matrix to use
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/bakingTransforms
   * @returns the current mesh
   */
  bakeTransformIntoVertices(e) {
    if (!this.isVerticesDataPresent(f.PositionKind))
      return this;
    const n = this.subMeshes.splice(0);
    this._resetPointsArrayCache();
    let i = this.getVerticesData(f.PositionKind);
    const t = B.Zero();
    let r;
    for (r = 0; r < i.length; r += 3)
      B.TransformCoordinatesFromFloatsToRef(i[r], i[r + 1], i[r + 2], e, t).toArray(i, r);
    if (this.setVerticesData(f.PositionKind, i, this.getVertexBuffer(f.PositionKind).isUpdatable()), this.isVerticesDataPresent(f.NormalKind)) {
      for (i = this.getVerticesData(f.NormalKind), r = 0; r < i.length; r += 3)
        B.TransformNormalFromFloatsToRef(i[r], i[r + 1], i[r + 2], e, t).normalize().toArray(i, r);
      this.setVerticesData(f.NormalKind, i, this.getVertexBuffer(f.NormalKind).isUpdatable());
    }
    if (this.isVerticesDataPresent(f.TangentKind)) {
      for (i = this.getVerticesData(f.TangentKind), r = 0; r < i.length; r += 4)
        B.TransformNormalFromFloatsToRef(i[r], i[r + 1], i[r + 2], e, t).normalize().toArray(i, r);
      this.setVerticesData(f.TangentKind, i, this.getVertexBuffer(f.TangentKind).isUpdatable());
    }
    return e.determinant() < 0 && this.flipFaces(), this.releaseSubMeshes(), this.subMeshes = n, this;
  }
  /**
   * Modifies the mesh geometry according to its own current World Matrix.
   * The mesh World Matrix is then reset.
   * This method returns nothing but really modifies the mesh even if it's originally not set as updatable.
   * Note that, under the hood, this method sets a new VertexBuffer each call.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/bakingTransforms
   * @param bakeIndependentlyOfChildren indicates whether to preserve all child nodes' World Matrix during baking
   * @returns the current mesh
   */
  bakeCurrentTransformIntoVertices(e = !0) {
    return this.bakeTransformIntoVertices(this.computeWorldMatrix(!0)), this.resetLocalMatrix(e), this;
  }
  // Cache
  /** @internal */
  get _positions() {
    return this._internalAbstractMeshDataInfo._positions ? this._internalAbstractMeshDataInfo._positions : this._geometry ? this._geometry._positions : null;
  }
  /** @internal */
  _resetPointsArrayCache() {
    return this._geometry && this._geometry._resetPointsArrayCache(), this;
  }
  /** @internal */
  _generatePointsArray() {
    return this._geometry ? this._geometry._generatePointsArray() : !1;
  }
  /**
   * Returns a new Mesh object generated from the current mesh properties.
   * This method must not get confused with createInstance()
   * @param name is a string, the name given to the new mesh
   * @param newParent can be any Node object (default `null`)
   * @param doNotCloneChildren allows/denies the recursive cloning of the original mesh children if any (default `false`)
   * @param clonePhysicsImpostor allows/denies the cloning in the same time of the original mesh `body` used by the physics engine, if any (default `true`)
   * @returns a new mesh
   */
  clone(e = "", n = null, i, t = !0) {
    return new M(e, this.getScene(), n, this, i, t);
  }
  /**
   * Releases resources associated with this mesh.
   * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
   * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
   */
  dispose(e, n = !1) {
    this.morphTargetManager = null, this._geometry && this._geometry.releaseForMesh(this, !0);
    const i = this._internalMeshDataInfo;
    if (i._onBeforeDrawObservable && i._onBeforeDrawObservable.clear(), i._onBeforeBindObservable && i._onBeforeBindObservable.clear(), i._onBeforeRenderObservable && i._onBeforeRenderObservable.clear(), i._onAfterRenderObservable && i._onAfterRenderObservable.clear(), i._onBetweenPassObservable && i._onBetweenPassObservable.clear(), this._scene.useClonedMeshMap) {
      if (i.meshMap)
        for (const t in i.meshMap) {
          const r = i.meshMap[t];
          r && (r._internalMeshDataInfo._source = null, i.meshMap[t] = void 0);
        }
      i._source && i._source._internalMeshDataInfo.meshMap && (i._source._internalMeshDataInfo.meshMap[this.uniqueId] = void 0);
    } else {
      const t = this.getScene().meshes;
      for (const r of t) {
        const s = r;
        s._internalMeshDataInfo && s._internalMeshDataInfo._source && s._internalMeshDataInfo._source === this && (s._internalMeshDataInfo._source = null);
      }
    }
    i._source = null, this._instanceDataStorage.visibleInstances = {}, this._disposeInstanceSpecificData(), this._disposeThinInstanceSpecificData(), this._internalMeshDataInfo._checkReadinessObserver && this._scene.onBeforeRenderObservable.remove(this._internalMeshDataInfo._checkReadinessObserver), super.dispose(e, n);
  }
  /** @internal */
  _disposeInstanceSpecificData() {
  }
  /** @internal */
  _disposeThinInstanceSpecificData() {
  }
  /** @internal */
  _invalidateInstanceVertexArrayObject() {
  }
  /**
   * Modifies the mesh geometry according to a displacement map.
   * A displacement map is a colored image. Each pixel color value (actually a gradient computed from red, green, blue values) will give the displacement to apply to each mesh vertex.
   * The mesh must be set as updatable. Its internal geometry is directly modified, no new buffer are allocated.
   * @param url is a string, the URL from the image file is to be downloaded.
   * @param minHeight is the lower limit of the displacement.
   * @param maxHeight is the upper limit of the displacement.
   * @param onSuccess is an optional Javascript function to be called just after the mesh is modified. It is passed the modified mesh and must return nothing.
   * @param uvOffset is an optional vector2 used to offset UV.
   * @param uvScale is an optional vector2 used to scale UV.
   * @param forceUpdate defines whether or not to force an update of the generated buffers. This is useful to apply on a deserialized model for instance.
   * @param onError defines a callback called when an error occurs during the processing of the request.
   * @returns the Mesh.
   */
  applyDisplacementMap(e, n, i, t, r, s, o = !1, a) {
    const l = this.getScene(), h = (g) => {
      const m = g.width, p = g.height, v = this.getEngine().createCanvas(m, p).getContext("2d");
      v.drawImage(g, 0, 0);
      const u = v.getImageData(0, 0, m, p).data;
      this.applyDisplacementMapFromBuffer(u, m, p, n, i, r, s, o), t && t(this);
    };
    return K.LoadImage(e, h, a || (() => {
    }), l.offlineProvider), this;
  }
  /**
   * Modifies the mesh geometry according to a displacementMap buffer.
   * A displacement map is a colored image. Each pixel color value (actually a gradient computed from red, green, blue values) will give the displacement to apply to each mesh vertex.
   * The mesh must be set as updatable. Its internal geometry is directly modified, no new buffer are allocated.
   * @param buffer is a `Uint8Array` buffer containing series of `Uint8` lower than 255, the red, green, blue and alpha values of each successive pixel.
   * @param heightMapWidth is the width of the buffer image.
   * @param heightMapHeight is the height of the buffer image.
   * @param minHeight is the lower limit of the displacement.
   * @param maxHeight is the upper limit of the displacement.
   * @param uvOffset is an optional vector2 used to offset UV.
   * @param uvScale is an optional vector2 used to scale UV.
   * @param forceUpdate defines whether or not to force an update of the generated buffers. This is useful to apply on a deserialized model for instance.
   * @returns the Mesh.
   */
  applyDisplacementMapFromBuffer(e, n, i, t, r, s, o, a = !1) {
    if (!this.isVerticesDataPresent(f.PositionKind) || !this.isVerticesDataPresent(f.NormalKind) || !this.isVerticesDataPresent(f.UVKind))
      return V.Warn("Cannot call applyDisplacementMap: Given mesh is not complete. Position, Normal or UV are missing"), this;
    const l = this.getVerticesData(f.PositionKind, !0, !0), h = this.getVerticesData(f.NormalKind), g = this.getVerticesData(f.UVKind);
    let m = B.Zero();
    const p = B.Zero(), D = W.Zero();
    s = s || W.Zero(), o = o || new W(1, 1);
    for (let v = 0; v < l.length; v += 3) {
      B.FromArrayToRef(l, v, m), B.FromArrayToRef(h, v, p), W.FromArrayToRef(g, v / 3 * 2, D);
      const u = Math.abs(D.x * o.x + s.x % 1) * (n - 1) % n | 0, x = Math.abs(D.y * o.y + s.y % 1) * (i - 1) % i | 0, _ = (u + x * n) * 4, A = e[_] / 255, y = e[_ + 1] / 255, I = e[_ + 2] / 255, c = A * 0.3 + y * 0.59 + I * 0.11;
      p.normalize(), p.scaleInPlace(t + (r - t) * c), m = m.add(p), m.toArray(l, v);
    }
    return P.ComputeNormals(l, this.getIndices(), h), a ? (this.setVerticesData(f.PositionKind, l), this.setVerticesData(f.NormalKind, h), this.setVerticesData(f.UVKind, g)) : (this.updateVerticesData(f.PositionKind, l), this.updateVerticesData(f.NormalKind, h)), this;
  }
  _getFlattenedNormals(e, n) {
    const i = new Float32Array(e.length * 3);
    let t = 0;
    const r = this.overrideMaterialSideOrientation === (this._scene.useRightHandedSystem ? 1 : 0);
    for (let s = 0; s < e.length; s += 3) {
      const o = B.FromArray(n, e[s] * 3), a = B.FromArray(n, e[s + 1] * 3), l = B.FromArray(n, e[s + 2] * 3), h = o.subtract(a), g = l.subtract(a), m = B.Normalize(B.Cross(h, g));
      r && m.scaleInPlace(-1);
      for (let p = 0; p < 3; p++)
        i[t++] = m.x, i[t++] = m.y, i[t++] = m.z;
    }
    return i;
  }
  _convertToUnIndexedMesh(e = !1) {
    const n = this.getVerticesDataKinds(), i = this.getIndices(), t = {}, r = (o, a) => {
      const l = new Float32Array(i.length * a);
      let h = 0;
      for (let g = 0; g < i.length; g++)
        for (let m = 0; m < a; m++)
          l[h++] = o[i[g] * a + m];
      return l;
    }, s = this.geometry ? this.subMeshes.slice(0) : [];
    for (const o of n)
      t[o] = this.getVerticesData(o);
    for (const o of n) {
      const a = this.getVertexBuffer(o), l = a.getStrideSize();
      if (e && o === f.NormalKind) {
        const h = this._getFlattenedNormals(i, t[f.PositionKind]);
        this.setVerticesData(f.NormalKind, h, a.isUpdatable(), l);
      } else
        this.setVerticesData(o, r(t[o], l), a.isUpdatable(), l);
    }
    if (this.morphTargetManager) {
      for (let o = 0; o < this.morphTargetManager.numTargets; o++) {
        const a = this.morphTargetManager.getTarget(o), l = a.getPositions();
        a.setPositions(r(l, 3));
        const h = a.getNormals();
        h && a.setNormals(e ? this._getFlattenedNormals(i, l) : r(h, 3));
        const g = a.getTangents();
        g && a.setTangents(r(g, 3));
        const m = a.getUVs();
        m && a.setUVs(r(m, 2));
      }
      this.morphTargetManager.synchronize();
    }
    for (let o = 0; o < i.length; o++)
      i[o] = o;
    this.setIndices(i), this._unIndexed = !0, this.releaseSubMeshes();
    for (const o of s)
      k.AddToMesh(o.materialIndex, o.indexStart, o.indexCount, o.indexStart, o.indexCount, this);
    return this.synchronizeInstances(), this;
  }
  /**
   * Modify the mesh to get a flat shading rendering.
   * This means each mesh facet will then have its own normals. Usually new vertices are added in the mesh geometry to get this result.
   * Warning : the mesh is really modified even if not set originally as updatable and, under the hood, a new VertexBuffer is allocated.
   * @returns current mesh
   */
  convertToFlatShadedMesh() {
    return this._convertToUnIndexedMesh(!0);
  }
  /**
   * This method removes all the mesh indices and add new vertices (duplication) in order to unfold facets into buffers.
   * In other words, more vertices, no more indices and a single bigger VBO.
   * The mesh is really modified even if not set originally as updatable. Under the hood, a new VertexBuffer is allocated.
   * @returns current mesh
   */
  convertToUnIndexedMesh() {
    return this._convertToUnIndexedMesh();
  }
  /**
   * Inverses facet orientations.
   * Warning : the mesh is really modified even if not set originally as updatable. A new VertexBuffer is created under the hood each call.
   * @param flipNormals will also inverts the normals
   * @returns current mesh
   */
  flipFaces(e = !1) {
    const n = P.ExtractFromMesh(this);
    let i;
    if (e && this.isVerticesDataPresent(f.NormalKind) && n.normals)
      for (i = 0; i < n.normals.length; i++)
        n.normals[i] *= -1;
    if (n.indices) {
      let t;
      for (i = 0; i < n.indices.length; i += 3)
        t = n.indices[i + 1], n.indices[i + 1] = n.indices[i + 2], n.indices[i + 2] = t;
    }
    return n.applyToMesh(this, this.isVertexBufferUpdatable(f.PositionKind)), this;
  }
  /**
   * Increase the number of facets and hence vertices in a mesh
   * Vertex normals are interpolated from existing vertex normals
   * Warning : the mesh is really modified even if not set originally as updatable. A new VertexBuffer is created under the hood each call.
   * @param numberPerEdge the number of new vertices to add to each edge of a facet, optional default 1
   */
  increaseVertices(e = 1) {
    const n = P.ExtractFromMesh(this), i = n.indices && !Array.isArray(n.indices) && Array.from ? Array.from(n.indices) : n.indices, t = n.positions && !Array.isArray(n.positions) && Array.from ? Array.from(n.positions) : n.positions, r = n.uvs && !Array.isArray(n.uvs) && Array.from ? Array.from(n.uvs) : n.uvs, s = n.normals && !Array.isArray(n.normals) && Array.from ? Array.from(n.normals) : n.normals;
    if (!i || !t)
      V.Warn("Couldn't increase number of vertices : VertexData must contain at least indices and positions");
    else {
      n.indices = i, n.positions = t, r && (n.uvs = r), s && (n.normals = s);
      const o = e + 1, a = new Array();
      for (let I = 0; I < o + 1; I++)
        a[I] = new Array();
      let l, h;
      const g = new B(0, 0, 0), m = new B(0, 0, 0), p = new W(0, 0), D = new Array(), v = new Array(), u = new Array();
      let x, _ = t.length, A;
      r && (A = r.length);
      let y;
      s && (y = s.length);
      for (let I = 0; I < i.length; I += 3) {
        v[0] = i[I], v[1] = i[I + 1], v[2] = i[I + 2];
        for (let c = 0; c < 3; c++)
          if (l = v[c], h = v[(c + 1) % 3], u[l] === void 0 && u[h] === void 0 ? (u[l] = new Array(), u[h] = new Array()) : (u[l] === void 0 && (u[l] = new Array()), u[h] === void 0 && (u[h] = new Array())), u[l][h] === void 0 && u[h][l] === void 0) {
            u[l][h] = [], g.x = (t[3 * h] - t[3 * l]) / o, g.y = (t[3 * h + 1] - t[3 * l + 1]) / o, g.z = (t[3 * h + 2] - t[3 * l + 2]) / o, s && (m.x = (s[3 * h] - s[3 * l]) / o, m.y = (s[3 * h + 1] - s[3 * l + 1]) / o, m.z = (s[3 * h + 2] - s[3 * l + 2]) / o), r && (p.x = (r[2 * h] - r[2 * l]) / o, p.y = (r[2 * h + 1] - r[2 * l + 1]) / o), u[l][h].push(l);
            for (let d = 1; d < o; d++)
              u[l][h].push(t.length / 3), t[_++] = t[3 * l] + d * g.x, t[_++] = t[3 * l + 1] + d * g.y, t[_++] = t[3 * l + 2] + d * g.z, s && (s[y++] = s[3 * l] + d * m.x, s[y++] = s[3 * l + 1] + d * m.y, s[y++] = s[3 * l + 2] + d * m.z), r && (r[A++] = r[2 * l] + d * p.x, r[A++] = r[2 * l + 1] + d * p.y);
            u[l][h].push(h), u[h][l] = new Array(), x = u[l][h].length;
            for (let d = 0; d < x; d++)
              u[h][l][d] = u[l][h][x - 1 - d];
          }
        a[0][0] = i[I], a[1][0] = u[i[I]][i[I + 1]][1], a[1][1] = u[i[I]][i[I + 2]][1];
        for (let c = 2; c < o; c++) {
          a[c][0] = u[i[I]][i[I + 1]][c], a[c][c] = u[i[I]][i[I + 2]][c], g.x = (t[3 * a[c][c]] - t[3 * a[c][0]]) / c, g.y = (t[3 * a[c][c] + 1] - t[3 * a[c][0] + 1]) / c, g.z = (t[3 * a[c][c] + 2] - t[3 * a[c][0] + 2]) / c, s && (m.x = (s[3 * a[c][c]] - s[3 * a[c][0]]) / c, m.y = (s[3 * a[c][c] + 1] - s[3 * a[c][0] + 1]) / c, m.z = (s[3 * a[c][c] + 2] - s[3 * a[c][0] + 2]) / c), r && (p.x = (r[2 * a[c][c]] - r[2 * a[c][0]]) / c, p.y = (r[2 * a[c][c] + 1] - r[2 * a[c][0] + 1]) / c);
          for (let d = 1; d < c; d++)
            a[c][d] = t.length / 3, t[_++] = t[3 * a[c][0]] + d * g.x, t[_++] = t[3 * a[c][0] + 1] + d * g.y, t[_++] = t[3 * a[c][0] + 2] + d * g.z, s && (s[y++] = s[3 * a[c][0]] + d * m.x, s[y++] = s[3 * a[c][0] + 1] + d * m.y, s[y++] = s[3 * a[c][0] + 2] + d * m.z), r && (r[A++] = r[2 * a[c][0]] + d * p.x, r[A++] = r[2 * a[c][0] + 1] + d * p.y);
        }
        a[o] = u[i[I + 1]][i[I + 2]], D.push(a[0][0], a[1][0], a[1][1]);
        for (let c = 1; c < o; c++) {
          let d;
          for (d = 0; d < c; d++)
            D.push(a[c][d], a[c + 1][d], a[c + 1][d + 1]), D.push(a[c][d], a[c + 1][d + 1], a[c][d + 1]);
          D.push(a[c][d], a[c + 1][d], a[c + 1][d + 1]);
        }
      }
      n.indices = D, n.applyToMesh(this, this.isVertexBufferUpdatable(f.PositionKind));
    }
  }
  /**
   * Force adjacent facets to share vertices and remove any facets that have all vertices in a line
   * This will undo any application of covertToFlatShadedMesh
   * Warning : the mesh is really modified even if not set originally as updatable. A new VertexBuffer is created under the hood each call.
   */
  forceSharedVertices() {
    const e = P.ExtractFromMesh(this), n = e.uvs, i = e.indices, t = e.positions, r = e.colors, s = e.matricesIndices, o = e.matricesWeights, a = e.matricesIndicesExtra, l = e.matricesWeightsExtra;
    if (i === void 0 || t === void 0 || i === null || t === null)
      V.Warn("VertexData contains empty entries");
    else {
      const h = new Array(), g = new Array(), m = new Array(), p = new Array(), D = new Array(), v = new Array(), u = new Array(), x = new Array();
      let _ = new Array(), A = 0;
      const y = {};
      let I, c;
      for (let w = 0; w < i.length; w += 3) {
        c = [i[w], i[w + 1], i[w + 2]], _ = [];
        for (let S = 0; S < 3; S++) {
          _[S] = "";
          for (let b = 0; b < 3; b++)
            Math.abs(t[3 * c[S] + b]) < 1e-8 && (t[3 * c[S] + b] = 0), _[S] += t[3 * c[S] + b] + "|";
        }
        if (!(_[0] == _[1] || _[0] == _[2] || _[1] == _[2]))
          for (let S = 0; S < 3; S++) {
            if (I = y[_[S]], I === void 0) {
              y[_[S]] = A, I = A++;
              for (let b = 0; b < 3; b++)
                h.push(t[3 * c[S] + b]);
              if (r != null)
                for (let b = 0; b < 4; b++)
                  p.push(r[4 * c[S] + b]);
              if (n != null)
                for (let b = 0; b < 2; b++)
                  m.push(n[2 * c[S] + b]);
              if (s != null)
                for (let b = 0; b < 4; b++)
                  D.push(s[4 * c[S] + b]);
              if (o != null)
                for (let b = 0; b < 4; b++)
                  v.push(o[4 * c[S] + b]);
              if (a != null)
                for (let b = 0; b < 4; b++)
                  u.push(a[4 * c[S] + b]);
              if (l != null)
                for (let b = 0; b < 4; b++)
                  x.push(l[4 * c[S] + b]);
            }
            g.push(I);
          }
      }
      const d = new Array();
      P.ComputeNormals(h, g, d), e.positions = h, e.indices = g, e.normals = d, n != null && (e.uvs = m), r != null && (e.colors = p), s != null && (e.matricesIndices = D), o != null && (e.matricesWeights = v), a != null && (e.matricesIndicesExtra = u), o != null && (e.matricesWeightsExtra = x), e.applyToMesh(this, this.isVertexBufferUpdatable(f.PositionKind));
    }
  }
  // Instances
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention
  static _instancedMeshFactory(e, n) {
    throw R("InstancedMesh");
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static _PhysicsImpostorParser(e, n, i) {
    throw R("PhysicsImpostor");
  }
  /**
   * Creates a new InstancedMesh object from the mesh model.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances
   * @param name defines the name of the new instance
   * @returns a new InstancedMesh
   */
  createInstance(e) {
    return M._instancedMeshFactory(e, this);
  }
  /**
   * Synchronises all the mesh instance submeshes to the current mesh submeshes, if any.
   * After this call, all the mesh instances have the same submeshes than the current mesh.
   * @returns the current mesh
   */
  synchronizeInstances() {
    for (let e = 0; e < this.instances.length; e++)
      this.instances[e]._syncSubMeshes();
    return this;
  }
  /**
   * Optimization of the mesh's indices, in case a mesh has duplicated vertices.
   * The function will only reorder the indices and will not remove unused vertices to avoid problems with submeshes.
   * This should be used together with the simplification to avoid disappearing triangles.
   * @param successCallback an optional success callback to be called after the optimization finished.
   * @returns the current mesh
   */
  optimizeIndices(e) {
    const n = this.getIndices(), i = this.getVerticesData(f.PositionKind);
    if (!i || !n)
      return this;
    const t = [];
    for (let s = 0; s < i.length; s = s + 3)
      t.push(B.FromArray(i, s));
    const r = [];
    return J.SyncAsyncForLoop(t.length, 40, (s) => {
      const o = t.length - 1 - s, a = t[o];
      for (let l = 0; l < o; ++l) {
        const h = t[l];
        if (a.equals(h)) {
          r[o] = l;
          break;
        }
      }
    }, () => {
      for (let o = 0; o < n.length; ++o)
        n[o] = r[n[o]] || n[o];
      const s = this.subMeshes.slice(0);
      this.setIndices(n), this.subMeshes = s, e && e(this);
    }), this;
  }
  /**
   * Serialize current mesh
   * @param serializationObject defines the object which will receive the serialization data
   * @returns the serialized object
   */
  serialize(e = {}) {
    e.name = this.name, e.id = this.id, e.uniqueId = this.uniqueId, e.type = this.getClassName(), C && C.HasTags(this) && (e.tags = C.GetTags(this)), e.position = this.position.asArray(), this.rotationQuaternion ? e.rotationQuaternion = this.rotationQuaternion.asArray() : this.rotation && (e.rotation = this.rotation.asArray()), e.scaling = this.scaling.asArray(), this._postMultiplyPivotMatrix ? e.pivotMatrix = this.getPivotMatrix().asArray() : e.localMatrix = this.getPivotMatrix().asArray(), e.isEnabled = this.isEnabled(!1), e.isVisible = this.isVisible, e.infiniteDistance = this.infiniteDistance, e.pickable = this.isPickable, e.receiveShadows = this.receiveShadows, e.billboardMode = this.billboardMode, e.visibility = this.visibility, e.alwaysSelectAsActiveMesh = this.alwaysSelectAsActiveMesh, e.checkCollisions = this.checkCollisions, e.ellipsoid = this.ellipsoid.asArray(), e.ellipsoidOffset = this.ellipsoidOffset.asArray(), e.doNotSyncBoundingInfo = this.doNotSyncBoundingInfo, e.isBlocker = this.isBlocker, e.overrideMaterialSideOrientation = this.overrideMaterialSideOrientation, this.parent && this.parent._serializeAsParent(e), e.isUnIndexed = this.isUnIndexed;
    const n = this._geometry;
    if (n && this.subMeshes) {
      e.geometryUniqueId = n.uniqueId, e.geometryId = n.id, e.subMeshes = [];
      for (let i = 0; i < this.subMeshes.length; i++) {
        const t = this.subMeshes[i];
        e.subMeshes.push({
          materialIndex: t.materialIndex,
          verticesStart: t.verticesStart,
          verticesCount: t.verticesCount,
          indexStart: t.indexStart,
          indexCount: t.indexCount
        });
      }
    }
    if (this.material ? this.material.doNotSerialize || (e.materialUniqueId = this.material.uniqueId, e.materialId = this.material.id) : (this.material = null, e.materialUniqueId = this._scene.defaultMaterial.uniqueId, e.materialId = this._scene.defaultMaterial.id), this.morphTargetManager && (e.morphTargetManagerId = this.morphTargetManager.uniqueId), this.skeleton && (e.skeletonId = this.skeleton.id, e.numBoneInfluencers = this.numBoneInfluencers), this.getScene()._getComponent(q.NAME_PHYSICSENGINE)) {
      const i = this.getPhysicsImpostor();
      i && (e.physicsMass = i.getParam("mass"), e.physicsFriction = i.getParam("friction"), e.physicsRestitution = i.getParam("mass"), e.physicsImpostor = i.type);
    }
    this.metadata && (e.metadata = this.metadata), e.instances = [];
    for (let i = 0; i < this.instances.length; i++) {
      const t = this.instances[i];
      if (t.doNotSerialize)
        continue;
      const r = {
        name: t.name,
        id: t.id,
        isEnabled: t.isEnabled(!1),
        isVisible: t.isVisible,
        isPickable: t.isPickable,
        checkCollisions: t.checkCollisions,
        position: t.position.asArray(),
        scaling: t.scaling.asArray()
      };
      if (t.parent && t.parent._serializeAsParent(r), t.rotationQuaternion ? r.rotationQuaternion = t.rotationQuaternion.asArray() : t.rotation && (r.rotation = t.rotation.asArray()), this.getScene()._getComponent(q.NAME_PHYSICSENGINE)) {
        const s = t.getPhysicsImpostor();
        s && (r.physicsMass = s.getParam("mass"), r.physicsFriction = s.getParam("friction"), r.physicsRestitution = s.getParam("mass"), r.physicsImpostor = s.type);
      }
      t.metadata && (r.metadata = t.metadata), t.actionManager && (r.actions = t.actionManager.serialize(t.name)), e.instances.push(r), Z.AppendSerializedAnimations(t, r), r.ranges = t.serializeAnimationRanges();
    }
    if (this._thinInstanceDataStorage.instancesCount && this._thinInstanceDataStorage.matrixData && (e.thinInstances = {
      instancesCount: this._thinInstanceDataStorage.instancesCount,
      matrixData: Array.from(this._thinInstanceDataStorage.matrixData),
      matrixBufferSize: this._thinInstanceDataStorage.matrixBufferSize,
      enablePicking: this.thinInstanceEnablePicking
    }, this._userThinInstanceBuffersStorage)) {
      const i = {
        data: {},
        sizes: {},
        strides: {}
      };
      for (const t in this._userThinInstanceBuffersStorage.data)
        i.data[t] = Array.from(this._userThinInstanceBuffersStorage.data[t]), i.sizes[t] = this._userThinInstanceBuffersStorage.sizes[t], i.strides[t] = this._userThinInstanceBuffersStorage.strides[t];
      e.thinInstances.userThinInstance = i;
    }
    return Z.AppendSerializedAnimations(this, e), e.ranges = this.serializeAnimationRanges(), e.layerMask = this.layerMask, e.alphaIndex = this.alphaIndex, e.hasVertexAlpha = this.hasVertexAlpha, e.overlayAlpha = this.overlayAlpha, e.overlayColor = this.overlayColor.asArray(), e.renderOverlay = this.renderOverlay, e.applyFog = this.applyFog, this.actionManager && (e.actions = this.actionManager.serialize(this.name)), e;
  }
  /** @internal */
  _syncGeometryWithMorphTargetManager() {
    if (!this.geometry)
      return;
    this._markSubMeshesAsAttributesDirty();
    const e = this._internalAbstractMeshDataInfo._morphTargetManager;
    if (e && e.vertexCount) {
      if (e.vertexCount !== this.getTotalVertices()) {
        V.Error("Mesh is incompatible with morph targets. Targets and mesh must all have the same vertices count."), this.morphTargetManager = null;
        return;
      }
      if (e.isUsingTextureForTargets)
        return;
      for (let n = 0; n < e.numInfluencers; n++) {
        const i = e.getActiveTarget(n), t = i.getPositions();
        if (!t) {
          V.Error("Invalid morph target. Target must have positions.");
          return;
        }
        this.geometry.setVerticesData(f.PositionKind + n, t, !1, 3);
        const r = i.getNormals();
        r && this.geometry.setVerticesData(f.NormalKind + n, r, !1, 3);
        const s = i.getTangents();
        s && this.geometry.setVerticesData(f.TangentKind + n, s, !1, 3);
        const o = i.getUVs();
        o && this.geometry.setVerticesData(f.UVKind + "_" + n, o, !1, 2);
      }
    } else {
      let n = 0;
      for (; this.geometry.isVerticesDataPresent(f.PositionKind + n); )
        this.geometry.removeVerticesData(f.PositionKind + n), this.geometry.isVerticesDataPresent(f.NormalKind + n) && this.geometry.removeVerticesData(f.NormalKind + n), this.geometry.isVerticesDataPresent(f.TangentKind + n) && this.geometry.removeVerticesData(f.TangentKind + n), this.geometry.isVerticesDataPresent(f.UVKind + n) && this.geometry.removeVerticesData(f.UVKind + "_" + n), n++;
    }
  }
  /**
   * Returns a new Mesh object parsed from the source provided.
   * @param parsedMesh is the source
   * @param scene defines the hosting scene
   * @param rootUrl is the root URL to prefix the `delayLoadingFile` property with
   * @returns a new Mesh
   */
  static Parse(e, n, i) {
    let t;
    if (e.type && e.type === "LinesMesh" ? t = M._LinesMeshParser(e, n) : e.type && e.type === "GroundMesh" ? t = M._GroundMeshParser(e, n) : e.type && e.type === "GoldbergMesh" ? t = M._GoldbergMeshParser(e, n) : e.type && e.type === "GreasedLineMesh" ? t = M._GreasedLineMeshParser(e, n) : e.type && e.type === "TrailMesh" ? t = M._TrailMeshParser(e, n) : t = new M(e.name, n), t.id = e.id, t._waitingParsedUniqueId = e.uniqueId, C && C.AddTagsTo(t, e.tags), t.position = B.FromArray(e.position), e.metadata !== void 0 && (t.metadata = e.metadata), e.rotationQuaternion ? t.rotationQuaternion = z.FromArray(e.rotationQuaternion) : e.rotation && (t.rotation = B.FromArray(e.rotation)), t.scaling = B.FromArray(e.scaling), e.localMatrix ? t.setPreTransformMatrix(E.FromArray(e.localMatrix)) : e.pivotMatrix && t.setPivotMatrix(E.FromArray(e.pivotMatrix)), t.setEnabled(e.isEnabled), t.isVisible = e.isVisible, t.infiniteDistance = e.infiniteDistance, t.alwaysSelectAsActiveMesh = !!e.alwaysSelectAsActiveMesh, t.showBoundingBox = e.showBoundingBox, t.showSubMeshesBoundingBox = e.showSubMeshesBoundingBox, e.applyFog !== void 0 && (t.applyFog = e.applyFog), e.pickable !== void 0 && (t.isPickable = e.pickable), e.alphaIndex !== void 0 && (t.alphaIndex = e.alphaIndex), t.receiveShadows = e.receiveShadows, e.billboardMode !== void 0 && (t.billboardMode = e.billboardMode), e.visibility !== void 0 && (t.visibility = e.visibility), t.checkCollisions = e.checkCollisions, t.doNotSyncBoundingInfo = !!e.doNotSyncBoundingInfo, e.ellipsoid && (t.ellipsoid = B.FromArray(e.ellipsoid)), e.ellipsoidOffset && (t.ellipsoidOffset = B.FromArray(e.ellipsoidOffset)), e.overrideMaterialSideOrientation !== void 0 && (t.overrideMaterialSideOrientation = e.overrideMaterialSideOrientation), e.isBlocker !== void 0 && (t.isBlocker = e.isBlocker), t._shouldGenerateFlatShading = e.useFlatShading, e.freezeWorldMatrix && (t._waitingData.freezeWorldMatrix = e.freezeWorldMatrix), e.parentId !== void 0 && (t._waitingParentId = e.parentId), e.parentInstanceIndex !== void 0 && (t._waitingParentInstanceIndex = e.parentInstanceIndex), e.actions !== void 0 && (t._waitingData.actions = e.actions), e.overlayAlpha !== void 0 && (t.overlayAlpha = e.overlayAlpha), e.overlayColor !== void 0 && (t.overlayColor = X.FromArray(e.overlayColor)), e.renderOverlay !== void 0 && (t.renderOverlay = e.renderOverlay), t.isUnIndexed = !!e.isUnIndexed, t.hasVertexAlpha = e.hasVertexAlpha, e.delayLoadingFile ? (t.delayLoadState = 4, t.delayLoadingFile = i + e.delayLoadingFile, t.buildBoundingInfo(B.FromArray(e.boundingBoxMinimum), B.FromArray(e.boundingBoxMaximum)), e._binaryInfo && (t._binaryInfo = e._binaryInfo), t._delayInfo = [], e.hasUVs && t._delayInfo.push(f.UVKind), e.hasUVs2 && t._delayInfo.push(f.UV2Kind), e.hasUVs3 && t._delayInfo.push(f.UV3Kind), e.hasUVs4 && t._delayInfo.push(f.UV4Kind), e.hasUVs5 && t._delayInfo.push(f.UV5Kind), e.hasUVs6 && t._delayInfo.push(f.UV6Kind), e.hasColors && t._delayInfo.push(f.ColorKind), e.hasMatricesIndices && t._delayInfo.push(f.MatricesIndicesKind), e.hasMatricesWeights && t._delayInfo.push(f.MatricesWeightsKind), t._delayLoadingFunction = F._ImportGeometry, $.ForceFullSceneLoadingForIncremental && t._checkDelayState()) : F._ImportGeometry(e, t), e.materialUniqueId ? t._waitingMaterialId = e.materialUniqueId : e.materialId && (t._waitingMaterialId = e.materialId), e.morphTargetManagerId > -1 && (t.morphTargetManager = n.getMorphTargetManagerById(e.morphTargetManagerId)), e.skeletonId !== void 0 && e.skeletonId !== null && (t.skeleton = n.getLastSkeletonById(e.skeletonId), e.numBoneInfluencers && (t.numBoneInfluencers = e.numBoneInfluencers)), e.animations) {
      for (let r = 0; r < e.animations.length; r++) {
        const s = e.animations[r], o = G("BABYLON.Animation");
        o && t.animations.push(o.Parse(s));
      }
      H.ParseAnimationRanges(t, e, n);
    }
    if (e.autoAnimate && n.beginAnimation(t, e.autoAnimateFrom, e.autoAnimateTo, e.autoAnimateLoop, e.autoAnimateSpeed || 1), e.layerMask && !isNaN(e.layerMask) ? t.layerMask = Math.abs(parseInt(e.layerMask)) : t.layerMask = 268435455, e.physicsImpostor && M._PhysicsImpostorParser(n, t, e), e.lodMeshIds && (t._waitingData.lods = {
      ids: e.lodMeshIds,
      distances: e.lodDistances ? e.lodDistances : null,
      coverages: e.lodCoverages ? e.lodCoverages : null
    }), e.instances)
      for (let r = 0; r < e.instances.length; r++) {
        const s = e.instances[r], o = t.createInstance(s.name);
        if (s.id && (o.id = s.id), C && (s.tags ? C.AddTagsTo(o, s.tags) : C.AddTagsTo(o, e.tags)), o.position = B.FromArray(s.position), s.metadata !== void 0 && (o.metadata = s.metadata), s.parentId !== void 0 && (o._waitingParentId = s.parentId), s.parentInstanceIndex !== void 0 && (o._waitingParentInstanceIndex = s.parentInstanceIndex), s.isEnabled !== void 0 && s.isEnabled !== null && o.setEnabled(s.isEnabled), s.isVisible !== void 0 && s.isVisible !== null && (o.isVisible = s.isVisible), s.isPickable !== void 0 && s.isPickable !== null && (o.isPickable = s.isPickable), s.rotationQuaternion ? o.rotationQuaternion = z.FromArray(s.rotationQuaternion) : s.rotation && (o.rotation = B.FromArray(s.rotation)), o.scaling = B.FromArray(s.scaling), s.checkCollisions != null && s.checkCollisions != null && (o.checkCollisions = s.checkCollisions), s.pickable != null && s.pickable != null && (o.isPickable = s.pickable), s.showBoundingBox != null && s.showBoundingBox != null && (o.showBoundingBox = s.showBoundingBox), s.showSubMeshesBoundingBox != null && s.showSubMeshesBoundingBox != null && (o.showSubMeshesBoundingBox = s.showSubMeshesBoundingBox), s.alphaIndex != null && s.showSubMeshesBoundingBox != null && (o.alphaIndex = s.alphaIndex), s.physicsImpostor && M._PhysicsImpostorParser(n, o, s), s.actions !== void 0 && (o._waitingData.actions = s.actions), s.animations) {
          for (let a = 0; a < s.animations.length; a++) {
            const l = s.animations[a], h = G("BABYLON.Animation");
            h && o.animations.push(h.Parse(l));
          }
          H.ParseAnimationRanges(o, s, n), s.autoAnimate && n.beginAnimation(o, s.autoAnimateFrom, s.autoAnimateTo, s.autoAnimateLoop, s.autoAnimateSpeed || 1);
        }
      }
    if (e.thinInstances) {
      const r = e.thinInstances;
      if (t.thinInstanceEnablePicking = !!r.enablePicking, r.matrixData ? (t.thinInstanceSetBuffer("matrix", new Float32Array(r.matrixData), 16, !1), t._thinInstanceDataStorage.matrixBufferSize = r.matrixBufferSize, t._thinInstanceDataStorage.instancesCount = r.instancesCount) : t._thinInstanceDataStorage.matrixBufferSize = r.matrixBufferSize, e.thinInstances.userThinInstance) {
        const s = e.thinInstances.userThinInstance;
        for (const o in s.data)
          t.thinInstanceSetBuffer(o, new Float32Array(s.data[o]), s.strides[o], !1), t._userThinInstanceBuffersStorage.sizes[o] = s.sizes[o];
      }
    }
    return t;
  }
  // Skeletons
  /**
   * Prepare internal position array for software CPU skinning
   * @returns original positions used for CPU skinning. Useful for integrating Morphing with skeletons in same mesh
   */
  setPositionsForCPUSkinning() {
    const e = this._internalMeshDataInfo;
    if (!e._sourcePositions) {
      const n = this.getVerticesData(f.PositionKind);
      if (!n)
        return e._sourcePositions;
      e._sourcePositions = new Float32Array(n), this.isVertexBufferUpdatable(f.PositionKind) || this.setVerticesData(f.PositionKind, n, !0);
    }
    return e._sourcePositions;
  }
  /**
   * Prepare internal normal array for software CPU skinning
   * @returns original normals used for CPU skinning. Useful for integrating Morphing with skeletons in same mesh.
   */
  setNormalsForCPUSkinning() {
    const e = this._internalMeshDataInfo;
    if (!e._sourceNormals) {
      const n = this.getVerticesData(f.NormalKind);
      if (!n)
        return e._sourceNormals;
      e._sourceNormals = new Float32Array(n), this.isVertexBufferUpdatable(f.NormalKind) || this.setVerticesData(f.NormalKind, n, !0);
    }
    return e._sourceNormals;
  }
  /**
   * Updates the vertex buffer by applying transformation from the bones
   * @param skeleton defines the skeleton to apply to current mesh
   * @returns the current mesh
   */
  applySkeleton(e) {
    if (!this.geometry)
      return this;
    if (this.geometry._softwareSkinningFrameId == this.getScene().getFrameId())
      return this;
    if (this.geometry._softwareSkinningFrameId = this.getScene().getFrameId(), !this.isVerticesDataPresent(f.PositionKind))
      return this;
    if (!this.isVerticesDataPresent(f.MatricesIndicesKind))
      return this;
    if (!this.isVerticesDataPresent(f.MatricesWeightsKind))
      return this;
    const n = this.isVerticesDataPresent(f.NormalKind), i = this._internalMeshDataInfo;
    if (!i._sourcePositions) {
      const x = this.subMeshes.slice();
      this.setPositionsForCPUSkinning(), this.subMeshes = x;
    }
    n && !i._sourceNormals && this.setNormalsForCPUSkinning();
    let t = this.getVerticesData(f.PositionKind);
    if (!t)
      return this;
    t instanceof Float32Array || (t = new Float32Array(t));
    let r = this.getVerticesData(f.NormalKind);
    if (n) {
      if (!r)
        return this;
      r instanceof Float32Array || (r = new Float32Array(r));
    }
    const s = this.getVerticesData(f.MatricesIndicesKind), o = this.getVerticesData(f.MatricesWeightsKind);
    if (!o || !s)
      return this;
    const a = this.numBoneInfluencers > 4, l = a ? this.getVerticesData(f.MatricesIndicesExtraKind) : null, h = a ? this.getVerticesData(f.MatricesWeightsExtraKind) : null, g = e.getTransformMatrices(this), m = B.Zero(), p = new E(), D = new E();
    let v = 0, u;
    for (let x = 0; x < t.length; x += 3, v += 4) {
      let _;
      for (u = 0; u < 4; u++)
        _ = o[v + u], _ > 0 && (E.FromFloat32ArrayToRefScaled(g, Math.floor(s[v + u] * 16), _, D), p.addToSelf(D));
      if (a)
        for (u = 0; u < 4; u++)
          _ = h[v + u], _ > 0 && (E.FromFloat32ArrayToRefScaled(g, Math.floor(l[v + u] * 16), _, D), p.addToSelf(D));
      B.TransformCoordinatesFromFloatsToRef(i._sourcePositions[x], i._sourcePositions[x + 1], i._sourcePositions[x + 2], p, m), m.toArray(t, x), n && (B.TransformNormalFromFloatsToRef(i._sourceNormals[x], i._sourceNormals[x + 1], i._sourceNormals[x + 2], p, m), m.toArray(r, x)), p.reset();
    }
    return this.updateVerticesData(f.PositionKind, t), n && this.updateVerticesData(f.NormalKind, r), this;
  }
  // Tools
  /**
   * Returns an object containing a min and max Vector3 which are the minimum and maximum vectors of each mesh bounding box from the passed array, in the world coordinates
   * @param meshes defines the list of meshes to scan
   * @returns an object `{min:` Vector3`, max:` Vector3`}`
   */
  static MinMax(e) {
    let n = null, i = null;
    return e.forEach(function(t) {
      const s = t.getBoundingInfo().boundingBox;
      !n || !i ? (n = s.minimumWorld, i = s.maximumWorld) : (n.minimizeInPlace(s.minimumWorld), i.maximizeInPlace(s.maximumWorld));
    }), !n || !i ? {
      min: B.Zero(),
      max: B.Zero()
    } : {
      min: n,
      max: i
    };
  }
  /**
   * Returns the center of the `{min:` Vector3`, max:` Vector3`}` or the center of MinMax vector3 computed from a mesh array
   * @param meshesOrMinMaxVector could be an array of meshes or a `{min:` Vector3`, max:` Vector3`}` object
   * @returns a vector3
   */
  static Center(e) {
    const n = e instanceof Array ? M.MinMax(e) : e;
    return B.Center(n.min, n.max);
  }
  /**
   * Merge the array of meshes into a single mesh for performance reasons.
   * @param meshes array of meshes with the vertices to merge. Entries cannot be empty meshes.
   * @param disposeSource when true (default), dispose of the vertices from the source meshes.
   * @param allow32BitsIndices when the sum of the vertices > 64k, this must be set to true.
   * @param meshSubclass (optional) can be set to a Mesh where the merged vertices will be inserted.
   * @param subdivideWithSubMeshes when true (false default), subdivide mesh into subMeshes.
   * @param multiMultiMaterials when true (false default), subdivide mesh into subMeshes with multiple materials, ignores subdivideWithSubMeshes.
   * @returns a new mesh
   */
  static MergeMeshes(e, n = !0, i, t, r, s) {
    return j(M._MergeMeshesCoroutine(e, n, i, t, r, s, !1));
  }
  /**
   * Merge the array of meshes into a single mesh for performance reasons.
   * @param meshes array of meshes with the vertices to merge. Entries cannot be empty meshes.
   * @param disposeSource when true (default), dispose of the vertices from the source meshes.
   * @param allow32BitsIndices when the sum of the vertices > 64k, this must be set to true.
   * @param meshSubclass (optional) can be set to a Mesh where the merged vertices will be inserted.
   * @param subdivideWithSubMeshes when true (false default), subdivide mesh into subMeshes.
   * @param multiMultiMaterials when true (false default), subdivide mesh into subMeshes with multiple materials, ignores subdivideWithSubMeshes.
   * @returns a new mesh
   */
  static MergeMeshesAsync(e, n = !0, i, t, r, s) {
    return ee(M._MergeMeshesCoroutine(e, n, i, t, r, s, !0), te());
  }
  static *_MergeMeshesCoroutine(e, n = !0, i, t, r, s, o) {
    if (e = e.filter(Boolean), e.length === 0)
      return null;
    let a;
    if (!i) {
      let d = 0;
      for (a = 0; a < e.length; a++)
        if (d += e[a].getTotalVertices(), d >= 65536)
          return V.Warn("Cannot merge meshes because resulting mesh will have more than 65536 vertices. Please use allow32BitsIndices = true to use 32 bits indices"), null;
    }
    s && (r = !1);
    const l = new Array(), h = new Array(), g = new Array(), m = e[0].overrideMaterialSideOrientation;
    for (a = 0; a < e.length; a++) {
      const d = e[a];
      if (d.isAnInstance)
        return V.Warn("Cannot merge instance meshes."), null;
      if (m !== d.overrideMaterialSideOrientation)
        return V.Warn("Cannot merge meshes with different overrideMaterialSideOrientation values."), null;
      if (r && g.push(d.getTotalIndices()), s)
        if (d.material) {
          const w = d.material;
          if (w instanceof Q) {
            for (let S = 0; S < w.subMaterials.length; S++)
              l.indexOf(w.subMaterials[S]) < 0 && l.push(w.subMaterials[S]);
            for (let S = 0; S < d.subMeshes.length; S++)
              h.push(l.indexOf(w.subMaterials[d.subMeshes[S].materialIndex])), g.push(d.subMeshes[S].indexCount);
          } else {
            l.indexOf(w) < 0 && l.push(w);
            for (let S = 0; S < d.subMeshes.length; S++)
              h.push(l.indexOf(w)), g.push(d.subMeshes[S].indexCount);
          }
        } else
          for (let w = 0; w < d.subMeshes.length; w++)
            h.push(0), g.push(d.subMeshes[w].indexCount);
    }
    const p = e[0], D = (d) => {
      const w = d.computeWorldMatrix(!0);
      return { vertexData: P.ExtractFromMesh(d, !1, !1), transform: w };
    }, { vertexData: v, transform: u } = D(p);
    o && (yield);
    const x = new Array(e.length - 1);
    for (let d = 1; d < e.length; d++)
      x[d - 1] = D(e[d]), o && (yield);
    const _ = v._mergeCoroutine(u, x, i, o, !n);
    let A = _.next();
    for (; !A.done; )
      o && (yield), A = _.next();
    const y = A.value;
    t || (t = new M(p.name + "_merged", p.getScene()));
    const I = y._applyToCoroutine(t, void 0, o);
    let c = I.next();
    for (; !c.done; )
      o && (yield), c = I.next();
    if (t.checkCollisions = p.checkCollisions, t.overrideMaterialSideOrientation = p.overrideMaterialSideOrientation, n)
      for (a = 0; a < e.length; a++)
        e[a].dispose();
    if (r || s) {
      t.releaseSubMeshes(), a = 0;
      let d = 0;
      for (; a < g.length; )
        k.CreateFromIndices(0, d, g[a], t, void 0, !1), d += g[a], a++;
      for (const w of t.subMeshes)
        w.refreshBoundingInfo();
      t.computeWorldMatrix(!0);
    }
    if (s) {
      const d = new Q(p.name + "_merged", p.getScene());
      d.subMaterials = l;
      for (let w = 0; w < t.subMeshes.length; w++)
        t.subMeshes[w].materialIndex = h[w];
      t.material = d;
    } else
      t.material = p.material;
    return t;
  }
  /**
   * @internal
   */
  addInstance(e) {
    e._indexInSourceMeshInstanceArray = this.instances.length, this.instances.push(e);
  }
  /**
   * @internal
   */
  removeInstance(e) {
    const n = e._indexInSourceMeshInstanceArray;
    if (n != -1) {
      if (n !== this.instances.length - 1) {
        const i = this.instances[this.instances.length - 1];
        this.instances[n] = i, i._indexInSourceMeshInstanceArray = n;
      }
      e._indexInSourceMeshInstanceArray = -1, this.instances.pop();
    }
  }
  /** @internal */
  _shouldConvertRHS() {
    return this.overrideMaterialSideOrientation === O.CounterClockWiseSideOrientation;
  }
  /** @internal */
  _getRenderingFillMode(e) {
    const n = this.getScene();
    return n.forcePointsCloud ? O.PointFillMode : n.forceWireframe ? O.WireFrameFillMode : this.overrideRenderingFillMode ?? e;
  }
  // deprecated methods
  /**
   * Sets the mesh material by the material or multiMaterial `id` property
   * @param id is a string identifying the material or the multiMaterial
   * @returns the current mesh
   * @deprecated Please use MeshBuilder instead Please use setMaterialById instead
   */
  setMaterialByID(e) {
    return this.setMaterialById(e);
  }
  /**
   * Creates a ribbon mesh.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param
   * @param name defines the name of the mesh to create
   * @param pathArray is a required array of paths, what are each an array of successive Vector3. The pathArray parameter depicts the ribbon geometry.
   * @param closeArray creates a seam between the first and the last paths of the path array (default is false)
   * @param closePath creates a seam between the first and the last points of each path of the path array
   * @param offset is taken in account only if the `pathArray` is containing a single path
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @param instance defines an instance of an existing Ribbon object to be updated with the passed `pathArray` parameter (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#ribbon)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateRibbon(e, n, i, t, r, s, o, a, l) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a plane polygonal mesh.  By default, this is a disc.
   * @param name defines the name of the mesh to create
   * @param radius sets the radius size (float) of the polygon (default 0.5)
   * @param tessellation sets the number of polygon sides (positive integer, default 64). So a tessellation valued to 3 will build a triangle, to 4 a square, etc
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateDisc(e, n, i, t, r, s) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a box mesh.
   * @param name defines the name of the mesh to create
   * @param size sets the size (float) of each box side (default 1)
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateBox(e, n, i, t, r) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a sphere mesh.
   * @param name defines the name of the mesh to create
   * @param segments sets the sphere number of horizontal stripes (positive integer, default 32)
   * @param diameter sets the diameter size (float) of the sphere (default 1)
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateSphere(e, n, i, t, r, s) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a hemisphere mesh.
   * @param name defines the name of the mesh to create
   * @param segments sets the sphere number of horizontal stripes (positive integer, default 32)
   * @param diameter sets the diameter size (float) of the sphere (default 1)
   * @param scene defines the hosting scene
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateHemisphere(e, n, i, t) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a cylinder or a cone mesh.
   * @param name defines the name of the mesh to create
   * @param height sets the height size (float) of the cylinder/cone (float, default 2)
   * @param diameterTop set the top cap diameter (floats, default 1)
   * @param diameterBottom set the bottom cap diameter (floats, default 1). This value can't be zero
   * @param tessellation sets the number of cylinder sides (positive integer, default 24). Set it to 3 to get a prism for instance
   * @param subdivisions sets the number of rings along the cylinder height (positive integer, default 1)
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateCylinder(e, n, i, t, r, s, o, a, l) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  // Torus  (Code from SharpDX.org)
  /**
   * Creates a torus mesh.
   * @param name defines the name of the mesh to create
   * @param diameter sets the diameter size (float) of the torus (default 1)
   * @param thickness sets the diameter size of the tube of the torus (float, default 0.5)
   * @param tessellation sets the number of torus sides (positive integer, default 16)
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateTorus(e, n, i, t, r, s, o) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a torus knot mesh.
   * @param name defines the name of the mesh to create
   * @param radius sets the global radius size (float) of the torus knot (default 2)
   * @param tube sets the diameter size of the tube of the torus (float, default 0.5)
   * @param radialSegments sets the number of sides on each tube segments (positive integer, default 32)
   * @param tubularSegments sets the number of tubes to decompose the knot into (positive integer, default 32)
   * @param p the number of windings on X axis (positive integers, default 2)
   * @param q the number of windings on Y axis (positive integers, default 3)
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateTorusKnot(e, n, i, t, r, s, o, a, l, h) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a line mesh..
   * @param name defines the name of the mesh to create
   * @param points is an array successive Vector3
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param instance is an instance of an existing LineMesh object to be updated with the passed `points` parameter (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#lines-and-dashedlines).
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateLines(e, n, i, t, r) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a dashed line mesh.
   * @param name defines the name of the mesh to create
   * @param points is an array successive Vector3
   * @param dashSize is the size of the dashes relatively the dash number (positive float, default 3)
   * @param gapSize is the size of the gap between two successive dashes relatively the dash number (positive float, default 1)
   * @param dashNb is the intended total number of dashes (positive integer, default 200)
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param instance is an instance of an existing LineMesh object to be updated with the passed `points` parameter (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#lines-and-dashedlines)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateDashedLines(e, n, i, t, r, s, o, a) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a polygon mesh.Please consider using the same method from the MeshBuilder class instead
   * The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh.
   * The parameter `shape` is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors.
   * You can set the mesh side orientation with the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
   * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
   * Remember you can only change the shape positions, not their number when updating a polygon.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#non-regular-polygon
   * @param name defines the name of the mesh to create
   * @param shape is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors
   * @param scene defines the hosting scene
   * @param holes is a required array of arrays of successive Vector3 used to defines holes in the polygon
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @param earcutInjection can be used to inject your own earcut reference
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreatePolygon(e, n, i, t, r, s, o) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates an extruded polygon mesh, with depth in the Y direction..
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#extruded-non-regular-polygon
   * @param name defines the name of the mesh to create
   * @param shape is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors
   * @param depth defines the height of extrusion
   * @param scene defines the hosting scene
   * @param holes is a required array of arrays of successive Vector3 used to defines holes in the polygon
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @param earcutInjection can be used to inject your own earcut reference
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static ExtrudePolygon(e, n, i, t, r, s, o, a) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates an extruded shape mesh.
   * The extrusion is a parametric shape. It has no predefined shape. Its final shape will depend on the input parameters.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#extruded-shapes
   * @param name defines the name of the mesh to create
   * @param shape is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be extruded along the Z axis
   * @param path is a required array of successive Vector3. This is the axis curve the shape is extruded along
   * @param scale is the value to scale the shape
   * @param rotation is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve
   * @param cap sets the way the extruded shape is capped. Possible values : Mesh.NO_CAP (default), Mesh.CAP_START, Mesh.CAP_END, Mesh.CAP_ALL
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @param instance is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#extruded-shape)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static ExtrudeShape(e, n, i, t, r, s, o, a, l, h) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates an custom extruded shape mesh.
   * The custom extrusion is a parametric shape.
   * It has no predefined shape. Its final shape will depend on the input parameters.
   *
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#extruded-shapes
   * @param name defines the name of the mesh to create
   * @param shape is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be extruded along the Z axis
   * @param path is a required array of successive Vector3. This is the axis curve the shape is extruded along
   * @param scaleFunction is a custom Javascript function called on each path point
   * @param rotationFunction is a custom Javascript function called on each path point
   * @param ribbonCloseArray forces the extrusion underlying ribbon to close all the paths in its `pathArray`
   * @param ribbonClosePath forces the extrusion underlying ribbon to close its `pathArray`
   * @param cap sets the way the extruded shape is capped. Possible values : Mesh.NO_CAP (default), Mesh.CAP_START, Mesh.CAP_END, Mesh.CAP_ALL
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @param instance is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters (https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph#extruded-shape)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static ExtrudeShapeCustom(e, n, i, t, r, s, o, a, l, h, g, m) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates lathe mesh.
   * The lathe is a shape with a symmetry axis : a 2D model shape is rotated around this axis to design the lathe.
   * @param name defines the name of the mesh to create
   * @param shape is a required array of successive Vector3. This array depicts the shape to be rotated in its local space : the shape must be designed in the xOy plane and will be rotated around the Y axis. It's usually a 2D shape, so the Vector3 z coordinates are often set to zero
   * @param radius is the radius value of the lathe
   * @param tessellation is the side number of the lathe.
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateLathe(e, n, i, t, r, s, o) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a plane mesh.
   * @param name defines the name of the mesh to create
   * @param size sets the size (float) of both sides of the plane at once (default 1)
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreatePlane(e, n, i, t, r) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a ground mesh.
   * @param name defines the name of the mesh to create
   * @param width set the width of the ground
   * @param height set the height of the ground
   * @param subdivisions sets the number of subdivisions per side
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateGround(e, n, i, t, r, s) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a tiled ground mesh.
   * @param name defines the name of the mesh to create
   * @param xmin set the ground minimum X coordinate
   * @param zmin set the ground minimum Y coordinate
   * @param xmax set the ground maximum X coordinate
   * @param zmax set the ground maximum Z coordinate
   * @param subdivisions is an object `{w: positive integer, h: positive integer}` (default `{w: 6, h: 6}`). `w` and `h` are the numbers of subdivisions on the ground width and height. Each subdivision is called a tile
   * @param precision is an object `{w: positive integer, h: positive integer}` (default `{w: 2, h: 2}`). `w` and `h` are the numbers of subdivisions on the ground width and height of each tile
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateTiledGround(e, n, i, t, r, s, o, a, l) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a ground mesh from a height map.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set/height_map
   * @param name defines the name of the mesh to create
   * @param url sets the URL of the height map image resource
   * @param width set the ground width size
   * @param height set the ground height size
   * @param subdivisions sets the number of subdivision per side
   * @param minHeight is the minimum altitude on the ground
   * @param maxHeight is the maximum altitude on the ground
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param onReady  is a callback function that will be called  once the mesh is built (the height map download can last some time)
   * @param alphaFilter will filter any data where the alpha channel is below this value, defaults 0 (all data visible)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateGroundFromHeightMap(e, n, i, t, r, s, o, a, l, h, g) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a tube mesh.
   * The tube is a parametric shape.
   * It has no predefined shape. Its final shape will depend on the input parameters.
   *
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param
   * @param name defines the name of the mesh to create
   * @param path is a required array of successive Vector3. It is the curve used as the axis of the tube
   * @param radius sets the tube radius size
   * @param tessellation is the number of sides on the tubular surface
   * @param radiusFunction is a custom function. If it is not null, it overrides the parameter `radius`. This function is called on each point of the tube path and is passed the index `i` of the i-th point and the distance of this point from the first point of the path
   * @param cap sets the way the extruded shape is capped. Possible values : Mesh.NO_CAP (default), Mesh.CAP_START, Mesh.CAP_END, Mesh.CAP_ALL
   * @param scene defines the hosting scene
   * @param updatable defines if the mesh must be flagged as updatable
   * @param sideOrientation defines the mesh side orientation (https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation)
   * @param instance is an instance of an existing Tube object to be updated with the passed `pathArray` parameter (https://doc.babylonjs.com/how_to/How_to_dynamically_morph_a_mesh#tube)
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateTube(e, n, i, t, r, s, o, a, l, h) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a polyhedron mesh.
   *.
   * * The parameter `type` (positive integer, max 14, default 0) sets the polyhedron type to build among the 15 embedded types. Please refer to the type sheet in the tutorial to choose the wanted type
   * * The parameter `size` (positive float, default 1) sets the polygon size
   * * You can overwrite the `size` on each dimension bu using the parameters `sizeX`, `sizeY` or `sizeZ` (positive floats, default to `size` value)
   * * You can build other polyhedron types than the 15 embbeded ones by setting the parameter `custom` (`polyhedronObject`, default null). If you set the parameter `custom`, this overwrittes the parameter `type`
   * * A `polyhedronObject` is a formatted javascript object. You'll find a full file with pre-set polyhedra here : https://github.com/BabylonJS/Extensions/tree/master/Polyhedron
   * * You can set the color and the UV of each side of the polyhedron with the parameters `faceColors` (Color4, default `(1, 1, 1, 1)`) and faceUV (Vector4, default `(0, 0, 1, 1)`)
   * * To understand how to set `faceUV` or `faceColors`, please read this by considering the right number of faces of your polyhedron, instead of only 6 for the box : https://doc.babylonjs.com/features/featuresDeepDive/materials/using/texturePerBoxFace
   * * The parameter `flat` (boolean, default true). If set to false, it gives the polyhedron a single global face, so less vertices and shared normals. In this case, `faceColors` and `faceUV` are ignored
   * * You can also set the mesh side orientation with the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
   * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
   * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
   * @param name defines the name of the mesh to create
   * @param options defines the options used to create the mesh
   * @param scene defines the hosting scene
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreatePolyhedron(e, n, i) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a sphere based upon an icosahedron with 20 triangular faces which can be subdivided
   * * The parameter `radius` sets the radius size (float) of the icosphere (default 1)
   * * You can set some different icosphere dimensions, for instance to build an ellipsoid, by using the parameters `radiusX`, `radiusY` and `radiusZ` (all by default have the same value than `radius`)
   * * The parameter `subdivisions` sets the number of subdivisions (positive integer, default 4). The more subdivisions, the more faces on the icosphere whatever its size
   * * The parameter `flat` (boolean, default true) gives each side its own normals. Set it to false to get a smooth continuous light reflection on the surface
   * * You can also set the mesh side orientation with the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
   * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
   * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/polyhedra#icosphere
   * @param name defines the name of the mesh
   * @param options defines the options used to create the mesh
   * @param scene defines the hosting scene
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateIcoSphere(e, n, i) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Creates a decal mesh.
   *.
   * A decal is a mesh usually applied as a model onto the surface of another mesh
   * @param name  defines the name of the mesh
   * @param sourceMesh defines the mesh receiving the decal
   * @param position sets the position of the decal in world coordinates
   * @param normal sets the normal of the mesh where the decal is applied onto in world coordinates
   * @param size sets the decal scaling
   * @param angle sets the angle to rotate the decal
   * @returns a new Mesh
   * @deprecated Please use MeshBuilder instead
   */
  static CreateDecal(e, n, i, t, r, s) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /** Creates a Capsule Mesh
   * @param name defines the name of the mesh.
   * @param options the constructors options used to shape the mesh.
   * @param scene defines the scene the mesh is scoped to.
   * @returns the capsule mesh
   * @see https://doc.babylonjs.com/how_to/capsule_shape
   * @deprecated Please use MeshBuilder instead
   */
  static CreateCapsule(e, n, i) {
    throw new Error("Import MeshBuilder to populate this function");
  }
  /**
   * Extends a mesh to a Goldberg mesh
   * Warning  the mesh to convert MUST be an import of a perviously exported Goldberg mesh
   * @param mesh the mesh to convert
   * @returns the extended mesh
   * @deprecated Please use ExtendMeshToGoldberg instead
   */
  static ExtendToGoldberg(e) {
    throw new Error("Import MeshBuilder to populate this function");
  }
}
M.FRONTSIDE = P.FRONTSIDE;
M.BACKSIDE = P.BACKSIDE;
M.DOUBLESIDE = P.DOUBLESIDE;
M.DEFAULTSIDE = P.DEFAULTSIDE;
M.NO_CAP = 0;
M.CAP_START = 1;
M.CAP_END = 2;
M.CAP_ALL = 3;
M.NO_FLIP = 0;
M.FLIP_TILE = 1;
M.ROTATE_TILE = 2;
M.FLIP_ROW = 3;
M.ROTATE_ROW = 4;
M.FLIP_N_ROTATE_TILE = 5;
M.FLIP_N_ROTATE_ROW = 6;
M.CENTER = 0;
M.LEFT = 1;
M.RIGHT = 2;
M.TOP = 3;
M.BOTTOM = 4;
M.INSTANCEDMESH_SORT_TRANSPARENT = !1;
M._GroundMeshParser = (T, e) => {
  throw R("GroundMesh");
};
M._GoldbergMeshParser = (T, e) => {
  throw R("GoldbergMesh");
};
M._LinesMeshParser = (T, e) => {
  throw R("LinesMesh");
};
M._GreasedLineMeshParser = (T, e) => {
  throw R("GreasedLineMesh");
};
M._GreasedLineRibbonMeshParser = (T, e) => {
  throw R("GreasedLineRibbonMesh");
};
M._TrailMeshParser = (T, e) => {
  throw R("TrailMesh");
};
ne("BABYLON.Mesh", M);
const ye = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Mesh: M,
  _CreationDataStorage: oe,
  _InstancesBatch: N
}, Symbol.toStringTag, { value: "Module" }));
export {
  M,
  oe as _,
  ae as a,
  N as b,
  ye as m
};
//# sourceMappingURL=mesh-DeWxVt-I.js.map
