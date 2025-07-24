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
import * as util from 'node:util'
import { Context } from 'node:vm'
import db from '../db/index.js'
import validateTable from '../db/validators/validateTable.js'
import Dream from '../Dream.js'
import { primaryKeyTypes } from '../dream/constants.js'
import Encrypt, { EncryptAlgorithm, EncryptOptions } from '../encrypt/index.js'
import DreamAppInitMissingCallToLoadModels from '../errors/dream-app/DreamAppInitMissingCallToLoadModels.js'
import DreamAppInitMissingMissingProjectRoot from '../errors/dream-app/DreamAppInitMissingMissingProjectRoot.js'
import CalendarDate from '../helpers/CalendarDate.js'
import {
  findCitextArrayOid,
  findCorrespondingArrayOid,
  findEnumArrayOids,
  parsePostgresBigint,
  parsePostgresDate,
  parsePostgresDatetime,
  parsePostgresDecimal,
} from '../helpers/customPgParsers.js'
import { DateTime, Settings } from '../helpers/DateTime.js'
import EnvInternal from '../helpers/EnvInternal.js'
import { DbConnectionType } from '../types/db.js'
import { DreamModelSerializerType, SimpleObjectSerializerType } from '../types/serializer.js'
import { cacheDreamApp, getCachedDreamAppOrFail } from './cache.js'
import importModels, { getModelsOrFail } from './helpers/importers/importModels.js'
import importSerializers, {
  getSerializersOrFail,
  setCachedSerializers,
} from './helpers/importers/importSerializers.js'

const pgTypes = pg.types

// this needs to be done top-level to ensure proper configuration
Settings.defaultZone = 'UTC'

export default class DreamApp {
  /**
   * initializes a new dream application and caches it for use
   * within this processes lifecycle.
   *
   * Within dream, we rely on cached information about your app
   * to be able to serve routes, perform serializer lookups,
   * generate files, connect to the database, etc...
   *
   * In order for this to work properly, the DreamApp#init
   * function must be called before anything else is called within
   * Dream.
   */
  public static async init(
    cb: (dreamApp: DreamApp) => void | Promise<void>,
    opts: Partial<DreamAppOpts> & DreamAppInitOptions = {},
    deferCb?: (dreamApp: DreamApp) => Promise<void> | void
  ) {
    const dreamApp = new DreamApp(opts)
    await cb(dreamApp)

    await dreamApp.inflections?.()

    if (!dreamApp.serializers) setCachedSerializers({})

    cacheDreamApp(dreamApp)

    if (!EnvInternal.boolean('BYPASS_DB_CONNECTIONS_DURING_INIT')) await this.setDatabaseTypeParsers(dreamApp)

    await deferCb?.(dreamApp)

    for (const plugin of dreamApp.plugins) {
      await plugin(dreamApp)
    }

    dreamApp.validateAppBuildIntegrity({
      bypassModelIntegrityCheck: opts.bypassModelIntegrityCheck || false,
    })

    return dreamApp
  }

