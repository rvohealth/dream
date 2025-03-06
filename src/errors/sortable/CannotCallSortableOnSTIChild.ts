import Dream from '../../Dream.js'

export default class CannotCallSortableOnSTIChild extends Error {
  constructor(private dreamClass: typeof Dream) {
    super()
  }

  public get message() {
    return `
Cannot call @Sortable decorator on the child of an STI base class.

offending child class: ${this.dreamClass.globalName}
base class: ${this.dreamClass['stiBaseClassOrOwnClass'].globalName}
`
  }
}
