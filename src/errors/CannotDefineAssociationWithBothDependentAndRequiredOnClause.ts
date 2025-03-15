import Dream from '../Dream.js'

export default class CannotDefineAssociationWithBothDependentAndRequiredOnClause extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private associationName: string
  ) {
    super()
  }

  public get message() {
    return `
Cannot define association with both "dependent" and "DreamConst.required".
Error found when trying to parse "${this.associationName}" on the 
${this.dreamClass.sanitizedName} dream class.
    `
  }
}
