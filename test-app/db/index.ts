import { default as _db } from '../../src/db/index.js'
import { DbConnectionType } from '../../src/index.js'
import ApplicationModel from '../app/models/ApplicationModel.js'

export default function db(connectionName: string, connectionType: DbConnectionType = 'primary') {
  return _db<ApplicationModel>(connectionName, connectionType)
}
