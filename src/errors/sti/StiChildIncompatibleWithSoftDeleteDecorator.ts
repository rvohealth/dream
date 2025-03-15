import Dream from '../../Dream.js.js'

export default class StiChildIncompatibleWithSoftDeleteDecorator extends Error {
  constructor(public childStiDreamClass: typeof Dream) {
    super()
  }

  public get message() {
    return `
@SoftDelete decorator cannot be applied to STI children.
Apply @SoftDelete to the base STI class instead.
STI child class: ${this.childStiDreamClass.sanitizedName}
    `
  }
}
