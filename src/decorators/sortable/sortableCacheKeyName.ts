import pascalize from '../../helpers/pascalize'

export default function sortableCacheKeyName(positionField: string) {
  return `_cachedPositionFor${pascalize(positionField)}`
}
