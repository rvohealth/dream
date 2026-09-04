import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#output', () => {
  describe("mode: 'sql'", () => {
    it('surfaces the compiled sql statement from all() without executing the query', async () => {
      const compiled = await User.where({ email: 'how@yadoin' }).output('sql').all()

      expect(compiled.sql).toEqual(
        'select "users".* from "users" where ("users"."email" = $1 and "users"."deleted_at" is null)'
      )
      expect(compiled.parameters).toEqual(['how@yadoin'])
    })

    it('surfaces the statement first() would execute, limit included', async () => {
      const compiled = await User.where({ email: 'how@yadoin' }).output('sql').first()

      expect(compiled.sql).toEqual(
        'select "users".* from "users" where ("users"."email" = $1 and "users"."deleted_at" is null) order by "users"."id" asc nulls first limit $2'
      )
      expect(compiled.parameters).toEqual(['how@yadoin', 1])
    })

    it('surfaces the statement count() would execute', async () => {
      const compiled = await User.where({ email: 'how@yadoin' }).output('sql').count()

      expect(compiled.sql).toEqual(
        'select count("users"."id") as "tablecount" from "users" where ("users"."email" = $1 and "users"."deleted_at" is null)'
      )
    })

    it('surfaces the statement pluck() would execute', async () => {
      const compiled = await User.query().output('sql').pluck('id', 'email')

      expect(compiled.sql).toEqual(
        'select "users"."id" as "pluck0", "users"."email" as "pluck1" from "users" where "users"."deleted_at" is null'
      )
    })

    it('surfaces the statement exists() would execute', async () => {
      const compiled = await User.query().output('sql').exists()

      expect(compiled.sql).toEqual(
        'select "users".* from "users" where "users"."deleted_at" is null limit $1'
      )
    })

    it('surfaces the statement max() would execute', async () => {
      const compiled = await User.query().output('sql').max('id')

      expect(compiled.sql).toEqual('select max("users"."id") from "users" where "users"."deleted_at" is null')
    })

    it('surfaces the statement countBy() would execute', async () => {
      const compiled = await User.query().output('sql').countBy('name')

      expect(compiled.sql).toEqual(
        'select "users"."name" as "groupvalue", count("users"."id") as "aggregatevalue" from "users" where "users"."deleted_at" is null group by "users"."name"'
      )
    })

    context('first() on a leftJoinPreload query', () => {
      it('surfaces the join-load statement, skipping the preliminary primary key lookup', async () => {
        await User.create({ email: 'how@yadoin', password: 'howyadoin' })

        const compiled = await User.query().leftJoinPreload('pets').output('sql').first()

        expect(compiled.sql).toContain('left join "pets"')
        // the preliminary primary key lookup is skipped rather than executed,
        // so the surfaced statement carries no primary key parameter
        expect(compiled.parameters).toEqual([])
      })

      context('with a primary key where clause', () => {
        it('surfaces the join-load statement with the primary key filter', async () => {
          const compiled = await User.where({ id: '123' }).leftJoinPreload('pets').output('sql').first()

          expect(compiled.sql).toContain('left join "pets"')
          expect(compiled.parameters).toEqual(['123'])
        })
      })
    })
  })

  describe("mode: 'explain'", () => {
    it('returns the query plan rather than records', async () => {
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const plan = await User.where({ email: 'how@yadoin' }).output('explain').all()

      expect(plan.length).toBeGreaterThan(0)
      plan.forEach(line => expect(typeof line).toEqual('string'))
      expect(plan.join('\n')).toMatch(/users/)
      // a plain explain only plans the query; execution detail is absent
      expect(plan.join('\n')).not.toMatch(/actual time/)
    })

    it('explains the statement first() would execute', async () => {
      const plan = await User.query().output('explain').first()

      expect(plan.join('\n')).toMatch(/Limit/)
    })

    it('explains the join-load statement of first() on a leftJoinPreload query', async () => {
      const plan = await User.query().leftJoinPreload('pets').output('explain').first()

      expect(plan.join('\n')).toMatch(/pets/)
    })

    context('format: json', () => {
      it('returns the parsed JSON plan', async () => {
        const plan = await User.where({ email: 'how@yadoin' }).output('explain', { format: 'json' }).all()

        expect(plan.length).toEqual(1)
        expect(plan[0]).toEqual(
          expect.objectContaining({
            Plan: expect.objectContaining({ 'Relation Name': 'users' }),
          })
        )
      })
    })

    context('analyze: true', () => {
      it('executes the query to measure it, reflecting the execution in the plan', async () => {
        await User.create({ email: 'how@yadoin', password: 'howyadoin' })

        const plan = await User.where({ email: 'how@yadoin' }).output('explain', { analyze: true }).all()

        expect(plan.join('\n')).toMatch(/actual time/)
        expect(plan.join('\n')).toMatch(/Execution Time/)
      })
    })

    context('verbose: true', () => {
      it('includes additional detail in the plan', async () => {
        const plan = await User.where({ email: 'how@yadoin' }).output('explain', { verbose: true }).all()

        expect(plan.join('\n')).toMatch(/Output:/)
      })
    })

    context('analyze and verbose together with the json format', () => {
      it('applies every option to the plan', async () => {
        const plan = await User.where({ email: 'how@yadoin' })
          .output('explain', { format: 'json', analyze: true, verbose: true })
          .all()

        expect(plan[0]).toEqual(
          expect.objectContaining({
            'Execution Time': expect.any(Number),
            Plan: expect.objectContaining({
              'Relation Name': 'users',
              Output: expect.arrayContaining([expect.any(String)]),
              'Actual Rows': expect.any(Number),
            }),
          })
        )
      })
    })

    context('within a transaction', () => {
      it('gathers the plan on the transaction connection', async () => {
        await ApplicationModel.transaction(async txn => {
          await User.txn(txn).create({ email: 'how@yadoin', password: 'howyadoin' })

          // analyze executes the select on the transaction connection, so the
          // plan observes the uncommitted record created above
          const plan = await User.txn(txn)
            .where({ email: 'how@yadoin' })
            .output('explain', { analyze: true })
            .all()

          expect(plan.join('\n')).toMatch(/rows=1/)
        })
      })
    })
  })

  describe('batch iterators ignore output mode', () => {
    it('findEach executes normally, visiting records', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const visited: User[] = []
      await User.query()
        .output('sql')
        .findEach(u => {
          visited.push(u)
        })

      expect(visited).toMatchDreamModels([user])
    })

    it('pluckEach executes normally, visiting plucked values', async () => {
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const visited: string[] = []
      await User.query()
        .output('sql')
        .pluckEach('email', email => {
          visited.push(email)
        })

      expect(visited).toEqual(['how@yadoin'])
    })

    it('paginate executes normally, returning records', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const paginated = await User.query().output('sql').paginate({ page: 1 })

      expect(paginated.recordCount).toEqual(1)
      expect(paginated.results).toMatchDreamModels([user])
    })

    it('cursorPaginate executes normally, returning records', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const paginated = await User.query().output('sql').cursorPaginate({ cursor: undefined })

      expect(paginated.results).toMatchDreamModels([user])
    })
  })

  describe('mutation methods ignore output mode', () => {
    it('update executes normally, updating records', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const updatedCount = await User.query().output('sql').update({ name: 'fred' })

      expect(updatedCount).toEqual(1)
      await user.reload()
      expect(user.name).toEqual('fred')
    })

    it('destroy executes normally, destroying records', async () => {
      await User.create({ email: 'how@yadoin', password: 'howyadoin' })

      const destroyedCount = await User.query().output('sql').destroy()

      expect(destroyedCount).toEqual(1)
      expect(await User.count()).toEqual(0)
    })
  })

  describe('Dream.output', () => {
    it("surfaces the compiled sql statement for the 'sql' mode", async () => {
      const compiled = await User.output('sql').all()
      expect(compiled.sql).toEqual('select "users".* from "users" where "users"."deleted_at" is null')
    })

    it("surfaces the query plan for the 'explain' mode", async () => {
      const plan = await User.output('explain').all()
      expect(plan.join('\n')).toMatch(/users/)
    })

    it('composes with further query methods', async () => {
      const compiled = await User.output('sql').where({ email: 'how@yadoin' }).first()
      expect(compiled.sql).toContain('"users"."email" = $1')
    })
  })
})
