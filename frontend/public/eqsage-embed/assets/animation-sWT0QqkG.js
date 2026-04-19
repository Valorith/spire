import { Q as p, a as M, g as _, h as d, C as g, i as P, M as L, w as V, W as S, R as K } from "./embed-entry-Bb6cfUYP.js";
import { N as U } from "./node-DDdHG9Gc.js";
import { S as F } from "./math.size-CalSUfXs.js";
import { S as Q } from "./decorators.serialization-D-l6hUAn.js";
var C;
(function(y) {
  y[y.NONE = 0] = "NONE", y[y.STEP = 1] = "STEP";
})(C || (C = {}));
class R {
  /**
   * Initializes the range of an animation
   * @param name The name of the animation range
   * @param from The starting frame of the animation
   * @param to The ending frame of the animation
   */
  constructor(e, t, s) {
    this.name = e, this.from = t, this.to = s;
  }
  /**
   * Makes a copy of the animation range
   * @returns A copy of the animation range
   */
  clone() {
    return new R(this.name, this.from, this.to);
  }
}
const Y = Object.freeze(new p(0, 0, 0, 0)), b = Object.freeze(M.Zero()), m = Object.freeze(_.Zero()), D = Object.freeze(F.Zero()), w = Object.freeze(d.Black()), z = Object.freeze(new g(0, 0, 0, 0)), h = {
  key: 0,
  repeatCount: 0,
  loopMode: 2
};
class n {
  /**
   * @internal Internal use
   */
  static _PrepareAnimation(e, t, s, o, r, i, a, O) {
    let l;
    if (!isNaN(parseFloat(r)) && isFinite(r) ? l = n.ANIMATIONTYPE_FLOAT : r instanceof p ? l = n.ANIMATIONTYPE_QUATERNION : r instanceof M ? l = n.ANIMATIONTYPE_VECTOR3 : r instanceof _ ? l = n.ANIMATIONTYPE_VECTOR2 : r instanceof d ? l = n.ANIMATIONTYPE_COLOR3 : r instanceof g ? l = n.ANIMATIONTYPE_COLOR4 : r instanceof F && (l = n.ANIMATIONTYPE_SIZE), l == null)
      return null;
    const u = new n(e, t, s, l, a), f = [
      { frame: 0, value: r },
      { frame: o, value: i }
    ];
    return u.setKeys(f), O !== void 0 && u.setEasingFunction(O), u;
  }
  /**
   * Sets up an animation
   * @param property The property to animate
   * @param animationType The animation type to apply
   * @param framePerSecond The frames per second of the animation
   * @param easingFunction The easing function used in the animation
   * @returns The created animation
   */
  static CreateAnimation(e, t, s, o) {
    const r = new n(e + "Animation", e, s, t, n.ANIMATIONLOOPMODE_CONSTANT);
    return r.setEasingFunction(o), r;
  }
  /**
   * Create and start an animation on a node
   * @param name defines the name of the global animation that will be run on all nodes
   * @param target defines the target where the animation will take place
   * @param targetProperty defines property to animate
   * @param framePerSecond defines the number of frame per second yo use
   * @param totalFrame defines the number of frames in total
   * @param from defines the initial value
   * @param to defines the final value
   * @param loopMode defines which loop mode you want to use (off by default)
   * @param easingFunction defines the easing function to use (linear by default)
   * @param onAnimationEnd defines the callback to call when animation end
   * @param scene defines the hosting scene
   * @returns the animatable created for this animation
   */
  static CreateAndStartAnimation(e, t, s, o, r, i, a, O, l, u, f) {
    const T = n._PrepareAnimation(e, s, o, r, i, a, O, l);
    return !T || (t.getScene && (f = t.getScene()), !f) ? null : f.beginDirectAnimation(t, [T], 0, r, T.loopMode === 1, 1, u);
  }
  /**
   * Create and start an animation on a node and its descendants
   * @param name defines the name of the global animation that will be run on all nodes
   * @param node defines the root node where the animation will take place
   * @param directDescendantsOnly if true only direct descendants will be used, if false direct and also indirect (children of children, an so on in a recursive manner) descendants will be used
   * @param targetProperty defines property to animate
   * @param framePerSecond defines the number of frame per second to use
   * @param totalFrame defines the number of frames in total
   * @param from defines the initial value
   * @param to defines the final value
   * @param loopMode defines which loop mode you want to use (off by default)
   * @param easingFunction defines the easing function to use (linear by default)
   * @param onAnimationEnd defines the callback to call when an animation ends (will be called once per node)
   * @returns the list of animatables created for all nodes
   * @example https://www.babylonjs-playground.com/#MH0VLI
   */
  static CreateAndStartHierarchyAnimation(e, t, s, o, r, i, a, O, l, u, f) {
    const T = n._PrepareAnimation(e, o, r, i, a, O, l, u);
    return T ? t.getScene().beginDirectHierarchyAnimation(t, s, [T], 0, i, T.loopMode === 1, 1, f) : null;
  }
  /**
   * Creates a new animation, merges it with the existing animations and starts it
   * @param name Name of the animation
   * @param node Node which contains the scene that begins the animations
   * @param targetProperty Specifies which property to animate
   * @param framePerSecond The frames per second of the animation
   * @param totalFrame The total number of frames
   * @param from The frame at the beginning of the animation
   * @param to The frame at the end of the animation
   * @param loopMode Specifies the loop mode of the animation
   * @param easingFunction (Optional) The easing function of the animation, which allow custom mathematical formulas for animations
   * @param onAnimationEnd Callback to run once the animation is complete
   * @returns Nullable animation
   */
  static CreateMergeAndStartAnimation(e, t, s, o, r, i, a, O, l, u) {
    const f = n._PrepareAnimation(e, s, o, r, i, a, O, l);
    return f ? (t.animations.push(f), t.getScene().beginAnimation(t, 0, r, f.loopMode === 1, 1, u)) : null;
  }
  /** @internal */
  static MakeAnimationAdditive(e, t, s, o = !1, r) {
    let i;
    typeof t == "object" ? i = t : i = {
      referenceFrame: t ?? 0,
      range: s,
      cloneOriginalAnimation: o,
      clonedAnimationName: r
    };
    let a = e;
    if (i.cloneOriginalAnimation && (a = e.clone(), a.name = i.clonedAnimationName || a.name), !a._keys.length)
      return a;
    const O = i.referenceFrame && i.referenceFrame >= 0 ? i.referenceFrame : 0;
    let l = 0;
    const u = a._keys[0];
    let f = a._keys.length - 1;
    const T = a._keys[f], c = {
      referenceValue: u.value,
      referencePosition: P.Vector3[0],
      referenceQuaternion: P.Quaternion[0],
      referenceScaling: P.Vector3[1],
      keyPosition: P.Vector3[2],
      keyQuaternion: P.Quaternion[1],
      keyScaling: P.Vector3[3]
    };
    let E = u.frame, I = T.frame;
    if (i.range) {
      const N = a.getRange(i.range);
      N && (E = N.from, I = N.to);
    } else
      E = i.fromFrame ?? E, I = i.toFrame ?? I;
    if (E !== u.frame && (l = a.createKeyForFrame(E)), I !== T.frame && (f = a.createKeyForFrame(I)), a._keys.length === 1) {
      const N = a._getKeyValue(a._keys[0]);
      c.referenceValue = N.clone ? N.clone() : N;
    } else if (O <= u.frame) {
      const N = a._getKeyValue(u.value);
      c.referenceValue = N.clone ? N.clone() : N;
    } else if (O >= T.frame) {
      const N = a._getKeyValue(T.value);
      c.referenceValue = N.clone ? N.clone() : N;
    } else {
      h.key = 0;
      const N = a._interpolate(O, h);
      c.referenceValue = N.clone ? N.clone() : N;
    }
    a.dataType === n.ANIMATIONTYPE_QUATERNION ? c.referenceValue.normalize().conjugateInPlace() : a.dataType === n.ANIMATIONTYPE_MATRIX && (c.referenceValue.decompose(c.referenceScaling, c.referenceQuaternion, c.referencePosition), c.referenceQuaternion.normalize().conjugateInPlace());
    let k = Number.MAX_VALUE;
    const v = i.clipKeys ? [] : null;
    for (let N = l; N <= f; N++) {
      let A = a._keys[N];
      if (v && (A = {
        frame: A.frame,
        value: A.value.clone ? A.value.clone() : A.value,
        inTangent: A.inTangent,
        outTangent: A.outTangent,
        interpolation: A.interpolation,
        lockedTangent: A.lockedTangent
      }, k === Number.MAX_VALUE && (k = A.frame), A.frame -= k, v.push(A)), !(N && a.dataType !== n.ANIMATIONTYPE_FLOAT && A.value === u.value))
        switch (a.dataType) {
          case n.ANIMATIONTYPE_MATRIX:
            A.value.decompose(c.keyScaling, c.keyQuaternion, c.keyPosition), c.keyPosition.subtractInPlace(c.referencePosition), c.keyScaling.divideInPlace(c.referenceScaling), c.referenceQuaternion.multiplyToRef(c.keyQuaternion, c.keyQuaternion), L.ComposeToRef(c.keyScaling, c.keyQuaternion, c.keyPosition, A.value);
            break;
          case n.ANIMATIONTYPE_QUATERNION:
            c.referenceValue.multiplyToRef(A.value, A.value);
            break;
          case n.ANIMATIONTYPE_VECTOR2:
          case n.ANIMATIONTYPE_VECTOR3:
          case n.ANIMATIONTYPE_COLOR3:
          case n.ANIMATIONTYPE_COLOR4:
            A.value.subtractToRef(c.referenceValue, A.value);
            break;
          case n.ANIMATIONTYPE_SIZE:
            A.value.width -= c.referenceValue.width, A.value.height -= c.referenceValue.height;
            break;
          default:
            A.value -= c.referenceValue;
        }
    }
    return v && a.setKeys(v, !0), a;
  }
  /**
   * Transition property of an host to the target Value
   * @param property The property to transition
   * @param targetValue The target Value of the property
   * @param host The object where the property to animate belongs
   * @param scene Scene used to run the animation
   * @param frameRate Framerate (in frame/s) to use
   * @param transition The transition type we want to use
   * @param duration The duration of the animation, in milliseconds
   * @param onAnimationEnd Callback trigger at the end of the animation
   * @returns Nullable animation
   */
  static TransitionTo(e, t, s, o, r, i, a, O = null) {
    if (a <= 0)
      return s[e] = t, O && O(), null;
    const l = r * (a / 1e3);
    i.setKeys([
      {
        frame: 0,
        value: s[e].clone ? s[e].clone() : s[e]
      },
      {
        frame: l,
        value: t
      }
    ]), s.animations || (s.animations = []), s.animations.push(i);
    const u = o.beginAnimation(s, 0, l, !1);
    return u.onAnimationEnd = O, u;
  }
  /**
   * Return the array of runtime animations currently using this animation
   */
  get runtimeAnimations() {
    return this._runtimeAnimations;
  }
  /**
   * Specifies if any of the runtime animations are currently running
   */
  get hasRunningRuntimeAnimations() {
    for (const e of this._runtimeAnimations)
      if (!e.isStopped())
        return !0;
    return !1;
  }
  /**
   * Initializes the animation
   * @param name Name of the animation
   * @param targetProperty Property to animate
   * @param framePerSecond The frames per second of the animation
   * @param dataType The data type of the animation
   * @param loopMode The loop mode of the animation
   * @param enableBlending Specifies if blending should be enabled
   */
  constructor(e, t, s, o, r, i) {
    this.name = e, this.targetProperty = t, this.framePerSecond = s, this.dataType = o, this.loopMode = r, this.enableBlending = i, this._easingFunction = null, this._runtimeAnimations = new Array(), this._events = new Array(), this.blendingSpeed = 0.01, this._ranges = {}, this.targetPropertyPath = t.split("."), this.dataType = o, this.loopMode = r === void 0 ? n.ANIMATIONLOOPMODE_CYCLE : r, this.uniqueId = n._UniqueIdGenerator++;
  }
  // Methods
  /**
   * Converts the animation to a string
   * @param fullDetails support for multiple levels of logging within scene loading
   * @returns String form of the animation
   */
  toString(e) {
    let t = "Name: " + this.name + ", property: " + this.targetProperty;
    if (t += ", datatype: " + ["Float", "Vector3", "Quaternion", "Matrix", "Color3", "Vector2"][this.dataType], t += ", nKeys: " + (this._keys ? this._keys.length : "none"), t += ", nRanges: " + (this._ranges ? Object.keys(this._ranges).length : "none"), e) {
      t += ", Ranges: {";
      let s = !0;
      for (const o in this._ranges)
        s && (t += ", ", s = !1), t += o;
      t += "}";
    }
    return t;
  }
  /**
   * Add an event to this animation
   * @param event Event to add
   */
  addEvent(e) {
    this._events.push(e), this._events.sort((t, s) => t.frame - s.frame);
  }
  /**
   * Remove all events found at the given frame
   * @param frame The frame to remove events from
   */
  removeEvents(e) {
    for (let t = 0; t < this._events.length; t++)
      this._events[t].frame === e && (this._events.splice(t, 1), t--);
  }
  /**
   * Retrieves all the events from the animation
   * @returns Events from the animation
   */
  getEvents() {
    return this._events;
  }
  /**
   * Creates an animation range
   * @param name Name of the animation range
   * @param from Starting frame of the animation range
   * @param to Ending frame of the animation
   */
  createRange(e, t, s) {
    this._ranges[e] || (this._ranges[e] = new R(e, t, s));
  }
  /**
   * Deletes an animation range by name
   * @param name Name of the animation range to delete
   * @param deleteFrames Specifies if the key frames for the range should also be deleted (true) or not (false)
   */
  deleteRange(e, t = !0) {
    const s = this._ranges[e];
    if (s) {
      if (t) {
        const o = s.from, r = s.to;
        for (let i = this._keys.length - 1; i >= 0; i--)
          this._keys[i].frame >= o && this._keys[i].frame <= r && this._keys.splice(i, 1);
      }
      this._ranges[e] = null;
    }
  }
  /**
   * Gets the animation range by name, or null if not defined
   * @param name Name of the animation range
   * @returns Nullable animation range
   */
  getRange(e) {
    return this._ranges[e];
  }
  /**
   * Gets the key frames from the animation
   * @returns The key frames of the animation
   */
  getKeys() {
    return this._keys;
  }
  /**
   * Gets the highest frame rate of the animation
   * @returns Highest frame rate of the animation
   */
  getHighestFrame() {
    let e = 0;
    for (let t = 0, s = this._keys.length; t < s; t++)
      e < this._keys[t].frame && (e = this._keys[t].frame);
    return e;
  }
  /**
   * Gets the easing function of the animation
   * @returns Easing function of the animation
   */
  getEasingFunction() {
    return this._easingFunction;
  }
  /**
   * Sets the easing function of the animation
   * @param easingFunction A custom mathematical formula for animation
   */
  setEasingFunction(e) {
    this._easingFunction = e;
  }
  /**
   * Interpolates a scalar linearly
   * @param startValue Start value of the animation curve
   * @param endValue End value of the animation curve
   * @param gradient Scalar amount to interpolate
   * @returns Interpolated scalar value
   */
  floatInterpolateFunction(e, t, s) {
    return V.Lerp(e, t, s);
  }
  /**
   * Interpolates a scalar cubically
   * @param startValue Start value of the animation curve
   * @param outTangent End tangent of the animation
   * @param endValue End value of the animation curve
   * @param inTangent Start tangent of the animation curve
   * @param gradient Scalar amount to interpolate
   * @returns Interpolated scalar value
   */
  floatInterpolateFunctionWithTangents(e, t, s, o, r) {
    return V.Hermite(e, t, s, o, r);
  }
  /**
   * Interpolates a quaternion using a spherical linear interpolation
   * @param startValue Start value of the animation curve
   * @param endValue End value of the animation curve
   * @param gradient Scalar amount to interpolate
   * @returns Interpolated quaternion value
   */
  quaternionInterpolateFunction(e, t, s) {
    return p.Slerp(e, t, s);
  }
  /**
   * Interpolates a quaternion cubically
   * @param startValue Start value of the animation curve
   * @param outTangent End tangent of the animation curve
   * @param endValue End value of the animation curve
   * @param inTangent Start tangent of the animation curve
   * @param gradient Scalar amount to interpolate
   * @returns Interpolated quaternion value
   */
  quaternionInterpolateFunctionWithTangents(e, t, s, o, r) {
    return p.Hermite(e, t, s, o, r).normalize();
  }
  /**
   * Interpolates a Vector3 linearly
   * @param startValue Start value of the animation curve
   * @param endValue End value of the animation curve
   * @param gradient Scalar amount to interpolate (value between 0 and 1)
   * @returns Interpolated scalar value
   */
  vector3InterpolateFunction(e, t, s) {
    return M.Lerp(e, t, s);
  }
  /**
   * Interpolates a Vector3 cubically
   * @param startValue Start value of the animation curve
   * @param outTangent End tangent of the animation
   * @param endValue End value of the animation curve
   * @param inTangent Start tangent of the animation curve
   * @param gradient Scalar amount to interpolate (value between 0 and 1)
   * @returns InterpolatedVector3 value
   */
  vector3InterpolateFunctionWithTangents(e, t, s, o, r) {
    return M.Hermite(e, t, s, o, r);
  }
  /**
   * Interpolates a Vector2 linearly
   * @param startValue Start value of the animation curve
   * @param endValue End value of the animation curve
   * @param gradient Scalar amount to interpolate (value between 0 and 1)
   * @returns Interpolated Vector2 value
   */
  vector2InterpolateFunction(e, t, s) {
    return _.Lerp(e, t, s);
  }
  /**
   * Interpolates a Vector2 cubically
   * @param startValue Start value of the animation curve
   * @param outTangent End tangent of the animation
   * @param endValue End value of the animation curve
   * @param inTangent Start tangent of the animation curve
   * @param gradient Scalar amount to interpolate (value between 0 and 1)
   * @returns Interpolated Vector2 value
   */
  vector2InterpolateFunctionWithTangents(e, t, s, o, r) {
    return _.Hermite(e, t, s, o, r);
  }
  /**
   * Interpolates a size linearly
   * @param startValue Start value of the animation curve
   * @param endValue End value of the animation curve
   * @param gradient Scalar amount to interpolate
   * @returns Interpolated Size value
   */
  sizeInterpolateFunction(e, t, s) {
    return F.Lerp(e, t, s);
  }
  /**
   * Interpolates a Color3 linearly
   * @param startValue Start value of the animation curve
   * @param endValue End value of the animation curve
   * @param gradient Scalar amount to interpolate
   * @returns Interpolated Color3 value
   */
  color3InterpolateFunction(e, t, s) {
    return d.Lerp(e, t, s);
  }
  /**
   * Interpolates a Color3 cubically
   * @param startValue Start value of the animation curve
   * @param outTangent End tangent of the animation
   * @param endValue End value of the animation curve
   * @param inTangent Start tangent of the animation curve
   * @param gradient Scalar amount to interpolate
   * @returns interpolated value
   */
  color3InterpolateFunctionWithTangents(e, t, s, o, r) {
    return d.Hermite(e, t, s, o, r);
  }
  /**
   * Interpolates a Color4 linearly
   * @param startValue Start value of the animation curve
   * @param endValue End value of the animation curve
   * @param gradient Scalar amount to interpolate
   * @returns Interpolated Color3 value
   */
  color4InterpolateFunction(e, t, s) {
    return g.Lerp(e, t, s);
  }
  /**
   * Interpolates a Color4 cubically
   * @param startValue Start value of the animation curve
   * @param outTangent End tangent of the animation
   * @param endValue End value of the animation curve
   * @param inTangent Start tangent of the animation curve
   * @param gradient Scalar amount to interpolate
   * @returns interpolated value
   */
  color4InterpolateFunctionWithTangents(e, t, s, o, r) {
    return g.Hermite(e, t, s, o, r);
  }
  /**
   * @internal Internal use only
   */
  _getKeyValue(e) {
    return typeof e == "function" ? e() : e;
  }
  /**
   * Evaluate the animation value at a given frame
   * @param currentFrame defines the frame where we want to evaluate the animation
   * @returns the animation value
   */
  evaluate(e) {
    return h.key = 0, this._interpolate(e, h);
  }
  /**
   * @internal Internal use only
   */
  _interpolate(e, t, s = !1) {
    if (t.loopMode === n.ANIMATIONLOOPMODE_CONSTANT && t.repeatCount > 0)
      return t.highLimitValue.clone ? t.highLimitValue.clone() : t.highLimitValue;
    const o = this._keys, r = o.length;
    let i = t.key;
    for (; i >= 0 && e < o[i].frame; )
      --i;
    for (; i + 1 <= r - 1 && e >= o[i + 1].frame; )
      ++i;
    if (t.key = i, i < 0)
      return s ? void 0 : this._getKeyValue(o[0].value);
    if (i + 1 > r - 1)
      return s ? void 0 : this._getKeyValue(o[r - 1].value);
    const a = o[i], O = o[i + 1];
    if (s && (e === a.frame || e === O.frame))
      return;
    const l = this._getKeyValue(a.value), u = this._getKeyValue(O.value);
    if (a.interpolation === C.STEP)
      return O.frame > e ? l : u;
    const f = a.outTangent !== void 0 && O.inTangent !== void 0, T = O.frame - a.frame;
    let c = (e - a.frame) / T;
    const E = a.easingFunction || this.getEasingFunction();
    switch (E !== null && (c = E.ease(c)), this.dataType) {
      case n.ANIMATIONTYPE_FLOAT: {
        const I = f ? this.floatInterpolateFunctionWithTangents(l, a.outTangent * T, u, O.inTangent * T, c) : this.floatInterpolateFunction(l, u, c);
        switch (t.loopMode) {
          case n.ANIMATIONLOOPMODE_CYCLE:
          case n.ANIMATIONLOOPMODE_CONSTANT:
          case n.ANIMATIONLOOPMODE_YOYO:
            return I;
          case n.ANIMATIONLOOPMODE_RELATIVE:
          case n.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT:
            return (t.offsetValue ?? 0) * t.repeatCount + I;
        }
        break;
      }
      case n.ANIMATIONTYPE_QUATERNION: {
        const I = f ? this.quaternionInterpolateFunctionWithTangents(l, a.outTangent.scale(T), u, O.inTangent.scale(T), c) : this.quaternionInterpolateFunction(l, u, c);
        switch (t.loopMode) {
          case n.ANIMATIONLOOPMODE_CYCLE:
          case n.ANIMATIONLOOPMODE_CONSTANT:
          case n.ANIMATIONLOOPMODE_YOYO:
            return I;
          case n.ANIMATIONLOOPMODE_RELATIVE:
          case n.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT:
            return I.addInPlace((t.offsetValue || Y).scale(t.repeatCount));
        }
        return I;
      }
      case n.ANIMATIONTYPE_VECTOR3: {
        const I = f ? this.vector3InterpolateFunctionWithTangents(l, a.outTangent.scale(T), u, O.inTangent.scale(T), c) : this.vector3InterpolateFunction(l, u, c);
        switch (t.loopMode) {
          case n.ANIMATIONLOOPMODE_CYCLE:
          case n.ANIMATIONLOOPMODE_CONSTANT:
          case n.ANIMATIONLOOPMODE_YOYO:
            return I;
          case n.ANIMATIONLOOPMODE_RELATIVE:
          case n.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT:
            return I.add((t.offsetValue || b).scale(t.repeatCount));
        }
        break;
      }
      case n.ANIMATIONTYPE_VECTOR2: {
        const I = f ? this.vector2InterpolateFunctionWithTangents(l, a.outTangent.scale(T), u, O.inTangent.scale(T), c) : this.vector2InterpolateFunction(l, u, c);
        switch (t.loopMode) {
          case n.ANIMATIONLOOPMODE_CYCLE:
          case n.ANIMATIONLOOPMODE_CONSTANT:
          case n.ANIMATIONLOOPMODE_YOYO:
            return I;
          case n.ANIMATIONLOOPMODE_RELATIVE:
          case n.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT:
            return I.add((t.offsetValue || m).scale(t.repeatCount));
        }
        break;
      }
      case n.ANIMATIONTYPE_SIZE: {
        switch (t.loopMode) {
          case n.ANIMATIONLOOPMODE_CYCLE:
          case n.ANIMATIONLOOPMODE_CONSTANT:
          case n.ANIMATIONLOOPMODE_YOYO:
            return this.sizeInterpolateFunction(l, u, c);
          case n.ANIMATIONLOOPMODE_RELATIVE:
          case n.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT:
            return this.sizeInterpolateFunction(l, u, c).add((t.offsetValue || D).scale(t.repeatCount));
        }
        break;
      }
      case n.ANIMATIONTYPE_COLOR3: {
        const I = f ? this.color3InterpolateFunctionWithTangents(l, a.outTangent.scale(T), u, O.inTangent.scale(T), c) : this.color3InterpolateFunction(l, u, c);
        switch (t.loopMode) {
          case n.ANIMATIONLOOPMODE_CYCLE:
          case n.ANIMATIONLOOPMODE_CONSTANT:
          case n.ANIMATIONLOOPMODE_YOYO:
            return I;
          case n.ANIMATIONLOOPMODE_RELATIVE:
          case n.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT:
            return I.add((t.offsetValue || w).scale(t.repeatCount));
        }
        break;
      }
      case n.ANIMATIONTYPE_COLOR4: {
        const I = f ? this.color4InterpolateFunctionWithTangents(l, a.outTangent.scale(T), u, O.inTangent.scale(T), c) : this.color4InterpolateFunction(l, u, c);
        switch (t.loopMode) {
          case n.ANIMATIONLOOPMODE_CYCLE:
          case n.ANIMATIONLOOPMODE_CONSTANT:
          case n.ANIMATIONLOOPMODE_YOYO:
            return I;
          case n.ANIMATIONLOOPMODE_RELATIVE:
          case n.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT:
            return I.add((t.offsetValue || z).scale(t.repeatCount));
        }
        break;
      }
      case n.ANIMATIONTYPE_MATRIX: {
        switch (t.loopMode) {
          case n.ANIMATIONLOOPMODE_CYCLE:
          case n.ANIMATIONLOOPMODE_CONSTANT:
          case n.ANIMATIONLOOPMODE_YOYO:
            return n.AllowMatricesInterpolation ? this.matrixInterpolateFunction(l, u, c, t.workValue) : l;
          case n.ANIMATIONLOOPMODE_RELATIVE:
          case n.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT:
            return l;
        }
        break;
      }
    }
    return 0;
  }
  /**
   * Defines the function to use to interpolate matrices
   * @param startValue defines the start matrix
   * @param endValue defines the end matrix
   * @param gradient defines the gradient between both matrices
   * @param result defines an optional target matrix where to store the interpolation
   * @returns the interpolated matrix
   */
  matrixInterpolateFunction(e, t, s, o) {
    return n.AllowMatrixDecomposeForInterpolation ? o ? (L.DecomposeLerpToRef(e, t, s, o), o) : L.DecomposeLerp(e, t, s) : o ? (L.LerpToRef(e, t, s, o), o) : L.Lerp(e, t, s);
  }
  /**
   * Makes a copy of the animation
   * @returns Cloned animation
   */
  clone() {
    const e = new n(this.name, this.targetPropertyPath.join("."), this.framePerSecond, this.dataType, this.loopMode);
    if (e.enableBlending = this.enableBlending, e.blendingSpeed = this.blendingSpeed, this._keys && e.setKeys(this._keys), this._ranges) {
      e._ranges = {};
      for (const t in this._ranges) {
        const s = this._ranges[t];
        s && (e._ranges[t] = s.clone());
      }
    }
    return e;
  }
  /**
   * Sets the key frames of the animation
   * @param values The animation key frames to set
   * @param dontClone Whether to clone the keys or not (default is false, so the array of keys is cloned)
   */
  setKeys(e, t = !1) {
    this._keys = t ? e : e.slice(0);
  }
  /**
   * Creates a key for the frame passed as a parameter and adds it to the animation IF a key doesn't already exist for that frame
   * @param frame Frame number
   * @returns The key index if the key was added or the index of the pre existing key if the frame passed as parameter already has a corresponding key
   */
  createKeyForFrame(e) {
    h.key = 0;
    const t = this._interpolate(e, h, !0);
    if (!t)
      return this._keys[h.key].frame === e ? h.key : h.key + 1;
    const s = {
      frame: e,
      value: t.clone ? t.clone() : t
    };
    return this._keys.splice(h.key + 1, 0, s), h.key + 1;
  }
  /**
   * Serializes the animation to an object
   * @returns Serialized object
   */
  serialize() {
    const e = {};
    e.name = this.name, e.property = this.targetProperty, e.framePerSecond = this.framePerSecond, e.dataType = this.dataType, e.loopBehavior = this.loopMode, e.enableBlending = this.enableBlending, e.blendingSpeed = this.blendingSpeed;
    const t = this.dataType;
    e.keys = [];
    const s = this.getKeys();
    for (let o = 0; o < s.length; o++) {
      const r = s[o], i = {};
      switch (i.frame = r.frame, t) {
        case n.ANIMATIONTYPE_FLOAT:
          i.values = [r.value], r.inTangent !== void 0 && i.values.push(r.inTangent), r.outTangent !== void 0 && (r.inTangent === void 0 && i.values.push(void 0), i.values.push(r.outTangent)), r.interpolation !== void 0 && (r.inTangent === void 0 && i.values.push(void 0), r.outTangent === void 0 && i.values.push(void 0), i.values.push(r.interpolation));
          break;
        case n.ANIMATIONTYPE_QUATERNION:
        case n.ANIMATIONTYPE_MATRIX:
        case n.ANIMATIONTYPE_VECTOR3:
        case n.ANIMATIONTYPE_COLOR3:
        case n.ANIMATIONTYPE_COLOR4:
          i.values = r.value.asArray(), r.inTangent != null && i.values.push(r.inTangent.asArray()), r.outTangent != null && (r.inTangent === void 0 && i.values.push(void 0), i.values.push(r.outTangent.asArray())), r.interpolation !== void 0 && (r.inTangent === void 0 && i.values.push(void 0), r.outTangent === void 0 && i.values.push(void 0), i.values.push(r.interpolation));
          break;
      }
      e.keys.push(i);
    }
    e.ranges = [];
    for (const o in this._ranges) {
      const r = this._ranges[o];
      if (!r)
        continue;
      const i = {};
      i.name = o, i.from = r.from, i.to = r.to, e.ranges.push(i);
    }
    return e;
  }
  /**
   * @internal
   */
  static _UniversalLerp(e, t, s) {
    const o = e.constructor;
    return o.Lerp ? o.Lerp(e, t, s) : o.Slerp ? o.Slerp(e, t, s) : e.toFixed ? e * (1 - s) + s * t : t;
  }
  /**
   * Parses an animation object and creates an animation
   * @param parsedAnimation Parsed animation object
   * @returns Animation object
   */
  static Parse(e) {
    const t = new n(e.name, e.property, e.framePerSecond, e.dataType, e.loopBehavior), s = e.dataType, o = [];
    let r, i;
    for (e.enableBlending && (t.enableBlending = e.enableBlending), e.blendingSpeed && (t.blendingSpeed = e.blendingSpeed), i = 0; i < e.keys.length; i++) {
      const a = e.keys[i];
      let O, l, u;
      switch (s) {
        case n.ANIMATIONTYPE_FLOAT:
          r = a.values[0], a.values.length >= 2 && (O = a.values[1]), a.values.length >= 3 && (l = a.values[2]), a.values.length >= 4 && (u = a.values[3]);
          break;
        case n.ANIMATIONTYPE_QUATERNION:
          if (r = p.FromArray(a.values), a.values.length >= 8) {
            const T = p.FromArray(a.values.slice(4, 8));
            T.equals(p.Zero()) || (O = T);
          }
          if (a.values.length >= 12) {
            const T = p.FromArray(a.values.slice(8, 12));
            T.equals(p.Zero()) || (l = T);
          }
          a.values.length >= 13 && (u = a.values[12]);
          break;
        case n.ANIMATIONTYPE_MATRIX:
          r = L.FromArray(a.values), a.values.length >= 17 && (u = a.values[16]);
          break;
        case n.ANIMATIONTYPE_COLOR3:
          r = d.FromArray(a.values), a.values[3] && (O = d.FromArray(a.values[3])), a.values[4] && (l = d.FromArray(a.values[4])), a.values[5] && (u = a.values[5]);
          break;
        case n.ANIMATIONTYPE_COLOR4:
          r = g.FromArray(a.values), a.values[4] && (O = g.FromArray(a.values[4])), a.values[5] && (l = g.FromArray(a.values[5])), a.values[6] && (u = g.FromArray(a.values[6]));
          break;
        case n.ANIMATIONTYPE_VECTOR3:
        default:
          r = M.FromArray(a.values), a.values[3] && (O = M.FromArray(a.values[3])), a.values[4] && (l = M.FromArray(a.values[4])), a.values[5] && (u = a.values[5]);
          break;
      }
      const f = {};
      f.frame = a.frame, f.value = r, O != null && (f.inTangent = O), l != null && (f.outTangent = l), u != null && (f.interpolation = u), o.push(f);
    }
    if (t.setKeys(o), e.ranges)
      for (i = 0; i < e.ranges.length; i++)
        r = e.ranges[i], t.createRange(r.name, r.from, r.to);
    return t;
  }
  /**
   * Appends the serialized animations from the source animations
   * @param source Source containing the animations
   * @param destination Target to store the animations
   */
  static AppendSerializedAnimations(e, t) {
    Q.AppendSerializedAnimations(e, t);
  }
  /**
   * Creates a new animation or an array of animations from a snippet saved in a remote file
   * @param name defines the name of the animation to create (can be null or empty to use the one from the json data)
   * @param url defines the url to load from
   * @returns a promise that will resolve to the new animation or an array of animations
   */
  static ParseFromFileAsync(e, t) {
    return new Promise((s, o) => {
      const r = new S();
      r.addEventListener("readystatechange", () => {
        if (r.readyState == 4)
          if (r.status == 200) {
            let i = JSON.parse(r.responseText);
            if (i.animations && (i = i.animations), i.length) {
              const a = [];
              for (const O of i)
                a.push(this.Parse(O));
              s(a);
            } else {
              const a = this.Parse(i);
              e && (a.name = e), s(a);
            }
          } else
            o("Unable to load the animation");
      }), r.open("GET", t), r.send();
    });
  }
  /**
   * Creates an animation or an array of animations from a snippet saved by the Inspector
   * @param snippetId defines the snippet to load
   * @returns a promise that will resolve to the new animation or a new array of animations
   */
  static ParseFromSnippetAsync(e) {
    return new Promise((t, s) => {
      const o = new S();
      o.addEventListener("readystatechange", () => {
        if (o.readyState == 4)
          if (o.status == 200) {
            const r = JSON.parse(JSON.parse(o.responseText).jsonPayload);
            if (r.animations) {
              const i = JSON.parse(r.animations), a = [];
              for (const O of i.animations) {
                const l = this.Parse(O);
                l.snippetId = e, a.push(l);
              }
              t(a);
            } else {
              const i = JSON.parse(r.animation), a = this.Parse(i);
              a.snippetId = e, t(a);
            }
          } else
            s("Unable to load the snippet " + e);
      }), o.open("GET", this.SnippetUrl + "/" + e.replace(/#/g, "/")), o.send();
    });
  }
}
n._UniqueIdGenerator = 0;
n.AllowMatricesInterpolation = !1;
n.AllowMatrixDecomposeForInterpolation = !0;
n.SnippetUrl = "https://snippet.babylonjs.com";
n.ANIMATIONTYPE_FLOAT = 0;
n.ANIMATIONTYPE_VECTOR3 = 1;
n.ANIMATIONTYPE_QUATERNION = 2;
n.ANIMATIONTYPE_MATRIX = 3;
n.ANIMATIONTYPE_COLOR3 = 4;
n.ANIMATIONTYPE_COLOR4 = 7;
n.ANIMATIONTYPE_VECTOR2 = 5;
n.ANIMATIONTYPE_SIZE = 6;
n.ANIMATIONLOOPMODE_RELATIVE = 0;
n.ANIMATIONLOOPMODE_CYCLE = 1;
n.ANIMATIONLOOPMODE_CONSTANT = 2;
n.ANIMATIONLOOPMODE_YOYO = 4;
n.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT = 5;
n.CreateFromSnippetAsync = n.ParseFromSnippetAsync;
K("BABYLON.Animation", n);
U._AnimationRangeFactory = (y, e, t) => new R(y, e, t);
const B = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Animation: n,
  _staticOffsetValueColor3: w,
  _staticOffsetValueColor4: z,
  _staticOffsetValueQuaternion: Y,
  _staticOffsetValueSize: D,
  _staticOffsetValueVector2: m,
  _staticOffsetValueVector3: b
}, Symbol.toStringTag, { value: "Module" }));
export {
  n as A,
  z as _,
  w as a,
  D as b,
  m as c,
  b as d,
  Y as e,
  C as f,
  R as g,
  B as h
};
//# sourceMappingURL=animation-sWT0QqkG.js.map
