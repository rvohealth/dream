import Dream from '../dream'
import { ViewModelClass, primaryKeyTypes } from '../dream/types'
import DreamSerializer from '../serializer'
import { cacheDreamApplication } from './cache'
import loadModels from './helpers/loadModels'
import loadSerializers, { setCachedSerializers } from './helpers/loadSerializers'
import loadServices, { setCachedServices } from './helpers/loadServices'
import loadViewModels, { setCachedViewModels } from './helpers/loadViewModels'

export default class DreamApplication {
  public static async init(cb: (dreamApp: DreamApplication) => void | Promise<void>) {
    const dreamApp = new DreamApplication()
    await cb(dreamApp)

    await dreamApp.inflections?.()

    if (!dreamApp.viewModels) setCachedViewModels({})
    if (!dreamApp.serializers) setCachedSerializers({})
    if (!dreamApp.services) setCachedServices({})

    cacheDreamApplication(dreamApp)

    return dreamApp
  }

  public static async loadModels(modelsPath: string) {
    return await loadModels(modelsPath)
  }

  public static async loadSerializers(serializersPath: string) {
    return await loadSerializers(serializersPath)
  }

  public static async loadViewModels(viewModelsPath: string) {
    return await loadViewModels(viewModelsPath)
  }

  public static async loadServices(servicesPath: string) {
    return await loadServices(servicesPath)
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
  public viewModels: Record<string, ViewModelClass>
  public services: Record<string, any>
  public inflections?: () => void | Promise<void>

  constructor(opts?: DreamApplicationOpts) {
    if (opts?.db) this.dbCredentials = opts.db
    if (opts?.primaryKeyType) this.primaryKeyType = opts.primaryKeyType
    if (opts?.appRoot) this.appRoot = opts.appRoot
    if (opts?.models) this.models = opts.models
    if (opts?.serializers) this.serializers = opts.serializers
    if (opts?.viewModels) this.viewModels = opts.viewModels
    if (opts?.services) this.services = opts.services
    if (opts?.inflections) this.inflections = opts.inflections

    this.paths = {
      db: opts?.paths?.db || 'db',
      models: opts?.paths?.models || 'app/models',
      viewModels: opts?.paths?.viewModels || 'app/view-models',
      serializers: opts?.paths?.serializers || 'app/serializers',
      factories: opts?.paths?.factories || 'spec/factories',
      uspecs: opts?.paths?.uspecs || 'spec/unit',
      conf: opts?.paths?.conf || 'app/conf',
      services: opts?.paths?.services || 'app/services',
    }
  }

  public set<ApplyOpt extends ApplyOption>(
    applyOption: ApplyOpt,
    options: ApplyOpt extends 'db'
      ? DreamDbCredentialOptions
      : ApplyOpt extends 'primaryKeyType'
        ? (typeof primaryKeyTypes)[number]
        : ApplyOpt extends 'appRoot'
          ? string
          : ApplyOpt extends 'serializers'
            ? Record<string, typeof DreamSerializer>
            : ApplyOpt extends 'models'
              ? Record<string, typeof Dream>
              : ApplyOpt extends 'viewModels'
                ? Record<string, ViewModelClass>
                : ApplyOpt extends 'services'
                  ? Record<string, any>
                  : ApplyOpt extends 'inflections'
                    ? () => void | Promise<void>
                    : ApplyOpt extends 'paths'
                      ? DreamDirectoryPaths
                      : never
  ) {
    switch (applyOption) {
      case 'db':
        this.dbCredentials = options as DreamDbCredentialOptions
        break

      case 'primaryKeyType':
        this.primaryKeyType = options as (typeof primaryKeyTypes)[number]
        break

      case 'appRoot':
        this.appRoot = options as string
        break

      case 'serializers':
        this.serializers = options as Record<string, typeof DreamSerializer>
        break

      case 'models':
        this.models = options as Record<string, typeof Dream>
        break

      case 'viewModels':
        this.viewModels = options as Record<string, ViewModelClass>
        break

      case 'services':
        this.services = options as Record<string, any>
        break

      case 'inflections':
        this.inflections = options as () => void | Promise<void>
        break

      case 'paths':
        this.paths = {
          ...this.paths,
          ...(options as DreamDirectoryPaths),
        }
        break

      default:
        throw new Error(`Unhandled applyOption encountered in Dreamconf: ${applyOption}`)
    }
  }
}

export interface DreamApplicationOpts {
  appRoot: string
  primaryKeyType: (typeof primaryKeyTypes)[number]
  db: DreamDbCredentialOptions
  serializers: Record<string, typeof DreamSerializer>
  models: Record<string, typeof Dream>
  viewModels: Record<string, ViewModelClass>
  services: Record<string, any>
  inflections?: () => void | Promise<void>
  paths?: DreamDirectoryPaths
}

export type ApplyOption =
  | 'db'
  | 'primaryKeyType'
  | 'appRoot'
  | 'serializers'
  | 'models'
  | 'viewModels'
  | 'services'
  | 'inflections'
  | 'paths'

export interface DreamDirectoryPaths {
  models?: string
  serializers?: string
  viewModels?: string
  services?: string
  conf?: string
  db?: string
  uspecs?: string
  factories?: string
}

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
