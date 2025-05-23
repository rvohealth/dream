import Dream from '../../Dream.js'
import StiChildIncompatibleWithReplicaSafeDecorator from '../../errors/sti/StiChildIncompatibleWithReplicaSafeDecorator.js'

export default function ReplicaSafe(): ClassDecorator {
  return function (target: any) {
    const dreamClass = target as typeof Dream

    if (dreamClass['isSTIChild']) throw new StiChildIncompatibleWithReplicaSafeDecorator(dreamClass)

    dreamClass['replicaSafe'] = true
  }
}
