import initDreamAppIntoExistingProject from './helpers/initDreamAppIntoExistingProject.js.js'
import {
  cliDefaultConfigPath,
  cliDefaultDbPath,
  cliDefaultFactoriesPath,
  cliDefaultModelsPath,
  cliDefaultModelSpecsPath,
  cliDefaultProjectPath,
  cliDefaultSerializersPath,
  cliDefaultServicesPath,
  cliDefaultTypesPath,
  cliPrimaryKeyTypes,
  InitDreamAppCliOptions,
} from './helpers/primaryKeyTypes.js.js'
import Prompt from './helpers/prompt.js.js'
import Select from './helpers/select.js.js'

export default async function initDreamApp(options: InitDreamAppCliOptions) {
  if (!options.primaryKeyType || !cliPrimaryKeyTypes.includes(options.primaryKeyType)) {
    const answer = await new Select('what primary key type would you like to use?', cliPrimaryKeyTypes).run()
    options.primaryKeyType = answer
  }

  if (!options.projectPath) {
    const answer = await new Prompt(
      `Relative to the current directory, where would you like us to put your project? (defaults to the current directory)`
    ).run()

    if (process.env.DREAM_CORE_DEVELOPMENT === '1' && !answer) {
      throw new Error(
        `
when in dream core development, you must provide an explicit project directory. If you do not specify it,
you risk accidentally overwriting all the root files in the dream directory.
      `
      )
    }

    options.projectPath = answer || cliDefaultProjectPath
  }

  if (!options.configPath) {
    const answer = await new Prompt(
      `Relative to your project root, where would you like us to put your config files? (defaults to ${cliDefaultConfigPath})`
    ).run()
    options.configPath = answer || cliDefaultConfigPath
  }

  if (!options.modelsPath) {
    const answer = await new Prompt(
      `Relative to your project root, where would you like us to put your models? (defaults to ${cliDefaultModelsPath})`
    ).run()
    options.modelsPath = answer || cliDefaultModelsPath
  }

  if (!options.serializersPath) {
    const answer = await new Prompt(
      `Relative to your project root, where would you like us to put your serializers? (defaults to ${cliDefaultSerializersPath})`
    ).run()
    options.serializersPath = answer || cliDefaultSerializersPath
  }

  if (!options.servicesPath) {
    const answer = await new Prompt(
      `Relative to your project root, where would you like us to put your services? (defaults to ${cliDefaultServicesPath})`
    ).run()
    options.servicesPath = answer || cliDefaultServicesPath
  }

  if (!options.dbPath) {
    const answer = await new Prompt(
      `Relative to your project root, where would you like us to put your db files? (defaults to ${cliDefaultDbPath})`
    ).run()
    options.dbPath = answer || cliDefaultDbPath
  }

  if (!options.typesPath) {
    const answer = await new Prompt(
      `Relative to your project root, where would you like us to put your dream.ts and db.ts type files? (defaults to ${cliDefaultTypesPath})`
    ).run()
    options.typesPath = answer || cliDefaultTypesPath
  }

  if (!options.modelSpecsPath) {
    const answer = await new Prompt(
      `Relative to your project root, where would you like us to put your model tests? (defaults to ${cliDefaultModelSpecsPath})`
    ).run()
    options.modelSpecsPath = answer || cliDefaultModelSpecsPath
  }

  if (!options.factoriesPath) {
    const answer = await new Prompt(
      `Relative to your project root, where would you like us to put your factories? (defaults to ${cliDefaultFactoriesPath})`
    ).run()
    options.factoriesPath = answer || cliDefaultFactoriesPath
  }

  await initDreamAppIntoExistingProject('dream app', options)
}
