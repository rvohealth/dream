import Dream from '../../Dream.js'

export default class StiChildCannotDeclareSortable extends Error {
  constructor(
    public baseStiDreamClass: typeof Dream,
    public childStiDreamClass: typeof Dream,
    public fields: string[]
  ) {
    super()
  }

  public override get message() {
    const fields = this.fields.join(', ')

    return `
@deco.Sortable cannot be declared on an STI child.
STI child class: ${this.childStiDreamClass.name}
Field: ${fields}
STI base class: ${this.baseStiDreamClass.name}

Positions are kept across every row of the table the STI base and all of its
children share, so a Sortable field on one child would number its rows
together with its siblings' rows. Declare @deco.Sortable for ${fields}
on the STI base class, ${this.baseStiDreamClass.name}; to keep a separate
position list for each STI type, declare it there with scope: 'type'.`
  }
}
