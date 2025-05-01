import { DreamAppInitializerCb } from '../../../types/dream-app.js'
import DreamImporter from '../DreamImporter.js'

let _initializers: Record<string, DreamAppInitializerCb>

export default async function importInitializers(
  initializersPath: string,
  initializerImportCb: (path: string) => Promise<any>
): Promise<Record<string, DreamAppInitializerCb>> {
  if (_initializers) return _initializers

  const initializerCbs = await DreamImporter.importInitializers(initializersPath, initializerImportCb)

  _initializers = {}

  initializerCbs.forEach(([initializerPath, initializerCb]) => {
    _initializers[initializerPath] = initializerCb
  })

  return _initializers
}

export function setCachedInitializers(initializerCbs: Record<string, DreamAppInitializerCb>) {
  _initializers = initializerCbs
}

export function getInitializersOrFail() {
  if (!_initializers)
    throw new Error("Must call DreamApp.load('initializers', ...) before calling getInitializersOrFail")
  return _initializers
}

export function getInitializersOrBlank() {
  return _initializers || {}
}
