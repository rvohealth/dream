import ConnectedToDB from '../../db/ConnectedToDB.js'
import Dream from '../../Dream.js'
import Query from '../Query.js'

export default class QueryDriverBase<DreamInstance extends Dream> extends ConnectedToDB<DreamInstance> {
  constructor(public query: Query<DreamInstance, any>) {
    super(query.dreamInstance, query['originalOpts'])
  }

  public static async migrate() {
    throw new Error('override migrate in child class')
  }

  public static async rollback(_: { steps: number }) {
    throw new Error('override rollback in child class')
  }

  public static async dbCreate() {
    throw new Error('override dbCreate on child class')
  }

  public static async dbDrop() {
    throw new Error('override dbDrop on child class')
  }

  public static async generateMigration(migrationName: string, columnsWithTypes: string[]) {
    throw new Error('override generateMigration in child class')
  }

  public static async sync(_: () => Promise<void> | void) {
    throw new Error('override sync on child class')
  }

  /**
   * @internal
   *
   * This method is used internally by a Query driver to
   * take the result of a single row in a database, and
   * turn that row into the provided dream instance.
   *
   * this should be overridden depending on the approach
   * to pulling from the db. It should essentially take
   * a db row of some type, and return an instance of the
   * dream class provided as a second argument.
   */
  protected dbResultToDreamInstance<DreamClass extends typeof Dream, RetType = InstanceType<DreamClass>>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    __: typeof Dream
  ): RetType {
    throw new Error('Implement this in your child driver class')
    // return sqlResultToDreamInstance(dreamClass, result) as InstanceType<DreamClass>
  }
}
