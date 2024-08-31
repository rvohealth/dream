import PrototypePollutingAssignment from '../exceptions/prototype-polluting-assignment'

const reservedKeys = new Map([
  ['_proto_', true],
  ['constructor', true],
  ['prototype', true],
])

export default function protectAgainstPollutingAssignment(key: string) {
  if (reservedKeys.get(key)) throw new PrototypePollutingAssignment(key)
  return key
}
