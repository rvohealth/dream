import dreamconfPath from './dreamconfPath'
import Dreamconf from '../../dreamconf'

let _dreamconfCache: Dreamconf | null = null

export default async function loadDreamconfFile() {
  if (_dreamconfCache) return _dreamconfCache

  const dreamconf = (await import(await dreamconfPath())).default

  _dreamconfCache = dreamconf
  return dreamconf as Dreamconf
}
