import Dream from '../../Dream.js'
import Query from '../Query.js'
import { AllDefaultScopeNames } from '../types.js'

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
