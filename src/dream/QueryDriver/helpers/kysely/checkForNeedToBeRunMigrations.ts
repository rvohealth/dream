import { FileMigrationProvider, Migrator } from 'kysely'
import * as fs from 'node:fs/promises'
import { closeAllConnectionsForConnectionName, DialectProviderCb } from '../../../../db/DreamDbConnection.js'
import db from '../../../../db/index.js'
import windowsSafePath from '../../../../helpers/path/windowsSafePath.js'
import migrationFolderPath from './migrationFolderPath.js'

type MigrationModes = 'migrate' | 'rollback'

interface MigrationOpts {
  connectionName: string
  dialectProvider: DialectProviderCb
  mode?: MigrationModes
}

export default async function checkForNeedToBeRunMigrations({
  connectionName,
  dialectProvider,
}: MigrationOpts): Promise<boolean> {
  const migrationFolder = migrationFolderPath(connectionName)

  // Ensure the migration folder exists
  await fs.mkdir(migrationFolder, { recursive: true })

  const kyselyDb = db(connectionName, 'primary', dialectProvider)

  const migrator = new Migrator({
    db: kyselyDb,
    allowUnorderedMigrations: true,
    provider: new FileMigrationProvider({
      fs,
      path: windowsSafePath,
      migrationFolder,
    }),
  })

  const result = (await migrator.getMigrations()).some(migrationInfo => !migrationInfo.executedAt)

  await closeAllConnectionsForConnectionName(connectionName)

  return result
}
