import pascalize from '../../helpers/pascalize'

export default function sortableCacheValuesName(positionField: string) {
  return `_cachedPositionValuesFor${pascalize(positionField)}`
}
