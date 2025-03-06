import DreamImporter from '../../../../src/dream-application/helpers/DreamImporter'
import srcPath from '../../helpers/srcPath'

export default async function loadServices() {
  return await DreamImporter.importSerializers(
    srcPath('app', 'serializers'),
    async path => await import(path)
  )
}
