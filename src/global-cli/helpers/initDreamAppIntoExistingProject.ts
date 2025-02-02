import * as c from 'colorette'
import * as fs from 'fs'

import path from 'path'
import DreamtsBuilder from '../file-builders/DreamtsBuilder'
import EnvBuilder from '../file-builders/EnvBuilder'
import PackagejsonBuilder from '../file-builders/PackagejsonBuilder'
import copyRecursive from './copyRecursive'
import filterObjectByKey from './filterObjectByKey'
import log from './log'
import { InitDreamAppCliOptions } from './primaryKeyTypes'
import sleep from './sleep'
import sspawn from './sspawn'
import welcomeMessage from './welcomeMessage'

export default async function initDreamAppIntoExistingProject(
  appName: string,
  options: InitDreamAppCliOptions
) {
  createDirIfNotExists(options.projectPath)
  createDirIfNotExists(path.join(options.projectPath, options.configPath))
  createDirIfNotExists(path.join(options.projectPath, options.modelsPath))
  createDirIfNotExists(path.join(options.projectPath, options.serializersPath))
  createDirIfNotExists(path.join(options.projectPath, options.servicesPath))
  createDirIfNotExists(path.join(options.dbPath, options.dbPath))

  copyRecursive(
    __dirname + '/../../../boilerplate/conf',
    path.join(process.cwd(), options.projectPath, options.configPath)
  )
  copyRecursive(
    __dirname + '/../../../boilerplate/app/models',
    path.join(process.cwd(), options.projectPath, options.modelsPath)
  )
  copyRecursive(
    __dirname + '/../../../boilerplate/app/serializers',
    path.join(options.projectPath, options.serializersPath)
  )
  copyRecursive(
    __dirname + '/../../../boilerplate/types',
    path.join(process.cwd(), options.projectPath, options.dbPath)
  )

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 1. write boilerplate to ${appName}: Done!`), { cache: true })
    log.write(c.green(`Step 2. building default config files...`))
  }

  fs.writeFileSync(`${options.projectPath}/.env`, EnvBuilder.build({ appName, env: 'development' }))
  fs.writeFileSync(`${options.projectPath}/.env.test`, EnvBuilder.build({ appName, env: 'test' }))
  fs.writeFileSync(
    path.join(process.cwd(), options.projectPath, options.configPath, 'dream.ts'),
    DreamtsBuilder.build(options)
  )

  const packageJsonPath = path.join(process.cwd(), options.projectPath, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packagejson = (await import('../../../boilerplate/package.json')).default
    const userPackagejson = (await import(packageJsonPath)).default

    mergePackageJsonField('scripts', packagejson, userPackagejson)
    mergePackageJsonField('dependencies', packagejson, userPackagejson)
    mergePackageJsonField('devDependencies', packagejson, userPackagejson)

    fs.writeFileSync(packageJsonPath, JSON.stringify(userPackagejson, null, 2))
  } else {
    fs.writeFileSync(packageJsonPath, await PackagejsonBuilder.buildAPI())
  }

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 2. build default config files: Done!`), { cache: true })
    log.write(c.green(`Step 3. Installing dream dependencies...`))

    // only run yarn install if not in test env to save time
    await sspawn(`cd ${options.projectPath} && touch yarn.lock  && yarn install`)
  }

  // sleeping here because yarn has a delayed print that we need to clean up
  if (!testEnv()) await sleep(1000)

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 3. Install dream dependencies: Done!`), { cache: true })
    log.write(c.green(`Step 4. Building project...`))
  }

  // don't sync yet, since we need to run migrations first
  // await sspawn(`yarn --cwd=${projectPath} dream sync:existing`)

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 5. Build project: Done!`), { cache: true })
    console.log(welcomeMessage(options.projectPath))
  }
}

function createDirIfNotExists(dir: string) {
  if (!fs.existsSync(path.join(process.cwd(), dir))) {
    fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true })
  }
}

function mergePackageJsonField(field: string, boilerplatePackagejson: any, userPackagejson: any) {
  userPackagejson[field] ||= {}

  userPackagejson[field] = {
    ...userPackagejson[field],
    ...boilerplatePackagejson[field],
  }
  userPackagejson[field] = filterObjectByKey(
    userPackagejson[field],
    Object.keys(userPackagejson[field]).sort()
  )
}

function testEnv() {
  return process.env.NODE_ENV === 'test'
}
