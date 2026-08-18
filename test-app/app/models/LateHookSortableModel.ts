import Decorators from '../../../src/decorators/Decorators.js'
import { DreamColumn } from '../../../src/types/dream.js'
import ApplicationModel from './ApplicationModel.js'

const decoBase = new Decorators<typeof LateHookSortableBase>()

/**
 * Not exported as a model: exists so that the Sortable field is declared on a
 * base class and the `beforeSave` hook below on the subclass, which is the
 * arrangement that registers the consumer hook *after* Sortable's — on a single
 * class, method-decorator initializers always run before field-decorator
 * initializers, so a same-class hook cannot land after the sortable one.
 */
class LateHookSortableBase extends ApplicationModel {
  public override get table() {
    return 'text_scoped_sortable_models' as const
  }

  public id: DreamColumn<LateHookSortableBase, 'id'>
  public scopeA: DreamColumn<LateHookSortableBase, 'scopeA'>
  public scopeB: DreamColumn<LateHookSortableBase, 'scopeB'>
  public createdAt: DreamColumn<LateHookSortableBase, 'createdAt'>
  public updatedAt: DreamColumn<LateHookSortableBase, 'updatedAt'>

  @decoBase.Sortable({ scope: 'scopeA' })
  public position: DreamColumn<LateHookSortableBase, 'position'>
}

const deco = new Decorators<typeof LateHookSortableModel>()

/**
 * A sortable model with a consumer `beforeSave` hook registered after
 * Sortable's, which introduces a position or scope change mid-save. Exists to
 * pin that sortable preparation runs as a phase after every consumer
 * before-hook, so a change a late hook introduces gets full position handling
 * rather than slipping past a decision made earlier in the hook chain.
 */
export default class LateHookSortableModel extends LateHookSortableBase {
  /**
   * Not columns: values the beforeSave hook below applies, so that the
   * position/scope change is introduced by the hook itself during the save
   * rather than by the caller before it.
   */
  public stagedPosition: number | undefined
  public stagedScopeA: string | undefined

  @deco.BeforeSave()
  public applyStagedChanges(this: LateHookSortableModel) {
    if (this.stagedPosition !== undefined) {
      this.position = this.stagedPosition
      this.stagedPosition = undefined
    }

    if (this.stagedScopeA !== undefined) {
      this.scopeA = this.stagedScopeA
      this.stagedScopeA = undefined
    }
  }
}
