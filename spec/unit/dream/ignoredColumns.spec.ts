import { sql } from 'kysely'
import ModelWithIgnoredColumns from '../../../test-app/app/models/ModelWithIgnoredColumns.js'
import User from '../../../test-app/app/models/User.js'
import db from '../../../test-app/db/index.js'

describe('Dream#ignoredColumns', () => {
  // The model_with_ignored_columns table has a deprecated_column in the
  // live database (see the create-model-with-ignored-columns migration),
  // but ModelWithIgnoredColumns declares it ignored, so sync omitted it
  // from the generated types files. These specs pin the resulting
  // contract: the column is invisible to the model layer even though it is
  // physically present — the deploy-1 state of the two-deploy column-drop
  // process.

  it('omits ignored columns from columns()', () => {
    expect(ModelWithIgnoredColumns.columns()).not.toContain('deprecatedColumn')
    expect(ModelWithIgnoredColumns.columns()).toContain('name')
  })

  it('creates and updates successfully while the ignored column is still present in the database', async () => {
    const model = await ModelWithIgnoredColumns.create({ name: 'Aster' })
    expect(model.isPersisted).toBe(true)
    expect(typeof model.id).toBe('string')

    await model.update({ name: 'Astor' })

    const reloaded = await ModelWithIgnoredColumns.findOrFail(model.id)
    expect(reloaded.name).toEqual('Astor')
  })

  it('never hydrates the ignored column onto instances, even when the database row has a value for it', async () => {
    const model = await ModelWithIgnoredColumns.create({ name: 'Aster' })
    await sql`UPDATE model_with_ignored_columns SET deprecated_column = 'set via raw sql' WHERE id = ${model.id}`.execute(
      db('default', 'primary')
    )

    // an update returns the row via RETURNING *, which includes
    // deprecated_column; the ignored column must be filtered before
    // hydration
    await model.update({ name: 'Astor' })
    expect((model as any).deprecatedColumn).toBeUndefined()
    expect(Object.keys(model.getAttributes())).not.toContain('deprecatedColumn')

    const reloaded = await ModelWithIgnoredColumns.findOrFail(model.id)
    expect((reloaded as any).deprecatedColumn).toBeUndefined()
    expect(Object.keys(reloaded.getAttributes())).not.toContain('deprecatedColumn')
  })

  context('a write that explicitly sets the ignored column through a type escape hatch', () => {
    it('behaves like any unknown attribute: assigned as a plain property, never persisted, no error', async () => {
      const model = await ModelWithIgnoredColumns.create({
        name: 'Aster',
        deprecatedColumn: 'escape hatch',
      } as any)

      expect((model as any).deprecatedColumn).toEqual('escape hatch')

      const row = await sql<{
        deprecatedColumn: string | null
      }>`SELECT deprecated_column FROM model_with_ignored_columns WHERE id = ${model.id}`.execute(
        db('default', 'primary')
      )
      expect(row.rows[0]!.deprecatedColumn).toBeNull()
    })
  })

  context('associations pointing to a model with ignored columns', () => {
    let user: User
    let model: ModelWithIgnoredColumns

    beforeEach(async () => {
      user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      model = await ModelWithIgnoredColumns.create({ user, name: 'Aster' })
    })

    it('preloads successfully while the ignored column is still present in the database', async () => {
      const reloaded = await User.query().preload('modelsWithIgnoredColumns').firstOrFail()
      expect(reloaded.modelsWithIgnoredColumns).toMatchDreamModels([model])
      expect(Object.keys(reloaded.modelsWithIgnoredColumns[0]!.getAttributes())).not.toContain(
        'deprecatedColumn'
      )
    })

    it('loads successfully onto an existing instance', async () => {
      const loaded = await user.load('modelsWithIgnoredColumns').execute()
      expect(loaded.modelsWithIgnoredColumns).toMatchDreamModels([model])
    })

    it('left-join-preloads successfully, since the ignored column is omitted from the enumerated select list', async () => {
      const reloaded = await User.query().leftJoinPreload('modelsWithIgnoredColumns').firstOrFail()
      expect(reloaded.modelsWithIgnoredColumns).toMatchDreamModels([model])
      expect(Object.keys(reloaded.modelsWithIgnoredColumns[0]!.getAttributes())).not.toContain(
        'deprecatedColumn'
      )
    })
  })

  it.skip('type test', async () => {
    // @ts-expect-error the ignored column is omitted from generated types, so create may not set it
    await ModelWithIgnoredColumns.create({ deprecatedColumn: 'nope' })

    const model = ModelWithIgnoredColumns.new()
    // @ts-expect-error the ignored column is omitted from generated types, so it cannot be read
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    model.deprecatedColumn

    // @ts-expect-error the ignored column is omitted from generated types, so it cannot be queried by
    await ModelWithIgnoredColumns.where({ deprecatedColumn: 'nope' }).all()
  })
})
