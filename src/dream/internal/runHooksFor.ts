import { HookStatement, HookType } from '../../decorators/hooks/shared'
import Dream from '../../dream'
import DreamTransaction from '../transaction'

export default async function runHooksFor<T extends Dream>(
  key: HookType,
  dream: T,
  txn?: DreamTransaction<any>
): Promise<void> {
  if (['beforeCreate', 'beforeSave', 'beforeUpdate'].includes(key)) {
    ensureSTITypeFieldIsSet(dream)
  }

  const Base = dream.constructor as typeof Dream
  for (const statement of Base['hooks'][key]) {
    if (statement.ifChanging?.length) {
      let shouldRun = false
      switch (key) {
        case 'beforeCreate':
        case 'beforeSave':
        case 'beforeUpdate':
          for (const attribute of statement.ifChanging) {
            if (dream.isNewRecord && (dream as any)[attribute] !== undefined) shouldRun = true
            if (dream.isPersisted && dream.willSaveChangeToAttribute(attribute as any)) {
              shouldRun = true
            }
          }

          if (shouldRun) await runHook(statement, dream, txn)
          break
      }
    } else if (statement.ifChanged?.length) {
      let shouldRun = false

      switch (key) {
        case 'afterCreate':
        case 'afterCreateCommit':
        case 'afterSave':
        case 'afterSaveCommit':
        case 'afterUpdate':
        case 'afterUpdateCommit':
          for (const attribute of statement.ifChanged) {
            // if (dream.isNewRecord && ![undefined, null].includes((dream as any)[attribute])) shouldRun = true
            if (
              dream.isPersisted &&
              dream.savedChangeToAttribute(attribute as any) &&
              ![undefined, null].includes((dream as any)[attribute])
            ) {
              shouldRun = true
            }
          }

          if (shouldRun) await runHook(statement, dream, txn)
          break

        default:
          await runHook(statement, dream, txn)
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
  await (dream as any)[statement.method](txn)
}

function ensureSTITypeFieldIsSet<T extends Dream>(dream: T) {
  // todo: turn STI logic here into before create applied by decorator
  const Base = dream.constructor as typeof Dream
  if (Base['sti'].value && !(dream as any).type) {
    ;(dream as any).type = Base['sti'].value
  }
}
