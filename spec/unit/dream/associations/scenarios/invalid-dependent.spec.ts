import { DreamConst, HasMany, HasOne } from '../../../../../src'
import CannotDefineAssociationWithBothDependentAndPassthrough from '../../../../../src/exceptions/cannot-define-association-with-both-dependent-and-passthrough'
import CannotDefineAssociationWithBothDependentAndRequiredWhereClause from '../../../../../src/exceptions/cannot-define-association-with-both-dependent-and-required-where-clause'
import Post from '../../../../../test-app/app/models/Post'
import User from '../../../../../test-app/app/models/User'

describe('Invalid dependent set within HasOne/HasMany associations', () => {
  context('HasMany', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasMany('Post', {
              dependent: 'destroy',
              where: { body: DreamConst.passthrough },
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
            @HasMany('Post', {
              dependent: 'destroy',
              where: { body: DreamConst.required },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotDefineAssociationWithBothDependentAndRequiredWhereClause)
      })
    })
  })

  context('HasOne', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasOne('Post', {
              dependent: 'destroy',
              where: { body: DreamConst.passthrough },
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
            @HasOne('Post', {
              dependent: 'destroy',
              where: { body: DreamConst.required },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotDefineAssociationWithBothDependentAndRequiredWhereClause)
      })
    })
  })
})
