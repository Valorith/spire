# Sage QA

Sage QA is the repeatable reliability gate for Spire's embedded EverQuest zone editor. It combines the in-app validation harness, race-appearance audit, static texture inspection, Playwright automation, resource-soak analysis, and bounded artifacts behind one command.

## Commands

Run these from the repository root while LocalSpire or another compatible Spire development server is available at `http://127.0.0.1:8080`:

```powershell
npm run qa:sage:smoke -- --eq-dir C:\EQEmuCW-Live
npm run qa:sage:compact -- --eq-dir C:\EQEmuCW-Live
npm run qa:sage:compact -- --eq-dir C:\EQEmuCW-Live --visual-models clf --no-zone-validation --no-race-audit --no-static-texture-audit
npm run qa:sage:full -- --eq-dir C:\EQEmuCW-Live --race-models hum,huf,ogm --no-zone-validation --no-static-texture-audit
npm run qa:sage:models -- --eq-dir C:\EQEmuCW-Live
npm run qa:sage:matrix -- --eq-dir C:\EQEmuCW-Live
npm run qa:sage:soak -- --eq-dir C:\EQEmuCW-Live
npm run qa:sage:full -- --eq-dir C:\EQEmuCW-Live
npm run qa:sage:fs -- --eq-dir C:\EQEmuCW-Live
npm run qa:sage:coverage -- --eq-dir C:\EQEmuCW-Live
npm run test:sage-qa
```

Use `npm run qa:sage -- --help` for all overrides. `SAGE_EQ_DIR` and `PLAYWRIGHT_BASE_URL` can replace the corresponding command-line options.

`qa:sage:fs` runs a bounded eight-way bridge stress test by default. It repeatedly reads known EQ assets, round-trips temporary 64 KiB files, verifies their bytes, records server-side retry headers and latency, and removes its temporary folder in a `finally` path. Use `--concurrency` and `--rounds` for controlled expansion without involving WebGL.

When a memory guard or outer process interrupts a long race inventory, resume the missing models with `--race-models`, then prove complete coverage with `qa:sage:verify-checkpoints -- --plan-run <original-run> --runs <original-run,continuation-run>`. The verifier requires every planned model exactly within the combined checkpoint set and rejects missing, unexpected, or failed batches.

## Profiles

- `smoke`: three zones, fourteen high-risk race models (including the Qeynos compact rigs), and five deterministic visual samples.
- `compact-rigs`: focused Ak'Anon/Qeynos/Great Divide gate for compact skeletons, secondary heads, and collapsed classic parent-bone chains.
- `model-regression`: focused cross-rig animation, skin, head, and runtime-pose coverage with repeated front/rear evidence for every audited model plus targeted body variants.
- `matrix`: twelve classic and expansion zones, twenty high-risk race models, and five visual samples.
- `soak`: three zones over three cycles with post-warmup resource plateau checks.
- `full`: every available mapped race model, three complete zone cycles, and stricter memory headroom.

Profiles are versioned JSON files in `profiles/`. Add a profile instead of adding one-off query strings or changing the runner. Command-line overrides are intentionally limited to operational concerns such as paths, cycles, batch size, and focused visual-model selection; quality thresholds live in the profile so runs remain reproducible.

## Memory and PC stewardship

The runner is serial by default and owns only one automation browser. It creates a fresh browser context for each race batch and visual sample, then closes it before continuing. The browser itself is closed before final reporting. NPM campaign commands expose V8 garbage collection and invoke it at memory checkpoints, releasing Playwright protocol buffers before the configured runner-RSS guard is evaluated. `--race-models` supports a focused continuation from the durable per-batch checkpoints without raising memory limits or repeating already validated models.

Every expensive phase checks:

- total system memory percentage;
- minimum free system memory;
- runner resident memory and external-buffer ceilings;
- browser-reported JavaScript heap after each zone;
- Babylon scene meshes, materials, textures, skeletons, animation groups, geometries, and transform nodes.

When any system, runner RSS, or runner external-buffer ceiling is exceeded, the runner waits for the configured settling interval and checks again. It fails safely instead of applying more load. It never kills unrelated processes or clears system caches.

