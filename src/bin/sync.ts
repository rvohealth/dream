import sspawn from '../helpers/sspawn'

export default async function sync() {
  console.log('syncing models...')
  await sspawn(
    'rm -rf src/sync && mkdir src/sync && cp ./src/test-app/db/schema.ts ./src/sync && cp ./src/test-app/conf/dream.ts ./src/sync'
  )
  console.log('done syncing models!')
}
