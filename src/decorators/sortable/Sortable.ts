import Dream from '../../Dream'
import DreamTransaction from '../../dream/DreamTransaction'
import pascalize from '../../helpers/pascalize'
import { DecoratorContext } from '../DecoratorContextType'
import { afterCreateImplementation } from '../hooks/AfterCreate'
import { afterCreateCommitImplementation } from '../hooks/AfterCreateCommit'
import { afterDestroyImplementation } from '../hooks/AfterDestroy'
import { afterDestroyCommitImplementation } from '../hooks/AfterDestroyCommit'
import { afterUpdateImplementation } from '../hooks/AfterUpdate'
import { afterUpdateCommitImplementation } from '../hooks/AfterUpdateCommit'
import { beforeSaveImplementation } from '../hooks/BeforeSave'
import scopeArray from './helpers/scopeArray'
import afterSortableCreate from './hooks/afterSortableCreate'
import afterSortableDestroy from './hooks/afterSortableDestroy'
import afterUpdateSortable from './hooks/afterSortableUpdate'
import beforeSortableSave from './hooks/beforeSortableSave'

export default function Sortable(opts: SortableOpts = {}): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name
    return

    context.addInitializer(function (this: Dream) {
      const dream = this
      const dreamClass: typeof Dream = dream.constructor as typeof Dream
      const dreamPrototype = Object.getPrototypeOf(dream)
      if (!dreamClass['globallyInitializingDecorators']) return

      if (!Object.getOwnPropertyDescriptor(dreamClass, 'sortableFields'))
        dreamClass['sortableFields'] = [...(dreamClass['sortableFields'] || [])]
      dreamClass['sortableFields'].push({
        scope: scopeArray(opts.scope),
        positionField: key,
      })

      const positionField = key

      const beforeSaveMethodName = `_cacheValueFor${pascalize(key)}`
      const afterCreateMethodName = `_setNewValueFor${pascalize(key)}AfterCreate`
      const afterCreateCommitMethodName = `_setNewValueFor${pascalize(key)}AfterCreateCommit`
      const afterUpdateMethodName = `_updateValueFor${pascalize(key)}AfterUpdate`
      const afterUpdateCommitMethodName = `_updateValueFor${pascalize(key)}AfteUpdateCommit`
      const afterDestroyMethodName = `_setValuesAfterDestructionFor${pascalize(key)}AfterDestroy`
      const afterDestroyCommitMethodName = `_setValuesAfterDestructionFor${pascalize(key)}AfterDestroyCommit`

      // before saving, we remember the new value for position, but clear it from our
      // supervised attributes to prevent position from saving
      dreamPrototype[beforeSaveMethodName] = async function (txn?: DreamTransaction<any>) {
        let query = dreamClass.query()
        if (txn) query = query.txn(txn)

        await beforeSortableSave({
          dream,
          positionField,
          query,
          scope: opts.scope,
        })
      }

      // once saved, we can now safely update position in isolation
      dreamPrototype[afterUpdateMethodName] = async function (txn?: DreamTransaction<any>) {
        // if no transaction is provided, leverage update commit hook instead
        if (!txn) return
        const query = dreamClass.query().txn(txn)

        await afterUpdateSortable({
          dream,
          positionField,
          query,
          scope: opts.scope,
          txn,
        })
      }
      dreamPrototype[afterUpdateCommitMethodName] = async function (txn?: DreamTransaction<any>) {
        // if transaction is provided, leverage update hook instead
        if (txn) return
        const query = dreamClass.query()

        await afterUpdateSortable({
          dream,
          positionField,
          query,
          scope: opts.scope,
        })
      }

      // after create, we always want to ensure the position is set, so if they provide one,
      // we need to split existing records on position and update, but otherwise we simply set the new position
      // to be the length of all existing records + 1
      dreamPrototype[afterCreateMethodName] = async function (txn?: DreamTransaction<any>) {
        // if no transaction is provided, leverage create commit hook instead
        if (!txn) return
        const query = dreamClass.query().txn(txn)

        await afterSortableCreate({
          dream,
          positionField,
          query,
          scope: opts.scope,
          txn,
        })
      }
      dreamPrototype[afterCreateCommitMethodName] = async function (txn?: DreamTransaction<any>) {
        // if transaction is provided, leverage create hook instead
        if (txn) return
        const query = dreamClass.query()

        await afterSortableCreate({
          dream,
          positionField,
          query,
          scope: opts.scope,
        })
      }

      // after destroy, auto-adjust positions of all related records with a greater position
      // than this one to maintain incrementing order,
      dreamPrototype[afterDestroyMethodName] = async function (txn?: DreamTransaction<any>) {
        // if no transaction is provided, leverage destroy commit hook instead
        if (!txn) return
        const query = dreamClass.query().txn(txn)

        await afterSortableDestroy({
          dream,
          positionField,
          query,
          scope: opts.scope,
        })
      }
      dreamPrototype[afterDestroyCommitMethodName] = async function (txn?: DreamTransaction<any>) {
        // if transaction is provided, leverage destroy hook instead
        if (txn) return
        const query = dreamClass.query()

        await afterSortableDestroy({
          dream,
          positionField,
          query,
          scope: opts.scope,
        })
      }

      beforeSaveImplementation(dream, beforeSaveMethodName)
      afterCreateImplementation(dream, afterCreateMethodName)
      afterCreateCommitImplementation(dream, afterCreateCommitMethodName)
      afterUpdateImplementation(dream, afterUpdateMethodName)
      afterUpdateCommitImplementation(dream, afterUpdateCommitMethodName)
      afterDestroyImplementation(dream, afterDestroyMethodName)
      afterDestroyCommitImplementation(dream, afterDestroyCommitMethodName)
    })

    return function (this: Dream) {
      return this[key]
    }
  }
}

interface SortableOpts {
  scope?: string | string[]
}

export interface SortableFieldConfig {
  scope: string[]
  positionField: string
}
