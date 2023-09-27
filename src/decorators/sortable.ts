import Dream from '../dream'
import { blankHooksFactory } from './hooks/shared'
import ops from '../ops'
import db from '../db'
import pascalize from '../helpers/pascalize'
import NonExistentScopeProvidedToSortableDecorator from '../exceptions/non-existent-scope-provided-to-sortable-decorator'
import range from '../helpers/range'
import DreamTransaction from '../dream/transaction'
import { ExpressionBuilder } from 'kysely'
import Query from '../dream/query'
import { BelongsToStatement } from './associations/belongs-to'
import { HasManyStatement } from './associations/has-many'
import { HasOneStatement } from './associations/has-one'
import NonBelongsToScopeProvidedToSortableDecorator from '../exceptions/non-belongs-to-scope-provided-to-sortable-decorator'

export default function Sortable(opts: SortableOpts = {}): any {
  return function (target: any, key: string, _: any) {
    const dreamClass: typeof Dream = target.constructor

    if (!Object.getOwnPropertyDescriptor(dreamClass, 'hooks'))
      dreamClass.hooks = blankHooksFactory(dreamClass)

    const positionField = key

    const cacheKey = `_cachedPositionFor${pascalize(key)}`
    const beforeSaveMethodName = `_cachePositionFor${pascalize(key)}`
    const afterUpdateMethodName = `_updatePositionFor${pascalize(key)}`
    const afterCreateMethodName = `_setNewPositionFor${pascalize(key)}`
    const afterDestroyMethodName = `_setPositionsAfterDestructionFor${pascalize(key)}`
    const cachedValuesName = `_${positionField}CachedValues`

    // before saving, we remember the new value for position, but clear it from our
    // supervised attributes to prevent position from saving
    ;(dreamClass as any).prototype[beforeSaveMethodName] = async function () {
      if (!this.willSaveChangeToAttribute(positionField)) return

      const position = this[positionField]
      const totalRecordsQuery = applyScopeToQuery(
        new Query(this.constructor as typeof Dream),
        this,
        opts.scope
      )

      if (
        position === null ||
        position === undefined ||
        position < 1 ||
        position > (await totalRecordsQuery.count())
      ) {
        if (this.isPersisted) {
          this[positionField] = undefined
          return
        } else {
          this[cacheKey] = this.changes()[positionField]?.was
        }
      } else {
        this[cacheKey] = position
      }

      // if the only change being saved is a change to position
      // we can apply position changes immediately, rather than waiting for after hooks to fire.
      const dirtyFields = Object.keys((this as Dream).dirtyAttributes())
      const values = {
        position: this[cacheKey],
        dream: this,
        positionField,
        scope: opts.scope,
        previousPosition: this.changes()[positionField]?.was,
      }

      if (dirtyFields.length === 1 && dirtyFields.includes(positionField)) {
        await setPosition(values)
      } else {
        this[cachedValuesName] = values

        // if the previous value for this field was null or undefined, make sure to
        // set to a real integer to prevent non-null violations at DB level
        if (this.isPersisted) {
          this[positionField] = undefined
        } else {
          this[positionField] = 0
        }
      }
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
        })
      }

      clearCachedValues(this, cacheKey, cachedValuesName)
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
      })
      clearCachedValues(this, cacheKey, cachedValuesName)
    }

    // after destroy, auto-adjust positions of all related records to maintain incrementing order
    ;(dreamClass as any).prototype[afterDestroyMethodName] = async function () {
      autoadjustPositions({
        dream: this,
        positionField,
        scope: opts.scope,
      })
      clearCachedValues(this, cacheKey, cachedValuesName)
    }

    dreamClass.addHook('beforeSave', {
      method: beforeSaveMethodName,
      type: 'beforeSave',
      className: dreamClass.name,
    })

    dreamClass.addHook('afterCreateCommit', {
      method: afterCreateMethodName,
      type: 'afterCreateCommit',
      className: dreamClass.name,
    })

    dreamClass.addHook('afterUpdateCommit', {
      method: afterUpdateMethodName,
      type: 'afterUpdateCommit',
      className: dreamClass.name,
    })

    dreamClass.addHook('afterDestroyCommit', {
      method: afterDestroyMethodName,
      type: 'afterDestroyCommit',
      className: dreamClass.name,
    })
  }
}

