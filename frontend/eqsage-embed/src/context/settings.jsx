import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import {
  CAMERA_FLY_SPEED_DEFAULT,
  clampFlySpeed,
} from '../viewer/common/cameraSettings';

export const SettingsContext = createContext({});
export const useSettingsContext = () => useContext(SettingsContext);

export const globalSettings = {
  flySpeed         : CAMERA_FLY_SPEED_DEFAULT,
  showRegions      : false,
  glow             : true,
  webgpu           : false,
  forceReload      : false,
  clipPlane        : 10000,
  spawnLOD         : 50000,
  remoteUrl        : '',
  soundAutoPlay    : false,
  soundRepeat      : false,
  soundShuffle     : false,
  importBoundary   : false,
  showSpawns       : true,
  disableAnimations: false,
  exportObjects    : false,
};

const SPIRE_ZONE_EDITOR_SETTINGS_VERSION = 3;

const normalizeStoredOptions = (options) => {
  if (typeof window === 'undefined' || !window.__spireSagePreview) {
    return options;
  }

  const normalized = { ...options };
  if (normalized.__spireZoneEditorSettingsVersion !== SPIRE_ZONE_EDITOR_SETTINGS_VERSION) {
    normalized.flySpeed = CAMERA_FLY_SPEED_DEFAULT;
  } else {
    normalized.flySpeed = clampFlySpeed(normalized.flySpeed);
  }
  if (
    normalized.__spireZoneEditorSettingsVersion !== SPIRE_ZONE_EDITOR_SETTINGS_VERSION ||
    !Number.isFinite(Number(normalized.spawnLOD)) ||
    Number(normalized.spawnLOD) < 50000
  ) {
    normalized.spawnLOD = 50000;
  }
  normalized.__spireZoneEditorSettingsVersion = SPIRE_ZONE_EDITOR_SETTINGS_VERSION;
  return normalized;
};

export const SettingsProvider = ({
  children,
  defaultOptions = globalSettings,
  storageKey = 'options',
  stateCallback = undefined,
}) => {
  const [options, setOptions] = useState(
    () => normalizeStoredOptions(JSON.parse(localStorage.getItem(storageKey) ?? '{}'))
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.__spireSagePreview) {
      return;
    }
    const serializedOptions = JSON.parse(JSON.stringify(options));
    if (serializedOptions?.config) {
      delete serializedOptions.config.needsRender;
    }
    localStorage.setItem(storageKey, JSON.stringify(serializedOptions));
  }, [options, storageKey]);

  const setOption = useCallback((itemKey, value) => {
    setOptions((options) => {
      let newOptions = { ...options, [itemKey]: value };
      if (stateCallback) {
        newOptions = stateCallback(itemKey, options, newOptions);
      }
      const serializedOptions = JSON.parse(JSON.stringify(newOptions));
      if (serializedOptions?.config) {
        delete serializedOptions.config.needsRender;
      }
      localStorage.setItem(storageKey, JSON.stringify(serializedOptions));
      return newOptions;
    });
  }, [storageKey, stateCallback]);
  return (
    <SettingsContext.Provider
      value={{
        ...defaultOptions,
        ...options,
        setOption,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
