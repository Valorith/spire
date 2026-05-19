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

  test('frames real local zone geometry instead of opening on a blank safe-point view', async ({ page }) => {
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
    ), { timeout: 10000 }).toBe('overview')
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
  })
})
