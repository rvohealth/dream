#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import { Command } from 'commander'
import generateDream from './cli/helpers/generateDream'
import generateMigration from './cli/helpers/generateMigration'
import sspawn from '../src/helpers/sspawn'
import setCoreDevelopmentFlag, { coreSuffix } from './cli/helpers/setCoreDevelopmentFlag'
import yarncmdRunByAppConsumer from './cli/helpers/yarncmdRunByAppConsumer'

const program = new Command()

program
  .command('generate:migration')
  .alias('g:migration')
  .description('g:migration <name> create a new dream migration')
  .argument('<name>', 'name of the migration')
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    const [_, name] = program.args
    await generateMigration(name)
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
    setCoreDevelopmentFlag(program.args)
    const [_, name, ...attributes] = program.args
    await generateDream(
      name,
      attributes.filter(attr => !['--core'].includes(attr))
    )
  })

program
  .command('sync:types')
  .alias('sync:all')
  .description('runs yarn dream sync:schema, then yarn dream sync:associations')
  .option('--core', 'sets core to true')
  .action(async () => {
    await sspawn(yarncmdRunByAppConsumer('dream sync:schema', program.args))
    await sspawn(yarncmdRunByAppConsumer('dream sync:associations', program.args))
  })

program
  .command('sync:schema')
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
  .command('sync:associations')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}npx ts-node --transpile-only src/bin/build-associations.ts`)
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
  .command('db:migrate')
  .description('db:migrate runs any outstanding database migrations')
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}npx ts-node src/bin/db-migrate.ts`)
    await sspawn(yarncmdRunByAppConsumer('dream sync:types', program.args))
  })

program
  .command('db:rollback')
  .description('db:rollback rolls back the migration')
  .option('--step <integer>', '--step <integer> number of steps back to travel')
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    const stepArg = program.args.find(arg => /step=\d+/.test(arg))
    const step = stepArg ? parseInt(stepArg!.replace('--step=', '')) : 1
    console.log('RUNNING: ', `${coreDevFlag}npx ts-node src/bin/db-rollback.ts ${step}`)
    // await sspawn(`${coreDevFlag}npx ts-node src/bin/db-rollback.ts ${step}`)
    // await sspawn(yarncmdRunByAppConsumer('dream sync:types', program.args))

    await sspawn(
      `${coreDevFlag}npx ts-node src/bin/db-rollback.ts ${step} && ${
        process.env.DREAM_CORE_DEVELOPMENT === '1' ? 'yarn dream sync:types --core' : 'yarn dream sync:types'
      }`
    )
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
  .command('db:reset')
  .description('db:reset runs db:drop (safely), then db:create, then db:migrate')
  .option('--core', 'sets core to true')
  .action(async () => {
    await sspawn(yarncmdRunByAppConsumer('dream sync:existing', program.args))
    await sspawn(yarncmdRunByAppConsumer('dream db:drop', program.args))
    await sspawn(yarncmdRunByAppConsumer('dream db:create', program.args))
    await sspawn(yarncmdRunByAppConsumer('dream db:migrate', program.args))
  })

program
  .command('sync:existing')
  .description(
    'syncs the current schema, associations, and db configuration (rather than generating a new one).'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    setCoreDevelopmentFlag(program.args)
    await sspawn(`npx ts-node boot/sync-existing-or-create-boilerplate.ts`)
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
    if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
      await sspawn(yarncmdRunByAppConsumer('dream sync:associations', program.args))
      await sspawn(`DREAM_CORE_DEVELOPMENT=1 jest --runInBand --forceExit ${files.join(' ')}`)
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
        `yarn dream sync:types --core && DREAM_CORE_DEVELOPMENT=1 NODE_ENV=development npx ts-node --project ./tsconfig.json ./test-app/conf/repl.ts`
      )
    } else {
      throw 'this command is not meant for use outside core development'
    }
  })

program.parse(process.argv)
