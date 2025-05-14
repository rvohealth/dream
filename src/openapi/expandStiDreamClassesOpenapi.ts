import Dream from '../Dream.js'

export default function expandStiDreamClassesOpenapi(dreamClass: typeof Dream): (typeof Dream)[] {
  if (dreamClass['isSTIBase']) return [...dreamClass['extendedBy']!] as (typeof Dream)[]
  return [dreamClass]
}
