import DreamImporter from '../../../../src/dream-application/helpers/DreamImporter'
import srcPath from '../../helpers/srcPath'

export default async function loadModels() {
  const modelPaths = await DreamImporter.ls(srcPath('app', 'models'))
  return await DreamImporter.importDreams(modelPaths)
}
