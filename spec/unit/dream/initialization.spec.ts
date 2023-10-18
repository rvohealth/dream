import { DateTime } from 'luxon'
import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import CannotPassNullOrUndefinedToRequiredBelongsTo from '../../../src/exceptions/associations/cannot-pass-null-or-undefined-to-required-belongs-to'

describe('Dream initialization', () => {
  it('sets attributes', () => {
    const user = User.new({ email: 'fred' })
    expect(user.email).toEqual('fred')
    expect(user.attributes().email).toEqual('fred')
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
          expect(() => Mylar.new({ user: null })).toThrowError(CannotPassNullOrUndefinedToRequiredBelongsTo)
        })
      })
    })

    context('undefined is passed', () => {
      context('the relationship is optional', () => {
        it('allows undefined to be set', () => {
          const pet = Pet.new({ user: undefined })
          expect(pet.user).toBeUndefined()
        })
      })

      context('the relationship is required', () => {
        it('throws a targeted exception', () => {
          expect(() => Mylar.new({ user: undefined })).toThrowError(
            CannotPassNullOrUndefinedToRequiredBelongsTo
          )
        })
      })
    })
  })

  context('an object is marshaled as a javascript date by kysely', () => {
    it('converts the date to a luxon date', async () => {
      const user = await User.create({ email: 'fred@', password: 'howyadoin' })
      const u = await User.find(user.id)
      expect(u!.createdAt.constructor).toEqual(DateTime)
    })
  })
})
