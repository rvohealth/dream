import ops from '../../../src/ops/index.js'
import { type TableColumnIsArray } from '../../../src/types/dream.js'
import CalendarDate from '../../../src/utils/datetime/CalendarDate.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import ModelForOpenapiTypeSpecs from '../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import User from '../../../test-app/app/models/User.js'

describe('ops.equal', () => {
  context('against an array column', () => {
    // `where({ tags: [...] })` (a bare array) means `IN` for scalar columns, so
    // exact array equality has to be opted into with ops.equal, which binds the
    // whole array as a single parameter (`"col" = $1`) rather than as a
    // Postgres value list (`"col" = ($1, $2)`).
    let model: ModelForOpenapiTypeSpecs

    beforeEach(async () => {
      model = await ModelForOpenapiTypeSpecs.create({
        passwordDigest: 'abcd',
        name: 'Charlie',
        nicknames: ['Chuck', 'Luce'],
        email: 'a@b.com',
        favoriteTexts: ['Hello_1', 'world_1'],
        favoriteCitexts: ['Hello_1'],
        favoriteIntegers: [1, 2, 3],
        favoriteBigints: ['77777777777777777'],
        favoriteNumerics: [1.3, 7],
        favoriteBooleans: [true, false],
        favoriteUuids: ['8773f04c-affc-4389-9fb5-121679949589'],
        favoriteDates: [CalendarDate.fromISO('1987-07-22')],
        favoriteDatetimes: [DateTime.fromISO('1987-07-22T10:11:12Z')],
        favoriteJsonbs: [{ hello_2: 'world_2' }],
        favoriteTreats: ['efishy feesh'],
      })
    })

    it('matches an exactly-equal array', async () => {
      const results = await ModelForOpenapiTypeSpecs.where({
        favoriteTexts: ops.equal(['Hello_1', 'world_1']),
      }).all()
      expect(results).toMatchDreamModels([model])
    })

    it('does not match when the elements are the same but the order differs', async () => {
      const results = await ModelForOpenapiTypeSpecs.where({
        favoriteTexts: ops.equal(['world_1', 'Hello_1']),
      }).all()
      expect(results).toEqual([])
    })

    it('does not match a subset of the array', async () => {
      const results = await ModelForOpenapiTypeSpecs.where({
        favoriteTexts: ops.equal(['Hello_1']),
      }).all()
      expect(results).toEqual([])
    })

    it('matches an empty array against a column holding an empty array', async () => {
      const emptyModel = await ModelForOpenapiTypeSpecs.create({
        passwordDigest: 'abcd',
        name: 'Empty',
        nicknames: [],
        email: 'empty@b.com',
        favoriteTexts: [],
      })

      const results = await ModelForOpenapiTypeSpecs.where({
        name: 'Empty',
        favoriteTexts: ops.equal([]),
      }).all()
      expect(results).toMatchDreamModels([emptyModel])
    })

    it('supports the coercion-heavy array column types', async () => {
      expect(
        await ModelForOpenapiTypeSpecs.where({ favoriteCitexts: ops.equal(['Hello_1']) }).all()
      ).toMatchDreamModels([model])
      expect(
        await ModelForOpenapiTypeSpecs.where({ favoriteIntegers: ops.equal([1, 2, 3]) }).all()
      ).toMatchDreamModels([model])
      expect(
        await ModelForOpenapiTypeSpecs.where({ favoriteBigints: ops.equal(['77777777777777777']) }).all()
      ).toMatchDreamModels([model])
      expect(
        await ModelForOpenapiTypeSpecs.where({ favoriteNumerics: ops.equal([1.3, 7]) }).all()
      ).toMatchDreamModels([model])
      expect(
        await ModelForOpenapiTypeSpecs.where({ favoriteBooleans: ops.equal([true, false]) }).all()
      ).toMatchDreamModels([model])
      expect(
        await ModelForOpenapiTypeSpecs.where({
          favoriteUuids: ops.equal(['8773f04c-affc-4389-9fb5-121679949589']),
        }).all()
      ).toMatchDreamModels([model])
      expect(
        await ModelForOpenapiTypeSpecs.where({
          favoriteDates: ops.equal([CalendarDate.fromISO('1987-07-22')]),
        }).all()
      ).toMatchDreamModels([model])
      expect(
        await ModelForOpenapiTypeSpecs.where({
          favoriteDatetimes: ops.equal([DateTime.fromISO('1987-07-22T10:11:12Z')]),
        }).all()
      ).toMatchDreamModels([model])
      expect(
        await ModelForOpenapiTypeSpecs.where({ favoriteJsonbs: ops.equal([{ hello_2: 'world_2' }]) }).all()
      ).toMatchDreamModels([model])
    })

    context('an enum array column', () => {
      it('matches an exactly-equal array', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
        const redGreen = await Mylar.create({ user, multicolor: ['red', 'green'] })
        await Mylar.create({ user, multicolor: ['green', 'red'] })
        await Mylar.create({ user, multicolor: ['green'] })

        const balloons = await Balloon.where({ multicolor: ops.equal(['red', 'green']) }).all()
        expect(balloons).toMatchDreamModels([redGreen])
      })
    })

    // A bare array means `IN`, which is only meaningful against a scalar
    // column: against an array column PostgreSQL is handed a value list where
    // it expects an array literal. This is a compile error (see the `types`
    // context below), so the cast stands in for the callers the types cannot
    // reach — Javascript consumers, `DreamConst.passthrough` values, and
    // values reconstructed from JSON.
    it('does not accept a bare array as exact array equality', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      await Mylar.create({ user, multicolor: ['red', 'green'] })

      await expect(Balloon.where({ multicolor: ['red', 'green'] as any }).all()).rejects.toThrow(
        /malformed array literal/
      )
    })
  })

  context('against a scalar column', () => {
    it('still uses an "=" comparison', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const redBalloon = await Mylar.create({ user, color: 'red' })
      await Mylar.create({ user, color: 'blue' })

      const balloons = await Balloon.where({ color: ops.equal('red') }).all()
      expect(balloons).toMatchDreamModels([redBalloon])
    })

    it('leaves a bare array meaning "IN"', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const redBalloon = await Mylar.create({ user, color: 'red' })
      const blueBalloon = await Mylar.create({ user, color: 'blue' })
      await Mylar.create({ user, color: 'green' })

      const balloons = await Balloon.where({ color: ['red', 'blue'] }).all()
      expect(balloons).toMatchDreamModels([redBalloon, blueBalloon])
    })
  })

  context('ops.not.equal against an array column', () => {
    it('excludes the exactly-equal array', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      await Mylar.create({ user, multicolor: ['red', 'green'] })
      const green = await Mylar.create({ user, multicolor: ['green'] })

      const balloons = await Balloon.where({ multicolor: ops.not.equal(['red', 'green']) }).all()
      expect(balloons).toMatchDreamModels([green])
    })
  })

  // Type-level coverage. These do not assert at runtime; they fail the build
  // (`pnpm build:test-app`) if the accepted types regress.
  context('types', () => {
    it('accepts an array against an array column and rejects mismatched shapes', () => {
      ModelForOpenapiTypeSpecs.where({ favoriteTexts: ops.equal(['a', 'b']) })
      ModelForOpenapiTypeSpecs.where({ favoriteIntegers: ops.equal([1, 2]) })
      ModelForOpenapiTypeSpecs.where({ favoriteDates: ops.equal([CalendarDate.fromISO('1987-07-22')]) })
      Balloon.where({ multicolor: ops.equal(['red', 'green']) })

      // an enum array column only accepts members of its own enum
      // @ts-expect-error 'chartreuse' is not a BalloonColorsEnum
      Balloon.where({ multicolor: ops.equal(['red', 'chartreuse']) })

      // a bare scalar against an array column is still rejected
      // @ts-expect-error 'a' is not a string[]
      ModelForOpenapiTypeSpecs.where({ favoriteTexts: ops.equal('a') })

      // a wrong element type against an array column is still rejected
      // @ts-expect-error number[] is not a string[]
      ModelForOpenapiTypeSpecs.where({ favoriteTexts: ops.equal([1, 2]) })

      // a whole-array value is only bound as a single array parameter under
      // the equality operators; under any other operator it would render as a
      // SQL value list (`"favorite_texts" @> ($1, $2)`) and raise at the
      // database, so it stays a compile error
      // @ts-expect-error an array value is only supported for =, != and <>
      ModelForOpenapiTypeSpecs.where({ favoriteTexts: ops.expression('@>', ['a', 'b']) })
      ModelForOpenapiTypeSpecs.where({ favoriteTexts: ops.not.equal(['a', 'b']) })
      ModelForOpenapiTypeSpecs.where({ favoriteTexts: null })

      // Deliberate narrowing, documented in CHANGELOG 2.22.0: an enum array
      // column compares against whole arrays, not against a single element.
      // Each of these compiled before 2.22.0 (an enum array column reached the
      // scalar-enum branch of the type) but emitted a comparison PostgreSQL
      // rejects for an array column, so none of them ever ran. `ops.any` is
      // the element-containment form.
      // @ts-expect-error use ops.any('red') to test containment of an element
      Balloon.where({ multicolor: ops.equal('red') })
      // @ts-expect-error use whereNot({ multicolor: ops.any('red') })
      Balloon.where({ multicolor: ops.not.equal('red') })
      // @ts-expect-error an enum array column has no element-wise IN
      Balloon.where({ multicolor: ops.in(['red', 'green']) })
      // @ts-expect-error an enum array column has no element-wise NOT IN
      Balloon.where({ multicolor: ops.not.in(['red', 'green']) })
      // @ts-expect-error an enum array column has no element-wise ordering
      Balloon.where({ multicolor: ops.greaterThan('red') })

      // unchanged: scalar columns, bare arrays, and ops.any
      Balloon.where({ color: ops.equal('red') })
      Balloon.where({ color: 'red' })
      Balloon.where({ multicolor: ops.any('green') })
      Balloon.whereNot({ multicolor: ops.any('green') })
      User.where({ email: ops.equal('a@b.com') })
      User.where({ email: ['a@b.com', 'c@d.com'] })

      // NOTE: `Balloon.where({ multicolor: ['red', 'green'] })` deliberately
      // does NOT appear in the list above. It compiles — `Whereable` accepts a
      // column's own `Selectable` type, which for an array column is an array
      // — but it raises `malformed array literal` at the database, because a
      // bare array means `IN`. The runtime spec
      // 'does not accept a bare array as exact array equality' pins that;
      // asserting it here would bless a form that always fails.

      expect(true).toBe(true)
    })

    // `TableColumnIsArray` documents itself as resolving to `false` for
    // anything that is not an array column. When it resolved to `never`
    // instead, the `never` propagated into the array-ness branches of
    // `OpsValType`/`PartialTypes` (which are keyed off naked type parameters,
    // so they distribute) and collapsed them to `never`, erasing every `ops`
    // and `Range` form from the column in `where()`. Every synced schema emits
    // `isArray` on every column, so only a hand-edited or stale schema reaches
    // this — but it must degrade to the scalar branch, not to nothing.
    it('resolves a column whose schema entry omits isArray to false rather than never', () => {
      type SchemaWithoutIsArray = { users: { columns: { name: { dbType: 'text' } } } }
      type IsArray = TableColumnIsArray<SchemaWithoutIsArray, 'users', 'name'>

      // NOTE: the `[IsArray] extends [never]` arm has to come first and has to
      // be spelled this way. `[never] extends [false]` is `true` (never is
      // assignable to everything), so a bare `[IsArray] extends [false]` check
      // would be satisfied by the very `never` this pins against.
      const resolvesToFalse: [IsArray] extends [never] ? false : [IsArray] extends [false] ? true : false =
        true
      expect(resolvesToFalse).toBe(true)
    })
  })
})
