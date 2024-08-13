export default class DreamGlobalNameConflict extends Error {
  constructor(private dreamClassGlobalName: string) {
    super()
  }

  public get message() {
    return `
Attempted to register ${this.dreamClassGlobalName}, but another model was detected with the same
name. To fix this, use the "globalName" getter to distinguish one of these models
from the other, i.e.:

export default class ${this.dreamClassGlobalName} extends ApplicationModel {
  public static get globalName() {
    return 'MyCustomGlobalName'
  }
}
`
  }
}
