class h {
  /**
   * Instantiates a Smart Array.
   * @param capacity defines the default capacity of the array.
   */
  constructor(t) {
    this.length = 0, this.data = new Array(t), this._id = h._GlobalId++;
  }
  /**
   * Pushes a value at the end of the active data.
   * @param value defines the object to push in the array.
   */
  push(t) {
    this.data[this.length++] = t, this.length > this.data.length && (this.data.length *= 2);
  }
  /**
   * Iterates over the active data and apply the lambda to them.
   * @param func defines the action to apply on each value.
   */
  forEach(t) {
    for (let s = 0; s < this.length; s++)
      t(this.data[s]);
  }
  /**
   * Sorts the full sets of data.
   * @param compareFn defines the comparison function to apply.
   */
  sort(t) {
    this.data.sort(t);
  }
  /**
   * Resets the active data to an empty array.
   */
  reset() {
    this.length = 0;
  }
  /**
   * Releases all the data from the array as well as the array.
   */
  dispose() {
    this.reset(), this.data && (this.data.length = 0);
  }
  /**
   * Concats the active data with a given array.
   * @param array defines the data to concatenate with.
   */
  concat(t) {
    if (t.length !== 0) {
      this.length + t.length > this.data.length && (this.data.length = (this.length + t.length) * 2);
      for (let s = 0; s < t.length; s++)
        this.data[this.length++] = (t.data || t)[s];
    }
  }
  /**
   * Returns the position of a value in the active data.
   * @param value defines the value to find the index for
   * @returns the index if found in the active data otherwise -1
   */
  indexOf(t) {
    const s = this.data.indexOf(t);
    return s >= this.length ? -1 : s;
  }
  /**
   * Returns whether an element is part of the active data.
   * @param value defines the value to look for
   * @returns true if found in the active data otherwise false
   */
  contains(t) {
    return this.indexOf(t) !== -1;
  }
}
h._GlobalId = 0;
class n extends h {
  constructor() {
    super(...arguments), this._duplicateId = 0;
  }
  /**
   * Pushes a value at the end of the active data.
   * THIS DOES NOT PREVENT DUPPLICATE DATA
   * @param value defines the object to push in the array.
   */
  push(t) {
    super.push(t), t.__smartArrayFlags || (t.__smartArrayFlags = {}), t.__smartArrayFlags[this._id] = this._duplicateId;
  }
  /**
   * Pushes a value at the end of the active data.
   * If the data is already present, it won t be added again
   * @param value defines the object to push in the array.
   * @returns true if added false if it was already present
   */
  pushNoDuplicate(t) {
    return t.__smartArrayFlags && t.__smartArrayFlags[this._id] === this._duplicateId ? !1 : (this.push(t), !0);
  }
  /**
   * Resets the active data to an empty array.
   */
  reset() {
    super.reset(), this._duplicateId++;
  }
  /**
   * Concats the active data with a given array.
   * This ensures no duplicate will be present in the result.
   * @param array defines the data to concatenate with.
   */
  concatWithNoDuplicate(t) {
    if (t.length !== 0) {
      this.length + t.length > this.data.length && (this.data.length = (this.length + t.length) * 2);
      for (let s = 0; s < t.length; s++) {
        const i = (t.data || t)[s];
        this.pushNoDuplicate(i);
      }
    }
  }
}
export {
  h as S,
  n as a
};
//# sourceMappingURL=smartArray-BXymNR-c.js.map
