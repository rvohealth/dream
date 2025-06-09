import ConnectedToDB from '../../db/ConnectedToDB.js'
import Dream from '../../Dream.js'
import Query from '../Query.js'

export default class QueryDriverBase<DreamInstance extends Dream> extends ConnectedToDB<DreamInstance> {
  constructor(public query: Query<DreamInstance, any>) {
    super(query.dreamInstance, query['originalOpts'])
  }
}
