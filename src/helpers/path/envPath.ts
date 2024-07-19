import confPath from './confPath'

export default async function envPath() {
  return await confPath('env')
}