Automation Chromium runs with precise memory reporting enabled so repeated-zone heap samples are useful for growth analysis instead of browser-privacy-rounded approximations. Heap and Babylon resource growth are compared per zone against the high-water mark established by the warm-up and baseline cycles. Only later comparison cycles can fail the plateau gate. This prevents naturally different zone footprints and bounded post-cleanup rebounds from being misclassified as leaks.

Artifacts are JPEG-compressed, traces are retained only for failures by default, and old runs are pruned within `tmp/validation/runs` according to both a run-count and total-size budget. Retention code refuses to delete paths outside the configured artifact root.

Continuous Playwright tracing is automatically disabled when a zone campaign exceeds `artifacts.maxTracedZoneReports` (12 by default). Long scene traces can retain gigabytes of protocol buffers even after the trace file is discarded; JSON diagnostics and failure screenshots remain available without putting that pressure on the PC. Profiles with soak analysis must include a warm-up cycle, a baseline cycle, and at least one comparison cycle.

## Coverage model

`coverage.json` is generated from four sources:

1. `raceData.json` for the race/gender-to-model mapping;
2. `raceModelMetadata.json` for texture and helm ranges;
3. `raceAppearancePolicies.json` for models with discrete classic face variants;
4. the selected EQ directory for actually available GLB models.

The same face-policy JSON is imported by the live race audit, preventing the automation manifest and renderer assertions from drifting apart.

Every material check is scoped to submaterials actually referenced by rendered mesh submeshes. A model fails when any used, non-effect material lacks a ready texture; unused GLB material-table entries do not create false failures. Classic face models must expose exactly eight distinct head-texture signatures (default plus faces 1-7), so a renderer that repeats one valid face can no longer pass by changing only material bookkeeping.

## Deterministic visual evidence

Visual samples are not accepted from the page's pass flag alone. The runner independently collects runtime mesh/vertex counts, used-material texture coverage, skeleton and bone signatures, finite bone matrices, world bounds, arm vectors, and a normalized 16x16 WebGL pixel signature. Before the screenshot is frozen at its fixed normalized frame, animation-eligible models must produce finite pose changes across four fixed timeline fractions. Native-pose-only compact rigs are explicitly classified as static instead of being mislabeled as animated. `Math.random` is seeded before application code runs, browser locale/timezone/color/reduced-motion settings are fixed, service workers are blocked, and unrelated release traffic is fulfilled locally.

Each sample is loaded at least twice in fresh browser contexts. Topology/material/skeleton signatures must match exactly; bounds and pixel signatures must remain within versioned profile tolerances. High-risk humanoid samples also require both forearms below the configured horizontal threshold, and selected profiles cap near-white pixel coverage as a second line of defense against white fallback skins.

The `model-regression` profile adds a second, independent comparison against versioned, visually approved baselines in `baselines/model-regression.json`. This catches a consistently wrong renderer that would otherwise reproduce the same upside-down head, shifted geometry, or incorrect skin twice. Mesh, vertex, skeleton, bone, material, and skeleton signatures must match exactly; normalized whole-model pixels, the upper/head region, and foreground framing use narrow tolerances. A configured baseline is mandatory, so a new or renamed high-risk sample fails closed instead of silently skipping reference validation.

Baseline changes are deliberately manual. First run the profile, inspect every selected screenshot, and only then promote the passing evidence with an explicit reviewer:

```powershell
npm run qa:sage:approve-visuals -- --run tmp/validation/runs/<run> --models qcf,fsg --reviewed-by "Reviewer name" --confirm-reviewed
```

The approval command refuses failed, single-run, non-repeatable, or invariant-violating evidence. It records reviewer and source-run provenance. Baseline updates should be reviewed like renderer code; never regenerate them automatically in CI or merely to make a failure green.

The runner executes five mutation canaries before visual work: a visible untextured material, a 10x exploded bound, a topology/pixel-drift repeat, a vertically inverted approved-baseline image, and a motionless animation. All five must be rejected or the campaign aborts. Unit tests separately prove duplicate classic faces, T-poses, partial material coverage, exploded geometry, repeat drift, motionless clips, and a repeatable but visually changed model cannot pass. When calibrating a legitimate model exception, change the narrowest profile tolerance and rerun the canaries plus the affected model twice; never disable the underlying invariant.

