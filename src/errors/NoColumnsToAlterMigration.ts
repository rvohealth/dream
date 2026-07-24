export default class NoColumnsToAlterMigration extends Error {
  public table: string
  public alterDirection: 'add' | 'remove'

  constructor(table: string, alterDirection: 'add' | 'remove') {
    super()
    this.table = table
    this.alterDirection = alterDirection
  }

  public override get message() {
    return `
no valid columns to ${this.alterDirection === 'remove' ? 'drop from' : 'add to'} table '${this.table}' in this alter migration.

Pass at least one column declaration with a resolvable type, e.g.:
  name:string
    `
  }
}
