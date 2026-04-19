import { M as p } from "./mesh-BIoKPPmW.js";
import { a as u } from "./scene-81J9Z4aI.js";
import { M as f, a, O as c, E as m, i as l } from "./embed-entry-Bb6cfUYP.js";
import { PointerEventTypes as d } from "./pointerEvents-Cd27wOCS.js";
import { R as g } from "./ray-BiBk7bLa.js";
import { C as v } from "./planeBuilder-91fxCRvt.js";
class i {
  /**
   * @internal
   */
  static _RemoveAndStorePivotPoint(t) {
    t && i._PivotCached === 0 && (t.getPivotPointToRef(i._OldPivotPoint), i._PivotPostMultiplyPivotMatrix = t._postMultiplyPivotMatrix, i._OldPivotPoint.equalsToFloats(0, 0, 0) || (t.setPivotMatrix(f.IdentityReadOnly), i._OldPivotPoint.subtractToRef(t.getPivotPoint(), i._PivotTranslation), i._PivotTmpVector.copyFromFloats(1, 1, 1), i._PivotTmpVector.subtractInPlace(t.scaling), i._PivotTmpVector.multiplyInPlace(i._PivotTranslation), t.position.addInPlace(i._PivotTmpVector))), i._PivotCached++;
  }
  /**
   * @internal
   */
  static _RestorePivotPoint(t) {
    t && !i._OldPivotPoint.equalsToFloats(0, 0, 0) && i._PivotCached === 1 && (t.setPivotPoint(i._OldPivotPoint), t._postMultiplyPivotMatrix = i._PivotPostMultiplyPivotMatrix, i._PivotTmpVector.copyFromFloats(1, 1, 1), i._PivotTmpVector.subtractInPlace(t.scaling), i._PivotTmpVector.multiplyInPlace(i._PivotTranslation), t.position.subtractInPlace(i._PivotTmpVector)), this._PivotCached--;
  }
}
i._PivotCached = 0;
i._OldPivotPoint = new a();
i._PivotTranslation = new a();
i._PivotTmpVector = new a();
i._PivotPostMultiplyPivotMatrix = !1;
class n {
  /**
   * Get or set the currentDraggingPointerId
   * @deprecated Please use currentDraggingPointerId instead
   */
  get currentDraggingPointerID() {
    return this.currentDraggingPointerId;
  }
  set currentDraggingPointerID(t) {
    this.currentDraggingPointerId = t;
  }
  /**
   *  If the drag behavior will react to drag events (Default: true)
   */
  set enabled(t) {
    t != this._enabled && this.onEnabledObservable.notifyObservers(t), this._enabled = t;
  }
  get enabled() {
    return this._enabled;
  }
  /**
   * Gets the options used by the behavior
   */
  get options() {
    return this._options;
  }
  /**
   * Sets the options used by the behavior
   */
  set options(t) {
    this._options = t;
  }
  /**
   * Creates a pointer drag behavior that can be attached to a mesh
   * @param options The drag axis or normal of the plane that will be dragged across. If no options are specified the drag plane will always face the ray's origin (eg. camera)
   * @param options.dragAxis
   * @param options.dragPlaneNormal
   */
  constructor(t) {
    this._useAlternatePickedPointAboveMaxDragAngleDragSpeed = -1.1, this._activeDragButton = -1, this.maxDragAngle = 0, this.dragButtons = [0, 1, 2], this._useAlternatePickedPointAboveMaxDragAngle = !1, this.currentDraggingPointerId = -1, this.dragging = !1, this.dragDeltaRatio = 0.2, this.updateDragPlane = !0, this._debugMode = !1, this._moving = !1, this.onDragObservable = new c(), this.onDragStartObservable = new c(), this.onDragEndObservable = new c(), this.onEnabledObservable = new c(), this.moveAttached = !0, this._enabled = !0, this.startAndReleaseDragOnPointerEvents = !0, this.detachCameraControls = !0, this.useObjectOrientationForDragging = !0, this.validateDrag = (o) => !0, this._tmpVector = new a(0, 0, 0), this._alternatePickedPoint = new a(0, 0, 0), this._worldDragAxis = new a(0, 0, 0), this._targetPosition = new a(0, 0, 0), this._attachedToElement = !1, this._startDragRay = new g(new a(), new a()), this._lastPointerRay = {}, this._dragDelta = new a(), this._pointA = new a(0, 0, 0), this._pointC = new a(0, 0, 0), this._localAxis = new a(0, 0, 0), this._lookAt = new a(0, 0, 0), this._options = t || {};
    let s = 0;
    if (this._options.dragAxis && s++, this._options.dragPlaneNormal && s++, s > 1)
      throw "Multiple drag modes specified in dragBehavior options. Only one expected";
  }
  /**
   *  The name of the behavior
   */
  get name() {
    return "PointerDrag";
  }
  /**
   *  Initializes the behavior
   */
  init() {
  }
  /**
   * Attaches the drag behavior the passed in mesh
   * @param ownerNode The mesh that will be dragged around once attached
   * @param predicate Predicate to use for pick filtering
   */
  attach(t, s) {
    this._scene = t.getScene(), t.isNearGrabbable = !0, this.attachedNode = t, n._PlaneScene || (this._debugMode ? n._PlaneScene = this._scene : (n._PlaneScene = new u(this._scene.getEngine(), { virtual: !0 }), n._PlaneScene.detachControl(), this._scene.onDisposeObservable.addOnce(() => {
      n._PlaneScene.dispose(), n._PlaneScene = null;
    }))), this._dragPlane = v("pointerDragPlane", { size: this._debugMode ? 1 : 1e4, updatable: !1, sideOrientation: p.DOUBLESIDE }, n._PlaneScene), this.lastDragPosition = new a(0, 0, 0);
    const o = s || ((e) => this.attachedNode == e || e.isDescendantOf(this.attachedNode));
    this._pointerObserver = this._scene.onPointerObservable.add((e) => {
      if (!this.enabled) {
        this._attachedToElement && this.releaseDrag();
        return;
      }
      if (e.type == d.POINTERDOWN)
        this.startAndReleaseDragOnPointerEvents && !this.dragging && e.pickInfo && e.pickInfo.hit && e.pickInfo.pickedMesh && e.pickInfo.pickedPoint && e.pickInfo.ray && o(e.pickInfo.pickedMesh) && this._activeDragButton === -1 && this.dragButtons.indexOf(e.event.button) !== -1 && (this._activeDragButton = e.event.button, this._activePointerInfo = e, this._startDrag(e.event.pointerId, e.pickInfo.ray, e.pickInfo.pickedPoint));
      else if (e.type == d.POINTERUP)
        this.startAndReleaseDragOnPointerEvents && this.currentDraggingPointerId == e.event.pointerId && (this._activeDragButton === e.event.button || this._activeDragButton === -1) && this.releaseDrag();
      else if (e.type == d.POINTERMOVE) {
        const r = e.event.pointerId;
        if (this.currentDraggingPointerId === n._AnyMouseId && r !== n._AnyMouseId) {
          const h = e.event;
          (h.pointerType === "mouse" || !this._scene.getEngine().hostInformation.isMobile && h instanceof MouseEvent) && (this._lastPointerRay[this.currentDraggingPointerId] && (this._lastPointerRay[r] = this._lastPointerRay[this.currentDraggingPointerId], delete this._lastPointerRay[this.currentDraggingPointerId]), this.currentDraggingPointerId = r);
        }
        this._lastPointerRay[r] || (this._lastPointerRay[r] = new g(new a(), new a())), e.pickInfo && e.pickInfo.ray && (this._lastPointerRay[r].origin.copyFrom(e.pickInfo.ray.origin), this._lastPointerRay[r].direction.copyFrom(e.pickInfo.ray.direction), this.currentDraggingPointerId == r && this.dragging && this._moveDrag(e.pickInfo.ray));
      }
    }), this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
      if (this._moving && this.moveAttached) {
        let e = !1;
        i._RemoveAndStorePivotPoint(this.attachedNode), this._targetPosition.subtractToRef(this.attachedNode.absolutePosition, this._tmpVector), this._tmpVector.scaleInPlace(this.dragDeltaRatio), this.attachedNode.getAbsolutePosition().addToRef(this._tmpVector, this._tmpVector), this.validateDrag(this._tmpVector) && (this.attachedNode.setAbsolutePosition(this._tmpVector), e = !0), i._RestorePivotPoint(this.attachedNode), e && this.attachedNode.computeWorldMatrix();
      }
    });
  }
  /**
   * Force release the drag action by code.
   */
  releaseDrag() {
    if (this.dragging && (this.dragging = !1, this.onDragEndObservable.notifyObservers({ dragPlanePoint: this.lastDragPosition, pointerId: this.currentDraggingPointerId, pointerInfo: this._activePointerInfo })), this.currentDraggingPointerId = -1, this._activeDragButton = -1, this._activePointerInfo = null, this._moving = !1, this.detachCameraControls && this._attachedToElement && this._scene.activeCamera && !this._scene.activeCamera.leftCamera) {
      if (this._scene.activeCamera.getClassName() === "ArcRotateCamera") {
        const t = this._scene.activeCamera;
        t.attachControl(t.inputs ? t.inputs.noPreventDefault : !0, t._useCtrlForPanning, t._panningMouseButton);
      } else
        this._scene.activeCamera.attachControl(this._scene.activeCamera.inputs ? this._scene.activeCamera.inputs.noPreventDefault : !0);
      this._attachedToElement = !1;
    }
  }
  /**
   * Simulates the start of a pointer drag event on the behavior
   * @param pointerId pointerID of the pointer that should be simulated (Default: Any mouse pointer ID)
   * @param fromRay initial ray of the pointer to be simulated (Default: Ray from camera to attached mesh)
   * @param startPickedPoint picked point of the pointer to be simulated (Default: attached mesh position)
   */
  startDrag(t = n._AnyMouseId, s, o) {
    this._startDrag(t, s, o);
    let e = this._lastPointerRay[t];
    t === n._AnyMouseId && (e = this._lastPointerRay[Object.keys(this._lastPointerRay)[0]]), e && this._moveDrag(e);
  }
  _startDrag(t, s, o) {
    if (!this._scene.activeCamera || this.dragging || !this.attachedNode)
      return;
    i._RemoveAndStorePivotPoint(this.attachedNode), s ? (this._startDragRay.direction.copyFrom(s.direction), this._startDragRay.origin.copyFrom(s.origin)) : (this._startDragRay.origin.copyFrom(this._scene.activeCamera.position), this.attachedNode.getWorldMatrix().getTranslationToRef(this._tmpVector), this._tmpVector.subtractToRef(this._scene.activeCamera.position, this._startDragRay.direction)), this._updateDragPlanePosition(this._startDragRay, o || this._tmpVector);
    const e = this._pickWithRayOnDragPlane(this._startDragRay);
    e ? (this.dragging = !0, this.currentDraggingPointerId = t, this.lastDragPosition.copyFrom(e), this.onDragStartObservable.notifyObservers({ dragPlanePoint: e, pointerId: this.currentDraggingPointerId, pointerInfo: this._activePointerInfo }), this._targetPosition.copyFrom(this.attachedNode.getAbsolutePosition()), this.detachCameraControls && this._scene.activeCamera && this._scene.activeCamera.inputs && !this._scene.activeCamera.leftCamera && (this._scene.activeCamera.inputs.attachedToElement ? (this._scene.activeCamera.detachControl(), this._attachedToElement = !0) : this._attachedToElement = !1)) : this.releaseDrag(), i._RestorePivotPoint(this.attachedNode);
  }
  _moveDrag(t) {
    this._moving = !0;
    const s = this._pickWithRayOnDragPlane(t);
    if (s) {
      i._RemoveAndStorePivotPoint(this.attachedNode), this.updateDragPlane && this._updateDragPlanePosition(t, s);
      let o = 0;
      this._options.dragAxis ? (this.useObjectOrientationForDragging ? a.TransformCoordinatesToRef(this._options.dragAxis, this.attachedNode.getWorldMatrix().getRotationMatrix(), this._worldDragAxis) : this._worldDragAxis.copyFrom(this._options.dragAxis), s.subtractToRef(this.lastDragPosition, this._tmpVector), o = a.Dot(this._tmpVector, this._worldDragAxis), this._worldDragAxis.scaleToRef(o, this._dragDelta)) : (o = this._dragDelta.length(), s.subtractToRef(this.lastDragPosition, this._dragDelta)), this._targetPosition.addInPlace(this._dragDelta), this.onDragObservable.notifyObservers({
        dragDistance: o,
        delta: this._dragDelta,
        dragPlanePoint: s,
        dragPlaneNormal: this._dragPlane.forward,
        pointerId: this.currentDraggingPointerId,
        pointerInfo: this._activePointerInfo
      }), this.lastDragPosition.copyFrom(s), i._RestorePivotPoint(this.attachedNode);
    }
  }
  _pickWithRayOnDragPlane(t) {
    if (!t)
      return null;
    let s = Math.acos(a.Dot(this._dragPlane.forward, t.direction));
    if (s > Math.PI / 2 && (s = Math.PI - s), this.maxDragAngle > 0 && s > this.maxDragAngle)
      if (this._useAlternatePickedPointAboveMaxDragAngle) {
        this._tmpVector.copyFrom(t.direction), this.attachedNode.absolutePosition.subtractToRef(t.origin, this._alternatePickedPoint), this._alternatePickedPoint.normalize(), this._alternatePickedPoint.scaleInPlace(this._useAlternatePickedPointAboveMaxDragAngleDragSpeed * a.Dot(this._alternatePickedPoint, this._tmpVector)), this._tmpVector.addInPlace(this._alternatePickedPoint);
        const P = a.Dot(this._dragPlane.forward, this._tmpVector);
        return this._dragPlane.forward.scaleToRef(-P, this._alternatePickedPoint), this._alternatePickedPoint.addInPlace(this._tmpVector), this._alternatePickedPoint.addInPlace(this.attachedNode.absolutePosition), this._alternatePickedPoint;
      } else
        return null;
    const o = this._dragPlane.forward, e = this._dragPlane.position, r = t.direction.dot(o);
    if (Math.abs(r) < m)
      return null;
    e.subtractToRef(t.origin, l.Vector3[0]);
    const h = l.Vector3[0].dot(o) / r;
    return h < 0 ? null : (t.direction.scaleToRef(h, l.Vector3[0]), t.origin.add(l.Vector3[0]));
  }
  // Position the drag plane based on the attached mesh position, for single axis rotate the plane along the axis to face the camera
  _updateDragPlanePosition(t, s) {
    this._pointA.copyFrom(s), this._options.dragAxis ? (this.useObjectOrientationForDragging ? a.TransformCoordinatesToRef(this._options.dragAxis, this.attachedNode.getWorldMatrix().getRotationMatrix(), this._localAxis) : this._localAxis.copyFrom(this._options.dragAxis), t.origin.subtractToRef(this._pointA, this._pointC), this._pointC.normalize(), Math.abs(a.Dot(this._localAxis, this._pointC)) > 0.999 ? Math.abs(a.Dot(a.UpReadOnly, this._pointC)) > 0.999 ? this._lookAt.copyFrom(a.Right()) : this._lookAt.copyFrom(a.UpReadOnly) : (a.CrossToRef(this._localAxis, this._pointC, this._lookAt), a.CrossToRef(this._localAxis, this._lookAt, this._lookAt), this._lookAt.normalize()), this._dragPlane.position.copyFrom(this._pointA), this._pointA.addToRef(this._lookAt, this._lookAt), this._dragPlane.lookAt(this._lookAt)) : this._options.dragPlaneNormal ? (this.useObjectOrientationForDragging ? a.TransformCoordinatesToRef(this._options.dragPlaneNormal, this.attachedNode.getWorldMatrix().getRotationMatrix(), this._localAxis) : this._localAxis.copyFrom(this._options.dragPlaneNormal), this._dragPlane.position.copyFrom(this._pointA), this._pointA.addToRef(this._localAxis, this._lookAt), this._dragPlane.lookAt(this._lookAt)) : (this._dragPlane.position.copyFrom(this._pointA), this._dragPlane.lookAt(t.origin)), this._dragPlane.position.copyFrom(this.attachedNode.getAbsolutePosition()), this._dragPlane.computeWorldMatrix(!0);
  }
  /**
   *  Detaches the behavior from the mesh
   */
  detach() {
    this._lastPointerRay = {}, this.attachedNode && (this.attachedNode.isNearGrabbable = !1), this._pointerObserver && this._scene.onPointerObservable.remove(this._pointerObserver), this._beforeRenderObserver && this._scene.onBeforeRenderObservable.remove(this._beforeRenderObserver), this._dragPlane && this._dragPlane.dispose(), this.releaseDrag();
  }
}
n._AnyMouseId = -2;
const M = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PointerDragBehavior: n
}, Symbol.toStringTag, { value: "Module" }));
export {
  n as P,
  i as a,
  M as p
};
//# sourceMappingURL=pointerDragBehavior-mypLvzuT.js.map
