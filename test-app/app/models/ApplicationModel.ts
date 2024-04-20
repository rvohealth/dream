import Dream from '../../../src/dream'
import { AllColumns, DBClass, schema } from '../../db/schema'
import Dreamconf from '../../../src/helpers/dreamconf'
import dreamconf from '../conf/dreamconf'

export default class ApplicationModel extends Dream {
  public get DB() {
    return new DBClass()
  }

  public get allColumns(): typeof AllColumns {
    return AllColumns
  }

  public get dreamconf(): Dreamconf<DBClass, typeof schema> {
    return dreamconf
  }
}
