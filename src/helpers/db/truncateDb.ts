import EnvInternal from '../EnvInternal.js.js'
import loadPgClient from './loadPgClient.js.js'

export default async function truncate() {
  // this was only ever written to clear the db between tests,
  // so there is no way to truncate in dev/prod
  if (!EnvInternal.isTest) return false

  const client = await loadPgClient()
  await client.query(
    `
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
`
  )
}
