import Dream from '../../Dream.js.js'
import Query from '../Query.js.js'
import { AllDefaultScopeNames } from '../types.js.js'

export default function applyScopeBypassingSettingsToQuery<DreamInstance extends Dream>(
  query: Query<DreamInstance>,
  {
    bypassAllDefaultScopes,
    defaultScopesToBypass,
  }: {
    bypassAllDefaultScopes: boolean
    defaultScopesToBypass: AllDefaultScopeNames<DreamInstance>[]
  }
) {
  if (bypassAllDefaultScopes) query = query.removeAllDefaultScopes()

  defaultScopesToBypass.forEach(defaultScopeToBypass => {
    query = query.removeDefaultScope(defaultScopeToBypass)
  })

  return query
}
