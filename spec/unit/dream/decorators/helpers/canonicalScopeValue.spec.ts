import canonicalScopeValue, {
  BOOLEAN_FALSE_LITERALS,
  BOOLEAN_TRUE_LITERALS,
  untypedScopeValue,
} from '../../../../../src/decorators/field/sortable/helpers/canonicalScopeValue.js'
import sortableScopeLockKey from '../../../../../src/decorators/field/sortable/helpers/sortableScopeLockKey.js'
import CalendarDate from '../../../../../src/utils/datetime/CalendarDate.js'
import Latex from '../../../../../test-app/app/models/Balloon/Latex.js'
import Collar from '../../../../../test-app/app/models/Collar.js'
import Composition from '../../../../../test-app/app/models/Composition.js'
import Pet from '../../../../../test-app/app/models/Pet.js'
import Post from '../../../../../test-app/app/models/Post.js'
import TextScopedSortableModel from '../../../../../test-app/app/models/TextScopedSortableModel.js'
import User from '../../../../../test-app/app/models/User.js'

/**
 * Every case here is the same shape: one physical database value, held in the
 * two JavaScript shapes the sortable paths actually hold it in — the *pending*
 * value a caller supplied to a save that has not been written yet, and the
 * value Postgres *hydrated* on a snapshot read, a post-INSERT read or resort's
 * table read. The two must canonicalize to one string, or the two writers take
 * two advisory locks and do not exclude each other.
 *
 * The hydrated side is always read back out of the database rather than
 * hand-written, so the spec is pinned to what the pg type parsers really
 * produce.
 */
