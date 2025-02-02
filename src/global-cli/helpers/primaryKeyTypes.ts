export const cliPrimaryKeyTypes = ['bigserial', 'serial', 'uuid'] as const

export const cliDefaultProjectPath = '.'
export const cliDefaultConfigPath = 'src/conf'
export const cliDefaultDbPath = 'src/db'
export const cliDefaultTypesPath = 'src/types'
export const cliDefaultModelsPath = 'src/app/models'
export const cliDefaultSerializersPath = 'src/app/serializers'
export const cliDefaultServicesPath = 'src/app/services'
export const cliDefaultModelSpecsPath = 'spec/uspec/models'
export const cliDefaultFactoriesPath = 'spec/factories'

export interface InitDreamAppCliOptions {
  configPath: string
  dbPath: string
  factoriesPath: string
  modelsPath: string
  modelSpecsPath: string
  primaryKeyType: (typeof cliPrimaryKeyTypes)[number]
  projectPath: string
  serializersPath: string
  servicesPath: string
  typesPath: string
}
