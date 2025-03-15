import './loadEnv.js.js'

import { loadRepl } from '@rvoh/dream'
import * as repl from 'node:repl'
import initializePsychicApplication from '../cli/helpers/initializePsychicApplication.js'

const replServer = repl.start('> ')
export default (async function () {
  await initializePsychicApplication()
  loadRepl(replServer.context)
})()
