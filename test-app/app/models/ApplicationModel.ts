import Dream from '../../../src/Dream2'
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

export class Decs extends ApplicationModel {}
