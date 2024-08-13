import fs from 'fs/promises'
import path from 'path'
import { getCachedDreamApplicationOrFail } from '../../dream-application/cache'
import relativeDreamPath from '../path/relativeDreamPath'
import generateUnitSpecContent from './generateUnitSpecContent'

export default async function generateUnitSpec(dreamName: string, specSubpath: 'models' | 'controllers') {
  const dreamApp = getCachedDreamApplicationOrFail()
  const specBasePath = path.join(dreamApp.appRoot, dreamApp.paths.uspecs)
  const specPath = path.join(specBasePath, specSubpath, `${dreamName}.spec.ts`)
  const specDirPath = specPath.split('/').slice(0, -1).join('/')
  const relativeUspecPath = relativeDreamPath('uspec')
  const relativeSpecPath = specPath.replace(new RegExp(`^.*${relativeUspecPath}`), relativeUspecPath)

  try {
    console.log(`generating spec: ${relativeSpecPath}`)
    await fs.mkdir(specDirPath, { recursive: true })
    await fs.writeFile(specPath, generateUnitSpecContent(dreamName))
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
