import { HasManyStatement } from '../../decorators/associations/HasMany.js'
import { HasOneStatement } from '../../decorators/associations/HasOne.js'
import Dream from '../../Dream.js'

export default class MissingThroughAssociation extends Error {
  public dreamClass: typeof Dream
  public association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>

  constructor({
    dreamClass,
    association,
  }: {
    dreamClass: typeof Dream
    association: HasManyStatement<any, any, any, any> | HasOneStatement<any, any, any, any>
  }) {
    super()
    this.dreamClass = dreamClass
    this.association = association
  }

  public get message() {
    return `
\`${this.dreamClass.name}\` defines through association \`${this.association.through}\`, but \`${this.dreamClass.name}\` does not define association \`${this.association.through}\`.


To fix, define association \`${this.association.through}\` on \`${this.dreamClass.name}\`.
For example:

class ${this.dreamClass.name} {
  ...
  @${this.dreamClass.name}.HasMany('TheJoinModelClass')
  public ${this.association.through}: TheJoinModelClass[]
}
    `
  }
}
