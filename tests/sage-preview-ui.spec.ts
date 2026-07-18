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

  test('frames real local zone geometry instead of opening on a blank safe-point view', async ({ page }) => {
    test.setTimeout(120000)
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

    await expect.poll(async () => (
      page.evaluate(() => (window as any).__spireSageCameraFraming?.mode ?? null)
    ), { timeout: 90000 }).toBe('overview')
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
    expect(await page.evaluate(() => (
      (window as any).__spireSageLastZoneValidation?.pass
    ))).toMatchObject({
      all       : true,
      animations: true,
      doors     : true,
      spawns    : true,
      textures  : true,
    })
  })

  test('keeps door choices and compact alerts interactive above the zone shell', async ({ page }) => {
    test.setTimeout(60000)
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
    await expect.poll(() => page.evaluate(() => (
      (window as any).gameController?.ZoneController?.zoneLoaded ?? false
    )), { timeout: 20000 }).toBe(true)

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

  test('cancels stale spawn work during rapid zone reloads', async ({ page }) => {
    test.setTimeout(90000)
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
    await expect.poll(() => page.evaluate(() => (
      (window as any).gameController?.ZoneController?.zoneLoaded ?? false
    )), { timeout: 20000 }).toBe(true)
    await expect.poll(() => page.evaluate(() => (
      (window as any).__spireSageLastZoneValidation?.pass?.all ?? false
    )), { timeout: 30000 }).toBe(true)
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
    await expect.poll(() => page.evaluate(() => (
      (window as any).gameController?.ZoneController?.zoneLoaded ?? false
    )), { timeout: 20000 }).toBe(true)
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

  test('creates a complete spawn with an NPC association and renders it immediately', async ({ page }) => {
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

    await expect.poll(() => page.evaluate(() => (
      (window as any).gameController?.ZoneController?.zoneLoaded ?? false
    )), { timeout: 15000 }).toBe(true)
    await page.getByText('Spawns', { exact: true }).click()
    const spawnDialog = page.getByRole('dialog')
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
    await addSpawnButton.click()
    await expect(spawnDialog).not.toBeVisible()

    await expect.poll(() => page.evaluate(() => (
      Object.keys((window as any).gameController?.SpawnController?.spawns ?? {}).length
    )), { timeout: 10000 }).toBe(4)
    await page.getByText('Spawns', { exact: true }).click()
    await expect(page.getByText('4 filtered spawns')).toBeVisible()
    await expect(page.getByText('No associated spawns')).toHaveCount(0)
  })
})
