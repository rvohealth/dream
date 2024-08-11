import * as repl from 'node:repl'
import { loadRepl } from '../../../src'
import './loadEnv'

const replServer = repl.start('> ')
export default (async function () {
  await loadRepl(replServer.context)
})()
