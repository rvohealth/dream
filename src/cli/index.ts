import { spawn, SpawnOptions as NodeSpawnOptions } from 'child_process'
import { Command, InvalidArgumentError, Option } from 'commander'
import DreamBin from '../bin/index.js'
import DreamApp, { DreamAppInitOptions } from '../dream-app/index.js'
import Encrypt, { EncryptAlgorithm } from '../encrypt/index.js'
import SspawnRequiresDevelopmentOrTest from '../errors/SspawnRequiresDevelopmentOrTest.js'
import generateDream from '../helpers/cli/generateDream.js'
import EnvInternal from '../helpers/EnvInternal.js'
import loadRepl from '../helpers/loadRepl.js'
import DreamCliLogger from './logger/DreamCliLogger.js'
import colorize from './logger/loggable/colorize.js'

export type SpawnOptions = Omit<NodeSpawnOptions, 'shell'> & {
  onStdout?: (str: string) => void
  /**
   * Argv elements passed to the child as separate arguments. Defaults to `[]`.
   * Each entry is passed literally — shell meta-characters (`$`, backticks,
   * `&&`, spaces, etc.) inside any element are not interpreted by a shell.
   * This is the right shape for any caller that interpolates a path or
   * credential.
   */
  args?: string[]
}

export const CLI_INDENT = '                  '
const INDENT = CLI_INDENT

export const baseColumnsWithTypesDescription = `space separated snake-case (except for belongs_to model name) properties like this:
${INDENT}    title:citext subtitle:string body_markdown:text style:enum:post_styles:formal,informal User:belongs_to
${INDENT}
${INDENT}all properties default to not nullable; null can be allowed by appending ':optional':
${INDENT}    subtitle:string:optional
${INDENT}
${INDENT}supported types:
${INDENT}    - uuid:
${INDENT}    - uuid[]:
${INDENT}        a column optimized for storing UUIDs
${INDENT}
${INDENT}    - citext:
${INDENT}    - citext[]:
${INDENT}        case insensitive text (indexes and queries are automatically case insensitive)
${INDENT}
${INDENT}    - encrypted:
${INDENT}        encrypted text (used in conjunction with the @deco.Encrypted decorator)
${INDENT}
${INDENT}    - string:
${INDENT}    - string[]:
${INDENT}        varchar; allowed length defaults to 255, but may be customized, e.g.: subtitle:string:128 or subtitle:string:128:optional
${INDENT}
${INDENT}    - text
${INDENT}    - text[]
${INDENT}    - date
${INDENT}    - date[]
${INDENT}    - datetime
${INDENT}    - datetime[]
${INDENT}    - time
${INDENT}    - time[]
${INDENT}    - timetz
${INDENT}    - timetz[]
${INDENT}    - integer
${INDENT}    - integer[]
${INDENT}
${INDENT}    - decimal:
${INDENT}    - decimal[]:
${INDENT}        precision,scale is required, e.g.: volume:decimal:3,2 or volume:decimal:3,2:optional
${INDENT}
${INDENT}        leveraging arrays, add the "[]" suffix, e.g.: volume:decimal[]:3,2
${INDENT}
${INDENT}    - enum:
${INDENT}    - enum[]:
${INDENT}        include the enum name to automatically create the enum:
${INDENT}          type:enum:room_types:bathroom,kitchen,bedroom or type:enum:room_types:bathroom,kitchen,bedroom:optional
${INDENT}
${INDENT}        omit the enum values to leverage an existing enum (omits the enum type creation):
${INDENT}          type:enum:room_types or type:enum:room_types:optional
${INDENT}
${INDENT}        leveraging arrays, add the "[]" suffix, e.g.: type:enum[]:room_types:bathroom,kitchen,bedroom`

const columnsWithTypesDescription =
  baseColumnsWithTypesDescription +
  `
${INDENT}
${INDENT}    - belongs_to:
${INDENT}        ALWAYS use this instead of adding a raw uuid column for foreign keys. It creates the FK column, adds a database index,
${INDENT}        AND generates the @deco.BelongsTo association and typed property on the model. A raw uuid column does none of this.
${INDENT}
${INDENT}        use the fully qualified model name (matching its path under src/app/models/):
${INDENT}          User:belongs_to                  # creates user_id column + BelongsTo association
${INDENT}          Health/Coach:belongs_to           # creates health_coach_id column + BelongsTo association
${INDENT}          User:belongs_to:optional          # nullable foreign key (for optional associations)`

