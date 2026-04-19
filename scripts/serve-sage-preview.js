const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const host = process.env.HOST || '127.0.0.1';
const requestedPort = process.argv[2] || process.env.PORT || '8104';
const port = parseInt(requestedPort, 10);
const distRoot = path.resolve(__dirname, '..', 'frontend', 'dist');
const indexPath = path.join(distRoot, 'index.html');
const zoneDataPath = path.join(
  distRoot,
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

const zoneData = fs.existsSync(zoneDataPath)
  ? JSON.parse(fs.readFileSync(zoneDataPath, 'utf8'))
  : [];

const previewDoors = [];
let nextDoorId = 1;

const appEnvPayload = {
  data: {
    env                           : 'local',
    features                      : { github_auth_enabled: false },
    is_hosted_read_only_mode_enabled: false,
    is_spire_initialized          : true,
    os                            : 'windows',
    release_repository            : 'EQEmuTools/spire',
    settings                      : [],
    version                       : '0.0.0',
  },
};

const userPayload = {
  id      : 1,
  is_admin: true,
  name    : 'Local Preview',
  username: 'local-preview',
};

const emptyArrayPaths = new Set([
  '/api/v1/grid_entries',
  '/api/v1/grids',
  '/api/v1/npc_types',
  '/api/v1/spawn2s',
  '/api/v1/spawnentries',
  '/api/v1/spawngroups',
  '/api/v1/zone_points',
]);

const json = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type'                : 'application/json; charset=utf-8',
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

const parseWhereClause = (where = '') =>
  where
    .split('.')
    .filter(Boolean)
    .map((clause) => {
      const [field, rawValue = ''] = clause.split('__');
      return {
        field,
        value: rawValue,
      };
    })
    .filter(({ field }) => !!field);

const coercePreviewValue = (value) => {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value === 'number') {
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

const filterDoors = (searchParams) => {
  const where = parseWhereClause(searchParams.get('where') || '');
  let doors = [...previewDoors];

  for (const { field, value } of where) {
    const expected = coercePreviewValue(value);
    doors = doors.filter((door) => coercePreviewValue(door[field]) === expected);
  }

  const orderBy = (searchParams.get('orderBy') || '')
    .split('.')
    .filter(Boolean);
  if (orderBy.length > 0) {
    doors.sort((left, right) => {
      for (const field of orderBy) {
        const a = coercePreviewValue(left[field]);
        const b = coercePreviewValue(right[field]);
        if (a === b) {
          continue;
        }
        return a > b ? 1 : -1;
      }
      return 0;
    });
  }

  return doors;
};

const normalizeDoor = (door) => {
  const normalized = {
    ...door,
    id: door.id ?? nextDoorId++,
  };
  if (normalized.doorid === undefined || normalized.doorid === null) {
    const zoneDoors = previewDoors.filter(
      (entry) =>
        entry.zone === normalized.zone && entry.version === normalized.version
    );
    normalized.doorid =
      Math.max(0, ...zoneDoors.map((entry) => entry.doorid ?? 0)) + 1;
  }
  return normalized;
};

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
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Failed to read file');
  });

  res.writeHead(200, { 'Content-Type': contentType });
  stream.pipe(res);
};

const isSafePath = (absolutePath) => {
  const relative = path.relative(distRoot, absolutePath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const serveSpa = (res, reqPath) => {
  const normalized = decodeURIComponent(reqPath.split('?')[0] || '/');
  const requestedPath = normalized === '/' ? '/index.html' : normalized;
  const absolutePath = path.join(distRoot, requestedPath);

  if (isSafePath(absolutePath) && fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    serveFile(res, absolutePath);
    return;
  }

  serveFile(res, indexPath);
};

const apiHandler = async (req, res, reqPath, reqUrl) => {
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

  if (req.method === 'GET' && reqPath === '/api/v1/me') {
    json(res, 200, userPayload);
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/connections') {
    json(res, 200, { data: [] });
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/zones') {
    json(res, 200, zoneData);
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/doors') {
    json(res, 200, filterDoors(reqUrl.searchParams));
    return;
  }

  if (req.method === 'GET' && reqPath === '/api/v1/doors/count') {
    json(res, 200, filterDoors(reqUrl.searchParams).length);
    return;
  }

  if (req.method === 'PUT' && reqPath === '/api/v1/door') {
    try {
      const body = normalizeDoor(await readJsonBody(req));
      previewDoors.push(body);
      json(res, 200, [body]);
    } catch (error) {
      json(res, 400, { error: `Invalid JSON body: ${error.message}` });
    }
    return;
  }

  const doorMatch = reqPath.match(/^\/api\/v1\/door\/(\d+)$/);
  if (doorMatch) {
    const id = Number(doorMatch[1]);
    const doorIndex = previewDoors.findIndex((door) => door.id === id);

    if (req.method === 'PATCH') {
      if (doorIndex === -1) {
        notFound(res, reqPath);
        return;
      }
      try {
        const body = await readJsonBody(req);
        previewDoors[doorIndex] = {
          ...previewDoors[doorIndex],
          ...body,
          id,
        };
        json(res, 200, [previewDoors[doorIndex]]);
      } catch (error) {
        json(res, 400, { error: `Invalid JSON body: ${error.message}` });
      }
      return;
    }

    if (req.method === 'DELETE') {
      if (doorIndex === -1) {
        notFound(res, reqPath);
        return;
      }
      previewDoors.splice(doorIndex, 1);
      json(res, 200, 'ok');
      return;
    }
  }

  if (req.method === 'GET' && emptyArrayPaths.has(reqPath)) {
    json(res, 200, []);
    return;
  }

  if (req.method === 'GET' && reqPath.endsWith('/count')) {
    json(res, 200, 0);
    return;
  }

  notFound(res, reqPath);
};

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

  serveSpa(res, reqPath);
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
    .update(`${websocketKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`, 'binary')
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

server.listen(port, host, () => {
  console.log(`[sage-preview] Serving ${distRoot}`);
  console.log(`[sage-preview] Preview available at http://${host}:${port}/sage`);
});
