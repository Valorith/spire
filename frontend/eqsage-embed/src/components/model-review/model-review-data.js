import raceData from '../../viewer/common/raceData.json';
import raceModelMetadata from '../../viewer/common/raceModelMetadata.json';

export const MODEL_REVIEW_GENDERS = [
  ['0', 'male'],
  ['1', 'female'],
  ['2', 'neutral'],
];

export const buildModelReviewInventory = () => {
  const variantsByModel = new Map();

  for (const race of raceData) {
    for (const [genderKey, gender] of MODEL_REVIEW_GENDERS) {
      const model = `${race[genderKey] ?? ''}`.trim().toLowerCase();
      if (!model) {
        continue;
      }
      const variants = variantsByModel.get(model) ?? [];
      variants.push({
        raceId: Number(race.id),
        raceName: race.name,
        gender,
        genderIndex: Math.max(
          0,
          MODEL_REVIEW_GENDERS.findIndex(([, name]) => name === gender)
        ),
      });
      variantsByModel.set(model, variants);
    }
  }

  return Array.from(variantsByModel.entries())
    .map(([model, variants]) => ({
      model,
      variants,
      sourceFiles: raceModelMetadata[model]?.sourceFiles ?? [],
      appearance: raceModelMetadata[model] ?? {},
    }))
    .sort((left, right) => left.model.localeCompare(right.model));
};
