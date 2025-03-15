import './loadEnv.js'

import { DateTime } from 'luxon'
import DreamApplication from '../dream-application/index.js.js'
import Encrypt from '../encrypt/index.js.js'
import ops from '../ops/index.js.js'
import CalendarDate from './CalendarDate.js.js'
import pascalizePath from './pascalizePath.js.js'

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
