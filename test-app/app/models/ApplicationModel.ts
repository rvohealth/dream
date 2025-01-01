import Dream from '../../../src/Dream'
import { globalSchema, schema } from '../../types/dream'
import { DBClass } from '../../types/db'

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
