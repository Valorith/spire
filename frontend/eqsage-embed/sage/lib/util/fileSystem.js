let fsInterface = {};
const isElectron = () =>
  typeof process != 'undefined' &&
  process.versions != null && // eslint-disable-line
  process.versions.electron != null; // eslint-disable-line

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) { // eslint-disable-line
  if (isElectron()) {
    if (!import.meta.env.DEV) { 
      const originalFetch = globalThis.fetch; // eslint-disable-line
      globalThis.fetch = async (input, init) => { // eslint-disable-line
        let newInput = input;
        // For any URL starting with /, replace with a relative path
        if (typeof input === 'string' && input.startsWith('/')) {
          newInput = `.${input}`;
        } else if (input instanceof Request && input.url.startsWith('/')) {
          newInput = new Request(`.${input.url}`, input);
        }
        // This gets doubled up from relative path
        newInput = newInput.replace('/static', '');
        return originalFetch(newInput, init);
      };
    }

    const { promises: fs } = require('fs');
    const path = require('path');
    fsInterface = {
      readFile    : async (filePath) => (await fs.readFile(filePath).catch(() => null))?.buffer,
      deleteFile  : async (filePath) => (await fs.unlink(filePath).catch(() => null)),
      deleteFolder: async (folderPath) => {
        await fs.rm(folderPath, { recursive: true, force: true }).catch(() => {});
      },
      readDir: async (filePath) => {
        const entries = await fs.readdir(filePath);
        const detailedEntries = await Promise.all(
          entries.map(async (entry) => {
            const fullPath = path.join(filePath, entry);
            const stats = await fs.stat(fullPath);
            return {
              name       : entry,
              path       : fullPath.replaceAll('\\', '/'),
              isDirectory: stats.isDirectory(),
              isFile     : stats.isFile()
            };
          })
        );
        return detailedEntries;
      },
      createIfNotExist: async (path) => {
        try {
          await fs.access(path);
        } catch {
          await fs.mkdir(path);
        }
      },
      writeFile: async (filePath, data) => await fs.writeFile(filePath, data),
    };
  }
} else if (window.electronAPI && window.electronFS) { // We're in Sage electron but not in worker scope
  fsInterface = window.electronFS;
  window.electronAPI.onMessage?.((_event, message) => {
    console.log('Electron error', message);
    window.gameController.openAlert(`Got error from Electron: ${message}.`, 'warning');
  });
  
  const isSpirePreview =
    typeof window !== 'undefined' && window.__spireSageDisableHostZoom;

  // Debounce helper function
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  let lastZoomFactor = null;
  let ignoreResize = false;

  // Adjusts zoom based on aspect ratio (desired ratio: 16:9)
  function adjustZoomByAspectRatio() {
    if (ignoreResize) {
      return;
    }

    // Define the desired aspect ratio
    const desiredAspectRatio = 16 / 9;
    // Compute the current window aspect ratio
    const currentAspectRatio = window.innerWidth / window.innerHeight;

    // If the window is "squashed" (i.e. current is less than desired), calculate a scale
    const newZoom = currentAspectRatio < desiredAspectRatio 
      ? currentAspectRatio / desiredAspectRatio 
      : 1;

    // Only update if the zoom factor changes significantly
    if (lastZoomFactor !== null && Math.abs(newZoom - lastZoomFactor) < 0.01) {
      return;
    }
    lastZoomFactor = newZoom;

    // Temporarily ignore resize events to prevent feedback loops
    ignoreResize = true;
    // Set the zoom factor via your Electron API (assumed exposed from preload)
    window.electronAPI.setZoomFactor(newZoom);
    console.log(
    `Window aspect ratio: ${currentAspectRatio.toFixed(2)} vs. desired: ${desiredAspectRatio.toFixed(2)} → Zoom factor: ${newZoom.toFixed(2)}`
    );

    // Release the resize lock after a short delay
    setTimeout(() => {
      ignoreResize = false;
    }, 300);
  }

  if (!isSpirePreview) {
    // Create a debounced version to avoid rapid firing
    const debouncedAdjustZoom = debounce(adjustZoomByAspectRatio, 50);

    // Initial call on load
    adjustZoomByAspectRatio();
    // Listen for window resize events using the debounced function
    window.addEventListener('resize', debouncedAdjustZoom);
  }
}

// A Sage load can perform thousands of existence checks against the same large
// texture directory. Keep one snapshot for the duration of a normal editing
// session; writes made through this adapter update the snapshot below, and a
// full page reload naturally starts with a fresh cache.
const DIRECTORY_CACHE_TTL_MS = 5 * 60 * 1000;
const directoryEntryCache = new Map();
const directoryEntryRequests = new Map();

const getDirectoryCacheKey = (path) =>
  `${path}`.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase();

const createDirectorySnapshot = (entries) => ({
  entries,
  entriesByLowerName: new Map(entries.map((entry) => [entry.name.toLowerCase(), entry])),
  entriesByName     : new Map(entries.map((entry) => [entry.name, entry])),
  expiresAt         : Date.now() + DIRECTORY_CACHE_TTL_MS,
});

