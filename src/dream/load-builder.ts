import { PassthroughWhere } from '../decorators/associations/shared'
import Dream from '../dream'
import Query from './query'
import DreamTransaction from './transaction'
import { VariadicLoadArgs } from './types'

export default class LoadBuilder<DreamInstance extends Dream> {
  private dream: Dream
  private dreamTransaction: DreamTransaction<any> | undefined
  private query: Query<DreamInstance>

  constructor(dream: Dream, txn?: DreamTransaction<any>) {
    this.dream = dream.clone()
    this.query = new Query<DreamInstance>(this.dream as DreamInstance)
    this.dreamTransaction = txn
  }

  public passthrough<I extends LoadBuilder<DreamInstance>, AllColumns extends DreamInstance['allColumns']>(
    this: I,
    passthroughWhereStatement: PassthroughWhere<AllColumns>
  ) {
    this.query = this.query.passthrough(passthroughWhereStatement)
    return this
  }

  public load<
    I extends LoadBuilder<DreamInstance>,
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<Schema, TableName, Arr>]) {
    this.query = this.query.preload(...(args as any))
    return this
  }

  public async execute(): Promise<DreamInstance> {
    if (this.dreamTransaction) {
      this.query = this.query.txn(this.dreamTransaction)
    }

    await this.query['hydratePreload'](this.dream)
    return this.dream as DreamInstance
  }
}
