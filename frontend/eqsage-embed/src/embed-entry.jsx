import React from 'react';
import ReactDOM from 'react-dom/client';
import { flushSync } from 'react-dom';

import './index.css';

import { setEmbedConfig } from './embed-config';
import { debugSageLog, markStage } from './debug-stage';

const roots = new WeakMap();
const SPIRE_SAGE_EMBED_BUILD = 'spire-sage-qa-cache-v2';

const notifyStage = (options, stage, detail = '', extras = {}) => {
  options?.onStageChange?.({
    stage,
    detail,
    ...extras,
  });
};

const waitForNextPaint = () =>
  new Promise((resolve) => {
    const raf = globalThis.requestAnimationFrame;
    if (!raf) {
      globalThis.setTimeout(resolve, 16);
      return;
    }
    raf(() => raf(resolve));
  });

const renderApp = async (container, spireBridge, options = {}) => {
  notifyStage(options, 'embed:loading', 'Loading EQ Sage shell');
  markStage('render:imports:start');
  debugSageLog('[SageEmbed]', 'render:imports:start');
  debugSageLog('[SageEmbed]', 'import:main:start');
  notifyStage(options, 'embed:imports', 'Loading main view');
  const { Main } = await import('./components/main/main');
  debugSageLog('[SageEmbed]', 'import:main:done');

  debugSageLog('[SageEmbed]', 'import:state:start');
  notifyStage(options, 'embed:imports', 'Loading state store');
  const { GlobalStoreProvider } = await import('./state');
  debugSageLog('[SageEmbed]', 'import:state:done');

  debugSageLog('[SageEmbed]', 'import:context:start');
  notifyStage(options, 'embed:imports', 'Loading startup context');
  const { MainProvider } = await import('./components/main/context');
  debugSageLog('[SageEmbed]', 'import:context:done');

  debugSageLog('[SageEmbed]', 'import:settings:start');
  notifyStage(options, 'embed:imports', 'Loading settings');
  const { SettingsProvider } = await import('./context/settings');
  debugSageLog('[SageEmbed]', 'import:settings:done');

  debugSageLog('[SageEmbed]', 'import:alerts:start');
  notifyStage(options, 'embed:imports', 'Loading alerts');
  const { AlertProvider } = await import('./context/alerts');
  debugSageLog('[SageEmbed]', 'import:alerts:done');
  markStage('render:imports:done');
  debugSageLog('[SageEmbed]', 'render:imports:done');

  const root = ReactDOM.createRoot(container);
  roots.set(container, root);
  markStage('render:createRoot');
  debugSageLog('[SageEmbed]', 'render:createRoot');
  notifyStage(options, 'embed:render', 'Creating React root');
  flushSync(() => {
    markStage('render:flushSync:start');
    debugSageLog('[SageEmbed]', 'render:flushSync:start');
    root.render(
      <GlobalStoreProvider>
        <SettingsProvider storageKey="eqsage-embed-options">
          <AlertProvider>
            <MainProvider
              initialRouteState={options.initialRouteState}
              onChromeChange={options.onChromeChange}
              spireBridge={spireBridge}
            >
              <Main onBootStateChange={options.onStageChange} />
            </MainProvider>
          </AlertProvider>
        </SettingsProvider>
      </GlobalStoreProvider>
    );
  });
  markStage('render:flushSync:done');
  debugSageLog('[SageEmbed]', 'render:flushSync:done');
  notifyStage(options, 'embed:render', 'Waiting for first paint');
  await waitForNextPaint();
  markStage('render:painted');
  debugSageLog('[SageEmbed]', 'render:painted');
  notifyStage(options, 'embed:painted', 'React shell painted');
};

export const mountSpireZoneEditor = async (
  container,
  { spireBridge, initialRouteState, onChromeChange, onStageChange } = {}
) => {
  notifyStage({ onStageChange }, 'embed:mount', 'Starting EQ Sage mount');
  markStage('mount:start');
  debugSageLog('[SageEmbed]', 'mount:start');
  globalThis.__spireSageEmbedBuild = SPIRE_SAGE_EMBED_BUILD;
  if (!container) {
    throw new Error('mountSpireZoneEditor requires a container element');
  }
  if (!spireBridge) {
    throw new Error('mountSpireZoneEditor requires a spireBridge');
  }

  unmountSpireZoneEditor(container);
  setEmbedConfig(globalThis.__SPIRE_EQSAGE_EMBED_CONFIG__ ?? {});
  markStage('mount:config-set');
  debugSageLog('[SageEmbed]', 'mount:config-set');
  notifyStage({ onStageChange }, 'embed:config', 'Embed configuration loaded');
  await renderApp(container, spireBridge, {
    initialRouteState,
    onChromeChange,
    onStageChange,
  });
  markStage('mount:rendered');
  debugSageLog('[SageEmbed]', 'mount:rendered');
  notifyStage({ onStageChange }, 'embed:mounted', 'EQ Sage mounted');
};

export const unmountSpireZoneEditor = (container) => {
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
};
