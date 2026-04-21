export default class SspawnRequiresDevelopmentOrTest extends Error {
  private command: string
  constructor(command: string) {
    super()
    this.command = command
  }

  public override get message() {
    return `
DreamCLI.spawn refused to run outside development or test
(NODE_ENV must be 'development' or 'test').

DreamCLI.spawn is dev-time CLI glue (scaffolding, docs generation,
type sync). It must never run in a deployed process — production has
no business shelling out arbitrary commands, and refusing here turns
the dev-only contract into a runtime invariant. Checking
\`!isDevelopmentOrTest\` (rather than \`isProduction\`) means
staging-style envs and any unforeseen NODE_ENV value also fail closed.

If you reached this from a deploy step, route the work through direct
child_process APIs at the call site with explicit argv and a documented
threat model rather than through this helper.

  command: ${this.command}
    `
  }
}
