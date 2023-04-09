#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import { Command } from 'commander'
import generateDream from './cli/helpers/generateDream'
import generateMigration from './cli/helpers/generateMigration'

const program = new Command()

program
  .command('generate:dream')
  .alias('generate:model')
  .alias('g:model')
  .alias('g:dream')
  .description('g:dream <name> [...attributes] create a new dream')
  .argument('<name>', 'name of the dream')
  .action(async () => {
    const [_, name, ...attributes] = program.args
    await generateDream(name, attributes)
  })

program
  .command('generate:migration')
  .alias('g:migration')
  .description('g:migration <name> create a new howl migration')
  .argument('<name>', 'name of the migration')
  .action(async () => {
    const [_, name] = program.args
    await generateMigration(name)
  })

program.parse()
