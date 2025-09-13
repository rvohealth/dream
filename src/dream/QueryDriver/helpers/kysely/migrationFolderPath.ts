import * as path from 'node:path'
import DreamApp from '../../../../dream-app/index.js'

export default function migrationFolderPath(connectionName: string): string {
  const dreamApp = DreamApp.getOrFail()
  return connectionName === 'default'
    ? path.join(dreamApp.projectRoot, dreamApp.paths.db, 'migrations')
    : path.join(dreamApp.projectRoot, dreamApp.paths.db, 'migrations', connectionName)
}