const columnsWithTypesDescriptionForMigration =
  baseColumnsWithTypesDescription +
  `
${INDENT}
${INDENT}    - belongs_to:
${INDENT}        ALWAYS use this instead of adding a raw uuid column for foreign keys. It creates the FK column with an index.
${INDENT}        Unlike in g:model/g:resource, this does NOT add a BelongsTo association (no model is generated).
${INDENT}
${INDENT}        use the fully qualified model name (matching its path under src/app/models/):
${INDENT}          User:belongs_to                  # creates user_id column with index
${INDENT}          Health/Coach:belongs_to           # creates health_coach_id column with index
${INDENT}          User:belongs_to:optional          # nullable foreign key`

export default class DreamCLI {
  /**
   * Starts the Dream console
   */
  public static async loadRepl(context: Record<string, unknown>) {
    return await loadRepl(context)
  }

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
        'Regenerates TypeScript types (types/db.ts, types/dream.ts) from the current database schema. Run this after changing associations, serializers, or enum types.'
      )
      .option(
        '--schema-only',
        'only regenerate database schema types, skipping any custom sync actions',
        false
      )
      .action(async (options: { schemaOnly: boolean }) => {
        await initializeDreamApp({ bypassDreamIntegrityChecks: true })
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
   * @internal
   *
   * Called by Psychic (and other consumers) to programmatically generate a
   * Dream model with all associated files.
   */
  public static async generateDream(opts: {
    fullyQualifiedModelName: string
    columnsWithTypes: string[]
    options: {
      connectionName: string
      serializer: boolean
      stiBaseSerializer: boolean
      includeAdminSerializers: boolean
      includeInternalSerializers?: boolean
      tableName?: string | undefined
      /**
       * Optional model class name override. If provided, generators use it
       * instead of deriving the class name from the fully qualified model name.
       */
      modelName?: string | undefined
      /**
       * When true (and the generated model is NOT an STI child), decorates
       * the model with `@SoftDelete()` and auto-emits a nullable
       * `deleted_at` column. Defaults to false at this programmatic entry
       * point — the CLI layer opts users in by default.
       */
      softDelete?: boolean
    }
    fullyQualifiedParentName?: string | undefined
  }) {
    await generateDream(opts)
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
      .description(
        `Generates a new Kysely migration file for schema changes. Use this for altering existing tables (adding/removing columns, indexes, constraints). Prefer g:resource or g:model when creating a new model, since they generate the migration along with the model, serializer, and spec files.
${INDENT}
${INDENT}Examples:
${INDENT}  # Add columns to an existing table (suffix with -to-<table_name> for auto alterTable scaffolding)
${INDENT}  pnpm psy g:migration add-timezone-to-users timezone:string
${INDENT}  pnpm psy g:migration add-bio-to-users bio:text:optional avatar_url:string:optional
${INDENT}
${INDENT}  # Remove columns (suffix with -from-<table_name>)
${INDENT}  pnpm psy g:migration remove-legacy-fields-from-posts
${INDENT}
${INDENT}  # General schema change (no table suffix — generates empty up/down methods)
${INDENT}  pnpm psy g:migration create-unique-index-on-invitations`
      )
      .argument(
        '<migrationName>',
        `Kebab-case name describing the change. End with -to-<table_name> or -from-<table_name> to auto-generate an alterTable scaffold for that table.
${INDENT}
${INDENT}Examples:
${INDENT}  add-phone-to-users          # scaffolds alterTable('users', ...)
${INDENT}  remove-status-from-posts    # scaffolds alterTable('posts', ...)
${INDENT}  create-join-table-host-places  # empty migration (no table suffix match)`
      )
      .option(
        '--connection-name <connectionName>',
        'the database connection to use for this migration. Only needed for multi-database setups; defaults to "default"'
      )
      .argument('[columnsWithTypes...]', columnsWithTypesDescriptionForMigration)
      .action(
        async (migrationName: string, columnsWithTypes: string[], options: { connectionName?: string }) => {
          await initializeDreamApp({ bypassDreamIntegrityChecks: true, bypassDbConnectionsDuringInit: true })
          await DreamBin.generateMigration(
            migrationName,
            columnsWithTypes,
            options.connectionName || 'default'
          )
          process.exit()
        }
      )

    program
      .command('generate:model')
      .alias('g:model')
      .alias('generate:dream')
      .alias('g:dream')
      .description(
        `Generates a Dream model with corresponding spec factory, serializer, and migration. Use this when the model will NOT be accessible via HTTP requests (e.g., internal join tables, data models with no API). For HTTP-accessible models, prefer g:resource which also generates a controller and specs.
${INDENT}
${INDENT}Examples:
${INDENT}  # Simple model
${INDENT}  pnpm psy g:model Tag value:citext
${INDENT}
${INDENT}  # Join table model
${INDENT}  pnpm psy g:model HostPlace Host:belongs_to Place:belongs_to
${INDENT}
${INDENT}  # STI parent model (use with g:sti-child for children)
${INDENT}  pnpm psy g:model --sti-base-serializer Room Place:belongs_to type:enum:room_types:Bathroom,Bedroom deleted_at:datetime:optional`
      )
      .option(
        '--no-serializer',
        'skip serializer generation. Useful for internal models that will never be serialized in an API response (e.g., join tables, audit logs)'
      )
      .option(
        '--connection-name <connectionName>',
        'the name of the database connection to use for the model. Only needed for multi-database setups; defaults to "default"',
        'default'
      )
      .option(
        '--sti-base-serializer',
        `Creates generically typed base serializers (default and summary) that accept a \`StiChildClass\` parameter and include the \`type\` attribute with a per-child enum constraint. This allows consuming applications to determine the response shape based on the STI type discriminator.
${INDENT}
${INDENT}Use this when generating the parent model of an STI hierarchy. After generating the parent, use g:sti-child for each child type.
${INDENT}
${INDENT}Example:
${INDENT}  # CRITICAL: the type enums must exactly match the class names of the STI children
${INDENT}  pnpm psy g:model --sti-base-serializer Rental type:enum:place_types:Apartment,House,Condo
${INDENT}  # STI children subsequently generated using the g:sti-child generator (note the use of \`--model-name\` to generate class names that match the \`type\` column, e.g., "Apartment" instead of the "RentalApartment" default):
${INDENT}  pnpm psy g:sti-child --model-name=Apartment Rental/Apartment extends Rental
${INDENT}  pnpm psy g:sti-child --model-name=House Rental/House extends Rental
${INDENT}  pnpm psy g:sti-child --model-name=Condo Rental/Condo extends Rental`,
        false
      )
      .option(
        '--table-name <tableName>',
        `Explicit table name to use instead of the auto-generated one. Useful when model namespaces produce long or awkward table names.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy g:model --table-name=notif_prefs Settings/NotificationPreferences User:belongs_to`
      )
      .option(
        '--model-name <modelName>',
        `Explicit model class name to use instead of the one auto-derived from the model path. Useful when the path segments don't match the desired class name.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy g:model --model-name=GroupDanceLesson Lesson/Dance/Group
${INDENT}  # model is named GroupDanceLesson instead of LessonDanceGroup`
      )
      .option(
        '--admin-serializers',
        'also generate AdminSerializer and AdminSummarySerializer variants for admin-facing API endpoints that may expose additional fields',
        false
      )
      .option(
        '--internal-serializers',
        'also generate InternalSerializer and InternalSummarySerializer variants for internal API endpoints that may expose additional fields',
        false
      )
      .option(
        '--no-soft-delete',
        `skip generating the @SoftDelete() decorator and the corresponding nullable \`deleted_at\` column. By default, generated models use soft-delete semantics (rows are marked deleted via \`deleted_at\` instead of being removed from the database). Pass this flag when you want records to be hard-deleted.`
      )
      .argument(
        '<modelName>',
        `The fully qualified model name, using / for namespacing. This determines the model class name (may be overridden with \`--model-name\`), table name, and file path under src/app/models/.
${INDENT}
${INDENT}Examples:
${INDENT}  Post                                # src/app/models/Post.ts, table: posts
${INDENT}  HostPlace                           # src/app/models/HostPlace.ts, table: host_places
${INDENT}  Settings/CommunicationPreferences   # src/app/models/Settings/CommunicationPreferences.ts`
      )
      .argument('[columnsWithTypes...]', columnsWithTypesDescription)
      .action(
        async (
          modelName: string,
          columnsWithTypes: string[],
          options: {
            serializer: boolean
            stiBaseSerializer: boolean
            connectionName: string
            tableName?: string
            modelName?: string
            adminSerializers?: boolean
            internalSerializers?: boolean
            softDelete: boolean
          }
        ) => {
          await initializeDreamApp({ bypassDreamIntegrityChecks: true, bypassDbConnectionsDuringInit: true })
          await DreamBin.generateDream(modelName, columnsWithTypes, options)
          process.exit()
        }
      )

    program
      .command('generate:sti-child')
      .alias('g:sti-child')
      .description(
        `Generates an STI (Single Table Inheritance) child model that extends an existing parent model. The child shares the parent's database table (discriminated by the \`type\` column) and can add child-specific columns. Generates a child model decorated with @STI(Parent), child serializers extending the parent's base serializers, a migration that ALTERs the parent table (not a new table), check constraints, a factory, and spec skeleton.
${INDENT}
${INDENT}If the child declares no additional columns, only the model file is generated — no migration is created. STI children share the parent's table, so a no-columns child requires no schema change. Add a migration only by passing positional field:type args, in which case the generator emits one with the appropriate check constraint. STI children never receive @SoftDelete() — soft delete is enforced at the parent level only — and the generator does not accept --no-soft-delete.
${INDENT}
${INDENT}The parent must already exist (typically generated with g:model --sti-base-serializer or g:resource --sti-base-serializer).
${INDENT}
${INDENT}Examples:
${INDENT}  # Child with an enum column
${INDENT}  pnpm psy g:sti-child --model-name=Bathroom Room/Bathroom extends Room bath_or_shower_style:enum:bath_or_shower_styles:bath,shower,none
${INDENT}
${INDENT}  # Child with an enum array column
${INDENT}  pnpm psy g:sti-child --model-name=Bedroom Room/Bedroom extends Room bed_types:enum[]:bed_types:twin,queen,king
${INDENT}
${INDENT}  # Child with no additional columns
${INDENT}  pnpm psy g:sti-child --model-name=Kitchen Room/Kitchen extends Room`
      )
      .option(
        '--no-serializer',
        'skip serializer generation. Useful if the child uses the parent serializer directly or serialization is handled elsewhere'
      )
      .option(
        '--connection-name',
        'the name of the database connection to use for the model. Only needed for multi-database setups; defaults to "default"',
        'default'
      )
      .option(
        '--model-name <modelName>',
        `Explicit model class name to use instead of the one auto-derived from the model path. Useful when the path segments don't match the desired class name.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy g:sti-child --model-name=GroupDanceLesson Lesson/Dance/Group extends Lesson
${INDENT}  # model is named GroupDanceLesson instead of LessonDanceGroup`
      )
      .option(
        '--admin-serializers',
        'also generate AdminSerializer and AdminSummarySerializer variants for admin-facing API endpoints that may expose additional fields',
        false
      )
      .option(
        '--internal-serializers',
        'also generate InternalSerializer and InternalSummarySerializer variants for internal API endpoints that may expose additional fields',
        false
      )
      .argument(
        '<childModelName>',
        `The namespaced child model path. By convention, children are nested under the parent name.
${INDENT}
${INDENT}Examples:
${INDENT}  Room/Bathroom       # src/app/models/Room/Bathroom.ts
${INDENT}  Room/Bedroom        # src/app/models/Room/Bedroom.ts
${INDENT}  Vehicle/Truck       # src/app/models/Vehicle/Truck.ts`
      )
      .argument('<extends>', 'the literal word "extends" (required syntax)')
      .argument(
        '<parentModelName>',
        `Fully qualified name of the parent STI model to extend. Must match the parent's path under src/app/models/.
${INDENT}
${INDENT}Examples:
${INDENT}  Room                # extends src/app/models/Room.ts
${INDENT}  Health/Coach        # extends src/app/models/Health/Coach.ts`
      )
      .argument('[columnsWithTypes...]', columnsWithTypesDescription)
      .action(
        async (
          childModelName: string,
          extendsWord: string,
          parentModelName: string,
          columnsWithTypes: string[],
          options: {
            serializer: boolean
            connectionName: string
            modelName?: string
            adminSerializers?: boolean
            internalSerializers?: boolean
          }
        ) => {
          await initializeDreamApp({ bypassDreamIntegrityChecks: true, bypassDbConnectionsDuringInit: true })
          if (extendsWord !== 'extends')
            throw new Error('Expecting: `<child-name> extends <parent-name> <columns-and-types>')
          await DreamBin.generateStiChild(childModelName, parentModelName, columnsWithTypes, options)
          process.exit()
        }
      )

    program
      .command('generate:encryption-key')
      .alias('g:encryption-key')
      .description(
        `Generates a cryptographically secure encryption key and prints it to stdout. Use this to create keys for any Dream/Psychic encryption use case:
${INDENT}
${INDENT}  - @deco.Encrypted() model columns (e.g., phone numbers, SSNs)
${INDENT}  - Cookie encryption/decryption in Psychic sessions
${INDENT}  - General-purpose use of the Dream Encrypt library
${INDENT}
${INDENT}Store the generated key in your environment variables (e.g., ENCRYPTION_KEY). Never commit keys to source control.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy g:encryption-key                    # generates aes-256-gcm key (default)
${INDENT}  pnpm psy g:encryption-key --algorithm=aes-128-gcm`
      )
      .addOption(
        new Option(
          '--algorithm <algorithm>',
          'the encryption algorithm to generate a key for. aes-256-gcm (default) is recommended for most use cases'
        )
          .choices(['aes-256-gcm', 'aes-192-gcm', 'aes-128-gcm'])
          .default('aes-256-gcm')
      )
      .action((options: { algorithm: EncryptAlgorithm }) => {
        // eslint-disable-next-line no-console
        console.log(Encrypt.generateKey(options.algorithm))
        process.exit()
      })

    program
      .command('db:create')
      .description(
        'Creates the database defined in your Dream configuration. Run this once when setting up a new development environment, or after db:drop. Safe to run if the database already exists.'
      )
      .action(async () => {
        await initializeDreamApp({ bypassDreamIntegrityChecks: true, bypassDbConnectionsDuringInit: true })
        await DreamBin.dbCreate()
        process.exit()
      })

    program
      .command('db:integrity-check')
      .description(
        'Checks that all migrations have been run and exits with code 1 if any are pending. Useful as a CI check or deploy gate to ensure the database schema is up to date before starting the application.'
      )
      .action(async () => {
        await initializeDreamApp({ bypassDreamIntegrityChecks: true })

        await DreamBin.dbEnsureAllMigrationsHaveBeenRun()

        process.exit()
      })

    program
      .command('db:migrate')
      .description(
        `Runs all pending database migrations in order, then automatically syncs types (only when NODE_ENV=test, to avoid clobbering generated types from a stale dev database). This is the primary command for applying schema changes after generating or editing a migration.
${INDENT}
${INDENT}Example workflow:
${INDENT}  pnpm psy g:migration add-phone-to-users phone:string:optional
${INDENT}  # edit the migration if needed (e.g., add unique constraints)
${INDENT}  pnpm psy db:migrate`
      )
      .option(
        '--skip-sync',
        'skip the automatic sync after migrating. Useful when running migrations in production or when you plan to sync manually afterward',
        false
      )
      .action(async ({ skipSync }: { skipSync: boolean }) => {
        await initializeDreamApp({ bypassDreamIntegrityChecks: true })

        await DreamBin.dbMigrate()

        if (EnvInternal.isTest && !skipSync) {
          await DreamBin.sync(onSync)
        }

        process.exit()
      })

    program
      .command('db:rollback')
      .description(
        `Rolls back the most recent migration(s), then automatically syncs types (only when NODE_ENV=test, to avoid clobbering generated types from a stale dev database). Use this to undo a migration so you can edit and re-run it.
${INDENT}
${INDENT}Examples:
${INDENT}  pnpm psy db:rollback              # rolls back the last migration
${INDENT}  pnpm psy db:rollback --steps=3    # rolls back the last 3 migrations`
      )
      .option('--steps <number>', 'number of migration steps to roll back (default: 1)', myParseInt, 1)
      .option(
        '--skip-sync',
        'skip the automatic sync after rolling back. Useful when you plan to immediately re-migrate or sync manually',
        false
      )
      .action(async ({ steps, skipSync }: { steps: number; skipSync: boolean }) => {
        await initializeDreamApp({ bypassDreamIntegrityChecks: true })
        await DreamBin.dbRollback({ steps })

        if (EnvInternal.isTest && !skipSync) {
          await DreamBin.sync(onSync)
        }

        process.exit()
      })

    program
      .command('db:drop')
      .description(
        'Drops the database. This is a destructive operation — all data will be lost. Primarily used as part of db:reset or when you need a clean slate during development.'
      )
      .action(async () => {
        await initializeDreamApp({ bypassDreamIntegrityChecks: true, bypassDbConnectionsDuringInit: true })
        await DreamBin.dbDrop()
        process.exit()
      })

    program
      .command('db:reset')
      .description(
        `Completely resets the database by running db:drop, db:create, db:migrate, sync, and db:seed in sequence. Use this when:
${INDENT}
${INDENT}  - Switching between branches with incompatible migrations ("corrupted migrations" error)
${INDENT}  - Starting fresh after a schema has diverged significantly
${INDENT}  - Setting up a clean development environment
${INDENT}
${INDENT}Warning: all existing data will be lost. The seed file (db/seed.ts) will be run to repopulate initial data.`
      )
      .action(async () => {
        await initializeDreamApp({ bypassDreamIntegrityChecks: true, bypassDbConnectionsDuringInit: true })

        const arrows = colorize('⭣⭣⭣', { color: 'green' }) + '\n'

        DreamCLI.logger.log(colorize('db:drop', { color: 'green' }), {
          logPrefix: ' ',
          logPrefixColor: 'green',
        })
        await DreamBin.dbDrop()
        DreamCLI.logger.log(arrows, { logPrefix: ' ' })

        DreamCLI.logger.log(colorize('db:create', { color: 'green' }), {
          logPrefix: ' ',
          logPrefixColor: 'green',
        })
        await DreamBin.dbCreate()
        DreamCLI.logger.log(arrows, { logPrefix: ' ' })

        await initializeDreamApp({ bypassDreamIntegrityChecks: true })

        DreamCLI.logger.log(colorize('db:migrate', { color: 'green' }), {
          logPrefix: ' ',
          logPrefixColor: 'green',
        })
        await DreamBin.dbMigrate()
        DreamCLI.logger.log(arrows, { logPrefix: ' ' })

        DreamCLI.logger.log(colorize('sync', { color: 'green' }), {
          logPrefix: ' ',
          logPrefixColor: 'green',
        })
        await DreamBin.sync(onSync)
        DreamCLI.logger.log(arrows, { logPrefix: ' ' })

        DreamCLI.logger.log(colorize('db:seed', { color: 'green' }), {
          logPrefix: ' ',
          logPrefixColor: 'green',
        })
        await DreamCLI.logger.logProgress('seeding db...', async () => {
          await seedDb()
        })

        process.exit()
      })

    program
      .command('db:seed')
      .description(
        `Seeds the database by running the seed function defined in db/seed.ts. Skipped automatically in test environments unless DREAM_SEED_DB_IN_TEST=1 is set. Runs automatically as the last step of db:reset.`
      )
      .action(async () => {
        if (process.env.NODE_ENV === 'test' && process.env.DREAM_SEED_DB_IN_TEST !== '1') {
          DreamApp.log('skipping db seed for test env. To really seed for test, add DREAM_SEED_DB_IN_TEST=1')
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
        `Displays a detailed serialization map for a model, showing all attributes, associations, custom attributes, and their types. Useful for debugging serializer output, understanding what a model's API response will look like, and verifying that associations are preloaded correctly.
${INDENT}
${INDENT}Examples:
${INDENT}  pnpm psy i:serialization Place            # shows the default serializer for Place
${INDENT}  pnpm psy i:serialization Place summary     # shows the summary serializer for Place
${INDENT}  pnpm psy i:serialization Room/Bedroom      # shows serializer for an STI child`
      )
      .argument(
        '<globalName>',
        `The global name of the model as registered in Dream (typically matches the model class name or its fully qualified path).
${INDENT}
${INDENT}Examples: User, Place, Room/Bedroom, Settings/CommunicationPreferences`
      )
      .argument(
        '[serializerKey]',
        'the serializer variant to display (e.g., "summary", "admin", "internal"). Defaults to "default" if omitted'
      )
      .action(async (globalName: string, serializerKey: string) => {
        await initializeDreamApp()
        const dreamApp = DreamApp.getOrFail()
        const modelClass = dreamApp.models[globalName]
        if (!modelClass) throw new Error(`failed to locate model by global name: ${globalName}`)

        modelClass['displaySerialization'](serializerKey)
        process.exit()
      })
  }

  /**
   * Run a developer-authored CLI command. Always runs in argv form (the
   * underlying child_process `spawn` is called with `shell: false`):
   * `command` is exec'd literally and `opts.args` are passed as separate
   * argv elements. Shell-form invocation is intentionally not supported —
   * there is no caller that needs `&&`-chaining, globs, or other shell
   * features that can't be expressed as argv.
   *
   * For backward compatibility, `command` may contain implicit args
   * separated by whitespace (e.g. `'pnpm psy sync'`); the leading token
   * becomes the program and the rest are split out and prepended to any
   * `opts.args` so the original argument order is preserved:
   *
   *     DreamCLI.spawn('pnpm psy sync')
   *       → spawn('pnpm', ['psy', 'sync'])
   *
   *     DreamCLI.spawn('pnpm psy', { args: ['sync', '--flag'] })
   *       → spawn('pnpm', ['psy', 'sync', '--flag'])
   *
   * ## Threat model (R-015)
   *
   * For dev-time CLI glue only (scaffolding, doc generation, type sync).
   * **No runtime HTTP request input ever reaches this function.** Inputs
   * are constant literals or composed from developer-supplied config
   * (package.json scripts, CLI argv, scaffold templates) — never from
   * runtime request input or any other untrusted external source.
   *
   * Argv-form is the safe choice for any caller that interpolates a
   * config value, path, or credential: a database password containing
   * `$` or backticks is passed literally to the child rather than
   * interpreted by a shell.
   *
   * ## Layered defense
   *
   * Primary gate: every caller restricts spawn use to dev/test code paths
   * (CLI commands, the dev watcher, scaffold-time code generators,
   * generated `cli:sync` initializers wrapped in
   * `if (AppEnv.isDevelopmentOrTest)`).
   *
   * Backstop: throws `SspawnRequiresDevelopmentOrTest` when `NODE_ENV` is
   * anything other than `development` or `test`. Checking
   * `!isDevelopmentOrTest` (rather than `isProduction`) means staging-style
   * envs and any unforeseen NODE_ENV value also fail closed.
   */
  public static async spawn(command: string, opts?: SpawnOptions): Promise<void> {
    const tokens = command.trim().split(/\s+/).filter(Boolean)
    const [program = '', ...implicitArgs] = tokens
    const { args: callerArgs = [], onStdout, ...spawnOpts } = opts ?? {}
    const args = [...implicitArgs, ...callerArgs]

    if (!EnvInternal.isDevelopmentOrTest) {
      throw new SspawnRequiresDevelopmentOrTest([program, ...args].join(' '))
    }

    return new Promise((accept, reject) => {
      const proc = spawn(program, args, { shell: false, ...spawnOpts })

      // NOTE: stdout spy so this CLI utility can hijack the stdout from the
      // child command and route it through a caller-provided sink.
      proc.stdout?.on('data', chunk => {
        const txt = chunk?.toString()?.trim()
        if (typeof txt !== 'string' || !txt) return

        if (onStdout) {
          onStdout(txt)
        } else {
          // eslint-disable-next-line no-console
          console.log(txt)
        }
      })

      proc.stdout?.on('error', handleSpawnError)
      proc.stderr?.on('error', handleSpawnError)
      proc.stderr?.on('data', handleSpawnError)
      proc.on('error', handleSpawnError)

      proc.on('close', code => {
        if (code !== 0) reject(code as unknown as Error)
        accept()
      })
    })
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

function handleSpawnError(err: any) {
  // eslint-disable-next-line no-console
  console.error(err?.toString())
}
