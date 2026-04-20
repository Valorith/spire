import React from 'react';
import ReactDOM from 'react-dom/client';
import { flushSync } from 'react-dom';

import './index.css';

import { setEmbedConfig } from './embed-config';
import { debugSageLog, markStage } from './debug-stage';

const roots = new WeakMap();

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
  markStage('render:imports:start');
  debugSageLog('[SageEmbed]', 'render:imports:start');
  debugSageLog('[SageEmbed]', 'import:main:start');
  const { Main } = await import('./components/main/main');
  debugSageLog('[SageEmbed]', 'import:main:done');

  debugSageLog('[SageEmbed]', 'import:state:start');
  const { GlobalStoreProvider } = await import('./state');
  debugSageLog('[SageEmbed]', 'import:state:done');

  debugSageLog('[SageEmbed]', 'import:context:start');
  const { MainProvider } = await import('./components/main/context');
  debugSageLog('[SageEmbed]', 'import:context:done');

  debugSageLog('[SageEmbed]', 'import:settings:start');
  const { SettingsProvider } = await import('./context/settings');
  debugSageLog('[SageEmbed]', 'import:settings:done');

  debugSageLog('[SageEmbed]', 'import:alerts:start');
  const { AlertProvider } = await import('./context/alerts');
  debugSageLog('[SageEmbed]', 'import:alerts:done');
  markStage('render:imports:done');
  debugSageLog('[SageEmbed]', 'render:imports:done');

  const root = ReactDOM.createRoot(container);
  roots.set(container, root);
  markStage('render:createRoot');
  debugSageLog('[SageEmbed]', 'render:createRoot');
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
              <Main />
            </MainProvider>
          </AlertProvider>
        </SettingsProvider>
      </GlobalStoreProvider>
    );
  });
  markStage('render:flushSync:done');
  debugSageLog('[SageEmbed]', 'render:flushSync:done');
  await waitForNextPaint();
  markStage('render:painted');
  debugSageLog('[SageEmbed]', 'render:painted');
};

export const mountSpireZoneEditor = async (
  container,
  { spireBridge, initialRouteState, onChromeChange } = {}
) => {
  markStage('mount:start');
  debugSageLog('[SageEmbed]', 'mount:start');
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
  await renderApp(container, spireBridge, {
    initialRouteState,
    onChromeChange,
  });
  markStage('mount:rendered');
  debugSageLog('[SageEmbed]', 'mount:rendered');
};

export const unmountSpireZoneEditor = (container) => {
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
};
