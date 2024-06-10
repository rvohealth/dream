import { describe as context } from '@jest/globals'
import { Dream } from '../../../src'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import Pet from '../../../test-app/app/models/Pet'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Dream#paramSafeColumnsOrFallback', () => {
  const subject = (model: typeof Dream) => model.paramSafeColumnsOrFallback()

  it('includes fields that are safe for updating', () => {
    expect(subject(User)).toEqual(
      expect.arrayContaining([
        'uuid',
        'name',
        'birthdate',
        'socialSecurityNumber',
        'favoriteNumbers',
        'featuredPostPosition',
        'targetRating',
        'password',
      ])
    )
  })

  it('omits primary key', () => {
    expect(subject(User)).not.toEqual(expect.arrayContaining(['id']))
  })

  it('omits internal datetime columns', () => {
    expect(subject(Pet)).not.toEqual(expect.arrayContaining(['createdAt']))
    expect(subject(Pet)).not.toEqual(expect.arrayContaining(['updatedAt']))
    expect(subject(Pet)).not.toEqual(expect.arrayContaining(['deletedAt']))
  })

  it('omits association foreign keys', () => {
    expect(subject(Pet)).not.toEqual(expect.arrayContaining(['userId']))
  })

  it('omits type field for STI models', () => {
    expect(subject(Latex)).not.toEqual(expect.arrayContaining(['type']))
  })

  it('omits type field for polymorphic associations', () => {
    expect(subject(Rating)).not.toEqual(expect.arrayContaining(['rateableType']))
  })

  context('#paramSafeColumns is defined on the model', () => {
    class User2 extends User {
      public get paramSafeColumns() {
        return ['email'] as const
      }
    }

    it('returns the overridden list', () => {
      expect(subject(User2)).toEqual(['email'])
    })

    context('when paramSafeColumns contains unsafe column names', () => {
      class User3 extends User {
        public get paramSafeColumns() {
          return ['id', 'email', 'birthdate', 'createdAt', 'updatedAt'] as const
        }
      }

      it('excludes disallowed columns', () => {
        expect(subject(User3)).toEqual(['email', 'birthdate'])
      })
    })
  })
})
