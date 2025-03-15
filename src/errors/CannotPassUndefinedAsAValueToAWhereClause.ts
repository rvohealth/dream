import Dream from '../Dream.js.js'

export default class CannotPassUndefinedAsAValueToAWhereClause extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private key: string
  ) {
    super()
  }

  public get message() {
    return `
Cannot pass undefined as a value to a where clause.

dream class: ${this.dreamClass.sanitizedName}
key receiving an undefined value: ${this.key}
`
  }
}
