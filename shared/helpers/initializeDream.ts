import confPath from './path/confPath'

let initialized = false
export default async function initializeDream() {
  if (initialized) return

  const inflections = (await import(await confPath('inflections')))?.default
  if (typeof inflections === 'function') {
    await inflections()
  }

  initialized = true
}
