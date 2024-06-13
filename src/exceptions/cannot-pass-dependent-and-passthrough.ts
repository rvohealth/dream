import Dream from '../dream'

export default class CannotPassDependentAndPassthrough extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private associationName: string
  ) {
    super()
  }

  public get message() {
    return `
Cannot pass both "dependent" and DreamConst.passthrough to an association.
Error found when trying to parse "${this.associationName}" on the 
${this.dreamClass.name} dream class.
    `
  }
}
