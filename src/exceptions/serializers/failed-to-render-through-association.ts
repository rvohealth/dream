export default class FailedToRenderThroughAssociationForSerializer extends Error {
  constructor(
    public className: any,
    public missingThroughField: string
  ) {
    super()
  }

  public get message() {
    return `
Failed to render association data for ${this.className}
missing through field: "${this.missingThroughField}"`
  }
}
