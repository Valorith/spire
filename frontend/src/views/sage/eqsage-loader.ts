type EqSageEmbedModule = {
  mountSpireZoneEditor: (
    container: HTMLElement,
    options: {
      spireBridge: unknown
      initialRouteState?: Record<string, unknown>
      onChromeChange?: (state: { immersive: boolean }) => void
      onStageChange?: (state: {
        stage: string
        detail?: string
        uiVisible?: boolean
      }) => void
    }
  ) => Promise<void>
  unmountSpireZoneEditor: (container: HTMLElement) => void
}

const defaultBaseUrl = '/eqsage-embed'
const cssId = 'eqsage-embed-style'
let embedCacheKey: string | null = null
// This revision is part of the dynamic-import URL, so a rebuilt embed cannot be
// mistaken for a previously cached entry module when a tester reloads Sage.
const embedRuntimeRevision = 'neutral-idle-texture-v27'

const defaultEqDirCandidates = ['C:/EQEmuCW-Live']
const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]', '::1'])

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const normalizeDevBackendBaseUrl = (value: string) => {
  const trimmed = trimTrailingSlash(value)
  if (process.env.NODE_ENV === 'production') {
    return trimmed
  }

  try {
    const backendUrl = new URL(trimmed, window.location.origin)
    if (
      loopbackHosts.has(backendUrl.hostname) &&
      !loopbackHosts.has(window.location.hostname)
    ) {
      backendUrl.hostname = window.location.hostname
      return trimTrailingSlash(backendUrl.toString())
    }
  } catch {
    return trimmed
  }

  return trimmed
}

const getBackendBaseUrl = () =>
  normalizeDevBackendBaseUrl(
    process.env.VUE_APP_BACKEND_BASE_URL && process.env.NODE_ENV !== 'production'
      ? process.env.VUE_APP_BACKEND_BASE_URL
      : window.location.origin
  )

const getSageFsApiBase = () => `${getBackendBaseUrl()}/api/v1/app/sage-fs`

const getEmbedCacheKey = () => {
  const explicitCacheBust = new URLSearchParams(window.location.search).get('sageCacheBust')
  if (explicitCacheBust) {
    return `embed-${explicitCacheBust}-${embedRuntimeRevision}`
  }

  if (embedCacheKey) {
    return embedCacheKey
  }

  const sessionNonce = Date.now().toString(36)
  const scriptSources = Array.from(document.scripts)
    .map((script) => script.src || '')
    .filter(Boolean)

  const patterns = [
    /\/app\.([^.]+)\.js(?:$|\?)/,
    /\/js\/chunk-[^.]+\.([^.]+)\.js(?:$|\?)/,
    /\/js\/chunk-vendors\.([^.]+)\.js(?:$|\?)/,
  ]

  for (const source of scriptSources) {
    for (const pattern of patterns) {
      const match = source.match(pattern)
      if (match?.[1]) {
        embedCacheKey = `${match[1]}-${sessionNonce}-${embedRuntimeRevision}`
        return embedCacheKey
      }
    }
  }

  embedCacheKey = `embed-${sessionNonce}-${embedRuntimeRevision}`
  return embedCacheKey
}

const getEmbedBaseUrl = () => {
  const windowConfig = (window as any).__SPIRE_EQSAGE_EMBED_URL__
  const envConfig = process.env.VUE_APP_EQSAGE_EMBED_URL
  return trimTrailingSlash(windowConfig || envConfig || defaultBaseUrl)
}

