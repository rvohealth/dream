import Dream from '../Dream.js'

export type ModelShapeDecoratorName = '@deco.JSON' | '@deco.Virtual' | '@deco.Encrypted'

export default class ModelDeclaredShapeContainsReference extends Error {
  constructor(
    public dreamClass: typeof Dream,
    public decoratorName: ModelShapeDecoratorName,
    public property: string,
    public referenceKey: string,
    public path: string
  ) {
    super()
  }

  public override get message() {
    const where = this.path === '' ? 'at the top level of the shape' : `at \`${this.path}\``
    const declaration = `${this.dreamClass.name}#${this.property}`
    const found =
      this.referenceKey === 'for'
        ? `a \`for:\` sentinel ${where}`
        : `a reference: \`${this.referenceKey}\` ${where}`

    return `
The shape passed to ${this.decoratorName} on ${declaration} contains ${found}.

A shape declared on a model may not contain a reference (\`$serializer\`,
\`$serializable\`, \`$schema\` or \`$ref\`) or a \`for:\` sentinel at any depth.
Psychic checks request params against the model's shape, where there is no
OpenAPI document for a reference to point into, and a serializer reference
inside it would never be added to the document's components. A \`for:\`
sentinel describes a request body built from a model's params, which has no
meaning in a shape that also describes the property in responses.

${this.fix(declaration)}`
  }

  private fix(declaration: string) {
    if (this.referenceKey === 'for')
      return `Declare the value's own shape in ${this.decoratorName} on ${declaration} instead of
the \`for:\` sentinel, and use \`for:\` only in a request body's OpenAPI, where it
describes the params that endpoint accepts.`

    if (this.decoratorName === '@deco.JSON')
      return `Remove @deco.JSON from ${declaration}, and declare the shape that uses the
reference where the column is rendered instead: in the serializer's
\`.attribute('${this.property}', { openapi })\` and in the request body's \`combining\`.`

    return `Declare a shape without a reference in ${this.decoratorName} on ${declaration}
(for example \`'json'\` or \`{ type: 'object' }\`), and declare the shape that uses
the reference where the property is rendered instead: in the serializer's
\`.attribute('${this.property}', { openapi })\` and in the request body's \`combining\`.`
  }
}
