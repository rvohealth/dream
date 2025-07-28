import Dream from '../../../src/Dream.js'
import { DBClass } from '../../types/db.alternateConnection.js'
import { dreamTypeConfig, schema } from '../../types/dream.alternateConnection.js'

export default class AlternateConnectionApplicationModel extends Dream {
  declare public DB: DBClass

  public override get connectionName() {
    return 'alternateConnection' as const
  }

  public override get schema(): any {
    return schema
  }

  public override get dreamTypeConfig() {
    return dreamTypeConfig
  }
}

export class Decs extends AlternateConnectionApplicationModel {}
