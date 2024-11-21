import { HookStatement, HookType } from '../../decorators/hooks/shared'
import Dream from '../../Dream'
import DreamTransaction from '../DreamTransaction'

export default async function runHooksFor<T extends Dream>(
  key: HookType,
  dream: T,
  alreadyPersisted: boolean,
  beforeSaveChanges: Partial<Record<string, { was: any; now: any }>> | null,
  txn?: DreamTransaction<any>
): Promise<void> {
  const Base = dream.constructor as typeof Dream
  for (const statement of Base['hooks'][key]) {
    if (statement.ifChanging?.length) {
      switch (key) {
        case 'beforeCreate':
          await runConditionalBeforeHooksForCreate(dream, statement, txn)
          break

        case 'beforeSave':
          if (alreadyPersisted) await runConditionalBeforeHooksForUpdate(dream, statement, txn)
          else await runConditionalBeforeHooksForCreate(dream, statement, txn)
          break

        case 'beforeUpdate':
          await runConditionalBeforeHooksForUpdate(dream, statement, txn)
          break

        default:
          throw new Error(`Unexpected statement key detected with ifChanging clause: ${key}`)
      }
    } else if (statement.ifChanged?.length) {
      switch (key) {
        case 'afterCreate':
        case 'afterCreateCommit':
          await runConditionalAfterHooksForCreate(dream, statement, beforeSaveChanges, txn)
          break

        case 'afterSave':
        case 'afterSaveCommit':
          if (alreadyPersisted) await runConditionalAfterHooksForUpdate(dream, statement, txn)
          else await runConditionalAfterHooksForCreate(dream, statement, beforeSaveChanges, txn)
          break

        case 'afterUpdate':
        case 'afterUpdateCommit':
          await runConditionalAfterHooksForUpdate(dream, statement, txn)
          break

        default:
          throw new Error(`Unexpected statement key detected with ifChanged clause: ${key}`)
      }
    } else {
      await runHook(statement, dream, txn)
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

Please make sure "${statement.method}" is defined on ${dream.constructor.name}
`
    )
  }
  await (dream as any)[statement.method](txn)
}

async function runConditionalBeforeHooksForCreate(
  dream: Dream,
  statement: HookStatement,
  txn?: DreamTransaction<any>
) {
  let shouldRun = false
  for (const attribute of statement.ifChanging!) {
    if ((dream as any)[attribute] !== undefined) shouldRun = true
  }

  if (shouldRun) await runHook(statement, dream, txn)
}

async function runConditionalAfterHooksForCreate(
  dream: Dream,
  statement: HookStatement,
  beforeSaveChanges: Partial<Record<string, { was: any; now: any }>> | null,
  txn?: DreamTransaction<any>
) {
  let shouldRun = false
  for (const attribute of statement.ifChanged!) {
    if (
      beforeSaveChanges?.[attribute] &&
      beforeSaveChanges[attribute].was !== beforeSaveChanges[attribute].now
    )
      shouldRun = true
  }

  if (shouldRun) await runHook(statement, dream, txn)
}

async function runConditionalBeforeHooksForUpdate(
  dream: Dream,
  statement: HookStatement,
  txn?: DreamTransaction<any>
) {
  let shouldRun = false
  for (const attribute of statement.ifChanging!) {
    if (dream.willSaveChangeToAttribute(attribute as any)) shouldRun = true
  }

  if (shouldRun) await runHook(statement, dream, txn)
}

async function runConditionalAfterHooksForUpdate(
  dream: Dream,
  statement: HookStatement,
  txn?: DreamTransaction<any>
) {
  let shouldRun = false
  for (const attribute of statement.ifChanged!) {
    if (dream.savedChangeToAttribute(attribute as any)) shouldRun = true
  }

  if (shouldRun) await runHook(statement, dream, txn)
}
