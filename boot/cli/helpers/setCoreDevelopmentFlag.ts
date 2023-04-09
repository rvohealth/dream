export default function setCoreDevelopmentFlag(programArgs: string[]) {
  if (programArgs.includes('--core')) {
    process.env.CORE_DEVELOPMENT = '1'
    return 'CORE_DEVELOPMENT=1 '
  } else {
    return ''
  }
}
