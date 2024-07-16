import Dream from '../../dream'
import DreamTransaction from '../transaction'
import { AllDefaultScopeNames } from '../types'

/**
 * @internal
 *
 * Destroys all HasOne/HasMany associations on this
 * dream that are marked as `dependent: 'destroy'`
 */
export default async function destroyAssociatedRecords<I extends Dream>(
  dream: I,
  txn: DreamTransaction<I>,
  {
    bypassAllDefaultScopes,
    defaultScopesToBypass,
    reallyDestroy,
    skipHooks,
  }: {
    bypassAllDefaultScopes: boolean
    defaultScopesToBypass: AllDefaultScopeNames<I['dreamconf']>[]
    reallyDestroy: boolean
    skipHooks: boolean
  }
) {
  const dreamClass = dream.constructor as typeof Dream

  const options = {
    bypassAllDefaultScopes,
    defaultScopesToBypass,
    cascade: true,
    skipHooks,
  }

  for (const associationName of dreamClass['dependentDestroyAssociationNames']()) {
    if (reallyDestroy) {
      await dream.txn(txn).reallyDestroyAssociation(associationName as any, options)
    } else {
      await dream.txn(txn).destroyAssociation(associationName as any, options)
    }
  }
}
