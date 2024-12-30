export default class InvalidColumnName extends Error {
  private tableName: string
  private columnName: string
  constructor(tableName: string, columnName: string) {
    super()
    this.tableName = tableName
    this.columnName = columnName
  }

  public get message() {
    return `
Invalid column name passed to an underlying sql function.
The invalid column name received was:
  ${this.tableName}.${this.columnName}
    `
  }
}