const readDirectoryEntries = async (path) => {
  const key = getDirectoryCacheKey(path);
  const cached = directoryEntryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const pending = directoryEntryRequests.get(key);
  if (pending) {
    return pending;
  }

  const request = fsInterface.readDir(path)
    .then((entries) => {
      const snapshot = createDirectorySnapshot(entries);
      directoryEntryCache.set(key, snapshot);
      return snapshot;
    })
    .finally(() => {
      directoryEntryRequests.delete(key);
    });
  directoryEntryRequests.set(key, request);
  return request;
};

const updateCachedDirectoryEntry = (directoryPath, entry) => {
  const key = getDirectoryCacheKey(directoryPath);
  const cached = directoryEntryCache.get(key);
  if (!cached) {
    return;
  }

  const lowerName = entry.name.toLowerCase();
  const previous = cached.entriesByLowerName.get(lowerName);
  const entries = previous
    ? cached.entries.map((candidate) => candidate === previous ? entry : candidate)
    : [...cached.entries, entry];
  directoryEntryCache.set(key, createDirectorySnapshot(entries));
};

const removeCachedDirectoryEntry = (directoryPath, name) => {
  const key = getDirectoryCacheKey(directoryPath);
  const cached = directoryEntryCache.get(key);
  if (!cached) {
    return;
  }

  const lowerName = name.toLowerCase();
  directoryEntryCache.set(
    key,
    createDirectorySnapshot(
      cached.entries.filter((entry) => entry.name.toLowerCase() !== lowerName)
    )
  );
};

const getParentDirectory = (path) => path.slice(0, path.lastIndexOf('/'));

class SageFileSystemFileHandle {
  #path = '';
  kind = 'file';
  name = '';
  constructor(path) {
    this.#path = path.endsWith('/') ? path.slice(0, path.length - 2) : path;
    this.name = path.split('/').at(-1);

  }
  async createWritable() {
    const path = this.#path;
    return {
      locked: false,
      async write(data) {
        await fsInterface.writeFile(path, data instanceof ArrayBuffer ? new Uint8Array(data) : data);
        updateCachedDirectoryEntry(getParentDirectory(path), {
          isDirectory: false,
          isFile     : true,
          name       : path.split('/').at(-1),
          path,
        });
      },
      close() {},
      getWriter() {
        return {
          releaseLock() {}
        };
      }
    };
  }
  async removeEntry() {
    await fsInterface.deleteFile(`${this.#path}`);
    removeCachedDirectoryEntry(getParentDirectory(this.#path), this.name);
  }
  async getFile() {
    const rootPath = this.#path;
    return {
      name: this.name,
      async arrayBuffer() {
        return await fsInterface.readFile(`${rootPath}`);
      },
      async text() {
        const file = await fsInterface.readFile(`${rootPath}`);
        return new TextDecoder('utf-8').decode(file);
      }
    };
  }
}

export class SageFileSystemDirectoryHandle {
  #path = '';
  kind = 'directory';
  name = '';
  constructor(path) {
    this.#path = path;
    this.name = path.split('/').at(-1);
  }
  get path() {
    return this.#path;
  }
  async queryPermission() {
    return 'granted';
  }

  async requestPermission() {
    return 'granted';
  }

  async *values() {
    const { entries } = await readDirectoryEntries(this.#path);
    for (const f of entries) {
      yield f.isDirectory ? new SageFileSystemDirectoryHandle(f.path) : new SageFileSystemFileHandle(f.path);
    }
  }

  async *entries() {
    const { entries } = await readDirectoryEntries(this.#path);
    for (const f of entries) {
      yield [f.name, f.isDirectory ? new SageFileSystemDirectoryHandle(f.path) : new SageFileSystemFileHandle(f.path)];
    }
  }

  async getFileHandle(name, options = {}) {
    const fullPath = `${this.#path}/${name}`;
    if (!options?.create) {
      const snapshot = await readDirectoryEntries(this.#path).catch(() => createDirectorySnapshot([]));
      const fileEntry = snapshot.entriesByName.get(name) ??
        snapshot.entriesByLowerName.get(name.toLowerCase());
      if (!fileEntry) {
        throw new DOMException(
          `File not found: ${fullPath}`,
          'NotFoundError'
        );
      }
      if (!fileEntry.isFile) {
        throw new DOMException(
          `Not a file: ${fullPath}`,
          'TypeMismatchError'
        );
      }
      return new SageFileSystemFileHandle(fileEntry.path);
    }
    return new SageFileSystemFileHandle(fullPath);
  }

  async removeEntry(path) {
    const fullPath = `${this.#path}/${path}`;
    const snapshot = await readDirectoryEntries(this.#path)
      .catch(() => createDirectorySnapshot([]));
    const entry = snapshot.entriesByName.get(path) ??
      snapshot.entriesByLowerName.get(path.toLowerCase());
    if (entry?.isDirectory) {
      await fsInterface.deleteFolder(fullPath);
    } else if (entry?.isFile) {
      await fsInterface.deleteFile(fullPath);
    }
    removeCachedDirectoryEntry(this.#path, path);
  }
  
  async getDirectoryHandle(name, _options) {
    const path = `${this.#path}/${name}`;
    await fsInterface.createIfNotExist(path);
    updateCachedDirectoryEntry(this.#path, {
      isDirectory: true,
      isFile     : false,
      name,
      path,
    });
    return new SageFileSystemDirectoryHandle(path);
  }
}
export const createFileSystemHandle = path => {
  return new SageFileSystemFileHandle(path);
};

export const createDirectoryHandle = path => {
  return new SageFileSystemDirectoryHandle(path);
};
