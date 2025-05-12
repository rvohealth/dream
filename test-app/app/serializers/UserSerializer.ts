import { DreamModelSerializer } from '../../../src/serializer/index.js'
import User from '../models/User.js'

const UserSerializer = ($data: User, $passthroughData: object) =>
  DreamModelSerializer(User, $data, $passthroughData)
    .attribute('id')
    .attribute('name')
    .attribute('birthdate')
    .rendersOne('userSettings', { optional: true })

export default UserSerializer

export const UserSummarySerializer = ($data: User, $passthroughData: object) =>
  DreamModelSerializer(User, $data, $passthroughData).attribute('id').attribute('favoriteWord')
