export const PREVIEW_MODEL_ALIASES = {
  b01: 'boat',
  b02: 'boat',
  b03: 'boat',
  bon: 'lskmesh',
  box: 'box01',
  brc: 'brcdefault',
  bse: 'ghu',
  cro: 'croc',
  cwb: 'cwbclockwork',
  cwg: 'gnm',
  cat: 'pum',
  dkf: 'huf',
  dkm: 'hum',
  epf: 'huf',
  eye: 'eey',
  fgg: 'frg',
  gbn: 'gob',
  ggy: 'gar',
  glc: 'glcgiantclockwork',
  ibr: 'ibrbrute',
  iks: 'ikm',
  ivf: 'huf',
  ivm: 'hum',
  i17: 'wagon',
  iwh: 'iwhpolysurf01',
  kbd: 'kob',
  mnr: 'min',
  mcr: 'rat',
  nym: 'huf',
  obj_blimp: 'obp_mansionisland',
  obp_meldrath: 'obj_island',
  pre: 'launch',
  rtn: 'rat',
  rpf: 'frg',
  ship: 'launch',
  ske: 'lskmesh',
  skl: 'lskmesh',
  sne: 'sna',
  spw: 'wol',
  tac: 'tacnew',
  tar: 'spi',
  tin: 'tindefault',
  tpn: 'tpnbod',
  wer: 'wolmesh',
  wol: 'wolmesh',
  wom: 'wolmesh',
  wur: 'wrm',
};

export const PREVIEW_ALIAS_FIRST_MODELS = new Set([
  'brf',
  'frf',
  'shf',
  'pre',
  'ivf',
  'ivm',
]);

// Race definitions can outlive the art shipped by a particular EverQuest
// client. Keep those spawns visible with a full, semantically close asset and
// report the substitution distinctly in the audit.
export const PREVIEW_CLIENT_FALLBACKS = {
  // These female archive meshes are structurally unusable in this client:
  // BRF binds its tiny head geometry to leg bones, while FRF has an open,
  // back-face-culled head, and SHF collapses around its bind pose unless it is
  // animated by an incompatible skeleton (which deforms the whole body).
  // Prefer the complete same-race model instead of rendering a headless,
  // hollow, or collapsed NPC.
  brf: 'brm',
  cla: 'obj_sc_shella',
  dia: 'trn',
  dlk: 'drk',
  ecs: 'hum',
  fan: 'hum',
  frf: 'frm',
  hip: 'grf',
  hyd: 'mhy',
  iwb: 'iwm',
  mar: 'hum',
  msc: 'mhy',
  ont: 'box',
  ppoint: 'tpn',
  pys: 'potranqrock500',
  ron: 'hum',
  shf: 'shm',
  s01: 'tpn',
  scw: 'wol',
  srv: 'hum',
  trq: 'hum',
  uvk: 'gvk',
};

// Some legacy race codes live only inside a zone's character archive. The
// content inventory does not associate those older archives with every race,
// so previewing the NPC outside that zone needs a small source index.
export const PREVIEW_MODEL_SOURCE_FILES = {
  amp: ['poair_chr.s3d'],
  btp: ['bothunder_chr.s3d'],
  bub: ['codecay_chr.s3d', 'podisease_chr.s3d'],
  buu: ['codecay_chr.s3d', 'podisease_chr.s3d'],
  coc: ['dreadlands_chr.s3d'],
  com: ['greatdivide_chr.s3d'],
  eye: ['lavastorm_chr.s3d'],
  fen: ['pofire_chr.s3d'],
  fsg: ['greatdivide_chr.s3d'],
  goj: ['pojustice_chr.s3d'],
  hag: ['frozenshadow_chr.s3d'],
  // KOB is copied into many zone archives, but most copies contain geometry
  // without its mapped WER tracks. PoKnowledge carries the KOB skeleton plus
  // the complete nine-animation WER track set, so it must win deterministic
  // on-demand generation.
  kob: ['poknowledge_chr.s3d'],
  nmp: ['ponightmare_chr.s3d'],
  nmw: ['ponightmare_chr.s3d'],
  npt: ['ponightmare_chr.s3d'],
  mar: ['potimeb_chr.s3d', 'potimeb_chr2.s3d'],
  qzt: ['poair_chr.s3d'],
  rth: ['poearthb_chr.s3d'],
  ser: ['sseru_chr.s3d'],
  srv: ['pofire_chr.s3d', 'solrotower_chr.s3d'],
  wet: ['ponightmare_chr.s3d'],
  xeg: ['poair_chr.s3d'],
  zeb: ['potimeb_chr.s3d', 'potimeb_chr2.s3d'],
};

export const getCharacterBodyModelVariation = (modelName, texture) => {
  const normalizedModelName = `${modelName ?? ''}`.trim().toLowerCase();
  const normalizedTexture = Number(texture);
  if (!normalizedModelName || !Number.isFinite(normalizedTexture) || normalizedTexture < 10) {
    return normalizedModelName;
  }
  return `${normalizedModelName}${Number(`${Math.trunc(normalizedTexture)}`[0])
    .toString()
    .padStart(2, '0')}`;
};

export const getCharacterArchiveBaseModelName = (modelName) => {
  const normalizedModelName = `${modelName ?? ''}`.trim().toLowerCase();
  return normalizedModelName.match(
    /^([a-z0-9]{3})(?:(?:he)?\d{2})$/
  )?.[1] ?? normalizedModelName;
};

export const getCharacterSourceFamilyStem = (sourceFile) =>
  `${sourceFile ?? ''}`.trim().toLowerCase().match(
    /^(.*_chr)\d*\.s3d$/
  )?.[1] ?? null;

export const orderCharacterModelSourceFiles = (modelName, sourceFiles = []) => {
  const normalizedModelName = `${modelName ?? ''}`.trim().toLowerCase();
  const preferredSourceOrder = new Map(
    (PREVIEW_MODEL_SOURCE_FILES[normalizedModelName] ?? []).map(
      (sourceFile, index) => [`${sourceFile}`.toLowerCase(), index]
    )
  );
  const dedicatedSourcePattern = normalizedModelName
    // Classic player races store their authoritative assets in archives such
    // as globalhum_chr.s3d and globaldam_chr.s3d. Treat those exactly like a
    // race-local sdf_chr.s3d archive; otherwise generic global_chr.s3d can win
    // first and leave valid body regions backed by missing placeholder skins.
    ? new RegExp(`^(?:global)?${normalizedModelName}_chr\\d*\\.s3d$`, 'i')
    : null;
  return Array.from(new Set(sourceFiles
    .map((sourceFile) => `${sourceFile ?? ''}`.trim().toLowerCase())
    .filter(Boolean)))
    .sort((left, right) => {
      const leftDedicated = dedicatedSourcePattern?.test(left) === true;
      const rightDedicated = dedicatedSourcePattern?.test(right) === true;
      if (leftDedicated !== rightDedicated) {
        return leftDedicated ? -1 : 1;
      }
      const leftPreferred = preferredSourceOrder.get(left);
      const rightPreferred = preferredSourceOrder.get(right);
      if (leftPreferred !== undefined || rightPreferred !== undefined) {
        if (leftPreferred === undefined) return 1;
        if (rightPreferred === undefined) return -1;
        if (leftPreferred !== rightPreferred) return leftPreferred - rightPreferred;
      }
      return left.localeCompare(right, undefined, { numeric: true });
    });
};
