import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildModelReviewUrl,
  buildRaceAuditUrl,
  buildZoneValidationUrl,
} from './urls.mjs';
import {
  compareApprovedVisualBaseline,
  comparePreviewEvidence,
  evaluatePreviewEvidence,
  runVisualInvariantCanaries,
  visualBaselineKey,
} from './visual-invariants.mjs';

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const shouldCaptureScreenshot = (mode, pass, isFinal = false) =>
  mode === 'always' || (mode === 'failures' && !pass) || (mode === 'final' && isFinal);

const COMPACT_NATIVE_ARM_NORMALIZATION_MODELS = new Set([
  'qcf',
  'clm',
  'clf',
  'com',
  'cof',
]);
// A ratio of -0.5 means the upper arm is at least 30 degrees below horizontal.
// The previous -0.25 threshold allowed visibly T-pose-like compact rigs through.
const MAX_COMPACT_ARM_HORIZONTAL_RATIO = -0.5;

const attachTelemetry = (page, telemetry, scope) => {
  const successfulRequests = new Map();
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const location = message.location();
      const recoveredStatus = [...successfulRequests.entries()].find(
        ([key]) => key.endsWith(` ${location?.url ?? ''}`)
      )?.[1];
      telemetry.consoleErrors.push({
        scope,
        text: message.text(),
        location,
        ...(recoveredStatus
          ? { recovered: true, recoveredStatus }
          : {}),
      });
    }
  });
  page.on('pageerror', (error) => {
    telemetry.pageErrors.push({ scope, message: error.message, stack: error.stack ?? null });
  });
  page.on('requestfailed', (request) => {
    const key = `${request.method()} ${request.url()}`;
    const recoveredStatus = successfulRequests.get(key);
    telemetry.requestFailures.push({
      scope,
      method: request.method(),
      url: request.url(),
      failure: request.failure()?.errorText ?? 'unknown',
      ...(recoveredStatus
        ? { recovered: true, recoveredStatus }
        : {}),
    });
  });
  page.on('response', (response) => {
    if (response.status() < 400) {
      const method = response.request().method();
      const url = response.url();
      successfulRequests.set(`${method} ${url}`, response.status());
      const recoveredFailure = [...telemetry.requestFailures]
        .reverse()
        .find((failure) =>
          failure.scope === scope &&
          failure.method === method &&
          failure.url === url &&
          failure.recovered !== true
        );
      if (recoveredFailure) {
        recoveredFailure.recovered = true;
        recoveredFailure.recoveredStatus = response.status();
      }
      const recoveredHttpError = [...telemetry.httpErrors]
        .reverse()
        .find((error) =>
          error.scope === scope &&
          error.method === method &&
          error.url === url &&
          error.recovered !== true
        );
      if (recoveredHttpError) {
        recoveredHttpError.recovered = true;
        recoveredHttpError.recoveredStatus = response.status();
      }
      if (recoveredFailure || recoveredHttpError) {
        const recoveredConsoleError = [...telemetry.consoleErrors]
          .reverse()
          .find((error) =>
            error.scope === scope &&
            error.location?.url === url &&
            error.recovered !== true
          );
        if (recoveredConsoleError) recoveredConsoleError.recovered = true;
      }
    }
    if (response.status() >= 400) {
      telemetry.httpErrors.push({
        scope,
        status: response.status(),
        method: response.request().method(),
        url: response.url(),
      });
    }
  });
};

const startTrace = async (context, mode) => {
  if (mode === 'never') return false;
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  return true;
};

const finishTrace = async ({ context, active, tracePath, keep }) => {
  if (!active) return;
  await context.tracing.stop({ path: tracePath });
  if (!keep) await fs.rm(tracePath, { force: true });
};

