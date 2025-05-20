export default function computedPaginatePage(page: number | undefined | null) {
  if (page === null) return 1
  if (page === undefined) return 1
  return page <= 1 ? 1 : Math.floor(page)
}
