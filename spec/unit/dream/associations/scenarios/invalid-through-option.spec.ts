import { HasMany, HasOne } from '../../../../../src'
import CannotDefineAssociationWithBothThroughAndWithoutDefaultScopes from '../../../../../src/exceptions/cannot-define-association-with-both-through-and-without-default-scopes'
import PostComment from '../../../../../test-app/app/models/PostComment'
import User from '../../../../../test-app/app/models/User'

describe('Invalid through option set within HasOne/HasMany associations', () => {
  context('HasMany', () => {
    context('through AND withoutDefaultScopes both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasMany(() => PostComment, {
              through: 'posts',
              withoutDefaultScopes: ['dream:SoftDelete'],
            })
            public testAssociation: PostComment[]
          }
        }).toThrow(CannotDefineAssociationWithBothThroughAndWithoutDefaultScopes)
      })
    })
  })

  context('HasOne', () => {
    context('dependent AND passthrough both set', () => {
      it('throws a targeted exception', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          class User2 extends User {
            @HasOne(() => PostComment, {
              through: 'post',
              withoutDefaultScopes: ['dream:SoftDelete'],
            })
            public testAssociation: PostComment
          }
        }).toThrow(CannotDefineAssociationWithBothThroughAndWithoutDefaultScopes)
      })
    })
  })
})
