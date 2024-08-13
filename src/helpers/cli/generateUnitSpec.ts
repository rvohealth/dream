import fs from 'fs/promises'
import path from 'path'
import dreamPath from '../path/dreamPath'
import unitSpecsPath from '../path/unitSpecsPath'
import generateUnitSpecContent from './generateUnitSpecContent'

export default async function generateUnitSpec(dreamName: string, specSubpath: 'models' | 'controllers') {
  const specBasePath = await unitSpecsPath()
  const specPath = path.join(specBasePath, specSubpath, `${dreamName}.spec.ts`)
  const specDirPath = specPath.split('/').slice(0, -1).join('/')
  const relativeUspecPath = await dreamPath('uspec')
  const relativeSpecPath = specPath.replace(new RegExp(`^.*${relativeUspecPath}`), relativeUspecPath)
  const thisfs = fs ? fs : await import('fs/promises')

  try {
    console.log(`generating spec: ${relativeSpecPath}`)
    await thisfs.mkdir(specDirPath, { recursive: true })
    await thisfs.writeFile(specPath, generateUnitSpecContent(dreamName))
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
