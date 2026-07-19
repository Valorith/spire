import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';

import { useSettingsContext } from '../../context/settings';
import { BabylonSpawn } from '../../viewer/models/BabylonSpawn';
import { useMainContext } from '../main/context';
import { buildModelReviewInventory } from './model-review-data';
import {
  getReviewBounds,
  inspectModelReviewSpawn,
} from './model-review-validation';

import './model-review-workspace.scss';

const REVIEW_STORAGE_KEY = 'spire-sage-model-review-flags-v1';
const VIEW_OPTIONS = [
  { id: 'front', label: 'Front', key: '1' },
  { id: 'side', label: 'Side', key: '2' },
  { id: 'back', label: 'Rear', key: '3' },
];

const getInitialParams = () => {
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get('sageModelView');
  const legacyHeadView = requestedView === 'head';
  const validationModel = `${
    params.get('sageValidateModels') ??
    params.get('sageValidationModels') ??
    ''
  }`.split(',')[0].trim().toLowerCase();
  const number = (name, fallback = 0) => {
    const parsed = Number(params.get(name));
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
  };
  return {
    model: `${params.get('sageModel') ?? validationModel}`.trim().toLowerCase(),
    face: number('sageModelFace'),
    texture: number('sageModelTexture'),
    helmTexture: number('sageModelHelm'),
    faceFocus: params.get('sageModelFaceFocus') === '1' || legacyHeadView,
    view: VIEW_OPTIONS.some((option) => option.id === requestedView)
      ? requestedView
      : 'front',
  };
};

const getSelectionKey = ({ model, face, texture, helmTexture }) =>
  [model, face, texture, helmTexture].join(':');

const readStoredReviews = () => {
  try {
    const value = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) ?? '{}');
    return value && typeof value === 'object' ? value : {};
  } catch (_error) {
    return {};
  }
};

const labelAnimation = (name) => `${name ?? ''}`.replace(/^Clone of /, '') || 'Pose';

const getAnimationFrame = (animationGroup) =>
  Number(animationGroup?.animatables?.[0]?.masterFrame ?? animationGroup?._animatables?.[0]?.masterFrame ?? animationGroup?.from ?? 0);

const isTypingTarget = (target) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  target?.isContentEditable === true;

const StatusBadge = ({ label, pass, neutral = false }) => (
  <span className={`model-review-badge ${neutral ? 'is-neutral' : pass ? 'is-pass' : 'is-fail'}`}>
    <span aria-hidden="true" />
    {label}
  </span>
);

