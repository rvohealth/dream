import { DateTime } from 'luxon'
import type { ColumnType } from 'kysely'

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>

export type Timestamp = ColumnType<DateTime>

export interface DB {
  __placeholder__: {}
}

export const DBColumns = {
  __placeholder__: [] as string[],
}
