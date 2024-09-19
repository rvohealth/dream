import './loadEnv'

import { DateTime } from 'luxon'
import DreamApplication from '../dream-application'
import Encrypt from '../encrypt'
import ops from '../ops'
import CalendarDate from './CalendarDate'
import pascalizePath from './pascalizePath'

export default function loadRepl(context: Record<string, unknown>) {
  const dreamApp = DreamApplication.getOrFail()

  context.DateTime = DateTime
  context.CalendarDate = CalendarDate
  context.Encrypt = Encrypt
  context.ops = ops

  for (const globalName of Object.keys(dreamApp.models)) {
    context[pascalizePath(globalName)] = dreamApp.models[globalName]
  }

  for (const globalName of Object.keys(dreamApp.services)) {
    if (!context[globalName]) {
      context[pascalizePath(globalName)] = dreamApp.services[globalName]
    }
  }
}
