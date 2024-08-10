import Dream from '../dream'

export default class MissingSerializer extends Error {
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
  ...
}

DreamSerializerConf.add(${this.dreamClass.name}, {
  default: ${this.dreamClass.name}Serializer<any, any>
})
    `
  }
}
