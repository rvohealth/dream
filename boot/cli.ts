#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import './cli/helpers/loadAppEnvFromBoot'
import { Command } from 'commander'
import sspawn from '../src/helpers/sspawn'
import setCoreDevelopmentFlag from './cli/helpers/setCoreDevelopmentFlag'
import developmentOrTestEnv from './cli/helpers/developmentOrTestEnv'
import nodeOrTsnodeCmd from './cli/helpers/nodeOrTsnodeCmd'
import omitCoreDev from './cli/helpers/omitCoreDev'
import dreamjsOrDreamtsCmd from './cli/helpers/dreamjsOrDreamtsCmd'

const program = new Command()

function cmdargs() {
  return process.argv.slice(3, process.argv.length)
}

program
  .command('build')
  .description('build: compiles the app to javascript')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const [name] = cmdargs()
    await sspawn(
      nodeOrTsnodeCmd('boot/build.ts', cmdargs(), {
        fileArgs: [name],
      })
    )
  })

program
  .command('generate:migration')
  .alias('g:migration')
  .description('g:migration <name> create a new dream migration')
  .argument('<name>', 'name of the migration')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const [name] = cmdargs()
    await sspawn(
      nodeOrTsnodeCmd('src/bin/generate-migration.ts', cmdargs(), {
        fileArgs: [name],
      })
    )
  })

program
  .command('generate:dream')
  .alias('generate:model')
  .alias('g:model')
  .alias('g:dream')
  .description('generate:dream <name> [...attributes] create a new dream')
  .argument('<name>', 'name of the dream')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const [name, ...attributes] = cmdargs()

    await sspawn(
      nodeOrTsnodeCmd('src/bin/generate-dream.ts', cmdargs(), {
        fileArgs: [name, ...omitCoreDev(attributes)],
      })
    )
  })

program
  .command('generate:factory')
  .alias('g:factory')
  .description('generate:factory [...attributes] create a new factory for a dream')
  .argument('<name>', 'name of the dream')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const [name, ...attributes] = cmdargs()

    await sspawn(
      nodeOrTsnodeCmd('src/bin/generate-factory.ts', cmdargs(), {
        fileArgs: [name, ...omitCoreDev(attributes)],
      })
    )
  })

program
  .command('generate:serializer')
  .alias('g:serializer')
  .description('generate:serializer <name> [...attributes] create a new serializer')
  .argument('<name>', 'name of the serializer')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const [name, ...attributes] = cmdargs()
    await sspawn(
      nodeOrTsnodeCmd('src/bin/generate-serializer.ts', cmdargs(), {
        fileArgs: [name, ...omitCoreDev(attributes)],
      })
    )
  })

program
  .command('sync:client:schema')
  .alias('generate:api')
  .alias('g:api')
  .description('generate:api generates a new type file to be imported by the client')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    await sspawn(
      nodeOrTsnodeCmd('src/bin/generate-api.ts', cmdargs(), {
        fileArgs: [],
        tsnodeFlags: ['--transpile-only'],
      })
    )
  })

program
  .command('sync')
  .alias('sync:schema')
  .alias('sync:all')
  .alias('sync:types')
  .alias('introspect')
  .alias('sync:associations')
  .description(
    'sync introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration'
  )
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    await sspawn(
      nodeOrTsnodeCmd('boot/sync.ts', cmdargs(), {
        nodeFlags: ['--experimental-modules'],
        tsnodeFlags: ['--transpile-only'],
      })
    )

    await sspawn(
      nodeOrTsnodeCmd('src/bin/build-dream-schema.ts', cmdargs(), { tsnodeFlags: ['--transpile-only'] })
    )
  })

program
  .command('db:create')
  .description(
    'creates a new database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await sspawn(nodeOrTsnodeCmd('src/bin/db-create.ts', cmdargs(), { tsnodeFlags: ['--transpile-only'] }))
  })

program
  .command('db:migrate')
  .description('db:migrate runs any outstanding database migrations')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await sspawn(nodeOrTsnodeCmd('src/bin/db-migrate.ts', cmdargs(), { tsnodeFlags: ['--transpile-only'] }))

    if (developmentOrTestEnv()) {
      await sspawn(dreamjsOrDreamtsCmd('sync', cmdargs()))
    }
  })

program
  .command('db:rollback')
  .description('db:rollback rolls back the migration')
  .option('--step <integer>', '--step <integer> number of steps back to travel')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    const stepArg = cmdargs().find(arg => /--step=\d+/.test(arg))
    const step = stepArg ? parseInt(stepArg.replace('--step=', '')) : 1
    await sspawn(nodeOrTsnodeCmd(`src/bin/db-rollback.ts`, cmdargs(), { fileArgs: [`${step}`] }))
    await sspawn(dreamjsOrDreamtsCmd('sync', cmdargs()))
  })

program
  .command('db:drop')
  .description(
    'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    await sspawn(nodeOrTsnodeCmd(`src/bin/db-drop.ts`, cmdargs(), { tsnodeFlags: ['--transpile-only'] }))
  })

program
  .command('db:reset')
  .description('db:reset runs db:drop (safely), then db:create, then db:migrate')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    await sspawn(
      dreamjsOrDreamtsCmd('db:drop', cmdargs(), {
        cmdArgs: ['--bypass-config-cache'],
      })
    )
    await sspawn(
      dreamjsOrDreamtsCmd('db:create', cmdargs(), {
        cmdArgs: ['--bypass-config-cache'],
      })
    )
    await sspawn(
      dreamjsOrDreamtsCmd('db:migrate', cmdargs(), {
        cmdArgs: ['--bypass-config-cache'],
      })
    )
    await sspawn(
      dreamjsOrDreamtsCmd('db:seed', cmdargs(), {
        cmdArgs: ['--bypass-config-cache'],
      })
    )
  })

program
  .command('db:seed')
  .description('seeds the database using the file located in db/seed.ts')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .option(
    '--bypass-config-cache',
    'bypasses running type cache build (this is typically used internally only)'
  )
  .action(async () => {
    if (process.env.NODE_ENV === 'test' && process.env.DREAM_SEED_DB_IN_TEST !== '1') {
      console.log('skipping db seed for test env. To really seed for test, add DREAM_SEED_DB_IN_TEST=1')
      return
    }

    await sspawn(nodeOrTsnodeCmd(`src/bin/db-seed.ts`, cmdargs(), { tsnodeFlags: ['--transpile-only'] }))
  })

program
  .command('console')
  .description('initiates a repl, loading the models from the development test-app into scope for easy use')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    setCoreDevelopmentFlag(cmdargs())
    if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
      await sspawn(
        `yarn dream sync --core && DREAM_CORE_DEVELOPMENT=1 NODE_ENV=development npx ts-node ./test-app/conf/repl.js`
      )
    } else {
      throw 'this command is not meant for use outside core development'
    }
  })

program.parse(process.argv)
