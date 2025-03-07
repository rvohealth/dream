export const cliPrimaryKeyTypes = ['bigserial', 'serial', 'uuid'] as const

export const cliDefaultProjectPath = '.'
export const cliDefaultConfigPath = 'src/conf.js'
export const cliDefaultDbPath = 'src/db.js'
export const cliDefaultTypesPath = 'src/types.js'
export const cliDefaultModelsPath = 'src/app/models.js'
export const cliDefaultSerializersPath = 'src/app/serializers.js'
export const cliDefaultServicesPath = 'src/app/services.js'
export const cliDefaultModelSpecsPath = 'spec/uspec/models.js'
export const cliDefaultFactoriesPath = 'spec/factories.js'

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
