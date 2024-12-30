import MissingRequiredEnvironmentVariable from '../errors/environment/MissingRequiredEnvironmentVariable'

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

  public get nodeEnv(): 'production' | 'development' | 'test' {
    return (this.optional('NODE_ENV') || 'production') as 'production' | 'development' | 'test'
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

  public string(env: StringEnvs, opts: { optional: true }): string | undefined
  public string(env: StringEnvs, opts: { optional: false }): string
  public string(env: StringEnvs): string
  public string(env: StringEnvs, opts: unknown = {}): unknown {
    return (opts as any)?.optional ? this.optional(env) : this.required(env)
  }

  public integer(env: IntegerEnvs, opts: { optional: true }): number | undefined
  public integer(env: IntegerEnvs, opts: { optional: false }): number
  public integer(env: IntegerEnvs): number
  public integer(env: IntegerEnvs, opts: unknown = {}): unknown {
    const val = (opts as any)?.optional ? this.optional(env) : this.required(env)
    if (val === undefined) return undefined
    const parsedVal = parseInt(val, 10)
    return typeof parsedVal === 'number' ? parsedVal : undefined
  }

  public boolean(env: BooleanEnvs): boolean {
    return this.optional(env) === '1'
  }

  public setBoolean(env: BooleanEnvs) {
    process.env[env] = '1'
  }

  public unsetBoolean(env: BooleanEnvs) {
    process.env[env] = undefined
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
