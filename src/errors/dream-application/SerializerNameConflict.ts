export default class SerializerNameConflict extends Error {
  constructor(private serializerGlobalName: string) {
    super()
  }

  public override get message() {
    return `
Attempted to register ${this.serializerGlobalName}, but another serializer
has the sane name.`
  }
}
