import Dream from '../../Dream.js'
import { HasManyStatement } from '../../types/associations/hasMany.js'
import { HasOneStatement } from '../../types/associations/hasOne.js'

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

  public override get message() {
    return `
\`${this.dreamClass.sanitizedName}\` defines association \`${this.association.as}\` through \`${
      this.dreamClass.sanitizedName
    }\` association \`${this.association.through}\`.

\`${this.dreamClass.sanitizedName}\` association \`${this.association.through}\` points to \`${
      this.throughClass.sanitizedName
    }\`.

Dream expects association \`${this.association.source}\` to be defined on \`${
      this.throughClass.sanitizedName
    }\`, but \`${this.throughClass.sanitizedName}\` does not define association \`${this.association.source}\`.

There are two possible fixes:

1. Provide an explicit \`source\` in addition to \`through\`.

class ${this.dreamClass.sanitizedName} {
  ...
  @${this.dreamClass.name}.HasMany(() => ${this.throughClass.sanitizedName}, { through: '${
    this.association.through
  }', source: '<a valid association on ${this.throughClass.sanitizedName}>'})
  public ${this.association.as}: ${this.throughClass.sanitizedName}[]
}

2. Define association \`${this.association.source}\` on \`${this.throughClass.sanitizedName}\`.
For example:

class ${this.throughClass.sanitizedName} {
  ...
  @${this.throughClass.sanitizedName}.HasMany(() => ${this.association.modelCB().name})
  public ${this.association.source}: ${this.association.modelCB().sanitizedName}[]
}
    `
  }
}
