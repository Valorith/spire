const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const defaultDistRoot = path.resolve(__dirname, '..', 'frontend', 'dist');
const defaultIndexPath = path.join(defaultDistRoot, 'index.html');
const defaultChangelogPath = path.resolve(__dirname, '..', 'CHANGELOG.md');
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

const readZoneData = (zoneDataPath = defaultZoneDataPath) =>
  fs.existsSync(zoneDataPath)
    ? JSON.parse(fs.readFileSync(zoneDataPath, 'utf8'))
    : [];

const readPreviewChangelog = (changelogPath = defaultChangelogPath) =>
  fs.existsSync(changelogPath)
    ? fs.readFileSync(changelogPath, 'utf8')
    : '## Preview Build\n\nThe local Sage preview server is running without a full backend.';

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

const serveSpa = (res, reqPath, distRoot, indexPath) => {
  const normalized = decodeURIComponent(reqPath.split('?')[0] || '/');
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

  serveFile(res, indexPath);
};

const appEnvPayload = {
  data: {
    env                              : 'local',
    features                         : { github_auth_enabled: false },
    is_hosted_read_only_mode_enabled : false,
    is_spire_initialized             : true,
    os                               : 'windows',
    release_repository               : 'EQEmuTools/spire',
    settings                         : [],
    version                          : '0.0.0',
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
      name    : 'IT63_ACTORDEF',
      opentype: 31,
      pos_x   : 5,
      pos_y   : 10,
      pos_z   : 0,
      size    : 100,
      version : tutorialZone.version ?? 0,
      zone    : tutorialZone.short_name,
    },
  ];

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

const createApiHandler = (state) => async (req, res, reqPath, reqUrl) => {
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
    json(res, 200, clone(applyQuery(state.doors, reqUrl.searchParams)));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/doors/count') {
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
    json(res, 200, clone(applyQuery(state.grids, reqUrl.searchParams)));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/grids/count') {
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
    const gridIndex = findIndexById(state.grids, id);

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
    json(res, 200, clone(applyQuery(state.gridEntries, reqUrl.searchParams)));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/grid_entries/count') {
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

const createPreviewServer = ({
  distRoot = defaultDistRoot,
  host = '127.0.0.1',
  indexPath = defaultIndexPath,
  state = createPreviewState(),
} = {}) => {
  const apiHandler = createApiHandler(state);
  const sockets = new Set();

  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    const reqPath = reqUrl.pathname;

    if (reqPath.startsWith('/api/')) {
      apiHandler(req, res, reqPath, reqUrl).catch((error) => {
        console.error('[sage-preview] API error', error);
        json(res, 500, { error: error.message || 'Preview API failure' });
      });
      return;
    }

    serveSpa(res, reqPath, distRoot, indexPath);
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
