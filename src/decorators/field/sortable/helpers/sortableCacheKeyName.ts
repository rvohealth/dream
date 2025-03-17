import pascalize from '../../../../helpers/pascalize.js'

export default function sortableCacheKeyName(positionField: string) {
  return `_cachedPositionFor${pascalize(positionField)}`
}
