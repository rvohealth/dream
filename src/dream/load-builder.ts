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
    this.dream = dream['clone']()
    this.query = new Query<DreamInstance>(this.dream as DreamInstance)
    this.dreamTransaction = txn
  }

  public passthrough<
    I extends LoadBuilder<DreamInstance>,
    PassthroughColumns extends DreamInstance['dreamconf']['passthroughColumns'],
  >(this: I, passthroughWhereStatement: PassthroughWhere<PassthroughColumns>) {
    this.query = this.query.passthrough(passthroughWhereStatement)
    return this
  }

  public load<
    I extends LoadBuilder<DreamInstance>,
    DB extends DreamInstance['dreamconf']['DB'],
    TableName extends DreamInstance['table'],
    Schema extends DreamInstance['dreamconf']['schema'],
    const Arr extends readonly unknown[],
  >(this: I, ...args: [...Arr, VariadicLoadArgs<DB, Schema, TableName, Arr>]) {
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
