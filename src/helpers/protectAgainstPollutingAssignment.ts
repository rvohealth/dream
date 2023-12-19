import PrototypePollutingAssignment from '../exceptions/prototype-polluting-assignment'

export default function protectAgainstPollutingAssignment(key: string) {
  if (['_proto_', 'constructor', 'prototype'].includes(key)) throw new PrototypePollutingAssignment(key)
  return key
}
