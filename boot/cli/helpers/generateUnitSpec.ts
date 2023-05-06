import * as fs from 'fs/promises'
import { loadDreamYamlFile } from '../../../src/helpers/path'

export default async function generateUnitSpec(
  dreamName: string,
  specSubpath: 'models' | 'controllers',
  {
    rootPath = process.env.CORE_DEVELOPMENT === '1' ? process.cwd() : process.cwd() + '/../..',
  }: {
    rootPath?: string
  } = {}
) {
  const ymlConfig = await loadDreamYamlFile()
  const specPath = `${rootPath}/${ymlConfig.unit_spec_path}/${specSubpath}/${dreamName}.spec.ts`
  const relativeSpecPath = specPath.replace(
    new RegExp(`^.*${ymlConfig.unit_spec_path}`),
    ymlConfig.unit_spec_path
  )
  const thisfs = fs ? fs : await import('fs/promises')

  try {
    console.log(`generating spec: ${relativeSpecPath}`)
    await thisfs.writeFile(specPath, generateBlankSpecContent(dreamName))
  } catch (error) {
    const err = `
      Something happened while trying to create the spec file:
        ${relativeSpecPath}

      Does this file already exist? Here is the error that was raised:
        ${error}
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
