export type AssociationTableNames<DB, SyncedAssociations> = keyof DB & keyof SyncedAssociations extends never
  ? unknown
  : keyof DB & keyof SyncedAssociations & string
export type Tables<DB> = keyof DB
export type TableInterfaces<DB> = valueof<DB>

type valueof<T> = T[keyof T]
