export default class ServiceGlobalNameConflict extends Error {
  constructor(private serviceClassGlobalName: string) {
    super()
  }

  public get message() {
    return `
Attempted to register ${this.serviceClassGlobalName}, but something else was detected with the same
name. To fix this, make sure the class name you use for this service is unique to your system.

For services, you can specify a different name to register on by adding a static "globalName" getter:

class ${this.serviceClassGlobalName} {
  public static globalName() {
    return 'MyCustomGlobalName'
  }
}`
  }
}
