import { DateTime } from 'luxon'
import CalendarDate from './CalendarDate'

export const parseDate = (dateString: string | null | undefined) => {
  return dateString ? CalendarDate.fromSQL(dateString) : dateString
}

export const parseDatetime = (datetimeString: string | null | undefined) => {
  return datetimeString ? DateTime.fromSQL(datetimeString, { zone: 'UTC' }) : datetimeString
}

export const parseDecimal = (numberString: string | null | undefined) => {
  return numberString ? parseFloat(numberString) : numberString
}