const ensureStyle = (baseUrl: string) => {
  const cacheKey = getEmbedCacheKey()
  const href = `${baseUrl}/eqsage-embed.css?v=${cacheKey}`
  if (document.getElementById(cssId)) {
    const existing = document.getElementById(cssId) as HTMLLinkElement | null
    if (existing && existing.href !== href) {
      existing.href = href
    }
    return
  }

  const link = document.createElement('link')
  link.id = cssId
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

const uniqueTruthy = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[]

const sageDialogOverlayId = 'spire-sage-directory-dialog-overlay'

const createSageDialog = (title: string) => {
  document.getElementById(sageDialogOverlayId)?.remove()

  const overlay = document.createElement('div')
  overlay.id = sageDialogOverlayId
  overlay.setAttribute('data-testid', 'spire-sage-directory-dialog')
  Object.assign(overlay.style, {
    alignItems: 'center',
    background: 'rgba(3, 8, 15, 0.76)',
    display: 'flex',
    inset: '0',
    justifyContent: 'center',
    position: 'fixed',
    zIndex: '2147483647',
  })

  const dialog = document.createElement('div')
  dialog.setAttribute('aria-labelledby', 'spire-sage-directory-dialog-title')
  dialog.setAttribute('aria-modal', 'true')
  dialog.setAttribute('role', 'dialog')
  Object.assign(dialog.style, {
    background: '#0c1520',
    border: '1px solid #9b8549',
    borderRadius: '4px',
    boxShadow: '0 18px 50px rgba(0, 0, 0, 0.62)',
    color: '#f4f0df',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '560px',
    padding: '24px',
    width: 'calc(100% - 48px)',
  })

  const heading = document.createElement('h2')
  heading.id = 'spire-sage-directory-dialog-title'
  heading.textContent = title
  Object.assign(heading.style, {
    fontSize: '20px',
    margin: '0 0 14px',
  })

  dialog.appendChild(heading)
  overlay.appendChild(dialog)
  document.body.appendChild(overlay)
  return { dialog, overlay }
}

const styleSageDialogButton = (button: HTMLButtonElement, primary = false) => {
  Object.assign(button.style, {
    background: primary ? '#177ddc' : '#182534',
    border: `1px solid ${primary ? '#55a8f3' : '#66788b'}`,
    borderRadius: '3px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '8px 14px',
  })
}

const showSageNotice = (message: string) => new Promise<void>((resolve) => {
  const { dialog, overlay } = createSageDialog('EverQuest Directory')
  const body = document.createElement('p')
  body.textContent = message
  Object.assign(body.style, {
    lineHeight: '1.5',
    margin: '0 0 20px',
  })

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.textContent = 'Close'
  styleSageDialogButton(closeButton, true)

  const close = () => {
    document.removeEventListener('keydown', onKeyDown)
    overlay.remove()
    resolve()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close()
    }
  }

  closeButton.addEventListener('click', close, { once: true })
  document.addEventListener('keydown', onKeyDown)
  dialog.append(body, closeButton)
  closeButton.focus()
})

const requestSageDirectoryPath = (defaultRoot: string) =>
  new Promise<string | null>((resolve) => {
    const { dialog, overlay } = createSageDialog('Select EverQuest Directory')
    const form = document.createElement('form')
    const label = document.createElement('label')
    label.htmlFor = 'spire-sage-directory-path'
    label.textContent = 'Enter the full path to your EverQuest directory:'
    Object.assign(label.style, {
      display: 'block',
      fontSize: '14px',
      marginBottom: '8px',
    })

    const input = document.createElement('input')
    input.id = 'spire-sage-directory-path'
    input.name = 'eq-directory'
    input.value = defaultRoot
    input.autocomplete = 'off'
    input.spellcheck = false
    Object.assign(input.style, {
      background: '#07101a',
      border: '1px solid #718398',
      borderRadius: '3px',
      boxSizing: 'border-box',
      color: '#fff',
      fontSize: '15px',
      marginBottom: '18px',
      padding: '10px',
      width: '100%',
    })

    const actions = document.createElement('div')
    Object.assign(actions.style, {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
    })
    const cancelButton = document.createElement('button')
    cancelButton.type = 'button'
    cancelButton.textContent = 'Cancel'
    styleSageDialogButton(cancelButton)
    const submitButton = document.createElement('button')
    submitButton.type = 'submit'
    submitButton.textContent = 'Use Directory'
    styleSageDialogButton(submitButton, true)

    const finish = (value: string | null) => {
      document.removeEventListener('keydown', onKeyDown)
      overlay.remove()
      resolve(value)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        finish(null)
      }
    }

    cancelButton.addEventListener('click', () => finish(null), { once: true })
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      const value = input.value.trim()
      if (value) {
        finish(value)
      } else {
        input.focus()
      }
    })
    document.addEventListener('keydown', onKeyDown)

    actions.append(cancelButton, submitButton)
    form.append(label, input, actions)
    dialog.appendChild(form)
    window.requestAnimationFrame(() => {
      input.focus()
      input.select()
    })
  })

