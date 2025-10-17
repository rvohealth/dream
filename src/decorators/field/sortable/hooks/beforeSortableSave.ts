import Dream from '../../../../Dream.js'
import positionIsInvalid from '../helpers/positionIsInvalid.js'
import scopeArray from '../helpers/scopeArray.js'
import sortableCacheValuesName from '../helpers/sortableCacheValuesName.js'

export interface SortableCache {
  changingScope: boolean
  position: number | undefined
  previousPosition: number | undefined
  wasNewRecord: boolean
}

export default function beforeSortableSave({
  positionField,
  dream,
  scope,
}: {
  positionField: string
  dream: Dream
  scope: string | string[] | undefined
}) {
  const cachedValuesName = sortableCacheValuesName(positionField)
  const dreamAsAny = dream as any

  const changingScope =
    dream.isPersisted &&
    scopeArray(scope).filter(scopeField => {
      const association = dream['getAssociationMetadata'](scopeField)

      return association
        ? dream.willSaveChangeToAttribute(association.foreignKey())
        : dream.willSaveChangeToAttribute(scopeField as any)
    }).length > 0

  if (dream.willSaveChangeToAttribute(positionField) || changingScope) {
    const position = dreamAsAny[positionField]

    // store values to be used in after create/update hook
    const values: SortableCache = {
      wasNewRecord: dream.isNewRecord,
      changingScope,
      position: positionIsInvalid(position) ? undefined : position,
      previousPosition:
        dream.isPersisted && dream.willSaveChangeToAttribute(positionField)
          ? dream.changes()[positionField]?.was
          : changingScope
            ? position
            : undefined,
    }
    dreamAsAny[cachedValuesName] = values
  }

  if (dream.isNewRecord || changingScope) {
    // if the dream is not saved, or is being moved between scopes, set position to 0
    // to prevent collisions with existing position values.
    // it will be updated in an AfterCreateCommit hook to the correct value after saving.
    dreamAsAny[positionField] = 0
  } else {
    // if the dream is saved, set the position field to undefined, which will cause
    // the update cycle to ignore the position field. We will proceed to update it in an
    // AfterUpdateCommit hook
    dreamAsAny[positionField] = undefined
  }
}
