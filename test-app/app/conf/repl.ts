import './loadEnv.js'

import * as repl from 'node:repl'
import { loadRepl } from '../../../src/index.js'
import initializeDreamApplication from '../../cli/helpers/initializeDreamApplication.js'

const replServer = repl.start('> ')
export default (async function () {
  await initializeDreamApplication()
  loadRepl(replServer.context)
})()
