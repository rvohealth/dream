import Dream from '../../dream';
import { DreamColumnNames } from '../../dream/types';
export type HookType = 'beforeCreate' | 'beforeSave' | 'beforeUpdate' | 'beforeDestroy' | 'afterCreate' | 'afterSave' | 'afterUpdate' | 'afterDestroy' | CommitHookType;
export type CommitHookType = 'afterCreateCommit' | 'afterSaveCommit' | 'afterUpdateCommit' | 'afterDestroyCommit';
export interface HookStatement {
    type: HookType;
    className: string;
    method: string;
    ifChanging?: string[];
    ifChanged?: string[];
}
export interface BeforeHookOpts<T extends Dream | null = null> {
    ifChanging?: T extends Dream ? DreamColumnNames<T>[] : string[];
}
export interface AfterHookOpts<T extends Dream | null = null> {
    ifChanged?: T extends Dream ? DreamColumnNames<T>[] : string[];
}
export declare function blankHooksFactory(dreamClass: typeof Dream): {
    beforeCreate: HookStatement[];
    beforeUpdate: HookStatement[];
    beforeSave: HookStatement[];
    beforeDestroy: HookStatement[];
    afterCreate: HookStatement[];
    afterCreateCommit: HookStatement[];
    afterUpdate: HookStatement[];
    afterUpdateCommit: HookStatement[];
    afterSave: HookStatement[];
    afterSaveCommit: HookStatement[];
    afterDestroy: HookStatement[];
    afterDestroyCommit: HookStatement[];
};
