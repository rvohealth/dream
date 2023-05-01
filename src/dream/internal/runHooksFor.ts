import { HookStatement, HookType } from '../../decorators/hooks/shared'
import Dream from '../../dream'

export default async function runHooksFor<T extends Dream>(key: HookType, dream: T): Promise<void> {
  if (['beforeCreate', 'beforeSave', 'beforeUpdate'].includes(key)) {
    ensureSTITypeFieldIsSet(dream)
  }

  const Base = dream.constructor as typeof Dream
  for (const statement of Base.hooks[key]) {
    await runHook(statement, dream)
  }
}

export async function runHook<T extends Dream>(statement: HookStatement, dream: T) {
  const Base = dream.constructor as typeof Dream
  try {
    await (dream as any)[statement.method]()
  } catch (error) {
    throw `
        Error running ${statement.type} on ${Base.name}
        ${error}
        statement.method: ${statement.method}
      `
  }
}

function ensureSTITypeFieldIsSet<T extends Dream>(dream: T) {
  // todo: turn STI logic here into before create applied by decorator
  const Base = dream.constructor as typeof Dream
  if (Base.sti.value && Base.sti.column) {
    ;(dream as any)[Base.sti.column] = Base.sti.value
  }
}
