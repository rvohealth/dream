import DreamCLI from '../cli/index.js'
import DreamApp from '../dream-app/index.js'
import Query from '../dream/Query.js'
import DBClassDeprecation from '../helpers/cli/DBClassDeprecation.js'
import generateDream from '../helpers/cli/generateDream.js'
import sspawn from '../helpers/sspawn.js'

export default class DreamBin {
  public static async sync(onSync: () => Promise<void> | void, options?: { schemaOnly?: boolean }) {
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
      modelName?: string
    }
  ) {
    await generateDream({
      fullyQualifiedModelName,
      columnsWithTypes,
      options: {
        includeAdminSerializers: options.adminSerializers ?? false,
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
      connectionName: string
      adminSerializers?: boolean
      modelName?: string
    }
  ) {
    await generateDream({
      fullyQualifiedModelName,
      columnsWithTypes,
      options: {
        includeAdminSerializers: options.adminSerializers ?? false,
        ...options,
        stiBaseSerializer: false,
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
    await sspawn('pnpm typedoc src/package-exports/*.ts --tsconfig ./tsconfig.esm.build.json --out docs')
    DreamCLI.logger.logEndProgress()
  }
}
