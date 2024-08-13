import getFiles from '../../helpers/getFiles'
import globalNameIsAvailable from './globalNameIsAvailable'

let _services: Record<string, any>

export default async function loadServices(servicesPath: string): Promise<Record<string, any>> {
  if (_services) return _services

  _services = {}
  const servicePaths = (await getFiles(servicesPath)).filter(path => /\.[jt]s$/.test(path))

  for (const servicePath of servicePaths) {
    const service = (await import(servicePath)).default
    const serviceName = service.globalName || service.name
    if (serviceName) {
      if (!globalNameIsAvailable(serviceName)) {
        throw new Error(
          `
Attempted to register ${serviceName}, but something else was detected with the same
name. To fix this, make sure the class name you use for this service is unique to your system.

For services, you can specify a different name to register on by adding a static "globalName" getter:

class ${serviceName} {
  public static globalName() {
    return 'MyCustomGlobalName'
  }
}`
        )
      }

      _services[serviceName] = service
    }
  }

  return _services
}

export function getServicesOrFail() {
  if (!_services) throw new Error('Must call loadServices before calling getServicesOrFail')
  return _services
}

export function getServicesOrBlank() {
  return _services || {}
}
