import { SpawnOptions } from 'child_process'
import { Command, InvalidArgumentError } from 'commander'
import DreamBin from '../bin/index.js'
import DreamApp, { DreamAppInitOptions } from '../dream-app/index.js'
import EnvInternal from '../helpers/EnvInternal.js'
import sspawn from '../helpers/sspawn.js'
import DreamCliLogger from './logger/DreamCliLogger.js'

const INDENT = '                  '

const baseColumnsWithTypesDescription = `space separated snake-case (except for belongs_to model name) properties like this:
${INDENT}    title:citext subtitle:string body_markdown:text style:enum:post_styles:formal,informal User:belongs_to
${INDENT}
${INDENT}all properties default to not nullable; null can be allowed by appending ':optional':
${INDENT}    subtitle:string:optional
${INDENT}
${INDENT}supported types:
${INDENT}    - citext:
${INDENT}        case insensitive text (indexes and queries are automatically case insensitive)
${INDENT}
${INDENT}    - string:
${INDENT}        varchar; allowed length defaults to 255, but may be customized, e.g.: subtitle:string:128 or subtitle:string:128:optional
${INDENT}
${INDENT}    - text
${INDENT}    - date
${INDENT}    - datetime
${INDENT}    - integer
${INDENT}
${INDENT}    - decimal:
${INDENT}        scale,precision is required, e.g.: volume:decimal:3,2 or volume:decimal:3,2:optional
${INDENT}
${INDENT}    - enum:
${INDENT}        include the enum name to automatically create the enum:
${INDENT}          type:enum:room_types:bathroom,kitchen,bedroom or type:enum:room_types:bathroom,kitchen,bedroom:optional
${INDENT}
${INDENT}        omit the enum values to leverage an existing enum (omits the enum type creation):
${INDENT}          type:enum:room_types or type:enum:room_types:optional`

const columnsWithTypesDescription =
  baseColumnsWithTypesDescription +
  `
${INDENT}
${INDENT}    - belongs_to:
${INDENT}        not only adds a foreign key to the migration, but also adds a BelongsTo association to the generated model:
${INDENT}
${INDENT}        include the fully qualified model name, e.g., if the Coach model is in src/app/models/Health/Coach:
${INDENT}          Health/Coach:belongs_to`

const columnsWithTypesDescriptionForMigration =
  baseColumnsWithTypesDescription +
  `
${INDENT}
${INDENT}    - belongs_to:
${INDENT}        adds a foreign key to migration
${INDENT}
${INDENT}        include the fully qualified model name, e.g., if the Coach model is in src/app/models/Health/Coach:
${INDENT}          Health/Coach:belongs_to`

export default class DreamCLI {
  /**
   * use this method for initializing a standalone dream application. If using Psychic and Dream together,
   * a different pattern is used, which leverages the `generateDreamCli` method instead.
   */
  public static provide(
    program: Command,
    {
      initializeDreamApp,
      seedDb,
    }: {
      initializeDreamApp: (opts?: DreamAppInitOptions) => Promise<DreamApp>
      seedDb: () => Promise<void> | void
    }
  ) {
    program
      .command('sync')
      .description(
        'sync introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration'
      )
      .option('--schema-only')
      .action(async (options: { schemaOnly?: boolean } = {}) => {
        await initializeDreamApp()
        await DreamBin.sync(() => {}, options)

        process.exit()
      })

    this.generateDreamCli(program, {
      initializeDreamApp,
      seedDb,
      onSync: () => {},
    })
  }

