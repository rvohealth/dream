import DreamCLI from '../cli/index.js'
import DreamApp from '../dream-app/index.js'
import Query from '../dream/Query.js'
import DBClassDeprecation from '../helpers/cli/DBClassDeprecation.js'
import generateDream from '../helpers/cli/generateDream.js'
import EnvInternal from '../helpers/EnvInternal.js'
import standardizeFullyQualifiedModelName from '../helpers/standardizeFullyQualifiedModelName.js'

export default class DreamBin {
  public static async sync(onSync: () => Promise<void> | void, options?: { schemaOnly?: boolean }) {
    if (!EnvInternal.isTest) {
      DreamCLI.logger.log(
        `skipping sync: auto-generated type/schema files are only built when NODE_ENV=test (current NODE_ENV: ${process.env.NODE_ENV ?? 'unset'}). Run with NODE_ENV=test to regenerate.`
      )
      return
    }

    const dreamApp = DreamApp.getOrFail()
    for (const connectionName of Object.keys(dreamApp.dbCredentials)) {
      await Query.dbDriverClass(connectionName).sync(connectionName, onSync, options)
    }

    await new DBClassDeprecation().deprecate()
  }

  public static async dbCreate() {
    const dreamApp = DreamApp.getOrFail()
    for (const connectionName of Object.keys(dreamApp.dbCredentials)) {
      await Query.dbDriverClass(connectionName).dbCreate(connectionName)
    }
  }

  public static async dbDrop() {
    const dreamApp = DreamApp.getOrFail()
    for (const connectionName of Object.keys(dreamApp.dbCredentials)) {
      await Query.dbDriverClass(connectionName).dbDrop(connectionName)
    }
  }

  public static async dbEnsureAllMigrationsHaveBeenRun() {
    const dreamApp = DreamApp.getOrFail()
    for (const connectionName of Object.keys(dreamApp.dbCredentials)) {
      await Query.dbDriverClass(connectionName).ensureAllMigrationsHaveBeenRun(connectionName)
    }
  }

  public static async dbMigrate() {
    const dreamApp = DreamApp.getOrFail()
    for (const connectionName of Object.keys(dreamApp.dbCredentials)) {
      await Query.dbDriverClass(connectionName).migrate(connectionName)
    }
  }

  public static async dbRollback(opts: { steps: number }) {
    const dreamApp = DreamApp.getOrFail()
    for (const connectionName of Object.keys(dreamApp.dbCredentials)) {
      await Query.dbDriverClass(connectionName).rollback({ ...opts, connectionName })
    }
  }

  public static async generateDream(
    fullyQualifiedModelName: string,
    columnsWithTypes: string[],
    options: {
      serializer: boolean
      stiBaseSerializer: boolean
      connectionName: string
      tableName?: string
      adminSerializers?: boolean
      internalSerializers?: boolean
      modelName?: string
      softDelete?: boolean
    }
  ) {
    await generateDream({
      fullyQualifiedModelName,
      columnsWithTypes,
      options: {
        includeAdminSerializers: options.adminSerializers ?? false,
        includeInternalSerializers: options.internalSerializers ?? false,
        ...options,
      },
    })
  }

  public static async generateStiChild(
    fullyQualifiedModelName: string,
    fullyQualifiedParentName: string,
    columnsWithTypes: string[],
    options: {
      serializer: boolean
      /**
       * The connection whose migrations folder receives the child's
       * migration. Defaults to the parent model's connection, which is the
       * connection the child uses; the parent must then be one of the app's
       * models, or this throws before any file is written.
       */
      connectionName?: string
      adminSerializers?: boolean
      internalSerializers?: boolean
      modelName?: string
    }
  ) {
    const connectionName =
      options.connectionName ?? stiParentConnectionName(fullyQualifiedModelName, fullyQualifiedParentName)

    await generateDream({
      fullyQualifiedModelName,
      columnsWithTypes,
      options: {
        includeAdminSerializers: options.adminSerializers ?? false,
        includeInternalSerializers: options.internalSerializers ?? false,
        ...options,
        connectionName,
        stiBaseSerializer: false,
        // `@SoftDelete()` is incompatible with STI children — never auto-apply.
        softDelete: false,
      },
      fullyQualifiedParentName,
    })
  }

  public static async generateMigration(
    migrationName: string,
    columnsWithTypes: string[],
    connectionName: string
  ) {
    await Query.dbDriverClass(connectionName).generateMigration(
      connectionName,
      migrationName,
      columnsWithTypes
    )
  }

  // though this is a private method, it is still used internally.
  // It is only made private so that people don't mistakenly try
  // to use it to generate docs for their apps.
  private static async buildDocs() {
    DreamCLI.logger.logStartProgress('generating docs...')
    // safe (R-015): all argv elements are constant literals; typedoc itself
    // expands the glob so we don't need shell-form invocation.
    await DreamCLI.spawn('pnpm', {
      args: [
        'typedoc',
        'src/package-exports/*.ts',
        '--tsconfig',
        './tsconfig.esm.build.json',
        '--out',
        'docs',
      ],
    })
    DreamCLI.logger.logEndProgress()
  }
}

/**
 * An STI child shares its parent's table, so its migration belongs to the
 * parent model's connection.
 */
function stiParentConnectionName(fullyQualifiedModelName: string, fullyQualifiedParentName: string) {
  const parentModel =
    DreamApp.getOrFail().models[standardizeFullyQualifiedModelName(fullyQualifiedParentName)]
  if (!parentModel)
    throw new Error(
      `Cannot generate the STI child ${fullyQualifiedModelName}: its parent, ${fullyQualifiedParentName}, is not one of the app models. The parent must already exist, and its name must match its path under the models directory (e.g. Health/Coach for Health/Coach.ts).`
    )

  return parentModel.prototype.connectionName
}
