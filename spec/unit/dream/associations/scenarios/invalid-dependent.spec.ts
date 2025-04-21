import CannotDefineAssociationWithBothDependentAndPassthrough from '../../../../../src/errors/CannotDefineAssociationWithBothDependentAndPassthrough.js'
import CannotDefineAssociationWithBothDependentAndRequiredAndClause from '../../../../../src/errors/CannotDefineAssociationWithBothDependentAndRequiredAndClause.js'
import { Decorators, DreamConst } from '../../../../../src/index.js'
import Post from '../../../../../test-app/app/models/Post.js'
import User from '../../../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../../../helpers/processDynamicallyDefinedModels.js'

describe('Invalid dependent set within HasOne/HasMany associations', () => {
  context('HasMany', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        const deco = new Decorators<typeof User2>()
        class User2 extends User {
          @deco.HasMany('Post', {
            dependent: 'destroy',
            and: { body: DreamConst.passthrough },
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
        const deco = new Decorators<typeof User2>()
        class User2 extends User {
          @deco.HasMany('Post', {
            dependent: 'destroy',
            and: { body: DreamConst.required },
          })
          public testAssociation: Post
        }

        expect(() => {
          processDynamicallyDefinedModels(User2)
        }).toThrow(CannotDefineAssociationWithBothDependentAndRequiredAndClause)
      })
    })
  })

  context('HasOne', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        const deco = new Decorators<typeof User2>()
        class User2 extends User {
          @deco.HasOne('Post', {
            dependent: 'destroy',
            and: { body: DreamConst.passthrough },
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
        const deco = new Decorators<typeof User2>()
        class User2 extends User {
          @deco.HasOne('Post', {
            dependent: 'destroy',
            and: { body: DreamConst.required },
          })
          public testAssociation: Post
        }

        expect(() => {
          processDynamicallyDefinedModels(User2)
        }).toThrow(CannotDefineAssociationWithBothDependentAndRequiredAndClause)
      })
    })
  })
})
