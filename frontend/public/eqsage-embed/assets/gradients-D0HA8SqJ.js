import { C as h } from "./embed-entry-Dediijbe.js";
class f {
  /**
   * Creates a new color4 gradient
   * @param gradient gets or sets the gradient value (between 0 and 1)
   * @param color1 gets or sets first associated color
   * @param color2 gets or sets first second color
   */
  constructor(r, t, o) {
    this.gradient = r, this.color1 = t, this.color2 = o;
  }
  /**
   * Will get a color picked randomly between color1 and color2.
   * If color2 is undefined then color1 will be used
   * @param result defines the target Color4 to store the result in
   */
  getColorToRef(r) {
    if (!this.color2) {
      r.copyFrom(this.color1);
      return;
    }
    h.LerpToRef(this.color1, this.color2, Math.random(), r);
  }
}
class d {
  /**
   * Creates a new color3 gradient
   * @param gradient gets or sets the gradient value (between 0 and 1)
   * @param color gets or sets associated color
   */
  constructor(r, t) {
    this.gradient = r, this.color = t;
  }
}
class G {
  /**
   * Creates a new factor gradient
   * @param gradient gets or sets the gradient value (between 0 and 1)
   * @param factor1 gets or sets first associated factor
   * @param factor2 gets or sets second associated factor
   */
  constructor(r, t, o) {
    this.gradient = r, this.factor1 = t, this.factor2 = o;
  }
  /**
   * Will get a number picked randomly between factor1 and factor2.
   * If factor2 is undefined then factor1 will be used
   * @returns the picked number
   */
  getFactor() {
    return this.factor2 === void 0 || this.factor2 === this.factor1 ? this.factor1 : this.factor1 + (this.factor2 - this.factor1) * Math.random();
  }
}
class g {
  /**
   * Gets the current gradient from an array of IValueGradient
   * @param ratio defines the current ratio to get
   * @param gradients defines the array of IValueGradient
   * @param updateFunc defines the callback function used to get the final value from the selected gradients
   */
  static GetCurrentGradient(r, t, o) {
    if (t[0].gradient > r) {
      o(t[0], t[0], 1);
      return;
    }
    for (let c = 0; c < t.length - 1; c++) {
      const i = t[c], n = t[c + 1];
      if (r >= i.gradient && r <= n.gradient) {
        const a = (r - i.gradient) / (n.gradient - i.gradient);
        o(i, n, a);
        return;
      }
    }
    const s = t.length - 1;
    o(t[s], t[s], 1);
  }
}
export {
  d as Color3Gradient,
  f as ColorGradient,
  G as FactorGradient,
  g as GradientHelper
};
//# sourceMappingURL=gradients-D0HA8SqJ.js.map
