import snakeify from '../../shared/helpers/snakeify'

export default function hyphenize(str: string) {
  return snakeify(str).replace(/_/g, '-')
}