  /**
   * @internal
   *
   * Ensures that the application build is not missing any critical components
   * that would render it in an invalid state
   *
   */
  private validateAppBuildIntegrity({ bypassModelIntegrityCheck }: DreamAppInitOptions) {
    if (!this.projectRoot) throw new DreamAppInitMissingMissingProjectRoot()
    if (!this.loadedModels) throw new DreamAppInitMissingCallToLoadModels()
    if (this.encryption?.columns?.current)
      DreamApp.checkKey(
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
  private static async setDatabaseTypeParsers(dreamApp: DreamApp) {
    for (const connectionName of Object.keys(dreamApp._dbCredentials)) {
      const kyselyDb = db(connectionName, 'primary')

      pgTypes.setTypeParser(pgTypes.builtins.DATE, parsePostgresDate)

      pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMP, parsePostgresDatetime)

      pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMPTZ, parsePostgresDatetime)

      pgTypes.setTypeParser(pgTypes.builtins.NUMERIC, parsePostgresDecimal)

      pgTypes.setTypeParser(pgTypes.builtins.INT8, parsePostgresBigint)

      const textArrayOid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.TEXT)
      if (textArrayOid) {
        let oid: number | undefined

        const textArrayParser = pgTypes.getTypeParser(textArrayOid)

        function transformPostgresArray(
          transformer:
            | typeof parsePostgresDate
            | typeof parsePostgresDatetime
            | typeof parsePostgresDecimal
            | typeof parsePostgresBigint
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

        oid = await findCorrespondingArrayOid(kyselyDb, pgTypes.builtins.INT8)
        if (oid) pgTypes.setTypeParser(oid, transformPostgresArray(parsePostgresBigint))
      }
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
   * The dream application can be set by calling DreamApp#init,
   * or alternatively, if you are using Psychic along with Dream,
   * it can be set during PsychicApp#init, which will set caches
   * for both the dream and psychic applications at once.
   */
  public static getOrFail() {
    return getCachedDreamAppOrFail()
  }

  public static log(...args: any[]) {
    this.getOrFail().logger.info(this.argsToString(args))
  }

  public static logWithLevel(level: DreamLogLevel, ...args: any[]) {
    this.getOrFail().logger[level](this.argsToString(args))
  }

  private static argsToString(args: any[]) {
    return args.map(argToString).join(' ')
  }

  private _specialHooks: DreamAppSpecialHooks = {
    dbLog: [],
    replStart: [],
  }
  public get specialHooks() {
    return this._specialHooks
  }

  private _dbCredentials: Record<string, DreamDbCredentialOptions> = {}
  public get dbCredentials() {
    return this._dbCredentials
  }

  // TODO: maybe harden typing for connectionName
  // TODO: maybe raise exception instead of returning null?
  public dbCredentialsFor(connectionName: string): DreamDbCredentialOptions | null {
    if (this._dbCredentials[connectionName]) return this._dbCredentials[connectionName]
    return null
  }

  private _encryption: DreamAppEncryptionOptions
  public get encryption() {
    return this._encryption
  }

  private _parallelTests: number | undefined
  public get parallelTests() {
    return process.env.NODE_ENV === 'test' ? this._parallelTests : undefined
  }

  private _unicodeNormalization: UnicodeNormalizationForm = 'NFC'
  public get unicodeNormalization() {
    return this._unicodeNormalization
  }

  private _paginationPageSize: number = 25
  public get paginationPageSize() {
    return this._paginationPageSize
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

  private _plugins: ((app: DreamApp) => void | Promise<void>)[] = []
  public get plugins() {
    return this._plugins
  }

  private _packageManager: DreamAppAllowedPackageManagersEnum
  public get packageManager() {
    return this._packageManager
  }

  private _importExtension: GeneratorImportStyle = '.js'
  public get importExtension() {
    return this._importExtension
  }

  protected loadedModels: boolean = false

  constructor(opts?: Partial<DreamAppOpts>) {
    if (opts?.db) this._dbCredentials['default'] = opts.db
    if (opts?.primaryKeyType) this._primaryKeyType = opts.primaryKeyType
    if (opts?.projectRoot) this._projectRoot = opts.projectRoot
    if (opts?.inflections) this._inflections = opts.inflections
    if (opts?.serializerCasing) this._serializerCasing = opts.serializerCasing
    if (opts?.parallelTests) this._parallelTests = opts.parallelTests

    this._paths = {
      conf: opts?.paths?.conf || 'src/conf',
      db: opts?.paths?.db || 'src/db',
      factories: opts?.paths?.factories || 'spec/factories',
      models: opts?.paths?.models || 'src/app/models',
      modelSpecs: opts?.paths?.modelSpecs || 'spec/unit/models',
      serializers: opts?.paths?.serializers || 'src/app/serializers',
      types: opts?.paths?.types || 'src/types',
    }
  }

  public get models(): Record<string, typeof Dream> {
    return getModelsOrFail()
  }

  public get serializers(): Record<string, DreamModelSerializerType | SimpleObjectSerializerType> {
    return getSerializersOrFail()
  }

  // TODO: maybe harden connectionName type
  public dbName(connectionName: string, connection: DbConnectionType): string {
    const conf = this.dbConnectionConfig(connectionName, connection)
    return this.parallelDatabasesEnabled ? `${conf.name}_${process.env.VITEST_POOL_ID}` : conf.name
  }

  // TODO: maybe harden connectionName type
  public dbConnectionConfig(connectionName: string, connection: DbConnectionType): SingleDbCredential {
    const conf =
      this.dbCredentialsFor(connectionName)?.[connection] || this.dbCredentialsFor(connectionName)?.primary

    if (!conf) {
      console.log(this.dbCredentials)
      throw new Error(`
      Cannot find a connection config given the following connection and node environment:
        connectionName: ${connectionName}
        connection: ${connection}
        NODE_ENV: ${EnvInternal.nodeEnv}
    `)
    }

    return conf
  }

  public dbConnectionKeys(): string[] {
    return Object.keys(this.dbCredentials)
  }

  public hasReplicaConfig(connectionName: string) {
    return !!this.dbCredentials[connectionName]?.replica
  }

  public get parallelDatabasesEnabled(): boolean {
    return (
      !!this.parallelTests &&
      !Number.isNaN(Number(process.env.VITEST_POOL_ID)) &&
      Number(process.env.VITEST_POOL_ID) > 1
    )
  }

  public async load<RT extends 'models' | 'serializers'>(
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
    }
  }

  public plugin(cb: (app: DreamApp) => void | Promise<void>) {
    this._plugins.push(cb)
  }

  public set<ApplyOpt extends DreamAppSetOption>(
    applyOption: ApplyOpt,
    options: ApplyOpt extends 'db'
      ? DreamDbCredentialOptions | string
      : ApplyOpt extends 'encryption'
        ? DreamAppEncryptionOptions
        : ApplyOpt extends 'primaryKeyType'
          ? (typeof primaryKeyTypes)[number]
          : ApplyOpt extends 'importExtension'
            ? GeneratorImportStyle
            : ApplyOpt extends 'logger'
              ? DreamLogger
              : ApplyOpt extends 'projectRoot'
                ? string
                : ApplyOpt extends 'inflections'
                  ? () => void | Promise<void>
                  : ApplyOpt extends 'packageManager'
                    ? DreamAppAllowedPackageManagersEnum
                    : ApplyOpt extends 'paths'
                      ? DreamDirectoryPaths
                      : ApplyOpt extends 'parallelTests'
                        ? number
                        : ApplyOpt extends 'unicodeNormalization'
                          ? UnicodeNormalizationForm
                          : ApplyOpt extends 'paginationPageSize'
                            ? number
                            : never,
    secondaryOptions?: ApplyOpt extends 'db' ? DreamDbCredentialOptions : never
  ) {
    switch (applyOption) {
      case 'db':
        if (typeof options === 'string') {
          this._dbCredentials[options] = secondaryOptions as DreamDbCredentialOptions
        } else {
          this._dbCredentials['default'] = options as DreamDbCredentialOptions
        }
        break

      case 'encryption':
        this._encryption = options as DreamAppEncryptionOptions
        break

      case 'primaryKeyType':
        this._primaryKeyType = options as (typeof primaryKeyTypes)[number]
        break

      case 'importExtension':
        this._importExtension = options as GeneratorImportStyle
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

      case 'unicodeNormalization':
        this._unicodeNormalization = options as UnicodeNormalizationForm
        break

      case 'packageManager':
        this._packageManager = options as DreamAppAllowedPackageManagersEnum
        break

      case 'paginationPageSize':
        this._paginationPageSize = options as number
        break

      default: {
        // protection so that if a new ApplyOpt is ever added, this will throw a type error at build time
        const _never: never = applyOption
        throw new Error(`Unhandled ApplyOpt: ${_never as string}`)
      }
    }
  }

  public on<T extends DreamHookEventType>(
    hookEventType: T,
    cb: T extends 'db:log'
      ? (event: KyselyLogEvent) => void
      : T extends 'repl:start'
        ? (context: Context) => void | Promise<void>
        : never
  ) {
    switch (hookEventType) {
      case 'db:log':
        this._specialHooks.dbLog.push(cb as (event: KyselyLogEvent) => void)
        break

      case 'repl:start':
        this._specialHooks.replStart.push(cb as (context: Context) => void | Promise<void>)
        break
    }
  }
}

function argToString(arg: any) {
  if (typeof arg === 'string') return arg
  if (typeof arg === 'number') return arg
  if (typeof arg === 'boolean') return arg
  if (arg instanceof DateTime || arg instanceof CalendarDate) return arg.toISO()
  return util.inspect(arg, { depth: 3 })
}

export type DreamHookEventType = 'db:log' | 'repl:start'

export interface DreamAppOpts {
  projectRoot: string
  primaryKeyType: (typeof primaryKeyTypes)[number]
  db: DreamDbCredentialOptions
  inflections?: () => void | Promise<void>
  paths?: DreamDirectoryPaths
  serializerCasing?: DreamSerializerCasing
  parallelTests: number | undefined
}

export type DreamAppSetOption =
  | 'db'
  | 'encryption'
  | 'inflections'
  | 'importExtension'
  | 'logger'
  | 'paths'
  | 'primaryKeyType'
  | 'projectRoot'
  | 'serializerCasing'
  | 'parallelTests'
  | 'unicodeNormalization'
  | 'paginationPageSize'
  | 'packageManager'

export interface DreamDirectoryPaths {
  models?: string
  serializers?: string
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

type UnicodeNormalizationForm = 'NFC' | 'NFD' | 'none'

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

export interface DreamAppEncryptionOptions {
  columns: SegmentedEncryptionOptions
}
interface SegmentedEncryptionOptions {
  current: EncryptOptions
  legacy?: EncryptOptions
}

export interface DreamAppSpecialHooks {
  dbLog: ((event: KyselyLogEvent) => void)[]
  replStart: ((context: Context) => void | Promise<void>)[]
}

export interface DreamAppInitOptions {
  bypassModelIntegrityCheck?: boolean
}

export interface KyselyLogEvent {
  level: 'query' | 'error'
  query: CompiledQuery // this object contains the raw SQL string, parameters, and Kysely's SQL syntax tree that helped output the raw SQL string.
  queryDurationMillis: number // the time in milliseconds it took for the query to execute and get a response from the database.
  error: unknown // only present if `level` is `'error'`.
}

export const DreamAppAllowedPackageManagersEnumValues = ['yarn', 'npm', 'pnpm'] as const
export type DreamAppAllowedPackageManagersEnum = (typeof DreamAppAllowedPackageManagersEnumValues)[number]

// GeneratorImportStyles are used by CLI generators to determine how
// to style import suffixes. When integrating with other apps, this
// suffix style can change, and may need to be configured.
export const GeneratorImportStyles = ['.js', '.ts', 'none'] as const
export type GeneratorImportStyle = (typeof GeneratorImportStyles)[number]
