import BABYLON from '@bjs';

import { GameControllerChild } from './GameControllerChild';
import { eqtoBabylonVector } from '../util/vector';
import {
  CAMERA_SPEED_BOOST_MULTIPLIER,
  clampFlySpeed,
} from '../common/cameraSettings';

const { ArcRotateCamera, UniversalCamera, Tools, Vector3 } = BABYLON;

class CameraController extends GameControllerChild {
  /**
   * @type {import('@babylonjs/core/Cameras').UniversalCamera}
   */
  camera = null;
  isLocked = false;
  speedModified = false;
  unmodifiedSpeed = null;
  movementKeys = new Set();
  keyboardMoveObserver = null;
  keyboardMoveScene = null;
  mouseLookActive = false;
  canvasInputActive = false;


  dispose() {
    if (this.camera) {
      this.stopCameraMotion();
      this.camera?.removeBehavior(this.#autoRotationBehavior);
      this.camera.dispose();
    }
    this.detachKeyboardMoveObserver();
    document.removeEventListener(
      'pointerlockchange',
      this.onChangePointerLock,
      false
    );
    document.removeEventListener(
      'mspointerlockchange',
      this.onChangePointerLock,
      false
    );
    document.removeEventListener(
      'mozpointerlockchange',
      this.onChangePointerLock,
      false
    );
    document.removeEventListener(
      'webkitpointerlockchange',
      this.onChangePointerLock,
      false
    );
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
    document.removeEventListener('keypress', this.keyPressHandler);
    document.exitPointerLock();
    if (this.canvas) {
      this.canvas.removeEventListener('wheel', this.scrollHandler);
      this.canvas.removeEventListener('contextmenu', this.contextMenuHandler);
      this.canvas.removeEventListener('pointerdown', this.pointerDownHandler);
      this.canvas.removeEventListener('mousedown', this.pointerDownHandler);
      this.canvas.removeEventListener('pointermove', this.pointerMoveHandler);
      this.canvas.removeEventListener('mousemove', this.pointerMoveHandler);
    }
    document.removeEventListener('pointerup', this.pointerUpHandler);
    document.removeEventListener('mouseup', this.pointerUpHandler);
    document.removeEventListener('pointerdown', this.globalPointerDownHandler, true);
    document.removeEventListener('mousedown', this.globalPointerDownHandler, true);
    this.isLocked = false;
    this.speedModified = false;
    this.unmodifiedSpeed = null;
    this.movementKeys.clear();
    this.mouseLookActive = false;
    this.canvasInputActive = false;
  }

  constructor() {
    super();
    this.onChangePointerLock = this.onChangePointerLock.bind(this);
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.keyUpHandler = this.keyUpHandler.bind(this);
    this.keyPressHandler = this.keyPressHandler.bind(this);
    this.scrollHandler = this.scrollHandler.bind(this);
    this.contextMenuHandler = this.contextMenuHandler.bind(this);
    this.pointerDownHandler = this.pointerDownHandler.bind(this);
    this.pointerMoveHandler = this.pointerMoveHandler.bind(this);
    this.pointerUpHandler = this.pointerUpHandler.bind(this);
    this.globalPointerDownHandler = this.globalPointerDownHandler.bind(this);
    this.sceneMouseDown = this.sceneMouseDown.bind(this);
    this.sceneMouseUp = this.sceneMouseUp.bind(this);
  }

  contextMenuHandler(event) {
    event.preventDefault();
  }

  pointerDownHandler(event) {
    if (!this.canvas || this.isTextInputTarget(event?.target)) {
      return;
    }
    this.canvas.focus({ preventScroll: true });
    this.canvasInputActive = true;
    if (event.button === 0 || event.button === 2) {
      this.mouseLookActive = true;
      event.preventDefault();
    }
  }

  globalPointerDownHandler(event) {
    if (event.target !== this.canvas) {
      this.canvasInputActive = false;
      this.movementKeys.clear();
      this.stopCameraMotion();
    }
  }

  pointerMoveHandler(event) {
    if (!this.camera || (!this.mouseLookActive && !this.isLocked)) {
      return;
    }
    const movementX = event.movementX ?? 0;
    const movementY = event.movementY ?? 0;
    if (movementX === 0 && movementY === 0) {
      return;
    }

    const sensitivity = 0.0025;
    const maxPitch = Math.PI / 2 - 0.01;
    this.camera.rotation.y += movementX * sensitivity;
    this.camera.rotation.x = Math.max(
      -maxPitch,
      Math.min(maxPitch, this.camera.rotation.x + movementY * sensitivity)
    );
    event.preventDefault();
  }

  pointerUpHandler() {
    this.mouseLookActive = false;
    this.stopCameraMotion();
  }

  stopCameraMotion() {
    if (!this.camera) {
      return;
    }
    const direction = this.camera.cameraDirection;
    if (direction) {
      if (typeof direction.set === 'function') {
        direction.set(0, 0, 0);
      } else {
        direction.x = 0;
        direction.y = 0;
        direction.z = 0;
      }
    }
    const rotation = this.camera.cameraRotation;
    if (rotation) {
      if (typeof rotation.set === 'function') {
        rotation.set(0, 0);
      } else {
        rotation.x = 0;
        rotation.y = 0;
      }
    }
  }

  detachKeyboardMoveObserver() {
    if (this.keyboardMoveObserver && this.keyboardMoveScene) {
      this.keyboardMoveScene.onBeforeRenderObservable.remove(
        this.keyboardMoveObserver
      );
    }
    this.keyboardMoveObserver = null;
    this.keyboardMoveScene = null;
  }

  attachKeyboardMoveObserver() {
    this.detachKeyboardMoveObserver();
    if (!this.currentScene) {
      return;
    }
    this.keyboardMoveScene = this.currentScene;
    this.keyboardMoveObserver =
      this.currentScene.onBeforeRenderObservable.add(() =>
        this.applyKeyboardMovement()
      );
  }

  isTextInputTarget(target) {
    const tagName = target?.tagName;
    return (
      target?.isContentEditable ||
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      tagName === 'SELECT'
    );
  }

  shouldHandleCameraKey(event) {
    if (!this.camera || this.isTextInputTarget(event?.target)) {
      return false;
    }
    const target = event?.target;
    const interactiveTarget = target?.closest?.(
      'button, a, [role="button"], [role="menuitem"], input, textarea, select, [contenteditable="true"]'
    );
    if (interactiveTarget && interactiveTarget !== this.canvas) {
      return false;
    }
    if (
      document.querySelector('[role="dialog"], .MuiDialog-root') &&
      document.activeElement !== this.canvas &&
      !this.canvasInputActive
    ) {
      return false;
    }
    return true;
  }

  normalizeMovementKey(key, code = '') {
    switch (`${key}`.toLowerCase()) {
      case 'w':
      case 'keyw':
      case 'arrowup':
      case 'up':
        return 'forward';
      case 's':
      case 'keys':
      case 'arrowdown':
      case 'down':
        return 'backward';
      case 'a':
      case 'keya':
      case 'arrowleft':
      case 'left':
        return 'left';
      case 'd':
      case 'keyd':
      case 'arrowright':
      case 'right':
        return 'right';
      default:
        break;
    }
    if (!code) {
      return '';
    }
    return this.normalizeMovementKey(code, '');
  }

  applyKeyboardMovement(deltaScale = null) {
    if (!this.camera || this.movementKeys.size === 0) {
      return;
    }

    const forward = this.camera.getForwardRay().direction.clone().normalize();
    const right = Vector3.Cross(Vector3.Up(), forward).normalize();
    const move = Vector3.Zero();

    if (this.movementKeys.has('forward')) {
      move.addInPlace(forward);
    }
    if (this.movementKeys.has('backward')) {
      move.subtractInPlace(forward);
    }
    if (this.movementKeys.has('right')) {
      move.addInPlace(right);
    }
    if (this.movementKeys.has('left')) {
      move.subtractInPlace(right);
    }
    if (move.lengthSquared() === 0) {
      return;
    }

    const frameScale =
      deltaScale ??
      Math.max(0.25, Math.min((this.engine?.getDeltaTime?.() ?? 16) / 16, 4));
    const moveSpeed = clampFlySpeed(this.camera.speed);
    this.camera.position.addInPlace(
      move.normalize().scaleInPlace(moveSpeed * frameScale)
    );

    if (window.__spireSagePreview) {
      const stats = {
        effectiveSpeed: moveSpeed,
        frameScale,
        speed: this.camera.speed,
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      };
      window.__spireSageCameraStats = stats;
      const now = Date.now();
      if (!this.lastPreviewMoveLogAt || now - this.lastPreviewMoveLogAt > 1000) {
        this.lastPreviewMoveLogAt = now;
        console.log('[SageCamera] movement', JSON.stringify(stats));
      }
    }
  }

  scrollHandler(event) {
    const delta = event.deltaY;
    const zoomSpeed = 50; // Adjust the speed of zooming
    const zoomDirection = delta > 0 ? -1 : 1; // Determine the direction to zoom

    // Calculate the new position
    const forward = this.camera
      .getTarget()
      .subtract(this.camera.position)
      .normalize();
    forward.scaleInPlace(zoomSpeed * zoomDirection);

    // Update the camera position
    this.camera.position.addInPlace(forward);

    // Prevent the page from scrolling
    event.preventDefault();
  }
  #autoRotationBehavior = null;
  #rotating = false;
  #rotateSpeed = 0.5;
  ensureAutoRotationBehavior() {
    if (!this.#autoRotationBehavior) {
      this.#autoRotationBehavior = new BABYLON.AutoRotationBehavior();
    }
    return this.#autoRotationBehavior;
  }
  rotate(rotate, speed = 0.5) {
    const autoRotationBehavior = this.ensureAutoRotationBehavior();
    this.#rotating = rotate;
    this.#rotateSpeed = speed;
    autoRotationBehavior.idleRotationSpeed = speed;
    autoRotationBehavior.zoomStopsAnimation = false;
    autoRotationBehavior.idleRotationSpinupTime = 1;
    autoRotationBehavior.idleRotationWaitTime = 1;
    if (rotate) {
      autoRotationBehavior.attach(this.camera);
    } else {
      autoRotationBehavior.detach();
    }
  }

  setRotationSpeed(speed) {
    if (this.#autoRotationBehavior) {
      this.#autoRotationBehavior.idleRotationSpeed = speed;
    }
  }

  swapCharacterSelectView(view) {
    this.camera.position.set(view.position.x, view.position.y, view.position.z);
    this.camera.rotation.set(view.rotation.x, view.rotation.y, view.rotation.z);
  }

  onChangePointerLock = () => {
    const controlEnabled =
      document.mozPointerLockElement ||
      document.webkitPointerLockElement ||
      document.msPointerLockElement ||
      document.pointerLockElement ||
      null;
    if (!controlEnabled) {
      this.isLocked = false;
      this.mouseLookActive = false;
      this.stopCameraMotion();
    } else {
      this.isLocked = true;
    }
  };

  keyDownHandler = (e) => {
    const movementKey = this.normalizeMovementKey(e.key, e.code);
    if (movementKey && this.shouldHandleCameraKey(e)) {
      e.preventDefault();
      const wasMoving = this.movementKeys.has(movementKey);
      this.movementKeys.add(movementKey);
      if (!wasMoving) {
        this.applyKeyboardMovement(1);
      }
      return;
    }

    if (e.key === ' ' && this.shouldHandleCameraKey(e)) {
      e.preventDefault();
      this.camera.position.y += 5;
    }
    if (e.key === 'Shift' && !this.speedModified && this.shouldHandleCameraKey(e)) {
      this.speedModified = true;
      this.unmodifiedSpeed = clampFlySpeed(this.camera.speed);
      this.camera.speed = clampFlySpeed(
        this.unmodifiedSpeed * CAMERA_SPEED_BOOST_MULTIPLIER
      );
    }
  };

  keyUpHandler = (e) => {
    const movementKey = this.normalizeMovementKey(e.key, e.code);
    if (movementKey) {
      this.movementKeys.delete(movementKey);
      this.stopCameraMotion();
    }
    if (e.key === 'Shift' && this.speedModified) {
      this.speedModified = false;
      this.camera.speed = clampFlySpeed(this.unmodifiedSpeed ?? this.camera.speed);
      this.unmodifiedSpeed = null;
      this.stopCameraMotion();
    }
  };

  keyPressHandler = (e) => {
    const movementKey = this.normalizeMovementKey(e.key, e.code);
    if (!movementKey || !this.shouldHandleCameraKey(e)) {
      return;
    }
    e.preventDefault();
    if (this.movementKeys.has(movementKey)) {
      return;
    }
    this.movementKeys.add(movementKey);
    this.applyKeyboardMovement(1);
    this.movementKeys.delete(movementKey);
    this.stopCameraMotion();
  };

  /**
   * @param {MouseEvent}e
   */
  sceneMouseDown(e) {
    this.pointerDownHandler(e);
    if (
      (e.button === 2 && !this.isLocked && this.canvas.requestPointerLock) ||
      this.canvas.msRequestPointerLock ||
      this.canvas.mozRequestPointerLock ||
      this.canvas.webkitRequestPointerLock
    ) {
      try {
        this.canvas.requestPointerLock();
      } catch {}
    }
  }

  sceneMouseUp(e) {
    this.mouseLookActive = false;
    this.stopCameraMotion();
    if (e.button === 2) {
      document.exitPointerLock();
    }
    this.rotate(this.#rotating, this.#rotateSpeed);
  }

  createModelCamera = () => {
    this.camera = new ArcRotateCamera(
      '__camera__',
      Tools.ToRadians(45),
      Tools.ToRadians(45),
      10,
      new Vector3(15, 5, 0.6),
      this.currentScene
    );

    this.camera.attachControl(this.canvas);
    this.camera.panningSensibility = 1000;
    this.camera.wheelPrecision = 25;
    const autoRotationBehavior = this.ensureAutoRotationBehavior();
    // Assume camera is your ArcRotateCamera instance.

    // Set the idle rotation speed (in radians per millisecond).
    autoRotationBehavior.idleRotationSpeed = 0.001; // Adjust as needed

    // Optionally, adjust other properties:
    autoRotationBehavior.zoomStopsAnimation = false; // Example setting

    // Attach the behavior to the camera.
    this.camera.addBehavior(autoRotationBehavior);
  };

  /**
   *
   * @param {import('@babylonjs/core').Vector3} position
   * @returns
   */
  createCamera = (position) => {
    if (!position) {
      const { safe_x, safe_y, safe_z } = this.state.zoneInfo ?? {};
      const safePoint = [safe_x, safe_y, safe_z].map(Number);
      position = safePoint.every((coordinate) => Number.isFinite(coordinate))
        ? eqtoBabylonVector(...safePoint)
        : new Vector3(0, 250, 0);
    }
    if (!window.__spireSagePreview && sessionStorage.getItem('cam-loc')) {
      const { x, y, z } = JSON.parse(sessionStorage.getItem('cam-loc'));
      position = new Vector3(x, y, z);
    }
    position.y += 2;
    this.camera = new UniversalCamera(
      '__camera__',
      position,
      this.currentScene
    );
    this.camera.setTarget(position.add(new Vector3(0, 0, 1)));
    this.camera.inertia = 0;
    this.camera.touchAngularSensibility = 5000;
    this.camera.ellipsoid = new Vector3(4, 4.5, 2);
    this.camera.checkCollisions = false;
    if (window.__spireSagePreview) {
      this.camera.inputs?.clear?.();
    } else {
      this.camera.attachControl(this.canvas, true);
    }
    this.camera.keysUp = [];
    this.camera.keysDown = [];
    this.camera.keysRight = [];
    this.camera.keysLeft = [];
    this.camera.keysUpward = [];
    this.camera.speed = clampFlySpeed();
    this.canvas.tabIndex = this.canvas.tabIndex >= 0 ? this.canvas.tabIndex : 0;
    this.canvas.style.touchAction = 'none';
    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
    document.addEventListener('keypress', this.keyPressHandler);
    this.canvas.addEventListener('wheel', this.scrollHandler);
    this.canvas.addEventListener('contextmenu', this.contextMenuHandler);
    this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
    this.canvas.addEventListener('mousedown', this.pointerDownHandler);
    this.canvas.addEventListener('pointermove', this.pointerMoveHandler);
    this.canvas.addEventListener('mousemove', this.pointerMoveHandler);
    document.addEventListener('pointerup', this.pointerUpHandler);
    document.addEventListener('mouseup', this.pointerUpHandler);
    document.addEventListener('pointerdown', this.globalPointerDownHandler, true);
    document.addEventListener('mousedown', this.globalPointerDownHandler, true);
    this.attachKeyboardMoveObserver();

    document.addEventListener(
      'pointerlockchange',
      this.onChangePointerLock,
      false
    );
    document.addEventListener(
      'mspointerlockchange',
      this.onChangePointerLock,
      false
    );
    document.addEventListener(
      'mozpointerlockchange',
      this.onChangePointerLock,
      false
    );
    document.addEventListener(
      'webkitpointerlockchange',
      this.onChangePointerLock,
      false
    );
  };
}

export const cameraController = new CameraController();
