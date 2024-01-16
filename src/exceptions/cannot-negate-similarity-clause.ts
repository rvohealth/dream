export default class CannotNegateSimilarityClause extends Error {
  private tableName: string
  private columnName: string
  private value: any
  constructor(tableName: string, columnName: string, value: any) {
    super()
    this.tableName = tableName
    this.columnName = columnName
    this.value = value
  }

  public get message() {
    return `
Negating similarity expressions is not supported.
  table: ${this.tableName}
  column: ${this.columnName}
  value passed to similarity clause: ${this.value}
    `
  }
}
