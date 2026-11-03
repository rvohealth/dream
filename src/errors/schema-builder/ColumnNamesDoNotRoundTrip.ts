export interface ColumnNameThatDoesNotRoundTrip {
  tableName: string
  columnName: string
  attributeName: string
  mappedColumnName: string
  modelName: string
}

export default class ColumnNamesDoNotRoundTrip extends Error {
  constructor(private columns: ColumnNameThatDoesNotRoundTrip[]) {
    super()
  }

  public override get message() {
    const columnLines = this.columns.map(
      column =>
        `  ${column.tableName}.${column.columnName} (${column.modelName}): its attribute ${column.attributeName} maps back to ${column.mappedColumnName}`
    )
    const remedyLines = this.columns.map(
      column =>
        `  rename ${column.tableName}.${column.columnName} to ${column.mappedColumnName}, or add "${column.attributeName}" to the ignoredColumns getter on ${column.modelName}`
    )

    return `
The model attribute of each of these columns maps back to a column that
does not exist:

${columnLines.join('\n')}

Dream names a column's attribute by camelizing the column's name, and each
query naming the attribute targets the attribute's snake_cased name. For
these columns, that is a column that does not exist, so a save or update
that sets the attribute, a where clause on it, and every leftJoinPreload
that loads the model fail.

For each column, either rename it in a migration, or, if it cannot be
renamed, ignore it:

${remedyLines.join('\n')}
`
  }
}
