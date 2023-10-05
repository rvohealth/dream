import Dream from '../../dream'
import ops from '../../ops'
import db from '../../db'
import pascalize from '../../helpers/pascalize'
import NonExistentScopeProvidedToSortableDecorator from '../../exceptions/non-existent-scope-provided-to-sortable-decorator'
import range from '../../helpers/range'
import DreamTransaction from '../../dream/transaction'
import { ExpressionBuilder } from 'kysely'
import Query from '../../dream/query'
import { BelongsToStatement } from '../associations/belongs-to'
import { HasManyStatement } from '../associations/has-many'
import { HasOneStatement } from '../associations/has-one'
import NonBelongsToScopeProvidedToSortableDecorator from '../../exceptions/non-belongs-to-scope-provided-to-sortable-decorator'
import BeforeSave from '../hooks/before-save'
import AfterCreateCommit from '../hooks/after-create-commit'
import AfterUpdateCommit from '../hooks/after-update-commit'
import AfterDestroyCommit from '../hooks/after-destroy-commit'
import positionIsInvalid from './positionIsInvalid'
import applySortableScopeToQuery from './applySortableScopeToQuery'
import getForeignKeyForSortableScope from './getForeignKeyForSortableScope'
import decrementPositionForScopedRecordsGreaterThanPosition from './decrementScopedRecordsGreaterThanPosition'
import sortableQueryExcludingDream from './sortableQueryExcludingDream'
import clearCachedSortableValues from './clearCachedSortableValues'
import beforeSortableSave from './beforeSortableSave'
import setPosition from './setPosition'

export default function Sortable(opts: SortableOpts = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    const positionField = key
    const query = new Query(dreamClass)

    const cacheKey = `_cachedPositionFor${pascalize(key)}`
    const beforeSaveMethodName = `_cachePositionFor${pascalize(key)}`
    const afterUpdateMethodName = `_updatePositionFor${pascalize(key)}`
    const afterCreateMethodName = `_setNewPositionFor${pascalize(key)}`
    const afterDestroyMethodName = `_setPositionsAfterDestructionFor${pascalize(key)}`
    const cachedValuesName = `_${positionField}CachedValues`

    // before saving, we remember the new value for position, but clear it from our
    // supervised attributes to prevent position from saving
    ;(dreamClass as any).prototype[beforeSaveMethodName] = async function () {
      await beforeSortableSave({
        dream: this,
        positionField,
        cachedValuesName,
        cacheKey,
        query,
        scope: opts.scope,
      })
    }

    // once saved, we can now safely update position in isolation
    ;(dreamClass as any).prototype[afterUpdateMethodName] = async function () {
      if (!this[cacheKey]) return
      if (this[cachedValuesName]) {
        await setPosition(this[cachedValuesName] as any)
      } else {
        await setPosition({
          position: this[cacheKey],
          dream: this,
          positionField,
          scope: opts.scope,
          previousPosition: this.changes()[positionField]?.was,
          query,
        })
      }

      clearCachedSortableValues(this, cacheKey, cachedValuesName)
    }

    // after create, we always want to ensure the position is set, so if they provide one,
    // we need to split existing records on position and update, but otherwise we simply set the new position
    // to be the length of all existing records + 1
    ;(dreamClass as any).prototype[afterCreateMethodName] = async function () {
      await setPosition({
        position: this[cacheKey],
        dream: this,
        positionField,
        scope: opts.scope,
        previousPosition: this.changes()[positionField]?.was,
        query,
      })
      clearCachedSortableValues(this, cacheKey, cachedValuesName)
    }

    // after destroy, auto-adjust positions of all related records to maintain incrementing order
    ;(dreamClass as any).prototype[afterDestroyMethodName] = async function () {
      await decrementPositionForScopedRecordsGreaterThanPosition(this[positionField], {
        dream: this,
        positionField,
        scope: opts.scope,
        query,
      })
      clearCachedSortableValues(this, cacheKey, cachedValuesName)
    }

    BeforeSave()(target, beforeSaveMethodName)
    AfterCreateCommit()(target, afterCreateMethodName)
    AfterUpdateCommit()(target, afterUpdateMethodName)
    AfterDestroyCommit()(target, afterDestroyMethodName)
  }
}

export interface SortableOpts {
  scope?: string
}
