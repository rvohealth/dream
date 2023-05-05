import Dream from '../dream'

export default class ForeignKeyOnAssociationDoesNotMatchPrimaryKeyOnBase extends Error {
  public baseDreamClass: typeof Dream
  public associationDreamClass: typeof Dream
  public foreignKeyColumnName: string

  constructor({
    baseDreamClass,
    associationDreamClass,
    foreignKeyColumnName,
  }: {
    baseDreamClass: typeof Dream
    associationDreamClass: typeof Dream
    foreignKeyColumnName: string
  }) {
    super()
    this.baseDreamClass = baseDreamClass
    this.associationDreamClass = associationDreamClass
    this.foreignKeyColumnName = foreignKeyColumnName
  }

  public get message() {
    return `
Foreign key type mismatch detected while loading association
Dream class: ${this.baseDreamClass.name}
Association: ${this.associationDreamClass.name}
Forein key creating the issue: ${this.foreignKeyColumnName}

Note: this can happen when, for example, the primary key
      is a bigint (which is serialized as a string)
      and the foreign key is an integer.
    `
  }
}
