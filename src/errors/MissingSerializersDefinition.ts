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
Dream class: ${this.dreamClass.sanitizedName}

Try something like this in your ${this.dreamClass.sanitizedName}'s serializer getter:

class ${this.dreamClass.sanitizedName} {
  public get serializers(): DreamSerializers<${this.dreamClass.sanitizedName}> {
    return {
      default: '${this.dreamClass.sanitizedName}Serializer'
    }
  }
  ...
}`
  }
}
