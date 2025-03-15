#!/usr/bin/env node

// this will reveal any uncaught promises, since
// they can be very difficult to track down
process.on('unhandledRejection', reason => {
  console.error('Unhandled Promise Rejection:', reason)
  throw new Error(reason as string)
})

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import '../app/conf/loadEnv.js.js'

import { Command } from 'commander'
import { DreamBin, DreamCLI } from '../../src/index.js.js'
import initializeDreamApplication from './helpers/initializeDreamApplication.js.js'

const program = new Command()

program
  .command('build:docs')
  .description('builds docs for the dream repository')
  .action(async () => {
    await DreamBin['buildDocs']()
    process.exit()
  })

DreamCLI.provide(program, {
  initializeDreamApplication,
  seedDb: async () => {},
})

program.parse(process.argv)
