import { Command } from 'commander'
import DreamBin from '../bin'
import DreamApplication from '../dream-application'
import developmentOrTestEnv from '../helpers/developmentOrTestEnv'

function cmdargs() {
  return process.argv.slice(3, process.argv.length)
}

export default class DreamCLI {
  public static provide(
    program: Command,
    {
      initializeDreamApplication,
      seedDb,
    }: {
      initializeDreamApplication: () => Promise<DreamApplication>
      seedDb: () => Promise<void> | void
    }
  ) {
    program
      .command('generate:migration')
      .alias('g:migration')
      .description('g:migration <name> create a new dream migration')
      .argument('<name>', 'name of the migration')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.generateMigration()
        process.exit()
      })

    program
      .command('generate:dream')
      .alias('generate:model')
      .alias('g:dream')
      .alias('g:model')
      .description('generate:dream <name> [...attributes] create a new dream')
      .argument('<name>', 'name of the dream')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.generateDream()
        process.exit()
      })

    program
      .command('generate:sti-child')
      .alias('g:sti-child')
      .description('generate:dream <name> extends <base-name> [...attributes] create a new dream')
      .argument('<name>', 'name of the dream')
      .argument('<base-name>', 'name of the parent dream')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.generateStiChild()
        process.exit()
      })

    program
      .command('generate:factory')
      .alias('g:factory')
      .description('generate:factory [...attributes] create a new factory for a dream')
      .argument('<name>', 'name of the dream')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.generateFactory()
        process.exit()
      })

    program
      .command('generate:serializer')
      .alias('g:serializer')
      .description('generate:serializer <name> [...attributes] create a new serializer')
      .argument('<name>', 'name of the serializer')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.generateSerializer()
        process.exit()
      })

    program
      .command('sync')
      .description(
        'sync introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration'
      )
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.sync()

        process.exit()
      })

    program
      .command('db:create')
      .description(
        'creates a new database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
      )
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .option(
        '--bypass-config-cache',
        'bypasses running type cache build (this is typically used internally only)'
      )
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.dbCreate()
        process.exit()
      })

    program
      .command('db:migrate')
      .description('db:migrate runs any outstanding database migrations')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .option('--skip-sync', 'skips syncing local schema after running migrations')
      .option(
        '--bypass-config-cache',
        'bypasses running type cache build (this is typically used internally only)'
      )
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.dbMigrate()

        if (developmentOrTestEnv() && !cmdargs().includes('--skip-sync')) {
          await DreamBin.sync()
        }

        process.exit()
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
        await initializeDreamApplication()
        await DreamBin.dbRollback()
        await DreamBin.sync()
        process.exit()
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
        await initializeDreamApplication()
        await DreamBin.dbDrop()
        process.exit()
      })

    program
      .command('db:reset')
      .description('db:reset runs db:drop (safely), then db:create, then db:migrate')
      .option('--core', 'sets core to true')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.dbDrop()
        await DreamBin.dbCreate()
        await DreamBin.dbMigrate()
        await DreamBin.sync()
        await seedDb()
        process.exit()
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

        await initializeDreamApplication()
        await seedDb()
        process.exit()
      })
  }
}
