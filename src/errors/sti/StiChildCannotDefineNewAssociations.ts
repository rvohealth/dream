import Dream from '../../Dream.js'

export default class StiChildCannotDefineNewAssociations extends Error {
  constructor(
    private childStiDreamClass: typeof Dream,
    private associationName: string
  ) {
    super()
  }

  public override get message() {
    return `
STI children cannot define new associations.
Define on the STI base class instead.
STI child class: ${this.childStiDreamClass.name}
Association: ${this.associationName}`
  }
}
