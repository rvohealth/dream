import Dream from '../../Dream.js'
import Query from '../../dream/Query.js'

export default function primaryKeyType(connectionName: string) {
  const dbDriverClass = Query.dbDriverClass<Dream>(connectionName)
  return dbDriverClass.primaryKeyType()
}
