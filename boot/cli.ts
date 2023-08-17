#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import './cli/helpers/loadEnv'
import { Command } from 'commander'
import sspawn from './cli/helpers/sspawn'
import setCoreDevelopmentFlag from './cli/helpers/setCoreDevelopmentFlag'
import yarncmdRunByAppConsumer from './cli/helpers/yarncmdRunByAppConsumer'
import maybeSyncExisting from './cli/helpers/maybeSyncExisting'
import developmentOrTestEnv from './cli/helpers/developmentOrTestEnv'

const program = new Command()

program
  .command('generate:migration')
  .alias('g:migration')
  .description('g:migration <name> create a new dream migration')
  .argument('<name>', 'name of the migration')
  .option('--core', 'sets core to true')
  .action(async () => {
    await maybeSyncExisting(program.args)
    const [_, name] = program.args
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}node dist/src/bin/generate-migration.js ${name}`)
  })

program
  .command('generate')
  .alias('g')
  .alias('generate:dream')
  .alias('generate:model')
  .alias('g:model')
  .alias('g:dream')
  .description('generate <name> [...attributes] create a new dream')
  .argument('<name>', 'name of the dream')
  .option('--core', 'sets core to true')
  .action(async () => {
    await maybeSyncExisting(program.args)
    setCoreDevelopmentFlag(program.args)
    const [_, name, ...attributes] = program.args
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(
      `${coreDevFlag}node dist/src/bin/generate-dream.js ${name} ${attributes
        .filter(attr => !['--core'].includes(attr))
        .join(' ')}`
    )
  })

program
  .command('generate:serializer')
  .alias('g:serializer')
  .description('generate:serializer <name> [...attributes] create a new serializer')
  .argument('<name>', 'name of the serializer')
  .option('--core', 'sets core to true')
  .action(async () => {
    const [_, name, ...attributes] = program.args

    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(
      `${coreDevFlag}node dist/src/bin/generate-serializer.js ${name} ${attributes
        .filter(attr => !['--core'].includes(attr))
        .join(' ')}`
    )
  })

program
  .command('sync:types')
  .alias('sync:all')
  .description('runs yarn dream sync:schema, then yarn dream sync:associations')
  .option('--core', 'sets core to true')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await maybeSyncExisting(program.args)
    await sspawn(yarncmdRunByAppConsumer('dream sync:schema', program.args))
    await sspawn(yarncmdRunByAppConsumer('dream sync:associations --bypass-config-cache', program.args))
  })

program
  .command('sync:schema')
  .alias('introspect')
  .description(
    'sync introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    await maybeSyncExisting(program.args)
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}node dist/src/bin/sync.js`)
  })

program
  .command('sync:config-cache')
  .description(
    'builds the preliminary type cache necessary for dream to operate. Must be run prior to anything else'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}node dist/boot/build-config-cache.js`)
  })

program
  .command('sync:associations')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .option('--core', 'sets core to true')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await maybeSyncExisting(program.args)
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}node dist/src/bin/build-associations.js`)
  })

program
  .command('sync:existing')
  .description(
    'syncs the current schema, associations, and db configuration (rather than generating a new one).'
  )
  .option('--core', 'sets core to true')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    if (!developmentOrTestEnv()) return
    setCoreDevelopmentFlag(program.args)
    await sspawn('node dist/boot/sync-existing-or-create-boilerplate.js')

    if (!program.args.includes('--bypass-config-cache')) {
      await sspawn(yarncmdRunByAppConsumer('dream sync:config-cache', program.args))
    }
  })

program
  .command('db:create')
  .description(
    'creates a new database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .option('--core', 'sets core to true')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await maybeSyncExisting(program.args)
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}node dist/src/bin/db-create.js`)
  })

program
  .command('db:migrate')
  .description('db:migrate runs any outstanding database migrations')
  .option('--core', 'sets core to true')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await maybeSyncExisting(program.args)
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}node dist/src/bin/db-migrate.js`)

    if (developmentOrTestEnv()) {
      await sspawn(yarncmdRunByAppConsumer('dream sync:types --bypass-config-cache', program.args))
    }
  })

program
  .command('db:rollback')
  .description('db:rollback rolls back the migration')
  .option('--step <integer>', '--step <integer> number of steps back to travel')
  .option('--core', 'sets core to true')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await maybeSyncExisting(program.args)
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    const stepArg = program.args.find(arg => /--step=\d+/.test(arg))
    const step = stepArg ? parseInt(stepArg!.replace('--step=', '')) : 1
    await sspawn(`${coreDevFlag}node dist/src/bin/db-rollback.js ${step}`)
    await sspawn(yarncmdRunByAppConsumer('dream sync:types --bypass-config-cache', program.args))
  })

program
  .command('db:drop')
  .description(
    'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .option('--core', 'sets core to true')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await maybeSyncExisting(program.args)

    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}node dist/src/bin/db-drop.js`)
  })

program
  .command('db:reset')
  .description('db:reset runs db:drop (safely), then db:create, then db:migrate')
  .option('--core', 'sets core to true')
  .action(async () => {
    await maybeSyncExisting(program.args)
    await sspawn(yarncmdRunByAppConsumer('dream db:drop --bypass-config-cache', program.args))
    await sspawn(yarncmdRunByAppConsumer('dream db:create --bypass-config-cache', program.args))
    await sspawn(yarncmdRunByAppConsumer('dream db:migrate --bypass-config-cache', program.args))
    await sspawn(yarncmdRunByAppConsumer('dream db:seed --bypass-config-cache', program.args))
  })

program
  .command('db:seed')
  .description('seeds the database using the file located in db/seed.ts')
  .option('--core', 'sets core to true')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await maybeSyncExisting(program.args)
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}node dist/src/bin/db-seed.js`)
  })

program
  .command('spec')
  .description('runs core dev specs')
  .option('--core', 'sets core to true')
  .action(async () => {
    setCoreDevelopmentFlag(program.args)
    const files = program.args.filter(arg => /\.spec\.ts$/.test(arg))
    if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
      await sspawn(yarncmdRunByAppConsumer('dream sync:associations', program.args))
      await sspawn(`DREAM_CORE_DEVELOPMENT=1 NODE_ENV=test jest --runInBand --forceExit ${files.join(' ')}`)
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
    if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
      await sspawn(
        `yarn dream sync:types --core && DREAM_CORE_DEVELOPMENT=1 NODE_ENV=development node ./dist/test-app/conf/repl.js`
      )
    } else {
      throw 'this command is not meant for use outside core development'
    }
  })

program.parse(process.argv)
