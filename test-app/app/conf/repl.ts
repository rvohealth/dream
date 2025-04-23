import './loadEnv.js'

import * as repl from 'node:repl'
import { loadRepl } from '../../../src/index.js'
import initializeDreamApp from '../../cli/helpers/initializeDreamApp.js'

const replServer = repl.start('> ')
export default (async function () {
  await initializeDreamApp()
  await loadRepl(replServer.context)
})()
