import { d as S, G as r, c, S as d, e as p, b as g, u, a as T } from "./store-BxSrRQbu.js";
const t = {
  /** @param {import('./defaultState')} store */
  state: (e) => e.gameState,
  /** @param {import('./defaultState')} store */
  loginState: (e) => e.loginState,
  /** @param {import('./defaultState')} store */
  exploreMode: (e) => e.exploreMode,
  /** @param {import('./defaultState')} store */
  ip: (e) => e.ip
}, a = {
  /** @param {import('./defaultState')} store */
  zoneInfo: (e) => e.zoneInfo,
  /** @param {import('./defaultState')} store */
  character: (e) => e.character,
  /** @param {import('./defaultState')} store */
  zonePort: (e) => e.zonePort
}, o = {
  spawns: (e) => e.zone.spawns
}, n = {
  visibleSpawns: (e) => e.ui.visibleSpawns,
  loading: (e) => e.ui.loading,
  loadingText: (e) => e.ui.loadingText,
  loadingTitle: (e) => e.ui.loadingTitle
}, s = {
  lines: (e) => e.chat.chatLines
};
export {
  s as ChatState,
  S as GAME_STATES,
  t as GameState,
  r as GlobalStore,
  c as GlobalStoreProvider,
  d as SETTINGS,
  n as UiState,
  o as Zone,
  a as ZoneState,
  p as defaultState,
  g as useDispatch,
  u as useSelector,
  T as useStore
};
//# sourceMappingURL=index-DyPFidVP.js.map
