import Dream from '../../Dream.js'
import Query from '../../dream/Query.js'

export default function primaryKeyType() {
  const dbDriverClass = Query.dbDriverClass<Dream>()
  return dbDriverClass.primaryKeyType()
}
