import Dream from '../../Dream.js.js'

export default class StiChildCannotDefineNewAssociations extends Error {
  constructor(
    public baseStiDreamClass: typeof Dream,
    public childStiDreamClass: typeof Dream
  ) {
    super()
  }

  public get message() {
    return `
STI children cannot define new associations.
Define on the base STI class instead.
STI base class: ${this.baseStiDreamClass.name}
STI child class: ${this.childStiDreamClass.name}
    `
  }
}
