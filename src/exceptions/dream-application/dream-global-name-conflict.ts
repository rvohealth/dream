export default class DreamGlobalNameConflict extends Error {
  constructor(private dreamClassGlobalName: string) {
    super()
  }

  public get message() {
    return `
Attempted to register ${this.dreamClassGlobalName}, but another model, serializer, service, or view model
was detected with the same name. This should never happen, since global names are computed based on file path,
but it has, causing the initialization process to halt.`
  }
}
