import Dream from '../dream'

export default function ReplicaSafe(): ClassDecorator {
  return function (target: any) {
    const t = target as typeof Dream
    t.replicaSafe = true
  }
}
