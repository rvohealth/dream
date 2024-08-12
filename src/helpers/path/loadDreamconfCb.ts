import DreamApplication from '../../dream-application'
import importFileWithDefault from '../importFileWithDefault'
import confPath from './confPath'

let _dreamconfCb: (dreamconf: DreamApplication) => void | Promise<void>

export default async function loadDreamconfCb(): Promise<
  (dreamconf: DreamApplication) => void | Promise<void>
> {
  _dreamconfCb ||= (await importFileWithDefault(await confPath('dream'))) as (
    dreamconf: DreamApplication
  ) => void | Promise<void>
  return _dreamconfCb
}
