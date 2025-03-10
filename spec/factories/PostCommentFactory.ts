import { UpdateableProperties } from '@rvoh/dream'
import PostComment from '../../../test-app/app/models/PostComment'
import Post from '../../../test-app/app/models/Post'

export default async function createPostComment(
  post: Post,
  overrides: UpdateableProperties<PostComment> = {}
) {
  return await PostComment.create({
    post,
    ...overrides,
  })
}
