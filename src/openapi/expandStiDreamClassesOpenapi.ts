import Dream from '../Dream.js'
import sortBy from '../helpers/sortBy.js'

export default function expandStiDreamClassesOpenapi(dreamClass: typeof Dream): (typeof Dream)[] {
  if (dreamClass['isSTIBase'])
    return sortBy([...(dreamClass['extendedBy'] as (typeof Dream)[])], dreamClass => dreamClass.sanitizedName)
  return [dreamClass]
}
