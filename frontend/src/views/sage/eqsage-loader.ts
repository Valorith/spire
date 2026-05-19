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
    return `embed-${explicitCacheBust}`
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
        embedCacheKey = `${match[1]}-${sessionNonce}`
        return embedCacheKey
      }
    }
  }

  embedCacheKey = `embed-${sessionNonce}`
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
    const bridgeAvailable = response.status !== 403 && response.status !== 404
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
  if (!resolved.root && !resolved.bridgeAvailable) {
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
      throw new Error(`Sage filesystem ${operation} failed (${response.status})`)
    }
    return response
  }

  const selectRootFromPath = async (candidate: string | null) => {
    if (!candidate) {
      return null
    }
    const result = await validateSageFsRoot(candidate)
    if (!result.root) {
      window.alert(
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
      const response = await requestOk('read-file', filePath, { method: 'GET' })
      if (response.headers.get('X-Sage-Preview-Missing') === '1') {
        return null
      }
      return response.arrayBuffer()
    },
    async createIfNotExist(_filePath: string) {
      return true
    },
    async writeFile(filePath: string, data: ArrayBuffer | ArrayBufferView | string) {
      await requestOk('write-file', filePath, {
        body: data instanceof ArrayBuffer || ArrayBuffer.isView(data)
          ? data
          : String(data ?? ''),
        method: 'POST',
      })
    },
    async deleteFile(filePath: string) {
      await requestOk('delete-file', filePath, { method: 'DELETE' })
    },
    async deleteFolder(filePath: string) {
      await requestOk('delete-folder', filePath, { method: 'DELETE' })
    },
  }

  ;(window as any).electronAPI = {
    async hasStandalone() { return true },
    async selectDirectory() {
      const defaultRoot = activeRoot || localStorage.getItem('eqdir') || defaultEqDirCandidates[0]
      const candidate = window.prompt('Enter the full path to your EverQuest directory:', defaultRoot)
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