export const ModelReviewWorkspace = () => {
  const {
    gameController,
    loadGameController,
    setModelExporter,
    setZoneDialogOpen,
  } = useMainContext();
  const settings = useSettingsContext();
  const initial = useMemo(getInitialParams, []);
  const inventory = useMemo(buildModelReviewInventory, []);
  const initialIndex = Math.max(
    0,
    inventory.findIndex((entry) => entry.model === initial.model)
  );
  const canvasRef = useRef(null);
  const listRef = useRef(null);
  const runtimeRef = useRef(null);
  const previewRef = useRef(null);
  const loadTokenRef = useRef(0);
  const framingRef = useRef(null);
  const animationFramingRef = useRef(null);
  const viewRef = useRef(initial.view);
  const faceFocusRef = useRef(initial.faceFocus);

  const [runtimeReady, setRuntimeReady] = useState(false);
  const [runtimeStage, setRuntimeStage] = useState('Preparing model renderer');
  const [runtimeError, setRuntimeError] = useState('');
  const [selectedModel, setSelectedModel] = useState(
    inventory[initialIndex]?.model ?? inventory[0]?.model ?? ''
  );
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [face, setFace] = useState(initial.face);
  const [texture, setTexture] = useState(initial.texture);
  const [helmTexture, setHelmTexture] = useState(initial.helmTexture);
  const [view, setView] = useState(initial.view);
  const [faceFocus, setFaceFocus] = useState(initial.faceFocus);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loadedSelectionKey, setLoadedSelectionKey] = useState('');
  const [diagnosticsByModel, setDiagnosticsByModel] = useState({});
  const [modelStage, setModelStage] = useState('Waiting for renderer');
  const [modelError, setModelError] = useState('');
  const [animationName, setAnimationName] = useState('');
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [animationSafety, setAnimationSafety] = useState(null);
  const [reviews, setReviews] = useState(readStoredReviews);
  const [note, setNote] = useState(
    readStoredReviews()[inventory[initialIndex]?.model]?.note ?? ''
  );

  const selectedEntry = useMemo(
    () => inventory.find((entry) => entry.model === selectedModel) ?? inventory[0],
    [inventory, selectedModel]
  );
  const selectedVariant = selectedEntry?.variants?.[0] ?? null;
  const selectionKey = getSelectionKey({
    model: selectedEntry?.model ?? selectedModel,
    face,
    texture,
    helmTexture,
  });
  const selectedReview = reviews[selectedModel] ?? null;
  const maxTexture = Math.max(
    Number(selectedEntry?.appearance?.minTexture ?? 0),
    Number(selectedEntry?.appearance?.maxTexture ?? 0)
  );
  const maxHelmTexture = Math.max(
    Number(selectedEntry?.appearance?.minHelmTexture ?? 0),
    Number(selectedEntry?.appearance?.maxHelmTexture ?? 0)
  );

  const filteredInventory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return inventory.filter((entry) => {
      const matchesQuery = !normalizedQuery ||
        entry.model.includes(normalizedQuery) ||
        entry.variants.some((variant) =>
          `${variant.raceName ?? ''}`.toLowerCase().includes(normalizedQuery)
        );
      if (!matchesQuery) return false;
      if (filter === 'issues') {
        return reviews[entry.model]?.status === 'issue' ||
          diagnosticsByModel[entry.model]?.pass === false;
      }
      if (filter === 'unreviewed') {
        return !reviews[entry.model]?.status;
      }
      return true;
    });
  }, [diagnosticsByModel, filter, inventory, query, reviews]);

  useEffect(() => {
    const index = filteredInventory.findIndex(
      (entry) => entry.model === selectedModel
    );
    if (index < 0 || !listRef.current) return undefined;
    const timer = window.setTimeout(() => {
      const list = listRef.current;
      if (!list) return;
      const rowHeight =
        list.firstElementChild?.getBoundingClientRect?.().height || 42;
      list.scrollTop = Math.max(
        0,
        index * rowHeight - (list.clientHeight - rowHeight) / 2
      );
    }, 100);
    return () => window.clearTimeout(timer);
  }, [filteredInventory, selectedModel]);

  const frameModel = useCallback((
    nextView = 'front',
    focusOnFace = faceFocusRef.current
  ) => {
    const preview = previewRef.current?.preview;
    const runtime = runtimeRef.current;
    const camera = runtime?.camera;
    const canvas = canvasRef.current;
    if (!preview?.rootNode || !camera || !canvas) {
      return;
    }
    let wholeBounds = getReviewBounds(preview.rootNode);
    if (!wholeBounds) {
      return;
    }
    const animationFraming = animationFramingRef.current;
    if (animationFraming?.bounds) {
      const currentRootPosition = preview.rootNode.getAbsolutePosition?.() ??
        preview.rootNode.position;
      const offset = {
        x: Number(currentRootPosition?.x ?? 0),
        y: Number(currentRootPosition?.y ?? 0),
        z: Number(currentRootPosition?.z ?? 0),
      };
      wholeBounds = {
        minimum: {
          x: animationFraming.bounds.minimum.x + offset.x,
          y: animationFraming.bounds.minimum.y + offset.y,
          z: animationFraming.bounds.minimum.z + offset.z,
        },
        maximum: {
          x: animationFraming.bounds.maximum.x + offset.x,
          y: animationFraming.bounds.maximum.y + offset.y,
          z: animationFraming.bounds.maximum.z + offset.z,
        },
        width : animationFraming.bounds.width,
        height: animationFraming.bounds.height,
        depth : animationFraming.bounds.depth,
      };
    }
    const headBounds = focusOnFace
      ? getReviewBounds(preview.rootNode, { headOnly: true })
      : null;
    const bounds = focusOnFace && !headBounds
      ? {
        minimum: {
          x: wholeBounds.minimum.x + wholeBounds.width * 0.25,
          y: wholeBounds.minimum.y + wholeBounds.height * 0.68,
          z: wholeBounds.minimum.z + wholeBounds.depth * 0.25,
        },
        maximum: {
          x: wholeBounds.maximum.x - wholeBounds.width * 0.25,
          y: wholeBounds.maximum.y,
          z: wholeBounds.maximum.z - wholeBounds.depth * 0.25,
        },
        width : wholeBounds.width * 0.5,
        height: wholeBounds.height * 0.32,
        depth : wholeBounds.depth * 0.5,
      }
      : headBounds ?? wholeBounds;
    const target = new Vector3(
      (bounds.minimum.x + bounds.maximum.x) / 2,
      (bounds.minimum.y + bounds.maximum.y) / 2,
      (bounds.minimum.z + bounds.maximum.z) / 2
    );

    const canvasRect = canvas.getBoundingClientRect();
    const railRect = document.querySelector('.model-review-rail')?.getBoundingClientRect();
    const inspectorRect = document.querySelector('.model-review-inspector')?.getBoundingClientRect();
    const toolbarRect = document.querySelector('.model-review-toolbar')?.getBoundingClientRect();
    const clamp = (value, minimum, maximum) =>
      Math.min(maximum, Math.max(minimum, value));
    const stageLeft = clamp(
      (railRect?.right ?? canvasRect.left) - canvasRect.left,
      0,
      canvasRect.width
    );
    const stageRight = clamp(
      (inspectorRect?.left ?? canvasRect.right) - canvasRect.left,
      stageLeft + 1,
      canvasRect.width
    );
    const stageTop = clamp(
      (toolbarRect?.bottom ?? canvasRect.top) - canvasRect.top,
      0,
      canvasRect.height - 1
    );
    const stageWidth = Math.max(1, stageRight - stageLeft);
    const stageHeight = Math.max(1, canvasRect.height - stageTop);
    const normalizedViewport = {
      x     : stageLeft / canvasRect.width,
      // Babylon forwards this normalized value to WebGL, whose viewport
      // origin is at the bottom-left. A zero Y therefore anchors the stage
      // below the top toolbar in CSS coordinates.
      y     : 0,
      width : stageWidth / canvasRect.width,
      height: stageHeight / canvasRect.height,
    };
    camera.viewport = new Viewport(
      normalizedViewport.x,
      normalizedViewport.y,
      normalizedViewport.width,
      normalizedViewport.height
    );

    const aspectRatio = stageWidth / stageHeight;
    const verticalFov = Number(camera.fov) || 0.8;
    const horizontalFov = 2 * Math.atan(
      Math.tan(verticalFov / 2) * aspectRatio
    );
    const horizontalSize = nextView === 'side' ? bounds.width : bounds.depth;
    const viewDepth = nextView === 'side' ? bounds.depth : bounds.width;
    const padding = focusOnFace ? 1.2 : 1.12;
    const distance = Math.max(
      1,
      viewDepth / 2 + Math.max(
        (bounds.height * padding / 2) / Math.tan(verticalFov / 2),
        (horizontalSize * padding / 2) / Math.tan(horizontalFov / 2)
      )
    );
    const positions = {
      front: new Vector3(target.x - distance, target.y, target.z),
      side : new Vector3(target.x, target.y, target.z - distance),
      back : new Vector3(target.x + distance, target.y, target.z),
    };
    // ArcRotateCamera derives its angles and radius from the current target.
    // Set that target first so switching models cannot inherit the prior model's
    // target and end up offset or clipped.
    camera.setTarget(target);
    camera.setPosition?.(positions[nextView] ?? positions.front);
    if (!camera.setPosition) {
      camera.position.copyFrom(positions[nextView] ?? positions.front);
    }
    framingRef.current = {
      distance,
      stage: {
        left  : stageLeft,
        top   : stageTop,
        width : stageWidth,
        height: stageHeight,
      },
      target: { x: target.x, y: target.y, z: target.z },
      viewport: normalizedViewport,
      view: nextView,
      faceFocus: focusOnFace,
      usesAnimationEnvelope: !!animationFraming?.bounds,
    };
    if (window.__spireSageModelReview) {
      window.__spireSageModelReview.framing = framingRef.current;
    }
    runtime.scene.render();
  }, []);

  const reframe = useCallback(() => {
    frameModel(viewRef.current, faceFocusRef.current);
    return framingRef.current;
  }, [frameModel]);

  const getSelectedAnimation = useCallback(() =>
    previewRef.current?.preview?.animationGroups?.find(
      (group) => group.name === animationName
    ) ?? null,
  [animationName]);

  const startAnimation = useCallback((name, { play = true } = {}) => {
    const preview = previewRef.current?.preview;
    if (!preview) return;
    const group = preview.animationGroups.find((candidate) => candidate.name === name);
    preview.animationGroups.forEach((candidate) => candidate.stop?.());
    if (!group) {
      animationFramingRef.current = null;
      setAnimationPlaying(false);
      setAnimationSafety(null);
      return;
    }
    const isPose = preview.isPoseAnimation?.(group) === true;
    const safety = isPose ? { pass: true, pose: true } : preview.validateAnimationBounds?.(group);
    setAnimationSafety(safety ?? { pass: true });
    if (safety?.pass === false) {
      animationFramingRef.current = null;
      setAnimationPlaying(false);
      return;
    }
    animationFramingRef.current = safety?.framingBounds
      ? { bounds: safety.framingBounds }
      : null;
    if (isPose && preview.nativePoseOnly) {
      preview.applyNeutralSkeletonPose?.();
    } else {
      group.play?.(!isPose);
    }
    if ((!play || isPose) && !(isPose && preview.nativePoseOnly)) {
      group.pause?.();
      group.goToFrame?.(Number(group.from ?? 0));
    }
    preview.synchronizeSkeletonPose?.();
    preview.normalizeAnimatedGroundPose?.();
    setAnimationFrame(getAnimationFrame(group));
    setAnimationPlaying(play && !isPose);
    runtimeRef.current?.scene?.render?.();
  }, []);

  const selectModel = useCallback((model) => {
    const entry = inventory.find((candidate) => candidate.model === model);
    setSelectedModel(model);
    setFace(0);
    setTexture(Math.max(0, Number(entry?.appearance?.minTexture ?? 0)));
    setHelmTexture(Math.max(0, Number(entry?.appearance?.minHelmTexture ?? 0)));
  }, [inventory]);

  const runQaStep = useCallback((command = {}) => {
    const requestedModel = `${command.model ?? ''}`.trim().toLowerCase();
    if (
      requestedModel &&
      !inventory.some((entry) => entry.model === requestedModel)
    ) {
      return false;
    }
    if (requestedModel) {
      selectModel(requestedModel);
    }
    if (VIEW_OPTIONS.some((option) => option.id === command.view)) {
      setView(command.view);
    }
    if (typeof command.faceFocus === 'boolean') {
      setFaceFocus(command.faceFocus);
    }
    const applyVariant = (value, setter) => {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) {
        setter(Math.trunc(parsed));
      }
    };
    applyVariant(command.face, setFace);
    applyVariant(command.texture, setTexture);
    applyVariant(command.helmTexture, setHelmTexture);
    return true;
  }, [inventory, selectModel]);

  const chooseRelativeModel = useCallback((offset) => {
    if (!filteredInventory.length) return;
    const index = filteredInventory.findIndex((entry) => entry.model === selectedModel);
    const nextIndex = (Math.max(0, index) + offset + filteredInventory.length) %
      filteredInventory.length;
    selectModel(filteredInventory[nextIndex].model);
  }, [filteredInventory, selectModel, selectedModel]);

  const closeWorkspace = useCallback(() => {
    const url = new URL(window.location.href);
    for (const key of [
      'sageModelReview',
      'sageModel',
      'sageModelFace',
      'sageModelTexture',
      'sageModelHelm',
      'sageModelView',
      'sageModelFaceFocus',
    ]) {
      url.searchParams.delete(key);
    }
    window.history.replaceState(null, '', url.toString());
    window.__spireSageModelReview = null;
    setModelExporter(false);
    setZoneDialogOpen(true);
  }, [setModelExporter, setZoneDialogOpen]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    faceFocusRef.current = faceFocus;
  }, [faceFocus]);

  useEffect(() => {
    let current = true;
    let modelController = null;
    let previousGlowLayer = null;
    let resizeHandler = null;
    const settingsSnapshot = { ...settings };

    (async () => {
      try {
        setRuntimeStage('Loading Sage runtime');
        const controller = gameController ?? await loadGameController();
        const [{ default: bjs }, modelControllerModule] = await Promise.all([
          import('@bjs'),
          import('../../viewer/controllers/ModelController'),
        ]);
        await bjs.prepareZoneViewer((stage) => current && setRuntimeStage(stage));
        if (!current || !canvasRef.current) return;

        modelController = modelControllerModule.modelController;
        controller.ModelController = modelController;
        modelController.setGameController(controller);
        controller.settings = settingsSnapshot;
        setRuntimeStage('Starting neutral model scene');
        await controller.loadEngine(canvasRef.current, settingsSnapshot.webgpu);
        await modelController.initializeModelExporter();
        if (!current) return;

        modelController.swapBackground('none');
        if (modelController.glowLayer) {
          modelController.glowLayer.isEnabled = false;
          modelController.glowLayer.intensity = 0;
        }
        controller.CameraController.rotate(false);
        const scene = modelController.scene;
        scene.environmentTexture?.dispose?.();
        scene.environmentTexture = null;
        scene.environmentIntensity = 0;
        scene.clearColor = new Color4(0.025, 0.035, 0.045, 1);
        const fillLight = new HemisphericLight(
          'model-review-fill',
          new Vector3(0, 1, 0),
          scene
        );
        fillLight.diffuse = new Color3(1, 1, 1);
        fillLight.groundColor = new Color3(0.25, 0.23, 0.2);
        // Match the embedded zone viewer so appearance evidence is not
        // skewed by the retired exporter's HDR environment or glow layer.
        fillLight.intensity = 0.85;
        previousGlowLayer = controller.ZoneController.glowLayer;
        controller.ZoneController.glowLayer = modelController.glowLayer;
        controller.SpawnController.setupSpawnController();
        resizeHandler = () => {
          controller.resize();
          window.requestAnimationFrame(() => frameModel(
            viewRef.current,
            faceFocusRef.current
          ));
        };
        window.addEventListener('resize', resizeHandler);
        runtimeRef.current = {
          camera: controller.CameraController.camera,
          controller,
          fillLight,
          modelController,
          scene,
        };
        setRuntimeStage('Model renderer ready');
        setRuntimeReady(true);
      } catch (error) {
        if (!current) return;
        console.error('[SageModelReview] failed to initialize', error);
        setRuntimeError(error?.message ?? String(error));
        setRuntimeStage('Model renderer failed');
      }
    })();

    return () => {
      current = false;
      loadTokenRef.current++;
      previewRef.current?.preview?.dispose?.();
      previewRef.current?.root?.dispose?.();
      previewRef.current = null;
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      const controller = runtimeRef.current?.controller ?? gameController;
      if (controller?.ZoneController) {
        controller.ZoneController.glowLayer = previousGlowLayer;
      }
      runtimeRef.current?.fillLight?.dispose?.();
      modelController?.dispose?.();
      controller?.stopRenderLoop?.();
      runtimeRef.current = null;
    };
  // Runtime ownership intentionally lasts for the workspace lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameModel]);

  useEffect(() => {
    if (!runtimeReady || !selectedEntry || !runtimeRef.current) return;
    const loadToken = ++loadTokenRef.current;
    const loadSelectionKey = selectionKey;
    let createdPreview = null;
    let createdRoot = null;

    (async () => {
      setModelStage(`Loading ${selectedEntry.model.toUpperCase()}`);
      setModelError('');
      setDiagnostics(null);
      setLoadedSelectionKey('');
      setAnimationName('');
      animationFramingRef.current = null;
      setAnimationPlaying(false);
      previewRef.current?.preview?.dispose?.();
      previewRef.current?.root?.dispose?.();
      previewRef.current = null;

      const { controller, scene } = runtimeRef.current;
      createdRoot = new TransformNode(
        `model-review-${selectedEntry.model}-root`,
        scene
      );
      createdPreview = new BabylonSpawn(
        {
          id: -910000,
          __spireSpawnId: -910000,
          name: `${selectedVariant?.raceName ?? selectedEntry.model} Model Review`,
          race: selectedVariant?.raceId ?? 0,
          gender: selectedVariant?.genderIndex ?? 0,
          face,
          texture,
          helmtexture: helmTexture,
          size: 6,
          x: 0,
          y: 0,
          z: 0,
          heading: 0,
          grid: [],
        },
        selectedEntry.model,
        createdRoot,
        controller.SpawnController.sphereMat
      );

      const previousBulkLoading = window.__spireSageBulkSpawnLoading;
      const previousSkipNameplates = window.__spireSageSkipBulkNameplates;
      window.__spireSageBulkSpawnLoading = true;
      window.__spireSageSkipBulkNameplates = true;
      try {
        const initialized = await createdPreview.initializeSpawn();
        if (!initialized) {
          throw new Error('No renderable model asset was found');
        }
      } finally {
        window.__spireSageBulkSpawnLoading = previousBulkLoading;
        window.__spireSageSkipBulkNameplates = previousSkipNameplates;
      }

      if (loadToken !== loadTokenRef.current) {
        createdPreview.dispose();
        createdRoot.dispose();
        return;
      }

      createdPreview.disposeNameplate?.();
      previewRef.current = { preview: createdPreview, root: createdRoot };
      if (createdPreview.nativePoseOnly) {
        createdPreview.applyNeutralSkeletonPose?.();
      }
      let nextDiagnostics = inspectModelReviewSpawn(createdPreview);
      for (
        let attempt = 0;
        attempt < 20 && nextDiagnostics.appearance.pendingTextureCount > 0;
        attempt++
      ) {
        scene.render();
        await new Promise((resolve) => window.setTimeout(resolve, 75));
        if (loadToken !== loadTokenRef.current) {
          createdPreview.dispose();
          createdRoot.dispose();
          return;
        }
        nextDiagnostics = inspectModelReviewSpawn(createdPreview);
      }
      setDiagnostics(nextDiagnostics);
      setDiagnosticsByModel((current) => ({
        ...current,
        [selectedEntry.model]: nextDiagnostics,
      }));
      const preferred = createdPreview.getPreferredVisualAnimationGroup?.();
      const pose = createdPreview.animationGroups.find((group) =>
        createdPreview.isPoseAnimation?.(group)
      );
      const nextAnimation = preferred ?? pose ?? createdPreview.animationGroups[0] ?? null;
      setAnimationName(nextAnimation?.name ?? '');
      setModelStage(
        `${selectedEntry.model.toUpperCase()} ready · ${createdPreview.resolvedModelAsset ?? createdPreview.loadedModelVariation ?? selectedEntry.model}`
      );
      requestAnimationFrame(() => {
        frameModel(
          viewRef.current,
          faceFocusRef.current
        );
        setLoadedSelectionKey(loadSelectionKey);
      });
    })().catch((error) => {
      if (loadToken !== loadTokenRef.current) return;
      console.error('[SageModelReview] failed to load model', error);
      createdPreview?.dispose?.();
      createdRoot?.dispose?.();
      setModelError(error?.message ?? String(error));
      setModelStage(`${selectedEntry.model.toUpperCase()} failed`);
      setDiagnosticsByModel((current) => ({
        ...current,
        [selectedEntry.model]: { pass: false, error: error?.message ?? String(error) },
      }));
    });

    return () => {
      if (previewRef.current?.preview === createdPreview) return;
      createdPreview?.dispose?.();
      createdRoot?.dispose?.();
    };
  }, [face, frameModel, helmTexture, runtimeReady, selectedEntry, selectedVariant, selectionKey, texture]);

  useEffect(() => {
    if (!animationName || !previewRef.current?.preview) return;
    startAnimation(animationName);
  }, [animationName, startAnimation]);

  useEffect(() => {
    if (!animationName || !previewRef.current?.preview) return undefined;
    const frameTimer = window.setTimeout(
      () => frameModel(view, faceFocus),
      250
    );
    return () => window.clearTimeout(frameTimer);
  }, [animationName, faceFocus, frameModel, view]);

  useEffect(() => {
    frameModel(view, faceFocus);
  }, [faceFocus, frameModel, view]);

  useEffect(() => {
    setNote(reviews[selectedModel]?.note ?? '');
  }, [reviews, selectedModel]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('sageModelReview', '1');
    url.searchParams.set('sageModel', selectedModel);
    url.searchParams.set('sageModelFace', String(face));
    url.searchParams.set('sageModelTexture', String(texture));
    url.searchParams.set('sageModelHelm', String(helmTexture));
    url.searchParams.set('sageModelView', view);
    url.searchParams.set('sageModelFaceFocus', faceFocus ? '1' : '0');
    window.history.replaceState(null, '', url.toString());
  }, [face, faceFocus, helmTexture, selectedModel, texture, view]);

  useEffect(() => {
    const ready = runtimeReady &&
      !!diagnostics &&
      !modelError &&
      loadedSelectionKey === selectionKey;
    const state = {
      qaApiVersion: 1,
      ready,
      model: selectedModel,
      diagnostics,
      framing: framingRef.current,
      stage: modelStage,
      view,
      faceFocus,
      selection: {
        face,
        texture,
        helmTexture,
      },
    };
    window.__spireSageModelReview = {
      ...state,
      reframe,
      runQaStep,
    };
    window.dispatchEvent(new CustomEvent('spire-sage-model-review-state', {
      detail: state,
    }));
  }, [
    diagnostics,
    face,
    faceFocus,
    helmTexture,
    loadedSelectionKey,
    modelError,
    modelStage,
    reframe,
    runQaStep,
    runtimeReady,
    selectedModel,
    selectionKey,
    texture,
    view,
  ]);

  useEffect(() => {
    if (!animationPlaying) return undefined;
    const timer = window.setInterval(() => {
      setAnimationFrame(getAnimationFrame(getSelectedAnimation()));
    }, 100);
    return () => window.clearInterval(timer);
  }, [animationPlaying, getSelectedAnimation]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        chooseRelativeModel(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        chooseRelativeModel(1);
      } else if (event.key === ' ') {
        event.preventDefault();
        const group = getSelectedAnimation();
        if (!group || animationSafety?.pass === false) return;
        if (animationPlaying) group.pause?.();
        else group.play?.(true);
        setAnimationPlaying(!animationPlaying);
      } else if (event.key === '4') {
        setFaceFocus((current) => !current);
      } else {
        const cameraView = VIEW_OPTIONS.find((option) => option.key === event.key);
        if (cameraView) setView(cameraView.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [animationPlaying, animationSafety?.pass, chooseRelativeModel, getSelectedAnimation]);

  const saveReview = (status) => {
    const next = {
      ...reviews,
      [selectedModel]: {
        status,
        note: note.trim(),
        updatedAt: new Date().toISOString(),
        face,
        texture,
        helmTexture,
      },
    };
    setReviews(next);
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next));
  };

  const copyReviewLink = async () => {
    await navigator.clipboard?.writeText?.(window.location.href);
  };

  const animations = previewRef.current?.preview?.animationGroups ?? [];
  const selectedAnimation = animations.find((group) => group.name === animationName);
  const animationFrom = Number(selectedAnimation?.from ?? 0);
  const animationTo = Math.max(animationFrom, Number(selectedAnimation?.to ?? animationFrom));
  const selectedIndex = filteredInventory.findIndex((entry) => entry.model === selectedModel);

  return (
    <main className="model-review-workspace" aria-label="Sage Model Review">
      <canvas id="modelReviewCanvas" ref={canvasRef} aria-label="Model preview canvas" />

      <aside className="model-review-rail" aria-label="Model inventory">
        <div className="model-review-brand">
          <button className="model-review-icon-button" onClick={closeWorkspace} aria-label="Back to Sage">
            ←
          </button>
          <div>
            <strong>Model Review</strong>
            <span>Runtime appearance queue</span>
          </div>
        </div>
        <label className="model-review-search">
          <span className="sr-only">Search models</span>
          <input
            aria-label="Search models"
            placeholder="Search code or race…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="model-review-filter" role="group" aria-label="Model filter">
          {[
            ['all', 'All'],
            ['issues', 'Issues'],
            ['unreviewed', 'Unreviewed'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? 'is-active' : ''}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="model-review-count">
          <span>{filteredInventory.length} models</span>
          <span>{Object.keys(reviews).length} reviewed</span>
        </div>
        <div className="model-review-list" ref={listRef}>
          {filteredInventory.map((entry) => {
            const stored = reviews[entry.model]?.status;
            const runtimeResult = diagnosticsByModel[entry.model];
            const state = stored === 'issue' || runtimeResult?.pass === false
              ? 'issue'
              : stored === 'pass'
                ? 'pass'
                : 'unknown';
            return (
              <button
                key={entry.model}
                data-review-model={entry.model}
                className={entry.model === selectedModel ? 'is-selected' : ''}
                onClick={() => selectModel(entry.model)}
                aria-current={entry.model === selectedModel ? 'true' : undefined}
              >
                <span className={`model-review-dot is-${state}`} aria-hidden="true" />
                <span className="model-review-code">{entry.model.toUpperCase()}</span>
                <span className="model-review-race">
                  {entry.variants.map((variant) => variant.raceName).filter((value, index, values) => values.indexOf(value) === index).slice(0, 2).join(' / ')}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <header className="model-review-toolbar">
        <div className="model-review-navigation">
          <button onClick={() => chooseRelativeModel(-1)} aria-label="Previous model">‹</button>
          <div>
            <strong>{selectedEntry?.model?.toUpperCase()}</strong>
            <span>
              {selectedVariant?.raceName ?? 'Unknown race'} · {Math.max(0, selectedIndex) + 1} / {filteredInventory.length}
            </span>
          </div>
          <button onClick={() => chooseRelativeModel(1)} aria-label="Next model">›</button>
        </div>
        <div className="model-review-views" role="group" aria-label="Camera view">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={view === option.id ? 'is-active' : ''}
              onClick={() => setView(option.id)}
              title={`${option.label} view (${option.key})`}
            >
              {option.label}
              <kbd>{option.key}</kbd>
            </button>
          ))}
          <button
            className={faceFocus ? 'is-active' : ''}
            onClick={() => setFaceFocus((current) => !current)}
            aria-pressed={faceFocus}
            title="Toggle face focus (4)"
          >
            Face focus
            <kbd>4</kbd>
          </button>
        </div>
        <div className="model-review-stage" aria-live="polite">
          <span className={modelError || runtimeError ? 'is-error' : ''} />
          {runtimeError || modelError || (runtimeReady ? modelStage : runtimeStage)}
        </div>
      </header>

      <aside className="model-review-inspector" aria-label="Model evidence inspector">
        <section>
          <div className="model-review-section-heading">
            <span>Evidence</span>
            <button onClick={copyReviewLink}>Copy link</button>
          </div>
          <div className="model-review-badges">
            <StatusBadge label="Orientation" pass={diagnostics?.orientationPass} neutral={!diagnostics} />
            <StatusBadge label="Appearance" pass={diagnostics?.appearance?.invariantPass} neutral={!diagnostics} />
            <StatusBadge label="Animation" pass={diagnostics?.animationPass} neutral={!diagnostics} />
          </div>
          <dl className="model-review-facts">
            <div><dt>Resolved asset</dt><dd>{previewRef.current?.preview?.resolvedModelAsset?.toUpperCase?.() ?? '—'}</dd></div>
            <div><dt>Geometry</dt><dd>{diagnostics ? `${diagnostics.meshCount} meshes` : '—'}</dd></div>
            <div><dt>Materials</dt><dd>{diagnostics ? `${diagnostics.materialCount} / ${diagnostics.textureCount} textured` : '—'}</dd></div>
            <div><dt>Head risks</dt><dd>{diagnostics ? diagnostics.headOrientation.filter((item) => item.risk).length : '—'}</dd></div>
            {diagnostics?.semanticHeadOrientation?.required && (
              <div>
                <dt>Head geometry</dt>
                <dd>{diagnostics.semanticHeadOrientation.pass ? 'Upright' : 'Inverted'}</dd>
              </div>
            )}
            <div><dt>Skeletons</dt><dd>{diagnostics?.skeletonCount ?? '—'}</dd></div>
            <div><dt>Dynamic clips</dt><dd>{diagnostics?.animationVitality?.dynamicGroupCount ?? '—'}</dd></div>
          </dl>
          {diagnostics?.appearance?.invariantViolations?.length > 0 && (
            <div className="model-review-warning">
              {diagnostics.appearance.invariantViolations.join(' · ')}
            </div>
          )}
          {diagnostics?.animationReadiness?.violations?.length > 0 && (
            <div className="model-review-warning">
              {diagnostics.animationReadiness.violations.join(' · ')}
            </div>
          )}
        </section>

        <section>
          <div className="model-review-section-heading"><span>Appearance variants</span></div>
          <div className="model-review-variant-grid">
            <label>
              Face
              <select value={face} onChange={(event) => setFace(Number(event.target.value))}>
                {Array.from({ length: 8 }, (_, index) => <option key={index} value={index}>{index}</option>)}
              </select>
            </label>
            <label>
              Body
              <select value={Math.min(texture, maxTexture)} onChange={(event) => setTexture(Number(event.target.value))}>
                {Array.from({ length: maxTexture + 1 }, (_, index) => <option key={index} value={index}>{index}</option>)}
              </select>
            </label>
            <label>
              Helm
              <select value={Math.min(helmTexture, maxHelmTexture)} onChange={(event) => setHelmTexture(Number(event.target.value))}>
                {Array.from({ length: maxHelmTexture + 1 }, (_, index) => <option key={index} value={index}>{index}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section>
          <div className="model-review-section-heading"><span>Animation</span></div>
          <label className="model-review-field">
            Clip
            <select value={animationName} onChange={(event) => setAnimationName(event.target.value)}>
              {animations.map((group) => (
                <option key={group.name} value={group.name}>{labelAnimation(group.name)}</option>
              ))}
            </select>
          </label>
          <div className="model-review-playback">
            <button
              onClick={() => {
                const group = getSelectedAnimation();
                if (!group || animationSafety?.pass === false) return;
                if (animationPlaying) group.pause?.();
                else group.play?.(true);
                setAnimationPlaying(!animationPlaying);
              }}
              disabled={!selectedAnimation || animationSafety?.pass === false}
              aria-label={animationPlaying ? 'Pause animation' : 'Play animation'}
            >
              {animationPlaying ? 'Ⅱ' : '▶'}
            </button>
            <input
              type="range"
              aria-label="Animation frame"
              min={animationFrom}
              max={animationTo}
              step="0.1"
              value={Math.min(animationTo, Math.max(animationFrom, animationFrame))}
              disabled={!selectedAnimation}
              onChange={(event) => {
                const frame = Number(event.target.value);
                selectedAnimation?.pause?.();
                selectedAnimation?.goToFrame?.(frame);
                setAnimationPlaying(false);
                setAnimationFrame(frame);
                previewRef.current?.preview?.synchronizeSkeletonPose?.();
                frameModel(view, faceFocus);
              }}
            />
            <output>{Math.round(animationFrame)}</output>
          </div>
          {animationSafety?.pass === false && (
            <div className="model-review-warning">Unsafe animated bounds; playback blocked</div>
          )}
        </section>

        <section className="model-review-review-section">
          <div className="model-review-section-heading"><span>Review note</span></div>
          <textarea
            aria-label="Review note"
            placeholder="What looks wrong, and in which view or animation?"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="model-review-review-actions">
            <button
              className={selectedReview?.status === 'pass' ? 'is-pass' : ''}
              onClick={() => saveReview('pass')}
            >
              Looks good
            </button>
            <button
              className={selectedReview?.status === 'issue' ? 'is-issue' : ''}
              onClick={() => saveReview('issue')}
            >
              Flag issue
            </button>
          </div>
        </section>
      </aside>

      <footer className="model-review-hints">
        <span><kbd>←</kbd><kbd>→</kbd> models</span>
        <span><kbd>1–3</kbd> views</span>
        <span><kbd>4</kbd> face focus</span>
        <span><kbd>Space</kbd> animation</span>
      </footer>
    </main>
  );
};
