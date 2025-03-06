import * as fs from 'fs/promises'
import * as path from 'path'
import Dream from '../../Dream'
import DreamSerializer from '../../serializer'

export default class DreamImporter {
  public static async ls(dir: string): Promise<string[]> {
    try {
      const dirents = await fs.readdir(dir, { withFileTypes: true })
      const files = await Promise.all(
        dirents
          .map(dirent => {
            const res = path.resolve(dir, dirent.name)
            const sanitizedPath = res.replace(/\.ts$/, '.js')
            return dirent.isDirectory() ? this.ls(res) : /\.js$/.test(sanitizedPath) ? sanitizedPath : null
          })
          .filter(ent => ent !== null)
      )
      return Array.prototype.concat(...files)
    } catch (err) {
      if ((err as any).code === 'ENOENT') return []
      throw err
    }
  }

  public static async importDreams(pathToModels: string, importCb: (path: string) => Promise<any>) {
    const modelPaths = await DreamImporter.ls(pathToModels)
    const modelClasses: [string, typeof Dream][] = []

    for (const modelPath of modelPaths) {
      modelClasses.push([modelPath, (await importCb(modelPath)) as typeof Dream])
    }

    return modelClasses
  }

  public static async importSerializers(pathToSerializers: string, importCb: (path: string) => Promise<any>) {
    const serializerPaths = await DreamImporter.ls(pathToSerializers)
    const serializerClasses: [string, Record<string, typeof DreamSerializer>][] = []

    for (const serializerPath of serializerPaths) {
      serializerClasses.push([
        serializerPath,
        (await importCb(serializerPath)) as Record<string, typeof DreamSerializer>,
      ])
    }

    return serializerClasses
  }

  public static async importServices(pathToServices: string, importCb: (path: string) => Promise<any>) {
    const servicePaths = await DreamImporter.ls(pathToServices)
    const serviceClasses: [string, any][] = []

    for (const servicePath of servicePaths) {
      serviceClasses.push([servicePath, await importCb(servicePath)])
    }

    return serviceClasses
  }
}
