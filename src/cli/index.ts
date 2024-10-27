import { Command, InvalidArgumentError } from 'commander'
import DreamBin from '../bin'
import DreamApplication from '../dream-application'
import developmentOrTestEnv from '../helpers/developmentOrTestEnv'
import { setEnvBool } from '../helpers/envHelpers'

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
      .command('sync')
      .description(
        'sync introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration'
      )
      .action(async () => {
        await initializeDreamApplication()
        await DreamBin.sync()

        process.exit()
      })

    this.generateDreamCli(program, { initializeDreamApplication, seedDb })
  }

  public static generateDreamCli(
    program: Command,
    {
      initializeDreamApplication,
      seedDb,
    }: {
      initializeDreamApplication: () => Promise<any>
      seedDb: () => Promise<void> | void
    }
  ) {
    program
      .command('generate:migration')
      .alias('g:migration')
      .description('create a new migration')
      .argument('<migrationName>', 'end with -to-table-name to prepopulate with an alterTable command')
      .argument(
        '[columnsWithTypes...]',
        'properties of the model column1:text/string/enum/etc. column2:text/string/enum/etc. ... columnN:text/string/enum/etc.'
      )
      .action(async (migrationName: string, columnsWithTypes: string[]) => {
        await initializeDreamApplication()
        await DreamBin.generateMigration(migrationName, columnsWithTypes)
        process.exit()
      })

    program
      .command('generate:model')
      .alias('g:model')
      .alias('generate:dream')
      .alias('g:dream')
      .option('--no-serializer')
      .description('create a new Dream model')
      .argument(
        '<modelName>',
        'the name of the model to create, e.g. Post or Settings/CommunicationPreferences'
      )
      .argument(
        '[columnsWithTypes...]',
        'properties of the model property1:text/string/enum/etc. property2:text/string/enum/etc. ... propertyN:text/string/enum/etc.'
      )
      .action(async (modelName: string, columnsWithTypes: string[], options: { serializer: boolean }) => {
        await initializeDreamApplication()
        await DreamBin.generateDream(modelName, columnsWithTypes, options)
        process.exit()
      })

    program
      .command('generate:sti-child')
      .alias('g:sti-child')
      .description(
        'create a new Dream model that extends another Dream model, leveraging STI (single table inheritance)'
      )
      .option('--no-serializer')
      .argument(
        '<childModelName>',
        'the name of the model to create, e.g. Post or Settings/CommunicationPreferences'
      )
      .argument('<extends>', 'just the word extends')
      .argument('<parentModelName>', 'name of the parent model')
      .argument(
        '[columnsWithTypes...]',
        'properties of the model property1:text/string/enum/etc. property2:text/string/enum/etc. ... propertyN:text/string/enum/etc.'
      )
      .action(
        async (
          childModelName: string,
          extendsWord: string,
          parentModelName: string,
          columnsWithTypes: string[],
          options: { serializer: boolean }
        ) => {
          await initializeDreamApplication()
          if (extendsWord !== 'extends')
            throw new Error('Expecting: `<child-name> extends <parent-name> <columns-and-types>')
          await DreamBin.generateStiChild(childModelName, parentModelName, columnsWithTypes, options)
          process.exit()
        }
      )

    program
      .command('db:create')
      .description(
        'creates a new database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
      )
      .action(async () => {
        setEnvBool('BYPASS_DB_CONNECTIONS_DURING_INIT', '1')
        await initializeDreamApplication()
        await DreamBin.dbCreate()
        process.exit()
      })

    program
      .command('db:migrate')
      .description('db:migrate runs any outstanding database migrations')
      .option('--skip-sync', 'skips syncing local schema after running migrations')
      .action(async ({ skipSync }: { skipSync: boolean }) => {
        await initializeDreamApplication()
        await DreamBin.dbMigrate()

        if (developmentOrTestEnv() && !skipSync) {
          await DreamBin.sync()
        }

        process.exit()
      })

    program
      .command('db:rollback')
      .description('db:rollback rolls back the migration')
      .option('--steps <number>', 'number of steps back to travel', myParseInt, 1)
      .option('--skip-sync', 'skips syncing local schema after running migrations')
      .action(async ({ steps, skipSync }: { steps: number; skipSync: boolean }) => {
        await initializeDreamApplication()
        await DreamBin.dbRollback({ steps })

        if (developmentOrTestEnv() && !skipSync) {
          await DreamBin.sync()
        }

        process.exit()
      })

    program
      .command('db:drop')
      .description(
        'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
      )
      .action(async () => {
        setEnvBool('BYPASS_DB_CONNECTIONS_DURING_INIT', '1')
        await initializeDreamApplication()
        await DreamBin.dbDrop()
        process.exit()
      })

    program
      .command('db:reset')
      .description('runs db:drop (safely), then db:create, db:migrate, and db:seed')
      .action(async () => {
        setEnvBool('BYPASS_DB_CONNECTIONS_DURING_INIT', '1')
        await initializeDreamApplication()

        await DreamBin.dbDrop()
        await DreamBin.dbCreate()

        setEnvBool('BYPASS_DB_CONNECTIONS_DURING_INIT', undefined)
        await initializeDreamApplication()

        await DreamBin.dbMigrate()
        await DreamBin.sync()
        await seedDb()
        process.exit()
      })

    program
      .command('db:seed')
      .description('seeds the database using the file located in db/seed.ts')
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

function myParseInt(value: string) {
  const parsedValue = parseInt(value, 10)
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError(`${value} is not a number`)
  }
  return parsedValue
}
