import { Dream } from '@rvoh/dream'
import { globalSchema, schema } from '../../db/schema'
import { DBClass } from '../../db/sync'

export default class ApplicationModel extends Dream {
  public DB: DBClass
  public get schema() {
    return schema
  }

  public get globalSchema() {
    return globalSchema
  }
}
