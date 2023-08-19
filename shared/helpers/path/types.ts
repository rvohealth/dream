export interface DreamYamlFile {
  models_path: string
  serializers_path: string
  associations_path: string
  migrations_path: string
  schema_path: string
  db_config_path: string
  db_seed_path: string
  unit_spec_path: string
  feature_spec_path: string
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
