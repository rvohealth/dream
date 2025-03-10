import Dream from '../../Dream.js'
import DreamTransaction from '../../dream/DreamTransaction.js'
import pascalize from '../../helpers/pascalize.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import { afterCreateImplementation } from '../hooks/AfterCreate.js'
import { afterCreateCommitImplementation } from '../hooks/AfterCreateCommit.js'
import { afterDestroyImplementation } from '../hooks/AfterDestroy.js'
import { afterDestroyCommitImplementation } from '../hooks/AfterDestroyCommit.js'
import { afterUpdateImplementation } from '../hooks/AfterUpdate.js'
import { afterUpdateCommitImplementation } from '../hooks/AfterUpdateCommit.js'
import { beforeSaveImplementation } from '../hooks/BeforeSave.js'
import scopeArray from './helpers/scopeArray.js'
import afterSortableCreate from './hooks/afterSortableCreate.js'
import afterSortableDestroy from './hooks/afterSortableDestroy.js'
import afterUpdateSortable from './hooks/afterSortableUpdate.js'
import beforeSortableSave from './hooks/beforeSortableSave.js'

export default function Sortable(opts: SortableOpts = {}): any {
  return function (_: undefined, context: DecoratorContext) {
    const key = context.name

    context.addInitializer(function (this: Dream) {
      const dream = this
      const dreamClass: typeof Dream = dream.constructor as typeof Dream
      if (!dreamClass['globallyInitializingDecorators']) return

      if (dreamClass['sti']['active']) {
        if (!(dreamClass instanceof dreamClass['stiBaseClassOrOwnClass'])) {
          // what we should really be doing is throwing CannotCallSortableOnSTIChild,
          // but we cannot, since there is no way to know during this initializer if
          // the Sortable decorator was applied to the STI child, or the STI parent.
          //
          // because of this bizarre issue, we are forced to early return when
          // we are processing Sortable on an STI child.
          // throw new CannotCallSortableOnSTIChild(dreamClass)
          return
        }
      }

      if (!Object.getOwnPropertyDescriptor(dreamClass, 'sortableFields')) {
        // This pattern allows `sortableFields` on a base STI class and on
        // child STI classes. The new `sortableFields` property will be created
        // on the child STI class, but it will include all the `sortableFields`
        // already declared on the base STI class.
        dreamClass['sortableFields'] = [...dreamClass['sortableFields']]
      }
      ;(dreamClass['sortableFields'] as SortableFieldConfig[]).push({
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

      const dreamPrototype = Object.getPrototypeOf(dream)
      // before saving, we remember the new value for position, but clear it from our
      // supervised attributes to prevent position from saving
      dreamPrototype[beforeSaveMethodName] = async function (txn?: DreamTransaction<any>) {
        let query = dreamClass.query()
        if (txn) query = query.txn(txn)

        await beforeSortableSave({
          dream: this,
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
          dream: this,
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
          dream: this,
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
          dream: this,
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
          dream: this,
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
          dream: this,
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
          dream: this,
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
  }
}

interface SortableOpts {
  scope?: string | string[]
}

export interface SortableFieldConfig {
  scope: string[]
  positionField: string
}
