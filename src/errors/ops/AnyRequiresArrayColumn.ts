import Dream from '../../Dream.js'

export default class AnyRequiresArrayColumn extends Error {
  public dreamClass: typeof Dream
  public column: string

  constructor(dreamClass: typeof Dream, column: string) {
    super()
    this.dreamClass = dreamClass
    this.column = column
  }

  public override get message() {
    return `
Attempting to call where({ ${this.column}: ops.any(<some value>)} ),
but ${this.dreamClass.sanitizedName}#${this.column} is not an array in the database.
`
  }
}
