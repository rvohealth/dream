import Dream from '../../Dream.js'

export default function ensureSTITypeFieldIsSet<T extends Dream>(dream: T) {
  const Base = dream.constructor as typeof Dream
  if (Base['sti'].value && !(dream as any).type) {
    ;(dream as any).type = Base['sti'].value
  }
}
