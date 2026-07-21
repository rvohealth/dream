import { sql } from 'kysely'
import MysqlQueryDriver from '../../../../test-app/app/conf/mysql/MysqlQueryDriver.js'
import MysqlUser from '../../../../test-app/app/models/MysqlUser.js'

function mysqlDb() {
  return MysqlQueryDriver.dbFor('mysql', 'primary')
}

// MySQL 8 does not support `ADD COLUMN IF NOT EXISTS` / `DROP COLUMN IF EXISTS`,
// so idempotency is achieved by consulting information_schema first
async function mysqlColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const { rows } = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = ${tableName} AND column_name = ${columnName}
  `.execute(mysqlDb())
  return rows.length > 0
}

describe('leveraging alternate db engines', () => {
  context('mysql', () => {
    it('allows models to update and fetch data from alternate db engines', async () => {
      const user = await MysqlUser.create({
        email: 'hello@world',
        name: 'freddyboy',
      })

      expect(user.email).toEqual('hello@world')
      expect(user.name).toEqual('freddyboy')
      expect(user.isPersisted).toBe(true)

      await user.update({ email: 'goodbye@world' })
      const reloaded = await MysqlUser.findOrFail(user.id)
      expect(reloaded.email).toEqual('goodbye@world')
    })

    context(
      'the live database has a column the compiled schema does not know about (rolling-deploy skew)',
      () => {
        beforeEach(async () => {
          if (!(await mysqlColumnExists('mysql_users', 'brandnewcolumn'))) {
            await sql`ALTER TABLE mysql_users ADD COLUMN brandnewcolumn varchar(255) DEFAULT 'from the future'`.execute(
              mysqlDb()
            )
          }
        })

        afterEach(async () => {
          if (await mysqlColumnExists('mysql_users', 'brandnewcolumn')) {
            await sql`ALTER TABLE mysql_users DROP COLUMN brandnewcolumn`.execute(mysqlDb())
          }
        })

        it('never hydrates the unknown column onto created or updated instances', async () => {
          // the mysql driver's saveDream reloads via a separate selectAll query
          // (no RETURNING support), so both create and update flow the raw row —
          // including the unknown column — through the shared hydration filter
          const user = await MysqlUser.create({
            email: 'hello@world',
            name: 'freddyboy',
          })
          expect(user.isPersisted).toBe(true)
          expect((user as any).brandnewcolumn).toBeUndefined()
          expect(Object.keys(user.getAttributes())).not.toContain('brandnewcolumn')

          await user.update({ email: 'goodbye@world' })
          expect(user.email).toEqual('goodbye@world')
          expect((user as any).brandnewcolumn).toBeUndefined()
          expect(Object.keys(user.getAttributes())).not.toContain('brandnewcolumn')

          const reloaded = await MysqlUser.findOrFail(user.id)
          expect((reloaded as any).brandnewcolumn).toBeUndefined()
          expect(Object.keys(reloaded.getAttributes())).not.toContain('brandnewcolumn')
        })
      }
    )
  })
})
