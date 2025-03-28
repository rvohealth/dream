import Dream from '../../Dream.js'

export default class AssociationDeclaredWithoutAssociatedDreamClass extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private associationName: string | number | symbol
  ) {
    super()
  }

  public override get message() {
    return `Association ${String(this.associationName)} on Dream class
${this.dreamClass.sanitizedName} was declared without the global name
of a Dream class.`
  }
}
