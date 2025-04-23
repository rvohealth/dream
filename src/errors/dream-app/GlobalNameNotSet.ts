export default class GlobalNameNotSet extends Error {
  constructor(private klass: any) {
    super()
  }

  public override get message() {
    return `
Attempted to reference global name for ${this.klass.name}, but the global name has not been set.`
  }
}