describe('canonicalScopeValue', () => {
  context('a uuid column', () => {
    it('canonicalizes a pending upper-case UUID onto the hydrated lower-case form', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const pendingUuid = user.uuid.toUpperCase()
      const pet = await Pet.create({ name: 'aster', userUuid: pendingUuid })
      const hydrated = await Pet.findOrFail(pet.id)

      // Postgres renders uuid lower-case no matter which case it was written in
      expect(hydrated.userUuid).toEqual(pendingUuid.toLowerCase())
      expect(canonicalScopeValue(hydrated, 'userUuid', pendingUuid)).toEqual(
        canonicalScopeValue(hydrated, 'userUuid', hydrated.userUuid)
      )
    })

    it('derives one advisory lock key from the pending and the hydrated value', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const pendingUuid = user.uuid.toUpperCase()
      const pet = await Pet.create({ name: 'aster', userUuid: pendingUuid })
      const hydrated = await Pet.findOrFail(pet.id)

      expect(sortableScopeLockKey(hydrated, 'positionWithinSpecies', [['userUuid', pendingUuid]])).toEqual(
        sortableScopeLockKey(hydrated, 'positionWithinSpecies', [['userUuid', hydrated.userUuid]])
      )
    })
  })

  context('a numeric column', () => {
    it('canonicalizes a pending numeric string onto the hydrated parseFloat form', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const balloon = await Latex.create({ user, volume: 1 })
      const hydrated = await Latex.findOrFail(balloon.id)

      // parsePostgresDecimal hydrates numeric through parseFloat, so '1.00'
      // never arrives from the database — only from a pending write
      expect(hydrated.volume).toEqual(1)
      expect(canonicalScopeValue(hydrated, 'volume', '1.00')).toEqual(
        canonicalScopeValue(hydrated, 'volume', hydrated.volume)
      )
      expect(canonicalScopeValue(hydrated, 'volume', '1.00')).toEqual('1')
    })

    it('leaves a value that is not a number alone rather than hashing NaN', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const balloon = await Latex.create({ user, volume: 1 })
      const hydrated = await Latex.findOrFail(balloon.id)

      expect(canonicalScopeValue(hydrated, 'volume', 'not a number')).toEqual('not a number')
    })
  })

  context('a boolean column', () => {
    // The cases below are generated from the literal sets the implementation
    // itself matches on, so a literal added to or dropped from a set cannot
    // quietly go uncovered. The sets are in turn pinned to the input literals
    // Postgres documents, so a drop has to be a deliberate edit here too.
    it('holds every boolean input literal Postgres accepts, which is what a pending value can arrive as', () => {
      expect([...BOOLEAN_TRUE_LITERALS].sort()).toEqual(['1', 'on', 't', 'true', 'y', 'yes'])
      expect([...BOOLEAN_FALSE_LITERALS].sort()).toEqual(['0', 'f', 'false', 'n', 'no', 'off'])
    })

    it("canonicalizes Postgres's boolean input literals onto the hydrated boolean", async () => {
      const collar = await Collar.create({ pet: await Pet.create({ name: 'aster' }), lost: true })
      const hydrated = await Collar.findOrFail(collar.id)

      expect(hydrated.lost).toBe(true)

      for (const literal of BOOLEAN_TRUE_LITERALS) {
        // Postgres accepts these literals in any case and surrounded by
        // whitespace, so the pending side is folded the same way
        for (const pending of [literal, literal.toUpperCase(), ` ${literal} `]) {
          expect(canonicalScopeValue(hydrated, 'lost', pending)).toEqual(
            canonicalScopeValue(hydrated, 'lost', hydrated.lost)
          )
        }
      }

      for (const literal of BOOLEAN_FALSE_LITERALS) {
        for (const pending of [literal, literal.toUpperCase(), ` ${literal} `]) {
          expect(canonicalScopeValue(hydrated, 'lost', pending)).toEqual(
            canonicalScopeValue(hydrated, 'lost', false)
          )
        }
      }

      expect(canonicalScopeValue(hydrated, 'lost', true)).toEqual('true')
      expect(canonicalScopeValue(hydrated, 'lost', false)).toEqual('false')
    })
  })

  context('a jsonb column', () => {
    it('canonicalizes a pending object onto jsonb’s own key order', async () => {
      const composition = await Composition.create({
        user: await User.create({ email: 'fred@fred', password: 'howyadoin' }),
        metadata: { bb: 1, a: 2, ccc: 3 },
      })
      const hydrated = await Composition.findOrFail(composition.id)

      // jsonb orders object keys by length, then bytewise — never by insertion
      expect(JSON.stringify(hydrated.metadata)).toEqual('{"a":2,"bb":1,"ccc":3}')
      expect(canonicalScopeValue(hydrated, 'metadata', { ccc: 3, bb: 1, a: 2 })).toEqual(
        canonicalScopeValue(hydrated, 'metadata', hydrated.metadata)
      )
      expect(canonicalScopeValue(hydrated, 'metadata', { ccc: 3, bb: 1, a: 2 })).toEqual(
        '{"a":2,"bb":1,"ccc":3}'
      )
    })

    it('orders nested objects the same way', async () => {
      const composition = await Composition.create({
        user: await User.create({ email: 'fred@fred', password: 'howyadoin' }),
        metadata: { outer: { bb: 1, a: 2 } },
      })
      const hydrated = await Composition.findOrFail(composition.id)

      expect(canonicalScopeValue(hydrated, 'metadata', { outer: { bb: 1, a: 2 } })).toEqual(
        canonicalScopeValue(hydrated, 'metadata', hydrated.metadata)
      )
    })

    it('accepts a pending value still held as JSON text', async () => {
      const composition = await Composition.create({
        user: await User.create({ email: 'fred@fred', password: 'howyadoin' }),
        metadata: { bb: 1, a: 2 },
      })
      const hydrated = await Composition.findOrFail(composition.id)

      expect(canonicalScopeValue(hydrated, 'metadata', '{"bb":1,"a":2}')).toEqual(
        canonicalScopeValue(hydrated, 'metadata', hydrated.metadata)
      )
    })
  })

  context('a date column', () => {
    it('canonicalizes a pending ISO string onto the hydrated CalendarDate', async () => {
      const user = await User.create({
        email: 'fred@fred',
        password: 'howyadoin',
        birthdate: CalendarDate.fromISO('1987-06-05'),
      })
      const hydrated = await User.findOrFail(user.id)

      // the hydrated value is a CalendarDate, whose JSON form is quoted; a
      // pending ISO string is the same text unquoted
      expect(hydrated.birthdate!.toISO()).toEqual('1987-06-05')
      expect(canonicalScopeValue(hydrated, 'birthdate', '1987-06-05')).toEqual(
        canonicalScopeValue(hydrated, 'birthdate', hydrated.birthdate)
      )
      expect(canonicalScopeValue(hydrated, 'birthdate', '1987-06-05')).toEqual('"1987-06-05"')
    })
  })

  context('the column types real sort scopes are made of', () => {
    // These are the no-deploy-window guarantee: a bigint foreign key or a text
    // scope column keys exactly as it did before canonicalization existed, so
    // no already-correct key moves.
    it('leaves a bigint foreign key on the untyped normalization', async () => {
      const user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const post = await Post.create({ user, body: 'hello' })

      expect(canonicalScopeValue(post, 'userId', user.id)).toEqual(untypedScopeValue(user.id))
      expect(canonicalScopeValue(post, 'userId', user.id)).toEqual(user.id)
      expect(canonicalScopeValue(post, 'userId', 123)).toEqual('123')
      expect(canonicalScopeValue(post, 'userId', '123')).toEqual('123')
    })

    it('leaves a character varying scope column on the untyped normalization', async () => {
      const record = await TextScopedSortableModel.create({ scopeA: 'a:b', scopeB: 'c' })

      expect(canonicalScopeValue(record, 'scopeA', 'a:b')).toEqual(untypedScopeValue('a:b'))
      expect(canonicalScopeValue(record, 'scopeA', 'a:b')).toEqual('a:b')
      // an uppercase varchar is a different physical value and must stay a
      // different key — only uuid columns fold case
      expect(canonicalScopeValue(record, 'scopeA', 'A:B')).toEqual('A:B')
      expect(canonicalScopeValue(record, 'scopeA', null)).toBeNull()
      expect(canonicalScopeValue(record, 'scopeA', '')).toEqual('')
    })

    it('leaves an enum column on the untyped normalization', async () => {
      const pet = await Pet.create({ name: 'aster', species: 'cat' })

      expect(canonicalScopeValue(pet, 'species', 'cat')).toEqual('cat')
    })
  })

  context('an absent value', () => {
    it('is null for every column type, and distinct from the empty string', async () => {
      const pet = await Pet.create({ name: 'aster' })

      expect(canonicalScopeValue(pet, 'userUuid', null)).toBeNull()
      expect(canonicalScopeValue(pet, 'userUuid', undefined)).toBeNull()
      expect(canonicalScopeValue(pet, 'name', '')).toEqual('')
    })
  })
})
