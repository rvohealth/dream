import Dream from '../Dream2'
import StiChildIncompatibleWithReplicaSafeDecorator from '../exceptions/sti/sti-child-incompatible-with-replica-safe-decorator'

export default function ReplicaSafe(): ClassDecorator {
  return function (target: any) {
    const dreamClass = target as typeof Dream

    if (dreamClass['isSTIChild']) throw new StiChildIncompatibleWithReplicaSafeDecorator(dreamClass)

    dreamClass['replicaSafe'] = true
  }
}
