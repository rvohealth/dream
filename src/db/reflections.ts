import { SyncedAssociations } from '../sync/associations'
import { DB } from '../sync/schema'
export { IdType } from '../sync/schema'

export type AssociationTableNames = keyof DB & keyof SyncedAssociations extends never
  ? unknown
  : keyof DB & keyof SyncedAssociations
export type Tables = keyof DB
export type TableInterfaces = valueof<DB>

type valueof<T> = T[keyof T]
