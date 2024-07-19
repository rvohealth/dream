import { PrimaryKeyType } from '../../dream/types'

export interface DreamYamlFile {
  models_path: string
  serializers_path: string
  client_api_schema_path: string
  conf_path: string
  db_path: string
  unit_spec_path: string
  primary_key_type: PrimaryKeyType
  factory_path?: string
}

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
