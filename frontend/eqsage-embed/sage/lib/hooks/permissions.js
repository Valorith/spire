import { useCallback, useEffect, useState } from 'react';
import * as keyval from 'idb-keyval';
import { createDirectoryHandle } from '../util/fileSystem';

export const PermissionStatusTypes = {
  ApiUnavailable: -1,
  Ready         : 0,
  NeedEQDir     : 1,
  NeedRefresh   : 2,
};

const hasElectronFileBridge = () =>
  !!window.electronFS &&
  typeof window.electronAPI?.selectDirectory === 'function';

const hasNativeFileSystemApi = () =>
  typeof window.showDirectoryPicker === 'function' &&
  typeof window.FileSystemHandle?.prototype?.queryPermission === 'function' &&
  typeof window.FileSystemHandle?.prototype?.requestPermission === 'function';

const hasUsableFileAccess = () =>
  hasElectronFileBridge() || hasNativeFileSystemApi();

const logPermissionStep = (message, extra) => {
  if (extra !== undefined) {
    console.log(`[SagePermissions] ${message}`, extra);
    return;
  }

  console.log(`[SagePermissions] ${message}`);
};

const getStoredDirectory = async (name) =>
  hasElectronFileBridge() ? localStorage.getItem(name) : keyval.get(name);

const setStoredDirectory = async (name, value) => {
  if (hasElectronFileBridge()) {
    localStorage.setItem(name, value);
    return;
  }

  await keyval.set(name, value);
};

const deleteStoredDirectory = async (name) => {
  if (hasElectronFileBridge()) {
    localStorage.removeItem(name);
    return;
  }

  await keyval.del(name);
};

/**
 * Custom React hook to manage file system permissions and handle directory selection.
 *
 * @param {string} [name='eqdir'] - The key name used for storing the directory handle in IndexedDB.
 * @returns {[number, Function, Function, Function, FileSystemDirectoryHandle|null]} An array containing:
 *   - `permissionStatus` (number): Current permission status.
 *   - `onDrop` (Function): Callback to handle drop events.
 *   - `onFolderSelected` (Function): Callback to open the directory picker.
 *   - `checkHandlePermissions` (Function): Function to check and update permissions.
 *   - `fsHandle` (FileSystemDirectoryHandle|null): The current file system handle.
 */
