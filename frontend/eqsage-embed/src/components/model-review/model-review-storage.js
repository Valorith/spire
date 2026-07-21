export const FIXED_MODEL_REVIEW_RESET_ID = '2026-07-19-model-rendering-fixes-v1';

export const FIXED_MODEL_REVIEW_CODES = Object.freeze([
  'abh', 'akf', 'ala', 'alg', 'alr', 'arm', 'b01', 'b02', 'b03', 'bac', 'bar',
  'ber', 'bff', 'bfr', 'bgf', 'bgg', 'boat', 'brc', 'bri',
  'ahf', 'ahm', 'aie', 'amy', 'ans', 'apx', 'aro', 'asm', 'avk', 'axa', 'bal',
  'bas', 'bat', 'bdr', 'bel', 'bfc', 'blv', 'bnf', 'bnm', 'bnr', 'bny', 'bre',
  'all', 'avi', 'bea', 'bgm', 'brf',
  'b05', 'b09',
]);

const fixedModelReviewCodes = new Set(FIXED_MODEL_REVIEW_CODES);

export const removeFixedModelReviews = (reviews) => {
  if (!reviews || typeof reviews !== 'object' || Array.isArray(reviews)) return {};
  return Object.fromEntries(
    Object.entries(reviews).filter(
      ([model]) => !fixedModelReviewCodes.has(`${model}`.toLowerCase())
    )
  );
};