  /**
   * called under the hood when provisioning both psychic and dream applications.
   */
  public static generateDreamCli(
    program: Command,
    {
      initializeDreamApp,
      seedDb,
      onSync,
    }: {
      // uses Promise<any> because a PsychicApp can also be returned here
      initializeDreamApp: (opts?: DreamAppInitOptions) => Promise<any>
      seedDb: () => Promise<void> | void
      onSync: () => Promise<void> | void
    }
  ) {
    program
      .command('generate:migration')
      .alias('g:migration')
      .description('create a new migration')
      .argument('<migrationName>', 'end with -to-table-name to prepopulate with an alterTable command')
      .argument('[columnsWithTypes...]', columnsWithTypesDescriptionForMigration)
      .action(async (migrationName: string, columnsWithTypes: string[]) => {
        await initializeDreamApp()
        await DreamBin.generateMigration(migrationName, columnsWithTypes)
        process.exit()
      })

    program
      .command('generate:model')
      .alias('g:model')
      .alias('generate:dream')
      .alias('g:dream')
      .option('--no-serializer')
      .option('--sti-base-serializer')
      .description('create a new Dream model')
      .argument(
        '<modelName>',
        'the name of the model to create, e.g. Post or Settings/CommunicationPreferences'
      )
      .argument('[columnsWithTypes...]', columnsWithTypesDescription)
      .action(
        async (
          modelName: string,
          columnsWithTypes: string[],
          options: { serializer: boolean; stiBaseSerializer: boolean }
        ) => {
          await initializeDreamApp()
          await DreamBin.generateDream(modelName, columnsWithTypes, options)
          process.exit()
        }
      )

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
      .argument('<extends>', 'just the word "extends"')
      .argument(
        '<parentModelName>',
        `fully qualified name of the parent model, e.g.:
${INDENT}    to extend the Room model in src/app/models/Room: Room
${INDENT}    to extend the Coach model in src/app/models/Health/Coach: Health/Coach`
      )
      .argument('[columnsWithTypes...]', columnsWithTypesDescription)
      .action(
        async (
          childModelName: string,
          extendsWord: string,
          parentModelName: string,
          columnsWithTypes: string[],
          options: { serializer: boolean }
        ) => {
          await initializeDreamApp()
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
        EnvInternal.setBoolean('BYPASS_DB_CONNECTIONS_DURING_INIT')

        await initializeDreamApp({ bypassModelIntegrityCheck: true })
        await DreamBin.dbCreate()
        process.exit()
      })

    program
      .command('db:migrate')
      .description('db:migrate runs any outstanding database migrations')
      .option('--skip-sync', 'skips syncing local schema after running migrations')
      .action(async ({ skipSync }: { skipSync: boolean }) => {
        await initializeDreamApp({ bypassModelIntegrityCheck: true })

        await DreamBin.dbMigrate()

        if (EnvInternal.isDevelopmentOrTest && !skipSync) {
          await DreamBin.sync(onSync)
        }

        process.exit()
      })

    program
      .command('db:rollback')
      .description('db:rollback rolls back the migration')
      .option('--steps <number>', 'number of steps back to travel', myParseInt, 1)
      .option('--skip-sync', 'skips syncing local schema after running migrations')
      .action(async ({ steps, skipSync }: { steps: number; skipSync: boolean }) => {
        await initializeDreamApp({ bypassModelIntegrityCheck: true })
        await DreamBin.dbRollback({ steps })

        if (EnvInternal.isDevelopmentOrTest && !skipSync) {
          await DreamBin.sync(onSync)
        }

        process.exit()
      })

    program
      .command('db:drop')
      .description(
        'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
      )
      .action(async () => {
        EnvInternal.setBoolean('BYPASS_DB_CONNECTIONS_DURING_INIT')
        await initializeDreamApp({ bypassModelIntegrityCheck: true })
        await DreamBin.dbDrop()
        process.exit()
      })

    program
      .command('db:reset')
      .description('runs db:drop (safely), then db:create, db:migrate, and db:seed')
      .action(async () => {
        EnvInternal.setBoolean('BYPASS_DB_CONNECTIONS_DURING_INIT')
        await initializeDreamApp({ bypassModelIntegrityCheck: true })

        await DreamBin.dbDrop()
        await DreamBin.dbCreate()

        EnvInternal.unsetBoolean('BYPASS_DB_CONNECTIONS_DURING_INIT')
        await initializeDreamApp({ bypassModelIntegrityCheck: true })

        await DreamBin.dbMigrate()
        await DreamBin.sync(onSync)
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

        await initializeDreamApp()
        await seedDb()
        process.exit()
      })

    program
      .command('inspect:serialization')
      .alias('i:serialization')
      .description(
        'displays a serialization map to help understand the rendering logic for a particular model'
      )
      .argument('<globalName>', 'the global name of the model you want to look up')
      .argument('[serializerKey]', 'the serializer key you wish to use')
      .action(async (globalName: string, serializerKey: string) => {
        await initializeDreamApp()
        const dreamApp = DreamApp.getOrFail()
        const modelClass = dreamApp.models[globalName]
        if (!modelClass) throw new Error(`failed to locate model by global name: ${globalName}`)

        modelClass['displaySerialization'](serializerKey)
        process.exit()
      })
  }

  /*
   * the default spawn provided by node:child_process is incompatible
   * with promises. this will automatically wrap the spawn method,
   * and will by default connect STDOUT to the current STDOUT,
   * so that whatever the command is outputting is output to the
   * primary STDOUT context.
   */
  public static async spawn(command: string, opts?: SpawnOptions & { onStdout?: (str: string) => void }) {
    return await sspawn(command, opts)
  }

  public static get logger() {
    this._logger ||= new DreamCliLogger()
    return this._logger
  }
  private static _logger: DreamCliLogger | undefined = undefined
}

function myParseInt(value: string) {
  const parsedValue = parseInt(value, 10)
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError(`${value} is not a number`)
  }
  return parsedValue
}
