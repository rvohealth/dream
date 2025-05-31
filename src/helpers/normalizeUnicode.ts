import DreamApp from '../dream-app/index.js'

/**
 * Normalizes a Unicode string according to the application's configured normalization form.
 *
 * Unicode normalization ensures text consistency by converting characters to a canonical
 * representation. This is crucial for text comparison, searching, and data integrity,
 * as the same visual text can be represented differently in Unicode (e.g., é as a single
 * character vs. e + combining accent).
 *
 * The normalization form is configured via `psy.set('unicodeNormalization', form)`
 * in app/conf.ts. The default form is 'NFC'. All strings and string arrays passed
 * into Dream models are automatically normalized before database storage (values
 * in JSON/JSONB fields are not automatically normalized). String values in queries
 * (e.g., `where`, `and`) are automatically normalized to ensure search consistency.
 *
 * @param val - The string to normalize
 * @returns The normalized string, or the original string if normalization is disabled ('none')
 *
 * @see {@link https://unicode.org/reports/tr15/ | Unicode Normalization Forms (UAX #15)}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize | String.prototype.normalize()}
 *
 * @example
 * ```typescript
 * // With NFC normalization (default)
 * normalizeUnicode('café') // Returns normalized form of café
 *
 * // With normalization disabled
 * psy.set('unicodeNormalization', 'none')
 * normalizeUnicode('café') // Returns original string unchanged
 * ```
 */
export default function normalizeUnicode(val: string) {
  const normalizationForm = DreamApp.getOrFail().unicodeNormalization
  if (normalizationForm === 'none') return val
  return typeof val === 'string' ? val.normalize(normalizationForm) : val
}
