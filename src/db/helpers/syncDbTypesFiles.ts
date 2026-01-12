import * as path from 'node:path'
import { CliFileWriter } from '../../cli/CliFileWriter.js'
import DreamCLI from '../../cli/index.js'
import colorize from '../../cli/logger/loggable/colorize.js'
import DreamApp from '../../dream-app/index.js'
import ASTKyselyCodegenEnhancer from '../../helpers/cli/ASTKyselyCodegenEnhancer.js'
import dreamPath from '../../helpers/path/dreamPath.js'
import sspawn from '../../helpers/sspawn.js'
import dbTypesFilenameForConnection from './dbTypesFilenameForConnection.js'

export default async function syncDbTypesFiles(connectionName: string) {
  const dreamApp = DreamApp.getOrFail()

  const dbConf = dreamApp.dbConnectionConfig(connectionName, 'primary')
  const driverClass = dreamApp.dbConnectionQueryDriverClass(connectionName)

  const dbFilename = dbTypesFilenameForConnection(connectionName)
  const dbSyncFilePath = path.join(dreamPath('types'), dbFilename)
  const absoluteDbSyncPath = path.join(dreamApp.projectRoot, dbSyncFilePath)

  await CliFileWriter.cache(absoluteDbSyncPath)

  const lowLevelDbOpts = dreamApp.dbCredentialsFor(connectionName)

  const dialect = `--dialect=${driverClass.syncDialect}`
  const url = `--url=${driverClass.syncDialect}://${dbConf.user}${dbConf.password ? `:${dbConf.password}` : ''}@${dbConf.host}:${dbConf.port}/${dbConf.name}`
  const outfile = `--out-file=${absoluteDbSyncPath}`
  const includePattern = lowLevelDbOpts?.tableIncludePattern
    ? `--include-pattern="${lowLevelDbOpts.tableIncludePattern}"`
    : ''
  const excludePattern = lowLevelDbOpts?.tableExcludePattern
    ? `--exclude-pattern="${lowLevelDbOpts.tableExcludePattern}"`
    : ''
  const kyselyCodegenCmd = `kysely-codegen ${dialect} ${url} ${includePattern} ${excludePattern} ${outfile}`

  await sspawn(kyselyCodegenCmd, {
    onStdout: message => {
      DreamCLI.logger.logContinueProgress(colorize(`[db]`, { color: 'cyan' }) + ' ' + message, {
        logPrefixColor: 'cyan',
      })
    },
  })

  await new ASTKyselyCodegenEnhancer(connectionName).enhance()
}
