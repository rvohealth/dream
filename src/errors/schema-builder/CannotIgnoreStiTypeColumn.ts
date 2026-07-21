import Dream from '../../Dream.js'

export default class CannotIgnoreStiTypeColumn extends Error {
  constructor(private modelClass: typeof Dream) {
    super()
  }

  public override get message() {
    return `
${this.modelClass.sanitizedName} participates in single-table inheritance
and declares the STI "type" column in ignoredColumns.

The "type" column determines which model class each row hydrates into, so
an STI model can never ignore it. Remove "type" from the ignoredColumns
getter on ${this.modelClass.sanitizedName}.
`
  }
}
