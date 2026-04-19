import { aE as Ka, aF as Xa, r as re, aG as le, j as K } from "./embed-entry-BKE21f6Q.js";
import { u as Ya, P as er } from "./alerts-GO821xcX.js";
import { D as tr, a as nr, b as ar, S as Mt, T as tt, c as rr, d as sr, e as ir, f as Dt, g as de, h as or, C as lr, i as dr, B as Nt } from "./main-DYh_S6Pg.js";
var Jt = {}, rt = function(d, m) {
  return rt = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(A, O) {
    A.__proto__ = O;
  } || function(A, O) {
    for (var V in O) Object.prototype.hasOwnProperty.call(O, V) && (A[V] = O[V]);
  }, rt(d, m);
};
function It(d, m) {
  if (typeof m != "function" && m !== null)
    throw new TypeError("Class extends value " + String(m) + " is not a constructor or null");
  rt(d, m);
  function A() {
    this.constructor = d;
  }
  d.prototype = m === null ? Object.create(m) : (A.prototype = m.prototype, new A());
}
var Te = function() {
  return Te = Object.assign || function(m) {
    for (var A, O = 1, V = arguments.length; O < V; O++) {
      A = arguments[O];
      for (var n in A) Object.prototype.hasOwnProperty.call(A, n) && (m[n] = A[n]);
    }
    return m;
  }, Te.apply(this, arguments);
};
function zt(d, m) {
  var A = {};
  for (var O in d) Object.prototype.hasOwnProperty.call(d, O) && m.indexOf(O) < 0 && (A[O] = d[O]);
  if (d != null && typeof Object.getOwnPropertySymbols == "function")
    for (var V = 0, O = Object.getOwnPropertySymbols(d); V < O.length; V++)
      m.indexOf(O[V]) < 0 && Object.prototype.propertyIsEnumerable.call(d, O[V]) && (A[O[V]] = d[O[V]]);
  return A;
}
function $t(d, m, A, O) {
  var V = arguments.length, n = V < 3 ? m : O === null ? O = Object.getOwnPropertyDescriptor(m, A) : O, e;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(d, m, A, O);
  else for (var t = d.length - 1; t >= 0; t--) (e = d[t]) && (n = (V < 3 ? e(n) : V > 3 ? e(m, A, n) : e(m, A)) || n);
  return V > 3 && n && Object.defineProperty(m, A, n), n;
}
function Wt(d, m) {
  return function(A, O) {
    m(A, O, d);
  };
}
function Kt(d, m, A, O, V, n) {
  function e(f) {
    if (f !== void 0 && typeof f != "function") throw new TypeError("Function expected");
    return f;
  }
  for (var t = O.kind, a = t === "getter" ? "get" : t === "setter" ? "set" : "value", r = !m && d ? O.static ? d : d.prototype : null, s = m || (r ? Object.getOwnPropertyDescriptor(r, O.name) : {}), i, l = !1, h = A.length - 1; h >= 0; h--) {
    var p = {};
    for (var c in O) p[c] = c === "access" ? {} : O[c];
    for (var c in O.access) p.access[c] = O.access[c];
    p.addInitializer = function(f) {
      if (l) throw new TypeError("Cannot add initializers after decoration has completed");
      n.push(e(f || null));
    };
    var u = (0, A[h])(t === "accessor" ? { get: s.get, set: s.set } : s[a], p);
    if (t === "accessor") {
      if (u === void 0) continue;
      if (u === null || typeof u != "object") throw new TypeError("Object expected");
      (i = e(u.get)) && (s.get = i), (i = e(u.set)) && (s.set = i), (i = e(u.init)) && V.unshift(i);
    } else (i = e(u)) && (t === "field" ? V.unshift(i) : s[a] = i);
  }
  r && Object.defineProperty(r, O.name, s), l = !0;
}
function Xt(d, m, A) {
  for (var O = arguments.length > 2, V = 0; V < m.length; V++)
    A = O ? m[V].call(d, A) : m[V].call(d);
  return O ? A : void 0;
}
function Yt(d) {
  return typeof d == "symbol" ? d : "".concat(d);
}
function en(d, m, A) {
  return typeof m == "symbol" && (m = m.description ? "[".concat(m.description, "]") : ""), Object.defineProperty(d, "name", { configurable: !0, value: A ? "".concat(A, " ", m) : m });
}
function tn(d, m) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function") return Reflect.metadata(d, m);
}
function nn(d, m, A, O) {
  function V(n) {
    return n instanceof A ? n : new A(function(e) {
      e(n);
    });
  }
  return new (A || (A = Promise))(function(n, e) {
    function t(s) {
      try {
        r(O.next(s));
      } catch (i) {
        e(i);
      }
    }
    function a(s) {
      try {
        r(O.throw(s));
      } catch (i) {
        e(i);
      }
    }
    function r(s) {
      s.done ? n(s.value) : V(s.value).then(t, a);
    }
    r((O = O.apply(d, m || [])).next());
  });
}
function an(d, m) {
  var A = { label: 0, sent: function() {
    if (n[0] & 1) throw n[1];
    return n[1];
  }, trys: [], ops: [] }, O, V, n, e = Object.create((typeof Iterator == "function" ? Iterator : Object).prototype);
  return e.next = t(0), e.throw = t(1), e.return = t(2), typeof Symbol == "function" && (e[Symbol.iterator] = function() {
    return this;
  }), e;
  function t(r) {
    return function(s) {
      return a([r, s]);
    };
  }
  function a(r) {
    if (O) throw new TypeError("Generator is already executing.");
    for (; e && (e = 0, r[0] && (A = 0)), A; ) try {
      if (O = 1, V && (n = r[0] & 2 ? V.return : r[0] ? V.throw || ((n = V.return) && n.call(V), 0) : V.next) && !(n = n.call(V, r[1])).done) return n;
      switch (V = 0, n && (r = [r[0] & 2, n.value]), r[0]) {
        case 0:
        case 1:
          n = r;
          break;
        case 4:
          return A.label++, { value: r[1], done: !1 };
        case 5:
          A.label++, V = r[1], r = [0];
          continue;
        case 7:
          r = A.ops.pop(), A.trys.pop();
          continue;
        default:
          if (n = A.trys, !(n = n.length > 0 && n[n.length - 1]) && (r[0] === 6 || r[0] === 2)) {
            A = 0;
            continue;
          }
          if (r[0] === 3 && (!n || r[1] > n[0] && r[1] < n[3])) {
            A.label = r[1];
            break;
          }
          if (r[0] === 6 && A.label < n[1]) {
            A.label = n[1], n = r;
            break;
          }
          if (n && A.label < n[2]) {
            A.label = n[2], A.ops.push(r);
            break;
          }
          n[2] && A.ops.pop(), A.trys.pop();
          continue;
      }
      r = m.call(d, A);
    } catch (s) {
      r = [6, s], V = 0;
    } finally {
      O = n = 0;
    }
    if (r[0] & 5) throw r[1];
    return { value: r[0] ? r[1] : void 0, done: !0 };
  }
}
var Be = Object.create ? function(d, m, A, O) {
  O === void 0 && (O = A);
  var V = Object.getOwnPropertyDescriptor(m, A);
  (!V || ("get" in V ? !m.__esModule : V.writable || V.configurable)) && (V = { enumerable: !0, get: function() {
    return m[A];
  } }), Object.defineProperty(d, O, V);
} : function(d, m, A, O) {
  O === void 0 && (O = A), d[O] = m[A];
};
function rn(d, m) {
  for (var A in d) A !== "default" && !Object.prototype.hasOwnProperty.call(m, A) && Be(m, d, A);
}
function Ue(d) {
  var m = typeof Symbol == "function" && Symbol.iterator, A = m && d[m], O = 0;
  if (A) return A.call(d);
  if (d && typeof d.length == "number") return {
    next: function() {
      return d && O >= d.length && (d = void 0), { value: d && d[O++], done: !d };
    }
  };
  throw new TypeError(m ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function it(d, m) {
  var A = typeof Symbol == "function" && d[Symbol.iterator];
  if (!A) return d;
  var O = A.call(d), V, n = [], e;
  try {
    for (; (m === void 0 || m-- > 0) && !(V = O.next()).done; ) n.push(V.value);
  } catch (t) {
    e = { error: t };
  } finally {
    try {
      V && !V.done && (A = O.return) && A.call(O);
    } finally {
      if (e) throw e.error;
    }
  }
  return n;
}
function sn() {
  for (var d = [], m = 0; m < arguments.length; m++)
    d = d.concat(it(arguments[m]));
  return d;
}
function on() {
  for (var d = 0, m = 0, A = arguments.length; m < A; m++) d += arguments[m].length;
  for (var O = Array(d), V = 0, m = 0; m < A; m++)
    for (var n = arguments[m], e = 0, t = n.length; e < t; e++, V++)
      O[V] = n[e];
  return O;
}
function ln(d, m, A) {
  if (A || arguments.length === 2) for (var O = 0, V = m.length, n; O < V; O++)
    (n || !(O in m)) && (n || (n = Array.prototype.slice.call(m, 0, O)), n[O] = m[O]);
  return d.concat(n || Array.prototype.slice.call(m));
}
function Oe(d) {
  return this instanceof Oe ? (this.v = d, this) : new Oe(d);
}
function dn(d, m, A) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var O = A.apply(d, m || []), V, n = [];
  return V = Object.create((typeof AsyncIterator == "function" ? AsyncIterator : Object).prototype), t("next"), t("throw"), t("return", e), V[Symbol.asyncIterator] = function() {
    return this;
  }, V;
  function e(h) {
    return function(p) {
      return Promise.resolve(p).then(h, i);
    };
  }
  function t(h, p) {
    O[h] && (V[h] = function(c) {
      return new Promise(function(u, f) {
        n.push([h, c, u, f]) > 1 || a(h, c);
      });
    }, p && (V[h] = p(V[h])));
  }
  function a(h, p) {
    try {
      r(O[h](p));
    } catch (c) {
      l(n[0][3], c);
    }
  }
  function r(h) {
    h.value instanceof Oe ? Promise.resolve(h.value.v).then(s, i) : l(n[0][2], h);
  }
  function s(h) {
    a("next", h);
  }
  function i(h) {
    a("throw", h);
  }
  function l(h, p) {
    h(p), n.shift(), n.length && a(n[0][0], n[0][1]);
  }
}
function cn(d) {
  var m, A;
  return m = {}, O("next"), O("throw", function(V) {
    throw V;
  }), O("return"), m[Symbol.iterator] = function() {
    return this;
  }, m;
  function O(V, n) {
    m[V] = d[V] ? function(e) {
      return (A = !A) ? { value: Oe(d[V](e)), done: !1 } : n ? n(e) : e;
    } : n;
  }
}
function un(d) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = d[Symbol.asyncIterator], A;
  return m ? m.call(d) : (d = typeof Ue == "function" ? Ue(d) : d[Symbol.iterator](), A = {}, O("next"), O("throw"), O("return"), A[Symbol.asyncIterator] = function() {
    return this;
  }, A);
  function O(n) {
    A[n] = d[n] && function(e) {
      return new Promise(function(t, a) {
        e = d[n](e), V(t, a, e.done, e.value);
      });
    };
  }
  function V(n, e, t, a) {
    Promise.resolve(a).then(function(r) {
      n({ value: r, done: t });
    }, e);
  }
}
function hn(d, m) {
  return Object.defineProperty ? Object.defineProperty(d, "raw", { value: m }) : d.raw = m, d;
}
var cr = Object.create ? function(d, m) {
  Object.defineProperty(d, "default", { enumerable: !0, value: m });
} : function(d, m) {
  d.default = m;
}, st = function(d) {
  return st = Object.getOwnPropertyNames || function(m) {
    var A = [];
    for (var O in m) Object.prototype.hasOwnProperty.call(m, O) && (A[A.length] = O);
    return A;
  }, st(d);
};
function pn(d) {
  if (d && d.__esModule) return d;
  var m = {};
  if (d != null) for (var A = st(d), O = 0; O < A.length; O++) A[O] !== "default" && Be(m, d, A[O]);
  return cr(m, d), m;
}
function fn(d) {
  return d && d.__esModule ? d : { default: d };
}
function bn(d, m, A, O) {
  if (A === "a" && !O) throw new TypeError("Private accessor was defined without a getter");
  if (typeof m == "function" ? d !== m || !O : !m.has(d)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return A === "m" ? O : A === "a" ? O.call(d) : O ? O.value : m.get(d);
}
function mn(d, m, A, O, V) {
  if (O === "m") throw new TypeError("Private method is not writable");
  if (O === "a" && !V) throw new TypeError("Private accessor was defined without a setter");
  if (typeof m == "function" ? d !== m || !V : !m.has(d)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return O === "a" ? V.call(d, A) : V ? V.value = A : m.set(d, A), A;
}
function On(d, m) {
  if (m === null || typeof m != "object" && typeof m != "function") throw new TypeError("Cannot use 'in' operator on non-object");
  return typeof d == "function" ? m === d : d.has(m);
}
function wn(d, m, A) {
  if (m != null) {
    if (typeof m != "object" && typeof m != "function") throw new TypeError("Object expected.");
    var O, V;
    if (A) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      O = m[Symbol.asyncDispose];
    }
    if (O === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      O = m[Symbol.dispose], A && (V = O);
    }
    if (typeof O != "function") throw new TypeError("Object not disposable.");
    V && (O = function() {
      try {
        V.call(this);
      } catch (n) {
        return Promise.reject(n);
      }
    }), d.stack.push({ value: m, dispose: O, async: A });
  } else A && d.stack.push({ async: !0 });
  return m;
}
var ur = typeof SuppressedError == "function" ? SuppressedError : function(d, m, A) {
  var O = new Error(A);
  return O.name = "SuppressedError", O.error = d, O.suppressed = m, O;
};
function gn(d) {
  function m(n) {
    d.error = d.hasError ? new ur(n, d.error, "An error was suppressed during disposal.") : n, d.hasError = !0;
  }
  var A, O = 0;
  function V() {
    for (; A = d.stack.pop(); )
      try {
        if (!A.async && O === 1) return O = 0, d.stack.push(A), Promise.resolve().then(V);
        if (A.dispose) {
          var n = A.dispose.call(A.value);
          if (A.async) return O |= 2, Promise.resolve(n).then(V, function(e) {
            return m(e), V();
          });
        } else O |= 1;
      } catch (e) {
        m(e);
      }
    if (O === 1) return d.hasError ? Promise.reject(d.error) : Promise.resolve();
    if (d.hasError) throw d.error;
  }
  return V();
}
function yn(d, m) {
  return typeof d == "string" && /^\.\.?\//.test(d) ? d.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(A, O, V, n, e) {
    return O ? m ? ".jsx" : ".js" : V && (!n || !e) ? A : V + n + "." + e.toLowerCase() + "js";
  }) : d;
}
const hr = {
  __extends: It,
  __assign: Te,
  __rest: zt,
  __decorate: $t,
  __param: Wt,
  __esDecorate: Kt,
  __runInitializers: Xt,
  __propKey: Yt,
  __setFunctionName: en,
  __metadata: tn,
  __awaiter: nn,
  __generator: an,
  __createBinding: Be,
  __exportStar: rn,
  __values: Ue,
  __read: it,
  __spread: sn,
  __spreadArrays: on,
  __spreadArray: ln,
  __await: Oe,
  __asyncGenerator: dn,
  __asyncDelegator: cn,
  __asyncValues: un,
  __makeTemplateObject: hn,
  __importStar: pn,
  __importDefault: fn,
  __classPrivateFieldGet: bn,
  __classPrivateFieldSet: mn,
  __classPrivateFieldIn: On,
  __addDisposableResource: wn,
  __disposeResources: gn,
  __rewriteRelativeImportExtension: yn
}, pr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __addDisposableResource: wn,
  get __assign() {
    return Te;
  },
  __asyncDelegator: cn,
  __asyncGenerator: dn,
  __asyncValues: un,
  __await: Oe,
  __awaiter: nn,
  __classPrivateFieldGet: bn,
  __classPrivateFieldIn: On,
  __classPrivateFieldSet: mn,
  __createBinding: Be,
  __decorate: $t,
  __disposeResources: gn,
  __esDecorate: Kt,
  __exportStar: rn,
  __extends: It,
  __generator: an,
  __importDefault: fn,
  __importStar: pn,
  __makeTemplateObject: hn,
  __metadata: tn,
  __param: Wt,
  __propKey: Yt,
  __read: it,
  __rest: zt,
  __rewriteRelativeImportExtension: yn,
  __runInitializers: Xt,
  __setFunctionName: en,
  __spread: sn,
  __spreadArray: ln,
  __spreadArrays: on,
  __values: Ue,
  default: hr
}, Symbol.toStringTag, { value: "Module" })), N = /* @__PURE__ */ Ka(pr);
var nt, Zt;
function Z() {
  if (Zt) return nt;
  Zt = 1;
  function d(w, g) {
    return function() {
      return w.apply(g, arguments);
    };
  }
  const { toString: m } = Object.prototype, { getPrototypeOf: A } = Object, O = /* @__PURE__ */ ((w) => (g) => {
    const S = m.call(g);
    return w[S] || (w[S] = S.slice(8, -1).toLowerCase());
  })(/* @__PURE__ */ Object.create(null)), V = (w) => (w = w.toLowerCase(), (g) => O(g) === w), n = (w) => (g) => typeof g === w, { isArray: e } = Array, t = n("undefined");
  function a(w) {
    return w !== null && !t(w) && w.constructor !== null && !t(w.constructor) && l(w.constructor.isBuffer) && w.constructor.isBuffer(w);
  }
  const r = V("ArrayBuffer");
  function s(w) {
    let g;
    return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? g = ArrayBuffer.isView(w) : g = w && w.buffer && r(w.buffer), g;
  }
  const i = n("string"), l = n("function"), h = n("number"), p = (w) => w !== null && typeof w == "object", c = (w) => w === !0 || w === !1, u = (w) => {
    if (O(w) !== "object")
      return !1;
    const g = A(w);
    return (g === null || g === Object.prototype || Object.getPrototypeOf(g) === null) && !(Symbol.toStringTag in w) && !(Symbol.iterator in w);
  }, f = V("Date"), o = V("File"), y = V("Blob"), E = V("FileList"), b = (w) => p(w) && l(w.pipe), R = (w) => {
    let g;
    return w && (typeof FormData == "function" && w instanceof FormData || l(w.append) && ((g = O(w)) === "formdata" || // detect form-data instance
    g === "object" && l(w.toString) && w.toString() === "[object FormData]"));
  }, q = V("URLSearchParams"), [v, ke, Le, ye] = ["ReadableStream", "Request", "Response", "Headers"].map(V), Ge = (w) => w.trim ? w.trim() : w.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
  function ie(w, g, { allOwnKeys: S = !1 } = {}) {
    if (w === null || typeof w > "u")
      return;
    let j, P;
    if (typeof w != "object" && (w = [w]), e(w))
      for (j = 0, P = w.length; j < P; j++)
        g.call(null, w[j], j, w);
    else {
      const _ = S ? Object.getOwnPropertyNames(w) : Object.keys(w), C = _.length;
      let T;
      for (j = 0; j < C; j++)
        T = _[j], g.call(null, w[T], T, w);
    }
  }
  function ue(w, g) {
    g = g.toLowerCase();
    const S = Object.keys(w);
    let j = S.length, P;
    for (; j-- > 0; )
      if (P = S[j], g === P.toLowerCase())
        return P;
    return null;
  }
  const ee = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : Xa, be = (w) => !t(w) && w !== ee;
  function te() {
    const { caseless: w } = be(this) && this || {}, g = {}, S = (j, P) => {
      const _ = w && ue(g, P) || P;
      u(g[_]) && u(j) ? g[_] = te(g[_], j) : u(j) ? g[_] = te({}, j) : e(j) ? g[_] = j.slice() : g[_] = j;
    };
    for (let j = 0, P = arguments.length; j < P; j++)
      arguments[j] && ie(arguments[j], S);
    return g;
  }
  const we = (w, g, S, { allOwnKeys: j } = {}) => (ie(g, (P, _) => {
    S && l(P) ? w[_] = d(P, S) : w[_] = P;
  }, { allOwnKeys: j }), w), he = (w) => (w.charCodeAt(0) === 65279 && (w = w.slice(1)), w), Ae = (w, g, S, j) => {
    w.prototype = Object.create(g.prototype, j), w.prototype.constructor = w, Object.defineProperty(w, "super", {
      value: g.prototype
    }), S && Object.assign(w.prototype, S);
  }, He = (w, g, S, j) => {
    let P, _, C;
    const T = {};
    if (g = g || {}, w == null) return g;
    do {
      for (P = Object.getOwnPropertyNames(w), _ = P.length; _-- > 0; )
        C = P[_], (!j || j(C, w, g)) && !T[C] && (g[C] = w[C], T[C] = !0);
      w = S !== !1 && A(w);
    } while (w && (!S || S(w, g)) && w !== Object.prototype);
    return g;
  }, xe = (w, g, S) => {
    w = String(w), (S === void 0 || S > w.length) && (S = w.length), S -= g.length;
    const j = w.indexOf(g, S);
    return j !== -1 && j === S;
  }, Dn = (w) => {
    if (!w) return null;
    if (e(w)) return w;
    let g = w.length;
    if (!h(g)) return null;
    const S = new Array(g);
    for (; g-- > 0; )
      S[g] = w[g];
    return S;
  }, Nn = /* @__PURE__ */ ((w) => (g) => w && g instanceof w)(typeof Uint8Array < "u" && A(Uint8Array)), Zn = (w, g) => {
    const j = (w && w[Symbol.iterator]).call(w);
    let P;
    for (; (P = j.next()) && !P.done; ) {
      const _ = P.value;
      g.call(w, _[0], _[1]);
    }
  }, Qn = (w, g) => {
    let S;
    const j = [];
    for (; (S = w.exec(g)) !== null; )
      j.push(S);
    return j;
  }, Jn = V("HTMLFormElement"), In = (w) => w.toLowerCase().replace(
    /[-_\s]([a-z\d])(\w*)/g,
    function(S, j, P) {
      return j.toUpperCase() + P;
    }
  ), ot = (({ hasOwnProperty: w }) => (g, S) => w.call(g, S))(Object.prototype), zn = V("RegExp"), lt = (w, g) => {
    const S = Object.getOwnPropertyDescriptors(w), j = {};
    ie(S, (P, _) => {
      let C;
      (C = g(P, _, w)) !== !1 && (j[_] = C || P);
    }), Object.defineProperties(w, j);
  }, $n = (w) => {
    lt(w, (g, S) => {
      if (l(w) && ["arguments", "caller", "callee"].indexOf(S) !== -1)
        return !1;
      const j = w[S];
      if (l(j)) {
        if (g.enumerable = !1, "writable" in g) {
          g.writable = !1;
          return;
        }
        g.set || (g.set = () => {
          throw Error("Can not rewrite read-only method '" + S + "'");
        });
      }
    });
  }, Wn = (w, g) => {
    const S = {}, j = (P) => {
      P.forEach((_) => {
        S[_] = !0;
      });
    };
    return e(w) ? j(w) : j(String(w).split(g)), S;
  }, Kn = () => {
  }, Xn = (w, g) => w != null && Number.isFinite(w = +w) ? w : g, Me = "abcdefghijklmnopqrstuvwxyz", dt = "0123456789", ct = {
    DIGIT: dt,
    ALPHA: Me,
    ALPHA_DIGIT: Me + Me.toUpperCase() + dt
  }, Yn = (w = 16, g = ct.ALPHA_DIGIT) => {
    let S = "";
    const { length: j } = g;
    for (; w--; )
      S += g[Math.random() * j | 0];
    return S;
  };
  function ea(w) {
    return !!(w && l(w.append) && w[Symbol.toStringTag] === "FormData" && w[Symbol.iterator]);
  }
  const ta = (w) => {
    const g = new Array(10), S = (j, P) => {
      if (p(j)) {
        if (g.indexOf(j) >= 0)
          return;
        if (!("toJSON" in j)) {
          g[P] = j;
          const _ = e(j) ? [] : {};
          return ie(j, (C, T) => {
            const k = S(C, P + 1);
            !t(k) && (_[T] = k);
          }), g[P] = void 0, _;
        }
      }
      return j;
    };
    return S(w, 0);
  }, na = V("AsyncFunction"), aa = (w) => w && (p(w) || l(w)) && l(w.then) && l(w.catch), ut = ((w, g) => w ? setImmediate : g ? ((S, j) => (ee.addEventListener("message", ({ source: P, data: _ }) => {
    P === ee && _ === S && j.length && j.shift()();
  }, !1), (P) => {
    j.push(P), ee.postMessage(S, "*");
  }))(`axios@${Math.random()}`, []) : (S) => setTimeout(S))(
    typeof setImmediate == "function",
    l(ee.postMessage)
  ), ra = typeof queueMicrotask < "u" ? queueMicrotask.bind(ee) : typeof process < "u" && process.nextTick || ut;
  var F = {
    isArray: e,
    isArrayBuffer: r,
    isBuffer: a,
    isFormData: R,
    isArrayBufferView: s,
    isString: i,
    isNumber: h,
    isBoolean: c,
    isObject: p,
    isPlainObject: u,
    isReadableStream: v,
    isRequest: ke,
    isResponse: Le,
    isHeaders: ye,
    isUndefined: t,
    isDate: f,
    isFile: o,
    isBlob: y,
    isRegExp: zn,
    isFunction: l,
    isStream: b,
    isURLSearchParams: q,
    isTypedArray: Nn,
    isFileList: E,
    forEach: ie,
    merge: te,
    extend: we,
    trim: Ge,
    stripBOM: he,
    inherits: Ae,
    toFlatObject: He,
    kindOf: O,
    kindOfTest: V,
    endsWith: xe,
    toArray: Dn,
    forEachEntry: Zn,
    matchAll: Qn,
    isHTMLForm: Jn,
    hasOwnProperty: ot,
    hasOwnProp: ot,
    // an alias to avoid ESLint no-prototype-builtins detection
    reduceDescriptors: lt,
    freezeMethods: $n,
    toObjectSet: Wn,
    toCamelCase: In,
    noop: Kn,
    toFiniteNumber: Xn,
    findKey: ue,
    global: ee,
    isContextDefined: be,
    ALPHABET: ct,
    generateString: Yn,
    isSpecCompliantForm: ea,
    toJSONObject: ta,
    isAsyncFn: na,
    isThenable: aa,
    setImmediate: ut,
    asap: ra
  };
  function x(w, g, S, j, P) {
    Error.call(this), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack, this.message = w, this.name = "AxiosError", g && (this.code = g), S && (this.config = S), j && (this.request = j), P && (this.response = P, this.status = P.status ? P.status : null);
  }
  F.inherits(x, Error, {
    toJSON: function() {
      return {
        // Standard
        message: this.message,
        name: this.name,
        // Microsoft
        description: this.description,
        number: this.number,
        // Mozilla
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        // Axios
        config: F.toJSONObject(this.config),
        code: this.code,
        status: this.status
      };
    }
  });
  const ht = x.prototype, pt = {};
  [
    "ERR_BAD_OPTION_VALUE",
    "ERR_BAD_OPTION",
    "ECONNABORTED",
    "ETIMEDOUT",
    "ERR_NETWORK",
    "ERR_FR_TOO_MANY_REDIRECTS",
    "ERR_DEPRECATED",
    "ERR_BAD_RESPONSE",
    "ERR_BAD_REQUEST",
    "ERR_CANCELED",
    "ERR_NOT_SUPPORT",
    "ERR_INVALID_URL"
    // eslint-disable-next-line func-names
  ].forEach((w) => {
    pt[w] = { value: w };
  }), Object.defineProperties(x, pt), Object.defineProperty(ht, "isAxiosError", { value: !0 }), x.from = (w, g, S, j, P, _) => {
    const C = Object.create(ht);
    return F.toFlatObject(w, C, function(k) {
      return k !== Error.prototype;
    }, (T) => T !== "isAxiosError"), x.call(C, w.message, g, S, j, P), C.cause = w, C.name = w.name, _ && Object.assign(C, _), C;
  };
  var sa = null;
  function De(w) {
    return F.isPlainObject(w) || F.isArray(w);
  }
  function ft(w) {
    return F.endsWith(w, "[]") ? w.slice(0, -2) : w;
  }
  function bt(w, g, S) {
    return w ? w.concat(g).map(function(P, _) {
      return P = ft(P), !S && _ ? "[" + P + "]" : P;
    }).join(S ? "." : "") : g;
  }
  function ia(w) {
    return F.isArray(w) && !w.some(De);
  }
  const oa = F.toFlatObject(F, {}, null, function(g) {
    return /^is[A-Z]/.test(g);
  });
  function Se(w, g, S) {
    if (!F.isObject(w))
      throw new TypeError("target must be an object");
    g = g || new FormData(), S = F.toFlatObject(S, {
      metaTokens: !0,
      dots: !1,
      indexes: !1
    }, !1, function(M, H) {
      return !F.isUndefined(H[M]);
    });
    const j = S.metaTokens, P = S.visitor || B, _ = S.dots, C = S.indexes, k = (S.Blob || typeof Blob < "u" && Blob) && F.isSpecCompliantForm(g);
    if (!F.isFunction(P))
      throw new TypeError("visitor must be a function");
    function U(G) {
      if (G === null) return "";
      if (F.isDate(G))
        return G.toISOString();
      if (!k && F.isBlob(G))
        throw new x("Blob is not supported. Use a Buffer instead.");
      return F.isArrayBuffer(G) || F.isTypedArray(G) ? k && typeof Blob == "function" ? new Blob([G]) : Buffer.from(G) : G;
    }
    function B(G, M, H) {
      let J = G;
      if (G && !H && typeof G == "object") {
        if (F.endsWith(M, "{}"))
          M = j ? M : M.slice(0, -2), G = JSON.stringify(G);
        else if (F.isArray(G) && ia(G) || (F.isFileList(G) || F.endsWith(M, "[]")) && (J = F.toArray(G)))
          return M = ft(M), J.forEach(function(W, se) {
            !(F.isUndefined(W) || W === null) && g.append(
              // eslint-disable-next-line no-nested-ternary
              C === !0 ? bt([M], se, _) : C === null ? M : M + "[]",
              U(W)
            );
          }), !1;
      }
      return De(G) ? !0 : (g.append(bt(H, M, _), U(G)), !1);
    }
    const L = [], D = Object.assign(oa, {
      defaultVisitor: B,
      convertValue: U,
      isVisitable: De
    });
    function z(G, M) {
      if (!F.isUndefined(G)) {
        if (L.indexOf(G) !== -1)
          throw Error("Circular reference detected in " + M.join("."));
        L.push(G), F.forEach(G, function(J, $) {
          (!(F.isUndefined(J) || J === null) && P.call(
            g,
            J,
            F.isString($) ? $.trim() : $,
            M,
            D
          )) === !0 && z(J, M ? M.concat($) : [$]);
        }), L.pop();
      }
    }
    if (!F.isObject(w))
      throw new TypeError("data must be an object");
    return z(w), g;
  }
  function mt(w) {
    const g = {
      "!": "%21",
      "'": "%27",
      "(": "%28",
      ")": "%29",
      "~": "%7E",
      "%20": "+",
      "%00": "\0"
    };
    return encodeURIComponent(w).replace(/[!'()~]|%20|%00/g, function(j) {
      return g[j];
    });
  }
  function Ne(w, g) {
    this._pairs = [], w && Se(w, this, g);
  }
  const Ot = Ne.prototype;
  Ot.append = function(g, S) {
    this._pairs.push([g, S]);
  }, Ot.toString = function(g) {
    const S = g ? function(j) {
      return g.call(this, j, mt);
    } : mt;
    return this._pairs.map(function(P) {
      return S(P[0]) + "=" + S(P[1]);
    }, "").join("&");
  };
  function la(w) {
    return encodeURIComponent(w).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
  }
  function wt(w, g, S) {
    if (!g)
      return w;
    const j = S && S.encode || la;
    F.isFunction(S) && (S = {
      serialize: S
    });
    const P = S && S.serialize;
    let _;
    if (P ? _ = P(g, S) : _ = F.isURLSearchParams(g) ? g.toString() : new Ne(g, S).toString(j), _) {
      const C = w.indexOf("#");
      C !== -1 && (w = w.slice(0, C)), w += (w.indexOf("?") === -1 ? "?" : "&") + _;
    }
    return w;
  }
  class da {
    constructor() {
      this.handlers = [];
    }
    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    use(g, S, j) {
      return this.handlers.push({
        fulfilled: g,
        rejected: S,
        synchronous: j ? j.synchronous : !1,
        runWhen: j ? j.runWhen : null
      }), this.handlers.length - 1;
    }
    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     *
     * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
     */
    eject(g) {
      this.handlers[g] && (this.handlers[g] = null);
    }
    /**
     * Clear all interceptors from the stack
     *
     * @returns {void}
     */
    clear() {
      this.handlers && (this.handlers = []);
    }
    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     *
     * @returns {void}
     */
    forEach(g) {
      F.forEach(this.handlers, function(j) {
        j !== null && g(j);
      });
    }
  }
  var gt = da, yt = {
    silentJSONParsing: !0,
    forcedJSONParsing: !0,
    clarifyTimeoutError: !1
  }, ca = typeof URLSearchParams < "u" ? URLSearchParams : Ne, ua = typeof FormData < "u" ? FormData : null, ha = typeof Blob < "u" ? Blob : null, pa = {
    isBrowser: !0,
    classes: {
      URLSearchParams: ca,
      FormData: ua,
      Blob: ha
    },
    protocols: ["http", "https", "file", "blob", "url", "data"]
  };
  const Ze = typeof window < "u" && typeof document < "u", Qe = typeof navigator == "object" && navigator || void 0, fa = Ze && (!Qe || ["ReactNative", "NativeScript", "NS"].indexOf(Qe.product) < 0), ba = typeof WorkerGlobalScope < "u" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts == "function", ma = Ze && window.location.href || "http://localhost";
  var Oa = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    hasBrowserEnv: Ze,
    hasStandardBrowserWebWorkerEnv: ba,
    hasStandardBrowserEnv: fa,
    navigator: Qe,
    origin: ma
  }), X = {
    ...Oa,
    ...pa
  };
  function wa(w, g) {
    return Se(w, new X.classes.URLSearchParams(), Object.assign({
      visitor: function(S, j, P, _) {
        return X.isNode && F.isBuffer(S) ? (this.append(j, S.toString("base64")), !1) : _.defaultVisitor.apply(this, arguments);
      }
    }, g));
  }
  function ga(w) {
    return F.matchAll(/\w+|\[(\w*)]/g, w).map((g) => g[0] === "[]" ? "" : g[1] || g[0]);
  }
  function ya(w) {
    const g = {}, S = Object.keys(w);
    let j;
    const P = S.length;
    let _;
    for (j = 0; j < P; j++)
      _ = S[j], g[_] = w[_];
    return g;
  }
  function At(w) {
    function g(S, j, P, _) {
      let C = S[_++];
      if (C === "__proto__") return !0;
      const T = Number.isFinite(+C), k = _ >= S.length;
      return C = !C && F.isArray(P) ? P.length : C, k ? (F.hasOwnProp(P, C) ? P[C] = [P[C], j] : P[C] = j, !T) : ((!P[C] || !F.isObject(P[C])) && (P[C] = []), g(S, j, P[C], _) && F.isArray(P[C]) && (P[C] = ya(P[C])), !T);
    }
    if (F.isFormData(w) && F.isFunction(w.entries)) {
      const S = {};
      return F.forEachEntry(w, (j, P) => {
        g(ga(j), P, S, 0);
      }), S;
    }
    return null;
  }
  function Aa(w, g, S) {
    if (F.isString(w))
      try {
        return (g || JSON.parse)(w), F.trim(w);
      } catch (j) {
        if (j.name !== "SyntaxError")
          throw j;
      }
    return (S || JSON.stringify)(w);
  }
  const Je = {
    transitional: yt,
    adapter: ["xhr", "http", "fetch"],
    transformRequest: [function(g, S) {
      const j = S.getContentType() || "", P = j.indexOf("application/json") > -1, _ = F.isObject(g);
      if (_ && F.isHTMLForm(g) && (g = new FormData(g)), F.isFormData(g))
        return P ? JSON.stringify(At(g)) : g;
      if (F.isArrayBuffer(g) || F.isBuffer(g) || F.isStream(g) || F.isFile(g) || F.isBlob(g) || F.isReadableStream(g))
        return g;
      if (F.isArrayBufferView(g))
        return g.buffer;
      if (F.isURLSearchParams(g))
        return S.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), g.toString();
      let T;
      if (_) {
        if (j.indexOf("application/x-www-form-urlencoded") > -1)
          return wa(g, this.formSerializer).toString();
        if ((T = F.isFileList(g)) || j.indexOf("multipart/form-data") > -1) {
          const k = this.env && this.env.FormData;
          return Se(
            T ? { "files[]": g } : g,
            k && new k(),
            this.formSerializer
          );
        }
      }
      return _ || P ? (S.setContentType("application/json", !1), Aa(g)) : g;
    }],
    transformResponse: [function(g) {
      const S = this.transitional || Je.transitional, j = S && S.forcedJSONParsing, P = this.responseType === "json";
      if (F.isResponse(g) || F.isReadableStream(g))
        return g;
      if (g && F.isString(g) && (j && !this.responseType || P)) {
        const C = !(S && S.silentJSONParsing) && P;
        try {
          return JSON.parse(g);
        } catch (T) {
          if (C)
            throw T.name === "SyntaxError" ? x.from(T, x.ERR_BAD_RESPONSE, this, null, this.response) : T;
        }
      }
      return g;
    }],
    /**
     * A timeout in milliseconds to abort a request. If set to 0 (default) a
     * timeout is not created.
     */
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1,
    maxBodyLength: -1,
    env: {
      FormData: X.classes.FormData,
      Blob: X.classes.Blob
    },
    validateStatus: function(g) {
      return g >= 200 && g < 300;
    },
    headers: {
      common: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": void 0
      }
    }
  };
  F.forEach(["delete", "get", "head", "post", "put", "patch"], (w) => {
    Je.headers[w] = {};
  });
  var Ie = Je;
  const Sa = F.toObjectSet([
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "user-agent"
  ]);
  var ja = (w) => {
    const g = {};
    let S, j, P;
    return w && w.split(`
`).forEach(function(C) {
      P = C.indexOf(":"), S = C.substring(0, P).trim().toLowerCase(), j = C.substring(P + 1).trim(), !(!S || g[S] && Sa[S]) && (S === "set-cookie" ? g[S] ? g[S].push(j) : g[S] = [j] : g[S] = g[S] ? g[S] + ", " + j : j);
    }), g;
  };
  const St = Symbol("internals");
  function ge(w) {
    return w && String(w).trim().toLowerCase();
  }
  function je(w) {
    return w === !1 || w == null ? w : F.isArray(w) ? w.map(je) : String(w);
  }
  function va(w) {
    const g = /* @__PURE__ */ Object.create(null), S = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
    let j;
    for (; j = S.exec(w); )
      g[j[1]] = j[2];
    return g;
  }
  const Pa = (w) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(w.trim());
  function ze(w, g, S, j, P) {
    if (F.isFunction(j))
      return j.call(this, g, S);
    if (P && (g = S), !!F.isString(g)) {
      if (F.isString(j))
        return g.indexOf(j) !== -1;
      if (F.isRegExp(j))
        return j.test(g);
    }
  }
  function Ra(w) {
    return w.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (g, S, j) => S.toUpperCase() + j);
  }
  function _a(w, g) {
    const S = F.toCamelCase(" " + g);
    ["get", "set", "has"].forEach((j) => {
      Object.defineProperty(w, j + S, {
        value: function(P, _, C) {
          return this[j].call(this, g, P, _, C);
        },
        configurable: !0
      });
    });
  }
  class ve {
    constructor(g) {
      g && this.set(g);
    }
    set(g, S, j) {
      const P = this;
      function _(T, k, U) {
        const B = ge(k);
        if (!B)
          throw new Error("header name must be a non-empty string");
        const L = F.findKey(P, B);
        (!L || P[L] === void 0 || U === !0 || U === void 0 && P[L] !== !1) && (P[L || k] = je(T));
      }
      const C = (T, k) => F.forEach(T, (U, B) => _(U, B, k));
      if (F.isPlainObject(g) || g instanceof this.constructor)
        C(g, S);
      else if (F.isString(g) && (g = g.trim()) && !Pa(g))
        C(ja(g), S);
      else if (F.isHeaders(g))
        for (const [T, k] of g.entries())
          _(k, T, j);
      else
        g != null && _(S, g, j);
      return this;
    }
    get(g, S) {
      if (g = ge(g), g) {
        const j = F.findKey(this, g);
        if (j) {
          const P = this[j];
          if (!S)
            return P;
          if (S === !0)
            return va(P);
          if (F.isFunction(S))
            return S.call(this, P, j);
          if (F.isRegExp(S))
            return S.exec(P);
          throw new TypeError("parser must be boolean|regexp|function");
        }
      }
    }
    has(g, S) {
      if (g = ge(g), g) {
        const j = F.findKey(this, g);
        return !!(j && this[j] !== void 0 && (!S || ze(this, this[j], j, S)));
      }
      return !1;
    }
    delete(g, S) {
      const j = this;
      let P = !1;
      function _(C) {
        if (C = ge(C), C) {
          const T = F.findKey(j, C);
          T && (!S || ze(j, j[T], T, S)) && (delete j[T], P = !0);
        }
      }
      return F.isArray(g) ? g.forEach(_) : _(g), P;
    }
    clear(g) {
      const S = Object.keys(this);
      let j = S.length, P = !1;
      for (; j--; ) {
        const _ = S[j];
        (!g || ze(this, this[_], _, g, !0)) && (delete this[_], P = !0);
      }
      return P;
    }
    normalize(g) {
      const S = this, j = {};
      return F.forEach(this, (P, _) => {
        const C = F.findKey(j, _);
        if (C) {
          S[C] = je(P), delete S[_];
          return;
        }
        const T = g ? Ra(_) : String(_).trim();
        T !== _ && delete S[_], S[T] = je(P), j[T] = !0;
      }), this;
    }
    concat(...g) {
      return this.constructor.concat(this, ...g);
    }
    toJSON(g) {
      const S = /* @__PURE__ */ Object.create(null);
      return F.forEach(this, (j, P) => {
        j != null && j !== !1 && (S[P] = g && F.isArray(j) ? j.join(", ") : j);
      }), S;
    }
    [Symbol.iterator]() {
      return Object.entries(this.toJSON())[Symbol.iterator]();
    }
    toString() {
      return Object.entries(this.toJSON()).map(([g, S]) => g + ": " + S).join(`
`);
    }
    get [Symbol.toStringTag]() {
      return "AxiosHeaders";
    }
    static from(g) {
      return g instanceof this ? g : new this(g);
    }
    static concat(g, ...S) {
      const j = new this(g);
      return S.forEach((P) => j.set(P)), j;
    }
    static accessor(g) {
      const j = (this[St] = this[St] = {
        accessors: {}
      }).accessors, P = this.prototype;
      function _(C) {
        const T = ge(C);
        j[T] || (_a(P, C), j[T] = !0);
      }
      return F.isArray(g) ? g.forEach(_) : _(g), this;
    }
  }
  ve.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]), F.reduceDescriptors(ve.prototype, ({ value: w }, g) => {
    let S = g[0].toUpperCase() + g.slice(1);
    return {
      get: () => w,
      set(j) {
        this[S] = j;
      }
    };
  }), F.freezeMethods(ve);
  var ne = ve;
  function $e(w, g) {
    const S = this || Ie, j = g || S, P = ne.from(j.headers);
    let _ = j.data;
    return F.forEach(w, function(T) {
      _ = T.call(S, _, P.normalize(), g ? g.status : void 0);
    }), P.normalize(), _;
  }
  function jt(w) {
    return !!(w && w.__CANCEL__);
  }
  function me(w, g, S) {
    x.call(this, w ?? "canceled", x.ERR_CANCELED, g, S), this.name = "CanceledError";
  }
  F.inherits(me, x, {
    __CANCEL__: !0
  });
  function vt(w, g, S) {
    const j = S.config.validateStatus;
    !S.status || !j || j(S.status) ? w(S) : g(new x(
      "Request failed with status code " + S.status,
      [x.ERR_BAD_REQUEST, x.ERR_BAD_RESPONSE][Math.floor(S.status / 100) - 4],
      S.config,
      S.request,
      S
    ));
  }
  function Ca(w) {
    const g = /^([-+\w]{1,25})(:?\/\/|:)/.exec(w);
    return g && g[1] || "";
  }
  function Va(w, g) {
    w = w || 10;
    const S = new Array(w), j = new Array(w);
    let P = 0, _ = 0, C;
    return g = g !== void 0 ? g : 1e3, function(k) {
      const U = Date.now(), B = j[_];
      C || (C = U), S[P] = k, j[P] = U;
      let L = _, D = 0;
      for (; L !== P; )
        D += S[L++], L = L % w;
      if (P = (P + 1) % w, P === _ && (_ = (_ + 1) % w), U - C < g)
        return;
      const z = B && U - B;
      return z ? Math.round(D * 1e3 / z) : void 0;
    };
  }
  function Ea(w, g) {
    let S = 0, j = 1e3 / g, P, _;
    const C = (U, B = Date.now()) => {
      S = B, P = null, _ && (clearTimeout(_), _ = null), w.apply(null, U);
    };
    return [(...U) => {
      const B = Date.now(), L = B - S;
      L >= j ? C(U, B) : (P = U, _ || (_ = setTimeout(() => {
        _ = null, C(P);
      }, j - L)));
    }, () => P && C(P)];
  }
  const Pe = (w, g, S = 3) => {
    let j = 0;
    const P = Va(50, 250);
    return Ea((_) => {
      const C = _.loaded, T = _.lengthComputable ? _.total : void 0, k = C - j, U = P(k), B = C <= T;
      j = C;
      const L = {
        loaded: C,
        total: T,
        progress: T ? C / T : void 0,
        bytes: k,
        rate: U || void 0,
        estimated: U && T && B ? (T - C) / U : void 0,
        event: _,
        lengthComputable: T != null,
        [g ? "download" : "upload"]: !0
      };
      w(L);
    }, S);
  }, Pt = (w, g) => {
    const S = w != null;
    return [(j) => g[0]({
      lengthComputable: S,
      total: w,
      loaded: j
    }), g[1]];
  }, Rt = (w) => (...g) => F.asap(() => w(...g));
  var Fa = X.hasStandardBrowserEnv ? /* @__PURE__ */ ((w, g) => (S) => (S = new URL(S, X.origin), w.protocol === S.protocol && w.host === S.host && (g || w.port === S.port)))(
    new URL(X.origin),
    X.navigator && /(msie|trident)/i.test(X.navigator.userAgent)
  ) : () => !0, qa = X.hasStandardBrowserEnv ? (
    // Standard browser envs support document.cookie
    {
      write(w, g, S, j, P, _) {
        const C = [w + "=" + encodeURIComponent(g)];
        F.isNumber(S) && C.push("expires=" + new Date(S).toGMTString()), F.isString(j) && C.push("path=" + j), F.isString(P) && C.push("domain=" + P), _ === !0 && C.push("secure"), document.cookie = C.join("; ");
      },
      read(w) {
        const g = document.cookie.match(new RegExp("(^|;\\s*)(" + w + ")=([^;]*)"));
        return g ? decodeURIComponent(g[3]) : null;
      },
      remove(w) {
        this.write(w, "", Date.now() - 864e5);
      }
    }
  ) : (
    // Non-standard browser env (web workers, react-native) lack needed support.
    {
      write() {
      },
      read() {
        return null;
      },
      remove() {
      }
    }
  );
  function Ta(w) {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(w);
  }
  function Ua(w, g) {
    return g ? w.replace(/\/?\/$/, "") + "/" + g.replace(/^\/+/, "") : w;
  }
  function _t(w, g) {
    return w && !Ta(g) ? Ua(w, g) : g;
  }
  const Ct = (w) => w instanceof ne ? { ...w } : w;
  function pe(w, g) {
    g = g || {};
    const S = {};
    function j(U, B, L, D) {
      return F.isPlainObject(U) && F.isPlainObject(B) ? F.merge.call({ caseless: D }, U, B) : F.isPlainObject(B) ? F.merge({}, B) : F.isArray(B) ? B.slice() : B;
    }
    function P(U, B, L, D) {
      if (F.isUndefined(B)) {
        if (!F.isUndefined(U))
          return j(void 0, U, L, D);
      } else return j(U, B, L, D);
    }
    function _(U, B) {
      if (!F.isUndefined(B))
        return j(void 0, B);
    }
    function C(U, B) {
      if (F.isUndefined(B)) {
        if (!F.isUndefined(U))
          return j(void 0, U);
      } else return j(void 0, B);
    }
    function T(U, B, L) {
      if (L in g)
        return j(U, B);
      if (L in w)
        return j(void 0, U);
    }
    const k = {
      url: _,
      method: _,
      data: _,
      baseURL: C,
      transformRequest: C,
      transformResponse: C,
      paramsSerializer: C,
      timeout: C,
      timeoutMessage: C,
      withCredentials: C,
      withXSRFToken: C,
      adapter: C,
      responseType: C,
      xsrfCookieName: C,
      xsrfHeaderName: C,
      onUploadProgress: C,
      onDownloadProgress: C,
      decompress: C,
      maxContentLength: C,
      maxBodyLength: C,
      beforeRedirect: C,
      transport: C,
      httpAgent: C,
      httpsAgent: C,
      cancelToken: C,
      socketPath: C,
      responseEncoding: C,
      validateStatus: T,
      headers: (U, B, L) => P(Ct(U), Ct(B), L, !0)
    };
    return F.forEach(Object.keys(Object.assign({}, w, g)), function(B) {
      const L = k[B] || P, D = L(w[B], g[B], B);
      F.isUndefined(D) && L !== T || (S[B] = D);
    }), S;
  }
  var Vt = (w) => {
    const g = pe({}, w);
    let { data: S, withXSRFToken: j, xsrfHeaderName: P, xsrfCookieName: _, headers: C, auth: T } = g;
    g.headers = C = ne.from(C), g.url = wt(_t(g.baseURL, g.url), w.params, w.paramsSerializer), T && C.set(
      "Authorization",
      "Basic " + btoa((T.username || "") + ":" + (T.password ? unescape(encodeURIComponent(T.password)) : ""))
    );
    let k;
    if (F.isFormData(S)) {
      if (X.hasStandardBrowserEnv || X.hasStandardBrowserWebWorkerEnv)
        C.setContentType(void 0);
      else if ((k = C.getContentType()) !== !1) {
        const [U, ...B] = k ? k.split(";").map((L) => L.trim()).filter(Boolean) : [];
        C.setContentType([U || "multipart/form-data", ...B].join("; "));
      }
    }
    if (X.hasStandardBrowserEnv && (j && F.isFunction(j) && (j = j(g)), j || j !== !1 && Fa(g.url))) {
      const U = P && _ && qa.read(_);
      U && C.set(P, U);
    }
    return g;
  }, Ba = typeof XMLHttpRequest < "u" && function(w) {
    return new Promise(function(S, j) {
      const P = Vt(w);
      let _ = P.data;
      const C = ne.from(P.headers).normalize();
      let { responseType: T, onUploadProgress: k, onDownloadProgress: U } = P, B, L, D, z, G;
      function M() {
        z && z(), G && G(), P.cancelToken && P.cancelToken.unsubscribe(B), P.signal && P.signal.removeEventListener("abort", B);
      }
      let H = new XMLHttpRequest();
      H.open(P.method.toUpperCase(), P.url, !0), H.timeout = P.timeout;
      function J() {
        if (!H)
          return;
        const W = ne.from(
          "getAllResponseHeaders" in H && H.getAllResponseHeaders()
        ), Y = {
          data: !T || T === "text" || T === "json" ? H.responseText : H.response,
          status: H.status,
          statusText: H.statusText,
          headers: W,
          config: w,
          request: H
        };
        vt(function(fe) {
          S(fe), M();
        }, function(fe) {
          j(fe), M();
        }, Y), H = null;
      }
      "onloadend" in H ? H.onloadend = J : H.onreadystatechange = function() {
        !H || H.readyState !== 4 || H.status === 0 && !(H.responseURL && H.responseURL.indexOf("file:") === 0) || setTimeout(J);
      }, H.onabort = function() {
        H && (j(new x("Request aborted", x.ECONNABORTED, w, H)), H = null);
      }, H.onerror = function() {
        j(new x("Network Error", x.ERR_NETWORK, w, H)), H = null;
      }, H.ontimeout = function() {
        let se = P.timeout ? "timeout of " + P.timeout + "ms exceeded" : "timeout exceeded";
        const Y = P.transitional || yt;
        P.timeoutErrorMessage && (se = P.timeoutErrorMessage), j(new x(
          se,
          Y.clarifyTimeoutError ? x.ETIMEDOUT : x.ECONNABORTED,
          w,
          H
        )), H = null;
      }, _ === void 0 && C.setContentType(null), "setRequestHeader" in H && F.forEach(C.toJSON(), function(se, Y) {
        H.setRequestHeader(Y, se);
      }), F.isUndefined(P.withCredentials) || (H.withCredentials = !!P.withCredentials), T && T !== "json" && (H.responseType = P.responseType), U && ([D, G] = Pe(U, !0), H.addEventListener("progress", D)), k && H.upload && ([L, z] = Pe(k), H.upload.addEventListener("progress", L), H.upload.addEventListener("loadend", z)), (P.cancelToken || P.signal) && (B = (W) => {
        H && (j(!W || W.type ? new me(null, w, H) : W), H.abort(), H = null);
      }, P.cancelToken && P.cancelToken.subscribe(B), P.signal && (P.signal.aborted ? B() : P.signal.addEventListener("abort", B)));
      const $ = Ca(P.url);
      if ($ && X.protocols.indexOf($) === -1) {
        j(new x("Unsupported protocol " + $ + ":", x.ERR_BAD_REQUEST, w));
        return;
      }
      H.send(_ || null);
    });
  }, ka = (w, g) => {
    const { length: S } = w = w ? w.filter(Boolean) : [];
    if (g || S) {
      let j = new AbortController(), P;
      const _ = function(U) {
        if (!P) {
          P = !0, T();
          const B = U instanceof Error ? U : this.reason;
          j.abort(B instanceof x ? B : new me(B instanceof Error ? B.message : B));
        }
      };
      let C = g && setTimeout(() => {
        C = null, _(new x(`timeout ${g} of ms exceeded`, x.ETIMEDOUT));
      }, g);
      const T = () => {
        w && (C && clearTimeout(C), C = null, w.forEach((U) => {
          U.unsubscribe ? U.unsubscribe(_) : U.removeEventListener("abort", _);
        }), w = null);
      };
      w.forEach((U) => U.addEventListener("abort", _));
      const { signal: k } = j;
      return k.unsubscribe = () => F.asap(T), k;
    }
  };
  const La = function* (w, g) {
    let S = w.byteLength;
    if (S < g) {
      yield w;
      return;
    }
    let j = 0, P;
    for (; j < S; )
      P = j + g, yield w.slice(j, P), j = P;
  }, Ga = async function* (w, g) {
    for await (const S of Ha(w))
      yield* La(S, g);
  }, Ha = async function* (w) {
    if (w[Symbol.asyncIterator]) {
      yield* w;
      return;
    }
    const g = w.getReader();
    try {
      for (; ; ) {
        const { done: S, value: j } = await g.read();
        if (S)
          break;
        yield j;
      }
    } finally {
      await g.cancel();
    }
  }, Et = (w, g, S, j) => {
    const P = Ga(w, g);
    let _ = 0, C, T = (k) => {
      C || (C = !0, j && j(k));
    };
    return new ReadableStream({
      async pull(k) {
        try {
          const { done: U, value: B } = await P.next();
          if (U) {
            T(), k.close();
            return;
          }
          let L = B.byteLength;
          if (S) {
            let D = _ += L;
            S(D);
          }
          k.enqueue(new Uint8Array(B));
        } catch (U) {
          throw T(U), U;
        }
      },
      cancel(k) {
        return T(k), P.return();
      }
    }, {
      highWaterMark: 2
    });
  }, Re = typeof fetch == "function" && typeof Request == "function" && typeof Response == "function", Ft = Re && typeof ReadableStream == "function", xa = Re && (typeof TextEncoder == "function" ? /* @__PURE__ */ ((w) => (g) => w.encode(g))(new TextEncoder()) : async (w) => new Uint8Array(await new Response(w).arrayBuffer())), qt = (w, ...g) => {
    try {
      return !!w(...g);
    } catch {
      return !1;
    }
  }, Ma = Ft && qt(() => {
    let w = !1;
    const g = new Request(X.origin, {
      body: new ReadableStream(),
      method: "POST",
      get duplex() {
        return w = !0, "half";
      }
    }).headers.has("Content-Type");
    return w && !g;
  }), Tt = 64 * 1024, We = Ft && qt(() => F.isReadableStream(new Response("").body)), _e = {
    stream: We && ((w) => w.body)
  };
  Re && ((w) => {
    ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((g) => {
      !_e[g] && (_e[g] = F.isFunction(w[g]) ? (S) => S[g]() : (S, j) => {
        throw new x(`Response type '${g}' is not supported`, x.ERR_NOT_SUPPORT, j);
      });
    });
  })(new Response());
  const Da = async (w) => {
    if (w == null)
      return 0;
    if (F.isBlob(w))
      return w.size;
    if (F.isSpecCompliantForm(w))
      return (await new Request(X.origin, {
        method: "POST",
        body: w
      }).arrayBuffer()).byteLength;
    if (F.isArrayBufferView(w) || F.isArrayBuffer(w))
      return w.byteLength;
    if (F.isURLSearchParams(w) && (w = w + ""), F.isString(w))
      return (await xa(w)).byteLength;
  }, Na = async (w, g) => {
    const S = F.toFiniteNumber(w.getContentLength());
    return S ?? Da(g);
  };
  var Za = Re && (async (w) => {
    let {
      url: g,
      method: S,
      data: j,
      signal: P,
      cancelToken: _,
      timeout: C,
      onDownloadProgress: T,
      onUploadProgress: k,
      responseType: U,
      headers: B,
      withCredentials: L = "same-origin",
      fetchOptions: D
    } = Vt(w);
    U = U ? (U + "").toLowerCase() : "text";
    let z = ka([P, _ && _.toAbortSignal()], C), G;
    const M = z && z.unsubscribe && (() => {
      z.unsubscribe();
    });
    let H;
    try {
      if (k && Ma && S !== "get" && S !== "head" && (H = await Na(B, j)) !== 0) {
        let Y = new Request(g, {
          method: "POST",
          body: j,
          duplex: "half"
        }), oe;
        if (F.isFormData(j) && (oe = Y.headers.get("content-type")) && B.setContentType(oe), Y.body) {
          const [fe, qe] = Pt(
            H,
            Pe(Rt(k))
          );
          j = Et(Y.body, Tt, fe, qe);
        }
      }
      F.isString(L) || (L = L ? "include" : "omit");
      const J = "credentials" in Request.prototype;
      G = new Request(g, {
        ...D,
        signal: z,
        method: S.toUpperCase(),
        headers: B.normalize().toJSON(),
        body: j,
        duplex: "half",
        credentials: J ? L : void 0
      });
      let $ = await fetch(G);
      const W = We && (U === "stream" || U === "response");
      if (We && (T || W && M)) {
        const Y = {};
        ["status", "statusText", "headers"].forEach((xt) => {
          Y[xt] = $[xt];
        });
        const oe = F.toFiniteNumber($.headers.get("content-length")), [fe, qe] = T && Pt(
          oe,
          Pe(Rt(T), !0)
        ) || [];
        $ = new Response(
          Et($.body, Tt, fe, () => {
            qe && qe(), M && M();
          }),
          Y
        );
      }
      U = U || "text";
      let se = await _e[F.findKey(_e, U) || "text"]($, w);
      return !W && M && M(), await new Promise((Y, oe) => {
        vt(Y, oe, {
          data: se,
          headers: ne.from($.headers),
          status: $.status,
          statusText: $.statusText,
          config: w,
          request: G
        });
      });
    } catch (J) {
      throw M && M(), J && J.name === "TypeError" && /fetch/i.test(J.message) ? Object.assign(
        new x("Network Error", x.ERR_NETWORK, w, G),
        {
          cause: J.cause || J
        }
      ) : x.from(J, J && J.code, w, G);
    }
  });
  const Ke = {
    http: sa,
    xhr: Ba,
    fetch: Za
  };
  F.forEach(Ke, (w, g) => {
    if (w) {
      try {
        Object.defineProperty(w, "name", { value: g });
      } catch {
      }
      Object.defineProperty(w, "adapterName", { value: g });
    }
  });
  const Ut = (w) => `- ${w}`, Qa = (w) => F.isFunction(w) || w === null || w === !1;
  var Bt = {
    getAdapter: (w) => {
      w = F.isArray(w) ? w : [w];
      const { length: g } = w;
      let S, j;
      const P = {};
      for (let _ = 0; _ < g; _++) {
        S = w[_];
        let C;
        if (j = S, !Qa(S) && (j = Ke[(C = String(S)).toLowerCase()], j === void 0))
          throw new x(`Unknown adapter '${C}'`);
        if (j)
          break;
        P[C || "#" + _] = j;
      }
      if (!j) {
        const _ = Object.entries(P).map(
          ([T, k]) => `adapter ${T} ` + (k === !1 ? "is not supported by the environment" : "is not available in the build")
        );
        let C = g ? _.length > 1 ? `since :
` + _.map(Ut).join(`
`) : " " + Ut(_[0]) : "as no adapter specified";
        throw new x(
          "There is no suitable adapter to dispatch the request " + C,
          "ERR_NOT_SUPPORT"
        );
      }
      return j;
    },
    adapters: Ke
  };
  function Xe(w) {
    if (w.cancelToken && w.cancelToken.throwIfRequested(), w.signal && w.signal.aborted)
      throw new me(null, w);
  }
  function kt(w) {
    return Xe(w), w.headers = ne.from(w.headers), w.data = $e.call(
      w,
      w.transformRequest
    ), ["post", "put", "patch"].indexOf(w.method) !== -1 && w.headers.setContentType("application/x-www-form-urlencoded", !1), Bt.getAdapter(w.adapter || Ie.adapter)(w).then(function(j) {
      return Xe(w), j.data = $e.call(
        w,
        w.transformResponse,
        j
      ), j.headers = ne.from(j.headers), j;
    }, function(j) {
      return jt(j) || (Xe(w), j && j.response && (j.response.data = $e.call(
        w,
        w.transformResponse,
        j.response
      ), j.response.headers = ne.from(j.response.headers))), Promise.reject(j);
    });
  }
  const Lt = "1.7.9", Ce = {};
  ["object", "boolean", "number", "function", "string", "symbol"].forEach((w, g) => {
    Ce[w] = function(j) {
      return typeof j === w || "a" + (g < 1 ? "n " : " ") + w;
    };
  });
  const Gt = {};
  Ce.transitional = function(g, S, j) {
    function P(_, C) {
      return "[Axios v" + Lt + "] Transitional option '" + _ + "'" + C + (j ? ". " + j : "");
    }
    return (_, C, T) => {
      if (g === !1)
        throw new x(
          P(C, " has been removed" + (S ? " in " + S : "")),
          x.ERR_DEPRECATED
        );
      return S && !Gt[C] && (Gt[C] = !0, console.warn(
        P(
          C,
          " has been deprecated since v" + S + " and will be removed in the near future"
        )
      )), g ? g(_, C, T) : !0;
    };
  }, Ce.spelling = function(g) {
    return (S, j) => (console.warn(`${j} is likely a misspelling of ${g}`), !0);
  };
  function Ja(w, g, S) {
    if (typeof w != "object")
      throw new x("options must be an object", x.ERR_BAD_OPTION_VALUE);
    const j = Object.keys(w);
    let P = j.length;
    for (; P-- > 0; ) {
      const _ = j[P], C = g[_];
      if (C) {
        const T = w[_], k = T === void 0 || C(T, _, w);
        if (k !== !0)
          throw new x("option " + _ + " must be " + k, x.ERR_BAD_OPTION_VALUE);
        continue;
      }
      if (S !== !0)
        throw new x("Unknown option " + _, x.ERR_BAD_OPTION);
    }
  }
  var Ve = {
    assertOptions: Ja,
    validators: Ce
  };
  const ae = Ve.validators;
  class Ee {
    constructor(g) {
      this.defaults = g, this.interceptors = {
        request: new gt(),
        response: new gt()
      };
    }
    /**
     * Dispatch a request
     *
     * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
     * @param {?Object} config
     *
     * @returns {Promise} The Promise to be fulfilled
     */
    async request(g, S) {
      try {
        return await this._request(g, S);
      } catch (j) {
        if (j instanceof Error) {
          let P = {};
          Error.captureStackTrace ? Error.captureStackTrace(P) : P = new Error();
          const _ = P.stack ? P.stack.replace(/^.+\n/, "") : "";
          try {
            j.stack ? _ && !String(j.stack).endsWith(_.replace(/^.+\n.+\n/, "")) && (j.stack += `
` + _) : j.stack = _;
          } catch {
          }
        }
        throw j;
      }
    }
    _request(g, S) {
      typeof g == "string" ? (S = S || {}, S.url = g) : S = g || {}, S = pe(this.defaults, S);
      const { transitional: j, paramsSerializer: P, headers: _ } = S;
      j !== void 0 && Ve.assertOptions(j, {
        silentJSONParsing: ae.transitional(ae.boolean),
        forcedJSONParsing: ae.transitional(ae.boolean),
        clarifyTimeoutError: ae.transitional(ae.boolean)
      }, !1), P != null && (F.isFunction(P) ? S.paramsSerializer = {
        serialize: P
      } : Ve.assertOptions(P, {
        encode: ae.function,
        serialize: ae.function
      }, !0)), Ve.assertOptions(S, {
        baseUrl: ae.spelling("baseURL"),
        withXsrfToken: ae.spelling("withXSRFToken")
      }, !0), S.method = (S.method || this.defaults.method || "get").toLowerCase();
      let C = _ && F.merge(
        _.common,
        _[S.method]
      );
      _ && F.forEach(
        ["delete", "get", "head", "post", "put", "patch", "common"],
        (G) => {
          delete _[G];
        }
      ), S.headers = ne.concat(C, _);
      const T = [];
      let k = !0;
      this.interceptors.request.forEach(function(M) {
        typeof M.runWhen == "function" && M.runWhen(S) === !1 || (k = k && M.synchronous, T.unshift(M.fulfilled, M.rejected));
      });
      const U = [];
      this.interceptors.response.forEach(function(M) {
        U.push(M.fulfilled, M.rejected);
      });
      let B, L = 0, D;
      if (!k) {
        const G = [kt.bind(this), void 0];
        for (G.unshift.apply(G, T), G.push.apply(G, U), D = G.length, B = Promise.resolve(S); L < D; )
          B = B.then(G[L++], G[L++]);
        return B;
      }
      D = T.length;
      let z = S;
      for (L = 0; L < D; ) {
        const G = T[L++], M = T[L++];
        try {
          z = G(z);
        } catch (H) {
          M.call(this, H);
          break;
        }
      }
      try {
        B = kt.call(this, z);
      } catch (G) {
        return Promise.reject(G);
      }
      for (L = 0, D = U.length; L < D; )
        B = B.then(U[L++], U[L++]);
      return B;
    }
    getUri(g) {
      g = pe(this.defaults, g);
      const S = _t(g.baseURL, g.url);
      return wt(S, g.params, g.paramsSerializer);
    }
  }
  F.forEach(["delete", "get", "head", "options"], function(g) {
    Ee.prototype[g] = function(S, j) {
      return this.request(pe(j || {}, {
        method: g,
        url: S,
        data: (j || {}).data
      }));
    };
  }), F.forEach(["post", "put", "patch"], function(g) {
    function S(j) {
      return function(_, C, T) {
        return this.request(pe(T || {}, {
          method: g,
          headers: j ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url: _,
          data: C
        }));
      };
    }
    Ee.prototype[g] = S(), Ee.prototype[g + "Form"] = S(!0);
  });
  var Fe = Ee;
  class Ye {
    constructor(g) {
      if (typeof g != "function")
        throw new TypeError("executor must be a function.");
      let S;
      this.promise = new Promise(function(_) {
        S = _;
      });
      const j = this;
      this.promise.then((P) => {
        if (!j._listeners) return;
        let _ = j._listeners.length;
        for (; _-- > 0; )
          j._listeners[_](P);
        j._listeners = null;
      }), this.promise.then = (P) => {
        let _;
        const C = new Promise((T) => {
          j.subscribe(T), _ = T;
        }).then(P);
        return C.cancel = function() {
          j.unsubscribe(_);
        }, C;
      }, g(function(_, C, T) {
        j.reason || (j.reason = new me(_, C, T), S(j.reason));
      });
    }
    /**
     * Throws a `CanceledError` if cancellation has been requested.
     */
    throwIfRequested() {
      if (this.reason)
        throw this.reason;
    }
    /**
     * Subscribe to the cancel signal
     */
    subscribe(g) {
      if (this.reason) {
        g(this.reason);
        return;
      }
      this._listeners ? this._listeners.push(g) : this._listeners = [g];
    }
    /**
     * Unsubscribe from the cancel signal
     */
    unsubscribe(g) {
      if (!this._listeners)
        return;
      const S = this._listeners.indexOf(g);
      S !== -1 && this._listeners.splice(S, 1);
    }
    toAbortSignal() {
      const g = new AbortController(), S = (j) => {
        g.abort(j);
      };
      return this.subscribe(S), g.signal.unsubscribe = () => this.unsubscribe(S), g.signal;
    }
    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    static source() {
      let g;
      return {
        token: new Ye(function(P) {
          g = P;
        }),
        cancel: g
      };
    }
  }
  var Ia = Ye;
  function za(w) {
    return function(S) {
      return w.apply(null, S);
    };
  }
  function $a(w) {
    return F.isObject(w) && w.isAxiosError === !0;
  }
  const et = {
    Continue: 100,
    SwitchingProtocols: 101,
    Processing: 102,
    EarlyHints: 103,
    Ok: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
    MultiStatus: 207,
    AlreadyReported: 208,
    ImUsed: 226,
    MultipleChoices: 300,
    MovedPermanently: 301,
    Found: 302,
    SeeOther: 303,
    NotModified: 304,
    UseProxy: 305,
    Unused: 306,
    TemporaryRedirect: 307,
    PermanentRedirect: 308,
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    PayloadTooLarge: 413,
    UriTooLong: 414,
    UnsupportedMediaType: 415,
    RangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    ImATeapot: 418,
    MisdirectedRequest: 421,
    UnprocessableEntity: 422,
    Locked: 423,
    FailedDependency: 424,
    TooEarly: 425,
    UpgradeRequired: 426,
    PreconditionRequired: 428,
    TooManyRequests: 429,
    RequestHeaderFieldsTooLarge: 431,
    UnavailableForLegalReasons: 451,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HttpVersionNotSupported: 505,
    VariantAlsoNegotiates: 506,
    InsufficientStorage: 507,
    LoopDetected: 508,
    NotExtended: 510,
    NetworkAuthenticationRequired: 511
  };
  Object.entries(et).forEach(([w, g]) => {
    et[g] = w;
  });
  var Wa = et;
  function Ht(w) {
    const g = new Fe(w), S = d(Fe.prototype.request, g);
    return F.extend(S, Fe.prototype, g, { allOwnKeys: !0 }), F.extend(S, g, null, { allOwnKeys: !0 }), S.create = function(P) {
      return Ht(pe(w, P));
    }, S;
  }
  const I = Ht(Ie);
  return I.Axios = Fe, I.CanceledError = me, I.CancelToken = Ia, I.isCancel = jt, I.VERSION = Lt, I.toFormData = Se, I.AxiosError = x, I.Cancel = I.CanceledError, I.all = function(g) {
    return Promise.all(g);
  }, I.spread = za, I.isAxiosError = $a, I.mergeConfig = pe, I.AxiosHeaders = ne, I.formToJSON = (w) => At(F.isHTMLForm(w) ? new FormData(w) : w), I.getAdapter = Bt.getAdapter, I.HttpStatusCode = Wa, I.default = I, nt = I, nt;
}
var at = {}, Qt;
function Q() {
  return Qt || (Qt = 1, function(d) {
    Object.defineProperty(d, "__esModule", { value: !0 }), d.RequiredError = d.BaseAPI = d.COLLECTION_FORMATS = d.BASE_PATH = void 0;
    const A = N.__importDefault(Z());
    d.BASE_PATH = "http://localhost/api/v1".replace(/\/+$/, ""), d.COLLECTION_FORMATS = {
      csv: ",",
      ssv: " ",
      tsv: "	",
      pipes: "|"
    };
    class O {
      constructor(e, t = d.BASE_PATH, a = A.default) {
        this.basePath = t, this.axios = a, e && (this.configuration = e, this.basePath = e.basePath || this.basePath);
      }
    }
    d.BaseAPI = O;
    class V extends Error {
      constructor(e, t) {
        super(t), this.field = e, this.name = "RequiredError";
      }
    }
    d.RequiredError = V;
  }(at)), at;
}
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.ZoneApi = d.ZoneApiFactory = d.ZoneApiFp = d.ZoneApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.ZoneApiAxiosParamCreator = function(n) {
    return {
      createZone: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("zone", "Required parameter zone was null or undefined when calling createZone.");
        const a = "/zone", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteZone: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteZone.");
        const a = "/zone/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getZone: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getZone.");
        const s = "/zone/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getZonesBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getZonesBulk.");
        const a = "/zones/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getZonesCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/zones/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listZones: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/zones", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateZone: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateZone.");
        if (t == null)
          throw new O.RequiredError("zone", "Required parameter zone was null or undefined when calling updateZone.");
        const r = "/zone/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.ZoneApiFp = function(n) {
    return {
      createZone(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ZoneApiAxiosParamCreator(n).createZone(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteZone(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ZoneApiAxiosParamCreator(n).deleteZone(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getZone(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.ZoneApiAxiosParamCreator(n).getZone(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getZonesBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ZoneApiAxiosParamCreator(n).getZonesBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getZonesCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ZoneApiAxiosParamCreator(n).getZonesCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listZones(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ZoneApiAxiosParamCreator(n).listZones(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateZone(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.ZoneApiAxiosParamCreator(n).updateZone(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.ZoneApiFactory = function(n, e, t) {
    return {
      createZone(a, r) {
        return d.ZoneApiFp(n).createZone(a, r).then((s) => s(t, e));
      },
      deleteZone(a, r) {
        return d.ZoneApiFp(n).deleteZone(a, r).then((s) => s(t, e));
      },
      getZone(a, r, s, i) {
        return d.ZoneApiFp(n).getZone(a, r, s, i).then((l) => l(t, e));
      },
      getZonesBulk(a, r) {
        return d.ZoneApiFp(n).getZonesBulk(a, r).then((s) => s(t, e));
      },
      getZonesCount(a, r, s, i, l, h, p, c, u, f) {
        return d.ZoneApiFp(n).getZonesCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listZones(a, r, s, i, l, h, p, c, u, f) {
        return d.ZoneApiFp(n).listZones(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateZone(a, r, s) {
        return d.ZoneApiFp(n).updateZone(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createZone(e, t) {
      return d.ZoneApiFp(this.configuration).createZone(e.zone, t).then((a) => a(this.axios, this.basePath));
    }
    deleteZone(e, t) {
      return d.ZoneApiFp(this.configuration).deleteZone(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getZone(e, t) {
      return d.ZoneApiFp(this.configuration).getZone(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getZonesBulk(e, t) {
      return d.ZoneApiFp(this.configuration).getZonesBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getZonesCount(e = {}, t) {
      return d.ZoneApiFp(this.configuration).getZonesCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listZones(e = {}, t) {
      return d.ZoneApiFp(this.configuration).listZones(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateZone(e, t) {
      return d.ZoneApiFp(this.configuration).updateZone(e.id, e.zone, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.ZoneApi = V;
})(Jt);
var An = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.AdventureTemplateApi = d.AdventureTemplateApiFactory = d.AdventureTemplateApiFp = d.AdventureTemplateApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.AdventureTemplateApiAxiosParamCreator = function(n) {
    return {
      createAdventureTemplate: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("adventureTemplate", "Required parameter adventureTemplate was null or undefined when calling createAdventureTemplate.");
        const a = "/adventure_template", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteAdventureTemplate: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteAdventureTemplate.");
        const a = "/adventure_template/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getAdventureTemplate: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getAdventureTemplate.");
        const s = "/adventure_template/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getAdventureTemplatesBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getAdventureTemplatesBulk.");
        const a = "/adventure_templates/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getAdventureTemplatesCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/adventure_templates/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listAdventureTemplates: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/adventure_templates", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateAdventureTemplate: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateAdventureTemplate.");
        if (t == null)
          throw new O.RequiredError("adventureTemplate", "Required parameter adventureTemplate was null or undefined when calling updateAdventureTemplate.");
        const r = "/adventure_template/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.AdventureTemplateApiFp = function(n) {
    return {
      createAdventureTemplate(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.AdventureTemplateApiAxiosParamCreator(n).createAdventureTemplate(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteAdventureTemplate(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.AdventureTemplateApiAxiosParamCreator(n).deleteAdventureTemplate(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getAdventureTemplate(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.AdventureTemplateApiAxiosParamCreator(n).getAdventureTemplate(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getAdventureTemplatesBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.AdventureTemplateApiAxiosParamCreator(n).getAdventureTemplatesBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getAdventureTemplatesCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.AdventureTemplateApiAxiosParamCreator(n).getAdventureTemplatesCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listAdventureTemplates(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.AdventureTemplateApiAxiosParamCreator(n).listAdventureTemplates(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateAdventureTemplate(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.AdventureTemplateApiAxiosParamCreator(n).updateAdventureTemplate(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.AdventureTemplateApiFactory = function(n, e, t) {
    return {
      createAdventureTemplate(a, r) {
        return d.AdventureTemplateApiFp(n).createAdventureTemplate(a, r).then((s) => s(t, e));
      },
      deleteAdventureTemplate(a, r) {
        return d.AdventureTemplateApiFp(n).deleteAdventureTemplate(a, r).then((s) => s(t, e));
      },
      getAdventureTemplate(a, r, s, i) {
        return d.AdventureTemplateApiFp(n).getAdventureTemplate(a, r, s, i).then((l) => l(t, e));
      },
      getAdventureTemplatesBulk(a, r) {
        return d.AdventureTemplateApiFp(n).getAdventureTemplatesBulk(a, r).then((s) => s(t, e));
      },
      getAdventureTemplatesCount(a, r, s, i, l, h, p, c, u, f) {
        return d.AdventureTemplateApiFp(n).getAdventureTemplatesCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listAdventureTemplates(a, r, s, i, l, h, p, c, u, f) {
        return d.AdventureTemplateApiFp(n).listAdventureTemplates(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateAdventureTemplate(a, r, s) {
        return d.AdventureTemplateApiFp(n).updateAdventureTemplate(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createAdventureTemplate(e, t) {
      return d.AdventureTemplateApiFp(this.configuration).createAdventureTemplate(e.adventureTemplate, t).then((a) => a(this.axios, this.basePath));
    }
    deleteAdventureTemplate(e, t) {
      return d.AdventureTemplateApiFp(this.configuration).deleteAdventureTemplate(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getAdventureTemplate(e, t) {
      return d.AdventureTemplateApiFp(this.configuration).getAdventureTemplate(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getAdventureTemplatesBulk(e, t) {
      return d.AdventureTemplateApiFp(this.configuration).getAdventureTemplatesBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getAdventureTemplatesCount(e = {}, t) {
      return d.AdventureTemplateApiFp(this.configuration).getAdventureTemplatesCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listAdventureTemplates(e = {}, t) {
      return d.AdventureTemplateApiFp(this.configuration).listAdventureTemplates(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateAdventureTemplate(e, t) {
      return d.AdventureTemplateApiFp(this.configuration).updateAdventureTemplate(e.id, e.adventureTemplate, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.AdventureTemplateApi = V;
})(An);
var Sn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.DoorApi = d.DoorApiFactory = d.DoorApiFp = d.DoorApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.DoorApiAxiosParamCreator = function(n) {
    return {
      createDoor: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("door", "Required parameter door was null or undefined when calling createDoor.");
        const a = "/door", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteDoor: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteDoor.");
        const a = "/door/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getDoor: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getDoor.");
        const s = "/door/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getDoorsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getDoorsBulk.");
        const a = "/doors/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getDoorsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/doors/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listDoors: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/doors", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateDoor: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateDoor.");
        if (t == null)
          throw new O.RequiredError("door", "Required parameter door was null or undefined when calling updateDoor.");
        const r = "/door/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.DoorApiFp = function(n) {
    return {
      createDoor(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.DoorApiAxiosParamCreator(n).createDoor(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteDoor(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.DoorApiAxiosParamCreator(n).deleteDoor(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getDoor(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.DoorApiAxiosParamCreator(n).getDoor(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getDoorsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.DoorApiAxiosParamCreator(n).getDoorsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getDoorsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.DoorApiAxiosParamCreator(n).getDoorsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listDoors(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.DoorApiAxiosParamCreator(n).listDoors(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateDoor(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.DoorApiAxiosParamCreator(n).updateDoor(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.DoorApiFactory = function(n, e, t) {
    return {
      createDoor(a, r) {
        return d.DoorApiFp(n).createDoor(a, r).then((s) => s(t, e));
      },
      deleteDoor(a, r) {
        return d.DoorApiFp(n).deleteDoor(a, r).then((s) => s(t, e));
      },
      getDoor(a, r, s, i) {
        return d.DoorApiFp(n).getDoor(a, r, s, i).then((l) => l(t, e));
      },
      getDoorsBulk(a, r) {
        return d.DoorApiFp(n).getDoorsBulk(a, r).then((s) => s(t, e));
      },
      getDoorsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.DoorApiFp(n).getDoorsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listDoors(a, r, s, i, l, h, p, c, u, f) {
        return d.DoorApiFp(n).listDoors(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateDoor(a, r, s) {
        return d.DoorApiFp(n).updateDoor(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createDoor(e, t) {
      return d.DoorApiFp(this.configuration).createDoor(e.door, t).then((a) => a(this.axios, this.basePath));
    }
    deleteDoor(e, t) {
      return d.DoorApiFp(this.configuration).deleteDoor(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getDoor(e, t) {
      return d.DoorApiFp(this.configuration).getDoor(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getDoorsBulk(e, t) {
      return d.DoorApiFp(this.configuration).getDoorsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getDoorsCount(e = {}, t) {
      return d.DoorApiFp(this.configuration).getDoorsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listDoors(e = {}, t) {
      return d.DoorApiFp(this.configuration).listDoors(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateDoor(e, t) {
      return d.DoorApiFp(this.configuration).updateDoor(e.id, e.door, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.DoorApi = V;
})(Sn);
var jn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.GlobalLootApi = d.GlobalLootApiFactory = d.GlobalLootApiFp = d.GlobalLootApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.GlobalLootApiAxiosParamCreator = function(n) {
    return {
      createGlobalLoot: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("globalLoot", "Required parameter globalLoot was null or undefined when calling createGlobalLoot.");
        const a = "/global_loot", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteGlobalLoot: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteGlobalLoot.");
        const a = "/global_loot/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGlobalLoot: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getGlobalLoot.");
        const s = "/global_loot/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getGlobalLootsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getGlobalLootsBulk.");
        const a = "/global_loots/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGlobalLootsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/global_loots/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listGlobalLoots: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/global_loots", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateGlobalLoot: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateGlobalLoot.");
        if (t == null)
          throw new O.RequiredError("globalLoot", "Required parameter globalLoot was null or undefined when calling updateGlobalLoot.");
        const r = "/global_loot/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.GlobalLootApiFp = function(n) {
    return {
      createGlobalLoot(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GlobalLootApiAxiosParamCreator(n).createGlobalLoot(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteGlobalLoot(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GlobalLootApiAxiosParamCreator(n).deleteGlobalLoot(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGlobalLoot(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.GlobalLootApiAxiosParamCreator(n).getGlobalLoot(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getGlobalLootsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GlobalLootApiAxiosParamCreator(n).getGlobalLootsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGlobalLootsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GlobalLootApiAxiosParamCreator(n).getGlobalLootsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listGlobalLoots(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GlobalLootApiAxiosParamCreator(n).listGlobalLoots(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateGlobalLoot(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.GlobalLootApiAxiosParamCreator(n).updateGlobalLoot(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.GlobalLootApiFactory = function(n, e, t) {
    return {
      createGlobalLoot(a, r) {
        return d.GlobalLootApiFp(n).createGlobalLoot(a, r).then((s) => s(t, e));
      },
      deleteGlobalLoot(a, r) {
        return d.GlobalLootApiFp(n).deleteGlobalLoot(a, r).then((s) => s(t, e));
      },
      getGlobalLoot(a, r, s, i) {
        return d.GlobalLootApiFp(n).getGlobalLoot(a, r, s, i).then((l) => l(t, e));
      },
      getGlobalLootsBulk(a, r) {
        return d.GlobalLootApiFp(n).getGlobalLootsBulk(a, r).then((s) => s(t, e));
      },
      getGlobalLootsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.GlobalLootApiFp(n).getGlobalLootsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listGlobalLoots(a, r, s, i, l, h, p, c, u, f) {
        return d.GlobalLootApiFp(n).listGlobalLoots(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateGlobalLoot(a, r, s) {
        return d.GlobalLootApiFp(n).updateGlobalLoot(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createGlobalLoot(e, t) {
      return d.GlobalLootApiFp(this.configuration).createGlobalLoot(e.globalLoot, t).then((a) => a(this.axios, this.basePath));
    }
    deleteGlobalLoot(e, t) {
      return d.GlobalLootApiFp(this.configuration).deleteGlobalLoot(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getGlobalLoot(e, t) {
      return d.GlobalLootApiFp(this.configuration).getGlobalLoot(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getGlobalLootsBulk(e, t) {
      return d.GlobalLootApiFp(this.configuration).getGlobalLootsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getGlobalLootsCount(e = {}, t) {
      return d.GlobalLootApiFp(this.configuration).getGlobalLootsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listGlobalLoots(e = {}, t) {
      return d.GlobalLootApiFp(this.configuration).listGlobalLoots(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateGlobalLoot(e, t) {
      return d.GlobalLootApiFp(this.configuration).updateGlobalLoot(e.id, e.globalLoot, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.GlobalLootApi = V;
})(jn);
var vn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.SpawnConditionApi = d.SpawnConditionApiFactory = d.SpawnConditionApiFp = d.SpawnConditionApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.SpawnConditionApiAxiosParamCreator = function(n) {
    return {
      createSpawnCondition: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("spawnCondition", "Required parameter spawnCondition was null or undefined when calling createSpawnCondition.");
        const a = "/spawn_condition", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteSpawnCondition: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteSpawnCondition.");
        const a = "/spawn_condition/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpawnCondition: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getSpawnCondition.");
        const s = "/spawn_condition/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getSpawnConditionsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getSpawnConditionsBulk.");
        const a = "/spawn_conditions/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpawnConditionsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spawn_conditions/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listSpawnConditions: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spawn_conditions", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateSpawnCondition: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateSpawnCondition.");
        if (t == null)
          throw new O.RequiredError("spawnCondition", "Required parameter spawnCondition was null or undefined when calling updateSpawnCondition.");
        const r = "/spawn_condition/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.SpawnConditionApiFp = function(n) {
    return {
      createSpawnCondition(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpawnConditionApiAxiosParamCreator(n).createSpawnCondition(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteSpawnCondition(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpawnConditionApiAxiosParamCreator(n).deleteSpawnCondition(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpawnCondition(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.SpawnConditionApiAxiosParamCreator(n).getSpawnCondition(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getSpawnConditionsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpawnConditionApiAxiosParamCreator(n).getSpawnConditionsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpawnConditionsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.SpawnConditionApiAxiosParamCreator(n).getSpawnConditionsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listSpawnConditions(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.SpawnConditionApiAxiosParamCreator(n).listSpawnConditions(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateSpawnCondition(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.SpawnConditionApiAxiosParamCreator(n).updateSpawnCondition(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.SpawnConditionApiFactory = function(n, e, t) {
    return {
      createSpawnCondition(a, r) {
        return d.SpawnConditionApiFp(n).createSpawnCondition(a, r).then((s) => s(t, e));
      },
      deleteSpawnCondition(a, r) {
        return d.SpawnConditionApiFp(n).deleteSpawnCondition(a, r).then((s) => s(t, e));
      },
      getSpawnCondition(a, r, s, i) {
        return d.SpawnConditionApiFp(n).getSpawnCondition(a, r, s, i).then((l) => l(t, e));
      },
      getSpawnConditionsBulk(a, r) {
        return d.SpawnConditionApiFp(n).getSpawnConditionsBulk(a, r).then((s) => s(t, e));
      },
      getSpawnConditionsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.SpawnConditionApiFp(n).getSpawnConditionsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listSpawnConditions(a, r, s, i, l, h, p, c, u, f) {
        return d.SpawnConditionApiFp(n).listSpawnConditions(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateSpawnCondition(a, r, s) {
        return d.SpawnConditionApiFp(n).updateSpawnCondition(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createSpawnCondition(e, t) {
      return d.SpawnConditionApiFp(this.configuration).createSpawnCondition(e.spawnCondition, t).then((a) => a(this.axios, this.basePath));
    }
    deleteSpawnCondition(e, t) {
      return d.SpawnConditionApiFp(this.configuration).deleteSpawnCondition(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawnCondition(e, t) {
      return d.SpawnConditionApiFp(this.configuration).getSpawnCondition(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawnConditionsBulk(e, t) {
      return d.SpawnConditionApiFp(this.configuration).getSpawnConditionsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawnConditionsCount(e = {}, t) {
      return d.SpawnConditionApiFp(this.configuration).getSpawnConditionsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listSpawnConditions(e = {}, t) {
      return d.SpawnConditionApiFp(this.configuration).listSpawnConditions(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateSpawnCondition(e, t) {
      return d.SpawnConditionApiFp(this.configuration).updateSpawnCondition(e.id, e.spawnCondition, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.SpawnConditionApi = V;
})(vn);
var Pn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.SpawnConditionValueApi = d.SpawnConditionValueApiFactory = d.SpawnConditionValueApiFp = d.SpawnConditionValueApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.SpawnConditionValueApiAxiosParamCreator = function(n) {
    return {
      createSpawnConditionValue: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("spawnConditionValue", "Required parameter spawnConditionValue was null or undefined when calling createSpawnConditionValue.");
        const a = "/spawn_condition_value", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteSpawnConditionValue: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteSpawnConditionValue.");
        const a = "/spawn_condition_value/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpawnConditionValue: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getSpawnConditionValue.");
        const s = "/spawn_condition_value/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getSpawnConditionValuesBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getSpawnConditionValuesBulk.");
        const a = "/spawn_condition_values/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpawnConditionValuesCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spawn_condition_values/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listSpawnConditionValues: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spawn_condition_values", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateSpawnConditionValue: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateSpawnConditionValue.");
        if (t == null)
          throw new O.RequiredError("spawnConditionValue", "Required parameter spawnConditionValue was null or undefined when calling updateSpawnConditionValue.");
        const r = "/spawn_condition_value/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.SpawnConditionValueApiFp = function(n) {
    return {
      createSpawnConditionValue(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpawnConditionValueApiAxiosParamCreator(n).createSpawnConditionValue(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteSpawnConditionValue(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpawnConditionValueApiAxiosParamCreator(n).deleteSpawnConditionValue(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpawnConditionValue(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.SpawnConditionValueApiAxiosParamCreator(n).getSpawnConditionValue(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getSpawnConditionValuesBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpawnConditionValueApiAxiosParamCreator(n).getSpawnConditionValuesBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpawnConditionValuesCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.SpawnConditionValueApiAxiosParamCreator(n).getSpawnConditionValuesCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listSpawnConditionValues(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.SpawnConditionValueApiAxiosParamCreator(n).listSpawnConditionValues(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateSpawnConditionValue(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.SpawnConditionValueApiAxiosParamCreator(n).updateSpawnConditionValue(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.SpawnConditionValueApiFactory = function(n, e, t) {
    return {
      createSpawnConditionValue(a, r) {
        return d.SpawnConditionValueApiFp(n).createSpawnConditionValue(a, r).then((s) => s(t, e));
      },
      deleteSpawnConditionValue(a, r) {
        return d.SpawnConditionValueApiFp(n).deleteSpawnConditionValue(a, r).then((s) => s(t, e));
      },
      getSpawnConditionValue(a, r, s, i) {
        return d.SpawnConditionValueApiFp(n).getSpawnConditionValue(a, r, s, i).then((l) => l(t, e));
      },
      getSpawnConditionValuesBulk(a, r) {
        return d.SpawnConditionValueApiFp(n).getSpawnConditionValuesBulk(a, r).then((s) => s(t, e));
      },
      getSpawnConditionValuesCount(a, r, s, i, l, h, p, c, u, f) {
        return d.SpawnConditionValueApiFp(n).getSpawnConditionValuesCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listSpawnConditionValues(a, r, s, i, l, h, p, c, u, f) {
        return d.SpawnConditionValueApiFp(n).listSpawnConditionValues(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateSpawnConditionValue(a, r, s) {
        return d.SpawnConditionValueApiFp(n).updateSpawnConditionValue(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createSpawnConditionValue(e, t) {
      return d.SpawnConditionValueApiFp(this.configuration).createSpawnConditionValue(e.spawnConditionValue, t).then((a) => a(this.axios, this.basePath));
    }
    deleteSpawnConditionValue(e, t) {
      return d.SpawnConditionValueApiFp(this.configuration).deleteSpawnConditionValue(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawnConditionValue(e, t) {
      return d.SpawnConditionValueApiFp(this.configuration).getSpawnConditionValue(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawnConditionValuesBulk(e, t) {
      return d.SpawnConditionValueApiFp(this.configuration).getSpawnConditionValuesBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawnConditionValuesCount(e = {}, t) {
      return d.SpawnConditionValueApiFp(this.configuration).getSpawnConditionValuesCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listSpawnConditionValues(e = {}, t) {
      return d.SpawnConditionValueApiFp(this.configuration).listSpawnConditionValues(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateSpawnConditionValue(e, t) {
      return d.SpawnConditionValueApiFp(this.configuration).updateSpawnConditionValue(e.id, e.spawnConditionValue, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.SpawnConditionValueApi = V;
})(Pn);
var Rn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.SpawnEventApi = d.SpawnEventApiFactory = d.SpawnEventApiFp = d.SpawnEventApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.SpawnEventApiAxiosParamCreator = function(n) {
    return {
      createSpawnEvent: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("spawnEvent", "Required parameter spawnEvent was null or undefined when calling createSpawnEvent.");
        const a = "/spawn_event", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteSpawnEvent: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteSpawnEvent.");
        const a = "/spawn_event/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpawnEvent: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getSpawnEvent.");
        const s = "/spawn_event/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getSpawnEventsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getSpawnEventsBulk.");
        const a = "/spawn_events/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpawnEventsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spawn_events/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listSpawnEvents: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spawn_events", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateSpawnEvent: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateSpawnEvent.");
        if (t == null)
          throw new O.RequiredError("spawnEvent", "Required parameter spawnEvent was null or undefined when calling updateSpawnEvent.");
        const r = "/spawn_event/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.SpawnEventApiFp = function(n) {
    return {
      createSpawnEvent(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpawnEventApiAxiosParamCreator(n).createSpawnEvent(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteSpawnEvent(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpawnEventApiAxiosParamCreator(n).deleteSpawnEvent(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpawnEvent(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.SpawnEventApiAxiosParamCreator(n).getSpawnEvent(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getSpawnEventsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpawnEventApiAxiosParamCreator(n).getSpawnEventsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpawnEventsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.SpawnEventApiAxiosParamCreator(n).getSpawnEventsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listSpawnEvents(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.SpawnEventApiAxiosParamCreator(n).listSpawnEvents(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateSpawnEvent(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.SpawnEventApiAxiosParamCreator(n).updateSpawnEvent(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.SpawnEventApiFactory = function(n, e, t) {
    return {
      createSpawnEvent(a, r) {
        return d.SpawnEventApiFp(n).createSpawnEvent(a, r).then((s) => s(t, e));
      },
      deleteSpawnEvent(a, r) {
        return d.SpawnEventApiFp(n).deleteSpawnEvent(a, r).then((s) => s(t, e));
      },
      getSpawnEvent(a, r, s, i) {
        return d.SpawnEventApiFp(n).getSpawnEvent(a, r, s, i).then((l) => l(t, e));
      },
      getSpawnEventsBulk(a, r) {
        return d.SpawnEventApiFp(n).getSpawnEventsBulk(a, r).then((s) => s(t, e));
      },
      getSpawnEventsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.SpawnEventApiFp(n).getSpawnEventsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listSpawnEvents(a, r, s, i, l, h, p, c, u, f) {
        return d.SpawnEventApiFp(n).listSpawnEvents(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateSpawnEvent(a, r, s) {
        return d.SpawnEventApiFp(n).updateSpawnEvent(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createSpawnEvent(e, t) {
      return d.SpawnEventApiFp(this.configuration).createSpawnEvent(e.spawnEvent, t).then((a) => a(this.axios, this.basePath));
    }
    deleteSpawnEvent(e, t) {
      return d.SpawnEventApiFp(this.configuration).deleteSpawnEvent(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawnEvent(e, t) {
      return d.SpawnEventApiFp(this.configuration).getSpawnEvent(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawnEventsBulk(e, t) {
      return d.SpawnEventApiFp(this.configuration).getSpawnEventsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawnEventsCount(e = {}, t) {
      return d.SpawnEventApiFp(this.configuration).getSpawnEventsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listSpawnEvents(e = {}, t) {
      return d.SpawnEventApiFp(this.configuration).listSpawnEvents(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateSpawnEvent(e, t) {
      return d.SpawnEventApiFp(this.configuration).updateSpawnEvent(e.id, e.spawnEvent, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.SpawnEventApi = V;
})(Rn);
var _n = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.Spawn2Api = d.Spawn2ApiFactory = d.Spawn2ApiFp = d.Spawn2ApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.Spawn2ApiAxiosParamCreator = function(n) {
    return {
      createSpawn2: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("spawn2", "Required parameter spawn2 was null or undefined when calling createSpawn2.");
        const a = "/spawn_2", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteSpawn2: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteSpawn2.");
        const a = "/spawn_2/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpawn2: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getSpawn2.");
        const s = "/spawn_2/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getSpawn2sBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getSpawn2sBulk.");
        const a = "/spawn_2s/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpawn2sCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spawn_2s/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listSpawn2s: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spawn_2s", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateSpawn2: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateSpawn2.");
        if (t == null)
          throw new O.RequiredError("spawn2", "Required parameter spawn2 was null or undefined when calling updateSpawn2.");
        const r = "/spawn_2/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.Spawn2ApiFp = function(n) {
    return {
      createSpawn2(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.Spawn2ApiAxiosParamCreator(n).createSpawn2(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteSpawn2(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.Spawn2ApiAxiosParamCreator(n).deleteSpawn2(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpawn2(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.Spawn2ApiAxiosParamCreator(n).getSpawn2(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getSpawn2sBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.Spawn2ApiAxiosParamCreator(n).getSpawn2sBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpawn2sCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.Spawn2ApiAxiosParamCreator(n).getSpawn2sCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listSpawn2s(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.Spawn2ApiAxiosParamCreator(n).listSpawn2s(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateSpawn2(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.Spawn2ApiAxiosParamCreator(n).updateSpawn2(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.Spawn2ApiFactory = function(n, e, t) {
    return {
      createSpawn2(a, r) {
        return d.Spawn2ApiFp(n).createSpawn2(a, r).then((s) => s(t, e));
      },
      deleteSpawn2(a, r) {
        return d.Spawn2ApiFp(n).deleteSpawn2(a, r).then((s) => s(t, e));
      },
      getSpawn2(a, r, s, i) {
        return d.Spawn2ApiFp(n).getSpawn2(a, r, s, i).then((l) => l(t, e));
      },
      getSpawn2sBulk(a, r) {
        return d.Spawn2ApiFp(n).getSpawn2sBulk(a, r).then((s) => s(t, e));
      },
      getSpawn2sCount(a, r, s, i, l, h, p, c, u, f) {
        return d.Spawn2ApiFp(n).getSpawn2sCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listSpawn2s(a, r, s, i, l, h, p, c, u, f) {
        return d.Spawn2ApiFp(n).listSpawn2s(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateSpawn2(a, r, s) {
        return d.Spawn2ApiFp(n).updateSpawn2(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createSpawn2(e, t) {
      return d.Spawn2ApiFp(this.configuration).createSpawn2(e.spawn2, t).then((a) => a(this.axios, this.basePath));
    }
    deleteSpawn2(e, t) {
      return d.Spawn2ApiFp(this.configuration).deleteSpawn2(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawn2(e, t) {
      return d.Spawn2ApiFp(this.configuration).getSpawn2(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawn2sBulk(e, t) {
      return d.Spawn2ApiFp(this.configuration).getSpawn2sBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getSpawn2sCount(e = {}, t) {
      return d.Spawn2ApiFp(this.configuration).getSpawn2sCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listSpawn2s(e = {}, t) {
      return d.Spawn2ApiFp(this.configuration).listSpawn2s(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateSpawn2(e, t) {
      return d.Spawn2ApiFp(this.configuration).updateSpawn2(e.id, e.spawn2, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.Spawn2Api = V;
})(_n);
var fr = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.SpellsNewApi = d.SpellsNewApiFactory = d.SpellsNewApiFp = d.SpellsNewApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.SpellsNewApiAxiosParamCreator = function(n) {
    return {
      createSpellsNew: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("spellsNew", "Required parameter spellsNew was null or undefined when calling createSpellsNew.");
        const a = "/spells_new", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteSpellsNew: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteSpellsNew.");
        const a = "/spells_new/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpellsNew: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getSpellsNew.");
        const s = "/spells_new/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getSpellsNewsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getSpellsNewsBulk.");
        const a = "/spells_news/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getSpellsNewsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spells_news/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listSpellsNews: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/spells_news", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateSpellsNew: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateSpellsNew.");
        if (t == null)
          throw new O.RequiredError("spellsNew", "Required parameter spellsNew was null or undefined when calling updateSpellsNew.");
        const r = "/spells_new/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.SpellsNewApiFp = function(n) {
    return {
      createSpellsNew(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpellsNewApiAxiosParamCreator(n).createSpellsNew(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteSpellsNew(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpellsNewApiAxiosParamCreator(n).deleteSpellsNew(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpellsNew(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.SpellsNewApiAxiosParamCreator(n).getSpellsNew(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getSpellsNewsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.SpellsNewApiAxiosParamCreator(n).getSpellsNewsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getSpellsNewsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.SpellsNewApiAxiosParamCreator(n).getSpellsNewsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listSpellsNews(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.SpellsNewApiAxiosParamCreator(n).listSpellsNews(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateSpellsNew(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.SpellsNewApiAxiosParamCreator(n).updateSpellsNew(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.SpellsNewApiFactory = function(n, e, t) {
    return {
      createSpellsNew(a, r) {
        return d.SpellsNewApiFp(n).createSpellsNew(a, r).then((s) => s(t, e));
      },
      deleteSpellsNew(a, r) {
        return d.SpellsNewApiFp(n).deleteSpellsNew(a, r).then((s) => s(t, e));
      },
      getSpellsNew(a, r, s, i) {
        return d.SpellsNewApiFp(n).getSpellsNew(a, r, s, i).then((l) => l(t, e));
      },
      getSpellsNewsBulk(a, r) {
        return d.SpellsNewApiFp(n).getSpellsNewsBulk(a, r).then((s) => s(t, e));
      },
      getSpellsNewsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.SpellsNewApiFp(n).getSpellsNewsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listSpellsNews(a, r, s, i, l, h, p, c, u, f) {
        return d.SpellsNewApiFp(n).listSpellsNews(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateSpellsNew(a, r, s) {
        return d.SpellsNewApiFp(n).updateSpellsNew(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createSpellsNew(e, t) {
      return d.SpellsNewApiFp(this.configuration).createSpellsNew(e.spellsNew, t).then((a) => a(this.axios, this.basePath));
    }
    deleteSpellsNew(e, t) {
      return d.SpellsNewApiFp(this.configuration).deleteSpellsNew(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getSpellsNew(e, t) {
      return d.SpellsNewApiFp(this.configuration).getSpellsNew(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getSpellsNewsBulk(e, t) {
      return d.SpellsNewApiFp(this.configuration).getSpellsNewsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getSpellsNewsCount(e = {}, t) {
      return d.SpellsNewApiFp(this.configuration).getSpellsNewsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listSpellsNews(e = {}, t) {
      return d.SpellsNewApiFp(this.configuration).listSpellsNews(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateSpellsNew(e, t) {
      return d.SpellsNewApiFp(this.configuration).updateSpellsNew(e.id, e.spellsNew, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.SpellsNewApi = V;
})(fr);
var Cn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.TrapApi = d.TrapApiFactory = d.TrapApiFp = d.TrapApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.TrapApiAxiosParamCreator = function(n) {
    return {
      createTrap: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("trap", "Required parameter trap was null or undefined when calling createTrap.");
        const a = "/trap", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteTrap: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteTrap.");
        const a = "/trap/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getTrap: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getTrap.");
        const s = "/trap/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getTrapsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getTrapsBulk.");
        const a = "/traps/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getTrapsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/traps/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listTraps: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/traps", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateTrap: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateTrap.");
        if (t == null)
          throw new O.RequiredError("trap", "Required parameter trap was null or undefined when calling updateTrap.");
        const r = "/trap/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.TrapApiFp = function(n) {
    return {
      createTrap(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.TrapApiAxiosParamCreator(n).createTrap(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteTrap(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.TrapApiAxiosParamCreator(n).deleteTrap(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getTrap(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.TrapApiAxiosParamCreator(n).getTrap(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getTrapsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.TrapApiAxiosParamCreator(n).getTrapsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getTrapsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.TrapApiAxiosParamCreator(n).getTrapsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listTraps(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.TrapApiAxiosParamCreator(n).listTraps(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateTrap(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.TrapApiAxiosParamCreator(n).updateTrap(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.TrapApiFactory = function(n, e, t) {
    return {
      createTrap(a, r) {
        return d.TrapApiFp(n).createTrap(a, r).then((s) => s(t, e));
      },
      deleteTrap(a, r) {
        return d.TrapApiFp(n).deleteTrap(a, r).then((s) => s(t, e));
      },
      getTrap(a, r, s, i) {
        return d.TrapApiFp(n).getTrap(a, r, s, i).then((l) => l(t, e));
      },
      getTrapsBulk(a, r) {
        return d.TrapApiFp(n).getTrapsBulk(a, r).then((s) => s(t, e));
      },
      getTrapsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.TrapApiFp(n).getTrapsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listTraps(a, r, s, i, l, h, p, c, u, f) {
        return d.TrapApiFp(n).listTraps(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateTrap(a, r, s) {
        return d.TrapApiFp(n).updateTrap(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createTrap(e, t) {
      return d.TrapApiFp(this.configuration).createTrap(e.trap, t).then((a) => a(this.axios, this.basePath));
    }
    deleteTrap(e, t) {
      return d.TrapApiFp(this.configuration).deleteTrap(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getTrap(e, t) {
      return d.TrapApiFp(this.configuration).getTrap(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getTrapsBulk(e, t) {
      return d.TrapApiFp(this.configuration).getTrapsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getTrapsCount(e = {}, t) {
      return d.TrapApiFp(this.configuration).getTrapsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listTraps(e = {}, t) {
      return d.TrapApiFp(this.configuration).listTraps(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateTrap(e, t) {
      return d.TrapApiFp(this.configuration).updateTrap(e.id, e.trap, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.TrapApi = V;
})(Cn);
var Vn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.ZonePointApi = d.ZonePointApiFactory = d.ZonePointApiFp = d.ZonePointApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.ZonePointApiAxiosParamCreator = function(n) {
    return {
      createZonePoint: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("zonePoint", "Required parameter zonePoint was null or undefined when calling createZonePoint.");
        const a = "/zone_point", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteZonePoint: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteZonePoint.");
        const a = "/zone_point/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getZonePoint: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getZonePoint.");
        const s = "/zone_point/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getZonePointsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getZonePointsBulk.");
        const a = "/zone_points/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getZonePointsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/zone_points/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listZonePoints: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/zone_points", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateZonePoint: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateZonePoint.");
        if (t == null)
          throw new O.RequiredError("zonePoint", "Required parameter zonePoint was null or undefined when calling updateZonePoint.");
        const r = "/zone_point/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.ZonePointApiFp = function(n) {
    return {
      createZonePoint(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ZonePointApiAxiosParamCreator(n).createZonePoint(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteZonePoint(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ZonePointApiAxiosParamCreator(n).deleteZonePoint(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getZonePoint(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.ZonePointApiAxiosParamCreator(n).getZonePoint(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getZonePointsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ZonePointApiAxiosParamCreator(n).getZonePointsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getZonePointsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ZonePointApiAxiosParamCreator(n).getZonePointsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listZonePoints(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ZonePointApiAxiosParamCreator(n).listZonePoints(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateZonePoint(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.ZonePointApiAxiosParamCreator(n).updateZonePoint(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.ZonePointApiFactory = function(n, e, t) {
    return {
      createZonePoint(a, r) {
        return d.ZonePointApiFp(n).createZonePoint(a, r).then((s) => s(t, e));
      },
      deleteZonePoint(a, r) {
        return d.ZonePointApiFp(n).deleteZonePoint(a, r).then((s) => s(t, e));
      },
      getZonePoint(a, r, s, i) {
        return d.ZonePointApiFp(n).getZonePoint(a, r, s, i).then((l) => l(t, e));
      },
      getZonePointsBulk(a, r) {
        return d.ZonePointApiFp(n).getZonePointsBulk(a, r).then((s) => s(t, e));
      },
      getZonePointsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.ZonePointApiFp(n).getZonePointsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listZonePoints(a, r, s, i, l, h, p, c, u, f) {
        return d.ZonePointApiFp(n).listZonePoints(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateZonePoint(a, r, s) {
        return d.ZonePointApiFp(n).updateZonePoint(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createZonePoint(e, t) {
      return d.ZonePointApiFp(this.configuration).createZonePoint(e.zonePoint, t).then((a) => a(this.axios, this.basePath));
    }
    deleteZonePoint(e, t) {
      return d.ZonePointApiFp(this.configuration).deleteZonePoint(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getZonePoint(e, t) {
      return d.ZonePointApiFp(this.configuration).getZonePoint(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getZonePointsBulk(e, t) {
      return d.ZonePointApiFp(this.configuration).getZonePointsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getZonePointsCount(e = {}, t) {
      return d.ZonePointApiFp(this.configuration).getZonePointsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listZonePoints(e = {}, t) {
      return d.ZonePointApiFp(this.configuration).listZonePoints(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateZonePoint(e, t) {
      return d.ZonePointApiFp(this.configuration).updateZonePoint(e.id, e.zonePoint, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.ZonePointApi = V;
})(Vn);
var En = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.BlockedSpellApi = d.BlockedSpellApiFactory = d.BlockedSpellApiFp = d.BlockedSpellApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.BlockedSpellApiAxiosParamCreator = function(n) {
    return {
      createBlockedSpell: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("blockedSpell", "Required parameter blockedSpell was null or undefined when calling createBlockedSpell.");
        const a = "/blocked_spell", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteBlockedSpell: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteBlockedSpell.");
        const a = "/blocked_spell/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getBlockedSpell: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getBlockedSpell.");
        const s = "/blocked_spell/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getBlockedSpellsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getBlockedSpellsBulk.");
        const a = "/blocked_spells/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getBlockedSpellsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/blocked_spells/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listBlockedSpells: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/blocked_spells", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateBlockedSpell: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateBlockedSpell.");
        if (t == null)
          throw new O.RequiredError("blockedSpell", "Required parameter blockedSpell was null or undefined when calling updateBlockedSpell.");
        const r = "/blocked_spell/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.BlockedSpellApiFp = function(n) {
    return {
      createBlockedSpell(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.BlockedSpellApiAxiosParamCreator(n).createBlockedSpell(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteBlockedSpell(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.BlockedSpellApiAxiosParamCreator(n).deleteBlockedSpell(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getBlockedSpell(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.BlockedSpellApiAxiosParamCreator(n).getBlockedSpell(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getBlockedSpellsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.BlockedSpellApiAxiosParamCreator(n).getBlockedSpellsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getBlockedSpellsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.BlockedSpellApiAxiosParamCreator(n).getBlockedSpellsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listBlockedSpells(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.BlockedSpellApiAxiosParamCreator(n).listBlockedSpells(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateBlockedSpell(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.BlockedSpellApiAxiosParamCreator(n).updateBlockedSpell(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.BlockedSpellApiFactory = function(n, e, t) {
    return {
      createBlockedSpell(a, r) {
        return d.BlockedSpellApiFp(n).createBlockedSpell(a, r).then((s) => s(t, e));
      },
      deleteBlockedSpell(a, r) {
        return d.BlockedSpellApiFp(n).deleteBlockedSpell(a, r).then((s) => s(t, e));
      },
      getBlockedSpell(a, r, s, i) {
        return d.BlockedSpellApiFp(n).getBlockedSpell(a, r, s, i).then((l) => l(t, e));
      },
      getBlockedSpellsBulk(a, r) {
        return d.BlockedSpellApiFp(n).getBlockedSpellsBulk(a, r).then((s) => s(t, e));
      },
      getBlockedSpellsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.BlockedSpellApiFp(n).getBlockedSpellsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listBlockedSpells(a, r, s, i, l, h, p, c, u, f) {
        return d.BlockedSpellApiFp(n).listBlockedSpells(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateBlockedSpell(a, r, s) {
        return d.BlockedSpellApiFp(n).updateBlockedSpell(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createBlockedSpell(e, t) {
      return d.BlockedSpellApiFp(this.configuration).createBlockedSpell(e.blockedSpell, t).then((a) => a(this.axios, this.basePath));
    }
    deleteBlockedSpell(e, t) {
      return d.BlockedSpellApiFp(this.configuration).deleteBlockedSpell(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getBlockedSpell(e, t) {
      return d.BlockedSpellApiFp(this.configuration).getBlockedSpell(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getBlockedSpellsBulk(e, t) {
      return d.BlockedSpellApiFp(this.configuration).getBlockedSpellsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getBlockedSpellsCount(e = {}, t) {
      return d.BlockedSpellApiFp(this.configuration).getBlockedSpellsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listBlockedSpells(e = {}, t) {
      return d.BlockedSpellApiFp(this.configuration).listBlockedSpells(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateBlockedSpell(e, t) {
      return d.BlockedSpellApiFp(this.configuration).updateBlockedSpell(e.id, e.blockedSpell, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.BlockedSpellApi = V;
})(En);
var Fn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.CharCreateCombinationApi = d.CharCreateCombinationApiFactory = d.CharCreateCombinationApiFp = d.CharCreateCombinationApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.CharCreateCombinationApiAxiosParamCreator = function(n) {
    return {
      createCharCreateCombination: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("charCreateCombination", "Required parameter charCreateCombination was null or undefined when calling createCharCreateCombination.");
        const a = "/char_create_combination", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteCharCreateCombination: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteCharCreateCombination.");
        const a = "/char_create_combination/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getCharCreateCombination: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getCharCreateCombination.");
        const s = "/char_create_combination/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getCharCreateCombinationsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getCharCreateCombinationsBulk.");
        const a = "/char_create_combinations/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getCharCreateCombinationsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/char_create_combinations/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listCharCreateCombinations: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/char_create_combinations", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateCharCreateCombination: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateCharCreateCombination.");
        if (t == null)
          throw new O.RequiredError("charCreateCombination", "Required parameter charCreateCombination was null or undefined when calling updateCharCreateCombination.");
        const r = "/char_create_combination/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.CharCreateCombinationApiFp = function(n) {
    return {
      createCharCreateCombination(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.CharCreateCombinationApiAxiosParamCreator(n).createCharCreateCombination(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteCharCreateCombination(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.CharCreateCombinationApiAxiosParamCreator(n).deleteCharCreateCombination(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getCharCreateCombination(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.CharCreateCombinationApiAxiosParamCreator(n).getCharCreateCombination(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getCharCreateCombinationsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.CharCreateCombinationApiAxiosParamCreator(n).getCharCreateCombinationsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getCharCreateCombinationsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.CharCreateCombinationApiAxiosParamCreator(n).getCharCreateCombinationsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listCharCreateCombinations(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.CharCreateCombinationApiAxiosParamCreator(n).listCharCreateCombinations(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateCharCreateCombination(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.CharCreateCombinationApiAxiosParamCreator(n).updateCharCreateCombination(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.CharCreateCombinationApiFactory = function(n, e, t) {
    return {
      createCharCreateCombination(a, r) {
        return d.CharCreateCombinationApiFp(n).createCharCreateCombination(a, r).then((s) => s(t, e));
      },
      deleteCharCreateCombination(a, r) {
        return d.CharCreateCombinationApiFp(n).deleteCharCreateCombination(a, r).then((s) => s(t, e));
      },
      getCharCreateCombination(a, r, s, i) {
        return d.CharCreateCombinationApiFp(n).getCharCreateCombination(a, r, s, i).then((l) => l(t, e));
      },
      getCharCreateCombinationsBulk(a, r) {
        return d.CharCreateCombinationApiFp(n).getCharCreateCombinationsBulk(a, r).then((s) => s(t, e));
      },
      getCharCreateCombinationsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.CharCreateCombinationApiFp(n).getCharCreateCombinationsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listCharCreateCombinations(a, r, s, i, l, h, p, c, u, f) {
        return d.CharCreateCombinationApiFp(n).listCharCreateCombinations(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateCharCreateCombination(a, r, s) {
        return d.CharCreateCombinationApiFp(n).updateCharCreateCombination(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createCharCreateCombination(e, t) {
      return d.CharCreateCombinationApiFp(this.configuration).createCharCreateCombination(e.charCreateCombination, t).then((a) => a(this.axios, this.basePath));
    }
    deleteCharCreateCombination(e, t) {
      return d.CharCreateCombinationApiFp(this.configuration).deleteCharCreateCombination(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getCharCreateCombination(e, t) {
      return d.CharCreateCombinationApiFp(this.configuration).getCharCreateCombination(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getCharCreateCombinationsBulk(e, t) {
      return d.CharCreateCombinationApiFp(this.configuration).getCharCreateCombinationsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getCharCreateCombinationsCount(e = {}, t) {
      return d.CharCreateCombinationApiFp(this.configuration).getCharCreateCombinationsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listCharCreateCombinations(e = {}, t) {
      return d.CharCreateCombinationApiFp(this.configuration).listCharCreateCombinations(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateCharCreateCombination(e, t) {
      return d.CharCreateCombinationApiFp(this.configuration).updateCharCreateCombination(e.id, e.charCreateCombination, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.CharCreateCombinationApi = V;
})(Fn);
var qn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.CharacterExpModifierApi = d.CharacterExpModifierApiFactory = d.CharacterExpModifierApiFp = d.CharacterExpModifierApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.CharacterExpModifierApiAxiosParamCreator = function(n) {
    return {
      createCharacterExpModifier: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("characterExpModifier", "Required parameter characterExpModifier was null or undefined when calling createCharacterExpModifier.");
        const a = "/character_exp_modifier", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteCharacterExpModifier: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteCharacterExpModifier.");
        const a = "/character_exp_modifier/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getCharacterExpModifier: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getCharacterExpModifier.");
        const s = "/character_exp_modifier/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getCharacterExpModifiersBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getCharacterExpModifiersBulk.");
        const a = "/character_exp_modifiers/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getCharacterExpModifiersCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/character_exp_modifiers/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listCharacterExpModifiers: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/character_exp_modifiers", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateCharacterExpModifier: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateCharacterExpModifier.");
        if (t == null)
          throw new O.RequiredError("characterExpModifier", "Required parameter characterExpModifier was null or undefined when calling updateCharacterExpModifier.");
        const r = "/character_exp_modifier/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.CharacterExpModifierApiFp = function(n) {
    return {
      createCharacterExpModifier(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.CharacterExpModifierApiAxiosParamCreator(n).createCharacterExpModifier(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteCharacterExpModifier(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.CharacterExpModifierApiAxiosParamCreator(n).deleteCharacterExpModifier(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getCharacterExpModifier(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.CharacterExpModifierApiAxiosParamCreator(n).getCharacterExpModifier(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getCharacterExpModifiersBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.CharacterExpModifierApiAxiosParamCreator(n).getCharacterExpModifiersBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getCharacterExpModifiersCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.CharacterExpModifierApiAxiosParamCreator(n).getCharacterExpModifiersCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listCharacterExpModifiers(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.CharacterExpModifierApiAxiosParamCreator(n).listCharacterExpModifiers(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateCharacterExpModifier(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.CharacterExpModifierApiAxiosParamCreator(n).updateCharacterExpModifier(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.CharacterExpModifierApiFactory = function(n, e, t) {
    return {
      createCharacterExpModifier(a, r) {
        return d.CharacterExpModifierApiFp(n).createCharacterExpModifier(a, r).then((s) => s(t, e));
      },
      deleteCharacterExpModifier(a, r) {
        return d.CharacterExpModifierApiFp(n).deleteCharacterExpModifier(a, r).then((s) => s(t, e));
      },
      getCharacterExpModifier(a, r, s, i) {
        return d.CharacterExpModifierApiFp(n).getCharacterExpModifier(a, r, s, i).then((l) => l(t, e));
      },
      getCharacterExpModifiersBulk(a, r) {
        return d.CharacterExpModifierApiFp(n).getCharacterExpModifiersBulk(a, r).then((s) => s(t, e));
      },
      getCharacterExpModifiersCount(a, r, s, i, l, h, p, c, u, f) {
        return d.CharacterExpModifierApiFp(n).getCharacterExpModifiersCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listCharacterExpModifiers(a, r, s, i, l, h, p, c, u, f) {
        return d.CharacterExpModifierApiFp(n).listCharacterExpModifiers(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateCharacterExpModifier(a, r, s) {
        return d.CharacterExpModifierApiFp(n).updateCharacterExpModifier(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createCharacterExpModifier(e, t) {
      return d.CharacterExpModifierApiFp(this.configuration).createCharacterExpModifier(e.characterExpModifier, t).then((a) => a(this.axios, this.basePath));
    }
    deleteCharacterExpModifier(e, t) {
      return d.CharacterExpModifierApiFp(this.configuration).deleteCharacterExpModifier(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getCharacterExpModifier(e, t) {
      return d.CharacterExpModifierApiFp(this.configuration).getCharacterExpModifier(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getCharacterExpModifiersBulk(e, t) {
      return d.CharacterExpModifierApiFp(this.configuration).getCharacterExpModifiersBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getCharacterExpModifiersCount(e = {}, t) {
      return d.CharacterExpModifierApiFp(this.configuration).getCharacterExpModifiersCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listCharacterExpModifiers(e = {}, t) {
      return d.CharacterExpModifierApiFp(this.configuration).listCharacterExpModifiers(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateCharacterExpModifier(e, t) {
      return d.CharacterExpModifierApiFp(this.configuration).updateCharacterExpModifier(e.id, e.characterExpModifier, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.CharacterExpModifierApi = V;
})(qn);
var Tn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.FishingApi = d.FishingApiFactory = d.FishingApiFp = d.FishingApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.FishingApiAxiosParamCreator = function(n) {
    return {
      createFishing: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("fishing", "Required parameter fishing was null or undefined when calling createFishing.");
        const a = "/fishing", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteFishing: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteFishing.");
        const a = "/fishing/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getFishing: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getFishing.");
        const s = "/fishing/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getFishingsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getFishingsBulk.");
        const a = "/fishings/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getFishingsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/fishings/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listFishings: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/fishings", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateFishing: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateFishing.");
        if (t == null)
          throw new O.RequiredError("fishing", "Required parameter fishing was null or undefined when calling updateFishing.");
        const r = "/fishing/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.FishingApiFp = function(n) {
    return {
      createFishing(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.FishingApiAxiosParamCreator(n).createFishing(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteFishing(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.FishingApiAxiosParamCreator(n).deleteFishing(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getFishing(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.FishingApiAxiosParamCreator(n).getFishing(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getFishingsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.FishingApiAxiosParamCreator(n).getFishingsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getFishingsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.FishingApiAxiosParamCreator(n).getFishingsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listFishings(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.FishingApiAxiosParamCreator(n).listFishings(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateFishing(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.FishingApiAxiosParamCreator(n).updateFishing(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.FishingApiFactory = function(n, e, t) {
    return {
      createFishing(a, r) {
        return d.FishingApiFp(n).createFishing(a, r).then((s) => s(t, e));
      },
      deleteFishing(a, r) {
        return d.FishingApiFp(n).deleteFishing(a, r).then((s) => s(t, e));
      },
      getFishing(a, r, s, i) {
        return d.FishingApiFp(n).getFishing(a, r, s, i).then((l) => l(t, e));
      },
      getFishingsBulk(a, r) {
        return d.FishingApiFp(n).getFishingsBulk(a, r).then((s) => s(t, e));
      },
      getFishingsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.FishingApiFp(n).getFishingsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listFishings(a, r, s, i, l, h, p, c, u, f) {
        return d.FishingApiFp(n).listFishings(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateFishing(a, r, s) {
        return d.FishingApiFp(n).updateFishing(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createFishing(e, t) {
      return d.FishingApiFp(this.configuration).createFishing(e.fishing, t).then((a) => a(this.axios, this.basePath));
    }
    deleteFishing(e, t) {
      return d.FishingApiFp(this.configuration).deleteFishing(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getFishing(e, t) {
      return d.FishingApiFp(this.configuration).getFishing(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getFishingsBulk(e, t) {
      return d.FishingApiFp(this.configuration).getFishingsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getFishingsCount(e = {}, t) {
      return d.FishingApiFp(this.configuration).getFishingsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listFishings(e = {}, t) {
      return d.FishingApiFp(this.configuration).listFishings(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateFishing(e, t) {
      return d.FishingApiFp(this.configuration).updateFishing(e.id, e.fishing, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.FishingApi = V;
})(Tn);
var Un = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.ForageApi = d.ForageApiFactory = d.ForageApiFp = d.ForageApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.ForageApiAxiosParamCreator = function(n) {
    return {
      createForage: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("forage", "Required parameter forage was null or undefined when calling createForage.");
        const a = "/forage", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteForage: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteForage.");
        const a = "/forage/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getForage: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getForage.");
        const s = "/forage/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getForagesBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getForagesBulk.");
        const a = "/forages/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getForagesCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/forages/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listForages: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/forages", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateForage: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateForage.");
        if (t == null)
          throw new O.RequiredError("forage", "Required parameter forage was null or undefined when calling updateForage.");
        const r = "/forage/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.ForageApiFp = function(n) {
    return {
      createForage(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ForageApiAxiosParamCreator(n).createForage(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteForage(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ForageApiAxiosParamCreator(n).deleteForage(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getForage(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.ForageApiAxiosParamCreator(n).getForage(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getForagesBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ForageApiAxiosParamCreator(n).getForagesBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getForagesCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ForageApiAxiosParamCreator(n).getForagesCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listForages(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ForageApiAxiosParamCreator(n).listForages(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateForage(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.ForageApiAxiosParamCreator(n).updateForage(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.ForageApiFactory = function(n, e, t) {
    return {
      createForage(a, r) {
        return d.ForageApiFp(n).createForage(a, r).then((s) => s(t, e));
      },
      deleteForage(a, r) {
        return d.ForageApiFp(n).deleteForage(a, r).then((s) => s(t, e));
      },
      getForage(a, r, s, i) {
        return d.ForageApiFp(n).getForage(a, r, s, i).then((l) => l(t, e));
      },
      getForagesBulk(a, r) {
        return d.ForageApiFp(n).getForagesBulk(a, r).then((s) => s(t, e));
      },
      getForagesCount(a, r, s, i, l, h, p, c, u, f) {
        return d.ForageApiFp(n).getForagesCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listForages(a, r, s, i, l, h, p, c, u, f) {
        return d.ForageApiFp(n).listForages(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateForage(a, r, s) {
        return d.ForageApiFp(n).updateForage(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createForage(e, t) {
      return d.ForageApiFp(this.configuration).createForage(e.forage, t).then((a) => a(this.axios, this.basePath));
    }
    deleteForage(e, t) {
      return d.ForageApiFp(this.configuration).deleteForage(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getForage(e, t) {
      return d.ForageApiFp(this.configuration).getForage(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getForagesBulk(e, t) {
      return d.ForageApiFp(this.configuration).getForagesBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getForagesCount(e = {}, t) {
      return d.ForageApiFp(this.configuration).getForagesCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listForages(e = {}, t) {
      return d.ForageApiFp(this.configuration).listForages(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateForage(e, t) {
      return d.ForageApiFp(this.configuration).updateForage(e.id, e.forage, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.ForageApi = V;
})(Un);
var Bn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.GraveyardApi = d.GraveyardApiFactory = d.GraveyardApiFp = d.GraveyardApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.GraveyardApiAxiosParamCreator = function(n) {
    return {
      createGraveyard: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("graveyard", "Required parameter graveyard was null or undefined when calling createGraveyard.");
        const a = "/graveyard", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteGraveyard: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteGraveyard.");
        const a = "/graveyard/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGraveyard: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getGraveyard.");
        const s = "/graveyard/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getGraveyardsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getGraveyardsBulk.");
        const a = "/graveyards/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGraveyardsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/graveyards/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listGraveyards: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/graveyards", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateGraveyard: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateGraveyard.");
        if (t == null)
          throw new O.RequiredError("graveyard", "Required parameter graveyard was null or undefined when calling updateGraveyard.");
        const r = "/graveyard/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.GraveyardApiFp = function(n) {
    return {
      createGraveyard(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GraveyardApiAxiosParamCreator(n).createGraveyard(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteGraveyard(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GraveyardApiAxiosParamCreator(n).deleteGraveyard(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGraveyard(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.GraveyardApiAxiosParamCreator(n).getGraveyard(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getGraveyardsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GraveyardApiAxiosParamCreator(n).getGraveyardsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGraveyardsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GraveyardApiAxiosParamCreator(n).getGraveyardsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listGraveyards(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GraveyardApiAxiosParamCreator(n).listGraveyards(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateGraveyard(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.GraveyardApiAxiosParamCreator(n).updateGraveyard(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.GraveyardApiFactory = function(n, e, t) {
    return {
      createGraveyard(a, r) {
        return d.GraveyardApiFp(n).createGraveyard(a, r).then((s) => s(t, e));
      },
      deleteGraveyard(a, r) {
        return d.GraveyardApiFp(n).deleteGraveyard(a, r).then((s) => s(t, e));
      },
      getGraveyard(a, r, s, i) {
        return d.GraveyardApiFp(n).getGraveyard(a, r, s, i).then((l) => l(t, e));
      },
      getGraveyardsBulk(a, r) {
        return d.GraveyardApiFp(n).getGraveyardsBulk(a, r).then((s) => s(t, e));
      },
      getGraveyardsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.GraveyardApiFp(n).getGraveyardsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listGraveyards(a, r, s, i, l, h, p, c, u, f) {
        return d.GraveyardApiFp(n).listGraveyards(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateGraveyard(a, r, s) {
        return d.GraveyardApiFp(n).updateGraveyard(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createGraveyard(e, t) {
      return d.GraveyardApiFp(this.configuration).createGraveyard(e.graveyard, t).then((a) => a(this.axios, this.basePath));
    }
    deleteGraveyard(e, t) {
      return d.GraveyardApiFp(this.configuration).deleteGraveyard(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getGraveyard(e, t) {
      return d.GraveyardApiFp(this.configuration).getGraveyard(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getGraveyardsBulk(e, t) {
      return d.GraveyardApiFp(this.configuration).getGraveyardsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getGraveyardsCount(e = {}, t) {
      return d.GraveyardApiFp(this.configuration).getGraveyardsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listGraveyards(e = {}, t) {
      return d.GraveyardApiFp(this.configuration).listGraveyards(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateGraveyard(e, t) {
      return d.GraveyardApiFp(this.configuration).updateGraveyard(e.id, e.graveyard, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.GraveyardApi = V;
})(Bn);
var kn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.GridApi = d.GridApiFactory = d.GridApiFp = d.GridApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.GridApiAxiosParamCreator = function(n) {
    return {
      createGrid: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("grid", "Required parameter grid was null or undefined when calling createGrid.");
        const a = "/grid", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteGrid: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteGrid.");
        const a = "/grid/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGrid: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getGrid.");
        const s = "/grid/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getGridsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getGridsBulk.");
        const a = "/grids/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGridsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/grids/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listGrids: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/grids", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateGrid: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateGrid.");
        if (t == null)
          throw new O.RequiredError("grid", "Required parameter grid was null or undefined when calling updateGrid.");
        const r = "/grid/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.GridApiFp = function(n) {
    return {
      createGrid(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GridApiAxiosParamCreator(n).createGrid(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteGrid(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GridApiAxiosParamCreator(n).deleteGrid(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGrid(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.GridApiAxiosParamCreator(n).getGrid(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getGridsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GridApiAxiosParamCreator(n).getGridsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGridsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GridApiAxiosParamCreator(n).getGridsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listGrids(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GridApiAxiosParamCreator(n).listGrids(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateGrid(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.GridApiAxiosParamCreator(n).updateGrid(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.GridApiFactory = function(n, e, t) {
    return {
      createGrid(a, r) {
        return d.GridApiFp(n).createGrid(a, r).then((s) => s(t, e));
      },
      deleteGrid(a, r) {
        return d.GridApiFp(n).deleteGrid(a, r).then((s) => s(t, e));
      },
      getGrid(a, r, s, i) {
        return d.GridApiFp(n).getGrid(a, r, s, i).then((l) => l(t, e));
      },
      getGridsBulk(a, r) {
        return d.GridApiFp(n).getGridsBulk(a, r).then((s) => s(t, e));
      },
      getGridsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.GridApiFp(n).getGridsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listGrids(a, r, s, i, l, h, p, c, u, f) {
        return d.GridApiFp(n).listGrids(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateGrid(a, r, s) {
        return d.GridApiFp(n).updateGrid(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createGrid(e, t) {
      return d.GridApiFp(this.configuration).createGrid(e.grid, t).then((a) => a(this.axios, this.basePath));
    }
    deleteGrid(e, t) {
      return d.GridApiFp(this.configuration).deleteGrid(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getGrid(e, t) {
      return d.GridApiFp(this.configuration).getGrid(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getGridsBulk(e, t) {
      return d.GridApiFp(this.configuration).getGridsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getGridsCount(e = {}, t) {
      return d.GridApiFp(this.configuration).getGridsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listGrids(e = {}, t) {
      return d.GridApiFp(this.configuration).listGrids(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateGrid(e, t) {
      return d.GridApiFp(this.configuration).updateGrid(e.id, e.grid, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.GridApi = V;
})(kn);
var Ln = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.GridEntryApi = d.GridEntryApiFactory = d.GridEntryApiFp = d.GridEntryApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.GridEntryApiAxiosParamCreator = function(n) {
    return {
      createGridEntry: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("gridEntry", "Required parameter gridEntry was null or undefined when calling createGridEntry.");
        const a = "/grid_entry", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteGridEntry: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteGridEntry.");
        const a = "/grid_entry/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGridEntriesBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getGridEntriesBulk.");
        const a = "/grid_entries/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGridEntriesCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/grid_entries/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      getGridEntry: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getGridEntry.");
        const s = "/grid_entry/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      listGridEntries: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/grid_entries", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateGridEntry: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateGridEntry.");
        if (t == null)
          throw new O.RequiredError("gridEntry", "Required parameter gridEntry was null or undefined when calling updateGridEntry.");
        const r = "/grid_entry/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.GridEntryApiFp = function(n) {
    return {
      createGridEntry(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GridEntryApiAxiosParamCreator(n).createGridEntry(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteGridEntry(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GridEntryApiAxiosParamCreator(n).deleteGridEntry(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGridEntriesBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GridEntryApiAxiosParamCreator(n).getGridEntriesBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGridEntriesCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GridEntryApiAxiosParamCreator(n).getGridEntriesCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      getGridEntry(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.GridEntryApiAxiosParamCreator(n).getGridEntry(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      listGridEntries(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GridEntryApiAxiosParamCreator(n).listGridEntries(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateGridEntry(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.GridEntryApiAxiosParamCreator(n).updateGridEntry(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.GridEntryApiFactory = function(n, e, t) {
    return {
      createGridEntry(a, r) {
        return d.GridEntryApiFp(n).createGridEntry(a, r).then((s) => s(t, e));
      },
      deleteGridEntry(a, r) {
        return d.GridEntryApiFp(n).deleteGridEntry(a, r).then((s) => s(t, e));
      },
      getGridEntriesBulk(a, r) {
        return d.GridEntryApiFp(n).getGridEntriesBulk(a, r).then((s) => s(t, e));
      },
      getGridEntriesCount(a, r, s, i, l, h, p, c, u, f) {
        return d.GridEntryApiFp(n).getGridEntriesCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      getGridEntry(a, r, s, i) {
        return d.GridEntryApiFp(n).getGridEntry(a, r, s, i).then((l) => l(t, e));
      },
      listGridEntries(a, r, s, i, l, h, p, c, u, f) {
        return d.GridEntryApiFp(n).listGridEntries(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateGridEntry(a, r, s) {
        return d.GridEntryApiFp(n).updateGridEntry(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createGridEntry(e, t) {
      return d.GridEntryApiFp(this.configuration).createGridEntry(e.gridEntry, t).then((a) => a(this.axios, this.basePath));
    }
    deleteGridEntry(e, t) {
      return d.GridEntryApiFp(this.configuration).deleteGridEntry(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getGridEntriesBulk(e, t) {
      return d.GridEntryApiFp(this.configuration).getGridEntriesBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getGridEntriesCount(e = {}, t) {
      return d.GridEntryApiFp(this.configuration).getGridEntriesCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getGridEntry(e, t) {
      return d.GridEntryApiFp(this.configuration).getGridEntry(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listGridEntries(e = {}, t) {
      return d.GridEntryApiFp(this.configuration).listGridEntries(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateGridEntry(e, t) {
      return d.GridEntryApiFp(this.configuration).updateGridEntry(e.id, e.gridEntry, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.GridEntryApi = V;
})(Ln);
var Gn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.GroundSpawnApi = d.GroundSpawnApiFactory = d.GroundSpawnApiFp = d.GroundSpawnApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.GroundSpawnApiAxiosParamCreator = function(n) {
    return {
      createGroundSpawn: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("groundSpawn", "Required parameter groundSpawn was null or undefined when calling createGroundSpawn.");
        const a = "/ground_spawn", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteGroundSpawn: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteGroundSpawn.");
        const a = "/ground_spawn/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGroundSpawn: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getGroundSpawn.");
        const s = "/ground_spawn/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getGroundSpawnsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getGroundSpawnsBulk.");
        const a = "/ground_spawns/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getGroundSpawnsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/ground_spawns/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listGroundSpawns: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/ground_spawns", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateGroundSpawn: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateGroundSpawn.");
        if (t == null)
          throw new O.RequiredError("groundSpawn", "Required parameter groundSpawn was null or undefined when calling updateGroundSpawn.");
        const r = "/ground_spawn/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.GroundSpawnApiFp = function(n) {
    return {
      createGroundSpawn(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GroundSpawnApiAxiosParamCreator(n).createGroundSpawn(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteGroundSpawn(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GroundSpawnApiAxiosParamCreator(n).deleteGroundSpawn(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGroundSpawn(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.GroundSpawnApiAxiosParamCreator(n).getGroundSpawn(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getGroundSpawnsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.GroundSpawnApiAxiosParamCreator(n).getGroundSpawnsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getGroundSpawnsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GroundSpawnApiAxiosParamCreator(n).getGroundSpawnsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listGroundSpawns(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.GroundSpawnApiAxiosParamCreator(n).listGroundSpawns(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateGroundSpawn(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.GroundSpawnApiAxiosParamCreator(n).updateGroundSpawn(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.GroundSpawnApiFactory = function(n, e, t) {
    return {
      createGroundSpawn(a, r) {
        return d.GroundSpawnApiFp(n).createGroundSpawn(a, r).then((s) => s(t, e));
      },
      deleteGroundSpawn(a, r) {
        return d.GroundSpawnApiFp(n).deleteGroundSpawn(a, r).then((s) => s(t, e));
      },
      getGroundSpawn(a, r, s, i) {
        return d.GroundSpawnApiFp(n).getGroundSpawn(a, r, s, i).then((l) => l(t, e));
      },
      getGroundSpawnsBulk(a, r) {
        return d.GroundSpawnApiFp(n).getGroundSpawnsBulk(a, r).then((s) => s(t, e));
      },
      getGroundSpawnsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.GroundSpawnApiFp(n).getGroundSpawnsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listGroundSpawns(a, r, s, i, l, h, p, c, u, f) {
        return d.GroundSpawnApiFp(n).listGroundSpawns(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateGroundSpawn(a, r, s) {
        return d.GroundSpawnApiFp(n).updateGroundSpawn(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createGroundSpawn(e, t) {
      return d.GroundSpawnApiFp(this.configuration).createGroundSpawn(e.groundSpawn, t).then((a) => a(this.axios, this.basePath));
    }
    deleteGroundSpawn(e, t) {
      return d.GroundSpawnApiFp(this.configuration).deleteGroundSpawn(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getGroundSpawn(e, t) {
      return d.GroundSpawnApiFp(this.configuration).getGroundSpawn(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getGroundSpawnsBulk(e, t) {
      return d.GroundSpawnApiFp(this.configuration).getGroundSpawnsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getGroundSpawnsCount(e = {}, t) {
      return d.GroundSpawnApiFp(this.configuration).getGroundSpawnsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listGroundSpawns(e = {}, t) {
      return d.GroundSpawnApiFp(this.configuration).listGroundSpawns(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateGroundSpawn(e, t) {
      return d.GroundSpawnApiFp(this.configuration).updateGroundSpawn(e.id, e.groundSpawn, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.GroundSpawnApi = V;
})(Gn);
var Hn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.ObjectApi = d.ObjectApiFactory = d.ObjectApiFp = d.ObjectApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.ObjectApiAxiosParamCreator = function(n) {
    return {
      createObject: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("object", "Required parameter object was null or undefined when calling createObject.");
        const a = "/object", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteObject: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteObject.");
        const a = "/object/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getObject: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getObject.");
        const s = "/object/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getObjectsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getObjectsBulk.");
        const a = "/objects/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getObjectsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/objects/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listObjects: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/objects", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateObject: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateObject.");
        if (t == null)
          throw new O.RequiredError("object", "Required parameter object was null or undefined when calling updateObject.");
        const r = "/object/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.ObjectApiFp = function(n) {
    return {
      createObject(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ObjectApiAxiosParamCreator(n).createObject(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteObject(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ObjectApiAxiosParamCreator(n).deleteObject(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getObject(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.ObjectApiAxiosParamCreator(n).getObject(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getObjectsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ObjectApiAxiosParamCreator(n).getObjectsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getObjectsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ObjectApiAxiosParamCreator(n).getObjectsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listObjects(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ObjectApiAxiosParamCreator(n).listObjects(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateObject(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.ObjectApiAxiosParamCreator(n).updateObject(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.ObjectApiFactory = function(n, e, t) {
    return {
      createObject(a, r) {
        return d.ObjectApiFp(n).createObject(a, r).then((s) => s(t, e));
      },
      deleteObject(a, r) {
        return d.ObjectApiFp(n).deleteObject(a, r).then((s) => s(t, e));
      },
      getObject(a, r, s, i) {
        return d.ObjectApiFp(n).getObject(a, r, s, i).then((l) => l(t, e));
      },
      getObjectsBulk(a, r) {
        return d.ObjectApiFp(n).getObjectsBulk(a, r).then((s) => s(t, e));
      },
      getObjectsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.ObjectApiFp(n).getObjectsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listObjects(a, r, s, i, l, h, p, c, u, f) {
        return d.ObjectApiFp(n).listObjects(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateObject(a, r, s) {
        return d.ObjectApiFp(n).updateObject(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createObject(e, t) {
      return d.ObjectApiFp(this.configuration).createObject(e.object, t).then((a) => a(this.axios, this.basePath));
    }
    deleteObject(e, t) {
      return d.ObjectApiFp(this.configuration).deleteObject(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getObject(e, t) {
      return d.ObjectApiFp(this.configuration).getObject(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getObjectsBulk(e, t) {
      return d.ObjectApiFp(this.configuration).getObjectsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getObjectsCount(e = {}, t) {
      return d.ObjectApiFp(this.configuration).getObjectsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listObjects(e = {}, t) {
      return d.ObjectApiFp(this.configuration).listObjects(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateObject(e, t) {
      return d.ObjectApiFp(this.configuration).updateObject(e.id, e.object, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.ObjectApi = V;
})(Hn);
var xn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.QuestGlobalApi = d.QuestGlobalApiFactory = d.QuestGlobalApiFp = d.QuestGlobalApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.QuestGlobalApiAxiosParamCreator = function(n) {
    return {
      createQuestGlobal: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("questGlobal", "Required parameter questGlobal was null or undefined when calling createQuestGlobal.");
        const a = "/quest_global", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteQuestGlobal: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteQuestGlobal.");
        const a = "/quest_global/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getQuestGlobal: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getQuestGlobal.");
        const s = "/quest_global/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getQuestGlobalsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getQuestGlobalsBulk.");
        const a = "/quest_globals/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getQuestGlobalsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/quest_globals/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listQuestGlobals: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/quest_globals", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateQuestGlobal: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateQuestGlobal.");
        if (t == null)
          throw new O.RequiredError("questGlobal", "Required parameter questGlobal was null or undefined when calling updateQuestGlobal.");
        const r = "/quest_global/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.QuestGlobalApiFp = function(n) {
    return {
      createQuestGlobal(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.QuestGlobalApiAxiosParamCreator(n).createQuestGlobal(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteQuestGlobal(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.QuestGlobalApiAxiosParamCreator(n).deleteQuestGlobal(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getQuestGlobal(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.QuestGlobalApiAxiosParamCreator(n).getQuestGlobal(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getQuestGlobalsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.QuestGlobalApiAxiosParamCreator(n).getQuestGlobalsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getQuestGlobalsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.QuestGlobalApiAxiosParamCreator(n).getQuestGlobalsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listQuestGlobals(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.QuestGlobalApiAxiosParamCreator(n).listQuestGlobals(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateQuestGlobal(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.QuestGlobalApiAxiosParamCreator(n).updateQuestGlobal(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.QuestGlobalApiFactory = function(n, e, t) {
    return {
      createQuestGlobal(a, r) {
        return d.QuestGlobalApiFp(n).createQuestGlobal(a, r).then((s) => s(t, e));
      },
      deleteQuestGlobal(a, r) {
        return d.QuestGlobalApiFp(n).deleteQuestGlobal(a, r).then((s) => s(t, e));
      },
      getQuestGlobal(a, r, s, i) {
        return d.QuestGlobalApiFp(n).getQuestGlobal(a, r, s, i).then((l) => l(t, e));
      },
      getQuestGlobalsBulk(a, r) {
        return d.QuestGlobalApiFp(n).getQuestGlobalsBulk(a, r).then((s) => s(t, e));
      },
      getQuestGlobalsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.QuestGlobalApiFp(n).getQuestGlobalsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listQuestGlobals(a, r, s, i, l, h, p, c, u, f) {
        return d.QuestGlobalApiFp(n).listQuestGlobals(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateQuestGlobal(a, r, s) {
        return d.QuestGlobalApiFp(n).updateQuestGlobal(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createQuestGlobal(e, t) {
      return d.QuestGlobalApiFp(this.configuration).createQuestGlobal(e.questGlobal, t).then((a) => a(this.axios, this.basePath));
    }
    deleteQuestGlobal(e, t) {
      return d.QuestGlobalApiFp(this.configuration).deleteQuestGlobal(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getQuestGlobal(e, t) {
      return d.QuestGlobalApiFp(this.configuration).getQuestGlobal(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getQuestGlobalsBulk(e, t) {
      return d.QuestGlobalApiFp(this.configuration).getQuestGlobalsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getQuestGlobalsCount(e = {}, t) {
      return d.QuestGlobalApiFp(this.configuration).getQuestGlobalsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listQuestGlobals(e = {}, t) {
      return d.QuestGlobalApiFp(this.configuration).listQuestGlobals(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateQuestGlobal(e, t) {
      return d.QuestGlobalApiFp(this.configuration).updateQuestGlobal(e.id, e.questGlobal, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.QuestGlobalApi = V;
})(xn);
var Mn = {};
(function(d) {
  Object.defineProperty(d, "__esModule", { value: !0 }), d.ZoneFlagApi = d.ZoneFlagApiFactory = d.ZoneFlagApiFp = d.ZoneFlagApiAxiosParamCreator = void 0;
  const m = N, A = m.__importDefault(Z()), O = Q();
  d.ZoneFlagApiAxiosParamCreator = function(n) {
    return {
      createZoneFlag: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("zoneFlag", "Required parameter zoneFlag was null or undefined when calling createZoneFlag.");
        const a = "/zone_flag", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "PUT" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      deleteZoneFlag: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling deleteZoneFlag.");
        const a = "/zone_flag/{id}".replace("{id}", encodeURIComponent(String(e))), r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "DELETE" }, s), t), l = {}, h = {}, p = new URLSearchParams(r.search);
        for (const u in h)
          p.set(u, h[u]);
        for (const u in t.query)
          p.set(u, t.query[u]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        return i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers), {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getZoneFlag: (e, t, a, r = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling getZoneFlag.");
        const s = "/zone_flag/{id}".replace("{id}", encodeURIComponent(String(e))), i = new URL(s, "https://example.com");
        let l;
        n && (l = n.baseOptions);
        const h = Object.assign(Object.assign({ method: "GET" }, l), r), p = {}, c = {};
        t !== void 0 && (c.includes = t), a !== void 0 && (c.select = a);
        const u = new URLSearchParams(i.search);
        for (const o in c)
          u.set(o, c[o]);
        for (const o in r.query)
          u.set(o, r.query[o]);
        i.search = new URLSearchParams(u).toString();
        let f = l && l.headers ? l.headers : {};
        return h.headers = Object.assign(Object.assign(Object.assign({}, p), f), r.headers), {
          url: i.pathname + i.search + i.hash,
          options: h
        };
      }),
      getZoneFlagsBulk: (e, t = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("body", "Required parameter body was null or undefined when calling getZoneFlagsBulk.");
        const a = "/zone_flags/bulk", r = new URL(a, "https://example.com");
        let s;
        n && (s = n.baseOptions);
        const i = Object.assign(Object.assign({ method: "POST" }, s), t), l = {}, h = {};
        l["Content-Type"] = "application/json";
        const p = new URLSearchParams(r.search);
        for (const o in h)
          p.set(o, h[o]);
        for (const o in t.query)
          p.set(o, t.query[o]);
        r.search = new URLSearchParams(p).toString();
        let c = s && s.headers ? s.headers : {};
        i.headers = Object.assign(Object.assign(Object.assign({}, l), c), t.headers);
        const u = typeof e != "string", f = u && n && n.isJsonMime ? n.isJsonMime(i.headers["Content-Type"]) : u;
        return i.data = f ? JSON.stringify(e !== void 0 ? e : {}) : e || "", {
          url: r.pathname + r.search + r.hash,
          options: i
        };
      }),
      getZoneFlagsCount: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/zone_flags/count", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      listZoneFlags: (e, t, a, r, s, i, l, h, p, c = {}) => m.__awaiter(this, void 0, void 0, function* () {
        const u = "/zone_flags", f = new URL(u, "https://example.com");
        let o;
        n && (o = n.baseOptions);
        const y = Object.assign(Object.assign({ method: "GET" }, o), c), E = {}, b = {};
        e !== void 0 && (b.includes = e), t !== void 0 && (b.where = t), a !== void 0 && (b.whereOr = a), r !== void 0 && (b.groupBy = r), s !== void 0 && (b.limit = s), i !== void 0 && (b.page = i), l !== void 0 && (b.orderBy = l), h !== void 0 && (b.orderDirection = h), p !== void 0 && (b.select = p);
        const R = new URLSearchParams(f.search);
        for (const v in b)
          R.set(v, b[v]);
        for (const v in c.query)
          R.set(v, c.query[v]);
        f.search = new URLSearchParams(R).toString();
        let q = o && o.headers ? o.headers : {};
        return y.headers = Object.assign(Object.assign(Object.assign({}, E), q), c.headers), {
          url: f.pathname + f.search + f.hash,
          options: y
        };
      }),
      updateZoneFlag: (e, t, a = {}) => m.__awaiter(this, void 0, void 0, function* () {
        if (e == null)
          throw new O.RequiredError("id", "Required parameter id was null or undefined when calling updateZoneFlag.");
        if (t == null)
          throw new O.RequiredError("zoneFlag", "Required parameter zoneFlag was null or undefined when calling updateZoneFlag.");
        const r = "/zone_flag/{id}".replace("{id}", encodeURIComponent(String(e))), s = new URL(r, "https://example.com");
        let i;
        n && (i = n.baseOptions);
        const l = Object.assign(Object.assign({ method: "PATCH" }, i), a), h = {}, p = {};
        h["Content-Type"] = "application/json";
        const c = new URLSearchParams(s.search);
        for (const y in p)
          c.set(y, p[y]);
        for (const y in a.query)
          c.set(y, a.query[y]);
        s.search = new URLSearchParams(c).toString();
        let u = i && i.headers ? i.headers : {};
        l.headers = Object.assign(Object.assign(Object.assign({}, h), u), a.headers);
        const f = typeof t != "string", o = f && n && n.isJsonMime ? n.isJsonMime(l.headers["Content-Type"]) : f;
        return l.data = o ? JSON.stringify(t !== void 0 ? t : {}) : t || "", {
          url: s.pathname + s.search + s.hash,
          options: l
        };
      })
    };
  }, d.ZoneFlagApiFp = function(n) {
    return {
      createZoneFlag(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ZoneFlagApiAxiosParamCreator(n).createZoneFlag(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      deleteZoneFlag(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ZoneFlagApiAxiosParamCreator(n).deleteZoneFlag(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getZoneFlag(e, t, a, r) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const s = yield d.ZoneFlagApiAxiosParamCreator(n).getZoneFlag(e, t, a, r);
          return (i = A.default, l = O.BASE_PATH) => {
            const h = Object.assign(Object.assign({}, s.options), { url: (n?.basePath || l) + s.url });
            return i.request(h);
          };
        });
      },
      getZoneFlagsBulk(e, t) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const a = yield d.ZoneFlagApiAxiosParamCreator(n).getZoneFlagsBulk(e, t);
          return (r = A.default, s = O.BASE_PATH) => {
            const i = Object.assign(Object.assign({}, a.options), { url: (n?.basePath || s) + a.url });
            return r.request(i);
          };
        });
      },
      getZoneFlagsCount(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ZoneFlagApiAxiosParamCreator(n).getZoneFlagsCount(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      listZoneFlags(e, t, a, r, s, i, l, h, p, c) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const u = yield d.ZoneFlagApiAxiosParamCreator(n).listZoneFlags(e, t, a, r, s, i, l, h, p, c);
          return (f = A.default, o = O.BASE_PATH) => {
            const y = Object.assign(Object.assign({}, u.options), { url: (n?.basePath || o) + u.url });
            return f.request(y);
          };
        });
      },
      updateZoneFlag(e, t, a) {
        return m.__awaiter(this, void 0, void 0, function* () {
          const r = yield d.ZoneFlagApiAxiosParamCreator(n).updateZoneFlag(e, t, a);
          return (s = A.default, i = O.BASE_PATH) => {
            const l = Object.assign(Object.assign({}, r.options), { url: (n?.basePath || i) + r.url });
            return s.request(l);
          };
        });
      }
    };
  }, d.ZoneFlagApiFactory = function(n, e, t) {
    return {
      createZoneFlag(a, r) {
        return d.ZoneFlagApiFp(n).createZoneFlag(a, r).then((s) => s(t, e));
      },
      deleteZoneFlag(a, r) {
        return d.ZoneFlagApiFp(n).deleteZoneFlag(a, r).then((s) => s(t, e));
      },
      getZoneFlag(a, r, s, i) {
        return d.ZoneFlagApiFp(n).getZoneFlag(a, r, s, i).then((l) => l(t, e));
      },
      getZoneFlagsBulk(a, r) {
        return d.ZoneFlagApiFp(n).getZoneFlagsBulk(a, r).then((s) => s(t, e));
      },
      getZoneFlagsCount(a, r, s, i, l, h, p, c, u, f) {
        return d.ZoneFlagApiFp(n).getZoneFlagsCount(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      listZoneFlags(a, r, s, i, l, h, p, c, u, f) {
        return d.ZoneFlagApiFp(n).listZoneFlags(a, r, s, i, l, h, p, c, u, f).then((o) => o(t, e));
      },
      updateZoneFlag(a, r, s) {
        return d.ZoneFlagApiFp(n).updateZoneFlag(a, r, s).then((i) => i(t, e));
      }
    };
  };
  class V extends O.BaseAPI {
    createZoneFlag(e, t) {
      return d.ZoneFlagApiFp(this.configuration).createZoneFlag(e.zoneFlag, t).then((a) => a(this.axios, this.basePath));
    }
    deleteZoneFlag(e, t) {
      return d.ZoneFlagApiFp(this.configuration).deleteZoneFlag(e.id, t).then((a) => a(this.axios, this.basePath));
    }
    getZoneFlag(e, t) {
      return d.ZoneFlagApiFp(this.configuration).getZoneFlag(e.id, e.includes, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    getZoneFlagsBulk(e, t) {
      return d.ZoneFlagApiFp(this.configuration).getZoneFlagsBulk(e.body, t).then((a) => a(this.axios, this.basePath));
    }
    getZoneFlagsCount(e = {}, t) {
      return d.ZoneFlagApiFp(this.configuration).getZoneFlagsCount(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    listZoneFlags(e = {}, t) {
      return d.ZoneFlagApiFp(this.configuration).listZoneFlags(e.includes, e.where, e.whereOr, e.groupBy, e.limit, e.page, e.orderBy, e.orderDirection, e.select, t).then((a) => a(this.axios, this.basePath));
    }
    updateZoneFlag(e, t) {
      return d.ZoneFlagApiFp(this.configuration).updateZoneFlag(e.id, e.zoneFlag, t).then((a) => a(this.axios, this.basePath));
    }
  }
  d.ZoneFlagApi = V;
})(Mn);
const ce = {
  NOT_RUN: "Not Run",
  RUNNING: "Running 🔄",
  FINISHED: "Finished ✅",
  ERROR: "Error ❌"
}, yr = ({
  open: d,
  setOpen: m,
  zone: A,
  Spire: O
}) => {
  const {
    openAlert: V
  } = Ya(), [n, e] = re.useState(A?.short_name ?? ""), [t, a] = re.useState(A?.long_name ?? ""), [r, s] = re.useState(-1), [i, l] = re.useState(!1), h = re.useMemo(() => ({
    zoneApi: [new Jt.ZoneApi(...O.SpireApi.cfg()), "Zone"],
    adventureTemplateApi: [new An.AdventureTemplateApi(...O.SpireApi.cfg()), "AdventureTemplate"],
    doorApi: [new Sn.DoorApi(...O.SpireApi.cfg()), "Door"],
    globalLootApi: [new jn.GlobalLootApi(...O.SpireApi.cfg()), "GlobalLoot"],
    spawnConditionApi: [new vn.SpawnConditionApi(...O.SpireApi.cfg()), "SpawnCondition"],
    spawnConditionValueApi: [new Pn.SpawnConditionValueApi(...O.SpireApi.cfg()), "SpawnConditionValue"],
    spawnEventApi: [new Rn.SpawnEventApi(...O.SpireApi.cfg()), "SpawnEvent"],
    spawn2Api: [new _n.Spawn2Api(...O.SpireApi.cfg()), "Spawn2"],
    trapApi: [new Cn.TrapApi(...O.SpireApi.cfg()), "Trap"],
    zonePointApi: [new Vn.ZonePointApi(...O.SpireApi.cfg()), "ZonePoint"],
    blockedSpellApi: [new En.BlockedSpellApi(...O.SpireApi.cfg()), "BlockedSpell"],
    charCreateCombinationApi: [new Fn.CharCreateCombinationApi(...O.SpireApi.cfg()), "CharCreateCombination"],
    characterExpModifierApi: [new qn.CharacterExpModifierApi(...O.SpireApi.cfg()), "CharacterExpModifier"],
    fishingApi: [new Tn.FishingApi(...O.SpireApi.cfg()), "Fishing"],
    forageApi: [new Un.ForageApi(...O.SpireApi.cfg()), "Forage"],
    graveyardApi: [new Bn.GraveyardApi(...O.SpireApi.cfg()), "Graveyard"],
    gridApi: [new kn.GridApi(...O.SpireApi.cfg()), "Grid"],
    gridEntryApi: [new Ln.GridEntryApi(...O.SpireApi.cfg()), "GridEntry"],
    groundSpawnApi: [new Gn.GroundSpawnApi(...O.SpireApi.cfg()), "GroundSpawn"],
    objectApi: [new Hn.ObjectApi(...O.SpireApi.cfg()), "Object"],
    questGlobalApi: [new xn.QuestGlobalApi(...O.SpireApi.cfg()), "QuestGlobal"],
    zoneFlagApi: [new Mn.ZoneFlagApi(...O.SpireApi.cfg()), "ZoneFlag"]
  }), [O]), [p, c] = re.useState(Object.values(h).reduce((E, [b, R]) => ({
    ...E,
    [R]: {
      enabled: !0,
      state: ce.NOT_RUN,
      comment: ""
    }
  }), {})), u = re.useCallback((E, b) => c((R) => ({
    ...R,
    [E]: {
      ...R[E],
      state: b
    }
  })), []), f = re.useCallback((E, b) => c((R) => ({
    ...R,
    [E]: {
      ...R[E],
      comment: b
    }
  })), []), o = re.useCallback(async ({
    name: E,
    query: b,
    keyClears: R = []
  }) => {
    try {
      u(E, ce.RUNNING);
      const q = E[0].toLowerCase() + E.slice(1, E.length), v = h[`${q}Api`][0], ke = Object.getOwnPropertyNames(v.__proto__).find((ee) => ee.startsWith("list")), Le = Object.getOwnPropertyNames(v.__proto__).find((ee) => ee.startsWith("create")), ye = v[ke].bind(v), Ge = v[Le].bind(v), [{
        data: ie
      }, {
        data: ue
      }] = await Promise.all([ye(new O.SpireQueryBuilder().where(b[0], "=", b[1]).limit(1e5).get()), ye(new O.SpireQueryBuilder().where(b[0], "=", b[2]).limit(1e5).get())]);
      if (ue.length === ie.length)
        f(E, `Old zone had equal values (${ue.length})`), u(E, ce.FINISHED);
      else {
        let ee = ue.reduce((te, we) => Math.max(te, we.id), 0) + 1;
        const be = [];
        for (const te of ue) {
          const we = {
            ...te,
            id: void 0
          };
          if (ie.some((he) => JSON.stringify({
            ...he,
            id: void 0
          }) === JSON.stringify(we)))
            console.log(`${E} already had entry`, te);
          else {
            const he = {
              ...te,
              [b[0]]: b[1]
            };
            R.includes("id") ? delete he.id : he.id = ee++;
            const Ae = {
              ...he,
              ...R.reduce((He, xe) => ({
                ...He,
                [xe]: void 0
              }), {})
            };
            be.push(async () => {
              console.log(`${E} is creating new entry`, Ae), await Ge({
                [q]: Ae
              });
            });
          }
        }
        await Promise.all(be.map((te) => te().catch(() => {
        }))), u(E, ce.FINISHED), f(E, `Created (${be.length}) entries`);
      }
    } catch (q) {
      console.warn(`Error updating ${E}`, q), u(E, ce.ERROR);
    }
  }, [O, h, u, f]), y = re.useCallback(async () => {
    const E = {
      ...A,
      short_name: n,
      long_name: t,
      zoneidnumber: r,
      id: void 0
    };
    l(!0);
    try {
      const {
        data: b
      } = await h.zoneApi[0].listZones(new O.SpireQueryBuilder().where("zoneidnumber", "=", r).get());
      console.log("Ex zones", b), b.length ? (u("Zone", ce.FINISHED), f("Zone", "Zone exists")) : (await h.zoneApi.createZone({
        zone: E
      }), u("Zone", ce.FINISHED), f("Zone", "Zone created"));
    } catch (b) {
      console.warn("Error updating zone", b), u("Zone", ce.ERROR);
    }
    await o({
      name: "AdventureTemplate",
      query: ["zone", n, A.short_name]
    }), await o({
      name: "Door",
      query: ["zone", n, A.short_name],
      keyClears: ["id"]
    }), await o({
      name: "GlobalLoot",
      query: ["zone", n, A.short_name]
    }), await o({
      name: "SpawnCondition",
      query: ["zone", n, A.short_name]
    }), await o({
      name: "SpawnConditionValue",
      query: ["zone", n, A.short_name]
    }), await o({
      name: "SpawnEvent",
      query: ["zone", n, A.short_name],
      keyClears: ["id"]
    }), await o({
      name: "Spawn2",
      query: ["zone", n, A.short_name],
      keyClears: ["id"]
    }), await o({
      name: "Trap",
      query: ["zone", n, A.short_name]
    }), await o({
      name: "ZonePoint",
      query: ["zone", n, A.short_name],
      keyClears: ["id"]
    }), await o({
      name: "BlockedSpell",
      query: ["zoneid", r, A.zoneidnumber]
    }), await o({
      name: "CharCreateCombination",
      query: ["start_zone", r, A.zoneidnumber]
    }), await o({
      name: "CharacterExpModifier",
      query: ["zone_id", r, A.zoneidnumber]
    }), await o({
      name: "Fishing",
      query: ["zoneid", r, A.zoneidnumber]
    }), await o({
      name: "Forage",
      query: ["zoneid", r, A.zoneidnumber],
      keyClears: ["id"]
    }), await o({
      name: "Graveyard",
      query: ["zone_id", r, A.zoneidnumber]
    }), await o({
      name: "Grid",
      query: ["zoneid", r, A.zoneidnumber]
    }), await o({
      name: "GridEntry",
      query: ["zoneid", r, A.zoneidnumber]
    }), await o({
      name: "GroundSpawn",
      query: ["zoneid", r, A.zoneidnumber],
      keyClears: ["id"]
    }), await o({
      name: "Object",
      query: ["zoneid", r, A.zoneidnumber],
      keyClears: ["id"]
    }), await o({
      name: "QuestGlobal",
      query: ["zoneid", r, A.zoneidnumber]
    }), await o({
      name: "ZoneFlag",
      query: ["zoneID", r, A.zoneidnumber]
    }), V(`Successfully duplicated records for: ${n} :: ${t} :: ${r}`), l(!1);
  }, [V, A, n, t, r, O, h, f, u, o]);
  return /* @__PURE__ */ le(tr, {
    fullWidth: !0,
    maxWidth: "md",
    open: d,
    onKeyDown: (E) => E.stopPropagation(),
    onClose: () => m(!1),
    "aria-labelledby": "draggable-dialog-title",
    children: [/* @__PURE__ */ le(nr, {
      style: {
        margin: "0 auto"
      },
      id: "draggable-dialog-title",
      children: ["Duplicate Zone: ", A?.short_name, " - ", A?.long_name]
    }), /* @__PURE__ */ K(ar, {
      onKeyDown: (E) => E.stopPropagation(),
      sx: {
        maxHeight: "400px",
        overflowY: "hidden",
        overflowX: "hidden"
      },
      className: "about-content",
      children: /* @__PURE__ */ le(Mt, {
        direction: "row",
        children: [/* @__PURE__ */ le(Mt, {
          direction: "column",
          sx: {
            width: "33%"
          },
          children: [/* @__PURE__ */ K(tt, {
            sx: {
              margin: "15px",
              width: "75%"
            },
            size: "small",
            value: t,
            variant: "standard",
            onChange: (E) => a(E.target.value),
            label: "Long Name"
          }), /* @__PURE__ */ K(tt, {
            sx: {
              margin: "15px",
              width: "75%"
            },
            size: "small",
            value: n,
            variant: "standard",
            onChange: (E) => e(E.target.value),
            label: "Short Name"
          }), /* @__PURE__ */ K(tt, {
            sx: {
              margin: "15px",
              width: "75%"
            },
            type: "number",
            variant: "standard",
            size: "small",
            value: r,
            onChange: (E) => s(+E.target.value),
            label: "Zone ID"
          })]
        }), /* @__PURE__ */ K(rr, {
          onKeyDown: (E) => E.stopPropagation(),
          component: er,
          sx: {
            backgroundColor: "transparent",
            boxShadow: "0px 0px 5px 2px rgba(0, 0, 0, 0.3)",
            maxHeight: "400px",
            margin: "2px 0px",
            padding: "1px"
          },
          children: /* @__PURE__ */ le(sr, {
            sx: {
              "& .MuiTableCell-root": {
                padding: "3px",
                fontSize: "0.9rem",
                paddingLeft: "10px",
                background: "rgba(0,0,0,0.3)"
              }
            },
            children: [/* @__PURE__ */ K(ir, {
              children: /* @__PURE__ */ le(Dt, {
                children: [/* @__PURE__ */ K(de, {
                  sx: {
                    fontWeight: "bold"
                  },
                  children: "Table"
                }), /* @__PURE__ */ K(de, {
                  sx: {
                    fontWeight: "bold"
                  },
                  children: "Enabled"
                }), /* @__PURE__ */ K(de, {
                  sx: {
                    fontWeight: "bold"
                  },
                  children: "Status"
                }), /* @__PURE__ */ K(de, {
                  sx: {
                    fontWeight: "bold"
                  },
                  children: "Comment"
                })]
              })
            }), /* @__PURE__ */ K(or, {
              children: Object.entries(p).map(([E, b]) => /* @__PURE__ */ le(Dt, {
                children: [/* @__PURE__ */ K(de, {
                  children: E
                }), /* @__PURE__ */ K(de, {
                  children: /* @__PURE__ */ K(lr, {
                    disabled: E === "Zone",
                    size: "small",
                    checked: b.enabled,
                    onChange: (R) => {
                      c((q) => ({
                        ...q,
                        [E]: {
                          ...q[E],
                          enabled: R.target.checked
                        }
                      }));
                    }
                  })
                }), /* @__PURE__ */ K(de, {
                  children: b.state
                }), /* @__PURE__ */ K(de, {
                  children: b.comment
                })]
              }, E))
            })]
          })
        })]
      })
    }), /* @__PURE__ */ le(dr, {
      disableSpacing: !0,
      sx: {
        margin: "5px"
      },
      children: [/* @__PURE__ */ K(Nt, {
        disabled: i,
        variant: "outlined",
        sx: {
          color: "white",
          padding: "8px",
          marginLeft: "10px"
        },
        autoFocus: !0,
        onClick: y,
        children: "Start Duplication"
      }), /* @__PURE__ */ K(Nt, {
        disabled: i,
        variant: "outlined",
        sx: {
          color: "white",
          padding: "8px",
          marginLeft: "10px"
        },
        autoFocus: !0,
        onClick: () => m(!1),
        children: "Cancel"
      })]
    })]
  });
};
export {
  yr as DuplicateZoneDialog,
  yr as default
};
//# sourceMappingURL=duplicate-zone-dialog-D0zisyE6.js.map
