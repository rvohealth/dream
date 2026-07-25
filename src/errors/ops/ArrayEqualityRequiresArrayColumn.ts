import Dream from '../../Dream.js'

export default class ArrayEqualityRequiresArrayColumn extends Error {
  public dreamClass: typeof Dream
  public column: string
  public operator: string

  constructor(dreamClass: typeof Dream, column: string, operator: string) {
    super()
    this.dreamClass = dreamClass
    this.column = column
    this.operator = operator
  }

  public override get message() {
    return `
Attempting to compare an array for equality against a column that is not an
array in the database:

  ${this.dreamClass.sanitizedName}#${this.column} (operator: ${this.operator})

Whole-array equality (\`=\`, \`!=\`, \`<>\`) is only meaningful for array columns.
If you meant "is this column one of these values", use \`ops.in([...])\`
(or a bare array) instead.
`
  }
}
