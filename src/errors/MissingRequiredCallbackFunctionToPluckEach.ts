export default class MissingRequiredCallbackFunctionToPluckEach extends Error {
  private methodName: string
  private args: any[]
  constructor(methodName: string, providedArgs: any[]) {
    super()
    this.methodName = methodName
    this.args = providedArgs
  }

  public override get message() {
    return `
Missing required callback function when calling ${this.methodName}
args provided were:
  ${this.args.join(',\n  ')}

A callback function must be provided as either the last or the second to last argument,
followed by options (which are not required).
    `
  }
}
