import { DbTypes } from '../../types/db.js'

export default function castAttribute(value: any, dbType: DbTypes) {
  switch (dbType) {
    case 'json':
    case 'jsonb':
      return typeof value === 'string' ? JSON.parse(value) : value

    default:
      return value
  }
}
