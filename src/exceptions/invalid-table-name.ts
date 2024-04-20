export default class InvalidTableName extends Error {
  private schema: any
  private tableName: string
  constructor(schema: any, tableName: string) {
    super()
    this.schema = schema
    this.tableName = tableName
  }

  public get message() {
    const keys: string[] = Object.keys(this.schema)

    return `
Invalid table name passed to an underlying sql function.
The invalid table name received was:
  ${this.tableName}

Please make sure to only pass a valid table name. Valid table names are:
  ${keys.join(',\n        ')}
    `
  }
}
