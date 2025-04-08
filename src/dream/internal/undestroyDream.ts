import { applySortableScopesToQuery } from '../../decorators/field/sortable/helpers/setPosition.js'
import Dream from '../../Dream.js'
import DreamTransaction from '../DreamTransaction.js'
import { DestroyOptions as OptionalDestroyOptions } from './destroyOptions.js'
import runHooksFor from './runHooksFor.js'

type UndestroyOptions<DreamInstance extends Dream> = Required<OptionalDestroyOptions<DreamInstance>>

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
  options: UndestroyOptions<I>
): Promise<I> {
  if (txn) {
    return await undestroyDreamWithTransaction(dream, txn, options)
  } else {
    const dreamClass = dream.constructor as typeof Dream
    return await dreamClass.transaction(
      async txn => await undestroyDreamWithTransaction<I>(dream, txn, options)
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
  options: UndestroyOptions<I>
): Promise<I> {
  const { cascade, skipHooks } = options

  if (!skipHooks) {
    await runHooksFor('beforeUpdate', dream, true, null, txn)
  }

  await doUndestroyDream(dream, txn)

  if (cascade) {
    await undestroyAssociatedRecords(dream, txn, options)
  }

  if (!skipHooks) {
    await runHooksFor('afterUpdate', dream, true, null, txn)
    await runHooksFor('afterUpdateCommit', dream, true, null, txn)
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
  options: UndestroyOptions<I>
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
        await dream.txn(txn).undestroyAssociation(associationName as any, options)
      }
    }
  }
}