const createContext = async ({ browser, profile }) => {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });

  await context.addInitScript(({ seed }) => {
    let state = seed >>> 0;
    Math.random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
    window.__spireSageQaSeed = seed;
  }, { seed: Number(profile.visualValidation?.seed ?? 0x5a6e2026) });

  // The release banner is unrelated to renderer QA. Keeping it deterministic
  // prevents every disposable context from depending on external network access.
  await context.route(
    'https://api.github.com/repos/Valorith/spire/releases?per_page=10',
    (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
  return context;
};

const screenshot = async (page, filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await page.screenshot({ path: filePath, type: 'jpeg', quality: 85, fullPage: false });
};

const stabilizePreview = (page, fixedAnimationFraction, requestedModel) => page.evaluate(
  ({ fraction, requestedModelCode }) => {
    const scene =
      window.gameController?.currentScene ??
      window.gameController?.ZoneController?.currentScene ??
      null;
    if (!scene) return { available: false, animationGroupCount: 0 };
    const normalizeName = (value) => `${value ?? ''}`
      .replace(/^Clone of /, '')
      .toLowerCase();
    const model = normalizeName(requestedModelCode).slice(0, 3);
    const controllerSpawns = Object.values(
      window.gameController?.SpawnController?.spawns ?? {}
    );
    const sceneSpawns = [
      ...(scene.rootNodes ?? []),
      ...(scene.transformNodes ?? []),
      ...(scene.meshes ?? []),
    ].map((node) => node?.babylonSpawn).filter(Boolean);
    const spawns = [...new Set([...sceneSpawns, ...controllerSpawns])];
    const previewSpawns = spawns.filter((entry) =>
      /face preview/i.test(`${entry?.spawn?.name ?? entry?.rootNode?.name ?? ''}`)
    );
    const spawn = previewSpawns.find(
      (entry) =>
        normalizeName(entry?.modelName).slice(0, 3) === model
    ) ?? previewSpawns[0] ?? spawns.find(
      (entry) => normalizeName(entry?.modelName).slice(0, 3) === model
    );
    const root = spawn?.rootNode ?? null;
    const nodes = root
      ? [root, ...(root.getDescendants?.(false) ?? [])]
      : [];
    const nodeSet = new Set(nodes);
    const renderedMeshes = nodes.filter(
      (node) => typeof node?.getTotalVertices === 'function' && node.getTotalVertices() > 0
    );
    const skeletons = [...new Set([
      ...(spawn?.instanceContainer?.skeletons ?? []),
      ...(spawn?.skeletons ?? []),
      root?.skeleton,
      ...renderedMeshes.map((mesh) => mesh?.skeleton),
    ].filter(Boolean))];
    const nativePoseOnly = spawn?.nativePoseOnly === true;
    const previewAnimationDonorExpected =
      spawn?.previewAnimationDonor?.expected === true;
    const expectedMotion =
      !!spawn &&
      skeletons.length > 0 &&
      (!nativePoseOnly || previewAnimationDonorExpected);
    const preferredGroup = spawn?.getPreferredVisualAnimationGroup?.() ?? null;
    const frameFractions = [0.1, 0.37, 0.63, 0.9];
    const capturePose = (animationGroup) => {
      const values = [];
      let nonFiniteValueCount = 0;
      const append = (matrix) => {
        for (const value of Array.from(matrix ?? [])) {
          if (Number.isFinite(value)) values.push(Number(value));
          else {
            values.push(null);
            nonFiniteValueCount++;
          }
        }
      };
      for (const skeleton of skeletons) {
        skeleton.computeAbsoluteTransforms?.();
        for (const bone of skeleton.bones ?? []) {
          append(bone?.getFinalMatrix?.()?.m ?? bone?._finalMatrix?.m);
        }
      }
      const seenTargets = new Set();
      for (const targetedAnimation of animationGroup?.targetedAnimations ?? []) {
        const target = targetedAnimation?.target;
        if (!target || seenTargets.has(target)) continue;
        seenTargets.add(target);
        if (typeof target.getFinalMatrix === 'function') {
          append(target.getFinalMatrix()?.m ?? target?._finalMatrix?.m);
        } else if (nodeSet.has(target) && typeof target.getWorldMatrix === 'function') {
          target.computeWorldMatrix?.(true);
          append(target.getWorldMatrix()?.m);
        }
      }
      return { values, nonFiniteValueCount, targetCount: seenTargets.size };
    };
    let motion = {
      available: !!spawn && (!expectedMotion || !!preferredGroup),
      expectedMotion,
      nativePoseOnly,
      groupName: preferredGroup?.name ?? null,
      frameCount: 0,
      maximumPoseDelta: 0,
      changedValueCount: 0,
      nonFiniteValueCount: 0,
      moving: false,
    };
    if (preferredGroup && expectedMotion) {
      const from = Number(preferredGroup.from ?? 0);
      const to = Number(preferredGroup.to ?? from);
      const samples = [];
      preferredGroup.pause?.();
      for (const sampleFraction of frameFractions) {
        preferredGroup.goToFrame?.(from + ((to - from) * sampleFraction));
        scene.render?.();
        scene.render?.();
        samples.push(capturePose(preferredGroup));
      }
      const baseline = samples[0]?.values ?? [];
      let maximumPoseDelta = 0;
      let changedValueCount = 0;
      let nonFiniteValueCount = 0;
      for (const sample of samples) {
        nonFiniteValueCount += sample.nonFiniteValueCount;
        if (sample.values.length !== baseline.length) continue;
        for (let index = 0; index < baseline.length; index += 1) {
          const left = baseline[index];
          const right = sample.values[index];
          if (!Number.isFinite(left) || !Number.isFinite(right)) continue;
          const delta = Math.abs(right - left);
          maximumPoseDelta = Math.max(maximumPoseDelta, delta);
          changedValueCount += delta > 0.00001 ? 1 : 0;
        }
      }
      motion = {
        ...motion,
        frameCount: samples.length,
        valueCount: baseline.length,
        targetCount: samples[0]?.targetCount ?? 0,
        maximumPoseDelta,
        changedValueCount,
        nonFiniteValueCount,
        moving: maximumPoseDelta > 0.00001 && changedValueCount > 0,
      };
    }
    scene.animationTimeScale = 0;
    for (const group of scene.animationGroups ?? []) {
      try {
        const from = Number(group.from ?? 0);
        const to = Number(group.to ?? from);
        group.pause?.();
        group.goToFrame?.(from + ((to - from) * fraction));
      } catch (_error) {}
    }
    scene.render?.();
    scene.render?.();
    // The preview component initially frames the camera while its selected
    // animation is still advancing. Re-seeking the animation alone therefore
    // leaves a timing-dependent camera position even though the model pose is
    // deterministic. Reframe from the frozen, skinned bounds so the same model
    // cannot move around the screenshot between processes or repetitions.
    const boundsForMeshes = (meshes) => {
      const minimum = { x: Infinity, y: Infinity, z: Infinity };
      const maximum = { x: -Infinity, y: -Infinity, z: -Infinity };
      for (const mesh of meshes) {
        try {
          mesh.computeWorldMatrix?.(true);
          mesh.refreshBoundingInfo?.(true, true);
          const box = mesh.getBoundingInfo?.()?.boundingBox;
          for (const axis of ['x', 'y', 'z']) {
            minimum[axis] = Math.min(minimum[axis], Number(box?.minimumWorld?.[axis]));
            maximum[axis] = Math.max(maximum[axis], Number(box?.maximumWorld?.[axis]));
          }
        } catch (_error) {}
      }
      const values = [minimum.x, minimum.y, minimum.z, maximum.x, maximum.y, maximum.z];
      if (!values.every(Number.isFinite)) return null;
      return {
        width: maximum.x - minimum.x,
        height: maximum.y - minimum.y,
        depth: maximum.z - minimum.z,
        minimum,
        maximum,
      };
    };
    const materialNamesForMesh = (mesh) => {
      const material = mesh?.material;
      if (!Array.isArray(material?.subMaterials)) {
        return material?.name ? [`${material.name}`] : [];
      }
      const usedIndices = new Set(
        (mesh.subMeshes ?? [])
          .map((subMesh) => Number(subMesh?.materialIndex))
          .filter((index) => Number.isInteger(index) && index >= 0)
      );
      const candidates = usedIndices.size > 0
        ? [...usedIndices].map((index) => material.subMaterials[index])
        : material.subMaterials;
      return candidates.map((candidate) => `${candidate?.name ?? ''}`).filter(Boolean);
    };
    const previewBounds = boundsForMeshes(renderedMeshes);
    let cameraFraming = null;
    const camera = scene.activeCamera;
    const modelReview = window.__spireSageModelReview;
    if (
      camera &&
      previewBounds &&
      modelReview?.ready === true &&
      typeof modelReview.reframe === 'function'
    ) {
      cameraFraming = modelReview.reframe();
      scene.render?.();
      scene.render?.();
    } else if (camera && previewBounds) {
      const params = new URLSearchParams(window.location.search);
      const close = params.has('sageRaceFacePreviewClose');
      const requestedDistance = Number(params.get('sageRaceFacePreviewDistance') ?? 4.5);
      const headMaterialPattern = /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i;
      const headMeshes = renderedMeshes.filter((mesh) =>
        [mesh?.name, ...materialNamesForMesh(mesh)].some((name) =>
          headMaterialPattern.test(`${name ?? ''}`)
        )
      );
      const closeBounds = close ? boundsForMeshes(headMeshes) : null;
      const height = Math.max(1, previewBounds.height);
      const target = {
        x: (previewBounds.minimum.x + previewBounds.maximum.x) / 2,
        y: (previewBounds.minimum.y + previewBounds.maximum.y) / 2,
        z: (previewBounds.minimum.z + previewBounds.maximum.z) / 2,
      };
      if (close) {
        if (closeBounds) {
          target.x = (closeBounds.minimum.x + closeBounds.maximum.x) / 2;
          target.y = (closeBounds.minimum.y + closeBounds.maximum.y) / 2;
          target.z = (closeBounds.minimum.z + closeBounds.maximum.z) / 2;
        } else {
          target.y = previewBounds.minimum.y + height * 0.82;
        }
        target.y += 1.1;
      }
      const closeSpan = closeBounds
        ? Math.max(1, closeBounds.width, closeBounds.height, closeBounds.depth)
        : 1;
      const distance = close
        ? Math.max(8, Number.isFinite(requestedDistance) ? requestedDistance : 4.5, closeSpan * 1.8)
        : Math.max(7, height * 1.7, previewBounds.depth * 1.8);
      camera.position.x = target.x - distance;
      camera.position.y = target.y + (close ? 0 : height * 0.08);
      camera.position.z = target.z;
      const targetVector = camera.getTarget?.()?.clone?.() ?? camera.position.clone?.();
      if (targetVector) {
        targetVector.x = target.x;
        targetVector.y = target.y;
        targetVector.z = target.z;
        camera.setTarget?.(targetVector);
      }
      const previewLight = scene.lights?.find(
        (light) => `${light?.name ?? ''}` === 'race-face-preview-light'
      );
      previewLight?.position?.copyFrom?.(camera.position);
      scene.render?.();
      scene.render?.();
      cameraFraming = { close, distance, target };
    }
    return {
      available: true,
      animationGroupCount: scene.animationGroups?.length ?? 0,
      fraction,
      motion,
      cameraFraming,
      surface: modelReview?.ready === true ? 'model-review' : 'race-audit',
    };
  },
  {
    fraction: Number(fixedAnimationFraction ?? 0.35),
    requestedModelCode: `${requestedModel ?? ''}`,
  }
);

const collectPreviewEvidence = (page, requestedModel) => page.evaluate(
  async ({ model, compactModels }) => {
    const normalizeName = (value) => `${value ?? ''}`
      .replace(/^Clone of /, '')
      .toLowerCase();
    const getTexture = (material) =>
      material?.albedoTexture ??
      material?._albedoTexture ??
      material?.diffuseTexture ??
      material?._diffuseTexture ??
      material?.emissiveTexture ??
      material?._emissiveTexture ??
      null;
    const isEffectOnlyMaterial = (material) =>
      material?.metadata?.boundary === true ||
      material?.metadata?.gltf?.extras?.boundary === true ||
      material?.metadata?.extras?.boundary === true;
    const textureReady = (texture) => {
      if (!texture) return false;
      if (typeof texture.isReady === 'function') return texture.isReady();
      if (typeof texture.isReady === 'boolean') return texture.isReady;
      return texture?._texture?.isReady !== false;
    };
    const textureSize = (texture) => {
      const size = texture?.getSize?.() ?? {};
      const internal = texture?.getInternalTexture?.() ?? texture?._texture;
      return {
        width: Number(size.width ?? internal?.width ?? 0),
        height: Number(size.height ?? internal?.height ?? 0),
      };
    };
    const controllerSpawns = Object.values(
      window.gameController?.SpawnController?.spawns ?? {}
    );
    const scene =
      window.gameController?.currentScene ??
      window.gameController?.ZoneController?.currentScene ??
      null;
    const sceneSpawns = [
      ...(scene?.rootNodes ?? []),
      ...(scene?.transformNodes ?? []),
      ...(scene?.meshes ?? []),
    ]
      .map((node) => node?.babylonSpawn)
      .filter(Boolean);
    const uniqueSpawns = [...new Set([...sceneSpawns, ...controllerSpawns])];
    const previewSpawns = uniqueSpawns.filter((entry) =>
      /face preview/i.test(`${entry?.spawn?.name ?? entry?.rootNode?.name ?? ''}`)
    );
    const spawn = previewSpawns.find(
      (entry) =>
        normalizeName(entry?.modelName).slice(0, 3) === model
    ) ?? previewSpawns[0] ?? uniqueSpawns.find(
      (entry) => normalizeName(entry?.modelName).slice(0, 3) === model
    );
    if (!spawn?.rootNode) {
      return {
        model,
        available: false,
        pass: false,
        reason: 'preview-spawn-not-found',
      };
    }

    const nodes = [
      spawn.rootNode,
      ...(spawn.rootNode.getDescendants?.(false) ?? []),
    ];
    const renderedMeshes = [...new Set(nodes)].filter(
      (node) =>
        typeof node?.getTotalVertices === 'function' &&
        node.getTotalVertices() > 0 &&
        node.isEnabled?.() !== false &&
        node.isVisible !== false &&
        Number(node.visibility ?? 1) > 0
    );
    const skeletons = [...new Set([
      ...(spawn.skeletons ?? []),
      ...renderedMeshes.map((mesh) => mesh.skeleton),
    ].filter(Boolean))];
    const boneRecords = skeletons.flatMap((skeleton) => {
      const mesh = renderedMeshes.find((candidate) => candidate.skeleton === skeleton);
      return (skeleton.bones ?? []).map((bone) => ({ bone, mesh }));
    });
    const materialSlots = [];
    const seenMaterials = new Set();
    const addMaterial = (material) => {
      if (!material) return;
      const key = material.uniqueId ?? material.name;
      if (key !== undefined && seenMaterials.has(key)) return;
      if (key !== undefined) seenMaterials.add(key);
      materialSlots.push(material);
    };
    for (const mesh of renderedMeshes) {
      const material = mesh.material;
      if (!Array.isArray(material?.subMaterials)) {
        addMaterial(material);
        continue;
      }
      const usedIndices = new Set(
        (mesh.subMeshes ?? [])
          .map((subMesh) => Number(subMesh?.materialIndex))
          .filter((index) => Number.isInteger(index) && index >= 0)
      );
      const candidates = usedIndices.size > 0
        ? [...usedIndices].map((index) => material.subMaterials[index])
        : material.subMaterials;
      candidates.forEach(addMaterial);
    }
    const bounds = (() => {
      const minimum = { x: Infinity, y: Infinity, z: Infinity };
      const maximum = { x: -Infinity, y: -Infinity, z: -Infinity };
      for (const mesh of renderedMeshes) {
        try {
          mesh.computeWorldMatrix?.(true);
          mesh.refreshBoundingInfo?.(true, true);
          const box = mesh.getBoundingInfo?.()?.boundingBox;
          for (const axis of ['x', 'y', 'z']) {
            minimum[axis] = Math.min(minimum[axis], Number(box?.minimumWorld?.[axis]));
            maximum[axis] = Math.max(maximum[axis], Number(box?.maximumWorld?.[axis]));
          }
        } catch (_error) {}
      }
      const values = [minimum.x, minimum.y, minimum.z, maximum.x, maximum.y, maximum.z];
      if (!values.every(Number.isFinite)) return null;
      return {
        width: maximum.x - minimum.x,
        height: maximum.y - minimum.y,
        depth: maximum.z - minimum.z,
        minimum,
        maximum,
      };
    })();
    const findNode = (name) => nodes.find(
      (node) => normalizeName(node?.name) === name
    );
    const findBone = (names) => boneRecords.find(
      ({ bone }) => names.includes(normalizeName(bone?.name))
    );
    const position = (candidate) => {
      try {
        const node = candidate?.node ?? candidate;
        const bone = candidate?.bone;
        node?.computeWorldMatrix?.(true);
        const point = bone
          ? bone.getAbsolutePosition?.(candidate.mesh)
          : node?.getAbsolutePosition?.();
        return point
          ? { x: Number(point.x), y: Number(point.y), z: Number(point.z) }
          : null;
      } catch (_error) {
        return null;
      }
    };
    const arm = (side) => {
      const upperNode = findNode(`bi_${side}`);
      const upperBone = upperNode ? null : findBone([
        `bi_${side}`,
        `bibicep${side}`,
        `biclav${side}`,
      ]);
      const upper = upperNode ? { node: upperNode } : upperBone;
      const preferredLowerNames = [
        `for_${side}`,
        `fo_${side}`,
        `arm_${side}`,
      ];
      const descendants = upperNode?.getDescendants?.(false) ?? [];
      const lowerNode = preferredLowerNames
        .map((name) => descendants.find(
          (node) => normalizeName(node?.name) === name
        ))
        .find(Boolean) ?? upperNode?.getChildren?.()[0] ?? null;
      const lowerBone = lowerNode ? null : findBone([
        `for_${side}`,
        `fo_${side}`,
        `arm_${side}`,
        `foforearm${side}`,
      ]);
      const lower = lowerNode ? { node: lowerNode } : lowerBone;
      const upperPosition = position(upper);
      const lowerPosition = position(lower);
      if (!upperPosition || !lowerPosition) {
        return {
          available: false,
          upper: upper?.node?.name ?? upper?.bone?.name ?? null,
          lower: lower?.node?.name ?? lower?.bone?.name ?? null,
        };
      }
      const dx = lowerPosition.x - upperPosition.x;
      const dy = lowerPosition.y - upperPosition.y;
      const dz = lowerPosition.z - upperPosition.z;
      const length = Math.hypot(dx, dy, dz);
      return {
        available: length > 0.00001,
        upper: upper?.node?.name ?? upper?.bone?.name ?? null,
        lower: lower?.node?.name ?? lower?.bone?.name ?? null,
        upperPosition,
        lowerPosition,
        verticalRatio: length > 0.00001 ? dy / length : null,
      };
    };

    const compactExpected = compactModels.includes(model);
    const leftArm = arm('l');
    const rightArm = arm('r');
    const neutralized = spawn.compactNativeArmNeutralized === true;
    const boneNames = skeletons.flatMap((skeleton) =>
      (skeleton.bones ?? []).map((bone) => normalizeName(bone.name))
    ).sort();
    let nonFiniteBoneMatrixCount = 0;
    for (const skeleton of skeletons) {
      for (const bone of skeleton.bones ?? []) {
        const values = bone?.getFinalMatrix?.()?.m ?? bone?._finalMatrix?.m ?? [];
        nonFiniteBoneMatrixCount += Array.from(values).filter(
          (value) => !Number.isFinite(value)
        ).length;
      }
    }
    const textures = materialSlots.map(getTexture).filter(Boolean);
    const ordinarySlots = materialSlots.filter((material) => !isEffectOnlyMaterial(material));
    const untexturedSlots = ordinarySlots.filter((material) => !getTexture(material));
    const materialSignature = materialSlots.map((material) => {
      const texture = getTexture(material);
      const size = textureSize(texture);
      return [
        `${material?.name ?? ''}`.toLowerCase(),
        `${texture?.name ?? texture?.url ?? 'untextured'}`.toLowerCase(),
        size.width,
        size.height,
      ].join(':');
    }).sort().join('|');

    const materialNamesForMesh = (mesh) => {
      const material = mesh?.material;
      if (!Array.isArray(material?.subMaterials)) {
        return material?.name ? [normalizeName(material.name)] : [];
      }
      const usedIndices = new Set(
        (mesh.subMeshes ?? [])
          .map((subMesh) => Number(subMesh?.materialIndex))
          .filter((index) => Number.isInteger(index) && index >= 0)
      );
      const candidates = usedIndices.size > 0
        ? [...usedIndices].map((index) => material.subMaterials[index])
        : material.subMaterials;
      return candidates
        .map((candidate) => normalizeName(candidate?.name).split('_mdf')[0])
        .filter(Boolean);
    };
    const boundsForMesh = (mesh) => {
      try {
        mesh.computeWorldMatrix?.(true);
        mesh.refreshBoundingInfo?.(true, true);
        const box = mesh.getBoundingInfo?.()?.boundingBox;
        const minimum = Object.fromEntries(
          ['x', 'y', 'z'].map((axis) => [axis, Number(box?.minimumWorld?.[axis])])
        );
        const maximum = Object.fromEntries(
          ['x', 'y', 'z'].map((axis) => [axis, Number(box?.maximumWorld?.[axis])])
        );
        if (![...Object.values(minimum), ...Object.values(maximum)].every(Number.isFinite)) {
          return null;
        }
        return {
          width: maximum.x - minimum.x,
          height: maximum.y - minimum.y,
          depth: maximum.z - minimum.z,
          minimum,
          maximum,
          center: {
            x: (minimum.x + maximum.x) / 2,
            y: (minimum.y + maximum.y) / 2,
            z: (minimum.z + maximum.z) / 2,
          },
        };
      } catch (_error) {
        return null;
      }
    };
    const influencingBoneNamesForMesh = (mesh) => {
      try {
        const skeleton = mesh?.skeleton ?? skeletons[0];
        const bones = skeleton?.bones ?? [];
        const indices = mesh?.getVerticesData?.('matricesIndices') ?? [];
        const weights = mesh?.getVerticesData?.('matricesWeights') ?? [];
        const extraIndices = mesh?.getVerticesData?.('matricesIndicesExtra') ?? [];
        const extraWeights = mesh?.getVerticesData?.('matricesWeightsExtra') ?? [];
        const names = new Set();
        const addWeightedIndices = (boneIndices, boneWeights) => {
          const count = Math.min(boneIndices.length, boneWeights.length);
          for (let index = 0; index < count; index++) {
            if (Number(boneWeights[index]) <= 0) {
              continue;
            }
            const boneIndex = Number(boneIndices[index]);
            const boneName = normalizeName(bones[boneIndex]?.name);
            if (boneName) {
              names.add(boneName);
            }
          }
        };
        addWeightedIndices(indices, weights);
        addWeightedIndices(extraIndices, extraWeights);
        return [...names].sort();
      } catch (_error) {
        return [];
      }
    };
    // HE is the character head/face material family. FA is forearm armor, so
    // treating it as a head could let a headless model pass this probe.
    const headMaterialPattern = /^[a-z0-9]{3}he(?:\d{2}|sk)\d{2}$/i;
    const headMeshes = renderedMeshes
      .map((mesh) => ({
        name: mesh?.name ?? '',
        vertexCount: Number(mesh?.getTotalVertices?.() ?? 0),
        materialNames: materialNamesForMesh(mesh),
        influencingBoneNames: influencingBoneNamesForMesh(mesh),
        bounds: boundsForMesh(mesh),
      }))
      .filter((entry) => entry.materialNames.some((name) =>
        headMaterialPattern.test(name)
      ));
    const headBoneRecords = [
      findBone(['he', 'head', 'hehead']),
      findBone(['ne', 'neck', 'neneck01']),
    ].filter(Boolean);
    const headBonePositions = headBoneRecords.map((record) => ({
      name: record?.bone?.name ?? '',
      position: position(record),
    }));

    const pixels = await (async () => {
      try {
        const engine = scene?.getEngine?.();
        const canvas = engine?.getRenderingCanvas?.();
        const width = Number(canvas?.width ?? 0);
        const height = Number(canvas?.height ?? 0);
        scene?.render?.();
        const raw = await engine?.readPixels?.(0, 0, width, height);
        if (!raw || width <= 0 || height <= 0) return null;
        const values = ArrayBuffer.isView(raw) ? raw : new Uint8Array(raw);
        const multiplier = values instanceof Float32Array ? 255 : 1;
        const colorAt = (x, y) => {
          const offset = ((y * width) + x) * 4;
          return [0, 1, 2].map((channel) =>
            Math.max(0, Math.min(255, Number(values[offset + channel] ?? 0) * multiplier))
          );
        };
        const cornerColors = [
          colorAt(0, 0),
          colorAt(width - 1, 0),
          colorAt(0, height - 1),
          colorAt(width - 1, height - 1),
        ];
        const background = [0, 1, 2].map((channel) =>
          cornerColors.reduce((sum, color) => sum + color[channel], 0) / cornerColors.length
        );
        let foregroundPixelCount = 0;
        let whitePixelCount = 0;
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;
        const foreground = new Uint8Array(width * height);
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const [red, green, blue] = colorAt(x, y);
            const distance = Math.hypot(
              red - background[0],
              green - background[1],
              blue - background[2]
            );
            if (distance <= 18) continue;
            foreground[(y * width) + x] = 1;
            foregroundPixelCount += 1;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            if (
              red >= 245 && green >= 245 && blue >= 245 &&
              Math.max(red, green, blue) - Math.min(red, green, blue) <= 8
            ) {
              whitePixelCount += 1;
            }
          }
        }
        const gridSize = 16;
        const sums = Array.from({ length: gridSize * gridSize }, () => [0, 0, 0, 0]);
        if (foregroundPixelCount > 0) {
          const boxWidth = Math.max(1, maxX - minX + 1);
          const boxHeight = Math.max(1, maxY - minY + 1);
          for (let y = minY; y <= maxY; y += 1) {
            for (let x = minX; x <= maxX; x += 1) {
              if (!foreground[(y * width) + x]) continue;
              const gridX = Math.min(gridSize - 1, Math.floor(((x - minX) / boxWidth) * gridSize));
              const gridY = Math.min(gridSize - 1, Math.floor(((y - minY) / boxHeight) * gridSize));
              const bucket = sums[(gridY * gridSize) + gridX];
              const color = colorAt(x, y);
              bucket[0] += color[0];
              bucket[1] += color[1];
              bucket[2] += color[2];
              bucket[3] += 1;
            }
          }
        }
        return {
          width,
          height,
          foregroundPixelCount,
          whitePixelCount,
          whitePixelRatio: foregroundPixelCount > 0
            ? whitePixelCount / foregroundPixelCount
            : null,
          foregroundBounds: foregroundPixelCount > 0
            ? {
              x: minX / width,
              y: minY / height,
              width: (maxX - minX + 1) / width,
              height: (maxY - minY + 1) / height,
            }
            : null,
          signature: sums.flatMap(([red, green, blue, samples]) =>
            samples > 0
              ? [red, green, blue].map((value) => Math.round(value / samples))
              : [0, 0, 0]
          ),
        };
      } catch (error) {
        return { error: error?.message ?? String(error), foregroundPixelCount: 0, signature: [] };
      }
    })();
    return {
      model,
      available: true,
      meshCount: renderedMeshes.length,
      vertexCount: renderedMeshes.reduce(
        (total, mesh) => total + Number(mesh.getTotalVertices?.() ?? 0),
        0
      ),
      runtimeBounds: bounds,
      renderedMaterialCount: materialSlots.length,
      texturedRenderedMaterialCount: textures.length,
      untexturedRenderedMaterialCount: untexturedSlots.length,
      untexturedRenderedMaterials: untexturedSlots.map((material) => material.name).sort(),
      pendingTextureCount: textures.filter((texture) => !textureReady(texture)).length,
      materialSignature,
      headMeshes,
      headBonePositions,
      skeletonCount: skeletons.length,
      boneCount: boneNames.length,
      skeletonSignature: boneNames.join('|'),
      nonFiniteBoneMatrixCount,
      nativePoseOnly: spawn.nativePoseOnly === true,
      previewAnimationDonorExpected:
        spawn.previewAnimationDonor?.expected === true,
      previewAnimationDonorPass:
        spawn.previewAnimationDonor?.pass === true,
      previewAnimationDonorName:
        spawn.previewAnimationDonor?.donorName ?? null,
      previewAnimationDonorFailureReason:
        spawn.previewAnimationDonor?.failureReason ?? null,
      previewAnimationDonorGroupCount: Number(
        spawn.previewAnimationDonor?.attachedGroupCount ?? 0
      ),
      previewAnimationDonorTargetCount: Number(
        spawn.previewAnimationDonor?.attachedTargetCount ?? 0
      ),
      previewAnimationDonorBindRelativeTargetCount: Number(
        spawn.previewAnimationDonor?.bindRelativeTargetCount ?? 0
      ),
      previewAnimationDonorBindLockedRotationTargetNames:
        spawn.previewAnimationDonor?.bindLockedRotationTargetNames ?? [],
      previewAnimationDonorUnmatchedTargetNames:
        spawn.previewAnimationDonor?.unmatchedTargetNames ?? [],
      requestedModelVariation: spawn.requestedModelVariation ?? null,
      loadedModelVariation: spawn.loadedModelVariation ?? null,
      resolvedModelAsset: spawn.resolvedModelAsset ?? null,
      bodyVariantFallback: spawn.bodyVariantFallback === true,
      bodyVariantTextureFallbackApplied:
        spawn.bodyVariantTextureFallbackApplied === true,
      bodyVariantTextureFallbackAppliedCount: Number(
        spawn.bodyVariantTextureFallbackAppliedCount ?? 0
      ),
      bodyVariantTextureFallbackAvailableCount: Number(
        spawn.bodyVariantTextureFallbackAvailableCount ?? 0
      ),
      bodyVariantTextureCoverageRequiredCount: Number(
        spawn.bodyVariantTextureCoverageRequiredCount ?? 0
      ),
      bodyVariantTextureCoverageAppliedCount: Number(
        spawn.bodyVariantTextureCoverageAppliedCount ?? 0
      ),
      secondaryHeadBoneRemapFailureCount: Number(
        spawn.secondaryHeadBoneRemapFailureCount ?? 0
      ),
      compactExpected,
      neutralized,
      targetCount: spawn.compactNativeArmTargetCount ?? 0,
      leftArm,
      rightArm,
      pixels,
    };
  },
  {
    model: `${requestedModel ?? ''}`.slice(0, 3).toLowerCase(),
    compactModels: [...COMPACT_NATIVE_ARM_NORMALIZATION_MODELS],
  }
);

