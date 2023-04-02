import { DB } from '../sync/schema'
// import { DBOpts } from '../test-app/db/schema'

export type Tables = keyof DB
export type TableInterfaces = valueof<DB>
// export type TableOptions = valueof<DBOpts>

type valueof<T> = T[keyof T]
