import loadDreamconfCb from '../helpers/path/loadDreamconfCb'
import { cacheDreamconf } from './cache'

export default class Dreamconf {
  public static async configure() {
    await this.applyAndCacheConfig(await loadDreamconfCb())
  }

  private static async applyAndCacheConfig(cb: (dreamconf: Dreamconf) => Promise<void> | void) {
    const dreamconf = new Dreamconf()
    await cb(dreamconf)
    cacheDreamconf(dreamconf)
    return dreamconf
  }

  public dbCredentials: DreamDbCredentialOptions

  public apply<ApplyOpt extends ApplyOption>(
    applyOption: ApplyOpt,
    options: ApplyOpt extends 'dbCredentials' ? DreamDbCredentialOptions : never
  ) {
    switch (applyOption) {
      case 'dbCredentials':
        this.dbCredentials = options
        break

      default:
        throw new Error(`Unhandled applyOption encountered in Dreamconf: ${applyOption}`)
    }
  }
}

export type ApplyOption = 'dbCredentials'

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
