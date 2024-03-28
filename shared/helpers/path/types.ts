export interface DreamYamlFile {
  models_path: string
  serializers_path: string
  client_api_schema_path: string
  conf_path: string
  db_path: string
  db_seed_path: string
  unit_spec_path: string
  feature_spec_path: string
  dreamconf_path: string
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

export interface DbConnectionConfig {
  user: string
  password: string
  name: string
  host: string
  port: string
  use_ssl?: string
}
