import { describe as context } from '@jest/globals'
import User from '../../../../test-app/app/models/User'
import Post from '../../../../test-app/app/models/Post'
import Sortable from '../../../../src/decorators/sortable'
import NonExistentScopeProvidedToSortableDecorator from '../../../../src/exceptions/non-existent-scope-provided-to-sortable-decorator'
import NonBelongsToScopeProvidedToSortableDecorator from '../../../../src/exceptions/non-belongs-to-scope-provided-to-sortable-decorator'

describe('@Sortable', () => {
  let user: User
  let user2: User

  class UnscopedPost extends Post {
    @Sortable()
    public position: number
  }

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
    user2 = await User.create({ email: 'chalupas@johnson', password: 'howyadoin' })
  })

  context('upon creating', () => {
    context('without a scope present', () => {
      context('when position is not set on the record', () => {
        context('when no other records exist', () => {
          it('sets the position to 1', async () => {
            const post = await UnscopedPost.create({ body: 'hello', user })
            expect(post.position).toEqual(1)
          })
        })

        context('when other records exist', () => {
          it('sets the position to be the highest existing position + 1', async () => {
            await UnscopedPost.create({ body: 'hello', user: user2 })
            const post = await UnscopedPost.create({ body: 'hello', user })
            expect(post.position).toEqual(2)
          })
        })
      })

      context('when position is set on the record', () => {
        context('the position is set to a value that is equal to the highest existing position + 1', () => {
          it('leaves the position as-is for all records', async () => {
            await UnscopedPost.create({ body: 'hello', user: user2 })
            const post = await UnscopedPost.create({ body: 'hello', user, position: 2 })
            expect(post.position).toEqual(2)
          })
        })

        context(
          'the position is set to a value that is greater than the highest existing position + 1',
          () => {
            it('sets the position of the new record to be the highest existing position + 1', async () => {
              await UnscopedPost.create({ body: 'hello', user: user2 })
              const post = await UnscopedPost.create({ body: 'hello', user, position: 3 })
              expect(post.position).toEqual(2)
            })
          }
        )

        context('the position is set to a value that is lower than the highest existing position + 1', () => {
          it('leaves the position as-is for the new record, but offsets all records with a position >= the position of this new record', async () => {
            const post1 = await UnscopedPost.create({ body: 'hello', user })
            const post2 = await UnscopedPost.create({ body: 'hello', user: user2 })
            const post3 = await UnscopedPost.create({ body: 'hello', user: user2 })
            const newPost = await UnscopedPost.create({ body: 'hello', user, position: 2 })

            expect(newPost.position).toEqual(2)
            expect((await post1.reload()).position).toEqual(1)
            expect((await post2.reload()).position).toEqual(3)
            expect((await post3.reload()).position).toEqual(4)
          })
        })
      })
    })

    context('with a scope present', () => {
      context('when position is not set on the record', () => {
        context('when no other records exist', () => {
          it('sets the position to 1', async () => {
            await Post.create({ body: 'hello', user: user2 })
            const post = await Post.create({ body: 'hello', user })
            expect(post.position).toEqual(1)
          })
        })

        context('when other records exist', () => {
          it('sets the position to be the highest existing position + 1', async () => {
            await Post.create({ body: 'hello', user })
            await Post.create({ body: 'hello', user: user2 })
            const post = await Post.create({ body: 'hello', user })
            expect(post.position).toEqual(2)
          })
        })
      })

      context('when position is set on the record', () => {
        context('the position is set to a value that is equal to the highest existing position + 1', () => {
          it('leaves the position as-is for all records', async () => {
            await Post.create({ body: 'hello', user })
            await Post.create({ body: 'hello', user: user2 })
            const post = await Post.create({ body: 'hello', user, position: 2 })
            expect(post.position).toEqual(2)
          })
        })

        context(
          'the position is set to a value that is greater than the highest existing position + 1',
          () => {
            it('sets the position of the new record to be the highest existing position + 1', async () => {
              await Post.create({ body: 'hello', user })
              await Post.create({ body: 'hello', user: user2 })
              const post = await Post.create({ body: 'hello', user, position: 3 })
              expect(post.position).toEqual(2)
            })
          }
        )

        context('the position is set to a value that is lower than the highest existing position + 1', () => {
          it('leaves the position as-is for the new record, but offsets all records with a position >= the position of this new record', async () => {
            const unrelatedPost = await Post.create({ body: 'unrelated', user: user2 })
            const post1 = await Post.create({ body: 'post1', user })
            const post2 = await Post.create({ body: 'post2', user })
            const post3 = await Post.create({ body: 'post3', user })
            const newPost = await Post.create({ body: 'new post', user, position: 2 })

            expect(newPost.position).toEqual(2)
            expect((await post1.reload()).position).toEqual(1)
            expect((await post2.reload()).position).toEqual(3)
            expect((await post3.reload()).position).toEqual(4)

            expect((await unrelatedPost.reload()).position).toEqual(1)
          })
        })
      })
    })
  })

  context('upon updating', () => {
    context('without a scope present', () => {
      context('when increasing the position', () => {
        it('reshuffles existing positions based on new position value', async () => {
          const post1 = await UnscopedPost.create({ body: 'post1', user })
          const post2 = await UnscopedPost.create({ body: 'post2', user: user2 })
          const post3 = await UnscopedPost.create({ body: 'post3', user: user2 })
          const post4 = await UnscopedPost.create({ body: 'post4', user })

          await post2.update({ position: 3 })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(3)
          expect((await post3.reload()).position).toEqual(2)
          expect((await post4.reload()).position).toEqual(4)
        })
      })

      context('when decreasing the position', () => {
        it('reshuffles existing positions based on new position value', async () => {
          const post1 = await UnscopedPost.create({ body: 'hello', user })
          const post2 = await UnscopedPost.create({ body: 'hello', user: user2 })
          const post3 = await UnscopedPost.create({ body: 'hello', user: user2 })
          const post4 = await UnscopedPost.create({ body: 'hello', user })

          expect(post4.position).toEqual(4)
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(2)
          expect((await post3.reload()).position).toEqual(3)

          await post3.update({ position: 2 })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(3)
          expect((await post3.reload()).position).toEqual(2)
          expect((await post4.reload()).position).toEqual(4)
        })
      })

      context('when attempting to set position to zero', () => {
        it('does not change the position', async () => {
          const post1 = await UnscopedPost.create({ body: 'post1', user })
          const post2 = await UnscopedPost.create({ body: 'post2', user: user2 })
          const post3 = await UnscopedPost.create({ body: 'post3', user: user2 })
          const post4 = await UnscopedPost.create({ body: 'post4', user })

          await post2.update({ position: 0 })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(2)
          expect((await post3.reload()).position).toEqual(3)
          expect((await post4.reload()).position).toEqual(4)
        })
      })

      context('when attempting to set position to a negative number', () => {
        it('does not change the position', async () => {
          const post1 = await UnscopedPost.create({ body: 'post1', user })
          const post2 = await UnscopedPost.create({ body: 'post2', user: user2 })
          const post3 = await UnscopedPost.create({ body: 'post3', user: user2 })
          const post4 = await UnscopedPost.create({ body: 'post4', user })

          await post2.update({ position: -1 })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(2)
          expect((await post3.reload()).position).toEqual(3)
          expect((await post4.reload()).position).toEqual(4)
        })
      })

      context('when attempting to set position to more than the number of items', () => {
        it('does not change the position', async () => {
          const post1 = await UnscopedPost.create({ body: 'post1', user })
          const post2 = await UnscopedPost.create({ body: 'post2', user: user2 })
          const post3 = await UnscopedPost.create({ body: 'post3', user: user2 })
          const post4 = await UnscopedPost.create({ body: 'post4', user })

          await post2.update({ position: 5 })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(2)
          expect((await post3.reload()).position).toEqual(3)
          expect((await post4.reload()).position).toEqual(4)
        })
      })

      context('when attempting to set position to undefined', () => {
        it('does not change the position', async () => {
          const post1 = await UnscopedPost.create({ body: 'post1', user })
          const post2 = await UnscopedPost.create({ body: 'post2', user: user2 })
          const post3 = await UnscopedPost.create({ body: 'post3', user: user2 })
          const post4 = await UnscopedPost.create({ body: 'post4', user })

          await post2.update({ position: undefined })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(2)
          expect((await post3.reload()).position).toEqual(3)
          expect((await post4.reload()).position).toEqual(4)
        })
      })

      context('when attempting to set position to null', () => {
        it('does not change the position', async () => {
          const post1 = await UnscopedPost.create({ body: 'post1', user })
          const post2 = await UnscopedPost.create({ body: 'post2', user: user2 })
          const post3 = await UnscopedPost.create({ body: 'post3', user: user2 })
          const post4 = await UnscopedPost.create({ body: 'post4', user })

          // @ts-ignore
          await post2.update({ position: null })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(2)
          expect((await post3.reload()).position).toEqual(3)
          expect((await post4.reload()).position).toEqual(4)
        })
      })
    })

    context('with a scope present', () => {
      it('reshuffles existing positions based on new position value', async () => {
        const unrelatedPost = await Post.create({ body: 'hello', user: user2 })
        const post1 = await Post.create({ body: 'hello', user })
        const post2 = await Post.create({ body: 'hello', user })
        const post3 = await Post.create({ body: 'hello', user })
        const post4 = await Post.create({ body: 'hello', user })

        expect(post4.position).toEqual(4)
        expect((await post1.reload()).position).toEqual(1)
        expect((await post2.reload()).position).toEqual(2)
        expect((await post3.reload()).position).toEqual(3)
        expect((await unrelatedPost.reload()).position).toEqual(1)

        await post4.update({ position: 2 })
        expect((await post4.reload()).position).toEqual(2)

        expect((await post1.reload()).position).toEqual(1)
        expect((await post2.reload()).position).toEqual(3)
        expect((await post3.reload()).position).toEqual(4)
        expect((await unrelatedPost.reload()).position).toEqual(1)

        await post4.update({ position: 3 })
        expect((await post4.reload()).position).toEqual(3)
        expect((await post1.reload()).position).toEqual(1)
        expect((await post2.reload()).position).toEqual(2)
        expect((await post3.reload()).position).toEqual(4)
        expect((await unrelatedPost.reload()).position).toEqual(1)
      })

      context('updating with content', () => {
        it('reshuffles existing positions based on new position value', async () => {
          const unrelatedPost = await Post.create({ body: 'hello', user: user2 })
          const post1 = await Post.create({ body: 'hello', user })
          const post2 = await Post.create({ body: 'hello', user })
          const post3 = await Post.create({ body: 'hello', user })
          const post4 = await Post.create({ body: 'hello', user })

          expect(post4.position).toEqual(4)
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(2)
          expect((await post3.reload()).position).toEqual(3)
          expect((await unrelatedPost.reload()).position).toEqual(1)

          await post4.update({ body: `${post4.body}.`, position: 2 })
          expect((await post4.reload()).position).toEqual(2)
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(3)
          expect((await post3.reload()).position).toEqual(4)
          expect((await unrelatedPost.reload()).position).toEqual(1)

          await post4.update({ body: `${post4.body}.`, position: 3 })
          expect((await post4.reload()).position).toEqual(3)
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(2)
          expect((await post3.reload()).position).toEqual(4)
          expect((await unrelatedPost.reload()).position).toEqual(1)
        })
      })

      context('when attempting to set position to zero', () => {
        it('does not change the position', async () => {
          const post1 = await Post.create({ body: 'post1', user })
          const post2 = await Post.create({ body: 'post2', user: user2 })
          const post3 = await Post.create({ body: 'post3', user: user2 })
          const post4 = await Post.create({ body: 'post4', user })

          await post2.update({ position: 0 })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(1)
          expect((await post3.reload()).position).toEqual(2)
          expect((await post4.reload()).position).toEqual(2)
        })
      })

      context('when attempting to set position to a negative number', () => {
        it('does not change the position', async () => {
          const post1 = await Post.create({ body: 'post1', user })
          const post2 = await Post.create({ body: 'post2', user: user2 })
          const post3 = await Post.create({ body: 'post3', user: user2 })
          const post4 = await Post.create({ body: 'post4', user })

          await post2.update({ position: -1 })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(1)
          expect((await post3.reload()).position).toEqual(2)
          expect((await post4.reload()).position).toEqual(2)
        })
      })

      context('when attempting to set position to more than the number of items', () => {
        it('does not change the position', async () => {
          const post1 = await Post.create({ body: 'post1', user })
          const post2 = await Post.create({ body: 'post2', user: user2 })
          const post3 = await Post.create({ body: 'post3', user: user2 })
          const post4 = await Post.create({ body: 'post4', user })

          await post2.update({ position: 5 })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(1)
          expect((await post3.reload()).position).toEqual(2)
          expect((await post4.reload()).position).toEqual(2)
        })
      })

      context('when attempting to set position to undefined', () => {
        it('does not change the position', async () => {
          const post1 = await Post.create({ body: 'post1', user })
          const post2 = await Post.create({ body: 'post2', user: user2 })
          const post3 = await Post.create({ body: 'post3', user: user2 })
          const post4 = await Post.create({ body: 'post4', user })

          await post2.update({ position: undefined })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(1)
          expect((await post3.reload()).position).toEqual(2)
          expect((await post4.reload()).position).toEqual(2)
        })
      })

      context('when attempting to set position to null', () => {
        it('does not change the position', async () => {
          const post1 = await Post.create({ body: 'post1', user })
          const post2 = await Post.create({ body: 'post2', user: user2 })
          const post3 = await Post.create({ body: 'post3', user: user2 })
          const post4 = await Post.create({ body: 'post4', user })

          // @ts-ignore
          await post2.update({ position: null })
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(1)
          expect((await post3.reload()).position).toEqual(2)
          expect((await post4.reload()).position).toEqual(2)
        })
      })
    })
  })

  context('upon destroying', () => {
    it('adjusts the positions of related records', async () => {
      const unrelatedPost = await Post.create({ body: 'hello', user: user2 })
      const post1 = await Post.create({ body: 'hello', user })
      const post2 = await Post.create({ body: 'hello', user })
      const post3 = await Post.create({ body: 'hello', user })
      const post4 = await Post.create({ body: 'hello', user })

      await post2.destroy()

      expect((await post1.reload()).position).toEqual(1)
      expect((await post3.reload()).position).toEqual(2)
      expect((await post4.reload()).position).toEqual(3)
      expect((await unrelatedPost.reload()).position).toEqual(1)
    })
  })

  context('with an invalid scope provided', () => {
    context('with a scope pointing to a non-existent association', () => {
      class InvalidPost extends Post {
        @Sortable({ scope: 'intentionallyInvalidScope' })
        public position: number
      }

      it('raises a targeted exception', async () => {
        await expect(async () => await InvalidPost.create({ body: 'hello', user })).rejects.toThrowError(
          NonExistentScopeProvidedToSortableDecorator
        )
      })
    })

    context('with a scope pointing to a non-belongs-to association', () => {
      class InvalidPost extends Post {
        @Sortable({ scope: 'ratings' })
        public position: number
      }

      it('raises a targeted exception', async () => {
        await expect(async () => await InvalidPost.create({ body: 'hello', user })).rejects.toThrowError(
          NonBelongsToScopeProvidedToSortableDecorator
        )
      })
    })
  })
})
