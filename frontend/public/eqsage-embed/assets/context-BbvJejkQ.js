import { r as a, a9 as j, aa as ne, j as se } from "./embed-entry-BKE21f6Q.js";
import { useSettingsContext as oe } from "./settings-BnS7_WUk.js";
import { g as Z } from "./GameController-DRgo3AdC.js";
function d(t) {
  return new Promise((r, e) => {
    t.oncomplete = t.onsuccess = () => r(t.result), t.onabort = t.onerror = () => e(t.error);
  });
}
function z(t, r) {
  const e = indexedDB.open(t);
  e.onupgradeneeded = () => e.result.createObjectStore(r);
  const n = d(e);
  return (o, i) => n.then((l) => i(l.transaction(r, o).objectStore(r)));
}
let v;
function y() {
  return v || (v = z("keyval-store", "keyval")), v;
}
function ae(t, r = y()) {
  return r("readonly", (e) => d(e.get(t)));
}
function ie(t, r, e = y()) {
  return e("readwrite", (n) => (n.put(r, t), d(n.transaction)));
}
function le(t, r = y()) {
  return r("readwrite", (e) => (t.forEach((n) => e.put(n[1], n[0])), d(e.transaction)));
}
function ce(t, r = y()) {
  return r("readonly", (e) => Promise.all(t.map((n) => d(e.get(n)))));
}
function ue(t, r, e = y()) {
  return e("readwrite", (n) => (
    // Need to create the promise manually.
    // If I try to chain promises, the transaction closes in browsers
    // that use a promise polyfill (IE10/11).
    new Promise((o, i) => {
      n.get(t).onsuccess = function() {
        try {
          n.put(r(this.result), t), o(d(n.transaction));
        } catch (l) {
          i(l);
        }
      };
    })
  ));
}
function de(t, r = y()) {
  return r("readwrite", (e) => (e.delete(t), d(e.transaction)));
}
function fe(t, r = y()) {
  return r("readwrite", (e) => (t.forEach((n) => e.delete(n)), d(e.transaction)));
}
function we(t = y()) {
  return t("readwrite", (r) => (r.clear(), d(r.transaction)));
}
function I(t, r) {
  return t.openCursor().onsuccess = function() {
    this.result && (r(this.result), this.result.continue());
  }, d(t.transaction);
}
function ye(t = y()) {
  return t("readonly", (r) => {
    if (r.getAllKeys)
      return d(r.getAllKeys());
    const e = [];
    return I(r, (n) => e.push(n.key)).then(() => e);
  });
}
function pe(t = y()) {
  return t("readonly", (r) => {
    if (r.getAll)
      return d(r.getAll());
    const e = [];
    return I(r, (n) => e.push(n.value)).then(() => e);
  });
}
function ge(t = y()) {
  return t("readonly", (r) => {
    if (r.getAll && r.getAllKeys)
      return Promise.all([
        d(r.getAllKeys()),
        d(r.getAll())
      ]).then(([n, o]) => n.map((i, l) => [i, o[l]]));
    const e = [];
    return t("readonly", (n) => I(n, (o) => e.push([o.key, o.value])).then(() => e));
  });
}
const me = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clear: we,
  createStore: z,
  del: de,
  delMany: fe,
  entries: ge,
  get: ae,
  getMany: ce,
  keys: ye,
  promisifyRequest: d,
  set: ie,
  setMany: le,
  update: ue,
  values: pe
}, Symbol.toStringTag, { value: "Module" }));
let w = {};
const he = () => typeof process < "u" && process.versions != null && // eslint-disable-line
process.versions.electron != null;
if (typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope) {
  if (he()) {
    {
      const e = globalThis.fetch;
      globalThis.fetch = async (n, o) => {
        let i = n;
        return typeof n == "string" && n.startsWith("/") ? i = `.${n}` : n instanceof Request && n.url.startsWith("/") && (i = new Request(`.${n.url}`, n)), i = i.replace("/static", ""), e(i, o);
      };
    }
    const { promises: t } = require("fs"), r = require("path");
    w = {
      readFile: async (e) => (await t.readFile(e).catch(() => null))?.buffer,
      deleteFile: async (e) => await t.unlink(e).catch(() => null),
      deleteFolder: async (e) => {
        await t.rm(e, { recursive: !0, force: !0 }).catch(() => {
        });
      },
      readDir: async (e) => {
        const n = await t.readdir(e);
        return await Promise.all(
          n.map(async (i) => {
            const l = r.join(e, i), u = await t.stat(l);
            return {
              name: i,
              path: l.replaceAll("\\", "/"),
              isDirectory: u.isDirectory(),
              isFile: u.isFile()
            };
          })
        );
      },
      createIfNotExist: async (e) => {
        try {
          await t.access(e);
        } catch {
          await t.mkdir(e);
        }
      },
      writeFile: async (e, n) => await t.writeFile(e, n)
    };
  }
} else if (window.electronAPI) {
  let t = function(i, l) {
    let u;
    return function(...S) {
      u && clearTimeout(u), u = setTimeout(() => i.apply(this, S), l);
    };
  }, r = function() {
    if (n)
      return;
    const i = 16 / 9, l = window.innerWidth / window.innerHeight, u = l < i ? l / i : 1;
    e !== null && Math.abs(u - e) < 0.01 || (e = u, n = !0, window.electronAPI.setZoomFactor(u), console.log(
      `Window aspect ratio: ${l.toFixed(2)} vs. desired: ${i.toFixed(2)} → Zoom factor: ${u.toFixed(2)}`
    ), setTimeout(() => {
      n = !1;
    }, 300));
  };
  w = window.electronFS, window.electronAPI.onMessage((i, l) => {
    console.log("Electron error", l), window.gameController.openAlert(`Got error from Electron: ${l}.`, "warning");
  });
  let e = null, n = !1;
  const o = t(r, 50);
  r(), window.addEventListener("resize", o);
}
class k {
  #e = "";
  kind = "file";
  name = "";
  constructor(r) {
    this.#e = r.endsWith("/") ? r.slice(0, r.length - 2) : r, this.name = r.split("/").at(-1);
  }
  async createWritable() {
    const r = this.#e;
    return {
      locked: !1,
      async write(e) {
        await w.writeFile(r, e instanceof ArrayBuffer ? new Uint8Array(e) : e);
      },
      close() {
      },
      getWriter() {
        return {
          releaseLock() {
          }
        };
      }
    };
  }
  async removeEntry() {
    await w.deleteFile(`${this.#e}`);
  }
  async getFile() {
    const r = this.#e;
    return {
      name: this.name,
      async arrayBuffer() {
        return await w.readFile(`${r}`);
      },
      async text() {
        const e = await w.readFile(`${r}`);
        return new TextDecoder("utf-8").decode(e);
      }
    };
  }
}
class A {
  #e = "";
  kind = "directory";
  name = "";
  constructor(r) {
    this.#e = r, this.name = r.split("/").at(-1);
  }
  get path() {
    return this.#e;
  }
  async queryPermission() {
    return console.log("Query my perms"), !0;
  }
  async *values() {
    const r = await w.readDir(this.#e);
    for (const e of r)
      yield e.isDirectory ? new A(e.path) : new k(e.path);
  }
  async *entries() {
    const r = await w.readDir(this.#e);
    for (const e of r)
      yield [e.name, e.isDirectory ? new A(e.path) : new k(e.path)];
  }
  async getFileHandle(r) {
    return new k(`${this.#e}/${r}`);
  }
  async removeEntry(r) {
    const e = `${this.#e}/${r}`, n = (o) => {
      console.log("Error deleting path", e, o);
    };
    await w.deleteFolder(e).catch(n), await w.deleteFile(e).catch(n);
  }
  async getDirectoryHandle(r, e) {
    const n = `${this.#e}/${r}`;
    return await w.createIfNotExist(n), new A(n);
  }
}
const R = (t) => new A(t), c = {
  ApiUnavailable: -1,
  Ready: 0,
  NeedEQDir: 1,
  NeedRefresh: 2
}, P = typeof window.FileSystemHandle?.prototype?.queryPermission == "function";
let x, g, h;
window.electronAPI ? (x = (t) => localStorage.getItem(t), g = (t, r) => localStorage.setItem(t, r), h = (t) => localStorage.removeItem(t)) : { get: x, set: g, del: h } = me;
const Se = (t = "eqdir") => {
  const [r, e] = a.useState(null), [n, o] = a.useState(
    c.NeedEQDir
  );
  a.useEffect(() => {
    n === c.NeedRefresh && window.electronFS && o(c.Ready);
  }, [n]);
  const i = a.useCallback(
    async (s) => {
      const p = r || s;
      p && await p.requestPermission({
        mode: "readwrite"
      }) === "granted" && o(c.Ready);
    },
    [r]
  );
  a.useEffect(() => {
    P && (async () => {
      let s = await x(t);
      if (!s) {
        o(c.NeedEQDir);
        return;
      }
      window.electronAPI && (s = R(s)), e(s), o(
        await s.queryPermission({
          mode: "readwrite"
        }) === "granted" ? c.Ready : c.NeedRefresh
      );
    })();
  }, [t]);
  const l = a.useCallback(
    async (s) => {
      if (s?.kind === "directory") {
        await h(t), await g(t, s), e(s), o(c.NeedRefresh);
        return;
      }
      if (s.preventDefault(), s.stopPropagation(), !!P) {
        if (s.dataTransfer.items?.length) {
          const p = s.dataTransfer.items[0];
          if (window.electronAPI) {
            const f = window.electronAPI.getPath(s.dataTransfer.files[0]);
            e(R(f)), o(c.Ready), await g(t, f);
            return;
          }
          p.getAsFileSystemHandle && p.getAsFileSystemHandle().then(async (f) => {
            console.log("Handle", f), f.kind === "file" || f.kind === "directory" && (await h(t), await g(t, f), e(f), o(c.NeedRefresh));
          }).catch((f) => {
            console.warn("Could not get handle", f);
          });
        }
        s.preventDefault(), s.stopPropagation();
      }
    },
    [t]
  ), u = a.useCallback(async () => {
    await h(t), e(null), o(c.NeedEQDir);
  }, [t]), S = a.useCallback(async () => {
    if (window.electronAPI) {
      const s = await window.electronAPI.selectDirectory();
      g(t, s);
      const p = R(s);
      e(p), o(c.Ready);
      return;
    }
    if (!P) {
      console.warn("File System Access API is not supported in this browser.");
      return;
    }
    try {
      const s = await window.showDirectoryPicker();
      s.kind === "directory" ? (await h(t), await g(t, s), e(s), i(s), o(c.NeedRefresh)) : console.warn("Selected handle is not a directory.");
    } catch (s) {
      s.name !== "AbortError" && console.error("Error selecting directory:", s);
    }
  }, [t, i]), F = a.useCallback(async (s) => {
    await g(t, s), e(s), i(s);
  }, [i, t]);
  return [
    n === c.NeedRefresh && window.electronAPI ? c.Ready : P ? n : c.ApiUnavailable,
    l,
    i,
    r,
    S,
    u,
    F
  ];
}, q = j.createContext({}), Ae = () => j.useContext(q), Fe = ({
  children: t,
  initialRouteState: r,
  onChromeChange: e,
  spireBridge: n
}) => {
  const [o, i, l, u, S] = Se(), {
    remoteUrl: F
  } = oe(), [s, p] = a.useState(null), [f, E] = a.useState(!1), [B, b] = a.useState(!1), [_, $] = a.useState(!1), [L, O] = a.useState(!1), [C, H] = a.useState(!1), [Q, M] = a.useState(!1), [U, N] = a.useState(!1), [G, K] = a.useState([]), [J, T] = a.useState(!1), [V, W] = a.useState(!1), [X, Y] = a.useState(!1), {
    embeddedMode: ee
  } = ne(), [D, te] = a.useState(() => localStorage.getItem("recent-zones") ? JSON.parse(localStorage.getItem("recent-zones")) : []), re = a.useCallback(() => {
    p(null), E(!0), b(!1), $(!1), O(!1), H(!1), N(!1), W(!1), T(!1), M(!1);
  }, []);
  a.useEffect(() => {
    b(o !== c.Ready), o === c.Ready && !s && E(!0);
  }, [o, s]), a.useEffect(() => {
    window.gameController.rootFileSystemHandle = u;
  }, [u]), a.useEffect(() => {
    window.gameController.modelExporter = !0;
  }, [C]);
  const m = a.useMemo(() => n ?? null, [n]);
  return a.useEffect(() => {
    m?.SpireApi && (m.SpireApi.remoteUrl = F || m.SpireApi.remoteUrl);
  }, [F]), a.useEffect(() => {
    localStorage.setItem("recent-zones", JSON.stringify(D));
  }, [D]), a.useEffect(() => {
    Z.Spire = m;
  }, [m]), a.useEffect(() => (e?.({
    immersive: !0
  }), () => e?.({
    immersive: !1
  })), [e]), /* @__PURE__ */ se(q.Provider, {
    value: {
      canvasState: V,
      setCanvasState: W,
      selectedZone: s,
      setSelectedZone: p,
      zoneDialogOpen: f,
      setZoneDialogOpen: E,
      statusDialogOpen: B,
      setStatusDialogOpen: b,
      audioDialogOpen: L,
      setAudioDialogOpen: O,
      zoneBuilderDialogOpen: _,
      setZoneBuilderDialogOpen: $,
      modelExporter: C,
      setModelExporter: H,
      quailWorkspace: Q,
      setQuailWorkspace: M,
      zoneBuilder: U,
      setZoneBuilder: N,
      rightDrawerOpen: J,
      setRightDrawerOpen: T,
      modelExporterLoaded: X,
      setModelExporterLoaded: Y,
      rootFileSystemHandle: u,
      zones: G,
      setZones: K,
      Spire: m,
      embeddedMode: ee,
      initialRouteState: r,
      onDrop: i,
      requestPermissions: l,
      permissionStatus: o,
      onFolderSelected: S,
      recentList: D,
      setRecentList: te,
      reset: re,
      gameController: Z
    },
    children: t
  });
}, De = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MainProvider: Fe,
  useMainContext: Ae
}, Symbol.toStringTag, { value: "Module" }));
export {
  c as P,
  A as S,
  Se as a,
  De as c,
  de as d,
  Ae as u
};
//# sourceMappingURL=context-BbvJejkQ.js.map
