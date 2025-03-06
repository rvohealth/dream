import Dream from '../Dream.js'

export default class MissingSerializersDefinition extends Error {
  public dreamClass: typeof Dream

  constructor(dreamClass: typeof Dream) {
    super()
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Missing serializers definition on the following class
Dream class: ${this.dreamClass.name}

Try something like this in your ${this.dreamClass.name}'s serializer getter:

class ${this.dreamClass.name} {
  public get serializers(): DreamSerializers<${this.dreamClass.name}> {
    return {
      default: '${this.dreamClass.name}Serializer'
    }
  }
  ...
}`
  }
}
