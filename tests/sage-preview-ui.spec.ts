import { expect, type Locator, type Page, test } from '@playwright/test'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const { createPreviewServer } = require('../scripts/serve-sage-preview.js')

let previewServer: any
let closePreviewServer: undefined | (() => Promise<void>)
let previewBaseUrl = ''

async function seedEqDirectory(page: Page) {
  await page.addInitScript(() => {
    const encodeJson = (value: unknown) =>
      new TextEncoder().encode(JSON.stringify(value)).buffer

    class MockFileSystemHandle {
      async queryPermission() {
        return 'granted'
      }

      async requestPermission() {
        return 'granted'
      }
    }

    window.FileSystemHandle = MockFileSystemHandle as any
    ;(window as any).electronFS = {
      async readDir(filePath: string) {
        const normalized = String(filePath).replaceAll('\\\\', '/')
        if (/eqsage\/data\/?$/i.test(normalized)) {
          return [
            {
              isDirectory: false,
              isFile     : true,
              name       : 'global.json',
              path       : `${normalized}/global.json`,
            },
            {
              isDirectory: false,
              isFile     : true,
              name       : 'version.json',
              path       : `${normalized}/version.json`,
            },
          ]
        }

        if (/eqsage\/zones\/?$/i.test(normalized)) {
          return [
            {
              isDirectory: false,
              isFile     : true,
              name       : 'tutorial.json',
              path       : `${normalized}/tutorial.json`,
            },
            {
              isDirectory: false,
              isFile     : true,
              name       : 'tutorial.glb',
              path       : `${normalized}/tutorial.glb`,
            },
          ]
        }

        if (/eqsage\/?$/i.test(normalized)) {
          return [
            {
              isDirectory: true,
              isFile     : false,
              name       : 'data',
              path       : `${normalized}/data`,
            },
            {
              isDirectory: true,
              isFile     : false,
              name       : 'zones',
              path       : `${normalized}/zones`,
            },
          ]
        }

        return [
          {
            isDirectory: true,
            isFile     : false,
            name       : 'eqsage',
            path       : `${normalized}/eqsage`,
          },
          {
            isDirectory: false,
            isFile     : true,
            name       : 'global_chr.s3d',
            path       : `${normalized}/global_chr.s3d`,
          },
          {
            isDirectory: false,
            isFile     : true,
            name       : 'tutorial.s3d',
            path       : `${normalized}/tutorial.s3d`,
          },
        ]
      },
      async readFile(filePath: string) {
        const normalized = String(filePath).replaceAll('\\\\', '/').toLowerCase()
        if (normalized.endsWith('/eqsage/data/global.json')) {
          return encodeJson({ version: 1.8 })
        }
        if (normalized.endsWith('/eqsage/data/version.json')) {
          return encodeJson({ version: 2.05 })
        }
        if (normalized.endsWith('/eqsage/zones/tutorial.json')) {
          return encodeJson({
            lights : [],
            objects: {},
            regions: [],
            version: 2.05,
          })
        }
        return new Uint8Array([0, 1, 2, 3]).buffer
      },
      async deleteFile() {},
      async deleteFolder() {},
      async createIfNotExist() {},
      async writeFile() {},
    }
    ;(window as any).electronAPI = {
      async hasStandalone() {
        return true
      },
      async selectDirectory() {
        return 'C:/EQEmuCW-Live'
      },
      getPath() {
        return 'C:/EQEmuCW-Live'
      },
      onMessage() {},
      setZoomFactor() {},
      async proxyFetch(input: RequestInfo | URL, init?: RequestInit) {
        return fetch(input, init)
      },
    }

    localStorage.setItem('eqdir', 'C:/EQEmuCW-Live')
    localStorage.setItem(
      'recent-zones',
      JSON.stringify([
        {
          expansion   : 0,
          id          : 183,
          long_name   : 'The Mines of Gloomingdeep',
          short_name  : 'tutorial',
          version     : 0,
          zoneidnumber: 183,
        },
      ])
    )
  })
}

async function expectElementTopmost(locator: Locator) {
  await expect(locator).toBeVisible()
  await expect(
    await locator.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const x = Math.min(Math.max(rect.left + 10, 0), window.innerWidth - 1)
      const y = Math.min(
        Math.max(rect.top + rect.height / 2, 0),
        window.innerHeight - 1
      )
      const topElement = document.elementsFromPoint(x, y)[0]

      return topElement === element || element.contains(topElement)
    })
  ).toBe(true)
}

type SageReadinessSnapshot = {
  cameraFraming: unknown
  loadingText: string | null
  validationReady: boolean
  zoneLoaded: boolean
}

const readSageReadiness = (page: Page) =>
  page.evaluate((): SageReadinessSnapshot => {
    const loadingText = Array.from(document.querySelectorAll('[role="dialog"] p'))
      .map((paragraph) => paragraph.textContent?.trim() ?? '')
      .find((text) => /^Decoded \d+ of \d+ images using \d+ threads$/.test(text)) ?? null

    return {
      cameraFraming : (window as any).__spireSageCameraFraming ?? null,
      loadingText,
      validationReady: Boolean((window as any).__spireSageLastZoneValidation),
      zoneLoaded    : (window as any).gameController?.ZoneController?.zoneLoaded ?? false,
    }
  })

