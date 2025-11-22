import Dream from '../../../src/Dream.js'
import { connectionTypeConfig, schema } from '../../types/dream.js'
import { globalTypeConfig } from '../../types/dream.globals.js'
import { DB } from '../../types/db.js'

export default class ApplicationModel extends Dream {
  declare public DB: DB

  public override get schema() {
    return schema
  }

  public override get connectionTypeConfig() {
    return connectionTypeConfig
  }

  public override get globalTypeConfig() {
    return globalTypeConfig
  }
}

export class Decs extends ApplicationModel {}
