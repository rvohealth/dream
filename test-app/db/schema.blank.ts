import CalendarDate from '../../src/helpers/CalendarDate'
import { DateTime } from 'luxon'
import type { ColumnType } from 'kysely'

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>

export type Int8 = ColumnType<string, string | number | bigint, string | number | bigint>

export type Timestamp = ColumnType<DateTime | CalendarDate>

export interface DB {
  __placeholder__: object
}

export const schema = {} as const
