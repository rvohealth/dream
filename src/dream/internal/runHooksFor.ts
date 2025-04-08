import Dream from '../../Dream.js'
import { HookStatement, HookType } from '../../types/lifecycle.js'
import DreamTransaction from '../DreamTransaction.js'

export default async function runHooksFor<T extends Dream>(
  key: HookType,
  dream: T,
  alreadyPersisted: boolean,
  beforeSaveChanges: Partial<Record<string, { was: any; now: any }>> | null,
  txn?: DreamTransaction<any>
): Promise<void> {
  const Base = dream.constructor as typeof Dream
  for (const hook of Base['hooks'][key]) {
    if (hook.ifChanging?.length) {
      switch (key) {
        case 'beforeCreate':
          if (shouldRunBeforeCreateHook(dream, hook)) {
            await runHook(hook, dream, txn)
          }
          break

        case 'beforeSave':
          if (
            (alreadyPersisted && shouldRunBeforeUpdateHook(dream, hook)) ||
            (!alreadyPersisted && shouldRunBeforeCreateHook(dream, hook))
          ) {
            await runHook(hook, dream, txn)
          }

          break

        case 'beforeUpdate':
          if (shouldRunBeforeUpdateHook(dream, hook)) {
            await runHook(hook, dream, txn)
          }
          break

        default:
          throw new Error(`Unexpected statement key detected with ifChanging clause: ${key}`)
      }
    } else if (hook.ifChanged?.length) {
      switch (key) {
        case 'afterCreate':
          if (shouldRunAfterCreateHook(dream, hook, beforeSaveChanges)) {
            await runHook(hook, dream, txn)
          }
          break

        case 'afterCreateCommit':
          if (shouldRunAfterCreateHook(dream, hook, beforeSaveChanges)) {
            if (txn) txn.addCommitHook(hook, dream)
            else await runHook(hook, dream)
          }
          break

        case 'afterSave':
          if (
            (alreadyPersisted && shouldRunAfterUpdateHook(dream, hook)) ||
            (!alreadyPersisted && shouldRunAfterCreateHook(dream, hook, beforeSaveChanges))
          ) {
            await runHook(hook, dream, txn)
          }
          break

        case 'afterSaveCommit':
          if (
            (alreadyPersisted && shouldRunAfterUpdateHook(dream, hook)) ||
            (!alreadyPersisted && shouldRunAfterCreateHook(dream, hook, beforeSaveChanges))
          ) {
            if (txn) txn.addCommitHook(hook, dream)
            else await runHook(hook, dream)
          }
          break

        case 'afterUpdate':
          if (shouldRunAfterUpdateHook(dream, hook)) {
            await runHook(hook, dream, txn)
          }
          break

        case 'afterUpdateCommit':
          if (shouldRunAfterUpdateHook(dream, hook)) {
            if (txn) txn.addCommitHook(hook, dream)
            else await runHook(hook, dream)
          }

          break

        default:
          throw new Error(`Unexpected statement key detected with ifChanged clause: ${key}`)
      }
    } else {
      switch (key) {
        case 'afterCreateCommit':
        case 'afterSaveCommit':
        case 'afterUpdateCommit':
        case 'afterDestroyCommit':
          if (txn) txn.addCommitHook(hook, dream)
          else await runHook(hook, dream)
          break

        default:
          await runHook(hook, dream, txn)
      }
    }
  }
}

export async function runHook<T extends Dream>(
  statement: HookStatement,
  dream: T,
  txn?: DreamTransaction<any>
) {
  if (typeof (dream as any)[statement.method] !== 'function') {
    throw new Error(
      `
Attempting to run ${statement.method} as part of the ${statement.type}
Dream model hook sequence, but we encountered a method that does not exist.

Please make sure "${statement.method}" is defined on ${dream['sanitizedConstructorName']}
`
    )
  }
  await (dream as any)[statement.method](txn)
}

function shouldRunBeforeCreateHook(dream: Dream, statement: HookStatement): boolean {
  let shouldRun = false
  for (const attribute of statement.ifChanging!) {
    if ((dream as any)[attribute] !== undefined) shouldRun = true
  }

  return shouldRun
}

function shouldRunAfterCreateHook(
  dream: Dream,
  statement: HookStatement,
  beforeSaveChanges: Partial<Record<string, { was: any; now: any }>> | null
): boolean {
  let shouldRun = false
  for (const attribute of statement.ifChanged!) {
    if (
      beforeSaveChanges?.[attribute] &&
      beforeSaveChanges[attribute].was !== beforeSaveChanges[attribute].now
    )
      shouldRun = true
  }

  return shouldRun
}

function shouldRunBeforeUpdateHook(dream: Dream, statement: HookStatement): boolean {
  let shouldRun = false
  for (const attribute of statement.ifChanging!) {
    if (dream.willSaveChangeToAttribute(attribute as any)) shouldRun = true
  }

  return shouldRun
}

function shouldRunAfterUpdateHook(dream: Dream, statement: HookStatement): boolean {
  let shouldRun = false
  for (const attribute of statement.ifChanged!) {
    if (dream.savedChangeToAttribute(attribute as any)) shouldRun = true
  }

  return shouldRun
}
