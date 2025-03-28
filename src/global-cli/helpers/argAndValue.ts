export default function argAndValue(arg: string, args: string[]): [string | null, string | null] {
  const argIndex = args.findIndex(a => a === arg)

  const foundArg = argIndex === -1 ? null : args[argIndex]
  const foundValue = argIndex === -1 ? null : valueOrNull(argIndex, args)

  return [foundArg ?? null, foundValue]
}

function valueOrNull(argIndex: number, args: string[]) {
  const value: string | null | undefined = args[argIndex + 1]
  if (value === undefined || /--/.test(value)) return null
  return value
}
