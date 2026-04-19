import { r as t, j as S } from "./embed-entry-Bb6cfUYP.js";
const a = t.createContext({}), x = () => t.useContext(a), g = {
  flySpeed: 2,
  showRegions: !1,
  glow: !0,
  webgpu: !1,
  forceReload: !1,
  clipPlane: 1e4,
  spawnLOD: 500,
  remoteUrl: "",
  soundAutoPlay: !1,
  soundRepeat: !1,
  soundShuffle: !1,
  importBoundary: !1,
  showSpawns: !0,
  disableAnimations: !1,
  exportObjects: !1
}, w = ({
  children: l,
  defaultOptions: f = g,
  storageKey: s = "options",
  stateCallback: o = void 0
}) => {
  const [p, u] = t.useState(JSON.parse(localStorage.getItem(s) ?? "{}")), c = t.useCallback((r, d) => {
    u((i) => {
      let e = {
        ...i,
        [r]: d
      };
      o && (e = o(r, i, e));
      const n = JSON.parse(JSON.stringify(e));
      return n?.config && delete n.config.needsRender, localStorage.setItem(s, JSON.stringify(n)), e;
    });
  }, [s, o]);
  return /* @__PURE__ */ S(a.Provider, {
    value: {
      ...f,
      ...p,
      setOption: c
    },
    children: l
  });
};
export {
  a as SettingsContext,
  w as SettingsProvider,
  g as globalSettings,
  x as useSettingsContext
};
//# sourceMappingURL=settings-xaJ4cAuT.js.map
