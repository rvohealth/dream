import Dream from '../../dream'
import pascalize from '../../helpers/pascalize'
import BeforeSave from '../hooks/before-save'
import AfterCreateCommit from '../hooks/after-create-commit'
import AfterUpdateCommit from '../hooks/after-update-commit'
import AfterDestroyCommit from '../hooks/after-destroy-commit'
import beforeSortableSave from './hooks/beforeSortableSave'
import afterSortableDestroy from './hooks/afterSortableDestroy'
import scopeArray from './helpers/scopeArray'
import DreamTransaction from '../../dream/transaction'
import AfterCreate from '../hooks/after-create'
import AfterUpdate from '../hooks/after-update'
import AfterDestroy from '../hooks/after-destroy'
import afterSortableCreate from './hooks/afterSortableCreate'
import afterUpdateSortable from './hooks/afterSortableUpdate'

export default function Sortable(opts: SortableOpts = {}): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'sortableFields')) dreamClass['sortableFields'] = []
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
    ;(dreamClass as any).prototype[beforeSaveMethodName] = async function (txn?: DreamTransaction<any>) {
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
    ;(dreamClass as any).prototype[afterUpdateMethodName] = async function (txn?: DreamTransaction<any>) {
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
    ;(dreamClass as any).prototype[afterUpdateCommitMethodName] = async function (
      txn?: DreamTransaction<any>
    ) {
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
    ;(dreamClass as any).prototype[afterCreateMethodName] = async function (txn?: DreamTransaction<any>) {
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
    ;(dreamClass as any).prototype[afterCreateCommitMethodName] = async function (
      txn?: DreamTransaction<any>
    ) {
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
    ;(dreamClass as any).prototype[afterDestroyMethodName] = async function (txn?: DreamTransaction<any>) {
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
    ;(dreamClass as any).prototype[afterDestroyCommitMethodName] = async function (
      txn?: DreamTransaction<any>
    ) {
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

    BeforeSave()(target, beforeSaveMethodName)
    AfterCreate()(target, afterCreateMethodName)
    AfterCreateCommit()(target, afterCreateCommitMethodName)
    AfterUpdate()(target, afterUpdateMethodName)
    AfterUpdateCommit()(target, afterUpdateCommitMethodName)
    AfterDestroy()(target, afterDestroyMethodName)
    AfterDestroyCommit()(target, afterDestroyCommitMethodName)
  }
}

export interface SortableOpts {
  scope?: string | string[]
}

export interface SortableFieldConfig {
  scope: string[]
  positionField: string
}