export const usePermissions = (name = 'eqdir') => {
  const [fsHandle, setFsHandle] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(
    PermissionStatusTypes.NeedEQDir
  );

  useEffect(() => {
    if (
      permissionStatus === PermissionStatusTypes.NeedRefresh &&
      window.electronFS
    ) {
      setPermissionStatus(PermissionStatusTypes.Ready);
    }
  }, [permissionStatus]);

  const checkHandlePermissions = useCallback(
    async (h) => {
      const handle = fsHandle || h;
      if (!handle) {
        return false;
      }

      const permission = await handle.requestPermission({
        mode: 'readwrite',
      }).catch(() => 'denied');

      if (permission === 'granted') {
        setPermissionStatus(PermissionStatusTypes.Ready);
        return true;
      }

      setPermissionStatus(PermissionStatusTypes.NeedRefresh);
      return false;
    },
    [fsHandle]
  );

  useEffect(() => {
    if (!hasUsableFileAccess()) {
      return;
    }
    (async () => {
      let persistedDir = await getStoredDirectory(name);
      if (!persistedDir) {
        setPermissionStatus(PermissionStatusTypes.NeedEQDir);
        return;
      }
      if (hasElectronFileBridge()) {
        persistedDir = createDirectoryHandle(persistedDir);
      } else if (
        persistedDir.kind !== 'directory' ||
        typeof persistedDir.queryPermission !== 'function'
      ) {
        await deleteStoredDirectory(name);
        setPermissionStatus(PermissionStatusTypes.NeedEQDir);
        return;
      }
      setFsHandle(persistedDir);
      setPermissionStatus(
        (await persistedDir.queryPermission({
          mode: 'readwrite',
        })) === 'granted'
          ? PermissionStatusTypes.Ready
          : PermissionStatusTypes.NeedRefresh
      );
    })();
  }, [name]);

  const onDrop = useCallback(
    async (e) => {
      if (e?.kind === 'directory') {
        await deleteStoredDirectory(name);
        await setStoredDirectory(name, e);

        setFsHandle(e);
        setPermissionStatus(PermissionStatusTypes.NeedRefresh);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (!hasUsableFileAccess()) {
        return;
      }
      if (e.dataTransfer.items?.length) {
        const first = e.dataTransfer.items[0];
        if (hasElectronFileBridge()) {
          const path = window.electronAPI.getPath(e.dataTransfer.files[0]);
          setFsHandle(createDirectoryHandle(path));
          setPermissionStatus(PermissionStatusTypes.Ready);
          await setStoredDirectory(name, path);
  
          return;
        }

        if (first.getAsFileSystemHandle) {
          first
            .getAsFileSystemHandle()
            .then(async (handle) => {
              console.log('Handle', handle);

              if (handle.kind === 'file') {
              } else if (handle.kind === 'directory') {
                await deleteStoredDirectory(name);
                await setStoredDirectory(name, handle);
                setFsHandle(handle);
                setPermissionStatus(PermissionStatusTypes.NeedRefresh);
              }
            })
            .catch((e) => {
              console.warn('Could not get handle', e);
            });
        }
      }
      e.preventDefault();
      e.stopPropagation();
    },
    [name]
  );

  const unlink = useCallback(async () => {
    await deleteStoredDirectory(name);
    setFsHandle(null);
    setPermissionStatus(PermissionStatusTypes.NeedEQDir);
  }, [name]);

  const onFolderSelected = useCallback(async () => {
    logPermissionStep('folder selection requested', {
      electronBridge: hasElectronFileBridge(),
      nativeApi     : hasNativeFileSystemApi(),
    });

    if (hasElectronFileBridge()) {
      const selectedPath = await window.electronAPI.selectDirectory();
      if (!selectedPath) {
        logPermissionStep('electron directory selection cancelled');
        return;
      }
      const handle = createDirectoryHandle(selectedPath);
      setFsHandle(handle);
      setPermissionStatus(PermissionStatusTypes.Ready);
      await setStoredDirectory(name, selectedPath).catch((error) => {
        console.warn('[SagePermissions] failed to persist electron directory', error);
      });
      logPermissionStep('electron directory selection ready', selectedPath);
      return;
    }

    if (!hasNativeFileSystemApi()) {
      console.warn('File System Access API is not supported in this browser.');
      return;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (handle.kind === 'directory') {
        setFsHandle(handle);
        setPermissionStatus(PermissionStatusTypes.NeedRefresh);
        logPermissionStep('native directory handle selected', {
          name: handle.name,
          kind: handle.kind,
        });
        await deleteStoredDirectory(name).catch((error) => {
          console.warn('[SagePermissions] failed to clear persisted directory', error);
        });
        await setStoredDirectory(name, handle).catch((error) => {
          console.warn('[SagePermissions] failed to persist native directory handle', error);
        });
        const granted = await checkHandlePermissions(handle);
        if (!granted) {
          setPermissionStatus(PermissionStatusTypes.NeedRefresh);
        }
        logPermissionStep('native directory permission result', {
          name: handle.name,
          granted,
        });
      } else {
        console.warn('Selected handle is not a directory.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Ignore abort errors when user cancels the dialog
        console.error('Error selecting directory:', error);
      }
    }
  }, [name, checkHandlePermissions]);

  const informFsHandle = useCallback(async handle => {
    await setStoredDirectory(name, handle);
    setFsHandle(handle);
    await checkHandlePermissions(handle);
  }, [checkHandlePermissions, name]);
  
  return [
    permissionStatus === PermissionStatusTypes.NeedRefresh && hasElectronFileBridge()
      ? PermissionStatusTypes.Ready
      : hasUsableFileAccess()
        ? permissionStatus
        : PermissionStatusTypes.ApiUnavailable,
    onDrop,
    checkHandlePermissions,
    fsHandle,
    onFolderSelected,
    unlink,
    informFsHandle
  ];
};
