import { expect, test } from '@playwright/test'

const { createPreviewServer } = require('../scripts/serve-sage-preview.js')

let previewServer: any
let closePreviewServer: undefined | (() => Promise<void>)
let previewBaseUrl = ''

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

  test('loads the native sage page without the quests dialog popping open', async ({ page }) => {
    await page.goto(`${previewBaseUrl}/sage`, { waitUntil: 'load' })
    await page.waitForTimeout(3000)

    await expect(page.locator('iframe')).toHaveCount(0)
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('text=Unable to load the EQ Sage zone editor bundle.')).toHaveCount(0)
    await expect(page.getByRole('dialog', { name: 'DotNet Quests' })).toHaveCount(0)

    const bodyText = await page.locator('body').innerText()
    expect(
      bodyText.includes('Welcome to the Spire Zone Editor') ||
      bodyText.includes('Welcome to the Sage Zone Editor') ||
      bodyText.includes('Enter Zone Editor')
    ).toBeTruthy()
  })
})
