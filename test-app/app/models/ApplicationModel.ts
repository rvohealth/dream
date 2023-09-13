import Dream from '../../../src/dream'
import { DBClass } from '../../db/schema'

export default class ApplicationModel extends Dream {
  public get DB() {
    return new DBClass()
  }
}
