import { e as d, f as g, M as i, Q as m, C as A, a as I, g as l, h as T, _ as f } from "./embed-entry-BgvWRWVI.js";
const P = function(k, o, r, t = {}) {
  const a = k();
  d && d.HasTags(o) && d.AddTagsTo(a, d.GetTags(o, !0));
  const y = g(a), e = {};
  for (const u in y) {
    const s = y[u], p = o[u], c = s.type;
    if (p != null && (u !== "uniqueId" || n.AllowLoadingUniqueId))
      switch (c) {
        case 0:
        case 6:
        case 11:
          a[u] = p;
          break;
        case 1:
          t.cloneTexturesOnlyOnce && e[p.uniqueId] ? a[u] = e[p.uniqueId] : (a[u] = r || p.isRenderTarget ? p : p.clone(), e[p.uniqueId] = a[u]);
          break;
        case 2:
        case 3:
        case 4:
        case 5:
        case 7:
        case 10:
        case 12:
          a[u] = r ? p : p.clone();
          break;
      }
  }
  return a;
};
class n {
  /**
   * Appends the serialized animations from the source animations
   * @param source Source containing the animations
   * @param destination Target to store the animations
   */
  static AppendSerializedAnimations(o, r) {
    if (o.animations) {
      r.animations = [];
      for (let t = 0; t < o.animations.length; t++) {
        const a = o.animations[t];
        r.animations.push(a.serialize());
      }
    }
  }
  /**
   * Static function used to serialized a specific entity
   * @param entity defines the entity to serialize
   * @param serializationObject defines the optional target object where serialization data will be stored
   * @returns a JSON compatible object representing the serialization of the entity
   */
  static Serialize(o, r) {
    r || (r = {}), d && (r.tags = d.GetTags(o));
    const t = g(o);
    for (const a in t) {
      const y = t[a], e = y.sourceName || a, u = y.type, s = o[a];
      if (s != null && (a !== "uniqueId" || n.AllowLoadingUniqueId))
        switch (u) {
          case 0:
            r[e] = s;
            break;
          case 1:
            r[e] = s.serialize();
            break;
          case 2:
            r[e] = s.asArray();
            break;
          case 3:
            r[e] = s.serialize();
            break;
          case 4:
            r[e] = s.asArray();
            break;
          case 5:
            r[e] = s.asArray();
            break;
          case 6:
            r[e] = s.id;
            break;
          case 7:
            r[e] = s.serialize();
            break;
          case 8:
            r[e] = s.asArray();
            break;
          case 9:
            r[e] = s.serialize();
            break;
          case 10:
            r[e] = s.asArray();
            break;
          case 11:
            r[e] = s.id;
            break;
          case 12:
            r[e] = s.asArray();
            break;
        }
    }
    return r;
  }
  /**
   * Given a source json and a destination object in a scene, this function will parse the source and will try to apply its content to the destination object
   * @param source the source json data
   * @param destination the destination object
   * @param scene the scene where the object is
   * @param rootUrl root url to use to load assets
   */
  static ParseProperties(o, r, t, a) {
    a || (a = "");
    const y = g(r);
    for (const e in y) {
      const u = y[e], s = o[u.sourceName || e], p = u.type;
      if (s != null && (e !== "uniqueId" || n.AllowLoadingUniqueId)) {
        const c = r;
        switch (p) {
          case 0:
            c[e] = s;
            break;
          case 1:
            t && (c[e] = n._TextureParser(s, t, a));
            break;
          case 2:
            c[e] = T.FromArray(s);
            break;
          case 3:
            c[e] = n._FresnelParametersParser(s);
            break;
          case 4:
            c[e] = l.FromArray(s);
            break;
          case 5:
            c[e] = I.FromArray(s);
            break;
          case 6:
            t && (c[e] = t.getLastMeshById(s));
            break;
          case 7:
            c[e] = n._ColorCurvesParser(s);
            break;
          case 8:
            c[e] = A.FromArray(s);
            break;
          case 9:
            c[e] = n._ImageProcessingConfigurationParser(s);
            break;
          case 10:
            c[e] = m.FromArray(s);
            break;
          case 11:
            t && (c[e] = t.getCameraById(s));
            break;
          case 12:
            c[e] = i.FromArray(s);
            break;
        }
      }
    }
  }
  /**
   * Creates a new entity from a serialization data object
   * @param creationFunction defines a function used to instanciated the new entity
   * @param source defines the source serialization data
   * @param scene defines the hosting scene
   * @param rootUrl defines the root url for resources
   * @returns a new entity
   */
  static Parse(o, r, t, a = null) {
    const y = o();
    return d && d.AddTagsTo(y, r.tags), n.ParseProperties(r, y, t, a), y;
  }
  /**
   * Clones an object
   * @param creationFunction defines the function used to instanciate the new object
   * @param source defines the source object
   * @param options defines the options to use
   * @returns the cloned object
   */
  static Clone(o, r, t = {}) {
    return P(o, r, !1, t);
  }
  /**
   * Instanciates a new object based on a source one (some data will be shared between both object)
   * @param creationFunction defines the function used to instanciate the new object
   * @param source defines the source object
   * @returns the new object
   */
  static Instanciate(o, r) {
    return P(o, r, !0);
  }
}
n.AllowLoadingUniqueId = !1;
n._ImageProcessingConfigurationParser = (k) => {
  throw f("ImageProcessingConfiguration");
};
n._FresnelParametersParser = (k) => {
  throw f("FresnelParameters");
};
n._ColorCurvesParser = (k) => {
  throw f("ColorCurves");
};
n._TextureParser = (k, o, r) => {
  throw f("Texture");
};
export {
  n as S
};
//# sourceMappingURL=decorators.serialization-C2D-FLnh.js.map
