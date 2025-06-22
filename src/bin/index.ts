import DreamCLI from '../cli/index.js'
import Query from '../dream/Query.js'
import generateDream from '../helpers/cli/generateDream.js'
import sspawn from '../helpers/sspawn.js'

export default class DreamBin {
  public static async sync(onSync: () => Promise<void> | void) {
    await Query.dbDriverClass().sync(onSync)
  }

  public static async dbCreate() {
    await Query.dbDriverClass().dbCreate()
  }

  public static async dbDrop() {
    await Query.dbDriverClass().dbDrop()
  }

  public static async dbMigrate() {
    await Query.dbDriverClass().migrate()
  }

  public static async dbRollback(opts: { steps: number }) {
    await Query.dbDriverClass().rollback(opts)
  }

  public static async generateDream(
    fullyQualifiedModelName: string,
    columnsWithTypes: string[],
    options: { serializer: boolean; stiBaseSerializer: boolean }
  ) {
    await generateDream({
      fullyQualifiedModelName,
      columnsWithTypes,
      options: { includeAdminSerializers: false, ...options },
    })
  }

  public static async generateStiChild(
    fullyQualifiedModelName: string,
    fullyQualifiedParentName: string,
    columnsWithTypes: string[],
    options: { serializer: boolean }
  ) {
    await generateDream({
      fullyQualifiedModelName,
      columnsWithTypes,
      options: { includeAdminSerializers: false, ...options, stiBaseSerializer: false },
      fullyQualifiedParentName,
    })
  }

  public static async generateMigration(migrationName: string, columnsWithTypes: string[]) {
    await Query.dbDriverClass().generateMigration(migrationName, columnsWithTypes)
  }

  // though this is a private method, it is still used internally.
  // It is only made private so that people don't mistakenly try
  // to use it to generate docs for their apps.
  private static async buildDocs() {
    DreamCLI.logger.logStartProgress('generating docs...')
    await sspawn('yarn typedoc src/index.ts --tsconfig ./tsconfig.esm.build.json --out docs')
    DreamCLI.logger.logEndProgress()
  }
}
