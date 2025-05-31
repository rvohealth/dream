import DreamApp from '../dream-app/index.js'

export default function normalizeString(val: string) {
  const normalizationForm = DreamApp.getOrFail().unicodeNormalization
  if (normalizationForm === 'none') return val
  return typeof val === 'string' ? val.normalize(normalizationForm) : val
}
