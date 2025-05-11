import ObjectSerializer from '../../../../src/serializer/ObjectSerializer.js'
import UserViewModel from '../../view-models/UserViewModel.js'

export default (data: UserViewModel, passthroughData: object) =>
  UserSummarySerializer(data, passthroughData)
    .attribute('name', { openapi: ['string', 'null'] })
    .attribute('birthdate', { openapi: ['date', 'null'] })

export const UserSummarySerializer = (data: UserViewModel, passthroughData: object) =>
  ObjectSerializer(data, passthroughData)
    .attribute('id', { openapi: 'string' })
    .attribute('favoriteWord', { openapi: ['string', 'null'] })
