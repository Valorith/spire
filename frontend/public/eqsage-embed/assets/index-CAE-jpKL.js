import { d as we, L as v, T as $, aJ as Mi, O as B, aK as Bn, n as Oi, o as Ii, M as S, i as J, D as Pi, a as N, b as Z, c as Y, ab as Si, e as es, Q as ie, F as Ri, V as M, H as Li, h as j, I as Di, aL as ki, U as Bi, a1 as Fi, w as Vi, aM as wn, _ as $i, m as me, R as g, g as ge, v as xe, C as An } from "./embed-entry-BgvWRWVI.js";
import { C as Ss } from "./camera-Dl5MzTd7.js";
import { a as Gi } from "./freeCamera-BbW2WQtJ.js";
import { g as Mn, A as x, f as Ui } from "./animation-BgJaKPHn.js";
import { B as Rs } from "./bone-BHzaM7jv.js";
import { R as On } from "./rawTexture-D2iZf32-.js";
import { M as oe } from "./material-DxrSWpK2.js";
import { P as F } from "./pbrMaterial-CglnQqaf.js";
import { T as G } from "./texture-CF8YkJua.js";
import { TransformNode as Ts } from "./transformNode-CxtzTbrg.js";
import { A as xs } from "./abstractMesh-leBV3i4h.js";
import { M as be } from "./mesh-DLjlGcQU.js";
import { M as Fn, C as qi } from "./thinInstanceMesh-BGfOcBMo.js";
import { S as Hi } from "./smartArray-BXymNR-c.js";
import { SceneLoader as In } from "./sceneLoader-BnW1sH6R.js";
import { A as Vn } from "./scene-BUYFxCaC.js";
import { I as Wi } from "./instancedMesh-DKLh9WD_.js";
import { Light as is } from "./light-Cr4zCM_w.js";
import { a as Ki, S as ji } from "./baseTexture.polynomial-BuwMZjCa.js";
import { S as zi } from "./decorators.serialization-C2D-FLnh.js";
import { _ as Zi } from "./environmentTextureTools-COwGsGQy.js";
import { CubeTexture as Yi } from "./cubeTexture-B8fRJY_1.js";
import { N as $n } from "./node-DnA4WCA2.js";
import { S as Gn } from "./shadowLight-B-w8EVGc.js";
import { PointLight as Xi } from "./pointLight-BsSWHEfo.js";
import { R as Ji } from "./renderTargetTexture-BcDR5pJ7.js";
import { E as b } from "./engine-BUHA6kNQ.js";
import { PointerEventTypes as Qi } from "./pointerEvents-BbNEJSOj.js";
import { A as er } from "./timer-Bos76nou.js";
class tr extends Vn {
}
class sr {
  constructor() {
    this.rootNodes = [], this.skeletons = [], this.animationGroups = [];
  }
  /**
   * Disposes the instantiated entries from the scene
   */
  dispose() {
    this.rootNodes.slice(0).forEach((e) => {
      e.dispose();
    }), this.rootNodes.length = 0, this.skeletons.slice(0).forEach((e) => {
      e.dispose();
    }), this.skeletons.length = 0, this.animationGroups.slice(0).forEach((e) => {
      e.dispose();
    }), this.animationGroups.length = 0;
  }
}
class nr extends Vn {
  /**
   * Instantiates an AssetContainer.
   * @param scene The scene the AssetContainer belongs to.
   */
  constructor(e) {
    super(), this._wasAddedToScene = !1, e = e || we.LastCreatedScene, e && (this.scene = e, this.sounds = [], this.effectLayers = [], this.layers = [], this.lensFlareSystems = [], this.proceduralTextures = [], this.reflectionProbes = [], e.onDisposeObservable.add(() => {
      this._wasAddedToScene || this.dispose();
    }), this._onContextRestoredObserver = e.getEngine().onContextRestoredObservable.add(() => {
      for (const t of this.geometries)
        t._rebuild();
      for (const t of this.meshes)
        t._rebuild();
      for (const t of this.particleSystems)
        t.rebuild();
      for (const t of this.textures)
        t._rebuild();
    }));
  }
  /**
   * Given a list of nodes, return a topological sorting of them.
   * @param nodes
   * @returns a sorted array of nodes
   */
  _topologicalSort(e) {
    const t = /* @__PURE__ */ new Map();
    for (const o of e)
      t.set(o.uniqueId, o);
    const s = {
      dependsOn: /* @__PURE__ */ new Map(),
      dependedBy: /* @__PURE__ */ new Map()
      // given a node id, what are the ids of the nodes that depend on it
    };
    for (const o of e) {
      const l = o.uniqueId;
      s.dependsOn.set(l, /* @__PURE__ */ new Set()), s.dependedBy.set(l, /* @__PURE__ */ new Set());
    }
    for (const o of e) {
      const l = o.uniqueId, h = s.dependsOn.get(l);
      if (o instanceof Wi) {
        const c = o.sourceMesh;
        t.has(c.uniqueId) && (h.add(c.uniqueId), s.dependedBy.get(c.uniqueId).add(l));
      }
      const u = s.dependedBy.get(l);
      for (const c of o.getDescendants()) {
        const d = c.uniqueId;
        t.has(d) && (u.add(d), s.dependsOn.get(d).add(l));
      }
    }
    const n = [], i = [];
    for (const o of e) {
      const l = o.uniqueId;
      s.dependsOn.get(l).size === 0 && (i.push(o), t.delete(l));
    }
    const r = i;
    for (; r.length > 0; ) {
      const o = r.shift();
      n.push(o);
      const l = s.dependedBy.get(o.uniqueId);
      for (const h of Array.from(l.values())) {
        const u = s.dependsOn.get(h);
        u.delete(o.uniqueId), u.size === 0 && t.get(h) && (r.push(t.get(h)), t.delete(h));
      }
    }
    return t.size > 0 && (v.Error("SceneSerializer._topologicalSort: There were unvisited nodes:"), t.forEach((o) => v.Error(o.name))), n;
  }
  _addNodeAndDescendantsToList(e, t, s, n) {
    if (!(!s || n && !n(s) || t.has(s.uniqueId))) {
      e.push(s), t.add(s.uniqueId);
      for (const i of s.getDescendants(!0))
        this._addNodeAndDescendantsToList(e, t, i, n);
    }
  }
  /**
   * Check if a specific node is contained in this asset container.
   * @param node the node to check
   * @returns true if the node is contained in this container, otherwise false.
   */
  _isNodeInContainer(e) {
    return e instanceof xs && this.meshes.indexOf(e) !== -1 || e instanceof Ts && this.transformNodes.indexOf(e) !== -1 || e instanceof is && this.lights.indexOf(e) !== -1 || e instanceof Ss && this.cameras.indexOf(e) !== -1;
  }
  /**
   * For every node in the scene, check if its parent node is also in the scene.
   * @returns true if every node's parent is also in the scene, otherwise false.
   */
  _isValidHierarchy() {
    for (const e of this.meshes)
      if (e.parent && !this._isNodeInContainer(e.parent))
        return v.Warn(`Node ${e.name} has a parent that is not in the container.`), !1;
    for (const e of this.transformNodes)
      if (e.parent && !this._isNodeInContainer(e.parent))
        return v.Warn(`Node ${e.name} has a parent that is not in the container.`), !1;
    for (const e of this.lights)
      if (e.parent && !this._isNodeInContainer(e.parent))
        return v.Warn(`Node ${e.name} has a parent that is not in the container.`), !1;
    for (const e of this.cameras)
      if (e.parent && !this._isNodeInContainer(e.parent))
        return v.Warn(`Node ${e.name} has a parent that is not in the container.`), !1;
    return !0;
  }
  /**
   * Instantiate or clone all meshes and add the new ones to the scene.
   * Skeletons and animation groups will all be cloned
   * @param nameFunction defines an optional function used to get new names for clones
   * @param cloneMaterials defines an optional boolean that defines if materials must be cloned as well (false by default)
   * @param options defines an optional list of options to control how to instantiate / clone models
   * @param options.doNotInstantiate defines if the model must be instantiated or just cloned
   * @param options.predicate defines a predicate used to filter whih mesh to instantiate/clone
   * @returns a list of rootNodes, skeletons and animation groups that were duplicated
   */
  instantiateModelsToScene(e, t = !1, s) {
    this._isValidHierarchy() || $.Warn("SceneSerializer.InstantiateModelsToScene: The Asset Container hierarchy is not valid.");
    const n = {}, i = {}, r = new sr(), o = [], l = [], h = {
      doNotInstantiate: !0,
      ...s
    }, u = (m, p) => {
      if (n[m.uniqueId] = p.uniqueId, i[p.uniqueId] = p, e && (p.name = e(m.name)), p instanceof be) {
        const C = p;
        if (C.morphTargetManager) {
          const w = m.morphTargetManager;
          C.morphTargetManager = w.clone();
          for (let O = 0; O < w.numTargets; O++) {
            const I = w.getTarget(O), V = C.morphTargetManager.getTarget(O);
            n[I.uniqueId] = V.uniqueId, i[V.uniqueId] = V;
          }
        }
      }
    }, c = [], d = /* @__PURE__ */ new Set();
    for (const m of this.transformNodes)
      m.parent === null && this._addNodeAndDescendantsToList(c, d, m, h.predicate);
    for (const m of this.meshes)
      m.parent === null && this._addNodeAndDescendantsToList(c, d, m, h.predicate);
    const y = this._topologicalSort(c), T = (m, p) => {
      if (u(m, p), m.parent) {
        const C = n[m.parent.uniqueId], w = i[C];
        w ? p.parent = w : p.parent = m.parent;
      }
      if (p.position && m.position && p.position.copyFrom(m.position), p.rotationQuaternion && m.rotationQuaternion && p.rotationQuaternion.copyFrom(m.rotationQuaternion), p.rotation && m.rotation && p.rotation.copyFrom(m.rotation), p.scaling && m.scaling && p.scaling.copyFrom(m.scaling), p.material) {
        const C = p;
        if (C.material)
          if (t) {
            const w = m.material;
            if (l.indexOf(w) === -1) {
              let O = w.clone(e ? e(w.name) : "Clone of " + w.name);
              if (l.push(w), n[w.uniqueId] = O.uniqueId, i[O.uniqueId] = O, w.getClassName() === "MultiMaterial") {
                const I = w;
                for (const V of I.subMaterials)
                  V && (O = V.clone(e ? e(V.name) : "Clone of " + V.name), l.push(V), n[V.uniqueId] = O.uniqueId, i[O.uniqueId] = O);
                I.subMaterials = I.subMaterials.map((V) => V && i[n[V.uniqueId]]);
              }
            }
            C.getClassName() !== "InstancedMesh" && (C.material = i[n[w.uniqueId]]);
          } else
            C.material.getClassName() === "MultiMaterial" ? this.scene.multiMaterials.indexOf(C.material) === -1 && this.scene.addMultiMaterial(C.material) : this.scene.materials.indexOf(C.material) === -1 && this.scene.addMaterial(C.material);
      }
      p.parent === null && r.rootNodes.push(p);
    };
    return y.forEach((m) => {
      if (m.getClassName() === "InstancedMesh") {
        const p = m, C = p.sourceMesh, w = n[C.uniqueId], I = (typeof w == "number" ? i[w] : C).createInstance(p.name);
        T(p, I);
      } else {
        let p = !0;
        m.getClassName() === "TransformNode" || m.getClassName() === "Node" || m.skeleton || !m.getTotalVertices || m.getTotalVertices() === 0 ? p = !1 : h.doNotInstantiate && (typeof h.doNotInstantiate == "function" ? p = !h.doNotInstantiate(m) : p = !h.doNotInstantiate);
        const C = p ? m.createInstance(`instance of ${m.name}`) : m.clone(`Clone of ${m.name}`, null, !0);
        if (!C)
          throw new Error(`Could not clone or instantiate node on Asset Container ${m.name}`);
        T(m, C);
      }
    }), this.skeletons.forEach((m) => {
      if (h.predicate && !h.predicate(m))
        return;
      const p = m.clone(e ? e(m.name) : "Clone of " + m.name);
      for (const C of this.meshes)
        if (C.skeleton === m && !C.isAnInstance) {
          const w = i[n[C.uniqueId]];
          if (!w || w.isAnInstance || (w.skeleton = p, o.indexOf(p) !== -1))
            continue;
          o.push(p);
          for (const O of p.bones)
            O._linkedTransformNode && (O._linkedTransformNode = i[n[O._linkedTransformNode.uniqueId]]);
        }
      r.skeletons.push(p);
    }), this.animationGroups.forEach((m) => {
      if (h.predicate && !h.predicate(m))
        return;
      const p = m.clone(e ? e(m.name) : "Clone of " + m.name, (C) => i[n[C.uniqueId]] || C);
      r.animationGroups.push(p);
    }), r;
  }
  /**
   * Adds all the assets from the container to the scene.
   */
  addAllToScene() {
    if (!this._wasAddedToScene) {
      this._isValidHierarchy() || $.Warn("SceneSerializer.addAllToScene: The Asset Container hierarchy is not valid."), this._wasAddedToScene = !0, this.addToScene(null), this.environmentTexture && (this.scene.environmentTexture = this.environmentTexture);
      for (const e of this.scene._serializableComponents)
        e.addFromContainer(this);
      this.scene.getEngine().onContextRestoredObservable.remove(this._onContextRestoredObserver), this._onContextRestoredObserver = null;
    }
  }
  /**
   * Adds assets from the container to the scene.
   * @param predicate defines a predicate used to select which entity will be added (can be null)
   */
  addToScene(e = null) {
    const t = [];
    this.cameras.forEach((s) => {
      e && !e(s) || (this.scene.addCamera(s), t.push(s));
    }), this.lights.forEach((s) => {
      e && !e(s) || (this.scene.addLight(s), t.push(s));
    }), this.meshes.forEach((s) => {
      e && !e(s) || (this.scene.addMesh(s), t.push(s));
    }), this.skeletons.forEach((s) => {
      e && !e(s) || this.scene.addSkeleton(s);
    }), this.animations.forEach((s) => {
      e && !e(s) || this.scene.addAnimation(s);
    }), this.animationGroups.forEach((s) => {
      e && !e(s) || this.scene.addAnimationGroup(s);
    }), this.multiMaterials.forEach((s) => {
      e && !e(s) || this.scene.addMultiMaterial(s);
    }), this.materials.forEach((s) => {
      e && !e(s) || this.scene.addMaterial(s);
    }), this.morphTargetManagers.forEach((s) => {
      e && !e(s) || this.scene.addMorphTargetManager(s);
    }), this.geometries.forEach((s) => {
      e && !e(s) || this.scene.addGeometry(s);
    }), this.transformNodes.forEach((s) => {
      e && !e(s) || (this.scene.addTransformNode(s), t.push(s));
    }), this.actionManagers.forEach((s) => {
      e && !e(s) || this.scene.addActionManager(s);
    }), this.textures.forEach((s) => {
      e && !e(s) || this.scene.addTexture(s);
    }), this.reflectionProbes.forEach((s) => {
      e && !e(s) || this.scene.addReflectionProbe(s);
    });
    for (const s of t)
      s.parent && this.scene.getNodes().indexOf(s.parent) === -1 && (s.setParent ? s.setParent(null) : s.parent = null);
  }
  /**
   * Removes all the assets in the container from the scene
   */
  removeAllFromScene() {
    this._isValidHierarchy() || $.Warn("SceneSerializer.removeAllFromScene: The Asset Container hierarchy is not valid."), this._wasAddedToScene = !1, this.removeFromScene(null), this.environmentTexture === this.scene.environmentTexture && (this.scene.environmentTexture = null);
    for (const e of this.scene._serializableComponents)
      e.removeFromContainer(this);
  }
  /**
   * Removes assets in the container from the scene
   * @param predicate defines a predicate used to select which entity will be added (can be null)
   */
  removeFromScene(e = null) {
    this.cameras.forEach((t) => {
      e && !e(t) || this.scene.removeCamera(t);
    }), this.lights.forEach((t) => {
      e && !e(t) || this.scene.removeLight(t);
    }), this.meshes.forEach((t) => {
      e && !e(t) || this.scene.removeMesh(t, !0);
    }), this.skeletons.forEach((t) => {
      e && !e(t) || this.scene.removeSkeleton(t);
    }), this.animations.forEach((t) => {
      e && !e(t) || this.scene.removeAnimation(t);
    }), this.animationGroups.forEach((t) => {
      e && !e(t) || this.scene.removeAnimationGroup(t);
    }), this.multiMaterials.forEach((t) => {
      e && !e(t) || this.scene.removeMultiMaterial(t);
    }), this.materials.forEach((t) => {
      e && !e(t) || this.scene.removeMaterial(t);
    }), this.morphTargetManagers.forEach((t) => {
      e && !e(t) || this.scene.removeMorphTargetManager(t);
    }), this.geometries.forEach((t) => {
      e && !e(t) || this.scene.removeGeometry(t);
    }), this.transformNodes.forEach((t) => {
      e && !e(t) || this.scene.removeTransformNode(t);
    }), this.actionManagers.forEach((t) => {
      e && !e(t) || this.scene.removeActionManager(t);
    }), this.textures.forEach((t) => {
      e && !e(t) || this.scene.removeTexture(t);
    }), this.reflectionProbes.forEach((t) => {
      e && !e(t) || this.scene.removeReflectionProbe(t);
    });
  }
  /**
   * Disposes all the assets in the container
   */
  dispose() {
    this.cameras.slice(0).forEach((e) => {
      e.dispose();
    }), this.cameras.length = 0, this.lights.slice(0).forEach((e) => {
      e.dispose();
    }), this.lights.length = 0, this.meshes.slice(0).forEach((e) => {
      e.dispose();
    }), this.meshes.length = 0, this.skeletons.slice(0).forEach((e) => {
      e.dispose();
    }), this.skeletons.length = 0, this.animationGroups.slice(0).forEach((e) => {
      e.dispose();
    }), this.animationGroups.length = 0, this.multiMaterials.slice(0).forEach((e) => {
      e.dispose();
    }), this.multiMaterials.length = 0, this.materials.slice(0).forEach((e) => {
      e.dispose();
    }), this.materials.length = 0, this.geometries.slice(0).forEach((e) => {
      e.dispose();
    }), this.geometries.length = 0, this.transformNodes.slice(0).forEach((e) => {
      e.dispose();
    }), this.transformNodes.length = 0, this.actionManagers.slice(0).forEach((e) => {
      e.dispose();
    }), this.actionManagers.length = 0, this.textures.slice(0).forEach((e) => {
      e.dispose();
    }), this.textures.length = 0, this.reflectionProbes.slice(0).forEach((e) => {
      e.dispose();
    }), this.reflectionProbes.length = 0, this.morphTargetManagers.slice(0).forEach((e) => {
      e.dispose();
    }), this.morphTargetManagers.length = 0, this.environmentTexture && (this.environmentTexture.dispose(), this.environmentTexture = null);
    for (const e of this.scene._serializableComponents)
      e.removeFromContainer(this, !0);
    this._onContextRestoredObserver && (this.scene.getEngine().onContextRestoredObservable.remove(this._onContextRestoredObserver), this._onContextRestoredObserver = null);
  }
  _moveAssets(e, t, s) {
    if (!(!e || !t))
      for (const n of e) {
        let i = !0;
        if (s) {
          for (const r of s)
            if (n === r) {
              i = !1;
              break;
            }
        }
        i && (t.push(n), n._parentContainer = this);
      }
  }
  /**
   * Removes all the assets contained in the scene and adds them to the container.
   * @param keepAssets Set of assets to keep in the scene. (default: empty)
   */
  moveAllFromScene(e) {
    this._wasAddedToScene = !1, e === void 0 && (e = new tr());
    for (const t in this)
      Object.prototype.hasOwnProperty.call(this, t) && (this[t] = this[t] || (t === "_environmentTexture" ? null : []), this._moveAssets(this.scene[t], this[t], e[t]));
    this.environmentTexture = this.scene.environmentTexture, this.removeAllFromScene();
  }
  /**
   * Adds all meshes in the asset container to a root mesh that can be used to position all the contained meshes. The root mesh is then added to the front of the meshes in the assetContainer.
   * @returns the root mesh
   */
  createRootMesh() {
    const e = new be("assetContainerRootMesh", this.scene);
    return this.meshes.forEach((t) => {
      t.parent || e.addChild(t);
    }), this.meshes.unshift(e), e;
  }
  /**
   * Merge animations (direct and animation groups) from this asset container into a scene
   * @param scene is the instance of BABYLON.Scene to append to (default: last created scene)
   * @param animatables set of animatables to retarget to a node from the scene
   * @param targetConverter defines a function used to convert animation targets from the asset container to the scene (default: search node by name)
   * @returns an array of the new AnimationGroup added to the scene (empty array if none)
   */
  mergeAnimationsTo(e = we.LastCreatedScene, t, s = null) {
    if (!e)
      return v.Error("No scene available to merge animations to"), [];
    const n = s || ((o) => {
      let l = null;
      const h = o.animations.length ? o.animations[0].targetProperty : "", u = o.name.split(".").join("").split("_primitive")[0];
      switch (h) {
        case "position":
        case "rotationQuaternion":
          l = e.getTransformNodeByName(o.name) || e.getTransformNodeByName(u);
          break;
        case "influence":
          l = e.getMorphTargetByName(o.name) || e.getMorphTargetByName(u);
          break;
        default:
          l = e.getNodeByName(o.name) || e.getNodeByName(u);
      }
      return l;
    });
    this.getNodes().forEach((o) => {
      const l = n(o);
      if (l !== null) {
        for (const h of o.animations) {
          const u = l.animations.filter((c) => c.targetProperty === h.targetProperty);
          for (const c of u) {
            const d = l.animations.indexOf(c, 0);
            d > -1 && l.animations.splice(d, 1);
          }
        }
        l.animations = l.animations.concat(o.animations);
      }
    });
    const r = [];
    return this.animationGroups.slice().forEach((o) => {
      r.push(o.clone(o.name, n)), o.animatables.forEach((l) => {
        l.stop();
      });
    }), t.forEach((o) => {
      const l = n(o.target);
      l && (e.beginAnimation(l, o.fromFrame, o.toFrame, o.loopAnimation, o.speedRatio, o.onAnimationEnd ? o.onAnimationEnd : void 0, void 0, !0, void 0, o.onAnimationLoop ? o.onAnimationLoop : void 0), e.stopAnimation(o.target));
    }), r;
  }
  /**
   * @since 6.15.0
   * This method checks for any node that has no parent
   * and is not in the rootNodes array, and adds the node
   * there, if so.
   */
  populateRootNodes() {
    this.rootNodes.length = 0, this.meshes.forEach((e) => {
      !e.parent && this.rootNodes.indexOf(e) === -1 && this.rootNodes.push(e);
    }), this.transformNodes.forEach((e) => {
      !e.parent && this.rootNodes.indexOf(e) === -1 && this.rootNodes.push(e);
    }), this.lights.forEach((e) => {
      !e.parent && this.rootNodes.indexOf(e) === -1 && this.rootNodes.push(e);
    }), this.cameras.forEach((e) => {
      !e.parent && this.rootNodes.indexOf(e) === -1 && this.rootNodes.push(e);
    });
  }
  /**
   * @since 6.26.0
   * Given a root asset, this method will traverse its hierarchy and add it, its children and any materials/skeletons/animation groups to the container.
   * @param root root node
   */
  addAllAssetsToContainer(e) {
    if (!e)
      return;
    const t = [], s = /* @__PURE__ */ new Set();
    for (t.push(e); t.length > 0; ) {
      const n = t.pop();
      if (n instanceof be ? (n.geometry && this.geometries.indexOf(n.geometry) === -1 && this.geometries.push(n.geometry), this.meshes.push(n)) : n instanceof Ts ? this.transformNodes.push(n) : n instanceof is ? this.lights.push(n) : n instanceof Ss && this.cameras.push(n), n instanceof xs) {
        if (n.material && this.materials.indexOf(n.material) === -1) {
          this.materials.push(n.material);
          for (const i of n.material.getActiveTextures())
            this.textures.indexOf(i) === -1 && this.textures.push(i);
        }
        n.skeleton && this.skeletons.indexOf(n.skeleton) === -1 && this.skeletons.push(n.skeleton), n.morphTargetManager && this.morphTargetManagers.indexOf(n.morphTargetManager) === -1 && this.morphTargetManagers.push(n.morphTargetManager);
      }
      for (const i of n.getChildren())
        s.has(i) || t.push(i);
      s.add(n);
    }
    this.populateRootNodes();
  }
}
class As {
  /**
   * Constructor
   * @param buffer The buffer to read
   */
  constructor(e) {
    this.byteOffset = 0, this.buffer = e;
  }
  /**
   * Loads the given byte length.
   * @param byteLength The byte length to load
   * @returns A promise that resolves when the load is complete
   */
  loadAsync(e) {
    return this.buffer.readAsync(this.byteOffset, e).then((t) => {
      this._dataView = new DataView(t.buffer, t.byteOffset, t.byteLength), this._dataByteOffset = 0;
    });
  }
  /**
   * Read a unsigned 32-bit integer from the currently loaded data range.
   * @returns The 32-bit integer read
   */
  readUint32() {
    const e = this._dataView.getUint32(this._dataByteOffset, !0);
    return this._dataByteOffset += 4, this.byteOffset += 4, e;
  }
  /**
   * Read a byte array from the currently loaded data range.
   * @param byteLength The byte length to read
   * @returns The byte array read
   */
  readUint8Array(e) {
    const t = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._dataByteOffset, e);
    return this._dataByteOffset += e, this.byteOffset += e, t;
  }
  /**
   * Read a string from the currently loaded data range.
   * @param byteLength The byte length to read
   * @returns The string read
   */
  readString(e) {
    return Mi(this.readUint8Array(e));
  }
  /**
   * Skips the given byte length the currently loaded data range.
   * @param byteLength The byte length to skip
   */
  skipBytes(e) {
    this._dataByteOffset += e, this.byteOffset += e;
  }
}
function Ls(a, e, t, s) {
  const n = {
    externalResourceFunction: s
  };
  return t && (n.uri = e === "file:" ? t : e + t), ArrayBuffer.isView(a) ? GLTFValidator.validateBytes(a, n) : GLTFValidator.validateString(a, n);
}
function ir() {
  const a = [];
  onmessage = (e) => {
    const t = e.data;
    switch (t.id) {
      case "init": {
        importScripts(t.url);
        break;
      }
      case "validate": {
        Ls(t.data, t.rootUrl, t.fileName, (s) => new Promise((n, i) => {
          const r = a.length;
          a.push({ resolve: n, reject: i }), postMessage({ id: "getExternalResource", index: r, uri: s });
        })).then((s) => {
          postMessage({ id: "validate.resolve", value: s });
        }, (s) => {
          postMessage({ id: "validate.reject", reason: s });
        });
        break;
      }
      case "getExternalResource.resolve": {
        a[t.index].resolve(t.value);
        break;
      }
      case "getExternalResource.reject": {
        a[t.index].reject(t.reason);
        break;
      }
    }
  };
}
class Un {
  /**
   * Validate a glTF asset using the glTF-Validator.
   * @param data The JSON of a glTF or the array buffer of a binary glTF
   * @param rootUrl The root url for the glTF
   * @param fileName The file name for the glTF
   * @param getExternalResource The callback to get external resources for the glTF validator
   * @returns A promise that resolves with the glTF validation results once complete
   */
  static ValidateAsync(e, t, s, n) {
    return typeof Worker == "function" ? new Promise((i, r) => {
      const o = `${Ls}(${ir})()`, l = URL.createObjectURL(new Blob([o], { type: "application/javascript" })), h = new Worker(l), u = (d) => {
        h.removeEventListener("error", u), h.removeEventListener("message", c), r(d);
      }, c = (d) => {
        const y = d.data;
        switch (y.id) {
          case "getExternalResource": {
            n(y.uri).then((T) => {
              h.postMessage({ id: "getExternalResource.resolve", index: y.index, value: T }, [T.buffer]);
            }, (T) => {
              h.postMessage({ id: "getExternalResource.reject", index: y.index, reason: T });
            });
            break;
          }
          case "validate.resolve": {
            h.removeEventListener("error", u), h.removeEventListener("message", c), i(y.value), h.terminate();
            break;
          }
          case "validate.reject":
            h.removeEventListener("error", u), h.removeEventListener("message", c), r(y.reason), h.terminate();
        }
      };
      if (h.addEventListener("error", u), h.addEventListener("message", c), h.postMessage({ id: "init", url: $.GetBabylonScriptURL(this.Configuration.url) }), ArrayBuffer.isView(e)) {
        const d = e.slice();
        h.postMessage({ id: "validate", data: d, rootUrl: t, fileName: s }, [d.buffer]);
      } else
        h.postMessage({ id: "validate", data: e, rootUrl: t, fileName: s });
    }) : (this._LoadScriptPromise || (this._LoadScriptPromise = $.LoadBabylonScriptAsync(this.Configuration.url)), this._LoadScriptPromise.then(() => Ls(e, t, s, n)));
  }
}
Un.Configuration = {
  url: `${$._DefaultCdnUrl}/gltf_validator.js`
};
function Pn(a, e, t) {
  try {
    return Promise.resolve(new Uint8Array(a, e, t));
  } catch (s) {
    return Promise.reject(s);
  }
}
function rr(a, e, t) {
  try {
    if (e < 0 || e >= a.byteLength)
      throw new RangeError("Offset is out of range.");
    if (e + t > a.byteLength)
      throw new RangeError("Length is out of range.");
    return Promise.resolve(new Uint8Array(a.buffer, a.byteOffset + e, t));
  } catch (s) {
    return Promise.reject(s);
  }
}
var rs;
(function(a) {
  a[a.AUTO = 0] = "AUTO", a[a.FORCE_RIGHT_HANDED = 1] = "FORCE_RIGHT_HANDED";
})(rs || (rs = {}));
var ve;
(function(a) {
  a[a.NONE = 0] = "NONE", a[a.FIRST = 1] = "FIRST", a[a.ALL = 2] = "ALL";
})(ve || (ve = {}));
var ee;
(function(a) {
  a[a.LOADING = 0] = "LOADING", a[a.READY = 1] = "READY", a[a.COMPLETE = 2] = "COMPLETE";
})(ee || (ee = {}));
class H {
  constructor() {
    this.onParsedObservable = new B(), this.coordinateSystemMode = rs.AUTO, this.animationStartMode = ve.FIRST, this.compileMaterials = !1, this.useClipPlane = !1, this.compileShadowGenerators = !1, this.transparencyAsCoverage = !1, this.useRangeRequests = !1, this.createInstances = !0, this.alwaysComputeBoundingBox = !1, this.loadAllMaterials = !1, this.loadOnlyMaterials = !1, this.skipMaterials = !1, this.useSRGBBuffers = !0, this.targetFps = 60, this.alwaysComputeSkeletonRootNode = !1, this.preprocessUrlAsync = (e) => Promise.resolve(e), this.onMeshLoadedObservable = new B(), this.onSkinLoadedObservable = new B(), this.onTextureLoadedObservable = new B(), this.onMaterialLoadedObservable = new B(), this.onCameraLoadedObservable = new B(), this.onCompleteObservable = new B(), this.onErrorObservable = new B(), this.onDisposeObservable = new B(), this.onExtensionLoadedObservable = new B(), this.validate = !1, this.onValidatedObservable = new B(), this._loader = null, this._state = null, this._requests = new Array(), this.name = "gltf", this.extensions = {
      ".gltf": { isBinary: !1 },
      ".glb": { isBinary: !0 }
    }, this.onLoaderStateChangedObservable = new B(), this._logIndentLevel = 0, this._loggingEnabled = !1, this._log = this._logDisabled, this._capturePerformanceCounters = !1, this._startPerformanceCounter = this._startPerformanceCounterDisabled, this._endPerformanceCounter = this._endPerformanceCounterDisabled;
  }
  /**
   * Raised when the asset has been parsed
   */
  set onParsed(e) {
    this._onParsedObserver && this.onParsedObservable.remove(this._onParsedObserver), this._onParsedObserver = this.onParsedObservable.add(e);
  }
  /**
   * Callback raised when the loader creates a mesh after parsing the glTF properties of the mesh.
   * Note that the callback is called as soon as the mesh object is created, meaning some data may not have been setup yet for this mesh (vertex data, morph targets, material, ...)
   */
  set onMeshLoaded(e) {
    this._onMeshLoadedObserver && this.onMeshLoadedObservable.remove(this._onMeshLoadedObserver), this._onMeshLoadedObserver = this.onMeshLoadedObservable.add(e);
  }
  /**
   * Callback raised when the loader creates a texture after parsing the glTF properties of the texture.
   */
  set onTextureLoaded(e) {
    this._onTextureLoadedObserver && this.onTextureLoadedObservable.remove(this._onTextureLoadedObserver), this._onTextureLoadedObserver = this.onTextureLoadedObservable.add(e);
  }
  /**
   * Callback raised when the loader creates a material after parsing the glTF properties of the material.
   */
  set onMaterialLoaded(e) {
    this._onMaterialLoadedObserver && this.onMaterialLoadedObservable.remove(this._onMaterialLoadedObserver), this._onMaterialLoadedObserver = this.onMaterialLoadedObservable.add(e);
  }
  /**
   * Callback raised when the loader creates a camera after parsing the glTF properties of the camera.
   */
  set onCameraLoaded(e) {
    this._onCameraLoadedObserver && this.onCameraLoadedObservable.remove(this._onCameraLoadedObserver), this._onCameraLoadedObserver = this.onCameraLoadedObservable.add(e);
  }
  /**
   * Callback raised when the asset is completely loaded, immediately before the loader is disposed.
   * For assets with LODs, raised when all of the LODs are complete.
   * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
   */
  set onComplete(e) {
    this._onCompleteObserver && this.onCompleteObservable.remove(this._onCompleteObserver), this._onCompleteObserver = this.onCompleteObservable.add(e);
  }
  /**
   * Callback raised when an error occurs.
   */
  set onError(e) {
    this._onErrorObserver && this.onErrorObservable.remove(this._onErrorObserver), this._onErrorObserver = this.onErrorObservable.add(e);
  }
  /**
   * Callback raised after the loader is disposed.
   */
  set onDispose(e) {
    this._onDisposeObserver && this.onDisposeObservable.remove(this._onDisposeObserver), this._onDisposeObserver = this.onDisposeObservable.add(e);
  }
  /**
   * Callback raised after a loader extension is created.
   */
  set onExtensionLoaded(e) {
    this._onExtensionLoadedObserver && this.onExtensionLoadedObservable.remove(this._onExtensionLoadedObserver), this._onExtensionLoadedObserver = this.onExtensionLoadedObservable.add(e);
  }
  /**
   * Defines if the loader logging is enabled.
   */
  get loggingEnabled() {
    return this._loggingEnabled;
  }
  set loggingEnabled(e) {
    this._loggingEnabled !== e && (this._loggingEnabled = e, this._loggingEnabled ? this._log = this._logEnabled : this._log = this._logDisabled);
  }
  /**
   * Defines if the loader should capture performance counters.
   */
  get capturePerformanceCounters() {
    return this._capturePerformanceCounters;
  }
  set capturePerformanceCounters(e) {
    this._capturePerformanceCounters !== e && (this._capturePerformanceCounters = e, this._capturePerformanceCounters ? (this._startPerformanceCounter = this._startPerformanceCounterEnabled, this._endPerformanceCounter = this._endPerformanceCounterEnabled) : (this._startPerformanceCounter = this._startPerformanceCounterDisabled, this._endPerformanceCounter = this._endPerformanceCounterDisabled));
  }
  /**
   * Callback raised after a loader extension is created.
   */
  set onValidated(e) {
    this._onValidatedObserver && this.onValidatedObservable.remove(this._onValidatedObserver), this._onValidatedObserver = this.onValidatedObservable.add(e);
  }
  /**
   * Disposes the loader, releases resources during load, and cancels any outstanding requests.
   */
  dispose() {
    this._loader && (this._loader.dispose(), this._loader = null);
    for (const e of this._requests)
      e.abort();
    this._requests.length = 0, delete this._progressCallback, this.preprocessUrlAsync = (e) => Promise.resolve(e), this.onMeshLoadedObservable.clear(), this.onSkinLoadedObservable.clear(), this.onTextureLoadedObservable.clear(), this.onMaterialLoadedObservable.clear(), this.onCameraLoadedObservable.clear(), this.onCompleteObservable.clear(), this.onExtensionLoadedObservable.clear(), this.onDisposeObservable.notifyObservers(void 0), this.onDisposeObservable.clear();
  }
  /**
   * @internal
   */
  loadFile(e, t, s, n, i, r, o, l) {
    if (ArrayBuffer.isView(t))
      return this._loadBinary(e, t, s, n, o, l), null;
    this._progressCallback = i;
    const h = t.name || $.GetFilename(t);
    if (r) {
      if (this.useRangeRequests) {
        this.validate && v.Warn("glTF validation is not supported when range requests are enabled");
        const u = {
          abort: () => {
          },
          onCompleteObservable: new B()
        }, c = {
          readAsync: (d, y) => new Promise((T, m) => {
            this._loadFile(e, t, (p) => {
              T(new Uint8Array(p));
            }, !0, (p) => {
              m(p);
            }, (p) => {
              p.setRequestHeader("Range", `bytes=${d}-${d + y - 1}`);
            });
          }),
          byteLength: 0
        };
        return this._unpackBinaryAsync(new As(c)).then((d) => {
          u.onCompleteObservable.notifyObservers(u), n(d);
        }, o ? (d) => o(void 0, d) : void 0), u;
      }
      return this._loadFile(e, t, (u) => {
        this._validate(e, new Uint8Array(u, 0, u.byteLength), s, h), this._unpackBinaryAsync(new As({
          readAsync: (c, d) => Pn(u, c, d),
          byteLength: u.byteLength
        })).then((c) => {
          n(c);
        }, o ? (c) => o(void 0, c) : void 0);
      }, !0, o);
    } else
      return this._loadFile(e, t, (u) => {
        this._validate(e, u, s, h), n({ json: this._parseJson(u) });
      }, !1, o);
  }
  _loadBinary(e, t, s, n, i, r) {
    this._validate(e, new Uint8Array(t.buffer, t.byteOffset, t.byteLength), s, r), this._unpackBinaryAsync(new As({
      readAsync: (o, l) => rr(t, o, l),
      byteLength: t.byteLength
    })).then((o) => {
      n(o);
    }, i ? (o) => i(void 0, o) : void 0);
  }
  /**
   * @internal
   */
  importMeshAsync(e, t, s, n, i, r) {
    return Promise.resolve().then(() => (this.onParsedObservable.notifyObservers(s), this.onParsedObservable.clear(), this._log(`Loading ${r || ""}`), this._loader = this._getLoader(s), this._loader.importMeshAsync(e, t, null, s, n, i, r)));
  }
  /**
   * @internal
   */
  loadAsync(e, t, s, n, i) {
    return Promise.resolve().then(() => (this.onParsedObservable.notifyObservers(t), this.onParsedObservable.clear(), this._log(`Loading ${i || ""}`), this._loader = this._getLoader(t), this._loader.loadAsync(e, t, s, n, i)));
  }
  /**
   * @internal
   */
  loadAssetContainerAsync(e, t, s, n, i) {
    return Promise.resolve().then(() => {
      this.onParsedObservable.notifyObservers(t), this.onParsedObservable.clear(), this._log(`Loading ${i || ""}`), this._loader = this._getLoader(t);
      const r = new nr(e), o = [];
      this.onMaterialLoadedObservable.add((c) => {
        o.push(c);
      });
      const l = [];
      this.onTextureLoadedObservable.add((c) => {
        l.push(c);
      });
      const h = [];
      this.onCameraLoadedObservable.add((c) => {
        h.push(c);
      });
      const u = [];
      return this.onMeshLoadedObservable.add((c) => {
        c.morphTargetManager && u.push(c.morphTargetManager);
      }), this._loader.importMeshAsync(null, e, r, t, s, n, i).then((c) => (Array.prototype.push.apply(r.geometries, c.geometries), Array.prototype.push.apply(r.meshes, c.meshes), Array.prototype.push.apply(r.particleSystems, c.particleSystems), Array.prototype.push.apply(r.skeletons, c.skeletons), Array.prototype.push.apply(r.animationGroups, c.animationGroups), Array.prototype.push.apply(r.materials, o), Array.prototype.push.apply(r.textures, l), Array.prototype.push.apply(r.lights, c.lights), Array.prototype.push.apply(r.transformNodes, c.transformNodes), Array.prototype.push.apply(r.cameras, h), Array.prototype.push.apply(r.morphTargetManagers, u), r));
    });
  }
  /**
   * @internal
   */
  canDirectLoad(e) {
    return e.indexOf("asset") !== -1 && e.indexOf("version") !== -1 || e.startsWith("data:base64," + H._MagicBase64Encoded) || // this is technically incorrect, but will continue to support for backcompat.
    e.startsWith("data:;base64," + H._MagicBase64Encoded) || e.startsWith("data:application/octet-stream;base64," + H._MagicBase64Encoded) || e.startsWith("data:model/gltf-binary;base64," + H._MagicBase64Encoded);
  }
  /**
   * @internal
   */
  directLoad(e, t) {
    if (t.startsWith("base64," + H._MagicBase64Encoded) || // this is technically incorrect, but will continue to support for backcompat.
    t.startsWith(";base64," + H._MagicBase64Encoded) || t.startsWith("application/octet-stream;base64," + H._MagicBase64Encoded) || t.startsWith("model/gltf-binary;base64," + H._MagicBase64Encoded)) {
      const s = Bn(t);
      return this._validate(e, new Uint8Array(s, 0, s.byteLength)), this._unpackBinaryAsync(new As({
        readAsync: (n, i) => Pn(s, n, i),
        byteLength: s.byteLength
      }));
    }
    return this._validate(e, t), Promise.resolve({ json: this._parseJson(t) });
  }
  /** @internal */
  createPlugin() {
    return new H();
  }
  /**
   * The loader state or null if the loader is not active.
   */
  get loaderState() {
    return this._state;
  }
  /**
   * Returns a promise that resolves when the asset is completely loaded.
   * @returns a promise that resolves when the asset is completely loaded.
   */
  whenCompleteAsync() {
    return new Promise((e, t) => {
      this.onCompleteObservable.addOnce(() => {
        e();
      }), this.onErrorObservable.addOnce((s) => {
        t(s);
      });
    });
  }
  /**
   * @internal
   */
  _setState(e) {
    this._state !== e && (this._state = e, this.onLoaderStateChangedObservable.notifyObservers(this._state), this._log(ee[this._state]));
  }
  /**
   * @internal
   */
  _loadFile(e, t, s, n, i, r) {
    const o = e._loadFile(t, s, (l) => {
      this._onProgress(l, o);
    }, !0, n, i, r);
    return o.onCompleteObservable.add((l) => {
      this._requests.splice(this._requests.indexOf(l), 1);
    }), this._requests.push(o), o;
  }
  _onProgress(e, t) {
    if (!this._progressCallback)
      return;
    t._lengthComputable = e.lengthComputable, t._loaded = e.loaded, t._total = e.total;
    let s = !0, n = 0, i = 0;
    for (const r of this._requests) {
      if (r._lengthComputable === void 0 || r._loaded === void 0 || r._total === void 0)
        return;
      s = s && r._lengthComputable, n += r._loaded, i += r._total;
    }
    this._progressCallback({
      lengthComputable: s,
      loaded: n,
      total: s ? i : 0
    });
  }
  _validate(e, t, s = "", n = "") {
    this.validate && (this._startPerformanceCounter("Validate JSON"), Un.ValidateAsync(t, s, n, (i) => this.preprocessUrlAsync(s + i).then((r) => e._loadFileAsync(r, void 0, !0, !0).then((o) => new Uint8Array(o, 0, o.byteLength)))).then((i) => {
      this._endPerformanceCounter("Validate JSON"), this.onValidatedObservable.notifyObservers(i), this.onValidatedObservable.clear();
    }, (i) => {
      this._endPerformanceCounter("Validate JSON"), $.Warn(`Failed to validate: ${i.message}`), this.onValidatedObservable.clear();
    }));
  }
  _getLoader(e) {
    const t = e.json.asset || {};
    this._log(`Asset version: ${t.version}`), t.minVersion && this._log(`Asset minimum version: ${t.minVersion}`), t.generator && this._log(`Asset generator: ${t.generator}`);
    const s = H._parseVersion(t.version);
    if (!s)
      throw new Error("Invalid version: " + t.version);
    if (t.minVersion !== void 0) {
      const r = H._parseVersion(t.minVersion);
      if (!r)
        throw new Error("Invalid minimum version: " + t.minVersion);
      if (H._compareVersion(r, { major: 2, minor: 0 }) > 0)
        throw new Error("Incompatible minimum version: " + t.minVersion);
    }
    const i = {
      1: H._CreateGLTF1Loader,
      2: H._CreateGLTF2Loader
    }[s.major];
    if (!i)
      throw new Error("Unsupported version: " + t.version);
    return i(this);
  }
  _parseJson(e) {
    this._startPerformanceCounter("Parse JSON"), this._log(`JSON length: ${e.length}`);
    const t = JSON.parse(e);
    return this._endPerformanceCounter("Parse JSON"), t;
  }
  _unpackBinaryAsync(e) {
    return this._startPerformanceCounter("Unpack Binary"), e.loadAsync(20).then(() => {
      const t = {
        Magic: 1179937895
      }, s = e.readUint32();
      if (s !== t.Magic)
        throw new Oi("Unexpected magic: " + s, Ii.GLTFLoaderUnexpectedMagicError);
      const n = e.readUint32();
      this.loggingEnabled && this._log(`Binary version: ${n}`);
      const i = e.readUint32();
      !this.useRangeRequests && i !== e.buffer.byteLength && v.Warn(`Length in header does not match actual data length: ${i} != ${e.buffer.byteLength}`);
      let r;
      switch (n) {
        case 1: {
          r = this._unpackBinaryV1Async(e, i);
          break;
        }
        case 2: {
          r = this._unpackBinaryV2Async(e, i);
          break;
        }
        default:
          throw new Error("Unsupported version: " + n);
      }
      return this._endPerformanceCounter("Unpack Binary"), r;
    });
  }
  _unpackBinaryV1Async(e, t) {
    const s = {
      JSON: 0
    }, n = e.readUint32(), i = e.readUint32();
    if (i !== s.JSON)
      throw new Error(`Unexpected content format: ${i}`);
    const r = t - e.byteOffset, o = { json: this._parseJson(e.readString(n)), bin: null };
    if (r !== 0) {
      const l = e.byteOffset;
      o.bin = {
        readAsync: (h, u) => e.buffer.readAsync(l + h, u),
        byteLength: r
      };
    }
    return Promise.resolve(o);
  }
  _unpackBinaryV2Async(e, t) {
    const s = {
      JSON: 1313821514,
      BIN: 5130562
    }, n = e.readUint32();
    if (e.readUint32() !== s.JSON)
      throw new Error("First chunk format is not JSON");
    return e.byteOffset + n === t ? e.loadAsync(n).then(() => ({ json: this._parseJson(e.readString(n)), bin: null })) : e.loadAsync(n + 8).then(() => {
      const r = { json: this._parseJson(e.readString(n)), bin: null }, o = () => {
        const l = e.readUint32();
        switch (e.readUint32()) {
          case s.JSON:
            throw new Error("Unexpected JSON chunk");
          case s.BIN: {
            const u = e.byteOffset;
            r.bin = {
              readAsync: (c, d) => e.buffer.readAsync(u + c, d),
              byteLength: l
            }, e.skipBytes(l);
            break;
          }
          default: {
            e.skipBytes(l);
            break;
          }
        }
        return e.byteOffset !== t ? e.loadAsync(8).then(o) : Promise.resolve(r);
      };
      return o();
    });
  }
  static _parseVersion(e) {
    if (e === "1.0" || e === "1.0.1")
      return {
        major: 1,
        minor: 0
      };
    const t = (e + "").match(/^(\d+)\.(\d+)/);
    return t ? {
      major: parseInt(t[1]),
      minor: parseInt(t[2])
    } : null;
  }
  static _compareVersion(e, t) {
    return e.major > t.major ? 1 : e.major < t.major ? -1 : e.minor > t.minor ? 1 : e.minor < t.minor ? -1 : 0;
  }
  /**
   * @internal
   */
  _logOpen(e) {
    this._log(e), this._logIndentLevel++;
  }
  /** @internal */
  _logClose() {
    --this._logIndentLevel;
  }
  _logEnabled(e) {
    const t = H._logSpaces.substr(0, this._logIndentLevel * 2);
    v.Log(`${t}${e}`);
  }
  _logDisabled(e) {
  }
  _startPerformanceCounterEnabled(e) {
    $.StartPerformanceCounter(e);
  }
  _startPerformanceCounterDisabled(e) {
  }
  _endPerformanceCounterEnabled(e) {
    $.EndPerformanceCounter(e);
  }
  _endPerformanceCounterDisabled(e) {
  }
}
H.IncrementalLoading = !0;
H.HomogeneousCoordinates = !1;
H._MagicBase64Encoded = "Z2xURg";
H._logSpaces = "                                ";
In && In.RegisterPlugin(new H());
class Cs {
  /**
   * Gets or sets a boolean indicating that bone matrices should be stored as a texture instead of using shader uniforms (default is true).
   * Please note that this option is not available if the hardware does not support it
   */
  get useTextureToStoreBoneMatrices() {
    return this._useTextureToStoreBoneMatrices;
  }
  set useTextureToStoreBoneMatrices(e) {
    this._useTextureToStoreBoneMatrices = e, this._markAsDirty();
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
   * Gets a boolean indicating that the skeleton effectively stores matrices into a texture
   */
  get isUsingTextureForMatrices() {
    return this.useTextureToStoreBoneMatrices && this._canUseTextureForBones;
  }
  /**
   * Gets the unique ID of this skeleton
   */
  get uniqueId() {
    return this._uniqueId;
  }
  /**
   * Creates a new skeleton
   * @param name defines the skeleton name
   * @param id defines the skeleton Id
   * @param scene defines the hosting scene
   */
  constructor(e, t, s) {
    this.name = e, this.id = t, this.bones = [], this.needInitialSkinMatrix = !1, this._isDirty = !0, this._meshesWithPoseMatrix = new Array(), this._identity = S.Identity(), this._currentRenderId = -1, this._ranges = {}, this._absoluteTransformIsDirty = !0, this._canUseTextureForBones = !1, this._uniqueId = 0, this._numBonesWithLinkedTransformNode = 0, this._hasWaitingData = null, this._parentContainer = null, this.doNotSerialize = !1, this._useTextureToStoreBoneMatrices = !0, this._animationPropertiesOverride = null, this.onBeforeComputeObservable = new B(), this.bones = [], this._scene = s || we.LastCreatedScene, this._uniqueId = this._scene.getUniqueId(), this._scene.addSkeleton(this), this._isDirty = !0;
    const n = this._scene.getEngine().getCaps();
    this._canUseTextureForBones = n.textureFloat && n.maxVertexTextureImageUnits > 0;
  }
  /**
   * Gets the current object class name.
   * @returns the class name
   */
  getClassName() {
    return "Skeleton";
  }
  /**
   * Returns an array containing the root bones
   * @returns an array containing the root bones
   */
  getChildren() {
    return this.bones.filter((e) => !e.getParent());
  }
  // Members
  /**
   * Gets the list of transform matrices to send to shaders (one matrix per bone)
   * @param mesh defines the mesh to use to get the root matrix (if needInitialSkinMatrix === true)
   * @returns a Float32Array containing matrices data
   */
  getTransformMatrices(e) {
    if (this.needInitialSkinMatrix) {
      if (!e)
        throw new Error("getTransformMatrices: When using the needInitialSkinMatrix flag, a mesh must be provided");
      return e._bonesTransformMatrices || this.prepare(!0), e._bonesTransformMatrices;
    }
    return (!this._transformMatrices || this._isDirty) && this.prepare(!this._transformMatrices), this._transformMatrices;
  }
  /**
   * Gets the list of transform matrices to send to shaders inside a texture (one matrix per bone)
   * @param mesh defines the mesh to use to get the root matrix (if needInitialSkinMatrix === true)
   * @returns a raw texture containing the data
   */
  getTransformMatrixTexture(e) {
    return this.needInitialSkinMatrix && e._transformMatrixTexture ? e._transformMatrixTexture : this._transformMatrixTexture;
  }
  /**
   * Gets the current hosting scene
   * @returns a scene object
   */
  getScene() {
    return this._scene;
  }
  // Methods
  /**
   * Gets a string representing the current skeleton data
   * @param fullDetails defines a boolean indicating if we want a verbose version
   * @returns a string representing the current skeleton data
   */
  toString(e) {
    let t = `Name: ${this.name}, nBones: ${this.bones.length}`;
    if (t += `, nAnimationRanges: ${this._ranges ? Object.keys(this._ranges).length : "none"}`, e) {
      t += ", Ranges: {";
      let s = !0;
      for (const n in this._ranges)
        s && (t += ", ", s = !1), t += n;
      t += "}";
    }
    return t;
  }
  /**
   * Get bone's index searching by name
   * @param name defines bone's name to search for
   * @returns the indice of the bone. Returns -1 if not found
   */
  getBoneIndexByName(e) {
    for (let t = 0, s = this.bones.length; t < s; t++)
      if (this.bones[t].name === e)
        return t;
    return -1;
  }
  /**
   * Create a new animation range
   * @param name defines the name of the range
   * @param from defines the start key
   * @param to defines the end key
   */
  createAnimationRange(e, t, s) {
    if (!this._ranges[e]) {
      this._ranges[e] = new Mn(e, t, s);
      for (let n = 0, i = this.bones.length; n < i; n++)
        this.bones[n].animations[0] && this.bones[n].animations[0].createRange(e, t, s);
    }
  }
  /**
   * Delete a specific animation range
   * @param name defines the name of the range
   * @param deleteFrames defines if frames must be removed as well
   */
  deleteAnimationRange(e, t = !0) {
    for (let s = 0, n = this.bones.length; s < n; s++)
      this.bones[s].animations[0] && this.bones[s].animations[0].deleteRange(e, t);
    this._ranges[e] = null;
  }
  /**
   * Gets a specific animation range
   * @param name defines the name of the range to look for
   * @returns the requested animation range or null if not found
   */
  getAnimationRange(e) {
    return this._ranges[e] || null;
  }
  /**
   * Gets the list of all animation ranges defined on this skeleton
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
   * Copy animation range from a source skeleton.
   * This is not for a complete retargeting, only between very similar skeleton's with only possible bone length differences
   * @param source defines the source skeleton
   * @param name defines the name of the range to copy
   * @param rescaleAsRequired defines if rescaling must be applied if required
   * @returns true if operation was successful
   */
  copyAnimationRange(e, t, s = !1) {
    if (this._ranges[t] || !e.getAnimationRange(t))
      return !1;
    let n = !0;
    const i = this._getHighestAnimationFrame() + 1, r = {}, o = e.bones;
    let l, h;
    for (h = 0, l = o.length; h < l; h++)
      r[o[h].name] = o[h];
    this.bones.length !== o.length && (v.Warn(`copyAnimationRange: this rig has ${this.bones.length} bones, while source as ${o.length}`), n = !1);
    const u = s && this.dimensionsAtRest && e.dimensionsAtRest ? this.dimensionsAtRest.divide(e.dimensionsAtRest) : null;
    for (h = 0, l = this.bones.length; h < l; h++) {
      const d = this.bones[h].name, y = r[d];
      y ? n = n && this.bones[h].copyAnimationRange(y, t, i, s, u) : (v.Warn("copyAnimationRange: not same rig, missing source bone " + d), n = !1);
    }
    const c = e.getAnimationRange(t);
    return c && (this._ranges[t] = new Mn(t, c.from + i, c.to + i)), n;
  }
  /**
   * Forces the skeleton to go to rest pose
   */
  returnToRest() {
    for (const e of this.bones)
      e._index !== -1 && e.returnToRest();
  }
  _getHighestAnimationFrame() {
    let e = 0;
    for (let t = 0, s = this.bones.length; t < s; t++)
      if (this.bones[t].animations[0]) {
        const n = this.bones[t].animations[0].getHighestFrame();
        e < n && (e = n);
      }
    return e;
  }
  /**
   * Begin a specific animation range
   * @param name defines the name of the range to start
   * @param loop defines if looping must be turned on (false by default)
   * @param speedRatio defines the speed ratio to apply (1 by default)
   * @param onAnimationEnd defines a callback which will be called when animation will end
   * @returns a new animatable
   */
  beginAnimation(e, t, s, n) {
    const i = this.getAnimationRange(e);
    return i ? this._scene.beginAnimation(this, i.from, i.to, t, s, n) : null;
  }
  /**
   * Convert the keyframes for a range of animation on a skeleton to be relative to a given reference frame.
   * @param skeleton defines the Skeleton containing the animation range to convert
   * @param referenceFrame defines the frame that keyframes in the range will be relative to
   * @param range defines the name of the AnimationRange belonging to the Skeleton to convert
   * @returns the original skeleton
   */
  static MakeAnimationAdditive(e, t = 0, s) {
    const n = e.getAnimationRange(s);
    if (!n)
      return null;
    const i = e._scene.getAllAnimatablesByTarget(e);
    let r = null;
    for (let l = 0; l < i.length; l++) {
      const h = i[l];
      if (h.fromFrame === n?.from && h.toFrame === n?.to) {
        r = h;
        break;
      }
    }
    const o = e.getAnimatables();
    for (let l = 0; l < o.length; l++) {
      const u = o[l].animations;
      if (u)
        for (let c = 0; c < u.length; c++)
          x.MakeAnimationAdditive(u[c], t, s);
    }
    return r && (r.isAdditive = !0), e;
  }
  /** @internal */
  _markAsDirty() {
    this._isDirty = !0, this._absoluteTransformIsDirty = !0;
  }
  /**
   * @internal
   */
  _registerMeshWithPoseMatrix(e) {
    this._meshesWithPoseMatrix.push(e);
  }
  /**
   * @internal
   */
  _unregisterMeshWithPoseMatrix(e) {
    const t = this._meshesWithPoseMatrix.indexOf(e);
    t > -1 && this._meshesWithPoseMatrix.splice(t, 1);
  }
  _computeTransformMatrices(e, t) {
    this.onBeforeComputeObservable.notifyObservers(this);
    for (let s = 0; s < this.bones.length; s++) {
      const n = this.bones[s];
      n._childUpdateId++;
      const i = n.getParent();
      if (i ? n.getLocalMatrix().multiplyToRef(i.getFinalMatrix(), n.getFinalMatrix()) : t ? n.getLocalMatrix().multiplyToRef(t, n.getFinalMatrix()) : n.getFinalMatrix().copyFrom(n.getLocalMatrix()), n._index !== -1) {
        const r = n._index === null ? s : n._index;
        n.getAbsoluteInverseBindMatrix().multiplyToArray(n.getFinalMatrix(), e, r * 16);
      }
    }
    this._identity.copyToArray(e, this.bones.length * 16);
  }
  /**
   * Build all resources required to render a skeleton
   * @param dontCheckFrameId defines a boolean indicating if prepare should be run without checking first the current frame id (default: false)
   */
  prepare(e = !1) {
    if (!e) {
      const t = this.getScene().getRenderId();
      if (this._currentRenderId === t)
        return;
      this._currentRenderId = t;
    }
    if (this._numBonesWithLinkedTransformNode > 0) {
      for (const t of this.bones)
        if (t._linkedTransformNode) {
          const s = t._linkedTransformNode;
          t.position = s.position, s.rotationQuaternion ? t.rotationQuaternion = s.rotationQuaternion : t.rotation = s.rotation, t.scaling = s.scaling;
        }
    }
    if (this.needInitialSkinMatrix)
      for (const t of this._meshesWithPoseMatrix) {
        const s = t.getPoseMatrix();
        let n = this._isDirty;
        if ((!t._bonesTransformMatrices || t._bonesTransformMatrices.length !== 16 * (this.bones.length + 1)) && (t._bonesTransformMatrices = new Float32Array(16 * (this.bones.length + 1)), n = !0), !!n) {
          if (this._synchronizedWithMesh !== t) {
            this._synchronizedWithMesh = t;
            for (const i of this.bones)
              i.getParent() || (i.getBindMatrix().multiplyToRef(s, J.Matrix[1]), i._updateAbsoluteBindMatrices(J.Matrix[1]));
            if (this.isUsingTextureForMatrices) {
              const i = (this.bones.length + 1) * 4;
              (!t._transformMatrixTexture || t._transformMatrixTexture.getSize().width !== i) && (t._transformMatrixTexture && t._transformMatrixTexture.dispose(), t._transformMatrixTexture = On.CreateRGBATexture(t._bonesTransformMatrices, (this.bones.length + 1) * 4, 1, this._scene, !1, !1, 1, 1));
            }
          }
          this._computeTransformMatrices(t._bonesTransformMatrices, s), this.isUsingTextureForMatrices && t._transformMatrixTexture && t._transformMatrixTexture.update(t._bonesTransformMatrices);
        }
      }
    else {
      if (!this._isDirty)
        return;
      (!this._transformMatrices || this._transformMatrices.length !== 16 * (this.bones.length + 1)) && (this._transformMatrices = new Float32Array(16 * (this.bones.length + 1)), this.isUsingTextureForMatrices && (this._transformMatrixTexture && this._transformMatrixTexture.dispose(), this._transformMatrixTexture = On.CreateRGBATexture(this._transformMatrices, (this.bones.length + 1) * 4, 1, this._scene, !1, !1, 1, 1))), this._computeTransformMatrices(this._transformMatrices, null), this.isUsingTextureForMatrices && this._transformMatrixTexture && this._transformMatrixTexture.update(this._transformMatrices);
    }
    this._isDirty = !1;
  }
  /**
   * Gets the list of animatables currently running for this skeleton
   * @returns an array of animatables
   */
  getAnimatables() {
    if (!this._animatables || this._animatables.length !== this.bones.length) {
      this._animatables = [];
      for (let e = 0; e < this.bones.length; e++)
        this._animatables.push(this.bones[e]);
    }
    return this._animatables;
  }
  /**
   * Clone the current skeleton
   * @param name defines the name of the new skeleton
   * @param id defines the id of the new skeleton
   * @returns the new skeleton
   */
  clone(e, t) {
    const s = new Cs(e, t || e, this._scene);
    s.needInitialSkinMatrix = this.needInitialSkinMatrix;
    for (let n = 0; n < this.bones.length; n++) {
      const i = this.bones[n];
      let r = null;
      const o = i.getParent();
      if (o) {
        const h = this.bones.indexOf(o);
        r = s.bones[h];
      }
      const l = new Rs(i.name, s, r, i.getBindMatrix().clone(), i.getRestMatrix().clone());
      l._index = i._index, i._linkedTransformNode && l.linkTransformNode(i._linkedTransformNode), Pi.DeepCopy(i.animations, l.animations);
    }
    if (this._ranges) {
      s._ranges = {};
      for (const n in this._ranges) {
        const i = this._ranges[n];
        i && (s._ranges[n] = i.clone());
      }
    }
    return this._isDirty = !0, s.prepare(!0), s;
  }
  /**
   * Enable animation blending for this skeleton
   * @param blendingSpeed defines the blending speed to apply
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#animation-blending
   */
  enableBlending(e = 0.01) {
    this.bones.forEach((t) => {
      t.animations.forEach((s) => {
        s.enableBlending = !0, s.blendingSpeed = e;
      });
    });
  }
  /**
   * Releases all resources associated with the current skeleton
   */
  dispose() {
    if (this._meshesWithPoseMatrix.length = 0, this.getScene().stopAnimation(this), this.getScene().removeSkeleton(this), this._parentContainer) {
      const e = this._parentContainer.skeletons.indexOf(this);
      e > -1 && this._parentContainer.skeletons.splice(e, 1), this._parentContainer = null;
    }
    this._transformMatrixTexture && (this._transformMatrixTexture.dispose(), this._transformMatrixTexture = null);
  }
  /**
   * Serialize the skeleton in a JSON object
   * @returns a JSON object
   */
  serialize() {
    const e = {};
    e.name = this.name, e.id = this.id, this.dimensionsAtRest && (e.dimensionsAtRest = this.dimensionsAtRest.asArray()), e.bones = [], e.needInitialSkinMatrix = this.needInitialSkinMatrix;
    for (let t = 0; t < this.bones.length; t++) {
      const s = this.bones[t], n = s.getParent(), i = {
        parentBoneIndex: n ? this.bones.indexOf(n) : -1,
        index: s.getIndex(),
        name: s.name,
        id: s.id,
        matrix: s.getBindMatrix().asArray(),
        rest: s.getRestMatrix().asArray(),
        linkedTransformNodeId: s.getTransformNode()?.id
      };
      e.bones.push(i), s.length && (i.length = s.length), s.metadata && (i.metadata = s.metadata), s.animations && s.animations.length > 0 && (i.animation = s.animations[0].serialize()), e.ranges = [];
      for (const r in this._ranges) {
        const o = this._ranges[r];
        if (!o)
          continue;
        const l = {};
        l.name = r, l.from = o.from, l.to = o.to, e.ranges.push(l);
      }
    }
    return e;
  }
  /**
   * Creates a new skeleton from serialized data
   * @param parsedSkeleton defines the serialized data
   * @param scene defines the hosting scene
   * @returns a new skeleton
   */
  static Parse(e, t) {
    const s = new Cs(e.name, e.id, t);
    e.dimensionsAtRest && (s.dimensionsAtRest = N.FromArray(e.dimensionsAtRest)), s.needInitialSkinMatrix = e.needInitialSkinMatrix;
    let n;
    for (n = 0; n < e.bones.length; n++) {
      const i = e.bones[n], r = e.bones[n].index;
      let o = null;
      i.parentBoneIndex > -1 && (o = s.bones[i.parentBoneIndex]);
      const l = i.rest ? S.FromArray(i.rest) : null, h = new Rs(i.name, s, o, S.FromArray(i.matrix), l, null, r);
      i.id !== void 0 && i.id !== null && (h.id = i.id), i.length && (h.length = i.length), i.metadata && (h.metadata = i.metadata), i.animation && h.animations.push(x.Parse(i.animation)), i.linkedTransformNodeId !== void 0 && i.linkedTransformNodeId !== null && (s._hasWaitingData = !0, h._waitingTransformNodeId = i.linkedTransformNodeId);
    }
    if (e.ranges)
      for (n = 0; n < e.ranges.length; n++) {
        const i = e.ranges[n];
        s.createAnimationRange(i.name, i.from, i.to);
      }
    return s;
  }
  /**
   * Compute all node absolute matrices
   * @param forceUpdate defines if computation must be done even if cache is up to date
   */
  computeAbsoluteMatrices(e = !1) {
    (this._absoluteTransformIsDirty || e) && (this.bones[0].computeAbsoluteMatrices(), this._absoluteTransformIsDirty = !1);
  }
  /**
   * Compute all node absolute matrices
   * @param forceUpdate defines if computation must be done even if cache is up to date
   * @deprecated Please use computeAbsoluteMatrices instead
   */
  computeAbsoluteTransforms(e = !1) {
    this.computeAbsoluteMatrices(e);
  }
  /**
   * Gets the root pose matrix
   * @returns a matrix
   */
  getPoseMatrix() {
    let e = null;
    return this._meshesWithPoseMatrix.length > 0 && (e = this._meshesWithPoseMatrix[0].getPoseMatrix()), e;
  }
  /**
   * Sorts bones per internal index
   */
  sortBones() {
    const e = [], t = new Array(this.bones.length);
    for (let s = 0; s < this.bones.length; s++)
      this._sortBones(s, e, t);
    this.bones = e;
  }
  _sortBones(e, t, s) {
    if (s[e])
      return;
    s[e] = !0;
    const n = this.bones[e];
    if (!n)
      return;
    n._index === void 0 && (n._index = e);
    const i = n.getParent();
    i && this._sortBones(this.bones.indexOf(i), t, s), t.push(n);
  }
  /**
   * Set the current local matrix as the restPose for all bones in the skeleton.
   */
  setCurrentPoseAsRest() {
    this.bones.forEach((e) => {
      e.setCurrentPoseAsRest();
    });
  }
}
$n.AddNodeConstructor("Light_Type_1", (a, e) => () => new ae(a, N.Zero(), e));
class ae extends Gn {
  /**
   * Fix frustum size for the shadow generation. This is disabled if the value is 0.
   */
  get shadowFrustumSize() {
    return this._shadowFrustumSize;
  }
  /**
   * Specifies a fix frustum size for the shadow generation.
   */
  set shadowFrustumSize(e) {
    this._shadowFrustumSize = e, this.forceProjectionMatrixCompute();
  }
  /**
   * Gets the shadow projection scale against the optimal computed one.
   * 0.1 by default which means that the projection window is increase by 10% from the optimal size.
   * This does not impact in fixed frustum size (shadowFrustumSize being set)
   */
  get shadowOrthoScale() {
    return this._shadowOrthoScale;
  }
  /**
   * Sets the shadow projection scale against the optimal computed one.
   * 0.1 by default which means that the projection window is increase by 10% from the optimal size.
   * This does not impact in fixed frustum size (shadowFrustumSize being set)
   */
  set shadowOrthoScale(e) {
    this._shadowOrthoScale = e, this.forceProjectionMatrixCompute();
  }
  /**
   * Gets or sets the orthoLeft property used to build the light frustum
   */
  get orthoLeft() {
    return this._orthoLeft;
  }
  set orthoLeft(e) {
    this._orthoLeft = e;
  }
  /**
   * Gets or sets the orthoRight property used to build the light frustum
   */
  get orthoRight() {
    return this._orthoRight;
  }
  set orthoRight(e) {
    this._orthoRight = e;
  }
  /**
   * Gets or sets the orthoTop property used to build the light frustum
   */
  get orthoTop() {
    return this._orthoTop;
  }
  set orthoTop(e) {
    this._orthoTop = e;
  }
  /**
   * Gets or sets the orthoBottom property used to build the light frustum
   */
  get orthoBottom() {
    return this._orthoBottom;
  }
  set orthoBottom(e) {
    this._orthoBottom = e;
  }
  /**
   * Creates a DirectionalLight object in the scene, oriented towards the passed direction (Vector3).
   * The directional light is emitted from everywhere in the given direction.
   * It can cast shadows.
   * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
   * @param name The friendly name of the light
   * @param direction The direction of the light
   * @param scene The scene the light belongs to
   */
  constructor(e, t, s) {
    super(e, s), this._shadowFrustumSize = 0, this._shadowOrthoScale = 0.1, this.autoUpdateExtends = !0, this.autoCalcShadowZBounds = !1, this._orthoLeft = Number.MAX_VALUE, this._orthoRight = Number.MIN_VALUE, this._orthoTop = Number.MIN_VALUE, this._orthoBottom = Number.MAX_VALUE, this.position = t.scale(-1), this.direction = t;
  }
  /**
   * Returns the string "DirectionalLight".
   * @returns The class name
   */
  getClassName() {
    return "DirectionalLight";
  }
  /**
   * Returns the integer 1.
   * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
   */
  getTypeID() {
    return is.LIGHTTYPEID_DIRECTIONALLIGHT;
  }
  /**
   * Sets the passed matrix "matrix" as projection matrix for the shadows cast by the light according to the passed view matrix.
   * Returns the DirectionalLight Shadow projection matrix.
   * @param matrix
   * @param viewMatrix
   * @param renderList
   */
  _setDefaultShadowProjectionMatrix(e, t, s) {
    this.shadowFrustumSize > 0 ? this._setDefaultFixedFrustumShadowProjectionMatrix(e) : this._setDefaultAutoExtendShadowProjectionMatrix(e, t, s);
  }
  /**
   * Sets the passed matrix "matrix" as fixed frustum projection matrix for the shadows cast by the light according to the passed view matrix.
   * Returns the DirectionalLight Shadow projection matrix.
   * @param matrix
   */
  _setDefaultFixedFrustumShadowProjectionMatrix(e) {
    const t = this.getScene().activeCamera;
    t && S.OrthoLHToRef(this.shadowFrustumSize, this.shadowFrustumSize, this.shadowMinZ !== void 0 ? this.shadowMinZ : t.minZ, this.shadowMaxZ !== void 0 ? this.shadowMaxZ : t.maxZ, e, this.getScene().getEngine().isNDCHalfZRange);
  }
  /**
   * Sets the passed matrix "matrix" as auto extend projection matrix for the shadows cast by the light according to the passed view matrix.
   * Returns the DirectionalLight Shadow projection matrix.
   * @param matrix
   * @param viewMatrix
   * @param renderList
   */
  _setDefaultAutoExtendShadowProjectionMatrix(e, t, s) {
    const n = this.getScene().activeCamera;
    if (!n)
      return;
    if (this.autoUpdateExtends || this._orthoLeft === Number.MAX_VALUE) {
      const u = N.Zero();
      this._orthoLeft = Number.MAX_VALUE, this._orthoRight = -Number.MAX_VALUE, this._orthoTop = -Number.MAX_VALUE, this._orthoBottom = Number.MAX_VALUE;
      let c = Number.MAX_VALUE, d = -Number.MAX_VALUE;
      for (let y = 0; y < s.length; y++) {
        const T = s[y];
        if (!T)
          continue;
        const p = T.getBoundingInfo().boundingBox;
        for (let C = 0; C < p.vectorsWorld.length; C++)
          N.TransformCoordinatesToRef(p.vectorsWorld[C], t, u), u.x < this._orthoLeft && (this._orthoLeft = u.x), u.y < this._orthoBottom && (this._orthoBottom = u.y), u.x > this._orthoRight && (this._orthoRight = u.x), u.y > this._orthoTop && (this._orthoTop = u.y), this.autoCalcShadowZBounds && (u.z < c && (c = u.z), u.z > d && (d = u.z));
      }
      this.autoCalcShadowZBounds && (this._shadowMinZ = c, this._shadowMaxZ = d);
    }
    const i = this._orthoRight - this._orthoLeft, r = this._orthoTop - this._orthoBottom, o = this.shadowMinZ !== void 0 ? this.shadowMinZ : n.minZ, l = this.shadowMaxZ !== void 0 ? this.shadowMaxZ : n.maxZ, h = this.getScene().getEngine().useReverseDepthBuffer;
    S.OrthoOffCenterLHToRef(this._orthoLeft - i * this.shadowOrthoScale, this._orthoRight + i * this.shadowOrthoScale, this._orthoBottom - r * this.shadowOrthoScale, this._orthoTop + r * this.shadowOrthoScale, h ? l : o, h ? o : l, e, this.getScene().getEngine().isNDCHalfZRange);
  }
  _buildUniformLayout() {
    this._uniformBuffer.addUniform("vLightData", 4), this._uniformBuffer.addUniform("vLightDiffuse", 4), this._uniformBuffer.addUniform("vLightSpecular", 4), this._uniformBuffer.addUniform("shadowsInfo", 3), this._uniformBuffer.addUniform("depthValues", 2), this._uniformBuffer.create();
  }
  /**
   * Sets the passed Effect object with the DirectionalLight transformed position (or position if not parented) and the passed name.
   * @param effect The effect to update
   * @param lightIndex The index of the light in the effect to update
   * @returns The directional light
   */
  transferToEffect(e, t) {
    return this.computeTransformedInformation() ? (this._uniformBuffer.updateFloat4("vLightData", this.transformedDirection.x, this.transformedDirection.y, this.transformedDirection.z, 1, t), this) : (this._uniformBuffer.updateFloat4("vLightData", this.direction.x, this.direction.y, this.direction.z, 1, t), this);
  }
  transferToNodeMaterialEffect(e, t) {
    return this.computeTransformedInformation() ? (e.setFloat3(t, this.transformedDirection.x, this.transformedDirection.y, this.transformedDirection.z), this) : (e.setFloat3(t, this.direction.x, this.direction.y, this.direction.z), this);
  }
  /**
   * Gets the minZ used for shadow according to both the scene and the light.
   *
   * Values are fixed on directional lights as it relies on an ortho projection hence the need to convert being
   * -1 and 1 to 0 and 1 doing (depth + min) / (min + max) -> (depth + 1) / (1 + 1) -> (depth * 0.5) + 0.5.
   * (when not using reverse depth buffer / NDC half Z range)
   * @param activeCamera The camera we are returning the min for
   * @returns the depth min z
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDepthMinZ(e) {
    const t = this._scene.getEngine();
    return !t.useReverseDepthBuffer && t.isNDCHalfZRange ? 0 : 1;
  }
  /**
   * Gets the maxZ used for shadow according to both the scene and the light.
   *
   * Values are fixed on directional lights as it relies on an ortho projection hence the need to convert being
   * -1 and 1 to 0 and 1 doing (depth + min) / (min + max) -> (depth + 1) / (1 + 1) -> (depth * 0.5) + 0.5.
   * (when not using reverse depth buffer / NDC half Z range)
   * @param activeCamera The camera we are returning the max for
   * @returns the depth max z
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDepthMaxZ(e) {
    const t = this._scene.getEngine();
    return t.useReverseDepthBuffer && t.isNDCHalfZRange ? 0 : 1;
  }
  /**
   * Prepares the list of defines specific to the light type.
   * @param defines the list of defines
   * @param lightIndex defines the index of the light for the effect
   */
  prepareLightSpecificDefines(e, t) {
    e["DIRLIGHT" + t] = !0;
  }
}
Z([
  Y()
], ae.prototype, "shadowFrustumSize", null);
Z([
  Y()
], ae.prototype, "shadowOrthoScale", null);
Z([
  Y()
], ae.prototype, "autoUpdateExtends", void 0);
Z([
  Y()
], ae.prototype, "autoCalcShadowZBounds", void 0);
Z([
  Y("orthoLeft")
], ae.prototype, "_orthoLeft", void 0);
Z([
  Y("orthoRight")
], ae.prototype, "_orthoRight", void 0);
Z([
  Y("orthoTop")
], ae.prototype, "_orthoTop", void 0);
Z([
  Y("orthoBottom")
], ae.prototype, "_orthoBottom", void 0);
$n.AddNodeConstructor("Light_Type_2", (a, e) => () => new ne(a, N.Zero(), N.Zero(), 0, 0, e));
class ne extends Gn {
  /**
   * Gets the cone angle of the spot light in Radians.
   */
  get angle() {
    return this._angle;
  }
  /**
   * Sets the cone angle of the spot light in Radians.
   */
  set angle(e) {
    this._angle = e, this._cosHalfAngle = Math.cos(e * 0.5), this._projectionTextureProjectionLightDirty = !0, this.forceProjectionMatrixCompute(), this._computeAngleValues();
  }
  /**
   * Only used in gltf falloff mode, this defines the angle where
   * the directional falloff will start before cutting at angle which could be seen
   * as outer angle.
   */
  get innerAngle() {
    return this._innerAngle;
  }
  /**
   * Only used in gltf falloff mode, this defines the angle where
   * the directional falloff will start before cutting at angle which could be seen
   * as outer angle.
   */
  set innerAngle(e) {
    this._innerAngle = e, this._computeAngleValues();
  }
  /**
   * Allows scaling the angle of the light for shadow generation only.
   */
  get shadowAngleScale() {
    return this._shadowAngleScale;
  }
  /**
   * Allows scaling the angle of the light for shadow generation only.
   */
  set shadowAngleScale(e) {
    this._shadowAngleScale = e, this.forceProjectionMatrixCompute();
  }
  /**
   * Allows reading the projection texture
   */
  get projectionTextureMatrix() {
    return this._projectionTextureMatrix;
  }
  /**
   * Gets the near clip of the Spotlight for texture projection.
   */
  get projectionTextureLightNear() {
    return this._projectionTextureLightNear;
  }
  /**
   * Sets the near clip of the Spotlight for texture projection.
   */
  set projectionTextureLightNear(e) {
    this._projectionTextureLightNear = e, this._projectionTextureProjectionLightDirty = !0;
  }
  /**
   * Gets the far clip of the Spotlight for texture projection.
   */
  get projectionTextureLightFar() {
    return this._projectionTextureLightFar;
  }
  /**
   * Sets the far clip of the Spotlight for texture projection.
   */
  set projectionTextureLightFar(e) {
    this._projectionTextureLightFar = e, this._projectionTextureProjectionLightDirty = !0;
  }
  /**
   * Gets the Up vector of the Spotlight for texture projection.
   */
  get projectionTextureUpDirection() {
    return this._projectionTextureUpDirection;
  }
  /**
   * Sets the Up vector of the Spotlight for texture projection.
   */
  set projectionTextureUpDirection(e) {
    this._projectionTextureUpDirection = e, this._projectionTextureProjectionLightDirty = !0;
  }
  /**
   * Gets the projection texture of the light.
   */
  get projectionTexture() {
    return this._projectionTexture;
  }
  /**
   * Sets the projection texture of the light.
   */
  set projectionTexture(e) {
    this._projectionTexture !== e && (this._projectionTexture = e, this._projectionTextureDirty = !0, this._projectionTexture && !this._projectionTexture.isReady() && (ne._IsProceduralTexture(this._projectionTexture) ? this._projectionTexture.getEffect().executeWhenCompiled(() => {
      this._markMeshesAsLightDirty();
    }) : ne._IsTexture(this._projectionTexture) && this._projectionTexture.onLoadObservable.addOnce(() => {
      this._markMeshesAsLightDirty();
    })));
  }
  static _IsProceduralTexture(e) {
    return e.onGeneratedObservable !== void 0;
  }
  static _IsTexture(e) {
    return e.onLoadObservable !== void 0;
  }
  /**
   * Gets or sets the light projection matrix as used by the projection texture
   */
  get projectionTextureProjectionLightMatrix() {
    return this._projectionTextureProjectionLightMatrix;
  }
  set projectionTextureProjectionLightMatrix(e) {
    this._projectionTextureProjectionLightMatrix = e, this._projectionTextureProjectionLightDirty = !1, this._projectionTextureDirty = !0;
  }
  /**
   * Creates a SpotLight object in the scene. A spot light is a simply light oriented cone.
   * It can cast shadows.
   * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
   * @param name The light friendly name
   * @param position The position of the spot light in the scene
   * @param direction The direction of the light in the scene
   * @param angle The cone angle of the light in Radians
   * @param exponent The light decay speed with the distance from the emission spot
   * @param scene The scene the lights belongs to
   */
  constructor(e, t, s, n, i, r) {
    super(e, r), this._innerAngle = 0, this._projectionTextureMatrix = S.Zero(), this._projectionTextureLightNear = 1e-6, this._projectionTextureLightFar = 1e3, this._projectionTextureUpDirection = N.Up(), this._projectionTextureViewLightDirty = !0, this._projectionTextureProjectionLightDirty = !0, this._projectionTextureDirty = !0, this._projectionTextureViewTargetVector = N.Zero(), this._projectionTextureViewLightMatrix = S.Zero(), this._projectionTextureProjectionLightMatrix = S.Zero(), this._projectionTextureScalingMatrix = S.FromValues(0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0.5, 0, 0.5, 0.5, 0.5, 1), this.position = t, this.direction = s, this.angle = n, this.exponent = i;
  }
  /**
   * Returns the string "SpotLight".
   * @returns the class name
   */
  getClassName() {
    return "SpotLight";
  }
  /**
   * Returns the integer 2.
   * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
   */
  getTypeID() {
    return is.LIGHTTYPEID_SPOTLIGHT;
  }
  /**
   * Overrides the direction setter to recompute the projection texture view light Matrix.
   * @param value
   */
  _setDirection(e) {
    super._setDirection(e), this._projectionTextureViewLightDirty = !0;
  }
  /**
   * Overrides the position setter to recompute the projection texture view light Matrix.
   * @param value
   */
  _setPosition(e) {
    super._setPosition(e), this._projectionTextureViewLightDirty = !0;
  }
  /**
   * Sets the passed matrix "matrix" as perspective projection matrix for the shadows and the passed view matrix with the fov equal to the SpotLight angle and and aspect ratio of 1.0.
   * Returns the SpotLight.
   * @param matrix
   * @param viewMatrix
   * @param renderList
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _setDefaultShadowProjectionMatrix(e, t, s) {
    const n = this.getScene().activeCamera;
    if (!n)
      return;
    this._shadowAngleScale = this._shadowAngleScale || 1;
    const i = this._shadowAngleScale * this._angle, r = this.shadowMinZ !== void 0 ? this.shadowMinZ : n.minZ, o = this.shadowMaxZ !== void 0 ? this.shadowMaxZ : n.maxZ, l = this.getScene().getEngine().useReverseDepthBuffer;
    S.PerspectiveFovLHToRef(i, 1, l ? o : r, l ? r : o, e, !0, this._scene.getEngine().isNDCHalfZRange, void 0, l);
  }
  _computeProjectionTextureViewLightMatrix() {
    this._projectionTextureViewLightDirty = !1, this._projectionTextureDirty = !0, this.getAbsolutePosition().addToRef(this.getShadowDirection(), this._projectionTextureViewTargetVector), S.LookAtLHToRef(this.getAbsolutePosition(), this._projectionTextureViewTargetVector, this._projectionTextureUpDirection, this._projectionTextureViewLightMatrix);
  }
  _computeProjectionTextureProjectionLightMatrix() {
    this._projectionTextureProjectionLightDirty = !1, this._projectionTextureDirty = !0;
    const e = this.projectionTextureLightFar, t = this.projectionTextureLightNear, s = e / (e - t), n = -s * t, i = 1 / Math.tan(this._angle / 2);
    S.FromValuesToRef(i / 1, 0, 0, 0, 0, i, 0, 0, 0, 0, s, 1, 0, 0, n, 0, this._projectionTextureProjectionLightMatrix);
  }
  /**
   * Main function for light texture projection matrix computing.
   */
  _computeProjectionTextureMatrix() {
    if (this._projectionTextureDirty = !1, this._projectionTextureViewLightMatrix.multiplyToRef(this._projectionTextureProjectionLightMatrix, this._projectionTextureMatrix), this._projectionTexture instanceof G) {
      const e = this._projectionTexture.uScale / 2, t = this._projectionTexture.vScale / 2;
      S.FromValuesToRef(e, 0, 0, 0, 0, t, 0, 0, 0, 0, 0.5, 0, 0.5, 0.5, 0.5, 1, this._projectionTextureScalingMatrix);
    }
    this._projectionTextureMatrix.multiplyToRef(this._projectionTextureScalingMatrix, this._projectionTextureMatrix);
  }
  _buildUniformLayout() {
    this._uniformBuffer.addUniform("vLightData", 4), this._uniformBuffer.addUniform("vLightDiffuse", 4), this._uniformBuffer.addUniform("vLightSpecular", 4), this._uniformBuffer.addUniform("vLightDirection", 3), this._uniformBuffer.addUniform("vLightFalloff", 4), this._uniformBuffer.addUniform("shadowsInfo", 3), this._uniformBuffer.addUniform("depthValues", 2), this._uniformBuffer.create();
  }
  _computeAngleValues() {
    this._lightAngleScale = 1 / Math.max(1e-3, Math.cos(this._innerAngle * 0.5) - this._cosHalfAngle), this._lightAngleOffset = -this._cosHalfAngle * this._lightAngleScale;
  }
  /**
   * Sets the passed Effect "effect" with the Light textures.
   * @param effect The effect to update
   * @param lightIndex The index of the light in the effect to update
   * @returns The light
   */
  transferTexturesToEffect(e, t) {
    return this.projectionTexture && this.projectionTexture.isReady() && (this._projectionTextureViewLightDirty && this._computeProjectionTextureViewLightMatrix(), this._projectionTextureProjectionLightDirty && this._computeProjectionTextureProjectionLightMatrix(), this._projectionTextureDirty && this._computeProjectionTextureMatrix(), e.setMatrix("textureProjectionMatrix" + t, this._projectionTextureMatrix), e.setTexture("projectionLightSampler" + t, this.projectionTexture)), this;
  }
  /**
   * Sets the passed Effect object with the SpotLight transformed position (or position if not parented) and normalized direction.
   * @param effect The effect to update
   * @param lightIndex The index of the light in the effect to update
   * @returns The spot light
   */
  transferToEffect(e, t) {
    let s;
    return this.computeTransformedInformation() ? (this._uniformBuffer.updateFloat4("vLightData", this.transformedPosition.x, this.transformedPosition.y, this.transformedPosition.z, this.exponent, t), s = N.Normalize(this.transformedDirection)) : (this._uniformBuffer.updateFloat4("vLightData", this.position.x, this.position.y, this.position.z, this.exponent, t), s = N.Normalize(this.direction)), this._uniformBuffer.updateFloat4("vLightDirection", s.x, s.y, s.z, this._cosHalfAngle, t), this._uniformBuffer.updateFloat4("vLightFalloff", this.range, this._inverseSquaredRange, this._lightAngleScale, this._lightAngleOffset, t), this;
  }
  transferToNodeMaterialEffect(e, t) {
    let s;
    return this.computeTransformedInformation() ? s = N.Normalize(this.transformedDirection) : s = N.Normalize(this.direction), this.getScene().useRightHandedSystem ? e.setFloat3(t, -s.x, -s.y, -s.z) : e.setFloat3(t, s.x, s.y, s.z), this;
  }
  /**
   * Disposes the light and the associated resources.
   */
  dispose() {
    super.dispose(), this._projectionTexture && this._projectionTexture.dispose();
  }
  /**
   * Gets the minZ used for shadow according to both the scene and the light.
   * @param activeCamera The camera we are returning the min for
   * @returns the depth min z
   */
  getDepthMinZ(e) {
    const t = this._scene.getEngine(), s = this.shadowMinZ !== void 0 ? this.shadowMinZ : e.minZ;
    return t.useReverseDepthBuffer && t.isNDCHalfZRange ? s : this._scene.getEngine().isNDCHalfZRange ? 0 : s;
  }
  /**
   * Gets the maxZ used for shadow according to both the scene and the light.
   * @param activeCamera The camera we are returning the max for
   * @returns the depth max z
   */
  getDepthMaxZ(e) {
    const t = this._scene.getEngine(), s = this.shadowMaxZ !== void 0 ? this.shadowMaxZ : e.maxZ;
    return t.useReverseDepthBuffer && t.isNDCHalfZRange ? 0 : s;
  }
  /**
   * Prepares the list of defines specific to the light type.
   * @param defines the list of defines
   * @param lightIndex defines the index of the light for the effect
   */
  prepareLightSpecificDefines(e, t) {
    e["SPOTLIGHT" + t] = !0, e["PROJECTEDLIGHTTEXTURE" + t] = !!(this.projectionTexture && this.projectionTexture.isReady());
  }
}
Z([
  Y()
], ne.prototype, "angle", null);
Z([
  Y()
], ne.prototype, "innerAngle", null);
Z([
  Y()
], ne.prototype, "shadowAngleScale", null);
Z([
  Y()
], ne.prototype, "exponent", void 0);
Z([
  Y()
], ne.prototype, "projectionTextureLightNear", null);
Z([
  Y()
], ne.prototype, "projectionTextureLightFar", null);
Z([
  Y()
], ne.prototype, "projectionTextureUpDirection", null);
Z([
  Si("projectedLightTexture")
], ne.prototype, "_projectionTexture", void 0);
class ss {
  /**
   * The resolve method of the promise associated with this deferred object.
   */
  get resolve() {
    return this._resolve;
  }
  /**
   * The reject method of the promise associated with this deferred object.
   */
  get reject() {
    return this._reject;
  }
  /**
   * Constructor for this deferred object.
   */
  constructor() {
    this.promise = new Promise((e, t) => {
      this._resolve = e, this._reject = t;
    });
  }
}
class or {
  /**
   * Returns the string "TargetedAnimation"
   * @returns "TargetedAnimation"
   */
  getClassName() {
    return "TargetedAnimation";
  }
  /**
   * Serialize the object
   * @returns the JSON object representing the current entity
   */
  serialize() {
    const e = {};
    return e.animation = this.animation.serialize(), e.targetId = this.target.id, e;
  }
}
class he {
  /**
   * Gets or sets the mask associated with this animation group. This mask is used to filter which objects should be animated.
   */
  get mask() {
    return this._mask;
  }
  set mask(e) {
    this._mask !== e && (this._mask = e, this.syncWithMask(!0));
  }
  /**
   * Makes sure that the animations are either played or stopped according to the animation group mask.
   * Note however that the call won't have any effect if the animation group has not been started yet.
   * @param forceUpdate If true, forces to loop over the animatables even if no mask is defined (used internally, you shouldn't need to use it). Default: false.
   */
  syncWithMask(e = !1) {
    if (!this.mask && !e) {
      this._numActiveAnimatables = this._targetedAnimations.length;
      return;
    }
    this._numActiveAnimatables = 0;
    for (let t = 0; t < this._animatables.length; ++t) {
      const s = this._animatables[t];
      !this.mask || this.mask.disabled || this.mask.retainsTarget(s.target.name) ? (this._numActiveAnimatables++, s.paused && s.restart()) : s.paused || s.pause();
    }
  }
  /**
   * Removes all animations for the targets not retained by the animation group mask.
   * Use this function if you know you won't need those animations anymore and if you want to free memory.
   */
  removeUnmaskedAnimations() {
    if (!(!this.mask || this.mask.disabled)) {
      for (let e = 0; e < this._animatables.length; ++e) {
        const t = this._animatables[e];
        this.mask.retainsTarget(t.target.name) || (t.stop(), this._animatables.splice(e, 1), --e);
      }
      for (let e = 0; e < this._targetedAnimations.length; e++) {
        const t = this._targetedAnimations[e];
        this.mask.retainsTarget(t.target.name) || (this._targetedAnimations.splice(e, 1), --e);
      }
    }
  }
  /**
   * Gets or sets the first frame
   */
  get from() {
    return this._from;
  }
  set from(e) {
    if (this._from !== e) {
      this._from = e;
      for (let t = 0; t < this._animatables.length; t++) {
        const s = this._animatables[t];
        s.fromFrame = this._from;
      }
    }
  }
  /**
   * Gets or sets the last frame
   */
  get to() {
    return this._to;
  }
  set to(e) {
    if (this._to !== e) {
      this._to = e;
      for (let t = 0; t < this._animatables.length; t++) {
        const s = this._animatables[t];
        s.toFrame = this._to;
      }
    }
  }
  /**
   * Define if the animations are started
   */
  get isStarted() {
    return this._isStarted;
  }
  /**
   * Gets a value indicating that the current group is playing
   */
  get isPlaying() {
    return this._isStarted && !this._isPaused;
  }
  /**
   * Gets or sets the speed ratio to use for all animations
   */
  get speedRatio() {
    return this._speedRatio;
  }
  /**
   * Gets or sets the speed ratio to use for all animations
   */
  set speedRatio(e) {
    if (this._speedRatio !== e) {
      this._speedRatio = e;
      for (let t = 0; t < this._animatables.length; t++) {
        const s = this._animatables[t];
        s.speedRatio = this._speedRatio;
      }
    }
  }
  /**
   * Gets or sets if all animations should loop or not
   */
  get loopAnimation() {
    return this._loopAnimation;
  }
  set loopAnimation(e) {
    if (this._loopAnimation !== e) {
      this._loopAnimation = e;
      for (let t = 0; t < this._animatables.length; t++) {
        const s = this._animatables[t];
        s.loopAnimation = this._loopAnimation;
      }
    }
  }
  /**
   * Gets or sets if all animations should be evaluated additively
   */
  get isAdditive() {
    return this._isAdditive;
  }
  set isAdditive(e) {
    if (this._isAdditive !== e) {
      this._isAdditive = e;
      for (let t = 0; t < this._animatables.length; t++) {
        const s = this._animatables[t];
        s.isAdditive = this._isAdditive;
      }
    }
  }
  /**
   * Gets or sets the weight to apply to all animations of the group
   */
  get weight() {
    return this._weight;
  }
  set weight(e) {
    this._weight !== e && (this._weight = e, this.setWeightForAllAnimatables(this._weight));
  }
  /**
   * Gets the targeted animations for this animation group
   */
  get targetedAnimations() {
    return this._targetedAnimations;
  }
  /**
   * returning the list of animatables controlled by this animation group.
   */
  get animatables() {
    return this._animatables;
  }
  /**
   * Gets the list of target animations
   */
  get children() {
    return this._targetedAnimations;
  }
  /**
   * Gets or sets the order of play of the animation group (default: 0)
   */
  get playOrder() {
    return this._playOrder;
  }
  set playOrder(e) {
    if (this._playOrder !== e && (this._playOrder = e, this._animatables.length > 0)) {
      for (let t = 0; t < this._animatables.length; t++)
        this._animatables[t].playOrder = this._playOrder;
      this._scene.sortActiveAnimatables();
    }
  }
  /**
   * Allows the animations of the animation group to blend with current running animations
   * Note that a null value means that each animation will use their own existing blending configuration (Animation.enableBlending)
   */
  get enableBlending() {
    return this._enableBlending;
  }
  set enableBlending(e) {
    if (this._enableBlending !== e && (this._enableBlending = e, e !== null))
      for (let t = 0; t < this._targetedAnimations.length; ++t)
        this._targetedAnimations[t].animation.enableBlending = e;
  }
  /**
   * Gets or sets the animation blending speed
   * Note that a null value means that each animation will use their own existing blending configuration (Animation.blendingSpeed)
   */
  get blendingSpeed() {
    return this._blendingSpeed;
  }
  set blendingSpeed(e) {
    if (this._blendingSpeed !== e && (this._blendingSpeed = e, e !== null))
      for (let t = 0; t < this._targetedAnimations.length; ++t)
        this._targetedAnimations[t].animation.blendingSpeed = e;
  }
  /**
   * Gets the length (in seconds) of the animation group
   * This function assumes that all animations are played at the same framePerSecond speed!
   * Note: you can only call this method after you've added at least one targeted animation!
   * @param from Starting frame range (default is AnimationGroup.from)
   * @param to Ending frame range (default is AnimationGroup.to)
   * @returns The length in seconds
   */
  getLength(e, t) {
    e = e ?? this._from, t = t ?? this._to;
    const s = this.targetedAnimations[0].animation.framePerSecond * this._speedRatio;
    return (t - e) / s;
  }
  /**
   * Merge the array of animation groups into a new animation group
   * @param animationGroups List of animation groups to merge
   * @param disposeSource If true, animation groups will be disposed after being merged (default: true)
   * @param normalize If true, animation groups will be normalized before being merged, so that all animations have the same "from" and "to" frame (default: false)
   * @param weight Weight for the new animation group. If not provided, it will inherit the weight from the first animation group of the array
   * @returns The new animation group or null if no animation groups were passed
   */
  static MergeAnimationGroups(e, t = !0, s = !1, n) {
    if (e.length === 0)
      return null;
    n = n ?? e[0].weight;
    let i = Number.MAX_VALUE, r = -Number.MAX_VALUE;
    if (s)
      for (const l of e)
        l.from < i && (i = l.from), l.to > r && (r = l.to);
    const o = new he(e[0].name + "_merged", e[0]._scene, n);
    for (const l of e) {
      s && l.normalize(i, r);
      for (const h of l.targetedAnimations)
        o.addTargetedAnimation(h.animation, h.target);
      t && l.dispose();
    }
    return o;
  }
  /**
   * Instantiates a new Animation Group.
   * This helps managing several animations at once.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/groupAnimations
   * @param name Defines the name of the group
   * @param scene Defines the scene the group belongs to
   * @param weight Defines the weight to use for animations in the group (-1.0 by default, meaning "no weight")
   * @param playOrder Defines the order of play of the animation group (default is 0)
   */
  constructor(e, t = null, s = -1, n = 0) {
    this.name = e, this._targetedAnimations = new Array(), this._animatables = new Array(), this._from = Number.MAX_VALUE, this._to = -Number.MAX_VALUE, this._speedRatio = 1, this._loopAnimation = !1, this._isAdditive = !1, this._weight = -1, this._playOrder = 0, this._enableBlending = null, this._blendingSpeed = null, this._numActiveAnimatables = 0, this._parentContainer = null, this.onAnimationEndObservable = new B(), this.onAnimationLoopObservable = new B(), this.onAnimationGroupLoopObservable = new B(), this.onAnimationGroupEndObservable = new B(), this.onAnimationGroupPauseObservable = new B(), this.onAnimationGroupPlayObservable = new B(), this.metadata = null, this._mask = null, this._animationLoopFlags = [], this._scene = t || we.LastCreatedScene, this._weight = s, this._playOrder = n, this.uniqueId = this._scene.getUniqueId(), this._scene.addAnimationGroup(this);
  }
  /**
   * Add an animation (with its target) in the group
   * @param animation defines the animation we want to add
   * @param target defines the target of the animation
   * @returns the TargetedAnimation object
   */
  addTargetedAnimation(e, t) {
    const s = new or();
    s.animation = e, s.target = t;
    const n = e.getKeys();
    return this._from > n[0].frame && (this._from = n[0].frame), this._to < n[n.length - 1].frame && (this._to = n[n.length - 1].frame), this._enableBlending !== null && (e.enableBlending = this._enableBlending), this._blendingSpeed !== null && (e.blendingSpeed = this._blendingSpeed), this._targetedAnimations.push(s), s;
  }
  /**
   * Remove an animation from the group
   * @param animation defines the animation we want to remove
   */
  removeTargetedAnimation(e) {
    for (let t = this._targetedAnimations.length - 1; t > -1; t--)
      this._targetedAnimations[t].animation === e && this._targetedAnimations.splice(t, 1);
  }
  /**
   * This function will normalize every animation in the group to make sure they all go from beginFrame to endFrame
   * It can add constant keys at begin or end
   * @param beginFrame defines the new begin frame for all animations or the smallest begin frame of all animations if null (defaults to null)
   * @param endFrame defines the new end frame for all animations or the largest end frame of all animations if null (defaults to null)
   * @returns the animation group
   */
  normalize(e = null, t = null) {
    e == null && (e = this._from), t == null && (t = this._to);
    for (let s = 0; s < this._targetedAnimations.length; s++) {
      const i = this._targetedAnimations[s].animation.getKeys(), r = i[0], o = i[i.length - 1];
      if (r.frame > e) {
        const l = {
          frame: e,
          value: r.value,
          inTangent: r.inTangent,
          outTangent: r.outTangent,
          interpolation: r.interpolation
        };
        i.splice(0, 0, l);
      }
      if (o.frame < t) {
        const l = {
          frame: t,
          value: o.value,
          inTangent: o.inTangent,
          outTangent: o.outTangent,
          interpolation: o.interpolation
        };
        i.push(l);
      }
    }
    return this._from = e, this._to = t, this;
  }
  _processLoop(e, t, s) {
    e.onAnimationLoop = () => {
      this.onAnimationLoopObservable.notifyObservers(t), !this._animationLoopFlags[s] && (this._animationLoopFlags[s] = !0, this._animationLoopCount++, this._animationLoopCount === this._numActiveAnimatables && (this.onAnimationGroupLoopObservable.notifyObservers(this), this._animationLoopCount = 0, this._animationLoopFlags.length = 0));
    };
  }
  /**
   * Start all animations on given targets
   * @param loop defines if animations must loop
   * @param speedRatio defines the ratio to apply to animation speed (1 by default)
   * @param from defines the from key (optional)
   * @param to defines the to key (optional)
   * @param isAdditive defines the additive state for the resulting animatables (optional)
   * @returns the current animation group
   */
  start(e = !1, t = 1, s, n, i) {
    if (this._isStarted || this._targetedAnimations.length === 0)
      return this;
    this._loopAnimation = e, this._animationLoopCount = 0, this._animationLoopFlags.length = 0;
    for (let r = 0; r < this._targetedAnimations.length; r++) {
      const o = this._targetedAnimations[r], l = this._scene.beginDirectAnimation(o.target, [o.animation], s !== void 0 ? s : this._from, n !== void 0 ? n : this._to, e, t, void 0, void 0, i !== void 0 ? i : this._isAdditive);
      l.weight = this._weight, l.playOrder = this._playOrder, l.onAnimationEnd = () => {
        this.onAnimationEndObservable.notifyObservers(o), this._checkAnimationGroupEnded(l);
      }, this._processLoop(l, o, r), this._animatables.push(l);
    }
    return this.syncWithMask(), this._scene.sortActiveAnimatables(), this._speedRatio = t, this._isStarted = !0, this._isPaused = !1, this.onAnimationGroupPlayObservable.notifyObservers(this), this;
  }
  /**
   * Pause all animations
   * @returns the animation group
   */
  pause() {
    if (!this._isStarted)
      return this;
    this._isPaused = !0;
    for (let e = 0; e < this._animatables.length; e++)
      this._animatables[e].pause();
    return this.onAnimationGroupPauseObservable.notifyObservers(this), this;
  }
  /**
   * Play all animations to initial state
   * This function will start() the animations if they were not started or will restart() them if they were paused
   * @param loop defines if animations must loop
   * @returns the animation group
   */
  play(e) {
    return this.isStarted && this._animatables.length === this._targetedAnimations.length ? (e !== void 0 && (this.loopAnimation = e), this.restart()) : (this.stop(), this.start(e, this._speedRatio)), this._isPaused = !1, this;
  }
  /**
   * Reset all animations to initial state
   * @returns the animation group
   */
  reset() {
    if (!this._isStarted)
      return this.play(), this.goToFrame(0), this.stop(), this;
    for (let e = 0; e < this._animatables.length; e++)
      this._animatables[e].reset();
    return this;
  }
  /**
   * Restart animations from key 0
   * @returns the animation group
   */
  restart() {
    if (!this._isStarted)
      return this;
    for (let e = 0; e < this._animatables.length; e++)
      this._animatables[e].restart();
    return this.syncWithMask(), this.onAnimationGroupPlayObservable.notifyObservers(this), this;
  }
  /**
   * Stop all animations
   * @returns the animation group
   */
  stop() {
    if (!this._isStarted)
      return this;
    const e = this._animatables.slice();
    for (let s = 0; s < e.length; s++)
      e[s].stop(void 0, void 0, !0);
    let t = 0;
    for (let s = 0; s < this._scene._activeAnimatables.length; s++) {
      const n = this._scene._activeAnimatables[s];
      n._runtimeAnimations.length > 0 && (this._scene._activeAnimatables[t++] = n);
    }
    return this._scene._activeAnimatables.length = t, this._isStarted = !1, this;
  }
  /**
   * Set animation weight for all animatables
   *
   * @since 6.12.4
   *  You can pass the weight to the AnimationGroup constructor, or use the weight property to set it after the group has been created,
   *  making it easier to define the overall animation weight than calling setWeightForAllAnimatables() after the animation group has been started
   * @param weight defines the weight to use
   * @returns the animationGroup
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#animation-weights
   */
  setWeightForAllAnimatables(e) {
    for (let t = 0; t < this._animatables.length; t++) {
      const s = this._animatables[t];
      s.weight = e;
    }
    return this;
  }
  /**
   * Synchronize and normalize all animatables with a source animatable
   * @param root defines the root animatable to synchronize with (null to stop synchronizing)
   * @returns the animationGroup
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#animation-weights
   */
  syncAllAnimationsWith(e) {
    for (let t = 0; t < this._animatables.length; t++)
      this._animatables[t].syncWith(e);
    return this;
  }
  /**
   * Goes to a specific frame in this animation group. Note that the animation group must be in playing or paused status
   * @param frame the frame number to go to
   * @returns the animationGroup
   */
  goToFrame(e) {
    if (!this._isStarted)
      return this;
    for (let t = 0; t < this._animatables.length; t++)
      this._animatables[t].goToFrame(e);
    return this;
  }
  /**
   * Dispose all associated resources
   */
  dispose() {
    this._targetedAnimations.length = 0, this._animatables.length = 0;
    const e = this._scene.animationGroups.indexOf(this);
    if (e > -1 && this._scene.animationGroups.splice(e, 1), this._parentContainer) {
      const t = this._parentContainer.animationGroups.indexOf(this);
      t > -1 && this._parentContainer.animationGroups.splice(t, 1), this._parentContainer = null;
    }
    this.onAnimationEndObservable.clear(), this.onAnimationGroupEndObservable.clear(), this.onAnimationGroupPauseObservable.clear(), this.onAnimationGroupPlayObservable.clear(), this.onAnimationLoopObservable.clear(), this.onAnimationGroupLoopObservable.clear();
  }
  _checkAnimationGroupEnded(e) {
    const t = this._animatables.indexOf(e);
    t > -1 && this._animatables.splice(t, 1), this._animatables.length === 0 && (this._isStarted = !1, this.onAnimationGroupEndObservable.notifyObservers(this));
  }
  /**
   * Clone the current animation group and returns a copy
   * @param newName defines the name of the new group
   * @param targetConverter defines an optional function used to convert current animation targets to new ones
   * @param cloneAnimations defines if the animations should be cloned or referenced
   * @returns the new animation group
   */
  clone(e, t, s = !1) {
    const n = new he(e || this.name, this._scene, this._weight, this._playOrder);
    n._from = this.from, n._to = this.to, n._speedRatio = this.speedRatio, n._loopAnimation = this.loopAnimation, n._isAdditive = this.isAdditive, n._enableBlending = this.enableBlending, n._blendingSpeed = this.blendingSpeed, n.metadata = this.metadata, n.mask = this.mask;
    for (const i of this._targetedAnimations)
      n.addTargetedAnimation(s ? i.animation.clone() : i.animation, t ? t(i.target) : i.target);
    return n;
  }
  /**
   * Serializes the animationGroup to an object
   * @returns Serialized object
   */
  serialize() {
    const e = {};
    e.name = this.name, e.from = this.from, e.to = this.to, e.speedRatio = this.speedRatio, e.loopAnimation = this.loopAnimation, e.isAdditive = this.isAdditive, e.weight = this.weight, e.playOrder = this.playOrder, e.enableBlending = this.enableBlending, e.blendingSpeed = this.blendingSpeed, e.targetedAnimations = [];
    for (let t = 0; t < this.targetedAnimations.length; t++) {
      const s = this.targetedAnimations[t];
      e.targetedAnimations[t] = s.serialize();
    }
    return es && es.HasTags(this) && (e.tags = es.GetTags(this)), this.metadata && (e.metadata = this.metadata), e;
  }
  // Statics
  /**
   * Returns a new AnimationGroup object parsed from the source provided.
   * @param parsedAnimationGroup defines the source
   * @param scene defines the scene that will receive the animationGroup
   * @returns a new AnimationGroup
   */
  static Parse(e, t) {
    const s = new he(e.name, t, e.weight, e.playOrder);
    for (let n = 0; n < e.targetedAnimations.length; n++) {
      const i = e.targetedAnimations[n], r = x.Parse(i.animation), o = i.targetId;
      if (i.animation.property === "influence") {
        const l = t.getMorphTargetById(o);
        l && s.addTargetedAnimation(r, l);
      } else {
        const l = t.getNodeById(o);
        l != null && s.addTargetedAnimation(r, l);
      }
    }
    return es && es.AddTagsTo(s, e.tags), e.from !== null && e.to !== null && s.normalize(e.from, e.to), e.speedRatio !== void 0 && (s._speedRatio = e.speedRatio), e.loopAnimation !== void 0 && (s._loopAnimation = e.loopAnimation), e.isAdditive !== void 0 && (s._isAdditive = e.isAdditive), e.weight !== void 0 && (s._weight = e.weight), e.playOrder !== void 0 && (s._playOrder = e.playOrder), e.enableBlending !== void 0 && (s._enableBlending = e.enableBlending), e.blendingSpeed !== void 0 && (s._blendingSpeed = e.blendingSpeed), e.metadata !== void 0 && (s.metadata = e.metadata), s;
  }
  /** @internal */
  static MakeAnimationAdditive(e, t, s, n = !1, i) {
    let r;
    typeof t == "object" ? r = t : r = {
      referenceFrame: t,
      range: s,
      cloneOriginalAnimationGroup: n,
      clonedAnimationName: i
    };
    let o = e;
    r.cloneOriginalAnimationGroup && (o = e.clone(r.clonedAnimationGroupName || o.name));
    const l = o.targetedAnimations;
    for (let h = 0; h < l.length; h++) {
      const u = l[h];
      u.animation = x.MakeAnimationAdditive(u.animation, r);
    }
    if (o.isAdditive = !0, r.clipKeys) {
      let h = Number.MAX_VALUE, u = -Number.MAX_VALUE;
      const c = o.targetedAnimations;
      for (let d = 0; d < c.length; d++) {
        const m = c[d].animation.getKeys();
        h > m[0].frame && (h = m[0].frame), u < m[m.length - 1].frame && (u = m[m.length - 1].frame);
      }
      o._from = h, o._to = u;
    }
    return o;
  }
  /**
   * Creates a new animation, keeping only the keys that are inside a given key range
   * @param sourceAnimationGroup defines the animation group on which to operate
   * @param fromKey defines the lower bound of the range
   * @param toKey defines the upper bound of the range
   * @param name defines the name of the new animation group. If not provided, use the same name as animationGroup
   * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the keys. Default is false, so animations will be cloned
   * @returns a new animation group stripped from all the keys outside the given range
   */
  static ClipKeys(e, t, s, n, i) {
    const r = e.clone(n || e.name);
    return he.ClipKeysInPlace(r, t, s, i);
  }
  /**
   * Updates an existing animation, keeping only the keys that are inside a given key range
   * @param animationGroup defines the animation group on which to operate
   * @param fromKey defines the lower bound of the range
   * @param toKey defines the upper bound of the range
   * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the keys. Default is false, so animations will be cloned
   * @returns the animationGroup stripped from all the keys outside the given range
   */
  static ClipKeysInPlace(e, t, s, n) {
    return he.ClipInPlace(e, t, s, n, !1);
  }
  /**
   * Creates a new animation, keeping only the frames that are inside a given frame range
   * @param sourceAnimationGroup defines the animation group on which to operate
   * @param fromFrame defines the lower bound of the range
   * @param toFrame defines the upper bound of the range
   * @param name defines the name of the new animation group. If not provided, use the same name as animationGroup
   * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the frames. Default is false, so animations will be cloned
   * @returns a new animation group stripped from all the frames outside the given range
   */
  static ClipFrames(e, t, s, n, i) {
    const r = e.clone(n || e.name);
    return he.ClipFramesInPlace(r, t, s, i);
  }
  /**
   * Updates an existing animation, keeping only the frames that are inside a given frame range
   * @param animationGroup defines the animation group on which to operate
   * @param fromFrame defines the lower bound of the range
   * @param toFrame defines the upper bound of the range
   * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the frames. Default is false, so animations will be cloned
   * @returns the animationGroup stripped from all the frames outside the given range
   */
  static ClipFramesInPlace(e, t, s, n) {
    return he.ClipInPlace(e, t, s, n, !0);
  }
  /**
   * Updates an existing animation, keeping only the keys that are inside a given key or frame range
   * @param animationGroup defines the animation group on which to operate
   * @param start defines the lower bound of the range
   * @param end defines the upper bound of the range
   * @param dontCloneAnimations defines whether or not the animations should be cloned before clipping the keys. Default is false, so animations will be cloned
   * @param useFrame defines if the range is defined by frame numbers or key indices (default is false which means use key indices)
   * @returns the animationGroup stripped from all the keys outside the given range
   */
  static ClipInPlace(e, t, s, n, i = !1) {
    let r = Number.MAX_VALUE, o = -Number.MAX_VALUE;
    const l = e.targetedAnimations;
    for (let h = 0; h < l.length; h++) {
      const u = l[h], c = n ? u.animation : u.animation.clone();
      i && (c.createKeyForFrame(t), c.createKeyForFrame(s));
      const d = c.getKeys(), y = [];
      let T = Number.MAX_VALUE;
      for (let m = 0; m < d.length; m++) {
        const p = d[m];
        if (!i && m >= t && m <= s || i && p.frame >= t && p.frame <= s) {
          const C = {
            frame: p.frame,
            value: p.value.clone ? p.value.clone() : p.value,
            inTangent: p.inTangent,
            outTangent: p.outTangent,
            interpolation: p.interpolation,
            lockedTangent: p.lockedTangent
          };
          T === Number.MAX_VALUE && (T = C.frame), C.frame -= T, y.push(C);
        }
      }
      if (y.length === 0) {
        l.splice(h, 1), h--;
        continue;
      }
      r > y[0].frame && (r = y[0].frame), o < y[y.length - 1].frame && (o = y[y.length - 1].frame), c.setKeys(y, !0), u.animation = c;
    }
    return e._from = r, e._to = o, e;
  }
  /**
   * Returns the string "AnimationGroup"
   * @returns "AnimationGroup"
   */
  getClassName() {
    return "AnimationGroup";
  }
  /**
   * Creates a detailed string about the object
   * @param fullDetails defines if the output string will support multiple levels of logging within scene loading
   * @returns a string representing the object
   */
  toString(e) {
    let t = "Name: " + this.name;
    return t += ", type: " + this.getClassName(), e && (t += ", from: " + this._from, t += ", to: " + this._to, t += ", isStarted: " + this._isStarted, t += ", speedRatio: " + this._speedRatio, t += ", targetedAnimations length: " + this._targetedAnimations.length, t += ", animatables length: " + this._animatables), t;
  }
}
class Tn extends G {
  /**
   * Gets the number of layers of the texture
   */
  get depth() {
    return this._depth;
  }
  /**
   * Create a new RawTexture2DArray
   * @param data defines the data of the texture
   * @param width defines the width of the texture
   * @param height defines the height of the texture
   * @param depth defines the number of layers of the texture
   * @param format defines the texture format to use
   * @param scene defines the hosting scene
   * @param generateMipMaps defines a boolean indicating if mip levels should be generated (true by default)
   * @param invertY defines if texture must be stored with Y axis inverted
   * @param samplingMode defines the sampling mode to use (Texture.TRILINEAR_SAMPLINGMODE by default)
   * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
   * @param creationFlags specific flags to use when creating the texture (1 for storage textures, for eg)
   */
  constructor(e, t, s, n, i, r, o = !0, l = !1, h = G.TRILINEAR_SAMPLINGMODE, u = 0, c) {
    super(null, r, !o, l), this.format = i, this._texture = r.getEngine().createRawTexture2DArray(e, t, s, n, i, o, l, h, null, u, c), this._depth = n, this.is2DArray = !0;
  }
  /**
   * Update the texture with new data
   * @param data defines the data to store in the texture
   */
  update(e) {
    this._texture && this._getEngine().updateRawTexture2DArray(this._texture, e, this._texture.format, this._texture.invertY, null, this._texture.type);
  }
  /**
   * Creates a RGBA texture from some data.
   * @param data Define the texture data
   * @param width Define the width of the texture
   * @param height Define the height of the texture
   * @param depth defines the number of layers of the texture
   * @param scene defines the scene the texture will belong to
   * @param generateMipMaps Define whether or not to create mip maps for the texture
   * @param invertY define if the data should be flipped on Y when uploaded to the GPU
   * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
   * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
   * @returns the RGBA texture
   */
  static CreateRGBATexture(e, t, s, n, i, r = !0, o = !1, l = 3, h = 0) {
    return new Tn(e, t, s, n, 5, i, r, o, l, h);
  }
}
class _e {
  /**
   * Sets a boolean indicating that adding new target or updating an existing target will not update the underlying data buffers
   */
  set areUpdatesFrozen(e) {
    e ? this._blockCounter++ : (this._blockCounter--, this._blockCounter <= 0 && (this._blockCounter = 0, this._syncActiveTargets(!0)));
  }
  get areUpdatesFrozen() {
    return this._blockCounter > 0;
  }
  /**
   * Creates a new MorphTargetManager
   * @param scene defines the current scene
   */
  constructor(e = null) {
    if (this._targets = new Array(), this._targetInfluenceChangedObservers = new Array(), this._targetDataLayoutChangedObservers = new Array(), this._activeTargets = new Hi(16), this._supportsNormals = !1, this._supportsTangents = !1, this._supportsUVs = !1, this._vertexCount = 0, this._textureVertexStride = 0, this._textureWidth = 0, this._textureHeight = 1, this._uniqueId = 0, this._tempInfluences = new Array(), this._canUseTextureForTargets = !1, this._blockCounter = 0, this._parentContainer = null, this.optimizeInfluencers = !0, this.enableNormalMorphing = !0, this.enableTangentMorphing = !0, this.enableUVMorphing = !0, this._numMaxInfluencers = 0, this._useTextureToStoreTargets = !0, e || (e = we.LastCreatedScene), this._scene = e, this._scene) {
      this._scene.addMorphTargetManager(this), this._uniqueId = this._scene.getUniqueId();
      const t = this._scene.getEngine().getCaps();
      this._canUseTextureForTargets = t.canUseGLVertexID && t.textureFloat && t.maxVertexTextureImageUnits > 0 && t.texture2DArrayMaxLayerCount > 1;
    }
  }
  /**
   * Gets or sets the maximum number of influencers (targets) (default value: 0).
   * Setting a value for this property can lead to a smoother experience, as only one shader will be compiled, which will use this value as the maximum number of influencers.
   * If you leave the value at 0 (default), a new shader will be compiled every time the number of active influencers changes. This can cause problems, as compiling a shader takes time.
   * If you assign a non-zero value to this property, you need to ensure that this value is greater than the maximum number of (active) influencers you'll need for this morph manager.
   * Otherwise, the number of active influencers will be truncated at the value you set for this property, which can lead to unexpected results.
   * Note that this property has no effect if "useTextureToStoreTargets" is false.
   */
  get numMaxInfluencers() {
    return this._numMaxInfluencers;
  }
  set numMaxInfluencers(e) {
    this._numMaxInfluencers !== e && (this._numMaxInfluencers = e, this._syncActiveTargets(!0));
  }
  /**
   * Gets the unique ID of this manager
   */
  get uniqueId() {
    return this._uniqueId;
  }
  /**
   * Gets the number of vertices handled by this manager
   */
  get vertexCount() {
    return this._vertexCount;
  }
  /**
   * Gets a boolean indicating if this manager supports morphing of normals
   */
  get supportsNormals() {
    return this._supportsNormals && this.enableNormalMorphing;
  }
  /**
   * Gets a boolean indicating if this manager supports morphing of tangents
   */
  get supportsTangents() {
    return this._supportsTangents && this.enableTangentMorphing;
  }
  /**
   * Gets a boolean indicating if this manager supports morphing of texture coordinates
   */
  get supportsUVs() {
    return this._supportsUVs && this.enableUVMorphing;
  }
  /**
   * Gets the number of targets stored in this manager
   */
  get numTargets() {
    return this._targets.length;
  }
  /**
   * Gets the number of influencers (ie. the number of targets with influences > 0)
   */
  get numInfluencers() {
    return this._activeTargets.length;
  }
  /**
   * Gets the list of influences (one per target)
   */
  get influences() {
    return this._influences;
  }
  /**
   * Gets or sets a boolean indicating that targets should be stored as a texture instead of using vertex attributes (default is true).
   * Please note that this option is not available if the hardware does not support it
   */
  get useTextureToStoreTargets() {
    return this._useTextureToStoreTargets;
  }
  set useTextureToStoreTargets(e) {
    this._useTextureToStoreTargets = e;
  }
  /**
   * Gets a boolean indicating that the targets are stored into a texture (instead of as attributes)
   */
  get isUsingTextureForTargets() {
    return _e.EnableTextureStorage && this.useTextureToStoreTargets && this._canUseTextureForTargets && !this._scene?.getEngine().getCaps().disableMorphTargetTexture;
  }
  /**
   * Gets the active target at specified index. An active target is a target with an influence > 0
   * @param index defines the index to check
   * @returns the requested target
   */
  getActiveTarget(e) {
    return this._activeTargets.data[e];
  }
  /**
   * Gets the target at specified index
   * @param index defines the index to check
   * @returns the requested target
   */
  getTarget(e) {
    return this._targets[e];
  }
  /**
   * Add a new target to this manager
   * @param target defines the target to add
   */
  addTarget(e) {
    this._targets.push(e), this._targetInfluenceChangedObservers.push(e.onInfluenceChanged.add((t) => {
      this._syncActiveTargets(t);
    })), this._targetDataLayoutChangedObservers.push(e._onDataLayoutChanged.add(() => {
      this._syncActiveTargets(!0);
    })), this._syncActiveTargets(!0);
  }
  /**
   * Removes a target from the manager
   * @param target defines the target to remove
   */
  removeTarget(e) {
    const t = this._targets.indexOf(e);
    t >= 0 && (this._targets.splice(t, 1), e.onInfluenceChanged.remove(this._targetInfluenceChangedObservers.splice(t, 1)[0]), e._onDataLayoutChanged.remove(this._targetDataLayoutChangedObservers.splice(t, 1)[0]), this._syncActiveTargets(!0)), this._scene && this._scene.stopAnimation(e);
  }
  /**
   * @internal
   */
  _bind(e) {
    e.setFloat3("morphTargetTextureInfo", this._textureVertexStride, this._textureWidth, this._textureHeight), e.setFloatArray("morphTargetTextureIndices", this._morphTargetTextureIndices), e.setTexture("morphTargets", this._targetStoreTexture), e.setInt("morphTargetCount", this.numInfluencers);
  }
  /**
   * Clone the current manager
   * @returns a new MorphTargetManager
   */
  clone() {
    const e = new _e(this._scene);
    for (const t of this._targets)
      e.addTarget(t.clone());
    return e.enableNormalMorphing = this.enableNormalMorphing, e.enableTangentMorphing = this.enableTangentMorphing, e.enableUVMorphing = this.enableUVMorphing, e;
  }
  /**
   * Serializes the current manager into a Serialization object
   * @returns the serialized object
   */
  serialize() {
    const e = {};
    e.id = this.uniqueId, e.targets = [];
    for (const t of this._targets)
      e.targets.push(t.serialize());
    return e;
  }
  _syncActiveTargets(e) {
    if (this.areUpdatesFrozen)
      return;
    let t = 0;
    this._activeTargets.reset(), this._supportsNormals = !0, this._supportsTangents = !0, this._supportsUVs = !0, this._vertexCount = 0, this._scene && this._targets.length > this._scene.getEngine().getCaps().texture2DArrayMaxLayerCount && (this.useTextureToStoreTargets = !1), (!this._morphTargetTextureIndices || this._morphTargetTextureIndices.length !== this._targets.length) && (this._morphTargetTextureIndices = new Float32Array(this._targets.length));
    let s = -1;
    for (const n of this._targets) {
      if (s++, n.influence === 0 && this.optimizeInfluencers)
        continue;
      if (this._activeTargets.length >= _e.MaxActiveMorphTargetsInVertexAttributeMode && !this.isUsingTextureForTargets)
        break;
      this._activeTargets.push(n), this._morphTargetTextureIndices[t] = s, this._tempInfluences[t++] = n.influence, this._supportsNormals = this._supportsNormals && n.hasNormals, this._supportsTangents = this._supportsTangents && n.hasTangents, this._supportsUVs = this._supportsUVs && n.hasUVs;
      const i = n.getPositions();
      if (i) {
        const r = i.length / 3;
        if (this._vertexCount === 0)
          this._vertexCount = r;
        else if (this._vertexCount !== r) {
          v.Error("Incompatible target. Targets must all have the same vertices count.");
          return;
        }
      }
    }
    this._morphTargetTextureIndices.length !== t && (this._morphTargetTextureIndices = this._morphTargetTextureIndices.slice(0, t)), (!this._influences || this._influences.length !== t) && (this._influences = new Float32Array(t));
    for (let n = 0; n < t; n++)
      this._influences[n] = this._tempInfluences[n];
    e && this.synchronize();
  }
  /**
   * Synchronize the targets with all the meshes using this morph target manager
   */
  synchronize() {
    if (!(!this._scene || this.areUpdatesFrozen)) {
      if (this.isUsingTextureForTargets && (this._vertexCount || this.numMaxInfluencers > 0)) {
        this._textureVertexStride = 1, this._supportsNormals && this._textureVertexStride++, this._supportsTangents && this._textureVertexStride++, this._supportsUVs && this._textureVertexStride++, this._textureWidth = this._vertexCount * this._textureVertexStride || 1, this._textureHeight = 1;
        const e = this._scene.getEngine().getCaps().maxTextureSize;
        this._textureWidth > e && (this._textureHeight = Math.ceil(this._textureWidth / e), this._textureWidth = e);
        let t = !0;
        if (this._targetStoreTexture) {
          const s = this._targetStoreTexture.getSize();
          s.width === this._textureWidth && s.height === this._textureHeight && this._targetStoreTexture.depth === this._targets.length && (t = !1);
        }
        if (t) {
          this._targetStoreTexture && this._targetStoreTexture.dispose();
          const s = this._targets.length, n = new Float32Array(s * this._textureWidth * this._textureHeight * 4);
          let i = 0;
          for (let r = 0; r < s; r++) {
            const o = this._targets[r], l = o.getPositions(), h = o.getNormals(), u = o.getUVs(), c = o.getTangents();
            if (!l) {
              r === 0 && v.Error("Invalid morph target. Target must have positions.");
              return;
            }
            i = r * this._textureWidth * this._textureHeight * 4;
            for (let d = 0; d < this._vertexCount; d++)
              n[i] = l[d * 3], n[i + 1] = l[d * 3 + 1], n[i + 2] = l[d * 3 + 2], i += 4, this._supportsNormals && h && (n[i] = h[d * 3], n[i + 1] = h[d * 3 + 1], n[i + 2] = h[d * 3 + 2], i += 4), this._supportsUVs && u && (n[i] = u[d * 2], n[i + 1] = u[d * 2 + 1], i += 4), this._supportsTangents && c && (n[i] = c[d * 3], n[i + 1] = c[d * 3 + 1], n[i + 2] = c[d * 3 + 2], i += 4);
          }
          this._targetStoreTexture = Tn.CreateRGBATexture(n, this._textureWidth, this._textureHeight, s, this._scene, !1, !1, 1, 1);
        }
      }
      for (const e of this._scene.meshes)
        e.morphTargetManager === this && e._syncGeometryWithMorphTargetManager();
    }
  }
  /**
   * Release all resources
   */
  dispose() {
    if (this._targetStoreTexture && this._targetStoreTexture.dispose(), this._targetStoreTexture = null, this._scene) {
      if (this._scene.removeMorphTargetManager(this), this._parentContainer) {
        const e = this._parentContainer.morphTargetManagers.indexOf(this);
        e > -1 && this._parentContainer.morphTargetManagers.splice(e, 1), this._parentContainer = null;
      }
      for (const e of this._targets)
        this._scene.stopAnimation(e);
    }
  }
  // Statics
  /**
   * Creates a new MorphTargetManager from serialized data
   * @param serializationObject defines the serialized data
   * @param scene defines the hosting scene
   * @returns the new MorphTargetManager
   */
  static Parse(e, t) {
    const s = new _e(t);
    s._uniqueId = e.id;
    for (const n of e.targets)
      s.addTarget(Fn.Parse(n, t));
    return s;
  }
}
_e.EnableTextureStorage = !0;
_e.MaxActiveMorphTargetsInVertexAttributeMode = 8;
function Sn(a, e, t, s) {
  return N.FromArray(e, t).scaleInPlace(s);
}
function ar(a, e, t, s) {
  return ie.FromArray(e, t).scaleInPlace(s);
}
function lr(a, e, t, s) {
  const n = new Array(a._numMorphTargets);
  for (let i = 0; i < n.length; i++)
    n[i] = e[t++] * s;
  return n;
}
class os {
  /** @internal */
  constructor(e, t, s, n) {
    this.type = e, this.name = t, this.getValue = s, this.getStride = n;
  }
  _buildAnimation(e, t, s) {
    const n = new x(e, this.name, t, this.type);
    return n.setKeys(s), n;
  }
}
class Ps extends os {
  /** @internal */
  buildAnimations(e, t, s, n, i) {
    i(e._babylonTransformNode, this._buildAnimation(t, s, n));
  }
}
class hr extends os {
  buildAnimations(e, t, s, n, i) {
    if (e._numMorphTargets)
      for (let r = 0; r < e._numMorphTargets; r++) {
        const o = new x(`${t}_${r}`, this.name, s, this.type);
        if (o.setKeys(n.map((l) => ({
          frame: l.frame,
          inTangent: l.inTangent ? l.inTangent[r] : void 0,
          value: l.value[r],
          outTangent: l.outTangent ? l.outTangent[r] : void 0,
          interpolation: l.interpolation
        }))), e._primitiveBabylonMeshes) {
          for (const l of e._primitiveBabylonMeshes)
            if (l.morphTargetManager) {
              const h = l.morphTargetManager.getTarget(r), u = o.clone();
              h.animations.push(u), i(h, u);
            }
        }
      }
  }
}
const ns = {
  translation: [new Ps(x.ANIMATIONTYPE_VECTOR3, "position", Sn, () => 3)],
  rotation: [new Ps(x.ANIMATIONTYPE_QUATERNION, "rotationQuaternion", ar, () => 4)],
  scale: [new Ps(x.ANIMATIONTYPE_VECTOR3, "scaling", Sn, () => 3)],
  weights: [new hr(x.ANIMATIONTYPE_FLOAT, "influence", lr, (a) => a._numMorphTargets)]
};
function qn(...a) {
  const e = (t) => t && typeof t == "object";
  return a.reduce((t, s) => (Object.keys(s).forEach((n) => {
    const i = t[n], r = s[n];
    Array.isArray(i) && Array.isArray(r) ? t[n] = i.concat(...r) : e(i) && e(r) ? t[n] = qn(i, r) : t[n] = r;
  }), t), {});
}
class A {
  /**
   * Gets an item from the given array.
   * @param context The context when loading the asset
   * @param array The array to get the item from
   * @param index The index to the array
   * @returns The array item
   */
  static Get(e, t, s) {
    if (!t || s == null || !t[s])
      throw new Error(`${e}: Failed to find index (${s})`);
    return t[s];
  }
  /**
   * Gets an item from the given array or returns null if not available.
   * @param array The array to get the item from
   * @param index The index to the array
   * @returns The array item or null
   */
  static TryGet(e, t) {
    return !e || t == null || !e[t] ? null : e[t];
  }
  /**
   * Assign an `index` field to each item of the given array.
   * @param array The array of items
   */
  static Assign(e) {
    if (e)
      for (let t = 0; t < e.length; t++)
        e[t].index = t;
  }
}
class _ {
  /**
   * Registers a loader extension.
   * @param name The name of the loader extension.
   * @param factory The factory function that creates the loader extension.
   */
  static RegisterExtension(e, t) {
    _.UnregisterExtension(e) && v.Warn(`Extension with the name '${e}' already exists`), _._RegisteredExtensions[e] = {
      factory: t
    };
  }
  /**
   * Unregisters a loader extension.
   * @param name The name of the loader extension.
   * @returns A boolean indicating whether the extension has been unregistered
   */
  static UnregisterExtension(e) {
    return _._RegisteredExtensions[e] ? (delete _._RegisteredExtensions[e], !0) : !1;
  }
  /**
   * The object that represents the glTF JSON.
   */
  get gltf() {
    if (!this._gltf)
      throw new Error("glTF JSON is not available");
    return this._gltf;
  }
  /**
   * The BIN chunk of a binary glTF.
   */
  get bin() {
    return this._bin;
  }
  /**
   * The parent file loader.
   */
  get parent() {
    return this._parent;
  }
  /**
   * The Babylon scene when loading the asset.
   */
  get babylonScene() {
    if (!this._babylonScene)
      throw new Error("Scene is not available");
    return this._babylonScene;
  }
  /**
   * The root Babylon node when loading the asset.
   */
  get rootBabylonMesh() {
    return this._rootBabylonMesh;
  }
  /**
   * The root url when loading the asset.
   */
  get rootUrl() {
    return this._rootUrl;
  }
  /**
   * @internal
   */
  constructor(e) {
    this._completePromises = new Array(), this._assetContainer = null, this._babylonLights = [], this._disableInstancedMesh = 0, this._allMaterialsDirtyRequired = !1, this._extensions = new Array(), this._disposed = !1, this._rootUrl = null, this._fileName = null, this._uniqueRootUrl = null, this._bin = null, this._rootBabylonMesh = null, this._defaultBabylonMaterialData = {}, this._postSceneLoadActions = new Array(), this._parent = e;
  }
  /** @internal */
  dispose() {
    this._disposed || (this._disposed = !0, this._completePromises.length = 0, this._extensions.forEach((e) => e.dispose && e.dispose()), this._extensions.length = 0, this._gltf = null, this._bin = null, this._babylonScene = null, this._rootBabylonMesh = null, this._defaultBabylonMaterialData = {}, this._postSceneLoadActions.length = 0, this._parent.dispose());
  }
  /**
   * @internal
   */
  importMeshAsync(e, t, s, n, i, r, o = "") {
    return Promise.resolve().then(() => {
      this._babylonScene = t, this._assetContainer = s, this._loadData(n);
      let l = null;
      if (e) {
        const h = {};
        if (this._gltf.nodes)
          for (const c of this._gltf.nodes)
            c.name && (h[c.name] = c.index);
        l = (e instanceof Array ? e : [e]).map((c) => {
          const d = h[c];
          if (d === void 0)
            throw new Error(`Failed to find node '${c}'`);
          return d;
        });
      }
      return this._loadAsync(i, o, l, () => ({
        meshes: this._getMeshes(),
        particleSystems: [],
        skeletons: this._getSkeletons(),
        animationGroups: this._getAnimationGroups(),
        lights: this._babylonLights,
        transformNodes: this._getTransformNodes(),
        geometries: this._getGeometries(),
        spriteManagers: []
      }));
    });
  }
  /**
   * @internal
   */
  loadAsync(e, t, s, n, i = "") {
    return Promise.resolve().then(() => (this._babylonScene = e, this._loadData(t), this._loadAsync(s, i, null, () => {
    })));
  }
  _loadAsync(e, t, s, n) {
    return Promise.resolve().then(() => {
      this._rootUrl = e, this._uniqueRootUrl = !e.startsWith("file:") && t ? e : `${e}${Date.now()}/`, this._fileName = t, this._allMaterialsDirtyRequired = !1, this._loadExtensions(), this._checkExtensions();
      const i = `${ee[ee.LOADING]} => ${ee[ee.READY]}`, r = `${ee[ee.LOADING]} => ${ee[ee.COMPLETE]}`;
      this._parent._startPerformanceCounter(i), this._parent._startPerformanceCounter(r), this._parent._setState(ee.LOADING), this._extensionsOnLoading();
      const o = new Array(), l = this._babylonScene.blockMaterialDirtyMechanism;
      if (this._babylonScene.blockMaterialDirtyMechanism = !0, !this.parent.loadOnlyMaterials) {
        if (s)
          o.push(this.loadSceneAsync("/nodes", { nodes: s, index: -1 }));
        else if (this._gltf.scene != null || this._gltf.scenes && this._gltf.scenes[0]) {
          const u = A.Get("/scene", this._gltf.scenes, this._gltf.scene || 0);
          o.push(this.loadSceneAsync(`/scenes/${u.index}`, u));
        }
      }
      if (!this.parent.skipMaterials && this.parent.loadAllMaterials && this._gltf.materials)
        for (let u = 0; u < this._gltf.materials.length; ++u) {
          const c = this._gltf.materials[u], d = "/materials/" + u, y = oe.TriangleFillMode;
          o.push(this._loadMaterialAsync(d, c, null, y, () => {
          }));
        }
      return this._allMaterialsDirtyRequired ? this._babylonScene.blockMaterialDirtyMechanism = l : this._babylonScene._forceBlockMaterialDirtyMechanism(l), this._parent.compileMaterials && o.push(this._compileMaterialsAsync()), this._parent.compileShadowGenerators && o.push(this._compileShadowGeneratorsAsync()), Promise.all(o).then(() => (this._rootBabylonMesh && this._rootBabylonMesh !== this._parent.customRootNode && this._rootBabylonMesh.setEnabled(!0), this._extensionsOnReady(), this._parent._setState(ee.READY), this._startAnimations(), n())).then((u) => (this._parent._endPerformanceCounter(i), $.SetImmediate(() => {
        this._disposed || Promise.all(this._completePromises).then(() => {
          this._parent._endPerformanceCounter(r), this._parent._setState(ee.COMPLETE), this._parent.onCompleteObservable.notifyObservers(void 0), this._parent.onCompleteObservable.clear(), this.dispose();
        }, (c) => {
          this._parent.onErrorObservable.notifyObservers(c), this._parent.onErrorObservable.clear(), this.dispose();
        });
      }), u));
    }).catch((i) => {
      throw this._disposed || (this._parent.onErrorObservable.notifyObservers(i), this._parent.onErrorObservable.clear(), this.dispose()), i;
    });
  }
  _loadData(e) {
    if (this._gltf = e.json, this._setupData(), e.bin) {
      const t = this._gltf.buffers;
      if (t && t[0] && !t[0].uri) {
        const s = t[0];
        (s.byteLength < e.bin.byteLength - 3 || s.byteLength > e.bin.byteLength) && v.Warn(`Binary buffer length (${s.byteLength}) from JSON does not match chunk length (${e.bin.byteLength})`), this._bin = e.bin;
      } else
        v.Warn("Unexpected BIN chunk");
    }
  }
  _setupData() {
    if (A.Assign(this._gltf.accessors), A.Assign(this._gltf.animations), A.Assign(this._gltf.buffers), A.Assign(this._gltf.bufferViews), A.Assign(this._gltf.cameras), A.Assign(this._gltf.images), A.Assign(this._gltf.materials), A.Assign(this._gltf.meshes), A.Assign(this._gltf.nodes), A.Assign(this._gltf.samplers), A.Assign(this._gltf.scenes), A.Assign(this._gltf.skins), A.Assign(this._gltf.textures), this._gltf.nodes) {
      const e = {};
      for (const s of this._gltf.nodes)
        if (s.children)
          for (const n of s.children)
            e[n] = s.index;
      const t = this._createRootNode();
      for (const s of this._gltf.nodes) {
        const n = e[s.index];
        s.parent = n === void 0 ? t : this._gltf.nodes[n];
      }
    }
  }
  _loadExtensions() {
    for (const e in _._RegisteredExtensions) {
      const t = _._RegisteredExtensions[e].factory(this);
      t.name !== e && v.Warn(`The name of the glTF loader extension instance does not match the registered name: ${t.name} !== ${e}`), this._extensions.push(t), this._parent.onExtensionLoadedObservable.notifyObservers(t);
    }
    this._extensions.sort((e, t) => (e.order || Number.MAX_VALUE) - (t.order || Number.MAX_VALUE)), this._parent.onExtensionLoadedObservable.clear();
  }
  _checkExtensions() {
    if (this._gltf.extensionsRequired) {
      for (const e of this._gltf.extensionsRequired)
        if (!this._extensions.some((s) => s.name === e && s.enabled))
          throw new Error(`Required extension ${e} is not available`);
    }
  }
  _createRootNode() {
    if (this._parent.customRootNode !== void 0)
      return this._rootBabylonMesh = this._parent.customRootNode, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _babylonTransformNode: this._rootBabylonMesh === null ? void 0 : this._rootBabylonMesh,
        index: -1
      };
    this._babylonScene._blockEntityCollection = !!this._assetContainer;
    const e = new be("__root__", this._babylonScene);
    this._rootBabylonMesh = e, this._rootBabylonMesh._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, this._rootBabylonMesh.setEnabled(!1);
    const t = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      _babylonTransformNode: this._rootBabylonMesh,
      index: -1
    };
    switch (this._parent.coordinateSystemMode) {
      case rs.AUTO: {
        this._babylonScene.useRightHandedSystem || (t.rotation = [0, 1, 0, 0], t.scale = [1, 1, -1], _._LoadTransform(t, this._rootBabylonMesh));
        break;
      }
      case rs.FORCE_RIGHT_HANDED: {
        this._babylonScene.useRightHandedSystem = !0;
        break;
      }
      default:
        throw new Error(`Invalid coordinate system mode (${this._parent.coordinateSystemMode})`);
    }
    return this._parent.onMeshLoadedObservable.notifyObservers(e), t;
  }
  /**
   * Loads a glTF scene.
   * @param context The context when loading the asset
   * @param scene The glTF scene property
   * @returns A promise that resolves when the load is complete
   */
  loadSceneAsync(e, t) {
    const s = this._extensionsLoadSceneAsync(e, t);
    if (s)
      return s;
    const n = new Array();
    if (this.logOpen(`${e} ${t.name || ""}`), t.nodes)
      for (const i of t.nodes) {
        const r = A.Get(`${e}/nodes/${i}`, this._gltf.nodes, i);
        n.push(this.loadNodeAsync(`/nodes/${r.index}`, r, (o) => {
          o.parent = this._rootBabylonMesh;
        }));
      }
    for (const i of this._postSceneLoadActions)
      i();
    return n.push(this._loadAnimationsAsync()), this.logClose(), Promise.all(n).then(() => {
    });
  }
  _forEachPrimitive(e, t) {
    if (e._primitiveBabylonMeshes)
      for (const s of e._primitiveBabylonMeshes)
        t(s);
  }
  _getGeometries() {
    const e = [], t = this._gltf.nodes;
    if (t)
      for (const s of t)
        this._forEachPrimitive(s, (n) => {
          const i = n.geometry;
          i && e.indexOf(i) === -1 && e.push(i);
        });
    return e;
  }
  _getMeshes() {
    const e = [];
    this._rootBabylonMesh instanceof xs && e.push(this._rootBabylonMesh);
    const t = this._gltf.nodes;
    if (t)
      for (const s of t)
        this._forEachPrimitive(s, (n) => {
          e.push(n);
        });
    return e;
  }
  _getTransformNodes() {
    const e = [], t = this._gltf.nodes;
    if (t)
      for (const s of t)
        s._babylonTransformNode && s._babylonTransformNode.getClassName() === "TransformNode" && e.push(s._babylonTransformNode), s._babylonTransformNodeForSkin && e.push(s._babylonTransformNodeForSkin);
    return e;
  }
  _getSkeletons() {
    const e = [], t = this._gltf.skins;
    if (t)
      for (const s of t)
        s._data && e.push(s._data.babylonSkeleton);
    return e;
  }
  _getAnimationGroups() {
    const e = [], t = this._gltf.animations;
    if (t)
      for (const s of t)
        s._babylonAnimationGroup && e.push(s._babylonAnimationGroup);
    return e;
  }
  _startAnimations() {
    switch (this._parent.animationStartMode) {
      case ve.NONE:
        break;
      case ve.FIRST: {
        const e = this._getAnimationGroups();
        e.length !== 0 && e[0].start(!0);
        break;
      }
      case ve.ALL: {
        const e = this._getAnimationGroups();
        for (const t of e)
          t.start(!0);
        break;
      }
      default: {
        v.Error(`Invalid animation start mode (${this._parent.animationStartMode})`);
        return;
      }
    }
  }
  /**
   * Loads a glTF node.
   * @param context The context when loading the asset
   * @param node The glTF node property
   * @param assign A function called synchronously after parsing the glTF properties
   * @returns A promise that resolves with the loaded Babylon mesh when the load is complete
   */
  loadNodeAsync(e, t, s = () => {
  }) {
    const n = this._extensionsLoadNodeAsync(e, t, s);
    if (n)
      return n;
    if (t._babylonTransformNode)
      throw new Error(`${e}: Invalid recursive node hierarchy`);
    const i = new Array();
    this.logOpen(`${e} ${t.name || ""}`);
    const r = (o) => {
      if (_.AddPointerMetadata(o, e), _._LoadTransform(t, o), t.camera != null) {
        const l = A.Get(`${e}/camera`, this._gltf.cameras, t.camera);
        i.push(this.loadCameraAsync(`/cameras/${l.index}`, l, (h) => {
          h.parent = o;
        }));
      }
      if (t.children)
        for (const l of t.children) {
          const h = A.Get(`${e}/children/${l}`, this._gltf.nodes, l);
          i.push(this.loadNodeAsync(`/nodes/${h.index}`, h, (u) => {
            u.parent = o;
          }));
        }
      s(o);
    };
    if (t.mesh == null || t.skin != null) {
      const o = t.name || `node${t.index}`;
      this._babylonScene._blockEntityCollection = !!this._assetContainer;
      const l = new Ts(o, this._babylonScene);
      l._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, t.mesh == null ? t._babylonTransformNode = l : t._babylonTransformNodeForSkin = l, r(l);
    }
    if (t.mesh != null)
      if (t.skin == null) {
        const o = A.Get(`${e}/mesh`, this._gltf.meshes, t.mesh);
        i.push(this._loadMeshAsync(`/meshes/${o.index}`, t, o, r));
      } else {
        const o = A.Get(`${e}/mesh`, this._gltf.meshes, t.mesh);
        i.push(this._loadMeshAsync(`/meshes/${o.index}`, t, o, (l) => {
          const h = t._babylonTransformNodeForSkin;
          l.metadata = qn(h.metadata, l.metadata || {});
          const u = A.Get(`${e}/skin`, this._gltf.skins, t.skin);
          i.push(this._loadSkinAsync(`/skins/${u.index}`, t, u, (c) => {
            this._forEachPrimitive(t, (d) => {
              d.skeleton = c;
            }), this._postSceneLoadActions.push(() => {
              if (u.skeleton != null) {
                const d = A.Get(`/skins/${u.index}/skeleton`, this._gltf.nodes, u.skeleton).parent;
                t.index === d.index ? l.parent = h.parent : l.parent = d._babylonTransformNode;
              } else
                l.parent = this._rootBabylonMesh;
              this._parent.onSkinLoadedObservable.notifyObservers({ node: h, skinnedNode: l });
            });
          }));
        }));
      }
    return this.logClose(), Promise.all(i).then(() => (this._forEachPrimitive(t, (o) => {
      o.geometry && o.geometry.useBoundingInfoFromGeometry ? o._updateBoundingInfo() : o.refreshBoundingInfo(!0, !0);
    }), t._babylonTransformNode));
  }
  _loadMeshAsync(e, t, s, n) {
    const i = s.primitives;
    if (!i || !i.length)
      throw new Error(`${e}: Primitives are missing`);
    i[0].index == null && A.Assign(i);
    const r = new Array();
    this.logOpen(`${e} ${s.name || ""}`);
    const o = t.name || `node${t.index}`;
    if (i.length === 1) {
      const l = s.primitives[0];
      r.push(this._loadMeshPrimitiveAsync(`${e}/primitives/${l.index}`, o, t, s, l, (h) => {
        t._babylonTransformNode = h, t._primitiveBabylonMeshes = [h];
      }));
    } else {
      this._babylonScene._blockEntityCollection = !!this._assetContainer, t._babylonTransformNode = new Ts(o, this._babylonScene), t._babylonTransformNode._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, t._primitiveBabylonMeshes = [];
      for (const l of i)
        r.push(this._loadMeshPrimitiveAsync(`${e}/primitives/${l.index}`, `${o}_primitive${l.index}`, t, s, l, (h) => {
          h.parent = t._babylonTransformNode, t._primitiveBabylonMeshes.push(h);
        }));
    }
    return n(t._babylonTransformNode), this.logClose(), Promise.all(r).then(() => t._babylonTransformNode);
  }
  /**
   * @internal Define this method to modify the default behavior when loading data for mesh primitives.
   * @param context The context when loading the asset
   * @param name The mesh name when loading the asset
   * @param node The glTF node when loading the asset
   * @param mesh The glTF mesh when loading the asset
   * @param primitive The glTF mesh primitive property
   * @param assign A function called synchronously after parsing the glTF properties
   * @returns A promise that resolves with the loaded mesh when the load is complete or null if not handled
   */
  _loadMeshPrimitiveAsync(e, t, s, n, i, r) {
    const o = this._extensionsLoadMeshPrimitiveAsync(e, t, s, n, i, r);
    if (o)
      return o;
    this.logOpen(`${e}`);
    const l = this._disableInstancedMesh === 0 && this._parent.createInstances && s.skin == null && !n.primitives[0].targets;
    let h, u;
    if (l && i._instanceData)
      this._babylonScene._blockEntityCollection = !!this._assetContainer, h = i._instanceData.babylonSourceMesh.createInstance(t), h._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, u = i._instanceData.promise;
    else {
      const c = new Array();
      this._babylonScene._blockEntityCollection = !!this._assetContainer;
      const d = new be(t, this._babylonScene);
      d._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, d.overrideMaterialSideOrientation = this._babylonScene.useRightHandedSystem ? oe.CounterClockWiseSideOrientation : oe.ClockWiseSideOrientation, this._createMorphTargets(e, s, n, i, d), c.push(this._loadVertexDataAsync(e, i, d).then((T) => this._loadMorphTargetsAsync(e, i, d, T).then(() => {
        this._disposed || (this._babylonScene._blockEntityCollection = !!this._assetContainer, T.applyToMesh(d), T._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1);
      })));
      const y = _._GetDrawMode(e, i.mode);
      if (i.material == null) {
        let T = this._defaultBabylonMaterialData[y];
        T || (T = this._createDefaultMaterial("__GLTFLoader._default", y), this._parent.onMaterialLoadedObservable.notifyObservers(T), this._defaultBabylonMaterialData[y] = T), d.material = T;
      } else if (!this.parent.skipMaterials) {
        const T = A.Get(`${e}/material`, this._gltf.materials, i.material);
        c.push(this._loadMaterialAsync(`/materials/${T.index}`, T, d, y, (m) => {
          d.material = m;
        }));
      }
      u = Promise.all(c), l && (i._instanceData = {
        babylonSourceMesh: d,
        promise: u
      }), h = d;
    }
    return _.AddPointerMetadata(h, e), this._parent.onMeshLoadedObservable.notifyObservers(h), r(h), this.logClose(), u.then(() => h);
  }
  _loadVertexDataAsync(e, t, s) {
    const n = this._extensionsLoadVertexDataAsync(e, t, s);
    if (n)
      return n;
    const i = t.attributes;
    if (!i)
      throw new Error(`${e}: Attributes are missing`);
    const r = new Array(), o = new Ri(s.name, this._babylonScene);
    if (t.indices == null)
      s.isUnIndexed = !0;
    else {
      const h = A.Get(`${e}/indices`, this._gltf.accessors, t.indices);
      r.push(this._loadIndicesAccessorAsync(`/accessors/${h.index}`, h).then((u) => {
        o.setIndices(u);
      }));
    }
    const l = (h, u, c) => {
      if (i[h] == null)
        return;
      s._delayInfo = s._delayInfo || [], s._delayInfo.indexOf(u) === -1 && s._delayInfo.push(u);
      const d = A.Get(`${e}/attributes/${h}`, this._gltf.accessors, i[h]);
      r.push(this._loadVertexAccessorAsync(`/accessors/${d.index}`, d, u).then((y) => {
        if (y.getKind() === M.PositionKind && !this.parent.alwaysComputeBoundingBox && !s.skeleton && d.min && d.max) {
          const T = J.Vector3[0].copyFromFloats(...d.min), m = J.Vector3[1].copyFromFloats(...d.max);
          if (d.normalized && d.componentType !== 5126) {
            let p = 1;
            switch (d.componentType) {
              case 5120:
                p = 127;
                break;
              case 5121:
                p = 255;
                break;
              case 5122:
                p = 32767;
                break;
              case 5123:
                p = 65535;
                break;
            }
            const C = 1 / p;
            T.scaleInPlace(C), m.scaleInPlace(C);
          }
          o._boundingInfo = new Bi(T, m), o.useBoundingInfoFromGeometry = !0;
        }
        o.setVerticesBuffer(y, d.count);
      })), u == M.MatricesIndicesExtraKind && (s.numBoneInfluencers = 8), c && c(d);
    };
    return l("POSITION", M.PositionKind), l("NORMAL", M.NormalKind), l("TANGENT", M.TangentKind), l("TEXCOORD_0", M.UVKind), l("TEXCOORD_1", M.UV2Kind), l("TEXCOORD_2", M.UV3Kind), l("TEXCOORD_3", M.UV4Kind), l("TEXCOORD_4", M.UV5Kind), l("TEXCOORD_5", M.UV6Kind), l("JOINTS_0", M.MatricesIndicesKind), l("WEIGHTS_0", M.MatricesWeightsKind), l("JOINTS_1", M.MatricesIndicesExtraKind), l("WEIGHTS_1", M.MatricesWeightsExtraKind), l("COLOR_0", M.ColorKind, (h) => {
      h.type === "VEC4" && (s.hasVertexAlpha = !0);
    }), Promise.all(r).then(() => o);
  }
  _createMorphTargets(e, t, s, n, i) {
    if (!n.targets)
      return;
    if (t._numMorphTargets == null)
      t._numMorphTargets = n.targets.length;
    else if (n.targets.length !== t._numMorphTargets)
      throw new Error(`${e}: Primitives do not have the same number of targets`);
    const r = s.extras ? s.extras.targetNames : null;
    this._babylonScene._blockEntityCollection = !!this._assetContainer, i.morphTargetManager = new _e(this._babylonScene), i.morphTargetManager._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, i.morphTargetManager.areUpdatesFrozen = !0;
    for (let o = 0; o < n.targets.length; o++) {
      const l = t.weights ? t.weights[o] : s.weights ? s.weights[o] : 0, h = r ? r[o] : `morphTarget${o}`;
      i.morphTargetManager.addTarget(new Fn(h, l, i.getScene()));
    }
  }
  _loadMorphTargetsAsync(e, t, s, n) {
    if (!t.targets)
      return Promise.resolve();
    const i = new Array(), r = s.morphTargetManager;
    for (let o = 0; o < r.numTargets; o++) {
      const l = r.getTarget(o);
      i.push(this._loadMorphTargetVertexDataAsync(`${e}/targets/${o}`, n, t.targets[o], l));
    }
    return Promise.all(i).then(() => {
      r.areUpdatesFrozen = !1;
    });
  }
  _loadMorphTargetVertexDataAsync(e, t, s, n) {
    const i = new Array(), r = (o, l, h) => {
      if (s[o] == null)
        return;
      const u = t.getVertexBuffer(l);
      if (!u)
        return;
      const c = A.Get(`${e}/${o}`, this._gltf.accessors, s[o]);
      i.push(this._loadFloatAccessorAsync(`/accessors/${c.index}`, c).then((d) => {
        h(u, d);
      }));
    };
    return r("POSITION", M.PositionKind, (o, l) => {
      const h = new Float32Array(l.length);
      o.forEach(l.length, (u, c) => {
        h[c] = l[c] + u;
      }), n.setPositions(h);
    }), r("NORMAL", M.NormalKind, (o, l) => {
      const h = new Float32Array(l.length);
      o.forEach(h.length, (u, c) => {
        h[c] = l[c] + u;
      }), n.setNormals(h);
    }), r("TANGENT", M.TangentKind, (o, l) => {
      const h = new Float32Array(l.length / 3 * 4);
      let u = 0;
      o.forEach(l.length / 3 * 4, (c, d) => {
        (d + 1) % 4 !== 0 && (h[u] = l[u] + c, u++);
      }), n.setTangents(h);
    }), Promise.all(i).then(() => {
    });
  }
  static _LoadTransform(e, t) {
    if (e.skin != null)
      return;
    let s = N.Zero(), n = ie.Identity(), i = N.One();
    e.matrix ? S.FromArray(e.matrix).decompose(i, n, s) : (e.translation && (s = N.FromArray(e.translation)), e.rotation && (n = ie.FromArray(e.rotation)), e.scale && (i = N.FromArray(e.scale))), t.position = s, t.rotationQuaternion = n, t.scaling = i;
  }
  _loadSkinAsync(e, t, s, n) {
    const i = this._extensionsLoadSkinAsync(e, t, s);
    if (i)
      return i;
    if (s._data)
      return n(s._data.babylonSkeleton), s._data.promise;
    const r = `skeleton${s.index}`;
    this._babylonScene._blockEntityCollection = !!this._assetContainer;
    const o = new Cs(s.name || r, r, this._babylonScene);
    o._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, this._loadBones(e, s, o);
    const l = this._loadSkinInverseBindMatricesDataAsync(e, s).then((h) => {
      this._updateBoneMatrices(o, h);
    });
    return s._data = {
      babylonSkeleton: o,
      promise: l
    }, n(o), l;
  }
  _loadBones(e, t, s) {
    if (t.skeleton == null || this._parent.alwaysComputeSkeletonRootNode) {
      const i = this._findSkeletonRootNode(`${e}/joints`, t.joints);
      if (i)
        if (t.skeleton === void 0)
          t.skeleton = i.index;
        else {
          const r = (l, h) => {
            for (; h.parent; h = h.parent)
              if (h.parent === l)
                return !0;
            return !1;
          }, o = A.Get(`${e}/skeleton`, this._gltf.nodes, t.skeleton);
          o !== i && !r(o, i) && (v.Warn(`${e}/skeleton: Overriding with nearest common ancestor as skeleton node is not a common root`), t.skeleton = i.index);
        }
      else
        v.Warn(`${e}: Failed to find common root`);
    }
    const n = {};
    for (const i of t.joints) {
      const r = A.Get(`${e}/joints/${i}`, this._gltf.nodes, i);
      this._loadBone(r, t, s, n);
    }
  }
  _findSkeletonRootNode(e, t) {
    if (t.length === 0)
      return null;
    const s = {};
    for (const i of t) {
      const r = [];
      let o = A.Get(`${e}/${i}`, this._gltf.nodes, i);
      for (; o.index !== -1; )
        r.unshift(o), o = o.parent;
      s[i] = r;
    }
    let n = null;
    for (let i = 0; ; ++i) {
      let r = s[t[0]];
      if (i >= r.length)
        return n;
      const o = r[i];
      for (let l = 1; l < t.length; ++l)
        if (r = s[t[l]], i >= r.length || o !== r[i])
          return n;
      n = o;
    }
  }
  _loadBone(e, t, s, n) {
    let i = n[e.index];
    if (i)
      return i;
    let r = null;
    e.index !== t.skeleton && (e.parent && e.parent.index !== -1 ? r = this._loadBone(e.parent, t, s, n) : t.skeleton !== void 0 && v.Warn(`/skins/${t.index}/skeleton: Skeleton node is not a common root`));
    const o = t.joints.indexOf(e.index);
    return i = new Rs(e.name || `joint${e.index}`, s, r, this._getNodeMatrix(e), null, null, o), n[e.index] = i, this._postSceneLoadActions.push(() => {
      i.linkTransformNode(e._babylonTransformNode);
    }), i;
  }
  _loadSkinInverseBindMatricesDataAsync(e, t) {
    if (t.inverseBindMatrices == null)
      return Promise.resolve(null);
    const s = A.Get(`${e}/inverseBindMatrices`, this._gltf.accessors, t.inverseBindMatrices);
    return this._loadFloatAccessorAsync(`/accessors/${s.index}`, s);
  }
  _updateBoneMatrices(e, t) {
    for (const s of e.bones) {
      const n = S.Identity(), i = s._index;
      t && i !== -1 && (S.FromArrayToRef(t, i * 16, n), n.invertToRef(n));
      const r = s.getParent();
      r && n.multiplyToRef(r.getAbsoluteInverseBindMatrix(), n), s.updateMatrix(n, !1, !1), s._updateAbsoluteBindMatrices(void 0, !1);
    }
  }
  _getNodeMatrix(e) {
    return e.matrix ? S.FromArray(e.matrix) : S.Compose(e.scale ? N.FromArray(e.scale) : N.One(), e.rotation ? ie.FromArray(e.rotation) : ie.Identity(), e.translation ? N.FromArray(e.translation) : N.Zero());
  }
  /**
   * Loads a glTF camera.
   * @param context The context when loading the asset
   * @param camera The glTF camera property
   * @param assign A function called synchronously after parsing the glTF properties
   * @returns A promise that resolves with the loaded Babylon camera when the load is complete
   */
  loadCameraAsync(e, t, s = () => {
  }) {
    const n = this._extensionsLoadCameraAsync(e, t, s);
    if (n)
      return n;
    const i = new Array();
    this.logOpen(`${e} ${t.name || ""}`), this._babylonScene._blockEntityCollection = !!this._assetContainer;
    const r = new Gi(t.name || `camera${t.index}`, N.Zero(), this._babylonScene, !1);
    switch (r._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, r.ignoreParentScaling = !0, t._babylonCamera = r, r.rotation.set(0, Math.PI, 0), t.type) {
      case "perspective": {
        const o = t.perspective;
        if (!o)
          throw new Error(`${e}: Camera perspective properties are missing`);
        r.fov = o.yfov, r.minZ = o.znear, r.maxZ = o.zfar || 0;
        break;
      }
      case "orthographic": {
        if (!t.orthographic)
          throw new Error(`${e}: Camera orthographic properties are missing`);
        r.mode = Ss.ORTHOGRAPHIC_CAMERA, r.orthoLeft = -t.orthographic.xmag, r.orthoRight = t.orthographic.xmag, r.orthoBottom = -t.orthographic.ymag, r.orthoTop = t.orthographic.ymag, r.minZ = t.orthographic.znear, r.maxZ = t.orthographic.zfar;
        break;
      }
      default:
        throw new Error(`${e}: Invalid camera type (${t.type})`);
    }
    return _.AddPointerMetadata(r, e), this._parent.onCameraLoadedObservable.notifyObservers(r), s(r), this.logClose(), Promise.all(i).then(() => r);
  }
  _loadAnimationsAsync() {
    const e = this._gltf.animations;
    if (!e)
      return Promise.resolve();
    const t = new Array();
    for (let s = 0; s < e.length; s++) {
      const n = e[s];
      t.push(this.loadAnimationAsync(`/animations/${n.index}`, n).then((i) => {
        i.targetedAnimations.length === 0 && i.dispose();
      }));
    }
    return Promise.all(t).then(() => {
    });
  }
  /**
   * Loads a glTF animation.
   * @param context The context when loading the asset
   * @param animation The glTF animation property
   * @returns A promise that resolves with the loaded Babylon animation group when the load is complete
   */
  loadAnimationAsync(e, t) {
    const s = this._extensionsLoadAnimationAsync(e, t);
    if (s)
      return s;
    this._babylonScene._blockEntityCollection = !!this._assetContainer;
    const n = new he(t.name || `animation${t.index}`, this._babylonScene);
    n._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, t._babylonAnimationGroup = n;
    const i = new Array();
    A.Assign(t.channels), A.Assign(t.samplers);
    for (const r of t.channels)
      i.push(this._loadAnimationChannelAsync(`${e}/channels/${r.index}`, e, t, r, (o, l) => {
        o.animations = o.animations || [], o.animations.push(l), n.addTargetedAnimation(l, o);
      }));
    return Promise.all(i).then(() => (n.normalize(0), n));
  }
  /**
   * @hidden
   * Loads a glTF animation channel.
   * @param context The context when loading the asset
   * @param animationContext The context of the animation when loading the asset
   * @param animation The glTF animation property
   * @param channel The glTF animation channel property
   * @param onLoad Called for each animation loaded
   * @returns A void promise that resolves when the load is complete
   */
  _loadAnimationChannelAsync(e, t, s, n, i) {
    const r = this._extensionsLoadAnimationChannelAsync(e, t, s, n, i);
    if (r)
      return r;
    if (n.target.node == null)
      return Promise.resolve();
    const o = A.Get(`${e}/target/node`, this._gltf.nodes, n.target.node);
    if (n.target.path === "weights" && !o._numMorphTargets || n.target.path !== "weights" && !o._babylonTransformNode)
      return Promise.resolve();
    let l;
    switch (n.target.path) {
      case "translation": {
        l = ns.translation;
        break;
      }
      case "rotation": {
        l = ns.rotation;
        break;
      }
      case "scale": {
        l = ns.scale;
        break;
      }
      case "weights": {
        l = ns.weights;
        break;
      }
      default:
        throw new Error(`${e}/target/path: Invalid value (${n.target.path})`);
    }
    const h = {
      object: o,
      info: l
    };
    return this._loadAnimationChannelFromTargetInfoAsync(e, t, s, n, h, i);
  }
  /**
   * @hidden
   * Loads a glTF animation channel.
   * @param context The context when loading the asset
   * @param animationContext The context of the animation when loading the asset
   * @param animation The glTF animation property
   * @param channel The glTF animation channel property
   * @param targetInfo The glTF target and properties
   * @param onLoad Called for each animation loaded
   * @returns A void promise that resolves when the load is complete
   */
  _loadAnimationChannelFromTargetInfoAsync(e, t, s, n, i, r) {
    const o = this.parent.targetFps, l = 1 / o, h = A.Get(`${e}/sampler`, s.samplers, n.sampler);
    return this._loadAnimationSamplerAsync(`${t}/samplers/${n.sampler}`, h).then((u) => {
      let c = 0;
      const d = i.object, y = i.info;
      for (const T of y) {
        const m = T.getStride(d), p = u.input, C = u.output, w = new Array(p.length);
        let O = 0;
        switch (u.interpolation) {
          case "STEP": {
            for (let I = 0; I < p.length; I++) {
              const V = T.getValue(d, C, O, 1);
              O += m, w[I] = {
                frame: p[I] * o,
                value: V,
                interpolation: Ui.STEP
              };
            }
            break;
          }
          case "CUBICSPLINE": {
            for (let I = 0; I < p.length; I++) {
              const V = T.getValue(d, C, O, l);
              O += m;
              const fe = T.getValue(d, C, O, 1);
              O += m;
              const Os = T.getValue(d, C, O, l);
              O += m, w[I] = {
                frame: p[I] * o,
                inTangent: V,
                value: fe,
                outTangent: Os
              };
            }
            break;
          }
          case "LINEAR": {
            for (let I = 0; I < p.length; I++) {
              const V = T.getValue(d, C, O, 1);
              O += m, w[I] = {
                frame: p[I] * o,
                value: V
              };
            }
            break;
          }
        }
        if (O > 0) {
          const I = `${s.name || `animation${s.index}`}_channel${n.index}_${c}`;
          T.buildAnimations(d, I, o, w, (V, fe) => {
            ++c, r(V, fe);
          });
        }
      }
    });
  }
  _loadAnimationSamplerAsync(e, t) {
    if (t._data)
      return t._data;
    const s = t.interpolation || "LINEAR";
    switch (s) {
      case "STEP":
      case "LINEAR":
      case "CUBICSPLINE":
        break;
      default:
        throw new Error(`${e}/interpolation: Invalid value (${t.interpolation})`);
    }
    const n = A.Get(`${e}/input`, this._gltf.accessors, t.input), i = A.Get(`${e}/output`, this._gltf.accessors, t.output);
    return t._data = Promise.all([
      this._loadFloatAccessorAsync(`/accessors/${n.index}`, n),
      this._loadFloatAccessorAsync(`/accessors/${i.index}`, i)
    ]).then(([r, o]) => ({
      input: r,
      interpolation: s,
      output: o
    })), t._data;
  }
  /**
   * Loads a glTF buffer.
   * @param context The context when loading the asset
   * @param buffer The glTF buffer property
   * @param byteOffset The byte offset to use
   * @param byteLength The byte length to use
   * @returns A promise that resolves with the loaded data when the load is complete
   */
  loadBufferAsync(e, t, s, n) {
    const i = this._extensionsLoadBufferAsync(e, t, s, n);
    if (i)
      return i;
    if (!t._data)
      if (t.uri)
        t._data = this.loadUriAsync(`${e}/uri`, t, t.uri);
      else {
        if (!this._bin)
          throw new Error(`${e}: Uri is missing or the binary glTF is missing its binary chunk`);
        t._data = this._bin.readAsync(0, t.byteLength);
      }
    return t._data.then((r) => {
      try {
        return new Uint8Array(r.buffer, r.byteOffset + s, n);
      } catch (o) {
        throw new Error(`${e}: ${o.message}`);
      }
    });
  }
  /**
   * Loads a glTF buffer view.
   * @param context The context when loading the asset
   * @param bufferView The glTF buffer view property
   * @returns A promise that resolves with the loaded data when the load is complete
   */
  loadBufferViewAsync(e, t) {
    const s = this._extensionsLoadBufferViewAsync(e, t);
    if (s)
      return s;
    if (t._data)
      return t._data;
    const n = A.Get(`${e}/buffer`, this._gltf.buffers, t.buffer);
    return t._data = this.loadBufferAsync(`/buffers/${n.index}`, n, t.byteOffset || 0, t.byteLength), t._data;
  }
  _loadAccessorAsync(e, t, s) {
    if (t._data)
      return t._data;
    const n = _._GetNumComponents(e, t.type), i = n * M.GetTypeByteLength(t.componentType), r = n * t.count;
    if (t.bufferView == null)
      t._data = Promise.resolve(new s(r));
    else {
      const o = A.Get(`${e}/bufferView`, this._gltf.bufferViews, t.bufferView);
      t._data = this.loadBufferViewAsync(`/bufferViews/${o.index}`, o).then((l) => {
        if (t.componentType === 5126 && !t.normalized && (!o.byteStride || o.byteStride === i))
          return _._GetTypedArray(e, t.componentType, l, t.byteOffset, r);
        {
          const h = new s(r);
          return M.ForEach(l, t.byteOffset || 0, o.byteStride || i, n, t.componentType, h.length, t.normalized || !1, (u, c) => {
            h[c] = u;
          }), h;
        }
      });
    }
    if (t.sparse) {
      const o = t.sparse;
      t._data = t._data.then((l) => {
        const h = l, u = A.Get(`${e}/sparse/indices/bufferView`, this._gltf.bufferViews, o.indices.bufferView), c = A.Get(`${e}/sparse/values/bufferView`, this._gltf.bufferViews, o.values.bufferView);
        return Promise.all([
          this.loadBufferViewAsync(`/bufferViews/${u.index}`, u),
          this.loadBufferViewAsync(`/bufferViews/${c.index}`, c)
        ]).then(([d, y]) => {
          const T = _._GetTypedArray(`${e}/sparse/indices`, o.indices.componentType, d, o.indices.byteOffset, o.count), m = n * o.count;
          let p;
          if (t.componentType === 5126 && !t.normalized)
            p = _._GetTypedArray(`${e}/sparse/values`, t.componentType, y, o.values.byteOffset, m);
          else {
            const w = _._GetTypedArray(`${e}/sparse/values`, t.componentType, y, o.values.byteOffset, m);
            p = new s(m), M.ForEach(w, 0, i, n, t.componentType, p.length, t.normalized || !1, (O, I) => {
              p[I] = O;
            });
          }
          let C = 0;
          for (let w = 0; w < T.length; w++) {
            let O = T[w] * n;
            for (let I = 0; I < n; I++)
              h[O++] = p[C++];
          }
          return h;
        });
      });
    }
    return t._data;
  }
  /**
   * @internal
   */
  _loadFloatAccessorAsync(e, t) {
    return this._loadAccessorAsync(e, t, Float32Array);
  }
  /**
   * @internal
   */
  _loadIndicesAccessorAsync(e, t) {
    if (t.type !== "SCALAR")
      throw new Error(`${e}/type: Invalid value ${t.type}`);
    if (t.componentType !== 5121 && t.componentType !== 5123 && t.componentType !== 5125)
      throw new Error(`${e}/componentType: Invalid value ${t.componentType}`);
    if (t._data)
      return t._data;
    if (t.sparse) {
      const s = _._GetTypedArrayConstructor(`${e}/componentType`, t.componentType);
      t._data = this._loadAccessorAsync(e, t, s);
    } else {
      const s = A.Get(`${e}/bufferView`, this._gltf.bufferViews, t.bufferView);
      t._data = this.loadBufferViewAsync(`/bufferViews/${s.index}`, s).then((n) => _._GetTypedArray(e, t.componentType, n, t.byteOffset, t.count));
    }
    return t._data;
  }
  /**
   * @internal
   */
  _loadVertexBufferViewAsync(e) {
    if (e._babylonBuffer)
      return e._babylonBuffer;
    const t = this._babylonScene.getEngine();
    return e._babylonBuffer = this.loadBufferViewAsync(`/bufferViews/${e.index}`, e).then((s) => new Li(t, s, !1)), e._babylonBuffer;
  }
  /**
   * @internal
   */
  _loadVertexAccessorAsync(e, t, s) {
    if (t._babylonVertexBuffer?.[s])
      return t._babylonVertexBuffer[s];
    t._babylonVertexBuffer || (t._babylonVertexBuffer = {});
    const n = this._babylonScene.getEngine();
    if (t.sparse || t.bufferView == null)
      t._babylonVertexBuffer[s] = this._loadFloatAccessorAsync(e, t).then((i) => new M(n, i, s, !1));
    else {
      const i = A.Get(`${e}/bufferView`, this._gltf.bufferViews, t.bufferView);
      t._babylonVertexBuffer[s] = this._loadVertexBufferViewAsync(i).then((r) => {
        const o = _._GetNumComponents(e, t.type);
        return new M(n, r, s, !1, void 0, i.byteStride, void 0, t.byteOffset, o, t.componentType, t.normalized, !0, void 0, !0);
      });
    }
    return t._babylonVertexBuffer[s];
  }
  _loadMaterialMetallicRoughnessPropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const n = new Array();
    return t && (t.baseColorFactor ? (s.albedoColor = j.FromArray(t.baseColorFactor), s.alpha = t.baseColorFactor[3]) : s.albedoColor = j.White(), s.metallic = t.metallicFactor == null ? 1 : t.metallicFactor, s.roughness = t.roughnessFactor == null ? 1 : t.roughnessFactor, t.baseColorTexture && n.push(this.loadTextureInfoAsync(`${e}/baseColorTexture`, t.baseColorTexture, (i) => {
      i.name = `${s.name} (Base Color)`, s.albedoTexture = i;
    })), t.metallicRoughnessTexture && (t.metallicRoughnessTexture.nonColorData = !0, n.push(this.loadTextureInfoAsync(`${e}/metallicRoughnessTexture`, t.metallicRoughnessTexture, (i) => {
      i.name = `${s.name} (Metallic Roughness)`, s.metallicTexture = i;
    })), s.useMetallnessFromMetallicTextureBlue = !0, s.useRoughnessFromMetallicTextureGreen = !0, s.useRoughnessFromMetallicTextureAlpha = !1)), Promise.all(n).then(() => {
    });
  }
  /**
   * @internal
   */
  _loadMaterialAsync(e, t, s, n, i = () => {
  }) {
    const r = this._extensionsLoadMaterialAsync(e, t, s, n, i);
    if (r)
      return r;
    t._data = t._data || {};
    let o = t._data[n];
    if (!o) {
      this.logOpen(`${e} ${t.name || ""}`);
      const l = this.createMaterial(e, t, n);
      o = {
        babylonMaterial: l,
        babylonMeshes: [],
        promise: this.loadMaterialPropertiesAsync(e, t, l)
      }, t._data[n] = o, _.AddPointerMetadata(l, e), this._parent.onMaterialLoadedObservable.notifyObservers(l), this.logClose();
    }
    return s && (o.babylonMeshes.push(s), s.onDisposeObservable.addOnce(() => {
      const l = o.babylonMeshes.indexOf(s);
      l !== -1 && o.babylonMeshes.splice(l, 1);
    })), i(o.babylonMaterial), o.promise.then(() => o.babylonMaterial);
  }
  _createDefaultMaterial(e, t) {
    this._babylonScene._blockEntityCollection = !!this._assetContainer;
    const s = new F(e, this._babylonScene);
    return s._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, s.fillMode = t, s.enableSpecularAntiAliasing = !0, s.useRadianceOverAlpha = !this._parent.transparencyAsCoverage, s.useSpecularOverAlpha = !this._parent.transparencyAsCoverage, s.transparencyMode = F.PBRMATERIAL_OPAQUE, s.metallic = 1, s.roughness = 1, s;
  }
  /**
   * Creates a Babylon material from a glTF material.
   * @param context The context when loading the asset
   * @param material The glTF material property
   * @param babylonDrawMode The draw mode for the Babylon material
   * @returns The Babylon material
   */
  createMaterial(e, t, s) {
    const n = this._extensionsCreateMaterial(e, t, s);
    if (n)
      return n;
    const i = t.name || `material${t.index}`;
    return this._createDefaultMaterial(i, s);
  }
  /**
   * Loads properties from a glTF material into a Babylon material.
   * @param context The context when loading the asset
   * @param material The glTF material property
   * @param babylonMaterial The Babylon material
   * @returns A promise that resolves when the load is complete
   */
  loadMaterialPropertiesAsync(e, t, s) {
    const n = this._extensionsLoadMaterialPropertiesAsync(e, t, s);
    if (n)
      return n;
    const i = new Array();
    return i.push(this.loadMaterialBasePropertiesAsync(e, t, s)), t.pbrMetallicRoughness && i.push(this._loadMaterialMetallicRoughnessPropertiesAsync(`${e}/pbrMetallicRoughness`, t.pbrMetallicRoughness, s)), this.loadMaterialAlphaProperties(e, t, s), Promise.all(i).then(() => {
    });
  }
  /**
   * Loads the normal, occlusion, and emissive properties from a glTF material into a Babylon material.
   * @param context The context when loading the asset
   * @param material The glTF material property
   * @param babylonMaterial The Babylon material
   * @returns A promise that resolves when the load is complete
   */
  loadMaterialBasePropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const n = new Array();
    return s.emissiveColor = t.emissiveFactor ? j.FromArray(t.emissiveFactor) : new j(0, 0, 0), t.doubleSided && (s.backFaceCulling = !1, s.twoSidedLighting = !0), t.normalTexture && (t.normalTexture.nonColorData = !0, n.push(this.loadTextureInfoAsync(`${e}/normalTexture`, t.normalTexture, (i) => {
      i.name = `${s.name} (Normal)`, s.bumpTexture = i;
    })), s.invertNormalMapX = !this._babylonScene.useRightHandedSystem, s.invertNormalMapY = this._babylonScene.useRightHandedSystem, t.normalTexture.scale != null && s.bumpTexture && (s.bumpTexture.level = t.normalTexture.scale), s.forceIrradianceInFragment = !0), t.occlusionTexture && (t.occlusionTexture.nonColorData = !0, n.push(this.loadTextureInfoAsync(`${e}/occlusionTexture`, t.occlusionTexture, (i) => {
      i.name = `${s.name} (Occlusion)`, s.ambientTexture = i;
    })), s.useAmbientInGrayScale = !0, t.occlusionTexture.strength != null && (s.ambientTextureStrength = t.occlusionTexture.strength)), t.emissiveTexture && n.push(this.loadTextureInfoAsync(`${e}/emissiveTexture`, t.emissiveTexture, (i) => {
      i.name = `${s.name} (Emissive)`, s.emissiveTexture = i;
    })), Promise.all(n).then(() => {
    });
  }
  /**
   * Loads the alpha properties from a glTF material into a Babylon material.
   * Must be called after the setting the albedo texture of the Babylon material when the material has an albedo texture.
   * @param context The context when loading the asset
   * @param material The glTF material property
   * @param babylonMaterial The Babylon material
   */
  loadMaterialAlphaProperties(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    switch (t.alphaMode || "OPAQUE") {
      case "OPAQUE": {
        s.transparencyMode = F.PBRMATERIAL_OPAQUE, s.alpha = 1;
        break;
      }
      case "MASK": {
        s.transparencyMode = F.PBRMATERIAL_ALPHATEST, s.alphaCutOff = t.alphaCutoff == null ? 0.5 : t.alphaCutoff, s.albedoTexture && (s.albedoTexture.hasAlpha = !0);
        break;
      }
      case "BLEND": {
        s.transparencyMode = F.PBRMATERIAL_ALPHABLEND, s.albedoTexture && (s.albedoTexture.hasAlpha = !0, s.useAlphaFromAlbedoTexture = !0);
        break;
      }
      default:
        throw new Error(`${e}/alphaMode: Invalid value (${t.alphaMode})`);
    }
  }
  /**
   * Loads a glTF texture info.
   * @param context The context when loading the asset
   * @param textureInfo The glTF texture info property
   * @param assign A function called synchronously after parsing the glTF properties
   * @returns A promise that resolves with the loaded Babylon texture when the load is complete
   */
  loadTextureInfoAsync(e, t, s = () => {
  }) {
    const n = this._extensionsLoadTextureInfoAsync(e, t, s);
    if (n)
      return n;
    if (this.logOpen(`${e}`), t.texCoord >= 6)
      throw new Error(`${e}/texCoord: Invalid value (${t.texCoord})`);
    const i = A.Get(`${e}/index`, this._gltf.textures, t.index);
    i._textureInfo = t;
    const r = this._loadTextureAsync(`/textures/${t.index}`, i, (o) => {
      o.coordinatesIndex = t.texCoord || 0, _.AddPointerMetadata(o, e), this._parent.onTextureLoadedObservable.notifyObservers(o), s(o);
    });
    return this.logClose(), r;
  }
  /**
   * @internal
   */
  _loadTextureAsync(e, t, s = () => {
  }) {
    const n = this._extensionsLoadTextureAsync(e, t, s);
    if (n)
      return n;
    this.logOpen(`${e} ${t.name || ""}`);
    const i = t.sampler == null ? _.DefaultSampler : A.Get(`${e}/sampler`, this._gltf.samplers, t.sampler), r = A.Get(`${e}/source`, this._gltf.images, t.source), o = this._createTextureAsync(e, i, r, s, void 0, !t._textureInfo.nonColorData);
    return this.logClose(), o;
  }
  /**
   * @internal
   */
  _createTextureAsync(e, t, s, n = () => {
  }, i, r) {
    const o = this._loadSampler(`/samplers/${t.index}`, t), l = new Array(), h = new ss();
    this._babylonScene._blockEntityCollection = !!this._assetContainer;
    const u = {
      noMipmap: o.noMipMaps,
      invertY: !1,
      samplingMode: o.samplingMode,
      onLoad: () => {
        this._disposed || h.resolve();
      },
      onError: (d, y) => {
        this._disposed || h.reject(new Error(`${e}: ${y && y.message ? y.message : d || "Failed to load texture"}`));
      },
      mimeType: s.mimeType,
      loaderOptions: i,
      useSRGBBuffer: !!r && this._parent.useSRGBBuffers
    }, c = new G(null, this._babylonScene, u);
    return c._parentContainer = this._assetContainer, this._babylonScene._blockEntityCollection = !1, l.push(h.promise), l.push(this.loadImageAsync(`/images/${s.index}`, s).then((d) => {
      const y = s.uri || `${this._fileName}#image${s.index}`, T = `data:${this._uniqueRootUrl}${y}`;
      c.updateURL(T, d);
    })), c.wrapU = o.wrapU, c.wrapV = o.wrapV, n(c), Promise.all(l).then(() => c);
  }
  _loadSampler(e, t) {
    return t._data || (t._data = {
      noMipMaps: t.minFilter === 9728 || t.minFilter === 9729,
      samplingMode: _._GetTextureSamplingMode(e, t),
      wrapU: _._GetTextureWrapMode(`${e}/wrapS`, t.wrapS),
      wrapV: _._GetTextureWrapMode(`${e}/wrapT`, t.wrapT)
    }), t._data;
  }
  /**
   * Loads a glTF image.
   * @param context The context when loading the asset
   * @param image The glTF image property
   * @returns A promise that resolves with the loaded data when the load is complete
   */
  loadImageAsync(e, t) {
    if (!t._data) {
      if (this.logOpen(`${e} ${t.name || ""}`), t.uri)
        t._data = this.loadUriAsync(`${e}/uri`, t, t.uri);
      else {
        const s = A.Get(`${e}/bufferView`, this._gltf.bufferViews, t.bufferView);
        t._data = this.loadBufferViewAsync(`/bufferViews/${s.index}`, s);
      }
      this.logClose();
    }
    return t._data;
  }
  /**
   * Loads a glTF uri.
   * @param context The context when loading the asset
   * @param property The glTF property associated with the uri
   * @param uri The base64 or relative uri
   * @returns A promise that resolves with the loaded data when the load is complete
   */
  loadUriAsync(e, t, s) {
    const n = this._extensionsLoadUriAsync(e, t, s);
    if (n)
      return n;
    if (!_._ValidateUri(s))
      throw new Error(`${e}: '${s}' is invalid`);
    if (Di(s)) {
      const i = new Uint8Array(Bn(s));
      return this.log(`${e}: Decoded ${s.substr(0, 64)}... (${i.length} bytes)`), Promise.resolve(i);
    }
    return this.log(`${e}: Loading ${s}`), this._parent.preprocessUrlAsync(this._rootUrl + s).then((i) => new Promise((r, o) => {
      this._parent._loadFile(this._babylonScene, i, (l) => {
        this._disposed || (this.log(`${e}: Loaded ${s} (${l.byteLength} bytes)`), r(new Uint8Array(l)));
      }, !0, (l) => {
        o(new ki(`${e}: Failed to load '${s}'${l ? ": " + l.status + " " + l.statusText : ""}`, l));
      });
    }));
  }
  /**
   * Adds a JSON pointer to the _internalMetadata of the Babylon object at `<object>._internalMetadata.gltf.pointers`.
   * @param babylonObject the Babylon object with _internalMetadata
   * @param pointer the JSON pointer
   */
  static AddPointerMetadata(e, t) {
    e.metadata = e.metadata || {};
    const s = e._internalMetadata = e._internalMetadata || {}, n = s.gltf = s.gltf || {};
    (n.pointers = n.pointers || []).push(t);
  }
  static _GetTextureWrapMode(e, t) {
    switch (t = t ?? 10497, t) {
      case 33071:
        return G.CLAMP_ADDRESSMODE;
      case 33648:
        return G.MIRROR_ADDRESSMODE;
      case 10497:
        return G.WRAP_ADDRESSMODE;
      default:
        return v.Warn(`${e}: Invalid value (${t})`), G.WRAP_ADDRESSMODE;
    }
  }
  static _GetTextureSamplingMode(e, t) {
    const s = t.magFilter == null ? 9729 : t.magFilter, n = t.minFilter == null ? 9987 : t.minFilter;
    if (s === 9729)
      switch (n) {
        case 9728:
          return G.LINEAR_NEAREST;
        case 9729:
          return G.LINEAR_LINEAR;
        case 9984:
          return G.LINEAR_NEAREST_MIPNEAREST;
        case 9985:
          return G.LINEAR_LINEAR_MIPNEAREST;
        case 9986:
          return G.LINEAR_NEAREST_MIPLINEAR;
        case 9987:
          return G.LINEAR_LINEAR_MIPLINEAR;
        default:
          return v.Warn(`${e}/minFilter: Invalid value (${n})`), G.LINEAR_LINEAR_MIPLINEAR;
      }
    else
      switch (s !== 9728 && v.Warn(`${e}/magFilter: Invalid value (${s})`), n) {
        case 9728:
          return G.NEAREST_NEAREST;
        case 9729:
          return G.NEAREST_LINEAR;
        case 9984:
          return G.NEAREST_NEAREST_MIPNEAREST;
        case 9985:
          return G.NEAREST_LINEAR_MIPNEAREST;
        case 9986:
          return G.NEAREST_NEAREST_MIPLINEAR;
        case 9987:
          return G.NEAREST_LINEAR_MIPLINEAR;
        default:
          return v.Warn(`${e}/minFilter: Invalid value (${n})`), G.NEAREST_NEAREST_MIPNEAREST;
      }
  }
  static _GetTypedArrayConstructor(e, t) {
    switch (t) {
      case 5120:
        return Int8Array;
      case 5121:
        return Uint8Array;
      case 5122:
        return Int16Array;
      case 5123:
        return Uint16Array;
      case 5125:
        return Uint32Array;
      case 5126:
        return Float32Array;
      default:
        throw new Error(`${e}: Invalid component type ${t}`);
    }
  }
  static _GetTypedArray(e, t, s, n, i) {
    const r = s.buffer;
    n = s.byteOffset + (n || 0);
    const o = _._GetTypedArrayConstructor(`${e}/componentType`, t), l = M.GetTypeByteLength(t);
    return n % l !== 0 ? (v.Warn(`${e}: Copying buffer as byte offset (${n}) is not a multiple of component type byte length (${l})`), new o(r.slice(n, n + i * l), 0)) : new o(r, n, i);
  }
  static _GetNumComponents(e, t) {
    switch (t) {
      case "SCALAR":
        return 1;
      case "VEC2":
        return 2;
      case "VEC3":
        return 3;
      case "VEC4":
        return 4;
      case "MAT2":
        return 4;
      case "MAT3":
        return 9;
      case "MAT4":
        return 16;
    }
    throw new Error(`${e}: Invalid type (${t})`);
  }
  static _ValidateUri(e) {
    return $.IsBase64(e) || e.indexOf("..") === -1;
  }
  /**
   * @internal
   */
  static _GetDrawMode(e, t) {
    switch (t == null && (t = 4), t) {
      case 0:
        return oe.PointListDrawMode;
      case 1:
        return oe.LineListDrawMode;
      case 2:
        return oe.LineLoopDrawMode;
      case 3:
        return oe.LineStripDrawMode;
      case 4:
        return oe.TriangleFillMode;
      case 5:
        return oe.TriangleStripDrawMode;
      case 6:
        return oe.TriangleFanDrawMode;
    }
    throw new Error(`${e}: Invalid mesh primitive mode (${t})`);
  }
  _compileMaterialsAsync() {
    this._parent._startPerformanceCounter("Compile materials");
    const e = new Array();
    if (this._gltf.materials) {
      for (const t of this._gltf.materials)
        if (t._data)
          for (const s in t._data) {
            const n = t._data[s];
            for (const i of n.babylonMeshes) {
              i.computeWorldMatrix(!0);
              const r = n.babylonMaterial;
              e.push(r.forceCompilationAsync(i)), e.push(r.forceCompilationAsync(i, { useInstances: !0 })), this._parent.useClipPlane && (e.push(r.forceCompilationAsync(i, { clipPlane: !0 })), e.push(r.forceCompilationAsync(i, { clipPlane: !0, useInstances: !0 })));
            }
          }
    }
    return Promise.all(e).then(() => {
      this._parent._endPerformanceCounter("Compile materials");
    });
  }
  _compileShadowGeneratorsAsync() {
    this._parent._startPerformanceCounter("Compile shadow generators");
    const e = new Array(), t = this._babylonScene.lights;
    for (const s of t) {
      const n = s.getShadowGenerator();
      n && e.push(n.forceCompilationAsync());
    }
    return Promise.all(e).then(() => {
      this._parent._endPerformanceCounter("Compile shadow generators");
    });
  }
  _forEachExtensions(e) {
    for (const t of this._extensions)
      t.enabled && e(t);
  }
  _applyExtensions(e, t, s) {
    for (const n of this._extensions)
      if (n.enabled) {
        const i = `${n.name}.${t}`, r = e;
        r._activeLoaderExtensionFunctions = r._activeLoaderExtensionFunctions || {};
        const o = r._activeLoaderExtensionFunctions;
        if (!o[i]) {
          o[i] = !0;
          try {
            const l = s(n);
            if (l)
              return l;
          } finally {
            delete o[i];
          }
        }
      }
    return null;
  }
  _extensionsOnLoading() {
    this._forEachExtensions((e) => e.onLoading && e.onLoading());
  }
  _extensionsOnReady() {
    this._forEachExtensions((e) => e.onReady && e.onReady());
  }
  _extensionsLoadSceneAsync(e, t) {
    return this._applyExtensions(t, "loadScene", (s) => s.loadSceneAsync && s.loadSceneAsync(e, t));
  }
  _extensionsLoadNodeAsync(e, t, s) {
    return this._applyExtensions(t, "loadNode", (n) => n.loadNodeAsync && n.loadNodeAsync(e, t, s));
  }
  _extensionsLoadCameraAsync(e, t, s) {
    return this._applyExtensions(t, "loadCamera", (n) => n.loadCameraAsync && n.loadCameraAsync(e, t, s));
  }
  _extensionsLoadVertexDataAsync(e, t, s) {
    return this._applyExtensions(t, "loadVertexData", (n) => n._loadVertexDataAsync && n._loadVertexDataAsync(e, t, s));
  }
  _extensionsLoadMeshPrimitiveAsync(e, t, s, n, i, r) {
    return this._applyExtensions(i, "loadMeshPrimitive", (o) => o._loadMeshPrimitiveAsync && o._loadMeshPrimitiveAsync(e, t, s, n, i, r));
  }
  _extensionsLoadMaterialAsync(e, t, s, n, i) {
    return this._applyExtensions(t, "loadMaterial", (r) => r._loadMaterialAsync && r._loadMaterialAsync(e, t, s, n, i));
  }
  _extensionsCreateMaterial(e, t, s) {
    return this._applyExtensions(t, "createMaterial", (n) => n.createMaterial && n.createMaterial(e, t, s));
  }
  _extensionsLoadMaterialPropertiesAsync(e, t, s) {
    return this._applyExtensions(t, "loadMaterialProperties", (n) => n.loadMaterialPropertiesAsync && n.loadMaterialPropertiesAsync(e, t, s));
  }
  _extensionsLoadTextureInfoAsync(e, t, s) {
    return this._applyExtensions(t, "loadTextureInfo", (n) => n.loadTextureInfoAsync && n.loadTextureInfoAsync(e, t, s));
  }
  _extensionsLoadTextureAsync(e, t, s) {
    return this._applyExtensions(t, "loadTexture", (n) => n._loadTextureAsync && n._loadTextureAsync(e, t, s));
  }
  _extensionsLoadAnimationAsync(e, t) {
    return this._applyExtensions(t, "loadAnimation", (s) => s.loadAnimationAsync && s.loadAnimationAsync(e, t));
  }
  _extensionsLoadAnimationChannelAsync(e, t, s, n, i) {
    return this._applyExtensions(s, "loadAnimationChannel", (r) => r._loadAnimationChannelAsync && r._loadAnimationChannelAsync(e, t, s, n, i));
  }
  _extensionsLoadSkinAsync(e, t, s) {
    return this._applyExtensions(s, "loadSkin", (n) => n._loadSkinAsync && n._loadSkinAsync(e, t, s));
  }
  _extensionsLoadUriAsync(e, t, s) {
    return this._applyExtensions(t, "loadUri", (n) => n._loadUriAsync && n._loadUriAsync(e, t, s));
  }
  _extensionsLoadBufferViewAsync(e, t) {
    return this._applyExtensions(t, "loadBufferView", (s) => s.loadBufferViewAsync && s.loadBufferViewAsync(e, t));
  }
  _extensionsLoadBufferAsync(e, t, s, n) {
    return this._applyExtensions(t, "loadBuffer", (i) => i.loadBufferAsync && i.loadBufferAsync(e, t, s, n));
  }
  /**
   * Helper method called by a loader extension to load an glTF extension.
   * @param context The context when loading the asset
   * @param property The glTF property to load the extension from
   * @param extensionName The name of the extension to load
   * @param actionAsync The action to run
   * @returns The promise returned by actionAsync or null if the extension does not exist
   */
  static LoadExtensionAsync(e, t, s, n) {
    if (!t.extensions)
      return null;
    const r = t.extensions[s];
    return r ? n(`${e}/extensions/${s}`, r) : null;
  }
  /**
   * Helper method called by a loader extension to load a glTF extra.
   * @param context The context when loading the asset
   * @param property The glTF property to load the extra from
   * @param extensionName The name of the extension to load
   * @param actionAsync The action to run
   * @returns The promise returned by actionAsync or null if the extra does not exist
   */
  static LoadExtraAsync(e, t, s, n) {
    if (!t.extras)
      return null;
    const r = t.extras[s];
    return r ? n(`${e}/extras/${s}`, r) : null;
  }
  /**
   * Checks for presence of an extension.
   * @param name The name of the extension to check
   * @returns A boolean indicating the presence of the given extension name in `extensionsUsed`
   */
  isExtensionUsed(e) {
    return !!this._gltf.extensionsUsed && this._gltf.extensionsUsed.indexOf(e) !== -1;
  }
  /**
   * Increments the indentation level and logs a message.
   * @param message The message to log
   */
  logOpen(e) {
    this._parent._logOpen(e);
  }
  /**
   * Decrements the indentation level.
   */
  logClose() {
    this._parent._logClose();
  }
  /**
   * Logs a message
   * @param message The message to log
   */
  log(e) {
    this._parent._log(e);
  }
  /**
   * Starts a performance counter.
   * @param counterName The name of the performance counter
   */
  startPerformanceCounter(e) {
    this._parent._startPerformanceCounter(e);
  }
  /**
   * Ends a performance counter.
   * @param counterName The name of the performance counter
   */
  endPerformanceCounter(e) {
    this._parent._endPerformanceCounter(e);
  }
}
_._RegisteredExtensions = {};
_.DefaultSampler = { index: -1 };
H._CreateGLTF2Loader = (a) => new _(a);
class xn extends Yi {
  /**
   * Creates a cube texture where the raw buffers are passed in.
   * @param scene defines the scene the texture is attached to
   * @param data defines the array of data to use to create each face
   * @param size defines the size of the textures
   * @param format defines the format of the data
   * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
   * @param generateMipMaps  defines if the engine should generate the mip levels
   * @param invertY defines if data must be stored with Y axis inverted
   * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
   * @param compression defines the compression used (null by default)
   */
  constructor(e, t, s, n = 5, i = 0, r = !1, o = !1, l = 3, h = null) {
    super("", e), this._texture = e.getEngine().createRawCubeTexture(t, s, n, i, r, o, l, h);
  }
  /**
   * Updates the raw cube texture.
   * @param data defines the data to store
   * @param format defines the data format
   * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
   * @param invertY defines if data must be stored with Y axis inverted
   * @param compression defines the compression used (null by default)
   */
  update(e, t, s, n, i = null) {
    this._texture.getEngine().updateRawCubeTexture(this._texture, e, t, s, n, i);
  }
  /**
   * Updates a raw cube texture with RGBD encoded data.
   * @param data defines the array of data [mipmap][face] to use to create each face
   * @param sphericalPolynomial defines the spherical polynomial for irradiance
   * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
   * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
   * @returns a promise that resolves when the operation is complete
   */
  updateRGBDAsync(e, t = null, s = 0.8, n = 0) {
    return Zi(this._texture, e, t, s, n).then(() => {
    });
  }
  /**
   * Clones the raw cube texture.
   * @returns a new cube texture
   */
  clone() {
    return zi.Clone(() => {
      const e = this.getScene(), t = this._texture, s = new xn(e, t._bufferViewArray, t.width, t.format, t.type, t.generateMipMaps, t.invertY, t.samplingMode, t._compression);
      return t.source === Fi.CubeRawRGBD && s.updateRGBDAsync(t._bufferViewArrayArray, t._sphericalPolynomial, t._lodGenerationScale, t._lodGenerationOffset), s;
    }, this);
  }
}
const Ds = "EXT_lights_image_based";
class Hn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Ds, this._loader = e, this.enabled = this._loader.isExtensionUsed(Ds);
  }
  /** @internal */
  dispose() {
    this._loader = null, delete this._lights;
  }
  /** @internal */
  onLoading() {
    const e = this._loader.gltf.extensions;
    if (e && e[this.name]) {
      const t = e[this.name];
      this._lights = t.lights;
    }
  }
  /**
   * @internal
   */
  loadSceneAsync(e, t) {
    return _.LoadExtensionAsync(e, t, this.name, (s, n) => {
      this._loader._allMaterialsDirtyRequired = !0;
      const i = new Array();
      i.push(this._loader.loadSceneAsync(e, t)), this._loader.logOpen(`${s}`);
      const r = A.Get(`${s}/light`, this._lights, n.light);
      return i.push(this._loadLightAsync(`/extensions/${this.name}/lights/${n.light}`, r).then((o) => {
        this._loader.babylonScene.environmentTexture = o;
      })), this._loader.logClose(), Promise.all(i).then(() => {
      });
    });
  }
  _loadLightAsync(e, t) {
    if (!t._loaded) {
      const s = new Array();
      this._loader.logOpen(`${e}`);
      const n = new Array(t.specularImages.length);
      for (let i = 0; i < t.specularImages.length; i++) {
        const r = t.specularImages[i];
        n[i] = new Array(r.length);
        for (let o = 0; o < r.length; o++) {
          const l = `${e}/specularImages/${i}/${o}`;
          this._loader.logOpen(`${l}`);
          const h = r[o], u = A.Get(l, this._loader.gltf.images, h);
          s.push(this._loader.loadImageAsync(`/images/${h}`, u).then((c) => {
            n[i][o] = c;
          })), this._loader.logClose();
        }
      }
      this._loader.logClose(), t._loaded = Promise.all(s).then(() => {
        const i = new xn(this._loader.babylonScene, null, t.specularImageSize);
        if (i.name = t.name || "environment", t._babylonTexture = i, t.intensity != null && (i.level = t.intensity), t.rotation) {
          let h = ie.FromArray(t.rotation);
          this._loader.babylonScene.useRightHandedSystem || (h = ie.Inverse(h)), S.FromQuaternionToRef(h, i.getReflectionTextureMatrix());
        }
        if (!t.irradianceCoefficients)
          throw new Error(`${e}: Irradiance coefficients are missing`);
        const r = Ki.FromArray(t.irradianceCoefficients);
        r.scaleInPlace(t.intensity), r.convertIrradianceToLambertianRadiance();
        const o = ji.FromHarmonics(r), l = (n.length - 1) / Vi.Log2(t.specularImageSize);
        return i.updateRGBDAsync(n, o, l);
      });
    }
    return t._loaded.then(() => t._babylonTexture);
  }
}
_.RegisterExtension(Ds, (a) => new Hn(a));
const ks = "EXT_mesh_gpu_instancing";
class Wn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = ks, this._loader = e, this.enabled = this._loader.isExtensionUsed(ks);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadNodeAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      this._loader._disableInstancedMesh++;
      const r = this._loader.loadNodeAsync(`/nodes/${t.index}`, t, s);
      if (this._loader._disableInstancedMesh--, !t._primitiveBabylonMeshes)
        return r;
      const o = new Array();
      let l = 0;
      const h = (u) => {
        if (i.attributes[u] == null) {
          o.push(Promise.resolve(null));
          return;
        }
        const c = A.Get(`${n}/attributes/${u}`, this._loader.gltf.accessors, i.attributes[u]);
        if (o.push(this._loader._loadFloatAccessorAsync(`/accessors/${c.bufferView}`, c)), l === 0)
          l = c.count;
        else if (l !== c.count)
          throw new Error(`${n}/attributes: Instance buffer accessors do not have the same count.`);
      };
      return h("TRANSLATION"), h("ROTATION"), h("SCALE"), r.then((u) => Promise.all(o).then(([c, d, y]) => {
        const T = new Float32Array(l * 16);
        J.Vector3[0].copyFromFloats(0, 0, 0), J.Quaternion[0].copyFromFloats(0, 0, 0, 1), J.Vector3[1].copyFromFloats(1, 1, 1);
        for (let m = 0; m < l; ++m)
          c && N.FromArrayToRef(c, m * 3, J.Vector3[0]), d && ie.FromArrayToRef(d, m * 4, J.Quaternion[0]), y && N.FromArrayToRef(y, m * 3, J.Vector3[1]), S.ComposeToRef(J.Vector3[1], J.Quaternion[0], J.Vector3[0], J.Matrix[0]), J.Matrix[0].copyToArray(T, m * 16);
        for (const m of t._primitiveBabylonMeshes)
          m.thinInstanceSetBuffer("matrix", T, 16, !0);
        return u;
      }));
    });
  }
}
_.RegisterExtension(ks, (a) => new Wn(a));
class ce {
  /**
   * Default instance for the meshoptimizer object.
   */
  static get Default() {
    return ce._Default || (ce._Default = new ce()), ce._Default;
  }
  /**
   * Constructor
   */
  constructor() {
    const e = ce.Configuration.decoder;
    this._decoderModulePromise = $.LoadBabylonScriptAsync(e.url).then(() => MeshoptDecoder.ready);
  }
  /**
   * Stop all async operations and release resources.
   */
  dispose() {
    delete this._decoderModulePromise;
  }
  /**
   * Decode meshopt data.
   * @see https://github.com/zeux/meshoptimizer/tree/master/js#decoder
   * @param source The input data.
   * @param count The number of elements.
   * @param stride The stride in bytes.
   * @param mode The compression mode.
   * @param filter The compression filter.
   * @returns a Promise<Uint8Array> that resolves to the decoded data
   */
  decodeGltfBufferAsync(e, t, s, n, i) {
    return this._decoderModulePromise.then(() => {
      const r = new Uint8Array(t * s);
      return MeshoptDecoder.decodeGltfBuffer(r, t, s, e, n, i), r;
    });
  }
}
ce.Configuration = {
  decoder: {
    url: `${$._DefaultCdnUrl}/meshopt_decoder.js`
  }
};
ce._Default = null;
const Bs = "EXT_meshopt_compression";
class Kn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Bs, this.enabled = e.isExtensionUsed(Bs), this._loader = e;
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadBufferViewAsync(e, t) {
    return _.LoadExtensionAsync(e, t, this.name, (s, n) => {
      const i = t;
      if (i._meshOptData)
        return i._meshOptData;
      const r = A.Get(`${e}/buffer`, this._loader.gltf.buffers, n.buffer);
      return i._meshOptData = this._loader.loadBufferAsync(`/buffers/${r.index}`, r, n.byteOffset || 0, n.byteLength).then((o) => ce.Default.decodeGltfBufferAsync(o, n.count, n.byteStride, n.mode, n.filter)), i._meshOptData;
    });
  }
}
_.RegisterExtension(Bs, (a) => new Kn(a));
const Fs = "EXT_texture_webp";
class jn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Fs, this._loader = e, this.enabled = e.isExtensionUsed(Fs);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  _loadTextureAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = t.sampler == null ? _.DefaultSampler : A.Get(`${e}/sampler`, this._loader.gltf.samplers, t.sampler), o = A.Get(`${n}/source`, this._loader.gltf.images, i.source);
      return this._loader._createTextureAsync(e, r, o, (l) => {
        s(l);
      }, void 0, !t._textureInfo.nonColorData);
    });
  }
}
_.RegisterExtension(Fs, (a) => new jn(a));
const Vs = "EXT_texture_avif";
class zn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Vs, this._loader = e, this.enabled = e.isExtensionUsed(Vs);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  _loadTextureAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = t.sampler == null ? _.DefaultSampler : A.Get(`${e}/sampler`, this._loader.gltf.samplers, t.sampler), o = A.Get(`${n}/source`, this._loader.gltf.images, i.source);
      return this._loader._createTextureAsync(e, r, o, (l) => {
        s(l);
      }, void 0, !t._textureInfo.nonColorData);
    });
  }
}
_.RegisterExtension(Vs, (a) => new zn(a));
const $s = "KHR_draco_mesh_compression";
class Zn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = $s, this.useNormalizedFlagFromAccessor = !0, this._loader = e, this.enabled = wn.DecoderAvailable && this._loader.isExtensionUsed($s);
  }
  /** @internal */
  dispose() {
    delete this.dracoCompression, this._loader = null;
  }
  /**
   * @internal
   */
  _loadVertexDataAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      if (t.mode != null && t.mode !== 4 && t.mode !== 5)
        throw new Error(`${e}: Unsupported mode ${t.mode}`);
      const r = {}, o = {}, l = (u, c) => {
        const d = i.attributes[u];
        if (d != null && (s._delayInfo = s._delayInfo || [], s._delayInfo.indexOf(c) === -1 && s._delayInfo.push(c), r[c] = d, this.useNormalizedFlagFromAccessor)) {
          const y = A.TryGet(this._loader.gltf.accessors, t.attributes[u]);
          y && (o[c] = y.normalized || !1);
        }
      };
      l("POSITION", M.PositionKind), l("NORMAL", M.NormalKind), l("TANGENT", M.TangentKind), l("TEXCOORD_0", M.UVKind), l("TEXCOORD_1", M.UV2Kind), l("TEXCOORD_2", M.UV3Kind), l("TEXCOORD_3", M.UV4Kind), l("TEXCOORD_4", M.UV5Kind), l("TEXCOORD_5", M.UV6Kind), l("JOINTS_0", M.MatricesIndicesKind), l("WEIGHTS_0", M.MatricesWeightsKind), l("COLOR_0", M.ColorKind);
      const h = A.Get(n, this._loader.gltf.bufferViews, i.bufferView);
      return h._dracoBabylonGeometry || (h._dracoBabylonGeometry = this._loader.loadBufferViewAsync(`/bufferViews/${h.index}`, h).then((u) => (this.dracoCompression || wn.Default)._decodeMeshToGeometryForGltfAsync(s.name, this._loader.babylonScene, u, r, o).catch((d) => {
        throw new Error(`${e}: ${d.message}`);
      }))), h._dracoBabylonGeometry;
    });
  }
}
_.RegisterExtension($s, (a) => new Zn(a));
const Gs = "KHR_lights_punctual";
class Yn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Gs, this._loader = e, this.enabled = this._loader.isExtensionUsed(Gs);
  }
  /** @internal */
  dispose() {
    this._loader = null, delete this._lights;
  }
  /** @internal */
  onLoading() {
    const e = this._loader.gltf.extensions;
    if (e && e[this.name]) {
      const t = e[this.name];
      this._lights = t.lights, A.Assign(this._lights);
    }
  }
  /**
   * @internal
   */
  loadNodeAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => (this._loader._allMaterialsDirtyRequired = !0, this._loader.loadNodeAsync(e, t, (r) => {
      let o;
      const l = A.Get(n, this._lights, i.light), h = l.name || r.name;
      switch (this._loader.babylonScene._blockEntityCollection = !!this._loader._assetContainer, l.type) {
        case "directional": {
          const u = new ae(h, N.Backward(), this._loader.babylonScene);
          u.position.setAll(0), o = u;
          break;
        }
        case "point": {
          o = new Xi(h, N.Zero(), this._loader.babylonScene);
          break;
        }
        case "spot": {
          const u = new ne(h, N.Zero(), N.Backward(), 0, 1, this._loader.babylonScene);
          u.angle = (l.spot && l.spot.outerConeAngle || Math.PI / 4) * 2, u.innerAngle = (l.spot && l.spot.innerConeAngle || 0) * 2, o = u;
          break;
        }
        default:
          throw this._loader.babylonScene._blockEntityCollection = !1, new Error(`${n}: Invalid light type (${l.type})`);
      }
      o._parentContainer = this._loader._assetContainer, this._loader.babylonScene._blockEntityCollection = !1, l._babylonLight = o, o.falloffType = is.FALLOFF_GLTF, o.diffuse = l.color ? j.FromArray(l.color) : j.White(), o.intensity = l.intensity == null ? 1 : l.intensity, o.range = l.range == null ? Number.MAX_VALUE : l.range, o.parent = r, this._loader._babylonLights.push(o), _.AddPointerMetadata(o, n), s(r);
    })));
  }
}
_.RegisterExtension(Gs, (a) => new Yn(a));
const Us = "KHR_materials_pbrSpecularGlossiness";
class Xn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Us, this.order = 200, this._loader = e, this.enabled = this._loader.isExtensionUsed(Us);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialBasePropertiesAsync(e, t, s)), r.push(this._loadSpecularGlossinessPropertiesAsync(n, i, s)), this._loader.loadMaterialAlphaProperties(e, t, s), Promise.all(r).then(() => {
      });
    });
  }
  _loadSpecularGlossinessPropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const n = new Array();
    return s.metallic = null, s.roughness = null, t.diffuseFactor ? (s.albedoColor = j.FromArray(t.diffuseFactor), s.alpha = t.diffuseFactor[3]) : s.albedoColor = j.White(), s.reflectivityColor = t.specularFactor ? j.FromArray(t.specularFactor) : j.White(), s.microSurface = t.glossinessFactor == null ? 1 : t.glossinessFactor, t.diffuseTexture && n.push(this._loader.loadTextureInfoAsync(`${e}/diffuseTexture`, t.diffuseTexture, (i) => {
      i.name = `${s.name} (Diffuse)`, s.albedoTexture = i;
    })), t.specularGlossinessTexture && (n.push(this._loader.loadTextureInfoAsync(`${e}/specularGlossinessTexture`, t.specularGlossinessTexture, (i) => {
      i.name = `${s.name} (Specular Glossiness)`, s.reflectivityTexture = i, s.reflectivityTexture.hasAlpha = !0;
    })), s.useMicroSurfaceFromReflectivityMapAlpha = !0), Promise.all(n).then(() => {
    });
  }
}
_.RegisterExtension(Us, (a) => new Xn(a));
const qs = "KHR_materials_unlit";
class Jn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = qs, this.order = 210, this._loader = e, this.enabled = this._loader.isExtensionUsed(qs);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, () => this._loadUnlitPropertiesAsync(e, t, s));
  }
  _loadUnlitPropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const n = new Array();
    s.unlit = !0;
    const i = t.pbrMetallicRoughness;
    return i && (i.baseColorFactor ? (s.albedoColor = j.FromArray(i.baseColorFactor), s.alpha = i.baseColorFactor[3]) : s.albedoColor = j.White(), i.baseColorTexture && n.push(this._loader.loadTextureInfoAsync(`${e}/baseColorTexture`, i.baseColorTexture, (r) => {
      r.name = `${s.name} (Base Color)`, s.albedoTexture = r;
    }))), t.doubleSided && (s.backFaceCulling = !1, s.twoSidedLighting = !0), this._loader.loadMaterialAlphaProperties(e, t, s), Promise.all(n).then(() => {
    });
  }
}
_.RegisterExtension(qs, (a) => new Jn(a));
const Hs = "KHR_materials_clearcoat";
class Qn {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Hs, this.order = 190, this._loader = e, this.enabled = this._loader.isExtensionUsed(Hs);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadClearCoatPropertiesAsync(n, i, s)), Promise.all(r).then(() => {
      });
    });
  }
  _loadClearCoatPropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const n = new Array();
    return s.clearCoat.isEnabled = !0, s.clearCoat.useRoughnessFromMainTexture = !1, s.clearCoat.remapF0OnInterfaceChange = !1, t.clearcoatFactor != null ? s.clearCoat.intensity = t.clearcoatFactor : s.clearCoat.intensity = 0, t.clearcoatTexture && n.push(this._loader.loadTextureInfoAsync(`${e}/clearcoatTexture`, t.clearcoatTexture, (i) => {
      i.name = `${s.name} (ClearCoat Intensity)`, s.clearCoat.texture = i;
    })), t.clearcoatRoughnessFactor != null ? s.clearCoat.roughness = t.clearcoatRoughnessFactor : s.clearCoat.roughness = 0, t.clearcoatRoughnessTexture && (t.clearcoatRoughnessTexture.nonColorData = !0, n.push(this._loader.loadTextureInfoAsync(`${e}/clearcoatRoughnessTexture`, t.clearcoatRoughnessTexture, (i) => {
      i.name = `${s.name} (ClearCoat Roughness)`, s.clearCoat.textureRoughness = i;
    }))), t.clearcoatNormalTexture && (t.clearcoatNormalTexture.nonColorData = !0, n.push(this._loader.loadTextureInfoAsync(`${e}/clearcoatNormalTexture`, t.clearcoatNormalTexture, (i) => {
      i.name = `${s.name} (ClearCoat Normal)`, s.clearCoat.bumpTexture = i;
    })), s.invertNormalMapX = !s.getScene().useRightHandedSystem, s.invertNormalMapY = s.getScene().useRightHandedSystem, t.clearcoatNormalTexture.scale != null && (s.clearCoat.bumpTexture.level = t.clearcoatNormalTexture.scale)), Promise.all(n).then(() => {
    });
  }
}
_.RegisterExtension(Hs, (a) => new Qn(a));
const Ws = "KHR_materials_iridescence";
class ei {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Ws, this.order = 195, this._loader = e, this.enabled = this._loader.isExtensionUsed(Ws);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadIridescencePropertiesAsync(n, i, s)), Promise.all(r).then(() => {
      });
    });
  }
  _loadIridescencePropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const n = new Array();
    return s.iridescence.isEnabled = !0, s.iridescence.intensity = t.iridescenceFactor ?? 0, s.iridescence.indexOfRefraction = t.iridescenceIor ?? t.iridescenceIOR ?? 1.3, s.iridescence.minimumThickness = t.iridescenceThicknessMinimum ?? 100, s.iridescence.maximumThickness = t.iridescenceThicknessMaximum ?? 400, t.iridescenceTexture && n.push(this._loader.loadTextureInfoAsync(`${e}/iridescenceTexture`, t.iridescenceTexture, (i) => {
      i.name = `${s.name} (Iridescence Intensity)`, s.iridescence.texture = i;
    })), t.iridescenceThicknessTexture && n.push(this._loader.loadTextureInfoAsync(`${e}/iridescenceThicknessTexture`, t.iridescenceThicknessTexture, (i) => {
      i.name = `${s.name} (Iridescence Thickness)`, s.iridescence.thicknessTexture = i;
    })), Promise.all(n).then(() => {
    });
  }
}
_.RegisterExtension(Ws, (a) => new ei(a));
const Ks = "KHR_materials_anisotropy";
class ti {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Ks, this.order = 195, this._loader = e, this.enabled = this._loader.isExtensionUsed(Ks);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadIridescencePropertiesAsync(n, i, s)), Promise.all(r).then(() => {
      });
    });
  }
  _loadIridescencePropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const n = new Array();
    return s.anisotropy.isEnabled = !0, s.anisotropy.intensity = t.anisotropyStrength ?? 0, s.anisotropy.angle = t.anisotropyRotation ?? 0, t.anisotropyTexture && n.push(this._loader.loadTextureInfoAsync(`${e}/anisotropyTexture`, t.anisotropyTexture, (i) => {
      i.name = `${s.name} (Anisotropy Intensity)`, s.anisotropy.texture = i;
    })), Promise.all(n).then(() => {
    });
  }
}
_.RegisterExtension(Ks, (a) => new ti(a));
const js = "KHR_materials_emissive_strength";
class si {
  /**
   * @internal
   */
  constructor(e) {
    this.name = js, this.order = 170, this._loader = e, this.enabled = this._loader.isExtensionUsed(js);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => this._loader.loadMaterialPropertiesAsync(e, t, s).then(() => {
      this._loadEmissiveProperties(n, i, s);
    }));
  }
  _loadEmissiveProperties(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    t.emissiveStrength !== void 0 && (s.emissiveIntensity = t.emissiveStrength);
  }
}
_.RegisterExtension(js, (a) => new si(a));
const zs = "KHR_materials_sheen";
class ni {
  /**
   * @internal
   */
  constructor(e) {
    this.name = zs, this.order = 190, this._loader = e, this.enabled = this._loader.isExtensionUsed(zs);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadSheenPropertiesAsync(n, i, s)), Promise.all(r).then(() => {
      });
    });
  }
  _loadSheenPropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const n = new Array();
    return s.sheen.isEnabled = !0, s.sheen.intensity = 1, t.sheenColorFactor != null ? s.sheen.color = j.FromArray(t.sheenColorFactor) : s.sheen.color = j.Black(), t.sheenColorTexture && n.push(this._loader.loadTextureInfoAsync(`${e}/sheenColorTexture`, t.sheenColorTexture, (i) => {
      i.name = `${s.name} (Sheen Color)`, s.sheen.texture = i;
    })), t.sheenRoughnessFactor !== void 0 ? s.sheen.roughness = t.sheenRoughnessFactor : s.sheen.roughness = 0, t.sheenRoughnessTexture && (t.sheenRoughnessTexture.nonColorData = !0, n.push(this._loader.loadTextureInfoAsync(`${e}/sheenRoughnessTexture`, t.sheenRoughnessTexture, (i) => {
      i.name = `${s.name} (Sheen Roughness)`, s.sheen.textureRoughness = i;
    }))), s.sheen.albedoScaling = !0, s.sheen.useRoughnessFromMainTexture = !1, Promise.all(n).then(() => {
    });
  }
}
_.RegisterExtension(zs, (a) => new ni(a));
const Zs = "KHR_materials_specular";
class ii {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Zs, this.order = 190, this._loader = e, this.enabled = this._loader.isExtensionUsed(Zs);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadSpecularPropertiesAsync(n, i, s)), Promise.all(r).then(() => {
      });
    });
  }
  _loadSpecularPropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const n = new Array();
    return t.specularFactor !== void 0 && (s.metallicF0Factor = t.specularFactor), t.specularColorFactor !== void 0 && (s.metallicReflectanceColor = j.FromArray(t.specularColorFactor)), t.specularTexture && (t.specularTexture.nonColorData = !0, n.push(this._loader.loadTextureInfoAsync(`${e}/specularTexture`, t.specularTexture, (i) => {
      i.name = `${s.name} (Specular F0 Strength)`, s.metallicReflectanceTexture = i, s.useOnlyMetallicFromMetallicReflectanceTexture = !0;
    }))), t.specularColorTexture && n.push(this._loader.loadTextureInfoAsync(`${e}/specularColorTexture`, t.specularColorTexture, (i) => {
      i.name = `${s.name} (Specular F0 Color)`, s.reflectanceTexture = i;
    })), Promise.all(n).then(() => {
    });
  }
}
_.RegisterExtension(Zs, (a) => new ii(a));
const Ys = "KHR_materials_ior";
class as {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Ys, this.order = 180, this._loader = e, this.enabled = this._loader.isExtensionUsed(Ys);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadIorPropertiesAsync(n, i, s)), Promise.all(r).then(() => {
      });
    });
  }
  _loadIorPropertiesAsync(e, t, s) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    return t.ior !== void 0 ? s.indexOfRefraction = t.ior : s.indexOfRefraction = as._DEFAULT_IOR, Promise.resolve();
  }
}
as._DEFAULT_IOR = 1.5;
_.RegisterExtension(Ys, (a) => new as(a));
const X = "KHR_materials_variants";
class ue {
  /**
   * @internal
   */
  constructor(e) {
    this.name = X, this._loader = e, this.enabled = this._loader.isExtensionUsed(X);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * Gets the list of available variant names for this asset.
   * @param rootMesh The glTF root mesh
   * @returns the list of all the variant names for this model
   */
  static GetAvailableVariants(e) {
    const t = this._GetExtensionMetadata(e);
    return t ? Object.keys(t.variants) : [];
  }
  /**
   * Gets the list of available variant names for this asset.
   * @param rootMesh The glTF root mesh
   * @returns the list of all the variant names for this model
   */
  getAvailableVariants(e) {
    return ue.GetAvailableVariants(e);
  }
  /**
   * Select a variant given a variant name or a list of variant names.
   * @param rootMesh The glTF root mesh
   * @param variantName The variant name(s) to select.
   */
  static SelectVariant(e, t) {
    const s = this._GetExtensionMetadata(e);
    if (!s)
      throw new Error(`Cannot select variant on a glTF mesh that does not have the ${X} extension`);
    const n = (i) => {
      const r = s.variants[i];
      if (r)
        for (const o of r)
          o.mesh.material = o.material;
    };
    if (t instanceof Array)
      for (const i of t)
        n(i);
    else
      n(t);
    s.lastSelected = t;
  }
  /**
   * Select a variant given a variant name or a list of variant names.
   * @param rootMesh The glTF root mesh
   * @param variantName The variant name(s) to select.
   */
  selectVariant(e, t) {
    ue.SelectVariant(e, t);
  }
  /**
   * Reset back to the original before selecting a variant.
   * @param rootMesh The glTF root mesh
   */
  static Reset(e) {
    const t = this._GetExtensionMetadata(e);
    if (!t)
      throw new Error(`Cannot reset on a glTF mesh that does not have the ${X} extension`);
    for (const s of t.original)
      s.mesh.material = s.material;
    t.lastSelected = null;
  }
  /**
   * Reset back to the original before selecting a variant.
   * @param rootMesh The glTF root mesh
   */
  reset(e) {
    ue.Reset(e);
  }
  /**
   * Gets the last selected variant name(s) or null if original.
   * @param rootMesh The glTF root mesh
   * @returns The selected variant name(s).
   */
  static GetLastSelectedVariant(e) {
    const t = this._GetExtensionMetadata(e);
    if (!t)
      throw new Error(`Cannot get the last selected variant on a glTF mesh that does not have the ${X} extension`);
    return t.lastSelected;
  }
  /**
   * Gets the last selected variant name(s) or null if original.
   * @param rootMesh The glTF root mesh
   * @returns The selected variant name(s).
   */
  getLastSelectedVariant(e) {
    return ue.GetLastSelectedVariant(e);
  }
  static _GetExtensionMetadata(e) {
    return e?._internalMetadata?.gltf?.[X] || null;
  }
  /** @internal */
  onLoading() {
    const e = this._loader.gltf.extensions;
    if (e && e[this.name]) {
      const t = e[this.name];
      this._variants = t.variants;
    }
  }
  /**
   * @internal
   */
  _loadMeshPrimitiveAsync(e, t, s, n, i, r) {
    return _.LoadExtensionAsync(e, i, this.name, (o, l) => {
      const h = new Array();
      return h.push(this._loader._loadMeshPrimitiveAsync(e, t, s, n, i, (u) => {
        if (r(u), u instanceof be) {
          const c = _._GetDrawMode(e, i.mode), d = this._loader.rootBabylonMesh, y = d ? d._internalMetadata = d._internalMetadata || {} : {}, T = y.gltf = y.gltf || {}, m = T[X] = T[X] || { lastSelected: null, original: [], variants: {} };
          m.original.push({ mesh: u, material: u.material });
          for (let p = 0; p < l.mappings.length; ++p) {
            const C = l.mappings[p], w = A.Get(`${o}/mappings/${p}/material`, this._loader.gltf.materials, C.material);
            h.push(this._loader._loadMaterialAsync(`#/materials/${C.material}`, w, u, c, (O) => {
              for (let I = 0; I < C.variants.length; ++I) {
                const V = C.variants[I], fe = A.Get(`/extensions/${X}/variants/${V}`, this._variants, V);
                m.variants[fe.name] = m.variants[fe.name] || [], m.variants[fe.name].push({
                  mesh: u,
                  material: O
                }), u.onClonedObservable.add((Os) => {
                  const Is = Os;
                  let re = null, se = Is;
                  do {
                    if (se = se.parent, !se)
                      return;
                    re = ue._GetExtensionMetadata(se);
                  } while (re === null);
                  if (d && re === ue._GetExtensionMetadata(d)) {
                    se._internalMetadata = {};
                    for (const K in d._internalMetadata)
                      se._internalMetadata[K] = d._internalMetadata[K];
                    se._internalMetadata.gltf = [];
                    for (const K in d._internalMetadata.gltf)
                      se._internalMetadata.gltf[K] = d._internalMetadata.gltf[K];
                    se._internalMetadata.gltf[X] = { lastSelected: null, original: [], variants: {} };
                    for (const K of re.original)
                      se._internalMetadata.gltf[X].original.push({
                        mesh: K.mesh,
                        material: K.material
                      });
                    for (const K in re.variants)
                      if (Object.prototype.hasOwnProperty.call(re.variants, K)) {
                        se._internalMetadata.gltf[X].variants[K] = [];
                        for (const En of re.variants[K])
                          se._internalMetadata.gltf[X].variants[K].push({
                            mesh: En.mesh,
                            material: En.material
                          });
                      }
                    re = se._internalMetadata.gltf[X];
                  }
                  for (const K of re.original)
                    K.mesh === u && (K.mesh = Is);
                  for (const K of re.variants[fe.name])
                    K.mesh === u && (K.mesh = Is);
                });
              }
            }));
          }
        }
      })), Promise.all(h).then(([u]) => u);
    });
  }
}
_.RegisterExtension(X, (a) => new ue(a));
class Cn {
  /**
   * Creates the default options for the helper.
   * @returns the default options
   */
  static _GetDefaultOptions() {
    return {
      renderSize: 1024,
      samples: 4,
      lodGenerationScale: 1,
      lodGenerationOffset: -4,
      renderTargetTextureType: qi.TEXTURETYPE_HALF_FLOAT,
      generateMipmaps: !0
    };
  }
  /**
   * constructor
   * @param options Defines the options we want to customize the helper
   * @param scene The scene to add the material to
   */
  constructor(e, t) {
    this._opaqueRenderTarget = null, this._opaqueMeshesCache = [], this._transparentMeshesCache = [], this._materialObservers = {}, this._options = {
      ...Cn._GetDefaultOptions(),
      ...e
    }, this._scene = t, this._scene._transmissionHelper = this, this.onErrorObservable = new B(), this._scene.onDisposeObservable.addOnce(() => {
      this.dispose();
    }), this._parseScene(), this._setupRenderTargets();
  }
  /**
   * Updates the background according to the new options
   * @param options
   */
  updateOptions(e) {
    if (!Object.keys(e).filter((i) => this._options[i] !== e[i]).length)
      return;
    const s = {
      ...this._options,
      ...e
    }, n = this._options;
    this._options = s, s.renderSize !== n.renderSize || s.renderTargetTextureType !== n.renderTargetTextureType || s.generateMipmaps !== n.generateMipmaps || !this._opaqueRenderTarget ? this._setupRenderTargets() : (this._opaqueRenderTarget.samples = s.samples, this._opaqueRenderTarget.lodGenerationScale = s.lodGenerationScale, this._opaqueRenderTarget.lodGenerationOffset = s.lodGenerationOffset);
  }
  /**
   * @returns the opaque render target texture or null if not available.
   */
  getOpaqueTarget() {
    return this._opaqueRenderTarget;
  }
  _shouldRenderAsTransmission(e) {
    return e ? !!(e instanceof F && e.subSurface.isRefractionEnabled) : !1;
  }
  _addMesh(e) {
    this._materialObservers[e.uniqueId] = e.onMaterialChangedObservable.add(this._onMeshMaterialChanged.bind(this)), $.SetImmediate(() => {
      this._shouldRenderAsTransmission(e.material) ? (e.material.refractionTexture = this._opaqueRenderTarget, this._transparentMeshesCache.indexOf(e) === -1 && this._transparentMeshesCache.push(e)) : this._opaqueMeshesCache.indexOf(e) === -1 && this._opaqueMeshesCache.push(e);
    });
  }
  _removeMesh(e) {
    e.onMaterialChangedObservable.remove(this._materialObservers[e.uniqueId]), delete this._materialObservers[e.uniqueId];
    let t = this._transparentMeshesCache.indexOf(e);
    t !== -1 && this._transparentMeshesCache.splice(t, 1), t = this._opaqueMeshesCache.indexOf(e), t !== -1 && this._opaqueMeshesCache.splice(t, 1);
  }
  _parseScene() {
    this._scene.meshes.forEach(this._addMesh.bind(this)), this._scene.onNewMeshAddedObservable.add(this._addMesh.bind(this)), this._scene.onMeshRemovedObservable.add(this._removeMesh.bind(this));
  }
  // When one of the meshes in the scene has its material changed, make sure that it's in the correct cache list.
  _onMeshMaterialChanged(e) {
    const t = this._transparentMeshesCache.indexOf(e), s = this._opaqueMeshesCache.indexOf(e);
    this._shouldRenderAsTransmission(e.material) ? (e.material instanceof F && (e.material.subSurface.refractionTexture = this._opaqueRenderTarget), s !== -1 ? (this._opaqueMeshesCache.splice(s, 1), this._transparentMeshesCache.push(e)) : t === -1 && this._transparentMeshesCache.push(e)) : t !== -1 ? (this._transparentMeshesCache.splice(t, 1), this._opaqueMeshesCache.push(e)) : s === -1 && this._opaqueMeshesCache.push(e);
  }
  /**
   * @internal
   * Check if the opaque render target has not been disposed and can still be used.
   * @returns
   */
  _isRenderTargetValid() {
    return this._opaqueRenderTarget?.getInternalTexture() !== null;
  }
  /**
   * @internal
   * Setup the render targets according to the specified options.
   */
  _setupRenderTargets() {
    this._opaqueRenderTarget && this._opaqueRenderTarget.dispose(), this._opaqueRenderTarget = new Ji("opaqueSceneTexture", this._options.renderSize, this._scene, this._options.generateMipmaps, void 0, this._options.renderTargetTextureType), this._opaqueRenderTarget.ignoreCameraViewport = !0, this._opaqueRenderTarget.renderList = this._opaqueMeshesCache, this._opaqueRenderTarget.clearColor = this._options.clearColor?.clone() ?? this._scene.clearColor.clone(), this._opaqueRenderTarget.gammaSpace = !1, this._opaqueRenderTarget.lodGenerationScale = this._options.lodGenerationScale, this._opaqueRenderTarget.lodGenerationOffset = this._options.lodGenerationOffset, this._opaqueRenderTarget.samples = this._options.samples, this._opaqueRenderTarget.renderSprites = !0, this._opaqueRenderTarget.renderParticles = !0;
    let e, t;
    this._opaqueRenderTarget.onBeforeBindObservable.add((s) => {
      t = this._scene.environmentIntensity, this._scene.environmentIntensity = 1, e = this._scene.imageProcessingConfiguration.applyByPostProcess, this._options.clearColor ? s.clearColor.copyFrom(this._options.clearColor) : this._scene.clearColor.toLinearSpaceToRef(s.clearColor, this._scene.getEngine().useExactSrgbConversions), this._scene.imageProcessingConfiguration._applyByPostProcess = !0;
    }), this._opaqueRenderTarget.onAfterUnbindObservable.add(() => {
      this._scene.environmentIntensity = t, this._scene.imageProcessingConfiguration._applyByPostProcess = e;
    }), this._transparentMeshesCache.forEach((s) => {
      this._shouldRenderAsTransmission(s.material) && (s.material.refractionTexture = this._opaqueRenderTarget);
    });
  }
  /**
   * Dispose all the elements created by the Helper.
   */
  dispose() {
    this._scene._transmissionHelper = void 0, this._opaqueRenderTarget && (this._opaqueRenderTarget.dispose(), this._opaqueRenderTarget = null), this._transparentMeshesCache = [], this._opaqueMeshesCache = [];
  }
}
const Xs = "KHR_materials_transmission";
class ri {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Xs, this.order = 175, this._loader = e, this.enabled = this._loader.isExtensionUsed(Xs), this.enabled && (e.parent.transparencyAsCoverage = !0);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialBasePropertiesAsync(e, t, s)), r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadTransparentPropertiesAsync(n, t, s, i)), Promise.all(r).then(() => {
      });
    });
  }
  _loadTransparentPropertiesAsync(e, t, s, n) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const i = s;
    if (i.subSurface.isRefractionEnabled = !0, i.subSurface.volumeIndexOfRefraction = 1, i.subSurface.useAlbedoToTintRefraction = !0, n.transmissionFactor !== void 0) {
      i.subSurface.refractionIntensity = n.transmissionFactor;
      const r = i.getScene();
      i.subSurface.refractionIntensity && !r._transmissionHelper ? new Cn({}, i.getScene()) : i.subSurface.refractionIntensity && !r._transmissionHelper?._isRenderTargetValid() && r._transmissionHelper?._setupRenderTargets();
    } else
      return i.subSurface.refractionIntensity = 0, i.subSurface.isRefractionEnabled = !1, Promise.resolve();
    return i.subSurface.minimumThickness = 0, i.subSurface.maximumThickness = 0, n.transmissionTexture ? (n.transmissionTexture.nonColorData = !0, this._loader.loadTextureInfoAsync(`${e}/transmissionTexture`, n.transmissionTexture, void 0).then((r) => {
      i.subSurface.refractionIntensityTexture = r, i.subSurface.useGltfStyleTextures = !0;
    })) : Promise.resolve();
  }
}
_.RegisterExtension(Xs, (a) => new ri(a));
const Js = "KHR_materials_translucency";
class oi {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Js, this.order = 174, this._loader = e, this.enabled = this._loader.isExtensionUsed(Js), this.enabled && (e.parent.transparencyAsCoverage = !0);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialBasePropertiesAsync(e, t, s)), r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadTranslucentPropertiesAsync(n, t, s, i)), Promise.all(r).then(() => {
      });
    });
  }
  _loadTranslucentPropertiesAsync(e, t, s, n) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    const i = s;
    if (i.subSurface.isTranslucencyEnabled = !0, i.subSurface.volumeIndexOfRefraction = 1, i.subSurface.minimumThickness = 0, i.subSurface.maximumThickness = 0, i.subSurface.useAlbedoToTintTranslucency = !0, n.translucencyFactor !== void 0)
      i.subSurface.translucencyIntensity = n.translucencyFactor;
    else
      return i.subSurface.translucencyIntensity = 0, i.subSurface.isTranslucencyEnabled = !1, Promise.resolve();
    return n.translucencyTexture ? (n.translucencyTexture.nonColorData = !0, this._loader.loadTextureInfoAsync(`${e}/translucencyTexture`, n.translucencyTexture).then((r) => {
      i.subSurface.translucencyIntensityTexture = r;
    })) : Promise.resolve();
  }
}
_.RegisterExtension(Js, (a) => new oi(a));
const Qs = "KHR_materials_volume";
class ai {
  /**
   * @internal
   */
  constructor(e) {
    this.name = Qs, this.order = 173, this._loader = e, this.enabled = this._loader.isExtensionUsed(Qs), this.enabled && this._loader._disableInstancedMesh++;
  }
  /** @internal */
  dispose() {
    this.enabled && this._loader._disableInstancedMesh--, this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialBasePropertiesAsync(e, t, s)), r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadVolumePropertiesAsync(n, t, s, i)), Promise.all(r).then(() => {
      });
    });
  }
  _loadVolumePropertiesAsync(e, t, s, n) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    if (!s.subSurface.isRefractionEnabled && !s.subSurface.isTranslucencyEnabled || !n.thicknessFactor)
      return Promise.resolve();
    s.subSurface.volumeIndexOfRefraction = s.indexOfRefraction;
    const i = n.attenuationDistance !== void 0 ? n.attenuationDistance : Number.MAX_VALUE;
    return s.subSurface.tintColorAtDistance = i, n.attenuationColor !== void 0 && n.attenuationColor.length == 3 && s.subSurface.tintColor.copyFromFloats(n.attenuationColor[0], n.attenuationColor[1], n.attenuationColor[2]), s.subSurface.minimumThickness = 0, s.subSurface.maximumThickness = n.thicknessFactor, s.subSurface.useThicknessAsDepth = !0, n.thicknessTexture ? (n.thicknessTexture.nonColorData = !0, this._loader.loadTextureInfoAsync(`${e}/thicknessTexture`, n.thicknessTexture).then((r) => {
      s.subSurface.thicknessTexture = r, s.subSurface.useGltfStyleTextures = !0;
    })) : Promise.resolve();
  }
}
_.RegisterExtension(Qs, (a) => new ai(a));
const en = "KHR_materials_dispersion";
class li {
  /**
   * @internal
   */
  constructor(e) {
    this.name = en, this.order = 174, this._loader = e, this.enabled = this._loader.isExtensionUsed(en);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return r.push(this._loader.loadMaterialBasePropertiesAsync(e, t, s)), r.push(this._loader.loadMaterialPropertiesAsync(e, t, s)), r.push(this._loadDispersionPropertiesAsync(n, t, s, i)), Promise.all(r).then(() => {
      });
    });
  }
  _loadDispersionPropertiesAsync(e, t, s, n) {
    if (!(s instanceof F))
      throw new Error(`${e}: Material type not supported`);
    return !s.subSurface.isRefractionEnabled || !n.dispersion || (s.subSurface.isDispersionEnabled = !0, s.subSurface.dispersion = n.dispersion), Promise.resolve();
  }
}
_.RegisterExtension(en, (a) => new li(a));
const tn = "KHR_mesh_quantization";
class hi {
  /**
   * @internal
   */
  constructor(e) {
    this.name = tn, this.enabled = e.isExtensionUsed(tn);
  }
  /** @internal */
  dispose() {
  }
}
_.RegisterExtension(tn, (a) => new hi(a));
const sn = "KHR_texture_basisu";
class ui {
  /**
   * @internal
   */
  constructor(e) {
    this.name = sn, this._loader = e, this.enabled = e.isExtensionUsed(sn);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  _loadTextureAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = t.sampler == null ? _.DefaultSampler : A.Get(`${e}/sampler`, this._loader.gltf.samplers, t.sampler), o = A.Get(`${n}/source`, this._loader.gltf.images, i.source);
      return this._loader._createTextureAsync(e, r, o, (l) => {
        s(l);
      }, t._textureInfo.nonColorData ? { useRGBAIfASTCBC7NotAvailableWhenUASTC: !0 } : void 0, !t._textureInfo.nonColorData);
    });
  }
}
_.RegisterExtension(sn, (a) => new ui(a));
const nn = "KHR_texture_transform";
class ci {
  /**
   * @internal
   */
  constructor(e) {
    this.name = nn, this._loader = e, this.enabled = this._loader.isExtensionUsed(nn);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadTextureInfoAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => this._loader.loadTextureInfoAsync(e, t, (r) => {
      if (!(r instanceof G))
        throw new Error(`${n}: Texture type not supported`);
      i.offset && (r.uOffset = i.offset[0], r.vOffset = i.offset[1]), r.uRotationCenter = 0, r.vRotationCenter = 0, i.rotation && (r.wAng = -i.rotation), i.scale && (r.uScale = i.scale[0], r.vScale = i.scale[1]), i.texCoord != null && (r.coordinatesIndex = i.texCoord), s(r);
    }));
  }
}
_.RegisterExtension(nn, (a) => new ci(a));
const rn = "KHR_xmp_json_ld";
class di {
  /**
   * @internal
   */
  constructor(e) {
    this.name = rn, this.order = 100, this._loader = e, this.enabled = this._loader.isExtensionUsed(rn);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * Called after the loader state changes to LOADING.
   */
  onLoading() {
    if (this._loader.rootBabylonMesh === null)
      return;
    const e = this._loader.gltf.extensions?.KHR_xmp_json_ld, t = this._loader.gltf.asset?.extensions?.KHR_xmp_json_ld;
    if (e && t) {
      const s = +t.packet;
      e.packets && s < e.packets.length && (this._loader.rootBabylonMesh.metadata = this._loader.rootBabylonMesh.metadata || {}, this._loader.rootBabylonMesh.metadata.xmp = e.packets[s]);
    }
  }
}
_.RegisterExtension(rn, (a) => new di(a));
function Ce(a, e, t, s) {
  return j.FromArray(e, t).scale(s);
}
function ur(a, e, t, s) {
  return e[t + 3] * s;
}
function R(a, e, t, s) {
  return e[t] * s;
}
function on(a, e, t, s) {
  return -e[t] * s;
}
function bs(a, e, t, s) {
  return e[t + 1] * s;
}
function Rn(a, e, t, s) {
  return e[t] * s * 2;
}
function z(a) {
  return {
    scale: [
      new P(x.ANIMATIONTYPE_FLOAT, `${a}.uScale`, R, () => 2),
      new P(x.ANIMATIONTYPE_FLOAT, `${a}.vScale`, bs, () => 2)
    ],
    offset: [
      new P(x.ANIMATIONTYPE_FLOAT, `${a}.uOffset`, R, () => 2),
      new P(x.ANIMATIONTYPE_FLOAT, `${a}.vOffset`, bs, () => 2)
    ],
    rotation: [new P(x.ANIMATIONTYPE_FLOAT, `${a}.wAng`, on, () => 1)]
  };
}
class le extends os {
  /** @internal */
  buildAnimations(e, t, s, n, i) {
    i(e._babylonCamera, this._buildAnimation(t, s, n));
  }
}
class P extends os {
  /** @internal */
  buildAnimations(e, t, s, n, i) {
    for (const r in e._data)
      i(e._data[r].babylonMaterial, this._buildAnimation(t, s, n));
  }
}
class ts extends os {
  /** @internal */
  buildAnimations(e, t, s, n, i) {
    i(e._babylonLight, this._buildAnimation(t, s, n));
  }
}
const cr = {
  __array__: {
    __target__: !0,
    ...ns
  }
}, dr = {
  __array__: {
    __target__: !0,
    orthographic: {
      xmag: [
        new le(x.ANIMATIONTYPE_FLOAT, "orthoLeft", on, () => 1),
        new le(x.ANIMATIONTYPE_FLOAT, "orthoRight", bs, () => 1)
      ],
      ymag: [
        new le(x.ANIMATIONTYPE_FLOAT, "orthoBottom", on, () => 1),
        new le(x.ANIMATIONTYPE_FLOAT, "orthoTop", bs, () => 1)
      ],
      zfar: [new le(x.ANIMATIONTYPE_FLOAT, "maxZ", R, () => 1)],
      znear: [new le(x.ANIMATIONTYPE_FLOAT, "minZ", R, () => 1)]
    },
    perspective: {
      yfov: [new le(x.ANIMATIONTYPE_FLOAT, "fov", R, () => 1)],
      zfar: [new le(x.ANIMATIONTYPE_FLOAT, "maxZ", R, () => 1)],
      znear: [new le(x.ANIMATIONTYPE_FLOAT, "minZ", R, () => 1)]
    }
  }
}, fr = {
  __array__: {
    __target__: !0,
    pbrMetallicRoughness: {
      baseColorFactor: [
        new P(x.ANIMATIONTYPE_COLOR3, "albedoColor", Ce, () => 4),
        new P(x.ANIMATIONTYPE_FLOAT, "alpha", ur, () => 4)
      ],
      metallicFactor: [new P(x.ANIMATIONTYPE_FLOAT, "metallic", R, () => 1)],
      roughnessFactor: [new P(x.ANIMATIONTYPE_FLOAT, "roughness", R, () => 1)],
      baseColorTexture: {
        extensions: {
          KHR_texture_transform: z("albedoTexture")
        }
      },
      metallicRoughnessTexture: {
        extensions: {
          KHR_texture_transform: z("metallicTexture")
        }
      }
    },
    emissiveFactor: [new P(x.ANIMATIONTYPE_COLOR3, "emissiveColor", Ce, () => 3)],
    normalTexture: {
      scale: [new P(x.ANIMATIONTYPE_FLOAT, "bumpTexture.level", R, () => 1)],
      extensions: {
        KHR_texture_transform: z("bumpTexture")
      }
    },
    occlusionTexture: {
      strength: [new P(x.ANIMATIONTYPE_FLOAT, "ambientTextureStrength", R, () => 1)],
      extensions: {
        KHR_texture_transform: z("ambientTexture")
      }
    },
    emissiveTexture: {
      extensions: {
        KHR_texture_transform: z("emissiveTexture")
      }
    },
    extensions: {
      KHR_materials_anisotropy: {
        anisotropyStrength: [new P(x.ANIMATIONTYPE_FLOAT, "anisotropy.intensity", R, () => 1)],
        anisotropyRotation: [new P(x.ANIMATIONTYPE_FLOAT, "anisotropy.angle", R, () => 1)],
        anisotropyTexture: {
          extensions: {
            KHR_texture_transform: z("anisotropy.texture")
          }
        }
      },
      KHR_materials_clearcoat: {
        clearcoatFactor: [new P(x.ANIMATIONTYPE_FLOAT, "clearCoat.intensity", R, () => 1)],
        clearcoatRoughnessFactor: [new P(x.ANIMATIONTYPE_FLOAT, "clearCoat.roughness", R, () => 1)],
        clearcoatTexture: {
          extensions: {
            KHR_texture_transform: z("clearCoat.texture")
          }
        },
        clearcoatNormalTexture: {
          scale: [new P(x.ANIMATIONTYPE_FLOAT, "clearCoat.bumpTexture.level", R, () => 1)],
          extensions: {
            KHR_texture_transform: z("clearCoat.bumpTexture")
          }
        },
        clearcoatRoughnessTexture: {
          extensions: {
            KHR_texture_transform: z("clearCoat.textureRoughness")
          }
        }
      },
      KHR_materials_dispersion: {
        dispersion: [new P(x.ANIMATIONTYPE_FLOAT, "subSurface.dispersion", R, () => 1)]
      },
      KHR_materials_emissive_strength: {
        emissiveStrength: [new P(x.ANIMATIONTYPE_FLOAT, "emissiveIntensity", R, () => 1)]
      },
      KHR_materials_ior: {
        ior: [new P(x.ANIMATIONTYPE_FLOAT, "indexOfRefraction", R, () => 1)]
      },
      KHR_materials_iridescence: {
        iridescenceFactor: [new P(x.ANIMATIONTYPE_FLOAT, "iridescence.intensity", R, () => 1)],
        iridescenceIor: [new P(x.ANIMATIONTYPE_FLOAT, "iridescence.indexOfRefraction", R, () => 1)],
        iridescenceThicknessMinimum: [new P(x.ANIMATIONTYPE_FLOAT, "iridescence.minimumThickness", R, () => 1)],
        iridescenceThicknessMaximum: [new P(x.ANIMATIONTYPE_FLOAT, "iridescence.maximumThickness", R, () => 1)],
        iridescenceTexture: {
          extensions: {
            KHR_texture_transform: z("iridescence.texture")
          }
        },
        iridescenceThicknessTexture: {
          extensions: {
            KHR_texture_transform: z("iridescence.thicknessTexture")
          }
        }
      },
      KHR_materials_sheen: {
        sheenColorFactor: [new P(x.ANIMATIONTYPE_COLOR3, "sheen.color", Ce, () => 3)],
        sheenRoughnessFactor: [new P(x.ANIMATIONTYPE_FLOAT, "sheen.roughness", R, () => 1)],
        sheenColorTexture: {
          extensions: {
            KHR_texture_transform: z("sheen.texture")
          }
        },
        sheenRoughnessTexture: {
          extensions: {
            KHR_texture_transform: z("sheen.textureRoughness")
          }
        }
      },
      KHR_materials_specular: {
        specularFactor: [new P(x.ANIMATIONTYPE_FLOAT, "metallicF0Factor", R, () => 1)],
        specularColorFactor: [new P(x.ANIMATIONTYPE_COLOR3, "metallicReflectanceColor", Ce, () => 3)],
        specularTexture: {
          extensions: {
            KHR_texture_transform: z("metallicReflectanceTexture")
          }
        },
        specularColorTexture: {
          extensions: {
            KHR_texture_transform: z("reflectanceTexture")
          }
        }
      },
      KHR_materials_transmission: {
        transmissionFactor: [new P(x.ANIMATIONTYPE_FLOAT, "subSurface.refractionIntensity", R, () => 1)],
        transmissionTexture: {
          extensions: {
            KHR_texture_transform: z("subSurface.refractionIntensityTexture")
          }
        }
      },
      KHR_materials_volume: {
        attenuationColor: [new P(x.ANIMATIONTYPE_COLOR3, "subSurface.tintColor", Ce, () => 3)],
        attenuationDistance: [new P(x.ANIMATIONTYPE_FLOAT, "subSurface.tintColorAtDistance", R, () => 1)],
        thicknessFactor: [new P(x.ANIMATIONTYPE_FLOAT, "subSurface.maximumThickness", R, () => 1)],
        thicknessTexture: {
          extensions: {
            KHR_texture_transform: z("subSurface.thicknessTexture")
          }
        }
      }
    }
  }
}, mr = {
  KHR_lights_punctual: {
    lights: {
      __array__: {
        __target__: !0,
        color: [new ts(x.ANIMATIONTYPE_COLOR3, "diffuse", Ce, () => 3)],
        intensity: [new ts(x.ANIMATIONTYPE_FLOAT, "intensity", R, () => 1)],
        range: [new ts(x.ANIMATIONTYPE_FLOAT, "range", R, () => 1)],
        spot: {
          innerConeAngle: [new ts(x.ANIMATIONTYPE_FLOAT, "innerAngle", Rn, () => 1)],
          outerConeAngle: [new ts(x.ANIMATIONTYPE_FLOAT, "angle", Rn, () => 1)]
        }
      }
    }
  }
}, _r = {
  nodes: cr,
  materials: fr,
  cameras: dr,
  extensions: mr
};
class fi {
  constructor(e, t) {
    this._gltf = e, this._infoTree = t;
  }
  /**
   * The pointer string is represented by a [JSON pointer](https://datatracker.ietf.org/doc/html/rfc6901).
   * <animationPointer> := /<rootNode>/<assetIndex>/<propertyPath>
   * <rootNode> := "nodes" | "materials" | "meshes" | "cameras" | "extensions"
   * <assetIndex> := <digit> | <name>
   * <propertyPath> := <extensionPath> | <standardPath>
   * <extensionPath> := "extensions"/<name>/<standardPath>
   * <standardPath> := <name> | <name>/<standardPath>
   * <name> := W+
   * <digit> := D+
   *
   * Examples:
   *  - "/nodes/0/rotation"
   *  - "/materials/2/emissiveFactor"
   *  - "/materials/2/pbrMetallicRoughness/baseColorFactor"
   *  - "/materials/2/extensions/KHR_materials_emissive_strength/emissiveStrength"
   *
   * @param path The path to convert
   * @returns The object and info associated with the path
   */
  convert(e) {
    let t = this._gltf, s = this._infoTree, n;
    if (!e.startsWith("/"))
      throw new Error("Path must start with a /");
    const i = e.split("/");
    i.shift();
    for (const r of i) {
      if (s.__array__)
        s = s.__array__;
      else if (s = s[r], !s)
        throw new Error(`Path ${e} is invalid`);
      if (t === void 0)
        throw new Error(`Path ${e} is invalid`);
      t = t[r], s.__target__ && (n = t);
    }
    return {
      object: n,
      info: s
    };
  }
}
const an = "KHR_animation_pointer";
class pr extends fi {
  constructor(e) {
    super(e, _r);
  }
}
class mi {
  /**
   * @internal
   */
  constructor(e) {
    this.name = an, this._loader = e, this._pathToObjectConverter = new pr(this._loader.gltf);
  }
  /**
   * Defines whether this extension is enabled.
   */
  get enabled() {
    return this._loader.isExtensionUsed(an);
  }
  /** @internal */
  dispose() {
    this._loader = null, delete this._pathToObjectConverter;
  }
  /**
   * Loads a glTF animation channel.
   * @param context The context when loading the asset
   * @param animationContext The context of the animation when loading the asset
   * @param animation The glTF animation property
   * @param channel The glTF animation channel property
   * @param onLoad Called for each animation loaded
   * @returns A void promise that resolves when the load is complete or null if not handled
   */
  _loadAnimationChannelAsync(e, t, s, n, i) {
    const r = n.target.extensions?.KHR_animation_pointer;
    if (!r || !this._pathToObjectConverter)
      return null;
    n.target.path !== "pointer" && v.Warn(`${e}/target/path: Value (${n.target.path}) must be (pointer) when using the ${this.name} extension`), n.target.node != null && v.Warn(`${e}/target/node: Value (${n.target.node}) must not be present when using the ${this.name} extension`);
    const o = `${e}/extensions/${this.name}`, l = r.pointer;
    if (!l)
      throw new Error(`${o}: Pointer is missing`);
    try {
      const h = this._pathToObjectConverter.convert(l);
      return this._loader._loadAnimationChannelFromTargetInfoAsync(e, t, s, n, h, i);
    } catch {
      return v.Warn(`${o}/pointer: Invalid pointer (${l}) skipped`), null;
    }
  }
}
_.RegisterExtension(an, (a) => new mi(a));
class bn {
  /**
   * Initializes the animation event
   * @param frame The frame for which the event is triggered
   * @param action The event to perform when triggered
   * @param onlyOnce Specifies if the event should be triggered only once
   */
  constructor(e, t, s) {
    this.frame = e, this.action = t, this.onlyOnce = s, this.isDone = !1;
  }
  /** @internal */
  _clone() {
    return new bn(this.frame, this.action, this.onlyOnce);
  }
}
class Ae {
  /**
   * Does the sound loop after it finishes playing once.
   */
  get loop() {
    return this._loop;
  }
  set loop(e) {
    e !== this._loop && (this._loop = e, this.updateOptions({ loop: e }));
  }
  /**
   * Gets the current time for the sound.
   */
  get currentTime() {
    if (this._htmlAudioElement)
      return this._htmlAudioElement.currentTime;
    if (b.audioEngine?.audioContext && (this.isPlaying || this.isPaused)) {
      const e = this.isPaused ? 0 : b.audioEngine.audioContext.currentTime - this._startTime;
      return this._currentTime + e;
    }
    return 0;
  }
  /**
   * Does this sound enables spatial sound.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
   */
  get spatialSound() {
    return this._spatialSound;
  }
  /**
   * Does this sound enables spatial sound.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
   */
  set spatialSound(e) {
    if (e == this._spatialSound)
      return;
    const t = this.isPlaying;
    this.pause(), e ? (this._spatialSound = e, this._updateSpatialParameters()) : this._disableSpatialSound(), t && this.play();
  }
  /**
   * Create a sound and attach it to a scene
   * @param name Name of your sound
   * @param urlOrArrayBuffer Url to the sound to load async or ArrayBuffer, it also works with MediaStreams and AudioBuffers
   * @param scene defines the scene the sound belongs to
   * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
   * @param options Objects to provide with the current available options: autoplay, loop, volume, spatialSound, maxDistance, rolloffFactor, refDistance, distanceModel, panningModel, streaming
   */
  constructor(e, t, s, n = null, i) {
    if (this.autoplay = !1, this._loop = !1, this.useCustomAttenuation = !1, this.isPlaying = !1, this.isPaused = !1, this.refDistance = 1, this.rolloffFactor = 1, this.maxDistance = 100, this.distanceModel = "linear", this.metadata = null, this.onEndedObservable = new B(), this._spatialSound = !1, this._panningModel = "equalpower", this._playbackRate = 1, this._streaming = !1, this._startTime = 0, this._currentTime = 0, this._position = N.Zero(), this._localDirection = new N(1, 0, 0), this._volume = 1, this._isReadyToPlay = !1, this._isDirectional = !1, this._coneInnerAngle = 360, this._coneOuterAngle = 360, this._coneOuterGain = 0, this._isOutputConnected = !1, this._urlType = "Unknown", this.name = e, s = s || we.LastCreatedScene, !!s)
      if (this._scene = s, Ae._SceneComponentInitialization(s), this._readyToPlayCallback = n, this._customAttenuationFunction = (r, o, l, h, u) => o < l ? r * (1 - o / l) : 0, i && (this.autoplay = i.autoplay || !1, this._loop = i.loop || !1, i.volume !== void 0 && (this._volume = i.volume), this._spatialSound = i.spatialSound ?? !1, this.maxDistance = i.maxDistance ?? 100, this.useCustomAttenuation = i.useCustomAttenuation ?? !1, this.rolloffFactor = i.rolloffFactor || 1, this.refDistance = i.refDistance || 1, this.distanceModel = i.distanceModel || "linear", this._playbackRate = i.playbackRate || 1, this._streaming = i.streaming ?? !1, this._length = i.length, this._offset = i.offset), b.audioEngine?.canUseWebAudio && b.audioEngine.audioContext) {
        this._soundGain = b.audioEngine.audioContext.createGain(), this._soundGain.gain.value = this._volume, this._inputAudioNode = this._soundGain, this._outputAudioNode = this._soundGain, this._spatialSound && this._createSpatialParameters(), this._scene.mainSoundTrack.addSound(this);
        let r = !0;
        if (t)
          try {
            typeof t == "string" ? (this._urlType = "String", this._url = t) : t instanceof ArrayBuffer ? this._urlType = "ArrayBuffer" : t instanceof HTMLMediaElement ? this._urlType = "MediaElement" : t instanceof MediaStream ? this._urlType = "MediaStream" : t instanceof AudioBuffer ? this._urlType = "AudioBuffer" : Array.isArray(t) && (this._urlType = "Array");
            let o = [], l = !1;
            switch (this._urlType) {
              case "MediaElement":
                this._streaming = !0, this._isReadyToPlay = !0, this._streamingSource = b.audioEngine.audioContext.createMediaElementSource(t), this.autoplay && this.play(0, this._offset, this._length), this._readyToPlayCallback && this._readyToPlayCallback();
                break;
              case "MediaStream":
                this._streaming = !0, this._isReadyToPlay = !0, this._streamingSource = b.audioEngine.audioContext.createMediaStreamSource(t), this.autoplay && this.play(0, this._offset, this._length), this._readyToPlayCallback && this._readyToPlayCallback();
                break;
              case "ArrayBuffer":
                t.byteLength > 0 && (l = !0, this._soundLoaded(t));
                break;
              case "AudioBuffer":
                this._audioBufferLoaded(t);
                break;
              case "String":
                o.push(t);
              case "Array":
                o.length === 0 && (o = t);
                for (let h = 0; h < o.length; h++) {
                  const u = o[h];
                  if (l = i && i.skipCodecCheck || u.indexOf(".mp3", u.length - 4) !== -1 && b.audioEngine.isMP3supported || u.indexOf(".ogg", u.length - 4) !== -1 && b.audioEngine.isOGGsupported || u.indexOf(".wav", u.length - 4) !== -1 || u.indexOf(".m4a", u.length - 4) !== -1 || u.indexOf(".mp4", u.length - 4) !== -1 || u.indexOf("blob:") !== -1, l) {
                    this._streaming ? (this._htmlAudioElement = new Audio(u), this._htmlAudioElement.controls = !1, this._htmlAudioElement.loop = this.loop, $.SetCorsBehavior(u, this._htmlAudioElement), this._htmlAudioElement.preload = "auto", this._htmlAudioElement.addEventListener("canplaythrough", () => {
                      this._isReadyToPlay = !0, this.autoplay && this.play(0, this._offset, this._length), this._readyToPlayCallback && this._readyToPlayCallback();
                    }), document.body.appendChild(this._htmlAudioElement), this._htmlAudioElement.load()) : this._scene._loadFile(u, (c) => {
                      this._soundLoaded(c);
                    }, void 0, !0, !0, (c) => {
                      c && v.Error("XHR " + c.status + " error on: " + u + "."), v.Error("Sound creation aborted."), this._scene.mainSoundTrack.removeSound(this);
                    });
                    break;
                  }
                }
                break;
              default:
                r = !1;
                break;
            }
            r ? l || (this._isReadyToPlay = !0, this._readyToPlayCallback && setTimeout(() => {
              this._readyToPlayCallback && this._readyToPlayCallback();
            }, 1e3)) : v.Error("Parameter must be a URL to the sound, an Array of URLs (.mp3 & .ogg) or an ArrayBuffer of the sound.");
          } catch {
            v.Error("Unexpected error. Sound creation aborted."), this._scene.mainSoundTrack.removeSound(this);
          }
      } else
        this._scene.mainSoundTrack.addSound(this), b.audioEngine && !b.audioEngine.WarnedWebAudioUnsupported && (v.Error("Web Audio is not supported by your browser."), b.audioEngine.WarnedWebAudioUnsupported = !0), this._readyToPlayCallback && setTimeout(() => {
          this._readyToPlayCallback && this._readyToPlayCallback();
        }, 1e3);
  }
  /**
   * Release the sound and its associated resources
   */
  dispose() {
    b.audioEngine?.canUseWebAudio && (this.isPlaying && this.stop(), this._isReadyToPlay = !1, this.soundTrackId === -1 ? this._scene.mainSoundTrack.removeSound(this) : this._scene.soundTracks && this._scene.soundTracks[this.soundTrackId].removeSound(this), this._soundGain && (this._soundGain.disconnect(), this._soundGain = null), this._soundPanner && (this._soundPanner.disconnect(), this._soundPanner = null), this._soundSource && (this._soundSource.disconnect(), this._soundSource = null), this._audioBuffer = null, this._htmlAudioElement && (this._htmlAudioElement.pause(), this._htmlAudioElement.src = "", document.body.removeChild(this._htmlAudioElement)), this._streamingSource && this._streamingSource.disconnect(), this._connectedTransformNode && this._registerFunc && (this._connectedTransformNode.unregisterAfterWorldMatrixUpdate(this._registerFunc), this._connectedTransformNode = null), this._clearTimeoutsAndObservers());
  }
  /**
   * Gets if the sounds is ready to be played or not.
   * @returns true if ready, otherwise false
   */
  isReady() {
    return this._isReadyToPlay;
  }
  /**
   * Get the current class name.
   * @returns current class name
   */
  getClassName() {
    return "Sound";
  }
  _audioBufferLoaded(e) {
    b.audioEngine?.audioContext && (this._audioBuffer = e, this._isReadyToPlay = !0, this.autoplay && this.play(0, this._offset, this._length), this._readyToPlayCallback && this._readyToPlayCallback());
  }
  _soundLoaded(e) {
    b.audioEngine?.audioContext && b.audioEngine.audioContext.decodeAudioData(e, (t) => {
      this._audioBufferLoaded(t);
    }, (t) => {
      v.Error("Error while decoding audio data for: " + this.name + " / Error: " + t);
    });
  }
  /**
   * Sets the data of the sound from an audiobuffer
   * @param audioBuffer The audioBuffer containing the data
   */
  setAudioBuffer(e) {
    b.audioEngine?.canUseWebAudio && (this._audioBuffer = e, this._isReadyToPlay = !0);
  }
  /**
   * Updates the current sounds options such as maxdistance, loop...
   * @param options A JSON object containing values named as the object properties
   */
  updateOptions(e) {
    e && (this.loop = e.loop ?? this.loop, this.maxDistance = e.maxDistance ?? this.maxDistance, this.useCustomAttenuation = e.useCustomAttenuation ?? this.useCustomAttenuation, this.rolloffFactor = e.rolloffFactor ?? this.rolloffFactor, this.refDistance = e.refDistance ?? this.refDistance, this.distanceModel = e.distanceModel ?? this.distanceModel, this._playbackRate = e.playbackRate ?? this._playbackRate, this._length = e.length ?? void 0, this.spatialSound = e.spatialSound ?? this._spatialSound, this._setOffset(e.offset ?? void 0), this.setVolume(e.volume ?? this._volume), this._updateSpatialParameters(), this.isPlaying && (this._streaming && this._htmlAudioElement ? (this._htmlAudioElement.playbackRate = this._playbackRate, this._htmlAudioElement.loop !== this.loop && (this._htmlAudioElement.loop = this.loop)) : this._soundSource && (this._soundSource.playbackRate.value = this._playbackRate, this._soundSource.loop !== this.loop && (this._soundSource.loop = this.loop), this._offset !== void 0 && this._soundSource.loopStart !== this._offset && (this._soundSource.loopStart = this._offset), this._length !== void 0 && this._length !== this._soundSource.loopEnd && (this._soundSource.loopEnd = (this._offset | 0) + this._length))));
  }
  _createSpatialParameters() {
    b.audioEngine?.canUseWebAudio && b.audioEngine.audioContext && (this._scene.headphone && (this._panningModel = "HRTF"), this._soundPanner = this._soundPanner ?? b.audioEngine.audioContext.createPanner(), this._soundPanner && this._outputAudioNode && (this._updateSpatialParameters(), this._soundPanner.connect(this._outputAudioNode), this._inputAudioNode = this._soundPanner));
  }
  _disableSpatialSound() {
    this._spatialSound && (this._inputAudioNode = this._soundGain, this._soundPanner?.disconnect(), this._soundPanner = null, this._spatialSound = !1);
  }
  _updateSpatialParameters() {
    this._spatialSound && (this._soundPanner ? this.useCustomAttenuation ? (this._soundPanner.distanceModel = "linear", this._soundPanner.maxDistance = Number.MAX_VALUE, this._soundPanner.refDistance = 1, this._soundPanner.rolloffFactor = 1, this._soundPanner.panningModel = this._panningModel) : (this._soundPanner.distanceModel = this.distanceModel, this._soundPanner.maxDistance = this.maxDistance, this._soundPanner.refDistance = this.refDistance, this._soundPanner.rolloffFactor = this.rolloffFactor, this._soundPanner.panningModel = this._panningModel) : this._createSpatialParameters());
  }
  /**
   * Switch the panning model to HRTF:
   * Renders a stereo output of higher quality than equalpower — it uses a convolution with measured impulse responses from human subjects.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
   */
  switchPanningModelToHRTF() {
    this._panningModel = "HRTF", this._switchPanningModel();
  }
  /**
   * Switch the panning model to Equal Power:
   * Represents the equal-power panning algorithm, generally regarded as simple and efficient. equalpower is the default value.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
   */
  switchPanningModelToEqualPower() {
    this._panningModel = "equalpower", this._switchPanningModel();
  }
  _switchPanningModel() {
    b.audioEngine?.canUseWebAudio && this._spatialSound && this._soundPanner && (this._soundPanner.panningModel = this._panningModel);
  }
  /**
   * Connect this sound to a sound track audio node like gain...
   * @param soundTrackAudioNode the sound track audio node to connect to
   */
  connectToSoundTrackAudioNode(e) {
    b.audioEngine?.canUseWebAudio && this._outputAudioNode && (this._isOutputConnected && this._outputAudioNode.disconnect(), this._outputAudioNode.connect(e), this._isOutputConnected = !0);
  }
  /**
   * Transform this sound into a directional source
   * @param coneInnerAngle Size of the inner cone in degree
   * @param coneOuterAngle Size of the outer cone in degree
   * @param coneOuterGain Volume of the sound outside the outer cone (between 0.0 and 1.0)
   */
  setDirectionalCone(e, t, s) {
    if (t < e) {
      v.Error("setDirectionalCone(): outer angle of the cone must be superior or equal to the inner angle.");
      return;
    }
    this._coneInnerAngle = e, this._coneOuterAngle = t, this._coneOuterGain = s, this._isDirectional = !0, this.isPlaying && this.loop && (this.stop(), this.play(0, this._offset, this._length));
  }
  /**
   * Gets or sets the inner angle for the directional cone.
   */
  get directionalConeInnerAngle() {
    return this._coneInnerAngle;
  }
  /**
   * Gets or sets the inner angle for the directional cone.
   */
  set directionalConeInnerAngle(e) {
    if (e != this._coneInnerAngle) {
      if (this._coneOuterAngle < e) {
        v.Error("directionalConeInnerAngle: outer angle of the cone must be superior or equal to the inner angle.");
        return;
      }
      this._coneInnerAngle = e, b.audioEngine?.canUseWebAudio && this._spatialSound && this._soundPanner && (this._soundPanner.coneInnerAngle = this._coneInnerAngle);
    }
  }
  /**
   * Gets or sets the outer angle for the directional cone.
   */
  get directionalConeOuterAngle() {
    return this._coneOuterAngle;
  }
  /**
   * Gets or sets the outer angle for the directional cone.
   */
  set directionalConeOuterAngle(e) {
    if (e != this._coneOuterAngle) {
      if (e < this._coneInnerAngle) {
        v.Error("directionalConeOuterAngle: outer angle of the cone must be superior or equal to the inner angle.");
        return;
      }
      this._coneOuterAngle = e, b.audioEngine?.canUseWebAudio && this._spatialSound && this._soundPanner && (this._soundPanner.coneOuterAngle = this._coneOuterAngle);
    }
  }
  /**
   * Sets the position of the emitter if spatial sound is enabled
   * @param newPosition Defines the new position
   */
  setPosition(e) {
    e.equals(this._position) || (this._position.copyFrom(e), b.audioEngine?.canUseWebAudio && this._spatialSound && this._soundPanner && !isNaN(this._position.x) && !isNaN(this._position.y) && !isNaN(this._position.z) && (this._soundPanner.positionX.value = this._position.x, this._soundPanner.positionY.value = this._position.y, this._soundPanner.positionZ.value = this._position.z));
  }
  /**
   * Sets the local direction of the emitter if spatial sound is enabled
   * @param newLocalDirection Defines the new local direction
   */
  setLocalDirectionToMesh(e) {
    this._localDirection = e, b.audioEngine?.canUseWebAudio && this._connectedTransformNode && this.isPlaying && this._updateDirection();
  }
  _updateDirection() {
    if (!this._connectedTransformNode || !this._soundPanner)
      return;
    const e = this._connectedTransformNode.getWorldMatrix(), t = N.TransformNormal(this._localDirection, e);
    t.normalize(), this._soundPanner.orientationX.value = t.x, this._soundPanner.orientationY.value = t.y, this._soundPanner.orientationZ.value = t.z;
  }
  /** @internal */
  updateDistanceFromListener() {
    if (b.audioEngine?.canUseWebAudio && this._connectedTransformNode && this.useCustomAttenuation && this._soundGain && this._scene.activeCamera) {
      const e = this._scene.audioListenerPositionProvider ? this._connectedTransformNode.position.subtract(this._scene.audioListenerPositionProvider()).length() : this._connectedTransformNode.getDistanceToCamera(this._scene.activeCamera);
      this._soundGain.gain.value = this._customAttenuationFunction(this._volume, e, this.maxDistance, this.refDistance, this.rolloffFactor);
    }
  }
  /**
   * Sets a new custom attenuation function for the sound.
   * @param callback Defines the function used for the attenuation
   * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-your-own-custom-attenuation-function
   */
  setAttenuationFunction(e) {
    this._customAttenuationFunction = e;
  }
  /**
   * Play the sound
   * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
   * @param offset (optional) Start the sound at a specific time in seconds
   * @param length (optional) Sound duration (in seconds)
   */
  play(e, t, s) {
    if (this._isReadyToPlay && this._scene.audioEnabled && b.audioEngine?.audioContext)
      try {
        this._clearTimeoutsAndObservers();
        let n = e ? b.audioEngine?.audioContext.currentTime + e : b.audioEngine?.audioContext.currentTime;
        if ((!this._soundSource || !this._streamingSource) && this._spatialSound && this._soundPanner && (!isNaN(this._position.x) && !isNaN(this._position.y) && !isNaN(this._position.z) && (this._soundPanner.positionX.value = this._position.x, this._soundPanner.positionY.value = this._position.y, this._soundPanner.positionZ.value = this._position.z), this._isDirectional && (this._soundPanner.coneInnerAngle = this._coneInnerAngle, this._soundPanner.coneOuterAngle = this._coneOuterAngle, this._soundPanner.coneOuterGain = this._coneOuterGain, this._connectedTransformNode ? this._updateDirection() : this._soundPanner.setOrientation(this._localDirection.x, this._localDirection.y, this._localDirection.z))), this._streaming) {
          if (this._streamingSource || (this._streamingSource = b.audioEngine.audioContext.createMediaElementSource(this._htmlAudioElement), this._htmlAudioElement.onended = () => {
            this._onended();
          }, this._htmlAudioElement.playbackRate = this._playbackRate), this._streamingSource.disconnect(), this._inputAudioNode && this._streamingSource.connect(this._inputAudioNode), this._htmlAudioElement) {
            const i = () => {
              if (b.audioEngine?.unlocked) {
                const r = this._htmlAudioElement.play();
                r !== void 0 && r.catch(() => {
                  b.audioEngine?.lock(), (this.loop || this.autoplay) && (this._audioUnlockedObserver = b.audioEngine?.onAudioUnlockedObservable.addOnce(() => {
                    i();
                  }));
                });
              } else
                (this.loop || this.autoplay) && (this._audioUnlockedObserver = b.audioEngine?.onAudioUnlockedObservable.addOnce(() => {
                  i();
                }));
            };
            i();
          }
        } else {
          const i = () => {
            if (b.audioEngine?.audioContext) {
              if (s = s || this._length, t !== void 0 && this._setOffset(t), this._soundSource) {
                const r = this._soundSource;
                r.onended = () => {
                  r.disconnect();
                };
              }
              if (this._soundSource = b.audioEngine?.audioContext.createBufferSource(), this._soundSource && this._inputAudioNode) {
                this._soundSource.buffer = this._audioBuffer, this._soundSource.connect(this._inputAudioNode), this._soundSource.loop = this.loop, t !== void 0 && (this._soundSource.loopStart = t), s !== void 0 && (this._soundSource.loopEnd = (t | 0) + s), this._soundSource.playbackRate.value = this._playbackRate, this._soundSource.onended = () => {
                  this._onended();
                }, n = e ? b.audioEngine?.audioContext.currentTime + e : b.audioEngine.audioContext.currentTime;
                const r = ((this.isPaused ? this.currentTime : 0) + (this._offset ?? 0)) % this._soundSource.buffer.duration;
                this._soundSource.start(n, r, this.loop ? void 0 : s);
              }
            }
          };
          b.audioEngine?.audioContext.state === "suspended" ? this._tryToPlayTimeout = setTimeout(() => {
            b.audioEngine?.audioContext.state === "suspended" ? (b.audioEngine.lock(), (this.loop || this.autoplay) && (this._audioUnlockedObserver = b.audioEngine.onAudioUnlockedObservable.addOnce(() => {
              i();
            }))) : i();
          }, 500) : i();
        }
        this._startTime = n, this.isPlaying = !0, this.isPaused = !1;
      } catch (n) {
        v.Error("Error while trying to play audio: " + this.name + ", " + n.message);
      }
  }
  _onended() {
    this.isPlaying = !1, this._startTime = 0, this._currentTime = 0, this.onended && this.onended(), this.onEndedObservable.notifyObservers(this);
  }
  /**
   * Stop the sound
   * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
   */
  stop(e) {
    if (this.isPlaying)
      if (this._clearTimeoutsAndObservers(), this._streaming)
        this._htmlAudioElement ? (this._htmlAudioElement.pause(), this._htmlAudioElement.currentTime > 0 && (this._htmlAudioElement.currentTime = 0)) : this._streamingSource.disconnect(), this.isPlaying = !1;
      else if (b.audioEngine?.audioContext && this._soundSource) {
        const t = e ? b.audioEngine.audioContext.currentTime + e : void 0;
        this._soundSource.onended = () => {
          this.isPlaying = !1, this.isPaused = !1, this._startTime = 0, this._currentTime = 0, this._soundSource && (this._soundSource.onended = () => {
          }), this._onended();
        }, this._soundSource.stop(t);
      } else
        this.isPlaying = !1;
    else this.isPaused && (this.isPaused = !1, this._startTime = 0, this._currentTime = 0);
  }
  /**
   * Put the sound in pause
   */
  pause() {
    this.isPlaying && (this._clearTimeoutsAndObservers(), this._streaming ? (this._htmlAudioElement ? this._htmlAudioElement.pause() : this._streamingSource.disconnect(), this.isPlaying = !1, this.isPaused = !0) : b.audioEngine?.audioContext && this._soundSource && (this._soundSource.onended = () => {
    }, this._soundSource.stop(), this.isPlaying = !1, this.isPaused = !0, this._currentTime += b.audioEngine.audioContext.currentTime - this._startTime));
  }
  /**
   * Sets a dedicated volume for this sounds
   * @param newVolume Define the new volume of the sound
   * @param time Define time for gradual change to new volume
   */
  setVolume(e, t) {
    b.audioEngine?.canUseWebAudio && this._soundGain && (t && b.audioEngine.audioContext ? (this._soundGain.gain.cancelScheduledValues(b.audioEngine.audioContext.currentTime), this._soundGain.gain.setValueAtTime(this._soundGain.gain.value, b.audioEngine.audioContext.currentTime), this._soundGain.gain.linearRampToValueAtTime(e, b.audioEngine.audioContext.currentTime + t)) : this._soundGain.gain.value = e), this._volume = e;
  }
  /**
   * Set the sound play back rate
   * @param newPlaybackRate Define the playback rate the sound should be played at
   */
  setPlaybackRate(e) {
    this._playbackRate = e, this.isPlaying && (this._streaming && this._htmlAudioElement ? this._htmlAudioElement.playbackRate = this._playbackRate : this._soundSource && (this._soundSource.playbackRate.value = this._playbackRate));
  }
  /**
   * Gets the sound play back rate.
   * @returns the  play back rate of the sound
   */
  getPlaybackRate() {
    return this._playbackRate;
  }
  /**
   * Gets the volume of the sound.
   * @returns the volume of the sound
   */
  getVolume() {
    return this._volume;
  }
  /**
   * Attach the sound to a dedicated mesh
   * @param transformNode The transform node to connect the sound with
   * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#attaching-a-sound-to-a-mesh
   */
  attachToMesh(e) {
    this._connectedTransformNode && this._registerFunc && (this._connectedTransformNode.unregisterAfterWorldMatrixUpdate(this._registerFunc), this._registerFunc = null), this._connectedTransformNode = e, this._spatialSound || (this._spatialSound = !0, this._createSpatialParameters(), this.isPlaying && this.loop && (this.stop(), this.play(0, this._offset, this._length))), this._onRegisterAfterWorldMatrixUpdate(this._connectedTransformNode), this._registerFunc = (t) => this._onRegisterAfterWorldMatrixUpdate(t), this._connectedTransformNode.registerAfterWorldMatrixUpdate(this._registerFunc);
  }
  /**
   * Detach the sound from the previously attached mesh
   * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#attaching-a-sound-to-a-mesh
   */
  detachFromMesh() {
    this._connectedTransformNode && this._registerFunc && (this._connectedTransformNode.unregisterAfterWorldMatrixUpdate(this._registerFunc), this._registerFunc = null, this._connectedTransformNode = null);
  }
  _onRegisterAfterWorldMatrixUpdate(e) {
    if (!e.getBoundingInfo)
      this.setPosition(e.absolutePosition);
    else {
      const s = e.getBoundingInfo();
      this.setPosition(s.boundingSphere.centerWorld);
    }
    b.audioEngine?.canUseWebAudio && this._isDirectional && this.isPlaying && this._updateDirection();
  }
  /**
   * Clone the current sound in the scene.
   * @returns the new sound clone
   */
  clone() {
    if (this._streaming)
      return null;
    {
      const e = () => {
        this._isReadyToPlay ? (s._audioBuffer = this.getAudioBuffer(), s._isReadyToPlay = !0, s.autoplay && s.play(0, this._offset, this._length)) : setTimeout(e, 300);
      }, t = {
        autoplay: this.autoplay,
        loop: this.loop,
        volume: this._volume,
        spatialSound: this._spatialSound,
        maxDistance: this.maxDistance,
        useCustomAttenuation: this.useCustomAttenuation,
        rolloffFactor: this.rolloffFactor,
        refDistance: this.refDistance,
        distanceModel: this.distanceModel
      }, s = new Ae(this.name + "_cloned", new ArrayBuffer(0), this._scene, null, t);
      return this.useCustomAttenuation && s.setAttenuationFunction(this._customAttenuationFunction), s.setPosition(this._position), s.setPlaybackRate(this._playbackRate), e(), s;
    }
  }
  /**
   * Gets the current underlying audio buffer containing the data
   * @returns the audio buffer
   */
  getAudioBuffer() {
    return this._audioBuffer;
  }
  /**
   * Gets the WebAudio AudioBufferSourceNode, lets you keep track of and stop instances of this Sound.
   * @returns the source node
   */
  getSoundSource() {
    return this._soundSource;
  }
  /**
   * Gets the WebAudio GainNode, gives you precise control over the gain of instances of this Sound.
   * @returns the gain node
   */
  getSoundGain() {
    return this._soundGain;
  }
  /**
   * Serializes the Sound in a JSON representation
   * @returns the JSON representation of the sound
   */
  serialize() {
    const e = {
      name: this.name,
      url: this._url,
      autoplay: this.autoplay,
      loop: this.loop,
      volume: this._volume,
      spatialSound: this._spatialSound,
      maxDistance: this.maxDistance,
      rolloffFactor: this.rolloffFactor,
      refDistance: this.refDistance,
      distanceModel: this.distanceModel,
      playbackRate: this._playbackRate,
      panningModel: this._panningModel,
      soundTrackId: this.soundTrackId,
      metadata: this.metadata
    };
    return this._spatialSound && (this._connectedTransformNode && (e.connectedMeshId = this._connectedTransformNode.id), e.position = this._position.asArray(), e.refDistance = this.refDistance, e.distanceModel = this.distanceModel, e.isDirectional = this._isDirectional, e.localDirectionToMesh = this._localDirection.asArray(), e.coneInnerAngle = this._coneInnerAngle, e.coneOuterAngle = this._coneOuterAngle, e.coneOuterGain = this._coneOuterGain), e;
  }
  /**
   * Parse a JSON representation of a sound to instantiate in a given scene
   * @param parsedSound Define the JSON representation of the sound (usually coming from the serialize method)
   * @param scene Define the scene the new parsed sound should be created in
   * @param rootUrl Define the rooturl of the load in case we need to fetch relative dependencies
   * @param sourceSound Define a sound place holder if do not need to instantiate a new one
   * @returns the newly parsed sound
   */
  static Parse(e, t, s, n) {
    const i = e.name;
    let r;
    e.url ? r = s + e.url : r = s + i;
    const o = {
      autoplay: e.autoplay,
      loop: e.loop,
      volume: e.volume,
      spatialSound: e.spatialSound,
      maxDistance: e.maxDistance,
      rolloffFactor: e.rolloffFactor,
      refDistance: e.refDistance,
      distanceModel: e.distanceModel,
      playbackRate: e.playbackRate
    };
    let l;
    if (!n)
      l = new Ae(i, r, t, () => {
        t.removePendingData(l);
      }, o), t.addPendingData(l);
    else {
      const h = () => {
        n._isReadyToPlay ? (l._audioBuffer = n.getAudioBuffer(), l._isReadyToPlay = !0, l.autoplay && l.play(0, l._offset, l._length)) : setTimeout(h, 300);
      };
      l = new Ae(i, new ArrayBuffer(0), t, null, o), h();
    }
    if (e.position) {
      const h = N.FromArray(e.position);
      l.setPosition(h);
    }
    if (e.isDirectional && (l.setDirectionalCone(e.coneInnerAngle || 360, e.coneOuterAngle || 360, e.coneOuterGain || 0), e.localDirectionToMesh)) {
      const h = N.FromArray(e.localDirectionToMesh);
      l.setLocalDirectionToMesh(h);
    }
    if (e.connectedMeshId) {
      const h = t.getMeshById(e.connectedMeshId);
      h && l.attachToMesh(h);
    }
    return e.metadata && (l.metadata = e.metadata), l;
  }
  _setOffset(e) {
    this._offset !== e && (this.isPaused && (this.stop(), this.isPaused = !1), this._offset = e);
  }
  _clearTimeoutsAndObservers() {
    this._tryToPlayTimeout && (clearTimeout(this._tryToPlayTimeout), this._tryToPlayTimeout = null), this._audioUnlockedObserver && (b.audioEngine?.onAudioUnlockedObservable.remove(this._audioUnlockedObserver), this._audioUnlockedObserver = null);
  }
}
Ae._SceneComponentInitialization = (a) => {
  throw $i("AudioSceneComponent");
};
class gr {
  /**
   * Creates a new WeightedSound from the list of sounds given.
   * @param loop When true a Sound will be selected and played when the current playing Sound completes.
   * @param sounds Array of Sounds that will be selected from.
   * @param weights Array of number values for selection weights; length must equal sounds, values will be normalized to 1
   */
  constructor(e, t, s) {
    if (this.loop = !1, this._coneInnerAngle = 360, this._coneOuterAngle = 360, this._volume = 1, this.isPlaying = !1, this.isPaused = !1, this._sounds = [], this._weights = [], t.length !== s.length)
      throw new Error("Sounds length does not equal weights length");
    this.loop = e, this._weights = s;
    let n = 0;
    for (const r of s)
      n += r;
    const i = n > 0 ? 1 / n : 0;
    for (let r = 0; r < this._weights.length; r++)
      this._weights[r] *= i;
    this._sounds = t;
    for (const r of this._sounds)
      r.onEndedObservable.add(() => {
        this._onended();
      });
  }
  /**
   * The size of cone in degrees for a directional sound in which there will be no attenuation.
   */
  get directionalConeInnerAngle() {
    return this._coneInnerAngle;
  }
  /**
   * The size of cone in degrees for a directional sound in which there will be no attenuation.
   */
  set directionalConeInnerAngle(e) {
    if (e !== this._coneInnerAngle) {
      if (this._coneOuterAngle < e) {
        v.Error("directionalConeInnerAngle: outer angle of the cone must be superior or equal to the inner angle.");
        return;
      }
      this._coneInnerAngle = e;
      for (const t of this._sounds)
        t.directionalConeInnerAngle = e;
    }
  }
  /**
   * Size of cone in degrees for a directional sound outside of which there will be no sound.
   * Listener angles between innerAngle and outerAngle will falloff linearly.
   */
  get directionalConeOuterAngle() {
    return this._coneOuterAngle;
  }
  /**
   * Size of cone in degrees for a directional sound outside of which there will be no sound.
   * Listener angles between innerAngle and outerAngle will falloff linearly.
   */
  set directionalConeOuterAngle(e) {
    if (e !== this._coneOuterAngle) {
      if (e < this._coneInnerAngle) {
        v.Error("directionalConeOuterAngle: outer angle of the cone must be superior or equal to the inner angle.");
        return;
      }
      this._coneOuterAngle = e;
      for (const t of this._sounds)
        t.directionalConeOuterAngle = e;
    }
  }
  /**
   * Playback volume.
   */
  get volume() {
    return this._volume;
  }
  /**
   * Playback volume.
   */
  set volume(e) {
    if (e !== this._volume)
      for (const t of this._sounds)
        t.setVolume(e);
  }
  _onended() {
    this._currentIndex !== void 0 && (this._sounds[this._currentIndex].autoplay = !1), this.loop && this.isPlaying ? this.play() : this.isPlaying = !1;
  }
  /**
   * Suspend playback
   */
  pause() {
    this.isPaused = !0, this._currentIndex !== void 0 && this._sounds[this._currentIndex].pause();
  }
  /**
   * Stop playback
   */
  stop() {
    this.isPlaying = !1, this._currentIndex !== void 0 && this._sounds[this._currentIndex].stop();
  }
  /**
   * Start playback.
   * @param startOffset Position the clip head at a specific time in seconds.
   */
  play(e) {
    if (!this.isPaused) {
      this.stop();
      const s = Math.random();
      let n = 0;
      for (let i = 0; i < this._weights.length; i++)
        if (n += this._weights[i], s <= n) {
          this._currentIndex = i;
          break;
        }
    }
    const t = this._sounds[this._currentIndex];
    t.isReady() ? t.play(0, this.isPaused ? void 0 : e) : t.autoplay = !0, this.isPlaying = !0, this.isPaused = !1;
  }
}
const ln = "MSFT_audio_emitter";
class _i {
  /**
   * @internal
   */
  constructor(e) {
    this.name = ln, this._loader = e, this.enabled = this._loader.isExtensionUsed(ln);
  }
  /** @internal */
  dispose() {
    this._loader = null, this._clips = null, this._emitters = null;
  }
  /** @internal */
  onLoading() {
    const e = this._loader.gltf.extensions;
    if (e && e[this.name]) {
      const t = e[this.name];
      this._clips = t.clips, this._emitters = t.emitters, A.Assign(this._clips), A.Assign(this._emitters);
    }
  }
  /**
   * @internal
   */
  loadSceneAsync(e, t) {
    return _.LoadExtensionAsync(e, t, this.name, (s, n) => {
      const i = new Array();
      i.push(this._loader.loadSceneAsync(e, t));
      for (const r of n.emitters) {
        const o = A.Get(`${s}/emitters`, this._emitters, r);
        if (o.refDistance != null || o.maxDistance != null || o.rolloffFactor != null || o.distanceModel != null || o.innerAngle != null || o.outerAngle != null)
          throw new Error(`${s}: Direction or Distance properties are not allowed on emitters attached to a scene`);
        i.push(this._loadEmitterAsync(`${s}/emitters/${o.index}`, o));
      }
      return Promise.all(i).then(() => {
      });
    });
  }
  /**
   * @internal
   */
  loadNodeAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      const r = new Array();
      return this._loader.loadNodeAsync(n, t, (o) => {
        for (const l of i.emitters) {
          const h = A.Get(`${n}/emitters`, this._emitters, l);
          r.push(this._loadEmitterAsync(`${n}/emitters/${h.index}`, h).then(() => {
            for (const u of h._babylonSounds)
              u.attachToMesh(o), (h.innerAngle != null || h.outerAngle != null) && (u.setLocalDirectionToMesh(N.Forward()), u.setDirectionalCone(2 * $.ToDegrees(h.innerAngle == null ? Math.PI : h.innerAngle), 2 * $.ToDegrees(h.outerAngle == null ? Math.PI : h.outerAngle), 0));
          }));
        }
        s(o);
      }).then((o) => Promise.all(r).then(() => o));
    });
  }
  /**
   * @internal
   */
  loadAnimationAsync(e, t) {
    return _.LoadExtensionAsync(e, t, this.name, (s, n) => this._loader.loadAnimationAsync(e, t).then((i) => {
      const r = new Array();
      A.Assign(n.events);
      for (const o of n.events)
        r.push(this._loadAnimationEventAsync(`${s}/events/${o.index}`, e, t, o, i));
      return Promise.all(r).then(() => i);
    }));
  }
  _loadClipAsync(e, t) {
    if (t._objectURL)
      return t._objectURL;
    let s;
    if (t.uri)
      s = this._loader.loadUriAsync(e, t, t.uri);
    else {
      const n = A.Get(`${e}/bufferView`, this._loader.gltf.bufferViews, t.bufferView);
      s = this._loader.loadBufferViewAsync(`/bufferViews/${n.index}`, n);
    }
    return t._objectURL = s.then((n) => URL.createObjectURL(new Blob([n], { type: t.mimeType }))), t._objectURL;
  }
  _loadEmitterAsync(e, t) {
    if (t._babylonSounds = t._babylonSounds || [], !t._babylonData) {
      const s = new Array(), n = t.name || `emitter${t.index}`, i = {
        loop: !1,
        autoplay: !1,
        volume: t.volume == null ? 1 : t.volume
      };
      for (let o = 0; o < t.clips.length; o++) {
        const l = `/extensions/${this.name}/clips`, h = A.Get(l, this._clips, t.clips[o].clip);
        s.push(this._loadClipAsync(`${l}/${t.clips[o].clip}`, h).then((u) => {
          const c = t._babylonSounds[o] = new Ae(n, u, this._loader.babylonScene, null, i);
          c.refDistance = t.refDistance || 1, c.maxDistance = t.maxDistance || 256, c.rolloffFactor = t.rolloffFactor || 1, c.distanceModel = t.distanceModel || "exponential";
        }));
      }
      const r = Promise.all(s).then(() => {
        const o = t.clips.map((h) => h.weight || 1), l = new gr(t.loop || !1, t._babylonSounds, o);
        t.innerAngle && (l.directionalConeInnerAngle = 2 * $.ToDegrees(t.innerAngle)), t.outerAngle && (l.directionalConeOuterAngle = 2 * $.ToDegrees(t.outerAngle)), t.volume && (l.volume = t.volume), t._babylonData.sound = l;
      });
      t._babylonData = {
        loaded: r
      };
    }
    return t._babylonData.loaded;
  }
  _getEventAction(e, t, s, n, i) {
    switch (s) {
      case "play":
        return (r) => {
          const o = (i || 0) + (r - n);
          t.play(o);
        };
      case "stop":
        return () => {
          t.stop();
        };
      case "pause":
        return () => {
          t.pause();
        };
      default:
        throw new Error(`${e}: Unsupported action ${s}`);
    }
  }
  _loadAnimationEventAsync(e, t, s, n, i) {
    if (i.targetedAnimations.length == 0)
      return Promise.resolve();
    const r = i.targetedAnimations[0], o = n.emitter, l = A.Get(`/extensions/${this.name}/emitters`, this._emitters, o);
    return this._loadEmitterAsync(e, l).then(() => {
      const h = l._babylonData.sound;
      if (h) {
        const u = new bn(n.time, this._getEventAction(e, h, n.action, n.time, n.startOffset));
        r.animation.addEvent(u), i.onAnimationGroupEndObservable.add(() => {
          h.stop();
        }), i.onAnimationGroupPauseObservable.add(() => {
          h.pause();
        });
      }
    });
  }
}
_.RegisterExtension(ln, (a) => new _i(a));
const hn = "MSFT_lod";
class pi {
  /**
   * @internal
   */
  constructor(e) {
    this.name = hn, this.order = 100, this.maxLODsToLoad = 10, this.onNodeLODsLoadedObservable = new B(), this.onMaterialLODsLoadedObservable = new B(), this._bufferLODs = new Array(), this._nodeIndexLOD = null, this._nodeSignalLODs = new Array(), this._nodePromiseLODs = new Array(), this._nodeBufferLODs = new Array(), this._materialIndexLOD = null, this._materialSignalLODs = new Array(), this._materialPromiseLODs = new Array(), this._materialBufferLODs = new Array(), this._loader = e, this.enabled = this._loader.isExtensionUsed(hn);
  }
  /** @internal */
  dispose() {
    this._loader = null, this._nodeIndexLOD = null, this._nodeSignalLODs.length = 0, this._nodePromiseLODs.length = 0, this._nodeBufferLODs.length = 0, this._materialIndexLOD = null, this._materialSignalLODs.length = 0, this._materialPromiseLODs.length = 0, this._materialBufferLODs.length = 0, this.onMaterialLODsLoadedObservable.clear(), this.onNodeLODsLoadedObservable.clear();
  }
  /** @internal */
  onReady() {
    for (let e = 0; e < this._nodePromiseLODs.length; e++) {
      const t = Promise.all(this._nodePromiseLODs[e]).then(() => {
        e !== 0 && (this._loader.endPerformanceCounter(`Node LOD ${e}`), this._loader.log(`Loaded node LOD ${e}`)), this.onNodeLODsLoadedObservable.notifyObservers(e), e !== this._nodePromiseLODs.length - 1 && (this._loader.startPerformanceCounter(`Node LOD ${e + 1}`), this._loadBufferLOD(this._nodeBufferLODs, e + 1), this._nodeSignalLODs[e] && this._nodeSignalLODs[e].resolve());
      });
      this._loader._completePromises.push(t);
    }
    for (let e = 0; e < this._materialPromiseLODs.length; e++) {
      const t = Promise.all(this._materialPromiseLODs[e]).then(() => {
        e !== 0 && (this._loader.endPerformanceCounter(`Material LOD ${e}`), this._loader.log(`Loaded material LOD ${e}`)), this.onMaterialLODsLoadedObservable.notifyObservers(e), e !== this._materialPromiseLODs.length - 1 && (this._loader.startPerformanceCounter(`Material LOD ${e + 1}`), this._loadBufferLOD(this._materialBufferLODs, e + 1), this._materialSignalLODs[e] && this._materialSignalLODs[e].resolve());
      });
      this._loader._completePromises.push(t);
    }
  }
  /**
   * @internal
   */
  loadSceneAsync(e, t) {
    const s = this._loader.loadSceneAsync(e, t);
    return this._loadBufferLOD(this._bufferLODs, 0), s;
  }
  /**
   * @internal
   */
  loadNodeAsync(e, t, s) {
    return _.LoadExtensionAsync(e, t, this.name, (n, i) => {
      let r;
      const o = this._getLODs(n, t, this._loader.gltf.nodes, i.ids);
      this._loader.logOpen(`${n}`);
      for (let l = 0; l < o.length; l++) {
        const h = o[l];
        l !== 0 && (this._nodeIndexLOD = l, this._nodeSignalLODs[l] = this._nodeSignalLODs[l] || new ss());
        const u = (d) => {
          s(d), d.setEnabled(!1);
        }, c = this._loader.loadNodeAsync(`/nodes/${h.index}`, h, u).then((d) => {
          if (l !== 0) {
            const y = o[l - 1];
            y._babylonTransformNode && (this._disposeTransformNode(y._babylonTransformNode), delete y._babylonTransformNode);
          }
          return d.setEnabled(!0), d;
        });
        this._nodePromiseLODs[l] = this._nodePromiseLODs[l] || [], l === 0 ? r = c : (this._nodeIndexLOD = null, this._nodePromiseLODs[l].push(c));
      }
      return this._loader.logClose(), r;
    });
  }
  /**
   * @internal
   */
  _loadMaterialAsync(e, t, s, n, i) {
    return this._nodeIndexLOD ? null : _.LoadExtensionAsync(e, t, this.name, (r, o) => {
      let l;
      const h = this._getLODs(r, t, this._loader.gltf.materials, o.ids);
      this._loader.logOpen(`${r}`);
      for (let u = 0; u < h.length; u++) {
        const c = h[u];
        u !== 0 && (this._materialIndexLOD = u);
        const d = this._loader._loadMaterialAsync(`/materials/${c.index}`, c, s, n, (y) => {
          u === 0 && i(y);
        }).then((y) => {
          if (u !== 0) {
            i(y);
            const T = h[u - 1]._data;
            T[n] && (this._disposeMaterials([T[n].babylonMaterial]), delete T[n]);
          }
          return y;
        });
        this._materialPromiseLODs[u] = this._materialPromiseLODs[u] || [], u === 0 ? l = d : (this._materialIndexLOD = null, this._materialPromiseLODs[u].push(d));
      }
      return this._loader.logClose(), l;
    });
  }
  /**
   * @internal
   */
  _loadUriAsync(e, t, s) {
    if (this._nodeIndexLOD !== null) {
      this._loader.log("deferred");
      const n = this._nodeIndexLOD - 1;
      return this._nodeSignalLODs[n] = this._nodeSignalLODs[n] || new ss(), this._nodeSignalLODs[this._nodeIndexLOD - 1].promise.then(() => this._loader.loadUriAsync(e, t, s));
    } else if (this._materialIndexLOD !== null) {
      this._loader.log("deferred");
      const n = this._materialIndexLOD - 1;
      return this._materialSignalLODs[n] = this._materialSignalLODs[n] || new ss(), this._materialSignalLODs[n].promise.then(() => this._loader.loadUriAsync(e, t, s));
    }
    return null;
  }
  /**
   * @internal
   */
  loadBufferAsync(e, t, s, n) {
    if (this._loader.parent.useRangeRequests && !t.uri) {
      if (!this._loader.bin)
        throw new Error(`${e}: Uri is missing or the binary glTF is missing its binary chunk`);
      const i = (r, o) => {
        const l = s, h = l + n - 1;
        let u = r[o];
        return u ? (u.start = Math.min(u.start, l), u.end = Math.max(u.end, h)) : (u = { start: l, end: h, loaded: new ss() }, r[o] = u), u.loaded.promise.then((c) => new Uint8Array(c.buffer, c.byteOffset + s - u.start, n));
      };
      return this._loader.log("deferred"), this._nodeIndexLOD !== null ? i(this._nodeBufferLODs, this._nodeIndexLOD) : this._materialIndexLOD !== null ? i(this._materialBufferLODs, this._materialIndexLOD) : i(this._bufferLODs, 0);
    }
    return null;
  }
  _loadBufferLOD(e, t) {
    const s = e[t];
    s && (this._loader.log(`Loading buffer range [${s.start}-${s.end}]`), this._loader.bin.readAsync(s.start, s.end - s.start + 1).then((n) => {
      s.loaded.resolve(n);
    }, (n) => {
      s.loaded.reject(n);
    }));
  }
  /**
   * @returns an array of LOD properties from lowest to highest.
   * @param context
   * @param property
   * @param array
   * @param ids
   */
  _getLODs(e, t, s, n) {
    if (this.maxLODsToLoad <= 0)
      throw new Error("maxLODsToLoad must be greater than zero");
    const i = [];
    for (let r = n.length - 1; r >= 0; r--)
      if (i.push(A.Get(`${e}/ids/${n[r]}`, s, n[r])), i.length === this.maxLODsToLoad)
        return i;
    return i.push(t), i;
  }
  _disposeTransformNode(e) {
    const t = [], s = e.material;
    s && t.push(s);
    for (const i of e.getChildMeshes())
      i.material && t.push(i.material);
    e.dispose();
    const n = t.filter((i) => this._loader.babylonScene.meshes.every((r) => r.material != i));
    this._disposeMaterials(n);
  }
  _disposeMaterials(e) {
    const t = {};
    for (const s of e) {
      for (const n of s.getActiveTextures())
        t[n.uniqueId] = n;
      s.dispose();
    }
    for (const s in t)
      for (const n of this._loader.babylonScene.materials)
        n.hasTexture(t[s]) && delete t[s];
    for (const s in t)
      t[s].dispose();
  }
}
_.RegisterExtension(hn, (a) => new pi(a));
const un = "MSFT_minecraftMesh";
class gi {
  /** @internal */
  constructor(e) {
    this.name = un, this._loader = e, this.enabled = this._loader.isExtensionUsed(un);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /** @internal */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtraAsync(e, t, this.name, (n, i) => {
      if (i) {
        if (!(s instanceof F))
          throw new Error(`${n}: Material type not supported`);
        const r = this._loader.loadMaterialPropertiesAsync(e, t, s);
        return s.needAlphaBlending() && (s.forceDepthWrite = !0, s.separateCullingPass = !0), s.backFaceCulling = s.forceDepthWrite, s.twoSidedLighting = !0, r;
      }
      return null;
    });
  }
}
_.RegisterExtension(un, (a) => new gi(a));
const cn = "MSFT_sRGBFactors";
class yi {
  /** @internal */
  constructor(e) {
    this.name = cn, this._loader = e, this.enabled = this._loader.isExtensionUsed(cn);
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /** @internal */
  loadMaterialPropertiesAsync(e, t, s) {
    return _.LoadExtraAsync(e, t, this.name, (n, i) => {
      if (i) {
        if (!(s instanceof F))
          throw new Error(`${n}: Material type not supported`);
        const r = this._loader.loadMaterialPropertiesAsync(e, t, s), o = s.getScene().getEngine().useExactSrgbConversions;
        return s.albedoTexture || s.albedoColor.toLinearSpaceToRef(s.albedoColor, o), s.reflectivityTexture || s.reflectivityColor.toLinearSpaceToRef(s.reflectivityColor, o), r;
      }
      return null;
    });
  }
}
_.RegisterExtension(cn, (a) => new yi(a));
var te;
(function(a) {
  a[a.Input = 0] = "Input", a[a.Output = 1] = "Output";
})(te || (te = {}));
class dn {
  constructor(e, t, s) {
    this._ownerBlock = s, this._connectedPoint = [], this.uniqueId = me(), this.connectedPointIds = [], this.name = e, this._connectionType = t;
  }
  /**
   * The type of the connection
   */
  get connectionType() {
    return this._connectionType;
  }
  /**
   * @internal
   * Override this to indicate if a point can connect to more than one point.
   */
  _isSingularConnection() {
    return !0;
  }
  /**
   * Returns if a point is connected to any other point.
   * @returns boolean indicating if the point is connected.
   */
  isConnected() {
    return this._connectedPoint.length > 0;
  }
  /**
   * Connects two connections together.
   * @param point the connection to connect to.
   */
  connectTo(e) {
    if (this._connectionType === e._connectionType)
      throw new Error(`Cannot connect two points of type ${this.connectionType}`);
    if (this._isSingularConnection() && this._connectedPoint.length > 0 || e._isSingularConnection() && e._connectedPoint.length > 0)
      throw new Error("Max number of connections for point reached");
    this._connectedPoint.push(e), e._connectedPoint.push(this);
  }
  /**
   * Saves the connection to a JSON object.
   * @param serializationObject the object to serialize to.
   */
  serialize(e = {}) {
    e.uniqueId = this.uniqueId, e.name = this.name, e._connectionType = this._connectionType, e.connectedPointIds = [], e.className = this.getClassName();
    for (const t of this._connectedPoint)
      e.connectedPointIds.push(t.uniqueId);
  }
  /**
   * @returns class name of the connection.
   */
  getClassName() {
    return "FGConnection";
  }
  /**
   * Deserialize from a object into this
   * @param serializationObject the object to deserialize from.
   */
  deserialize(e) {
    this.uniqueId = e.uniqueId, this.name = e.name, this._connectionType = e._connectionType, this.connectedPointIds = e.connectedPointIds;
  }
  /**
   * Parses a connection from an object
   * @param serializationObject the object to parse from.
   * @param ownerBlock the block that owns the connection.
   * @returns the parsed connection.
   */
  static Parse(e = {}, t) {
    const s = $.Instantiate(e.className), n = new s(e.name, e._connectionType, t);
    return n.deserialize(e), n;
  }
}
class D {
  constructor(e) {
    this.value = this._toInt(e);
  }
  /**
   * Converts a float to an integer.
   * @param n the float to convert
   * @returns the result of n | 0 - converting it to a int
   */
  _toInt(e) {
    return e | 0;
  }
  /**
   * Adds two integers together.
   * @param other the other integer to add
   * @returns a FlowGraphInteger with the result of the addition
   */
  add(e) {
    return new D(this.value + e.value);
  }
  /**
   * Subtracts two integers.
   * @param other the other integer to subtract
   * @returns a FlowGraphInteger with the result of the subtraction
   */
  subtract(e) {
    return new D(this.value - e.value);
  }
  /**
   * Multiplies two integers.
   * @param other the other integer to multiply
   * @returns a FlowGraphInteger with the result of the multiplication
   */
  multiply(e) {
    return new D(Math.imul(this.value, e.value));
  }
  /**
   * Divides two integers.
   * @param other the other integer to divide
   * @returns a FlowGraphInteger with the result of the division
   */
  divide(e) {
    return new D(this.value / e.value);
  }
  /**
   * The class name of this type.
   * @returns
   */
  getClassName() {
    return D.ClassName;
  }
  /**
   * Compares two integers for equality.
   * @param other the other integer to compare
   * @returns
   */
  equals(e) {
    return this.value === e.value;
  }
  /**
   * Parses a FlowGraphInteger from a serialization object.
   * @param serializationObject
   * @returns
   */
  static Parse(e) {
    return new D(e.value);
  }
}
D.ClassName = "FlowGraphInteger";
g("FlowGraphInteger", D);
class Q {
  constructor(e, t) {
    this.typeName = e, this.defaultValue = t;
  }
  /**
   * Serializes this rich type into a serialization object.
   * @param serializationObject the object to serialize to
   */
  serialize(e) {
    e.typeName = this.typeName, e.defaultValue = this.defaultValue;
  }
  /**
   * Parses a rich type from a serialization object.
   * @param serializationObject a serialization object
   * @returns the parsed rich type
   */
  static Parse(e) {
    return new Q(e.typeName, e.defaultValue);
  }
}
const f = new Q("any", void 0), yr = new Q("string", ""), U = new Q("number", 0), de = new Q("boolean", !1), fn = new Q("Vector2", ge.Zero()), Te = new Q("Vector3", N.Zero()), Ar = new Q("Vector4", xe.Zero()), pe = new Q("Matrix", S.Identity()), Tr = new Q("Color3", j.Black()), xr = new Q("Color4", new An(0, 0, 0, 0)), Cr = new Q("Quaternion", ie.Identity()), k = new Q("FlowGraphInteger", new D(0));
function co(a) {
  switch (typeof a) {
    case "string":
      return yr;
    case "number":
      return U;
    case "boolean":
      return de;
    case "object":
      return a instanceof ge ? fn : a instanceof N ? Te : a instanceof xe ? Ar : a instanceof j ? Tr : a instanceof An ? xr : a instanceof ie ? Cr : a instanceof D ? k : f;
    default:
      return f;
  }
}
class mn extends dn {
  /**
   * Create a new data connection point.
   * @param name
   * @param connectionType
   * @param ownerBlock
   * @param richType
   */
  constructor(e, t, s, n) {
    super(e, t, s), this.richType = n;
  }
  /**
   * An output data block can connect to multiple input data blocks,
   * but an input data block can only connect to one output data block.
   * @returns true if the connection is singular
   */
  _isSingularConnection() {
    return this.connectionType === te.Input;
  }
  /**
   * Set the value of the connection in a specific context.
   * @param value the value to set
   * @param context the context to which the value is set
   */
  setValue(e, t) {
    t._setConnectionValue(this, e);
  }
  /**
   * Connect this point to another point.
   * @param point the point to connect to.
   */
  connectTo(e) {
    super.connectTo(e);
  }
  _getValueOrDefault(e) {
    return e._hasConnectionValue(this) ? e._getConnectionValue(this) : this.richType.defaultValue;
  }
  /**
   * Gets the value of the connection in a specific context.
   * @param context the context from which the value is retrieved
   * @returns the value of the connection
   */
  getValue(e) {
    return this.connectionType === te.Output ? (e._notifyExecuteNode(this._ownerBlock), this._ownerBlock._updateOutputs(e), this._getValueOrDefault(e)) : this.isConnected() ? this._connectedPoint[0].getValue(e) : this._getValueOrDefault(e);
  }
  /**
   * @returns class name of the object.
   */
  getClassName() {
    return "FGDataConnection";
  }
  /**
   * Serializes this object.
   * @param serializationObject the object to serialize to
   */
  serialize(e = {}) {
    super.serialize(e), e.richType = {}, this.richType.serialize(e.richType);
  }
  /**
   * Parses a data connection from a serialized object.
   * @param serializationObject the object to parse from
   * @param ownerBlock the block that owns the connection
   * @returns the parsed connection
   */
  static Parse(e, t) {
    const s = dn.Parse(e, t);
    return s.richType = Q.Parse(e.richType), s;
  }
}
g("FGDataConnection", mn);
function Ai(a) {
  return a === "Mesh" || a === "AbstractMesh" || a === "GroundMesh" || a === "InstanceMesh" || a === "LinesMesh" || a === "GoldbergMesh" || a === "GreasedLineMesh" || a === "TrailMesh";
}
function Ti(a) {
  return a === "Vector2" || a === "Vector3" || a === "Vector4" || a === "Quaternion" || a === "Color3" || a === "Color4";
}
function br(a, e) {
  if (a === "Vector2")
    return ge.FromArray(e);
  if (a === "Vector3")
    return N.FromArray(e);
  if (a === "Vector4")
    return xe.FromArray(e);
  if (a === "Quaternion")
    return ie.FromArray(e);
  if (a === "Color3")
    return new j(e[0], e[1], e[2]);
  if (a === "Color4")
    return new An(e[0], e[1], e[2], e[3]);
  throw new Error(`Unknown vector class name ${a}`);
}
function xi(a, e, t) {
  const s = e?.getClassName?.() ?? "";
  Ai(s) ? t[a] = {
    name: e.name,
    className: s
  } : Ti(s) ? t[a] = {
    value: e.asArray(),
    className: s
  } : t[a] = e;
}
function vs(a, e, t) {
  const s = e[a];
  let n;
  const i = s?.className;
  return Ai(i) ? n = t.getMeshByName(s.name) : Ti(i) ? n = br(i, s.value) : i === "Matrix" ? n = S.FromArray(s.value) : i === D.ClassName ? n = D.Parse(s) : s && s.value !== void 0 ? n = s.value : n = s, n;
}
function vr(a) {
  return a === "FGSetPropertyBlock" || a === "FGGetPropertyBlock" || a === "FGPlayAnimationBlock" || a === "FGMeshPickEventBlock";
}
class ls {
  /** Constructor is protected so only subclasses can be instantiated
   * @param config optional configuration for this block
   */
  constructor(e) {
    this.config = e, this.uniqueId = me(), this.name = this.config?.name ?? this.getClassName(), this.dataInputs = [], this.dataOutputs = [];
  }
  /**
   * @internal
   */
  _updateOutputs(e) {
  }
  /**
   * Registers a data input on the block.
   * @param name the name of the input
   * @param richType the type of the input
   * @returns the created connection
   */
  registerDataInput(e, t) {
    const s = new mn(e, te.Input, this, t);
    return this.dataInputs.push(s), s;
  }
  /**
   * Registers a data output on the block.
   * @param name the name of the input
   * @param richType the type of the input
   * @returns the created connection
   */
  registerDataOutput(e, t) {
    const s = new mn(e, te.Output, this, t);
    return this.dataOutputs.push(s), s;
  }
  /**
   * Given the name of a data input, returns the connection if it exists
   * @param name the name of the input
   * @returns the connection if it exists, undefined otherwise
   */
  getDataInput(e) {
    return this.dataInputs.find((t) => t.name === e);
  }
  /**
   * Given the name of a data output, returns the connection if it exists
   * @param name the name of the output
   * @returns the connection if it exists, undefined otherwise
   */
  getDataOutput(e) {
    return this.dataOutputs.find((t) => t.name === e);
  }
  /**
   * Serializes this block
   * @param serializationObject the object to serialize to
   * @param _valueSerializeFunction a function that serializes a specific value
   */
  serialize(e = {}, t = xi) {
    e.uniqueId = this.uniqueId, e.config = {}, this.config && (e.config.name = this.config.name), e.dataInputs = [], e.dataOutputs = [], e.className = this.getClassName();
    for (const s of this.dataInputs) {
      const n = {};
      s.serialize(n), e.dataInputs.push(n);
    }
    for (const s of this.dataOutputs) {
      const n = {};
      s.serialize(n), e.dataOutputs.push(n);
    }
  }
  /**
   * Gets the class name of this block
   * @returns the class name
   */
  getClassName() {
    return "FGBlock";
  }
  /**
   * Parses a block from a serialization object
   * @param serializationObject the object to parse from
   * @param parseOptions options for parsing the block
   * @returns the parsed block
   */
  static Parse(e, t) {
    const s = $.Instantiate(e.className), n = {}, i = t.valueParseFunction ?? vs;
    if (e.config)
      for (const o in e.config)
        n[o] = i(o, e.config, t.scene);
    vr(e.className) && (n.pathConverter = t.pathConverter);
    const r = new s(n);
    r.uniqueId = e.uniqueId;
    for (let o = 0; o < e.dataInputs.length; o++) {
      const l = r.getDataInput(e.dataInputs[o].name);
      if (l)
        l.deserialize(e.dataInputs[o]);
      else
        throw new Error("Could not find data input with name " + e.dataInputs[o].name + " in block " + e.className);
    }
    for (let o = 0; o < e.dataOutputs.length; o++) {
      const l = r.getDataOutput(e.dataOutputs[o].name);
      if (l)
        l.deserialize(e.dataOutputs[o]);
      else
        throw new Error("Could not find data output with name " + e.dataOutputs[o].name + " in block " + e.className);
    }
    return r.metadata = e.metadata, r.deserialize && r.deserialize(e), r;
  }
}
class _n extends dn {
  /**
   * @internal
   * A signal input can be connected to more than one signal output,
   * but a signal output can only connect to one signal input
   * @returns true if the connection is singular
   */
  _isSingularConnection() {
    return this.connectionType === te.Output;
  }
  /**
   * @internal
   */
  _activateSignal(e) {
    this.connectionType === te.Input ? (e._notifyExecuteNode(this._ownerBlock), this._ownerBlock._execute(e, this), e._increaseExecutionId()) : this._connectedPoint[0]?._activateSignal(e);
  }
}
g("FlowGraphSignalConnection", _n);
class Ne extends ls {
  constructor(e) {
    super(e), this.signalInputs = [], this.signalOutputs = [], this.in = this._registerSignalInput("in");
  }
  _registerSignalInput(e) {
    const t = new _n(e, te.Input, this);
    return this.signalInputs.push(t), t;
  }
  _registerSignalOutput(e) {
    const t = new _n(e, te.Output, this);
    return this.signalOutputs.push(t), t;
  }
  /**
   * Given a name of a signal input, return that input if it exists
   * @param name the name of the input
   * @returns if the input exists, the input. Otherwise, undefined.
   */
  getSignalInput(e) {
    return this.signalInputs.find((t) => t.name === e);
  }
  /**
   * Given a name of a signal output, return that input if it exists
   * @param name the name of the input
   * @returns if the input exists, the input. Otherwise, undefined.
   */
  getSignalOutput(e) {
    return this.signalOutputs.find((t) => t.name === e);
  }
  /**
   * Serializes this block
   * @param serializationObject the object to serialize in
   */
  serialize(e = {}) {
    super.serialize(e), e.signalInputs = [], e.signalOutputs = [];
    for (const t of this.signalInputs) {
      const s = {};
      t.serialize(s), e.signalInputs.push(s);
    }
    for (const t of this.signalOutputs) {
      const s = {};
      t.serialize(s), e.signalOutputs.push(s);
    }
  }
  /**
   * Deserializes from an object
   * @param serializationObject the object to deserialize from
   */
  deserialize(e) {
    for (let t = 0; t < e.signalInputs.length; t++) {
      const s = this.getSignalInput(e.signalInputs[t].name);
      if (s)
        s.deserialize(e.signalInputs[t]);
      else
        throw new Error("Could not find signal input with name " + e.signalInputs[t].name + " in block " + e.className);
    }
    for (let t = 0; t < e.signalOutputs.length; t++) {
      const s = this.getSignalOutput(e.signalOutputs[t].name);
      if (s)
        s.deserialize(e.signalOutputs[t]);
      else
        throw new Error("Could not find signal output with name " + e.signalOutputs[t].name + " in block " + e.className);
    }
  }
  /**
   * @returns the class name
   */
  getClassName() {
    return "FGExecutionBlock";
  }
}
class Ci extends Ne {
  constructor(e) {
    super(e), this.out = this._registerSignalOutput("out"), this.done = this._registerSignalOutput("done");
  }
  /**
   * @internal
   * @param context
   */
  _startPendingTasks(e) {
    this._preparePendingTasks(e), e._addPendingBlock(this);
  }
}
class hs extends Ci {
  /**
   * @internal
   */
  _execute(e) {
    e._notifyExecuteNode(this), this.out._activateSignal(e);
  }
}
class pn {
  constructor(e) {
    this.uniqueId = me(), this._userVariables = {}, this._executionVariables = {}, this._connectionValues = {}, this._pendingBlocks = [], this._executionId = 0, this.onNodeExecutedObservable = new B(), this._configuration = e;
  }
  /**
   * Check if a user-defined variable is defined.
   * @param name the name of the variable
   * @returns true if the variable is defined
   */
  hasVariable(e) {
    return e in this._userVariables;
  }
  /**
   * Set a user-defined variable.
   * @param name the name of the variable
   * @param value the value of the variable
   */
  setVariable(e, t) {
    this._userVariables[e] = t;
  }
  /**
   * Get a user-defined variable.
   * @param name the name of the variable
   * @returns the value of the variable
   */
  getVariable(e) {
    return this._userVariables[e];
  }
  /**
   * Gets all user variables map
   */
  get userVariables() {
    return this._userVariables;
  }
  _getUniqueIdPrefixedName(e, t) {
    return `${e.uniqueId}_${t}`;
  }
  /**
   * Set an internal execution variable
   * @internal
   * @param name
   * @param value
   */
  _setExecutionVariable(e, t, s) {
    this._executionVariables[this._getUniqueIdPrefixedName(e, t)] = s;
  }
  /**
   * Get an internal execution variable
   * @internal
   * @param name
   * @returns
   */
  _getExecutionVariable(e, t, s) {
    return this._hasExecutionVariable(e, t) ? this._executionVariables[this._getUniqueIdPrefixedName(e, t)] : s;
  }
  /**
   * Delete an internal execution variable
   * @internal
   * @param block
   * @param name
   */
  _deleteExecutionVariable(e, t) {
    delete this._executionVariables[this._getUniqueIdPrefixedName(e, t)];
  }
  /**
   * Check if an internal execution variable is defined
   * @internal
   * @param block
   * @param name
   * @returns
   */
  _hasExecutionVariable(e, t) {
    return this._getUniqueIdPrefixedName(e, t) in this._executionVariables;
  }
  /**
   * Check if a connection value is defined
   * @internal
   * @param connectionPoint
   * @returns
   */
  _hasConnectionValue(e) {
    return e.uniqueId in this._connectionValues;
  }
  /**
   * Set a connection value
   * @internal
   * @param connectionPoint
   * @param value
   */
  _setConnectionValue(e, t) {
    this._connectionValues[e.uniqueId] = t;
  }
  /**
   * Get a connection value
   * @internal
   * @param connectionPoint
   * @returns
   */
  _getConnectionValue(e) {
    return this._connectionValues[e.uniqueId];
  }
  /**
   * Get the configuration
   * @internal
   * @param name
   * @param value
   */
  get configuration() {
    return this._configuration;
  }
  /**
   * Add a block to the list of blocks that have pending tasks.
   * @internal
   * @param block
   */
  _addPendingBlock(e) {
    this._pendingBlocks.push(e);
  }
  /**
   * Remove a block from the list of blocks that have pending tasks.
   * @internal
   * @param block
   */
  _removePendingBlock(e) {
    const t = this._pendingBlocks.indexOf(e);
    t !== -1 && this._pendingBlocks.splice(t, 1);
  }
  /**
   * Clear all pending blocks.
   * @internal
   */
  _clearPendingBlocks() {
    for (const e of this._pendingBlocks)
      e._cancelPendingTasks(this);
    this._pendingBlocks.length = 0;
  }
  /**
   * @internal
   * Function that notifies the node executed observable
   * @param node
   */
  _notifyExecuteNode(e) {
    this.onNodeExecutedObservable.notifyObservers(e);
  }
  /**
   * @internal
   */
  _increaseExecutionId() {
    this._executionId++;
  }
  /**
   * A monotonically increasing ID for each execution.
   * Incremented for every block executed.
   */
  get executionId() {
    return this._executionId;
  }
  /**
   * Serializes a context
   * @param serializationObject the object to write the values in
   * @param valueSerializationFunction a function to serialize complex values
   */
  serialize(e = {}, t = xi) {
    e.uniqueId = this.uniqueId, e._userVariables = {};
    for (const s in this._userVariables)
      t(s, this._userVariables[s], e._userVariables);
    e._connectionValues = {};
    for (const s in this._connectionValues)
      t(s, this._connectionValues[s], e._connectionValues);
  }
  /**
   * @returns the class name of the object.
   */
  getClassName() {
    return "FGContext";
  }
  /**
   * Parses a context
   * @param serializationObject the object containing the context serialization values
   * @param options the options for parsing the context
   * @returns
   */
  static Parse(e, t) {
    const s = t.graph.createContext(), n = t.valueParseFunction ?? vs;
    s.uniqueId = e.uniqueId;
    for (const i in e._userVariables) {
      const r = n(i, e._userVariables, s._configuration.scene);
      s._userVariables[i] = r;
    }
    for (const i in e._connectionValues) {
      const r = n(i, e._connectionValues, s._configuration.scene);
      s._connectionValues[i] = r;
    }
    return s;
  }
}
Z([
  Y()
], pn.prototype, "uniqueId", void 0);
function vn(a, e) {
  return !!(a.parent && (a.parent === e || vn(a.parent, e)));
}
class Me extends hs {
  constructor(e) {
    super(e), this.config = e;
  }
  _getReferencedMesh() {
    const e = this.config.pathConverter.convert(this.config.path), t = e.info.getObject(e.object);
    if (!t || !(t instanceof xs))
      throw new Error("Mesh pick event block requires a valid mesh");
    return t;
  }
  /**
   * @internal
   */
  _preparePendingTasks(e) {
    let t = e._getExecutionVariable(this, "meshPickObserver");
    if (!t) {
      const s = this._getReferencedMesh();
      e._setExecutionVariable(this, "mesh", s), t = s.getScene().onPointerObservable.add((i) => {
        i.type === Qi.POINTERPICK && i.pickInfo?.pickedMesh && (i.pickInfo?.pickedMesh === s || vn(i.pickInfo?.pickedMesh, s)) && this._execute(e);
      });
      const n = s.onDisposeObservable.add(() => this._onDispose);
      e._setExecutionVariable(this, "meshPickObserver", t), e._setExecutionVariable(this, "meshDisposeObserver", n);
    }
  }
  _onDispose(e) {
    this._cancelPendingTasks(e), e._removePendingBlock(this);
  }
  /**
   * @internal
   */
  _cancelPendingTasks(e) {
    const t = e._getExecutionVariable(this, "mesh"), s = e._getExecutionVariable(this, "meshPickObserver"), n = e._getExecutionVariable(this, "meshDisposeObserver");
    t.getScene().onPointerObservable.remove(s), t.onDisposeObservable.remove(n), e._deleteExecutionVariable(this, "mesh"), e._deleteExecutionVariable(this, "meshPickObserver"), e._deleteExecutionVariable(this, "meshDisposeObserver");
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return Me.ClassName;
  }
  /**
   * Serializes the block to a JSON object.
   * @param serializationObject the object to serialize to.
   */
  serialize(e) {
    super.serialize(e), e.config.path = this.config.path;
  }
}
Me.ClassName = "FGMeshPickEventBlock";
g(Me.ClassName, Me);
var ye;
(function(a) {
  a[a.Stopped = 0] = "Stopped", a[a.Started = 1] = "Started";
})(ye || (ye = {}));
class Oe {
  /**
   * Construct a Flow Graph
   * @param params construction parameters. currently only the scene
   */
  constructor(e) {
    this._eventBlocks = [], this._executionContexts = [], this.state = ye.Stopped, this._scene = e.scene, this._coordinator = e.coordinator, this._sceneDisposeObserver = this._scene.onDisposeObservable.add(() => this.dispose());
  }
  /**
   * Create a context. A context represents one self contained execution for the graph, with its own variables.
   * @returns the context, where you can get and set variables
   */
  createContext() {
    const e = new pn({ scene: this._scene, coordinator: this._coordinator });
    return this._executionContexts.push(e), e;
  }
  /**
   * Returns the execution context at a given index
   * @param index the index of the context
   * @returns the execution context at that index
   */
  getContext(e) {
    return this._executionContexts[e];
  }
  /**
   * Add an event block. When the graph is started, it will start listening to events
   * from the block and execute the graph when they are triggered.
   * @param block the event block to be added
   */
  addEventBlock(e) {
    this._eventBlocks.push(e);
  }
  /**
   * Starts the flow graph. Initializes the event blocks and starts listening to events.
   */
  start() {
    if (this.state !== ye.Started) {
      this.state = ye.Started, this._executionContexts.length === 0 && this.createContext();
      for (const e of this._executionContexts) {
        const t = this._getContextualOrder();
        for (const s of t)
          s._startPendingTasks(e);
      }
    }
  }
  _getContextualOrder() {
    const e = [];
    for (const t of this._eventBlocks)
      if (t.getClassName() === Me.ClassName) {
        const s = t._getReferencedMesh();
        let n = 0;
        for (; n < e.length; n++) {
          const r = e[n]._getReferencedMesh();
          if (s && r && vn(s, r))
            break;
        }
        e.splice(n, 0, t);
      } else
        e.push(t);
    return e;
  }
  /**
   * Disposes of the flow graph. Cancels any pending tasks and removes all event listeners.
   */
  dispose() {
    if (this.state !== ye.Stopped) {
      this.state = ye.Stopped;
      for (const e of this._executionContexts)
        e._clearPendingBlocks();
      this._executionContexts.length = 0, this._eventBlocks.length = 0, this._scene.onDisposeObservable.remove(this._sceneDisposeObserver), this._sceneDisposeObserver = null;
    }
  }
  /**
   * Executes a function in all blocks of a flow graph, starting with the event blocks.
   * @param visitor the function to execute.
   */
  visitAllBlocks(e) {
    const t = [], s = /* @__PURE__ */ new Set();
    for (const n of this._eventBlocks)
      t.push(n), s.add(n.uniqueId);
    for (; t.length > 0; ) {
      const n = t.pop();
      e(n);
      for (const i of n.dataInputs)
        for (const r of i._connectedPoint)
          s.has(r._ownerBlock.uniqueId) || (t.push(r._ownerBlock), s.add(r._ownerBlock.uniqueId));
      if (n instanceof Ne)
        for (const i of n.signalOutputs)
          for (const r of i._connectedPoint)
            s.has(r._ownerBlock.uniqueId) || (t.push(r._ownerBlock), s.add(r._ownerBlock.uniqueId));
    }
  }
  /**
   * Serializes a graph
   * @param serializationObject the object to write the values in
   * @param valueSerializeFunction a function to serialize complex values
   */
  serialize(e = {}, t) {
    e.allBlocks = [], this.visitAllBlocks((s) => {
      const n = {};
      s.serialize(n), e.allBlocks.push(n);
    }), e.executionContexts = [];
    for (const s of this._executionContexts) {
      const n = {};
      s.serialize(n, t), e.executionContexts.push(n);
    }
  }
  /**
   * Given a list of blocks, find an output data connection that has a specific unique id
   * @param blocks a list of flow graph blocks
   * @param uniqueId the unique id of a connection
   * @returns the connection that has this unique id. throws an error if none was found
   */
  static GetDataOutConnectionByUniqueId(e, t) {
    for (const s of e)
      for (const n of s.dataOutputs)
        if (n.uniqueId === t)
          return n;
    throw new Error("Could not find data out connection with unique id " + t);
  }
  /**
   * Given a list of blocks, find an input signal connection that has a specific unique id
   * @param blocks a list of flow graph blocks
   * @param uniqueId the unique id of a connection
   * @returns the connection that has this unique id. throws an error if none was found
   */
  static GetSignalInConnectionByUniqueId(e, t) {
    for (const s of e)
      if (s instanceof Ne) {
        for (const n of s.signalInputs)
          if (n.uniqueId === t)
            return n;
      }
    throw new Error("Could not find signal in connection with unique id " + t);
  }
  /**
   * Parses a graph from a given serialization object
   * @param serializationObject the object where the values are written
   * @param options options for parsing the graph
   * @returns the parsed graph
   */
  static Parse(e, t) {
    const s = t.coordinator.createGraph(), n = [], i = t.valueParseFunction ?? vs;
    for (const r of e.allBlocks) {
      const o = ls.Parse(r, { scene: t.coordinator.config.scene, pathConverter: t.pathConverter, valueParseFunction: i });
      n.push(o), o instanceof hs && s.addEventBlock(o);
    }
    for (const r of n) {
      for (const o of r.dataInputs)
        for (const l of o.connectedPointIds) {
          const h = Oe.GetDataOutConnectionByUniqueId(n, l);
          o.connectTo(h);
        }
      if (r instanceof Ne)
        for (const o of r.signalOutputs)
          for (const l of o.connectedPointIds) {
            const h = Oe.GetSignalInConnectionByUniqueId(n, l);
            o.connectTo(h);
          }
    }
    for (const r of e.executionContexts)
      pn.Parse(r, { graph: s, valueParseFunction: i });
    return s;
  }
}
class Ee {
  constructor(e) {
    this.config = e, this._flowGraphs = [], this._customEventsMap = /* @__PURE__ */ new Map(), this.config.scene.onDisposeObservable.add(() => {
      this.dispose();
    }), (Ee.SceneCoordinators.get(this.config.scene) ?? []).push(this);
  }
  /**
   * Creates a new flow graph and adds it to the list of existing flow graphs
   * @returns a new flow graph
   */
  createGraph() {
    const e = new Oe({ scene: this.config.scene, coordinator: this });
    return this._flowGraphs.push(e), e;
  }
  /**
   * Removes a flow graph from the list of existing flow graphs and disposes it
   * @param graph the graph to remove
   */
  removeGraph(e) {
    const t = this._flowGraphs.indexOf(e);
    t !== -1 && (e.dispose(), this._flowGraphs.splice(t, 1));
  }
  /**
   * Starts all graphs
   */
  start() {
    this._flowGraphs.forEach((e) => e.start());
  }
  /**
   * Disposes all graphs
   */
  dispose() {
    this._flowGraphs.forEach((s) => s.dispose()), this._flowGraphs.length = 0;
    const e = Ee.SceneCoordinators.get(this.config.scene) ?? [], t = e.indexOf(this);
    t !== -1 && e.splice(t, 1);
  }
  /**
   * Serializes this coordinator to a JSON object.
   * @param serializationObject the object to serialize to
   * @param valueSerializeFunction the function to use to serialize the value
   */
  serialize(e, t) {
    e._flowGraphs = [], this._flowGraphs.forEach((s) => {
      const n = {};
      s.serialize(n, t), e._flowGraphs.push(n);
    });
  }
  /**
   * Parses a serialized coordinator.
   * @param serializedObject the object to parse
   * @param options the options to use when parsing
   * @returns the parsed coordinator
   */
  static Parse(e, t) {
    const s = t.valueParseFunction ?? vs, n = new Ee({ scene: t.scene });
    return e._flowGraphs?.forEach((i) => {
      Oe.Parse(i, { coordinator: n, valueParseFunction: s, pathConverter: t.pathConverter });
    }), n;
  }
  /**
   * Gets the list of flow graphs
   */
  get flowGraphs() {
    return this._flowGraphs;
  }
  /**
   * Get an observable that will be notified when the event with the given id is fired.
   * @param id the id of the event
   * @returns the observable for the event
   */
  getCustomEventObservable(e) {
    let t = this._customEventsMap.get(e);
    return t || (t = new B(), this._customEventsMap.set(e, t)), t;
  }
  /**
   * Notifies the observable for the given event id with the given data.
   * @param id the id of the event
   * @param data the data to send with the event
   */
  notifyCustomEvent(e, t) {
    const s = this._customEventsMap.get(e);
    s && s.notifyObservers(t);
  }
}
Ee.SceneCoordinators = /* @__PURE__ */ new Map();
class us extends hs {
  /**
   * @internal
   */
  _preparePendingTasks(e) {
    if (!e._getExecutionVariable(this, "sceneReadyObserver")) {
      const s = e.configuration.scene.onReadyObservable.add(() => {
        this._execute(e);
      });
      e._setExecutionVariable(this, "sceneReadyObserver", s);
    }
  }
  /**
   * @internal
   */
  _cancelPendingTasks(e) {
    const t = e._getExecutionVariable(this, "sceneReadyObserver");
    e.configuration.scene.onReadyObservable.remove(t), e._deleteExecutionVariable(this, "sceneReadyObserver");
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return us.ClassName;
  }
}
us.ClassName = "FGSceneReadyEventBlock";
g("FGSceneReadyEventBlock", us);
class Ie extends hs {
  /**
   * @internal
   */
  _preparePendingTasks(e) {
    if (!e._getExecutionVariable(this, "sceneBeforeRender")) {
      const s = e.configuration.scene.onBeforeRenderObservable.add(() => {
        this._execute(e);
      });
      e._setExecutionVariable(this, "sceneBeforeRender", s);
    }
  }
  /**
   * @internal
   */
  _cancelPendingTasks(e) {
    const t = e._getExecutionVariable(this, "sceneBeforeRender");
    e.configuration.scene.onBeforeRenderObservable.remove(t), e._deleteExecutionVariable(this, "sceneBeforeRender");
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return Ie.ClassName;
  }
}
Ie.ClassName = "FGSceneTickEventBlock";
g(Ie.ClassName, Ie);
class Qt extends Ne {
  constructor(e) {
    super(e), this.out = this._registerSignalOutput("out");
  }
}
class Pe extends Qt {
  constructor(e) {
    super(e), this.message = this.registerDataInput("message", f);
  }
  /**
   * @internal
   */
  _execute(e) {
    const t = this.message.getValue(e);
    v.Log(t), this.out._activateSignal(e);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return Pe.ClassName;
  }
}
Pe.ClassName = "FGConsoleLogBlock";
g(Pe.ClassName, Pe);
class cs extends Ci {
  constructor(e) {
    super(e), this.timeout = this.registerDataInput("timeout", U);
  }
  _preparePendingTasks(e) {
    const t = this.timeout.getValue(e);
    if (t !== void 0 && t >= 0) {
      const s = e._getExecutionVariable(this, "runningTimers") || [], n = e.configuration.scene, i = new er({
        timeout: t,
        contextObservable: n.onBeforeRenderObservable,
        onEnded: () => this._onEnded(i, e)
      });
      i.start(), s.push(i), e._setExecutionVariable(this, "runningTimers", s);
    }
  }
  /**
   * @internal
   */
  _execute(e) {
    this._startPendingTasks(e), this.out._activateSignal(e);
  }
  _onEnded(e, t) {
    const s = t._getExecutionVariable(this, "runningTimers") || [], n = s.indexOf(e);
    n !== -1 ? s.splice(n, 1) : $.Warn("FlowGraphTimerBlock: Timer ended but was not found in the running timers list"), t._removePendingBlock(this), this.done._activateSignal(t);
  }
  _cancelPendingTasks(e) {
    const t = e._getExecutionVariable(this, "runningTimers") || [];
    for (const s of t)
      s.dispose();
    e._deleteExecutionVariable(this, "runningTimers");
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return cs.ClassName;
  }
}
cs.ClassName = "FGTimerBlock";
g("FGTimerBlock", cs);
class ds extends Qt {
  constructor(e) {
    super(e), this.config = e;
    for (let t = 0; t < this.config.eventData.length; t++) {
      const s = this.config.eventData[t];
      this.registerDataInput(s, f);
    }
  }
  _execute(e) {
    const t = this.config.eventId, s = this.dataInputs.map((n) => n.getValue(e));
    e.configuration.coordinator.notifyCustomEvent(t, s), this.out._activateSignal(e);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return ds.ClassName;
  }
}
ds.ClassName = "FGSendCustomEventBlock";
g("FGSendCustomEventBlock", ds);
class Se extends hs {
  constructor(e) {
    super(e), this.config = e;
    for (let t = 0; t < this.config.eventData.length; t++) {
      const s = this.config.eventData[t];
      this.registerDataOutput(s, f);
    }
  }
  _preparePendingTasks(e) {
    const t = e.configuration.coordinator.getCustomEventObservable(this.config.eventId);
    this._eventObserver = t.add((s) => {
      for (let n = 0; n < s.length; n++)
        this.dataOutputs[n].setValue(s[n], e);
      this._execute(e);
    });
  }
  _cancelPendingTasks(e) {
    const t = e.configuration.coordinator.getCustomEventObservable(this.config.eventId);
    t ? t.remove(this._eventObserver) : $.Warn(`FlowGraphReceiveCustomEventBlock: Missing observable for event ${this.config.eventId}`);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return Se.ClassName;
  }
  /**
   * Serializes this block
   * @param serializationObject the object to serialize to
   */
  serialize(e) {
    super.serialize(e), e.eventId = this.config.eventId, e.eventData = this.config.eventData;
  }
}
Se.ClassName = "FGReceiveCustomEventBlock";
g(Se.ClassName, Se);
class Re extends Ne {
  constructor(e) {
    super(e), this.config = e, this.outFlows = [];
    for (let t = 0; t < this.config.numberOutputFlows; t++)
      this.outFlows.push(this._registerSignalOutput(`${t}`));
  }
  _execute(e) {
    for (let t = 0; t < this.config.numberOutputFlows; t++)
      this.outFlows[t]._activateSignal(e);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return Re.ClassName;
  }
}
Re.ClassName = "FGSequenceBlock";
g(Re.ClassName, Re);
const Ln = new RegExp(/\{(\w+)\}/g);
class bi {
  constructor(e, t) {
    this.path = e, this.ownerBlock = t, this.templatedInputs = [];
    let s = Ln.exec(e);
    for (; s; ) {
      const [, n] = s;
      this.templatedInputs.push(t.registerDataInput(n, k)), s = Ln.exec(e);
    }
  }
  getAccessor(e, t) {
    let s = this.path;
    for (const n of this.templatedInputs) {
      const i = n.getValue(t).value;
      s = s.replace(`{${n.name}}`, i.toString());
    }
    return e.convert(s);
  }
}
class Le extends ls {
  constructor(e) {
    super(e), this.config = e, this.value = this.registerDataOutput("value", f), this.templateComponent = new bi(e.path, this);
  }
  _updateOutputs(e) {
    const t = this.templateComponent.getAccessor(this.config.pathConverter, e), s = t.info.get(t.object);
    this.value.setValue(s, e);
  }
  /**
   * Gets the class name of this block
   * @returns the class name
   */
  getClassName() {
    return Le.ClassName;
  }
  /**
   * Serializes this block
   * @param serializationObject the object to serialize to
   */
  serialize(e = {}) {
    super.serialize(e), e.config.path = this.config.path;
  }
}
Le.ClassName = "FGGetPropertyBlock";
g(Le.ClassName, Le);
class fs extends Qt {
  constructor(e) {
    super(e), this.config = e, this.a = this.registerDataInput("a", f), this.templateComponent = new bi(e.path, this);
  }
  _execute(e) {
    const t = this.a.getValue(e), s = this.templateComponent.getAccessor(this.config.pathConverter, e);
    s.info.set(t, s.object), this.out._activateSignal(e);
  }
  /**
   * Serializes the block to a JSON object.
   * @param serializationObject the object to serialize to.
   */
  serialize(e = {}) {
    super.serialize(e), e.config.path = this.config.path;
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return fs.ClassName;
  }
}
fs.ClassName = "FGSetPropertyBlock";
g("FGSetPropertyBlock", fs);
const Dn = "cachedOperationValue", kn = "cachedExecutionId";
class Ns extends ls {
  constructor(e, t) {
    super(t), this.value = this.registerDataOutput("value", e);
  }
  _updateOutputs(e) {
    const t = e._getExecutionVariable(this, kn), s = e._getExecutionVariable(this, Dn);
    if (s !== void 0 && t === e.executionId)
      this.value.setValue(s, e);
    else {
      const n = this._doOperation(e);
      e._setExecutionVariable(this, Dn, n), e._setExecutionVariable(this, kn, e.executionId), this.value.setValue(n, e);
    }
  }
}
class q extends Ns {
  constructor(e, t, s, n, i, r) {
    super(s, r), this._operation = n, this._className = i, this.a = this.registerDataInput("a", e), this.b = this.registerDataInput("b", t);
  }
  /**
   * the operation performed by this block
   * @param context the graph context
   * @returns the result of the operation
   */
  _doOperation(e) {
    return this._operation(this.a.getValue(e), this.b.getValue(e));
  }
  /**
   * Gets the class name of this block
   * @returns the class name
   */
  getClassName() {
    return this._className;
  }
}
class ms extends Ns {
  constructor(e, t, s, n) {
    super(e, n), this._operation = t, this._className = s;
  }
  /**
   * the operation performed by this block
   * @param _context the graph context
   * @returns the result of the operation
   */
  _doOperation(e) {
    return this._operation();
  }
  /**
   * Gets the class name of this block
   * @returns the class name
   */
  getClassName() {
    return this._className;
  }
}
class E extends Ns {
  constructor(e, t, s, n, i) {
    super(t, i), this._operation = s, this._className = n, this.a = this.registerDataInput("a", e);
  }
  /**
   * the operation performed by this block
   * @param context the graph context
   * @returns the result of the operation
   */
  _doOperation(e) {
    return this._operation(this.a.getValue(e));
  }
  /**
   * Gets the class name of this block
   * @returns the class name
   */
  getClassName() {
    return this._className;
  }
}
class Nn extends Ns {
  constructor(e, t, s, n, i, r, o) {
    super(n, o), this._operation = i, this._className = r, this.a = this.registerDataInput("a", e), this.b = this.registerDataInput("b", t), this.c = this.registerDataInput("c", s);
  }
  /**
   * the operation performed by this block
   * @param context the graph context
   * @returns the result of the operation
   */
  _doOperation(e) {
    return this._operation(this.a.getValue(e), this.b.getValue(e), this.c.getValue(e));
  }
  /**
   * Gets the class name of this block
   * @returns the class name
   */
  getClassName() {
    return this._className;
  }
}
function W(a) {
  return a.getClassName ? a.getClassName() : "";
}
function _s(a, e) {
  return a === "Vector2" && e === "Vector2" || a === "Vector3" && e === "Vector3" || a === "Vector4" && e === "Vector4";
}
function ps(a, e) {
  return a === "Matrix" && e === "Matrix";
}
function gs(a, e) {
  return a === "FlowGraphInteger" && e === "FlowGraphInteger";
}
class De extends q {
  constructor(e) {
    super(f, f, f, (t, s) => this._polymorphicAdd(t, s), De.ClassName, e);
  }
  _polymorphicAdd(e, t) {
    const s = W(e), n = W(t);
    return _s(s, n) || ps(s, n) || gs(s, n) ? e.add(t) : e + t;
  }
}
De.ClassName = "FGAddBlock";
g(De.ClassName, De);
class ke extends q {
  constructor(e) {
    super(f, f, f, (t, s) => this._polymorphicAdd(t, s), ke.ClassName, e);
  }
  _polymorphicAdd(e, t) {
    const s = W(e), n = W(t);
    return _s(s, n) || gs(s, n) ? e.subtract(t) : ps(s, n) ? e.add(t.scale(-1)) : e - t;
  }
}
ke.ClassName = "FGSubBlock";
g(ke.ClassName, ke);
class Be extends q {
  constructor(e) {
    super(f, f, f, (t, s) => this._polymorphicMultiply(t, s), Be.ClassName, e);
  }
  _polymorphicMultiply(e, t) {
    const s = W(e), n = W(t);
    return _s(s, n) || gs(s, n) ? e.multiply(t) : ps(s, n) ? S.FromValues(e.m[0] * t.m[0], e.m[4] * t.m[4], e.m[8] * t.m[8], e.m[12] * t.m[12], e.m[1] * t.m[1], e.m[5] * t.m[5], e.m[9] * t.m[9], e.m[13] * t.m[13], e.m[2] * t.m[2], e.m[6] * t.m[6], e.m[10] * t.m[10], e.m[14] * t.m[14], e.m[3] * t.m[3], e.m[7] * t.m[7], e.m[11] * t.m[11], e.m[15] * t.m[15]) : e * t;
  }
}
Be.ClassName = "FGMultiplyBlock";
g(Be.ClassName, Be);
class Fe extends q {
  constructor(e) {
    super(f, f, f, (t, s) => this._polymorphicDivide(t, s), Fe.ClassName, e);
  }
  _polymorphicDivide(e, t) {
    const s = W(e), n = W(t);
    return _s(s, n) || gs(s, n) ? e.divide(t) : ps(s, n) ? S.FromValues(e.m[0] / t.m[0], e.m[4] / t.m[4], e.m[8] / t.m[8], e.m[12] / t.m[12], e.m[1] / t.m[1], e.m[5] / t.m[5], e.m[9] / t.m[9], e.m[13] / t.m[13], e.m[2] / t.m[2], e.m[6] / t.m[6], e.m[10] / t.m[10], e.m[14] / t.m[14], e.m[3] / t.m[3], e.m[7] / t.m[7], e.m[11] / t.m[11], e.m[15] / t.m[15]) : e / t;
  }
}
Fe.ClassName = "FGDivideBlock";
g(Fe.ClassName, Fe);
class Ve extends ms {
  constructor(e) {
    super(U, () => Math.random(), Ve.ClassName, e);
  }
}
Ve.ClassName = "FGRandomBlock";
g(Ve.ClassName, Ve);
class $e extends q {
  constructor(e) {
    super(f, f, U, (t, s) => this._polymorphicDot(t, s), $e.ClassName, e);
  }
  _polymorphicDot(e, t) {
    switch (W(e)) {
      case "Vector2":
        return ge.Dot(e, t);
      case "Vector3":
        return N.Dot(e, t);
      case "Vector4":
        return xe.Dot(e, t);
      default:
        throw new Error(`Cannot get dot product of ${e} and ${t}`);
    }
  }
}
$e.ClassName = "FGDotBlock";
g($e.ClassName, $e);
class Ge extends ms {
  constructor(e) {
    super(U, () => Math.E, Ge.ClassName, e);
  }
}
Ge.ClassName = "FGEBlock";
g(Ge.ClassName, Ge);
class Ue extends ms {
  constructor(e) {
    super(U, () => Math.PI, Ue.ClassName, e);
  }
}
Ue.ClassName = "FGPIBlock";
g(Ue.ClassName, Ue);
class qe extends ms {
  constructor(e) {
    super(U, () => Number.POSITIVE_INFINITY, qe.ClassName, e);
  }
}
qe.ClassName = "FGInfBlock";
g(qe.ClassName, qe);
class He extends ms {
  constructor(e) {
    super(U, () => Number.NaN, He.ClassName, e);
  }
}
He.ClassName = "FGNaNBlock";
g(He.ClassName, He);
function L(a, e) {
  switch (W(a)) {
    case "FlowGraphInteger":
      return new D(e(a.value));
    case "Vector2":
      return new ge(e(a.x), e(a.y));
    case "Vector3":
      return new N(e(a.x), e(a.y), e(a.z));
    case "Vector4":
      return new xe(e(a.x), e(a.y), e(a.z), e(a.w));
    case "Matrix":
      return S.FromValues(e(a.m[0]), e(a.m[4]), e(a.m[8]), e(a.m[12]), e(a.m[1]), e(a.m[5]), e(a.m[9]), e(a.m[13]), e(a.m[2]), e(a.m[6]), e(a.m[10]), e(a.m[14]), e(a.m[3]), e(a.m[7]), e(a.m[11]), e(a.m[15]));
    default:
      return e(a);
  }
}
class We extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicAbs(t), We.ClassName, e);
  }
  _polymorphicAbs(e) {
    return L(e, Math.abs);
  }
}
We.ClassName = "FGAbsBlock";
g(We.ClassName, We);
class Ke extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicSign(t), Ke.ClassName, e);
  }
  _polymorphicSign(e) {
    return L(e, Math.sign);
  }
}
Ke.ClassName = "FGSignBlock";
g(Ke.ClassName, Ke);
class je extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicTrunc(t), je.ClassName, e);
  }
  _polymorphicTrunc(e) {
    return L(e, Math.trunc);
  }
}
je.ClassName = "FGTruncBlock";
g(je.ClassName, je);
class ze extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicFloor(t), ze.ClassName, e);
  }
  _polymorphicFloor(e) {
    return L(e, Math.floor);
  }
}
ze.ClassName = "FGFloorBlock";
g(ze.ClassName, ze);
class Ze extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicCeiling(t), Ze.ClassName, e);
  }
  _polymorphicCeiling(e) {
    return L(e, Math.ceil);
  }
}
Ze.ClassName = "FGCeilBlock";
g(Ze.ClassName, Ze);
class Ye extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicFract(t), Ye.ClassName, e);
  }
  _polymorphicFract(e) {
    return L(e, (t) => t - Math.floor(t));
  }
}
Ye.ClassName = "FGFractBlock";
g(Ye.ClassName, Ye);
class Xe extends E {
  /**
   * construct a new negation block.
   * @param config optional configuration
   */
  constructor(e) {
    super(f, f, (t) => this._polymorphicNeg(t), Xe.ClassName, e);
  }
  _polymorphicNeg(e) {
    return L(e, (t) => -t);
  }
}
Xe.ClassName = "FGNegBlock";
g(Xe.ClassName, Xe);
function ys(a, e, t) {
  switch (W(a)) {
    case "FlowGraphInteger":
      return new D(t(a.value, e.value));
    case "Vector2":
      return new ge(t(a.x, e.x), t(a.y, e.y));
    case "Vector3":
      return new N(t(a.x, e.x), t(a.y, e.y), t(a.z, e.z));
    case "Vector4":
      return new xe(t(a.x, e.x), t(a.y, e.y), t(a.z, e.z), t(a.w, e.w));
    case "Matrix":
      return S.FromValues(t(a.m[0], e.m[0]), t(a.m[4], e.m[4]), t(a.m[8], e.m[8]), t(a.m[12], e.m[12]), t(a.m[1], e.m[1]), t(a.m[5], e.m[5]), t(a.m[9], e.m[9]), t(a.m[13], e.m[13]), t(a.m[2], e.m[2]), t(a.m[6], e.m[6]), t(a.m[10], e.m[10]), t(a.m[14], e.m[14]), t(a.m[3], e.m[3]), t(a.m[7], e.m[7]), t(a.m[11], e.m[11]), t(a.m[15], e.m[15]));
    default:
      return t(a, e);
  }
}
class Je extends q {
  constructor(e) {
    super(f, f, f, (t, s) => this._polymorphicRemainder(t, s), Je.ClassName, e);
  }
  _polymorphicRemainder(e, t) {
    return ys(e, t, (s, n) => s % n);
  }
}
Je.ClassName = "FGRemainderBlock";
g(Je.ClassName, Je);
class Qe extends q {
  constructor(e) {
    super(f, f, f, (t, s) => this._polymorphicMin(t, s), Qe.ClassName, e);
  }
  _polymorphicMin(e, t) {
    return ys(e, t, Math.min);
  }
}
Qe.ClassName = "FGMinBlock";
g(Qe.ClassName, Qe);
class et extends q {
  constructor(e) {
    super(f, f, f, (t, s) => this._polymorphicMax(t, s), et.ClassName, e);
  }
  _polymorphicMax(e, t) {
    return ys(e, t, Math.max);
  }
}
et.ClassName = "FGMaxBlock";
g(et.ClassName, et);
function Nr(a, e, t) {
  return Math.min(Math.max(a, Math.min(e, t)), Math.max(e, t));
}
function vi(a, e, t, s) {
  switch (W(a)) {
    case "FlowGraphInteger":
      return new D(s(a.value, e.value, t.value));
    case "Vector2":
      return new ge(s(a.x, e.x, t.x), s(a.y, e.y, t.y));
    case "Vector3":
      return new N(s(a.x, e.x, t.x), s(a.y, e.y, t.y), s(a.z, e.z, t.z));
    case "Vector4":
      return new xe(s(a.x, e.x, t.x), s(a.y, e.y, t.y), s(a.z, e.z, t.z), s(a.w, e.w, t.w));
    case "Matrix":
      return S.FromValues(s(a.m[0], e.m[0], t.m[0]), s(a.m[4], e.m[4], t.m[4]), s(a.m[8], e.m[8], t.m[8]), s(a.m[12], e.m[12], t.m[12]), s(a.m[1], e.m[1], t.m[1]), s(a.m[5], e.m[5], t.m[5]), s(a.m[9], e.m[9], t.m[9]), s(a.m[13], e.m[13], t.m[13]), s(a.m[2], e.m[2], t.m[2]), s(a.m[6], e.m[6], t.m[6]), s(a.m[10], e.m[10], t.m[10]), s(a.m[14], e.m[14], t.m[14]), s(a.m[3], e.m[3], t.m[3]), s(a.m[7], e.m[7], t.m[7]), s(a.m[11], e.m[11], t.m[11]), s(a.m[15], e.m[15], t.m[15]));
    default:
      return s(a, e, t);
  }
}
class tt extends Nn {
  constructor(e) {
    super(f, f, f, f, (t, s, n) => this._polymorphicClamp(t, s, n), tt.ClassName, e);
  }
  _polymorphicClamp(e, t, s) {
    return vi(e, t, s, Nr);
  }
}
tt.ClassName = "FGClampBlock";
g(tt.ClassName, tt);
function Er(a) {
  return Math.min(Math.max(a, 0), 1);
}
class st extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicSaturate(t), st.ClassName, e);
  }
  _polymorphicSaturate(e) {
    return L(e, Er);
  }
}
st.ClassName = "FGSaturateBlock";
g(st.ClassName, st);
class nt extends Nn {
  constructor(e) {
    super(f, f, f, f, (t, s, n) => this._polymorphicInterpolate(t, s, n), nt.ClassName, e);
  }
  _interpolate(e, t, s) {
    return (1 - s) * e + s * t;
  }
  _polymorphicInterpolate(e, t, s) {
    return vi(e, t, s, this._interpolate);
  }
}
nt.ClassName = "FGInterpolateBlock";
g(nt.ClassName, nt);
class it extends q {
  constructor(e) {
    super(f, f, de, (t, s) => this._polymorphicEq(t, s), it.ClassName, e);
  }
  _polymorphicEq(e, t) {
    const s = W(e), n = W(t);
    return _s(s, n) || ps(s, n) || gs(s, n) ? e.equals(t) : e === t;
  }
}
it.ClassName = "FGEqBlock";
g(it.ClassName, it);
function Es(a, e, t) {
  const s = W(a), n = W(e);
  if (s === n) {
    if (s === "")
      return t(a, e);
    if (s === "FlowGraphInteger")
      return t(a.value, e.value);
    throw new Error(`Cannot compare ${a} and ${e}`);
  }
  throw new Error(`${a} and ${e} are of different types.`);
}
class rt extends q {
  constructor(e) {
    super(f, f, de, (t, s) => this._polymorphicLessThan(t, s), rt.ClassName, e);
  }
  _polymorphicLessThan(e, t) {
    return Es(e, t, (s, n) => s < n);
  }
}
rt.ClassName = "FGLessThanBlock";
g(rt.ClassName, rt);
class ws extends q {
  constructor(e) {
    super(f, f, de, (t, s) => this._polymorphicLessThanOrEqual(t, s), ws.ClassName, e);
  }
  _polymorphicLessThanOrEqual(e, t) {
    return Es(e, t, (s, n) => s <= n);
  }
}
ws.ClassName = "FGLessThanOrEqualBlock";
class ot extends q {
  constructor(e) {
    super(f, f, de, (t, s) => this._polymorphicGreaterThan(t, s), ot.ClassName, e);
  }
  _polymorphicGreaterThan(e, t) {
    return Es(e, t, (s, n) => s > n);
  }
}
ot.ClassName = "FGGreaterThanBlock";
g(ot.ClassName, ot);
class at extends q {
  constructor(e) {
    super(f, f, de, (t, s) => this._polymorphicGreaterThanOrEqual(t, s), at.ClassName, e);
  }
  _polymorphicGreaterThanOrEqual(e, t) {
    return Es(e, t, (s, n) => s >= n);
  }
}
at.ClassName = "FGGreaterThanOrEqualBlock";
g(at.ClassName, at);
class lt extends E {
  constructor(e) {
    super(f, de, (t) => this._polymorphicIsNan(t), lt.ClassName, e);
  }
  _polymorphicIsNan(e) {
    const t = W(e);
    if (t === "")
      return isNaN(e);
    if (t === "FlowGraphInteger")
      return isNaN(e.value);
    throw new Error(`Cannot get NaN of ${e}`);
  }
}
lt.ClassName = "FGIsNanBlock";
g(lt.ClassName, lt);
class Ms extends E {
  constructor(e) {
    super(f, de, (t) => this._polymorphicIsInf(t), Ms.ClassName, e);
  }
  _polymorphicIsInf(e) {
    const t = W(e);
    if (t === "")
      return !isFinite(e);
    if (t === "FlowGraphInteger")
      return !isFinite(e.value);
    throw new Error(`Cannot get isInf of ${e}`);
  }
}
Ms.ClassName = "FGIsInfBlock";
class ht extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicDegToRad(t), ht.ClassName, e);
  }
  _degToRad(e) {
    return e * Math.PI / 180;
  }
  _polymorphicDegToRad(e) {
    return L(e, this._degToRad);
  }
}
ht.ClassName = "FGDegToRadBlock";
g(ht.ClassName, ht);
class ut extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicRadToDeg(t), ut.ClassName, e);
  }
  _radToDeg(e) {
    return e * 180 / Math.PI;
  }
  _polymorphicRadToDeg(e) {
    return L(e, this._radToDeg);
  }
}
ut.ClassName = "FGRadToDegBlock";
g(ut.ClassName, ut);
class ct extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicSin(t), ct.ClassName, e);
  }
  _polymorphicSin(e) {
    return L(e, Math.sin);
  }
}
ct.ClassName = "FGSinBlock";
g(ct.ClassName, ct);
class dt extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicCos(t), dt.ClassName, e);
  }
  _polymorphicCos(e) {
    return L(e, Math.cos);
  }
}
dt.ClassName = "FGCosBlock";
g(dt.ClassName, dt);
class ft extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicTan(t), ft.ClassName, e);
  }
  _polymorphicTan(e) {
    return L(e, Math.tan);
  }
}
ft.ClassName = "FGTanBlock";
g(ft.ClassName, ft);
class mt extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicAsin(t), mt.ClassName, e);
  }
  _polymorphicAsin(e) {
    return L(e, Math.asin);
  }
}
mt.ClassName = "FGAsinBlock";
g(mt.ClassName, mt);
class _t extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicAcos(t), _t.ClassName, e);
  }
  _polymorphicAcos(e) {
    return L(e, Math.acos);
  }
}
_t.ClassName = "FGAcosBlock";
g(_t.ClassName, _t);
class pt extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicAtan(t), pt.ClassName, e);
  }
  _polymorphicAtan(e) {
    return L(e, Math.atan);
  }
}
pt.ClassName = "FGAtanBlock";
g(pt.ClassName, pt);
class gt extends q {
  constructor(e) {
    super(f, f, f, (t, s) => this._polymorphicAtan2(t, s), gt.ClassName, e);
  }
  _polymorphicAtan2(e, t) {
    return ys(e, t, Math.atan2);
  }
}
gt.ClassName = "FGAtan2Block";
g(gt.ClassName, gt);
class yt extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicSinh(t), yt.ClassName, e);
  }
  _polymorphicSinh(e) {
    return L(e, Math.sinh);
  }
}
yt.ClassName = "FGSinhBlock";
g(yt.ClassName, yt);
class At extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicCosh(t), At.ClassName, e);
  }
  _polymorphicCosh(e) {
    return L(e, Math.cosh);
  }
}
At.ClassName = "FGCoshBlock";
g(At.ClassName, At);
class Tt extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicTanh(t), Tt.ClassName, e);
  }
  _polymorphicTanh(e) {
    return L(e, Math.tanh);
  }
}
Tt.ClassName = "FGTanhBlock";
g(Tt.ClassName, Tt);
class xt extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicAsinh(t), xt.ClassName, e);
  }
  _polymorphicAsinh(e) {
    return L(e, Math.asinh);
  }
}
xt.ClassName = "FGAsinhBlock";
g(xt.ClassName, xt);
class Ct extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicAcosh(t), Ct.ClassName, e);
  }
  _polymorphicAcosh(e) {
    return L(e, Math.acosh);
  }
}
Ct.ClassName = "FGAcoshBlock";
g(Ct.ClassName, Ct);
class bt extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicAtanh(t), bt.ClassName, e);
  }
  _polymorphicAtanh(e) {
    return L(e, Math.atanh);
  }
}
bt.ClassName = "FGAtanhBlock";
g(bt.ClassName, bt);
class vt extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicExp(t), vt.ClassName, e);
  }
  _polymorphicExp(e) {
    return L(e, Math.exp);
  }
}
vt.ClassName = "FGExpBlock";
g(vt.ClassName, vt);
class Nt extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicLog(t), Nt.ClassName, e);
  }
  _polymorphicLog(e) {
    return L(e, Math.log);
  }
}
Nt.ClassName = "FGLogBlock";
g(Nt.ClassName, Nt);
class Et extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicLog2(t), Et.ClassName, e);
  }
  _polymorphicLog2(e) {
    return L(e, Math.log2);
  }
}
Et.ClassName = "FGLog2Block";
g(Et.ClassName, Et);
class wt extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicLog10(t), wt.ClassName, e);
  }
  _polymorphicLog10(e) {
    return L(e, Math.log10);
  }
}
wt.ClassName = "FGLog10Block";
g(wt.ClassName, wt);
class Mt extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicSqrt(t), Mt.ClassName, e);
  }
  _polymorphicSqrt(e) {
    return L(e, Math.sqrt);
  }
}
Mt.ClassName = "FGSqrtBlock";
g(Mt.ClassName, Mt);
class Ot extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicCubeRoot(t), Ot.ClassName, e);
  }
  _polymorphicCubeRoot(e) {
    return L(e, Math.cbrt);
  }
}
Ot.ClassName = "FGCubeRootBlock";
g(Ot.ClassName, Ot);
class It extends q {
  constructor(e) {
    super(f, U, U, (t, s) => this._polymorphicPow(t, s), It.ClassName, e);
  }
  _polymorphicPow(e, t) {
    return ys(e, t, Math.pow);
  }
}
It.ClassName = "FGPowBlock";
g(It.ClassName, It);
class Pt extends E {
  constructor(e) {
    super(f, U, (t) => this._polymorphicLength(t), Pt.ClassName, e);
  }
  _polymorphicLength(e) {
    switch (W(e)) {
      case "Vector2":
      case "Vector3":
      case "Vector4":
        return e.length();
      default:
        throw new Error(`Cannot compute length of value ${e}`);
    }
  }
}
Pt.ClassName = "FGLengthBlock";
g(Pt.ClassName, Pt);
class St extends E {
  constructor(e) {
    super(f, f, (t) => this._polymorphicNormalize(t), St.ClassName, e);
  }
  _polymorphicNormalize(e) {
    switch (W(e)) {
      case "Vector2":
      case "Vector3":
      case "Vector4":
        return e.normalize();
      default:
        throw new Error(`Cannot normalize value ${e}`);
    }
  }
}
St.ClassName = "FGNormalizeBlock";
g(St.ClassName, St);
class Rt extends q {
  constructor(e) {
    super(Te, Te, Te, (t, s) => N.Cross(t, s), Rt.ClassName, e);
  }
}
Rt.ClassName = "FGCrossBlock";
g(Rt.ClassName, Rt);
class Lt extends q {
  constructor(e) {
    super(fn, U, fn, (t, s) => ge.Transform(t, S.RotationZ(s)), Lt.ClassName, e);
  }
}
Lt.ClassName = "FGRotate2DBlock";
g(Lt.ClassName, Lt);
class Dt extends Nn {
  constructor(e) {
    super(Te, Te, U, Te, (t, s, n) => N.TransformCoordinates(t, S.RotationAxis(s, n)), Dt.ClassName, e);
  }
}
Dt.ClassName = "FGRotate3DBlock";
g(Dt.ClassName, Dt);
class kt extends E {
  constructor(e) {
    super(pe, pe, (t) => S.Transpose(t), kt.ClassName, e);
  }
}
kt.ClassName = "FGTransposeBlock";
g(kt.ClassName, kt);
class Bt extends E {
  constructor(e) {
    super(pe, U, (t) => t.determinant(), Bt.ClassName, e);
  }
}
Bt.ClassName = "FGDeterminantBlock";
g(Bt.ClassName, Bt);
class Ft extends E {
  constructor(e) {
    super(pe, pe, (t) => S.Invert(t), Ft.ClassName, e);
  }
}
Ft.ClassName = "FGInvertMatrixBlock";
g(Ft.ClassName, Ft);
class Vt extends q {
  constructor(e) {
    super(pe, pe, pe, (t, s) => s.multiply(t), Vt.ClassName, e);
  }
}
Vt.ClassName = "FGMatMulBlock";
g(Vt.ClassName, Vt);
class $t extends E {
  constructor(e) {
    super(k, k, (t) => new D(~t.value), $t.ClassName, e);
  }
}
$t.ClassName = "FGBitwiseNotBlock";
g($t.ClassName, $t);
class Gt extends q {
  constructor(e) {
    super(k, k, k, (t, s) => new D(t.value & s.value), Gt.ClassName, e);
  }
}
Gt.ClassName = "FGBitwiseAndBlock";
g(Gt.ClassName, Gt);
class Ut extends q {
  constructor(e) {
    super(k, k, k, (t, s) => new D(t.value | s.value), Ut.ClassName, e);
  }
}
Ut.ClassName = "FGBitwiseOrBlock";
g(Ut.ClassName, Ut);
class qt extends q {
  constructor(e) {
    super(k, k, k, (t, s) => new D(t.value ^ s.value), qt.ClassName, e);
  }
}
qt.ClassName = "FGBitwiseXorBlock";
g(qt.ClassName, qt);
class Ht extends q {
  constructor(e) {
    super(k, k, k, (t, s) => new D(t.value << s.value), Ht.ClassName, e);
  }
}
Ht.ClassName = "FGBitwiseLeftShiftBlock";
g(Ht.ClassName, Ht);
class Wt extends q {
  constructor(e) {
    super(k, k, k, (t, s) => new D(t.value >> s.value), Wt.ClassName, e);
  }
}
Wt.ClassName = "FGBitwiseRightShiftBlock";
g(Wt.ClassName, Wt);
class Kt extends E {
  constructor(e) {
    super(k, k, (t) => new D(Math.clz32(t.value)), Kt.ClassName, e);
  }
}
Kt.ClassName = "FGCountLeadingZerosBlock";
g(Kt.ClassName, Kt);
class jt extends E {
  constructor(e) {
    super(k, k, (t) => new D(t.value ? 31 - Math.clz32(t.value & -t.value) : 32), jt.ClassName, e);
  }
}
jt.ClassName = "FGCountTrailingZerosBlock";
g(jt.ClassName, jt);
function wr(a) {
  let e = 0;
  for (; a; )
    e += a & 1, a >>= 1;
  return e;
}
class zt extends E {
  constructor(e) {
    super(k, k, (t) => new D(wr(t.value)), zt.ClassName, e);
  }
}
zt.ClassName = "FGCountOneBitsBlock";
g(zt.ClassName, zt);
class Zt extends Qt {
  constructor(e = { startIndex: new D(0) }) {
    super(e), this.config = e, this.reset = this._registerSignalInput("reset"), this.n = this.registerDataInput("n", k), this.value = this.registerDataOutput("value", k);
  }
  _execute(e, t) {
    if (t === this.reset)
      this.value.setValue(this.config.startIndex, e);
    else {
      const s = this.value.getValue(e);
      s.value < this.n.getValue(e).value && (this.value.setValue(new D(s.value + 1), e), this.out._activateSignal(e));
    }
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return Zt.ClassName;
  }
}
Zt.ClassName = "FGDoNBlock";
g(Zt.ClassName, Zt);
class Yt extends ls {
  /**
   * Construct a FlowGraphGetVariableBlock.
   * @param config construction parameters
   */
  constructor(e) {
    super(e), this.config = e, this.output = this.registerDataOutput(e.variableName, f);
  }
  /**
   * @internal
   */
  _updateOutputs(e) {
    const t = this.config.variableName;
    e.hasVariable(t) && this.output.setValue(e.getVariable(t), e);
  }
  /**
   * Gets the class name of this block
   * @returns the class name
   */
  getClassName() {
    return Yt.ClassName;
  }
  /**
   * Serializes this block
   * @param serializationObject the object to serialize to
   */
  serialize(e) {
    super.serialize(e), e.config.variableName = this.config.variableName;
  }
}
Yt.ClassName = "FGGetVariableBlock";
g(Yt.ClassName, Yt);
class Xt extends Qt {
  constructor(e) {
    super(e), this.config = e, this.input = this.registerDataInput(e.variableName, f);
  }
  _execute(e) {
    const t = this.config.variableName, s = this.input.getValue(e);
    e.setVariable(t, s), this.out._activateSignal(e);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return Xt.ClassName;
  }
}
Xt.ClassName = "FGSetVariableBlock";
g(Xt.ClassName, Xt);
class Jt extends Qt {
  constructor(e) {
    super(e), this.config = e, this.condition = this.registerDataInput("condition", de), this.loopBody = this._registerSignalOutput("loopBody");
  }
  _execute(e, t) {
    let s = this.condition.getValue(e);
    for (this.config?.isDo && !s && this.loopBody._activateSignal(e); s; )
      this.loopBody._activateSignal(e), s = this.condition.getValue(e);
    this.out._activateSignal(e);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return Jt.ClassName;
  }
  /**
   * Serializes the block to a JSON object.
   * @param serializationObject the object to serialize to.
   */
  serialize(e) {
    super.serialize(e), e.isDo = this.config?.isDo;
  }
}
Jt.ClassName = "FGWhileLoopBlock";
g(Jt.ClassName, Jt);
const Mr = {
  "lifecycle/onStart": us.ClassName,
  "lifecycle/onTick": Ie.ClassName,
  log: Pe.ClassName,
  "flow/delay": cs.ClassName,
  "customEvent/send": ds.ClassName,
  "customEvent/receive": Se.ClassName,
  "flow/sequence": Re.ClassName,
  "world/get": Le.ClassName,
  "world/set": fs.ClassName,
  "flow/doN": Zt.ClassName,
  "variable/get": Yt.ClassName,
  "variable/set": Xt.ClassName,
  "flow/whileLoop": Jt.ClassName,
  "math/random": Ve.ClassName,
  "math/e": Ge.ClassName,
  "math/pi": Ue.ClassName,
  "math/inf": qe.ClassName,
  "math/nan": He.ClassName,
  "math/abs": We.ClassName,
  "math/sign": Ke.ClassName,
  "math/trunc": je.ClassName,
  "math/floor": ze.ClassName,
  "math/ceil": Ze.ClassName,
  "math/fract": Ye.ClassName,
  "math/neg": Xe.ClassName,
  "math/add": De.ClassName,
  "math/sub": ke.ClassName,
  "math/mul": Be.ClassName,
  "math/div": Fe.ClassName,
  "math/rem": Je.ClassName,
  "math/min": Qe.ClassName,
  "math/max": et.ClassName,
  "math/clamp": tt.ClassName,
  "math/saturate": st.ClassName,
  "math/mix": nt.ClassName,
  "math/eq": it.ClassName,
  "math/lt": rt.ClassName,
  "math/le": ws.ClassName,
  "math/gt": ot.ClassName,
  "math/ge": at.ClassName,
  "math/isnan": lt.ClassName,
  "math/isinf": Ms.ClassName,
  "math/rad": ht.ClassName,
  "math/deg": ut.ClassName,
  "math/sin": ct.ClassName,
  "math/cos": dt.ClassName,
  "math/tan": ft.ClassName,
  "math/asin": mt.ClassName,
  "math/acos": _t.ClassName,
  "math/atan": pt.ClassName,
  "math/atan2": gt.ClassName,
  "math/sinh": yt.ClassName,
  "math/cosh": At.ClassName,
  "math/tanh": Tt.ClassName,
  "math/asinh": xt.ClassName,
  "math/acosh": Ct.ClassName,
  "math/atanh": bt.ClassName,
  "math/exp": vt.ClassName,
  "math/log": Nt.ClassName,
  "math/log2": Et.ClassName,
  "math/log10": wt.ClassName,
  "math/sqrt": Mt.ClassName,
  "math/cbrt": Ot.ClassName,
  "math/pow": It.ClassName,
  "math/length": Pt.ClassName,
  "math/normalize": St.ClassName,
  "math/dot": $e.ClassName,
  "math/cross": Rt.ClassName,
  "math/rotate2d": Lt.ClassName,
  "math/rotate3d": Dt.ClassName,
  "math/transpose": kt.ClassName,
  "math/determinant": Bt.ClassName,
  "math/inverse": Ft.ClassName,
  "math/matmul": Vt.ClassName,
  "math/not": $t.ClassName,
  "math/and": Gt.ClassName,
  "math/or": Ut.ClassName,
  "math/xor": qt.ClassName,
  "math/asr": Wt.ClassName,
  "math/lsl": Ht.ClassName,
  "math/clz": Kt.ClassName,
  "math/ctz": jt.ClassName,
  "math/popcnt": zt.ClassName
}, Or = {
  float2: "Vector2",
  float3: "Vector3",
  float4: "Vector4",
  float4x4: "Matrix",
  int: "FlowGraphInteger"
};
function gn(a, e, t) {
  if (a.type !== void 0) {
    const s = e.types && e.types[a.type];
    if (!s)
      throw new Error(`${t}: Unknown type: ${a.type}`);
    const n = s.signature;
    if (!n)
      throw new Error(`${t}: Type ${a.type} has no signature`);
    const i = Or[n];
    return {
      value: a.value,
      className: i
    };
  } else
    return a.value;
}
function Ir(a, e, t) {
  const s = {}, n = a.configuration ?? [];
  for (const i of n)
    if (i.id === "customEvent") {
      const r = e.customEvents && e.customEvents[i.value];
      if (!r)
        throw new Error(`/extensions/KHR_interactivity/nodes/${t}: Unknown custom event: ${i.value}`);
      s.eventId = r.id, s.eventData = r.values.map((o) => o.id);
    } else if (i.id === "variable") {
      const r = e.variables && e.variables[i.value];
      if (!r)
        throw new Error(`/extensions/KHR_interactivity/nodes/${t}: Unknown variable: ${i.value}`);
      s.variableName = r.id;
    } else if (i.id === "path") {
      const r = i.value;
      s.path = r;
    } else
      s[i.id] = gn(i, e, `/extensions/KHR_interactivity/nodes/${t}`);
  return s;
}
function Pr(a, e, t) {
  const s = Mr[e.type];
  if (!s)
    throw new Error(`/extensions/KHR_interactivity/nodes/${a}: Unknown block type: ${e.type}`);
  const n = a.toString(), i = Ir(e, t, n), r = e.metadata;
  return {
    className: s,
    config: i,
    uniqueId: n,
    metadata: r,
    dataInputs: [],
    dataOutputs: [],
    signalInputs: [],
    signalOutputs: []
  };
}
function Sr(a) {
  const e = {
    uniqueId: me(),
    _userVariables: {},
    _connectionValues: {}
  }, t = [e], s = [];
  for (let i = 0; i < a.nodes.length; i++) {
    const r = a.nodes[i], o = Pr(i, r, a);
    s.push(o);
  }
  for (let i = 0; i < a.nodes.length; i++) {
    const r = a.nodes[i], o = s[i], l = r.flows ?? [];
    for (const u of l) {
      const c = u.id, d = {
        uniqueId: me(),
        name: c,
        _connectionType: te.Output,
        connectedPointIds: []
      };
      o.signalOutputs.push(d);
      const y = u.node, T = u.socket, m = s[y];
      if (!m)
        throw new Error(`/extensions/KHR_interactivity/nodes/${i}: Could not find node with id ${y} that connects its input with with node ${i}'s output ${c}`);
      let p = m.signalInputs.find((C) => C.name === T);
      p || (p = {
        uniqueId: me(),
        name: T,
        _connectionType: te.Input,
        connectedPointIds: []
      }, m.signalInputs.push(p)), p.connectedPointIds.push(d.uniqueId), d.connectedPointIds.push(p.uniqueId);
    }
    const h = r.values ?? [];
    for (const u of h) {
      const c = u.id, d = {
        uniqueId: me(),
        name: c,
        _connectionType: te.Input,
        connectedPointIds: []
      };
      if (o.dataInputs.push(d), u.value !== void 0) {
        const y = gn(u, a, `/extensions/KHR_interactivity/nodes/${i}`);
        e._connectionValues[d.uniqueId] = y;
      } else if (u.node !== void 0 && u.socket !== void 0) {
        const y = u.node, T = u.socket, m = s[y];
        if (!m)
          throw new Error(`/extensions/KHR_interactivity/nodes/${i}: Could not find node with id ${y} that connects its output with node${i}'s input ${c}`);
        let p = m.dataOutputs.find((C) => C.name === T);
        p || (p = {
          uniqueId: me(),
          name: T,
          _connectionType: te.Output,
          connectedPointIds: []
        }, m.dataOutputs.push(p)), d.connectedPointIds.push(p.uniqueId), p.connectedPointIds.push(d.uniqueId);
      } else
        throw new Error(`/extensions/KHR_interactivity/nodes/${i}: Invalid socket ${c} in node ${i}`);
    }
  }
  const n = a.variables ?? [];
  for (let i = 0; i < n.length; i++) {
    const r = n[i], o = r.id;
    e._userVariables[o] = gn(r, a, `/extensions/KHR_interactivity/variables/${i}`);
  }
  return {
    allBlocks: s,
    executionContexts: t
  };
}
class Rr extends fi {
  constructor(e) {
    super(e, Dr);
  }
}
const Lr = {
  __array__: {
    __target__: !0,
    translation: {
      type: "Vector3",
      get: (a) => a._babylonTransformNode.position,
      set: (a, e) => {
        const t = e._babylonTransformNode;
        t.position = a;
      },
      getObject(a) {
        return a._babylonTransformNode;
      }
    }
  }
}, Dr = {
  nodes: Lr
}, yn = "KHR_interactivity";
class Ni {
  /**
   * @internal
   * @param _loader
   */
  constructor(e) {
    this._loader = e, this.name = yn, this.enabled = this._loader.isExtensionUsed(yn), this._pathConverter = new Rr(this._loader.gltf);
  }
  dispose() {
    this._loader = null, delete this._pathConverter;
  }
  onReady() {
    if (!this._loader.babylonScene || !this._pathConverter)
      return;
    const e = this._loader.babylonScene, t = this._loader.gltf.extensions?.KHR_interactivity, s = Sr(t), n = new Ee({ scene: e });
    Oe.Parse(s, { coordinator: n, pathConverter: this._pathConverter }), n.start();
  }
}
_.RegisterExtension(yn, (a) => new Ni(a));
const Ei = "ExtrasAsMetadata";
class wi {
  _assignExtras(e, t) {
    if (t.extras && Object.keys(t.extras).length > 0) {
      const s = e.metadata = e.metadata || {}, n = s.gltf = s.gltf || {};
      n.extras = t.extras;
    }
  }
  /**
   * @internal
   */
  constructor(e) {
    this.name = Ei, this.enabled = !0, this._loader = e;
  }
  /** @internal */
  dispose() {
    this._loader = null;
  }
  /**
   * @internal
   */
  loadNodeAsync(e, t, s) {
    return this._loader.loadNodeAsync(e, t, (n) => {
      this._assignExtras(n, t), s(n);
    });
  }
  /**
   * @internal
   */
  loadCameraAsync(e, t, s) {
    return this._loader.loadCameraAsync(e, t, (n) => {
      this._assignExtras(n, t), s(n);
    });
  }
  /**
   * @internal
   */
  createMaterial(e, t, s) {
    const n = this._loader.createMaterial(e, t, s);
    return this._assignExtras(n, t), n;
  }
}
_.RegisterExtension(Ei, (a) => new wi(a));
const fo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ArrayItem: A,
  EXT_lights_image_based: Hn,
  EXT_mesh_gpu_instancing: Wn,
  EXT_meshopt_compression: Kn,
  EXT_texture_avif: zn,
  EXT_texture_webp: jn,
  ExtrasAsMetadata: wi,
  GLTFLoader: _,
  KHR_animation_pointer: mi,
  KHR_draco_mesh_compression: Zn,
  KHR_interactivity: Ni,
  KHR_lights: Yn,
  KHR_materials_anisotropy: ti,
  KHR_materials_clearcoat: Qn,
  KHR_materials_dispersion: li,
  KHR_materials_emissive_strength: si,
  KHR_materials_ior: as,
  KHR_materials_iridescence: ei,
  KHR_materials_pbrSpecularGlossiness: Xn,
  KHR_materials_sheen: ni,
  KHR_materials_specular: ii,
  KHR_materials_translucency: oi,
  KHR_materials_transmission: ri,
  KHR_materials_unlit: Jn,
  KHR_materials_variants: ue,
  KHR_materials_volume: ai,
  KHR_mesh_quantization: hi,
  KHR_texture_basisu: ui,
  KHR_texture_transform: ci,
  KHR_xmp_json_ld: di,
  MSFT_audio_emitter: _i,
  MSFT_lod: pi,
  MSFT_minecraftMesh: gi,
  MSFT_sRGBFactors: yi
}, Symbol.toStringTag, { value: "Module" }));
export {
  mn as $,
  nr as A,
  bt as B,
  Gt as C,
  ae as D,
  Ht as E,
  Ne as F,
  $t as G,
  Ut as H,
  Wt as I,
  qt as J,
  Ze as K,
  tt as L,
  _e as M,
  dn as N,
  te as O,
  Pe as P,
  pn as Q,
  de as R,
  Ae as S,
  Ee as T,
  dt as U,
  At as V,
  Kt as W,
  zt as X,
  jt as Y,
  Rt as Z,
  Ot as _,
  Cs as a,
  tr as a$,
  ht as a0,
  Bt as a1,
  Fe as a2,
  Zt as a3,
  $e as a4,
  Ge as a5,
  it as a6,
  hs as a7,
  vt as a8,
  ze as a9,
  ut as aA,
  Ve as aB,
  Se as aC,
  Je as aD,
  Lt as aE,
  Dt as aF,
  st as aG,
  us as aH,
  Ie as aI,
  ds as aJ,
  Re as aK,
  fs as aL,
  Xt as aM,
  Ke as aN,
  _n as aO,
  ct as aP,
  yt as aQ,
  Mt as aR,
  ye as aS,
  ke as aT,
  ft as aU,
  Tt as aV,
  cs as aW,
  kt as aX,
  je as aY,
  Jt as aZ,
  sr as a_,
  Ye as aa,
  Le as ab,
  Yt as ac,
  ot as ad,
  at as ae,
  qe as af,
  nt as ag,
  Ft as ah,
  Ms as ai,
  lt as aj,
  Pt as ak,
  rt as al,
  ws as am,
  wt as an,
  Et as ao,
  Nt as ap,
  Vt as aq,
  et as ar,
  Me as as,
  Qe as at,
  Be as au,
  He as av,
  Xe as aw,
  St as ax,
  Ue as ay,
  It as az,
  ne as b,
  ce as b0,
  xn as b1,
  Tn as b2,
  Q as b3,
  Tr as b4,
  xr as b5,
  k as b6,
  pe as b7,
  Cr as b8,
  yr as b9,
  fn as ba,
  Ar as bb,
  or as bc,
  gr as bd,
  fo as be,
  H as bf,
  ve as bg,
  rs as bh,
  ee as bi,
  Un as bj,
  he as c,
  Qt as d,
  U as e,
  f,
  Ci as g,
  bi as h,
  ls as i,
  Te as j,
  co as k,
  xi as l,
  q as m,
  E as n,
  bn as o,
  As as p,
  ss as q,
  Oe as r,
  We as s,
  _t as t,
  Ct as u,
  De as v,
  mt as w,
  xt as x,
  gt as y,
  pt as z
};
//# sourceMappingURL=index-CAE-jpKL.js.map
