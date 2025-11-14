import { DreamParamUnsafeColumnNames } from '../../../src/types/dream.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import LocalizedText from '../../../test-app/app/models/LocalizedText.js'
import ModelWithParamSafeAndUnsafeColumns from '../../../test-app/app/models/ModelWithParamSafeAndUnsafeColumns.js'
import ModelWithParamUnsafeColumns from '../../../test-app/app/models/ModelWithParamUnsafeColumns.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Rating from '../../../test-app/app/models/Rating.js'
import StiA from '../../../test-app/app/models/Sti/A.js'
import StiB from '../../../test-app/app/models/Sti/B.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#paramSafeColumnsOrFallback', () => {
  context('type tests', () => {
    // intentionally skipped, this should cause build:test-app
    // to fail unless the types are correctly lining up.
    it.skip('includes fields that are safe for updating', () => {
      switch (LocalizedText.paramSafeColumnsOrFallback()[0]!) {
        case 'body':
        case 'name':
        case 'locale':
        case 'title':
      }

      let unsafeParams: DreamParamUnsafeColumnNames<LocalizedText>
      switch (unsafeParams!) {
        case 'createdAt':
        case 'updatedAt':
        case 'deletedAt':
        case 'id':
        case 'localizable':
        case 'localizableId':
        case 'type':
        case 'localizableType':
      }
    })
  })

  it('includes fields that are safe for updating', () => {
    expect(User.paramSafeColumnsOrFallback()).toEqual(
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
    expect(User.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['id']))
  })

  it('omits internal datetime columns', () => {
    expect(Pet.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['createdAt']))
    expect(Pet.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['updatedAt']))
    expect(Pet.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['deletedAt']))
  })

  it('omits association foreign keys', () => {
    expect(Pet.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['userId']))
  })

  it(
    'omits association foreign keys defined on STI siblings ' +
      '(so that associations may be defined on STI children without opening up the ' +
      'column to being set directly from params when a different sibling is specified ' +
      'in the OpenAPI decorator in Psychic)',
    () => {
      expect(StiB.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['petId']))
    }
  )

  it('omits type field for STI models', () => {
    expect(Latex.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['type']))
  })

  it('omits type field for STI base models', () => {
    expect(Balloon.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['type']))
  })

  it('omits type field for polymorphic associations', () => {
    expect(Rating.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['rateableType']))
  })

  it(
    'omits association foreign keys defined on STI siblings ' +
      '(so that associations may be defined on STI children without opening up the ' +
      'column to being set directly from params when a different sibling is specified ' +
      'in the OpenAPI decorator in Psychic)',
    () => {
      const results = StiA.paramSafeColumnsOrFallback()
      expect(results).not.toEqual(expect.arrayContaining(['taskableId']))
      expect(results).not.toEqual(expect.arrayContaining(['taskableType']))
    }
  )

  context('#paramSafeColumns is defined on the model', () => {
    class User2 extends User {
      public get paramSafeColumns() {
        return ['email'] as const
      }
    }

    it('returns the overridden list', () => {
      expect(User2.paramSafeColumnsOrFallback()).toEqual(['email'])
    })

    context('when paramSafeColumns contains unsafe column names', () => {
      class User3 extends User {
        public get paramSafeColumns() {
          return ['id', 'email', 'birthdate', 'createdAt', 'updatedAt'] as const
        }
      }

      it('excludes disallowed columns', () => {
        expect(User3.paramSafeColumnsOrFallback()).toEqual(['email', 'birthdate'])
      })
    })

    context(
      'and #paramUnsafeColumns is defined on the model (including for comprehensiveness; not recommended)',
      () => {
        it('excludes paramUnsafeColumns from the results allowed by paramSafeColumns', () => {
          expect(ModelWithParamSafeAndUnsafeColumns.paramSafeColumnsOrFallback()).toEqual([
            'allowedColumn1',
            'allowedColumn2',
          ])
        })
      }
    )
  })

  context('#paramUnsafeColumns is defined on the model', () => {
    it('excludes those columns in addition to the automatically excluded columns', () => {
      expect(ModelWithParamUnsafeColumns.paramSafeColumnsOrFallback()).toEqual([
        'allowedColumn1',
        'allowedColumn2',
      ])
    })
  })
})