Effect-only models are valid without bitmap texture slots when every rendered material is an intentional effect material. The appearance audit records material and effect-only counts per variant so those models do not hide ordinary untextured geometry failures.

The all-model appearance audit instantiates static model containers, so motionless animation groups are reported separately as animation diagnostics instead of being mislabeled as face failures. Runtime T-pose and motion enforcement is performed by the repeated zone matrix after `BabylonSpawn` has initialized and started the actual animation lifecycle. Each live representative is paused and deterministically sought through four timeline fractions; the animation phase fails unless the moving count exactly equals the expected live representative count, with zero stationary clips, zero unresolved detached targets, and zero non-finite matrices. Duplicate same-model NPCs retain a representative static pose to bound memory use, and detached donor targets are repaired onto the instantiated clone hierarchy before playback.

The full profile selects every mapped model that has a base GLB in the EQ asset cache. Explicit profiles fail on unknown model codes rather than silently shrinking coverage.

## Artifacts

Each run receives a unique directory:

```text
tmp/validation/runs/<timestamp>-<profile>/
  plan.json
  coverage.json
  static-texture-audit.json
  zone-validation.json
  race-audit-batches.json
  race-audit-checkpoints/
  visual-samples.json
  telemetry.json
  events.ndjson
  summary.json
  summary.html
  retention.json
  screenshots/
  traces/
```

The HTML report is self-contained except for relative screenshot links. It provides zone, NPC, texture, skeleton, door, animation-resource, JavaScript-heap, race-appearance, visual-sample, and failure summaries.

The browser automation captures page errors, failed requests, HTTP errors, and console errors. All four classes fail by default. Events are appended while the run is active, and every completed race batch receives its own checkpoint, so long campaigns remain observable and retain useful evidence if their outer process is interrupted. A failed filesystem transfer that succeeds through the app's built-in retry remains recorded as recovered evidence but does not fail the campaign; an unrecovered transfer does. The unrelated GitHub release-check endpoint is fulfilled locally in test contexts so campaigns are deterministic, generate no external traffic, and do not mask real browser errors.

Before launching Chromium, the runner walks the complete served JavaScript module graph twice and requires the same successful result. This prevents a Vite watch rebuild from handing the browser an entry chunk whose hashed lazy dependency has just been replaced; a genuinely missing chunk still fails the preflight with its exact URL.

`summary.json` contains compact rollups and references the raw per-phase artifacts rather than duplicating them. This keeps large full-audit reports bounded on disk and avoids loading duplicate payloads in downstream tooling.

## Exit behavior

The command exits nonzero when any required phase fails, a model is unresolved, a zone assertion fails, a visual sample fails, a soak budget is exceeded, a page error occurs, or the system memory guard blocks further work. `--allow-failures` is available only for exploratory artifact collection.

The browser and every context are closed in `finally` paths. A failed run still writes `summary.json`, `summary.html`, screenshots when possible, and the fatal stack.

## Extending the product

Keep additions in one of these layers:

- `profiles/`: coverage scope and quality budgets;
- `baselines/`: reviewed semantic visual references and their provenance;
- `lib/coverage.mjs`: inventory and asset-selection rules;
- `lib/aggregate.mjs`: deterministic pass/fail analysis;
- `lib/playwright-runner.mjs`: browser orchestration and artifact capture;
- the in-app validation components: renderer-specific measurements unavailable outside Babylon;
- `test/`: pure configuration, aggregation, safety, and artifact tests.

Prefer adding a new report field and an aggregation assertion over parsing UI text. Preserve schema version 1 compatibility or increment `schemaVersion` with an explicit migration.

## Recommended cadence

- Local implementation loop: `smoke`.
- After skeletal retargeting, skin, head, or character-cache changes: `model-regression`.
- Before merging renderer or editor changes: `matrix`.
- After lifecycle, caching, loader, or animation changes: `soak` plus `matrix`.
- Release candidate or scheduled overnight run: `full`.
- Human review: open `summary.html`, then reproduce any failed model in the in-app Browser using the recorded URL.
