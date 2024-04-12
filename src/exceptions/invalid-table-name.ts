export default class InvalidTableName extends Error {
  private dbTypeCache: any
  private tableName: string
  constructor(dbTypeCache: any, tableName: string) {
    super()
    this.dbTypeCache = dbTypeCache
    this.tableName = tableName
  }

  public get message() {
    // eslint-disable-next-line
    const keys: string[] = Object.keys(this.dbTypeCache)

    return `
Invalid table name passed to an underlying sql function.
The invalid table name received was:
  ${this.tableName}

Please make sure to only pass a valid table name. Valid table names are:
  ${keys.join(',\n        ')}
    `
  }
}
