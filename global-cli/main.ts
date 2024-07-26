#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import { Command } from 'commander'
import newPsychicApp from './new'
import initPsychicApp from './init'

const program = new Command()

program
  .command('new')
  .description('creates a new dream app using the name provided')
  .argument('<name>', 'name of the app you want to create')
  .option(
    '--primaryKey',
    "the type of primary key to use. valid options are: 'bigserial', 'bigint', 'integer', 'uuid' (i.e. --primaryKey uuid)"
  )
  .option(
    '--tsnode',
    'runs the command using ts-node instead of node (this should not be passed, is here to support legacy building processes)'
  )
  .action(async () => {
    const name = program.args[1]
    const indexOfTsNode = program.args.findIndex(str => str === '--tsnode')
    const args = indexOfTsNode > -1 ? program.args.slice(2, indexOfTsNode) : program.args.slice(2)
    await newPsychicApp(name, args)
  })

program
  .command('init')
  .description('initialize a new dream app into your existing application')
  .option(
    '--primaryKey',
    "the type of primary key to use. valid options are: 'bigserial', 'bigint', 'integer', 'uuid' (i.e. --primaryKey uuid)"
  )
  .option(
    '--tsnode',
    'runs the command using ts-node instead of node (this should not be passed, is here to support legacy building processes)'
  )
  .action(async () => {
    const indexOfTsNode = program.args.findIndex(str => str === '--tsnode')
    const args = indexOfTsNode > -1 ? program.args.slice(2, indexOfTsNode) : program.args.slice(2)
    await initPsychicApp(args)
  })

program.parse()
