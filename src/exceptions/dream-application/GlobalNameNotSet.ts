export default class GlobalNameNotSet extends Error {
  constructor(private klass: any) {
    super()
  }

  public get message() {
    return `
Attempted to reference global name for ${this.klass.name}, but the global name has not been set.`
  }
}