export const getBrowserLaunchOptions = (profile) => ({
  headless: !profile.headed,
  args: [
    '--disable-dev-shm-usage',
    '--enable-precise-memory-info',
    // Current Chromium requires explicit opt-in before its bundled SwiftShader
    // implementation may provide WebGL to a headless page. Without this flag,
    // model-review campaigns wait for readiness until their timeout while the
    // actual viewer has already failed with "WebGL not supported".
    '--enable-unsafe-swiftshader',
  ],
});

export const createTelemetry = () => ({
  consoleErrors: [],
  pageErrors: [],
  requestFailures: [],
  httpErrors: [],
});

export const summarizeTelemetry = (telemetry) => ({
  consoleErrorCount: telemetry.consoleErrors.filter((entry) => !entry.recovered).length,
  recoveredConsoleErrorCount: telemetry.consoleErrors.filter((entry) => entry.recovered).length,
  pageErrorCount: telemetry.pageErrors.length,
  requestFailureCount: telemetry.requestFailures.filter((entry) => !entry.recovered).length,
  recoveredRequestFailureCount: telemetry.requestFailures.filter((entry) => entry.recovered).length,
  httpErrorCount: telemetry.httpErrors.filter((entry) => !entry.recovered).length,
  recoveredHttpErrorCount: telemetry.httpErrors.filter((entry) => entry.recovered).length,
});

