import { Y as h, Z as p, L as d, T as c } from "./embed-entry-BKE21f6Q.js";
h.prototype.createUniformBuffer = function(n, e) {
  const t = this._gl.createBuffer();
  if (!t)
    throw new Error("Unable to create uniform buffer");
  const r = new p(t);
  return this.bindUniformBuffer(r), n instanceof Float32Array ? this._gl.bufferData(this._gl.UNIFORM_BUFFER, n, this._gl.STATIC_DRAW) : this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(n), this._gl.STATIC_DRAW), this.bindUniformBuffer(null), r.references = 1, r;
};
h.prototype.createDynamicUniformBuffer = function(n, e) {
  const t = this._gl.createBuffer();
  if (!t)
    throw new Error("Unable to create dynamic uniform buffer");
  const r = new p(t);
  return this.bindUniformBuffer(r), n instanceof Float32Array ? this._gl.bufferData(this._gl.UNIFORM_BUFFER, n, this._gl.DYNAMIC_DRAW) : this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(n), this._gl.DYNAMIC_DRAW), this.bindUniformBuffer(null), r.references = 1, r;
};
h.prototype.updateUniformBuffer = function(n, e, t, r) {
  this.bindUniformBuffer(n), t === void 0 && (t = 0), r === void 0 ? e instanceof Float32Array ? this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, t, e) : this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, t, new Float32Array(e)) : e instanceof Float32Array ? this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, e.subarray(t, t + r)) : this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, new Float32Array(e).subarray(t, t + r)), this.bindUniformBuffer(null);
};
h.prototype.bindUniformBuffer = function(n) {
  this._gl.bindBuffer(this._gl.UNIFORM_BUFFER, n ? n.underlyingResource : null);
};
h.prototype.bindUniformBufferBase = function(n, e, t) {
  this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER, e, n ? n.underlyingResource : null);
};
h.prototype.bindUniformBlock = function(n, e, t) {
  const r = n.program, f = this._gl.getUniformBlockIndex(r, e);
  f !== 4294967295 && this._gl.uniformBlockBinding(r, f, t);
};
class i {
  /**
   * Instantiates a new Uniform buffer objects.
   *
   * Handles blocks of uniform on the GPU.
   *
   * If WebGL 2 is not available, this class falls back on traditional setUniformXXX calls.
   *
   * For more information, please refer to :
   * @see https://www.khronos.org/opengl/wiki/Uniform_Buffer_Object
   * @param engine Define the engine the buffer is associated with
   * @param data Define the data contained in the buffer
   * @param dynamic Define if the buffer is updatable
   * @param name to assign to the buffer (debugging purpose)
   * @param forceNoUniformBuffer define that this object must not rely on UBO objects
   */
  constructor(e, t, r, f, s = !1) {
    this._valueCache = {}, this._engine = e, this._noUBO = !e.supportsUniformBuffers || s, this._dynamic = r, this._name = f ?? "no-name", this._data = t || [], this._uniformLocations = {}, this._uniformSizes = {}, this._uniformArraySizes = {}, this._uniformLocationPointer = 0, this._needSync = !1, this._engine._features.trackUbosInFrame && (this._buffers = [], this._bufferIndex = -1, this._createBufferOnWrite = !1, this._currentFrameId = 0), this._noUBO ? (this.updateMatrix3x3 = this._updateMatrix3x3ForEffect, this.updateMatrix2x2 = this._updateMatrix2x2ForEffect, this.updateFloat = this._updateFloatForEffect, this.updateFloat2 = this._updateFloat2ForEffect, this.updateFloat3 = this._updateFloat3ForEffect, this.updateFloat4 = this._updateFloat4ForEffect, this.updateFloatArray = this._updateFloatArrayForEffect, this.updateArray = this._updateArrayForEffect, this.updateIntArray = this._updateIntArrayForEffect, this.updateUIntArray = this._updateUIntArrayForEffect, this.updateMatrix = this._updateMatrixForEffect, this.updateMatrices = this._updateMatricesForEffect, this.updateVector3 = this._updateVector3ForEffect, this.updateVector4 = this._updateVector4ForEffect, this.updateColor3 = this._updateColor3ForEffect, this.updateColor4 = this._updateColor4ForEffect, this.updateDirectColor4 = this._updateDirectColor4ForEffect, this.updateInt = this._updateIntForEffect, this.updateInt2 = this._updateInt2ForEffect, this.updateInt3 = this._updateInt3ForEffect, this.updateInt4 = this._updateInt4ForEffect, this.updateUInt = this._updateUIntForEffect, this.updateUInt2 = this._updateUInt2ForEffect, this.updateUInt3 = this._updateUInt3ForEffect, this.updateUInt4 = this._updateUInt4ForEffect) : (this._engine._uniformBuffers.push(this), this.updateMatrix3x3 = this._updateMatrix3x3ForUniform, this.updateMatrix2x2 = this._updateMatrix2x2ForUniform, this.updateFloat = this._updateFloatForUniform, this.updateFloat2 = this._updateFloat2ForUniform, this.updateFloat3 = this._updateFloat3ForUniform, this.updateFloat4 = this._updateFloat4ForUniform, this.updateFloatArray = this._updateFloatArrayForUniform, this.updateArray = this._updateArrayForUniform, this.updateIntArray = this._updateIntArrayForUniform, this.updateUIntArray = this._updateUIntArrayForUniform, this.updateMatrix = this._updateMatrixForUniform, this.updateMatrices = this._updateMatricesForUniform, this.updateVector3 = this._updateVector3ForUniform, this.updateVector4 = this._updateVector4ForUniform, this.updateColor3 = this._updateColor3ForUniform, this.updateColor4 = this._updateColor4ForUniform, this.updateDirectColor4 = this._updateDirectColor4ForUniform, this.updateInt = this._updateIntForUniform, this.updateInt2 = this._updateInt2ForUniform, this.updateInt3 = this._updateInt3ForUniform, this.updateInt4 = this._updateInt4ForUniform, this.updateUInt = this._updateUIntForUniform, this.updateUInt2 = this._updateUInt2ForUniform, this.updateUInt3 = this._updateUInt3ForUniform, this.updateUInt4 = this._updateUInt4ForUniform);
  }
  /**
   * Indicates if the buffer is using the WebGL2 UBO implementation,
   * or just falling back on setUniformXXX calls.
   */
  get useUbo() {
    return !this._noUBO;
  }
  /**
   * Indicates if the WebGL underlying uniform buffer is in sync
   * with the javascript cache data.
   */
  get isSync() {
    return !this._needSync;
  }
  /**
   * Indicates if the WebGL underlying uniform buffer is dynamic.
   * Also, a dynamic UniformBuffer will disable cache verification and always
   * update the underlying WebGL uniform buffer to the GPU.
   * @returns if Dynamic, otherwise false
   */
  isDynamic() {
    return this._dynamic !== void 0;
  }
  /**
   * The data cache on JS side.
   * @returns the underlying data as a float array
   */
  getData() {
    return this._bufferData;
  }
  /**
   * The underlying WebGL Uniform buffer.
   * @returns the webgl buffer
   */
  getBuffer() {
    return this._buffer;
  }
  /**
   * std140 layout specifies how to align data within an UBO structure.
   * See https://khronos.org/registry/OpenGL/specs/gl/glspec45.core.pdf#page=159
   * for specs.
   * @param size
   */
  _fillAlignment(e) {
    let t;
    if (e <= 2 ? t = e : t = 4, this._uniformLocationPointer % t !== 0) {
      const r = this._uniformLocationPointer;
      this._uniformLocationPointer += t - this._uniformLocationPointer % t;
      const f = this._uniformLocationPointer - r;
      for (let s = 0; s < f; s++)
        this._data.push(0);
    }
  }
  /**
   * Adds an uniform in the buffer.
   * Warning : the subsequents calls of this function must be in the same order as declared in the shader
   * for the layout to be correct ! The addUniform function only handles types like float, vec2, vec3, vec4, mat4,
   * meaning size=1,2,3,4 or 16. It does not handle struct types.
   * @param name Name of the uniform, as used in the uniform block in the shader.
   * @param size Data size, or data directly.
   * @param arraySize The number of elements in the array, 0 if not an array.
   */
  addUniform(e, t, r = 0) {
    if (this._noUBO || this._uniformLocations[e] !== void 0)
      return;
    let f;
    if (r > 0) {
      if (t instanceof Array)
        throw "addUniform should not be use with Array in UBO: " + e;
      if (this._fillAlignment(4), this._uniformArraySizes[e] = { strideSize: t, arraySize: r }, t == 16)
        t = t * r;
      else {
        const a = (4 - t) * r;
        t = t * r + a;
      }
      f = [];
      for (let s = 0; s < t; s++)
        f.push(0);
    } else {
      if (t instanceof Array)
        f = t, t = f.length;
      else {
        t = t, f = [];
        for (let s = 0; s < t; s++)
          f.push(0);
      }
      this._fillAlignment(t);
    }
    this._uniformSizes[e] = t, this._uniformLocations[e] = this._uniformLocationPointer, this._uniformLocationPointer += t;
    for (let s = 0; s < t; s++)
      this._data.push(f[s]);
    this._needSync = !0;
  }
  /**
   * Adds a Matrix 4x4 to the uniform buffer.
   * @param name Name of the uniform, as used in the uniform block in the shader.
   * @param mat A 4x4 matrix.
   */
  addMatrix(e, t) {
    this.addUniform(e, Array.prototype.slice.call(t.asArray()));
  }
  /**
   * Adds a vec2 to the uniform buffer.
   * @param name Name of the uniform, as used in the uniform block in the shader.
   * @param x Define the x component value of the vec2
   * @param y Define the y component value of the vec2
   */
  addFloat2(e, t, r) {
    const f = [t, r];
    this.addUniform(e, f);
  }
  /**
   * Adds a vec3 to the uniform buffer.
   * @param name Name of the uniform, as used in the uniform block in the shader.
   * @param x Define the x component value of the vec3
   * @param y Define the y component value of the vec3
   * @param z Define the z component value of the vec3
   */
  addFloat3(e, t, r, f) {
    const s = [t, r, f];
    this.addUniform(e, s);
  }
  /**
   * Adds a vec3 to the uniform buffer.
   * @param name Name of the uniform, as used in the uniform block in the shader.
   * @param color Define the vec3 from a Color
   */
  addColor3(e, t) {
    const r = [t.r, t.g, t.b];
    this.addUniform(e, r);
  }
  /**
   * Adds a vec4 to the uniform buffer.
   * @param name Name of the uniform, as used in the uniform block in the shader.
   * @param color Define the rgb components from a Color
   * @param alpha Define the a component of the vec4
   */
  addColor4(e, t, r) {
    const f = [t.r, t.g, t.b, r];
    this.addUniform(e, f);
  }
  /**
   * Adds a vec3 to the uniform buffer.
   * @param name Name of the uniform, as used in the uniform block in the shader.
   * @param vector Define the vec3 components from a Vector
   */
  addVector3(e, t) {
    const r = [t.x, t.y, t.z];
    this.addUniform(e, r);
  }
  /**
   * Adds a Matrix 3x3 to the uniform buffer.
   * @param name Name of the uniform, as used in the uniform block in the shader.
   */
  addMatrix3x3(e) {
    this.addUniform(e, 12);
  }
  /**
   * Adds a Matrix 2x2 to the uniform buffer.
   * @param name Name of the uniform, as used in the uniform block in the shader.
   */
  addMatrix2x2(e) {
    this.addUniform(e, 8);
  }
  /**
   * Effectively creates the WebGL Uniform Buffer, once layout is completed with `addUniform`.
   */
  create() {
    this._noUBO || this._buffer || (this._fillAlignment(4), this._bufferData = new Float32Array(this._data), this._rebuild(), this._needSync = !0);
  }
  // The result of this method is used for debugging purpose, as part of the buffer name
  // It is meant to more easily know what this buffer is about when debugging
  // Some buffers can have a lot of uniforms (several dozens), so the method only returns the first 10 of them
  // (should be enough to understand what the buffer is for)
  _getNames() {
    const e = [];
    let t = 0;
    for (const r in this._uniformLocations)
      if (e.push(r), ++t === 10)
        break;
    return e.join(",");
  }
  /** @internal */
  _rebuild() {
    this._noUBO || !this._bufferData || (this._dynamic ? this._buffer = this._engine.createDynamicUniformBuffer(this._bufferData, this._name + "_UniformList:" + this._getNames()) : this._buffer = this._engine.createUniformBuffer(this._bufferData, this._name + "_UniformList:" + this._getNames()), this._engine._features.trackUbosInFrame && (this._buffers.push([this._buffer, this._engine._features.checkUbosContentBeforeUpload ? this._bufferData.slice() : void 0]), this._bufferIndex = this._buffers.length - 1, this._createBufferOnWrite = !1));
  }
  /** @internal */
  _rebuildAfterContextLost() {
    this._engine._features.trackUbosInFrame && (this._buffers = [], this._currentFrameId = 0), this._rebuild();
  }
  /** @internal */
  get _numBuffers() {
    return this._buffers.length;
  }
  /** @internal */
  get _indexBuffer() {
    return this._bufferIndex;
  }
  /** Gets the name of this buffer */
  get name() {
    return this._name;
  }
  /** Gets the current effect */
  get currentEffect() {
    return this._currentEffect;
  }
  _buffersEqual(e, t) {
    for (let r = 0; r < e.length; ++r)
      if (e[r] !== t[r])
        return !1;
    return !0;
  }
  _copyBuffer(e, t) {
    for (let r = 0; r < e.length; ++r)
      t[r] = e[r];
  }
  /**
   * Updates the WebGL Uniform Buffer on the GPU.
   * If the `dynamic` flag is set to true, no cache comparison is done.
   * Otherwise, the buffer will be updated only if the cache differs.
   */
  update() {
    if (!this._noUBO) {
      if (this.bindUniformBuffer(), !this._buffer) {
        this.create();
        return;
      }
      if (!this._dynamic && !this._needSync) {
        this._createBufferOnWrite = this._engine._features.trackUbosInFrame;
        return;
      }
      if (this._buffers && this._buffers.length > 1 && this._buffers[this._bufferIndex][1])
        if (this._buffersEqual(this._bufferData, this._buffers[this._bufferIndex][1])) {
          this._needSync = !1, this._createBufferOnWrite = this._engine._features.trackUbosInFrame;
          return;
        } else
          this._copyBuffer(this._bufferData, this._buffers[this._bufferIndex][1]);
      this._engine.updateUniformBuffer(this._buffer, this._bufferData), this._engine._features._collectUbosUpdatedInFrame && (i._UpdatedUbosInFrame[this._name] || (i._UpdatedUbosInFrame[this._name] = 0), i._UpdatedUbosInFrame[this._name]++), this._needSync = !1, this._createBufferOnWrite = this._engine._features.trackUbosInFrame;
    }
  }
  _createNewBuffer() {
    this._bufferIndex + 1 < this._buffers.length ? (this._bufferIndex++, this._buffer = this._buffers[this._bufferIndex][0], this._createBufferOnWrite = !1, this._needSync = !0) : this._rebuild();
  }
  _checkNewFrame() {
    this._engine._features.trackUbosInFrame && this._currentFrameId !== this._engine.frameId && (this._currentFrameId = this._engine.frameId, this._createBufferOnWrite = !1, this._buffers && this._buffers.length > 0 ? (this._needSync = this._bufferIndex !== 0, this._bufferIndex = 0, this._buffer = this._buffers[this._bufferIndex][0]) : this._bufferIndex = -1);
  }
  /**
   * Updates the value of an uniform. The `update` method must be called afterwards to make it effective in the GPU.
   * @param uniformName Define the name of the uniform, as used in the uniform block in the shader.
   * @param data Define the flattened data
   * @param size Define the size of the data.
   */
  updateUniform(e, t, r) {
    this._checkNewFrame();
    let f = this._uniformLocations[e];
    if (f === void 0) {
      if (this._buffer) {
        d.Error("Cannot add an uniform after UBO has been created. uniformName=" + e);
        return;
      }
      this.addUniform(e, r), f = this._uniformLocations[e];
    }
    if (this._buffer || this.create(), this._dynamic)
      for (let s = 0; s < r; s++)
        this._bufferData[f + s] = t[s];
    else {
      let s = !1;
      for (let a = 0; a < r; a++)
        (r === 16 && !this._engine._features.uniformBufferHardCheckMatrix || this._bufferData[f + a] !== Math.fround(t[a])) && (s = !0, this._createBufferOnWrite && this._createNewBuffer(), this._bufferData[f + a] = t[a]);
      this._needSync = this._needSync || s;
    }
  }
  /**
   * Updates the value of an uniform. The `update` method must be called afterwards to make it effective in the GPU.
   * @param uniformName Define the name of the uniform, as used in the uniform block in the shader.
   * @param data Define the flattened data
   * @param size Define the size of the data.
   */
  updateUniformArray(e, t, r) {
    this._checkNewFrame();
    const f = this._uniformLocations[e];
    if (f === void 0) {
      d.Error("Cannot add an uniform Array dynamically. Please, add it using addUniform and make sure that uniform buffers are supported by the current engine.");
      return;
    }
    this._buffer || this.create();
    const s = this._uniformArraySizes[e];
    if (this._dynamic)
      for (let a = 0; a < r; a++)
        this._bufferData[f + a] = t[a];
    else {
      let a = !1, u = 0, o = 0;
      for (let _ = 0; _ < r; _++)
        if (this._bufferData[f + o * 4 + u] !== c.FloatRound(t[_]) && (a = !0, this._createBufferOnWrite && this._createNewBuffer(), this._bufferData[f + o * 4 + u] = t[_]), u++, u === s.strideSize) {
          for (; u < 4; u++)
            this._bufferData[f + o * 4 + u] = 0;
          u = 0, o++;
        }
      this._needSync = this._needSync || a;
    }
  }
  _cacheMatrix(e, t) {
    this._checkNewFrame();
    const r = this._valueCache[e], f = t.updateFlag;
    return r !== void 0 && r === f ? !1 : (this._valueCache[e] = f, !0);
  }
  // Update methods
  _updateMatrix3x3ForUniform(e, t) {
    for (let r = 0; r < 3; r++)
      i._TempBuffer[r * 4] = t[r * 3], i._TempBuffer[r * 4 + 1] = t[r * 3 + 1], i._TempBuffer[r * 4 + 2] = t[r * 3 + 2], i._TempBuffer[r * 4 + 3] = 0;
    this.updateUniform(e, i._TempBuffer, 12);
  }
  _updateMatrix3x3ForEffect(e, t) {
    this._currentEffect.setMatrix3x3(e, t);
  }
  _updateMatrix2x2ForEffect(e, t) {
    this._currentEffect.setMatrix2x2(e, t);
  }
  _updateMatrix2x2ForUniform(e, t) {
    for (let r = 0; r < 2; r++)
      i._TempBuffer[r * 4] = t[r * 2], i._TempBuffer[r * 4 + 1] = t[r * 2 + 1], i._TempBuffer[r * 4 + 2] = 0, i._TempBuffer[r * 4 + 3] = 0;
    this.updateUniform(e, i._TempBuffer, 8);
  }
  _updateFloatForEffect(e, t) {
    this._currentEffect.setFloat(e, t);
  }
  _updateFloatForUniform(e, t) {
    i._TempBuffer[0] = t, this.updateUniform(e, i._TempBuffer, 1);
  }
  _updateFloat2ForEffect(e, t, r, f = "") {
    this._currentEffect.setFloat2(e + f, t, r);
  }
  _updateFloat2ForUniform(e, t, r) {
    i._TempBuffer[0] = t, i._TempBuffer[1] = r, this.updateUniform(e, i._TempBuffer, 2);
  }
  _updateFloat3ForEffect(e, t, r, f, s = "") {
    this._currentEffect.setFloat3(e + s, t, r, f);
  }
  _updateFloat3ForUniform(e, t, r, f) {
    i._TempBuffer[0] = t, i._TempBuffer[1] = r, i._TempBuffer[2] = f, this.updateUniform(e, i._TempBuffer, 3);
  }
  _updateFloat4ForEffect(e, t, r, f, s, a = "") {
    this._currentEffect.setFloat4(e + a, t, r, f, s);
  }
  _updateFloat4ForUniform(e, t, r, f, s) {
    i._TempBuffer[0] = t, i._TempBuffer[1] = r, i._TempBuffer[2] = f, i._TempBuffer[3] = s, this.updateUniform(e, i._TempBuffer, 4);
  }
  _updateFloatArrayForEffect(e, t) {
    this._currentEffect.setFloatArray(e, t);
  }
  _updateFloatArrayForUniform(e, t) {
    this.updateUniformArray(e, t, t.length);
  }
  _updateArrayForEffect(e, t) {
    this._currentEffect.setArray(e, t);
  }
  _updateArrayForUniform(e, t) {
    this.updateUniformArray(e, t, t.length);
  }
  _updateIntArrayForEffect(e, t) {
    this._currentEffect.setIntArray(e, t);
  }
  _updateIntArrayForUniform(e, t) {
    i._TempBufferInt32View.set(t), this.updateUniformArray(e, i._TempBuffer, t.length);
  }
  _updateUIntArrayForEffect(e, t) {
    this._currentEffect.setUIntArray(e, t);
  }
  _updateUIntArrayForUniform(e, t) {
    i._TempBufferUInt32View.set(t), this.updateUniformArray(e, i._TempBuffer, t.length);
  }
  _updateMatrixForEffect(e, t) {
    this._currentEffect.setMatrix(e, t);
  }
  _updateMatrixForUniform(e, t) {
    this._cacheMatrix(e, t) && this.updateUniform(e, t.asArray(), 16);
  }
  _updateMatricesForEffect(e, t) {
    this._currentEffect.setMatrices(e, t);
  }
  _updateMatricesForUniform(e, t) {
    this.updateUniform(e, t, t.length);
  }
  _updateVector3ForEffect(e, t) {
    this._currentEffect.setVector3(e, t);
  }
  _updateVector3ForUniform(e, t) {
    i._TempBuffer[0] = t.x, i._TempBuffer[1] = t.y, i._TempBuffer[2] = t.z, this.updateUniform(e, i._TempBuffer, 3);
  }
  _updateVector4ForEffect(e, t) {
    this._currentEffect.setVector4(e, t);
  }
  _updateVector4ForUniform(e, t) {
    i._TempBuffer[0] = t.x, i._TempBuffer[1] = t.y, i._TempBuffer[2] = t.z, i._TempBuffer[3] = t.w, this.updateUniform(e, i._TempBuffer, 4);
  }
  _updateColor3ForEffect(e, t, r = "") {
    this._currentEffect.setColor3(e + r, t);
  }
  _updateColor3ForUniform(e, t) {
    i._TempBuffer[0] = t.r, i._TempBuffer[1] = t.g, i._TempBuffer[2] = t.b, this.updateUniform(e, i._TempBuffer, 3);
  }
  _updateColor4ForEffect(e, t, r, f = "") {
    this._currentEffect.setColor4(e + f, t, r);
  }
  _updateDirectColor4ForEffect(e, t, r = "") {
    this._currentEffect.setDirectColor4(e + r, t);
  }
  _updateColor4ForUniform(e, t, r) {
    i._TempBuffer[0] = t.r, i._TempBuffer[1] = t.g, i._TempBuffer[2] = t.b, i._TempBuffer[3] = r, this.updateUniform(e, i._TempBuffer, 4);
  }
  _updateDirectColor4ForUniform(e, t) {
    i._TempBuffer[0] = t.r, i._TempBuffer[1] = t.g, i._TempBuffer[2] = t.b, i._TempBuffer[3] = t.a, this.updateUniform(e, i._TempBuffer, 4);
  }
  _updateIntForEffect(e, t, r = "") {
    this._currentEffect.setInt(e + r, t);
  }
  _updateIntForUniform(e, t) {
    i._TempBufferInt32View[0] = t, this.updateUniform(e, i._TempBuffer, 1);
  }
  _updateInt2ForEffect(e, t, r, f = "") {
    this._currentEffect.setInt2(e + f, t, r);
  }
  _updateInt2ForUniform(e, t, r) {
    i._TempBufferInt32View[0] = t, i._TempBufferInt32View[1] = r, this.updateUniform(e, i._TempBuffer, 2);
  }
  _updateInt3ForEffect(e, t, r, f, s = "") {
    this._currentEffect.setInt3(e + s, t, r, f);
  }
  _updateInt3ForUniform(e, t, r, f) {
    i._TempBufferInt32View[0] = t, i._TempBufferInt32View[1] = r, i._TempBufferInt32View[2] = f, this.updateUniform(e, i._TempBuffer, 3);
  }
  _updateInt4ForEffect(e, t, r, f, s, a = "") {
    this._currentEffect.setInt4(e + a, t, r, f, s);
  }
  _updateInt4ForUniform(e, t, r, f, s) {
    i._TempBufferInt32View[0] = t, i._TempBufferInt32View[1] = r, i._TempBufferInt32View[2] = f, i._TempBufferInt32View[3] = s, this.updateUniform(e, i._TempBuffer, 4);
  }
  _updateUIntForEffect(e, t, r = "") {
    this._currentEffect.setUInt(e + r, t);
  }
  _updateUIntForUniform(e, t) {
    i._TempBufferUInt32View[0] = t, this.updateUniform(e, i._TempBuffer, 1);
  }
  _updateUInt2ForEffect(e, t, r, f = "") {
    this._currentEffect.setUInt2(e + f, t, r);
  }
  _updateUInt2ForUniform(e, t, r) {
    i._TempBufferUInt32View[0] = t, i._TempBufferUInt32View[1] = r, this.updateUniform(e, i._TempBuffer, 2);
  }
  _updateUInt3ForEffect(e, t, r, f, s = "") {
    this._currentEffect.setUInt3(e + s, t, r, f);
  }
  _updateUInt3ForUniform(e, t, r, f) {
    i._TempBufferUInt32View[0] = t, i._TempBufferUInt32View[1] = r, i._TempBufferUInt32View[2] = f, this.updateUniform(e, i._TempBuffer, 3);
  }
  _updateUInt4ForEffect(e, t, r, f, s, a = "") {
    this._currentEffect.setUInt4(e + a, t, r, f, s);
  }
  _updateUInt4ForUniform(e, t, r, f, s) {
    i._TempBufferUInt32View[0] = t, i._TempBufferUInt32View[1] = r, i._TempBufferUInt32View[2] = f, i._TempBufferUInt32View[3] = s, this.updateUniform(e, i._TempBuffer, 4);
  }
  /**
   * Sets a sampler uniform on the effect.
   * @param name Define the name of the sampler.
   * @param texture Define the texture to set in the sampler
   */
  setTexture(e, t) {
    this._currentEffect.setTexture(e, t);
  }
  /**
   * Sets a sampler uniform on the effect.
   * @param name Define the name of the sampler.
   * @param texture Define the (internal) texture to set in the sampler
   */
  bindTexture(e, t) {
    this._currentEffect._bindTexture(e, t);
  }
  /**
   * Directly updates the value of the uniform in the cache AND on the GPU.
   * @param uniformName Define the name of the uniform, as used in the uniform block in the shader.
   * @param data Define the flattened data
   */
  updateUniformDirectly(e, t) {
    this.updateUniform(e, t, t.length), this.update();
  }
  /**
   * Associates an effect to this uniform buffer
   * @param effect Define the effect to associate the buffer to
   * @param name Name of the uniform block in the shader.
   */
  bindToEffect(e, t) {
    this._currentEffect = e, this._currentEffectName = t;
  }
  /**
   * Binds the current (GPU) buffer to the effect
   */
  bindUniformBuffer() {
    !this._noUBO && this._buffer && this._currentEffect && this._currentEffect.bindUniformBuffer(this._buffer, this._currentEffectName);
  }
  /**
   * Dissociates the current effect from this uniform buffer
   */
  unbindEffect() {
    this._currentEffect = void 0, this._currentEffectName = void 0;
  }
  /**
   * Sets the current state of the class (_bufferIndex, _buffer) to point to the data buffer passed in parameter if this buffer is one of the buffers handled by the class (meaning if it can be found in the _buffers array)
   * This method is meant to be able to update a buffer at any time: just call setDataBuffer to set the class in the right state, call some updateXXX methods and then call udpate() => that will update the GPU buffer on the graphic card
   * @param dataBuffer buffer to look for
   * @returns true if the buffer has been found and the class internal state points to it, else false
   */
  setDataBuffer(e) {
    if (!this._buffers)
      return this._buffer === e;
    for (let t = 0; t < this._buffers.length; ++t)
      if (this._buffers[t][0] === e)
        return this._bufferIndex = t, this._buffer = e, this._createBufferOnWrite = !1, this._currentEffect = void 0, !0;
    return !1;
  }
  /**
   * Disposes the uniform buffer.
   */
  dispose() {
    if (this._noUBO)
      return;
    const e = this._engine._uniformBuffers, t = e.indexOf(this);
    if (t !== -1 && (e[t] = e[e.length - 1], e.pop()), this._engine._features.trackUbosInFrame && this._buffers)
      for (let r = 0; r < this._buffers.length; ++r) {
        const f = this._buffers[r][0];
        this._engine._releaseBuffer(f);
      }
    else this._buffer && this._engine._releaseBuffer(this._buffer) && (this._buffer = null);
  }
}
i._UpdatedUbosInFrame = {};
i._MAX_UNIFORM_SIZE = 256;
i._TempBuffer = new Float32Array(i._MAX_UNIFORM_SIZE);
i._TempBufferInt32View = new Int32Array(i._TempBuffer.buffer);
i._TempBufferUInt32View = new Uint32Array(i._TempBuffer.buffer);
export {
  i as U
};
//# sourceMappingURL=uniformBuffer-LDIehZve.js.map
