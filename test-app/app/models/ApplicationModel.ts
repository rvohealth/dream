import Dream from '../../../src/dream'
import { globalSchema, schema } from '../../db/schema'
import { DBClass } from '../../db/sync'
import envConf from '../conf/env'

export default class ApplicationModel extends Dream {
  public DB: DBClass
  public env: typeof envConf
  public schema: typeof schema
  public globalSchema: typeof globalSchema
}
