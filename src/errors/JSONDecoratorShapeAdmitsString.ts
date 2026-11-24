import Dream from '../Dream.js'

export default class JSONDecoratorShapeAdmitsString extends Error {
  constructor(
    public dreamClass: typeof Dream,
    public column: string,
    public isArray: boolean
  ) {
    super()
  }

  public override get message() {
    const admits = this.isArray
      ? ', a json[]/jsonb[] column, admits a string as an element'
      : ' admits a string'
    const insideArrayElements = this.isArray
      ? ` A string
inside an element that is an array is stored the same way, at any depth, since
that array is sent to the database as a further dimension of the column's array.`
      : ''

    return `
The shape passed to @deco.JSON on ${this.dreamClass.name}#${this.column}${admits}.
Dream stores a string given for a json/jsonb value as already-encoded JSON text,
so a string value cannot be saved and read back as that string.${insideArrayElements}

Declare an object, array, number, integer or boolean shape instead (no
\`type: 'string'\`, \`'date'\` or \`'date-time'\`, no \`anyOf\` or \`oneOf\`
branch that admits a string, and no shape with neither a \`type\` nor an
\`anyOf\`, \`oneOf\` or \`allOf\`), or wrap the string in an object, e.g.
\`{ type: 'object', properties: { value: 'string' } }\`.`
  }
}
