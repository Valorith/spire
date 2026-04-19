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

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const getEmbedBaseUrl = () => {
  const windowConfig = (window as any).__SPIRE_EQSAGE_EMBED_URL__
  const envConfig = process.env.VUE_APP_EQSAGE_EMBED_URL
  return trimTrailingSlash(windowConfig || envConfig || defaultBaseUrl)
}

const ensureStyle = (baseUrl: string) => {
  if (document.getElementById(cssId)) {
    return
  }

  const link = document.createElement('link')
  link.id = cssId
  link.rel = 'stylesheet'
  link.href = `${baseUrl}/eqsage-embed.css`
  document.head.appendChild(link)
}

export const loadEqSageEmbed = async (): Promise<EqSageEmbedModule> => {
  const baseUrl = getEmbedBaseUrl()
  ;(window as any).__SPIRE_EQSAGE_EMBED_CONFIG__ = {
    assetBase: baseUrl,
  }
  ensureStyle(baseUrl)

  return import(/* webpackIgnore: true */ `${baseUrl}/eqsage-embed.js`) as Promise<EqSageEmbedModule>
}
