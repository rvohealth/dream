import * as path from 'path'
import { promises as fs } from 'fs'
import Dream from '../dream'
import { modelsPath } from './path'

export default async function loadModels() {
  const pathToModels = await modelsPath()
  const modelPaths = await fs.readdir(pathToModels)
  const models: { [key: string]: typeof Dream } = {}

  for (const modelPath of modelPaths.filter(path => /\.ts$/.test(path))) {
    const fullPath = path.join(pathToModels, modelPath)
    let ModelClass: typeof Dream | null = null
    try {
      ModelClass = (await import(fullPath)).default
    } catch (error) {
      console.log(`Failed to import the following file: ${fullPath}. Error: ${error}`)
    }

    models[modelPath.replace(/\.ts$/, '')] = ModelClass!
  }

  return models
}
