import * as path from 'node:path'
import { CliFileWriter } from '../../cli/CliFileWriter.js'
import DreamCLI from '../../cli/index.js'
import colorize from '../../cli/logger/loggable/colorize.js'
import DreamApp from '../../dream-app/index.js'
import ASTKyselyCodegenEnhancer from '../../helpers/cli/ASTKyselyCodegenEnhancer.js'
import dreamPath from '../../helpers/path/dreamPath.js'
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

  // Argv form (R-015): the connection URL embeds the DB password, and passwords
  // may legitimately contain shell meta-characters (`$`, backticks, spaces, etc.).
  // DreamCLI.spawn always uses shell:false, so each arg is passed literally to
  // the child rather than parsed by a shell — credentials are preserved and any
  // future mutable source can't open a command-injection surface.
  const userinfo = `${dbConf.user}${dbConf.password ? `:${dbConf.password}` : ''}`
  const url = `${driverClass.syncDialect}://${userinfo}@${dbConf.host}:${dbConf.port}/${dbConf.name}`
  const args = [`--dialect=${driverClass.syncDialect}`, `--url=${url}`]
  if (lowLevelDbOpts?.tableIncludePattern) {
    args.push(`--include-pattern=${lowLevelDbOpts.tableIncludePattern}`)
  }
  if (lowLevelDbOpts?.tableExcludePattern) {
    args.push(`--exclude-pattern=${lowLevelDbOpts.tableExcludePattern}`)
  }
  args.push(`--out-file=${absoluteDbSyncPath}`)

  await DreamCLI.spawn('kysely-codegen', {
    args,
    onStdout: message => {
      DreamCLI.logger.logContinueProgress(colorize(`[db]`, { color: 'greenBright' }) + ' ' + message, {
        logPrefixColor: 'greenBright',
      })
    },
  })

  await new ASTKyselyCodegenEnhancer(connectionName).enhance()
}
