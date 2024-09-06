import './loadEnv'

import * as repl from 'node:repl'
import { loadRepl } from '../../../src'
import initializeDreamApplication from '../../cli/helpers/initializeDreamApplication'

const replServer = repl.start('> ')
export default (async function () {
  await initializeDreamApplication()
  loadRepl(replServer.context)
})()
