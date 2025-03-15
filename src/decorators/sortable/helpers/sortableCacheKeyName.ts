import pascalize from '../../../helpers/pascalize.js.js'

export default function sortableCacheKeyName(positionField: string) {
  return `_cachedPositionFor${pascalize(positionField)}`
}
