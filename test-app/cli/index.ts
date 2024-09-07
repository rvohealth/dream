#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import '../conf/loadEnv'

import { Command } from 'commander'
import { DreamCLI } from '../../src'
import initializeDreamApplication from './helpers/initializeDreamApplication'

const program = new Command()

DreamCLI.provide(program, {
  initializeDreamApplication,
  seedDb: async () => void
})

program.parse(process.argv)
