import configCache from '../sync/config-cache'

export default async function loadDBConfig() {
  return {
    host: process.env[configCache.db.host] || 'localhost',
    user: process.env[configCache.db.user] || 'postgres',
    password: process.env[configCache.db.password] || '',
    port: process.env[configCache.db.port] ? parseInt(process.env[configCache.db.port] as string) : 5432,
    name: process.env[configCache.db.name] || 'dream_app_dev',
  }
}
