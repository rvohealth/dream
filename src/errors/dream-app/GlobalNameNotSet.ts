/**
 * @internal
 *
 * Raised when something asks for a class's global name before one has been
 * configured. Dream raises it for a model; the framework packages layered on
 * Dream raise it for their own registries.
 *
 * Not exported from `@rvoh/dream/errors`. An unset global name is a
 * configuration gap that fails at boot, not a runtime condition an
 * application recovers from: there is nothing to catch and nothing an
 * application has cause to raise.
 */
export default class GlobalNameNotSet extends Error {
  constructor(private klass: any) {
    super()
  }

  public override get message() {
    return `
Attempted to reference global name for ${this.klass.name}, but the global name has not been set.`
  }
}
