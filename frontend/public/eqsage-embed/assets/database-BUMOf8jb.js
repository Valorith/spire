import { L as b, T as L, W as S } from "./embed-entry-Dediijbe.js";
import { E as B } from "./engine-DEEy1h7X.js";
const T = 1, A = 2, F = 3, v = 9, G = 10, j = 11, V = 48, N = 4, P = 0, q = 1, H = 2, Q = 3;
function D(i) {
  let e = 0;
  return {
    id_length: i[e++],
    colormap_type: i[e++],
    image_type: i[e++],
    colormap_index: i[e++] | i[e++] << 8,
    colormap_length: i[e++] | i[e++] << 8,
    colormap_size: i[e++],
    origin: [i[e++] | i[e++] << 8, i[e++] | i[e++] << 8],
    width: i[e++] | i[e++] << 8,
    height: i[e++] | i[e++] << 8,
    pixel_size: i[e++],
    flags: i[e++]
  };
}
function Y(i, e) {
  if (e.length < 19) {
    b.Error("Unable to load TGA file - Not enough data to contain header");
    return;
  }
  let t = 18;
  const s = D(e);
  if (s.id_length + t > e.length) {
    b.Error("Unable to load TGA file - Not enough data");
    return;
  }
  t += s.id_length;
  let o = !1, n = !1, a = !1;
  switch (s.image_type) {
    case v:
      o = !0;
    case T:
      n = !0;
      break;
    case G:
      o = !0;
    case A:
      break;
    case j:
      o = !0;
    case F:
      a = !0;
      break;
  }
  let r;
  const u = s.pixel_size >> 3, _ = s.width * s.height * u;
  let l;
  if (n && (l = e.subarray(t, t += s.colormap_length * (s.colormap_size >> 3))), o) {
    r = new Uint8Array(_);
    let w, E, y, R = 0;
    const I = new Uint8Array(u);
    for (; t < _ && R < _; )
      if (w = e[t++], E = (w & 127) + 1, w & 128) {
        for (y = 0; y < u; ++y)
          I[y] = e[t++];
        for (y = 0; y < E; ++y)
          r.set(I, R + y * u);
        R += u * E;
      } else {
        for (E *= u, y = 0; y < E; ++y)
          r[R + y] = e[t++];
        R += E;
      }
  } else
    r = e.subarray(t, t += n ? s.width * s.height : _);
  let p, d, h, c, f, g;
  switch ((s.flags & V) >> N) {
    default:
    case H:
      p = 0, h = 1, g = s.width, d = 0, c = 1, f = s.height;
      break;
    case P:
      p = 0, h = 1, g = s.width, d = s.height - 1, c = -1, f = -1;
      break;
    case Q:
      p = s.width - 1, h = -1, g = -1, d = 0, c = 1, f = s.height;
      break;
    case q:
      p = s.width - 1, h = -1, g = -1, d = s.height - 1, c = -1, f = -1;
      break;
  }
  const m = "_getImageData" + (a ? "Grey" : "") + s.pixel_size + "bits", U = $[m](s, l, r, d, c, f, p, h, g);
  i.getEngine()._uploadDataToTextureDirectly(i, U);
}
function X(i, e, t, s, o, n, a, r, u) {
  const _ = t, l = e, p = i.width, d = i.height;
  let h, c = 0, f, g;
  const m = new Uint8Array(p * d * 4);
  for (g = s; g !== n; g += o)
    for (f = a; f !== u; f += r, c++)
      h = _[c], m[(f + p * g) * 4 + 3] = 255, m[(f + p * g) * 4 + 2] = l[h * 3 + 0], m[(f + p * g) * 4 + 1] = l[h * 3 + 1], m[(f + p * g) * 4 + 0] = l[h * 3 + 2];
  return m;
}
function z(i, e, t, s, o, n, a, r, u) {
  const _ = t, l = i.width, p = i.height;
  let d, h = 0, c, f;
  const g = new Uint8Array(l * p * 4);
  for (f = s; f !== n; f += o)
    for (c = a; c !== u; c += r, h += 2) {
      d = _[h + 0] + (_[h + 1] << 8);
      const m = ((d & 31744) >> 10) * 255 / 31 | 0, U = ((d & 992) >> 5) * 255 / 31 | 0, O = (d & 31) * 255 / 31 | 0;
      g[(c + l * f) * 4 + 0] = m, g[(c + l * f) * 4 + 1] = U, g[(c + l * f) * 4 + 2] = O, g[(c + l * f) * 4 + 3] = d & 32768 ? 0 : 255;
    }
  return g;
}
function W(i, e, t, s, o, n, a, r, u) {
  const _ = t, l = i.width, p = i.height;
  let d = 0, h, c;
  const f = new Uint8Array(l * p * 4);
  for (c = s; c !== n; c += o)
    for (h = a; h !== u; h += r, d += 3)
      f[(h + l * c) * 4 + 3] = 255, f[(h + l * c) * 4 + 2] = _[d + 0], f[(h + l * c) * 4 + 1] = _[d + 1], f[(h + l * c) * 4 + 0] = _[d + 2];
  return f;
}
function J(i, e, t, s, o, n, a, r, u) {
  const _ = t, l = i.width, p = i.height;
  let d = 0, h, c;
  const f = new Uint8Array(l * p * 4);
  for (c = s; c !== n; c += o)
    for (h = a; h !== u; h += r, d += 4)
      f[(h + l * c) * 4 + 2] = _[d + 0], f[(h + l * c) * 4 + 1] = _[d + 1], f[(h + l * c) * 4 + 0] = _[d + 2], f[(h + l * c) * 4 + 3] = _[d + 3];
  return f;
}
function M(i, e, t, s, o, n, a, r, u) {
  const _ = t, l = i.width, p = i.height;
  let d, h = 0, c, f;
  const g = new Uint8Array(l * p * 4);
  for (f = s; f !== n; f += o)
    for (c = a; c !== u; c += r, h++)
      d = _[h], g[(c + l * f) * 4 + 0] = d, g[(c + l * f) * 4 + 1] = d, g[(c + l * f) * 4 + 2] = d, g[(c + l * f) * 4 + 3] = 255;
  return g;
}
function K(i, e, t, s, o, n, a, r, u) {
  const _ = t, l = i.width, p = i.height;
  let d = 0, h, c;
  const f = new Uint8Array(l * p * 4);
  for (c = s; c !== n; c += o)
    for (h = a; h !== u; h += r, d += 2)
      f[(h + l * c) * 4 + 0] = _[d + 0], f[(h + l * c) * 4 + 1] = _[d + 0], f[(h + l * c) * 4 + 2] = _[d + 0], f[(h + l * c) * 4 + 3] = _[d + 1];
  return f;
}
const $ = {
  /**
   * Gets the header of a TGA file
   * @param data defines the TGA data
   * @returns the header
   */
  GetTGAHeader: D,
  /**
   * Uploads TGA content to a Babylon Texture
   * @internal
   */
  UploadContent: Y,
  /** @internal */
  _getImageData8bits: X,
  /** @internal */
  _getImageData16bits: z,
  /** @internal */
  _getImageData24bits: W,
  /** @internal */
  _getImageData32bits: J,
  /** @internal */
  _getImageDataGrey8bits: M,
  /** @internal */
  _getImageDataGrey16bits: K
};
B.OfflineProviderFactory = (i, e, t = !1) => new x(i, e, t);
class x {
  /**
   * Gets a boolean indicating if scene must be saved in the database
   */
  get enableSceneOffline() {
    return this._enableSceneOffline;
  }
  /**
   * Gets a boolean indicating if textures must be saved in the database
   */
  get enableTexturesOffline() {
    return this._enableTexturesOffline;
  }
  /**
   * Creates a new Database
   * @param urlToScene defines the url to load the scene
   * @param callbackManifestChecked defines the callback to use when manifest is checked
   * @param disableManifestCheck defines a boolean indicating that we want to skip the manifest validation (it will be considered validated and up to date)
   */
  constructor(e, t, s = !1) {
    this._idbFactory = typeof indexedDB < "u" ? indexedDB : void 0, this._currentSceneUrl = x._ReturnFullUrlLocation(e), this._db = null, this._enableSceneOffline = !1, this._enableTexturesOffline = !1, this._manifestVersionFound = 0, this._mustUpdateRessources = !1, this._hasReachedQuota = !1, x.IDBStorageEnabled ? s ? (this._enableSceneOffline = !0, this._enableTexturesOffline = !0, this._manifestVersionFound = 1, L.SetImmediate(() => {
      t(!0);
    })) : this._checkManifestFile(t) : t(!0);
  }
  _checkManifestFile(e) {
    const t = () => {
      this._enableSceneOffline = !1, this._enableTexturesOffline = !1, e(!1);
    }, s = () => {
      try {
        if (typeof URL == "function" && this._currentSceneUrl.indexOf("http") === 0) {
          const r = new URL(this._currentSceneUrl);
          return r.pathname += ".manifest", r.toString();
        }
      } catch {
      }
      return `${this._currentSceneUrl}.manifest`;
    };
    let o = !1, n = s();
    const a = new S();
    navigator.onLine && (o = !0, n = n + (n.match(/\?/) == null ? "?" : "&") + Date.now()), a.open("GET", n), a.addEventListener("load", () => {
      if (a.status === 200 || x._ValidateXHRData(a, 1))
        try {
          const r = JSON.parse(a.response);
          this._enableSceneOffline = r.enableSceneOffline, this._enableTexturesOffline = r.enableTexturesOffline && x._IsUASupportingBlobStorage, r.version && !isNaN(parseInt(r.version)) && (this._manifestVersionFound = r.version), e(!0);
        } catch {
          t();
        }
      else
        t();
    }, !1), a.addEventListener("error", () => {
      if (o) {
        o = !1;
        const r = s();
        a.open("GET", r), a.send();
      } else
        t();
    }, !1);
    try {
      a.send();
    } catch {
      b.Error("Error on XHR send request."), e(!1);
    }
  }
  /**
   * Open the database and make it available
   * @param successCallback defines the callback to call on success
   * @param errorCallback defines the callback to call on error
   */
  open(e, t) {
    const s = () => {
      this._isSupported = !1, t && t();
    };
    if (!this._idbFactory || !(this._enableSceneOffline || this._enableTexturesOffline))
      this._isSupported = !1, t && t();
    else if (this._db)
      e && e();
    else {
      this._hasReachedQuota = !1, this._isSupported = !0;
      const o = this._idbFactory.open("babylonjs", 1);
      o.onerror = () => {
        s();
      }, o.onblocked = () => {
        b.Error("IDB request blocked. Please reload the page."), s();
      }, o.onsuccess = () => {
        this._db = o.result, e();
      }, o.onupgradeneeded = (n) => {
        if (this._db = n.target.result, this._db)
          try {
            this._db.createObjectStore("scenes", { keyPath: "sceneUrl" }), this._db.createObjectStore("versions", { keyPath: "sceneUrl" }), this._db.createObjectStore("textures", { keyPath: "textureUrl" });
          } catch (a) {
            b.Error("Error while creating object stores. Exception: " + a.message), s();
          }
      };
    }
  }
  /**
   * Loads an image from the database
   * @param url defines the url to load from
   * @param image defines the target DOM image
   */
  loadImage(e, t) {
    const s = x._ReturnFullUrlLocation(e), o = () => {
      !this._hasReachedQuota && this._db !== null ? this._saveImageIntoDBAsync(s, t) : t.src = e;
    };
    this._mustUpdateRessources ? o() : this._loadImageFromDBAsync(s, t, o);
  }
  _loadImageFromDBAsync(e, t, s) {
    if (this._isSupported && this._db !== null) {
      let o;
      const n = this._db.transaction(["textures"]);
      n.onabort = () => {
        t.src = e;
      }, n.oncomplete = () => {
        let r;
        o && typeof URL == "function" ? (r = URL.createObjectURL(o.data), t.onerror = () => {
          b.Error("Error loading image from blob URL: " + r + " switching back to web url: " + e), t.src = e;
        }, t.src = r) : s();
      };
      const a = n.objectStore("textures").get(e);
      a.onsuccess = (r) => {
        o = r.target.result;
      }, a.onerror = () => {
        b.Error("Error loading texture " + e + " from DB."), t.src = e;
      };
    } else
      b.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open."), t.src = e;
  }
  _saveImageIntoDBAsync(e, t) {
    let s;
    if (this._isSupported) {
      const o = () => {
        let n;
        if (s && typeof URL == "function")
          try {
            n = URL.createObjectURL(s);
          } catch {
            n = URL.createObjectURL(s);
          }
        n && (t.src = n);
      };
      if (x._IsUASupportingBlobStorage) {
        const n = new S();
        n.open("GET", e), n.responseType = "blob", n.addEventListener("load", () => {
          if (n.status === 200 && this._db) {
            s = n.response;
            const a = this._db.transaction(["textures"], "readwrite");
            a.onabort = (u) => {
              try {
                const l = u.target.error;
                l && l.name === "QuotaExceededError" && (this._hasReachedQuota = !0);
              } catch {
              }
              o();
            }, a.oncomplete = () => {
              o();
            };
            const r = { textureUrl: e, data: s };
            try {
              const u = a.objectStore("textures").put(r);
              u.onsuccess = () => {
              }, u.onerror = () => {
                o();
              };
            } catch (u) {
              u.code === 25 && (x._IsUASupportingBlobStorage = !1, this._enableTexturesOffline = !1), t.src = e;
            }
          } else
            t.src = e;
        }, !1), n.addEventListener("error", () => {
          b.Error("Error in XHR request in BABYLON.Database."), t.src = e;
        }, !1), n.send();
      } else
        t.src = e;
    } else
      b.Error("Error: IndexedDB not supported by your browser or Babylon.js database is not open."), t.src = e;
  }
  _checkVersionFromDB(e, t) {
    const s = () => {
      this._saveVersionIntoDBAsync(e, t);
    };
    this._loadVersionFromDBAsync(e, t, s);
  }
  _loadVersionFromDBAsync(e, t, s) {
    if (this._isSupported && this._db) {
      let o;
      try {
        const n = this._db.transaction(["versions"]);
        n.oncomplete = () => {
          o ? this._manifestVersionFound !== o.data ? (this._mustUpdateRessources = !0, s()) : t(o.data) : (this._mustUpdateRessources = !0, s());
        }, n.onabort = () => {
          t(-1);
        };
        const a = n.objectStore("versions").get(e);
        a.onsuccess = (r) => {
          o = r.target.result;
        }, a.onerror = () => {
          b.Error("Error loading version for scene " + e + " from DB."), t(-1);
        };
      } catch (n) {
        b.Error("Error while accessing 'versions' object store (READ OP). Exception: " + n.message), t(-1);
      }
    } else
      b.Error("Error: IndexedDB not supported by your browser or Babylon.js database is not open."), t(-1);
  }
  _saveVersionIntoDBAsync(e, t) {
    if (this._isSupported && !this._hasReachedQuota && this._db)
      try {
        const s = this._db.transaction(["versions"], "readwrite");
        s.onabort = (a) => {
          try {
            const r = a.target.error;
            r && r.name === "QuotaExceededError" && (this._hasReachedQuota = !0);
          } catch {
          }
          t(-1);
        }, s.oncomplete = () => {
          t(this._manifestVersionFound);
        };
        const o = { sceneUrl: e, data: this._manifestVersionFound }, n = s.objectStore("versions").put(o);
        n.onsuccess = () => {
        }, n.onerror = () => {
          b.Error("Error in DB add version request in BABYLON.Database.");
        };
      } catch (s) {
        b.Error("Error while accessing 'versions' object store (WRITE OP). Exception: " + s.message), t(-1);
      }
    else
      t(-1);
  }
  /**
   * Loads a file from database
   * @param url defines the URL to load from
   * @param sceneLoaded defines a callback to call on success
   * @param progressCallBack defines a callback to call when progress changed
   * @param errorCallback defines a callback to call on error
   * @param useArrayBuffer defines a boolean to use array buffer instead of text string
   */
  loadFile(e, t, s, o, n) {
    const a = x._ReturnFullUrlLocation(e), r = () => {
      this._saveFileAsync(a, t, s, n, o);
    };
    this._checkVersionFromDB(a, (u) => {
      u !== -1 ? this._mustUpdateRessources ? this._saveFileAsync(a, t, s, n, o) : this._loadFileAsync(a, t, r) : o && o();
    });
  }
  _loadFileAsync(e, t, s) {
    if (this._isSupported && this._db) {
      let o;
      e.indexOf(".babylon") !== -1 ? o = "scenes" : o = "textures";
      let n;
      const a = this._db.transaction([o]);
      a.oncomplete = () => {
        n ? t(n.data) : s();
      }, a.onabort = () => {
        s();
      };
      const r = a.objectStore(o).get(e);
      r.onsuccess = (u) => {
        n = u.target.result;
      }, r.onerror = () => {
        b.Error("Error loading file " + e + " from DB."), s();
      };
    } else
      b.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open."), t();
  }
  _saveFileAsync(e, t, s, o, n) {
    if (this._isSupported) {
      let a;
      e.indexOf(".babylon") !== -1 ? a = "scenes" : a = "textures";
      const r = new S();
      let u;
      r.open("GET", e + (e.match(/\?/) == null ? "?" : "&") + Date.now()), o && (r.responseType = "arraybuffer"), s && (r.onprogress = s), r.addEventListener("load", () => {
        if (r.status === 200 || r.status < 400 && x._ValidateXHRData(r, o ? 6 : 1))
          if (u = o ? r.response : r.responseText, !this._hasReachedQuota && this._db) {
            const _ = this._db.transaction([a], "readwrite");
            _.onabort = (p) => {
              try {
                const d = p.target.error;
                d && d.name === "QuotaExceededError" && (this._hasReachedQuota = !0);
              } catch {
              }
              t(u);
            }, _.oncomplete = () => {
              t(u);
            };
            let l;
            a === "scenes" ? l = { sceneUrl: e, data: u, version: this._manifestVersionFound } : l = { textureUrl: e, data: u };
            try {
              const p = _.objectStore(a).put(l);
              p.onsuccess = () => {
              }, p.onerror = () => {
                b.Error("Error in DB add file request in BABYLON.Database.");
              };
            } catch {
              t(u);
            }
          } else
            t(u);
        else
          r.status >= 400 && n ? n(r) : t();
      }, !1), r.addEventListener("error", () => {
        b.Error("error on XHR request."), n && n();
      }, !1), r.send();
    } else
      b.Error("Error: IndexedDB not supported by your browser or Babylon.js database is not open."), n && n();
  }
  /**
   * Validates if xhr data is correct
   * @param xhr defines the request to validate
   * @param dataType defines the expected data type
   * @returns true if data is correct
   */
  static _ValidateXHRData(e, t = 7) {
    try {
      if (t & 1) {
        if (e.responseText && e.responseText.length > 0)
          return !0;
        if (t === 1)
          return !1;
      }
      if (t & 2) {
        const s = D(e.response);
        if (s.width && s.height && s.width > 0 && s.height > 0)
          return !0;
        if (t === 2)
          return !1;
      }
      if (t & 4) {
        const s = new Uint8Array(e.response, 0, 3);
        return s[0] === 68 && s[1] === 68 && s[2] === 83;
      }
    } catch {
    }
    return !1;
  }
}
x._IsUASupportingBlobStorage = !0;
x.IDBStorageEnabled = !1;
x._ParseURL = (i) => {
  const e = document.createElement("a");
  e.href = i;
  const t = i.substring(0, i.lastIndexOf("#")), s = i.substring(t.lastIndexOf("/") + 1, i.length);
  return i.substring(0, i.indexOf(s, 0));
};
x._ReturnFullUrlLocation = (i) => i.indexOf("http:/") === -1 && i.indexOf("https:/") === -1 && typeof window < "u" ? x._ParseURL(window.location.href) + i : i;
const C = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Database: x
}, Symbol.toStringTag, { value: "Module" }));
export {
  x as D,
  D as G,
  $ as T,
  Y as U,
  C as d
};
//# sourceMappingURL=database-BUMOf8jb.js.map
