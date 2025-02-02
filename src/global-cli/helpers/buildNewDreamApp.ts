import * as c from 'colorette'
import * as fs from 'fs'

import DreamtsBuilder from '../file-builders/DreamtsBuilder'
import EnvBuilder from '../file-builders/EnvBuilder'
import PackagejsonBuilder from '../file-builders/PackagejsonBuilder'
import copyRecursive from './copyRecursive'
import log from './log'
import { cliPrimaryKeyTypes, InitDreamAppCliOptions } from './primaryKeyTypes'
import Select from './select'
import sleep from './sleep'
import sspawn from './sspawn'
import welcomeMessage from './welcomeMessage'

function testEnv() {
  return process.env.NODE_ENV === 'test'
}

export default async function buildNewDreamApp(
  appName: string,
  projectPath: string,
  options: InitDreamAppCliOptions
) {
  if (!options.primaryKeyType) {
    const answer = await new Select('what primary key type would you like to use?', cliPrimaryKeyTypes).run()
    options.primaryKeyType = answer
  }

  copyRecursive(__dirname + '/../../../boilerplate', `${projectPath}/src`)

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 1. write boilerplate to ${appName}: Done!`), { cache: true })
    log.write(c.green(`Step 2. building default config files...`))
  }

  fs.writeFileSync(`${projectPath}/.env`, EnvBuilder.build({ appName, env: 'development' }))
  fs.writeFileSync(`${projectPath}/.env.test`, EnvBuilder.build({ appName, env: 'test' }))
  fs.writeFileSync(projectPath + '/package.json', await PackagejsonBuilder.buildAPI())
  fs.writeFileSync(`${projectPath}/src/conf/dream.ts`, DreamtsBuilder.build(options))

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 2. build default config files: Done!`), { cache: true })
    log.write(c.green(`Step 3. Installing dream dependencies...`))

    // only run yarn install if not in test env to save time
    await sspawn(`cd ${projectPath} && touch yarn.lock && yarn install`)
  }

  // sleeping here because yarn has a delayed print that we need to clean up
  if (!testEnv()) await sleep(1000)

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 3. Install dream dependencies: Done!`), { cache: true })
    log.write(c.green(`Step 4. Initializing git repository...`))

    // only do this if not test, since using git in CI will fail
    await sspawn(`cd ./${appName} && git init`)
  }

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 4. Initialize git repository: Done!`), { cache: true })
    log.write(c.green(`Step 5. Building project...`))
  }

  // don't sync yet, since we need to run migrations first
  // await sspawn(`yarn --cwd=${projectPath} dream sync:existing`)

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 5. Build project: Done!`), { cache: true })
    console.log(welcomeMessage(appName))
  }
}
