import ViewModelSerializer from '../../../../src/serializer/ViewModelSerializer.js'
import UserViewModel from '../../view-models/UserViewModel.js'

export default (data: UserViewModel, passthroughData: object) =>
  UserSummarySerializer(data, passthroughData)
    .attribute('name', { openapi: ['string', 'null'] })
    .attribute('birthdate', { openapi: ['date', 'null'] })

export const UserSummarySerializer = (data: UserViewModel, passthroughData: object) =>
  ViewModelSerializer(UserViewModel, data, passthroughData)
    .attribute('id', { openapi: 'string' })
    .attribute('favoriteWord', { openapi: ['string', 'null'] })
