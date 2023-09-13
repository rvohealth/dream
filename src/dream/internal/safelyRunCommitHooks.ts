import { CommitHookType } from '../../decorators/hooks/shared'
import Dream from '../../dream'
import DreamTransaction from '../transaction'
import { DreamConstructorType } from '../types'
import runHooksFor from './runHooksFor'

export default async function safelyRunCommitHooks<DreamInstance extends Dream>(
  dream: DreamInstance,
  hookType: CommitHookType,
  txn: DreamTransaction<DreamConstructorType<DreamInstance>> | null = null
) {
  const Base = dream.constructor as DreamConstructorType<DreamInstance>
  if (txn) {
    Base.hooks[hookType].forEach(hook => {
      txn!.addCommitHook(hook, dream)
    })
  } else {
    await runHooksFor(hookType, dream)
  }
}
