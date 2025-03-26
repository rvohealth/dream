import MissingRequiredEnvironmentVariable from '../errors/environment/MissingRequiredEnvironmentVariable.js'

export default class Env<
  T extends {
    string?: string
    integer?: string
    boolean?: string
  },
  StringEnvs extends string = T['string'] extends string ? T['string'] : never,
  IntegerEnvs extends string = T['integer'] extends string ? T['integer'] : never,
  BooleanEnvs extends string = T['boolean'] extends string ? T['boolean'] : never,
> {
  public get isProduction() {
    return !this.isDevelopmentOrTest
  }

  public get nodeEnv(): StandardNodeEnvValues {
    switch (this.optional('NODE_ENV')) {
      case 'production':
        return 'production'
      case 'development':
        return 'development'
      case 'test':
        return 'test'
      default:
        return 'production'
    }
  }

  public get isDebug(): boolean {
    return this.optional('DEBUG') === '1'
  }

  public get isTest() {
    return this.optional('NODE_ENV') === 'test'
  }

  public get isDevelopment() {
    return this.optional('NODE_ENV') === 'development'
  }

  public get isDevelopmentOrTest() {
    return this.isTest || this.isDevelopment
  }

  public string<
    OptionalConfig extends { optional: boolean } | undefined,
    ReturnType extends OptionalConfig extends undefined
      ? string
      : OptionalConfig extends { optional: boolean }
        ? OptionalConfig['optional'] extends true
          ? string | undefined
          : string
        : string,
  >(env: StringEnvs, opts: OptionalConfig = { optional: false } as OptionalConfig): ReturnType {
    return (opts!.optional ? this.optional(env) : this.required(env)) as ReturnType
  }

  public integer<
    OptionalConfig extends { optional: boolean } | undefined,
    ReturnType extends OptionalConfig extends undefined
      ? number
      : OptionalConfig extends { optional: boolean }
        ? OptionalConfig['optional'] extends true
          ? number | undefined
          : number
        : number,
  >(env: IntegerEnvs, opts: OptionalConfig = { optional: false } as OptionalConfig): ReturnType {
    const val = opts!.optional ? this.optional(env) : this.required(env)
    if (val === undefined) return undefined as ReturnType
    const parsedVal = parseInt(val, 10)
    return (parsedVal.toString() === val ? parsedVal : undefined) as ReturnType
  }

  public boolean(env: BooleanEnvs): boolean {
    return this.optional(env) === '1'
  }

  public setString(env: StringEnvs, val: string | undefined) {
    val === undefined ? delete process.env[env] : (process.env[env] = val)
  }

  public unsetString(env: StringEnvs) {
    delete process.env[env]
  }

  public setInteger(env: IntegerEnvs, val: number | undefined) {
    val === undefined ? delete process.env[env] : (process.env[env] = Math.floor(val).toString())
  }

  public unsetInteger(env: IntegerEnvs) {
    delete process.env[env]
  }

  public setBoolean(env: BooleanEnvs) {
    process.env[env] = '1'
  }

  public unsetBoolean(env: BooleanEnvs) {
    delete process.env[env]
  }

  protected required(variable: string): string {
    const envVar = process.env[variable]
    if (envVar === undefined) throw new MissingRequiredEnvironmentVariable(variable)
    return envVar
  }

  protected optional(variable: string): string | undefined {
    return process.env[variable]
  }
}

export type StandardNodeEnvValues = 'production' | 'development' | 'test'
