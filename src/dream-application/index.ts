import Dream from '../dream'
import { ViewModel, primaryKeyTypes } from '../dream/types'
import DreamSerializer from '../serializer'
import { cacheDreamApplication } from './cache'
import loadModels from './helpers/loadModels'
import loadSerializers from './helpers/loadSerializers'
import loadServices from './helpers/loadServices'
import loadViewModels from './helpers/loadViewModels'

export default class DreamApplication {
  public static init(opts: DreamApplicationOpts) {
    const dreamApp = new DreamApplication(opts)
    cacheDreamApplication(dreamApp)
    return dreamApp
  }

  public dbCredentials: DreamDbCredentialOptions
  public primaryKeyType: (typeof primaryKeyTypes)[number] = 'bigserial'
  public appRoot: string
  public paths: {
    models: string
    viewModels: string
    services: string
    serializers: string
    conf: string
    db: string
    uspecs: string
    factories: string
  }
  public serializers: Record<string, typeof DreamSerializer>
  public models: Record<string, typeof Dream>
  public viewModels: Record<string, ViewModel>
  public services: Record<string, any>

  public static async loadModels(modelsPath: string) {
    return await loadModels(modelsPath)
  }

  public static async loadSerializers(serializersPath: string) {
    try {
      return await loadSerializers(serializersPath)
    } catch {
      return {}
    }
  }

  public static async loadViewModels(viewModelsPath: string) {
    try {
      return await loadViewModels(viewModelsPath)
    } catch {
      return {}
    }
  }

  public static async loadServices(servicesPath: string) {
    try {
      return await loadServices(servicesPath)
    } catch {
      return {}
    }
  }

  constructor(opts: DreamApplicationOpts) {
    this.dbCredentials = opts.db
    this.primaryKeyType = opts.primaryKeyType
    this.appRoot = opts.appRoot
    this.paths = {
      db: opts.paths?.db || 'db',
      models: opts.paths?.models || 'app/models',
      viewModels: opts.paths?.viewModels || 'app/view-models',
      serializers: opts.paths?.serializers || 'app/serializers',
      factories: opts.paths?.factories || 'spec/factories',
      uspecs: opts.paths?.uspecs || 'spec/unit',
      conf: opts.paths?.conf || 'app/conf',
      services: opts.paths?.services || 'app/services',
    }
    this.models = opts.models
    this.serializers = opts.serializers
    this.viewModels = opts.viewModels
    this.services = opts.services
  }
}

export interface DreamApplicationOpts {
  appRoot: string
  primaryKeyType: (typeof primaryKeyTypes)[number]
  db: DreamDbCredentialOptions
  serializers: Record<string, typeof DreamSerializer>
  models: Record<string, typeof Dream>
  viewModels: Record<string, ViewModel>
  services: Record<string, any>
  paths?: {
    models?: string
    serializers?: string
    viewModels?: string
    services?: string
    conf?: string
    db?: string
    uspecs?: string
    factories?: string
  }
}

export type ApplyOption = 'dbCredentials' | 'primaryKeyType'

export interface DreamDbCredentialOptions {
  primary: SingleDbCredential
  replica?: SingleDbCredential
}

export interface SingleDbCredential {
  user: string
  password: string
  host: string
  name: string
  port: number
  useSsl: boolean
}
