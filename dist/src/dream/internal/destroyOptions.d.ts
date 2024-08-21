import Dream from '../../dream';
import { AllDefaultScopeNames } from '../types';
export interface DestroyOptions<DreamInstance extends Dream> {
    bypassAllDefaultScopes?: boolean;
    defaultScopesToBypass?: AllDefaultScopeNames<DreamInstance>[];
    cascade?: boolean;
    skipHooks?: boolean;
}
export declare function destroyOptions<DreamInstance extends Dream>(options: DestroyOptions<DreamInstance>): {
    reallyDestroy: boolean;
    bypassAllDefaultScopes: boolean;
    defaultScopesToBypass: Exclude<DreamInstance["globalSchema" & keyof DreamInstance]["allDefaultScopeNames" & keyof DreamInstance["globalSchema" & keyof DreamInstance]][number & keyof DreamInstance["globalSchema" & keyof DreamInstance]["allDefaultScopeNames" & keyof DreamInstance["globalSchema" & keyof DreamInstance]]], "dream:STI">[];
    cascade: boolean;
    skipHooks: boolean;
};
export declare function undestroyOptions<DreamInstance extends Dream>(options: DestroyOptions<DreamInstance>): {
    defaultScopesToBypass: Exclude<DreamInstance["globalSchema" & keyof DreamInstance]["allDefaultScopeNames" & keyof DreamInstance["globalSchema" & keyof DreamInstance]][number & keyof DreamInstance["globalSchema" & keyof DreamInstance]["allDefaultScopeNames" & keyof DreamInstance["globalSchema" & keyof DreamInstance]]], "dream:STI">[];
    bypassAllDefaultScopes: boolean;
    cascade: boolean;
    skipHooks: boolean;
};
export declare function reallyDestroyOptions<DreamInstance extends Dream>(options: DestroyOptions<DreamInstance>): {
    reallyDestroy: boolean;
    defaultScopesToBypass: Exclude<DreamInstance["globalSchema" & keyof DreamInstance]["allDefaultScopeNames" & keyof DreamInstance["globalSchema" & keyof DreamInstance]][number & keyof DreamInstance["globalSchema" & keyof DreamInstance]["allDefaultScopeNames" & keyof DreamInstance["globalSchema" & keyof DreamInstance]]], "dream:STI">[];
    bypassAllDefaultScopes: boolean;
    cascade: boolean;
    skipHooks: boolean;
};
