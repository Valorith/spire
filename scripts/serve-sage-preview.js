const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const defaultDistRoot = path.resolve(__dirname, '..', 'frontend', 'dist');
const defaultIndexPath = path.join(defaultDistRoot, 'index.html');
const defaultChangelogPath = path.resolve(__dirname, '..', 'CHANGELOG.md');
const defaultPackagePath = path.resolve(__dirname, '..', 'package.json');
const repoRoot = path.resolve(__dirname, '..');
const defaultZoneDataPath = path.join(
  defaultDistRoot,
  'eqsage-embed',
  'static',
  'zoneData.json'
);

const mimeTypes = {
  '.css' : 'text/css; charset=utf-8',
  '.gif' : 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico' : 'image/x-icon',
  '.jpg' : 'image/jpeg',
  '.js'  : 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map' : 'application/json; charset=utf-8',
  '.png' : 'image/png',
  '.svg' : 'image/svg+xml',
  '.txt' : 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const readPreviewEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return env;
      }
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return env;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) {
        env[key] = value;
      }
      return env;
    }, {});
};

const getPreviewEnv = () => ({
  ...readPreviewEnvFile(path.join(repoRoot, '.env')),
  ...readPreviewEnvFile(path.join(repoRoot, '.env.debug.host')),
  ...process.env,
});

const readZoneData = (zoneDataPath = defaultZoneDataPath) =>
  fs.existsSync(zoneDataPath)
    ? JSON.parse(fs.readFileSync(zoneDataPath, 'utf8'))
    : [];

const readPreviewChangelog = (changelogPath = defaultChangelogPath) =>
  fs.existsSync(changelogPath)
    ? fs.readFileSync(changelogPath, 'utf8')
    : '## Preview Build\n\nThe local Sage preview server is running without a full backend.';

const readPreviewVersion = (packagePath = defaultPackagePath) => {
  if (!fs.existsSync(packagePath)) {
    return '0.0.0';
  }

  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
};

const coercePreviewValue = (value) => {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  const trimmed = `${value}`.trim();
  if (trimmed === '') {
    return trimmed;
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
};

const normalizeLookupKey = (value = '') =>
  `${value}`.replace(/[^a-z0-9]/gi, '').toLowerCase();

const fallbackPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
  0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
  0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
  0x68, 0x68, 0x68, 0x00, 0x00, 0x03, 0x04, 0x01, 0x81, 0x4b, 0xd3,
  0xd2, 0x10, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

const usePreviewPlaceholderTextures =
  process.env.SAGE_PREVIEW_PLACEHOLDER_TEXTURES === '1' ||
  process.env.SAGE_PREVIEW_FULL_TEXTURES === '0';

const getTextureMimeType = (name = '') =>
  /\.(jpe?g)$/i.test(name) ? 'image/jpeg' : 'image/png';

const isIgnorableMissingTexture = (name) => /^m000\d+$/i.test(`${name ?? ''}`);

const textureBaseName = (value) =>
  `${value ?? ''}`
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .at(-1) || '';

const getTextureCandidates = (rawName) => {
  const base = textureBaseName(rawName).toLowerCase().replace(/\.\w+$/, '');
  if (!base) {
    return [];
  }

  return [
    base,
    base.replace(/-/g, '_'),
    base.replace(/_/g, '-'),
    base.replace(/[^a-z0-9]/g, ''),
  ].filter((candidate, index, candidates) => candidate && candidates.indexOf(candidate) === index);
};

const readPreviewTexture = async (root, rawName) => {
  const textureRoot = path.join(root, 'eqsage', 'textures');
  for (const candidate of getTextureCandidates(rawName)) {
    for (const extension of ['png', 'jpg', 'jpeg']) {
      const fileName = `${candidate}.${extension}`;
      const filePath = path.join(textureRoot, fileName);
      const data = await fs.promises.readFile(filePath).catch((error) => {
        if (error.code === 'ENOENT') {
          return null;
        }
        throw error;
      });
      if (data) {
        return { data, fileName };
      }
    }
  }

  if (isIgnorableMissingTexture(rawName)) {
    return { data: fallbackPngBuffer, fileName: `${rawName}.png` };
  }

  return null;
};

const hydratePreviewGlbImages = async (root, data) => {
  if (
    data.length < 20 ||
    data[0] !== 0x67 ||
    data[1] !== 0x6c ||
    data[2] !== 0x54 ||
    data[3] !== 0x46 ||
    data.readUInt32LE(4) !== 2
  ) {
    return data;
  }

  const chunks = [];
  let jsonChunk = null;
  let offset = 12;
  while (offset + 8 <= data.length) {
    const length = data.readUInt32LE(offset);
    const type = data.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > data.length) {
      return data;
    }
    const chunk = { type, data: data.subarray(start, end) };
    chunks.push(chunk);
    if (type === 0x4e4f534a) {
      jsonChunk = chunk;
    }
    offset = end;
  }

  if (!jsonChunk) {
    return data;
  }

  const gltf = JSON.parse(jsonChunk.data.toString('utf8').replace(/\0+$/g, '').trimEnd());
  let binChunk = chunks.find((chunk) => chunk.type === 0x004e4942);
  if (!binChunk) {
    binChunk = { type: 0x004e4942, data: Buffer.alloc(0) };
    chunks.push(binChunk);
  }

  gltf.buffers = gltf.buffers?.length ? gltf.buffers : [{ byteLength: 0 }];
  gltf.bufferViews = gltf.bufferViews ?? [];
  const binParts = [binChunk.data];
  let binLength = binChunk.data.length;
  let hydrated = false;

  for (const image of gltf.images ?? []) {
    if (image.uri || image.bufferView !== undefined) {
      continue;
    }

    const textureName = image.name ?? image.extras?.name;
    const texture = usePreviewPlaceholderTextures
      ? { data: fallbackPngBuffer, fileName: `${textureName ?? 'texture'}.png` }
      : await readPreviewTexture(root, textureName);
    if (!texture) {
      continue;
    }

    const mimeType = getTextureMimeType(texture.fileName);
    const padLength = (4 - (binLength % 4)) % 4;
    if (padLength) {
      binParts.push(Buffer.alloc(padLength));
      binLength += padLength;
    }

    const byteOffset = binLength;
    binParts.push(texture.data);
    binLength += texture.data.length;

    image.bufferView = gltf.bufferViews.length;
    image.mimeType = mimeType;
    delete image.uri;
    gltf.bufferViews.push({
      buffer    : 0,
      byteLength: texture.data.length,
      byteOffset,
      name      : `${textureName ?? 'texture'}_image`,
    });
    hydrated = true;
  }

  if (!hydrated) {
    return data;
  }

  const finalPadLength = (4 - (binLength % 4)) % 4;
  if (finalPadLength) {
    binParts.push(Buffer.alloc(finalPadLength));
    binLength += finalPadLength;
  }
  binChunk.data = Buffer.concat(binParts, binLength);
  gltf.buffers[0].byteLength = binLength;

  const jsonData = Buffer.from(JSON.stringify(gltf), 'utf8');
  const paddedJsonLength = Math.ceil(jsonData.length / 4) * 4;
  const totalLength = 12 + chunks.reduce(
    (sum, chunk) => sum + 8 + (chunk === jsonChunk ? paddedJsonLength : chunk.data.length),
    0
  );
  const output = Buffer.alloc(totalLength);
  data.copy(output, 0, 0, 12);
  output.writeUInt32LE(totalLength, 8);

  let writeOffset = 12;
  for (const chunk of chunks) {
    if (chunk === jsonChunk) {
      output.writeUInt32LE(paddedJsonLength, writeOffset);
      output.writeUInt32LE(chunk.type, writeOffset + 4);
      output.fill(0x20, writeOffset + 8, writeOffset + 8 + paddedJsonLength);
      jsonData.copy(output, writeOffset + 8);
      writeOffset += 8 + paddedJsonLength;
      continue;
    }

    output.writeUInt32LE(chunk.data.length, writeOffset);
    output.writeUInt32LE(chunk.type, writeOffset + 4);
    chunk.data.copy(output, writeOffset + 8);
    writeOffset += 8 + chunk.data.length;
  }

  return output;
};

