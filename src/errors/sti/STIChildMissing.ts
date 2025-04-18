import Dream from '../../Dream.js'

export default class STIChildMissing extends Error {
  public baseDreamClass: typeof Dream
  public extendingDreamClassName: string
  public primaryKeyValue: any

  constructor(baseDreamClass: typeof Dream, extendingDreamClassName: string, primaryKeyValue: any) {
    super()
    this.baseDreamClass = baseDreamClass
    this.extendingDreamClassName = extendingDreamClassName
    this.primaryKeyValue = primaryKeyValue
  }

  public override get message() {
    return `
Missing STI child class
Base Dream class: ${this.baseDreamClass.sanitizedName}
Type specified in DB record: ${this.extendingDreamClassName}
Table: ${this.baseDreamClass.table}
Primary key value: ${this.primaryKeyValue}
    `
  }
}
