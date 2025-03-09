import Dream from '../../Dream.js'

export default class CannotCallSortableOnSTIChild extends Error {
  constructor(private dreamClass: typeof Dream) {
    super()
  }

  public get message() {
    return `
Cannot add @Sortable decorator to a property on an STI child class.

STI child class: ${this.dreamClass.globalName}
STI base class: ${this.dreamClass['stiBaseClassOrOwnClass'].globalName}
`
  }
}
