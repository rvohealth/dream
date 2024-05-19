export default class MissingRequiredPassthroughForAssociationWhereClause extends Error {
  constructor(private column: string) {
    super()
  }

  public get message() {
    return `
Missing passthrough for association where clause:
Missing passthrough where clause for column: ${this.column}
`
  }
}
