import Dream from '../dream'

export default class MissingSerializer extends Error {
  public dreamClass: typeof Dream

  constructor(dreamClass: typeof Dream) {
    super()
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Missing serializer definition on the following class
Dream class: ${this.dreamClass.name}

Try something like this in your ${this.dreamClass.name}'s serializer getter:

class ${this.dreamClass.name} {
  ...
  public get serializer() {
    return ${this.dreamClass.name}Serializer
  }
}
    `
  }
}
