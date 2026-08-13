import Decorators from '../../../src/decorators/Decorators.js'
import DreamTransaction from '../../../src/dream/DreamTransaction.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof CommitHookSortableModel>()

/**
 * A sortable model with a hook in every after-hook and commit-hook family,
 * each recording the transaction argument it received, for specs to interpose
 * on. Exists to pin that on a self-opened sortable save the scope lock is
 * released at COMMIT — before any user after-hook runs — that the `*Commit`
 * families receive no transaction, and that a throwing after-hook leaves the
 * committed row in place.
 */
export default class CommitHookSortableModel extends ApplicationModel {
  public override get table() {
    return 'unscoped_sortable_models' as const
  }

  public id: DreamColumn<CommitHookSortableModel, 'id'>
  public createdAt: DreamColumn<CommitHookSortableModel, 'createdAt'>
  public updatedAt: DreamColumn<CommitHookSortableModel, 'updatedAt'>

  @deco.Sortable()
  public position: DreamColumn<CommitHookSortableModel, 'position'>

  /**
   * The transaction argument each hook invocation received, in invocation
   * order. Specs that read it reset it first.
   */
  public static receivedHookCalls: {
    hook: string
    txn: DreamTransaction<any> | null | undefined
  }[] = []

  @deco.AfterSave()
  public runsAfterSave(txn?: DreamTransaction<any> | null): Promise<void> | void {
    CommitHookSortableModel.receivedHookCalls.push({ hook: 'afterSave', txn })
  }

  @deco.AfterCreate()
  public runsAfterCreate(txn?: DreamTransaction<any> | null): Promise<void> | void {
    CommitHookSortableModel.receivedHookCalls.push({ hook: 'afterCreate', txn })
  }

  @deco.AfterUpdate()
  public runsAfterUpdate(txn?: DreamTransaction<any> | null): Promise<void> | void {
    CommitHookSortableModel.receivedHookCalls.push({ hook: 'afterUpdate', txn })
  }

  @deco.AfterCreateCommit()
  public runsAfterCreateCommit(txn?: DreamTransaction<any> | null): Promise<void> | void {
    CommitHookSortableModel.receivedHookCalls.push({ hook: 'afterCreateCommit', txn })
  }

  @deco.AfterUpdateCommit()
  public runsAfterUpdateCommit(txn?: DreamTransaction<any> | null): Promise<void> | void {
    CommitHookSortableModel.receivedHookCalls.push({ hook: 'afterUpdateCommit', txn })
  }

  @deco.AfterSaveCommit()
  public runsAfterSaveCommit(txn?: DreamTransaction<any> | null): Promise<void> | void {
    CommitHookSortableModel.receivedHookCalls.push({ hook: 'afterSaveCommit', txn })
  }
}
