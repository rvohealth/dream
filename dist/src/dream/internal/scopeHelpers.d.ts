import Dream from '../../dream';
import { AllDefaultScopeNames } from '../types';
export declare const DEFAULT_BYPASS_ALL_DEFAULT_SCOPES = false;
export declare const DEFAULT_CASCADE = true;
export declare const DEFAULT_DEFAULT_SCOPES_TO_BYPASS: never[];
export declare const DEFAULT_SKIP_HOOKS = false;
export declare function addSoftDeleteScopeToUserScopes<DreamInstance extends Dream>(userScopes?: AllDefaultScopeNames<DreamInstance>[]): AllDefaultScopeNames<DreamInstance>[];
