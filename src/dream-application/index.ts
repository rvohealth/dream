import { primaryKeyTypes } from '../dream/types'
import loadDreamconfCb from '../helpers/path/loadDreamconfCb'
import { cacheDreamApplication } from './cache'

export default class DreamApplication {
  public static async configure() {
    await this.applyAndCacheConfig(await loadDreamconfCb())
  }

  private static async applyAndCacheConfig(cb: (dreamconf: DreamApplication) => Promise<void> | void) {
    const dreamconf = new DreamApplication()
    await cb(dreamconf)
    cacheDreamApplication(dreamconf)
    return dreamconf
  }

  public dbCredentials: DreamDbCredentialOptions
  public primaryKeyType: (typeof primaryKeyTypes)[number] = 'bigserial'

  public set<ApplyOpt extends ApplyOption>(
    applyOption: ApplyOpt,
    options: ApplyOpt extends 'dbCredentials'
      ? DreamDbCredentialOptions
      : ApplyOpt extends 'primaryKeyType'
        ? (typeof primaryKeyTypes)[number]
        : never
  ) {
    switch (applyOption) {
      case 'dbCredentials':
        this.dbCredentials = options as DreamDbCredentialOptions
        break

      case 'primaryKeyType':
        this.primaryKeyType = options as (typeof primaryKeyTypes)[number]
        break

      default:
        throw new Error(`Unhandled applyOption encountered in Dreamconf: ${applyOption}`)
    }
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
