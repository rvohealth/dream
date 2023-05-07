export default function setCoreDevelopmentFlag(programArgs: string[]) {
  if (programArgs.includes('--core')) {
    process.env.DREAM_CORE_DEVELOPMENT = '1'
    return 'DREAM_CORE_DEVELOPMENT=1 '
  } else {
    return ''
  }
}

export function coreSuffix(programArgs: string[]) {
  return programArgs.includes('--core') ? ' --core' : ''
}
