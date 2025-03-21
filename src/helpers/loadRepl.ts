import './loadEnv.js'

import DreamApplication from '../dream-application/index.js'
import Encrypt from '../encrypt/index.js'
import ops from '../ops/index.js'
import CalendarDate from './CalendarDate.js'
import { DateTime } from './DateTime.js'
import pascalizePath from './pascalizePath.js'

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
