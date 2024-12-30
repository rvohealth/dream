export default class MissingRequiredEnvironmentVariable extends Error {
  constructor(private environmentVariableName: string) {
    super()
  }

  public get message() {
    return `Missing required environment variable ${this.environmentVariableName}`
  }
}