async function waitForRealZoneReadiness(page: Page) {
  const hardTimeoutMs = 360000
  const idleTimeoutMs = 90000
  const startedAt = Date.now()
  let latestSnapshot = await readSageReadiness(page)
  let lastProgressAt = startedAt
  let previousLoadingText = latestSnapshot.loadingText

  while (Date.now() - startedAt < hardTimeoutMs) {
    latestSnapshot = await readSageReadiness(page)
    if (
      latestSnapshot.zoneLoaded &&
      latestSnapshot.validationReady &&
      latestSnapshot.cameraFraming
    ) {
      return latestSnapshot
    }

    if (latestSnapshot.loadingText && latestSnapshot.loadingText !== previousLoadingText) {
      previousLoadingText = latestSnapshot.loadingText
      lastProgressAt = Date.now()
    }

    if (Date.now() - lastProgressAt >= idleTimeoutMs) {
      throw new Error(
        `Sage zone loading stalled for ${idleTimeoutMs}ms: ${JSON.stringify(latestSnapshot)}`
      )
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(
    `Sage zone loading exceeded ${hardTimeoutMs}ms: ${JSON.stringify(latestSnapshot)}`
  )
}

async function selectSpawnFromScene(page: Page, spawnId: number) {
  await page.evaluate((id) => {
    const spawnController = (window as any).gameController?.SpawnController
    const visual = spawnController?.spawns?.[id]
    const pickedMesh = [
      visual?.rootNode,
      ...(visual?.rootNode?.getChildMeshes?.(false) ?? []),
    ].find((mesh) => Number(mesh?.metadata?.spawn?.id) === Number(id))
    if (!pickedMesh) {
      throw new Error(`No pickable scene mesh found for spawn ${id}`)
    }
    spawnController.sceneMouseDown({
      type    : 1,
      pickInfo: { hit: true, pickedMesh },
    })
  }, spawnId)
}

const readSpawnSceneState = (page: Page, spawnId: number) =>
  page.evaluate((id) => {
    const spawnController = (window as any).gameController?.SpawnController
    const visual = spawnController?.spawns?.[id]
    const root = visual?.rootNode
    const metadataReferences = [
      root,
      ...(root?.getChildMeshes?.(false) ?? []),
      visual?.instance,
      visual?.nameplateMesh,
    ].filter(Boolean).map((node) => ({
      id: node.metadata?.spawn?.id ?? null,
      x : node.metadata?.spawn?.x ?? null,
      y : node.metadata?.spawn?.y ?? null,
      z : node.metadata?.spawn?.z ?? null,
    }))

    return {
      controllerCount: Object.keys(spawnController?.spawns ?? {}).length,
      exists         : Boolean(visual && root && !root.isDisposed?.()),
      groundY        : visual?.getGroundReferenceWorldY?.() ?? null,
      metadataReferences,
      modelName      : visual?.modelName ?? null,
      position       : root
        ? { x: root.position.x, y: root.position.y, z: root.position.z }
        : null,
      selectedSpawnId: spawnController?.selectedSpawnId ?? null,
      spawnEntry     : visual?.spawnEntry
        ? {
          id          : visual.spawnEntry.id,
          spawnentries: visual.spawnEntry.spawnentries?.length ?? 0,
          x           : visual.spawnEntry.x,
          y           : visual.spawnEntry.y,
          z           : visual.spawnEntry.z,
        }
        : null,
      stats: (window as any).__spireSageSpawnStats ?? null,
    }
  }, spawnId)

const readDoorSceneState = (page: Page, doorId?: number) =>
  page.evaluate((id) => {
    const controller = (window as any).gameController?.ZoneController
    const meshes = (controller?.doorNode?.getChildren?.() ?? [])
      .filter((mesh: any) => mesh?.dataReference)
    const mesh = id === undefined
      ? null
      : meshes.find((candidate: any) =>
        Number(candidate.dataReference?.id) === Number(id)
      )
    return {
      exists  : id === undefined ? undefined : Boolean(mesh && !mesh.isDisposed?.()),
      ids     : meshes.map((candidate: any) => candidate.dataReference?.id),
      position: mesh
        ? { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z }
        : null,
      reference: mesh
        ? {
          heading: mesh.dataReference.heading,
          id     : mesh.dataReference.id,
          pos_x  : mesh.dataReference.pos_x,
          pos_y  : mesh.dataReference.pos_y,
          pos_z  : mesh.dataReference.pos_z,
          size   : mesh.dataReference.size,
        }
        : null,
      rotationYDegrees: mesh
        ? Math.round(mesh.rotation.y * (180 / Math.PI) * 1_000_000) / 1_000_000
        : null,
      scale           : mesh?.scaling?.y ?? null,
      sceneDoorCount  : meshes.length,
      stats           : (window as any).__spireSageDoorStats ?? null,
    }
  }, doorId)

test.describe('Sage preview UI', () => {
  test.beforeAll(async () => {
    const preview = createPreviewServer()
    previewServer = preview.server
    closePreviewServer = preview.close

    await new Promise<void>((resolve) => {
      previewServer.listen(0, '127.0.0.1', resolve)
    })

    const address = previewServer.address()
    if (!address || typeof address === 'string') {
      throw new Error('Failed to bind sage preview server')
    }

    previewBaseUrl = `http://127.0.0.1:${address.port}`
  })

  test.afterAll(async () => {
    if (!previewServer) {
      return
    }

    await closePreviewServer?.()
  })

  test('loads the native sage startup without the quests dialog popping open', async ({ page }) => {
    await page.goto(`${previewBaseUrl}/sage`, { waitUntil: 'load' })

    await expect(page.locator('iframe')).toHaveCount(0)
    await expect(page.locator('text=Unable to load the EQ Sage zone editor bundle.')).toHaveCount(0)
    await expect(page.getByRole('dialog', { name: 'DotNet Quests' })).toHaveCount(0)
    await expect(page.getByRole('dialog')).toBeVisible()
    const bridgeResolvedDefaultRoot = await page
      .getByRole('dialog', { name: 'EQ Sage: Zone Editor' })
      .isVisible()
    if (!bridgeResolvedDefaultRoot) {
      await expect(page.getByRole('dialog', { name: 'Welcome to the Spire Zone Editor' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Select EQ Directory' })).toBeVisible()
    }
    await expect(page.getByRole('dialog', { name: 'Update Spire' })).toHaveCount(0)
  })

  test('shows an in-page notice when the directory bridge is unavailable', async ({ page }) => {
    await page.route('**/api/v1/app/sage-fs/validate', route =>
      route.fulfill({
        status     : 503,
        contentType: 'application/json',
        body       : JSON.stringify({ error: 'Filesystem bridge unavailable' }),
      })
    )

    await page.goto(`${previewBaseUrl}/sage`, { waitUntil: 'load' })
    await expect.poll(() => page.evaluate(() => Boolean((window as any).electronAPI))).toBe(true)
    const selection = page.evaluate(() => (window as any).electronAPI.selectDirectory())

    const notice = page.getByRole('dialog', { name: 'EverQuest Directory' })
    await expect(notice).toBeVisible()
    await expect(notice).toContainText('local Spire filesystem bridge is unavailable')
    const closeButton = notice.getByRole('button', { name: 'Close' })
    await expect(closeButton).toBeFocused()
    await closeButton.click()
    await expect(selection).resolves.toBe('')
  })

  test('uses an in-page path form to select a validated EQ directory', async ({ page }) => {
    const selectedRoot = 'D:/EverQuest'
    await page.route('**/api/v1/app/sage-fs/validate', async route => {
      const requestRoot = route.request().postDataJSON()?.root
      if (requestRoot === selectedRoot) {
        await route.fulfill({
          status     : 200,
          contentType: 'application/json',
          body       : JSON.stringify({ root: selectedRoot }),
        })
        return
      }

      await route.fulfill({
        status     : 400,
        contentType: 'application/json',
        body       : JSON.stringify({ error: 'Choose another EverQuest directory' }),
      })
    })

    await page.goto(`${previewBaseUrl}/sage`, { waitUntil: 'load' })
    await expect.poll(() => page.evaluate(() => Boolean((window as any).electronAPI))).toBe(true)
    const selection = page.evaluate(() => (window as any).electronAPI.selectDirectory())

    const pathDialog = page.getByRole('dialog', { name: 'Select EverQuest Directory' })
    const pathInput = pathDialog.getByLabel('Enter the full path to your EverQuest directory:')
    await expect(pathDialog).toBeVisible()
    await expect(pathInput).toBeFocused()
    await pathInput.fill(selectedRoot)
    await pathDialog.getByRole('button', { name: 'Use Directory' }).click()

    await expect.poll(() => page.evaluate(() => localStorage.getItem('eqdir'))).toBe(selectedRoot)
    await expect(selection).resolves.toBe(selectedRoot)
  })

  test('opens the integrated zone editor canvas after directory and zone selection', async ({ page }) => {
    await seedEqDirectory(page)
    await page.goto(`${previewBaseUrl}/sage`, { waitUntil: 'load' })

    await expect(page.locator('iframe')).toHaveCount(0)
    await expect(page.locator('text=Unable to load the EQ Sage zone editor bundle.')).toHaveCount(0)
    await expect(page.getByRole('dialog', { name: 'DotNet Quests' })).toHaveCount(0)
    await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open Model Review' })).toBeVisible()

    await page.getByText('The Mines of Gloomingdeep').click()

    await expect(page.locator('canvas#renderCanvas')).toHaveCount(1)
    await expect(page.locator('iframe')).toHaveCount(0)
  })

  test('opens the zone chooser when the local Spire filesystem bridge validates an EQ directory', async ({ page }) => {
    const eqRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'spire-sage-eq-'))

    try {
      await fs.promises.writeFile(path.join(eqRoot, 'eqgame.exe'), '')
      await fs.promises.writeFile(path.join(eqRoot, 'tutorial.s3d'), new Uint8Array([0, 1, 2, 3]))

      await page.goto(
        `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=bridge-test`,
        { waitUntil: 'load' }
      )

      await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Select EQ Directory' })).toHaveCount(0)
      expect(await page.evaluate(() => localStorage.getItem('eqdir'))).toBe(
        eqRoot.replace(/\\/g, '/')
      )
      expect(await page.evaluate(() => Boolean((window as any).electronFS))).toBe(true)
    } finally {
      await fs.promises.rm(eqRoot, { force: true, recursive: true })
    }
  })

  test('treats stale and temporarily locked cache deletes as idempotent', async ({ page }) => {
    const eqRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'spire-sage-eq-'))
    let deleteAttempts = 0
    let writeAttempts = 0
    let fallbackReadAttempts = 0

    try {
      await fs.promises.writeFile(path.join(eqRoot, 'eqgame.exe'), '')
      await fs.promises.writeFile(path.join(eqRoot, 'tutorial.s3d'), new Uint8Array([0, 1, 2, 3]))
      await page.route('**/api/v1/app/sage-fs/delete-file**', async route => {
        deleteAttempts += 1
        const locked = route.request().url().includes('locked-texture')
        await route.fulfill({
          status     : locked ? 500 : 422,
          contentType: 'application/json',
          body       : JSON.stringify({
            error: locked
              ? 'EPERM: operation not permitted'
              : 'Cache entry was already removed',
          }),
        })
      })
      await page.route('**/api/v1/app/sage-fs/write-file**', async route => {
        if (!route.request().url().includes('locked-texture')) {
          await route.continue()
          return
        }
        writeAttempts += 1
        await route.fulfill({
          status     : 500,
          contentType: 'application/json',
          body       : JSON.stringify({ error: 'EPERM: operation not permitted' }),
        })
      })
      await page.route('**/api/v1/app/sage-fs/read-file**', async route => {
        if (!route.request().url().includes('locked-texture')) {
          await route.continue()
          return
        }
        fallbackReadAttempts += 1
        await route.fulfill({
          status     : 200,
          contentType: 'application/octet-stream',
          body       : Buffer.from([1, 2, 3, 4]),
        })
      })

      await page.goto(
        `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=delete-idempotency-test`,
        { waitUntil: 'load' }
      )
      await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()

      await expect(
        page.evaluate(() =>
          (window as any).electronFS.deleteFile('eqsage/zones/stale-zone.glb')
        )
      ).resolves.toBeUndefined()
      await expect(
        page.evaluate(() =>
          (window as any).electronFS.deleteFile('eqsage/textures/locked-texture.png')
        )
      ).resolves.toBeUndefined()
      expect(deleteAttempts).toBe(4)
      await expect(
        page.evaluate(() =>
          (window as any).electronFS.writeFile(
            'eqsage/textures/locked-texture.png',
            new Uint8Array([5, 6, 7, 8])
          )
        )
      ).resolves.toBeUndefined()
      expect(writeAttempts).toBe(1)
      expect(fallbackReadAttempts).toBe(1)
    } finally {
      await fs.promises.rm(eqRoot, { force: true, recursive: true })
    }
  })

  test('keeps zone chooser popups clickable above the Sage dialog', async ({ page }) => {
    const eqRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'spire-sage-eq-'))

    try {
      await fs.promises.writeFile(path.join(eqRoot, 'eqgame.exe'), '')
      await fs.promises.writeFile(path.join(eqRoot, 'tutorial.s3d'), new Uint8Array([0, 1, 2, 3]))

      await page.goto(
        `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=popup-layer-test`,
        { waitUntil: 'load' }
      )

      await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()

      await page.locator('[role="combobox"][aria-label="Expansion Filter"]').click()
      const originalExpansionOption = page.getByRole('option', { name: 'Original' })
      await expectElementTopmost(originalExpansionOption)
      await originalExpansionOption.click()
      await page.keyboard.press('Escape')

      await page.locator('[role="combobox"][aria-label="Zone"]').click()
      const blackburrowOption = page.getByRole('option', { name: 'Blackburrow - blackburrow' })
      await expectElementTopmost(blackburrowOption)
      await blackburrowOption.click()

      await expect(page.getByRole('button', { name: 'Enter Zone Editor' })).toBeEnabled()
    } finally {
      await fs.promises.rm(eqRoot, { force: true, recursive: true })
    }
  })

  test('keeps unlink confirmation clickable above the zone chooser', async ({ page }) => {
    const eqRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'spire-sage-eq-'))

    try {
      await fs.promises.writeFile(path.join(eqRoot, 'eqgame.exe'), '')
      await fs.promises.writeFile(path.join(eqRoot, 'tutorial.s3d'), new Uint8Array([0, 1, 2, 3]))

      await page.goto(
        `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=confirm-layer-test`,
        { waitUntil: 'load' }
      )

      await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()
      await page.getByRole('button', { name: 'Unlink EQ Directory' }).click()

      const confirmDialog = page.getByRole('dialog', { name: 'Unlink EQ Directory' })
      await expect(confirmDialog).toBeVisible()
      const cancelButton = confirmDialog.getByRole('button', { name: 'Cancel' })
      await expectElementTopmost(cancelButton)
      await cancelButton.click()
      await expect(confirmDialog).not.toBeVisible()
      await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()
    } finally {
      await fs.promises.rm(eqRoot, { force: true, recursive: true })
    }
  })

  test('opens the standalone model review with runtime-faithful appearance evidence', async ({ page }) => {
    test.setTimeout(180000)
    const eqRoot = process.env.SPIRE_SAGE_EQ_DIR || 'C:/EQEmuCW-Live'
    test.skip(
      !fs.existsSync(path.join(eqRoot, 'eqsage', 'models', 'hum.glb')),
      'requires local Sage generated character assets'
    )

    await page.goto(
      `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageModelReview=1&sageModel=hum&sageCacheBust=model-review-test`,
      { waitUntil: 'load' }
    )

    await expect(page.getByRole('main', { name: 'Sage Model Review' })).toBeVisible()
    await expect(page.locator('canvas#modelReviewCanvas')).toHaveCount(1)
    await expect.poll(() => page.evaluate(() => (
      (window as any).__spireSageModelReview ?? null
    )), { timeout: 120000 }).toMatchObject({
      ready: true,
      model: 'hum',
      view : 'front',
      diagnostics: {
        animationPass  : true,
        orientationPass: true,
      },
    })

    await expect(page.getByText('Resolved asset').locator('..')).toContainText('HUM')
    await expect(page.getByLabel('Clip').locator('option')).not.toHaveCount(0)
    await page.keyboard.press('4')
    await expect.poll(() => page.evaluate(() => (
      (window as any).__spireSageModelReview?.view ?? null
    ))).toBe('head')
    expect(new URL(page.url()).searchParams.get('sageModelView')).toBe('head')

    const selectReviewedModel = async (query: string, buttonName: string, model: string) => {
      await page.getByRole('textbox', { name: 'Search models' }).fill(query)
      await page.getByRole('button', { name: buttonName, exact: true }).click()
      await expect.poll(() => page.evaluate(() => ({
        model: (window as any).__spireSageModelReview?.model ?? null,
        ready: (window as any).__spireSageModelReview?.ready ?? false,
      })), { timeout: 120000 }).toEqual({ model, ready: true })
    }
    const readReviewResources = () => page.evaluate(() => {
      const scene = (window as any).gameController?.currentScene
      return {
        animationGroups: scene?.animationGroups?.length ?? 0,
        materials      : scene?.materials?.length ?? 0,
        meshes         : scene?.meshes?.length ?? 0,
        skeletons      : scene?.skeletons?.length ?? 0,
        textures       : scene?.textures?.length ?? 0,
        transformNodes : scene?.transformNodes?.length ?? 0,
      }
    })

    await selectReviewedModel('qcf', 'QCF Human', 'qcf')
    await expect.poll(() => page.evaluate(() => (
      (window as any).__spireSageModelReview?.diagnostics?.compactNativeArmNeutralized ?? false
    ))).toBe(true)
    const settledResources = await readReviewResources()
    await selectReviewedModel('hum', 'HUM Human', 'hum')
    await selectReviewedModel('qcf', 'QCF Human', 'qcf')
    const repeatedResources = await readReviewResources()
    expect(repeatedResources).toEqual(settledResources)
  })

  test('frames real local zone geometry instead of opening on a blank safe-point view', async ({ page }) => {
    test.setTimeout(420000)
    const eqRoot = process.env.SPIRE_SAGE_EQ_DIR || 'C:/EQEmuCW-Live'
    test.skip(
      !fs.existsSync(path.join(eqRoot, 'eqsage', 'zones', 'befallen.glb')),
      'requires local Sage generated zone assets'
    )

    await page.goto(
      `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=real-zone-framing-test`,
      { waitUntil: 'load' }
    )

    await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()
    await page.locator('[role="combobox"][aria-label="Expansion Filter"]').click()
    await page.getByRole('option', { name: 'Original' }).click()
    await page.keyboard.press('Escape')
    await page.locator('[role="combobox"][aria-label="Zone"]').click()
    await page.getByRole('option', { name: 'Befallen - befallen' }).click()
    await page.evaluate(() => {
      const url = new URL(window.location.href)
      url.searchParams.set('sageValidation', '1')
      window.history.replaceState(null, '', url.toString())
    })
    await page.getByRole('button', { name: 'Enter Zone Editor' }).click()

    const readiness = await waitForRealZoneReadiness(page)
    expect((readiness.cameraFraming as { mode?: string })?.mode).toBe('overview')
    expect(await page.evaluate(() => {
      const zoneMesh = (window as any).gameController?.ZoneController?.scene?.getMeshByName?.('zone')
      return zoneMesh?.getTotalVertices?.() ?? 0
    })).toBeGreaterThan(0)
    await expect.poll(async () => (
      page.evaluate(() => (window as any).__spireSageLastZoneValidation?.zone ?? null)
    ), { timeout: 15000 }).toBe('befallen')
    const textureStats = await page.evaluate(() => {
      const scene = (window as any).gameController?.ZoneController?.scene
      const zoneMesh = scene?.getMeshByName?.('zone')
      const subMaterials = zoneMesh?.material?.subMaterials ?? []
      const textures = subMaterials.flatMap((material: any) =>
        typeof material?.getActiveTextures === 'function'
          ? material.getActiveTextures()
          : []
      )
      const sizes = textures
        .map((texture: any) => texture?.getSize?.())
        .filter(Boolean)
      return {
        fallbackCount: sizes.filter((size: any) => size.width <= 1 || size.height <= 1).length,
        textureCount : sizes.length,
      }
    })
    expect(textureStats.textureCount).toBeGreaterThan(0)
    expect(textureStats.fallbackCount).toBe(0)
    expect(await page.evaluate(() => {
      const report = (window as any).__spireSageLastZoneValidation
      return {
        doorLoaded      : report?.doors?.loaded ?? 0,
        doorRequested   : report?.doors?.requested ?? 0,
        doorTextureSlots: report?.doors?.visuals?.texturedSlotCount ?? 0,
        doorFallback    : report?.doors?.visuals?.fallbackTextureCount ?? 0,
        doorOnePixel    : report?.doors?.visuals?.onePixelTextureCount ?? 0,
        spawnAboveGround: report?.visuals?.aboveGroundSpawnCount ?? 0,
        spawnBelowGround: report?.visuals?.belowGroundSpawnCount ?? 0,
        spawnLoaded     : report?.spawns?.loaded ?? 0,
        spawnRequested  : report?.requestedSpawns ?? 0,
        spawnRootNodeIds: report?.rootNodeCount ?? 0,
      }
    })).toMatchObject({
      doorLoaded      : 1,
      doorRequested   : 1,
      doorFallback    : 0,
      doorOnePixel    : 0,
      spawnAboveGround: 0,
      spawnBelowGround: 0,
      spawnLoaded     : 3,
      spawnRequested  : 3,
      spawnRootNodeIds: 3,
    })
    expect(await page.evaluate(() => (
      (window as any).__spireSageLastZoneValidation?.doors?.visuals?.texturedSlotCount ?? 0
    ))).toBeGreaterThan(0)
    const validationReport = await page.evaluate(() => (
      (window as any).__spireSageLastZoneValidation
    ))
    expect(
      validationReport?.pass,
      `Zone validation summary: ${JSON.stringify({
        pass            : validationReport?.pass,
        geometry        : validationReport?.geometry,
        runtimeAnimation: validationReport?.visuals?.runtimeAnimation,
        visualStats     : {
          animationGroupCount  : validationReport?.visuals?.animationGroupCount,
          animatedSkeletonCount: validationReport?.visuals?.animatedSkeletonSpawnCount,
          nonPlayingAnimationCount:
            validationReport?.visuals?.nonPlayingAnimationCount,
          pendingTextureCount  : validationReport?.visuals?.pendingTextureCount,
          skeletonCount        : validationReport?.visuals?.skeletonSpawnCount,
        },
      })}`
    ).toMatchObject({
      all       : true,
      animations: true,
      doors     : true,
      spawns    : true,
      textures  : true,
    })
  })

  test('keeps door choices and compact alerts interactive above the zone shell', async ({ page }) => {
    test.setTimeout(420000)
    const eqRoot = process.env.SPIRE_SAGE_EQ_DIR || 'C:/EQEmuCW-Live'
    test.skip(
      !fs.existsSync(path.join(eqRoot, 'eqsage', 'zones', 'befallen.glb')),
      'requires local Sage generated zone assets'
    )

    await page.goto(
      `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=door-alert-layer-test`,
      { waitUntil: 'load' }
    )
    await page.locator('[role="combobox"][aria-label="Expansion Filter"]').click()
    await page.getByRole('option', { name: 'Original' }).click()
    await page.keyboard.press('Escape')
    await page.locator('[role="combobox"][aria-label="Zone"]').click()
    await page.getByRole('option', { name: 'Befallen - befallen' }).click()
    await page.getByRole('button', { name: 'Enter Zone Editor' }).click()
    await waitForRealZoneReadiness(page)

    await page.getByText('Doors', { exact: true }).click()
    const doorSelector = page.getByRole('combobox', { name: 'Select Door' })
    await expect(doorSelector).toBeVisible()
    await doorSelector.click()
    const firstDoorOption = page.getByRole('option').first()
    await expectElementTopmost(firstDoorOption)
    await firstDoorOption.click()
    await expect(page.getByRole('button', { name: /Add Door \[/ })).toBeEnabled()

    await page.evaluate(() => {
      ;(window as any).__spireSageOpenAlert?.('Compact alert validation', 'success')
    })
    const alert = page.getByRole('alert').filter({ hasText: 'Compact alert validation' })
    await expect(alert).toBeVisible()
    const alertMetrics = await alert.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const outside = document.elementFromPoint(12, window.innerHeight - 12)
      return {
        outsideBlocked: element === outside || element.contains(outside),
        width: rect.width,
      }
    })
    expect(alertMetrics.width).toBeLessThanOrEqual(600)
    expect(alertMetrics.outsideBlocked).toBe(false)
    await expect(alert).not.toBeVisible({ timeout: 5000 })
  })

  test('validates the complete door editor lifecycle across API and scene state', async ({ page }) => {
    test.setTimeout(420000)
    const eqRoot = process.env.SPIRE_SAGE_EQ_DIR || 'C:/EQEmuCW-Live'
    test.skip(
      !fs.existsSync(path.join(eqRoot, 'eqsage', 'zones', 'befallen.glb')),
      'requires local Sage generated zone assets'
    )

    const enterBefallen = async () => {
      await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()
      await page.locator('[role="combobox"][aria-label="Expansion Filter"]').click()
      await page.getByRole('option', { name: 'Original' }).click()
      await page.keyboard.press('Escape')
      await page.locator('[role="combobox"][aria-label="Zone"]').click()
      await page.getByRole('option', { name: 'Befallen - befallen' }).click()
      await page.getByRole('button', { name: 'Enter Zone Editor' }).click()
      await waitForRealZoneReadiness(page)
    }
    const fetchDoors = async () => {
      const response = await page.request.get(
        `${previewBaseUrl}/api/v1/doors?where=zone__befallen.version__0&orderBy=doorid`
      )
      expect(response.ok()).toBeTruthy()
      return response.json()
    }
    const selectDoorFromScene = (doorId: number) => page.evaluate((id) => {
      const controller = (window as any).gameController?.ZoneController
      const mesh = (controller?.doorNode?.getChildren?.() ?? []).find(
        (candidate: any) => Number(candidate?.dataReference?.id) === Number(id)
      )
      if (!mesh) {
        throw new Error(`No scene door found for ${id}`)
      }
      controller.onClick({
        type    : 1,
        pickInfo: { hit: true, pickedMesh: mesh },
      })
    }, doorId)
    const updateDoorField = async (locator: Locator, value: string, doorId: number) => {
      const response = page.waitForResponse(candidate =>
        candidate.url().endsWith(`/api/v1/door/${doorId}`) &&
        candidate.request().method() === 'PATCH' &&
        candidate.status() === 200
      )
      await locator.fill(value)
      await locator.press('Tab')
      await response
    }

    await page.goto(
      `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=door-lifecycle-test`,
      { waitUntil: 'load' }
    )
    await enterBefallen()
    page.setDefaultTimeout(20_000)

    const initialDoors = await fetchDoors()
    expect(initialDoors).toHaveLength(1)
    await expect.poll(() => readDoorSceneState(page)).toMatchObject({
      sceneDoorCount: 1,
      stats: {
        loaded          : 1,
        missingVisualCount: 0,
        pass            : true,
        requested       : 1,
        sceneDoorCount  : 1,
        staleVisualCount: 0,
      },
    })

    await page.getByText('Doors', { exact: true }).click()
    const doorSelector = page.getByRole('combobox', { name: 'Select Door' })
    await doorSelector.click()
    const doorOptions = page.getByRole('option')
    expect(await doorOptions.count()).toBeGreaterThan(0)
    await doorOptions.first().click()
    const addDoorButton = page.getByRole('button', { name: /Add Door \[/ })
    await expect(addDoorButton).toBeEnabled()

    await page.evaluate(() => {
      const controller = (window as any).gameController.ZoneController
      controller.pickRaycastForLoc = (callback: (location: object) => void) => {
        callback({ x: 11, y: 12, z: 13 })
      }
    })
    const createResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/door') &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    )
    await addDoorButton.click()
    const createdDoor = await (await createResponse).json()
    expect(createdDoor).toMatchObject({
      pos_x: 13,
      pos_y: 11,
      pos_z: 12,
      zone : 'befallen',
    })
    await expect.poll(() => readDoorSceneState(page, createdDoor.id)).toMatchObject({
      exists  : true,
      position: { x: 11, y: 12, z: 13 },
      stats   : {
        loaded          : 2,
        missingVisualCount: 0,
        pass            : true,
        requested       : 2,
        sceneDoorCount  : 2,
        staleVisualCount: 0,
      },
    })

    await selectDoorFromScene(initialDoors[0].id)
    await expect(page.getByRole('spinbutton', { name: 'Door X' })).toHaveValue(
      String(initialDoors[0].pos_x)
    )
    await selectDoorFromScene(createdDoor.id)
    const doorX = page.getByRole('spinbutton', { name: 'Door X' })
    const doorY = page.getByRole('spinbutton', { name: 'Door Y' })
    const doorZ = page.getByRole('spinbutton', { name: 'Door Z' })
    const doorHeading = page.getByRole('spinbutton', { name: 'Door Heading' })
    const doorSize = page.getByRole('spinbutton', { name: 'Door Size' })
    await expect(doorX).toHaveValue('13')
    await expect(doorY).toHaveValue('11')
    await expect(doorZ).toHaveValue('12')

    await updateDoorField(doorX, '25', createdDoor.id)
    await updateDoorField(doorY, '35', createdDoor.id)
    await updateDoorField(doorZ, '45', createdDoor.id)
    await updateDoorField(doorHeading, '128', createdDoor.id)
    await updateDoorField(doorSize, '125', createdDoor.id)
    await expect.poll(async () => {
      const doors = await fetchDoors()
      return doors.find((door: any) => door.id === createdDoor.id)
    }).toMatchObject({
      heading: 128,
      pos_x  : 25,
      pos_y  : 35,
      pos_z  : 45,
      size   : 125,
    })
    await expect.poll(() => readDoorSceneState(page, createdDoor.id)).toMatchObject({
      position        : { x: 35, y: 45, z: 25 },
      rotationYDegrees: 270,
      scale           : 1.25,
      stats           : { pass: true, transformMismatchCount: 0 },
    })

    const transformResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/door/${createdDoor.id}`) &&
      response.request().method() === 'PATCH' &&
      response.status() === 200
    )
    await page.getByRole('button', { name: /Move\/Rotate\/Scale/ }).click()
    await expect(page.locator('.raycast-tooltip')).toBeVisible()
    await page.evaluate((id) => {
      const controller = (window as any).gameController.ZoneController
      const mesh = controller.doorNode.getChildren().find(
        (candidate: any) => Number(candidate?.dataReference?.id) === Number(id)
      )
      mesh.position.set(40, 50, 30)
      mesh.rotation.y = Math.PI * 1.5
      mesh.scaling.setAll(1.5)
    }, createdDoor.id)
    await page.keyboard.press('t')
    expect(await (await transformResponse).json()).toMatchObject({
      heading: 128,
      pos_x  : 30,
      pos_y  : 40,
      pos_z  : 50,
      size   : 150,
    })
    await expect.poll(() => readDoorSceneState(page, createdDoor.id)).toMatchObject({
      position: { x: 40, y: 50, z: 30 },
      scale   : 1.5,
      stats   : { pass: true },
    })

    await page.getByRole('button', { name: /Move\/Rotate\/Scale/ }).click()
    await page.evaluate((id) => {
      const controller = (window as any).gameController.ZoneController
      const mesh = controller.doorNode.getChildren().find(
        (candidate: any) => Number(candidate?.dataReference?.id) === Number(id)
      )
      mesh.position.set(400, 500, 300)
      mesh.rotation.y = 0
      mesh.scaling.setAll(3)
    }, createdDoor.id)
    await page.keyboard.press('Escape')
    await expect.poll(() => readDoorSceneState(page, createdDoor.id)).toMatchObject({
      position        : { x: 40, y: 50, z: 30 },
      rotationYDegrees: 270,
      scale           : 1.5,
    })

    const deleteResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/door/${createdDoor.id}`) &&
      response.request().method() === 'DELETE' &&
      response.status() === 200
    )
    await page.getByRole('button', { name: /Remove Door/ }).click()
    await deleteResponse
    await expect.poll(() => readDoorSceneState(page, createdDoor.id)).toMatchObject({
      exists        : false,
      sceneDoorCount: 1,
      stats         : {
        loaded          : 1,
        missingVisualCount: 0,
        pass            : true,
        requested       : 1,
        staleVisualCount: 0,
      },
    })
    expect(await fetchDoors()).toHaveLength(1)

    await page.reload({ waitUntil: 'load' })
    await enterBefallen()
    await expect.poll(() => readDoorSceneState(page, createdDoor.id)).toMatchObject({
      exists        : false,
      sceneDoorCount: 1,
      stats         : { pass: true, requested: 1, sceneDoorCount: 1 },
    })
  })

  test('cancels stale spawn work during rapid zone reloads', async ({ page }) => {
    test.setTimeout(420000)
    const eqRoot = process.env.SPIRE_SAGE_EQ_DIR || 'C:/EQEmuCW-Live'
    test.skip(
      !fs.existsSync(path.join(eqRoot, 'eqsage', 'zones', 'befallen.glb')),
      'requires local Sage generated zone assets'
    )

    const runtimeErrors: string[] = []
    page.on('pageerror', error => runtimeErrors.push(error.stack || error.message))
    page.on('console', message => {
      if (message.type() === 'error') {
        runtimeErrors.push(message.text())
      }
    })

    await page.goto(
      `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=rapid-reload-test`,
      { waitUntil: 'load' }
    )
    await page.locator('[role="combobox"][aria-label="Expansion Filter"]').click()
    await page.getByRole('option', { name: 'Original' }).click()
    await page.keyboard.press('Escape')
    await page.locator('[role="combobox"][aria-label="Zone"]').click()
    await page.getByRole('option', { name: 'Befallen - befallen' }).click()
    await page.evaluate(() => {
      const url = new URL(window.location.href)
      url.searchParams.set('sageValidation', '1')
      window.history.replaceState(null, '', url.toString())
    })
    await page.getByRole('button', { name: 'Enter Zone Editor' }).click()
    await waitForRealZoneReadiness(page)
    const initialReportCount = await page.evaluate(() => (
      (window as any).__spireSageValidationReports?.length ?? 0
    ))

    const reload = page.getByText('Reload', { exact: true })
    for (let attempt = 0; attempt < 5; attempt++) {
      await reload.click()
      await page.waitForTimeout(75)
    }

    await expect.poll(() => page.evaluate((previousReportCount) => {
      const report = (window as any).__spireSageLastZoneValidation
      return {
        hasNewReport:
          ((window as any).__spireSageValidationReports?.length ?? 0) >
          previousReportCount,
        spawns: {
          loaded: report?.spawns?.loaded ?? 0,
          requested: report?.spawns?.requested ?? 0,
        },
        zoneLoaded: (window as any).gameController?.ZoneController?.zoneLoaded ?? false,
      }
    }, initialReportCount), { timeout: 45000 }).toMatchObject({
      hasNewReport: true,
      spawns: { loaded: 3, requested: 3 },
      zoneLoaded: true,
    })
    await page.waitForTimeout(1500)

    const finalReport = await page.evaluate(() => (
      (window as any).__spireSageLastZoneValidation
    ))
    console.log(`Rapid reload validation: ${JSON.stringify(finalReport?.pass)}`)
    expect(finalReport?.pass).toMatchObject({ all: true })

    const finalSpawns = await page.evaluate(() => {
      const spawnController = (window as any).gameController?.SpawnController
      const ids = Object.values(spawnController?.spawns ?? {})
        .map((spawn: any) => spawn?.rootNode?.id)
        .filter(Boolean)
      return { count: ids.length, unique: new Set(ids).size }
    })
    expect(finalSpawns).toEqual({ count: 3, unique: 3 })
    expect(runtimeErrors.filter(error =>
      /refreshBoundingInfo|Cannot read properties of null/i.test(error)
    )).toEqual([])
  })

  test('persists grid heading and pause when Enter blurs the numeric fields', async ({ page }) => {
    test.setTimeout(420000)
    const eqRoot = process.env.SPIRE_SAGE_EQ_DIR || 'C:/EQEmuCW-Live'
    test.skip(
      !fs.existsSync(path.join(eqRoot, 'eqsage', 'zones', 'befallen.glb')),
      'requires local Sage generated zone assets'
    )

    await page.goto(
      `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=grid-enter-test`,
      { waitUntil: 'load' }
    )
    await page.locator('[role="combobox"][aria-label="Expansion Filter"]').click()
    await page.getByRole('option', { name: 'Original' }).click()
    await page.keyboard.press('Escape')
    await page.locator('[role="combobox"][aria-label="Zone"]').click()
    await page.getByRole('option', { name: 'Befallen - befallen' }).click()
    await page.getByRole('button', { name: 'Enter Zone Editor' }).click()
    await waitForRealZoneReadiness(page)
    await expect.poll(() => page.evaluate(() => (
      Object.keys((window as any).gameController?.SpawnController?.spawns ?? {}).length
    )), { timeout: 20000 }).toBe(3)

    const selectedGridSpawn = await page.evaluate(async () => {
      const spawnController = (window as any).gameController?.SpawnController
      const spawn = Object.values(spawnController?.spawns ?? {})
        .map((entry: any) => entry?.spawnEntry)
        .find((entry: any) => Number(entry?.pathgrid) > 0)
      const clickCallback = spawnController?.clickCallbacks?.[0]
      if (!spawn || typeof clickCallback !== 'function') {
        return null
      }
      await clickCallback(spawn)
      return { id: spawn.id, pathgrid: spawn.pathgrid }
    })
    expect(selectedGridSpawn).not.toBeNull()

    const heading = page.getByRole('spinbutton', { name: 'Heading' })
    await expect(heading).toBeVisible()
    await heading.fill('127')
    const headingUpdate = page.waitForResponse(response =>
      response.url().includes('/api/v1/grid_entry/') &&
      response.request().method() === 'PATCH' &&
      response.status() === 200
    )
    await heading.press('Enter')
    const headingResponse = await headingUpdate
    expect((await headingResponse.json()).heading).toBe(127)
    await expect(heading).not.toBeFocused()

    const pause = page.getByRole('spinbutton', { name: 'Pause (Seconds)' })
    await pause.fill('9')
    const pauseUpdate = page.waitForResponse(response =>
      response.url().includes('/api/v1/grid_entry/') &&
      response.request().method() === 'PATCH' &&
      response.status() === 200
    )
    await pause.press('Enter')
    const pauseResponse = await pauseUpdate
    expect((await pauseResponse.json()).pause).toBe(9)
    await expect(pause).not.toBeFocused()
  })

  test('validates the complete spawn editor lifecycle across API and scene state', async ({ page }) => {
    test.setTimeout(420000)
    const eqRoot = process.env.SPIRE_SAGE_EQ_DIR || 'C:/EQEmuCW-Live'
    test.skip(
      !fs.existsSync(path.join(eqRoot, 'eqsage', 'zones', 'befallen.glb')),
      'requires local Sage generated zone assets'
    )

    await page.goto(
      `${previewBaseUrl}/sage?sageEqDir=${encodeURIComponent(eqRoot)}&sageCacheBust=spawn-create-test`,
      { waitUntil: 'load' }
    )
    await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()
    await page.locator('[role="combobox"][aria-label="Expansion Filter"]').click()
    await page.getByRole('option', { name: 'Original' }).click()
    await page.keyboard.press('Escape')
    await page.locator('[role="combobox"][aria-label="Zone"]').click()
    await page.getByRole('option', { name: 'Befallen - befallen' }).click()
    await page.getByRole('button', { name: 'Enter Zone Editor' }).click()

    await waitForRealZoneReadiness(page)
    page.setDefaultTimeout(20_000)
    expect(await page.evaluate(() => (
      (window as any).__spireSageLastZoneValidation?.spawns?.placement ?? null
    ))).toMatchObject({
      expectedCount          : 3,
      loadedCount            : 3,
      missingVisualCount     : 0,
      nonFinitePlacementCount: 0,
      pass                   : true,
      positionMismatchCount  : 0,
      staleReferenceCount    : 0,
    })
    await page.getByText('Spawns', { exact: true }).click()
    const spawnDialog = page.locator('[role="dialog"]').filter({
      hasText: '3 filtered spawns',
    })
    await expect(spawnDialog).toBeVisible()
    await expect(page.getByText('3 filtered spawns')).toBeVisible()

    const npcInput = page.locator('input[aria-autocomplete="list"]')
    const npcSearchResponse = page.waitForResponse(response =>
      response.url().includes('/api/v1/npc_types') && response.status() === 200
    )
    await npcInput.click()
    await npcInput.pressSequentially('Sage Validation Erudite befallen')
    await npcSearchResponse
    const npcOption = page.locator('li[role="option"]')
    await expect(npcOption).toContainText('Sage Validation Erudite befallen - Level')
    await npcOption.click({ force: true })

    await page.evaluate(() => {
      const zoneController = (window as any).gameController.ZoneController
      zoneController.pickRaycastForLoc = (callback: (location: object) => void) => {
        callback({ x: 4, y: 2, z: 6 })
      }
    })
    const addSpawnButton = page.locator('button').filter({ hasText: 'Add Spawn' })
    await expect(addSpawnButton).toBeEnabled()
    const createSpawnResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/spawn_2') &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    )
    const createEntryResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/spawnentry') &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    )
    await addSpawnButton.click()
    const [createdSpawnHttp, createdEntryHttp] = await Promise.all([
      createSpawnResponse,
      createEntryResponse,
    ])
    const createdSpawn = await createdSpawnHttp.json()
    const createdEntry = await createdEntryHttp.json()
    expect(createdEntry.spawngroup_id).toBe(createdSpawn.spawngroup_id)
    await expect(spawnDialog).not.toBeVisible()

    await expect.poll(() => readSpawnSceneState(page, createdSpawn.id), {
      timeout: 20000,
    }).toMatchObject({
      controllerCount: 4,
      exists         : true,
      position       : { x: 4, z: 6 },
      spawnEntry     : {
        id          : createdSpawn.id,
        spawnentries: 1,
        x           : 6,
        y           : 4,
        z           : 2,
      },
      stats: {
        loaded   : 4,
        requested: 4,
      },
    })
    await page.getByText('Spawns', { exact: true }).click()
    await expect(page.getByText('4 filtered spawns')).toBeVisible()
    await expect(page.getByText('No associated spawns')).toHaveCount(0)
    await page.keyboard.press('Escape')

    await selectSpawnFromScene(page, createdSpawn.id)
    await expect(page.getByText(`Spawn Group ID - ${createdSpawn.id}`)).toBeVisible()
    const spawnX = page.getByRole('spinbutton', { name: 'Spawn X' })
    const spawnY = page.getByRole('spinbutton', { name: 'Spawn Y' })
    const spawnZ = page.getByRole('spinbutton', { name: 'Spawn Z' })
    await expect(spawnX).toHaveValue('6')
    await expect(spawnY).toHaveValue('4')
    await expect(spawnZ).toHaveValue('2')

    const numericMoveResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/spawn_2/${createdSpawn.id}`) &&
      response.request().method() === 'PATCH' &&
      response.status() === 200
    )
    await spawnX.fill('12')
    await spawnY.fill('13')
    await spawnZ.fill('3')
    expect(await (await numericMoveResponse).json()).toMatchObject({
      id: createdSpawn.id,
      x : 12,
      y : 13,
      z : 3,
    })
    await expect.poll(() => readSpawnSceneState(page, createdSpawn.id)).toMatchObject({
      position: { x: 13, z: 12 },
      spawnEntry: { x: 12, y: 13, z: 3 },
    })
    expect(
      Math.abs(Number((await readSpawnSceneState(page, createdSpawn.id)).groundY) - 3)
    ).toBeLessThan(0.1)
    expect(
      (await readSpawnSceneState(page, createdSpawn.id)).metadataReferences
    ).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: createdSpawn.id, x: 12, y: 13, z: 3 }),
    ]))

    await page.keyboard.press('Escape')
    await selectSpawnFromScene(page, createdSpawn.id)
    await expect(spawnX).toHaveValue('12')
    await expect(spawnY).toHaveValue('13')
    await expect(spawnZ).toHaveValue('3')

    await page.evaluate(() => {
      const zoneController = (window as any).gameController.ZoneController
      zoneController.pickRaycastForLoc = (callback: (location: object) => void) => {
        callback({ x: 20, y: 4, z: 30 })
      }
    })
    const raycastMoveResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/spawn_2/${createdSpawn.id}`) &&
      response.request().method() === 'PATCH' &&
      response.status() === 200
    )
    await page.getByText('Choose Raycast Location [R]').click()
    expect(await (await raycastMoveResponse).json()).toMatchObject({
      id: createdSpawn.id,
      x : 30,
      y : 20,
      z : 4,
    })
    await expect.poll(() => readSpawnSceneState(page, createdSpawn.id)).toMatchObject({
      position: { x: 20, z: 30 },
      spawnEntry: { x: 30, y: 20, z: 4 },
    })
    expect(
      Math.abs(Number((await readSpawnSceneState(page, createdSpawn.id)).groundY) - 4)
    ).toBeLessThan(0.1)

    const gridCreateResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/grid') &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    )
    const pathgridUpdateResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/spawn_2/${createdSpawn.id}`) &&
      response.request().method() === 'PATCH' &&
      response.status() === 200 &&
      Number(response.request().postDataJSON()?.pathgrid) > 0
    )
    const firstWaypointResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/grid_entry') &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    )
    await page.getByRole('button', { name: 'Add grid waypoint' }).click()
    const [createdGridHttp, pathgridUpdateHttp, firstWaypointHttp] = await Promise.all([
      gridCreateResponse,
      pathgridUpdateResponse,
      firstWaypointResponse,
    ])
    const createdGrid = await createdGridHttp.json()
    expect(await pathgridUpdateHttp.json()).toMatchObject({
      id      : createdSpawn.id,
      pathgrid: createdGrid.id,
    })
    expect(await firstWaypointHttp.json()).toMatchObject({
      gridid: createdGrid.id,
      number: 1,
      x     : 30,
      y     : 20,
      z     : 4,
    })

    const secondWaypointResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/grid_entry') &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    )
    await page.getByRole('button', { name: 'Add grid waypoint' }).click()
    expect(await (await secondWaypointResponse).json()).toMatchObject({
      gridid: createdGrid.id,
      number: 2,
      x     : 45,
      y     : 20,
      z     : 4,
    })
    const deleteWaypointButton = page.getByRole('button', {
      name: 'Delete grid waypoint',
    })
    await expect(deleteWaypointButton).toBeEnabled()
    const deleteWaypointResponse = page.waitForResponse(response =>
      response.url().includes(`/api/v1/grid_entry/${createdGrid.id}`) &&
      response.request().method() === 'DELETE' &&
      response.status() === 200
    )
    await deleteWaypointButton.click()
    await deleteWaypointResponse
    await expect(deleteWaypointButton).toBeDisabled()
    const remainingWaypoints = await page.request.get(
      `${previewBaseUrl}/api/v1/grid_entries?where=gridid__${createdGrid.id}`
    )
    expect(await remainingWaypoints.json()).toHaveLength(1)

    await page.getByText('Add/Edit Spawn Entries').click()
    const entryDialog = page.locator('[role="dialog"]').filter({
      hasText: 'Add/Edit Spawn Entries',
    })
    await expect(entryDialog).toBeVisible()
    await entryDialog.locator('input[type="number"]').first().fill('50')
    const addEntryInput = page.locator('input#add-new-spawn')
    const entryNpcSearchResponse = page.waitForResponse(response =>
      response.url().includes('/api/v1/npc_types') && response.status() === 200
    )
    await addEntryInput.fill('Sage Validation Dark Elf befallen')
    await entryNpcSearchResponse
    await page.locator('li[role="option"]', {
      hasText: 'Sage Validation Dark Elf befallen - Level',
    }).click()
    await entryDialog.locator('input[type="number"]').last().fill('50')
    const addAssociationResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/spawnentry') &&
      response.request().method() === 'PUT' &&
      response.status() === 200
    )
    await entryDialog.getByText('Save', { exact: true }).click()
    await addAssociationResponse
    await expect(entryDialog).not.toBeVisible()
    await expect.poll(() => readSpawnSceneState(page, createdSpawn.id), {
      timeout: 20000,
    }).toMatchObject({
      exists         : true,
      selectedSpawnId: createdSpawn.id,
      spawnEntry     : { spawnentries: 2, x: 30, y: 20, z: 4 },
    })
    await expect(page.getByText(/and 1 more/)).toBeVisible()

    await page.getByText('Add/Edit Spawn Entries').click()
    await expect(entryDialog).toBeVisible()
    await entryDialog.locator('input[type="number"]').first().fill('100')
    await entryDialog.locator(
      'button[aria-label="Remove Sage Validation Dark Elf befallen"]'
    ).click()
    const removeAssociationResponse = page.waitForResponse(response =>
      response.url().includes(`/api/v1/spawnentry/${createdSpawn.spawngroup_id}`) &&
      response.request().method() === 'DELETE' &&
      response.status() === 200
    )
    await entryDialog.getByText('Save', { exact: true }).click()
    await removeAssociationResponse
    await expect.poll(() => readSpawnSceneState(page, createdSpawn.id), {
      timeout: 20000,
    }).toMatchObject({
      exists         : true,
      selectedSpawnId: createdSpawn.id,
      spawnEntry     : { spawnentries: 1, x: 30, y: 20, z: 4 },
    })

    const deleteSpawnResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/spawn_2/${createdSpawn.id}`) &&
      response.request().method() === 'DELETE' &&
      response.status() === 200
    )
    await page.getByRole('button', { name: 'Delete spawn' }).click()
    const confirmDelete = page.getByRole('dialog', { name: 'Delete Spawn' })
    await expect(confirmDelete).toBeVisible()
    await confirmDelete.getByRole('button', { name: 'Ok' }).click()
    await deleteSpawnResponse
    await expect.poll(() => readSpawnSceneState(page, createdSpawn.id)).toMatchObject({
      controllerCount: 3,
      exists         : false,
      stats          : { loaded: 3, requested: 3 },
    })
    const deletedSpawnList = await page.request.get(
      `${previewBaseUrl}/api/v1/spawn_2s?where=id__${createdSpawn.id}`
    )
    expect(await deletedSpawnList.json()).toEqual([])

    await page.getByText('Spawns', { exact: true }).click()
    await expect(page.getByText('3 filtered spawns')).toBeVisible()
    await page.keyboard.press('Escape')

    await page.reload({ waitUntil: 'load' })
    await expect(page.getByRole('dialog', { name: 'EQ Sage: Zone Editor' })).toBeVisible()
    await page.locator('[role="combobox"][aria-label="Expansion Filter"]').click()
    await page.getByRole('option', { name: 'Original' }).click()
    await page.keyboard.press('Escape')
    await page.locator('[role="combobox"][aria-label="Zone"]').click()
    await page.getByRole('option', { name: 'Befallen - befallen' }).click()
    await page.getByRole('button', { name: 'Enter Zone Editor' }).click()
    await waitForRealZoneReadiness(page)
    await expect.poll(() => readSpawnSceneState(page, createdSpawn.id)).toMatchObject({
      controllerCount: 3,
      exists         : false,
    })
    expect(await page.evaluate(() => (
      (window as any).__spireSageLastZoneValidation?.spawns?.placement ?? null
    ))).toMatchObject({
      expectedCount          : 3,
      loadedCount            : 3,
      missingVisualCount     : 0,
      nonFinitePlacementCount: 0,
      pass                   : true,
      positionMismatchCount  : 0,
      staleReferenceCount    : 0,
    })
  })
})
