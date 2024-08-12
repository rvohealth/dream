import './loadEnv'

import { DateTime } from 'luxon'
import { getCachedDreamApplicationOrFail } from '../dream-application/cache'

export default async function loadRepl(context: Record<string, unknown>) {
  const dreamApp = getCachedDreamApplicationOrFail()

  const inflectionsPath = './src/conf/inflections'
  try {
    await import(inflectionsPath)
  } catch (_) {
    // don't fret about if no inflections file found, it's ok.
  }

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
