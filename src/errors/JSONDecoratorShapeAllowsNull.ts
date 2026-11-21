import Dream from '../Dream.js'

export default class JSONDecoratorShapeAllowsNull extends Error {
  constructor(
    public dreamClass: typeof Dream,
    public column: string
  ) {
    super()
  }

  public override get message() {
    return `
The shape passed to @deco.JSON on ${this.dreamClass.name}#${this.column} allows null.
A @deco.JSON shape describes the column's non-null value: whether the column may
be null comes from the column itself, so the shape may not declare it.

Remove null from the shape (e.g. \`type: 'object'\` rather than
\`type: ['object', 'null']\`, and no \`{ type: 'null' }\` branch in an \`anyOf\`
or \`oneOf\`). To accept null, allow null on the column in a migration.`
  }
}
