import './loadEnv'

import { DateTime } from 'luxon'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'

export default async function loadRepl(context: Record<string, unknown>) {
  const dreamApp = getCachedDreamApplicationOrFail()

  await dreamApp.inflections?.()

  context.DateTime = DateTime
  for (const globalName of Object.keys(dreamApp.models)) {
    context[globalName] = dreamApp.models[globalName]
  }

  for (const globalName of Object.keys(dreamApp.services)) {
    if (!context[globalName]) {
      context[globalName] = dreamApp.services[globalName]
    }
  }
}
