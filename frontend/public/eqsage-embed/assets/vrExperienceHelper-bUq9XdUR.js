import { T as w, Q as v, O as T, a as A, M as y, x as j, g as L, a0 as J, a1 as $, i as R, L as O, P as fe, a7 as de, h as V, C as ge } from "./embed-entry-BgvWRWVI.js";
import { F as pe, a as k } from "./freeCamera-BbW2WQtJ.js";
import { C as ve, T as be } from "./cameraInputsManager-DFS6Uyrg.js";
import { N as ee } from "./node-DnA4WCA2.js";
import { A as Ce } from "./math.axis-Jb8Sl68r.js";
import { C as F } from "./camera-Dl5MzTd7.js";
import { T as te } from "./texture-CF8YkJua.js";
import { P as ie } from "./postProcess-CzjDSNvf.js";
import { E as z } from "./engine-BUHA6kNQ.js";
import { a as C, I as Te } from "./scene-BUYFxCaC.js";
import { U as ye } from "./uniformBuffer-y9hUmZfi.js";
import { R as ne } from "./renderTargetTexture-BcDR5pJ7.js";
import { F as Re } from "./math.frustum-gapWnW7Y.js";
import { V as U } from "./math.viewport-CrgurBQ6.js";
import { PointerEventTypes as N } from "./pointerEvents-BbNEJSOj.js";
import { G as H, X as q } from "./universalCamera-DSXSUV6W.js";
import { R as X } from "./ray-oakCIP-z.js";
import { StandardMaterial as se } from "./standardMaterial-DtnAO-Mw.js";
import { DynamicTexture as Ae } from "./dynamicTexture-Bqall2pe.js";
import { C as we, E as Q, S as xe } from "./arcRotateCamera-DAFc5JFt.js";
import { A as m, _ as Oe, a as Se, b as Ee, c as Pe, d as Ve, e as Fe } from "./animation-BgJaKPHn.js";
import { B as Me } from "./bone-BHzaM7jv.js";
import { c as Ie } from "./groundBuilder-BrBTF9BC.js";
import { C as ae } from "./torusBuilder-Ds2GzH3M.js";
pe.prototype.addDeviceOrientation = function(n) {
  return this._deviceOrientationInput || (this._deviceOrientationInput = new re(), n && (this._deviceOrientationInput.smoothFactor = n), this.add(this._deviceOrientationInput)), this;
};
class re {
  /**
   * Can be used to detect if a device orientation sensor is available on a device
   * @param timeout amount of time in milliseconds to wait for a response from the sensor (default: infinite)
   * @returns a promise that will resolve on orientation change
   */
  static WaitForOrientationChangeAsync(e) {
    return new Promise((t, i) => {
      let s = !1;
      const a = () => {
        window.removeEventListener("deviceorientation", a), s = !0, t();
      };
      e && setTimeout(() => {
        s || (window.removeEventListener("deviceorientation", a), i("WaitForOrientationChangeAsync timed out"));
      }, e), typeof DeviceOrientationEvent < "u" && typeof DeviceOrientationEvent.requestPermission == "function" ? DeviceOrientationEvent.requestPermission().then((r) => {
        r == "granted" ? window.addEventListener("deviceorientation", a) : w.Warn("Permission not granted.");
      }).catch((r) => {
        w.Error(r);
      }) : window.addEventListener("deviceorientation", a);
    });
  }
  /**
   * Instantiates a new input
   * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
   */
  constructor() {
    this._screenOrientationAngle = 0, this._screenQuaternion = new v(), this._alpha = 0, this._beta = 0, this._gamma = 0, this.smoothFactor = 0, this._onDeviceOrientationChangedObservable = new T(), this._orientationChanged = () => {
      this._screenOrientationAngle = window.orientation !== void 0 ? +window.orientation : window.screen.orientation && window.screen.orientation.angle ? window.screen.orientation.angle : 0, this._screenOrientationAngle = -w.ToRadians(this._screenOrientationAngle / 2), this._screenQuaternion.copyFromFloats(0, Math.sin(this._screenOrientationAngle), 0, Math.cos(this._screenOrientationAngle));
    }, this._deviceOrientation = (e) => {
      this.smoothFactor ? (this._alpha = e.alpha !== null ? w.SmoothAngleChange(this._alpha, e.alpha, this.smoothFactor) : 0, this._beta = e.beta !== null ? w.SmoothAngleChange(this._beta, e.beta, this.smoothFactor) : 0, this._gamma = e.gamma !== null ? w.SmoothAngleChange(this._gamma, e.gamma, this.smoothFactor) : 0) : (this._alpha = e.alpha !== null ? e.alpha : 0, this._beta = e.beta !== null ? e.beta : 0, this._gamma = e.gamma !== null ? e.gamma : 0), e.alpha !== null && this._onDeviceOrientationChangedObservable.notifyObservers();
    }, this._constantTranform = new v(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), this._orientationChanged();
  }
  /**
   * Define the camera controlled by the input.
   */
  get camera() {
    return this._camera;
  }
  set camera(e) {
    this._camera = e, this._camera != null && !this._camera.rotationQuaternion && (this._camera.rotationQuaternion = new v()), this._camera && this._camera.onDisposeObservable.add(() => {
      this._onDeviceOrientationChangedObservable.clear();
    });
  }
  /**
   * Attach the input controls to a specific dom element to get the input from.
   */
  attachControl() {
    const e = this.camera.getScene().getEngine().getHostWindow();
    if (e) {
      const t = () => {
        e.addEventListener("orientationchange", this._orientationChanged), e.addEventListener("deviceorientation", this._deviceOrientation), this._orientationChanged();
      };
      typeof DeviceOrientationEvent < "u" && typeof DeviceOrientationEvent.requestPermission == "function" ? DeviceOrientationEvent.requestPermission().then((i) => {
        i === "granted" ? t() : w.Warn("Permission not granted.");
      }).catch((i) => {
        w.Error(i);
      }) : t();
    }
  }
  /**
   * Detach the current controls from the specified dom element.
   */
  detachControl() {
    window.removeEventListener("orientationchange", this._orientationChanged), window.removeEventListener("deviceorientation", this._deviceOrientation), this._alpha = 0;
  }
  /**
   * Update the current camera state depending on the inputs that have been used this frame.
   * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
   */
  checkInputs() {
    this._alpha && (v.RotationYawPitchRollToRef(w.ToRadians(this._alpha), w.ToRadians(this._beta), -w.ToRadians(this._gamma), this.camera.rotationQuaternion), this._camera.rotationQuaternion.multiplyInPlace(this._screenQuaternion), this._camera.rotationQuaternion.multiplyInPlace(this._constantTranform), this._camera.rotationQuaternion.z *= -1, this._camera.rotationQuaternion.w *= -1);
  }
  /**
   * Gets the class name of the current input.
   * @returns the class name
   */
  getClassName() {
    return "FreeCameraDeviceOrientationInput";
  }
  /**
   * Get the friendly name associated with the input class.
   * @returns the input friendly name
   */
  getSimpleName() {
    return "deviceOrientation";
  }
}
ve.FreeCameraDeviceOrientationInput = re;
ee.AddNodeConstructor("DeviceOrientationCamera", (n, e) => () => new B(n, A.Zero(), e));
class B extends k {
  /**
   * Creates a new device orientation camera
   * @param name The name of the camera
   * @param position The start position camera
   * @param scene The scene the camera belongs to
   */
  constructor(e, t, i) {
    super(e, t, i), this._tmpDragQuaternion = new v(), this._disablePointerInputWhenUsingDeviceOrientation = !0, this._dragFactor = 0, this._quaternionCache = new v(), this.inputs.addDeviceOrientation(), this.inputs._deviceOrientationInput && this.inputs._deviceOrientationInput._onDeviceOrientationChangedObservable.addOnce(() => {
      this._disablePointerInputWhenUsingDeviceOrientation && this.inputs._mouseInput && (this.inputs._mouseInput._allowCameraRotation = !1, this.inputs._mouseInput.onPointerMovedObservable.add((s) => {
        this._dragFactor != 0 && (this._initialQuaternion || (this._initialQuaternion = new v()), v.FromEulerAnglesToRef(0, s.offsetX * this._dragFactor, 0, this._tmpDragQuaternion), this._initialQuaternion.multiplyToRef(this._tmpDragQuaternion, this._initialQuaternion));
      }));
    });
  }
  /**
   * Gets or sets a boolean indicating that pointer input must be disabled on first orientation sensor update (Default: true)
   */
  get disablePointerInputWhenUsingDeviceOrientation() {
    return this._disablePointerInputWhenUsingDeviceOrientation;
  }
  set disablePointerInputWhenUsingDeviceOrientation(e) {
    this._disablePointerInputWhenUsingDeviceOrientation = e;
  }
  /**
   * Enabled turning on the y axis when the orientation sensor is active
   * @param dragFactor the factor that controls the turn speed (default: 1/300)
   */
  enableHorizontalDragging(e = 1 / 300) {
    this._dragFactor = e;
  }
  /**
   * Gets the current instance class name ("DeviceOrientationCamera").
   * This helps avoiding instanceof at run time.
   * @returns the class name
   */
  getClassName() {
    return "DeviceOrientationCamera";
  }
  /**
   * @internal
   * Checks and applies the current values of the inputs to the camera. (Internal use only)
   */
  _checkInputs() {
    super._checkInputs(), this._quaternionCache.copyFrom(this.rotationQuaternion), this._initialQuaternion && this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
  }
  /**
   * Reset the camera to its default orientation on the specified axis only.
   * @param axis The axis to reset
   */
  resetToCurrentRotation(e = Ce.Y) {
    this.rotationQuaternion && (this._initialQuaternion || (this._initialQuaternion = new v()), this._initialQuaternion.copyFrom(this._quaternionCache || this.rotationQuaternion), ["x", "y", "z"].forEach((t) => {
      e[t] ? this._initialQuaternion[t] *= -1 : this._initialQuaternion[t] = 0;
    }), this._initialQuaternion.normalize(), this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion));
  }
}
class M {
  constructor() {
    this.compensateDistortion = !0, this.multiviewEnabled = !1;
  }
  /**
   * Gets the rendering aspect ratio based on the provided resolutions.
   */
  get aspectRatio() {
    return this.hResolution / (2 * this.vResolution);
  }
  /**
   * Gets the aspect ratio based on the FOV, scale factors, and real screen sizes.
   */
  get aspectRatioFov() {
    return 2 * Math.atan(this.postProcessScaleFactor * this.vScreenSize / (2 * this.eyeToScreenDistance));
  }
  /**
   * @internal
   */
  get leftHMatrix() {
    const t = 4 * (this.hScreenSize / 4 - this.lensSeparationDistance / 2) / this.hScreenSize;
    return y.Translation(t, 0, 0);
  }
  /**
   * @internal
   */
  get rightHMatrix() {
    const t = 4 * (this.hScreenSize / 4 - this.lensSeparationDistance / 2) / this.hScreenSize;
    return y.Translation(-t, 0, 0);
  }
  /**
   * @internal
   */
  get leftPreViewMatrix() {
    return y.Translation(0.5 * this.interpupillaryDistance, 0, 0);
  }
  /**
   * @internal
   */
  get rightPreViewMatrix() {
    return y.Translation(-0.5 * this.interpupillaryDistance, 0, 0);
  }
  /**
   * Get the default VRMetrics based on the most generic setup.
   * @returns the default vr metrics
   */
  static GetDefault() {
    const e = new M();
    return e.hResolution = 1280, e.vResolution = 800, e.hScreenSize = 0.149759993, e.vScreenSize = 0.0935999975, e.vScreenCenter = 0.0467999987, e.eyeToScreenDistance = 0.0410000011, e.lensSeparationDistance = 0.063500002, e.interpupillaryDistance = 0.064000003, e.distortionK = [1, 0.219999999, 0.239999995, 0], e.chromaAbCorrection = [0.995999992, -0.00400000019, 1.01400006, 0], e.postProcessScaleFactor = 1.714605507808412, e.lensCenterOffset = 0.151976421, e;
  }
}
const De = "vrDistortionCorrectionPixelShader", Le = `varying vec2 vUV;uniform sampler2D textureSampler;uniform vec2 LensCenter;uniform vec2 Scale;uniform vec2 ScaleIn;uniform vec4 HmdWarpParam;vec2 HmdWarp(vec2 in01) {vec2 theta=(in01-LensCenter)*ScaleIn; 
float rSq=theta.x*theta.x+theta.y*theta.y;vec2 rvector=theta*(HmdWarpParam.x+HmdWarpParam.y*rSq+HmdWarpParam.z*rSq*rSq+HmdWarpParam.w*rSq*rSq*rSq);return LensCenter+Scale*rvector;}
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{vec2 tc=HmdWarp(vUV);if (tc.x <0.0 || tc.x>1.0 || tc.y<0.0 || tc.y>1.0)
gl_FragColor=vec4(0.0,0.0,0.0,0.0);else{gl_FragColor=texture2D(textureSampler,tc);}}`;
j.ShadersStore[De] = Le;
class Y extends ie {
  /**
   * Gets a string identifying the name of the class
   * @returns "VRDistortionCorrectionPostProcess" string
   */
  getClassName() {
    return "VRDistortionCorrectionPostProcess";
  }
  /**
   * Initializes the VRDistortionCorrectionPostProcess
   * @param name The name of the effect.
   * @param camera The camera to apply the render pass to.
   * @param isRightEye If this is for the right eye distortion
   * @param vrMetrics All the required metrics for the VR camera
   */
  constructor(e, t, i, s) {
    super(e, "vrDistortionCorrection", ["LensCenter", "Scale", "ScaleIn", "HmdWarpParam"], null, s.postProcessScaleFactor, t, te.BILINEAR_SAMPLINGMODE), this._isRightEye = i, this._distortionFactors = s.distortionK, this._postProcessScaleFactor = s.postProcessScaleFactor, this._lensCenterOffset = s.lensCenterOffset, this.adaptScaleToCurrentViewport = !0, this.onSizeChangedObservable.add(() => {
      this._scaleIn = new L(2, 2 / this.aspectRatio), this._scaleFactor = new L(0.5 * (1 / this._postProcessScaleFactor), 0.5 * (1 / this._postProcessScaleFactor) * this.aspectRatio), this._lensCenter = new L(this._isRightEye ? 0.5 - this._lensCenterOffset * 0.5 : 0.5 + this._lensCenterOffset * 0.5, 0.5);
    }), this.onApplyObservable.add((a) => {
      a.setFloat2("LensCenter", this._lensCenter.x, this._lensCenter.y), a.setFloat2("Scale", this._scaleFactor.x, this._scaleFactor.y), a.setFloat2("ScaleIn", this._scaleIn.x, this._scaleIn.y), a.setFloat4("HmdWarpParam", this._distortionFactors[0], this._distortionFactors[1], this._distortionFactors[2], this._distortionFactors[3]);
    });
  }
}
const Ne = "vrMultiviewToSingleviewPixelShader", ke = `precision mediump sampler2DArray;varying vec2 vUV;uniform sampler2DArray multiviewSampler;uniform int imageIndex;
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void)
{gl_FragColor=texture2D(multiviewSampler,vec3(vUV,imageIndex));}`;
j.ShadersStore[Ne] = ke;
class W extends ne {
  set samples(e) {
    this._samples = e;
  }
  get samples() {
    return this._samples;
  }
  /**
   * Creates a multiview render target
   * @param scene scene used with the render target
   * @param size the size of the render target (used for each view)
   */
  constructor(e, t = 512) {
    super("multiview rtt", t, e, !1, !0, 0, !1, void 0, !1, !1, !0, void 0, !0), this._renderTarget = this.getScene().getEngine().createMultiviewRenderTargetTexture(this.getRenderWidth(), this.getRenderHeight()), this._texture = this._renderTarget.texture, this._texture.isMultiview = !0, this._texture.format = 5, this.samples = this._getEngine().getCaps().maxSamples || this.samples, this._texture.samples = this._samples;
  }
  /**
   * @internal
   */
  _bindFrameBuffer() {
    this._renderTarget && this.getScene().getEngine().bindMultiviewFramebuffer(this._renderTarget);
  }
  /**
   * Gets the number of views the corresponding to the texture (eg. a MultiviewRenderTarget will have > 1)
   * @returns the view count
   */
  getViewCount() {
    return 2;
  }
}
z.prototype.createMultiviewRenderTargetTexture = function(n, e, t, i) {
  const s = this._gl;
  if (!this.getCaps().multiview)
    throw "Multiview is not supported";
  const a = this._createHardwareRenderTargetWrapper(!1, !1, { width: n, height: e });
  a._framebuffer = s.createFramebuffer();
  const r = new J(this, $.Unknown, !0);
  return r.width = n, r.height = e, r.isMultiview = !0, t || (t = s.createTexture(), s.bindTexture(s.TEXTURE_2D_ARRAY, t), s.texStorage3D(s.TEXTURE_2D_ARRAY, 1, s.RGBA8, n, e, 2)), a._colorTextureArray = t, i || (i = s.createTexture(), s.bindTexture(s.TEXTURE_2D_ARRAY, i), s.texStorage3D(s.TEXTURE_2D_ARRAY, 1, s.DEPTH24_STENCIL8, n, e, 2)), a._depthStencilTextureArray = i, r.isReady = !0, a.setTextures(r), a._depthStencilTexture = r, a;
};
z.prototype.bindMultiviewFramebuffer = function(n) {
  const e = n, t = this._gl, i = this.getCaps().oculusMultiview || this.getCaps().multiview;
  if (this.bindFramebuffer(e, void 0, void 0, void 0, !0), t.bindFramebuffer(t.DRAW_FRAMEBUFFER, e._framebuffer), e._colorTextureArray && e._depthStencilTextureArray)
    this.getCaps().oculusMultiview ? (i.framebufferTextureMultisampleMultiviewOVR(t.DRAW_FRAMEBUFFER, t.COLOR_ATTACHMENT0, e._colorTextureArray, 0, e.samples, 0, 2), i.framebufferTextureMultisampleMultiviewOVR(t.DRAW_FRAMEBUFFER, t.DEPTH_STENCIL_ATTACHMENT, e._depthStencilTextureArray, 0, e.samples, 0, 2)) : (i.framebufferTextureMultiviewOVR(t.DRAW_FRAMEBUFFER, t.COLOR_ATTACHMENT0, e._colorTextureArray, 0, 0, 2), i.framebufferTextureMultiviewOVR(t.DRAW_FRAMEBUFFER, t.DEPTH_STENCIL_ATTACHMENT, e._depthStencilTextureArray, 0, 0, 2));
  else
    throw "Invalid multiview frame buffer";
};
z.prototype.bindSpaceWarpFramebuffer = function(n) {
  const e = n, t = this._gl, i = this.getCaps().oculusMultiview || this.getCaps().multiview;
  if (this.bindFramebuffer(e, void 0, void 0, void 0, !0), t.bindFramebuffer(t.DRAW_FRAMEBUFFER, e._framebuffer), e._colorTextureArray && e._depthStencilTextureArray)
    i.framebufferTextureMultiviewOVR(t.DRAW_FRAMEBUFFER, t.COLOR_ATTACHMENT0, e._colorTextureArray, 0, 0, 2), i.framebufferTextureMultiviewOVR(t.DRAW_FRAMEBUFFER, t.DEPTH_ATTACHMENT, e._depthStencilTextureArray, 0, 0, 2);
  else
    throw new Error("Invalid Space Warp framebuffer");
};
F.prototype._useMultiviewToSingleView = !1;
F.prototype._multiviewTexture = null;
F.prototype._resizeOrCreateMultiviewTexture = function(n, e) {
  this._multiviewTexture ? (this._multiviewTexture.getRenderWidth() != n || this._multiviewTexture.getRenderHeight() != e) && (this._multiviewTexture.dispose(), this._multiviewTexture = new W(this.getScene(), { width: n, height: e })) : this._multiviewTexture = new W(this.getScene(), { width: n, height: e });
};
function oe(n, e) {
  const t = new ye(n, void 0, !0, e);
  return t.addUniform("viewProjection", 16), t.addUniform("viewProjectionR", 16), t.addUniform("view", 16), t.addUniform("projection", 16), t.addUniform("vEyePosition", 4), t;
}
const We = C.prototype.createSceneUniformBuffer;
C.prototype._transformMatrixR = y.Zero();
C.prototype._multiviewSceneUbo = null;
C.prototype._createMultiviewUbo = function() {
  this._multiviewSceneUbo = oe(this.getEngine(), "scene_multiview");
};
C.prototype.createSceneUniformBuffer = function(n) {
  return this._multiviewSceneUbo ? oe(this.getEngine(), n) : We.bind(this)(n);
};
C.prototype._updateMultiviewUbo = function(n, e) {
  n && e && n.multiplyToRef(e, this._transformMatrixR), n && e && (n.multiplyToRef(e, R.Matrix[0]), Re.GetRightPlaneToRef(R.Matrix[0], this._frustumPlanes[3])), this._multiviewSceneUbo && (this._multiviewSceneUbo.updateMatrix("viewProjection", this.getTransformMatrix()), this._multiviewSceneUbo.updateMatrix("viewProjectionR", this._transformMatrixR), this._multiviewSceneUbo.updateMatrix("view", this._viewMatrix), this._multiviewSceneUbo.updateMatrix("projection", this._projectionMatrix));
};
C.prototype._renderMultiviewToSingleView = function(n) {
  n._resizeOrCreateMultiviewTexture(n._rigPostProcess && n._rigPostProcess && n._rigPostProcess.width > 0 ? n._rigPostProcess.width : this.getEngine().getRenderWidth(!0), n._rigPostProcess && n._rigPostProcess && n._rigPostProcess.height > 0 ? n._rigPostProcess.height : this.getEngine().getRenderHeight(!0)), this._multiviewSceneUbo || this._createMultiviewUbo(), n.outputRenderTarget = n._multiviewTexture, this._renderForCamera(n), n.outputRenderTarget = null;
  for (let e = 0; e < n._rigCameras.length; e++) {
    const t = this.getEngine();
    this._activeCamera = n._rigCameras[e], t.setViewport(this._activeCamera.viewport), this.postProcessManager && (this.postProcessManager._prepareFrame(), this.postProcessManager._finalizeFrame(this._activeCamera.isIntermediate));
  }
};
class ze extends ie {
  /**
   * Gets a string identifying the name of the class
   * @returns "VRMultiviewToSingleviewPostProcess" string
   */
  getClassName() {
    return "VRMultiviewToSingleviewPostProcess";
  }
  /**
   * Initializes a VRMultiviewToSingleview
   * @param name name of the post process
   * @param camera camera to be applied to
   * @param scaleFactor scaling factor to the size of the output texture
   */
  constructor(e, t, i) {
    super(e, "vrMultiviewToSingleview", ["imageIndex"], ["multiviewSampler"], i, t, te.BILINEAR_SAMPLINGMODE);
    const s = t ?? this.getCamera();
    this.onSizeChangedObservable.add(() => {
    }), this.onApplyObservable.add((a) => {
      s._scene.activeCamera && s._scene.activeCamera.isLeftCamera ? a.setInt("imageIndex", 0) : a.setInt("imageIndex", 1), a.setTexture("multiviewSampler", s._multiviewTexture);
    });
  }
}
function Xe(n, e) {
  const t = e.vrCameraMetrics || M.GetDefault();
  n._rigCameras[0]._cameraRigParams.vrMetrics = t, n._rigCameras[0].viewport = new U(0, 0, 0.5, 1), n._rigCameras[0]._cameraRigParams.vrWorkMatrix = new y(), n._rigCameras[0]._cameraRigParams.vrHMatrix = t.leftHMatrix, n._rigCameras[0]._cameraRigParams.vrPreViewMatrix = t.leftPreViewMatrix, n._rigCameras[0].getProjectionMatrix = n._rigCameras[0]._getVRProjectionMatrix, n._rigCameras[1]._cameraRigParams.vrMetrics = t, n._rigCameras[1].viewport = new U(0.5, 0, 0.5, 1), n._rigCameras[1]._cameraRigParams.vrWorkMatrix = new y(), n._rigCameras[1]._cameraRigParams.vrHMatrix = t.rightHMatrix, n._rigCameras[1]._cameraRigParams.vrPreViewMatrix = t.rightPreViewMatrix, n._rigCameras[1].getProjectionMatrix = n._rigCameras[1]._getVRProjectionMatrix, t.multiviewEnabled && (n.getScene().getEngine().getCaps().multiview ? (n._useMultiviewToSingleView = !0, n._rigPostProcess = new ze("VRMultiviewToSingleview", n, t.postProcessScaleFactor)) : (O.Warn("Multiview is not supported, falling back to standard rendering"), t.multiviewEnabled = !1)), t.compensateDistortion && (n._rigCameras[0]._rigPostProcess = new Y("VR_Distort_Compensation_Left", n._rigCameras[0], !1, t), n._rigCameras[1]._rigPostProcess = new Y("VR_Distort_Compensation_Right", n._rigCameras[1], !0, t));
}
ee.AddNodeConstructor("VRDeviceOrientationFreeCamera", (n, e) => () => new he(n, A.Zero(), e));
class he extends B {
  /**
   * Creates a new VRDeviceOrientationFreeCamera
   * @param name defines camera name
   * @param position defines the start position of the camera
   * @param scene defines the scene the camera belongs to
   * @param compensateDistortion defines if the camera needs to compensate the lens distortion
   * @param vrCameraMetrics defines the vr metrics associated to the camera
   */
  constructor(e, t, i, s = !0, a = M.GetDefault()) {
    super(e, t, i), this._setRigMode = (r) => Xe(this, r), a.compensateDistortion = s, this.setCameraRigMode(F.RIG_MODE_VR, { vrCameraMetrics: a });
  }
  /**
   * Gets camera class name
   * @returns VRDeviceOrientationFreeCamera
   */
  getClassName() {
    return "VRDeviceOrientationFreeCamera";
  }
}
class Be {
  /**
   * Gets the current frame of the runtime animation
   */
  get currentFrame() {
    return this._currentFrame;
  }
  /**
   * Gets the weight of the runtime animation
   */
  get weight() {
    return this._weight;
  }
  /**
   * Gets the current value of the runtime animation
   */
  get currentValue() {
    return this._currentValue;
  }
  /**
   * Gets or sets the target path of the runtime animation
   */
  get targetPath() {
    return this._targetPath;
  }
  /**
   * Gets the actual target of the runtime animation
   */
  get target() {
    return this._currentActiveTarget;
  }
  /**
   * Gets the additive state of the runtime animation
   */
  get isAdditive() {
    return this._host && this._host.isAdditive;
  }
  /**
   * Create a new RuntimeAnimation object
   * @param target defines the target of the animation
   * @param animation defines the source animation object
   * @param scene defines the hosting scene
   * @param host defines the initiating Animatable
   */
  constructor(e, t, i, s) {
    if (this._events = new Array(), this._currentFrame = 0, this._originalValue = new Array(), this._originalBlendValue = null, this._offsetsCache = {}, this._highLimitsCache = {}, this._stopped = !1, this._blendingFactor = 0, this._currentValue = null, this._currentActiveTarget = null, this._directTarget = null, this._targetPath = "", this._weight = 1, this._absoluteFrameOffset = 0, this._previousElapsedTime = 0, this._previousAbsoluteFrame = 0, this._targetIsArray = !1, this._animation = t, this._target = e, this._scene = i, this._host = s, this._activeTargets = [], t._runtimeAnimations.push(this), this._animationState = {
      key: 0,
      repeatCount: 0,
      loopMode: this._getCorrectLoopMode()
    }, this._animation.dataType === m.ANIMATIONTYPE_MATRIX && (this._animationState.workValue = y.Zero()), this._keys = this._animation.getKeys(), this._minFrame = this._keys[0].frame, this._maxFrame = this._keys[this._keys.length - 1].frame, this._minValue = this._keys[0].value, this._maxValue = this._keys[this._keys.length - 1].value, this._minFrame !== 0) {
      const r = { frame: 0, value: this._minValue };
      this._keys.splice(0, 0, r);
    }
    if (this._target instanceof Array) {
      let r = 0;
      for (const o of this._target)
        this._preparePath(o, r), this._getOriginalValues(r), r++;
      this._targetIsArray = !0;
    } else
      this._preparePath(this._target), this._getOriginalValues(), this._targetIsArray = !1, this._directTarget = this._activeTargets[0];
    const a = t.getEvents();
    a && a.length > 0 && a.forEach((r) => {
      this._events.push(r._clone());
    }), this._enableBlending = e && e.animationPropertiesOverride ? e.animationPropertiesOverride.enableBlending : this._animation.enableBlending;
  }
  _preparePath(e, t = 0) {
    const i = this._animation.targetPropertyPath;
    if (i.length > 1) {
      let s = e;
      for (let a = 0; a < i.length - 1; a++) {
        const r = i[a];
        if (s = s[r], s === void 0)
          throw new Error(`Invalid property (${r}) in property path (${i.join(".")})`);
      }
      this._targetPath = i[i.length - 1], this._activeTargets[t] = s;
    } else
      this._targetPath = i[0], this._activeTargets[t] = e;
    if (this._activeTargets[t][this._targetPath] === void 0)
      throw new Error(`Invalid property (${this._targetPath}) in property path (${i.join(".")})`);
  }
  /**
   * Gets the animation from the runtime animation
   */
  get animation() {
    return this._animation;
  }
  /**
   * Resets the runtime animation to the beginning
   * @param restoreOriginal defines whether to restore the target property to the original value
   */
  reset(e = !1) {
    if (e)
      if (this._target instanceof Array) {
        let t = 0;
        for (const i of this._target)
          this._originalValue[t] !== void 0 && this._setValue(i, this._activeTargets[t], this._originalValue[t], -1, t), t++;
      } else
        this._originalValue[0] !== void 0 && this._setValue(this._target, this._directTarget, this._originalValue[0], -1, 0);
    this._offsetsCache = {}, this._highLimitsCache = {}, this._currentFrame = 0, this._blendingFactor = 0;
    for (let t = 0; t < this._events.length; t++)
      this._events[t].isDone = !1;
  }
  /**
   * Specifies if the runtime animation is stopped
   * @returns Boolean specifying if the runtime animation is stopped
   */
  isStopped() {
    return this._stopped;
  }
  /**
   * Disposes of the runtime animation
   */
  dispose() {
    const e = this._animation.runtimeAnimations.indexOf(this);
    e > -1 && this._animation.runtimeAnimations.splice(e, 1);
  }
  /**
   * Apply the interpolated value to the target
   * @param currentValue defines the value computed by the animation
   * @param weight defines the weight to apply to this value (Defaults to 1.0)
   */
  setValue(e, t) {
    if (this._targetIsArray) {
      for (let i = 0; i < this._target.length; i++) {
        const s = this._target[i];
        this._setValue(s, this._activeTargets[i], e, t, i);
      }
      return;
    }
    this._setValue(this._target, this._directTarget, e, t, 0);
  }
  _getOriginalValues(e = 0) {
    let t;
    const i = this._activeTargets[e];
    i.getLocalMatrix && this._targetPath === "_matrix" ? t = i.getLocalMatrix() : t = i[this._targetPath], t && t.clone ? this._originalValue[e] = t.clone() : this._originalValue[e] = t;
  }
  _setValue(e, t, i, s, a) {
    if (this._currentActiveTarget = t, this._weight = s, this._enableBlending && this._blendingFactor <= 1) {
      if (!this._originalBlendValue) {
        const o = t[this._targetPath];
        o.clone ? this._originalBlendValue = o.clone() : this._originalBlendValue = o;
      }
      this._originalBlendValue.m ? m.AllowMatrixDecomposeForInterpolation ? this._currentValue ? y.DecomposeLerpToRef(this._originalBlendValue, i, this._blendingFactor, this._currentValue) : this._currentValue = y.DecomposeLerp(this._originalBlendValue, i, this._blendingFactor) : this._currentValue ? y.LerpToRef(this._originalBlendValue, i, this._blendingFactor, this._currentValue) : this._currentValue = y.Lerp(this._originalBlendValue, i, this._blendingFactor) : this._currentValue = m._UniversalLerp(this._originalBlendValue, i, this._blendingFactor);
      const r = e && e.animationPropertiesOverride ? e.animationPropertiesOverride.blendingSpeed : this._animation.blendingSpeed;
      this._blendingFactor += r;
    } else
      this._currentValue ? this._currentValue.copyFrom ? this._currentValue.copyFrom(i) : this._currentValue = i : i?.clone ? this._currentValue = i.clone() : this._currentValue = i;
    s !== -1 ? this._scene._registerTargetForLateAnimationBinding(this, this._originalValue[a]) : this._animationState.loopMode === m.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT ? this._currentValue.addToRef ? this._currentValue.addToRef(this._originalValue[a], t[this._targetPath]) : t[this._targetPath] = this._originalValue[a] + this._currentValue : t[this._targetPath] = this._currentValue, e.markAsDirty && e.markAsDirty(this._animation.targetProperty);
  }
  /**
   * Gets the loop pmode of the runtime animation
   * @returns Loop Mode
   */
  _getCorrectLoopMode() {
    return this._target && this._target.animationPropertiesOverride ? this._target.animationPropertiesOverride.loopMode : this._animation.loopMode;
  }
  /**
   * Move the current animation to a given frame
   * @param frame defines the frame to move to
   */
  goToFrame(e) {
    const t = this._animation.getKeys();
    e < t[0].frame ? e = t[0].frame : e > t[t.length - 1].frame && (e = t[t.length - 1].frame);
    const i = this._events;
    if (i.length)
      for (let a = 0; a < i.length; a++)
        i[a].onlyOnce || (i[a].isDone = i[a].frame < e);
    this._currentFrame = e;
    const s = this._animation._interpolate(e, this._animationState);
    this.setValue(s, -1);
  }
  /**
   * @internal Internal use only
   */
  _prepareForSpeedRatioChange(e) {
    const t = this._previousElapsedTime * (this._animation.framePerSecond * e) / 1e3;
    this._absoluteFrameOffset = this._previousAbsoluteFrame - t;
  }
  /**
   * Execute the current animation
   * @param elapsedTimeSinceAnimationStart defines the elapsed time (in milliseconds) since the animation was started
   * @param from defines the lower frame of the animation range
   * @param to defines the upper frame of the animation range
   * @param loop defines if the current animation must loop
   * @param speedRatio defines the current speed ratio
   * @param weight defines the weight of the animation (default is -1 so no weight)
   * @returns a boolean indicating if the animation is running
   */
  animate(e, t, i, s, a, r = -1) {
    const o = this._animation, l = o.targetPropertyPath;
    if (!l || l.length < 1)
      return this._stopped = !0, !1;
    let h = !0;
    (t < this._minFrame || t > this._maxFrame) && (t = this._minFrame), (i < this._minFrame || i > this._maxFrame) && (i = this._maxFrame);
    const c = i - t;
    let u, _ = e * (o.framePerSecond * a) / 1e3 + this._absoluteFrameOffset, d = 0;
    if (s && this._animationState.loopMode === m.ANIMATIONLOOPMODE_YOYO) {
      const f = (_ - t) / c;
      _ = Math.abs(Math.sin(f * Math.PI)) * c + t;
    }
    if (this._previousElapsedTime = e, this._previousAbsoluteFrame = _, !s && i >= t && (_ >= c && a > 0 || _ <= 0 && a < 0))
      h = !1, d = o._getKeyValue(this._maxValue);
    else if (!s && t >= i && (_ <= c && a < 0 || _ >= 0 && a > 0))
      h = !1, d = o._getKeyValue(this._minValue);
    else if (this._animationState.loopMode !== m.ANIMATIONLOOPMODE_CYCLE) {
      const f = i.toString() + t.toString();
      if (!this._offsetsCache[f]) {
        this._animationState.repeatCount = 0, this._animationState.loopMode = m.ANIMATIONLOOPMODE_CYCLE;
        const p = o._interpolate(t, this._animationState), x = o._interpolate(i, this._animationState);
        switch (this._animationState.loopMode = this._getCorrectLoopMode(), o.dataType) {
          case m.ANIMATIONTYPE_FLOAT:
            this._offsetsCache[f] = x - p;
            break;
          case m.ANIMATIONTYPE_QUATERNION:
            this._offsetsCache[f] = x.subtract(p);
            break;
          case m.ANIMATIONTYPE_VECTOR3:
            this._offsetsCache[f] = x.subtract(p);
            break;
          case m.ANIMATIONTYPE_VECTOR2:
            this._offsetsCache[f] = x.subtract(p);
            break;
          case m.ANIMATIONTYPE_SIZE:
            this._offsetsCache[f] = x.subtract(p);
            break;
          case m.ANIMATIONTYPE_COLOR3:
            this._offsetsCache[f] = x.subtract(p);
            break;
        }
        this._highLimitsCache[f] = x;
      }
      d = this._highLimitsCache[f], u = this._offsetsCache[f];
    }
    if (u === void 0)
      switch (o.dataType) {
        case m.ANIMATIONTYPE_FLOAT:
          u = 0;
          break;
        case m.ANIMATIONTYPE_QUATERNION:
          u = Fe;
          break;
        case m.ANIMATIONTYPE_VECTOR3:
          u = Ve;
          break;
        case m.ANIMATIONTYPE_VECTOR2:
          u = Pe;
          break;
        case m.ANIMATIONTYPE_SIZE:
          u = Ee;
          break;
        case m.ANIMATIONTYPE_COLOR3:
          u = Se;
          break;
        case m.ANIMATIONTYPE_COLOR4:
          u = Oe;
          break;
      }
    let g;
    if (this._host && this._host.syncRoot) {
      const f = this._host.syncRoot, p = (f.masterFrame - f.fromFrame) / (f.toFrame - f.fromFrame);
      g = t + c * p;
    } else
      _ > 0 && t > i || _ < 0 && t < i ? g = h && c !== 0 ? i + _ % c : t : g = h && c !== 0 ? t + _ % c : i;
    const b = this._events;
    if (a > 0 && this.currentFrame > g || a < 0 && this.currentFrame < g) {
      this._onLoop();
      for (let f = 0; f < b.length; f++)
        b[f].onlyOnce || (b[f].isDone = !1);
      this._animationState.key = a > 0 ? 0 : o.getKeys().length - 1;
    }
    this._currentFrame = g, this._animationState.repeatCount = c === 0 ? 0 : _ / c >> 0, this._animationState.highLimitValue = d, this._animationState.offsetValue = u;
    const S = o._interpolate(g, this._animationState);
    if (this.setValue(S, r), b.length) {
      for (let f = 0; f < b.length; f++)
        if (c >= 0 && g >= b[f].frame && b[f].frame >= t || c < 0 && g <= b[f].frame && b[f].frame <= t) {
          const p = b[f];
          p.isDone || (p.onlyOnce && (b.splice(f, 1), f--), p.isDone = !0, p.action(g));
        }
    }
    return h || (this._stopped = !0), h;
  }
}
class le {
  /**
   * Gets the root Animatable used to synchronize and normalize animations
   */
  get syncRoot() {
    return this._syncRoot;
  }
  /**
   * Gets the current frame of the first RuntimeAnimation
   * Used to synchronize Animatables
   */
  get masterFrame() {
    return this._runtimeAnimations.length === 0 ? 0 : this._runtimeAnimations[0].currentFrame;
  }
  /**
   * Gets or sets the animatable weight (-1.0 by default meaning not weighted)
   */
  get weight() {
    return this._weight;
  }
  set weight(e) {
    if (e === -1) {
      this._weight = -1;
      return;
    }
    this._weight = Math.min(Math.max(e, 0), 1);
  }
  /**
   * Gets or sets the speed ratio to apply to the animatable (1.0 by default)
   */
  get speedRatio() {
    return this._speedRatio;
  }
  set speedRatio(e) {
    for (let t = 0; t < this._runtimeAnimations.length; t++)
      this._runtimeAnimations[t]._prepareForSpeedRatioChange(e);
    this._speedRatio = e, this._goToFrame !== null && this.goToFrame(this._goToFrame);
  }
  /**
   * Gets the elapsed time since the animatable started in milliseconds
   */
  get elapsedTime() {
    return this._localDelayOffset === null ? 0 : this._scene._animationTime - this._localDelayOffset;
  }
  /**
   * Creates a new Animatable
   * @param scene defines the hosting scene
   * @param target defines the target object
   * @param fromFrame defines the starting frame number (default is 0)
   * @param toFrame defines the ending frame number (default is 100)
   * @param loopAnimation defines if the animation must loop (default is false)
   * @param speedRatio defines the factor to apply to animation speed (default is 1)
   * @param onAnimationEnd defines a callback to call when animation ends if it is not looping
   * @param animations defines a group of animation to add to the new Animatable
   * @param onAnimationLoop defines a callback to call when animation loops
   * @param isAdditive defines whether the animation should be evaluated additively
   * @param playOrder defines the order in which this animatable should be processed in the list of active animatables (default: 0)
   */
  constructor(e, t, i = 0, s = 100, a = !1, r = 1, o, l, h, c = !1, u = 0) {
    this.target = t, this.fromFrame = i, this.toFrame = s, this.loopAnimation = a, this.onAnimationEnd = o, this.onAnimationLoop = h, this.isAdditive = c, this.playOrder = u, this._localDelayOffset = null, this._pausedDelay = null, this._manualJumpDelay = null, this._runtimeAnimations = new Array(), this._paused = !1, this._speedRatio = 1, this._weight = -1, this._syncRoot = null, this._frameToSyncFromJump = null, this._goToFrame = null, this.disposeOnEnd = !0, this.animationStarted = !1, this.onAnimationEndObservable = new T(), this.onAnimationLoopObservable = new T(), this._scene = e, l && this.appendAnimations(t, l), this._speedRatio = r, e._activeAnimatables.push(this);
  }
  // Methods
  /**
   * Synchronize and normalize current Animatable with a source Animatable
   * This is useful when using animation weights and when animations are not of the same length
   * @param root defines the root Animatable to synchronize with (null to stop synchronizing)
   * @returns the current Animatable
   */
  syncWith(e) {
    if (this._syncRoot = e, e) {
      const t = this._scene._activeAnimatables.indexOf(this);
      t > -1 && (this._scene._activeAnimatables.splice(t, 1), this._scene._activeAnimatables.push(this));
    }
    return this;
  }
  /**
   * Gets the list of runtime animations
   * @returns an array of RuntimeAnimation
   */
  getAnimations() {
    return this._runtimeAnimations;
  }
  /**
   * Adds more animations to the current animatable
   * @param target defines the target of the animations
   * @param animations defines the new animations to add
   */
  appendAnimations(e, t) {
    for (let i = 0; i < t.length; i++) {
      const s = t[i], a = new Be(e, s, this._scene, this);
      a._onLoop = () => {
        this.onAnimationLoopObservable.notifyObservers(this), this.onAnimationLoop && this.onAnimationLoop();
      }, this._runtimeAnimations.push(a);
    }
  }
  /**
   * Gets the source animation for a specific property
   * @param property defines the property to look for
   * @returns null or the source animation for the given property
   */
  getAnimationByTargetProperty(e) {
    const t = this._runtimeAnimations;
    for (let i = 0; i < t.length; i++)
      if (t[i].animation.targetProperty === e)
        return t[i].animation;
    return null;
  }
  /**
   * Gets the runtime animation for a specific property
   * @param property defines the property to look for
   * @returns null or the runtime animation for the given property
   */
  getRuntimeAnimationByTargetProperty(e) {
    const t = this._runtimeAnimations;
    for (let i = 0; i < t.length; i++)
      if (t[i].animation.targetProperty === e)
        return t[i];
    return null;
  }
  /**
   * Resets the animatable to its original state
   */
  reset() {
    const e = this._runtimeAnimations;
    for (let t = 0; t < e.length; t++)
      e[t].reset(!0);
    this._localDelayOffset = null, this._pausedDelay = null;
  }
  /**
   * Allows the animatable to blend with current running animations
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#animation-blending
   * @param blendingSpeed defines the blending speed to use
   */
  enableBlending(e) {
    const t = this._runtimeAnimations;
    for (let i = 0; i < t.length; i++)
      t[i].animation.enableBlending = !0, t[i].animation.blendingSpeed = e;
  }
  /**
   * Disable animation blending
   * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#animation-blending
   */
  disableBlending() {
    const e = this._runtimeAnimations;
    for (let t = 0; t < e.length; t++)
      e[t].animation.enableBlending = !1;
  }
  /**
   * Jump directly to a given frame
   * @param frame defines the frame to jump to
   */
  goToFrame(e) {
    const t = this._runtimeAnimations;
    if (t[0]) {
      const i = t[0].animation.framePerSecond;
      this._frameToSyncFromJump = this._frameToSyncFromJump ?? t[0].currentFrame;
      const s = this.speedRatio === 0 ? 0 : (e - this._frameToSyncFromJump) / i * 1e3 / this.speedRatio;
      this._manualJumpDelay = -s;
    }
    for (let i = 0; i < t.length; i++)
      t[i].goToFrame(e);
    this._goToFrame = e;
  }
  /**
   * Returns true if the animations for this animatable are paused
   */
  get paused() {
    return this._paused;
  }
  /**
   * Pause the animation
   */
  pause() {
    this._paused || (this._paused = !0);
  }
  /**
   * Restart the animation
   */
  restart() {
    this._paused = !1;
  }
  _raiseOnAnimationEnd() {
    this.onAnimationEnd && this.onAnimationEnd(), this.onAnimationEndObservable.notifyObservers(this);
  }
  /**
   * Stop and delete the current animation
   * @param animationName defines a string used to only stop some of the runtime animations instead of all
   * @param targetMask a function that determines if the animation should be stopped based on its target (all animations will be stopped if both this and animationName are empty)
   * @param useGlobalSplice if true, the animatables will be removed by the caller of this function (false by default)
   */
  stop(e, t, i = !1) {
    if (e || t) {
      const s = this._scene._activeAnimatables.indexOf(this);
      if (s > -1) {
        const a = this._runtimeAnimations;
        for (let r = a.length - 1; r >= 0; r--) {
          const o = a[r];
          e && o.animation.name != e || t && !t(o.target) || (o.dispose(), a.splice(r, 1));
        }
        a.length == 0 && (i || this._scene._activeAnimatables.splice(s, 1), this._raiseOnAnimationEnd());
      }
    } else {
      const s = this._scene._activeAnimatables.indexOf(this);
      if (s > -1) {
        i || this._scene._activeAnimatables.splice(s, 1);
        const a = this._runtimeAnimations;
        for (let r = 0; r < a.length; r++)
          a[r].dispose();
        this._runtimeAnimations.length = 0, this._raiseOnAnimationEnd();
      }
    }
  }
  /**
   * Wait asynchronously for the animation to end
   * @returns a promise which will be fulfilled when the animation ends
   */
  waitAsync() {
    return new Promise((e) => {
      this.onAnimationEndObservable.add(() => {
        e(this);
      }, void 0, void 0, this, !0);
    });
  }
  /**
   * @internal
   */
  _animate(e) {
    if (this._paused)
      return this.animationStarted = !1, this._pausedDelay === null && (this._pausedDelay = e), !0;
    if (this._localDelayOffset === null ? (this._localDelayOffset = e, this._pausedDelay = null) : this._pausedDelay !== null && (this._localDelayOffset += e - this._pausedDelay, this._pausedDelay = null), this._manualJumpDelay !== null && (this._localDelayOffset += this._manualJumpDelay, this._manualJumpDelay = null, this._frameToSyncFromJump = null), this._goToFrame = null, this._weight === 0)
      return !0;
    let t = !1;
    const i = this._runtimeAnimations;
    let s;
    for (s = 0; s < i.length; s++) {
      const r = i[s].animate(e - this._localDelayOffset, this.fromFrame, this.toFrame, this.loopAnimation, this._speedRatio, this._weight);
      t = t || r;
    }
    if (this.animationStarted = t, !t) {
      if (this.disposeOnEnd)
        for (s = this._scene._activeAnimatables.indexOf(this), this._scene._activeAnimatables.splice(s, 1), s = 0; s < i.length; s++)
          i[s].dispose();
      this._raiseOnAnimationEnd(), this.disposeOnEnd && (this.onAnimationEnd = null, this.onAnimationLoop = null, this.onAnimationLoopObservable.clear(), this.onAnimationEndObservable.clear());
    }
    return t;
  }
}
C.prototype._animate = function(n) {
  if (!this.animationsEnabled)
    return;
  const e = fe.Now;
  if (!this._animationTimeLast) {
    if (this._pendingData.length > 0)
      return;
    this._animationTimeLast = e;
  }
  this.deltaTime = n !== void 0 ? n : this.useConstantAnimationDeltaTime ? 16 : (e - this._animationTimeLast) * this.animationTimeScale, this._animationTimeLast = e;
  const t = this._activeAnimatables;
  if (t.length === 0)
    return;
  this._animationTime += this.deltaTime;
  const i = this._animationTime;
  for (let s = 0; s < t.length; s++) {
    const a = t[s];
    !a._animate(i) && a.disposeOnEnd && s--;
  }
  this._processLateAnimationBindings();
};
C.prototype.sortActiveAnimatables = function() {
  this._activeAnimatables.sort((n, e) => n.playOrder - e.playOrder);
};
C.prototype.beginWeightedAnimation = function(n, e, t, i = 1, s, a = 1, r, o, l, h, c = !1) {
  const u = this.beginAnimation(n, e, t, s, a, r, o, !1, l, h, c);
  return u.weight = i, u;
};
C.prototype.beginAnimation = function(n, e, t, i, s = 1, a, r, o = !0, l, h, c = !1) {
  e > t && s > 0 && (s *= -1), o && this.stopAnimation(n, void 0, l), r || (r = new le(this, n, e, t, i, s, a, void 0, h, c));
  const u = l ? l(n) : !0;
  if (n.animations && u && r.appendAnimations(n, n.animations), n.getAnimatables) {
    const _ = n.getAnimatables();
    for (let d = 0; d < _.length; d++)
      this.beginAnimation(_[d], e, t, i, s, a, r, o, l, h);
  }
  return r.reset(), r;
};
C.prototype.beginHierarchyAnimation = function(n, e, t, i, s, a = 1, r, o, l = !0, h, c, u = !1) {
  const _ = n.getDescendants(e), d = [];
  d.push(this.beginAnimation(n, t, i, s, a, r, o, l, h, void 0, u));
  for (const g of _)
    d.push(this.beginAnimation(g, t, i, s, a, r, o, l, h, void 0, u));
  return d;
};
C.prototype.beginDirectAnimation = function(n, e, t, i, s, a, r, o, l = !1) {
  if (a === void 0 && (a = 1), t > i && a > 0)
    a *= -1;
  else if (i > t && a < 0) {
    const c = i;
    i = t, t = c;
  }
  return new le(this, n, t, i, s, a, r, e, o, l);
};
C.prototype.beginDirectHierarchyAnimation = function(n, e, t, i, s, a, r, o, l, h = !1) {
  const c = n.getDescendants(e), u = [];
  u.push(this.beginDirectAnimation(n, t, i, s, a, r, o, l, h));
  for (const _ of c)
    u.push(this.beginDirectAnimation(_, t, i, s, a, r, o, l, h));
  return u;
};
C.prototype.getAnimatableByTarget = function(n) {
  for (let e = 0; e < this._activeAnimatables.length; e++)
    if (this._activeAnimatables[e].target === n)
      return this._activeAnimatables[e];
  return null;
};
C.prototype.getAllAnimatablesByTarget = function(n) {
  const e = [];
  for (let t = 0; t < this._activeAnimatables.length; t++)
    this._activeAnimatables[t].target === n && e.push(this._activeAnimatables[t]);
  return e;
};
C.prototype.stopAnimation = function(n, e, t) {
  const i = this.getAllAnimatablesByTarget(n);
  for (const s of i)
    s.stop(e, t);
};
C.prototype.stopAllAnimations = function() {
  if (this._activeAnimatables) {
    for (let n = 0; n < this._activeAnimatables.length; n++)
      this._activeAnimatables[n].stop(void 0, void 0, !0);
    this._activeAnimatables.length = 0;
  }
  for (const n of this.animationGroups)
    n.stop();
};
C.prototype._registerTargetForLateAnimationBinding = function(n, e) {
  const t = n.target;
  this._registeredForLateAnimationBindings.pushNoDuplicate(t), t._lateAnimationHolders || (t._lateAnimationHolders = {}), t._lateAnimationHolders[n.targetPath] || (t._lateAnimationHolders[n.targetPath] = {
    totalWeight: 0,
    totalAdditiveWeight: 0,
    animations: [],
    additiveAnimations: [],
    originalValue: e
  }), n.isAdditive ? (t._lateAnimationHolders[n.targetPath].additiveAnimations.push(n), t._lateAnimationHolders[n.targetPath].totalAdditiveWeight += n.weight) : (t._lateAnimationHolders[n.targetPath].animations.push(n), t._lateAnimationHolders[n.targetPath].totalWeight += n.weight);
};
C.prototype._processLateAnimationBindingsForMatrices = function(n) {
  if (n.totalWeight === 0 && n.totalAdditiveWeight === 0)
    return n.originalValue;
  let e = 1;
  const t = R.Vector3[0], i = R.Vector3[1], s = R.Quaternion[0];
  let a = 0;
  const r = n.animations[0], o = n.originalValue;
  let l = 1, h = !1;
  if (n.totalWeight < 1)
    l = 1 - n.totalWeight, o.decompose(i, s, t);
  else {
    if (a = 1, e = n.totalWeight, l = r.weight / e, l == 1)
      if (n.totalAdditiveWeight)
        h = !0;
      else
        return r.currentValue;
    r.currentValue.decompose(i, s, t);
  }
  if (!h) {
    i.scaleInPlace(l), t.scaleInPlace(l), s.scaleInPlace(l);
    for (let u = a; u < n.animations.length; u++) {
      const _ = n.animations[u];
      if (_.weight === 0)
        continue;
      l = _.weight / e;
      const d = R.Vector3[2], g = R.Vector3[3], b = R.Quaternion[1];
      _.currentValue.decompose(g, b, d), g.scaleAndAddToRef(l, i), b.scaleAndAddToRef(v.Dot(s, b) > 0 ? l : -l, s), d.scaleAndAddToRef(l, t);
    }
    s.normalize();
  }
  for (let u = 0; u < n.additiveAnimations.length; u++) {
    const _ = n.additiveAnimations[u];
    if (_.weight === 0)
      continue;
    const d = R.Vector3[2], g = R.Vector3[3], b = R.Quaternion[1];
    _.currentValue.decompose(g, b, d), g.multiplyToRef(i, g), A.LerpToRef(i, g, _.weight, i), s.multiplyToRef(b, b), v.SlerpToRef(s, b, _.weight, s), d.scaleAndAddToRef(_.weight, t);
  }
  const c = r ? r._animationState.workValue : R.Matrix[0].clone();
  return y.ComposeToRef(i, s, t, c), c;
};
C.prototype._processLateAnimationBindingsForQuaternions = function(n, e) {
  if (n.totalWeight === 0 && n.totalAdditiveWeight === 0)
    return e;
  const t = n.animations[0], i = n.originalValue;
  let s = e;
  if (n.totalWeight === 0 && n.totalAdditiveWeight > 0)
    s.copyFrom(i);
  else if (n.animations.length === 1) {
    if (v.SlerpToRef(i, t.currentValue, Math.min(1, n.totalWeight), s), n.totalAdditiveWeight === 0)
      return s;
  } else if (n.animations.length > 1) {
    let a = 1, r, o;
    if (n.totalWeight < 1) {
      const h = 1 - n.totalWeight;
      r = [], o = [], r.push(i), o.push(h);
    } else {
      if (n.animations.length === 2 && (v.SlerpToRef(n.animations[0].currentValue, n.animations[1].currentValue, n.animations[1].weight / n.totalWeight, e), n.totalAdditiveWeight === 0))
        return e;
      r = [], o = [], a = n.totalWeight;
    }
    for (let h = 0; h < n.animations.length; h++) {
      const c = n.animations[h];
      r.push(c.currentValue), o.push(c.weight / a);
    }
    let l = 0;
    for (let h = 0; h < r.length; ) {
      if (!h) {
        v.SlerpToRef(r[h], r[h + 1], o[h + 1] / (o[h] + o[h + 1]), e), s = e, l = o[h] + o[h + 1], h += 2;
        continue;
      }
      l += o[h], v.SlerpToRef(s, r[h], o[h] / l, s), h++;
    }
  }
  for (let a = 0; a < n.additiveAnimations.length; a++) {
    const r = n.additiveAnimations[a];
    r.weight !== 0 && (s.multiplyToRef(r.currentValue, R.Quaternion[0]), v.SlerpToRef(s, R.Quaternion[0], r.weight, s));
  }
  return s;
};
C.prototype._processLateAnimationBindings = function() {
  if (this._registeredForLateAnimationBindings.length) {
    for (let n = 0; n < this._registeredForLateAnimationBindings.length; n++) {
      const e = this._registeredForLateAnimationBindings.data[n];
      for (const t in e._lateAnimationHolders) {
        const i = e._lateAnimationHolders[t], s = i.animations[0], a = i.originalValue;
        if (a == null)
          continue;
        const r = m.AllowMatrixDecomposeForInterpolation && a.m;
        let o = e[t];
        if (r)
          o = this._processLateAnimationBindingsForMatrices(i);
        else if (a.w !== void 0)
          o = this._processLateAnimationBindingsForQuaternions(i, o || v.Identity());
        else {
          let h = 0, c = 1;
          const u = s && s._animationState.loopMode === m.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT;
          if (i.totalWeight < 1)
            u ? o = a.clone ? a.clone() : a : s && a.scale ? o = a.scale(1 - i.totalWeight) : s ? o = a * (1 - i.totalWeight) : a.clone ? o = a.clone() : o = a;
          else if (s) {
            c = i.totalWeight;
            const _ = s.weight / c;
            _ !== 1 ? s.currentValue.scale ? o = s.currentValue.scale(_) : o = s.currentValue * _ : o = s.currentValue, u && (o.addToRef ? o.addToRef(a, o) : o += a), h = 1;
          }
          for (let _ = h; _ < i.animations.length; _++) {
            const d = i.animations[_], g = d.weight / c;
            if (g)
              d.currentValue.scaleAndAddToRef ? d.currentValue.scaleAndAddToRef(g, o) : o += d.currentValue * g;
            else continue;
          }
          for (let _ = 0; _ < i.additiveAnimations.length; _++) {
            const d = i.additiveAnimations[_], g = d.weight;
            if (g)
              d.currentValue.scaleAndAddToRef ? d.currentValue.scaleAndAddToRef(g, o) : o += d.currentValue * g;
            else continue;
          }
        }
        e[t] = o;
      }
      e._lateAnimationHolders = {};
    }
    this._registeredForLateAnimationBindings.reset();
  }
};
Me.prototype.copyAnimationRange = function(n, e, t, i = !1, s = null) {
  this.animations.length === 0 && (this.animations.push(new m(this.name, "_matrix", n.animations[0].framePerSecond, m.ANIMATIONTYPE_MATRIX, 0)), this.animations[0].setKeys([]));
  const a = n.animations[0].getRange(e);
  if (!a)
    return !1;
  const r = a.from, o = a.to, l = n.animations[0].getKeys(), h = n.length, c = n.getParent(), u = this.getParent(), _ = i && c && h && this.length && h !== this.length, d = _ && u && c ? u.length / c.length : 1, g = i && !u && s && (s.x !== 1 || s.y !== 1 || s.z !== 1), b = this.animations[0].getKeys();
  let S, f, p;
  for (let x = 0, me = l.length; x < me; x++)
    S = l[x], S.frame >= r && S.frame <= o && (i ? (p = S.value.clone(), _ ? (f = p.getTranslation(), p.setTranslation(f.scaleInPlace(d))) : g && s ? (f = p.getTranslation(), p.setTranslation(f.multiplyInPlace(s))) : p = S.value) : p = S.value, b.push({ frame: S.frame + t, value: p }));
  return this.animations[0].createRange(e, r + t, o + t), !0;
};
class ce {
  /**
   * Check if fixed foveation is supported on this device
   */
  get isFixedFoveationSupported() {
    return this.layerType == "XRWebGLLayer" && typeof this.layer.fixedFoveation == "number";
  }
  /**
   * Get the fixed foveation currently set, as specified by the webxr specs
   * If this returns null, then fixed foveation is not supported
   */
  get fixedFoveation() {
    return this.isFixedFoveationSupported ? this.layer.fixedFoveation : null;
  }
  /**
   * Set the fixed foveation to the specified value, as specified by the webxr specs
   * This value will be normalized to be between 0 and 1, 1 being max foveation, 0 being no foveation
   */
  set fixedFoveation(e) {
    if (this.isFixedFoveationSupported) {
      const t = Math.max(0, Math.min(1, e || 0));
      this.layer.fixedFoveation = t;
    }
  }
  /**
   * Create a render target provider for the wrapped layer.
   * @param xrSessionManager The XR Session Manager
   * @returns A new render target texture provider for the wrapped layer.
   */
  createRenderTargetTextureProvider(e) {
    return this._rttWrapper = this._createRenderTargetTextureProvider(e), this._rttWrapper;
  }
  dispose() {
    this._rttWrapper && (this._rttWrapper.dispose(), this._rttWrapper = null);
  }
  constructor(e, t, i, s, a) {
    this.getWidth = e, this.getHeight = t, this.layer = i, this.layerType = s, this._createRenderTargetTextureProvider = a, this._rttWrapper = null;
  }
}
class ue {
  constructor(e, t) {
    this._scene = e, this.layerWrapper = t, this._renderTargetTextures = new Array(), this._engine = e.getEngine();
  }
  _createInternalTexture(e, t) {
    const i = new J(this._engine, $.Unknown, !0);
    return i.width = e.width, i.height = e.height, i._hardwareTexture = new de(t, this._engine._gl), i.isReady = !0, i;
  }
  _createRenderTargetTexture(e, t, i, s, a, r) {
    if (!this._engine)
      throw new Error("Engine is disposed");
    const o = { width: e, height: t }, l = r ? new W(this._scene, o) : new ne("XR renderTargetTexture", o, this._scene), h = l.renderTarget;
    if (h._samples = l.samples, (i || !s) && (h._framebuffer = i), s)
      if (r)
        h._colorTextureArray = s;
      else {
        const c = this._createInternalTexture(o, s);
        h.setTexture(c, 0), l._texture = c;
      }
    return a && (r ? h._depthStencilTextureArray = a : h._depthStencilTexture = this._createInternalTexture(o, a)), l.disableRescaling(), this._renderTargetTextures.push(l), l;
  }
  _destroyRenderTargetTexture(e) {
    this._renderTargetTextures.splice(this._renderTargetTextures.indexOf(e), 1), e.dispose();
  }
  getFramebufferDimensions() {
    return this._framebufferDimensions;
  }
  dispose() {
    this._renderTargetTextures.forEach((e) => e.dispose()), this._renderTargetTextures.length = 0;
  }
}
class _e extends ce {
  /**
   * @param layer is the layer to be wrapped.
   * @returns a new WebXRLayerWrapper wrapping the provided XRWebGLLayer.
   */
  constructor(e) {
    super(() => e.framebufferWidth, () => e.framebufferHeight, e, "XRWebGLLayer", (t) => new Ge(t.scene, this)), this.layer = e;
  }
}
class Ge extends ue {
  constructor(e, t) {
    super(e, t), this.layerWrapper = t, this._layer = t.layer, this._framebufferDimensions = {
      framebufferWidth: this._layer.framebufferWidth,
      framebufferHeight: this._layer.framebufferHeight
    };
  }
  trySetViewportForView(e, t) {
    const i = this._layer.getViewport(t);
    if (!i)
      return !1;
    const s = this._framebufferDimensions.framebufferWidth, a = this._framebufferDimensions.framebufferHeight;
    return e.x = i.x / s, e.y = i.y / a, e.width = i.width / s, e.height = i.height / a, !0;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getRenderTargetTextureForEye(e) {
    const t = this._layer.framebufferWidth, i = this._layer.framebufferHeight, s = this._layer.framebuffer;
    return (!this._rtt || t !== this._framebufferDimensions.framebufferWidth || i !== this._framebufferDimensions.framebufferHeight || s !== this._framebuffer) && (this._rtt = this._createRenderTargetTexture(t, i, s), this._framebufferDimensions.framebufferWidth = t, this._framebufferDimensions.framebufferHeight = i, this._framebuffer = s), this._rtt;
  }
  getRenderTargetTextureForView(e) {
    return this.getRenderTargetTextureForEye(e.eye);
  }
}
class I {
  /**
   * Get the default values of the configuration object
   * @param engine defines the engine to use (can be null)
   * @returns default values of this configuration object
   */
  static GetDefaults(e) {
    const t = new I();
    return t.canvasOptions = {
      antialias: !0,
      depth: !0,
      stencil: e ? e.isStencilEnable : !0,
      alpha: !0,
      framebufferScaleFactor: 1
    }, t.newCanvasCssStyle = "position:absolute; bottom:0px;right:0px;z-index:10;width:90%;height:100%;background-color: #000000;", t;
  }
}
class Ue {
  /**
   * Initializes the canvas to be added/removed upon entering/exiting xr
   * @param _xrSessionManager The XR Session manager
   * @param _options optional configuration for this canvas output. defaults will be used if not provided
   */
  constructor(e, t = I.GetDefaults()) {
    if (this._options = t, this._canvas = null, this._engine = null, this.xrLayer = null, this._xrLayerWrapper = null, this.onXRLayerInitObservable = new T(), this._engine = e.scene.getEngine(), this._engine.onDisposeObservable.addOnce(() => {
      this._engine = null;
    }), t.canvasElement)
      this._setManagedOutputCanvas(t.canvasElement);
    else {
      const i = document.createElement("canvas");
      i.style.cssText = this._options.newCanvasCssStyle || "position:absolute; bottom:0px;right:0px;", this._setManagedOutputCanvas(i);
    }
    e.onXRSessionInit.add(() => {
      this._addCanvas();
    }), e.onXRSessionEnded.add(() => {
      this._removeCanvas();
    });
  }
  /**
   * Disposes of the object
   */
  dispose() {
    this._removeCanvas(), this._setManagedOutputCanvas(null);
  }
  /**
   * Initializes a XRWebGLLayer to be used as the session's baseLayer.
   * @param xrSession xr session
   * @returns a promise that will resolve once the XR Layer has been created
   */
  async initializeXRLayerAsync(e) {
    const t = () => (this.xrLayer = new XRWebGLLayer(e, this.canvasContext, this._options.canvasOptions), this._xrLayerWrapper = new _e(this.xrLayer), this.onXRLayerInitObservable.notifyObservers(this.xrLayer), this.xrLayer);
    return this.canvasContext.makeXRCompatible ? this.canvasContext.makeXRCompatible().then(
      // catch any error and continue. When using the emulator is throws this error for no apparent reason.
      () => {
      },
      () => {
        w.Warn("Error executing makeXRCompatible. This does not mean that the session will work incorrectly.");
      }
    ).then(() => t()) : Promise.resolve(t());
  }
  _addCanvas() {
    this._canvas && this._engine && this._canvas !== this._engine.getRenderingCanvas() && document.body.appendChild(this._canvas), this.xrLayer ? this._setCanvasSize(!0) : this.onXRLayerInitObservable.addOnce(() => {
      this._setCanvasSize(!0);
    });
  }
  _removeCanvas() {
    this._canvas && this._engine && document.body.contains(this._canvas) && this._canvas !== this._engine.getRenderingCanvas() && document.body.removeChild(this._canvas), this._setCanvasSize(!1);
  }
  _setCanvasSize(e = !0, t = this._xrLayerWrapper) {
    !this._canvas || !this._engine || (e ? t && (this._canvas !== this._engine.getRenderingCanvas() ? (this._canvas.style.width = t.getWidth() + "px", this._canvas.style.height = t.getHeight() + "px") : this._engine.setSize(t.getWidth(), t.getHeight())) : this._originalCanvasSize && (this._canvas !== this._engine.getRenderingCanvas() ? (this._canvas.style.width = this._originalCanvasSize.width + "px", this._canvas.style.height = this._originalCanvasSize.height + "px") : this._engine.setSize(this._originalCanvasSize.width, this._originalCanvasSize.height)));
  }
  _setManagedOutputCanvas(e) {
    this._removeCanvas(), e ? (this._originalCanvasSize = {
      width: e.offsetWidth,
      height: e.offsetHeight
    }, this._canvas = e, this.canvasContext = this._canvas.getContext("webgl2"), this.canvasContext || (this.canvasContext = this._canvas.getContext("webgl"))) : (this._canvas = null, this.canvasContext = null);
  }
}
class He extends ce {
  constructor(e) {
    super(() => e.framebufferWidth, () => e.framebufferHeight, e, "XRWebGLLayer", (t) => new qe(t, this)), this.layer = e;
  }
}
class qe extends ue {
  constructor(e, t) {
    super(e.scene, t), this.layerWrapper = t, this._nativeRTTProvider = navigator.xr.getNativeRenderTargetProvider(e.session, this._createRenderTargetTexture.bind(this), this._destroyRenderTargetTexture.bind(this)), this._nativeLayer = t.layer;
  }
  trySetViewportForView(e) {
    return e.x = 0, e.y = 0, e.width = 1, e.height = 1, !0;
  }
  getRenderTargetTextureForEye(e) {
    return this._nativeRTTProvider.getRenderTargetForEye(e);
  }
  getRenderTargetTextureForView(e) {
    return this._nativeRTTProvider.getRenderTargetForEye(e.eye);
  }
  getFramebufferDimensions() {
    return {
      framebufferWidth: this._nativeLayer.framebufferWidth,
      framebufferHeight: this._nativeLayer.framebufferHeight
    };
  }
}
class Qe {
  constructor(e) {
    this._nativeRenderTarget = navigator.xr.getWebXRRenderTarget(e.scene.getEngine());
  }
  async initializeXRLayerAsync(e) {
    return await this._nativeRenderTarget.initializeXRLayerAsync(e), this.xrLayer = this._nativeRenderTarget.xrLayer, this.xrLayer;
  }
  dispose() {
  }
}
class G {
  /**
   * Scale factor to apply to all XR-related elements (camera, controllers)
   */
  get worldScalingFactor() {
    return this._worldScalingFactor;
  }
  set worldScalingFactor(e) {
    const t = this._worldScalingFactor;
    this._worldScalingFactor = e, this.onWorldScaleFactorChangedObservable.notifyObservers({
      previousScaleFactor: t,
      newScaleFactor: e
    });
  }
  /**
   * Constructs a WebXRSessionManager, this must be initialized within a user action before usage
   * @param scene The scene which the session should be created for
   */
  constructor(e) {
    this.scene = e, this.currentTimestamp = -1, this.defaultHeightCompensation = 1.7, this.onXRFrameObservable = new T(), this.onXRReferenceSpaceChanged = new T(), this.onXRSessionEnded = new T(), this.onXRSessionInit = new T(), this.onXRReferenceSpaceInitialized = new T(), this.onXRReady = new T(), this.inXRFrameLoop = !1, this.inXRSession = !1, this._worldScalingFactor = 1, this.onWorldScaleFactorChangedObservable = new T(void 0, !0), this._engine = e.getEngine(), this._onEngineDisposedObserver = this._engine.onDisposeObservable.addOnce(() => {
      this._engine = null;
    }), e.onDisposeObservable.addOnce(() => {
      this.dispose();
    });
  }
  /**
   * The current reference space used in this session. This reference space can constantly change!
   * It is mainly used to offset the camera's position.
   */
  get referenceSpace() {
    return this._referenceSpace;
  }
  /**
   * Set a new reference space and triggers the observable
   */
  set referenceSpace(e) {
    this._referenceSpace = e, this.onXRReferenceSpaceChanged.notifyObservers(this._referenceSpace);
  }
  /**
   * The mode for the managed XR session
   */
  get sessionMode() {
    return this._sessionMode;
  }
  /**
   * Disposes of the session manager
   * This should be called explicitly by the dev, if required.
   */
  dispose() {
    this.inXRSession && this.exitXRAsync(), this.onXRFrameObservable.clear(), this.onXRSessionEnded.clear(), this.onXRReferenceSpaceChanged.clear(), this.onXRSessionInit.clear(), this.onWorldScaleFactorChangedObservable.clear(), this._engine?.onDisposeObservable.remove(this._onEngineDisposedObserver), this._engine = null;
  }
  /**
   * Stops the xrSession and restores the render loop
   * @returns Promise which resolves after it exits XR
   */
  async exitXRAsync() {
    if (this.session && this.inXRSession) {
      this.inXRSession = !1;
      try {
        return await this.session.end();
      } catch {
        O.Warn("Could not end XR session.");
      }
    }
    return Promise.resolve();
  }
  /**
   * Attempts to set the framebuffer-size-normalized viewport to be rendered this frame for this view.
   * In the event of a failure, the supplied viewport is not updated.
   * @param viewport the viewport to which the view will be rendered
   * @param view the view for which to set the viewport
   * @returns whether the operation was successful
   */
  trySetViewportForView(e, t) {
    return this._baseLayerRTTProvider?.trySetViewportForView(e, t) || !1;
  }
  /**
   * Gets the correct render target texture to be rendered this frame for this eye
   * @param eye the eye for which to get the render target
   * @returns the render target for the specified eye or null if not available
   */
  getRenderTargetTextureForEye(e) {
    return this._baseLayerRTTProvider?.getRenderTargetTextureForEye(e) || null;
  }
  /**
   * Gets the correct render target texture to be rendered this frame for this view
   * @param view the view for which to get the render target
   * @returns the render target for the specified view or null if not available
   */
  getRenderTargetTextureForView(e) {
    return this._baseLayerRTTProvider?.getRenderTargetTextureForView(e) || null;
  }
  /**
   * Creates a WebXRRenderTarget object for the XR session
   * @param options optional options to provide when creating a new render target
   * @returns a WebXR render target to which the session can render
   */
  getWebXRRenderTarget(e) {
    const t = this.scene.getEngine();
    return this._xrNavigator.xr.native ? new Qe(this) : (e = e || I.GetDefaults(t), e.canvasElement = e.canvasElement || t.getRenderingCanvas() || void 0, new Ue(this, e));
  }
  /**
   * Initializes the manager
   * After initialization enterXR can be called to start an XR session
   * @returns Promise which resolves after it is initialized
   */
  initializeAsync() {
    return this._xrNavigator = navigator, this._xrNavigator.xr ? Promise.resolve() : Promise.reject("WebXR not available");
  }
  /**
   * Initializes an xr session
   * @param xrSessionMode mode to initialize
   * @param xrSessionInit defines optional and required values to pass to the session builder
   * @returns a promise which will resolve once the session has been initialized
   */
  initializeSessionAsync(e = "immersive-vr", t = {}) {
    return this._xrNavigator.xr.requestSession(e, t).then((i) => (this.session = i, this._sessionMode = e, this.inXRSession = !0, this.onXRSessionInit.notifyObservers(i), this.session.addEventListener("end", () => {
      this.inXRSession = !1, this.onXRSessionEnded.notifyObservers(null), this._engine && (this._engine.framebufferDimensionsObject = null, this._engine.restoreDefaultFramebuffer(), this._engine.customAnimationFrameRequester = null, this._engine._renderLoop()), this.isNative && this._baseLayerRTTProvider?.dispose(), this._baseLayerRTTProvider = null, this._baseLayerWrapper = null;
    }, { once: !0 }), this.session));
  }
  /**
   * Checks if a session would be supported for the creation options specified
   * @param sessionMode session mode to check if supported eg. immersive-vr
   * @returns A Promise that resolves to true if supported and false if not
   */
  isSessionSupportedAsync(e) {
    return G.IsSessionSupportedAsync(e);
  }
  /**
   * Resets the reference space to the one started the session
   */
  resetReferenceSpace() {
    this.referenceSpace = this.baseReferenceSpace;
  }
  /**
   * Starts rendering to the xr layer
   */
  runXRRenderLoop() {
    !this.inXRSession || !this._engine || (this._engine.customAnimationFrameRequester = {
      requestAnimationFrame: (e) => this.session.requestAnimationFrame(e),
      renderFunction: (e, t) => {
        if (!(!this.inXRSession || !this._engine) && (this.currentFrame = t, this.currentTimestamp = e, t)) {
          this.inXRFrameLoop = !0;
          const i = this._baseLayerRTTProvider?.getFramebufferDimensions() || null;
          this._engine.framebufferDimensionsObject !== i && (this._engine.framebufferDimensionsObject = i), this.onXRFrameObservable.notifyObservers(t), this._engine._renderLoop(), this._engine.framebufferDimensionsObject = null, this.inXRFrameLoop = !1;
        }
      }
    }, this._engine.framebufferDimensionsObject = this._baseLayerRTTProvider?.getFramebufferDimensions() || null, this.onXRFrameObservable.addOnce(() => {
      this.onXRReady.notifyObservers(this);
    }), typeof window < "u" && window.cancelAnimationFrame && window.cancelAnimationFrame(this._engine._frameHandler), this._engine._renderLoop());
  }
  /**
   * Sets the reference space on the xr session
   * @param referenceSpaceType space to set
   * @returns a promise that will resolve once the reference space has been set
   */
  setReferenceSpaceTypeAsync(e = "local-floor") {
    return this.session.requestReferenceSpace(e).then((t) => t, (t) => (O.Error("XR.requestReferenceSpace failed for the following reason: "), O.Error(t), O.Log('Defaulting to universally-supported "viewer" reference space type.'), this.session.requestReferenceSpace("viewer").then((i) => {
      const s = new XRRigidTransform({ x: 0, y: -this.defaultHeightCompensation, z: 0 });
      return i.getOffsetReferenceSpace(s);
    }, (i) => {
      throw O.Error(i), 'XR initialization failed: required "viewer" reference space type not supported.';
    }))).then((t) => this.session.requestReferenceSpace("viewer").then((i) => (this.viewerReferenceSpace = i, t))).then((t) => (this.referenceSpace = this.baseReferenceSpace = t, this.onXRReferenceSpaceInitialized.notifyObservers(t), this.referenceSpace));
  }
  /**
   * Updates the render state of the session.
   * Note that this is deprecated in favor of WebXRSessionManager.updateRenderState().
   * @param state state to set
   * @returns a promise that resolves once the render state has been updated
   * @deprecated Use updateRenderState() instead.
   */
  updateRenderStateAsync(e) {
    return Promise.resolve(this.session.updateRenderState(e));
  }
  /**
   * @internal
   */
  _setBaseLayerWrapper(e) {
    this.isNative && this._baseLayerRTTProvider?.dispose(), this._baseLayerWrapper = e, this._baseLayerRTTProvider = this._baseLayerWrapper?.createRenderTargetTextureProvider(this) || null;
  }
  /**
   * @internal
   */
  _getBaseLayerWrapper() {
    return this._baseLayerWrapper;
  }
  /**
   * Updates the render state of the session
   * @param state state to set
   */
  updateRenderState(e) {
    e.baseLayer && this._setBaseLayerWrapper(this.isNative ? new He(e.baseLayer) : new _e(e.baseLayer)), this.session.updateRenderState(e);
  }
  /**
   * Returns a promise that resolves with a boolean indicating if the provided session mode is supported by this browser
   * @param sessionMode defines the session to test
   * @returns a promise with boolean as final value
   */
  static IsSessionSupportedAsync(e) {
    if (!navigator.xr)
      return Promise.resolve(!1);
    const t = navigator.xr.isSessionSupported || navigator.xr.supportsSession;
    return t ? t.call(navigator.xr, e).then((i) => {
      const s = typeof i > "u" ? !0 : i;
      return Promise.resolve(s);
    }).catch((i) => (O.Warn(i), Promise.resolve(!1))) : Promise.resolve(!1);
  }
  /**
   * Returns true if Babylon.js is using the BabylonNative backend, otherwise false
   */
  get isNative() {
    return this._xrNavigator.xr.native ?? !1;
  }
  /**
   * The current frame rate as reported by the device
   */
  get currentFrameRate() {
    return this.session?.frameRate;
  }
  /**
   * A list of supported frame rates (only available in-session!
   */
  get supportedFrameRates() {
    return this.session?.supportedFrameRates;
  }
  /**
   * Set the framerate of the session.
   * @param rate the new framerate. This value needs to be in the supportedFrameRates array
   * @returns a promise that resolves once the framerate has been set
   */
  updateTargetFrameRate(e) {
    return this.session.updateTargetFrameRate(e);
  }
  /**
   * Run a callback in the xr render loop
   * @param callback the callback to call when in XR Frame
   * @param ignoreIfNotInSession if no session is currently running, run it first thing on the next session
   */
  runInXRFrame(e, t = !0) {
    this.inXRFrameLoop ? e() : (this.inXRSession || !t) && this.onXRFrameObservable.addOnce(e);
  }
  /**
   * Check if fixed foveation is supported on this device
   */
  get isFixedFoveationSupported() {
    return this._baseLayerWrapper?.isFixedFoveationSupported || !1;
  }
  /**
   * Get the fixed foveation currently set, as specified by the webxr specs
   * If this returns null, then fixed foveation is not supported
   */
  get fixedFoveation() {
    return this._baseLayerWrapper?.fixedFoveation || null;
  }
  /**
   * Set the fixed foveation to the specified value, as specified by the webxr specs
   * This value will be normalized to be between 0 and 1, 1 being max foveation, 0 being no foveation
   */
  set fixedFoveation(e) {
    const t = Math.max(0, Math.min(1, e || 0));
    this._baseLayerWrapper && (this._baseLayerWrapper.fixedFoveation = t);
  }
  /**
   * Get the features enabled on the current session
   * This is only available in-session!
   * @see https://www.w3.org/TR/webxr/#dom-xrsession-enabledfeatures
   */
  get enabledFeatures() {
    return this.session?.enabledFeatures ?? null;
  }
}
var E;
(function(n) {
  n[n.ENTERING_XR = 0] = "ENTERING_XR", n[n.EXITING_XR = 1] = "EXITING_XR", n[n.IN_XR = 2] = "IN_XR", n[n.NOT_IN_XR = 3] = "NOT_IN_XR";
})(E || (E = {}));
var K;
(function(n) {
  n[n.NOT_TRACKING = 0] = "NOT_TRACKING", n[n.TRACKING_LOST = 1] = "TRACKING_LOST", n[n.TRACKING = 2] = "TRACKING";
})(K || (K = {}));
class D {
  constructor(e, t = null) {
    if (this.scene = e, this._pointerDownOnMeshAsked = !1, this._isActionableMesh = !1, this._teleportationRequestInitiated = !1, this._teleportationBackRequestInitiated = !1, this._rotationRightAsked = !1, this._rotationLeftAsked = !1, this._dpadPressed = !0, this._activePointer = !1, this._id = D._IdCounter++, t)
      this._gazeTracker = t.clone("gazeTracker");
    else {
      this._gazeTracker = ae("gazeTracker", {
        diameter: 35e-4,
        thickness: 25e-4,
        tessellation: 20,
        updatable: !1
      }, e), this._gazeTracker.bakeCurrentTransformIntoVertices(), this._gazeTracker.isPickable = !1, this._gazeTracker.isVisible = !1;
      const i = new se("targetMat", e);
      i.specularColor = V.Black(), i.emissiveColor = new V(0.7, 0.7, 0.7), i.backFaceCulling = !1, this._gazeTracker.material = i;
    }
  }
  /**
   * @internal
   */
  _getForwardRay(e) {
    return new X(A.Zero(), new A(0, 0, e));
  }
  /** @internal */
  _selectionPointerDown() {
    this._pointerDownOnMeshAsked = !0, this._currentHit && this.scene.simulatePointerDown(this._currentHit, { pointerId: this._id });
  }
  /** @internal */
  _selectionPointerUp() {
    this._currentHit && this.scene.simulatePointerUp(this._currentHit, { pointerId: this._id }), this._pointerDownOnMeshAsked = !1;
  }
  /** @internal */
  _activatePointer() {
    this._activePointer = !0;
  }
  /** @internal */
  _deactivatePointer() {
    this._activePointer = !1;
  }
  /**
   * @internal
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _updatePointerDistance(e = 100) {
  }
  dispose() {
    this._interactionsEnabled = !1, this._teleportationEnabled = !1, this._gazeTracker && this._gazeTracker.dispose();
  }
}
D._IdCounter = 0;
class Z extends D {
  constructor(e, t) {
    super(t), this._getCamera = e;
  }
  _getForwardRay(e) {
    const t = this._getCamera();
    return t ? t.getForwardRay(e) : new X(A.Zero(), A.Forward());
  }
}
class vt {
}
class P {
  /** Return this.onEnteringVRObservable
   * Note: This one is for backward compatibility. Please use onEnteringVRObservable directly
   */
  get onEnteringVR() {
    return this.onEnteringVRObservable;
  }
  /** Return this.onExitingVRObservable
   * Note: This one is for backward compatibility. Please use onExitingVRObservable directly
   */
  get onExitingVR() {
    return this.onExitingVRObservable;
  }
  /**
   * The mesh used to display where the user is going to teleport.
   */
  get teleportationTarget() {
    return this._teleportationTarget;
  }
  /**
   * Sets the mesh to be used to display where the user is going to teleport.
   */
  set teleportationTarget(e) {
    e && (e.name = "teleportationTarget", this._isDefaultTeleportationTarget = !1, this._teleportationTarget = e);
  }
  /**
   * The mesh used to display where the user is selecting, this mesh will be cloned and set as the gazeTracker for the left and right controller
   * when set bakeCurrentTransformIntoVertices will be called on the mesh.
   * See https://doc.babylonjs.com/features/featuresDeepDive/mesh/transforms/center_origin/bakingTransforms
   */
  get gazeTrackerMesh() {
    return this._cameraGazer._gazeTracker;
  }
  set gazeTrackerMesh(e) {
    e && (this._cameraGazer._gazeTracker && this._cameraGazer._gazeTracker.dispose(), this._cameraGazer._gazeTracker = e, this._cameraGazer._gazeTracker.bakeCurrentTransformIntoVertices(), this._cameraGazer._gazeTracker.isPickable = !1, this._cameraGazer._gazeTracker.isVisible = !1, this._cameraGazer._gazeTracker.name = "gazeTracker");
  }
  /**
   * If the ray of the gaze should be displayed.
   */
  get displayGaze() {
    return this._displayGaze;
  }
  /**
   * Sets if the ray of the gaze should be displayed.
   */
  set displayGaze(e) {
    this._displayGaze = e, e || (this._cameraGazer._gazeTracker.isVisible = !1);
  }
  /**
   * If the ray of the LaserPointer should be displayed.
   */
  get displayLaserPointer() {
    return this._displayLaserPointer;
  }
  /**
   * Sets if the ray of the LaserPointer should be displayed.
   */
  set displayLaserPointer(e) {
    this._displayLaserPointer = e;
  }
  /**
   * The deviceOrientationCamera used as the camera when not in VR.
   */
  get deviceOrientationCamera() {
    return this._deviceOrientationCamera;
  }
  /**
   * Based on the current WebVR support, returns the current VR camera used.
   */
  get currentVRCamera() {
    return this._scene.activeCamera;
  }
  /**
   * The deviceOrientationCamera that is used as a fallback when vr device is not connected.
   */
  get vrDeviceOrientationCamera() {
    return this._vrDeviceOrientationCamera;
  }
  /**
   * The html button that is used to trigger entering into VR.
   */
  get vrButton() {
    return this._btnVR;
  }
  get _teleportationRequestInitiated() {
    return this._cameraGazer._teleportationRequestInitiated;
  }
  /**
   * Instantiates a VRExperienceHelper.
   * Helps to quickly add VR support to an existing scene.
   * @param scene The scene the VRExperienceHelper belongs to.
   * @param webVROptions Options to modify the vr experience helper's behavior.
   */
  constructor(e, t = {}) {
    if (this.webVROptions = t, this._fullscreenVRpresenting = !1, this.enableGazeEvenWhenNoPointerLock = !1, this.exitVROnDoubleTap = !0, this.onEnteringVRObservable = new T(), this.onAfterEnteringVRObservable = new T(), this.onExitingVRObservable = new T(), this._useCustomVRButton = !1, this._teleportActive = !1, this._floorMeshesCollection = [], this._teleportationMode = P.TELEPORTATIONMODE_CONSTANTTIME, this._teleportationTime = 122, this._teleportationSpeed = 20, this._rotationAllowed = !0, this._teleportBackwardsVector = new A(0, -1, -1), this._isDefaultTeleportationTarget = !0, this._teleportationFillColor = "#444444", this._teleportationBorderColor = "#FFFFFF", this._rotationAngle = 0, this._haloCenter = new A(0, 0, 0), this._padSensibilityUp = 0.65, this._padSensibilityDown = 0.35, this._pickedLaserColor = new V(0.2, 0.2, 1), this._pickedGazeColor = new V(0, 0, 1), this.onNewMeshSelected = new T(), this.onNewMeshPicked = new T(), this.onBeforeCameraTeleport = new T(), this.onAfterCameraTeleport = new T(), this.onSelectedMeshUnselected = new T(), this.teleportationEnabled = !0, this._teleportationInitialized = !1, this._interactionsEnabled = !1, this._displayGaze = !0, this._displayLaserPointer = !0, this.updateGazeTrackerScale = !0, this.updateGazeTrackerColor = !0, this.updateControllerLaserColor = !0, this.requestPointerLockOnFullScreen = !0, this.xrTestDone = !1, this._onResize = () => {
      this._moveButtonToBottomRight();
    }, this._onFullscreenChange = () => {
      this._fullscreenVRpresenting = !!document.fullscreenElement, !this._fullscreenVRpresenting && this._inputElement && (this.exitVR(), !this._useCustomVRButton && this._btnVR && (this._btnVR.style.top = this._inputElement.offsetTop + this._inputElement.offsetHeight - 70 + "px", this._btnVR.style.left = this._inputElement.offsetLeft + this._inputElement.offsetWidth - 100 + "px", this._updateButtonVisibility()));
    }, this._cachedAngularSensibility = { angularSensibilityX: null, angularSensibilityY: null, angularSensibility: null }, this._beforeRender = () => {
      this._scene.getEngine().isPointerLock || this.enableGazeEvenWhenNoPointerLock || (this._cameraGazer._gazeTracker.isVisible = !1);
    }, this._onNewGamepadConnected = (s) => {
      s.type !== H.POSE_ENABLED && (s.leftStick && s.onleftstickchanged((a) => {
        this._teleportationInitialized && this.teleportationEnabled && (this._checkTeleportWithRay(a, this._cameraGazer), this._checkTeleportBackwards(a, this._cameraGazer));
      }), s.rightStick && s.onrightstickchanged((a) => {
        this._teleportationInitialized && this._checkRotate(a, this._cameraGazer);
      }), s.type === H.XBOX && (s.onbuttondown((a) => {
        this._interactionsEnabled && a === q.A && this._cameraGazer._selectionPointerDown();
      }), s.onbuttonup((a) => {
        this._interactionsEnabled && a === q.A && this._cameraGazer._selectionPointerUp();
      })));
    }, this._workingVector = A.Zero(), this._workingQuaternion = v.Identity(), this._workingMatrix = y.Identity(), O.Warn("WebVR is deprecated. Please avoid using this experience helper and use the WebXR experience helper instead"), this._scene = e, this._inputElement = e.getEngine().getInputElement(), !("getVRDisplays" in navigator) && t.useXR === void 0 && (t.useXR = !0), t.createFallbackVRDeviceOrientationFreeCamera === void 0 && (t.createFallbackVRDeviceOrientationFreeCamera = !0), t.createDeviceOrientationCamera === void 0 && (t.createDeviceOrientationCamera = !0), t.laserToggle === void 0 && (t.laserToggle = !0), this._hasEnteredVR = !1, this._scene.activeCamera ? this._position = this._scene.activeCamera.position.clone() : this._position = new A(0, this._defaultHeight, 0), t.createDeviceOrientationCamera || !this._scene.activeCamera) {
      if (this._deviceOrientationCamera = new B("deviceOrientationVRHelper", this._position.clone(), e), this._scene.activeCamera && (this._deviceOrientationCamera.minZ = this._scene.activeCamera.minZ, this._deviceOrientationCamera.maxZ = this._scene.activeCamera.maxZ, this._scene.activeCamera instanceof be && this._scene.activeCamera.rotation)) {
        const s = this._scene.activeCamera;
        s.rotationQuaternion ? this._deviceOrientationCamera.rotationQuaternion.copyFrom(s.rotationQuaternion) : this._deviceOrientationCamera.rotationQuaternion.copyFrom(v.RotationYawPitchRoll(s.rotation.y, s.rotation.x, s.rotation.z)), this._deviceOrientationCamera.rotation = s.rotation.clone();
      }
      this._scene.activeCamera = this._deviceOrientationCamera, this._inputElement && this._scene.activeCamera.attachControl();
    } else
      this._existingCamera = this._scene.activeCamera;
    this.webVROptions.useXR && navigator.xr ? G.IsSessionSupportedAsync("immersive-vr").then((s) => {
      s ? (O.Log("Using WebXR. It is recommended to use the WebXRDefaultExperience directly"), e.createDefaultXRExperienceAsync({
        floorMeshes: t.floorMeshes || []
      }).then((a) => {
        this.xr = a, this.xrTestDone = !0, this._cameraGazer = new Z(() => this.xr.baseExperience.camera, e), this.xr.baseExperience.onStateChangedObservable.add((r) => {
          switch (r) {
            case E.ENTERING_XR:
              this.onEnteringVRObservable.notifyObservers(this), this._interactionsEnabled || this.xr.pointerSelection.detach(), this.xr.pointerSelection.displayLaserPointer = this._displayLaserPointer;
              break;
            case E.EXITING_XR:
              this.onExitingVRObservable.notifyObservers(this), this._scene.getEngine().resize();
              break;
            case E.IN_XR:
              this._hasEnteredVR = !0;
              break;
            case E.NOT_IN_XR:
              this._hasEnteredVR = !1;
              break;
          }
        });
      })) : this._completeVRInit(e, t);
    }) : this._completeVRInit(e, t);
  }
  _completeVRInit(e, t) {
    if (this.xrTestDone = !0, t.createFallbackVRDeviceOrientationFreeCamera && (this._vrDeviceOrientationCamera = new he("VRDeviceOrientationVRHelper", this._position, this._scene, !0, t.vrDeviceOrientationCameraMetrics), this._vrDeviceOrientationCamera.angularSensibility = Number.MAX_VALUE), this._cameraGazer = new Z(() => this.currentVRCamera, e), !this._useCustomVRButton) {
      this._btnVR = document.createElement("BUTTON"), this._btnVR.className = "babylonVRicon", this._btnVR.id = "babylonVRiconbtn", this._btnVR.title = "Click to switch to VR";
      let a = ".babylonVRicon { position: absolute; right: 20px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-image: url(" + (window.SVGSVGElement ? "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%222048%22%20height%3D%221152%22%20viewBox%3D%220%200%202048%201152%22%20version%3D%221.1%22%3E%3Cpath%20transform%3D%22rotate%28180%201024%2C576.0000000000001%29%22%20d%3D%22m1109%2C896q17%2C0%2030%2C-12t13%2C-30t-12.5%2C-30.5t-30.5%2C-12.5l-170%2C0q-18%2C0%20-30.5%2C12.5t-12.5%2C30.5t13%2C30t30%2C12l170%2C0zm-85%2C256q59%2C0%20132.5%2C-1.5t154.5%2C-5.5t164.5%2C-11.5t163%2C-20t150%2C-30t124.5%2C-41.5q23%2C-11%2042%2C-24t38%2C-30q27%2C-25%2041%2C-61.5t14%2C-72.5l0%2C-257q0%2C-123%20-47%2C-232t-128%2C-190t-190%2C-128t-232%2C-47l-81%2C0q-37%2C0%20-68.5%2C14t-60.5%2C34.5t-55.5%2C45t-53%2C45t-53%2C34.5t-55.5%2C14t-55.5%2C-14t-53%2C-34.5t-53%2C-45t-55.5%2C-45t-60.5%2C-34.5t-68.5%2C-14l-81%2C0q-123%2C0%20-232%2C47t-190%2C128t-128%2C190t-47%2C232l0%2C257q0%2C68%2038%2C115t97%2C73q54%2C24%20124.5%2C41.5t150%2C30t163%2C20t164.5%2C11.5t154.5%2C5.5t132.5%2C1.5zm939%2C-298q0%2C39%20-24.5%2C67t-58.5%2C42q-54%2C23%20-122%2C39.5t-143.5%2C28t-155.5%2C19t-157%2C11t-148.5%2C5t-129.5%2C1.5q-59%2C0%20-130%2C-1.5t-148%2C-5t-157%2C-11t-155.5%2C-19t-143.5%2C-28t-122%2C-39.5q-34%2C-14%20-58.5%2C-42t-24.5%2C-67l0%2C-257q0%2C-106%2040.5%2C-199t110%2C-162.5t162.5%2C-109.5t199%2C-40l81%2C0q27%2C0%2052%2C14t50%2C34.5t51%2C44.5t55.5%2C44.5t63.5%2C34.5t74%2C14t74%2C-14t63.5%2C-34.5t55.5%2C-44.5t51%2C-44.5t50%2C-34.5t52%2C-14l14%2C0q37%2C0%2070%2C0.5t64.5%2C4.5t63.5%2C12t68%2C23q71%2C30%20128.5%2C78.5t98.5%2C110t63.5%2C133.5t22.5%2C149l0%2C257z%22%20fill%3D%22white%22%20/%3E%3C/svg%3E%0A" : "https://cdn.babylonjs.com/Assets/vrButton.png") + "); background-size: 80%; background-repeat:no-repeat; background-position: center; border: none; outline: none; transition: transform 0.125s ease-out } .babylonVRicon:hover { transform: scale(1.05) } .babylonVRicon:active {background-color: rgba(51,51,51,1) } .babylonVRicon:focus {background-color: rgba(51,51,51,1) }";
      a += ".babylonVRicon.vrdisplaypresenting { display: none; }";
      const r = document.createElement("style");
      r.appendChild(document.createTextNode(a)), document.getElementsByTagName("head")[0].appendChild(r), this._moveButtonToBottomRight();
    }
    this._btnVR && this._btnVR.addEventListener("click", () => {
      this.isInVRMode || this.enterVR();
    });
    const i = this._scene.getEngine().getHostWindow();
    i && (i.addEventListener("resize", this._onResize), document.addEventListener("fullscreenchange", this._onFullscreenChange, !1), t.createFallbackVRDeviceOrientationFreeCamera && this._displayVRButton(), this._onKeyDown = (s) => {
      s.keyCode === 27 && this.isInVRMode && this.exitVR();
    }, document.addEventListener("keydown", this._onKeyDown), this._scene.onPrePointerObservable.add(() => {
      this._hasEnteredVR && this.exitVROnDoubleTap && (this.exitVR(), this._fullscreenVRpresenting && this._scene.getEngine().exitFullscreen());
    }, N.POINTERDOUBLETAP, !1), e.onDisposeObservable.add(() => {
      this.dispose();
    }), this._updateButtonVisibility(), this._circleEase = new we(), this._circleEase.setEasingMode(Q.EASINGMODE_EASEINOUT), this._teleportationEasing = this._circleEase, e.onPointerObservable.add((s) => {
      this._interactionsEnabled && e.activeCamera === this.vrDeviceOrientationCamera && s.event.pointerType === "mouse" && (s.type === N.POINTERDOWN ? this._cameraGazer._selectionPointerDown() : s.type === N.POINTERUP && this._cameraGazer._selectionPointerUp());
    }), this.webVROptions.floorMeshes && this.enableTeleportation({ floorMeshes: this.webVROptions.floorMeshes }));
  }
  /**
   * Gets a value indicating if we are currently in VR mode.
   */
  get isInVRMode() {
    return this.xr && this.webVROptions.useXR && this.xr.baseExperience.state === E.IN_XR || this._fullscreenVRpresenting;
  }
  _moveButtonToBottomRight() {
    if (this._inputElement && !this._useCustomVRButton && this._btnVR) {
      const e = this._inputElement.getBoundingClientRect();
      this._btnVR.style.top = e.top + e.height - 70 + "px", this._btnVR.style.left = e.left + e.width - 100 + "px";
    }
  }
  _displayVRButton() {
    !this._useCustomVRButton && !this._btnVRDisplayed && this._btnVR && (document.body.appendChild(this._btnVR), this._btnVRDisplayed = !0);
  }
  _updateButtonVisibility() {
    !this._btnVR || this._useCustomVRButton || (this._btnVR.className = "babylonVRicon", this.isInVRMode && (this._btnVR.className += " vrdisplaypresenting"));
  }
  /**
   * Attempt to enter VR. If a headset is connected and ready, will request present on that.
   * Otherwise, will use the fullscreen API.
   */
  enterVR() {
    if (this.xr) {
      this.xr.baseExperience.enterXRAsync("immersive-vr", "local-floor", this.xr.renderTarget);
      return;
    }
    if (this.onEnteringVRObservable)
      try {
        this.onEnteringVRObservable.notifyObservers(this);
      } catch (e) {
        O.Warn("Error in your custom logic onEnteringVR: " + e);
      }
    this._scene.activeCamera && (this._position = this._scene.activeCamera.position.clone(), this.vrDeviceOrientationCamera && (this.vrDeviceOrientationCamera.rotation = v.FromRotationMatrix(this._scene.activeCamera.getWorldMatrix().getRotationMatrix()).toEulerAngles(), this.vrDeviceOrientationCamera.angularSensibility = 2e3), this._existingCamera = this._scene.activeCamera, this._existingCamera.angularSensibilityX && (this._cachedAngularSensibility.angularSensibilityX = this._existingCamera.angularSensibilityX, this._existingCamera.angularSensibilityX = Number.MAX_VALUE), this._existingCamera.angularSensibilityY && (this._cachedAngularSensibility.angularSensibilityY = this._existingCamera.angularSensibilityY, this._existingCamera.angularSensibilityY = Number.MAX_VALUE), this._existingCamera.angularSensibility && (this._cachedAngularSensibility.angularSensibility = this._existingCamera.angularSensibility, this._existingCamera.angularSensibility = Number.MAX_VALUE)), this._vrDeviceOrientationCamera && (this._vrDeviceOrientationCamera.position = this._position, this._scene.activeCamera && (this._vrDeviceOrientationCamera.minZ = this._scene.activeCamera.minZ), this._scene.activeCamera = this._vrDeviceOrientationCamera, this._scene.getEngine().enterFullscreen(this.requestPointerLockOnFullScreen), this._updateButtonVisibility(), this._vrDeviceOrientationCamera.onViewMatrixChangedObservable.addOnce(() => {
      this.onAfterEnteringVRObservable.notifyObservers({ success: !0 });
    })), this._scene.activeCamera && this._inputElement && this._scene.activeCamera.attachControl(), this._interactionsEnabled && this._scene.registerBeforeRender(this._beforeRender), this._hasEnteredVR = !0;
  }
  /**
   * Attempt to exit VR, or fullscreen.
   */
  exitVR() {
    if (this.xr) {
      this.xr.baseExperience.exitXRAsync();
      return;
    }
    if (this._hasEnteredVR) {
      if (this.onExitingVRObservable)
        try {
          this.onExitingVRObservable.notifyObservers(this);
        } catch (e) {
          O.Warn("Error in your custom logic onExitingVR: " + e);
        }
      this._scene.activeCamera && (this._position = this._scene.activeCamera.position.clone()), this.vrDeviceOrientationCamera && (this.vrDeviceOrientationCamera.angularSensibility = Number.MAX_VALUE), this._deviceOrientationCamera ? (this._deviceOrientationCamera.position = this._position, this._scene.activeCamera = this._deviceOrientationCamera, this._cachedAngularSensibility.angularSensibilityX && (this._deviceOrientationCamera.angularSensibilityX = this._cachedAngularSensibility.angularSensibilityX, this._cachedAngularSensibility.angularSensibilityX = null), this._cachedAngularSensibility.angularSensibilityY && (this._deviceOrientationCamera.angularSensibilityY = this._cachedAngularSensibility.angularSensibilityY, this._cachedAngularSensibility.angularSensibilityY = null), this._cachedAngularSensibility.angularSensibility && (this._deviceOrientationCamera.angularSensibility = this._cachedAngularSensibility.angularSensibility, this._cachedAngularSensibility.angularSensibility = null)) : this._existingCamera && (this._existingCamera.position = this._position, this._scene.activeCamera = this._existingCamera, this._inputElement && this._scene.activeCamera.attachControl(), this._cachedAngularSensibility.angularSensibilityX && (this._existingCamera.angularSensibilityX = this._cachedAngularSensibility.angularSensibilityX, this._cachedAngularSensibility.angularSensibilityX = null), this._cachedAngularSensibility.angularSensibilityY && (this._existingCamera.angularSensibilityY = this._cachedAngularSensibility.angularSensibilityY, this._cachedAngularSensibility.angularSensibilityY = null), this._cachedAngularSensibility.angularSensibility && (this._existingCamera.angularSensibility = this._cachedAngularSensibility.angularSensibility, this._cachedAngularSensibility.angularSensibility = null)), this._updateButtonVisibility(), this._interactionsEnabled && (this._scene.unregisterBeforeRender(this._beforeRender), this._cameraGazer._gazeTracker.isVisible = !1), this._scene.getEngine().resize(), this._hasEnteredVR = !1;
    }
  }
  /**
   * The position of the vr experience helper.
   */
  get position() {
    return this._position;
  }
  /**
   * Sets the position of the vr experience helper.
   */
  set position(e) {
    this._position = e, this._scene.activeCamera && (this._scene.activeCamera.position = e);
  }
  /**
   * Enables controllers and user interactions such as selecting and object or clicking on an object.
   */
  enableInteractions() {
    if (!this._interactionsEnabled) {
      if (this.xr) {
        this.xr.baseExperience.state === E.IN_XR && this.xr.pointerSelection.attach();
        return;
      }
      this.raySelectionPredicate = (e) => e.isVisible && (e.isPickable || e.name === this._floorMeshName), this.meshSelectionPredicate = () => !0, this._raySelectionPredicate = (e) => this._isTeleportationFloor(e) || e.name.indexOf("gazeTracker") === -1 && e.name.indexOf("teleportationTarget") === -1 && e.name.indexOf("torusTeleportation") === -1 ? this.raySelectionPredicate(e) : !1, this._interactionsEnabled = !0;
    }
  }
  _isTeleportationFloor(e) {
    for (let t = 0; t < this._floorMeshesCollection.length; t++)
      if (this._floorMeshesCollection[t].id === e.id)
        return !0;
    return !!(this._floorMeshName && e.name === this._floorMeshName);
  }
  /**
   * Adds a floor mesh to be used for teleportation.
   * @param floorMesh the mesh to be used for teleportation.
   */
  addFloorMesh(e) {
    this._floorMeshesCollection && (this._floorMeshesCollection.indexOf(e) > -1 || this._floorMeshesCollection.push(e));
  }
  /**
   * Removes a floor mesh from being used for teleportation.
   * @param floorMesh the mesh to be removed.
   */
  removeFloorMesh(e) {
    if (!this._floorMeshesCollection)
      return;
    const t = this._floorMeshesCollection.indexOf(e);
    t !== -1 && this._floorMeshesCollection.splice(t, 1);
  }
  /**
   * Enables interactions and teleportation using the VR controllers and gaze.
   * @param vrTeleportationOptions options to modify teleportation behavior.
   */
  enableTeleportation(e = {}) {
    if (!this._teleportationInitialized) {
      if (this.enableInteractions(), this.webVROptions.useXR && (e.floorMeshes || e.floorMeshName)) {
        const i = e.floorMeshes || [];
        if (!i.length) {
          const s = this._scene.getMeshByName(e.floorMeshName);
          s && i.push(s);
        }
        if (this.xr) {
          i.forEach((s) => {
            this.xr.teleportation.addFloorMesh(s);
          }), this.xr.teleportation.attached || this.xr.teleportation.attach();
          return;
        } else if (!this.xrTestDone) {
          const s = () => {
            this.xrTestDone && (this._scene.unregisterBeforeRender(s), this.xr ? this.xr.teleportation.attached || this.xr.teleportation.attach() : this.enableTeleportation(e));
          };
          this._scene.registerBeforeRender(s);
          return;
        }
      }
      e.floorMeshName && (this._floorMeshName = e.floorMeshName), e.floorMeshes && (this._floorMeshesCollection = e.floorMeshes), e.teleportationMode && (this._teleportationMode = e.teleportationMode), e.teleportationTime && e.teleportationTime > 0 && (this._teleportationTime = e.teleportationTime), e.teleportationSpeed && e.teleportationSpeed > 0 && (this._teleportationSpeed = e.teleportationSpeed), e.easingFunction !== void 0 && (this._teleportationEasing = e.easingFunction);
      const t = new Te();
      t.vignetteColor = new ge(0, 0, 0, 0), t.vignetteEnabled = !0, this._teleportationInitialized = !0, this._isDefaultTeleportationTarget && this._createTeleportationCircles();
    }
  }
  _checkTeleportWithRay(e, t) {
    this._teleportationRequestInitiated && !t._teleportationRequestInitiated || (t._teleportationRequestInitiated ? Math.sqrt(e.y * e.y + e.x * e.x) < this._padSensibilityDown && (this._teleportActive && this.teleportCamera(this._haloCenter), t._teleportationRequestInitiated = !1) : e.y < -this._padSensibilityUp && t._dpadPressed && (t._activatePointer(), t._teleportationRequestInitiated = !0));
  }
  _checkRotate(e, t) {
    t._teleportationRequestInitiated || (t._rotationLeftAsked ? e.x > -this._padSensibilityDown && (t._rotationLeftAsked = !1) : e.x < -this._padSensibilityUp && t._dpadPressed && (t._rotationLeftAsked = !0, this._rotationAllowed && this._rotateCamera(!1)), t._rotationRightAsked ? e.x < this._padSensibilityDown && (t._rotationRightAsked = !1) : e.x > this._padSensibilityUp && t._dpadPressed && (t._rotationRightAsked = !0, this._rotationAllowed && this._rotateCamera(!0)));
  }
  _checkTeleportBackwards(e, t) {
    if (!t._teleportationRequestInitiated)
      if (e.y > this._padSensibilityUp && t._dpadPressed) {
        if (!t._teleportationBackRequestInitiated) {
          if (!this.currentVRCamera)
            return;
          const i = v.FromRotationMatrix(this.currentVRCamera.getWorldMatrix().getRotationMatrix()), s = this.currentVRCamera.position;
          i.toEulerAnglesToRef(this._workingVector), this._workingVector.z = 0, this._workingVector.x = 0, v.RotationYawPitchRollToRef(this._workingVector.y, this._workingVector.x, this._workingVector.z, this._workingQuaternion), this._workingQuaternion.toRotationMatrix(this._workingMatrix), A.TransformCoordinatesToRef(this._teleportBackwardsVector, this._workingMatrix, this._workingVector);
          const a = new X(s, this._workingVector), r = this._scene.pickWithRay(a, this._raySelectionPredicate);
          r && r.pickedPoint && r.pickedMesh && this._isTeleportationFloor(r.pickedMesh) && r.distance < 5 && this.teleportCamera(r.pickedPoint), t._teleportationBackRequestInitiated = !0;
        }
      } else
        t._teleportationBackRequestInitiated = !1;
  }
  _createTeleportationCircles() {
    this._teleportationTarget = Ie("teleportationTarget", { width: 2, height: 2, subdivisions: 2 }, this._scene), this._teleportationTarget.isPickable = !1;
    const e = 512, t = new Ae("DynamicTexture", e, this._scene, !0);
    t.hasAlpha = !0;
    const i = t.getContext(), s = e / 2, a = e / 2, r = 200;
    i.beginPath(), i.arc(s, a, r, 0, 2 * Math.PI, !1), i.fillStyle = this._teleportationFillColor, i.fill(), i.lineWidth = 10, i.strokeStyle = this._teleportationBorderColor, i.stroke(), i.closePath(), t.update();
    const o = new se("TextPlaneMaterial", this._scene);
    o.diffuseTexture = t, this._teleportationTarget.material = o;
    const l = ae("torusTeleportation", {
      diameter: 0.75,
      thickness: 0.1,
      tessellation: 25,
      updatable: !1
    }, this._scene);
    l.isPickable = !1, l.parent = this._teleportationTarget;
    const h = new m("animationInnerCircle", "position.y", 30, m.ANIMATIONTYPE_FLOAT, m.ANIMATIONLOOPMODE_CYCLE), c = [];
    c.push({
      frame: 0,
      value: 0
    }), c.push({
      frame: 30,
      value: 0.4
    }), c.push({
      frame: 60,
      value: 0
    }), h.setKeys(c);
    const u = new xe();
    u.setEasingMode(Q.EASINGMODE_EASEINOUT), h.setEasingFunction(u), l.animations = [], l.animations.push(h), this._scene.beginAnimation(l, 0, 60, !0), this._hideTeleportationTarget();
  }
  _hideTeleportationTarget() {
    this._teleportActive = !1, this._teleportationInitialized && (this._teleportationTarget.isVisible = !1, this._isDefaultTeleportationTarget && (this._teleportationTarget.getChildren()[0].isVisible = !1));
  }
  _rotateCamera(e) {
    if (!(this.currentVRCamera instanceof k))
      return;
    e ? this._rotationAngle++ : this._rotationAngle--, this.currentVRCamera.animations = [];
    const t = v.FromRotationMatrix(y.RotationY(Math.PI / 4 * this._rotationAngle)), i = new m("animationRotation", "rotationQuaternion", 90, m.ANIMATIONTYPE_QUATERNION, m.ANIMATIONLOOPMODE_CONSTANT), s = [];
    s.push({
      frame: 0,
      value: this.currentVRCamera.rotationQuaternion
    }), s.push({
      frame: 6,
      value: t
    }), i.setKeys(s), i.setEasingFunction(this._circleEase), this.currentVRCamera.animations.push(i), this._postProcessMove.animations = [];
    const a = new m("animationPP", "vignetteWeight", 90, m.ANIMATIONTYPE_FLOAT, m.ANIMATIONLOOPMODE_CONSTANT), r = [];
    r.push({
      frame: 0,
      value: 0
    }), r.push({
      frame: 3,
      value: 4
    }), r.push({
      frame: 6,
      value: 0
    }), a.setKeys(r), a.setEasingFunction(this._circleEase), this._postProcessMove.animations.push(a);
    const o = new m("animationPP2", "vignetteStretch", 90, m.ANIMATIONTYPE_FLOAT, m.ANIMATIONLOOPMODE_CONSTANT), l = [];
    l.push({
      frame: 0,
      value: 0
    }), l.push({
      frame: 3,
      value: 10
    }), l.push({
      frame: 6,
      value: 0
    }), o.setKeys(l), o.setEasingFunction(this._circleEase), this._postProcessMove.animations.push(o), this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0, this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0, this._postProcessMove.samples = 4, this._scene.beginAnimation(this.currentVRCamera, 0, 6, !1, 1);
  }
  /**
   * Teleports the users feet to the desired location
   * @param location The location where the user's feet should be placed
   */
  teleportCamera(e) {
    if (!(this.currentVRCamera instanceof k))
      return;
    this._workingVector.copyFrom(e), this.isInVRMode || (this._workingVector.y += this._defaultHeight), this.onBeforeCameraTeleport.notifyObservers(this._workingVector);
    const t = 90;
    let i, s;
    if (this._teleportationMode == P.TELEPORTATIONMODE_CONSTANTSPEED) {
      s = t;
      const _ = A.Distance(this.currentVRCamera.position, this._workingVector);
      i = this._teleportationSpeed / _;
    } else
      s = Math.round(this._teleportationTime * t / 1e3), i = 1;
    this.currentVRCamera.animations = [];
    const a = new m("animationCameraTeleportation", "position", t, m.ANIMATIONTYPE_VECTOR3, m.ANIMATIONLOOPMODE_CONSTANT), r = [
      {
        frame: 0,
        value: this.currentVRCamera.position
      },
      {
        frame: s,
        value: this._workingVector
      }
    ];
    a.setKeys(r), a.setEasingFunction(this._teleportationEasing), this.currentVRCamera.animations.push(a), this._postProcessMove.animations = [];
    const o = Math.round(s / 2), l = new m("animationPP", "vignetteWeight", t, m.ANIMATIONTYPE_FLOAT, m.ANIMATIONLOOPMODE_CONSTANT), h = [];
    h.push({
      frame: 0,
      value: 0
    }), h.push({
      frame: o,
      value: 8
    }), h.push({
      frame: s,
      value: 0
    }), l.setKeys(h), this._postProcessMove.animations.push(l);
    const c = new m("animationPP2", "vignetteStretch", t, m.ANIMATIONTYPE_FLOAT, m.ANIMATIONLOOPMODE_CONSTANT), u = [];
    u.push({
      frame: 0,
      value: 0
    }), u.push({
      frame: o,
      value: 10
    }), u.push({
      frame: s,
      value: 0
    }), c.setKeys(u), this._postProcessMove.animations.push(c), this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0, this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0, this._scene.beginAnimation(this.currentVRCamera, 0, s, !1, i, () => {
      this.onAfterCameraTeleport.notifyObservers(this._workingVector);
    }), this._hideTeleportationTarget();
  }
  /**
   * Permanently set new colors for the laser pointer
   * @param color the new laser color
   * @param pickedColor the new laser color when picked mesh detected
   */
  setLaserColor(e, t = this._pickedLaserColor) {
    this._pickedLaserColor = t;
  }
  /**
   * Set lighting enabled / disabled on the laser pointer of both controllers
   * @param _enabled should the lighting be enabled on the laser pointer
   */
  setLaserLightingState(e = !0) {
  }
  /**
   * Permanently set new colors for the gaze pointer
   * @param color the new gaze color
   * @param pickedColor the new gaze color when picked mesh detected
   */
  setGazeColor(e, t = this._pickedGazeColor) {
    this._pickedGazeColor = t;
  }
  /**
   * Sets the color of the laser ray from the vr controllers.
   * @param _color new color for the ray.
   */
  changeLaserColor(e) {
    this.updateControllerLaserColor;
  }
  /**
   * Sets the color of the ray from the vr headsets gaze.
   * @param color new color for the ray.
   */
  changeGazeColor(e) {
    this.updateGazeTrackerColor && this._cameraGazer._gazeTracker.material && (this._cameraGazer._gazeTracker.material.emissiveColor = e);
  }
  /**
   * Exits VR and disposes of the vr experience helper
   */
  dispose() {
    this.isInVRMode && this.exitVR(), this._postProcessMove && this._postProcessMove.dispose(), this._vrDeviceOrientationCamera && this._vrDeviceOrientationCamera.dispose(), !this._useCustomVRButton && this._btnVR && this._btnVR.parentNode && document.body.removeChild(this._btnVR), this._deviceOrientationCamera && this._scene.activeCamera != this._deviceOrientationCamera && this._deviceOrientationCamera.dispose(), this._cameraGazer && this._cameraGazer.dispose(), this._teleportationTarget && this._teleportationTarget.dispose(), this.xr && this.xr.dispose(), this._floorMeshesCollection.length = 0, document.removeEventListener("keydown", this._onKeyDown), window.removeEventListener("vrdisplaypresentchange", this._onVrDisplayPresentChangeBind), window.removeEventListener("resize", this._onResize), document.removeEventListener("fullscreenchange", this._onFullscreenChange), this._scene.gamepadManager.onGamepadConnectedObservable.removeCallback(this._onNewGamepadConnected), this._scene.unregisterBeforeRender(this._beforeRender);
  }
  /**
   * Gets the name of the VRExperienceHelper class
   * @returns "VRExperienceHelper"
   */
  getClassName() {
    return "VRExperienceHelper";
  }
}
P.TELEPORTATIONMODE_CONSTANTTIME = 0;
P.TELEPORTATIONMODE_CONSTANTSPEED = 1;
export {
  le as A,
  B as D,
  re as F,
  qe as N,
  vt as O,
  Be as R,
  P as V,
  K as W,
  E as a,
  G as b,
  ce as c,
  ue as d,
  _e as e,
  He as f,
  Qe as g,
  M as h,
  he as i,
  Y as j,
  ze as k,
  Ue as l,
  I as m,
  Xe as s
};
//# sourceMappingURL=vrExperienceHelper-bUq9XdUR.js.map
