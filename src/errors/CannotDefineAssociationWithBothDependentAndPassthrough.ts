import Dream from '../Dream.js'

export default class CannotDefineAssociationWithBothDependentAndPassthrough extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private associationName: string
  ) {
    super()
  }

  public override get message() {
    return `
Cannot define association with both "dependent" and "DreamConst.passthrough".
Error found when trying to parse "${this.associationName}" on the 
${this.dreamClass.sanitizedName} dream class.
    `
  }
}
