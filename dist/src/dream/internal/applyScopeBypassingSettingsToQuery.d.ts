import Dream from '../../dream';
import Query from '../query';
import { AllDefaultScopeNames } from '../types';
export default function applyScopeBypassingSettingsToQuery<DreamInstance extends Dream>(query: Query<DreamInstance>, { bypassAllDefaultScopes, defaultScopesToBypass, }: {
    bypassAllDefaultScopes: boolean;
    defaultScopesToBypass: AllDefaultScopeNames<DreamInstance>[];
}): Query<DreamInstance>;
