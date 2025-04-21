import { Decorators, DreamColumn } from '../../../src/index.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof ModelWithDateTimeConditionalHooks>()

export default class ModelWithDateTimeConditionalHooks extends ApplicationModel {
  public override get table() {
    return 'model_with_date_time_conditional_hooks' as const
  }

  public id: DreamColumn<ModelWithDateTimeConditionalHooks, 'id'>
  public counter: DreamColumn<ModelWithDateTimeConditionalHooks, 'counter'>
  public somethingHappenedAt: DreamColumn<ModelWithDateTimeConditionalHooks, 'somethingHappenedAt'>
  public somethingHappenedInATransactionAt: DreamColumn<
    ModelWithDateTimeConditionalHooks,
    'somethingHappenedInATransactionAt'
  >
  public createdAt: DreamColumn<ModelWithDateTimeConditionalHooks, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithDateTimeConditionalHooks, 'updatedAt'>

  @deco.AfterSaveCommit({ ifChanged: ['somethingHappenedAt'] })
  public async incrementCounter(this: ModelWithDateTimeConditionalHooks) {
    await this.update({ counter: this.counter + 1 })
  }

  @deco.AfterSaveCommit({ ifChanged: ['somethingHappenedAt'] })
  public async incrementCounterInATransaction(this: ModelWithDateTimeConditionalHooks) {
    await ApplicationModel.transaction(async txn => await this.txn(txn).update({ counter: this.counter + 1 }))
  }
}
