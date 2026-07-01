export default class MaxRecursiveStringCaseDepthExceeded extends Error {
  private maxDepth: number
  constructor(maxDepth: number) {
    super()
    this.maxDepth = maxDepth
  }

  public override get message() {
    return `
Maximum recursion depth (${this.maxDepth}) exceeded while string-casing an object.
The input is nested more deeply than Dream will process, which usually means it is
malformed or maliciously deeply-nested rather than legitimate application data.
    `
  }
}
