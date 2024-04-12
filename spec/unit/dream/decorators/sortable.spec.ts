import { describe as context } from '@jest/globals'
import User from '../../../../test-app/app/models/User'
import Post from '../../../../test-app/app/models/Post'
import Sortable from '../../../../src/decorators/sortable'
import NonBelongsToAssociationProvidedAsSortableDecoratorScope from '../../../../src/exceptions/non-belongs-to-association-provided-as-sortable-decorator-scope'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Edge from '../../../../test-app/app/models/Graph/Edge'
import Node from '../../../../test-app/app/models/Graph/Node'
import EdgeNode from '../../../../test-app/app/models/Graph/EdgeNode'
import SortableDecoratorRequiresColumnOrBelongsToAssociation from '../../../../src/exceptions/sortable-decorator-requires-column-or-belongs-to-association'
import Pet from '../../../../test-app/app/models/Pet'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'
import Collar from '../../../../test-app/app/models/Collar'

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
            const post1 = await UnscopedPost.create({ body: 'post 1', user })
            const post2 = await UnscopedPost.create({ body: 'post 2', user: user2 })
            const post3 = await UnscopedPost.create({ body: 'hello', user: user2 })
            const newPost = await UnscopedPost.create({ body: 'new post', user, position: 2 })

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

          await post2.update({ position: null } as any)
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

      context('when part of the scope is pointing to a column', () => {
        let pet: Pet
        let pet2: Pet
        let collar1: Collar
        let collar2: Collar
        let collar3: Collar
        let collar4: Collar
        beforeEach(async () => {
          pet = await Pet.create()
          pet2 = await Pet.create()
          collar1 = await Collar.create({ tagName: 'hello', pet })
          collar2 = await Collar.create({ tagName: 'hello', pet })
          collar3 = await Collar.create({ tagName: 'goodbye', pet })
          collar4 = await Collar.create({ tagName: 'goodbye', pet })

          await collar1.reload()
          await collar2.reload()
          await collar3.reload()
          await collar4.reload()

          expect(collar1.position).toEqual(1)
          expect(collar2.position).toEqual(2)
          expect(collar3.position).toEqual(1)
          expect(collar4.position).toEqual(2)
        })

        it('includes column as part of scope when considering which records to update', async () => {
          await collar3.update({ position: 2 })
          expect((await collar3.reload()).position).toEqual(2)
          expect((await collar4.reload()).position).toEqual(1)
        })

        context('when updating a scope column, rather than the position', () => {
          it('also affects the ordering of the previous scope to close positional gaps left behind', async () => {
            await collar3.update({ position: 2 })
            await collar3.update({ tagName: 'hello' })
            expect((await collar1.reload()).position).toEqual(1)
            expect((await collar3.reload()).position).toEqual(2)
            expect((await collar2.reload()).position).toEqual(3)

            await collar3.update({ pet: pet2 })
            expect((await collar3.reload()).position).toEqual(1)
            expect((await collar1.reload()).position).toEqual(1)
            expect((await collar2.reload()).position).toEqual(2)
          })
        })
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

          await post2.update({ position: null } as any)
          expect((await post1.reload()).position).toEqual(1)
          expect((await post2.reload()).position).toEqual(1)
          expect((await post3.reload()).position).toEqual(2)
          expect((await post4.reload()).position).toEqual(2)
        })
      })

      context('within a transaction', () => {
        it('leverages the provided transaction and correctly sorts', async () => {
          await ApplicationModel.transaction(async txn => {
            let post1 = await Post.txn(txn).create({ body: 'hello', user })
            let post2 = await Post.txn(txn).create({ body: 'hello', user })
            let post3 = await Post.txn(txn).create({ body: 'hello', user })
            post1 = (await Post.txn(txn).find(post1.id))!
            post2 = (await Post.txn(txn).find(post2.id))!
            post3 = (await Post.txn(txn).find(post3.id))!

            expect(post1.position).toEqual(1)
            expect(post2.position).toEqual(2)
            expect(post3.position).toEqual(3)

            await post1.txn(txn).update({ position: 2 })
            post1 = (await Post.txn(txn).find(post1.id))!
            post2 = (await Post.txn(txn).find(post2.id))!
            post3 = (await Post.txn(txn).find(post3.id))!

            expect(post1.position).toEqual(2)
            expect(post2.position).toEqual(1)
            expect(post3.position).toEqual(3)
          })
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

    context('within a transaction', () => {
      it('adjusts the positions of related records', async () => {
        await ApplicationModel.transaction(async txn => {
          const unrelatedPost = await Post.txn(txn).create({ body: 'hello', user: user2 })
          const post1 = await Post.txn(txn).create({ body: 'hello', user })
          const post2 = await Post.txn(txn).create({ body: 'hello', user })
          const post3 = await Post.txn(txn).create({ body: 'hello', user })
          const post4 = await Post.txn(txn).create({ body: 'hello', user })

          await post2.txn(txn).destroy()

          expect((await post1.txn(txn).reload()).position).toEqual(1)
          expect((await post3.txn(txn).reload()).position).toEqual(2)
          expect((await post4.txn(txn).reload()).position).toEqual(3)
          expect((await unrelatedPost.txn(txn).reload()).position).toEqual(1)
        })
      })
    })
  })

  context('with another column as the scope', () => {
    it('sets the position independently for models with different values of the scoping column', async () => {
      const dog1 = await Pet.create({ species: 'dog' })
      const cat1 = await Pet.create({ species: 'cat' })
      const cat2 = await Pet.create({ species: 'cat' })
      const dog2 = await Pet.create({ species: 'dog' })

      expect(dog1.positionWithinSpecies).toEqual(1)
      expect(dog2.positionWithinSpecies).toEqual(2)
      expect(cat1.positionWithinSpecies).toEqual(1)
      expect(cat2.positionWithinSpecies).toEqual(2)
    })

    context('updating position', () => {
      it('automatically adjusts other records with the same column scope', async () => {
        const dog1 = await Pet.create({ species: 'dog' })
        const cat1 = await Pet.create({ species: 'cat' })
        const cat2 = await Pet.create({ species: 'cat' })
        const dog2 = await Pet.create({ species: 'dog' })
        const dog3 = await Pet.create({ species: 'dog' })

        await dog3.update({ positionWithinSpecies: 1 })

        expect((await dog3.reload()).positionWithinSpecies).toEqual(1)
        expect((await dog1.reload()).positionWithinSpecies).toEqual(2)
        expect((await dog2.reload()).positionWithinSpecies).toEqual(3)
        expect((await cat1.reload()).positionWithinSpecies).toEqual(1)
        expect((await cat2.reload()).positionWithinSpecies).toEqual(2)
      })
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
          SortableDecoratorRequiresColumnOrBelongsToAssociation
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
          NonBelongsToAssociationProvidedAsSortableDecoratorScope
        )
      })
    })
  })

  context('when the sortable decorator is applied within an STI base class', () => {
    it('applies sorting logic against foreign key of scope only, not child STI class', async () => {
      const unrelatedBalloon = await Mylar.create({ user: user2 })
      const balloon1 = await Mylar.create({ user })
      const balloon2 = await Latex.create({ user })
      const balloon3 = await Mylar.create({ user })
      const balloon4 = await Latex.create({ user })

      expect(balloon4.positionAlpha).toEqual(4)
      expect((await balloon1.reload()).positionAlpha).toEqual(1)
      expect((await balloon2.reload()).positionAlpha).toEqual(2)
      expect((await balloon3.reload()).positionAlpha).toEqual(3)
      expect((await unrelatedBalloon.reload()).positionAlpha).toEqual(1)

      await balloon4.update({ positionAlpha: 2 })
      expect((await balloon4.reload()).positionAlpha).toEqual(2)

      expect((await balloon1.reload()).positionAlpha).toEqual(1)
      expect((await balloon2.reload()).positionAlpha).toEqual(3)
      expect((await balloon3.reload()).positionAlpha).toEqual(4)
      expect((await unrelatedBalloon.reload()).positionAlpha).toEqual(1)
    })
  })

  context('when the sortable decorator is applied within an STI child class', () => {
    it('applies sorting logic against foreign key of scope AND child STI class', async () => {
      const unrelatedBalloon = await Mylar.create({ user: user2 })
      const balloon1 = await Mylar.create({ user })
      const balloon2 = await Latex.create({ user })
      const balloon3 = await Mylar.create({ user })
      const balloon4 = await Latex.create({ user })

      expect(balloon4.positionBeta).toEqual(2)
      expect((await balloon1.reload()).positionBeta).toEqual(1)
      expect((await balloon2.reload()).positionBeta).toEqual(1)
      expect((await balloon3.reload()).positionBeta).toEqual(2)
      expect((await unrelatedBalloon.reload()).positionBeta).toEqual(1)

      await balloon4.update({ positionBeta: 1 })
      expect((await balloon4.reload()).positionBeta).toEqual(1)

      expect((await balloon1.reload()).positionBeta).toEqual(1)
      expect((await balloon2.reload()).positionBeta).toEqual(2)
      expect((await balloon3.reload()).positionBeta).toEqual(2)
      expect((await unrelatedBalloon.reload()).positionBeta).toEqual(1)
    })
  })

  context('with multiple scopes', () => {
    it('it correctly applies all foreign keys', async () => {
      const edge1 = await Edge.create({ name: 'edge 1' })
      const edge2 = await Edge.create({ name: 'edge 2' })
      const node1 = await Node.create({ name: 'node 1' })
      const node2 = await Node.create({ name: 'node 2' })

      const unrelatedNode1 = await EdgeNode.create({ edge: edge2, node: node1 })
      const unrelatedNode2 = await EdgeNode.create({ edge: edge1, node: node2 })
      const edgeNode1 = await EdgeNode.create({ edge: edge1, node: node1 })
      const edgeNode2 = await EdgeNode.create({ edge: edge1, node: node1 })
      const edgeNode3 = await EdgeNode.create({ edge: edge1, node: node1 })

      expect(edgeNode3.multiScopedPosition).toEqual(3)
      expect((await edgeNode1.reload()).multiScopedPosition).toEqual(1)
      expect((await edgeNode2.reload()).multiScopedPosition).toEqual(2)
      expect((await unrelatedNode1.reload()).multiScopedPosition).toEqual(1)
      expect((await unrelatedNode2.reload()).multiScopedPosition).toEqual(1)

      await edgeNode3.update({ multiScopedPosition: 1 })
      expect((await edgeNode3.reload()).multiScopedPosition).toEqual(1)
      expect((await edgeNode1.reload()).multiScopedPosition).toEqual(2)
      expect((await edgeNode2.reload()).multiScopedPosition).toEqual(3)
      expect((await unrelatedNode1.reload()).multiScopedPosition).toEqual(1)
      expect((await unrelatedNode2.reload()).multiScopedPosition).toEqual(1)
    })
  })
})
