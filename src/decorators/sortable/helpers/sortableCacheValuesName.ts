import pascalize from '../../../helpers/pascalize.js.js'

export default function sortableCacheValuesName(positionField: string) {
  return `_cachedPositionValuesFor${pascalize(positionField)}`
}
