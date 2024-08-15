import getFiles from '../../helpers/getFiles'
import globalServiceKeyFromPath from './globalServiceKeyFromPath'

let _services: Record<string, any>

export default async function loadServices(servicesPath: string): Promise<Record<string, any>> {
  if (_services) return _services

  _services = {}
  const servicePaths = (await getFiles(servicesPath)).filter(path => /\.[jt]s$/.test(path))

  for (const servicePath of servicePaths) {
    const serviceClass = (await import(servicePath)).default

    // we only want to register services within our app
    // that are backgroundable, since the only purpose
    // for keeping these indices is to be able to summon
    // a service for backgrounding.
    if (typeof serviceClass?.background === 'function' || typeof serviceClass?.schedule === 'function') {
      const serviceKey = globalServiceKeyFromPath(servicePath, servicesPath)

      if (typeof serviceClass['setGlobalName'] === 'function') {
        serviceClass['setGlobalName'](serviceKey)
      } else {
        serviceClass.globalName = serviceKey
      }

      _services[serviceKey] = serviceClass
    }
  }

  return _services
}

export function setCachedServices(services: Record<string, any>) {
  _services = services
}

export function getServicesOrFail() {
  if (!_services) throw new Error('Must call loadServices before calling getServicesOrFail')
  return _services
}

export function getServicesOrBlank() {
  return _services || {}
}
