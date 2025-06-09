import Dream from '../../Dream.js'
import KyselyQueryDriver from './Kysely.js'

export default class PostgresQueryDriver<
  DreamInstance extends Dream,
> extends KyselyQueryDriver<DreamInstance> {}
