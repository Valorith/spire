import { P as s } from "./postProcess-CzjDSNvf.js";
import { E } from "./engine-BUHA6kNQ.js";
import "./renderTargetTexture-BcDR5pJ7.js";
import { x as m, R as S } from "./embed-entry-BgvWRWVI.js";
import { S as c } from "./decorators.serialization-C2D-FLnh.js";
const g = "passCubePixelShader", I = `varying vec2 vUV;uniform samplerCube textureSampler;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{vec2 uv=vUV*2.0-1.0;
#ifdef POSITIVEX
gl_FragColor=textureCube(textureSampler,vec3(1.001,uv.y,uv.x));
#endif
#ifdef NEGATIVEX
gl_FragColor=textureCube(textureSampler,vec3(-1.001,uv.y,uv.x));
#endif
#ifdef POSITIVEY
gl_FragColor=textureCube(textureSampler,vec3(uv.y,1.001,uv.x));
#endif
#ifdef NEGATIVEY
gl_FragColor=textureCube(textureSampler,vec3(uv.y,-1.001,uv.x));
#endif
#ifdef POSITIVEZ
gl_FragColor=textureCube(textureSampler,vec3(uv,1.001));
#endif
#ifdef NEGATIVEZ
gl_FragColor=textureCube(textureSampler,vec3(uv,-1.001));
#endif
}`;
m.ShadersStore[g] = I;
class n extends s {
  /**
   * Gets a string identifying the name of the class
   * @returns "PassPostProcess" string
   */
  getClassName() {
    return "PassPostProcess";
  }
  /**
   * Creates the PassPostProcess
   * @param name The name of the effect.
   * @param options The required width/height ratio to downsize to before computing the render pass.
   * @param camera The camera to apply the render pass to.
   * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
   * @param engine The engine which the post process will be applied. (default: current engine)
   * @param reusable If the post process can be reused on the same frame. (default: false)
   * @param textureType The type of texture to be used when performing the post processing.
   * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
   */
  constructor(e, t, r = null, a, u, i, f = 0, l = !1) {
    super(e, "pass", null, null, t, r, a, u, i, void 0, f, void 0, null, l);
  }
  /**
   * @internal
   */
  static _Parse(e, t, r, a) {
    return c.Parse(() => new n(e.name, e.options, t, e.renderTargetSamplingMode, e._engine, e.reusable), e, r, a);
  }
}
S("BABYLON.PassPostProcess", n);
class d extends s {
  /**
   * Gets or sets the cube face to display.
   *  * 0 is +X
   *  * 1 is -X
   *  * 2 is +Y
   *  * 3 is -Y
   *  * 4 is +Z
   *  * 5 is -Z
   */
  get face() {
    return this._face;
  }
  set face(e) {
    if (!(e < 0 || e > 5))
      switch (this._face = e, this._face) {
        case 0:
          this.updateEffect("#define POSITIVEX");
          break;
        case 1:
          this.updateEffect("#define NEGATIVEX");
          break;
        case 2:
          this.updateEffect("#define POSITIVEY");
          break;
        case 3:
          this.updateEffect("#define NEGATIVEY");
          break;
        case 4:
          this.updateEffect("#define POSITIVEZ");
          break;
        case 5:
          this.updateEffect("#define NEGATIVEZ");
          break;
      }
  }
  /**
   * Gets a string identifying the name of the class
   * @returns "PassCubePostProcess" string
   */
  getClassName() {
    return "PassCubePostProcess";
  }
  /**
   * Creates the PassCubePostProcess
   * @param name The name of the effect.
   * @param options The required width/height ratio to downsize to before computing the render pass.
   * @param camera The camera to apply the render pass to.
   * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
   * @param engine The engine which the post process will be applied. (default: current engine)
   * @param reusable If the post process can be reused on the same frame. (default: false)
   * @param textureType The type of texture to be used when performing the post processing.
   * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
   */
  constructor(e, t, r = null, a, u, i, f = 0, l = !1) {
    super(e, "passCube", null, null, t, r, a, u, i, "#define POSITIVEX", f, void 0, null, l), this._face = 0;
  }
  /**
   * @internal
   */
  static _Parse(e, t, r, a) {
    return c.Parse(() => new d(e.name, e.options, t, e.renderTargetSamplingMode, e._engine, e.reusable), e, r, a);
  }
}
E._RescalePostProcessFactory = (o) => new n("rescale", 1, null, 2, o, !1, 0);
export {
  n as P,
  d as a
};
//# sourceMappingURL=passPostProcess-C-zZWrR8.js.map