const getSageEqDirCandidates = () => {
  const params = new URLSearchParams(window.location.search)
  return uniqueTruthy([
    params.get('sageEqDir'),
    params.get('sagePreviewEqDir'),
    localStorage.getItem('eqdir'),
    process.env.VUE_APP_EQSAGE_EQ_DIR,
    ...defaultEqDirCandidates,
  ])
}

const sageFsUrl = (operation: string, root: string, filePath?: string) => {
  const params = new URLSearchParams({
    root,
    path: filePath || root,
  })
  return `${getSageFsApiBase()}/${operation}?${params.toString()}`
}

const validateSageFsRoot = async (
  root: string
): Promise<{ root: string | null; bridgeAvailable: boolean; error?: string }> => {
  try {
    const response = await fetch(`${getSageFsApiBase()}/validate`, {
      body: JSON.stringify({ root }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const bridgeAvailable =
      response.status >= 200 &&
      response.status < 500 &&
      response.status !== 403 &&
      response.status !== 404
    if (!response.ok) {
      let error = `Selected EverQuest directory was rejected (${response.status})`
      try {
        const payload = await response.json()
        if (typeof payload.error === 'string') {
          error = payload.error
        }
      } catch {
        // Keep the generic status message when the response is not JSON.
      }
      return { root: null, bridgeAvailable, error }
    }

    const payload = await response.json()
    return {
      root: typeof payload.root === 'string' ? payload.root : null,
      bridgeAvailable,
    }
  } catch {
    return { root: null, bridgeAvailable: false }
  }
}

const resolveSageFsRoot = async () => {
  const candidates = getSageEqDirCandidates()
  let bridgeAvailable = false
  for (const candidate of candidates) {
    const result = await validateSageFsRoot(candidate)
    bridgeAvailable = bridgeAvailable || result.bridgeAvailable
    if (result.root) {
      return { root: result.root, bridgeAvailable }
    }
  }

  localStorage.removeItem('eqdir')
  return { root: null, bridgeAvailable }
}

const disableSageHostZoom = () => {
  const hostApi = (window as any).electronAPI
  if (typeof hostApi?.setZoomFactor === 'function') {
    try {
      hostApi.setZoomFactor(1)
    } catch {
      // Host zoom is best-effort; the integrated viewer must still load without it.
    }
  }

  ;(window as any).__spireSageDisableHostZoom = true
  ;(window as any).electronAPI = hostApi && typeof hostApi === 'object' ? hostApi : {}
  ;(window as any).electronAPI.setZoomFactor = () => {}
}

const installSpireSageFileBridge = async () => {
  const params = new URLSearchParams(window.location.search)
  const autoZone = params.get('sageZone') || params.get('sagePreviewZone')
  ;(window as any).__spireSagePreview = true
  disableSageHostZoom()
  if (autoZone) {
    ;(window as any).__spireSagePreviewZone = autoZone
  }

  if ((window as any).electronFS && (window as any).electronAPI?.selectDirectory) {
    return
  }

  const resolved = await resolveSageFsRoot()
  const isLocalPreviewHost = loopbackHosts.has(window.location.hostname)
  if (!resolved.root && !resolved.bridgeAvailable && !isLocalPreviewHost) {
    return
  }
  let activeRoot = resolved.root
  const storedEqDir = localStorage.getItem('eqdir')
  if (
    storedEqDir &&
    activeRoot &&
    storedEqDir.replace(/\\/g, '/').toLowerCase() !== activeRoot.toLowerCase()
  ) {
    localStorage.removeItem('eqdir')
  }
  if (activeRoot) {
    localStorage.setItem('eqdir', activeRoot)
  }

  const requestOk = async (operation: string, filePath: string, init: RequestInit = {}) => {
    if (!activeRoot) {
      throw new Error('Select an EverQuest directory before accessing Sage files')
    }
    const response = await fetch(sageFsUrl(operation, activeRoot, filePath), init)
    if (!response.ok) {
      let detail = ''
      try {
        const body = await response.json()
        detail = String(body?.error || '').trim()
      } catch (_error) {
        // Preserve the status-only error when the response has no JSON body.
      }
      throw new Error(
        `Sage filesystem ${operation} failed${detail ? `: ${detail}` : ''} (${response.status})`
      )
    }
    return response
  }

  // The backend serializes cache mutations to protect files shared by several
  // character archives. Keeping a small client-side window avoids building a
  // large queue of overlapping requests and reduces socket/memory pressure
  // during a full character-cache refresh.
  const maxConcurrentTransfers = 4
  let activeTransfers = 0
  const pendingTransferSlots: Array<() => void> = []
  const waitForTransferSlot = async () => {
    if (activeTransfers >= maxConcurrentTransfers) {
      await new Promise<void>((resolve) => pendingTransferSlots.push(resolve))
    }
    activeTransfers += 1
  }
  const releaseTransferSlot = () => {
    activeTransfers -= 1
    pendingTransferSlots.shift()?.()
  }
  const sageFsErrorStatus = (error: unknown) =>
    Number(String(error).match(/\((\d+)\)$/)?.[1] || 0)
  const isRetryableSageFsError = (error: unknown) => {
    const status = sageFsErrorStatus(error)
    return status === 0 || status >= 500
  }
  const isWindowsFileLockError = (error: unknown) =>
    /(?:EPERM|EBUSY|operation not permitted|resource busy)/i.test(String(error))
  const hasReadableExistingFile = async (filePath: string) => {
    try {
      const response = await requestOk('read-file', filePath, { method: 'GET' })
      const missing = response.headers.get('X-Sage-Preview-Missing') === '1'
      await response.body?.cancel().catch(() => undefined)
      return !missing
    } catch (_error) {
      return false
    }
  }
  const waitBeforeRetry = (attempt: number) =>
    new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)))
  const readTransferRequests = new Map<string, Promise<ArrayBuffer | null>>()
  const readWithRetryUnshared = async (filePath: string) => {
    await waitForTransferSlot()
    try {
      // A large character zone can briefly contend with model-cache writes on
      // the same local HTTP bridge. Give transient transport failures a small,
      // bounded recovery window; missing files still return immediately.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const response = await requestOk('read-file', filePath, { method: 'GET' })
          if (response.headers.get('X-Sage-Preview-Missing') === '1') {
            return null
          }
          return await response.arrayBuffer()
        } catch (error) {
          const status = sageFsErrorStatus(error)
          const retryable = status === 422 || isRetryableSageFsError(error)
          if (!retryable || attempt === 4) {
            throw error
          }
          await waitBeforeRetry(attempt)
        }
      }
      throw new Error(`Sage filesystem read-file exhausted retries: ${filePath}`)
    } finally {
      releaseTransferSlot()
    }
  }
  const readWithRetry = async (filePath: string) => {
    // Character materials are shared by many spawns. Coalescing identical
    // in-flight reads prevents one zone from opening dozens of HTTP requests
    // for the same texture and makes the retry result deterministic for every
    // consumer. Large model buffers remain independent to avoid cloning them.
    if (!/\.(?:png|jpe?g|json)$/i.test(filePath)) {
      return readWithRetryUnshared(filePath)
    }

    const existing = readTransferRequests.get(filePath)
    if (existing) {
      const shared = await existing
      return shared?.slice(0) ?? null
    }

    const request = readWithRetryUnshared(filePath)
      .finally(() => readTransferRequests.delete(filePath))
    readTransferRequests.set(filePath, request)
    return request
  }
  const writeWithRetry = async (
    filePath: string,
    data: ArrayBuffer | ArrayBufferView | string
  ) => {
    await waitForTransferSlot()
    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await requestOk('write-file', filePath, {
            body: data instanceof ArrayBuffer || ArrayBuffer.isView(data)
              ? data
              : String(data ?? ''),
            method: 'POST',
          })
          return
        } catch (error) {
          const status = sageFsErrorStatus(error)
          const retryable = status === 422 || isRetryableSageFsError(error)
          if (
            isWindowsFileLockError(error) &&
            await hasReadableExistingFile(filePath)
          ) {
            // Antivirus scanners and a concurrent Sage tab can briefly retain
            // an existing cache file on Windows. Keeping a confirmed-readable
            // asset is safer than aborting the entire zone load.
            return
          }
          if (!retryable || attempt === 2) {
            throw error
          }
          await waitBeforeRetry(attempt)
        }
      }
    } finally {
      releaseTransferSlot()
    }
  }
  const deleteWithRetry = async (
    operation: 'delete-file' | 'delete-folder',
    filePath: string
  ) => {
    // Cache refreshes can issue many overlapping removals for a texture shared
    // by multiple character archives. Bound those requests like reads/writes,
    // and retry conflicts plus temporary Windows file locks. A failed cache
    // cleanup is nonfatal after the retry window because the existing asset is
    // still usable; malformed, unauthorized paths remain fatal.
    await waitForTransferSlot()
    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await requestOk(operation, filePath, { method: 'DELETE' })
          return
        } catch (error) {
          const status = sageFsErrorStatus(error)
          const fatalDeleteStatus = status === 400 || status === 401 || status === 403
          if (fatalDeleteStatus) {
            throw error
          }
          if (isWindowsFileLockError(error)) {
            return
          }
          const retryable =
            status === 404 ||
            status === 409 ||
            status === 422 ||
            isRetryableSageFsError(error)
          if (retryable && attempt === 2) {
            // Cache removal is idempotent. If another refresh already removed
            // the entry or Windows still has the old texture open, retain that
            // usable cached asset and allow the zone load to continue.
            return
          }
          if (!retryable || attempt === 2) {
            throw error
          }
          await waitBeforeRetry(attempt)
        }
      }
    } finally {
      releaseTransferSlot()
    }
  }

  const selectRootFromPath = async (candidate: string | null) => {
    if (!candidate) {
      return null
    }
    const result = await validateSageFsRoot(candidate)
    if (!result.root) {
      await showSageNotice(
        result.error ||
        'Selected directory does not look like an accessible EverQuest client directory.'
      )
      return null
    }
    activeRoot = result.root
    localStorage.setItem('eqdir', activeRoot)
    return activeRoot
  }

  ;(window as any).electronFS = {
    async readDir(filePath: string) {
      const response = await requestOk('readdir', filePath, { method: 'GET' })
      return response.json()
    },
    async readFile(filePath: string) {
      return readWithRetry(filePath)
    },
    async createIfNotExist(_filePath: string) {
      return true
    },
    async writeFile(filePath: string, data: ArrayBuffer | ArrayBufferView | string) {
      await writeWithRetry(filePath, data)
    },
    async deleteFile(filePath: string) {
      await deleteWithRetry('delete-file', filePath)
    },
    async deleteFolder(filePath: string) {
      await deleteWithRetry('delete-folder', filePath)
    },
  }

  ;(window as any).electronAPI = {
    async hasStandalone() { return true },
    async selectDirectory() {
      const defaultRoot = activeRoot || localStorage.getItem('eqdir') || defaultEqDirCandidates[0]
      const defaultResult = await validateSageFsRoot(defaultRoot)
      if (defaultResult.root) {
        activeRoot = defaultResult.root
        localStorage.setItem('eqdir', activeRoot)
        return activeRoot
      }
      if (!defaultResult.bridgeAvailable) {
        await showSageNotice(
          'The local Spire filesystem bridge is unavailable. Start or restart the local Spire backend, then try again.'
        )
        return ''
      }
      const candidate = await requestSageDirectoryPath(defaultRoot)
      return (await selectRootFromPath(candidate)) || ''
    },
    getPath(file: { path?: string }) { return file?.path || activeRoot || '' },
    onMessage() {},
    proxyFetch(input: RequestInfo | URL, init?: RequestInit) { return fetch(input, init) },
    setZoomFactor() {},
  }

  disableSageHostZoom()

  console.log('[SageBridge] local Spire filesystem bridge ready', { root: activeRoot })
}

export const loadEqSageEmbed = async (): Promise<EqSageEmbedModule> => {
  const baseUrl = getEmbedBaseUrl()
  const cacheKey = getEmbedCacheKey()
  ;(window as any).__SPIRE_EQSAGE_EMBED_CONFIG__ = {
    assetBase: baseUrl,
  }
  await installSpireSageFileBridge()
  ensureStyle(baseUrl)

  return import(/* webpackIgnore: true */ `${baseUrl}/eqsage-embed.js?v=${cacheKey}`) as Promise<EqSageEmbedModule>
}
