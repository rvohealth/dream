"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loadPgClient_1 = __importDefault(require("./loadPgClient"));
async function truncate() {
    // this was only ever written to clear the db between tests,
    // so there is no way to truncate in dev/prod
    if (process.env.NODE_ENV !== 'test')
        return false;
    const client = await (0, loadPgClient_1.default)();
    await client.query(`
DO $$
DECLARE row RECORD;
BEGIN
FOR row IN SELECT table_name
  FROM information_schema.tables
  WHERE table_type='BASE TABLE'
  AND table_schema='public'
  AND table_name NOT IN ('migrations')
LOOP
  EXECUTE format('TRUNCATE TABLE %I CONTINUE IDENTITY RESTRICT;',row.table_name);
END LOOP;
END;
$$;
`);
}
exports.default = truncate;
