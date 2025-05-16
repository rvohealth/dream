export default class FailedToRenderThroughAssociationForSerializer extends Error {
  constructor(
    private className: any,
    private missingThroughField: string
  ) {
    super()
  }

  public override get message() {
    return `
Failed to render association data for ${this.className}
missing through field: "${this.missingThroughField}"`
  }
}
