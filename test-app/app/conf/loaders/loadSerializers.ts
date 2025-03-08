import DreamImporter from '../../../../src/dream-application/helpers/DreamImporter'
import srcPath from '../../helpers/srcPath'

export default async function loadServices() {
  const serializerPaths = await DreamImporter.ls(srcPath('app', 'serializers'))
  return await DreamImporter.importSerializers(serializerPaths)
}
