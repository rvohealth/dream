import getFiles from '../../helpers/getFiles'
import importFile from '../../helpers/path/importFile'

let _services: Record<string, any>

export default async function loadServices(servicesPath: string): Promise<Record<string, any>> {
  if (_services) return _services

  _services = {}
  const servicePaths = (await getFiles(servicesPath)).filter(path => /\.[jt]s$/.test(path))

  for (const servicePath of servicePaths) {
    const service = (await importFile(servicePath)).default
    if (service.name) {
      _services[service.name] = service
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
