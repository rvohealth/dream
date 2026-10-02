import Decorators from '../../../src/decorators/Decorators.js'
import DreamTransaction from '../../../src/dream/DreamTransaction.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof CommitHookSortableModel>()

/**
 * A sortable model with a hook in every after-hook and commit-hook family,
 * each recording that it ran, for specs to interpose on. Exists to pin that on
 * a self-opened sortable save the scope lock is released at COMMIT — before
 * any user after-hook runs — that the `*Commit` families are called with no
 * argument, and that a throwing after-hook leaves the committed row in place.
 * The afterDestroy hook records the scope's surviving positions, pinning that
 * the compaction runs before every user afterDestroy hook — the hooks here are
 * method decorators, which register ahead of any field decorator's work, so a
 * compaction seated among the hooks would run after this one.
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
   * The family of each hook invocation, in invocation order. Specs that read
   * it reset it first.
   */
  public static invokedHooks: string[] = []

  /**
   * The scope's positions as the afterDestroy hook below observed them, one
   * array per destroy. Specs that read it reset it first.
   */
  public static observedPositionsInAfterDestroy: (number | null)[][] = []

  @deco.AfterDestroy()
  public async recordsSurvivorPositions(txn?: DreamTransaction<any> | null): Promise<void> {
    if (!txn) return
    const survivors = await CommitHookSortableModel.txn(txn).order('position').all()
    CommitHookSortableModel.observedPositionsInAfterDestroy.push(survivors.map(record => record.position))
  }

  @deco.AfterSave()
  public runsAfterSave(): Promise<void> | void {
    CommitHookSortableModel.invokedHooks.push('afterSave')
  }

  @deco.AfterCreate()
  public runsAfterCreate(): Promise<void> | void {
    CommitHookSortableModel.invokedHooks.push('afterCreate')
  }

  @deco.AfterUpdate()
  public runsAfterUpdate(): Promise<void> | void {
    CommitHookSortableModel.invokedHooks.push('afterUpdate')
  }

  @deco.AfterCreateCommit()
  public runsAfterCreateCommit(): Promise<void> | void {
    CommitHookSortableModel.invokedHooks.push('afterCreateCommit')
  }

  @deco.AfterUpdateCommit()
  public runsAfterUpdateCommit(): Promise<void> | void {
    CommitHookSortableModel.invokedHooks.push('afterUpdateCommit')
  }

  @deco.AfterSaveCommit()
  public runsAfterSaveCommit(): Promise<void> | void {
    CommitHookSortableModel.invokedHooks.push('afterSaveCommit')
  }
}
