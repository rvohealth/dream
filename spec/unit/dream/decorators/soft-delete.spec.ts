import { DreamTransaction } from '../../../../src'
import * as runHooksForModule from '../../../../src/dream/internal/runHooksFor'
import * as safelyRunCommitHooksModule from '../../../../src/dream/internal/safelyRunCommitHooks'
import MissingDeletedAtFieldForSoftDelete from '../../../../src/exceptions/missing-deleted-at-field-for-soft-delete'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel'
import ModelWithoutCustomDeletedAt from '../../../../test-app/app/models/ModelWithoutCustomDeletedAt'
import ModelWithoutDeletedAt from '../../../../test-app/app/models/ModelWithoutDeletedAt'
import Post from '../../../../test-app/app/models/Post'
import User from '../../../../test-app/app/models/User'

// NOTE: this spec does not cover ALL implementation cases for SoftDelete.
// Many specs for SoftDelete are spread throughout the dream/destroy.spec.ts,
// query/destroy.spec.ts, and dream/associations/destroyAssociation.spec.ts.
describe('@SoftDelete', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
  })

  it('sets deletedAt to a datetime, does not delete record', async () => {
    const post = await Post.create({ body: 'hello', user })
    expect(post.deletedAt).toBeNull()

    await post.destroy()

    expect(await Post.last()).toBeNull()
    const reloadedPost = await Post.unscoped().last()
    expect(reloadedPost!.deletedAt).not.toBeNull()
  })

  context('for a model that has sortable fields', () => {
    it('sets all sortable fields to null', async () => {
      const post = await Post.create({ body: 'hello', user })
      await post.destroy()
      const reloadedPost = await Post.unscoped().last()
      expect(reloadedPost!.position).toBeNull()
    })
  })

  it('calls all model hooks', async () => {
    const post = await Post.create({ body: 'hello', user })

    const hooksSpy = jest.spyOn(runHooksForModule, 'default')
    const commitHooksSpy = jest.spyOn(safelyRunCommitHooksModule, 'default')

    await post.destroy()

    expect(hooksSpy).toHaveBeenCalledWith(
      'beforeDestroy',
      expect.toMatchDreamModel(post),
      true,
      null,
      expect.any(DreamTransaction)
    )
    expect(hooksSpy).toHaveBeenCalledWith(
      'afterDestroy',
      expect.toMatchDreamModel(post),
      true,
      null,
      expect.any(DreamTransaction)
    )
    expect(commitHooksSpy).toHaveBeenCalledWith(
      expect.toMatchDreamModel(post),
      'afterDestroyCommit',
      true,
      null,
      expect.any(DreamTransaction)
    )
  })

  it('hides deleted records from scope by default', async () => {
    const post = await Post.create({ body: 'hello', user })
    await post.destroy()
    expect(await Post.last()).toBeNull()
    expect(await Post.unscoped().last()).toMatchDreamModel(post)
  })

  context('within a transaction', () => {
    it('applies transaction to update query', async () => {
      await ApplicationModel.transaction(async txn => {
        const post = await Post.txn(txn).create({ body: 'hello', user })
        await post.txn(txn).destroy()
        const reloadedPost = await Post.txn(txn).last()
        expect(reloadedPost).toBeNull()
      })
    })
  })

  context('deletedAt field is missing', () => {
    it('raises a targeted exception', async () => {
      const model = await ModelWithoutDeletedAt.create()
      await expect(async () => await model.destroy()).rejects.toThrow(MissingDeletedAtFieldForSoftDelete)
    })
  })

  context('deletedAt field is present, but pointing to a non-datetime field', () => {
    it('raises a targeted exception', async () => {
      const model = await ModelWithoutCustomDeletedAt.create()
      await expect(async () => await model.destroy()).rejects.toThrow(MissingDeletedAtFieldForSoftDelete)
    })
  })
})
