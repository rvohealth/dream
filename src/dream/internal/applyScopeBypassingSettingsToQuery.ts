import Dream from '../../Dream2'
import Query from '../Query2'
import { AllDefaultScopeNames } from '../types'

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
