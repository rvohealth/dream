import Dream from '../../../src/Dream.js'
import { DBClass } from '../../types/db.mysql.js'
import { globalTypeConfig } from '../../types/dream.globals.js'
import { connectionTypeConfig, schema } from '../../types/dream.mysql.js'

export default class MysqlApplicationModel extends Dream {
  declare public DB: DBClass

  public override get connectionName() {
    return 'mysql' as const
  }

  public override get schema(): any {
    return schema
  }

  public override get connectionTypeConfig() {
    return connectionTypeConfig
  }

  public override get globalTypeConfig() {
    return globalTypeConfig
  }
}
