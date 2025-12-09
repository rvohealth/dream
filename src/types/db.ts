import { postgresDatatypes } from '../db/dataTypes.js'
import { primaryKeyTypes } from '../dream/constants.js'

export type DbConnectionType = 'primary' | 'replica'

export type AssociationTableNames<DB, Schema> = keyof DB & keyof Schema extends never
  ? unknown
  : keyof DB & keyof Schema & string
export type Tables<DB> = keyof DB
export type TableInterfaces<DB> = valueof<DB>

type valueof<T> = T[keyof T]

export type NonArrayDbTypes = (typeof postgresDatatypes)[number]
export type DbTypes = NonArrayDbTypes | `${NonArrayDbTypes}[]`
export type PrimaryKeyType = (typeof primaryKeyTypes)[number]
export type LegacyCompatiblePrimaryKeyType = PrimaryKeyType | 'uuid'
