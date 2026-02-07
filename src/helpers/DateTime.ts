import * as luxon from 'luxon'
import { DateTime as LuxonDateTime } from 'luxon'

export const DateTime = luxon.DateTime
export type DateTime = LuxonDateTime

export const Settings = luxon.Settings
Settings.throwOnInvalid = true
