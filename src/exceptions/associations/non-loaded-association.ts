import Dream from '../../dream'
import { AssociationStatement } from '../../serializer/decorators/associations/shared'

export default class NonLoadedAssociation extends Error {
  public associationStatement: AssociationStatement

  constructor(associationStatement: AssociationStatement) {
    super()
    this.associationStatement = associationStatement
  }

  public get message() {
    return `
Attempting to render \`${this.associationStatement.field}\` of type \`${
      this.associationStatement.serializerClassCB?.()?.name
    }\`,
but \`${this.associationStatement.field}\` has not been preloaded or loaded (it is undefined).
`
  }
}
