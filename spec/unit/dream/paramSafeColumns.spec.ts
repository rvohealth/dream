import { Dream } from '../../../src'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import Pet from '../../../test-app/app/models/Pet'
import Rating from '../../../test-app/app/models/Rating'
import User from '../../../test-app/app/models/User'

describe('Dream#paramSafeColumns', () => {
  const subject = (model: typeof Dream) => [...model.paramSafeColumns()]

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
      ])
    )
  })

  it('omits primary key', () => {
    expect(subject(User)).not.toEqual(expect.arrayContaining(['id']))
  })

  it('omits internal datetime columns', () => {
    expect(subject(Pet)).not.toEqual(expect.arrayContaining(['createdAt', 'updatedAt', 'deletedAt']))
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
})
