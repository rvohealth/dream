import Dream from '../dream'
import { primaryKeyTypes } from '../dream/types'
import DreamApplicationInitMissingCallToLoadModels from '../exceptions/dream-application/init-missing-call-to-load-models'
import DreamApplicationInitMissingMissingProjectRoot from '../exceptions/dream-application/init-missing-project-root'
import DreamSerializer from '../serializer'
import { cacheDreamApplication, getCachedDreamApplicationOrFail } from './cache'
import loadModels, { getModelsOrFail } from './helpers/loadModels'
import loadSerializers, { getSerializersOrFail, setCachedSerializers } from './helpers/loadSerializers'
import loadServices, { getServicesOrFail, setCachedServices } from './helpers/loadServices'

export default class DreamApplication {
  /**
   * initializes a new dream application and caches it for use
   * within this processes lifecycle.
   *
   * Within dream, we rely on cached information about your app
   * to be able to serve routes, perform serializer lookups,
   * generate files, connect to the database, etc...
   *
   * In order for this to work properly, the DreamApplication#init
   * function must be called before anything else is called within
   * Dream.
   */
  public static async init(
    cb: (dreamApp: DreamApplication) => void | Promise<void>,
    opts: Partial<DreamApplicationOpts> = {},
    deferCb?: (dreamApp: DreamApplication) => Promise<void> | void
  ) {
    const dreamApp = new DreamApplication(opts)
    await cb(dreamApp)

    await dreamApp.inflections?.()

    await deferCb?.(dreamApp)

    if (!dreamApp.projectRoot) throw new DreamApplicationInitMissingMissingProjectRoot()
    if (!dreamApp.loadedModels) throw new DreamApplicationInitMissingCallToLoadModels()

    if (!dreamApp.serializers) setCachedSerializers({})
    if (!dreamApp.services) setCachedServices({})

    cacheDreamApplication(dreamApp)

    return dreamApp
  }

  /**
   * Returns the cached dream application if it has been set.
   * If it has not been set, an exception is raised.
   *
   * The dream application can be set by calling DreamApplication#init,
   * or alternatively, if you are using Psychic along with Dream,
   * it can be set during PsychicApplication#init, which will set caches
   * for both the dream and psychic applications at once.
   */
  public static getOrFail() {
    return getCachedDreamApplicationOrFail()
  }

  public dbCredentials: DreamDbCredentialOptions
  public primaryKeyType: (typeof primaryKeyTypes)[number] = 'bigserial'
  public projectRoot: string
  public paths: Required<DreamDirectoryPaths>
  public serializerCasing: DreamSerializerCasing
  public inflections?: () => void | Promise<void>

  protected loadedModels: boolean = false

  constructor(opts?: Partial<DreamApplicationOpts>) {
    if (opts?.db) this.dbCredentials = opts.db
    if (opts?.primaryKeyType) this.primaryKeyType = opts.primaryKeyType
    if (opts?.projectRoot) this.projectRoot = opts.projectRoot
    if (opts?.inflections) this.inflections = opts.inflections
    if (opts?.serializerCasing) this.serializerCasing = opts.serializerCasing

    this.paths = {
      conf: opts?.paths?.conf || 'src/app/conf',
      db: opts?.paths?.db || 'src/db',
      factories: opts?.paths?.factories || 'spec/factories',
      models: opts?.paths?.models || 'src/app/models',
      modelSpecs: opts?.paths?.modelSpecs || 'spec/unit/models',
      serializers: opts?.paths?.serializers || 'src/app/serializers',
      services: opts?.paths?.services || 'src/app/services',
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
        await loadModels(resourcePath)
        this.loadedModels = true
        break

      case 'serializers':
        await loadSerializers(resourcePath)
        break

      case 'services':
        await loadServices(resourcePath)
        break
    }
  }

  public set<ApplyOpt extends DreamApplicationSetOption>(
    applyOption: ApplyOpt,
    options: ApplyOpt extends 'db'
      ? DreamDbCredentialOptions
      : ApplyOpt extends 'primaryKeyType'
        ? (typeof primaryKeyTypes)[number]
        : ApplyOpt extends 'projectRoot'
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

      case 'projectRoot':
        this.projectRoot = options as string
        break

      case 'inflections':
        this.inflections = options as () => void | Promise<void>
        break

      case 'serializerCasing':
        this.serializerCasing = options as DreamSerializerCasing
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
  projectRoot: string
  primaryKeyType: (typeof primaryKeyTypes)[number]
  db: DreamDbCredentialOptions
  inflections?: () => void | Promise<void>
  paths?: DreamDirectoryPaths
  serializerCasing?: DreamSerializerCasing
}

export type DreamApplicationSetOption =
  | 'db'
  | 'primaryKeyType'
  | 'projectRoot'
  | 'inflections'
  | 'paths'
  | 'serializerCasing'

export interface DreamDirectoryPaths {
  models?: string
  serializers?: string
  services?: string
  conf?: string
  db?: string
  modelSpecs?: string
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

export type DreamSerializerCasing = 'snake' | 'camel'
