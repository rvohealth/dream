import { HasManyStatement } from '../decorators/associations/has-many'
import { HasOneStatement } from '../decorators/associations/has-one'
import Dream from '../dream'

export default class MissingThroughAssociation extends Error {
  public dreamClass: typeof Dream
  public throughClass: typeof Dream
  public association: HasManyStatement<any> | HasOneStatement<any>

  constructor({
    dreamClass,
    throughClass,
    association,
  }: {
    dreamClass: typeof Dream
    throughClass: typeof Dream
    association: HasManyStatement<any> | HasOneStatement<any>
  }) {
    super()
    this.dreamClass = dreamClass
    this.throughClass = throughClass
    this.association = association
  }

  public get message() {
    return `
\`${this.dreamClass.name}\` defines through association \`${this.association.through}\`
that points to \`${this.association.source}\` on \`${this.throughClass.name}\`,
but \`${this.throughClass.name}\` does not have association \`${this.association.source}\`.


To fix, define association \`${this.association.source}\` on \`${this.throughClass.name}\`.
For example:

class ${this.throughClass.name} {
  ...
  @HasMany(() => ${this.association.modelCB().name})
  public ${this.association.source}: ${this.association.modelCB().name}[]
}

Alternatively, provide an explicit \`source\` in addition to \`through\`.
    `
  }
}
