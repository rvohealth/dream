import Dream from '../../Dream.js'

export default class CannotIgnoreSortablePositionColumn extends Error {
  constructor(
    private modelClass: typeof Dream,
    private columnName: string
  ) {
    super()
  }

  public override get message() {
    return `
${this.modelClass.sanitizedName} declares "${this.columnName}" in
ignoredColumns, but "${this.columnName}" is the position field of an
@Sortable declaration on ${this.modelClass.sanitizedName}.

@Sortable reads and rewrites this column to keep positions contiguous, so
it can never be ignored. Remove the @Sortable decorator (and its property)
from ${this.modelClass.sanitizedName} before ignoring "${this.columnName}".
`
  }
}
