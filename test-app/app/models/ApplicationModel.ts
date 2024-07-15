import Dream from '../../../src/dream'
import Dreamconf from '../../../src/helpers/dreamconf'
import { allDefaultScopeNames, passthroughColumns, schema } from '../../db/schema'
import { DBClass } from '../../db/sync'
import dreamconf from '../conf/dreamconf'

export default class ApplicationModel extends Dream {
  public get dreamconf(): Dreamconf<
    DBClass,
    typeof schema,
    typeof allDefaultScopeNames,
    typeof passthroughColumns
  > {
    return dreamconf
  }
}
