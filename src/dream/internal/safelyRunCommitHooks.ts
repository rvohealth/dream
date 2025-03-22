import Dream from '../../Dream.js'
import { DreamConstructorType } from '../../types/dream.js'
import { CommitHookType } from '../../types/lifecycle.js'
import DreamTransaction from '../DreamTransaction.js'
import runHooksFor from './runHooksFor.js'

export default async function safelyRunCommitHooks<DreamInstance extends Dream>(
  dream: DreamInstance,
  hookType: CommitHookType,
  alreadyPersisted: boolean,
  beforeSaveChanges: Partial<Record<string, { was: any; now: any }>> | null,
  txn: DreamTransaction<Dream> | null = null
) {
  const Base = dream.constructor as DreamConstructorType<DreamInstance>
  if (txn) {
    Base['hooks'][hookType].forEach(hook => {
      txn.addCommitHook(hook, dream)
    })
  } else {
    await runHooksFor(hookType, dream, alreadyPersisted, beforeSaveChanges)
  }
}
