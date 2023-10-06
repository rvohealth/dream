import Dream from '../../dream'
import pascalize from '../../helpers/pascalize'
import Query from '../../dream/query'
import BeforeSave from '../hooks/before-save'
import AfterCreateCommit from '../hooks/after-create-commit'
import AfterUpdateCommit from '../hooks/after-update-commit'
import AfterDestroyCommit from '../hooks/after-destroy-commit'
import beforeSortableSave from './hooks/beforeSortableSave'
import afterUpdateSortableCommit from './hooks/afterSortableUpdateCommit'
import afterSortableCreateCommit from './hooks/afterSortableCreateCommit'
import afterSortableDestroyCommit from './hooks/afterSortableDestroyCommit'
import resortAllRecords from './helpers/resortAllRecords'
import scopeArray from './helpers/scopeArray'

export default function Sortable(opts: SortableOpts = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'sortableFields')) dreamClass.sortableFields = []
    dreamClass.sortableFields.push({
      scope: scopeArray(opts.scope),
      positionField: key,
    })

    const positionField = key
    const query = new Query(dreamClass)

    const beforeSaveMethodName = `_cacheValueFor${pascalize(key)}`
    const afterUpdateMethodName = `_updateValueFor${pascalize(key)}`
    const afterCreateMethodName = `_setNewValueFor${pascalize(key)}`
    const afterDestroyMethodName = `_setValuesAfterDestructionFor${pascalize(key)}`

    // before saving, we remember the new value for position, but clear it from our
    // supervised attributes to prevent position from saving
    ;(dreamClass as any).prototype[beforeSaveMethodName] = async function () {
      await beforeSortableSave({
        dream: this,
        positionField,
        query,
        scope: opts.scope,
      })
    }

    // once saved, we can now safely update position in isolation
    ;(dreamClass as any).prototype[afterUpdateMethodName] = async function () {
      await afterUpdateSortableCommit({
        dream: this,
        positionField,
        query,
        scope: opts.scope,
      })
    }

    // after create, we always want to ensure the position is set, so if they provide one,
    // we need to split existing records on position and update, but otherwise we simply set the new position
    // to be the length of all existing records + 1
    ;(dreamClass as any).prototype[afterCreateMethodName] = async function () {
      await afterSortableCreateCommit({
        dream: this,
        positionField,
        query,
        scope: opts.scope,
      })
    }

    // after destroy, auto-adjust positions of all related records with a greater position
    // than this one to maintain incrementing order,
    ;(dreamClass as any).prototype[afterDestroyMethodName] = async function () {
      await afterSortableDestroyCommit({
        dream: this,
        positionField,
        query,
        scope: opts.scope,
      })
    }

    BeforeSave()(target, beforeSaveMethodName)
    AfterCreateCommit()(target, afterCreateMethodName)
    AfterUpdateCommit()(target, afterUpdateMethodName)
    AfterDestroyCommit()(target, afterDestroyMethodName)
  }
}

export interface SortableOpts {
  scope?: string | string[] | string[]
}

export interface SortableFieldConfig {
  scope: string[]
  positionField: string
}
