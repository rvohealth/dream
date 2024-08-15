import { HasManyStatement } from '../../decorators/associations/has-many'
import { HasOneStatement } from '../../decorators/associations/has-one'
import Dream from '../../dream'

export default class MissingThroughAssociationSource extends Error {
  public dreamClass: typeof Dream
  public throughClass: typeof Dream
  public association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>

  constructor({
    dreamClass,
    throughClass,
    association,
  }: {
    dreamClass: typeof Dream
    throughClass: typeof Dream
    association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>
  }) {
    super()
    this.dreamClass = dreamClass
    this.throughClass = throughClass
    this.association = association
  }

  public get message() {
    return `
\`${this.dreamClass.name}\` defines association \`${this.association.as}\` through \`${
      this.dreamClass.name
    }\` association \`${this.association.through}\`.

\`${this.dreamClass.name}\` association \`${this.association.through}\` points to \`${
      this.throughClass.name
    }\`.

Dream expects association \`${this.association.source}\` to be defiend on \`${
      this.throughClass.name
    }\`, but \`${this.throughClass.name}\` does not define association \`${this.association.source}\`.

There are two possible fixes:

1. Provide an explicit \`source\` in addition to \`through\`.

class ${this.dreamClass.name} {
  ...
  @${this.dreamClass.name}.HasMany(() => ${this.throughClass.name}, { through: '${
    this.association.through
  }', source: '<a valid association on ${this.throughClass.name}>'})
  public ${this.association.as}: ${this.throughClass.name}[]
}

2. Define association \`${this.association.source}\` on \`${this.throughClass.name}\`.
For example:

class ${this.throughClass.name} {
  ...
  @${this.throughClass.name}.HasMany(() => ${this.association.modelCB().name})
  public ${this.association.source}: ${this.association.modelCB().name}[]
}
    `
  }
}