async function setPosition({
  position,
  previousPosition,
  dream,
  positionField,
  scope,
}: {
  dream: Dream
  position: number
  previousPosition?: number
  positionField: string
  scope?: string
}) {
  if (position) {
    await setPositionFromValue({
      position,
      dream,
      positionField,
      scope,
      previousPosition,
    })
  } else {
    await setNewPosition({
      dream,
      positionField,
      scope,
    })
  }
}

async function setPositionFromValue({
  position,
  previousPosition,
  dream,
  positionField,
  scope,
}: {
  dream: Dream
  position: number
  previousPosition?: number
  positionField: string
  scope?: string
}) {
  const newPosition = position
  const increasing = previousPosition && previousPosition < newPosition

  await (dream.constructor as typeof Dream).transaction(async txn => {
    let query = new Query(dream.constructor as typeof Dream, { transaction: txn })
      .whereNot({ [dream.primaryKey]: dream.primaryKeyValue as any })
      .where({
        [positionField]: increasing
          ? range(previousPosition, newPosition)
          : range(newPosition, previousPosition),
      })
      .toKysely('update')
      .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => {
        return {
          [positionField]: eb(positionField, increasing ? '-' : '+', 1),
        }
      })

    const foreignKey = getForeignKeyForScope(dream, scope)
    if (foreignKey) {
      query = query.where(foreignKey, '=', (dream as any)[foreignKey])
    }

    await query.execute()

    await updatePositionForRecord(txn, dream, positionField, newPosition, scope)
  })

  await dream.reload()
}

async function setNewPosition({
  dream,
  positionField,
  scope,
}: {
  dream: Dream
  positionField: string
  scope?: string
}) {
  const numConflictingRecords = await buildSortableQuery(dream, scope).count()

  await db('primary', dream.dreamconf)
    .updateTable(dream.table as any)
    .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
    .set({
      [positionField]: numConflictingRecords + 1,
    })
    .execute()

  await dream.reload()
}

async function autoadjustPositions({
  dream,
  positionField,
  scope,
}: {
  dream: Dream
  positionField: string
  scope?: string
}) {
  const position = (dream as any)[positionField]

  let kyselyQuery = new Query(dream.constructor as typeof Dream)
    .whereNot({ [dream.primaryKey]: dream.primaryKeyValue as any })
    .where({
      [positionField]: ops.greaterThanOrEqualTo(position),
    })
    .toKysely('update')
    .set((eb: ExpressionBuilder<(typeof dream)['DB'], typeof dream.table>) => {
      return {
        [positionField]: eb(positionField, '-', 1),
      }
    })

  const foreignKey = getForeignKeyForScope(dream, scope)
  if (foreignKey) {
    kyselyQuery = kyselyQuery.where(foreignKey, '=', (dream as any)[foreignKey])
  }

  await kyselyQuery.execute()
}

async function updatePositionForRecord(
  txn: DreamTransaction<any>,
  dream: Dream,
  positionField: string,
  position: number,
  scope?: string
) {
  await txn.kyselyTransaction
    .updateTable(dream.table as any)
    .where(dream.primaryKey as any, '=', dream.primaryKeyValue)
    .set({
      [positionField]: position,
    })
    .execute()
}

function buildSortableQuery(dream: Dream, scope?: string) {
  let query = (dream.constructor as typeof Dream).whereNot({
    [dream.primaryKey]: dream.primaryKeyValue as any,
  })
  return applyScopeToQuery(query, dream, scope)
}

function applyScopeToQuery(query: Query<typeof Dream>, dream: Dream, scope?: string) {
  if (!scope) return query

  const foreignKey = getForeignKeyForScope(dream, scope)!
  return query.where({
    [foreignKey]: (dream as any)[foreignKey],
  })
}

function getForeignKeyForScope(dream: Dream, scope?: string) {
  if (!scope) return null
  const associationMetadata = (dream.associationMap() as any)[scope] as
    | BelongsToStatement<any, any, string>
    | HasManyStatement<any, any, string>
    | HasOneStatement<any, any, string>

  if (!associationMetadata)
    throw new NonExistentScopeProvidedToSortableDecorator(scope, dream.constructor as typeof Dream)

  if (associationMetadata.type !== 'BelongsTo')
    throw new NonBelongsToScopeProvidedToSortableDecorator(scope, dream.constructor as typeof Dream)

  return associationMetadata.foreignKey() as any
}

function clearCachedValues(dream: Dream, cacheKey: string, cachedValuesName: string) {
  ;(dream as any)[cacheKey] = undefined
  ;(dream as any)[cachedValuesName] = undefined
}

export interface SortableOpts {
  scope?: string
}
