import CannotDefineAssociationWithBothDependentAndPassthrough from '../../../../../src/errors/CannotDefineAssociationWithBothDependentAndPassthrough.js'
import CannotDefineAssociationWithBothDependentAndRequiredOnClause from '../../../../../src/errors/CannotDefineAssociationWithBothDependentAndRequiredOnClause.js'
import { Decorators, DreamConst } from '../../../../../src/index.js'
import Post from '../../../../../test-app/app/models/Post.js'
import User from '../../../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../../../helpers/processDynamicallyDefinedModels.js'

describe('Invalid dependent set within HasOne/HasMany associations', () => {
  context('HasMany', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        const deco = new Decorators<InstanceType<typeof User2>>()
        class User2 extends User {
          @deco.HasMany('Post', {
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
        const deco = new Decorators<InstanceType<typeof User2>>()
        class User2 extends User {
          @deco.HasMany('Post', {
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
        const deco = new Decorators<InstanceType<typeof User2>>()
        class User2 extends User {
          @deco.HasOne('Post', {
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
        const deco = new Decorators<InstanceType<typeof User2>>()
        class User2 extends User {
          @deco.HasOne('Post', {
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
