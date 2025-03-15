import pascalize from '../../../helpers/pascalize.js'

export default function sortableCacheValuesName(positionField: string) {
  return `_cachedPositionValuesFor${pascalize(positionField)}`
}
