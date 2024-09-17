import { types as pgTypes } from 'pg'
import db from '../db'
import Dream from '../dream'
import { primaryKeyTypes } from '../dream/types'
import Encrypt, { EncryptAlgorithm, EncryptOptions } from '../encrypt'
import DreamApplicationInitMissingCallToLoadModels from '../exceptions/dream-application/init-missing-call-to-load-models'
import DreamApplicationInitMissingMissingProjectRoot from '../exceptions/dream-application/init-missing-project-root'
import {
  findCitextArrayOid,
  correspondingArrayOid as findCorrespondingArrayOid,
  enumArrayOids as findEnumArrayOids,
  parsePostgresArrayWithTransformation,
  parsePostgresDate,
  parsePostgresDatetime,
  parsePostgresDecimal,
} from '../helpers/customPgParsers'
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
    if (dreamApp.encryption?.columns?.current)
      this.checkKey(
        'columns',
        dreamApp.encryption.columns.current.key,
        dreamApp.encryption.columns.current.algorithm
      )

    if (!dreamApp.serializers) setCachedSerializers({})
    if (!dreamApp.services) setCachedServices({})

    cacheDreamApplication(dreamApp)

    let oid: number | undefined
    const kyselyDb = db('primary')

    pgTypes.setTypeParser(pgTypes.builtins.DATE, parsePostgresDate)
    oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.DATE)
    if (oid) pgTypes.setTypeParser(oid, parsePostgresArrayWithTransformation(parsePostgresDate))

    pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMP, parsePostgresDatetime)
    oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TIMESTAMP)
    if (oid) pgTypes.setTypeParser(oid, parsePostgresArrayWithTransformation(parsePostgresDatetime))

    pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMPTZ, parsePostgresDatetime)
    oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TIMESTAMPTZ)
    if (oid) pgTypes.setTypeParser(oid, parsePostgresArrayWithTransformation(parsePostgresDatetime))

    pgTypes.setTypeParser(pgTypes.builtins.NUMERIC, parsePostgresDecimal)
    oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.NUMERIC)
    if (oid) pgTypes.setTypeParser(oid, parsePostgresArrayWithTransformation(parsePostgresDecimal))

    const textArrayOid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TEXT)
    if (textArrayOid) {
      const textArrayParser = pgTypes.getTypeParser(textArrayOid)

      const citextArrayOid = await findCitextArrayOid(kyselyDb)
      if (citextArrayOid) pgTypes.setTypeParser(citextArrayOid, textArrayParser)

      const uuidArrayOid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.UUID)
      if (uuidArrayOid) pgTypes.setTypeParser(uuidArrayOid, textArrayParser)

      const enumArrayOids = await findEnumArrayOids(kyselyDb)
      enumArrayOids.forEach((enumArrayOid: number) => pgTypes.setTypeParser(enumArrayOid, textArrayParser))
    }

    return dreamApp
  }

  private static checkKey(encryptionIdentifier: 'columns', key: string, algorithm: EncryptAlgorithm) {
    if (!Encrypt.validateKey(key, algorithm))
      console.warn(
        `
Your current key value for ${encryptionIdentifier} encryption is invalid.
Try setting it to something valid, like:
  ${Encrypt.generateKey(algorithm)}

(This was done by calling:
  Encrypt.generateKey('${algorithm}')
`
      )
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

  public static log(...args: any[]) {
    this.getOrFail().logger.info(...args)
  }

  public static logWithLevel(level: DreamLogLevel, ...args: any[]) {
    this.getOrFail().logger[level](...args)
  }

  private _dbCredentials: DreamDbCredentialOptions
  public get dbCredentials() {
    return this._dbCredentials
  }

  private _encryption: DreamApplicationEncryptionOptions
  public get encryption() {
    return this._encryption
  }

  private _parallelTests: number | undefined
  public get parallelTests() {
    return this._parallelTests
  }

  private _primaryKeyType: (typeof primaryKeyTypes)[number] = 'bigserial'
  public get primaryKeyType() {
    return this._primaryKeyType
  }

  private _projectRoot: string
  public get projectRoot() {
    return this._projectRoot
  }

  private _paths: Required<DreamDirectoryPaths>
  public get paths() {
    return this._paths
  }

  private _serializerCasing: DreamSerializerCasing
  public get serializerCasing() {
    return this._serializerCasing
  }

  private _logger: DreamLogger = console
  public get logger() {
    return this._logger
  }

  private _inflections?: () => void | Promise<void>
  public get inflections() {
    return this._inflections
  }

  protected loadedModels: boolean = false

  constructor(opts?: Partial<DreamApplicationOpts>) {
    if (opts?.db) this._dbCredentials = opts.db
    if (opts?.primaryKeyType) this._primaryKeyType = opts.primaryKeyType
    if (opts?.projectRoot) this._projectRoot = opts.projectRoot
    if (opts?.inflections) this._inflections = opts.inflections
    if (opts?.serializerCasing) this._serializerCasing = opts.serializerCasing
    if (opts?.parallelTests) this._parallelTests = opts.parallelTests

    this._paths = {
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
      : ApplyOpt extends 'encryption'
        ? DreamApplicationEncryptionOptions
        : ApplyOpt extends 'primaryKeyType'
          ? (typeof primaryKeyTypes)[number]
          : ApplyOpt extends 'logger'
            ? DreamLogger
            : ApplyOpt extends 'projectRoot'
              ? string
              : ApplyOpt extends 'inflections'
                ? () => void | Promise<void>
                : ApplyOpt extends 'paths'
                  ? DreamDirectoryPaths
                  : ApplyOpt extends 'parallelTests'
                    ? number
                    : never
  ) {
    switch (applyOption) {
      case 'db':
        this._dbCredentials = options as DreamDbCredentialOptions
        break

      case 'encryption':
        this._encryption = options as DreamApplicationEncryptionOptions
        break

      case 'primaryKeyType':
        this._primaryKeyType = options as (typeof primaryKeyTypes)[number]
        break

      case 'logger':
        this._logger = options as DreamLogger
        break

      case 'projectRoot':
        this._projectRoot = options as string
        break

      case 'inflections':
        this._inflections = options as () => void | Promise<void>
        break

      case 'serializerCasing':
        this._serializerCasing = options as DreamSerializerCasing
        break

      case 'paths':
        this._paths = {
          ...this.paths,
          ...(options as DreamDirectoryPaths),
        }
        break

      case 'parallelTests':
        if (process.env.NODE_ENV === 'test' && !Number.isNaN(Number(options)) && Number(options) > 1) {
          this._parallelTests = options as number
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
  parallelTests: number | undefined
}

export type DreamApplicationSetOption =
  | 'db'
  | 'encryption'
  | 'inflections'
  | 'logger'
  | 'paths'
  | 'primaryKeyType'
  | 'projectRoot'
  | 'serializerCasing'
  | 'parallelTests'

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

export type DreamLogger = {
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  debug: (...args: any[]) => void
  error: (...args: any[]) => void
}
export type DreamLogLevel = 'info' | 'warn' | 'debug' | 'error'
export type DreamSerializerCasing = 'snake' | 'camel'

export interface DreamApplicationEncryptionOptions {
  columns: SegmentedEncryptionOptions
}
interface SegmentedEncryptionOptions {
  current: EncryptOptions
  legacy?: EncryptOptions
}
