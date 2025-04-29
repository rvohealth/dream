import { DbTypes } from '../../types/db.js'
import areEqual, { jsonAreEqual } from '../areEqual.js'

export default function columnValuesAreEqual(a: any, b: any, dreamColumnType: DbTypes): boolean {
  switch (dreamColumnType) {
    case 'json':
    case 'jsonb':
      return jsonAreEqual(a, b)

    default:
      return areEqual(a, b)
  }
}
