import Dreamconf from '../../dreamconf'
import importFileWithDefault from '../importFileWithDefault'
import confPath from './confPath'

let _dreamconfCb: (dreamconf: Dreamconf) => void | Promise<void>

export default async function loadDreamconfCb(): Promise<(dreamconf: Dreamconf) => void | Promise<void>> {
  _dreamconfCb ||= (await importFileWithDefault(await confPath('dream'))) as (
    dreamconf: Dreamconf
  ) => void | Promise<void>
  return _dreamconfCb
}
