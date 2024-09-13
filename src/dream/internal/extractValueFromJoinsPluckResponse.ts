import Dream from '../../dream'
import { marshalDBValue } from '../../helpers/marshalDBValue'
import { AssociationNameToDreamClass } from '../types'

export const extractValueFromJoinsPluckResponse = (
  val: any,
  index: number,
  pluckStatement: any[],
  dreamClass: typeof Dream,
  associationNameMap: AssociationNameToDreamClass
) => {
  const parts = pluckStatement[index].split('.')

  if (parts.length === 1 || parts[0] === dreamClass.prototype['table']) {
    const column = parts[0]
    return marshalDBValue(dreamClass, column, val)
  } else {
    const [associationName, column] = parts
    return marshalDBValue(associationNameMap[associationName], column, val)
  }
}
