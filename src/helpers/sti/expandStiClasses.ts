import Dream from '../../Dream.js'
import { ViewModelClass } from '../../types/dream.js'
import sortBy from '../sortBy.js'

export default function expandStiClasses(
  dreamsOrViewModels: typeof Dream | ViewModelClass | (typeof Dream | ViewModelClass)[]
): (typeof Dream | ViewModelClass)[] {
  if (Array.isArray(dreamsOrViewModels))
    return dreamsOrViewModels.flatMap(dreamOrSerializer => expandStiClasses(dreamOrSerializer))

  if ((dreamsOrViewModels as typeof Dream).prototype instanceof Dream)
    return expandStiDreamClassesOpenapi(dreamsOrViewModels as typeof Dream)

  return [dreamsOrViewModels]
}

function expandStiDreamClassesOpenapi(dreamClass: typeof Dream): (typeof Dream)[] {
  if (dreamClass['isSTIBase'])
    return sortBy([...(dreamClass['extendedBy'] as (typeof Dream)[])], dreamClass => dreamClass.sanitizedName)
  return [dreamClass]
}