export const runZoneValidation = async ({
  browser,
  profile,
  baseUrl,
  eqDirectory,
  runId,
  runDirectory,
  telemetry,
  beforeZone,
  onEvent,
}) => {
  const config = profile.zoneValidation;
  if (!config.enabled) return null;
  const expectedReports = config.zones.length * config.cycles;
  const traceMode = expectedReports <= profile.artifacts.maxTracedZoneReports
    ? profile.artifacts.traceMode
    : 'never';
  const isolatedZones = config.isolateZones !== false;
  const zoneGroups = isolatedZones
    ? config.zones.map((zone) => [zone])
    : [config.zones];
  const reports = [];
  const urls = [];
  const tracePaths = [];
  let pass = true;

  onEvent({
    type: 'phase-start',
    phase: 'zone-validation',
    zones: config.zones,
    cycles: config.cycles,
    expectedReports,
    isolatedZones,
    traceMode,
    traceSuppressedForMemory: traceMode !== profile.artifacts.traceMode,
  });

  for (let index = 0; index < zoneGroups.length; index += 1) {
    const zones = zoneGroups[index];
    const zoneLabel = zones.length === 1 ? zones[0] : 'combined';
    const safeZoneLabel = `${zoneLabel}`.replace(/[^a-z0-9_-]+/gi, '-');
    await beforeZone?.({ index, count: zoneGroups.length, zones });
    const scope = `zones:${profile.name}:${zoneLabel}`;
    const context = await createContext({ browser, profile });
    const tracePath = path.join(
      runDirectory,
      'traces',
      isolatedZones
        ? `zone-validation-${safeZoneLabel}.zip`
        : 'zone-validation.zip'
    );
    const traceActive = await startTrace(context, traceMode);
    const page = await context.newPage();
    attachTelemetry(page, telemetry, scope);
    let result = null;
    let zonePass = false;
    let intentionalClose = false;
    const url = buildZoneValidationUrl({
      baseUrl,
      route: profile.route,
      eqDirectory,
      zones,
      cycles: config.cycles,
      cacheBust: `${runId}-zones-${safeZoneLabel}`,
    });
    urls.push(url);
    onEvent({
      type: 'zone-start',
      phase: 'zone-validation',
      zone: zoneLabel,
      url,
      expectedReports: zones.length * config.cycles,
      traceMode,
    });
    try {
      const crashOrClose = new Promise((_, reject) => {
        page.once('crash', () => reject(new Error(`Zone validation tab crashed: ${zoneLabel}`)));
        page.once('close', () => {
          if (!intentionalClose) {
            reject(new Error(`Zone validation tab closed unexpectedly: ${zoneLabel}`));
          }
        });
      });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await Promise.race([
        page.waitForFunction(
          (expected) => {
            const summary = window.__spireSageValidationSummary;
            return Boolean(summary?.finished) ||
              Number(summary?.reports?.length ?? 0) >= expected;
          },
          zones.length * config.cycles,
          { timeout: config.timeoutMs }
        ),
        crashOrClose,
      ]);
      result = await page.evaluate(
        () => window.__spireSageValidationSummary ?? null
      );
      zonePass = result?.complete === true;
      reports.push(...(result?.reports ?? []));
      if (shouldCaptureScreenshot(profile.artifacts.screenshotMode, zonePass, true)) {
        await screenshot(
          page,
          path.join(
            runDirectory,
            'screenshots',
            `zone-validation-${safeZoneLabel}-final.jpg`
          )
        );
      }
      onEvent({
        type: 'zone-complete',
        phase: 'zone-validation',
        zone: zoneLabel,
        pass: zonePass,
        reportCount: result?.reports?.length ?? 0,
      });
    } catch (error) {
      const partial = await page.evaluate(
        () => window.__spireSageValidationSummary ?? null
      ).catch(() => null);
      reports.push(...(partial?.reports ?? []));
      reports.push({
        zone: zoneLabel,
        validationSequence: { cycle: 0 },
        pass: { all: false },
        loadError: error.message,
      });
      await screenshot(
        page,
        path.join(
          runDirectory,
          'screenshots',
          `zone-validation-${safeZoneLabel}-error.jpg`
        )
      ).catch(() => {});
      onEvent({
        type: 'zone-error',
        phase: 'zone-validation',
        zone: zoneLabel,
        error: error.message,
      });
      zonePass = false;
    } finally {
      pass = pass && zonePass;
      const keepTrace =
        traceMode === 'always' || (traceMode === 'failures' && !zonePass);
      await finishTrace({
        context,
        active: traceActive,
        tracePath,
        keep: keepTrace,
      }).catch(() => {});
      if (keepTrace) tracePaths.push(tracePath);
      intentionalClose = true;
      await context.close().catch(() => {});
    }
  }

  const failureCount = reports.filter((report) => report?.pass?.all !== true).length;
  const complete =
    pass &&
    failureCount === 0 &&
    reports.length >= expectedReports;
  const raw = {
    config: {
      zones: config.zones,
      cycles: config.cycles,
      expectedReports,
      isolatedZones,
    },
    reports,
    finished: true,
    complete,
    failureCount,
  };
  onEvent({
    type: 'phase-complete',
    phase: 'zone-validation',
    pass: complete,
    reportCount: reports.length,
  });
  return {
    pass: complete,
    raw,
    url: urls[0] ?? null,
    urls,
    traceMode,
    tracePaths,
    traceSuppressedForMemory: traceMode !== profile.artifacts.traceMode,
  };
};

