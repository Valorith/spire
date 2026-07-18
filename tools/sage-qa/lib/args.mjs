const toCamelCase = (value) => value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

const ALIASES = {
  b: 'baseUrl',
  e: 'eqDir',
  h: 'help',
  o: 'outputRoot',
  p: 'profile',
};

export const parseArgs = (argv = []) => {
  const args = { positional: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--') {
      args.positional.push(...argv.slice(index + 1));
      break;
    }
    if (!token.startsWith('-') || token === '-') {
      args.positional.push(token);
      continue;
    }

    if (token.startsWith('--no-')) {
      args[toCamelCase(token.slice(5))] = false;
      continue;
    }

    const normalized = token.startsWith('--') ? token.slice(2) : token.slice(1);
    const equalsIndex = normalized.indexOf('=');
    const rawKey = equalsIndex >= 0 ? normalized.slice(0, equalsIndex) : normalized;
    const key = ALIASES[rawKey] ?? toCamelCase(rawKey);
    if (equalsIndex >= 0) {
      args[key] = normalized.slice(equalsIndex + 1);
      continue;
    }

    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('-')) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
};

export const asBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  if (/^(1|true|yes|on)$/i.test(`${value}`)) return true;
  if (/^(0|false|no|off)$/i.test(`${value}`)) return false;
  return fallback;
};

export const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
