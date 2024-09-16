import PrototypePollutingAssignment from '../exceptions/prototype-polluting-assignment'

const reservedKeys = new Map([
  ['__proto__', true],
  ['constructor', true],
  ['prototype', true],
])

export default function protectAgainstPollutingAssignment(key: string) {
  if (reservedKeys.get(key)) throw new PrototypePollutingAssignment(key)
  return key
}
