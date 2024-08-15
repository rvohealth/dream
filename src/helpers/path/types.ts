export interface DreamConfig {
  db: DbConfig
}

export interface DbConfig {
  production: {
    primary: DbConnectionConfig
    replica?: DbConnectionConfig
  }
  development: {
    primary: DbConnectionConfig
    replica?: DbConnectionConfig
  }
  test: {
    primary: DbConnectionConfig
    replica?: DbConnectionConfig
  }
}

export interface EnvOpts {
  db: DbConfig
}

export interface DbConnectionConfig {
  user: string
  password: string
  name: string
  host: string
  port: string
  use_ssl?: string
}
