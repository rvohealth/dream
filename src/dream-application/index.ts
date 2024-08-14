import Dream from '../dream'
import { ViewModelClass, primaryKeyTypes } from '../dream/types'
import DreamSerializer from '../serializer'
import { cacheDreamApplication } from './cache'
import loadModels, { getModelsOrFail } from './helpers/loadModels'
import loadSerializers, { getSerializersOrFail, setCachedSerializers } from './helpers/loadSerializers'
import loadServices, { getServicesOrFail, setCachedServices } from './helpers/loadServices'

export default class DreamApplication {
  public static async init(cb: (dreamApp: DreamApplication) => void | Promise<void>) {
    const dreamApp = new DreamApplication()
    await cb(dreamApp)

    await dreamApp.inflections?.()

    if (!dreamApp.serializers) setCachedSerializers({})
    if (!dreamApp.services) setCachedServices({})

    cacheDreamApplication(dreamApp)

    return dreamApp
  }

  public dbCredentials: DreamDbCredentialOptions
  public primaryKeyType: (typeof primaryKeyTypes)[number] = 'bigserial'
  public appRoot: string
  public paths: {
    conf: string
    db: string
    factories: string
    models: string
    serializers: string
    services: string
    uspecs: string
  }
  public inflections?: () => void | Promise<void>

  constructor(opts?: DreamApplicationOpts) {
    if (opts?.db) this.dbCredentials = opts.db
    if (opts?.primaryKeyType) this.primaryKeyType = opts.primaryKeyType
    if (opts?.appRoot) this.appRoot = opts.appRoot
    if (opts?.inflections) this.inflections = opts.inflections

    this.paths = {
      conf: opts?.paths?.conf || 'app/conf',
      db: opts?.paths?.db || 'db',
      factories: opts?.paths?.factories || 'spec/factories',
      models: opts?.paths?.models || 'app/models',
      serializers: opts?.paths?.serializers || 'app/serializers',
      services: opts?.paths?.services || 'app/services',
      uspecs: opts?.paths?.uspecs || 'spec/unit',
    }
  }

  public get models(): Record<string, typeof Dream> {
    return getModelsOrFail()
  }

  public get serializers(): Record<string, typeof DreamSerializer> {
    return getSerializersOrFail()
  }

  public get services(): Record<string, any> {
    return getServicesOrFail()
  }

  public async load(resourceType: 'models' | 'serializers' | 'services', resourcePath: string) {
    switch (resourceType) {
      case 'models':
        return await loadModels(resourcePath)
      case 'serializers':
        return await loadSerializers(resourcePath)
      case 'services':
        return await loadServices(resourcePath)
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

export type ApplyOption = 'db' | 'primaryKeyType' | 'appRoot' | 'inflections' | 'paths'

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
