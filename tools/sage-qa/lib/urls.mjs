const normalizeEqPath = (eqDirectory) => `${eqDirectory}`.replace(/\\/g, '/');

const baseSageUrl = ({ baseUrl, route = '/sage', eqDirectory, cacheBust }) => {
  const url = new URL(route, baseUrl);
  url.searchParams.set('sageEqDir', normalizeEqPath(eqDirectory));
  url.searchParams.set('sageCacheBust', cacheBust ?? `${Date.now()}`);
  return url;
};

export const buildZoneValidationUrl = ({
  baseUrl,
  route,
  eqDirectory,
  zones,
  cycles = 1,
  cacheBust,
}) => {
  const url = baseSageUrl({ baseUrl, route, eqDirectory, cacheBust });
  url.searchParams.set('sageValidateZones', zones.join(','));
  url.searchParams.set('sageValidationCycles', `${cycles}`);
  url.searchParams.set('sageValidationPersist', '0');
  return url.toString();
};

export const buildRaceAuditUrl = ({
  baseUrl,
  route,
  eqDirectory,
  bootstrapZone,
  models,
  cacheBust,
  preview,
  forceRefresh = false,
}) => {
  const url = baseSageUrl({ baseUrl, route, eqDirectory, cacheBust });
  url.searchParams.set('sageValidateZones', bootstrapZone);
  url.searchParams.set('sageValidationPersist', '0');
  url.searchParams.set('sageRaceAudit', '1');
  url.searchParams.set('sageRaceAuditModels', models.join(','));
  url.searchParams.set('sageRaceAuditPersist', '0');
  url.searchParams.set('sageRaceAuditForceRefresh', forceRefresh ? '1' : '0');
  if (preview) {
    // The preceding structural race batch already performs the expensive
    // archive refresh. Isolated visual repeats must render that exact cached
    // artifact instead of regenerating it independently and obscuring runtime
    // repeatability with archive-processing time.
    url.searchParams.set('sageRaceAuditForceRefresh', '0');
    url.searchParams.set('sageRaceFacePreview', preview.model);
    url.searchParams.set('sageRaceFacePreviewFace', `${preview.face ?? 0}`);
    url.searchParams.set('sageRaceFacePreviewTexture', `${preview.texture ?? 0}`);
    url.searchParams.set('sageRaceFacePreviewHelmTexture', `${preview.helmTexture ?? 0}`);
    url.searchParams.set('sageRaceFacePreviewClose', '1');
    url.searchParams.set('sageRaceFacePreviewDistance', `${preview.distance ?? 8}`);
    if (Object.hasOwn(preview, 'heading')) {
      url.searchParams.set('sageRaceFacePreviewHeading', `${preview.heading}`);
    }
  }
  return url.toString();
};

const resolveModelReviewView = (sample = {}) => {
  const requested = `${sample.view ?? ''}`.trim().toLowerCase();
  if (requested === 'face' || requested === 'head') {
    return { view: 'front', faceFocus: true };
  }
  if (requested === 'rear') {
    return { view: 'back', faceFocus: sample.faceFocus === true };
  }
  if (['front', 'side', 'back'].includes(requested)) {
    return { view: requested, faceFocus: sample.faceFocus === true };
  }
  const heading = Number(sample.heading ?? 0);
  if (Math.abs(heading - 180) < 0.001) {
    return { view: 'back', faceFocus: sample.faceFocus === true };
  }
  if (Math.abs(heading - 90) < 0.001 || Math.abs(heading - 270) < 0.001) {
    return { view: 'side', faceFocus: sample.faceFocus === true };
  }
  return { view: 'front', faceFocus: sample.faceFocus === true };
};

export const buildModelReviewUrl = ({
  baseUrl,
  route,
  eqDirectory,
  sample,
  cacheBust,
}) => {
  const url = baseSageUrl({ baseUrl, route, eqDirectory, cacheBust });
  const { view, faceFocus } = resolveModelReviewView(sample);
  url.searchParams.set('sageModelReview', '1');
  url.searchParams.set('sageModel', `${sample.model ?? ''}`.trim().toLowerCase());
  url.searchParams.set('sageModelFace', `${Number(sample.face ?? 0)}`);
  url.searchParams.set('sageModelTexture', `${Number(sample.texture ?? 0)}`);
  url.searchParams.set('sageModelHelm', `${Number(sample.helmTexture ?? 0)}`);
  url.searchParams.set('sageModelView', view);
  url.searchParams.set('sageModelFaceFocus', faceFocus ? '1' : '0');
  return url.toString();
};
