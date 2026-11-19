import Dream from '../../Dream.js'

export default class StiChildCannotDeclareJSONColumnShape extends Error {
  constructor(
    public baseStiDreamClass: typeof Dream,
    public childStiDreamClass: typeof Dream,
    public columns: string[]
  ) {
    super()
  }

  public override get message() {
    return `
@deco.JSON cannot be declared on an STI child.
STI child class: ${this.childStiDreamClass.name}
Column: ${this.columns.join(', ')}
STI base class: ${this.baseStiDreamClass.name}

A json/jsonb column belongs to the table the STI base and all of its children
share, so it has one shape for all of them. Move @deco.JSON for ${this.columns.join(', ')}
to the STI base class, ${this.baseStiDreamClass.name}.`
  }
}
