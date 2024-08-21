"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dream_application_1 = __importDefault(require("../src/dream-application"));
async function truncate() {
    // this was only ever written to clear the db between tests,
    // so there is no way to truncate in dev/prod
    if (process.env.NODE_ENV !== 'test')
        return false;
    const dreamconf = dream_application_1.default.getOrFail();
    const data = dreamconf.dbCredentials.primary;
    const client = new pg_1.Client({
        host: data.host || 'localhost',
        port: data.port,
        database: data.name,
        user: data.user,
        password: data.password,
    });
    await client.connect();
    await client.query(`
DO $$
DECLARE row RECORD;
BEGIN
FOR row IN SELECT table_name
  FROM information_schema.tables
  WHERE table_type='BASE TABLE'
  AND table_schema='public'
  AND table_name NOT IN ('kysely_migration', 'kysely_migration_lock')
LOOP
  EXECUTE format('TRUNCATE TABLE %I CASCADE;',row.table_name);
END LOOP;
END;
$$;
`);
    await client.end();
}
exports.default = truncate;
