class s {
  /**
   * Creates a Viewport object located at (x, y) and sized (width, height)
   * @param x defines viewport left coordinate
   * @param y defines viewport top coordinate
   * @param width defines the viewport width
   * @param height defines the viewport height
   */
  constructor(t, h, i, o) {
    this.x = t, this.y = h, this.width = i, this.height = o;
  }
  /**
   * Creates a new viewport using absolute sizing (from 0-> width, 0-> height instead of 0->1)
   * @param renderWidth defines the rendering width
   * @param renderHeight defines the rendering height
   * @returns a new Viewport
   */
  toGlobal(t, h) {
    return new s(this.x * t, this.y * h, this.width * t, this.height * h);
  }
  /**
   * Stores absolute viewport value into a target viewport (from 0-> width, 0-> height instead of 0->1)
   * @param renderWidth defines the rendering width
   * @param renderHeight defines the rendering height
   * @param ref defines the target viewport
   * @returns the current viewport
   */
  toGlobalToRef(t, h, i) {
    return i.x = this.x * t, i.y = this.y * h, i.width = this.width * t, i.height = this.height * h, this;
  }
  /**
   * Returns a new Viewport copied from the current one
   * @returns a new Viewport
   */
  clone() {
    return new s(this.x, this.y, this.width, this.height);
  }
}
export {
  s as V
};
//# sourceMappingURL=math.viewport-CrgurBQ6.js.map
