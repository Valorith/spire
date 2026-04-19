type EqSageEmbedModule = {
  mountSpireZoneEditor: (
    container: HTMLElement,
    options: {
      spireBridge: unknown
      initialRouteState?: Record<string, unknown>
      onChromeChange?: (state: { immersive: boolean }) => void
    }
  ) => Promise<void>
  unmountSpireZoneEditor: (container: HTMLElement) => void
}

const defaultBaseUrl = '/eqsage-embed'
const cssId = 'eqsage-embed-style'
let embedCacheKey: string | null = null

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const getEmbedCacheKey = () => {
  if (embedCacheKey) {
    return embedCacheKey
  }

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
        embedCacheKey = match[1]
        return embedCacheKey
      }
    }
  }

  embedCacheKey = 'embed'
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

export const loadEqSageEmbed = async (): Promise<EqSageEmbedModule> => {
  const baseUrl = getEmbedBaseUrl()
  const cacheKey = getEmbedCacheKey()
  ;(window as any).__SPIRE_EQSAGE_EMBED_CONFIG__ = {
    assetBase: baseUrl,
  }
  ensureStyle(baseUrl)

  return import(/* webpackIgnore: true */ `${baseUrl}/eqsage-embed.js?v=${cacheKey}`) as Promise<EqSageEmbedModule>
}
