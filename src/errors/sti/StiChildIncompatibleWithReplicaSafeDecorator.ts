import Dream from '../../Dream.js'

export default class StiChildIncompatibleWithReplicaSafeDecorator extends Error {
  constructor(public childStiDreamClass: typeof Dream) {
    super()
  }

  public override get message() {
    return `
@ReplicaSafe decorator cannot be applied to STI children.
Apply @ReplicaSafe to the base STI class instead.
STI child class: ${this.childStiDreamClass.name}
    `
  }
}
