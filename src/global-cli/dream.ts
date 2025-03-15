#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import { Command } from 'commander'
import {
  cliDefaultConfigPath,
  cliDefaultDbPath,
  cliDefaultFactoriesPath,
  cliDefaultModelsPath,
  cliDefaultModelSpecsPath,
  cliDefaultProjectPath,
  cliDefaultSerializersPath,
  cliDefaultServicesPath,
  cliDefaultTypesPath,
  cliPrimaryKeyTypes,
  InitDreamAppCliOptions,
} from './helpers/primaryKeyTypes.js'
import initDreamApp from './init.js.js'
import newDreamApp from './new.js.js'

const program = new Command()

program
  .command('new')
  .description('creates a new dream app using the name provided')
  .argument('<name>', 'name of the app you want to create')

  .option(
    '--primary-key-type <KEY_TYPE>',
    `One of: ${cliPrimaryKeyTypes.join(', ')}. The type of primary key to use by default when generating Dream models (can be changed on a model-by-model basis as needed in each migration file)`
  )

  .option('--project-path <PATH>', 'the root of the project', cliDefaultProjectPath)
  .option(
    '--config-path <PATH>',
    'the path from your project root to the config directory',
    cliDefaultConfigPath
  )
  .option('--db-path <PATH>', 'the path from your project root to the db directory', cliDefaultDbPath)
  .option(
    '--types-path <PATH>',
    'the path from your project root to the types directory',
    cliDefaultTypesPath
  )
  .option(
    '--models-path <PATH>',
    'the path from your project root to the models directory',
    cliDefaultModelsPath
  )
  .option(
    '--serializers-path <PATH>',
    'the path from your project root to the serializers directory',
    cliDefaultSerializersPath
  )
  .option(
    '--services-path <PATH>',
    'the path from your project root to the services directory',
    cliDefaultServicesPath
  )
  .option(
    '--model-specs-path <PATH>',
    'the path from your project root to the model specs directory',
    cliDefaultModelSpecsPath
  )
  .option(
    '--factories-path <PATH>',
    'the path from your project root to the spec factories directory',
    cliDefaultFactoriesPath
  )

  .action(async (name: string, options: InitDreamAppCliOptions) => {
    await newDreamApp(name, options)
  })

program
  .command('init')
  .description('initialize a new dream app into your existing application')

  .option(
    '--primary-key-type <KEY_TYPE>',
    `One of: ${cliPrimaryKeyTypes.join(', ')}. The type of primary key to use by default when generating Dream models (can be changed on a model-by-model basis as needed in each migration file)`
  )

  .option('--project-path <PATH>', 'the root of the project')
  .option('--config-path <PATH>', 'the path from your project root to the config directory')
  .option('--db-path <PATH>', 'the path from your project root to the db directory')
  .option('--types-path <PATH>', 'the path from your project root to the types directory')
  .option('--models-path <PATH>', 'the path from your project root to the models directory')
  .option('--serializers-path <PATH>', 'the path from your project root to the serializers directory')
  .option('--services-path <PATH>', 'the path from your project root to the services directory')
  .option('--model-specs-path <PATH>', 'the path from your project root to the model specs directory')
  .option('--factories-path <PATH>', 'the path from your project root to the spec factories directory')

  .action(async (options: InitDreamAppCliOptions) => {
    await initDreamApp(options)
  })

program.parse()
