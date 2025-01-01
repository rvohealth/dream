import argAndValue from './helpers/argAndValue'
import initDreamAppIntoExistingProject from './helpers/initDreamAppIntoExistingProject'
import { primaryKeyTypes } from './helpers/primaryKeyTypes'
import Prompt from './helpers/prompt'
import Select from './helpers/select'

export default async function initDreamApp(args: string[]) {
  const opts = await gatherUserInput(args)
  await initDreamAppIntoExistingProject('dream app', opts)
}

export interface InitDreamAppCLIOptions {
  primaryKeyType: (typeof primaryKeyTypes)[number]
  configPath: string
  modelsPath: string
  serializersPath: string
  servicesPath: string
  factoriesPath: string
  modelSpecsPath: string
  dbPath: string
  typesPath: string
  projectPath: string
}

async function primaryKeyTypeQuestion(args: string[], options: InitDreamAppCLIOptions) {
  const [primaryKeyArg, value] = argAndValue('--primaryKey', args)
  if (primaryKeyArg && primaryKeyTypes.includes(value! as (typeof primaryKeyTypes)[number])) {
    options.primaryKeyType = value as (typeof primaryKeyTypes)[number]
    return
  }

  const answer = await new Select('what primary key type would you like to use?', primaryKeyTypes).run()
  options.primaryKeyType = answer
}

async function configPath(args: string[], options: InitDreamAppCLIOptions) {
  const [configPath, value] = argAndValue('--configPath', args)
  if (configPath) {
    options.configPath = value as string
    return
  }

  const answer = await new Prompt(
    'Relative to the current directory, where would you like us to put your config files? (defaults to src/conf)'
  ).run()
  options.configPath = answer || options.configPath
}

async function modelsPath(args: string[], options: InitDreamAppCLIOptions) {
  const [modelsPath, value] = argAndValue('--modelsPath', args)
  if (modelsPath) {
    options.modelsPath = value as string
    return
  }

  const answer = await new Prompt(
    'Relative to the current directory, where would you like us to put your models? (defaults to src/app/models)'
  ).run()
  options.modelsPath = answer || options.modelsPath
}

async function serializersPath(args: string[], options: InitDreamAppCLIOptions) {
  const [serializersPath, value] = argAndValue('--serializersPath', args)
  if (serializersPath) {
    options.serializersPath = value as string
    return
  }

  const answer = await new Prompt(
    'Relative to the current directory, where would you like us to put your serializers? (defaults to src/app/serializers)'
  ).run()
  options.serializersPath = answer || options.serializersPath
}

async function dbPath(args: string[], options: InitDreamAppCLIOptions) {
  const [dbPath, value] = argAndValue('--dbPath', args)
  if (dbPath) {
    options.dbPath = value as string
    return
  }

  const answer = await new Prompt(
    'Relative to the current directory, where would you like us to put your db files? (defaults to src/db)'
  ).run()
  options.dbPath = answer || options.dbPath
}

async function typesPath(args: string[], options: InitDreamAppCLIOptions) {
  const [typesPath, value] = argAndValue('--typesPath', args)
  if (typesPath) {
    options.typesPath = value as string
    return
  }

  const answer = await new Prompt(
    'Relative to the current directory, where would you like us to put your dream.ts and db.ts type files? (defaults to src/types)'
  ).run()
  options.typesPath = answer || options.typesPath
}

async function modelSpecsPath(args: string[], options: InitDreamAppCLIOptions) {
  const [modelSpecsPath, value] = argAndValue('--modelSpecsPath', args)
  if (modelSpecsPath) {
    options.modelSpecsPath = value as string
    return
  }

  const answer = await new Prompt(
    'Relative to the current directory, where would you like us to put your model tests? (defaults to spec/uspec/models)'
  ).run()
  options.modelSpecsPath = answer || options.modelSpecsPath
}

async function servicesPath(args: string[], options: InitDreamAppCLIOptions) {
  const [servicesPath, value] = argAndValue('--servicesPath', args)
  if (servicesPath) {
    options.servicesPath = value as string
    return
  }

  const answer = await new Prompt(
    'Relative to the current directory, where would you like us to put your services? (defaults to src/app/services)'
  ).run()
  options.servicesPath = answer || options.servicesPath
}

async function factoriesPath(args: string[], options: InitDreamAppCLIOptions) {
  const [factoriesPath, value] = argAndValue('--factoriesPath', args)
  if (factoriesPath) {
    options.factoriesPath = value as string
    return
  }

  const answer = await new Prompt(
    'Relative to the current directory, where would you like us to put your factories? (defaults to spec/factories)'
  ).run()
  options.factoriesPath = answer || options.factoriesPath
}

async function projectPath(args: string[], options: InitDreamAppCLIOptions) {
  const [projectPath, value] = argAndValue('--projectPath', args)
  if (projectPath) {
    options.projectPath = value as string
    return
  }

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

  options.projectPath = answer || options.projectPath
  console.log(options.projectPath)
}

async function gatherUserInput(args: string[]) {
  const options: InitDreamAppCLIOptions = {
    projectPath: '.',
    primaryKeyType: 'bigserial',
    configPath: 'src/conf',
    dbPath: 'src/db',
    typesPath: 'src/types',
    modelsPath: 'src/app/models',
    serializersPath: 'src/app/serializers',
    servicesPath: 'src/app/services',
    modelSpecsPath: 'spec/uspec/models',
    factoriesPath: 'spec/factories',
  }

  await projectPath(args, options)
  await modelsPath(args, options)
  await configPath(args, options)
  await serializersPath(args, options)
  await dbPath(args, options)
  await typesPath(args, options)
  await modelSpecsPath(args, options)
  await factoriesPath(args, options)
  await servicesPath(args, options)
  await primaryKeyTypeQuestion(args, options)

  return options
}
