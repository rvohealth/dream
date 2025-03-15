#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import '../conf/loadEnv'

import { DreamCLI } from '@rvoh/dream'
import { Command } from 'commander'
import seedDb from '../db/seed.js'
import initializeDreamApplication from './helpers/initializeDreamApplication.js'

const program = new Command()

DreamCLI.provide(program, {
  initializeDreamApplication,
  seedDb,
})

program.parse(process.argv)
