import React from 'react';
import ReactDOM from 'react-dom/client';
import { flushSync } from 'react-dom';
import bjs from '@bjs';

import './index.css';

import { setEmbedConfig } from './embed-config';
import { markStage } from './debug-stage';

const roots = new WeakMap();
let initialized = false;
let initializedPromise = null;
let deferredInitializationHandle = null;

const waitForNextPaint = () =>
  new Promise((resolve) => {
    const raf = globalThis.requestAnimationFrame;
    if (!raf) {
      globalThis.setTimeout(resolve, 16);
      return;
    }
    raf(() => raf(resolve));
  });

const initializeBabylon = async () => {
  markStage('babylon-init:start');
  console.log('[SageEmbed]', 'babylon-init:start');
  if (initialized) {
    markStage('babylon-init:already');
    console.log('[SageEmbed]', 'babylon-init:already');
    return;
  }
  if (!initializedPromise) {
    initializedPromise = bjs.initialize().then(() => {
      initialized = true;
      markStage('babylon-init:done');
      console.log('[SageEmbed]', 'babylon-init:done');
    });
  }
  await initializedPromise;
};

const renderApp = async (container, spireBridge, options = {}) => {
  markStage('render:imports:start');
  console.log('[SageEmbed]', 'render:imports:start');
  console.log('[SageEmbed]', 'import:main:start');
  const { Main } = await import('./components/main/main');
  console.log('[SageEmbed]', 'import:main:done');

  console.log('[SageEmbed]', 'import:state:start');
  const { GlobalStoreProvider } = await import('./state');
  console.log('[SageEmbed]', 'import:state:done');

  console.log('[SageEmbed]', 'import:context:start');
  const { MainProvider } = await import('./components/main/context');
  console.log('[SageEmbed]', 'import:context:done');

  console.log('[SageEmbed]', 'import:settings:start');
  const { SettingsProvider } = await import('./context/settings');
  console.log('[SageEmbed]', 'import:settings:done');

  console.log('[SageEmbed]', 'import:alerts:start');
  const { AlertProvider } = await import('./context/alerts');
  console.log('[SageEmbed]', 'import:alerts:done');
  markStage('render:imports:done');
  console.log('[SageEmbed]', 'render:imports:done');

  const root = ReactDOM.createRoot(container);
  roots.set(container, root);
  markStage('render:createRoot');
  console.log('[SageEmbed]', 'render:createRoot');
  flushSync(() => {
    markStage('render:flushSync:start');
    console.log('[SageEmbed]', 'render:flushSync:start');
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
  console.log('[SageEmbed]', 'render:flushSync:done');
  await waitForNextPaint();
  markStage('render:painted');
  console.log('[SageEmbed]', 'render:painted');
};

export const mountSpireZoneEditor = async (
  container,
  { spireBridge, initialRouteState, onChromeChange } = {}
) => {
  markStage('mount:start');
  console.log('[SageEmbed]', 'mount:start');
  if (!container) {
    throw new Error('mountSpireZoneEditor requires a container element');
  }
  if (!spireBridge) {
    throw new Error('mountSpireZoneEditor requires a spireBridge');
  }

  unmountSpireZoneEditor(container);
  setEmbedConfig(globalThis.__SPIRE_EQSAGE_EMBED_CONFIG__ ?? {});
  markStage('mount:config-set');
  console.log('[SageEmbed]', 'mount:config-set');
  await renderApp(container, spireBridge, {
    initialRouteState,
    onChromeChange,
  });
  markStage('mount:rendered');
  console.log('[SageEmbed]', 'mount:rendered');

  const scheduleInit = globalThis.requestIdleCallback
    ? (fn) => globalThis.requestIdleCallback(fn, { timeout: 1500 })
    : (fn) => globalThis.setTimeout(fn, 50);

  deferredInitializationHandle = scheduleInit(() => {
    markStage('mount:idle-init-fired');
    console.log('[SageEmbed]', 'mount:idle-init-fired');
    initializeBabylon().catch((error) => {
      console.error('Failed to initialize Babylon for the Sage embed', error);
    });
  });
};

export const unmountSpireZoneEditor = (container) => {
  if (deferredInitializationHandle) {
    if (globalThis.cancelIdleCallback) {
      globalThis.cancelIdleCallback(deferredInitializationHandle);
    } else {
      globalThis.clearTimeout(deferredInitializationHandle);
    }
    deferredInitializationHandle = null;
  }
  const root = roots.get(container);
  if (root) {
    root.unmount();
    roots.delete(container);
  }
};
