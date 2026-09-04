import Dream from '../../Dream.js'

export default class STIChildTypeMismatch extends Error {
  public readonly expectedDreamClass: typeof Dream
  public readonly expectedType: string
  public readonly actualType: unknown
  public readonly baseDreamClass: typeof Dream
  public readonly table: string
  public readonly primaryKeyValue: unknown

  constructor(expectedDreamClass: typeof Dream, actualType: unknown, primaryKeyValue: unknown) {
    super()
    this.expectedDreamClass = expectedDreamClass
    this.expectedType = expectedDreamClass['sti'].value!
    this.actualType = actualType
    this.baseDreamClass = expectedDreamClass['sti'].baseClass!
    this.table = this.baseDreamClass.table
    this.primaryKeyValue = primaryKeyValue
  }

  public override get message() {
    return `
Cannot hydrate STI child from a row with a different discriminator.
Expected Dream class: ${this.expectedDreamClass.sanitizedName}
Expected type: ${this.expectedType}
Type specified in DB record: ${String(this.actualType)}
STI base Dream class: ${this.baseDreamClass.sanitizedName}
Table: ${this.table}
Primary key value: ${String(this.primaryKeyValue)}
    `
  }
}
