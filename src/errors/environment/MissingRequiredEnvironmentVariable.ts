export default class MissingRequiredEnvironmentVariable extends Error {
  constructor(private environmentVariableName: string) {
    super()
  }

  public override get message() {
    return `Missing required environment variable ${this.environmentVariableName}`
  }
}
