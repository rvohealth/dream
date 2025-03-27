import Dream from '../../Dream.js'
import { HasManyStatement } from '../../types/associations/hasMany.js'
import { HasOneStatement } from '../../types/associations/hasOne.js'

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

  public override get message() {
    return `
\`${this.dreamClass.sanitizedName}\` defines through association \`${this.association.through}\`, but \`${this.dreamClass.name}\` does not define association \`${this.association.through}\`.


To fix, define association \`${this.association.through}\` on \`${this.dreamClass.sanitizedName}\`.
For example:

class ${this.dreamClass.sanitizedName} {
  ...
  @${this.dreamClass.sanitizedName}.HasMany('TheJoinModelClass')
  public ${this.association.through}: TheJoinModelClass[]
}
    `
  }
}
