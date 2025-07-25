import { CamelCasePlugin, Kysely, PostgresDialect, sql } from 'kysely'
import { Pool } from 'pg'
import DreamDbConnection from '../../../src/db/DreamDbConnection.js'
import db from '../../../src/db/index.js'
import { DreamApp } from '../../../src/index.js'
import { DbConnectionType } from '../../../src/types/db.js'
import User from '../../../test-app/app/models/User.js'

/**
 * NOTE: for our replica safe specs, we use a database that is not actually set up
 * as a replica so that we can simulate situations in which data has been written
 * to the primary database, but not yet propagated to the read replica.
 *
 * IMPORTANT: since our specs only set up one fake replica database (not one for
 * every parallel spec database), it is important that _all_ specs that leverage
 * the fake replica database are included in this one file (not spread out to other
 * files since then it would be possible for two specs running in parallel to be
 * modifying the one fake replica database)
 */
describe('replicaSafe specific specs', () => {
  let fakeReplicaConnection: Kysely<unknown>

  beforeEach(async () => {
    const originalPrimaryConnection = DreamDbConnection.getConnection('primary')
    const connectionConf = DreamApp.getOrFail().dbConnectionConfig('primary')

    const fakeReplicaName = `replica_test_${connectionConf.name}`
    fakeReplicaConnection = new Kysely<unknown>({
      dialect: new PostgresDialect({
        pool: new Pool({
          user: connectionConf.user || '',
          password: connectionConf.password || '',
          database: fakeReplicaName,
          host: connectionConf.host || 'localhost',
          port: connectionConf.port || 5432,
          ssl: false,
        }),
      }),

      plugins: [new CamelCasePlugin({ underscoreBetweenUppercaseLetters: true })],
    })

    vi.spyOn(DreamDbConnection, 'getConnection').mockImplementation((connectionType: DbConnectionType) =>
      connectionType === 'replica' ? fakeReplicaConnection : originalPrimaryConnection
    )

    // Spec suite truncation does not hit the fake replica database, so delete all data explicitly
    await sql`DELETE FROM users;`.execute(db('replica'))
    await sql`DELETE FROM posts;`.execute(db('replica'))
    // end: Spec suite truncation does not hit the fake replica database, so delete all data explicitly

    const resetUserSequenceSql = sql`ALTER SEQUENCE users_id_seq RESTART 1;`
    const resetPostsSequenceSql = sql`ALTER SEQUENCE posts_id_seq RESTART 1;`
    const userSql = sql`INSERT INTO users (email, password_digest, created_at, updated_at) VALUES ('fred@frewd.com', 'xxxxxxxxxxxxxxxx', '2025-01-13', '2025-01-13');`

    await resetUserSequenceSql.execute(db('primary'))
    await resetPostsSequenceSql.execute(db('primary'))
    await userSql.execute(db('primary'))
    await sql`INSERT INTO posts (user_id, body, created_at, updated_at) VALUES ('1', 'primary body', '2025-01-13', '2025-01-13');`.execute(
      db('primary')
    )

    await resetUserSequenceSql.execute(db('replica'))
    await resetPostsSequenceSql.execute(db('replica'))
    await userSql.execute(db('replica'))
    await sql`INSERT INTO posts (user_id, body, created_at, updated_at) VALUES ('1', 'replica body', '2025-01-13', '2025-01-13');`.execute(
      db('replica')
    )
  })

  afterEach(async () => {
    await fakeReplicaConnection.destroy()
  })

  describe('Dream#associationQuery', () => {
    it('queries the replica database', async () => {
      const user = await User.findOrFail('1')

      const primaryPost = await user.associationQuery('posts').firstOrFail()
      expect(primaryPost.body).toEqual('primary body')

      const replicaPost = await user.associationQuery('posts').connection('replica').firstOrFail()
      expect(replicaPost.body).toEqual('replica body')
    })
  })

  describe('Dream.preload', () => {
    it('queries the replica database', async () => {
      const primaryUser = await User.preload('posts').firstOrFail()
      const replicaUser = await User.preload('posts').connection('replica').firstOrFail()

      expect(primaryUser.posts[0]!.body).toEqual('primary body')
      expect(replicaUser.posts[0]!.body).toEqual('replica body')
    })
  })

  describe('Dream.leftJoinPreload', () => {
    it('queries the replica database', async () => {
      const primaryUser = await User.leftJoinPreload('posts').firstOrFail()
      const replicaUser = await User.leftJoinPreload('posts').connection('replica').firstOrFail()

      expect(primaryUser.posts[0]!.body).toEqual('primary body')
      expect(replicaUser.posts[0]!.body).toEqual('replica body')
    })
  })
})
