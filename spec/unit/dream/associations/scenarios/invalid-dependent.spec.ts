import { Decorators, DreamConst } from '../../../../../src'
import { Type } from '../../../../../src/dream/types'
import CannotDefineAssociationWithBothDependentAndPassthrough from '../../../../../src/errors/CannotDefineAssociationWithBothDependentAndPassthrough'
import CannotDefineAssociationWithBothDependentAndRequiredOnClause from '../../../../../src/errors/CannotDefineAssociationWithBothDependentAndRequiredOnClause'
import Post from '../../../../../test-app/app/models/Post'
import User from '../../../../../test-app/app/models/User'
import processDynamicallyDefinedModels from '../../../../helpers/processDynamicallyDefinedModels'

describe('Invalid dependent set within HasOne/HasMany associations', () => {
  context('HasMany', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        const Deco = new Decorators<Type<typeof User2>>()
        class User2 extends User {
          @Deco.HasMany('Post', {
            dependent: 'destroy',
            on: { body: DreamConst.passthrough },
          })
          public testAssociation: Post
        }

        expect(() => {
          processDynamicallyDefinedModels(User2)
        }).toThrow(CannotDefineAssociationWithBothDependentAndPassthrough)
      })
    })

    context('dependent AND DreamConst.required both set', () => {
      it('throws a targeted exception', () => {
        const Deco = new Decorators<Type<typeof User2>>()
        class User2 extends User {
          @Deco.HasMany('Post', {
            dependent: 'destroy',
            on: { body: DreamConst.required },
          })
          public testAssociation: Post
        }

        expect(() => {
          processDynamicallyDefinedModels(User2)
        }).toThrow(CannotDefineAssociationWithBothDependentAndRequiredOnClause)
      })
    })
  })

  context('HasOne', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        const Deco = new Decorators<Type<typeof User2>>()
        class User2 extends User {
          @Deco.HasOne('Post', {
            dependent: 'destroy',
            on: { body: DreamConst.passthrough },
          })
          public testAssociation: Post
        }

        expect(() => {
          processDynamicallyDefinedModels(User2)
        }).toThrow(CannotDefineAssociationWithBothDependentAndPassthrough)
      })
    })

    context('dependent AND DreamConst.required both set', () => {
      it('throws a targeted exception', () => {
        const Deco = new Decorators<Type<typeof User2>>()
        class User2 extends User {
          @Deco.HasOne('Post', {
            dependent: 'destroy',
            on: { body: DreamConst.required },
          })
          public testAssociation: Post
        }

        expect(() => {
          processDynamicallyDefinedModels(User2)
        }).toThrow(CannotDefineAssociationWithBothDependentAndRequiredOnClause)
      })
    })
  })
})
