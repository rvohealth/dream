import Dream from '../../../Dream.js'
import { HookStatementMap } from '../../../types/lifecycle.js'
import freezeBaseClassArrayMap from '../../helpers/freezeBaseClassArrayMap.js'

export function blankHooksFactory(
  dreamClass: typeof Dream,
  {
    freeze = false,
  }: {
    freeze?: boolean
  } = {}
): HookStatementMap {
  const hooksMap = {
    beforeCreate: [...(dreamClass['hooks']?.beforeCreate || [])],
    beforeUpdate: [...(dreamClass['hooks']?.beforeUpdate || [])],
    beforeSave: [...(dreamClass['hooks']?.beforeSave || [])],
    beforeDestroy: [...(dreamClass['hooks']?.beforeDestroy || [])],
    afterCreate: [...(dreamClass['hooks']?.afterCreate || [])],
    afterCreateCommit: [...(dreamClass['hooks']?.afterCreateCommit || [])],
    afterUpdate: [...(dreamClass['hooks']?.afterUpdate || [])],
    afterUpdateCommit: [...(dreamClass['hooks']?.afterUpdateCommit || [])],
    afterSave: [...(dreamClass['hooks']?.afterSave || [])],
    afterSaveCommit: [...(dreamClass['hooks']?.afterSaveCommit || [])],
    afterDestroy: [...(dreamClass['hooks']?.afterDestroy || [])],
    afterDestroyCommit: [...(dreamClass['hooks']?.afterDestroyCommit || [])],
  }

  if (freeze) return freezeBaseClassArrayMap(hooksMap)
  return hooksMap
}
