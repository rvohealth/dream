import * as luxon from 'luxon'
import { DateTime as LuxonDateTime } from '../types/luxon/datetime.js'
import { Settings as LuxonSettings } from '../types/luxon/settings.js'

export const DateTime = luxon.DateTime
export type DateTime = LuxonDateTime

export const Settings = luxon.Settings
export type Settings = LuxonSettings
