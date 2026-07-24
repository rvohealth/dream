export default class UnparseableMigrationColumn extends Error {
  public declaration: string

  constructor(declaration: string) {
    super()
    this.declaration = declaration
  }

  public override get message() {
    return `
could not determine a column type for the following migration column declaration:
  ${this.declaration}

Make sure the column includes a type, e.g.:
  ${this.declaration.split(':')[0]}:string
    `
  }
}
