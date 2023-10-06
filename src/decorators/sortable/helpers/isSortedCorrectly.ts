export default function isSortedCorrectly(arr: any[], positionField: string) {
  const invalidPositionItem = arr.find((item, index) => item[positionField] !== index + 1)
  return !invalidPositionItem
}
