import fs from 'fs/promises'
import path from 'path'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'
import generateFactoryContent from './generateFactoryContent'

export default async function generateFactory(dreamName: string, attributes: string[]) {
  const dreamApp = getCachedDreamApplicationOrFail()

  const factoriesBasePath = path.join(dreamApp.appRoot, dreamApp.paths.factories)
  const factoryPath = path.join(factoriesBasePath, `${dreamName}Factory.ts`)

  const factoryDirPath = factoryPath.split('/').slice(0, -1).join('/')

  const relativeSpecDirPath = factoriesBasePath.split('/').slice(0, -1).join('/')
  const relativeSpecPath = factoryPath.replace(new RegExp(`^.*${relativeSpecDirPath}`), relativeSpecDirPath)

  try {
    console.log(`generating factory: ${relativeSpecPath}`)
    await fs.mkdir(factoryDirPath, { recursive: true })
    await fs.writeFile(factoryPath, generateFactoryContent(dreamName, attributes))
  } catch (error) {
    const err = `
      Something happened while trying to create the spec file:
        ${relativeSpecPath}

      Does this file already exist? Here is the error that was raised:
        ${(error as Error).message}
    `
    throw err
  }
}

export function generateBlankSpecContent(dreamName: string) {
  return `\
describe('${dreamName}', () => {
  it.todo('add a test here to get started building ${dreamName}')
})
`
}
