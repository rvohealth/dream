import DreamApp from '../dream-app/index.js'
import { isString } from './typechecks.js'

export default function normalizeString(val: string) {
  const normalizationForm = DreamApp.getOrFail().unicodeNormalization
  if (normalizationForm === 'none') return val
  return isString(val) ? val.normalize(normalizationForm) : val
}
