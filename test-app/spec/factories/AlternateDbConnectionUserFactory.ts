import { UpdateableProperties } from '../../../src/types/dream.js'
import AlternateDbConnectionUser from '../../app/models/AlternateDbConnectionUser.js'

let counter = 0

export default async function createAlternateDbConnectionUser(
  attrs: UpdateableProperties<AlternateDbConnectionUser> = {}
) {
  return await AlternateDbConnectionUser.create({
    email: `AlternateDbConnectionUser email ${++counter}`,
    name: `AlternateDbConnectionUser name ${counter}`,
    ...attrs,
  })
}
