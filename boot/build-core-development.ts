import '../src/helpers/loadEnv'
import log from '../shared/logger'
import c from 'colorette'
import sspawn from '../shared/helpers/sspawn'

export default async function buildCoreDevelopment() {
  log.clear()
  // log.write(logo() + '\n\n', { cache: true })
  log.write(c.magentaBright('building dream...'), { cache: true })
  log.write(c.magentaBright('removing existing cache...'))
  await sspawn('rm -rf dist')

  log.write(c.magentaBright('building boot cache...'))
  await sspawn('npx tsc -p ./tsconfig.boot.json')

  log.write(c.magentaBright('syncing existing app schema and associations...'))
  await sspawn('NODE_ENV=development yarn dream sync:config-cache --core')

  log.write(c.magentaBright('building boot cache again (for no good reason)...'))
  await sspawn('npx tsc -p ./tsconfig.boot.json')

  log.write(c.magentaBright('building dream app...'))
  await sspawn('npx tsc -p ./tsconfig.build-core.json')

  log.write(c.magentaBright('copying app.yml...'))
  await sspawn('cp .dream.yml dist/.dream.yml')

  log.write(c.magentaBright('building env'))
  await sspawn('mkdir dist/test-app/conf/env')

  log.write(c.magentaBright('building env'))
  await sspawn('cp test-app/conf/env/db.yml dist/test-app/conf/env/db.yml')

  log.clear()
  log.write(c.magentaBright('done!'))
}

buildCoreDevelopment()
