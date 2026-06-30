import { DreamParamSafeAttributes, DreamParamUnsafeColumnNames } from '../../../src/types/dream.js'
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
    type IsAny<T> = 0 extends 1 & T ? true : false
    type ExpectFalse<T extends false> = T

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

    it.skip('preserves concrete types for virtual and encrypted param-safe attributes', () => {
      type UserParamSafeAttributes = DreamParamSafeAttributes<User>
      type PasswordIsNotAny = ExpectFalse<IsAny<UserParamSafeAttributes['password']>>
      type SecretIsNotAny = ExpectFalse<IsAny<UserParamSafeAttributes['secret']>>
      type OtherSecretIsNotAny = ExpectFalse<IsAny<UserParamSafeAttributes['otherSecret']>>

      const password: string | undefined = null as unknown as UserParamSafeAttributes['password']
      const secret: string | null = null as unknown as UserParamSafeAttributes['secret']
      const otherSecret: { token: string } | null = null as unknown as UserParamSafeAttributes['otherSecret']

      // @ts-expect-error virtual params are not `any`
      const invalidPassword: number = null as unknown as UserParamSafeAttributes['password']
      // @ts-expect-error encrypted params are not `any`
      const invalidSecret: number = null as unknown as UserParamSafeAttributes['secret']
      // @ts-expect-error encrypted params with explicit value types are not `any`
      const invalidOtherSecret: number = null as unknown as UserParamSafeAttributes['otherSecret']

      void (null as unknown as PasswordIsNotAny)
      void (null as unknown as SecretIsNotAny)
      void (null as unknown as OtherSecretIsNotAny)
      void password
      void secret
      void otherSecret
      void invalidPassword
      void invalidSecret
      void invalidOtherSecret
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

  it('omits association foreign keys inherited from an STI base class', () => {
    expect(StiB.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['petId']))
  })

  it('omits type field for STI models', () => {
    expect(Latex.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['type']))
  })

  it('omits type field for STI base models', () => {
    expect(Balloon.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['type']))
  })

  it('omits type field for polymorphic associations', () => {
    expect(Rating.paramSafeColumnsOrFallback()).not.toEqual(expect.arrayContaining(['rateableType']))
  })

  it('omits polymorphic association foreign keys inherited from an STI base class', () => {
    const results = StiA.paramSafeColumnsOrFallback()
    expect(results).not.toEqual(expect.arrayContaining(['taskableId']))
    expect(results).not.toEqual(expect.arrayContaining(['taskableType']))
  })

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
