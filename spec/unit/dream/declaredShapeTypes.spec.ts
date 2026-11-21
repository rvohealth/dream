import { Updateable } from 'kysely'
import db from '../../../src/db/index.js'
import { DreamColumn } from '../../../src/types/dream.js'
import CalendarDate from '../../../src/utils/datetime/CalendarDate.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'
import Composition from '../../../test-app/app/models/Composition.js'
import User from '../../../test-app/app/models/User.js'
import { Compositions } from '../../../test-app/types/db.js'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Expect<T extends true> = T

type Metadata = DreamColumn<Composition, 'metadata'>
type Metadata3 = DreamColumn<Composition, 'metadata3'>
type Metadata3Item = NonNullable<Metadata3>[number]
type Metadata3WriteItem = NonNullable<Updateable<Compositions>['metadata3']>[number]
type OtherSecret = DreamColumn<User, 'otherSecret'>

// The specs marked it.skip are compiled by build:test-app, but not run: each
// line marked as an expected error fails the build if it compiles.
describe('types generated from declared shapes', () => {
  context('a @deco.JSON column', () => {
    it.skip('is read as its declared shape, an object that takes other keys too', () => {
      type _metadata = Expect<
        Equal<Metadata, { version?: number; contributors?: string[]; [key: string]: unknown }>
      >

      const metadata: Metadata = { version: 1, notDeclared: true }
      void metadata
      void (null as unknown as _metadata)
    })

    it.skip('refuses a value that does not match the shape on create, update, new and where', async () => {
      const user = User.new()
      const composition = Composition.new()

      await Composition.create({ user, metadata: { version: 1, contributors: ['Ann'], notDeclared: 1 } })
      // @ts-expect-error version is an integer
      await Composition.create({ user, metadata: { version: 'one' } })
      // @ts-expect-error contributors are strings
      await composition.update({ metadata: { contributors: [1] } })
      // @ts-expect-error version is an integer
      Composition.new({ metadata: { version: 'one' } })

      await Composition.where({ metadata: { version: 1 } }).all()
      // @ts-expect-error version is an integer
      await Composition.where({ metadata: { version: 'one' } }).all()
    })

    it.skip('types a raw Kysely query of the column', async () => {
      const kysely = db<Composition>('default', 'primary')

      await kysely
        .updateTable('compositions')
        .set({ metadata: { version: 1 } })
        .execute()
      await kysely
        .updateTable('compositions')
        // @ts-expect-error version is an integer
        .set({ metadata: { version: 'one' } })
        .execute()
      await kysely
        .insertInto('compositions')
        .values({
          userId: '1',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          // @ts-expect-error version is an integer
          metadata: { version: 'one' },
        })
        .execute()
      // JSON text is not the declared shape, so writing it takes a cast
      await kysely
        .updateTable('compositions')
        // @ts-expect-error JSON text is a string
        .set({ metadata: JSON.stringify({ version: 1 }) })
        .execute()

      const row = await kysely.selectFrom('compositions').select('metadata').executeTakeFirstOrThrow()
      type _row = Expect<Equal<typeof row.metadata, Metadata>>
      void row
      void (null as unknown as _row)
    })

    it.skip('types the readers that bypass the getter as the JSON text the attribute holds', () => {
      const composition = Composition.new()

      const raw = composition.getAttribute('metadata')
      type _getAttribute = Expect<Equal<typeof raw, string>>
      const attributes = composition.getAttributes()
      type _getAttributes = Expect<Equal<typeof attributes.metadata, string>>
      type _nullable = Expect<Equal<typeof attributes.metadata3, string | null>>
      const dirty = composition.dirtyAttributes()
      type _dirty = Expect<Equal<typeof dirty.metadata, string | undefined>>
      const changed = composition.changedAttributes()
      type _changed = Expect<Equal<typeof changed.metadata, string | undefined>>
      const previous = composition.previousValueForAttribute('metadata')
      type _previous = Expect<Equal<typeof previous, string>>

      void [raw, attributes, dirty, changed, previous]
      void (null as unknown as [_getAttribute, _getAttributes, _nullable, _dirty, _changed, _previous])
    })
  })

  context('a nullable @deco.JSON column whose shape is an array of closed objects with dates', () => {
    it.skip('is read as an array of the shape or null, its dates as strings', () => {
      type _metadata3 = Expect<
        Equal<
          Metadata3,
          | {
              status: 'draft' | 'published'
              publishedOn?: string
              reviewedOn?: string
              reviewedAt?: string
            }[]
          | null
        >
      >
      void (null as unknown as _metadata3)
    })

    it.skip('takes a CalendarDate for a date and a DateTime for a date-time when written', async () => {
      const user = User.new()

      await Composition.create({
        user,
        metadata3: [
          {
            status: 'draft',
            publishedOn: CalendarDate.today(),
            reviewedOn: '2026-01-01',
            reviewedAt: DateTime.now(),
          },
        ],
      })
      // @ts-expect-error a date takes a CalendarDate, not a DateTime
      await Composition.create({ user, metadata3: [{ status: 'draft', publishedOn: DateTime.now() }] })
      // @ts-expect-error status is one of its enum values
      await Composition.create({ user, metadata3: [{ status: 'archived' }] })
      // @ts-expect-error the object takes no key it does not declare
      await Composition.create({ user, metadata3: [{ status: 'draft', notDeclared: 1 }] })
      // @ts-expect-error an object of the shape, not the shape itself
      await Composition.create({ user, metadata3: { status: 'draft' } })
      await Composition.create({ user, metadata3: null })
    })

    it.skip("types a date declared as { type: 'date' } as it types one declared as 'date'", () => {
      type _read = Expect<Equal<Metadata3Item['reviewedOn'], Metadata3Item['publishedOn']>>
      type _write = Expect<Equal<Metadata3WriteItem['reviewedOn'], Metadata3WriteItem['publishedOn']>>
      type _writeTakesCalendarDate = Expect<
        Equal<Metadata3WriteItem['publishedOn'], string | CalendarDate | undefined>
      >
      void (null as unknown as [_read, _write, _writeTakesCalendarDate])
    })

    it('leaves a raw Kysely write of an array to the driver, which sends it as a Postgres array the column refuses', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({
        user,
        metadata3: [{ status: 'draft', publishedOn: CalendarDate.fromISO('2026-11-20') }],
      })
      expect((await Composition.findOrFail(composition.id)).metadata3).toEqual([
        { status: 'draft', publishedOn: '2026-11-20' },
      ])

      // the write type is the declared shape, as it is for create and update,
      // so this compiles; node-postgres sends a JavaScript array as a
      // Postgres array literal, which a json/jsonb column does not take
      await expect(
        db<Composition>('default', 'primary')
          .updateTable('compositions')
          .set({ metadata3: [{ status: 'published' }] })
          .where('id', '=', composition.id)
          .execute()
      ).rejects.toThrow(/invalid input syntax for type json/)

      // JSON text is stored as the value it encodes, but takes a cast
      await db<Composition>('default', 'primary')
        .updateTable('compositions')
        .set({ metadata3: JSON.stringify([{ status: 'published' }]) as any })
        .where('id', '=', composition.id)
        .execute()
      expect((await Composition.findOrFail(composition.id)).metadata3).toEqual([{ status: 'published' }])
    })
  })

  context('a @deco.Encrypted property', () => {
    it.skip('is read as its declared shape, with null when its backing column allows null', () => {
      type _otherSecret = Expect<
        Equal<OtherSecret, { token: string; issuedOn?: string; [key: string]: unknown } | null>
      >
      type _secret = Expect<Equal<DreamColumn<User, 'secret'>, string | null>>
      type _field = Expect<Equal<User['otherSecret'], OtherSecret>>
      void (null as unknown as [_otherSecret, _secret, _field])
    })

    it.skip('refuses a value that does not match the shape on create, update and new', async () => {
      const user = User.new()

      await User.create({
        email: 'a@b.com',
        password: 'x',
        otherSecret: { token: 'shh', issuedOn: CalendarDate.today() },
      })
      await User.create({ email: 'a@b.com', password: 'x', secret: 'shh', otherSecret: null })
      // @ts-expect-error token is a string
      await User.create({ email: 'a@b.com', password: 'x', otherSecret: { token: 1 } })
      // @ts-expect-error token is required
      await user.update({ otherSecret: { issuedOn: '2026-11-20' } })
      // @ts-expect-error a date takes a CalendarDate, not a DateTime
      await user.update({ otherSecret: { token: 'shh', issuedOn: DateTime.now() } })
      // @ts-expect-error secret is a string
      User.new({ secret: 1 })
    })
  })
})
