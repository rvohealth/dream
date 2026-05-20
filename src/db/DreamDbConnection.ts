// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import { CamelCasePlugin, Kysely } from 'kysely'
import DreamApp, { KyselyLogEvent, DreamDbConfig } from '../dream-app/index.js'
import protectAgainstPollutingAssignment from '../helpers/protectAgainstPollutingAssignment.js'
import { DbConnectionType } from '../types/db.js'
import {
  installDbConnectionLeakDiagnosticsIfEnabled,
  reportLeakedDbConnections,
} from './dbConnectionLeakDiagnostics.js'

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

    // Must run before dialectProvider() constructs the pg.Pool. Idempotent and
    // a no-op unless DREAM_DB_LEAK_DIAGNOSTICS is set.
    installDbConnectionLeakDiagnosticsIfEnabled()

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

/**
 * Upper bound (ms) on how long {@link closeAllConnectionsForConnectionName}
 * waits for a single Kysely connection's underlying pool to drain.
 *
 * `conn.destroy()` resolves to `pg`'s `pool.end()`, which only settles once
 * every checked-out client has been released back to the pool. A client that
 * was leased by a query still in flight when shutdown began — an aborted HTTP
 * request during a SIGTERM drain, a feature-spec whose page is torn down
 * mid-request — is never released, so `pool.end()` blocks forever and takes
 * the whole shutdown with it. Bounding the wait keeps shutdown deterministic;
 * the leaked socket is reaped by the OS when the process exits.
 */
const DB_CONNECTION_CLOSE_TIMEOUT_MS = 10_000

export async function closeAllConnectionsForConnectionName(connectionName: string) {
  const protectedName = protectAgainstPollutingAssignment(connectionName)
  return await Promise.allSettled(
    Object.keys(connections[protectedName]!).map(async key => {
      const conn = connections[protectedName]![key]!
      // Remove from the registry first so a subsequent getConnection() builds a
      // fresh pool even if this drain times out and the old pool is abandoned.
      delete connections[protectedName]![key]
      await destroyConnectionWithinTimeout(conn, `${connectionName}:${key}`)
    })
  )
}

async function destroyConnectionWithinTimeout(conn: Kysely<any>, label: string): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = Symbol('timedOut')

  const timeout = new Promise<typeof timedOut>(resolve => {
    timer = setTimeout(() => resolve(timedOut), DB_CONNECTION_CLOSE_TIMEOUT_MS)
    // Don't let the timer itself keep the event loop (or `process.exit`) alive.
    timer.unref?.()
  })

  try {
    const result = await Promise.race([conn.destroy(), timeout])
    if (result === timedOut) {
      DreamApp.logWithLevel(
        'warn',
        `[dream] timed out after ${DB_CONNECTION_CLOSE_TIMEOUT_MS}ms waiting for db connection "${label}" ` +
          `to close; abandoning the drain so shutdown can proceed. A pooled client was most likely held ` +
          `past shutdown by an in-flight or aborted query. ` +
          `Re-run with NODE_DEBUG=dream to log the acquire stack of the offending query.`
      )
      // No-op unless NODE_DEBUG=dream; when set, this prints the acquire
      // stack(s) of the client(s) that never got released.
      reportLeakedDbConnections(label)
    }
  } finally {
    if (timer) clearTimeout(timer)
  }
}
export type DialectProviderCb = (connectionConf: DreamDbConfig) => any
