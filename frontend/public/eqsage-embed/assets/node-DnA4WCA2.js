import { O as c, M as g, d as b, a as l, _ as D, b as d, c as h } from "./embed-entry-BgvWRWVI.js";
import { S as N } from "./decorators.serialization-C2D-FLnh.js";
class S {
  constructor() {
    this._doNotSerialize = !1, this._isDisposed = !1, this._sceneRootNodesIndex = -1, this._isEnabled = !0, this._isParentEnabled = !0, this._isReady = !0, this._onEnabledStateChangedObservable = new c(), this._onClonedObservable = new c();
  }
}
class r {
  /**
   * Add a new node constructor
   * @param type defines the type name of the node to construct
   * @param constructorFunc defines the constructor function
   */
  static AddNodeConstructor(e, t) {
    this._NodeConstructors[e] = t;
  }
  /**
   * Returns a node constructor based on type name
   * @param type defines the type name
   * @param name defines the new node name
   * @param scene defines the hosting scene
   * @param options defines optional options to transmit to constructors
   * @returns the new constructor or null
   */
  static Construct(e, t, n, i) {
    const s = this._NodeConstructors[e];
    return s ? s(t, n, i) : null;
  }
  /**
   * Gets or sets the accessibility tag to describe the node for accessibility purpose.
   */
  set accessibilityTag(e) {
    this._accessibilityTag = e, this.onAccessibilityTagChangedObservable.notifyObservers(e);
  }
  get accessibilityTag() {
    return this._accessibilityTag;
  }
  /**
   * Gets or sets a boolean used to define if the node must be serialized
   */
  get doNotSerialize() {
    return this._nodeDataStorage._doNotSerialize ? !0 : this._parentNode ? this._parentNode.doNotSerialize : !1;
  }
  set doNotSerialize(e) {
    this._nodeDataStorage._doNotSerialize = e;
  }
  /**
   * Gets a boolean indicating if the node has been disposed
   * @returns true if the node was disposed
   */
  isDisposed() {
    return this._nodeDataStorage._isDisposed;
  }
  /**
   * Gets or sets the parent of the node (without keeping the current position in the scene)
   * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/parent_pivot/parent
   */
  set parent(e) {
    if (this._parentNode === e)
      return;
    const t = this._parentNode;
    if (this._parentNode && this._parentNode._children !== void 0 && this._parentNode._children !== null) {
      const n = this._parentNode._children.indexOf(this);
      n !== -1 && this._parentNode._children.splice(n, 1), !e && !this._nodeDataStorage._isDisposed && this._addToSceneRootNodes();
    }
    this._parentNode = e, this._isDirty = !0, this._parentNode && ((this._parentNode._children === void 0 || this._parentNode._children === null) && (this._parentNode._children = new Array()), this._parentNode._children.push(this), t || this._removeFromSceneRootNodes()), this._syncParentEnabledState();
  }
  get parent() {
    return this._parentNode;
  }
  /**
   * @internal
   */
  _serializeAsParent(e) {
    e.parentId = this.uniqueId;
  }
  /** @internal */
  _addToSceneRootNodes() {
    this._nodeDataStorage._sceneRootNodesIndex === -1 && (this._nodeDataStorage._sceneRootNodesIndex = this._scene.rootNodes.length, this._scene.rootNodes.push(this));
  }
  /** @internal */
  _removeFromSceneRootNodes() {
    if (this._nodeDataStorage._sceneRootNodesIndex !== -1) {
      const e = this._scene.rootNodes, t = e.length - 1;
      e[this._nodeDataStorage._sceneRootNodesIndex] = e[t], e[this._nodeDataStorage._sceneRootNodesIndex]._nodeDataStorage._sceneRootNodesIndex = this._nodeDataStorage._sceneRootNodesIndex, this._scene.rootNodes.pop(), this._nodeDataStorage._sceneRootNodesIndex = -1;
    }
  }
  /**
   * Gets or sets the animation properties override
   */
  get animationPropertiesOverride() {
    return this._animationPropertiesOverride ? this._animationPropertiesOverride : this._scene.animationPropertiesOverride;
  }
  set animationPropertiesOverride(e) {
    this._animationPropertiesOverride = e;
  }
  /**
   * Gets a string identifying the name of the class
   * @returns "Node" string
   */
  getClassName() {
    return "Node";
  }
  /**
   * Sets a callback that will be raised when the node will be disposed
   */
  set onDispose(e) {
    this._onDisposeObserver && this.onDisposeObservable.remove(this._onDisposeObserver), this._onDisposeObserver = this.onDisposeObservable.add(e);
  }
  /**
   * An event triggered when the enabled state of the node changes
   */
  get onEnabledStateChangedObservable() {
    return this._nodeDataStorage._onEnabledStateChangedObservable;
  }
  /**
   * An event triggered when the node is cloned
   */
  get onClonedObservable() {
    return this._nodeDataStorage._onClonedObservable;
  }
  /**
   * Creates a new Node
   * @param name the name and id to be given to this node
   * @param scene the scene this node will be added to
   */
  constructor(e, t = null) {
    this._isDirty = !1, this._nodeDataStorage = new S(), this.state = "", this.metadata = null, this.reservedDataStore = null, this._accessibilityTag = null, this.onAccessibilityTagChangedObservable = new c(), this._parentContainer = null, this.animations = [], this._ranges = {}, this.onReady = null, this._currentRenderId = -1, this._parentUpdateId = -1, this._childUpdateId = -1, this._waitingParentId = null, this._waitingParentInstanceIndex = null, this._waitingParsedUniqueId = null, this._cache = {}, this._parentNode = null, this._children = null, this._worldMatrix = g.Identity(), this._worldMatrixDeterminant = 0, this._worldMatrixDeterminantIsDirty = !0, this._animationPropertiesOverride = null, this._isNode = !0, this.onDisposeObservable = new c(), this._onDisposeObserver = null, this._behaviors = new Array(), this.name = e, this.id = e, this._scene = t || b.LastCreatedScene, this.uniqueId = this._scene.getUniqueId(), this._initCache();
  }
  /**
   * Gets the scene of the node
   * @returns a scene
   */
  getScene() {
    return this._scene;
  }
  /**
   * Gets the engine of the node
   * @returns a Engine
   */
  getEngine() {
    return this._scene.getEngine();
  }
  /**
   * Attach a behavior to the node
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
   * @param behavior defines the behavior to attach
   * @param attachImmediately defines that the behavior must be attached even if the scene is still loading
   * @returns the current Node
   */
  addBehavior(e, t = !1) {
    return this._behaviors.indexOf(e) !== -1 ? this : (e.init(), this._scene.isLoading && !t ? this._scene.onDataLoadedObservable.addOnce(() => {
      e.attach(this);
    }) : e.attach(this), this._behaviors.push(e), this);
  }
  /**
   * Remove an attached behavior
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
   * @param behavior defines the behavior to attach
   * @returns the current Node
   */
  removeBehavior(e) {
    const t = this._behaviors.indexOf(e);
    return t === -1 ? this : (this._behaviors[t].detach(), this._behaviors.splice(t, 1), this);
  }
  /**
   * Gets the list of attached behaviors
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
   */
  get behaviors() {
    return this._behaviors;
  }
  /**
   * Gets an attached behavior by name
   * @param name defines the name of the behavior to look for
   * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
   * @returns null if behavior was not found else the requested behavior
   */
  getBehaviorByName(e) {
    for (const t of this._behaviors)
      if (t.name === e)
        return t;
    return null;
  }
  /**
   * Returns the latest update of the World matrix
   * @returns a Matrix
   */
  getWorldMatrix() {
    return this._currentRenderId !== this._scene.getRenderId() && this.computeWorldMatrix(), this._worldMatrix;
  }
  /** @internal */
  _getWorldMatrixDeterminant() {
    return this._worldMatrixDeterminantIsDirty && (this._worldMatrixDeterminantIsDirty = !1, this._worldMatrixDeterminant = this._worldMatrix.determinant()), this._worldMatrixDeterminant;
  }
  /**
   * Returns directly the latest state of the mesh World matrix.
   * A Matrix is returned.
   */
  get worldMatrixFromCache() {
    return this._worldMatrix;
  }
  // override it in derived class if you add new variables to the cache
  // and call the parent class method
  /** @internal */
  _initCache() {
    this._cache = {};
  }
  /**
   * @internal
   */
  updateCache(e) {
    !e && this.isSynchronized() || this._updateCache();
  }
  /**
   * @internal
   */
  _getActionManagerForTrigger(e, t = !0) {
    return this.parent ? this.parent._getActionManagerForTrigger(e, !1) : null;
  }
  // override it in derived class if you add new variables to the cache
  // and call the parent class method if !ignoreParentClass
  /**
   * @internal
   */
  _updateCache(e) {
  }
  // override it in derived class if you add new variables to the cache
  /** @internal */
  _isSynchronized() {
    return !0;
  }
  /** @internal */
  _markSyncedWithParent() {
    this._parentNode && (this._parentUpdateId = this._parentNode._childUpdateId);
  }
  /** @internal */
  isSynchronizedWithParent() {
    return this._parentNode ? this._parentNode._isDirty || this._parentUpdateId !== this._parentNode._childUpdateId ? !1 : this._parentNode.isSynchronized() : !0;
  }
  /** @internal */
  isSynchronized() {
    return this._parentNode && !this.isSynchronizedWithParent() ? !1 : this._isSynchronized();
  }
  /**
   * Is this node ready to be used/rendered
   * @param _completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
   * @returns true if the node is ready
   */
  isReady(e = !1) {
    return this._nodeDataStorage._isReady;
  }
  /**
   * Flag the  node as dirty (Forcing it to update everything)
   * @param _property helps children apply precise "dirtyfication"
   * @returns this node
   */
  markAsDirty(e) {
    return this._currentRenderId = Number.MAX_VALUE, this._isDirty = !0, this;
  }
  /**
   * Is this node enabled?
   * If the node has a parent, all ancestors will be checked and false will be returned if any are false (not enabled), otherwise will return true
   * @param checkAncestors indicates if this method should check the ancestors. The default is to check the ancestors. If set to false, the method will return the value of this node without checking ancestors
   * @returns whether this node (and its parent) is enabled
   */
  isEnabled(e = !0) {
    return e === !1 ? this._nodeDataStorage._isEnabled : this._nodeDataStorage._isEnabled ? this._nodeDataStorage._isParentEnabled : !1;
  }
  /** @internal */
  _syncParentEnabledState() {
    this._nodeDataStorage._isParentEnabled = this._parentNode ? this._parentNode.isEnabled() : !0, this._children && this._children.forEach((e) => {
      e._syncParentEnabledState();
    });
  }
  /**
   * Set the enabled state of this node
   * @param value defines the new enabled state
   */
  setEnabled(e) {
    this._nodeDataStorage._isEnabled !== e && (this._nodeDataStorage._isEnabled = e, this._syncParentEnabledState(), this._nodeDataStorage._onEnabledStateChangedObservable.notifyObservers(e));
  }
  /**
   * Is this node a descendant of the given node?
   * The function will iterate up the hierarchy until the ancestor was found or no more parents defined
   * @param ancestor defines the parent node to inspect
   * @returns a boolean indicating if this node is a descendant of the given node
   */
  isDescendantOf(e) {
    return this.parent ? this.parent === e ? !0 : this.parent.isDescendantOf(e) : !1;
  }
  /**
   * @internal
   */
  _getDescendants(e, t = !1, n) {
    if (this._children)
      for (let i = 0; i < this._children.length; i++) {
        const s = this._children[i];
        (!n || n(s)) && e.push(s), t || s._getDescendants(e, !1, n);
      }
  }
  /**
   * Will return all nodes that have this node as ascendant
   * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
   * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
   * @returns all children nodes of all types
   */
  getDescendants(e, t) {
    const n = [];
    return this._getDescendants(n, e, t), n;
  }
  /**
   * Get all child-meshes of this node
   * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: false)
   * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
   * @returns an array of AbstractMesh
   */
  getChildMeshes(e, t) {
    const n = [];
    return this._getDescendants(n, e, (i) => (!t || t(i)) && i.cullingStrategy !== void 0), n;
  }
  /**
   * Get all direct children of this node
   * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
   * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered (Default: true)
   * @returns an array of Node
   */
  getChildren(e, t = !0) {
    return this.getDescendants(t, e);
  }
  /**
   * @internal
   */
  _setReady(e) {
    if (e !== this._nodeDataStorage._isReady) {
      if (!e) {
        this._nodeDataStorage._isReady = !1;
        return;
      }
      this.onReady && this.onReady(this), this._nodeDataStorage._isReady = !0;
    }
  }
  /**
   * Get an animation by name
   * @param name defines the name of the animation to look for
   * @returns null if not found else the requested animation
   */
  getAnimationByName(e) {
    for (let t = 0; t < this.animations.length; t++) {
      const n = this.animations[t];
      if (n.name === e)
        return n;
    }
    return null;
  }
  /**
   * Creates an animation range for this node
   * @param name defines the name of the range
   * @param from defines the starting key
   * @param to defines the end key
   */
  createAnimationRange(e, t, n) {
    if (!this._ranges[e]) {
      this._ranges[e] = r._AnimationRangeFactory(e, t, n);
      for (let i = 0, s = this.animations.length; i < s; i++)
        this.animations[i] && this.animations[i].createRange(e, t, n);
    }
  }
  /**
   * Delete a specific animation range
   * @param name defines the name of the range to delete
   * @param deleteFrames defines if animation frames from the range must be deleted as well
   */
  deleteAnimationRange(e, t = !0) {
    for (let n = 0, i = this.animations.length; n < i; n++)
      this.animations[n] && this.animations[n].deleteRange(e, t);
    this._ranges[e] = null;
  }
  /**
   * Get an animation range by name
   * @param name defines the name of the animation range to look for
   * @returns null if not found else the requested animation range
   */
  getAnimationRange(e) {
    return this._ranges[e] || null;
  }
  /**
   * Clone the current node
   * @param name Name of the new clone
   * @param newParent New parent for the clone
   * @param doNotCloneChildren Do not clone children hierarchy
   * @returns the new transform node
   */
  clone(e, t, n) {
    const i = N.Clone(() => new r(e, this.getScene()), this);
    if (t && (i.parent = t), !n) {
      const s = this.getDescendants(!0);
      for (let a = 0; a < s.length; a++) {
        const _ = s[a];
        _.clone(e + "." + _.name, i);
      }
    }
    return i;
  }
  /**
   * Gets the list of all animation ranges defined on this node
   * @returns an array
   */
  getAnimationRanges() {
    const e = [];
    let t;
    for (t in this._ranges)
      e.push(this._ranges[t]);
    return e;
  }
  /**
   * Will start the animation sequence
   * @param name defines the range frames for animation sequence
   * @param loop defines if the animation should loop (false by default)
   * @param speedRatio defines the speed factor in which to run the animation (1 by default)
   * @param onAnimationEnd defines a function to be executed when the animation ended (undefined by default)
   * @returns the object created for this animation. If range does not exist, it will return null
   */
  beginAnimation(e, t, n, i) {
    const s = this.getAnimationRange(e);
    return s ? this._scene.beginAnimation(this, s.from, s.to, t, n, i) : null;
  }
  /**
   * Serialize animation ranges into a JSON compatible object
   * @returns serialization object
   */
  serializeAnimationRanges() {
    const e = [];
    for (const t in this._ranges) {
      const n = this._ranges[t];
      if (!n)
        continue;
      const i = {};
      i.name = t, i.from = n.from, i.to = n.to, e.push(i);
    }
    return e;
  }
  /**
   * Computes the world matrix of the node
   * @param _force defines if the cache version should be invalidated forcing the world matrix to be created from scratch
   * @returns the world matrix
   */
  computeWorldMatrix(e) {
    return this._worldMatrix || (this._worldMatrix = g.Identity()), this._worldMatrix;
  }
  /**
   * Releases resources associated with this node.
   * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
   * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
   */
  dispose(e, t = !1) {
    if (this._nodeDataStorage._isDisposed = !0, !e) {
      const n = this.getDescendants(!0);
      for (const i of n)
        i.dispose(e, t);
    }
    this.parent ? this.parent = null : this._removeFromSceneRootNodes(), this.onDisposeObservable.notifyObservers(this), this.onDisposeObservable.clear(), this.onEnabledStateChangedObservable.clear(), this.onClonedObservable.clear();
    for (const n of this._behaviors)
      n.detach();
    this._behaviors.length = 0, this.metadata = null;
  }
  /**
   * Parse animation range data from a serialization object and store them into a given node
   * @param node defines where to store the animation ranges
   * @param parsedNode defines the serialization object to read data from
   * @param _scene defines the hosting scene
   */
  static ParseAnimationRanges(e, t, n) {
    if (t.ranges)
      for (let i = 0; i < t.ranges.length; i++) {
        const s = t.ranges[i];
        e.createAnimationRange(s.name, s.from, s.to);
      }
  }
  /**
   * Return the minimum and maximum world vectors of the entire hierarchy under current node
   * @param includeDescendants Include bounding info from descendants as well (true by default)
   * @param predicate defines a callback function that can be customize to filter what meshes should be included in the list used to compute the bounding vectors
   * @returns the new bounding vectors
   */
  getHierarchyBoundingVectors(e = !0, t = null) {
    this.getScene().incrementRenderId(), this.computeWorldMatrix(!0);
    let n, i;
    const s = this;
    if (s.getBoundingInfo && s.subMeshes) {
      const a = s.getBoundingInfo();
      n = a.boundingBox.minimumWorld.clone(), i = a.boundingBox.maximumWorld.clone();
    } else
      n = new l(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE), i = new l(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    if (e) {
      const a = this.getDescendants(!1);
      for (const _ of a) {
        const o = _;
        if (o.computeWorldMatrix(!0), t && !t(o) || !o.getBoundingInfo || o.getTotalVertices() === 0)
          continue;
        const u = o.getBoundingInfo().boundingBox, m = u.minimumWorld, p = u.maximumWorld;
        l.CheckExtends(m, n, i), l.CheckExtends(p, n, i);
      }
    }
    return {
      min: n,
      max: i
    };
  }
}
r._AnimationRangeFactory = (f, e, t) => {
  throw D("AnimationRange");
};
r._NodeConstructors = {};
d([
  h()
], r.prototype, "name", void 0);
d([
  h()
], r.prototype, "id", void 0);
d([
  h()
], r.prototype, "uniqueId", void 0);
d([
  h()
], r.prototype, "state", void 0);
d([
  h()
], r.prototype, "metadata", void 0);
export {
  r as N
};
//# sourceMappingURL=node-DnA4WCA2.js.map
