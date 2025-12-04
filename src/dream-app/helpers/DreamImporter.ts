import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import Dream from '../../Dream.js'
import { DreamModelSerializerType, SimpleObjectSerializerType } from '../../types/serializer.js'

export default class DreamImporter {
  public static async ls(dir: string): Promise<string[]> {
    try {
      const dirents = await fs.readdir(dir, { withFileTypes: true })
      const files = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/await-thenable
        dirents
          .map(dirent => {
            const res = path.resolve(dir, dirent.name)
            return dirent.isDirectory()
              ? this.ls(res)
              : ['.js', '.ts'].includes(path.extname(res))
                ? res
                : null
          })
          .filter(ent => ent !== null)
      )
      return Array.prototype.concat(...files)
    } catch (err) {
      if ((err as any).code === 'ENOENT') return []
      throw err
    }
  }

  public static async importDreams(
    pathToModels: string,
    importCb: (path: string) => Promise<any>
  ): Promise<[string, typeof Dream][]> {
    const modelPaths = await DreamImporter.ls(pathToModels)

    const modelClasses = (await Promise.all(
      modelPaths.map(modelPath =>
        importCb(modelPath).then(dreamClass => [modelPath, dreamClass as typeof Dream])
      )
    )) as [string, typeof Dream][]

    return modelClasses
  }

  public static async importSerializers(
    pathToSerializers: string,
    importCb: (path: string) => Promise<any>
  ): Promise<[string, Record<string, DreamModelSerializerType | SimpleObjectSerializerType>][]> {
    const serializerPaths = await DreamImporter.ls(pathToSerializers)

    const pathsNamesAndSerializers = (await Promise.all(
      serializerPaths.map(serializerPath =>
        importCb(serializerPath).then(serializerClass => [
          serializerPath,
          serializerClass as Record<string, DreamModelSerializerType | SimpleObjectSerializerType>,
        ])
      )
    )) as [string, Record<string, DreamModelSerializerType | SimpleObjectSerializerType>][]

    return pathsNamesAndSerializers
  }
}
