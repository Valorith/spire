import { l as v, L as D, I as M, T as L, m as I, d as E, n as N, o as O, O as U } from "./embed-entry-BgvWRWVI.js";
import { a as B } from "./scene-BUYFxCaC.js";
import { E as R } from "./engine-BUHA6kNQ.js";
var F;
(function(A) {
  A[A.Clean = 0] = "Clean", A[A.Stop = 1] = "Stop", A[A.Sync = 2] = "Sync", A[A.NoSync = 3] = "NoSync";
})(F || (F = {}));
class a {
  /**
   * Gets or sets a boolean indicating if entire scene must be loaded even if scene contains incremental data
   */
  static get ForceFullSceneLoadingForIncremental() {
    return v.ForceFullSceneLoadingForIncremental;
  }
  static set ForceFullSceneLoadingForIncremental(t) {
    v.ForceFullSceneLoadingForIncremental = t;
  }
  /**
   * Gets or sets a boolean indicating if loading screen must be displayed while loading a scene
   */
  static get ShowLoadingScreen() {
    return v.ShowLoadingScreen;
  }
  static set ShowLoadingScreen(t) {
    v.ShowLoadingScreen = t;
  }
  /**
   * Defines the current logging level (while loading the scene)
   * @ignorenaming
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static get loggingLevel() {
    return v.loggingLevel;
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static set loggingLevel(t) {
    v.loggingLevel = t;
  }
  /**
   * Gets or set a boolean indicating if matrix weights must be cleaned upon loading
   */
  static get CleanBoneMatrixWeights() {
    return v.CleanBoneMatrixWeights;
  }
  static set CleanBoneMatrixWeights(t) {
    v.CleanBoneMatrixWeights = t;
  }
  /**
   * Gets the default plugin (used to load Babylon files)
   * @returns the .babylon plugin
   */
  static GetDefaultPlugin() {
    return a._RegisteredPlugins[".babylon"];
  }
  static _GetPluginForExtension(t) {
    const r = a._RegisteredPlugins[t];
    return r || (D.Warn("Unable to find a plugin to load " + t + " files. Trying to use .babylon default plugin. To load from a specific filetype (eg. gltf) see: https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes"), a.GetDefaultPlugin());
  }
  static _GetPluginForDirectLoad(t) {
    for (const r in a._RegisteredPlugins) {
      const e = a._RegisteredPlugins[r].plugin;
      if (e.canDirectLoad && e.canDirectLoad(t))
        return a._RegisteredPlugins[r];
    }
    return a.GetDefaultPlugin();
  }
  static _GetPluginForFilename(t) {
    const r = t.indexOf("?");
    r !== -1 && (t = t.substring(0, r));
    const e = t.lastIndexOf("."), n = t.substring(e, t.length).toLowerCase();
    return a._GetPluginForExtension(n);
  }
  static _GetDirectLoad(t) {
    return t.substr(0, 5) === "data:" ? t.substr(5) : null;
  }
  static _FormatErrorMessage(t, r, e) {
    let l = "Unable to load from " + (t.rawData ? "binary data" : t.url);
    return r ? l += `: ${r}` : e && (l += `: ${e}`), l;
  }
  static _LoadData(t, r, e, n, l, m, g, b) {
    const d = a._GetDirectLoad(t.url);
    if (t.rawData && !g)
      throw "When using ArrayBufferView to load data the file extension must be provided.";
    const i = g ? a._GetPluginForExtension(g) : d ? a._GetPluginForDirectLoad(t.url) : a._GetPluginForFilename(t.url);
    if (t.rawData && !i.isBinary)
      throw "Loading from ArrayBufferView can not be used with plugins that don't support binary loading.";
    let s;
    if (i.plugin.createPlugin !== void 0 ? s = i.plugin.createPlugin() : s = i.plugin, !s)
      throw "The loader plugin corresponding to the file type you are trying to load has not been found. If using es6, please import the plugin you wish to use before.";
    if (a.OnPluginActivatedObservable.notifyObservers(s), d && (s.canDirectLoad && s.canDirectLoad(t.url) || !M(t.url))) {
      if (s.directLoad) {
        const f = s.directLoad(r, d);
        f.then ? f.then((w) => {
          e(s, w);
        }).catch((w) => {
          l("Error in directLoad of _loadData: " + w, w);
        }) : e(s, f);
      } else
        e(s, d);
      return s;
    }
    const p = i.isBinary, c = (f, w) => {
      if (r.isDisposed) {
        l("Scene has been disposed");
        return;
      }
      e(s, f, w);
    };
    let y = null, u = !1;
    const o = s.onDisposeObservable;
    o && o.add(() => {
      u = !0, y && (y.abort(), y = null), m();
    });
    const h = () => {
      if (u)
        return;
      const f = (w, G) => {
        l(w?.statusText, G);
      };
      if (!s.loadFile && t.rawData)
        throw "Plugin does not support loading ArrayBufferView.";
      y = s.loadFile ? s.loadFile(r, t.rawData || t.file || t.url, t.rootUrl, c, n, p, f, b) : r._loadFile(t.file || t.url, c, n, !0, p, f);
    }, P = r.getEngine();
    let C = P.enableOfflineSupport;
    if (C) {
      let f = !1;
      for (const w of r.disableOfflineSupportExceptionRules)
        if (w.test(t.url)) {
          f = !0;
          break;
        }
      C = !f;
    }
    return C && R.OfflineProviderFactory ? r.offlineProvider = R.OfflineProviderFactory(t.url, h, P.disableManifestCheck) : h(), s;
  }
  static _GetFileInfo(t, r) {
    let e, n, l = null, m = null;
    if (!r)
      e = t, n = L.GetFilename(t), t = L.GetFolderPath(t);
    else if (r.name) {
      const g = r;
      e = `file:${g.name}`, n = g.name, l = g;
    } else if (ArrayBuffer.isView(r))
      e = "", n = I(), m = r;
    else if (typeof r == "string" && r.startsWith("data:"))
      e = r, n = "";
    else {
      const g = r;
      if (g.substr(0, 1) === "/")
        return L.Error("Wrong sceneFilename parameter"), null;
      e = t + g, n = g;
    }
    return {
      url: e,
      rootUrl: t,
      name: n,
      file: l,
      rawData: m
    };
  }
  // Public functions
  /**
   * Gets a plugin that can load the given extension
   * @param extension defines the extension to load
   * @returns a plugin or null if none works
   */
  static GetPluginForExtension(t) {
    return a._GetPluginForExtension(t).plugin;
  }
  /**
   * Gets a boolean indicating that the given extension can be loaded
   * @param extension defines the extension to load
   * @returns true if the extension is supported
   */
  static IsPluginForExtensionAvailable(t) {
    return !!a._RegisteredPlugins[t];
  }
  /**
   * Adds a new plugin to the list of registered plugins
   * @param plugin defines the plugin to add
   */
  static RegisterPlugin(t) {
    if (typeof t.extensions == "string") {
      const r = t.extensions;
      a._RegisteredPlugins[r.toLowerCase()] = {
        plugin: t,
        isBinary: !1
      };
    } else {
      const r = t.extensions;
      Object.keys(r).forEach((e) => {
        a._RegisteredPlugins[e.toLowerCase()] = {
          plugin: t,
          isBinary: r[e].isBinary
        };
      });
    }
  }
  /**
   * Import meshes into a scene
   * @param meshNames an array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
   * @param scene the instance of BABYLON.Scene to append to
   * @param onSuccess a callback with a list of imported meshes, particleSystems, skeletons, and animationGroups when import succeeds
   * @param onProgress a callback with a progress event for each file being loaded
   * @param onError a callback with the scene, a message, and possibly an exception when import fails
   * @param pluginExtension the extension used to determine the plugin
   * @param name defines the name of the file, if the data is binary
   * @returns The loaded plugin
   */
  static ImportMesh(t, r, e = "", n = E.LastCreatedScene, l = null, m = null, g = null, b = null, d = "") {
    if (!n)
      return D.Error("No scene available to import mesh to"), null;
    const i = a._GetFileInfo(r, e);
    if (!i)
      return null;
    const s = {};
    n.addPendingData(s);
    const p = () => {
      n.removePendingData(s);
    }, c = (o, h) => {
      const P = a._FormatErrorMessage(i, o, h);
      g ? g(n, P, new N(P, O.SceneLoaderError, h)) : D.Error(P), p();
    }, y = m ? (o) => {
      try {
        m(o);
      } catch (h) {
        c("Error in onProgress callback: " + h, h);
      }
    } : void 0, u = (o, h, P, C, f, w, G, x) => {
      if (n.importedMeshesFiles.push(i.url), l)
        try {
          l(o, h, P, C, f, w, G, x);
        } catch (k) {
          c("Error in onSuccess callback: " + k, k);
        }
      n.removePendingData(s);
    };
    return a._LoadData(i, n, (o, h, P) => {
      if (o.rewriteRootURL && (i.rootUrl = o.rewriteRootURL(i.rootUrl, P)), o.importMesh) {
        const C = o, f = [], w = [], G = [];
        if (!C.importMesh(t, n, h, i.rootUrl, f, w, G, c))
          return;
        n.loadingPluginName = o.name, u(f, w, G, [], [], [], [], []);
      } else
        o.importMeshAsync(t, n, h, i.rootUrl, y, i.name).then((f) => {
          n.loadingPluginName = o.name, u(f.meshes, f.particleSystems, f.skeletons, f.animationGroups, f.transformNodes, f.geometries, f.lights, f.spriteManagers);
        }).catch((f) => {
          c(f.message, f);
        });
    }, y, c, p, b, d);
  }
  /**
   * Import meshes into a scene
   * @param meshNames an array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
   * @param scene the instance of BABYLON.Scene to append to
   * @param onProgress a callback with a progress event for each file being loaded
   * @param pluginExtension the extension used to determine the plugin
   * @param name defines the name of the file
   * @returns The loaded list of imported meshes, particle systems, skeletons, and animation groups
   */
  static ImportMeshAsync(t, r, e = "", n = E.LastCreatedScene, l = null, m = null, g = "") {
    return new Promise((b, d) => {
      a.ImportMesh(t, r, e, n, (i, s, p, c, y, u, o, h) => {
        b({
          meshes: i,
          particleSystems: s,
          skeletons: p,
          animationGroups: c,
          transformNodes: y,
          geometries: u,
          lights: o,
          spriteManagers: h
        });
      }, l, (i, s, p) => {
        d(p || new Error(s));
      }, m, g);
    });
  }
  /**
   * Load a scene
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
   * @param engine is the instance of BABYLON.Engine to use to create the scene
   * @param onSuccess a callback with the scene when import succeeds
   * @param onProgress a callback with a progress event for each file being loaded
   * @param onError a callback with the scene, a message, and possibly an exception when import fails
   * @param pluginExtension the extension used to determine the plugin
   * @param name defines the filename, if the data is binary
   * @returns The loaded plugin
   */
  static Load(t, r = "", e = E.LastCreatedEngine, n = null, l = null, m = null, g = null, b = "") {
    return e ? a.Append(t, r, new B(e), n, l, m, g, b) : (L.Error("No engine available"), null);
  }
  /**
   * Load a scene
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
   * @param engine is the instance of BABYLON.Engine to use to create the scene
   * @param onProgress a callback with a progress event for each file being loaded
   * @param pluginExtension the extension used to determine the plugin
   * @param name defines the filename, if the data is binary
   * @returns The loaded scene
   */
  static LoadAsync(t, r = "", e = E.LastCreatedEngine, n = null, l = null, m = "") {
    return new Promise((g, b) => {
      a.Load(t, r, e, (d) => {
        g(d);
      }, n, (d, i, s) => {
        b(s || new Error(i));
      }, l, m);
    });
  }
  /**
   * Append a scene
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
   * @param scene is the instance of BABYLON.Scene to append to
   * @param onSuccess a callback with the scene when import succeeds
   * @param onProgress a callback with a progress event for each file being loaded
   * @param onError a callback with the scene, a message, and possibly an exception when import fails
   * @param pluginExtension the extension used to determine the plugin
   * @param name defines the name of the file, if the data is binary
   * @returns The loaded plugin
   */
  static Append(t, r = "", e = E.LastCreatedScene, n = null, l = null, m = null, g = null, b = "") {
    if (!e)
      return D.Error("No scene available to append to"), null;
    const d = a._GetFileInfo(t, r);
    if (!d)
      return null;
    const i = {};
    e.addPendingData(i);
    const s = () => {
      e.removePendingData(i);
    };
    a.ShowLoadingScreen && !this._ShowingLoadingScreen && (this._ShowingLoadingScreen = !0, e.getEngine().displayLoadingUI(), e.executeWhenReady(() => {
      e.getEngine().hideLoadingUI(), this._ShowingLoadingScreen = !1;
    }));
    const p = (u, o) => {
      const h = a._FormatErrorMessage(d, u, o);
      m ? m(e, h, new N(h, O.SceneLoaderError, o)) : D.Error(h), s();
    }, c = l ? (u) => {
      try {
        l(u);
      } catch (o) {
        p("Error in onProgress callback", o);
      }
    } : void 0, y = () => {
      if (n)
        try {
          n(e);
        } catch (u) {
          p("Error in onSuccess callback", u);
        }
      e.removePendingData(i);
    };
    return a._LoadData(d, e, (u, o) => {
      if (u.load) {
        if (!u.load(e, o, d.rootUrl, p))
          return;
        e.loadingPluginName = u.name, y();
      } else
        u.loadAsync(e, o, d.rootUrl, c, d.name).then(() => {
          e.loadingPluginName = u.name, y();
        }).catch((P) => {
          p(P.message, P);
        });
    }, c, p, s, g, b);
  }
  /**
   * Append a scene
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
   * @param scene is the instance of BABYLON.Scene to append to
   * @param onProgress a callback with a progress event for each file being loaded
   * @param pluginExtension the extension used to determine the plugin
   * @param name defines the name of the file, if the data is binary
   * @returns The given scene
   */
  static AppendAsync(t, r = "", e = E.LastCreatedScene, n = null, l = null, m = "") {
    return new Promise((g, b) => {
      a.Append(t, r, e, (d) => {
        g(d);
      }, n, (d, i, s) => {
        b(s || new Error(i));
      }, l, m);
    });
  }
  /**
   * Load a scene into an asset container
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
   * @param scene is the instance of BABYLON.Scene to append to (default: last created scene)
   * @param onSuccess a callback with the scene when import succeeds
   * @param onProgress a callback with a progress event for each file being loaded
   * @param onError a callback with the scene, a message, and possibly an exception when import fails
   * @param pluginExtension the extension used to determine the plugin
   * @param name defines the filename, if the data is binary
   * @returns The loaded plugin
   */
  static LoadAssetContainer(t, r = "", e = E.LastCreatedScene, n = null, l = null, m = null, g = null, b = "") {
    if (!e)
      return D.Error("No scene available to load asset container to"), null;
    const d = a._GetFileInfo(t, r);
    if (!d)
      return null;
    const i = {};
    e.addPendingData(i);
    const s = () => {
      e.removePendingData(i);
    }, p = (u, o) => {
      const h = a._FormatErrorMessage(d, u, o);
      m ? m(e, h, new N(h, O.SceneLoaderError, o)) : D.Error(h), s();
    }, c = l ? (u) => {
      try {
        l(u);
      } catch (o) {
        p("Error in onProgress callback", o);
      }
    } : void 0, y = (u) => {
      if (n)
        try {
          n(u);
        } catch (o) {
          p("Error in onSuccess callback", o);
        }
      e.removePendingData(i);
    };
    return a._LoadData(d, e, (u, o) => {
      if (u.loadAssetContainer) {
        const P = u.loadAssetContainer(e, o, d.rootUrl, p);
        if (!P)
          return;
        P.populateRootNodes(), e.loadingPluginName = u.name, y(P);
      } else u.loadAssetContainerAsync ? u.loadAssetContainerAsync(e, o, d.rootUrl, c, d.name).then((P) => {
        P.populateRootNodes(), e.loadingPluginName = u.name, y(P);
      }).catch((P) => {
        p(P.message, P);
      }) : p("LoadAssetContainer is not supported by this plugin. Plugin did not provide a loadAssetContainer or loadAssetContainerAsync method.");
    }, c, p, s, g, b);
  }
  /**
   * Load a scene into an asset container
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene (default: empty string)
   * @param scene is the instance of Scene to append to
   * @param onProgress a callback with a progress event for each file being loaded
   * @param pluginExtension the extension used to determine the plugin
   * @returns The loaded asset container
   */
  static LoadAssetContainerAsync(t, r = "", e = E.LastCreatedScene, n = null, l = null) {
    return new Promise((m, g) => {
      a.LoadAssetContainer(t, r, e, (b) => {
        m(b);
      }, n, (b, d, i) => {
        g(i || new Error(d));
      }, l);
    });
  }
  /**
   * Import animations from a file into a scene
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
   * @param scene is the instance of BABYLON.Scene to append to (default: last created scene)
   * @param overwriteAnimations when true, animations are cleaned before importing new ones. Animations are appended otherwise
   * @param animationGroupLoadingMode defines how to handle old animations groups before importing new ones
   * @param targetConverter defines a function used to convert animation targets from loaded scene to current scene (default: search node by name)
   * @param onSuccess a callback with the scene when import succeeds
   * @param onProgress a callback with a progress event for each file being loaded
   * @param onError a callback with the scene, a message, and possibly an exception when import fails
   * @param pluginExtension the extension used to determine the plugin
   */
  static ImportAnimations(t, r = "", e = E.LastCreatedScene, n = !0, l = F.Clean, m = null, g = null, b = null, d = null, i = null) {
    if (!e) {
      D.Error("No scene available to load animations to");
      return;
    }
    if (n) {
      for (const y of e.animatables)
        y.reset();
      e.stopAllAnimations(), e.animationGroups.slice().forEach((y) => {
        y.dispose();
      }), e.getNodes().forEach((y) => {
        y.animations && (y.animations = []);
      });
    } else
      switch (l) {
        case F.Clean:
          e.animationGroups.slice().forEach((c) => {
            c.dispose();
          });
          break;
        case F.Stop:
          e.animationGroups.forEach((c) => {
            c.stop();
          });
          break;
        case F.Sync:
          e.animationGroups.forEach((c) => {
            c.reset(), c.restart();
          });
          break;
        case F.NoSync:
          break;
        default:
          D.Error("Unknown animation group loading mode value '" + l + "'");
          return;
      }
    const s = e.animatables.length, p = (c) => {
      c.mergeAnimationsTo(e, e.animatables.slice(s), m), c.dispose(), e.onAnimationFileImportedObservable.notifyObservers(e), g && g(e);
    };
    this.LoadAssetContainer(t, r, e, p, b, d, i);
  }
  /**
   * Import animations from a file into a scene
   * @param rootUrl a string that defines the root url for the scene and resources or the concatenation of rootURL and filename (e.g. http://example.com/test.glb)
   * @param sceneFilename a string that defines the name of the scene file or starts with "data:" following by the stringified version of the scene or a File object (default: empty string)
   * @param scene is the instance of BABYLON.Scene to append to (default: last created scene)
   * @param overwriteAnimations when true, animations are cleaned before importing new ones. Animations are appended otherwise
   * @param animationGroupLoadingMode defines how to handle old animations groups before importing new ones
   * @param targetConverter defines a function used to convert animation targets from loaded scene to current scene (default: search node by name)
   * @param onSuccess a callback with the scene when import succeeds
   * @param onProgress a callback with a progress event for each file being loaded
   * @param onError a callback with the scene, a message, and possibly an exception when import fails
   * @param pluginExtension the extension used to determine the plugin
   * @returns the updated scene with imported animations
   */
  static ImportAnimationsAsync(t, r = "", e = E.LastCreatedScene, n = !0, l = F.Clean, m = null, g = null, b = null, d = null, i = null) {
    return new Promise((s, p) => {
      a.ImportAnimations(t, r, e, n, l, m, (c) => {
        s(c);
      }, b, (c, y, u) => {
        p(u || new Error(y));
      }, i);
    });
  }
}
a.NO_LOGGING = 0;
a.MINIMAL_LOGGING = 1;
a.SUMMARY_LOGGING = 2;
a.DETAILED_LOGGING = 3;
a.OnPluginActivatedObservable = new U();
a._RegisteredPlugins = {};
a._ShowingLoadingScreen = !1;
export {
  a as SceneLoader,
  F as SceneLoaderAnimationGroupLoadingMode
};
//# sourceMappingURL=sceneLoader-BnW1sH6R.js.map
