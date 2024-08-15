import { loadRepl } from '../../../src'
import './loadEnv'
import * as repl from 'node:repl'

const replServer = repl.start('> ')
export default (async function () {
  await loadRepl(replServer.context)
})()
