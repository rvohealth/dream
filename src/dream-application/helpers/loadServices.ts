import ServiceGlobalNameConflict from '../../exceptions/dream-application/service-global-name-conflict'
import getFiles from '../../helpers/getFiles'
import globalNameIsAvailable from './globalNameIsAvailable'
import pathToGlobalKey from './pathToGlobalKey'

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
    if (typeof serviceClass.background === 'function') {
      const serviceKey = pathToGlobalKey(servicePath, /^.*app\/services\//)

      if (!globalNameIsAvailable(serviceKey)) throw new ServiceGlobalNameConflict(serviceKey)

      serviceClass.globalName = serviceKey

      _services[serviceKey] = serviceClass
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
