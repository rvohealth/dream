import Dream from '../../Dream.js'

export default class CannotIgnoreSortableScopeColumn extends Error {
  constructor(
    private modelClass: typeof Dream,
    private columnName: string,
    private positionField: string
  ) {
    super()
  }

  public override get message() {
    return `
${this.modelClass.sanitizedName} declares "${this.columnName}" in
ignoredColumns, but "${this.columnName}" is a scope column of the @Sortable
declaration on "${this.positionField}" on ${this.modelClass.sanitizedName}.

@Sortable reads this column by name on every save and destroy to partition
position values, so it can never be ignored. Remove "${this.columnName}"
from the @Sortable scope on "${this.positionField}" (or remove the
@Sortable decorator and its property) on ${this.modelClass.sanitizedName}
before ignoring "${this.columnName}".
`
  }
}
