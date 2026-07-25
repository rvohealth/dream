export default class InvalidBatchSize extends Error {
  private batchSize: unknown
  constructor(batchSize: unknown) {
    super()
    this.batchSize = batchSize
  }

  public override get message() {
    return `
Invalid batchSize provided.

batchSize given:
  ${String(this.batchSize)}

batchSize must be a positive integer. A batchSize of 0 is especially dangerous,
since a limit of 0 is treated as "no limit", which would collapse a batched
operation into a single unbounded pass over the entire matched set.
`
  }
}
