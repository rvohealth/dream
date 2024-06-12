import { DreamConst, HasMany, HasOne } from '../../../../../src'
import CannotPassCascadeAndPassthrough from '../../../../../src/exceptions/cannot-pass-cascade-and-passthrough'
import CannotPassCascadeAndRequiredWhereClause from '../../../../../src/exceptions/cannot-pass-cascade-and-required-where-clause'
import Post from '../../../../../test-app/app/models/Post'
import User from '../../../../../test-app/app/models/User'

describe('Invalid cascade set within HasOne/HasMany associations', () => {
  context('HasMany', () => {
    context('cascade AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasMany(() => Post, {
              cascade: 'destroy',
              where: { body: DreamConst.passthrough },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotPassCascadeAndPassthrough)
      })
    })

    context('cascade AND requiredWhereClause both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasMany(() => Post, {
              cascade: 'destroy',
              where: { body: DreamConst.requiredWhereClause },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotPassCascadeAndRequiredWhereClause)
      })
    })
  })

  context('HasOne', () => {
    context('cascade AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasOne(() => Post, {
              cascade: 'destroy',
              where: { body: DreamConst.passthrough },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotPassCascadeAndPassthrough)
      })
    })

    context('cascade AND requiredWhereClause both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasOne(() => Post, {
              cascade: 'destroy',
              where: { body: DreamConst.requiredWhereClause },
            })
            public testAssociation: Post
          }
        }).toThrow(CannotPassCascadeAndRequiredWhereClause)
      })
    })
  })
})