const getEntityFieldName = (entity, field) => {
  if (Object.prototype.hasOwnProperty.call(entity, field)) {
    return field;
  }
  const normalizedField = normalizeLookupKey(field);
  return (
    Object.keys(entity).find(
      (key) => normalizeLookupKey(key) === normalizedField
    ) ?? field
  );
};

const getEntityValue = (entity, field) => entity[getEntityFieldName(entity, field)];

const parseQueryClause = (clause) => {
  const operators = [
    ['_notlike_', 'notlike'],
    ['_like_', 'like'],
    ['_gte_', 'gte'],
    ['_lte_', 'lte'],
    ['_gt_', 'gt'],
    ['_lt_', 'lt'],
    ['_ne_', 'ne'],
    ['__', 'eq'],
  ];

  for (const [token, operator] of operators) {
    const tokenIndex = clause.indexOf(token);
    if (tokenIndex === -1) {
      continue;
    }
    return {
      field   : clause.slice(0, tokenIndex),
      operator,
      value   : clause.slice(tokenIndex + token.length),
    };
  }

  return {
    field   : clause,
    operator: 'eq',
    value   : '',
  };
};

const parseQueryClauses = (raw = '') =>
  raw
    .split('.')
    .filter(Boolean)
    .map(parseQueryClause)
    .filter(({ field }) => !!field);

const matchesClause = (entity, clause) => {
  const actual = coercePreviewValue(getEntityValue(entity, clause.field));
  const expected = coercePreviewValue(clause.value);

  switch (clause.operator) {
    case 'like':
      return `${actual ?? ''}`.toLowerCase().includes(`${expected ?? ''}`.toLowerCase());
    case 'notlike':
      return !`${actual ?? ''}`.toLowerCase().includes(`${expected ?? ''}`.toLowerCase());
    case 'ne':
      return actual !== expected;
    case 'gt':
      return actual > expected;
    case 'gte':
      return actual >= expected;
    case 'lt':
      return actual < expected;
    case 'lte':
      return actual <= expected;
    case 'eq':
    default:
      return actual === expected;
  }
};

const applyQuery = (collection, searchParams) => {
  const whereClauses = parseQueryClauses(searchParams.get('where') || '');
  const whereOrClauses = parseQueryClauses(searchParams.get('whereOr') || '');
  const orderByFields = (searchParams.get('orderBy') || '')
    .split('.')
    .filter(Boolean);
  const limit = Number(searchParams.get('limit') || 0);
  const page = Number(searchParams.get('page') || 0);

  let result = [...collection];

  if (whereClauses.length > 0) {
    result = result.filter((entry) =>
      whereClauses.every((clause) => matchesClause(entry, clause))
    );
  }

  if (whereOrClauses.length > 0) {
    result = result.filter((entry) =>
      whereOrClauses.some((clause) => matchesClause(entry, clause))
    );
  }

  if (orderByFields.length > 0) {
    result.sort((left, right) => {
      for (const field of orderByFields) {
        const a = coercePreviewValue(getEntityValue(left, field));
        const b = coercePreviewValue(getEntityValue(right, field));
        if (a === b) {
          continue;
        }
        return a > b ? 1 : -1;
      }
      return 0;
    });
  }

  if (limit > 0) {
    const start = page > 0 ? page * limit : 0;
    result = result.slice(start, start + limit);
  }

  return result;
};

const getWhereValue = (searchParams, ...fields) => {
  const fieldKeys = fields.map((field) => normalizeLookupKey(field));
  const clauses = parseQueryClauses(searchParams.get('where') || '');
  const match = clauses.find(
    (clause) =>
      clause.operator === 'eq' &&
      fieldKeys.includes(normalizeLookupKey(clause.field))
  );
  return match?.value;
};

const getWhereNumber = (searchParams, ...fields) => {
  const value = getWhereValue(searchParams, ...fields);
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const normalizeZoneShortName = (value) => {
  const zone = `${value ?? ''}`.trim().toLowerCase();
  return /^[a-z0-9_]+$/.test(zone) ? zone : null;
};

const sqlString = (value) =>
  `'${`${value ?? ''}`.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;

const coerceMysqlValue = (value) => {
  if (value === undefined || value === null || value === 'NULL' || value === '\\N') {
    return null;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
};

const parseMysqlRows = (stdout, columns) => {
  const output = `${stdout ?? ''}`.trimEnd();
  if (!output) {
    return [];
  }

  return output.split(/\r?\n/).map((line) => {
    const values = line.split('\t');
    return columns.reduce((row, column, index) => {
      row[column] = coerceMysqlValue(values[index]);
      return row;
    }, {});
  });
};

const runMysqlRows = (config, columns, sql) =>
  new Promise((resolve, reject) => {
    const args = [
      '--batch',
      '--raw',
      '--skip-column-names',
      '--default-character-set=utf8mb4',
      `--host=${config.host}`,
      `--port=${config.port}`,
      `--user=${config.user}`,
      config.database,
      '--execute',
      sql,
    ];
    const childEnv = {
      ...process.env,
      MYSQL_PWD: config.password ?? '',
    };

    execFile(config.command, args, {
      env        : childEnv,
      maxBuffer  : 24 * 1024 * 1024,
      windowsHide: true,
    }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}${stderr ? `: ${stderr.trim()}` : ''}`;
        reject(error);
        return;
      }
      resolve(parseMysqlRows(stdout, columns));
    });
  });

const buildMysqlPreviewConfig = (env = getPreviewEnv()) => {
  const enabled =
    env.SAGE_PREVIEW_USE_DB === '1' ||
    env.SAGE_PREVIEW_USE_EQEMU_DB === '1';
  if (!enabled) {
    return null;
  }

  return {
    command : env.SAGE_PREVIEW_MYSQL_PATH || env.MYSQL_PATH || 'mysql',
    database: env.SAGE_PREVIEW_EQEMU_DB_DATABASE || env.MYSQL_EQEMU_DATABASE || 'peq',
    host    : env.SAGE_PREVIEW_EQEMU_DB_HOST || env.MYSQL_EQEMU_HOST || '127.0.0.1',
    password: env.SAGE_PREVIEW_EQEMU_DB_PASSWORD || env.MYSQL_EQEMU_PASSWORD || '',
    port    : Number(env.SAGE_PREVIEW_EQEMU_DB_PORT || env.MYSQL_EQEMU_PORT || 3307),
    user    : env.SAGE_PREVIEW_EQEMU_DB_USERNAME || env.MYSQL_EQEMU_USERNAME || 'eqemu',
  };
};

const DB_DOOR_COLUMNS = [
  'id',
  'doorid',
  'zone',
  'version',
  'name',
  'pos_y',
  'pos_x',
  'pos_z',
  'heading',
  'opentype',
  'guild',
  'lockpick',
  'keyitem',
  'nokeyring',
  'triggerdoor',
  'triggertype',
  'disable_timer',
  'doorisopen',
  'door_param',
  'dest_zone',
  'dest_instance',
  'dest_x',
  'dest_y',
  'dest_z',
  'dest_heading',
  'invert_state',
  'incline',
  'size',
  'buffer',
  'client_version_mask',
  'is_ldon_door',
  'close_timer_ms',
  'dz_switch_id',
  'min_expansion',
  'max_expansion',
  'content_flags',
  'content_flags_disabled',
];

