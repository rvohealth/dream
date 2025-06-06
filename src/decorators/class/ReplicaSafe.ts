import DreamImporter from '../../dream-app/helpers/DreamImporter.js'
import Dream from '../../Dream.js'
import StiChildIncompatibleWithReplicaSafeDecorator from '../../errors/sti/StiChildIncompatibleWithReplicaSafeDecorator.js'

export default function ReplicaSafe(): ClassDecorator {
  return function (target: any) {
    DreamImporter.addImportHook(() => {
      const dreamClass = target as typeof Dream

      if (dreamClass['isSTIChild']) throw new StiChildIncompatibleWithReplicaSafeDecorator(dreamClass)

      dreamClass['replicaSafe'] = true
    })
  }
}
