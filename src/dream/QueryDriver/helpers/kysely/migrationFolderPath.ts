import * as path from 'node:path'
import DreamApp from '../../../../dream-app/index.js'
import normalizeFilePath from '../../../../dream-app/helpers/normalizeFilePath.js'

export default function migrationFolderPath(connectionName: string): string {
  const dreamApp = DreamApp.getOrFail()
  const migrationPath =
    connectionName === 'default'
      ? path.join(dreamApp.projectRoot, dreamApp.paths.db, 'migrations')
      : path.join(dreamApp.projectRoot, dreamApp.paths.db, 'migrations', connectionName)

  // Normalize the path to use forward slashes on Windows to avoid ESM URL scheme issues
  // This ensures kysely's FileMigrationProvider can properly construct import paths
  // when it dynamically imports migration files
  return normalizeFilePath(path.resolve(migrationPath))
}
