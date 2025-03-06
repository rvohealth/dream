import DreamImporter from '../../../../src/dream-application/helpers/DreamImporter'
import srcPath from '../../helpers/srcPath'

export default async function loadServices() {
  return await DreamImporter.importServices(
    srcPath('app', 'services'),
    async path => (await import(path)).default
  )
}
