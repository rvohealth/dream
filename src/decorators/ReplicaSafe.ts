import Dream from '../Dream'
import StiChildIncompatibleWithReplicaSafeDecorator from '../errors/sti/StiChildIncompatibleWithReplicaSafeDecorator'

export default function ReplicaSafe(): ClassDecorator {
  return function (target: any) {
    const dreamClass = target as typeof Dream

    if (dreamClass['isSTIChild']) throw new StiChildIncompatibleWithReplicaSafeDecorator(dreamClass)

    dreamClass['replicaSafe'] = true
  }
}
