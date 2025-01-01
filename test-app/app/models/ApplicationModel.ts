import Dream from '../../../src/Dream'
import { globalSchema, schema } from '../../types/schema'
import { DBClass } from '../../types/sync'

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
