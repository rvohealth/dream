import { CommitHookType } from '../../decorators/hooks/shared.js.js'
import Dream from '../../Dream.js.js'
import DreamTransaction from '../DreamTransaction.js.js'
import { DreamConstructorType } from '../types.js.js'
import runHooksFor from './runHooksFor.js.js'

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
