import { DreamConst, HasMany, HasOne } from '../../../../../src'
import CannotPassDependentAndPassthrough from '../../../../../src/exceptions/cannot-pass-dependent-and-passthrough'
import CannotPassDependentAndRequiredWhereClause from '../../../../../src/exceptions/cannot-pass-dependent-and-required-where-clause'
import Post from '../../../../../test-app/app/models/Post'
import User from '../../../../../test-app/app/models/User'

describe('Invalid dependent set within HasOne/HasMany associations', () => {
  context('HasMany', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasMany(() => Post, {
              dependent: 'destroy',
              where: { body: DreamConst.passthrough },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotPassDependentAndPassthrough)
      })
    })

    context('dependent AND requiredWhereClause both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasMany(() => Post, {
              dependent: 'destroy',
              where: { body: DreamConst.requiredWhereClause },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotPassDependentAndRequiredWhereClause)
      })
    })
  })

  context('HasOne', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasOne(() => Post, {
              dependent: 'destroy',
              where: { body: DreamConst.passthrough },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotPassDependentAndPassthrough)
      })
    })

    context('dependent AND requiredWhereClause both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasOne(() => Post, {
              dependent: 'destroy',
              where: { body: DreamConst.requiredWhereClause },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotPassDependentAndRequiredWhereClause)
      })
    })
  })
})
