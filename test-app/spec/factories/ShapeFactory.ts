import { UpdateableProperties } from '@rvoh/dream'
import Shape from '../../app/models/Shape.js'

let counter = 0

export default async function createShape(attrs: UpdateableProperties<Shape> = {}) {
  return await Shape.create({
    name: `Shape name ${++counter}`,
    type: 'regular',
    ...attrs,
  })
}
