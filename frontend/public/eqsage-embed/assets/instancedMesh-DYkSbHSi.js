import { T as d, L as _, M, i as l, D as I, V as g } from "./embed-entry-Bb6cfUYP.js";
import { A as p } from "./abstractMesh-BB3yxeX_.js";
import { M as f } from "./mesh-BIoKPPmW.js";
import { TransformNode as B } from "./transformNode-ChKEoFVr.js";
f._instancedMeshFactory = (r, e) => {
  const s = new S(r, e);
  if (e.instancedBuffers) {
    s.instancedBuffers = {};
    for (const t in e.instancedBuffers)
      s.instancedBuffers[t] = e.instancedBuffers[t];
  }
  return s;
};
class S extends p {
  /**
   * Creates a new InstancedMesh object from the mesh source.
   * @param name defines the name of the instance
   * @param source the mesh to create the instance from
   */
  constructor(e, s) {
    super(e, s.getScene()), this._indexInSourceMeshInstanceArray = -1, this._distanceToCamera = 0, s.addInstance(this), this._sourceMesh = s, this._unIndexed = s._unIndexed, this.position.copyFrom(s.position), this.rotation.copyFrom(s.rotation), this.scaling.copyFrom(s.scaling), s.rotationQuaternion && (this.rotationQuaternion = s.rotationQuaternion.clone()), this.animations = s.animations.slice();
    for (const t of s.getAnimationRanges())
      t != null && this.createAnimationRange(t.name, t.from, t.to);
    this.infiniteDistance = s.infiniteDistance, this.setPivotMatrix(s.getPivotMatrix()), this.refreshBoundingInfo(!0, !0), this._syncSubMeshes();
  }
  /**
   * @returns the string "InstancedMesh".
   */
  getClassName() {
    return "InstancedMesh";
  }
  /** Gets the list of lights affecting that mesh */
  get lightSources() {
    return this._sourceMesh._lightSources;
  }
  _resyncLightSources() {
  }
  _resyncLightSource() {
  }
  _removeLightSource() {
  }
  // Methods
  /**
   * If the source mesh receives shadows
   */
  get receiveShadows() {
    return this._sourceMesh.receiveShadows;
  }
  set receiveShadows(e) {
    this._sourceMesh?.receiveShadows !== e && d.Warn("Setting receiveShadows on an instanced mesh has no effect");
  }
  /**
   * The material of the source mesh
   */
  get material() {
    return this._sourceMesh.material;
  }
  set material(e) {
    this._sourceMesh?.material !== e && d.Warn("Setting material on an instanced mesh has no effect");
  }
  /**
   * Visibility of the source mesh
   */
  get visibility() {
    return this._sourceMesh.visibility;
  }
  set visibility(e) {
    this._sourceMesh?.visibility !== e && d.Warn("Setting visibility on an instanced mesh has no effect");
  }
  /**
   * Skeleton of the source mesh
   */
  get skeleton() {
    return this._sourceMesh.skeleton;
  }
  set skeleton(e) {
    this._sourceMesh?.skeleton !== e && d.Warn("Setting skeleton on an instanced mesh has no effect");
  }
  /**
   * Rendering ground id of the source mesh
   */
  get renderingGroupId() {
    return this._sourceMesh.renderingGroupId;
  }
  set renderingGroupId(e) {
    !this._sourceMesh || e === this._sourceMesh.renderingGroupId || _.Warn("Note - setting renderingGroupId of an instanced mesh has no effect on the scene");
  }
  /**
   * @returns the total number of vertices (integer).
   */
  getTotalVertices() {
    return this._sourceMesh ? this._sourceMesh.getTotalVertices() : 0;
  }
  /**
   * Returns a positive integer : the total number of indices in this mesh geometry.
   * @returns the number of indices or zero if the mesh has no geometry.
   */
  getTotalIndices() {
    return this._sourceMesh.getTotalIndices();
  }
  /**
   * The source mesh of the instance
   */
  get sourceMesh() {
    return this._sourceMesh;
  }
  /**
   * Creates a new InstancedMesh object from the mesh model.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances
   * @param name defines the name of the new instance
   * @returns a new InstancedMesh
   */
  createInstance(e) {
    return this._sourceMesh.createInstance(e);
  }
  /**
   * Is this node ready to be used/rendered
   * @param completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
   * @returns {boolean} is it ready
   */
  isReady(e = !1) {
    return this._sourceMesh.isReady(e, !0);
  }
  /**
   * Returns an array of integers or a typed array (Int32Array, Uint32Array, Uint16Array) populated with the mesh indices.
   * @param kind kind of verticies to retrieve (eg. positions, normals, uvs, etc.)
   * @param copyWhenShared If true (default false) and and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
   * @param forceCopy defines a boolean forcing the copy of the buffer no matter what the value of copyWhenShared is
   * @returns a float array or a Float32Array of the requested kind of data : positions, normals, uvs, etc.
   */
  getVerticesData(e, s, t) {
    return this._sourceMesh.getVerticesData(e, s, t);
  }
  /**
   * Sets the vertex data of the mesh geometry for the requested `kind`.
   * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
   * The `data` are either a numeric array either a Float32Array.
   * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initially none) or updater.
   * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).
   * Note that a new underlying VertexBuffer object is created each call.
   * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
   *
   * Possible `kind` values :
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
   *
   * Returns the Mesh.
   * @param kind defines vertex data kind
   * @param data defines the data source
   * @param updatable defines if the data must be flagged as updatable (false as default)
   * @param stride defines the vertex stride (optional)
   * @returns the current mesh
   */
  setVerticesData(e, s, t, n) {
    return this.sourceMesh && this.sourceMesh.setVerticesData(e, s, t, n), this.sourceMesh;
  }
  /**
   * Updates the existing vertex data of the mesh geometry for the requested `kind`.
   * If the mesh has no geometry, it is simply returned as it is.
   * The `data` are either a numeric array either a Float32Array.
   * No new underlying VertexBuffer object is created.
   * If the `kind` is the `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
   * If the parameter `makeItUnique` is true, a new global geometry is created from this positions and is set to the mesh.
   *
   * Possible `kind` values :
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
   *
   * Returns the Mesh.
   * @param kind defines vertex data kind
   * @param data defines the data source
   * @param updateExtends defines if extends info of the mesh must be updated (can be null). This is mostly useful for "position" kind
   * @param makeItUnique defines it the updated vertex buffer must be flagged as unique (false by default)
   * @returns the source mesh
   */
  updateVerticesData(e, s, t, n) {
    return this.sourceMesh && this.sourceMesh.updateVerticesData(e, s, t, n), this.sourceMesh;
  }
  /**
   * Sets the mesh indices.
   * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
   * If the mesh has no geometry, a new Geometry object is created and set to the mesh.
   * This method creates a new index buffer each call.
   * Returns the Mesh.
   * @param indices the source data
   * @param totalVertices defines the total number of vertices referenced by indices (could be null)
   * @returns source mesh
   */
  setIndices(e, s = null) {
    return this.sourceMesh && this.sourceMesh.setIndices(e, s), this.sourceMesh;
  }
  /**
   * Boolean : True if the mesh owns the requested kind of data.
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
   * @returns true if data kind is present
   */
  isVerticesDataPresent(e) {
    return this._sourceMesh.isVerticesDataPresent(e);
  }
  /**
   * @returns an array of indices (IndicesArray).
   */
  getIndices() {
    return this._sourceMesh.getIndices();
  }
  get _positions() {
    return this._sourceMesh._positions;
  }
  /**
   * This method recomputes and sets a new BoundingInfo to the mesh unless it is locked.
   * This means the mesh underlying bounding box and sphere are recomputed.
   * @param applySkeleton defines whether to apply the skeleton before computing the bounding info
   * @param applyMorph  defines whether to apply the morph target before computing the bounding info
   * @returns the current mesh
   */
  refreshBoundingInfo(e = !1, s = !1) {
    if (this.hasBoundingInfo && this.getBoundingInfo().isLocked)
      return this;
    const t = this._sourceMesh.geometry ? this._sourceMesh.geometry.boundingBias : null;
    return this._refreshBoundingInfo(this._sourceMesh._getPositionData(e, s), t), this;
  }
  /** @internal */
  _preActivate() {
    return this._currentLOD && this._currentLOD._preActivate(), this;
  }
  /**
   * @internal
   */
  _activate(e, s) {
    if (super._activate(e, s), this._sourceMesh.subMeshes || _.Warn("Instances should only be created for meshes with geometry."), this._currentLOD) {
      if (this._currentLOD._getWorldMatrixDeterminant() >= 0 != this._getWorldMatrixDeterminant() >= 0)
        return this._internalAbstractMeshDataInfo._actAsRegularMesh = !0, !0;
      if (this._internalAbstractMeshDataInfo._actAsRegularMesh = !1, this._currentLOD._registerInstanceForRenderId(this, e), s) {
        if (!this._currentLOD._internalAbstractMeshDataInfo._isActiveIntermediate)
          return this._currentLOD._internalAbstractMeshDataInfo._onlyForInstancesIntermediate = !0, !0;
      } else if (!this._currentLOD._internalAbstractMeshDataInfo._isActive)
        return this._currentLOD._internalAbstractMeshDataInfo._onlyForInstances = !0, !0;
    }
    return !1;
  }
  /** @internal */
  _postActivate() {
    this._sourceMesh.edgesShareWithInstances && this._sourceMesh._edgesRenderer && this._sourceMesh._edgesRenderer.isEnabled && this._sourceMesh._renderingGroup ? (this._sourceMesh._renderingGroup._edgesRenderers.pushNoDuplicate(this._sourceMesh._edgesRenderer), this._sourceMesh._edgesRenderer.customInstances.push(this.getWorldMatrix())) : this._edgesRenderer && this._edgesRenderer.isEnabled && this._sourceMesh._renderingGroup && this._sourceMesh._renderingGroup._edgesRenderers.push(this._edgesRenderer);
  }
  getWorldMatrix() {
    if (this._currentLOD && this._currentLOD.billboardMode !== B.BILLBOARDMODE_NONE && this._currentLOD._masterMesh !== this) {
      this._billboardWorldMatrix || (this._billboardWorldMatrix = new M());
      const e = this._currentLOD._masterMesh;
      return this._currentLOD._masterMesh = this, l.Vector3[7].copyFrom(this._currentLOD.position), this._currentLOD.position.set(0, 0, 0), this._billboardWorldMatrix.copyFrom(this._currentLOD.computeWorldMatrix(!0)), this._currentLOD.position.copyFrom(l.Vector3[7]), this._currentLOD._masterMesh = e, this._billboardWorldMatrix;
    }
    return super.getWorldMatrix();
  }
  get isAnInstance() {
    return !0;
  }
  /**
   * Returns the current associated LOD AbstractMesh.
   * @param camera defines the camera to use to pick the LOD level
   * @returns a Mesh or `null` if no LOD is associated with the AbstractMesh
   */
  getLOD(e) {
    if (!e)
      return this;
    const s = this.sourceMesh.getLODLevels();
    if (!s || s.length === 0)
      this._currentLOD = this.sourceMesh;
    else {
      const t = this.getBoundingInfo();
      this._currentLOD = this.sourceMesh.getLOD(e, t.boundingSphere);
    }
    return this._currentLOD;
  }
  /**
   * @internal
   */
  _preActivateForIntermediateRendering(e) {
    return this.sourceMesh._preActivateForIntermediateRendering(e);
  }
  /** @internal */
  _syncSubMeshes() {
    if (this.releaseSubMeshes(), this._sourceMesh.subMeshes)
      for (let e = 0; e < this._sourceMesh.subMeshes.length; e++)
        this._sourceMesh.subMeshes[e].clone(this, this._sourceMesh);
    return this;
  }
  /** @internal */
  _generatePointsArray() {
    return this._sourceMesh._generatePointsArray();
  }
  /** @internal */
  _updateBoundingInfo() {
    return this.hasBoundingInfo ? this.getBoundingInfo().update(this.worldMatrixFromCache) : this.buildBoundingInfo(this.absolutePosition, this.absolutePosition, this.worldMatrixFromCache), this._updateSubMeshesBoundingInfo(this.worldMatrixFromCache), this;
  }
  /**
   * Creates a new InstancedMesh from the current mesh.
   *
   * Returns the clone.
   * @param name the cloned mesh name
   * @param newParent the optional Node to parent the clone to.
   * @param doNotCloneChildren if `true` the model children aren't cloned.
   * @param newSourceMesh if set this mesh will be used as the source mesh instead of ths instance's one
   * @returns the clone
   */
  clone(e, s = null, t, n) {
    const i = (n || this._sourceMesh).createInstance(e);
    if (I.DeepCopy(this, i, [
      "name",
      "subMeshes",
      "uniqueId",
      "parent",
      "lightSources",
      "receiveShadows",
      "material",
      "visibility",
      "skeleton",
      "sourceMesh",
      "isAnInstance",
      "facetNb",
      "isFacetDataEnabled",
      "isBlocked",
      "useBones",
      "hasInstances",
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
      "hasBoundingInfo"
    ], []), this.refreshBoundingInfo(), s && (i.parent = s), !t)
      for (let u = 0; u < this.getScene().meshes.length; u++) {
        const a = this.getScene().meshes[u];
        a.parent === this && a.clone(a.name, i);
      }
    return i.computeWorldMatrix(!0), this.onClonedObservable.notifyObservers(i), i;
  }
  /**
   * Disposes the InstancedMesh.
   * Returns nothing.
   * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
   * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
   */
  dispose(e, s = !1) {
    this._sourceMesh.removeInstance(this), super.dispose(e, s);
  }
  /**
   * @internal
   */
  _serializeAsParent(e) {
    super._serializeAsParent(e), e.parentId = this._sourceMesh.uniqueId, e.parentInstanceIndex = this._indexInSourceMeshInstanceArray;
  }
  /**
   * Instantiate (when possible) or clone that node with its hierarchy
   * @param newParent defines the new parent to use for the instance (or clone)
   * @param options defines options to configure how copy is done
   * @param options.doNotInstantiate defines if the model must be instantiated or just cloned
   * @param options.newSourcedMesh newSourcedMesh the new source mesh for the instance (or clone)
   * @param onNewNodeCreated defines an option callback to call when a clone or an instance is created
   * @returns an instance (or a clone) of the current node with its hierarchy
   */
  instantiateHierarchy(e = null, s, t) {
    const n = this.clone("Clone of " + (this.name || this.id), e || this.parent, !0, s && s.newSourcedMesh);
    n && t && t(this, n);
    for (const i of this.getChildTransformNodes(!0))
      i.instantiateHierarchy(n, s, t);
    return n;
  }
}
f.prototype.registerInstancedBuffer = function(r, e) {
  if (this._userInstancedBuffersStorage?.vertexBuffers[r]?.dispose(), !this.instancedBuffers) {
    this.instancedBuffers = {};
    for (const s of this.instances)
      s.instancedBuffers = {};
  }
  this._userInstancedBuffersStorage || (this._userInstancedBuffersStorage = {
    data: {},
    vertexBuffers: {},
    strides: {},
    sizes: {},
    vertexArrayObjects: this.getEngine().getCaps().vertexArrayObject ? {} : void 0
  }), this.instancedBuffers[r] = null, this._userInstancedBuffersStorage.strides[r] = e, this._userInstancedBuffersStorage.sizes[r] = e * 32, this._userInstancedBuffersStorage.data[r] = new Float32Array(this._userInstancedBuffersStorage.sizes[r]), this._userInstancedBuffersStorage.vertexBuffers[r] = new g(this.getEngine(), this._userInstancedBuffersStorage.data[r], r, !0, !1, e, !0);
  for (const s of this.instances)
    s.instancedBuffers[r] = null;
  this._invalidateInstanceVertexArrayObject(), this._markSubMeshesAsAttributesDirty();
};
f.prototype._processInstancedBuffers = function(r, e) {
  const s = r ? r.length : 0;
  for (const t in this.instancedBuffers) {
    let n = this._userInstancedBuffersStorage.sizes[t];
    const i = this._userInstancedBuffersStorage.strides[t], u = (s + 1) * i;
    for (; n < u; )
      n *= 2;
    this._userInstancedBuffersStorage.data[t].length != n && (this._userInstancedBuffersStorage.data[t] = new Float32Array(n), this._userInstancedBuffersStorage.sizes[t] = n, this._userInstancedBuffersStorage.vertexBuffers[t] && (this._userInstancedBuffersStorage.vertexBuffers[t].dispose(), this._userInstancedBuffersStorage.vertexBuffers[t] = null));
    const a = this._userInstancedBuffersStorage.data[t];
    let h = 0;
    if (e) {
      const o = this.instancedBuffers[t];
      o.toArray ? o.toArray(a, h) : o.copyToArray ? o.copyToArray(a, h) : a[h] = o, h += i;
    }
    for (let o = 0; o < s; o++) {
      const c = r[o].instancedBuffers[t];
      c.toArray ? c.toArray(a, h) : c.copyToArray ? c.copyToArray(a, h) : a[h] = c, h += i;
    }
    this._userInstancedBuffersStorage.vertexBuffers[t] ? this._userInstancedBuffersStorage.vertexBuffers[t].updateDirectly(a, 0) : (this._userInstancedBuffersStorage.vertexBuffers[t] = new g(this.getEngine(), this._userInstancedBuffersStorage.data[t], t, !0, !1, i, !0), this._invalidateInstanceVertexArrayObject());
  }
};
f.prototype._invalidateInstanceVertexArrayObject = function() {
  if (!(!this._userInstancedBuffersStorage || this._userInstancedBuffersStorage.vertexArrayObjects === void 0)) {
    for (const r in this._userInstancedBuffersStorage.vertexArrayObjects)
      this.getEngine().releaseVertexArrayObject(this._userInstancedBuffersStorage.vertexArrayObjects[r]);
    this._userInstancedBuffersStorage.vertexArrayObjects = {};
  }
};
f.prototype._disposeInstanceSpecificData = function() {
  for (this._instanceDataStorage.instancesBuffer && (this._instanceDataStorage.instancesBuffer.dispose(), this._instanceDataStorage.instancesBuffer = null); this.instances.length; )
    this.instances[0].dispose();
  for (const r in this.instancedBuffers)
    this._userInstancedBuffersStorage.vertexBuffers[r] && this._userInstancedBuffersStorage.vertexBuffers[r].dispose();
  this._invalidateInstanceVertexArrayObject(), this.instancedBuffers = {};
};
export {
  S as I
};
//# sourceMappingURL=instancedMesh-DYkSbHSi.js.map
