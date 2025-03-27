import Dream from '../../../src/Dream.js'
import { DBClass } from '../../types/db.js'
import { globalSchema, schema } from '../../types/dream.js'

export default class ApplicationModel extends Dream {
  declare public DB: DBClass
  public override get schema() {
    return schema
  }

  public override get globalSchema() {
    return globalSchema
  }
}

export class Decs extends ApplicationModel {}
