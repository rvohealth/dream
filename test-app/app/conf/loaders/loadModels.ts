import DreamImporter from '../../../../src/dream-application/helpers/DreamImporter'
import srcPath from '../../helpers/srcPath'

export default async function loadModels() {
  return await DreamImporter.importDreams(
    srcPath('app', 'models'),
    async path => (await import(path)).default
  )
}
