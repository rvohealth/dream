import { DreamConst } from '../../../../../src'
import CannotDefineAssociationWithBothDependentAndPassthrough from '../../../../../src/errors/CannotDefineAssociationWithBothDependentAndPassthrough'
import CannotDefineAssociationWithBothDependentAndRequiredOnClause from '../../../../../src/errors/CannotDefineAssociationWithBothDependentAndRequiredOnClause'
import Post from '../../../../../test-app/app/models/Post'
import User from '../../../../../test-app/app/models/User'

describe('Invalid dependent set within HasOne/HasMany associations', () => {
  context('HasMany', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @User2.HasMany('Post', {
              dependent: 'destroy',
              on: { body: DreamConst.passthrough },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotDefineAssociationWithBothDependentAndPassthrough)
      })
    })

    context('dependent AND DreamConst.required both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @User2.HasMany('Post', {
              dependent: 'destroy',
              on: { body: DreamConst.required },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotDefineAssociationWithBothDependentAndRequiredOnClause)
      })
    })
  })

  context('HasOne', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @User2.HasOne('Post', {
              dependent: 'destroy',
              on: { body: DreamConst.passthrough },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotDefineAssociationWithBothDependentAndPassthrough)
      })
    })

    context('dependent AND DreamConst.required both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @User2.HasOne('Post', {
              dependent: 'destroy',
              on: { body: DreamConst.required },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotDefineAssociationWithBothDependentAndRequiredOnClause)
      })
    })
  })
})
