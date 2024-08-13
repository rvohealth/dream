export default function (a: string, b: string) {
  const maxLength = Math.max(a.length, b.length)
  let lastDelimiterIndex: number = 0

  for (let i = 0; i < maxLength; i++) {
    if (a[i] !== b[i]) return a.slice(0, lastDelimiterIndex)
    if (a[i] === '/') lastDelimiterIndex = i + 1
  }

  return a
}
