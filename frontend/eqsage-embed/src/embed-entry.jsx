import React from 'react';
import ReactDOM from 'react-dom/client';
import { flushSync } from 'react-dom';
import bjs from '@bjs';

import './index.css';

import { setEmbedConfig } from './embed-config';

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
  if (initialized) {
    return;
  }
  if (!initializedPromise) {
    initializedPromise = bjs.initialize().then(() => {
      initialized = true;
    });
  }
  await initializedPromise;
};

const renderApp = async (container, spireBridge, options = {}) => {
  const [
    { Main },
    { GlobalStoreProvider },
    { MainProvider },
    { SettingsProvider },
    { AlertProvider },
  ] = await Promise.all([
    import('./components/main/main'),
    import('./state'),
    import('./components/main/context'),
    import('./context/settings'),
    import('./context/alerts'),
  ]);

  const root = ReactDOM.createRoot(container);
  roots.set(container, root);
  flushSync(() => {
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
  await waitForNextPaint();
};

export const mountSpireZoneEditor = async (
  container,
  { spireBridge, initialRouteState, onChromeChange } = {}
) => {
  if (!container) {
    throw new Error('mountSpireZoneEditor requires a container element');
  }
  if (!spireBridge) {
    throw new Error('mountSpireZoneEditor requires a spireBridge');
  }

  unmountSpireZoneEditor(container);
  setEmbedConfig(globalThis.__SPIRE_EQSAGE_EMBED_CONFIG__ ?? {});
  await renderApp(container, spireBridge, {
    initialRouteState,
    onChromeChange,
  });

  const scheduleInit = globalThis.requestIdleCallback
    ? (fn) => globalThis.requestIdleCallback(fn, { timeout: 1500 })
    : (fn) => globalThis.setTimeout(fn, 50);

  deferredInitializationHandle = scheduleInit(() => {
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
