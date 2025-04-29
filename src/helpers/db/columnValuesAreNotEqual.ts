import { DbTypes } from '../../types/db.js'
import columnValuesAreEqual from './columnValuesAreEqual.js'

export default function columnValuesAreNotEqual(a: any, b: any, dreamColumnType: DbTypes): boolean {
  return !columnValuesAreEqual(a, b, dreamColumnType)
}
