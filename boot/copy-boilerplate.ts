import sspawn from '../src/helpers/sspawn'

export default async function copyBoilerplate() {
  console.log('copying boilerplate to sync folder...')
  await sspawn('cp ./boot/boilerplate/sync ./src/sync')
  console.log('done!')
}

copyBoilerplate()
