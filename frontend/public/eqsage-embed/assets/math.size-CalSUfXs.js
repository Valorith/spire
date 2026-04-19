class i {
  /**
   * Creates a Size object from the given width and height (floats).
   * @param width width of the new size
   * @param height height of the new size
   */
  constructor(t, h) {
    this.width = t, this.height = h;
  }
  /**
   * Returns a string with the Size width and height
   * @returns a string with the Size width and height
   */
  toString() {
    return `{W: ${this.width}, H: ${this.height}}`;
  }
  /**
   * "Size"
   * @returns the string "Size"
   */
  getClassName() {
    return "Size";
  }
  /**
   * Returns the Size hash code.
   * @returns a hash code for a unique width and height
   */
  getHashCode() {
    let t = this.width | 0;
    return t = t * 397 ^ (this.height | 0), t;
  }
  /**
   * Updates the current size from the given one.
   * @param src the given size
   */
  copyFrom(t) {
    this.width = t.width, this.height = t.height;
  }
  /**
   * Updates in place the current Size from the given floats.
   * @param width width of the new size
   * @param height height of the new size
   * @returns the updated Size.
   */
  copyFromFloats(t, h) {
    return this.width = t, this.height = h, this;
  }
  /**
   * Updates in place the current Size from the given floats.
   * @param width width to set
   * @param height height to set
   * @returns the updated Size.
   */
  set(t, h) {
    return this.copyFromFloats(t, h);
  }
  /**
   * Multiplies the width and height by numbers
   * @param w factor to multiple the width by
   * @param h factor to multiple the height by
   * @returns a new Size set with the multiplication result of the current Size and the given floats.
   */
  multiplyByFloats(t, h) {
    return new i(this.width * t, this.height * h);
  }
  /**
   * Clones the size
   * @returns a new Size copied from the given one.
   */
  clone() {
    return new i(this.width, this.height);
  }
  /**
   * True if the current Size and the given one width and height are strictly equal.
   * @param other the other size to compare against
   * @returns True if the current Size and the given one width and height are strictly equal.
   */
  equals(t) {
    return t ? this.width === t.width && this.height === t.height : !1;
  }
  /**
   * The surface of the Size : width * height (float).
   */
  get surface() {
    return this.width * this.height;
  }
  /**
   * Create a new size of zero
   * @returns a new Size set to (0.0, 0.0)
   */
  static Zero() {
    return new i(0, 0);
  }
  /**
   * Sums the width and height of two sizes
   * @param otherSize size to add to this size
   * @returns a new Size set as the addition result of the current Size and the given one.
   */
  add(t) {
    return new i(this.width + t.width, this.height + t.height);
  }
  /**
   * Subtracts the width and height of two
   * @param otherSize size to subtract to this size
   * @returns a new Size set as the subtraction result of  the given one from the current Size.
   */
  subtract(t) {
    return new i(this.width - t.width, this.height - t.height);
  }
  /**
   * Scales the width and height
   * @param scale the scale to multiply the width and height by
   * @returns a new Size set with the multiplication result of the current Size and the given floats.
   */
  scale(t) {
    return new i(this.width * t, this.height * t);
  }
  /**
   * Creates a new Size set at the linear interpolation "amount" between "start" and "end"
   * @param start starting size to lerp between
   * @param end end size to lerp between
   * @param amount amount to lerp between the start and end values
   * @returns a new Size set at the linear interpolation "amount" between "start" and "end"
   */
  static Lerp(t, h, s) {
    const e = t.width + (h.width - t.width) * s, r = t.height + (h.height - t.height) * s;
    return new i(e, r);
  }
}
export {
  i as S
};
//# sourceMappingURL=math.size-CalSUfXs.js.map
