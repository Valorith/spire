import { V as d, a as c } from "./embed-entry-Dediijbe.js";
import { S as _, a as m } from "./smartArray-BXymNR-c.js";
class R {
  /**
   * Creates a new instance PostProcess
   * @param scene The scene that the post process is associated with.
   */
  constructor(e) {
    this._vertexBuffers = {}, this._scene = e;
  }
  _prepareBuffers() {
    if (this._vertexBuffers[d.PositionKind])
      return;
    const e = [];
    e.push(1, 1), e.push(-1, 1), e.push(-1, -1), e.push(1, -1), this._vertexBuffers[d.PositionKind] = new d(this._scene.getEngine(), e, d.PositionKind, !1, !1, 2), this._buildIndexBuffer();
  }
  _buildIndexBuffer() {
    const e = [];
    e.push(0), e.push(1), e.push(2), e.push(0), e.push(2), e.push(3), this._indexBuffer = this._scene.getEngine().createIndexBuffer(e);
  }
  /**
   * Rebuilds the vertex buffers of the manager.
   * @internal
   */
  _rebuild() {
    const e = this._vertexBuffers[d.PositionKind];
    e && (e._rebuild(), this._buildIndexBuffer());
  }
  // Methods
  /**
   * Prepares a frame to be run through a post process.
   * @param sourceTexture The input texture to the post processes. (default: null)
   * @param postProcesses An array of post processes to be run. (default: null)
   * @returns True if the post processes were able to be run.
   * @internal
   */
  _prepareFrame(e = null, t = null) {
    const s = this._scene.activeCamera;
    return !s || (t = t || s._postProcesses.filter((n) => n != null), !t || t.length === 0 || !this._scene.postProcessesEnabled) ? !1 : (t[0].activate(s, e, t != null), !0);
  }
  /**
   * Manually render a set of post processes to a texture.
   * Please note, the frame buffer won't be unbound after the call in case you have more render to do.
   * @param postProcesses An array of post processes to be run.
   * @param targetTexture The render target wrapper to render to.
   * @param forceFullscreenViewport force gl.viewport to be full screen eg. 0,0,textureWidth,textureHeight
   * @param faceIndex defines the face to render to if a cubemap is defined as the target
   * @param lodLevel defines which lod of the texture to render to
   * @param doNotBindFrambuffer If set to true, assumes that the framebuffer has been bound previously
   */
  directRender(e, t = null, s = !1, n = 0, r = 0, i = !1) {
    const a = this._scene.getEngine();
    for (let h = 0; h < e.length; h++) {
      h < e.length - 1 ? e[h + 1].activate(this._scene.activeCamera, t?.texture) : (t ? a.bindFramebuffer(t, n, void 0, void 0, s, r) : i || a.restoreDefaultFramebuffer(), a._debugInsertMarker?.(`post process ${e[h].name} output`));
      const o = e[h], u = o.apply();
      u && (o.onBeforeRenderObservable.notifyObservers(u), this._prepareBuffers(), a.bindBuffers(this._vertexBuffers, this._indexBuffer, u), a.drawElementsType(0, 0, 6), o.onAfterRenderObservable.notifyObservers(u));
    }
    a.setDepthBuffer(!0), a.setDepthWrite(!0);
  }
  /**
   * Finalize the result of the output of the postprocesses.
   * @param doNotPresent If true the result will not be displayed to the screen.
   * @param targetTexture The render target wrapper to render to.
   * @param faceIndex The index of the face to bind the target texture to.
   * @param postProcesses The array of post processes to render.
   * @param forceFullscreenViewport force gl.viewport to be full screen eg. 0,0,textureWidth,textureHeight (default: false)
   * @internal
   */
  _finalizeFrame(e, t, s, n, r = !1) {
    const i = this._scene.activeCamera;
    if (!i || (n = n || i._postProcesses.filter((h) => h != null), n.length === 0 || !this._scene.postProcessesEnabled))
      return;
    const a = this._scene.getEngine();
    for (let h = 0, o = n.length; h < o; h++) {
      const u = n[h];
      if (h < o - 1 ? u._outputTexture = n[h + 1].activate(i, t?.texture) : (t ? (a.bindFramebuffer(t, s, void 0, void 0, r), u._outputTexture = t) : (a.restoreDefaultFramebuffer(), u._outputTexture = null), a._debugInsertMarker?.(`post process ${n[h].name} output`)), e)
        break;
      const l = u.apply();
      l && (u.onBeforeRenderObservable.notifyObservers(l), this._prepareBuffers(), a.bindBuffers(this._vertexBuffers, this._indexBuffer, l), a.drawElementsType(0, 0, 6), u.onAfterRenderObservable.notifyObservers(l));
    }
    a.setDepthBuffer(!0), a.setDepthWrite(!0), a.setAlphaMode(0);
  }
  /**
   * Disposes of the post process manager.
   */
  dispose() {
    const e = this._vertexBuffers[d.PositionKind];
    e && (e.dispose(), this._vertexBuffers[d.PositionKind] = null), this._indexBuffer && (this._scene.getEngine()._releaseBuffer(this._indexBuffer), this._indexBuffer = null);
  }
}
class f {
  /**
   * Set the opaque sort comparison function.
   * If null the sub meshes will be render in the order they were created
   */
  set opaqueSortCompareFn(e) {
    e ? this._opaqueSortCompareFn = e : this._opaqueSortCompareFn = f.PainterSortCompare, this._renderOpaque = this._renderOpaqueSorted;
  }
  /**
   * Set the alpha test sort comparison function.
   * If null the sub meshes will be render in the order they were created
   */
  set alphaTestSortCompareFn(e) {
    e ? this._alphaTestSortCompareFn = e : this._alphaTestSortCompareFn = f.PainterSortCompare, this._renderAlphaTest = this._renderAlphaTestSorted;
  }
  /**
   * Set the transparent sort comparison function.
   * If null the sub meshes will be render in the order they were created
   */
  set transparentSortCompareFn(e) {
    e ? this._transparentSortCompareFn = e : this._transparentSortCompareFn = f.defaultTransparentSortCompare, this._renderTransparent = this._renderTransparentSorted;
  }
  /**
   * Creates a new rendering group.
   * @param index The rendering group index
   * @param scene
   * @param opaqueSortCompareFn The opaque sort comparison function. If null no order is applied
   * @param alphaTestSortCompareFn The alpha test sort comparison function. If null no order is applied
   * @param transparentSortCompareFn The transparent sort comparison function. If null back to front + alpha index sort is applied
   */
  constructor(e, t, s = null, n = null, r = null) {
    this.index = e, this._opaqueSubMeshes = new _(256), this._transparentSubMeshes = new _(256), this._alphaTestSubMeshes = new _(256), this._depthOnlySubMeshes = new _(256), this._particleSystems = new _(256), this._spriteManagers = new _(256), this._empty = !0, this._edgesRenderers = new m(16), this._scene = t, this.opaqueSortCompareFn = s, this.alphaTestSortCompareFn = n, this.transparentSortCompareFn = r;
  }
  /**
   * Render all the sub meshes contained in the group.
   * @param customRenderFunction Used to override the default render behaviour of the group.
   * @param renderSprites
   * @param renderParticles
   * @param activeMeshes
   */
  render(e, t, s, n) {
    if (e) {
      e(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes, this._depthOnlySubMeshes);
      return;
    }
    const r = this._scene.getEngine();
    this._depthOnlySubMeshes.length !== 0 && (r.setColorWrite(!1), this._renderAlphaTest(this._depthOnlySubMeshes), r.setColorWrite(!0)), this._opaqueSubMeshes.length !== 0 && this._renderOpaque(this._opaqueSubMeshes), this._alphaTestSubMeshes.length !== 0 && this._renderAlphaTest(this._alphaTestSubMeshes);
    const i = r.getStencilBuffer();
    if (r.setStencilBuffer(!1), t && this._renderSprites(), s && this._renderParticles(n), this.onBeforeTransparentRendering && this.onBeforeTransparentRendering(), this._transparentSubMeshes.length !== 0 || this._scene.useOrderIndependentTransparency) {
      if (r.setStencilBuffer(i), this._scene.useOrderIndependentTransparency) {
        const a = this._scene.depthPeelingRenderer.render(this._transparentSubMeshes);
        a.length && this._renderTransparent(a);
      } else
        this._renderTransparent(this._transparentSubMeshes);
      r.setAlphaMode(0);
    }
    if (r.setStencilBuffer(!1), this._edgesRenderers.length) {
      for (let a = 0; a < this._edgesRenderers.length; a++)
        this._edgesRenderers.data[a].render();
      r.setAlphaMode(0);
    }
    r.setStencilBuffer(i);
  }
  /**
   * Renders the opaque submeshes in the order from the opaqueSortCompareFn.
   * @param subMeshes The submeshes to render
   */
  _renderOpaqueSorted(e) {
    f._RenderSorted(e, this._opaqueSortCompareFn, this._scene.activeCamera, !1);
  }
  /**
   * Renders the opaque submeshes in the order from the alphatestSortCompareFn.
   * @param subMeshes The submeshes to render
   */
  _renderAlphaTestSorted(e) {
    f._RenderSorted(e, this._alphaTestSortCompareFn, this._scene.activeCamera, !1);
  }
  /**
   * Renders the opaque submeshes in the order from the transparentSortCompareFn.
   * @param subMeshes The submeshes to render
   */
  _renderTransparentSorted(e) {
    f._RenderSorted(e, this._transparentSortCompareFn, this._scene.activeCamera, !0);
  }
  /**
   * Renders the submeshes in a specified order.
   * @param subMeshes The submeshes to sort before render
   * @param sortCompareFn The comparison function use to sort
   * @param camera The camera position use to preprocess the submeshes to help sorting
   * @param transparent Specifies to activate blending if true
   */
  static _RenderSorted(e, t, s, n) {
    let r = 0, i;
    const a = s ? s.globalPosition : f._ZeroVector;
    if (n)
      for (; r < e.length; r++)
        i = e.data[r], i._alphaIndex = i.getMesh().alphaIndex, i._distanceToCamera = c.Distance(i.getBoundingInfo().boundingSphere.centerWorld, a);
    const h = e.length === e.data.length ? e.data : e.data.slice(0, e.length);
    t && h.sort(t);
    const o = h[0].getMesh().getScene();
    for (r = 0; r < h.length; r++)
      if (i = h[r], !(o._activeMeshesFrozenButKeepClipping && !i.isInFrustum(o._frustumPlanes))) {
        if (n) {
          const u = i.getMaterial();
          if (u && u.needDepthPrePass) {
            const l = u.getScene().getEngine();
            l.setColorWrite(!1), l.setAlphaMode(0), i.render(!1), l.setColorWrite(!0);
          }
        }
        i.render(n);
      }
  }
  /**
   * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
   * are rendered back to front if in the same alpha index.
   *
   * @param a The first submesh
   * @param b The second submesh
   * @returns The result of the comparison
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static defaultTransparentSortCompare(e, t) {
    return e._alphaIndex > t._alphaIndex ? 1 : e._alphaIndex < t._alphaIndex ? -1 : f.backToFrontSortCompare(e, t);
  }
  /**
   * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
   * are rendered back to front.
   *
   * @param a The first submesh
   * @param b The second submesh
   * @returns The result of the comparison
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static backToFrontSortCompare(e, t) {
    return e._distanceToCamera < t._distanceToCamera ? 1 : e._distanceToCamera > t._distanceToCamera ? -1 : 0;
  }
  /**
   * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
   * are rendered front to back (prevent overdraw).
   *
   * @param a The first submesh
   * @param b The second submesh
   * @returns The result of the comparison
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static frontToBackSortCompare(e, t) {
    return e._distanceToCamera < t._distanceToCamera ? -1 : e._distanceToCamera > t._distanceToCamera ? 1 : 0;
  }
  /**
   * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
   * are grouped by material then geometry.
   *
   * @param a The first submesh
   * @param b The second submesh
   * @returns The result of the comparison
   */
  static PainterSortCompare(e, t) {
    const s = e.getMesh(), n = t.getMesh();
    return s.material && n.material ? s.material.uniqueId - n.material.uniqueId : s.uniqueId - n.uniqueId;
  }
  /**
   * Resets the different lists of submeshes to prepare a new frame.
   */
  prepare() {
    this._opaqueSubMeshes.reset(), this._transparentSubMeshes.reset(), this._alphaTestSubMeshes.reset(), this._depthOnlySubMeshes.reset(), this._particleSystems.reset(), this.prepareSprites(), this._edgesRenderers.reset(), this._empty = !0;
  }
  /**
   * Resets the different lists of sprites to prepare a new frame.
   */
  prepareSprites() {
    this._spriteManagers.reset();
  }
  dispose() {
    this._opaqueSubMeshes.dispose(), this._transparentSubMeshes.dispose(), this._alphaTestSubMeshes.dispose(), this._depthOnlySubMeshes.dispose(), this._particleSystems.dispose(), this._spriteManagers.dispose(), this._edgesRenderers.dispose();
  }
  /**
   * Inserts the submesh in its correct queue depending on its material.
   * @param subMesh The submesh to dispatch
   * @param [mesh] Optional reference to the submeshes's mesh. Provide if you have an exiting reference to improve performance.
   * @param [material] Optional reference to the submeshes's material. Provide if you have an exiting reference to improve performance.
   */
  dispatch(e, t, s) {
    t === void 0 && (t = e.getMesh()), s === void 0 && (s = e.getMaterial()), s != null && (s.needAlphaBlendingForMesh(t) ? this._transparentSubMeshes.push(e) : s.needAlphaTesting() ? (s.needDepthPrePass && this._depthOnlySubMeshes.push(e), this._alphaTestSubMeshes.push(e)) : (s.needDepthPrePass && this._depthOnlySubMeshes.push(e), this._opaqueSubMeshes.push(e)), t._renderingGroup = this, t._edgesRenderer && t._edgesRenderer.isEnabled && this._edgesRenderers.pushNoDuplicate(t._edgesRenderer), this._empty = !1);
  }
  dispatchSprites(e) {
    this._spriteManagers.push(e), this._empty = !1;
  }
  dispatchParticles(e) {
    this._particleSystems.push(e), this._empty = !1;
  }
  _renderParticles(e) {
    if (this._particleSystems.length === 0)
      return;
    const t = this._scene.activeCamera;
    this._scene.onBeforeParticlesRenderingObservable.notifyObservers(this._scene);
    for (let s = 0; s < this._particleSystems.length; s++) {
      const n = this._particleSystems.data[s];
      if ((t && t.layerMask & n.layerMask) === 0)
        continue;
      const r = n.emitter;
      (!r.position || !e || e.indexOf(r) !== -1) && this._scene._activeParticles.addCount(n.render(), !1);
    }
    this._scene.onAfterParticlesRenderingObservable.notifyObservers(this._scene);
  }
  _renderSprites() {
    if (!this._scene.spritesEnabled || this._spriteManagers.length === 0)
      return;
    const e = this._scene.activeCamera;
    this._scene.onBeforeSpritesRenderingObservable.notifyObservers(this._scene);
    for (let t = 0; t < this._spriteManagers.length; t++) {
      const s = this._spriteManagers.data[t];
      (e && e.layerMask & s.layerMask) !== 0 && s.render();
    }
    this._scene.onAfterSpritesRenderingObservable.notifyObservers(this._scene);
  }
}
f._ZeroVector = c.Zero();
class g {
}
class p {
  /**
   * Gets or sets a boolean indicating that the manager will not reset between frames.
   * This means that if a mesh becomes invisible or transparent it will not be visible until this boolean is set to false again.
   * By default, the rendering manager will dispatch all active meshes per frame (moving them to the transparent, opaque or alpha testing lists).
   * By turning this property on, you will accelerate the rendering by keeping all these lists unchanged between frames.
   */
  get maintainStateBetweenFrames() {
    return this._maintainStateBetweenFrames;
  }
  set maintainStateBetweenFrames(e) {
    e !== this._maintainStateBetweenFrames && (this._maintainStateBetweenFrames = e, this._maintainStateBetweenFrames || this.restoreDispachedFlags());
  }
  /**
   * Restore wasDispatched flags on the lists of elements to render.
   */
  restoreDispachedFlags() {
    for (const e of this._scene.meshes)
      if (e.subMeshes)
        for (const t of e.subMeshes)
          t._wasDispatched = !1;
    if (this._scene.spriteManagers)
      for (const e of this._scene.spriteManagers)
        e._wasDispatched = !1;
    for (const e of this._scene.particleSystems)
      e._wasDispatched = !1;
  }
  /**
   * Instantiates a new rendering group for a particular scene
   * @param scene Defines the scene the groups belongs to
   */
  constructor(e) {
    this._useSceneAutoClearSetup = !1, this._renderingGroups = new Array(), this._autoClearDepthStencil = {}, this._customOpaqueSortCompareFn = {}, this._customAlphaTestSortCompareFn = {}, this._customTransparentSortCompareFn = {}, this._renderingGroupInfo = new g(), this._maintainStateBetweenFrames = !1, this._scene = e;
    for (let t = p.MIN_RENDERINGGROUPS; t < p.MAX_RENDERINGGROUPS; t++)
      this._autoClearDepthStencil[t] = { autoClear: !0, depth: !0, stencil: !0 };
  }
  /**
   * @returns the rendering group with the specified id.
   * @param id the id of the rendering group (0 by default)
   */
  getRenderingGroup(e) {
    const t = e || 0;
    return this._prepareRenderingGroup(t), this._renderingGroups[t];
  }
  _clearDepthStencilBuffer(e = !0, t = !0) {
    this._depthStencilBufferAlreadyCleaned || (this._scene.getEngine().clear(null, !1, e, t), this._depthStencilBufferAlreadyCleaned = !0);
  }
  /**
   * Renders the entire managed groups. This is used by the scene or the different render targets.
   * @internal
   */
  render(e, t, s, n) {
    const r = this._renderingGroupInfo;
    if (r.scene = this._scene, r.camera = this._scene.activeCamera, this._scene.spriteManagers && n)
      for (let i = 0; i < this._scene.spriteManagers.length; i++) {
        const a = this._scene.spriteManagers[i];
        this.dispatchSprites(a);
      }
    for (let i = p.MIN_RENDERINGGROUPS; i < p.MAX_RENDERINGGROUPS; i++) {
      this._depthStencilBufferAlreadyCleaned = i === p.MIN_RENDERINGGROUPS;
      const a = this._renderingGroups[i];
      if (!a || a._empty)
        continue;
      const h = 1 << i;
      if (r.renderingGroupId = i, this._scene.onBeforeRenderingGroupObservable.notifyObservers(r, h), p.AUTOCLEAR) {
        const o = this._useSceneAutoClearSetup ? this._scene.getAutoClearDepthStencilSetup(i) : this._autoClearDepthStencil[i];
        o && o.autoClear && this._clearDepthStencilBuffer(o.depth, o.stencil);
      }
      for (const o of this._scene._beforeRenderingGroupDrawStage)
        o.action(i);
      a.render(e, n, s, t);
      for (const o of this._scene._afterRenderingGroupDrawStage)
        o.action(i);
      this._scene.onAfterRenderingGroupObservable.notifyObservers(r, h);
    }
  }
  /**
   * Resets the different information of the group to prepare a new frame
   * @internal
   */
  reset() {
    if (!this.maintainStateBetweenFrames)
      for (let e = p.MIN_RENDERINGGROUPS; e < p.MAX_RENDERINGGROUPS; e++) {
        const t = this._renderingGroups[e];
        t && t.prepare();
      }
  }
  /**
   * Resets the sprites information of the group to prepare a new frame
   * @internal
   */
  resetSprites() {
    if (!this.maintainStateBetweenFrames)
      for (let e = p.MIN_RENDERINGGROUPS; e < p.MAX_RENDERINGGROUPS; e++) {
        const t = this._renderingGroups[e];
        t && t.prepareSprites();
      }
  }
  /**
   * Dispose and release the group and its associated resources.
   * @internal
   */
  dispose() {
    this.freeRenderingGroups(), this._renderingGroups.length = 0, this._renderingGroupInfo = null;
  }
  /**
   * Clear the info related to rendering groups preventing retention points during dispose.
   */
  freeRenderingGroups() {
    for (let e = p.MIN_RENDERINGGROUPS; e < p.MAX_RENDERINGGROUPS; e++) {
      const t = this._renderingGroups[e];
      t && t.dispose();
    }
  }
  _prepareRenderingGroup(e) {
    this._renderingGroups[e] === void 0 && (this._renderingGroups[e] = new f(e, this._scene, this._customOpaqueSortCompareFn[e], this._customAlphaTestSortCompareFn[e], this._customTransparentSortCompareFn[e]));
  }
  /**
   * Add a sprite manager to the rendering manager in order to render it this frame.
   * @param spriteManager Define the sprite manager to render
   */
  dispatchSprites(e) {
    this.maintainStateBetweenFrames && e._wasDispatched || (e._wasDispatched = !0, this.getRenderingGroup(e.renderingGroupId).dispatchSprites(e));
  }
  /**
   * Add a particle system to the rendering manager in order to render it this frame.
   * @param particleSystem Define the particle system to render
   */
  dispatchParticles(e) {
    this.maintainStateBetweenFrames && e._wasDispatched || (e._wasDispatched = !0, this.getRenderingGroup(e.renderingGroupId).dispatchParticles(e));
  }
  /**
   * Add a submesh to the manager in order to render it this frame
   * @param subMesh The submesh to dispatch
   * @param mesh Optional reference to the submeshes's mesh. Provide if you have an exiting reference to improve performance.
   * @param material Optional reference to the submeshes's material. Provide if you have an exiting reference to improve performance.
   */
  dispatch(e, t, s) {
    t === void 0 && (t = e.getMesh()), !(this.maintainStateBetweenFrames && e._wasDispatched) && (e._wasDispatched = !0, this.getRenderingGroup(t.renderingGroupId).dispatch(e, t, s));
  }
  /**
   * Overrides the default sort function applied in the rendering group to prepare the meshes.
   * This allowed control for front to back rendering or reversely depending of the special needs.
   *
   * @param renderingGroupId The rendering group id corresponding to its index
   * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
   * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
   * @param transparentSortCompareFn The transparent queue comparison function use to sort.
   */
  setRenderingOrder(e, t = null, s = null, n = null) {
    if (this._customOpaqueSortCompareFn[e] = t, this._customAlphaTestSortCompareFn[e] = s, this._customTransparentSortCompareFn[e] = n, this._renderingGroups[e]) {
      const r = this._renderingGroups[e];
      r.opaqueSortCompareFn = this._customOpaqueSortCompareFn[e], r.alphaTestSortCompareFn = this._customAlphaTestSortCompareFn[e], r.transparentSortCompareFn = this._customTransparentSortCompareFn[e];
    }
  }
  /**
   * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
   *
   * @param renderingGroupId The rendering group id corresponding to its index
   * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
   * @param depth Automatically clears depth between groups if true and autoClear is true.
   * @param stencil Automatically clears stencil between groups if true and autoClear is true.
   */
  setRenderingAutoClearDepthStencil(e, t, s = !0, n = !0) {
    this._autoClearDepthStencil[e] = {
      autoClear: t,
      depth: s,
      stencil: n
    };
  }
  /**
   * Gets the current auto clear configuration for one rendering group of the rendering
   * manager.
   * @param index the rendering group index to get the information for
   * @returns The auto clear setup for the requested rendering group
   */
  getAutoClearDepthStencilSetup(e) {
    return this._autoClearDepthStencil[e];
  }
}
p.MAX_RENDERINGGROUPS = 4;
p.MIN_RENDERINGGROUPS = 0;
p.AUTOCLEAR = !0;
export {
  R as P,
  p as R,
  f as a,
  g as b
};
//# sourceMappingURL=renderingManager-DGvgoe5f.js.map
