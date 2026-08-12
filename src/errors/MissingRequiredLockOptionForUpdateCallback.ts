export default class MissingRequiredLockOptionForUpdateCallback extends Error {
  public override get message() {
    return `
When passing a callback to Query#update, the options object and its \`lock\`
key are required, and \`lock\` must be an explicit boolean:

  await User.query().update(user => ({ ... }), { lock: true })
  await User.query().update(user => ({ ... }), { lock: false })

\`lock: true\` runs the callback on each record after re-selecting it under an
exclusive row lock (a compare-then-write). \`lock: false\` actively opts out of
locking: the callback runs on each record with no lock and no compare-and-set
guarantee. Requiring the boolean keeps that choice visible at the call site.
`
  }
}
