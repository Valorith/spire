import { M as h } from "./material-DxrSWpK2.js";
import { e as u, R as o } from "./embed-entry-BgvWRWVI.js";
class l extends h {
  /**
   * Gets or Sets the list of Materials used within the multi material.
   * They need to be ordered according to the submeshes order in the associated mesh
   */
  get subMaterials() {
    return this._subMaterials;
  }
  set subMaterials(e) {
    this._subMaterials = e, this._hookArray(e);
  }
  /**
   * Function used to align with Node.getChildren()
   * @returns the list of Materials used within the multi material
   */
  getChildren() {
    return this.subMaterials;
  }
  /**
   * Instantiates a new Multi Material
   * A multi-material is used to apply different materials to different parts of the same object without the need of
   * separate meshes. This can be use to improve performances.
   * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/multiMaterials
   * @param name Define the name in the scene
   * @param scene Define the scene the material belongs to
   */
  constructor(e, s) {
    super(e, s, !0), this._waitingSubMaterialsUniqueIds = [], this.getScene().addMultiMaterial(this), this.subMaterials = [], this._storeEffectOnSubMeshes = !0;
  }
  _hookArray(e) {
    const s = e.push;
    e.push = (...i) => {
      const r = s.apply(e, i);
      return this._markAllSubMeshesAsTexturesDirty(), r;
    };
    const t = e.splice;
    e.splice = (i, r) => {
      const a = t.apply(e, [i, r]);
      return this._markAllSubMeshesAsTexturesDirty(), a;
    };
  }
  /**
   * Get one of the submaterial by its index in the submaterials array
   * @param index The index to look the sub material at
   * @returns The Material if the index has been defined
   */
  getSubMaterial(e) {
    return e < 0 || e >= this.subMaterials.length ? this.getScene().defaultMaterial : this.subMaterials[e];
  }
  /**
   * Get the list of active textures for the whole sub materials list.
   * @returns All the textures that will be used during the rendering
   */
  getActiveTextures() {
    return super.getActiveTextures().concat(...this.subMaterials.map((e) => e ? e.getActiveTextures() : []));
  }
  /**
   * Specifies if any sub-materials of this multi-material use a given texture.
   * @param texture Defines the texture to check against this multi-material's sub-materials.
   * @returns A boolean specifying if any sub-material of this multi-material uses the texture.
   */
  hasTexture(e) {
    if (super.hasTexture(e))
      return !0;
    for (let s = 0; s < this.subMaterials.length; s++)
      if (this.subMaterials[s]?.hasTexture(e))
        return !0;
    return !1;
  }
  /**
   * Gets the current class name of the material e.g. "MultiMaterial"
   * Mainly use in serialization.
   * @returns the class name
   */
  getClassName() {
    return "MultiMaterial";
  }
  /**
   * Checks if the material is ready to render the requested sub mesh
   * @param mesh Define the mesh the submesh belongs to
   * @param subMesh Define the sub mesh to look readiness for
   * @param useInstances Define whether or not the material is used with instances
   * @returns true if ready, otherwise false
   */
  isReadyForSubMesh(e, s, t) {
    for (let i = 0; i < this.subMaterials.length; i++) {
      const r = this.subMaterials[i];
      if (r) {
        if (r._storeEffectOnSubMeshes) {
          if (!r.isReadyForSubMesh(e, s, t))
            return !1;
          continue;
        }
        if (!r.isReady(e))
          return !1;
      }
    }
    return !0;
  }
  /**
   * Clones the current material and its related sub materials
   * @param name Define the name of the newly cloned material
   * @param cloneChildren Define if submaterial will be cloned or shared with the parent instance
   * @returns the cloned material
   */
  clone(e, s) {
    const t = new l(e, this.getScene());
    for (let i = 0; i < this.subMaterials.length; i++) {
      let r = null;
      const a = this.subMaterials[i];
      s && a ? r = a.clone(e + "-" + a.name) : r = this.subMaterials[i], t.subMaterials.push(r);
    }
    return t;
  }
  /**
   * Serializes the materials into a JSON representation.
   * @returns the JSON representation
   */
  serialize() {
    const e = {};
    e.name = this.name, e.id = this.id, e.uniqueId = this.uniqueId, u && (e.tags = u.GetTags(this)), e.materialsUniqueIds = [], e.materials = [];
    for (let s = 0; s < this.subMaterials.length; s++) {
      const t = this.subMaterials[s];
      t ? (e.materialsUniqueIds.push(t.uniqueId), e.materials.push(t.id)) : (e.materialsUniqueIds.push(null), e.materials.push(null));
    }
    return e;
  }
  /**
   * Dispose the material and release its associated resources
   * @param forceDisposeEffect Define if we want to force disposing the associated effect (if false the shader is not released and could be reuse later on)
   * @param forceDisposeTextures Define if we want to force disposing the associated textures (if false, they will not be disposed and can still be use elsewhere in the app)
   * @param forceDisposeChildren Define if we want to force disposing the associated submaterials (if false, they will not be disposed and can still be use elsewhere in the app)
   */
  dispose(e, s, t) {
    const i = this.getScene();
    if (!i)
      return;
    if (t)
      for (let a = 0; a < this.subMaterials.length; a++) {
        const n = this.subMaterials[a];
        n && n.dispose(e, s);
      }
    const r = i.multiMaterials.indexOf(this);
    r >= 0 && i.multiMaterials.splice(r, 1), super.dispose(e, s);
  }
  /**
   * Creates a MultiMaterial from parsed MultiMaterial data.
   * @param parsedMultiMaterial defines parsed MultiMaterial data.
   * @param scene defines the hosting scene
   * @returns a new MultiMaterial
   */
  static ParseMultiMaterial(e, s) {
    const t = new l(e.name, s);
    return t.id = e.id, t._loadedUniqueId = e.uniqueId, u && u.AddTagsTo(t, e.tags), e.materialsUniqueIds ? t._waitingSubMaterialsUniqueIds = e.materialsUniqueIds : e.materials.forEach((i) => t.subMaterials.push(s.getLastMaterialById(i))), t;
  }
}
o("BABYLON.MultiMaterial", l);
export {
  l as MultiMaterial
};
//# sourceMappingURL=multiMaterial-DAKdH1Uf.js.map
