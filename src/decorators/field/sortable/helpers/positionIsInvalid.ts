export default function positionIsInvalid(position: number | null | undefined) {
  return position === null || position === undefined || position < 1
}
