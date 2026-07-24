import Dream from '../../Dream.js'

export default class ConflictingIgnoredColumns extends Error {
  constructor(
    private tableName: string,
    private modelClasses: (typeof Dream)[]
  ) {
    super()
  }

  public override get message() {
    const declarations = this.modelClasses
      .map(
        modelClass =>
          `    ${modelClass.sanitizedName}: [${[...modelClass.prototype.ignoredColumns]
            .sort()
            .map(column => `'${column}'`)
            .join(', ')}]`
      )
      .join('\n')

    return `
Models sharing the table "${this.tableName}" declare different ignoredColumns:

${declarations}

There is only one generated schema per table, so every model backed by a
table must agree on which of its columns are ignored. Align the
ignoredColumns getters (STI children inherit the base model's getter, so
the common fix is to declare ignored columns only on the base model).
`
  }
}
