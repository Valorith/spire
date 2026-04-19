import { A as S, E as T, V as m, S as E, a as D } from "./embed-entry-BgvWRWVI.js";
import { M as N } from "./mesh-DLjlGcQU.js";
class j {
  /**
   * Creates a SimplificationSettings
   * @param quality expected quality
   * @param distance distance when this optimized version should be used
   * @param optimizeMesh already optimized mesh
   */
  constructor(e, t, s) {
    this.quality = e, this.distance = t, this.optimizeMesh = s;
  }
}
class q {
  /**
   * Creates a new queue
   */
  constructor() {
    this.running = !1, this._simplificationArray = [];
  }
  /**
   * Adds a new simplification task
   * @param task defines a task to add
   */
  addTask(e) {
    this._simplificationArray.push(e);
  }
  /**
   * Execute next task
   */
  executeNext() {
    const e = this._simplificationArray.pop();
    e ? (this.running = !0, this.runSimplification(e)) : this.running = !1;
  }
  /**
   * Execute a simplification task
   * @param task defines the task to run
   */
  runSimplification(e) {
    if (e.parallelProcessing)
      e.settings.forEach((t) => {
        this._getSimplifier(e).simplify(t, (i) => {
          t.distance !== void 0 && e.mesh.addLODLevel(t.distance, i), i.isVisible = !0, t.quality === e.settings[e.settings.length - 1].quality && e.successCallback && e.successCallback(), this.executeNext();
        });
      });
    else {
      const t = this._getSimplifier(e), s = (i, r) => {
        t.simplify(i, (o) => {
          i.distance !== void 0 && e.mesh.addLODLevel(i.distance, o), o.isVisible = !0, r();
        });
      };
      S.Run(e.settings.length, (i) => {
        s(e.settings[i.index], () => {
          i.executeNext();
        });
      }, () => {
        e.successCallback && e.successCallback(), this.executeNext();
      });
    }
  }
  _getSimplifier(e) {
    switch (e.simplificationType) {
      case F.QUADRATIC:
      default:
        return new L(e.mesh);
    }
  }
}
var F;
(function(M) {
  M[M.QUADRATIC = 0] = "QUADRATIC";
})(F || (F = {}));
class P {
  constructor(e) {
    this._vertices = e, this.error = new Array(4), this.deleted = !1, this.isDirty = !1, this.deletePending = !1, this.borderFactor = 0;
  }
}
class K {
  constructor(e, t) {
    this.position = e, this.id = t, this.isBorder = !0, this.q = new A(), this.triangleCount = 0, this.triangleStart = 0, this.originalOffsets = [];
  }
  updatePosition(e) {
    this.position.copyFrom(e);
  }
}
class A {
  constructor(e) {
    this.data = new Array(10);
    for (let t = 0; t < 10; ++t)
      e && e[t] ? this.data[t] = e[t] : this.data[t] = 0;
  }
  det(e, t, s, i, r, o, c, n, l) {
    return this.data[e] * this.data[r] * this.data[l] + this.data[s] * this.data[i] * this.data[n] + this.data[t] * this.data[o] * this.data[c] - this.data[s] * this.data[r] * this.data[c] - this.data[e] * this.data[o] * this.data[n] - this.data[t] * this.data[i] * this.data[l];
  }
  addInPlace(e) {
    for (let t = 0; t < 10; ++t)
      this.data[t] += e.data[t];
  }
  addArrayInPlace(e) {
    for (let t = 0; t < 10; ++t)
      this.data[t] += e[t];
  }
  add(e) {
    const t = new A();
    for (let s = 0; s < 10; ++s)
      t.data[s] = this.data[s] + e.data[s];
    return t;
  }
  static FromData(e, t, s, i) {
    return new A(A.DataFromNumbers(e, t, s, i));
  }
  //returning an array to avoid garbage collection
  static DataFromNumbers(e, t, s, i) {
    return [e * e, e * t, e * s, e * i, t * t, t * s, t * i, s * s, s * i, i * i];
  }
}
class z {
  constructor(e, t) {
    this.vertexId = e, this.triangleId = t;
  }
}
class L {
  /**
   * Creates a new QuadraticErrorSimplification
   * @param _mesh defines the target mesh
   */
  constructor(e) {
    this._mesh = e, this.syncIterations = 5e3, this.aggressiveness = 7, this.decimationIterations = 100, this.boundingBoxEpsilon = T;
  }
  /**
   * Simplification of a given mesh according to the given settings.
   * Since this requires computation, it is assumed that the function runs async.
   * @param settings The settings of the simplification, including quality and distance
   * @param successCallback A callback that will be called after the mesh was simplified.
   */
  simplify(e, t) {
    this._initDecimatedMesh(), S.Run(this._mesh.subMeshes.length, (s) => {
      this._initWithMesh(s.index, () => {
        this._runDecimation(e, s.index, () => {
          s.executeNext();
        });
      }, e.optimizeMesh);
    }, () => {
      setTimeout(() => {
        t(this._reconstructedMesh);
      }, 0);
    });
  }
  _runDecimation(e, t, s) {
    const i = ~~(this._triangles.length * e.quality);
    let r = 0;
    const o = this._triangles.length, c = (n, l) => {
      setTimeout(() => {
        n % 5 === 0 && this._updateMesh(n === 0);
        for (let a = 0; a < this._triangles.length; ++a)
          this._triangles[a].isDirty = !1;
        const g = 1e-9 * Math.pow(n + 3, this.aggressiveness), d = (a) => {
          const p = ~~((this._triangles.length / 2 + a) % this._triangles.length), u = this._triangles[p];
          if (u && !(u.error[3] > g || u.deleted || u.isDirty)) {
            for (let v = 0; v < 3; ++v)
              if (u.error[v] < g) {
                const x = [], I = [], _ = u._vertices[v], y = u._vertices[(v + 1) % 3];
                if (_.isBorder || y.isBorder)
                  continue;
                const h = D.Zero();
                this._calculateError(_, y, h);
                const f = [];
                if (this._isFlipped(_, y, h, x, f) || this._isFlipped(y, _, h, I, f) || x.indexOf(!0) < 0 || I.indexOf(!0) < 0)
                  continue;
                const V = [];
                if (f.forEach((C) => {
                  V.indexOf(C) === -1 && (C.deletePending = !0, V.push(C));
                }), V.length % 2 !== 0)
                  continue;
                _.q = y.q.add(_.q), _.updatePosition(h);
                const w = this._references.length;
                r = this._updateTriangles(_, _, x, r), r = this._updateTriangles(_, y, I, r);
                const b = this._references.length - w;
                if (b <= _.triangleCount) {
                  if (b)
                    for (let C = 0; C < b; C++)
                      this._references[_.triangleStart + C] = this._references[w + C];
                } else
                  _.triangleStart = w;
                _.triangleCount = b;
                break;
              }
          }
        };
        S.SyncAsyncForLoop(this._triangles.length, this.syncIterations, d, l, () => o - r <= i);
      }, 0);
    };
    S.Run(this.decimationIterations, (n) => {
      o - r <= i ? n.breakLoop() : c(n.index, () => {
        n.executeNext();
      });
    }, () => {
      setTimeout(() => {
        this._reconstructMesh(t), s();
      }, 0);
    });
  }
  _initWithMesh(e, t, s) {
    this._vertices = [], this._triangles = [];
    const i = this._mesh.getVerticesData(m.PositionKind), r = this._mesh.getIndices(), o = this._mesh.subMeshes[e], c = (d) => {
      if (s) {
        for (let a = 0; a < this._vertices.length; ++a)
          if (this._vertices[a].position.equalsWithEpsilon(d, 1e-4))
            return this._vertices[a];
      }
      return null;
    }, n = [], l = (d) => {
      if (!i)
        return;
      const a = d + o.verticesStart, p = D.FromArray(i, a * 3), u = c(p) || new K(p, this._vertices.length);
      u.originalOffsets.push(a), u.id === this._vertices.length && this._vertices.push(u), n.push(u.id);
    }, g = o.verticesCount;
    S.SyncAsyncForLoop(g, this.syncIterations / 4 >> 0, l, () => {
      const d = (a) => {
        if (!r)
          return;
        const u = (o.indexStart / 3 + a) * 3, v = r[u + 0], x = r[u + 1], I = r[u + 2], _ = this._vertices[n[v - o.verticesStart]], y = this._vertices[n[x - o.verticesStart]], h = this._vertices[n[I - o.verticesStart]], f = new P([_, y, h]);
        f.originalOffset = u, this._triangles.push(f);
      };
      S.SyncAsyncForLoop(o.indexCount / 3, this.syncIterations, d, () => {
        this._init(t);
      });
    });
  }
  _init(e) {
    const t = (s) => {
      const i = this._triangles[s];
      i.normal = D.Cross(i._vertices[1].position.subtract(i._vertices[0].position), i._vertices[2].position.subtract(i._vertices[0].position)).normalize();
      for (let r = 0; r < 3; r++)
        i._vertices[r].q.addArrayInPlace(A.DataFromNumbers(i.normal.x, i.normal.y, i.normal.z, -D.Dot(i.normal, i._vertices[0].position)));
    };
    S.SyncAsyncForLoop(this._triangles.length, this.syncIterations, t, () => {
      const s = (i) => {
        const r = this._triangles[i];
        for (let o = 0; o < 3; ++o)
          r.error[o] = this._calculateError(r._vertices[o], r._vertices[(o + 1) % 3]);
        r.error[3] = Math.min(r.error[0], r.error[1], r.error[2]);
      };
      S.SyncAsyncForLoop(this._triangles.length, this.syncIterations, s, () => {
        e();
      });
    });
  }
  _reconstructMesh(e) {
    const t = [];
    let s;
    for (s = 0; s < this._vertices.length; ++s)
      this._vertices[s].triangleCount = 0;
    let i, r;
    for (s = 0; s < this._triangles.length; ++s)
      if (!this._triangles[s].deleted) {
        for (i = this._triangles[s], r = 0; r < 3; ++r)
          i._vertices[r].triangleCount = 1;
        t.push(i);
      }
    const o = this._reconstructedMesh.getVerticesData(m.PositionKind) || [], c = this._reconstructedMesh.getVerticesData(m.NormalKind) || [], n = this._reconstructedMesh.getVerticesData(m.UVKind) || [], l = this._reconstructedMesh.getVerticesData(m.ColorKind) || [], g = this._mesh.getVerticesData(m.NormalKind), d = this._mesh.getVerticesData(m.UVKind), a = this._mesh.getVerticesData(m.ColorKind);
    let p = 0;
    for (s = 0; s < this._vertices.length; ++s) {
      const h = this._vertices[s];
      h.id = p, h.triangleCount && h.originalOffsets.forEach((f) => {
        o.push(h.position.x), o.push(h.position.y), o.push(h.position.z), g && g.length && (c.push(g[f * 3]), c.push(g[f * 3 + 1]), c.push(g[f * 3 + 2])), d && d.length && (n.push(d[f * 2]), n.push(d[f * 2 + 1])), a && a.length && (l.push(a[f * 4]), l.push(a[f * 4 + 1]), l.push(a[f * 4 + 2]), l.push(a[f * 4 + 3])), ++p;
      });
    }
    const u = this._reconstructedMesh.getTotalIndices(), v = this._reconstructedMesh.getTotalVertices(), x = this._reconstructedMesh.subMeshes;
    this._reconstructedMesh.subMeshes = [];
    const I = this._reconstructedMesh.getIndices(), _ = this._mesh.getIndices();
    for (s = 0; s < t.length; ++s)
      i = t[s], [0, 1, 2].forEach((h) => {
        const f = _[i.originalOffset + h];
        let V = i._vertices[h].originalOffsets.indexOf(f);
        V < 0 && (V = 0), I.push(i._vertices[h].id + V + v);
      });
    this._reconstructedMesh.setIndices(I), this._reconstructedMesh.setVerticesData(m.PositionKind, o), c.length > 0 && this._reconstructedMesh.setVerticesData(m.NormalKind, c), n.length > 0 && this._reconstructedMesh.setVerticesData(m.UVKind, n), l.length > 0 && this._reconstructedMesh.setVerticesData(m.ColorKind, l);
    const y = this._mesh.subMeshes[e];
    e > 0 && (this._reconstructedMesh.subMeshes = [], x.forEach((h) => {
      E.AddToMesh(
        h.materialIndex,
        h.verticesStart,
        h.verticesCount,
        /* 0, newPositionData.length/3, */
        h.indexStart,
        h.indexCount,
        h.getMesh()
      );
    }), E.AddToMesh(
      y.materialIndex,
      v,
      p,
      /* 0, newPositionData.length / 3, */
      u,
      t.length * 3,
      this._reconstructedMesh
    ));
  }
  _initDecimatedMesh() {
    this._reconstructedMesh = new N(this._mesh.name + "Decimated", this._mesh.getScene()), this._reconstructedMesh.material = this._mesh.material, this._reconstructedMesh.parent = this._mesh.parent, this._reconstructedMesh.isVisible = !1, this._reconstructedMesh.renderingGroupId = this._mesh.renderingGroupId;
  }
  _isFlipped(e, t, s, i, r) {
    for (let o = 0; o < e.triangleCount; ++o) {
      const c = this._triangles[this._references[e.triangleStart + o].triangleId];
      if (c.deleted)
        continue;
      const n = this._references[e.triangleStart + o].vertexId, l = c._vertices[(n + 1) % 3], g = c._vertices[(n + 2) % 3];
      if (l === t || g === t) {
        i[o] = !0, r.push(c);
        continue;
      }
      let d = l.position.subtract(s);
      d = d.normalize();
      let a = g.position.subtract(s);
      if (a = a.normalize(), Math.abs(D.Dot(d, a)) > 0.999)
        return !0;
      const p = D.Cross(d, a).normalize();
      if (i[o] = !1, D.Dot(p, c.normal) < 0.2)
        return !0;
    }
    return !1;
  }
  _updateTriangles(e, t, s, i) {
    let r = i;
    for (let o = 0; o < t.triangleCount; ++o) {
      const c = this._references[t.triangleStart + o], n = this._triangles[c.triangleId];
      if (!n.deleted) {
        if (s[o] && n.deletePending) {
          n.deleted = !0, r++;
          continue;
        }
        n._vertices[c.vertexId] = e, n.isDirty = !0, n.error[0] = this._calculateError(n._vertices[0], n._vertices[1]) + n.borderFactor / 2, n.error[1] = this._calculateError(n._vertices[1], n._vertices[2]) + n.borderFactor / 2, n.error[2] = this._calculateError(n._vertices[2], n._vertices[0]) + n.borderFactor / 2, n.error[3] = Math.min(n.error[0], n.error[1], n.error[2]), this._references.push(c);
      }
    }
    return r;
  }
  _identifyBorder() {
    for (let e = 0; e < this._vertices.length; ++e) {
      const t = [], s = [], i = this._vertices[e];
      let r;
      for (r = 0; r < i.triangleCount; ++r) {
        const o = this._triangles[this._references[i.triangleStart + r].triangleId];
        for (let c = 0; c < 3; c++) {
          let n = 0;
          const l = o._vertices[c];
          for (; n < t.length && s[n] !== l.id; )
            ++n;
          n === t.length ? (t.push(1), s.push(l.id)) : t[n]++;
        }
      }
      for (r = 0; r < t.length; ++r)
        t[r] === 1 ? this._vertices[s[r]].isBorder = !0 : this._vertices[s[r]].isBorder = !1;
    }
  }
  _updateMesh(e = !1) {
    let t;
    if (!e) {
      const n = [];
      for (t = 0; t < this._triangles.length; ++t)
        this._triangles[t].deleted || n.push(this._triangles[t]);
      this._triangles = n;
    }
    for (t = 0; t < this._vertices.length; ++t)
      this._vertices[t].triangleCount = 0, this._vertices[t].triangleStart = 0;
    let s, i, r;
    for (t = 0; t < this._triangles.length; ++t)
      for (s = this._triangles[t], i = 0; i < 3; ++i)
        r = s._vertices[i], r.triangleCount++;
    let o = 0;
    for (t = 0; t < this._vertices.length; ++t)
      this._vertices[t].triangleStart = o, o += this._vertices[t].triangleCount, this._vertices[t].triangleCount = 0;
    const c = new Array(this._triangles.length * 3);
    for (t = 0; t < this._triangles.length; ++t)
      for (s = this._triangles[t], i = 0; i < 3; ++i)
        r = s._vertices[i], c[r.triangleStart + r.triangleCount] = new z(i, t), r.triangleCount++;
    this._references = c, e && this._identifyBorder();
  }
  _vertexError(e, t) {
    const s = t.x, i = t.y, r = t.z;
    return e.data[0] * s * s + 2 * e.data[1] * s * i + 2 * e.data[2] * s * r + 2 * e.data[3] * s + e.data[4] * i * i + 2 * e.data[5] * i * r + 2 * e.data[6] * i + e.data[7] * r * r + 2 * e.data[8] * r + e.data[9];
  }
  _calculateError(e, t, s) {
    const i = e.q.add(t.q), r = e.isBorder && t.isBorder;
    let o = 0;
    const c = i.det(0, 1, 2, 1, 4, 5, 2, 5, 7);
    if (c !== 0 && !r)
      s || (s = D.Zero()), s.x = -1 / c * i.det(1, 2, 3, 4, 5, 6, 5, 7, 8), s.y = 1 / c * i.det(0, 2, 3, 1, 5, 6, 2, 7, 8), s.z = -1 / c * i.det(0, 1, 3, 1, 4, 6, 2, 5, 8), o = this._vertexError(i, s);
    else {
      const n = e.position.add(t.position).divide(new D(2, 2, 2)), l = this._vertexError(i, e.position), g = this._vertexError(i, t.position), d = this._vertexError(i, n);
      o = Math.min(l, g, d), o === l ? s && s.copyFrom(e.position) : o === g ? s && s.copyFrom(t.position) : s && s.copyFrom(n);
    }
    return o;
  }
}
export {
  L as QuadraticErrorSimplification,
  q as SimplificationQueue,
  j as SimplificationSettings,
  F as SimplificationType
};
//# sourceMappingURL=meshSimplification-BkZQrkXB.js.map