const DB_SPAWN_COLUMNS = [
  'spawn_id',
  'spawngroup_id',
  'spawn_zone',
  'spawn_version',
  'spawn_x',
  'spawn_y',
  'spawn_z',
  'spawn_heading',
  'respawntime',
  'variance',
  'pathgrid',
  'path_when_zone_idle',
  'condition_id',
  'cond_value',
  'animation',
  'spawn_min_expansion',
  'spawn_max_expansion',
  'spawn_content_flags',
  'spawn_content_flags_disabled',
  'entry_spawngroup_id',
  'npc_id',
  'chance',
  'condition_value_filter',
  'min_time',
  'max_time',
  'entry_min_expansion',
  'entry_max_expansion',
  'entry_content_flags',
  'entry_content_flags_disabled',
  'npc_type_id',
  'npc_name',
  'npc_lastname',
  'npc_level',
  'npc_race',
  'npc_class',
  'npc_bodytype',
  'npc_gender',
  'npc_texture',
  'npc_helmtexture',
  'npc_size',
  'npc_runspeed',
  'npc_findable',
  'npc_trackable',
  'npc_version',
  'npc_model',
];

const DB_GRID_ENTRY_COLUMNS = [
  'gridid',
  'zoneid',
  'number',
  'x',
  'y',
  'z',
  'heading',
  'pause',
  'centerpoint',
];

const DB_GRID_COLUMNS = [
  'id',
  'zoneid',
  'type',
  'type_2',
];

const normalizeDbSpawnRows = (rows) => {
  const spawnsById = new Map();
  for (const row of rows) {
    if (!spawnsById.has(row.spawn_id)) {
      spawnsById.set(row.spawn_id, {
        _condition            : row.condition_id ?? 0,
        animation             : row.animation ?? 0,
        cond_value            : row.cond_value ?? 1,
        content_flags         : row.spawn_content_flags,
        content_flags_disabled: row.spawn_content_flags_disabled,
        heading               : row.spawn_heading ?? 0,
        id                    : row.spawn_id,
        max_expansion         : row.spawn_max_expansion ?? -1,
        min_expansion         : row.spawn_min_expansion ?? -1,
        path_when_zone_idle   : row.path_when_zone_idle ?? 0,
        pathgrid              : row.pathgrid ?? 0,
        respawntime           : row.respawntime ?? 0,
        spawnentries          : [],
        spawngroup_id         : row.spawngroup_id,
        variance              : row.variance ?? 0,
        version               : row.spawn_version ?? 0,
        x                     : row.spawn_x ?? 0,
        y                     : row.spawn_y ?? 0,
        z                     : row.spawn_z ?? 0,
        zone                  : row.spawn_zone,
      });
    }

    if (!row.npc_id) {
      continue;
    }

    spawnsById.get(row.spawn_id).spawnentries.push({
      chance                : row.chance ?? 0,
      condition_value_filter: row.condition_value_filter ?? 1,
      content_flags         : row.entry_content_flags,
      content_flags_disabled: row.entry_content_flags_disabled,
      max_expansion         : row.entry_max_expansion ?? -1,
      max_time              : row.max_time ?? 0,
      min_expansion         : row.entry_min_expansion ?? -1,
      min_time              : row.min_time ?? 0,
      npc_id                : row.npc_id,
      npc_type              : row.npc_type_id
        ? {
          bodytype   : row.npc_bodytype ?? 1,
          class      : row.npc_class ?? 0,
          findable   : row.npc_findable ?? 0,
          gender     : row.npc_gender ?? 0,
          helmtexture: row.npc_helmtexture ?? 0,
          id         : row.npc_type_id,
          lastname   : row.npc_lastname ?? '',
          level      : row.npc_level ?? 0,
          model      : row.npc_model ?? 0,
          name       : row.npc_name ?? '',
          race       : row.npc_race ?? 0,
          runspeed   : row.npc_runspeed ?? 0,
          size       : row.npc_size ?? 0,
          texture    : row.npc_texture ?? 0,
          trackable  : row.npc_trackable ?? 0,
          version    : row.npc_version ?? 0,
        }
        : null,
      spawngroup_id: row.entry_spawngroup_id ?? row.spawngroup_id,
    });
  }
  return [...spawnsById.values()];
};

const createPreviewDatabaseBridge = (env = getPreviewEnv()) => {
  const config = buildMysqlPreviewConfig(env);
  if (!config) {
    return null;
  }

  const cache = new Map();
  const ttlMs = Number(env.SAGE_PREVIEW_DB_CACHE_MS || 15_000);
  const cached = (key, loader) => {
    const existing = cache.get(key);
    if (existing && Date.now() - existing.createdAt < ttlMs) {
      return existing.promise;
    }
    const promise = loader();
    cache.set(key, {
      createdAt: Date.now(),
      promise,
    });
    return promise;
  };

  const query = (columns, sql) => runMysqlRows(config, columns, sql);

  return {
    async loadDoors(zone, version) {
      const zoneShortName = normalizeZoneShortName(zone);
      const zoneVersion = Number.isFinite(Number(version)) ? Number(version) : 0;
      if (!zoneShortName) {
        return null;
      }
      return cached(`doors:${zoneShortName}:${zoneVersion}`, () =>
        query(
          DB_DOOR_COLUMNS,
          `SELECT ${DB_DOOR_COLUMNS.join(', ')}
             FROM doors
            WHERE zone = ${sqlString(zoneShortName)}
              AND version = ${zoneVersion}
            ORDER BY doorid, id`
        )
      );
    },

    async loadGridEntries(zoneId) {
      const id = Number(zoneId);
      if (!Number.isFinite(id) || id <= 0) {
        return null;
      }
      return cached(`grid_entries:${id}`, () =>
        query(
          DB_GRID_ENTRY_COLUMNS,
          `SELECT gridid, zoneid, number, x, y, z, heading, pause, centerpoint
             FROM grid_entries
            WHERE zoneid = ${id}
            ORDER BY gridid, number`
        )
      );
    },

    async loadGrids(zoneId) {
      const id = Number(zoneId);
      if (!Number.isFinite(id) || id <= 0) {
        return null;
      }
      return cached(`grids:${id}`, () =>
        query(
          DB_GRID_COLUMNS,
          `SELECT id, zoneid, type, type2 AS type_2
             FROM grid
            WHERE zoneid = ${id}
            ORDER BY id`
        )
      );
    },

    async loadGrid(gridId) {
      const id = Number(gridId);
      if (!Number.isFinite(id) || id <= 0) {
        return null;
      }
      return cached(`grid:${id}`, async () => {
        const rows = await query(
          DB_GRID_COLUMNS,
          `SELECT id, zoneid, type, type2 AS type_2
             FROM grid
            WHERE id = ${id}
            LIMIT 1`
        );
        return rows[0] ?? null;
      });
    },

    async loadSpawns(zone, version) {
      const zoneShortName = normalizeZoneShortName(zone);
      const zoneVersion = Number.isFinite(Number(version)) ? Number(version) : 0;
      if (!zoneShortName) {
        return null;
      }
      const rows = await cached(`spawns:${zoneShortName}:${zoneVersion}`, () =>
        query(
          DB_SPAWN_COLUMNS,
          `SELECT
             s.id AS spawn_id,
             s.spawngroupID AS spawngroup_id,
             s.zone AS spawn_zone,
             s.version AS spawn_version,
             s.x AS spawn_x,
             s.y AS spawn_y,
             s.z AS spawn_z,
             s.heading AS spawn_heading,
             s.respawntime,
             s.variance,
             s.pathgrid,
             s.path_when_zone_idle,
             s._condition AS condition_id,
             s.cond_value,
             s.animation,
             s.min_expansion AS spawn_min_expansion,
             s.max_expansion AS spawn_max_expansion,
             s.content_flags AS spawn_content_flags,
             s.content_flags_disabled AS spawn_content_flags_disabled,
             se.spawngroupID AS entry_spawngroup_id,
             se.npcID AS npc_id,
             se.chance,
             se.condition_value_filter,
             se.min_time,
             se.max_time,
             se.min_expansion AS entry_min_expansion,
             se.max_expansion AS entry_max_expansion,
             se.content_flags AS entry_content_flags,
             se.content_flags_disabled AS entry_content_flags_disabled,
             nt.id AS npc_type_id,
             nt.name AS npc_name,
             nt.lastname AS npc_lastname,
             nt.level AS npc_level,
             nt.race AS npc_race,
             nt.class AS npc_class,
             nt.bodytype AS npc_bodytype,
             nt.gender AS npc_gender,
             nt.texture AS npc_texture,
             nt.helmtexture AS npc_helmtexture,
             nt.size AS npc_size,
             nt.runspeed AS npc_runspeed,
             nt.findable AS npc_findable,
             nt.trackable AS npc_trackable,
             nt.version AS npc_version,
             nt.model AS npc_model
           FROM spawn2 s
           LEFT JOIN spawnentry se
             ON se.spawngroupID = s.spawngroupID
           LEFT JOIN npc_types nt
             ON nt.id = se.npcID
          WHERE s.zone = ${sqlString(zoneShortName)}
            AND s.version = ${zoneVersion}
          ORDER BY s.id, se.chance DESC, se.npcID`
        )
      );
      return normalizeDbSpawnRows(rows);
    },
  };
};

