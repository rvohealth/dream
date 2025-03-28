import DreamApplication from '../dream-application/index.js'
import Encrypt from '../encrypt/index.js'
import ops from '../ops/index.js'
import CalendarDate from './CalendarDate.js'
import camelize from './camelize.js'
import capitalize from './capitalize.js'
import compact from './compact.js'
import { DateTime } from './DateTime.js'
import hyphenize from './hyphenize.js'
import pascalize from './pascalize.js'
import pascalizePath from './pascalizePath.js'
import range from './range.js'
import round from './round.js'
import snakeify from './snakeify.js'
import sort from './sort.js'
import sortBy from './sortBy.js'
import uncapitalize from './uncapitalize.js'
import uniq from './uniq.js'

export default function loadRepl(context: Record<string, unknown>) {
  const dreamApp = DreamApplication.getOrFail()

  context.CalendarDate = CalendarDate
  context.DateTime = DateTime
  context.Encrypt = Encrypt
  context.camelize = camelize
  context.capitalize = capitalize
  context.compact = compact
  context.hyphenize = hyphenize
  context.ops = ops
  context.pascalize = pascalize
  context.pascalizePath = pascalizePath
  context.range = range
  context.round = round
  context.snakeify = snakeify
  context.sort = sort
  context.sortBy = sortBy
  context.uncapitalize = uncapitalize
  context.uniq = uniq

  for (const globalName of Object.keys(dreamApp.models)) {
    context[pascalizePath(globalName)] = dreamApp.models[globalName]
  }

  for (const globalName of Object.keys(dreamApp.services)) {
    if (!context[globalName]) {
      context[pascalizePath(globalName)] = dreamApp.services[globalName]
    }
  }
}
