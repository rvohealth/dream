import Dream from '../Dream2'

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

dream class: ${this.dreamClass.name}
key receiving an undefined value: ${this.key}
`
  }
}
