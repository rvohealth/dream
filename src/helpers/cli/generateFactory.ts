import fs from 'fs/promises'
import path from 'path'
import generateFactoryContent from './generateFactoryContent'
import factoriesPath from '../path/factoriesPath'

export default async function generateFactory(dreamName: string, attributes: string[]) {
  const factoriesBasePath = await factoriesPath()
  const factoryPath = path.join(factoriesBasePath, `${dreamName}Factory.ts`)

  const factoryDirPath = factoryPath.split('/').slice(0, -1).join('/')

  const relativeSpecDirPath = factoriesBasePath.split('/').slice(0, -1).join('/')
  const relativeSpecPath = factoryPath.replace(new RegExp(`^.*${relativeSpecDirPath}`), relativeSpecDirPath)
  const thisfs = fs ? fs : await import('fs/promises')

  try {
    console.log(`generating factory: ${relativeSpecPath}`)
    await thisfs.mkdir(factoryDirPath, { recursive: true })
    await thisfs.writeFile(factoryPath, await generateFactoryContent(dreamName, attributes))
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
