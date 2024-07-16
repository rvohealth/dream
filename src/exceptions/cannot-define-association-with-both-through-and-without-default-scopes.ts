import Dream from '../dream'

export default class CannotDefineAssociationWithBothThroughAndWithoutDefaultScopes extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private associationName: string
  ) {
    super()
  }

  public get message() {
    return `
Cannot define association with both "through" and "withoutDefaultScopes".
Error found when trying to parse "${this.associationName}" on the 
${this.dreamClass.name} dream class.
    `
  }
}
