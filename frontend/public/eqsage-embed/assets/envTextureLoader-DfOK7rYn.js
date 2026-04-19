import { G as l, U as t, a as r } from "./environmentTextureTools-CgTRikwr.js";
import { E as d } from "./engine-CDU55b-Q.js";
class p {
  constructor() {
    this.supportCascades = !1;
  }
  /**
   * This returns if the loader support the current file information.
   * @param extension defines the file extension of the file being loaded
   * @returns true if the loader can load the specified file
   */
  canLoad(n) {
    return n.endsWith(".env");
  }
  /**
   * Uploads the cube texture data to the WebGL texture. It has already been bound.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param createPolynomials will be true if polynomials have been requested
   * @param onLoad defines the callback to trigger once the texture is ready
   * @param onError defines the callback to trigger in case of error
   */
  loadCubeData(n, e, v, i, s) {
    if (Array.isArray(n))
      return;
    const a = l(n);
    if (a) {
      e.width = a.width, e.height = a.width;
      try {
        t(e, a), r(e, n, a).then(() => {
          e.isReady = !0, e.onLoadedObservable.notifyObservers(e), e.onLoadedObservable.clear(), i && i();
        }, (o) => {
          s?.("Can not upload environment levels", o);
        });
      } catch (o) {
        s?.("Can not upload environment file", o);
      }
    } else s && s("Can not parse the environment file", null);
  }
  /**
   * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
   */
  loadData() {
    throw ".env not supported in 2d.";
  }
}
d._TextureLoaders.push(new p());
export {
  p as _ENVTextureLoader
};
//# sourceMappingURL=envTextureLoader-DfOK7rYn.js.map
