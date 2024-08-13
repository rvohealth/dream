export default class SerializerGlobalNameConflict extends Error {
  constructor(private serializerClassGlobalName: string) {
    super()
  }

  public get message() {
    return `
Attempted to register ${this.serializerClassGlobalName}, but another serializer was detected with the same
name. To fix this, use the "globalName" getter to distinguish one of these serializers
from the other:

export default class ${this.serializerClassGlobalName} extends DreamSerializer {
  public static get globalName() {
    return 'MyCustomGlobalName'
  }
}
`
  }
}
