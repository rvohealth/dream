import { DB } from '../sync/schema'

export type Tables = keyof DB
export type TableInterfaces = valueof<DB>

type valueof<T> = T[keyof T]
