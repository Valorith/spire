import { r as oe, a9 as dt, ax as ke, ay as lt } from "./embed-entry-BKE21f6Q.js";
var b = {};
function O(e) {
  return `Minified Redux error #${e}; visit https://redux.js.org/Errors?code=${e} for the full message or use the non-minified dev environment for full errors. `;
}
var pt = typeof Symbol == "function" && Symbol.observable || "@@observable", Ie = pt, de = () => Math.random().toString(36).substring(7).split("").join("."), ht = {
  INIT: `@@redux/INIT${/* @__PURE__ */ de()}`,
  REPLACE: `@@redux/REPLACE${/* @__PURE__ */ de()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${de()}`
}, $ = ht;
function H(e) {
  if (typeof e != "object" || e === null)
    return !1;
  let t = e;
  for (; Object.getPrototypeOf(t) !== null; )
    t = Object.getPrototypeOf(t);
  return Object.getPrototypeOf(e) === t || Object.getPrototypeOf(e) === null;
}
function yt(e) {
  if (e === void 0)
    return "undefined";
  if (e === null)
    return "null";
  const t = typeof e;
  switch (t) {
    case "boolean":
    case "string":
    case "number":
    case "symbol":
    case "function":
      return t;
  }
  if (Array.isArray(e))
    return "array";
  if (mt(e))
    return "date";
  if (Et(e))
    return "error";
  const r = _t(e);
  switch (r) {
    case "Symbol":
    case "Promise":
    case "WeakMap":
    case "WeakSet":
    case "Map":
    case "Set":
      return r;
  }
  return Object.prototype.toString.call(e).slice(8, -1).toLowerCase().replace(/\s/g, "");
}
function _t(e) {
  return typeof e.constructor == "function" ? e.constructor.name : null;
}
function Et(e) {
  return e instanceof Error || typeof e.message == "string" && e.constructor && typeof e.constructor.stackTraceLimit == "number";
}
function mt(e) {
  return e instanceof Date ? !0 : typeof e.toDateString == "function" && typeof e.getDate == "function" && typeof e.setDate == "function";
}
function P(e) {
  let t = typeof e;
  return b.NODE_ENV !== "production" && (t = yt(e)), t;
}
function Ze(e, t, r) {
  if (typeof e != "function")
    throw new Error(b.NODE_ENV === "production" ? O(2) : `Expected the root reducer to be a function. Instead, received: '${P(e)}'`);
  if (typeof t == "function" && typeof r == "function" || typeof r == "function" && typeof arguments[3] == "function")
    throw new Error(b.NODE_ENV === "production" ? O(0) : "It looks like you are passing several store enhancers to createStore(). This is not supported. Instead, compose them together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.");
  if (typeof t == "function" && typeof r > "u" && (r = t, t = void 0), typeof r < "u") {
    if (typeof r != "function")
      throw new Error(b.NODE_ENV === "production" ? O(1) : `Expected the enhancer to be a function. Instead, received: '${P(r)}'`);
    return r(Ze)(e, t);
  }
  let n = e, o = t, i = /* @__PURE__ */ new Map(), s = i, a = 0, c = !1;
  function f() {
    s === i && (s = /* @__PURE__ */ new Map(), i.forEach((h, m) => {
      s.set(m, h);
    }));
  }
  function u() {
    if (c)
      throw new Error(b.NODE_ENV === "production" ? O(3) : "You may not call store.getState() while the reducer is executing. The reducer has already received the state as an argument. Pass it down from the top reducer instead of reading it from the store.");
    return o;
  }
  function l(h) {
    if (typeof h != "function")
      throw new Error(b.NODE_ENV === "production" ? O(4) : `Expected the listener to be a function. Instead, received: '${P(h)}'`);
    if (c)
      throw new Error(b.NODE_ENV === "production" ? O(5) : "You may not call store.subscribe() while the reducer is executing. If you would like to be notified after the store has been updated, subscribe from a component and invoke store.getState() in the callback to access the latest state. See https://redux.js.org/api/store#subscribelistener for more details.");
    let m = !0;
    f();
    const w = a++;
    return s.set(w, h), function() {
      if (m) {
        if (c)
          throw new Error(b.NODE_ENV === "production" ? O(6) : "You may not unsubscribe from a store listener while the reducer is executing. See https://redux.js.org/api/store#subscribelistener for more details.");
        m = !1, f(), s.delete(w), i = null;
      }
    };
  }
  function d(h) {
    if (!H(h))
      throw new Error(b.NODE_ENV === "production" ? O(7) : `Actions must be plain objects. Instead, the actual type was: '${P(h)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`);
    if (typeof h.type > "u")
      throw new Error(b.NODE_ENV === "production" ? O(8) : 'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.');
    if (typeof h.type != "string")
      throw new Error(b.NODE_ENV === "production" ? O(17) : `Action "type" property must be a string. Instead, the actual type was: '${P(h.type)}'. Value was: '${h.type}' (stringified)`);
    if (c)
      throw new Error(b.NODE_ENV === "production" ? O(9) : "Reducers may not dispatch actions.");
    try {
      c = !0, o = n(o, h);
    } finally {
      c = !1;
    }
    return (i = s).forEach((w) => {
      w();
    }), h;
  }
  function p(h) {
    if (typeof h != "function")
      throw new Error(b.NODE_ENV === "production" ? O(10) : `Expected the nextReducer to be a function. Instead, received: '${P(h)}`);
    n = h, d({
      type: $.REPLACE
    });
  }
  function y() {
    const h = l;
    return {
      /**
       * The minimal observable subscription method.
       * @param observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(m) {
        if (typeof m != "object" || m === null)
          throw new Error(b.NODE_ENV === "production" ? O(11) : `Expected the observer to be an object. Instead, received: '${P(m)}'`);
        function w() {
          const D = m;
          D.next && D.next(u());
        }
        return w(), {
          unsubscribe: h(w)
        };
      },
      [Ie]() {
        return this;
      }
    };
  }
  return d({
    type: $.INIT
  }), {
    dispatch: d,
    subscribe: l,
    getState: u,
    replaceReducer: p,
    [Ie]: y
  };
}
function Ve(e) {
  typeof console < "u" && typeof console.error == "function" && console.error(e);
  try {
    throw new Error(e);
  } catch {
  }
}
function wt(e, t, r, n) {
  const o = Object.keys(t), i = r && r.type === $.INIT ? "preloadedState argument passed to createStore" : "previous state received by the reducer";
  if (o.length === 0)
    return "Store does not have a valid reducer. Make sure the argument passed to combineReducers is an object whose values are reducers.";
  if (!H(e))
    return `The ${i} has unexpected type of "${P(e)}". Expected argument to be an object with the following keys: "${o.join('", "')}"`;
  const s = Object.keys(e).filter((a) => !t.hasOwnProperty(a) && !n[a]);
  if (s.forEach((a) => {
    n[a] = !0;
  }), !(r && r.type === $.REPLACE) && s.length > 0)
    return `Unexpected ${s.length > 1 ? "keys" : "key"} "${s.join('", "')}" found in ${i}. Expected to find one of the known reducer keys instead: "${o.join('", "')}". Unexpected keys will be ignored.`;
}
function bt(e) {
  Object.keys(e).forEach((t) => {
    const r = e[t];
    if (typeof r(void 0, {
      type: $.INIT
    }) > "u")
      throw new Error(b.NODE_ENV === "production" ? O(12) : `The slice reducer for key "${t}" returned undefined during initialization. If the state passed to the reducer is undefined, you must explicitly return the initial state. The initial state may not be undefined. If you don't want to set a value for this reducer, you can use null instead of undefined.`);
    if (typeof r(void 0, {
      type: $.PROBE_UNKNOWN_ACTION()
    }) > "u")
      throw new Error(b.NODE_ENV === "production" ? O(13) : `The slice reducer for key "${t}" returned undefined when probed with a random type. Don't try to handle '${$.INIT}' or other actions in "redux/*" namespace. They are considered private. Instead, you must return the current state for any unknown actions, unless it is undefined, in which case you must return the initial state, regardless of the action type. The initial state may not be undefined, but can be null.`);
  });
}
function gt(e) {
  const t = Object.keys(e), r = {};
  for (let s = 0; s < t.length; s++) {
    const a = t[s];
    b.NODE_ENV !== "production" && typeof e[a] > "u" && Ve(`No reducer provided for key "${a}"`), typeof e[a] == "function" && (r[a] = e[a]);
  }
  const n = Object.keys(r);
  let o;
  b.NODE_ENV !== "production" && (o = {});
  let i;
  try {
    bt(r);
  } catch (s) {
    i = s;
  }
  return function(a = {}, c) {
    if (i)
      throw i;
    if (b.NODE_ENV !== "production") {
      const l = wt(a, r, c, o);
      l && Ve(l);
    }
    let f = !1;
    const u = {};
    for (let l = 0; l < n.length; l++) {
      const d = n[l], p = r[d], y = a[d], E = p(y, c);
      if (typeof E > "u") {
        const h = c && c.type;
        throw new Error(b.NODE_ENV === "production" ? O(14) : `When called with an action of type ${h ? `"${String(h)}"` : "(unknown type)"}, the slice reducer for key "${d}" returned undefined. To ignore an action, you must explicitly return the previous state. If you want this reducer to hold no value, you can return null instead of undefined.`);
      }
      u[d] = E, f = f || E !== y;
    }
    return f = f || n.length !== Object.keys(a).length, f ? u : a;
  };
}
function J(...e) {
  return e.length === 0 ? (t) => t : e.length === 1 ? e[0] : e.reduce((t, r) => (...n) => t(r(...n)));
}
function St(...e) {
  return (t) => (r, n) => {
    const o = t(r, n);
    let i = () => {
      throw new Error(b.NODE_ENV === "production" ? O(15) : "Dispatching while constructing your middleware is not allowed. Other middleware would not be applied to this dispatch.");
    };
    const s = {
      getState: o.getState,
      dispatch: (c, ...f) => i(c, ...f)
    }, a = e.map((c) => c(s));
    return i = J(...a)(o.dispatch), {
      ...o,
      dispatch: i
    };
  };
}
function Be(e) {
  return H(e) && "type" in e && typeof e.type == "string";
}
var Y = {}, He = Symbol.for("immer-nothing"), Pe = Symbol.for("immer-draftable"), x = Symbol.for("immer-state"), Nt = Y.NODE_ENV !== "production" ? [
  // All error codes, starting by 0:
  function(e) {
    return `The plugin for '${e}' has not been loaded into Immer. To enable the plugin, import and call \`enable${e}()\` when initializing your application.`;
  },
  function(e) {
    return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${e}'`;
  },
  "This object has been frozen and should not be mutated",
  function(e) {
    return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + e;
  },
  "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
  "Immer forbids circular references",
  "The first or second argument to `produce` must be a function",
  "The third argument to `produce` must be a function or undefined",
  "First argument to `createDraft` must be a plain object, an array, or an immerable object",
  "First argument to `finishDraft` must be a draft returned by `createDraft`",
  function(e) {
    return `'current' expects a draft, got: ${e}`;
  },
  "Object.defineProperty() cannot be used on an Immer draft",
  "Object.setPrototypeOf() cannot be used on an Immer draft",
  "Immer only supports deleting array indices",
  "Immer only supports setting array indices and the 'length' property",
  function(e) {
    return `'original' expects a draft, got: ${e}`;
  }
  // Note: if more errors are added, the errorOffset in Patches.ts should be increased
  // See Patches.ts for additional errors
] : [];
function C(e, ...t) {
  if (Y.NODE_ENV !== "production") {
    const r = Nt[e], n = typeof r == "function" ? r.apply(null, t) : r;
    throw new Error(`[Immer] ${n}`);
  }
  throw new Error(
    `[Immer] minified error nr: ${e}. Full error at: https://bit.ly/3cXEKWf`
  );
}
var G = Object.getPrototypeOf;
function j(e) {
  return !!e && !!e[x];
}
function V(e) {
  return e ? Ye(e) || Array.isArray(e) || !!e[Pe] || !!e.constructor?.[Pe] || ae(e) || se(e) : !1;
}
var Ot = Object.prototype.constructor.toString();
function Ye(e) {
  if (!e || typeof e != "object")
    return !1;
  const t = G(e);
  if (t === null)
    return !0;
  const r = Object.hasOwnProperty.call(t, "constructor") && t.constructor;
  return r === Object ? !0 : typeof r == "function" && Function.toString.call(r) === Ot;
}
function ee(e, t) {
  ie(e) === 0 ? Reflect.ownKeys(e).forEach((r) => {
    t(r, e[r], e);
  }) : e.forEach((r, n) => t(n, r, e));
}
function ie(e) {
  const t = e[x];
  return t ? t.type_ : Array.isArray(e) ? 1 : ae(e) ? 2 : se(e) ? 3 : 0;
}
function Ee(e, t) {
  return ie(e) === 2 ? e.has(t) : Object.prototype.hasOwnProperty.call(e, t);
}
function qe(e, t, r) {
  const n = ie(e);
  n === 2 ? e.set(t, r) : n === 3 ? e.add(r) : e[t] = r;
}
function vt(e, t) {
  return e === t ? e !== 0 || 1 / e === 1 / t : e !== e && t !== t;
}
function ae(e) {
  return e instanceof Map;
}
function se(e) {
  return e instanceof Set;
}
function R(e) {
  return e.copy_ || e.base_;
}
function me(e, t) {
  if (ae(e))
    return new Map(e);
  if (se(e))
    return new Set(e);
  if (Array.isArray(e))
    return Array.prototype.slice.call(e);
  const r = Ye(e);
  if (t === !0 || t === "class_only" && !r) {
    const n = Object.getOwnPropertyDescriptors(e);
    delete n[x];
    let o = Reflect.ownKeys(n);
    for (let i = 0; i < o.length; i++) {
      const s = o[i], a = n[s];
      a.writable === !1 && (a.writable = !0, a.configurable = !0), (a.get || a.set) && (n[s] = {
        configurable: !0,
        writable: !0,
        // could live with !!desc.set as well here...
        enumerable: a.enumerable,
        value: e[s]
      });
    }
    return Object.create(G(e), n);
  } else {
    const n = G(e);
    if (n !== null && r)
      return { ...e };
    const o = Object.create(n);
    return Object.assign(o, e);
  }
}
function De(e, t = !1) {
  return ue(e) || j(e) || !V(e) || (ie(e) > 1 && (e.set = e.add = e.clear = e.delete = Dt), Object.freeze(e), t && Object.entries(e).forEach(([r, n]) => De(n, !0))), e;
}
function Dt() {
  C(2);
}
function ue(e) {
  return Object.isFrozen(e);
}
var Tt = {};
function L(e) {
  const t = Tt[e];
  return t || C(0, e), t;
}
var Z;
function Xe() {
  return Z;
}
function Ct(e, t) {
  return {
    drafts_: [],
    parent_: e,
    immer_: t,
    // Whenever the modified draft contains a draft from another scope, we
    // need to prevent auto-freezing so the unowned draft can be finalized.
    canAutoFreeze_: !0,
    unfinalizedDrafts_: 0
  };
}
function Me(e, t) {
  t && (L("Patches"), e.patches_ = [], e.inversePatches_ = [], e.patchListener_ = t);
}
function we(e) {
  be(e), e.drafts_.forEach(At), e.drafts_ = null;
}
function be(e) {
  e === Z && (Z = e.parent_);
}
function Re(e) {
  return Z = Ct(Z, e);
}
function At(e) {
  const t = e[x];
  t.type_ === 0 || t.type_ === 1 ? t.revoke_() : t.revoked_ = !0;
}
function ze(e, t) {
  t.unfinalizedDrafts_ = t.drafts_.length;
  const r = t.drafts_[0];
  return e !== void 0 && e !== r ? (r[x].modified_ && (we(t), C(4)), V(e) && (e = te(t, e), t.parent_ || re(t, e)), t.patches_ && L("Patches").generateReplacementPatches_(
    r[x].base_,
    e,
    t.patches_,
    t.inversePatches_
  )) : e = te(t, r, []), we(t), t.patches_ && t.patchListener_(t.patches_, t.inversePatches_), e !== He ? e : void 0;
}
function te(e, t, r) {
  if (ue(t))
    return t;
  const n = t[x];
  if (!n)
    return ee(
      t,
      (o, i) => $e(e, n, t, o, i, r)
    ), t;
  if (n.scope_ !== e)
    return t;
  if (!n.modified_)
    return re(e, n.base_, !0), n.base_;
  if (!n.finalized_) {
    n.finalized_ = !0, n.scope_.unfinalizedDrafts_--;
    const o = n.copy_;
    let i = o, s = !1;
    n.type_ === 3 && (i = new Set(o), o.clear(), s = !0), ee(
      i,
      (a, c) => $e(e, n, o, a, c, r, s)
    ), re(e, o, !1), r && e.patches_ && L("Patches").generatePatches_(
      n,
      r,
      e.patches_,
      e.inversePatches_
    );
  }
  return n.copy_;
}
function $e(e, t, r, n, o, i, s) {
  if (Y.NODE_ENV !== "production" && o === r && C(5), j(o)) {
    const a = i && t && t.type_ !== 3 && // Set objects are atomic since they have no keys.
    !Ee(t.assigned_, n) ? i.concat(n) : void 0, c = te(e, o, a);
    if (qe(r, n, c), j(c))
      e.canAutoFreeze_ = !1;
    else
      return;
  } else s && r.add(o);
  if (V(o) && !ue(o)) {
    if (!e.immer_.autoFreeze_ && e.unfinalizedDrafts_ < 1)
      return;
    te(e, o), (!t || !t.scope_.parent_) && typeof n != "symbol" && Object.prototype.propertyIsEnumerable.call(r, n) && re(e, o);
  }
}
function re(e, t, r = !1) {
  !e.parent_ && e.immer_.autoFreeze_ && e.canAutoFreeze_ && De(t, r);
}
function xt(e, t) {
  const r = Array.isArray(e), n = {
    type_: r ? 1 : 0,
    // Track which produce call this is associated with.
    scope_: t ? t.scope_ : Xe(),
    // True for both shallow and deep changes.
    modified_: !1,
    // Used during finalization.
    finalized_: !1,
    // Track which properties have been assigned (true) or deleted (false).
    assigned_: {},
    // The parent draft state.
    parent_: t,
    // The base state.
    base_: e,
    // The base proxy.
    draft_: null,
    // set below
    // The base copy with any updated values.
    copy_: null,
    // Called by the `produce` function.
    revoke_: null,
    isManual_: !1
  };
  let o = n, i = Te;
  r && (o = [n], i = B);
  const { revoke: s, proxy: a } = Proxy.revocable(o, i);
  return n.draft_ = a, n.revoke_ = s, a;
}
var Te = {
  get(e, t) {
    if (t === x)
      return e;
    const r = R(e);
    if (!Ee(r, t))
      return kt(e, r, t);
    const n = r[t];
    return e.finalized_ || !V(n) ? n : n === le(e.base_, t) ? (pe(e), e.copy_[t] = Se(n, e)) : n;
  },
  has(e, t) {
    return t in R(e);
  },
  ownKeys(e) {
    return Reflect.ownKeys(R(e));
  },
  set(e, t, r) {
    const n = Qe(R(e), t);
    if (n?.set)
      return n.set.call(e.draft_, r), !0;
    if (!e.modified_) {
      const o = le(R(e), t), i = o?.[x];
      if (i && i.base_ === r)
        return e.copy_[t] = r, e.assigned_[t] = !1, !0;
      if (vt(r, o) && (r !== void 0 || Ee(e.base_, t)))
        return !0;
      pe(e), ge(e);
    }
    return e.copy_[t] === r && // special case: handle new props with value 'undefined'
    (r !== void 0 || t in e.copy_) || // special case: NaN
    Number.isNaN(r) && Number.isNaN(e.copy_[t]) || (e.copy_[t] = r, e.assigned_[t] = !0), !0;
  },
  deleteProperty(e, t) {
    return le(e.base_, t) !== void 0 || t in e.base_ ? (e.assigned_[t] = !1, pe(e), ge(e)) : delete e.assigned_[t], e.copy_ && delete e.copy_[t], !0;
  },
  // Note: We never coerce `desc.value` into an Immer draft, because we can't make
  // the same guarantee in ES5 mode.
  getOwnPropertyDescriptor(e, t) {
    const r = R(e), n = Reflect.getOwnPropertyDescriptor(r, t);
    return n && {
      writable: !0,
      configurable: e.type_ !== 1 || t !== "length",
      enumerable: n.enumerable,
      value: r[t]
    };
  },
  defineProperty() {
    C(11);
  },
  getPrototypeOf(e) {
    return G(e.base_);
  },
  setPrototypeOf() {
    C(12);
  }
}, B = {};
ee(Te, (e, t) => {
  B[e] = function() {
    return arguments[0] = arguments[0][0], t.apply(this, arguments);
  };
});
B.deleteProperty = function(e, t) {
  return Y.NODE_ENV !== "production" && isNaN(parseInt(t)) && C(13), B.set.call(this, e, t, void 0);
};
B.set = function(e, t, r) {
  return Y.NODE_ENV !== "production" && t !== "length" && isNaN(parseInt(t)) && C(14), Te.set.call(this, e[0], t, r, e[0]);
};
function le(e, t) {
  const r = e[x];
  return (r ? R(r) : e)[t];
}
function kt(e, t, r) {
  const n = Qe(t, r);
  return n ? "value" in n ? n.value : (
    // This is a very special case, if the prop is a getter defined by the
    // prototype, we should invoke it with the draft as context!
    n.get?.call(e.draft_)
  ) : void 0;
}
function Qe(e, t) {
  if (!(t in e))
    return;
  let r = G(e);
  for (; r; ) {
    const n = Object.getOwnPropertyDescriptor(r, t);
    if (n)
      return n;
    r = G(r);
  }
}
function ge(e) {
  e.modified_ || (e.modified_ = !0, e.parent_ && ge(e.parent_));
}
function pe(e) {
  e.copy_ || (e.copy_ = me(
    e.base_,
    e.scope_.immer_.useStrictShallowCopy_
  ));
}
var It = class {
  constructor(e) {
    this.autoFreeze_ = !0, this.useStrictShallowCopy_ = !1, this.produce = (t, r, n) => {
      if (typeof t == "function" && typeof r != "function") {
        const i = r;
        r = t;
        const s = this;
        return function(c = i, ...f) {
          return s.produce(c, (u) => r.call(this, u, ...f));
        };
      }
      typeof r != "function" && C(6), n !== void 0 && typeof n != "function" && C(7);
      let o;
      if (V(t)) {
        const i = Re(this), s = Se(t, void 0);
        let a = !0;
        try {
          o = r(s), a = !1;
        } finally {
          a ? we(i) : be(i);
        }
        return Me(i, n), ze(o, i);
      } else if (!t || typeof t != "object") {
        if (o = r(t), o === void 0 && (o = t), o === He && (o = void 0), this.autoFreeze_ && De(o, !0), n) {
          const i = [], s = [];
          L("Patches").generateReplacementPatches_(t, o, i, s), n(i, s);
        }
        return o;
      } else
        C(1, t);
    }, this.produceWithPatches = (t, r) => {
      if (typeof t == "function")
        return (s, ...a) => this.produceWithPatches(s, (c) => t(c, ...a));
      let n, o;
      return [this.produce(t, r, (s, a) => {
        n = s, o = a;
      }), n, o];
    }, typeof e?.autoFreeze == "boolean" && this.setAutoFreeze(e.autoFreeze), typeof e?.useStrictShallowCopy == "boolean" && this.setUseStrictShallowCopy(e.useStrictShallowCopy);
  }
  createDraft(e) {
    V(e) || C(8), j(e) && (e = Vt(e));
    const t = Re(this), r = Se(e, void 0);
    return r[x].isManual_ = !0, be(t), r;
  }
  finishDraft(e, t) {
    const r = e && e[x];
    (!r || !r.isManual_) && C(9);
    const { scope_: n } = r;
    return Me(n, t), ze(void 0, n);
  }
  /**
   * Pass true to automatically freeze all copies created by Immer.
   *
   * By default, auto-freezing is enabled.
   */
  setAutoFreeze(e) {
    this.autoFreeze_ = e;
  }
  /**
   * Pass true to enable strict shallow copy.
   *
   * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
   */
  setUseStrictShallowCopy(e) {
    this.useStrictShallowCopy_ = e;
  }
  applyPatches(e, t) {
    let r;
    for (r = t.length - 1; r >= 0; r--) {
      const o = t[r];
      if (o.path.length === 0 && o.op === "replace") {
        e = o.value;
        break;
      }
    }
    r > -1 && (t = t.slice(r + 1));
    const n = L("Patches").applyPatches_;
    return j(e) ? n(e, t) : this.produce(
      e,
      (o) => n(o, t)
    );
  }
};
function Se(e, t) {
  const r = ae(e) ? L("MapSet").proxyMap_(e, t) : se(e) ? L("MapSet").proxySet_(e, t) : xt(e, t);
  return (t ? t.scope_ : Xe()).drafts_.push(r), r;
}
function Vt(e) {
  return j(e) || C(10, e), Je(e);
}
function Je(e) {
  if (!V(e) || ue(e))
    return e;
  const t = e[x];
  let r;
  if (t) {
    if (!t.modified_)
      return t.base_;
    t.finalized_ = !0, r = me(e, t.scope_.immer_.useStrictShallowCopy_);
  } else
    r = me(e, !0);
  return ee(r, (n, o) => {
    qe(r, n, Je(o));
  }), t && (t.finalized_ = !1), r;
}
var k = new It(), et = k.produce;
k.produceWithPatches.bind(
  k
);
k.setAutoFreeze.bind(k);
k.setUseStrictShallowCopy.bind(k);
k.applyPatches.bind(k);
k.createDraft.bind(k);
k.finishDraft.bind(k);
function tt(e) {
  return ({ dispatch: r, getState: n }) => (o) => (i) => typeof i == "function" ? i(r, n, e) : o(i);
}
var Pt = tt(), Mt = tt, _ = {}, Rt = typeof window < "u" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : function() {
  if (arguments.length !== 0)
    return typeof arguments[0] == "object" ? J : J.apply(null, arguments);
}, zt = (e) => e && typeof e.match == "function";
function g(e, t) {
  function r(...n) {
    if (t) {
      let o = t(...n);
      if (!o)
        throw new Error(_.NODE_ENV === "production" ? N(0) : "prepareAction did not return an object");
      return {
        type: e,
        payload: o.payload,
        ..."meta" in o && {
          meta: o.meta
        },
        ..."error" in o && {
          error: o.error
        }
      };
    }
    return {
      type: e,
      payload: n[0]
    };
  }
  return r.toString = () => `${e}`, r.type = e, r.match = (n) => Be(n) && n.type === e, r;
}
function $t(e) {
  return typeof e == "function" && "type" in e && // hasMatchFunction only wants Matchers but I don't see the point in rewriting it
  zt(e);
}
function jt(e) {
  const t = e ? `${e}`.split("/") : [], r = t[t.length - 1] || "actionCreator";
  return `Detected an action creator with type "${e || "unknown"}" being dispatched. 
Make sure you're calling the action creator before dispatching, i.e. \`dispatch(${r}())\` instead of \`dispatch(${r})\`. This is necessary even if the action has no payload.`;
}
function Lt(e = {}) {
  if (_.NODE_ENV === "production")
    return () => (r) => (n) => r(n);
  const {
    isActionCreator: t = $t
  } = e;
  return () => (r) => (n) => (t(n) && console.warn(jt(n.type)), r(n));
}
function rt(e, t) {
  let r = 0;
  return {
    measureTime(n) {
      const o = Date.now();
      try {
        return n();
      } finally {
        const i = Date.now();
        r += i - o;
      }
    },
    warnIfExceeded() {
      r > e && console.warn(`${t} took ${r}ms, which is more than the warning threshold of ${e}ms. 
If your state or actions are very large, you may want to disable the middleware as it might cause too much of a slowdown in development mode. See https://redux-toolkit.js.org/api/getDefaultMiddleware for instructions.
It is disabled in production builds, so you don't need to worry about that.`);
    }
  };
}
var nt = class U extends Array {
  constructor(...t) {
    super(...t), Object.setPrototypeOf(this, U.prototype);
  }
  static get [Symbol.species]() {
    return U;
  }
  concat(...t) {
    return super.concat.apply(this, t);
  }
  prepend(...t) {
    return t.length === 1 && Array.isArray(t[0]) ? new U(...t[0].concat(this)) : new U(...t.concat(this));
  }
};
function je(e) {
  return V(e) ? et(e, () => {
  }) : e;
}
function Ft(e) {
  return typeof e != "object" || e == null || Object.isFrozen(e);
}
function Wt(e, t, r) {
  const n = ot(e, t, r);
  return {
    detectMutations() {
      return it(e, t, n, r);
    }
  };
}
function ot(e, t = [], r, n = "", o = /* @__PURE__ */ new Set()) {
  const i = {
    value: r
  };
  if (!e(r) && !o.has(r)) {
    o.add(r), i.children = {};
    for (const s in r) {
      const a = n ? n + "." + s : s;
      t.length && t.indexOf(a) !== -1 || (i.children[s] = ot(e, t, r[s], a));
    }
  }
  return i;
}
function it(e, t = [], r, n, o = !1, i = "") {
  const s = r ? r.value : void 0, a = s === n;
  if (o && !a && !Number.isNaN(n))
    return {
      wasMutated: !0,
      path: i
    };
  if (e(s) || e(n))
    return {
      wasMutated: !1
    };
  const c = {};
  for (let u in r.children)
    c[u] = !0;
  for (let u in n)
    c[u] = !0;
  const f = t.length > 0;
  for (let u in c) {
    const l = i ? i + "." + u : u;
    if (f && t.some((y) => y instanceof RegExp ? y.test(l) : l === y))
      continue;
    const d = it(e, t, r.children[u], n[u], a, l);
    if (d.wasMutated)
      return d;
  }
  return {
    wasMutated: !1
  };
}
function Gt(e = {}) {
  if (_.NODE_ENV === "production")
    return () => (t) => (r) => t(r);
  {
    let t = function(a, c, f, u) {
      return JSON.stringify(a, r(c, u), f);
    }, r = function(a, c) {
      let f = [], u = [];
      return c || (c = function(l, d) {
        return f[0] === d ? "[Circular ~]" : "[Circular ~." + u.slice(0, f.indexOf(d)).join(".") + "]";
      }), function(l, d) {
        if (f.length > 0) {
          var p = f.indexOf(this);
          ~p ? f.splice(p + 1) : f.push(this), ~p ? u.splice(p, 1 / 0, l) : u.push(l), ~f.indexOf(d) && (d = c.call(this, l, d));
        } else f.push(d);
        return a == null ? d : a.call(this, l, d);
      };
    }, {
      isImmutable: n = Ft,
      ignoredPaths: o,
      warnAfter: i = 32
    } = e;
    const s = Wt.bind(null, n, o);
    return ({
      getState: a
    }) => {
      let c = a(), f = s(c), u;
      return (l) => (d) => {
        const p = rt(i, "ImmutableStateInvariantMiddleware");
        p.measureTime(() => {
          if (c = a(), u = f.detectMutations(), f = s(c), u.wasMutated)
            throw new Error(_.NODE_ENV === "production" ? N(19) : `A state mutation was detected between dispatches, in the path '${u.path || ""}'.  This may cause incorrect behavior. (https://redux.js.org/style-guide/style-guide#do-not-mutate-state)`);
        });
        const y = l(d);
        return p.measureTime(() => {
          if (c = a(), u = f.detectMutations(), f = s(c), u.wasMutated)
            throw new Error(_.NODE_ENV === "production" ? N(20) : `A state mutation was detected inside a dispatch, in the path: ${u.path || ""}. Take a look at the reducer(s) handling the action ${t(d)}. (https://redux.js.org/style-guide/style-guide#do-not-mutate-state)`);
        }), p.warnIfExceeded(), y;
      };
    };
  }
}
function at(e) {
  const t = typeof e;
  return e == null || t === "string" || t === "boolean" || t === "number" || Array.isArray(e) || H(e);
}
function Ne(e, t = "", r = at, n, o = [], i) {
  let s;
  if (!r(e))
    return {
      keyPath: t || "<root>",
      value: e
    };
  if (typeof e != "object" || e === null || i?.has(e)) return !1;
  const a = n != null ? n(e) : Object.entries(e), c = o.length > 0;
  for (const [f, u] of a) {
    const l = t ? t + "." + f : f;
    if (!(c && o.some((p) => p instanceof RegExp ? p.test(l) : l === p))) {
      if (!r(u))
        return {
          keyPath: l,
          value: u
        };
      if (typeof u == "object" && (s = Ne(u, l, r, n, o, i), s))
        return s;
    }
  }
  return i && st(e) && i.add(e), !1;
}
function st(e) {
  if (!Object.isFrozen(e)) return !1;
  for (const t of Object.values(e))
    if (!(typeof t != "object" || t === null) && !st(t))
      return !1;
  return !0;
}
function Ut(e = {}) {
  if (_.NODE_ENV === "production")
    return () => (t) => (r) => t(r);
  {
    const {
      isSerializable: t = at,
      getEntries: r,
      ignoredActions: n = [],
      ignoredActionPaths: o = ["meta.arg", "meta.baseQueryMeta"],
      ignoredPaths: i = [],
      warnAfter: s = 32,
      ignoreState: a = !1,
      ignoreActions: c = !1,
      disableCache: f = !1
    } = e, u = !f && WeakSet ? /* @__PURE__ */ new WeakSet() : void 0;
    return (l) => (d) => (p) => {
      if (!Be(p))
        return d(p);
      const y = d(p), E = rt(s, "SerializableStateInvariantMiddleware");
      return !c && !(n.length && n.indexOf(p.type) !== -1) && E.measureTime(() => {
        const h = Ne(p, "", t, r, o, u);
        if (h) {
          const {
            keyPath: m,
            value: w
          } = h;
          console.error(`A non-serializable value was detected in an action, in the path: \`${m}\`. Value:`, w, `
Take a look at the logic that dispatched this action: `, p, `
(See https://redux.js.org/faq/actions#why-should-type-be-a-string-or-at-least-serializable-why-should-my-action-types-be-constants)`, `
(To allow non-serializable values see: https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data)`);
        }
      }), a || (E.measureTime(() => {
        const h = l.getState(), m = Ne(h, "", t, r, i, u);
        if (m) {
          const {
            keyPath: w,
            value: S
          } = m;
          console.error(`A non-serializable value was detected in the state, in the path: \`${w}\`. Value:`, S, `
Take a look at the reducer(s) handling this action type: ${p.type}.
(See https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)`);
        }
      }), E.warnIfExceeded()), y;
    };
  }
}
function X(e) {
  return typeof e == "boolean";
}
var Kt = () => function(t) {
  const {
    thunk: r = !0,
    immutableCheck: n = !0,
    serializableCheck: o = !0,
    actionCreatorCheck: i = !0
  } = t ?? {};
  let s = new nt();
  if (r && (X(r) ? s.push(Pt) : s.push(Mt(r.extraArgument))), _.NODE_ENV !== "production") {
    if (n) {
      let a = {};
      X(n) || (a = n), s.unshift(Gt(a));
    }
    if (o) {
      let a = {};
      X(o) || (a = o), s.push(Ut(a));
    }
    if (i) {
      let a = {};
      X(i) || (a = i), s.unshift(Lt(a));
    }
  }
  return s;
}, Zt = "RTK_autoBatch", ut = (e) => (t) => {
  setTimeout(t, e);
}, Bt = typeof window < "u" && window.requestAnimationFrame ? window.requestAnimationFrame : ut(10), Ht = (e = {
  type: "raf"
}) => (t) => (...r) => {
  const n = t(...r);
  let o = !0, i = !1, s = !1;
  const a = /* @__PURE__ */ new Set(), c = e.type === "tick" ? queueMicrotask : e.type === "raf" ? Bt : e.type === "callback" ? e.queueNotification : ut(e.timeout), f = () => {
    s = !1, i && (i = !1, a.forEach((u) => u()));
  };
  return Object.assign({}, n, {
    // Override the base `store.subscribe` method to keep original listeners
    // from running if we're delaying notifications
    subscribe(u) {
      const l = () => o && u(), d = n.subscribe(l);
      return a.add(u), () => {
        d(), a.delete(u);
      };
    },
    // Override the base `store.dispatch` method so that we can check actions
    // for the `shouldAutoBatch` flag and determine if batching is active
    dispatch(u) {
      try {
        return o = !u?.meta?.[Zt], i = !o, i && (s || (s = !0, c(f))), n.dispatch(u);
      } finally {
        o = !0;
      }
    }
  });
}, Yt = (e) => function(r) {
  const {
    autoBatch: n = !0
  } = r ?? {};
  let o = new nt(e);
  return n && o.push(Ht(typeof n == "object" ? n : void 0)), o;
};
function qt(e) {
  const t = Kt(), {
    reducer: r = void 0,
    middleware: n,
    devTools: o = !0,
    preloadedState: i = void 0,
    enhancers: s = void 0
  } = e || {};
  let a;
  if (typeof r == "function")
    a = r;
  else if (H(r))
    a = gt(r);
  else
    throw new Error(_.NODE_ENV === "production" ? N(1) : "`reducer` is a required argument, and must be a function or an object of functions that can be passed to combineReducers");
  if (_.NODE_ENV !== "production" && n && typeof n != "function")
    throw new Error(_.NODE_ENV === "production" ? N(2) : "`middleware` field must be a callback");
  let c;
  if (typeof n == "function") {
    if (c = n(t), _.NODE_ENV !== "production" && !Array.isArray(c))
      throw new Error(_.NODE_ENV === "production" ? N(3) : "when using a middleware builder function, an array of middleware must be returned");
  } else
    c = t();
  if (_.NODE_ENV !== "production" && c.some((y) => typeof y != "function"))
    throw new Error(_.NODE_ENV === "production" ? N(4) : "each middleware provided to configureStore must be a function");
  let f = J;
  o && (f = Rt({
    // Enable capture of stack traces for dispatched Redux actions
    trace: _.NODE_ENV !== "production",
    ...typeof o == "object" && o
  }));
  const u = St(...c), l = Yt(u);
  if (_.NODE_ENV !== "production" && s && typeof s != "function")
    throw new Error(_.NODE_ENV === "production" ? N(5) : "`enhancers` field must be a callback");
  let d = typeof s == "function" ? s(l) : l();
  if (_.NODE_ENV !== "production" && !Array.isArray(d))
    throw new Error(_.NODE_ENV === "production" ? N(6) : "`enhancers` callback must return an array");
  if (_.NODE_ENV !== "production" && d.some((y) => typeof y != "function"))
    throw new Error(_.NODE_ENV === "production" ? N(7) : "each enhancer provided to configureStore must be a function");
  _.NODE_ENV !== "production" && c.length && !d.includes(u) && console.error("middlewares were provided, but middleware enhancer was not included in final enhancers - make sure to call `getDefaultEnhancers`");
  const p = f(...d);
  return Ze(a, i, p);
}
function Xt(e) {
  const t = {}, r = [];
  let n;
  const o = {
    addCase(i, s) {
      if (_.NODE_ENV !== "production") {
        if (r.length > 0)
          throw new Error(_.NODE_ENV === "production" ? N(26) : "`builder.addCase` should only be called before calling `builder.addMatcher`");
        if (n)
          throw new Error(_.NODE_ENV === "production" ? N(27) : "`builder.addCase` should only be called before calling `builder.addDefaultCase`");
      }
      const a = typeof i == "string" ? i : i.type;
      if (!a)
        throw new Error(_.NODE_ENV === "production" ? N(28) : "`builder.addCase` cannot be called with an empty action type");
      if (a in t)
        throw new Error(_.NODE_ENV === "production" ? N(29) : `\`builder.addCase\` cannot be called with two reducers for the same action type '${a}'`);
      return t[a] = s, o;
    },
    addMatcher(i, s) {
      if (_.NODE_ENV !== "production" && n)
        throw new Error(_.NODE_ENV === "production" ? N(30) : "`builder.addMatcher` should only be called before calling `builder.addDefaultCase`");
      return r.push({
        matcher: i,
        reducer: s
      }), o;
    },
    addDefaultCase(i) {
      if (_.NODE_ENV !== "production" && n)
        throw new Error(_.NODE_ENV === "production" ? N(31) : "`builder.addDefaultCase` can only be called once");
      return n = i, o;
    }
  };
  return e(o), [t, r, n];
}
function Qt(e) {
  return typeof e == "function";
}
function q(e, t) {
  if (_.NODE_ENV !== "production" && typeof t == "object")
    throw new Error(_.NODE_ENV === "production" ? N(8) : "The object notation for `createReducer` has been removed. Please use the 'builder callback' notation instead: https://redux-toolkit.js.org/api/createReducer");
  let [r, n, o] = Xt(t), i;
  if (Qt(e))
    i = () => je(e());
  else {
    const a = je(e);
    i = () => a;
  }
  function s(a = i(), c) {
    let f = [r[c.type], ...n.filter(({
      matcher: u
    }) => u(c)).map(({
      reducer: u
    }) => u)];
    return f.filter((u) => !!u).length === 0 && (f = [o]), f.reduce((u, l) => {
      if (l)
        if (j(u)) {
          const p = l(u, c);
          return p === void 0 ? u : p;
        } else {
          if (V(u))
            return et(u, (d) => l(d, c));
          {
            const d = l(u, c);
            if (d === void 0) {
              if (u === null)
                return u;
              throw new Error(_.NODE_ENV === "production" ? N(9) : "A case reducer on a non-draftable value must not return undefined");
            }
            return d;
          }
        }
      return u;
    }, a);
  }
  return s.getInitialState = i, s;
}
function N(e) {
  return `Minified Redux Toolkit error #${e}; visit https://redux-toolkit.js.org/Errors?code=${e} for the full message or use the non-minified dev environment for full errors. `;
}
var Oe = { exports: {} }, he = {};
/**
 * @license React
 * use-sync-external-store-with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Le;
function Jt() {
  if (Le) return he;
  Le = 1;
  var e = oe;
  function t(c, f) {
    return c === f && (c !== 0 || 1 / c === 1 / f) || c !== c && f !== f;
  }
  var r = typeof Object.is == "function" ? Object.is : t, n = e.useSyncExternalStore, o = e.useRef, i = e.useEffect, s = e.useMemo, a = e.useDebugValue;
  return he.useSyncExternalStoreWithSelector = function(c, f, u, l, d) {
    var p = o(null);
    if (p.current === null) {
      var y = { hasValue: !1, value: null };
      p.current = y;
    } else y = p.current;
    p = s(
      function() {
        function h(T) {
          if (!m) {
            if (m = !0, w = T, T = l(T), d !== void 0 && y.hasValue) {
              var v = y.value;
              if (d(v, T))
                return S = v;
            }
            return S = T;
          }
          if (v = S, r(w, T)) return v;
          var I = l(T);
          return d !== void 0 && d(v, I) ? (w = T, v) : (w = T, S = I);
        }
        var m = !1, w, S, D = u === void 0 ? null : u;
        return [
          function() {
            return h(f());
          },
          D === null ? void 0 : function() {
            return h(D());
          }
        ];
      },
      [f, u, l, d]
    );
    var E = n(c, p[0], p[1]);
    return i(
      function() {
        y.hasValue = !0, y.value = E;
      },
      [E]
    ), a(E), E;
  }, he;
}
var ye = {}, Fe;
function er() {
  if (Fe) return ye;
  Fe = 1;
  var e = {};
  /**
   * @license React
   * use-sync-external-store-with-selector.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  return e.NODE_ENV !== "production" && function() {
    function t(f, u) {
      return f === u && (f !== 0 || 1 / f === 1 / u) || f !== f && u !== u;
    }
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var r = oe, n = typeof Object.is == "function" ? Object.is : t, o = r.useSyncExternalStore, i = r.useRef, s = r.useEffect, a = r.useMemo, c = r.useDebugValue;
    ye.useSyncExternalStoreWithSelector = function(f, u, l, d, p) {
      var y = i(null);
      if (y.current === null) {
        var E = { hasValue: !1, value: null };
        y.current = E;
      } else E = y.current;
      y = a(
        function() {
          function m(v) {
            if (!w) {
              if (w = !0, S = v, v = d(v), p !== void 0 && E.hasValue) {
                var I = E.value;
                if (p(I, v))
                  return D = I;
              }
              return D = v;
            }
            if (I = D, n(S, v))
              return I;
            var xe = d(v);
            return p !== void 0 && p(I, xe) ? (S = v, I) : (S = v, D = xe);
          }
          var w = !1, S, D, T = l === void 0 ? null : l;
          return [
            function() {
              return m(u());
            },
            T === null ? void 0 : function() {
              return m(T());
            }
          ];
        },
        [u, l, d, p]
      );
      var h = o(f, y[0], y[1]);
      return s(
        function() {
          E.hasValue = !0, E.value = h;
        },
        [h]
      ), c(h), h;
    }, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop == "function" && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  }(), ye;
}
var tr = {};
tr.NODE_ENV === "production" ? Oe.exports = Jt() : Oe.exports = er();
var rr = Oe.exports, ne = {}, A = (
  // prettier-ignore
  // @ts-ignore
  "default" in ke ? dt : ke
), We = Symbol.for("react-redux-context"), Ge = typeof globalThis < "u" ? globalThis : (
  /* fall back to a per-module scope (pre-8.1 behaviour) if `globalThis` is not available */
  {}
);
function nr() {
  if (!A.createContext)
    return {};
  const e = Ge[We] ?? (Ge[We] = /* @__PURE__ */ new Map());
  let t = e.get(A.createContext);
  return t || (t = A.createContext(
    null
  ), ne.NODE_ENV !== "production" && (t.displayName = "ReactRedux"), e.set(A.createContext, t)), t;
}
var M = /* @__PURE__ */ nr(), or = () => {
  throw new Error("uSES not initialized!");
};
function Ce(e = M) {
  return function() {
    const r = A.useContext(e);
    if (ne.NODE_ENV !== "production" && !r)
      throw new Error(
        "could not find react-redux context value; please ensure the component is wrapped in a <Provider>"
      );
    return r;
  };
}
var ct = /* @__PURE__ */ Ce(), ft = or, ir = (e) => {
  ft = e;
}, ar = (e, t) => e === t;
function sr(e = M) {
  const t = e === M ? ct : Ce(e), r = (n, o = {}) => {
    const { equalityFn: i = ar, devModeChecks: s = {} } = typeof o == "function" ? { equalityFn: o } : o;
    if (ne.NODE_ENV !== "production") {
      if (!n)
        throw new Error("You must pass a selector to useSelector");
      if (typeof n != "function")
        throw new Error("You must pass a function as a selector to useSelector");
      if (typeof i != "function")
        throw new Error(
          "You must pass a function as an equality function to useSelector"
        );
    }
    const {
      store: a,
      subscription: c,
      getServerState: f,
      stabilityCheck: u,
      identityFunctionCheck: l
    } = t(), d = A.useRef(!0), p = A.useCallback(
      {
        [n.name](E) {
          const h = n(E);
          if (ne.NODE_ENV !== "production") {
            const {
              identityFunctionCheck: m,
              stabilityCheck: w
            } = {
              stabilityCheck: u,
              identityFunctionCheck: l,
              ...s
            };
            if (w === "always" || w === "once" && d.current) {
              const S = n(E);
              if (!i(h, S)) {
                let D;
                try {
                  throw new Error();
                } catch (T) {
                  ({ stack: D } = T);
                }
                console.warn(
                  "Selector " + (n.name || "unknown") + ` returned a different result when called with the same parameters. This can lead to unnecessary rerenders.
Selectors that return a new reference (such as an object or an array) should be memoized: https://redux.js.org/usage/deriving-data-selectors#optimizing-selectors-with-memoization`,
                  {
                    state: E,
                    selected: h,
                    selected2: S,
                    stack: D
                  }
                );
              }
            }
            if ((m === "always" || m === "once" && d.current) && h === E) {
              let S;
              try {
                throw new Error();
              } catch (D) {
                ({ stack: S } = D);
              }
              console.warn(
                "Selector " + (n.name || "unknown") + ` returned the root state when called. This can lead to unnecessary rerenders.
Selectors that return the entire state are almost certainly a mistake, as they will cause a rerender whenever *anything* in state changes.`,
                { stack: S }
              );
            }
            d.current && (d.current = !1);
          }
          return h;
        }
      }[n.name],
      [n, u, s.stabilityCheck]
    ), y = ft(
      c.addNestedSub,
      a.getState,
      f || a.getState,
      p,
      i
    );
    return A.useDebugValue(y), y;
  };
  return Object.assign(r, {
    withTypes: () => r
  }), r;
}
function ur(e) {
  e();
}
function cr() {
  let e = null, t = null;
  return {
    clear() {
      e = null, t = null;
    },
    notify() {
      ur(() => {
        let r = e;
        for (; r; )
          r.callback(), r = r.next;
      });
    },
    get() {
      const r = [];
      let n = e;
      for (; n; )
        r.push(n), n = n.next;
      return r;
    },
    subscribe(r) {
      let n = !0;
      const o = t = {
        callback: r,
        next: null,
        prev: t
      };
      return o.prev ? o.prev.next = o : e = o, function() {
        !n || e === null || (n = !1, o.next ? o.next.prev = o.prev : t = o.prev, o.prev ? o.prev.next = o.next : e = o.next);
      };
    }
  };
}
var Ue = {
  notify() {
  },
  get: () => []
};
function fr(e, t) {
  let r, n = Ue, o = 0, i = !1;
  function s(E) {
    u();
    const h = n.subscribe(E);
    let m = !1;
    return () => {
      m || (m = !0, h(), l());
    };
  }
  function a() {
    n.notify();
  }
  function c() {
    y.onStateChange && y.onStateChange();
  }
  function f() {
    return i;
  }
  function u() {
    o++, r || (r = e.subscribe(c), n = cr());
  }
  function l() {
    o--, r && o === 0 && (r(), r = void 0, n.clear(), n = Ue);
  }
  function d() {
    i || (i = !0, u());
  }
  function p() {
    i && (i = !1, l());
  }
  const y = {
    addNestedSub: s,
    notifyNestedSubs: a,
    handleChangeWrapper: c,
    isSubscribed: f,
    trySubscribe: d,
    tryUnsubscribe: p,
    getListeners: () => n
  };
  return y;
}
var dr = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u", lr = typeof navigator < "u" && navigator.product === "ReactNative", pr = dr || lr ? A.useLayoutEffect : A.useEffect;
function hr({
  store: e,
  context: t,
  children: r,
  serverState: n,
  stabilityCheck: o = "once",
  identityFunctionCheck: i = "once"
}) {
  const s = A.useMemo(() => {
    const f = fr(e);
    return {
      store: e,
      subscription: f,
      getServerState: n ? () => n : void 0,
      stabilityCheck: o,
      identityFunctionCheck: i
    };
  }, [e, n, o, i]), a = A.useMemo(() => e.getState(), [e]);
  pr(() => {
    const { subscription: f } = s;
    return f.onStateChange = f.notifyNestedSubs, f.trySubscribe(), a !== e.getState() && f.notifyNestedSubs(), () => {
      f.tryUnsubscribe(), f.onStateChange = void 0;
    };
  }, [s, a]);
  const c = t || M;
  return /* @__PURE__ */ A.createElement(c.Provider, { value: s }, r);
}
var yr = hr;
function Ae(e = M) {
  const t = e === M ? ct : (
    // @ts-ignore
    Ce(e)
  ), r = () => {
    const { store: n } = t();
    return n;
  };
  return Object.assign(r, {
    withTypes: () => r
  }), r;
}
var _r = /* @__PURE__ */ Ae();
function Er(e = M) {
  const t = e === M ? _r : Ae(e), r = () => t().dispatch;
  return Object.assign(r, {
    withTypes: () => r
  }), r;
}
ir(rr.useSyncExternalStoreWithSelector);
const mr = {
  LOGIN: 0,
  CHAR_SELECT: 1,
  ZONING: 2,
  IN_ZONE: 3
}, kr = {};
var _e = {};
const F = {
  worldState: {
    server: -1
  },
  exploreMode: !1,
  zoneInfo: {
    zone: 2,
    shortName: "qeynos2",
    longName: "North Qeynos"
  },
  zonePort: -1,
  zone: {
    spawns: []
  },
  loginState: {
    success: !1,
    loggedIn: !1,
    loading: !1,
    triedLogin: !1,
    lsid: -1,
    key: "",
    serverList: [],
    characters: []
  },
  character: "",
  ip: _e.VITE_SAVE_IP === "true" && localStorage.getItem("loginip") || _e.VITE_EQ_SERVER,
  gameState: mr.LOGIN,
  chat: {
    chatLines: []
  },
  ui: {
    settingsOpen: !1,
    visibleSpawns: {},
    loading: !1,
    loadingText: "",
    loadingTitle: ""
  }
}, wr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), br = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" })), Ke = { ...wr, ...br }, gr = () => {
  const e = { ...Ke };
  return {
    context: e,
    thunkActions: Object.assign(
      {},
      ...Object.entries(Ke).map(([t, r]) => ({
        async [t]() {
          try {
            return await r.call(e, ...arguments);
          } catch (n) {
            console.warn(`Error in action ${t}`), console.warn(n);
          }
        }
      }))
    )
  };
}, K = {
  setGameState: g("SET_GAMESTATE", (e) => ({ payload: e })),
  setCharacter: g("SET_CHARACTER", (e) => ({ payload: e })),
  setExploreMode: g("SET_EXPLORE", () => ({})),
  setIp: g("SET_IP", (e) => ({ payload: e }))
}, Sr = q(F, (e) => {
  e.addCase(K.setGameState, (t, r) => (t.gameState = r.payload, t)), e.addCase(K.setCharacter, (t, r) => (t.character = r.payload, t)), e.addCase(K.setExploreMode, (t) => (t.exploreMode = !0, t)), e.addCase(K.setIp, (t, r) => (r.payload !== "" ? localStorage.setItem("loginip", r.payload) : localStorage.removeItem("loginip"), t.ip = r.payload, t));
}), Q = {
  setLoginState: g("SET_LOGIN_STATE", (e) => ({ payload: e })),
  resetLoginState: g("RESET_LOGIN_STATE", () => ({})),
  setSelectedServer: g("SET_SERVER", (e) => ({ payload: e }))
}, Nr = q(F, (e) => {
  e.addCase(Q.setLoginState, (t, r) => (t.loginState = { ...t.loginState, ...r.payload }, t)), e.addCase(Q.resetLoginState, (t) => (t.loginState = F.loginState, t)), e.addCase(Q.setSelectedServer, (t, r) => (t.worldState.server = r.payload, t));
}), z = {
  setZoneInfo: g("SET_ZONE_INFO", (e) => ({ payload: e })),
  setZonePort: g("SET_ZONE_PORT", (e) => ({ payload: e })),
  addZoneSpawns: g("ADD_ZONE_SPAWNS", (e) => ({ payload: e })),
  clearZoneSpawns: g("CLEAR_ZONE_SPAWNS", () => ({})),
  removeZoneSpawns: g("REMOVE_ZONE_SPAWNS", (e) => ({ payload: e })),
  updateZoneSpawn: g("UPDATE_ZONE_SPAWN", (e) => ({ payload: e }))
}, Or = q(F, (e) => {
  e.addCase(z.setZoneInfo, (t, r) => (t.zoneInfo = r.payload, t)), e.addCase(z.setZonePort, (t, r) => (t.zonePort = r.payload, t)), e.addCase(z.addZoneSpawns, (t, r) => (t.zone.spawns.push(...r.payload), t)), e.addCase(z.clearZoneSpawns, (t) => (t.zone.spawns = [], t)), e.addCase(z.removeZoneSpawns, (t, r) => (t.zone.spawns = t.zone.spawns.filter((n) => !r.payload.some((o) => o.spawn_id === n.spawn_id)), t)), e.addCase(z.updateZoneSpawn, (t, r) => {
    const n = t.zone.spawns.findIndex((o) => o.spawn_id === r.payload.spawn_id);
    return n !== -1 && (t.zone.spawns[n] = { ...t.zone.spawns[n], ...r.payload }), t;
  });
}), W = {
  setSpawnOnScreen: g("SET_SPAWN_ON_SCREEN", (e) => ({ payload: e })),
  setSpawnOffScreen: g("SET_SPAWN_OFF_SCREEN", (e) => ({ payload: e })),
  setLoading: g("SET_LOADING", (e) => ({ payload: e })),
  setLoadingText: g("SET_LOADING_TEXT", (e) => ({ payload: e })),
  setLoadingTitle: g("SET_LOADING_TITLE", (e) => ({ payload: e }))
}, vr = q(F, (e) => {
  e.addCase(W.setSpawnOnScreen, (t, r) => (t.ui.visibleSpawns[r.payload.id] = r.payload, t)), e.addCase(W.setSpawnOffScreen, (t, r) => (delete t.ui.visibleSpawns[r.payload], t)), e.addCase(W.setLoading, (t, r) => (t.ui.loading = r.payload, t.ui.loading === !1 && (t.ui.loadingText = ""), t)), e.addCase(W.setLoadingText, (t, r) => (t.ui.loadingText = r.payload, t)), e.addCase(W.setLoadingTitle, (t, r) => (t.ui.loadingTitle = r.payload, t));
}), ve = {
  addChatLine: g("ADD_CHAT_LINE", (e) => ({ payload: e })),
  clearChat: g("CLEAR_CHAT", () => ({}))
}, Dr = q(F, (e) => {
  e.addCase(ve.addChatLine, (t, r) => (t.chat.chatLines.push(r.payload), t)), e.addCase(ve.clearChat, (t, r) => (t.chat.chatLines = [], t));
}), Tr = {
  ...K,
  ...Q,
  ...z,
  ...W,
  ...ve
}, Cr = () => {
  const { context: e, thunkActions: t } = gr();
  return Object.assign(
    t,
    ...Object.entries(Tr).map(([r, n]) => ({
      [r]() {
        window.GlobalStore.dispatch(n.call(e, ...arguments));
      }
    }))
  );
}, Ar = (e, t) => [
  vr,
  Or,
  Sr,
  Nr,
  Dr
].reduce((r, n) => window.rStore = n(r, t), e), ce = qt({
  devTools: !0,
  preloadedState: F,
  reducer: Ar
});
window.GlobalStore = ce;
lt({ GlobalStore: ce });
ce.actions = Cr();
const fe = oe.createContext(), Ir = Ae(fe), Vr = Er(fe), Pr = sr(fe), Mr = ({ children: e }) => oe.createElement(yr, {
  context: fe,
  store: ce,
  children: e
});
export {
  ce as G,
  kr as S,
  Ir as a,
  Vr as b,
  Mr as c,
  mr as d,
  F as e,
  Pr as u
};
//# sourceMappingURL=store-DFBjie6O.js.map
