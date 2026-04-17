import Dream from '../../Dream.js'
import StiChildIncompatibleWithReplicaSafeDecorator from '../../errors/sti/StiChildIncompatibleWithReplicaSafeDecorator.js'

export default function ReplicaSafe() {
  return function (target: typeof Dream): void {
    if (target['isSTIChild']) throw new StiChildIncompatibleWithReplicaSafeDecorator(target)

    target['replicaSafe'] = true
  }
}
