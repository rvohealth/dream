import { DateTime } from 'luxon'
import Dream from '../dream'
import CalendarDate from './CalendarDate'
import isDateColumn from './db/types/isDateColumn'
import isDateTimeColumn from './db/types/isDateTimeColumn'
import isDecimalColumn from './db/types/isDecimalColumn'

export function standardizeParamInputToDreamModel<
  T extends typeof Dream,
  DB extends InstanceType<T>['DB'],
  TableName extends keyof DB = InstanceType<T>['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
>(dreamClass: T, column: keyof Table, value: any) {
  // NOTE: conversion here is solely for standardizing
  // attributes received during `new` (so that types for unpersisted Dream models
  // are the same as if they had been persisted). Data coming out of the database
  // are standardized by `setTypeParser` in src/dream-application/index.ts
  if (value === null || value === undefined) return value

  if (isDecimalColumn(dreamClass, column)) {
    return parseFloat(value as string)
    //
  } else if (isDateTimeColumn(dreamClass, column)) {
    if (value instanceof Date) {
      return DateTime.fromJSDate(value, { zone: 'UTC' })
    } else if (value instanceof DateTime) {
      return value.setZone('UTC')
    } else if (typeof value === 'string') {
      return DateTime.fromISO(value, { zone: 'UTC' })
    }
    //
  } else if (isDateColumn(dreamClass, column)) {
    if (value instanceof Date) {
      return CalendarDate.fromDateTime(DateTime.fromJSDate(value))
    } else if (value instanceof DateTime) {
      return CalendarDate.fromDateTime(value)
    } else if (typeof value === 'string') {
      return CalendarDate.fromISO(value)
    }
  }

  return value
}
