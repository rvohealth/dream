#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import { Command } from 'commander'
import generateDream from './cli/helpers/generateDream'
import generateMigration from './cli/helpers/generateMigration'
import sspawn from '../src/helpers/sspawn'
import setCoreDevelopmentFlag from './cli/helpers/setCoreDevelopmentFlag'

const program = new Command()

program
  .command('generate')
  .alias('g')
  .alias('generate:dream')
  .alias('generate:model')
  .alias('g:model')
  .alias('g:dream')
  .description('generate <name> [...attributes] create a new dream')
  .argument('<name>', 'name of the dream')
  .action(async () => {
    const [_, name, ...attributes] = program.args
    await generateDream(name, attributes)
  })

program
  .command('generate:migration')
  .alias('g:migration')
  .description('g:migration <name> create a new dream migration')
  .argument('<name>', 'name of the migration')
  .action(async () => {
    const [_, name] = program.args
    await generateMigration(name)
  })

program
  .command('db:migrate')
  .description('db:migrate runs any outstanding database migrations')
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(
      `${coreDevFlag}npx ts-node src/bin/migrate.ts && ${
        process.env.CORE_DEVELOPMENT === '1' ? 'yarn dream build:types --core' : 'yarn dream build:types'
      }`
    )
  })

program
  .command('build:types')
  .alias('build:all')
  .description('runs yarn dream build:schema, then yarn dream build:associations')
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`yarn dream build:schema ${!!coreDevFlag ? '--core' : ''}`)
    await sspawn(`yarn dream build:associations ${!!coreDevFlag ? '--core' : ''}`)
    await sspawn(`${coreDevFlag}yarn build`)
  })

program
  .command('build:schema')
  .alias('sync')
  .alias('introspect')
  .description(
    'sync introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}npx ts-node boot/sync.ts`)
  })

program
  .command('build:associations')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}npx ts-node src/bin/build-associations.ts`)
  })

program
  .command('db:create')
  .description(
    'creates a new database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}npx ts-node src/bin/db-create.ts`)
  })

program
  .command('db:drop')
  .description(
    'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}npx ts-node src/bin/db-drop.ts`)
  })

program
  .command('copy:boilerplate')
  .description(
    'copies a boilerplate template for schema.ts and dream.ts, which are both provided to the dream framework'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    setCoreDevelopmentFlag(program.args)
    if (process.env.CORE_DEVELOPMENT === '1') {
      await sspawn(`npx ts-node boot/copy-boilerplate.ts`)
    } else {
      throw 'this command is not meant for use outside core development'
    }
  })

program
  .command('spec')
  .description(
    'copies a boilerplate template for schema.ts and dream.ts, which are both provided to the dream framework'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    setCoreDevelopmentFlag(program.args)
    const files = program.args.filter(arg => /\.spec\.ts$/.test(arg))
    if (process.env.CORE_DEVELOPMENT === '1') {
      await sspawn(`yarn dream build:all --core`)
      await sspawn(`CORE_DEVELOPMENT=1 jest --runInBand --forceExit ${files.join(' ')}`)
    } else {
      throw 'this command is not meant for use outside core development'
    }
  })

program
  .command('console')
  .description('initiates a repl, loading the models from the development test-app into scope for easy use')
  .option('--core', 'sets core to true')
  .action(async () => {
    setCoreDevelopmentFlag(program.args)
    if (process.env.CORE_DEVELOPMENT === '1') {
      await sspawn(
        `yarn dream build:types --core && CORE_DEVELOPMENT=1 NODE_ENV=development npx ts-node --project ./tsconfig.json ./test-app/conf/repl.ts`
      )
    } else {
      throw 'this command is not meant for use outside core development'
    }
  })

program.parse()
