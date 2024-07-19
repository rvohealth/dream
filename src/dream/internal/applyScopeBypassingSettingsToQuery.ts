import Dream from '../../dream'
import Query from '../query'
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
