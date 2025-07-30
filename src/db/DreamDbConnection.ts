// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import { CamelCasePlugin, Kysely } from 'kysely'
import DreamApp, { KyselyLogEvent, SingleDbCredential } from '../dream-app/index.js'
import protectAgainstPollutingAssignment from '../helpers/protectAgainstPollutingAssignment.js'
import { DbConnectionType } from '../types/db.js'

let connections = {} as { [key: string]: { [key: string]: Kysely<any> } }

export default class DreamDbConnection {
  public static getConnection<DB>(
    connectionName: string,
    connectionType: DbConnectionType,
    dialectProvider: DialectProviderCb
  ): Kysely<DB> {
    const dreamApp = DreamApp.getOrFail()
    const connectionTypeName = this.getConnectionTypeName(connectionType)
    const connection = connections[connectionName]?.[connectionTypeName]
    if (connection) {
      return connection
    }

    const connectionConf = dreamApp.dbConnectionConfig(connectionName, connectionType)

    const dbConn = new Kysely<DB>({
      log(event) {
        const dreamApp = DreamApp.getOrFail()
        dreamApp.specialHooks.dbLog.forEach(fn => {
          fn(event as KyselyLogEvent)
        })
      },

      dialect: dialectProvider(connectionConf),
      plugins: [new CamelCasePlugin({ underscoreBetweenUppercaseLetters: true })],
    })

    const protectedName = protectAgainstPollutingAssignment(connectionName)
    connections[protectedName] ||= {}
    connections[protectedName][this.getConnectionTypeName(connectionType)] = dbConn

    return dbConn
  }

  private static getConnectionTypeName(connectionType: DbConnectionType): string {
    return DreamApp.getOrFail().parallelDatabasesEnabled
      ? `${connectionType}_${process.env.VITEST_POOL_ID}`
      : connectionType
  }
}

export function dreamDbConnections() {
  return connections
}

export async function closeAllDbConnections() {
  const connectionNames = Object.keys(connections)
  for (const connectionName of connectionNames) {
    await closeAllConnectionsForConnectionName(connectionName)
  }
  connections = {}
}

export async function closeAllConnectionsForConnectionName(connectionName: string) {
  const protectedName = protectAgainstPollutingAssignment(connectionName)
  return await Promise.allSettled(
    Object.keys(connections[protectedName]!).map(async key => {
      const conn = connections[protectedName]![key]!
      await conn.destroy()
      delete connections[protectedName]![key]
    })
  )
}
export type DialectProviderCb = (connectionConf: SingleDbCredential) => any
