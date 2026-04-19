import { Y as l } from "./embed-entry-BKE21f6Q.js";
l.prototype.setAlphaConstants = function(a, t, e, h) {
  this._alphaState.setAlphaBlendConstants(a, t, e, h);
};
l.prototype.setAlphaMode = function(a, t = !1) {
  if (this._alphaMode === a) {
    if (!t) {
      const e = a === 0;
      this.depthCullingState.depthMask !== e && (this.depthCullingState.depthMask = e);
    }
    return;
  }
  switch (a) {
    case 0:
      this._alphaState.alphaBlend = !1;
      break;
    case 7:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE), this._alphaState.alphaBlend = !0;
      break;
    case 8:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA), this._alphaState.alphaBlend = !0;
      break;
    case 2:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE), this._alphaState.alphaBlend = !0;
      break;
    case 6:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE), this._alphaState.alphaBlend = !0;
      break;
    case 1:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ONE), this._alphaState.alphaBlend = !0;
      break;
    case 3:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ZERO, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE), this._alphaState.alphaBlend = !0;
      break;
    case 4:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_COLOR, this._gl.ZERO, this._gl.ONE, this._gl.ONE), this._alphaState.alphaBlend = !0;
      break;
    case 5:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE), this._alphaState.alphaBlend = !0;
      break;
    case 9:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.CONSTANT_COLOR, this._gl.ONE_MINUS_CONSTANT_COLOR, this._gl.CONSTANT_ALPHA, this._gl.ONE_MINUS_CONSTANT_ALPHA), this._alphaState.alphaBlend = !0;
      break;
    case 10:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA), this._alphaState.alphaBlend = !0;
      break;
    case 11:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ONE, this._gl.ONE), this._alphaState.alphaBlend = !0;
      break;
    case 12:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ZERO), this._alphaState.alphaBlend = !0;
      break;
    case 13:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE_MINUS_DST_COLOR, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE_MINUS_DST_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA), this._alphaState.alphaBlend = !0;
      break;
    case 14:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA), this._alphaState.alphaBlend = !0;
      break;
    case 15:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ONE, this._gl.ZERO), this._alphaState.alphaBlend = !0;
      break;
    case 16:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE_MINUS_DST_COLOR, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ZERO, this._gl.ONE), this._alphaState.alphaBlend = !0;
      break;
    case 17:
      this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA), this._alphaState.alphaBlend = !0;
      break;
  }
  t || (this.depthCullingState.depthMask = a === 0), this._alphaMode = a;
};
l.prototype.getAlphaMode = function() {
  return this._alphaMode;
};
l.prototype.setAlphaEquation = function(a) {
  if (this._alphaEquation !== a) {
    switch (a) {
      case 0:
        this._alphaState.setAlphaEquationParameters(32774, 32774);
        break;
      case 1:
        this._alphaState.setAlphaEquationParameters(32778, 32778);
        break;
      case 2:
        this._alphaState.setAlphaEquationParameters(32779, 32779);
        break;
      case 3:
        this._alphaState.setAlphaEquationParameters(32776, 32776);
        break;
      case 4:
        this._alphaState.setAlphaEquationParameters(32775, 32775);
        break;
      case 5:
        this._alphaState.setAlphaEquationParameters(32775, 32774);
        break;
    }
    this._alphaEquation = a;
  }
};
l.prototype.getAlphaEquation = function() {
  return this._alphaEquation;
};
l.prototype.updateDynamicIndexBuffer = function(a, t, e = 0) {
  this._currentBoundBuffer[this._gl.ELEMENT_ARRAY_BUFFER] = null, this.bindIndexBuffer(a);
  let h;
  a.is32Bits ? h = t instanceof Uint32Array ? t : new Uint32Array(t) : h = t instanceof Uint16Array ? t : new Uint16Array(t), this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, h, this._gl.DYNAMIC_DRAW), this._resetIndexBufferBinding();
};
l.prototype.updateDynamicVertexBuffer = function(a, t, e, h) {
  this.bindArrayBuffer(a), e === void 0 && (e = 0);
  const s = t.byteLength || t.length;
  h === void 0 || h >= s && e === 0 ? t instanceof Array ? this._gl.bufferSubData(this._gl.ARRAY_BUFFER, e, new Float32Array(t)) : this._gl.bufferSubData(this._gl.ARRAY_BUFFER, e, t) : t instanceof Array ? this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(t).subarray(e, e + h)) : (t instanceof ArrayBuffer ? t = new Uint8Array(t, e, h) : t = new Uint8Array(t.buffer, t.byteOffset + e, h), this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, t)), this._resetVertexBufferBinding();
};
//# sourceMappingURL=engine.dynamicBuffer-CzeutWvF.js.map
