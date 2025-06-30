import Dream from '../../Dream.js'
import { HasManyStatement } from '../../types/associations/hasMany.js'
import { HasOneStatement } from '../../types/associations/hasOne.js'

export default class ThroughAssociationConditionsIncompatibleWithThroughAssociationSource extends Error {
  public dreamClass: typeof Dream
  public association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>

  constructor({
    dreamClass,
    association,
  }: {
    dreamClass: typeof Dream
    association: HasOneStatement<any, any, any, any> | HasManyStatement<any, any, any, any>
  }) {
    super()
    this.dreamClass = dreamClass
    this.association = association
  }

  public override get message() {
    return `
Through association options besides \`through\` and \`source\` are incompatible
with \`source\` associations that are themselves \`through\` associations.
Dream class: ${this.dreamClass.sanitizedName}
Association: ${this.association.as}
`
  }
}
