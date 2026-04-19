class I {
  /**
   * Sort function to order lights for rendering.
   * @param a First Light object to compare to second.
   * @param b Second Light object to compare first.
   * @returns -1 to reduce's a's index relative to be, 0 for no change, 1 to increase a's index relative to b.
   */
  static CompareLightsPriority(T, L) {
    return T.shadowEnabled !== L.shadowEnabled ? (L.shadowEnabled ? 1 : 0) - (T.shadowEnabled ? 1 : 0) : L.renderPriority - T.renderPriority;
  }
}
I.FALLOFF_DEFAULT = 0;
I.FALLOFF_PHYSICAL = 1;
I.FALLOFF_GLTF = 2;
I.FALLOFF_STANDARD = 3;
I.LIGHTMAP_DEFAULT = 0;
I.LIGHTMAP_SPECULAR = 1;
I.LIGHTMAP_SHADOWSONLY = 2;
I.INTENSITYMODE_AUTOMATIC = 0;
I.INTENSITYMODE_LUMINOUSPOWER = 1;
I.INTENSITYMODE_LUMINOUSINTENSITY = 2;
I.INTENSITYMODE_ILLUMINANCE = 3;
I.INTENSITYMODE_LUMINANCE = 4;
I.LIGHTTYPEID_POINTLIGHT = 0;
I.LIGHTTYPEID_DIRECTIONALLIGHT = 1;
I.LIGHTTYPEID_SPOTLIGHT = 2;
I.LIGHTTYPEID_HEMISPHERICLIGHT = 3;
export {
  I as L
};
//# sourceMappingURL=lightConstants-BXeaZQS1.js.map
