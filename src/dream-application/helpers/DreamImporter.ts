import * as fs from 'fs/promises'
import * as path from 'path'
import Dream from '../../Dream'
import DreamSerializer from '../../serializer'

export default class DreamImporter {
  public static async ls(dir: string): Promise<string[]> {
    try {
      const dirents = await fs.readdir(dir, { withFileTypes: true })
      const files = await Promise.all(
        dirents.map(dirent => {
          const res = path.resolve(dir, dirent.name)
          return dirent.isDirectory() ? this.ls(res) : res.replace(/\.ts$/, '.js')
        })
      )
      return Array.prototype.concat(...files)
    } catch (err) {
      if ((err as any).code === 'ENOENT') return []
      throw err
    }
  }

  public static async importDreams(modelPaths: string[]) {
    const modelClasses: [string, typeof Dream][] = []

    for (const modelPath of modelPaths) {
      modelClasses.push([modelPath, (await import(modelPath)).default as typeof Dream])
    }

    return modelClasses
  }

  public static async importSerializers(serializerPaths: string[]) {
    const serializerClasses: [string, Record<string, typeof DreamSerializer>][] = []

    for (const serializerPath of serializerPaths) {
      serializerClasses.push([
        serializerPath,
        (await import(serializerPath)) as Record<string, typeof DreamSerializer>,
      ])
    }

    return serializerClasses
  }

  public static async importServices(servicePaths: string[]) {
    const serviceClasses: [string, any][] = []

    for (const servicePath of servicePaths) {
      serviceClasses.push([servicePath, (await import(servicePath)).default])
    }

    return serviceClasses
  }
}
