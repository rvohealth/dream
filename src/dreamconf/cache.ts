import Dreamconf from '.'

let _dreamconf: Dreamconf | undefined = undefined

export function cacheDreamconf(dreamconf: Dreamconf) {
  _dreamconf = dreamconf
}

export function getCachedDreamconfOrFail() {
  if (!_dreamconf) throw new Error('must call `cacheDreamconf` before loading cached dreamconf')
  return _dreamconf
}