export const runRaceAuditBatches = async ({
  browser,
  profile,
  baseUrl,
  eqDirectory,
  models,
  runId,
  runDirectory,
  telemetry,
  beforeBatch,
  onBatchComplete,
  onEvent,
}) => {
  if (!profile.raceAudit.enabled || models.length === 0) return [];
  const batches = chunk(models, profile.raceAudit.batchSize);
  const results = [];
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    await beforeBatch?.({ index, count: batches.length, models: batch });
    const scope = `race-batch:${index + 1}`;
    const context = await createContext({ browser, profile });
    const tracePath = path.join(runDirectory, 'traces', `race-batch-${index + 1}.zip`);
    const traceActive = await startTrace(context, profile.artifacts.traceMode);
    const page = await context.newPage();
    attachTelemetry(page, telemetry, scope);
    let pass = false;
    try {
      const url = buildRaceAuditUrl({
        baseUrl,
        route: profile.route,
        eqDirectory,
        bootstrapZone: profile.raceAudit.bootstrapZone,
        models: batch,
        cacheBust: `${runId}-race-${index + 1}`,
        forceRefresh: profile.raceAudit.forceRefresh === true,
      });
      onEvent({ type: 'batch-start', phase: 'race-audit', batch: index + 1, batchCount: batches.length, models: batch });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(
        (expected) => {
          const audit = window.__spireSageRaceFaceAudit;
          return audit?.complete === true && Number(audit?.auditedModelCount ?? 0) >= expected;
        },
        batch.length,
        { timeout: profile.raceAudit.timeoutMs }
      );
      const audit = await page.evaluate(() => window.__spireSageRaceFaceAudit ?? null);
      pass = audit?.complete === true && Number(audit?.failureCount ?? 0) === 0;
      if (shouldCaptureScreenshot(profile.artifacts.screenshotMode, pass, index === batches.length - 1)) {
        await screenshot(page, path.join(runDirectory, 'screenshots', `race-batch-${index + 1}.jpg`));
      }
      const result = { batch: index + 1, models: batch, pass, audit, url };
      results.push(result);
      await onBatchComplete?.({ index, count: batches.length, result });
      onEvent({ type: 'batch-complete', phase: 'race-audit', batch: index + 1, pass, failures: audit?.failureCount ?? 0 });
    } catch (error) {
      await screenshot(page, path.join(runDirectory, 'screenshots', `race-batch-${index + 1}-error.jpg`)).catch(() => {});
      onEvent({ type: 'batch-error', phase: 'race-audit', batch: index + 1, error: error.message });
      throw error;
    } finally {
      const keepTrace = profile.artifacts.traceMode === 'always' || (profile.artifacts.traceMode === 'failures' && !pass);
      await finishTrace({ context, active: traceActive, tracePath, keep: keepTrace }).catch(() => {});
      await context.close();
    }
  }
  return results;
};