const json = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control'              : 'no-store, no-cache, must-revalidate',
    'Content-Type'               : 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const notFound = (res, reqPath) => {
  json(res, 404, {
    error: `No preview handler for ${reqPath}`,
  });
};

const readRawBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });

const serveFile = (res, absolutePath) => {
  const ext = path.extname(absolutePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(absolutePath);

  stream.on('error', () => {
    if (res.destroyed || res.writableEnded || res.headersSent) {
      return;
    }
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Failed to read file');
  });

  res.on('close', () => {
    stream.destroy();
  });

  res.writeHead(200, {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type' : contentType,
  });
  stream.pipe(res);
};

const isSafePath = (distRoot, absolutePath) => {
  const relative = path.relative(distRoot, absolutePath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const resolvePreviewFsPath = (rootPath, requestedPath, { cacheOnly = false } = {}) => {
  if (!rootPath) {
    const error = new Error('Missing preview filesystem root');
    error.statusCode = 400;
    throw error;
  }

  const root = path.resolve(rootPath);
  const target = path.resolve(
    path.isAbsolute(requestedPath) ? requestedPath : path.join(root, requestedPath || '')
  );
  const allowedRoot = cacheOnly ? path.join(root, 'eqsage') : root;
  const relative = path.relative(allowedRoot, target);

  if (
    target !== allowedRoot &&
    (relative.startsWith('..') || path.isAbsolute(relative))
  ) {
    const error = new Error('Preview filesystem path is outside the allowed root');
    error.statusCode = 403;
    throw error;
  }

  return target;
};

const toSlash = (value) => `${value}`.replaceAll('\\', '/');

const previewSageFsValidationCache = new Map();

const normalizePreviewSageFsRoot = async (rootPath) => {
  const rawRoot = `${rootPath ?? ''}`.trim();
  if (!rawRoot) {
    const error = new Error('missing EverQuest directory');
    error.statusCode = 400;
    throw error;
  }

  const root = path.resolve(rawRoot);
  const stat = await fs.promises.stat(root).catch(() => null);
  if (!stat) {
    const error = new Error('EverQuest directory is not accessible');
    error.statusCode = 400;
    throw error;
  }
  if (!stat.isDirectory()) {
    const error = new Error('EverQuest directory is not a directory');
    error.statusCode = 400;
    throw error;
  }

  return root;
};

const isPreviewEverQuestClientDirectory = async (root) => {
  if (previewSageFsValidationCache.has(root)) {
    return previewSageFsValidationCache.get(root);
  }

  const entries = await fs.promises.readdir(root, { withFileTypes: true }).catch(() => []);
  let hasClientMarker = false;
  let hasAssetFile = false;

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    const name = entry.name.toLowerCase();
    if (name === 'eqgame.exe' || name === 'eqclient.ini') {
      hasClientMarker = true;
    }
    if (name.endsWith('.s3d') || name.endsWith('.eqg')) {
      hasAssetFile = true;
    }
    if (hasClientMarker && hasAssetFile) {
      previewSageFsValidationCache.set(root, true);
      return true;
    }
  }

  previewSageFsValidationCache.set(root, false);
  return false;
};

const validatePreviewSageFsRoot = async (rootPath) => {
  const root = await normalizePreviewSageFsRoot(rootPath);
  if (!(await isPreviewEverQuestClientDirectory(root))) {
    const error = new Error('Selected directory does not look like an EverQuest client directory');
    error.statusCode = 400;
    throw error;
  }
  return root;
};

const handlePreviewFsRequest = async (req, res, reqPath, reqUrl) => {
  const operation = reqPath.replace('/__sage-preview-fs/', '');
  const root = reqUrl.searchParams.get('root');
  const requestedPath = reqUrl.searchParams.get('path') || root || '';

  try {
    if (operation === 'readdir' && req.method === 'GET') {
      const target = resolvePreviewFsPath(root, requestedPath);
      const entries = await fs.promises
        .readdir(target, { withFileTypes: true })
        .catch((error) => {
          if (error.code === 'ENOENT') {
            return [];
          }
          throw error;
        });

      json(
        res,
        200,
        entries.map((entry) => {
          const entryPath = path.join(target, entry.name).replaceAll('\\', '/');
          return {
            name       : entry.name,
            path       : entryPath,
            isDirectory: entry.isDirectory(),
            isFile     : entry.isFile(),
          };
        })
      );
      return;
    }

    if (operation === 'read-file' && req.method === 'GET') {
      const target = resolvePreviewFsPath(root, requestedPath);
      const stat = await fs.promises.stat(target).catch((error) => {
        if (error.code === 'ENOENT') {
          return null;
        }
        throw error;
      });
      if (!stat?.isFile()) {
        res.writeHead(200, {
          'Cache-Control'         : 'no-store, no-cache, must-revalidate',
          'Connection'            : 'close',
          'Content-Length'        : 0,
          'Content-Type'          : 'application/octet-stream',
          'X-Sage-Preview-Missing': '1',
        });
        res.end();
        return;
      }

      let data = await fs.promises.readFile(target);
      const relativeTarget = path.relative(path.resolve(root), target);
      if (
        /\.glb$/i.test(target) &&
        /(^|[\\/])eqsage[\\/]zones[\\/]/i.test(relativeTarget)
      ) {
        data = await hydratePreviewGlbImages(path.resolve(root), data);
      }
      res.writeHead(200, {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Connection'   : 'close',
        'Content-Length': data.length,
        'Content-Type' : 'application/octet-stream',
      });
      res.end(data);
      return;
    }

    if (operation === 'mkdir' && req.method === 'POST') {
      const target = resolvePreviewFsPath(root, requestedPath, { cacheOnly: true });
      await fs.promises.mkdir(target, { recursive: true });
      json(res, 200, { ok: true });
      return;
    }

    if (operation === 'write-file' && req.method === 'POST') {
      const target = resolvePreviewFsPath(root, requestedPath, { cacheOnly: true });
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      await fs.promises.writeFile(target, await readRawBody(req));
      json(res, 200, { ok: true });
      return;
    }

    if (operation === 'delete-file' && req.method === 'DELETE') {
      const target = resolvePreviewFsPath(root, requestedPath, { cacheOnly: true });
      await fs.promises.unlink(target).catch((error) => {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      });
      json(res, 200, { ok: true });
      return;
    }

    if (operation === 'delete-folder' && req.method === 'DELETE') {
      const target = resolvePreviewFsPath(root, requestedPath, { cacheOnly: true });
      await fs.promises.rm(target, { recursive: true, force: true });
      json(res, 200, { ok: true });
      return;
    }

    notFound(res, reqPath);
  } catch (error) {
    json(res, error.statusCode || 500, { error: error.message || 'Preview filesystem error' });
  }
};

const handleSageFsApiRequest = async (req, res, reqPath, reqUrl) => {
  const operation = reqPath.replace('/api/v1/app/sage-fs/', '');

  try {
    if (operation === 'validate' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const root = await validatePreviewSageFsRoot(body.root);
      json(res, 200, { root: toSlash(root) });
      return;
    }

    const root = await validatePreviewSageFsRoot(reqUrl.searchParams.get('root'));
    const bridgeUrl = new URL(reqUrl.toString());
    bridgeUrl.searchParams.set('root', root);
    if (!bridgeUrl.searchParams.get('path')) {
      bridgeUrl.searchParams.set('path', root);
    }

    await handlePreviewFsRequest(
      req,
      res,
      `/__sage-preview-fs/${operation}`,
      bridgeUrl
    );
  } catch (error) {
    json(res, error.statusCode || 500, {
      error: error.message || 'Preview filesystem error',
    });
  }
};

const getPreviewZone = (shortName) => {
  const zoneData = readZoneData();
  return (
    zoneData.find((zone) => zone.short_name === shortName) ??
    zoneData.find((zone) => zone.short_name === 'tutorial') ??
    zoneData[0] ??
    {
      expansion   : 0,
      id          : 183,
      long_name   : 'The Mines of Gloomingdeep',
      short_name  : 'tutorial',
      version     : 0,
      zoneidnumber: 183,
    }
  );
};

const buildPreviewFsBootstrap = (reqUrl) => {
  const eqDir = reqUrl.searchParams.get('sagePreviewEqDir');
  if (!eqDir) {
    return '';
  }

  const zone = getPreviewZone(reqUrl.searchParams.get('sagePreviewZone') || 'tutorial');
  return `
<script>
(() => {
  const root = ${JSON.stringify(eqDir)};
  const zone = ${JSON.stringify(zone)};
  const apiUrl = (operation, filePath) =>
    '/__sage-preview-fs/' + operation +
    '?root=' + encodeURIComponent(root) +
    '&path=' + encodeURIComponent(filePath || root);

  class SagePreviewFileSystemHandle {
    async queryPermission() { return 'granted'; }
    async requestPermission() { return 'granted'; }
  }

  window.FileSystemHandle = window.FileSystemHandle || SagePreviewFileSystemHandle;
  if (!window.FileSystemHandle.prototype.queryPermission) {
    window.FileSystemHandle.prototype.queryPermission = async () => 'granted';
  }
  if (!window.FileSystemHandle.prototype.requestPermission) {
    window.FileSystemHandle.prototype.requestPermission = async () => 'granted';
  }

  window.electronFS = {
    async readDir(filePath) {
      const response = await fetch(apiUrl('readdir', filePath));
      return response.ok ? response.json() : [];
    },
    async readFile(filePath) {
      const response = await fetch(apiUrl('read-file', filePath));
      if (response.headers.get('X-Sage-Preview-Missing') === '1') {
        return null;
      }
      const buffer = response.ok ? await response.arrayBuffer() : null;
      return buffer;
    },
    async createIfNotExist(filePath) {
      // The preview bridge creates parent folders in writeFile. Directory handles
      // are also used for read-only probes, so avoid an extra request on every
      // getDirectoryHandle call.
      return true;
    },
    async writeFile(filePath, data) {
      await fetch(apiUrl('write-file', filePath), {
        method: 'POST',
        body: data instanceof ArrayBuffer || ArrayBuffer.isView(data)
          ? data
          : String(data ?? ''),
      });
    },
    async deleteFile(filePath) {
      await fetch(apiUrl('delete-file', filePath), { method: 'DELETE' });
    },
    async deleteFolder(filePath) {
      await fetch(apiUrl('delete-folder', filePath), { method: 'DELETE' });
    },
  };

  window.electronAPI = {
    async hasStandalone() { return true; },
    async selectDirectory() { return root; },
    getPath() { return root; },
    onMessage() {},
    setZoomFactor() {},
    async proxyFetch(input, init) { return fetch(input, init); },
  };

  window.__spireSagePreview = true;
  window.__spireSagePreviewZone = zone.short_name;
  localStorage.setItem('eqdir', root);
  localStorage.setItem('recent-zones', JSON.stringify([zone]));
})();
</script>`;
};

const serveIndex = (res, indexPath, bootstrap = '') => {
  if (!bootstrap) {
    serveFile(res, indexPath);
    return;
  }

  const html = fs.readFileSync(indexPath, 'utf8').replace('</head>', `${bootstrap}</head>`);
  res.writeHead(200, {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type' : 'text/html; charset=utf-8',
  });
  res.end(html);
};

const serveSpa = (res, reqUrl, distRoot, indexPath) => {
  const normalized = decodeURIComponent(reqUrl.pathname || '/');
  const requestedPath = normalized === '/' ? '/index.html' : normalized;
  const absolutePath = path.join(distRoot, requestedPath);

  if (
    isSafePath(distRoot, absolutePath) &&
    fs.existsSync(absolutePath) &&
    fs.statSync(absolutePath).isFile()
  ) {
    serveFile(res, absolutePath);
    return;
  }

  serveIndex(res, indexPath, buildPreviewFsBootstrap(reqUrl));
};

const appEnvPayload = {
  data: {
    env                              : 'local',
    features                         : { github_auth_enabled: false },
    is_hosted_read_only_mode_enabled : false,
    is_spire_initialized             : true,
    os                               : 'windows',
    release_repository               : 'Valorith/spire',
    settings                         : [],
    version                          : readPreviewVersion(),
  },
};

const userPayload = {
  id      : 1,
  is_admin: true,
  name    : 'Local Preview',
  username: 'local-preview',
};

const buildSeedState = (zoneData) => {
  const tutorialZone =
    zoneData.find((zone) => zone.short_name === 'tutorial') ?? zoneData[0] ?? {
      long_name    : 'EverQuest Tutorial',
      short_name   : 'tutorial',
      version      : 0,
      zoneidnumber : 183,
    };

  const npcTypes = [
    {
      id       : 1001,
      level    : 10,
      lastname : '',
      name     : 'Preview Guard',
      race     : 1,
      texture  : 0,
      version  : tutorialZone.version ?? 0,
    },
    {
      id       : 1002,
      level    : 14,
      lastname : '',
      name     : 'Preview Rogue',
      race     : 2,
      texture  : 0,
      version  : tutorialZone.version ?? 0,
    },
    {
      id       : 1003,
      level    : 18,
      lastname : '',
      name     : 'Preview Caster',
      race     : 3,
      texture  : 0,
      version  : tutorialZone.version ?? 0,
    },
  ];

  const spawngroups = [
    { id: 2001, name: 'preview_tutorial_group' },
  ];

  const spawnentries = [
    {
      chance                : 100,
      content_flags         : null,
      content_flags_disabled: null,
      max_expansion         : -1,
      max_time              : 0,
      min_expansion         : -1,
      min_time              : 0,
      npc_id                : 1001,
      spawngroup_id         : 2001,
    },
  ];

  const grids = [
    {
      id     : 3001,
      type   : 0,
      type_2 : 1,
      zoneid : tutorialZone.zoneidnumber,
    },
  ];

  const gridEntries = [
    {
      gridid : 3001,
      heading: 0,
      number : 1,
      pause  : 0,
      x      : 0,
      y      : 0,
      z      : 0,
      zoneid : tutorialZone.zoneidnumber,
    },
    {
      gridid : 3001,
      heading: 64,
      number : 2,
      pause  : 5,
      x      : 20,
      y      : 10,
      z      : 0,
      zoneid : tutorialZone.zoneidnumber,
    },
  ];

  const spawns = [
    {
      id            : 4001,
      pathgrid      : 3001,
      respawntime   : 1200,
      spawngroup_id : 2001,
      version       : tutorialZone.version ?? 0,
      x             : 20,
      y             : 15,
      z             : 2,
      zone          : tutorialZone.short_name,
    },
  ];

  const doors = [
    {
      id      : 5001,
      doorid  : 1,
      heading : 0,
      name    : 'door1',
      opentype: 31,
      pos_x   : 5,
      pos_y   : 10,
      pos_z   : 0,
      size    : 100,
      version : tutorialZone.version ?? 0,
      zone    : tutorialZone.short_name,
    },
  ];

  const validationSeedZoneNames = [
    'blackburrow',
    'befallen',
    'fieldofbone',
    'kaesora',
    'iceclad',
    'greatdivide',
  ];
  const validationNpcSeeds = [
    { race: 2, gender: 0, label: 'Barbarian' },
    { race: 3, gender: 1, label: 'Erudite' },
    { race: 6, gender: 0, label: 'Dark Elf' },
    { race: 8, gender: 1, label: 'Dwarf' },
    { race: 128, gender: 0, label: 'Iksar' },
    { race: 1, gender: 0, label: 'Human' },
  ];
  const validationSpawnOffsets = [
    { x: 0, y: 0, z: 0 },
    { x: 8, y: 6, z: 0 },
    { x: -8, y: 6, z: 0 },
  ];
  const previewAnchor = (zone, fallbackIndex) => {
    const fallback = {
      x: 20 + fallbackIndex * 4,
      y: 15,
      z: 2,
    };
    const anchor = {
      x: Number(zone.safe_x),
      y: Number(zone.safe_y),
      z: Number(zone.safe_z),
    };
    const validAnchor = Object.values(anchor).every(
      (value) => Number.isFinite(value) && Math.abs(value) < 900000
    );
    return validAnchor ? anchor : fallback;
  };
  const seededZoneKeys = new Set([tutorialZone.short_name]);
  validationSeedZoneNames.forEach((zoneName, index) => {
    const zone = zoneData.find((entry) => entry.short_name === zoneName);
    if (!zone || seededZoneKeys.has(zone.short_name)) {
      return;
    }
    seededZoneKeys.add(zone.short_name);

    const anchor = previewAnchor(zone, index);
    const npcIdBase = 1100 + index * validationSpawnOffsets.length;
    const spawngroupIdBase = 2100 + index * validationSpawnOffsets.length;
    const gridIdBase = 3100 + index * validationSpawnOffsets.length;
    const spawnIdBase = 4100 + index * validationSpawnOffsets.length;
    const doorId = 5100 + index;
    const zoneVersion = zone.version ?? 0;
    const zoneId = zone.zoneidnumber ?? zone.id ?? 0;

    validationSpawnOffsets.forEach((offset, offsetIndex) => {
      const seed =
        validationNpcSeeds[(index + offsetIndex) % validationNpcSeeds.length];
      const npcId = npcIdBase + offsetIndex;
      const spawngroupId = spawngroupIdBase + offsetIndex;
      const gridId = gridIdBase + offsetIndex;
      const spawnId = spawnIdBase + offsetIndex;
      const spawnX = anchor.x + offset.x;
      const spawnY = anchor.y + offset.y;
      const spawnZ = anchor.z + offset.z;

      npcTypes.push({
        gender  : seed.gender,
        id      : npcId,
        level   : 10 + index + offsetIndex,
        lastname: '',
        name    : `Sage Validation ${seed.label} ${zone.short_name}`,
        race    : seed.race,
        texture : 0,
        version : zoneVersion,
      });
      spawngroups.push({
        id  : spawngroupId,
        name: `sage_validation_${zone.short_name}_${offsetIndex + 1}`,
      });
      spawnentries.push({
        chance                : 100,
        content_flags         : null,
        content_flags_disabled: null,
        max_expansion         : -1,
        max_time              : 0,
        min_expansion         : -1,
        min_time              : 0,
        npc_id                : npcId,
        spawngroup_id         : spawngroupId,
      });
      grids.push({
        id     : gridId,
        type   : 0,
        type_2 : 1,
        zoneid : zoneId,
      });
      gridEntries.push(
        {
          gridid : gridId,
          heading: 0,
          number : 1,
          pause  : 0,
          x      : spawnX,
          y      : spawnY,
          z      : spawnZ,
          zoneid : zoneId,
        },
        {
          gridid : gridId,
          heading: 64,
          number : 2,
          pause  : 5,
          x      : spawnX + 12,
          y      : spawnY + 8,
          z      : spawnZ,
          zoneid : zoneId,
        }
      );
      spawns.push({
        id           : spawnId,
        pathgrid     : gridId,
        respawntime  : 1200,
        spawngroup_id: spawngroupId,
        version      : zoneVersion,
        x            : spawnX,
        y            : spawnY,
        z            : spawnZ,
        zone         : zone.short_name,
      });
    });
    doors.push({
      id      : doorId,
      doorid  : 1,
      heading : 45 * index,
      name    : 'DOOR1',
      opentype: 31,
      pos_x   : anchor.x + 4,
      pos_y   : anchor.y + 4,
      pos_z   : anchor.z,
      size    : 100,
      version : zoneVersion,
      zone    : zone.short_name,
    });
  });

  return {
    doors,
    gridEntries,
    grids,
    nextDoorId      : 5002,
    nextGridId      : 3002,
    nextNpcTypeId   : 1004,
    nextSpawnId     : 4002,
    nextSpawngroupId: 2002,
    npcTypes,
    spawngroups,
    spawnentries,
    spawns,
    tutorialZone,
    zoneData,
  };
};

const createPreviewState = ({ zoneData = readZoneData() } = {}) =>
  buildSeedState(clone(zoneData));

const normalizeDoor = (state, door) => {
  const normalized = {
    ...door,
    id: door.id ?? state.nextDoorId++,
  };
  if (normalized.doorid === undefined || normalized.doorid === null) {
    const zoneDoors = state.doors.filter(
      (entry) =>
        entry.zone === normalized.zone && entry.version === normalized.version
    );
    normalized.doorid =
      Math.max(0, ...zoneDoors.map((entry) => entry.doorid ?? 0)) + 1;
  }
  return normalized;
};

const normalizeSpawn = (state, spawn) => ({
  condition_value_filter: 1,
  heading               : 0,
  id                    : spawn.id ?? state.nextSpawnId++,
  max_expansion         : -1,
  min_expansion         : -1,
  pathgrid              : 0,
  respawntime           : 1200,
  version               : 0,
  x                     : 0,
  y                     : 0,
  z                     : 0,
  ...spawn,
});

const normalizeSpawngroup = (state, spawngroup) => ({
  id  : spawngroup.id ?? state.nextSpawngroupId++,
  name: spawngroup.name ?? `preview_group_${state.nextSpawngroupId}`,
  ...spawngroup,
});

const normalizeGrid = (state, grid) => ({
  id     : grid.id ?? state.nextGridId++,
  type   : 0,
  type_2 : 1,
  zoneid : state.tutorialZone.zoneidnumber,
  ...grid,
});

const normalizeGridEntry = (gridEntry) => ({
  gridid : 0,
  heading: 0,
  number : 1,
  pause  : 0,
  x      : 0,
  y      : 0,
  z      : 0,
  zoneid : 0,
  ...gridEntry,
});

const normalizeSpawnentry = (spawnentry) => ({
  chance                : 100,
  condition_value_filter: 1,
  content_flags         : null,
  content_flags_disabled: null,
  max_expansion         : -1,
  max_time              : 0,
  min_expansion         : -1,
  min_time              : 0,
  ...spawnentry,
});

const buildSpawnEntryPayload = (state, spawnentry) => ({
  ...clone(spawnentry),
  npc_type: clone(
    state.npcTypes.find((npcType) => npcType.id === spawnentry.npc_id) ?? null
  ),
});

const buildSpawnPayload = (state, spawn) => {
  const spawnentries = state.spawnentries
    .filter((entry) => entry.spawngroup_id === spawn.spawngroup_id)
    .map((entry) => buildSpawnEntryPayload(state, entry));

  return {
    ...clone(spawn),
    spawnentries,
  };
};

const findIndexById = (collection, id) =>
  collection.findIndex((entry) => Number(entry.id) === Number(id));

const findGridEntryIndex = (collection, id, searchParams) => {
  const filtered = applyQuery(collection, searchParams);
  const match = filtered.find((entry) => Number(entry.gridid) === Number(id));
  if (!match) {
    return -1;
  }
  return collection.findIndex(
    (entry) =>
      Number(entry.gridid) === Number(match.gridid) &&
      Number(entry.zoneid) === Number(match.zoneid) &&
      Number(entry.number) === Number(match.number)
  );
};

const createApiHandler = (state, databaseBridge = null) => {
  let databaseWarningShown = false;
  const tryDatabase = async (loader) => {
    if (!databaseBridge) {
      return null;
    }
    try {
      return await loader(databaseBridge);
    } catch (error) {
      if (!databaseWarningShown) {
        databaseWarningShown = true;
        console.warn(
          `[sage-preview] Falling back to in-memory preview data: ${error.message || error}`
        );
      }
      return null;
    }
  };

  return async (req, res, reqPath, reqUrl) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/app/env') {
    json(res, 200, appEnvPayload);
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/app/changelog') {
    json(res, 200, {
      data: readPreviewChangelog(),
    });
    return;
  }

  if (reqPath.startsWith('/api/v1/app/sage-fs/')) {
    await handleSageFsApiRequest(req, res, reqPath, reqUrl);
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/me') {
    json(res, 200, userPayload);
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/connections') {
    json(res, 200, { data: [] });
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/zones') {
    json(res, 200, clone(state.zoneData));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/query/free-id-ranges/grid/id') {
    json(res, 200, {
      data: [
        {
          end_id  : state.nextGridId,
          start_id: state.nextGridId,
        },
      ],
    });
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/doors') {
    const zone = getWhereValue(reqUrl.searchParams, 'zone');
    const version = getWhereNumber(reqUrl.searchParams, 'version') ?? 0;
    const databaseDoors = await tryDatabase((db) => db.loadDoors(zone, version));
    if (databaseDoors) {
      json(res, 200, clone(databaseDoors));
      return;
    }
    json(res, 200, clone(applyQuery(state.doors, reqUrl.searchParams)));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/doors/count') {
    const zone = getWhereValue(reqUrl.searchParams, 'zone');
    const version = getWhereNumber(reqUrl.searchParams, 'version') ?? 0;
    const databaseDoors = await tryDatabase((db) => db.loadDoors(zone, version));
    if (databaseDoors) {
      json(res, 200, databaseDoors.length);
      return;
    }
    json(res, 200, applyQuery(state.doors, reqUrl.searchParams).length);
    return;
  }

  if (req.method === 'PUT' && reqPath === '/api/v1/door') {
    const body = normalizeDoor(state, await readJsonBody(req));
    state.doors.push(body);
    json(res, 200, clone(body));
    return;
  }

  const doorMatch = reqPath.match(/^\/api\/v1\/door\/(\d+)$/);
  if (doorMatch) {
    const id = Number(doorMatch[1]);
    const doorIndex = findIndexById(state.doors, id);

    if (doorIndex === -1) {
      notFound(res, reqPath);
      return;
    }

    if (req.method === 'GET') {
      json(res, 200, clone(state.doors[doorIndex]));
      return;
    }

    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      state.doors[doorIndex] = {
        ...state.doors[doorIndex],
        ...body,
        id,
      };
      json(res, 200, clone(state.doors[doorIndex]));
      return;
    }

    if (req.method === 'DELETE') {
      state.doors.splice(doorIndex, 1);
      json(res, 200, 'ok');
      return;
    }
  }

  if (req.method === 'GET' && reqPath === '/api/v1/npc_types') {
    json(res, 200, clone(applyQuery(state.npcTypes, reqUrl.searchParams)));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/npc_types/count') {
    json(res, 200, applyQuery(state.npcTypes, reqUrl.searchParams).length);
    return;
  }

  const npcTypeMatch = reqPath.match(/^\/api\/v1\/npc_type\/(\d+)$/);
  if (npcTypeMatch) {
    const npcType = state.npcTypes.find(
      (entry) => Number(entry.id) === Number(npcTypeMatch[1])
    );
    if (!npcType) {
      notFound(res, reqPath);
      return;
    }
    json(res, 200, clone(npcType));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/spawngroups') {
    json(res, 200, clone(applyQuery(state.spawngroups, reqUrl.searchParams)));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/spawngroups/count') {
    json(res, 200, applyQuery(state.spawngroups, reqUrl.searchParams).length);
    return;
  }

  if (req.method === 'PUT' && reqPath === '/api/v1/spawngroup') {
    const body = normalizeSpawngroup(state, await readJsonBody(req));
    state.spawngroups.push(body);
    json(res, 200, clone(body));
    return;
  }

  const spawngroupMatch = reqPath.match(/^\/api\/v1\/spawngroup\/(\d+)$/);
  if (spawngroupMatch) {
    const id = Number(spawngroupMatch[1]);
    const spawngroupIndex = findIndexById(state.spawngroups, id);

    if (spawngroupIndex === -1) {
      notFound(res, reqPath);
      return;
    }

    if (req.method === 'GET') {
      json(res, 200, clone(state.spawngroups[spawngroupIndex]));
      return;
    }

    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      state.spawngroups[spawngroupIndex] = {
        ...state.spawngroups[spawngroupIndex],
        ...body,
        id,
      };
      json(res, 200, clone(state.spawngroups[spawngroupIndex]));
      return;
    }

    if (req.method === 'DELETE') {
      state.spawngroups.splice(spawngroupIndex, 1);
      state.spawnentries = state.spawnentries.filter(
        (entry) => Number(entry.spawngroup_id) !== id
      );
      state.spawns = state.spawns.filter(
        (spawn) => Number(spawn.spawngroup_id) !== id
      );
      json(res, 200, 'ok');
      return;
    }
  }

  if (req.method === 'GET' && reqPath === '/api/v1/spawnentries') {
    json(
      res,
      200,
      applyQuery(state.spawnentries, reqUrl.searchParams).map((entry) =>
        buildSpawnEntryPayload(state, entry)
      )
    );
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/spawnentries/count') {
    json(res, 200, applyQuery(state.spawnentries, reqUrl.searchParams).length);
    return;
  }

  if (req.method === 'PUT' && reqPath === '/api/v1/spawnentry') {
    const body = normalizeSpawnentry(await readJsonBody(req));
    state.spawnentries.push(body);
    json(res, 200, buildSpawnEntryPayload(state, body));
    return;
  }

  const spawnentryMatch = reqPath.match(/^\/api\/v1\/spawnentry\/(\d+)$/);
  if (spawnentryMatch) {
    const spawngroupId = Number(spawnentryMatch[1]);
    const filteredEntries = applyQuery(state.spawnentries, reqUrl.searchParams);
    const match = filteredEntries.find(
      (entry) => Number(entry.spawngroup_id) === spawngroupId
    );
    if (!match) {
      notFound(res, reqPath);
      return;
    }
    const entryIndex = state.spawnentries.findIndex(
      (entry) =>
        Number(entry.spawngroup_id) === Number(match.spawngroup_id) &&
        Number(entry.npc_id) === Number(match.npc_id)
    );

    if (req.method === 'GET') {
      json(res, 200, buildSpawnEntryPayload(state, state.spawnentries[entryIndex]));
      return;
    }

    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      state.spawnentries[entryIndex] = {
        ...state.spawnentries[entryIndex],
        ...body,
        spawngroup_id: spawngroupId,
      };
      json(res, 200, buildSpawnEntryPayload(state, state.spawnentries[entryIndex]));
      return;
    }

    if (req.method === 'DELETE') {
      state.spawnentries.splice(entryIndex, 1);
      json(res, 200, 'ok');
      return;
    }
  }

  if (req.method === 'GET' && reqPath === '/api/v1/spawn_2s') {
    const zone = getWhereValue(reqUrl.searchParams, 'zone');
    const version = getWhereNumber(reqUrl.searchParams, 'version') ?? 0;
    const databaseSpawns = await tryDatabase((db) => db.loadSpawns(zone, version));
    if (databaseSpawns) {
      json(res, 200, clone(databaseSpawns));
      return;
    }
    json(
      res,
      200,
      applyQuery(state.spawns, reqUrl.searchParams).map((spawn) =>
        buildSpawnPayload(state, spawn)
      )
    );
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/spawn_2s/count') {
    const zone = getWhereValue(reqUrl.searchParams, 'zone');
    const version = getWhereNumber(reqUrl.searchParams, 'version') ?? 0;
    const databaseSpawns = await tryDatabase((db) => db.loadSpawns(zone, version));
    if (databaseSpawns) {
      json(res, 200, databaseSpawns.length);
      return;
    }
    json(res, 200, applyQuery(state.spawns, reqUrl.searchParams).length);
    return;
  }

  if (req.method === 'PUT' && reqPath === '/api/v1/spawn_2') {
    const body = normalizeSpawn(state, await readJsonBody(req));
    state.spawns.push(body);
    json(res, 200, buildSpawnPayload(state, body));
    return;
  }

  const spawnMatch = reqPath.match(/^\/api\/v1\/spawn_2\/(\d+)$/);
  if (spawnMatch) {
    const id = Number(spawnMatch[1]);
    const spawnIndex = findIndexById(state.spawns, id);

    if (spawnIndex === -1) {
      notFound(res, reqPath);
      return;
    }

    if (req.method === 'GET') {
      json(res, 200, buildSpawnPayload(state, state.spawns[spawnIndex]));
      return;
    }

    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      state.spawns[spawnIndex] = {
        ...state.spawns[spawnIndex],
        ...body,
        id,
      };
      json(res, 200, buildSpawnPayload(state, state.spawns[spawnIndex]));
      return;
    }

    if (req.method === 'DELETE') {
      state.spawns.splice(spawnIndex, 1);
      json(res, 200, 'ok');
      return;
    }
  }

  if (req.method === 'GET' && reqPath === '/api/v1/grids') {
    const zoneId = getWhereNumber(reqUrl.searchParams, 'zoneid', 'zone_id');
    const databaseGrids = await tryDatabase((db) => db.loadGrids(zoneId));
    if (databaseGrids) {
      json(res, 200, clone(databaseGrids));
      return;
    }
    json(res, 200, clone(applyQuery(state.grids, reqUrl.searchParams)));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/grids/count') {
    const zoneId = getWhereNumber(reqUrl.searchParams, 'zoneid', 'zone_id');
    const databaseGrids = await tryDatabase((db) => db.loadGrids(zoneId));
    if (databaseGrids) {
      json(res, 200, databaseGrids.length);
      return;
    }
    json(res, 200, applyQuery(state.grids, reqUrl.searchParams).length);
    return;
  }

  if (req.method === 'PUT' && reqPath === '/api/v1/grid') {
    const body = normalizeGrid(state, await readJsonBody(req));
    state.grids.push(body);
    json(res, 200, clone(body));
    return;
  }

  const gridMatch = reqPath.match(/^\/api\/v1\/grid\/(\d+)$/);
  if (gridMatch) {
    const id = Number(gridMatch[1]);
    let gridIndex = findIndexById(state.grids, id);
    if (gridIndex === -1) {
      const databaseGrid = await tryDatabase((db) => db.loadGrid(id));
      if (databaseGrid) {
        state.grids.push(clone(databaseGrid));
        gridIndex = findIndexById(state.grids, id);
      }
    }

    if (gridIndex === -1) {
      notFound(res, reqPath);
      return;
    }

    if (req.method === 'GET') {
      json(res, 200, clone(state.grids[gridIndex]));
      return;
    }

    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      state.grids[gridIndex] = {
        ...state.grids[gridIndex],
        ...body,
        id,
      };
      json(res, 200, clone(state.grids[gridIndex]));
      return;
    }

    if (req.method === 'DELETE') {
      state.grids.splice(gridIndex, 1);
      state.gridEntries = state.gridEntries.filter(
        (entry) => Number(entry.gridid) !== id
      );
      json(res, 200, 'ok');
      return;
    }
  }

  if (req.method === 'GET' && reqPath === '/api/v1/grid_entries') {
    const zoneId = getWhereNumber(reqUrl.searchParams, 'zoneid', 'zone_id');
    const databaseGridEntries = await tryDatabase((db) => db.loadGridEntries(zoneId));
    if (databaseGridEntries) {
      json(res, 200, clone(databaseGridEntries));
      return;
    }
    json(res, 200, clone(applyQuery(state.gridEntries, reqUrl.searchParams)));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/grid_entries/count') {
    const zoneId = getWhereNumber(reqUrl.searchParams, 'zoneid', 'zone_id');
    const databaseGridEntries = await tryDatabase((db) => db.loadGridEntries(zoneId));
    if (databaseGridEntries) {
      json(res, 200, databaseGridEntries.length);
      return;
    }
    json(res, 200, applyQuery(state.gridEntries, reqUrl.searchParams).length);
    return;
  }

  if (req.method === 'PUT' && reqPath === '/api/v1/grid_entry') {
    const body = normalizeGridEntry(await readJsonBody(req));
    state.gridEntries.push(body);
    json(res, 200, clone(body));
    return;
  }

  const gridEntryMatch = reqPath.match(/^\/api\/v1\/grid_entry\/(\d+)$/);
  if (gridEntryMatch) {
    const id = Number(gridEntryMatch[1]);
    const gridEntryIndex = findGridEntryIndex(
      state.gridEntries,
      id,
      reqUrl.searchParams
    );

    if (gridEntryIndex === -1) {
      notFound(res, reqPath);
      return;
    }

    if (req.method === 'GET') {
      json(res, 200, clone(state.gridEntries[gridEntryIndex]));
      return;
    }

    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      state.gridEntries[gridEntryIndex] = {
        ...state.gridEntries[gridEntryIndex],
        ...body,
        gridid: id,
      };
      json(res, 200, clone(state.gridEntries[gridEntryIndex]));
      return;
    }

    if (req.method === 'DELETE') {
      state.gridEntries.splice(gridEntryIndex, 1);
      json(res, 200, 'ok');
      return;
    }
  }

  notFound(res, reqPath);
};
};

