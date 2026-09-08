import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import User from '../../../test-app/app/models/User.js'

// type tests intentionally skipped, since they will fail on build instead.
context.skip('instance mutation option types', () => {
  it('rejects query-level lock options for destroy operations', async () => {
    const lockOptions = { lock: true, cascade: false }
    const user = User.new()

    // @ts-expect-error lock is only supported by Query#destroy
    await user.destroy({ lock: true })
    // @ts-expect-error lock is only supported by Query#destroy, including when passed indirectly
    await user.destroy(lockOptions)
    // @ts-expect-error lock is only supported by Query#destroy
    await user.reallyDestroy(lockOptions)
    // @ts-expect-error lock is only supported by Query#destroy
    await user.undestroy(lockOptions)
    // @ts-expect-error lock is only supported by Query#destroy
    await user.destroyAssociation('posts', lockOptions)
    // @ts-expect-error lock is only supported by Query#destroy
    await user.reallyDestroyAssociation('posts', lockOptions)
    // @ts-expect-error lock is only supported by Query#destroy
    await user.undestroyAssociation('posts', lockOptions)
  })

  it('rejects query-level lock options for update operations', async () => {
    const lockOptions = { lock: true, skipHooks: false }
    const user = User.new()

    // @ts-expect-error lock is only supported by Query#update
    await user.update({ name: 'Sally' }, { lock: true })
    // @ts-expect-error lock is only supported by Query#update, including when passed indirectly
    await user.update({ name: 'Sally' }, lockOptions)
    // @ts-expect-error lock is only supported by Query#update
    await user.updateAttributes({ name: 'Sally' }, lockOptions)
    // @ts-expect-error lock is only supported by Query#update
    await user.updateAssociation('posts', { body: 'updated' }, lockOptions)
  })

  context('in a transaction', () => {
    it('rejects query-level lock options for destroy operations', async () => {
      const lockOptions = { lock: true, cascade: false }
      const user = User.new()

      await ApplicationModel.transaction(async txn => {
        // @ts-expect-error lock is only supported by Query#destroy
        await user.txn(txn).destroy(lockOptions)
        // @ts-expect-error lock is only supported by Query#destroy
        await user.txn(txn).reallyDestroy(lockOptions)
        // @ts-expect-error lock is only supported by Query#destroy
        await user.txn(txn).undestroy(lockOptions)
        // @ts-expect-error lock is only supported by Query#destroy
        await user.txn(txn).destroyAssociation('posts', lockOptions)
        // @ts-expect-error lock is only supported by Query#destroy
        await user.txn(txn).reallyDestroyAssociation('posts', lockOptions)
        // @ts-expect-error lock is only supported by Query#destroy
        await user.txn(txn).undestroyAssociation('posts', lockOptions)
      })
    })

    it('rejects query-level lock options for update operations', async () => {
      const lockOptions = { lock: true, skipHooks: false }
      const user = User.new()

      await ApplicationModel.transaction(async txn => {
        // @ts-expect-error lock is only supported by Query#update
        await user.txn(txn).update({ name: 'Sally' }, lockOptions)
        // @ts-expect-error lock is only supported by Query#update
        await user.txn(txn).updateAttributes({ name: 'Sally' }, lockOptions)
        // @ts-expect-error lock is only supported by Query#update
        await user.txn(txn).updateAssociation('posts', { body: 'updated' }, lockOptions)
      })
    })
  })
})