export const runVisualSamples = async ({
  browser,
  profile,
  baseUrl,
  eqDirectory,
  runId,
  runDirectory,
  telemetry,
  beforeSample,
  onEvent,
}) => {
  const canaries = runVisualInvariantCanaries();
  onEvent({ type: 'invariant-canaries', phase: 'visual-samples', ...canaries });
  if (!canaries.pass) {
    throw new Error('Visual invariant mutation canaries did not reject every broken control');
  }
  const approvedBaselinePath = profile.visualValidation?.approvedBaselinePath
    ? path.resolve(profile.visualValidation.approvedBaselinePath)
    : null;
  if (profile.visualValidation?.requireApprovedBaseline === true && !approvedBaselinePath) {
    throw new Error('An approved visual baseline is required but approvedBaselinePath is not configured');
  }
  const approvedBaselineDocument = approvedBaselinePath
    ? JSON.parse(await fs.readFile(approvedBaselinePath, 'utf8'))
    : null;
  if (approvedBaselineDocument && approvedBaselineDocument.schemaVersion !== 1) {
    throw new Error(`Unsupported approved visual baseline schema in ${approvedBaselinePath}`);
  }
  const approvedBaselines = approvedBaselineDocument?.samples ?? {};
  const results = [];
  const visualSurface = profile.visualValidation?.surface ?? 'race-audit';
  const repetitions = Math.max(2, Math.trunc(Number(
    profile.visualValidation?.repetitions ?? 2
  )));
  for (let index = 0; index < profile.visualSamples.length; index += 1) {
    const sample = profile.visualSamples[index];
    const orientationSuffix = Object.hasOwn(sample, 'view')
      ? `-view-${`${sample.view}`.trim().toLowerCase()}${sample.faceFocus === true ? '-face-focus' : ''}`
      : Object.hasOwn(sample, 'heading')
        ? `-heading-${sample.heading}`
        : '';
    await beforeSample?.({ index, count: profile.visualSamples.length, sample });
    const observations = [];
    const observationAnalyses = [];
    const approvedBaselineAnalyses = [];
    const auditPasses = [];
    let firstAudit = null;
    let firstUrl = null;
    let sampleError = null;
    try {
      onEvent({ type: 'sample-start', phase: 'visual-samples', sample });
      for (let repetition = 0; repetition < repetitions; repetition += 1) {
        const scope = `visual:${sample.model}:repeat-${repetition + 1}`;
        const context = await createContext({ browser, profile });
        const page = await context.newPage();
        attachTelemetry(page, telemetry, scope);
        try {
          const cacheBust = `${runId}-visual-${index + 1}-repeat-${repetition + 1}`;
          const url = visualSurface === 'model-review'
            ? buildModelReviewUrl({
              baseUrl,
              route: profile.route,
              eqDirectory,
              sample,
              cacheBust,
            })
            : buildRaceAuditUrl({
              baseUrl,
              route: profile.route,
              eqDirectory,
              bootstrapZone: profile.raceAudit.bootstrapZone ?? 'blackburrow',
              models: [sample.model],
              preview: sample,
              cacheBust,
            });
          firstUrl ??= url;
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          if (visualSurface === 'model-review') {
            const reviewUrl = new URL(url);
            await page.waitForFunction(
              ({ model, view, faceFocus, face, texture, helmTexture }) => {
                const review = window.__spireSageModelReview;
                return review?.ready === true &&
                  review.model === model &&
                  review.view === view &&
                  review.faceFocus === faceFocus &&
                  Number(review.selection?.face) === face &&
                  Number(review.selection?.texture) === texture &&
                  Number(review.selection?.helmTexture) === helmTexture;
              },
              {
                model: `${sample.model}`.trim().toLowerCase(),
                view: reviewUrl.searchParams.get('sageModelView'),
                faceFocus: reviewUrl.searchParams.get('sageModelFaceFocus') === '1',
                face: Number(sample.face ?? 0),
                texture: Number(sample.texture ?? 0),
                helmTexture: Number(sample.helmTexture ?? 0),
              },
              { timeout: profile.visualValidation?.timeoutMs ?? 120000 }
            );
          } else {
            await page.waitForFunction(
              () => window.__spireSageRaceFaceAudit?.complete === true,
              null,
              { timeout: profile.visualValidation?.timeoutMs ?? 120000 }
            );
          }
          const audit = visualSurface === 'model-review'
            ? await page.evaluate(() => {
              const review = window.__spireSageModelReview;
              const diagnostics = review?.diagnostics ?? null;
              const pass = review?.ready === true &&
                diagnostics?.pass === true &&
                review?.animationSafety?.pass !== false;
              return {
                complete: review?.ready === true,
                failureCount: pass ? 0 : 1,
                results: [{
                  bounds: diagnostics?.bounds ?? null,
                  fallbackTextureCount: Number(
                    diagnostics?.appearance?.fallbackTextureCount ?? 0
                  ),
                  faceVariantDeterminism: { pass: true },
                  semanticHeadOrientation:
                    diagnostics?.semanticHeadOrientation ?? null,
                  status: pass ? 'pass' : 'fail',
                  verticallyFlippedHeadTextureCount: Number(
                    Array.isArray(diagnostics?.headOrientation)
                      ? diagnostics.headOrientation.filter((item) => item.risk).length
                      : 0
                  ),
                }],
                viewer: {
                  faceFocus: review?.faceFocus ?? false,
                  framing: review?.framing ?? null,
                  model: review?.model ?? null,
                  qaApiVersion: review?.qaApiVersion ?? null,
                  automatedReviewSuggestion:
                    review?.automatedReviewSuggestion ?? null,
                  animationSafety: review?.animationSafety ?? null,
                  selection: review?.selection ?? null,
                  view: review?.view ?? null,
                },
              };
            })
            : await page.evaluate(() => window.__spireSageRaceFaceAudit ?? null);
          firstAudit ??= audit;
          const auditResult = audit?.results?.[0] ?? null;
          const expectedAutomatedResponseConfigured =
            Object.hasOwn(sample, 'expectedAutomatedResponse');
          const actualAutomatedResponse =
            audit?.viewer?.automatedReviewSuggestion?.response ?? null;
          const automatedResponsePass =
            !expectedAutomatedResponseConfigured ||
            actualAutomatedResponse === sample.expectedAutomatedResponse;
          const stabilization = await stabilizePreview(
            page,
            profile.visualValidation?.fixedAnimationFraction,
            sample.model
          );
          const rawEvidence = await collectPreviewEvidence(page, sample.model);
          const evidence = {
            ...rawEvidence,
            staticBounds: auditResult?.bounds ?? null,
            fallbackTextureCount: Number(auditResult?.fallbackTextureCount ?? 0),
            headOrientationRiskCount: Number(
              auditResult?.verticallyFlippedHeadTextureCount ?? 0
            ),
            semanticHeadOrientation:
              auditResult?.semanticHeadOrientation ?? null,
            animationMotion: stabilization?.motion ?? null,
            stabilization,
          };
          const invariantOptions = {
            ...profile.visualValidation,
            ...(sample.invariants ?? {}),
            maximumArmVerticalRatio: evidence.compactExpected
              ? MAX_COMPACT_ARM_HORIZONTAL_RATIO
              : Number(
                sample.invariants?.maximumArmVerticalRatio ??
                profile.visualValidation?.maximumArmVerticalRatio ??
                -0.3
              ),
          };
          const analysis = evaluatePreviewEvidence(evidence, invariantOptions);
          const approvedBaselineAnalysis = compareApprovedVisualBaseline(
            evidence,
            approvedBaselines[visualBaselineKey(sample)],
            invariantOptions
          );
          observations.push(evidence);
          observationAnalyses.push(analysis);
          approvedBaselineAnalyses.push(approvedBaselineAnalysis);
          auditPasses.push(
            audit?.complete === true &&
            Number(audit?.failureCount ?? 0) === 0 &&
            auditResult?.faceVariantDeterminism?.pass !== false &&
            automatedResponsePass
          );
          const baseName = `${String(index + 1).padStart(2, '0')}-${sample.model}-face-${sample.face ?? 0}-texture-${sample.texture ?? 0}${orientationSuffix}`;
          const fileName = repetition === 0
            ? `${baseName}.jpg`
            : `${baseName}-repeat-${repetition + 1}.jpg`;
          await screenshot(page, path.join(runDirectory, 'screenshots', fileName));
        } catch (error) {
          sampleError = error;
          const fileName = `${String(index + 1).padStart(2, '0')}-${sample.model}-repeat-${repetition + 1}-error.jpg`;
          await screenshot(page, path.join(runDirectory, 'screenshots', fileName)).catch(() => {});
          break;
        } finally {
          await context.close();
        }
      }
      if (sampleError) throw sampleError;
      const repeatability = comparePreviewEvidence(
        observations,
        {
          ...profile.visualValidation,
          ...(sample.invariants ?? {}),
        }
      );
      const pass =
        observations.length === repetitions &&
        auditPasses.every(Boolean) &&
        observationAnalyses.every((analysis) => analysis.pass) &&
        approvedBaselineAnalyses.every((analysis) => analysis.pass) &&
        repeatability.pass;
      const fileName = `${String(index + 1).padStart(2, '0')}-${sample.model}-face-${sample.face ?? 0}-texture-${sample.texture ?? 0}${orientationSuffix}.jpg`;
      const result = {
        ...sample,
        surface: visualSurface,
        pass,
        repetitions,
        status: firstAudit?.results?.[0]?.status ?? 'unknown',
        auditPasses,
        observations,
        observationAnalyses,
        approvedBaselineKey: visualBaselineKey(sample),
        approvedBaselineAnalyses,
        repeatability,
        relativeScreenshot: `screenshots/${fileName}`,
        url: firstUrl,
      };
      results.push(result);
      onEvent({
        type: 'sample-complete',
        phase: 'visual-samples',
        pass: result.pass,
        sample: result,
      });
    } catch (error) {
      const fileName = `${String(index + 1).padStart(2, '0')}-${sample.model}-error.jpg`;
      results.push({ ...sample, pass: false, error: error.message, relativeScreenshot: `screenshots/${fileName}` });
      onEvent({ type: 'sample-error', phase: 'visual-samples', sample, error: error.message });
    }
  }
  return results;
};
