import * as c from 'colorette'
import * as fs from 'fs'

import EnvBuilder from './file-builders/EnvBuilder'
import PackagejsonBuilder from './file-builders/PackagejsonBuilder'
import copyRecursive from './helpers/copyRecursive'
import gatherUserInput from './helpers/gatherUserInput'
import log from './helpers/log'
import sleep from './helpers/sleep'
import sspawn from './helpers/sspawn'
import welcomeMessage from './helpers/welcomeMessage'

function testEnv() {
  return process.env.NODE_ENV === 'test'
}

export default async function installCoreDreamDependenciesToDir(
  appName: string,
  projectPath: string,
  args: string[]
) {
  const userOptions = await gatherUserInput(args)

  copyRecursive(__dirname + '/../boilerplate', `${projectPath}/src`)

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 1. write boilerplate to ${appName}: Done!`), { cache: true })
    log.write(c.green(`Step 2. building default config files...`))
  }

  fs.writeFileSync(`${projectPath}/.env`, EnvBuilder.build({ appName, env: 'development' }))
  fs.writeFileSync(`${projectPath}/.env.test`, EnvBuilder.build({ appName, env: 'test' }))
  fs.writeFileSync(projectPath + '/package.json', await PackagejsonBuilder.buildAPI())

  if (!testEnv()) {
    log.restoreCache()
    log.write(c.green(`Step 2. build default config files: Done!`), { cache: true })
    log.write(c.green(`Step 3. Installing dream dependencies...`))

    // only run yarn install if not in test env to save time
    await sspawn(`cd ${projectPath} && yarn install`)
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
    // do not use git during tests, since this will break in CI
    await sspawn(`cd ./${appName} && git add --all && git commit -m 'dream init' --quiet`)

    log.restoreCache()
    log.write(c.green(`Step 5. Build project: Done!`), { cache: true })
    console.log(welcomeMessage(appName))
  }
}