const createPreviewServer = ({
  databaseBridge = createPreviewDatabaseBridge(),
  distRoot = defaultDistRoot,
  host = '127.0.0.1',
  indexPath = defaultIndexPath,
  state = createPreviewState(),
} = {}) => {
  const apiHandler = createApiHandler(state, databaseBridge);
  const sockets = new Set();

  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    const reqPath = reqUrl.pathname;

    if (reqPath.startsWith('/__sage-preview-fs/')) {
      handlePreviewFsRequest(req, res, reqPath, reqUrl);
      return;
    }

    if (reqPath.startsWith('/api/')) {
      apiHandler(req, res, reqPath, reqUrl).catch((error) => {
        console.error('[sage-preview] API error', error);
        json(res, 500, { error: error.message || 'Preview API failure' });
      });
      return;
    }

    serveSpa(res, reqUrl, distRoot, indexPath);
  });

  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => {
      sockets.delete(socket);
    });
  });

  server.on('upgrade', (req, socket) => {
    const reqPath = new URL(req.url, `http://${req.headers.host}`).pathname;
    if (reqPath !== '/api/v1/websocket') {
      socket.destroy();
      return;
    }

    const websocketKey = req.headers['sec-websocket-key'];
    if (!websocketKey) {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(
        `${websocketKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`,
        'binary'
      )
      .digest('base64');

    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '\r\n',
      ].join('\r\n')
    );

    socket.on('error', () => {});
  });

  const close = () =>
    new Promise((resolve, reject) => {
      server.closeIdleConnections?.();
      server.closeAllConnections?.();

      for (const socket of sockets) {
        socket.destroy();
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

  return {
    close,
    host,
    server,
    state,
  };
};

if (require.main === module) {
  const requestedPort = process.argv[2] || process.env.PORT || '8104';
  const port = parseInt(requestedPort, 10);
  const host = process.env.HOST || '127.0.0.1';
  const { server } = createPreviewServer({ host });

  server.listen(port, host, () => {
    console.log(`[sage-preview] Serving ${defaultDistRoot}`);
    console.log(`[sage-preview] Preview available at http://${host}:${port}/sage`);
  });
}

module.exports = {
  createPreviewServer,
  createPreviewState,
  readZoneData,
};
