import Dream from '../Dream.js'

export default class JSONDecoratorRequiresJsonColumn extends Error {
  constructor(
    public dreamClass: typeof Dream,
    public property: string,
    public dbType: string | null
  ) {
    super()
  }

  public override get message() {
    const what =
      this.dbType === null
        ? `not a column of the "${this.dreamClass.table}" table`
        : `a "${this.dbType}" column`

    return `
@deco.JSON may only decorate a json, jsonb, json[] or jsonb[] column.
Model: ${this.dreamClass.name}
Property: ${this.property}, which is ${what}

Remove @deco.JSON from ${this.dreamClass.name}#${this.property}. A column of any
other type already has its OpenAPI shape inferred from the column, and a property
that is not a column declares its shape with @deco.Virtual(shape) instead.`
  }
}
