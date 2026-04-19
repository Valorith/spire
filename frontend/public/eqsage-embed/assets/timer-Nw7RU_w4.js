import { O as n } from "./embed-entry-Dediijbe.js";
var r;
(function(e) {
  e[e.INIT = 0] = "INIT", e[e.STARTED = 1] = "STARTED", e[e.ENDED = 2] = "ENDED";
})(r || (r = {}));
function d(e) {
  let t = 0;
  const s = Date.now();
  e.observableParameters = e.observableParameters ?? {};
  const a = e.contextObservable.add((i) => {
    const b = Date.now();
    t = b - s;
    const o = {
      startTime: s,
      currentTime: b,
      deltaTime: t,
      completeRate: t / e.timeout,
      payload: i
    };
    e.onTick && e.onTick(o), e.breakCondition && e.breakCondition() && (e.contextObservable.remove(a), e.onAborted && e.onAborted(o)), t >= e.timeout && (e.contextObservable.remove(a), e.onEnded && e.onEnded(o));
  }, e.observableParameters.mask, e.observableParameters.insertFirst, e.observableParameters.scope);
  return a;
}
class l {
  /**
   * Will construct a new advanced timer based on the options provided. Timer will not start until start() is called.
   * @param options construction options for this advanced timer
   */
  constructor(t) {
    this.onEachCountObservable = new n(), this.onTimerAbortedObservable = new n(), this.onTimerEndedObservable = new n(), this.onStateChangedObservable = new n(), this._observer = null, this._breakOnNextTick = !1, this._tick = (s) => {
      const a = Date.now();
      this._timer = a - this._startTime;
      const i = {
        startTime: this._startTime,
        currentTime: a,
        deltaTime: this._timer,
        completeRate: this._timer / this._timeToEnd,
        payload: s
      }, b = this._breakOnNextTick || this._breakCondition(i);
      b || this._timer >= this._timeToEnd ? this._stop(i, b) : this.onEachCountObservable.notifyObservers(i);
    }, this._setState(r.INIT), this._contextObservable = t.contextObservable, this._observableParameters = t.observableParameters ?? {}, this._breakCondition = t.breakCondition ?? (() => !1), this._timeToEnd = t.timeout, t.onEnded && this.onTimerEndedObservable.add(t.onEnded), t.onTick && this.onEachCountObservable.add(t.onTick), t.onAborted && this.onTimerAbortedObservable.add(t.onAborted);
  }
  /**
   * set a breaking condition for this timer. Default is to never break during count
   * @param predicate the new break condition. Returns true to break, false otherwise
   */
  set breakCondition(t) {
    this._breakCondition = t;
  }
  /**
   * Reset ALL associated observables in this advanced timer
   */
  clearObservables() {
    this.onEachCountObservable.clear(), this.onTimerAbortedObservable.clear(), this.onTimerEndedObservable.clear(), this.onStateChangedObservable.clear();
  }
  /**
   * Will start a new iteration of this timer. Only one instance of this timer can run at a time.
   *
   * @param timeToEnd how much time to measure until timer ended
   */
  start(t = this._timeToEnd) {
    if (this._state === r.STARTED)
      throw new Error("Timer already started. Please stop it before starting again");
    this._timeToEnd = t, this._startTime = Date.now(), this._timer = 0, this._observer = this._contextObservable.add(this._tick, this._observableParameters.mask, this._observableParameters.insertFirst, this._observableParameters.scope), this._setState(r.STARTED);
  }
  /**
   * Will force a stop on the next tick.
   */
  stop() {
    this._state === r.STARTED && (this._breakOnNextTick = !0);
  }
  /**
   * Dispose this timer, clearing all resources
   */
  dispose() {
    this._observer && this._contextObservable.remove(this._observer), this.clearObservables();
  }
  _setState(t) {
    this._state = t, this.onStateChangedObservable.notifyObservers(this._state);
  }
  _stop(t, s = !1) {
    this._contextObservable.remove(this._observer), this._setState(r.ENDED), s ? this.onTimerAbortedObservable.notifyObservers(t) : this.onTimerEndedObservable.notifyObservers(t);
  }
}
export {
  l as A,
  r as T,
  d as s
};
//# sourceMappingURL=timer-Nw7RU_w4.js.map
