export default class NoColumnsToAlterMigration extends Error {
  public table: string
  public alterDirection: 'add' | 'remove'
  public migrationName: string | undefined
  public marker: '-to-' | '-from-' | undefined

  /**
   * @param table - the table the migration resolved to
   * @param alterDirection - 'add' for a `-to-` migration, 'remove' for a `-from-` migration
   * @param migrationName - the migration name the user typed, when available. Only
   * the standalone `g:migration` flow knows it, so the message degrades to a
   * table-only explanation when it is omitted.
   * @param marker - the `-to-`/`-from-` marker that matched within `migrationName`
   */
  constructor(
    table: string,
    alterDirection: 'add' | 'remove',
    migrationName?: string,
    marker?: '-to-' | '-from-'
  ) {
    super()
    this.table = table
    this.alterDirection = alterDirection
    this.migrationName = migrationName
    this.marker = marker
  }

  public override get message() {
    const verb = this.alterDirection === 'remove' ? 'drop from' : 'add to'

    if (!this.migrationName || !this.marker) {
      return `
no valid columns to ${verb} table '${this.table}' in this alter migration.

Pass at least one column declaration with a resolvable type, e.g.:
  name:string
    `
    }

    return `
no valid columns to ${verb} table '${this.table}' in this alter migration.

Alter mode was selected automatically: the migration name
'${this.migrationName}' contains '${this.marker}'. The FIRST '-to-' or '-from-' anywhere in
the name - not just at the end - is the marker, and everything after it is read
as the table name.

Either:

  - pass at least one column declaration with a resolvable type, e.g.:
      name:string

  - or, if this was meant to be a hand-written migration, rename it so that
    neither '-to-' nor '-from-' appears anywhere in the name.
    `
  }
}
