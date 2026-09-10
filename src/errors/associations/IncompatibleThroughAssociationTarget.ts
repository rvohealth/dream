import Dream from '../../Dream.js'
import { AssociationStatement } from '../../types/associations/shared.js'

export default class IncompatibleThroughAssociationTarget extends Error {
  constructor({
    outermostAssociation,
    outermostTargetModelClass,
    sourceAssociation,
  }: {
    outermostAssociation: AssociationStatement
    outermostTargetModelClass: typeof Dream
    sourceAssociation: AssociationStatement
  }) {
    super(
      `Through association \`${outermostAssociation.as}\` targets \`${
        outermostTargetModelClass.sanitizedName
      }\`, but source association \`${sourceAssociation.as}\` targets ${targetDescription(sourceAssociation)}. ` +
        `The through association's target must be the same as or a subclass of a source target.`
    )
  }
}

function targetDescription(association: AssociationStatement): string {
  const targetModelClassOrClasses = association.modelCB()
  const targetNames = (
    Array.isArray(targetModelClassOrClasses) ? targetModelClassOrClasses : [targetModelClassOrClasses]
  ).map(targetModelClass => `\`${targetModelClass.sanitizedName}\``)

  return targetNames.join(', ')
}
