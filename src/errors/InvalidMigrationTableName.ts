export default class InvalidMigrationTableName extends Error {
  public migrationName: string
  public table: string

  /**
   * @param migrationName - the migration name the user typed
   * @param table - the table name derived from it (snake-cased and pluralized)
   */
  constructor(migrationName: string, table: string) {
    super()
    this.migrationName = migrationName
    this.table = table
  }

  public override get message() {
    return `
the migration name '${this.migrationName}' resolves to the table name:
  ${this.table}

which is not a valid table name. The text after the '-to-'/'-from-' marker is
snake-cased and pluralized into the table name, and the result is written into
the generated migration, so it must be a plain identifier: lowercase letters,
digits and underscores only, not starting with a digit.

Rename the migration so that the text after the marker is a plain table name,
e.g.:
  add-phone-to-users
    `
  }
}
