import { applySortableScopesToQuery } from '../../decorators/sortable/helpers/setPosition'
import Dream from '../../dream'
import DreamTransaction from '../transaction'
import { AllDefaultScopeNames } from '../types'
import runHooksFor from './runHooksFor'
import safelyRunCommitHooks from './safelyRunCommitHooks'

/**
 * @internal
 *
 * Destroys the Dream and any `dependent: 'destroy'` associations
 * within a transaction. If a transaction is passed, it will be used.
 * Otherwise, a new transaction will be created automatically.
 * If any of the nested associations fails to destroy, then this
 * record will also fail to destroy. If skipHooks is true, model hooks
 * will be bypassed.
 */
export default async function undestroyDream<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I> | null = null,
  {
    bypassAllDefaultScopes,
    defaultScopesToBypass,
    cascade,
    skipHooks,
  }: {
    bypassAllDefaultScopes: boolean
    defaultScopesToBypass: string[]
    cascade: boolean
    skipHooks: boolean
  }
): Promise<I> {
  if (txn) {
    return await undestroyDreamWithTransaction(dream, txn, {
      bypassAllDefaultScopes,
      defaultScopesToBypass,
      cascade,
      skipHooks,
    })
  } else {
    const dreamClass = dream.constructor as typeof Dream
    return await dreamClass.transaction(
      async txn =>
        await undestroyDreamWithTransaction<I>(dream, txn, {
          bypassAllDefaultScopes,
          defaultScopesToBypass,
          cascade,
          skipHooks,
        })
    )
  }
}

/**
 * @internal
 *
 * Given a transaction, applies the destroy query,
 * including cascading to child associations and
 * model hooks.
 */
async function undestroyDreamWithTransaction<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  {
    bypassAllDefaultScopes = false,
    defaultScopesToBypass = [],
    cascade = true,
    skipHooks = false,
  }: {
    bypassAllDefaultScopes?: boolean
    defaultScopesToBypass?: AllDefaultScopeNames<I['dreamconf']>[]
    cascade?: boolean
    skipHooks?: boolean
  } = {}
): Promise<I> {
  if (!skipHooks) {
    await runHooksFor('beforeUpdate', dream, true, null, txn)
  }

  await doUndestroyDream(dream, txn)

  if (cascade) {
    await undestroyAssociatedRecords(dream, txn, {
      bypassAllDefaultScopes,
      defaultScopesToBypass,
      skipHooks,
    })
  }

  if (!skipHooks) {
    await runHooksFor('afterUpdate', dream, true, null, txn)
    await safelyRunCommitHooks(dream, 'afterUpdateCommit', true, null, txn)
  }

  await dream.txn(txn).reload()
  return dream
}

/**
 * @internal
 *
 * Destroys the dream iff it was not blocked from
 * deleting by one of the beforeDestroy model hooks
 */
async function doUndestroyDream<I extends Dream>(dream: I, txn: DreamTransaction<I>) {
  let query = txn.kyselyTransaction
    .updateTable(dream.table as any)
    .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
    .set({ [dream.deletedAtField]: null } as any)

  const dreamClass = dream.constructor as typeof Dream

  dreamClass['sortableFields']?.forEach(sortableFieldMetadata => {
    const positionColumn = sortableFieldMetadata.positionField
    query = query.set(
      eb =>
        ({
          [positionColumn]: eb(
            applySortableScopesToQuery(
              dream,
              txn.kyselyTransaction.selectFrom(dream.table),
              column => (dream as any)[column],
              sortableFieldMetadata.scope
            ).select(eb => eb.fn.max(positionColumn).as(positionColumn + '_max')) as any,
            '+',
            1
          ),
        }) as any
    )
  })

  return await query.execute()
}

/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`
 */
async function undestroyAssociatedRecords<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  {
    bypassAllDefaultScopes = false,
    defaultScopesToBypass = [],
    skipHooks = false,
  }: {
    bypassAllDefaultScopes?: boolean
    defaultScopesToBypass?: string[]
    skipHooks?: boolean
  } = {}
) {
  const dreamClass = dream.constructor as typeof Dream

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    const associationMetadata = dreamClass['associationMetadataMap']()[associationName]
    const associatedClass = associationMetadata?.modelCB?.()
    if (Array.isArray(associatedClass)) {
      // TODO: decide how to handle polymorphic associations with dependent: destroy
      // raise?
    } else {
      if (associatedClass?.['softDelete']) {
        await dream.txn(txn).undestroyAssociation(associationName as any, {
          bypassAllDefaultScopes,
          defaultScopesToBypass,
          skipHooks,
          cascade: true,
        })
      }
    }
  }
}
