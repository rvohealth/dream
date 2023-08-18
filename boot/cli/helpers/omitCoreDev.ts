export default function omitCoreDev(programArgs: string[]) {
  return programArgs.filter(arg => arg !== '--core')
}
