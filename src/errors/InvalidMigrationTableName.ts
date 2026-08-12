export default class InvalidMigrationTableName extends Error {
  public migrationName: string
  public table: string

  /**
   * @param migrationName - the migration name the generator was invoked with
   * @param table - the table name the generator resolved for it
   */
  constructor(migrationName: string, table: string) {
    super()
    this.migrationName = migrationName
    this.table = table
  }

  public override get message() {
    return `
generating the migration '${this.migrationName}' resolved the table name:
  ${this.table}

which is not a valid table name. The table name is written into the generated
migration, which 'db:migrate' later executes, so it must be a plain
identifier: lowercase letters, digits and underscores only.

A standalone 'g:migration' takes the table from the text after the first
'-to-'/'-from-' in the name, snake-cased and pluralized, e.g.:
  add-phone-to-users

A model generator takes it from the model name, or verbatim from
'--table-name'.
    `
  }
}
