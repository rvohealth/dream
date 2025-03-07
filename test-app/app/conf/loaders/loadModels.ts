import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import getFiles from './getFiles'
import { Dream } from '../../../../src'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function loadModels() {
  const modelsPath = join(__dirname, '..', '..', 'models')
  const modelPaths = (await getFiles(modelsPath)).filter(path => /\.[jt]s$/.test(path))

  const modelClasses: [string, typeof Dream][] = []

  for (const modelPath of modelPaths) {
    modelClasses.push([modelPath, (await import(modelPath)).default as typeof Dream])
  }

  return modelClasses
}
