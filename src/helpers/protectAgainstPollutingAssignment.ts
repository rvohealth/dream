import PrototypePollutingAssignment from '../errors/PrototypePollutingAssignment'

const reservedKeys = new Map([
  ['__proto__', true],
  ['constructor', true],
  ['prototype', true],
])

export default function protectAgainstPollutingAssignment(key: string) {
  if (reservedKeys.get(key)) throw new PrototypePollutingAssignment(key)
  return key
}
