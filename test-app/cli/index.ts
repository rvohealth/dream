#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import '../app/conf/loadEnv'

import { Command } from 'commander'
import { DreamBin, DreamCLI } from '../../src'
import initializeDreamApplication from './helpers/initializeDreamApplication'

const program = new Command()

program
  .command('build:docs')
  .description('builds docs for the dream repository')
  .action(async () => {
    await initializeDreamApplication()
    await DreamBin['buildDocs']()
    process.exit()
  })

DreamCLI.provide(program, {
  initializeDreamApplication,
  seedDb: async () => {},
})

program.parse(process.argv)
