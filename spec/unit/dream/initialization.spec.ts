import { DateTime } from 'luxon'
import CannotPassNullOrUndefinedToRequiredBelongsTo from '../../../src/exceptions/associations/cannot-pass-null-or-undefined-to-required-belongs-to'
import CalendarDate from '../../../src/helpers/CalendarDate'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Composition from '../../../test-app/app/models/Composition'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Dream initialization', () => {
  it('sets attributes', () => {
    const user = User.new({ email: 'fred' })
    expect(user.email).toEqual('fred')
    expect(user.getAttributes().email).toEqual('fred')
  })

  context('a dream is passed as an attribute', () => {
    it('allows passing of dream', () => {
      const user = User.new({ email: 'fred' })
      const pet = Pet.new({ user })
      expect(pet.user).toMatchDreamModel(user)
    })

    context('null is passed', () => {
      context('the relationship is optional', () => {
        it('allows null to be set', () => {
          const pet = Pet.new({ user: null })
          expect(pet.user).toBeNull()
        })
      })

      context('the relationship is required', () => {
        it('throws a targeted exception', () => {
          expect(() => Mylar.new({ user: null })).toThrow(CannotPassNullOrUndefinedToRequiredBelongsTo)
        })
      })
    })

    context('undefined is passed', () => {
      context('the relationship is optional', () => {
        it('allows undefined to be set', () => {
          expect(() => Pet.new({ user: undefined })).not.toThrow()
        })
      })

      context('the relationship is required', () => {
        it('throws a targeted exception', () => {
          expect(() => Mylar.new({ user: undefined })).toThrow(CannotPassNullOrUndefinedToRequiredBelongsTo)
        })
      })
    })
  })

  context('a string is passed into a datetime field', () => {
    it('converts the datetime string to a DateTime', () => {
      const nowString = DateTime.now().toISO()
      const user = User.new({ deletedAt: nowString as any })
      expect(user.deletedAt).toEqualDateTime(DateTime.fromISO(nowString))
    })
  })

  context('a DateTime in a non-UTC timezone, passed into a datetime field', () => {
    it('is converted to UTC', () => {
      const dateString = DateTime.fromISO('2024-09-05T10:42:16.603-04:00')
      const user = User.new({ deletedAt: dateString as any })
      expect(user.deletedAt?.toISO()).toEqual('2024-09-05T14:42:16.603Z')
    })
  })

  context('a string is passed into a date field', () => {
    it('converts the date string to a CalendarDate', () => {
      const user = User.new({ birthdate: '2000-10-10' as any })
      expect(user.birthdate).toEqualCalendarDate(CalendarDate.fromISO('2000-10-10'))
    })
  })

  context('a datetime string in non UTC is passed into a date field', () => {
    it('is converted to a CalendarDate with the date matching the original timezone date', () => {
      const dateString = '2024-09-05T22:42:16.603-04:00'
      const user = User.new({ birthdate: dateString as any })
      expect(user.birthdate).toEqualCalendarDate(CalendarDate.fromISO('2024-09-05'))
    })
  })

  context('an object is passed to a jsonb field', () => {
    it('converts the object to a string for insertion, but exposes it as an object when fetched', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const metadata = { version: 1 }
      const composition = Composition.new({ content: 'howyadoin', metadata, user })
      expect(composition.metadata).toEqual({ version: 1 })

      await composition.save()
      expect(composition.metadata).toEqual({ version: 1 })

      expect(composition.getAttributes().metadata).toEqual(JSON.stringify({ version: 1 }))
    })
  })

  context('an object is marshaled as a javascript date by kysely', () => {
    it('converts the date to a DateTime', async () => {
      const user = await User.create({ email: 'fred@', password: 'howyadoin' })
      const u = await User.find(user.id)
      expect(u!.createdAt.constructor).toEqual(DateTime)
    })
  })
})
