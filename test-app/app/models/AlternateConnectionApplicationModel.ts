import Dream from '../../../src/Dream.js'
import { DB } from '../../types/db.alternateConnection.js'
import { connectionTypeConfig, schema } from '../../types/dream.alternateConnection.js'
import { globalTypeConfig } from '../../types/dream.globals.js'

export default class AlternateConnectionApplicationModel extends Dream {
  declare public DB: DB

  public override get connectionName() {
    return 'alternateConnection' as const
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

export class Decs extends AlternateConnectionApplicationModel {}
