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

  const password = await driverClass.codegenPassword(dbConf.password)
  await CliFileWriter.cache(absoluteDbSyncPath)

  const lowLevelDbOpts = dreamApp.dbCredentialsFor(connectionName)

  // Pass the URL only in the child's environment. A URL in argv exposes the
  // password in the process command line and DreamCLI's refused-spawn error.
  const userinfo = `${encodeURIComponent(dbConf.user)}${password ? `:${encodeURIComponent(password)}` : ''}`
  const url = `${driverClass.syncDialect}://${userinfo}@${dbConf.host}:${dbConf.port}/${dbConf.name}`
  const args = [`--dialect=${driverClass.syncDialect}`, '--url=env(DATABASE_URL)']
  if (lowLevelDbOpts?.tableIncludePattern) {
    args.push(`--include-pattern=${lowLevelDbOpts.tableIncludePattern}`)
  }
  if (lowLevelDbOpts?.tableExcludePattern) {
    args.push(`--exclude-pattern=${lowLevelDbOpts.tableExcludePattern}`)
  }
  args.push(`--out-file=${absoluteDbSyncPath}`)

  await DreamCLI.spawn('kysely-codegen', {
    args,
    env: { ...process.env, DATABASE_URL: url },
    onStdout: message => {
      DreamCLI.logger.logContinueProgress(colorize(`[db]`, { color: 'greenBright' }) + ' ' + message, {
        logPrefixColor: 'greenBright',
      })
    },
  })

  await new ASTKyselyCodegenEnhancer(connectionName).enhance()
}
