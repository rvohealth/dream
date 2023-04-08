import sspawn from '../src/helpers/sspawn'

export default async function addBoilerplate() {
  console.log('copying boilerplate to sync folder...')
  await sspawn('cp ./boilerplate/sync ../src/sync')
  console.log('done!')
}

addBoilerplate()
