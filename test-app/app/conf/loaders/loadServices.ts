import DreamImporter from '../../../../src/dream-application/helpers/DreamImporter'
import srcPath from '../../helpers/srcPath'

export default async function loadServices() {
  const servicePaths = await DreamImporter.ls(srcPath('app', 'services'))
  return await DreamImporter.importServices(servicePaths, async path => (await import(path)).default)
}
