import * as path from 'path'
import { promises as fs } from 'fs'
import Dream from '../dream'
import { loadDreamYamlFile, modelsPath } from './path'

export default async function loadModels() {
  const pathToModels = await modelsPath()
  const yamlConf = await loadDreamYamlFile()
  const modelPaths = await fs.readdir(pathToModels)
  const models: { [key: string]: typeof Dream } = {}

  for (const modelPath of modelPaths.filter(path => /\.ts$/.test(path))) {
    const fullPath = path.join(pathToModels, modelPath)
    const relativePath =
      `../../${yamlConf.models_path}/` +
      fullPath
        .replace(new RegExp(`^${process.cwd()}`, ''), '')
        .replace(new RegExp(`^\/${yamlConf.models_path}\/`), '')

    let ModelClass: typeof Dream | null = null
    try {
      ModelClass = (await import(relativePath)).default
    } catch (error) {
      console.log(`Failed to import the following file: ${fullPath}. Error: ${error}`)
    }

    models[modelPath.replace(/\.ts$/, '')] = ModelClass!
  }

  return models
}

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    })
  )
  return Array.prototype.concat(...files)
}
