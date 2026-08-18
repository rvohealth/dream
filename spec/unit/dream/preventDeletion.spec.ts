import { MockInstance } from 'vitest'
import { blankHooksFactory } from '../../../src/decorators/field/lifecycle/shared.js'
import Dream from '../../../src/Dream.js'
import { sortableSnapshotFor } from '../../../src/decorators/field/sortable/helpers/sortableSnapshot.js'
import PostgresQueryDriver from '../../../src/dream/QueryDriver/Postgres.js'
import * as runHooksForModule from '../../../src/dream/internal/runHooksFor.js'
import { HookStatement } from '../../../src/types/lifecycle.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import PostComment from '../../../test-app/app/models/PostComment.js'
import PostVisibility from '../../../test-app/app/models/PostVisibility.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#preventDeletion', () => {
  let user: User
  let pet: Pet
  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    pet = await Pet.create({ user })
  })

  it('soft deletes a soft-delete model when deletion was not prevented', async () => {
    await pet.destroy()
    const reloadedPet = await Pet.removeAllDefaultScopes().find(pet.id)
    expect(reloadedPet!.deletedAt).not.toBeNull()
    expect(reloadedPet).toMatchDreamModel(pet)
  })

  context('when a beforeDestroy hook calls preventDeletion', () => {
    let hooksSpy: MockInstance

    beforeEach(() => {
      if (!Object.getOwnPropertyDescriptor(Pet, 'hooks')) Pet['hooks'] = blankHooksFactory(Pet)
      ;(Pet.prototype as any)['preventItsOwnDeletion'] = function (this: Dream) {
        this.preventDeletion()
      }
      Pet['addHook']('beforeDestroy', {
        type: 'beforeDestroy',
        className: 'Pet',
        method: 'preventItsOwnDeletion',
      })
    })

    afterEach(() => {
      ;(Pet['hooks'].beforeDestroy as HookStatement[]).pop()
    })

    it('leaves deletedAt null on a soft-delete model', async () => {
      await pet.destroy()

      const reloadedPet = await Pet.removeAllDefaultScopes().find(pet.id)
      expect(reloadedPet).not.toBeNull()
      expect(reloadedPet!.deletedAt).toBeNull()
    })

    it('leaves the position column unchanged', async () => {
      const dog = await Pet.create({ species: 'dog' })
      expect(dog.positionWithinSpecies).toEqual(1)

      await dog.destroy()

      const reloadedDog = await Pet.removeAllDefaultScopes().find(dog.id)
      expect(reloadedDog!.positionWithinSpecies).toEqual(1)
    })

    it('leaves the positions of sibling records in the sort scope untouched', async () => {
      const dog1 = await Pet.create({ species: 'dog' })
      const dog2 = await Pet.create({ species: 'dog' })
      const dog3 = await Pet.create({ species: 'dog' })

      await dog1.destroy()

      expect((await Pet.removeAllDefaultScopes().find(dog2.id))!.positionWithinSpecies).toEqual(2)
      expect((await Pet.removeAllDefaultScopes().find(dog3.id))!.positionWithinSpecies).toEqual(3)
    })

    it('does not run afterDestroy or afterDestroyCommit hooks', async () => {
      hooksSpy = vi.spyOn(runHooksForModule, 'default')

      await pet.destroy()

      expect(hooksSpy).toHaveBeenCalledWith(
        'beforeDestroy',
        expect.toMatchDreamModel(pet),
        expect.anything(),
        expect.toBeOneOf([expect.anything(), undefined, null]),
        expect.anything()
      )
      expect(hooksSpy).not.toHaveBeenCalledWith(
        'afterDestroy',
        expect.toMatchDreamModel(pet),
        expect.toBeOneOf([expect.anything(), undefined, null]),
        expect.toBeOneOf([expect.anything(), undefined, null]),
        expect.toBeOneOf([expect.anything(), undefined, null])
      )
      expect(hooksSpy).not.toHaveBeenCalledWith(
        'afterDestroyCommit',
        expect.toMatchDreamModel(pet),
        expect.toBeOneOf([expect.anything(), undefined, null]),
        expect.toBeOneOf([expect.anything(), undefined, null]),
        expect.toBeOneOf([expect.anything(), undefined, null])
      )
    })

    it('returns the instance and does not throw', async () => {
      const returned = await pet.destroy()
      expect(returned).toMatchDreamModel(pet)
    })

    it('leaves `dependent: destroy` associations in place', async () => {
      const collar = await Collar.create({ pet, tagName: 'aster' })

      await pet.destroy()

      expect(await Collar.find(collar.id)).toMatchDreamModel(collar)
      expect(await Collar.removeAllDefaultScopes().count()).toEqual(1)
    })

    it('acquires no advisory lock and caches no sortable snapshot', async () => {
      const acquireSpy = vi.spyOn(PostgresQueryDriver, 'acquireAdvisoryTransactionLocks')

      await pet.destroy()

      expect(acquireSpy).not.toHaveBeenCalled()
      expect(sortableSnapshotFor(pet, 'positionWithinSpecies')).toBeUndefined()
    })

    context('reallyDestroy', () => {
      it('leaves the record in the table', async () => {
        await pet.reallyDestroy()

        expect(await Pet.removeAllDefaultScopes().find(pet.id)).not.toBeNull()
      })

      it('leaves `dependent: destroy` associations in place', async () => {
        const collar = await Collar.create({ pet, tagName: 'aster' })

        await pet.reallyDestroy()

        expect(await Collar.find(collar.id)).toMatchDreamModel(collar)
      })
    })
  })

  context('when the caller calls preventDeletion before a skipHooks destroy', () => {
    it('leaves the record and its `dependent: destroy` associations in place', async () => {
      const collar = await Collar.create({ pet, tagName: 'aster' })

      pet.preventDeletion()
      await pet.destroy({ skipHooks: true })

      const reloadedPet = await Pet.removeAllDefaultScopes().find(pet.id)
      expect(reloadedPet!.deletedAt).toBeNull()
      expect(await Collar.find(collar.id)).toMatchDreamModel(collar)
    })
  })

  context('when a beforeDestroy hook on a cascaded child calls preventDeletion', () => {
    let postVisibility: PostVisibility
    let post: Post
    let postComment: PostComment

    beforeEach(async () => {
      if (!Object.getOwnPropertyDescriptor(Post, 'hooks')) Post['hooks'] = blankHooksFactory(Post)
      ;(Post.prototype as any)['preventItsOwnDeletion'] = function (this: Dream) {
        this.preventDeletion()
      }
      Post['addHook']('beforeDestroy', {
        type: 'beforeDestroy',
        className: 'Post',
        method: 'preventItsOwnDeletion',
      })

      postVisibility = await PostVisibility.create({ visibility: true })
      post = await Post.create({ user, postVisibility })
      postComment = await PostComment.create({ post, body: 'howyadoin' })
    })

    afterEach(() => {
      ;(Post['hooks'].beforeDestroy as HookStatement[]).pop()
    })

    it("stops that child's own subtree without stopping the destroy that reached it", async () => {
      await postVisibility.destroy()

      expect(await PostVisibility.find(postVisibility.id)).toBeNull()
      expect(await Post.find(post.id)).toMatchDreamModel(post)
      expect(await PostComment.find(postComment.id)).toMatchDreamModel(postComment)
    })
  })
})
