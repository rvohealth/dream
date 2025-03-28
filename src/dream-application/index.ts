// after building for esm, importing pg using the following:
//
//  import * as pg from 'pg'
//
// will crash. This is difficult to discover, since it only happens
// when being imported from our esm build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pg from 'pg'

import { CompiledQuery } from 'kysely'
import db from '../db/index.js'
import validateTable from '../db/validators/validateTable.js'
import Dream from '../Dream.js'
import { primaryKeyTypes } from '../dream/constants.js'
import Encrypt, { EncryptAlgorithm, EncryptOptions } from '../encrypt/index.js'
import DreamApplicationInitMissingCallToLoadModels from '../errors/dream-application/DreamApplicationInitMissingCallToLoadModels.js'
import DreamApplicationInitMissingMissingProjectRoot from '../errors/dream-application/DreamApplicationInitMissingMissingProjectRoot.js'
import {
  findCitextArrayOid,
  findCorrespondingArrayOid,
  findEnumArrayOids,
  parsePostgresDate,
  parsePostgresDatetime,
  parsePostgresDecimal,
} from '../helpers/customPgParsers.js'
import { Settings } from '../helpers/DateTime.js'
import EnvInternal from '../helpers/EnvInternal.js'
import DreamSerializer from '../serializer/index.js'
import { cacheDreamApplication, getCachedDreamApplicationOrFail } from './cache.js'
import importModels, { getModelsOrFail } from './helpers/importers/importModels.js'
import importSerializers, {
  getSerializersOrFail,
  setCachedSerializers,
} from './helpers/importers/importSerializers.js'
import importServices, { getServicesOrFail, setCachedServices } from './helpers/importers/importServices.js'

const pgTypes = pg.types

// this needs to be done top-level to ensure proper configuration
Settings.defaultZone = 'UTC'

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
    opts: Partial<DreamApplicationOpts> & DreamApplicationInitOptions = {},
    deferCb?: (dreamApp: DreamApplication) => Promise<void> | void
  ) {
    const dreamApp = new DreamApplication(opts)
    await cb(dreamApp)

    await dreamApp.inflections?.()

    await deferCb?.(dreamApp)

    dreamApp.validateApplicationBuildIntegrity({
      bypassModelIntegrityCheck: opts.bypassModelIntegrityCheck || false,
    })

    if (!dreamApp.serializers) setCachedSerializers({})
    if (!dreamApp.services) setCachedServices({})

    cacheDreamApplication(dreamApp)

    if (!EnvInternal.boolean('BYPASS_DB_CONNECTIONS_DURING_INIT')) await this.setDatabaseTypeParsers()

    return dreamApp
  }

  /**
   * @internal
   *
   * Ensures that the application build is not missing any critical components
   * that would render it in an invalid state
   *
   */
  private validateApplicationBuildIntegrity({ bypassModelIntegrityCheck }: DreamApplicationInitOptions) {
    if (!this.projectRoot) throw new DreamApplicationInitMissingMissingProjectRoot()
    if (!this.loadedModels) throw new DreamApplicationInitMissingCallToLoadModels()
    if (this.encryption?.columns?.current)
      DreamApplication.checkKey(
        'columns',
        this.encryption.columns.current.key,
        this.encryption.columns.current.algorithm
      )

    if (!bypassModelIntegrityCheck) this.validateApplicationModels()
  }

  /**
   * @internal
   *
   * Ensures that all models are in a valid state
   *
   */
  private validateApplicationModels() {
    Object.values(this.models).forEach(modelClass => {
      validateTable(modelClass.prototype.schema, modelClass.prototype.table)
    })
  }

  /**
   * @internal
   *
   *
   */
  private static async setDatabaseTypeParsers() {
    const kyselyDb = db('primary')

    pgTypes.setTypeParser(pgTypes.builtins.DATE, parsePostgresDate)

    pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMP, parsePostgresDatetime)

    pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMPTZ, parsePostgresDatetime)

    pgTypes.setTypeParser(pgTypes.builtins.NUMERIC, parsePostgresDecimal)

    const textArrayOid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TEXT)
    if (textArrayOid) {
      let oid: number | undefined

      const textArrayParser = pgTypes.getTypeParser(textArrayOid)

      function transformPostgresArray(
        transformer: typeof parsePostgresDate | typeof parsePostgresDatetime | typeof parsePostgresDecimal
      ) {
        return (value: string) => (textArrayParser(value) as string[]).map(str => transformer(str))
      }

      const enumArrayOids = await findEnumArrayOids(kyselyDb)
      enumArrayOids.forEach((enumArrayOid: number) => pgTypes.setTypeParser(enumArrayOid, textArrayParser))

      oid = await findCitextArrayOid(kyselyDb)
      if (oid) pgTypes.setTypeParser(oid, textArrayParser)

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.UUID)
      if (oid) pgTypes.setTypeParser(oid, textArrayParser)

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.DATE)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresDate))

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TIMESTAMP)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresDatetime))

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TIMESTAMPTZ)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresDatetime))

      oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.NUMERIC)
      if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresDecimal))
    }
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

  private _specialHooks: DreamApplicationSpecialHooks = {
    dbLog: [],
  }
  public get specialHooks() {
    return this._specialHooks
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
    return process.env.NODE_ENV === 'test' ? this._parallelTests : undefined
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
      types: opts?.paths?.types || 'src/types',
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

  public async load<RT extends 'models' | 'serializers' | 'services'>(
    resourceType: RT,
    resourcePath: string,
    importCb: (path: string) => Promise<any>
  ) {
    switch (resourceType) {
      case 'models':
        await importModels(resourcePath, importCb)
        this.loadedModels = true
        break

      case 'serializers':
        await importSerializers(resourcePath, importCb)
        break

      case 'services':
        await importServices(resourcePath, importCb)
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

  public on<T extends DreamHookEventType>(
    hookEventType: T,
    cb: T extends 'db:log' ? (event: KyselyLogEvent) => void : never
  ) {
    switch (hookEventType) {
      case 'db:log':
        this._specialHooks.dbLog.push(cb)
        break
    }
  }
}

export type DreamHookEventType = 'db:log'

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
  types?: string
}

export interface DreamDbCredentialOptions {
  primary: SingleDbCredential
  replica?: SingleDbCredential | undefined
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

export interface DreamApplicationSpecialHooks {
  dbLog: ((event: KyselyLogEvent) => void)[]
}

export interface DreamApplicationInitOptions {
  bypassModelIntegrityCheck?: boolean
}

export interface KyselyLogEvent {
  level: 'query' | 'error'
  query: CompiledQuery // this object contains the raw SQL string, parameters, and Kysely's SQL syntax tree that helped output the raw SQL string.
  queryDurationMillis: number // the time in milliseconds it took for the query to execute and get a response from the database.
  error: unknown // only present if `level` is `'error'`.
}
