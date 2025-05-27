import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import UserViewModel from '../../view-models/UserViewModel.js'

export default (data: UserViewModel) =>
  UserSummarySerializer(data)
    .attribute('name', { openapi: ['string', 'null'] })
    .attribute('birthdate', { openapi: ['date', 'null'] })

export const UserSummarySerializer = (data: UserViewModel) =>
  ObjectSerializer(data)
    .attribute('id', { openapi: 'string' })
    .attribute('favoriteWord', { openapi: ['string', 'null'] })
